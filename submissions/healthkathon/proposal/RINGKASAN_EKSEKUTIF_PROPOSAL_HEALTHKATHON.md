# RINGKASAN EKSEKUTIF PROPOSAL INOVASI HEALTHKATHON 2026
## Proyek: CLAIMTRACE — Decision Support System Deteksi Anomali Klaim Faskes Pra-Bayar Berbasis AI
**Kategori Utama:** Efisiensi Risiko pada Fasilitas Kesehatan (FKRTL)  
**Sub-Kategori Fokus:** #6 Phantom Billing (Klaim Fiktif Fisioterapi/Baksos) & #11 Repeat Billing (Penagihan Klaim Berulang)  
**Nama Tim:** TINEERENSE  
**Institusi Asal:** MAN 1 Surakarta  
**Ketua Tim:** Khalaf Faith Pradyatama (Lead Systems Architect & AppSec Engineer)  
**Anggota Tim:** Gaudiansyah Abiyu Mahya (AI/ML Engineer & Healthcare Data Analyst)  
**Tautan Live Web App:** https://claimtrace-healthkathon.vercel.app/  
**Tautan Repositori GitHub:** https://github.com/lombeytjhtt96-glitch/ClaimTrace  

---

## 1. IDENTITAS INOVASI & VALUE PROPOSITION

### 1.1 Satu Kalimat Nilai Utama
> "Inovasi ini membantu verifikator BPJS agar mempermudah dalam mendeteksi anomali klaim faskes secara otomatis berbasis Artificial Intelligence."

### 1.2 Deskripsi Singkat
ClaimTrace adalah Decision Support System (DSS) berbasis Artificial Intelligence yang dirancang untuk memperkuat fungsi pengawasan verifikator BPJS Kesehatan pada tahap pra-bayar (pre-payment screening). Sistem ini menggabungkan machine learning Isolation Forest untuk deteksi anomali statistik volume/biaya, ChromaDB vector embeddings (all-MiniLM-L6-v2) untuk mendeteksi kesamaan resume medis lintas pasien, serta penelusuran graf relasi untuk mendeteksi klaim berulang (Repeat Billing) dan mustahil jarak tempuh fisik DPJP.

Keunggulan utama sistem ini terletak pada **Arsitektur Quad-Triangulation (4 Sinyal Independen pada Ekosistem BEA C01-S06)**:
1. **Lapis 1 (Analitik Pola Klaim Spatiotemporal, Semantic Embeddings & Isolation Forest):** Menganalisis lonjakan klaster klaim serentak (`>= 3,0x` baseline), *Episode Fingerprint* klaim ganda hari sama/berulang (`<= 30` hari), deteksi *upcoding* keparahan INA-CBG (`FKL23` vs `FKL24`), pengecualian adil terapi kronis PRB/Hemodialisis (`Z49.1`)/Kemoterapi (`Z51.1`), serta kesamaan semantik berkas medis (`cosine similarity`).
2. **Lapis 2 (Validasi Jejak Eksternal SATUSEHAT SDMK & OSRM Geovelocity):** Memverifikasi keaktifan Surat Izin Praktik (SIP) dokter penanggung jawab pelayanan (DPJP) pada tanggal layanan (`EXPIRED` memicu *Hard Trigger* Jalur Merah; `UNSYNCED` diarahkan ke klarifikasi Jalur Kuning), beban pasien `> 40`/hari, serta kecepatan perpindahan antar-RS yang tidak mungkin secara fisik (`> 110 km/jam`).
3. **Lapis 3 (Telemetri & Konfirmasi Mandiri Peserta Mobile JKN - Zero-PHI):** Mengirimkan notifikasi biner 1-klik (`Hadir` / `Tidak Pernah`) langsung ke aplikasi Mobile JKN peserta tanpa membocorkan diagnosis ICD-10 (kepatuhan UU PDP No. 27/2022).
4. **Lapis 4 (Verifikasi Biometrik FRISTA & Audit RME-TTE):** Mengaitkan log presensi biometrik wajah FRISTA di faskes dengan koherensi RME-TTE serta mensintesis draf Berita Acara Hasil Verifikasi / Klarifikasi Bersama (BAHV/BAKB) QR SHA-256 tahan manipulasi.

### 1.3 Tujuan Strategis Terukur
1. **Mendeteksi anomali klaim secara otomatis sebelum klaim dibayarkan:** Menghentikan kebocoran dana amanat umat di gerbang pra-bayar tanpa membebani proses verifikasi rutin.
2. **Memvalidasi jejak operasional faskes secara lintas sumber:** Menghilangkan kelemahan verifikasi konvensional yang hanya bergantung pada berkas fisik sepihak faskes.
3. **Menghasilkan berkas siap audit yang objektif dan transparan bagi verifikator:** Mengurangi durasi telaah hingga 72% sekaligus menyegel setiap putusan ke dalam audit ledger kriptografi SHA-256 yang sah di mata hukum.

---

## 2. LATAR BELAKANG, URGENSI, & ANALISIS DAMPAK RISIKO (KRITERIA 2)

### 2.1 Konteks Masalah Nasional
Program Jaminan Kesehatan Nasional (JKN) yang diselenggarakan BPJS Kesehatan melayani lebih dari 275 juta peserta dengan frekuensi pemanfaatan mencapai lebih dari 1,9 juta layanan per hari di ribuan faskes mitra se-Indonesia. Dalam ekosistem berskala masif tersebut, pengawasan integritas klaim menghadapi tantangan luar biasa:
- **Temuan Riil KPK dan Kementerian Kesehatan (Juli 2024):** Mengungkap dugaan klaim fiktif (Phantom Billing) mencapai ±Rp34 Miliar pada 3 rumah sakit khusus, dengan modus manipulasi data bakti sosial dan penagihan fisioterapi tanpa pasien riil.
- **Batasan Ketat SLA Verifikator:** Pasal 74 Perpres No. 82 Tahun 2018 menetapkan BPJS Kesehatan wajib membayar klaim faskes dalam tempo maksimal 15 hari kalender (dengan SLA verifikasi internal 10 hari kerja). Verifikator manusia harus menelaah ratusan bundel rekam medis dan klaim INA-CBG setiap hari, sehingga pemeriksaan forensik yang mendalam terhadap setiap klaim menjadi sangat sulit dilakukan secara manual.
- **Keterbatasan Verifikasi Sepihak:** Klaim konvensional diverifikasi hanya berdasarkan resume medis yang diterbitkan faskes penagih. Jika faskes melakukan kolusi fabrikasi berkas internal, dokumen akan tampak lengkap secara administratif namun palsu secara substantif.

### 2.2 Dampak Kuantitatif Terukur (Sebelum vs Sesudah)

| Indikator Evaluasi | Kondisi Saat Ini (Tanpa ClaimTrace) | Dengan Implementasi ClaimTrace | Peningkatan Kinerja |
| :--- | :--- | :--- | :--- |
| **Durasi Telaah Klaim Anomali** | 15 - 25 menit per berkas kasus | **< 2 menit per klaster kasus** | **Menjaga SLA 10 Hari Kerja Perpres 82/2018** |
| **Penyelamatan Dana & Eksposur Empiris** | Kebocoran baru terdeteksi audit pasca-bayar | **Rp 34,66 Miliar terdeteksi** di gudang data (`Rp 32,59 M` klaim ganda + `Rp 2,07 M` selisih tarif) | **Mitigasi Kebocoran Pra-Bayar** |
| **Ketepatan & Keadilan Triase (HKEval)** | > 12% klaim sah tertahan (*alert fatigue*) | **Precision@50 = 86,0%** (`43/50`, Lift `43,0x`), **0,00% FPR Hard-Negative** (`Z49.1`/`Z51.1`/`I69.3`), **99,90% lolos cepat** | **Zero-Friction bagi Faskes Patuh** |
| **Integritas Jejak Audit Telaah** | Catatan manual di spreadsheet / form internal | **Ledger Kriptografi SHA-256 Anti-Tamper** | **Kekuatan Bukti Hukum Anti-Repudiasi** |
| **Keterlibatan Peserta (Citizen Audit)**| Pasif, hanya menerima layanan | **Aktif via Notifikasi Reaktif Mobile JKN** | **Audit Partisipatif Multi-Pihak** |

---

## 3. KREATIVITAS, INOVASI, & TEKNOLOGI (KRITERIA 3)

### 3.1 Algoritma Deteksi Anomali AI Multi-Dimensi
Sistem ClaimTrace tidak mengandalkan aturan statis (if-else tunggal), melainkan menerapkan arsitektur AI hibrida:
- **scikit-learn Isolation Forest:** Melakukan pemindaian anomali tanpa pengawasan (unsupervised anomaly detection) terhadap 8 parameter kuantitatif (volume klaim harian, rasio kasus khusus, deviasi durasi rawat, skor kepadatan spasial, frekuensi klaim berulang, varians tarif INA-CBG, selisih jam pelayanan, dan indeks beban kerja dokter).
- **ChromaDB Cosine Vector Embeddings (`all-MiniLM-L6-v2`):** Menganalisis teks naratif resume medis, keluhan utama, dan catatan fisioterapi. Model mendeteksi kesamaan semantik di atas 90% antar-pasien dalam faskes yang sama, yang merupakan ciri khas fabrikasi teks secara terpusat (copy-paste syndication).
- **Graph Sequence Traversal (NetworkX):** Memetakan relasi jaringan antara Nomor Peserta, Kode Faskes, dan Nomor SIP DPJP. Mengidentifikasi kondisi impossible physical travel (dokter tercatat melayani di dua faskes berjarak >30 km dalam selang waktu <30 menit) serta siklus klaim berulang (#11 Repeat Billing).
- **Explainable AI (XAI) Attribution:** Setiap hasil pemindaian AI menyertakan dekomposisi kontribusi fitur penyebab anomali, memberikan rekomendasi investigasi klinis yang jelas bagi verifikator.

### 3.2 Formula Fusi Risiko Deterministik (Skala 0 - 100)
Model fusi risiko menggabungkan skor dari tiga komponen sinyal inti menjadi skor komposit terkalibrasi (`0 - 100`):
$$S = 0{,}50 \cdot S_1 + 0{,}30 \cdot S_2 + 0{,}20 \cdot S_3$$
Dengan pembobotan resmi ($w_1 = 0,50$ Pola Klinis & Episode, $w_2 = 0,30$ Legalitas SIP SATUSEHAT & Geovelocity, $w_3 = 0,20$ Telemetri Mobile JKN + Penguatan Biometrik FRISTA Lapis 4), klaim dipilah ke dalam 3 jalur penanganan:
- **Jalur Hijau (Skor 0,0 - 49,9):** Tingkat anomali rendah, klaim lolos verifikasi pra-bayar secara cepat (*Fast-Track* < 24 jam).
- **Jalur Kuning (Skor 50,0 - 74,9 atau Status DPJP `UNSYNCED`):** Indikasi ketidaksinkronan administratif atau perlunya klarifikasi berkas; faskes diberikan ruang klarifikasi digital tanpa vonis sepihak.
- **Jalur Merah (Skor 75,0 - 100,0 atau *Hard Trigger* `SIP EXPIRED`):** Indikasi kuat anomali kritis atau pelanggaran SIP kedaluwarsa (`EXPIRED` memaksa skor minimal `75,0`), klaim ditunda pembayarannya (`HOLD_BAKB`) dan dialihkan ke audit investigasi dengan Berita Acara QR SHA-256.

### 3.3 Keamanan Data & Kepatuhan Hukum
- **Kepatuhan Penuh UU PDP No. 27/2022:** Menerapkan asas minimasi data dan perlindungan data pribadi kesehatan spesifik. NIK dan Nomor Kartu JKN dipseudonimisasi menggunakan salted cryptographic hashing sebelum diproses mesin analitik.
- **Enkripsi Ganda:** Data at-rest dilindungi enkripsi AES-256-GCM, seluruh kanal transit menggunakan TLS 1.3.
- **Etika Human-in-the-Loop (HITL):** Mesin AI bertindak murni sebagai pemberi saran keputusan (Decision Support System). Otorisasi penolakan atau pembayaran klaim secara mutlak berada di tangan verifikator manusia berwenang.

---

## 4. KESIAPAN PRODUK & BUKTI PENGUJIAN SISTEM (KRITERIA 1)

### 4.1 Status Kesiapan Produk & Keamanan
- **Arsitektur Production-Grade On-Premise & Hybrid:** Mendukung pengoperasian penuh secara lokal/on-premise di infrastruktur BPJS Kesehatan serta demonstrasi publik (`https://claimtrace-healthkathon.vercel.app/`).
- **Backend API & Basis Data Analitik:** Dibangun dengan Python FastAPI (`197` endpoint API), gudang data analitik OLAP kolumnar in-memory terintegrasi (`6.264.346` total baris, `1.699.219` klaim FKRTL), scikit-learn Isolation Forest, ChromaDB semantic embeddings, OSRM geovelocity, FHIR R4, serta autentikasi **Fail-Closed NIP + reCAPTCHA 3 Lapis (v2, v3, Enterprise) + MFA 3-Tahap**.
- **Cockpit Verifikator Clinical Precision & Mobile JKN Simulator:** Mengintegrasikan 9 modul kerja terstruktur (`Alur Kerja Utama`, `Alat Investigasi`, `Laporan & Audit`) berdampingan dengan Mobile JKN Simulator interaktif.

### 4.2 Hasil Uji Benchmark HKEval & Integritas Suite Otomatis
Evaluasi dilakukan secara empiris pada benchmark **HKEval (`4.341` klaim holdout dengan `2%` prevalensi anomali realistis)** dan gudang data terintegrasi (`1.699.219` klaim FKRTL across `2.091` faskes):
- **Precision@50 = 86,0% (`43/50`) | Lift Ratio = 43,0x | PR-AUC = 0,884:** Kemampuan sistem memusatkan perhatian verifikator pada klaster anomali paling berisiko di urutan teratas.
- **Rupiah Recall@50 = 66,3% (`k=100`: 91,4%) & Holdout Recall@87 = 95,4%:** Menangkap mayoritas nilai kerugian potensial sebelum keluar kas DJS.
- **FairGuard Hard-Negative FPR = 0,00%:** Terbukti tidak menghukum klaim sah berbiaya tinggi yang berulang secara terprogram (Kemoterapi `Z51.1`, Hemodialisis `Z49.1`, Rehab Pasca-Stroke `I69.3`, baksos resmi, maupun DPJP `UNSYNCED`).
- **Automated Test Suite Integrity (412/412 Passed):** `300` uji unit & integrasi backend (`backend/tests/`) + `112` uji end-to-end Tier 1-4 (`tests_e2e/`) serta verifikasi internal stack `16/16` berstatus **100% Lulus (0 gagal)**.

---

## 5. MODEL BISNIS, KEBERLANJUTAN, & RENCANA IMPLEMENTASI (KRITERIA 4)

### 5.1 Karakteristik Non-Disruptive Middleware
ClaimTrace tidak menuntut penggantian sistem core BPJS yang sedang berjalan. Sistem ini diposisikan sebagai middleware analitik yang bertindak sebagai jembatan antara VClaim API dan antarmuka verifikator eksisting. Faskes tetap mengajukan klaim seperti biasa tanpa perlu mengubah alur operasional internal faskes.

### 5.2 Analisis Biaya dan Manfaat (Cost-Benefit Analysis)
- **Biaya Komputasi Infrastruktur:** Berbasis arsitektur *on-premise / hybrid microservices* dengan latensi inferensi model ML terkompilasi `< 15 ms` dan total pipeline `< 1 detik`, menjaga jejak komputasi tetap efisien tanpa ketergantungan API AI publik berbiaya tinggi.
- **Nilai Penyelamatan:** Dibandingkan dengan potensi kerugian satu kasus klaim fiktif atau penagihan berulang yang berkisar antara **Rp 3,5 juta hingga Rp 25 juta per episode rawat jalan/inap**, rasio Return on Investment (ROI) melampaui 1:2.000.

### 5.3 Roadmap Implementasi Bertahap (Post-Healthkathon)
1. **Fase 1: Penyelarasan Teknis (Bulan 1–2):** Workshop kalibrasi ambang batas skor risiko bersama Kedeputian Bidang Jaminan Pelayanan Kesehatan dan Kedeputian Bidang TI BPJS Kesehatan.
2. **Fase 2: Piloting Terbatas (Bulan 3–4):** Uji coba implementasi di 1 Kantor Cabang percontohan dengan target 5 RSUD dan 5 RS Swasta pada klaster klaim rehabilitasi medik dan fisioterapi.
3. **Fase 3: Evaluasi Komparatif (Bulan 5–6):** Pengukuran penurunan angka klaim pending dan rekonsiliasi akurasi deteksi pra-bayar terhadap hasil audit pasca-bayar (VPK/AAK).
4. **Fase 4: Skalabilitas Nasional (Bulan 7+):** Penerapan menyeluruh pada seluruh Kantor Cabang BPJS Kesehatan se-Indonesia dan ekspansi model deteksi ke 14 tipologi kecurangan lainnya (Upcoding, Fragmentation, Phantom Patient, dsb).

---

## 6. KESIMPULAN

Solusi **ClaimTrace** dari Tim TINEERENSE MAN 1 Surakarta menghadirkan jawaban konkret, ilmiah, dan berdaya guna tinggi bagi tantangan efisiensi risiko pada fasilitas kesehatan rujukan Program JKN. Dengan mengintegrasikan kecerdasan buatan terkalibrasi, triangulasi multi-sumber eksternal, dan penegakan hukum berbasis bukti kriptografis, ClaimTrace mewujudkan visi tema kompetisi:  
**Detect Smarter, Protect JKN — Smarter Protection for a Stronger JKN.**
