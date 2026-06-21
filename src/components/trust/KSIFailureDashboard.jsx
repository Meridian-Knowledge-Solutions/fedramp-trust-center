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
        primary: '#818CF8', success: '#34E0C4', warning: '#F2B85C',
        danger: '#F2607A', purple: '#A78BFA', cyan: '#34E0C4', muted: '#424E5C'
    }
};

import { BASE_PATH } from '../../config/theme';
const DATA_URL = `${BASE_PATH}ksi_failure_tracker.json`;
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
    if (h < 4)  return { text:'text-emerald-400', bg:'bg-emerald-500/10', bar:'bg-emerald-500', label:'Excellent', var:'var(--signal)' };
    if (h < 12) return { text:'text-blue-400', bg:'bg-blue-500/10', bar:'bg-blue-500', label:'Good', var:'var(--indigo)' };
    if (h < 24) return { text:'text-amber-400', bg:'bg-amber-500/10', bar:'bg-amber-500', label:'Needs Improvement', var:'var(--amber)' };
    return { text:'text-red-400', bg:'bg-red-500/10', bar:'bg-red-500', label:'Critical', var:'var(--red)' };
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
            <div style={{ position: 'fixed', inset: 0, background: '#07090CCC', backdropFilter: 'blur(4px)', zIndex: 40 }} onClick={onClose} />
            <div className="panel" style={{ position: 'fixed', top: 0, right: 0, height: '100%', width: '100%', maxWidth: '40rem', zIndex: 50, overflowY: 'auto', borderRadius: 0, borderLeft: '1px solid var(--line)', animation: 'drawerSlide 0.25s ease-out' }}>
                {/* Sticky Header */}
                <div className="ph" style={{ position: 'sticky', top: 0, zIndex: 10, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={onClose} className="badge" style={{ cursor: 'pointer', border: '1px solid var(--line)' }}><X size={16} /></button>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span className="mono" style={{ fontSize: 17, fontWeight: 600, color: 'var(--indigo)' }}>{failure.ksi_id}</span>
                                {isActive && sc && <span className="tag warn">{severity}</span>}
                                {!isActive && <span className="tag ok">RESOLVED</span>}
                            </div>
                            <div className="mono" style={{ fontSize: 11, color: 'var(--ash)', marginTop: 3 }}>{categoryName}</div>
                        </div>
                    </div>
                    {isActive && hoursActive !== null && (
                        <div style={{ textAlign: 'right' }}>
                            <div className="mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--amber)' }}>{hoursActive}h</div>
                            <div className="mono" style={{ fontSize: 9, color: 'var(--ash)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Active</div>
                        </div>
                    )}
                    {!isActive && failure.duration_hours && (
                        <div style={{ textAlign: 'right' }}>
                            <div className="mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--signal)' }}>{failure.duration_hours}h</div>
                            <div className="mono" style={{ fontSize: 9, color: 'var(--ash)', letterSpacing: '.05em', textTransform: 'uppercase' }}>MTTR</div>
                        </div>
                    )}
                </div>

                <div className="stack" style={{ padding: 20 }}>
                    {/* FedRAMP Requirement */}
                    {failure.requirement && (
                        <section className="kpi" style={{ borderColor: '#818CF833' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><BookOpen size={12} className="text-indigo-400" style={{ color: 'var(--indigo)' }} /><span className="mono" style={{ fontSize: 10, color: 'var(--indigo)', letterSpacing: '.05em', textTransform: 'uppercase' }}>FedRAMP Requirement</span></div>
                            <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.6 }}>{failure.requirement}</p>
                        </section>
                    )}

                    {/* Full Failure Reason */}
                    <section className="kpi" style={{ borderColor: '#F2607A33' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={12} style={{ color: 'var(--red)' }} /><span className="mono" style={{ fontSize: 10, color: 'var(--red)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Failure Reason</span></div>
                            <button onClick={() => copyToClipboard(failure.reason)} className="badge" style={{ cursor: 'pointer' }} title="Copy"><Copy size={12} /></button>
                        </div>
                        {hasMultiReason ? (
                            <div className="stack" style={{ gap: 8 }}>
                                {reasonParts.map((part, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                        <span className="mono" style={{ marginTop: 2, fontSize: 12, color: i === 0 ? 'var(--red)' : 'var(--faint)' }}>{i === 0 ? '▸' : '•'}</span>
                                        <span style={{ fontSize: 14, lineHeight: 1.6, color: i === 0 ? 'var(--ink)' : 'var(--ash)' }}>{part}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ background: 'var(--raise2)', borderRadius: 9, padding: 12, border: '1px solid var(--line)' }}>
                                <pre className="mono" style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>{failure.reason || 'No reason provided'}</pre>
                            </div>
                        )}
                        {failure.reason?.includes('CLI command failed:') && (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><Terminal size={10} style={{ color: 'var(--ash)' }} /><span className="mono" style={{ fontSize: 9, color: 'var(--ash)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Raw CLI Output</span></div>
                                <div style={{ background: 'var(--base)', borderRadius: 9, padding: 12, border: '1px solid var(--line)', overflowX: 'auto' }}>
                                    <pre className="mono" style={{ fontSize: 12, color: 'var(--red)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6, margin: 0 }}>{failure.reason.replace('CLI command failed: ', '')}</pre>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Timestamps */}
                    <section className="g2">
                        <div className="kpi" style={{ borderColor: '#F2607A22' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><AlertCircle size={10} style={{ color: 'var(--red)' }} /><span className="mono" style={{ fontSize: 9, color: 'var(--red)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Failed At</span></div>
                            <div className="mono" style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.6 }}>{formatDateTime(failure.failed_at)}</div>
                        </div>
                        {failure.remediated_at ? (
                            <div className="kpi" style={{ borderColor: '#34E0C422' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><CheckCircle2 size={10} style={{ color: 'var(--signal)' }} /><span className="mono" style={{ fontSize: 9, color: 'var(--signal)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Remediated At</span></div>
                                <div className="mono" style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.6 }}>{formatDateTime(failure.remediated_at)}</div>
                            </div>
                        ) : (
                            <div className="kpi" style={{ borderColor: '#F2B85C22' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Clock size={10} style={{ color: 'var(--amber)' }} /><span className="mono" style={{ fontSize: 9, color: 'var(--amber)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Status</span></div>
                                <div style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 600 }}>Awaiting Remediation</div>
                            </div>
                        )}
                    </section>

                    {/* Commits */}
                    <section className="panel" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><GitCommit size={12} style={{ color: 'var(--ash)' }} /><span className="mono" style={{ fontSize: 10, color: 'var(--ash)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Commit Details</span></div>
                        <div className="stack" style={{ gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span className="mono" style={{ fontSize: 12, color: 'var(--ash)' }}>Failed Commit</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <code className="mono tag red">{failure.failed_commit?.slice(0,12) || 'N/A'}</code>
                                    {failure.failed_commit && <button onClick={() => copyToClipboard(failure.failed_commit)} className="badge" style={{ cursor: 'pointer' }} title="Copy full SHA"><Copy size={10} /></button>}
                                </div>
                            </div>
                            {failure.remediation_commit && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span className="mono" style={{ fontSize: 12, color: 'var(--ash)' }}>Remediation Commit</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <code className="mono tag ok">{failure.remediation_commit.slice(0,12)}</code>
                                        <button onClick={() => copyToClipboard(failure.remediation_commit)} className="badge" style={{ cursor: 'pointer' }} title="Copy full SHA"><Copy size={10} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Score & Resources */}
                    <section className="g3">
                        <div className="kpi" style={{ textAlign: 'center' }}>
                            <div className="l" style={{ marginTop: 0, marginBottom: 6 }}>Score</div>
                            {(() => {
                                // Mode-aware threshold: Output-mode KSIs (e.g. KSI-TPR-04) pass at >=95%,
                                // Capability-mode KSIs are binary 100/0. Without mode, default to capability.
                                const target = failure.mode === 'output' ? 95 : 100;
                                const scoreColor = failure.score == null ? 'var(--ash)'
                                    : failure.score === 0 ? 'var(--red)'
                                    : failure.score < target ? 'var(--amber)'
                                    : 'var(--signal)';
                                return (
                                    <div className="mono" style={{ fontSize: 24, fontWeight: 600, color: scoreColor }}>{failure.score ?? 'N/A'}{failure.score != null && <span style={{ fontSize: 14 }}>%</span>}</div>
                                );
                            })()}
                        </div>
                        <div className="kpi" style={{ textAlign: 'center' }}>
                            <div className="l" style={{ marginTop: 0, marginBottom: 6 }}>Resources Failed</div>
                            <div className="mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink)' }}>{failure.resources_failed ?? 0}</div>
                        </div>
                        <div className="kpi" style={{ textAlign: 'center' }}>
                            <div className="l" style={{ marginTop: 0, marginBottom: 6 }}>Category</div>
                            <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--indigo)' }}>{category || '—'}</div>
                        </div>
                    </section>

                    {/* MTTR Performance Bar */}
                    {failure.duration_hours && mttr && (
                        <section className="kpi">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Timer size={12} style={{ color: mttr.var }} /><span className="mono" style={{ fontSize: 10, color: 'var(--ash)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Remediation Performance</span></div>
                                <span className="mono" style={{ fontSize: 10, color: mttr.var, letterSpacing: '.05em', textTransform: 'uppercase' }}>{mttr.label}</span>
                            </div>
                            <div style={{ width: '100%', background: 'var(--raise2)', height: 8, borderRadius: 5, overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: mttr.var, borderRadius: 5, transition: 'all 1s', width: `${Math.min((failure.duration_hours / 48) * 100, 100)}%` }} />
                            </div>
                            <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'var(--faint)' }}><span>0h</span><span>12h</span><span>24h</span><span>48h+</span></div>
                        </section>
                    )}

                    {/* Related History */}
                    {related.length > 0 && (
                        <section className="panel">
                            <div className="ph">
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <History size={12} style={{ color: 'var(--ash)' }} />
                                    <span className="mono" style={{ fontSize: 11, color: 'var(--ash)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Other Failures for {failure.ksi_id}</span>
                                </h4>
                                <span className="map">{related.length} records</span>
                            </div>
                            <div style={{ maxHeight: '12rem', overflowY: 'auto' }}>
                                {related.slice(0, 10).map((h, i) => (
                                    <div key={i} className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span className="mono" style={{ fontSize: 12, color: 'var(--ash)' }}>{formatDateShort(h.remediated_at || h.failed_at)}</span>
                                            <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: getMttrColor(h.duration_hours)?.var || 'var(--ash)' }}>{h.duration_hours ? `${h.duration_hours}h` : 'Active'}</span>
                                        </div>
                                        <p className="mono" style={{ fontSize: 11, color: 'var(--faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{h.reason || 'No reason'}</p>
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
const StatCard = ({ label, value, icon: Icon, valueClass = '', trend, trendValue, subtitle }) => (
    <div className="kpi">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className={`v ${valueClass}`}>{value}</div>
            <Icon size={18} style={{ color: 'var(--faint)', flexShrink: 0 }} />
        </div>
        <div className="l">{label}</div>
        {subtitle && <div className="sub">{subtitle}</div>}
        {trend && (
            <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, color: trend === 'up' ? 'var(--signal)' : 'var(--red)' }}>
                {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{trendValue}
            </div>
        )}
    </div>
);

// ============================================
// Active Failure Card (clickable)
// ============================================
const ActiveFailureCard = ({ failure, onClick }) => {
    const hours = useMemo(() => getHoursAgo(failure.failed_at), [failure.failed_at]);
    const sev = getSeverity(hours);
    const sevColor = sev === 'critical' ? 'var(--red)' : sev === 'warning' ? 'var(--amber)' : 'var(--indigo)';
    return (
        <div className="kpi" style={{ cursor: 'pointer', borderColor: '#F2607A33' }} onClick={() => onClick(failure)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick(failure)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AlertOctagon size={18} style={{ color: sevColor }} />
                    <div>
                        <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: 'var(--indigo)' }}>{failure.ksi_id}</span>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--ash)', letterSpacing: '.05em', textTransform: 'uppercase', marginTop: 2 }}>{getCategoryName(failure.ksi_id)}</div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: 17, fontWeight: 600, color: sevColor }}>{hours}h</div>
                    <span className="tag warn">ACTIVE</span>
                </div>
            </div>
            <div style={{ background: 'var(--raise2)', borderRadius: 9, padding: 12, border: '1px solid var(--line)', marginBottom: 12 }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--faint)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={9} /> Failure Reason</div>
                <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', margin: 0 }}>{failure.reason || 'No reason provided'}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--ash)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={10} /> Score: <span style={{ color: 'var(--ink)' }}>{failure.score}%</span></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><GitCommit size={10} /> <span style={{ color: 'var(--ash)' }}>{failure.failed_commit?.slice(0,8)}</span></span>
                </div>
                <span className="mono" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--indigo)' }}>View details <ArrowRight size={10} /></span>
            </div>
        </div>
    );
};

// ============================================
// Date-Grouped History Row (clickable)
// ============================================
const HistoryRow = ({ failure, onClick }) => {
    const m = getMttrColor(failure.duration_hours);
    const resolved = !!failure.remediated_at;
    return (
        <div className="row" style={{ cursor: 'pointer', gap: 14 }} onClick={() => onClick(failure)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick(failure)}>
            <span className="mono" style={{ width: 60, flexShrink: 0, color: 'var(--faint)', fontSize: 11 }}>
                {new Date(failure.remediated_at || failure.failed_at).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
            </span>
            <span className="mono" style={{ width: 112, flexShrink: 0, color: 'var(--indigo)', fontSize: 12, fontWeight: 600 }}>{failure.ksi_id}</span>
            <span className="svc" style={{ flex: 1, fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{failure.reason || 'No reason provided'}</span>
            <span className="mono" style={{ width: 56, textAlign: 'right', flexShrink: 0, color: m.var, fontSize: 12, fontWeight: 600 }}>{failure.duration_hours}h</span>
            <span className={`tag ${resolved ? 'ok' : 'warn'}`} style={{ flexShrink: 0 }}>{resolved ? 'RESOLVED' : 'ACTIVE'}</span>
            <ArrowRight size={12} style={{ color: 'var(--faint)', flexShrink: 0 }} />
        </div>
    );
};

// ============================================
// Date Group Header
// ============================================
const DateGroupHeader = ({ dateLabel, count, avgMttr }) => (
    <div className="ph" style={{ position: 'sticky', top: 0, zIndex: 5, padding: '10px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={12} style={{ color: 'var(--signal)' }} />
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>{dateLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ash)' }}>{count} failure{count !== 1 ? 's' : ''}</span>
            {avgMttr !== null && <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: avgMttr < 4 ? 'var(--signal)' : avgMttr < 24 ? 'var(--amber)' : 'var(--red)' }}>avg {avgMttr.toFixed(1)}h</span>}
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

    const dateInputStyle = {
        background: 'var(--raise2)', border: '1px solid var(--line)', borderRadius: 9,
        padding: '8px 10px', color: 'var(--ink)', fontFamily: 'var(--mono)', fontSize: 12, outline: 'none',
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className="seg">
                {ranges.map(r => (
                    <button key={r.key} className={activeRange === r.key ? 'on' : ''} onClick={() => onRangeChange(r.key)}>
                        {r.label}
                    </button>
                ))}
            </div>
            {activeRange === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="date" value={customFrom} onChange={(e) => onCustomFromChange(e.target.value)} style={dateInputStyle} />
                    <span className="mono" style={{ color: 'var(--faint)', fontSize: 12 }}>→</span>
                    <input type="date" value={customTo} onChange={(e) => onCustomToChange(e.target.value)} style={dateInputStyle} />
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
    const mc = stats.mttr_hours < 4 ? 'var(--signal)' : stats.mttr_hours < 24 ? 'var(--amber)' : 'var(--red)';
    return (
        <div className="row" style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'stretch', gap: 8 }} onClick={() => onClick(ksiId)} role="button" tabIndex={0}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--indigo)' }}>{ksiId}</span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--ash)' }}>{getCategoryName(ksiId)}</span>
                </div>
                <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 12 }}>
                    <span style={{ color: 'var(--ash)' }}>{stats.total_failures} failure{stats.total_failures !== 1 ? 's' : ''}</span>
                    <span style={{ fontWeight: 600, color: mc }}>{stats.mttr_hours ? `${stats.mttr_hours.toFixed(1)}h` : '—'}</span>
                </div>
            </div>
            <div style={{ width: '100%', background: 'var(--raise2)', height: 6, borderRadius: 5, overflow: 'hidden' }}><div style={{ height: '100%', background: mc, transition: 'all .5s', width: `${barW}%` }} /></div>
        </div>
    );
};

// ============================================
// Custom Tooltip
// ============================================
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div className="panel" style={{ padding: 16, background: 'var(--raise2)' }}>
                <p className="mono" style={{ fontSize: 10, color: 'var(--ash)', textTransform: 'uppercase', marginBottom: 8, borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>{label}</p>
                <div className="stack" style={{ gap: 4 }}>
                    {payload.map((e, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color }} /><span style={{ fontSize: 12, color: 'var(--ink)' }}>{e.name}</span></div>
                            <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{e.value}</span>
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

    if (loading) return (<div className="mono" style={{ color: 'var(--ash)', padding: '40px 0', textAlign: 'center' }}>Loading failure data…</div>);
    if (error || !data) return (<div className="panel" style={{ padding: 48, textAlign: 'center', maxWidth: '32rem', margin: '0 auto' }}><div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><AlertTriangle size={28} style={{ color: 'var(--amber)' }} /></div><h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Failure Tracking Unavailable</h3><p className="mono" style={{ fontSize: 13, color: 'var(--ash)', marginBottom: 16 }}>Ensure ksi_failure_tracker.json is synced to public/data/</p>{error && <code className="mono tag red">{error}</code>}</div>);

    const activeFailures = Object.values(data.active_failures || {});
    const history = (data.failure_history || []).slice().reverse();
    const ksiStats = Object.entries(data.ksi_stats || {});
    const maxFailures = Math.max(...ksiStats.map(([_,s]) => s.total_failures||0), 1);
    const catColors = [THEME.chartColors.primary, THEME.chartColors.success, THEME.chartColors.warning, THEME.chartColors.purple, THEME.chartColors.cyan, THEME.chartColors.danger];

    return (
        <div className="stack" style={{ gap: 32 }}>
            {selectedFailure && <DetailDrawer failure={selectedFailure} isActive={selectedIsActive} onClose={closeDrawer} allHistory={history} />}

            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                <div>
                    <div className="kick">◷ — KSI FAILURE TIMELINE</div>
                    <h1 className="big">Failure <span className="g">history</span></h1>
                    <p className="lede" style={{ marginBottom: 0 }}>FedRAMP 20x Phase 2 · {stats.runsProcessed.toLocaleString()} runs since {data.metadata?.backfill_since || 'N/A'}. Click any failure for full details.</p>
                </div>
                <div>
                    {stats.activeCount === 0
                        ? <span className="badge s"><CheckCircle2 size={14} /> No failures to report</span>
                        : <span className="pill warn"><span className="d" />{stats.activeCount} Active</span>
                    }
                </div>
            </div>

            {/* Stats */}
            <div className="g4">
                <StatCard label="Active Failures" value={stats.activeCount} icon={AlertOctagon} valueClass={stats.activeCount===0?'s':'a'} subtitle={stats.activeCount===0?'All systems nominal':'Requires attention'} />
                <StatCard label="Total Failures" value={stats.totalFailures} icon={Activity} valueClass="i" subtitle={`${stats.uniqueKsis} unique KSIs affected`} />
                <StatCard label="Avg MTTR" value={`${stats.avgMttr}h`} icon={Timer} valueClass={parseFloat(stats.avgMttr)<12?'s':'a'} trend={stats.mttrTrendDirection==='improving'?'up':stats.mttrTrendDirection==='degrading'?'down':null} trendValue={stats.mttrTrendDirection==='improving'?'Improving':'Needs focus'} subtitle="Mean time to remediate" />
                <StatCard label="Pipeline Runs" value={stats.runsProcessed.toLocaleString()} icon={Zap} valueClass="i" subtitle="Total validations analyzed" />
            </div>

            {/* Active Failures */}
            {activeFailures.length > 0 && (
                <div className="panel">
                    <div className="ph">
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><AlertOctagon size={16} style={{ color: 'var(--red)' }} /> Active failures requiring remediation</h4>
                        <span className="map">click for details</span>
                    </div>
                    <div className="g2" style={{ padding: 16 }}>
                        {activeFailures.map((f,i) => <ActiveFailureCard key={i} failure={f} onClick={(failure) => openDrawer(failure, true)} />)}
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="g2">
                <div className="panel" style={{ padding: 18 }}>
                    <h3 className="sec" style={{ margin: '0 0 14px' }}><TrendingUp size={14} style={{ color: 'var(--indigo)' }} /> Failure Trend (Last 6 Months)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={stats.monthlyData}>
                            <defs><linearGradient id="colorFailures" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={THEME.chartColors.primary} stopOpacity={0.3} /><stop offset="95%" stopColor={THEME.chartColors.primary} stopOpacity={0} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A222D" />
                            <XAxis dataKey="month" tick={{fontSize:10,fill:'#788596'}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fontSize:10,fill:'#788596'}} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="failures" stroke={THEME.chartColors.primary} fill="url(#colorFailures)" strokeWidth={2} name="Failures" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="panel" style={{ padding: 18 }}>
                    <h3 className="sec" style={{ margin: '0 0 14px' }}><Shield size={14} style={{ color: 'var(--indigo)' }} /> Failures by Category</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                        <ResponsiveContainer width="50%" height={200}>
                            <PieChart><Pie data={stats.categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">{stats.categoryData.map((_,i) => <Cell key={i} fill={catColors[i%catColors.length]} stroke="none" />)}</Pie><Tooltip content={<CustomTooltip />} /></PieChart>
                        </ResponsiveContainer>
                        <div className="stack" style={{ flex: 1, gap: 8 }}>
                            {stats.categoryData.map((cat,i) => (
                                <div key={cat.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: catColors[i%catColors.length] }} /><span className="mono" style={{ color: 'var(--indigo)' }}>KSI-{cat.name}</span><span className="mono" style={{ fontSize: 10, color: 'var(--faint)' }}>{KSI_CATEGORIES[cat.name]||''}</span></div>
                                    <span className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{cat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* MTTR Chart */}
            {stats.mttrTrend.length > 0 && (
                <div className="panel" style={{ padding: 18 }}>
                    <h3 className="sec" style={{ margin: '0 0 14px' }}><Timer size={14} style={{ color: 'var(--signal)' }} /> Recent MTTR Performance (Hours)</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={stats.mttrTrend} barSize={32}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A222D" />
                            <XAxis dataKey="ksi" tick={{fontSize:9,fill:'#788596'}} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
                            <YAxis tick={{fontSize:10,fill:'#788596'}} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="mttr" name="MTTR (hours)" radius={[4,4,0,0]}>{stats.mttrTrend.map((e,i) => <Cell key={i} fill={e.mttr<4?THEME.chartColors.success:e.mttr<24?THEME.chartColors.warning:THEME.chartColors.danger} />)}</Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* ==========================================
                DATE-CENTRIC FAILURE HISTORY
               ========================================== */}
            <div className="panel" data-history-table>
                {/* Header with date range + search + filters */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#0b1016' }} className="stack">
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}><CalendarDays size={14} style={{ color: 'var(--signal)' }} /> Failure Timeline</h4>
                            <p className="mono" style={{ fontSize: 10, color: 'var(--ash)', marginTop: 4 }}>Browse by date range · click any failure to inspect details</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <div className="search" style={{ width: 220 }}>
                                <Search size={15} />
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="search KSI, reason, commit…" />
                            </div>
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="mono" style={{ background: 'var(--raise2)', border: '1px solid var(--line)', borderRadius: 9, padding: '10px 12px', fontSize: 12, color: 'var(--ink)', outline: 'none', cursor: 'pointer' }}>
                                <option value="all">All Categories</option>
                                {(stats.allCategories||[]).map(c => <option key={c} value={c}>KSI-{c}</option>)}
                            </select>
                            {hasActiveFilters && (
                                <button onClick={clearAllFilters} className="chip"><RotateCcw size={10} /> Reset</button>
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
                    <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--line)', background: '#818CF80D', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 10 }}>
                            <span style={{ color: 'var(--indigo)', fontWeight: 600 }}>{rangeSummary.count} failures</span>
                            <span style={{ color: 'var(--ash)' }}>across {rangeSummary.days} day{rangeSummary.days !== 1 ? 's' : ''}</span>
                            <span style={{ color: 'var(--ash)' }}>{rangeSummary.uniqueKsis} unique KSIs</span>
                        </div>
                        <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: rangeSummary.avgMttr < 4 ? 'var(--signal)' : rangeSummary.avgMttr < 24 ? 'var(--amber)' : 'var(--red)' }}>
                            Avg MTTR: {rangeSummary.avgMttr.toFixed(1)}h
                        </span>
                    </div>
                )}

                {/* Column Headers */}
                <div className="mono" style={{ padding: '8px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14, fontSize: 9, color: 'var(--faint)', letterSpacing: '.05em', textTransform: 'uppercase' }}>
                    <span style={{ width: 60 }}>Time</span><span style={{ width: 112 }}>KSI</span><span style={{ flex: 1 }}>Reason</span><span style={{ width: 56, textAlign: 'right' }}>MTTR</span><span style={{ width: 62 }}>Status</span><span style={{ width: 12 }} />
                </div>

                {/* Date-Grouped Rows */}
                <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                    {groupedHistory.length > 0 ? (
                        groupedHistory.map((group) => {
                            const durations = group.failures.map(f => f.duration_hours).filter(Boolean);
                            const avgMttr = durations.length ? durations.reduce((a,b)=>a+b,0)/durations.length : null;
                            return (
                                <div key={group.dateKey}>
                                    <DateGroupHeader dateLabel={group.dateLabel} count={group.failures.length} avgMttr={avgMttr} />
                                    {group.failures.map((f, i) => (
                                        <HistoryRow key={i} failure={f} onClick={(failure) => openDrawer(failure, false)} />
                                    ))}
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ash)' }}>
                            <CalendarDays size={28} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                            <p style={{ fontSize: 14, marginBottom: 4 }}>No failures in this time range</p>
                            <p className="mono" style={{ fontSize: 10, color: 'var(--faint)' }}>Try expanding the date range or clearing filters</p>
                            {hasActiveFilters && <button onClick={clearAllFilters} className="mono" style={{ background: 'none', border: 'none', color: 'var(--indigo)', cursor: 'pointer', fontSize: 12, marginTop: 12, fontWeight: 600 }}>Reset all filters</button>}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mono" style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--ash)' }}>
                    <span>
                        {filteredHistory.length} failure{filteredHistory.length !== 1 ? 's' : ''}
                        {hasActiveFilters && ` (filtered from ${history.length} total)`}
                    </span>
                    <span>{history.length} total remediations all time</span>
                </div>
            </div>

            {/* Per-KSI Stats */}
            {ksiStats.length > 0 && (
                <div className="panel">
                    <div className="ph">
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Target size={14} style={{ color: 'var(--amber)' }} /> Per-KSI Statistics</h4>
                        <span className="map">{ksiStats.length} KSIs · click to filter</span>
                    </div>
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                        {ksiStats.sort((a,b) => (b[1].total_failures||0)-(a[1].total_failures||0)).map(([id,s]) => (
                            <KSIStatsBar key={id} ksiId={id} stats={s} maxFailures={maxFailures} onClick={(ksiId) => { setSearchQuery(ksiId); setFilterCategory('all'); document.querySelector('[data-history-table]')?.scrollIntoView({behavior:'smooth'}); }} />
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="footer" style={{ alignItems: 'center' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                    <div>Archive: <span style={{ color: 'var(--ink)' }}>ksi_failure_tracker.json</span></div>
                    <div>Runs: <span style={{ color: 'var(--signal)' }}>{stats.runsProcessed.toLocaleString()}</span></div>
                    <div>Since: <span style={{ color: 'var(--indigo)' }}>{data.metadata?.backfill_since||'N/A'}</span></div>
                    <div>Status: <span style={{ color: 'var(--signal)' }}>Live</span></div>
                </div>
                <a href={DATA_URL} target="_blank" rel="noreferrer" className="badge i" style={{ cursor: 'pointer' }}><Download size={12} /> Download Raw Archive</a>
            </footer>
        </div>
    );
};

export { KSIFailureDashboard };
export default KSIFailureDashboard;
