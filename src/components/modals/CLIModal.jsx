import React, { useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../hooks/useAuth';
import { BaseModal } from './BaseModal';
import {
  ChevronDown, ChevronRight, CheckCircle, XCircle,
  Terminal, AlertTriangle, FileText, Database, Info, Shield, Lock
} from 'lucide-react';

export const CLIModal = ({ data, onClose }) => {
  const { modals, closeModal, openModal } = useModal();
  const { isAuthenticated } = useAuth();

  const modalData = data || (modals?.cli?.data);
  const isOpen = data ? true : (modals?.cli?.isOpen);
  const closeHandler = onClose || (() => closeModal('cli'));

  const [expandedCommands, setExpandedCommands] = useState({});

  if (!isOpen || !modalData) return null;

  const toggleCommand = (index) => {
    setExpandedCommands(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const stripEmojis = (str) => {
    if (!str) return '';
    return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  };

  // --- UNAUTHENTICATED VIEW (High Contrast Dark Theme) ---
  if (!isAuthenticated) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={closeHandler}
        title={`Command Execution: ${modalData.id || 'KSI'}`}
        size="medium"
        variant="dark"
      >
        <div className="flex flex-col items-center text-center py-10 space-y-8">
          <div className="p-5 bg-gray-800 rounded-full border border-gray-600 shadow-xl">
            <Lock size={56} className="text-blue-400" />
          </div>

          <div className="space-y-3 max-w-lg">
            <h3 className="text-2xl font-bold text-white tracking-tight">Federal Access Required</h3>
            <p className="text-gray-300 text-base leading-relaxed">
              Detailed technical validation findings, command logs, and remediation plans are restricted to authorized federal personnel.
            </p>
          </div>

          <div className="w-full bg-black/20 border border-gray-600 rounded-xl p-6 text-left max-w-md shadow-inner">
            <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2 border-b border-gray-700 pb-2">
              <Shield size={14} className="text-blue-400" />
              With Federal Access You Can:
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-200">
                <CheckCircle size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                <span>View exact AWS CLI commands executed</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-200">
                <CheckCircle size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                <span>Analyze raw JSON outputs and exit codes</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-200">
                <CheckCircle size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                <span>Verify technical validation timestamps</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => { closeHandler(); openModal('registration'); }}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-900/30 w-full max-w-md hover:translate-y-[-1px]"
          >
            Request Full Access
          </button>
        </div>
      </BaseModal>
    );
  }

  // --- AUTHENTICATED VIEW ---
  const commandsList = modalData.detailed_commands || [];
  const totalCommands = modalData.commands_executed || 0;
  const successfulCommands = modalData.successful_commands || 0;
  const successRate = totalCommands > 0 ? Math.round((successfulCommands / totalCommands) * 100) : 0;

  const renderSourceBadge = () => {
    const source = modalData.command_source || 'unknown';

    if (source === 'comprehensive_register') {
      return (
        <div className="bg-green-950/40 border border-green-500/40 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="bg-green-500/20 p-2.5 rounded-full text-green-400 border border-green-500/30">
            <Database size={20} />
          </div>
          <div>
            <div className="font-bold text-green-300 text-base">Comprehensive Command Register</div>
            <div className="text-sm text-green-200/90 mt-0.5">Full audit details matched with validation results.</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-yellow-950/40 border border-yellow-500/40 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="bg-yellow-500/20 p-2.5 rounded-full text-yellow-400 border border-yellow-500/30">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="font-bold text-yellow-300 text-base">Parsed Validation Summary</div>
            <div className="text-sm text-yellow-200/90 mt-0.5">Summary information only. Full logs unavailable.</div>
          </div>
        </div>
      );
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={closeHandler}
      title={`Command Execution: ${modalData.id || 'KSI'}`}
      size="large"
      variant="dark"
    >
      {renderSourceBadge()}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-600 text-center">
          <div className="text-3xl font-bold text-white mb-1">{totalCommands}</div>
          <div className="text-sm text-gray-300 font-bold uppercase tracking-wider">Total</div>
        </div>
        <div className="bg-green-950/50 rounded-xl p-5 border border-green-500/50 text-center">
          <div className="text-3xl font-bold text-green-300 mb-1">{successfulCommands}</div>
          <div className="text-sm text-green-300 font-bold uppercase tracking-wider">Success</div>
        </div>
        <div className="bg-blue-950/50 rounded-xl p-5 border border-blue-500/50 text-center">
          <div className="text-3xl font-bold text-blue-300 mb-1">{successRate}%</div>
          <div className="text-sm text-blue-300 font-bold uppercase tracking-wider">Rate</div>
        </div>
      </div>

      {/* Descriptions */}
      {(modalData.register_description || modalData.register_justification) && (
        <div className="space-y-4 mb-8">
          {modalData.register_description && (
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-5">
              <h4 className="text-xs font-bold text-gray-200 uppercase mb-3 flex items-center gap-2 tracking-wider">
                <FileText size={14} /> Validation Description
              </h4>
              <p className="text-sm text-gray-100 leading-relaxed">{stripEmojis(modalData.register_description)}</p>
            </div>
          )}
          {modalData.register_justification && (
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-5">
              <h4 className="text-xs font-bold text-gray-200 uppercase mb-3 flex items-center gap-2 tracking-wider">
                <Info size={14} /> Technical Justification
              </h4>
              <p className="text-sm text-gray-100 leading-relaxed">{stripEmojis(modalData.register_justification)}</p>
            </div>
          )}
        </div>
      )}

      {/* Detailed Command List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-gray-600 pb-3 mb-4">
          <h4 className="font-bold text-white text-base uppercase tracking-wide">Execution Log</h4>
          <span className="text-xs text-gray-200 bg-gray-700 px-3 py-1.5 rounded-full border border-gray-600 font-medium">{commandsList.length} entries</span>
        </div>

        {commandsList.length > 0 ? (
          commandsList.map((cmd, index) => {
            const isSuccess = cmd.status === 'success' || cmd.exit_code === 0;

            return (
              <div key={index} className="border border-gray-600 rounded-lg overflow-hidden bg-gray-800 transition-all hover:border-gray-500 hover:bg-gray-750">
                <button
                  onClick={() => toggleCommand(index)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-700/70 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center ${isSuccess ? 'bg-green-500/25 text-green-300 border border-green-500/40' : 'bg-red-500/25 text-red-300 border border-red-500/40'}`}>
                      {isSuccess ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate pr-4">
                        {stripEmojis(cmd.description || cmd.note) || `Command #${index + 1}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-bold px-3 py-1 rounded uppercase ${isSuccess ? 'bg-green-900/40 text-green-300 border border-green-500/40' : 'bg-red-900/40 text-red-300 border border-red-500/40'}`}>
                      {isSuccess ? 'Success' : 'Failed'}
                    </span>
                    {expandedCommands[index] ? <ChevronDown size={18} className="text-gray-300" /> : <ChevronRight size={18} className="text-gray-300" />}
                  </div>
                </button>

                {expandedCommands[index] && (
                  <div className="bg-[#0d0e12] p-4 border-t border-gray-700">
                    <pre className="text-green-300 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all selection:bg-green-900 selection:text-white">
                      <span className="text-blue-300 select-none">$ </span>{cmd.command}
                    </pre>
                    {cmd.output && (
                      <div className="mt-3 pt-3 border-t border-gray-800">
                        <div className="text-[10px] text-gray-300 uppercase mb-2 font-bold tracking-wider">Standard Output</div>
                        <pre className="text-gray-200 text-xs font-mono overflow-x-auto max-h-40 custom-scrollbar">{cmd.output}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600">
            <Terminal size={44} className="mx-auto mb-4 text-gray-500" />
            <h4 className="text-gray-200 font-semibold text-base mb-1">No Logs Available</h4>
            <p className="text-sm text-gray-400">
              Detailed command logs are unavailable for this item.
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};