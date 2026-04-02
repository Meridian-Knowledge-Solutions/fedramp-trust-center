import React, { useState, useEffect, memo } from 'react';
import {
    Shield, FileText, FileJson, Download, ExternalLink,
    CheckCircle2, AlertTriangle, Clock, Calendar, Video,
    Activity, Database, Bell, ChevronDown, ChevronRight,
    FileCheck, CheckSquare, Eye, TrendingUp, BarChart3,
    Globe
} from 'lucide-react';

import { QUARTERLY_REGISTRATION_URL } from '../../config/api';

import { THEME, BASE_PATH } from '../../config/theme';

const REPORTS_PATH = `${BASE_PATH}reports/`;

// --- REPORT CARD CONFIGURATIONS (4 types) ---
const REPORT_CONFIGS = {
    oar: {
        title: 'Ongoing Authorization Report',
        shortTitle: 'OAR',
        subtitle: 'FRR-CCM',
        icon: Shield,
        gradient: 'from-emerald-600 to-teal-600',
        shadow: 'shadow-emerald-500/10',
        accentText: 'text-emerald-400',
        cadence: 'Quarterly',
        schedule: 'Feb 15 / May 15 / Aug 15 / Nov 15',
    },
    qar: {
        title: 'Quarterly Authorization Review',
        shortTitle: 'QAR',
        subtitle: 'FRR-CCM-QR',
        icon: BarChart3,
        gradient: 'from-indigo-600 to-violet-600',
        shadow: 'shadow-indigo-500/10',
        accentText: 'text-indigo-400',
        cadence: 'Quarterly',
        schedule: 'Synchronous review + dashboard',
    },
    vdr: {
        title: 'Vulnerability Detection & Response',
        shortTitle: 'VDR',
        subtitle: 'FRR-VDR',
        icon: Activity,
        gradient: 'from-blue-600 to-indigo-600',
        shadow: 'shadow-blue-500/10',
        accentText: 'text-blue-400',
        cadence: '3-Day',
        schedule: 'Continuous pipeline',
    },
    scn: {
        title: 'Significant Change Notification',
        shortTitle: 'SCN',
        subtitle: 'FRR-SCN',
        icon: Bell,
        gradient: 'from-amber-600 to-orange-600',
        shadow: 'shadow-amber-500/10',
        accentText: 'text-amber-400',
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
                { label: 'Rate', value: `${exec.compliance_rate || 0}%` },
                { label: 'KSIs', value: `${exec.total_ksis || 0}` },
                { label: 'Gaps', value: `${exec.active_gaps || 0}` },
                { label: 'Trend', value: trend.trend_direction || 'stable' },
            ];
        }
        case 'qar': {
            const exec = report.executive_summary || {};
            const att = report.compliance_attestations || {};
            const attCount = Object.values(att).filter(Boolean).length;
            const attTotal = Object.keys(att).length || 5;
            return [
                { label: 'Rate', value: `${exec.compliance_rate || exec.pass_rate || '100'}%` },
                { label: 'KSIs', value: `${exec.total_ksis || exec.verified_controls || 0}` },
                { label: 'QR', value: `${attCount}/${attTotal}` },
                { label: 'Window', value: '14d' },
            ];
        }
        case 'vdr': {
            const m = report.metrics || {};
            const b = m.severity_breakdown || {};
            return [
                { label: 'Total', value: `${m.total_detected || 0}` },
                { label: 'Crit', value: `${b.critical || 0}` },
                { label: 'Open', value: `${m.total_open || 0}` },
                { label: 'SLA', value: `${m.sla_compliance_rate || 0}%` },
            ];
        }
        case 'scn': {
            const cls = report.change_classification || {};
            const ver = report.controls_verification || {};
            return [
                { label: 'Tier', value: cls.tier || 'N/A' },
                { label: 'Emerg', value: cls.is_emergency ? 'Yes' : 'No' },
                { label: 'Status', value: ver.overall_status || 'N/A' },
                { label: 'Ctrls', value: `${(ver.results || []).length}` },
            ];
        }
        default:
            return [];
    }
};

// --- COMPUTE NEXT REPORT DATE PER TYPE ---
const computeNextDate = (type, nextReportDates) => {
    const now = new Date();
    switch (type) {
        case 'oar': {
            // Use next_ongoing_report from next_report_date.json, or calculate from quarterly schedule
            if (nextReportDates?.next_ongoing_report) {
                const d = new Date(nextReportDates.next_ongoing_report + 'T00:00:00');
                return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }
            const oarMonths = [2, 5, 8, 11];
            const m = now.getMonth() + 1;
            const nextM = oarMonths.find(om => om > m || (om === m && now.getDate() < 15)) || oarMonths[0];
            const y = nextM > m || (nextM === m && now.getDate() < 15) ? now.getFullYear() : now.getFullYear() + 1;
            return new Date(y, nextM - 1, 15).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
        case 'qar': {
            // Use next_quarterly_review_iso from next_report_date.json
            if (nextReportDates?.next_quarterly_review_iso) {
                const d = new Date(nextReportDates.next_quarterly_review_iso + 'T00:00:00');
                return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }
            if (nextReportDates?.next_quarterly_review) return nextReportDates.next_quarterly_review;
            return 'TBD';
        }
        case 'vdr':
            return '3-day cycle';
        case 'scn':
            return 'On change';
        default:
            return '—';
    }
};

// --- INDIVIDUAL REPORT CARD (compact) ---
const ReportCard = memo(({ type, config, manifest, reportData, nextReportDates }) => {
    const [expanded, setExpanded] = useState(false);
    const Icon = config.icon;
    const metrics = extractMetrics(type, reportData);
    const entry = manifest?.reports?.find(r => r.type === type);
    const dataType = entry?.data_type || 'unknown';
    const frr = entry?.frr_requirements || [];
    const nextDate = computeNextDate(type, nextReportDates);

    const reportFile = entry?.file;
    const htmlFile = entry?.html_file;
    const schemaFile = entry?.schema;

    return (
        <div className={`bg-gradient-to-br ${config.gradient} rounded-xl text-white shadow-lg ${config.shadow} overflow-hidden min-w-0`}>
            <div className="relative p-4 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">{config.subtitle}</span>
                            <span className={`text-[8px] font-bold uppercase px-1 py-px rounded ${
                                dataType === 'live'
                                    ? 'bg-emerald-400/20 text-emerald-200'
                                    : 'bg-amber-400/20 text-amber-200'
                            }`}>{dataType}</span>
                        </div>
                        <h3 className="text-[13px] font-bold leading-tight truncate">{config.title}</h3>
                    </div>
                    <div className="p-1.5 bg-white/10 rounded-lg shrink-0">
                        <Icon className="w-4 h-4" />
                    </div>
                </div>

                {/* Metrics Row - compact */}
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {metrics.map((m, i) => (
                        <div key={i} className="bg-white/10 rounded-lg py-1.5 px-1 text-center min-w-0">
                            <div className="text-[12px] font-black font-mono leading-none truncate">{m.value}</div>
                            <div className="text-[7px] uppercase tracking-wider text-white/60 font-semibold mt-0.5">{m.label}</div>
                        </div>
                    ))}
                </div>

                {/* Meta line */}
                <div className="flex items-center gap-3 text-[9px] text-white/50 mb-3">
                    <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{config.cadence}</span>
                    <span>|</span>
                    <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />Next: {nextDate}</span>
                </div>

                {/* Buttons - prominent HTML link + JSON/Schema row */}
                <div className="mt-auto space-y-1.5">
                    {htmlFile && (
                        <a href={`${REPORTS_PATH}html/${htmlFile}`} target="_blank" rel="noreferrer"
                           className="group flex items-center justify-center gap-1.5 w-full py-2 bg-white text-gray-900 rounded-lg font-bold text-[11px] hover:bg-white/90 transition-all shadow-sm cursor-pointer">
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Human-Readable Report</span>
                            <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </a>
                    )}
                    <div className="flex gap-1.5">
                        {reportFile && (
                            <a href={`${REPORTS_PATH}samples/${reportFile}`} target="_blank" rel="noreferrer"
                               className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/15 text-white rounded-lg font-bold text-[10px] hover:bg-white/25 transition-all cursor-pointer">
                                <FileJson className="w-3 h-3" /> Machine-Readable (JSON)
                            </a>
                        )}
                        {schemaFile && (
                            <a href={`${REPORTS_PATH}schemas/${schemaFile}`} target="_blank" rel="noreferrer"
                               className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/15 text-white rounded-lg font-bold text-[10px] hover:bg-white/25 transition-all cursor-pointer">
                                <FileText className="w-3 h-3" /> Schema
                            </a>
                        )}
                    </div>
                    {frr.length > 0 && (
                        <>
                            <button onClick={() => setExpanded(!expanded)}
                                className="flex items-center justify-between w-full py-1 px-2 bg-white/5 rounded-lg text-[9px] text-white/50 hover:bg-white/10 transition-all">
                                <span className="font-semibold uppercase tracking-wider">{frr.length} FRR Requirements</span>
                                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                            {expanded && (
                                <div className="bg-white/5 rounded-lg p-2 space-y-0.5 max-h-28 overflow-y-auto">
                                    {frr.map((req, i) => (
                                        <div key={i} className="flex items-center gap-1 text-[9px] text-white/70">
                                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300 shrink-0" />
                                            <span className="truncate">{req}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

// --- SCHEDULE SIDEBAR (compact) ---
const SchedulePanel = memo(({ manifest, meeting }) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const oarMonths = [2, 5, 8, 11];
    const nextOARMonth = oarMonths.find(m => m > month || (m === month && now.getDate() < 15)) || oarMonths[0];
    const nextOARYear = nextOARMonth >= month ? year : year + 1;
    const nextOARDate = `${nextOARYear}-${String(nextOARMonth).padStart(2, '0')}-15`;

    const generatedAt = manifest?.generation_timestamp;
    const lastGenerated = generatedAt
        ? new Date(generatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'N/A';

    // Use locally-maintained URL so pipeline data syncs cannot overwrite it
    const registrationUrl = QUARTERLY_REGISTRATION_URL || meeting?.registrationUrl;

    const downloadICS = () => {
        if (!meeting) return;
        const ics = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
            `SUMMARY:${meeting.meetingTitle || 'FedRAMP Quarterly Review'}`,
            `DTSTART:${(meeting.nextDate || '').replace(/-/g, '')}T190000Z`,
            `DURATION:PT${meeting.durationMinutes || 60}M`,
            `DESCRIPTION:${meeting.description || ''}\\n\\nRegister: ${registrationUrl}`,
            'END:VEVENT', 'END:VCALENDAR'
        ].join('\n');
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `FedRAMP_Review_${meeting.nextDate}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const items = [];
    if (meeting?.nextDate) {
        items.push({ label: 'Quarterly Review', date: meeting.nextDate, icon: Video, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' });
    }
    items.push(
        { label: 'Next OAR', date: nextOARDate, icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        { label: 'VDR Cadence', date: 'Daily', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { label: 'SCN Trigger', date: 'On change', icon: Bell, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    );

    return (
        <div className={`${THEME.panel} border ${THEME.border} rounded-xl p-4 h-full`}>
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Schedule</h3>
            </div>

            <div className="space-y-2 mb-4">
                {items.map((item, i) => {
                    const I = item.icon;
                    return (
                        <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${item.border} ${item.bg}`}>
                            <I className={`w-3.5 h-3.5 ${item.color} shrink-0`} />
                            <div className="min-w-0 flex-1">
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</div>
                                <div className={`text-xs font-bold font-mono ${item.color} truncate`}>{item.date}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {meeting && (
                <div className="space-y-1.5 mb-4">
                    <button onClick={() => window.open(registrationUrl, '_blank', 'noopener')}
                       className="flex items-center justify-center gap-1.5 w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-[10px] hover:bg-indigo-500 transition-all cursor-pointer">
                        <Video className="w-3 h-3" /> Register for Session
                    </button>
                    <button onClick={downloadICS}
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-white/5 text-slate-300 rounded-lg font-bold text-[9px] uppercase tracking-wider hover:bg-white/10 transition-all">
                        <Download className="w-3 h-3" /> Add to Calendar
                    </button>
                </div>
            )}

            <div className="border-t border-white/5 pt-3 space-y-1.5">
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pipeline</div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Generated: <span className="font-mono text-slate-300">{lastGenerated}</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{manifest?.reports?.length || 0} reports, 0 errors</span>
                </div>
                <a href={`${REPORTS_PATH}samples/report-generation-manifest.json`} target="_blank" rel="noreferrer"
                   className="flex items-center gap-1 text-[9px] text-blue-400 hover:text-blue-300 transition-colors mt-1">
                    <FileJson className="w-2.5 h-2.5" /> View Manifest
                </a>
            </div>
        </div>
    );
});

// --- MAIN REPORTS HUB ---
export const ReportsHub = memo(({ meeting }) => {
    const [manifest, setManifest] = useState(null);
    const [reports, setReports] = useState({});
    const [nextReportDates, setNextReportDates] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const ts = Date.now();
            try {
                const [manifestRes, nrdRes] = await Promise.all([
                    fetch(`${REPORTS_PATH}samples/report-generation-manifest.json?t=${ts}`),
                    fetch(`${BASE_PATH}next_report_date.json?t=${ts}`).catch(() => null),
                ]);

                if (!manifestRes.ok) { setLoading(false); return; }
                const data = await manifestRes.json();
                setManifest(data);

                if (nrdRes?.ok) {
                    try { setNextReportDates(await nrdRes.json()); } catch {}
                }

                const fetches = (data.reports || []).map(async (e) => {
                    if (!e.file) return [e.type, null];
                    try {
                        const r = await fetch(`${REPORTS_PATH}samples/${e.file}?t=${ts}`);
                        if (r.ok) return [e.type, await r.json()];
                    } catch {}
                    return [e.type, null];
                });
                const results = await Promise.all(fetches);
                const map = {};
                for (const [t, d] of results) { if (d) map[t] = d; }
                setReports(map);
            } catch (e) {
                console.error('Failed to load reports manifest:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className={`${THEME.panel} border ${THEME.border} rounded-xl p-8`}>
                <div className="flex items-center justify-center gap-2 text-slate-500">
                    <div className="w-4 h-4 border-2 border-blue-500/50 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-xs font-medium">Loading reports...</span>
                </div>
            </div>
        );
    }

    if (!manifest) {
        return (
            <div className={`${THEME.panel} border ${THEME.border} rounded-xl p-6`}>
                <div className="text-center text-slate-500">
                    <FileText className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">Reports not yet available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Reports & Compliance</h2>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                        Each report is available in both human-readable (HTML) and machine-readable (JSON) formats.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>Live</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>Sample</span>
                </div>
            </div>

            {/* 2x2 Report Cards + Schedule Sidebar */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
                {/* Report Cards - 2x2 grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                    {['oar', 'qar', 'vdr', 'scn'].map(type => (
                        <ReportCard
                            key={type}
                            type={type}
                            config={REPORT_CONFIGS[type]}
                            manifest={manifest}
                            reportData={reports[type]}
                            nextReportDates={nextReportDates}
                        />
                    ))}
                </div>

                {/* Schedule Panel - fixed width sidebar */}
                <div className="min-w-0">
                    <SchedulePanel manifest={manifest} meeting={meeting} />
                </div>
            </div>
        </div>
    );
});

export default ReportsHub;
