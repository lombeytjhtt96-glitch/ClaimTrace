# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Auditor Medis BPJS Kesehatan, Verifikator Klaim Kantor Cabang (KC), Tim Audit Investigasi Kantor Pusat, dan Manajemen Eksekutif Dewan Direksi BPJS Kesehatan.

## Product Purpose

ClaimTrace JKN adalah Sistem Pendukung Keputusan (*Decision Support System* / DSS) pra-bayar yang berfokus pada **1 tujuan tunggal: pengendalian kecurangan (*anti-fraud*) klaim FKRTL** -- khususnya #6 *Phantom Billing*, #11 *Repeat/Split Billing*, dan *Upcoding* -- sebelum pencairan kas Dana Jaminan Sosial (DJS) dalam batas SLA 10 hari kerja.

## Positioning

Solusi penapisan klaim anomali pra-bayar berbasis **Fusi Deterministik 3 Lapis (`S = 0,50*S1 + 0,30*S2 + 0,20*S3` pada skala `0 - 100`: Hijau `0-49,9`, Kuning `50,0-74,9`, Merah `75,0-100` + Hard Trigger)** yang dipadukan dengan gudang data DuckDB (`6.264.346` baris dari `1.699.219` klaim FKRTL), ChromaDB semantic matching, rute geovelocity OSRM, arsitektur Zero-PHI (UU PDP 27/2022), dan ledger SHA-256 tahan manipulasi.

## Operating Context

- Penyaringan pra-bayar 4 tahap terhadap FPK masuk FKRTL sebelum penerbitan Berita Acara.
- Audit anomali klaim ganda hari sama (`4.876` pasang), lonjakan klaster (`>= 3,0x`), SIP DPJP & geovelocity (`> 120 km/jam`), dan konfirmasi peserta Mobile JKN.
- Eksekusi putusan Human-in-the-Loop dan penerbitan Berita Acara Klarifikasi Bersama (BAKB) SHA-256.

## Capabilities and Constraints

- Kokpit terfokus dalam 3 alur pengendalian fraud inti (Ringkasan Fraud & DuckDB SQL, Pipeline & Bedah Saring Klaim 4-Tahap, dan Konsol Putusan/BAKB/Ledger), dilengkapi simulasi Dual View Mobile JKN.
- Engine backend FastAPI terintegrasi DuckDB OLAP SIMD (`6.264.346` baris), Scikit-Learn Isolation Forest, ChromaDB MiniLM, dan OSRM geovelocity.
- Antarmuka frontend React 18 + Vite + Tailwind CSS dengan SWR cache dan navigasi terpusat pada pengendalian kecurangan.
- Zero-PHI: Data identitas pasien terlindungi penuh sesuai Pasal 34 UU PDP No. 27/2022.
- Terverifikasi oleh `244` uji backend (`backend/tests/`) dan `112` uji E2E (`tests_e2e/`).

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
