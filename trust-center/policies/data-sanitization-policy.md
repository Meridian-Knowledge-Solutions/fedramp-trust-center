# Data Sanitization & Destruction Policy

## 1. Residual Data Cleanup
* **Temporary Files:** All temporary objects in S3 (e.g., `tmp/`, `logs/`) are governed by Lifecycle Policies to auto-expire after 30 days.
* **Compute:** EC2 instances are terminated (not stopped) effectively wiping ephemeral storage.

## 2. Customer Data Destruction (Right to be Forgotten)
Upon a verified request to delete customer data:
1.  **Active Database:** The customer's tenant ID is used to perform a `DELETE` operation on the production RDS instance.
2.  **File Storage:** All objects tagged with the customer's ID in S3 are deleted.

## 3. Destruction from Backups (Crypto-Shredding)
* **Challenge:** Modifying immutable RDS snapshots to remove single records is technically infeasible.
* **Procedure:**
    * If the customer has a dedicated tenant KMS Key, that key is **scheduled for deletion**.
    * Once the key is deleted, all historical backups encrypted with that key become cryptographically unreadable, achieving effective destruction.
    * For shared-key environments, data remains in backups until the backup retention period (30 days) expires, at which point the backup is destroyed.