import { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid, PieChart, Pie, LineChart, Line,
} from "recharts";

import { BASE_PATH } from '../../config/theme';

// Console palette
const SIGNAL = "#34E0C4";  // teal — live / healthy / pass
const INDIGO = "#818CF8";  // brand / links
const AMBER = "#F2B85C";
const RED = "#F2607A";
const ASH = "#788596";
const FAINT = "#424E5C";
const INK = "#E8EEF4";
const LINE = "#1A222D";
const RAISE = "#0D1117";

// Severity / source colors recolored onto the console teal/indigo/amber/red scale
const SEV_COLORS: Record<string, string> = {
  CRITICAL: RED, HIGH: AMBER, MEDIUM: INDIGO, LOW: SIGNAL, INFO: FAINT
};

const SOURCE_COLORS: Record<string, string> = {
  Inspector: INDIGO, "Security Hub": INDIGO, Pentest: AMBER,
  Audit: AMBER, Incident: RED, SCA: SIGNAL,
  SAST: SIGNAL, DAST: INDIGO, External: ASH
};

const mono: React.CSSProperties = { fontFamily: "var(--mono)" };

// --- Shared tooltip ---
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0b1016", border: `1px solid ${LINE}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 12px 40px -16px #000" }}>
      <div style={{ ...mono, color: FAINT, fontSize: 10, letterSpacing: ".05em", marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, color: INK }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", background: p.color }} />
          <span style={{ color: ASH }}>{p.name}:</span>
          <span style={{ ...mono, fontWeight: 600 }}>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// --- Check icon ---
const Check = ({ ok }: { ok: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    {ok ? (
      <><circle cx="8" cy="8" r="7" fill="#34E0C420" stroke={SIGNAL} strokeWidth="1.5" /><path d="M5 8l2 2 4-4" stroke={SIGNAL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>
    ) : (
      <><circle cx="8" cy="8" r="7" fill="#F2607A20" stroke={RED} strokeWidth="1.5" /><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke={RED} strokeWidth="1.5" strokeLinecap="round" /></>
    )}
  </svg>
);

// --- Delta arrow ---
const DeltaArrow = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  if (value === 0) return <span style={{ ...mono, color: FAINT, fontSize: 12 }}>-</span>;
  const isDown = value < 0;
  return (
    <span style={{ ...mono, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 2, color: isDown ? SIGNAL : RED }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        {isDown
          ? <path d="M5 7L1 3h8z" />
          : <path d="M5 3L1 7h8z" />}
      </svg>
      {Math.abs(value)}{suffix}
    </span>
  );
};

// --- Circular gauge ---
const RiskGauge = ({ label, value, max = 100 }: { label: string; value: number; max?: number }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const color = pct === 0 ? SIGNAL : pct < 25 ? AMBER : pct < 50 ? AMBER : RED;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ - (circ * Math.min(pct, 100)) / 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke={LINE} strokeWidth="6" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dashOffset}
          transform="rotate(-90 45 45)" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        <text x="45" y="42" textAnchor="middle" fill={color} fontSize="18" fontWeight="600" style={mono}>
          {pct.toFixed(0)}%
        </text>
        <text x="45" y="56" textAnchor="middle" fill={ASH} fontSize="9">rate</text>
      </svg>
      <span style={{ ...mono, fontSize: 10, letterSpacing: ".04em", color: ASH, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
};

export default function VDRDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trendMode, setTrendMode] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [scanTableOpen, setScanTableOpen] = useState(false);
  const [attackSurfaceOpen, setAttackSurfaceOpen] = useState(false);

  useEffect(() => {
    const ts = Date.now();
    fetch(`${BASE_PATH}vdr_public_metrics.json?t=${ts}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Normalize: the JSON uses "total" in trends, component uses "total_vulnerabilities"
  const normalizeTrendEntry = (d: any) => ({
    ...d,
    total_vulnerabilities: d.total_vulnerabilities ?? d.total,
  });

  // Trends may be a flat array (current schema) or an object with daily/weekly/monthly buckets (legacy)
  const dailyTrends = useMemo(() => {
    if (!data?.trends) return [];
    if (Array.isArray(data.trends)) return data.trends;
    return data.trends.daily || [];
  }, [data]);

  // Derived trend data
  const trendData = useMemo(() => {
    if (!data?.trends) return [];
    if (trendMode === "daily") return dailyTrends.map(normalizeTrendEntry);
    if (trendMode === "weekly") {
      const weekly = !Array.isArray(data.trends) ? data.trends.weekly : null;
      if (weekly?.length) {
        return weekly.map((w: any) => normalizeTrendEntry({
          date: w.week_start ?? w.date,
          total_vulnerabilities: w.avg_total ?? w.total,
          active_count: w.avg_active ?? w.active,
        }));
      }
      // Aggregate daily into weekly buckets
      const grouped: Record<string, number[]> = {};
      dailyTrends.forEach((d: any) => {
        const date = new Date(d.date + "T00:00:00");
        const day = date.getDay();
        const monday = new Date(date);
        monday.setDate(date.getDate() - ((day + 6) % 7));
        const key = monday.toISOString().slice(0, 10);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(d.total ?? d.total_vulnerabilities);
      });
      return Object.entries(grouped).map(([week, vals]) => ({
        date: week,
        total_vulnerabilities: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      }));
    }
    // monthly — use monthly array if available, else aggregate from daily
    const monthly = !Array.isArray(data.trends) ? data.trends.monthly : null;
    if (monthly?.length) {
      return monthly.map(normalizeTrendEntry);
    }
    const grouped: Record<string, number[]> = {};
    dailyTrends.forEach((d: any) => {
      const m = d.date.slice(0, 7);
      if (!grouped[m]) grouped[m] = [];
      grouped[m].push(d.total ?? d.total_vulnerabilities);
    });
    return Object.entries(grouped).map(([month, vals]) => ({
      date: month,
      total_vulnerabilities: Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length),
    }));
  }, [data, trendMode, dailyTrends]);

  // Severity donut data — supports data.severity_distribution, data.snapshot.severity, and data.risk.severity
  const sevDonut = useMemo(() => {
    const sev = data?.risk?.severity_assessed ?? data?.severity_distribution ?? data?.snapshot?.severity ?? data?.risk?.severity;
    if (!sev) return [];
    return Object.entries(sev)
      .filter(([, v]) => (v as number) > 0)
      .map(([name, value]) => ({ name, value: value as number, fill: SEV_COLORS[name] || FAINT }));
  }, [data]);

  // N-rating bar data — supports data.n_rating_distribution, data.snapshot.n_ratings, and data.risk.n_ratings
  const nRatingData = useMemo(() => {
    const nr = data?.n_rating_distribution ?? data?.snapshot?.n_ratings ?? data?.risk?.n_ratings;
    if (!nr) return [];
    return Object.entries(nr).map(([name, value]) => ({
      name, value: value as number
    }));
  }, [data]);

  // Detection sources bar data — supports both {name: {count: N}} and {name: N} formats
  const sourceBarData = useMemo(() => {
    const ds = data?.detection_sources ?? data?.snapshot?.detection_sources;
    if (!ds) return [];
    return Object.entries(ds).map(([name, info]: [string, any]) => {
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      const count = typeof info === "number" ? info : info.count;
      return { name: displayName, count, color: SOURCE_COLORS[displayName] || ASH };
    });
  }, [data]);

  // Peak value for trend annotation
  const trendPeak = useMemo(() => {
    if (!dailyTrends.length) return 0;
    return Math.max(...dailyTrends.map((d: any) => d.total_vulnerabilities ?? d.total ?? 0));
  }, [dailyTrends]);

  const formatDate = (v: string) => {
    if (v.length === 7) {
      const [, m] = v.split("-");
      return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m, 10) - 1];
    }
    const d = new Date(v + "T00:00:00");
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  if (loading) {
    return (
      <div className="wrap" style={{ padding: "80px 32px" }}>
        <div className="mono" style={{ color: ASH }}>Loading VDR metrics…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="wrap" style={{ padding: "80px 32px" }}>
        <div className="mono" style={{ color: ASH }}>VDR metrics not available</div>
      </div>
    );
  }

  // Build kpi from data.kpi (legacy), data.snapshot, or the current flatter schema (data.risk, data.compliance)
  const snap = data.snapshot || {};
  const risk = data.risk || {};
  const compliance = data.compliance || {};
  const kpi = data.kpi || {
    total_vulnerabilities: snap.total_vulnerabilities ?? 0,
    critical_count: snap.critical_findings ?? risk.critical ?? risk.severity_assessed?.CRITICAL ?? risk.severity?.CRITICAL ?? snap.severity?.CRITICAL ?? 0,
    lev_count: snap.lev_count ?? risk.lev_count ?? 0,
    irv_count: snap.irv_count ?? risk.irv_count ?? 0,
    kev_count: snap.kev_matches ?? risk.kev_matches ?? 0,
    compliance_rate: snap.compliance_rate ?? compliance.rate ?? 0,
    unique_cves: snap.unique_cves ?? 0,
  };
  const env = data.environment;
  // Normalize attack surface field names: current schema uses short names (nodes, edges, paths, blast_radius)
  const atkRaw = data.attack_surface;
  const atk = atkRaw ? {
    total_attack_paths: atkRaw.total_attack_paths ?? atkRaw.paths ?? 0,
    critical_attack_paths: atkRaw.critical_attack_paths ?? atkRaw.critical_paths ?? 0,
    exploitable_paths: atkRaw.exploitable_paths ?? 0,
    blast_radius_score: atkRaw.blast_radius_score ?? atkRaw.blast_radius ?? 0,
    graph_node_count: atkRaw.graph_node_count ?? atkRaw.nodes ?? 0,
    graph_edge_count: atkRaw.graph_edge_count ?? atkRaw.edges ?? 0,
    avg_path_risk_score: atkRaw.avg_path_risk_score ?? null,
  } : null;
  const posture = data.security_posture ?? (data.posture ? {
    posture_score: data.posture.posture_score ?? data.posture.score,
    overall_rating: data.posture.overall_rating ?? data.posture.rating,
  } : null);
  const meta = data.metadata || {};
  const vdrAcceptance = data.vdr_acceptance;
  const vdrOutcome = data.vdr_outcome;
  const hasDeltas = !!(data.kpi?.delta_7d || data.kpi?.delta_30d || data.deltas);
  const hasScanSources = Array.isArray(data.scan_sources) && data.scan_sources.length > 0;
  const hasDetectionSources = !!(data.detection_sources ?? data.snapshot?.detection_sources);

  // Build deltas from either kpi.delta_7d (legacy) or data.deltas.vs_7d (current)
  const zeroDelta = { total: 0, critical: 0, lev: 0, irv: 0, compliance: 0, unique_cves: 0 };
  const buildDelta = (src: any) => {
    if (!src) return zeroDelta;
    // If src already has flat numeric fields (legacy format), use directly
    if (typeof src.total === "number" && !src.total?.change) return src;
    // Current schema: each field is { change: N, ... }
    return {
      total: src.total?.change ?? 0,
      critical: src.critical?.change ?? 0,
      lev: src.lev?.change ?? 0,
      irv: src.irv?.change ?? 0,
      compliance: src.compliance?.change ?? src.compliance_rate?.change ?? 0,
      unique_cves: src.unique_cves?.change ?? 0,
    };
  };
  const d7 = kpi.delta_7d ?? buildDelta(data.deltas?.vs_7d);
  const d30 = kpi.delta_30d ?? buildDelta(data.deltas?.vs_30d);

  // Severity counters for the four .vbox tiles (critical/high/medium/low).
  // VDR-assessed (post-contextual-scoring) is the authoritative headline; fall
  // back to legacy risk.severity. The raw scanner severity is shown separately.
  const sevSource = data?.risk?.severity_assessed ?? data?.severity_distribution ?? data?.snapshot?.severity ?? data?.risk?.severity ?? {};
  const sevOriginal = data?.risk?.severity_original ?? null;
  const sevNote = data?.risk?.severity_note ?? null;
  const ORIG_BUCKETS = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
  const sevCounts: { label: string; value: number }[] = [
    { label: "Critical", value: sevSource.CRITICAL ?? kpi.critical_count ?? 0 },
    { label: "High", value: sevSource.HIGH ?? 0 },
    { label: "Medium", value: sevSource.MEDIUM ?? 0 },
    { label: "Low", value: sevSource.LOW ?? 0 },
  ];

  return (
    <div className="wrap" style={{ padding: "32px 32px 60px" }}>

      {/* ── Header ── */}
      <div className="kick">FRR-CVM · COORDINATED DISCLOSURE · PUBLIC</div>
      <h1 className="big">Vulnerability <span className="g">data</span></h1>
      <p className="lede">
        FedRAMP 20x Vulnerability Detection &amp; Response — aggregate finding counts streamed openly. No sensitive data.
        {posture && (
          <> Security score <span className="mono" style={{ color: INDIGO }}>{posture.posture_score}/10</span> · <span className="mono" style={{ color: SIGNAL }}>{posture.overall_rating}</span>.</>
        )}
      </p>

      {/* ──────────────────────────────────────────────
          SEVERITY BREAKDOWN — VDR-assessed (authoritative) headline tiles,
          with the original scanner severity as a muted comparison row
         ────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "0 0 9px" }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", color: SIGNAL }}>
          VDR-Assessed
        </span>
        <span className="tag ok" style={{ fontSize: 9 }}>AUTHORITATIVE</span>
      </div>
      <div className="g4" style={{ marginBottom: sevOriginal ? 10 : 14 }}>
        {sevCounts.map((s, i) => {
          const cls = s.value === 0 ? "z" : i === 0 ? "r" : "h";
          return (
            <div className="vbox" key={i}>
              {s.value === 0 && <div className="glow" />}
              <div className={`big ${cls}`} style={mono}>{s.value}</div>
              <div className="lab">{s.label} · open</div>
            </div>
          );
        })}
      </div>

      {sevOriginal && (
        <div className="panel" style={{ marginBottom: sevNote ? 8 : 14, padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", color: ASH }}>
              Original scanner
            </span>
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".04em", textTransform: "uppercase", color: FAINT }}>
              pre-assessment
            </span>
            <div style={{ display: "flex", gap: 18, marginLeft: "auto", flexWrap: "wrap" }}>
              {ORIG_BUCKETS.map((b) => (
                <span key={b} className="mono" style={{ fontSize: 12, color: ASH }}>
                  {b.charAt(0) + b.slice(1).toLowerCase()}{" "}
                  <span style={{ color: (sevOriginal[b] ?? 0) > 0 ? INDIGO : FAINT, fontWeight: 600 }}>{sevOriginal[b] ?? 0}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {sevNote && (
        <p className="mono" style={{ fontSize: 11, color: FAINT, lineHeight: 1.6, margin: "0 0 16px" }}>
          {sevNote}
        </p>
      )}

      {/* ──────────────────────────────────────────────
          POSTURE + ATTACK SURFACE — two panels
         ────────────────────────────────────────────── */}
      <div className="g2">
        {/* Posture */}
        <div className="panel">
          <div className="ph"><h4>Posture</h4><span className="map">FRR-CVM-04 · {kpi.compliance_rate >= 100 ? "COMPLIANT" : "REVIEW"}</span></div>
          {[
            { l: "Security posture", v: posture ? `${posture.overall_rating} · ${posture.posture_score}` : "—", t: "ok" },
            { l: "Active / accepted", v: `${vdrAcceptance?.active ?? 0} active · ${vdrAcceptance?.accepted ?? 0} accepted`, t: "ok" },
            { l: "KEV matches", v: `${kpi.kev_count}`, t: kpi.kev_count > 0 ? "red" : "ok" },
            { l: "LEV / IRV", v: `${kpi.lev_count} LEV · ${kpi.irv_count} IRV`, t: (kpi.lev_count > 0 || kpi.irv_count > 0) ? "warn" : "ok" },
            { l: "Unique CVEs", v: `${kpi.unique_cves}`, t: "vi" },
          ].map((r, i) => (
            <div className="row" key={i}>
              <span className="svc" style={{ fontSize: 13 }}>{r.l}</span>
              <span className="mono" style={{ marginLeft: "auto" }}>{r.v}</span>
              <span style={{ marginLeft: 12 }}><span className={`tag ${r.t}`}>●</span></span>
            </div>
          ))}
        </div>

        {/* Attack surface */}
        <div className="panel">
          <div className="ph"><h4>Attack surface</h4><span className="map">graph analysis</span></div>
          {atk ? (
            [
              { l: "Nodes", v: atk.graph_node_count.toLocaleString() },
              { l: "Edges", v: (atk.graph_edge_count ?? 0).toLocaleString() },
              { l: "Paths", v: `${atk.total_attack_paths}` },
              { l: "Critical paths", v: `${atk.critical_attack_paths}` },
              { l: "Blast radius", v: atk.blast_radius_score.toFixed(1) },
            ].map((r, i) => (
              <div className="row" key={i}>
                <span className="svc" style={{ fontSize: 13 }}>{r.l}</span>
                <span className="mono" style={{ marginLeft: "auto", color: INK }}>{r.v}</span>
              </div>
            ))
          ) : (
            <div className="row"><span className="mono" style={{ color: ASH }}>No attack-surface data</span></div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          OPERATIONAL STATUS — KPI tiles + verdict
         ────────────────────────────────────────────── */}
      {vdrOutcome && (() => {
        const verdictStyle = (v?: string) => {
          const key = (v || "unknown").toLowerCase();
          if (["pass", "passing", "clean", "operational", "met"].includes(key))
            return { tag: "ok", label: key.toUpperCase() };
          if (["fail", "failing", "missing", "breached"].includes(key))
            return { tag: "red", label: key.toUpperCase() };
          if (["partial", "degraded", "warning"].includes(key))
            return { tag: "warn", label: key.toUpperCase() };
          return { tag: "vi", label: key.toUpperCase() };
        };
        const overall = verdictStyle(vdrOutcome.overall_verdict);
        const m2 = vdrOutcome.mode_2_output_rate;
        const m3 = vdrOutcome.mode_3_critical_override;
        const m2Metrics = m2?.metrics || {};
        const remRate = m2Metrics.remediation_rate_pct;
        const remTarget = m2Metrics.remediation_target_pct;
        const breachCount = Array.isArray(m3?.breaches) ? m3.breaches.length : 0;
        const remOk = typeof remRate === "number" && remRate >= (remTarget ?? 0);
        const remAccent = typeof remRate !== "number" ? "" : remOk ? "s" : "a";
        const tiles: { label: string; value: React.ReactNode; sub?: React.ReactNode; accent: string }[] = [];
        if (typeof remRate === "number") {
          tiles.push({
            label: "Remediation Rate",
            value: `${remRate}%`,
            sub: typeof remTarget === "number" ? `${remTarget}% target` : undefined,
            accent: remAccent,
          });
        }
        if (m2Metrics.oldest_active_critical_days != null) {
          tiles.push({
            label: "Oldest Active Critical",
            value: m2Metrics.oldest_active_critical_days,
            sub: "days",
            accent: "",
          });
        }
        tiles.push({
          label: "Critical SLA Breaches",
          value: breachCount,
          sub: breachCount === 1 ? "breach" : "breaches",
          accent: breachCount > 0 ? "a" : "s",
        });
        const overdue = (m2Metrics.active_n5_overdue ?? 0) + (m2Metrics.active_n4_overdue ?? 0);
        if (typeof m2Metrics.active_n5_overdue === "number" || typeof m2Metrics.active_n4_overdue === "number") {
          tiles.push({
            label: "Overdue Items",
            value: overdue,
            sub: "high & critical",
            accent: overdue > 0 ? "a" : "s",
          });
        }
        return (
          <>
            <h3 className="sec">Operational status · <span className={`tag ${overall.tag}`} style={{ marginLeft: 6 }}>{overall.label}</span></h3>
            <div className="g4">
              {tiles.map((t, i) => (
                <div className="kpi" key={i}>
                  <div className={`v ${t.accent}`}>{t.value}</div>
                  <div className="l">{t.label}</div>
                  {t.sub && <div className="sub">{t.sub}</div>}
                </div>
              ))}
            </div>
          </>
        );
      })()}

      {/* ──────────────────────────────────────────────
          VDR ACCEPTANCE
         ────────────────────────────────────────────── */}
      {vdrAcceptance && (
        <>
          <h3 className="sec">VDR acceptance · SLA window</h3>
          <div className="g3">
            <div className="kpi"><div className="v">{vdrAcceptance.threshold_days ?? 0}d</div><div className="l">Threshold</div></div>
            <div className="kpi"><div className="v s">{vdrAcceptance.accepted ?? 0}</div><div className="l">Accepted</div></div>
            <div className="kpi"><div className="v a">{vdrAcceptance.active ?? 0}</div><div className="l">Active</div></div>
          </div>
        </>
      )}

      {/* ──────────────────────────────────────────────
          TREND CHART — full-width line chart with toggle
         ────────────────────────────────────────────── */}
      <h3 className="sec">Remediation trend</h3>
      <div className="panel">
        <div className="ph">
          <h4>
            Peak <span className="mono" style={{ color: ASH }}>{trendPeak.toLocaleString()}</span>
            <span className="mono" style={{ color: FAINT, margin: "0 8px" }}>→</span>
            Current <span className="mono" style={{ color: SIGNAL }}>{kpi.total_vulnerabilities}</span>
          </h4>
          <div className="seg">
            {(["daily", "weekly", "monthly"] as const).map(m => (
              <button key={m} className={trendMode === m ? "on" : ""} onClick={() => setTrendMode(m)}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 12px 8px" }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SIGNAL} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={SIGNAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={LINE} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: ASH, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={formatDate} interval="preserveStartEnd" />
              <YAxis tick={{ fill: ASH, fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin - 20", "dataMax + 20"]} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="total_vulnerabilities" name="Total" stroke={SIGNAL} strokeWidth={2} dot={trendMode !== "daily" ? { r: 3, fill: SIGNAL, stroke: RAISE, strokeWidth: 2 } : false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          SEVERITY DONUT + N-RATING BAR (side-by-side)
         ────────────────────────────────────────────── */}
      <div className="g2" style={{ marginTop: 12 }}>
        {/* Severity Donut */}
        <div className="panel">
          <div className="ph"><h4>Severity distribution</h4><span className="map">open findings</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "18px 20px" }}>
            <div style={{ width: 140, height: 140, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sevDonut} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} strokeWidth={0}>
                    {sevDonut.map((e: any, i: number) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {sevDonut.map((s: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", display: "inline-block", background: s.fill }} />
                    <span style={{ fontSize: 13, color: ASH }}>{s.name}</span>
                  </span>
                  <span className="mono" style={{ color: INK }}>{s.value}</span>
                </div>
              ))}
              {sevDonut.length === 0 && <div className="mono" style={{ color: SIGNAL }}>No vulnerabilities</div>}
            </div>
          </div>
        </div>

        {/* N-Rating Bar */}
        <div className="panel">
          <div className="ph"><h4>N-rating distribution</h4><span className="map">severity tiers</span></div>
          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {nRatingData.map((n: any, i: number) => {
              const total = kpi.total_vulnerabilities || 1;
              const pct = (n.value / total) * 100;
              const nColors: Record<string, string> = { N1: RED, N2: AMBER, N3: AMBER, N4: INDIGO, N5: SIGNAL, unrated: FAINT };
              return (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: ASH }}>{n.name}</span>
                    <span className="mono" style={{ color: INK }}>{n.value}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "#0A0E13", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 4, transition: "width .5s", width: `${Math.max(pct, n.value > 0 ? 2 : 0)}%`, background: nColors[n.name] || FAINT }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          DETECTION SOURCES BAR — 9 FedRAMP categories
         ────────────────────────────────────────────── */}
      {hasDetectionSources && (
      <>
        <h3 className="sec">Detection sources · FedRAMP required categories</h3>
        <div className="panel">
          <div style={{ padding: "18px 12px 8px" }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sourceBarData} barCategoryGap="16%">
                <CartesianGrid stroke={LINE} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: ASH, fontSize: 10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fill: FAINT, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="count" name="Findings" radius={[4, 4, 0, 0]}>
                  {sourceBarData.map((e: any, i: number) => <Cell key={i} fill={e.color} fillOpacity={e.count > 0 ? 1 : 0.25} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 12 }}>
              {sourceBarData.map((s: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, display: "inline-block", background: s.color, opacity: s.count > 0 ? 1 : 0.3 }} />
                  <span style={{ color: s.count > 0 ? ASH : FAINT }}>{s.name}</span>
                  <span className="mono" style={{ color: INK }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
      )}

      {/* ──────────────────────────────────────────────
          RISK GAUGES — LEV / IRV / KEV circular meters
         ────────────────────────────────────────────── */}
      <h3 className="sec">Risk classification rates</h3>
      <div className="panel">
        <div style={{ display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap", padding: "24px 20px 8px" }}>
          <RiskGauge label="LEV Rate" value={kpi.lev_count} max={kpi.total_vulnerabilities} />
          <RiskGauge label="IRV Rate" value={kpi.irv_count} max={kpi.total_vulnerabilities} />
          <RiskGauge label="KEV Rate" value={kpi.kev_count} max={kpi.total_vulnerabilities} />
        </div>
        <div className="mono" style={{ textAlign: "center", padding: "4px 20px 20px", fontSize: 11, color: ASH }}>
          All rates at 0% — no laterally exploitable, internet-reachable, or known-exploited vulnerabilities
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          ENVIRONMENT OVERVIEW — resource breakdown + posture
         ────────────────────────────────────────────── */}
      {env && (
      <>
        <h3 className="sec">Environment overview</h3>
        <div className="g2">
          {/* Resource Breakdown */}
          <div className="panel">
            <div className="ph"><h4>Resource breakdown</h4><span className="map">{env.total_resources} resources</span></div>
            {Object.entries(env.resource_breakdown).map(([name, count]: [string, any]) => (
              <div className="row" key={name}>
                <span className="svc" style={{ fontSize: 13 }}>{name}</span>
                <span className="mono" style={{ marginLeft: "auto", color: INK }}>{count}</span>
              </div>
            ))}
            <div className="row">
              <span className="svc" style={{ fontSize: 13 }}>Aggregation ratio</span>
              <span className="mono" style={{ marginLeft: "auto", color: INK }}>{env.aggregation_ratio}</span>
            </div>
          </div>
          {/* Posture Score */}
          <div className="panel">
            <div className="ph"><h4>Posture score</h4><span className="map">composite</span></div>
            <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="mono" style={{ fontSize: 40, fontWeight: 500, color: INDIGO, lineHeight: 1 }}>{env.posture_score}</span>
                <span className="mono" style={{ color: ASH }}>/10</span>
              </div>
              <div style={{ width: "100%", background: "#0A0E13", borderRadius: 5, height: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 5, background: INDIGO, transition: "width .5s", width: `${(env.posture_score / 10) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </>
      )}

      {/* ──────────────────────────────────────────────
          DELTA COMPARISON CARDS — 7d and 30d changes
         ────────────────────────────────────────────── */}
      {hasDeltas && (
      <>
        <h3 className="sec">Change comparison</h3>
        <div className="g2">
          {[
            { period: "7-Day Change", delta: d7 },
            { period: "30-Day Change", delta: d30 },
          ].map((p, pi) => (
            <div className="panel" key={pi}>
              <div className="ph"><h4>{p.period}</h4><span className="map">delta</span></div>
              {[
                { label: "Total", value: p.delta.total },
                { label: "Critical", value: p.delta.critical },
                { label: "LEV", value: p.delta.lev },
                { label: "IRV", value: p.delta.irv },
                { label: "Compliance", value: p.delta.compliance, suffix: "%" },
                { label: "CVEs", value: p.delta.unique_cves },
              ].map((item, i) => (
                <div className="row" key={i}>
                  <span className="svc" style={{ fontSize: 13 }}>{item.label}</span>
                  <span style={{ marginLeft: "auto" }}><DeltaArrow value={item.value} suffix={item.suffix || ""} /></span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </>
      )}

      {/* ──────────────────────────────────────────────
          COMPLIANCE BANNER
         ────────────────────────────────────────────── */}
      <h3 className="sec">Compliance status · <span className={`tag ${kpi.compliance_rate >= 100 ? "ok" : "red"}`} style={{ marginLeft: 6 }}>{kpi.compliance_rate >= 100 ? "COMPLIANT" : "NON-COMPLIANT"}</span></h3>
      <div className="panel">
        <div style={{ padding: "18px 20px" }}>
          {meta.sla_threshold && (
            <div className="mono" style={{ color: ASH, marginBottom: 12, fontSize: 12 }}>
              SLA Threshold: <span style={{ color: INK }}>{meta.sla_threshold}</span>
            </div>
          )}
          {/* Compliance rate bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, background: "#0A0E13", borderRadius: 6, height: 12, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 6, transition: "width .7s", width: `${kpi.compliance_rate}%`, background: kpi.compliance_rate >= 100 ? SIGNAL : kpi.compliance_rate >= 90 ? AMBER : RED }} />
            </div>
            <span className="mono" style={{ fontSize: 16, fontWeight: 600, color: kpi.compliance_rate >= 100 ? SIGNAL : AMBER }}>
              {kpi.compliance_rate}%
            </span>
          </div>
          {/* FRR Requirements */}
          {data.compliance_requirements && (
            <div className="g2" style={{ marginTop: 16, gap: 6 }}>
              {data.compliance_requirements.map((req: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                  <Check ok={req.status === "met"} />
                  <span className="mono" style={{ color: ASH, fontSize: 11 }}>{req.id}</span>
                  <span style={{ fontSize: 12, color: ASH, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          SCAN SOURCES TABLE — expandable for 3PAO reviewers
         ────────────────────────────────────────────── */}
      {hasScanSources && (
      <div className="panel" style={{ marginTop: 12 }}>
        <div className="ph" style={{ cursor: "pointer" }} onClick={() => setScanTableOpen(!scanTableOpen)}>
          <h4 style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            Scan sources detail
            <span className="mono" style={{ color: ASH, fontSize: 11, fontWeight: 400 }}>{data.scan_sources?.length || 0} active scan sources — click to {scanTableOpen ? "collapse" : "expand"}</span>
          </h4>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: ASH, transition: "transform .15s", transform: scanTableOpen ? "rotate(180deg)" : "none" }}>
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {scanTableOpen && data.scan_sources && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                  {["Source", "Type", "Category", "Findings", "Last Scan"].map((h, i) => (
                    <th key={i} className="mono" style={{ textAlign: i === 3 ? "right" : "left", padding: "12px 20px", fontSize: 10, letterSpacing: ".05em", color: ASH, textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.scan_sources.map((src: any, i: number) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
                    <td style={{ padding: "12px 20px", color: INK, fontWeight: 500 }}>{src.source_name}</td>
                    <td style={{ padding: "12px 20px", color: ASH }}>{src.scan_type}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <span className="mono" style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, background: `${SOURCE_COLORS[src.category] || FAINT}20`, color: SOURCE_COLORS[src.category] || ASH }}>
                        {src.category}
                      </span>
                    </td>
                    <td className="mono" style={{ padding: "12px 20px", textAlign: "right", color: INK }}>{src.findings}</td>
                    <td style={{ padding: "12px 20px", color: ASH }}>{new Date(src.last_scan).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* ──────────────────────────────────────────────
          ATTACK SURFACE CARD — collapsed by default
         ────────────────────────────────────────────── */}
      {atk && (
        <div className="panel" style={{ marginTop: 12 }}>
          <div className="ph" style={{ cursor: "pointer" }} onClick={() => setAttackSurfaceOpen(!attackSurfaceOpen)}>
            <h4 style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              Attack surface analysis
              <span className="mono" style={{ color: ASH, fontSize: 11, fontWeight: 400 }}>
                {atk.total_attack_paths} attack paths · {atk.critical_attack_paths} critical · blast radius {atk.blast_radius_score.toFixed(1)}
              </span>
            </h4>
            <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {atk.critical_attack_paths === 0 && (
                <span className="tag ok">NO CRITICAL PATHS</span>
              )}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: ASH, transition: "transform .15s", transform: attackSurfaceOpen ? "rotate(180deg)" : "none" }}>
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          {attackSurfaceOpen && (
            <div style={{ padding: "18px 20px" }}>
              <div className="g3">
                {[
                  { l: "Attack Paths", v: atk.total_attack_paths, a: "i" },
                  { l: "Critical Paths", v: atk.critical_attack_paths, a: atk.critical_attack_paths > 0 ? "a" : "s" },
                  { l: "Exploitable", v: atk.exploitable_paths, a: atk.exploitable_paths > 0 ? "a" : "s" },
                  { l: "Blast Radius", v: atk.blast_radius_score.toFixed(1), a: atk.blast_radius_score > 0 ? "a" : "s" },
                  { l: "Graph Nodes", v: atk.graph_node_count, a: "" },
                  { l: "Graph Edges", v: (atk.graph_edge_count ?? 0).toLocaleString(), a: "" },
                ].map((item, i) => (
                  <div className="kpi" key={i}>
                    <div className={`v ${item.a}`}>{item.v}</div>
                    <div className="l">{item.l}</div>
                  </div>
                ))}
              </div>
              {atk.avg_path_risk_score != null && (
                <div className="row" style={{ borderTop: `1px solid ${LINE}`, marginTop: 16 }}>
                  <span className="svc" style={{ fontSize: 13 }}>Average path risk score</span>
                  <span className="mono" style={{ marginLeft: "auto", color: INK }}>{atk.avg_path_risk_score}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────
          CTA
         ────────────────────────────────────────────── */}
      <div className="cta">
        <h3>Found a vulnerability? Report it through coordinated disclosure.</h3>
        <button className="btn" onClick={() => window.location.href = "mailto:security@meridianks.com?subject=Vulnerability%20Disclosure"}>Submit a report →</button>
      </div>

      {/* Footer */}
      <div className="mono" style={{ paddingTop: 20, marginTop: 24, borderTop: `1px solid ${LINE}`, display: "flex", justifyContent: "flex-end", fontSize: 11, color: FAINT }}>
        <span>Generated {meta.generated_at ? new Date(meta.generated_at).toLocaleDateString() : "N/A"}</span>
      </div>
    </div>
  );
}
