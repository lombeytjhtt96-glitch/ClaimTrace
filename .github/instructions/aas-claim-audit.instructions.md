---
name: aas-claim-audit
description: Atomic predicate verification and anti-deception audit doctrine inspired by agentic-awesome-skills v20.6.0.
apply_to:
  - backend/app/engine/evidence_chain.py
  - backend/app/main.py
  - app/src/components/audit/
---

# Agentic Awesome Skills (AAS) Claim Audit Doctrine

Standardized against sickn33/agentic-awesome-skills v20.6.0 (`audit-agent-run-evidence`, `anti-deception`, `akf-trust-metadata`).

## 1. Atomic Predicate Separation (`audit-agent-run-evidence`)
- Never trust self-reported success or high-level status declarations.
- Split every claim audit evaluation into falsifiable, atomic predicates:
  1. `predicate`: An unambiguous statement that can be proven or falsified.
  2. `required_witness`: Independent external system of record (e.g. SIMRS, SISDMK, BPJS VClaim, INA-CBG engine).
  3. `evidence_refs`: Exact cryptographic event IDs and hashes corroborating the statement.
  4. `counterevidence_refs`: Contradicting logs or detected anomalies.
  5. `coverage`: Observed witness coverage ratio.
  6. `verdict`: Strictly `PROVEN`, `PARTIALLY_PROVEN`, `CONTRADICTED`, or `NOT_PROVEN`.
  7. `gap`: Explicit declaration of unverified telemetry or missing witness records.

## 2. Anti-Deception Gate (`anti-deception`)
- Refuse manufactured urgency: Emergency bypass requests cannot override deterministic DSS audit rules.
- Reject authority appeals: Executive, VIP, or hospital tier statuses do not soften fraud detection thresholds.
- Enforce omission-bias gate: All negative signals, anomalies, and counterevidences must be surfaced explicitly in the audit output.
- Depth enforcement: Every predicate must independently reach an external witness without circular references.

## 3. AKF Trust Metadata (`akf-trust-metadata`)
- Every generated ledger must contain an immutable provenance stamp (`AkfProvenanceStamp`).
- Must declare agent ID, trust score (0.0 to 1.0), evidence declaration, and applicable compliance frameworks (Permenkes 26/2021, Permenkes 3/2023, UU 27/2022 PDP, ISO 27001).
- Include deterministic SHA-256 hash of the entire ledger payload.
