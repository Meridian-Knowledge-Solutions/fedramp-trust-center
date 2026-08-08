# Encryption Policy (Data in Transit)

## 1. Public Ingress
* **Protocol:** All public traffic must use **HTTPS (TLS 1.2 or higher)**.
* **Redirection:** HTTP (80) must redirect to HTTPS (443).
* **Certificates:** All public endpoints must use valid certificates managed by AWS ACM.

## 2. Internal Traffic
* **Service-to-Service:** Traffic between microservices should be encrypted where feasible (e.g., Service Mesh or TLS).
* **Database:** Connections to RDS must use SSL/TLS.

## 3. Algorithms
* **Approved:** AES-256, RSA-2048, SHA-256.
* **Prohibited:** SSLv3, TLS 1.0, TLS 1.1, RC4, MD5.