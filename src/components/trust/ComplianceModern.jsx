import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search, X, ChevronDown, ChevronRight, Download, Layers, KeyRound, Landmark,
    ShieldCheck, Sparkles, Filter, SlidersHorizontal,
} from 'lucide-react';
import { BASE_PATH } from '../../config/theme';
import { cn, Card, Badge, IconChip, StackBar, Stat, SectionHeading, SHADOW_SM } from './saas';

const RESP = {
    Customer: { color: '#f59e0b', label: 'Customer', badge: 'amber' },
    Shared: { color: '#6366f1', label: 'Shared', badge: 'brand' },
    Meridian: { color: '#10b981', label: 'Meridian', badge: 'green' },
    'Inherited (AWS)': { color: '#8b5cf6', label: 'Inherited (AWS)', badge: 'violet' },
};
const RESP_ORDER = ['Customer', 'Shared', 'Meridian', 'Inherited (AWS)'];
const familyKey = (f) => (f || '').split(' - ')[0];
const familyName = (f) => (f || '').split(' - ')[1] || '';

const coverageBadge = (v) => {
    const c = (v || '').toLowerCase();
    if (c.includes('inherit')) return 'violet';
    if (c.startsWith('covered')) return 'green';
    if (c.startsWith('partial') || c.startsWith('customer') || c.startsWith('gov')) return 'amber';
    return 'gray';
};

// ───────── Owner pill ─────────
const Owner = ({ value }) => {
    const r = RESP[value] || RESP.Customer;
    return <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-gray-600">
        <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />{r.label}
    </span>;
};

// ───────── Accordion ─────────
const Accordion = ({ icon, gradient, title, meta, children, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <Card>
            <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-4 p-5 text-left">
                <IconChip icon={icon} gradient={gradient} />
                <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-gray-900">{title}</div>
                    {meta && <div className="text-[13px] text-gray-500 mt-0.5">{meta}</div>}
                </div>
                <ChevronDown className={cn('w-5 h-5 text-gray-400 transition-transform shrink-0', open && 'rotate-180')} />
            </button>
            {open && <div className="px-5 pb-5 border-t border-gray-100 pt-4">{children}</div>}
        </Card>
    );
};

// ───────── Control browser ─────────
const ControlBrowser = ({ controls, familyFilter, setFamilyFilter }) => {
    const [search, setSearch] = useState('');
    const [respFilter, setRespFilter] = useState(null);
    const [expanded, setExpanded] = useState(new Set());
    const [hideNA, setHideNA] = useState(true);

    const respCounts = useMemo(() => {
        const m = {}; controls.forEach(c => { if (c.applicability !== 'Not Applicable') m[c.responsibility] = (m[c.responsibility] || 0) + 1; }); return m;
    }, [controls]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return controls.filter(c => {
            if (hideNA && c.applicability === 'Not Applicable') return false;
            if (familyFilter && familyKey(c.family) !== familyFilter) return false;
            if (respFilter && c.responsibility !== respFilter) return false;
            if (!q) return true;
            return (c.control_id || '').toLowerCase().includes(q) || (c.control_name || '').toLowerCase().includes(q)
                || (c.implementation_notes || '').toLowerCase().includes(q) || (c.cmmc || '').toLowerCase().includes(q)
                || c.ksis?.some(k => k.toLowerCase().includes(q));
        });
    }, [controls, search, familyFilter, respFilter, hideNA]);

    const toggle = (id) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

    return (
        <Card className="overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search controls, KSIs, CMMC practices…"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-9 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition" />
                        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
                    </div>
                    <label className="flex items-center gap-2 text-[13px] text-gray-500 cursor-pointer select-none">
                        <input type="checkbox" checked={hideNA} onChange={e => setHideNA(e.target.checked)} className="accent-indigo-600 w-4 h-4" /> Hide N/A
                    </label>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                    {Object.entries(respCounts).map(([r, n]) => {
                        const on = respFilter === r; const t = RESP[r]; if (!t) return null;
                        return (
                            <button key={r} onClick={() => setRespFilter(on ? null : r)}
                                className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium border transition',
                                    on ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white')}
                                style={on ? { background: t.color } : undefined}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? '#fff' : t.color }} />{t.label}<span className={on ? 'opacity-80' : 'text-gray-400'}>{n}</span>
                            </button>
                        );
                    })}
                    {(familyFilter || respFilter || search) && (
                        <button onClick={() => { setFamilyFilter(null); setRespFilter(null); setSearch(''); }} className="text-[12px] text-indigo-600 font-semibold hover:underline ml-1">Clear all</button>
                    )}
                </div>
            </div>
            {/* Rows */}
            <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-100">
                {filtered.length === 0 ? (
                    <div className="py-16 text-center text-[14px] text-gray-400">No controls match the current filters.</div>
                ) : filtered.map(c => {
                    const on = expanded.has(c.control_id);
                    return (
                        <div key={c.control_id}>
                            <button onClick={() => toggle(c.control_id)} className={cn('w-full text-left flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50/80 transition', on && 'bg-indigo-50/40')}>
                                <ChevronRight className={cn('w-4 h-4 text-gray-300 mt-1 shrink-0 transition-transform', on && 'rotate-90 text-indigo-500')} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono text-[13px] font-bold text-indigo-600">{c.control_id}</span>
                                        <span className="text-[14px] font-medium text-gray-900">{c.control_name}</span>
                                        {c.applicability === 'Not Applicable' && <Badge variant="gray">N/A</Badge>}
                                        {c.applicability === 'Voluntary' && <Badge variant="sky">Voluntary</Badge>}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                        <Owner value={c.responsibility} />
                                        <span className="text-[12px] text-gray-400">{familyKey(c.family)} · {familyName(c.family)}</span>
                                        {c.ksis?.length > 0 && <span className="text-[12px] text-gray-400">· {c.ksis.length} KSI</span>}
                                        {c.cmmc && <span className="text-[12px] text-violet-500 font-medium">· CMMC L2</span>}
                                    </div>
                                </div>
                            </button>
                            {on && (
                                <div className="px-4 pb-4 pl-11 space-y-3 text-[13px] text-gray-600 bg-indigo-50/20">
                                    {c.implementation_notes && (
                                        <p className="leading-relaxed pt-1">{c.implementation_notes.split('|').map((p, i) => (
                                            <span key={i} className={i ? 'block text-gray-500 mt-1.5' : ''}>{p.trim()}</span>))}</p>
                                    )}
                                    {c.ksis?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 items-center">
                                            {c.ksis.map(k => <Badge key={k} variant="brand">{k}</Badge>)}
                                        </div>
                                    )}
                                    {(c.cmmc || c.cui_obligation) && (
                                        <div className="rounded-xl bg-white border border-gray-100 p-3 grid sm:grid-cols-3 gap-3">
                                            <div><div className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mb-1">CMMC L2</div><div className="font-mono text-[12px] text-gray-700">{c.cmmc || '—'}</div></div>
                                            <div><div className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mb-1">CUI Obligation</div><div className="text-[12.5px] text-gray-700">{c.cui_obligation || '—'}</div></div>
                                            <div><div className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mb-1">Coverage</div>{c.cui_disposition ? <Badge variant={coverageBadge(c.cui_disposition)}>{c.cui_disposition}</Badge> : '—'}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="px-4 py-3 border-t border-gray-100 text-[12px] text-gray-400">{filtered.length} of {controls.length} controls</div>
        </Card>
    );
};

// ───────── Main ─────────
const ComplianceModern = () => {
    const [data, setData] = useState(null);
    const [mode, setMode] = useState('cloud');
    const [familyFilter, setFamilyFilter] = useState(null);
    const [browserOpen, setBrowserOpen] = useState(false);
    const browserRef = useRef(null);

    useEffect(() => {
        let dead = false;
        fetch(`${BASE_PATH}nist_crm.json`).then(r => r.ok ? r.json() : null).then(j => { if (!dead) setData(j); }).catch(() => { });
        return () => { dead = true; };
    }, []);

    const controls = data ? (mode === 'cloud' ? data.cloud_fedramp : data.on_prem) : [];
    const summary = data?.summary?.[mode === 'cloud' ? 'cloud_fedramp' : 'on_prem'];

    const families = useMemo(() => {
        const m = new Map();
        controls.forEach(c => {
            if (c.applicability === 'Not Applicable') return;
            const k = familyKey(c.family); if (!k) return;
            if (!m.has(k)) m.set(k, { id: k, full: c.family, count: 0, resp: {} });
            const e = m.get(k); e.count += 1; e.resp[c.responsibility] = (e.resp[c.responsibility] || 0) + 1;
        });
        return Array.from(m.values()).sort((a, b) => a.id.localeCompare(b.id));
    }, [controls]);

    const openBrowser = (fam) => { setFamilyFilter(fam); setBrowserOpen(true); requestAnimationFrame(() => browserRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); };

    if (!data) return <Card className="p-12 text-center text-[14px] text-gray-400">Loading responsibility matrix…</Card>;

    const ownership = RESP_ORDER.map(k => ({ label: k, value: summary?.by_responsibility?.[k] || 0, color: RESP[k].color })).filter(s => s.value > 0);
    const frameworks = [
        { icon: Layers, gradient: 'indigo', value: summary?.total ?? '—', label: 'NIST 800-53 Rev 5', sub: 'Moderate baseline' },
        { icon: KeyRound, gradient: 'sky', value: summary?.by_applicability?.['KSI-Mapped'] ?? '—', label: 'FedRAMP 20x KSIs', sub: 'Indicators mapped' },
        { icon: Landmark, gradient: 'violet', value: data.cmmc_cui?.family_coverage?.length ?? 14, label: 'CMMC 2.0 L2 Domains', sub: 'NIST 800-171' },
        { icon: ShieldCheck, gradient: 'emerald', value: data.cmmc_cui?.cui_handling?.length ?? 7, label: 'CUI Requirements', sub: 'DoDI 5200.48' },
    ];

    return (
        <div className="space-y-8">
            {/* Mode toggle + download */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="inline-flex p-1 bg-gray-100 rounded-xl">
                    {[['cloud', 'Cloud (AWS)'], ['on_prem', 'On-Premises']].map(([k, label]) => (
                        <button key={k} onClick={() => { setMode(k); setFamilyFilter(null); }}
                            className={cn('px-4 py-2 rounded-lg text-[13px] font-semibold transition-all', mode === k ? 'bg-white text-indigo-600 ' + SHADOW_SM : 'text-gray-500 hover:text-gray-700')}>
                            {label}
                        </button>
                    ))}
                </div>
                <a href={`${BASE_PATH}Meridian_LMS_CRM_NIST_800-53_Rev5_CMMC_CUI.xlsx`} download
                    className="inline-flex items-center gap-2 text-[13px] font-semibold text-gray-600 hover:text-indigo-600 transition">
                    <Download className="w-4 h-4" /> Download full matrix (XLSX)
                </a>
            </div>

            {/* Framework cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {frameworks.map((f, i) => (
                    <Card key={i} className="p-5" hover>
                        <IconChip icon={f.icon} gradient={f.gradient} />
                        <div className="mt-4 text-[28px] font-bold text-gray-900 tracking-tight leading-none">{f.value}</div>
                        <div className="mt-1.5 text-[13px] font-semibold text-gray-700">{f.label}</div>
                        <div className="text-[12px] text-gray-400">{f.sub}</div>
                    </Card>
                ))}
            </div>

            {/* Ownership + families */}
            <div className="grid lg:grid-cols-[340px_1fr] gap-6">
                <Card className="p-6">
                    <div className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Shared Responsibility</div>
                    <div className="text-[15px] text-gray-400 mb-5">{summary?.total} controls assessed</div>
                    <StackBar segments={ownership} height="h-3" />
                    <div className="mt-5 space-y-3">
                        {ownership.map(s => (
                            <div key={s.label} className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-2 text-[13px] text-gray-600 font-medium">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />{RESP[s.label].label}
                                </span>
                                <span className="text-[14px] font-bold text-gray-900 font-mono">{s.value}
                                    <span className="text-[12px] text-gray-400 font-sans font-normal ml-1.5">{((s.value / summary.total) * 100).toFixed(0)}%</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Control Families</span>
                        <span className="text-[12px] text-gray-400">{families.length} families · click to browse</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {families.map(f => {
                            const segs = RESP_ORDER.filter(k => f.resp[k]).map(k => ({ label: k, value: f.resp[k], color: RESP[k].color }));
                            return (
                                <button key={f.id} onClick={() => openBrowser(f.id)}
                                    className={cn('text-left bg-white border border-gray-200/70 rounded-xl p-3.5 transition-all hover:-translate-y-0.5 hover:border-indigo-200', SHADOW_SM)}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-[15px] font-bold text-indigo-600">{f.id}</span>
                                        <span className="font-mono text-[14px] font-bold text-gray-900">{f.count}</span>
                                    </div>
                                    <div className="text-[12px] text-gray-500 truncate mt-0.5 mb-2.5">{familyName(f.full)}</div>
                                    <StackBar segments={segs} height="h-1.5" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Browser */}
            <div ref={browserRef}>
                {browserOpen ? <ControlBrowser controls={controls} familyFilter={familyFilter} setFamilyFilter={setFamilyFilter} /> : (
                    <button onClick={() => setBrowserOpen(true)}
                        className={cn('w-full flex items-center justify-center gap-2.5 bg-white border border-gray-200/70 rounded-2xl py-4 text-[14px] font-semibold text-gray-700 hover:text-indigo-600 hover:border-indigo-200 transition-all', SHADOW_SM)}>
                        <Search className="w-4 h-4" /> Browse &amp; search all {controls.length} controls <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Appendices */}
            <div className="space-y-4">
                <CmmcAccordion map={data.cmmc_cui} />
                <KsiAccordion items={data.ksi_reference} />
                <AppSecAccordion items={data.app_sec} summary={data.summary?.app_sec} />
            </div>
        </div>
    );
};

// ───────── CMMC / CUI ─────────
const CmmcAccordion = ({ map }) => {
    if (!map) return null;
    return (
        <Accordion icon={Landmark} gradient="violet" title="CMMC 2.0 Level 2 · CUI / DoD Crosswalk"
            meta={`NIST SP 800-171 Rev 2 · DoDI 5200.48 · ${map.family_coverage?.length ?? 14} domains · ${map.cui_handling?.length ?? 7} CUI requirements`}>
            {map.cui_handling?.length > 0 && (
                <div className="overflow-x-auto -mx-1">
                    <table className="w-full min-w-[560px]">
                        <thead><tr className="text-[11px] uppercase tracking-wide text-gray-400 text-left border-b border-gray-100">
                            <th className="font-semibold py-2 pr-3">Requirement</th><th className="font-semibold py-2 pr-3">Controls</th><th className="font-semibold py-2">Coverage</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-50">
                            {map.cui_handling.map((r, i) => (
                                <tr key={i} className="align-top">
                                    <td className="py-2.5 pr-3 text-[13px] font-medium text-gray-800 whitespace-nowrap">{r.requirement}</td>
                                    <td className="py-2.5 pr-3 text-[12px] font-mono text-gray-500">{r.primary_controls}</td>
                                    <td className="py-2.5"><Badge variant={coverageBadge(r.coverage)}>{r.coverage}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {map.family_coverage?.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-5">
                    {map.family_coverage.map((r, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50">
                            <span className="text-[13px] text-gray-700">{r.domain}</span><Badge variant={coverageBadge(r.coverage)}>{r.coverage}</Badge>
                        </div>
                    ))}
                </div>
            )}
        </Accordion>
    );
};

const KsiAccordion = ({ items }) => {
    const themes = useMemo(() => {
        const m = new Map(); (items || []).forEach(k => { if (!m.has(k.theme)) m.set(k.theme, []); m.get(k.theme).push(k); });
        return Array.from(m.entries());
    }, [items]);
    if (!items?.length) return null;
    return (
        <Accordion icon={KeyRound} gradient="sky" title="FedRAMP 20x KSI Reference" meta={`${items.length} Key Security Indicators across ${themes.length} themes`}>
            <div className="space-y-5">
                {themes.map(([theme, list]) => (
                    <div key={theme}>
                        <div className="text-[12px] font-semibold uppercase tracking-wide text-indigo-600 mb-2">{theme}</div>
                        <div className="space-y-1.5">
                            {list.map(k => (
                                <div key={k.ksi_id} className="flex gap-3 items-start">
                                    <span className="font-mono text-[12px] font-bold text-indigo-600 w-24 shrink-0 pt-0.5">{k.ksi_id}</span>
                                    <span className="text-[13px] text-gray-600 leading-snug">{k.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Accordion>
    );
};

const AppSecAccordion = ({ items, summary }) => {
    const [search, setSearch] = useState('');
    if (!items?.length) return null;
    const q = search.trim().toLowerCase();
    const filtered = q ? items.filter(i => (i.title || '').toLowerCase().includes(q) || (i.config_id || '').toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q)) : items;
    return (
        <Accordion icon={Sparkles} gradient="amber" title="Application Security Configuration" meta={`${summary?.total ?? items.length} settings in the Secure Configuration Guide`}>
            <div className="relative mb-3">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search settings…"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white" />
            </div>
            <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
                {filtered.slice(0, 120).map(i => (
                    <div key={i.config_id} className="flex gap-3 py-2.5">
                        <span className="font-mono text-[12px] font-bold text-indigo-600 w-20 shrink-0 pt-0.5">{i.config_id}</span>
                        <div className="min-w-0">
                            <div className="text-[13px] text-gray-800 leading-snug">{i.title}</div>
                            <div className="text-[11px] uppercase tracking-wide text-gray-400 mt-0.5">{i.category}{i.subarea ? ` · ${i.subarea}` : ''}</div>
                        </div>
                    </div>
                ))}
                {filtered.length > 120 && <div className="text-center text-[12px] text-gray-400 py-3">Showing first 120 of {filtered.length}.</div>}
            </div>
        </Accordion>
    );
};

export default ComplianceModern;
