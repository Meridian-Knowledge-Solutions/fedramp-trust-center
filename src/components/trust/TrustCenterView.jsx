import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
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
    PieChart, Layout, Monitor, HardDrive, Ticket, AlertCircle, Calendar, Video,
    ArrowRight, User, ShieldCheck, Send, Eye as EyeIcon
} from 'lucide-react';
// Recharts imports removed — charts now in UnifiedMasDashboard

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

// --- SUB-COMPONENT: Change Pipeline (Live SCN Tracking) ---
const PlannedChangesSection = ({ scnHistory }) => {
    // Filter for upcoming or recently initiated changes if available, 
    // otherwise show the most recent significant activity.
    const displayChanges = scnHistory?.slice(0, 4) || [];

    const getImpactStyles = (impact) => {
        const type = impact?.toLowerCase();
        if (type === 'transformative') return 'border-l-rose-500 bg-rose-500/5';
        if (type === 'adaptive') return 'border-l-blue-500 bg-blue-500/5';
        return 'border-l-emerald-500 bg-emerald-500/5';
    };

    return (
        <div className="bg-[#121217] rounded-[2rem] border border-white/5 p-8 h-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                        <Activity className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Change Pipeline</h3>
                        <p className="text-[10px] text-slate-500 font-medium">LIVE SCN TRACKING</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                    <span className="text-[10px] font-mono text-emerald-400 tracking-tighter">FRR-SCN COMPLIANT</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayChanges.length > 0 ? displayChanges.map((change, idx) => (
                    <div key={idx} className={`p-5 rounded-2xl border border-white/5 border-l-2 ${getImpactStyles(change.classification)} hover:bg-white/[0.04] transition-colors`}>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                {change.change_id}
                            </p>
                            <span className="text-[8px] font-mono text-slate-500">
                                {new Date(change.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-xs font-bold text-slate-200 line-clamp-1">{change.description || 'Infrastructure Update'}</p>
                        <div className="mt-3 flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${change.classification === 'transformative' ? 'bg-rose-500' :
                                    change.classification === 'adaptive' ? 'bg-blue-500' : 'bg-emerald-500'
                                }`} />
                            <span className="text-[10px] uppercase font-bold text-slate-400 italic">
                                {change.classification?.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                        <p className="text-xs text-slate-500 italic">No active SCN flows detected in pipeline.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Quarterly Review Card ---
const QuarterlyReviewCard = ({ meeting }) => {
    if (!meeting) return null;

    // Dynamically resolve the path based on the environment BASE_URL to prevent GitHub Pages 404s
    const reportsPath = import.meta.env.BASE_URL.endsWith('/')
        ? `${import.meta.env.BASE_URL}reports/`
        : `${import.meta.env.BASE_URL}/reports/`;

    const downloadICS = () => {
        const icsContent = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
            `SUMMARY:${meeting.meetingTitle || 'FedRAMP Quarterly Review'}`,
            `DTSTART:${(meeting.nextDate || '').replace(/-/g, '')}T190000Z`,
            `DURATION:PT${meeting.durationMinutes || 60}M`,
            `DESCRIPTION:${meeting.description || 'Synchronous review session.'}\\n\\nRegister: ${meeting.registrationUrl}`,
            `LOCATION:Microsoft Teams (Registration Required)`,
            'END:VEVENT', 'END:VCALENDAR'
        ].join('\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `FedRAMP_Review_${meeting.nextDate}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-500/10 relative overflow-hidden h-full">
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Synchronous Review</span>
                            <h3 className="text-xl font-bold mt-1 tracking-tight">Quarterly Session</h3>
                        </div>
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                            <Video className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Target Review Date</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black font-mono tracking-tighter">{meeting.nextDate || 'TBD'}</span>
                            <span className="text-indigo-200 text-sm font-semibold">{meeting.time || '14:00 EST'}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Primary Link: Grouped with governance data to ensure context */}
                    <a href={`${reportsPath}QUARTERLY_AUTHORIZATION_REPORT.html`} target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-white text-indigo-600 rounded-2xl font-bold text-xs hover:bg-indigo-50 transition-all shadow-lg">
                        <FileText className="w-4 h-4" /> View Quarterly QAR 
                    </a>

                    <a href={meeting.registrationUrl || '#'} target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-500 text-white rounded-2xl font-bold text-xs hover:bg-indigo-400 transition-all border border-indigo-400">
                        <Video className="w-4 h-4" /> Register for Session 
                    </a>

                    <button onClick={downloadICS}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-700/40 text-indigo-100 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-colors border border-indigo-400/20">
                        <Download className="w-3.5 h-3.5" /> Add to Calendar
                    </button>
                </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
        </div>
    );
};

// --- SUB-COMPONENT: Ongoing Authorization Report Card ---
const OngoingAuthorizationReportCard = () => {
    const reportsPath = import.meta.env.BASE_URL.endsWith('/')
        ? `${import.meta.env.BASE_URL}reports/`
        : `${import.meta.env.BASE_URL}/reports/`;

    // Calculate next OAR date (dynamically based on quarterly schedule: Feb 15, May 15, Aug 15, Nov 15)
    const getNextOARDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 0-indexed
        
        const oarMonths = [2, 5, 8, 11]; // Feb, May, Aug, Nov
        const nextMonth = oarMonths.find(m => m > month) || oarMonths[0];
        const nextYear = nextMonth > month ? year : year + 1;
        
        return `${nextYear}-${String(nextMonth).padStart(2, '0')}-15`;
    };

    return (
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-500/10 relative overflow-hidden h-full">
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Continuous Monitoring</span>
                            <h3 className="text-xl font-bold mt-1 tracking-tight">Ongoing Authorization</h3>
                        </div>
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-1">Next Report Date</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black font-mono tracking-tighter">{getNextOARDate()}</span>
                        </div>
                        <p className="text-emerald-100 text-xs mt-2 font-medium">Quarterly cycle: Feb 15, May 15, Aug 15, Nov 15</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <a href={`${reportsPath}COMPLIANCE_VALIDATION_REPORT.html`} target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-white text-emerald-600 rounded-2xl font-bold text-xs hover:bg-emerald-50 transition-all shadow-lg">
                        <FileCheck className="w-4 h-4" /> View Latest OAR
                    </a>

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl py-2 border border-white/20">
                            <div className="text-lg font-black font-mono">100%</div>
                            <div className="text-[9px] uppercase tracking-wider text-emerald-100 font-bold">Compliance</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl py-2 border border-white/20">
                            <div className="text-lg font-black font-mono">0</div>
                            <div className="text-[9px] uppercase tracking-wider text-emerald-100 font-bold">Gaps</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl py-2 border border-white/20">
                            <div className="text-lg font-black font-mono">101</div>
                            <div className="text-[9px] uppercase tracking-wider text-emerald-100 font-bold">Days</div>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
                        <div className="text-[9px] uppercase tracking-wider text-emerald-100 font-bold mb-2">Includes</div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-emerald-50">
                            <div className="flex items-center gap-1"><CheckSquare className="w-3 h-3" /> Accepted Vulns</div>
                            <div className="flex items-center gap-1"><CheckSquare className="w-3 h-3" /> Planned Changes</div>
                            <div className="flex items-center gap-1"><CheckSquare className="w-3 h-3" /> Recommendations</div>
                            <div className="flex items-center gap-1"><CheckSquare className="w-3 h-3" /> SCN Summary</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
        </div>
    );
};

// DriftAlert removed — now in UnifiedMasDashboard

// SystemCompositionChart removed — now in UnifiedMasDashboard

// DriftHistoryChart removed — now in UnifiedMasDashboard

// =========================================================================
// ENHANCED DATA FLOW VISUALIZATION
// n8n/Customer.io inspired pipeline of federal data lifecycle
// =========================================================================

const FLOW_NODE_THEMES = {
    entry:         { accent: '#10b981', bg: 'bg-emerald-500/8',  border: 'border-emerald-500/25', text: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
    auth:          { accent: '#6366f1', bg: 'bg-indigo-500/8',   border: 'border-indigo-500/25',  text: 'text-indigo-400',  glow: 'shadow-indigo-500/10' },
    processing:    { accent: '#3b82f6', bg: 'bg-blue-500/8',     border: 'border-blue-500/25',    text: 'text-blue-400',    glow: 'shadow-blue-500/10' },
    storage:       { accent: '#8b5cf6', bg: 'bg-violet-500/8',   border: 'border-violet-500/25',  text: 'text-violet-400',  glow: 'shadow-violet-500/10' },
    dissemination: { accent: '#f59e0b', bg: 'bg-amber-500/8',    border: 'border-amber-500/25',   text: 'text-amber-400',   glow: 'shadow-amber-500/10' },
    monitoring:    { accent: '#ef4444', bg: 'bg-rose-500/8',     border: 'border-rose-500/25',    text: 'text-rose-400',    glow: 'shadow-rose-500/10' },
};

const FLOW_STAGES = [
    {
        id: 'entry', theme: 'entry', icon: User,
        title: 'Federal User Entry', subtitle: 'COLLECTED', omb: 'OMB A-130',
        description: 'Federal employee initiates access via HTTPS/TLS 1.2+ to Application Load Balancer',
        security: ['TLS 1.2+', 'PIV/CAC'], classification: 'Federal Collected',
        dataElements: ['Access Logs', 'Source IP', 'Session ID'],
        ksis: ['KSI-IAM-01', 'KSI-IAM-02', 'KSI-SVC-02'],
    },
    {
        id: 'auth', theme: 'auth', icon: ShieldCheck,
        title: 'Identity & Auth', subtitle: 'COLLECTED', omb: 'OMB A-130',
        description: 'Okta Federal Gov SAML 2.0 SSO with PIV/CAC certificate validation and MFA',
        security: ['SAML 2.0', 'FIPS 140-2'], classification: 'Federal Collected',
        dataElements: ['SAML Assertions', 'UPN Data', 'Group Memberships'],
        ksis: ['KSI-IAM-01', 'KSI-IAM-03', 'KSI-SVC-03'],
    },
    {
        id: 'processing', theme: 'processing', icon: Cpu,
        title: 'Application Processing', subtitle: 'PROCESSED', omb: 'OMB A-130',
        description: 'LMS Web UI (ASP.NET on EC2) processes training activity, assessments, and content delivery',
        security: ['WAF', 'HTTPS', 'RBAC'], classification: 'Federal Processed',
        dataElements: ['Training Records', 'Assessments', 'Completions'],
        ksis: ['KSI-SVC-01', 'KSI-SVC-02', 'KSI-MLA-01'],
    },
    {
        id: 'storage', theme: 'storage', icon: Database,
        title: 'Encrypted Storage', subtitle: 'MAINTAINED', omb: 'OMB A-130',
        description: 'Multi-service encrypted storage: RDS (SQL Server), S3, FSx with AES-256 and KMS',
        security: ['AES-256', 'KMS', 'Backups'], classification: 'Federal Maintained',
        dataElements: ['User Records', 'Learning Data', 'File Uploads', 'Audit Logs'],
        ksis: ['KSI-CNA-01', 'KSI-CNA-04', 'KSI-INR-01'],
    },
    {
        id: 'dissemination', theme: 'dissemination', icon: Send,
        title: 'Third-Party Dissemination', subtitle: 'DISSEMINATED', omb: 'OMB A-130',
        description: 'Federal PII shared with content providers via SAML SSO and xAPI/SCORM protocols',
        security: ['xAPI', 'SCORM', 'SAML SSO'], classification: 'Federal Disseminated',
        dataElements: ['Employee Names', 'Email', 'Learning Progress'],
        ksis: ['KSI-TPR-01', 'KSI-TPR-02', 'KSI-PIY-02'],
    },
    {
        id: 'monitoring', theme: 'monitoring', icon: EyeIcon,
        title: 'Security Monitoring', subtitle: 'MAINTAINED', omb: 'OMB A-130',
        description: 'CloudWatch, CloudTrail, GuardDuty, and Config provide continuous compliance monitoring',
        security: ['24/7', 'SIEM', 'Alerts'], classification: 'Federal Maintained',
        dataElements: ['CloudTrail Logs', 'Flow Logs', 'Config Snapshots'],
        ksis: ['KSI-MLA-01', 'KSI-MLA-02', 'KSI-CNA-07'],
    },
];

const PipelineConnector = ({ isVertical = false }) => (
    <div className={`flex items-center justify-center shrink-0 ${isVertical ? 'py-0.5 flex-col' : ''}`}>
        <div className={`relative ${isVertical ? 'h-6 w-px' : 'w-6 h-px'} bg-white/10`}>
            <div className={`absolute inset-0 ${isVertical
                ? 'bg-gradient-to-b from-blue-500/40 via-blue-400/20 to-transparent animate-pulse'
                : 'bg-gradient-to-r from-blue-500/40 via-blue-400/20 to-transparent animate-pulse'
                }`} style={{ animationDuration: '2s' }} />
        </div>
        <div className={isVertical ? 'rotate-90' : ''}>
            <ArrowRight size={10} className="text-blue-500/50" />
        </div>
    </div>
);

const FlowNode = memo(({ stage, isActive, onClick }) => {
    const theme = FLOW_NODE_THEMES[stage.theme];
    const Icon = stage.icon;

    return (
        <button
            onClick={() => onClick(stage.id)}
            className={`group relative text-left w-full transition-all duration-300 rounded-xl border min-w-0
                ${isActive
                    ? `${theme.border} ${theme.bg} shadow-lg ${theme.glow} ring-1 ring-white/10`
                    : 'border-white/[0.06] bg-[#141419] hover:border-white/15 hover:bg-white/[0.03]'
                }`}
        >
            <div className="absolute top-0 left-3 right-3 h-[2px] rounded-b-full opacity-60"
                style={{ backgroundColor: theme.accent }} />
            <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg border shrink-0 ${isActive ? theme.border : 'border-white/10'} ${isActive ? theme.bg : 'bg-white/[0.03]'} transition-colors`}>
                        <Icon size={16} className={isActive ? theme.text : 'text-slate-500'} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">{stage.subtitle}</div>
                        <h4 className="text-sm font-bold text-white leading-tight truncate">{stage.title}</h4>
                    </div>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400 mb-3 line-clamp-2">{stage.description}</p>
                <div className="flex flex-wrap gap-1.5">
                    {stage.security.map((badge, i) => (
                        <span key={i} className={`px-1.5 py-0.5 rounded text-[9px] font-bold border
                            ${isActive ? `${theme.bg} ${theme.text} ${theme.border}` : 'bg-white/[0.03] text-slate-500 border-white/[0.06]'
                            } transition-colors`}>
                            {badge}
                        </span>
                    ))}
                </div>
            </div>
        </button>
    );
});

const FlowDetailPanel = ({ stage }) => {
    if (!stage) return null;
    const theme = FLOW_NODE_THEMES[stage.theme];
    const Icon = stage.icon;

    return (
        <div className={`rounded-xl border ${theme.border} ${theme.bg} p-6 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-white/5 flex-wrap">
                <div className={`p-3 rounded-xl border ${theme.border} bg-black/20 shrink-0`}>
                    <Icon size={22} className={theme.text} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="text-lg font-bold text-white">{stage.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${theme.border} ${theme.text} uppercase tracking-wider`}>
                            {stage.classification}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400">{stage.description}</p>
                </div>
                <div className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5 shrink-0">
                    {stage.omb}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3 flex items-center gap-2">
                        <Database size={10} /> Data Elements
                    </div>
                    <div className="space-y-2">
                        {stage.dataElements.map((el, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                                <span className="text-xs text-slate-300 font-mono">{el}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3 flex items-center gap-2">
                        <Lock size={10} /> Security Controls
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {stage.security.map((s, i) => (
                            <span key={i} className={`px-2 py-1 rounded text-[10px] font-bold border ${theme.border} ${theme.text} ${theme.bg}`}>{s}</span>
                        ))}
                    </div>
                </div>
                <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3 flex items-center gap-2">
                        <Shield size={10} /> FedRAMP 20x KSIs
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {stage.ksis.map((ksi, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-mono font-bold">{ksi}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const FederalDataFlowPipeline = memo(() => {
    const [activeStage, setActiveStage] = useState(null);
    const handleNodeClick = (id) => setActiveStage(prev => prev === id ? null : id);
    const activeStageData = FLOW_STAGES.find(s => s.id === activeStage);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                        Federal Data Flow Pipeline
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                        Complete data lifecycle per OMB A-130 federal information classification. Click any stage to inspect.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-500 uppercase bg-white/5 px-2.5 py-1 rounded-full border border-white/5">OMB A-130</span>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">FRR-MAS</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                {Object.entries(FLOW_NODE_THEMES).map(([key, t]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }} />
                        <span className="text-[10px] text-slate-500 capitalize">{key}</span>
                    </div>
                ))}
            </div>

            {/* Row 1: Entry → Auth → Processing */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr,auto,1fr] gap-0 items-center">
                <FlowNode stage={FLOW_STAGES[0]} isActive={activeStage === FLOW_STAGES[0].id} onClick={handleNodeClick} />
                <div className="hidden md:flex"><PipelineConnector /></div>
                <div className="flex md:hidden justify-center"><PipelineConnector isVertical /></div>
                <FlowNode stage={FLOW_STAGES[1]} isActive={activeStage === FLOW_STAGES[1].id} onClick={handleNodeClick} />
                <div className="hidden md:flex"><PipelineConnector /></div>
                <div className="flex md:hidden justify-center"><PipelineConnector isVertical /></div>
                <FlowNode stage={FLOW_STAGES[2]} isActive={activeStage === FLOW_STAGES[2].id} onClick={handleNodeClick} />
            </div>

            {/* Connector between rows */}
            <div className="flex justify-center">
                <div className="flex flex-col items-center">
                    <div className="h-4 w-px bg-gradient-to-b from-blue-500/30 to-violet-500/30 animate-pulse" style={{ animationDuration: '2.5s' }} />
                    <div className="w-5 h-5 rounded-full border border-white/10 bg-[#141419] flex items-center justify-center">
                        <ArrowDown size={9} className="text-blue-400/60" />
                    </div>
                    <div className="h-4 w-px bg-gradient-to-b from-violet-500/30 to-amber-500/30 animate-pulse" style={{ animationDuration: '2.5s' }} />
                </div>
            </div>

            {/* Row 2: Storage → Dissemination → Monitoring */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr,auto,1fr] gap-0 items-center">
                <FlowNode stage={FLOW_STAGES[3]} isActive={activeStage === FLOW_STAGES[3].id} onClick={handleNodeClick} />
                <div className="hidden md:flex"><PipelineConnector /></div>
                <div className="flex md:hidden justify-center"><PipelineConnector isVertical /></div>
                <FlowNode stage={FLOW_STAGES[4]} isActive={activeStage === FLOW_STAGES[4].id} onClick={handleNodeClick} />
                <div className="hidden md:flex"><PipelineConnector /></div>
                <div className="flex md:hidden justify-center"><PipelineConnector isVertical /></div>
                <FlowNode stage={FLOW_STAGES[5]} isActive={activeStage === FLOW_STAGES[5].id} onClick={handleNodeClick} />
            </div>

            {activeStageData && <FlowDetailPanel stage={activeStageData} />}
        </div>
    );
});

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

// --- SUB-COMPONENT: Live MAS Dashboard (Slimmed — Data Flow + Integrations only) ---
const LiveMasDashboard = ({ boundary, architecture, history }) => {
    if (!boundary || !architecture) {
        return (
            <div className="p-8 text-center border border-white/10 rounded-xl bg-[#121217]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-white/5 rounded-full mb-4"></div>
                    <div className="h-4 w-48 bg-white/5 rounded mb-2"></div>
                    <div className="text-xs text-slate-500">Loading data flow context...</div>
                </div>
            </div>
        );
    }

    const { integrations } = architecture;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* ENHANCED DATA FLOW PIPELINE */}
            <FederalDataFlowPipeline />

            {/* THIRD-PARTY INTERCONNECTIONS */}
            {integrations && integrations.length > 0 && (
                <div className="bg-[#121217] border border-white/10 rounded-xl p-6 mt-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-white font-bold">Third-Party Interconnections</h3>
                            <p className="text-[10px] text-slate-500 mt-0.5">FRR-MAS-02 configuration and usage documentation</p>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 uppercase">
                            {integrations.length} Active
                        </span>
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

// ZoneCard removed — now in UnifiedMasDashboard

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
    const [plannedChanges, setPlannedChanges] = useState([]);
    const [meetingData, setMeetingData] = useState(null);
    const [loading, setLoading] = useState(true);

    const uptime = status?.uptime_percent ? `${parseFloat(status.uptime_percent).toFixed(2)}%` : '99.99%';
    const latency = status?.avg_latency || '24ms';
    const totalRequests = status?.total_requests || '1.2k';

    useEffect(() => {
        const fetchData = async () => {
            const ts = Date.now();
            try {
                const [boundRes, archRes, histRes, dateRes, plannedRes, meetingRes] = await Promise.all([
                    fetch(`${BASE_PATH}mas_boundary.json?t=${ts}`),
                    fetch(`${BASE_PATH}mas_architecture_map.json?t=${ts}`),
                    fetch(`${BASE_PATH}mas_history.jsonl?t=${ts}`),
                    fetch(`${BASE_PATH}next_report_date.json?t=${ts}`),
                    fetch(`${BASE_PATH}planned_changes.json?t=${ts}`),
                    fetch(`${BASE_PATH}quarterly_meetings.json?t=${ts}`)
                ]);

                // Try public_scn_history.jsonl first, fallback to scn_history.jsonl
                let scnRes = await fetch(`${BASE_PATH}public_scn_history.jsonl?t=${ts}`);
                if (!scnRes.ok) {
                    scnRes = await fetch(`${BASE_PATH}scn_history.jsonl?t=${ts}`);
                }

                if (boundRes.ok) setMasBoundary(await boundRes.json());
                if (archRes.ok) setMasArch(await archRes.json());
                if (plannedRes.ok) setPlannedChanges(await plannedRes.json());
                if (meetingRes.ok) setMeetingData(await meetingRes.json());

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

                {/* --- GOVERNANCE ROW --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    <div className="lg:col-span-1">
                        <QuarterlyReviewCard meeting={meetingData} />
                    </div>
                    <div className="lg:col-span-1">
                        <OngoingAuthorizationReportCard />
                    </div>
                    <div className="lg:col-span-1">
                        <PlannedChangesSection scnHistory={scnHistory} />
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
                <div className="grid grid-cols-1 gap-6 mt-8">
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

// ClassificationBadge removed — no longer used

const FooterAction = ({ title, onClick }) => (
    <button onClick={onClick} className={`${THEME.panel} border ${THEME.border} hover:bg-[#18181b] p-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-all group`}>
        {title}
    </button>
);
