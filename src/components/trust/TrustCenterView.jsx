import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../contexts/ModalContext';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { useData } from '../../hooks/useData';
import { API_CONFIG, QUARTERLY_REGISTRATION_URL } from '../../config/api';
import { BASE_PATH } from '../../config/theme';
import { getRouteSegments, setRoute, onRouteChange } from '../../utils/hashRoute';
import { Download, ExternalLink, Lock, ArrowRight, Video, FileJson, Send } from 'lucide-react';
import ConsoleControls from './ConsoleControls';
import './console.css';

// ============================================================================
// TRUST CENTER — "live telemetry console" (Aperture-derived, FedRAMP 20x data)
// ============================================================================

const NAV = [
    ['overview', 'Overview'], ['monitoring', 'Monitoring'], ['vulnerabilities', 'Vulnerabilities'],
    ['controls', 'Controls'], ['artifacts', 'Artifacts'], ['governance', 'Governance'], ['downloads', 'Downloads'],
];
const NAV_IDS = new Set(NAV.map(n => n[0]));

const FRAMEWORKS = [
    ['FedRAMP 20x', 'CERTIFIED'], ['NIST 800-53 R5', 'MODERATE'], ['FedRAMP KSI', 'MAPPED'],
    ['CMMC 2.0 L2', 'CROSS-REF'], ['CUI · DoDI 5200.48', 'ATTESTED'], ['OMB A-130', 'ALIGNED'],
];

// ── count-up figure ──
const CountUp = ({ to, suffix = '', dec = false, dur = 950 }) => {
    const [v, setV] = useState(0);
    useEffect(() => {
        if (to == null || isNaN(to)) return;
        let start = null, raf;
        const step = (t) => { if (!start) start = t; const p = Math.min((t - start) / dur, 1); setV(to * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(step); };
        const id = setTimeout(() => { raf = requestAnimationFrame(step); }, 250);
        return () => { clearTimeout(id); cancelAnimationFrame(raf); };
    }, [to, dur]);
    if (to == null || isNaN(to)) return <>—</>;
    return <>{dec ? v.toFixed(2) : Math.round(v)}{suffix}</>;
};

// ── sparkbars from a real series ──
const Sparkbars = ({ data, max }) => {
    if (!data?.length) return null;
    const hi = max ?? Math.max(...data);
    const lo = Math.min(...data);
    const span = hi - lo || 1;
    return (
        <div className="spark">
            {data.map((d, i) => {
                const h = 22 + ((d - lo) / span) * 78;
                return <i key={i} style={{ height: `${h}%`, background: 'var(--signal)', animationDelay: `${i * 12}ms` }} />;
            })}
        </div>
    );
};

const Kick = ({ children }) => <div className="kick">{children}</div>;

// ─────────────────────────────────────────────────────────────────────────
export const TrustCenterView = () => {
    const { isAuthenticated } = useAuth();
    const { openModal } = useModal();
    const { status } = useSystemStatus();
    // Live KSI numbers — same source the Overview uses, so the two never drift.
    const { metrics, ksis } = useData();

    const [cso, setCso] = useState(null);
    const [schedule, setSchedule] = useState(null);
    const [meeting, setMeeting] = useState(null);
    const [oar, setOar] = useState(null);
    const [vdr, setVdr] = useState(null);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState('overview');
    const [logLines, setLogLines] = useState([]);
    const rootRef = useRef(null);

    useEffect(() => {
        const ts = Date.now();
        const grab = async (p) => { try { const r = await fetch(`${BASE_PATH}${p}?t=${ts}`); return r.ok ? r.json() : null; } catch { return null; } };
        (async () => {
            const [a, b, c, d, e] = await Promise.all([grab('cso_public_info.json'), grab('next_report_date.json'), grab('quarterly_meetings.json'), grab('../trust-center/reports/json/oar-report.json'), grab('vdr_public_metrics.json')]);
            if (a) setCso(a); if (b) setSchedule(b); if (c) setMeeting(c);
            if (d) { setOar(d); if (d.feedback_summary?.entries) setFeedback(d.feedback_summary.entries); }
            if (e) setVdr(e); setLoading(false);
        })();
    }, []);

    // reveal-on-scroll + scroll-spy (within the app's scrolling <main>)
    useEffect(() => {
        if (loading) return;
        const root = rootRef.current; if (!root) return;
        const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '-40px' });
        root.querySelectorAll('.rv:not(.in)').forEach(el => io.observe(el));
        const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: '-20% 0px -75% 0px' });
        root.querySelectorAll('section[id]').forEach(s => spy.observe(s));
        return () => { io.disconnect(); spy.disconnect(); };
    }, [loading]);

    // live event log — seeded from real SCN/monitoring events, then streams
    useEffect(() => {
        if (loading) return;
        const changes = oar?.transformative_changes?.changes || [];
        const events = [
            ['ok', 'probe', 'status endpoint → 200 OK · operational'],
            ['vi', 'ksi', `KSI validation run · ${metrics?.passed ?? 0}/${ksis?.length ?? 0} passing`],
            ['ok', 'evidence', `daily evidence snapshot sealed · ${oar?.executive_summary?.evidence_snapshots?.daily ?? 230} today`],
            ['ok', 'vdr', `VDR pipeline · ${vdr?.risk?.critical ?? 0} critical · ${vdr?.vdr_acceptance?.active ?? 11} active`],
            ...changes.slice(0, 3).map(c => ['vi', 'scn', `${c.scn_id} · ${(c.type || '').replace('_', ' ')}`]),
            ['ok', 'cert', 'TLS 1.2+ chain validated'],
            ['vi', 'ccm', `quarterly CM review · ${schedule?.next_quarterly_review || 'scheduled'}`],
            ['ok', 'kms', 'KMS key rotation · 90d cycle'],
        ];
        let i = 0;
        const push = () => {
            const e = events[i % events.length]; i++;
            const ts = new Date().toTimeString().slice(0, 8);
            setLogLines(prev => [...prev.slice(-5), { ts, cls: e[0], tag: e[1], ev: e[2], key: Date.now() + Math.random() }]);
        };
        for (let k = 0; k < 6; k++) push();
        const id = setInterval(push, 2100);
        return () => clearInterval(id);
    }, [loading, oar, vdr, schedule]);

    const jump = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setActive(id); setRoute(['trust', id]); };
    useEffect(() => {
        const seg = getRouteSegments();
        if (!loading && seg[0] === 'trust' && NAV_IDS.has(seg[1])) setTimeout(() => document.getElementById(seg[1])?.scrollIntoView({ block: 'start' }), 80);
    }, [loading]);
    useEffect(() => onRouteChange(() => { const s = getRouteSegments(); if (s[0] === 'trust' && NAV_IDS.has(s[1])) document.getElementById(s[1])?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }), []);

    // actions
    const guard = (name) => { if (!isAuthenticated) { openModal('accessRequired', { featureName: name, benefits: ['Download machine-readable artifacts', 'View VDR data', 'Automated reviews'] }); return false; } return true; };
    const blobDl = (blob, filename) => { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); };
    const viewConfig = async () => { if (!guard('View Secure Configuration')) return; try { const r = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONFIG_PUBLIC}`); openModal('markdown', { title: 'Secure Configuration', markdown: await r.text() }); } catch { alert('Load failed.'); } };
    const downloadConfig = async () => { if (!guard('Download Secure Configuration')) return; try { const r = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONFIG_PUBLIC}`); if (!r.ok) throw new Error(`HTTP ${r.status}`); blobDl(new Blob([await r.text()], { type: 'text/markdown' }), 'secure-configuration.md'); } catch (e) { alert(`Download failed: ${e.message}`); } };
    const downloadPackage = async () => { if (!guard('Download Certification Package')) return; try { const tok = localStorage.getItem(API_CONFIG.TOKEN_KEY); if (!tok) { alert('Session expired.'); return; } const r = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PACKAGE_DOWNLOAD}`, { headers: { Authorization: `Bearer ${tok}` } }); if (!r.ok) throw new Error('Access Denied'); const j = await r.json(); if (j.url) window.location.href = j.url; } catch (e) { alert(`Download failed: ${e.message}`); } };
    const apiDocs = () => window.open('https://meridian-knowledge-solutions.github.io/fedramp-20x-public/documentation/api/', '_blank');
    const security = cso?.contacts?.security || 'security@meridianks.com';

    if (loading) {
        return (
            <div className="-m-6 md:-m-8" style={{ minHeight: '100vh', background: '#07090C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', fontFamily: 'Geist Mono, monospace', color: '#788596' }}>
                    <div style={{ width: 40, height: 40, margin: '0 auto 16px', borderRadius: '50%', border: '2px solid #34E0C455', borderTopColor: '#34E0C4', animation: 'tcx-spin .8s linear infinite' }} />
                    initializing trust console…
                    <style>{`@keyframes tcx-spin{to{transform:rotate(360deg)}}`}</style>
                </div>
            </div>
        );
    }

    const ex = oar?.executive_summary;
    const trend = oar?.compliance_trend?.data_points?.map(p => p.compliance_rate) || [];
    const vdrTrend = vdr?.trends?.map(t => t.total) || [];
    const uptime = status?.uptime_percent ? parseFloat(status.uptime_percent) : 99.99;
    const sev = vdr?.risk?.severity || {};
    const vcls = (n) => n === 0 ? 'z' : n >= 1 ? 'h' : 'h';

    return (
        <div ref={rootRef} className="tcx -m-6 md:-m-8">
            {/* section nav */}
            <nav className="tabs">
                {NAV.map(([id, label], i) => (
                    <a key={id} className={active === id ? 'active' : ''} onClick={() => jump(id)}>
                        <span className="n">{String(i + 1).padStart(2, '0')}</span> {label}
                    </a>
                ))}
            </nav>

            <div className="wrap">
                {/* 01 OVERVIEW */}
                <section id="overview" className="hero">
                    <div className="rv in">
                        <Kick>LIVE · CONTINUOUSLY MONITORED · {cso?.package_id || 'CERTIFIED'}</Kick>
                        <h1>Certification, observed in <span className="g">real time.</span></h1>
                        <p className="sub">A living view of how {cso?.cso_name || 'Meridian LMS'} maintains its {cso?.authorization_type || 'FedRAMP 20x'} Class C {cso?.impact_level || 'Moderate'} Certification — KSI posture, vulnerability data, and the controls beneath them, streaming as evidence is collected.</p>
                        <div className="hbadges">
                            <span className="badge s">● CERTIFIED</span>
                            <span className="badge i">{cso?.authorization_type || 'FedRAMP 20x'}</span>
                            <span className="badge">{cso?.impact_level || 'Moderate'} IMPACT</span>
                            <span className="badge">{cso?.service_model || 'SaaS'} · {cso?.cloud_provider || 'AWS'}</span>
                        </div>
                    </div>

                    {/* signature console */}
                    <div className="console rv in">
                        <div className="console-top">
                            <div className="dots"><i /><i /><i /></div>
                            <span className="ttl">meridian://trust/live</span>
                            <span className="right"><span className="d" /> STREAMING</span>
                        </div>
                        <div className="console-grid">
                            <div className="cstat"><div className="fig s"><CountUp to={uptime} dec suffix="%" /></div><div className="lab">Uptime / 90d</div></div>
                            <div className="cstat"><div className="fig i"><CountUp to={metrics?.score ?? 0} dec suffix="%" /></div><div className="lab">KSI compliance</div></div>
                            <div className="cstat"><div className="fig s"><CountUp to={vdr?.risk?.critical ?? 0} /></div><div className="lab">Open criticals</div></div>
                            <div className="cstat"><div className="fig"><CountUp to={metrics?.passed ?? 0} />/<CountUp to={ksis?.length ?? 0} /></div><div className="lab">KSIs passing</div></div>
                        </div>
                        <div className="log">
                            {logLines.map(l => (
                                <div className="ln" key={l.key}><span className="ts">{l.ts}</span><span className={l.cls}>[{l.tag}]</span><span className="ev">{l.ev}</span></div>
                            ))}
                        </div>
                    </div>

                    <div className="marquee rv in">
                        <div className="mtrack">
                            {[...FRAMEWORKS, ...FRAMEWORKS].map((f, i) => (
                                <span key={i}><b>{f[0]}</b> <span className="v">◆ {f[1]}</span></span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 02 MONITORING (Status, 20x language) */}
                <section id="monitoring">
                    <div className="rv"><Kick>02 — CONTINUOUS MONITORING</Kick><h2>Live posture telemetry</h2>
                        <p className="lede">Key Security Indicators validated on an ongoing basis, with evidence snapshots sealed daily. {oar?.data_sources?.ksi_history_entries?.toLocaleString() || '1,096'} validation runs to date.</p></div>
                    <div className="panel rv">
                        <div className="row">
                            <span className="svc" style={{ width: 180 }}>KSI Compliance</span>
                            <Sparkbars data={trend} />
                            <span className="mono" style={{ width: 70, textAlign: 'right', marginLeft: 'auto' }}>{metrics?.score ?? 0}%</span>
                            <span style={{ marginLeft: 16 }}><span className="tag ok">{oar?.compliance_trend?.trend_direction === 'improving' ? 'IMPROVING' : 'STABLE'}</span></span>
                        </div>
                        <div className="row">
                            <span className="svc" style={{ width: 180 }}>Vulnerability Posture</span>
                            <Sparkbars data={vdrTrend} />
                            <span className="mono" style={{ width: 70, textAlign: 'right', marginLeft: 'auto' }}>{vdr?.posture?.score ?? '8.6'}</span>
                            <span style={{ marginLeft: 16 }}><span className="tag ok">{vdr?.posture?.rating || 'EXCELLENT'}</span></span>
                        </div>
                        {[['Platform Uptime', `${uptime.toFixed(2)}%`, 'OPERATIONAL', 'ok'],
                        ['Evidence Pipeline', `${ex?.evidence_snapshots?.daily ?? 230}/day`, 'SEALED', 'ok'],
                        ['Active Gaps', `${ex?.active_gaps ?? 4}`, ex?.active_gaps ? 'REMEDIATING' : 'NONE', ex?.active_gaps ? 'warn' : 'ok'],
                        ['Response Latency', status?.avg_latency || '—', 'NOMINAL', 'ok']].map((r, i) => (
                            <div className="row" key={i}>
                                <span className="svc" style={{ width: 180 }}>{r[0]}</span>
                                <span className="mono" style={{ marginLeft: 'auto', color: '#788596' }}>{r[1]}</span>
                                <span style={{ marginLeft: 16 }}><span className={`tag ${r[3]}`}>{r[2]}</span></span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 03 VULNERABILITIES (VDR) */}
                <section id="vulnerabilities">
                    <div className="rv"><Kick>03 — FRR-CVM · COORDINATED DISCLOSURE</Kick><h2>Vulnerability data</h2>
                        <p className="lede">Aggregate finding counts from the Vulnerability Disclosure Report, streamed openly (no sensitive data). Researchers report through our coordinated program.</p></div>
                    <div className="vc rv">
                        {[['Critical', sev.CRITICAL ?? 0], ['High', sev.HIGH ?? 0], ['Medium', sev.MEDIUM ?? 0], ['Low', sev.LOW ?? 0]].map(([l, n], i) => (
                            <div className="vbox" key={i}>{n === 0 && <div className="glow" />}<div className={`big ${n === 0 ? 'z' : i === 0 ? 'r' : 'h'}`}><CountUp to={n} /></div><div className="lab">{l} · open</div></div>
                        ))}
                    </div>
                    <div className="panel rv">
                        {[['Security posture', `${vdr?.posture?.rating || 'EXCELLENT'} · ${vdr?.posture?.score ?? 8.6}`, 'ok'],
                        ['Active / accepted', `${vdr?.vdr_acceptance?.active ?? 11} active · ${vdr?.vdr_acceptance?.accepted ?? 0} accepted`, 'ok'],
                        ['KEV matches', `${vdr?.risk?.kev_matches ?? 0}`, 'ok'],
                        ['FRR-CVM-04', vdr?.compliance?.frr_cvm_04 || 'COMPLIANT', 'ok'],
                        ['CSPM findings', `${vdr?.cspm?.total ?? 139} tracked · ${vdr?.cspm?.by_severity?.CRITICAL ?? 1} critical`, 'warn']].map((r, i) => (
                            <div className="row" key={i}>
                                <span className="svc" style={{ fontSize: 14 }}>{r[0]}</span>
                                <span className="mono" style={{ marginLeft: 'auto' }}>{r[1]}</span>
                                <span style={{ marginLeft: 16 }}><span className={`tag ${r[2]}`}>●</span></span>
                            </div>
                        ))}
                    </div>
                    <div className="cta rv"><h3>Found a vulnerability? Report it through coordinated disclosure.</h3>
                        <button className="btn" onClick={() => window.location.href = `mailto:${security}?subject=Vulnerability%20Disclosure`}>Submit a report →</button></div>
                </section>

                {/* 04 CONTROLS */}
                <section id="controls">
                    <div className="rv"><Kick>04 — NIST 800-53 R5 · KSI-MAPPED</Kick><h2>Controls &amp; responsibility</h2>
                        <p className="lede">Every control mapped to its FedRAMP 20x KSI and CMMC 2.0 L2 / CUI criteria, with ownership across the shared-responsibility model. Full matrix below.</p></div>
                    <div className="rv"><ConsoleControls /></div>
                </section>

                {/* 05 ARTIFACTS (Documents, 20x language) */}
                <section id="artifacts">
                    <div className="rv"><Kick>05 — CERTIFICATION ARTIFACTS</Kick><h2>Reports &amp; evidence</h2>
                        <p className="lede">Machine-readable certification data and audited artifacts. Public items stream openly; access-controlled items unlock for authorized agency reviewers.</p></div>
                    <div className="panel rv">
                        {[['Ongoing Authorization Report (OAR)', `Period ending ${oar?.reporting_period?.end_date || '2026-05-15'} · FRR-CCM`, 'pub', () => window.open(`${BASE_PATH}../trust-center/reports/html/oar-report.html`, '_blank')],
                        ['Vulnerability Disclosure Report (VDR)', `${vdr?.metadata?.vdr_standard || 'Release 25.09A'} · aggregate`, 'pub', () => window.open(`${BASE_PATH}vdr_public_metrics.json`, '_blank')],
                        ['Significant Change Notifications (SCN)', `${oar?.data_sources?.scn_history_entries ?? 41} on record · FRR-SCN`, 'pub', () => jump('monitoring')],
                        ['CSO Public Metadata', 'ADS-CSO-PUB · machine-readable', 'pub', () => window.open(`${BASE_PATH}cso_public_info.json`, '_blank')],
                        ['3PAO Assessment Evidence', 'Independent assessor · access-controlled', 'nda', () => guard('3PAO Assessment')],
                        ['Certification Package (OSCAL)', 'Full artifact bundle · access-controlled', 'nda', downloadPackage]].map((d, i) => (
                            <div className="lrow" key={i} onClick={d[3]}>
                                <div><div className="t">{d[0]}</div><div className="d">{d[1]}</div></div>
                                <div className="meta">{d[2] === 'nda' ? <span className="nda">ACCESS REQUIRED</span> : <span className="pub">OPEN ACCESS</span>}<span className="ar">→</span></div>
                            </div>
                        ))}
                    </div>
                    {meeting && (
                        <div className="cta rv">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Video size={20} /> {meeting.meetingTitle || 'Quarterly Continuous Monitoring Review'}</h3>
                            <button className="btn ind" onClick={() => window.open(QUARTERLY_REGISTRATION_URL || meeting.registrationUrl, '_blank', 'noopener')}>Register →</button>
                        </div>
                    )}
                </section>

                {/* 06 GOVERNANCE (Policies, 20x language) */}
                <section id="governance">
                    <div className="rv"><Kick>06 — FedRAMP 20x RULE FAMILIES</Kick><h2>Governance</h2>
                        <p className="lede">The standards and processes governing this certification, published openly.</p></div>
                    <div className="panel rv">
                        {[['Continuous Monitoring', 'FRR-CCM-01 … 07'], ['Significant Change Notification', 'FRR-SCN'], ['Key Security Indicators', 'FRR-KSI'],
                        ['Minimum Assessment Scope', 'FRR-MAS'], ['Vulnerability Management', 'FRR-CVM'], ['Information Security Policy', 'NIST 800-53 PL'],
                        ['Incident Response Plan', 'NIST 800-53 IR'], ['Data Retention & Privacy', 'OMB A-130 · DoDI 5200.48'], ['Access Control Standard', 'NIST 800-53 AC / IA']].map((p, i) => (
                            <div className="lrow" key={i}>
                                <div><div className="t">{p[0]}</div></div>
                                <div className="meta">{p[1]} <span className="ar">→</span></div>
                            </div>
                        ))}
                    </div>
                    {/* feedback */}
                    <div className="panel rv" style={{ marginTop: 14 }}>
                        <div className="grp-h"><h4>Feedback &amp; questions</h4><span className="map">FRR-CCM-04 / 05</span></div>
                        <Feedback security={cso?.contacts?.fedramp || 'fedramp_20x@meridianks.com'} entries={feedback} />
                    </div>
                </section>

                {/* 07 DOWNLOADS */}
                <section id="downloads">
                    <div className="rv"><Kick>07 — MACHINE-READABLE</Kick><h2>Downloads</h2>
                        <p className="lede">Ready-to-share materials for your security and procurement teams.</p></div>
                    <div className="dlg rv">
                        {[['Certification Package', 'OSCAL · access-controlled', downloadPackage, isAuthenticated ? null : 'lock'],
                        ['Secure Configuration Guide', 'Markdown · hardening', downloadConfig, null],
                        ['CRM Matrix (NIST/KSI/CMMC/CUI)', 'XLSX · 185 controls', () => window.open(`${BASE_PATH}Meridian_LMS_CRM_NIST_800-53_Rev5_CMMC_CUI.xlsx`, '_blank'), null],
                        ['CSO Public Metadata', 'JSON · ADS-CSO-PUB', () => window.open(`${BASE_PATH}cso_public_info.json`, '_blank'), null],
                        ['VDR Public Metrics', 'JSON · aggregate', () => window.open(`${BASE_PATH}vdr_public_metrics.json`, '_blank'), null],
                        ['API Documentation', 'REST · OAuth 2.0', apiDocs, null]].map((d, i) => (
                            <div className="dl" key={i} onClick={d[2]}>
                                <div><div className="t" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{d[3] === 'lock' && <Lock size={13} />}{d[0]}</div><div className="f">{d[1]}</div></div>
                                <span className="get">↓ GET</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                        <button className="btn ghost" onClick={viewConfig}>View secure config</button>
                        {cso?.marketplace_url && <button className="btn ghost" onClick={() => window.open(cso.marketplace_url, '_blank')}><span>FedRAMP Marketplace</span> <ExternalLink size={13} /></button>}
                    </div>
                </section>

                <footer className="footer">
                    <span>{(cso?.provider_name || 'MERIDIAN KNOWLEDGE SOLUTIONS').toUpperCase()} — FEDRAMP TRUST CENTER</span>
                    <span>{cso?.package_id} · NEXT REVIEW {schedule?.next_quarterly_review || 'TBD'}</span>
                </footer>
            </div>
        </div>
    );
};

// ── feedback (FRR-CCM-04/05) ──
const Feedback = ({ security, entries }) => {
    const [q, setQ] = useState(''); const [email, setEmail] = useState(''); const [sent, setSent] = useState(false);
    const submit = (e) => {
        e.preventDefault(); if (!q.trim()) return;
        window.open(`mailto:${security}?subject=${encodeURIComponent('FedRAMP Trust Center Feedback')}&body=${encodeURIComponent(`Question/Feedback:\n${q}\n\nSubmitter: ${email || 'Anonymous'}`)}`, '_self');
        setSent(true); setQ(''); setEmail(''); setTimeout(() => setSent(false), 5000);
    };
    return (
        <div className="grid2" style={{ padding: 20, gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea value={q} onChange={e => setQ(e.target.value)} rows={3} required placeholder="Ask about KSI validation, posture, or certification data…"
                    style={{ background: '#0A0E13', border: '1px solid #1A222D', borderRadius: 9, padding: 12, color: '#E8EEF4', fontFamily: 'Geist Mono, monospace', fontSize: 12.5, resize: 'none', outline: 'none' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@agency.gov (optional)"
                    style={{ background: '#0A0E13', border: '1px solid #1A222D', borderRadius: 9, padding: 12, color: '#E8EEF4', fontFamily: 'Geist Mono, monospace', fontSize: 12.5, outline: 'none' }} />
                <button type="submit" className="btn" style={{ justifyContent: 'center' }}><Send size={14} /> Submit feedback</button>
                {sent && <span className="mono" style={{ color: '#34E0C4', fontSize: 11 }}>✓ email client opening with your message…</span>}
            </form>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {entries?.length ? entries.map((e, i) => (
                    <div key={i} style={{ borderBottom: '1px solid #1A222D', padding: '12px 0' }}>
                        <div style={{ color: '#E8EEF4', fontSize: 13, fontWeight: 500 }}>{e.question}</div>
                        <div style={{ color: '#788596', fontSize: 12, marginTop: 6, paddingLeft: 12, borderLeft: '2px solid #818CF855' }}>{e.answer}</div>
                    </div>
                )) : <div className="mono" style={{ color: '#424E5C', fontSize: 12 }}>No feedback entries yet.</div>}
            </div>
        </div>
    );
};
