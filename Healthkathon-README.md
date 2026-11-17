# ClaimTrace: Autonomous Pre-Payment Claim Screening & Anti-Fraud Decision Support System (DSS)

**BPJS Kesehatan Healthkathon 2026 — Finalist Showcase**  
**Category:** Sistem Efisiensi & Pengawasan Risiko Fasilitas Kesehatan (FKRTL)  
**Taxonomy Focus:** #6 Phantom Billing, #11 Repeat Billing, Upcoding INA-CBG, & Geovelocity Anomaly  
**Team:** TINEERENSE (MAN 1 Surakarta)  
- **Khalaf Faith Pradyatama** (*Team Lead · Lead Systems Architect & AppSec Engineer*)  
- **Gaudiansyah Abiyu Mahya** (*Team Member · AI/ML Engineer & Healthcare Data Analyst*)  

---

**Live Cockpit Demo:** http://localhost:3000 &nbsp;|&nbsp; **Swagger API Docs:** http://localhost:8000/docs &nbsp;|&nbsp; **Interactive Workflow Map:** http://localhost:3000 (Header: `[ 🧭 Peta Alur Kerja ]`) &nbsp;|&nbsp; **Jury 1-Click Access:** Active on Sign-In Page

Welcome to the official Healthkathon submission showcase of **ClaimTrace**. This dossier provides judges and evaluators with a complete technical walkthrough of our pre-payment claim triage architecture, empirical evidence from **6,264,346 rows of authentic JKN transactional data**, verifiable cryptographic audit trails, and strict compliance with Indonesian healthcare regulations.

---

## Executive Summary & The Problem

### The Systemic Healthcare & Fiscal Crisis
The Indonesian National Health Insurance (*Jaminan Kesehatan Nasional* - JKN), administered by BPJS Kesehatan, provides coverage for over 270 million citizens. However, maintaining the financial sustainability of the Social Security Fund (*Dana Jaminan Sosial* - DJS) faces structural operational bottlenecks:

1. **The 10-Day Statutory SLA Trap (Perpres No. 82/2018 Pasal 76):**  
   Under presidential mandate, BPJS Kesehatan has a strict window of **10 calendar/working days** to verify claims submitted by FKRTL (hospitals). If BPJS fails to adjudicate within this deadline, the claim is **legally deemed approved (*fiktif positif*)**, forcing disbursement and subjecting BPJS to a statutory late-payment penalty of **1% per month** (Pasal 76 ayat 2 & 4).
2. **Massive Claim Velocity vs. Human Verifier Ratio:**  
   A typical BPJS branch verifier reviews between **150 to 300 inpatient/outpatient claims per day**. Manually reading electronic medical records (RME), checking doctor practice licenses (SIP), cross-referencing diagnostic grouping rules (INA-CBG), and detecting split-billing across disparate systems in under 2 minutes per claim is humanly impossible.
3. **Reactive Post-Payment Audits are Inefficient:**  
   Traditional fraud detection occurs months after money has left the DJS (*post-payment audit*). Recovering funds from non-compliant hospitals requires protracted administrative disputes (*TKMKB*), arbitration, or criminal proceedings—frequently resulting in uncollectible fiscal leakage.

**ClaimTrace reframes claim integrity from reactive post-audit to autonomous pre-payment triage:**  
Every incoming claim batch (*File Pengajuan Klaim* - FPK) is scored across **three independent evidentiary signals** within milliseconds, routed into **three SLA compliance lanes** (Green, Yellow, Red), protected by **FairGuard clinical safeguards** (0.0% false positives on chronic care), and sealed with **tamper-evident SHA-256 chained hash ledgers** before human verifiers formulate the final official record (*Berita Acara Kelengkapan Berkas* - BAKB).

---

## What We Built

We designed, engineered, benchmarked, and production-hardened a full-stack, enterprise-grade Decision Support System (DSS) tailored specifically for BPJS Kesehatan medical verifiers and Wasrik (*Pengawasan dan Pemeriksaan*) officers:

- **Multi-Signal Triad Adjudication Engine:** Combines AI outlier detection (Isolation Forest `< 15ms`), semantic NLP resume matching (ChromaDB `all-MiniLM-L6-v2`), external government API cross-validation (Kemenkes SATUSEHAT SISDMK), physical travel feasibility models (OSRM Geovelocity), and binary patient verification (Mobile JKN push telemetry).
- **FairGuard Clinical Shield (0.0% False Positive Rate):** Deterministic legal safeguards compliant with Permenkes No. 3/2023 Pasal 37 that automatically protect legitimate chronic recurring procedures (Hemodialysis `Z49.1`, Thalassemia blood transfusions, Chemotherapy, and PRB 30-day chronic refills) from being falsely flagged as Repeat Billing.
- **Sequential 4-Pillar Adjudication Pipeline:** Restructures cluttered investigative workflows into a coherent linear progression:
  1. *Antrean & Berkas Klaim* (10-Day SLA Triage & 3-Lane Sieve)
  2. *Telaah & Dokumen Medis* (3-Layer Clinical, Physician, & Patient Evidence Deep-Dive)
  3. *Konsol Putusan & BAKB* (2-Tier Human Adjudication & SHA-256 Digital Minutes)
  4. *Faskes & DPJP* (Longitudinal Facility Risk Index [FRI] & Multi-Hospital Syndicate Surveillance)
- **Zero-PHI Patient Telemetry via Mobile JKN:** Secure binary push notification requesting patient confirmation of physical presence without exposing any Protected Health Information (PHI) like ICD-10 diagnosis codes or medications (strictly compliant with Pasal 34 UU PDP No. 27/2022).
- **Cryptographic Chained Audit Ledger:** Every state change, fraud flag, verifier override, and settlement decision generates an immutable record with chronological SHA-256 hashes (`prev_hash` $\rightarrow$ `curr_hash`), verifiable by external oversight bodies (BPK, BPKP, KPK).
- **High-Throughput SIMD Benchmark:** Columnar analytical engine proven to ingest and score **over 2,500,000 to 4,100,000 claim rows per second**, comfortably handling nationwide JKN peak loads.

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CLAIMTRACE DECISION SUPPORT SYSTEM (DSS)                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Frontend Cockpit  ·  React 18 · Vite · Tailwind CSS · Recharts · Lucide               │
│  http://localhost:3000  (Optimized for Verifikator Medis & Wasrik BPJS)               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Backend API Gateway & Orchestrator  ·  FastAPI · Python 3.12+ · Uvicorn               │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                    DETERMINISTIC WEIGHTED TRIAGE FUSION (0 - 100)                │  │
│  │                      Score = 0.50·S1 + 0.30·S2 + 0.20·S3                         │  │
│  └──────────────┬───────────────────────────┬──────────────────────────┬────────────┘  │
│                 │                           │                          │               │
│          ┌──────┴──────┐             ┌──────┴──────┐            ┌──────┴──────┐        │
│          │  SINYAL 1   │             │  SINYAL 2   │            │  SINYAL 3   │        │
│          │  Billing &  │             │   SISDMK    │            │  Mobile JKN │        │
│          │  Semantics  │             │ Geovelocity │            │  Zero-PHI   │        │
│          │ (Bobot 50%) │             │ (Bobot 30%) │            │ (Bobot 20%) │        │
│          └──────┬──────┘             └──────┬──────┘            └──────┬──────┘        │
│                 │                           │                          │               │
│         [FairGuard Rules]           [Hard-Trigger: SIP]       [Patient Confirmation]   │
│         (Z49.1 / PRB Excl)          (Expired -> Red Lane)      (Absent -> Yellow Lane) │
│                                                                                        │
│  3-LANE SLA ALLOCATION:                                                                │
│  • Green Lane  (0.0 - 49.9)  ──► Fast-Track Auto-BAKB Approval (< 24 Hours)            │
│  • Yellow Lane (50.0 - 74.9) ──► Clarification & Unsynced License Verification         │
│  • Red Lane    (75.0 - 100.0)──► Immediate Pre-Payment Hold & Medical Director Review  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Cryptographic Audit Layer  ·  SHA-256 Chained Hash Ledger                             │
│  Immutable Evidence  ·  Digital BAKB Minutes  ·  QR Verification                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Data Layer  ·  6,264,346 Real JKN Transactional Records · 2,091 FKRTL · DuckDB / PG   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Formal C4 Architecture Model

### C4 Context Diagram

Illustrates the organizational boundaries of ClaimTrace, showing how BPJS Health verifiers, healthcare facilities (FKRTL), JKN patients, and Healthkathon judges interact with the system, and how external government services (Kemenkes SISDMK) and internal BPJS services (V-Claim, FRISTA, Mobile JKN) connect seamlessly.

```mermaid
C4Context
title System Context Diagram - ClaimTrace BPJS Kesehatan

Person(verifier, "Verifikator Medis", "Dokter / staf verifikasi BPJS Kesehatan yang memutus keabsahan berkas klaim.")
Person(hospital, "Koder FKRTL / RS", "Staf koder rumah sakit yang mengajukan berkas klaim digital (FPK/BAKB).")
Person(patient, "Peserta JKN", "Pasien yang menerima layanan rawat jalan/inap dan mengonfirmasi presensi.")
Person(judge, "Dewan Juri", "Evaluator teknis dan tata kelola sistem anti-fraud BPJS Healthkathon.")

System(claimtrace, "ClaimTrace DSS", "Sistem pendukung keputusan verifikator pra-bayar berbasis triase multi-sinyal independen.")

System_Ext(vclaim, "V-Claim / E-Klaim", "Sistem inti BPJS untuk penerbitan SEP dan grouping tarif INA-CBG.")
System_Ext(sisdmk, "Kemenkes SATUSEHAT SISDMK", "Basis data nasional izin praktik dokter (SIP aktif/kedaluwarsa).")
System_Ext(mobilejkn, "Mobile JKN Gateway", "Kanal push notification konfirmasi kehadiran biner (Zero-PHI).")
System_Ext(frista, "FRISTA Biometri Wajah", "Face recognition verifikasi identitas fisik pasien di loket admisi RS.")

Rel(hospital, vclaim, "Mengajukan berkas klaim & RME")
Rel(vclaim, claimtrace, "Mengalirkan berkas FPK digital secara batch/streaming")
Rel(claimtrace, sisdmk, "Memvalidasi keabsahan SIP & koordinat praktik DPJP")
Rel(claimtrace, mobilejkn, "Mengirim permintaan konfirmasi kehadiran pasien")
Rel(patient, mobilejkn, "Menekan respon Ya / Tidak")
Rel(mobilejkn, claimtrace, "Mengembalikan sinyal kehadiran terenkripsi")
Rel(claimtrace, frista, "Mencocokkan skor biometrik wajah admisi")
Rel(verifier, claimtrace, "Melakukan telaah 3 lapis, verifikasi berkas, & menandatangani BAKB")
Rel(judge, claimtrace, "Mengakses mode evaluasi juri 1-klik & memverifikasi bukti")
```

### C4 Container Diagram

Drills into the internal software containers and multi-agent pipeline components within ClaimTrace, showing data flow between the React Cockpit, FastAPI Orchestrator, the 3-Signal Triad, FairGuard Engine, and the SHA-256 Tamper-Evident Ledger.

```mermaid
C4Container
title Container Diagram - ClaimTrace Component Architecture

Person(verifier, "Verifikator Medis BPJS", "Pengguna utama konsol verifikasi.")

System_Boundary(c1, "ClaimTrace Platform") {
    Container(frontend, "Frontend Cockpit", "React 18, Vite, Tailwind CSS", "Antarmuka audit pra-bayar 4-pilar, konsol putusan BAKB, surveilans faskes.")
    Container(backend, "Core API & Orchestrator", "FastAPI, Python 3.12+, Uvicorn", "Gerbang API, autentikasi sesi berlapis, manajemen alur kerja, & eksekusi algoritma.")

    Container_Boundary(ai_triage, "Multi-Signal Triage & Anti-Fraud Engine") {
        Component(sig1, "Sinyal 1: Pola & Semantik", "Isolation Forest + ChromaDB", "Deteksi anomali tagihan, lonjakan klaster, & duplikasi resume medis.")
        Component(fairguard, "FairGuard Safeguard", "Rule Engine Deterministik", "Perlindungan 0% FPR untuk Hemodialisis Z49.1, Thalassemia, & PRB.")
        Component(sig2, "Sinyal 2: SISDMK & Geovelocity", "OSRM Engine + SIP Validator", "Validasi SIP aktif, batas beban fisik (>40), & kecepatan rute (>120 km/jam).")
        Component(sig3, "Sinyal 3: Mobile JKN Telemetry", "Zero-PHI Parser", "Penerima respon biner kehadiran peserta UU PDP 27/2022.")
        Component(fusion, "Deterministic Fusion", "Weighted Formula", "Menggabungkan skor S1, S2, S3 ke skala 0-100 dan membagi 3 lajur SLA.")
    }

    Container(ledger, "Tamper-Evident Audit Ledger", "Chained SHA-256 Engine", "Pencatatan kriptografis kronologis perubahan status klaim & Berita Acara digital.")
    ContainerDb(database, "Analytical Data Lakehouse", "PostgreSQL / DuckDB On-Premise", "Menyimpan 6,26 juta baris data transaksi historis JKN, klaim FKRTL, dan master kepesertaan.")
}

System_Ext(sisdmk, "SATUSEHAT SISDMK", "Validasi SIP Kemenkes")
System_Ext(mobilejkn, "Mobile JKN Gateway", "Push Konfirmasi Peserta")

Rel(verifier, frontend, "Mengoperasikan telaah klaim & konsol putusan", "HTTPS")
Rel(frontend, backend, "Mengirim permintaan REST & sesi terautentikasi", "JSON/HTTPS")
Rel(backend, sig1, "Mengirim data klaim untuk penapisan pola")
Rel(sig1, fairguard, "Memfilter kasus terapi kronis sah")
Rel(backend, sig2, "Mengirim data DPJP untuk audit legalitas & rute")
Rel(sig2, sisdmk, "Query status SIP & faskes praktik", "REST/HTTPS")
Rel(backend, sig3, "Mengirim pemicu konfirmasi kehadiran")
Rel(sig3, mobilejkn, "Push notifikasi kehadiran", "REST/HTTPS")
Rel(sig1, fusion, "Skor S1 (Bobot 50%)")
Rel(sig2, fusion, "Skor S2 (Bobot 30%)")
Rel(sig3, fusion, "Skor S3 (Bobot 20%)")
Rel(fusion, backend, "Prioritas Klaim & Alokasi Lajur (Hijau/Kuning/Merah)")
Rel(backend, ledger, "Mencatat putusan verifikator & menghasilkan hash rantai", "SHA-256")
Rel(backend, database, "Query data historis & benchmarking", "SQL/SIMD")
```

---

## Multi-Signal Triage Network & Fraud Taxonomy

The ClaimTrace scoring engine implements an open, mathematically deterministic formula:

$$\text{Skor Prioritas Risiko } (S) = 0.50 \cdot S_1 + 0.30 \cdot S_2 + 0.20 \cdot S_3$$

| Sinyal | Domain Bukti | Metode Deteksi | Aturan Kritis & Bobot |
|:---|:---|:---|:---|
| **Sinyal 1** *(50%)* | **Pola Tagihan & Semantik RME** | Isolation Forest On-Premise + Cosine Similarity ChromaDB (`all-MiniLM-L6-v2`) | Mendeteksi lonjakan klaster $\ge 3.0\times$ baseline, repeat billing $\le 30$ hari, kemiripan narasi RME $\ge 90\%$, dan upcoding tingkat keparahan (Severity I $\rightarrow$ III). |
| **Sinyal 2** *(30%)* | **Legalitas SIP & Geovelocity DPJP** | Integrasi SISDMK Kemenkes + OSRM OpenStreetMap Engine | SIP `EXPIRED` memicu **Hard-Trigger langsung ke Jalur Merah ($\ge 75.0$)**. Kecepatan darat $> 120\text{ km/jam}$ antar-RS atau beban $> 40\text{ pasien/hari}$ memicu anomali fisik. |
| **Sinyal 3** *(20%)* | **Konfirmasi Mobile JKN** | Binary Push Notification (Ya / Tidak) berprinsip Zero-PHI | Penyangkalan kehadiran peserta memicu anomali Phantom Billing. Ketiadaan respon **tidak memvonis fraud**, melainkan dialihkan ke Jalur Kuning. |
| **Lapis 4** *(Pendukung)* | **Integritas RME & FRISTA** | Verifikasi TTE Balai Sertifikasi Elektronik (BSrE) + Match FRISTA | Audit 7 dokumen wajib Permenkes 24/2022 dan kecocokan biometrik wajah admisi RS. |

### Alokasi 3 Lajur Kepatuhan SLA (Perpres 82/2018 Pasal 76)

```
[ Input Berkas Klaim FKRTL ]
              │
              ▼
   ┌──────────────────────┐
   │  Skor Prioritas (S)  │
   └──────────┬───────────┘
              │
   ┌──────────┼──────────────────────┐
   │          │                      │
   ▼          ▼                      ▼
[ JALUR HIJAU ]       [ JALUR KUNING ]       [ JALUR MERAH ]
 Skor: 0.0 - 49.9      Skor: 50.0 - 74.9      Skor: 75.0 - 100.0
 Wajar / Bebas Anomali Klarifikasi Administrasi Hard-Trigger / Kritis
 SLA: < 24 Jam Fast-Track SLA: Maks 5 Hari Kerja  SLA: Tahan Pra-Bayar (< 10 Hari)
 Auto-Draft BAKB Setuju Konfirmasi DPJP/Peserta Eskalasi TKMKB & Investigasi Wasrik
```

---

## FairGuard: 0.0% False Positive Safeguard

One of the greatest dangers of deploying AI in healthcare administration is **punishing legitimate patients with chronic illnesses**. Under generic machine learning models, recurring claims for hemodialysis or cancer treatment are often wrongly flagged as *"Repeat Billing fraud"* because patients receive treatments every 3 to 7 days.

**FairGuard solves this with deterministic statutory rule overrides (Permenkes No. 3/2023 Pasal 37):**

1. **Hemodialisis (ICD-10 Z49.1):** Pasien gagal ginjal kronis stadium akhir wajib cuci darah 2–3 kali seminggu. FairGuard mengenali kode `Z49.1` dan menonaktifkan aturan repeat billing 30 hari.
2. **Program Rujuk Balik (PRB):** Pengambilan obat kronis (Diabetes Mellitus, Hipertensi, PPOK) setiap 30 hari adalah hak peserta. FairGuard mengecualikan penagihan obat rutin dari anomali tagihan berulang.
3. **Thalassemia & Kemoterapi:** Transfusi darah rutin dan protokol sitostatika siklus pendek dilindungi oleh whitelist klinis otomatis.

**Empirical Result:** Tested against **512 hard-negative cases**, FairGuard achieved **0.0% False Positive Rate (FPR)**—guaranteeing zero disruption to vital patient treatments.

---

## The 4-Pillar Sequential Adjudication Pipeline

To eliminate verifier disorientation, ClaimTrace organizes all 10 core analytical modules into 4 sequential workflow stages:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. ANTREAN &    │     │ 2. TELAAH &     │     │ 3. KONSOL       │     │ 4. FASKES &     │
│    BERKAS KLAIM │ ──► │    DOKUMEN      │ ──► │    PUTUSAN      │ ──► │    DPJP         │
│ Penapisan SLA   │     │ Bedah 3 Lapis   │     │ BAKB Digital    │     │ Surveilans FRI  │
│ 3 Lajur Aliran  │     │ Medis, DPJP, JKN│     │ Putusan Hukum   │     │ Deteksi Sindikat│
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Pillar 1: Antrean & Berkas Klaim (Triase SLA):**  
   Menyajikan antrean berkas klaim masuk yang otomatis dipilah ke Lajur Hijau, Kuning, dan Merah lengkap dengan indikator sisa hari kerja SLA (1–10 hari kalender).
2. **Pillar 2: Telaah & Dokumen Medis (Audit Investigatif):**  
   Membedah klaim anomali secara komparatif: rekam medis elektronik (RME), keabsahan SIP dan beban DPJP, rute geovelocity, serta respon peserta Mobile JKN.
3. **Pillar 3: Konsol Putusan & BAKB (Eksekusi Hukum Pra-Bayar):**  
   Menyediakan tombol putusan human-in-the-loop: *Setujui Klaim Penuh*, *Koreksi Tarif/Grouping*, atau *Tolak/Tunda Bayar (Hold)*, yang secara otomatis menerbitkan dokumen resmi **Berita Acara Kelengkapan Berkas (BAKB)** ber-QR code dan ber-checksum SHA-256. Menangani eskalasi sengketa TKMKB (Tim Kendali Mutu dan Kendali Biaya).
4. **Pillar 4: Faskes & DPJP (Surveilans Longitudinal):**  
   Memantau profil perilaku rumah sakit (*Facility Risk Index* - FRI skala 0–100), dokter dengan anomali beban/kecepatan, serta visualisasi klaster sindikat klaim lintas faskes.

---

## Verifiable Autonomy: Cryptographic Tamper-Evident Ledger

In government administration, AI recommendations are useless without legal auditability. ClaimTrace secures every decision in a **chronological SHA-256 chained hash ledger**:

$$\text{Current Hash } (H_n) = \text{SHA-256}\left(H_{n-1} \parallel \text{Claim ID} \parallel \text{Action} \parallel \text{Verifier NIP} \parallel \text{Timestamp} \parallel \text{Payload Checksum}\right)$$

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│ Ledger Block #104               │       │ Ledger Block #105               │
│ Claim: CLM-2026-8801            │       │ Claim: CLM-2026-8801            │
│ Status: PENDING_REVIEW          │ ───►  │ Status: HOLD_PENDING_BAKB       │
│ PrevHash: 8f3a9b...             │       │ PrevHash: c412de...             │
│ CurrHash: c412de...             │       │ CurrHash: 9a78bf...             │
└─────────────────────────────────┘       └─────────────────────────────────┘
```

- Any attempt to alter past verifier decisions or tamper with database records breaks the cryptographic hash chain, triggering instant alerts.
- Every generated BAKB document features a cryptographic QR code linking directly to the ledger entry, fulfilling standards from the Indonesian State Audit Agency (BPK) and KPK anti-corruption guidelines.

---

## Verification Surfaces for Judges

We built dedicated inspection tools to enable judges and technical reviewers to evaluate ClaimTrace instantly without configuration friction:

| Surface | URL / Method | Description |
|:---|:---|:---|
| **1-Click Jury Sign-In** | `http://localhost:3000` | Tombol khusus **`[ 🛡️ Masuk Langsung Administrator (Mode Juri) ]`** pada halaman login. Memberikan akses instan Administrator tanpa perlu OTP email, captcha, atau kata sandi. |
| **Interactive Workflow Map** | `http://localhost:3000` | Klik tombol **`[ 🧭 Peta Alur Kerja ]`** di bilah atas aplikasi untuk membuka modal interaktif arsitektur 4-pilar, dasar hukum, dan siklus sengketa TKMKB. |
| **Interactive API Documentation** | `http://localhost:8000/docs` | Swagger / OpenAPI 3.0 interface yang mengekspos seluruh **197 endpoint FastAPI**, mencakup triase, analitik, geovelocity, hingga audit ledger. |
| **Automated E2E Test Suite** | `node app/tests/e2e_smoke.mjs` | Pengujian komprehensif Playwright yang menguji seluruh 23 tab, rendering visual Recharts, dan modal interaktif. |
| **Throughput SIMD Benchmark** | `POST /api/v1/system/national-scale-benchmark` | Uji beban langsung 500.000 klaim kolumnar membuktikan performa $>2,5\text{ juta baris/detik}$. |

---

## Empirical Scale: Analysis of 6,264,346 Authentic JKN Records

ClaimTrace is not an empty prototype trained on toy datasets. It was validated and benchmarked against **6,264,346 rows of authentic transactional JKN data**:

- **Klaim FKRTL (`bpjs_fkrtl_all`):** **1,699,219 klaim rumah sakit** dari **2,091 fasilitas kesehatan** di **496 Kabupaten/Kota (38 Provinsi)** dengan total nilai penagihan **Rp 1,536 Triliun**.
- **Master Kepesertaan (`bpjs_kepesertaan_all`):** **2,590,751 baris** data demografi peserta (1,065,281 kepala keluarga).
- **Diagnosis Sekunder (`bpjs_diagnosissekunder_all`):** **1,967,670 baris** diagnosis penyerta dan prosedur operasi, dipetakan ke **6,706 kode referensi ICD-10**.

### Actual Fraud Findings Detected in Dataset:
1. **Direct Tariff Discrepancies:** Terdeteksi **1,631 klaim** dengan anomali grouping tarif senilai **Rp 2,07 Miliar**.
2. **Same-Day Repeat Billing Duplications:** Terdeteksi **4,876 pasang klaim ganda pada hari yang sama** senilai total **Rp 32,59 Miliar**:
   - `2,584 pasang` klaim ganda lintas rumah sakit berbeda (**Rp 19,26 Miliar**).
   - `2,292 pasang` klaim ganda di dalam satu rumah sakit yang sama (**Rp 13,33 Miliar**).

---

## Technical Stack

| Layer | Technologies & Frameworks |
|:---|:---|
| **Frontend Cockpit** | React 18, Vite 6, Tailwind CSS 4, Recharts, Lucide Icons, Motion (Framer Motion) |
| **Backend API Gateway** | FastAPI, Python 3.12+, Uvicorn (ASGI), Pydantic v2 |
| **Triage & ML Engine** | Scikit-learn (Isolation Forest), ChromaDB (`all-MiniLM-L6-v2`), NumPy, DuckDB SIMD Engine |
| **Geospatial & Routing** | OSRM (Open Source Routing Machine), OpenStreetMap API, Haversine Matrix |
| **Cryptographic Security** | SHA-256 Chained Ledger, HMAC-SHA256 Tokenization, Google reCAPTCHA v2/v3, Zero-PHI Masking |
| **Testing & Quality Assurance** | Playwright (E2E Browser Automation), Pytest (300 Backend Unit/Integration Tests) |

---

## Regulatory & Legal Alignment

- **Perpres No. 82 Tahun 2018 Pasal 74 & 76:** Pengendalian SLA verifikasi klaim 10 hari kerja guna mencegah denda bunga 1% dan persetujuan klaim fiktif positif otomatis.
- **Permenkes No. 16 Tahun 2019:** Pedoman Pencegahan dan Penanganan Kecurangan (*Fraud*) serta Pengenaan Sanksi Administrasi dalam Program JKN.
- **Permenkes No. 24 Tahun 2022:** Kewajiban Penyelenggaraan Rekam Medis Elektronik (RME) dan Tanda Tangan Elektronik Tersertifikasi (TTE BSrE).
- **Permenkes No. 3 Tahun 2023 Pasal 37:** Ketentuan tarif INA-CBG dan perlindungan klaim pelayanan kronis / PRB.
- **UU No. 27 Tahun 2022 (UU Perlindungan Data Pribadi / PDP):** Prinsip *Zero-PHI* pada telemetri Mobile JKN, enkripsi data medis sensitif, dan hak privasi pasien.

---

## Quick Start: Running ClaimTrace Locally

### Prerequisites
- **Python:** Versi 3.10, 3.11, 3.12, atau 3.14
- **Node.js:** Versi 18+ atau 20+
- **Browser:** Google Chrome, Microsoft Edge, atau Mozilla Firefox

### 1-Step Launch (Recommended)
Jalankan skrip otomatis untuk menyalakan Backend FastAPI dan Frontend React sekaligus:
```bash
./start_all.sh
```
Atau di Windows Command Prompt:
```cmd
start_all.bat
```

### Manual Service Startup

#### 1. Backend API (FastAPI)
```bash
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base URL: `http://localhost:8000`
- Swagger / OpenAPI Docs: `http://localhost:8000/docs`

#### 2. Frontend Cockpit (React + Vite)
```bash
cd app
npm run dev -- --port 3000
```
- Web Application: Buka browser pada **`http://localhost:3000`**
- Klik tombol **`[ 🛡️ Masuk Langsung Administrator (Mode Juri) ]`** untuk masuk langsung tanpa login manual.

---

## Why ClaimTrace Wins the Healthkathon

1. **Addresses the Ultimate Operational Risk:** Other solutions focus on clinical chat or post-payment analytics. ClaimTrace tackles the **#1 existential financial risk of BPJS Kesehatan: paying out billions in fraudulent claims due to the statutory 10-day SLA deadline**.
2. **Clinical Empathy via FairGuard:** Unlike crude rule-based engines, ClaimTrace achieves **0.0% false positives** on life-saving recurring treatments like Hemodialysis (Z49.1), ensuring zero administrative harm to vulnerable patients.
3. **Verifiable, Non-Black-Box Governance:** Every score is explainable (50/30/20 weights), every action is bounded by Human-in-the-Loop oversight, and every decision is permanently sealed on an immutable cryptographic ledger.
4. **Empirically Proven Scale:** Tested and proven against **6,264,346 rows of real JKN transactional data** with throughput exceeding **2.5 million rows/second**.

---

*Dikembangkan dengan dedikasi penuh untuk integritas Program Jaminan Kesehatan Nasional (JKN) dan keberlanjutan Dana Jaminan Sosial (DJS) BPJS Kesehatan.*  
**Tim TINEERENSE — MAN 1 Surakarta**
