---
description: Instructions for automated claims invoice organization, audit dossier generation, and dispute reconciliation based on awesome-codex-skills.
globs: ["backend/app/engine/claim_dossier_engine.py", "backend/tests/test_claim_dossier.py", "app/src/components/Dashboard/AuditLedger.jsx"]
---

# Codex Dossier Organizer Instructions

These instructions govern the automated organization of hospital medical claim invoices, audit dossier compilation, and financial dispute reconciliation per Permenkes No. 26 Tahun 2021 and Perpres No. 82 Tahun 2018.

## Principles Sourced from awesome-codex-skills
1. **Standardized Filename Format** (`invoice-organizer`):
   - Every claim dossier file must follow: `YYYY-MM-DD_[FaskesKode]_[ClaimID]_[Typology]_[DisputeLane].json`
   - Preserves deterministic naming across all faskes and audit years.
2. **Formula-Driven Reconciliation** (`spreadsheet-formula-helper`):
   - Exported reconciliation sheets must incorporate dynamic formulas (`=SUM()`, `=COUNTA()`, `=SUMIF()`) rather than static dead values.
   - Preserves calculation transparency for hospital accountants and BPJS verifiers.
3. **50% Legal Administrative Sanction Calculation**:
   - Claims in Jalur MERAH (confirmed fraud) face full recovery (100% of tariff) plus 50% administrative penalty under Permenkes 26/2021 Pasal 74.
   - Claims in Jalur KUNING face recovery on disputed difference plus 50% administrative penalty on the overcharge.
   - Claims in Jalur HIJAU are clear of sanctions.
4. **End-to-End Cryptographic Sealing**:
   - Every dossier item and batch manifest must generate a SHA-256 seal.
5. **Strict Constraint Adherence**:
   - Zero emojis in files, logs, and outputs.
   - Zero vendor leaks in UI and user-facing copy.
