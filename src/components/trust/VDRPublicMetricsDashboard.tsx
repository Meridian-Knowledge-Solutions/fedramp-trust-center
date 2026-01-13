/**
 * VDR Public Metrics Dashboard
 * * FedRAMP 20x VDR (Vulnerability Detection & Response) visualization:
 * - Current vulnerability snapshot with key metrics
 * - N-Rating and severity distribution charts
 * - Compliance and security posture indicators
 * - Attack surface analysis
 * - Historical trend visualization
 * - CSPM findings summary
 * * Consumes: public/data/vdr_public_metrics.json
 * * Privacy: This dashboard displays ONLY aggregate counts.
 * No resource IDs, CVE details, or sensitive data is included.
 * * Styling: Matches KSIFailureDashboard.tsx theme
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, LineChart, Line
} from 'recharts';
import {
    Shield, AlertTriangle, Activity, TrendingUp, TrendingDown,
    Lock, Eye, Zap, Target, CheckCircle2, XCircle, Clock,
    Network, GitBranch, BarChart3, PieChart as PieChartIcon,
    AlertOctagon, ShieldCheck, ShieldAlert, ShieldX, Database,
    ArrowUpRight, ArrowDownRight, Calendar, Download, RefreshCw,
    ChevronDown, ChevronRight, FileText, AlertCircle, Layers
} from 'lucide-react';

// ============================================
// Theme & Constants (Matches KSI Failure Dashboard)
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
        pink: '#ec4899',
        muted: '#3f3f46'
    }
};

const BASE_PATH = import.meta.env.BASE_URL?.endsWith('/')
    ? `${import.meta.env.BASE_URL}data`
    : `${import.meta.env.BASE_URL || ''}/data`;

const DATA_URL = `${BASE_PATH}/vdr_public_metrics.json`;

// N-Rating colors
const N_RATING_COLORS: Record<string, string> = {
    N5: '#dc2626', // red-600
    N4: '#ea580c', // orange-600
    N3: '#eab308', // yellow-500
    N2: '#3b82f6', // blue-500
    N1: '#9ca3af', // gray-400
    unrated: '#52525b' // zinc-600
};

// Severity colors
const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: '#7f1d1d',
    HIGH: '#dc2626',
    MEDIUM: '#f59e0b',
    LOW: '#3b82f6',
    INFO: '#9ca3af',
    UNKNOWN: '#52525b'
};

// ============================================
// Type Definitions - Mapped to vdr_public_metrics.json
// ============================================
interface VDRMetrics {
    metadata: {
        generated_at: string;
        vdr_standard: string;
        data_classification: string;
        privacy_notice: string;
    };
    current_snapshot: {
        timestamp: string;
        total_vulnerabilities: number;
        unique_cves: number;
        affected_resource_count: number;
        internet_reachable_resource_count: number;
    };
    risk_classification: {
        n_rating_distribution: Record<string, number>;
        severity_distribution: Record<string, number>;
        lev_count: number;
        irv_count: number;
        kev_matches: number;
        critical_findings: number;
    };
    compliance_status: {
        compliance_rate: number;
        compliant_count: number;
        non_compliant_count: number;
        frr_cvm_04_status: string;
    };
    security_posture: {
        overall_rating: string;
        posture_score: number;
        network_security_enabled: boolean;
        iam_least_privilege: boolean;
        logging_comprehensive: boolean;
        encryption_at_rest: boolean;
    };
    attack_surface: {
        graph_node_count: number;
        graph_edge_count: number;
        total_attack_paths: number;
        critical_attack_paths: number;
        exploitable_paths: number;
        avg_path_risk_score: number;
        blast_radius_score: number;
    };
    cspm_summary: {
        total_findings: number;
        by_severity: Record<string, number>;
    };
    vdr_acceptance: {
        acceptance_threshold_days: number;
        total_accepted: number;
        total_active: number;
    };
    exploit_type_distribution: Record<string, number>;
    trends: {
        daily: Array<{
            date: string;
            total_vulnerabilities: number;
            n5_count: number;
            n4_count: number;
            lev_count: number;
            irv_count: number;
            accepted_count: number;
            active_count: number;
        }>;
    };
}

// ============================================
// Stat Card Component
// ============================================
interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, trend, trendValue, subtitle }) => (
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
                {trend && trendValue && (
                    <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${
                        trend === 'up' ? 'text-emerald-400' : 
                        trend === 'down' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                        {trend === 'up' ? <ArrowUpRight size={12} /> : 
                         trend === 'down' ? <ArrowDownRight size={12} /> : null}
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
// Risk Indicator Card
// ============================================
interface RiskIndicatorProps {
    label: string;
    value: number;
    icon: React.ElementType;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'safe';
    description?: string;
}

const RiskIndicatorCard: React.FC<RiskIndicatorProps> = ({ label, value, icon: Icon, severity, description }) => {
    const severityClasses: Record<string, string> = {
        critical: 'border-red-500/50 bg-red-500/10 text-red-400',
        high: 'border-orange-500/50 bg-orange-500/10 text-orange-400',
        medium: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
        low: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
        safe: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
    };
    
    const classes = severityClasses[severity] || severityClasses.low;
    
    return (
        <div className={`rounded-xl border ${classes} p-5 transition-all hover:scale-[1.02]`}>
            <div className="flex items-center justify-between mb-3">
                <Icon size={20} className="opacity-70" />
                <span className="text-2xl font-black">{value}</span>
            </div>
            <div className="text-xs font-bold uppercase tracking-wider">{label}</div>
            {description && (
                <div className="text-[10px] mt-1 opacity-60">{description}</div>
            )}
        </div>
    );
};

// ============================================
// Security Posture Badge
// ============================================
interface PostureBadgeProps {
    rating: string;
    score: number;
}

const PostureBadge: React.FC<PostureBadgeProps> = ({ rating, score }) => {
    const config: Record<string, { color: string; icon: React.ElementType; text: string }> = {
        'EXCELLENT': { color: 'bg-emerald-500', icon: ShieldCheck, text: 'Excellent' },
        'GOOD': { color: 'bg-blue-500', icon: Shield, text: 'Good' },
        'FAIR': { color: 'bg-amber-500', icon: ShieldAlert, text: 'Fair' },
        'POOR': { color: 'bg-red-500', icon: ShieldX, text: 'Poor' },
        'UNKNOWN': { color: 'bg-slate-500', icon: Shield, text: 'Unknown' }
    };
    
    const { color, icon: Icon, text } = config[rating] || config.UNKNOWN;
    
    return (
        <div className="flex items-center gap-3">
            <div className={`${color} p-2.5 rounded-xl shadow-lg`}>
                <Icon size={24} className="text-white" />
            </div>
            <div>
                <div className="text-xl font-black text-white">{text}</div>
                <div className="text-xs text-slate-400">{score}/10 Security Score</div>
            </div>
        </div>
    );
};

// ============================================
// Custom Tooltip
// ============================================
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    
    return (
        <div className="bg-[#0c0c0e] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
            <p className="text-[10px] font-mono text-slate-500 uppercase mb-2 border-b border-white/5 pb-2">
                {label}
            </p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm py-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-slate-400">{p.name}:</span>
                    <span className="font-bold text-white">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

// ============================================
// Distribution Bar Component
// ============================================
interface DistributionBarProps {
    data: Record<string, number>;
    colors: Record<string, string>;
    title: string;
}

const DistributionBar: React.FC<DistributionBarProps> = ({ data, colors, title }) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) return null;
    
    return (
        <div>
            <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Layers size={10} />
                {title}
            </div>
            <div className="flex h-6 rounded-lg overflow-hidden">
                {Object.entries(data).map(([key, value]) => {
                    const pct = (value / total) * 100;
                    if (pct === 0) return null;
                    return (
                        <div
                            key={key}
                            style={{ width: `${pct}%`, background: colors[key] || '#3f3f46' }}
                            className="h-full transition-all hover:opacity-80"
                            title={`${key}: ${value} (${pct.toFixed(1)}%)`}
                        />
                    );
                })}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded" style={{ background: colors[key] || '#3f3f46' }} />
                        <span className="text-slate-500">{key}:</span>
                        <span className="font-bold text-slate-300">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================
// Posture Check Item
// ============================================
interface PostureCheckProps {
    label: string;
    enabled: boolean;
}

const PostureCheckItem: React.FC<PostureCheckProps> = ({ label, enabled }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
        <span className="text-sm text-slate-300">{label}</span>
        {enabled ? (
            <CheckCircle2 size={16} className="text-emerald-400" />
        ) : (
            <XCircle size={16} className="text-red-400" />
        )}
    </div>
);

// ============================================
// Section Header
// ============================================
interface SectionHeaderProps {
    icon: React.ElementType;
    title: string;
    iconColor: string;
    action?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon: Icon, title, iconColor, action }) => (
    <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
            <Icon size={18} className={iconColor} />
            {title}
        </h3>
        {action}
    </div>
);

// ============================================
// Main Dashboard Component
// ============================================
export default function VDRPublicMetricsDashboard() {
    const [data, setData] = useState<VDRMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        risk: true,
        distribution: true,
        trends: true,
        posture: true,
        attack: true,
        cspm: true
    });

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch(DATA_URL);
                if (!response.ok) {
                    throw new Error(`Failed to load VDR metrics: ${response.status}`);
                }
                const json: VDRMetrics = await response.json();
                setData(json);
                setLastUpdated(new Date(json.metadata?.generated_at || Date.now()));
                setError(null);
            } catch (err) {
                console.error('VDR Metrics fetch error:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);

    // Computed trend values - Mapping from trends.daily
    const computedMetrics = useMemo(() => {
        if (!data || !data.trends?.daily) return null;
        
        const trends = data.trends.daily || [];
        const latestTrend = trends[trends.length - 1];
        const prevTrend = trends[trends.length - 8]; // ~week ago
        
        let vulnTrend: 'up' | 'down' | 'neutral' = 'neutral';
        let vulnTrendValue = '';
        if (latestTrend && prevTrend) {
            const diff = latestTrend.total_vulnerabilities - prevTrend.total_vulnerabilities;
            if (diff > 0) {
                vulnTrend = 'down'; // More vulns is bad
                vulnTrendValue = `+${diff} this week`;
            } else if (diff < 0) {
                vulnTrend = 'up'; // Less vulns is good
                vulnTrendValue = `${diff} this week`;
            } else {
                vulnTrendValue = 'No change';
            }
        }
        
        return { vulnTrend, vulnTrendValue, trends };
    }, [data]);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-[400px] bg-[#09090b] flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw size={40} className="text-blue-500 animate-spin mx-auto mb-4" />
                    <div className="text-slate-400">Loading VDR Metrics...</div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-[400px] bg-[#09090b] flex items-center justify-center p-4">
                <div className={THEME.card + " p-8 max-w-md text-center"}>
                    <AlertOctagon size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Failed to Load VDR Metrics</h2>
                    <p className="text-slate-400 text-sm mb-4">{error}</p>
                    <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                        <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Expected File</div>
                        <code className="text-xs text-slate-300 font-mono">{DATA_URL}</code>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    // Destructure mapped objects from JSON schema
    const { 
        current_snapshot: snapshot, 
        risk_classification: risk, 
        compliance_status: compliance, 
        security_posture: posture, 
        attack_surface, 
        cspm_summary: cspm, 
        vdr_acceptance, 
        exploit_type_distribution: exploit_types 
    } = data;

    return (
        <div className="min-h-screen bg-[#09090b] text-white">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* ========================================== */}
                {/* Header */}
                {/* ========================================== */}
                <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <Shield className="text-blue-500" />
                            VDR Security Metrics
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            FedRAMP Vulnerability Detection & Response • {data.metadata?.vdr_standard || 'Release 25.09A'}
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <PostureBadge rating={posture?.overall_rating} score={posture?.posture_score} />
                        {lastUpdated && (
                            <div className="text-right hidden lg:block">
                                <div className="text-[10px] text-slate-600 uppercase tracking-wider">Last Updated</div>
                                <div className="text-sm font-mono text-slate-300">
                                    {lastUpdated.toLocaleDateString()} {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* ========================================== */}
                {/* Main Stats Grid */}
                {/* ========================================== */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Vulnerabilities"
                        value={snapshot?.total_vulnerabilities || 0}
                        icon={AlertTriangle}
                        color="text-amber-400"
                        trend={computedMetrics?.vulnTrend}
                        trendValue={computedMetrics?.vulnTrendValue}
                    />
                    <StatCard
                        label="Unique CVEs"
                        value={snapshot?.unique_cves || 0}
                        icon={Database}
                        color="text-purple-400"
                        subtitle={`${snapshot?.affected_resource_count || 0} resources affected`}
                    />
                    <StatCard
                        label="Compliance Rate"
                        value={`${compliance?.compliance_rate || 0}%`}
                        icon={CheckCircle2}
                        color="text-emerald-400"
                        subtitle={compliance?.frr_cvm_04_status === 'COMPLIANT' ? 'FRR-CVM-04 ✓' : 'Review Required'}
                    />
                    <StatCard
                        label="Security Score"
                        value={`${posture?.posture_score || 0}/10`}
                        icon={Shield}
                        color="text-blue-400"
                        subtitle={posture?.overall_rating || 'Unknown'}
                    />
                </section>

                {/* ========================================== */}
                {/* Risk Indicators */}
                {/* ========================================== */}
                <section className={THEME.card + " p-6"}>
                    <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSection('risk')}
                    >
                        <SectionHeader 
                            icon={AlertOctagon} 
                            title="Risk Indicators" 
                            iconColor="text-red-400"
                        />
                        <ChevronDown 
                            size={18} 
                            className={`text-slate-500 transition-transform ${expandedSections.risk ? 'rotate-180' : ''}`}
                        />
                    </div>
                    
                    {expandedSections.risk && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <RiskIndicatorCard
                                label="Critical Findings"
                                value={risk?.critical_findings || 0}
                                icon={AlertOctagon}
                                severity={risk?.critical_findings > 0 ? 'critical' : 'safe'}
                                description="Highest priority"
                            />
                            <RiskIndicatorCard
                                label="Likely Exploitable"
                                value={risk?.lev_count || 0}
                                icon={Zap}
                                severity={risk?.lev_count > 0 ? 'high' : 'safe'}
                                description="LEV Classification"
                            />
                            <RiskIndicatorCard
                                label="Internet Reachable"
                                value={risk?.irv_count || 0}
                                icon={Network}
                                severity={risk?.irv_count > 0 ? 'high' : 'safe'}
                                description="IRV Classification"
                            />
                            <RiskIndicatorCard
                                label="CISA KEV Matches"
                                value={risk?.kev_matches || 0}
                                icon={Target}
                                severity={risk?.kev_matches > 0 ? 'critical' : 'safe'}
                                description="Known exploited"
                            />
                        </div>
                    )}
                </section>

                {/* ========================================== */}
                {/* Distribution Charts */}
                {/* ========================================== */}
                <section className="grid lg:grid-cols-2 gap-6">
                    {/* N-Rating Distribution */}
                    <div className={THEME.card + " p-6"}>
                        <SectionHeader 
                            icon={BarChart3} 
                            title="N-Rating Distribution" 
                            iconColor="text-blue-400"
                        />
                        <DistributionBar
                            data={risk?.n_rating_distribution || {}}
                            colors={N_RATING_COLORS}
                            title="Vulnerability Risk Ratings"
                        />
                        <div className="mt-6">
                            <ResponsiveContainer width="100%" height={150}>
                                <BarChart data={Object.entries(risk?.n_rating_distribution || {}).map(([name, value]) => ({ name, value }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} />
                                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {Object.keys(risk?.n_rating_distribution || {}).map((key, i) => (
                                            <Cell key={i} fill={N_RATING_COLORS[key] || '#3f3f46'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Severity Distribution */}
                    <div className={THEME.card + " p-6"}>
                        <SectionHeader 
                            icon={PieChartIcon} 
                            title="Severity Distribution" 
                            iconColor="text-amber-400"
                        />
                        <DistributionBar
                            data={risk?.severity_distribution || {}}
                            colors={SEVERITY_COLORS}
                            title="CVSS Severity Levels"
                        />
                        <div className="mt-6">
                            <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie
                                        data={Object.entries(risk?.severity_distribution || {}).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }))}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={35}
                                        outerRadius={60}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {Object.entries(risk?.severity_distribution || {}).filter(([_, v]) => v > 0).map(([key], i) => (
                                            <Cell key={i} fill={SEVERITY_COLORS[key] || '#3f3f46'} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>

                {/* ========================================== */}
                {/* Trend Chart */}
                {/* ========================================== */}
                {computedMetrics?.trends && computedMetrics.trends.length > 0 && (
                    <section className={THEME.card + " p-6"}>
                        <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleSection('trends')}
                        >
                            <SectionHeader 
                                icon={TrendingUp} 
                                title="Vulnerability Trend History" 
                                iconColor="text-emerald-400"
                            />
                            <ChevronDown 
                                size={18} 
                                className={`text-slate-500 transition-transform ${expandedSections.trends ? 'rotate-180' : ''}`}
                            />
                        </div>
                        
                        {expandedSections.trends && (
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={computedMetrics.trends}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: '#71717a', fontSize: 10 }}
                                        axisLine={false}
                                        tickFormatter={(v) => v?.slice(5) || ''}
                                    />
                                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="total_vulnerabilities"
                                        name="Total"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fill="url(#colorTotal)"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="active_count"
                                        name="Active"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </section>
                )}

                {/* ========================================== */}
                {/* Security Posture & Attack Surface */}
                {/* ========================================== */}
                <section className="grid lg:grid-cols-2 gap-6">
                    {/* Security Posture Checks */}
                    <div className={THEME.card + " p-6"}>
                        <SectionHeader 
                            icon={ShieldCheck} 
                            title="Security Posture" 
                            iconColor="text-emerald-400"
                        />
                        <div className="space-y-1">
                            <PostureCheckItem label="Network Security (WAF)" enabled={posture?.network_security_enabled} />
                            <PostureCheckItem label="IAM Least Privilege" enabled={posture?.iam_least_privilege} />
                            <PostureCheckItem label="Comprehensive Logging" enabled={posture?.logging_comprehensive} />
                            <PostureCheckItem label="Encryption at Rest" enabled={posture?.encryption_at_rest} />
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">FRR-CVM-04 Status</span>
                                <span className={`font-bold ${
                                    compliance?.frr_cvm_04_status === 'COMPLIANT' ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                    {compliance?.frr_cvm_04_status || 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Attack Surface */}
                    <div className={THEME.card + " p-6"}>
                        <SectionHeader 
                            icon={GitBranch} 
                            title="Attack Surface Analysis" 
                            iconColor="text-purple-400"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/30 rounded-lg p-4 text-center">
                                <div className="text-2xl font-black text-slate-200">{attack_surface?.graph_node_count || 0}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Graph Nodes</div>
                            </div>
                            <div className="bg-black/30 rounded-lg p-4 text-center">
                                <div className="text-2xl font-black text-slate-200">{attack_surface?.graph_edge_count || 0}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Graph Edges</div>
                            </div>
                            <div className="bg-black/30 rounded-lg p-4 text-center">
                                <div className="text-2xl font-black text-blue-400">{attack_surface?.total_attack_paths || 0}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Attack Paths</div>
                            </div>
                            <div className="bg-black/30 rounded-lg p-4 text-center">
                                <div className={`text-2xl font-black ${
                                    (attack_surface?.critical_attack_paths || 0) > 0 ? 'text-red-400' : 'text-emerald-400'
                                }`}>
                                    {attack_surface?.critical_attack_paths || 0}
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Critical Paths</div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Blast Radius Score</span>
                                <span className={`font-bold ${
                                    (attack_surface?.blast_radius_score || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                                }`}>
                                    {attack_surface?.blast_radius_score || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Avg Path Risk Score</span>
                                <span className="font-bold text-slate-200">{attack_surface?.avg_path_risk_score || 0}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========================================== */}
                {/* CSPM & VDR Acceptance */}
                {/* ========================================== */}
                <section className="grid lg:grid-cols-2 gap-6">
                    {/* CSPM Findings */}
                    <div className={THEME.card + " p-6"}>
                        <SectionHeader 
                            icon={Eye} 
                            title="CSPM Findings" 
                            iconColor="text-cyan-400"
                        />
                        <div className="flex items-center gap-4 mb-4">
                            <div className="text-4xl font-black text-white">{cspm?.total_findings || 0}</div>
                            <div className="text-slate-500 text-sm">Total Findings</div>
                        </div>
                        {cspm?.by_severity && Object.keys(cspm.by_severity).length > 0 && (
                            <DistributionBar
                                data={cspm.by_severity}
                                colors={SEVERITY_COLORS}
                                title="By Severity"
                            />
                        )}
                    </div>

                    {/* VDR Acceptance */}
                    <div className={THEME.card + " p-6"}>
                        <SectionHeader 
                            icon={Clock} 
                            title="VDR Acceptance Status" 
                            iconColor="text-amber-400"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                                <div className="text-3xl font-black text-emerald-400">{vdr_acceptance?.total_active || 0}</div>
                                <div className="text-xs text-slate-400 mt-1">Active (Under Threshold)</div>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                                <div className="text-3xl font-black text-amber-400">{vdr_acceptance?.total_accepted || 0}</div>
                                <div className="text-xs text-slate-400 mt-1">Accepted ({vdr_acceptance?.acceptance_threshold_days || 192}+ days)</div>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-black/30 rounded-lg border border-white/5">
                            <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">VDR Standard</div>
                            <div className="text-sm text-slate-300">
                                {data.metadata?.vdr_standard || 'Release 25.09A'} • {vdr_acceptance?.acceptance_threshold_days || 192}-day acceptance window
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========================================== */}
                {/* Exploit Types */}
                {/* ========================================== */}
                {exploit_types && Object.keys(exploit_types).length > 0 && (
                    <section className={THEME.card + " p-6"}>
                        <SectionHeader 
                            icon={Zap} 
                            title="Exploit Type Distribution" 
                            iconColor="text-pink-400"
                        />
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {Object.entries(exploit_types).map(([type, count]) => (
                                <div key={type} className="bg-black/30 rounded-lg p-3 text-center border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="text-lg font-black text-slate-200">{count}</div>
                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-1 truncate" title={type}>
                                        {type.replace(/_/g, ' ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ========================================== */}
                {/* Footer */}
                {/* ========================================== */}
                <footer className="pt-6 border-t border-white/5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                            <Lock size={12} />
                            <span>Privacy: {data.metadata?.privacy_notice || 'Aggregate counts only • No sensitive data included'}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>VDR Standard: {data.metadata?.vdr_standard || 'Release 25.09A'}</span>
                            <span>•</span>
                            <span>Classification: {data.metadata?.data_classification || 'PUBLIC'}</span>
                            {data.metadata?.generated_at && (
                                <>
                                    <span>•</span>
                                    <span>Generated: {new Date(data.metadata.generated_at).toLocaleString()}</span>
                                </>
                            )}
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
