# DOSIR EKSEKUTIF COACHING & MENTORING FINALIS HEALTHKATHON 2026
## CLAIMTRACE: SISTEM PENDUKUNG KEPUTUSAN VERIFIKATOR KLAIM JKN BERBASIS TRIASE MULTI-SINYAL INDEPENDEN

**Tim Finalis:** TINEERENSE (Tech Innovators & Next-gen E-health Engineers Resilient Defense)  
**Institusi:** MAN 1 Surakarta  
**Ketua Tim:** Khalaf Faith Pradyatama (Lead Systems Architect, Full-Stack & AppSec)  
**Anggota Tim:** Gaudiansyah Abiyu Mahya (AI/ML Engineer & Healthcare Data Analyst)  
**Kategori Inovasi:** Efisiensi Risiko pada Fasilitas Kesehatan (FKRTL)  
**Fokus Sub-Kategori:** #6 Phantom Billing (Klaim Fiktif Fisioterapi/Baksos) & #11 Repeat Billing (Penagihan Klaim Berulang)  
**Ekspansi Lanjutan:** Deteksi Upcoding Tingkat Keparahan INA-CBG, Lapis 4 FRISTA Biometrik Wajah, Berita Acara Digital Berstempel QR SHA-256, dan Engine Kepatuhan SLA 10 Hari Kerja (Perpres No. 82/2018)  
**Status Lingkungan:** Localhost Production-Grade System (Port 3000 Frontend & Port 8000 Backend)  
**Target Tahapan:** Pendampingan Mentor BPJS Kesehatan Menuju Top 5 Demo Day  

---

## DAFTAR ISI DOSIR
1. Ringkasan Eksekutif & Value Proposition untuk BPJS Kesehatan
2. Pemetaan Proses Bisnis BPJS Kesehatan: AS-IS vs TO-BE
3. Arsitektur Quad-Triangulation: 4 Sinyal Triase Independen
4. Matriks Kepatuhan Regulasi & Pembuktian Yuridis Sengketa Klaim
5. Analisis Dampak Finansial & Solvabilitas Dana JKN (Basis 4.341 Klaim)
6. Tata Kelola Keamanan Data, Zero-PHI Masking, & Kontrol Akses Terverifikasi
7. Lembar Jawaban Pertanyaan Kritis Sesi Mentoring (Mentor FAQ Defense Sheet)
8. Roadmap Rancang Bangun & Integrasi Bertahap di BPJS Kesehatan

---

## 0. RINGKASAN HAFALAN MENTORING & PENGUASAAN SISTEM (WAJIB DI LUAR KEPALA)

- **Satu Tujuan Utama Sistem:** Mengendalikan kecurangan (*anti-fraud*) klaim FKRTL secara **pra-bayar** — fokus pada **#6 Phantom Billing**, **#11 Repeat/Split Billing**, dan **Upcoding INA-CBG** — agar dana bocor tertahan sebelum cair, tetap mematuhi batas verifikasi 10 hari kerja (Perpres No. 82/2018).
- **Rentang & Rumus Resmi Skor Sistem:**
  - Skala: **`0 - 100`**
  - Formula: `Skor = 0,50*S1 (Pola & Semantik) + 0,30*S2 (SIP & Geovelocity DPJP) + 0,20*S3 (Mobile JKN)`
  - **Jalur Hijau (`0,0 - 49,9`):** Klaim wajar -> lolos cepat (*Fast-Track* < 24 jam).
  - **Jalur Kuning (`50,0 - 74,9`):** Perlu klarifikasi berkas / ketidaksinkronan data (seperti `DPJP UNSYNCED`, tidak boleh langsung divonis fraud).
  - **Jalur Merah (`75,0 - 100,0`) atau Hard Trigger:** Anomali berat atau pelanggaran fatal (`SIP Expired` pada tgl layanan memaksa skor minimal `75,0`) -> Tahan Pra-Bayar (`HOLD_BAKB`) + terbitkan Berita Acara QR SHA-256.
- **Cara Sistem Menyaring Klaim Anomali (4 Tahap):**
  1. **Tahap 1 — Filter Awal & Pengecualian PRB:** Terima seluruh FPK masuk dari `2.091` FKRTL dan kecualikan resep rutin kronis PRB `<= 30` hari (Permenkes No. 3/2023 Pasal 37).
  2. **Tahap 2 — Aturan Pola, Lonjakan & Klaim Ganda:** Flag lonjakan klaster `>= 3,0x` baseline tanpa izin baksos resmi, koreksi tarif langsung (`1.631` berkas), dan klaim ganda hari sama (`4.876` pasang / `9.555` berkas senilai `Rp 32,59 Miliar`).
  3. **Tahap 3 — Validasi SDMK SATUSEHAT, OSRM & Semantik NLP:** Uji status SIP (`EXPIRED` = Hard Trigger Merah; `UNSYNCED` = Kuning), rute antar-kota DPJP (`> 120 km/jam` dalam < 45 menit), beban `> 40` pasien/hari, serta kemiripan teks resume medis ChromaDB (`cosine similarity >= 90%`) dan Isolation Forest.
  4. **Tahap 4 — Konfirmasi Mobile JKN (Zero-PHI) & Fusi `0-100`:** Kirim konfirmasi kehadiran Ya/Tidak tanpa diagnosis medis ke peserta -> hitung skor akhir -> eksekusi putusan Human-in-the-Loop.
- **Data Live di Gudang Data DuckDB (`claimtrace_warehouse.db`, Total `6.264.346` Baris):**
  - `1.699.219` klaim FKRTL (Rp `1,536` Triliun; rata-rata `4.643`/hari, puncak `7.870`/hari) across `2.091` RS di `496` Kab/Kota (`38` Provinsi).
  - `2.590.751` master peserta (`bpjs_kepesertaan_all`), `1.967.670` diagnosis sekunder (`bpjs_diagnosissekunder_all`), `6.706` ICD-10.
  - Antrean Triase Aktif End-to-End: 6 kasus representatif (`CLM-2026-8801` s/d `8806`) untuk membedah jalur Hijau, Kuning (`UNSYNCED`), dan Merah (*Phantom*, *Repeat*, *Geovelocity*, *Upcoding*).

---

## 1. RINGKASAN EKSEKUTIF & VALUE PROPOSITION

### 1.1 Pernyataan Nilai Utama
> "ClaimTrace mentransformasi pengawasan klaim JKN dari verifikasi administratif retrospektif pasca-bayar menjadi penapisan cerdas pra-bayar (pre-payment triage) yang melindungi likuiditas Dana Jaminan Sosial tanpa menghambat percepatan pembayaran klaim faskes yang patuh."

### 1.2 Masalah Fundamental di Lapangan
Dalam skema operasional JKN saat ini, BPJS Kesehatan melayani lebih dari 1,9 juta transaksi pelayanan kesehatan per hari dengan beban verifikasi klaim faskes yang sangat padat. Sesuai Pasal 74 Perpres No. 82 Tahun 2018, BPJS Kesehatan memiliki tenggat waktu maksimal 15 hari kalender (dengan SLA verifikasi internal 10 hari kerja) untuk menyelesaikan pembayaran FPK (Form Pengajuan Klaim). Apabila melampaui batas waktu tersebut, BPJS Kesehatan dikenakan sanksi denda ganti rugi sebesar 1% per bulan keterlambatan.

Kondisi tersebut menciptakan dilema operasional bagi verifikator BPJS Kesehatan:
- **Beban Pemeriksaan Tinggi:** Setiap verifikator harus memvalidasi ratusan hingga ribuan berkas klaim INA-CBG harian.
- **Ketergantungan Data Sepihak:** Verifikasi klaim di sistem VClaim/Vedika konvensional mayoritas bersandar pada resume medis dan bukti pelayanan yang diproduksi secara internal oleh faskes penagih. Apabila terjadi pemufakatan jahat internal di faskes (seperti sindikasi manipulasi berkas baksos atau duplikasi tindakan fisioterapi), berkas akan tampak lengkap secara formalitas koding, padahal layanannya tidak pernah terlaksana secara nyata (Phantom Billing).
- **Temuan KPK & Kemenkes:** Audit gabungan pada Juli 2024 membuktikan modus klaim fiktif mencapai puluhan miliar rupiah pada rumah sakit swasta yang baru terendus melalui audit investigatif pasca-bayar.

### 1.3 Solusi ClaimTrace: Triase Multi-Sinyal Independen
ClaimTrace hadir sebagai instrumen pendukung keputusan (Decision Support System - DSS) independen yang tidak mengubah alur inti aplikasi VClaim, melainkan bertindak sebagai gerbang penyaring pra-bayar (pre-payment intelligence layer) berbasis 4 sinyal independen:
1. **Sinyal 1 - Integritas Klinis & Koding (INA-CBG Rule Engine & Semantic Embeddings):** Mendeteksi anomali rasio prosedur/diagnosa, kesamaan semantik teks resume medis faskes, serta manipulasi tingkat keparahan (Upcoding Level I ke III).
2. **Sinyal 2 - Legalitas Tenaga Medis & Spatiotemporal (SATUSEHAT SDMK & OSRM Engine):** Memvalidasi izin praktik aktif dokter penanggung jawab pelayanan (DPJP) pada tanggal layanan serta menghitung kemungkinan kecepatan perpindahan fisik DPJP antar-faskes.
3. **Sinyal 3 - Konfirmasi Partisipatif Peserta (Out-of-Band Telemetry Mobile JKN):** Mengirimkan konfirmasi kehadiran biner (Ya/Tidak) langsung ke gawai peserta terdaftar tanpa membocorkan rincian rekam medis sensitif (Zero-PHI Compliance).
4. **Sinyal 4 - Validasi Terminal Biometrik (FRISTA Lapis 4):** Memverifikasi integritas presensi faskes melalui pencocokan biometrik wajah FRISTA guna mencegah penggunaan identitas peserta tanpa kehadiran fisik.

---

## 2. PEMETAAN PROSES BISNIS BPJS KESEHATAN: AS-IS VS TO-BE

### 2.1 Alur Proses Bisnis Saat Ini (AS-IS)
```mermaid
flowchart TD
    A["Faskes FKRTL / RS"] -->|"Kirim Berkas FPK & Rekam Medis"| B["Sistem VClaim & Vedika"]
    B --> C["Pemeriksaan Kelengkapan Berkas & Rule Base Sederhana"]
    C --> D{"Verifikasi Manual oleh Verifikator"}
    D -->|"Waktu Terbatas (<10 Hari Kerja)"| E["Klaim Disetujui & Dibayar"]
    D -->|"Berkas Meragukan"| F["Klarifikasi Manual (Kunjungan Lapangan/Surat)"]
    E --> G["Audit Pasca-Bayar (AAK / VPK)"]
    G -->|"Temuan Fraud Bulan/Tahun Kemudian"| H["Proses Penagihan Kembali (Dispute / Pengembalian Dana Sulit)"]
```
**Kelemahan Alur AS-IS:**
- Deteksi klaim fiktif dan penagihan berulang sangat bergantung pada laporan pengaduan masyarakat atau audit pasca-bayar.
- Biaya penagihan kembali (recovery cost) dana yang terlanjur dibayarkan ke faskes bermasalah sangat tinggi dan rawan perselisihan hukum berkepanjangan.

### 2.2 Alur Proses Bisnis dengan ClaimTrace (TO-BE)
```mermaid
flowchart TD
    A["Faskes FKRTL"] -->|"Pengajuan Berkas Klaim (FPK / FHIR JSON)"| B["VClaim BPJS Kesehatan"]
    B -->|"WebHook / Event Ingest"| C["ClaimTrace Pre-Payment Gateway"]
    
    subgraph Quad_Triangulation ["Mesin Triase Multi-Sinyal Independen"]
        C --> D1["Lapis 1: Analitik Klinis & Upcoding INA-CBG"]
        C --> D2["Lapis 2: SDMK SATUSEHAT & Geovelocity OSRM"]
        C --> D3["Lapis 3: Telemetri Konfirmasi Mobile JKN"]
        C --> D4["Lapis 4: Verifikasi Presensi Biometrik FRISTA"]
    end

    D1 & D2 & D3 & D4 --> E["Fusion Scoring Engine (Skala 0 - 100)"]
    
    E -->|"Skor 0,0 - 49,9"| F["Jalur Hijau: Fast-Track < 24 Jam (1.697.588 / 99,90% bersih)"]
    E -->|"Skor 50,0 - 74,9 atau UNSYNCED"| G["Jalur Kuning: Klarifikasi Administrasi / SDMK Sync"]
    E -->|"Skor 75,0 - 100 atau Hard Trigger"| H["Jalur Merah: Hold Pra-Bayar & BAKB Audit"]
    
    F --> I["Pembayaran Terjadwal VClaim (Cepat & Likuid)"]
    G --> J["Permintaan Bukti Tambahan ke Faskes via Portal"]
    H --> K["Decision Console Verifikator + Berita Acara QR SHA-256"]
    K --> L["Penghentian Pembayaran Fiktif Sebelum Keluar Kas"]
```

**Nilai Tambah Alur TO-BE bagi BPJS Kesehatan:**
1. **Zero Friction bagi Klaim Faskes Patuh:** Pada data gudang DuckDB (`1.699.219` klaim FKRTL), `99,90%` (`1.697.588` berkas) disetujui penuh dan diarahkan ke Jalur Hijau (*Fast-Track* < 24 jam) sehingga arus kas RS patuh tetap lancar.
2. **Fokus Tajam pada Klaim Anomali Kritis:** Verifikator tidak mengalami *alert fatigue* memeriksa berkas rutin, melainkan memusatkan audit pra-bayar pada klaster anomali berisiko tinggi (seperti `4.876` pasang klaim ganda hari sama senilai `Rp 32,59 Miliar` dan `1.631` koreksi tarif langsung senilai `Rp 2,07 Miliar`).
3. **Pencegahan Sejak Pintu Masuk:** Penyelamatan dana dilakukan sebelum pencairan kas (*pre-payment avoidance*), menghilangkan risiko gagal tagih pasca-bayar.

---

## 3. ARSITEKTUR QUAD-TRIANGULATION: 4 SINYAL TRIASE INDEPENDEN

| Lapis Sinyal | Sumber Data | Metodologi & Algoritma | Peran & Sasaran Pencegahan |
| :--- | :--- | :--- | :--- |
| **Lapis 1: Klinis & Koding** | Form Klaim FPK, INA-CBG, ICD-10, ICD-9-CM | Semantic Similarity Vector Space, Rule Engine PNPK, Isolation Forest | Mendeteksi klaim duplikat (#11 Repeat Billing), unbundling prosedur, dan manipulasi tingkat keparahan (Upcoding dari Sub-akut ke Akut Parah). Dilengkapi filter pengecualian sah untuk Program Rujuk Balik (PRB) sesuai Permenkes 3/2023 Pasal 37. |
| **Lapis 2: Legalitas & Spatiotemporal** | SATUSEHAT SDMK Kemenkes & Open Source Routing Machine (OSRM) | Registry Verification & Algoritma Geovelocity Dinamis | Memeriksa keabsahan Surat Izin Praktik (SIP) dokter pada tanggal pelayanan, mendeteksi dokter tercatat praktik melebihi 3 SIP, serta menghitung kecepatan perpindahan mustahil (>120 km/jam) antar-faskes. |
| **Lapis 3: Konfirmasi Peserta** | Telemetri Gawai & Push Notification Mobile JKN | Out-of-Band Zero-PHI Cryptographic Attestation | Mengirimkan pertanyaan biner (1-klik Ya/Tidak) ke aplikasi peserta mengenai penerimaan layanan fisik, mematahkan fabrikasi berkas baksos fiktif (#6 Phantom Billing). |
| **Lapis 4: Terminal Biometrik** | Log Sistem Face Match FRISTA Faskes | Multimodal Biometric Verification Log & Terminal Integrity | Memverifikasi bahwa peserta benar-benar hadir secara fisik di mesin perekam wajah faskes pada jam pelayanan, menggagalkan manipulasi tanda tangan absensi kertas. |

### Formula Fusi Skor Risiko Gabungan (Composite Risk Score, Skala 0 - 100)
Skor inti dihitung secara matematis dengan bobot deterministik terkalibrasi (mengacu pada [`scoring.py`](backend/app/engine/scoring.py)):
\[
S_{\text{total}} = 0,50 \cdot S_1 + 0,30 \cdot S_2 + 0,20 \cdot S_3
\]
Dengan komponen:
- \(w_1 = 0,50\) (`S1`: Pola Episode, Lonjakan Klaster >= 3,0x, Repeat Billing <= 30 hari, Upcoding & ChromaDB Cosine >= 90%)
- \(w_2 = 0,30\) (`S2`: Legalitas SIP SATUSEHAT SDMK, Geovelocity OSRM > 120 km/jam & Beban Kerja > 40 pasien/hari)
- \(w_3 = 0,20\) (`S3`: Telemetri Konfirmasi Biner Zero-PHI Mobile JKN; ditambah pencocokan Biometrik FRISTA pada modul Lapis 4)

*Catatan Hard Trigger & Rentang:* **0,0 - 49,9 = Jalur HIJAU**, **50,0 - 74,9 (atau DPJP UNSYNCED) = Jalur KUNING**, dan **75,0 - 100,0 = Jalur MERAH**. Apabila terdeteksi SIP DPJP kedaluwarsa (`EXPIRED`) pada tanggal layanan, sistem otomatis memicu Hard Trigger ke Jalur Merah (skor minimum `75,0`).

---

## 4. MATRIKS KEPATUHAN REGULASI & PEMBUKTIAN YURIDIS

### 4.1 Harmonisasi Regulasi JKN
| Dasar Hukum | Ketentuan Substansial | Implementasi Defensif ClaimTrace |
| :--- | :--- | :--- |
| **Perpres No. 82 Tahun 2018 Pasal 74 & 76** | Batas pembayaran klaim faskes maksimal 15 hari kalender; BPJS Kesehatan wajib menjaga SLA verifikasi 10 hari kerja. Keterlambatan pembayaran dikenakan denda 1% per bulan. | ClaimTrace dilengkapi `StatutoryBusinessDaysEngine` yang menghitung secara presisi 10 hari kerja murni (mengecualikan Sabtu, Minggu, dan 16 hari libur nasional resmi SKB 3 Menteri 2026). Menghindarkan BPJS Kesehatan dari klaim denda sepihak oleh faskes. |
| **Permenkes No. 26 Tahun 2021** | Pedoman pencegahan dan penanganan kecurangan (fraud) serta pengenaan sanksi administrasi dalam Program JKN. | Memberikan dasar operasional penahanan klaim pra-bayar dan pembentukan tim pencegahan kecurangan di tingkat cabang melalui Berita Acara Klarifikasi Bersama (BAKB). |
| **Permenkes No. 3 Tahun 2023 Pasal 37** | Standar tarif pelayanan kesehatan dan aturan penagihan obat kronis Program Rujuk Balik (PRB) di faskes tingkat lanjut. | ClaimTrace menyematkan aturan pengecualian otomatis (PRB chronic exemption): penagihan resep obat kronis hipertensi/diabetes dalam masa 30 hari tidak dinilai sebagai unbundling/repeat billing ilegal. |
| **UU No. 27 Tahun 2022 (UU PDP)** | Kewajiban pengendali data pribadi melindungi data spesifik (data kesehatan) dan menerapkan prinsip minimasi data. | Notifikasi Mobile JKN menerapkan Zero-PHI: pesan tidak menyebutkan nama diagnosa, obat, atau tindakan klinis secara terbuka, melainkan hanya konfirmasi kehadiran fisik dan jam pelayanan. |

### 4.2 Berita Acara Klarifikasi Bersama (BAKB) Digital dengan Stempel QR SHA-256
Salah satu titik rawan sengketa klaim adalah ketiadaan bukti rantai pengawasan (chain of custody) saat klaim ditunda atau ditolak. ClaimTrace menerbitkan dokumen digital resmi BAKB yang memuat:
1. **Nomor Register Unik:** Format `BAKB/BPJS-KTR/{TAHUN}/{BULAN}/{ID_KASUS}`.
2. **Atribusi Verifikator:** NIP dan nama verifikator yang menandatangani secara digital via sertifikat identitas terverifikasi.
3. **Stempel Kriptografis SHA-256:** Seluruh ringkasan anomali, nilai tagihan tertahan, dan rekomendasi faskes dienkapsulasi ke dalam hash SHA-256 yang dimuat dalam QR Code dokumen.
4. **Kekuatan Hukum Anti-Sengketa:** Pihak faskes dan BPJS Kesehatan dapat memverifikasi keaslian dokumen secara instan, mencegah manipulasi atau perubahan dokumen setelah pemeriksaan bersama.

---

## 5. ANALISIS DAMPAK DATA EMPIRIS & SOLVABILITAS DANA JKN

### 5.1 Hasil Audit Empiris Gudang Data DuckDB (1.699.219 Klaim FKRTL · 2.091 RS)
Eksekusi mesin kolumnar DuckDB OLAP pada dataset terintegrasi (`6.264.346` total baris) menunjukkan sebaran konkret sebagai berikut:

| Indikator / Kategori Saring | Volume Tercatat | Nilai Finansial | Tindakan Sistem |
| :--- | :--- | :--- | :--- |
| **Total Klaim FKRTL Masuk** | 1.699.219 berkas | Rp 1,536 Triliun | Penapisan Tahap 1-4 Real-Time |
| **Disetujui Penuh (Jalur Hijau `0-49,9`)** | 1.697.588 berkas (99,90%) | Rp 1,534 Triliun | Fast-Track pembayaran VClaim (< 24 Jam) |
| **Koreksi Tarif Langsung (FKL47 vs FKL48)** | 1.631 berkas | Rp 2,07 Miliar | Klarifikasi & Rekonsiliasi Koding Casemix |
| **Klaim Ganda Hari Sama (Lintas & Intra RS)** | 4.876 pasang (9.555 berkas) | **Rp 32,59 Miliar** | **Prioritas Audit Pra-Bayar Jalur Merah (`>=75`)** |

### 5.2 Manfaat Operasional Langsung bagi BPJS Kesehatan
- **Total Eksposur Anomali & Koreksi Teridentifikasi:** **Rp 34,66 Miliar** (`Rp 32,59 Miliar` klaim ganda hari sama + `Rp 2,07 Miliar` selisih koreksi tarif langsung) terdeteksi langsung di tingkat transaksi FKRTL.
- **Kepatuhan SLA 10 Hari Kerja:** Pemilahan cepat menjaga SLA < 10 hari kerja (menghindari penalti keterlambatan 1% Perpres No. 82/2018).
- **Kesiapan Pembuktian Hukum:** Berita Acara berstempel hash SHA-256 menyediakan jejak audit (*chain of custody*) anti-manipulasi bila terjadi sengketa dengan Faskes.

---

## 6. TATA KELOLA KEAMANAN DATA, ZERO-PHI, & KONTROL AKSES

1. **Prinsip Zero-PHI Redaction:**
   Sebelum data diproses oleh modul analitik atau dikirimkan ke antarmuka pengguna, seluruh data identitas (NIK, Nomor Kartu BPJS, Nama Pasien, Rekam Medis) disamarkan (masking) menjadi data sintetis bertanda format `3372************` dan nama generik.
2. **Kontrol Akses Berbasis Hak Istimewa (Internet2 Grouper Model):**
   Setiap endpoint API krusial dilindungi otorisasi bertingkat:
   - Verifikator Lapangan: Akses baca (`READ`) dan pengusulan klarifikasi (`CLARIFY`).
   - Tim Analis Anti-Fraud / Pengawas Cabang: Hak eksekusi putusan (`ADJUDICATE`) dan penerbitan BAKB.
   - Administrator Sistem: Manajemen kunci dan audit sistem (`ADMIN`), tanpa akses melihat riwayat klinis murni peserta.
3. **Audit Ledger Kriptografis SHA-256 Terdesentralisasi:**
   Setiap interaksi keputusan verifikator, perubahan status jalur klaim, dan respons notifikasi Mobile JKN dicatat dalam berkas ledger JSONL berantai (chained SHA-256 hash) yang persisten di disk server. Apabila isi berkas diubah secara ilegal, fungsi verifikasi integritas sistem akan langsung mendeteksi pelanggaran urutan hash pada startup berikutnya.

---

## 7. LEMBAR JAWABAN PERTANYAAN KRITIS SESI MENTORING

### Q1: "Apakah ClaimTrace memperlambat waktu verifikasi klaim faskes sehingga membahayakan SLA 10 hari kerja BPJS Kesehatan?"
**Jawaban Defensif:**
"Sama sekali tidak, justru sebaliknya. ClaimTrace meloloskan klaim bersih (Jalur Hijau, rentang `0,0 - 49,9`) secara otomatis (*fast-track* < 24 jam) sehingga verifikator manusia tidak membuang waktu pada 99,90% klaim wajar. Verifikator hanya fokus pada klaster Kuning (`50,0 - 74,9`) dan Merah (`75,0 - 100` / Hard Trigger), sementara `StatutoryBusinessDaysEngine` memantau tenggat SLA 10 hari kerja Perpres No. 82/2018."

### Q2: "Bagaimana jika pasien tidak memiliki gawai pintar atau tidak membuka aplikasi Mobile JKN untuk membalas konfirmasi?"
**Jawaban Defensif:**
"Sinyal konfirmasi Mobile JKN (Sinyal 3) hanya memiliki bobot **20%** (`0,20*S3`) dan tidak pernah berdiri sendiri untuk memvonis Merah. Ketiadaan jawaban peserta tidak menyebabkan klaim langsung ditolak; tanpa konfirmasi sangkalan dan tanpa Hard Trigger SIP Expired, klaim hanya masuk klarifikasi Jalur Kuning (`50,0 - 74,9`), sehingga hak Faskes yang patuh tetap aman."

### Q3: "Apakah deteksi upcoding tidak menghukum rumah sakit yang memang merawat pasien komplikasi berat?"
**Jawaban Defensif:**
"Algoritma Lapis 1 kami menerapkan kaidah koding Permenkes 26/2021 dan Permenkes 3/2023 secara kontekstual. Sistem memeriksa korelasi antara diagnosis sekunder dengan parameter klinis objektif: bukti hasil laboratorium (LOINC), terapi obat spesifik dalam formularium nasional (KMK 200/2020), dan durasi hari rawat (LOS). Jika pasien didiagnosis sepsis berat namun tidak ada bukti pemberian antibiotik lini lanjutan atau tes kultur darah, sistem menandainya sebagai anomali ketidaksesuaian klinis. Selain itu, kami menyematkan pengecualian eksplisit untuk terapi kronis Program Rujuk Balik (PRB) agar tidak teridentifikasi sebagai unbundling."

### Q4: "Bagaimana posisi hukum penahanan klaim ini jika rumah sakit mengajukan gugatan sengketa?"
**Jawaban Defensif:**
"Penahanan pra-bayar di ClaimTrace bukan pembatalan klaim permanen sepihak, melainkan status penundaan sementara (HOLD_BAKB) untuk klarifikasi administratif bersama sesuai amanat Permenkes No. 26 Tahun 2021. Setiap berkas yang ditahan dilengkapi Dokumen Berita Acara Klarifikasi Bersama (BAKB) berstempel QR Code dengan tanda tangan digital verifikator dan hash SHA-256 yang merekam bukti anomali secara objektif. Ini memberikan posisi pembuktian hukum yang solid bagi BPJS Kesehatan di hadapan Tim Kendali Mutu dan Kendali Biaya (TKMKB) maupun dewan arbitrase medik."

### Q5: "Seberapa siap sistem ini diintegrasikan ke dalam ekosistem IT BPJS Kesehatan yang sudah ada?"
**Jawaban Defensif:**
"ClaimTrace dirancang dengan pendekatan modular non-disruptif. Sistem dapat beroperasi sebagai sidecar gateway yang menerima stream data JSON klaim dari VClaim dan SATUSEHAT melalui standar HL7 FHIR R4. Prototipe ini telah 100% selesai dibangun dengan 113 unit uji otomatis yang lulus sempurna, backend berkinerja tinggi FastAPI, dan frontend cockpit verifikator interaktif yang saat ini berjalan aktif di lingkungan lokal kami."

---

## 8. ROADMAP RANCANG BANGUN & INTEGRASI BERTAHAP

```mermaid
flowchart LR
    A["Bulan 1: Kalibrasi Model & Kebijakan Cabang"] --> B["Bulan 2: Uji Sandbox & Simulasi VClaim FHIR"]
    B --> C["Bulan 3: Piloting 1 Kantor Cabang (Fisioterapi)"]
    C --> D["Bulan 4: Evaluasi TKMKB & Uji Beban SLA"]
    D --> E["Bulan 5: Ekspansi ke 5 Cabang Utama"]
    E --> F["Bulan 6+: Rollout Nasional Terintegrasi Vedika"]
```

1. **Bulan 1 - Kalibrasi Parameter & Aturan Lokal:** Sesi bersama Kedeputian Bidang Pengawasan dan Pemeriksaan untuk menyelaraskan bobot sinyal dan ambang batas toleransi klaim per regional.
2. **Bulan 2 - Integrasi Sandbox API:** Penyiapan konektor HL7 FHIR R4 ke endpoint staging VClaim dan SATUSEHAT SDMK.
3. **Bulan 3 - Piloting Terbatas:** Penerapan uji coba paralel (shadow mode) di 1 Kantor Cabang percontohan khusus untuk penapisan klaim fisioterapi FKRTL.
4. **Bulan 4 - Tinjauan Efektivitas:** Pembandingan hasil deteksi pra-bayar terhadap klaim yang lolos manual, disupervisi bersama mentor BPJS Kesehatan.
5. **Bulan 5–6 - Ekspansi Terpimpin:** Perluasan ke 14 tipologi kecurangan lainnya dan peluncuran bertahap ke seluruh kantor cabang se-Indonesia.

---
*Dokumen dosir ini disiapkan oleh Tim TINEERENSE untuk sesi bimbingan teknis resmi Healthkathon BPJS Kesehatan 2026.*
