import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../contexts/ModalContext';
import {
    ShieldCheck, Terminal, Activity, CheckCircle2, XCircle,
    AlertCircle, TrendingUp, Database, Clock, FileJson,
    BarChart3, Cpu, Eye, ChevronDown, ChevronRight
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, LineChart, Line
} from 'recharts';

// --- CONFIGURATION ---
const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
    ? `${import.meta.env.BASE_URL}data/`
    : `${import.meta.env.BASE_URL}/data/`;

// --- HELPER COMPONENTS ---

const MetricCard = ({ label, value, subtext, icon: Icon, trend, status }) => {
    const statusColors = {
        excellent: 'border-emerald-500/20 bg-emerald-500/5',
        warning: 'border-amber-500/20 bg-amber-500/5',
        critical: 'border-red-500/20 bg-red-500/5',
        neutral: 'border-white/10 bg-white/5'
    };

    return (
        <div className={`p-4 rounded-lg border ${statusColors[status] || statusColors.neutral}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {Icon && <Icon size={14} className="text-zinc-400" />}
                        <span className="text-xs text-zinc-400 uppercase tracking-wider">{label}</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{value}</div>
                    {subtext && <div className="text-xs text-zinc-500">{subtext}</div>}
                </div>
                {trend !== undefined && (
                    <div className={`text-sm font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trend >= 0 ? '+' : ''}{trend}%
                    </div>
                )}
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    if (!status) return null;

    const styles = {
        excellent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        critical: "bg-red-500/10 text-red-400 border-red-500/20",
        ready: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        issues_detected: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    };

    const displayText = typeof status === 'string'
        ? status.replace(/_/g, ' ').toUpperCase()
        : String(status);

    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[status] || "bg-zinc-800 border-zinc-700 text-zinc-400"}`}>
            {displayText}
        </span>
    );
};

const TabButton = ({ id, label, icon: Icon, active, set, count, badge }) => (
    <button
        onClick={() => set(id)}
        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative ${active === id
                ? 'text-white bg-white/5'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
    >
        <Icon size={16} className={active === id ? 'text-indigo-400' : ''} />
        {label}
        {count !== undefined && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active === id ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-800 text-zinc-500'
                }`}>
                {count}
            </span>
        )}
        {badge && (
            <StatusBadge status={badge} />
        )}
        {active === id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
        )}
    </button>
);

const IssueCard = ({ issue, type }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const parts = issue.split(': ');
    const ksiId = parts[0];
    const description = parts.slice(1).join(': ');

    const typeStyles = {
        technical: 'border-red-500/20 bg-red-500/5',
        compliance: 'border-amber-500/20 bg-amber-500/5'
    };

    return (
        <div className={`rounded-lg border ${typeStyles[type]} overflow-hidden`}>
            <div
                className="p-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-white">{ksiId}</span>
                            {type === 'technical' ? (
                                <span className="text-xs text-red-400">Technical Failure</span>
                            ) : (
                                <span className="text-xs text-amber-400">Compliance Gap</span>
                            )}
                        </div>
                        <p className="text-sm text-zinc-300 line-clamp-2">{description}</p>
                    </div>
                    <ChevronDown
                        size={16}
                        className={`text-zinc-500 transition-transform flex-shrink-0 ml-2 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>
            {isExpanded && (
                <div className="px-3 pb-3 border-t border-white/5">
                    <div className="mt-3 text-sm text-zinc-400 bg-black/20 p-3 rounded font-mono text-xs">
                        {description}
                    </div>
                </div>
            )}
        </div>
    );
};

const ValidationCard = ({ validation }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isPassing = validation.assertion;

    return (
        <div className={`rounded-lg border overflow-hidden transition-colors ${isPassing
                ? 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/30'
                : 'border-red-500/20 bg-red-500/5 hover:border-red-500/30'
            }`}>
            <div
                className="p-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                        <div className="mt-0.5">
                            {isPassing ? (
                                <CheckCircle2 size={20} className="text-emerald-400" />
                            ) : (
                                <XCircle size={20} className="text-red-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-mono text-sm font-bold text-white">{validation.ksi_id}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded ${isPassing ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                                    }`}>
                                    {validation.score}%
                                </span>
                            </div>
                            <p className="text-sm text-zinc-300 mb-2">{validation.requirement}</p>
                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                <span>📊 {validation.resources_scanned} resources</span>
                                {validation.resources_passed > 0 && (
                                    <span className="text-emerald-400">✓ {validation.resources_passed} passed</span>
                                )}
                                {validation.resources_failed > 0 && (
                                    <span className="text-red-400">✗ {validation.resources_failed} failed</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <ChevronDown
                        size={16}
                        className={`text-zinc-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/10 space-y-3">
                    <div className="mt-3">
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Result</h4>
                        <p className="text-sm text-zinc-300 bg-black/20 p-3 rounded">
                            {validation.assertion_reason}
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Recommended Action</h4>
                        <p className="text-sm text-zinc-300 bg-black/20 p-3 rounded">
                            {validation.recommended_action}
                        </p>
                    </div>

                    {validation.cli_command && (
                        <div>
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">CLI Commands</h4>
                            <div className="bg-black/40 p-3 rounded border border-white/5 font-mono text-xs">
                                <div className="text-zinc-400 whitespace-pre-wrap break-all">{validation.cli_command}</div>
                            </div>
                        </div>
                    )}

                    {validation.evidence_path && (
                        <div className="text-xs text-zinc-500">
                            <FileJson size={12} className="inline mr-1" />
                            Evidence: {validation.evidence_path}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---

const TransparencyConsole = () => {
    const { isAuthenticated, user } = useAuth();
    const { openModal } = useModal();

    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState({
        integrityReport: null,
        executionReport: null,
        consistencyLog: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasShownAuthModal, setHasShownAuthModal] = useState(false);

    // Auth gate - show modal once when unauthenticated
    useEffect(() => {
        if (!isAuthenticated && !hasShownAuthModal) {
            openModal('accessRequired', {
                featureName: 'System Transparency Console',
                benefits: [
                    'View validation engine internals',
                    'Access execution quality metrics',
                    'Review temporal consistency data',
                    'Audit KSI validation details'
                ]
            });
            setHasShownAuthModal(true);
        }
    }, [isAuthenticated, hasShownAuthModal, openModal]);

    useEffect(() => {
        // Only load data if authenticated
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const loadFile = async (filename) => {
                    try {
                        const response = await fetch(`${BASE_PATH}${filename}`);
                        if (!response.ok) {
                            console.warn(`Failed to load ${filename}: ${response.status}`);
                            return null;
                        }
                        const text = await response.text();
                        if (text.startsWith('<!doctype') || text.startsWith('<!DOCTYPE')) {
                            console.warn(`${filename} returned HTML instead of JSON (likely 404)`);
                            return null;
                        }
                        return JSON.parse(text);
                    } catch (err) {
                        console.warn(`Error loading ${filename}:`, err.message);
                        return null;
                    }
                };

                const [intRes, execRes, consRes] = await Promise.all([
                    loadFile('validation_integrity_report.json'),
                    loadFile('execution_quality_report.json'),
                    loadFile('temporal_consistency_log.json')
                ]);

                if (!intRes && !execRes && !consRes) {
                    setError('No data files found. Please ensure data files are in the data/ directory.');
                }

                setData({
                    integrityReport: intRes,
                    executionReport: execRes,
                    consistencyLog: consRes
                });
            } catch (e) {
                console.error('Data load error:', e);
                setError(`Failed to load data: ${e.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isAuthenticated]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-zinc-400 flex items-center gap-2">
                    <Activity className="animate-spin" size={20} />
                    Loading validation data...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="max-w-md p-6 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <XCircle size={24} className="text-red-400" />
                        <h3 className="text-lg font-bold text-red-400">Failed to Load Data</h3>
                    </div>
                    <p className="text-sm text-zinc-300 mb-4">{error}</p>
                    <div className="text-xs text-zinc-500 space-y-1">
                        <p>Expected files in <code className="bg-black/40 px-1 py-0.5 rounded">data/</code> directory:</p>
                        <ul className="list-disc list-inside pl-2">
                            <li>validation_integrity_report.json</li>
                            <li>execution_quality_report.json</li>
                            <li>temporal_consistency_log.json</li>
                        </ul>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Auth gate - only render content if authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="max-w-md w-full p-8 bg-zinc-900/50 border border-white/10 rounded-xl text-center backdrop-blur-sm">
                    <div className="flex items-center justify-center mb-6">
                        <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                            <ShieldCheck size={48} className="text-indigo-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Authentication Required</h3>
                    <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                        The System Transparency Console contains detailed technical validation findings and authorization materials restricted to authorized federal personnel.
                    </p>
                    <div className="text-xs text-zinc-500 space-y-2 text-left bg-black/40 p-4 rounded-lg border border-white/5 mb-6">
                        <p className="font-bold text-zinc-400 mb-3 text-center">With Federal Access:</p>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                View validation engine internals
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                Access execution quality metrics
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                Review temporal consistency data
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                Audit KSI validation details
                            </li>
                        </ul>
                    </div>
                    <button
                        onClick={() => window.history.back()}
                        className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors"
                    >
                        Return to Trust Center
                    </button>
                </div>
            </div>
        );
    }

    const integrityReport = data.integrityReport;
    const executionReport = data.executionReport;
    const consistencyLog = data.consistencyLog;

    // Calculate stats with safe fallbacks
    const validationSummary = integrityReport?.validation_summary || {};
    const temporalAnalysis = integrityReport?.temporal_consistency_analysis || {};
    const executionAnalysis = integrityReport?.execution_quality_analysis || {};
    const overallAssessment = integrityReport?.overall_integrity_assessment || {};

    const technicalIssues = executionReport?.technical_issues || [];
    const complianceFailures = executionReport?.compliance_failures || [];
    const consistencyChecks = consistencyLog?.consistency_checks || [];
    const latestValidations = consistencyLog?.historical_validations?.[consistencyLog.historical_validations.length - 1]?.results || [];

    const passedCount = validationSummary.passed_ksis || 0;
    const failedCount = validationSummary.failed_ksis || 0;
    const totalCount = validationSummary.total_ksis || 0;

    // Show warning if data is incomplete
    const hasData = integrityReport || executionReport || consistencyLog;
    const isPartialData = hasData && (!integrityReport || !executionReport || !consistencyLog);

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="border-b border-white/10 bg-gradient-to-b from-zinc-900/50 to-transparent">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck size={32} className="text-indigo-400" />
                        <h1 className="text-3xl font-bold">System 2.5 Transparency Console</h1>
                    </div>
                    <p className="text-zinc-400">Configuration-driven validation framework with complete audit visibility</p>
                </div>
            </div>

            {/* Navigation */}
            <div className="border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur-sm z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex gap-1">
                        <TabButton
                            id="overview"
                            label="Overview"
                            icon={BarChart3}
                            active={activeTab}
                            set={setActiveTab}
                            badge={overallAssessment.audit_readiness}
                        />
                        <TabButton
                            id="execution"
                            label="Execution Quality"
                            icon={Terminal}
                            active={activeTab}
                            set={setActiveTab}
                            count={technicalIssues.length + complianceFailures.length}
                        />
                        <TabButton
                            id="consistency"
                            label="Consistency"
                            icon={Clock}
                            active={activeTab}
                            set={setActiveTab}
                            count={consistencyChecks.length}
                        />
                        <TabButton
                            id="validations"
                            label="KSI Details"
                            icon={Database}
                            active={activeTab}
                            set={setActiveTab}
                            count={totalCount}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* Partial data warning */}
                {isPartialData && (
                    <div className="mb-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start gap-3">
                        <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-400 mb-1">Incomplete Data</h4>
                            <p className="text-xs text-zinc-300">
                                Some data files are missing. The following files were not found:
                            </p>
                            <ul className="text-xs text-zinc-400 mt-2 space-y-1">
                                {!integrityReport && <li>• validation_integrity_report.json</li>}
                                {!executionReport && <li>• execution_quality_report.json</li>}
                                {!consistencyLog && <li>• temporal_consistency_log.json</li>}
                            </ul>
                        </div>
                    </div>
                )}

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {!integrityReport ? (
                            <div className="bg-[#18181b] rounded-lg border border-white/10 p-12 text-center">
                                <AlertCircle size={48} className="text-zinc-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-zinc-400 mb-2">No Integrity Report Data</h3>
                                <p className="text-zinc-500">validation_integrity_report.json not found</p>
                            </div>
                        ) : (
                            <>
                                {/* Top-level metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <MetricCard
                                        label="Overall Pass Rate"
                                        value={validationSummary.overall_pass_rate || '0%'}
                                        subtext={`${passedCount} of ${totalCount} KSIs passing`}
                                        icon={TrendingUp}
                                        status={passedCount / totalCount >= 0.9 ? 'excellent' : passedCount / totalCount >= 0.75 ? 'warning' : 'critical'}
                                    />
                                    <MetricCard
                                        label="Integrity Score"
                                        value={`${overallAssessment.integrity_score?.toFixed(1) || '0'}%`}
                                        subtext="Mathematical validation accuracy"
                                        icon={ShieldCheck}
                                        status={overallAssessment.integrity_score >= 90 ? 'excellent' : 'warning'}
                                    />
                                    <MetricCard
                                        label="Execution Quality"
                                        value={`${executionReport?.execution_quality_score || 0}%`}
                                        subtext={`${technicalIssues.length} technical issues`}
                                        icon={Cpu}
                                        status={technicalIssues.length === 0 ? 'excellent' : 'warning'}
                                    />
                                    <MetricCard
                                        label="Temporal Consistency"
                                        value={temporalAnalysis.average_consistency_score || '0%'}
                                        subtext={`${temporalAnalysis.recent_validations_count || 0} recent runs`}
                                        icon={Clock}
                                        status={temporalAnalysis.status}
                                    />
                                </div>

                                {/* Validation breakdown */}
                                <div className="bg-[#18181b] rounded-lg border border-white/10 p-6">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <Activity size={20} className="text-indigo-400" />
                                        Validation Status Breakdown
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                                            <div className="text-4xl font-bold text-emerald-400 mb-2">{passedCount}</div>
                                            <div className="text-sm text-zinc-400">Passed</div>
                                        </div>
                                        <div className="text-center p-6 rounded-lg border border-red-500/20 bg-red-500/5">
                                            <div className="text-4xl font-bold text-red-400 mb-2">{failedCount}</div>
                                            <div className="text-sm text-zinc-400">Failed</div>
                                        </div>
                                        <div className="text-center p-6 rounded-lg border border-white/10 bg-white/5">
                                            <div className="text-4xl font-bold text-white mb-2">{totalCount}</div>
                                            <div className="text-sm text-zinc-400">Total KSIs</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Audit readiness */}
                                <div className="bg-[#18181b] rounded-lg border border-white/10 p-6">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <Eye size={20} className="text-indigo-400" />
                                        3PAO Audit Readiness
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-lg bg-white/5">
                                            <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Audit Status</div>
                                            <StatusBadge status={overallAssessment.audit_readiness} />
                                        </div>
                                        <div className="p-4 rounded-lg bg-white/5">
                                            <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Validation Determinism</div>
                                            <StatusBadge status={overallAssessment.validation_determinism} />
                                        </div>
                                        <div className="p-4 rounded-lg bg-white/5">
                                            <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Technical Correctness</div>
                                            <StatusBadge status={overallAssessment.technical_correctness} />
                                        </div>
                                    </div>
                                </div>

                                {/* Report metadata */}
                                {integrityReport?.report_metadata && (
                                    <div className="bg-[#18181b] rounded-lg border border-white/10 p-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-zinc-500">
                                                <FileJson size={14} />
                                                <span>Report generated: {new Date(integrityReport.report_metadata.generated_at).toLocaleString()}</span>
                                            </div>
                                            <div className="text-zinc-500 font-mono text-xs">
                                                System 2.5 | Configuration-Driven Framework
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* EXECUTION QUALITY TAB */}
                {activeTab === 'execution' && (
                    <div className="space-y-6">
                        {!executionReport ? (
                            <div className="bg-[#18181b] rounded-lg border border-white/10 p-12 text-center">
                                <AlertCircle size={48} className="text-zinc-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-zinc-400 mb-2">No Execution Data</h3>
                                <p className="text-zinc-500">execution_quality_report.json not found</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <MetricCard
                                        label="Execution Quality Score"
                                        value={`${executionReport?.execution_quality_score || 0}%`}
                                        subtext="Overall automation health"
                                        icon={Cpu}
                                        status={executionReport?.execution_quality_score >= 90 ? 'excellent' : 'warning'}
                                    />
                                    <MetricCard
                                        label="Compliance Health Score"
                                        value={`${executionReport?.compliance_health_score || 0}%`}
                                        subtext="Infrastructure compliance level"
                                        icon={ShieldCheck}
                                        status={executionReport?.compliance_health_score >= 90 ? 'excellent' : 'warning'}
                                    />
                                    <MetricCard
                                        label="Total Issues"
                                        value={technicalIssues.length + complianceFailures.length}
                                        subtext={`${technicalIssues.length} technical, ${complianceFailures.length} compliance`}
                                        icon={AlertCircle}
                                        status={technicalIssues.length + complianceFailures.length === 0 ? 'excellent' : 'warning'}
                                    />
                                </div>

                                {/* Technical Issues */}
                                {technicalIssues.length > 0 && (
                                    <div className="bg-[#18181b] rounded-lg border border-white/10 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <XCircle size={20} className="text-red-400" />
                                                Technical Issues ({technicalIssues.length})
                                            </h3>
                                            <span className="text-xs text-zinc-500">Automation failures requiring attention</span>
                                        </div>
                                        <div className="space-y-2">
                                            {technicalIssues.map((issue, idx) => (
                                                <IssueCard key={idx} issue={issue} type="technical" />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Compliance Failures */}
                                {complianceFailures.length > 0 && (
                                    <div className="bg-[#18181b] rounded-lg border border-white/10 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <AlertCircle size={20} className="text-amber-400" />
                                                Compliance Gaps ({complianceFailures.length})
                                            </h3>
                                            <span className="text-xs text-zinc-500">Resources not meeting requirements</span>
                                        </div>
                                        <div className="space-y-2">
                                            {complianceFailures.map((issue, idx) => (
                                                <IssueCard key={idx} issue={issue} type="compliance" />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {technicalIssues.length === 0 && complianceFailures.length === 0 && (
                                    <div className="bg-[#18181b] rounded-lg border border-emerald-500/20 p-12 text-center">
                                        <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-emerald-400 mb-2">No Issues Detected</h3>
                                        <p className="text-zinc-400">All validations executed successfully with no compliance gaps</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* CONSISTENCY TAB */}
                {activeTab === 'consistency' && (
                    <div className="space-y-6">
                        {!consistencyLog || consistencyChecks.length === 0 ? (
                            <div className="bg-[#18181b] rounded-lg border border-white/10 p-12 text-center">
                                <AlertCircle size={48} className="text-zinc-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-zinc-400 mb-2">No Consistency Data</h3>
                                <p className="text-zinc-500">temporal_consistency_log.json not found or contains no data</p>
                            </div>
                        ) : (
                            <>
                                {/* Consistency chart */}
                                <div className="bg-[#18181b] rounded-lg border border-white/10 p-6">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <TrendingUp size={20} className="text-indigo-400" />
                                        Temporal Consistency Trend
                                    </h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={consistencyChecks}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                                <XAxis
                                                    dataKey="timestamp"
                                                    tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    stroke="#666"
                                                    style={{ fontSize: '12px' }}
                                                />
                                                <YAxis domain={[90, 100]} stroke="#666" style={{ fontSize: '12px' }} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    labelFormatter={(ts) => new Date(ts).toLocaleString()}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="consistency_score"
                                                    stroke="#6366f1"
                                                    strokeWidth={2}
                                                    dot={{ fill: '#6366f1', r: 4 }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Consistency log table */}
                                <div className="bg-[#18181b] rounded-lg border border-white/10 overflow-hidden">
                                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                        <h3 className="font-bold flex items-center gap-2">
                                            <Clock size={16} className="text-zinc-400" />
                                            Validation Consistency Log
                                        </h3>
                                        <span className="text-xs text-zinc-500">
                                            {consistencyChecks.length} validation runs tracked
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="text-xs text-zinc-500 bg-black/20 uppercase">
                                                <tr>
                                                    <th className="px-6 py-3 text-left">Timestamp</th>
                                                    <th className="px-6 py-3 text-left">Consistency Score</th>
                                                    <th className="px-6 py-3 text-left">Issues Found</th>
                                                    <th className="px-6 py-3 text-left">Comparisons</th>
                                                    <th className="px-6 py-3 text-left">Fingerprint</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {consistencyChecks.slice().reverse().map((check, i) => (
                                                    <tr key={i} className="hover:bg-white/5">
                                                        <td className="px-6 py-4 font-mono text-xs text-zinc-300">
                                                            {new Date(check.timestamp).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${check.consistency_score >= 99 ? 'bg-emerald-500' :
                                                                                check.consistency_score >= 95 ? 'bg-amber-500' :
                                                                                    'bg-red-500'
                                                                            }`}
                                                                        style={{ width: `${check.consistency_score}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-medium text-white">
                                                                    {check.consistency_score.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${check.issues_found === 0
                                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                                    : 'bg-red-500/10 text-red-400'
                                                                }`}>
                                                                {check.issues_found}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-zinc-400">
                                                            {check.comparison_count}
                                                        </td>
                                                        <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                                                            {check.infrastructure_fingerprint?.substring(0, 12)}...
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* KSI VALIDATIONS TAB */}
                {activeTab === 'validations' && (
                    <div className="space-y-6">
                        {!consistencyLog || latestValidations.length === 0 ? (
                            <div className="bg-[#18181b] rounded-lg border border-white/10 p-12 text-center">
                                <AlertCircle size={48} className="text-zinc-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-zinc-400 mb-2">No Validation Data</h3>
                                <p className="text-zinc-500">temporal_consistency_log.json not found or contains no historical validations</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                                        <div className="text-3xl font-bold text-emerald-400 mb-1">
                                            {latestValidations.filter(v => v.assertion).length}
                                        </div>
                                        <div className="text-sm text-zinc-400">Passing KSIs</div>
                                    </div>
                                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                                        <div className="text-3xl font-bold text-red-400 mb-1">
                                            {latestValidations.filter(v => !v.assertion).length}
                                        </div>
                                        <div className="text-sm text-zinc-400">Failing KSIs</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                        <div className="text-3xl font-bold text-white mb-1">
                                            {latestValidations.length}
                                        </div>
                                        <div className="text-sm text-zinc-400">Total Validations</div>
                                    </div>
                                </div>

                                {/* Validation cards */}
                                <div className="space-y-3">
                                    {latestValidations.map((validation, idx) => (
                                        <ValidationCard key={idx} validation={validation} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export { TransparencyConsole };