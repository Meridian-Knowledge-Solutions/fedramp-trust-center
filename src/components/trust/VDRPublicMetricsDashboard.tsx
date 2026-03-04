import { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid
} from "recharts";

// --- CONFIGURATION ---
const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
  ? `${import.meta.env.BASE_URL}data/`
  : `${import.meta.env.BASE_URL}/data/`;

const SEV_COLORS: Record<string, string> = { CRITICAL: "#b91c1c", HIGH: "#dc2626", MEDIUM: "#d97706", LOW: "#2563eb", INFO: "#6b7280" };

// --- Derive core metrics from vdr-report.json vulnerabilities array ---
function deriveMetrics(vdr: any) {
  const vulns: any[] = vdr?.vulnerabilities || [];
  const metrics = vdr?.metrics || {};
  const dataSources = vdr?.data_sources || {};

  const totalVulnerabilities = vulns.length;
  const uniqueCves = new Set(vulns.map((v: any) => v.cve_id).filter(Boolean)).size;

  const sevCounts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  vulns.forEach((v: any) => {
    const s = (v.severity || "").toUpperCase();
    if (s === "INFORMATIONAL") sevCounts.INFO++;
    else if (s in sevCounts) sevCounts[s]++;
  });

  const kevCount = vulns.filter((v: any) => v.exploitability?.kev_listed).length;
  const irvCount = vulns.filter((v: any) => v.internet_reachable).length;
  const affectedResources = new Set(
    vulns.flatMap((v: any) => (v.affected_components || []).map((c: any) => c.component_id))
  ).size;

  const slaRate = metrics.sla_compliance_rate ?? 100;
  const totalOpen = vulns.filter((v: any) => v.status === "Open").length;
  const totalAccepted = vulns.filter((v: any) => v.status === "Accepted").length;
  const totalRemediated = vulns.filter((v: any) => v.status === "Remediated").length;

  return {
    totalVulnerabilities, uniqueCves, affectedResources, irvCount,
    sevCounts, kevCount, slaRate, totalOpen, totalAccepted, totalRemediated,
    vdrStandard: dataSources.vdr_standard || "",
    generatedAt: vdr?.reporting_period?.generated_at || vdr?.integrity?.generated_at || "",
  };
}

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <div style={{ color: "#71717a", marginBottom: 4, fontSize: 10, letterSpacing: 1 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, color: "#e4e4e7" }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: p.color, display: "inline-block" }} />
          <span style={{ color: "#a1a1aa" }}>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const StackBar = ({ data, colors, label }: { data: Record<string, number>; colors: Record<string, string>; label?: string }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (!total) return null;
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ fontSize: 10, color: "#71717a", letterSpacing: 1.5, textTransform: "uppercase" as const, marginBottom: 6, fontWeight: 600 }}>{label}</div>}
      <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: "#27272a" }}>
        {entries.map(([k, v]) => (
          <div key={k} style={{ width: `${(v / total) * 100}%`, background: colors[k] || "#3f3f46", transition: "width 0.4s" }} title={`${k}: ${v}`} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px 14px", marginTop: 8 }}>
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

const Check = ({ ok }: { ok: boolean }) => (
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
  const [vdr, setVdr] = useState<any>(null);
  const [ext, setExt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ts = Date.now();
    Promise.all([
      fetch(`${BASE_PATH}reports/samples/vdr-report.json?t=${ts}`).then(r => r.ok ? r.json() : null),
      fetch(`${BASE_PATH}vdr_extended_metrics.json?t=${ts}`).then(r => r.ok ? r.json() : null),
    ]).then(([vdrData, extData]) => {
      setVdr(vdrData);
      setExt(extData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const derived = useMemo(() => vdr ? deriveMetrics(vdr) : null, [vdr]);

  const posture = ext?.security_posture;
  const atk = ext?.attack_surface;
  const cspm = ext?.cspm_summary;
  const exploit = ext?.exploit_type_distribution || {};
  const dailyTrends = ext?.trends?.daily || [];
  const metadata = ext?.metadata || {};

  const monthlyTrends = useMemo(() => {
    const grouped: Record<string, { total_vulnerabilities: number[]; active_count: number[] }> = {};
    dailyTrends.forEach(({ date, total_vulnerabilities, active_count }: any) => {
      const month = date.slice(0, 7);
      if (!grouped[month]) grouped[month] = { total_vulnerabilities: [], active_count: [] };
      grouped[month].total_vulnerabilities.push(total_vulnerabilities);
      grouped[month].active_count.push(active_count);
    });
    return Object.entries(grouped).map(([month, vals]) => ({
      date: month,
      total_vulnerabilities: Math.round(vals.total_vulnerabilities.reduce((a: number, b: number) => a + b, 0) / vals.total_vulnerabilities.length),
      active_count: Math.round(vals.active_count.reduce((a: number, b: number) => a + b, 0) / vals.active_count.length),
    }));
  }, [dailyTrends]);

  const weekDiff = useMemo(() => {
    if (dailyTrends.length < 2) return 0;
    const latest = dailyTrends[dailyTrends.length - 1];
    const prev = dailyTrends[Math.max(0, dailyTrends.length - 8)];
    return latest.total_vulnerabilities - prev.total_vulnerabilities;
  }, [dailyTrends]);

  const severityBarData = useMemo(() =>
    derived ? Object.entries(derived.sevCounts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })) : [],
  [derived]);

  const exploitData = useMemo(() =>
    Object.entries(exploit).map(([name, value]) => ({ name: name.replace("Unknown/Other", "Other"), value: value as number })).sort((a, b) => b.value - a.value),
  [exploit]);

  const bg = "#0a0a0b";
  const card: React.CSSProperties = { background: "#141416", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: 20 };
  const mono = { fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace" };
  const labelStyle: React.CSSProperties = { fontSize: 10, color: "#52525b", letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "risk", label: "Risk & Severity" },
    { id: "posture", label: "Posture & Surface" },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#52525b", fontSize: 13, fontWeight: 500 }}>Loading VDR metrics...</div>
      </div>
    );
  }

  if (!derived) {
    return (
      <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#52525b", fontSize: 13, fontWeight: 500 }}>VDR report not available</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: bg, color: "#e4e4e7", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", padding: "24px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" as const, gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: "#fafafa" }}>VDR Metrics</span>
              <span style={{ fontSize: 10, background: "#1e3a5f", color: "#60a5fa", padding: "2px 8px", borderRadius: 4, fontWeight: 600, letterSpacing: 0.5 }}>PUBLIC</span>
            </div>
            <div style={{ fontSize: 12, color: "#52525b" }}>FedRAMP 20x Vulnerability Detection & Response · {derived.vdrStandard || metadata.vdr_standard}</div>
          </div>
          {posture && (
            <div style={{ textAlign: "right" as const }}>
              <div style={{ ...labelStyle }}>Security Score</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#3b82f6", ...mono }}>{posture.posture_score}</span>
                <span style={{ fontSize: 13, color: "#52525b" }}>/10</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", background: "#1e3a5f30", padding: "2px 8px", borderRadius: 4, marginLeft: 4 }}>{posture.overall_rating}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
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

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            {/* KPI row — derived from vdr-report.json */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { l: "Vulnerabilities", v: derived.totalVulnerabilities, sub: weekDiff === 0 ? "Stable this week" : weekDiff > 0 ? `+${weekDiff} vs last week` : `${weekDiff} vs last week`, accent: "#d97706" },
                { l: "Unique CVEs", v: derived.uniqueCves, sub: `${derived.affectedResources} resources`, accent: "#8b5cf6" },
                { l: "SLA Compliance", v: `${derived.slaRate}%`, sub: "All within SLA", accent: "#10b981" },
                { l: "Critical Findings", v: derived.sevCounts.CRITICAL, sub: derived.kevCount === 0 ? "No KEV matches" : `${derived.kevCount} KEV matches`, accent: derived.sevCounts.CRITICAL > 0 ? "#ef4444" : "#10b981" },
              ].map((kpi, i) => (
                <div key={i} style={{ ...card }}>
                  <div style={{ ...labelStyle }}>{kpi.l}</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: kpi.accent, ...mono, lineHeight: 1.1, marginTop: 2 }}>{kpi.v}</div>
                  <div style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Trend chart */}
            {monthlyTrends.length > 0 && (
              <div style={{ ...card }}>
                <div style={{ ...labelStyle, marginBottom: 12 }}>Monthly Vulnerability Trend</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthlyTrends}>
                    <defs>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e1e22" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: string) => { const [, m] = v.split("-"); const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return months[parseInt(m, 10) - 1]; }} />
                    <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin - 10", "dataMax + 10"]} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="total_vulnerabilities" name="Avg Total" stroke="#3b82f6" strokeWidth={2} fill="url(#areaFill)" dot={{ r: 4, fill: "#3b82f6", stroke: "#0a0a0b", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Severity + Risk */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ ...card }}>
                <div style={{ ...labelStyle, marginBottom: 12 }}>Severity Distribution</div>
                <StackBar data={derived.sevCounts} colors={SEV_COLORS} />
                {severityBarData.length > 0 && (
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
                )}
              </div>

              <div style={{ ...card }}>
                <div style={{ ...labelStyle, marginBottom: 12 }}>Risk Indicators</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { l: "Open", v: derived.totalOpen, warn: false },
                    { l: "Remediated", v: derived.totalRemediated, warn: false },
                    { l: "KEV Matches", v: derived.kevCount, warn: true },
                    { l: "Critical Findings", v: derived.sevCounts.CRITICAL, warn: true },
                    { l: "Internet Reachable", v: derived.irvCount, warn: true },
                    { l: "Accepted", v: derived.totalAccepted, warn: false },
                  ].map((item, i) => (
                    <div key={i} style={{
                      background: item.v > 0 && item.warn ? "#7f1d1d15" : "#065f4610",
                      border: `1px solid ${item.v > 0 && item.warn ? "#7f1d1d40" : "#065f4625"}`,
                      borderRadius: 8, padding: "10px 12px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <span style={{ fontSize: 11, color: "#a1a1aa" }}>{item.l}</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: item.v > 0 && item.warn ? "#ef4444" : "#10b981", ...mono }}>{item.v}</span>
                    </div>
                  ))}
                </div>
                {exploitData.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ ...labelStyle, marginBottom: 8 }}>Exploit Types</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      {exploitData.map((e, i) => (
                        <div key={i} style={{ background: "#1e1e22", borderRadius: 6, padding: "5px 10px", fontSize: 11, display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ color: "#71717a" }}>{e.name}</span>
                          <span style={{ fontWeight: 700, color: "#d4d4d8", ...mono }}>{e.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── RISK & SEVERITY TAB ── */}
        {tab === "risk" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ ...card }}>
                <div style={{ ...labelStyle, marginBottom: 14 }}>Severity Distribution</div>
                <StackBar data={derived.sevCounts} colors={SEV_COLORS} />
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

              <div style={{ ...card }}>
                <div style={{ ...labelStyle, marginBottom: 14 }}>Vulnerability Status</div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                  {[
                    { l: "Total Detected", v: derived.totalVulnerabilities, c: "#d4d4d8" },
                    { l: "Open", v: derived.totalOpen, c: "#d97706" },
                    { l: "Remediated", v: derived.totalRemediated, c: "#10b981" },
                    { l: "Accepted", v: derived.totalAccepted, c: "#3b82f6" },
                  ].map((item, i) => (
                    <div key={i} style={{ background: "#1a1a1e", borderRadius: 8, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#a1a1aa" }}>{item.l}</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: item.c, ...mono }}>{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SLA + CSPM */}
            <div style={{ display: "grid", gridTemplateColumns: cspm ? "1fr 1fr" : "1fr", gap: 12 }}>
              <div style={{ ...card }}>
                <div style={{ ...labelStyle, marginBottom: 10 }}>SLA Compliance</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: "#10b981", ...mono }}>{derived.slaRate}%</span>
                  <span style={{ fontSize: 12, color: "#52525b" }}>within SLA</span>
                </div>
                <div style={{ marginTop: 14, padding: "8px 12px", background: "#065f4612", border: "1px solid #065f4625", borderRadius: 6, fontSize: 12 }}>
                  <span style={{ color: "#71717a" }}>VDR Standard: </span>
                  <span style={{ fontWeight: 700, color: "#10b981" }}>{derived.vdrStandard}</span>
                </div>
              </div>

              {cspm && (
                <div style={{ ...card }}>
                  <div style={{ ...labelStyle, marginBottom: 10 }}>CSPM Findings</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: "#d97706", ...mono }}>{cspm.total_findings}</span>
                    <span style={{ fontSize: 12, color: "#52525b" }}>total findings</span>
                  </div>
                  <StackBar data={cspm.by_severity} colors={SEV_COLORS} label="By Severity" />
                </div>
              )}
            </div>

            {/* VDR Acceptance */}
            <div style={{ ...card }}>
              <div style={{ ...labelStyle, marginBottom: 10 }}>VDR Acceptance</div>
              <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 28, fontWeight: 800, color: "#3b82f6", ...mono }}>{derived.totalOpen}</span>
                  <span style={{ fontSize: 12, color: "#52525b", marginLeft: 6 }}>active</span>
                </div>
                <div>
                  <span style={{ fontSize: 28, fontWeight: 800, color: "#d97706", ...mono }}>{derived.totalAccepted}</span>
                  <span style={{ fontSize: 12, color: "#52525b", marginLeft: 6 }}>accepted</span>
                </div>
                <div style={{ fontSize: 12, color: "#52525b", marginLeft: "auto" }}>
                  Acceptance window: <span style={{ color: "#a1a1aa", fontWeight: 600 }}>{vdr?.methodology?.sla_definitions?.acceptance_threshold || "192 days"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── POSTURE & SURFACE TAB ── */}
        {tab === "posture" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: posture && atk ? "1fr 1fr" : "1fr", gap: 12 }}>
              {posture && (
                <div style={{ ...card }}>
                  <div style={{ ...labelStyle, marginBottom: 14 }}>Security Posture</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#fafafa" }}>{posture.overall_rating}</div>
                      <div style={{ fontSize: 12, color: "#52525b" }}>{posture.posture_score}/10 security score</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 0 }}>
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
              )}

              {atk && (
                <div style={{ ...card }}>
                  <div style={{ ...labelStyle, marginBottom: 14 }}>Attack Surface</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { l: "Graph Nodes", v: atk.graph_node_count, c: "#d4d4d8" },
                      { l: "Graph Edges", v: atk.graph_edge_count, c: "#d4d4d8" },
                      { l: "Attack Paths", v: atk.total_attack_paths, c: "#3b82f6" },
                      { l: "Critical Paths", v: atk.critical_attack_paths, c: atk.critical_attack_paths > 0 ? "#ef4444" : "#10b981" },
                      { l: "Exploitable Paths", v: atk.exploitable_paths, c: atk.exploitable_paths > 0 ? "#ef4444" : "#10b981" },
                      { l: "Blast Radius", v: atk.blast_radius_score, c: atk.blast_radius_score > 0 ? "#d97706" : "#10b981" },
                    ].map((item, i) => (
                      <div key={i} style={{ background: "#1a1a1e", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column" as const, gap: 2 }}>
                        <div style={{ fontSize: 10, color: "#52525b", letterSpacing: 1, textTransform: "uppercase" as const, fontWeight: 600 }}>{item.l}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: item.c, ...mono }}>{item.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, padding: "8px 12px", background: "#1a1a1e", borderRadius: 6, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#71717a" }}>Avg Path Risk Score</span>
                    <span style={{ fontWeight: 700, color: "#d4d4d8", ...mono }}>{atk.avg_path_risk_score}</span>
                  </div>
                </div>
              )}
            </div>

            {monthlyTrends.length > 0 && (
              <div style={{ ...card }}>
                <div style={{ ...labelStyle, marginBottom: 12 }}>Monthly Trend</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthlyTrends}>
                    <defs>
                      <linearGradient id="areaFill2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e1e22" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: string) => { const [, m] = v.split("-"); const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return months[parseInt(m, 10) - 1]; }} />
                    <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin - 10", "dataMax + 10"]} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="total_vulnerabilities" name="Avg Total" stroke="#3b82f6" strokeWidth={2} fill="url(#areaFill2)" dot={{ r: 4, fill: "#3b82f6", stroke: "#0a0a0b", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 28, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: "#3f3f46", flexWrap: "wrap" as const, gap: 8 }}>
          <span>Core metrics derived from vdr-report.json · {metadata.privacy_notice || "Aggregate counts only."}</span>
          <span>{derived.vdrStandard} · PUBLIC · Generated {derived.generatedAt ? new Date(derived.generatedAt).toLocaleDateString() : "N/A"}</span>
        </div>
      </div>
    </div>
  );
}
