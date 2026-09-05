# Secure Software Development Lifecycle (SDLC) Policy

## 1. Purpose

This policy establishes the requirements for integrating security into every phase of Meridian's software development lifecycle (SDLC). The goal is to ensure that all software developed for the FedRAMP environment is secure, resilient, and compliant with all applicable federal requirements.

## 2. Scope

This policy applies to all development, release, and patching activities for Meridian's Learning Management System (LMS) product hosted within the AWS GovCloud authorization boundary. It is mandatory for all internal teams (including Development, QA, and DevSecOps) and any contractors involved in the SDLC.

## 3. Roles and Responsibilities

* **Chief Product Officer (CPO):** Accountable for the overall SDLC process and the integration of security.
* **Development & DevSecOps Teams:** Responsible for implementing secure coding practices, running security tools, and remediating vulnerabilities.
* **QA Team:** Responsible for developing and executing security-focused test plans and validating security controls.
* **Product Managers:** Responsible for integrating security requirements and acceptance criteria into user stories.

---

## 4. Secure SDLC Phases

Meridian's SDLC process embeds security at every stage, from initial design to final deployment.

### Phase 1: Planning and Design

* **Risk Analysis:** All new features and initiatives are reviewed during backlog grooming to identify potential security implications, such as new attack surfaces or external integrations.
* **Security Requirements:** User stories must include specific security acceptance criteria, such as input validation requirements, secure session handling, and encryption.
* **Secure Design:** Threat modeling is performed on new, security-significant features. Secure architecture patterns (e.g., zero-trust, boundary controls) are applied.

### Phase 2: Secure Development

* **Secure Coding Standards:** Developers must adhere to OWASP Secure Coding Practices.
* **Static Code Analysis (SAST):** Developers are required to run SAST scans on their local branches and address any critical or high-severity vulnerabilities *before* submitting a pull request.
* **Peer Reviews:** All code undergoes a peer review, which includes a specific check for security gaps, adherence to least privilege, and secure API design.

### Phase 3: Automated Security Testing

* **CI/CD Pipeline Integration:** The automated CI/CD pipeline is configured to enforce multiple security checks, including:
    * Static Application Security Testing (SAST)
    * Dynamic Application Security Testing (DAST)
    * Open-Source Software (OSS) dependency scanning
    * Container security scanning (if applicable)
* **Vulnerability Management:** All findings are tracked via Jira.

### Phase 4: Test, Validation, and Integration

* **Security Test Plans:** The QA team develops and executes a security-focused test plan that includes functional, regression, and security-specific test cases.
* **Final Validation:** A final system-wide security validation and DAST scan are performed during the integration sprint. Secure configurations (e.g., FIPS-validated cryptography) are verified.
* **Release Readiness:** QA provides a final test report and security validation summary. A code freeze is implemented before the final release.

### Phase 5: Secure Deployment and Maintenance

* **Change Control:** All releases are reviewed and approved by the Product Change Control Board (CCB). Change records must include a risk assessment.
* **FedRAMP Alignment:** All post-deployment changes must follow FedRAMP CM-3 (Change Management) requirements.
* **Continuous Monitoring:** The SDLC process directly supports the Continuous Monitoring (ConMon) program by ensuring timely remediation of vulnerabilities and providing security artifacts (scan reports, test results) for audits.

---

## 5. Supporting Security Controls

### Security Training
All developers and QA personnel are required to complete annual secure coding training. This training covers the OWASP Top 10, FIPS 140-3 cryptography requirements, and API security. Training records are maintained for audit purposes.

### Cryptography Requirements
Only FIPS-validated or NSA-approved cryptographic modules may be used for encryption of data at rest, data in transit, API authentication, and secure session management.

### Compliance Monitoring
Compliance is monitored through:
* **Artifact Generation:** CI/CD pipelines generate and store security artifacts (scan reports, logs).
* **Vulnerability Tracking:** Jira is used to track all security findings, remediation efforts, and peer review approvals.
* **Audit Support:** All SDLC evidence is made available to FedRAMP auditors.
* 

---
## 🏁 Verification (Compliance Acknowledgement)
To confirm you have reviewed this Secure Software Development policy and agree to adhere to these standards, you must decode the token below and commit it to the developer register.

**Token (Base64):**
`REVWLVNFQy1PUFMtMjAyNS1DT0RFLVNBRkU=`

### Instructions:
1. Run `echo "TOKEN" | base64 --decode` to verify the flag.
2. Add your entry to `training/developer_register.json` in this repository via a Pull Request.