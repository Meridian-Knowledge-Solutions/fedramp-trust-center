# Access Control Policy

## 1. Purpose

This policy defines the requirements for managing, controlling, and monitoring access to Meridian Knowledge Solutions' FedRAMP-authorized AWS environment. The objective is to ensure that all systems and data are protected from unauthorized access by enforcing the principles of least privilege and separation of duties.

---

## 2. Scope

This policy applies to all Meridian employees, contractors, and any other personnel who are granted access to any system or service within the FedRAMP authorization boundary.

---

## 3. Roles and Responsibilities

* **Director of Federal Operations:** Serves as the Policy Owner. Responsible for approving this policy, overseeing its implementation, and managing all FedRAMP-related access controls.
* **System Administrators:** Responsible for implementing, managing, and monitoring access controls in accordance with this policy (e.g., configuring AWS IAM roles, groups, and policies).
* **All Users:** Responsible for protecting their credentials, using access only for authorized purposes, and reporting any suspected security incidents.

---

## 4. Account Management

All access to the environment must be managed according to the following principles:

* **Unique Identification:** All users must be uniquely identified. Shared or group accounts are prohibited.
* **Principle of Least Privilege:** Users will be granted the minimum level of access and permissions necessary to perform their assigned job functions.
* **Role-Based Access Control (RBAC):** Access is granted based on defined job roles (e.g., "System Administrator," "Developer," "Auditor") using AWS IAM Roles and policies.
* **Separation of Duties:** Access controls shall be configured to ensure that critical functions (e.g., development, testing, deployment) are separated among different individuals where possible.

---

## 5. Access Lifecycle

### 5.1. Account Creation
* Access is provisioned only after a formal, documented request is submitted and approved by management or the Director of Federal Operations.
* New users must complete all required security awareness training before access is granted.

### 5.2. Access Reviews
* All user accounts, roles, and permissions shall be reviewed at least **annually** to validate that access remains appropriate and necessary.
* Reviews shall also be triggered by any change in a user's role or employment status.

### 5.3. Account Disabling and Removal
* Access is disabled **immediately** upon the termination of an employee or contractor.
* Accounts for users who have transferred roles are reviewed and adjusted to reflect their new responsibilities immediately.
* All associated access keys and credentials are to be revoked or rotated.

---

## 6. Authentication Requirements

* **Multi-Factor Authentication (MFA):** MFA is mandatory for all users who require administrative (privileged) access to the AWS environment.
* **Password Complexity:** All passwords must meet or exceed FedRAMP-defined requirements for length, complexity, and history.

---

## 7. Monitoring and Session Control

* **Access Logging:** All access attempts (both successful and unsuccessful) to system components are logged and monitored (e.g., via AWS CloudTrail).
* **Log Reviews:** Access logs are reviewed regularly for anomalous or unauthorized activity.
* **Session Inactivity:** All user sessions will be automatically terminated or locked after a defined period of inactivity.

---

## 8. Policy Review

This policy will be reviewed, updated as necessary, and re-approved at least **annually** or upon any significant change to the environment.

---

## 9. Enforcement

Failure to comply with this policy may result in disciplinary action, up to and including removal of access and termination of employment.