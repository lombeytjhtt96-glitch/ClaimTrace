---
name: bpjs-fraud-mitre-f3
description: >-
  Detects and classifies Indonesian BPJS Kesehatan healthcare insurance fraud using the MITRE Fight Fraud
  Framework (F3 v1.1), MITRE ATT&CK, MITRE ATLAS, and NIST AI RMF. Covers pre-payment triase of phantom billing,
  INA-CBG upcoding, ghost providers, SATUSEHAT practitioner collisions, and beneficiary impersonation.
domain: cybersecurity
subdomain: fraud-defense
tags:
  - healthcare-fraud
  - bpjs-kesehatan
  - mitre-f3
  - insurance-fraud
  - phantom-billing
  - upcoding
  - zero-trust-claims
version: "1.0.0"
author: TINEERENSE
license: Apache-2.0
mitre_f3:
  - FA0001  # Positioning: Synthetic identity seeding, doctor SIP collision, SEP duplication
  - FA0002  # Monetization: Phantom billing, INA-CBG upcoding, unbundling, claim layering
  - F1005.006  # Beneficiary Account Hijacking / Impersonation
  - F1025.003  # Pre-Payment Claim Submission Abuse
mitre_attack:
  - T1657  # Financial Theft
  - T1078  # Valid Accounts (Doctor SIP credential misuse)
  - T1565  # Data Manipulation (Medical records alteration)
  - T1070  # Indicator Removal on Host (Tampering EHR timestamps)
atlas_techniques:
  - AML.T0043  # Adversarial Evasion of ML Triage Scoring
  - AML.T0051  # LLM Prompt Injection via Clinical Notes
nist_ai_rmf:
  - GOVERN-1.2  # AI governance policies for pre-payment claim decision support
  - MEASURE-2.6 # Robustness testing against gaming of triage score S
  - MANAGE-2.4  # Incident management for false positives/negatives in claim denial
nist_csf:
  - DE.CM-01  # Continuous monitoring of anomalous claim volumes
  - PR.DS-01  # Cryptographic hash protection of audit trail (UU PDP compliance)
  - RS.AN-03  # Incident forensic analysis of hospital billing anomalies
d3fend_techniques:
  - D3-MA   # Message Authentication (HMAC / SHA-256 verifier logs)
  - D3-DL   # Decoy & Tamper-Evident Audit Logging
  - D3-IT   # Integrity Tracking across EHR and SATUSEHAT SDMK
---

# BPJS Healthcare Claim Fraud Detection via MITRE F3

## 1. When to Use
- Validating hospital claim submissions (Klaim Rawat Inap / Rawat Jalan Tingkat Lanjut) prior to BPJS disbursement.
- Correlating clinical indicators ($S_1$) with external digital infrastructure ($S_2$) and beneficiary validation ($S_3$).
- Investigating suspected hospital fraud rings: phantom billing, unbundling, duplicate claims, or doctor SIP collisions.
- Conducting compliance audits under Permenkes 16/2019 (Pencegahan Kecurangan JKN) and UU PDP No. 27/2022.

---

## 2. Framework Mapping & Threat Modeling

### A. MITRE F3 Positioning (FA0001) in Healthcare Claims
Adversaries (fraudulent billers, unverified clinics) perform preparatory actions:
1. **Synthetic Patient Seeding**: Registering inactive or fictitious NIKs to generate valid SEPs without physical attendance.
2. **Practitioner Staging (SIP Collisions)**: Utilizing a single specialist doctor's SIP credentials across multiple geographically disparate hospitals simultaneously.
3. **Medical Record Alteration (T1565)**: Injecting phantom diagnostic codes (ICD-10) or surgical procedures (ICD-9-CM) to meet severity thresholds for higher INA-CBG groupings.

### B. MITRE F3 Monetization (FA0002) in Pre-Payment Claims
1. **Pre-Payment Claim Injection (F1025.003)**: Submitting inflated claims within the statutory Vedika 10-day SLA window, betting on verifier fatigue to achieve automated payout.
2. **Upcoding Severity Drift**: Shifting mild conditions (e.g., uncomplicated gastritis) into severe tertiary codes (e.g., acute GI bleeding with shock) without supporting labs or vitals.
3. **Ghost Procedure Layering**: Adding ancillary billing line items (ICU days, oxygen titration, advanced CT/MRI) that have zero digital footprint on hospital PACS/LIS.

---

## 3. ClaimTrace Tri-Signal Detection Workflow

$$\text{Triage Score } S = 0.50 \cdot S_1 + 0.30 \cdot S_2 + 0.20 \cdot S_3$$

| Sinyal | Metodologi Verifikasi | Pemetaan F3 / ATT&CK / D3FEND | Ambang Batas Waspada |
|:---|:---|:---|:---:|
| **$S_1$: Klinis** | ICD-10 vs ICD-9-CM plausibility matrix, lab consistency | F3 Monetization (`FA0002`), ATT&CK `T1565` | $S_1 > 0.65$ |
| **$S_2$: Graph** | SATUSEHAT SDMK practitioner collisions, geodistance velocity | F3 Positioning (`FA0001`), ATT&CK `T1078` | $S_2 > 0.60$ |
| **$S_3$: Peserta** | Mobile JKN biometric timestamp & push notification check | F3 Impersonation (`F1005.006`), D3FEND `D3-MA` | $S_3 > 0.50$ |

### Triase Keputusan:
- **Jalur Hijau ($S < 0.35$)**: Tingkat anomali rendah, kepatuhan tinggi $\rightarrow$ Auto-Approve Pra-Bayar (SLA 2 hari).
- **Jalur Kuning ($0.35 \le S \le 0.70$)**: Diskrepansi data sekunder $\rightarrow$ Klarifikasi RS & Feedback Klinis (SLA 5 hari).
- **Jalur Merah ($S > 0.70$)**: Indikasi kuat manipulasi faktual $\rightarrow$ Audit Medis Lapangan & Eskalasi Tim PK-JKN (SLA 3 hari).

---

## 4. Verification & Cryptographic Audit Standards
- **Tamper-Evident Ledger**: Every triage decision, note, and escalation must produce a SHA-256 hash chaining back to the previous entry ($H_n = \text{SHA256}(H_{n-1} \parallel \text{Entry}_n)$).
- **UU PDP No. 27/2022 Privacy Lock**: Patient identifiers (NIK, BPJS Number) must be masked with pseudonymized tokens (`P-882193-JKN`) in memory and display.
- **Model Explainability**: Verifiers must be presented with the exact mathematical feature attribution for every flagged case, ensuring no "black box" claim denials.
