/**
 * KSI Failure Dashboard
 * 
 * Displays KSI failure tracking data for FedRAMP 20x Phase 2:
 * - Active failures needing remediation
 * - Historical failures with remediation times
 * - Per-KSI statistics (MTTR, failure count)
 * 
 * Consumes: ksi_failure_tracker.json
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    AlertCircle, CheckCircle2, Clock, TrendingUp,
    ChevronDown, ChevronRight, AlertTriangle, Timer
} from 'lucide-react';

const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
    ? `${import.meta.env.BASE_URL}data/`
    : `${import.meta.env.BASE_URL}/data/`;

// ============================================
// Metric Card
// ============================================
const MetricCard = ({ label, value, subtext, status = 'neutral' }) => {
    const statusColors = {
        excellent: 'border-emerald-500/30 bg-emerald-500/5',
        warning: 'border-amber-500/30 bg-amber-500/5',
        critical: 'border-red-500/30 bg-red-500/5',
        neutral: 'border-zinc-700 bg-zinc-800/50',
    };

    return (
        <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-2xl font-semibold text-white">{value}</div>
            {subtext && <div className="text-xs text-zinc-500 mt-1">{subtext}</div>}
        </div>
    );
};

// ============================================
// Active Failure Card
// ============================================
const ActiveFailureCard = ({ failure }) => {
    const hoursAgo = useMemo(() => {
        const failedAt = new Date(failure.failed_at);
        return Math.round((Date.now() - failedAt) / (1000 * 60 * 60));
    }, [failure.failed_at]);

    return (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-400" />
                    <span className="font-mono text-sm font-medium text-white">{failure.ksi_id}</span>
                </div>
                <span className="text-xs text-zinc-500">{hoursAgo}h active</span>
            </div>
            <p className="text-sm text-zinc-400 mb-2 line-clamp-2">{failure.reason}</p>
            <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Score: {failure.score}%</span>
                <span>Commit: {failure.failed_commit}</span>
            </div>
        </div>
    );
};

// ============================================
// Failure History Row
// ============================================
const FailureHistoryRow = ({ failure }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border-b border-zinc-800/50">
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-800/30"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="font-mono text-sm text-white">{failure.ksi_id}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="text-emerald-400">{failure.duration_hours}h MTTR</span>
                    <span>{new Date(failure.remediated_at).toLocaleDateString()}</span>
                    <ChevronRight size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </div>
            </div>
            {expanded && (
                <div className="px-4 pb-3 bg-zinc-950/50">
                    <div className="text-xs text-zinc-500 space-y-1">
                        <p><span className="text-zinc-600">Reason:</span> {failure.reason}</p>
                        <p><span className="text-zinc-600">Failed:</span> {failure.failed_at} ({failure.failed_commit})</p>
                        <p><span className="text-zinc-600">Fixed:</span> {failure.remediated_at} ({failure.remediation_commit})</p>
                        <p><span className="text-zinc-600">Score at failure:</span> {failure.score_at_failure}%</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// KSI Stats Row
// ============================================
const KSIStatsRow = ({ ksiId, stats }) => {
    return (
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50 last:border-0">
            <span className="font-mono text-sm text-white">{ksiId}</span>
            <div className="flex items-center gap-6 text-xs">
                <span className="text-zinc-500">{stats.total_failures} failures</span>
                <span className={stats.mttr_hours < 4 ? 'text-emerald-400' : stats.mttr_hours < 12 ? 'text-amber-400' : 'text-red-400'}>
                    {stats.mttr_hours ? `${stats.mttr_hours}h MTTR` : 'N/A'}
                </span>
            </div>
        </div>
    );
};

// ============================================
// Main Component
// ============================================
const KSIFailureDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetch(`${BASE_PATH}ksi_failure_tracker.json`);
                if (!response.ok) throw new Error('Tracker not found');
                setData(await response.json());
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const summary = useMemo(() => {
        if (!data) return {};
        const history = data.failure_history || [];
        const durations = history.map(h => h.duration_hours).filter(Boolean);
        return {
            activeCount: Object.keys(data.active_failures || {}).length,
            totalFailures: history.length,
            avgMttr: durations.length ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : null,
            runsProcessed: data.metadata?.total_runs_processed || 0,
        };
    }, [data]);

    if (loading) {
        return <div className="text-center py-12 text-zinc-500">Loading failure data...</div>;
    }

    if (error || !data) {
        return (
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 text-center">
                <AlertTriangle size={40} className="text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-400 mb-1">Failure Tracking Not Available</h3>
                <p className="text-sm text-zinc-600">
                    Run the backfill workflow to generate failure history.
                </p>
            </div>
        );
    }

    const activeFailures = Object.values(data.active_failures || {});
    const history = (data.failure_history || []).slice().reverse();
    const ksiStats = Object.entries(data.ksi_stats || {});

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-white">KSI Failure Tracking</h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                    Tracking failures across {summary.runsProcessed} validation runs
                </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    label="Active Failures"
                    value={summary.activeCount}
                    subtext="Needs remediation"
                    status={summary.activeCount === 0 ? 'excellent' : 'critical'}
                />
                <MetricCard
                    label="Total Failures"
                    value={summary.totalFailures}
                    subtext="All time"
                    status="neutral"
                />
                <MetricCard
                    label="Avg MTTR"
                    value={summary.avgMttr ? `${summary.avgMttr}h` : 'N/A'}
                    subtext="Mean time to remediate"
                    status={summary.avgMttr < 4 ? 'excellent' : summary.avgMttr < 12 ? 'warning' : 'neutral'}
                />
                <MetricCard
                    label="Runs Processed"
                    value={summary.runsProcessed}
                    subtext="Validation pipeline runs"
                    status="neutral"
                />
            </div>

            {/* Active Failures */}
            {activeFailures.length > 0 && (
                <div className="bg-zinc-900 rounded-lg border border-red-500/30 p-4">
                    <h3 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                        <AlertCircle size={16} />
                        Active Failures ({activeFailures.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeFailures.map((f, i) => (
                            <ActiveFailureCard key={i} failure={f} />
                        ))}
                    </div>
                </div>
            )}

            {/* Failure History */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800">
                <div className="px-4 py-3 border-b border-zinc-800">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        Remediated Failures
                    </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                    {history.length > 0 ? (
                        history.slice(0, 10).map((f, i) => (
                            <FailureHistoryRow key={i} failure={f} />
                        ))
                    ) : (
                        <div className="px-4 py-6 text-center text-zinc-500 text-sm">
                            No failures recorded yet
                        </div>
                    )}
                </div>
            </div>

            {/* Per-KSI Stats */}
            {ksiStats.length > 0 && (
                <div className="bg-zinc-900 rounded-lg border border-zinc-800">
                    <div className="px-4 py-3 border-b border-zinc-800">
                        <h3 className="text-sm font-medium text-white">KSI Statistics</h3>
                    </div>
                    <div>
                        {ksiStats
                            .sort((a, b) => (b[1].total_failures || 0) - (a[1].total_failures || 0))
                            .map(([ksiId, stats]) => (
                                <KSIStatsRow key={ksiId} ksiId={ksiId} stats={stats} />
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export { KSIFailureDashboard };
export default KSIFailureDashboard;
