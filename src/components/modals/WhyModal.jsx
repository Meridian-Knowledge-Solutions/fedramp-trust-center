import React, { useState, useMemo } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../hooks/useAuth';
import { BaseModal } from './BaseModal';
import {
  parseKsiValidation,
  generateCriteriaText,
} from '../../utils/ksiValidationParser';
import {
  AlertTriangle, CheckCircle, Info, FileText, Terminal, Shield,
  ChevronDown, ChevronRight, Database, Cpu, Lock, Layers,
  Target, GitBranch, Zap, AlertCircle, Server, Key, Network,
  Globe, Activity, Eye, Settings, Archive, Users, Search, Cloud
} from 'lucide-react';

// Icon mapping for services
const ServiceIcon = ({ name, size = 14 }) => {
  const iconMap = {
    'S3': Database,
    'EC2': Server,
    'IAM': Shield,
    'RDS': Database,
    'CloudTrail': FileText,
    'CloudWatch Logs': FileText,
    'CloudWatch': Activity,
    'Lambda': Zap,
    'KMS': Key,
    'Secrets Manager': Lock,
    'Systems Manager': Cpu,
    'AWS Config': Settings,
    'GuardDuty': Shield,
    'Security Hub': Shield,
    'Inspector': Search,
    'AWS Backup': Archive,
    'ELB': Globe,
    'VPC': Network,
    'SSO': Users,
    'Organizations': Layers,
    'IAM Access Analyzer': Eye,
    'CodeCommit': GitBranch,
    'API/HTTP': Globe,
    'CLI': Terminal,
  };
  const Icon = iconMap[name] || Cloud;
  return <Icon size={size} />;
};

// Collapsible section component
const CollapsibleSection = ({ title, icon: Icon, defaultOpen = false, children, badge, badgeColor }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const badgeColors = {
    green: 'bg-green-500/20 text-green-300 border-green-500/30',
    red: 'bg-red-500/20 text-red-300 border-red-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  };
  
  return (
    <div className="border border-gray-700/50 rounded-xl overflow-hidden bg-gray-900/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className="text-blue-400" />}
          <span className="font-semibold text-white text-sm">{title}</span>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColors[badgeColor] || badgeColors.blue}`}>
              {badge}
            </span>
          )}
        </div>
        {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>
      {isOpen && (
        <div className="border-t border-gray-700/50 p-4 bg-black/20">
          {children}
        </div>
      )}
    </div>
  );
};

// Individual check row component
const CheckRow = ({ check }) => {
  const [showCommand, setShowCommand] = useState(false);
  
  return (
    <div className={`p-3 rounded-lg border ${check.passed ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 p-1.5 rounded-lg ${check.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          <ServiceIcon name={check.service} size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-white text-sm">{check.name}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-400 border border-gray-700">
              {check.service}
            </span>
            {check.executionTime && (
              <span className="text-[10px] text-gray-500">{check.executionTime}</span>
            )}
          </div>
          
          {check.errorMessage && !check.passed && (
            <p className="text-xs text-red-300 mb-2 bg-red-500/10 p-2 rounded">{check.errorMessage}</p>
          )}
          
          <button 
            onClick={() => setShowCommand(!showCommand)}
            className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
          >
            <Terminal size={10} />
            {showCommand ? 'Hide' : 'Show'} command
          </button>
          
          {showCommand && (
            <pre className="mt-2 text-xs bg-black/40 p-2 rounded border border-gray-800 text-green-300 font-mono overflow-x-auto">
              <span className="text-blue-400 select-none">$ </span>{check.command}
            </pre>
          )}
        </div>
        <div className={`flex-shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase ${check.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {check.passed ? 'PASS' : 'FAIL'}
        </div>
      </div>
    </div>
  );
};

// Service group summary
const ServiceGroupCard = ({ group }) => {
  const total = group.checks.length;
  const passRate = total > 0 ? Math.round((group.passed / total) * 100) : 0;
  const allPassed = group.failed === 0;
  
  return (
    <div className={`p-3 rounded-lg border ${allPassed ? 'border-green-500/20 bg-green-500/5' : 'border-yellow-500/20 bg-yellow-500/5'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ServiceIcon name={group.name} size={16} />
          <span className="font-medium text-white text-sm">{group.name}</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${allPassed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {passRate}%
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-gray-500">{total} checks</span>
        {group.passed > 0 && <span className="text-green-400">✓ {group.passed} passed</span>}
        {group.failed > 0 && <span className="text-red-400">✗ {group.failed} failed</span>}
      </div>
    </div>
  );
};

export const WhyModal = () => {
  const { modals, closeModal, openModal } = useModal();
  const { isAuthenticated } = useAuth();
  const { isOpen, data } = modals.why;

  // Parse the KSI data dynamically
  const parsed = useMemo(() => {
    if (!data) return null;
    return parseKsiValidation(data);
  }, [data]);

  // Generate criteria text
  const criteria = useMemo(() => {
    if (!parsed) return null;
    return generateCriteriaText(parsed);
  }, [parsed]);

  if (!data || !parsed) return null;

  // Status configuration
  const statusConfig = {
    passed: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle },
    failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertTriangle },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Info },
    info: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Info }
  };

  const config = statusConfig[parsed.status] || statusConfig['info'];
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
                  {parsed.status === 'passed' ? 'Compliant' : 'Attention Required'}
                </h4>
                <p className="text-sm text-gray-200">
                  This security control has been assessed against FedRAMP requirements.
                  {parsed.status !== 'passed' && ' Remediation or tracking may be required.'}
                </p>
              </div>
            </div>
          </div>

          {/* Implementation Summary - visible to agencies before login */}
          {data.implementation_summary && (
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white text-sm mb-2">Implementation Summary</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{data.implementation_summary}</p>
                </div>
              </div>
            </div>
          )}

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

    // Authenticated View with Dynamic Details
    return (
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`relative p-5 rounded-xl border overflow-hidden ${config.bg} ${config.border}`}>
            <div className="relative">
              <div className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Status</div>
              <div className={`font-bold text-xl flex items-center gap-2 ${config.color}`}>
                <StatusIcon size={20} />
                {parsed.statusLabel || parsed.status.toUpperCase()}
              </div>
            </div>
          </div>
          <div className="relative p-5 rounded-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
            <div className="relative">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Compliance Score</div>
              <div className="font-semibold text-white text-lg">{parsed.score}%</div>
              <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${parsed.score >= 80 ? 'bg-green-500' : parsed.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${parsed.score}%` }}
                />
              </div>
            </div>
          </div>
          <div className="relative p-5 rounded-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
            <div className="relative">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Checks Executed</div>
              <div className="font-semibold text-white text-lg">{parsed.commandsExecuted} Commands</div>
              <div className="text-xs text-gray-500 mt-1">
                {parsed.successfulCommands} successful, {parsed.commandsExecuted - parsed.successfulCommands} failed
              </div>
            </div>
          </div>
        </div>

        {/* Category & Requirement */}
        <div className="p-4 rounded-xl border border-gray-700/50 bg-gray-900/50">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-white text-sm">{parsed.category}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-400 border border-gray-700">
                  {parsed.theme}
                </span>
              </div>
              <p className="text-sm text-gray-300">{parsed.requirement}</p>
            </div>
          </div>
        </div>

        {/* Implementation Summary */}
        {data.implementation_summary && (
          <CollapsibleSection
            title="Implementation Summary"
            icon={FileText}
            defaultOpen={true}
            
          >
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
              {data.implementation_summary}
            </p>
            {data.justification && (
              <div className="mt-3 p-3 rounded-lg border border-gray-700/50 bg-black/20">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={14} className="text-blue-400" />
                  <span className="text-xs font-bold text-blue-400 uppercase">Justification</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{data.justification}</p>
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* Service Groups Summary */}
        {parsed.serviceGroups.length > 0 && (
          <CollapsibleSection
            title="Services Validated"
            icon={Layers}
            defaultOpen={true}
            badge={`${parsed.serviceGroups.length} services`}
            badgeColor="blue"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {parsed.serviceGroups.map((group, idx) => (
                <ServiceGroupCard key={idx} group={group} />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Individual Checks */}
        {parsed.checks.length > 0 && (
          <CollapsibleSection
            title="Validation Checks"
            icon={Target}
            defaultOpen={false}
            badge={`${parsed.checksSummary.passedChecks}/${parsed.checksSummary.totalChecks} passed`}
            badgeColor={parsed.checksSummary.passRate >= 80 ? 'green' : 'red'}
          >
            <div className="space-y-3">
              <p className="text-xs text-gray-400 mb-4">
                Each check represents a CLI command executed against your AWS infrastructure.
              </p>
              {parsed.checks.map((check, idx) => (
                <CheckRow key={idx} check={check} />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Pass/Fail Criteria */}
        {criteria && (
          <CollapsibleSection
            title="Pass/Fail Criteria"
            icon={Zap}
            defaultOpen={false}
          >
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={14} className="text-green-400" />
                  <span className="text-xs font-bold text-green-400 uppercase">Pass Criteria</span>
                </div>
                <p className="text-sm text-gray-300">{criteria.passCriteria}</p>
              </div>
              
              {parsed.status !== 'passed' && (
                <>
                  <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={14} className="text-red-400" />
                      <span className="text-xs font-bold text-red-400 uppercase">Current Issue</span>
                    </div>
                    <p className="text-sm text-gray-300">{criteria.failCriteria}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Info size={14} className="text-blue-400" />
                      <span className="text-xs font-bold text-blue-400 uppercase">Remediation</span>
                    </div>
                    <p className="text-sm text-gray-300">{criteria.remediationHint}</p>
                  </div>
                </>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Assertion Reason Details */}
        {parsed.reasonParsed.details.length > 0 && (
          <CollapsibleSection
            title="Assessment Findings"
            icon={FileText}
            defaultOpen={false}
            badge={`${parsed.reasonParsed.details.length} items`}
          >
            <ul className="space-y-2">
              {parsed.reasonParsed.details.map((detail, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-gray-200 p-2 rounded bg-black/20">
                  <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    detail.includes('✅') || detail.toLowerCase().includes('pass') || detail.toLowerCase().includes('verified')
                      ? 'bg-green-500'
                      : detail.includes('❌') || detail.toLowerCase().includes('fail')
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                  }`} />
                  <span className="leading-relaxed">{detail}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Recommended Action */}
        {parsed.recommendedAction && (
          <div className="p-4 rounded-xl border border-gray-700/50 bg-gray-900/50">
            <div className="flex items-start gap-3">
              <Target size={18} className="text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-white text-sm mb-1">Recommended Action</h4>
                <p className="text-sm text-gray-300">{parsed.recommendedAction}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => closeModal('why')}
      title={`Assessment Details: ${parsed.id}`}
      size="large"
      variant="dark"
    >
      {renderContent()}
    </BaseModal>
  );
};
