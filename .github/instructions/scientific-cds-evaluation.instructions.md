---
name: scientific-cds-evaluation
description: Clinical Decision Support (CDS) evaluation, hard safety boundaries, and ISO standards readiness inspired by K-Dense-AI/scientific-agent-skills.
apply_to:
  - backend/app/engine/evidence_chain.py
  - backend/app/main.py
  - app/src/components/
---

# Scientific Clinical Decision Support (CDS) Evaluation Doctrine

Standardized against K-Dense-AI/scientific-agent-skills (`clinical-decision-support` v2.4, `clinical-reports` v2.3, `iso-standards-readiness` v1.3).

## 1. Non-Negotiable Hard Safety Boundary (`clinical-decision-support`)
- ClaimTrace JKN is an analytical Decision Support System (DSS) producing research, audit, and governance artifacts only.
- It never autonomously denies, cancels, modifies, or certifies care or reimbursement without licensed human-in-the-loop sign-off.
- Final claim adjudication requires explicit sign-off from authorized hospital medical committees (*Komite Medis*) or certified BPJS verifiers (*Verifikator Klaim BPJS*).
- Never claim FDA clearance, CE mark, or statutory regulatory authority that has not been explicitly granted.

## 2. GRADE Evidence Profile & Decision Logic Traceability
- Every clinical audit finding must be assessed under GRADE criteria:
  - Quality of Evidence: `HIGH`, `MODERATE`, `LOW`, `VERY_LOW`.
  - Risk of Bias: evaluated against source immutability (SISDMK vs manual self-report).
  - Directness: direct link between diagnostic coding and authorized tariff book (Permenkes 3/2023).
  - Consistency: concordance across telemetry layers (L1 rules, L2 biometric, L3 patient mobile).
- Decision logic must be completely transparent:
  - Every rule node declares input features, applied thresholds, observed values, and governing standard (e.g. PPK Kemenkes, Permenkes 26/2021).
  - `human_in_the_loop_mandatory` must evaluate to `True` for every automated rule.

## 3. ISO 14971 & ISO 13485 Risk Controls (`iso-standards-readiness`)
- Medical Device & SaMD Risk Management:
  - Identify and evaluate clinical hazards (e.g. HAZ-001: False-positive alert delaying legitimate reimbursement; HAZ-002: False-negative missed phantom claim; HAZ-003: Privacy breach of patient NIK).
  - Enforce pre-mitigation and post-mitigation risk controls with verifiable testing methods.
- Document Control & Draft Watermark (`clinical-reports`):
  - Every unverified dossier must carry the visible watermark:
    `DRAFT - NOT FOR UNREVIEWED DENIAL, AUTOMATED SETTLEMENT, OR IMMEDIATE SUBMISSION. POPULATED ONLY FROM VERIFIED AUTHORIZED DATA.`
