import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  FileText, FileJson, FileCode, AlertCircle
} from 'lucide-react';
import { useTrustCenterData } from '../../hooks/useTrustCenterData';

const REPORT_TYPE_CONFIG = {
  vdr: { label: 'VDR', description: 'Vulnerability Detection & Response' },
  oar: { label: 'OAR', description: 'Ongoing Authorization Report' },
  scn: { label: 'SCN', description: 'Significant Change Notification' },
  qar: { label: 'QAR', description: 'Quarterly Authorization Review' },
};

// Compliance report as a telemetry-console list row.
const ReportRow = memo(({ report, manifestEntry, onViewJson, onViewHtml, onDownload }) => {
  const typeConfig = REPORT_TYPE_CONFIG[report.report_type] || {
    label: report.report_type?.toUpperCase() || 'RPT',
    description: report.title
  };

  const isLive = report.data_type === 'live' || manifestEntry?.data_type === 'live';

  // Build a mono-style descriptor line from the available metadata.
  const descParts = [typeConfig.label];
  if (isLive) descParts.push('LIVE DATA');
  else if (report.data_type === 'sample') descParts.push('SAMPLE');
  if (manifestEntry?.validation_errors === 0) descParts.push('SCHEMA VALID');
  if (manifestEntry?.frr_requirements && manifestEntry.frr_requirements.length > 0) {
    descParts.push(manifestEntry.frr_requirements.map(frr => frr.split(' (')[0]).join(' · '));
  }
  const desc = descParts.join(' · ');

  // Primary row action: prefer JSON view, then HTML, then download.
  const primary = onViewJson || onViewHtml || onDownload || undefined;

  return (
    <div className="lrow" onClick={primary}>
      <div>
        <div className="t">{typeConfig.description}</div>
        <div className="d">{desc}</div>
      </div>
      <div className="meta" onClick={(e) => e.stopPropagation()}>
        {onViewJson && (
          <button
            onClick={onViewJson}
            className="badge"
            style={{ cursor: 'pointer', background: 'none' }}
          >
            <FileJson size={11} style={{ color: 'var(--amber)' }} /> JSON
          </button>
        )}
        {onViewHtml && (
          <button
            onClick={onViewHtml}
            className="badge i"
            style={{ cursor: 'pointer', background: 'none' }}
          >
            <FileCode size={11} /> HTML
          </button>
        )}
        {onDownload && (
          <button
            onClick={onDownload}
            className="badge s"
            style={{ cursor: 'pointer', background: 'none' }}
          >
            GET
          </button>
        )}
        <span className="pub">OPEN ACCESS</span>
        <span className="ar">→</span>
      </div>
    </div>
  );
});

// Assessment document as a telemetry-console list row.
const AssessmentRow = memo(({ assessment, onDownload }) => {
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

  // Compose a mono descriptor: date · assessor · result, plus optional detail.
  const descParts = [];
  if (assessmentDate) descParts.push(assessmentDate);
  if (assessorName) descParts.push(assessorName);
  if (description) descParts.push(description);
  if (typeof assessment.result === 'object' && assessment.result.passed !== undefined) {
    descParts.push(`${assessment.result.passed}/${assessment.result.total} passed`);
    if (assessment.result.observations > 0) descParts.push(`${assessment.result.observations} observations`);
    if (assessment.result.critical_findings > 0) {
      descParts.push(`${assessment.result.critical_findings} critical finding${assessment.result.critical_findings > 1 ? 's' : ''}`);
    }
  }
  const desc = descParts.join(' · ');

  return (
    <div className="lrow" onClick={onDownload || undefined}>
      <div>
        <div className="t">{assessment.title}</div>
        {desc && <div className="d">{desc}</div>}
      </div>
      <div className="meta">
        {resultStatus && (
          <span className={isPass ? 'pub' : 'nda'}>{resultStatus}</span>
        )}
        {onDownload && <span className="ar">↓</span>}
      </div>
    </div>
  );
});

// Viewer modal for JSON content or an HTML report URL
const ContentViewer = memo(({ content, url, format, title, onClose }) => {
  if (!content && !url) return null;

  const isHtml = format === 'html';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className={`panel w-full ${isHtml ? 'max-w-7xl h-[90vh]' : 'max-w-5xl max-h-[85vh]'} flex flex-col overflow-hidden shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className="ph" style={{ flexShrink: 0 }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {format === 'json'
              ? <FileJson size={14} style={{ color: 'var(--amber)' }} />
              : <FileCode size={14} style={{ color: 'var(--indigo)' }} />}
            {title}
            <span className="badge" style={{ textTransform: 'uppercase' }}>{format}</span>
          </h4>
          <button onClick={onClose} className="map" style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--ash)' }}>
            ESC
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {format === 'json' ? (
            <pre className="code" style={{ whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>
              {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
            </pre>
          ) : (
            // Load the standalone report by URL so its Tailwind CDN script,
            // Google Fonts, and own CSS run in a normal document context.
            // Fetching + srcDoc breaks runtime CSS-in-JS (Tailwind CDN) under
            // an opaque-origin sandbox, producing oversized/unstyled output.
            <iframe
              src={url}
              className="w-full h-full min-h-[600px] block"
              style={{ background: '#ffffff', border: 0 }}
              title={title}
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
  const [viewerUrl, setViewerUrl] = useState(null);
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
        setViewerUrl(null);
        setViewerFormat('json');
        setViewerTitle(report.title || report.path.split('/').pop());
      }
    } catch {
      // Silent fail
    }
  }, [getFileUrl]);

  const handleViewHtml = useCallback((htmlReport) => {
    setViewerContent(null);
    setViewerUrl(getFileUrl(htmlReport.path));
    setViewerFormat('html');
    setViewerTitle(htmlReport.title || htmlReport.path.split('/').pop());
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

  const closeViewer = useCallback(() => {
    setViewerContent(null);
    setViewerUrl(null);
  }, []);

  // Close viewer on ESC
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') closeViewer(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeViewer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full animate-spin mx-auto mb-4" style={{ border: '2px solid #818CF833', borderTopColor: 'var(--indigo)' }} />
          <p className="lede" style={{ marginBottom: 0 }}>Loading reports…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel" style={{ padding: 32, textAlign: 'center' }}>
        <AlertCircle size={40} style={{ margin: '0 auto 12px', color: 'var(--faint)' }} />
        <p style={{ color: 'var(--ink)' }}>Unable to load reports</p>
        <p className="mono" style={{ marginTop: 4 }}>{error}</p>
      </div>
    );
  }

  // Handle both array format (new) and {assessments: [...]} format (old)
  const assessmentItems = Array.isArray(assessmentManifest)
    ? assessmentManifest
    : (assessmentManifest?.assessments || []);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="kick">▣ — AUTHORIZATION ARTIFACTS</div>
      <h1 className="big">Reports &amp; <span className="g">evidence</span></h1>
      <p className="lede">
        Machine-readable authorization data and audited artifacts. Public items stream openly;
        access-controlled items unlock for authorized reviewers.
      </p>

      {/* Schedule + last-generated telemetry */}
      {(nextReportDate || reportManifest) && (
        <div className="g3" style={{ marginBottom: 8 }}>
          {nextReportDate && (
            <>
              <div className="kpi">
                <div className="v i">{nextReportDate.next_ongoing_report}</div>
                <div className="l">Next Report</div>
              </div>
              <div className="kpi">
                <div className="v i">{nextReportDate.next_quarterly_review}</div>
                <div className="l">Next Review</div>
              </div>
            </>
          )}
          {reportManifest && (
            <div className="kpi">
              <div className="v s">{new Date(reportManifest.generation_timestamp).toLocaleDateString()}</div>
              <div className="l">Last Generated</div>
            </div>
          )}
        </div>
      )}

      {/* Compliance Reports */}
      {reportTypes.length > 0 && (
        <>
          <h3 className="sec">Compliance Reports</h3>
          <div className="panel">
            {reportTypes.map(type => {
              const jsonReport = jsonReports.find(r => r.report_type === type);
              const htmlReport = htmlReports.find(r => r.report_type === type);
              const manifestEntry = reportManifest?.reports?.find(r => r.type === type);

              return (
                <ReportRow
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
        </>
      )}

      {/* Assessment Documents */}
      {assessmentItems.length > 0 && (
        <>
          <h3 className="sec">Assessment Documents</h3>
          <div className="panel">
            {assessmentItems.map((assessment, i) => (
              <AssessmentRow
                key={i}
                assessment={assessment}
                onDownload={() => handleAssessmentDownload(assessment)}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {reportTypes.length === 0 && assessmentItems.length === 0 && (
        <div className="panel" style={{ padding: 32, textAlign: 'center' }}>
          <FileText size={40} style={{ margin: '0 auto 12px', color: 'var(--faint)' }} />
          <p style={{ color: 'var(--ink)' }}>No reports or assessments available</p>
          <p className="mono" style={{ marginTop: 4 }}>Content will appear after the next pipeline run</p>
        </div>
      )}

      {/* Content Viewer Overlay */}
      {(viewerContent || viewerUrl) && (
        <ContentViewer
          content={viewerContent}
          url={viewerUrl}
          format={viewerFormat}
          title={viewerTitle}
          onClose={closeViewer}
        />
      )}
    </div>
  );
});
