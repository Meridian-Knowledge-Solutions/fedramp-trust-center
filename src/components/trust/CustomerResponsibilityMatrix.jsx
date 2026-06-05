import React, { useState, useEffect, useMemo, memo } from 'react';
import {
    Shield, Users, Cloud, Server, Search, ChevronDown, ChevronRight,
    Building2, UserCheck, Layers, FileText, Filter, X, Sparkles,
    KeyRound, Info, ArrowRight, CheckCircle2, Circle, AlertCircle, Download,
    ShieldCheck, Landmark, Stamp, ScrollText
} from 'lucide-react';
import { THEME, BASE_PATH } from '../../config/theme';
import { getRouteSegments, setRoute, onRouteChange } from '../../utils/hashRoute';

// ───────── Theme tokens ─────────
const RESP_THEMES = {
    Customer:          { label: 'Customer',          color: '#f59e0b', bg: 'bg-amber-500/10',    border: 'border-amber-500/30',    text: 'text-amber-400',    icon: UserCheck },
    Shared:            { label: 'Shared',            color: '#3b82f6', bg: 'bg-blue-500/10',     border: 'border-blue-500/30',     text: 'text-blue-400',     icon: Users },
    Meridian:          { label: 'Meridian',          color: '#10b981', bg: 'bg-emerald-500/10',  border: 'border-emerald-500/30',  text: 'text-emerald-400',  icon: Shield },
    'Inherited (AWS)': { label: 'Inherited (AWS)',   color: '#a855f7', bg: 'bg-purple-500/10',   border: 'border-purple-500/30',   text: 'text-purple-400',   icon: Cloud },
};

const FAMILY_ACCENT = {
    'AC': '#3b82f6', 'AT': '#06b6d4', 'AU': '#8b5cf6', 'CA': '#ec4899',
    'CM': '#f59e0b', 'CP': '#10b981', 'IA': '#6366f1', 'IR': '#ef4444',
    'MA': '#84cc16', 'MP': '#a855f7', 'PE': '#0ea5e9', 'PL': '#14b8a6',
    'PS': '#f97316', 'RA': '#eab308', 'SA': '#22c55e', 'SC': '#3b82f6',
    'SI': '#d946ef', 'SR': '#7c3aed',
};

const familyKey = (f) => (f || '').split(' - ')[0];
const familyAccent = (f) => FAMILY_ACCENT[familyKey(f)] || '#71717a';

// Coverage disposition → badge style (CMMC / CUI map). Matches the leading
// keyword of the "Coverage" cells in the source matrix.
const coverageTheme = (coverage) => {
    const c = (coverage || '').toLowerCase();
    if (c.startsWith('covered') && c.includes('inherit')) return { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', dot: '#a855f7' };
    if (c.startsWith('inherit'))                          return { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', dot: '#a855f7' };
    if (c.startsWith('covered'))                          return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: '#10b981' };
    if (c.startsWith('partial'))                          return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: '#f59e0b' };
    if (c.startsWith('supported'))                        return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: '#3b82f6' };
    if (c.startsWith('customer') || c.startsWith('gov'))  return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: '#f59e0b' };
    return { text: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10', dot: '#71717a' };
};

// ───────── Top header ─────────
const Header = ({ summary, mode }) => {
    const m = mode === 'cloud' ? summary?.cloud_fedramp : summary?.on_prem;
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1729] via-[#121217] to-[#0a0a0f] border border-white/10 rounded-2xl p-6 md:p-8">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-60" />
            <div className="relative flex flex-col lg:flex-row gap-6 lg:items-end justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Layers className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Customer Responsibility Matrix</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Who does what — across NIST 800-53 Rev 5, FedRAMP 20x KSIs, and CMMC 2.0 L2 / CUI
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                        <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-1 rounded-md border border-white/10 font-semibold tracking-wide uppercase">
                            NIST SP 800-53 Rev 5
                        </span>
                        <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-1 rounded-md border border-white/10 font-semibold tracking-wide uppercase">
                            Moderate Baseline
                        </span>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md border border-blue-500/20 font-semibold tracking-wide uppercase">
                            FedRAMP 20x KSI Mapped
                        </span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20 font-semibold tracking-wide uppercase">
                            CMMC 2.0 Level 2
                        </span>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md border border-indigo-500/20 font-semibold tracking-wide uppercase">
                            CUI / DoD Cross-Ref
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Controls in scope</div>
                        <div className="text-4xl font-extrabold text-white font-mono leading-none mt-1">{m?.total ?? 0}</div>
                    </div>
                    <a
                        href={`${BASE_PATH}Meridian_LMS_CRM_NIST_800-53_Rev5_CMMC_CUI.xlsx`}
                        download
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                        title="NIST 800-53 Rev 5 + FedRAMP 20x KSI + CMMC 2.0 L2 / CUI cross-reference"
                    >
                        <Download className="w-3 h-3" /> Download XLSX
                    </a>
                </div>
            </div>
        </div>
    );
};

// ───────── Deployment mode toggle ─────────
const ModeToggle = ({ mode, setMode }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
            { key: 'cloud',   label: 'Cloud (AWS) FedRAMP', subtitle: 'Three-party model: Meridian + AWS + Customer', icon: Cloud,   accent: 'blue' },
            { key: 'on_prem', label: 'On-Premises',         subtitle: 'Customer-managed infrastructure & policy',     icon: Server,  accent: 'amber' },
        ].map(opt => {
            const active = mode === opt.key;
            const Icon = opt.icon;
            const accent = opt.accent === 'blue' ? 'border-blue-500/40 bg-blue-500/5' : 'border-amber-500/40 bg-amber-500/5';
            const iconColor = opt.accent === 'blue' ? 'text-blue-400' : 'text-amber-400';
            return (
                <button
                    key={opt.key}
                    onClick={() => setMode(opt.key)}
                    className={`text-left rounded-xl border p-4 transition-all relative overflow-hidden group
                        ${active ? accent : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'}`}
                >
                    {active && <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500" />}
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${active ? 'border-white/10 bg-black/30' : 'border-white/5 bg-white/[0.02]'}`}>
                            <Icon className={`w-4 h-4 ${active ? iconColor : 'text-slate-500'}`} />
                        </div>
                        <div className="flex-1">
                            <div className={`text-sm font-bold ${active ? 'text-white' : 'text-slate-300'}`}>{opt.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{opt.subtitle}</div>
                        </div>
                        {active && <CheckCircle2 className={`w-4 h-4 ${iconColor}`} />}
                    </div>
                </button>
            );
        })}
    </div>
);

// ───────── Responsibility split ─────────
const ResponsibilitySplit = ({ counts, total }) => {
    const entries = Object.entries(counts || {}).filter(([, v]) => v > 0);
    // Order parties consistently
    const order = ['Customer', 'Shared', 'Meridian', 'Inherited (AWS)'];
    entries.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));

    return (
        <div className="bg-[#121217] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-bold">Who Owns What</div>
                <span className="text-[10px] text-slate-600">{total} controls assessed</span>
            </div>
            {/* Segmented bar */}
            <div className="flex h-3 rounded-full overflow-hidden bg-zinc-900 mb-4">
                {entries.map(([k, v]) => {
                    const t = RESP_THEMES[k];
                    const pct = (v / total) * 100;
                    return (
                        <div key={k}
                            className="h-full transition-all hover:opacity-80"
                            style={{ width: `${pct}%`, background: t?.color || '#71717a' }}
                            title={`${k}: ${v} (${pct.toFixed(1)}%)`}
                        />
                    );
                })}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {entries.map(([k, v]) => {
                    const t = RESP_THEMES[k] || { color: '#71717a', text: 'text-zinc-400', bg: 'bg-zinc-800/40' };
                    const Icon = t.icon || Circle;
                    const pct = ((v / total) * 100).toFixed(0);
                    return (
                        <div key={k} className={`rounded-lg p-3 border border-white/5 ${t.bg}`}>
                            <div className="flex items-center gap-2 mb-1.5">
                                <Icon className={`w-3.5 h-3.5 ${t.text}`} />
                                <span className={`text-[10px] uppercase font-bold tracking-wide ${t.text}`}>{k}</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-extrabold text-white font-mono">{v}</span>
                                <span className="text-[10px] text-slate-500">{pct}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ───────── Mode legend ─────────
const ModeLegend = ({ mode }) => (
    <div className="bg-[#0f0f12] border border-white/5 rounded-xl p-4">
        <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-[11px] text-slate-400 leading-relaxed">
                {mode === 'cloud' ? (
                    <>
                        In <strong className="text-white">Cloud (AWS) FedRAMP</strong> deployments, physical and lower-stack
                        infrastructure controls are inherited from AWS's FedRAMP authorization. Meridian implements application-level
                        controls and provides shared capabilities the customer configures. Customers retain ownership of their
                        organizational policies, user lifecycle, and IdP integration.
                    </>
                ) : (
                    <>
                        In <strong className="text-white">On-Premises</strong> deployments, the customer owns all infrastructure,
                        network, physical, and environmental controls. Meridian's responsibility is limited to the application
                        layer — typically delivered through the Recommended Secure Configuration Guide.
                    </>
                )}
            </div>
        </div>
    </div>
);

// ───────── Family chips ─────────
const FamilyFilter = ({ families, activeFamily, setActiveFamily }) => (
    <div className="flex flex-wrap gap-1.5">
        <button
            onClick={() => setActiveFamily(null)}
            className={`text-[10px] px-2.5 py-1.5 rounded-md font-bold tracking-wide uppercase transition-all
                ${activeFamily === null ? 'bg-white/10 text-white border border-white/20' : 'bg-white/[0.02] text-slate-500 border border-white/5 hover:text-slate-300 hover:border-white/10'}`}
        >
            All ({families.reduce((acc, f) => acc + f.count, 0)})
        </button>
        {families.map(f => {
            const active = activeFamily === f.id;
            const accent = familyAccent(f.full);
            return (
                <button
                    key={f.id}
                    onClick={() => setActiveFamily(active ? null : f.id)}
                    className={`text-[10px] px-2.5 py-1.5 rounded-md font-bold tracking-wide uppercase transition-all border flex items-center gap-1.5
                        ${active ? 'bg-white/10 text-white border-white/30' : 'bg-white/[0.02] text-slate-400 border-white/5 hover:text-slate-200 hover:border-white/10'}`}
                    title={f.full}
                >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                    {f.id}
                    <span className="text-slate-500 font-mono">{f.count}</span>
                </button>
            );
        })}
    </div>
);

// ───────── Control row ─────────
const ControlRow = memo(({ ctrl, isExpanded, onToggle, mode }) => {
    const resp = RESP_THEMES[ctrl.responsibility] || RESP_THEMES.Customer;
    const accent = familyAccent(ctrl.family);
    const RespIcon = resp.icon || Circle;
    const isNA = ctrl.applicability === 'Not Applicable';

    return (
        <div className={`rounded-xl border transition-all ${isExpanded ? 'border-white/20 bg-white/[0.03]' : 'border-white/[0.06] bg-[#0f0f12] hover:border-white/10'}`}>
            <button
                onClick={onToggle}
                className="w-full text-left p-4 flex items-start gap-3"
            >
                <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: accent }} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-xs font-mono font-bold text-white">{ctrl.control_id}</span>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{familyKey(ctrl.family)}</span>
                        {ctrl.applicability === 'Not Applicable' && (
                            <span className="text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-bold uppercase">N/A</span>
                        )}
                        {ctrl.applicability === 'Voluntary' && (
                            <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded font-bold uppercase">Voluntary</span>
                        )}
                    </div>
                    <div className="text-sm text-slate-200 font-semibold leading-snug pr-4">{ctrl.control_name}</div>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                        {/* Party badges */}
                        {ctrl.meridian && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Meridian
                            </span>
                        )}
                        {ctrl.customer && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Customer
                            </span>
                        )}
                        {mode === 'cloud' && ctrl.csp && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                AWS
                            </span>
                        )}
                        <span className="text-slate-600">·</span>
                        <span className={`text-[10px] font-bold ${resp.text}`}>{ctrl.responsibility}</span>
                        {ctrl.ksis?.length > 0 && (
                            <>
                                <span className="text-slate-600">·</span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {ctrl.ksis.length} KSI{ctrl.ksis.length === 1 ? '' : 's'}
                                </span>
                            </>
                        )}
                        {ctrl.cmmc && (
                            <>
                                <span className="text-slate-600">·</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    CMMC L2
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <div className="shrink-0 self-center">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                </div>
            </button>
            {isExpanded && (
                <div className="px-4 pb-4 pl-8 border-t border-white/5 pt-3 space-y-3">
                    {ctrl.implementation_notes && (
                        <div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5">
                                <FileText className="w-3 h-3" /> Implementation Notes
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {ctrl.implementation_notes.split('|').map((part, i) => (
                                    <span key={i} className={i > 0 ? 'block text-slate-500 mt-2' : ''}>
                                        {part.trim()}
                                    </span>
                                ))}
                            </p>
                        </div>
                    )}
                    {ctrl.applicability_rationale && (
                        <div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5">
                                <AlertCircle className="w-3 h-3" /> Applicability Rationale
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{ctrl.applicability_rationale}</p>
                        </div>
                    )}
                    {ctrl.ksis?.length > 0 && (
                        <div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5">
                                <KeyRound className="w-3 h-3" /> KSI Mapping
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {ctrl.ksis.map(k => (
                                    <span key={k} className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold">
                                        {k}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {(ctrl.cmmc || ctrl.cui_obligation || ctrl.cui_disposition) && (
                        <div className="rounded-lg border border-indigo-500/15 bg-indigo-500/[0.04] p-3">
                            <div className="text-[9px] text-indigo-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
                                <Landmark className="w-3 h-3" /> CMMC 2.0 L2 / CUI / DoD Cross-Reference
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">CMMC L2 Practice <span className="text-slate-600 normal-case">(800-171)</span></div>
                                    {ctrl.cmmc ? (
                                        <div className="flex flex-wrap gap-1">
                                            {ctrl.cmmc.split(',').map(p => (
                                                <span key={p} className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20 font-bold">
                                                    {p.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-slate-600 italic">No 800-171 / CMMC L2 equivalent</span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">CUI Obligation <span className="text-slate-600 normal-case">(DoDI 5200.48)</span></div>
                                    <div className="text-[11px] text-slate-300 leading-snug">{ctrl.cui_obligation || '—'}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">Coverage Disposition</div>
                                    {ctrl.cui_disposition ? (
                                        <div className={`inline-flex items-start gap-1.5 text-[10px] leading-snug px-2 py-1 rounded border ${coverageTheme(ctrl.cui_disposition).bg} ${coverageTheme(ctrl.cui_disposition).border} ${coverageTheme(ctrl.cui_disposition).text}`}>
                                            <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: coverageTheme(ctrl.cui_disposition).dot }} />
                                            <span>{ctrl.cui_disposition}</span>
                                        </div>
                                    ) : <span className="text-[10px] text-slate-600">—</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

// ───────── Control browser ─────────
const ControlBrowser = ({ controls, mode }) => {
    const [search, setSearch] = useState('');
    const [activeFamily, setActiveFamily] = useState(null);
    const [activeResp, setActiveResp] = useState(null);
    const [expanded, setExpanded] = useState(new Set());
    const [hideNA, setHideNA] = useState(true);

    const families = useMemo(() => {
        const map = new Map();
        controls.forEach(c => {
            const key = familyKey(c.family);
            if (!key) return;
            if (!map.has(key)) map.set(key, { id: key, full: c.family, count: 0 });
            map.get(key).count += 1;
        });
        return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
    }, [controls]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return controls.filter(c => {
            if (hideNA && c.applicability === 'Not Applicable') return false;
            if (activeFamily && familyKey(c.family) !== activeFamily) return false;
            if (activeResp && c.responsibility !== activeResp) return false;
            if (!q) return true;
            return (
                (c.control_id || '').toLowerCase().includes(q) ||
                (c.control_name || '').toLowerCase().includes(q) ||
                (c.implementation_notes || '').toLowerCase().includes(q) ||
                (c.family || '').toLowerCase().includes(q) ||
                (c.cmmc || '').toLowerCase().includes(q) ||
                (c.cui_obligation || '').toLowerCase().includes(q) ||
                (c.cui_disposition || '').toLowerCase().includes(q) ||
                c.ksis?.some(k => k.toLowerCase().includes(q))
            );
        });
    }, [controls, search, activeFamily, activeResp, hideNA]);

    const toggle = (id) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const respCounts = useMemo(() => {
        const c = {};
        controls.forEach(ctrl => {
            if (ctrl.applicability === 'Not Applicable') return;
            c[ctrl.responsibility] = (c[ctrl.responsibility] || 0) + 1;
        });
        return c;
    }, [controls]);

    return (
        <div className="bg-[#121217] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-bold">Control Browser</div>
                    <div className="text-xs text-slate-600 mt-1">
                        Showing <span className="text-slate-300 font-bold font-mono">{filtered.length}</span> of {controls.length} controls
                    </div>
                </div>
                <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={hideNA}
                        onChange={e => setHideNA(e.target.checked)}
                        className="accent-blue-500"
                    />
                    Hide N/A controls
                </label>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by ID, name, KSI, CMMC practice, or CUI (e.g., AC-2, MFA, KSI-IAM, AC.L2-3.1.1, safeguarding)…"
                    className="w-full bg-[#09090b] border border-white/10 rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Responsibility filter pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                {Object.entries(respCounts).map(([resp, count]) => {
                    const t = RESP_THEMES[resp];
                    if (!t) return null;
                    const active = activeResp === resp;
                    return (
                        <button
                            key={resp}
                            onClick={() => setActiveResp(active ? null : resp)}
                            className={`text-[10px] px-2.5 py-1.5 rounded-md font-bold tracking-wide uppercase transition-all border flex items-center gap-1.5
                                ${active ? `${t.bg} ${t.text} ${t.border}` : 'bg-white/[0.02] text-slate-500 border-white/5 hover:text-slate-300 hover:border-white/10'}`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
                            {resp}
                            <span className={`font-mono ${active ? '' : 'text-slate-600'}`}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Family chips */}
            <FamilyFilter families={families} activeFamily={activeFamily} setActiveFamily={setActiveFamily} />

            {/* Active filter chips */}
            {(activeFamily || activeResp || search) && (
                <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500">
                    <Filter className="w-3 h-3" />
                    <span>Filters active</span>
                    <button onClick={() => { setActiveFamily(null); setActiveResp(null); setSearch(''); }}
                        className="text-blue-400 hover:text-blue-300 font-semibold underline">
                        Clear all
                    </button>
                </div>
            )}

            {/* Control list */}
            <div className="mt-4 space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">No controls match the current filters.</div>
                ) : (
                    filtered.map(c => (
                        <ControlRow
                            key={c.control_id}
                            ctrl={c}
                            isExpanded={expanded.has(c.control_id)}
                            onToggle={() => toggle(c.control_id)}
                            mode={mode}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

// ───────── App Security Controls capsule ─────────
const AppSecCapsule = ({ items, summary, embedded = false }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const categories = useMemo(() => {
        const map = {};
        items.forEach(i => {
            const c = i.category || 'Other';
            map[c] = (map[c] || 0) + 1;
        });
        return Object.entries(map);
    }, [items]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter(i =>
            (i.config_id || '').toLowerCase().includes(q) ||
            (i.title || '').toLowerCase().includes(q) ||
            (i.functional_area || '').toLowerCase().includes(q) ||
            i.nist?.some(n => n.toLowerCase().includes(q)) ||
            i.ksis?.some(k => k.toLowerCase().includes(q))
        );
    }, [items, search]);

    const header = (
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
                <div className="text-sm font-bold text-white">Application Security Configuration</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                    {summary?.total ?? items.length} configuration items in the Meridian Secure Configuration Guide
                </div>
            </div>
        </div>
    );
    return (
        <div className="bg-[#121217] border border-white/10 rounded-xl">
            {embedded ? (
                <div className="w-full p-5 flex items-center justify-between">{header}</div>
            ) : (
                <button onClick={() => setOpen(!open)} className="w-full p-5 flex items-center justify-between text-left">
                    {header}
                    {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                </button>
            )}
            {(embedded || open) && (
                <div className="px-5 pb-5 border-t border-white/5">
                    {/* Category tiles */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mt-4">
                        {categories.map(([c, count]) => (
                            <div key={c} className="bg-[#0f0f12] border border-white/5 rounded-lg p-3">
                                <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">{c}</div>
                                <div className="text-xl font-extrabold text-white font-mono">{count}</div>
                            </div>
                        ))}
                    </div>
                    <div className="relative mt-4">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search app security settings…"
                            className="w-full bg-[#09090b] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40"
                        />
                    </div>
                    <div className="mt-3 space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                        {filtered.slice(0, 100).map(i => (
                            <div key={i.config_id} className="bg-[#0f0f12] border border-white/5 rounded-lg p-3">
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="text-[10px] font-mono font-bold text-cyan-400">{i.config_id}</span>
                                            <span className="text-[9px] text-slate-500 uppercase tracking-wider">{i.category}</span>
                                            {i.subarea && <span className="text-[9px] text-slate-600">/ {i.subarea}</span>}
                                        </div>
                                        <div className="text-xs text-slate-200 leading-snug">{i.title}</div>
                                        {(i.nist?.length || i.ksis?.length) && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {i.nist?.map(n => (
                                                    <span key={n} className="text-[9px] font-mono bg-white/[0.04] text-slate-400 px-1.5 py-0.5 rounded border border-white/5">
                                                        {n}
                                                    </span>
                                                ))}
                                                {i.ksis?.map(k => (
                                                    <span key={k} className="text-[9px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                        {k}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filtered.length > 100 && (
                            <div className="text-center text-[10px] text-slate-500 py-2">
                                Showing first 100 of {filtered.length}. Refine search to see more.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ───────── KSI Reference capsule ─────────
const KSIRef = ({ items, embedded = false }) => {
    const [open, setOpen] = useState(false);
    const themes = useMemo(() => {
        const map = new Map();
        items.forEach(k => {
            if (!map.has(k.theme)) map.set(k.theme, []);
            map.get(k.theme).push(k);
        });
        return Array.from(map.entries());
    }, [items]);

    const header = (
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <KeyRound className="w-4 h-4 text-blue-400" />
            </div>
            <div>
                <div className="text-sm font-bold text-white">FedRAMP 20x KSI Reference</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                    {items.length} Key Security Indicators across {themes.length} themes
                </div>
            </div>
        </div>
    );
    return (
        <div className="bg-[#121217] border border-white/10 rounded-xl">
            {embedded ? (
                <div className="w-full p-5 flex items-center justify-between">{header}</div>
            ) : (
                <button onClick={() => setOpen(!open)} className="w-full p-5 flex items-center justify-between text-left">
                    {header}
                    {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                </button>
            )}
            {(embedded || open) && (
                <div className="px-5 pb-5 border-t border-white/5 space-y-4 mt-4">
                    {themes.map(([theme, list]) => (
                        <div key={theme}>
                            <div className="text-[10px] uppercase tracking-wider font-bold text-blue-400 mb-2">{theme}</div>
                            <div className="space-y-1.5">
                                {list.map(k => (
                                    <div key={k.ksi_id} className="bg-[#0f0f12] border border-white/5 rounded-lg p-3">
                                        <div className="flex items-start gap-3">
                                            <span className="text-[10px] font-mono font-bold text-blue-400 shrink-0">{k.ksi_id}</span>
                                            <div className="flex-1">
                                                <div className="text-xs text-slate-200">{k.description}</div>
                                                {k.nist_controls && (
                                                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                                                        NIST: <span className="text-slate-400">{k.nist_controls}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ───────── CMMC 2.0 L2 / CUI / DoD mapping section ─────────
const CmmcCuiMapping = ({ map, summary, embedded = false }) => {
    const [open, setOpen] = useState(false);
    if (!map) return null;

    const CoverageBadge = ({ value }) => {
        const t = coverageTheme(value);
        return (
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border ${t.bg} ${t.border} ${t.text} whitespace-nowrap`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.dot }} />
                {value}
            </span>
        );
    };

    const header = (
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <Landmark className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                    CMMC 2.0 Level 2 &amp; CUI / DoD Coverage Map
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 font-bold uppercase tracking-wide">RFP Crosswalk</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                    NIST SP 800-171 Rev 2 · DoDI 5200.48 / DAFI 16-1403 · {summary?.cmmc_families ?? 14} CMMC L2 domains · {summary?.cui_handling_requirements ?? 7} CUI handling requirements
                </div>
            </div>
        </div>
    );
    return (
        <div className="bg-gradient-to-br from-indigo-500/[0.04] to-transparent border border-indigo-500/20 rounded-xl">
            {embedded ? (
                <div className="w-full p-5 flex items-center justify-between">{header}</div>
            ) : (
                <button onClick={() => setOpen(!open)} className="w-full p-5 flex items-center justify-between text-left">
                    {header}
                    {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                </button>
            )}
            {(embedded || open) && (
                <div className="px-5 pb-5 border-t border-indigo-500/10 space-y-6 mt-2 pt-4">
                    {/* About */}
                    {map.about?.length > 0 && (
                        <div className="bg-[#0f0f12] border border-white/5 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                                <div className="space-y-2">
                                    {map.about.map((p, i) => (
                                        <p key={i} className={`text-[11px] leading-relaxed ${i === 0 ? 'text-slate-300' : 'text-slate-400'}`}>{p}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CUI handling requirements */}
                    {map.cui_handling?.length > 0 && (
                        <div>
                            <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 mb-2 flex items-center gap-1.5">
                                <Stamp className="w-3.5 h-3.5" /> CUI Handling Requirements — DoDI 5200.48 / DAFI 16-1403
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-white/10">
                                <table className="w-full text-left border-collapse min-w-[640px]">
                                    <thead>
                                        <tr className="bg-white/[0.03] text-[9px] uppercase tracking-wider text-slate-500">
                                            <th className="px-3 py-2 font-bold">Requirement</th>
                                            <th className="px-3 py-2 font-bold">Primary Controls</th>
                                            <th className="px-3 py-2 font-bold">Coverage</th>
                                            <th className="px-3 py-2 font-bold">Responsibility &amp; Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {map.cui_handling.map((row, i) => (
                                            <tr key={i} className="border-t border-white/5 align-top">
                                                <td className="px-3 py-2.5 text-[11px] font-semibold text-slate-200 whitespace-nowrap">{row.requirement}</td>
                                                <td className="px-3 py-2.5 text-[10px] font-mono text-slate-400">{row.primary_controls}</td>
                                                <td className="px-3 py-2.5"><CoverageBadge value={row.coverage} /></td>
                                                <td className="px-3 py-2.5 text-[11px] text-slate-400 leading-relaxed">{row.notes}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Family coverage */}
                    {map.family_coverage?.length > 0 && (
                        <div>
                            <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 mb-2 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" /> NIST 800-171 / CMMC Level 2 Family Coverage ({map.family_coverage.length} domains)
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {map.family_coverage.map((row, i) => (
                                    <div key={i} className="bg-[#0f0f12] border border-white/5 rounded-lg p-3">
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <span className="text-[11px] font-bold text-slate-200">{row.domain}</span>
                                            <CoverageBadge value={row.coverage} />
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                            {(row.ksi_family || '').split(',').map(f => f.trim()).filter(Boolean).map(f => (
                                                <span key={f} className="text-[9px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold">
                                                    {f.includes('(') || f.includes('Inherited') ? f : `KSI-${f}`}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="text-[10px] text-slate-500 leading-relaxed">{row.notes}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Scope notes */}
                    {map.scope_notes?.length > 0 && (
                        <div>
                            <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 mb-2 flex items-center gap-1.5">
                                <ScrollText className="w-3.5 h-3.5" /> Scope &amp; Shared-Responsibility Notes
                            </div>
                            <div className="space-y-1.5">
                                {map.scope_notes.map((note, i) => (
                                    <div key={i} className="bg-[#0f0f12] border border-white/5 rounded-lg p-3 text-[11px] leading-relaxed">
                                        {note.title
                                            ? <><span className="font-bold text-slate-200">{note.title}:</span> <span className="text-slate-400">{note.text}</span></>
                                            : <span className="text-slate-500 italic">{note.text}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ───────── Compliance-context segmented navigation ─────────
// The CRM spans several distinct compliance contexts (NIST control ownership,
// CMMC/CUI/DoD crosswalk, application-security config, KSI reference). Rather
// than stacking them all in one long scroll, each is its own focused view.
const CRM_SECTIONS = [
    { id: 'controls', label: 'NIST 800-53 Controls', icon: Layers,    accent: 'text-blue-400'   },
    { id: 'cmmc',     label: 'CMMC / CUI / DoD',     icon: Landmark,   accent: 'text-indigo-400' },
    { id: 'appsec',   label: 'App Security',          icon: Sparkles,   accent: 'text-cyan-400'   },
    { id: 'ksi',      label: 'KSI Reference',         icon: KeyRound,   accent: 'text-blue-400'   },
];
const CRM_SECTION_IDS = new Set(CRM_SECTIONS.map(s => s.id));

const SectionNav = ({ active, onChange, counts }) => (
    <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {CRM_SECTIONS.map(s => {
            const Icon = s.icon;
            const on = active === s.id;
            const count = counts?.[s.id];
            return (
                <button
                    key={s.id}
                    onClick={() => onChange(s.id)}
                    aria-current={on ? 'page' : undefined}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border whitespace-nowrap transition-all shrink-0 ${on
                        ? 'bg-white/[0.06] border-white/20 text-white'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'}`}
                >
                    <Icon className={`w-4 h-4 ${on ? s.accent : 'text-slate-500'}`} />
                    <span className="text-xs font-bold tracking-wide">{s.label}</span>
                    {count != null && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${on ? 'bg-white/10 text-slate-200' : 'bg-white/5 text-slate-500'}`}>{count}</span>
                    )}
                </button>
            );
        })}
    </div>
);

// ───────── Top-level component ─────────
const CustomerResponsibilityMatrix = () => {
    const [data, setData] = useState(null);
    const [mode, setMode] = useState('cloud');
    // Initialize the compliance context from the URL hash
    // (e.g. #trust/compliance/cmmc) so RFP deep links land on the right view.
    const [section, setSection] = useState(() => {
        const seg = getRouteSegments();
        return seg[0] === 'trust' && seg[1] === 'compliance' && CRM_SECTION_IDS.has(seg[2]) ? seg[2] : 'controls';
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Write the selected compliance context into the hash so it can be shared.
    const handleSectionChange = (id) => {
        setSection(id);
        setRoute(['trust', 'compliance', id]);
    };

    // Sync with external hash changes (back/forward, deep links).
    useEffect(() => {
        const sync = () => {
            const seg = getRouteSegments();
            if (seg[0] === 'trust' && seg[1] === 'compliance' && CRM_SECTION_IDS.has(seg[2])) setSection(seg[2]);
        };
        return onRouteChange(sync);
    }, []);

    useEffect(() => {
        let cancelled = false;
        fetch(`${BASE_PATH}nist_crm.json`)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(json => { if (!cancelled) { setData(json); setLoading(false); } })
            .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
        return () => { cancelled = true; };
    }, []);

    if (loading) {
        return (
            <div className="bg-[#121217] border border-white/10 rounded-2xl p-12 text-center">
                <div className="text-slate-500 text-sm">Loading Customer Responsibility Matrix…</div>
            </div>
        );
    }
    if (error || !data) {
        return (
            <div className="bg-[#121217] border border-rose-500/20 rounded-2xl p-6 text-rose-400 text-sm">
                Failed to load CRM data: {error || 'unknown error'}
            </div>
        );
    }

    const controls = mode === 'cloud' ? data.cloud_fedramp : data.on_prem;
    const summary = data.summary || {};
    const modeSummary = mode === 'cloud' ? summary.cloud_fedramp : summary.on_prem;

    const counts = {
        controls: modeSummary?.total ?? controls.length,
        cmmc: data.cmmc_cui?.family_coverage?.length ?? summary.cmmc_cui?.cmmc_families,
        appsec: summary.app_sec?.total ?? data.app_sec?.length,
        ksi: data.ksi_reference?.length ?? summary.ksi_count,
    };

    return (
        <div className="space-y-6">
            <Header summary={summary} mode={mode} />
            <SectionNav active={section} onChange={handleSectionChange} counts={counts} />

            {section === 'controls' && (
                <div className="space-y-6">
                    <ModeToggle mode={mode} setMode={setMode} />
                    <ModeLegend mode={mode} />
                    <ResponsibilitySplit counts={modeSummary?.by_responsibility} total={modeSummary?.total} />
                    <ControlBrowser controls={controls} mode={mode} />
                </div>
            )}
            {section === 'cmmc' && (
                <CmmcCuiMapping map={data.cmmc_cui} summary={summary.cmmc_cui} embedded />
            )}
            {section === 'appsec' && (
                <AppSecCapsule items={data.app_sec || []} summary={summary.app_sec} embedded />
            )}
            {section === 'ksi' && (
                <KSIRef items={data.ksi_reference || []} embedded />
            )}

            <div className="text-[10px] text-slate-600 text-right">
                Source: Meridian LMS CRM · {data.metadata?.framework} · KSI mapping per {data.metadata?.ksi_mapping}
                {data.metadata?.cmmc_mapping && <> · CMMC/CUI per {data.metadata.cmmc_mapping}</>}
            </div>
        </div>
    );
};

export default CustomerResponsibilityMatrix;
