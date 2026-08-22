# Incident Response & Contingency Test Report (2025)

**Date:** 2025-06-20
**Scenario:** Ransomware / Data Corruption Simulation
**Objective:** Verify capability to restore a single compromised resource (Contingency Plan).

## 1. Test Scenario
* **Trigger:** An engineer accidentally deleted the `users` table in the staging database.
* **Incident Type:** Data Loss / Integrity Violation.

## 2. Recovery Actions
1.  **Detection:** Alert triggered via CloudWatch (RDS CPU Spike).
2.  **Containment:** Database write access suspended.
3.  **Eradication:** Vulnerable script identified.
4.  **Recovery:** Initiated AWS Backup Point-in-Time Restore (PITR) to 5 minutes prior to the event.

## 3. Results
* **Restore Time:** 25 Minutes.
* **Data Loss:** < 5 Minutes (Met RPO).
* **Outcome:** Successful restoration of service.

## 4. Conclusion
The team successfully demonstrated the capability to recover from a data corruption incident using standard AWS Backup procedures.