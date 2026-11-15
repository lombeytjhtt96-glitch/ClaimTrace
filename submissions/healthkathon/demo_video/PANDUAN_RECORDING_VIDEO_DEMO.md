# PANDUAN REKAMAN VIDEO DEMO & PITCH SCRIPT FINAL 20 BESAR HEALTHKATHON 2026
## Proyek: ClaimTrace - Decision Support System Pra-Adjudikasi FKRTL On-Premise
**Tim:** TINEERENSE - MAN 1 Surakarta  
**Ketua Tim:** Khalaf Faith Pradyatama (Lead Systems Architect & AppSec Engineer)  
**Anggota Tim:** Gaudiansyah Abiyu Mahya (AI/ML Engineer & Healthcare Data Analyst)  
**Kategori:** Efisiensi Risiko pada Fasilitas Kesehatan (FKRTL)  
**Sub-Kategori:** #6 Phantom Billing & #11 Repeat Billing  
**Deck Presentasi Acuan:** `submissions/healthkathon/deck/TINEERENSE.pdf` (8 Slide Canva Final)  
**Target Durasi Video:** 08:30 - 09:30 Menit (Maksimal 10 Menit Sesuai Panduan 20 Besar HealthKathon 2026)  
**Media Rekaman:** Zoom Meeting (Kamera On, Screen Share 1080p)

---

## 1. PANDUAN PERSIAPAN TEKNIS SEBELUM REKAMAN (CHECKLIST)

1. **Aplikasi Zoom:**
   - Gunakan fitur Zoom Meeting Recording ("Record on this Computer" untuk kualitas audio/video lokal 1080p tanpa jitter jaringan).
   - Aktifkan layout "Side-by-side: Speaker" agar wajah kedua presenter terlihat jelas di pojok layar saat screen share berlangsung.
2. **Kesiapan Browser & Tab:**
   - Tab 1: Slide Presentasi Final (`submissions/healthkathon/deck/TINEERENSE.pdf` -- 8 Slide Canva Final, mode layar penuh).
   - Tab 2: Live Prototype Web App (`http://localhost:3000` atau URL deployment aktif) -- pastikan mode terang default (`#F7F8FA`) aktif dan akun verifikator siap:
     - Username: `siti.rahma` | NIP: `198704202011012001` | Email: `siti.rahma@bpjs-kesehatan.go.id` | Sandi: `Password123!` | PIN MFA: `123456`
   - Tab 3: Repositori GitHub (`https://github.com/lombeytjhtt96-glitch/ClaimTrace`).
   - Resolusi layar 1920x1080 (1080p), zoom browser 100%.
3. **Pengaturan YouTube Pasca-Rekam:**
   - Format MP4 1080p, Visibilitas **Unlisted**.
   - Judul Video YouTube: `BPJS Kesehatan Healthkathon 2026 - Final 20 Besar ClaimTrace - Tim TINEERENSE MAN 1 Surakarta`.

---

## 2. STRUKTUR RUNDOWN & DISTRIBUSI WAKTU VIDEO (SESUAI 8 SLIDE `TINEERENSE.pdf`)

| Segmen Waktu | Bagian Wajib Panduan 20 Besar | Tampilan Layar | Pembicara Utama |
| :--- | :--- | :--- | :--- |
| **00:00 - 00:55** | 1. Cover & Perkenalan Tim | Slide 1 & Slide 2 `TINEERENSE.pdf` | Khalaf Faith & Gaudiansyah |
| **00:55 - 02:45** | 2. Perubahan Setelah Coaching (+ Jujur Belum Sempat) | Slide 3 `TINEERENSE.pdf` | Khalaf Faith & Gaudiansyah |
| **02:45 - 04:00** | 3. Solusi & Alur Sidecar BEA C01-S06 | Slide 4 `TINEERENSE.pdf` | Khalaf Faith Pradyatama |
| **04:00 - 07:15** | 4. Demo Aplikasi Live Versi Terbaru | Slide 5 & Browser Live App | Khalaf Faith & Gaudiansyah |
| **07:15 - 08:35** | 5. Dampak, Benchmark HKEval, & Hold-Out | Slide 6 `TINEERENSE.pdf` | Gaudiansyah Abiyu Mahya |
| **08:35 - 09:30** | 6. Model Bisnis On-Premise, Roadmap, & Penutup | Slide 7 & Slide 8 `TINEERENSE.pdf` | Khalaf Faith & Gaudiansyah |

---

## 3. PITCH SCRIPT TERSTRUKTUR (CUE SLIDE `TINEERENSE.pdf` & LIVE DEMO)

### SEGMEN 1: COVER & PERKENALAN TIM (00:00 - 00:55)
**Tampilan Layar:** Slide 1 (Cover) lalu Slide 2 (Perkenalan Tim).

**Khalaf Faith Pradyatama:**
> "Assalamu'alaikum Warahmatullahi Wabarakatuh, salam sejahtera bagi kita semua. Yang terhormat Dewan Juri dan Pembina BPJS Kesehatan Healthkathon 2026. Kami dari Tim **TINEERENSE**, MAN 1 Surakarta, mempersembahkan **ClaimTrace** — sistem pendukung keputusan pra-adjudikasi klaim FKRTL on-premise untuk Efisiensi Risiko Faskes, khususnya Sub-kategori #6 Phantom Billing dan #11 Repeat Billing."

*(Ganti ke Slide 2: Perkenalan Tim)*

**Khalaf & Gaudiansyah:**
> **Khalaf:** "Saya **Khalaf Faith Pradyatama**, Ketua Tim, bertanggung jawab pada arsitektur backend Python FastAPI, integrasi gudang SQL on-premise, keamanan siber, dan rantai audit kriptografis SHA-256."
> **Gaudiansyah:** "Saya **Gaudiansyah Abiyu Mahya**, bertanggung jawab pada perancangan antarmuka klinis UI/UX, riset regulasi JKN, skenario uji, dan penyusunan komunikasi solusi."

---

### SEGMEN 2: TRANSFORMASI PASCA-COACHING & KETERBUKAAN JUJUR (00:55 - 02:45)
**Tampilan Layar:** Slide 3 (`FOKUS: COACHING` + grafik `Transformasi Pasca-Coaching`).

**Khalaf Faith Pradyatama:**
> "Pasca sesi mentoring dan coaching bersama pembina BPJS Kesehatan, kami mengeksekusi lima transformasi kode nyata di sistem produksi:
> Pertama, menyelaraskan posisi ClaimTrace sebagai **sidecar BEA di titik C03.04** antara C03 dan S06 tanpa mengubah skema VClaim maupun Smart Vedika.
> Kedua, menghilangkan 100% ketergantungan API LLM cloud publik demi kepatuhan **UU PDP No. 27 Tahun 2022** — memigrasikan seluruh model RandomForest/IsolationForest (`.pkl`) dan Clinical NLP `all-MiniLM-L6-v2` secara **on-premise** sehingga latensi API live turun drastis dari di atas 4.000 ms menjadi **11,90 ms** (`< 15 ms` core) dengan **Rp 0 biaya token eksternal**."

**Gaudiansyah Abiyu Mahya:**
> "Ketiga, kami memperkuat Lapis 4 melalui verifikasi dokumen **RME-TTE BSrE & FRISTA**, menambah modul **Cek Dokumen RS** dan **Peringkat Risiko Faskes**, serta menanamkan 5 aturan **FairGuard Z49.1** sehingga **0,0% False Positive Rate** pada 512 klaim sah terapi kronis seperti hemodialisis.
> Keempat, pengamanan otentikasi **Fail-Closed 4-Field + 3-Lapis Google reCAPTCHA Enterprise**, putusan 2-Tier Human-in-the-Loop, dan **BAHV kolektif bersegel QR SHA-256**.
> Dan secara jujur kami sampaikan poin yang belum dikerjakan di sandbox publik: koneksi API produksi live SATUSEHAT, FRISTA, BSrE, dan key produksi reCAPTCHA menunggu kredensial resmi BPJS, sementara kalibrasi aturan hold-out *Unbundling* (`66,7%`) dan *Prolonged LOS* (`0,0%`) kami jadwalkan pada Tahap 1 Pilot 12 RS."

---

### SEGMEN 3: SOLUSI & ALUR ARSITEKTUR SIDECAR BEA (02:45 - 04:00)
**Tampilan Layar:** Slide 4 (`Solusi & Alur` + diagram `BEA C01-S06`).

**Khalaf Faith Pradyatama:**
> "Alur kerja ClaimTrace berjalan mulus dalam 3 tahap:
> 1. **Ingesti Sidecar BEA (C01-C02) & Gudang SQL On-Premise:** Menyerap feed VClaim dan INA-CBG dengan validasi skema dan hash SHA-256 terhadap gudang analitik lokal berisi **6,26 juta baris** termasuk **1.699.219 klaim FKRTL** di **2.091 RS**.
> 2. **Triangulasi 4-Lapis & Scoring AI On-Premise (`< 15 ms`):** Menghitung skor deterministik skala 0-100 (`0,50*S1 + 0,30*S2 + 0,20*S3`) beserta pemeriksaan dokumen RME-TTE dan biometrik FRISTA.
> 3. **FairGuard Z49.1 & Disposisi 3-Jalur SLA <= 10 Hari Kerja:** Meloloskan RS jujur ke Jalur Hijau (`< 50`) langsung menuju pembayaran S06, Jalur Kuning (`50-74,9`) untuk klarifikasi administratif, dan Jalur Merah (`>= 75` atau *hard trigger*) ke penahanan pra-bayar + BAHV QR."

---

### SEGMEN 4: LIVE DEMO APLIKASI VERSI TERBARU (04:00 - 07:15)
**Tampilan Layar:** Slide 5 singkat -> beralih penuh ke browser live ClaimTrace (`localhost:3000` atau URL aktif).

1. **Login Fail-Closed + 3-Lapis Google reCAPTCHA (35 detik) — Khalaf:**
   Tunjukkan halaman Sign-In mode terang bersih (*Clinical Precision*) dengan validasi 4-field (`Username`, `Email`, `NIP`, `Password`), indikator 3 lapis Google reCAPTCHA (`v2 Checkbox`, `Enterprise`, `v3 Score`), dan 3 tahap MFA menuju kokpit.
2. **Dashboard Ringkasan (35 detik) — Khalaf:**
   Tunjukkan **1.699.219 klaim FKRTL** senilai Rp 1,536 Triliun di **2.091 RS** (**496 Kab/Kota**) serta tingkat kepatuhan **SLA 99,9%** dalam koridor 10 hari kerja Perpres No. 82/2018.
3. **Antrean Klaim & Telaah 4-Lapis + FairGuard Z49.1 (50 detik) — Gaudiansyah:**
   Buka satu klaim Jalur Merah (#6 Phantom Billing / #11 Repeat Billing). Tunjukkan bukti Lapis 1 (lonjakan & kemiripan semantik), Lapis 2 (SIP SATUSEHAT & Geovelocity OSRM), Lapis 3 (konfirmasi *Zero-PHI* Mobile JKN), dan Lapis 4 (biometrik FRISTA & FairGuard Z49.1 yang melindungi klaim hemodialisis kronis agar tetap di Jalur Hijau).
4. **Cek Dokumen RS & Peringkat Risiko Faskes (40 detik) — Gaudiansyah:**
   Tunjukkan modul **Cek Dokumen RS** (audit 7 berkas wajib RME-TTE & deteksi inversi kronologi waktu) dan **Peringkat Risiko Faskes** lintas 2.091 rumah sakit.
5. **Konsol Putusan 2-Tier & BAHV Kolektif QR SHA-256 (35 detik) — Khalaf:**
   Tunjukkan persetujuan berjenjang *Human-in-the-Loop*, penerbitan dokumen **BAHV** dengan matriks QR dan checksum SHA-256 pada tab **Laporan Resmi (BAHV)**, serta **Jejak Audit Sistem** anti-tamper.

---

### SEGMEN 5: DAMPAK, BENCHMARK HKEVAL, & KETERBUKAAN HOLD-OUT (07:15 - 08:35)
**Tampilan Layar:** Slide 6 (`Dampak & Bukti Terukur` + grafik `HKEval`).

**Gaudiansyah Abiyu Mahya:**
> "Pada evaluasi terkontrol `HKEval` (`n=3.002` klaim, prevalensi 2,0%, lulus **5/5 checklist REFORMS** dengan korelasi kebocoran label mendekati nol):
> - **Precision@50 mencapai 86,0%** (43x *lift*, meningkat **+30,0% poin** dibanding aturan baku dengan `p = 0,0012`).
> - **Rupiah Recall@100 mencapai 96,8%** (58 dari 60 kasus fraud terdeteksi di Top-100 antrean).
> - **Blind Review eksternal akurat 95,0%** (19/20 kasus anomali RS uji teridentifikasi vs 0/20 metode manual).
> - **False Positive Rate Hard-Negative 0,0%** (0/512 klaim sah HD Z49.1/Thalassemia terblokir keliru) dan **RS Jujur Teraudit@50 hanya 21,9% (7/32)**.
> Dari sisi rekayasa, **300 dari 300 uji backend** serta **112 uji E2E** lulus 100% hijau across **197 endpoint FastAPI aktif**, dan pada pola *hold-out* kami melaporkan secara terbuka temuan **Unbundling 66,7% (2/3)** dan **Prolonged LOS 0,0% (0/11)** untuk dikalibrasi di Tahap 1 Pilot."

---

### SEGMEN 6: MODEL BISNIS ON-PREMISE, PETA JALAN, & PENUTUP (08:35 - 09:30)
**Tampilan Layar:** Slide 7 (`Bisnis Model & Rencana`) lalu Slide 8 (`Terima Kasih`).

**Khalaf Faith Pradyatama:**
> "ClaimTrace beroperasi 100% di infrastruktur internal BPJS Kesehatan dengan **Rp 0 biaya API cloud maupun lisensi SaaS per kursi**. TCO infrastruktur berada di rentang **Rp 0,45 Miliar hingga Rp 4,20 Miliar per tahun** dengan estimasi rasio manfaat terhadap biaya **41,1x hingga 115,5x** across tiga tahap implementasi 18 bulan (Pilot 12 FKRTL -> 126 KC / 850 FKRTL -> Skala Nasional 3.221 FKRTL & 23.816 FKTP)."

*(Ganti ke Slide 8: Terima Kasih)*

**Khalaf & Gaudiansyah:**
> "Mari bersama wujudkan pertahanan pra-adjudikasi 4-Lapis yang presisi, adil bagi RS patuh, dan menjaga keberlanjutan Dana Jaminan Sosial BPJS Kesehatan. Terima kasih, Wassalamu'alaikum Warahmatullahi Wabarakatuh."

---

## 4. CHECKLIST FINAL SUBMISI 20 BESAR

- [x] Deck Presentasi Final (`submissions/healthkathon/deck/TINEERENSE.pdf` -- 8 Slide Canva Final, `2,0 MB`)
- [x] Aplikasi Web Live & Backend Terverifikasi (`300/300` Backend + `112/112` E2E = `412 Passed`, `197` API Endpoints, `16/16` Stack OK)
- [x] Repositori GitHub Terkini (`github.com/lombeytjhtt96-glitch/ClaimTrace`)
- [ ] Rekam Video Demo Zoom sesuai 6 bagian rundown di atas (`<= 10 menit`, MP4 1080p)
- [ ] Unggah ke YouTube (`Unlisted`) & kirim berkas final ke `hackathonbpjs@bpjs-kesehatan.go.id` (periode 14-17 Nov 2026)
