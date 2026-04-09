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
  Target, GitBranch, Zap, Server, Key, Network,
  Globe, Activity, Eye, Settings, Archive, Users, Search, Cloud, Clock
} from 'lucide-react';

// Icon mapping for services
const ServiceIcon = ({ name, size = 14 }) => {
  const iconMap = {
    'S3': Database, 'EC2': Server, 'IAM': Shield, 'RDS': Database,
    'CloudTrail': FileText, 'CloudWatch Logs': FileText, 'CloudWatch': Activity,
    'Lambda': Zap, 'KMS': Key, 'Secrets Manager': Lock, 'Systems Manager': Cpu,
    'AWS Config': Settings, 'GuardDuty': Shield, 'Security Hub': Shield,
    'Inspector': Search, 'AWS Backup': Archive, 'ELB': Globe, 'VPC': Network,
    'SSO': Users, 'Organizations': Layers, 'IAM Access Analyzer': Eye,
    'CodeCommit': GitBranch, 'API/HTTP': Globe, 'CLI': Terminal,
  };
  return React.createElement(iconMap[name] || Cloud, { size });
};

// Collapsible section
const Section = ({ title, icon: Icon, defaultOpen = false, children, badge, badgeColor = 'blue' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const colors = {
    green: 'bg-green-500/20 text-green-300 border-green-500/30',
    red: 'bg-red-500/20 text-red-300 border-red-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  };

  return (
    <div className="border border-gray-700/50 rounded-xl overflow-hidden bg-gray-900/50">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={16} className="text-gray-400" />}
          <span className="font-medium text-white text-sm">{title}</span>
          {badge && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[badgeColor]}`}>{badge}</span>}
        </div>
        {isOpen ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
      </button>
      {isOpen && <div className="border-t border-gray-700/50 p-4 bg-black/20">{children}</div>}
    </div>
  );
};

// Single CLI check row
const CheckRow = ({ check }) => {
  const [showCmd, setShowCmd] = useState(false);
  return (
    <div className={`p-3 rounded-lg border ${check.passed ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`p-1 rounded ${check.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <ServiceIcon name={check.service} size={12} />
          </div>
          <span className="text-sm text-white truncate">{check.name}</span>
          {check.executionTime && <span className="text-[10px] text-gray-500 flex-shrink-0">{check.executionTime}</span>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setShowCmd(!showCmd)} className="text-[10px] text-gray-500 hover:text-gray-300">
            <Terminal size={12} />
          </button>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${check.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {check.passed ? 'PASS' : 'FAIL'}
          </span>
        </div>
      </div>
      {check.errorMessage && !check.passed && (
        <p className="text-xs text-red-300 mt-2 bg-red-500/10 p-2 rounded">{check.errorMessage}</p>
      )}
      {showCmd && (
        <pre className="mt-2 text-xs bg-black/40 p-2 rounded border border-gray-800 text-green-300 font-mono overflow-x-auto">
          <span className="text-blue-400 select-none">$ </span>{check.command}
        </pre>
      )}
    </div>
  );
};

export const WhyModal = () => {
  const { modals, closeModal, openModal } = useModal();
  const { isAuthenticated } = useAuth();
  const { isOpen, data } = modals.why;

  const parsed = useMemo(() => data ? parseKsiValidation(data) : null, [data]);
  const criteria = useMemo(() => parsed ? generateCriteriaText(parsed) : null, [parsed]);

  if (!data || !parsed) return null;

  const statusConfig = {
    passed: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle, label: 'Operational' },
    meets_threshold: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: CheckCircle, label: 'Meets Threshold' },
    failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertTriangle, label: 'Fail' },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Info, label: 'Conditional' },
    info: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Info, label: 'Informational' }
  };
  const config = statusConfig[parsed.status] || statusConfig['info'];
  const StatusIcon = config.icon;
  const isPassing = parsed.status === 'passed' || parsed.status === 'meets_threshold';
  const isFailing = parsed.status === 'failed';

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="space-y-6">
          <div className={`p-5 rounded-xl border ${config.bg} ${config.border} flex items-start gap-4`}>
            <StatusIcon className={`mt-0.5 ${config.color}`} size={22} />
            <div>
              <h4 className={`font-bold ${config.color} uppercase tracking-wide text-base`}>{config.label}</h4>
              <p className="text-sm text-gray-300 mt-1">{parsed.requirement}</p>
            </div>
          </div>

          <div className="bg-gray-900 p-8 rounded-xl border border-gray-700 text-center">
            <Shield size={28} className="text-gray-500 mx-auto mb-3" />
            <h4 className="font-semibold text-white text-lg mb-2">Federal Access Required</h4>
            <p className="text-sm text-gray-400 mb-5 max-w-sm mx-auto">
              Technical findings and evidence are restricted to authorized personnel.
            </p>
            <button
              onClick={() => { closeModal('why'); openModal('registration'); }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-all"
            >
              Request Access
            </button>
          </div>
        </div>
      );
    }

    // Authenticated View — adapts to status
    return (
      <div className="space-y-4">

        {/* Status + Requirement — always visible, single block */}
        <div className={`p-5 rounded-xl border ${config.bg} ${config.border}`}>
          <div className="flex items-start gap-4">
            <StatusIcon className={`mt-0.5 flex-shrink-0 ${config.color}`} size={22} />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className={`font-bold text-lg ${config.color}`}>{config.label}</span>
                <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">{parsed.category}</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{parsed.requirement}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="font-mono">{parsed.score}%</span>
                <span className="text-gray-700">&middot;</span>
                <span>{parsed.checksSummary.passedChecks}/{parsed.checksSummary.totalChecks} checks passed</span>
                {parsed.timestamp && (
                  <>
                    <span className="text-gray-700">&middot;</span>
                    <span className="flex items-center gap-1"><Clock size={10} />{new Date(parsed.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* For FAILING controls: show remediation prominently */}
        {isFailing && parsed.recommendedAction && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <div className="flex items-start gap-3">
              <Target size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-red-400 uppercase">Recommended Action</span>
                <p className="text-sm text-gray-300 mt-1">{parsed.recommendedAction}</p>
              </div>
            </div>
          </div>
        )}

        {/* Implementation — brief context on how the control works */}
        {data.implementation_summary && (
          <Section title="Implementation" icon={FileText} defaultOpen={!isPassing}>
            <p className="text-sm text-gray-300 leading-relaxed">{data.implementation_summary}</p>
            {data.justification && (
              <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700/50 leading-relaxed">
                <span className="font-bold text-gray-400">Justification:</span> {data.justification}
              </p>
            )}
          </Section>
        )}

        {/* Validation Checks — the actual evidence */}
        {parsed.checks.length > 0 && (
          <Section
            title="Validation Evidence"
            icon={Terminal}
            defaultOpen={isFailing}
            badge={`${parsed.checksSummary.passedChecks}/${parsed.checksSummary.totalChecks}`}
            badgeColor={parsed.checksSummary.failedChecks > 0 ? 'red' : 'green'}
          >
            {/* Service summary row */}
            {parsed.serviceGroups.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-gray-700/50">
                {parsed.serviceGroups.map((g, i) => (
                  <span key={i} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium border ${
                    g.failed > 0 ? 'border-red-500/20 bg-red-500/5 text-red-300' : 'border-gray-700 bg-gray-800 text-gray-400'
                  }`}>
                    <ServiceIcon name={g.name} size={10} />
                    {g.name} {g.passed}/{g.checks.length}
                  </span>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {parsed.checks.map((check, idx) => <CheckRow key={idx} check={check} />)}
            </div>
          </Section>
        )}

        {/* Pass/Fail Criteria — only show for non-passing */}
        {!isPassing && criteria && (
          <Section title="Pass/Fail Criteria" icon={Zap} defaultOpen={false}>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                <span className="text-xs font-bold text-green-400 uppercase">Pass Criteria</span>
                <p className="text-sm text-gray-300 mt-1">{criteria.passCriteria}</p>
              </div>
              <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                <span className="text-xs font-bold text-red-400 uppercase">Current Issue</span>
                <p className="text-sm text-gray-300 mt-1">{criteria.failCriteria}</p>
              </div>
              <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                <span className="text-xs font-bold text-blue-400 uppercase">Remediation</span>
                <p className="text-sm text-gray-300 mt-1">{criteria.remediationHint}</p>
              </div>
            </div>
          </Section>
        )}
      </div>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => closeModal('why')}
      title={`${parsed.id} — ${parsed.category}`}
      size="large"
      variant="dark"
    >
      {renderContent()}
    </BaseModal>
  );
};
