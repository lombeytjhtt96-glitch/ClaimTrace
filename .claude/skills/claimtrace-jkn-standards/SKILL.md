---
name: claimtrace-jkn-standards
description: "Use when verifying BPJS claims or JKN fraud."
category: healthcare-security
---
# ClaimTrace JKN Standards

Enforces deterministic multi-signal fraud triage, WBS reporting, and immutable ledger governance.

## Verification Triangulation
- Calculate composite anomaly score using 50% S1 Radar, 30% S2 SATUSEHAT, and 20% S3 Mobile JKN.
- Green Path (score < 30): Fast-track approval within 24 hours.
- Yellow Path (30 <= score < 70): Request documentary clarification under 10-day SLA.
- Red Path (score >= 70): Immediate investigation and Wasrik referral.
- Detailed weighting and anomaly formulas: see references/triangulation-protocol.md.

## Whistleblowing System & Ledger
- Mask whistleblower data under UU PDP Pasal 34 and LPSK regulations.
- Enforce rate-limiting of 15 req/min and SHA-256 hash chaining on all reports.
- Detailed WBS governance and ticket tracking: see references/wbs-governance.md.
