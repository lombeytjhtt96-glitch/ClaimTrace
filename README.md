# ClaimTrace — Sistem Penapisan & Efisiensi Risiko Klaim Faskes JKN
### *Decision Support System (DSS) Verifikator Klaim Pra-Bayar Berbasis Triase Multi-Sinyal Independen*
**BPJS Kesehatan Healthkathon 2026 — Tahap Final (Finalist Project)**  
**Kategori Utama:** *Efisiensi Risiko pada Fasilitas Kesehatan (FKRTL)*  
**Fokus Sub-Kategori:** *#6 Phantom Billing & #11 Repeat Billing*  
**Ekspansi Pasca-Healthkathon:** *Deteksi Upcoding INA-CBG, Lapis 4 FRISTA Biometrik Wajah, Berita Acara Digital QR SHA-256, dan Engine Kepatuhan SLA 10 Hari Kerja (Perpres No. 82/2018)*  

**Tim Pengembang: TINEERENSE (MAN 1 Surakarta)**  
- **Khalaf Faith Pradyatama** (*Ketua Tim · Lead Systems Architect & AppSec Engineer*)
- **Gaudiansyah Abiyu Mahya** (*Anggota Tim · AI/ML Engineer & Healthcare Data Analyst*)

---

## 1. Tujuan Tunggal & Cara Menyaring Klaim Anomali (Skala 0 - 100)

**Tujuan Tunggal ClaimTrace:** Mengendalikan kecurangan (*anti-fraud*) klaim FKRTL secara **pra-bayar** -- berfokus pada **#6 Phantom Billing**, **#11 Repeat/Split Billing**, dan **Upcoding INA-CBG** -- agar kebocoran Dana Jaminan Sosial (DJS) dicegah sebelum pencairan tanpa melanggar SLA verifikasi 10 hari kerja (Perpres No. 82 Tahun 2018).

Paradigma kerja: **"Satu skor prioritas (0 - 100), tiga lapis bukti faktual independen, keputusan mutlak tetap di tangan verifikator medis (Human-in-the-Loop)."**

```text
                        +---------------------------------------+
                        |    Input Berkas FPK / Klaim FKRTL     |
                        +-------------------+-------------------+
                                            |
        +-----------------------------------+-----------------------------------+
        |                                   |                                   |
        v                                   v                                   v
 [ Sinyal 1: Bobot 50% ]            [ Sinyal 2: Bobot 30% ]            [ Sinyal 3: Bobot 20% ]
   Pola Tagihan & Semantik           Legalitas SIP & OSRM DPJP           Konfirmasi Mobile JKN
 - Lonjakan Klaster >= 3,0x         - Validasi SIP SATUSEHAT SDMK      - Push Biner Ya / Tidak
 - Repeat Billing <= 30 hari        - Geovelocity OSRM > 120 km/jam    - Zero-PHI (UU PDP 27/2022)
 - ChromaDB Similarity >= 90%       - Beban > 40 pasien/hari           - Absen Respon -> Kuning
 - Pengecualian PRB <= 30 hari      - Hard Trigger: SIP Expired
        |                                   |                                   |
        +-----------------------------------+-----------------------------------+
                                            |
                                            v
                        +---------------------------------------+
                        |   Fusi Deterministik (Skala 0 - 100)  |
                        |   S = 0,50*S1 + 0,30*S2 + 0,20*S3     |
                        +-------------------+-------------------+
                                            |
        +-----------------------------------+-----------------------------------+
        |                                   |                                   |
        v                                   v                                   v
 [ JALUR HIJAU ]                    [ JALUR KUNING ]                    [ JALUR MERAH ]
  (0,0 - 49,9)                        (50,0 - 74,9)                      (75,0 - 100,0)
 Wajar / Fast-Track             Klarifikasi Berkas / Unsynced         Hard Trigger SIP Expired
   (< 24 Jam)                    (Tidak langsung vonis fraud)         Hold Pra-Bayar & BAKB SHA-256
```

---

## 2. Tiga Lapis Inti, Ambang Saring, & Data Gudang DuckDB

1. **Sinyal 1 -- Pola Tagihan, Semantik NLP, & Outlier AI (Bobot 50%):**
   Mendeteksi lonjakan klaster (`rasio_lonjakan_baseline >= 3,0x` tanpa izin baksos resmi), penagihan ulang episode identik (#11 Repeat Billing `<= 30` hari atau klaim ganda hari sama lintas/intra RS), upcoding Level I ke III, serta duplikasi narasi resume medis via ChromaDB (`all-MiniLM-L6-v2` cosine similarity `>= 90%`) dan Isolation Forest. Obat kronis Program Rujuk Balik (PRB `<= 30` hari) dikecualikan otomatis sesuai Permenkes No. 3/2023 Pasal 37.
2. **Sinyal 2 -- Legalitas SIP DPJP & Geovelocity OSRM (Bobot 30%):**
   Memeriksa masa berlaku SIP DPJP pada tanggal layanan (`EXPIRED` langsung memicu Hard Trigger ke Jalur Merah minimal skor `75,0`, sedangkan `UNSYNCED` dialihkan ke Jalur Kuning agar tidak menjadi *false positive* fraud), memeriksa beban harian DPJP (`> 40` pasien/hari), dan menghitung kelayakan rute darat via OSRM (`> 120 km/jam` antar RS dalam < 45 menit).
3. **Sinyal 3 -- Konfirmasi Biner Peserta Mobile JKN (Bobot 20%):**
   Mengirim konfirmasi kehadiran Ya/Tidak berprinsip *Zero-PHI* (tanpa mengekspos kode diagnosis ICD-10 atau obat) sesuai Pasal 34 UU PDP No. 27/2022. Ketiadaan respons peserta tidak memvonis Jalur Merah.
4. **Data Empiris Gudang Data DuckDB (`claimtrace_warehouse.db` -- Total 6.264.346 Baris):**
   - `bpjs_fkrtl_all`: **1.699.219 klaim FKRTL** dari **2.091 FKRTL** di **496 Kab/Kota (38 Provinsi)** senilai **Rp 1,536 Triliun** (rata-rata `4.643` klaim/hari, puncak `7.870`/hari).
   - `bpjs_kepesertaan_all`: **2.590.751 baris** master kepesertaan (1.065.281 keluarga).
   - `bpjs_diagnosissekunder_all`: **1.967.670 baris** diagnosis sekunder + `6.706` referensi ICD-10.
   - Anomali Empiris Terindeks: **1.631 klaim** koreksi tarif langsung (**Rp 2,07 Miliar**) dan **4.876 pasang** klaim ganda hari sama (`2.584` lintas RS Rp `19,26 Miliar` + `2.292` intra RS Rp `13,33 Miliar` = total eksposur **Rp 32,59 Miliar**).

---

## 3. Struktur Cockpit Terfokus (3 Kelompok Inti Pengendalian Fraud)

Navigasi disederhanakan menjadi 3 kelompok inti agar operator dan verifikator menguasai alur penyaringan tanpa distraksi halaman non-inti:
- **1. Pengendalian Fraud:** Kokpit Anti-Fraud Nasional, Peta Anomali 1,69 Juta Klaim, Gudang Data BPJS (DuckDB SQL).
- **2. Penyaringan Klaim Anomali:** Pipeline Penyaringan Klaim 4-Tahap (`GET /api/v1/screening/pipeline-summary`), Bedah Saring 3 Lapis (`0-100`), Deteksi Sindikat & Klaim Ganda, Profil Risiko Faskes (FRI), Validasi SIP & Geovelocity DPJP, Konfirmasi Mobile JKN (Dual View).
- **3. Putusan & Audit Pra-Bayar:** Konsol Putusan & BAKB QR SHA-256, Daftar Berkas & Klarifikasi, Klaim Ditandai (Hold/Flag), dan Ledger Audit SHA-256 tamper-evident.

---

## 4. Panduan Menjalankan Sistem di Lingkungan Lokal

### Prasyarat Sistem
- **Python**: Versi 3.10, 3.11, 3.12, atau 3.14
- **Node.js**: Versi 18+ atau 20+
- **Browser**: Google Chrome, Edge, atau Firefox

### Menjalankan Seluruh Layanan (Rekomendasi Cepat)
Gunakan skrip startup otomatis untuk menjalankan backend dan frontend sekaligus:
```bash
./start_all.sh
```
Atau di Windows Command Prompt:
```cmd
start_all.bat
```

### Menjalankan Layanan Secara Terpisah

#### 1. Backend API (FastAPI)
```bash
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **REST API Endpoint:** `http://localhost:8000/`
- **Dokumentasi Swagger / OpenAPI:** `http://localhost:8000/docs`
- **Daftar Klaim & Status:** `http://localhost:8000/api/v1/claims`
- **Berita Acara Digital (BAKB):** `http://localhost:8000/api/v1/claims/{claim_id}/official-bakb`
- **Throughput SIMD Benchmark:** `http://localhost:8000/api/v1/system/national-scale-benchmark`

#### 2. Frontend Cockpit (React 18 + Vite)
```bash
cd app
npm run dev -- --host 0.0.0.0 --port 3000
```
- **Aplikasi Web:** Buka browser pada **`http://localhost:3000`**
- **PWA Offline Service Worker:** Terpasang otomatis via `sw.js` untuk ketahanan audit lapangan Wasrik tanpa koneksi internet.
- **Kredensial Login Verifikator Resmi:**
  - NIP: `198704202011012001` (dr. Siti Rahma, Sp.PK — Verifikator Medis Senior)
  - Kata Sandi: `Password123!`
  - Alternatif NIP: `199208152015031002` (Budi Santoso, S.Kom, M.TI — Analis Forensik Wasrik)
  - Token Uji Otomatis CAPTCHA: `test-token`

---

## 5. Pengujian Kualitas & Validasi Otomatis

Pengujian otomatis (`backend/tests/` dan `tests_e2e/`) memvalidasi keamanan kriptografis, kalkulasi SLA hari kerja, integritas rantai audit SHA-256, rule anti-fraud, Zero-PHI UU PDP, dan algoritma penapisan `0,50*S1 + 0,30*S2 + 0,20*S3`:
```bash
cd backend && python3 -m pytest tests/ -q
python3 -m pytest tests_e2e/ -q
```
**Hasil Uji Kualitas Backend:**
- **222 of 222 Tests Passed (100% Green)**
- **Uji Integritas Rantai Audit Tamper-Evident:** Lulus 100% mendeteksi pemalsuan payload, manipulasi prev_hash, dan pembongkaran segel kriptografis.
- **Precision@100 = 100%** pada kasus teratas anomali holdout
- **False Positive Rate ke Jalur Merah = 0,00%** (klaim faskes patuh tidak ada yang salah diblokir)
- **Recall Antrean (Kuning + Merah) = 100%**

Pengujian Otomatis End-to-End Playwright Browser:
```bash
cd app
node tests/playwright_e2e_full_verification.js
```
Hasil: Seluruh 8 skenario operasional (Executive Hub, Triase 3 Jalur, Quick Triage, Database Viewer SQL, DPJP Intelligence & Geovelocity, Audit Ledger SHA-256, Mobile JKN Telemetry & PWA Cache, dan Post-Healthkathon AI Suite) lulus 100% tanpa kesalahan (*0 critical page errors*).

Stress Test Throughput DuckDB SIMD:
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/system/national-scale-benchmark?claim_count=500000"
```
Hasil: Pemrosesan 500.000 transaksi klaim FKRTL selesai dengan throughput di atas **2.500.000 hingga 4.100.000 baris/detik** (2.091 FKRTL).

Ketahanan Lapangan & Aksesibilitas (PWA & A11y):
- **PWA Service Worker:** Registrasi otomatis `sw.js` dengan strategi network-first untuk API dan cache-first untuk aset statis mendukung verifikator Wasrik di daerah terpencil.
- **Aksesibilitas Modal:** 100% modal (BAKB Adjudication, SecOps, Receipt, Cyber, Compliance, Report, Campaign, dan Bulk Tag) dilengkapi penanganan tombol Escape dan penutupan klik luar (backdrop click).

Kompilasi produksi frontend:
```bash
cd app
npm run build
```
Hasil: Kompilasi Vite berhasil 100% tanpa kesalahan (*0 errors*) dalam waktu ~9 detik.

---

## 6. Kepatuhan Regulasi & Standar Keamanan

- **Perpres No. 82 Tahun 2018 Pasal 74 & 76:** Menjaga SLA pembayaran klaim maksimal 15 hari kalender dan SLA verifikasi 10 hari kerja.
- **Permenkes No. 26 Tahun 2021:** Pedoman pencegahan dan penanganan kecurangan (*fraud*) dalam program Jaminan Kesehatan Nasional.
- **Permenkes No. 3 Tahun 2023 Pasal 37:** Standar tarif pelayanan kesehatan dan perlindungan klaim obat Program Rujuk Balik (PRB).
- **UU No. 27 Tahun 2022 (UU PDP):** Prinsip minimasi data, *Zero-PHI Redaction*, dan penyamaran kriptografis pada seluruh data medis peserta.
- **ISO/IEC 27001 & NIST CSF 2.0:** Pengamanan API melalui validasi input SQL Guard, prompt firewall, dan rate limiting adaptif.

---

## 7. Pernyataan Integritas Data
Dikembangkan khusus untuk kompetisi **BPJS Kesehatan Healthkathon 2026**.  
Seluruh data identitas peserta, dokter, fasilitas kesehatan, nomor kartu BPJS/KIS, NIK, dan nomor rekam medis yang digunakan dalam demonstrasi prototipe ini adalah **data sintetis/fiktif** yang dihasilkan secara terkalibrasi guna mematuhi prinsip kerahasiaan medis dan perlindungan data pribadi.
