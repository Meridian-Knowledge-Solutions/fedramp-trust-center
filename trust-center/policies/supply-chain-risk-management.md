# Supply Chain Risk Management Policy

## 1. Purpose

This policy establishes the framework for identifying, assessing, and mitigating risks associated with Meridian Knowledge Solutions' supply chain. The goal is to protect Meridian and its customers from security threats, vulnerabilities, and disruptions originating from third-party vendors, suppliers, and software components.

---

## 2. Scope

This policy applies to all external resources that support Meridian's services and product development, including:

* **Software Components:** Third-party and open-source software (OSS) libraries, modules, and dependencies integrated into Meridian's products.
* **Third-Party Services:** Vendors and service providers that process, store, or transmit Meridian data, or provide critical business functions (e.g., hosting, payment processing, support systems).
* **Hardware & Infrastructure:** Physical or virtual hardware (servers, network devices) procured from external suppliers.

---

## 3. Risk Management Activities

Meridian manages supply chain risk through the following key activities:

### 3.1. Vendor & Supplier Onboarding

Before engaging a new vendor or supplier for a critical function, a due diligence review is performed. This may include:

* Reviewing the vendor's security policies, practices, and public-facing security information.
* Ensuring that contracts and service level agreements (SLAs) include clear security requirements, confidentiality clauses, and breach notification responsibilities.
* Assessing the criticality of the vendor to determine the level of review required.

### 3.2. Software Supply Chain Security

Managing the security of third-party code is critical to our product's integrity.

* **Component Scanning:** As part of our development lifecycle, we use Software Composition Analysis (SCA) tools to identify third-party and open-source components and their known vulnerabilities (CVEs).
* **Vulnerability Management:** Discovered vulnerabilities are tracked, assessed, and prioritized for remediation based on severity and impact.
* **Inventory:** We maintain awareness of the third-party components used in our products to enable rapid response if a new vulnerability is discovered.

### 3.3. Ongoing Monitoring

* **Vulnerability Monitoring:** We monitor security feeds and alerts for new, high-impact vulnerabilities (e.g., Log4j, Heartbleed) that may affect our software or our critical vendors.
* **Vendor Review:** Critical vendors are periodically reviewed to ensure they continue to meet our security requirements.

---

## 4. Supply Chain Incident Response

In the event of a security breach or a critical vulnerability originating from our supply chain:

1.  The issue will be managed according to the Meridian Incident Response Plan.
2.  Immediate steps will be taken to identify all affected products and systems.
3.  Impact will be assessed, and remediation (e.g., patching, disabling a service) will be prioritized.
4.  Communication with affected customers will be handled in accordance with the Incident Response Plan and contractual obligations.

---

## 5. Roles and Responsibilities

* **Engineering:** Responsible for implementing SCA scanning, maintaining an inventory of software components, and remediating identified vulnerabilities.
* **Security Team:** Responsible for policy oversight, monitoring vulnerability feeds, and assisting with vendor risk assessments.
* **Procurement / Legal:** Responsible for conducting vendor due diligence and ensuring contracts contain appropriate security and legal protections.
* **Management:** Responsible for providing resources and enforcing this policy.

---

## 6. Policy Review

This policy will be reviewed at least annually, or upon significant changes to the technology environment or business, to ensure its ongoing effectiveness.