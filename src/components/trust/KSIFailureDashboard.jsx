/**
 * KSI Failure Dashboard - Enhanced with Date-Centric Drill-Down
 * 
 * FedRAMP 20x Phase 2 failure tracking visualization:
 * - Date-range quick picks (7d / 30d / 90d / All / Custom range)
 * - Failures grouped by date with visual date headers
 * - Click any failure to see full details in a slide-out panel
 * - Searchable/filterable history with category + date controls
 * - Per-KSI statistics with drill-down
 * 
 * Consumes: public/data/ksi_failure_tracker.json
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import {
    AlertCircle, CheckCircle2, Clock, TrendingUp, TrendingDown,
    ChevronDown, ChevronRight, AlertTriangle, Timer, Download,
    Activity, Shield, Zap, Target, AlertOctagon, History,
    ArrowUpRight, ArrowDownRight, GitCommit, Calendar, FileText,
    X, Search, Copy, ArrowRight, Terminal, BookOpen, CalendarDays,
    ChevronLeft, RotateCcw
} from 'lucide-react';

// ============================================
// Theme & Constants
// ============================================
const THEME = {
    card: "bg-[#18181b] border border-white/5 hover:border-blue-500/20 transition-all duration-500 shadow-2xl rounded-xl overflow-hidden",
    cardStatic: "bg-[#18181b] border border-white/5 shadow-2xl rounded-xl overflow-hidden",
    statLabel: "text-[10px] uppercase tracking-[0.2em] font-black text-slate-500",
    chartColors: {
        primary: '#3b82f6', success: '#10b981', warning: '#f59e0b',
        danger: '#ef4444', purple: '#8b5cf6', cyan: '#06b6d4', muted: '#3f3f46'
    }
};

const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
    ? `${import.meta.env.BASE_URL}data`
    : `${import.meta.env.BASE_URL}/data`;
const DATA_URL = `${BASE_PATH}/ksi_failure_tracker.json`;
const KSI_ID_PATTERN = /^KSI-[A-Z]{3}-\d{2}$/;

const KSI_CATEGORIES = {
    'INR': 'Incident Response', 'CNA': 'Cloud Native Architecture',
    'CMT': 'Change Management', 'IAM': 'Identity & Access Management',
    'SVC': 'Service Integrity', 'CED': 'Cybersecurity Education',
    'MLA': 'Monitoring, Logging & Audit', 'PIY': 'Policy & Governance',
    'RPL': 'Resilience & Planning', 'TPR': 'Third-Party Risk',
    'AFR': 'Assurance & FedRAMP Reporting',
};

// ============================================
// Utilities
// ============================================
const isValidKSIId = (ksiId) => ksiId && typeof ksiId === 'string' && KSI_ID_PATTERN.test(ksiId);
const isValidDate = (dateStr) => {
    try { const d = new Date(dateStr); return !isNaN(d.getTime()) && d <= new Date() && d.getFullYear() >= 2020; }
    catch { return false; }
};
const filterValidFailure = (f) => f && isValidKSIId(f.ksi_id) && isValidDate(f.failed_at) && (f.remediated_at ? isValidDate(f.remediated_at) : true);

const formatDateTime = (s) => {
    if (!s) return 'N/A';
    return new Date(s).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit', timeZoneName:'short' });
};
const formatDateShort = (s) => s ? new Date(s).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : 'N/A';
const formatDateGroupKey = (s) => {
    if (!s) return 'Unknown';
    const d = new Date(s);
    return d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
};
const formatDateISO = (s) => {
    if (!s) return '';
    return new Date(s).toISOString().split('T')[0];
};
const getHoursAgo = (s) => Math.round((Date.now() - new Date(s)) / 3600000);
const getDaysAgo = (s) => Math.round((Date.now() - new Date(s)) / 86400000);
const getSeverity = (h) => h > 24 ? 'critical' : h > 8 ? 'warning' : 'info';
const getCategoryFromKSI = (id) => id?.split('-')?.[1] || null;
const getCategoryName = (id) => KSI_CATEGORIES[getCategoryFromKSI(id)] || getCategoryFromKSI(id) || 'Unknown';
const copyToClipboard = (t) => navigator.clipboard?.writeText(t);

const getSeverityConfig = (sev) => ({
    critical: { border:'border-red-500/50', bg:'bg-red-500/10', iconBg:'bg-red-500/20', text:'text-red-400', badge:'bg-red-500/20 text-red-300 border-red-500/30' },
    warning:  { border:'border-amber-500/50', bg:'bg-amber-500/10', iconBg:'bg-amber-500/20', text:'text-amber-400', badge:'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    info:     { border:'border-blue-500/50', bg:'bg-blue-500/10', iconBg:'bg-blue-500/20', text:'text-blue-400', badge:'bg-blue-500/20 text-blue-300 border-blue-500/30' },
}[sev]);

const getMttrColor = (h) => {
    if (h < 4)  return { text:'text-emerald-400', bg:'bg-emerald-500/10', bar:'bg-emerald-500', label:'Excellent' };
    if (h < 12) return { text:'text-blue-400', bg:'bg-blue-500/10', bar:'bg-blue-500', label:'Good' };
    if (h < 24) return { text:'text-amber-400', bg:'bg-amber-500/10', bar:'bg-amber-500', label:'Needs Improvement' };
    return { text:'text-red-400', bg:'bg-red-500/10', bar:'bg-red-500', label:'Critical' };
};

const daysAgoDate = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d;
};

// ============================================
// Detail Drawer
// ============================================
const DetailDrawer = ({ failure, isActive, onClose, allHistory }) => {
    useEffect(() => {
        const h = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [onClose]);

    if (!failure) return null;

    const hoursActive = isActive ? getHoursAgo(failure.failed_at) : null;
    const severity = isActive ? getSeverity(hoursActive) : null;
    const sc = severity ? getSeverityConfig(severity) : null;
    const mttr = failure.duration_hours ? getMttrColor(failure.duration_hours) : null;
    const category = getCategoryFromKSI(failure.ksi_id);
    const categoryName = getCategoryName(failure.ksi_id);
    const related = (allHistory || []).filter(h => h.ksi_id === failure.ksi_id && h !== failure);
    const reasonParts = failure.reason?.split(';').map(s => s.trim()).filter(Boolean) || [];
    const hasMultiReason = reasonParts.length > 1;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
            <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-[#0e0e10] border-l border-white/10 z-50 overflow-y-auto shadow-2xl" style={{ animation: 'drawerSlide 0.25s ease-out' }}>
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 backdrop-blur-xl bg-[#0e0e10]/90 border-b border-white/5">
                    <div className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-3">
                            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-lg font-black text-white">{failure.ksi_id}</span>
                                    {isActive && sc && <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${sc.badge}`}>{severity}</span>}
                                    {!isActive && <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Remediated</span>}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{categoryName}</div>
                            </div>
                        </div>
                        {isActive && hoursActive !== null && (
                            <div className="text-right">
                                <div className={`text-2xl font-black ${sc?.text}`}>{hoursActive}h</div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wider">Active</div>
                            </div>
                        )}
                        {!isActive && failure.duration_hours && (
                            <div className="text-right">
                                <div className={`text-2xl font-black ${mttr?.text}`}>{failure.duration_hours}h</div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wider">MTTR</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 space-y-5">
                    {/* FedRAMP Requirement */}
                    {failure.requirement && (
                        <section className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2"><BookOpen size={12} className="text-indigo-400" /><span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">FedRAMP Requirement</span></div>
                            <p className="text-sm text-slate-300 leading-relaxed">{failure.requirement}</p>
                        </section>
                    )}

                    {/* Full Failure Reason */}
                    <section className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2"><AlertCircle size={12} className="text-red-400" /><span className="text-[10px] font-black text-red-400 uppercase tracking-wider">Failure Reason</span></div>
                            <button onClick={() => copyToClipboard(failure.reason)} className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-white transition-colors" title="Copy"><Copy size={12} /></button>
                        </div>
                        {hasMultiReason ? (
                            <div className="space-y-2">
                                {reasonParts.map((part, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <span className={`mt-1 text-xs ${i === 0 ? 'text-red-400' : 'text-slate-600'}`}>{i === 0 ? '▸' : '•'}</span>
                                        <span className={`text-sm leading-relaxed ${i === 0 ? 'text-slate-200' : 'text-slate-400'}`}>{part}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                                <pre className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono break-all">{failure.reason || 'No reason provided'}</pre>
                            </div>
                        )}
                        {failure.reason?.includes('CLI command failed:') && (
                            <div className="mt-3">
                                <div className="flex items-center gap-1.5 mb-1.5"><Terminal size={10} className="text-slate-500" /><span className="text-[9px] text-slate-500 uppercase tracking-wider">Raw CLI Output</span></div>
                                <div className="bg-black rounded-lg p-3 border border-white/10 overflow-x-auto">
                                    <pre className="text-xs text-red-300/80 font-mono whitespace-pre-wrap break-all leading-relaxed">{failure.reason.replace('CLI command failed: ', '')}</pre>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Timestamps */}
                    <section className="grid grid-cols-2 gap-3">
                        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                            <div className="flex items-center gap-1.5 mb-2"><AlertCircle size={10} className="text-red-400/70" /><span className="text-[9px] text-red-400/70 uppercase tracking-wider font-black">Failed At</span></div>
                            <div className="text-sm text-slate-300 font-mono leading-relaxed">{formatDateTime(failure.failed_at)}</div>
                        </div>
                        {failure.remediated_at ? (
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                                <div className="flex items-center gap-1.5 mb-2"><CheckCircle2 size={10} className="text-emerald-400/70" /><span className="text-[9px] text-emerald-400/70 uppercase tracking-wider font-black">Remediated At</span></div>
                                <div className="text-sm text-slate-300 font-mono leading-relaxed">{formatDateTime(failure.remediated_at)}</div>
                            </div>
                        ) : (
                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
                                <div className="flex items-center gap-1.5 mb-2"><Clock size={10} className="text-amber-400/70" /><span className="text-[9px] text-amber-400/70 uppercase tracking-wider font-black">Status</span></div>
                                <div className="text-sm text-amber-300 font-bold">Awaiting Remediation</div>
                            </div>
                        )}
                    </section>

                    {/* Commits */}
                    <section className="bg-[#1a1a1f] border border-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3"><GitCommit size={12} className="text-slate-400" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Commit Details</span></div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Failed Commit</span>
                                <div className="flex items-center gap-2">
                                    <code className="text-xs font-mono text-red-300 bg-red-500/10 px-2 py-0.5 rounded">{failure.failed_commit?.slice(0,12) || 'N/A'}</code>
                                    {failure.failed_commit && <button onClick={() => copyToClipboard(failure.failed_commit)} className="p-1 rounded hover:bg-white/5 text-slate-600 hover:text-white transition-colors" title="Copy full SHA"><Copy size={10} /></button>}
                                </div>
                            </div>
                            {failure.remediation_commit && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Remediation Commit</span>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">{failure.remediation_commit.slice(0,12)}</code>
                                        <button onClick={() => copyToClipboard(failure.remediation_commit)} className="p-1 rounded hover:bg-white/5 text-slate-600 hover:text-white transition-colors" title="Copy full SHA"><Copy size={10} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Score & Resources */}
                    <section className="grid grid-cols-3 gap-3">
                        <div className="bg-[#1a1a1f] border border-white/5 rounded-xl p-4 text-center">
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Score</div>
                            <div className={`text-2xl font-black ${failure.score === 0 ? 'text-red-400' : failure.score < 50 ? 'text-amber-400' : 'text-emerald-400'}`}>{failure.score ?? 'N/A'}{failure.score != null && <span className="text-sm">%</span>}</div>
                        </div>
                        <div className="bg-[#1a1a1f] border border-white/5 rounded-xl p-4 text-center">
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Resources Failed</div>
                            <div className="text-2xl font-black text-white">{failure.resources_failed ?? 0}</div>
                        </div>
                        <div className="bg-[#1a1a1f] border border-white/5 rounded-xl p-4 text-center">
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Category</div>
                            <div className="text-lg font-black text-white font-mono">{category || '—'}</div>
                        </div>
                    </section>

                    {/* MTTR Performance Bar */}
                    {failure.duration_hours && mttr && (
                        <section className={`${mttr.bg} border border-white/5 rounded-xl p-4`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2"><Timer size={12} className={mttr.text} /><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Remediation Performance</span></div>
                                <span className={`text-[10px] font-black uppercase ${mttr.text}`}>{mttr.label}</span>
                            </div>
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                <div className={`h-full ${mttr.bar} rounded-full transition-all duration-1000`} style={{ width: `${Math.min((failure.duration_hours / 48) * 100, 100)}%` }} />
                            </div>
                            <div className="flex justify-between mt-1 text-[9px] text-slate-600"><span>0h</span><span>12h</span><span>24h</span><span>48h+</span></div>
                        </section>
                    )}

                    {/* Related History */}
                    {related.length > 0 && (
                        <section className="bg-[#1a1a1f] border border-white/5 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                                <History size={12} className="text-slate-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Other Failures for {failure.ksi_id}</span>
                                <span className="text-[10px] text-slate-600 ml-auto">{related.length} records</span>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {related.slice(0, 10).map((h, i) => (
                                    <div key={i} className="px-4 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-400">{formatDateShort(h.remediated_at || h.failed_at)}</span>
                                            <span className={`text-xs font-mono font-bold ${getMttrColor(h.duration_hours)?.text || 'text-slate-400'}`}>{h.duration_hours ? `${h.duration_hours}h` : 'Active'}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{h.reason || 'No reason'}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
            <style>{`@keyframes drawerSlide { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        </>
    );
};

// ============================================
// Stat Card
// ============================================
const StatCard = ({ label, value, icon: Icon, color, trend, trendValue, subtitle }) => (
    <div className={THEME.card + " p-6 group relative overflow-hidden"}>
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none"><Icon size={80} /></div>
        <div className="flex justify-between items-start relative z-10">
            <div>
                <span className={THEME.statLabel}>{label}</span>
                <div className="text-4xl font-black text-white tracking-tighter mt-2 group-hover:text-blue-400 transition-colors">{value}</div>
                {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
                {trend && <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>{trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{trendValue}</div>}
            </div>
            <div className={`p-3 rounded-xl bg-black/40 border border-white/5 ${color} shadow-inner`}><Icon size={20} /></div>
        </div>
    </div>
);

// ============================================
// Active Failure Card (clickable)
// ============================================
const ActiveFailureCard = ({ failure, onClick }) => {
    const hours = useMemo(() => getHoursAgo(failure.failed_at), [failure.failed_at]);
    const sev = getSeverity(hours);
    const c = getSeverityConfig(sev);
    return (
        <div className={`rounded-xl border ${c.border} ${c.bg} shadow-lg transition-all cursor-pointer hover:scale-[1.01] hover:shadow-xl group`} onClick={() => onClick(failure)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick(failure)}>
            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${c.iconBg}`}><AlertOctagon size={18} className={c.text} /></div>
                        <div>
                            <span className="font-mono text-base font-bold text-white">{failure.ksi_id}</span>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{getCategoryName(failure.ksi_id)}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-lg font-black ${c.text}`}>{hours}h</div>
                        <div className="text-[10px] text-slate-500 uppercase">Active</div>
                    </div>
                </div>
                <div className="bg-black/30 rounded-lg p-3 border border-white/5 mb-3">
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1"><AlertCircle size={9} /> Failure Reason</div>
                    <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">{failure.reason || 'No reason provided'}</p>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Target size={10} /> Score: <span className="text-white font-mono">{failure.score}%</span></span>
                        <span className="flex items-center gap-1"><GitCommit size={10} /> <span className="text-slate-400 font-mono">{failure.failed_commit?.slice(0,8)}</span></span>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">View details <ArrowRight size={10} /></span>
                </div>
            </div>
        </div>
    );
};

// ============================================
// Date-Grouped History Row (clickable)
// ============================================
const HistoryRow = ({ failure, onClick }) => {
    const m = getMttrColor(failure.duration_hours);
    return (
        <div className="group px-5 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer flex items-center gap-4" onClick={() => onClick(failure)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick(failure)}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.bar}`} />
            <span className="font-mono text-sm font-bold text-white w-28 flex-shrink-0 group-hover:text-blue-400 transition-colors">{failure.ksi_id}</span>
            <span className="text-[10px] text-slate-600 w-14 flex-shrink-0">
                {new Date(failure.remediated_at || failure.failed_at).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
            </span>
            <span className="text-xs text-slate-400 flex-1 line-clamp-1 min-w-0">{failure.reason || 'No reason provided'}</span>
            <span className={`text-xs font-mono font-bold w-16 text-right flex-shrink-0 ${m.text}`}>{failure.duration_hours}h</span>
            <ArrowRight size={12} className="text-slate-700 group-hover:text-blue-400 transition-colors flex-shrink-0" />
        </div>
    );
};

// ============================================
// Date Group Header
// ============================================
const DateGroupHeader = ({ dateLabel, count, avgMttr }) => (
    <div className="sticky top-0 z-[5] px-5 py-2.5 bg-[#111113] border-b border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <CalendarDays size={12} className="text-blue-400" />
            <span className="text-xs font-black text-white">{dateLabel}</span>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-500">{count} failure{count !== 1 ? 's' : ''}</span>
            {avgMttr !== null && <span className={`text-[10px] font-mono font-bold ${avgMttr < 4 ? 'text-emerald-400' : avgMttr < 24 ? 'text-amber-400' : 'text-red-400'}`}>avg {avgMttr.toFixed(1)}h</span>}
        </div>
    </div>
);

// ============================================
// Date Range Quick Picker
// ============================================
const DateRangePicker = ({ activeRange, onRangeChange, customFrom, customTo, onCustomFromChange, onCustomToChange }) => {
    const ranges = [
        { key: '7d', label: '7 Days' },
        { key: '30d', label: '30 Days' },
        { key: '90d', label: '90 Days' },
        { key: 'all', label: 'All Time' },
        { key: 'custom', label: 'Custom' },
    ];

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {ranges.map(r => (
                <button
                    key={r.key}
                    onClick={() => onRangeChange(r.key)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                        activeRange === r.key
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : 'bg-black/30 text-slate-500 border-white/5 hover:text-white hover:border-white/10'
                    }`}
                >
                    {r.label}
                </button>
            ))}
            {activeRange === 'custom' && (
                <div className="flex items-center gap-2 ml-2">
                    <input
                        type="date"
                        value={customFrom}
                        onChange={(e) => onCustomFromChange(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                    />
                    <span className="text-slate-600 text-xs">→</span>
                    <input
                        type="date"
                        value={customTo}
                        onChange={(e) => onCustomToChange(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                    />
                </div>
            )}
        </div>
    );
};

// ============================================
// KSI Stats Bar (clickable)
// ============================================
const KSIStatsBar = ({ ksiId, stats, maxFailures, onClick }) => {
    const barW = maxFailures > 0 ? (stats.total_failures / maxFailures) * 100 : 0;
    const mc = stats.mttr_hours < 4 ? 'bg-emerald-500' : stats.mttr_hours < 24 ? 'bg-amber-500' : 'bg-red-500';
    return (
        <div className="group px-4 py-3 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0 cursor-pointer" onClick={() => onClick(ksiId)} role="button" tabIndex={0}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{ksiId}</span>
                    <span className="text-[10px] text-slate-600">{getCategoryName(ksiId)}</span>
                </div>
                <div className="flex items-center gap-6 text-xs">
                    <span className="text-slate-500 font-mono">{stats.total_failures} failure{stats.total_failures !== 1 ? 's' : ''}</span>
                    <span className={`font-bold ${stats.mttr_hours < 4 ? 'text-emerald-400' : stats.mttr_hours < 24 ? 'text-amber-400' : 'text-red-400'}`}>{stats.mttr_hours ? `${stats.mttr_hours.toFixed(1)}h` : '—'}</span>
                </div>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden"><div className={`h-full ${mc} transition-all duration-500`} style={{ width: `${barW}%` }} /></div>
        </div>
    );
};

// ============================================
// Custom Tooltip
// ============================================
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div className="bg-[#0c0c0e] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-2 border-b border-white/5 pb-2">{label}</p>
                <div className="space-y-1">
                    {payload.map((e, i) => (
                        <div key={i} className="flex justify-between items-center gap-6">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} /><span className="text-xs text-slate-300">{e.name}</span></div>
                            <span className="text-xs font-mono font-bold text-white">{e.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

// ============================================
// Main Component
// ============================================
const KSIFailureDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFailure, setSelectedFailure] = useState(null);
    const [selectedIsActive, setSelectedIsActive] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    useEffect(() => {
        fetch(DATA_URL)
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
            .then(raw => {
                setData({
                    ...raw,
                    active_failures: Object.fromEntries(Object.entries(raw.active_failures || {}).filter(([_, f]) => filterValidFailure(f))),
                    failure_history: (raw.failure_history || []).filter(filterValidFailure),
                    ksi_stats: Object.fromEntries(Object.entries(raw.ksi_stats || {}).filter(([k]) => isValidKSIId(k))),
                });
                setLoading(false);
            })
            .catch(err => { setError(err.message); setLoading(false); });
    }, []);

    const openDrawer = useCallback((f, active) => { setSelectedFailure(f); setSelectedIsActive(active); }, []);
    const closeDrawer = useCallback(() => { setSelectedFailure(null); setSelectedIsActive(false); }, []);

    const stats = useMemo(() => {
        if (!data) return null;
        const hist = data.failure_history || [];
        const durations = hist.map(h => h.duration_hours).filter(Boolean);
        const activeCount = Object.keys(data.active_failures || {}).length;

        const byMonth = hist.reduce((a, f) => { const m = new Date(f.remediated_at).toLocaleDateString('en-US',{month:'short',year:'numeric'}); a[m]=(a[m]||0)+1; return a; }, {});
        const monthlyData = Object.entries(byMonth).map(([month,count]) => ({month,failures:count})).sort((a,b) => new Date(a.month)-new Date(b.month)).slice(-6);

        const byCategory = hist.reduce((a, f) => { const c = f.ksi_id.split('-')[1]; a[c]=(a[c]||0)+1; return a; }, {});
        const categoryData = Object.entries(byCategory).map(([name,value]) => ({name,value})).sort((a,b) => b.value-a.value).slice(0,6);

        const mttrTrend = hist.slice(-10).map((f,i) => ({ index:i+1, mttr:f.duration_hours||0, ksi:f.ksi_id }));
        const avgMttr = durations.length ? durations.reduce((a,b)=>a+b,0)/durations.length : 0;

        const recent = durations.slice(-5), older = durations.slice(-10,-5);
        const mttrDir = recent.length && older.length ? (recent.reduce((a,b)=>a+b,0)/recent.length) < (older.reduce((a,b)=>a+b,0)/older.length) ? 'improving':'degrading' : null;
        const allCategories = [...new Set(hist.map(f => getCategoryFromKSI(f.ksi_id)).filter(Boolean))].sort();

        return { activeCount, totalFailures:hist.length, avgMttr:avgMttr.toFixed(1), runsProcessed:data.metadata?.total_runs_processed||0, monthlyData, categoryData, mttrTrend, mttrTrendDirection:mttrDir, uniqueKsis:Object.keys(data.ksi_stats||{}).length, allCategories };
    }, [data]);

    // Filtered + date-ranged history
    const filteredHistory = useMemo(() => {
        if (!data) return [];
        let h = (data.failure_history || []).slice().reverse();

        // Date range filter
        if (dateRange !== 'all') {
            let cutoff;
            if (dateRange === '7d') cutoff = daysAgoDate(7);
            else if (dateRange === '30d') cutoff = daysAgoDate(30);
            else if (dateRange === '90d') cutoff = daysAgoDate(90);
            else if (dateRange === 'custom' && customFrom) cutoff = new Date(customFrom);

            if (cutoff) h = h.filter(f => new Date(f.remediated_at || f.failed_at) >= cutoff);

            if (dateRange === 'custom' && customTo) {
                const end = new Date(customTo);
                end.setHours(23, 59, 59, 999);
                h = h.filter(f => new Date(f.remediated_at || f.failed_at) <= end);
            }
        }

        // Text search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            h = h.filter(f =>
                f.ksi_id?.toLowerCase().includes(q) ||
                f.reason?.toLowerCase().includes(q) ||
                f.requirement?.toLowerCase().includes(q) ||
                f.failed_commit?.toLowerCase().includes(q)
            );
        }

        // Category filter
        if (filterCategory !== 'all') {
            h = h.filter(f => getCategoryFromKSI(f.ksi_id) === filterCategory);
        }

        return h;
    }, [data, searchQuery, filterCategory, dateRange, customFrom, customTo]);

    // Group filtered history by date
    const groupedHistory = useMemo(() => {
        const groups = [];
        let currentKey = null;
        let currentGroup = null;

        for (const f of filteredHistory) {
            const dateKey = formatDateISO(f.remediated_at || f.failed_at);
            if (dateKey !== currentKey) {
                if (currentGroup) groups.push(currentGroup);
                currentKey = dateKey;
                currentGroup = {
                    dateKey,
                    dateLabel: formatDateGroupKey(f.remediated_at || f.failed_at),
                    failures: [],
                };
            }
            currentGroup.failures.push(f);
        }
        if (currentGroup) groups.push(currentGroup);

        return groups;
    }, [filteredHistory]);

    // Summary for date range
    const rangeSummary = useMemo(() => {
        if (!filteredHistory.length) return null;
        const durations = filteredHistory.map(f => f.duration_hours).filter(Boolean);
        return {
            count: filteredHistory.length,
            avgMttr: durations.length ? durations.reduce((a,b)=>a+b,0)/durations.length : 0,
            uniqueKsis: new Set(filteredHistory.map(f => f.ksi_id)).size,
            days: groupedHistory.length,
        };
    }, [filteredHistory, groupedHistory]);

    const hasActiveFilters = searchQuery || filterCategory !== 'all' || dateRange !== 'all';
    const clearAllFilters = () => { setSearchQuery(''); setFilterCategory('all'); setDateRange('all'); setCustomFrom(''); setCustomTo(''); };

    if (loading) return (<div className="flex items-center justify-center py-24"><div className="text-center"><div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" /><div className="text-slate-500 text-sm">Loading failure data...</div></div></div>);
    if (error || !data) return (<div className={THEME.card+" p-12 text-center max-w-lg mx-auto"}><div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6"><AlertTriangle size={28} className="text-amber-500" /></div><h3 className="text-xl font-bold text-white mb-2">Failure Tracking Unavailable</h3><p className="text-sm text-slate-500 mb-4">Ensure ksi_failure_tracker.json is synced to public/data/</p>{error && <code className="text-xs text-red-400 font-mono bg-red-500/10 px-3 py-2 rounded-lg inline-block">{error}</code>}</div>);

    const activeFailures = Object.values(data.active_failures || {});
    const history = (data.failure_history || []).slice().reverse();
    const ksiStats = Object.entries(data.ksi_stats || {});
    const maxFailures = Math.max(...ksiStats.map(([_,s]) => s.total_failures||0), 1);
    const catColors = [THEME.chartColors.primary, THEME.chartColors.success, THEME.chartColors.warning, THEME.chartColors.purple, THEME.chartColors.cyan, THEME.chartColors.danger];

    return (
        <div className="space-y-8">
            {selectedFailure && <DetailDrawer failure={selectedFailure} isActive={selectedIsActive} onClose={closeDrawer} allHistory={history} />}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20"><History size={20} className="text-blue-400" /></div>
                        <h1 className="text-2xl font-black text-white tracking-tight">KSI Failure Tracking</h1>
                    </div>
                    <p className="text-sm text-slate-500">FedRAMP 20x Phase 2 • {stats.runsProcessed.toLocaleString()} runs since {data.metadata?.backfill_since || 'N/A'} <span className="text-slate-600 ml-2">• Click any failure for details</span></p>
                </div>
                <div className="flex items-center gap-2">
                    {stats.activeCount === 0
                        ? <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"><CheckCircle2 size={16} className="text-emerald-400" /><span className="text-sm font-bold text-emerald-400">No failures to report</span></div>
                        : <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 animate-pulse"><AlertCircle size={16} className="text-red-400" /><span className="text-sm font-bold text-red-400">{stats.activeCount} Active</span></div>
                    }
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Active Failures" value={stats.activeCount} icon={AlertOctagon} color={stats.activeCount===0?'text-emerald-400':'text-red-400'} subtitle={stats.activeCount===0?'All systems nominal':'Requires attention'} />
                <StatCard label="Total Failures" value={stats.totalFailures} icon={Activity} color="text-blue-400" subtitle={`${stats.uniqueKsis} unique KSIs affected`} />
                <StatCard label="Avg MTTR" value={`${stats.avgMttr}h`} icon={Timer} color={parseFloat(stats.avgMttr)<12?'text-emerald-400':'text-amber-400'} trend={stats.mttrTrendDirection==='improving'?'up':stats.mttrTrendDirection==='degrading'?'down':null} trendValue={stats.mttrTrendDirection==='improving'?'Improving':'Needs focus'} subtitle="Mean time to remediate" />
                <StatCard label="Pipeline Runs" value={stats.runsProcessed.toLocaleString()} icon={Zap} color="text-purple-400" subtitle="Total validations analyzed" />
            </div>

            {/* Active Failures */}
            {activeFailures.length > 0 && (
                <div className={THEME.cardStatic+" p-6"}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-red-500/20"><AlertOctagon size={18} className="text-red-400" /></div>
                        <div><h2 className="text-sm font-black text-white uppercase tracking-wider">Active Failures Requiring Remediation</h2><p className="text-xs text-slate-500">Click a card for full details, CLI output, and commit info</p></div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {activeFailures.map((f,i) => <ActiveFailureCard key={i} failure={f} onClick={(failure) => openDrawer(failure, true)} />)}
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={THEME.card+" p-6"}>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2"><TrendingUp size={14} className="text-blue-400" /> Failure Trend (Last 6 Months)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={stats.monthlyData}>
                            <defs><linearGradient id="colorFailures" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={THEME.chartColors.primary} stopOpacity={0.3} /><stop offset="95%" stopColor={THEME.chartColors.primary} stopOpacity={0} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                            <XAxis dataKey="month" tick={{fontSize:10,fill:'#64748b'}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fontSize:10,fill:'#64748b'}} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="failures" stroke={THEME.chartColors.primary} fill="url(#colorFailures)" strokeWidth={2} name="Failures" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className={THEME.card+" p-6"}>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Shield size={14} className="text-purple-400" /> Failures by Category</h3>
                    <div className="flex items-center gap-8">
                        <ResponsiveContainer width="50%" height={200}>
                            <PieChart><Pie data={stats.categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">{stats.categoryData.map((_,i) => <Cell key={i} fill={catColors[i%catColors.length]} stroke="none" />)}</Pie><Tooltip content={<CustomTooltip />} /></PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-2">
                            {stats.categoryData.map((cat,i) => (
                                <div key={cat.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor:catColors[i%catColors.length]}} /><span className="text-slate-400 font-mono">KSI-{cat.name}</span><span className="text-[10px] text-slate-600 hidden md:inline">{KSI_CATEGORIES[cat.name]||''}</span></div>
                                    <span className="text-white font-bold">{cat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* MTTR Chart */}
            {stats.mttrTrend.length > 0 && (
                <div className={THEME.card+" p-6"}>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Timer size={14} className="text-emerald-400" /> Recent MTTR Performance (Hours)</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={stats.mttrTrend} barSize={32}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                            <XAxis dataKey="ksi" tick={{fontSize:9,fill:'#64748b'}} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
                            <YAxis tick={{fontSize:10,fill:'#64748b'}} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="mttr" name="MTTR (hours)" radius={[4,4,0,0]}>{stats.mttrTrend.map((e,i) => <Cell key={i} fill={e.mttr<4?THEME.chartColors.success:e.mttr<24?THEME.chartColors.warning:THEME.chartColors.danger} />)}</Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* ==========================================
                DATE-CENTRIC FAILURE HISTORY
               ========================================== */}
            <div className={THEME.cardStatic} data-history-table>
                {/* Header with date range + search + filters */}
                <div className="px-6 py-4 border-b border-white/5 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><CalendarDays size={14} className="text-cyan-400" /> Failure Timeline</h3>
                            <p className="text-[10px] text-slate-500 mt-1">Browse by date range • Click any failure to inspect details</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search KSI, reason, commit..." className="bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 w-52" />
                            </div>
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer">
                                <option value="all">All Categories</option>
                                {(stats.allCategories||[]).map(c => <option key={c} value={c}>KSI-{c}</option>)}
                            </select>
                            {hasActiveFilters && (
                                <button onClick={clearAllFilters} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-slate-400 hover:text-white bg-black/30 border border-white/5 hover:border-white/10 transition-all">
                                    <RotateCcw size={10} /> Reset
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Date Range Picker */}
                    <DateRangePicker
                        activeRange={dateRange}
                        onRangeChange={setDateRange}
                        customFrom={customFrom}
                        customTo={customTo}
                        onCustomFromChange={setCustomFrom}
                        onCustomToChange={setCustomTo}
                    />
                </div>

                {/* Range Summary Bar */}
                {rangeSummary && (
                    <div className="px-5 py-2.5 border-b border-white/5 bg-blue-500/5 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-4 text-[10px]">
                            <span className="text-blue-300 font-bold">{rangeSummary.count} failures</span>
                            <span className="text-slate-500">across {rangeSummary.days} day{rangeSummary.days !== 1 ? 's' : ''}</span>
                            <span className="text-slate-500">{rangeSummary.uniqueKsis} unique KSIs</span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold ${rangeSummary.avgMttr < 4 ? 'text-emerald-400' : rangeSummary.avgMttr < 24 ? 'text-amber-400' : 'text-red-400'}`}>
                            Avg MTTR: {rangeSummary.avgMttr.toFixed(1)}h
                        </span>
                    </div>
                )}

                {/* Column Headers */}
                <div className="px-5 py-2 border-b border-white/5 flex items-center gap-4 text-[9px] text-slate-600 uppercase tracking-wider font-black">
                    <span className="w-2" /><span className="w-28">KSI</span><span className="w-14">Time</span><span className="flex-1">Reason</span><span className="w-16 text-right">MTTR</span><span className="w-3" />
                </div>

                {/* Date-Grouped Rows */}
                <div className="max-h-[600px] overflow-y-auto">
                    {groupedHistory.length > 0 ? (
                        groupedHistory.map((group) => {
                            const durations = group.failures.map(f => f.duration_hours).filter(Boolean);
                            const avgMttr = durations.length ? durations.reduce((a,b)=>a+b,0)/durations.length : null;
                            return (
                                <div key={group.dateKey}>
                                    <DateGroupHeader dateLabel={group.dateLabel} count={group.failures.length} avgMttr={avgMttr} />
                                    <div className="divide-y divide-white/[0.03]">
                                        {group.failures.map((f, i) => (
                                            <HistoryRow key={i} failure={f} onClick={(failure) => openDrawer(failure, false)} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-16 text-slate-500">
                            <CalendarDays size={28} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm mb-1">No failures in this time range</p>
                            <p className="text-[10px] text-slate-600">Try expanding the date range or clearing filters</p>
                            {hasActiveFilters && <button onClick={clearAllFilters} className="text-xs text-blue-400 hover:text-blue-300 mt-3 font-bold">Reset all filters</button>}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                        {filteredHistory.length} failure{filteredHistory.length !== 1 ? 's' : ''}
                        {hasActiveFilters && ` (filtered from ${history.length} total)`}
                    </span>
                    <span>{history.length} total remediations all time</span>
                </div>
            </div>

            {/* Per-KSI Stats */}
            {ksiStats.length > 0 && (
                <div className={THEME.cardStatic}>
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                        <div><h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><Target size={14} className="text-amber-400" /> Per-KSI Statistics</h3><p className="text-[10px] text-slate-500 mt-1">Click a KSI to filter the timeline above</p></div>
                        <span className="text-xs text-slate-500">{ksiStats.length} KSIs with failures</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                        {ksiStats.sort((a,b) => (b[1].total_failures||0)-(a[1].total_failures||0)).map(([id,s]) => (
                            <KSIStatsBar key={id} ksiId={id} stats={s} maxFailures={maxFailures} onClick={(ksiId) => { setSearchQuery(ksiId); setFilterCategory('all'); document.querySelector('[data-history-table]')?.scrollIntoView({behavior:'smooth'}); }} />
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="flex flex-col md:flex-row justify-between items-center bg-[#18181b] p-6 rounded-xl border border-white/5 gap-4 shadow-inner">
                <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">
                    <div>Archive: <span className="text-white ml-2">ksi_failure_tracker.json</span></div>
                    <div>Runs: <span className="text-emerald-400 ml-2">{stats.runsProcessed.toLocaleString()}</span></div>
                    <div>Since: <span className="text-blue-400 ml-2">{data.metadata?.backfill_since||'N/A'}</span></div>
                    <div>Status: <span className="text-emerald-400 ml-2">Live</span></div>
                </div>
                <a href={DATA_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-white/5 text-slate-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-lg"><Download size={12} /> Download Raw Archive</a>
            </footer>
        </div>
    );
};

export { KSIFailureDashboard };
export default KSIFailureDashboard;
