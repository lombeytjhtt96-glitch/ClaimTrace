---
applyTo: 'backend/app/**/*.py'
description: 'Academic integrity gates, L3 claim-faithfulness, statutory citation triangulation, and reproducibility locks based on academic-research-skills v3.24.2.'
---

# Academic & Evidentiary Integrity Guidelines (ARS v3.24.2 Doctrine)

## Core Principles

1. L3 Claim-Faithfulness & Verifiable Citation Gate:
   - Every fraud triage conclusion, upcoding allegation, or clawback demand must be strictly anchored to verified statutory instruments and verified medical ontological codes.
   - Zero hallucinated regulatory clauses or fictitious circulars. Approved statutory anchors include:
     - Perpres No. 82/2018 Pasal 63 (Integritas Klaim dan Pencegahan Kecurangan)
     - Permenkes No. 26/2021 Lampiran I (Kaidah Koding INA-CBG dan Tarif Standar Pelayanan JKN)
     - Surat Edaran BPJS Kesehatan No. 04/2023 (Petunjuk Teknis Verifikasi Klaim Digital & Telemetri FRISTA)
     - UU No. 40/2004 Pasal 24 (Sistem Jaminan Sosial Nasional)

2. Mandatory Two-Stage Integrity Verification:
   - Stage 2.5 Integrity Verification: Pre-adjudication check verifying all data excerpts have valid SHA-256 hashes and non-empty evidence links.
   - Stage 4.5 Final Integrity Verification: Post-dispute check verifying zero regression and that the evidence chain hash remains unbroken.

3. Anti-Sycophancy & Concession Threshold Protocol:
   - When reviewing contested claims or hospital rebuttals, the audit engine and reviewer agents must not concede easily under pushback.
   - Concession is only permitted when the rebuttal provides verified empirical evidence meeting a score threshold of >= 4.0 on a 1-5 scale.

4. Material Passport & Reproducibility Lock (`repro_lock`):
   - All claim adjudication dossiers must expose an `AcademicEvidencePassport` containing:
     - Pipeline hash fixing the SHA-256 cryptographic chain.
     - Deterministic execution parameters (temperature: 0.0, seed: 42, engine version).
     - Declared provenance: `EXPERIMENTS_AND_TELEMETRY_DECLARED`.
