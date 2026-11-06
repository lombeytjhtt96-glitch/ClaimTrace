# Cybersecurity Frameworks & MITRE Fight Fraud (F3) Standard Operating Procedures

## 1. Operational Overview

This standard operating procedure governs the integration of 818 cybersecurity skills from `cybersecurity-skills` into the ClaimTrace JKN platform. It establishes structured taxonomies for mapping healthcare claim fraud across six industry frameworks:
- **MITRE Fight Fraud Framework (F3 v1.1)**: Positioning (`FA0001`) and Monetization (`FA0002`).
- **MITRE ATT&CK v19.1**: Adversary TTPs (`T1078`, `T1565`, `T1657`).
- **MITRE D3FEND v1.4.0**: Countermeasures (`D3-ARA`, `D3-DA`, `D3-NTA`, `D3-SVR`, `D3-TR`).
- **NIST CSF 2.0**: Govern, Identify, Protect, Detect, Respond, Recover.
- **MITRE ATLAS 2026**: Adversarial AI threat mitigation.
- **NIST AI RMF 1.0**: AI risk management controls.

---

## 2. Fraud Typology to Framework Mapping Matrix

| Claim Fraud Typology | F3 Positioning (FA0001) | F3 Monetization (FA0002) | ATT&CK v19 | D3FEND v1.4 Countermeasure | NIST CSF 2.0 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phantom Billing** | `F1005` (Synthetic Profile Seeding) & `F1036` (Phantom Provider) | `F1025.003` (Illegitimate Payout Wire) | `T1078.004`, `T1565.001` | `D3-ARA` (Account Lockdown), `D3-DA` (Data Authenticity) | `PR.AC-01`, `DE.AE-02` |
| **Upcoding (Tingkat Keparahan)** | `F1005.003` (Claim Discrepancy Infiltration) | `FA0002` (Tariff Delta Extraction) | `T1565.001` (Stored Record Alteration) | `D3-SVR` (Secondary Medical Review) | `DE.CM-01`, `RS.AN-01` |
| **Geovelocity Collision** | `F1007` (Multi-Session Impersonation) | `FA0002` (Parallel Claim Disbursement) | `T1078` (Impossible Travel) | `D3-NTA` (Telemetry Geo-Analysis) | `DE.AE-01`, `DE.CM-01` |
| **Repeat Billing (Readmisi)** | `FA0001` (Episode Interval Compression) | `FA0002` (Duplicate Benefit Extraction) | `T1657` (Duplicate Submissions) | `D3-TR` (Transaction Reconciliation) | `PR.DS-01`, `DE.CM-01` |
| **Unbundling (Fragmentasi)** | `FA0001` (Procedure Fragmentation) | `F1025` (Fragmented Payout Harvesting) | `T1657` (Systemic Code Fragmentation) | `D3-CR` (Claim Package Completeness) | `PR.IP-01`, `DE.CM-01` |

---

## 3. Cryptographic Non-Repudiation Standards

1. **Canonical Matrix Digest**: Every generated `ClaimCybersecurityMatrix` is serialized with deterministic ASCII JSON key ordering (`sort_keys=True, separators=(',', ':')`) and sealed with SHA-256 (`canonical_matrix_sha256`).
2. **Evidentiary Continuity**: Matrix seals bind directly to BPJS Verifikator Berita Acara dossiers and OpenAgentOntology Decision Receipts for judicial admissibility under UU PDP No. 27/2022 and Permenkes No. 26/2021.

---

## 4. Verification Protocol

Every change must be validated against:
1. `backend/tests/test_cybersecurity_frameworks.py`: 10/10 unit and integration tests passing.
2. `scripts/verify_claimtrace_cybersecurity_skills_stack.py`: 10/10 verification checks passing.
3. Zero emojis policy and zero proprietary AI / vendor leaks.
