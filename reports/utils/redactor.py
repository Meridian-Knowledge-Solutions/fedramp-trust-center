"""
Data Redactor for FedRAMP Public Reports
=========================================
Redacts sensitive information (AWS account IDs, IP addresses,
internal hostnames, ARNs, etc.) from reports before public sharing.

Complies with FRR-CCM-06 (No irresponsible disclosure).
"""

import re


class DataRedactor:
    """Redacts sensitive data from strings and nested data structures."""

    PATTERNS = [
        # AWS Account IDs (12 digits)
        (re.compile(r"\b\d{12}\b"), "[AWS-ACCOUNT-REDACTED]"),
        # AWS ARNs
        (re.compile(r"arn:aws[a-zA-Z-]*:[a-zA-Z0-9-]+:[a-z0-9-]*:\d{12}:[^\s,\"']+"), "[ARN-REDACTED]"),
        # Private IP addresses (10.x, 172.16-31.x, 192.168.x)
        (re.compile(r"\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"), "[PRIVATE-IP-REDACTED]"),
        (re.compile(r"\b172\.(1[6-9]|2[0-9]|3[01])\.\d{1,3}\.\d{1,3}\b"), "[PRIVATE-IP-REDACTED]"),
        (re.compile(r"\b192\.168\.\d{1,3}\.\d{1,3}\b"), "[PRIVATE-IP-REDACTED]"),
        # AWS instance IDs
        (re.compile(r"\bi-[0-9a-f]{8,17}\b"), "[INSTANCE-REDACTED]"),
        # AWS security group IDs
        (re.compile(r"\bsg-[0-9a-f]{8,17}\b"), "[SG-REDACTED]"),
        # AWS VPC IDs
        (re.compile(r"\bvpc-[0-9a-f]{8,17}\b"), "[VPC-REDACTED]"),
        # AWS subnet IDs
        (re.compile(r"\bsubnet-[0-9a-f]{8,17}\b"), "[SUBNET-REDACTED]"),
        # AWS AMI IDs
        (re.compile(r"\bami-[0-9a-f]{8,17}\b"), "[AMI-REDACTED]"),
        # Internal hostnames
        (re.compile(r"\bip-\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}\b"), "[HOST-REDACTED]"),
    ]

    def redact(self, text):
        """Redact sensitive patterns from a string."""
        if not isinstance(text, str):
            return text
        for pattern, replacement in self.PATTERNS:
            text = pattern.sub(replacement, text)
        return text

    def redact_dict(self, data):
        """Recursively redact all string values in a dict/list structure."""
        if isinstance(data, dict):
            return {k: self.redact_dict(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self.redact_dict(item) for item in data]
        elif isinstance(data, str):
            return self.redact(data)
        return data
