# Koreksi Slide Demo & Naskah Presenter Tepat 3 Menit — ClaimTrace JKN

> [!IMPORTANT]
> **Sinkronisasi Rekaman:** Naskah di bawah ini disusun tepat **180 detik (`00:00` – `03:00`)** mengikuti setiap gerakan kursor, klik, dan pergantian layar pada video rekaman demo **ClaimTrace Live (`https://claimtrace-jkn.vercel.app/`)**. Tempo bicara ideal: **~130 kata/menit** (tenang, lugas, dan percaya diri di depan juri).

---

## Bagian 1: Koreksi Slide `"Demo Aplikasi Terbaru"`

Berdasarkan gambar slide yang Anda kirimkan, **4 tangkapan layar pada slide tersebut masih memakai versi antarmuka lama** dan perlu diperbarui agar konsisten 100% dengan aplikasi yang sekarang live saat demo:

| Panel Slide | Masalah pada Slide Lama | Koreksi Wajib (Versi Terbaru Live) |
| :--- | :--- | :--- |
| **Seluruh Panel (1–4)** | Masih menampilkan **sidebar versi lama** (menu panjang & navigasi duplikat) serta header lama. | Ganti dengan screenshot terbaru yang sudah memakai **sidebar bersih tanpa penomoran** dan **tanpa navbar horizontal atas**. |
| **Panel 1 — Dashboard Eksekutif** | Tampilan masih versi lama dan belum menunjukkan badge konektivitas dataset skala nasional (`6,26 Jt Baris Terhubung`) serta tabel *Klaim Prioritas Terbaru* yang bisa diklik langsung. | Gunakan screenshot terbaru **`1_dashboard_eksekutif.png`**. Judul sudah tepat: **`1. Dashboard Eksekutif (1,699 Jt Klaim \| SLA 99,9%)`** — bisa diperkuat menjadi **`1. Dashboard Eksekutif Nasional (1,699 Jt Klaim \| Rp 1,536 T)`**. |
| **Panel 2 — Telaah 4-Lapis** | Masih memakai layout lama dan belum menonjolkan integrasi **Audit NLP Klinis & NegEx** yang sekarang berjalan mulus di dalam tab *Telaah & Dokumen Medis*. | Gunakan screenshot terbaru **`2_telaah_4lapis_klinis.png`**. Judul direkomendasikan: **`2. Telaah Fraud 4-Lapis, Biometrik FRISTA & NLP Klinis`**. |
| **Panel 3 — Cek Dokumen RS** | Masih memperlihatkan dropdown statis `<select>` lama pada `Pilih Kasus:` yang tidak realistis untuk jutaan klaim nasional. | Gunakan screenshot terbaru **`3_cek_7dokumen_icd10.png`** yang sudah memakai **Searchable Combobox**, **7 Berkas Wajib PMK 26/2021**, serta panel **Uji Rule MB1–MB5 & Fornas**. Judul direkomendasikan: **`3. Cek 7 Dokumen Wajib, ICD-10 & Uji Rule MB1–MB5`**. |
| **Panel 4 — Laporan Resmi BAHV** | Masih memperlihatkan dropdown `<select>` statis lama pada `Fasilitas Kesehatan (FKRTL)` dan `Nomor Batch FPK` (tidak logis untuk ribuan FKRTL se-Indonesia). | Gunakan screenshot terbaru **`4_laporan_bahv_sha256.png`** yang sudah memakai **Searchable Combobox Faskes & Batch FPK** + pratinjau cetak **BAHV Kolektif & Segel QR SHA-256**. Judul sudah sangat bagus: **`4. Laporan Resmi BAHV Kolektif + Segel QR SHA-256`**. |

> [!TIP]
> **Keunggulan Teknis yang Wajib Anda Sebut ke Juri:** Seluruh tabel data besar (Antrean Klaim, Faskes, DPJP, Peringkat Risiko, dan Jejak Audit) kini memakai **Enterprise Paginated Table (`10/25/50/100` baris/halaman)** dan **Searchable Combobox** (*type-to-filter*) — bukan grid kartu atau dropdown statis — sehingga **logis dan siap menangani 2.091+ FKRTL dan jutaan klaim BPJS Kesehatan secara nasional**.

---

## Bagian 2: Naskah Presenter Tepat 3 Menit (`00:00` – `03:00`)

Tekan **Play** pada video demo tepat saat Anda mulai mengucapkan baris `00:00`.

### `00:00 – 00:12` | Pembukaan & Akses Portal Verifikator *(12 detik)*
> *[Layar: Halaman Masuk ClaimTrace → Kursor klik "Masuk Akun Demo"]*
>
> "Selamat pagi/siang Dewan Juri. Inilah **ClaimTrace**, sistem pendukung keputusan pengawasan pra-pembayaran klaim JKN berbasis AI untuk BPJS Kesehatan. Mari kita masuk langsung ke Portal Verifikator."

---

### `00:12 – 00:32` | Dashboard Ringkasan Eksekutif *(20 detik)*
> *[Layar: Dashboard Ringkasan Eksekutif → Kursor sorot 4 KPI → Scroll ke Grafik Tren & Tabel Klaim Prioritas]*
>
> "Di **Dashboard Ringkasan Eksekutif**, pimpinan cabang dapat memantau **1,699 juta klaim FKRTL** senilai **1,536 triliun rupiah** dari **2.091 rumah sakit** secara *real-time*, dengan kepatuhan **SLA 10 hari kerja sebesar 99,9 persen**. Di bawahnya tersedia grafik tren verifikasi, proporsi risiko, dan daftar klaim prioritas tertinggi yang bisa langsung dibuka untuk ditelaah."

---

### `00:32 – 00:55` | Antrean Klaim Skala Nasional & Pencarian Cerdas *(23 detik)*
> *[Layar: Klik "Antrean & Berkas Klaim" → Ketik "Mitra" di Searchable Combobox → Pilih RS Khusus Mitra Husada → Reset `×` → Klik "Telaah" pada `CLM-2026-8801`]*
>
> "Masuk ke **Antrean Berkas Klaim**. Karena BPJS Kesehatan menangani ribuan faskes dan jutaan berkas se-Indonesia, antrean ini kami rancang dalam format **tabel berpaginasi** — bukan kartu — lengkap dengan **kolom pencarian Faskes cerdas** berbasis *autocomplete*. Verifikator cukup mengetik nama rumah sakit seperti *Mitra* untuk langsung menyaring berkas tanpa memuat ribuan opsi sekaligus. Sekarang kita klik **Telaah** pada klaim berisiko tertinggi."

---

### `00:55 – 01:28` | Telaah 4-Lapis, NLP Klinis & Cek 7 Dokumen Wajib *(33 detik)*
> *[Layar: Audit 4-Lapis & Klinis pada `CLM-2026-8801` → Scroll ke Bukti & NLP → Klik sub-tab "Cek 7 Dokumen & ICD-10" → Klik "Uji Rule MB1–MB5 & Fornas"]*
>
> "Di halaman **Telaah & Dokumen Medis**, ClaimTrace menyajikan **Profil Risiko 4-Lapis** secara transparan — Lapis pertama **Radar Pola Tagihan** yang mendeteksi lonjakan 8,5 kali *baseline*, Lapis kedua **Validasi SDMK** yang menemukan **SIP dokter kedaluwarsa**, Lapis ketiga **Konfirmasi Peserta Mobile JKN dan Biometrik FRISTA** di mana 8 dari 10 pasien menyangkal layanan, serta Lapis keempat **NLP klinis** yang menyoroti entitas diagnosis dari resume medis.
>
> Beralih ke tab **Cek 7 Dokumen & ICD-10**, sistem otomatis mendeteksi anomali **inversi waktu**, mengecek kelengkapan berkas wajib PMK 26/2021, dan menjalankan **Uji Rule MB1–MB5 serta Fornas** dalam satu klik."

---

### `01:28 – 01:55` | Konsol Putusan Human-in-the-Loop & Mobile JKN *(27 detik)*
> *[Layar: Klik "Konsol Putusan & BAKB" → Scroll panel keputusan → Klik "Panel Mobile JKN" di kanan atas → Tutup panel]*
>
> "AI tidak menggantikan verifikator. Di **Konsol Putusan & BAKB**, keputusan akhir tetap berada pada prinsip **Human-in-the-Loop** melalui verifikasi berjenjang Tier 1 dan persetujuan Supervisor Tier 2 beserta dasar regulasinya.
>
> Uniknya, ClaimTrace terhubung langsung dengan **Panel Mobile JKN** di sisi peserta — sehingga jika pasien menyangkal layanan atau melaporkan kejanggalan tarif, sinyal tersebut otomatis masuk sebagai bukti penguat pada Lapis ketiga."

---

### `01:55 – 02:25` | Pengawasan Faskes, Peringkat Risiko & Intelijen DPJP *(30 detik)*
> *[Layar: Klik "Faskes & DPJP" → Sub-tab "Peringkat & Kohort RS" → Sub-tab "Intelijen DPJP & SIP"]*
>
> "Untuk pengawasan makro, modul **Faskes & DPJP** memantau kinerja seluruh rumah sakit mitra dalam tabel berpaginasi. Melalui **Peringkat & Kohort RS**, tim pengawas dapat mengidentifikasi rumah sakit dengan rasio *upcoding* dan potensi kerugian DJS tertinggi secara objektif.
>
> Sementara di tab **Intelijen DPJP & SIP**, sistem melacak anomali praktik dokter secara otomatis, termasuk potensi klaim dengan izin praktik kedaluwarsa."

---

### `02:25 – 02:50` | Berita Acara Resmi BAHV & Jejak Audit SHA-256 *(25 detik)*
> *[Layar: Klik "Laporan & Jejak Audit" → Pratinjau BAHV Kolektif + QR SHA-256 → Klik sub-tab "Jejak Audit SHA-256"]*
>
> "Seluruh hasil verifikasi bermuara pada modul **Laporan & Jejak Audit**. Verifikator dapat memilih Faskes dan Batch FPK melalui pencarian cepat, lalu langsung mencetak **Berita Acara Hasil Verifikasi Kolektif** lengkap dengan **segel QR SHA-256** resmi.
>
> Setiap keputusan juga terkunci permanen pada **Jejak Audit Kriptografis SHA-256** sehingga tidak dapat dimanipulasi dan siap diperiksa kapan saja oleh auditor internal maupun BPK."

---

### `02:50 – 03:00` | Penutup *(10 detik)*
> *[Layar: Kembali ke "Dashboard Ringkasan" tampilan penuh]*
>
> "Dengan **ClaimTrace**, BPJS Kesehatan beralih dari pemeriksaan manual yang lambat menuju pengawasan pra-pembayaran yang cepat, transparan, akuntabel, dan siap diterapkan secara nasional. Terima kasih."

---

## Ringkasan Checkpoint Waktu (Untuk Pegangan Cepat Saat Presentasi)

| Waktu Video | Tampilan di Layar | Kata Kunci Pengingat |
| :--- | :--- | :--- |
| **`00:00`** | Halaman Masuk → Login Demo | Perkenalan ClaimTrace & masuk portal |
| **`00:12`** | Dashboard Ringkasan | 1,699 jt klaim · Rp 1,536 T · 2.091 RS · SLA 99,9% |
| **`00:32`** | Antrean & Berkas Klaim | Tabel paginasi + Searchable Combobox `"Mitra"` |
| **`00:55`** | Telaah 4-Lapis → Cek 7 Dokumen | Matriks 4 lapis, SIP kedaluwarsa, NLP, Uji Rule MB1–MB5 |
| **`01:28`** | Konsol Putusan → Panel Mobile JKN | Human-in-the-Loop Tier 1/2 + Sangkalan Peserta Mobile JKN |
| **`01:55`** | Faskes → Peringkat RS → DPJP | Pengawasan FKRTL, Ranking Risiko, Intelijen DPJP & SIP |
| **`02:25`** | BAHV Kolektif → Jejak Audit SHA-256 | Cetak BAHV + QR SHA-256 + Ledger kriptografis anti-ubah |
| **`02:50`** | Kembali ke Dashboard Ringkasan | Penutup dampak strategis & kesiapan skala nasional |
| **`03:00`** | **Selesai Tepat 03:00** | *"Terima kasih."* |
