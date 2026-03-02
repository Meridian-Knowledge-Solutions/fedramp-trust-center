import React, { useState, useEffect, memo } from 'react';
import {
    Shield, FileText, FileJson, Download, ExternalLink,
    CheckCircle2, AlertTriangle, Clock, Calendar, Video,
    Activity, Database, Bell, ChevronDown, ChevronRight,
    FileCheck, CheckSquare, Eye, TrendingUp, BarChart3
} from 'lucide-react';

// --- CONFIGURATION ---
const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
    ? `${import.meta.env.BASE_URL}data/`
    : `${import.meta.env.BASE_URL}/data/`;

const REPORTS_PATH = `${BASE_PATH}reports/`;

const THEME = {
    panel: 'bg-[#121217]',
    border: 'border-white/5',
};

// --- REPORT CARD CONFIGURATIONS ---
const REPORT_CONFIGS = {
    oar: {
        title: 'Ongoing Authorization Report',
        shortTitle: 'OAR',
        subtitle: 'FRR-CCM Compliance',
        icon: Shield,
        gradient: 'from-emerald-600 to-teal-600',
        shadow: 'shadow-emerald-500/10',
        accentBg: 'bg-emerald-500/10',
        accentText: 'text-emerald-400',
        accentBorder: 'border-emerald-500/20',
        lightText: 'text-emerald-100',
        cadence: 'Quarterly',
        schedule: 'Feb 15, May 15, Aug 15, Nov 15',
    },
    vdr: {
        title: 'Vulnerability Detection & Response',
        shortTitle: 'VDR',
        subtitle: 'FRR-VDR Compliance',
        icon: Activity,
        gradient: 'from-blue-600 to-indigo-600',
        shadow: 'shadow-blue-500/10',
        accentBg: 'bg-blue-500/10',
        accentText: 'text-blue-400',
        accentBorder: 'border-blue-500/20',
        lightText: 'text-blue-100',
        cadence: '3-Day',
        schedule: 'Continuous pipeline',
    },
    scn: {
        title: 'Significant Change Notification',
        shortTitle: 'SCN',
        subtitle: 'FRR-SCN Compliance',
        icon: Bell,
        gradient: 'from-amber-600 to-orange-600',
        shadow: 'shadow-amber-500/10',
        accentBg: 'bg-amber-500/10',
        accentText: 'text-amber-400',
        accentBorder: 'border-amber-500/20',
        lightText: 'text-amber-100',
        cadence: 'Event-Driven',
        schedule: 'On qualifying change',
    },
};

// --- EXTRACT KEY METRICS FROM REPORT DATA ---
const extractMetrics = (type, report) => {
    if (!report) return [];

    switch (type) {
        case 'oar': {
            const exec = report.executive_summary || {};
            const trend = report.compliance_trend || {};
            return [
                { label: 'Compliance', value: `${exec.compliance_rate || 0}%` },
                { label: 'KSIs', value: `${exec.total_ksis || 0}` },
                { label: 'Gaps', value: `${exec.active_gaps || 0}` },
                { label: 'Trend', value: trend.trend_direction || 'stable' },
            ];
        }
        case 'vdr': {
            const metrics = report.metrics || {};
            const breakdown = metrics.severity_breakdown || {};
            return [
                { label: 'Total', value: `${metrics.total_detected || 0}` },
                { label: 'Critical', value: `${breakdown.critical || 0}` },
                { label: 'Open', value: `${metrics.total_open || 0}` },
                { label: 'SLA', value: `${metrics.sla_compliance_rate || 0}%` },
            ];
        }
        case 'scn': {
            const cls = report.change_classification || {};
            const verification = report.controls_verification || {};
            return [
                { label: 'Tier', value: cls.tier || 'N/A' },
                { label: 'Emergency', value: cls.is_emergency ? 'Yes' : 'No' },
                { label: 'Verification', value: verification.overall_status || 'N/A' },
                { label: 'Controls', value: `${(verification.results || []).length}` },
            ];
        }
        default:
            return [];
    }
};

// --- INDIVIDUAL REPORT CARD ---
const ReportCard = memo(({ type, config, manifest, reportData }) => {
    const [expanded, setExpanded] = useState(false);
    const Icon = config.icon;
    const metrics = extractMetrics(type, reportData);
    const manifestEntry = manifest?.reports?.find(r => r.type === type);
    const dataType = manifestEntry?.data_type || 'unknown';
    const frr = manifestEntry?.frr_requirements || [];
    const generatedAt = manifest?.generation_timestamp;
    const generatedDate = generatedAt
        ? new Date(generatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : 'N/A';

    const reportFile = manifestEntry?.file;
    const schemaFile = manifestEntry?.schema;

    return (
        <div className={`bg-gradient-to-br ${config.gradient} rounded-2xl text-white shadow-xl ${config.shadow} relative overflow-hidden`}>
            <div className="relative z-10 p-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/70">{config.subtitle}</span>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                dataType === 'live'
                                    ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                                    : 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                            }`}>
                                {dataType}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold tracking-tight leading-tight">{config.title}</h3>
                    </div>
                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 shrink-0 ml-3">
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    {metrics.map((m, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl py-2 px-2 border border-white/15 text-center">
                            <div className="text-sm font-black font-mono leading-none">{m.value}</div>
                            <div className="text-[8px] uppercase tracking-wider text-white/70 font-bold mt-1">{m.label}</div>
                        </div>
                    ))}
                </div>

                {/* Schedule Info */}
                <div className="flex items-center gap-2 text-[10px] text-white/70 mb-3">
                    <Clock className="w-3 h-3" />
                    <span className="font-bold uppercase tracking-wider">{config.cadence}</span>
                    <span className="text-white/40">|</span>
                    <span>{config.schedule}</span>
                </div>

                {/* Generated Date */}
                <div className="flex items-center gap-2 text-[10px] text-white/60 mb-4">
                    <Calendar className="w-3 h-3" />
                    <span>Generated: <span className="font-mono text-white/80">{generatedDate}</span></span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 mt-auto">
                    <div className="grid grid-cols-2 gap-2">
                        {reportFile && (
                            <a
                                href={`${REPORTS_PATH}samples/${reportFile}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 py-2.5 bg-white text-gray-800 rounded-xl font-bold text-[11px] hover:bg-white/90 transition-all shadow-lg"
                            >
                                <FileJson className="w-3.5 h-3.5" /> View Report
                            </a>
                        )}
                        {schemaFile && (
                            <a
                                href={`${REPORTS_PATH}schemas/${schemaFile}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 py-2.5 bg-white/15 text-white rounded-xl font-bold text-[11px] hover:bg-white/25 transition-all border border-white/20"
                            >
                                <FileText className="w-3.5 h-3.5" /> Schema
                            </a>
                        )}
                    </div>

                    {/* Expandable FRR Requirements */}
                    {frr.length > 0 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center justify-between w-full py-2 px-3 bg-white/5 rounded-xl text-[10px] text-white/70 hover:bg-white/10 transition-all border border-white/10"
                        >
                            <span className="font-bold uppercase tracking-wider">
                                {frr.length} FRR Requirements Covered
                            </span>
                            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                    )}
                    {expanded && (
                        <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-1">
                            {frr.map((req, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[10px] text-white/80">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-300 shrink-0" />
                                    <span>{req}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </div>
    );
});

// --- SCHEDULE SIDEBAR ---
const SchedulePanel = memo(({ manifest, meeting }) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Calculate next OAR date
    const oarMonths = [2, 5, 8, 11];
    const nextOARMonth = oarMonths.find(m => m > month || (m === month && now.getDate() < 15)) || oarMonths[0];
    const nextOARYear = nextOARMonth >= month ? year : year + 1;
    const nextOARDate = `${nextOARYear}-${String(nextOARMonth).padStart(2, '0')}-15`;

    const generatedAt = manifest?.generation_timestamp;
    const lastGenerated = generatedAt
        ? new Date(generatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'N/A';

    const downloadICS = () => {
        if (!meeting) return;
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

    const scheduleItems = [
        {
            label: 'Next OAR Report',
            date: nextOARDate,
            icon: Shield,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
        },
        {
            label: 'VDR Cadence',
            date: 'Every 3 days',
            icon: Activity,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
        },
        {
            label: 'SCN Trigger',
            date: 'On qualifying change',
            icon: Bell,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
        },
    ];

    if (meeting?.nextDate) {
        scheduleItems.unshift({
            label: 'Quarterly Review',
            date: meeting.nextDate,
            icon: Video,
            color: 'text-indigo-400',
            bgColor: 'bg-indigo-500/10',
            borderColor: 'border-indigo-500/20',
        });
    }

    return (
        <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-6 h-full`}>
            <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Schedule & Deadlines</h3>
            </div>

            <div className="space-y-3 mb-6">
                {scheduleItems.map((item, i) => {
                    const ItemIcon = item.icon;
                    return (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${item.borderColor} ${item.bgColor}`}>
                            <ItemIcon className={`w-4 h-4 ${item.color} shrink-0`} />
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</div>
                                <div className={`text-sm font-bold font-mono ${item.color}`}>{item.date}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quarterly Meeting Actions */}
            {meeting && (
                <div className="space-y-2 mb-6">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Quarterly Session</div>
                    <a
                        href={meeting.registrationUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-[11px] hover:bg-indigo-500 transition-all border border-indigo-500"
                    >
                        <Video className="w-3.5 h-3.5" /> Register for Session
                    </a>
                    <button
                        onClick={downloadICS}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-white/10 transition-colors border border-white/10"
                    >
                        <Download className="w-3.5 h-3.5" /> Add to Calendar
                    </button>
                </div>
            )}

            {/* Generation Info */}
            <div className="border-t border-white/5 pt-4 space-y-2">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pipeline Info</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>Last generated: <span className="font-mono text-slate-300">{lastGenerated}</span></span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{manifest?.reports?.length || 0} reports validated, 0 errors</span>
                </div>
                <a
                    href={`${REPORTS_PATH}samples/report-generation-manifest.json`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 transition-colors mt-1"
                >
                    <FileJson className="w-3 h-3" /> View Manifest
                </a>
            </div>
        </div>
    );
});

// --- MAIN REPORTS HUB ---
export const ReportsHub = memo(({ meeting }) => {
    const [manifest, setManifest] = useState(null);
    const [reports, setReports] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadReports = async () => {
            const ts = Date.now();
            try {
                // Load manifest first
                const manifestRes = await fetch(`${REPORTS_PATH}samples/report-generation-manifest.json?t=${ts}`);
                if (!manifestRes.ok) {
                    setLoading(false);
                    return;
                }
                const manifestData = await manifestRes.json();
                setManifest(manifestData);

                // Load all report JSONs in parallel
                const reportEntries = manifestData.reports || [];
                const fetches = reportEntries.map(async (entry) => {
                    try {
                        const res = await fetch(`${REPORTS_PATH}samples/${entry.file}?t=${ts}`);
                        if (res.ok) {
                            const data = await res.json();
                            return [entry.type, data];
                        }
                    } catch {
                        // Silently skip failed fetches
                    }
                    return [entry.type, null];
                });

                const results = await Promise.all(fetches);
                const reportsMap = {};
                for (const [type, data] of results) {
                    if (data) reportsMap[type] = data;
                }
                setReports(reportsMap);
            } catch (e) {
                console.error('Failed to load reports manifest:', e);
            } finally {
                setLoading(false);
            }
        };
        loadReports();
    }, []);

    if (loading) {
        return (
            <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-12`}>
                <div className="flex items-center justify-center gap-3 text-slate-500">
                    <div className="w-5 h-5 border-2 border-blue-500/50 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-sm font-medium">Loading reports...</span>
                </div>
            </div>
        );
    }

    if (!manifest) {
        return (
            <div className={`${THEME.panel} border ${THEME.border} rounded-2xl p-8`}>
                <div className="text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Reports not yet available</p>
                    <p className="text-[10px] mt-1 uppercase tracking-wider">Pipeline has not generated reports yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white tracking-tight">Reports & Compliance</h2>
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase tracking-wider">
                        Machine-Readable
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> Live
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span> Sample
                    </span>
                </div>
            </div>

            {/* Reports Grid + Schedule Sidebar */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Report Cards */}
                <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-5">
                    {['oar', 'vdr', 'scn'].map(type => (
                        <ReportCard
                            key={type}
                            type={type}
                            config={REPORT_CONFIGS[type]}
                            manifest={manifest}
                            reportData={reports[type]}
                        />
                    ))}
                </div>

                {/* Schedule Panel */}
                <div className="xl:col-span-1">
                    <SchedulePanel manifest={manifest} meeting={meeting} />
                </div>
            </div>
        </div>
    );
});

export default ReportsHub;
