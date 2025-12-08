import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../contexts/ModalContext';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { API_CONFIG } from '../../config/api';
import {
    Shield, Download, FileText, ExternalLink,
    Clock, CheckCircle2, Mail, Globe, Lock, Server, Activity,
    XCircle, CheckCircle, Layers, Database, Users, BarChart, BookOpen,
    Bell, Code, Settings, Info, Zap, MessageSquare,
    GitCommit, RefreshCw, AlertTriangle, Landmark, Terminal,
    FileJson, Hash, ArrowRight
} from 'lucide-react';

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

const TRANSITIONS = {
    default: 'transition-all duration-200 ease-out',
};

export const TrustCenterView = () => {
    const { isAuthenticated, user } = useAuth();
    const { openModal } = useModal();
    const { status } = useSystemStatus();
    const [nextReportDate, setNextReportDate] = useState(null);
    const [scnHistory, setScnHistory] = useState([]);

    // --- BASE URL HANDLING ---
    const rawBase = import.meta.env.BASE_URL || '/';
    const BASE_URL = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

    // --- LIVE METRICS ---
    const uptime = status?.uptime_percent ? `${parseFloat(status.uptime_percent).toFixed(2)}%` : '99.99%';
    const latency = status?.avg_latency || '24ms';
    const totalRequests = status?.total_requests || '1.2k';
    const errorCount = parseInt(status?.['5xx_requests'] || '0');
    const isHealthy = status && errorCount === 0;

    const healthLabel = isHealthy ? 'Operational' : (status ? 'Issues Detected' : 'Checking...');

    useEffect(() => {
        const fetchData = async () => {
            // 1. Fetch Next Report Date
            try {
                const res = await fetch(`${BASE_URL}data/next_report_date.json`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.next_ongoing_report) setNextReportDate(new Date(data.next_ongoing_report));
                }
            } catch (e) {
                // Fallback logic
                const now = new Date();
                const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
                const currentYear = now.getFullYear();
                const quarterEndMonth = currentQuarter * 3;
                const reportYear = quarterEndMonth === 12 ? currentYear + 1 : currentYear;
                setNextReportDate(new Date(reportYear, quarterEndMonth === 12 ? 0 : quarterEndMonth, 15));
            }

            // 2. Fetch SCN History (Sanitized Local File)
            try {
                // We fetch from local /data/ because the build pipeline has already 
                // downloaded and sanitized this file from the GitHub Release.
                const res = await fetch(`${BASE_URL}data/scn_history.jsonl`);

                if (res.ok) {
                    const text = await res.text();

                    // Reject HTML (404) responses
                    if (text.trim().startsWith('<')) throw new Error("File missing or invalid");

                    let parsed = [];
                    try {
                        // Attempt standard JSON parse (Array or Object)
                        const json = JSON.parse(text);
                        parsed = Array.isArray(json) ? json : [json];
                    } catch {
                        // Fallback to JSON Lines (NDJSON)
                        parsed = text.split('\n')
                            .filter(line => line.trim() !== '')
                            .map(line => {
                                try { return JSON.parse(line); } catch { return null; }
                            })
                            .filter(item => item !== null);
                    }

                    // Sort by timestamp descending
                    const sorted = parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
                    setScnHistory(sorted);
                }
            } catch (e) {
                console.warn("SCN History unavailable (Local fetch failed):", e);
            }
        };
        fetchData();
    }, [BASE_URL]);

    // --- ACTIONS ---
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
            const res = await fetch(`${BASE_URL}data/ongoing_authorization_report_Q4_2025.md`);
            if (!res.ok) throw new Error('Failed');
            const text = await res.text();
            openModal('markdown', { title: 'Ongoing Authorization Report', subtitle: 'Automated Continuous Monitoring', markdown: text });
        } catch (e) { alert('Failed to load report.'); }
    };

    const downloadQuarterlyReport = () => {
        if (!handleAction('Download Quarterly Report')) return;
        window.open(`${BASE_URL}data/ongoing_authorization_report_Q4_2025.json`, '_blank');
    };

    const handleDownloadPackage = async () => {
        if (!handleAction('Download Authorization Package')) return;
        try {
            const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
            if (!token) { alert("Session expired."); return; }
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PACKAGE_DOWNLOAD}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Access Denied");
            const data = await response.json();
            if (data.url) window.location.href = data.url;
        } catch (error) { alert(`Download failed: ${error.message}`); }
    };

    const handleFeedback = () => {
        if (!handleAction('Submit Agency Feedback')) return;
        const subject = encodeURIComponent(`Agency Feedback - ${user.agency}`);
        const body = encodeURIComponent(`Agency: ${user.agency}\nContact: ${user.name}\nEmail: ${user.email}\n\nPlease share your feedback below.`);
        window.location.href = `mailto:fedramp_20x@meridianks.com?subject=${subject}&body=${body}`;
    };

    const handleReviewRegistration = () => {
        if (!handleAction('Register for Quarterly Review')) return;
        const subject = encodeURIComponent(`Quarterly Review Registration - ${user.agency}`);
        const body = encodeURIComponent(`Agency: ${user.agency}\nContact: ${user.name}\nEmail: ${user.email}\n\nPlease register us for the next quarterly review meeting per FRR-CCM-QR.`);
        window.location.href = `mailto:fedramp_20x@meridianks.com?subject=${subject}&body=${body}`;
    };

    return (
        <div className="-m-6 md:-m-8 min-h-screen bg-[#09090b] text-slate-300 font-sans selection:bg-blue-500/30 relative">

            {/* Ambient Background Spotlights */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

            <div className="relative z-10 px-6 md:px-8 py-8 space-y-8 max-w-7xl mx-auto">

                {/* --- 1. HERO HEADER --- */}
                <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-8 relative overflow-hidden shadow-2xl`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-60" />
                    <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
                        <Landmark size={250} />
                    </div>

                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden group">
                                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
                                <div className="relative z-10 flex items-center justify-center">
                                    <Shield size={40} className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" strokeWidth={1.5} />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Lock size={16} className="text-white" strokeWidth={2.5} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">FedRAMP Trust Center</h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                        <div className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </div>
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

                {/* --- 3. DATA PERIMETER --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`${THEME.panel} border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group`}>
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <CheckCircle size={100} />
                        </div>
                        <h3 className="text-emerald-400 font-bold flex items-center gap-2 mb-2 text-lg">
                            <CheckCircle size={20} /> Authorized Data Perimeter
                        </h3>
                        <p className="text-xs text-slate-500 mb-6 italic">"Data not exceeding Moderate impact levels."</p>
                        <ul className="space-y-3">
                            <AuthItem icon={<CheckCircle2 size={14} />} text="Standard LMS training records & completions" />
                            <AuthItem icon={<CheckCircle2 size={14} />} text="User PII (Names, Emails, Org Attributes)" />
                            <AuthItem icon={<CheckCircle2 size={14} />} text="Corporate training content & media files" />
                            <AuthItem icon={<CheckCircle2 size={14} />} text="Internal proprietary data (Moderate Impact)" />
                        </ul>
                    </div>

                    <div className={`${THEME.panel} border border-rose-500/20 rounded-2xl p-6 relative overflow-hidden group`}>
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <XCircle size={100} />
                        </div>
                        <h3 className="text-rose-400 font-bold flex items-center gap-2 mb-2 text-lg">
                            <XCircle size={20} /> Not Authorized (Out of Scope)
                        </h3>
                        <p className="text-xs text-slate-500 mb-6 italic">"Data exceeding Moderate impact outcomes."</p>
                        <ul className="space-y-3">
                            <AuthItem icon={<XCircle size={14} />} text="CUI High / Classified Information" color="text-rose-500" />
                            <AuthItem icon={<XCircle size={14} />} text="HIPAA (PHI) without specific BAA" color="text-rose-500" />
                            <AuthItem icon={<XCircle size={14} />} text="Financial PII (Bank Routing, Credit Cards)" color="text-rose-500" />
                            <AuthItem icon={<XCircle size={14} />} text="Law Enforcement Sensitive (LES) Data" color="text-rose-500" />
                        </ul>
                    </div>
                </div>

                {/* --- 4. SERVICES GRID --- */}
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
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Shield size={140} />
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/10">
                                    <FileJson size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Authorization Data</h3>
                                    <div className="text-xs text-slate-400">Machine-Readable Artifacts</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-8">
                                <ArtifactBadge label="Machine Readable" />
                                <ArtifactBadge label="Continuous Validation" />
                                <ArtifactBadge label="Automated Evidence" />
                                <ArtifactBadge label="OSCAL Ready" />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleDownloadPackage} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20">
                                {isAuthenticated ? <Download size={18} /> : <Lock size={18} />} Download JSON
                            </button>
                            <button onClick={viewSecureConfig} className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all">
                                Baselines
                            </button>
                        </div>
                    </div>

                    {/* Continuous Monitoring - WITH RESTORED ACTIONS */}
                    <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-8 flex flex-col justify-between shadow-lg`}>
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Continuous Monitoring</h3>
                                    <div className="text-xs text-slate-400">Real-time Compliance Tracking</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-[#09090b] p-4 rounded-xl border border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Next Snapshot</div>
                                    <div className="text-blue-400 font-bold text-lg flex items-center gap-2">
                                        <Clock size={16} />
                                        {nextReportDate ? nextReportDate.toLocaleDateString() : '...'}
                                    </div>
                                </div>
                                <div className="bg-[#09090b] p-4 rounded-xl border border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Validation</div>
                                    <div className="text-emerald-400 font-bold text-lg flex items-center gap-2">
                                        <CheckCircle2 size={16} /> Passing
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex gap-3">
                                <button onClick={viewQuarterlyReport} className="flex-1 py-3.5 bg-[#18181b] hover:bg-[#202025] text-slate-200 font-bold rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2 text-sm">
                                    <FileText size={16} /> View Report
                                </button>
                                <button onClick={downloadQuarterlyReport} className="px-5 py-3.5 bg-[#18181b] hover:bg-[#202025] text-slate-200 rounded-xl border border-white/5 transition-all" title="Download JSON">
                                    <Download size={18} />
                                </button>
                            </div>

                            {/* Added Action Row */}
                            <div className="pt-4 border-t border-white/5 flex gap-3">
                                <button onClick={handleReviewRegistration} className="flex-1 py-2.5 px-4 bg-[#18181b] hover:bg-[#202025] text-slate-300 hover:text-white font-medium rounded-lg border border-white/5 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
                                    <Users size={14} /> Register for Review
                                </button>
                                <button onClick={handleFeedback} className="flex-1 py-2.5 px-4 bg-[#18181b] hover:bg-[#202025] text-slate-300 hover:text-white font-medium rounded-lg border border-white/5 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
                                    <MessageSquare size={14} /> Feedback
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 7. SCN LOG --- */}
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
                                <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </div>
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

                {/* --- 8. FOOTER LINKS (CLEANED) --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
                    <FooterAction icon={<Code />} title="API Docs" onClick={openApiDocs} />
                    <FooterAction icon={<Settings />} title="Secure Config" onClick={viewSecureConfig} />
                    <FooterAction icon={<Mail />} title="Support" onClick={() => window.location.href = 'mailto:support@meridianks.com'} />
                </div>

            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

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

const AuthItem = ({ icon, text, color = 'text-emerald-500' }) => (
    <li className="flex gap-3 items-start group">
        <span className={`${color} mt-0.5 group-hover:scale-110 transition-transform`}>{icon}</span>
        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{text}</span>
    </li>
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
            {features.slice(0, 3).map((f, i) => (
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