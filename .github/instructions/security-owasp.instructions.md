---
applyTo: '**'
description: 'OWASP Top 10 2025 security compliance instructions for ClaimTrace JKN, including injection prevention, security headers, rate limiting, and tamper-proof audit trails.'
---

# OWASP Top 10 2025 Security Instructions for ClaimTrace JKN

## A01: Broken Access Control
- Validate caller roles on every protected endpoint using `require_adjudicator`, `require_admin`, or `require_reader`.
- Enforce ownership and hospital jurisdiction boundaries on claim review actions.

## A02: Security Misconfiguration
- Maintain full HTTP security headers via `SecurityHeadersMiddleware`.
- Never expose stack traces or debug information in production API responses.
- Restrict CORS origins strictly to authorized cockpit hosts.

## A03: Software Supply Chain Failures
- Keep dependencies locked via lockfiles (`package-lock.json`, `requirements.txt`).
- Never introduce unverified third-party libraries into core adjudication paths.

## A04: Cryptographic Failures
- Protect sensitive patient data (NIK, BPJS card number, diagnosis details) in transit and at rest.
- Never hardcode secrets, tokens, or encryption keys in source files.

## A05: Injection
- Always use parameterized queries in DuckDB and relational databases.
- Sanitize and validate all user inputs via Pydantic schemas.
- Prevent XSS by avoiding `dangerouslySetInnerHTML` in React components.

## A08: Software and Data Integrity Failures
- Maintain cryptographic hash chaining on audit log records (`AuditTrailManager`).
- Verify data authenticity before updating decision logs.

## A09: Security Logging and Alerting
- Log security events (authentication failures, authorization breaches, suspicious claim velocity) with timestamps and user identifiers.
- Mask PII in system logs while preserving forensic traceability.
