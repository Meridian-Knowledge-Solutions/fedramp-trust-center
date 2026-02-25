import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid
} from "recharts";

// Embedded data
const DATA = {
  metadata: { generated_at: "2026-02-09T08:40:43.350630+00:00", vdr_standard: "Release 25.09A (2025-09-10)", data_classification: "PUBLIC", privacy_notice: "Aggregate counts only. No resource IDs, CVE details, or sensitive data included." },
  current_snapshot: { timestamp: "2026-02-09T06:27:24.970027Z", total_vulnerabilities: 251, unique_cves: 164, affected_resource_count: 5, internet_reachable_resource_count: 0 },
  risk_classification: { n_rating_distribution: { N5: 0, N4: 0, N3: 132, N2: 118, N1: 1, unrated: 0 }, severity_distribution: { CRITICAL: 0, HIGH: 133, MEDIUM: 85, LOW: 33, INFO: 0 }, lev_count: 0, irv_count: 0, kev_matches: 0, critical_findings: 0 },
  compliance_status: { compliance_rate: 90.04, compliant_count: 226, non_compliant_count: 25, frr_cvm_04_status: "COMPLIANT" },
  security_posture: { overall_rating: "GOOD", posture_score: 7.0, network_security_enabled: true, iam_least_privilege: false, logging_comprehensive: true, encryption_at_rest: true },
  attack_surface: { graph_node_count: 62, graph_edge_count: 1085, total_attack_paths: 80, critical_attack_paths: 0, exploitable_paths: 0, avg_path_risk_score: 3.6, blast_radius_score: 0.0 },
  cspm_summary: { total_findings: 11, by_severity: { MEDIUM: 1, HIGH: 6, CRITICAL: 4 } },
  vdr_acceptance: { acceptance_threshold_days: 192, total_accepted: 0, total_active: 251 },
  exploit_type_distribution: { "Unknown/Other": 176, "Remote Code Execution": 7, "Information Disclosure": 24, "Privilege Escalation": 44 },
  risk_distribution: { CRITICAL: 0, HIGH: 60, MEDIUM: 159, LOW: 32 },
  trends: { daily: [
    { date: "2026-01-11", total_vulnerabilities: 167, active_count: 167 },
    { date: "2026-01-12", total_vulnerabilities: 167, active_count: 167 },
    { date: "2026-01-13", total_vulnerabilities: 167, active_count: 167 },
    { date: "2026-01-14", total_vulnerabilities: 167, active_count: 167 },
    { date: "2026-01-15", total_vulnerabilities: 167, active_count: 167 },
    { date: "2026-01-16", total_vulnerabilities: 168, active_count: 168 },
    { date: "2026-01-17", total_vulnerabilities: 167, active_count: 167 },
    { date: "2026-01-18", total_vulnerabilities: 240, active_count: 240 },
    { date: "2026-01-19", total_vulnerabilities: 240, active_count: 240 },
    { date: "2026-01-20", total_vulnerabilities: 240, active_count: 240 },
    { date: "2026-01-21", total_vulnerabilities: 239, active_count: 239 },
    { date: "2026-01-22", total_vulnerabilities: 240, active_count: 240 },
    { date: "2026-01-23", total_vulnerabilities: 251, active_count: 251 },
    { date: "2026-01-24", total_vulnerabilities: 250, active_count: 250 },
    { date: "2026-01-25", total_vulnerabilities: 251, active_count: 251 },
    { date: "2026-01-26", total_vulnerabilities: 251, active_count: 251 },
    { date: "2026-01-27", total_vulnerabilities: 251, active_count: 251 },
    { date: "2026-01-28", total_vulnerabilities: 251, active_count: 251 },
    { date: "2026-01-29", total_vulnerabilities: 251, active_count: 251 },
    { date: "2026-01-30", total_vulnerabilities: 251, active_count: 251 },
    { date: "2026-01-31", total_vulnerabilities: 251, active_count: 251 },
    { date: "2026-02-01", total_vulnerabilities: 251, active_count: 251 },
    { date: "2026-02-02", total_vulnerabilities: 250, active_count: 250 },
    { date: "2026-02-03", total_vulnerabilities: 250, active_count: 250 },
    { date: "2026-02-04", total_vulnerabilities: 251, active_count: 251 },
    { date: "2026-02-05", total_vulnerabilities: 250, active_count: 250 },
    { date: "2026-02-06", total_vulnerabilities: 251, active_count: 251 },
    { date: "2026-02-07", total_vulnerabilities: 251, active_count: 251 },
    { date: "2026-02-08", total_vulnerabilities: 251, active_count: 251 },
    { date: "2026-02-09", total_vulnerabilities: 251, active_count: 251 },
  ]}
};

const SEV_COLORS = { CRITICAL: "#b91c1c", HIGH: "#dc2626", MEDIUM: "#d97706", LOW: "#2563eb", INFO: "#6b7280" };
const N_COLORS = { N5: "#dc2626", N4: "#ea580c", N3: "#ca8a04", N2: "#2563eb", N1: "#9ca3af", unrated: "#52525b" };

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <div style={{ color: "#71717a", marginBottom: 4, fontSize: 10, letterSpacing: 1 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, color: "#e4e4e7" }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: p.color, display: "inline-block" }} />
          <span style={{ color: "#a1a1aa" }}>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// Horizontal stacked bar for distributions
const StackBar = ({ data, colors, label }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (!total) return null;
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ fontSize: 10, color: "#71717a", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>{label}</div>}
      <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: "#27272a" }}>
        {entries.map(([k, v]) => (
          <div key={k} style={{ width: `${(v / total) * 100}%`, background: colors[k] || "#3f3f46", transition: "width 0.4s" }} title={`${k}: ${v}`} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 8 }}>
        {entries.map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: colors[k] || "#3f3f46", display: "inline-block" }} />
            <span style={{ color: "#71717a" }}>{k}</span>
            <span style={{ color: "#d4d4d8", fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Check = ({ ok }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    {ok ? (
      <><circle cx="8" cy="8" r="7" fill="#065f4620" stroke="#10b981" strokeWidth="1.5" /><path d="M5 8l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>
    ) : (
      <><circle cx="8" cy="8" r="7" fill="#7f1d1d20" stroke="#ef4444" strokeWidth="1.5" /><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" /></>
    )}
  </svg>
);

export default function VDRDashboard() {
  const [tab, setTab] = useState("overview");
  const d = DATA;
  const snap = d.current_snapshot;
  const risk = d.risk_classification;
  const comp = d.compliance_status;
  const posture = d.security_posture;
  const atk = d.attack_surface;
  const cspm = d.cspm_summary;
  const acc = d.vdr_acceptance;
  const exploit = d.exploit_type_distribution;
  const dailyTrends = d.trends.daily;

  const monthlyTrends = useMemo(() => {
    const grouped: Record<string, { total_vulnerabilities: number[]; active_count: number[] }> = {};
    dailyTrends.forEach(({ date, total_vulnerabilities, active_count }) => {
      const month = date.slice(0, 7); // "YYYY-MM"
      if (!grouped[month]) grouped[month] = { total_vulnerabilities: [], active_count: [] };
      grouped[month].total_vulnerabilities.push(total_vulnerabilities);
      grouped[month].active_count.push(active_count);
    });
    return Object.entries(grouped).map(([month, vals]) => ({
      date: month,
      total_vulnerabilities: Math.round(vals.total_vulnerabilities.reduce((a, b) => a + b, 0) / vals.total_vulnerabilities.length),
      active_count: Math.round(vals.active_count.reduce((a, b) => a + b, 0) / vals.active_count.length),
    }));
  }, [dailyTrends]);

  const weekDiff = useMemo(() => {
    const latest = dailyTrends[dailyTrends.length - 1];
    const prev = dailyTrends[Math.max(0, dailyTrends.length - 8)];
    return latest.total_vulnerabilities - prev.total_vulnerabilities;
  }, [dailyTrends]);

  const severityBarData = useMemo(() =>
    Object.entries(risk.severity_distribution).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })),
  [risk]);

  const nRatingBarData = useMemo(() =>
    Object.entries(risk.n_rating_distribution).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })),
  [risk]);

  const exploitData = useMemo(() =>
    Object.entries(exploit).map(([name, value]) => ({ name: name.replace("Unknown/Other", "Other"), value })).sort((a, b) => b.value - a.value),
  [exploit]);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "risk", label: "Risk & Severity" },
    { id: "posture", label: "Posture & Surface" },
  ];

  // Styles
  const bg = "#0a0a0b";
  const card = { background: "#141416", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: 20 };
  const mono = { fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace" };
  const label = { fontSize: 10, color: "#52525b", letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 };

  return (
    <div style={{ minHeight: "100vh", background: bg, color: "#e4e4e7", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", padding: "24px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: "#fafafa" }}>VDR Metrics</span>
              <span style={{ fontSize: 10, background: "#1e3a5f", color: "#60a5fa", padding: "2px 8px", borderRadius: 4, fontWeight: 600, letterSpacing: 0.5 }}>PUBLIC</span>
            </div>
            <div style={{ fontSize: 12, color: "#52525b" }}>FedRAMP 20x Vulnerability Detection & Response · {d.metadata.vdr_standard}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ ...label }}>Security Score</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: "#3b82f6", ...mono }}>{posture.posture_score}</span>
              <span style={{ fontSize: 13, color: "#52525b" }}>/10</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", background: "#1e3a5f30", padding: "2px 8px", borderRadius: 4, marginLeft: 4 }}>{posture.overall_rating}</span>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 2, marginBottom: 24, background: "#18181b", borderRadius: 8, padding: 3, width: "fit-content" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "7px 18px", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, letterSpacing: 0.3, transition: "all 0.2s",
              background: tab === t.id ? "#27272a" : "transparent",
              color: tab === t.id ? "#fafafa" : "#71717a",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* OVERVIEW TAB                                  */}
        {/* ════════════════════════════════════════════ */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { l: "Vulnerabilities", v: snap.total_vulnerabilities, sub: weekDiff === 0 ? "Stable this week" : weekDiff > 0 ? `+${weekDiff} vs last week` : `${weekDiff} vs last week`, accent: "#d97706" },
                { l: "Unique CVEs", v: snap.unique_cves, sub: `${snap.affected_resource_count} resources`, accent: "#8b5cf6" },
                { l: "Compliance", v: `${comp.compliance_rate}%`, sub: comp.frr_cvm_04_status === "COMPLIANT" ? "FRR-CVM-04 ✓" : "Review needed", accent: "#10b981" },
                { l: "Critical Findings", v: risk.critical_findings, sub: risk.kev_matches === 0 ? "No KEV matches" : `${risk.kev_matches} KEV matches`, accent: risk.critical_findings > 0 ? "#ef4444" : "#10b981" },
              ].map((kpi, i) => (
                <div key={i} style={{ ...card }}>
                  <div style={{ ...label }}>{kpi.l}</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: kpi.accent, ...mono, lineHeight: 1.1, marginTop: 2 }}>{kpi.v}</div>
                  <div style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Trend chart */}
            <div style={{ ...card }}>
              <div style={{ ...label, marginBottom: 12 }}>Monthly Vulnerability Trend</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e1e22" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => { const [y, m] = v.split("-"); const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return `${months[parseInt(m, 10) - 1]} ${y}`; }} />
                  <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin - 10", "dataMax + 10"]} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="total_vulnerabilities" name="Avg Total" stroke="#3b82f6" strokeWidth={2} fill="url(#areaFill)" dot={{ r: 4, fill: "#3b82f6", stroke: "#0a0a0b", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Two-col: Severity + Risk indicators */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ ...card }}>
                <div style={{ ...label, marginBottom: 12 }}>Severity Distribution</div>
                <StackBar data={risk.severity_distribution} colors={SEV_COLORS} />
                <div style={{ marginTop: 12 }}>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={severityBarData} barCategoryGap="20%">
                      <XAxis dataKey="name" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#3f3f46", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {severityBarData.map((e, i) => <Cell key={i} fill={SEV_COLORS[e.name] || "#3f3f46"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ ...card }}>
                <div style={{ ...label, marginBottom: 12 }}>Risk Indicators</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { l: "LEV Count", v: risk.lev_count },
                    { l: "IRV Count", v: risk.irv_count },
                    { l: "KEV Matches", v: risk.kev_matches },
                    { l: "Critical Findings", v: risk.critical_findings },
                    { l: "Internet Reachable", v: snap.internet_reachable_resource_count },
                    { l: "Exploitable Paths", v: atk.exploitable_paths },
                  ].map((item, i) => (
                    <div key={i} style={{
                      background: item.v > 0 ? "#7f1d1d15" : "#065f4610",
                      border: `1px solid ${item.v > 0 ? "#7f1d1d40" : "#065f4625"}`,
                      borderRadius: 8, padding: "10px 12px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <span style={{ fontSize: 11, color: "#a1a1aa" }}>{item.l}</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: item.v > 0 ? "#ef4444" : "#10b981", ...mono }}>{item.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ ...label, marginBottom: 8 }}>Exploit Types</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {exploitData.map((e, i) => (
                      <div key={i} style={{ background: "#1e1e22", borderRadius: 6, padding: "5px 10px", fontSize: 11, display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ color: "#71717a" }}>{e.name}</span>
                        <span style={{ fontWeight: 700, color: "#d4d4d8", ...mono }}>{e.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* RISK & SEVERITY TAB                           */}
        {/* ════════════════════════════════════════════ */}
        {tab === "risk" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* N-Rating + Severity side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ ...card }}>
                <div style={{ ...label, marginBottom: 14 }}>N-Rating Distribution</div>
                <StackBar data={risk.n_rating_distribution} colors={N_COLORS} />
                <div style={{ marginTop: 16 }}>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={nRatingBarData} barCategoryGap="16%">
                      <CartesianGrid stroke="#1e1e22" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#3f3f46", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {nRatingBarData.map((e, i) => <Cell key={i} fill={N_COLORS[e.name] || "#3f3f46"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ ...card }}>
                <div style={{ ...label, marginBottom: 14 }}>Severity Distribution</div>
                <StackBar data={risk.severity_distribution} colors={SEV_COLORS} />
                <div style={{ marginTop: 16 }}>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={severityBarData} barCategoryGap="16%">
                      <CartesianGrid stroke="#1e1e22" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#3f3f46", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {severityBarData.map((e, i) => <Cell key={i} fill={SEV_COLORS[e.name] || "#3f3f46"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Risk distribution (from risk_distribution field) */}
            <div style={{ ...card }}>
              <div style={{ ...label, marginBottom: 14 }}>Risk Distribution (Overall)</div>
              <StackBar data={d.risk_distribution} colors={SEV_COLORS} />
            </div>

            {/* Compliance + CSPM */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ ...card }}>
                <div style={{ ...label, marginBottom: 10 }}>Compliance Status</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: "#10b981", ...mono }}>{comp.compliance_rate}%</span>
                  <span style={{ fontSize: 12, color: "#52525b" }}>compliant</span>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: "#a1a1aa" }}>
                    <span style={{ fontWeight: 700, color: "#10b981" }}>{comp.compliant_count}</span> compliant
                  </div>
                  <div style={{ fontSize: 12, color: "#a1a1aa" }}>
                    <span style={{ fontWeight: 700, color: "#ef4444" }}>{comp.non_compliant_count}</span> non-compliant
                  </div>
                </div>
                <div style={{ marginTop: 14, padding: "8px 12px", background: "#065f4612", border: "1px solid #065f4625", borderRadius: 6, fontSize: 12 }}>
                  <span style={{ color: "#71717a" }}>FRR-CVM-04: </span>
                  <span style={{ fontWeight: 700, color: comp.frr_cvm_04_status === "COMPLIANT" ? "#10b981" : "#d97706" }}>{comp.frr_cvm_04_status}</span>
                </div>
              </div>

              <div style={{ ...card }}>
                <div style={{ ...label, marginBottom: 10 }}>CSPM Findings</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: "#d97706", ...mono }}>{cspm.total_findings}</span>
                  <span style={{ fontSize: 12, color: "#52525b" }}>total findings</span>
                </div>
                <StackBar data={cspm.by_severity} colors={SEV_COLORS} label="By Severity" />
              </div>
            </div>

            {/* VDR Acceptance */}
            <div style={{ ...card }}>
              <div style={{ ...label, marginBottom: 10 }}>VDR Acceptance</div>
              <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 28, fontWeight: 800, color: "#3b82f6", ...mono }}>{acc.total_active}</span>
                  <span style={{ fontSize: 12, color: "#52525b", marginLeft: 6 }}>active</span>
                </div>
                <div>
                  <span style={{ fontSize: 28, fontWeight: 800, color: "#d97706", ...mono }}>{acc.total_accepted}</span>
                  <span style={{ fontSize: 12, color: "#52525b", marginLeft: 6 }}>accepted</span>
                </div>
                <div style={{ fontSize: 12, color: "#52525b", marginLeft: "auto" }}>
                  Acceptance window: <span style={{ color: "#a1a1aa", fontWeight: 600 }}>{acc.acceptance_threshold_days} days</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* POSTURE & SURFACE TAB                         */}
        {/* ════════════════════════════════════════════ */}
        {tab === "posture" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Security posture */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ ...card }}>
                <div style={{ ...label, marginBottom: 14 }}>Security Posture</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#fafafa" }}>{posture.overall_rating}</div>
                    <div style={{ fontSize: 12, color: "#52525b" }}>{posture.posture_score}/10 security score</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {[
                    { l: "Network Security (WAF)", ok: posture.network_security_enabled },
                    { l: "IAM Least Privilege", ok: posture.iam_least_privilege },
                    { l: "Comprehensive Logging", ok: posture.logging_comprehensive },
                    { l: "Encryption at Rest", ok: posture.encryption_at_rest },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <span style={{ fontSize: 13, color: "#a1a1aa" }}>{item.l}</span>
                      <Check ok={item.ok} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Attack surface */}
              <div style={{ ...card }}>
                <div style={{ ...label, marginBottom: 14 }}>Attack Surface</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { l: "Graph Nodes", v: atk.graph_node_count, c: "#d4d4d8" },
                    { l: "Graph Edges", v: atk.graph_edge_count, c: "#d4d4d8" },
                    { l: "Attack Paths", v: atk.total_attack_paths, c: "#3b82f6" },
                    { l: "Critical Paths", v: atk.critical_attack_paths, c: atk.critical_attack_paths > 0 ? "#ef4444" : "#10b981" },
                    { l: "Exploitable Paths", v: atk.exploitable_paths, c: atk.exploitable_paths > 0 ? "#ef4444" : "#10b981" },
                    { l: "Blast Radius", v: atk.blast_radius_score, c: atk.blast_radius_score > 0 ? "#d97706" : "#10b981" },
                  ].map((item, i) => (
                    <div key={i} style={{ background: "#1a1a1e", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
                      <div style={{ fontSize: 10, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>{item.l}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: item.c, ...mono }}>{item.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, padding: "8px 12px", background: "#1a1a1e", borderRadius: 6, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#71717a" }}>Avg Path Risk Score</span>
                  <span style={{ fontWeight: 700, color: "#d4d4d8", ...mono }}>{atk.avg_path_risk_score}</span>
                </div>
              </div>
            </div>

            {/* Trend + exploit breakdown */}
            <div style={{ ...card }}>
              <div style={{ ...label, marginBottom: 12 }}>Monthly Trend</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="areaFill2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e1e22" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => { const [y, m] = v.split("-"); const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return `${months[parseInt(m, 10) - 1]} ${y}`; }} />
                  <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin - 10", "dataMax + 10"]} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="total_vulnerabilities" name="Avg Total" stroke="#3b82f6" strokeWidth={2} fill="url(#areaFill2)" dot={{ r: 4, fill: "#3b82f6", stroke: "#0a0a0b", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ marginTop: 28, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: "#3f3f46", flexWrap: "wrap", gap: 8 }}>
          <span>🔒 {d.metadata.privacy_notice}</span>
          <span>{d.metadata.vdr_standard} · {d.metadata.data_classification} · Generated {new Date(d.metadata.generated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
