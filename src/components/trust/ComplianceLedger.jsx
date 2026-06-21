import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, ChevronRight, Download, Plus, Minus } from 'lucide-react';
import { BASE_PATH } from '../../config/theme';
import { cn, C, RULE, PANEL, Kicker, Tag, Figure, ProportionBar } from './dossier';

// Shared-responsibility palette (editorial, muted)
const RESP = {
    Customer: { color: C.customer, label: 'Customer' },
    Shared: { color: C.shared, label: 'Shared' },
    Meridian: { color: C.meridian, label: 'Meridian' },
    'Inherited (AWS)': { color: C.inherited, label: 'Inherited (AWS)' },
};
const RESP_ORDER = ['Customer', 'Shared', 'Meridian', 'Inherited (AWS)'];
const familyKey = (f) => (f || '').split(' - ')[0];
const familyName = (f) => (f || '').split(' - ')[1] || '';

const coverageTone = (v) => {
    const c = (v || '').toLowerCase();
    if (c.startsWith('inherit') || c.includes('inherit')) return 'navy';
    if (c.startsWith('covered')) return 'good';
    if (c.startsWith('partial') || c.startsWith('customer') || c.startsWith('gov')) return 'warn';
    return 'ink';
};

// ───────── Owner mark (text + dot) ─────────
const Owner = ({ value }) => {
    const r = RESP[value] || RESP.Customer;
    return (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-[#3a382f] whitespace-nowrap">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
            {r.label}
        </span>
    );
};

// ───────── Collapsible appendix ─────────
const Appendix = ({ title, meta, children }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className={cn('border rounded-sm', RULE, PANEL)}>
            <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
                <div>
                    <div className="font-serif text-[17px] text-[#1c1b17]">{title}</div>
                    {meta && <div className="text-[12px] text-[#6c685f] mt-0.5">{meta}</div>}
                </div>
                {open ? <Minus className="w-4 h-4 text-[#6c685f]" /> : <Plus className="w-4 h-4 text-[#6c685f]" />}
            </button>
            {open && <div className={cn('px-5 pb-5 border-t', RULE)}>{children}</div>}
        </div>
    );
};

// ───────── Control browser (ruled table) ─────────
const ControlBrowser = ({ controls, mode, familyFilter, setFamilyFilter }) => {
    const [search, setSearch] = useState('');
    const [respFilter, setRespFilter] = useState(null);
    const [expanded, setExpanded] = useState(new Set());
    const [hideNA, setHideNA] = useState(true);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return controls.filter(c => {
            if (hideNA && c.applicability === 'Not Applicable') return false;
            if (familyFilter && familyKey(c.family) !== familyFilter) return false;
            if (respFilter && c.responsibility !== respFilter) return false;
            if (!q) return true;
            return (c.control_id || '').toLowerCase().includes(q)
                || (c.control_name || '').toLowerCase().includes(q)
                || (c.implementation_notes || '').toLowerCase().includes(q)
                || (c.cmmc || '').toLowerCase().includes(q)
                || c.ksis?.some(k => k.toLowerCase().includes(q));
        });
    }, [controls, search, familyFilter, respFilter, hideNA]);

    const toggle = (id) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

    return (
        <div className={cn('border rounded-sm', RULE, PANEL)}>
            {/* Toolbar */}
            <div className={cn('flex flex-wrap items-center gap-3 p-4 border-b', RULE)}>
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 text-[#928d81] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search controls, KSIs, CMMC practices…"
                        className="w-full bg-[#f3f1ea] border border-[#1c1b17]/15 rounded-sm pl-9 pr-8 py-2 text-[13px] text-[#1c1b17] placeholder:text-[#928d81] focus:outline-none focus:border-[#1e3a5f]/50" />
                    {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#928d81] hover:text-[#1c1b17]"><X className="w-3.5 h-3.5" /></button>}
                </div>
                <label className="flex items-center gap-2 text-[12px] text-[#6c685f] cursor-pointer select-none">
                    <input type="checkbox" checked={hideNA} onChange={e => setHideNA(e.target.checked)} style={{ accentColor: C.navy }} /> Hide N/A
                </label>
            </div>
            {/* Active filters */}
            {(familyFilter || respFilter) && (
                <div className={cn('flex items-center gap-2 px-4 py-2.5 border-b text-[12px] text-[#6c685f]', RULE)}>
                    <span>Filtered:</span>
                    {familyFilter && <Tag tone="navy" mono>{familyFilter}</Tag>}
                    {respFilter && <Owner value={respFilter} />}
                    <button onClick={() => { setFamilyFilter(null); setRespFilter(null); }} className="text-[#1e3a5f] underline ml-1">Clear</button>
                </div>
            )}
            {/* Column header */}
            <div className={cn('hidden md:grid grid-cols-[110px_1fr_140px_120px] gap-3 px-4 py-2.5 border-b text-[10px] uppercase tracking-[0.1em] text-[#928d81] font-semibold', RULE)}>
                <span>Control</span><span>Name</span><span>Owner</span><span>Mapping</span>
            </div>
            {/* Rows */}
            <div className="max-h-[560px] overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="px-4 py-12 text-center text-[13px] text-[#928d81]">No controls match the current filters.</div>
                ) : filtered.map(c => {
                    const on = expanded.has(c.control_id);
                    return (
                        <div key={c.control_id} className={cn('border-t first:border-t-0', RULE)}>
                            <button onClick={() => toggle(c.control_id)}
                                className={cn('w-full text-left grid grid-cols-1 md:grid-cols-[110px_1fr_140px_120px] gap-1.5 md:gap-3 px-4 py-3 items-baseline hover:bg-[#f3f1ea]/70 transition-colors', on && 'bg-[#f3f1ea]/60')}>
                                <span className="font-mono text-[13px] font-semibold text-[#1e3a5f] flex items-center gap-1.5">
                                    <ChevronRight className={cn('w-3.5 h-3.5 text-[#928d81] transition-transform shrink-0', on && 'rotate-90')} />
                                    {c.control_id}
                                </span>
                                <span className="text-[13.5px] text-[#1c1b17] leading-snug">{c.control_name}
                                    {c.applicability === 'Not Applicable' && <Tag className="ml-2" tone="ink">N/A</Tag>}
                                    {c.applicability === 'Voluntary' && <Tag className="ml-2" tone="navy">Voluntary</Tag>}
                                </span>
                                <span className="md:pt-0"><Owner value={c.responsibility} /></span>
                                <span className="text-[12px] text-[#6c685f] font-mono">
                                    {c.ksis?.length ? `${c.ksis.length} KSI` : '—'}{c.cmmc ? ' · CMMC' : ''}
                                </span>
                            </button>
                            {on && (
                                <div className={cn('px-4 md:pl-[126px] pb-4 pt-1 space-y-3 text-[13px] text-[#3a382f]')}>
                                    {c.implementation_notes && (
                                        <p className="leading-relaxed">{c.implementation_notes.split('|').map((p, i) => (
                                            <span key={i} className={i ? 'block text-[#6c685f] mt-1.5' : ''}>{p.trim()}</span>
                                        ))}</p>
                                    )}
                                    {c.ksis?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 items-center">
                                            <Kicker className="mr-1">KSIs</Kicker>
                                            {c.ksis.map(k => <Tag key={k} tone="navy" mono>{k}</Tag>)}
                                        </div>
                                    )}
                                    {(c.cmmc || c.cui_obligation) && (
                                        <div className={cn('border-t pt-2.5', RULE)}>
                                            <Kicker>CMMC 2.0 L2 / CUI</Kicker>
                                            <div className="mt-1.5 grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                                                {c.cmmc && <div><span className="text-[#6c685f]">Practice: </span><span className="font-mono">{c.cmmc}</span></div>}
                                                {c.cui_obligation && <div><span className="text-[#6c685f]">CUI: </span>{c.cui_obligation}</div>}
                                                {c.cui_disposition && <div><span className="text-[#6c685f]">Coverage: </span><Tag tone={coverageTone(c.cui_disposition)}>{c.cui_disposition}</Tag></div>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className={cn('px-4 py-2.5 border-t text-[12px] text-[#928d81]', RULE)}>
                {filtered.length} of {controls.length} controls shown
            </div>
        </div>
    );
};

// ───────── CMMC / CUI crosswalk ─────────
const CmmcCrosswalk = ({ map }) => {
    if (!map) return null;
    return (
        <Appendix title="CMMC 2.0 Level 2 · CUI / DoD Crosswalk"
            meta={`NIST SP 800-171 Rev 2 · DoDI 5200.48 · ${map.family_coverage?.length ?? 14} domains · ${map.cui_handling?.length ?? 7} CUI requirements`}>
            {map.cui_handling?.length > 0 && (
                <div className="mt-4">
                    <Kicker>CUI Handling Requirements</Kicker>
                    <div className="mt-2 overflow-x-auto">
                        <table className="w-full min-w-[560px] border-collapse">
                            <thead><tr className={cn('border-b text-[10px] uppercase tracking-[0.1em] text-[#928d81]', RULE)}>
                                <th className="text-left font-semibold py-2 pr-3">Requirement</th>
                                <th className="text-left font-semibold py-2 pr-3">Controls</th>
                                <th className="text-left font-semibold py-2">Coverage</th>
                            </tr></thead>
                            <tbody>
                                {map.cui_handling.map((r, i) => (
                                    <tr key={i} className={cn('border-b align-top', RULE)}>
                                        <td className="py-2.5 pr-3 text-[13px] font-medium text-[#1c1b17] whitespace-nowrap">{r.requirement}</td>
                                        <td className="py-2.5 pr-3 text-[12px] font-mono text-[#6c685f]">{r.primary_controls}</td>
                                        <td className="py-2.5"><Tag tone={coverageTone(r.coverage)}>{r.coverage}</Tag></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {map.family_coverage?.length > 0 && (
                <div className="mt-6">
                    <Kicker>NIST 800-171 / CMMC L2 Family Coverage</Kicker>
                    <div className="grid sm:grid-cols-2 gap-x-6 mt-2">
                        {map.family_coverage.map((r, i) => (
                            <div key={i} className={cn('flex items-center justify-between gap-3 py-2.5 border-t', RULE)}>
                                <span className="text-[13px] text-[#1c1b17]">{r.domain}</span>
                                <Tag tone={coverageTone(r.coverage)}>{r.coverage}</Tag>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Appendix>
    );
};

// ───────── KSI reference appendix ─────────
const KsiAppendix = ({ items }) => {
    const themes = useMemo(() => {
        const m = new Map();
        (items || []).forEach(k => { if (!m.has(k.theme)) m.set(k.theme, []); m.get(k.theme).push(k); });
        return Array.from(m.entries());
    }, [items]);
    if (!items?.length) return null;
    return (
        <Appendix title="FedRAMP 20x KSI Reference" meta={`${items.length} Key Security Indicators across ${themes.length} themes`}>
            <div className="mt-4 space-y-5">
                {themes.map(([theme, list]) => (
                    <div key={theme}>
                        <Kicker>{theme}</Kicker>
                        <div className="mt-1.5">
                            {list.map(k => (
                                <div key={k.ksi_id} className={cn('flex gap-3 py-2 border-t', RULE)}>
                                    <span className="font-mono text-[12px] font-semibold text-[#1e3a5f] shrink-0 w-24">{k.ksi_id}</span>
                                    <span className="text-[13px] text-[#3a382f] leading-snug">{k.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Appendix>
    );
};

// ───────── App security appendix ─────────
const AppSecAppendix = ({ items, summary }) => {
    const [search, setSearch] = useState('');
    if (!items?.length) return null;
    const q = search.trim().toLowerCase();
    const filtered = q ? items.filter(i => (i.title || '').toLowerCase().includes(q) || (i.config_id || '').toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q)) : items;
    return (
        <Appendix title="Application Security Configuration" meta={`${summary?.total ?? items.length} settings in the Meridian Secure Configuration Guide`}>
            <div className="relative mt-4 mb-2">
                <Search className="w-4 h-4 text-[#928d81] absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search settings…"
                    className="w-full bg-[#f3f1ea] border border-[#1c1b17]/15 rounded-sm pl-9 pr-3 py-2 text-[13px] text-[#1c1b17] placeholder:text-[#928d81] focus:outline-none focus:border-[#1e3a5f]/50" />
            </div>
            <div className="max-h-[360px] overflow-y-auto">
                {filtered.slice(0, 120).map(i => (
                    <div key={i.config_id} className={cn('flex gap-3 py-2.5 border-t', RULE)}>
                        <span className="font-mono text-[12px] font-semibold text-[#1e3a5f] shrink-0 w-20">{i.config_id}</span>
                        <div className="min-w-0">
                            <div className="text-[13px] text-[#1c1b17] leading-snug">{i.title}</div>
                            <div className="text-[11px] uppercase tracking-wide text-[#928d81] mt-0.5">{i.category}{i.subarea ? ` · ${i.subarea}` : ''}</div>
                        </div>
                    </div>
                ))}
                {filtered.length > 120 && <div className="text-center text-[12px] text-[#928d81] py-3">Showing first 120 of {filtered.length}.</div>}
            </div>
        </Appendix>
    );
};

// ───────── Main ─────────
const ComplianceLedger = () => {
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
    const modeSummary = data?.summary?.[mode === 'cloud' ? 'cloud_fedramp' : 'on_prem'];

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

    const openBrowser = (fam) => {
        setFamilyFilter(fam);
        setBrowserOpen(true);
        requestAnimationFrame(() => browserRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };

    if (!data) return <div className="text-[13px] text-[#928d81] py-8">Loading responsibility matrix…</div>;

    const ksiMapped = modeSummary?.by_applicability?.['KSI-Mapped'] ?? '—';
    const ownership = RESP_ORDER.map(k => ({ label: k, value: modeSummary?.by_responsibility?.[k] || 0, color: RESP[k].color }))
        .filter(s => s.value > 0);

    return (
        <div className="space-y-9">
            {/* Mode toggle */}
            <div className="flex items-center gap-1 text-[12px]">
                <Kicker className="mr-2">Deployment</Kicker>
                {[['cloud', 'Cloud (AWS) FedRAMP'], ['on_prem', 'On-Premises']].map(([k, label]) => (
                    <button key={k} onClick={() => { setMode(k); setFamilyFilter(null); }}
                        className={cn('px-3 py-1.5 rounded-sm border transition-colors',
                            mode === k ? 'border-[#1e3a5f]/40 bg-[#1e3a5f]/[0.06] text-[#1e3a5f] font-semibold' : 'border-transparent text-[#6c685f] hover:text-[#1c1b17]')}>
                        {label}
                    </button>
                ))}
                <a href={`${BASE_PATH}Meridian_LMS_CRM_NIST_800-53_Rev5_CMMC_CUI.xlsx`} download
                    className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-[#1e3a5f] hover:underline font-medium">
                    <Download className="w-3.5 h-3.5" /> Download XLSX
                </a>
            </div>

            {/* Framework figures */}
            <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-y', RULE)}>
                <Figure value={modeSummary?.total ?? '—'} label="Controls in scope" accent sub="NIST 800-53 Rev 5 · Moderate" />
                <Figure value={ksiMapped} label="KSI-mapped" sub="FedRAMP 20x indicators" />
                <Figure value={data.cmmc_cui?.family_coverage?.length ?? 14} label="CMMC L2 domains" sub="NIST 800-171 Rev 2" />
                <Figure value={data.cmmc_cui?.cui_handling?.length ?? 7} label="CUI requirements" sub="DoDI 5200.48" />
            </div>

            {/* Ownership */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <Kicker>Who owns what</Kicker>
                    <span className="text-[12px] text-[#928d81]">{modeSummary?.total} controls assessed</span>
                </div>
                <ProportionBar segments={ownership} />
                <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-3">
                    {ownership.map(s => (
                        <span key={s.label} className="inline-flex items-center gap-2 text-[12.5px] text-[#3a382f]">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                            {RESP[s.label].label} <span className="text-[#928d81] font-mono">{s.value}</span>
                        </span>
                    ))}
                </div>
            </div>

            {/* Families ledger */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <Kicker>Control families</Kicker>
                    <span className="text-[12px] text-[#928d81]">{families.length} families · select to browse</span>
                </div>
                <div className={cn('border rounded-sm overflow-hidden', RULE, PANEL)}>
                    {families.map(f => {
                        const segs = RESP_ORDER.filter(k => f.resp[k]).map(k => ({ label: k, value: f.resp[k], color: RESP[k].color }));
                        return (
                            <button key={f.id} onClick={() => openBrowser(f.id)}
                                className={cn('w-full grid grid-cols-[44px_1fr_auto] md:grid-cols-[56px_1fr_160px_44px] items-center gap-3 px-4 py-3 text-left border-t first:border-t-0 hover:bg-[#f3f1ea]/70 transition-colors', RULE)}>
                                <span className="font-mono text-[14px] font-semibold text-[#1e3a5f]">{f.id}</span>
                                <span className="text-[13.5px] text-[#1c1b17] truncate">{familyName(f.full)}</span>
                                <span className="hidden md:flex h-2.5 w-full overflow-hidden rounded-sm" style={{ background: 'rgba(28,27,23,0.06)' }}>
                                    {segs.map((s, i) => <span key={i} className="h-full" style={{ width: `${(s.value / f.count) * 100}%`, background: s.color }} />)}
                                </span>
                                <span className="font-mono text-[13px] text-[#6c685f] text-right">{f.count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Browser */}
            <div ref={browserRef}>
                {browserOpen ? (
                    <ControlBrowser controls={controls} mode={mode} familyFilter={familyFilter} setFamilyFilter={setFamilyFilter} />
                ) : (
                    <button onClick={() => setBrowserOpen(true)}
                        className={cn('w-full flex items-center justify-center gap-2 border rounded-sm py-3.5 text-[13px] font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/[0.04] transition-colors', RULE, PANEL)}>
                        <Search className="w-4 h-4" /> Browse &amp; search all {controls.length} controls
                    </button>
                )}
            </div>

            {/* Crosswalks & appendices */}
            <div className="space-y-3">
                <CmmcCrosswalk map={data.cmmc_cui} />
                <KsiAppendix items={data.ksi_reference} />
                <AppSecAppendix items={data.app_sec} summary={data.summary?.app_sec} />
            </div>
        </div>
    );
};

export default ComplianceLedger;
