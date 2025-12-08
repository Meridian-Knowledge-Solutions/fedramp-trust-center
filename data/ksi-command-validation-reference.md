# SYSTEM SECURITY VALIDATION METHODOLOGY

**Document Version**: 4.0 (Phase Two - Moderate)  
**Date**: 2025-10-25  
**Status**: Official Technical Reference for FedRAMP 20x Phase Two (Moderate Impact)  
**Assessment Partner**: Fortreum, LLC (3PAO)  
**Authority**: Meridian Knowledge Solutions, LLC

---

## 1.0 Document Purpose

This document provides the definitive technical methodology for the automated validation of all applicable Key Security Indicators (KSIs) for the FedRAMP 20x Phase Two Moderate pilot. It serves as the sole, authoritative reference that details:

1. The specific CLI commands used to gather evidence directly from the production environment for each KSI.
2. The sophisticated, automated validation logic applied to the collected data to determine compliance.
3. The graduated scoring methodology and Impact Level Adapter system that scales validation thresholds based on impact level (LOW, MODERATE, HIGH).
4. The technical justification for why each validation approach is sufficient to meet the security objectives of a Moderate impact system.

This document replaces and supersedes previous versions by integrating Phase Two enhancements including:
- Impact Level Adapter with graduated scoring thresholds
- Five new MODERATE-only KSIs (CNA-08, MLA-08, SVC-08, SVC-09, SVC-10)
- Three new Phase 2 KSIs applicable to all levels (CED-03, IAM-07, MLA-07)
- Retirement of superseded KSIs (MLA-04, MLA-06, TPR-02)
- Dynamic threshold adjustment based on FedRAMP impact level

---

## 2.0 Evaluation Methodology: Graduated Scoring and the Impact Level Adapter

### 2.1 Overview

This validation system has been upgraded for Phase 2 Moderate compliance to replace binary, rule-embedded pass/fail logic with a more robust, scalable **Graduated Scoring** model. This methodology is a two-part process:

#### Part 1: Rule-Based Scoring
Each `evaluate_KSI_...` function acts as a specialized measurement tool. Its sole responsibility is to analyze all available evidence (live CLI output, CodeCommit files, S3 artifacts) and calculate a final numerical `score` (e.g., 15) and a `max_score` (e.g., 20). This score represents the technical maturity and completeness of the control's implementation. **The rule does not determine the pass/fail status.**

#### Part 2: Adapter-Based Judgment
The rule returns its numerical score to the **Impact Level Adapter**, which reads the pipeline's `FEDRAMP_IMPACT_LEVEL` environment variable (LOW, MODERATE, or HIGH) and compares the rule's score against a centrally-defined set of pass/fail thresholds corresponding to that specific impact level.

### 2.2 Impact Level Thresholds

The Impact Level Adapter applies the following threshold percentages to determine pass/fail status:

| Impact Level | Minimum Pass | Good Pass | Excellent Pass |
|:-------------|:-------------|:----------|:---------------|
| **LOW**      | 50%          | 70%       | 85%            |
| **MODERATE** | 64%          | 80%       | 90%            |
| **HIGH**     | 79%          | 88%       | 95%            |

**Example**: A KSI that achieves 10/15 (67%) would:
- **PASS** at LOW impact (exceeds 50% threshold)
- **PASS** at MODERATE impact (exceeds 64% threshold)  
- **FAIL** at HIGH impact (below 79% threshold)

This design aligns with Phase 2's focus on maturity over simple completion. It allows the entire validation ruleset to scale its expectations based on the system's impact level without requiring separate validation rules.

### 2.3 Technical Implementation

The Impact Level Adapter works through transparent function wrapping:

```python
# At the top of validation script (before importing rules):
import impact_level_adapter
impact_level_adapter.initialize()

# The adapter automatically wraps all evaluate_KSI_* functions
# When imported, functions are already impact-aware
import cli_assertion_rules_full
```

The adapter:
1. Wraps all `evaluate_KSI_*` assertion functions at import time
2. Detects score patterns (e.g., "12/14") in function return messages
3. Extracts the score and max_score values
4. Re-evaluates against impact-adjusted thresholds
5. Preserves detailed findings while adjusting pass/fail determination
6. Only overrides the original result if the pass/fail status changes

### 2.4 Graduated Scoring vs Hard Fail

This dual approach ensures that while we measure and reward progressive maturity in areas like defense-in-depth, we maintain an uncompromising stance on a few critical, foundational security principles where any deficiency constitutes an unacceptable risk.

**Graduated Scoring** is appropriate for controls where security is achieved through multiple layers and a "defense-in-depth" approach. The majority of KSIs use this model to measure progress and reward incremental improvements.

**Hard Fail** is reserved for six strategic KSIs where the absence of a single, specific component represents a complete failure of the control's intent, bypassing graduated scoring entirely:

- **KSI-CNA-04** (Immutability & Least Privilege): Fails if `AdministratorAccess` policy found on unapproved roles or sensitive ports exposed to `0.0.0.0/0`
- **KSI-CNA-08** (Automated Security Posture): Fails if no direct proof of automated enforcement (Config remediation or SSM associations)
- **KSI-CMT-01** (Log System Modifications): Fails if no CloudTrail trails configured
- **KSI-IAM-02** (Passwordless & MFA): Fails if neither passwordless auth nor strong traditional security posture present
- **KSI-IAM-03** (Service Account Security): Fails if account lacks foundational role-based architecture
- **KSI-RPL-02** (Recovery Plan): Fails if required PDF documentation not found

---

## 3.0 KSI Applicability by Impact Level

### 3.1 Phase Two KSI Changes

**Retired KSIs** (no longer required at any level):
- **KSI-MLA-04**: Superseded by KSI-MLA-03
- **KSI-MLA-06**: Superseded by KSI-MLA-03
- **KSI-TPR-02**: Superseded by KSI-TPR-01

**New Phase 2 KSIs** (applicable to all levels):
- **KSI-CED-03**: Security culture and continuous improvement
- **KSI-IAM-07**: Automated access review and certification
- **KSI-MLA-07**: Centralized log management and correlation

**MODERATE-Only KSIs** (required only for MODERATE and HIGH):
- **KSI-CNA-08**: Automated security posture assessment and enforcement
- **KSI-MLA-08**: Least-privilege log access controls
- **KSI-SVC-08**: No residual elements from changes
- **KSI-SVC-09**: Continuous integrity validation
- **KSI-SVC-10**: Prompt removal of unwanted information

### 3.2 KSI Counts by Impact Level

| Impact Level | Base KSIs | MODERATE-Only KSIs | Total KSIs |
|:-------------|:----------|:-------------------|:-----------|
| **LOW**      | 48        | 0                  | 48         |
| **MODERATE** | 48        | 5                  | 53         |
| **HIGH**     | 48        | 5                  | 53         |

### 3.3 Category Breakdown for MODERATE Impact

The following table summarizes the automation coverage across all KSI categories for MODERATE baseline:

| Category | High Coverage | Medium Coverage | Low Coverage | Total KSIs |
|:---------|:--------------|:----------------|:-------------|:-----------|
| **Cloud Native Architecture** | 8 | 0 | 0 | 8 |
| **Service Configuration** | 10 | 0 | 0 | 10 |
| **Monitoring, Logging, & Auditing** | 5 | 0 | 0 | 5 |
| **Identity & Access Management** | 5 | 2 | 0 | 7 |
| **Change Management** | 2 | 3 | 0 | 5 |
| **Third-Party Resources** | 0 | 2 | 0 | 2 |
| **Recovery Planning** | 1 | 2 | 1 | 4 |
| **Incident Reporting** | 1 | 1 | 1 | 3 |
| **Policy & Inventory** | 1 | 2 | 4 | 7 |
| **Cybersecurity Education** | 0 | 0 | 3 | 3 |
| **Total** | **33** | **12** | **9** | **53** |

---

## 4.0 Coverage Classification System

Each KSI validation is classified based on the number of automated commands and the depth of the validation logic. This system quantifies the level of automation and sophistication applied to each indicator.

| Coverage Level | Command Count | Validation Approach |
|:---------------|:--------------|:--------------------|
| **High Coverage** | 6+ commands | Multi-command, defense-in-depth validation directly measuring live system properties |
| **Medium Coverage** | 3-5 commands | Hybrid validation using multiple CLI commands, often supplemented by operational artifacts |
| **Low Coverage** | 1-2 commands | Validation relies primarily on the presence of procedural documentation or simple configuration checks |

---

## 5.0 Detailed KSI Validation Methodology

### **Cloud Native Architecture (8/8 KSIs - Complete High Coverage)**

### **KSI-CNA-01: Configure ALL information resources to limit inbound and outbound traffic**

**Security Objective**: Defense-in-depth network security validation across all layers of the networking stack

**Graduated Scoring Model**: This KSI exemplifies the graduated scoring approach. Security is achieved through multiple layers (Security Groups, NACLs, WAF, VPC Endpoints). An environment with strong Security Groups but no WAF demonstrates "good" rather than "excellent" implementation - appropriate for graduated scoring rather than hard fail.

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws ec2 describe-security-groups` | **Security Group Analysis**: Validates ingress/egress rules for all EC2 instances and resources, measuring the primary perimeter defense layer | Primary Perimeter |
| `aws ec2 describe-network-acls` | **Network ACL Validation**: Examines subnet-level network access controls, providing defense-in-depth beyond security groups | Subnet Defense |
| `aws wafv2 list-web-acls` | **Web Application Firewall**: Validates WAF rules protecting application-layer traffic, essential for public-facing services | Application Layer |
| `aws ec2 describe-vpc-endpoints` | **Private Connectivity**: Identifies VPC endpoints enabling private AWS service access without internet gateway traversal | Service Access |
| `aws ec2 describe-route-tables` | **Routing Analysis**: Examines route tables to identify internet gateway exposure and validate network isolation | Network Routing |
| `aws ec2 describe-nat-gateways` | **Egress Control**: Validates controlled outbound internet access through NAT gateways rather than direct internet routing | Egress Management |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Multi-layer defense validation (6 distinct command types)
- ✅ Comprehensive ingress/egress traffic control verification
- ✅ Application layer through network layer coverage
- ✅ Direct measurement of live network configuration

**Graduated Score Calculation**: Points awarded for Security Groups (4), NACLs (2), WAF presence (2), VPC Endpoints (2), proper routing (2), NAT gateways (2). Maximum 14 points. Pass thresholds: LOW≥7, MODERATE≥9, HIGH≥11.

---

### **KSI-CNA-02: Ensure immutability through IaC**

**Security Objective**: Infrastructure as Code validation for configuration management and change control

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws codecommit list-repositories` | **IaC Repository Detection**: Identifies CodeCommit repositories containing infrastructure definitions | Repository Discovery |
| `aws codecommit get-folder --repository-name <repo> --folder-path /` | **IaC Content Analysis**: Examines repository structure for IaC files (Terraform, CloudFormation, CDK) | Content Validation |
| `aws cloudformation list-stacks` | **Stack Deployment Verification**: Validates active CloudFormation stacks demonstrating IaC deployment | Deployment Evidence |
| `aws s3api list-buckets` | **Terraform State Backend**: Identifies S3 buckets used for Terraform state management | State Management |
| `aws dynamodb list-tables` | **State Locking**: Validates DynamoDB tables used for Terraform state locking, ensuring safe concurrent operations | Concurrency Control |
| `aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=CreateStack` | **Change Audit Trail**: Proves all infrastructure changes go through IaC by examining CloudTrail for stack operations | Change Verification |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Repository and content verification
- ✅ Active deployment validation
- ✅ State management confirmation
- ✅ Change audit trail analysis

**Graduated Score Calculation**: Points for IaC repos (3), file presence (2), active stacks (3), S3 state backend (2), DynamoDB locking (2), CloudTrail evidence (2). Maximum 14 points.

---

### **KSI-CNA-03: Prevent data and service availability or integrity issues**

**Security Objective**: High availability and data durability validation across compute, storage, and database layers

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws elbv2 describe-load-balancers` | **Load Balancer Configuration**: Validates load balancers distributing traffic across availability zones | Traffic Distribution |
| `aws autoscaling describe-auto-scaling-groups` | **Auto Scaling Validation**: Confirms auto scaling groups maintaining service availability during failures | Service Resilience |
| `aws rds describe-db-instances` | **Database High Availability**: Validates Multi-AZ RDS deployments for automatic failover capability | Database Resilience |
| `aws s3api get-bucket-versioning --bucket <bucket>` | **Data Versioning**: Confirms S3 versioning enabled for data recovery and integrity protection | Data Protection |
| `aws s3api get-bucket-replication --bucket <bucket>` | **Cross-Region Replication**: Validates disaster recovery through geographic data replication | Geographic Redundancy |
| `aws backup list-backup-plans` | **Automated Backup Strategy**: Confirms AWS Backup plans for consistent, automated data protection | Backup Automation |
| `aws cloudwatch describe-alarms` | **Availability Monitoring**: Validates CloudWatch alarms for proactive availability issue detection | Monitoring |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Multi-AZ and cross-region redundancy validation
- ✅ Automated scaling and recovery mechanisms
- ✅ Data versioning and backup verification
- ✅ Comprehensive availability monitoring

**Graduated Score Calculation**: Load balancers (2), auto scaling (2), Multi-AZ RDS (3), S3 versioning (2), replication (2), backup plans (2), alarms (2). Maximum 15 points.

---

### **KSI-CNA-04: Implement immutability and least privilege**

**Security Objective**: Strict least privilege enforcement and immutable infrastructure validation

**Hard Fail Conditions**: 
1. `AdministratorAccess` policy found on any role except approved break-glass roles
2. Security Groups with SSH (22), RDP (3389), or database ports open to `0.0.0.0/0`

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws iam list-roles` | **Role Analysis**: Identifies all IAM roles and their attached policies | Role Discovery |
| `aws iam list-attached-role-policies --role-name <role>` | **Policy Attachment Validation**: Examines each role for overly permissive policies like AdministratorAccess | Permission Validation |
| `aws ec2 describe-security-groups` | **Network Exposure Analysis**: Identifies security groups with dangerous public exposure (0.0.0.0/0) | Network Security |
| `aws iam get-policy-version --policy-arn <arn> --version-id <version>` | **Policy Content Analysis**: Examines actual IAM policy JSON for least privilege violations | Permission Content |
| `aws ec2 describe-images --owners self` | **AMI Immutability**: Validates use of custom AMIs demonstrating immutable infrastructure patterns | Immutability |
| `aws ssm list-associations` | **Configuration Management**: Validates Systems Manager associations for consistent configuration enforcement | Configuration Control |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Comprehensive IAM permission analysis
- ✅ Network exposure validation
- ✅ Immutable infrastructure verification
- ✅ **Hard fail enforcement** for critical violations

**Scoring**: Achieves maximum score only with no `AdministratorAccess` violations AND no dangerous public exposure. Hard fail triggers immediate failure regardless of other positive findings.

---

### **KSI-CNA-05: Encrypt data at rest**

**Security Objective**: Comprehensive encryption validation across all data storage services

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws s3api get-bucket-encryption --bucket <bucket>` | **S3 Encryption**: Validates default encryption configuration for all S3 buckets | Object Storage |
| `aws rds describe-db-instances` | **RDS Encryption**: Confirms encryption at rest for all database instances | Relational Databases |
| `aws dynamodb describe-table --table-name <table>` | **DynamoDB Encryption**: Validates KMS encryption for NoSQL databases | NoSQL Databases |
| `aws ec2 describe-volumes` | **EBS Encryption**: Confirms all EBS volumes use encryption | Block Storage |
| `aws kms list-keys` | **Key Management**: Validates AWS KMS key infrastructure for encryption operations | Encryption Keys |
| `aws kms describe-key --key-id <key>` | **Key Configuration**: Examines KMS key policies and rotation settings | Key Policy |
| `aws kms get-key-rotation-status --key-id <key>` | **Key Rotation**: Validates automatic key rotation enabled for compliance | Key Rotation |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ All AWS storage services covered
- ✅ KMS key management validation
- ✅ Encryption configuration verification
- ✅ Automatic key rotation confirmation

**Graduated Score Calculation**: S3 encryption (2), RDS encryption (2), DynamoDB encryption (2), EBS encryption (2), KMS keys present (2), proper key policies (2), rotation enabled (2). Maximum 14 points.

---

### **KSI-CNA-06: Encrypt data in transit**

**Security Objective**: TLS/HTTPS enforcement across all external and internal communications

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws elbv2 describe-listeners --load-balancer-arn <arn>` | **HTTPS Listener Validation**: Confirms load balancers use HTTPS (port 443) rather than HTTP (port 80) | External Traffic |
| `aws elbv2 describe-target-groups` | **Backend TLS**: Validates target groups use HTTPS protocol for backend communication | Internal Traffic |
| `aws acm list-certificates` | **Certificate Management**: Validates AWS Certificate Manager certificates for TLS termination | Certificate Infrastructure |
| `aws acm describe-certificate --certificate-arn <arn>` | **Certificate Validity**: Examines certificate status, expiration, and domain validation | Certificate Health |
| `aws rds describe-db-instances` | **Database TLS**: Validates RDS parameter groups requiring SSL/TLS for database connections | Database Security |
| `aws s3api get-bucket-policy --bucket <bucket>` | **S3 TLS Enforcement**: Validates bucket policies requiring `aws:SecureTransport` for all access | S3 Security |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Load balancer HTTPS enforcement
- ✅ Certificate lifecycle management
- ✅ Database connection encryption
- ✅ S3 secure transport policies

**Graduated Score Calculation**: HTTPS listeners (3), backend TLS (2), ACM certificates (2), certificate validity (2), RDS SSL (2), S3 secure transport (2). Maximum 13 points.

---

### **KSI-CNA-07: Ensure automated security assessment coverage**

**Security Objective**: Continuous automated security scanning across infrastructure and applications

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws inspector2 list-coverage` | **Inspector Coverage**: Validates AWS Inspector 2 scanning of EC2, ECR, and Lambda resources | Vulnerability Scanning |
| `aws inspector2 list-findings` | **Active Findings**: Confirms Inspector actively identifying vulnerabilities and generating findings | Finding Generation |
| `aws securityhub describe-hub` | **Security Hub Enablement**: Validates Security Hub aggregating security findings from multiple services | Finding Aggregation |
| `aws securityhub get-enabled-standards` | **Compliance Standards**: Confirms enabled security standards (CIS, PCI-DSS, AWS Foundational) | Compliance Scanning |
| `aws guardduty list-detectors` | **Threat Detection**: Validates GuardDuty continuous threat monitoring | Threat Intelligence |
| `aws config describe-configuration-recorders` | **Config Recording**: Confirms AWS Config tracking configuration changes for compliance | Configuration Tracking |
| `aws accessanalyzer list-analyzers` | **Access Analysis**: Validates IAM Access Analyzer identifying unintended resource access | Access Review |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Multi-service security scanning coverage
- ✅ Vulnerability and compliance assessment
- ✅ Threat detection and access analysis
- ✅ Continuous automated monitoring

**Graduated Score Calculation**: Inspector coverage (2), active findings (1), Security Hub (2), standards enabled (2), GuardDuty (2), Config recorders (2), Access Analyzer (2). Maximum 13 points.

---

### **KSI-CNA-08: Automatically enforce secure operations** *(MODERATE-only KSI)*

**Security Objective**: Automated remediation and enforcement of security configurations

**Hard Fail Condition**: Must demonstrate automated enforcement through Config remediation actions OR SSM State Manager associations. Passive assessment without enforcement triggers immediate failure.

**Phase 2 Rationale**: This KSI represents Phase 2's philosophy shift toward "truly automated and opinionated validation" and "demonstrating participation and involvement" - requiring proof of actual enforcement operations, not just infrastructure presence. Maps to CA-2.1 (Independent Assessors) and CA-7.1 (Continuous Monitoring), both emphasizing actionable assessment.

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws configservice describe-remediation-configurations` | **Automated Remediation**: Validates AWS Config rules with automatic remediation actions for non-compliant resources | Compliance Enforcement |
| `aws configservice describe-remediation-execution-status` | **Enforcement Evidence**: Proves remediation actions have actually executed, not just configured | Execution Proof |
| `aws ssm list-associations` | **State Manager Enforcement**: Validates Systems Manager associations enforcing desired state configurations | Configuration Enforcement |
| `aws ssm describe-instance-associations-status --instance-id <id>` | **Association Status**: Confirms State Manager associations actively running on instances | Active Enforcement |
| `aws config describe-compliance-by-config-rule` | **Compliance Tracking**: Validates Config rules tracking security posture compliance over time | Compliance Monitoring |
| `aws lambda list-functions` | **Automation Functions**: Identifies Lambda functions used for custom security automation and enforcement | Custom Automation |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Automated remediation validation
- ✅ Execution status verification
- ✅ State enforcement confirmation
- ✅ **Hard fail for absence of enforcement**

**Scoring**: Requires evidence of either Config remediation OR SSM associations actively enforcing security configurations. Absence of enforcement mechanisms triggers hard fail regardless of assessment infrastructure.

---

## **Service Configuration (10/10 KSIs - Complete High Coverage)**

### **KSI-SVC-01: Use serverless and managed services where possible**

**Security Objective**: Serverless and managed service adoption validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws lambda list-functions` | **Serverless Compute**: Validates Lambda function usage for compute workloads | Serverless Adoption |
| `aws rds describe-db-instances` | **Managed Databases**: Confirms use of managed RDS rather than self-managed databases | Database Services |
| `aws ecs list-clusters` | **Container Orchestration**: Validates managed ECS/Fargate for container workloads | Container Services |
| `aws elasticache describe-cache-clusters` | **Managed Caching**: Confirms ElastiCache usage for caching layers | Cache Services |
| `aws s3api list-buckets` | **Object Storage**: Validates S3 usage for object storage needs | Storage Services |
| `aws apigateway get-rest-apis` | **API Management**: Confirms API Gateway for API lifecycle management | API Services |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Comprehensive serverless service validation
- ✅ Managed service adoption across multiple domains
- ✅ Evidence of reduced operational overhead

**Graduated Score Calculation**: Lambda functions (3), managed RDS (2), ECS/Fargate (2), ElastiCache (2), S3 usage (2), API Gateway (2). Maximum 13 points.

---

### **KSI-SVC-02: Remove inactive resources**

**Security Objective**: Unused resource identification and removal validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws ec2 describe-instances` | **Instance Activity**: Identifies running vs stopped EC2 instances | Compute Resources |
| `aws ec2 describe-volumes` | **Unattached Volumes**: Detects EBS volumes not attached to any instance | Storage Resources |
| `aws ec2 describe-snapshots --owner-id self` | **Old Snapshots**: Identifies aged snapshots that may be obsolete | Snapshot Management |
| `aws rds describe-db-instances` | **Database Activity**: Detects idle or stopped database instances | Database Resources |
| `aws iam get-credential-report` | **Inactive Users**: Identifies IAM users with no recent activity | Identity Resources |
| `aws elasticloadbalancing describe-load-balancers` | **Unused Load Balancers**: Detects load balancers with zero target instances | Network Resources |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Multi-resource type coverage
- ✅ Activity analysis across services
- ✅ Unused resource detection

**Graduated Score Calculation**: No stopped instances (2), no unattached volumes (2), snapshot age management (2), no idle RDS (2), no inactive users (2), no empty load balancers (2). Maximum 12 points.

---

### **KSI-SVC-03: Avoid hard-coding secrets**

**Security Objective**: Secrets management validation ensuring no hardcoded credentials

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws secretsmanager list-secrets` | **Secrets Manager Usage**: Validates use of AWS Secrets Manager for credential storage | Secrets Storage |
| `aws ssm describe-parameters` | **Parameter Store**: Confirms Systems Manager Parameter Store usage for configuration secrets | Parameter Management |
| `aws lambda get-function --function-name <name>` | **Lambda Environment**: Examines Lambda environment variables for hardcoded secrets (negative test) | Runtime Configuration |
| `aws ecs describe-task-definition --task-definition <arn>` | **ECS Task Secrets**: Validates ECS tasks reference Secrets Manager rather than hardcoded values | Container Secrets |
| `aws codecommit get-file` | **Code Repository Analysis**: Scans repository files for hardcoded credentials or API keys | Code Security |
| `aws rds describe-db-instances` | **Database Credentials**: Validates RDS instances use Secrets Manager rotation for credentials | Database Secrets |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Secrets Manager infrastructure validation
- ✅ Runtime configuration examination
- ✅ Code repository scanning
- ✅ Database credential management

**Graduated Score Calculation**: Secrets Manager present (3), Parameter Store usage (2), Lambda references secrets (2), ECS tasks use secrets (2), clean code repositories (2), RDS secrets rotation (2). Maximum 13 points.

---

### **KSI-SVC-04: Maintain separate non-production environment**

**Security Objective**: Environment segregation validation through infrastructure and access controls

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws organizations list-accounts` | **Account Separation**: Validates separate AWS accounts for production vs non-production | Account Isolation |
| `aws ec2 describe-vpcs` | **Network Separation**: Confirms separate VPCs for production and non-production workloads | Network Isolation |
| `aws iam list-roles` | **Role Segregation**: Validates separate IAM roles for production and non-production access | Access Isolation |
| `aws cloudtrail lookup-events` | **Change Tracking**: Proves different change control processes for production vs non-production | Process Isolation |
| `aws resourcegroupstaggingapi get-resources` | **Resource Tagging**: Validates environment tags (Production, Staging, Development) on all resources | Resource Classification |
| `aws rds describe-db-instances` | **Database Separation**: Confirms separate database instances for each environment | Data Isolation |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Multi-level environment segregation
- ✅ Account and network isolation
- ✅ Access control separation
- ✅ Resource tagging validation

**Graduated Score Calculation**: Separate accounts (3), separate VPCs (2), segregated roles (2), tagged resources (2), separate databases (2), change control evidence (2). Maximum 13 points.

---

### **KSI-SVC-05: Maintain automated security tests in CI/CD pipeline**

**Security Objective**: Continuous security testing integration validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws codepipeline list-pipelines` | **Pipeline Infrastructure**: Validates CI/CD pipeline existence | Pipeline Presence |
| `aws codebuild list-projects` | **Build Projects**: Confirms CodeBuild projects for compilation and testing | Build Infrastructure |
| `aws codecommit get-file --repository-name <repo> --file-path buildspec.yml` | **Build Specification**: Examines buildspec.yml for security testing commands (SAST, dependency scanning) | Test Configuration |
| `aws codebuild batch-get-builds` | **Build Execution**: Validates recent build executions with security test results | Test Execution |
| `aws s3api list-objects --bucket <artifacts-bucket>` | **SARIF Reports**: Confirms security scan artifacts (SARIF files) stored from pipeline executions | Test Evidence |
| `aws iam list-roles` | **Pipeline Permissions**: Validates least-privilege IAM roles for pipeline execution | Pipeline Security |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ CI/CD infrastructure validation
- ✅ Security test configuration
- ✅ Execution evidence
- ✅ Test artifact verification

**Graduated Score Calculation**: Pipeline present (2), CodeBuild projects (2), buildspec with security tests (3), recent executions (2), SARIF artifacts (2), least-privilege roles (2). Maximum 13 points.

---

### **KSI-SVC-06: Define system baseline and deviations**

**Security Objective**: Configuration baseline validation and drift detection

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws config describe-configuration-recorders` | **Config Recording**: Validates AWS Config continuously recording configuration changes | Configuration Tracking |
| `aws config describe-delivery-channels` | **Config Delivery**: Confirms Config delivering configuration snapshots to S3 for historical analysis | Configuration Storage |
| `aws config list-discovered-resources` | **Resource Inventory**: Validates comprehensive resource discovery and tracking | Inventory Management |
| `aws config describe-compliance-by-config-rule` | **Baseline Compliance**: Confirms Config rules defining and enforcing configuration baselines | Baseline Enforcement |
| `aws ssm list-documents --document-filter-list key=Owner,value=Self` | **Baseline Documentation**: Validates Systems Manager documents defining secure configurations | Configuration Standards |
| `aws ssm describe-instance-information` | **Compliance Status**: Confirms managed instances reporting compliance status | Compliance Monitoring |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Continuous configuration tracking
- ✅ Baseline definition and enforcement
- ✅ Drift detection capability
- ✅ Compliance monitoring

**Graduated Score Calculation**: Config recorders (2), delivery channels (2), resource discovery (2), compliance rules (3), baseline documents (2), instance compliance (2). Maximum 13 points.

---

### **KSI-SVC-07: Audit configuration changes**

**Security Objective**: Comprehensive change audit trail validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws cloudtrail describe-trails` | **CloudTrail Configuration**: Validates CloudTrail trails capturing all API activity | Audit Infrastructure |
| `aws cloudtrail get-trail-status --name <trail>` | **Trail Status**: Confirms trails are logging and delivering events | Audit Status |
| `aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=PutObject` | **Change Events**: Validates CloudTrail capturing specific configuration change events | Event Validation |
| `aws s3api get-bucket-versioning --bucket <cloudtrail-bucket>` | **Audit Log Integrity**: Confirms S3 versioning and MFA Delete on CloudTrail log buckets | Log Protection |
| `aws config describe-configuration-recorder-status` | **Config Recorder Status**: Validates Config recording all resource configuration changes | Configuration Audit |
| `aws logs describe-log-groups` | **CloudWatch Logs**: Confirms CloudTrail logs forwarded to CloudWatch for analysis and alarming | Log Analysis |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Complete API audit trail
- ✅ Audit log integrity protection
- ✅ Configuration change tracking
- ✅ Log analysis infrastructure

**Graduated Score Calculation**: CloudTrail trails (3), trail logging status (2), event validation (2), log bucket protection (2), Config recording (2), CloudWatch forwarding (2). Maximum 13 points.

---

### **KSI-SVC-08: No residual elements from changes** *(MODERATE-only KSI)*

**Security Objective**: Clean change implementation with no leftover temporary or test resources

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws ec2 describe-instances --filters Name=tag:Purpose,Values=test,temporary` | **Temporary Resources**: Identifies instances tagged as temporary that should be removed | Compute Cleanup |
| `aws s3api list-buckets` | **Bucket Naming Analysis**: Detects buckets with temporary naming patterns (test-, tmp-, dev-) | Storage Cleanup |
| `aws iam list-users` | **Test Users**: Identifies IAM users with test or temporary naming patterns | Identity Cleanup |
| `aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=RunInstances` | **Recent Resource Creation**: Analyzes recent resource creation events for cleanup verification | Change Validation |
| `aws resourcegroupstaggingapi get-resources --tag-filters Key=Lifecycle,Values=temporary` | **Lifecycle Tagging**: Validates resources properly tagged with lifecycle information | Resource Management |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Multi-resource cleanup validation
- ✅ Naming pattern analysis
- ✅ Lifecycle management verification
- ✅ Post-change cleanup confirmation

**Graduated Score Calculation**: No temporary instances (3), clean bucket naming (2), no test users (2), cleanup validation (2), proper lifecycle tags (3). Maximum 12 points.

---

### **KSI-SVC-09: Continuous integrity validation** *(MODERATE-only KSI)*

**Security Objective**: Automated file and configuration integrity monitoring

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws ssm list-associations --association-filter-list key=Name,value=AWS-RunPatchBaseline` | **Patch Compliance**: Validates Systems Manager patch baselines for continuous OS integrity | Patch Management |
| `aws ssm describe-instance-patch-states` | **Patch Status**: Confirms instances reporting patch compliance status | Compliance Status |
| `aws guardduty list-detectors` | **Runtime Integrity**: Validates GuardDuty monitoring for unauthorized file modifications | Runtime Monitoring |
| `aws inspector2 list-findings --filter-criteria '{"findingType":[{"comparison":"EQUALS","value":"PACKAGE_VULNERABILITY"}]}'` | **Package Integrity**: Confirms Inspector scanning for compromised or vulnerable packages | Package Validation |
| `aws config describe-compliance-by-config-rule --config-rule-names approved-amis-by-id` | **AMI Compliance**: Validates only approved AMIs deployed, ensuring image integrity | Image Integrity |
| `aws securityhub get-findings --filters '{"Type":[{"Value":"Software and Configuration Checks","Comparison":"PREFIX"}]}'` | **Configuration Integrity**: Confirms Security Hub aggregating configuration integrity findings | Integrity Aggregation |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Multi-layer integrity validation
- ✅ Continuous monitoring infrastructure
- ✅ Package and patch compliance
- ✅ Runtime integrity detection

**Graduated Score Calculation**: Patch baselines (2), patch compliance (2), GuardDuty active (2), Inspector scanning (2), AMI compliance (2), Security Hub findings (2). Maximum 12 points.

---

### **KSI-SVC-10: Prompt removal of unwanted information** *(MODERATE-only KSI)*

**Security Objective**: Automated data lifecycle and retention policy enforcement

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws s3api get-bucket-lifecycle-configuration --bucket <bucket>` | **S3 Lifecycle Policies**: Validates lifecycle rules automatically expiring or transitioning aged objects | Object Lifecycle |
| `aws logs describe-log-groups` | **Log Retention**: Confirms CloudWatch Log Groups have retention periods configured (not infinite) | Log Management |
| `aws rds describe-db-snapshots` | **Snapshot Management**: Validates automated snapshot deletion for aged database backups | Snapshot Lifecycle |
| `aws ec2 describe-snapshots --owner-id self` | **EBS Snapshot Lifecycle**: Confirms EBS snapshots have automated deletion or lifecycle policies | Volume Lifecycle |
| `aws dynamodb describe-table --table-name <table>` | **DynamoDB TTL**: Validates Time-to-Live (TTL) configuration for automatic item expiration | NoSQL Lifecycle |
| `aws backup list-backup-plans` | **Backup Retention**: Confirms AWS Backup plans have retention policies, not indefinite storage | Backup Lifecycle |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Comprehensive lifecycle policy validation
- ✅ Automated data expiration
- ✅ Multi-service retention management
- ✅ Evidence of prompt removal processes

**Graduated Score Calculation**: S3 lifecycle rules (2), log retention policies (2), RDS snapshot management (2), EBS snapshot lifecycle (2), DynamoDB TTL (2), backup retention (2). Maximum 12 points.

---

## **Monitoring, Logging, and Auditing (5/5 KSIs - Complete High Coverage)**

### **KSI-MLA-01: Monitor systems continuously for security events**

**Security Objective**: Comprehensive continuous security monitoring validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws guardduty list-detectors` | **Threat Detection**: Validates GuardDuty continuous threat monitoring across accounts | Threat Monitoring |
| `aws guardduty get-findings` | **Active Detections**: Confirms GuardDty generating security findings | Detection Evidence |
| `aws cloudwatch describe-alarms` | **Metric Alarms**: Validates CloudWatch alarms for security-relevant metrics | Metric Monitoring |
| `aws logs describe-log-groups` | **Log Infrastructure**: Confirms log groups collecting security event data | Log Collection |
| `aws securityhub describe-hub` | **Finding Aggregation**: Validates Security Hub centralizing security findings | Central Monitoring |
| `aws config describe-configuration-recorders` | **Configuration Monitoring**: Confirms Config tracking configuration changes | Config Tracking |
| `aws cloudtrail describe-trails` | **Audit Trail**: Validates CloudTrail logging all API activity for security analysis | Audit Logging |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Multi-service monitoring coverage
- ✅ Active threat detection
- ✅ Comprehensive logging infrastructure
- ✅ Finding aggregation and analysis

**Graduated Score Calculation**: GuardDuty active (3), Security Hub enabled (2), CloudWatch alarms (2), log groups present (2), Config recording (2), CloudTrail trails (2). Maximum 13 points.

---

### **KSI-MLA-02: Maintain and protect audit logs**

**Security Objective**: Audit log protection and integrity validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws cloudtrail describe-trails` | **Trail Configuration**: Validates CloudTrail trails with proper protection settings | Audit Infrastructure |
| `aws s3api get-bucket-versioning --bucket <cloudtrail-bucket>` | **Versioning Protection**: Confirms S3 versioning on CloudTrail buckets preventing log deletion | Version Protection |
| `aws s3api get-bucket-encryption --bucket <cloudtrail-bucket>` | **Encryption at Rest**: Validates CloudTrail log bucket encryption | Log Encryption |
| `aws s3api get-public-access-block --bucket <cloudtrail-bucket>` | **Public Access Prevention**: Confirms public access block on CloudTrail log buckets | Access Protection |
| `aws kms describe-key --key-id <cloudtrail-key>` | **KMS Key Protection**: Validates KMS key used for CloudTrail log encryption has restricted access | Key Protection |
| `aws cloudtrail get-event-selectors --trail-name <trail>` | **Event Coverage**: Confirms trail logging all management and data events | Event Coverage |
| `aws logs describe-log-groups --log-group-name-prefix /aws/cloudtrail/` | **Log Forwarding**: Validates CloudTrail logs forwarded to CloudWatch for analysis | Log Analysis |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Multi-layer log protection
- ✅ Encryption and versioning validation
- ✅ Access control verification
- ✅ Complete event coverage

**Graduated Score Calculation**: CloudTrail trails (2), S3 versioning (2), bucket encryption (2), public access block (2), KMS protection (2), event selectors (2), CloudWatch forwarding (1). Maximum 13 points.

---

### **KSI-MLA-03: Employ automated tools for continuous monitoring**

**Security Objective**: Automated security tool deployment and operation validation

**Note**: This KSI supersedes retired KSI-MLA-04 and KSI-MLA-06, consolidating automated monitoring validation.

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws guardduty list-detectors` | **GuardDuty Automation**: Validates automated threat detection service | Threat Detection |
| `aws securityhub describe-hub` | **Security Hub Automation**: Confirms automated security finding aggregation | Finding Aggregation |
| `aws config describe-configuration-recorders` | **Config Automation**: Validates automated configuration compliance monitoring | Compliance Automation |
| `aws inspector2 list-coverage` | **Inspector Automation**: Confirms automated vulnerability scanning of resources | Vulnerability Scanning |
| `aws accessanalyzer list-analyzers` | **Access Analyzer Automation**: Validates automated IAM access analysis | Access Automation |
| `aws cloudwatch describe-alarms` | **Alarm Automation**: Confirms automated alerting on security metrics | Alert Automation |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Multiple automated security tools
- ✅ Continuous monitoring validation
- ✅ Automated finding generation
- ✅ Comprehensive security automation

**Graduated Score Calculation**: GuardDuty (2), Security Hub (2), Config (2), Inspector (2), Access Analyzer (2), CloudWatch alarms (2). Maximum 12 points.

---

### **KSI-MLA-05: Employ automated tools to identify information resources at risk**

**Security Objective**: Automated risk identification and vulnerability detection

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws inspector2 list-findings --filter-criteria '{"severity":[{"comparison":"EQUALS","value":"CRITICAL"},{"comparison":"EQUALS","value":"HIGH"}]}'` | **Critical Vulnerability Detection**: Identifies high-severity vulnerabilities requiring immediate attention | Risk Prioritization |
| `aws guardduty get-findings --finding-criteria '{"severity":{"gte":7}}'` | **High-Severity Threats**: Detects high-severity threat intelligence findings | Threat Risk |
| `aws securityhub get-findings --filters '{"SeverityLabel":[{"Value":"CRITICAL","Comparison":"EQUALS"}]}'` | **Security Hub Risk Aggregation**: Centralizes critical security findings across services | Risk Aggregation |
| `aws accessanalyzer list-findings` | **Unintended Access Risk**: Identifies resources with public or cross-account access risks | Access Risk |
| `aws config describe-compliance-by-config-rule --compliance-types NON_COMPLIANT` | **Non-Compliant Resources**: Identifies resources violating security baselines | Compliance Risk |
| `aws ec2 describe-security-groups --filters Name=ip-permission.cidr,Values=0.0.0.0/0` | **Network Exposure Risk**: Identifies security groups with public exposure | Network Risk |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Multi-dimensional risk detection
- ✅ Severity-based prioritization
- ✅ Automated finding generation
- ✅ Comprehensive risk coverage

**Graduated Score Calculation**: Inspector critical findings (2), GuardDuty threats (2), Security Hub aggregation (2), Access Analyzer findings (2), Config non-compliance (2), network exposure detection (2). Maximum 12 points.

---

### **KSI-MLA-07: Centralized log management and correlation** *(New Phase 2 KSI)*

**Security Objective**: Centralized logging infrastructure for security event correlation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws logs describe-log-groups` | **Log Group Infrastructure**: Validates CloudWatch Log Groups collecting logs from multiple sources | Log Collection |
| `aws logs describe-subscription-filters` | **Log Forwarding**: Confirms subscription filters forwarding logs to central analysis | Log Aggregation |
| `aws s3api list-buckets` | **Central Log Storage**: Identifies S3 buckets used for long-term centralized log storage | Storage Infrastructure |
| `aws kinesis list-streams` | **Log Streaming**: Validates Kinesis streams for real-time log aggregation | Real-Time Processing |
| `aws opensearch describe-domain` | **Log Analysis Platform**: Confirms OpenSearch/Elasticsearch for log search and correlation | Analysis Infrastructure |
| `aws securityhub describe-hub` | **Finding Correlation**: Validates Security Hub correlating findings across services | Finding Correlation |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Centralized log infrastructure validation
- ✅ Log forwarding and aggregation
- ✅ Analysis platform verification
- ✅ Cross-service correlation capability

**Graduated Score Calculation**: Log groups present (2), subscription filters (2), central S3 storage (2), Kinesis streaming (2), OpenSearch domain (2), Security Hub correlation (2). Maximum 12 points.

---

### **KSI-MLA-08: Least-privilege log access controls** *(MODERATE-only KSI)*

**Security Objective**: Restrictive access controls on audit logs and monitoring systems

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws logs describe-resource-policies` | **Log Group Policies**: Validates resource-based policies on CloudWatch Log Groups | Log Access Control |
| `aws s3api get-bucket-policy --bucket <cloudtrail-bucket>` | **Audit Log Access**: Confirms restrictive bucket policies on CloudTrail log storage | Audit Access Control |
| `aws iam list-roles` | **Log Access Roles**: Identifies IAM roles with log access permissions | Role Analysis |
| `aws iam get-role-policy --role-name <role> --policy-name <policy>` | **Role Permission Analysis**: Examines actual permissions granted to log access roles | Permission Validation |
| `aws kms list-grants --key-id <cloudtrail-key>` | **KMS Grant Analysis**: Validates KMS grants for CloudTrail log decryption are restricted | Encryption Access |
| `aws securityhub get-findings --filters '{"ResourceType":[{"Value":"AwsIamRole","Comparison":"EQUALS"}]}'` | **Excessive Permission Detection**: Identifies roles with overly broad log access | Permission Review |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Multi-layer access control validation
- ✅ Resource policy verification
- ✅ IAM permission analysis
- ✅ Encryption access control

**Graduated Score Calculation**: Log group policies (2), bucket policies restrictive (3), role analysis (2), permission validation (2), KMS grants restricted (2), no excessive permissions (2). Maximum 13 points.

---

## **Identity and Access Management (7/7 KSIs)**

### **KSI-IAM-01: Protect cloud API keys and credentials** *(High Coverage)*

**Security Objective**: API key and credential protection validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws iam get-credential-report` | **Credential Analysis**: Comprehensive credential inventory and status for all IAM users | Credential Inventory |
| `aws iam list-access-keys` | **Access Key Validation**: Identifies all access keys and their age for rotation compliance | Key Management |
| `aws secretsmanager list-secrets` | **Secrets Management**: Validates credentials stored in Secrets Manager rather than hardcoded | Secrets Storage |
| `aws iam get-account-password-policy` | **Password Policy**: Confirms strong password requirements for any IAM user credentials | Password Security |
| `aws kms list-keys` | **Encryption Keys**: Validates KMS keys used for credential encryption | Key Infrastructure |
| `aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=CreateAccessKey` | **Key Creation Audit**: Tracks access key creation events for monitoring | Access Audit |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Complete credential inventory
- ✅ Key lifecycle management
- ✅ Secrets Manager integration
- ✅ Audit trail validation

**Graduated Score Calculation**: Credential report present (2), no aged access keys (3), Secrets Manager usage (2), strong password policy (2), KMS infrastructure (2), audit trail present (2). Maximum 13 points.

---

### **KSI-IAM-02: Eliminate password-based authentication and require MFA** *(High Coverage)*

**Security Objective**: Passwordless authentication or strong MFA enforcement

**Hard Fail Condition**: Must demonstrate either passwordless authentication (SAML/SSO) OR strong traditional security posture (MFA enabled + strong password policy). Absence of both triggers immediate failure.

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws iam list-saml-providers` | **SAML Federation**: Validates SAML identity providers enabling passwordless SSO | Passwordless Auth |
| `aws iam list-open-id-connect-providers` | **OIDC Federation**: Confirms OpenID Connect providers for federated authentication | Federated Auth |
| `aws iam get-account-summary` | **IAM User Analysis**: Determines if account relies on IAM users vs federated identities | Authentication Model |
| `aws iam get-credential-report` | **MFA Status**: Validates MFA enabled for all users if IAM user authentication exists | MFA Enforcement |
| `aws iam get-account-password-policy` | **Password Strength**: Confirms strong password policy if passwords used | Password Policy |
| `aws organizations describe-organization` | **SSO Integration**: Validates AWS Organizations SSO for centralized authentication | Central Authentication |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Passwordless authentication validation
- ✅ MFA enforcement verification
- ✅ Federation infrastructure
- ✅ **Hard fail for weak authentication**

**Scoring**: Achieves maximum score with SAML/OIDC federation eliminating passwords. Falls back to requiring MFA + strong password policy. Hard fail if neither approach present.

---

### **KSI-IAM-03: Use temporary credentials for service accounts** *(High Coverage)*

**Security Objective**: IAM role-based architecture for service authentication

**Hard Fail Condition**: Must demonstrate role-based architecture with minimal IAM user usage. Excessive IAM users (>5) for service accounts triggers immediate failure.

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws iam list-roles` | **Role Infrastructure**: Validates comprehensive IAM role deployment for services | Role Architecture |
| `aws iam list-users` | **User Analysis**: Confirms minimal IAM user usage (should be human operators only) | User Validation |
| `aws sts get-caller-identity` | **Identity Type**: Validates current execution uses assumed role credentials | Credential Type |
| `aws iam get-credential-report` | **Access Key Audit**: Identifies any service access keys requiring migration to roles | Key Migration |
| `aws lambda list-functions` | **Lambda Role Usage**: Confirms Lambda functions use execution roles, not access keys | Lambda Security |
| `aws ecs list-task-definitions` | **ECS Task Roles**: Validates ECS tasks use task roles for AWS API access | Container Security |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Role-based architecture validation
- ✅ Service credential verification
- ✅ Temporary credential enforcement
- ✅ **Hard fail for excessive IAM users**

**Scoring**: Requires evidence of role-first architecture with minimal IAM users. Hard fail if >5 IAM users exist without strong justification.

---

### **KSI-IAM-04: Implement periodic authorization reviews** *(Medium Coverage)*

**Security Objective**: Access review process validation through IAM infrastructure and documentation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws iam get-credential-report` | **User Activity Analysis**: Generates credential report showing last activity for access review | Activity Tracking |
| `aws iam list-users` | **User Inventory**: Provides complete user list for review processes | User Management |
| `aws accessanalyzer list-analyzers` | **Automated Access Review**: Validates Access Analyzer deployment for continuous analysis | Automated Review |
| `evidence_check` | **Review Documentation**: Validates documented access review procedures and schedules | Process Documentation |

**Technical Coverage Assessment**: **MEDIUM COVERAGE**
- ✅ Activity monitoring infrastructure
- ✅ Automated access analysis
- ✅ Review process documentation
- ⚠️ Partial reliance on documented procedures

**Graduated Score Calculation**: Credential report capability (3), Access Analyzer present (3), review documentation (3), evidence of recent reviews (3). Maximum 12 points.

---

### **KSI-IAM-05: Apply separation of duties** *(Medium Coverage)*

**Security Objective**: Role separation and segregation of duties validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws iam list-roles` | **Role Inventory**: Analyzes IAM roles for separation of duties patterns | Role Architecture |
| `aws iam list-attached-role-policies --role-name <role>` | **Policy Analysis**: Examines role permissions for excessive or combined privileges | Permission Validation |
| `aws organizations list-accounts` | **Account Separation**: Validates separate AWS accounts for different functions (prod, dev, security) | Account Segregation |
| `evidence_check` | **SoD Documentation**: Validates documented separation of duties policies and controls | Process Documentation |

**Technical Coverage Assessment**: **MEDIUM COVERAGE**
- ✅ Role and account segregation validation
- ✅ Permission analysis for excessive privileges
- ✅ Documented SoD controls
- ⚠️ Partial reliance on documented procedures

**Graduated Score Calculation**: Clear role separation (3), no permission overlap (3), account segregation (3), SoD documentation (3). Maximum 12 points.

---

### **KSI-IAM-06: Develop and maintain access controls** *(High Coverage)*

**Security Objective**: Comprehensive access control infrastructure validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws iam list-policies --scope Local` | **Custom Policy Analysis**: Validates customer-managed IAM policies for access control | Custom Policies |
| `aws iam list-roles` | **Role-Based Access Control**: Confirms comprehensive RBAC implementation | RBAC Infrastructure |
| `aws organizations list-policies` | **Organization Policies**: Validates service control policies (SCPs) for organizational boundaries | Organizational Control |
| `aws s3api get-bucket-policy --bucket <bucket>` | **Resource-Based Policies**: Examines resource policies for access control | Resource Security |
| `aws ec2 describe-security-groups` | **Network Access Control**: Validates security group rules restricting network access | Network Security |
| `aws kms describe-key --key-id <key>` | **Encryption Access Control**: Validates KMS key policies restricting data access | Data Security |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Multi-layer access control validation
- ✅ IAM, network, and data controls
- ✅ Organizational policy enforcement
- ✅ Resource-level access control

**Graduated Score Calculation**: Custom policies present (2), comprehensive RBAC (2), SCPs present (2), resource policies (2), security groups restrictive (2), KMS key policies (2). Maximum 12 points.

---

### **KSI-IAM-07: Automated access review and certification** *(New Phase 2 KSI, High Coverage)*

**Security Objective**: Automated access certification and continuous review validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws accessanalyzer list-analyzers` | **Analyzer Deployment**: Validates IAM Access Analyzer for continuous access review | Access Analysis |
| `aws accessanalyzer list-findings` | **Access Findings**: Confirms Access Analyzer generating findings on unintended access | Finding Generation |
| `aws iam get-credential-report` | **Credential Activity**: Provides credential usage data for automated review processes | Activity Analysis |
| `aws lambda list-functions` | **Automation Functions**: Identifies Lambda functions implementing automated access review logic | Review Automation |
| `aws cloudwatch describe-alarms --alarm-name-prefix AccessReview` | **Review Alerts**: Validates CloudWatch alarms triggering on access review requirements | Alert Automation |
| `aws s3api list-objects --bucket <review-artifacts> --prefix access-reviews/` | **Review Evidence**: Confirms automated generation of access review artifacts | Evidence Generation |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Continuous access analysis infrastructure
- ✅ Automated finding generation
- ✅ Review automation validation
- ✅ Evidence artifact verification

**Graduated Score Calculation**: Access Analyzer present (3), active findings (2), credential analysis (2), automation functions (2), review alarms (2), review artifacts (2). Maximum 13 points.

---

## **Change Management (5/5 KSIs)**

### **KSI-CMT-01: Log all system modifications** *(High Coverage)*

**Security Objective**: Comprehensive audit trail for all infrastructure changes

**Hard Fail Condition**: Must have at least one CloudTrail trail configured and actively logging. Absence of CloudTrail triggers immediate failure as there is no authoritative log of system modifications.

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws cloudtrail describe-trails` | **Trail Configuration**: Validates CloudTrail trails capturing API activity | Audit Infrastructure |
| `aws cloudtrail get-trail-status --name <trail>` | **Logging Status**: Confirms trails actively logging events | Logging Verification |
| `aws cloudtrail lookup-events` | **Event Validation**: Proves CloudTrail capturing actual modification events | Event Evidence |
| `aws config describe-configuration-recorders` | **Configuration History**: Validates Config recording resource configuration changes | Configuration Tracking |
| `aws config describe-configuration-recorder-status` | **Recording Status**: Confirms Config actively recording changes | Recording Verification |
| `aws logs describe-log-groups --log-group-name-prefix /aws/cloudtrail/` | **Log Forwarding**: Validates CloudTrail logs forwarded to CloudWatch for analysis | Log Analysis |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Complete API activity logging
- ✅ Configuration change tracking
- ✅ Log forwarding and analysis
- ✅ **Hard fail for missing CloudTrail**

**Scoring**: Requires CloudTrail trails present and logging. Hard fail if no trails configured. Maximum points for multi-trail setup with Config recording and CloudWatch forwarding.

---

### **KSI-CMT-02: Employ change authorization workflows** *(High Coverage)*

**Security Objective**: Automated change approval and authorization validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws codecommit list-repositories` | **Repository Infrastructure**: Validates code repositories for change management | Repository Validation |
| `aws codecommit list-pull-requests --repository-name <repo>` | **Pull Request Workflow**: Confirms pull request workflow for code changes | Approval Process |
| `aws codepipeline list-pipelines` | **Deployment Pipeline**: Validates automated deployment pipelines for changes | Deployment Automation |
| `aws codepipeline get-pipeline --name <pipeline>` | **Pipeline Stages**: Examines pipeline for approval stages and gates | Approval Gates |
| `aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=UpdateStack` | **Change Audit**: Validates only authorized changes (via pipeline) modify infrastructure | Authorization Evidence |
| `aws s3api list-objects --bucket <artifacts-bucket> --prefix approvals/` | **Approval Evidence**: Confirms storage of change approval artifacts | Approval Documentation |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Repository-based change control
- ✅ Pull request workflow validation
- ✅ Automated approval gates
- ✅ Change authorization evidence

**Graduated Score Calculation**: CodeCommit repos (2), pull request workflow (3), pipelines present (2), approval stages (3), audit evidence (2), approval artifacts (2). Maximum 14 points.

---

### **KSI-CMT-03: Implement automated testing and validation of changes prior to deployment** *(Medium Coverage)*

**Security Objective**: Pre-deployment testing validation through automated CI/CD

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws codebuild list-projects` | **Build Project Infrastructure**: Validates CodeBuild projects for automated testing | Test Infrastructure |
| `aws codecommit get-file --repository-name <repo> --file-path buildspec.yml` | **Test Configuration**: Examines buildspec.yml for test commands (unit, integration, security) | Test Specification |
| `aws s3api list-objects --bucket <artifacts-bucket> --prefix test-results/` | **Test Artifacts**: Validates test result artifacts (JUnit XML, SARIF) from builds | Test Evidence |
| `evidence_check` | **Testing Documentation**: Validates comprehensive testing procedures and standards | Test Documentation |

**Technical Coverage Assessment**: **MEDIUM COVERAGE**
- ✅ Automated test infrastructure
- ✅ Test configuration validation
- ✅ Test artifact verification
- ⚠️ Partial reliance on documented procedures

**Graduated Score Calculation**: CodeBuild projects (3), buildspec with tests (3), test artifacts present (3), testing documentation (3). Maximum 12 points.

---

### **KSI-CMT-04: Track all technology assets by unique identifiers** *(Medium Coverage)*

**Security Objective**: Asset tracking and inventory management validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws resourcegroupstaggingapi get-resources` | **Resource Tagging**: Validates all resources tagged with identifiers (Name, AssetID, CostCenter) | Tagging Compliance |
| `aws config list-discovered-resources` | **Resource Inventory**: Confirms Config discovering and tracking all resources | Inventory Management |
| `aws ssm describe-instance-information` | **Instance Tracking**: Validates Systems Manager tracking managed instances | Instance Management |
| `evidence_check` | **Asset Management Documentation**: Validates documented asset tracking procedures | Process Documentation |

**Technical Coverage Assessment**: **MEDIUM COVERAGE**
- ✅ Automated resource discovery
- ✅ Tagging infrastructure validation
- ✅ Tracking system verification
- ⚠️ Partial reliance on documented procedures

**Graduated Score Calculation**: Resource tagging compliance (3), Config inventory (3), SSM tracking (3), asset documentation (3). Maximum 12 points.

---

### **KSI-CMT-05: Develop and maintain system inventory for vulnerability management** *(Medium Coverage)*

**Security Objective**: Comprehensive asset inventory for security management

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws config list-discovered-resources` | **Complete Resource Inventory**: Validates Config tracking all AWS resources | Resource Discovery |
| `aws inspector2 list-coverage` | **Vulnerability Scanning Coverage**: Confirms Inspector scanning all compute resources | Scan Coverage |
| `aws ssm list-commands` | **Patch Management**: Validates Systems Manager commands for inventory and patching | Patch Tracking |
| `evidence_check` | **Inventory Documentation**: Validates documented inventory management procedures | Process Documentation |

**Technical Coverage Assessment**: **MEDIUM COVERAGE**
- ✅ Automated resource discovery
- ✅ Vulnerability scan coverage
- ✅ Patch management integration
- ⚠️ Partial reliance on documented procedures

**Graduated Score Calculation**: Config inventory (3), Inspector coverage (3), SSM patch management (3), inventory documentation (3). Maximum 12 points.

---

## **Third-Party Resources (2/2 KSIs)**

### **KSI-TPR-01: Identify all third-party information resources** *(Medium Coverage)*

**Security Objective**: Automated discovery of external integrations and third-party software components

**Note**: This KSI supersedes retired KSI-TPR-02, consolidating third-party resource identification.

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws iam list-roles` | **Cross-Account Trust**: Identifies IAM roles with trust policies allowing access from external AWS accounts | Identity Integration |
| `aws ec2 describe-vpc-peering-connections` | **Network Integration**: Discovers VPC peering connections to external networks | Network Integration |
| `aws inspector2 list-findings` | **Software Components**: Analyzes Inspector findings to inventory third-party software packages and libraries | Software Inventory |

**Technical Coverage Assessment**: **MEDIUM COVERAGE**
- ✅ Automated discovery of AWS-level integrations
- ✅ Identifies third-party software dependencies
- ✅ Provides technical evidence of third-party connections

**Graduated Score Calculation**: Cross-account roles identified (4), VPC peering discovered (3), third-party software inventoried (4). Maximum 11 points.

---

### **KSI-TPR-03: Identify and prioritize mitigation of potential supply chain risks** *(Medium Coverage)*

**Security Objective**: Proactive identification and risk-based prioritization of supply chain vulnerabilities

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws inspector2 list-findings --filter-criteria '{"findingStatus": [{"comparison": "EQUALS", "value": "ACTIVE"}]}'` | **Vulnerability Detection**: Leverages Inspector to identify vulnerabilities in third-party software components | Vulnerability Scanning |
| `aws securityhub get-findings` | **Risk Prioritization**: Uses Security Hub to aggregate Inspector findings, automatically prioritized by severity | Risk Management |

**Technical Coverage Assessment**: **MEDIUM COVERAGE**
- ✅ Automates detection of software supply chain vulnerabilities
- ✅ Provides risk-informed basis for prioritization through severity ratings
- ✅ Directly measures key aspect of supply chain risk management

**Graduated Score Calculation**: Active vulnerability findings (5), Security Hub prioritization (5). Maximum 10 points.

---

## **Recovery Planning (4/4 KSIs)**

### **KSI-RPL-01: Maintain automated backup and recovery operations** *(High Coverage)*

**Security Objective**: Automated backup infrastructure and recovery capability validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws backup list-backup-plans` | **Backup Plan Validation**: Confirms AWS Backup plans defining automated backup schedules | Backup Planning |
| `aws backup list-backup-vaults` | **Backup Storage**: Validates backup vaults storing protected copies | Backup Storage |
| `aws backup list-recovery-points` | **Recovery Point Validation**: Confirms actual recovery points exist from backup operations | Backup Evidence |
| `aws rds describe-db-snapshots` | **Database Backups**: Validates automated RDS snapshots for database recovery | Database Protection |
| `aws ec2 describe-snapshots --owner-id self` | **Volume Backups**: Confirms EBS snapshots for volume recovery | Volume Protection |
| `aws backup describe-backup-job --backup-job-id <job>` | **Backup Job Status**: Validates successful backup job execution | Backup Verification |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Comprehensive backup infrastructure
- ✅ Multi-service backup validation
- ✅ Recovery point verification
- ✅ Backup execution confirmation

**Graduated Score Calculation**: Backup plans present (2), backup vaults (2), recovery points exist (3), RDS snapshots (2), EBS snapshots (2), successful backup jobs (2). Maximum 13 points.

---

### **KSI-RPL-02: Maintain recovery plan documentation** *(Medium Coverage)*

**Security Objective**: Recovery plan documentation validation

**Hard Fail Condition**: Must find required PDF documents outlining the recovery plan in the evidence directory. The control is specifically about maintaining documentation, so its absence is a complete failure.

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `evidence_check` | **Recovery Plan Documentation**: Validates recovery plan PDFs with procedures, RTO/RPO definitions | Plan Documentation |
| `aws backup list-backup-plans` | **Backup Infrastructure**: Validates backup infrastructure supporting documented recovery procedures | Recovery Infrastructure |

**Technical Coverage Assessment**: **MEDIUM COVERAGE**
- ✅ Documentation requirement validation
- ✅ Supporting infrastructure verification
- ⚠️ **Hard fail if documentation missing**

**Scoring**: Hard fail if required recovery plan PDFs not present in evidence directory. Maximum points if documentation complete with supporting backup infrastructure.

---

### **KSI-RPL-03: Conduct continuous testing of recovery plan** *(Medium Coverage)*

**Security Objective**: Recovery plan testing validation through execution evidence

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws backup list-recovery-points` | **Recovery Point Testing**: Validates recent recovery points available for testing | Test Resources |
| `aws backup start-restore-job` | **Restore Testing**: Demonstrates ability to execute restore operations | Restore Capability |
| `evidence_check` | **Testing Documentation**: Validates documented recovery testing procedures and results | Test Documentation |

**Technical Coverage Assessment**: **MEDIUM COVERAGE**
- ✅ Recovery infrastructure validation
- ✅ Restore capability demonstration
- ⚠️ Partial reliance on documented test results

**Graduated Score Calculation**: Recovery points available (3), restore capability (4), testing documentation (3). Maximum 10 points.

---

### **KSI-RPL-04: Detect, respond to and recover from security incidents** *(Low Coverage)*

**Security Objective**: Incident response procedures validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws logs describe-log-groups --log-group-name-prefix /aws/securityhub/` | **Security Event Logging**: Validates security event log infrastructure | Log Infrastructure |
| `evidence_check` | **Incident Response Documentation**: Validates IR procedures, playbooks, and response plans | IR Documentation |

**Technical Coverage Assessment**: **LOW COVERAGE**
- ✅ Security logging infrastructure
- ⚠️ Primary reliance on documented IR procedures

**Graduated Score Calculation**: Log infrastructure (3), IR documentation complete (7). Maximum 10 points.

---

## **Incident Reporting (3/3 KSIs)**

### **KSI-INR-01: Report incidents according to FedRAMP requirements** *(Low Coverage)*

**Security Objective**: FedRAMP incident reporting compliance validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws sns list-topics` | **Notification Infrastructure**: Validates SNS topics for incident notifications | Alert Infrastructure |
| `evidence_check` | **Reporting Documentation**: Validates FedRAMP incident reporting procedures and compliance policies | Compliance Documentation |

**Technical Coverage Assessment**: **LOW COVERAGE**
- ✅ Notification infrastructure validation
- ⚠️ Primary reliance on documented reporting procedures

**Graduated Score Calculation**: SNS notification infrastructure (3), reporting documentation (7). Maximum 10 points.

---

### **KSI-INR-02: Maintain incident log and periodically review for patterns** *(Medium Coverage)*

**Security Objective**: Incident logging and pattern analysis validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws logs describe-log-groups --log-group-name-prefix /aws/securityhub/` | **Incident Logging Infrastructure**: Validates log groups collecting incident data | Log Infrastructure |
| `aws securityhub get-findings` | **Incident Findings**: Confirms Security Hub aggregating security incidents | Finding Aggregation |
| `evidence_check` | **Review Documentation**: Validates documented incident review procedures and pattern analysis | Review Process |

**Technical Coverage Assessment**: **MEDIUM COVERAGE**
- ✅ Logging infrastructure validation
- ✅ Finding aggregation verification
- ⚠️ Partial reliance on documented review procedures

**Graduated Score Calculation**: Log infrastructure (3), Security Hub findings (3), review documentation (4). Maximum 10 points.

---

### **KSI-INR-03: Employ automated tools to assist in incident detection** *(High Coverage)*

**Security Objective**: Automated incident detection tool deployment validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws guardduty list-detectors` | **Threat Detection**: Validates GuardDuty automated threat detection | Threat Detection |
| `aws guardduty get-findings` | **Active Detections**: Confirms GuardDuty generating incident findings | Detection Evidence |
| `aws securityhub describe-hub` | **Finding Aggregation**: Validates Security Hub centralizing incident findings | Incident Aggregation |
| `aws securityhub get-findings --filters '{"RecordState":[{"Value":"ACTIVE","Comparison":"EQUALS"}]}'` | **Active Incidents**: Confirms active security findings requiring investigation | Incident Tracking |
| `aws cloudwatch describe-alarms --alarm-name-prefix Security` | **Automated Alerting**: Validates CloudWatch alarms for security metrics | Alert Automation |
| `aws sns list-subscriptions` | **Notification Delivery**: Confirms SNS subscriptions delivering incident notifications | Notification Infrastructure |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Multiple automated detection tools
- ✅ Active finding generation
- ✅ Incident aggregation and alerting
- ✅ Notification infrastructure

**Graduated Score Calculation**: GuardDuty active (2), active findings (2), Security Hub (2), active incidents (2), CloudWatch alarms (2), SNS subscriptions (2). Maximum 12 points.

---

## **Policy & Inventory (7/7 KSIs)**

### **KSI-PIY-01: Maintain complete inventory of all software and information resources** *(High Coverage)*

**Security Objective**: Comprehensive asset inventory across all resource types

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws config list-discovered-resources` | **Complete Resource Discovery**: Validates Config tracking all AWS resources | Resource Inventory |
| `aws resourcegroupstaggingapi get-resources` | **Tagged Resource Validation**: Confirms resources properly tagged for tracking | Resource Tagging |
| `aws ec2 describe-instances` | **Compute Inventory**: Validates compute resource tracking | Compute Tracking |
| `aws s3api list-buckets` | **Storage Inventory**: Confirms storage resource tracking | Storage Tracking |
| `aws rds describe-db-instances` | **Database Inventory**: Validates database resource tracking | Database Tracking |
| `aws lambda list-functions` | **Serverless Inventory**: Confirms serverless resource tracking | Serverless Tracking |
| `aws inspector2 list-coverage` | **Software Inventory**: Validates Inspector tracking software packages on resources | Software Tracking |

**Technical Coverage Assessment**: **HIGH COVERAGE**
- ✅ Multi-resource type coverage
- ✅ Automated inventory validation
- ✅ Software package tracking
- ✅ Comprehensive discovery

**Graduated Score Calculation**: Config inventory (2), resource tagging (2), compute tracking (2), storage tracking (2), database tracking (2), serverless tracking (1), software inventory (2). Maximum 13 points.

---

### **KSI-PIY-02: Have policies outlining security objectives of all information resources** *(Low Coverage)*

**Security Objective**: Security policy documentation validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws organizations list-policies` | **Organizational Policies**: Validates service control policies defining security boundaries | Policy Infrastructure |
| `evidence_check` | **Security Policy Documentation**: Validates security policies, objectives, and standards | Policy Documentation |

**Technical Coverage Assessment**: **LOW COVERAGE**
- ✅ Organizational policy infrastructure
- ⚠️ Primary reliance on documented security policies

**Graduated Score Calculation**: Organizational policies present (3), security policy documentation (7). Maximum 10 points.

---

### **KSI-PIY-03: Maintain a vulnerability disclosure program** *(Low Coverage)*

**Security Objective**: Vulnerability disclosure program validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `evidence_check` | **VDP Documentation**: Validates vulnerability disclosure policies, procedures, and program governance | Program Documentation |

**Technical Coverage Assessment**: **LOW COVERAGE**
- ⚠️ Complete reliance on documented disclosure program

**Graduated Score Calculation**: VDP documentation complete (10). Maximum 10 points.

---

### **KSI-PIY-04: Build security considerations into SDLC and align with CISA Secure By Design principles** *(Medium Coverage)*

**Security Objective**: Secure development lifecycle validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `aws codecommit list-repositories` | **Code Repository Analysis**: Validates code repositories for secure development practices | Development Security |
| `evidence_check` | **SDLC Documentation**: Validates secure SDLC procedures and CISA alignment documentation | Development Documentation |

**Technical Coverage Assessment**: **MEDIUM COVERAGE**
- ✅ Development infrastructure validation
- ✅ Secure development documentation
- ⚠️ Limited to AWS CodeCommit repositories

**Graduated Score Calculation**: CodeCommit repositories (4), SDLC documentation (6). Maximum 10 points.

---

### **KSI-PIY-05: Document methods used to evaluate information resource implementations** *(Low Coverage)*

**Security Objective**: Evaluation methodology documentation validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `evidence_check` | **Evaluation Methodology Documentation**: Validates security assessment procedures, implementation review processes, and evaluation framework standards | Methodology Documentation |

**Technical Coverage Assessment**: **LOW COVERAGE**
- ⚠️ Complete reliance on documented evaluation methods

**Graduated Score Calculation**: Evaluation methodology documentation complete (10). Maximum 10 points.

---

### **KSI-PIY-06: Have dedicated staff and budget for security with executive support** *(Low Coverage)*

**Security Objective**: Security organization and resource validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `evidence_check` | **Security Organization Documentation**: Validates organizational charts, budget allocation evidence, executive security charters, and governance structure documentation | Organization Documentation |

**Technical Coverage Assessment**: **LOW COVERAGE**
- ⚠️ Complete reliance on documented organizational structure

**Graduated Score Calculation**: Security organization documentation complete (10). Maximum 10 points.

---

### **KSI-PIY-07: Document risk management decisions for software supply chain security** *(Low Coverage)*

**Security Objective**: Supply chain risk management documentation validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `evidence_check` | **Supply Chain Risk Documentation**: Validates vendor security assessments, software supply chain policies, and risk management decision frameworks | Risk Documentation |

**Technical Coverage Assessment**: **LOW COVERAGE**
- ⚠️ Complete reliance on documented risk management decisions

**Graduated Score Calculation**: Supply chain risk documentation complete (10). Maximum 10 points.

---

## **Cybersecurity Education (3/3 KSIs - Complete Low Coverage)**

### **KSI-CED-01: Ensure all employees receive security awareness training** *(Low Coverage)*

**Security Objective**: Security awareness training program validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `evidence_check` | **Training Documentation**: Validates security awareness training programs, completion records, training materials, and annual training schedules | Training Documentation |

**Technical Coverage Assessment**: **LOW COVERAGE**
- ⚠️ Complete reliance on documented training program

**Graduated Score Calculation**: Training documentation complete (10). Maximum 10 points.

---

### **KSI-CED-02: Require role-specific training for high risk roles, including privileged access** *(Low Coverage)*

**Security Objective**: Role-specific security training validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `evidence_check` | **Role-Specific Training Documentation**: Validates privileged access training, training matrices, specialized cybersecurity curricula, and training completion records | Training Documentation |

**Technical Coverage Assessment**: **LOW COVERAGE**
- ⚠️ Complete reliance on documented role-specific training

**Graduated Score Calculation**: Role-specific training documentation complete (10). Maximum 10 points.

---

### **KSI-CED-03: Security culture and continuous improvement** *(New Phase 2 KSI, Low Coverage)*

**Security Objective**: Security culture and improvement program validation

| Command | Technical Justification | Coverage Area |
|---------|------------------------|---------------|
| `evidence_check` | **Security Culture Documentation**: Validates security culture initiatives, continuous improvement programs, metrics tracking, and cultural assessment evidence | Culture Documentation |

**Technical Coverage Assessment**: **LOW COVERAGE**
- ⚠️ Complete reliance on documented security culture program

**Graduated Score Calculation**: Security culture documentation complete (10). Maximum 10 points.

---

## ✅ **Assessment Authority and Methodology Validation**

**Technical Validation**: All 53 KSIs (48 base + 5 MODERATE-only) and their associated CLI commands have been independently verified by Fortreum, LLC (accredited 3PAO) as technically sound and appropriate for their respective security control requirements.

**Coverage Appropriateness**: The coverage levels (High/Medium/Low) align with the technical vs procedural nature of each KSI, ensuring optimal validation approaches while maintaining comprehensive security control coverage.

**Impact Level Adaptation**: The graduated scoring and Impact Level Adapter system enables dynamic threshold adjustment based on FedRAMP impact level, supporting LOW, MODERATE, and HIGH impact systems from a single validation codebase.

**Methodology Authority**: This comprehensive technical approach was developed in coordination with Fortreum, LLC and validated through the official FedRAMP 20x Phase Two assessment process.

**Continuous Validation**: All technical commands execute through automated GitHub Actions pipeline with results published to public trust center, ensuring ongoing methodology effectiveness and technical accuracy.

---

**Document Authority**: Meridian Knowledge Solutions, LLC  
**Version**: 4.0 - Phase Two Moderate - October 2025  
**Document ID**: MKS-KSI-CMD-METHODOLOGY-PHASE2-004  
**Status**: Complete Technical Reference - All 53 MODERATE KSIs with Impact Level Adapter  
**Revision Control**: Official Phase 2 methodology documentation with graduated scoring and comprehensive command validation
