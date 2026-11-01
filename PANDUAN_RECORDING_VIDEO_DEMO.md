# PANDUAN REKAMAN VIDEO DEMO & PITCH SCRIPT HEALTHKATHON 2026
## Proyek: ClaimTrace - Decision Support System Deteksi Anomali Klaim FKRTL Berbasis AI
**Tim:** TINEERENSE - MAN 1 Surakarta  
**Ketua Tim:** Khalaf Faith Pradyatama (Lead Systems Architect & AppSec Engineer)  
**Anggota Tim:** Gaudiansyah Abiyu Mahya (AI/ML Engineer & Healthcare Data Analyst)  
**Kategori:** Efisiensi Risiko pada Fasilitas Kesehatan (FKRTL)  
**Sub-Kategori:** #6: Phantom Billing (Klaim Fiktif Fisioterapi/Baksos) & #11: Repeat Billing (Penagihan Klaim Berulang)  
**Target Durasi Video:** 08:30 – 09:30 Menit (Maksimal 10 Menit Sesuai Ketentuan Panitia)  
**Media Rekaman:** Zoom Meeting (Kamera On, Screen Share 1080p)

---

## 1. PANDUAN PERSIAPAN TEKNIS SEBELUM REKAMAN (CHECKLIST)

1. **Aplikasi Zoom:**
   - Gunakan fitur Zoom Meeting Recording (pilih "Record on this Computer" untuk kualitas audio/video lokal tanpa kompresi jaringan).
   - Pastikan layout "Side-by-side: Speaker" aktif agar wajah kedua presenter (Khalaf dan Gaudiansyah) tetap terlihat di pojok kanan atas saat screen share berlangsung.
2. **Kesiapan Browser & Tab:**
   - Buka Google Chrome dengan tab berikut yang sudah siap:
     - Tab 1: Slide Presentasi (`ClaimTrace_Healthkathon_2026_Final.pdf` atau PowerPoint presentation mode).
     - Tab 2: Live Prototype Web App: `https://claimtrace-healthkathon.vercel.app/`
     - Tab 3: Repositori GitHub: `https://github.com/lombeytjhtt96-glitch/ClaimTrace`
   - Pastikan resolusi layar berada pada 1920x1080 (1080p) dan zoom browser pada 100% atau 90% agar seluruh elemen dashboard tampak proporsional.
3. **Pengaturan Suara & Pencahayaan:**
   - Gunakan mikrofon headset atau condenser mic yang jernih.
   - Ruangan kondusif tanpa backsound bising.
4. **Pengaturan YouTube Pasca-Rekam:**
   - Format: MP4 1080p.
   - Visibilitas: **Unlisted** (Tidak Publik - siapapun yang memiliki tautan dapat menonton, juri dapat langsung menilai).
   - Judul Video YouTube: `BPJS Kesehatan Healthkathon 2026 - Finalist Demo ClaimTrace - Tim TINEERENSE MAN 1 Surakarta`.

---

## 2. STRUKTUR RUNDOWN & DISTRIBUSI WAKTU VIDEO (TOTAL ~9 MENIT)

| Segmen Waktu | Bagian Wajib Panitia | Tampilan Layar | Pembicara Utama |
| :--- | :--- | :--- | :--- |
| **00:00 – 00:45** | 1. Cover & Perkenalan Tim | Slide 1 & Slide 2 (Kamera Aktif) | Khalaf Faith & Gaudiansyah |
| **00:45 – 02:00** | 2. Judul, Masalah & Dampak | Slide 3 & Slide 4 | Gaudiansyah Abiyu Mahya |
| **02:00 – 03:15** | 3. Alur Proses & Arsitektur | Slide 5 & Slide 7 | Khalaf Faith Pradyatama |
| **03:15 – 06:45** | 4. Demo Aplikasi Live Berjalan | Browser Live: Vercel App | Khalaf Faith & Gaudiansyah |
| **06:45 – 08:00** | 5. Keamanan, UU PDP & Validasi | Slide 8 & Slide 9 | Gaudiansyah & Khalaf |
| **08:00 – 08:45** | 6. Roadmap, Bisnis & Penutup | Slide 10 | Khalaf Faith Pradyatama |

---

## 3. PITCH SCRIPT KATA-PER-KATA (TRANSKRIP BICARA DENGAN CUE SCREEN SHARE)

### SEGMEN 1: OPENING & PERKENALAN TIM (00:00 - 00:45)
**Tampilan Layar:** Slide 1 (Cover) lalu transisi ke Slide 2 (Perkenalan Tim).  
**Kamera:** On (Kedua presenter tersenyum percaya diri dan profesional).

**Khalaf Faith Pradyatama:**  
> "Assalamu’alaikum Warahmatullahi Wabarakatuh, salam sejahtera bagi kita semua, Syalom, Oom Swastiastu, Namo Buddhaya, Salam Kebajikan.  
> Yang terhormat Dewan Juri BPJS Kesehatan Healthkathon 2026 dan seluruh panitia penyelenggara.  
> Kami dari Tim **TINEERENSE**, perwakilan siswa Madrasah Aliyah Negeri 1 Surakarta, dengan bangga mempersembahkan solusi inovasi kami: **ClaimTrace** — Decision Support System pra-bayar berbasis Artificial Intelligence untuk efisiensi risiko fasilitas kesehatan rujukan tingkat lanjutan (FKRTL)."

*(Ganti slide ke Slide 2: Perkenalan Tim)*

**Khalaf Faith Pradyatama:**  
> "Perkenalkan, saya **Khalaf Faith Pradyatama**, siswa kelas XII MIPA MAN 1 Surakarta selaku Ketua Tim sekaligus Lead Systems Architect dan AppSec Engineer. Saya bertanggung jawab atas arsitektur backend Python FastAPI, integrasi telemetri reaktif Mobile JKN, standar keamanan siber, serta implementasi audit ledger kriptografis SHA-256."

**Gaudiansyah Abiyu Mahya:**  
> "Dan saya **Gaudiansyah Abiyu Mahya**, siswa kelas XII MIPA MAN 1 Surakarta selaku AI/ML Engineer dan Healthcare Data Analyst. Saya bertanggung jawab atas pemodelan deteksi anomali berbasis Isolation Forest dan semantic embeddings, penelaahan regulasi penjaminan JKN, perancangan antarmuka Verificator Cockpit, serta kalibrasi matematis ambang batas risiko 3 lapis bukti."

---

### SEGMEN 2: JUDUL IDE, URGENSI MASALAH, & DAMPAK (00:45 - 02:00)
**Tampilan Layar:** Slide 3 (Judul Ide, Deskripsi, Tujuan) lalu Slide 4 (Latar Belakang & Dampak).

*(Ganti slide ke Slide 3)*

**Gaudiansyah Abiyu Mahya:**  
> "Inovasi **ClaimTrace** dirancang dengan satu kalimat nilai utama: *Membantu verifikator BPJS Kesehatan agar mempermudah dalam mendeteksi anomali klaim faskes secara otomatis berbasis Artificial Intelligence*.  
> Solusi ini kami dedikasikan secara spesifik pada Kategori Efisiensi Risiko FKRTL, dengan fokus penanganan Sub-kategori #6: Phantom Billing atau klaim fiktif pada layanan fisioterapi dan bakti sosial, serta Sub-kategori #11: Repeat Billing atau penagihan klaim berulang."

*(Ganti slide ke Slide 4: Latar Belakang & Dampak)*

**Gaudiansyah Abiyu Mahya:**  
> "Bapak dan Ibu Dewan Juri, mengapa inovasi ini sangat penting dan mendesak?  
> Berdasarkan paparan BPJS Kesehatan tahun 2025, Program JKN melayani lebih dari 1,9 juta pemanfaatan layanan kesehatan setiap harinya di ribuan faskes mitra se-Indonesia.  
> Di tengah volume yang sedemikian masif, temuan bersama KPK dan Kementerian Kesehatan pada Juli 2024 mengungkap adanya dugaan klaim fiktif hingga mencapai kurang lebih Rp34 Miliar pada 3 rumah sakit khusus, dengan modus manipulasi berkas baksos dan klaim fisioterapi berulang.  
> Verifikator BPJS berada di garis terdepan dengan batas waktu SLA yang sangat ketat: hanya 10 hari kerja sesuai amanat Perpres No. 82 Tahun 2018. Menelaah puluhan ribu berkas PDF manual satu demi satu membuka celah lolosnya klaim anomali.  
> Melalui ClaimTrace, kami menghadirkan dampak nyata terukur:  
> Pertama, memangkas durasi telaah berkas anomali dari 15-25 menit menjadi di bawah 4,2 menit per kasus, atau efisiensi waktu sebesar 72%.  
> Kedua, potensi pencegahan kebocoran dana amanat umat JKN hingga Rp34,2 Miliar per tahun di level regional.  
> Dan ketiga, menekan False Positive Rate ke Jalur Merah hingga 0,00%, sehingga faskes yang patuh tidak akan pernah dirugikan."

---

### SEGMEN 3: ALUR PROSES & FITUR UNGGULAN (02:00 - 03:15)
**Tampilan Layar:** Slide 5 (Alur Proses Aplikasi) lalu Slide 7 (Penjelasan Fitur).

*(Ganti slide ke Slide 5)*

**Khalaf Faith Pradyatama:**  
> "Bagaimana cara kerja ClaimTrace? Sistem bekerja secara preventif pada tahap pra-bayar melalui 5 tahapan utama:  
> 1. Input: Data klaim FKRTL masuk secara otomatis melalui standard API VClaim.  
> 2. Proses: Sistem melakukan triangulasi lintas data — mengekstraksi parameter spatiotemporal, memvalidasi nomor SIP dokter ke registri SATUSEHAT SDMK Kemenkes, dan menyinkronkan status konfirmasi pasien di Mobile JKN.  
> 3. Analisis AI: Model Isolation Forest dan ChromaDB cosine semantic embeddings bekerja secara real-time mendeteksi lonjakan klaim serentak, pola copy-paste resume medis, serta repeat billing.  
> 4. Output: Triase cerdas 3 jalur (Hijau untuk lolos otomatis, Kuning untuk klarifikasi data, dan Merah untuk investigasi mendalam).  
> 5. Tindak Lanjut: Rekomendasi verifikator terkunci otomatis pada ledger kriptografi SHA-256 yang berkekuatan hukum."

*(Ganti slide ke Slide 7: Penjelasan Fitur Unggulan)*

**Khalaf Faith Pradyatama:**  
> "ClaimTrace mengintegrasikan 4 pilar fitur inti:  
> Pertama, Automated AI Anomaly Detection dengan Explainable AI (XAI) feature attribution.  
> Kedua, Matriks Bukti 3 Lapis yang menghilangkan ketergantungan pada berkas sepihak faskes.  
> Ketiga, Dual Cockpit yang menggabungkan antarmuka verifikator BPJS dengan Simulator Mobile JKN secara real-time.  
> Dan keempat, Ledger Kriptografis SHA-256 anti-tamper untuk memastikan integritas bukti telaah klaim."

---

### SEGMEN 4: LIVE DEMO APLIKASI BERJALAN (DURASI: ±2 MENIT 15 DETIK — AMAN DI BAWAH 3 MENIT)
**Tampilan Layar:** Beralih dari Slide 5 ke layar aplikasi ClaimTrace yang sedang berjalan: `https://claimtrace-healthkathon.vercel.app/`

**Transisi di Slide 5 (±10 Detik) — Amay (Gaudiansyah Abiyu Mahya):**  
> "Sekarang, mari kita buktikan cara kerja ClaimTrace secara langsung melalui empat skenario pengujian pada prototype interaktif kami!"  
*(Langsung beralih ke layar aplikasi ClaimTrace yang sedang berjalan)*

---

**Langkah 1: Triage Antrean & Deteksi Klaster (±30 Detik) — Amay (Gaudiansyah Abiyu Mahya):**  
*(Aksi di layar: Tampilkan halaman utama Dashboard Verifikator, arahkan kursor ke barisan Triage Hijau/Kuning/Merah, lalu sorot baris RS Mitra Husada)*

> "Saat verifikator membuka dashboard utama ClaimTrace, sistem langsung melakukan triage otomatis terhadap ribuan berkas klaim yang masuk ke dalam Jalur Hijau, Kuning, dan Merah. Klaim wajar di Jalur Hijau dapat langsung diproses fast-track. Namun perhatikan di bagian atas antrean prioritas: sistem mendeteksi klaster mencolok pada RS Mitra Husada, di mana terdapat 85 klaim fisioterapi pasca-baksos yang otomatis masuk ke Jalur Merah dengan Skor Risiko 87."

---

**Langkah 2: Inspeksi Matriks Bukti Lapis 1 & 2 (±35 Detik) — Amay (Gaudiansyah Abiyu Mahya):**  
*(Aksi di layar: Klik klaster RS Mitra Husada hingga panel Matriks Bukti 3 Lapis terbuka. Tunjukkan grafik lonjakan klaim Lapis 1 dan status merah SIP dokter pada Lapis 2)*

> "Ketika kita klik klaster tersebut untuk menginspeksi Matriks Bukti 3 Lapis:  
> 
> Pada Lapis 1 (Radar Pola & Episode Fingerprint), terlihat lonjakan volume klaim mencapai 8,5 kali lipat dari baseline normal faskes, disertai kemiripan pola tindakan berulang.  
> 
> Lebih krusial lagi pada Lapis 2 (Uji Jejak SATUSEHAT SDMK), rekonsiliasi otomatis dengan database Kemenkes mengungkap bahwa Surat Izin Praktik (SIP) dokter DPJP terkait ternyata sudah berakhir pada tanggal pelayanan, sehingga memicu Hard Trigger risiko merah!"

---

**Langkah 3: Simulasi Live Mobile JKN Lapis 3 (±30 Detik) — Khalaf Faith Pradyatama:**  
*(Aksi di layar: Buka panel Simulator Mobile JKN di samping/layar terpisah, klik kirim notifikasi, lalu tekan tombol [Tidak Pernah] pada tampilan HP peserta)*

> "Selanjutnya, untuk membuktikan apakah pasien benar-benar hadir pada Lapis 3, kita jalankan Simulasi Live Mobile JKN. Sistem mengirimkan notifikasi verifikasi satu-klik ke ponsel peserta dengan prinsip minimasi privasi—tanpa menampilkan rincian diagnosa sensitif. Ketika peserta menekan tombol [Tidak Pernah] karena merasa hanya ikut acara baksos pemeriksaan biasa dan tidak pernah menjalani terapi fisioterapi di RS tersebut, perhatikan bagaimana skor dan indikator di cockpit verifikator seketika bereaksi secara real-time mengonfirmasi adanya Phantom Billing!"

---

**Langkah 4: Eksekusi Keputusan & Cetak Audit SHA-256 (±30 Detik) — Khalaf Faith Pradyatama:**  
*(Aksi di layar: Klik tombol [Tunda Berita Acara & Minta Klarifikasi], lalu tampilkan modal/dokumen Berkas Telaah Siap-Audit beserta kode hash SHA-256 di bagian bawahnya)*

> "Berbekal bukti tiga lapis yang objektif dan bebas debat ini, verifikator dengan prinsip Human-in-the-Loop cukup mengeksekusi tombol [Tunda Berita Acara & Minta Klarifikasi] sebelum batas regulasi 10 hari kerja. Seketika itu juga, ClaimTrace menerbitkan Berkas Telaah Siap-Audit yang merangkum seluruh temuan anomali dan menguncinya dengan stempel kriptografis hash SHA-256 sehingga sah, transparan, dan tidak dapat dimanipulasi!"

---

### SEGMEN 5: KEAMANAN, KEPATUHAN UU PDP, & HASIL UJI VALIDASI (06:45 - 08:00)
**Tampilan Layar:** Kembali ke presentasi: Slide 8 (Arsitektur Teknis & Kepatuhan) lalu Slide 9 (Hasil Uji Validasi & Roadmap).

*(Ganti slide ke Slide 8)*

**Khalaf Faith Pradyatama:**  
> "Dalam aspek keamanan dan tata kelola teknologi, ClaimTrace dibangun dengan kepatuhan penuh terhadap **Undang-Undang Perlindungan Data Pribadi No. 27 Tahun 2022**:  
> • Seluruh NIK dan identitas peserta dipseudonimisasi menggunakan salted-hashing.  
> • Seluruh data at-rest dienkripsi dengan standar militer AES-256-GCM dan komunikasi data dilindungi TLS 1.3.  
> • Dan yang paling fundamental: kami menjunjung etika **Human-in-the-Loop**. Sistem AI hanya bertindak sebagai Decision Support System yang merekomendasikan bukti dan probabilitas, sedangkan vonis akhir klaim 100% tetap berada di tangan verifikator manusia."

*(Ganti slide ke Slide 9: Hasil Uji Validasi & Kesiapan Implementasi)*

**Gaudiansyah Abiyu Mahya:**  
> "Kesiapan produk kami telah diuji secara komprehensif melalui holdout validation dataset berukuran 3.002 transaksi klaim:  
> • Precision@100 mencapai 100%: 100 kasus teratas prioritas telaah seluruhnya terbukti valid anomali.  
> • False Positive Rate ke Jalur Merah adalah 0,00%: tidak ada faskes patuh yang salah dituduh.  
> • Recall Antrean adalah 100%: seluruh klaim bermasalah berhasil ditapis masuk antrean verifikasi.  
> • Dari sisi engineering, seluruh 106 unit test dan integration test otomatis telah lolos 100% hijau."

---

### SEGMEN 6: MODEL BISNIS, KEBERLANJUTAN, & PENUTUP (08:00 - 08:45)
**Tampilan Layar:** Slide 10 (Penutup, Link & Kontak).

*(Ganti slide ke Slide 10)*

**Khalaf Faith Pradyatama:**  
> "Dari perspektif model bisnis dan keberlanjutan, ClaimTrace dirancang sebagai **Non-Disruptive Middleware Add-on** yang sangat mudah diadopsi oleh BPJS Kesehatan tanpa perlu mengubah sistem core yang ada.  
> Kami merencanakan roadmap 4 fase yang realistis: diawali asistensi teknis di bulan ke-1, piloting terbatas di kantor cabang percontohan pada bulan ke-3, hingga ekspansi ke seluruh 14 tipologi kecurangan JKN.  
> Dengan biaya komputasi cloud serverless yang sangat hemat, yakni kurang dari Rp120 per berkas klaim, potensi Return on Investment (ROI) mencapai ratusan kali lipat melalui penyelamatan potensi kebocoran dana puluhan miliar rupiah.  
> 
> Seluruh kode sumber, dokumentasi PRD, arsitektur teknis, dan suite pengujian dapat diakses secara transparan pada repositori GitHub kami di `github.com/lombeytjhtt96-glitch/ClaimTrace`, serta prototipe live di `claimtrace-healthkathon.vercel.app`.  
> 
> Mari bersama-sama kita wujudkan tata kelola jaminan kesehatan nasional yang lebih tangguh, berintegritas, dan akuntabel.  
> *Detect Smarter, Protect JKN — Smarter Protection for a Stronger JKN!*  
> Terima kasih, Wassalamu’alaikum Warahmatullahi Wabarakatuh."

---

## 4. CHECKLIST FINAL SUBMISI SEBELUM TENGGAT WAKTU

- [x] Slide Presentasi Resmi (`ClaimTrace_Healthkathon_2026_Final.pptx` & `ClaimTrace_Healthkathon_2026_Final.pdf`)
- [x] URL Live Web App terverifikasi aktif di Vercel: `https://claimtrace-healthkathon.vercel.app/`
- [x] Repositori GitHub publik & up-to-date: `https://github.com/lombeytjhtt96-glitch/ClaimTrace`
- [x] Seluruh 106 test automated passed (100%)
- [x] Video berdurasi di bawah 10 menit direkam via Zoom Meeting
- [x] Video diunggah ke YouTube dengan status "Unlisted"
- [x] Tautan video dan berkas di-submit pada portal Healthkathon BPJS Kesehatan
