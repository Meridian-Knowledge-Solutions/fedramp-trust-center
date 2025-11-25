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

  // --- UNAUTHENTICATED VIEW (Modern Dark Theme) ---
  if (!isAuthenticated) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={closeHandler}
        title={`Command Execution: ${modalData.id || 'KSI'}`}
        size="medium"
        variant="dark"
      >
        <div className="flex flex-col items-center text-center py-12 space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
            <div className="relative p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl">
              <Lock size={56} className="text-blue-400" />
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            <h3 className="text-3xl font-bold text-white tracking-tight">Federal Access Required</h3>
            <p className="text-gray-300 text-base leading-relaxed">
              Detailed technical validation findings, command logs, and remediation plans are restricted to authorized federal personnel.
            </p>
          </div>

          <div className="w-full bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-6 text-left max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-800">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <Shield size={16} className="text-blue-400" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                With Federal Access
              </h4>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-200">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                  <CheckCircle size={14} className="text-green-400" />
                </div>
                <span>View exact AWS CLI commands executed</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-200">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                  <CheckCircle size={14} className="text-green-400" />
                </div>
                <span>Analyze raw JSON outputs and exit codes</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-200">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                  <CheckCircle size={14} className="text-green-400" />
                </div>
                <span>Verify technical validation timestamps</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => { closeHandler(); openModal('registration'); }}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-900/30 w-full max-w-md overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span className="relative flex items-center justify-center gap-2">
              <Shield size={18} />
              Request Full Access
            </span>
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
        <div className="relative bg-gradient-to-br from-green-950/50 to-emerald-950/30 border border-green-500/30 rounded-xl p-5 mb-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl"></div>
          <div className="relative flex items-center gap-4">
            <div className="bg-green-500/20 p-3 rounded-xl text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10">
              <Database size={24} />
            </div>
            <div>
              <div className="font-bold text-green-300 text-lg mb-1">Comprehensive Command Register</div>
              <div className="text-sm text-green-200/80">Full audit details matched with validation results</div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="relative bg-gradient-to-br from-yellow-950/50 to-amber-950/30 border border-yellow-500/30 rounded-xl p-5 mb-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl"></div>
          <div className="relative flex items-center gap-4">
            <div className="bg-yellow-500/20 p-3 rounded-xl text-yellow-400 border border-yellow-500/30 shadow-lg shadow-yellow-500/10">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="font-bold text-yellow-300 text-lg mb-1">Parsed Validation Summary</div>
              <div className="text-sm text-yellow-200/80">Summary information only • Full logs unavailable</div>
            </div>
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
        <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Commands</div>
            <div className="text-4xl font-bold text-white mb-1">{totalCommands}</div>
            <div className="h-1 w-12 bg-gradient-to-r from-blue-500/50 to-transparent rounded-full"></div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-green-950/80 to-emerald-950/50 rounded-xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="text-xs font-bold text-green-400/80 uppercase tracking-wider mb-2">Successful</div>
            <div className="text-4xl font-bold text-green-300 mb-1">{successfulCommands}</div>
            <div className="h-1 w-12 bg-gradient-to-r from-green-500/50 to-transparent rounded-full"></div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-blue-950/80 to-cyan-950/50 rounded-xl p-6 border border-blue-500/30 hover:border-blue-500/50 transition-all overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="text-xs font-bold text-blue-400/80 uppercase tracking-wider mb-2">Success Rate</div>
            <div className="text-4xl font-bold text-blue-300 mb-1">{successRate}%</div>
            <div className="h-1 w-12 bg-gradient-to-r from-blue-500/50 to-transparent rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Descriptions */}
      {(modalData.register_description || modalData.register_justification) && (
        <div className="space-y-4 mb-8">
          {modalData.register_description && (
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-5 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase mb-3 tracking-wider">
                  <FileText size={14} className="text-blue-400" />
                  Validation Description
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">{stripEmojis(modalData.register_description)}</p>
              </div>
            </div>
          )}
          {modalData.register_justification && (
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-5 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase mb-3 tracking-wider">
                  <Info size={14} className="text-purple-400" />
                  Technical Justification
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">{stripEmojis(modalData.register_justification)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Command List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div>
            <h4 className="font-bold text-white text-lg tracking-tight mb-1">Execution Log</h4>
            <p className="text-xs text-gray-400">Command-level validation details</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <Terminal size={14} className="text-gray-400" />
            <span className="text-sm text-gray-300 font-medium">{commandsList.length}</span>
          </div>
        </div>

        {commandsList.length > 0 ? (
          <div className="space-y-3">
            {commandsList.map((cmd, index) => {
              const isSuccess = cmd.status === 'success' || cmd.exit_code === 0;

              return (
                <div key={index} className="group relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-600 transition-all">
                  <button
                    onClick={() => toggleCommand(index)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4 overflow-hidden flex-1">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${isSuccess ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                        {isSuccess ? <CheckCircle size={18} className="text-green-400" /> : <XCircle size={18} className="text-red-400" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white mb-1 truncate">
                          {stripEmojis(cmd.description || cmd.note) || `Command #${index + 1}`}
                        </div>
                        <div className="text-xs text-gray-400">
                          {isSuccess ? 'Execution completed successfully' : 'Execution failed'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${isSuccess ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                        {isSuccess ? 'SUCCESS' : 'FAILED'}
                      </span>
                      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800/50 border border-gray-700/50 group-hover:border-gray-600 transition-colors">
                        {expandedCommands[index] ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                      </div>
                    </div>
                  </button>

                  {expandedCommands[index] && (
                    <div className="border-t border-gray-800">
                      <div className="bg-black/40 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Terminal size={12} className="text-green-400" />
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Command</span>
                        </div>
                        <pre className="text-green-300 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all selection:bg-green-900 selection:text-white p-3 bg-black/30 rounded-lg border border-gray-800">
                          <span className="text-blue-400 select-none">$ </span>{cmd.command}
                        </pre>

                        {cmd.output && (
                          <div className="mt-4">
                            <div className="mb-3 flex items-center gap-2">
                              <FileText size={12} className="text-gray-400" />
                              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Output</span>
                            </div>
                            <pre className="text-gray-300 text-xs font-mono overflow-x-auto max-h-40 p-3 bg-black/30 rounded-lg border border-gray-800 custom-scrollbar">{cmd.output}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-dashed border-gray-700/50">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700">
              <Terminal size={28} className="text-gray-600" />
            </div>
            <h4 className="text-gray-300 font-semibold text-base mb-2">No Command Logs Available</h4>
            <p className="text-sm text-gray-500">
              Detailed execution logs are unavailable for this validation
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};