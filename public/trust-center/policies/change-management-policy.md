# Change Management Policy

## 1. Objective
To ensure all modifications to the cloud environment are authorized, tested, and audited.

## 2. Change Logging
* **API Activity:** All modifications to AWS resources (API Write events) are logged via **AWS CloudTrail**.
* **Configuration State:** All resource configuration changes are recorded via **AWS Config**.

## 3. Change Authorization
* **Standard Changes:** Pre-approved low-risk changes (e.g., auto-scaling actions).
* **Normal Changes:** Require peer review (Pull Request) and automated testing (CI/CD).
* **Emergency Changes:** Require post-implementation review within 24 hours.

## 4. Monitoring
* Alerts are triggered for unauthorized changes (e.g., Security Group 0.0.0.0/0 open) via CloudWatch and SNS.