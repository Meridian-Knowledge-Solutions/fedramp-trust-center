import React, { useEffect, useState, useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Download, AlertCircle } from 'lucide-react';

// --- TYPES & INTERFACES ---
interface CommitBreakdown {
    total: number;
    security: number;
    features: number;
    fixes: number;
    docs: number;
    tests: number;
    infrastructure: number;
    other: number;
    authors?: number;
    additions?: number;
    deletions?: number;
    changed_files?: number;
}

interface PullRequests {
    merged: number;
    open: number;
    created: number;
}

interface Issues {
    closed: number;
    open: number;
    created: number;
}

interface WeeklyMetrics {
    week: string;
    timestamp: string;
    commits: number | CommitBreakdown;
    pull_requests?: PullRequests;
    issues?: Issues;
    dependabot?: { total: number; merged: number; open: number; };
    dependabot_merged?: number;
    security_prs?: number;
    ci_success_rate: number;
    releases: number;
}

const THEME = {
    card: "bg-[#18181b] border border-white/5 hover:border-blue-500/30 transition-all duration-500 shadow-2xl rounded-xl overflow-hidden",
    statLabel: "text-[10px] uppercase tracking-[0.2em] font-black text-slate-500",
    chartColors: {
        features: '#3b82f6',
        security: '#10b981',
        infra: '#8b5cf6',
        fixes: '#f59e0b',
        tests: '#ef4444',
        docs: '#06b6d4',
        other: '#3f3f46'
    }
};

import { BASE_PATH } from '../../config/theme';

export default function MetricsDashboard() {
    const [history, setHistory] = useState<WeeklyMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const DATA_URL = `${BASE_PATH}metrics_history.jsonl`;

    useEffect(() => {
        fetch(DATA_URL)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to reach archive.`);
                return res.text();
            })
            .then(text => {
                const rawLines = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.startsWith('{'))
                    .map(line => {
                        try { return JSON.parse(line); } catch { return null; }
                    })
                    .filter(Boolean);

                const deduplicated = Object.values(
                    rawLines.reduce((acc: any, curr: any) => {
                        acc[curr.week] = curr;
                        return acc;
                    }, {})
                ) as WeeklyMetrics[];

                setHistory(deduplicated);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [DATA_URL]);

    const stats = useMemo(() => {
        if (!history.length) return null;

        const normalized = history.map(entry => {
            const c = entry.commits;
            const isObj = typeof c === 'object';

            return {
                week: entry.week,
                total: isObj ? (c as CommitBreakdown).total : c as number,
                features: isObj ? (c as CommitBreakdown).features : 0,
                security: isObj ? (c as CommitBreakdown).security : (entry.security_prs || 0),
                infra: isObj ? (c as CommitBreakdown).infrastructure : 0,
                fixes: isObj ? (c as CommitBreakdown).fixes : 0,
                other: isObj ? (c as CommitBreakdown).other : (c as number),
                merged: entry.dependabot ? entry.dependabot.merged : (entry.dependabot_merged || 0),
                authors: isObj ? (c as CommitBreakdown).authors || 0 : 0,
                prsMerged: entry.pull_requests?.merged || 0,
                issuesClosed: entry.issues?.closed || 0
            };
        });

        const current = normalized[normalized.length - 1];
        const latestRaw = history[history.length - 1];
        const latestCommits = typeof latestRaw.commits === 'object' ? latestRaw.commits as CommitBreakdown : null;

        const distribution = [
            { name: 'Features', value: current.features, color: THEME.chartColors.features },
            { name: 'Security', value: current.security, color: THEME.chartColors.security },
            { name: 'Infra', value: current.infra, color: THEME.chartColors.infra },
            { name: 'Fixes', value: current.fixes, color: THEME.chartColors.fixes },
            { name: 'Other', value: current.other, color: THEME.chartColors.other }
        ].filter(d => d.value > 0);

        return {
            normalized,
            current,
            totalCommits: normalized.reduce((sum, w) => sum + w.total, 0),
            avgCI: history.reduce((sum, w) => sum + w.ci_success_rate, 0) / history.length,
            distribution,
            latestReleases: latestRaw.releases,
            latestAuthors: latestCommits?.authors || 0,
            latestAdditions: latestCommits?.additions || 0,
            latestDeletions: latestCommits?.deletions || 0,
            latestChangedFiles: latestCommits?.changed_files || 0,
            latestPRs: latestRaw.pull_requests,
            latestIssues: latestRaw.issues
        };
    }, [history]);

    if (loading) return (
        <div className="tcx" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', color: 'var(--ash)' }}>
                <div style={{ width: 40, height: 40, margin: '0 auto 16px', borderRadius: '50%', border: '2px solid #34E0C455', borderTopColor: 'var(--signal)', animation: 'tcx-spin .8s linear infinite' }} />
                initializing pipeline telemetry…
                <style>{`@keyframes tcx-spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </div>
    );

    if (error || !stats) return (
        <div className="tcx" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24 }}>
            <div className="panel" style={{ maxWidth: 460, width: '100%', padding: 32, textAlign: 'center', borderColor: '#F2607A55' }}>
                <AlertCircle style={{ color: 'var(--red)', margin: '0 auto 16px' }} size={44} />
                <div className="svc" style={{ marginBottom: 12 }}>Stream failure</div>
                <p className="mono" style={{ color: 'var(--ash)' }}>{error || "Unable to retrieve metrics archive."}</p>
            </div>
        </div>
    );

    // ── real numeric series for sparkbars ──
    const totalSeries = stats.normalized.map(w => w.total);
    const ciSeries = history.map(w => w.ci_success_rate);
    const prSeries = stats.normalized.map(w => w.prsMerged);
    const securitySeries = stats.normalized.map(w => w.security);
    const issuesSeries = stats.normalized.map(w => w.issuesClosed);
    const fixesSeries = stats.normalized.map(w => w.fixes);
    const featuresSeries = stats.normalized.map(w => w.features);
    const infraSeries = stats.normalized.map(w => w.infra);

    return (
        <div className="tcx" style={{ padding: '40px 0' }}>
            <div className="wrap">
                {/* --- HEADER ---  */}
                <div className="kick">▤ — PIPELINE TELEMETRY · KSI-PIY-06</div>
                <h1 className="big">Compliance pipeline <span className="g">effectiveness</span></h1>
                <p className="lede">
                    KSI validation throughput, evidence cadence, and pipeline-stability trend from {history.length} weeks of continuous-monitoring development activity.
                </p>

                {/* --- KPI OVERVIEW ---  */}
                <div className="grid g4">
                    <div className="kpi"><div className="v i">{stats.totalCommits.toLocaleString()}</div><div className="l">Validation commits</div><div className="sub">{history.length}-week window</div></div>
                    <div className="kpi"><div className="v s">{stats.latestPRs?.merged || 0}</div><div className="l">PRs merged</div><div className="sub">latest cycle</div></div>
                    <div className="kpi"><div className="v">{stats.latestIssues?.closed || 0}</div><div className="l">Issues closed</div><div className="sub">latest cycle</div></div>
                    <div className="kpi"><div className="v a">{stats.avgCI.toFixed(1)}%</div><div className="l">Avg CI stability</div><div className="sub">pipeline health</div></div>
                </div>

                <div className="grid g4" style={{ marginTop: 12 }}>
                    <div className="kpi"><div className="v i">{stats.latestAuthors}</div><div className="l">Contributors</div></div>
                    <div className="kpi"><div className="v">{stats.current.total}</div><div className="l">Commits this cycle</div></div>
                    <div className="kpi"><div className="v s">+{stats.latestAdditions.toLocaleString()}</div><div className="l">Additions</div></div>
                    <div className="kpi"><div className="v a">-{stats.latestDeletions.toLocaleString()}</div><div className="l">Deletions</div></div>
                </div>

                {/* --- TREND SPARKBARS ---  */}
                <h3 className="sec">Pipeline trends · {history.length}-week series</h3>
                <div className="panel">
                    <div className="row">
                        <span className="svc" style={{ width: 180 }}>Validation throughput</span>
                        <Sparkbars data={totalSeries} />
                        <span className="mono" style={{ marginLeft: 'auto', color: 'var(--signal)' }}>{stats.current.total} latest</span>
                    </div>
                    <div className="row">
                        <span className="svc" style={{ width: 180 }}>CI stability</span>
                        <Sparkbars data={ciSeries} max={100} />
                        <span className="mono" style={{ marginLeft: 'auto', color: 'var(--signal)' }}>{stats.avgCI.toFixed(1)}% avg</span>
                    </div>
                    <div className="row">
                        <span className="svc" style={{ width: 180 }}>Security commits</span>
                        <Sparkbars data={securitySeries} color="var(--indigo)" />
                        <span className="mono" style={{ marginLeft: 'auto', color: 'var(--indigo)' }}>{stats.current.security} latest</span>
                    </div>
                    <div className="row">
                        <span className="svc" style={{ width: 180 }}>PRs merged</span>
                        <Sparkbars data={prSeries} />
                        <span className="mono" style={{ marginLeft: 'auto', color: 'var(--ash)' }}>{stats.latestPRs?.merged || 0} latest</span>
                    </div>
                    <div className="row">
                        <span className="svc" style={{ width: 180 }}>Issues closed</span>
                        <Sparkbars data={issuesSeries} color="var(--indigo)" />
                        <span className="mono" style={{ marginLeft: 'auto', color: 'var(--ash)' }}>{stats.latestIssues?.closed || 0} latest</span>
                    </div>
                </div>

                {/* --- COMMITS BY CATEGORY (area) ---  */}
                <h3 className="sec">Commits by category · stacked flow</h3>
                <div className="panel">
                    <div className="ph"><h4>Development flow</h4><span className="map">{history.length} cycles</span></div>
                    <div style={{ padding: '18px 8px 8px' }}>
                        <ResponsiveContainer width="100%" height={360}>
                            <AreaChart data={stats.normalized}>
                                <defs>
                                    <linearGradient id="colorOther" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#424E5C" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#424E5C" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A222D" />
                                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#788596', fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#788596', fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', paddingTop: '20px', fontFamily: 'var(--mono)' }} />

                                <Area type="monotone" dataKey="other" stackId="1" stroke="#424E5C" fill="url(#colorOther)" name="Other/Legacy" />
                                <Area type="monotone" dataKey="features" stackId="1" stroke="#818CF8" fill="#818CF822" name="Features" />
                                <Area type="monotone" dataKey="security" stackId="1" stroke="#34E0C4" fill="#34E0C422" name="Security" />
                                <Area type="monotone" dataKey="infra" stackId="1" stroke="#F2B85C" fill="#F2B85C22" name="Infrastructure" />
                                <Area type="monotone" dataKey="fixes" stackId="1" stroke="#F2607A" fill="#F2607A22" name="Fixes" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* --- DISTRIBUTION + GOVERNANCE ---  */}
                <h3 className="sec">Distribution &amp; governance</h3>
                <div className="g2">
                    <div className="panel">
                        <div className="ph"><h4>Commit distribution</h4><span className="map">latest cycle</span></div>
                        <div style={{ padding: '18px 8px 8px' }}>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={stats.distribution} cx="50%" cy="50%" innerRadius={66} outerRadius={88} paddingAngle={8} dataKey="value">
                                        {stats.distribution.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="ph"><h4>Pipeline governance</h4><span className="map">FRR-CCM</span></div>
                        <div className="row">
                            <span className="svc" style={{ width: 180 }}>Stability health</span>
                            <Sparkbars data={ciSeries} max={100} />
                            <span className="mono" style={{ marginLeft: 'auto', color: 'var(--signal)' }}>{stats.avgCI.toFixed(1)}%</span>
                        </div>
                        <div className="row">
                            <span className="svc" style={{ width: 180 }}>Security merges</span>
                            <span className="mono" style={{ marginLeft: 'auto', color: 'var(--ash)' }}>{stats.current.merged}</span>
                            <span style={{ marginLeft: 16 }}><span className="tag vi">DEPENDABOT</span></span>
                        </div>
                        <div className="row">
                            <span className="svc" style={{ width: 180 }}>Releases (90d)</span>
                            <span className="mono" style={{ marginLeft: 'auto', color: 'var(--ash)' }}>{stats.latestReleases}</span>
                            <span style={{ marginLeft: 16 }}><span className="tag ok">SHIPPED</span></span>
                        </div>
                        <div className="row">
                            <span className="svc" style={{ width: 180 }}>Files changed</span>
                            <span className="mono" style={{ marginLeft: 'auto', color: 'var(--ash)' }}>{stats.latestChangedFiles}</span>
                            <span style={{ marginLeft: 16 }}><span className="tag ok">latest</span></span>
                        </div>
                        <div className="row">
                            <span className="svc" style={{ width: 180 }}>Open PRs / issues</span>
                            <span className="mono" style={{ marginLeft: 'auto', color: 'var(--ash)' }}>{stats.latestPRs?.open || 0} PR · {stats.latestIssues?.open || 0} issues</span>
                            <span style={{ marginLeft: 16 }}><span className="tag warn">IN FLIGHT</span></span>
                        </div>
                    </div>
                </div>

                {/* --- FOOTER ---  */}
                <div className="footer" style={{ marginTop: 30 }}>
                    <span>ARCHIVE NODE: metrics_history.jsonl · STATUS AUTHENTICATED · AGGREGATE ONLY</span>
                    <a href={DATA_URL} target="_blank" rel="noreferrer" className="badge i" style={{ cursor: 'pointer' }}>
                        <Download size={12} /> RAW SEQUENCE ARCHIVE
                    </a>
                </div>
            </div>
        </div>
    );
}

// ── sparkbars from a real numeric series ──
function Sparkbars({ data, max, color = 'var(--signal)' }: { data: number[]; max?: number; color?: string }) {
    if (!data?.length) return null;
    const hi = max ?? Math.max(...data);
    const lo = Math.min(...data);
    const span = hi - lo || 1;
    return (
        <div className="spark">
            {data.map((d, i) => {
                const h = 22 + ((d - lo) / span) * 78;
                return <i key={i} style={{ height: `${h}%`, background: color, animationDelay: `${i * 12}ms` }} />;
            })}
        </div>
    );
}

const PIE_COLORS = ['#818CF8', '#34E0C4', '#F2B85C', '#F2607A', '#424E5C'];

// --- HELPER COMPONENTS ---
function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="panel" style={{ padding: 14, background: '#0b1016', fontFamily: 'var(--mono)' }}>
                <p className="mono" style={{ color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 10, borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>Cycle: {label}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {payload.map((entry: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: entry.color || entry.fill }} />
                                <span style={{ fontSize: 11, color: 'var(--ash)' }}>{entry.name}</span>
                            </div>
                            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink)' }}>{entry.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
}
