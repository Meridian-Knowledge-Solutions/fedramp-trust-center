# Annual Disaster Recovery Test Report (2025)

**Date:** 2025-10-15
**Type:** Functional Drill (Tabletop + Single Resource Restore)
**Status:** Success

## 1. Executive Summary
The engineering team successfully validated the recovery capability for the `LMS-Prod` environment. We verified that we can restore the primary database within the defined RTO of 4 hours.

## 2. Test Scenario
* **Simulated Event:** Primary AWS Region (us-east-1) total outage.
* **Objective:** Restore the `saas` RDS instance to `us-west-2` using AWS Backup Cross-Region Copy.

## 3. Results
* **Backup Found:** Yes (Daily Snapshot from 00:00 UTC).
* **Restore Initiated:** 10:00 AM EST.
* **Restore Completed:** 10:45 AM EST.
* **Total Time:** 45 Minutes (Passes 4-Hour RTO).
* **Data Integrity:** Verified valid SQL connection to restored instance.

## 4. Lessons Learned
* **Success:** Cross-region copy is working automatically.
* **Issue:** The Terraform script for the new VPC took longer than expected to run.
* **Action Item:** Optimize the `dr-vpc.tf` script (JIRA-SEC-123).