# DOKUMEN INDUK ARSITEKTUR BEA, TATA KELOLA AI, DAN BUKTI EVALUASI KREDIBEL (HEALTHKATHON BPJS KESEHATAN 2026)

**Nama Inovasi:** ClaimTrace JKN  
**Peran Sistem:** Modul Penyaring Anomali Pra-Bayar 4-Lapis yang Memperkuat VClaim dan VIDI (Smart Vedika) pada Proses Bisnis BEA C03.04 Sebelum Batas SLA 10 Hari Kerja Berita Acara  
**Tujuan Hilir:** Mencegah Kebocoran Dana Jaminan Sosial (DJS) dari Tagihan Phantom Billing, Repeat Billing, Upcoding, dan Service Unbundling Sebelum Masuk ke Sistem Pembayaran S06 (Keuangan / In-Monica)

---

## 1. Pemetaan Presisi ke BPJS Kesehatan Enterprise Architecture (BEA)

Sesuai prinsip **"Petakan ke BEA: Sebut proses bisnis dan aplikasi yang disentuh"** pada materi pembekalan *Sistem Layanan JKN & Pemanfaatan AI* (Wahyu Satriyo Wibowo, SPPTI BPJS Kesehatan), ClaimTrace tidak berdiri sebagai aplikasi terpisah yang menggantikan sistem inti, melainkan disematkan (*plugged-in*) secara presisi ke dalam ekosistem aplikasi eksisting BPJS Kesehatan:

| Kode Proses BEA | Nama Proses Bisnis | Aplikasi Eksisting BPJS Kesehatan | Peran & Titik Integrasi ClaimTrace |
| :--- | :--- | :--- | :--- |
| **C01** | Pengelolaan Kepesertaan | Mobile JKN, Edabu, FRISTA, PANDAWA, SIPP | Menarik log otentikasi biometrik wajah **FRISTA** saat penerbitan SEP dan mengirimkan *push notification* interaktif 1-klik ke peserta melalui **Mobile JKN** (dengan *Zero-PHI Masking*). |
| **C02** | Pengelolaan Kolektibilitas Iuran | Billing Statement, Autodebet, SIMANIS, REHAB | Memvalidasi status keaktifan eligibilitas kepesertaan JKN pada tanggal masuk kunjungan (`FKL03`). |
| **C03** | Pengelolaan Pelayanan Kesehatan | VClaim (Penerbitan SEP), HFIS, PCare, Antrean Online, Apotek Online, I-Care JKN | **Lapis 1** menarik data penerbitan SEP dari **VClaim** dan rujukan berjenjang `FKP02` dari **PCare**. **Lapis 2** menyinkronkan profil jadwal dan masa berlaku SIP tenaga medis pada **HFIS** dengan registri eksternal **SATUSEHAT SDMK Kemenkes**. |
| **C03.04 / C03.04.02** | Pengelolaan Klaim Faskes & Verifikasi Klaim FKRTL | VClaim (Pengajuan Klaim), VIDI (Smart Vedika), SIGAP, LUPIS, BOA, AUDIA | **Mesin Inti ClaimTrace 4-Lapis** bekerja memperkuat **VClaim** dan **VIDI (Smart Vedika)** untuk menyusun skor prioritas deterministik dan *Berkas Telaah Siap-Audit* sebelum batas SLA 10 hari kerja Berita Acara. |
| **S06** | Pengelolaan Keuangan & Pembayaran Klaim | In-Monica, Bestie, Petaku, Akuntansi & Pajak | **Gerbang Pencegahan Kebocoran DJS:** Menahan klaim berisiko tinggi (Jalur Merah) di tahap **C03.04** agar tagihan fiktif tidak masuk menjadi instruksi pencairan dana ke **S06 (In-Monica)**. |

---

## 2. Arsitektur 4-Lapis Penyaring Anomali Pra-Bayar (Menjawab Lapis 1 s.d. Lapis 4)

ClaimTrace mengintegrasikan empat lapisan verifikasi independen untuk menutup titik buta verifikasi administrasi konvensional:

### Lapis 1: Episode Fingerprint & Spatiotemporal Klaster (Bobot $w_1 = 0,50$)
- **Titik Integrasi BEA:** Proses **C03 & C03.04** (Aplikasi **VClaim** dan **PCare**).
- **Variabel Data Sampel BPJS:** `PSTV01`, `FKP02`, `FKL02`, `FKL03`, `FKL04`, `FKL17`, `FKL19 (FKL20-FKL23)`, `FKL30`, `FKL47`.
- **Mekanisme Teknis:** Membentuk sidik jari episode layanan dari kombinasi ID peserta ter-de-identifikasi (`PSTV01`), prosedur `ICD-9-CM` (`FKL30`), kode 4-digit `INA-CBGs` (`FKL19`), dan jendela waktu admisi. Mendeteksi lonjakan volume klaster harian ($\ge 3,0\times$ baseline historis faskes untuk grup `Z-3-12-0` fisioterapi/katarak) serta klaim berulang pada episode yang sama ($\le 30$ hari).
- **Pengecualian Adil (Hard Negative Filter):** Mengecualikan lonjakan sah pada kegiatan bakti sosial yang terdaftar resmi di BPJS Kesehatan serta kunjungan berulang terprogram (Kemoterapi `Z51.1`, Hemodialisis `Z49.1`, dan Rehabilitasi Medik Pasca-Stroke Akut `I69.3`).

### Lapis 2: Validasi SIP, Beban Kerja Harian, & Geovelocity DPJP (Bobot $w_2 = 0,30$ + Hard Trigger)
- **Titik Integrasi BEA:** Proses **C03** (Sinkronisasi **HFIS** Internal BPJS Kesehatan dengan **SATUSEHAT SDMK Kemenkes**).
- **Variabel Data Sampel BPJS:** `FKL05`, `FKL06`, `FKL09`, `FKL11`, `EXT_LAPIS2_SIP_STATUS`, `EXT_LAPIS2_GEOVELOCITY_KMH`.
- **Mekanisme Teknis:**
  1. Memvalidasi apakah Surat Izin Praktik (SIP) dokter DPJP berstatus `ACTIVE` pada tanggal tindakan (`FKL03`). Jika `EXPIRED`, sistem mengaktifkan *Hard Trigger* ke Jalur Merah.
  2. Jika status `UNSYNCED` (kendala keterlambatan sinkronisasi administratif antara HFIS dan SATUSEHAT SDMK), klaim **tidak divonis Merah**, melainkan dialihkan ke **Jalur Kuning (Klarifikasi Administrasi)** agar tidak merugikan RS yang jujur.
  3. Menghitung kepatuhan beban pasien harian terhadap rasio Permenkes No. 14 Tahun 2021 serta mendeteksi *Impossible Travel* (`Geovelocity > 110 km/jam` ketika DPJP yang sama tercatat melakukan tindakan invasif di dua RS berbeda pada jam yang beririsan).

### Lapis 3: Konfirmasi Kehadiran Pasien 1-Klik via Mobile JKN (Bobot $w_3 = 0,20$)
- **Titik Integrasi BEA:** Proses **C01 & C03** (Aplikasi **Mobile JKN** dan log biometrik **FRISTA**).
- **Variabel Data Sampel BPJS:** `PSTV01`, `FKL02`, `FKL03`, `EXT_LAPIS3_MOBILE_JKN`.
- **Mekanisme Teknis:** Ketika Lapis 1 dan Lapis 2 mendeteksi klaster mencurigakan, sistem mengirimkan *push notification* interaktif 1-klik (`Hadir` / `Tidak Pernah Hadir`) kepada sampel acak peserta (mis. 10 peserta per klaster) melalui **Mobile JKN**.
- **Pelindungan Privasi (Zero-PHI Masking):** Sesuai UU PDP No. 27 Tahun 2022, layar notifikasi peserta hanya menampilkan nama faskes, tanggal kunjungan, dan jenis poli umum tanpa menampilkan kode atau deskripsi diagnosis sensitif (`ICD-10`).

### Lapis 4: Verifikasi Koherensi Klinis RME-TTE, Deteksi Cloning/Unbundling, & Hybrid AI Semantic Synthesizer
- **Titik Integrasi BEA:** Proses **C03.04** (**VIDI / Smart Vedika** terhubung ke **RME-TTE PSrE-BSSN** sesuai Peta Jalan TI BPJS Kesehatan 2026-2027) sebelum tagihan diteruskan ke **S06 (In-Monica)**.
- **Variabel Data Sampel BPJS:** `FKL23 (Severity Level)`, `FKL24 (Diagnosis Sekunder)`, `FKL30 (Prosedur ICD-9-CM)`, `FKL32 (Tarif Standar)`, `FKL47 vs FKL48`.
- **Mekanisme Teknis:**
  1. **Audit Koherensi Severity Level (`FKL23`) vs Diagnosis Sekunder (`FKL24`):** Memverifikasi apakah klaim rawat inap *Severity Level II/III* didukung oleh kode komorbiditas/komplikasi pada tabel Diagnosis Sekunder (`FKL24`) serta bukti tanda vital/laboratorium pada Resume Medis Elektronik bertanda tangan elektronik (**RME-TTE**).
  2. **Deteksi Medical Record Cloning & Service Unbundling:** Menghitung kemiripan kosinus (*cosine similarity*) teks anamnesis/resume medis lintas pasien dalam satu klaster untuk menangkap salin-tempel massal (*cloning* $\ge 0,75$) serta mendeteksi pemecahan paket layanan (*Service Unbundling*) dan perpanjangan hari rawat (*Prolonged Length of Stay*).
  3. **Sintesis Berkas Telaah Siap-Audit (Context Handover & Behavior Bounding):** Menyintesis temuan numerik Lapis 1-4 menjadi draf *Berita Acara Hasil Verifikasi (BAHV)* terstruktur yang mengutip pasal regulasi secara presisi untuk disahkan oleh Verifikator Medis (Tier 1) dan Dokter Penelaah (Tier 2).

---

## 3. Kepatuhan Penuh terhadap 6 Prinsip Solusi AI & ML Healthkathon & 4 Cek Sebelum Memakai AI

Berdasarkan Arahan Direktur TI BPJS Kesehatan Semester II/2026 (Halaman 29-30 Materi Pembekalan):

| No | Prinsip Tata Kelola AI BPJS Kesehatan | Implementasi Konkret & Bukti Terukur pada ClaimTrace | Status |
| :--- | :--- | :--- | :--- |
| **1** | **Masalah Nyata & KPI Terukur** | Menjawab kasus riil klaim fisioterapi/katarak fiktif dan titik buta Vedika. **KPI Terukur:** Waktu telaah klaster **$< 2$ menit** (mematuhi SLA 10 hari kerja Perpres 82/2018), **$> 90\%$ klaim jujur masuk Jalur Hijau**, **Precision@50 = 86,0%** (43/50 berkas), **Lift = 43,0x**, dan **Rupiah Recall@50 = 66,3%** (**91,4%** pada kapasitas Tim Cabang $k=100$). | **PATUH PENUH** |
| **2** | **Petakan ke BEA** | Terpetakan eksplisit ke **C01** (Mobile JKN, FRISTA), **C02** (Eligibilitas), **C03** (VClaim SEP, PCare, HFIS x SATUSEHAT SDMK), **C03.04** (VClaim Klaim & VIDI/Smart Vedika), dan mencegah kebocoran ke **S06** (Keuangan / In-Monica). | **PATUH PENUH** |
| **3** | **Keamanan Data & UU PDP** | Menggunakan 100% data sintetis terkalibrasi skema sampel BPJS Kesehatan (`PSTV01` ter-de-identifikasi), enkripsi AES-256 & TLS 1.3, *Zero-PHI Masking* di Mobile JKN, dan rantai hash audit SHA-256 sesuai UU PDP No. 27/2022, Perdir BPJS No. 09/2024, dan SE Menkominfo No. 09/2023. | **PATUH PENUH** |
| **4** | **Human-in-the-Loop & Explainable AI** | Beroperasi murni sebagai *Decision Support System (DSS)*. Rumus skor transparan ($S = 0,5 S_1 + 0,3 S_2 + 0,2 S_3 + \text{Boost Lapis 4}$), menampilkan kontribusi fitur, dan mewajibkan pengesahan Verifikator Tier 1 & Dokter Penelaah Tier 2. | **PATUH PENUH** |
| **5** | **Adil & Etis (Bebas Bias Faskes)** | Diuji terhadap *Hard Negatives* (RS Rujukan Kelas A/B dengan pasien ICU kompleks, kemoterapi `Z51.1`, hemodialisis `Z49.1`, rehab pasca-stroke `I69.3`, baksos resmi, dan status SIP `UNSYNCED`). **False Positive Rate Hard Negative = 0,0%**. | **PATUH PENUH** |
| **6** | **Siap Produksi (Latensi & Fallback)** | Endpoint `POST /verify` memuat artefak `.pkl` sekali di RAM saat startup (**latensi inferensi ML $< 15\text{ ms}$**, total pipeline $< 1\text{ detik}$) dan dilengkapi **Local Rule Engine Fallback** yang menjamin respons `HTTP 200 OK` saat API LLM eksternal gangguan/timeout. | **PATUH PENUH** |

### Daftar Periksa "4 Cek Sebelum Memakai AI" (Halaman 29)
1. **Cek Data:** Data identitas peserta, rekam medis mentah, dan kredensial tidak pernah dikirim ke layanan AI publik; pemrosesan menggunakan ID ter-masking (`PSTV01`) dan vektor numerik.
2. **Cek Akun:** Mendukung eksekusi model lokal *on-premise* di infrastruktur internal BPJS Kesehatan tanpa ketergantungan pada akun AI publik gratis.
3. **Cek Kontrol:** *Zero data retention* dan *opt-out model training* aktif secara penuh; seluruh jejak keputusan dicatat pada *Immutable Audit Ledger* internal ber-hash SHA-256.
4. **Cek Keluaran:** Setiap draf rekomendasi AI dibatasi oleh *Behavior Bounding* (Permenkes 26/2021 & Perpres 82/2018) dan wajib melewati Kertas Kerja 6 Kaidah Verifikator sebelum Berita Acara diterbitkan.

---

## 4. Kalibrasi terhadap Skema Data Sampel BPJS Kesehatan (`PSTV`, `FKP`, `FKL02-FKL48`)

Seluruh generator benchmark dan mesin fitur ClaimTrace dikalibrasi mengikuti struktur buku kode *Materi Data Sampel BPJS Kesehatan* (Fatah Abdella Sutara, M.TI.):

- **Kepesertaan (`PSTV`):** `PSTV01` (Nomor peserta ter-de-identifikasi unik untuk pelacakan riwayat longitudinal), `PSTV02` (Nomor keluarga), `PSTV15` (Bobot sampel terstratifikasi).
- **Pelayanan FKTP (`FKP`):** `FKP02` (ID kunjungan FKTP perujuk pada PCare), `FKP14` (Diagnosis primer rujukan).
- **Pelayanan & Klaim FKRTL (`FKL02-FKL48`):**
  - `FKL02` (ID kunjungan SEP), `FKL03` (Tanggal datang), `FKL04` (Tanggal pulang -> *Length of Stay*).
  - `FKL05` (Provinsi FKRTL), `FKL07` (Kepemilikan FKRTL), `FKL09` (Tipe/Kelas FKRTL: Kelas A, B, C, D).
  - `FKL17` & `FKL18` (Kode dan deskripsi diagnosis primer `ICD-10`).
  - **Bedah 4-Digit Kode INA-CBGs (`FKL19`):**
    - **Digit 1 (`FKL20` - CMG):** *Casemix Main Groups* (Huruf `A-Z`, 29 kelompok organ/sistem tubuh, mis. `Z` untuk faktor rehabilitasi, `I` untuk kardiovaskular).
    - **Digit 2 (`FKL21` - Tipe Kasus):** Angka `1-9` (membedakan Prosedur Rawat Inap `1`, Prosedur Besar Rawat Jalan `2`, Prosedur Signifikan Rawat Jalan `3`, dan Rawat Inap Bukan Prosedur `4`).
    - **Digit 3 (`FKL22` - Spesifik CBG):** Kode `01-99` (spesifikasi paket tindakan, mis. `12` pada `Z-3-12-0` untuk fisioterapi).
    - **Digit 4 (`FKL23` - Severity Level):** Tingkat keparahan `0` (Rawat Jalan), `I` (Ringan), `II` (Sedang), dan `III` (Berat).
  - **Tabel Diagnosis Sekunder (`FKL24`):** Relasi `1-ke-N` kode `ICD-10` komorbiditas dan komplikasi yang menjadi bukti wajib pada Lapis 4 untuk mengesahkan klaim *Severity Level II/III*.
  - **Prosedur & Biaya (`FKL30`, `FKL32`, `FKL47`, `FKL48`):** `FKL30` (Prosedur `ICD-9-CM`), `FKL32` (Tarif standar regional), `FKL47` (Biaya tagih faskes), dan `FKL48` (Biaya verifikasi disetujui). Selisih `excess_rupiah = FKL47 - FKL48` digunakan untuk menghitung metrik **Rupiah Recall@K**.

---

## 5. Bukti Evaluasi Kredibel & Kompatibilitas `hkeval` (Henry Lucky Framework)

Sesuai materi workshop *From Synthetic Data to Credible Evidence* (Henry Lucky, BINUS University), ClaimTrace memisahkan secara tegas antara **Verifikasi** (bukti internal pada benchmark sintetis terkalibrasi) dan **Validasi** (peta jalan uji coba lapangan di Kantor Cabang), serta mematuhi **5 Aturan Benchmark Kredibel**:

### Kalimat Utama Juri (Headline Jury Sentence - Slide 28)
> **Bahasa Indonesia:**  
> *"Dari 50 berkas yang diaudit pada kapasitas operasional (1 verifikator x 5 kasus/hari x 10 hari kerja SLA), sebanyak 43 berkas (95% Cluster CI: 24-49) terbukti curang pada benchmark sintetis terkalibrasi (prevalensi 2,0%), setara 43,0x lipat lebih efektif dibanding uji petik acak dan mengamankan 66,3% potensi kerugian Rupiah (excess rupiah). Dari 32 RS jujur, hanya 7 RS (21,9%) yang terkena sampel audit."*
>
> **English (Standard Workshop Template):**  
> *"Of 50 cases audited at our assumed capacity (1 verifier x 5 cases/day x 10 working days), 43 (95% cluster CI 24-49) were fraudulent in our independent synthetic benchmark (prevalence 2.0%), 43.0x random targeting, capturing 66.3% of excess rupiah. Of 32 honest hospitals, 7 (21.9%) had a claim audited."*

### Ringkasan Uji Ablasi Berpasangan (Paired Ablation Study pada 3.002 Klaim)

| Metrik Operasional ($k = 50$, Prevalensi $\pi = 2,0\%$) | Aturan Dasar VClaim Saja | Aturan + Model 4-Lapis ClaimTrace | Peningkatan Bersih |
| :--- | :--- | :--- | :--- |
| **Berkas Curang Tertangkap di Top-50** | 12 berkas | **43 berkas** (95% Cluster CI: 24-49) | **+31 berkas** ($p = 0,0012$) |
| **Precision@50** | 24,0% | **86,0%** (95% CI: 48,0% - 98,0%) | **+62,0% poin** |
| **Lift Over Random Targeting** | 12,0x lipat | **43,0x lipat** | **+31,0x lipat** |
| **Rupiah Recall@50 (Excess Rupiah)** | 19,9% | **66,3%** (dan **91,4%** pada $k=100$) | **+46,4% poin** |

### Evaluasi 5 Kondisi Benchmark (Rule 2: Vary Condition Dials One at a Time)
1. **Baseline ($\pi = 2,0\%$):** `Precision@50 = 86,0%` (43/50), `Lift = 43,0x`, `Rupiah Recall@50 = 66,3%`.
2. **Hard Cases (Kasus Terkamuflase $\pi = 2,0\%$):** `Precision@50 = 78,0%` (39/50), `Lift = 39,0x`, `Rupiah Recall@50 = 59,6%`.
3. **Rare Fraud ($\pi = 0,5\%$, 15 kasus dari 3.002 klaim):** Menangkap **14 dari 15** seluruh kasus curang (`Recall@50 = 93,3%`, `Lift = 56,0x`, `Rupiah Recall@50 = 93,9%`).
4. **Frequent Fraud ($\pi = 10,0\%$, 300 kasus dari 3.002 klaim):** `Precision@50 = 98,0%` (49/50), `Lift = 9,8x`.
5. **Concentrated Hospitals (Terkonsentrasi di 3 RS Sindikat):** `Precision@50 = 84,0%` (42/50), `Lift = 42,0x`, dengan beban audit pada RS jujur turun menjadi hanya **8 dari 37 RS jujur (21,6%)**.

### Kejujuran pada Modus Hold-Out (Unseen Fraud Modes)
- **`HOLD_OUT_SERVICE_UNBUNDLING`:** Tertangkap sebagian di Top-K melalui sinyal kunjungan berulang Lapis 1 dan koherensi Lapis 4; sisanya membutuhkan aturan paket bundling spesifik poli.
- **`HOLD_OUT_PROLONGED_LOS`:** Sebagian lolos dari Lapis 1-3 karena SIP dokter aktif dan pasien benar-benar dirawat; hanya tertangkap apabila selisih hari rawat melampaui ambang z-score Lapis 4.

### Artefak CSV Standar `hkeval`
- Lokasi Skor Detektor: [hkeval_scores.csv](../backend/data/hkeval_scores.csv) (`entity_id,group_id,score,strata`)
- Lokasi Kunci Kebenaran: [hkeval_truth.csv](../backend/data/hkeval_truth.csv) (`entity_id,label,modus,excess_rupiah`)

---

## 6. Arsitektur 6-Tahap Practical AI Inference Pipeline (`POST /verify` - Said Achmad)

Diimplementasikan pada [practical_inference_pipeline.py](../backend/app/engine/practical_inference_pipeline.py) dan diekspos melalui endpoint `POST /verify` serta `POST /api/v1/verify`:

1. **Client Request (`POST /verify`):** Menerima payload klaim FKRTL secara real-time.
2. **Pydantic Schema Validation (`ClaimVerificationRequest`):** Memvalidasi tipe data, rentang nilai, dan atribut wajib sebelum menyentuh model.
3. **Vectorized NumPy Feature Engineering:** Mengekstraksi 10 fitur vektor terstandar (`cost_ratio_fkl47_fkl32`, `los_zscore`, `severity_numeric`, `secondary_diag_deficit`, `lapis1_cluster_spike_ratio`, `lapis1_repeat_visit_flag`, `lapis2_sip_risk_numeric`, `lapis2_geovelocity_ratio`, `lapis3_mobile_denied_ratio`, `lapis4_coherence_deficit`).
4. **In-Memory ML Inference (`.pkl` Loaded Once at Startup):** Memuat `StandardScaler` dan `RandomForestClassifier` (`claimtrace_rf_pipeline.pkl`) satu kali ke RAM saat aplikasi menyala, menghasilkan waktu inferensi **$< 15\text{ ms}$** per klaim.
5. **Asynchronous LLM Service (`httpx.AsyncClient`):** Menerapkan *Context Handover* (menyerahkan skor ML dan rincian 4-Lapis ke LLM) serta *Behavior Bounding* (membatasi output pada regulasi Permenkes 26/2021 & Perpres 82/2018 dalam format JSON murni).
6. **Resilient Local Rule Engine Fallback:** Apabila API LLM eksternal mengalami *timeout* atau sedang dalam mode *on-premise* terisolasi, *Local Rule Engine* mengambil alih secara instan dan tetap mengembalikan respons **`HTTP 200 OK`** dengan skema JSON yang identik.

---

## 7. Naskah Presentasi 10 Menit "Coaching-to-Final" 20 Besar Healthkathon 2026

Sesuai panduan penjurian 20 Besar (*10 menit presentasi + 15 menit tanya jawab, fokus pada "Apa yang berubah sejak coaching dan buktinya"*):

| Waktu | Bagian Presentasi | Masukan Mentor / Tantangan Awal | Tindakan Perbaikan yang Dilakukan | Bukti Terukur & Demo |
| :--- | :--- | :--- | :--- | :--- |
| **Menit 0-2** | **Masalah Riil & Peta Integrasi BEA** | Solusi AI tidak boleh mengambang di luar sistem eksisting BPJS Kesehatan. | Memetakan ClaimTrace secara presisi ke proses **C01** (Mobile JKN/FRISTA), **C03** (VClaim SEP & HFIS x SATUSEHAT SDMK), **C03.04** (VClaim & VIDI/Smart Vedika), dan menahan tagihan fiktif sebelum masuk ke **S06** (In-Monica). | Tabel Peta BEA pada tab *Arsitektur BEA & Evaluasi* serta endpoint `/api/v1/healthkathon/bea-governance`. |
| **Menit 2-4** | **Penyempurnaan Arsitektur 4-Lapis (Lapis 1 s.d. Lapis 4)** | Bagaimana mendeteksi *Upcoding Severity III* dan *Cloning Resume Medis* jika Lapis 1-3 normal? | Menambahkan **Lapis 4 (Verifikasi Koherensi Klinis RME-TTE)** yang menyandingkan digit ke-4 `INA-CBGs` (`FKL23`) terhadap tabel Diagnosis Sekunder (`FKL24`) dan kemiripan teks resume medis. | Simulasi *Kasus 3 (Upcoding Severity III Tanpa FKL24)* pada konsol `POST /verify`. |
| **Menit 4-6** | **Keadilan Model (Prinsip 5) & Perlindungan Hard Negatives** | Aturan naif berisiko menuduh RS Rujukan Kelas A atau pasien hemodialisis/kemoterapi rutin sebagai kecurangan. | Mengkalibrasi *Hard Negative Whitelist* (`Z49.1` Hemodialisis, `Z51.1` Kemoterapi, `I69.3` Stroke, Baksos Resmi) dan mengalihkan status SIP `UNSYNCED` ke Jalur Kuning administratif. | **FPR Hard Negative = 0,0%**; hanya **7 dari 32 RS jujur (21,9%)** yang terkena sampel audit. |
| **Menit 6-8** | **Bukti Kredibel Berbasis Kapasitas Verifikator (`hkeval`)** | Metrik F1/AUC abstrak tidak menjawab keterbatasan waktu verifikator dalam SLA 10 hari kerja. | Mengevaluasi 3.002 klaim terkalibrasi Data Sampel BPJS Kesehatan pada kapasitas $k = 50$ berkas dengan *Hospital-Level Cluster Bootstrap 95% CI* dan *Uji Ablasi Berpasangan*. | **Precision@50 = 86,0%** (43/50 berkas, CI 24-49), **43,0x random targeting**, **Rupiah Recall@50 = 66,3%** (**91,4%** pada $k=100$). |
| **Menit 8-10** | **Kesiapan Produksi (`POST /verify`), Latensi $< 15\text{ ms}$, & Fallback** | Bagaimana jika koneksi ke LLM eksternal terputus saat jam sibuk pengajuan klaim akhir bulan? | Membangun *6-Stage Practical AI Inference Pipeline*: model `.pkl` dimuat sekali di RAM saat startup ($< 15\text{ ms}$) dengan *Resilient Local Rule Engine Fallback* yang menjamin `HTTP 200 OK`. | Demo langsung toggle *Simulasikan Timeout API LLM* pada tab *Pipeline Produksi AI (POST /verify)*. |
