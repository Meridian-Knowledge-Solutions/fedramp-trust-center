import React from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useData } from '../../hooks/useData';
import { BaseModal } from './BaseModal';
import { AlertTriangle, TrendingUp, FileText, Download, Target } from 'lucide-react';

export const POAMModal = () => {
  const { modals, closeModal, openModal } = useModal();
  const { ksis } = useData();
  const { isOpen } = modals.poam;

  // Categorize KSIs by risk level
  const failedKsis = ksis.filter(ksi => ksi.status === 'failed');
  const warningKsis = ksis.filter(ksi => ksi.status === 'warning');
  const infoKsis = ksis.filter(ksi => ksi.status === 'info');
  
  const totalFindings = failedKsis.length + warningKsis.length + infoKsis.length;

  // Categorize failed KSIs by severity (based on KSI category)
  const criticalKsis = failedKsis.filter(ksi => ksi.id.startsWith('KSI-IAM'));
  const seriousKsis = failedKsis.filter(ksi => 
    ksi.id.startsWith('KSI-CNA') || ksi.id.startsWith('KSI-SVC')
  );
  const moderateKsis = failedKsis.filter(ksi => 
    ksi.id.startsWith('KSI-MLA') || ksi.id.startsWith('KSI-CMT')
  );
  const minorKsis = failedKsis.filter(ksi => 
    ksi.id.startsWith('KSI-CED') || ksi.id.startsWith('KSI-PIY')
  );

  const handleExportReport = () => {
    const report = {
      generated: new Date().toISOString(),
      summary: {
        total: totalFindings,
        failed: failedKsis.length,
        warning: warningKsis.length,
        info: infoKsis.length
      },
      critical: criticalKsis.map(k => ({ id: k.id, description: k.description })),
      serious: seriousKsis.map(k => ({ id: k.id, description: k.description })),
      moderate: moderateKsis.map(k => ({ id: k.id, description: k.description })),
      minor: minorKsis.map(k => ({ id: k.id, description: k.description }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vdr-integrated-findings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGeneratePOAM = () => {
    const poamTemplate = `# Plan of Action & Milestones (POA&M)
Generated: ${new Date().toLocaleString()}

## Executive Summary
- Total Findings: ${totalFindings}
- Critical (N4): ${criticalKsis.length}
- Serious (N3): ${seriousKsis.length}
- Moderate (N2): ${moderateKsis.length}
- Minor (N1): ${minorKsis.length}

## Critical Findings (Identity & Access)
${criticalKsis.map(k => `### ${k.id}
- Description: ${k.description}
- Timeline: 2-14 days
- N-Rating: N4
`).join('\n')}

## Serious Findings (Infrastructure)
${seriousKsis.map(k => `### ${k.id}
- Description: ${k.description}
- Timeline: 16-64 days
- N-Rating: N3
`).join('\n')}

## Moderate Findings (Monitoring)
${moderateKsis.map(k => `### ${k.id}
- Description: ${k.description}
- Timeline: 66-128 days
- N-Rating: N2
`).join('\n')}

## Minor Findings (Documentation)
${minorKsis.map(k => `### ${k.id}
- Description: ${k.description}
- Timeline: 128-192 days
- N-Rating: N1
`).join('\n')}
`;

    const blob = new Blob([poamTemplate], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poam-template-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderFindingItem = (ksi) => (
    <div
      key={ksi.id}
      onClick={() => {
        closeModal('poam');
        openModal('why', {
          ksiId: ksi.id,
          status: ksi.status,
          category: ksi.category,
          description: ksi.description,
          reason: ksi.reason,
          commands_executed: ksi.commands_executed
        });
      }}
      className="p-4 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-mono font-bold text-sm text-slate-900">{ksi.id}</span>
        <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">
          {ksi.category}
        </span>
      </div>
      <p className="text-sm text-slate-700 mb-3">{ksi.description}</p>
      <div className="text-xs text-slate-500">
        {ksi.commands_executed} validation commands executed
      </div>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => closeModal('poam')}
      title="📊 KSI Risk-Based Tracking System (VDR Integrated)"
      size="xlarge"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-3xl font-bold text-red-600">{failedKsis.length}</div>
          <div className="text-xs text-red-600 font-medium">VDR Vulnerabilities</div>
          <div className="text-xs text-red-500 mt-1">2-192 days (N-rated)</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="text-3xl font-bold text-amber-600">{warningKsis.length}</div>
          <div className="text-xs text-amber-600 font-medium">Low Risk Findings</div>
          <div className="text-xs text-amber-500 mt-1">60-day tracking</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-3xl font-bold text-blue-600">{infoKsis.length}</div>
          <div className="text-xs text-blue-600 font-medium">Improvements</div>
          <div className="text-xs text-blue-500 mt-1">180-day tracking</div>
        </div>
      </div>

      {/* No Findings State */}
      {totalFindings === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">All KSIs Are Compliant</h3>
          <p className="text-slate-600">
            No findings requiring VDR vulnerability creation or remediation tracking.
          </p>
          <div className="mt-4 text-sm text-green-600 bg-green-50 inline-block px-4 py-2 rounded-lg">
            ✅ RFC-0017 FRR-PVA-03: No KSI failures to convert
          </div>
        </div>
      )}

      {/* Critical Findings */}
      {criticalKsis.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-600" size={20} />
              <div>
                <h3 className="font-bold text-red-900">
                  Critical Security Controls ({criticalKsis.length})
                </h3>
                <p className="text-xs text-red-700">
                  Identity & Access Management failures - N4 vulnerabilities requiring immediate remediation
                </p>
              </div>
            </div>
            <span className="text-xs px-3 py-1 bg-red-600 text-white rounded-full font-bold">
              N4 CRITICAL
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {criticalKsis.map(renderFindingItem)}
          </div>
          <div className="mt-3 text-xs text-red-600 bg-red-50 p-3 rounded border border-red-200">
            ⏰ <strong>VDR Timeline:</strong> 2-14 days remediation required
          </div>
        </div>
      )}

      {/* Serious Findings */}
      {seriousKsis.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-orange-600" size={20} />
              <div>
                <h3 className="font-bold text-orange-900">
                  Infrastructure & Configuration ({seriousKsis.length})
                </h3>
                <p className="text-xs text-orange-700">
                  Technical configuration failures - N3 vulnerabilities with priority remediation
                </p>
              </div>
            </div>
            <span className="text-xs px-3 py-1 bg-orange-600 text-white rounded-full font-bold">
              N3 SERIOUS
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {seriousKsis.map(renderFindingItem)}
          </div>
          <div className="mt-3 text-xs text-orange-600 bg-orange-50 p-3 rounded border border-orange-200">
            ⏰ <strong>VDR Timeline:</strong> 16-64 days remediation cycle
          </div>
        </div>
      )}

      {/* Moderate Findings */}
      {moderateKsis.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-yellow-600" size={20} />
              <div>
                <h3 className="font-bold text-yellow-900">
                  Monitoring & Change Management ({moderateKsis.length})
                </h3>
                <p className="text-xs text-yellow-700">
                  Process and monitoring gaps - N2 vulnerabilities with standard tracking
                </p>
              </div>
            </div>
            <span className="text-xs px-3 py-1 bg-yellow-600 text-white rounded-full font-bold">
              N2 MODERATE
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {moderateKsis.map(renderFindingItem)}
          </div>
          <div className="mt-3 text-xs text-yellow-600 bg-yellow-50 p-3 rounded border border-yellow-200">
            ⏰ <strong>VDR Timeline:</strong> 66-128 days remediation cycle
          </div>
        </div>
      )}

      {/* Minor Findings */}
      {minorKsis.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <FileText className="text-slate-600" size={20} />
              <div>
                <h3 className="font-bold text-slate-900">
                  Procedural Controls ({minorKsis.length})
                </h3>
                <p className="text-xs text-slate-700">
                  Documentation and policy updates - N1/N2 vulnerabilities
                </p>
              </div>
            </div>
            <span className="text-xs px-3 py-1 bg-slate-600 text-white rounded-full font-bold">
              N1/N2 MINOR
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {minorKsis.map(renderFindingItem)}
          </div>
          <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
            ⏰ <strong>VDR Timeline:</strong> 128-192 days remediation cycle
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {totalFindings > 0 && (
        <div className="flex gap-3 pt-6 border-t border-slate-200">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Download size={16} />
            Export VDR Report
          </button>
          <button
            onClick={handleGeneratePOAM}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
          >
            <Target size={16} />
            Generate POA&M Template
          </button>
        </div>
      )}
    </BaseModal>
  );
};