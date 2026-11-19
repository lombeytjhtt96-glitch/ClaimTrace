# ClaimTrace — Sistem Pendukung Keputusan Verifikator Klaim JKN
### *Berbasis Triase Multi-Sinyal Independen Pra-Bayar*
**BPJS Kesehatan Healthkathon 2026** • Kategori: *Efisiensi Risiko pada Fasilitas Kesehatan*  
**Fokus Sub-Kategori:** *#6 Phantom Billing & #11 Repeat Billing*  
**Tim Pengusul:** **TINEERENSE** (MAN 1 Surakarta)  
- **Khalaf Faith Pradyatama** (*Ketua Tim* — Full-Stack, Architecture, AppSec)  
- **Gaudiansyah Abiyu Mahya** (*Anggota Tim* — AI/ML, Health Data, UI/UX)

---

## 📌 Ringkasan Inovasi (Evidence-First Triage)
ClaimTrace menghadirkan paradigma **"Satu skor prioritas, tiga lapis bukti, keputusan tetap di manusia (Human-in-the-Loop)"**. Sistem ini menutup celah verifikasi berkas tunggal pra-bayar (Vedika) sebelum terbit berita acara kelengkapan berkas (SLA 10 hari kerja, Perpres No. 82 Tahun 2018 Pasal 76 ayat (2)), sehingga anomali klaim fiktif atau klaim ganda dapat ditapis lebih awal tanpa menunda klaim faskes yang patuh.

```
                              ┌──────────────────────────────────┐
                              │     Input Berkas Klaim Masuk     │
                              └─────────────────┬────────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 │                              │                              │
                 ▼                              ▼                              ▼
      [ Lapis 1: 50% Bobot ]         [ Lapis 2: 30% Bobot ]         [ Lapis 3: 20% Bobot ]
         Radar Pola Klaim             Uji Jejak Layanan DPJP          Konfirmasi Peserta
      • Klaster Spatiotemporal (#6)  • Validasi SIP SATUSEHAT SDMK  • Notifikasi Biner Mobile JKN
      • Rekonsiliasi Episode (#11)   • Batas Jam Praktik Dokter    • Minimasi Data (UU PDP)
                 │                              │                              │
                 └──────────────────────────────┼──────────────────────────────┘
                                                │
                                                ▼
                               ┌──────────────────────────────────┐
                               │  Fusi Skor Deterministik (0–100) │
                               │   S = 0.5*S1 + 0.3*S2 + 0.2*S3   │
                               │   + Hard Trigger Independen      │
                               └────────────────┬─────────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
          [ JALUR HIJAU ]                [ JALUR KUNING ]               [ JALUR MERAH ]
             (S < 50)                    (50 <= S < 75)                    (S >= 75)
          Alur Cepat Sah           Ketidakpastian Data / SDMK        Prioritas Telaah Pra-Bayar
           (Fast-Track)             (Bukan Vonis Fraud)             / Hard Trigger SIP Expired
                 │                              │                              │
                 └──────────────────────────────┼──────────────────────────────┘
                                                │
                                                ▼
                               ┌──────────────────────────────────┐
                               │  Berkas Siap-Audit Deterministik │
                               │  + Rantai Hash SHA-256 Imutabel │
                               │  + Keputusan Human-in-the-Loop   │
                               └──────────────────────────────────┘
```

---

## 🚀 Panduan Menjalankan Prototipe Secara Lokal

### Prasyarat
- **Python**: 3.10+ (Sudah terpasang `fastapi`, `uvicorn`, `pydantic`)
- **Node.js**: v18+ / v20+ / v24+ dengan `npm`

### Cara 1: Jalankan Sekaligus (Rekomendasi di Windows)
Cukup jalankan script batch berikut di Command Prompt / PowerShell:
```cmd
start_all.bat
```
Script akan membuka dua terminal terpisah: satu untuk backend FastAPI dan satu untuk frontend Next.js.

### Cara 2: Jalankan Manual per Komponen

#### 1. Menjalankan Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- **REST API Entrypoint**: `http://127.0.0.1:8000`
- **Swagger UI Interaktif**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

#### 2. Menjalankan Frontend (Next.js Dashboard)
```bash
cd frontend
npm install
npm run dev
```
Buka browser pada: **`http://localhost:3000`**

#### 3. Menjalankan Pengujian Otomatis (Automated Test Suite)
- **Backend Pytest Suite (30 Test Cases):**
  ```bash
  cd backend
  python3 -m pytest tests/ -v
  ```
  *Hasil: 30 unit & integration tests lolos 100% (Scoring math, Hard triggers, Administrative uncertainty, SHA-256 tamper-evident integrity, Neo4j Graph Cypher generator, SATUSEHAT FHIR R4 bundle adapter, Native FHIR R4 server endpoints, OSRM Geovelocity & Impossible Travel engine, dan seluruh FastAPI REST APIs).*

- **Frontend & RPA Playwright E2E Test Suite (7 Test Cases):**
  ```bash
  cd frontend
  npx playwright test
  ```
  *Hasil: 7 end-to-end browser automation tests lolos 100% dalam 14 detik (UI/UX layout, antrean triase, OSRM geovelocity radar, modal SATUSEHAT FHIR MCP, Mobile JKN binary simulation, ekspor audit dossier dengan segel SHA-256, dan modal Robot RPA Playwright MCP).*

---

## 📂 Struktur Direktori Monorepo (`ClaimTrace/`)

```
ClaimTrace/
├── backend/                             # Python / FastAPI Core Engine
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                      # REST Endpoints, CORS, Graph, FHIR, & OSRM APIs
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py               # Pydantic Schemas (vClaim, SDMK, Dossier, Graph)
│   │   ├── engine/
│   │   │   ├── __init__.py
│   │   │   ├── scoring.py               # Fusi Skor Deterministik & Hard Trigger
│   │   │   ├── episode_graph.py         # Topologi Graf Klaster Anomali (XAI)
│   │   │   ├── neo4j_graph.py           # Neo4j Graph DB Generator & Cypher Fraud Queries
│   │   │   ├── fhir_adapter.py          # Kemenkes SATUSEHAT HL7 FHIR R4 Bundle Adapter
│   │   │   ├── fhir_server.py           # Native FHIR R4 REST Server (WSO2 fhir-mcp-server)
│   │   │   └── osrm_geovelocity.py      # OSRM Geovelocity & Impossible Travel Radar Engine
│   │   ├── security/
│   │   │   ├── __init__.py
│   │   │   └── audit_log.py             # Rantai Hash SHA-256 Tamper-Evident & Pseudonimisasi
│   │   └── data/
│   │       ├── __init__.py
│   │       └── synthetic_seed.py        # 6 Skenario Kasus Sintetis Sesuai Proposal
│   ├── tests/                           # Automated Pytest Suite (30 Test Cases)
│   │   ├── __init__.py
│   │   ├── test_scoring.py              # Uji Algoritma Triase & Hard Trigger
│   │   ├── test_audit_chain.py          # Uji Integritas Rantai Hash & UU PDP
│   │   ├── test_api.py                  # Uji Endpoint REST API & Simulator
│   │   ├── test_fhir_and_graph.py       # Uji Neo4j Cypher & FHIR SATUSEHAT Bundles
│   │   └── test_geovelocity.py          # Uji Jarak OSRM, Fisika Kecepatan, & Impossible Travel
│   └── requirements.txt
├── frontend/                            # Next.js 16 (Turbopack) + React 19 + Tailwind CSS
│   ├── e2e/                             # Playwright E2E & RPA Automated Suite (7 Test Cases)
│   │   └── verifier_flow.spec.ts        # Automated Verifier Navigation & Modus Audits
│   ├── playwright.config.ts             # Konfigurasi Chromium Headless & Sandbox Flags
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx               # Root Layout & Clean Light Theme (WCAG AA)
│   │   │   ├── globals.css              # Custom Scrollbars & Print Styling
│   │   │   └── page.tsx                 # Layar Terpadu Dashboard Verifikator & KPI Risiko
│   │   ├── components/
│   │   │   ├── TriageQueue.tsx          # Langkah 1: Antrean Triase Hijau/Kuning/Merah
│   │   │   ├── CaseDossier.tsx          # Langkah 2: Berkas Siap-Audit & 3 Lapis Bukti
│   │   │   ├── EpisodeFingerprintGraph.tsx # Visualisasi Topologi Graf Anomali (XAI)
│   │   │   ├── Neo4jCypherModal.tsx     # Dialog Katalog 5 Query Forensik Cypher & Ekspor Neo4j
│   │   │   ├── FhirMcpModal.tsx         # Dialog WSO2 FHIR MCP Server & Inspektur SATUSEHAT
│   │   │   ├── OsrmGeovelocityModal.tsx # Dialog Radar Geovelocity OSRM & Uji Fisika Transit
│   │   │   ├── PlaywrightRpaModal.tsx   # Dialog Robot RPA Playwright MCP & Otomasi Browser
│   │   │   ├── MobileJknSim.tsx         # Simulator Interaktif Konfirmasi Mobile JKN
│   │   │   ├── VerifierAction.tsx       # Langkah 3: Keputusan Human-in-the-Loop
│   │   │   ├── AuditLogViewer.tsx       # Live SHA-256 Tamper-Evident Chain Inspector
│   │   │   ├── ExportDossierModal.tsx   # Pratinjau, Ekspor Cetak, CSV, JSON, & FHIR R4
│   │   │   └── CustomClaimSimulatorModal.tsx # Simulator Mandiri Uji Klaim Baru Real-Time
│   │   ├── data/
│   │   │   └── mockData.ts              # Data Fallback & Sinkronisasi Offline (6 Kasus)
│   │   └── types/
│   │       └── claim.ts                 # Definisi Tipe TypeScript
│   └── package.json
├── start_backend.bat                    # Script cepat jalankan Backend
├── start_frontend.bat                   # Script cepat jalankan Frontend
├── start_all.bat                        # Script cepat jalankan Keduanya
└── README.md
```

---

## 🔬 Spesifikasi Algoritma & Pembuktian Skenario Kasus

### 1. Formulasi Fusi Skor Deterministik
$$S = 0.5 \cdot S_1 + 0.3 \cdot S_2 + 0.2 \cdot S_3 \quad (S \in [0, 100])$$
- **$S_1$ (Bobot 50%) — Lapis 1 Radar Pola Episode:**  
  Menilai anomali klaster spatiotemporal (rasio lonjakan volume terhadap baseline), indikasi upcoding tingkat keparahan, dan indikasi duplikasi penagihan episode yang sama (#11 Repeat Billing).
- **$S_2$ (Bobot 30%) — Lapis 2 Uji Jejak Layanan DPJP:**  
  Merekonsiliasi data penugasan DPJP dengan SATUSEHAT SDMK Kemenkes (status SIP, jam praktik, dan verifikasi geodistance / mustahil tindakan bedah simultan antar-kota).
- **$S_3$ (Bobot 20%) — Lapis 3 Konfirmasi Presensi Peserta:**  
  Menganalisis proporsi sampel terarah notifikasi Mobile JKN yang menyatakan "Tidak Merasa Menerima Layanan".

### 2. Aturan Ambang Jalur & Hard Trigger Independen
- **Jalur Hijau ($S < 50$):** Klaim wajar / baksos resmi terverifikasi $\rightarrow$ Masuk alur verifikasi cepat (*Fast-Track*).
- **Jalur Kuning ($50 \le S < 75$):** Ketidakpastian administratif $\rightarrow$ Klarifikasi berkas faskes secara digital.
- **Jalur Merah ($S \ge 75$):** Sinyal anomali kuat $\rightarrow$ Prioritas telaah mendalam sebelum batas waktu berita acara 10 hari kerja.
- **⚡ Hard Trigger Independen (Lapis 2):**  
  Jika izin praktik (SIP) DPJP terbukti **`EXPIRED`** pada tanggal layanan, klaim **otomatis dinaikkan ke Jalur Merah** ($S \ge 75$), terlepas dari skor lapis lainnya.
- **🛡️ Mitigasi Ketidakpastian Administratif (Prinsip Anti-Bias):**  
  Jika profil DPJP berstatus **`UNSYNCED`** (sedang proses sinkronisasi antrean di SATUSEHAT SDMK Kemenkes), klaim **ditahan di Jalur Kuning**, BUKAN vonis kecurangan sepihak (*Presumption of Good Faith*).

---

## 🧪 6 Skenario Kasus Sintetis Terkalibrasi (Sesuai Proposal)

| ID Klaim | Faskes | INA-CBG & Deskripsi | Skenario Modus | S1 / S2 / S3 | Skor & Jalur | Perilaku Khusus & Mitre F3 |
|---|---|---|---|---|---|---|
| **CLM-2026-8801** | RS Sintetis X (Kelas B) | `Z-3-12-0` Rehabilitasi / Fisioterapi | **#6 Phantom Billing** (Lonjakan 85 klaim baksos) | 85 / 95 / 80 | **87.0 (MERAH)** | **Hard Trigger SIP Expired** + 8/10 sampel Mobile JKN menolak hadir (`FA0002.001`, `F1005.006`) |
| **CLM-2026-8802** | RS Sintetis Y (Kelas C) | `K-4-17-I` Gastroenteritis Ringan | **#11 Repeat Billing** (Episode ganda 3 hari) | 76 / 50 / 45 | **62.0 (KUNING)** | Ditahan di **Kuning** karena status DPJP **UNSYNCED** (bukan vonis fraud; `FA0002.004`) |
| **CLM-2026-8803** | RS Mata Z (Kelas B) | `H-2-36-0` Operasi Katarak | **Kontrol Sah Baksos** (Kegiatan resmi terdaftar) | 30 / 10 / 10 | **20.0 (HIJAU)** | Lonjakan 5x namun terdaftar izin resmi; 10/10 peserta hadir (*Fast-Track*) |
| **CLM-2026-8804** | Klinik Hemodialisa | `N-3-10-0` Hemodialisis Terjadwal | **Kontrol Sah Terapi Kronis** (2x per minggu) | 20 / 10 / 10 | **15.0 (HIJAU)** | Siklus rutin sesuai pedoman klinis; DPJP aktif (*Fast-Track*) |
| **CLM-2026-8805** | RS Daerah Kartini (Kelas B) | `B-1-10-II` Bedah Laparoskopi | **Geodistance Collision / Impossible Travel** | 60 / 96 / 75 | **75.0 (MERAH)** | **Hard Trigger SIP Expired** + Operasi simultan Semarang-Solo selisih 45 mnt (`FA0001.003`) |
| **CLM-2026-8806** | RS Sintetis Medika Prima | `K-1-10-III` Perdarahan Saluran Cerna | **Upcoding Severity Tingkat III** | 92 / 45 / 80 | **75.5 (MERAH)** | Tagihan CBG severity III Rp38,7jt tanpa bukti penunjang di LIS/PACS (`FA0002.002`) |

---

## 📊 Efisiensi Risiko Finansial (Healthkathon Category Alignment)
ClaimTrace menyajikan metrik dampak finansial pra-bayar secara langsung:
1. **Pencegahan Risiko Kebocoran Dana JKN Pra-Bayar:**  
   Menahan tagihan anomali berisiko tinggi (Jalur Merah) senilai total **Rp72.450.000** sebelum berita acara Vedika ditandatangani.
2. **Mitigasi Sengketa Klaim Faskes (Jalur Kuning):**  
   Menyalurkan **Rp1.950.000** klaim ke kanal klarifikasi administratif digital sebelum batas waktu 10 hari kerja tanpa pemotongan sepihak.
3. **Efisiensi Alur Pembayaran Cepat (Fast-Track Hijau):**  
   Mempercepat verifikasi pra-bayar sebesar **Rp6.120.000** bagi faskes dan baksos resmi yang patuh dalam SLA rata-rata &lt; 3 hari kerja.

---

## 🕸️ Rekonsiliasi Graf Neo4j & Integrasi MCP Server
ClaimTrace memetakan jejaring entitas klaim multi-dimensi (Faskes, DPJP, Episode, Klaim, Peserta) ke dalam database graf **Neo4j** dan mendukung protokol resmi **Model Context Protocol (MCP)** melalui `neo4j-mcp-server`:
- **Constraints & Indexes Otomatis:** Skema O(1) traversal (`CREATE CONSTRAINT ... UNIQUE`).
- **Ekspor Script Cypher:** Endpoint `GET /api/v1/graph/cypher-export` menghasilkan script Cypher utuh (`claimtrace_neo4j_graph.cypher`) yang siap dieksekusi di Neo4j Desktop / Bloom.
- **5 Query Forensik Cypher Terkalibrasi:**
  1. *Modus #6 Phantom Billing*: DPJP tercatat simultan di 2 faskes berbeda dalam rentang < 2 jam.
  2. *Geovelocity Anomaly*: Mustahil perpindahan fisik dokter antar-kota (Semarang - Solo).
  3. *Modus #11 Repeat Billing*: Rekurensi tindakan hemodialisis (39.95) dalam interval < 48 jam.
  4. *Upcoding Severity*: CBG Severity III tanpa bukti tindakan penunjang LIS/PACS.
  5. *Fraud Ring Detection*: Klaster sindikat faskes & DPJP dengan konsentrasi klaim Jalur Merah > 60%.

---

## 🏥 Interoperabilitas Nasional Kemenkes SATUSEHAT & WSO2 FHIR MCP Server
ClaimTrace mendukung integrasi nasional Satu Data Kesehatan (Kemenkes RI) dan arsitektur agen berbasis protokol MCP (**WSO2 FHIR MCP Server** `wso2/fhir-mcp-server` v0.10.0):
1. **9 Sumber Daya FHIR R4 Terpadu (`fhir_adapter.py`):**
   - `Patient`: Token NIK & No. Kartu BPJS termasker sesuai UU PDP No. 27/2022.
   - `Practitioner`: Data DPJP dengan verifikasi nomor SIP & SDMK.
   - `Organization`: Fasilitas Kesehatan Rujukan Tingkat Lanjut (FKRTL) & kelas rumah sakit.
   - `Encounter`: Episode rawat inap/jalan, tanggal admisi, dan durasi.
   - `Condition`: Diagnosis primer ICD-10 terverifikasi.
   - `Procedure`: Tindakan medis ICD-9-CM.
   - `Claim`: Rincian finansial klaim, kode tarif INA-CBG, dan total tagihan (IDR).
   - `RiskAssessment`: Hasil triase deterministik ClaimTrace (skor prioritas, jalur warna, SOP rekomendasi).
   - `Provenance`: Segel kriptografis SHA-256 yang menjamin rantai audit tidak dapat diubah.

2. **Native FHIR R4 REST Server (`fhir_server.py`):**
   - `GET /fhir/metadata`: CapabilityStatement resmi yang mengumumkan kapabilitas server kepada klien SMART-on-FHIR / MCP.
   - `GET /fhir/{resource_type}`: Endpoint pencarian standar FHIR (*searchset bundle*).
   - `GET /fhir/{resource_type}/{id}`: Mengambil resource tunggal berdasar ID (misal: `Claim/claim-clm-2026-8801`).
   - `POST /fhir/{resource_type}`: Simulasi create/persist resource.

3. **7 Alat Model Context Protocol (MCP Tools):**
   - `get_capabilities`: Introspeksi skema resource, search parameters, dan operations.
   - `search`: Query resource dengan filter properti dan ekspresi FHIRPath.
   - `read`: Mengambil instans data spesifik berdasar ID.
   - `create`: Menambahkan data rekam/klaim baru.
   - `update`: Memperbarui data resource.
   - `delete`: Menghapus resource.
   - `get_user`: Mengambil konteks identitas pengguna terautentikasi SMART-on-FHIR.

4. **Ekspor & Inspektur Frontend (`FhirMcpModal.tsx`):**
   - Tombol **"SATUSEHAT FHIR MCP"** di header navigasi membuka dialog uji live dan konfigurasi MCP.
   - Tombol **"FHIR R4"** di modal berkas mengunduh Bundle FHIR instan untuk tiap kasus klaim.
   - Endpoint `GET /api/v1/fhir/export-all` mengunduh agregasi seluruh portofolio klaim (`claimtrace_satusehat_fhir_bundle.json`).

---

## 🧭 Verifikasi Geovelocity & Impossible Travel Engine (Project OSRM)
ClaimTrace mengintegrasikan modul **Open Source Routing Machine (OSRM)** (`osrm_geovelocity.py` & `osrm-bindings` C++ v26.10.0) untuk mendeteksi penipuan geografis (**Modus #6 Phantom Billing / SIP Loan**):
1. **Verifikasi Kecepatan Fisika Transit:**
   - Menghitung jarak jalan raya riil ($D_{\text{road}}$) via grafik jaringan jalan OpenStreetMap vs jarak garis lurus Haversine.
   - Menghitung durasi perjalanan normal tol/arteri dan membandingkannya dengan jeda waktu penagihan klaim ($\Delta t$).
   - Menyertakan **Buffer Sterilisasi Medis** (minimal 30 menit untuk cuci tangan steril, scrub-in/out, dan serah terima anestesi).
2. **Kriteria Impossible Travel:**
   $$v_{\text{required}} = \frac{D_{\text{road}}}{\Delta t - T_{\text{scrub}}} > 100 \text{ km/jam}$$
   Jika kecepatan yang dibutuhkan melebihi batas legal jalan tol (100 km/jam) atau waktu transit kurang dari 65% durasi tercepat OSRM untuk jarak $> 10$ km, sistem menetapkan vonis: **`MUSTAHIL SECARA FISIK (IMPOSSIBLE TRAVEL)`** dan mengalihkan kasus ke **Jalur Merah** secara independen.
3. **Komponen Interaktif Frontend (`OsrmGeovelocityModal.tsx`):**
   - Tombol **"Radar Geovelocity OSRM"** di navigasi atas.
   - Pilihan faskes asal & tujuan (Semarang, Surakarta, Yogyakarta, dsb.).
   - Slider jeda waktu klaim (10–240 menit) & buffer medis untuk simulasi skenario real-time.
   - Indikator speedometer & diagram alur transit fisik.

---

## 🤖 Robotic Process Automation (RPA) & Browser Agent (Microsoft Playwright MCP)
ClaimTrace mengintegrasikan server resmi **Microsoft Playwright MCP** (`microsoft/playwright-mcp` via `@playwright/mcp@latest`) sebagai asisten agen peramban untuk verifikator BPJS Kesehatan:
1. **Otomasi Lintas Sistem (BPJS vClaim & Vedika Gateway):**
   - Mengatasi beban kerja manual verifikator yang harus membuka puluhan tab rekam medis dan mencocokkan data tagihan rumah sakit (SIMRS) secara berulang.
   - Menggunakan **Semantic Accessibility Tree Snapshots (`browser_snapshot`)** daripada tangkapan layar mentah (vision LLM), menghemat **95% token AI** dan mengeliminasi risiko halusinasi visual.
2. **Katalog Tools Playwright MCP Aktif (`mcp_config.json`):**
   - `browser_navigate`: Akses terisolasi ke portal vClaim / Vedika.
   - `browser_snapshot`: Ekstraksi struktur semantik berkas SEP dan tarif INA-CBG.
   - `browser_click`: Interaksi presisi pada tombol antrean triase dan verifikasi biner.
   - `browser_fill_form`: Pengisian otomatis berita acara kelengkapan berkas digital.
   - `browser_pdf_save`: Penerbitan berkas alasan kasus siap-audit (audit dossier) dalam format PDF resmi dengan segel SHA-256.
   - `browser_evaluate`: Evaluasi deterministik fusi skor multi-sinyal langsung pada runtime peramban.
3. **Suite Pengujian Otomatis End-to-End (`e2e/verifier_flow.spec.ts`):**
   - Terdiri dari **9 skenario pengujian komprehensif** yang mencakup seluruh alur kerja verifikator (KPI rendering, navigasi triase, anomali #6 Phantom Billing, interaksi modal OSRM radar, introspeksi modal FHIR MCP SATUSEHAT, simulasi kanal Mobile JKN, ekspor berkas audit SHA-256, modal robot RPA Playwright, modal analisis plagiarisme rekam medis ChromaDB, dan modal analitik kolumnar DuckDB OLAP MCP).
   - Seluruh 9 tes lolos 100% (*9 passed in 23.6s*).
4. **Komponen Frontend (`PlaywrightRpaModal.tsx`):**
   - Tombol **"Robot RPA Playwright"** di header navigasi membuka antarmuka simulasi 6 langkah kerja robot verifikator, katalog perkakas MCP, dan penampil kode pengujian TypeScript yang siap disalin untuk integrasi CI/CD BPJS Kesehatan.

---

## 🧠 Mesin Vektor Semantik & Deteksi Plagiarisme Narasi Klinis (ChromaDB v1.5.9)
Pada kecurangan **Modus #6 Phantom Billing**, sindikat faskes nakal atau penyelenggara baksos fiktif kerap mendaftarkan puluhan hingga ratusan peserta palsu. Karena keterbatasan waktu dalam merekayasa berkas fisik, oknum terbukti melakukan *copy-paste* teks resume medis (temuan fisik, rencana terapi, instruksi pasca-bedah) secara massal dan hanya mengganti nama serta NIK pasien.

ClaimTrace mengintegrasikan **ChromaDB Vector Database** (`chroma-core/chroma` v1.5.9) untuk mendeteksi fabrikasi teks klinis secara deterministik:
1. **Ruang Vektor & Model Embedding Lokal:**
   - **Ruang Jarak Vektor:** HNSW dengan metrik *Cosine Similarity* ($\text{Similarity} = 1 - \text{Distance}$).
   - **Model Embedding:** `all-MiniLM-L6-v2` via ONNX Runtime lokal (`~/.cache/chroma/onnx_models/all-MiniLM-L6-v2/`). Berjalan 100% di server lokal BPJS (*Airgapped / On-Premise*) tanpa ketergantungan internet dan tanpa membocorkan teks rekam medis ke API eksternal (Kepatuhan UU PDP No. 27/2022).
2. **Kriteria & Sinyal Kecurangan (`IND-SEM-COPYPASTE`):**
   $$\text{Cosine Similarity} \ge 90.0\% \implies \text{Sinyal IND-SEM-COPYPASTE Aktif}$$
   Jika dua pasien berbeda pada faskes/klaster yang sama memiliki resume medis dengan kemiripan $\ge 90\%$, sistem mengidentifikasi kloning medis fabrikasi, menyematkan tag keamanan MITRE ATT&CK `T1565` (*Medical Records Data Manipulation*), D3FEND `D3-VEC` (*Vector Semantic Cross-Matching*), dan F3 `FA0002.001` (*Phantom Billing Monetization*).
3. **REST Endpoints ChromaDB:**
   - `GET /api/v1/semantic/stats`: Menampilkan status koleksi vektor, total dokumen, model, dan metrik jarak.
   - `GET /api/v1/semantic/resumes`: Mengambil seluruh korpus resume klinis yang terindeks.
   - `GET /api/v1/semantic/verify-claim/{claim_id}`: Melakukan audit vektor pada klaim sasaran terhadap seluruh repositori nasional.
   - `POST /api/v1/semantic/verify-text`: Membandingkan teks resume masukan baru verifikator secara live.
   - `GET /api/v1/semantic/cluster-matrix/{cluster_id}`: Menghasilkan matriks kemiripan pairwise $N \times N$ untuk seluruh klaim dalam satu klaster.
4. **Komponen Interaktif Frontend (`ChromaSemanticModal.tsx`):**
   - Tombol **"ChromaDB Vektor"** di header navigasi.
   - **Tab 1 (Audit Klaim Terpilih):** Menampilkan skor kemiripan tertinggi, persentase diff-ratio, teks narasi sasaran, dan daftar klaim kloning.
   - **Tab 2 (Matriks Kemiripan Klaster $N \times N$ Heatmap):** Tabel warna komparasi antar-pasien (merah $\ge 90\%$ membuktikan kloning massal pada `CLS-PHANTOM-85`, hijau $<70\%$ membuktikan variasi klinis sah pada `CLS-LEGAL-KATARAK`).
   - **Tab 3 (Uji Teks Resume Kustom):** Area uji interaktif bagi verifikator untuk menguji teks baru.
   - **Tab 4 (Spesifikasi Arsitektur Vektor):** Dokumentasi teknis terperinci.

---

## 🦆 Mesin Analitik Kolumnar & MCP Server DuckDB (teaguesterling/duckdb_mcp Spec)
Dalam skala nasional, BPJS Kesehatan memproses jutaan klaim per bulan. Untuk agregasi analitik lintas faskes, simulasi dampak keuangan, dan kueri OLAP berkecepatan tinggi, ClaimTrace mengintegrasikan **DuckDB** (`teaguesterling/duckdb_mcp` v1.5.6) sebagai gudang data analitik (*analytical data warehouse*):
1. **Penyimpanan Kolumnar & Vektor Eksekusi In-Memory:**
   - Menyimpan tabel terstruktur `claims_warehouse` yang mencakup kode INA-CBG, ICD-10, ICD-9-CM, nilai klaim Rupiah, telemetri DPJP, dan status konfirmasi Mobile JKN.
   - Mendukung eksekusi kueri agregasi OLAP sub-milidetik secara lokal tanpa beban server eksternal.
   - Dilengkapi *views* siap-audit: `v_phantom_billing_risk`, `v_repeat_billing_risk`, dan `v_financial_exposure`.
2. **Katalog Tools Analitik Terpublikasi (`mcp_publish_tool` Pattern):**
   - `detect_phantom_billing(surge_threshold)`: Memindai klaster dengan lonjakan klaim massal di atas baseline tanpa izin resmi baksos (#6).
   - `detect_repeat_billing(max_gap_days)`: Mendeteksi klaim ganda berulang pada episode yang sama yang telah ditagihkan (#11).
   - `financial_risk_summary()`: Menghitung total potensi penyelamatan anggaran dana JKN berdasarkan triase (Hijau, Kuning, Merah).
   - `query(sql, format)`: Kueri analitik SQL langsung dengan format fleksibel: JSON, Markdown (hemat token untuk AI), atau CSV.
3. **Server Model Context Protocol (MCP stdio):**
   - Terpasang sebagai server resmi di `~/.gemini/config/mcp_config.json`:
     ```json
     "duckdb": {
       "command": "python3",
       "args": [
         "/mnt/c/Users/Asus/Downloads/ClaimTrace/backend/app/engine/duckdb_mcp_server.py"
       ]
     }
     ```
   - Memungkinkan asisten AI (Claude, Antigravity, agen verifikator) mengkueri repositori klaim secara langsung melalui perkakas MCP standar.
4. **Komponen Interaktif Frontend (`DuckDbMcpModal.tsx`):**
   - Tombol **"DuckDB OLAP MCP"** di navigasi atas.
   - **Tab 1 (Konsol SQL Interaktif):** Tombol preset audit, editor teks SQL dengan penyorotan sintaksis, selector format keluaran (JSON/Markdown/CSV), dan visualisasi tabel dengan format mata uang Rupiah.
   - **Tab 2 (Tools Terpublikasi):** Antarmuka uji live untuk 3 published tools dengan slider parameter.
   - **Tab 3 (Skema Tabel & Views):** Kamus data (*data dictionary*) kolom dan tipe data.
   - **Tab 4 (Konfigurasi DuckDB MCP):** Rujukan konfigurasi JSON-RPC stdio.



---

## 🔒 Tata Kelola, Privasi, & Kepatuhan Yuridis (UU PDP No. 27/2022)
1. **Minimasi Data (Data Minimization):**  
   Notifikasi presensi Mobile JKN hanya memuat pertanyaan biner sederhana (*"Apakah Anda hadir menerima layanan kesehatan pada [Tanggal] di [Faskes]?"*). **Tidak memuat diagnosis klinis, tindakan ICD-9-CM, atau berkas rekam medis sensitif**.
2. **Pemisahan Kriptografis Identitas:**  
   NIK peserta disamarkan melalui enkripsi pseudonim token AES-256 (`AES256_...`).
3. **Jejak Audit Tamper-Evident (SHA-256 Hash Chain):**  
   Setiap evaluasi mesin dan keputusan verifikator dicatat dalam rantai hash tak terputus. Integritas rantai diverifikasi secara otomatis (`verify_integrity()`) untuk keperluan pertanggungjawaban hukum.
4. **Keputusan Tetap di Tangan Manusia (Human-in-the-Loop):**  
   Algoritma hanya menerbitkan *Skor Prioritas Telaah* dan *Berkas Alasan Kasus*, bukan keputusan pemotongan sepihak. Menjamin hak subjek data dan faskes untuk memberikan klarifikasi.

---

## 👥 Tim TINEERENSE — MAN 1 Surakarta
- **Ketua Tim:** Khalaf Faith Pradyatama  
  *Fokus:* Backend API (FastAPI), Software Architecture, Tamper-Evident Security Log, AppSec (AES-256).
- **Anggota Tim:** Gaudiansyah Abiyu Mahya  
  *Fokus:* AI/Scoring Engine, Anomaly Cluster Graph, Synthetic Health Data Simulator, UI/UX Verifier Dashboard.
