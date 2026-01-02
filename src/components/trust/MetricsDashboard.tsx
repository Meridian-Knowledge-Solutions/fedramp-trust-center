import React, { useEffect, useState, useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    GitCommit, Shield, Zap, Activity, Clock, Download,
    TrendingUp, Cpu, Layout, AlertCircle
} from 'lucide-react';

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
}

interface WeeklyMetrics {
    week: string;
    timestamp: string;
    commits: number | CommitBreakdown; // Supports legacy flat number or new categorized object
    dependabot?: { total: number; merged: number; open: number; };
    dependabot_merged?: number; // Legacy field support
    security_prs?: number;      // Legacy field support
    ci_success_rate: number;
    releases: number;
}

const THEME = {
    card: "bg-[#18181b] border border-white/5 hover:border-blue-500/30 transition-all duration-500 shadow-2xl rounded-xl overflow-hidden",
    statLabel: "text-[10px] uppercase tracking-[0.2em] font-black text-slate-500",
    chartColors: {
        features: '#3b82f6',     // Blue
        security: '#10b981',     // Emerald
        infra: '#8b5cf6',        // Violet
        fixes: '#f59e0b',        // Amber
        tests: '#ef4444',        // Red
        docs: '#06b6d4',         // Cyan
        other: '#3f3f46'         // Zinc-600 (Used for base volume & legacy data)
    }
};

export default function MetricsDashboard() {
    const [history, setHistory] = useState<WeeklyMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ✅ Environment Detection for Fetching 
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const DATA_URL = isDev
        ? '/data/metrics_history.jsonl'
        : 'https://github.com/Meridian-Knowledge-Solutions/fedramp-20x-submission-final/releases/download/latest-metrics/metrics_history.jsonl';

    useEffect(() => {
        fetch(DATA_URL)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to reach archive.`);
                return res.text();
            })
            .then(text => {
                // ✅ Robust JSONL Parsing & Deduplication
                const rawLines = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.startsWith('{'))
                    .map(line => {
                        try { return JSON.parse(line); } catch { return null; }
                    })
                    .filter(Boolean);

                // Keeps only the latest entry found for each week (categorized data overwrites legacy)
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

    // ✅ DATA NORMALIZATION 
    const stats = useMemo(() => {
        if (!history.length) return null;

        const normalized = history.map(entry => {
            const c = entry.commits;
            const isObj = typeof c === 'object';

            // Map legacy flat commit numbers to "Other" so they render in the stack
            return {
                week: entry.week,
                total: isObj ? (c as CommitBreakdown).total : c as number,
                features: isObj ? (c as CommitBreakdown).features : 0,
                security: isObj ? (c as CommitBreakdown).security : (entry.security_prs || 0),
                infra: isObj ? (c as CommitBreakdown).infrastructure : 0,
                fixes: isObj ? (c as CommitBreakdown).fixes : 0,
                other: isObj ? (c as CommitBreakdown).other : (c as number),
                merged: entry.dependabot ? entry.dependabot.merged : (entry.dependabot_merged || 0)
            };
        });

        const current = normalized[normalized.length - 1];
        const latestRaw = history[history.length - 1];

        // Distribution for Pie Chart 
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
            latestReleases: latestRaw.releases
        };
    }, [history]);

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono text-slate-500 uppercase tracking-widest">
            <Activity className="animate-pulse text-blue-500 mr-3" /> Initializing Telemetry...
        </div>
    );

    if (error || !stats) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-[#18181b] border border-red-500/30 p-8 rounded-xl shadow-2xl">
                <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                <h2 className="text-white font-black uppercase tracking-tight">Stream Failure</h2>
                <p className="text-slate-500 text-xs mt-2 font-mono truncate">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 p-6 lg:p-10 font-sans selection:bg-blue-500/30">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* --- HEADER ---  */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-xl shadow-blue-500/5">
                            <TrendingUp className="text-blue-500" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Automated Compliance Activity</h1>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">
                                {isDev ? 'Automation Engineering Metrics' : 'Live Release'} 
                            </p>
                        </div>
                    </div>
                    <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/5 shadow-inner">
                        <span className={THEME.statLabel}>Frequency</span>
                        <div className="text-white font-mono font-bold text-lg leading-tight">{history.length} Wks</div>
                    </div>
                </header>

                {/* --- KPI SECTION ---  */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard label="Aggregate Commitments" value={stats.totalCommits} icon={GitCommit} color="text-blue-500" />
                    <StatCard label="Stability Threshold" value={`${stats.avgCI.toFixed(1)}%`} icon={Zap} color="text-purple-500" />
                    <StatCard label="Latest Cycle Volume" value={stats.current.total} icon={Activity} color="text-emerald-500" />
                </div>

                {/* --- STACKED AREA CHART (DEVELOPMENT FLOW) ---  */}
                <div className={THEME.card + " p-8 relative overflow-hidden"}>
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Layout size={180} /></div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-10 flex items-center gap-2">
                        <Activity size={16} className="text-blue-500" /> Commits by Category
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={stats.normalized}>
                            <defs>
                                <linearGradient id="colorOther" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={THEME.chartColors.other} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={THEME.chartColors.other} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                            <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', paddingTop: '20px' }} />

                            <Area type="monotone" dataKey="other" stackId="1" stroke={THEME.chartColors.other} fill="url(#colorOther)" name="Other/Legacy" />
                            <Area type="monotone" dataKey="features" stackId="1" stroke={THEME.chartColors.features} fill={THEME.chartColors.features + '20'} name="Features" />
                            <Area type="monotone" dataKey="security" stackId="1" stroke={THEME.chartColors.security} fill={THEME.chartColors.security + '20'} name="Security" />
                            <Area type="monotone" dataKey="infra" stackId="1" stroke={THEME.chartColors.infra} fill={THEME.chartColors.infra + '20'} name="Infrastructure" />
                            <Area type="monotone" dataKey="fixes" stackId="1" stroke={THEME.chartColors.fixes} fill={THEME.chartColors.fixes + '20'} name="Fixes" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* DISTRIBUTION PIE CHART  */}
                    <div className={THEME.card + " p-8"}>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-10 flex items-center gap-2">
                            <Cpu size={14} className="text-purple-500" /> Commit Distribution
                        </h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={stats.distribution} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                                    {stats.distribution.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* PIPELINE GOVERNANCE CARD  */}
                    <div className={THEME.card + " p-8"}>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-10 flex items-center gap-2">
                            <Shield size={14} className="text-emerald-500" /> Pipeline Governance
                        </h3>
                        <div className="space-y-6">
                            <div className="bg-black/40 p-4 rounded-lg border border-white/5 shadow-inner">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Stability Health</span>
                                    <span className="text-xl font-mono font-bold text-white">{stats.avgCI.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${stats.avgCI}%` }} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-black/20 border border-white/5 shadow-sm">
                                    <div className={THEME.statLabel}>Sec Merges</div>
                                    <div className="text-xl font-bold text-white mt-1">{stats.current.merged}</div>
                                </div>
                                <div className="p-4 rounded-lg bg-black/20 border border-white/5 shadow-sm">
                                    <div className={THEME.statLabel}>Releases (90d)</div>
                                    <div className="text-xl font-bold text-white mt-1">{stats.latestReleases}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- FOOTER ---  */}
                <footer className="flex flex-col md:flex-row justify-between items-center bg-[#18181b] p-6 rounded-xl border border-white/5 gap-4 shadow-inner">
                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                        <div>Archive node: <span className="text-white ml-2">metrics_history.jsonl</span></div>
                        <div>Status: <span className="text-emerald-500 ml-2">Authenticated</span></div>
                    </div>
                    <a href={DATA_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-2 bg-zinc-950 hover:bg-zinc-900 border border-white/5 text-slate-400 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-lg">
                        <Download size={12} /> Raw Sequence Archive
                    </a>
                </footer>
            </div>
        </div>
    );
}

// --- HELPER COMPONENTS ---
function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className={THEME.card + " p-6 flex justify-between items-center group shadow-xl"}>
            <div>
                <span className={THEME.statLabel}>{label}</span>
                <div className="text-4xl font-black text-white tracking-tighter mt-1 group-hover:text-blue-400 transition-colors">{value}</div>
            </div>
            <div className={`p-3 rounded-xl bg-black/40 border border-white/5 ${color} shadow-inner`}>
                <Icon size={20} />
            </div>
        </div>
    );
}

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0c0c0e] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl font-sans">
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-3 border-b border-white/5 pb-2">Cycle: {label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry: any, i: number) => (
                        <div key={i} className="flex justify-between items-center gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                                <span className="text-[11px] font-bold text-slate-300">{entry.name}</span>
                            </div>
                            <span className="text-[11px] font-mono font-black text-white">{entry.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
}