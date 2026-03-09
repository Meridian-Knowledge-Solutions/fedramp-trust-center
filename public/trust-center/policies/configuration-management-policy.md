# Configuration Management Policy

**Document ID:** POL-CM-001
**Effective Date:** January 15, 2026
**Last Reviewed:** March 1, 2026
**Classification:** Public

## 1. Purpose

This policy establishes baseline configuration management requirements for Meridian LMS, ensuring all system components maintain approved security configurations in accordance with the FedRAMP CM control family.

## 2. Scope

This policy applies to all hardware, software, firmware, and network components within the Meridian LMS FedRAMP authorization boundary.

## 3. Baseline Configuration (CM-2)

### 3.1 Configuration Standards
- All systems deployed from hardened, approved base images
- CIS Benchmarks applied as minimum configuration baselines
- STIG compliance required for all operating system components
- Container images scanned and signed before deployment

### 3.2 Configuration Monitoring
- Automated configuration drift detection runs every 4 hours
- Deviations from baseline trigger immediate alerts
- Monthly configuration audits performed by security team
- Quarterly third-party configuration assessments

## 4. Change Control (CM-3)

### 4.1 Change Process
1. Change request submitted with impact assessment
2. Security review for all changes affecting authorization boundary
3. Approval by Change Advisory Board (CAB)
4. Implementation in staging with validation testing
5. Production deployment with rollback plan
6. Post-implementation verification

### 4.2 Emergency Changes
- Emergency changes require verbal approval from two authorized personnel
- Documentation completed within 24 hours of implementation
- Post-emergency review conducted within 5 business days

## 5. Software Installation (CM-11)

- Only authorized software permitted on production systems
- Software inventory maintained and audited monthly
- Unauthorized software detected and removed within 24 hours
- All software validated against approved software list

## 6. Compliance

This policy supports FedRAMP controls: CM-1 through CM-11, SA-10, SI-7.
