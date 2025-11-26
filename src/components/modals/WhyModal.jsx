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
          <div className={`relative p-5 rounded-xl border overflow-hidden ${config.bg} ${config.border}`}>
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20 rounded-full blur-3xl" style={{ backgroundColor: config.color.replace('text-', '') }}></div>
            <div className="relative flex items-start gap-4">
              <StatusIcon className={`mt-1 ${config.color}`} size={24} />
              <div>
                <h4 className={`font-bold ${config.color} mb-2 uppercase tracking-wide text-base`}>
                  {data.status === 'passed' ? 'Compliant' : 'Attention Required'}
                </h4>
                <p className="text-sm text-gray-200">
                  This security control has been assessed against FedRAMP requirements.
                  {data.status !== 'passed' && ' Remediation or tracking may be required.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-xl border border-gray-700 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700">
              <Shield size={32} className="text-gray-500" />
            </div>
            <h4 className="font-semibold text-white text-xl mb-3">Federal Access Required</h4>
            <p className="text-sm text-gray-300 mb-6 max-w-md mx-auto leading-relaxed">
              Detailed technical findings, command logs, and remediation plans are restricted to authorized federal personnel.
            </p>
            <button
              onClick={() => { closeModal('why'); openModal('registration'); }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-900/30"
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
          <div className={`relative p-5 rounded-xl border overflow-hidden ${config.bg} ${config.border}`}>
            <div className="absolute top-0 right-0 w-24 h-24 opacity-20 rounded-full blur-2xl" style={{ backgroundColor: config.color.replace('text-', '') }}></div>
            <div className="relative">
              <div className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Status</div>
              <div className={`font-bold text-xl flex items-center gap-2 ${config.color}`}>
                <StatusIcon size={20} />
                {data.status.toUpperCase()}
              </div>
            </div>
          </div>
          <div className="relative p-5 rounded-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Validation Type</div>
              <div className="font-semibold text-white text-lg">Automated CLI</div>
            </div>
          </div>
          <div className="relative p-5 rounded-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Checks Run</div>
              <div className="font-semibold text-white text-lg">{data.commands_executed} Commands</div>
            </div>
          </div>
        </div>

        {/* Technical Findings List */}
        <div>
          <h4 className="text-base font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
            <FileText size={18} className="text-blue-400" />
            Assessment Findings
          </h4>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            {findings.length > 0 ? (
              <ul className="divide-y divide-gray-800">
                {findings.map((item, idx) => (
                  <li key={idx} className="p-4 text-sm text-gray-200 flex gap-3 hover:bg-gray-800/70 transition-colors">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
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
        <div className="flex justify-end pt-6 border-t border-gray-800">
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
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white rounded-xl text-sm font-bold transition-all border border-gray-600 shadow-lg"
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
      variant="dark"
    >
      {renderContent()}
    </BaseModal>
  );
};