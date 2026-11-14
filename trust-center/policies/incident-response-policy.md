# Incident Response Policy

**Document ID:** POL-IR-001
**Effective Date:** January 15, 2026
**Last Reviewed:** March 1, 2026
**Classification:** Public

## 1. Purpose

This policy defines the incident response framework for Meridian LMS, ensuring timely detection, containment, eradication, and recovery from security incidents per FedRAMP IR control family requirements.

## 2. Scope

This policy covers all security events and incidents affecting Meridian LMS infrastructure, applications, and data within the FedRAMP authorization boundary.

## 3. Incident Classification

| Severity | Description | Response Time | Escalation |
|----------|-------------|---------------|------------|
| Critical | Active breach, data exfiltration | 15 minutes | CISO + FedRAMP PMO |
| High | Confirmed intrusion, malware | 1 hour | Security Lead |
| Medium | Suspicious activity, policy violation | 4 hours | Security Analyst |
| Low | Failed attempts, minor anomalies | 24 hours | Logged and reviewed |

## 3. Detection and Reporting

### 3.1 Detection Sources (IR-4)
- SIEM continuous monitoring with automated alerting
- Intrusion detection/prevention systems (IDS/IPS)
- Endpoint detection and response (EDR)
- User-reported incidents via security hotline
- Automated vulnerability scanning results

### 3.2 Reporting Requirements (IR-6)
- All incidents reported to US-CERT within required timelines
- FedRAMP PMO notified for incidents affecting authorization boundary
- Affected agency POCs notified within 1 hour of confirmation

## 4. Response Procedures

### 4.1 Containment
- Immediate isolation of affected systems
- Preservation of forensic evidence
- Communication to stakeholders per escalation matrix

### 4.2 Eradication and Recovery
- Root cause analysis completed within 72 hours
- Remediation validated through independent verification
- Systems restored from known-good baselines

### 4.3 Post-Incident Review (IR-4)
- Lessons learned documented within 5 business days
- Policy and procedure updates as needed
- Training updates based on incident patterns

## 5. Compliance

This policy supports FedRAMP controls: IR-1 through IR-10, SI-4, AU-6.
