/**
 * KSI Failure Dashboard - Enhanced
 * 
 * FedRAMP 20x Phase 2 failure tracking visualization:
 * - Active failures requiring remediation
 * - Historical failure timeline with MTTR
 * - Per-KSI statistics and trends
 * - Visual charts for failure patterns
 * 
 * Consumes: public/data/ksi_failure_tracker.json
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import {
    AlertCircle, CheckCircle2, Clock, TrendingUp, TrendingDown,
    ChevronDown, ChevronRight, AlertTriangle, Timer, Download,
    Activity, Shield, Zap, Target, AlertOctagon, History,
    ArrowUpRight, ArrowDownRight, GitCommit, Calendar, FileText
} from 'lucide-react';

// ============================================
// Theme & Constants
// ============================================
const THEME = {
    card: "bg-[#18181b] border border-white/5 hover:border-blue-500/20 transition-all duration-500 shadow-2xl rounded-xl overflow-hidden",
    statLabel: "text-[10px] uppercase tracking-[0.2em] font-black text-slate-500",
    chartColors: {
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        purple: '#8b5cf6',
        cyan: '#06b6d4',
        muted: '#3f3f46'
    }
};

const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
    ? `${import.meta.env.BASE_URL}data`
    : `${import.meta.env.BASE_URL}/data`;

const DATA_URL = `${BASE_PATH}/ksi_failure_tracker.json`;

// ============================================
// Stat Card Component
// ============================================
const StatCard = ({ label, value, icon: Icon, color, trend, trendValue, subtitle }) => (
    <div className={THEME.card + " p-6 group relative overflow-hidden"}>
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
            <Icon size={80} />
        </div>
        <div className="flex justify-between items-start relative z-10">
            <div>
                <span className={THEME.statLabel}>{label}</span>
                <div className="text-4xl font-black text-white tracking-tighter mt-2 group-hover:text-blue-400 transition-colors">
                    {value}
                </div>
                {subtitle && (
                    <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
                )}
                {trend && (
                    <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {trendValue}
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-xl bg-black/40 border border-white/5 ${color} shadow-inner`}>
                <Icon size={20} />
            </div>
        </div>
    </div>
);

// ============================================
// Active Failure Card (Enhanced with Full Reason)
// ============================================
const ActiveFailureCard = ({ failure }) => {
    const [expanded, setExpanded] = useState(false);
    const hoursActive = useMemo(() => {
        const failedAt = new Date(failure.failed_at);
        const hours = Math.round((Date.now() - failedAt) / (1000 * 60 * 60));
        return hours;
    }, [failure.failed_at]);

    const severity = hoursActive > 24 ? 'critical' : hoursActive > 8 ? 'warning' : 'info';
    const severityColors = {
        critical: 'border-red-500/50 bg-red-500/10 shadow-red-500/5',
        warning: 'border-amber-500/50 bg-amber-500/10 shadow-amber-500/5',
        info: 'border-blue-500/50 bg-blue-500/10 shadow-blue-500/5'
    };

    // Parse reason into bullet points if it contains semicolons
    const reasonParts = failure.reason?.split(';').map(s => s.trim()).filter(Boolean) || [];

    return (
        <div className={`rounded-xl border ${severityColors[severity]} shadow-lg transition-all`}>
            {/* Header */}
            <div className="p-5 pb-3">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${severity === 'critical' ? 'bg-red-500/20' : severity === 'warning' ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
                            <AlertOctagon size={18} className={severity === 'critical' ? 'text-red-400' : severity === 'warning' ? 'text-amber-400' : 'text-blue-400'} />
                        </div>
                        <div>
                            <span className="font-mono text-base font-bold text-white">{failure.ksi_id}</span>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                                {severity === 'critical' ? 'Critical - Immediate Action' : severity === 'warning' ? 'Warning - Action Required' : 'Needs Attention'}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-lg font-black ${severity === 'critical' ? 'text-red-400' : severity === 'warning' ? 'text-amber-400' : 'text-blue-400'}`}>
                            {hoursActive}h
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">Active</div>
                    </div>
                </div>
                
                {/* Reason Preview */}
                <div 
                    className="cursor-pointer group"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <FileText size={10} />
                        Failure Reason
                        <ChevronDown size={12} className={`ml-auto transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </div>
                    
                    {!expanded ? (
                        <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
                            {failure.reason}
                        </p>
                    ) : (
                        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                            {reasonParts.length > 1 ? (
                                <ul className="space-y-2">
                                    {reasonParts.map((part, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                            <span className="text-slate-600 mt-1">•</span>
                                            <span className="leading-relaxed">{part}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-slate-300 leading-relaxed">{failure.reason}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-black/20">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                        <Target size={10} /> Score: <span className="text-white font-mono">{failure.score}%</span>
                    </span>
                    <span className="flex items-center gap-1">
                        <GitCommit size={10} /> <span className="text-slate-400 font-mono">{failure.failed_commit}</span>
                    </span>
                </div>
                <span className="text-[10px] text-slate-600">
                    {new Date(failure.failed_at).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
};

// ============================================
// Timeline Entry (Remediated Failure with Reason)
// ============================================
const TimelineEntry = ({ failure, isLast }) => {
    const [expanded, setExpanded] = useState(false);
    const date = new Date(failure.remediated_at);
    
    const mttrColor = failure.duration_hours < 4 ? 'text-emerald-400' : 
                      failure.duration_hours < 12 ? 'text-amber-400' : 'text-red-400';
    
    const mttrBg = failure.duration_hours < 4 ? 'bg-emerald-500/10' : 
                   failure.duration_hours < 12 ? 'bg-amber-500/10' : 'bg-red-500/10';

    // Parse reason into bullet points if it contains semicolons
    const reasonParts = failure.reason?.split(';').map(s => s.trim()).filter(Boolean) || [];
    const primaryReason = reasonParts[0] || failure.reason || 'No reason provided';

    return (
        <div className="relative pl-8">
            {/* Timeline connector */}
            {!isLast && (
                <div className="absolute left-[11px] top-8 bottom-0 w-px bg-gradient-to-b from-emerald-500/50 to-transparent" />
            )}
            
            {/* Timeline dot */}
            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
                <CheckCircle2 size={12} className="text-emerald-400" />
            </div>
            
            <div className={`${THEME.card} mb-4 overflow-hidden`}>
                {/* Header - Always visible */}
                <div 
                    className="p-4 cursor-pointer group"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                                {failure.ksi_id}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${mttrColor} ${mttrBg}`}>
                                {failure.duration_hours}h MTTR
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar size={10} />
                                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                            </span>
                            <ChevronDown 
                                size={14} 
                                className={`text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} 
                            />
                        </div>
                    </div>
                    
                    {/* Reason Preview - Always visible */}
                    <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                        <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <AlertCircle size={9} /> Failure Reason
                        </div>
                        <p className={`text-sm text-slate-300 leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>
                            {primaryReason}
                        </p>
                        {!expanded && reasonParts.length > 1 && (
                            <span className="text-[10px] text-blue-400 mt-1 inline-block">
                                +{reasonParts.length - 1} more details...
                            </span>
                        )}
                    </div>
                </div>
                
                {/* Expanded Details */}
                {expanded && (
                    <div className="px-4 pb-4 space-y-4">
                        {/* Full Reason Breakdown */}
                        {reasonParts.length > 1 && (
                            <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">
                                    Full Analysis
                                </div>
                                <ul className="space-y-2">
                                    {reasonParts.map((part, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                            <span className={`mt-0.5 ${i === 0 ? 'text-red-400' : 'text-slate-600'}`}>
                                                {i === 0 ? '▸' : '•'}
                                            </span>
                                            <span className={`leading-relaxed ${i === 0 ? 'text-slate-200' : ''}`}>{part}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {/* Commit Details */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                                <div className="text-[9px] text-red-400/70 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <AlertCircle size={9} /> Failed At
                                </div>
                                <div className="text-slate-300 font-mono text-[11px]">
                                    {new Date(failure.failed_at).toLocaleString()}
                                </div>
                                <div className="text-slate-500 font-mono text-[10px] mt-1 flex items-center gap-1">
                                    <GitCommit size={9} /> {failure.failed_commit}
                                </div>
                            </div>
                            <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                                <div className="text-[9px] text-emerald-400/70 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <CheckCircle2 size={9} /> Remediated At
                                </div>
                                <div className="text-slate-300 font-mono text-[11px]">
                                    {date.toLocaleString()}
                                </div>
                                <div className="text-slate-500 font-mono text-[10px] mt-1 flex items-center gap-1">
                                    <GitCommit size={9} /> {failure.remediation_commit}
                                </div>
                            </div>
                        </div>
                        
                        {/* Score at failure */}
                        {failure.score_at_failure !== undefined && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Target size={10} />
                                Score at failure: <span className="text-white font-mono">{failure.score_at_failure}%</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================
// KSI Stats Bar
// ============================================
const KSIStatsBar = ({ ksiId, stats, maxFailures }) => {
    const barWidth = maxFailures > 0 ? (stats.total_failures / maxFailures) * 100 : 0;
    const mttrColor = stats.mttr_hours < 4 ? 'bg-emerald-500' : 
                      stats.mttr_hours < 24 ? 'bg-amber-500' : 'bg-red-500';
    
    return (
        <div className="group px-4 py-3 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0">
            <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                    {ksiId}
                </span>
                <div className="flex items-center gap-6 text-xs">
                    <span className="text-slate-500 font-mono">
                        {stats.total_failures} failure{stats.total_failures !== 1 ? 's' : ''}
                    </span>
                    <span className={`font-bold ${stats.mttr_hours < 4 ? 'text-emerald-400' : stats.mttr_hours < 24 ? 'text-amber-400' : 'text-red-400'}`}>
                        {stats.mttr_hours ? `${stats.mttr_hours.toFixed(1)}h` : '—'}
                    </span>
                </div>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${mttrColor} transition-all duration-500`} 
                    style={{ width: `${barWidth}%` }}
                />
            </div>
        </div>
    );
};

// ============================================
// Custom Tooltip
// ============================================
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0c0c0e] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-2 border-b border-white/5 pb-2">
                    {label}
                </p>
                <div className="space-y-1">
                    {payload.map((entry, i) => (
                        <div key={i} className="flex justify-between items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs text-slate-300">{entry.name}</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-white">{entry.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

// ============================================
// Main Component
// ============================================
const KSIFailureDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [historyView, setHistoryView] = useState('timeline'); // 'timeline' | 'table'

    useEffect(() => {
        fetch(DATA_URL)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load tracker.`);
                return res.json();
            })
            .then(json => {
                setData(json);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load failure tracker:', err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // Compute statistics
    const stats = useMemo(() => {
        if (!data) return null;
        
        const history = data.failure_history || [];
        const durations = history.map(h => h.duration_hours).filter(Boolean);
        const activeCount = Object.keys(data.active_failures || {}).length;
        
        // Group failures by month for chart
        const byMonth = history.reduce((acc, f) => {
            const month = new Date(f.remediated_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {});
        
        const monthlyData = Object.entries(byMonth)
            .map(([month, count]) => ({ month, failures: count }))
            .slice(-6);
        
        // Group by KSI category
        const byCategory = history.reduce((acc, f) => {
            const cat = f.ksi_id.split('-')[1];
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});
        
        const categoryData = Object.entries(byCategory)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
        
        // MTTR trend (last 10 failures)
        const mttrTrend = history.slice(-10).map((f, i) => ({
            index: i + 1,
            mttr: f.duration_hours || 0,
            ksi: f.ksi_id
        }));
        
        const avgMttr = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
        
        // Calculate if MTTR is improving
        const recentMttr = durations.slice(-5);
        const olderMttr = durations.slice(-10, -5);
        const mttrTrendDirection = recentMttr.length && olderMttr.length ?
            (recentMttr.reduce((a,b) => a+b, 0) / recentMttr.length) < (olderMttr.reduce((a,b) => a+b, 0) / olderMttr.length) ?
            'improving' : 'degrading' : null;
        
        return {
            activeCount,
            totalFailures: history.length,
            avgMttr: avgMttr.toFixed(1),
            runsProcessed: data.metadata?.total_runs_processed || 0,
            monthlyData,
            categoryData,
            mttrTrend,
            mttrTrendDirection,
            uniqueKsis: Object.keys(data.ksi_stats || {}).length
        };
    }, [data]);

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <div className="text-slate-500 text-sm">Loading failure data...</div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !data) {
        return (
            <div className={THEME.card + " p-12 text-center max-w-lg mx-auto"}>
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={28} className="text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Failure Tracking Unavailable</h3>
                <p className="text-sm text-slate-500 mb-4">
                    Ensure ksi_failure_tracker.json is synced to public/data/
                </p>
                {error && (
                    <code className="text-xs text-red-400 font-mono bg-red-500/10 px-3 py-2 rounded-lg inline-block">
                        {error}
                    </code>
                )}
            </div>
        );
    }

    const activeFailures = Object.values(data.active_failures || {});
    const history = (data.failure_history || []).slice().reverse();
    const ksiStats = Object.entries(data.ksi_stats || {});
    const maxFailures = Math.max(...ksiStats.map(([_, s]) => s.total_failures || 0), 1);

    const categoryColors = [
        THEME.chartColors.primary,
        THEME.chartColors.success,
        THEME.chartColors.warning,
        THEME.chartColors.purple,
        THEME.chartColors.cyan,
        THEME.chartColors.danger
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <History size={20} className="text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">KSI Failure Tracking</h1>
                    </div>
                    <p className="text-sm text-slate-500">
                        FedRAMP 20x Phase 2 • Tracking {stats.runsProcessed.toLocaleString()} validation runs since {data.metadata?.backfill_since || 'N/A'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {stats.activeCount === 0 ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle2 size={16} className="text-emerald-400" />
                            <span className="text-sm font-bold text-emerald-400">All Clear</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 animate-pulse">
                            <AlertCircle size={16} className="text-red-400" />
                            <span className="text-sm font-bold text-red-400">{stats.activeCount} Active</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Active Failures"
                    value={stats.activeCount}
                    icon={AlertOctagon}
                    color={stats.activeCount === 0 ? 'text-emerald-400' : 'text-red-400'}
                    subtitle={stats.activeCount === 0 ? 'All systems nominal' : 'Requires attention'}
                />
                <StatCard
                    label="Total Failures"
                    value={stats.totalFailures}
                    icon={Activity}
                    color="text-blue-400"
                    subtitle={`${stats.uniqueKsis} unique KSIs affected`}
                />
                <StatCard
                    label="Avg MTTR"
                    value={`${stats.avgMttr}h`}
                    icon={Timer}
                    color={parseFloat(stats.avgMttr) < 12 ? 'text-emerald-400' : 'text-amber-400'}
                    trend={stats.mttrTrendDirection === 'improving' ? 'up' : stats.mttrTrendDirection === 'degrading' ? 'down' : null}
                    trendValue={stats.mttrTrendDirection === 'improving' ? 'Improving' : 'Needs focus'}
                    subtitle="Mean time to remediate"
                />
                <StatCard
                    label="Pipeline Runs"
                    value={stats.runsProcessed.toLocaleString()}
                    icon={Zap}
                    color="text-purple-400"
                    subtitle="Total validations analyzed"
                />
            </div>

            {/* Active Failures Section */}
            {activeFailures.length > 0 && (
                <div className={THEME.card + " p-6"}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-red-500/20">
                            <AlertOctagon size={18} className="text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-wider">
                                Active Failures Requiring Remediation
                            </h2>
                            <p className="text-xs text-slate-500">
                                These KSIs are currently failing and need immediate attention
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {activeFailures.map((f, i) => (
                            <ActiveFailureCard key={i} failure={f} />
                        ))}
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trend Chart */}
                <div className={THEME.card + " p-6"}>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp size={14} className="text-blue-400" /> Failure Trend (Last 6 Months)
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={stats.monthlyData}>
                            <defs>
                                <linearGradient id="colorFailures" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={THEME.chartColors.primary} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={THEME.chartColors.primary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                                type="monotone" 
                                dataKey="failures" 
                                stroke={THEME.chartColors.primary} 
                                fill="url(#colorFailures)" 
                                strokeWidth={2}
                                name="Failures"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Distribution */}
                <div className={THEME.card + " p-6"}>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Shield size={14} className="text-purple-400" /> Failures by Category
                    </h3>
                    <div className="flex items-center gap-8">
                        <ResponsiveContainer width="50%" height={200}>
                            <PieChart>
                                <Pie
                                    data={stats.categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {stats.categoryData.map((_, i) => (
                                        <Cell key={i} fill={categoryColors[i % categoryColors.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-2">
                            {stats.categoryData.map((cat, i) => (
                                <div key={cat.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[i % categoryColors.length] }} />
                                        <span className="text-slate-400 font-mono">KSI-{cat.name}</span>
                                    </div>
                                    <span className="text-white font-bold">{cat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* MTTR Trend Chart */}
            {stats.mttrTrend.length > 0 && (
                <div className={THEME.card + " p-6"}>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Timer size={14} className="text-emerald-400" /> Recent MTTR Performance (Hours)
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={stats.mttrTrend} barSize={32}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                            <XAxis dataKey="ksi" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="mttr" name="MTTR (hours)" radius={[4, 4, 0, 0]}>
                                {stats.mttrTrend.map((entry, i) => (
                                    <Cell 
                                        key={i} 
                                        fill={entry.mttr < 4 ? THEME.chartColors.success : entry.mttr < 24 ? THEME.chartColors.warning : THEME.chartColors.danger} 
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Failure Reasons Summary Table */}
            {history.length > 0 && (
                <div className={THEME.card}>
                    <div className="px-6 py-4 border-b border-white/5">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <FileText size={14} className="text-cyan-400" /> Recent Failure Reasons
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1">
                            Detailed breakdown of why each KSI failed
                        </p>
                    </div>
                    <div className="divide-y divide-white/5">
                        {history.slice(0, 8).map((f, i) => {
                            const reasonParts = f.reason?.split(';').map(s => s.trim()).filter(Boolean) || [];
                            const mttrColor = f.duration_hours < 4 ? 'text-emerald-400' : 
                                              f.duration_hours < 24 ? 'text-amber-400' : 'text-red-400';
                            
                            return (
                                <div key={i} className="p-4 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-sm font-bold text-white">
                                                {f.ksi_id}
                                            </span>
                                            <span className={`text-[10px] font-bold ${mttrColor}`}>
                                                {f.duration_hours}h
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-slate-600">
                                            {new Date(f.remediated_at).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric',
                                                year: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="pl-0">
                                        {reasonParts.length > 1 ? (
                                            <ul className="space-y-1">
                                                {reasonParts.slice(0, 3).map((part, j) => (
                                                    <li key={j} className="flex items-start gap-2 text-xs text-slate-400">
                                                        <span className={j === 0 ? 'text-red-400' : 'text-slate-600'}>
                                                            {j === 0 ? '▸' : '•'}
                                                        </span>
                                                        <span className={`leading-relaxed ${j === 0 ? 'text-slate-300' : ''}`}>
                                                            {part}
                                                        </span>
                                                    </li>
                                                ))}
                                                {reasonParts.length > 3 && (
                                                    <li className="text-[10px] text-slate-600 pl-4">
                                                        +{reasonParts.length - 3} more...
                                                    </li>
                                                )}
                                            </ul>
                                        ) : (
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                {f.reason || 'No reason provided'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {history.length > 8 && (
                        <div className="px-4 py-3 border-t border-white/5 text-center">
                            <span className="text-[10px] text-slate-500">
                                Showing 8 of {history.length} failures • Expand timeline below for full history
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Remediated History Timeline */}
            <div className={THEME.card + " p-6"}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400" /> Remediation History
                    </h3>
                    <span className="text-xs text-slate-500">{history.length} total remediations</span>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                    {history.length > 0 ? (
                        history.slice(0, 15).map((f, i) => (
                            <TimelineEntry key={i} failure={f} isLast={i === Math.min(14, history.length - 1)} />
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <CheckCircle2 size={32} className="mx-auto mb-3 opacity-50" />
                            <p>No failure history recorded</p>
                        </div>
                    )}
                </div>
            </div>

            {/* KSI Statistics */}
            {ksiStats.length > 0 && (
                <div className={THEME.card}>
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Target size={14} className="text-amber-400" /> Per-KSI Statistics
                        </h3>
                        <span className="text-xs text-slate-500">{ksiStats.length} KSIs with failures</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                        {ksiStats
                            .sort((a, b) => (b[1].total_failures || 0) - (a[1].total_failures || 0))
                            .map(([ksiId, s]) => (
                                <KSIStatsBar key={ksiId} ksiId={ksiId} stats={s} maxFailures={maxFailures} />
                            ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="flex flex-col md:flex-row justify-between items-center bg-[#18181b] p-6 rounded-xl border border-white/5 gap-4 shadow-inner">
                <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">
                    <div>Archive: <span className="text-white ml-2">ksi_failure_tracker.json</span></div>
                    <div>Runs: <span className="text-emerald-400 ml-2">{stats.runsProcessed.toLocaleString()}</span></div>
                    <div>Since: <span className="text-blue-400 ml-2">{data.metadata?.backfill_since || 'N/A'}</span></div>
                    <div>Status: <span className="text-emerald-400 ml-2">Live</span></div>
                </div>
                <a 
                    href={DATA_URL} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2 px-6 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-white/5 text-slate-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-lg"
                >
                    <Download size={12} /> Download Raw Archive
                </a>
            </footer>
        </div>
    );
};

export { KSIFailureDashboard };
export default KSIFailureDashboard;
