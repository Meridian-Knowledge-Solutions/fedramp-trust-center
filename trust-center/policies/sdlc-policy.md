# Secure Software Development Lifecycle (SDLC) Policy

**Organization:** Meridian Knowledge Solutions

**Effective Date:** 2/10/2025  
**Next Review Date:** 2/10/2026  
**Approved By:** Adam Burroughs

---

## Document Revision History

*[To be maintained with version control in CodeCommit]*

---

## Responsibility

**Chief Product Officer (CPO)**, Development Teams, QA, Project Managers, Designers, Technical Writers, Director of QA, Customer Response Team, DevSecOps Team.

---

## Scope

This policy governs the secure development of Meridian's Learning Management System ("LMS") software product, including all releases and patching activities within AWS GovCloud. It applies to internal teams and any contractors involved in the software development lifecycle (SDLC).

---

## Policy Overview

Meridian follows a formal SDLC process that embeds security into all phases of software development, release management, and post-release activities, aligning with FedRAMP Moderate Rev 5 requirements.

---

## SDLC Phases and Security Requirements

### 1. Inception & Backlog Collection

- Product Management maintains a prioritized feature backlog sourced from stakeholders, clients, and leadership.
- New initiatives are reviewed for potential security implications.

### 2. Feature Grooming & Risk Analysis

- Cross-functional meetings (CPO, Product Managers, QA Leads, Design Leads, Development Architects) are held.
- Security questions addressed:
  - Does this feature introduce new attack surfaces?
  - Does this feature require new external integrations (e.g., APIs)?
  - Are there compliance impacts (FedRAMP, NIST, etc.)?

### 3. Release Planning & Team Assignment

- Scrum teams are formed with defined security responsibilities.
- FedRAMP-related features or enhancements are flagged.
- CI/CD pipelines are configured to enforce security controls.

### 4. User Story Discovery

- Teams define user stories with embedded security acceptance criteria.
- Stories must specify:
  - Secure session handling.
  - Input validation requirements.
  - Encryption use where applicable.

### 5. Grooming & Secure Design

- All user stories are reviewed by Product Owners and DevSecOps for security gaps.
- Threat modeling is performed on new features.
- Secure architecture patterns (e.g., zero trust, boundary control) are applied.

### 6. Secure Development & Static Code Analysis

- Developers follow OWASP Secure Coding Practices.
- Developers must:
  - Execute SAST scans (e.g., SonarQube, Fortify) on local branches before code reviews.
  - Address critical/high vulnerabilities before submitting pull requests.
- Peer reviews include security verification (e.g., least privilege, secure API design).

### 7. Automated Security Testing (CI/CD)

Automated CI/CD pipelines enforce:

- SAST (Static Application Security Testing).
- DAST (Dynamic Application Security Testing).
- OSS dependency scans (e.g., OWASP Dependency-Check).
- Container security scans (if applicable).

### 8. Test Plan & Execution

- QA develops a security-focused test plan.
- Functional, regression, and security test cases are executed.
- All vulnerabilities are tracked via Jira or equivalent ticketing system.

### 9. Integration Sprint

- Final system-wide security validation.
- Secure configurations verified (e.g., FIPS-validated crypto, boundary protections).
- FedRAMP documentation updated (SSP, change management records).

### 10. Release Sprint

- Vulnerability testing (e.g., DAST) is completed.
- Final code freeze.
- QA delivers a final test report and security validation summary.

### 11. Secure Deployment & Change Control

- Releases are reviewed and approved by the Product CCB.
- Change records include risk assessments and mitigation actions.
- Any post-deployment changes follow FedRAMP CM-3 requirements.

---

## Security Awareness & Training

- All developers and QA personnel complete annual secure coding training (OWASP Top 10, FIPS 140-3 cryptography, API security).
- Training records are maintained for audit purposes.

---

## Cryptography Requirements

Only FIPS-validated or NSA-approved cryptography is used for:

- Data encryption (at rest and in transit).
- API authentication tokens.
- Secure session management.

**Compliance:** SC-12, SC-13, SC-28(1), SC-12(3), SC-17.

---

## Compliance Monitoring

- CI/CD pipelines generate security artifacts (scan reports, logs).
- Jira tracks:
  - Secure coding enforcement.
  - SAST/DAST findings and remediation.
  - Peer review approvals.
- FedRAMP auditors are provided access to SDLC evidence (release approvals, security test reports).

---

## Continuous Monitoring Alignment

The SDLC process integrates with the FedRAMP Continuous Monitoring (ConMon) program to ensure:

- Timely remediation of vulnerabilities.
- Secure development practices remain consistent.
- Post-release security events are addressed through change control.

---

**FedRAMP KSI Alignment:** This policy satisfies requirements for KSI-CMT-03 (Automated Testing and Validation).
