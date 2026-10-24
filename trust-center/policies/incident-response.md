# Incident Response Policy

## 1. Purpose

This policy establishes the framework for detecting, reporting, and responding to security incidents within Meridian Knowledge Solutions' FedRAMP-authorized AWS environment. The goal is to ensure a timely, effective, and compliant response to minimize operational impact and protect organizational data.

## 2. Scope

This policy applies to all Meridian personnel (employees and contractors) and all information systems within the FedRAMP authorization boundary.

## 3. Policy Owner

The **Director of Federal Cybersecurity Operations** is the designated official responsible for owning, managing, and coordinating all incident response activities.

## 4. Roles and Responsibilities

* **Director of Federal Cybersecurity Operations:**
    * Owns and maintains this policy.
    * Acts as the primary incident coordinator for all reported incidents.
    * Manages all external communication and compliance reporting (e.g., to the FedRAMP PMO).
* **DevSecOps / Cloud Engineering:**
    * Act as primary technical responders for infrastructure incidents.
    * Perform technical containment, eradication, and recovery actions.
* **All Personnel:**
    * Responsible for **immediately** reporting any suspected or confirmed security incident or weakness using the designated internal channels (e.g., security Slack channel, high-priority ticket).

---

## 5. Incident Response Lifecycle

Meridian follows a streamlined process for managing security incidents.

### 5.1. Detection and Alerting
* Incidents are identified through automated monitoring and manual reporting.
* **Automated Tools:** AWS-native tools (e.g., AWS GuardDuty, Security Hub, CloudTrail) are used to monitor for and alert on anomalous behavior.
* **Manual Reporting:** All personnel are trained to identify and report potential incidents.

### 5.2. Reporting and Triage
* **Internal:** All suspected incidents are reported immediately via internal Slack and tracked in a JIRA ticket.
* **External:** Incidents impacting the FedRAMP environment will be reported to the FedRAMP PMO in accordance with federal requirements (e.g., within 1 hour of determination).
* **Triage:** The Incident Coordinator categorizes the incident's severity (High, Medium, Low) and assigns it to the appropriate technical responders.

### 5.3. Containment
* The primary goal is to limit the incident's impact and spread.
* Actions may include:
    * Deactivating IAM roles or access keys.
    * Modifying AWS Security Groups to isolate affected systems.
    * Taking snapshots of EC2 instances or databases for forensic analysis.

### 5.4. Eradication and Recovery
* **Root Cause Analysis (RCA):** The team identifies the root cause of the incident to prevent recurrence.
* **Eradication:** The root cause is eliminated (e.g., patching vulnerabilities, removing malicious code).
* **Recovery:** Systems are restored to a secure, operational state using AWS-native backups (e.g., RDS, S3) and secure deployment pipelines.

### 5.5. Post-Incident Review (Lessons Learned)
* After recovery, a post-incident review is conducted to document the incident, its impact, and the response actions.
* The team identifies "lessons learned" to update and improve security controls and this response plan.

---

## 6. Policy Review

This policy and its associated procedures will be reviewed and updated at least **annually**, or after any significant incident or major environmental change.

---
## 🚨 Annual Responder Acknowledgement
All members of the Incident Response Team must review this plan annually. To verify your readiness and understanding of these procedures, decode the token below and commit it to the IR/DR register.

**Token (Base64):**
`SVItRFItUkVBRFl-MjAyNS1SRVNQT05TRQ==`

### Instructions:
1. Run `echo "TOKEN" | base64 --decode` to verify the flag.
2. Add your entry to `training/ir_dr_register.json` via a Pull Request.