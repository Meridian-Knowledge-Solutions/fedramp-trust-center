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
    summary: 'Validates that the cloud service offering scope is properly documented and all components are identified for FedRAMP assessment per the Minimum Assessment Standard (MAS).',
    evidenceTypes: [
      { name: 'System Boundary', description: 'Inventory of all system components within authorization boundary' },
      { name: 'Data Flow Mapping', description: 'Documentation of data flows between components' },
      { name: 'Service Catalog', description: 'List of services and their security classifications' },
    ],
    validationLogic: 'Pass requires: All system components documented, data flows mapped, and service boundaries clearly defined.',
    passIndicators: ['Complete system inventory', 'Documented data flows', 'Defined authorization boundary'],
    failIndicators: ['Missing component documentation', 'Undefined data flows', 'Unclear system boundaries'],
  },

  'KSI-AFR-02': {
    name: 'Key Security Indicators',
    summary: 'Validates that security goals are set based on FedRAMP 20x Phase Two KSIs with automated validation of status and progress.',
    evidenceTypes: [
      { name: 'KSI Coverage', description: 'Percentage of KSIs with automated validation' },
      { name: 'Validation Pipeline', description: 'CI/CD integration for continuous KSI assessment' },
      { name: 'Progress Tracking', description: 'Historical trend data for KSI compliance' },
    ],
    validationLogic: 'Pass requires: Automated validation for all applicable KSIs, continuous monitoring pipeline active.',
    passIndicators: ['Full KSI coverage', 'Automated validation active', 'Progress tracked'],
    failIndicators: ['Missing KSI validators', 'Manual-only assessment', 'No trend tracking'],
  },

  'KSI-AFR-03': {
    name: 'Authorization Data Sharing',
    summary: 'Validates alignment with the FedRAMP Authorization Data Sharing (ADS) standard for sharing authorization data with necessary parties.',
    evidenceTypes: [
      { name: 'Data Sharing Policy', description: 'Documented policy for authorization data sharing' },
      { name: 'Access Controls', description: 'Controls governing who can access authorization data' },
      { name: 'Audit Trail', description: 'Logging of authorization data access and sharing' },
    ],
    validationLogic: 'Pass requires: Documented data sharing policy, appropriate access controls, audit logging enabled.',
    passIndicators: ['Policy documented', 'Access controlled', 'Sharing audited'],
    failIndicators: ['No sharing policy', 'Unrestricted access', 'No audit trail'],
  },

  'KSI-AFR-04': {
    name: 'Vulnerability Detection and Response',
    summary: 'Validates vulnerability scanning coverage and remediation processes per the FedRAMP VDR standard.',
    evidenceTypes: [
      { name: 'Scan Coverage', description: 'Percentage of assets with active vulnerability scanning' },
      { name: 'Remediation SLAs', description: 'Time-to-remediate metrics by severity level' },
      { name: 'Scanner Configuration', description: 'Validation of scanner settings and schedules' },
    ],
    validationLogic: 'Pass requires: 100% scan coverage, critical vulnerabilities remediated within 15 days, high within 30 days.',
    passIndicators: ['Full scan coverage', 'SLAs met', 'No overdue critical findings'],
    failIndicators: ['Scan gaps detected', 'Overdue remediations', 'Missing scanner configuration'],
  },

  'KSI-AFR-05': {
    name: 'Significant Change Notifications',
    summary: 'Validates that significant changes to the cloud service are properly documented and communicated per SCN requirements.',
    evidenceTypes: [
      { name: 'Change Records', description: 'Documentation of significant changes made to the system' },
      { name: 'Notification Process', description: 'Process for notifying stakeholders of changes' },
      { name: 'Impact Assessment', description: 'Security impact analysis for changes' },
    ],
    validationLogic: 'Pass requires: All significant changes documented, notifications sent, impact assessed.',
    passIndicators: ['Changes documented', 'Stakeholders notified', 'Impact assessed'],
    failIndicators: ['Undocumented changes', 'Missing notifications', 'No impact analysis'],
  },

  'KSI-AFR-06': {
    name: 'Incident Communications Procedures',
    summary: 'Validates documented procedures for communicating security incidents to affected parties and FedRAMP.',
    evidenceTypes: [
      { name: 'Communication Plan', description: 'Documented incident communication procedures' },
      { name: 'Contact Lists', description: 'Current contact information for incident notifications' },
      { name: 'Timeline Requirements', description: 'Defined timeframes for incident reporting' },
    ],
    validationLogic: 'Pass requires: Documented communication plan, current contacts, defined reporting timelines.',
    passIndicators: ['Plan documented', 'Contacts current', 'Timelines defined'],
    failIndicators: ['No communication plan', 'Stale contacts', 'Undefined timelines'],
  },

  'KSI-AFR-07': {
    name: 'FedRAMP Security Inbox',
    summary: 'Validates maintenance of a dedicated security inbox for FedRAMP communications that is actively monitored.',
    evidenceTypes: [
      { name: 'Inbox Configuration', description: 'Dedicated email address for FedRAMP security communications' },
      { name: 'Monitoring Process', description: 'Process for monitoring and responding to inbox messages' },
      { name: 'Response SLAs', description: 'Defined timeframes for responding to communications' },
    ],
    validationLogic: 'Pass requires: Dedicated inbox configured, actively monitored, response SLAs defined.',
    passIndicators: ['Inbox active', 'Monitoring in place', 'SLAs met'],
    failIndicators: ['No dedicated inbox', 'Unmonitored', 'Slow responses'],
  },

  'KSI-AFR-08': {
    name: 'Persistent Validation and Assessment',
    summary: 'Validates continuous security assessment and validation processes are in place and operating.',
    evidenceTypes: [
      { name: 'Continuous Monitoring', description: 'Automated continuous security monitoring tools' },
      { name: 'Assessment Schedule', description: 'Regular security assessment schedule' },
      { name: 'Validation Results', description: 'Historical validation and assessment results' },
    ],
    validationLogic: 'Pass requires: Continuous monitoring active, regular assessments performed, results documented.',
    passIndicators: ['Monitoring active', 'Assessments current', 'Results documented'],
    failIndicators: ['No continuous monitoring', 'Missed assessments', 'Undocumented results'],
  },

  'KSI-AFR-09': {
    name: 'Collaborative Continuous Monitoring',
    summary: 'Validates collaborative approach to continuous monitoring with agencies and FedRAMP.',
    evidenceTypes: [
      { name: 'Collaboration Framework', description: 'Framework for collaborative monitoring with stakeholders' },
      { name: 'Shared Dashboards', description: 'Shared visibility into security posture' },
      { name: 'Communication Channels', description: 'Established channels for security collaboration' },
    ],
    validationLogic: 'Pass requires: Collaboration framework defined, shared visibility provided, channels established.',
    passIndicators: ['Framework defined', 'Dashboards shared', 'Channels active'],
    failIndicators: ['No collaboration', 'No shared visibility', 'Communication gaps'],
  },

  'KSI-AFR-10': {
    name: 'Recommended Secure Configuration',
    summary: 'Validates that recommended secure configurations are documented and implemented.',
    evidenceTypes: [
      { name: 'Configuration Baselines', description: 'Documented secure configuration baselines' },
      { name: 'Compliance Scanning', description: 'Automated configuration compliance scanning' },
      { name: 'Deviation Tracking', description: 'Tracking and approval of configuration deviations' },
    ],
    validationLogic: 'Pass requires: Baselines documented, compliance scanning active, deviations tracked.',
    passIndicators: ['Baselines defined', 'Scanning active', 'Deviations managed'],
    failIndicators: ['No baselines', 'No compliance scanning', 'Untracked deviations'],
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

  'KSI-CED-03': {
    name: 'Developer Security Training',
    summary: 'Validates role-specific security training for development staff on secure coding practices.',
    evidenceTypes: [
      { name: 'Developer Training', description: 'Secure coding training completion for development staff' },
      { name: 'OWASP Coverage', description: 'Training coverage of OWASP Top 10 and secure development' },
      { name: 'Certification Status', description: 'Developer security certifications and currency' },
    ],
    validationLogic: 'Pass requires: All developers completed secure coding training, OWASP awareness verified.',
    passIndicators: ['Developers trained', 'OWASP covered', 'Certifications current'],
    failIndicators: ['Untrained developers', 'Missing OWASP training', 'Expired certifications'],
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

  'KSI-CMT-03': {
    name: 'Version Control',
    summary: 'Validates that all code and configuration changes are tracked in version control systems.',
    evidenceTypes: [
      { name: 'Repository Coverage', description: 'All code and configuration in version control' },
      { name: 'Branch Protection', description: 'Protected branches requiring reviews' },
      { name: 'Commit Signing', description: 'Cryptographic signing of commits' },
    ],
    validationLogic: 'Pass requires: All code in version control, branch protection enabled, commit history maintained.',
    passIndicators: ['Full VCS coverage', 'Branches protected', 'History preserved'],
    failIndicators: ['Code outside VCS', 'Unprotected branches', 'Missing history'],
  },

  'KSI-CMT-04': {
    name: 'Change Management Procedure',
    summary: 'Validates that a documented change management procedure is followed for all changes.',
    evidenceTypes: [
      { name: 'Change Policy', description: 'Documented change management policy and procedures' },
      { name: 'Approval Workflow', description: 'Change approval and review workflow' },
      { name: 'Change Records', description: 'Documentation of approved and implemented changes' },
    ],
    validationLogic: 'Pass requires: Documented policy, approval workflow enforced, changes recorded.',
    passIndicators: ['Policy documented', 'Approvals required', 'Changes tracked'],
    failIndicators: ['No policy', 'Unapproved changes', 'Missing records'],
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

  'KSI-CNA-02': {
    name: 'Minimize Attack Surface',
    summary: 'Validates systems are designed to minimize attack surface and lateral movement.',
    evidenceTypes: [
      { name: 'Network Segmentation', description: 'VPC and subnet segmentation for isolation' },
      { name: 'Service Exposure', description: 'Inventory of publicly exposed services' },
      { name: 'Unnecessary Services', description: 'Identification and removal of unnecessary services' },
    ],
    validationLogic: 'Pass requires: Proper network segmentation, minimal public exposure, no unnecessary services.',
    passIndicators: ['Segmentation implemented', 'Minimal exposure', 'Services hardened'],
    failIndicators: ['Flat network', 'Over-exposed services', 'Unnecessary services running'],
  },

  'KSI-CNA-03': {
    name: 'Enforce Traffic Flow',
    summary: 'Validates use of logical networking to enforce traffic flow controls.',
    evidenceTypes: [
      { name: 'VPC Flow Logs', description: 'Network traffic flow logging enabled' },
      { name: 'Route Tables', description: 'Route table configurations for traffic control' },
      { name: 'Traffic Policies', description: 'Documented traffic flow policies and enforcement' },
    ],
    validationLogic: 'Pass requires: Flow logs enabled, proper routing configured, traffic policies enforced.',
    passIndicators: ['Flow logs active', 'Routing correct', 'Policies enforced'],
    failIndicators: ['No flow logs', 'Misconfigured routes', 'Unenforced policies'],
  },

  'KSI-CNA-04': {
    name: 'Immutable Infrastructure',
    summary: 'Validates use of immutable infrastructure with strictly defined functionality.',
    evidenceTypes: [
      { name: 'Image Management', description: 'Use of hardened, immutable machine images' },
      { name: 'Container Security', description: 'Immutable container configurations' },
      { name: 'Drift Detection', description: 'Detection of unauthorized modifications' },
    ],
    validationLogic: 'Pass requires: Immutable images used, no runtime modifications, drift detection active.',
    passIndicators: ['Immutable images', 'No runtime changes', 'Drift detected'],
    failIndicators: ['Mutable infrastructure', 'Runtime modifications', 'No drift detection'],
  },

  'KSI-CNA-05': {
    name: 'Unwanted Activity Protection',
    summary: 'Validates protection against denial of service attacks and other unwanted activity.',
    evidenceTypes: [
      { name: 'DDoS Protection', description: 'AWS Shield or equivalent DDoS protection' },
      { name: 'WAF Configuration', description: 'Web Application Firewall rules and policies' },
      { name: 'Rate Limiting', description: 'API and service rate limiting configuration' },
    ],
    validationLogic: 'Pass requires: DDoS protection enabled, WAF configured, rate limiting in place.',
    passIndicators: ['DDoS protected', 'WAF active', 'Rate limits set'],
    failIndicators: ['No DDoS protection', 'WAF disabled', 'No rate limiting'],
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

  'KSI-CNA-07': {
    name: 'Cloud Provider Best Practices',
    summary: 'Validates cloud-native resources follow host provider best practices and guidance.',
    evidenceTypes: [
      { name: 'AWS Well-Architected', description: 'Alignment with AWS Well-Architected Framework' },
      { name: 'Security Best Practices', description: 'Implementation of cloud provider security guidance' },
      { name: 'Configuration Standards', description: 'Adherence to documented configuration standards' },
    ],
    validationLogic: 'Pass requires: Well-Architected review completed, best practices implemented.',
    passIndicators: ['Well-Architected aligned', 'Best practices followed', 'Standards met'],
    failIndicators: ['Not Well-Architected', 'Best practices ignored', 'Standards violations'],
  },

  'KSI-CNA-08': {
    name: 'Persistent Assessment and Automated Enforcement',
    summary: 'Validates automated services persistently assess security posture and enforce intended state.',
    evidenceTypes: [
      { name: 'CSPM Tools', description: 'Cloud Security Posture Management tool deployment' },
      { name: 'Auto-Remediation', description: 'Automated remediation of security findings' },
      { name: 'Continuous Assessment', description: 'Continuous security posture assessment results' },
    ],
    validationLogic: 'Pass requires: CSPM active, auto-remediation enabled for critical issues, continuous assessment running.',
    passIndicators: ['CSPM deployed', 'Auto-remediation active', 'Assessment continuous'],
    failIndicators: ['No CSPM', 'Manual remediation only', 'Point-in-time assessment'],
  },

  // ============================================
  // Identity and Access Management (KSI-IAM)
  // ============================================
  'KSI-IAM-01': {
    name: 'Phishing-Resistant MFA',
    summary: 'Validates enforcement of phishing-resistant multi-factor authentication for all users.',
    evidenceTypes: [
      { name: 'MFA Policy', description: 'IAM policies requiring MFA for all user authentication' },
      { name: 'MFA Device Types', description: 'Types of MFA devices in use (hardware keys, authenticator apps)' },
      { name: 'MFA Coverage', description: 'Percentage of users with MFA enabled' },
    ],
    validationLogic: 'Pass requires: 100% MFA coverage, hardware security keys or TOTP authenticators, no SMS-based MFA.',
    passIndicators: ['All users have MFA', 'Phishing-resistant methods', 'Root account secured'],
    failIndicators: ['Users without MFA', 'SMS MFA in use', 'Root MFA missing'],
  },

  'KSI-IAM-02': {
    name: 'Passwordless Authentication',
    summary: 'Validates use of secure passwordless methods or strong passwords with MFA.',
    evidenceTypes: [
      { name: 'Authentication Methods', description: 'Authentication methods in use across the system' },
      { name: 'Password Policy', description: 'Password complexity and rotation requirements' },
      { name: 'SSO Configuration', description: 'Single sign-on and federation configuration' },
    ],
    validationLogic: 'Pass requires: Passwordless where feasible, strong password policy enforced, SSO implemented.',
    passIndicators: ['Passwordless enabled', 'Strong passwords', 'SSO active'],
    failIndicators: ['Weak passwords', 'No password policy', 'No SSO'],
  },

  'KSI-IAM-03': {
    name: 'Non-User Account Security',
    summary: 'Validates secure authentication methods for non-user accounts and services.',
    evidenceTypes: [
      { name: 'Service Accounts', description: 'Inventory of service and non-user accounts' },
      { name: 'Key Rotation', description: 'Access key rotation schedules and compliance' },
      { name: 'Role-Based Access', description: 'Use of IAM roles instead of long-lived credentials' },
    ],
    validationLogic: 'Pass requires: Service accounts inventoried, keys rotated, roles preferred over keys.',
    passIndicators: ['Accounts inventoried', 'Keys rotated', 'Roles used'],
    failIndicators: ['Unknown accounts', 'Stale keys', 'Long-lived credentials'],
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

  'KSI-IAM-05': {
    name: 'Least Privilege',
    summary: 'Validates identity and access management always verifies users can only access needed resources.',
    evidenceTypes: [
      { name: 'Permission Analysis', description: 'Analysis of granted vs. used permissions' },
      { name: 'Access Reviews', description: 'Regular access review processes and results' },
      { name: 'Policy Optimization', description: 'Optimization of overly permissive policies' },
    ],
    validationLogic: 'Pass requires: Regular access reviews, unused permissions removed, policies optimized.',
    passIndicators: ['Reviews completed', 'Permissions optimized', 'Least privilege enforced'],
    failIndicators: ['No reviews', 'Excessive permissions', 'Stale access'],
  },

  'KSI-IAM-06': {
    name: 'Suspicious Activity Response',
    summary: 'Validates automatic disabling or securing of accounts in response to suspicious activity.',
    evidenceTypes: [
      { name: 'Anomaly Detection', description: 'Detection of suspicious account activity' },
      { name: 'Automated Response', description: 'Automated account lockout or restriction' },
      { name: 'Alert Configuration', description: 'Alerting for suspicious activity events' },
    ],
    validationLogic: 'Pass requires: Anomaly detection active, automated response configured, alerts enabled.',
    passIndicators: ['Detection active', 'Auto-response enabled', 'Alerts configured'],
    failIndicators: ['No detection', 'Manual response only', 'No alerts'],
  },

  'KSI-IAM-07': {
    name: 'Automated Account Management',
    summary: 'Validates secure lifecycle management of all accounts, roles, and groups using automation.',
    evidenceTypes: [
      { name: 'Lifecycle Automation', description: 'Automated account provisioning and deprovisioning' },
      { name: 'Access Certification', description: 'Regular certification of account access' },
      { name: 'Orphan Detection', description: 'Detection of orphaned or unused accounts' },
    ],
    validationLogic: 'Pass requires: Automated provisioning, regular certification, orphan accounts removed.',
    passIndicators: ['Automation active', 'Certification current', 'No orphans'],
    failIndicators: ['Manual provisioning', 'No certification', 'Orphan accounts exist'],
  },

  // ============================================
  // Incident Response (KSI-INR)
  // ============================================
  'KSI-INR-01': {
    name: 'Incident Response Procedure',
    summary: 'Validates documented and tested incident response procedures are followed.',
    evidenceTypes: [
      { name: 'IR Plan', description: 'Documented incident response plan and procedures' },
      { name: 'Contact List', description: 'Current incident response team contacts' },
      { name: 'Playbooks', description: 'Incident-specific response playbooks' },
    ],
    validationLogic: 'Pass requires: Documented IR plan, current contact list, playbooks for common incidents.',
    passIndicators: ['Plan documented', 'Contacts current', 'Playbooks available'],
    failIndicators: ['No IR plan', 'Stale contacts', 'Missing playbooks'],
  },

  'KSI-INR-02': {
    name: 'Incident Logging',
    summary: 'Validates maintenance of incident logs and periodic review for patterns.',
    evidenceTypes: [
      { name: 'Incident Log', description: 'Log of security incidents and responses' },
      { name: 'Pattern Analysis', description: 'Analysis of incident patterns and trends' },
      { name: 'Review Process', description: 'Regular incident log review process' },
    ],
    validationLogic: 'Pass requires: Incidents logged, patterns analyzed, regular reviews conducted.',
    passIndicators: ['Logging active', 'Patterns analyzed', 'Reviews current'],
    failIndicators: ['No logging', 'No analysis', 'No reviews'],
  },

  'KSI-INR-03': {
    name: 'Incident After Action Reports',
    summary: 'Validates generation of after action reports and incorporation of lessons learned.',
    evidenceTypes: [
      { name: 'After Action Reports', description: 'Post-incident analysis reports' },
      { name: 'Lessons Learned', description: 'Documentation of lessons learned from incidents' },
      { name: 'Process Improvements', description: 'Improvements implemented based on lessons learned' },
    ],
    validationLogic: 'Pass requires: After action reports generated, lessons documented, improvements implemented.',
    passIndicators: ['Reports generated', 'Lessons documented', 'Improvements made'],
    failIndicators: ['No reports', 'No lessons captured', 'No improvements'],
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
    summary: 'Validates comprehensive audit log collection and regular review processes.',
    evidenceTypes: [
      { name: 'Log Coverage', description: 'Services and actions being logged' },
      { name: 'Retention Policy', description: 'Log retention duration and archival settings' },
      { name: 'Review Process', description: 'Evidence of regular log review and analysis' },
    ],
    validationLogic: 'Pass requires: All security-relevant events logged, 365+ day retention, documented review process.',
    passIndicators: ['Comprehensive logging', 'Adequate retention', 'Regular reviews'],
    failIndicators: ['Log gaps', 'Short retention', 'No review process'],
  },

  'KSI-MLA-05': {
    name: 'Infrastructure as Code Evaluation',
    summary: 'Validates Infrastructure as Code and configuration evaluation and testing.',
    evidenceTypes: [
      { name: 'IaC Scanning', description: 'Security scanning of Infrastructure as Code templates' },
      { name: 'Policy as Code', description: 'Automated policy enforcement in CI/CD' },
      { name: 'Configuration Testing', description: 'Testing of configuration changes before deployment' },
    ],
    validationLogic: 'Pass requires: IaC scanning in CI/CD, policy enforcement active, configuration tested.',
    passIndicators: ['IaC scanned', 'Policies enforced', 'Configs tested'],
    failIndicators: ['No scanning', 'No policy enforcement', 'Untested configs'],
  },

  'KSI-MLA-07': {
    name: 'Event Types',
    summary: 'Validates maintenance of list of monitored resources and event types.',
    evidenceTypes: [
      { name: 'Resource Inventory', description: 'List of resources being monitored' },
      { name: 'Event Types', description: 'Event types being captured and logged' },
      { name: 'Coverage Analysis', description: 'Analysis of monitoring coverage completeness' },
    ],
    validationLogic: 'Pass requires: Resources inventoried, event types documented, full coverage verified.',
    passIndicators: ['Resources listed', 'Events documented', 'Coverage complete'],
    failIndicators: ['Missing resources', 'Undocumented events', 'Coverage gaps'],
  },

  'KSI-MLA-08': {
    name: 'Log Data Access',
    summary: 'Validates least-privileged, role-based access to log data based on sensitivity.',
    evidenceTypes: [
      { name: 'Access Controls', description: 'IAM policies governing log data access' },
      { name: 'Role Definitions', description: 'Roles defined for log data access levels' },
      { name: 'Access Audit', description: 'Audit trail of log data access' },
    ],
    validationLogic: 'Pass requires: Role-based access defined, least privilege enforced, access audited.',
    passIndicators: ['RBAC defined', 'Least privilege', 'Access audited'],
    failIndicators: ['No RBAC', 'Excessive access', 'No audit trail'],
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

  'KSI-PIY-02': {
    name: 'Security Objectives and Requirements',
    summary: 'Validates documentation of security objectives and requirements for resources.',
    evidenceTypes: [
      { name: 'Security Requirements', description: 'Documented security requirements per resource type' },
      { name: 'Objectives Documentation', description: 'Security objectives for the system' },
      { name: 'Compliance Mapping', description: 'Mapping of requirements to controls' },
    ],
    validationLogic: 'Pass requires: Requirements documented, objectives defined, compliance mapped.',
    passIndicators: ['Requirements documented', 'Objectives defined', 'Mapping complete'],
    failIndicators: ['Missing requirements', 'No objectives', 'Unmapped controls'],
  },

  'KSI-PIY-03': {
    name: 'Vulnerability Disclosure Program',
    summary: 'Validates maintenance of a vulnerability disclosure program.',
    evidenceTypes: [
      { name: 'VDP Policy', description: 'Published vulnerability disclosure policy' },
      { name: 'Submission Process', description: 'Process for receiving vulnerability reports' },
      { name: 'Response SLAs', description: 'Defined response times for vulnerability reports' },
    ],
    validationLogic: 'Pass requires: VDP published, submission process active, response SLAs defined.',
    passIndicators: ['VDP published', 'Submissions accepted', 'SLAs met'],
    failIndicators: ['No VDP', 'No submission process', 'Slow responses'],
  },

  'KSI-PIY-04': {
    name: 'CISA Secure By Design',
    summary: 'Validates alignment with CISA Secure By Design principles in SDLC.',
    evidenceTypes: [
      { name: 'SDLC Security', description: 'Security integration in software development lifecycle' },
      { name: 'Secure By Design', description: 'Alignment with CISA Secure By Design principles' },
      { name: 'Security Testing', description: 'Security testing integrated in development' },
    ],
    validationLogic: 'Pass requires: Security in SDLC, Secure By Design aligned, security testing active.',
    passIndicators: ['SDLC secured', 'SBD aligned', 'Testing active'],
    failIndicators: ['No SDLC security', 'Not SBD aligned', 'No testing'],
  },

  'KSI-PIY-05': {
    name: 'Evaluate Implementations',
    summary: 'Validates documentation of methods used to evaluate information resource implementations.',
    evidenceTypes: [
      { name: 'Evaluation Methods', description: 'Documented evaluation methodologies' },
      { name: 'Assessment Criteria', description: 'Criteria for implementation assessment' },
      { name: 'Results Documentation', description: 'Documentation of evaluation results' },
    ],
    validationLogic: 'Pass requires: Methods documented, criteria defined, results recorded.',
    passIndicators: ['Methods documented', 'Criteria defined', 'Results recorded'],
    failIndicators: ['No methods', 'No criteria', 'Missing results'],
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

  'KSI-RPL-02': {
    name: 'Recovery Testing',
    summary: 'Validates regular testing of recovery procedures and capabilities.',
    evidenceTypes: [
      { name: 'Test Schedule', description: 'Schedule for recovery testing exercises' },
      { name: 'Test Results', description: 'Results from recovery testing exercises' },
      { name: 'Remediation Actions', description: 'Actions taken to address test findings' },
    ],
    validationLogic: 'Pass requires: Regular testing performed, results documented, findings remediated.',
    passIndicators: ['Testing scheduled', 'Results documented', 'Findings addressed'],
    failIndicators: ['No testing', 'Missing results', 'Unaddressed findings'],
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
  'KSI-SVC-01': {
    name: 'Secure Configuration',
    summary: 'Validates all services are configured according to security baselines.',
    evidenceTypes: [
      { name: 'Configuration Baselines', description: 'Documented secure configuration baselines' },
      { name: 'Compliance Scanning', description: 'Automated configuration compliance scanning' },
      { name: 'Deviation Management', description: 'Process for managing configuration deviations' },
    ],
    validationLogic: 'Pass requires: Baselines defined, compliance scanning active, deviations managed.',
    passIndicators: ['Baselines defined', 'Scanning active', 'Deviations tracked'],
    failIndicators: ['No baselines', 'No scanning', 'Untracked deviations'],
  },

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

  'KSI-SVC-03': {
    name: 'Data at Rest Encryption',
    summary: 'Validates encryption of all data at rest using approved encryption methods.',
    evidenceTypes: [
      { name: 'Storage Encryption', description: 'Encryption status for all storage services' },
      { name: 'Key Management', description: 'Encryption key management and rotation' },
      { name: 'Encryption Standards', description: 'Compliance with approved encryption standards' },
    ],
    validationLogic: 'Pass requires: All storage encrypted, keys properly managed, FIPS-compliant algorithms.',
    passIndicators: ['Storage encrypted', 'Keys managed', 'FIPS compliant'],
    failIndicators: ['Unencrypted storage', 'Poor key management', 'Non-FIPS algorithms'],
  },

  'KSI-SVC-04': {
    name: 'Public Access Prevention',
    summary: 'Validates prevention of unintended public access to resources.',
    evidenceTypes: [
      { name: 'S3 Block Public Access', description: 'Account and bucket-level public access blocks' },
      { name: 'Public Resource Audit', description: 'Inventory of intentionally public resources' },
      { name: 'Access Monitoring', description: 'Monitoring for unexpected public access' },
    ],
    validationLogic: 'Pass requires: Public access blocked by default, public resources documented, monitoring active.',
    passIndicators: ['Access blocked', 'Public documented', 'Monitoring active'],
    failIndicators: ['Access not blocked', 'Undocumented public', 'No monitoring'],
  },

  'KSI-SVC-05': {
    name: 'Endpoint Protection',
    summary: 'Validates endpoint protection measures are deployed and active.',
    evidenceTypes: [
      { name: 'Endpoint Security', description: 'Endpoint protection agent deployment status' },
      { name: 'Malware Protection', description: 'Anti-malware and threat detection coverage' },
      { name: 'Endpoint Hardening', description: 'Endpoint hardening configuration status' },
    ],
    validationLogic: 'Pass requires: Agents deployed, malware protection active, endpoints hardened.',
    passIndicators: ['Agents deployed', 'Protection active', 'Endpoints hardened'],
    failIndicators: ['Missing agents', 'No protection', 'Unhardened endpoints'],
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

  'KSI-SVC-07': {
    name: 'Patch Management',
    summary: 'Validates timely patching of systems and software.',
    evidenceTypes: [
      { name: 'Patch Status', description: 'Current patch status across all systems' },
      { name: 'Patch SLAs', description: 'Patching timeframes by severity' },
      { name: 'Patch Automation', description: 'Automated patching processes and coverage' },
    ],
    validationLogic: 'Pass requires: Critical patches within 15 days, high within 30 days, automation where possible.',
    passIndicators: ['Patches current', 'SLAs met', 'Automation active'],
    failIndicators: ['Overdue patches', 'SLAs missed', 'Manual patching'],
  },

  'KSI-SVC-08': {
    name: 'Residual Element Prevention',
    summary: 'Validates changes do not introduce or leave residual elements affecting CIA.',
    evidenceTypes: [
      { name: 'Residual Detection', description: 'Detection of residual elements from changes' },
      { name: 'Cleanup Verification', description: 'Verification of proper cleanup after changes' },
      { name: 'Impact Assessment', description: 'Assessment of change impact on CIA' },
    ],
    validationLogic: 'Pass requires: Residual detection active, cleanup verified, impact assessed.',
    passIndicators: ['Detection active', 'Cleanup verified', 'Impact assessed'],
    failIndicators: ['No detection', 'Missing cleanup', 'No assessment'],
  },

  'KSI-SVC-09': {
    name: 'Communication Integrity',
    summary: 'Validates persistent validation of authenticity and integrity of communications.',
    evidenceTypes: [
      { name: 'Integrity Validation', description: 'Validation of communication integrity between resources' },
      { name: 'Authentication', description: 'Mutual authentication between services' },
      { name: 'Monitoring', description: 'Monitoring of communication integrity' },
    ],
    validationLogic: 'Pass requires: Integrity validation active, mutual authentication enabled, monitoring in place.',
    passIndicators: ['Integrity validated', 'Auth enabled', 'Monitoring active'],
    failIndicators: ['No validation', 'No auth', 'No monitoring'],
  },

  'KSI-SVC-10': {
    name: 'Data Destruction',
    summary: 'Validates prompt removal of unwanted federal customer data when requested.',
    evidenceTypes: [
      { name: 'Data Destruction Policy', description: 'Policy for data destruction requests' },
      { name: 'Destruction Process', description: 'Process for executing data destruction' },
      { name: 'Verification', description: 'Verification that data destruction is complete' },
    ],
    validationLogic: 'Pass requires: Policy defined, process documented, destruction verified.',
    passIndicators: ['Policy defined', 'Process documented', 'Destruction verified'],
    failIndicators: ['No policy', 'No process', 'Unverified destruction'],
  },

  // ============================================
  // Third-Party Information Resources (KSI-TPR)
  // ============================================
  'KSI-TPR-03': {
    name: 'Supply Chain Risk Management',
    summary: 'Validates identification and prioritization of supply chain risk mitigation.',
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
    summary: 'Validates automatic monitoring of third-party software for upstream vulnerabilities.',
    evidenceTypes: [
      { name: 'Dependency Scanning', description: 'Automated scanning of software dependencies' },
      { name: 'Vulnerability Feeds', description: 'Subscription to vulnerability notification services' },
      { name: 'Update Process', description: 'Process for applying third-party security updates' },
    ],
    validationLogic: 'Pass requires: Dependency scanning in CI/CD, vulnerability notifications enabled, timely patching process.',
    passIndicators: ['Scanning active', 'Notifications enabled', 'Patch process defined'],
    failIndicators: ['No scanning', 'No notifications', 'Delayed patching'],
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
