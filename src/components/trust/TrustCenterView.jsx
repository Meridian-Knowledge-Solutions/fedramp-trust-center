import React, { useState, useEffect, useMemo, memo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../contexts/ModalContext';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { useData } from '../../hooks/useData';
import { API_CONFIG } from '../../config/api';
import {
    Shield, Download, FileText, ExternalLink,
    Clock, CheckCircle2, Mail, Globe, Lock, Server, Activity,
    XCircle, CheckCircle, Layers, Database, Users, BarChart, BookOpen,
    Bell, Code, Settings, Info, Zap, MessageSquare,
    TrendingUp, BarChart3, Landmark, Network, Cloud, ArrowDown, ChevronDown, ChevronRight,
    AlertTriangle, GitCommit, RefreshCw, Hash, FileJson, Cpu, Key, Radio, CheckSquare, FileCheck
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, BarChart as RechartsBarChart, Bar, Cell
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

// --- SUB-COMPONENT: Drift Status Alert ---
const DriftAlert = ({ drift }) => {
    if (!drift) return null;

    // If no drift or first run, show nothing (healthy state is implicit)
    if (!drift.detected || drift.is_first_run) return null;

    return (
        <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                <AlertTriangle size={20} />
            </div>
            <div className="flex-1">
                <h4 className="text-rose-400 font-bold text-sm">Configuration Drift Detected</h4>
                <p className="text-rose-300/80 text-xs mt-1">
                    The live infrastructure has deviated from the authorized FedRAMP baseline.
                    {drift.changes?.length} unauthorized changes detected.
                </p>
                <div className="mt-3 flex gap-2">
                    {drift.changes?.map((change, i) => (
                        <span key={i} className="px-2 py-1 bg-rose-950/50 border border-rose-500/20 rounded text-[10px] text-rose-300 font-mono">
                            {change}
                        </span>
                    ))}
                </div>
            </div>
            <button className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors">
                Initiate Remediation
            </button>
        </div>
    );
};

// --- SUB-COMPONENT: Infrastructure Summary Card ---
const InfrastructureSummary = ({ infra }) => {
    if (!infra) return null;

    // Aggregate counts from the new JSON structure
    const computeCount = (infra.compute?.ec2 || 0) + (infra.compute?.lambda_app || 0) + (infra.compute?.lambda_trust_center || 0);
    const storageCount = (infra.storage?.rds || 0) + (infra.storage?.s3 || 0) + (infra.storage?.elasticache || 0);
    const networkCount = (infra.network?.alb || 0) + (infra.network?.api_gateway || 0);
    const kmsCount = infra.kms_keys || 0;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                <div className="p-2 rounded bg-blue-500/10 text-blue-400"><Cpu size={18} /></div>
                <div>
                    <div className="text-xl font-bold text-white">{computeCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Compute Nodes</div>
                </div>
            </div>
            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                <div className="p-2 rounded bg-purple-500/10 text-purple-400"><Database size={18} /></div>
                <div>
                    <div className="text-xl font-bold text-white">{storageCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Storage Units</div>
                </div>
            </div>
            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-400"><Network size={18} /></div>
                <div>
                    <div className="text-xl font-bold text-white">{networkCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Network Gates</div>
                </div>
            </div>
            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                <div className="p-2 rounded bg-amber-500/10 text-amber-400"><Key size={18} /></div>
                <div>
                    <div className="text-xl font-bold text-white">{kmsCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Encryption Keys</div>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Professional Data Flow Node (Replaces DataFlowCard) ---
const DataFlowNode = ({ flowKey, data, index, isLast }) => {
    if (!data) return null;

    // Distinct color themes for each stage to create visual separation
    const theme = {
        entry: { color: 'text-emerald-400', border: 'group-hover:border-emerald-500/50', bg: 'group-hover:bg-emerald-500/5', icon: Shield },
        processing: { color: 'text-blue-400', border: 'group-hover:border-blue-500/50', bg: 'group-hover:bg-blue-500/5', icon: Cpu },
        storage: { color: 'text-purple-400', border: 'group-hover:border-purple-500/50', bg: 'group-hover:bg-purple-500/5', icon: Database },
        dissemination: { color: 'text-amber-400', border: 'group-hover:border-amber-500/50', bg: 'group-hover:bg-amber-500/5', icon: Globe }
    }[flowKey] || { color: 'text-slate-400', border: 'border-white/10', bg: '', icon: Activity };

    const Icon = theme.icon;

    return (
        <div className="relative group">
            {/* Connector Line (Hidden on Mobile) */}
            {!isLast && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-[#27272a] z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent w-1/2" />
                </div>
            )}

            {/* Main Card */}
            <div className={`relative z-10 bg-[#18181b] border border-white/5 rounded-xl p-5 transition-all duration-300 ${theme.border} ${theme.bg}`}>

                {/* Header: Step Number & Icon */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg bg-[#09090b] border border-white/10 shadow-inner ${theme.color}`}>
                            <Icon size={20} />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-0.5">Step 0{index + 1}</div>
                            <h3 className="text-white font-bold text-sm tracking-tight">{data.title}</h3>
                        </div>
                    </div>
                    {data.retention && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/5" title="Data Retention Policy">
                            <Clock size={10} />
                            {data.retention}
                        </div>
                    )}
                </div>

                {/* Description */}
                <div className="mb-5 min-h-[40px]">
                    <p className="text-xs leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
                        {data.description}
                    </p>
                </div>

                {/* Technical Metadata Footer */}
                <div className="space-y-3 pt-4 border-t border-white/5">

                    {/* Encryption Status */}
                    {data.encryption ? (
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded-full bg-emerald-500/10">
                                <Lock size={10} className="text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400/90">{data.encryption}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded-full bg-blue-500/10">
                                <Activity size={10} className="text-blue-400" />
                            </div>
                            <span className="text-[10px] font-mono text-blue-400/90">Standard Processing</span>
                        </div>
                    )}

                    {/* PII Chips */}
                    {(data.pii_collected?.length > 0 || data.pii_shared?.length > 0) && (
                        <div>
                            <div className="text-[9px] uppercase font-bold text-slate-600 mb-1.5">Data Elements</div>
                            <div className="flex flex-wrap gap-1.5">
                                {(data.pii_collected || data.pii_shared).slice(0, 4).map((field, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-[#09090b] border border-white/10 rounded text-[10px] text-slate-400 font-mono hover:border-slate-500/50 transition-colors cursor-default">
                                        {field}
                                    </span>
                                ))}
                                {(data.pii_collected || data.pii_shared).length > 4 && (
                                    <span className="px-1.5 py-0.5 text-[10px] text-slate-500">+{(data.pii_collected || data.pii_shared).length - 4}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Expandable Integration Row ---
const IntegrationRow = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);

    const isFedRAMP = item.controls?.fedramp_authorized;
    const isAgency = item.provider_status === 'agency';

    let statusColor = 'text-slate-400';
    let statusBg = 'bg-slate-500/10 border-slate-500/20';
    let Icon = Cloud;

    if (isFedRAMP) {
        statusColor = 'text-emerald-400';
        statusBg = 'bg-emerald-500/10 border-emerald-500/20';
        Icon = Shield;
    } else if (isAgency) {
        statusColor = 'text-blue-400';
        statusBg = 'bg-blue-500/10 border-blue-500/20';
        Icon = Landmark;
    }

    return (
        <div className={`bg-[#18181b] border ${isOpen ? 'border-blue-500/30' : 'border-white/5'} rounded-lg transition-all overflow-hidden`}>
            {/* Main Row */}
            <div
                className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-white/[0.02] cursor-pointer gap-4"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg border ${statusBg} ${statusColor}`}>
                        <Icon size={16} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-white">{item.provider}</div>
                            {item.usage && <span className="text-[10px] bg-white/10 px-1.5 rounded text-slate-300">{item.usage}</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase mt-0.5">
                            {item.category} • {item.provider_status?.replace('_', ' ')}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                    <div className="hidden md:block">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Transfer</div>
                        <div className="text-xs text-slate-300 font-mono">{item.connection?.protocols?.join(', ')}</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`px-2 py-1 rounded border text-[10px] font-bold uppercase ${item.risk === 'low' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/20' :
                                'bg-amber-900/20 text-amber-400 border-amber-500/20'
                            }`}>
                            {item.risk} Risk
                        </div>
                        {isOpen ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                    </div>
                </div>
            </div>

            {/* Expanded Details Panel */}
            {isOpen && (
                <div className="px-4 pb-4 pt-0 flex flex-col md:flex-row gap-4 border-t border-white/5 bg-black/20 mt-2 pt-4">
                    {/* Controls Column */}
                    <div className="flex-1">
                        <h5 className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-2">
                            <Shield size={12} /> Applied Controls
                        </h5>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(item.controls || {}).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-2">
                                    {val ? <CheckCircle2 size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-slate-600" />}
                                    <span className="text-[11px] text-slate-300 capitalize">{key.replace(/_/g, ' ')}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Connection Column */}
                    <div className="flex-1">
                        <h5 className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-2">
                            <Network size={12} /> Connectivity
                        </h5>
                        <div className="space-y-1">
                            {item.connection?.endpoint && (
                                <div className="text-[11px] font-mono text-blue-300 bg-blue-900/10 px-2 py-1 rounded border border-blue-500/10 truncate">
                                    {item.connection.endpoint}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                                {item.connection?.protocols?.map(p => (
                                    <span key={p} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-white/5">{p}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* PII Column */}
                    <div className="flex-1">
                        <h5 className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-2">
                            <FileText size={12} /> Data Elements
                        </h5>
                        <div className="flex flex-wrap gap-1.5">
                            {item.pii?.fields?.map(f => (
                                <span key={f} className="text-[10px] bg-rose-900/10 text-rose-300/80 px-1.5 py-0.5 rounded border border-rose-500/10 font-mono">
                                    {f}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const LiveMasDashboard = () => {
    const { masData } = useData();

    if (!masData) {
        return (
            <div className="p-8 text-center border border-white/10 rounded-xl bg-[#121217]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-white/5 rounded-full mb-4"></div>
                    <div className="h-4 w-48 bg-white/5 rounded mb-2"></div>
                    <div className="text-xs text-slate-500">Connecting to live boundary map...</div>
                    <div className="mt-2 text-[10px] text-slate-600">Checking public/data/mas_boundary.json</div>
                </div>
            </div>
        );
    }

    // Parse the new JSON structure
    const boundary = masData.boundary || {};
    const infrastructure = boundary.infrastructure || {};
    const dataFlows = masData.data_flows || {};
    const integrations = masData.integrations || [];
    const meta = masData.meta || {};
    const trustCenter = masData.trust_center || {};
    const drift = masData.drift || {};

    // Calculate total assets from infrastructure object
    const totalAssets =
        (infrastructure.compute?.ec2 || 0) +
        (infrastructure.compute?.lambda_app || 0) +
        (infrastructure.compute?.lambda_trust_center || 0) +
        (infrastructure.storage?.s3 || 0) +
        (infrastructure.storage?.rds || 0) +
        (infrastructure.network?.alb || 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Metadata */}
            <div className="flex flex-col md:flex-row justify-between gap-4 bg-blue-900/10 border border-blue-500/30 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                    <Shield className="text-blue-400" size={24} />
                    <div>
                        <h2 className="text-white font-bold text-sm">Live Boundary Authorization</h2>
                        <div className="text-xs text-blue-300 font-mono mt-0.5">
                            Ver: {meta.compliance_ver || 'N/A'} • {meta.baseline} Baseline
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-[10px] text-slate-400 font-mono">Fingerprint</div>
                        <div className="text-xs text-white font-mono">{infrastructure.fingerprint || 'N/A'}</div>
                    </div>
                    <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                    <div className="text-center px-3 py-1 bg-white/5 rounded border border-white/10">
                        <div className="text-xs text-slate-500 font-bold uppercase">Assets</div>
                        <div className="text-lg font-bold text-white">{totalAssets}</div>
                    </div>
                    <div className="text-xs font-mono text-emerald-400 bg-emerald-900/20 px-3 py-1 rounded border border-emerald-500/30 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        {boundary.validated ? 'VALIDATED' : 'LIVE'}
                    </div>
                </div>
            </div>

            {/* 1. DRIFT ALERT */}
            <DriftAlert drift={drift} />

            {/* 2. Infrastructure Summary */}
            <InfrastructureSummary infra={infrastructure} />

            {/* 3. Professional Data Flows */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Activity size={18} className="text-blue-400" />
                        Digital Data Lifecycle
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500 uppercase bg-white/5 px-2 py-1 rounded border border-white/5">
                        End-to-End Validation
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                    {['entry', 'processing', 'storage', 'dissemination'].map((key, idx) => (
                        <DataFlowNode
                            key={key}
                            flowKey={key}
                            data={dataFlows[key]}
                            index={idx}
                            isLast={idx === 3}
                        />
                    ))}
                </div>
            </div>

            {/* 4. Trust Center Specifics */}
            {trustCenter.compliance_ref && (
                <div className="bg-[#121217] border border-white/10 rounded-xl p-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Landmark size={18} className="text-purple-400" />
                            FedRAMP Trust Center Infrastructure
                        </h3>
                        <span className="text-xs font-mono bg-purple-900/20 text-purple-300 px-2 py-1 rounded border border-purple-500/20">
                            {trustCenter.compliance_ref}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-black/20 p-4 rounded border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Auth & Retention</div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                    <Key size={12} className="text-slate-500" /> {trustCenter.auth}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                    <Clock size={12} className="text-slate-500" /> {trustCenter.retention} Retention
                                </div>
                            </div>
                        </div>
                        <div className="bg-black/20 p-4 rounded border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Approved Domains</div>
                            <div className="flex flex-wrap gap-2">
                                {trustCenter.email_domains?.map(d => (
                                    <span key={d} className="text-xs bg-white/5 px-2 py-1 rounded text-slate-300 font-mono">{d}</span>
                                ))}
                            </div>
                        </div>
                        <div className="bg-black/20 p-4 rounded border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Controls Applied</div>
                            <div className="flex flex-wrap gap-1">
                                {trustCenter.frr_controls?.map(c => (
                                    <span key={c} className="text-[10px] bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">{c}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Integrations Table */}
            {integrations.length > 0 && (
                <div className="bg-[#121217] border border-white/10 rounded-xl p-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Globe size={18} className="text-indigo-400" /> Third-Party Interconnections
                        </h3>
                        {masData.risk_summary && (
                            <div className="flex gap-2">
                                <span className="text-[10px] bg-emerald-900/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                                    Low: {masData.risk_summary.low?.length || 0}
                                </span>
                                <span className="text-[10px] bg-amber-900/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                                    Med: {masData.risk_summary.medium?.length || 0}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="space-y-3">
                        {integrations.map((integration, idx) => (
                            <IntegrationRow key={idx} item={integration} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENT: Compliance Trend Chart ---
const ComplianceTrendChart = memo(() => {
    const { history, metadata } = useData();
    const [chartView, setChartView] = useState('area');
    const targetThreshold = parseFloat(metadata?.impact_thresholds?.min || 90);

    const chartData = useMemo(() => {
        if (!history || history.length === 0) return [];
        return [...history]
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .map(item => ({
                ...item,
                displayDate: new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                rate: parseFloat(item.compliance_rate || 0),
                passCount: parseInt(item.passed || 0),
                failCount: parseInt(item.failed || 0)
            }));
    }, [history]);

    const ChartComponent = chartView === 'bar' ? RechartsBarChart : AreaChart;

    if (chartData.length === 0) return null;

    const minRate = Math.min(...chartData.map(d => d.rate));
    const yDomainMin = Math.max(0, Math.floor(minRate - 5));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const isPassing = data.rate >= targetThreshold;
            return (
                <div className="bg-[#18181b] border border-gray-700 p-3 rounded-lg shadow-xl text-xs">
                    <p className="text-gray-400 font-mono mb-2">{new Date(data.timestamp).toLocaleString()}</p>
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${isPassing ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="text-white font-bold text-lg">{data.rate}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 text-[10px] text-gray-500 uppercase tracking-wider">
                        <div>Pass: <span className="text-emerald-400">{data.passCount}</span></div>
                        <div>Fail: <span className="text-rose-400">{data.failCount}</span></div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md flex flex-col h-96">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-400" />
                        Compliance Trend Analysis
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Rolling validation velocity (Last {chartData.length} runs)</p>
                </div>
                <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                    {['area', 'bar'].map(type => (
                        <button
                            key={type}
                            onClick={() => setChartView(type)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${chartView === type
                                ? 'bg-gray-700 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ChartComponent data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="trustGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="displayDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
                            minTickGap={30}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
                            domain={[yDomainMin, 100]}
                            tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <ReferenceLine
                            y={targetThreshold}
                            stroke="#f59e0b"
                            strokeDasharray="4 4"
                            label={{ value: 'Target', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
                        />

                        {chartView === 'bar' ? (
                            <Bar dataKey="rate" radius={[4, 4, 0, 0]} barSize={8}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.rate >= targetThreshold ? '#10b981' : '#f43f5e'} />
                                ))}
                            </Bar>
                        ) : (
                            <Area
                                type="monotone"
                                dataKey="rate"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fill="url(#trustGradient)"
                                activeDot={{ r: 6, strokeWidth: 4, fill: '#1f2937', stroke: '#3b82f6' }}
                            />
                        )}
                    </ChartComponent>
                </ResponsiveContainer>
            </div>
        </div>
    );
});

export const TrustCenterView = () => {
    const { isAuthenticated, user } = useAuth();
    const { openModal } = useModal();
    const { status } = useSystemStatus();
    const { history, ksis } = useData();
    const [nextReportDate, setNextReportDate] = useState(null);
    const [scnHistory, setScnHistory] = useState([]);

    // --- LIVE METRICS ---
    const uptime = status?.uptime_percent ? `${parseFloat(status.uptime_percent).toFixed(2)}%` : '99.99%';
    const latency = status?.avg_latency || '24ms';
    const totalRequests = status?.total_requests || '1.2k';
    const errorCount = parseInt(status?.['5xx_requests'] || '0');
    const isHealthy = status && errorCount === 0;
    const healthLabel = isHealthy ? 'Operational' : (status ? 'Issues Detected' : 'Checking...');

    useEffect(() => {
        const fetchData = async () => {
            const timestamp = Date.now();
            try {
                const res = await fetch(`${BASE_PATH}next_report_date.json?t=${timestamp}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.next_ongoing_report) setNextReportDate(new Date(data.next_ongoing_report));
                }
            } catch (e) {
                const now = new Date();
                const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
                const currentYear = now.getFullYear();
                const quarterEndMonth = currentQuarter * 3;
                const reportYear = quarterEndMonth === 12 ? currentYear + 1 : currentYear;
                setNextReportDate(new Date(reportYear, quarterEndMonth === 12 ? 0 : quarterEndMonth, 15));
            }

            try {
                const res = await fetch(`${BASE_PATH}scn_history.jsonl?t=${timestamp}`);
                if (res.ok) {
                    const text = await res.text();
                    if (text.trim().startsWith('<')) throw new Error("File missing or invalid");
                    let parsed = [];
                    try {
                        const json = JSON.parse(text);
                        parsed = Array.isArray(json) ? json : [json];
                    } catch {
                        parsed = text.split('\n')
                            .filter(line => line.trim() !== '')
                            .map(line => { try { return JSON.parse(line); } catch { return null; } })
                            .filter(item => item !== null);
                    }
                    const sorted = parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
                    setScnHistory(sorted);
                }
            } catch (e) { console.warn("SCN History unavailable"); }
        };
        fetchData();
    }, []);

    const handleAction = (actionName) => {
        if (!isAuthenticated) {
            openModal('accessRequired', {
                featureName: actionName,
                benefits: ['Download machine-readable OSCAL JSON', 'Access automated validation results', 'View VDR vulnerability data', 'Register for Quarterly Reviews']
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
            if (!res.ok) throw new Error('Failed');
            const text = await res.text();
            openModal('markdown', { title: 'FedRAMP 20x Secure Configuration', subtitle: 'Automated Baseline Checks', markdown: text });
        } catch (e) { alert('Failed to load secure configuration.'); }
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
    const handleFeedback = () => { if (!handleAction('Submit Agency Feedback')) return; window.location.href = `mailto:fedramp_20x@meridianks.com?subject=Feedback&body=Feedback`; };
    const handleReviewRegistration = () => { if (!handleAction('Register for Quarterly Review')) return; window.location.href = `mailto:fedramp_20x@meridianks.com?subject=Review&body=Registration`; };

    return (
        <div className="-m-6 md:-m-8 min-h-screen bg-[#09090b] text-slate-300 font-sans selection:bg-blue-500/30 relative">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

            <div className="relative z-10 px-6 md:px-8 py-8 space-y-8 max-w-7xl mx-auto">

                {/* --- 1. HERO HEADER --- */}
                <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-8 relative overflow-hidden shadow-2xl`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-60" />
                    <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none"><Landmark size={250} /></div>
                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="relative w-24 h-24 rounded-2xl bg-[#0f172a] border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden group p-4">
                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <img src={`${BASE_PATH}meridian-favicon.png`} alt="Meridian LMS" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                <div className="fallback-icon hidden absolute inset-0 items-center justify-center"><Shield size={40} className="text-blue-500" /></div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">FedRAMP Trust Center</h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                        <div className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></div>
                                        <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">{healthLabel}</span>
                                    </div>
                                    <span className="text-slate-500 font-mono text-xs">Build 2025.09A</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-[#09090b]/50 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
                            <TelemetryItem label="Uptime" value={uptime} icon={<Activity size={14} className="text-emerald-400" />} />
                            <div className="w-px h-8 bg-white/10 mx-1" />
                            <TelemetryItem label="Latency" value={latency} icon={<Zap size={14} className="text-amber-400" />} />
                            <div className="w-px h-8 bg-white/10 mx-1" />
                            <TelemetryItem label="Req/Hr" value={totalRequests} icon={<Globe size={14} className="text-blue-400" />} />
                        </div>
                    </div>
                </div>

                {/* --- 2. SERVICE PROFILE --- */}
                <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-8 shadow-lg`}>
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                        <Server size={20} className="text-indigo-400" />
                        <h2 className="text-lg font-bold text-white">Service Profile</h2>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1">
                            <p className="text-slate-400 leading-relaxed mb-6 font-medium text-sm">
                                <strong className="text-white">Meridian Learning Management System (LMS) for Government</strong> is a FedRAMP Authorized Software-as-a-Service (SaaS) hosted on AWS GovCloud (US). The system leverages automated 20x validation for continuous authorization.
                            </p>
                            <div className="flex gap-2">
                                {['LMS', 'SaaS', 'GovCloud'].map(tag => (
                                    <span key={tag} className="text-[10px] bg-white/5 text-slate-300 border border-white/10 px-2 py-1 rounded font-mono uppercase tracking-wider">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 lg:w-[500px]">
                            <InfoCard label="Deployment" value="Multi-tenant SaaS" sub="Shared Infrastructure" />
                            <InfoCard label="Cloud Provider" value="AWS" sub="US-East-1" />
                            <InfoCard label="Auth Level" value="FedRAMP Moderate" sub="IaaS/PaaS" />
                            <InfoCard label="Access" value="HTTPS" sub="Port 443" />
                        </div>
                    </div>
                </div>

                {/* --- 3. LIVE SYSTEM BOUNDARY (Dynamic MAS Dashboard) --- */}
                <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-6 shadow-md`}>
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Shield size={24} className="text-green-400" />
                            Live System Boundary (MAS)
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                            Real-time architectural validation against FedRAMP Moderate baseline.
                            Data is sourced directly from the <code className="text-xs bg-black/30 px-1 py-0.5 rounded text-blue-300">mas_boundary.json</code> artifact generated by the infrastructure pipeline.
                        </p>
                    </div>

                    {/* The New Dynamic Dashboard */}
                    <LiveMasDashboard />
                </div>

                {/* --- 4. AUTHORIZED SERVICES GRID --- */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Layers size={20} className="text-blue-400" /> Authorized Services
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <ServiceCard title="Course Management" icon={Layers} desc="SCORM/AICC/xAPI delivery & multimedia." features={["Course catalog", "Mobile player", "Video delivery"]} />
                        <ServiceCard title="User Management" icon={Users} desc="SSO, RBAC, and hierarchy management." features={["SAML 2.0 SSO", "MFA Support", "Role hierarchy"]} />
                        <ServiceCard title="Assessment Engine" icon={FileText} desc="Quizzes, exams, and competency validation." features={["Auto-grading", "Question banks", "Certificates"]} />
                        <ServiceCard title="Compliance Tracking" icon={Shield} desc="Regulatory reporting and audit trails." features={["Rules engine", "21 CFR Part 11", "Audit logs"]} />
                        <ServiceCard title="Analytics" icon={BarChart} desc="Real-time dashboards and data exports." features={["Custom reports", "Trend analysis", "Scheduled exports"]} />
                        <ServiceCard title="Learning Record Store" icon={Database} desc="Native xAPI-compliant LRS." features={["Statement capture", "Learning analytics", "Cross-platform"]} />
                        <ServiceCard title="Career Development" icon={BookOpen} desc="IDP and skills gap analysis." features={["Career paths", "Skills inventory", "IDP tracking"]} />
                        <ServiceCard title="Notifications" icon={Bell} desc="Automated engagement engine." features={["Deadline alerts", "Manager notifications", "Templates"]} />
                        <ServiceCard title="API Gateway" icon={Code} desc="RESTful enterprise connectivity." features={["REST API", "Webhooks", "HRIS sync"]} />
                        <ServiceCard title="Content Authoring" icon={FileText} desc="Built-in creation tools." features={["Course builder", "Version control", "Templates"]} />
                        <ServiceCard title="Admin Console" icon={Settings} desc="System configuration and oversight." features={["Bulk ops", "System health", "Configuration"]} />
                    </div>
                </div>

                {/* --- 5. EXCLUDED SERVICES --- */}
                <div className="bg-[#1a1212] border border-rose-500/20 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start">
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
                                <li><strong>Native Mobile:</strong> Only web-responsive auth'd.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* --- 6. ACTION DECK --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Auth Package */}
                    <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-8 flex flex-col justify-between shadow-lg relative overflow-hidden group`}>
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Shield size={140} /></div>
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/10"><FileJson size={24} /></div>
                                <div><h3 className="text-xl font-bold text-white">Authorization Data</h3><div className="text-xs text-slate-400">Machine-Readable Artifacts</div></div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-8">
                                <ArtifactBadge label="Machine Readable" /><ArtifactBadge label="Continuous Validation" /><ArtifactBadge label="Automated Evidence" /><ArtifactBadge label="OSCAL Ready" />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleDownloadPackage} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20">
                                {isAuthenticated ? <Download size={18} /> : <Lock size={18} />} Download JSON
                            </button>
                        </div>
                    </div>

                    {/* Continuous Monitoring */}
                    <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-8 flex flex-col justify-between shadow-lg`}>
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"><Activity size={24} /></div>
                                <div><h3 className="text-xl font-bold text-white">Continuous Monitoring</h3><div className="text-xs text-slate-400">Real-time Compliance Tracking</div></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-[#09090b] p-4 rounded-xl border border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Next Snapshot</div>
                                    <div className="text-blue-400 font-bold text-lg flex items-center gap-2"><Clock size={16} />{nextReportDate ? nextReportDate.toLocaleDateString() : '...'}</div>
                                </div>
                                <div className="bg-[#09090b] p-4 rounded-xl border border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Validation</div>
                                    <div className="text-emerald-400 font-bold text-lg flex items-center gap-2"><CheckCircle2 size={16} /> Passing</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-3">
                                <button onClick={viewQuarterlyReport} className="flex-1 py-3.5 bg-[#18181b] hover:bg-[#202025] text-slate-200 font-bold rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2 text-sm"><FileText size={16} /> View Report</button>
                                <button onClick={downloadQuarterlyReport} className="px-5 py-3.5 bg-[#18181b] hover:bg-[#202025] text-slate-200 rounded-xl border border-white/5 transition-all" title="Download JSON"><Download size={18} /></button>
                            </div>
                            <div className="pt-4 border-t border-white/5 flex gap-3">
                                <button onClick={handleReviewRegistration} className="flex-1 py-2.5 px-4 bg-[#18181b] hover:bg-[#202025] text-slate-300 hover:text-white font-medium rounded-lg border border-white/5 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"><Users size={14} /> Register for Review</button>
                                <button onClick={handleFeedback} className="flex-1 py-2.5 px-4 bg-[#18181b] hover:bg-[#202025] text-slate-300 hover:text-white font-medium rounded-lg border border-white/5 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"><MessageSquare size={14} /> Feedback</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 7. COMPLIANCE TREND CHART --- */}
                <ComplianceTrendChart />

                {/* --- 8. SCN LOG --- */}
                <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-8 shadow-md`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <GitCommit size={22} className="text-purple-400" /> Infrastructure Change Log
                            </h3>
                            <div className="text-xs text-slate-500 mt-1 font-mono">RFC-0007 Significant Change Notification (SCN) History</div>
                        </div>
                        {scnHistory.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                <div className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></div>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active</span>
                            </div>
                        )}
                    </div>
                    <div className="overflow-hidden rounded-xl border border-white/5 bg-[#09090b]">
                        {scnHistory.length === 0 ? (
                            <div className="p-8 text-center text-slate-600 text-sm italic">Waiting for change detection data...</div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                                        <th className="p-4 font-bold">Date</th>
                                        <th className="p-4 font-bold">Change ID</th>
                                        <th className="p-4 font-bold">Class</th>
                                        <th className="p-4 font-bold">Scope</th>
                                        <th className="p-4 font-bold text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm font-mono">
                                    {scnHistory.map((entry, index) => (
                                        <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4 text-slate-300">{new Date(entry.timestamp).toLocaleDateString()}</td>
                                            <td className="p-4 text-xs text-blue-400">{entry.change_id}</td>
                                            <td className="p-4"><ClassificationBadge type={entry.classification} label={entry.description} /></td>
                                            <td className="p-4 text-xs text-slate-500">{entry.affected_component_count} Components</td>
                                            <td className="p-4 text-right"><span className="text-[10px] text-emerald-500 font-bold border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded">APPLIED</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* --- 9. FOOTER LINKS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
                    <FooterAction icon={<Code />} title="API Docs" onClick={openApiDocs} />
                    <FooterAction icon={<Settings />} title="Secure Config" onClick={viewSecureConfig} />
                    <FooterAction icon={<Mail />} title="Support" onClick={() => window.location.href = 'mailto:support@meridianks.com'} />
                </div>
            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const TelemetryItem = ({ label, value, icon }) => (
    <div className="flex items-center gap-3 px-4 py-1.5">
        {icon}
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

const ServiceCard = ({ title, desc, features, icon: Icon }) => (
    <div className={`${THEME.panel} border ${THEME.border} p-5 rounded-xl hover:border-blue-500/30 hover:bg-[#18181b] transition-all group flex flex-col h-full cursor-default`}>
        <div className="flex justify-between items-start mb-3">
            <div className="p-2 rounded-lg bg-[#09090b] text-blue-400 group-hover:text-white group-hover:bg-blue-600 transition-colors border border-white/5">
                {Icon && <Icon size={18} />}
            </div>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">Auth</span>
        </div>
        <h4 className="font-bold text-white mb-1 text-sm">{title}</h4>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed line-clamp-2">{desc}</p>
        <div className="space-y-1.5 flex-1">
            {features && features.slice(0, 3).map((f, i) => (
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
        <Hash size={10} className="text-blue-500" /> {label}
    </div>
);

const ClassificationBadge = ({ type, label }) => {
    let styles = "bg-slate-800 text-slate-300 border-slate-700";
    let Icon = GitCommit;

    if (type === 'routine_recurring') { styles = "bg-blue-500/10 text-blue-400 border-blue-500/20"; Icon = RefreshCw; }
    else if (type === 'adaptive') { styles = "bg-purple-500/10 text-purple-400 border-purple-500/20"; Icon = Zap; }
    else if (type === 'transformative') { styles = "bg-orange-500/10 text-orange-400 border-orange-500/20"; Icon = AlertTriangle; }

    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${styles}`}>
            <Icon size={10} /> {label || type?.replace('_', ' ')}
        </div>
    );
};

const FooterAction = ({ icon, title, onClick }) => (
    <button onClick={onClick} className={`${THEME.panel} border ${THEME.border} hover:bg-[#18181b] hover:border-white/10 p-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-all group`}>
        <span className="text-slate-500 group-hover:text-blue-400 transition-colors">{React.cloneElement(icon, { size: 16 })}</span>
        {title}
    </button>
);