# Information Resource Evaluation Methodology

## 1. Purpose

This document outlines the methods used by Meridian Knowledge Solutions to evaluate, test, and approve new information resource implementations and major upgrades before deployment. This methodology ensures that all new systems and significant changes are functional, secure, and compliant with established requirements before being placed into operation.

This document supports the requirements specified in control **KSI-PIY-05**.

---

## 2. Applicability

This methodology applies to:

* **New system deployments:** Any new server, application, or network infrastructure.
* **Major version releases:** Significant software upgrades that introduce new functionality or architectural changes (e.g., planned waterfall releases).
* **Significant configuration changes:** System-level changes that impact the security posture or core function of a resource.

---

## 3. Evaluation Methods

Prior to a "Go-Live" production deployment, all applicable information resources undergo a multi-phased evaluation process.

### 3.1. Development & Security Testing

This phase focuses on code-level and application-specific security.

* **Static Application Security Testing (SAST):** Automated tools are used to scan source code for potential security flaws and coding standard violations before the code is compiled.
* **Peer Code Reviews:** Developers review each other's code for logic, adherence to standards, and potential security oversights that automated tools may miss.
* **Third-Party Component Scans:** All new third-party libraries and components are scanned for known vulnerabilities (CVEs).

### 3.2. Pre-Production Testing (Staging Environment)

Once deployed to a dedicated test/staging environment, the system is evaluated as a whole.

* **Vulnerability Scanning:** The new or updated system (servers, web applications) is scanned with authorized vulnerability scanning tools to identify misconfigurations, missing patches, and known vulnerabilities.
* **Functional & Regression Testing:** A formal Quality Assurance (QA) process validates that the system functions as specified in the requirements. Regression testing ensures that new changes have not broken existing functionality.
* **Dynamic Application SecurityTesting (DAST):** (If applicable) The running application is tested for common web application vulnerabilities (e.g., XSS, SQLi, insecure direct object references).

### 3.3. Configuration & Hardening Review

Before deployment, the system's configuration is verified against established security baselines.

* **Baseline Verification:** System administrators verify that the resource's configuration (e.g., operating system, database, web server) meets Meridian's defined hardening baselines (e.g., CIS Benchmarks or STIGs).
* **Documentation Review:** All relevant documentation (e.g., architecture diagrams, data flows, administrative guides) is updated to reflect the new implementation.

### 3.4. Final Acceptance

* **User Acceptance Testing (UAT):** Key stakeholders or business owners perform UAT to confirm that the system meets business requirements and is ready for production.
* **Go/No-Go Release Review:** Management and technical leadership conduct a final review of all test reports (QA, security scans, UAT sign-off). A formal "Go" decision is required from the Change Control Board (CCB) to proceed with the production release.

---

## 4. Documenting Evaluation Results

All evaluation activities and their results are documented and stored. This documentation provides evidence of testing and serves as the artifact for release approval.

Records include:

* SAST and component scan reports.
* Vulnerability scan results (and remediation tickets).
* QA test plans and results.
* UAT sign-off forms.
* Formal CCB change request and approval.

---

## 5. Document Review

This methodology is reviewed at least annually, or upon significant changes to the release process, to ensure its continued relevance and effectiveness.