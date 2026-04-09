import { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid, PieChart, Pie, LineChart, Line,
} from "recharts";

import { BASE_PATH } from '../../config/theme';

const SEV_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#3b82f6", INFO: "#6b7280"
};

const SOURCE_COLORS: Record<string, string> = {
  Inspector: "#3b82f6", "Security Hub": "#8b5cf6", Pentest: "#ec4899",
  Audit: "#f97316", Incident: "#ef4444", SCA: "#10b981",
  SAST: "#06b6d4", DAST: "#a855f7", External: "#64748b"
};

const mono: React.CSSProperties = { fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace" };

// --- Shared tooltip ---
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-zinc-500 text-[10px] tracking-wide mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5 text-zinc-200">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-zinc-400">{p.name}:</span>
          <span className="font-bold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// --- Check icon ---
const Check = ({ ok }: { ok: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    {ok ? (
      <><circle cx="8" cy="8" r="7" fill="#065f4620" stroke="#10b981" strokeWidth="1.5" /><path d="M5 8l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>
    ) : (
      <><circle cx="8" cy="8" r="7" fill="#7f1d1d20" stroke="#ef4444" strokeWidth="1.5" /><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" /></>
    )}
  </svg>
);

// --- Delta arrow ---
const DeltaArrow = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  if (value === 0) return <span className="text-zinc-500 text-xs">-</span>;
  const isDown = value < 0;
  return (
    <span className={`text-xs font-semibold flex items-center gap-0.5 ${isDown ? "text-emerald-400" : "text-rose-400"}`}>
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
  const color = pct === 0 ? "#10b981" : pct < 25 ? "#eab308" : pct < 50 ? "#f97316" : "#ef4444";
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ - (circ * Math.min(pct, 100)) / 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#27272a" strokeWidth="6" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dashOffset}
          transform="rotate(-90 45 45)" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        <text x="45" y="42" textAnchor="middle" fill={color} fontSize="18" fontWeight="800" style={mono}>
          {pct.toFixed(0)}%
        </text>
        <text x="45" y="56" textAnchor="middle" fill="#71717a" fontSize="9">rate</text>
      </svg>
      <span className="text-[11px] text-zinc-400 font-medium">{label}</span>
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

  // Derived trend data
  const trendData = useMemo(() => {
    if (!data?.trends) return [];
    if (trendMode === "daily") return (data.trends.daily || []).map(normalizeTrendEntry);
    if (trendMode === "weekly") {
      return (data.trends.weekly || []).map((w: any) => normalizeTrendEntry({
        date: w.week_start ?? w.date,
        total_vulnerabilities: w.avg_total ?? w.total,
        active_count: w.avg_active ?? w.active,
      }));
    }
    // monthly — use monthly array if available, else aggregate from daily
    if (data.trends.monthly?.length) {
      return data.trends.monthly.map(normalizeTrendEntry);
    }
    const grouped: Record<string, number[]> = {};
    (data.trends.daily || []).forEach((d: any) => {
      const m = d.date.slice(0, 7);
      if (!grouped[m]) grouped[m] = [];
      grouped[m].push(d.total ?? d.total_vulnerabilities);
    });
    return Object.entries(grouped).map(([month, vals]) => ({
      date: month,
      total_vulnerabilities: Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length),
    }));
  }, [data, trendMode]);

  // Severity donut data — supports both data.severity_distribution and data.snapshot.severity
  const sevDonut = useMemo(() => {
    const sev = data?.severity_distribution ?? data?.snapshot?.severity;
    if (!sev) return [];
    return Object.entries(sev)
      .filter(([, v]) => (v as number) > 0)
      .map(([name, value]) => ({ name, value: value as number, fill: SEV_COLORS[name] || "#6b7280" }));
  }, [data]);

  // N-rating bar data — supports both data.n_rating_distribution and data.snapshot.n_ratings
  const nRatingData = useMemo(() => {
    const nr = data?.n_rating_distribution ?? data?.snapshot?.n_ratings;
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
      return { name: displayName, count, color: SOURCE_COLORS[displayName] || "#6b7280" };
    });
  }, [data]);

  // Peak value for trend annotation
  const trendPeak = useMemo(() => {
    const daily = data?.trends?.daily || [];
    if (!daily.length) return 0;
    return Math.max(...daily.map((d: any) => d.total_vulnerabilities ?? d.total));
  }, [data]);

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
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-zinc-600 text-sm font-medium">Loading VDR metrics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-zinc-600 text-sm font-medium">VDR metrics not available</div>
      </div>
    );
  }

  // Build kpi from either data.kpi (legacy) or data.snapshot (current schema)
  const snap = data.snapshot || {};
  const kpi = data.kpi || {
    total_vulnerabilities: snap.total_vulnerabilities ?? 0,
    critical_count: snap.critical_findings ?? snap.severity?.CRITICAL ?? 0,
    lev_count: snap.lev_count ?? 0,
    irv_count: snap.irv_count ?? 0,
    kev_count: snap.kev_matches ?? 0,
    compliance_rate: snap.compliance_rate ?? 0,
    unique_cves: snap.unique_cves ?? 0,
  };
  const env = data.environment;
  const atk = data.attack_surface;
  const posture = data.security_posture;
  const meta = data.metadata || {};

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

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans" style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="max-w-[1200px] mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <h1 className="text-xl font-extrabold text-white tracking-tight">VDR Metrics</h1>
              <span className="text-[10px] bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded font-semibold tracking-wide">PUBLIC</span>
              <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded font-medium">v{data.schema_version ?? meta.schema_version}</span>
            </div>
            <p className="text-xs text-zinc-600">FedRAMP 20x Vulnerability Detection &amp; Response</p>
          </div>
          {posture && (
            <div className="text-right">
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1">Security Score</div>
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="text-2xl font-extrabold text-blue-500" style={mono}>{posture.posture_score}</span>
                <span className="text-xs text-zinc-600">/10</span>
                <span className="text-[11px] font-bold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded ml-1">{posture.overall_rating}</span>
              </div>
            </div>
          )}
        </div>

        {/* ──────────────────────────────────────────────
            1. KPI STRIP — 6 large cards with 7-day deltas
           ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total", value: kpi.total_vulnerabilities, delta: d7.total, color: "#d97706" },
            { label: "Critical", value: kpi.critical_count, delta: d7.critical, color: kpi.critical_count > 0 ? "#ef4444" : "#10b981" },
            { label: "LEV", value: kpi.lev_count, delta: d7.lev, color: kpi.lev_count > 0 ? "#ef4444" : "#10b981" },
            { label: "IRV", value: kpi.irv_count, delta: d7.irv, color: kpi.irv_count > 0 ? "#ef4444" : "#10b981" },
            { label: "Compliance", value: `${kpi.compliance_rate}%`, delta: d7.compliance, color: "#10b981", suffix: "%" },
            { label: "Unique CVEs", value: kpi.unique_cves, delta: d7.unique_cves, color: "#8b5cf6" },
          ].map((k, i) => (
            <div key={i} className="bg-[#141416] border border-white/[0.04] rounded-xl p-4 flex flex-col">
              <div className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] font-bold mb-1">{k.label}</div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-extrabold" style={{ ...mono, color: k.color, lineHeight: 1.1 }}>{k.value}</span>
                <DeltaArrow value={k.delta} suffix={k.suffix || ""} />
              </div>
              <div className="text-[10px] text-zinc-700 mt-1">7-day change</div>
            </div>
          ))}
        </div>

        {/* ──────────────────────────────────────────────
            2. TREND CHART — full-width line chart with toggle
           ────────────────────────────────────────────── */}
        <div className="bg-[#141416] border border-white/[0.04] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] font-bold mb-1">Remediation Trend</div>
              <div className="text-xs text-zinc-500">
                Peak: <span className="text-zinc-300 font-bold" style={mono}>{trendPeak.toLocaleString()}</span>
                <span className="mx-2 text-zinc-700">→</span>
                Current: <span className="text-zinc-300 font-bold" style={mono}>{kpi.total_vulnerabilities}</span>
              </div>
            </div>
            <div className="flex gap-0.5 bg-zinc-900 rounded-lg p-0.5">
              {(["daily", "weekly", "monthly"] as const).map(m => (
                <button key={m} onClick={() => setTrendMode(m)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                    trendMode === m ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-400"
                  }`}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e1e22" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={formatDate} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin - 20", "dataMax + 20"]} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="total_vulnerabilities" name="Total" stroke="#3b82f6" strokeWidth={2} dot={trendMode !== "daily" ? { r: 3, fill: "#3b82f6", stroke: "#09090b", strokeWidth: 2 } : false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ──────────────────────────────────────────────
            3. SEVERITY DONUT + N-RATING BAR (side-by-side)
           ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Severity Donut */}
          <div className="bg-[#141416] border border-white/[0.04] rounded-xl p-5">
            <div className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] font-bold mb-3">Severity Distribution</div>
            <div className="flex items-center gap-6">
              <div className="w-[140px] h-[140px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sevDonut} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} strokeWidth={0}>
                      {sevDonut.map((e: any, i: number) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                {sevDonut.map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: s.fill }} />
                      <span className="text-xs text-zinc-400">{s.name}</span>
                    </div>
                    <span className="text-sm font-bold text-zinc-200" style={mono}>{s.value}</span>
                  </div>
                ))}
                {sevDonut.length === 0 && <div className="text-xs text-zinc-600">No vulnerabilities</div>}
              </div>
            </div>
          </div>

          {/* N-Rating Bar */}
          <div className="bg-[#141416] border border-white/[0.04] rounded-xl p-5">
            <div className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] font-bold mb-3">N-Rating Distribution</div>
            <div className="space-y-2.5 mt-2">
              {nRatingData.map((n: any, i: number) => {
                const total = kpi.total_vulnerabilities || 1;
                const pct = (n.value / total) * 100;
                const nColors: Record<string, string> = { N1: "#ef4444", N2: "#f97316", N3: "#eab308", N4: "#3b82f6", N5: "#10b981", unrated: "#3f3f46" };
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-400">{n.name}</span>
                      <span className="text-xs font-bold text-zinc-300" style={mono}>{n.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, n.value > 0 ? 2 : 0)}%`, background: nColors[n.name] || "#3f3f46" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────
            4. DETECTION SOURCES BAR — 9 FedRAMP categories
           ────────────────────────────────────────────── */}
        <div className="bg-[#141416] border border-white/[0.04] rounded-xl p-5">
          <div className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] font-bold mb-4">Detection Sources — FedRAMP Required Categories</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sourceBarData} barCategoryGap="16%">
              <CartesianGrid stroke="#1e1e22" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: "#3f3f46", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="count" name="Findings" radius={[4, 4, 0, 0]}>
                {sourceBarData.map((e: any, i: number) => <Cell key={i} fill={e.color} fillOpacity={e.count > 0 ? 1 : 0.25} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {sourceBarData.map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: s.color, opacity: s.count > 0 ? 1 : 0.3 }} />
                <span className={s.count > 0 ? "text-zinc-400" : "text-zinc-600"}>{s.name}</span>
                <span className="font-bold text-zinc-300" style={mono}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ──────────────────────────────────────────────
            5. RISK GAUGES — LEV / IRV / KEV circular meters
           ────────────────────────────────────────────── */}
        <div className="bg-[#141416] border border-white/[0.04] rounded-xl p-5">
          <div className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] font-bold mb-4">Risk Classification Rates</div>
          <div className="flex justify-center gap-12 flex-wrap">
            <RiskGauge label="LEV Rate" value={kpi.lev_count} max={kpi.total_vulnerabilities} />
            <RiskGauge label="IRV Rate" value={kpi.irv_count} max={kpi.total_vulnerabilities} />
            <RiskGauge label="KEV Rate" value={kpi.kev_count} max={kpi.total_vulnerabilities} />
          </div>
          <div className="text-center mt-3 text-[11px] text-zinc-600">
            All rates at 0% — no laterally exploitable, internet-reachable, or known-exploited vulnerabilities
          </div>
        </div>

        {/* ──────────────────────────────────────────────
            6. ENVIRONMENT OVERVIEW — resource breakdown + posture
           ────────────────────────────────────────────── */}
        {env && (
        <div className="bg-[#141416] border border-white/[0.04] rounded-xl p-5">
          <div className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] font-bold mb-4">Environment Overview</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Resource Breakdown */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(env.resource_breakdown).map(([name, count]: [string, any]) => (
                  <div key={name} className="bg-zinc-900/60 rounded-lg px-3 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">{name}</span>
                    <span className="text-sm font-bold text-zinc-200" style={mono}>{count}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-6 mt-3 text-xs text-zinc-500">
                <span>Total Resources: <span className="text-zinc-300 font-bold" style={mono}>{env.total_resources}</span></span>
                <span>Aggregation Ratio: <span className="text-zinc-300 font-bold" style={mono}>{env.aggregation_ratio}</span></span>
              </div>
            </div>
            {/* Posture Score */}
            <div className="bg-zinc-900/40 rounded-lg p-4 flex flex-col items-center justify-center">
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-2">Posture Score</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-blue-500" style={mono}>{env.posture_score}</span>
                <span className="text-sm text-zinc-600">/10</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 mt-3 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(env.posture_score / 10) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ──────────────────────────────────────────────
            7. DELTA COMPARISON CARDS — 7d and 30d changes
           ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { period: "7-Day Change", delta: d7 },
            { period: "30-Day Change", delta: d30 },
          ].map((p, pi) => (
            <div key={pi} className="bg-[#141416] border border-white/[0.04] rounded-xl p-5">
              <div className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] font-bold mb-3">{p.period}</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total", value: p.delta.total },
                  { label: "Critical", value: p.delta.critical },
                  { label: "LEV", value: p.delta.lev },
                  { label: "IRV", value: p.delta.irv },
                  { label: "Compliance", value: p.delta.compliance, suffix: "%" },
                  { label: "CVEs", value: p.delta.unique_cves },
                ].map((item, i) => (
                  <div key={i} className="bg-zinc-900/40 rounded-lg px-3 py-2.5 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">{item.label}</span>
                    <DeltaArrow value={item.value} suffix={item.suffix || ""} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ──────────────────────────────────────────────
            8. COMPLIANCE BANNER
           ────────────────────────────────────────────── */}
        <div className="bg-[#141416] border border-white/[0.04] rounded-xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] font-bold">Compliance Status</div>
            <div className="flex items-center gap-2">
              {kpi.compliance_rate >= 100 ? (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-900/20 border border-emerald-800/30 px-2.5 py-1 rounded-md">COMPLIANT</span>
              ) : (
                <span className="text-[11px] font-bold text-rose-400 bg-rose-900/20 border border-rose-800/30 px-2.5 py-1 rounded-md">NON-COMPLIANT</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500 mb-3">
            {meta.vdr_standard && <span>Standard: <span className="text-zinc-300 font-semibold">{meta.vdr_standard}</span></span>}
            {meta.pipeline_version && <span>Pipeline: <span className="text-zinc-300 font-semibold">{meta.pipeline_version}</span></span>}
            {meta.sla_threshold && <span>SLA Threshold: <span className="text-zinc-300 font-semibold">{meta.sla_threshold}</span></span>}
          </div>
          {/* Compliance rate bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-zinc-800 rounded-full h-3 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${kpi.compliance_rate}%`, background: kpi.compliance_rate >= 100 ? "#10b981" : kpi.compliance_rate >= 90 ? "#eab308" : "#ef4444" }} />
            </div>
            <span className="text-sm font-extrabold" style={{ ...mono, color: kpi.compliance_rate >= 100 ? "#10b981" : "#eab308" }}>
              {kpi.compliance_rate}%
            </span>
          </div>
          {/* FRR Requirements */}
          {data.compliance_requirements && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-4">
              {data.compliance_requirements.map((req: any, i: number) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <Check ok={req.status === "met"} />
                  <span className="text-[11px] text-zinc-400">{req.id}</span>
                  <span className="text-[11px] text-zinc-500 truncate">{req.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ──────────────────────────────────────────────
            9. SCAN SOURCES TABLE — expandable for 3PAO reviewers
           ────────────────────────────────────────────── */}
        <div className="bg-[#141416] border border-white/[0.04] rounded-xl overflow-hidden">
          <button onClick={() => setScanTableOpen(!scanTableOpen)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors">
            <div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] font-bold">Scan Sources Detail</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{data.scan_sources?.length || 0} active scan sources — click to {scanTableOpen ? "collapse" : "expand"}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-zinc-500 transition-transform ${scanTableOpen ? "rotate-180" : ""}`}>
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {scanTableOpen && data.scan_sources && (
            <div className="border-t border-white/[0.04] overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left px-5 py-3 text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Source</th>
                    <th className="text-left px-5 py-3 text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Type</th>
                    <th className="text-left px-5 py-3 text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Category</th>
                    <th className="text-right px-5 py-3 text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Findings</th>
                    <th className="text-left px-5 py-3 text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Last Scan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.scan_sources.map((src: any, i: number) => (
                    <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                      <td className="px-5 py-3 text-zinc-200 font-medium">{src.source_name}</td>
                      <td className="px-5 py-3 text-zinc-400">{src.scan_type}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
                          style={{ background: `${SOURCE_COLORS[src.category] || "#3f3f46"}20`, color: SOURCE_COLORS[src.category] || "#71717a" }}>
                          {src.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-zinc-200" style={mono}>{src.findings}</td>
                      <td className="px-5 py-3 text-zinc-500">{new Date(src.last_scan).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ──────────────────────────────────────────────
            10. ATTACK SURFACE CARD — collapsed by default
           ────────────────────────────────────────────── */}
        {atk && (
          <div className="bg-[#141416] border border-white/[0.04] rounded-xl overflow-hidden">
            <button onClick={() => setAttackSurfaceOpen(!attackSurfaceOpen)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] font-bold">Attack Surface Analysis</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {atk.total_attack_paths} attack paths · {atk.critical_attack_paths} critical · blast radius {atk.blast_radius_score.toFixed(1)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {atk.critical_attack_paths === 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded">NO CRITICAL PATHS</span>
                )}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-zinc-500 transition-transform ${attackSurfaceOpen ? "rotate-180" : ""}`}>
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
            {attackSurfaceOpen && (
              <div className="border-t border-white/[0.04] p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { l: "Attack Paths", v: atk.total_attack_paths, c: "#3b82f6" },
                    { l: "Critical Paths", v: atk.critical_attack_paths, c: atk.critical_attack_paths > 0 ? "#ef4444" : "#10b981" },
                    { l: "Exploitable", v: atk.exploitable_paths, c: atk.exploitable_paths > 0 ? "#ef4444" : "#10b981" },
                    { l: "Blast Radius", v: atk.blast_radius_score.toFixed(1), c: atk.blast_radius_score > 0 ? "#d97706" : "#10b981" },
                    { l: "Graph Nodes", v: atk.graph_node_count, c: "#d4d4d8" },
                    { l: "Graph Edges", v: atk.graph_edge_count.toLocaleString(), c: "#d4d4d8" },
                  ].map((item, i) => (
                    <div key={i} className="bg-zinc-900/40 rounded-lg px-3 py-3 flex flex-col">
                      <span className="text-[10px] text-zinc-600 uppercase tracking-wide font-bold mb-1">{item.l}</span>
                      <span className="text-lg font-extrabold" style={{ ...mono, color: item.c }}>{item.v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-zinc-900/30 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Average Path Risk Score</span>
                  <span className="font-bold text-zinc-300" style={mono}>{atk.avg_path_risk_score}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-white/[0.04] flex justify-between items-center text-[10px] text-zinc-700 flex-wrap gap-2">
          <span>VDR Public Metrics v{data.schema_version ?? meta.schema_version} · {meta.privacy_notice}</span>
          <span>{meta.vdr_standard} · Generated {meta.generated_at ? new Date(meta.generated_at).toLocaleDateString() : "N/A"}</span>
        </div>
      </div>
    </div>
  );
}
