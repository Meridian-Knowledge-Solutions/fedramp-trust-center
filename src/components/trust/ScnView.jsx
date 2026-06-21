import React, { useEffect, useMemo, useState } from 'react';
import {
  Megaphone, GitBranch, Clock, ShieldCheck, CheckCircle2,
  FileText, Send, History, Boxes, GitCommitHorizontal
} from 'lucide-react';

// All SCN data is sourced from the real, redactor-processed, manifest-tracked
// trust-center publication tree — never the `samples/` fixtures.
const TC = import.meta.env.BASE_URL.endsWith('/')
  ? `${import.meta.env.BASE_URL}trust-center`
  : `${import.meta.env.BASE_URL}/trust-center`;

const SCN_REPORT = `${TC}/reports/json/scn-report.json`;       // latest live notification
const SCN_EVENTS = `${TC}/reports/json/scn-recent-events.json`; // real recent-events feed
const SCN_HTML = `${TC}/reports/html/scn-report.html`;
const SCN_SCHEMA = `${TC}/schemas/scn-schema.json`;

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
const titleize = (s) => (s || '').toString().replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Change tier → console accent. routine = healthy/teal, adaptive = amber,
// transformative / critical = red.
const tierMeta = (tier) => {
  const t = (tier || '').toLowerCase();
  if (t.includes('critical')) return { label: 'Critical', tag: 'red' };
  if (t.includes('transformative')) return { label: 'Transformative', tag: 'red' };
  if (t.includes('adaptive')) return { label: 'Adaptive', tag: 'warn' };
  return { label: 'Routine', tag: 'ok' };
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

// One real change event from the SCN pipeline feed.
const EventRow = ({ e }) => {
  const t = tierMeta(e.tier);
  const hasMetrics = (e.commit_count || 0) > 0 || (e.files_changed || 0) > 0 || (e.repositories_with_changes || 0) > 0;
  const sic = Object.entries(e.service_impact_categories || {});
  const failed = e.source_change_id === 'MAS-FAILED';

  return (
    <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span className="mono" style={{ color: 'var(--indigo)', fontSize: 13 }}>{e.notification_id}</span>
        <span className="mono" style={{ color: 'var(--faint)', fontSize: 11 }}>{fmt(e.observed_at)}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexShrink: 0 }}>
          {e.reclassification && <span className="tag vi">RECLASSIFIED</span>}
          <span className={`tag ${t.tag}`}>{t.label}</span>
        </div>
      </div>

      {hasMetrics && (
        <div className="mono" style={{ color: 'var(--ash)', fontSize: 11.5, marginTop: 9, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <GitCommitHorizontal size={12} style={{ color: 'var(--faint)' }} />
          {e.repositories_with_changes} repo{e.repositories_with_changes === 1 ? '' : 's'} ·{' '}
          {e.commit_count} commit{e.commit_count === 1 ? '' : 's'} ·{' '}
          {e.files_changed} file{e.files_changed === 1 ? '' : 's'} changed
          {(e.production_files_changed || 0) > 0 && (
            <span style={{ color: 'var(--amber)' }}> · {e.production_files_changed} production</span>
          )}
        </div>
      )}

      {e.component_types?.length > 0 && (
        <div className="chips" style={{ marginTop: 9 }}>
          {e.component_types.map((c) => (
            <span className="badge" key={c} style={{ fontSize: 9, padding: '3px 7px' }}>{titleize(c)}</span>
          ))}
        </div>
      )}

      {sic.length > 0 && (
        <div className="mono" style={{ color: 'var(--faint)', fontSize: 10.5, marginTop: 8 }}>
          impact · {sic.map(([k, v]) => `${titleize(k)} ×${v}`).join('  ·  ')}
        </div>
      )}

      {e.reclassification && (
        <div style={{ color: 'var(--amber)', fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
          ↳ Reclassified from <b>{titleize(e.reclassification.original_tier)}</b> — {e.reclassification.rationale}
        </div>
      )}

      {failed && !hasMetrics && (
        <div className="mono" style={{ color: 'var(--red)', fontSize: 11, marginTop: 8 }}>
          MAS continuous-validation failure event
        </div>
      )}
    </div>
  );
};

export const ScnView = () => {
  const [report, setReport] = useState(null);
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const cb = Date.now();

    const loadReport = fetch(`${SCN_REPORT}?t=${cb}`)
      .then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const loadFeed = fetch(`${SCN_EVENTS}?t=${cb}`)
      .then((r) => (r.ok ? r.json() : null)).catch(() => null);

    Promise.all([loadReport, loadFeed]).then(([rep, fd]) => {
      if (!alive) return;
      setReport(rep);
      setFeed(fd);
      setLoading(false);
    });

    return () => { alive = false; };
  }, []);

  const scn = report;
  const tier = tierMeta(scn?.change_classification?.tier);
  const counts = feed?.tier_counts || {};
  const events = useMemo(
    () => [...(feed?.events || [])].sort((a, b) => new Date(b.observed_at) - new Date(a.observed_at)),
    [feed]
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
        SCN PIPELINE · FEDRAMP 20x{scn?.report_type ? ` · ${scn.report_type.toUpperCase()} NOTIFICATION` : ''}
      </div>
      <h1 className="big">Significant changes, <span className="g">documented.</span></h1>
      <p className="lede">
        Every change to the authorization boundary is classified, verified, and notified under the
        FedRAMP 20x Significant Change Notification process — captured by the SCN pipeline and
        published here as it happens.
      </p>

      {/* ---- real recent-activity summary (from the events feed) ---- */}
      {feed && (
        <>
          <h3 className="sec">
            <GitBranch size={13} /> Recent change activity
            {feed.lookback_days ? ` · last ${feed.lookback_days} days` : ''}
          </h3>
          <div className="g4">
            <div className="kpi">
              <div className="v">{feed.event_count ?? events.length}</div>
              <div className="l">Change events</div>
              {feed.window_start && feed.window_end && (
                <div className="sub">{fmtDate(feed.window_start)} – {fmtDate(feed.window_end)}</div>
              )}
            </div>
            <div className="kpi">
              <div className="v a">{counts.adaptive ?? 0}</div>
              <div className="l">Adaptive</div>
            </div>
            <div className="kpi">
              <div className="v" style={{ color: (counts.critical ?? 0) > 0 ? 'var(--red)' : 'var(--ink)' }}>
                {counts.critical ?? 0}
              </div>
              <div className="l">Critical</div>
            </div>
            <div className="kpi">
              <div className="v" style={{ color: (counts.transformative ?? 0) > 0 ? 'var(--red)' : 'var(--ink)' }}>
                {counts.transformative ?? 0}
              </div>
              <div className="l">Transformative</div>
              {feed.reclassifications_applied != null && (
                <div className="sub">{feed.reclassifications_applied} reclassified</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ---- latest live notification (from scn-report.json) ---- */}
      {scn && (
        <>
          <h3 className="sec"><Megaphone size={13} /> Latest notification</h3>
          <div className="panel">
            <div className="ph">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="mono" style={{ color: 'var(--indigo)' }}>{scn.notification_id}</span>
                <span className={`tag ${tier.tag}`}>{tier.label}</span>
                {scn.change_classification?.is_emergency && <span className="tag red">EMERGENCY</span>}
              </h4>
              <span className={`tag ${riskTag(scn.security_impact_assessment?.overall_risk_level)}`}>
                {titleize(scn.security_impact_assessment?.overall_risk_level || 'low')} risk
              </span>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>{scn.change_summary?.title}</div>
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

          {/* affected components */}
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

          {/* timeline */}
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

          {/* security controls impact */}
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

          {/* controls verification */}
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
                    <span className={`ck ${r.status === 'operational' ? 'p' : 's'}`}>{r.status === 'operational' ? '✓' : '!'}</span>
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

          {/* notification recipients */}
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

          {/* audit trail */}
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
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--faint)' }}>SHA-256 · {scn.audit_trail.integrity_hash}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--faint)', marginLeft: 'auto' }}>retained until {fmtDate(scn.audit_trail.retention_until)}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ---- real recent-events feed ---- */}
      <h3 className="sec"><History size={13} /> Change event feed</h3>
      {events.length === 0 ? (
        <Empty>No change events recorded in this window.</Empty>
      ) : (
        <div className="panel">
          {events.map((e, i) => <EventRow e={e} key={e.notification_id || i} />)}
          {feed?.notes && (
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--faint)', padding: '14px 20px', lineHeight: 1.6 }}>
              {feed.notes}
            </div>
          )}
        </div>
      )}

      {/* ---- artifacts ---- */}
      <h3 className="sec"><FileText size={13} /> Notification artifacts</h3>
      <div className="dlg">
        <a className="dl" href={SCN_HTML} target="_blank" rel="noopener noreferrer">
          <div>
            <div className="t">Latest SCN report</div>
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
