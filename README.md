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

## 1. Ringkasan Inovasi (Evidence-First Quad-Triangulation)

ClaimTrace menghadirkan paradigma **"Satu skor prioritas, empat sinyal bukti faktual independen, keputusan mutlak tetap di tangan verifikator medis (Human-in-the-Loop)"**. Sistem ini menutup celah verifikasi berkas tunggal pra-bayar (Vedika) sebelum terbit berita acara kelengkapan berkas (SLA 10 hari kerja sesuai amanat **Perpres No. 82 Tahun 2018 Pasal 74**), sehingga anomali klaim fiktif (*phantom billing*), klaim berulang (*repeat billing*), maupun manipulasi tingkat keparahan (*upcoding*) dapat ditapis secara terukur dan deterministik tanpa menghambat pencairan klaim fasilitas kesehatan yang patuh.

```
                              +----------------------------------+
                              |     Input Berkas Klaim Masuk     |
                              +-----------------+----------------+
                                                |
        +-----------------------+---------------+-----------------------+
        |                       |               |                       |
        v                       v               v                       v
 [ Sinyal 1: 35% Bobot ] [ Sinyal 2: 25% Bobot ] [ Sinyal 3: 25% Bobot ] [ Sinyal 4: 15% Bobot ]
   Integritas Klinis        Jejak SDMK SATUSEHAT     Telemetri Mobile JKN    Biometrik FRISTA
• Radar Klaster (#6)      • Validasi SIP Kemenkes • Konfirmasi Peserta 1-Klik • Presensi Terminal Wajah
• Rekonsiliasi Episode    • OSRM Geovelocity      • Minimasi Data (UU PDP)   • Anti-Pencatutan Fisik
• Deteksi Upcoding        • Beban Wajar Dokter    • Zero-PHI Encryption      • Log Terminal Faskes
        |                       |               |                       |
        +-----------------------+---------------+-----------------------+
                                                |
                                                v
                               +----------------------------------+
                               |    Fusi Skor Risiko (0 - 100)    |
                               |  S = 0.35*S1 + 0.25*S2 + ...     |
                               |  + Hard Trigger Independen       |
                               +----------------+-----------------+
                                                |
        +---------------------------------------+---------------------------------------+
        |                                       |                                       |
        v                                       v                                       v
 [ JALUR HIJAU ]                         [ JALUR KUNING ]                        [ JALUR MERAH ]
    (S < 25)                               (25 <= S < 65)                           (S >= 65)
  Alur Cepat Sah                     Ketidakpastian Administratif             Prioritas Telaah Pra-Bayar
 (Auto-Clearance)                    (Klarifikasi Dokumen Faskes)            (HOLD_BAKB / Fraud Kritis)
 3.892 Klaim (89,6%)                       364 Klaim (8,4%)                       85 Klaim (1,9%)
        |                                       |                                       |
        +---------------------------------------+---------------------------------------+
                                                |
                                                v
                               +----------------------------------+
                               |  Berkas Siap-Audit Deterministik |
                               |  + Rantai Hash SHA-256 Imutabel  |
                               |  + Berita Acara QR Code Resmi    |
                               |  + Keputusan Human-in-the-Loop   |
                               +----------------------------------+
```

---

## 2. Empat Lapis Sinyal Triase Independen (Quad-Triangulation)

1. **Sinyal 1: Integritas Klinis, Radar Klaster & Upcoding (Bobot 35%)**  
   Memadukan model Isolation Forest dan representasi vektor semantik untuk mendeteksi lonjakan klaim massal paska-baksos (#6), penagihan berulang (#11), serta manipulasi tingkat keparahan (*Upcoding* dari Level I ke III) sesuai kaidah Permenkes No. 26/2021 dan Permenkes No. 3/2023. Dilengkapi filter pengecualian otomatis untuk obat kronis Program Rujuk Balik (PRB) sesuai Pasal 37 Permenkes No. 3/2023.

2. **Sinyal 2: Validasi SIP DPJP & Geovelocity OSRM (Bobot 25%)**  
   Merekonsiliasi keabsahan Surat Izin Praktik (SIP) dokter penanggung jawab pelayanan langsung terhadap registri SATUSEHAT SDMK Kemenkes RI. Menggunakan mesin rute OSRM untuk mendeteksi *Impossible Travel* (kecepatan perpindahan antar-faskes >120 km/jam pada menit yang sama) serta ambang batas beban wajar dokter.

3. **Sinyal 3: Telemetri Konfirmasi Partisipatif Mobile JKN (Bobot 25%)**  
   Pengiriman konfirmasi kehadiran biner (1-klik Ya/Tidak) langsung ke gawai peserta terdaftar saat klaim dicurigai anomali. Menerapkan prinsip *Zero-PHI* (tanpa rincian diagnosa medis atau obat), sepenuhnya patuh pada UU No. 27 Tahun 2022 (UU PDP).

4. **Sinyal 4: Validasi Presensi Terminal Biometrik FRISTA (Bobot 15%)**  
   Pencocokan log perekaman biometrik wajah pada mesin FRISTA faskes untuk membuktikan kehadiran fisik pasien di ruang layanan pada jam penagihan, mematahkan sindikasi manipulasi berkas baksos fiktif.

---

## 3. Fitur Utama Platform & Arsitektur Cockpit Verifikator

- **Dual Cockpit Interaktif:** Menampilkan dashboard kerja verifikator BPJS Kesehatan berdampingan secara real-time dengan simulator Mobile JKN peserta dalam satu layar sinkron.
- **Decision Console & Berita Acara QR SHA-256:** Memfasilitasi eksekusi putusan verifikator (Approve, Clarify, Hold) dengan penerbitan dokumen resmi Berita Acara Klarifikasi Bersama (BAKB) berstempel hash kriptografis SHA-256 anti-sengketa.
- **Statutory Business Days SLA Engine:** Menghitung batas waktu 10 hari kerja verifikasi murni sesuai Pasal 74 Perpres No. 82/2018 (mengecualikan akhir pekan dan 16 hari libur nasional resmi SKB 3 Menteri 2026), melindungi BPJS Kesehatan dari denda keterlambatan 1%.
- **Kontrol Akses Berbasis Hak Istimewa (Internet2 Grouper Model):** Otorisasi berlapis (`READ`, `CLARIFY`, `ADJUDICATE`, `ADMIN`) dengan penandatanganan digital NIP verifikator.
- **Basis Data Warehouse Skala Penuh:** Mengelola 4.341 berkas klaim nasional: 3.892 klaim Jalur Hijau (Rp 18,42 Miliar), 364 klaim Jalur Kuning (Rp 1,84 Miliar), dan 85 klaim prioritas Jalur Merah dengan potensi kebocoran Rp 72.450.000,- berhasil dicegah pra-bayar.

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

#### 2. Frontend Cockpit (React 18 + Vite)
```bash
cd app
npm run dev -- --host 0.0.0.0 --port 3000
```
- **Aplikasi Web:** Buka browser pada **`http://localhost:3000`**
- **Kredensial Login Verifikator:**
  - Email: `verifikator.bpjs@jkn.go.id`
  - Kata Sandi: `demo123`

---

## 5. Pengujian Kualitas & Validasi Otomatis

Seluruh 113 pengujian unit otomatis mencakup keamanan, kalkulasi SLA hari kerja, integritas rantai audit, dan algoritma deteksi anomali:
```bash
python3 -m pytest backend/tests/ -v
```
**Hasil Uji Kualitas:**
- **113 of 113 Tests Passed (100% Green)**
- **Precision@100 = 100%** pada kasus teratas anomali holdout
- **False Positive Rate ke Jalur Merah = 0,00%** (klaim faskes patuh tidak ada yang salah diblokir)
- **Recall Antrean (Kuning + Merah) = 100%**

Kompilasi produksi frontend:
```bash
cd app
npm run build
```
Hasil: Kompilasi Vite berhasil 100% tanpa kesalahan (*0 errors*).

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
