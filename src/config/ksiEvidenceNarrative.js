/**
 * KSI Evidence Narrative Configuration
 * 
 * Maps each KSI to human-readable explanations of:
 * - What evidence is collected
 * - What validations are performed
 * - How pass/fail is determined
 * 
 * This provides transparency into the validation process
 * WITHOUT exposing actual evidence file contents.
 */

const KSI_EVIDENCE_NARRATIVES = {
  // ============================================
  // Authorization by FedRAMP (KSI-AFR)
  // ============================================
  'KSI-AFR-01': {
    name: 'Minimum Assessment Scope',
    summary: 'Validates that the cloud service offering scope is properly documented and all components are identified for FedRAMP assessment.',
    evidenceTypes: [
      { name: 'System Boundary', description: 'Inventory of all system components within authorization boundary' },
      { name: 'Data Flow Mapping', description: 'Documentation of data flows between components' },
      { name: 'Service Catalog', description: 'List of services and their security classifications' },
    ],
    validationLogic: 'Pass requires: All system components documented, data flows mapped, and service boundaries clearly defined.',
    passIndicators: ['Complete system inventory', 'Documented data flows', 'Defined authorization boundary'],
    failIndicators: ['Missing component documentation', 'Undefined data flows', 'Unclear system boundaries'],
  },

  'KSI-AFR-04': {
    name: 'Vulnerability Detection and Response',
    summary: 'Validates vulnerability scanning coverage and remediation processes across infrastructure.',
    evidenceTypes: [
      { name: 'Scan Coverage', description: 'Percentage of assets with active vulnerability scanning' },
      { name: 'Remediation SLAs', description: 'Time-to-remediate metrics by severity level' },
      { name: 'Scanner Configuration', description: 'Validation of scanner settings and schedules' },
    ],
    validationLogic: 'Pass requires: 100% scan coverage, critical vulnerabilities remediated within 15 days, high within 30 days.',
    passIndicators: ['Full scan coverage', 'SLAs met', 'No overdue critical findings'],
    failIndicators: ['Scan gaps detected', 'Overdue remediations', 'Missing scanner configuration'],
  },

  'KSI-AFR-11': {
    name: 'Using Cryptographic Modules',
    summary: 'Validates that all cryptographic modules protecting federal data comply with FIPS 140-2/140-3 requirements.',
    evidenceTypes: [
      { name: 'S3 Encryption', description: 'Server-side encryption configuration for all S3 buckets (AES-256 or KMS)' },
      { name: 'RDS Encryption', description: 'Storage encryption status for all RDS database instances' },
      { name: 'KMS Key Policy', description: 'Key management configuration and rotation policies' },
      { name: 'TLS Configuration', description: 'Load balancer listener TLS versions and cipher suites' },
      { name: 'Crypto Policy', description: 'Organization-wide cryptographic standards documentation' },
    ],
    validationLogic: 'Pass requires: All data-at-rest encrypted with FIPS-validated modules, TLS 1.2+ for data-in-transit, KMS keys with appropriate policies.',
    passIndicators: ['All storage encrypted', 'TLS 1.2+ enforced', 'KMS keys properly configured', 'FIPS-validated algorithms'],
    failIndicators: ['Unencrypted storage', 'Weak TLS versions', 'Missing key rotation', 'Non-FIPS algorithms'],
  },

  // ============================================
  // Cybersecurity Education (KSI-CED)
  // ============================================
  'KSI-CED-01': {
    name: 'General Training',
    summary: 'Validates security awareness training completion and effectiveness for all employees.',
    evidenceTypes: [
      { name: 'Training Records', description: 'Completion status for required security training modules' },
      { name: 'Assessment Scores', description: 'Employee performance on security knowledge assessments' },
      { name: 'Training Currency', description: 'Recency of completed training relative to requirements' },
    ],
    validationLogic: 'Pass requires: 100% completion of required training, passing scores on assessments, training current within 12 months.',
    passIndicators: ['All employees trained', 'Passing assessment scores', 'Training up to date'],
    failIndicators: ['Incomplete training', 'Failed assessments', 'Expired certifications'],
  },

  'KSI-CED-02': {
    name: 'Role-Specific Training',
    summary: 'Validates specialized training for employees in high-risk or privileged access roles.',
    evidenceTypes: [
      { name: 'Role Classification', description: 'Identification of privileged access roles requiring specialized training' },
      { name: 'Specialized Curriculum', description: 'Role-specific training modules and requirements' },
      { name: 'Completion Tracking', description: 'Training status for each identified role' },
    ],
    validationLogic: 'Pass requires: All privileged users completed role-specific training, specialized modules defined per role.',
    passIndicators: ['Privileged users trained', 'Role-specific content delivered', 'Current certifications'],
    failIndicators: ['Untrained privileged users', 'Missing role-specific modules', 'Expired training'],
  },

  // ============================================
  // Change Management (KSI-CMT)
  // ============================================
  'KSI-CMT-01': {
    name: 'Log and Monitor Changes',
    summary: 'Validates that all changes to the cloud service are logged and monitored.',
    evidenceTypes: [
      { name: 'CloudTrail Logging', description: 'API activity logging across all AWS regions' },
      { name: 'Config Recording', description: 'AWS Config resource change tracking' },
      { name: 'Change Alerts', description: 'Monitoring alerts for significant configuration changes' },
    ],
    validationLogic: 'Pass requires: CloudTrail enabled in all regions, Config recording active, change alerts configured.',
    passIndicators: ['Full API logging', 'Config tracking enabled', 'Alert rules active'],
    failIndicators: ['Missing trail regions', 'Config disabled', 'No change monitoring'],
  },

  'KSI-CMT-02': {
    name: 'Redeployment',
    summary: 'Validates use of immutable infrastructure patterns with version-controlled deployments.',
    evidenceTypes: [
      { name: 'Infrastructure as Code', description: 'IaC templates in version control (Terraform, CloudFormation)' },
      { name: 'Deployment Pipeline', description: 'CI/CD pipeline configuration for automated deployments' },
      { name: 'Immutability Controls', description: 'Prevention of direct modification to deployed resources' },
    ],
    validationLogic: 'Pass requires: All infrastructure defined as code, deployments through CI/CD only, no manual modifications.',
    passIndicators: ['IaC coverage complete', 'Pipeline deployments only', 'Drift detection active'],
    failIndicators: ['Manual deployments detected', 'Missing IaC definitions', 'Configuration drift'],
  },

  // ============================================
  // Cloud Native Architecture (KSI-CNA)
  // ============================================
  'KSI-CNA-01': {
    name: 'Restrict Network Traffic',
    summary: 'Validates that all resources have properly configured network access controls.',
    evidenceTypes: [
      { name: 'Security Groups', description: 'Inbound and outbound rules for EC2 security groups' },
      { name: 'NACLs', description: 'Network ACL configurations for VPC subnets' },
      { name: 'Default Deny', description: 'Verification of deny-by-default network posture' },
    ],
    validationLogic: 'Pass requires: No unrestricted inbound rules (0.0.0.0/0 on sensitive ports), outbound restricted to necessary services.',
    passIndicators: ['Restricted security groups', 'Proper NACL rules', 'No open admin ports'],
    failIndicators: ['Unrestricted inbound', 'Missing NACLs', 'Open SSH/RDP to internet'],
  },

  'KSI-CNA-06': {
    name: 'High Availability',
    summary: 'Validates infrastructure resilience and high availability configurations.',
    evidenceTypes: [
      { name: 'Multi-AZ Deployment', description: 'Resources distributed across multiple availability zones' },
      { name: 'Auto Scaling', description: 'Auto scaling group configurations for compute resources' },
      { name: 'Load Balancing', description: 'Load balancer health checks and distribution' },
    ],
    validationLogic: 'Pass requires: Critical resources in multiple AZs, auto scaling configured, health checks active.',
    passIndicators: ['Multi-AZ active', 'Auto scaling enabled', 'Health checks passing'],
    failIndicators: ['Single AZ deployment', 'No auto scaling', 'Failed health checks'],
  },

  // ============================================
  // Identity and Access Management (KSI-IAM)
  // ============================================
  'KSI-IAM-01': {
    name: 'Phishing-Resistant MFA',
    summary: 'Validates enforcement of phishing-resistant multi-factor authentication.',
    evidenceTypes: [
      { name: 'MFA Policy', description: 'IAM policies requiring MFA for all user authentication' },
      { name: 'MFA Device Types', description: 'Types of MFA devices in use (hardware keys, authenticator apps)' },
      { name: 'MFA Coverage', description: 'Percentage of users with MFA enabled' },
    ],
    validationLogic: 'Pass requires: 100% MFA coverage, hardware security keys or TOTP authenticators, no SMS-based MFA.',
    passIndicators: ['All users have MFA', 'Phishing-resistant methods', 'Root account secured'],
    failIndicators: ['Users without MFA', 'SMS MFA in use', 'Root MFA missing'],
  },

  'KSI-IAM-04': {
    name: 'Just-in-Time Authorization',
    summary: 'Validates implementation of least-privilege and just-in-time access patterns.',
    evidenceTypes: [
      { name: 'Role Policies', description: 'IAM role permission boundaries and policies' },
      { name: 'Access Patterns', description: 'Analysis of actual permissions used vs. granted' },
      { name: 'Temporary Credentials', description: 'Use of temporary vs. long-lived credentials' },
    ],
    validationLogic: 'Pass requires: No wildcard permissions on sensitive services, temporary credentials preferred, regular access reviews.',
    passIndicators: ['Scoped permissions', 'Temporary credentials', 'Regular access reviews'],
    failIndicators: ['Wildcard permissions', 'Long-lived credentials', 'Stale access grants'],
  },

  // ============================================
  // Monitoring, Logging, and Auditing (KSI-MLA)
  // ============================================
  'KSI-MLA-01': {
    name: 'Security Information and Event Management',
    summary: 'Validates centralized, tamper-resistant logging through SIEM or equivalent systems.',
    evidenceTypes: [
      { name: 'CloudTrail Configuration', description: 'Trail settings, S3 bucket, and log file validation' },
      { name: 'Log Integrity', description: 'Log file validation and integrity monitoring settings' },
      { name: 'Centralization', description: 'Log aggregation to central SIEM or log management' },
    ],
    validationLogic: 'Pass requires: CloudTrail enabled with log validation, logs sent to protected S3 bucket, SIEM integration active.',
    passIndicators: ['Trails active', 'Log validation enabled', 'Centralized collection'],
    failIndicators: ['Missing trails', 'No log validation', 'Decentralized logs'],
  },

  'KSI-MLA-02': {
    name: 'Audit Logging',
    summary: 'Validates comprehensive audit log collection and review processes.',
    evidenceTypes: [
      { name: 'Log Coverage', description: 'Services and actions being logged' },
      { name: 'Retention Policy', description: 'Log retention duration and archival settings' },
      { name: 'Review Process', description: 'Evidence of regular log review and analysis' },
    ],
    validationLogic: 'Pass requires: All security-relevant events logged, 365+ day retention, documented review process.',
    passIndicators: ['Comprehensive logging', 'Adequate retention', 'Regular reviews'],
    failIndicators: ['Log gaps', 'Short retention', 'No review process'],
  },

  // ============================================
  // Policy and Inventory (KSI-PIY)
  // ============================================
  'KSI-PIY-01': {
    name: 'Automated Inventory',
    summary: 'Validates real-time, automated inventory of all information resources.',
    evidenceTypes: [
      { name: 'AWS Config', description: 'Config recorder status and resource coverage' },
      { name: 'Resource Tagging', description: 'Tagging compliance for inventory classification' },
      { name: 'Discovery Tools', description: 'Automated discovery and inventory tools in use' },
    ],
    validationLogic: 'Pass requires: AWS Config enabled, all resource types recorded, consistent tagging strategy.',
    passIndicators: ['Config active', 'Full resource coverage', 'Tagging compliant'],
    failIndicators: ['Config disabled', 'Missing resource types', 'Untagged resources'],
  },

  'KSI-PIY-06': {
    name: 'Security Investment Effectiveness',
    summary: 'Validates tracking and measurement of security investment outcomes.',
    evidenceTypes: [
      { name: 'Metrics Collection', description: 'Security metrics and KPI tracking mechanisms' },
      { name: 'Investment Tracking', description: 'Security tool and program cost tracking' },
      { name: 'Effectiveness Measurement', description: 'Outcomes measurement for security investments' },
    ],
    validationLogic: 'Pass requires: Defined security metrics, investment tracking, documented effectiveness reviews.',
    passIndicators: ['Metrics defined', 'Costs tracked', 'ROI measured'],
    failIndicators: ['No metrics', 'Untracked spending', 'No effectiveness review'],
  },

  // ============================================
  // Recovery Planning (KSI-RPL)
  // ============================================
  'KSI-RPL-01': {
    name: 'Recovery Objectives',
    summary: 'Validates definition of Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO).',
    evidenceTypes: [
      { name: 'RTO Definition', description: 'Documented maximum acceptable downtime per system' },
      { name: 'RPO Definition', description: 'Documented maximum acceptable data loss per system' },
      { name: 'Tier Classification', description: 'System criticality tiers with corresponding objectives' },
    ],
    validationLogic: 'Pass requires: RTO/RPO defined for all critical systems, tiered based on criticality.',
    passIndicators: ['Objectives defined', 'Systems tiered', 'Stakeholder approval'],
    failIndicators: ['Missing objectives', 'No tiering', 'Unapproved values'],
  },

  'KSI-RPL-03': {
    name: 'System Backups',
    summary: 'Validates backup configurations align with defined recovery objectives.',
    evidenceTypes: [
      { name: 'Backup Configuration', description: 'AWS Backup plans and vault configurations' },
      { name: 'Backup Coverage', description: 'Resources included in backup scope' },
      { name: 'Retention Settings', description: 'Backup retention periods and lifecycle policies' },
    ],
    validationLogic: 'Pass requires: Backup plans for all critical resources, retention meets RPO, cross-region copies for DR.',
    passIndicators: ['Full backup coverage', 'Retention adequate', 'Cross-region enabled'],
    failIndicators: ['Unprotected resources', 'Short retention', 'Single region only'],
  },

  // ============================================
  // Service Configuration (KSI-SVC)
  // ============================================
  'KSI-SVC-02': {
    name: 'Network Encryption',
    summary: 'Validates encryption of data in transit across all network communications.',
    evidenceTypes: [
      { name: 'TLS Configuration', description: 'Load balancer and API gateway TLS settings' },
      { name: 'Certificate Management', description: 'SSL/TLS certificate validity and management' },
      { name: 'Internal Encryption', description: 'Encryption between internal services and databases' },
    ],
    validationLogic: 'Pass requires: TLS 1.2+ on all public endpoints, valid certificates, internal traffic encrypted.',
    passIndicators: ['TLS 1.2+ enforced', 'Valid certificates', 'Internal encryption'],
    failIndicators: ['Weak TLS versions', 'Expired certificates', 'Unencrypted internal traffic'],
  },

  'KSI-SVC-06': {
    name: 'Secret Management',
    summary: 'Validates secure storage and rotation of secrets, keys, and credentials.',
    evidenceTypes: [
      { name: 'Secrets Manager', description: 'AWS Secrets Manager configuration and usage' },
      { name: 'Rotation Policies', description: 'Automatic rotation schedules for secrets' },
      { name: 'Access Controls', description: 'IAM policies governing secret access' },
    ],
    validationLogic: 'Pass requires: All secrets in Secrets Manager or Parameter Store, automatic rotation enabled, least-privilege access.',
    passIndicators: ['Centralized secrets', 'Rotation enabled', 'Access controlled'],
    failIndicators: ['Hardcoded secrets', 'No rotation', 'Overly permissive access'],
  },

  // ============================================
  // Third-Party Information Resources (KSI-TPR)
  // ============================================
  'KSI-TPR-03': {
    name: 'Supply Chain Risk Management',
    summary: 'Validates identification and mitigation of supply chain risks.',
    evidenceTypes: [
      { name: 'Vendor Inventory', description: 'List of third-party vendors and their risk classifications' },
      { name: 'Risk Assessments', description: 'Security assessments performed on vendors' },
      { name: 'Contractual Controls', description: 'Security requirements in vendor contracts' },
    ],
    validationLogic: 'Pass requires: All vendors inventoried, risk assessments completed, security clauses in contracts.',
    passIndicators: ['Vendors cataloged', 'Assessments current', 'Contracts reviewed'],
    failIndicators: ['Unknown vendors', 'Missing assessments', 'No security clauses'],
  },

  'KSI-TPR-04': {
    name: 'Supply Chain Risk Monitoring',
    summary: 'Validates continuous monitoring of third-party software for vulnerabilities.',
    evidenceTypes: [
      { name: 'Dependency Scanning', description: 'Automated scanning of software dependencies' },
      { name: 'Vulnerability Feeds', description: 'Subscription to vulnerability notification services' },
      { name: 'Update Process', description: 'Process for applying third-party security updates' },
    ],
    validationLogic: 'Pass requires: Dependency scanning in CI/CD, vulnerability notifications enabled, timely patching process.',
    passIndicators: ['Scanning active', 'Notifications enabled', 'Patch process defined'],
    failIndicators: ['No scanning', 'No notifications', 'Delayed patching'],
  },

  // ============================================
  // Incident Response (KSI-INR)
  // ============================================
  'KSI-INR-01': {
    name: 'Incident Response Procedures',
    summary: 'Validates documented and tested incident response procedures.',
    evidenceTypes: [
      { name: 'IR Plan', description: 'Documented incident response plan and procedures' },
      { name: 'Contact List', description: 'Current incident response team contacts' },
      { name: 'Playbooks', description: 'Incident-specific response playbooks' },
    ],
    validationLogic: 'Pass requires: Documented IR plan, current contact list, playbooks for common incidents.',
    passIndicators: ['Plan documented', 'Contacts current', 'Playbooks available'],
    failIndicators: ['No IR plan', 'Stale contacts', 'Missing playbooks'],
  },
};

/**
 * Get narrative for a specific KSI
 */
export const getKsiNarrative = (ksiId) => {
  return KSI_EVIDENCE_NARRATIVES[ksiId] || null;
};

/**
 * Get all KSI narratives
 */
export const getAllNarratives = () => {
  return KSI_EVIDENCE_NARRATIVES;
};

/**
 * Check if narrative exists for KSI
 */
export const hasNarrative = (ksiId) => {
  return ksiId in KSI_EVIDENCE_NARRATIVES;
};

export default KSI_EVIDENCE_NARRATIVES;
