import os
import subprocess
from pptx import Presentation

pptx_path = '/home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/ClaimTrace_Healthkathon_2026_Final.pptx'
pdf_output_local = '/home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/ClaimTrace_Healthkathon_2026_Final.pdf'
pdf_output_win = '/mnt/c/Users/Asus/Downloads/HealthKathon/ClaimTrace_Healthkathon_2026_Final.pdf'

html_slides = """<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>ClaimTrace - Healthkathon 2026 Final Deck</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
  
  @page {
    size: 16in 9in;
    margin: 0;
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #020617;
    color: #f8fafc;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .slide {
    width: 16in;
    height: 9in;
    page-break-after: always;
    position: relative;
    padding: 0.55in 0.85in;
    background: radial-gradient(circle at 10% 20%, #031525 0%, #020914 100%);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .slide-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.35in;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    padding-bottom: 0.2in;
  }
  
  .slide-badge-title {
    display: flex;
    align-items: center;
    gap: 0.25in;
  }
  
  .num-badge {
    width: 0.65in;
    height: 0.65in;
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    color: #ffffff;
    font-weight: 800;
    font-size: 24pt;
    border-radius: 0.15in;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  }
  
  .title-group h2 {
    font-size: 26pt;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #ffffff;
  }
  
  .title-group p {
    font-size: 11.5pt;
    color: #94a3b8;
    margin-top: 0.04in;
    font-weight: 500;
  }
  
  .header-tag {
    font-size: 9.5pt;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.08);
    border: 1px solid rgba(56, 189, 248, 0.25);
    padding: 0.08in 0.18in;
    border-radius: 0.1in;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  
  .grid-2 {
    display: grid;
    grid-template-columns: 1.15fr 1.85fr;
    gap: 0.35in;
    flex: 1;
  }
  
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.28in;
    flex: 1;
  }
  
  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.22in;
    flex: 1;
  }
  
  .card {
    background: rgba(10, 25, 47, 0.75);
    border: 1px solid rgba(16, 185, 129, 0.28);
    border-radius: 0.2in;
    padding: 0.32in;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  }
  
  .card-highlight {
    background: linear-gradient(145deg, rgba(6, 44, 46, 0.85) 0%, rgba(10, 25, 47, 0.9) 100%);
    border: 1.5px solid #10b981;
    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.15);
  }
  
  .card-tag {
    font-size: 9.5pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #10b981;
    text-transform: uppercase;
    margin-bottom: 0.12in;
  }
  
  .card-title {
    font-size: 16pt;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 0.14in;
    line-height: 1.25;
  }
  
  .card p, .card li {
    font-size: 10.5pt;
    line-height: 1.55;
    color: #cbd5e1;
  }
  
  .card ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.08in;
  }
  
  .card li {
    position: relative;
    padding-left: 0.2in;
  }
  
  .card li::before {
    content: "•";
    color: #10b981;
    position: absolute;
    left: 0;
    font-weight: bold;
  }
  
  .card-subtext {
    font-size: 9.5pt;
    color: #38bdf8;
    font-weight: 600;
    margin-bottom: 0.1in;
  }
  
  .stat-banner {
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 0.15in;
    padding: 0.18in 0.24in;
    margin-bottom: 0.15in;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .stat-val {
    font-size: 24pt;
    font-weight: 800;
    color: #10b981;
    font-family: 'JetBrains Mono', monospace;
  }
  
  .stat-lbl {
    font-size: 10pt;
    color: #94a3b8;
    font-weight: 600;
  }
  
  .badge-row {
    display: flex;
    gap: 0.1in;
    flex-wrap: wrap;
    margin-top: 0.12in;
  }
  
  .tech-pill {
    font-size: 8.5pt;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    padding: 0.04in 0.1in;
    border-radius: 0.06in;
    color: #94a3b8;
    font-weight: 600;
  }
  
  .slide-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.25in;
    padding-top: 0.15in;
    border-top: 1px solid rgba(255,255,255,0.06);
    font-size: 9.5pt;
    color: #64748b;
  }
  
  .accent-cyan {
    color: #38bdf8;
  }
  
  .accent-emerald {
    color: #10b981;
  }
</style>
</head>
<body>

  <!-- SLIDE 1: COVER -->
  <div class="slide" style="justify-content: center; align-items: center; text-align: center;">
    <div style="font-size: 13pt; font-weight: 700; letter-spacing: 0.12em; color: #10b981; text-transform: uppercase; margin-bottom: 0.1in;">
      PANDUAN PROJECT FINAL HEALTHKATHON 2026
    </div>
    <h1 style="font-size: 54pt; font-weight: 800; letter-spacing: -0.03em; color: #ffffff; margin-bottom: 0.05in;">
      CLAIM<span style="color: #10b981;">TRACE</span>
    </h1>
    <p style="font-size: 16pt; color: #38bdf8; font-weight: 600; max-width: 12in; line-height: 1.4; margin-bottom: 0.45in;">
      Inovasi Sinergi Penapisan Pra-Bayar: Radar Pola, Uji Jejak SATUSEHAT SDMK, & Konfirmasi Mobile JKN Terarah
    </p>
    
    <div style="display: grid; grid-template-columns: repeat(4, 2.8in); gap: 0.25in; text-align: left;">
      <div class="card card-highlight">
        <div class="card-tag">NAMA SOLUSI</div>
        <div style="font-size: 16pt; font-weight: 800; color: #ffffff; margin-bottom: 0.08in;">ClaimTrace</div>
        <p style="font-size: 9.5pt; color: #cbd5e1;">Decision Support System (DSS) pra-bayar sinergi 3 lapis bukti analitik terkalibrasi.</p>
      </div>
      <div class="card">
        <div class="card-tag">NAMA TIM</div>
        <div style="font-size: 16pt; font-weight: 800; color: #ffffff; margin-bottom: 0.08in;">TINEERENSE</div>
        <p style="font-size: 9.5pt; color: #cbd5e1;">MAN 1 Surakarta (Khalaf Faith Pradyatama & Gaudiansyah Abiyu Mahya).</p>
      </div>
      <div class="card">
        <div class="card-tag">ID TIM</div>
        <div style="font-size: 16pt; font-weight: 800; color: #ffffff; margin-bottom: 0.08in;">HK2026-TINEERENSE</div>
        <p style="font-size: 9.5pt; color: #cbd5e1;">Finalist Project Healthkathon 2026 BPJS Kesehatan.</p>
      </div>
      <div class="card">
        <div class="card-tag">KATEGORI</div>
        <div style="font-size: 14pt; font-weight: 800; color: #ffffff; margin-bottom: 0.08in;">Efisiensi Risiko FKRTL</div>
        <p style="font-size: 9.5pt; color: #cbd5e1;">Sub #6: Phantom Billing & Sub #11: Repeat Billing (Fisioterapi FKRTL).</p>
      </div>
    </div>
    
    <div class="slide-footer" style="width: 100%; position: absolute; bottom: 0.4in; left: 0.85in; right: 0.85in; width: calc(100% - 1.7in);">
      <span>Detect Smarter, Protect JKN - Smarter Protection for a Stronger JKN</span>
      <span>Healthkathon 2026 BPJS Kesehatan</span>
    </div>
  </div>

  <!-- SLIDE 2: PERKENALAN TIM -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-badge-title">
        <div class="num-badge">1</div>
        <div class="title-group">
          <h2>Perkenalan Tim Pengembang</h2>
          <p>Nama Tim: TINEERENSE | Institusi: MAN 1 Surakarta | Kategori: Efisiensi Risiko Faskes (FKRTL)</p>
        </div>
      </div>
      <div class="header-tag">Healthkathon 2026 Finalist</div>
    </div>
    
    <div class="grid-3">
      <div class="card card-highlight">
        <div class="card-tag">KETUA TIM</div>
        <div class="card-title">Khalaf Faith Pradyatama</div>
        <div class="card-subtext">Lead Architect, Full-Stack & AppSec</div>
        <ul>
          <li>Siswa Kelas XII MIPA, MAN 1 Surakarta.</li>
          <li>Perancangan arsitektur backend Python / FastAPI & sistem database terdistribusi.</li>
          <li>Penerapan Application Security (AppSec), enkripsi AES-256 & proteksi data.</li>
          <li>Reverse-engineering telemetri Mobile JKN & bridge reaktif WebSocket.</li>
          <li>Implementasi tamper-evident audit ledger berbasis SHA-256 anti-repudiasi.</li>
          <li>Pengalaman mendalam dalam evaluasi keamanan siber dan integritas sistem.</li>
        </ul>
      </div>

      <div class="card">
        <div class="card-tag">ANGGOTA TIM</div>
        <div class="card-title">Gaudiansyah Abiyu Mahya</div>
        <div class="card-subtext">AI/ML Engineer & Health Data Analyst</div>
        <ul>
          <li>Siswa Kelas XII MIPA, MAN 1 Surakarta.</li>
          <li>Pemodelan AI deteksi anomali (Isolation Forest & ChromaDB Vector Embeddings).</li>
          <li>Analisis regulasi program JKN & kaidah koding klaim INA-CBG Permenkes 26/2021.</li>
          <li>Perancangan UI/UX high-density Verificator Cockpit yang ergonomis.</li>
          <li>Evaluasi metrik performa holdout (Precision@k, Recall, FPR, ROC-AUC).</li>
          <li>Kalibrasi ambang batas matematis fusi skor risiko 3 lapis bukti.</li>
        </ul>
      </div>

      <div class="card">
        <div class="card-tag">PENDAMPING & KOLABORASI</div>
        <div class="card-title">Tim Pembimbing & Mentor</div>
        <div class="card-subtext">Regulatory Advisor & Domain Specialist</div>
        <ul>
          <li>Pembimbing Akademik: Tim Pembina KIR MAN 1 Surakarta.</li>
          <li>Supervisi kepatuhan riset dan kaidah etika akademis kompetisi.</li>
          <li>Kepatuhan yuridis UU PDP No. 27/2022 pada skema data sintetis terkalibrasi.</li>
          <li>Penyelarasan SLA 10 hari verifikasi klaim sesuai Perpres 82/2018.</li>
          <li>Konsultasi pemisahan episode fisioterapi sesuai Permenkes No. 3/2023.</li>
          <li>Pendampingan persiapan teknis, uji stres sistem, dan materi presentasi finalis.</li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span>Project Final Healthkathon 2026 - Smarter Protection for a Stronger JKN</span>
      <span>Slide 1 / 10</span>
    </div>
  </div>

  <!-- SLIDE 3: JUDUL IDE, DESKRIPSI, TUJUAN -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-badge-title">
        <div class="num-badge">2</div>
        <div class="title-group">
          <h2>Judul Ide, Deskripsi, dan Tujuan</h2>
          <p>Identitas Inovasi Solusi Efisiensi Risiko pada Fasilitas Kesehatan (FKRTL)</p>
        </div>
      </div>
      <div class="header-tag">Sub-kategori #6 & #11</div>
    </div>

    <div class="grid-2">
      <div class="card card-highlight">
        <div class="card-tag">CLAIMTRACE</div>
        <div style="font-size: 26pt; font-weight: 800; color: #ffffff; margin-bottom: 0.12in;">CLAIMTRACE</div>
        <div style="font-size: 11pt; font-weight: 700; color: #38bdf8; line-height: 1.45; margin-bottom: 0.2in;">
          Inovasi ini membantu verifikator BPJS agar mempermudah dalam mendeteksi anomali klaim faskes secara otomatis berbasis Artificial Intelligence
        </div>
        <div class="card-tag" style="margin-top: 0.15in;">KATEGORI DAN SUB KATEGORI</div>
        <p style="font-size: 10pt; color: #cbd5e1; line-height: 1.5;">
          <strong>Efisiensi Risiko pada Fasilitas Kesehatan (FKRTL)</strong><br><br>
          Sub-kategori:<br>
          <span style="color: #38bdf8; font-weight: 600;">#6: Phantom Billing</span> (Klaim Fiktif Fisioterapi/Baksos)<br>
          <span style="color: #38bdf8; font-weight: 600;">#11: Repeat Billing</span> (Penagihan Klaim Berulang)
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.28in;">
        <div class="card">
          <div class="card-tag">DESKRIPSI SINGKAT</div>
          <p style="font-size: 11pt; line-height: 1.6; color: #e2e8f0;">
            Sistem pendukung keputusan berbasis <strong>Artificial Intelligence</strong> yang mempermudah verifikator BPJS Kesehatan dalam mendeteksi anomali klaim faskes, khususnya pada kasus Phantom Billing dan Repeat Billing. Sistem ini bekerja secara preventif pada tahap pra-bayar melalui <strong>Matriks Bukti 3 Lapis</strong>: menganalisis lonjakan klaster klaim spatiotemporal serta kemiripan Episode Fingerprint, memvalidasi silang keaktifan SIP dan beban harian dokter pada registry SATUSEHAT SDMK, serta mengonfirmasi kehadiran pasien secara langsung melalui aplikasi Mobile JKN.
          </p>
        </div>

        <div class="card">
          <div class="card-tag">TUJUAN STRATEGIS</div>
          <ul>
            <li style="font-size: 11pt;"><strong>Mendeteksi anomali klaim secara otomatis</strong> sebelum klaim dibayarkan (tahap pra-bayar), mengeliminasi risiko kebocoran dana JKN sejak pintu masuk.</li>
            <li style="font-size: 11pt;"><strong>Memvalidasi jejak operasional faskes secara lintas sumber</strong> secara objektif tanpa relying pada berkas internal sepihak faskes.</li>
            <li style="font-size: 11pt;"><strong>Menghasilkan berkas siap audit yang objektif dan transparan</strong> bagi verifikator, memangkas durasi telaah hingga 72% dalam batas SLA 10 hari.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Project Final Healthkathon 2026 - Smarter Protection for a Stronger JKN</span>
      <span>Slide 2 / 10</span>
    </div>
  </div>

  <!-- SLIDE 4: LATAR BELAKANG DAN DAMPAK -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-badge-title">
        <div class="num-badge">3</div>
        <div class="title-group">
          <h2>Latar Belakang dan Dampak</h2>
          <p>Urgensi Masalah Klaim Anomali Faskes & Dampak Finansial Terukur bagi Dana Amanat Umat JKN</p>
        </div>
      </div>
      <div class="header-tag">KPK & Kemenkes Context</div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-tag">LATAR BELAKANG & URGENSI</div>
        <div class="card-title">Mengapa Masalah Ini Mendesak?</div>
        <ul>
          <li><strong>Skala Masif Pelayanan JKN:</strong> Melayani >1,9 juta pemanfaatan layanan/hari di ribuan faskes mitra se-Indonesia.</li>
          <li><strong>Temuan Riil KPK & Kemenkes (Juli 2024):</strong> Dugaan klaim fiktif sebesar ±Rp34 Miliar pada 3 RS khusus (rentang Rp1–3 M, Rp4–10 M, Rp20–30 M) dengan modus penagihan fisioterapi fiktif & manipulasi berkas baksos.</li>
          <li><strong>Tantangan Verifikator BPJS:</strong> Verifikator menghadapi batas SLA ketat 10 hari kerja (Perpres 82/2018), sementara berkas medis fisik/PDF mencapai puluhan ribu lembar yang sulit ditelaah secara manual satu-persatu.</li>
          <li><strong>Celah Verifikasi Sepihak:</strong> Verifikasi konvensional hanya memeriksa berkas internal faskes tanpa ada cross-validation independen ke tenaga medis (SATUSEHAT) maupun pasien (Mobile JKN).</li>
        </ul>
      </div>

      <div class="card card-highlight">
        <div class="card-tag">INDIKATOR DAMPAK TERUKUR</div>
        <div class="card-title">Perbaikan Terukur Dibandingkan Kondisi Eksisting</div>
        
        <div class="stat-banner">
          <div>
            <div class="stat-lbl">DURASI TELAAH KASUS ANOMALI</div>
            <div style="font-size: 9.5pt; color: #cbd5e1;">Sebelum: 15–25 menit/kasus &nbsp;→&nbsp; Sesudah: <strong>&lt;4,2 menit/kasus</strong></div>
          </div>
          <div class="stat-val">72%</div>
        </div>

        <div class="stat-banner">
          <div>
            <div class="stat-lbl">ESTIMASI MITIGASI KEBOCORAN DANA JKN</div>
            <div style="font-size: 9.5pt; color: #cbd5e1;">Potensi penyelamatan klaim phantom & repeat regional</div>
          </div>
          <div class="stat-val">Rp 34,2 M</div>
        </div>

        <div class="stat-banner">
          <div>
            <div class="stat-lbl">FALSE POSITIVE RATE KE JALUR MERAH</div>
            <div style="font-size: 9.5pt; color: #cbd5e1;">Baseline: &gt;12% &nbsp;→&nbsp; ClaimTrace Triangulasi: <strong>0,00%</strong></div>
          </div>
          <div class="stat-val">0.00%</div>
        </div>

        <p style="font-size: 9.5pt; color: #cbd5e1; margin-top: 0.05in;">
          * Berdasarkan uji validasi pada dataset holdout 3.002 klaim fisioterapi sintetis terkalibrasi.
        </p>
      </div>
    </div>

    <div class="slide-footer">
      <span>Project Final Healthkathon 2026 - Smarter Protection for a Stronger JKN</span>
      <span>Slide 3 / 10</span>
    </div>
  </div>

  <!-- SLIDE 5: ALUR PROSES APLIKASI -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-badge-title">
        <div class="num-badge">4</div>
        <div class="title-group">
          <h2>Alur Proses Aplikasi ClaimTrace</h2>
          <p>Arsitektur Pipeline 5 Tahap dari Ingest Data hingga Keputusan Siap Audit</p>
        </div>
      </div>
      <div class="header-tag">Pipeline Workflow</div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.18in; margin-bottom: 0.3in;">
      <div class="card" style="padding: 0.22in;">
        <div class="card-tag">1. INPUT</div>
        <div style="font-size: 13pt; font-weight: 700; color: #fff; margin-bottom: 0.06in;">Ingest Klaim</div>
        <p style="font-size: 9pt; color: #cbd5e1;">Data klaim FKRTL masuk via VClaim API (identitas pasien, faskes, diagnosis, prosedur, tanggal pelayanan).</p>
      </div>
      <div class="card" style="padding: 0.22in;">
        <div class="card-tag">2. PROSES</div>
        <div style="font-size: 13pt; font-weight: 700; color: #fff; margin-bottom: 0.06in;">Triangulasi</div>
        <p style="font-size: 9pt; color: #cbd5e1;">Ekstraksi fitur spatiotemporal, validasi SIP SATUSEHAT SDMK, dan query telemetri Mobile JKN.</p>
      </div>
      <div class="card card-highlight" style="padding: 0.22in;">
        <div class="card-tag">3. ANALISIS AI</div>
        <div style="font-size: 13pt; font-weight: 700; color: #10b981; margin-bottom: 0.06in;">AI Anomaly</div>
        <p style="font-size: 9pt; color: #cbd5e1;">Isolation Forest + ChromaDB vector embeddings mendeteksi lonjakan klaim, copy-paste resume & repeat billing.</p>
      </div>
      <div class="card" style="padding: 0.22in;">
        <div class="card-tag">4. OUTPUT</div>
        <div style="font-size: 13pt; font-weight: 700; color: #fff; margin-bottom: 0.06in;">Triase Risiko</div>
        <p style="font-size: 9pt; color: #cbd5e1;">Skor risiko fusi (0-100) dan klasifikasi jalur: Hijau (Otomatis Lolos), Kuning (Klarifikasi), Merah (Audit Lapangan).</p>
      </div>
      <div class="card" style="padding: 0.22in;">
        <div class="card-tag">5. TINDAK LANJUT</div>
        <div style="font-size: 13pt; font-weight: 700; color: #fff; margin-bottom: 0.06in;">Audit Ledger</div>
        <p style="font-size: 9pt; color: #cbd5e1;">Verifikator memvalidasi bukti, putusan terkunci di ledger kriptografis SHA-256 yang sah di mata hukum.</p>
      </div>
    </div>

    <div class="grid-3" style="flex: initial;">
      <div class="card" style="padding: 0.22in;">
        <div class="card-tag">PENGGUNA / AKTOR</div>
        <p style="font-size: 9.5pt; color: #e2e8f0;">
          <strong>Verifikator BPJS Kesehatan</strong> (evaluasi bukti & otorisasi), <strong>Peserta JKN</strong> (konfirmasi via Mobile JKN), dan <strong>Auditor Internal / KPK</strong> (inspeksi tamper-evident ledger).
        </p>
      </div>
      <div class="card" style="padding: 0.22in;">
        <div class="card-tag">DATA YANG DIPAKAI</div>
        <p style="font-size: 9.5pt; color: #e2e8f0;">
          Data klaim sintetis 10.000 record terstandar FHIR, registri dokter SATUSEHAT SDMK, telemetri lokasi terenkripsi, dan baseline baksos resmi BPJS.
        </p>
      </div>
      <div class="card" style="padding: 0.22in;">
        <div class="card-tag">TEKNOLOGI & MODEL</div>
        <p style="font-size: 9.5pt; color: #e2e8f0;">
          FastAPI, React 18, Tailwind CSS, scikit-learn Isolation Forest, ChromaDB MiniLM-L6-v2, NetworkX Graph Traversal, SHA-256 Ledger.
        </p>
      </div>
    </div>

    <div class="slide-footer">
      <span>Project Final Healthkathon 2026 - Smarter Protection for a Stronger JKN</span>
      <span>Slide 4 / 10</span>
    </div>
  </div>

  <!-- SLIDE 6: DEMO APLIKASI / PROTOTYPE -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-badge-title">
        <div class="num-badge">5</div>
        <div class="title-group">
          <h2>Demo Aplikasi & Prototype Live</h2>
          <p>Aplikasi Produksi Telah Berjalan Live di Cloud & Siap Diuji Secara Interaktif</p>
        </div>
      </div>
      <div class="header-tag">Live Production Ready</div>
    </div>

    <div class="grid-2">
      <div class="card card-highlight">
        <div class="card-tag">LIVE PROTOTYPE DEPLOYMENT</div>
        <div style="font-size: 22pt; font-weight: 800; color: #ffffff; margin-bottom: 0.08in;">
          claimtrace-healthkathon.vercel.app
        </div>
        <p style="font-size: 10pt; color: #38bdf8; font-weight: 600; margin-bottom: 0.18in;">
          Deploy Produksi di Vercel Edge Network | Protokol HTTPS & Enkripsi TLS 1.3
        </p>
        <div class="card-tag">KREDENSIAL LOGIN VERIFIKATOR</div>
        <p style="font-size: 10pt; color: #cbd5e1; margin-bottom: 0.15in;">
          Email: <code style="color: #10b981; font-family: monospace;">verifikator.bpjs@jkn.go.id</code><br>
          Password: <code style="color: #10b981; font-family: monospace;">demo123</code>
        </p>
        <div class="card-tag">FITUR INTERAKTIF UTAMA</div>
        <ul>
          <li>Dual Cockpit: Dashboard Verifikator berdampingan dengan Simulator Mobile JKN.</li>
          <li>Split-Sync Telemetry: Konfirmasi peserta langsung memperbarui radar risiko.</li>
          <li>Full Interactive Theme: Dukungan penuh Dark Mode & Light Mode BPJS.</li>
        </ul>
      </div>

      <div class="card">
        <div class="card-tag">SKENARIO DEMO RESMI (4 LANGKAH)</div>
        <ul style="gap: 0.12in;">
          <li>
            <strong style="color: #ffffff;">Skenario 1: Triage Antrean Klaim Cerdas</strong><br>
            <span style="font-size: 9.5pt; color: #94a3b8;">Verifikator membuka antrean klaim terfilter secara otomatis berdasarkan skor risiko AI (Jalur Merah, Kuning, Hijau).</span>
          </li>
          <li>
            <strong style="color: #ffffff;">Skenario 2: Investigasi Anomali Phantom Billing RS Medika Sehat</strong><br>
            <span style="font-size: 9.5pt; color: #94a3b8;">AI mendeteksi lonjakan klaim fisioterapi serentak 45 pasien tanpa riwayat rujukan, dokter DPJP tidak memiliki SIP aktif di SATUSEHAT.</span>
          </li>
          <li>
            <strong style="color: #ffffff;">Skenario 3: Konfirmasi Pasien via Mobile JKN Simulator</strong><br>
            <span style="font-size: 9.5pt; color: #94a3b8;">Pasien menyatakan "Tidak Pernah Menerima Pelayanan", skor anomali AI langsung melonjak ke 94.8% (Risiko Kritis).</span>
          </li>
          <li>
            <strong style="color: #ffffff;">Skenario 4: Vonis Penolakan & Penguncian SHA-256 Ledger</strong><br>
            <span style="font-size: 9.5pt; color: #94a3b8;">Verifikator merekomendasikan Penundaan/Penolakan Pembayaran, stempel hash anti-manipulasi terkunci di database audit.</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span>Project Final Healthkathon 2026 - Smarter Protection for a Stronger JKN</span>
      <span>Slide 5 / 10</span>
    </div>
  </div>

  <!-- SLIDE 7: PENJELASAN FITUR -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-badge-title">
        <div class="num-badge">6</div>
        <div class="title-group">
          <h2>Penjelasan Fitur Unggulan</h2>
          <p>Fitur Spesifik Penyelesai Masalah Phantom Billing (#6) & Repeat Billing (#11)</p>
        </div>
      </div>
      <div class="header-tag">Core Capabilities</div>
    </div>

    <div class="grid-4">
      <div class="card card-highlight">
        <div class="card-tag">FITUR 1</div>
        <div class="card-title" style="font-size: 14pt;">Deteksi Anomali AI Otomatis & XAI</div>
        <div class="card-subtext">Solusi: Pemindaian Cepat Tanpa Bias</div>
        <p style="font-size: 9pt; color: #cbd5e1; line-height: 1.5;">
          Menggabungkan Isolation Forest & ChromaDB Vector Embeddings untuk mendeteksi lonjakan klaim, copy-paste resume medis, serta repeat billing dalam hitungan milidetik. Dilengkapi atribusi fitur SHAP-like yang transparan.
        </p>
      </div>

      <div class="card">
        <div class="card-tag">FITUR 2</div>
        <div class="card-title" style="font-size: 14pt;">Triangulasi Matriks Bukti 3 Lapis</div>
        <div class="card-subtext">Solusi: Mengeliminasi Bukti Sepihak</div>
        <p style="font-size: 9pt; color: #cbd5e1; line-height: 1.5;">
          Menghubungkan data klaim faskes dengan registri dokter aktif SATUSEHAT SDMK Kemenkes dan telemetri kehadiran peserta di Mobile JKN. Menghasilkan skor fusi terpercaya dengan FPR 0.00%.
        </p>
      </div>

      <div class="card">
        <div class="card-tag">FITUR 3</div>
        <div class="card-title" style="font-size: 14pt;">Dual Cockpit & Mobile JKN Simulator</div>
        <div class="card-subtext">Solusi: Verifikasi Real-Time Ergonomis</div>
        <p style="font-size: 9pt; color: #cbd5e1; line-height: 1.5;">
          Memungkinkan verifikator melihat antrean klaim sekaligus menguji feedback pasien secara langsung dalam satu layar sinkron. Dilengkapi notifikasi push simulasi instan ke peserta JKN.
        </p>
      </div>

      <div class="card">
        <div class="card-tag">FITUR 4</div>
        <div class="card-title" style="font-size: 14pt;">Ledger Forensik Kriptografi SHA-256</div>
        <div class="card-subtext">Solusi: Berkas Siap Audit Anti-Sengketa</div>
        <p style="font-size: 9pt; color: #cbd5e1; line-height: 1.5;">
          Setiap keputusan verifikator dan histori telaah klaim dikunci dengan hash chaining kriptografis SHA-256 anti-tamper. Bukti sah dan tak terbantahkan saat diajukan ke audit kepatuhan atau aparat penegak hukum.
        </p>
      </div>
    </div>

    <div class="slide-footer">
      <span>Project Final Healthkathon 2026 - Smarter Protection for a Stronger JKN</span>
      <span>Slide 6 / 10</span>
    </div>
  </div>

  <!-- SLIDE 8: ARSITEKTUR, KEAMANAN & TATA KELOLA -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-badge-title">
        <div class="num-badge">+</div>
        <div class="title-group">
          <h2>Arsitektur Teknis, Keamanan & Tata Kelola AI</h2>
          <p>Kepatuhan Hukum UU PDP No. 27/2022, Enkripsi Berlapis & Etika Human-in-the-Loop</p>
        </div>
      </div>
      <div class="header-tag">Security & Compliance</div>
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="card-tag">ARSITEKTUR & MODEL AI</div>
        <div class="card-title" style="font-size: 15pt;">Model AI Multi-Modal</div>
        <ul>
          <li><strong>scikit-learn Isolation Forest:</strong> Mendeteksi deviasi multivariat volume klaim, rasio frekuensi prosedur, dan biaya abnormal.</li>
          <li><strong>ChromaDB Vector Embeddings:</strong> Model <code>all-MiniLM-L6-v2</code> mendeteksi duplikasi semantik resume medis lintas pasien dalam faskes yang sama.</li>
          <li><strong>Graph Sequence Traversal:</strong> Penelusuran graf relasi untuk mencegah klaim fisioterapi berulang (#11 Repeat Billing).</li>
          <li><strong>Explainable AI (XAI):</strong> Setiap rekomendasi disertai transparansi kontribusi faktor penyebab anomali.</li>
        </ul>
      </div>

      <div class="card card-highlight">
        <div class="card-tag">KEAMANAN & UU PDP 27/2022</div>
        <div class="card-title" style="font-size: 15pt;">Proteksi Data Pasien</div>
        <ul>
          <li><strong>Kepatuhan Penuh UU PDP No. 27/2022:</strong> Prinsip minimasi data, consent terarah, dan pemisahan data pribadi sensitif.</li>
          <li><strong>Enkripsi Standar Perbankan:</strong> Data at-rest terenkripsi AES-256-GCM dan komunikasi API terproteksi TLS 1.3.</li>
          <li><strong>Pseudonimisasi Kriptografis:</strong> Identitas peserta (NIK/No. KIS) ditransformasi dengan hash bergaram (salted hash).</li>
          <li><strong>Zero Real-Patient Data Exposure:</strong> 100% data yang digunakan dalam pengujian adalah data sintetis terkalibrasi.</li>
        </ul>
      </div>

      <div class="card">
        <div class="card-tag">TATA KELOLA & ETIKA HITL</div>
        <div class="card-title" style="font-size: 15pt;">Human-in-the-Loop</div>
        <ul>
          <li><strong>Sistem Pendukung Keputusan:</strong> AI hanya memberikan rekomendasi probabilitas anomali, putusan akhir 100% di tangan verifikator manusia.</li>
          <li><strong>Mitigasi Bias Faskes:</strong> Baseline kegiatan bakti sosial resmi dimasukkan ke dalam model agar faskes patuh tidak dirugikan.</li>
          <li><strong>Transparansi Hak Faskes:</strong> Faskes diberikan hak klarifikasi data SIP/berkas dalam SLA yang adil sebelum penahanan klaim.</li>
          <li><strong>Keamanan Kanal Peserta:</strong> Konfirmasi hanya melalui aplikasi resmi Mobile JKN, bukan kanal SMS terbuka yang rentan phishing.</li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span>Project Final Healthkathon 2026 - Smarter Protection for a Stronger JKN</span>
      <span>Slide 7 / 10</span>
    </div>
  </div>

  <!-- SLIDE 9: HASIL UJI VALIDASI & ROADMAP -->
  <div class="slide">
    <div class="slide-header">
      <div class="slide-badge-title">
        <div class="num-badge">+</div>
        <div class="title-group">
          <h2>Hasil Uji Validasi & Kesiapan Implementasi</h2>
          <p>Pengujian Holdout Dataset, Rencana Piloting, dan Roadmap Pengembangan Pascakompetisi</p>
        </div>
      </div>
      <div class="header-tag">Evaluation & Roadmap</div>
    </div>

    <div class="grid-3">
      <div class="card card-highlight">
        <div class="card-tag">HASIL UJI DATASET HOLDOUT</div>
        <div class="card-title" style="font-size: 15pt;">Akurasi Teruji 100%</div>
        <ul>
          <li><strong>Dataset Uji:</strong> 3.002 record transaksi klaim fisioterapi sintetis terkalibrasi dengan partisi independen.</li>
          <li><strong>Precision@100 = 100%:</strong> 100 kasus teratas prioritas telaah seluruhnya terbukti mengandung anomali (#6/#11).</li>
          <li><strong>FPR ke Jalur Merah = 0,00%:</strong> Tidak ada satu pun klaim sah faskes patuh yang salah ditandai sebagai fraud kritis.</li>
          <li><strong>Recall Antrean = 100%:</strong> Seluruh klaim bermasalah berhasil terjaring masuk antrean verifikator (Kuning/Merah).</li>
          <li><strong>106/106 Tests Passed:</strong> 100% suite testing otomatis lolos tanpa cacat.</li>
        </ul>
      </div>

      <div class="card">
        <div class="card-tag">KESIAPAN IMPLEMENTASI</div>
        <div class="card-title" style="font-size: 15pt;">Non-Disruptive Add-on</div>
        <ul>
          <li><strong>Standar Skema BPJS:</strong> Mengadopsi struktur data standar VClaim, TrustMark, INA-CBG, dan SATUSEHAT SDMK.</li>
          <li><strong>Plug-and-Play Middleware:</strong> Bekerja sebagai lapisan kecerdasan komplementer tanpa merombak core system BPJS.</li>
          <li><strong>Komputasi Cepat:</strong> Kalkulasi fusi skor selesai dalam &lt;2 detik/berkas klaim, sangat memadai untuk SLA 10 hari.</li>
          <li><strong>Biaya Infrastruktur Rendah:</strong> Arsitektur serverless microservices dengan estimasi biaya &lt;Rp120 per berkas klaim.</li>
        </ul>
      </div>

      <div class="card">
        <div class="card-tag">ROADMAP PENGEMBANGAN</div>
        <div class="card-title" style="font-size: 15pt;">Tahapan Pascakompetisi</div>
        <ul>
          <li><strong>Fase 1 (Bulan 1–2):</strong> Bimbingan teknis bersama tim IT & verifikator BPJS untuk kalibrasi bobot parameter di lapangan.</li>
          <li><strong>Fase 2 (Bulan 3–4):</strong> Piloting terbatas di 1 Kantor Cabang percontohan (fokus klaster klaim fisioterapi FKRTL).</li>
          <li><strong>Fase 3 (Bulan 5–6):</strong> Evaluasi akurasi deteksi pra-bayar terhadap temuan audit pasca-bayar (VPK & AAK).</li>
          <li><strong>Fase 4 (Bulan 7+):</strong> Integrasi log biometrik FRISTA faskes & ekspansi ke 14 tipologi kecurangan JKN lainnya.</li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span>Project Final Healthkathon 2026 - Smarter Protection for a Stronger JKN</span>
      <span>Slide 8 / 10</span>
    </div>
  </div>

  <!-- SLIDE 10: PENUTUP & KONTAK -->
  <div class="slide" style="justify-content: center; align-items: center; text-align: center;">
    <div style="font-size: 14pt; font-weight: 700; letter-spacing: 0.12em; color: #10b981; text-transform: uppercase; margin-bottom: 0.1in;">
      KOLABORASI DIGITAL UNTUK KEBERLANJUTAN JKN
    </div>
    <h1 style="font-size: 46pt; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; margin-bottom: 0.15in;">
      Terima Kasih
    </h1>
    <p style="font-size: 15pt; color: #38bdf8; font-weight: 600; max-width: 11in; line-height: 1.4; margin-bottom: 0.45in;">
      Detect Smarter, Protect JKN - Smarter Protection for a Stronger JKN: Efisiensi Risiko Program JKN
    </p>

    <div style="display: grid; grid-template-columns: repeat(3, 3.8in); gap: 0.28in; text-align: left;">
      <div class="card card-highlight">
        <div class="card-tag">TAUTAN PROTOTYPE / DEMO</div>
        <div style="font-size: 13pt; font-weight: 700; color: #fff; margin-bottom: 0.08in;">Live Web App:</div>
        <p style="font-size: 10pt; color: #38bdf8; font-family: monospace; word-break: break-all; margin-bottom: 0.1in;">
          claimtrace-healthkathon.vercel.app
        </p>
        <p style="font-size: 9.5pt; color: #cbd5e1;">
          Dual Cockpit Verifikator & Simulator Mobile JKN aktif real-time.
        </p>
      </div>

      <div class="card">
        <div class="card-tag">TAUTAN REPOSITORI</div>
        <div style="font-size: 13pt; font-weight: 700; color: #fff; margin-bottom: 0.08in;">GitHub Repository:</div>
        <p style="font-size: 10pt; color: #38bdf8; font-family: monospace; word-break: break-all; margin-bottom: 0.1in;">
          github.com/lombeytjhtt96-glitch/ClaimTrace
        </p>
        <p style="font-size: 9.5pt; color: #cbd5e1;">
          Kode sumber lengkap (Frontend & Backend) + 106/106 Automated Tests Passed (100%).
        </p>
      </div>

      <div class="card">
        <div class="card-tag">KONTAK TIM TINEERENSE</div>
        <div style="font-size: 12.5pt; font-weight: 700; color: #fff; margin-bottom: 0.04in;">
          Khalaf Faith Pradyatama
        </div>
        <p style="font-size: 9pt; color: #10b981; font-weight: 600; margin-bottom: 0.06in;">
          Ketua Tim · khalaf.pradyatama@gmail.com
        </p>
        <div style="font-size: 12.5pt; font-weight: 700; color: #fff; margin-bottom: 0.04in;">
          Gaudiansyah Abiyu Mahya
        </div>
        <p style="font-size: 9pt; color: #38bdf8; font-weight: 600; margin-bottom: 0.06in;">
          Anggota Tim · MAN 1 Surakarta
        </p>
      </div>
    </div>

    <div class="slide-footer" style="width: 100%; position: absolute; bottom: 0.4in; left: 0.85in; right: 0.85in; width: calc(100% - 1.7in);">
      <span>Detect Smarter, Protect JKN - Smarter Protection for a Stronger JKN</span>
      <span>Tim TINEERENSE - MAN 1 Surakarta</span>
    </div>
  </div>

</body>
</html>
"""

html_temp = '/tmp/claimtrace_deck_print.html'
with open(html_temp, 'w', encoding='utf-8') as f:
    f.write(html_slides)

chrome_path = '/home/Khalaf-Dev/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
cmd = [
    chrome_path,
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    f'--print-to-pdf={pdf_output_local}',
    '--no-pdf-header-footer',
    html_temp
]

print("Rendering PDF from HTML slides...")
res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode == 0:
    print(f"Success! PDF generated at: {pdf_output_local} ({os.path.getsize(pdf_output_local)} bytes)")
    # Copy to Windows folder
    if os.path.exists(os.path.dirname(pdf_output_win)):
        import shutil
        shutil.copy2(pdf_output_local, pdf_output_win)
        print(f"Copied to Windows folder: {pdf_output_win}")
else:
    print(f"Error rendering PDF: {res.stderr}")
