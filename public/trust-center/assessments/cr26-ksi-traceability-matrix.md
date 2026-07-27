# CR26 KSI Traceability Matrix — Meridian LMS

**Rules baseline:** FedRAMP Consolidated Rules for 2026, v2026.07.02.02  
**Certification Profile:** 20x · Program · Class C  
**Latest automated validation run:** 2026-07-26T20:56:57.488089+00:00 (36 pass / 10 fail of 46)  
**Generated:** 2026-07-26 21:44 UTC by `scripts/generate_ksi_traceability.py`

Each entry traces the verbatim CR26 indicator statement to the measures that
demonstrate it (curated CLI validations and their objectives), the evidence
artifacts produced, the evaluation policy applied, and the latest automated
verdict. Legacy identifiers are retained for evidence continuity with the
pre-CR26 assessment history.


## KSI-CED — Cybersecurity Education

### KSI-CED-RAT — Reviewing All Training

> The effectiveness of relevant cybersecurity education and training is persistently reviewed, including at least general training for all employees, role-specific training for employees in high risk roles, training for development and engineering staff on secure software delivery, and training for staff involved with incident response or disaster recovery.

- **Legacy source(s):** KSI-CED-01, KSI-CED-02, KSI-CED-03, KSI-CED-04
- **NIST 800-53 controls:** cp-3, ir-2, ps-6, at-2, at-2.2, at-2.3, at-3.5, at-4, ir-2.3, at-3, sr-11.1
- **Evaluation policy:** mode `capability`, pass threshold 80%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): The effectiveness of relevant cybersecurity education and training is persistently reviewed, including at least gener... | 8/8 resources compliant. | Verified: Training register '[resource]' contains …
- **Measures (validation objectives):**
  - EVIDENCE: Validate the Training Register. The file must contain user commits with the correct decoded flag, proving active engagement. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - CURRICULUM: Validate the existence of the Training Challenge Instructions (The 'Lesson Plan'). [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - EVIDENCE: Validate the Privileged User Training Register. Entries here confirm acknowledgement of high-risk responsibilities and completion of the IAM Deep Dive. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - CURRICULUM: Validate the existence of the Privileged Access Guide containing the link to the mandatory AWS Skill Builder IAM course. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - EVIDENCE: Validate the Developer Training Register. Entries here confirm engineering staff have acknowledged the secure software development policy. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - CURRICULUM: Validate the existence of the Secure Software Development policy. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - EVIDENCE: Validate the IR/DR Training Register. Entries here confirm the IR team has reviewed the active response procedures. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - CURRICULUM: Validate the existence of the Incident Response Plan (The core training material). [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-CED-RAT/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates 'GitOps' Security Training. Instead of passive LMS logs, this validates the 'training/register.json' in the governance repo. This proves staff have actively attested to security training by decoding a challenge token (CTF style) and committing it to the immutable version control history. | Validates 'GitOps' Privileged User Training. Checks the 'training/privileged_register.json' file, which serves as a segregated training record for high-risk roles. Presence of signed commits here pro


## KSI-CMT — Change Management

### KSI-CMT-LMC — Logging Changes

> Modifications to the cloud service offering are logged and monitored.

- **Legacy source(s):** KSI-CMT-01
- **NIST 800-53 controls:** au-2, cm-3, cm-3.2, cm-4.2, cm-6, cm-8.3, ma-2
- **Evaluation policy:** mode `output`, pass threshold 100%, required operational metrics: s3_data_event_coverage_metrics
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Modifications to the cloud service offering are logged and monitored. | 5/5 resources compliant. | Verified: Trail is Secure (Multi-Region, Validated, KMS-Encrypted, Global Events) [organization trail…
- **Measures (validation objectives):**
  - AUDIT: Validate existence of CloudTrail trails (The primary change logger).
  - SCOPE: Validate that the trail is recording 'Management Events' (Read/Write API calls).
  - TRACKING: Validate that AWS Config is actively recording resource changes (Recording: true).
  - GOVERNANCE: Validate the Change Management Policy document. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - Mode 2 — S3DataEventCoverageMetrics counts trails capturing S3 object-level data events (vectors 3, 6). Without data events, mass exfiltration via legitimate credentials leaves no audit trail. Target: at least 1 trail with S3 data events enabled.
- **Evidence artifacts:** 5 files under `evidence_v2/KSI-CMT-LMC/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Change Logging. Checks for: 1) Active CloudTrail (Logs the API calls/modifications), 2) Active AWS Config Recorder (Logs the resource state changes), and 3) The Change Management Policy.

### KSI-CMT-RMV — Redeploying vs Modifying

> Changes to machine-based information resources are executed through the redeployment of version controlled resources rather than direct modification wherever reasonable.

- **Legacy source(s):** KSI-CMT-02
- **NIST 800-53 controls:** cm-2, cm-3, cm-5, cm-6, cm-7, cm-8.1, si-3
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **FAIL** — ❌ Insufficient (91%): Changes to machine-based information resources are executed through the redeployment of version controlled resources ... | 11/12 resources compliant. | Verified: Verified: Governance artifact '[reso…
- **Measures (validation objectives):**
  - VERSION-CONTROLLED CHANGE RECORD: Validate that infrastructure changes flow through version-controlled, immutable redeployment — the SCN Monitor's append-only history records every Terraform change as a tracked, classified commit. (The Terraform state itself is versioned in the mks-states bucket in a SEPARATE AWS account, not readable by the validation role; the version-controlled change path is evidenced here in git.) [Live artifact home: scn_automation/ in this git repository; validated via GitHub contents API.]
  - INVENTORY: List the active EC2 instances managed by this Terraform state.
  - GOVERNANCE: Validate the policy that mandates Terraform usage for all production changes. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
- **Evidence artifacts:** 5 files under `evidence_v2/KSI-CMT-RMV/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the version-controlled infrastructure change path (Terraform state bucket versioning + state locking), instance hardening (IMDSv2), and the documented configuration management policy. Deliberately does NOT claim CI/CD deployment metrics: application deployment is manual pending SSM automation, and the prior CodePipeline metric measured a defunct doc-sync pipeline unrelated to product delivery. Terraform state locking is enforced in the state-hosting AWS account (DynamoDB lock table co-

### KSI-CMT-RVP — Reviewing Change Procedures

> The effectiveness of documented change management procedures is persistently reviewed.

- **Legacy source(s):** KSI-CMT-04
- **NIST 800-53 controls:** cm-3, cm-3.2, cm-3.4, cm-5, cm-7.1, cm-9
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): The effectiveness of documented change management procedures is persistently reviewed. | 1/2 resources compliant, 1 unverified. | Verified: Verified: Governance document '[resource]' is substantive (3…
- **Measures (validation objectives):**
  - GOVERNANCE: Validate the existence of the Change Management Procedure document. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - Terraform state backend versioning (mks-states). Status=Enabled proves every infrastructure change is retained as an immutable, recoverable state revision — the change-tracking control. (list-object-versions is denied cross-account; get-bucket-versioning is the reachable, sufficient evidence.)
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-CMT-RVP/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Adherence to Procedure via State History. Checks for: 1) The Change Management Procedure Document (Governance) and 2) Terraform State File Version History (Technical proof of sequential, tracked changes to infrastructure).

### KSI-CMT-VTD — Validating Throughout Deployment

> Persistent testing and validation of changes throughout deployment is automated.

- **Legacy source(s):** KSI-CMT-03
- **NIST 800-53 controls:** cm-3, cm-3.2, cm-4.2, si-2
- **Evaluation policy:** mode `output`, pass threshold 100%, required operational metrics: change_metrics
- **Latest verdict:** **FAIL** — ❌ Insufficient (100%): Persistent testing and validation of changes throughout deployment is automated. | 7/8 resources compliant, 1 unverified. | Verified: AWS Config recorder '[resource]' configured, recording a scoped…
- **Measures (validation objectives):**
  - MONITOR: Validate that the Configuration Recorder is recording (The engine for persistent validation).
  - VALIDATION: Validate existence of active Config Rules that enforce security policies on live resources.
  - GOVERNANCE: Validate the SDLC Policy which mandates 'Automated Testing' (Checkov) before deployment. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - Phase 4: per-rule compliance status — required by audit #9.
- **Evidence artifacts:** 4 files under `evidence_v2/KSI-CMT-VTD/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the Hybrid Compliance Strategy. Checks for: 1) Active AWS Config Recorder (The Persistent Monitor), 2) Active Config Rules (The Validation Logic), and 3) The Testing Policy (Governance of the CI/CD pipeline).


## KSI-CNA — Cloud Native Architecture

### KSI-CNA-DFP — Defining Functionality and Privileges

> The functionality and privileges for infrastructure and services are strictly defined.

- **Legacy source(s):** KSI-CNA-04
- **NIST 800-53 controls:** cm-2, si-3
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **FAIL** — ❌ Insufficient (98%): The functionality and privileges for infrastructure and services are strictly defined. | 89/91 resources compliant. | Verified: Verified: Governance document '[resource]' is substantive (1070 bytes,…
- **Measures (validation objectives):**
  - IMMUTABILITY: Validate the documented immutable-infrastructure methodology — all production changes via version-controlled Terraform (state in S3 with versioning + DynamoDB state locking, PR-reviewed plan/apply, change tracked in git history). The Terraform state itself lives in the mks-states bucket in a SEPARATE AWS account (cross-account, not readable by the validation role); the immutable-IaC methodology is evidenced as code in governance/. [Policy-as-code home: governance/ in this git repository; validated via GitHub contents API.]
  - FUNCTIONALITY: Check for Security Groups allowing 'All Traffic' (-1). Absence of these proves strictly defined network functionality.
  - PRIVILEGE: Audit Custom IAM Roles. This focuses the scan on roles you created, verifying they follow least-privilege principles.
- **Evidence artifacts:** 3 files under `evidence_v2/KSI-CNA-DFP/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Immutable EC2 Infrastructure & Least Privilege. Checks for: 1) Terraform State (Proof of immutable IaC management), 2) Security Groups (Strict network functionality), and 3) Custom IAM Roles (Strictly defined privileges, excluding default AWS service roles).

### KSI-CNA-EIS — Enforcing Intended State

> Automated services are used to persistently assess the security of all machine-based information resources and automatically enforce their intended operational state.

- **Legacy source(s):** KSI-CNA-08
- **NIST 800-53 controls:** ca-2.1, ca-7.1
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Automated services are used to persistently assess the security of all machine-based information resources and automa... | 4/4 resources compliant. | Verified: Security Hub standard subscribed and REA…
- **Measures (validation objectives):**
  - Validate that Security Hub is active and enforcing specific compliance standards (CIS, PCI, etc).
  - Validate that GuardDuty is enabled (Detector ID exists) for automated threat detection.
  - Validate that AWS Config is actively recording resource changes for persistent assessment.
  - Validate that Amazon Inspector is actively scanning resources (EC2/ECR/Lambda).
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-CNA-EIS/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates that the 'Immune System' of the cloud is active by checking for enabled Security Hub Standards, GuardDuty Detectors, and Config Recorders.

### KSI-CNA-IBP — Implementing Best Practices

> The use and configuration of third-party machine-based information resources is persistently compared against the original provider's best practices and guidance.

- **Legacy source(s):** KSI-CNA-07
- **NIST 800-53 controls:** ac-17.3, cm-2, pl-10
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **FAIL** — ❌ Insufficient (97%): The use and configuration of third-party machine-based information resources is persistently compared against the ori... | 41/42 resources compliant. | Verified: Verified: Active & Compliant; Verifi…
- **Measures (validation objectives):**
  - BASELINE: Measure legacy compute footprint (Denominator) to compare against managed service adoption.
  - ACCELERATOR: Validate adoption of serverless compute (High Impact).
  - ACCELERATOR: Validate use of fully managed databases vs self-hosted DBs.
  - ACCELERATOR: Validate use of managed API hosting infrastructure.
  - ACCELERATOR: Validate use of managed application networking.
  - ACCELERATOR: Validate use of dynamic scaling/statelessness vs static servers.
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-CNA-IBP/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates cloud-native maturity by comparing the ratio of legacy infrastructure (EC2) versus modern managed services (Lambda, RDS, API Gateway, etc).

### KSI-CNA-MAT — Minimizing Attack Surface

> Machine-based information resources are persistently reviewed to ensure they have a minimal attack surface and that lateral movement is minimized if compromised.

- **Legacy source(s):** KSI-CNA-02
- **NIST 800-53 controls:** ac-17.3, ac-18.1, ac-18.3, ac-20.1, ca-9, sc-7.3, sc-7.4, sc-7.5, sc-7.8, sc-8, sc-10, si-10, si-11, si-16
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **FAIL** — ❌ Insufficient (95%): Machine-based information resources are persistently reviewed to ensure they have a minimal attack surface and that l... | 21/23 resources compliant. | Verified: Private Subnet: '[resource]' has pub…
- **Measures (validation objectives):**
  - ATTACK SURFACE: Validate the existence of Private Subnets (where Public IP mapping is disabled).
  - LATERAL MOVEMENT: Validate Security Groups that allow access ONLY from other specific Security Groups (Tiered Security), rather than broad IP ranges.
  - ISOLATION: Validate that RDS Databases are configured as 'PubliclyAccessible: false' and reside in defined subnets.
- **Evidence artifacts:** 3 files under `evidence_v2/KSI-CNA-MAT/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Network Segmentation and Isolation. Checks for: 1) Private Subnets (Attack Surface Reduction), 2) Security Group References (Prevention of Lateral Movement by binding rules to logical groups, not IPs), and 3) Private Database Placement.

### KSI-CNA-OFA — Optimizing for Availability

> Machine-based information resources are persistently reviewed to ensure they are appropriately optimized for high availability and rapid recovery.

- **Legacy source(s):** KSI-CNA-06
- **NIST 800-53 controls:** —
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Machine-based information resources are persistently reviewed to ensure they are appropriately optimized for high ava... | 5/5 resources compliant. | Verified: Load Balancer '[resource]' spans 2 AZs.;…
- **Measures (validation objectives):**
  - NETWORK HA: Validate that Load Balancers are configured across multiple Availability Zones.
  - DATABASE HA: Validate that critical RDS instances have Multi-AZ enabled for automatic failover.
  - RECOVERY: Validate existence of Backup Plans to support rapid data recovery.
- **Evidence artifacts:** 3 files under `evidence_v2/KSI-CNA-OFA/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Multi-AZ High Availability. Checks for: 1) Load Balancers spanning multiple AZs (Network HA), 2) RDS instances with Multi-AZ enabled (Database HA), and 3) Active AWS Backup Plans (Recovery Capability).

### KSI-CNA-RNT — Restricting Network Traffic

> Machine-based information resources are persistently reviewed to ensure they are appropriately configured to limit inbound and outbound network traffic.

- **Legacy source(s):** KSI-CNA-01
- **NIST 800-53 controls:** ac-17.3, ca-9, cm-7.1, sc-7.5, si-8
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Machine-based information resources are persistently reviewed to ensure they are appropriately configured to limit in... | 7/7 resources compliant. | Verified: SG '[resource]' properly limits traffic …
- **Measures (validation objectives):**
  - BASELINE: Validate that the 'default' VPC Security Group restricts all traffic (Best practice is to leave this empty/unused).
  - ACTIVE CONTROLS: Validate a sample of active Security Groups to verify specific port restrictions (Limit Inbound).
  - BOUNDARY: Validate Network ACLs which provide a stateless traffic filter at the subnet level.
- **Evidence artifacts:** 3 files under `evidence_v2/KSI-CNA-RNT/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Network Traffic Limiting. Checks for: 1) The 'default' Security Group (Baseline Hygiene - should be empty), 2) Active Security Groups (Specific Ingress/Egress Rules), and 3) Network ACLs (Subnet Boundary Control).

### KSI-CNA-RVP — Reviewing Protections

> The effectiveness of protection against denial of service attacks and other unwanted activity for machine-based information resources is persistently reviewed.

- **Legacy source(s):** KSI-CNA-05
- **NIST 800-53 controls:** sc-5, si-8, si-8.2
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **FAIL** — ❌ Insufficient (80%): The effectiveness of protection against denial of service attacks and other unwanted activity for machine-based infor... | 4/6 resources compliant, 1 unverified. | Verified: WAF protection active: 1…
- **Measures (validation objectives):**
  - DDOS LAYER 7: Validate existence of Web Application Firewalls (WAF) to block malicious requests.
  - DDOS LAYER 3/4 (Shield): Validate Load Balancers. AWS Shield Standard provides automatic, always-on Layer 3/4 DDoS protection for every ALB/NLB at no cost — load balancers ARE the protected perimeter. (No per-resource subscription exists for Shield Standard; this is the AWS baseline.)
  - DNS RESILIENCE: Validate Route53 usage (AWS AnyCast network provides DNS flood protection).
  - SPOOFING: Validate SES Identities. If email is sent, this checks for authorized identities (DKIM/SPF managed).
  - Mode 2 — APIThrottleCoverageMetrics computes throttle_rate as % of API Gateway stages with non-zero throttle limits configured (vector 5). Without per-stage throttling, a valid token can be used to enumerate /api/v1/* at line rate. Target 100%.
- **Evidence artifacts:** 5 files under `evidence_v2/KSI-CNA-RVP/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates DDoS & Spoofing Defense. Checks for: 1) Regional WAF (Layer 7 Defense), 2) Load Balancers (Layer 3/4 Defense via AWS Shield Standard), and 3) Validated Email Identities (Spoofing protection via SES/DKIM).

### KSI-CNA-ULN — Using Logical Networking

> Logical networking and related capabilities are used and persistently reviewed to enforce traffic flow controls.

- **Legacy source(s):** KSI-CNA-03
- **NIST 800-53 controls:** ac-12, ac-17.3, ca-9, sc-4, sc-7, sc-7.7, sc-8, sc-10
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Logical networking and related capabilities are used and persistently reviewed to enforce traffic flow controls. | 10/12 resources compliant, 2 unverified. | Verified: VPC Endpoint '[resource] (us-eas…
- **Measures (validation objectives):**
  - PRIVATE FLOW: Validate existence of VPC Endpoints, ensuring traffic to services like S3/DynamoDB bypasses the public internet.
  - EGRESS CONTROL: Validate active NAT Gateways. This proves instances in private subnets route outbound traffic centrally, rather than having individual Public IPs.
  - INGRESS CONTROL: Validate Load Balancers. The 'Scheme' (internet-facing vs internal) proves that ingress traffic is logically separated and managed.
- **Evidence artifacts:** 3 files under `evidence_v2/KSI-CNA-ULN/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Logical Traffic Enforcement. Checks for: 1) VPC Endpoints (Enforces private connectivity to AWS services), 2) NAT Gateways (Enforces centralized egress), and 3) Load Balancer Schemes (Enforces defined entry points).


## KSI-IAM — Identity and Access Management

### KSI-IAM-AAM — Automating Account Management

> The lifecycle and privileges of all accounts, roles, and groups are securely managed using automation.

- **Legacy source(s):** KSI-IAM-07
- **NIST 800-53 controls:** ac-2.2, ac-2.3, ac-2.13, ac-6.7, ia-4.4, ia-12, ia-12.2, ia-12.3, ia-12.5
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): The lifecycle and privileges of all accounts, roles, and groups are securely managed using automation. | 1/2 resources compliant, 1 unverified. | Verified: IAM credential report (2 users): root is loc…
- **Measures (validation objectives):**
  - PRIMARY: Retrieve the full Credential Report to analyze password and key rotation ages.
  - AUDIT: Identify potential 'Zombie Roles' that are older than a specific threshold (adjust date as needed).
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-IAM-AAM/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates proper lifecycle management by auditing credential rotation. Instead of listing static roles, it scans the Credential Report for stale passwords (>90 days) and unused access keys.

### KSI-IAM-APM — Adopting Passwordless Methods

> Secure passwordless methods are used for user authentication and authorization when feasible, otherwise strong passwords with phishing-resistant MFA is used.

- **Legacy source(s):** KSI-IAM-01, KSI-IAM-02
- **NIST 800-53 controls:** ac-3, ia-5.1, ia-5.2, ia-5.6, ia-6, ac-2, ia-2, ia-2.1, ia-2.2, ia-2.8, ia-5, ia-8, sc-23
- **Evaluation policy:** mode `output`, pass threshold 100%, required operational metrics: iam_mfa_metrics, sso_session_duration_metrics
- **Latest verdict:** **FAIL** — ❌ Insufficient (45%): Secure passwordless methods are used for user authentication and authorization when feasible, otherwise strong passwo... | 5/11 resources compliant, 6 unverified. | Verified: Modern Identity: AWS Id…
- **Measures (validation objectives):**
  - FILTERED: Retrieve only IAM Users who have active password usage (Humans).
  - Verify that AWS Identity Center is the primary identity platform.
  - Get list of all Virtual MFA devices to validate protection (replaces list-mfa-devices which requires user).
  - Mode 2 (operational effectiveness) — cross-source correlator. Combines list-users (filtered to human users via PasswordLastUsed!=null), list-virtual-mfa-devices, and identitystore list-users (SCIM-provisioned AWS Identity Center users, which carry ExternalIds={Issuer,Id} only when federated from an external IdP such as Okta). IAMMFAMetricsPrimitive computes combined MFA coverage = SCIM-federated Identity Center users (MFA enforced upstream at the IdP) + local IAM console users with a virtual MFA device, over all human identities. SCIM credit is given ONLY for users whose collected data actually carries ExternalIds. KSI-IAM-01 target is 95% (FedRAMP IA-2(1); direct IdP MFA-policy verification pending the Okta API integration).
  - Phase 4: SSO permission sets (IA-2(1)) — required for phishing-resistant MFA verification.
  - Phase 4: enumerate SSO-managed user identities for IA-2 coverage.
  - Mode 2 (operational effectiveness) — SSOSessionDurationMetrics computes within_target_rate as % of permission sets with SessionDuration <= 8h. Long-lived sessions extend the LMS session-theft attack window (vector 1). Target 100%.
  - MODERN: Validate presence of AWS Identity Center (Single Sign-On).
  - LEGACY/FEDERATED: Validate presence of external Identity Providers (Okta, Azure AD).
  - FALLBACK: Validate that if passwords ARE used, the policy enforces complexity and rotation.
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-IAM-APM/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates MFA compliance by filtering for users who actively log in via password (Humans) and verifying Identity Center usage. Excludes API-only service accounts. | Validates the authentication hierarchy: Checks for Identity Center (Best) and SAML Providers (Good) first. If those are absent, it validates the IAM Password Policy (Fallback) to ensure strong controls are in place.

### KSI-IAM-ELP — Ensuring Least Privilege

> Identity and access management measures are used and persistently reviewed to ensure each user or device can only access the resources they need.

- **Legacy source(s):** KSI-IAM-05
- **NIST 800-53 controls:** ac-2.5, ac-2.6, ac-3, ac-4, ac-6, ac-12, ac-14, ac-17, ac-17.1, ac-17.2, ac-17.3, ac-20, ac-20.1, cm-2.7, cm-9, ia-2, ia-3, ia-4, ia-4.4, ia-5.2, ia-5.6, ia-11, ps-2, ps-3, ps-4, ps-5, ps-6, sc-4, sc-20, sc-21, sc-22, sc-23, sc-39, si-3
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Identity and access management measures are used and persistently reviewed to ensure each user or device can only acc... | 2/3 resources compliant, 1 unverified. | Verified: Modern Identity: AWS Ident…
- **Measures (validation objectives):**
  - PRIMARY: Validate Identity Center configuration for WebAuthn/FIDO2 enforcement.
  - AUDIT: Inventory MFA devices to identify non-FIDO compliant virtual tokens.
  - Validate that hard-fail measures are in place if MFA is missing.
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-IAM-ELP/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates that the authentication flow prevents phishing by enforcing FIDO2/WebAuthn at the Identity Provider level (SSO) and ensuring break-glass users utilize hardware tokens.

### KSI-IAM-JIT — Authorizing Just-in-Time

> A least-privileged, role and attribute-based, and just-in-time security authorization model is used and persistently reviewed for all user and non-user accounts and services.

- **Legacy source(s):** KSI-IAM-04
- **NIST 800-53 controls:** ac-2, ac-2.1, ac-2.2, ac-2.3, ac-2.4, ac-2.6, ac-3, ac-4, ac-5, ac-6, ac-6.1, ac-6.2, ac-6.5, ac-6.7, ac-6.9, ac-6.10, ac-7, ac-20.1, ac-17, au-9.4, cm-5, cm-7, cm-7.2, cm-7.5, cm-9, ia-4, ia-4.4, ia-7, ps-2, ps-3, ps-4, ps-5, ps-6, ps-9, ra-5.5, sc-2, sc-23, sc-39
- **Evaluation policy:** mode `output`, pass threshold 100%, required operational metrics: cross_account_trust_metrics
- **Latest verdict:** **PASS** — ✅ Excellent (100%): A least-privileged, role and attribute-based, and just-in-time security authorization model is used and persistently ... | 3/4 resources compliant, 1 unverified. | Verified: Modern Identity: AWS Ident…
- **Measures (validation objectives):**
  - PRIMARY: Validate that AWS Identity Center (SSO) is configured and running.
  - AUDIT: List human users who are bypassing the Centralized System (should be empty or minimal).
  - Mode 1 capability + audit inventory — CrossAccountTrustMetrics counts roles whose trust policy admits external (non-account-owner) principals. Surfaces OIDC providers, SAML federations, foreign accounts, and contractor cross-account trusts (vectors 3, 10). Auditor reviews surfaced list against contractor inventory.
- **Evidence artifacts:** 3 files under `evidence_v2/KSI-IAM-JIT/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the presence of the Centralized Identity Provider (Identity Center) and audits the 'Debt' of decentralized local IAM users.

### KSI-IAM-SNU — Securing Non-User Authentication

> Appropriately secure authentication methods are used and persistently reviewed for non-user accounts and services.

- **Legacy source(s):** KSI-IAM-03
- **NIST 800-53 controls:** ac-2, ac-2.2, ac-4, ac-6.5, ia-3, ia-5.2, ra-5.5
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **FAIL** — ❌ Insufficient (98%): Appropriately secure authentication methods are used and persistently reviewed for non-user accounts and services. | 87/89 resources compliant, 1 unverified. | Verified: RBAC Active: 1 role(s); all …
- **Measures (validation objectives):**
  - Validate Trust Policies for CUSTOMER managed roles only.
  - Validate Service Accounts (Bots) that do not have console access (should rely on keys/roles).
  - Deep inspection of access key rotation status for service accounts.
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-IAM-SNU/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the security of machine identities. Filters out AWS-managed roles to focus strictly on Customer Roles (Trust Policies) and Service Accounts (Access Keys).

### KSI-IAM-SUS — Responding to Suspicious Activity

> Accounts with privileged access are disabled or otherwise secured in response to suspicious activity.

- **Legacy source(s):** KSI-IAM-06
- **NIST 800-53 controls:** ac-2, ac-2.1, ac-2.3, ac-2.13, ac-7, ps-4, ps-8
- **Evaluation policy:** mode `output`, pass threshold 100%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Accounts with privileged access are disabled or otherwise secured in response to suspicious activity. | 2/3 resources compliant, 1 unverified. | Verified: Patch management: 1 custom patch baseline(s) …
- **Measures (validation objectives):**
  - SENSOR: Validate that the Threat Detection sensor is active.
  - RESPONSE RULE: an enabled EventBridge rule routes privileged-access and threat signals to automated remediation (no service-name keywords here so dispatch lands on the EventBridge evaluator).
  - Validate the access-control/review policy document defining how privileged accounts are secured/disabled.
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-IAM-SUS/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the 'Automated Response' chain: Checks if GuardDuty is watching (Detectors) AND if EventBridge has rules listening to GuardDuty to trigger automated remediation.


## KSI-INR — Incident Response

### KSI-INR-AAR — Generating After Action Reports

> Incident after action reports are generated and lessons learned are persistently incorporated.

- **Legacy source(s):** KSI-INR-03
- **NIST 800-53 controls:** ir-3, ir-4, ir-4.1, ir-8
- **Evaluation policy:** mode `capability`, pass threshold 80%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Incident after action reports are generated and lessons learned are persistently incorporated. | 1/1 resources compliant. | Verified: After-action-report repository present (1): security-post-mortems …
- **Measures (validation objectives):**
  - Validate existence of the designated Post-Mortem/AAR repository. [CodeCommit intentionally retained here: IR/post-mortem records are private and must not migrate to the public governance/ tree. Follow-up: move to private S3 storage with list-objects-v2 recency evidence.]
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-INR-AAR/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the existence of a 'Lessons Learned' repository. Checks for CodeCommit repositories specifically designated for Post-Incident Analysis (Post-Mortems) or After Action Reports (AAR).

### KSI-INR-RIR — Reviewing Incident Response Procedures

> The effectiveness of documented incident response procedures is persistently reviewed.

- **Legacy source(s):** KSI-INR-01
- **NIST 800-53 controls:** ir-4, ir-4.1, ir-6, ir-6.1, ir-6.3, ir-7, ir-7.1, ir-8, ir-8.1, si-4.5
- **Evaluation policy:** mode `capability`, pass threshold 80%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): The effectiveness of documented incident response procedures is persistently reviewed. | 2/2 resources compliant. | Verified: Verified: Governance document '[resource]' is substantive (5730 bytes, 9 s…
- **Measures (validation objectives):**
  - Validate the documented incident-response procedure exists and is substantive (content, not repo existence).
  - Validate that a periodic IR effectiveness review artifact exists — evidences the "persistent review" outcome.
- **Evidence artifacts:** 1 files under `evidence_v2/KSI-INR-RIR/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the existence of Incident Response documentation. Specifically checks for the existence of a 'Governance as Code' repository containing procedures and playbooks.

### KSI-INR-RPI — Reviewing Past Incidents

> Past incidents are persistently reviewed for patterns or vulnerabilities that were not previously apparent or identified.

- **Legacy source(s):** KSI-INR-02
- **NIST 800-53 controls:** ir-3, ir-4, ir-4.1, ir-5, ir-8
- **Evaluation policy:** mode `capability`, pass threshold 80%
- **Latest verdict:** **PASS** — ✅ Excellent (90%): Past incidents are persistently reviewed for patterns or vulnerabilities that were not previously apparent or identif... | 10/14 resources compliant, 3 unverified. | Verified: Log group '[resource]': r…
- **Measures (validation objectives):**
  - Validate existence of centralized CloudWatch Log Groups for security events.
  - Validate existence of immutable S3 storage for long-term incident retention.
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-INR-RPI/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the existence of centralized incident logging infrastructure. Checks for specific CloudWatch Log Groups and S3 Buckets designated for security/audit data.


## KSI-MLA — Monitoring, Logging, and Auditing

### KSI-MLA-ALA — Authorizing Log Access

> A least-privileged, role and attribute-based, and just-in-time access authorization model is used and persistently reviewed for access to log data based on organizationally defined data sensitivity.

- **Legacy source(s):** KSI-MLA-08
- **NIST 800-53 controls:** si-11
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): A least-privileged, role and attribute-based, and just-in-time access authorization model is used and persistently re... | 12/12 resources compliant. | Verified: Audit/compliance bucket present: '[res…
- **Measures (validation objectives):**
  - VAULT: Validate existence of compliance/security buckets.
  - LOCK: Validate existence of encryption keys.
  - PERMIT: Validate existence of access control policies.
  - PERMIT: Read the audit/read-only policy document and verify least-privilege (no full-admin wildcard, no unscoped write) for log-data access.
- **Evidence artifacts:** 1 files under `evidence_v2/KSI-MLA-ALA/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the Log Governance Model. Checks for: 1) The Audit Vault (S3), 2) The Encryption Key (KMS), and 3) The Access Policies (IAM) specifically designed for logging.

### KSI-MLA-EVC — Evaluating Configurations

> The configuration of machine-based information resources, especially infrastructure as code, is persistently evaluated and tested.

- **Legacy source(s):** KSI-MLA-05
- **NIST 800-53 controls:** ca-7, cm-2, cm-6, si-7.7
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): The configuration of machine-based information resources, especially infrastructure as code, is persistently evaluate... | 2/2 resources compliant. | Verified: Checkov IaC scan ran on 142 resource(s):…
- **Measures (validation objectives):**
  - EVALUATION/TESTING: Validate the live Checkov IaC scan summary — Checkov (policy-as-code static analysis) scans the Terraform in meridian-aws-resources every run and records resources scanned + checks passed/failed. This is direct proof that infrastructure-as-code configuration is persistently evaluated and tested. Regenerated each run by the IaC Checkov Scan workflow. [Live artifact home: dashboard-data/ in this git repository; validated via GitHub contents API.]
  - PROCESS: Validate the SDLC policy mandating IaC review and automated security testing (SAST/DAST/CI-CD gates), the documented basis for persistently evaluating and testing infrastructure configuration. [Policy-as-code home: governance/ in this git repository; validated via GitHub contents API.]
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-MLA-EVC/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates that infrastructure-as-code is persistently evaluated and tested via the live Checkov policy-as-code scan (scans the Terraform in meridian-aws-resources every run, recording resources scanned and checks passed/failed) plus the SDLC policy documenting the IaC review/testing process. The Terraform state/plan artifacts live in the cross-account mks-states bucket; the evaluation/testing is evidenced git-natively.

### KSI-MLA-LET — Logging Event Types

> A list of information resources and event types that will be logged, monitored, and audited is maintained and persistently reviewed to ensure these activities occur.

- **Legacy source(s):** KSI-MLA-07
- **NIST 800-53 controls:** ac-2.4, ac-6.9, ac-17.1, ac-20.1, au-2, au-7.1, au-12, si-4.4, si-4.5, si-7.7
- **Evaluation policy:** mode `output`, pass threshold 100%, required operational metrics: rds_audit_log_metrics
- **Latest verdict:** **PASS** — ✅ Excellent (100%): A list of information resources and event types that will be logged, monitored, and audited is maintained and persist... | 12/12 resources compliant. | Verified: AWS Config recorder '[resource]' confi…
- **Measures (validation objectives):**
  - INVENTORY: Validate that AWS Config is recording the 'List of Information Resources'.
  - EVENTS: Validate that CloudTrail is defining the 'Event Types' to be logged.
  - EXECUTION: Validate that the specific Security/Audit logs are actually being captured.
  - Mode 2 — RDSAuditLogCoverageMetrics computes audit_log_rate as % of RDS instances exporting audit-relevant log types to CloudWatch (vector 9). Engine-aware: checks audit/general/slowquery for MySQL/MariaDB; postgresql/audit for Postgres; etc. Target 100%.
- **Evidence artifacts:** 4 files under `evidence_v2/KSI-MLA-LET/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the Resource Inventory and Logging Strategy. Checks AWS Config (The Resource List) and CloudTrail/Security Log Groups (The Audit Execution).

### KSI-MLA-OSM — Operating SIEM Capability

> A Security Information and Event Management (SIEM) or similar system(s) is used and persistently reviewed for centralized, tamper-resistant logging of events, activities, and changes.

- **Legacy source(s):** KSI-MLA-01
- **NIST 800-53 controls:** ac-17.1, ac-20.1, au-2, au-3, au-3.1, au-4, au-5, au-6.1, au-6.3, au-7, au-7.1, au-8, au-9, au-11, ir-4.1, si-4.2, si-4.4, si-7.7
- **Evaluation policy:** mode `output`, pass threshold 100%, required operational metrics: trail_logging_metrics, s3_logging_coverage_metrics, alb_access_log_metrics
- **Latest verdict:** **FAIL** — ❌ Insufficient (100%): A Security Information and Event Management (SIEM) or similar system(s) is used and persistently reviewed for central... | 3/5 resources compliant, 2 unverified. | Verified: Trail is Secure (Multi-…
- **Measures (validation objectives):**
  - PRIMARY: Validate existence and configuration of the CloudTrail trail.
  - STATUS: Confirm CloudTrail is actually 'IsLogging': true. Uses TrailARN to avoid naming conflicts. Mode 2 (operational effectiveness) — TrailLoggingMetricsPrimitive computes logging_rate as % of trails with IsLogging=true; KSI-MLA-01 target is 100%.
  - STORAGE: Validate the specific S3 bucket used for audit log retention.
  - Mode 2 — S3LoggingCoverageMetrics computes logging_rate as % of S3 buckets with server access logging enabled (vector 6). Target 100%. KSI-MLA-01's outcome (log all activity) requires every bucket to log; gaps are blind spots for object-read attacks.
  - Mode 2 — ALBAccessLogCoverageMetrics computes logging_rate as % of ALBs exporting access_logs.s3 to S3 (vectors 5, 6). Without ALB access logs, request-level visibility into the LMS edge depends solely on application logs (which an attacker may suppress). Target 100%.
- **Evidence artifacts:** 5 files under `evidence_v2/KSI-MLA-OSM/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the master audit record. Checks for the existence of an active CloudTrail and the security (ACLs/Encryption) of the specific S3 bucket storing those logs.

### KSI-MLA-RVL — Reviewing Logs

> Logs are persistently reviewed and audited.

- **Legacy source(s):** KSI-MLA-02
- **NIST 800-53 controls:** ac-2.4, ac-6.9, au-2, au-6, au-6.1, si-4, si-4.4
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Logs are persistently reviewed and audited. | 1/2 resources compliant, 1 unverified. | Verified: Security Hub Insight(s) configured (1): aggregated, grouped finding analysis for automated security tre…
- **Measures (validation objectives):**
  - PRIMARY: Validate existence of automated log scanning patterns (e.g., 'RootLogin', 'Unauthorized').
  - SECONDARY: Validate usage of Security Hub for aggregated security trend analysis.
  - ALERTING: Validate alarms specifically tied to log metric filters.
- **Evidence artifacts:** 3 files under `evidence_v2/KSI-MLA-RVL/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates 'Automated Review'. Instead of expecting human review, checks for CloudWatch Metric Filters (automated pattern matching) and Security Hub Insights (aggregated analysis).


## KSI-PIY — Policy and Inventory

### KSI-PIY-GIV — Generating Inventories

> Authoritative sources are used to automatically generate real-time inventories of all information resources when needed.

- **Legacy source(s):** KSI-PIY-01
- **NIST 800-53 controls:** cm-2.2, cm-7.5, cm-8, cm-8.1, cm-12, cm-12.1, cp-2.8
- **Evaluation policy:** mode `output`, pass threshold 80%, required operational metrics: inventory_metrics
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Authoritative sources are used to automatically generate real-time inventories of all information resources when needed. | 204/204 resources compliant. | Verified: AWS Config recorder '[resource]' con…
- **Measures (validation objectives):**
  - PRIMARY: Validate that the Configuration Recorder is active (The 'Authoritative Source').
  - STORAGE: Validate that the inventory data is being delivered to a central S3 bucket.
  - os-LEVEL: Sample check for SSM Inventory data (software list) on a live instance.
  - Mode 2 (operational effectiveness) — feeds InventoryMetricsPrimitive. Aggregates resourceCounts across all tracked resource types. Direct evidence that the real-time inventory engine is producing population-level data, not just point capability.
- **Evidence artifacts:** 3 files under `evidence_v2/KSI-PIY-GIV/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the active 'Inventory Engine'. Checks for the AWS Config Recorder (which automatically tracks resource changes) and the Delivery Channel (where the inventory is stored).

### KSI-PIY-RES — Reviewing Executive Support

> Executive support for achieving the provider's security goals is persistently reviewed and demonstrated.

- **Legacy source(s):** KSI-PIY-08
- **NIST 800-53 controls:** —
- **Evaluation policy:** mode `capability`, pass threshold 80%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Executive support for achieving the provider's security goals is persistently reviewed and demonstrated. | 2/3 resources compliant, 1 unverified. | Verified: Threat detection active: 1 GuardDuty detec…
- **Measures (validation objectives):**
  - INVESTMENT: Validate that GuardDuty is enabled (Paid Threat Detection Service).
  - INVESTMENT: Validate that Security Hub is enabled (Paid Compliance Aggregation Service).
  - CONTROL: Validate that a Budget exists to track this security spending.
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-PIY-RES/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Executive Buy-in via 'Security Investment'. Checks for active, paid enterprise security tools (GuardDuty, Security Hub) that demonstrate financial commitment to the security program.

### KSI-PIY-RIS — Reviewing Investments in Security

> The effectiveness of the provider's investments in achieving security goals is persistently reviewed.

- **Legacy source(s):** KSI-PIY-06
- **NIST 800-53 controls:** ac-5, ca-2, cp-2.1, cp-4.1, ir-3.2, pm-3, sa-2, sa-3, sr-2.1
- **Evaluation policy:** mode `capability`, pass threshold 80%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): The effectiveness of the provider's investments in achieving security goals is persistently reviewed. | 2/2 resources compliant. | Verified: Verified: Governance document '[resource]' is substantive (…
- **Measures (validation objectives):**
  - GOVERNANCE: Validate the existence of the specific Security Monitoring Plan document. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - INVESTMENT: Validate that Security Hub Standards (CIS, PCI, FedRAMP) are enabled (The automated mechanism for monitoring effectiveness).
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-PIY-RIS/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the Security Effectiveness Program. Checks for the specific 'Security Monitoring and Alerting Plan' (Governance) and active Security Hub Standards (Technical Evidence of Investment).

### KSI-PIY-RSD — Reviewing Security in the SDLC

> The effectiveness of building security and privacy considerations into the Software Development Lifecycle and aligning with CISA Secure By Design principles is persistently reviewed.

- **Legacy source(s):** KSI-PIY-04
- **NIST 800-53 controls:** ac-5, au-3.3, cm-3.4, pl-8, pm-7, sa-3, sa-8, sc-4, sc-18, si-10, si-11, si-16
- **Evaluation policy:** mode `capability`, pass threshold 80%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): The effectiveness of building security and privacy considerations into the Software Development Lifecycle and alignin... | 1/2 resources compliant, 1 unverified. | Verified: Verified: Governance docum…
- **Measures (validation objectives):**
  - GOVERNANCE: Validate existence of the specific Secure SDLC policy document. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - SDLC security scanning executes in GitHub Actions (enterprise_scanner workflow). Success rate computed from workflow runs (replaces CodeBuild project listing — projects existed but GitHub Actions is the operated SDLC toolchain).
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-PIY-RSD/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the Secure SDLC. Checks for the specific 'Secure Software Development' policy in CodeCommit and identifies automated security/testing build projects (filtering out standard app builds).

### KSI-PIY-RVD — Reviewing Vulnerability Disclosures

> The effectiveness of the provider's vulnerability disclosure program is persistently reviewed.

- **Legacy source(s):** KSI-PIY-03
- **NIST 800-53 controls:** ra-5.11
- **Evaluation policy:** mode `capability`, pass threshold 80%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): The effectiveness of the provider's vulnerability disclosure program is persistently reviewed. | 1/1 resources compliant. | Verified: Verified: Governance document '[resource]' contains 46 structured …
- **Measures (validation objectives):**
  - Governance document inventory: governance/manifest.json (machine-readable; path, size, sha256 per document; regenerated by the migration workflow). Replaces CodeCommit get-folder listing. Policy library (21 documents at migration) inventoried in manifest.
- **Evidence artifacts:** 1 files under `evidence_v2/KSI-PIY-RVD/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the existence of the Vulnerability Disclosure Policy (VDP). Checks the governance repository for files matching standard naming conventions (vdp.md, security.txt, disclosure.md).


## KSI-RPL — Recovery Planning

### KSI-RPL-ABO — Aligning Backups with Objectives

> The alignment of machine-based information resource backups with defined recovery objectives is persistently reviewed.

- **Legacy source(s):** KSI-RPL-03
- **NIST 800-53 controls:** cm-2.3, cp-6, cp-9, cp-10, cp-10.2, si-12
- **Evaluation policy:** mode `output`, pass threshold 100%, required operational metrics: backup_metrics
- **Latest verdict:** **PASS** — ✅ Excellent (100%): The alignment of machine-based information resource backups with defined recovery objectives is persistently reviewed. | 3/3 resources compliant. | Verified: Restore success rate 100% (3 restore jobs)…
- **Measures (validation objectives):**
  - TECHNICAL: Validate that Restore Jobs have been successfully executed (Proof of Testing).
  - Governance document inventory: governance/manifest.json (machine-readable; path, size, sha256 per document; regenerated by the migration workflow). Replaces CodeCommit get-folder listing. DR test report artifacts inventoried in manifest; restore success rate is the primary Mode 2 evidence.
  - Phase 4: completed restore jobs prove recovery capability has been tested (CP-10).
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-RPL-ABO/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates DR Testing. Checks for technical evidence of 'Restore Jobs' (Active Testing) and the formal 'DR Test Report' (Governance Evidence).

### KSI-RPL-ARP — Aligning Recovery Plan

> The alignment of recovery plans with defined recovery objectives is persistently reviewed.

- **Legacy source(s):** KSI-RPL-02
- **NIST 800-53 controls:** cp-2, cp-2.1, cp-2.3, cp-4.1, cp-6, cp-6.1, cp-6.3, cp-7, cp-7.1, cp-7.2, cp-7.3, cp-8, cp-8.1, cp-8.2, cp-10, cp-10.2
- **Evaluation policy:** mode `output`, pass threshold 100%, required operational metrics: backup_metrics
- **Latest verdict:** **PASS** — ✅ Excellent (100%): The alignment of recovery plans with defined recovery objectives is persistently reviewed. | 2/2 resources compliant. | Verified: Verified: Governance document '[resource]' is substantive (1610 bytes,…
- **Measures (validation objectives):**
  - GOVERNANCE: Validate existence of the defined Recovery Plan. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - EXECUTION: Validate that backup jobs are successfully completing (Proof of Maintenance).
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-RPL-ARP/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the active execution of the Recovery Plan. Checks for the Governance Document (The Plan) and successful AWS Backup Jobs (The Maintenance/Execution).

### KSI-RPL-RRO — Reviewing Recovery Objectives

> The desired Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) are defined and persistently reviewed for alignment with the provider's business needs and capabilities.

- **Legacy source(s):** KSI-RPL-01
- **NIST 800-53 controls:** cp-2.3, cp-10
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): The desired Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) are defined and persistently reviewed ... | 5/5 resources compliant. | Verified: Verified: Governance document '[resource…
- **Measures (validation objectives):**
  - Governance document inventory: governance/manifest.json (machine-readable; path, size, sha256 per document; regenerated by the migration workflow). Replaces CodeCommit get-folder listing. Recovery policy/test artifacts inventoried in manifest; DR plan fetched directly by KSI-RPL-02.
  - TECHNICAL: Validate existence of AWS Backup Plans (proof that RPO is being enforced via automated schedules).
  - Phase 4: per-plan rule inspection (Schedule, Lifecycle.DeleteAfterDays — CP-9).
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-RPL-RRO/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the Disaster Recovery Strategy. Checks for the 'Disaster Recovery Plan' (Governance) where RTO/RPO are defined, and active AWS Backup Plans (Technical) which enforce the RPO.

### KSI-RPL-TRC — Testing Recovery Capabilities

> The capability to recover from incidents and contingencies aligned with defined recovery objectives is persistently tested.

- **Legacy source(s):** KSI-RPL-04
- **NIST 800-53 controls:** cp-2.1, cp-2.3, cp-4, cp-4.1, cp-6, cp-6.1, cp-9.1, cp-10, ir-3, ir-3.2
- **Evaluation policy:** mode `output`, pass threshold 100%, required operational metrics: backup_metrics
- **Latest verdict:** **PASS** — ✅ Excellent (100%): The capability to recover from incidents and contingencies aligned with defined recovery objectives is persistently t... | 3/3 resources compliant. | Verified: Verified: Governance artifact '[resource…
- **Measures (validation objectives):**
  - Governance document inventory: governance/manifest.json (machine-readable; path, size, sha256 per document; regenerated by the migration workflow). Replaces CodeCommit get-folder listing. IR/DR exercise artifacts inventoried in manifest; cross-region restore jobs are the primary Mode 2 evidence.
  - TECHNICAL: Validate that Restore Jobs have been executed (Proof of recovery capability).
  - Phase 4: completed restore jobs prove recovery testing (CP-10).
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-RPL-TRC/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Contingency/Incident Recovery Testing. Checks for the specific 'Incident Response Test Report' (Governance) and evidence of 'Restore Jobs' (Technical capability to recover).


## KSI-SCR — Supply Chain Risk

### KSI-SCR-MIT — Mitigating Supply Chain Risk

> Persistently identify, review, and mitigate potential supply chain risks.

- **Legacy source(s):** KSI-TPR-03
- **NIST 800-53 controls:** ac-20, ra-3.1, sa-9, sa-10, sa-11, sa-15.3, sa-22, si-7.1, sr-5, sr-6, ca-7.4, sc-18
- **Evaluation policy:** mode `capability`, pass threshold 80%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Persistently identify, review, and mitigate potential supply chain risks. | 3/3 resources compliant. | Verified: Verified: Governance document '[resource]' is substantive (3847 bytes, 10 sections).; V…
- **Measures (validation objectives):**
  - Retrieve the supply chain risk management policy from CodeCommit to verify its existence and size. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - Supply-chain dependency review policy-as-code: Dependabot configuration (automated dependency monitoring on the operated GitHub platform; replaces CodeCommit approval-rule template — change approval is enforced via GitHub pull request review).
  - Machine-readable supply-chain review activity register: dependabot merged/open counts, security PRs, CI success rate (metrics/github/summary.json).
- **Evidence artifacts:** `evidence_v2/KSI-SCR-MIT/cli_output.json`, `evidence_index.json`
- **Measure-to-statement rationale:** Validates the supply chain risk management policy's existence, its maintenance history, and the existence of a formal approval workflow.

### KSI-SCR-MON — Monitoring Supply Chain Risk

> Third party software information resources are automatically monitored for upstream vulnerabilities using mechanisms that may include contractual notification requirements or active monitoring services.

- **Legacy source(s):** KSI-TPR-04
- **NIST 800-53 controls:** ac-20, ca-3, ir-6.3, ps-7, ra-5, sa-9, si-5, sr-5, sr-6, sr-8
- **Evaluation policy:** mode `output`, pass threshold 80%, required operational metrics: vulnerability_metrics
- **Latest verdict:** **FAIL** — ❌ Insufficient (91%): Third party software information resources are automatically monitored for upstream vulnerabilities using mechanisms ... | 11/15 resources compliant, 3 unverified. | Verified: Inspector actively sca…
- **Measures (validation objectives):**
  - Check Inspector configuration for vulnerability scanning
  - Validate OS vulnerability findings from Inspector
  - Check application vulnerability findings from Inspector
  - Validate active vulnerability findings requiring remediation
  - Check Inspector coverage for EC2 instances
  - Validate SSM agent deployment for vulnerability management
- **Evidence artifacts:** `evidence_v2/KSI-SCR-MON/cli_output.json`, `evidence_index.json`
- **Measure-to-statement rationale:** Validates comprehensive vulnerability scanning from basic Inspector to enterprise-grade continuous scanning and automated remediation


## KSI-SVC — Service Configuration

### KSI-SVC-ACM — Automating Configuration Management

> The configuration of machine-based information resources is managed using automation and persistently reviewed for drift.

- **Legacy source(s):** KSI-SVC-04
- **NIST 800-53 controls:** ac-2.4, cm-2, cm-2.2, cm-2.3, cm-6, cm-7.1, pl-9, pl-10, sa-5, si-5, sr-10
- **Evaluation policy:** mode `capability`, pass threshold 80%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): The configuration of machine-based information resources is managed using automation and persistently reviewed for dr... | 2/2 resources compliant. | Verified: Checkov IaC scan ran on 142 resource(s):…
- **Measures (validation objectives):**
  - IAC AUTOMATION: Validate the live policy-as-code (Checkov) scan summary — proof that infrastructure is Terraform-managed and continuously scanned for configuration drift. [The Terraform state backend lives in the cross-account mks-states S3 bucket, not visible to list-buckets in the validation account; the proof of automation is the IaC + its policy gate, validated git-natively via the GitHub contents API.]
  - GOVERNANCE: Validate the Configuration Management Policy document. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
- **Evidence artifacts:** 4 files under `evidence_v2/KSI-SVC-ACM/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Automated Configuration via Terraform. Checks for the Terraform State Bucket (The Configuration Source), the State Lock Table (Concurrency Control), and the Governance Policy.

### KSI-SVC-ASM — Automating Secret Management

> Management, protection, and regular rotation of digital keys, certificates, and other secrets is automated and persistently reviewed.

- **Legacy source(s):** KSI-SVC-06
- **NIST 800-53 controls:** ac-17.2, ia-5.2, ia-5.6, sc-12, sc-17
- **Evaluation policy:** mode `output`, pass threshold 100%, required operational metrics: kms_rotation_metrics, cert_expiry_metrics, secret_rotation_metrics
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Management, protection, and regular rotation of digital keys, certificates, and other secrets is automated and persis... | 6/22 resources compliant, 10 unverified. | Verified: Secret '[resource]' has …
- **Measures (validation objectives):**
  - KEYS: Validate existence of KMS Customer Managed Keys (CMKs) for centralized management.
  - ROTATION: Validate Secrets Manager entries (Look for 'RotationEnabled': true in the output).
  - CERTIFICATES: Validate active ACM Certificates (Proof of managed renewal).
  - Phase 4: per-secret rotation metadata (RotationEnabled, NextRotationDate).
  - Phase 4: KMS key rotation status — KeyRotationEnabled must be true for CMKs. Mode 2 (operational effectiveness) — KMSRotationMetricsPrimitive computes rotation_rate as % of CMKs with KeyRotationEnabled=true; KSI-SVC-06 target is 100% (FedRAMP SC-12 expectation).
  - Mode 2 — CertExpiryCoverageMetrics computes healthy_rate as % of ACM certs >30d from expiry (vectors 1, 8). Expired cert FAILs immediately; certs <30d trigger WARNING. Target 100%.
  - Mode 2 — SecretRotationMetrics computes rotation_rate as % of Secrets Manager secrets with RotationEnabled=true (vector 7 / supply-chain hygiene). Target 100% on secrets feeding production CI/CD and DB credentials.
- **Evidence artifacts:** 5 files under `evidence_v2/KSI-SVC-ASM/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Automated Secret Lifecycle. Checks for: 1) KMS Keys (Encryption Foundation), 2) Secrets Manager (Automated Rotation of credentials), and 3) ACM Certificates (Automated Renewal of TLS identities).

### KSI-SVC-EIS — Evaluating and Improving Security

> Information resources are persistently evaluated for opportunities to improve security and those improvements are persistently made.

- **Legacy source(s):** KSI-SVC-01
- **NIST 800-53 controls:** cm-7.1, cm-12.1, ma-2, pl-8, sc-7, sc-39, si-2.2, si-4, sr-10
- **Evaluation policy:** mode `capability`, pass threshold 80%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Information resources are persistently evaluated for opportunities to improve security and those improvements are per... | 3/3 resources compliant. | Verified: Inspector actively scanning 35/63 resour…
- **Measures (validation objectives):**
  - EVALUATION: Validate that Inspector is actively scanning resources (The 'Persistent Evaluation').
  - IMPROVEMENT: Validate existence of custom Patch Baselines (The mechanism for 'Implementing Improvements').
  - GOVERNANCE: Validate the policy defining the evaluation and improvement cycle. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
- **Evidence artifacts:** 3 files under `evidence_v2/KSI-SVC-EIS/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates the Continuous Improvement Loop. Checks for 'Evaluators' (Inspector/GuardDuty) and 'Improvers' (SSM Patch Manager) alongside the governance policy.

### KSI-SVC-PRR — Preventing Residual Risk

> Plans, procedures, and the state of information resources are persistently reviewed after making changes to limit and remove unwanted residual elements that would likely negatively affect the confidentiality, integrity, or availability of federal customer data.

- **Legacy source(s):** KSI-SVC-08
- **NIST 800-53 controls:** sc-4
- **Evaluation policy:** mode `capability`, pass threshold 80%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Plans, procedures, and the state of information resources are persistently reviewed after making changes to limit and... | 3/3 resources compliant. | Verified: Data lifecycle: 1 S3 lifecycle rule(s) f…
- **Measures (validation objectives):**
  - AUTOMATION: Validate S3 lifecycle rules on the compliance data bucket that automatically expire/remove residual objects.
  - RESIDUAL: Validate that manual RDS snapshots (residual database artifacts) are bounded/managed, not accumulating.
  - GOVERNANCE: Validate the Data Sanitization Policy which defines the procedure for destroying customer data. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
- **Evidence artifacts:** 3 files under `evidence_v2/KSI-SVC-PRR/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Data Sanitization and Destruction Capabilities. Checks for S3 Lifecycle Policies (Automated removal of residual data), KMS Keys (Capability for crypto-shredding backups), and the Data Sanitization Policy.

### KSI-SVC-RUD — Removing Unwanted Data

> Unwanted federal customer data is removed promptly when requested by an agency in alignment with customer agreements, including from backups if appropriate; this typically applies when a customer spills information or when a customer seeks to remove information from a service due to a change in usage.

- **Legacy source(s):** KSI-SVC-10
- **NIST 800-53 controls:** si-12.3, si-18.4
- **Evaluation policy:** mode `capability`, pass threshold 80%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Unwanted federal customer data is removed promptly when requested by an agency in alignment with customer agreements,... | 4/4 resources compliant. | Verified: Verified: Governance document '[resource…
- **Measures (validation objectives):**
  - GOVERNANCE: Validate the Data Sanitization Policy (defines the 'Promptly' SLA and procedure). [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - RETENTION: Validate Backup Plans to ensure automated expiration rules are in place (Data doesn't live forever).
  - DESTRUCTION: Validate KMS Keys (The mechanism for 'Crypto-Shredding' data from immutable backups).
- **Evidence artifacts:** 3 files under `evidence_v2/KSI-SVC-RUD/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Data Removal Capabilities. Checks for: 1) The Sanitization Policy (SLA for removal), 2) Backup Plans (Automated Retention/Expiration), and 3) KMS Keys (Immediate Destruction via Crypto-Shredding).

### KSI-SVC-SIN — Securing Information

> Information is encrypted or otherwise secured from unwanted access or modification.

- **Legacy source(s):** KSI-SVC-02
- **NIST 800-53 controls:** ac-1, ac-17.2, cp-9.8, sc-8, sc-8.1, sc-13, sc-20, sc-21, sc-22, sc-23, sc-28, sc-28.1
- **Evaluation policy:** mode `output`, pass threshold 100%, required operational metrics: tls_listener_metrics
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Information is encrypted or otherwise secured from unwanted access or modification. | 3/6 resources compliant, 3 unverified. | Verified: ACM certificate for '*.[internal-domain]' (ISSUED).; Verified: …
- **Measures (validation objectives):**
  - KEYS: Validate existence of active, issued TLS certificates.
  - GATEKEEPERS: List Load Balancers handling traffic.
  - EDGE: Validate CloudFront distributions (CDN) are configured with certificates.
  - GOVERNANCE: Validate the Encryption Policy document. [Policy-as-code home: governance/ in this git repository — machine-readable markdown, change requires a commit; validated via GitHub contents API.]
  - Phase 4: full listener enumeration (was truncated to LoadBalancers[0]) — TLS policy whitelist enforcement. Mode 2 (operational effectiveness) — TLSListenerMetricsPrimitive computes tls_rate as % of listeners using HTTPS/TLS protocol vs HTTP/TCP plaintext; KSI-SVC-02 target is 100% (no plaintext listeners on production load balancers).
- **Evidence artifacts:** 2 files under `evidence_v2/KSI-SVC-SIN/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Encryption in Transit. Checks for the Encryption Policy (Governance), ACM Certificates (The Keys), and Load Balancer/CloudFront configurations (The Enforcers).

### KSI-SVC-VCM — Validating Communications

> The authenticity and integrity of communications between machine-based information resources is persistently validated using automation.

- **Legacy source(s):** KSI-SVC-09
- **NIST 800-53 controls:** sc-23, si-7.1
- **Evaluation policy:** mode `capability`, pass threshold 100%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): The authenticity and integrity of communications between machine-based information resources is persistently validate... | 5/7 resources compliant, 2 unverified. | Verified: Listener 'arn:aws:[redacte…
- **Measures (validation objectives):**
  - ENFORCERS: Identify active Load Balancers handling traffic.
  - VALIDATION: Verify that listeners are enforcing HTTPS/TLS with specific SSL Policies (authenticity/integrity checks).
  - IDENTITY: Validate existence of issued ACM certificates used to prove authenticity.
  - Phase 4: listener TLS policy validation (legacy 2016-08 / TLS-1-0/1-1 must be rejected).
- **Evidence artifacts:** 3 files under `evidence_v2/KSI-SVC-VCM/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Communication Integrity. Checks for Active TLS Listeners (Enforcement of Encryption) and ACM Certificates (Validation of Authenticity/Identity).

### KSI-SVC-VRI — Validating Resource Integrity

> Use cryptographic methods to validate the integrity of machine-based information resources.

- **Legacy source(s):** KSI-SVC-05
- **NIST 800-53 controls:** cm-2.2, cm-8.3, sc-13, sc-23, si-7, si-7.1, sr-10
- **Evaluation policy:** mode `capability`, pass threshold 80%
- **Latest verdict:** **PASS** — ✅ Excellent (100%): Use cryptographic methods to validate the integrity of machine-based information resources. | 12/12 resources compliant. | Verified: Trail is Secure (Multi-Region, Validated, KMS-Encrypted, Global Eve…
- **Measures (validation objectives):**
  - LOGS: Validate that CloudTrail Log File Validation is enabled (Cryptographic hashing of audit trails). Uses describe-trails to enumerate trail ARNs (including shadow entries for organization trails owned by other accounts), then calls get-trail per ARN — get-trail returns the FULL Trail object including LogFileValidationEnabled even for shadow trails, where describe-trails strips that field from the home-account-controlled view on member-account responses. Required when the boundary delegates audit logging to an org trail in a separate management account.
  - STORAGE: Validate that the Audit/Artifact bucket has Versioning enabled (Prevents overwrite tampering).
  - SESSIONS: Validate active SSM Agents, which enforce TLS-encrypted, IAM-signed channels for session integrity (Replacing insecure SSH).
- **Evidence artifacts:** 3 files under `evidence_v2/KSI-SVC-VRI/` (plus `cli_output.json`, `evidence_index.json`)
- **Measure-to-statement rationale:** Validates Cryptographic Integrity for EC2 Environments. Checks for: 1) CloudTrail Log File Validation (Cryptographic proof of audit logs), 2) S3 Versioning (Integrity of build artifacts/backups), and 3) SSM Session Manager (Cryptographically authenticated/encrypted console access).


## FRR rule-family compliance (promoted legacy KSI-AFR validations)

The eleven legacy KSI-AFR indicators were promoted to FRR rule families under
CR26. Their automated validations continue to run and publish into the
`frr_validations` / `frr_summary` structures of the unified attestation.

- **FRR-MAS** (legacy KSI-AFR-01): PASS — 8 validation command(s); Validates the complete FedRAMP Minimum Assessment Scope (MAS) covering machine resources, human resources, and process resources. This rule enforces Structural 
- **FRR-FRC** (legacy KSI-AFR-02): n/a — 2 validation command(s); Set security goals and develop automated validation of status and progress.
- **FRR-CDS** (legacy KSI-AFR-03): PASS — 2 validation command(s); Determine how authorization data will be shared in alignment with the ADS standard.
- **FRR-VDR** (legacy KSI-AFR-04): PASS — 3 validation command(s); Document the vulnerability detection and response methodology.
- **FRR-SCN** (legacy KSI-AFR-05): PASS — 2 validation command(s); Verify SCN procedures are documented and active change tracking is maintained.
- **FRR-CCM** (legacy KSI-AFR-06): PASS — 2 validation command(s); Maintain a plan and process for providing Ongoing Authorization Reports and Quarterly Reviews.
- **FRR-SCG** (legacy KSI-AFR-07): PASS — 1 validation command(s); Document the secure configuration baseline for the cloud service offering.
- **FRR-AFC** (legacy KSI-AFR-08): PASS — 2 validation command(s); Operate a secure inbox to receive critical communication from FedRAMP and other government entities.
- **FRR-SDR** (legacy KSI-AFR-09): n/a — 2 validation command(s); Persistently validate security posture using automated pipelines.
- **FRR-IEC** (legacy KSI-AFR-10): PASS — 4 validation command(s); Integrate FedRAMP's Incident Communications Procedures (ICP) into incident response procedures and infrastructure.
- **FRR-CMU** (legacy KSI-AFR-11): PASS — 9 validation command(s); Ensure that cryptographic modules are selected and used in alignment with the FedRAMP 20x Using Cryptographic Modules (UCM) policy.
