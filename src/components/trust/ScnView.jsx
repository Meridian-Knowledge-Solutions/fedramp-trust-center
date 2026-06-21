import React, { useEffect, useMemo, useState } from 'react';
import {
  Megaphone, GitBranch, Clock, ShieldCheck, AlertTriangle,
  CheckCircle2, FileText, Send, History, Boxes
} from 'lucide-react';

// Data lives under the public `data/` tree (same base path the rest of the app uses).
const DATA = import.meta.env.BASE_URL.endsWith('/')
  ? `${import.meta.env.BASE_URL}data`
  : `${import.meta.env.BASE_URL}/data`;

const SCN_REPORT = `${DATA}/reports/samples/scn-sample-report.json`;
const SCN_HISTORY = `${DATA}/scn_history.jsonl`;
const SCN_HTML = `${DATA}/reports/html/scn-report.html`;
const SCN_SCHEMA = `${DATA}/reports/schemas/scn-schema.json`;
const OAR = `${DATA}/ongoing_authorization_report_Q4_2025.json`;

// --- formatting helpers --------------------------------------------------
const fmt = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};
const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};
const titleize = (s) => (s || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Change tier → console accent. routine = healthy/teal, adaptive = amber, transformative = red.
const tierMeta = (tier) => {
  const t = (tier || '').toLowerCase();
  if (t.includes('transformative')) return { label: 'Transformative', tag: 'red', ck: 's' };
  if (t.includes('adaptive')) return { label: 'Adaptive', tag: 'warn', ck: 's' };
  return { label: 'Routine / Recurring', tag: 'ok', ck: 'p' };
};
const impactTag = (impact) => {
  const i = (impact || '').toLowerCase();
  if (i === 'positive') return 'ok';
  if (i === 'negative' || i === 'degraded') return 'red';
  return 'vi';
};
const riskTag = (level) => {
  const l = (level || '').toLowerCase();
  if (l === 'high') return 'red';
  if (l === 'moderate' || l === 'medium') return 'warn';
  return 'ok';
};

const Empty = ({ children }) => (
  <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
    <Megaphone size={36} style={{ color: 'var(--faint)', margin: '0 auto 14px' }} />
    <p style={{ color: 'var(--ash)', fontSize: 14 }}>{children}</p>
  </div>
);

export const ScnView = () => {
  const [scn, setScn] = useState(null);
  const [history, setHistory] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const cb = Date.now();

    const loadReport = fetch(`${SCN_REPORT}?t=${cb}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    const loadHistory = fetch(`${SCN_HISTORY}?t=${cb}`)
      .then((r) => (r.ok ? r.text() : ''))
      .then((txt) => txt.split('\n').map((l) => l.trim()).filter(Boolean)
        .map((l) => { try { return JSON.parse(l); } catch { return null; } })
        .filter(Boolean))
      .catch(() => []);

    const loadSnapshot = fetch(`${OAR}?t=${cb}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.scn_snapshot || null)
      .catch(() => null);

    Promise.all([loadReport, loadHistory, loadSnapshot]).then(([rep, hist, snap]) => {
      if (!alive) return;
      setScn(rep);
      setHistory(hist || []);
      setSnapshot(snap);
      setLoading(false);
    });

    return () => { alive = false; };
  }, []);

  const breakdown = snapshot?.breakdown || {};
  const tier = tierMeta(scn?.change_classification?.tier);

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [history]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="kick">SIGNIFICANT CHANGE NOTIFICATION</div>
        <h1 className="big">Significant changes, <span className="g">documented.</span></h1>
        <Empty>Loading change notifications…</Empty>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="kick">
        SCN PROGRAM · FEDRAMP 20x{scn?.report_type ? ` · ${scn.report_type.toUpperCase()} NOTIFICATION` : ''}
      </div>
      <h1 className="big">Significant changes, <span className="g">documented.</span></h1>
      <p className="lede">
        Every change to the authorization boundary is classified, verified, and notified under the
        FedRAMP 20x Significant Change Notification process — published here for agency reviewers and
        the 3PAO as it happens.
      </p>

      {/* ---- current period snapshot ---- */}
      <h3 className="sec"><GitBranch size={13} /> Current authorization period</h3>
      <div className="g4">
        <div className="kpi">
          <div className="v">{snapshot?.total_changes ?? 0}</div>
          <div className="l">Total changes</div>
        </div>
        <div className="kpi">
          <div className="v s">{breakdown.routine_recurring ?? 0}</div>
          <div className="l">Routine</div>
        </div>
        <div className="kpi">
          <div className="v a">{breakdown.adaptive ?? 0}</div>
          <div className="l">Adaptive</div>
        </div>
        <div className="kpi">
          <div className="v" style={{ color: (breakdown.transformative ?? 0) > 0 ? 'var(--red)' : 'var(--ink)' }}>
            {breakdown.transformative ?? 0}
          </div>
          <div className="l">Transformative</div>
          <div className="sub">{snapshot?.boundary_impact || snapshot?.terraform_changes ? 'boundary affected' : 'no boundary impact'}</div>
        </div>
      </div>

      {!scn ? (
        <Empty>No significant change notification has been published yet.</Empty>
      ) : (
        <>
          {/* ---- latest notification ---- */}
          <h3 className="sec"><Megaphone size={13} /> Latest notification</h3>
          <div className="panel">
            <div className="ph">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mono" style={{ color: 'var(--indigo)' }}>{scn.notification_id}</span>
                <span className={`tag ${tier.tag}`}>{tier.label}</span>
                {scn.change_classification?.is_emergency && <span className="tag red">EMERGENCY</span>}
              </h4>
              <span className={`tag ${riskTag(scn.security_impact_assessment?.overall_risk_level)}`}>
                {titleize(scn.security_impact_assessment?.overall_risk_level || 'low')} risk
              </span>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>
                {scn.change_summary?.title}
              </div>
              <p style={{ color: 'var(--ash)', fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>
                {scn.change_summary?.description}
              </p>
              <div className="g3">
                <div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Category</div>
                  <div style={{ fontSize: 14, marginTop: 4 }}>{scn.change_classification?.category || '—'}</div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Boundary impact</div>
                  <div style={{ fontSize: 14, marginTop: 4 }}>{scn.change_summary?.boundary_impact ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Data impact</div>
                  <div style={{ fontSize: 14, marginTop: 4 }}>{titleize(scn.security_impact_assessment?.data_impact || 'none')}</div>
                </div>
              </div>
              {scn.change_classification?.evaluation_rationale && (
                <p style={{ color: 'var(--faint)', fontSize: 12.5, lineHeight: 1.6, marginTop: 16, fontStyle: 'italic' }}>
                  {scn.change_classification.evaluation_rationale}
                </p>
              )}
            </div>
          </div>

          {/* ---- affected components ---- */}
          {scn.change_summary?.affected_components?.length > 0 && (
            <div className="panel">
              <div className="ph">
                <h4><Boxes size={13} style={{ verticalAlign: -2, marginRight: 7 }} />Affected components</h4>
                <span className="map">{scn.change_summary.affected_components.length} component{scn.change_summary.affected_components.length > 1 ? 's' : ''}</span>
              </div>
              {scn.change_summary.affected_components.map((c, i) => (
                <div className="ctrl" key={i}>
                  <div className="nm" style={{ flexWrap: 'wrap' }}>
                    <span className="mono" style={{ color: 'var(--indigo)' }}>{c.component_id}</span>
                    <span style={{ color: 'var(--ash)' }}>{c.description}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <span className="tag vi">{titleize(c.component_type)}</span>
                    <span className="tag warn">{titleize(c.change_type)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ---- timeline ---- */}
          <div className="panel">
            <div className="ph"><h4><Clock size={13} style={{ verticalAlign: -2, marginRight: 7 }} />Change timeline</h4></div>
            {[
              ['Change initiated', scn.timeline?.change_initiated],
              ['Change completed', scn.timeline?.change_completed],
              ['Verification completed', scn.timeline?.verification_completed],
              ['Notification sent', scn.timeline?.notification_sent],
              ['Notification deadline', scn.timeline?.notification_deadline, true],
              ['Documentation deadline', scn.timeline?.documentation_deadline, true],
            ].filter(([, v]) => v).map(([label, v, deadline]) => (
              <div className="row" key={label}>
                <span className="svc" style={{ width: 220, color: deadline ? 'var(--amber)' : 'var(--ink)' }}>{label}</span>
                <span className="mono" style={{ marginLeft: 'auto', color: deadline ? 'var(--amber)' : 'var(--ash)' }}>{fmt(v)}</span>
              </div>
            ))}
          </div>

          {/* ---- security controls impact ---- */}
          {scn.security_impact_assessment?.controls_affected?.length > 0 && (
            <div className="panel">
              <div className="ph">
                <h4><ShieldCheck size={13} style={{ verticalAlign: -2, marginRight: 7 }} />Security controls impact</h4>
                {scn.security_impact_assessment?.ksi_impact?.length > 0 && (
                  <span className="map">{scn.security_impact_assessment.ksi_impact.join(' · ')}</span>
                )}
              </div>
              {scn.security_impact_assessment.controls_affected.map((c, i) => (
                <div className="ctrl" key={i}>
                  <div className="nm" style={{ flexWrap: 'wrap' }}>
                    <span className="mono" style={{ color: 'var(--indigo)' }}>{c.control_id}</span>
                    <span>{c.control_name}</span>
                    <span style={{ color: 'var(--ash)', fontSize: 12.5 }}>— {c.notes}</span>
                  </div>
                  <span className={`tag ${impactTag(c.impact)}`}>{titleize(c.impact)}</span>
                </div>
              ))}
            </div>
          )}

          {/* ---- controls verification ---- */}
          {scn.controls_verification?.results?.length > 0 && (
            <div className="panel">
              <div className="ph">
                <h4><CheckCircle2 size={13} style={{ verticalAlign: -2, marginRight: 7 }} />Controls verification</h4>
                <span className={`tag ${scn.controls_verification.overall_status === 'pass' ? 'ok' : 'red'}`}>
                  {(scn.controls_verification.overall_status || 'pass').toUpperCase()}
                </span>
              </div>
              {scn.controls_verification.results.map((r, i) => (
                <div className="ctrl" key={i}>
                  <div className="nm" style={{ flexWrap: 'wrap' }}>
                    <span className={`ck ${r.status === 'operational' ? 'p' : 's'}`}>
                      {r.status === 'operational' ? '✓' : '!'}
                    </span>
                    <span className="mono" style={{ color: 'var(--indigo)' }}>{r.control_id}</span>
                    <span>{r.control_name}</span>
                    <span style={{ color: 'var(--ash)', fontSize: 12.5 }}>— {r.verification_detail}</span>
                  </div>
                  <span className="tag ok">{titleize(r.status)}</span>
                </div>
              ))}
              <div className="row">
                <span className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>
                  {titleize(scn.controls_verification.verification_method)} · {scn.controls_verification.assessor} · {fmt(scn.controls_verification.verification_timestamp)}
                </span>
              </div>
            </div>
          )}

          {/* ---- notification recipients ---- */}
          {scn.notification_recipients && (
            <div className="panel">
              <div className="ph"><h4><Send size={13} style={{ verticalAlign: -2, marginRight: 7 }} />Notification recipients</h4></div>
              {[
                ['FedRAMP PMO', scn.notification_recipients.fedramp_pmo],
                [`3PAO${scn.notification_recipients.three_pao?.name ? ` · ${scn.notification_recipients.three_pao.name}` : ''}`, scn.notification_recipients.three_pao],
                ...(scn.notification_recipients.agency_customers || []).map((a) => [`Agency · ${a.agency_id}`, a]),
              ].filter(([, v]) => v).map(([label, v], i) => (
                <div className="ctrl" key={i}>
                  <div className="nm">
                    <span className={`ck ${v.notified ? 'p' : 's'}`}>{v.notified ? '✓' : '○'}</span>
                    <span>{label}</span>
                    <span className="mono" style={{ color: 'var(--faint)', fontSize: 11 }}>{titleize(v.method)}</span>
                  </div>
                  <span className="mono" style={{ color: 'var(--ash)', fontSize: 11 }}>{v.notified ? fmt(v.notification_timestamp) : 'pending'}</span>
                </div>
              ))}
            </div>
          )}

          {/* ---- audit trail ---- */}
          {scn.audit_trail?.evaluation_activities?.length > 0 && (
            <div className="panel">
              <div className="ph">
                <h4><History size={13} style={{ verticalAlign: -2, marginRight: 7 }} />Audit trail</h4>
                <span className="map">{scn.audit_trail.record_id}</span>
              </div>
              {scn.audit_trail.evaluation_activities.map((a, i) => (
                <div className="ctrl" key={i}>
                  <div className="nm" style={{ flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 500 }}>{a.activity}</span>
                    <span className="mono" style={{ color: 'var(--faint)', fontSize: 11 }}>{a.actor}</span>
                    <span style={{ color: 'var(--ash)', fontSize: 12.5 }}>— {a.outcome}</span>
                  </div>
                  <span className="mono" style={{ color: 'var(--ash)', fontSize: 11, flexShrink: 0 }}>{fmt(a.timestamp)}</span>
                </div>
              ))}
              {scn.audit_trail.integrity_hash && (
                <div className="row" style={{ gap: 18, flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--faint)' }}>
                    SHA-256 · {scn.audit_trail.integrity_hash}
                  </span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--faint)', marginLeft: 'auto' }}>
                    retained until {fmtDate(scn.audit_trail.retention_until)}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ---- change history ---- */}
      <h3 className="sec"><History size={13} /> Change history</h3>
      {sortedHistory.length === 0 ? (
        <Empty>No change-detection events recorded yet.</Empty>
      ) : (
        <div className="panel">
          {sortedHistory.map((h, i) => {
            const t = tierMeta(h.classification);
            return (
              <div className="ctrl" key={i}>
                <div className="nm" style={{ flexWrap: 'wrap' }}>
                  <span className="mono" style={{ color: 'var(--indigo)' }}>{h.change_id}</span>
                  <span>{h.description}</span>
                  <span className="mono" style={{ color: 'var(--faint)', fontSize: 11 }}>{fmt(h.timestamp)}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <span className={`tag ${t.tag}`}>{t.label}</span>
                  {h.status && <span className="tag ok">{titleize(h.status)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---- artifacts ---- */}
      <h3 className="sec"><FileText size={13} /> Notification artifacts</h3>
      <div className="dlg">
        <a className="dl" href={SCN_HTML} target="_blank" rel="noopener noreferrer">
          <div>
            <div className="t">Full SCN report</div>
            <div className="f">Rendered notification · HTML</div>
          </div>
          <span className="get">VIEW →</span>
        </a>
        <a className="dl" href={SCN_SCHEMA} target="_blank" rel="noopener noreferrer">
          <div>
            <div className="t">SCN schema</div>
            <div className="f">Machine-readable structure · JSON</div>
          </div>
          <span className="get">OPEN →</span>
        </a>
      </div>
    </div>
  );
};

export default ScnView;
