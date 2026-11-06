# PANDUAN & NASKAH RESMI VIDEO DEMO 3 MENIT (YOUTUBE)
## HEALTHKATHON BPJS KESEHATAN 2026 - TAHAP FINAL

**Proyek:** CLAIMTRACE — Sistem Pendukung Keputusan Verifikator Klaim JKN Berbasis Triase Multi-Sinyal Independen  
**Tim:** TINEERENSE (MAN 1 Surakarta)  
**Ketua Tim:** Khalaf Faith Pradyatama  
**Anggota Tim:** Gaudiansyah Abiyu Mahya  
**Target Durasi:** Tepat 03:00 Menit (180 Detik)  
**Resolusi:** 1080p (1920x1080), 60 fps  
**Visibilitas YouTube:** Unlisted (Tidak Publik)  
**Tautan Localhost:** `http://localhost:3000` (Backend API: `http://localhost:8000`)  

---

## RINGKASAN RUNDOWN & DISTRIBUSI WAKTU

| Waktu | Segmen | Tampilan Layar | Narator | Poin Utama |
| :--- | :--- | :--- | :--- | :--- |
| **00:00 - 00:25** | 1. Urgensi & Masalah | Slide 1 (Cover) & Slide 4 | Khalaf Faith | Kasus KPK Phantom Billing Rp 34M & Keterbatasan Verifikasi Sepihak |
| **00:25 - 00:55** | 2. Solusi: Quad-Triangulation | Slide 5 (Arsitektur 4 Sinyal) | Gaudiansyah | 4 Sinyal Independen (Klinis, SATUSEHAT, Mobile JKN, FRISTA) |
| **00:55 - 01:30** | 3. Live Demo: Triage & Radar | Browser: `localhost:3000` | Khalaf Faith | Triase 4.341 klaim, 85 klaim Merah Rp 72,45 Juta ditahan pra-bayar |
| **01:30 - 02:05** | 4. Live Demo: Dual Cockpit & Mobile JKN | Browser: Dual Screen Split | Gaudiansyah | Konfirmasi Zero-PHI peserta & perubahan skor risiko seketika |
| **02:05 - 02:35** | 5. Live Demo: Berita Acara QR & SLA Engine | Browser: Decision Console & PDF | Khalaf Faith | BAKB berstempel SHA-256 & Kepatuhan 10 Hari Kerja Perpres 82/2018 |
| **02:35 - 03:00** | 6. Validasi, Kesiapan & Closing | Slide 9 & Slide 10 | Khalaf & Gaudi | Precision 100%, 113 Tests Passed, Kesiapan Plug-in VClaim BPJS |

---

## NASKAH BICARA KATA-PER-KATA (SCRIPT DENGAN CUE VISUAL)

### [00:00 - 00:25] SEGMEN 1: LATAR BELAKANG & MASALAH NASIONAL
**Tampilan Layar:** Kamera Presenter On di pojok kanan atas, transisi dari Slide Cover ke Slide Latar Belakang & Dampak.

*(Khalaf Faith Pradyatama - Nada Tegas, Meyakinkan, Profesional)*:
"Halo Dewan Juri dan Mentor Healthkathon BPJS Kesehatan 2026. Saya Khalaf Faith Pradyatama, bersama rekan saya Gaudiansyah Abiyu Mahya dari Tim TINEERENSE MAN 1 Surakarta.

Setiap hari, BPJS Kesehatan melayani lebih dari 1,9 juta transaksi pelayanan di ribuan faskes se-Indonesia. Namun, audit KPK dan Kemenkes baru-baru ini mengungkap kebocoran klaim fiktif hingga puluhan miliar rupiah pada rumah sakit khusus dengan modus manipulasi berkas baksos dan penagihan fisioterapi berulang.

Verifikator di lapangan menghadapi batas ketat 10 hari kerja sesuai Perpres No. 82 Tahun 2018, sementara berkas klaim yang masuk hanya bersumber dari internal faskes penagih. Jika terjadi pemalsuan berkas secara terorganisir, dokumen akan tampak lengkap secara administratif, namun fiktif secara substantif."

---

### [00:25 - 00:55] SEGMEN 2: SOLUSI INOVASI — CLAIMTRACE QUAD-TRIANGULATION
**Tampilan Layar:** Slide 5 (Arsitektur Quad-Triangulation).

*(Gaudiansyah Abiyu Mahya - Nada Cepat, Terstruktur, Percaya Diri)*:
"Untuk memecahkan masalah ini tanpa menghambat faskes yang patuh, kami mempersembahkan **ClaimTrace**: Sistem Pendukung Keputusan Verifikator Klaim JKN berbasis Triase Multi-Sinyal Independen.

ClaimTrace bekerja di gerbang pra-bayar melalui 4 sinyal independen:
Pertama, **Analitik Klinis & Upcoding**, mendeteksi anomali rasio prosedur dan inflasi keparahan INA-CBG dengan filter pengecualian obat kronis PRB.
Kedua, **SATUSEHAT SDMK & OSRM Geovelocity**, memverifikasi keaktifan SIP dokter dan mendeteksi dokter tercatat melayani di dua kota pada jam yang sama.
Ketiga, **Telemetri Mobile JKN Out-of-Band**, konfirmasi kehadiran langsung ke gawai peserta dengan prinsip Zero-PHI patuh UU PDP.
Keempat, **Biometrik Terminal FRISTA**, validasi presensi fisik wajah peserta di faskes."

---

### [00:55 - 01:30] SEGMEN 3: LIVE DEMO COCKPIT — TRIASE 4.341 KLAIM NASIONAL
**Tampilan Layar:** Pindah ke browser live `http://localhost:3000`. Verifikator login (`verifikator.bpjs@jkn.go.id`). Menampilkan Command Center & Triage Overview.

*(Khalaf Faith Pradyatama - Cursor menunjuk ringkasan triase dan tabel klaim)*:
"Mari kita saksikan sistem yang telah beroperasi 100% ini.
Di Command Center Verifikator, ClaimTrace memindai 4.341 berkas klaim nasional.
Sistem secara otomatis mengklasifikasikan 3.892 klaim bersih ke Jalur Hijau untuk pembayaran cepat tanpa friksi.

Namun, radar mendeteksi 85 berkas prioritas di Jalur Merah dengan potensi kebocoran Rp 72.450.000,-, salah satunya klaster baksos fisioterapi di RS Khusus Mitra Husada.
Saat kita klik berkas klaim terkait, sistem langsung menyajikan Berkas Telaah Siap-Audit yang mengungkap lonjakan klaim 8,5 kali lipat baseline dan SIP dokter penanggung jawab yang tercatat non-aktif di SATUSEHAT Kemenkes."

---

### [01:30 - 02:05] SEGMEN 4: LIVE DEMO — DUAL COCKPIT & KONFIRMASI MOBILE JKN
**Tampilan Layar:** Split Screen: Kiri Cockpit Verifikator, Kanan Simulator Mobile JKN Peserta.

*(Gaudiansyah Abiyu Mahya - Menunjukkan interaksi split screen real-time)*:
"Keunggulan utama ClaimTrace adalah **Dual Cockpit Interaktif**.
Verifikator dapat memicu konfirmasi kehadiran terarah langsung ke ponsel peserta terdaftar melalui Mobile JKN.
Perhatikan layar kanan: Peserta menerima notifikasi verifikasi sederhana tanpa rincian medis sensitif, 'Apakah Anda menerima terapi fisioterapi pada tanggal tersebut?'.

Ketika peserta memilih [Tidak Pernah], sinyal dikirimkan kembali secara instan melalui enkripsi aman, dan skor risiko di layar verifikator seketika melonjak ke 92 dengan status terindikasi kuat Phantom Billing. Keraguan verifikator terjawab dengan bukti empiris langsung dari pasien."

---

### [02:05 - 02:35] SEGMEN 5: LIVE DEMO — BERITA ACARA QR SHA-256 & SLA ENGINE
**Tampilan Layar:** Masuk ke Decision Console. Verifikator mengeksekusi [HOLD_BAKB]. Muncul modal Berita Acara Klarifikasi Bersama dengan QR Code resmi.

*(Khalaf Faith Pradyatama - Cursor menyorot stempel QR SHA-256 dan indikator SLA)*:
"Verifikator kemudian mengeksekusi penahanan klaim pra-bayar.
ClaimTrace otomatis menerbitkan **Berita Acara Klarifikasi Bersama (BAKB)** berstempel QR Code yang mengunci tanda tangan digital verifikator dan ringkasan anomali dalam hash kriptografis SHA-256 persisten. Dokumen ini sah dan anti-sengketa.

Yang paling krusial, modul **Statutory Business Days Engine** kami secara cerdas menghitung batas SLA 10 hari kerja murni sesuai Perpres 82/2018 Pasal 74, dengan mengecualikan akhir pekan dan 16 hari libur nasional resmi, melindungi BPJS Kesehatan dari denda keterlambatan 1%."

---

### [02:35 - 03:00] SEGMEN 6: HASIL UJI, KESIAPAN IMPLEMENTASI & PENUTUP
**Tampilan Layar:** Kembali ke Slide 9 (Hasil Uji Validasi) dan Slide 10 (Penutup).

*(Khalaf Faith & Gaudiansyah bergantian - Nada Semangat, Kuat, Menutup)*:
*(Gaudiansyah)*:
"Dalam pengujian holdout dataset, ClaimTrace membuktikan **Precision@100 sebesar 100%**, False Positive Rate ke Jalur Merah 0,00%, dan lulus 113 dari 113 automated unit tests."

*(Khalaf Faith)*:
"ClaimTrace siap diintegrasikan sebagai middleware non-disruptif melalui standar HL7 FHIR R4 di sistem VClaim BPJS Kesehatan.

Mari bersama Tim TINEERENSE wujudkan perlindungan cerdas demi Dana Jaminan Sosial yang adil, transparan, dan berkelanjutan.
*Detect Smarter, Protect JKN — Smarter Protection for a Stronger JKN.*
Terima kasih!"

---
*Naskah ini telah diselaraskan dengan ketentuan panitia Healthkathon BPJS Kesehatan 2026.*
