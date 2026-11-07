# Data Classification and Handling Policy

## 1. Purpose

This policy establishes the framework for classifying data and defines the minimum handling requirements to protect data within Meridian Knowledge Solutions' FedRAMP-authorized AWS environment. The objective is to ensure that all data is protected according to its sensitivity and in compliance with federal requirements.

---

## 2. Scope

This policy applies to all data stored, processed, or transmitted within the FedRAMP authorization boundary. It applies to all Meridian employees, contractors, and systems that interact with this data.

---

## 3. Policy Owner

The **Director of Federal Cybersecurity Operations** is responsible for the development, maintenance, and oversight of this policy.

---

## 4. Data Classification Levels

All data within the FedRAMP boundary must be classified into one of the following levels. By default, all customer data and system data within the boundary is treated as **CUI**.

* **Level 3: Controlled Unclassified Information (CUI)**
    * **Definition:** Sensitive information that requires safeguarding or dissemination controls pursuant to law, regulation, or government-wide policy.
    * **Examples:** All customer-uploaded data, personally identifiable information (PII), system configuration data, backups, and security logs.

* **Level 2: Internal**
    * **Definition:** Data that is not intended for public disclosure and is for internal Meridian use only. Its unauthorized disclosure could have a minor negative impact.
    * **Examples:** Internal operational guides, non-sensitive system documentation, and internal support tickets.

* **Level 1: Public**
    * **Definition:** Data that has been explicitly approved for public release.
    * **Examples:** Publicly-facing marketing materials or "help" articles.

---

## 5. Data Handling Requirements

The following handling requirements are the minimum baseline for all **CUI** and **Internal** data within the FedRAMP environment.

### 5.1. Encryption
* **At Rest:** All data stored at rest must be encrypted using FIPS 140-2 validated modules (e.g., AWS KMS, S3-SSE, EBS encryption).
* **In Transit:** All data transmitted over a network must be encrypted using FIPS-validated protocols (e.g., TLS 1.2 or higher).

### 5.2. Access Control
* Access to data is strictly enforced based on the principles of **least privilege** and **role-based access control (RBAC)**, using AWS IAM roles and policies.
* **Multi-Factor Authentication (MFA)** is mandatory for all personnel with administrative access to systems containing CUI.
* Public access to data storage (e.g., S3 buckets) is explicitly forbidden.

### 5.3. Logging and Monitoring
* All access to CUI, and all administrative actions, must be logged and monitored.
* AWS CloudTrail and other native logging tools are used to capture all API activity. Logs are protected from modification or deletion.

### 5.4. Data Disposal
* Data must be securely disposed of when no longer required for business or legal purposes, according to the data retention policy.
* Secure disposal is accomplished using AWS-native deletion mechanisms and cryptographic erasure (by deleting the encryption keys).

### 5.5. Data Labeling
* While data within the boundary is CUI by default, any CUI that is exported from the system (e.g., reports) must be appropriately labeled as CUI.

---

## 6. Roles and Responsibilities

* **Director of Federal Cybersecurity Operations:** Owns the policy and ensures its implementation.
* **System Administrators:** Implement and manage the technical controls (encryption, IAM policies, logging) required by this policy.
* **All Personnel:** Responsible for understanding and adhering to the handling requirements for any data they access.

---

## 7. Policy Review

This policy will be reviewed and approved at least **annually**, or upon any significant changes to the environment or security requirements.

---

## 8. Enforcement

Failure to comply with this policy may result in disciplinary action, up to and including removal of access and termination of employment.