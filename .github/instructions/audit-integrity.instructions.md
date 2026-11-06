---
applyTo: '**'
description: 'Audit integrity, evidence verification, and anti-rationalization guard instructions for ClaimTrace JKN fraud analysis.'
---

# Audit Integrity Instructions for ClaimTrace JKN

## Objective
Enforce intellectual honesty, evidence verification, and rigorous quality gates across all fraud detection analyses, claim verification rules, and automated reports.

## Core Rules

1. Evidence Grounding:
   - Every fraud anomaly (phantom billing, repeat billing, unbundling, upcoding, geovelocity violation) must cite concrete code locations, ICD-10 data points, tarip anomalies, or timestamp records.
   - Never generate hypothetical fraud verdicts without verified taint tracing.

2. Anti-Rationalization Guard:
   - Prohibit rationalizing away anomalies as "benign clinical variations" when objective rules (e.g. impossible geographic velocity, duplicate procedure billing within 48h) trigger red flags.
   - Maintain objective risk scoring based on codified multi-signal thresholds.

3. Quality Gate Threshold:
   - All audit summaries and reports must score >= 8/10 against the verification rubric:
     - Evidence citation accuracy: 10/10
     - Taint trace completeness: >= 8/10
     - Absence of speculative rationalizations: 10/10
     - Compliance with BPJS statutory SLAs: 10/10

4. Tamper Resistance:
   - Every adjudication decision (ACCEPT, REJECT, PENDING_INVESTIGATION) must be appended to the immutable audit ledger with cryptographic verification.
