import React, { useState, useEffect, useMemo, memo, useRef } from 'react';
import {
    Shield, Users, Cloud, Server, Search, ChevronDown, ChevronRight,
    Building2, UserCheck, Layers, FileText, Filter, X, Sparkles,
    KeyRound, Info, ArrowRight, CheckCircle2, Circle, AlertCircle, Download,
    ShieldCheck, Landmark, Stamp, ScrollText
} from 'lucide-react';
import { THEME, BASE_PATH } from '../../config/theme';
import { getRouteSegments, setRoute, onRouteChange } from '../../utils/hashRoute';
import { Card, Badge, Eyebrow } from './ui';

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
        <Card className="relative overflow-hidden p-7 md:p-8">
            <div className="absolute -top-20 -right-12 w-64 h-64 rounded-full bg-sky-500/10 blur-[100px] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
            <div className="relative flex flex-col lg:flex-row gap-6 lg:items-end justify-between">
                <div>
                    <Eyebrow className="mb-2">Shared Responsibility</Eyebrow>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Customer Responsibility Matrix</h2>
                    <p className="text-[13px] text-slate-400 mt-1 max-w-2xl leading-relaxed">
                        Who does what — across NIST 800-53 Rev 5, FedRAMP 20x KSIs, and CMMC 2.0 L2 / CUI.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                        {['NIST SP 800-53 Rev 5', 'Moderate Baseline', 'FedRAMP 20x KSI', 'CMMC 2.0 Level 2', 'CUI / DoD'].map(b => (
                            <Badge key={b} variant="neutral">{b}</Badge>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col items-start lg:items-end gap-3">
                    <div className="lg:text-right">
                        <Eyebrow>Controls in scope</Eyebrow>
                        <div className="text-4xl font-bold text-white font-mono leading-none mt-1.5">{m?.total ?? 0}</div>
                    </div>
                    <a
                        href={`${BASE_PATH}Meridian_LMS_CRM_NIST_800-53_Rev5_CMMC_CUI.xlsx`}
                        download
                        className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                        title="NIST 800-53 Rev 5 + FedRAMP 20x KSI + CMMC 2.0 L2 / CUI cross-reference"
                    >
                        <Download className="w-3.5 h-3.5" /> Download XLSX
                    </a>
                </div>
            </div>
        </Card>
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

// ───────── Ownership chip (single, calm party indicator) ─────────
// Replaces the old stack of per-party pills on each row. The control's
// `responsibility` already names the owning party, so one chip says it all.
const OwnershipChip = ({ responsibility }) => {
    const t = RESP_THEMES[responsibility] || RESP_THEMES.Customer;
    const Icon = t.icon || Circle;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${t.bg} ${t.border} ${t.text}`}>
            <Icon className="w-3 h-3" />
            {t.label}
        </span>
    );
};

const RESP_ORDER = ['Customer', 'Shared', 'Meridian', 'Inherited (AWS)'];

// ───────── Ownership digest ─────────
// "Who owns what" at a glance — the calm, large-type summary that leads the
// section so a reviewer understands the split before drilling into 185 rows.
const OwnershipDigest = ({ counts, total }) => {
    const entries = Object.entries(counts || {}).filter(([, v]) => v > 0)
        .sort((a, b) => RESP_ORDER.indexOf(a[0]) - RESP_ORDER.indexOf(b[0]));

    return (
        <div className="bg-[#121217] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">Who owns what</h3>
                <span className="text-xs text-slate-500">{total} controls assessed</span>
            </div>
            {/* Segmented bar */}
            <div className="flex h-4 rounded-full overflow-hidden bg-zinc-900 mb-5">
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
                    const t = RESP_THEMES[k] || { color: '#71717a', text: 'text-zinc-400', bg: 'bg-zinc-800/40', label: k };
                    const Icon = t.icon || Circle;
                    const pct = ((v / total) * 100).toFixed(0);
                    return (
                        <div key={k} className={`rounded-xl p-4 border border-white/5 ${t.bg}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className={`w-4 h-4 ${t.text}`} />
                                <span className={`text-xs font-bold ${t.text}`}>{t.label || k}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-white font-mono leading-none">{v}</span>
                                <span className="text-xs text-slate-500">{pct}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ───────── Family overview ─────────
// A calm grid of the NIST 800-53 families. Each card shows the family's control
// count and a mini ownership bar, and acts as the entry point into the detailed
// browser (click → opens the browser filtered to that family). This lets a
// reviewer grasp the structure without scrolling the full list.
const FamilyOverview = ({ controls, activeFamily, onSelectFamily }) => {
    const families = useMemo(() => {
        const map = new Map();
        controls.forEach(c => {
            if (c.applicability === 'Not Applicable') return;
            const key = familyKey(c.family);
            if (!key) return;
            if (!map.has(key)) map.set(key, { id: key, full: c.family, count: 0, resp: {} });
            const e = map.get(key);
            e.count += 1;
            e.resp[c.responsibility] = (e.resp[c.responsibility] || 0) + 1;
        });
        return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
    }, [controls]);

    return (
        <div className="bg-[#121217] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">Control families</h3>
                <span className="text-xs text-slate-500">{families.length} families · click to browse</span>
            </div>
            <p className="text-xs text-slate-500 mb-5">Each NIST 800-53 family at a glance — the bar shows how ownership splits within it.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {families.map(f => {
                    const accent = familyAccent(f.full);
                    const label = (f.full || '').split(' - ')[1] || f.full;
                    const on = activeFamily === f.id;
                    const respEntries = RESP_ORDER.filter(k => f.resp[k]);
                    return (
                        <button
                            key={f.id}
                            onClick={() => onSelectFamily(f.id)}
                            className={`text-left rounded-xl border p-4 transition-all ${on
                                ? 'border-white/25 bg-white/[0.05]'
                                : 'border-white/[0.06] bg-[#0f0f12] hover:border-white/15 hover:bg-white/[0.03]'}`}
                        >
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-base font-mono font-extrabold" style={{ color: accent }}>{f.id}</span>
                                    <span className="text-xs text-slate-400 truncate">{label}</span>
                                </div>
                                <span className="text-lg font-bold text-white font-mono shrink-0">{f.count}</span>
                            </div>
                            <div className="flex h-1.5 rounded-full overflow-hidden bg-zinc-900">
                                {respEntries.map(k => {
                                    const t = RESP_THEMES[k];
                                    return (
                                        <div key={k} className="h-full"
                                            style={{ width: `${(f.resp[k] / f.count) * 100}%`, background: t?.color || '#71717a' }}
                                            title={`${k}: ${f.resp[k]}`} />
                                    );
                                })}
                            </div>
                        </button>
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
    const accent = familyAccent(ctrl.family);

    return (
        <div className={`rounded-xl border transition-all ${isExpanded ? 'border-white/20 bg-white/[0.03]' : 'border-white/[0.06] bg-[#0f0f12] hover:border-white/10'}`}>
            <button
                onClick={onToggle}
                className="w-full text-left p-4 flex items-start gap-3"
            >
                <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: accent }} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                        <span className="text-sm font-mono font-bold text-white">{ctrl.control_id}</span>
                        <OwnershipChip responsibility={ctrl.responsibility} />
                        {ctrl.applicability === 'Not Applicable' && (
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">N/A</span>
                        )}
                        {ctrl.applicability === 'Voluntary' && (
                            <span className="text-[10px] bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">Voluntary</span>
                        )}
                    </div>
                    <div className="text-[15px] text-slate-100 font-medium leading-snug pr-4">{ctrl.control_name}</div>
                    {/* Quiet metadata line — family + KSI/CMMC presence, no competing colors */}
                    <div className="flex items-center gap-2 flex-wrap mt-2 text-[11px] text-slate-500">
                        <span className="font-semibold uppercase tracking-wide" style={{ color: accent }}>{familyKey(ctrl.family)}</span>
                        <span className="text-slate-600 truncate">{(ctrl.family || '').split(' - ')[1] || ''}</span>
                        {ctrl.ksis?.length > 0 && (
                            <span>· {ctrl.ksis.length} KSI{ctrl.ksis.length === 1 ? '' : 's'}</span>
                        )}
                        {ctrl.cmmc && <span className="text-indigo-400/80 font-semibold">· CMMC L2</span>}
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
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5">
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
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5">
                                <AlertCircle className="w-3 h-3" /> Applicability Rationale
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{ctrl.applicability_rationale}</p>
                        </div>
                    )}
                    {ctrl.ksis?.length > 0 && (
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5">
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
                            <div className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
                                <Landmark className="w-3 h-3" /> CMMC 2.0 L2 / CUI / DoD Cross-Reference
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">CMMC L2 Practice <span className="text-slate-600 normal-case">(800-171)</span></div>
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
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">CUI Obligation <span className="text-slate-600 normal-case">(DoDI 5200.48)</span></div>
                                    <div className="text-[11px] text-slate-300 leading-snug">{ctrl.cui_obligation || '—'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Coverage Disposition</div>
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
const ControlBrowser = ({ controls, mode, activeFamily, setActiveFamily, onCollapse }) => {
    const [search, setSearch] = useState('');
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
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={hideNA}
                            onChange={e => setHideNA(e.target.checked)}
                            className="accent-blue-500"
                        />
                        Hide N/A controls
                    </label>
                    {onCollapse && (
                        <button
                            onClick={onCollapse}
                            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
                        >
                            <ChevronDown className="w-3.5 h-3.5 rotate-180" /> Collapse
                        </button>
                    )}
                </div>
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

// ───────── Controls section (summary-first composition) ─────────
// Leads with the calm overview (ownership digest + family cards), then keeps the
// dense 185-row browser behind an explicit toggle so the default view stays
// readable. Selecting a family card opens the browser pre-filtered to it.
const ControlsSection = ({ controls, modeSummary, mode, setMode }) => {
    const [browserOpen, setBrowserOpen] = useState(false);
    const [activeFamily, setActiveFamily] = useState(null);
    const browserRef = useRef(null);

    const openBrowserAt = (familyId) => {
        setActiveFamily(familyId);
        setBrowserOpen(true);
        requestAnimationFrame(() => browserRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };

    return (
        <div className="space-y-6">
            <ModeToggle mode={mode} setMode={setMode} />
            <ModeLegend mode={mode} />
            <OwnershipDigest counts={modeSummary?.by_responsibility} total={modeSummary?.total} />
            <FamilyOverview controls={controls} activeFamily={browserOpen ? activeFamily : null} onSelectFamily={openBrowserAt} />

            <div ref={browserRef}>
                {browserOpen ? (
                    <ControlBrowser
                        controls={controls}
                        mode={mode}
                        activeFamily={activeFamily}
                        setActiveFamily={setActiveFamily}
                        onCollapse={() => setBrowserOpen(false)}
                    />
                ) : (
                    <button
                        onClick={() => setBrowserOpen(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#121217] hover:bg-white/[0.04] py-4 text-sm font-bold text-slate-200 transition-all"
                    >
                        <Search className="w-4 h-4 text-blue-400" />
                        Browse &amp; search all {controls.length} controls
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                    </button>
                )}
            </div>
        </div>
    );
};

// ───────── App Security Controls capsule ─────────
const AppSecCapsule = ({ items, summary, embedded = false }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);
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
        return items.filter(i => {
            if (activeCategory && (i.category || 'Other') !== activeCategory) return false;
            if (!q) return true;
            return (
                (i.config_id || '').toLowerCase().includes(q) ||
                (i.title || '').toLowerCase().includes(q) ||
                (i.functional_area || '').toLowerCase().includes(q) ||
                i.nist?.some(n => n.toLowerCase().includes(q)) ||
                i.ksis?.some(k => k.toLowerCase().includes(q))
            );
        });
    }, [items, search, activeCategory]);

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
                    {/* Category tiles — click to filter the list */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mt-4">
                        {categories.map(([c, count]) => {
                            const on = activeCategory === c;
                            return (
                                <button
                                    key={c}
                                    onClick={() => setActiveCategory(on ? null : c)}
                                    className={`text-left rounded-lg p-3 border transition-all ${on
                                        ? 'border-cyan-500/40 bg-cyan-500/[0.06]'
                                        : 'border-white/5 bg-[#0f0f12] hover:border-white/15 hover:bg-white/[0.03]'}`}
                                >
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1 truncate">{c}</div>
                                    <div className="text-2xl font-extrabold text-white font-mono">{count}</div>
                                </button>
                            );
                        })}
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
                    <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
                        <div className="text-xs text-slate-500">
                            Showing <span className="text-slate-300 font-bold font-mono">{Math.min(filtered.length, 100)}</span> of {filtered.length}
                        </div>
                        {activeCategory && (
                            <button
                                onClick={() => setActiveCategory(null)}
                                className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300"
                            >
                                <Filter className="w-3 h-3" /> Filtered to <span className="text-slate-300 font-semibold">{activeCategory}</span>
                                <span className="text-cyan-400 underline">Clear</span>
                            </button>
                        )}
                    </div>
                    <div className="mt-2 space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                        {filtered.slice(0, 100).map(i => (
                            <div key={i.config_id} className="bg-[#0f0f12] border border-white/5 rounded-lg p-3.5">
                                <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                                    <span className="text-[11px] font-mono font-bold text-cyan-400">{i.config_id}</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">{i.category}</span>
                                    {i.subarea && <span className="text-[10px] text-slate-600">/ {i.subarea}</span>}
                                </div>
                                <div className="text-sm text-slate-100 leading-snug">{i.title}</div>
                                {(i.nist?.length || i.ksis?.length) && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {i.nist?.map(n => (
                                            <span key={n} className="text-[10px] font-mono bg-white/[0.04] text-slate-400 px-1.5 py-0.5 rounded border border-white/5">
                                                {n}
                                            </span>
                                        ))}
                                        {i.ksis?.map(k => (
                                            <span key={k} className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                {k}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="text-center text-sm text-slate-500 py-8">No settings match the current filters.</div>
                        )}
                        {filtered.length > 100 && (
                            <div className="text-center text-[11px] text-slate-500 py-2">
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
                            <div className="flex items-center gap-2 mb-2.5">
                                <span className="text-xs uppercase tracking-wide font-bold text-blue-400">{theme}</span>
                                <span className="text-[10px] text-slate-600 font-mono">{list.length}</span>
                            </div>
                            <div className="space-y-1.5">
                                {list.map(k => (
                                    <div key={k.ksi_id} className="bg-[#0f0f12] border border-white/5 rounded-lg p-3.5">
                                        <div className="flex items-start gap-3">
                                            <span className="text-[11px] font-mono font-bold text-blue-400 shrink-0 mt-0.5">{k.ksi_id}</span>
                                            <div className="flex-1">
                                                <div className="text-sm text-slate-100 leading-snug">{k.description}</div>
                                                {k.nist_controls && (
                                                    <div className="text-[11px] text-slate-500 font-mono mt-1.5">
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
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded border ${t.bg} ${t.border} ${t.text} whitespace-nowrap`}>
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
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 font-bold uppercase tracking-wide">RFP Crosswalk</span>
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
                            <div className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 mb-2.5 flex items-center gap-1.5">
                                <Stamp className="w-3.5 h-3.5" /> CUI Handling Requirements — DoDI 5200.48 / DAFI 16-1403
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-white/10">
                                <table className="w-full text-left border-collapse min-w-[640px]">
                                    <thead>
                                        <tr className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-slate-500">
                                            <th className="px-3 py-2.5 font-bold">Requirement</th>
                                            <th className="px-3 py-2.5 font-bold">Primary Controls</th>
                                            <th className="px-3 py-2.5 font-bold">Coverage</th>
                                            <th className="px-3 py-2.5 font-bold">Responsibility &amp; Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {map.cui_handling.map((row, i) => (
                                            <tr key={i} className="border-t border-white/5 align-top">
                                                <td className="px-3 py-3 text-xs font-semibold text-slate-200 whitespace-nowrap">{row.requirement}</td>
                                                <td className="px-3 py-3 text-[11px] font-mono text-slate-400">{row.primary_controls}</td>
                                                <td className="px-3 py-3"><CoverageBadge value={row.coverage} /></td>
                                                <td className="px-3 py-3 text-xs text-slate-400 leading-relaxed">{row.notes}</td>
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
                            <div className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 mb-2.5 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" /> NIST 800-171 / CMMC Level 2 Family Coverage ({map.family_coverage.length} domains)
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {map.family_coverage.map((row, i) => (
                                    <div key={i} className="bg-[#0f0f12] border border-white/5 rounded-lg p-3.5">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="text-sm font-bold text-slate-100">{row.domain}</span>
                                            <CoverageBadge value={row.coverage} />
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                            {(row.ksi_family || '').split(',').map(f => f.trim()).filter(Boolean).map(f => (
                                                <span key={f} className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold">
                                                    {f.includes('(') || f.includes('Inherited') ? f : `KSI-${f}`}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="text-[11px] text-slate-500 leading-relaxed">{row.notes}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Scope notes */}
                    {map.scope_notes?.length > 0 && (
                        <div>
                            <div className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 mb-2.5 flex items-center gap-1.5">
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
                <ControlsSection controls={controls} modeSummary={modeSummary} mode={mode} setMode={setMode} />
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
