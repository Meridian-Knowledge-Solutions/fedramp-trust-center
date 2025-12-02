import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../contexts/ModalContext';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { formatStatus } from '../../utils/formatStatus';
import { API_CONFIG } from '../../config/api';
import {
    Shield, Download, FileText, Calendar, ExternalLink,
    Clock, CheckCircle2, Mail, Phone, Globe, Lock, Server, Activity,
    XCircle, CheckCircle, Layers, Database, Users, BarChart, BookOpen,
    Bell, Code, Settings, Info, Terminal, FileJson, Zap, MessageSquare,
    GitCommit, RefreshCw, AlertTriangle, Landmark
} from 'lucide-react';

export const TrustCenterView = () => {
    const { isAuthenticated, user } = useAuth();
    const { openModal } = useModal();
    const { status } = useSystemStatus();
    // We don't need formatStatus anymore if we are using raw values
    const [nextReportDate, setNextReportDate] = useState(null);

    // --- FIX: SAFE BASE URL HANDLING ---
    const rawBase = import.meta.env.BASE_URL || '/';
    const BASE_URL = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

    const [scnHistory, setScnHistory] = useState([]);

    // --- LIVE METRICS EXTRACTION ---
    // Safely extract raw values from the API response
    const uptime = status?.uptime_percent ? `${parseFloat(status.uptime_percent).toFixed(2)}%` : 'Loading...';
    const latency = status?.avg_latency || '...';
    const totalRequests = status?.total_requests || '...';

    // Determine health (Green/Red) based on 5xx errors
    const errorCount = parseInt(status?.['5xx_requests'] || '0');
    const isHealthy = status && errorCount === 0;
    const healthLabel = isHealthy ? 'Operational' : (status ? 'Issues Detected' : 'Checking Status...');
    const healthColor = isHealthy ? 'text-green-400' : (status ? 'text-red-400' : 'text-gray-400');
    const healthBg = isHealthy ? 'bg-green-400' : (status ? 'bg-red-400' : 'bg-gray-400');

    useEffect(() => {
        const fetchData = async () => {
            // 1. Fetch Report Schedule
            try {
                const res = await fetch(`${BASE_URL}data/next_report_date.json`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.next_ongoing_report) {
                        setNextReportDate(new Date(data.next_ongoing_report));
                    }
                }
            } catch (e) {
                console.warn("Failed to fetch report schedule, using fallback calculation.");
                const now = new Date();
                const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
                const currentYear = now.getFullYear();
                const quarterEndMonth = currentQuarter * 3;
                const reportMonth = quarterEndMonth === 12 ? 0 : quarterEndMonth;
                const reportYear = quarterEndMonth === 12 ? currentYear + 1 : currentYear;
                setNextReportDate(new Date(reportYear, reportMonth, 15));
            }

            // 2. Fetch SCN History
            try {
                const res = await fetch(`${BASE_URL}data/scn_history.jsonl`);
                if (res.ok) {
                    const text = await res.text();
                    const parsed = text
                        .split('\n')
                        .filter(line => line.trim() !== '')
                        .map(line => JSON.parse(line))
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .slice(0, 5);
                    setScnHistory(parsed);
                }
            } catch (e) {
                console.warn("Could not load SCN history");
            }
        };
        fetchData();
    }, [BASE_URL]);

    const handleAction = (actionName) => {
        if (!isAuthenticated) {
            openModal('accessRequired', {
                featureName: actionName,
                benefits: [
                    'Download complete authorization package (50-150 MB)',
                    'Access technical validation reports',
                    'View VDR vulnerability data',
                    'Review evidence files'
                ]
            });
            return false;
        }
        return true;
    };

    const openApiDocs = () => window.open('https://meridian-knowledge-solutions.github.io/fedramp-20x-public/documentation/api/', '_blank');

    // --- HANDLERS ---
    const viewSecureConfig = async () => {
        if (!handleAction('View Secure Configuration')) return;
        try {
            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONFIG_PUBLIC}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to load configuration');
            const text = await res.text();
            openModal('markdown', {
                title: 'FedRAMP 20x Secure Configuration Standards',
                subtitle: 'Hardened Baselines (CIS/STIG)',
                markdown: text
            });
        } catch (e) {
            alert('Failed to load secure configuration. Please check connection.');
        }
    };

    const downloadSecureConfig = async () => {
        if (!handleAction('Download Secure Config')) return;
        try {
            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONFIG_PUBLIC}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to download configuration');
            const text = await res.text();
            const blob = new Blob([text], { type: 'text/markdown' });
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `fedramp-20x-secure-configuration-${new Date().toISOString().split('T')[0]}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        } catch (e) {
            alert('Failed to download file.');
        }
    };

    const viewQuarterlyReport = async () => {
        if (!handleAction('View Quarterly Report')) return;
        try {
            const res = await fetch(`${BASE_URL}data/ongoing_authorization_report_Q4_2025.md`);
            if (!res.ok) throw new Error('Report not found');
            const text = await res.text();
            openModal('markdown', {
                title: 'Ongoing Authorization Report - Q4 2025',
                subtitle: 'RFC-0016 Collaborative Continuous Monitoring',
                markdown: text
            });
        } catch (e) {
            alert('Failed to load the quarterly report. Please check connection.');
        }
    };

    const downloadQuarterlyReport = () => {
        if (!handleAction('Download Quarterly Report')) return;
        window.open(`${BASE_URL}data/ongoing_authorization_report_Q4_2025.json`, '_blank');
    };

    const handleFeedback = () => {
        if (!handleAction('Submit Agency Feedback')) return;
        const subject = encodeURIComponent(`Agency Feedback - ${user.agency}`);
        const body = encodeURIComponent(`Agency: ${user.agency}\nContact: ${user.name}\nEmail: ${user.email}\n\nPlease share your feedback below.`);
        window.open(`mailto:fedramp_20x@meridianks.com?subject=${subject}&body=${body}`);
    };

    const handleReviewRegistration = () => {
        if (!handleAction('Register for Quarterly Review')) return;
        const subject = encodeURIComponent(`Quarterly Review Registration - ${user.agency}`);
        const body = encodeURIComponent(`Agency: ${user.agency}\nContact: ${user.name}\nEmail: ${user.email}\n\nPlease register us for the next quarterly review meeting per FRR-CCM-QR.`);
        window.open(`mailto:fedramp_20x@meridianks.com?subject=${subject}&body=${body}`);
    };

    const handleDownloadPackage = async () => {
        if (!handleAction('Download Authorization Package')) return;
        try {
            const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
            if (!token) {
                alert("Session expired. Please log in again.");
                return;
            }
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PACKAGE_DOWNLOAD}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                if (response.status === 403) throw new Error("Access Denied. Please ensure your account is verified.");
                throw new Error(`API Error: ${response.status}`);
            }
            const data = await response.json();
            if (data.url) {
                const link = document.createElement('a');
                link.href = data.url;
                link.setAttribute('download', 'meridian-fedramp-authorization-package.zip');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                throw new Error("No download URL returned from API.");
            }
        } catch (error) {
            console.error("Download failed:", error);
            alert(`Failed to download: ${error.message}. Please check your connection or CORS settings.`);
        }
    };

    return (
        <div className="-m-6 p-8 bg-[#151618] min-h-full rounded-xl space-y-8 text-gray-300">

            {/* 1. Hero Header & Live Status Bar */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 p-8 border border-blue-900/30 shadow-xl">
                {/* Background Watermark - Changed to Landmark */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-5 pointer-events-none">
                    <Landmark size={300} strokeWidth={1} className="text-white" />
                </div>

                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                    {/* Title Section */}
                    <div className="flex items-center gap-6">
                        {/* Main Logo - Changed to Landmark with thinner stroke */}
                        <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-400/20 backdrop-blur-sm shadow-inner hidden md:block">
                            <Landmark size={48} strokeWidth={1.5} className="text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">FedRAMP Trust Center</h1>

                            {/* LIVE SYSTEM STATUS BAR */}
                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium bg-black/20 p-2 rounded-lg border border-white/5 backdrop-blur-sm">
                                {/* Uptime */}
                                <div className="flex items-center gap-2 px-2" title="System Uptime (30d)">
                                    <Activity size={14} className="text-green-400" />
                                    <span className="text-white font-mono">{uptime}</span>
                                    <span className="opacity-60 text-xs uppercase tracking-wide">Uptime</span>
                                </div>
                                {/* Divider */}
                                <div className="w-px h-4 bg-white/10 hidden sm:block"></div>
                                {/* Latency */}
                                <div className="flex items-center gap-2 px-2" title="Average API Latency">
                                    <Zap size={14} className="text-yellow-400" />
                                    <span className="text-white font-mono">{latency}</span>
                                    <span className="opacity-60 text-xs uppercase tracking-wide">Latency</span>
                                </div>
                                {/* Divider */}
                                <div className="w-px h-4 bg-white/10 hidden sm:block"></div>
                                {/* Requests */}
                                <div className="flex items-center gap-2 px-2" title="Total Requests (1h)">
                                    <Globe size={14} className="text-blue-400" />
                                    <span className="text-white font-mono">{totalRequests}</span>
                                    <span className="opacity-60 text-xs uppercase tracking-wide">Reqs/Hr</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Badge & Auth Status */}
                    <div className="flex flex-col items-start xl:items-end gap-3">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md ${isHealthy ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-800 border-gray-700'}`}>
                            <div className={`w-2 h-2 rounded-full animate-pulse ${healthBg}`} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${healthColor}`}>
                                {healthLabel}
                            </span>
                        </div>
                        {isAuthenticated && (
                            <div className="text-xs text-blue-300/60 flex items-center gap-1.5 px-1">
                                <CheckCircle2 size={12} /> Verified Federal Access
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Service Profile */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Server size={20} className="text-blue-400" /> Service Profile
                </h2>
                <p className="text-gray-400 leading-relaxed mb-8 max-w-5xl">
                    <strong>Meridian Learning Management System (LMS) for Government</strong> is a FedRAMP Authorized Software-as-a-Service (SaaS) that provides comprehensive learning management, compliance tracking, and training delivery capabilities. The system enables federal agencies to manage all aspects of their training programs through a secure, web-based platform hosted on AWS infrastructure.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <InfoCard label="Deployment Model" value="Multi-tenant SaaS" sub="Shared Infrastructure" />
                    <InfoCard label="Cloud Provider" value="AWS" sub="US-East-1" />
                    <InfoCard label="Leveraged Auth" value="AWS FedRAMP Moderate" sub="IaaS/PaaS" />
                    <InfoCard label="Access Method" value="HTTPS" sub="Web Browser (Port 443)" />
                </div>
            </div>

            {/* 3. Data Authorization Position */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Shield size={24} className="text-green-400" /> FedRAMP 20x Data Authorization Position
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Authorized */}
                    <div className="bg-green-900/10 border border-green-500/20 rounded-xl p-6">
                        <h4 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                            <CheckCircle size={20} />
                        </h4>
                        <p className="text-sm text-gray-300 mb-4 italic">
                            "Data that does not exceed the Moderate confidentiality, integrity, or availability impact level is authorized."
                        </p>
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex gap-3 items-start"><CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" /> <span>Standard LMS data (training records, completions, SCORM)</span></li>
                            <li className="flex gap-3 items-start"><CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" /> <span>User profile data (names, email, org attributes)</span></li>
                            <li className="flex gap-3 items-start"><CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" /> <span>Corporate training content & Performance metrics</span></li>
                            <li className="flex gap-3 items-start"><CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" /> <span>Government-furnished but non-sensitive information</span></li>
                            <li className="flex gap-3 items-start"><CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" /> <span>Proprietary/internal data within Moderate impact thresholds</span></li>
                        </ul>
                    </div>
                    {/* Not Authorized */}
                    <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-6">
                        <h4 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                            <XCircle size={20} /> Not Authorized (Out-of-Scope)
                        </h4>
                        <p className="text-sm text-gray-300 mb-4 italic">
                            "Any data whose compromise would exceed the Moderate impact outcomes is not authorized."
                        </p>
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex gap-3 items-start"><XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" /> <span><strong>CUI High:</strong> CUI requiring High baseline protections</span></li>
                            <li className="flex gap-3 items-start"><XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" /> <span><strong>Classified:</strong> Any level (requires cleared environment)</span></li>
                            <li className="flex gap-3 items-start"><XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" /> <span><strong>HIPAA:</strong> Protected Health Information (unless BAA)</span></li>
                            <li className="flex gap-3 items-start"><XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" /> <span><strong>Financial PII:</strong> High-impact sensitivity (e.g. bank info)</span></li>
                            <li className="flex gap-3 items-start"><XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" /> <span><strong>LES Data:</strong> Law Enforcement Sensitive data</span></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* 4. Authorized Services Grid */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Layers size={24} className="text-blue-400" /> Authorized Services
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <ServiceCard title="Course Management" icon={Layers} desc="Create, organize, and deliver training courses including e-learning, instructor-led training, and blended learning programs." features={["Course catalog management", "SCORM/AICC/xAPI support", "Video/Multimedia delivery", "Mobile-responsive player"]} dataType="Course materials, training videos, SCORM packages, learner progress" />
                    <ServiceCard title="User Management" icon={Users} desc="Manage user accounts, roles, and secure access with support for single sign-on and multi-factor authentication." features={["SSO via SAML 2.0", "MFA Support", "Role-based access (RBAC)", "User hierarchies & profiles"]} dataType="User profiles, auth credentials, role assignments" />
                    <ServiceCard title="Assessment & Testing" icon={FileText} desc="Create and deliver assessments, quizzes, exams, and surveys to measure learner competency." features={["Quiz/Exam creation", "Automated grading", "Question banks", "Competency tracking"]} dataType="Assessment Q&A, test scores, survey responses" />
                    <ServiceCard title="Compliance Tracking" icon={Shield} desc="Track training compliance requirements, generate regulatory reports, and monitor workforce readiness." features={["Automated compliance alerts", "Rules engine assignment", "21 CFR Part 11 support", "Audit trails"]} dataType="Completion records, compliance status, audit logs" />
                    <ServiceCard title="Reporting & Analytics" icon={BarChart} desc="Generate comprehensive reports and analyze training data with customizable dashboards and data exports." features={["Real-time analytics", "Custom templates", "Scheduled delivery", "Trend analysis"]} dataType="Aggregated training data, performance metrics, reports" />
                    <ServiceCard title="Learning Record Store" icon={Database} desc="Native xAPI-compliant learning record store for capturing and storing detailed learning activity data." features={["xAPI statement capture", "Cross-platform tracking", "Statement forwarding", "Learning analytics"]} dataType="xAPI statements, learning activity records" />
                    <ServiceCard title="Career Development" icon={BookOpen} desc="Enable employees to explore career paths, track professional development, and plan skill progression." features={["Career Explorer tool", "Learning path creation", "Skills gap analysis", "IDP tracking"]} dataType="Career progression data, skill inventories, development plans" />
                    <ServiceCard title="Notifications" icon={Bell} desc="Automated email notifications, reminders, and in-application messaging to keep learners engaged." features={["Automated assignments", "Deadline reminders", "Customizable templates", "Manager notifications"]} dataType="Email addresses, notification content, user preferences" />
                    <ServiceCard title="API & Integrations" icon={Code} desc="RESTful API access for integrating with HRIS, talent management, and other enterprise systems." features={["REST API access", "Webhook support", "OAuth 2.0 auth", "HRIS integration"]} dataType="API requests/responses, integration data, tokens" />
                    <ServiceCard title="Content Authoring" icon={FileText} desc="Built-in tools for creating training content, assessments, and learning materials without external software." features={["Web course builder", "Multimedia upload", "Version control", "Content templates"]} dataType="Authored content, multimedia files, version history" />
                    <ServiceCard title="Administrative Console" icon={Settings} desc="Comprehensive administrative interface for system configuration, user management, and platform oversight." features={["System config", "Bulk operations", "System health", "Audit log viewing"]} dataType="System configuration, admin actions, system logs" />
                </div>
            </div>

            {/* 5. Excluded Services */}
            <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                    <XCircle size={20} /> Services NOT Included in Authorization
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-gray-300">
                    <ul className="space-y-3 list-disc pl-5 marker:text-red-500/50">
                        <li><strong>On-Premise Deployments:</strong> Self-hosted installations are not covered.</li>
                        <li><strong>Private Cloud Deployments:</strong> Customer-specific instances require separate auth.</li>
                        <li><strong>Custom Development:</strong> Bespoke software development outside core platform.</li>
                    </ul>
                    <ul className="space-y-3 list-disc pl-5 marker:text-red-500/50">
                        <li><strong>Third-Party Content:</strong> External libraries (e.g., OpenSesame) not in boundary.</li>
                        <li><strong>Professional Services:</strong> Consulting and implementation services.</li>
                        <li><strong>Mobile Applications:</strong> Native apps (Web-responsive interface IS authorized).</li>
                    </ul>
                </div>
                <div className="mt-4 pt-4 border-t border-red-500/20 text-xs text-red-300/80 flex items-center gap-2">
                    <Info size={14} />
                    Customers requiring services outside the boundary should contact <span className="text-white underline cursor-pointer">fedramp_20x@meridianks.com</span>
                </div>
            </div>

            {/* 6. Downloads & Monitoring Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Authorization Package - UPDATED FOR 20x */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col shadow-md hover:border-gray-600 transition-colors">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/10">
                            <Download size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Authorization Package</h3>
                            <div className="text-xs text-gray-400">Complete Evidence & Documentation</div>
                        </div>
                    </div>

                    {/* FedRAMP 20x Compliance Badge (Replaces old SSP text) */}
                    <div className="bg-gray-900/50 rounded-lg p-4 mb-8 border border-gray-700/50">
                        <div className="flex items-center gap-3 mb-3">
                            <Shield size={18} className="text-blue-400" />
                            <span className="text-sm font-bold text-white uppercase tracking-wider">FedRAMP 20x Compliant</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-2 text-gray-300">
                                <CheckCircle2 size={12} className="text-green-500" /> Machine Readable
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <CheckCircle2 size={12} className="text-green-500" /> Continuous Validation
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <CheckCircle2 size={12} className="text-green-500" /> Automated Evidence
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <CheckCircle2 size={12} className="text-green-500" /> OSCAL Ready
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleDownloadPackage}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20 mt-auto"
                    >
                        {isAuthenticated ? <Download size={18} /> : <Lock size={18} />}
                        Download Full Package
                    </button>
                </div>

                {/* Continuous Monitoring */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col shadow-md hover:border-gray-600 transition-colors">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-lg bg-green-500/10 text-green-400 border border-green-500/10">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Continuous Monitoring</h3>
                            <div className="text-xs text-gray-400">Quarterly Reporting & Metrics</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2">
                                <Clock size={12} /> Next Report
                            </div>
                            <div className="text-blue-400 font-bold text-lg">
                                {nextReportDate ? nextReportDate.toLocaleDateString() : '...'}
                            </div>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2">
                                <CheckCircle2 size={12} />
                            </div>
                            <div className="text-green-400 font-bold text-lg">Operational</div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                        <div className="flex gap-2">
                            <button
                                onClick={viewQuarterlyReport}
                                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors border border-gray-600 flex items-center justify-center gap-2 text-sm"
                            >
                                <FileText size={16} /> View Report
                            </button>
                            <button
                                onClick={downloadQuarterlyReport}
                                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors border border-gray-600"
                                title="Download JSON"
                            >
                                <Download size={16} />
                            </button>
                        </div>
                        <button
                            onClick={() => openModal('poam')}
                            className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors border border-gray-600 text-sm"
                        >
                            Risk Dashboard
                        </button>
                    </div>

                    <div className="pt-4 border-t border-gray-700 flex gap-2 mt-3">
                        <button onClick={handleFeedback} className="flex-1 py-2 px-3 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-bold rounded-lg border border-gray-700 transition-colors flex items-center justify-center gap-2">
                            <MessageSquare size={14} /> Feedback
                        </button>
                        <button onClick={handleReviewRegistration} className="flex-1 py-2 px-3 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-bold rounded-lg border border-gray-700 transition-colors flex items-center justify-center gap-2">
                            <Users size={14} /> Review
                        </button>
                    </div>
                </div>
            </div>

            {/* 7. Infrastructure Change History (SCN) */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <GitCommit size={24} className="text-purple-400" /> Infrastructure Change Log
                        </h3>
                        <div className="text-xs text-gray-400 mt-1">
                            RFC-0007 Significant Change Notification (SCN) History
                        </div>
                    </div>
                    {scnHistory.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-900/20 border border-green-500/20 rounded-full">
                            <Activity size={14} className="text-green-400" />
                            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Active Monitoring</span>
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900/50">
                    {scnHistory.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            Waiting for change detection data...
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-700 bg-gray-800/50 text-xs text-gray-400 uppercase tracking-wider">
                                    <th className="p-4 font-bold">Date</th>
                                    <th className="p-4 font-bold">Change ID</th>
                                    <th className="p-4 font-bold">Classification</th>
                                    <th className="p-4 font-bold">Scope</th>
                                    <th className="p-4 font-bold text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {scnHistory.map((entry, index) => (
                                    <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="p-4 text-sm text-gray-300 font-mono">
                                            {new Date(entry.timestamp).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-xs font-mono text-gray-500">
                                            {entry.change_id}
                                        </td>
                                        <td className="p-4">
                                            <ClassificationBadge type={entry.classification} label={entry.description} />
                                        </td>
                                        <td className="p-4 text-sm text-gray-400">
                                            {entry.affected_component_count} Components
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/10 text-green-400 border border-green-500/20">
                                                <CheckCircle2 size={10} />
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={() => window.open(`${BASE_URL}data/scn_history.jsonl`, '_blank')}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                        <FileJson size={12} /> View Raw History Log
                    </button>
                </div>
            </div>

            {/* 8. Technical Resources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col shadow-md hover:border-gray-600 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/10"><Code size={20} /></div>
                        <div><h3 className="text-lg font-bold text-white">API Access</h3><div className="text-xs text-gray-400">Automation</div></div>
                    </div>
                    <p className="text-gray-400 text-xs mb-4 flex-1">Access real-time authorization data via machine-readable API endpoints (OSCAL/JSON).</p>
                    <button onClick={openApiDocs} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-900/20 text-sm"><ExternalLink size={16} /> View API Docs</button>
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col shadow-md hover:border-gray-600 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/10"><Settings size={20} /></div>
                        <div><h3 className="text-lg font-bold text-white">Secure Config</h3><div className="text-xs text-gray-400">Baselines</div></div>
                    </div>
                    <p className="text-gray-400 text-xs mb-4 flex-1">Access FedRAMP 20x hardened configuration standards (CIS/STIG) for AWS services.</p>
                    <div className="flex gap-2">
                        <button onClick={viewSecureConfig} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors border border-gray-600 text-sm">View Standards</button>
                        <button onClick={downloadSecureConfig} className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-orange-900/20 text-sm">Download</button>
                    </div>
                </div>
            </div>

            {/* 9. Support Channels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SupportCard icon={Mail} title="FedRAMP Inquiries" value="fedramp_20x@meridianks.com" />
                <SupportCard icon={Shield} title="Security Team" value="security@meridianks.com" />
                <SupportCard icon={Server} title="Technical Support" value="support@meridianks.com" />
            </div>

        </div>
    );
};

// --- Helper Components ---
const InfoCard = ({ label, value, sub }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">{label}</div>
        <div className="font-bold text-white text-lg">{value}</div>
        {sub && <div className="text-xs text-blue-400/80 mt-0.5">{sub}</div>}
    </div>
);

const ServiceCard = ({ title, desc, features, icon: Icon, dataType }) => (
    <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl hover:border-blue-500/30 hover:bg-gray-750 transition-all group flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
            <div className="p-2 rounded-lg bg-gray-900 text-blue-400 group-hover:text-white group-hover:bg-blue-600 transition-colors">
                {Icon && <Icon size={18} />}
            </div>
            <span className="text-[10px] bg-green-900/20 text-green-400 px-2 py-0.5 rounded border border-green-500/20 uppercase font-bold">Auth</span>
        </div>
        <h4 className="font-bold text-white mb-2 text-sm">{title}</h4>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">{desc}</p>
        <div className="space-y-1 flex-1">
            {features.slice(0, 4).map((f, i) => (
                <div key={i} className="flex gap-2 items-start">
                    <CheckCircle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-300">{f}</span>
                </div>
            ))}
        </div>
        {dataType && (
            <div className="mt-4 pt-3 border-t border-gray-700 text-[10px] text-gray-500">
                <strong className="text-gray-400">Data Types:</strong> {dataType}
            </div>
        )}
    </div>
);

const SupportCard = ({ icon: Icon, title, value }) => (
    <a href={`mailto:${value}`} className="flex items-center gap-4 p-5 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-750 hover:border-blue-500/30 transition-all group shadow-sm">
        <div className="p-3 bg-gray-900 rounded-lg text-gray-500 group-hover:text-blue-400 group-hover:bg-blue-900/20 transition-colors border border-gray-800 group-hover:border-blue-500/20">
            <Icon size={20} />
        </div>
        <div className="overflow-hidden">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{title}</div>
            <div className="text-gray-300 text-sm font-medium truncate group-hover:text-white transition-colors">{value}</div>
        </div>
    </a>
);

// New component for SCN classifications
const ClassificationBadge = ({ type, label }) => {
    let styles = "bg-gray-700 text-gray-300 border-gray-600";
    let Icon = GitCommit;

    if (type === 'routine_recurring') {
        styles = "bg-blue-900/20 text-blue-300 border-blue-500/20";
        Icon = RefreshCw;
    } else if (type === 'adaptive') {
        styles = "bg-purple-900/20 text-purple-300 border-purple-500/20";
        Icon = Zap;
    } else if (type === 'transformative') {
        styles = "bg-orange-900/20 text-orange-300 border-orange-500/20";
        Icon = AlertTriangle;
    }

    return (
        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-medium ${styles}`}>
            <Icon size={12} />
            {label || type.replace('_', ' ')}
        </div>
    );
};