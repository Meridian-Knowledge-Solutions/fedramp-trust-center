# Using Cryptographic Modules (UCM) - Compliance Documentation

**Cloud Service Offering:** Meridian Knowledge Solutions Learning Management System  
**FedRAMP Authorization Level:** Moderate  
**Standard:** FRR-UCM (Release 25.11A)  
**Last Updated:** 2025-11-19  
**Status:** Compliant - AWS Native Cryptography

## Executive Summary

This document fulfills the FedRAMP 20x Using Cryptographic Modules (UCM) policy requirements by documenting all cryptographic modules used to protect federal customer data within the Meridian LMS cloud service offering. All cryptographic services are provided natively by AWS using FIPS 140-2 validated cryptographic modules or update streams thereof.

## Compliance Status

| Requirement     | Level        | Status     | Implementation |
|-----------------|--------------|------------|----------------|
| FRR-UCM-01      | MUST (Moderate)   | 100% | Comprehensive cryptographic module documentation provided below |
| FRR-UCM-02      | SHOULD (Moderate) | 100% | Agency tenants use AWS FIPS-validated modules by default |
| FRR-UCM-03      | SHOULD (Moderate) | 100% | All federal customer data protected with FIPS-validated AWS modules |

---

## 1. Transport Layer Security (Data in Transit)

### 1.1 AWS Application Load Balancer (ALB)

**Cryptographic Module:** AWS Elastic Load Balancing  
**Validation Status:** FIPS 140-2 validated OpenSSL implementation  
**Use Case:** Primary entry point for all federal employee access

**Implementation Details**
- **Protocol:** TLS 1.2 and TLS 1.3 (TLS 1.0/1.1 disabled)  
- **Cipher Suites:** FIPS-compliant (e.g., `TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384`, `TLS_AES_256_GCM_SHA384`)  
- **Certificate Management:** AWS Certificate Manager (ACM)  
- **Perfect Forward Secrecy:** Enabled  

**Federal Customer Data Protected**
- Authentication credentials  
- SAML assertions from Okta Federal Gov  
- Training data and user interactions  
- API requests and responses  

**FedRAMP Controls:** KSI-IAM-01, KSI-IAM-02, KSI-SVC-02

### 1.2 AWS Certificate Manager (ACM)

**Cryptographic Module:** AWS Certificate Manager  
**Validation Status:** Uses AWS's FIPS-validated cryptographic libraries  
**Use Case:** SSL/TLS certificate management for all HTTPS endpoints

**Implementation Details**
- Private keys stored in FIPS 140-2 Level 2+ HSMs  
- Automatic renewal enabled  

**FedRAMP Controls:** KSI-SVC-02, KSI-IAM-03

### 1.3 Amazon CloudFront (Optional CDN)

**Cryptographic Module:** Amazon CloudFront  
**Validation Status:** FIPS 140-2 validated TLS implementation  
**Note:** Not currently active but supported in the architecture.

**FedRAMP Controls:** KSI-SVC-02

---

## 2. Data at Rest Encryption

### 2.1 AWS Key Management Service (KMS)

**Cryptographic Module:** AWS Key Management Service  
**Validation Status:** FIPS 140-2 Level 2  
**Certificate Number:** #4523 and update streams  
**Use Case:** Master key management for all AWS encryption services

**Implementation Details**
- Customer Managed Keys (CMKs)  
- Automatic annual key rotation  
- Keys generated in FIPS Level 2 HSMs  
- AES-256-GCM for data encryption  

**Services Protected**
- Amazon RDS SQL Server  
- Amazon S3  
- Amazon EBS  
- AWS Secrets Manager  

**Federal Customer Data Protected**
- Training records and user profiles  
- Federal employee PII  
- Authentication credentials and API keys  

**FedRAMP Controls:** KSI-SVC-03, KSI-IAM-04, KSI-PIY-01

### 2.2 Amazon RDS for SQL Server

**Cryptographic Module:** AWS RDS with Transparent Data Encryption (TDE)  
**Validation Status:** Uses AWS KMS (FIPS 140-2 validated)  
**Encryption Algorithm:** AES-256-GCM  

**Implementation Details**
- TDE enabled  
- Customer Managed KMS keys  

**FedRAMP Controls:** KSI-SVC-03, KSI-MLA-01

### 2.3 Amazon S3 Standard Storage

**Cryptographic Module:** Amazon S3 SSE-KMS  
**Validation Status:** FIPS 140-2 validated  
**Encryption Type:** SSE-KMS  
**Bucket Policy:** Denies unencrypted PUTs  

**FedRAMP Controls:** KSI-SVC-03, KSI-SVC-05

### 2.4 Amazon FSx for Windows File Server

**Cryptographic Module:** Amazon FSx  
**Validation Status:** FIPS 140-2 validated via KMS  
**Encryption in Transit:** SMB 3.0  

**FedRAMP Controls:** KSI-SVC-03, KSI-SVC-01, KSI-TPR-03

### 2.5 Amazon EBS

**Cryptographic Module:** Amazon EBS Encryption  
**Validation Status:** FIPS 140-2 validated  
**Implementation:** Default encryption enabled  

**FedRAMP Controls:** KSI-SVC-03, KSI-MLA-01

### 2.6 Amazon ElastiCache (Redis)

**Cryptographic Module:** ElastiCache encryption  
**Validation Status:** KMS-derived FIPS keys  
**Implementation:** TLS 1.2+, at-rest encryption  

**FedRAMP Controls:** KSI-SVC-03, KSI-IAM-05

### 2.7 AWS Secrets Manager

**Cryptographic Module:** Secrets Manager  
**Validation Status:** FIPS 140-2 validated (via KMS)  
**Use Case:** Credential storage  

**Implementation:** Automatic rotation for database credentials  

**FedRAMP Controls:** KSI-IAM-04, KSI-SVC-01

### 2.8 AWS Backup

**Cryptographic Module:** AWS Backup  
**Validation Status:** FIPS 140-2 validated  
**Retention:** 7 years  

**FedRAMP Controls:** KSI-SVC-03, KSI-INR-03

---

## 3. Authentication & Identity Services

### 3.1 Okta Federal Government Cloud

**Cryptographic Module:** Okta Fed Gov  
**Validation Status:** FIPS 140-2 Level 3  
**Use Case:** Identity federation  

**Implementation Details**
- PIV/CAC validation  
- SAML encrypted with RSA-2048 / AES-256  

**FedRAMP Controls:** KSI-IAM-01, KSI-IAM-03, KSI-SVC-02

---

## 4. Monitoring & Audit Services

### 4.1 AWS CloudTrail

**Cryptographic Module:** CloudTrail with S3 SSE-KMS  
**Validation Status:** FIPS 140-2 validated via KMS  
**Integrity:** SHA-256 digest  

**FedRAMP Controls:** KSI-MLA-01, KSI-MLA-03

### 4.2 Amazon CloudWatch Logs

**Cryptographic Module:** CloudWatch Logs  
**Validation Status:** FIPS 140-2 validated  
**Implementation:** CMK-encrypted log groups  

**FedRAMP Controls:** KSI-MLA-01, KSI-MLA-04

---

## 5. Application-Level Cryptography

### 5.1 JWT Token Authentication

**Cryptographic Module:** .NET Core Crypto (Windows CNG)  
**Validation Status:** FIPS 140-2 validated  
**Algorithm:** RS256  
**Key Storage:** Secrets Manager  

**FedRAMP Controls:** KSI-IAM-04, KSI-IAM-05

### 5.2 SAML 2.0 Integration

**Cryptographic Module:** .NET SAML2 (Windows CNG)  
**Validation Status:** FIPS 140-2 validated  
**Encryption Algorithm:** AES-256-CBC  

**FedRAMP Controls:** KSI-IAM-01, KSI-IAM-03

---

## 6. Third-Party Integration Security