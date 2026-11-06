---
applyTo: '**'
description: 'Evidence -> Finding -> Path verification instructions for ClaimTrace JKN fraud investigations, inspired by reverse-skill case-review and evidence plane contract.'
---

# Evidence -> Finding -> Path Verification Instructions

## Doctrine
Every flagged claim, fraud investigation finding, and automated recommendation must be structured into a verifiable, tamper-evident `Evidence -> Finding -> Path` graph before verifier presentation or regulatory escalation.

## Component Contract

1. Evidence (Immutable Observations):
   - Formatted as `E-{nnn}`.
   - Must contain exact `observed_at`, `source_type` (database, telemetry, audit_log, rule_engine), `source_ref`, `content_hash` (SHA-256), `artifact_path`, `repro_command`, and `raw_excerpt`.
   - The `content_hash` must match the SHA-256 digest of `raw_excerpt` to maintain cryptographic fixity.

2. Findings (Validated Security and Fraud Conclusions):
   - Formatted as `F-{nnn}`.
   - Must reference at least one verified `evidence_refs`.
   - Categorized by fraud typology: `phantom_billing`, `repeat_billing`, `upcoding`, `unbundling`, `identity_spoofing`, or `misconfig`.
   - Severity rated as `critical`, `high`, `medium`, `low`, or `info`.

3. Paths (Defensive Mitigation and Fund Protection):
   - Formatted as `P-{nnn}`.
   - Details `entry_point`, `pivot_steps`, and `target_impact` (potential leakage amount in IDR).
   - Proposes actionable statutory mitigation (BAKB issuance, payment hold, verification clawback).

4. Quality Gate Threshold:
   - Minimum verification score >= 8.0/10.
   - Full evidence chain must compile without unresolved dangling references.
