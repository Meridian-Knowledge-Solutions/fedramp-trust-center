/**
 * KSI Validation Parser
 * 
 * Dynamically parses the engine output (unified_ksi_validations.json) to extract
 * rich validation details for the Why modal and Transparency console.
 * 
 * The engine outputs:
 * - command_executions: Array of {command, description, status, exit_code, execution_time, error_message}
 * - assertion_reason: Summary text like "✅ Excellent (100%): 3 items: 3 verified"
 * - resources_scanned, resources_passed, resources_failed
 * - score, assertion (boolean)
 */

// AWS Service detection from CLI commands
const SERVICE_PATTERNS = {
  's3': { name: 'S3', icon: 'database', category: 'Storage' },
  's3api': { name: 'S3', icon: 'database', category: 'Storage' },
  'ec2': { name: 'EC2', icon: 'server', category: 'Compute' },
  'iam': { name: 'IAM', icon: 'shield', category: 'Identity' },
  'rds': { name: 'RDS', icon: 'database', category: 'Database' },
  'cloudtrail': { name: 'CloudTrail', icon: 'file-text', category: 'Logging' },
  'logs': { name: 'CloudWatch Logs', icon: 'file-text', category: 'Logging' },
  'cloudwatch': { name: 'CloudWatch', icon: 'activity', category: 'Monitoring' },
  'lambda': { name: 'Lambda', icon: 'zap', category: 'Compute' },
  'kms': { name: 'KMS', icon: 'key', category: 'Security' },
  'secretsmanager': { name: 'Secrets Manager', icon: 'lock', category: 'Security' },
  'ssm': { name: 'Systems Manager', icon: 'cpu', category: 'Management' },
  'config': { name: 'AWS Config', icon: 'settings', category: 'Compliance' },
  'configservice': { name: 'AWS Config', icon: 'settings', category: 'Compliance' },
  'guardduty': { name: 'GuardDuty', icon: 'shield', category: 'Security' },
  'securityhub': { name: 'Security Hub', icon: 'shield', category: 'Security' },
  'inspector': { name: 'Inspector', icon: 'search', category: 'Security' },
  'inspector2': { name: 'Inspector', icon: 'search', category: 'Security' },
  'backup': { name: 'AWS Backup', icon: 'archive', category: 'Recovery' },
  'elbv2': { name: 'ELB', icon: 'globe', category: 'Networking' },
  'elb': { name: 'ELB', icon: 'globe', category: 'Networking' },
  'vpc': { name: 'VPC', icon: 'network', category: 'Networking' },
  'sso': { name: 'SSO', icon: 'users', category: 'Identity' },
  'sso-admin': { name: 'SSO', icon: 'users', category: 'Identity' },
  'organizations': { name: 'Organizations', icon: 'layers', category: 'Management' },
  'accessanalyzer': { name: 'IAM Access Analyzer', icon: 'eye', category: 'Security' },
  'codecommit': { name: 'CodeCommit', icon: 'git-branch', category: 'Development' },
  'curl': { name: 'API/HTTP', icon: 'globe', category: 'Documentation' },
};

// KSI Category mapping (from engine)
const KSI_CATEGORIES = {
  'KSI-AAA': { name: 'Authentication & Access', theme: 'Identity' },
  'KSI-IAM': { name: 'Identity and Access Management', theme: 'Identity' },
  'KSI-CNA': { name: 'Cloud Native Architecture', theme: 'Architecture' },
  'KSI-SVC': { name: 'Service Configuration Management', theme: 'Configuration' },
  'KSI-TPR': { name: 'Third-Party Information Resources', theme: 'Risk' },
  'KSI-AFR': { name: 'Authorization by FedRAMP', theme: 'Compliance' },
  'KSI-PIY': { name: 'Policy and Inventory', theme: 'Governance' },
  'KSI-LOG': { name: 'Monitoring, Logging, and Auditing', theme: 'Observability' },
  'KSI-MLA': { name: 'Monitoring, Logging, and Auditing', theme: 'Observability' },
  'KSI-RPL': { name: 'Recovery Planning', theme: 'Resilience' },
  'KSI-CED': { name: 'Cybersecurity Education', theme: 'Training' },
  'KSI-CMT': { name: 'Change Management', theme: 'Operations' },
  'KSI-IRP': { name: 'Incident Response', theme: 'Security' },
  'KSI-INR': { name: 'Incident Response', theme: 'Security' },
  'KSI-DPR': { name: 'Data Protection', theme: 'Security' },
  'KSI-NSC': { name: 'Network Security', theme: 'Security' },
};

/**
 * Extract AWS service from a CLI command string
 */
export const extractServiceFromCommand = (command) => {
  if (!command) return { name: 'Unknown', icon: 'help-circle', category: 'Other' };
  
  const cmdLower = command.toLowerCase().trim();
  
  // Check for curl first
  if (cmdLower.startsWith('curl')) {
    return SERVICE_PATTERNS['curl'];
  }
  
  // Extract service from "aws <service> ..." pattern
  const awsMatch = cmdLower.match(/^aws\s+([a-z0-9-]+)/);
  if (awsMatch) {
    const service = awsMatch[1];
    return SERVICE_PATTERNS[service] || { name: service.toUpperCase(), icon: 'cloud', category: 'AWS' };
  }
  
  return { name: 'CLI', icon: 'terminal', category: 'System' };
};

/**
 * Parse assertion_reason to extract structured findings
 * Example: "✅ Excellent (100%): 3 items: 3 verified"
 * Example: "❌ Insufficient (60%): 5 items: 3 verified, 2 failed"
 */
export const parseAssertionReason = (reason) => {
  if (!reason) return { status: 'unknown', label: 'Unknown', score: 0, findings: [] };
  
  // Extract status icon and label
  const hasPass = reason.includes('✅') || reason.toLowerCase().includes('pass') || reason.toLowerCase().includes('excellent') || reason.toLowerCase().includes('good');
  const hasFail = reason.includes('❌') || reason.toLowerCase().includes('fail') || reason.toLowerCase().includes('insufficient') || reason.toLowerCase().includes('critical');
  
  // Extract percentage score
  const scoreMatch = reason.match(/\((\d+)%\)/);
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : (hasPass ? 100 : 0);
  
  // Determine label
  let label = 'Unknown';
  if (reason.toLowerCase().includes('excellent')) label = 'Excellent';
  else if (reason.toLowerCase().includes('good')) label = 'Good';
  else if (reason.toLowerCase().includes('insufficient')) label = 'Insufficient';
  else if (reason.toLowerCase().includes('technical failure')) label = 'Technical Failure';
  else if (reason.toLowerCase().includes('critical')) label = 'Critical';
  else if (hasPass) label = 'Passed';
  else if (hasFail) label = 'Failed';
  
  // Extract individual findings from the reason text
  const findings = [];
  
  // Pattern: "X verified", "X confirmed", "X failed"
  const verifiedMatch = reason.match(/(\d+)\s*verified/i);
  const confirmedMatch = reason.match(/(\d+)\s*confirmed/i);
  const failedMatch = reason.match(/(\d+)\s*failed/i);
  
  if (verifiedMatch) {
    findings.push({ type: 'pass', count: parseInt(verifiedMatch[1], 10), label: 'Verified' });
  }
  if (confirmedMatch) {
    findings.push({ type: 'pass', count: parseInt(confirmedMatch[1], 10), label: 'Confirmed' });
  }
  if (failedMatch) {
    findings.push({ type: 'fail', count: parseInt(failedMatch[1], 10), label: 'Failed' });
  }
  
  // Split by semicolons or bullets for detailed findings
  const parts = reason.split(/[;•]/).map(s => s.trim()).filter(s => s.length > 0);
  
  return {
    status: hasPass && !hasFail ? 'pass' : hasFail ? 'fail' : 'unknown',
    label,
    score,
    findings,
    details: parts,
  };
};

/**
 * Parse command_executions array into structured check results
 */
export const parseCommandExecutions = (executions) => {
  if (!executions || !Array.isArray(executions)) return [];
  
  return executions.map((exec, idx) => {
    const service = extractServiceFromCommand(exec.command);
    const isPassed = exec.status === 'success' && exec.exit_code === 0;
    
    return {
      index: exec.index ?? idx,
      name: exec.description || `Check #${idx + 1}`,
      command: exec.command,
      service: service.name,
      serviceIcon: service.icon,
      category: service.category,
      status: isPassed ? 'pass' : 'fail',
      exitCode: exec.exit_code,
      executionTime: exec.execution_time,
      errorMessage: exec.error_message,
      passed: isPassed,
    };
  });
};

/**
 * Get KSI category info from KSI ID
 */
export const getKsiCategory = (ksiId) => {
  if (!ksiId) return { name: 'Unknown', theme: 'Other' };
  
  // Extract prefix like "KSI-AAA" from "KSI-AAA-01"
  const parts = ksiId.split('-');
  if (parts.length >= 2) {
    const prefix = `${parts[0]}-${parts[1]}`;
    return KSI_CATEGORIES[prefix] || { name: prefix, theme: 'Compliance' };
  }
  
  return { name: 'General', theme: 'Compliance' };
};

/**
 * Compute outcome summary from check results
 */
export const computeOutcomeSummary = (checks) => {
  if (!checks || checks.length === 0) {
    return {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      passRate: 0,
      status: 'unknown',
    };
  }
  
  const passed = checks.filter(c => c.passed).length;
  const failed = checks.length - passed;
  const passRate = Math.round((passed / checks.length) * 100);
  
  return {
    totalChecks: checks.length,
    passedChecks: passed,
    failedChecks: failed,
    passRate,
    status: passRate >= 80 ? 'pass' : 'fail',
  };
};

/**
 * Group checks by AWS service
 */
export const groupChecksByService = (checks) => {
  const groups = {};
  
  checks.forEach(check => {
    const svc = check.service || 'Other';
    if (!groups[svc]) {
      groups[svc] = {
        name: svc,
        icon: check.serviceIcon,
        category: check.category,
        checks: [],
        passed: 0,
        failed: 0,
      };
    }
    groups[svc].checks.push(check);
    if (check.passed) {
      groups[svc].passed++;
    } else {
      groups[svc].failed++;
    }
  });
  
  return Object.values(groups);
};

/**
 * Main function: Parse a KSI validation object into enriched display data
 */
export const parseKsiValidation = (ksi) => {
  const ksiId = ksi.ksi_id || ksi.id || ksi.validation_id;
  const category = getKsiCategory(ksiId);
  const reasonParsed = parseAssertionReason(ksi.assertion_reason);
  const checks = parseCommandExecutions(ksi.command_executions);
  const outcomeSummary = computeOutcomeSummary(checks);
  const serviceGroups = groupChecksByService(checks);
  
  return {
    // Identity
    id: ksiId,
    category: category.name,
    theme: category.theme,
    requirement: ksi.requirement || ksi.description,
    longName: ksi.long_name,
    
    // Status
    assertion: ksi.assertion,
    score: ksi.score ?? reasonParsed.score,
    status: ksi.assertion ? 'passed' : 'failed',
    statusLabel: reasonParsed.label,
    
    // Resources
    resourcesScanned: ksi.resources_scanned || 0,
    resourcesPassed: ksi.resources_passed || 0,
    resourcesFailed: ksi.resources_failed || 0,
    
    // Parsed assertion reason
    reasonParsed,
    
    // Command execution details
    checks,
    checksSummary: outcomeSummary,
    serviceGroups,
    
    // Raw data for fallback
    assertionReason: ksi.assertion_reason,
    recommendedAction: ksi.recommended_action,
    cliCommand: ksi.cli_command,
    evidencePath: ksi.evidence_path,
    timestamp: ksi.timestamp,
    
    // Commands summary
    commandsExecuted: ksi.commands_executed || checks.length,
    successfulCommands: ksi.successful_commands || outcomeSummary.passedChecks,
  };
};

/**
 * Generate pass/fail criteria text based on parsed data
 */
export const generateCriteriaText = (parsed) => {
  const { checksSummary, serviceGroups } = parsed;
  
  // Generate dynamic pass criteria
  const services = serviceGroups.map(g => g.name).join(', ');
  const passCriteria = checksSummary.totalChecks > 0
    ? `All ${checksSummary.totalChecks} validation checks must pass across ${services || 'configured services'}`
    : 'Validation checks must complete successfully';
  
  // Generate dynamic fail criteria
  const failCriteria = checksSummary.failedChecks > 0
    ? `${checksSummary.failedChecks} of ${checksSummary.totalChecks} checks failed (${100 - checksSummary.passRate}% failure rate)`
    : 'One or more validation checks failed or returned errors';
  
  // Generate remediation hint based on failed services
  const failedServices = serviceGroups.filter(g => g.failed > 0).map(g => g.name);
  const remediationHint = failedServices.length > 0
    ? `Review and remediate issues in: ${failedServices.join(', ')}`
    : 'Review validation output and apply necessary configuration changes';
  
  return {
    passCriteria,
    failCriteria,
    remediationHint,
  };
};

export default {
  extractServiceFromCommand,
  parseAssertionReason,
  parseCommandExecutions,
  getKsiCategory,
  computeOutcomeSummary,
  groupChecksByService,
  parseKsiValidation,
  generateCriteriaText,
};
