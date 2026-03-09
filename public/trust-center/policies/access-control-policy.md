# Access Control Policy

**Document ID:** POL-AC-001
**Effective Date:** January 15, 2026
**Last Reviewed:** March 1, 2026
**Classification:** Public

## 1. Purpose

This policy establishes requirements for managing user access to Meridian LMS information systems in accordance with FedRAMP Moderate baseline controls (AC family).

## 2. Scope

This policy applies to all personnel, contractors, and third-party users who access Meridian LMS production and staging environments.

## 3. Access Management Requirements

### 3.1 Account Management (AC-2)
- All user accounts require formal authorization prior to creation
- Accounts are reviewed quarterly for continued business need
- Inactive accounts are disabled after 90 days of inactivity
- Emergency access procedures require two-person authorization

### 3.2 Access Enforcement (AC-3)
- Role-based access control (RBAC) is enforced at all system boundaries
- Least privilege principle applies to all account assignments
- Privileged access requires separate credentials and MFA

### 3.3 Separation of Duties (AC-5)
- Development and production access are segregated
- No single individual may approve and deploy changes
- Database administrative access requires separate authorization

### 3.4 Remote Access (AC-17)
- All remote access requires VPN with MFA authentication
- Remote sessions are encrypted using FIPS 140-2 validated modules
- Remote access is logged and monitored in real-time

## 4. Authentication Requirements

- Multi-factor authentication (MFA) is required for all privileged access
- Password complexity: minimum 16 characters, mixed case, numbers, special characters
- Session timeout: 15 minutes of inactivity
- Failed login lockout: 3 consecutive failures

## 5. Compliance

This policy supports the following FedRAMP controls: AC-1 through AC-22, IA-1 through IA-8.

## 6. Review Cycle

This policy is reviewed annually or upon significant system changes, whichever occurs first.
