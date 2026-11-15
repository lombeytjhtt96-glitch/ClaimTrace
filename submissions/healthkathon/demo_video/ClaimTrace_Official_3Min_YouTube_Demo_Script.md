# ARSIP SKRIP VIDEO PITCH SINGKAT (3 MENIT — VERSI PRA-COACHING)
## HEALTHKATHON BPJS KESEHATAN 2026

> **Catatan Pembaruan (15 November 2026):** Panduan rekaman video **Final 20 Besar** terbaru (`<= 10 menit`, 6 bagian wajib, mengacu pada dek Canva 8 slide `submissions/healthkathon/deck/TINEERENSE.pdf`) tersedia di [`PANDUAN_RECORDING_VIDEO_DEMO.md`](./PANDUAN_RECORDING_VIDEO_DEMO.md). Dokumen ringkas 3 menit di bawah telah diselaraskan kredensial dan metrik terkininya untuk keperluan presentasi kilat (*elevator pitch*).

**Proyek:** CLAIMTRACE — Sistem Pendukung Keputusan Verifikator Klaim JKN Berbasis Triase Multi-Sinyal Independen  
**Tim:** TINEERENSE (MAN 1 Surakarta)  
**Ketua Tim:** Khalaf Faith Pradyatama  
**Anggota Tim:** Gaudiansyah Abiyu Mahya  
**Target Durasi:** 03:00 Menit (Elevator Pitch) | Rekaman Utama 20 Besar: `<= 10:00` Menit  
**Resolusi:** 1080p (1920x1080), 60 fps  
**Visibilitas YouTube:** Unlisted (Tidak Publik)  
**Tautan Localhost:** `http://localhost:3000` (Backend API: `http://localhost:8000`)  

---

## RINGKASAN RUNDOWN & DISTRIBUSI WAKTU

| Waktu | Segmen | Tampilan Layar | Narator | Poin Utama |
| :--- | :--- | :--- | :--- | :--- |
| **00:00 - 00:25** | 1. Urgensi & Masalah | `TINEERENSE.pdf` Slide 1-2 | Khalaf Faith | Kasus KPK Phantom Billing Rp 34M & Audit 1.699.219 Klaim FKRTL |
| **00:25 - 00:55** | 2. Solusi: Sidecar & Coaching | `TINEERENSE.pdf` Slide 3-4 | Gaudiansyah | Sidecar BEA C03.04, 4-Lapis + FairGuard Z49.1, On-Premise `< 15 ms` |
| **00:55 - 01:30** | 3. Live Demo: Auth & Triage | Browser: `localhost:3000` | Khalaf Faith | Auth Fail-Closed + reCAPTCHA, Triase 1,699 Jt Klaim & FairGuard Z49.1 |
| **01:30 - 02:05** | 4. Live Demo: 4-Lapis & Dokumen | Browser: Telaah & Cek Dokumen | Gaudiansyah | SDMK SATUSEHAT, Mobile JKN Zero-PHI, Cek Dokumen RS & FRISTA |
| **02:05 - 02:35** | 5. Live Demo: Putusan & BAHV QR | Browser: Putusan & BAHV | Khalaf Faith | Putusan 2-Tier, BAHV QR SHA-256 & Kepatuhan SLA 10 Hari Kerja |
| **02:35 - 03:00** | 6. HKEval, TCO & Closing | `TINEERENSE.pdf` Slide 6-8 | Khalaf & Gaudi | Precision@50 86,0%, Rupiah@100 96,8%, 300+112 Tests Passed |

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

### [00:55 - 01:30] SEGMEN 3: LIVE DEMO COCKPIT — TRIASE 1,699 JUTA KLAIM FKRTL
**Tampilan Layar:** Pindah ke browser live `http://localhost:3000`. Verifikator login (`NIP: 198704202011012001` / `siti.rahma@bpjs-kesehatan.go.id` / `Password123!`). Menampilkan Dashboard Ringkasan & Antrean Klaim.

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
**Tampilan Layar:** Kembali ke `TINEERENSE.pdf` Slide 6 (Dampak & Bukti) hingga Slide 8 (Penutup).

*(Khalaf Faith & Gaudiansyah bergantian - Nada Semangat, Kuat, Menutup)*:
*(Gaudiansyah)*:
"Pada benchmark HKEval terukur (`n=3.002` klaim, 5/5 REFORMS lolos), ClaimTrace mencatat **Precision@50 86,0%** (43x lift), **Rupiah Recall@100 96,8%**, False Positive Rate Hard-Negative **0,00%** across 512 kasus, serta lulus **300 uji backend + 112 uji E2E (412 tes hijau)**."

*(Khalaf Faith)*:
"ClaimTrace siap diintegrasikan sebagai middleware non-disruptif melalui standar HL7 FHIR R4 di sistem VClaim BPJS Kesehatan.

Mari bersama Tim TINEERENSE wujudkan perlindungan cerdas demi Dana Jaminan Sosial yang adil, transparan, dan berkelanjutan.
*Detect Smarter, Protect JKN — Smarter Protection for a Stronger JKN.*
Terima kasih!"

---
*Naskah ini telah diselaraskan dengan ketentuan panitia Healthkathon BPJS Kesehatan 2026.*
