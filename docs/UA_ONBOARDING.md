# Panduan Onboarding Kode Program (Understand-Anything Onboarding Guide) - ClaimTrace JKN

Dokumen ini disusun secara otomatis melalui analisis graf pengetahuan arsitektur (**Understand-Anything Knowledge Graph**) untuk memandu pengembang baru, verifikator medis, dan tim penilai teknis dalam memahami struktur sistem **ClaimTrace JKN**.

---

## 1. Ringkasan Proyek (Project Overview)

- **Nama Proyek**: `claimtrace-jkn`
- **Deskripsi**: ClaimTrace JKN: Sistem Pendukung Keputusan Verifikator Klaim JKN Berbasis Triase Multi-Sinyal Independen
- **Bahasa Pemrograman**: Python, JavaScript/JSX, Shell, Markdown, YAML
- **Kerangka Kerja & Pustaka Utama**: FastAPI, React 18, Vite, TailwindCSS, Zustand, Lucide Icons, Scikit-Learn (Isolation Forest), ChromaDB, Uvicorn, Pytest
- **Komitmen Git Terverifikasi**: `fe1e3447c3c83daa9be4c4bc699b338ff6eec1e2` (Branch: `dev-local`)

---

## 2. Lapisan Arsitektur (Architectural Layers)

Graf pengetahuan memetakan seluruh modul ke dalam 6 lapisan arsitektur independen yang terisolasi secara modular:

### Lapisan 1: Presentasi & Kokpit Verifikator (`layer:presentation-ui`)
- **Deskripsi**: Antarmuka pengguna responsif berbasis web untuk verifikator klaim, memuat Decision Console, Executive Hub, Audit Ledger Inspector, dan simulasi Mobile JKN.
- **Modul Kunci**:
  - `file:app/src/App.jsx` - Root routing dan manajemen state global dashboard.
  - `file:app/src/components/Dashboard/DecisionConsole.jsx` - Kokpit utama verifikator untuk menelaah sinyal triase dan mengeksekusi persetujuan klaim.
  - `file:app/src/components/Dashboard/ExecutiveHub.jsx` - Dasbor postur eksekutif menampilkan ringkasan metrik finansial, volume, dan efektivitas triase.
  - `file:app/src/components/Dashboard/AuditLedger.jsx` - Penampil rantai blok audit SHA-256 dan penerbit Berita Acara Klarifikasi Bersama (BAKB).
  - `file:app/src/components/Dashboard/DpjpIntelligence.jsx` - Panel intelijen mobilitas fisik dokter DPJP dengan visualisasi peta rute.
  - `file:app/src/components/Dashboard/FaskesSurveillance.jsx` - Dasbor surveilans risiko fasilitas kesehatan dan pola tagihan berulang.
  - `file:app/src/components/Dashboard/ConversationsView.jsx` - Asisten konsultasi regulasi interaktif berbasis sitasi pasal hukum BPJS.
  - `file:app/src/components/Dashboard/DatabaseViewerView.jsx` - Konsol kueri analitik basis data terisolasi mode hanya-baca.

### Lapisan 2: Gateway API & Keamanan Siber D3FEND (`layer:api-and-security`)
- **Deskripsi**: Pintu gerbang API berbasis FastAPI dengan penegakan pertahanan berlapis sesuai standar OWASP API Top 10 dan kerangka D3FEND.
- **Modul Kunci**:
  - `file:backend/app/main.py` - Inisialisasi aplikasi, middleware CORS eksplisit, registrasi router, dan penanganan exception terpadu.
  - `file:backend/app/security/access_control.py` - Otorisasi Role-Based Access Control (RBAC) bertingkat (Verifikator Medis, Administrasi, Auditor).
  - `file:backend/app/security/privacy_guard.py` - Scrubber data pribadi (Zero-PHI) dan pseudonimisasi NIK/Nomor Kartu sesuai UU PDP No. 27/2022.
  - `file:backend/app/security/audit_log.py` - Pencatatan bukti audit tak terubahkan (*tamper-evident immutable ledger*).
  - `file:backend/app/security/rate_limiter.py` - Pembatasan laju permintaan adaptif untuk perlindungan endpoint dari serangan abuse.
  - `file:backend/app/security/security_headers.py` - Header proteksi HTTP (CSP, X-Content-Type-Options, HSTS).
  - `file:backend/app/security/sql_guard.py` - Pengecekan sintaksis kueri untuk mencegah eksploitasi injeksi SQL pada konsol basis data.
  - `file:backend/app/security/prompt_guard.py` - Filter sanitasi input AI untuk mencegah kebocoran konteks dan prompt injection.

### Lapisan 3: Triase Multi-Sinyal & Kecerdasan Buatan (`layer:triage-intelligence`)
- **Deskripsi**: Mesin pemrosesan klaim otomatis 4 dimensi independen untuk mendeteksi potensi kecurangan atau inkonsistensi medis.
- **Modul Kunci**:
  - `file:backend/app/engine/rule_engine.py` - Mesin aturan deterministik berbasis kepatuhan regulasi BPJS dan restriksi obat Fornas.
  - `file:backend/app/engine/ai_anomaly_detector.py` - Detektor anomali statistik tak terawasi menggunakan algoritma Isolation Forest.
  - `file:backend/app/engine/chroma_semantic.py` - Mesin retrieval semantik berbasis vektor (ChromaDB) untuk validasi resume medis (RME).
  - `file:backend/app/engine/scoring.py` - Agregator pembobotan sinyal terkalibrasi menjadi skor risiko triase tunggal (Hijau, Kuning, Merah).
  - `file:backend/app/engine/agent_orchestrator.py` - Orkestrator agen forensik ReAct (Reasoning and Acting) untuk investigasi bukti otonom.
  - `file:backend/app/engine/icd10_service.py` - Layanan kodifikasi terminologi medis ICD-10 dan ICD-9-CM standar Kemenkes.

### Lapisan 4: Analitik Forensik, Graf & Interoperabilitas (`layer:analytics-and-graph`)
- **Deskripsi**: Mesin pemrosesan analitik agregat *in-process*, pemodelan relasi episode pasien, dan interoperabilitas standar FHIR R4.
- **Modul Kunci**:
  - `file:backend/app/engine/duckdb_analytics.py` - Mesin data in-process berkecepatan tinggi untuk eksekusi kueri agregat volume besar tanpa latensi jaringan.
  - `file:backend/app/engine/osrm_geovelocity.py` - Mesin kalkulasi kecepatan fisik DPJP berbasis jarak rute jalan raya riil (OpenStreetMap OSRM).
  - `file:backend/app/engine/episode_graph.py` - Graf relasi episode pelayanan pasien untuk mendeteksi fragmentasi klaim (*unbundling*).
  - `file:backend/app/engine/fhir_adapter.py` - Adapter interoperabilitas standar HL7/FHIR R4 untuk integrasi SATUSEHAT Kemenkes.
  - `file:backend/app/engine/prometheus_metrics.py` - Eksportir telemetri performa dan metrik pemantauan operasional.

### Lapisan 5: Pengujian & Jaminan Mutu Otomatis (`layer:tests-and-quality`)
- **Deskripsi**: Suite pengujian unit, integrasi, dan verifikasi webapp menyeluruh dengan kepastian 100% lulus tanpa regresi.
- **Modul Kunci**:
  - `file:backend/tests/test_api.py` - Pengujian endpoint HTTP REST API dan validasi payload.
  - `file:backend/tests/test_security_and_rules.py` - Verifikasi aturan deterministik dan batasan keamanan RBAC.
  - `file:backend/tests/test_ai_anomaly_detector.py` - Pengujian akurasi deteksi anomali Isolation Forest.
  - `file:backend/tests/test_geovelocity.py` - Pengujian kalkulasi batas ambang kecepatan fisik dokter.
  - `file:backend/tests/test_audit_chain.py` - Verifikasi integritas hash SHA-256 pada rantai blok audit.
  - `file:app/tests/verify_all_frameworks.js` - Pengujian headless browser otomatis untuk 9 tampilan dashboard utama.

### Lapisan 6: Tata Kelola, Arsitektur & Regulasi (`layer:architecture-and-governance`)
- **Deskripsi**: Dokumentasi hukum, glosarium domain ubiquitous, keputusan desain arsitektur (ADR), dan catatan rilis resmi.
- **Modul Kunci**:
  - `document:README.md` - Gambaran umum sistem, panduan instalasi, dan arsitektur tingkat tinggi.
  - `document:CHANGELOG.md` - Catatan rilis resmi Milestone Finalis Healthkathon 2026.
  - `document:GLOSSARY.md` - Glosarium istilah domain resmi menyelaraskan terminologi teknis, klinis, dan hukum JKN.
  - `document:docs/adr/0001-quad-triangulation-triage.md` - Keputusan Arsitektur ADR-001 tentang Triase Multi-Sinyal 4 Dimensi.
  - `document:docs/adr/0002-tamper-evident-audit-chain.md` - Keputusan Arsitektur ADR-002 tentang Rantai Ledger Audit Kriptografis SHA-256.
  - `document:docs/adr/0003-zero-phi-scrubber-and-pseudonymization.md` - Keputusan Arsitektur ADR-003 tentang Batas Privasi RME (UU PDP No. 27/2022).
  - `document:docs/adr/0004-high-performance-embedded-analytical-store.md` - Keputusan Arsitektur ADR-004 tentang Mesin Analitik In-Process.

---

## 3. Konsep Kunci Sistem (Key Architectural Concepts)

1. **Quad-Triangulasi Sinyal**:
   Alih-alih bergantung pada satu model probabilistik yang rentan halusinasi, klaim dinilai dari 4 sudut pandang independen: aturan kepatuhan deterministik, anomali statistik riwayat klaim, relevansi semantik resume klinis, dan investigasi pembuktian agen otonom.
2. **Human-In-The-Loop (HITL) dengan Segel Kriptografis**:
   AI tidak pernah mengambil keputusan final secara sepihak. AI bertindak sebagai pendukung keputusan (*decision support*), sementara verifikator manusia memegang kewenangan akhir. Setiap tindakan verifikator disegel dalam rantai blok audit SHA-256 yang tidak dapat dimanipulasi (*tamper-evident*).
3. **Privasi Tanpa Kompromi (Zero-PHI Architecture)**:
   Sesuai amanat UU Perlindungan Data Pribadi No. 27/2022, data sensitif pasien (NIK, Nomor Kartu, Nama Lengkap) dipseudonimkan sebelum diolah oleh mesin analitik atau ditampilkan ke log sistem.
4. **Kecepatan Fisik DPJP (Geovelocity OSRM)**:
   Inovasi pelacakan mobilitas fisik dokter antar-rumah sakit menggunakan data jarak jalan raya nyata (OpenStreetMap) untuk membuktikan apakah tindakan medis di faskes berbeda mungkin dilakukan secara fisik oleh dokter yang sama.

---

## 4. Panduan Penelusuran Terarah (Guided Walkthrough Tour)

Untuk mempelajari kode program secara terstruktur, ikuti urutan langkah berikut:

- **Langkah 1: Tinjauan Umum Proyek & Milestone Finalis**
  Pelajari [README.md](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/README.md), [CHANGELOG.md](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/CHANGELOG.md), dan [GLOSSARY.md](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/GLOSSARY.md).
- **Langkah 2: Landasan Keputusan Arsitektur (ADR)**
  Pelajari dokumen ADR di folder `docs/adr/` untuk memahami alasan di balik pemilihan arsitektur triase dan ledger.
- **Langkah 3: Gateway Backend & Pengamanan Siber**
  Periksa [`backend/app/main.py`](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/backend/app/main.py) dan modul di `backend/app/security/`.
- **Langkah 4: Mesin Triase Multi-Sinyal**
  Pelajari cara kerja penilaian di [`backend/app/engine/rule_engine.py`](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/backend/app/engine/rule_engine.py), [`backend/app/engine/ai_anomaly_detector.py`](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/backend/app/engine/ai_anomaly_detector.py), dan [`backend/app/engine/scoring.py`](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/backend/app/engine/scoring.py).
- **Langkah 5: Mesin Forensik Lanjutan & Geovelocity**
  Tinjau modul [`backend/app/engine/osrm_geovelocity.py`](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/backend/app/engine/osrm_geovelocity.py) dan [`backend/app/engine/episode_graph.py`](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/backend/app/engine/episode_graph.py).
- **Langkah 6: Kokpit Keputusan Verifikator**
  Buka komponen antarmuka di [`app/src/components/Dashboard/DecisionConsole.jsx`](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/app/src/components/Dashboard/DecisionConsole.jsx) dan [`app/src/components/Dashboard/AuditLedger.jsx`](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/app/src/components/Dashboard/AuditLedger.jsx).
- **Langkah 7: Suite Ekspansi Pasca-Healthkathon**
  Eksplorasi 4 pilar ekspansi pada [`DatabaseViewerView.jsx`](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/app/src/components/Dashboard/DatabaseViewerView.jsx), [`DpjpIntelligence.jsx`](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/app/src/components/Dashboard/DpjpIntelligence.jsx), [`FaskesSurveillance.jsx`](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/app/src/components/Dashboard/FaskesSurveillance.jsx), dan [`ConversationsView.jsx`](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/app/src/components/Dashboard/ConversationsView.jsx).

---

## 5. Titik Kompleksitas Tinggi (Complexity Hotspots)

Modul-modul berikut memiliki kompleksitas logika tinggi dan memerlukan perhatian khusus saat melakukan modifikasi:

1. **`backend/app/engine/osrm_geovelocity.py`**
   - *Alasan*: Menangani koordinat geospasial faskes di seluruh Indonesia, estimasi waktu perjalanan berbasis OSRM, dan kalkulasi batas ambang kecepatan fisik yang realistis.
2. **`backend/app/engine/rule_engine.py`**
   - *Alasan*: Berisi ratusan aturan deterministik berbasis Fornas KMK HK.01.07/MENKES/200/2020 dan kode INA-CBG yang harus presisi 100%.
3. **`backend/app/engine/agent_orchestrator.py`**
   - *Alasan*: Mengatur siklus inferensi multi-langkah ReAct dan sintesis kartu observasi bukti forensik klaim.
4. **`app/src/components/Dashboard/DecisionConsole.jsx`**
   - *Alasan*: Pusat integrasi seluruh state sinyal triase, visualisasi trajektori ReAct, formulir telaah klinis, dan antarmuka persetujuan verifikator.
