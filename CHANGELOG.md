# Catatan Perubahan (Changelog) - ClaimTrace JKN

Semua perubahan terdokumentasi secara kronologis untuk platform **ClaimTrace JKN: Sistem Pendukung Keputusan Verifikator Klaim JKN Berbasis Triase Multi-Sinyal Independen**. Format ini mengacu pada standar *Keep a Changelog* dan mematuhi panduan tata kelola perangkat lunak terintegrasi.

---

## [1.3.0-final-release] - 2026-11-18

### Ringkasan Rilis
Finalisasi antarmuka produksi, kesiapan deployment publik Vercel dengan fallback Sandbox terisolasi, modernisasi JavaScript ES2023+ & Core Web Vitals, serta sinkronisasi dokumentasi dan pengujian otomatis penuh (`434 passed`).

### [Antarmuka, Navigasi, & Pengalaman Pengguna]
- **Penyederhanaan Navigasi & Kebersihan Layout:** Penghapusan banner alur kerja ganda (`WorkflowPipelineBanner`), modal peta alur (`WorkflowMapModal`), tombol `Peta Alur Kerja`, badge `Fokus Prioritas #1`, navigasi horizontal ganda pada header atas, serta penomoran `1–4` pada label menu sidebar utama.
- **Akses Demo 1-Klik & Sandbox Fallback Vercel:** Penambahan dukungan fallback Sandbox terisolasi *lazy-loaded* (`app/src/services/sandboxApiFallback.js`, 132 snapshot endpoint) serta validasi sesi Sandbox Demo (`ct.sandbox.demo`) sehingga seluruh modul (7 Dokumen RS, NLP Klinis, MB1–MB5 & Fornas, BAKB, Forensik) berjalan mulus tanpa error `404 Not Found` baik pada backend live maupun pratinjau publik Vercel.
- **Penegasan Arsitektur AI Lokal & Sandbox:** Pembaruan endpoint `/health` backend (`ai_engine: Local On-Premise`, `environment: Sandbox`) dan dokumentasi `README.md` terkait inferensi NLP/ML lokal tanpa eksfiltrasi cloud (UU PDP No. 27/2022).

### [Modern Web Guidance & Kualitas Kode]
- **Modernisasi JS ES2023+ (0 Temuan `legacy-scan`):** Penggantian `AbortController` + `setTimeout` manual dengan `AbortSignal.timeout(20000)` pada `claimtraceOrchestratorService.js`, penggantian `JSON.parse(JSON.stringify(...))` dengan `structuredClone(...)` pada `sandboxApiFallback.js`, serta migrasi 9 pola `[...arr].sort()` / `.reverse()` ke `.toSorted()` dan `.toReversed()` di komponen Dashboard (`DpjpIntelligence`, `ExecutiveHub`, `FaskesSurveillance`, `RetentionAnalyticsView`, `TriageOverview`).
- **Optimasi LCP & CLS Halaman Masuk:** Penambahan dimensi eksplisit (`width`/`height`), `fetchPriority="high"`, dan `decoding="async"` pada logo utama `SignInPage.jsx`.
- **Kebersihan Repositori:** Pengabaian berkas internal editor dan skrip rekam sementara di `.gitignore` serta pembersihan tautan jalur lokal pada naskah submisi.

### [Verifikasi Akhir]
- **Backend & E2E Pytest:** **434 passed (100% Green)** — `322 passed` (`backend/tests/`) + `112 passed` (`tests_e2e/`).
- **Frontend & Modern Web:** `modern-web-guidance legacy-scan` menunjukkan `0` temuan dari 38 panduan (52 aturan), `npm --prefix app run build` lulus bersih tanpa error.

---

## [1.2.0-field-hardening] - 2026-11-16

### Ringkasan Rilis
Audit dan penguatan menyeluruh kesiapan operasional lapangan BPJS Kesehatan pada branch lokal `dev-local`: konsolidasi kode React, pengamanan RBAC & validasi identifier SQL, pemenuhan WCAG AA dan standar web modern, serta penghapusan berkas dan aset usang.

### [Keamanan, RBAC, & Kebersihan Backend]
- **Validasi Allowlist Identifier Tabel OLAP:** `DuckDbAnalyticsEngine.describe_table` dan rute `GET /api/v1/duckdb/describe/{table_name}` kini memvalidasi regex identifier serta daftar tabel/view aktual di gudang data sebelum eksekusi `DESCRIBE`, mengembalikan HTTP `400` untuk nama tabel tidak sah.
- **Pengetatan RBAC & Guardrail Produksi:** Penegakan hak akses per rute pada `StrictSessionGateMiddleware.dispatch`, penambahan `verify_privilege` eksplisit pada endpoint aturan deteksi, Decision Receipts, Human Gate, telemetri mobile, dan mutasi operasional, serta pengendalian seed demo melalui `CLAIMTRACE_ALLOW_DEMO_ACCOUNTS`.
- **Sanitasi CSV & Perbaikan Narasi:** Netralisasi injeksi formula CSV pada `generate_dossier_csv_report` (`_escape_csv_cell`), perbaikan unpacking token 3-tuple `_resolve_actor`, dan penghapusan karakter em-dash pada keluaran narasi biometrik backend.

### [Modern Web, Aksesibilitas WCAG AA, & Konsolidasi Frontend]
- **Kontras WCAG AA & Standardisasi CSS:** Penyesuaian token warna `--ct-ink-muted` di `DESIGN.md` dan `app/src/styles/clinical-precision.css` (`#526175` untuk mode terang, `#8B95A5` untuk mode gelap, lulus rasio >= 4.5:1), migrasi styling scrollbar standar `scrollbar-width` / `scrollbar-color` dengan fallback `@supports not (scrollbar-color: auto)`, serta `overscroll-behavior: contain` pada modal.
- **Konsolidasi Hooks & Utilitas Terpadu:** Ekstraksi `app/src/hooks/useCockpitTheme.js` (menghapus 22 duplikasi `MutationObserver`), `app/src/hooks/useEscapeKey.js`, serta `app/src/utils/exportCsv.js` untuk seluruh 10 ekspor CSV Dashboard yang tersanitasi.
- **Kepatuhan Keyboard, Dialog, & Tabel Semantik:** Penambahan `role="dialog"`, `aria-modal="true"`, serta penutupan `Escape` pada seluruh modal/drawer Dashboard, pengamanan IME (`isComposing` / `keyCode === 229`) pada handler `Enter`, `autoComplete` form autentikasi, `aria-label` lengkap pada tombol ikon/switch, dan `scope="col"` pada header kolom tabel utama.
- **Pembersihan Aset & Dependensi:** Penghapusan 266 gambar tidak terpakai, 18 berkas font `Montserrat`, 9 berkas Lottie, 11 skrip uji lama, dan 37 paket npm usang; build produksi Vite dan Service Worker v1.4.0 bebas caching JSON `/api/` maupun `/fhir`.

### [Verifikasi Akhir]
- **Backend & API Pytest:** `426 passed` (`backend/tests` + `tests_e2e`), termasuk uji penolakan injeksi `describe_table`, RBAC, dan CSV escaping.
- **Frontend & E2E Browser:** `modern-web-guidance legacy-scan` menunjukkan `0` temuan, `npm audit --omit=dev` menunjukkan `0 vulnerabilities`, `npm run build` lulus (`3016` modul), `verify_claimtrace_stack.py` lulus (`16/16`), dan `npm run test:e2e` lulus penuh pada mode terang/gelap desktop dan mobile `360px`.

---

## [1.1.0-final-defense] - 2026-11-15

### Ringkasan Rilis
Finalisasi menyeluruh sistem produksi, kepatuhan UX Clinical Precision, keamanan autentikasi Fail-Closed 3-Lapis reCAPTCHA, dan materi submisi Final 20 Besar Healthkathon BPJS Kesehatan 2026 (`submissions/healthkathon/deck/TINEERENSE.pdf`).

### [Keamanan Autentikasi & UX Clinical Precision]
- **Fail-Closed Auth & 3-Layer Google reCAPTCHA:** Penegakan login 4-field (`username/NIP`, `email`, `NIP`, `password`) dengan 3 lapisan Google reCAPTCHA (`v2 Checkbox`, `v3 Score`, dan `Enterprise`) pada mode terang bersih (`SignInPage` & lupa/reset password tanpa toggle tema gelap).
- **Eliminasi Slop Visual & Vendor Leaks:** Penghapusan seluruh label merek DBMS eksternal dari antarmuka React serta API deskriptif pengguna, penyeragaman ikon Lucide, dan kepatuhan penuh Zero Emoji Policy.

### [Modul Pra-Adjudikasi & Uji Regresi Final]
- **Integrasi Penuh Sidecar BEA C03.04 & Lapis 4:** Penyelarasan modul `Cek Dokumen RS` (7 berkas RME-TTE & inversi kronologi), `Peringkat Risiko Faskes` (2.091 RS), FairGuard `Z49.1` (`0,0% FPR` pada 512 kasus hard-negative), dan BAHV kolektif bersegel QR SHA-256.
- **Benchmark Ilmiah HKEval & Regresi Penuh:** Validasi `300/300` uji backend + `112/112` uji E2E (`412` total uji lulus), `197` endpoint FastAPI aktif, `16/16` smoke stack check, Precision@50 `86,0%` (`43,0x` Lift), Rupiah Recall@100 `96,8%`, dan Blind Review `95,0%`.
- **Deck Presentasi Final 20 Besar:** Penyusunan & ekspor dek Canva 8-slide resmi (`submissions/healthkathon/deck/TINEERENSE.pdf`) beserta sinkronisasi panduan rekaman video 6 bagian (`<= 10 menit`).

---

## [1.0.0-finalist] - 2026-11-06

### Ringkasan Rilis
Rilis resmi Milestone Finalis Healthkathon BPJS Kesehatan 2026 (Tahap Pembinaan / Coaching & Final Defense). Pembaruan mencakup integrasi penuh Quad-Triangulasi Sinyal, 4 Pilar Ekspansi Pasca-Healthkathon, kepatuhan regulasi kesehatan nasional (Permenkes No. 24/2022, UU PDP No. 27/2022, Fornas KMK HK.01.07/MENKES/200/2020), penguatan keamanan siber sesuai standar OWASP & D3FEND, serta pembersihan aset repositori secara menyeluruh.

---

### [Fitur Baru]
- **Mesin Triase Multi-Sinyal 4 Dimensi (Quad-Triangulasi)**:
  - Validasi aturan klaim deterministik berbasis regulasi BPJS Kesehatan dan Fornas.
  - Deteksi anomali statistik tak terawasi (*Unsupervised ML Anomaly Detection*) dengan isolasi risiko skor outlier.
  - Pemeriksaan integritas semantik rekam medis elektronik (RME) melalui retrieval berbasis vektor (*Semantic RAG*).
  - Trajektori investigasi forensik otonom ReAct 4 skenario dengan kartu observasi terstruktur.
- **Konsol Keputusan Verifikator & Kunci Forensik HITL (Human-In-The-Loop)**:
  - Mekanisme penyegelan bukti klaim (*Seal Ledger*) dengan kriptografi SHA-256 Chained Block.
  - Alur persetujuan bertingkat dengan otorisasi berbasis peran (RBAC) ketat: Verifikator Medis, Verifikator Administrasi, dan Auditor Utama.
  - Penerbitan Berita Acara Klarifikasi Bersama (BAKB) digital instan dalam format standar audit.
- **Suite Ekspansi 4 Pilar Pasca-Healthkathon**:
  - *Pilar 1 - Konsol Analitik Basis Data*: Eksekusi kueri terisolasi hanya-baca (*read-only sandbox*) dengan analisis agregat tren klaim nasional, visualisasi grafik interaktif, dan rekomendasi audit otomatis.
  - *Pilar 2 - Intelijen Mobilitas DPJP (Geovelocity OSRM)*: Pelacakan anomali kecepatan fisik dokter penanggung jawab pelayanan antar-faskes dengan kalkulasi jarak jalan raya OpenStreetMap dan batas ambang kecepatan realistis.
  - *Pilar 3 - Pengawasan Faskes & Profil Risiko*: Dasbor surveilans faskes komprehensif, pemetaan kluster risiko klaim, serta deteksi lonjakan tagihan berulang (*repeat billing*).
  - *Pilar 4 - Konsultasi & Penelusuran Regulasi Interaktif*: Asisten percakapan berbasis penalaran regulasi mendalam untuk verifikator dengan sitasi pasal hukum otomatis.
- **Verifikasi Biometrik FRISTA & Telemetri Mobile D3MFA**:
  - Simulasi otentikasi multi-faktor adaptif dengan analisis postur perangkat, deteksi jailbreak/root, dan validasi kehadiran fisik pasien.

---

### [Peningkatan Sistem & Arsitektur]
- **In-Process High Performance Data Engine**:
  - Migrasi seluruh analitik agregat dan pemrosesan dataset klaim skala besar ke mesin data in-process berkecepatan tinggi tanpa dependensi jaringan eksternal.
  - Pengurangan latensi pemrosesan analitik agregat hingga di bawah 150 milidetik.
- **Standarisasi Desain Domain & Glosarium Ubiquitous**:
  - Implementasi glosarium istilah domain resmi (`GLOSSARY.md`) yang menyelaraskan terminologi teknis, klinis, dan hukum perasuransian sosial.
  - Dokumentasi keputusan arsitektur resmi (*Architectural Decision Records* / ADR) dari ADR-001 hingga ADR-004 mencakup arsitektur triase, ledger kriptografi, batas privasi RME, dan tata kelola RBAC.
- **Pembersihan Repositori & Efisiensi Aset**:
  - Pembersihan lebih dari 180 MB file biner sementara, artefak kompilasi usang, cache usang, dan cadangan lokal.
  - Restrukturisasi aturan `.gitignore` agar aset esensial terdokumentasi rapi tanpa membebani repositori.

---

### [Keamanan & Kepatuhan Regulasi]
- **Penguatan Keamanan Siber (Cloudflare & D3FEND Audit)**:
  - Penegakan kebijakan CORS ketat dengan validasi origin eksplisit pada seluruh endpoint API backend.
  - Pembatasan laju permintaan (*Rate Limiting*) adaptif untuk mencegah serangan brute force dan manipulasi payload.
  - Penambahan header keamanan tingkat lanjut: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, dan `Strict-Transport-Security`.
- **Kepatuhan Privasi Data Medis (UU PDP No. 27/2022 & Permenkes No. 24/2022)**:
  - Pseudonimisasi NIK dan nomor kartu peserta pada seluruh log aplikasi dan tampilan antarmuka pengguna.
  - Audit trail tak terubahkan (*immutable chained ledger*) mencatat setiap aksi persetujuan, penolakan, atau klarifikasi verifikator.
- **Penyelarasan Fornas (KMK HK.01.07/MENKES/200/2020)**:
  - Validasi otomatis restriksi Peresepan Maksimal (PRB), kesesuaian diagnosis primer ICD-10 dengan kode tindakan ICD-9-CM.

---

### [Perbaikan & Refactoring]
- **Eliminasi Kebocoran Vendor AI & DBMS (Vendor-Agnostic UI)**:
  - Penghapusan seluruh label nama merek vendor model AI dan penyedia komersial dari tabel dan dasbor antarmuka.
  - Penyeragaman label internal menjadi istilah formal bahasa Indonesia: "Sistem Triase Mandiri", "Model Prediksi AI Terverifikasi", dan "Mesin Basis Data Terpadu".
- **Perbaikan Lapisan Tampilan Antarmuka (UI Polish & Accessibility)**:
  - Perbaikan tumpang tindih indeks-z (*z-index backdrop*) pada panel laci (*drawer*) dan dialog modal agar tidak menghalangi navigasi utama.
  - Optimalisasi kontras warna teks tombol aksi pada mode terang (*light mode*) dan mode gelap (*dark mode*) sesuai standar WCAG 2.1 AA.
  - Penggantian kode status internal dengan teks deskriptif berbahasa Indonesia (misal: "Siap Diverifikasi", "Memerlukan Klarifikasi", "Disetujui").
- **Audit Otomasi WebApp & Pengujian Menyeluruh**:
  - Verifikasi otomatis 9 tampilan utama melalui audit headless browser dengan 0 error konsol dan 0 kegagalan rute.
  - Kelulusan 100% pada suite pengujian otomatis backend (113 dari 113 uji lolos tanpa regresi).
  - Verifikasi build frontend berbasis Vite berjalan mulus tanpa peringatan modul kritis.
