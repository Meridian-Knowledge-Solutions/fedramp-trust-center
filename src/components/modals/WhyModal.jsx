import React from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../hooks/useAuth';
import { BaseModal } from './BaseModal';
import { Sanitizer } from '../../utils/sanitizer';
import { AlertTriangle, CheckCircle, Info, FileText, Terminal, Shield } from 'lucide-react';

export const WhyModal = () => {
  const { modals, closeModal, openModal } = useModal();
  const { isAuthenticated } = useAuth();
  const { isOpen, data } = modals.why;

  if (!data) return null;

  // Helper: Clean text by removing emojis and trimming
  const cleanText = (text) => {
    if (!text) return '';
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();
  };

  // Helper: Parse the dense assertion string into a clean list
  const parseFindings = (text) => {
    if (!text) return [];
    const rawItems = text.split(/;|•/).map(s => cleanText(s)).filter(s => s.length > 0);
    return rawItems;
  };

  const findings = parseFindings(data.reason || data.assertion_reason);

  // Dark Theme Status Colors
  const statusConfig = {
    passed: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle },
    failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertTriangle },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Info },
    info: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Info }
  };

  const config = statusConfig[data.status] || statusConfig['info'];
  const StatusIcon = config.icon;

  const renderContent = () => {
    if (!isAuthenticated) {
      // Public View
      return (
        <div className="space-y-6">
          <div className={`p-4 rounded-lg border ${config.bg} ${config.border} flex items-start gap-4`}>
            <StatusIcon className={`mt-1 ${config.color}`} size={20} />
            <div>
              <h4 className={`font-bold ${config.color} mb-1 uppercase tracking-wide text-sm`}>
                {data.status === 'passed' ? 'Compliant' : 'Attention Required'}
              </h4>
              <p className="text-sm text-gray-300">
                This security control has been assessed against FedRAMP requirements.
                {data.status !== 'passed' && ' Remediation or tracking may be required.'}
              </p>
            </div>
          </div>

          <div className="bg-gray-900 p-8 rounded-lg border border-gray-700 text-center">
            <Shield size={48} className="mx-auto mb-4 text-gray-600" />
            <h4 className="font-semibold text-white text-lg mb-2">Federal Access Required</h4>
            <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
              Detailed technical findings, command logs, and remediation plans are restricted to authorized federal personnel.
            </p>
            <button
              onClick={() => { closeModal('why'); openModal('registration'); }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-blue-900/20"
            >
              Request Full Access
            </button>
          </div>
        </div>
      );
    }

    // Authenticated View
    return (
      <div className="space-y-8">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${config.bg} ${config.border}`}>
            <div className="text-xs font-bold uppercase text-gray-400 mb-1">Status</div>
            <div className={`font-bold text-lg flex items-center gap-2 ${config.color}`}>
              <StatusIcon size={18} />
              {data.status.toUpperCase()}
            </div>
          </div>
          <div className="p-4 rounded-lg border border-gray-700 bg-gray-900">
            <div className="text-xs font-bold text-gray-500 uppercase mb-1">Validation Type</div>
            <div className="font-semibold text-white">Automated CLI</div>
          </div>
          <div className="p-4 rounded-lg border border-gray-700 bg-gray-900">
            <div className="text-xs font-bold text-gray-500 uppercase mb-1">Checks Run</div>
            <div className="font-semibold text-white">{data.commands_executed} Commands</div>
          </div>
        </div>

        {/* Technical Findings List */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wide mb-3 flex items-center gap-2">
            <FileText size={16} className="text-blue-400" />
            Assessment Findings
          </h4>
          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            {findings.length > 0 ? (
              <ul className="divide-y divide-gray-800">
                {findings.map((item, idx) => (
                  <li key={idx} className="p-4 text-sm text-gray-300 flex gap-3 hover:bg-gray-800/50 transition-colors">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500 italic">
                Assessment completed successfully. No specific finding details parsed.
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end pt-6 border-t border-gray-700">
          {data.commands && (
            <button
              onClick={() => {
                closeModal('why');
                openModal('cli', {
                  ksiId: data.ksiId,
                  description: data.description,
                  commands: data.commands,
                  justification: data.reason
                });
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-bold transition-colors border border-gray-600"
            >
              <Terminal size={16} />
              View Execution Log
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => closeModal('why')}
      title={`Assessment Details: ${data.ksiId || 'KSI'}`}
      size="large"
    >
      {renderContent()}
    </BaseModal>
  );
};