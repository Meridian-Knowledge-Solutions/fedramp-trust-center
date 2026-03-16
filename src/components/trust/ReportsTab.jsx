import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  FileText, Download, Eye, Calendar, Clock, Shield, ExternalLink,
  FileJson, FileCode, ChevronRight, AlertCircle, CheckCircle2, FileDown
} from 'lucide-react';
import { useTrustCenterData } from '../../hooks/useTrustCenterData';

const THEME = {
  panel: 'bg-[#121217]',
  border: 'border-white/10',
};

const REPORT_TYPE_CONFIG = {
  vdr: { label: 'VDR', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', description: 'Vulnerability Detection & Response' },
  oar: { label: 'OAR', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', description: 'Ongoing Authorization Report' },
  scn: { label: 'SCN', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', description: 'Significant Change Notification' },
  qar: { label: 'QAR', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', description: 'Quarterly Authorization Review' },
};

const ReportCard = memo(({ report, manifestEntry, onViewJson, onViewHtml, onDownload }) => {
  const typeConfig = REPORT_TYPE_CONFIG[report.report_type] || {
    label: report.report_type?.toUpperCase() || 'RPT',
    color: 'text-slate-400',
    bg: 'bg-white/5',
    border: 'border-white/10',
    description: report.title
  };

  const isLive = report.data_type === 'live' || manifestEntry?.data_type === 'live';

  return (
    <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-5 hover:border-white/20 transition-all group`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border ${typeConfig.border} ${typeConfig.bg}`}>
            <FileText size={18} className={typeConfig.color} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium text-sm">{typeConfig.description}</span>
              <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded ${typeConfig.bg} ${typeConfig.color} border ${typeConfig.border} uppercase tracking-wider`}>
                {typeConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isLive && (
                <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Data
                </span>
              )}
              {!isLive && report.data_type === 'sample' && (
                <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Sample</span>
              )}
              {manifestEntry?.validation_errors === 0 && (
                <span className="flex items-center gap-1 text-[9px] text-emerald-400">
                  <CheckCircle2 size={10} />
                  Schema Valid
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FRR Requirements */}
      {manifestEntry?.frr_requirements && manifestEntry.frr_requirements.length > 0 && (
        <div className="mb-4">
          <div className="text-[9px] text-slate-600 uppercase tracking-wider font-bold mb-2">FRR Requirements</div>
          <div className="flex flex-wrap gap-1.5">
            {manifestEntry.frr_requirements.map((frr, i) => (
              <span key={i} className="px-2 py-0.5 text-[9px] text-slate-400 bg-white/5 rounded border border-white/5 font-mono">
                {frr.split(' (')[0]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
        {onViewJson && (
          <button
            onClick={onViewJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all border border-white/5"
          >
            <FileJson size={12} />
            JSON
          </button>
        )}
        {onViewHtml && (
          <button
            onClick={onViewHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all border border-white/5"
          >
            <FileCode size={12} />
            HTML
          </button>
        )}
        {onDownload && (
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider transition-all border border-blue-500/20 ml-auto"
          >
            <Download size={12} />
            Download
          </button>
        )}
      </div>
    </div>
  );
});

const AssessmentCard = memo(({ assessment, onDownload }) => {
  // Handle both string and object formats for assessor/result
  const assessorName = typeof assessment.assessor === 'object'
    ? `${assessment.assessor.name} — ${assessment.assessor.organization}`
    : assessment.assessor;
  const resultStatus = typeof assessment.result === 'object'
    ? assessment.result.status
    : assessment.result;
  const isPass = resultStatus === 'PASS' || resultStatus === 'Authorized' ||
    resultStatus === 'COMPLETED' || (typeof resultStatus === 'string' && resultStatus.includes('Pass'));
  const assessmentDate = assessment.date || assessment.assessment_date;
  const description = assessment.scope?.description || assessment.description || '';

  return (
    <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-5 hover:border-white/20 transition-all`}>
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10">
          <Shield size={18} className="text-cyan-400" />
        </div>
        <div className="flex-1">
          <div className="text-white font-medium text-sm">{assessment.title}</div>
          {description && <p className="text-slate-500 text-xs mt-1">{description}</p>}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {assessmentDate}
            </span>
            <span className="font-mono">{assessorName}</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
              isPass
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {resultStatus}
            </span>
          </div>
          {/* Show result details if available */}
          {typeof assessment.result === 'object' && assessment.result.passed !== undefined && (
            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600 font-mono">
              <span>{assessment.result.passed}/{assessment.result.total} passed</span>
              {assessment.result.observations > 0 && (
                <span>{assessment.result.observations} observations</span>
              )}
              {assessment.result.critical_findings > 0 && (
                <span className="text-amber-500">{assessment.result.critical_findings} critical finding{assessment.result.critical_findings > 1 ? 's' : ''}</span>
              )}
            </div>
          )}
        </div>
        {onDownload && (
          <button
            onClick={onDownload}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-500 hover:text-white border border-white/5"
            title="Download PDF"
          >
            <FileDown size={16} />
          </button>
        )}
      </div>
    </div>
  );
});

// Viewer modal for JSON/HTML content
const ContentViewer = memo(({ content, format, title, onClose }) => {
  if (!content) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className={`${THEME.panel} rounded-xl border ${THEME.border} w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-white/5 bg-[#09090b] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {format === 'json' ? <FileJson size={14} className="text-amber-400" /> : <FileCode size={14} className="text-blue-400" />}
            <span className="text-white font-medium text-sm">{title}</span>
            <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-white/5 text-slate-500 border border-white/5 uppercase">
              {format}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-sm font-bold">
            ESC
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {format === 'json' ? (
            <pre className="p-5 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
              {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
            </pre>
          ) : (
            <iframe
              srcDoc={content}
              className="w-full h-full min-h-[600px] bg-white"
              title={title}
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </div>
    </div>
  );
});

export const ReportsTab = memo(() => {
  const {
    reports, assessments, reportManifest, nextReportDate,
    assessmentManifest, getFileUrl, loading, error
  } = useTrustCenterData();

  const [viewerContent, setViewerContent] = useState(null);
  const [viewerFormat, setViewerFormat] = useState('json');
  const [viewerTitle, setViewerTitle] = useState('');

  // Infer report_type from filename for manifest entries that don't have it
  const inferReportType = (filePath) => {
    const name = filePath.toLowerCase();
    if (name.includes('vdr')) return 'vdr';
    if (name.includes('oar')) return 'oar';
    if (name.includes('scn')) return 'scn';
    if (name.includes('qar')) return 'qar';
    return null;
  };

  // Get only report-category files (not assessments)
  const reportFiles = reports.filter(r => r.category === 'reports');

  // Group reports: JSON data reports vs HTML rendered reports
  const jsonReports = reportFiles.filter(r => {
    const rt = inferReportType(r.path);
    return r.path.endsWith('.json') && rt && !r.path.includes('manifest') && !r.path.includes('next_report');
  }).map(r => ({ ...r, report_type: inferReportType(r.path) }));

  const htmlReports = reportFiles.filter(r => r.path.endsWith('.html'))
    .map(r => ({ ...r, report_type: inferReportType(r.path) }));

  // Deduplicate: show one card per report_type with access to both formats
  const reportTypes = [...new Set(jsonReports.map(r => r.report_type).filter(Boolean))];

  const handleViewJson = useCallback(async (report) => {
    try {
      const res = await fetch(getFileUrl(report.path));
      if (res.ok) {
        const data = await res.json();
        setViewerContent(data);
        setViewerFormat('json');
        setViewerTitle(report.title || report.path.split('/').pop());
      }
    } catch {
      // Silent fail
    }
  }, [getFileUrl]);

  const handleViewHtml = useCallback(async (htmlReport) => {
    try {
      const res = await fetch(getFileUrl(htmlReport.path));
      if (res.ok) {
        const html = await res.text();
        setViewerContent(html);
        setViewerFormat('html');
        setViewerTitle(htmlReport.title || htmlReport.path.split('/').pop());
      }
    } catch {
      // Silent fail
    }
  }, [getFileUrl]);

  const handleDownload = useCallback((report) => {
    const url = getFileUrl(report.path);
    const a = document.createElement('a');
    a.href = url;
    a.download = report.path.split('/').pop();
    a.click();
  }, [getFileUrl]);

  const handleAssessmentDownload = useCallback((assessment) => {
    // Support both old format (assessment.file) and new format (assessment.files.pdf)
    const pdfFile = assessment.files?.pdf || assessment.file;
    if (!pdfFile) return;
    const fileEntry = assessments.find(r => r.path.includes(pdfFile)) ||
      reports.find(r => r.path.includes(pdfFile));
    if (fileEntry) {
      const url = getFileUrl(fileEntry.path);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfFile;
      a.click();
    }
  }, [reports, assessments, getFileUrl]);

  // Close viewer on ESC
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setViewerContent(null); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-8 text-center`}>
        <AlertCircle size={40} className="mx-auto mb-3 text-slate-600" />
        <p className="text-slate-400 text-sm">Unable to load reports</p>
        <p className="text-slate-600 text-xs mt-1">{error}</p>
      </div>
    );
  }

  // Handle both array format (new) and {assessments: [...]} format (old)
  const assessmentItems = Array.isArray(assessmentManifest)
    ? assessmentManifest
    : (assessmentManifest?.assessments || []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header with next report date */}
      <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-6`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight">Reports & Assessments</h2>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-mono">
              Reports &amp; Assessments
            </p>
          </div>
          {nextReportDate && (
            <div className="flex items-center gap-4 px-4 py-2.5 rounded-lg bg-[#09090b] border border-white/5">
              <div className="text-center">
                <div className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Next Report</div>
                <div className="text-white font-mono text-sm font-bold">{nextReportDate.next_ongoing_report}</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Next Review</div>
                <div className="text-white font-mono text-sm font-bold">{nextReportDate.next_quarterly_review}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Generation Info - timestamp only */}
      {reportManifest && (
        <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-4`}>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Clock size={12} />
            <span>Last generated <span className="text-slate-400 font-mono">{new Date(reportManifest.generation_timestamp).toLocaleDateString()}</span></span>
          </div>
        </div>
      )}

      {/* Compliance Reports Section */}
      {reportTypes.length > 0 && (
        <div>
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <FileText size={14} className="text-blue-400" />
            Compliance Reports
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map(type => {
              const jsonReport = jsonReports.find(r => r.report_type === type);
              const htmlReport = htmlReports.find(r => r.report_type === type);
              const manifestEntry = reportManifest?.reports?.find(r => r.type === type);

              return (
                <ReportCard
                  key={type}
                  report={jsonReport}
                  manifestEntry={manifestEntry}
                  onViewJson={jsonReport ? () => handleViewJson(jsonReport) : null}
                  onViewHtml={htmlReport ? () => handleViewHtml(htmlReport) : null}
                  onDownload={jsonReport ? () => handleDownload(jsonReport) : null}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Assessment Documents Section */}
      {assessmentItems.length > 0 && (
        <div>
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <Shield size={14} className="text-cyan-400" />
            Assessment Documents
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {assessmentItems.map((assessment, i) => (
              <AssessmentCard
                key={i}
                assessment={assessment}
                onDownload={() => handleAssessmentDownload(assessment)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {reportTypes.length === 0 && assessmentItems.length === 0 && (
        <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-8 text-center`}>
          <FileText size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">No reports or assessments available</p>
          <p className="text-slate-600 text-xs mt-1">Content will appear after the next pipeline run</p>
        </div>
      )}

      {/* Content Viewer Overlay */}
      {viewerContent && (
        <ContentViewer
          content={viewerContent}
          format={viewerFormat}
          title={viewerTitle}
          onClose={() => setViewerContent(null)}
        />
      )}
    </div>
  );
});
