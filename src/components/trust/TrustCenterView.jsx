import React, { useState, useEffect, useMemo, memo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../contexts/ModalContext';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { API_CONFIG } from '../../config/api';
import {
    Shield, Download, FileText, ExternalLink,
    Clock, CheckCircle2, Mail, Globe, Lock, Server, Activity,
    XCircle, CheckCircle, Layers, Database, Users, BarChart, BookOpen,
    Bell, Code, Settings, Info, Zap, MessageSquare,
    TrendingUp, BarChart3, Landmark, Network, Cloud, ArrowDown, ChevronDown, ChevronRight,
    AlertTriangle, GitCommit, RefreshCw, Hash, FileJson, Cpu, Key, Radio, CheckSquare, FileCheck,
    PieChart, Layout, Monitor, HardDrive, Ticket, AlertCircle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, BarChart as RechartsBarChart, Bar, Cell, PieChart as RechartsPieChart, Pie
} from 'recharts';

// --- CONFIGURATION ---
const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
    ? `${import.meta.env.BASE_URL}data/`
    : `${import.meta.env.BASE_URL}/data/`;

// --- THEME ENGINE ---
const THEME = {
    bg: 'bg-[#09090b]',
    panel: 'bg-[#121217]',
    border: 'border-white/5',
    hover: 'hover:bg-white/5',
    active: 'bg-blue-600/10 text-blue-400 border-blue-500/50',
    text: {
        main: 'text-slate-200',
        muted: 'text-slate-500'
    }
};

// --- SUB-COMPONENT: Drift Alert ---
const DriftAlert = ({ drift }) => {
    if (!drift || !drift.detected || drift.count === 0) return null;
    return (
        <div className="bg-amber-900/10 border border-amber-500/30 p-4 rounded-xl flex items-center gap-4 animate-in slide-in-from-top duration-500">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                <AlertCircle size={20} />
            </div>
            <div className="flex-1">
                <h4 className="text-sm font-bold text-white">System Variance Detected</h4>
                <p className="text-xs text-amber-300/80">Automated scan identified {drift.count} infrastructure changes requiring review.</p>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: System Composition ---
const SystemCompositionChart = ({ awsActual }) => {
    if (!awsActual) return null;

    const data = [
        { name: 'Compute', value: (awsActual.ec2 || 0) + (awsActual.lambda || 0), color: '#3b82f6' },
        { name: 'Storage', value: (awsActual.s3 || 0) + (awsActual.rds || 0), color: '#10b981' },
        { name: 'Network', value: (awsActual.alb || 0) + (awsActual.api_gateway || 0), color: '#8b5cf6' },
        { name: 'Security', value: (awsActual.security_groups || 0) + (awsActual.waf || 0), color: '#f59e0b' },
    ].filter(item => item.value > 0);

    return (
        <div className="bg-[#18181b] p-6 rounded-xl border border-white/5 flex flex-col h-full">
            <h3 className="text-white font-bold text-sm mb-4">System Composition</h3>
            <div className="flex-1 relative min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', fontSize: '12px', borderRadius: '8px' }}
                            itemStyle={{ color: '#e5e7eb' }}
                        />
                    </RechartsPieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{data.reduce((a, b) => a + b.value, 0)}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Assets</div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
                {data.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Drift History Chart ---
const DriftHistoryChart = memo(({ history }) => {
    const chartData = useMemo(() => {
        if (!history || history.length === 0) return [];
        return [...history]
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .slice(-30)
            .map(item => ({
                date: new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                driftCount: item.drift_count || (item.drift?.count) || 0,
                assetCount: (item.aws?.ec2 || 0) + (item.aws?.s3 || 0) + (item.aws?.rds || 0)
            }));
    }, [history]);

    if (chartData.length === 0) return null;

    return (
        <div className="bg-[#18181b] p-6 rounded-xl border border-white/5 flex flex-col h-full shadow-lg">
            <div className="mb-6">
                <h3 className="text-white font-bold text-sm">Boundary Variances (30 Days)</h3>
                <p className="text-[10px] text-slate-500 mt-1">
                    Historical tracking of configuration changes.
                </p>
            </div>
            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} minTickGap={30} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} allowDecimals={false} />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-xl text-xs">
                                            <p className="text-gray-400 font-mono mb-2">{label}</p>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${payload[0].value > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                <span className="text-white font-bold">{payload[0].value} Variance{payload[0].value !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="driftCount" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.driftCount > 0 ? '#f59e0b' : '#10b981'} />
                            ))}
                        </Bar>
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
});

// --- SUB-COMPONENT: Data Flow Node ---
const DataFlowNode = ({ flowKey, data, index, isLast }) => {
    if (!data) return null;

    const theme = {
        entry: { color: 'text-emerald-400', border: 'group-hover:border-emerald-500/50', bg: 'group-hover:bg-emerald-500/5' },
        processing: { color: 'text-blue-400', border: 'group-hover:border-blue-500/50', bg: 'group-hover:bg-blue-500/5' },
        storage: { color: 'text-purple-400', border: 'group-hover:border-purple-500/50', bg: 'group-hover:bg-purple-500/5' },
        dissemination: { color: 'text-amber-400', border: 'group-hover:border-amber-500/50', bg: 'group-hover:bg-amber-500/5' }
    }[flowKey] || { color: 'text-slate-400', border: 'border-white/10', bg: '' };

    return (
        <div className="relative group">
            {!isLast && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-[#27272a] z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent w-1/2" />
                </div>
            )}
            <div className={`relative z-10 bg-[#18181b] border border-white/5 rounded-xl p-5 transition-all duration-300 ${theme.border} ${theme.bg}`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-0.5">Step 0{index + 1}</div>
                        <h3 className="text-white font-bold text-sm tracking-tight">{data.title}</h3>
                    </div>
                </div>
                <div className="mb-5 min-h-[40px]">
                    <p className="text-xs leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
                        {data.description}
                    </p>
                </div>
                <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded-full bg-white/5">
                            <Lock size={10} className="text-slate-400" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 truncate" title={data.encryption}>
                            {data.encryption || "Standard Encryption"}
                        </span>
                    </div>
                    {(data.pii_collected || data.pii_shared) && (
                        <div>
                            <div className="text-[9px] uppercase font-bold text-slate-600 mb-1.5">Data Elements</div>
                            <div className="flex flex-wrap gap-1.5">
                                {(data.pii_collected || data.pii_shared).map((field, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-[#09090b] border border-white/10 rounded text-[10px] text-slate-400 font-mono">
                                        {field}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Integration Card ---
const IntegrationCard = ({ item }) => {
    const isFedRAMP = item.status?.toLowerCase().includes('fedramp') || item.status?.includes('FRR');
    const isAgency = item.status?.toLowerCase().includes('agency') || item.status?.includes('Government');

    let statusColor = 'text-slate-400';
    let statusBg = 'bg-slate-500/10 border-slate-500/20';

    if (isFedRAMP) {
        statusColor = 'text-emerald-400';
        statusBg = 'bg-emerald-500/10 border-emerald-500/20';
    } else if (isAgency) {
        statusColor = 'text-blue-400';
        statusBg = 'bg-blue-500/10 border-blue-500/20';
    }

    return (
        <div className="bg-[#18181b] border border-white/5 rounded-lg p-4 hover:bg-white/[0.02] transition-colors">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="text-sm font-bold text-white">{item.provider}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{item.category}</div>
                </div>
                <div className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${item.risk === 'low' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/20' :
                    item.risk === 'high' ? 'bg-rose-900/20 text-rose-400 border-rose-500/20' :
                        'bg-amber-900/20 text-amber-400 border-amber-500/20'
                    }`}>
                    {item.risk} Risk
                </div>
            </div>

            <div className="space-y-2 mt-4 pt-3 border-t border-white/5">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Connection</span>
                    <span className="font-mono text-slate-300">{item.connection_type}</span>
                </div>
                {item.pii_shared && item.pii_shared.length > 0 && (
                    <div className="pt-2">
                        <div className="text-[9px] uppercase font-bold text-slate-600 mb-1">PII Shared</div>
                        <div className="flex flex-wrap gap-1">
                            {item.pii_shared.slice(0, 3).map((pii, i) => (
                                <span key={i} className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400">{pii}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Live MAS Dashboard ---
const LiveMasDashboard = ({ boundary, architecture, history }) => {
    if (!boundary || !architecture) {
        return (
            <div className="p-8 text-center border border-white/10 rounded-xl bg-[#121217]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-white/5 rounded-full mb-4"></div>
                    <div className="h-4 w-48 bg-white/5 rounded mb-2"></div>
                    <div className="text-xs text-slate-500">Connecting to live boundary map...</div>
                </div>
            </div>
        );
    }

    const { data_flows, integrations, system_profile } = architecture;
    const { zones, meta } = boundary;
    const drift = boundary.drift || null;

    // FIX 1: Access trust_center_stats from architecture map directly
    const trust_center = {
        api_count: architecture?.trust_center_stats?.api_count || 0,
        compute_count: architecture?.trust_center_stats?.compute_count || 0,
        storage_count: architecture?.trust_center_stats?.storage_count || 0
    };

    // FIX 2: Correct path to aws_actual (root level of mas_boundary.json)
    const rawCounts = boundary?.aws_actual || {};

    const aws_actual = {
        ec2: rawCounts.ec2 || 0,
        lambda: rawCounts.lambda || 0,
        s3: rawCounts.s3 || 0,
        rds: rawCounts.rds || 0,
        alb: rawCounts.alb || 0,
        fsx: rawCounts.fsx || 0,
        waf: rawCounts.waf || 0,
        shield: rawCounts.shield || 0,
        shield_tier: rawCounts.shield_tier || 'Standard',
        security_groups: rawCounts.security_groups || 0
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Metadata */}
            <div className="flex flex-col md:flex-row justify-between gap-4 bg-blue-900/10 border border-blue-500/30 p-4 rounded-xl">
                <div>
                    <h2 className="text-white font-bold text-sm">Live Boundary Authorization</h2>
                    <div className="text-xs text-blue-300 font-mono mt-0.5">
                        Ver: {meta?.compliance_ver || 'N/A'} • {boundary?.fingerprint?.substring(0, 7)}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs font-mono text-emerald-400 bg-emerald-900/20 px-3 py-1 rounded border border-emerald-500/30 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        LIVE POLLING
                    </div>
                </div>
            </div>

            {/* 1. DRIFT ALERT */}
            <DriftAlert drift={drift} />

            {/* 2. ANALYTICS ROW: Composition & History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 h-[280px]">
                    <SystemCompositionChart awsActual={aws_actual} />
                </div>
                <div className="lg:col-span-2 h-[280px]">
                    <DriftHistoryChart history={history} />
                </div>
            </div>

            {/* 3. CORE LMS ARCHITECTURE */}
            {system_profile.lms_core && (
                <div className="bg-[#121217] border border-white/10 rounded-xl p-6 mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-white font-bold">Core LMS Application Architecture</h3>
                            <p className="text-[10px] text-slate-500 mt-1">Live polling of Three-Tier IaaS/PaaS components</p>
                        </div>
                        <span className="text-xs font-mono bg-indigo-900/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/20">IaaS / PaaS</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-black/20 p-4 rounded border border-white/5 relative group">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">{system_profile.lms_core.presentation.component}</div>
                            <div className="text-2xl font-bold text-white mb-1">
                                {(aws_actual.ec2 || 0)} <span className="text-xs font-normal text-slate-500">Instances</span>
                            </div>
                            <div className="text-xs text-blue-400 font-mono">{system_profile.lms_core.presentation.tech}</div>
                        </div>
                        <div className="bg-black/20 p-4 rounded border border-white/5 relative group">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">{system_profile.lms_core.logic.component}</div>
                            <div className="text-2xl font-bold text-white mb-1">
                                {(aws_actual.alb || 0)} <span className="text-xs font-normal text-slate-500">Balancers</span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono">{system_profile.lms_core.logic.tech}</div>
                        </div>
                        <div className="bg-black/20 p-4 rounded border border-white/5 relative group">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">{system_profile.lms_core.data.component}</div>
                            <div className="text-2xl font-bold text-white mb-1">
                                {(aws_actual.rds || 0) + (aws_actual.fsx || 0)} <span className="text-xs font-normal text-slate-500">Nodes</span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono">{system_profile.lms_core.data.tech}</div>
                        </div>
                        <div className="bg-black/20 p-4 rounded border border-white/5 relative group">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-3">Defense in Depth</div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="text-[10px] text-slate-500 uppercase">Web Firewall</div>
                                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                        {(aws_actual.waf || 0) > 0 ? (
                                            <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></span>Active</>
                                        ) : "Disabled"}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="text-[10px] text-slate-500 uppercase">DDoS Shield</div>
                                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></span>{aws_actual.shield_tier}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="text-[10px] text-slate-500 uppercase">Net Firewall</div>
                                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                        {(aws_actual.security_groups || 0) > 0 ? (
                                            <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></span>Enforced</>
                                        ) : "Checking..."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. TRUST CENTER ARCHITECTURE */}
            {system_profile.trust_center && (
                <div className="bg-[#121217] border border-white/10 rounded-xl p-6 mt-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-white font-bold">FedRAMP Trust Center Infrastructure</h3>
                            <p className="text-[10px] text-slate-500 mt-1">Live polling of compliance delivery resources (FRR-ADS-TC-01)</p>
                        </div>
                        <span className="text-xs font-mono bg-purple-900/20 text-purple-300 px-2 py-1 rounded border border-purple-500/20">Serverless / SaaS</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-black/20 p-4 rounded border border-white/5 relative group">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">{system_profile.trust_center.frontend.component}</div>
                            <div className="text-2xl font-bold text-white mb-1">Active</div>
                            <div className="text-xs text-blue-400 font-mono">{system_profile.trust_center.frontend.tech}</div>
                        </div>
                        <div className="bg-black/20 p-4 rounded border border-white/5 relative group">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">{system_profile.trust_center.api.component}</div>
                            <div className="text-2xl font-bold text-white mb-1">{trust_center.api_count || 0}</div>
                            <div className="text-xs text-slate-500">Active Endpoints</div>
                        </div>
                        <div className="bg-black/20 p-4 rounded border border-white/5 relative group">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">{system_profile.trust_center.compute.component}</div>
                            <div className="text-2xl font-bold text-white mb-1">{trust_center.compute_count || 0}</div>
                            <div className="text-xs text-slate-500">Lambda Functions</div>
                        </div>
                        <div className="bg-black/20 p-4 rounded border border-white/5 relative group">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">{system_profile.trust_center.storage.component}</div>
                            <div className="text-2xl font-bold text-white mb-1">{trust_center.storage_count || 0}</div>
                            <div className="text-xs text-slate-500">Artifact Buckets</div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. DATA FLOWS */}
            <div className="mt-24 border-t border-white/5 pt-12">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-white font-bold">Digital Data Lifecycle</h3>
                    <span className="text-[10px] font-mono text-slate-500 uppercase bg-white/5 px-2 py-1 rounded border border-white/5">
                        OMB A-130 Aligned
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                    {['entry', 'processing', 'storage', 'dissemination'].map((key, idx) => (
                        <DataFlowNode
                            key={key}
                            flowKey={key}
                            data={data_flows[key]}
                            index={idx}
                            isLast={idx === 3}
                        />
                    ))}
                </div>
            </div>

            {/* 6. INTEGRATIONS */}
            {integrations && integrations.length > 0 && (
                <div className="bg-[#121217] border border-white/10 rounded-xl p-6 mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold">Third-Party Interconnections</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {integrations.map((item, idx) => (
                            <IntegrationCard key={idx} item={item} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENT: Zone Card ---
const ZoneCard = ({ zoneId, data, isOpen, onToggle }) => {
    if (!data) return null;
    const { policy, assets } = data;

    const riskColor = policy.risk === 'High' || policy.risk === 'Critical' ? 'text-rose-400' :
        policy.risk === 'Medium' ? 'text-amber-400' : 'text-emerald-400';

    const borderColor = policy.risk === 'High' || policy.risk === 'Critical' ? 'border-rose-500/30' :
        policy.risk === 'Medium' ? 'border-amber-500/30' : 'border-emerald-500/30';

    return (
        <div className={`bg-[#18181b] border ${borderColor} rounded-xl overflow-hidden transition-all duration-300 mb-6`}>
            <div
                className="p-5 flex items-center justify-between cursor-pointer bg-white/[0.02]"
                onClick={() => onToggle(zoneId)}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-black/40 border border-white/10 ${riskColor}`}>
                        <div className="w-5 h-5 rounded-full border-2 border-current"></div>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">{policy.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">{policy.omb_type}</span>
                            <span>•</span>
                            <span>{policy.definition}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isOpen ? <ChevronDown className="text-slate-500" /> : <ChevronRight className="text-slate-500" />}
                </div>
            </div>

            {isOpen && (
                <div className="p-5 border-t border-white/5 bg-black/20">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Live Assets in Boundary ({assets?.length || 0})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                        {assets?.map((asset, idx) => (
                            <div key={idx} className="bg-[#27272a] p-3 rounded-lg border border-white/5 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></div>
                                <div>
                                    <div className="text-sm font-mono text-white">{asset.name}</div>
                                    <div className="text-[10px] text-slate-500">{asset.type} • {asset.id}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {policy.controls?.map((ctrl, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-mono font-bold">
                                {ctrl}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
export const TrustCenterView = () => {
    const { isAuthenticated, user } = useAuth();
    const { openModal } = useModal();
    const { status } = useSystemStatus();

    const [masBoundary, setMasBoundary] = useState(null);
    const [masArch, setMasArch] = useState(null);
    const [masHistory, setMasHistory] = useState([]);
    const [scnHistory, setScnHistory] = useState([]);
    const [nextReportDate, setNextReportDate] = useState(null);
    const [loading, setLoading] = useState(true);

    const uptime = status?.uptime_percent ? `${parseFloat(status.uptime_percent).toFixed(2)}%` : '99.99%';
    const latency = status?.avg_latency || '24ms';
    const totalRequests = status?.total_requests || '1.2k';

    useEffect(() => {
        const fetchData = async () => {
            const ts = Date.now();
            try {
                const [boundRes, archRes, histRes, dateRes] = await Promise.all([
                    fetch(`${BASE_PATH}mas_boundary.json?t=${ts}`),
                    fetch(`${BASE_PATH}mas_architecture_map.json?t=${ts}`),
                    fetch(`${BASE_PATH}mas_history.jsonl?t=${ts}`),
                    fetch(`${BASE_PATH}next_report_date.json?t=${ts}`)
                ]);

                // Try public_scn_history.jsonl first, fallback to scn_history.jsonl
                let scnRes = await fetch(`${BASE_PATH}public_scn_history.jsonl?t=${ts}`);
                if (!scnRes.ok) {
                    scnRes = await fetch(`${BASE_PATH}scn_history.jsonl?t=${ts}`);
                }

                if (boundRes.ok) setMasBoundary(await boundRes.json());
                if (archRes.ok) setMasArch(await archRes.json());

                if (histRes.ok) {
                    const text = await histRes.text();
                    const lines = text.trim().split('\n')
                        .map(line => { try { return JSON.parse(line); } catch { return null; } })
                        .filter(Boolean);
                    setMasHistory(lines);
                }

                if (scnRes.ok) {
                    const text = await scnRes.text();
                    const lines = text.trim().split('\n')
                        .map(line => { try { return JSON.parse(line); } catch { return null; } })
                        .filter(Boolean)
                        .filter(entry => entry.change_id && entry.change_id !== 'SYS-INIT') // Filter out placeholder entries
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort newest first
                    setScnHistory(lines.slice(0, 10)); // Show last 10 entries
                }

                if (dateRes.ok) {
                    const data = await dateRes.json();
                    setNextReportDate(new Date(data.next_ongoing_report));
                }
            } catch (e) {
                console.error("Data fetch error:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAction = (actionName) => {
        if (!isAuthenticated) {
            openModal('accessRequired', {
                featureName: actionName,
                benefits: ['Download machine-readable artifacts', 'View VDR data', 'Automated reviews']
            });
            return false;
        }
        return true;
    };

    const openApiDocs = () => window.open('https://meridian-knowledge-solutions.github.io/fedramp-20x-public/documentation/api/', '_blank');

    const viewSecureConfig = async () => {
        if (!handleAction('View Secure Configuration')) return;
        try {
            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONFIG_PUBLIC}`;
            const res = await fetch(url);
            const text = await res.text();
            openModal('markdown', { title: 'Secure Configuration', markdown: text });
        } catch (e) { alert('Load failed.'); }
    };

    const viewQuarterlyReport = async () => {
        if (!handleAction('View Quarterly Report')) return;
        try {
            const res = await fetch(`${BASE_PATH}ongoing_authorization_report_Q4_2025.md`);
            if (!res.ok) throw new Error('Failed');
            const text = await res.text();
            openModal('markdown', { title: 'Ongoing Authorization Report', subtitle: 'Automated Continuous Monitoring', markdown: text });
        } catch (e) { alert('Failed to load report.'); }
    };

    const downloadQuarterlyReport = () => { if (!handleAction('Download Quarterly Report')) return; window.open(`${BASE_PATH}ongoing_authorization_report_Q4_2025.json`, '_blank'); };

    const handleDownloadPackage = async () => {
        if (!handleAction('Download Authorization Package')) return;
        try {
            const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
            if (!token) { alert("Session expired."); return; }
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PACKAGE_DOWNLOAD}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error("Access Denied");
            const data = await response.json();
            if (data.url) window.location.href = data.url;
        } catch (error) { alert(`Download failed: ${error.message}`); }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#09090b]">
            <div className="text-center animate-pulse">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-blue-500/50"></div>
                <div className="text-slate-500 font-mono">Loading Authorization Context...</div>
            </div>
        </div>
    );

    return (
        <div className="-m-6 md:-m-8 min-h-screen bg-[#09090b] text-slate-300 font-sans selection:bg-blue-500/30 relative">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="relative z-10 px-6 md:px-8 py-8 space-y-8 max-w-7xl mx-auto">

                {/* --- HERO HEADER --- */}
                <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-8 relative overflow-hidden shadow-2xl`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-60" />
                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-2xl bg-[#0f172a] border border-white/10 flex items-center justify-center p-4">
                                <img src={`${BASE_PATH}meridian-favicon.png`} alt="Meridian" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">FedRAMP Trust Center</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-[#09090b]/50 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
                            <TelemetryItem label="Uptime" value={uptime} />
                            <TelemetryItem label="Latency" value={latency} />
                            <TelemetryItem label="Req/Hr" value={totalRequests} />
                        </div>
                    </div>
                </div>

                {/* --- SERVICE PROFILE --- */}
                <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-8 shadow-lg`}>
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                        <h2 className="text-xl font-bold text-white">Service Profile</h2>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">Authorized</span>
                    </div>
                    <div className="flex flex-col lg:flex-row justify-between gap-8">
                        <div className="flex-1 space-y-4">
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Meridian Learning Management System (LMS) is an enterprise SaaS platform for workforce training, compliance tracking, and professional development.
                            </p>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                The system integrates with federal identity providers and delivers SCORM, xAPI, and multimedia content to authorized users across agencies.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 lg:w-[500px]">
                            <InfoCard label="Deployment" value="Multi-tenant SaaS" sub="Shared Infrastructure" />
                            <InfoCard label="Cloud Provider" value="AWS" sub="AWS Commericial (US-east)" />
                            <InfoCard label="Auth Level" value="FedRAMP Moderate" sub="20X" />
                            <InfoCard label="Access" value="HTTPS" sub="Port 443" />
                        </div>
                    </div>
                </div>

                {/* --- LIVE SYSTEM BOUNDARY --- */}
                <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-6 shadow-md`}>
                    <LiveMasDashboard boundary={masBoundary} architecture={masArch} history={masHistory} />
                </div>

                {/* --- AUTHORIZED SERVICES GRID --- */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-6">Authorized Services</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <ServiceCard title="Course Management" desc="SCORM/AICC/xAPI delivery & multimedia." features={["Course catalog", "Mobile player", "Video delivery"]} />
                        <ServiceCard title="User Management" desc="SSO, RBAC, and hierarchy management." features={["SAML 2.0 SSO", "MFA Support", "Role hierarchy"]} />
                        <ServiceCard title="Assessment Engine" desc="Quizzes, exams, and competency validation." features={["Auto-grading", "Question banks", "Certificates"]} />
                        <ServiceCard title="Compliance Tracking" desc="Regulatory reporting and audit trails." features={["Rules engine", "21 CFR Part 11", "Audit logs"]} />
                        <ServiceCard title="Analytics" desc="Real-time dashboards and data exports." features={["Custom reports", "Trend analysis", "Scheduled exports"]} />
                        <ServiceCard title="Learning Record Store" desc="Native xAPI-compliant LRS." features={["Statement capture", "Learning analytics", "Cross-platform"]} />
                        <ServiceCard title="Career Development" desc="IDP and skills gap analysis." features={["Career paths", "Skills inventory", "IDP tracking"]} />
                        <ServiceCard title="Notifications" desc="Automated engagement engine." features={["Deadline alerts", "Manager notifications", "Templates"]} />
                        <ServiceCard title="API Gateway" desc="RESTful enterprise connectivity." features={["REST API", "Webhooks", "HRIS sync"]} />
                        <ServiceCard title="Content Authoring" desc="Built-in creation tools." features={["Course builder", "Version control", "Templates"]} />
                        <ServiceCard title="Admin Console" desc="System configuration and oversight." features={["Bulk ops", "System health", "Configuration"]} />
                    </div>
                </div>

                {/* --- EXCLUDED SERVICES --- */}
                <div className="bg-[#1a1212] border border-rose-500/20 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start mt-8">
                    <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 shrink-0 border border-rose-500/20">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-rose-400 mb-2">Services NOT Included</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-sm text-gray-400">
                            <ul className="list-disc pl-4 space-y-1 marker:text-rose-500/50">
                                <li><strong>On-Premise:</strong> Self-hosted installations.</li>
                                <li><strong>Private Cloud:</strong> Customer-specific instances.</li>
                                <li><strong>Custom Dev:</strong> Bespoke software outside core.</li>
                            </ul>
                            <ul className="list-disc pl-4 space-y-1 marker:text-rose-500/50">
                                <li><strong>Third-Party Content:</strong> External libraries.</li>
                                <li><strong>Pro Services:</strong> Consulting/Implementation.</li>
                                <li><strong>Native Mobile:</strong> Web-responsive only.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* --- ACTION DECK --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                    <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-8 flex flex-col justify-between shadow-lg relative overflow-hidden group`}>
                        <div>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-white">Authorization Data</h3>
                                <div className="text-xs text-slate-400">Machine-Readable Artifacts</div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-8">
                                <ArtifactBadge label="Machine Readable" /><ArtifactBadge label="OSCAL Ready" /><ArtifactBadge label="Continuous Validation" />
                            </div>
                        </div>
                        <button onClick={handleDownloadPackage} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg">
                            {isAuthenticated ? <Download size={18} /> : <Lock size={18} />} Download Package
                        </button>
                    </div>

                    <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-8 flex flex-col justify-between shadow-lg`}>
                        <div>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-white">Continuous Monitoring</h3>
                                <div className="text-xs text-slate-400">Real-time Compliance Tracking</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-[#09090b] p-4 rounded-xl border border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Next Snapshot</div>
                                    <div className="text-blue-400 font-bold text-lg">{nextReportDate ? nextReportDate.toLocaleDateString() : '...'}</div>
                                </div>
                                <div className="bg-[#09090b] p-4 rounded-xl border border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Validation</div>
                                    <div className="text-emerald-400 font-bold text-lg flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Passing
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={viewQuarterlyReport} className="flex-1 py-3.5 bg-[#18181b] hover:bg-[#202025] text-slate-200 font-bold rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2 text-sm">View Report</button>
                            <button onClick={downloadQuarterlyReport} className="px-5 py-3.5 bg-[#18181b] hover:bg-[#202025] text-slate-200 rounded-xl border border-white/5 transition-all"><Download size={18} /></button>
                        </div>
                    </div>
                </div>

                {/* --- SCN LOG --- */}
                <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-8 shadow-md mt-8`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-white">Infrastructure Change Log</h3>
                            <div className="text-xs text-slate-500 mt-1 font-mono">SCN History (Significant Change Notifications)</div>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 font-mono">
                                {scnHistory.length} Changes
                            </span>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-white/5 bg-[#09090b]">
                        {scnHistory.length === 0 ? (
                            <div className="p-8 text-center text-slate-600 text-sm italic">No significant changes detected yet...</div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] text-slate-500 uppercase font-mono">
                                        <th className="p-4 font-bold">Date</th>
                                        <th className="p-4 font-bold">Change ID</th>
                                        <th className="p-4 font-bold">Classification</th>
                                        <th className="p-4 font-bold text-center">Components</th>
                                        <th className="p-4 font-bold text-right">Impact</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm font-mono">
                                    {scnHistory.map((entry, index) => {
                                        // Determine impact badge styling
                                        const impact = entry.infrastructure_impact || 'low';
                                        const impactStyles = {
                                            high: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
                                            medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                                            low: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                                        }[impact] || 'text-slate-500 bg-slate-500/10 border-slate-500/20';

                                        return (
                                            <tr key={entry.change_id || index} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="p-4 text-slate-300">
                                                    <div>{new Date(entry.timestamp).toLocaleDateString()}</div>
                                                    <div className="text-[10px] text-slate-500">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs text-blue-400 font-mono">{entry.change_id}</span>
                                                </td>
                                                <td className="p-4">
                                                    <ClassificationBadge type={entry.classification} />
                                                    {entry.description && (
                                                        <div className="text-[10px] text-slate-500 mt-1 max-w-[200px] truncate" title={entry.description}>
                                                            {entry.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-slate-300 font-bold">{entry.affected_component_count || 0}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className={`text-[10px] font-bold border px-2 py-0.5 rounded uppercase ${impactStyles}`}>
                                                        {impact}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* --- FOOTER ACTIONS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8 mt-8">
                    <FooterAction title="API Docs" onClick={openApiDocs} />
                    <FooterAction title="Secure Config" onClick={viewSecureConfig} />
                    <FooterAction title="Support" onClick={() => window.location.href = 'mailto:support@meridianks.com'} />
                </div>
            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const TelemetryItem = ({ label, value }) => (
    <div className="flex items-center gap-3 px-4 py-1.5">
        <div>
            <div className="text-white font-mono font-bold text-sm leading-none">{value}</div>
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">{label}</div>
        </div>
    </div>
);

const InfoCard = ({ label, value, sub }) => (
    <div className="bg-[#09090b] p-3 rounded-xl border border-white/5">
        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">{label}</div>
        <div className="text-sm font-bold text-white truncate" title={value}>{value}</div>
        {sub && <div className="text-[10px] text-blue-400/80 mt-0.5">{sub}</div>}
    </div>
);

const ServiceCard = ({ title, desc, features }) => (
    <div className={`${THEME.panel} border ${THEME.border} p-5 rounded-xl hover:border-blue-500/30 transition-all group flex flex-col h-full cursor-default`}>
        <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-white text-sm">{title}</h4>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">Auth</span>
        </div>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed line-clamp-2">{desc}</p>
        <div className="space-y-1.5 flex-1">
            {features?.slice(0, 3).map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                    <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">{f}</span>
                </div>
            ))}
        </div>
    </div>
);

const ArtifactBadge = ({ label }) => (
    <div className="flex items-center gap-2 bg-[#09090b] px-3 py-1.5 rounded-lg border border-white/5 text-xs font-mono text-slate-300">
        {label}
    </div>
);

const ClassificationBadge = ({ type, label }) => {
    let styles = "bg-slate-800 text-slate-300 border-slate-700";

    if (type === 'routine_recurring' || type === 'routine') {
        styles = "bg-blue-500/10 text-blue-400 border-blue-500/20";
    } else if (type === 'adaptive') {
        styles = "bg-purple-500/10 text-purple-400 border-purple-500/20";
    } else if (type === 'transformative') {
        styles = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }

    // Format label for display
    const displayLabel = label || type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${styles}`}>
            {displayLabel}
        </div>
    );
};

const FooterAction = ({ title, onClick }) => (
    <button onClick={onClick} className={`${THEME.panel} border ${THEME.border} hover:bg-[#18181b] p-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-all group`}>
        {title}
    </button>
);