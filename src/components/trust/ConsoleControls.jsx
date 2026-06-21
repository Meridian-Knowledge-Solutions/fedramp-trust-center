import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, ChevronDown, Download } from 'lucide-react';
import { BASE_PATH } from '../../config/theme';

// Shared-responsibility palette (teal/indigo hybrid context)
const RESP = {
    Customer: { c: '#F2B85C', label: 'Customer' },
    Shared: { c: '#818CF8', label: 'Shared' },
    Meridian: { c: '#34E0C4', label: 'Meridian' },
    'Inherited (AWS)': { c: '#A78BFA', label: 'Inherited · AWS' },
};
const ORDER = ['Customer', 'Shared', 'Meridian', 'Inherited (AWS)'];
const fkey = (f) => (f || '').split(' - ')[0];
const fname = (f) => (f || '').split(' - ')[1] || '';

const Owner = ({ v }) => {
    const r = RESP[v] || RESP.Customer;
    return <span className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#788596' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.c }} />{r.label}
    </span>;
};

// ── collapsible family group (the matrix) ──
const Group = ({ fam, controls, openAll }) => {
    const [open, setOpen] = useState(false);
    const isOpen = open || openAll;
    const ksis = useMemo(() => {
        const s = new Set(); controls.forEach(c => c.ksis?.forEach(k => s.add(k.split('-').slice(0, 2).join('-'))));
        return Array.from(s).slice(0, 4);
    }, [controls]);
    return (
        <div className="panel">
            <div className="grp-h" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="mono" style={{ color: '#818CF8' }}>{fam.id}</span> {fname(fam.full)}
                    <span className="mono" style={{ color: '#424E5C', fontSize: 11 }}>· {controls.length}</span>
                </h4>
                <span className="map">{ksis.join(' · ') || 'KSI-mapped'}</span>
            </div>
            {isOpen && controls.map(c => (
                <ControlRow key={c.control_id} c={c} />
            ))}
        </div>
    );
};

const ControlRow = ({ c }) => {
    const [open, setOpen] = useState(false);
    const na = c.applicability === 'Not Applicable';
    return (
        <>
            <div className="ctrl" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
                <div className="nm">
                    <span className="ck p" style={{ color: na ? '#F2B85C' : '#34E0C4' }}>{na ? '◷' : '✓'}</span>
                    <span className="mono" style={{ color: '#818CF8', fontSize: 12.5 }}>{c.control_id}</span>
                    <span style={{ color: '#E8EEF4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.control_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                    <Owner v={c.responsibility} />
                    {c.ksis?.length > 0 && <span className="mono" style={{ color: '#424E5C', fontSize: 11 }}>{c.ksis.length} KSI</span>}
                    {c.cmmc && <span className="tag vi">CMMC</span>}
                </div>
            </div>
            {open && (
                <div className="cexp">
                    {c.implementation_notes && <div style={{ marginTop: 12 }}>{c.implementation_notes.split('|')[0].trim()}</div>}
                    <div className="kv">
                        {c.ksis?.length > 0 && <div><span style={{ color: '#424E5C' }}>KSIs · </span><span style={{ color: '#34E0C4' }} className="mono">{c.ksis.join(', ')}</span></div>}
                        {c.cmmc && <div><span style={{ color: '#424E5C' }}>CMMC L2 · </span><span className="mono">{c.cmmc}</span></div>}
                        {c.cui_obligation && <div><span style={{ color: '#424E5C' }}>CUI · </span>{c.cui_obligation}</div>}
                    </div>
                </div>
            )}
        </>
    );
};

const Panel = ({ title, map, children }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="panel">
            <div className="grp-h" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{title}</h4>
                {map && <span className="map">{map}</span>}
            </div>
            {open && <div style={{ padding: '4px 0' }}>{children}</div>}
        </div>
    );
};

export default function ConsoleControls() {
    const [data, setData] = useState(null);
    const [mode, setMode] = useState('cloud');
    const [search, setSearch] = useState('');
    const [resp, setResp] = useState(null);

    useEffect(() => {
        let dead = false;
        fetch(`${BASE_PATH}nist_crm.json`).then(r => r.ok ? r.json() : null).then(j => { if (!dead) setData(j); }).catch(() => { });
        return () => { dead = true; };
    }, []);

    const controls = data ? (mode === 'cloud' ? data.cloud_fedramp : data.on_prem) : [];
    const summary = data?.summary?.[mode === 'cloud' ? 'cloud_fedramp' : 'on_prem'];

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return controls.filter(c => {
            if (resp && c.responsibility !== resp) return false;
            if (!q) return true;
            return (c.control_id || '').toLowerCase().includes(q) || (c.control_name || '').toLowerCase().includes(q)
                || (c.cmmc || '').toLowerCase().includes(q) || c.ksis?.some(k => k.toLowerCase().includes(q));
        });
    }, [controls, search, resp]);

    const groups = useMemo(() => {
        const m = new Map();
        filtered.forEach(c => { const k = fkey(c.family); if (!k) return; if (!m.has(k)) m.set(k, { id: k, full: c.family, items: [] }); m.get(k).items.push(c); });
        return Array.from(m.values()).sort((a, b) => a.id.localeCompare(b.id));
    }, [filtered]);

    if (!data) return <div className="mono" style={{ color: '#788596', padding: '40px 0' }}>Loading control matrix…</div>;

    const ownership = ORDER.map(k => ({ k, v: summary?.by_responsibility?.[k] || 0 })).filter(s => s.v > 0);
    const total = summary?.total || 1;

    return (
        <div className="stack">
            {/* toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div className="seg">
                    {[['cloud', 'CLOUD · AWS'], ['on_prem', 'ON-PREMISES']].map(([k, l]) => (
                        <button key={k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>{l}</button>
                    ))}
                </div>
                <a className="mono" style={{ color: '#34E0C4', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12 }}
                    href={`${BASE_PATH}Meridian_LMS_CRM_NIST_800-53_Rev5_CMMC_CUI.xlsx`} download>
                    <Download size={14} /> CRM matrix · XLSX
                </a>
            </div>

            {/* framework figures */}
            <div className="console-grid panel">
                {[['s', summary?.total ?? '—', 'NIST 800-53 R5'], ['i', summary?.by_applicability?.['KSI-Mapped'] ?? '—', 'FedRAMP 20x KSI'], ['', data.cmmc_cui?.family_coverage?.length ?? 14, 'CMMC 2.0 L2'], ['', data.cmmc_cui?.cui_handling?.length ?? 7, 'CUI · DoDI']].map(([cls, v, l], i) => (
                    <div className="cstat" key={i}><div className={`fig ${cls}`}>{v}</div><div className="lab">{l}</div></div>
                ))}
            </div>

            {/* ownership */}
            <div className="panel">
                <div className="grp-h"><h4>Shared responsibility</h4><span className="map">{summary?.total} controls · FRR-MAS</span></div>
                <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: '#0A0E13', marginBottom: 16 }}>
                        {ownership.map(s => <div key={s.k} style={{ width: `${(s.v / total) * 100}%`, background: RESP[s.k].c }} title={`${s.k}: ${s.v}`} />)}
                    </div>
                    <div className="grid2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
                        {ownership.map(s => (
                            <div key={s.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#788596' }}>
                                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: RESP[s.k].c }} />{RESP[s.k].label}
                                </span>
                                <span className="mono" style={{ color: '#E8EEF4' }}>{s.v} <span style={{ color: '#424E5C' }}>· {((s.v / total) * 100).toFixed(0)}%</span></span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* search + resp chips */}
            <div className="search"><Search size={15} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="search control id, name, KSI, CMMC practice…" /></div>
            <div className="chips">
                {ORDER.filter(k => summary?.by_responsibility?.[k]).map(k => (
                    <button key={k} className={`chip ${resp === k ? 'on' : ''}`} onClick={() => setResp(resp === k ? null : k)}
                        style={resp === k ? { background: RESP[k].c, borderColor: RESP[k].c } : {}}>
                        <span className="dot" style={{ background: resp === k ? '#07090C' : RESP[k].c }} />{RESP[k].label}
                        <span style={{ opacity: .7 }}>{summary.by_responsibility[k]}</span>
                    </button>
                ))}
                <span className="mono" style={{ color: '#424E5C', fontSize: 11, alignSelf: 'center', marginLeft: 4 }}>{filtered.length} / {controls.length}</span>
            </div>

            {/* grouped matrix */}
            <div className="stack">
                {groups.map(g => <Group key={g.id} fam={g} controls={g.items} openAll={!!search.trim() || !!resp} />)}
            </div>

            {/* crosswalk appendices */}
            {data.cmmc_cui?.family_coverage?.length > 0 && (
                <Panel title="CMMC 2.0 L2 · CUI / DoD crosswalk" map="NIST 800-171 · DoDI 5200.48">
                    {data.cmmc_cui.family_coverage.map((r, i) => (
                        <div className="ctrl" key={i}><div className="nm"><span style={{ color: '#E8EEF4' }}>{r.domain}</span></div>
                            <span className={`tag ${(r.coverage || '').toLowerCase().includes('inherit') ? 'vi' : (r.coverage || '').toLowerCase().startsWith('covered') ? 'ok' : 'warn'}`}>{r.coverage}</span></div>
                    ))}
                </Panel>
            )}
            {data.ksi_reference?.length > 0 && (
                <Panel title={`FedRAMP 20x KSI reference · ${data.ksi_reference.length} indicators`} map="FRR-KSI">
                    {data.ksi_reference.slice(0, 80).map(k => (
                        <div className="ctrl" key={k.ksi_id}><div className="nm"><span className="mono" style={{ color: '#34E0C4', width: 92, flexShrink: 0 }}>{k.ksi_id}</span>
                            <span style={{ color: '#788596', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.description}</span></div></div>
                    ))}
                </Panel>
            )}
        </div>
    );
}
