# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Project: ClaimTrace — Evidence-First Pre-Payment Fraud Triage System
**Event:** BPJS Kesehatan Healthkathon 2026  
**Category:** Efisiensi Risiko pada Fasilitas Kesehatan  
**Sub-Categories:** #6 Phantom Billing & #11 Repeat Billing  
**Author Tim Pengusul:** Tim TINEERENSE (MAN 1 Surakarta)  
**Lead Developers:** Khalaf Faith Pradyatama & Gaudiansyah Abiyu Mahya  
**Version:** 1.0.0-FINAL  
**Target Completion:** 1 November 2026  

---

## 1. Executive Summary & Problem Space

### 1.1. Latar Belakang & Urgensi Nasional
Dalam ekosistem Jaminan Kesehatan Nasional (JKN) yang melayani lebih dari 1,9 juta pemanfaatan layanan per hari di seluruh Indonesia, volume klaim fasilitas kesehatan rujukan tingkat lanjut (FKRTL) yang sangat masif menciptakan tantangan pengawasan yang kritis bagi BPJS Kesehatan:
- **Kerugian Riil:** Temuan audit gabungan KPK dan Kemenkes RI (Juli 2024) mengungkap dugaan kerugian klaim fiktif sebesar **±Rp34 Miliar** di 3 RS khusus (rentang klaim fiktif per RS: Rp1–3 M, Rp4–10 M, dan Rp20–30 M).
- **Tingkat Keparahan Phantom Billing (#6):** Dari 4.341 klaim fisioterapi di 3 RS khusus yang diaudit, **75,3% (3.269 klaim)** terbukti merupakan klaim fiktif di mana pasien tidak pernah menerima layanan medis.
- **Celah Sistemik Verifikasi Pra-Bayar:** Sistem verifikasi digital administratif pra-bayar saat ini (*Vedika*) memvalidasi kelengkapan berkas digital dan kaidah koding INA-CBG. Namun, jika faskes nakal menyusun berkas lengkap dengan identitas peserta yang dicatut (misalnya dari kegiatan massal/baksos), klaim dapat lolos hingga terbit Berita Acara Kelengkapan Berkas. Audit mendalam (*VPK* dan *AAK*) saat ini mayoritas bersifat pasca-bayar (*post-payment*), sehingga uang Dana Jaminan Sosial (DJS) telah terlanjur cair ke faskes.

### 1.2. Definisi Solusi: Apa Itu ClaimTrace?
**ClaimTrace adalah Decision Support System (DSS) pra-bayar berbasis web untuk Verifikator BPJS Kesehatan yang mengintegrasikan algoritma fusi multi-sinyal 3 lapis bukti guna menyaring anomali klaim sebelum Berita Acara Kelengkapan Berkas diterbitkan.**

> **DOKTRIN UTAMA SISTEM:**
> *"Satu skor prioritas, tiga lapis bukti, keputusan tetap di manusia (Human-in-the-Loop)."*

ClaimTrace **BUKAN** aplikasi mandiri yang diinstal pasien untuk pengobatan sehari-hari. ClaimTrace adalah:
1. **Mesin Backend & Scoring Engine (Core Brain):** Bekerja on-premise di infrastruktur BPJS Kesehatan untuk merekonsiliasi jutaan baris klaim terhadap basis data internal, SATUSEHAT SDMK Kemenkes, dan log kehadiran.
2. **Web Dashboard Verifikator (Core Face):** Antarmuka utama berbasis web pada layar komputer petugas verifikator BPJS Kesehatan untuk melihat antrean triage (Hijau/Kuning/Merah), inspeksi graf jejaring anomali, dan pembuatan berkas siap-audit.
3. **Kanal Mobile JKN (Companion Endpoint / Layer 3):** Endpoint out-of-band terotentikasi pada smartphone peserta untuk konfirmasi presensi biner (*Ya / Tidak*) guna memvalidasi kehadiran layanan berisiko tinggi tanpa membuka data medis sensitif (Kepatuhan UU PDP No. 27/2022).

---

## 2. User Personas & Ecosystem Actors

### Persona 1: Verifikator Klaim BPJS Kesehatan (Primary User)
- **Nama:** dr. Siti Rahma / Verifikator KC Surakarta
- **Karakteristik:** Menelaah 200–500 berkas klaim per hari. Dikejar batas waktu (SLA) 10 hari kalender sesuai Pasal 76 ayat (2) Perpres No. 82/2018 sebelum berkas otomatis dianggap lengkap dan wajib dibayar.
- **Pain Points:** Terlalu banyak berkas PDF, kelelahan kognitif (*alert fatigue*), kesulitan membuktikan apakah pasien benar-benar hadir atau fiktif jika dokumen administrasi lengkap.
- **Kebutuhan dari ClaimTrace:** Satu skor prioritas telaah yang jelas, bukti konkret yang siap dijadikan dasar penundaan berkas (bebas halusinasi), dan ringkasan audit siap-cetak.

### Persona 2: Peserta JKN-KIS (Secondary User / Verification Subject)
- **Nama:** Khalaf / Peserta JKN Aktif
- **Karakteristik:** Menggunakan aplikasi Mobile JKN di smartphone untuk administrasi kartu dan antrean faskes.
- **Pain Points:** Khawatir identitasnya (NIK/No. KIS) disalahgunakan oleh faskes yang tidak bertanggung jawab untuk menagihkan klaim fiktif.
- **Kebutuhan dari ClaimTrace:** Notifikasi konfirmasi presensi yang sederhana (1-klik Ya/Tidak), tidak membingungkan, dan menjamin kerahasiaan data medis pribadinya.

### Persona 3: Fasilitas Kesehatan Mitra (Monitored Entity)
- **Peran:** Mengajukan klaim INA-CBG setelah memberikan pelayanan.
- **Kebutuhan:** Kepastian bahwa klaim wajar (90%+) tidak terhambat dan langsung masuk jalur cepat (*fast-track green*), sementara klarifikasi hanya ditujukan pada klaim yang benar-benar beranomali secara transparan.

---

## 3. Product Architecture: Arsitektur 3 Lapis Bukti

ClaimTrace mengonsolidasikan tiga sinyal independen menjadi satu skor deterministik:

### 3.1. Lapis 1: Radar Pola & Rekonsiliasi Episode (Bobot: 50%)
- **Tujuan:** Mendeteksi anomali spatiotemporal massal (#6 Phantom Billing) dan klaim berulang pada episode yang sama yang telah dibayar sebelumnya (#11 Repeat Billing).
- **Logika Algoritma:**
  - Menghitung deviasi volume klaim harian faskes terhadap *moving average* 30 hari ($V_{\text{actual}} / V_{\text{baseline}}$). Lonjakan $>5\times$ pasca-kegiatan massal memicu skor anomali tinggi.
  - Membandingkan *Episode Fingerprint* (kombinasi ID Pasien, Faskes, Kode ICD-10, Tindakan ICD-9-CM, dan rentang tanggal) terhadap riwayat klaim terbayar. Jika duplikat terdeteksi pada siklus terapi yang tidak wajar, skor $S_1$ melonjak hingga $85–100$.

### 3.2. Lapis 2: Uji Jejak Layanan & SATUSEHAT SDMK (Bobot: 30%)
- **Tujuan:** Validasi legitimasi penugasan dan kapasitas operasional DPJP (Dokter Penanggung Jawab Pelayanan).
- **Logika Algoritma:**
  - Melakukan kueri API/basis data federasi SATUSEHAT SDMK Kemenkes: Apakah Surat Izin Praktik (SIP) dokter terdaftar aktif di faskes bersangkutan pada tanggal layanan?
  - Menghitung batas beban layanan harian dokter ($>60$ pasien fisioterapi/hari per satu dokter spesialis KFR mengindikasikan ketidakwajaran fisik).
  - **Skor $S_2$:** Jika SIP terbukti kedaluwarsa atau tidak ada penugasan aktif, $S_2 = 95$ dan mengaktifkan bendera **Hard Trigger** independen.

### 3.3. Lapis 3: Konfirmasi Presensi Peserta via Mobile JKN (Bobot: 20%)
- **Tujuan:** Bukti empiris dari subjek layanan untuk mematahkan klaim fiktif total.
- **Logika Algoritma:**
  - Sistem mengirimkan sampel terarah (misal: 10 peserta acak dari klaster klaim berisiko) berupa notifikasi terotentikasi ke Mobile JKN.
  - Menanyakan pertanyaan biner minimasi data: *"Apakah benar Anda hadir secara langsung dan menerima tindakan medis [Nama Tindakan] pada [Tanggal Layanan] di [Nama Faskes]?"*
  - **Skor $S_3$:** Dihitung dari rasio peserta yang menyangkal kehadiran ($S_3 = \frac{N_{\text{denied}}}{N_{\text{total}}} \times 100$). Jika 8 dari 10 menyangkal, $S_3 = 80$.

---

## 4. Mathematical Formulation & Triage Rules

### 4.1. Formula Fusi Skor
$$\text{Skor Prioritas Telaah } (S) = 0.5 \cdot S_1 + 0.3 \cdot S_2 + 0.2 \cdot S_3 \quad \text{di mana } S, S_1, S_2, S_3 \in [0, 100]$$

### 4.2. Aturan Ambang Batas (Triage Thresholds)
| Kategori Triage | Rentang Skor ($S$) | Definisi Status | Tindakan Verifikator BPJS |
| :--- | :---: | :--- | :--- |
| **HIJAU (Fast-Track)** | $S < 50$ | Klaim Wajar & Terverifikasi | Lolos otomatis, diteruskan ke proses penerbitan Berita Acara pembayaran. |
| **KUNING (Klarifikasi)** | $50 \le S < 75$ | Ketidakpastian Administratif | Meminta klarifikasi dokumen/data sinkronisasi ke faskes via portal digital dalam rentang SLA. |
| **MERAH (Prioritas Telaah)** | $S \ge 75$ | Dugaan Kuat Fraud (#6 / #11) | **Tunda Berita Acara Pembayaran**, terbitkan Berkas Telaah Siap-Audit, jadwalkan audit lapangan / VPK. |
| **HARD TRIGGER (Override)** | Bebas ($S_2 \ge 90$) | Pelanggaran Izin Praktik DPJP | Otomatis dialihkan ke **MERAH** tanpa memandang skor Lapis 1 atau Lapis 3. |

---

## 5. Functional Requirements (FR)

### Modul 1: Triage Overview & KPI Dashboard
- **FR-1.1:** Sistem harus menyajikan kartu ringkasan KPI real-time: Total Klaim Diuji, Jumlah Jalur Hijau (%), Jalur Kuning (%), Jalur Merah (%), dan Estimasi Potensi Inefisiensi Biaya Terselamatkan (Rp).
- **FR-1.2:** Sistem harus menyediakan filter interaktif berdasarkan Nama Faskes, Kode INA-CBG, Periode Layanan, dan Status Triage.
- **FR-1.3:** Tabel antrean harus secara otomatis memprioritaskan (sort descending) klaim dengan status **MERAH** di urutan teratas.

### Modul 2: Evidence-First Case Investigation & Graph Viewer
- **FR-2.1:** Saat sebuah baris klaim diklik, sistem harus membuka panel *Evidence Sheet Matrix* yang menampilkan rincian matematis 3 Lapis Bukti ($S_1, S_2, S_3$).
- **FR-2.2:** Sistem harus memvisualisasikan jejaring relasi entitas (*Graph Network Topology*): Node RS $\leftrightarrow$ Node DPJP $\leftrightarrow$ Node Cluster Pasien $\leftrightarrow$ Node Tanggal Layanan.
- **FR-2.3:** Sistem harus menyoroti anomali klaster secara visual (node berwarna merah jika DPJP tidak aktif atau lonjakan volume terjadi).

### Modul 3: Human-in-the-Loop Decision & Tamper-Evident Audit Trail
- **FR-3.1:** Sistem TIDAK BOLEH membatalkan atau menolak klaim secara otomatis; seluruh wewenang penundaan berada di tangan Verifikator BPJS.
- **FR-3.2:** Menyediakan 4 tombol keputusan:
  1. `[Tunda Berita Acara & Minta Klarifikasi Faskes]` (SOP 10 Hari Perpres 82/2018)
  2. `[Jadwalkan Uji Petik Lapangan / VPK]`
  3. `[Loloskan Klaim (Override Manual dengan Alasan Yuridis)]`
  4. `[Ekspor Berkas Telaah Siap-Audit (PDF Format)]`
- **FR-3.3:** Setiap kali keputusan verifikator diambil, sistem harus membuat tanda tangan kriptografis **SHA-256 Hash Audit Stamp** yang mencatat timestamp, ID Verifikator, parameter skor, dan keputusan untuk akuntabilitas hukum.

### Modul 4: Mobile JKN Presence Verification Bridge (Lapis 3)
- **FR-4.1:** Menyediakan simulator smartphone Mobile JKN dengan antarmuka presisi 1:1 terhadap aplikasi resmi `v4.18.0`.
- **FR-4.2:** Simulator harus dapat menerima sinyal push notification dari backend saat klaim masuk kategori telaah.
- **FR-4.3:** Menampilkan bottom sheet interaktif dengan pertanyaan biner *(Ya, Saya Menerima / Tidak Pernah)* tanpa menampilkan diagnosa klinis sensitif.
- **FR-4.4:** Setiap input dari simulator Mobile JKN harus tersinkronisasi instan (*Reactive Live Bridge*) ke Web Dashboard Verifikator, memperbarui nilai $S_3$ dan fusi skor $S$.

---

## 6. Non-Functional Requirements & Governance

### 6.1. Kepatuhan Hukum & Perlindungan Data Pribadi
- **UU PDP No. 27/2022 (Perlindungan Data Pribadi):** 
  - Prinsip *Data Minimization*: Konfirmasi kehadiran di Mobile JKN hanya memaparkan nama faskes, tanggal, nama dokter, dan nama tindakan umum. Tidak ada kode ICD-10 klinis atau riwayat penyakit sensitif yang ditampilkan.
  - Peran Data: BPJS Kesehatan bertindak sebagai Pengendali Data (*Data Controller*), sedangkan modul ClaimTrace bertindak sebagai Pemroses Data (*Data Processor*).
- **Perpres No. 82/2018 Pasal 76 ayat (2):** 
  - Verifikasi pra-bayar harus diselesaikan dalam batas SLA maksimal 10 hari kalender sejak berita acara pengajuan klaim diterbitkan faskes. ClaimTrace menuntaskan scoring fusi dalam waktu $<30$ detik per batch klaim.

### 6.2. Kesiapan On-Premise & Latensi
- Sistem dirancang untuk berjalan di lingkungan intranet/on-premise data center BPJS Kesehatan tanpa dependensi API cloud pihak ketiga untuk mencegah kebocoran data identitas nasional.
- Latensi kalkulasi skor: $<50$ ms per klaim tunggal.

---

## 7. Acceptance Criteria untuk Healthkathon 2026 Demo Video

1. **Checklist Video 10 Menit:**
   - [x] Perkenalan Tim TINEERENSE & Latar Belakang Masalah (Slide 1–4).
   - [x] Penjelasan Alur 3 Lapis & Formula Fusi Skor Matematis (Slide 5–7).
   - [x] **Live Demo Aplikasi (Bukan Slide):** Menampilkan Web Dashboard Verifikator dan Simulasi Mobile JKN secara berdampingan (*Split-Sync*).
   - [x] Demonstrasi Skenario Kasus Baksos #6: Menunjukkan bagaimana respons "Tidak Pernah" dari Mobile JKN seketika mengubah skor menjadi Merah ($87.0$) dan memicu tombol penundaan berkas siap-audit.
   - [x] Penjelasan Tata Kelola Etika, UU PDP, dan Human-in-the-Loop.
