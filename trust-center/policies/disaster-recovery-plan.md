# Disaster Recovery (DR) Plan

## 1. Service Level Objectives
To balance cost efficiency with business continuity, we have defined the following objectives for standard production workloads:

### Recovery Point Objective (RPO): 24 Hours
* **Definition:** The maximum acceptable data loss is 24 hours.
* **Alignment Strategy:** We enforce **Daily Automated Snapshots** on all stateful resources (RDS, S3, EBS) via AWS Backup. This ensures we can always restore to a point within the last 24 hours.

### Recovery Time Objective (RTO): 4 Hours
* **Definition:** Services must be restored and available to users within 4 hours of disaster declaration.
* **Alignment Strategy:**
    * **Infrastructure:** Defined as Code (Terraform) for rapid redeployment (< 1 hour).
    * **Data:** RDS Snapshots are sized to ensure restoration completes within the 4-hour window.
    * **Traffic:** DNS Failover (Route53) propagates within 60 seconds.

## 2. Backup Schedules
| Resource Type | Frequency | Retention | Supporting RPO |
| :--- | :--- | :--- | :--- |
| **RDS (Database)** | Daily (00:00 UTC) | 30 Days | 24 Hours |
| **S3 (Assets)** | Continuous (Versioning) | Indefinite | ~0 Seconds |
| **EBS (Volumes)** | Daily (00:00 UTC) | 30 Days | 24 Hours |

## 3. Recovery Procedure
1.  **Assessment:** Verify the primary region is down.
2.  **Execution:** Trigger the `dr-restore` pipeline in the secondary region.
3.  **Restoration:** AWS Backup restores the latest daily snapshot.
4.  **Verification:** Smoke tests confirm application connectivity.
5.  **Cutover:** Update Route53 DNS to point to the new Load Balancer.