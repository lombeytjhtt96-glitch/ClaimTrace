# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Auditor Medis BPJS Kesehatan, Verifikator Klaim Kantor Cabang (KC), Tim Audit Investigasi Kantor Pusat, dan Manajemen Eksekutif Dewan Direksi BPJS Kesehatan.

## Product Purpose

ClaimTrace JKN adalah Sistem Pendukung Keputusan (Decision Support System / DSS) terpadu untuk deteksi anomali, pencegahan fraud, dan audit rekonsiliasi klaim pelayanan kesehatan tingkat pertama (FKTP) maupun fasilitas kesehatan rujukan tingkat lanjutan (FKRTL). Tujuannya adalah mengamankan kesinambungan Dana Jaminan Sosial (DJS) kesehatan secara adil, akuntabel, dan transparan.

## Positioning

Solusi DSS deteksi fraud berbasis Tri-Layer Mathematical Fusion (Heuristic Rules, Anomaly Scoring, Bipartite Graph Analytics) yang dirancang khusus untuk ekosistem JKN Indonesia. Berbeda dari solusi generik, ClaimTrace JKN patuh regulasi RI (UU PDP 27/2022, Perpres 82/2018, Permenkes 26/2021), berarsitektur Zero-PHI (Protected Health Information terpseudonimkan), dan mengintegrasikan ledger audit forensik SHA-256 tamper-evident dengan performa analitik sub-15ms.

## Operating Context

- Verifikasi harian pra-bayar klaim rumah sakit dan klinik.
- Audit berkala pasca-bayar berbasis analisis geovelocity DPJP dan pola rujukan anomali.
- Investigasi terarah komite audit terhadap fasilitas kesehatan dan sindikat klaim berulang.
- Penerbitan Berita Acara Rekonsiliasi resmi untuk penyelesaian sengketa klaim.

## Capabilities and Constraints

- 15 modul analitik fungsional: Executive Hub, Triage Overview, Fraud Forensics, DPJP Velocity, Geovelocity Map, Bipartite Graph, Audit Ledger, D3FEND & MITRE Frameworks, WBS Whistleblower, Post-Healthkathon Suite, Interventions, Settings, dan Database Viewer.
- Engine backend FastAPI terdistribusi dengan pemrosesan kolumnar terakselerasi.
- Antarmuka frontend React 19 + Vite + Tailwind CSS dengan transisi mikro interaktif.
- Zero-PHI: Data identitas pasien terlindungi penuh melalui enkripsi hash satu arah.
- Pantang data fiktif atau klaim bombastis: Seluruh formula matematis diverifikasi oleh 113 automated unit & integration tests.

## Brand Commitments

- Nama resmi: ClaimTrace JKN.
- Identitas visual: Clean White Enterprise (Slate 50 canvas, pure white elevation, Sky 600/700 brand accents, Emerald/Amber/Rose state indicators).
- Tipografi: Inter untuk teks fungsional dan JetBrains Mono untuk metadata, hash SHA-256, dan kode ICD-10/INA-CBG.
- Bahasa: Bahasa Indonesia baku berorientasi institusional perbankan dan kesehatan.
- Larangan: Bebas em-dash, bebas emoji, dan bebas motif AI generik (neon glow gelap, blob partikel, kartu bertingkat acak).

## Evidence on Hand

- Basis hukum operasional: UU No. 27/2022 tentang Perlindungan Data Pribadi, Perpres No. 82/2018 tentang Jaminan Kesehatan, dan Permenkes No. 26/2021 tentang Pencegahan Fraud JKN.
- Test suite: 113 unit dan integration test (`pytest tests/`) berstatus 100% lulus.
- Knowledge graph arsitektur: 474 node, 491 edge, 6 layer hierarki, dan 7 langkah onboarding interaktif.

## Product Principles

1. Explainable & Legally Defensible: Setiap rekomendasi dan skor risiko wajib memiliki dasar alasan hukum dan klinis yang jelas.
2. Zero-PHI by Design: Integritas privasi peserta JKN adalah harga mati; tidak ada kebocoran data medis mentah ke lapisan antarmuka.
3. High-Density Usability: Informasi audit disajikan padat, presisi, dan mudah dipindai oleh auditor medis profesional tanpa kelelahan visual.
4. Deterministic & Reproducible: Hasil audit klaim pada input yang sama selalu menghasilkan skor, jalur triage, dan hash verifikasi yang identik.

## Accessibility & Inclusion

- Kepatuhan standar WCAG 2.2 AA (rasio kontras minimum 4.5:1 untuk teks normal).
- Dukungan navigasi keyboard penuh di seluruh tabel, filter, dan dialog modal.
- Indikator status ganda (warna disertai label teks eksplisit dan kode status) untuk keterbacaan pengguna dengan keterbatasan penglihatan warna.
