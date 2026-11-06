---
name: ClaimTrace JKN
description: Sistem Pendukung Keputusan Deteksi Fraud dan Rekonsiliasi Klaim BPJS Kesehatan
colors:
  primary: "#0284c7"
  primary-hover: "#0369a1"
  surface-canvas: "#f8fafc"
  surface-card: "#ffffff"
  text-primary: "#0f172a"
  text-secondary: "#334155"
  text-muted: "#475569"
  status-normal: "#059669"
  status-warning: "#b45309"
  status-danger: "#b91c1c"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  mono:
    fontFamily: "JetBrains Mono, SF Mono, Monaco, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.lg}"
    padding: "20px"
  badge-normal:
    backgroundColor: "#ecfdf5"
    textColor: "{colors.status-normal}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
---

# ClaimTrace JKN - Design Direction

Dial: ENERGY 2 / RHYTHM 3 / MOTION 2

## Overview

ClaimTrace JKN adalah antarmuka audit institusional berkepadatan tinggi yang dirancang khusus untuk verifikator klaim, auditor medis, dan pimpinan BPJS Kesehatan. Pendekatan desain mengusung prinsip Clean White Enterprise: faktual, presisi, tenang, dan bebas dari ornamen kosmetik AI yang mengganggu konsentrasi analisis data klinis.

## Colors

- **Canvas Base**: `#f8fafc` (Slate 50) sebagai kanvas latar belakang netral dengan pencahayaan seimbang.
- **Card Surface**: `#ffffff` (Pure White) sebagai elevasi utama modul analisis dan kartu metrik.
- **Text Primary**: `#0f172a` (Slate 900), rasio kontras 15.6:1 terhadap putih (melampaui WCAG AAA).
- **Text Secondary / Subheadings**: `#334155` (Slate 700), rasio kontras 9.2:1 (melampaui WCAG AAA).
- **Text Muted / Meta Labels**: `#475569` (Slate 600), rasio kontras 5.9:1 (memenuhi WCAG AA).
- **Brand Accents**: `#0284c7` (Sky 600) dan `#0369a1` (Sky 700) untuk aksi utama dan identitas sistem.
- **State Indicators**:
  - Normal / Lolos Validasi: `#059669` (Emerald 600) teks pada `#ecfdf5` (Emerald 50).
  - Triage / Perhatian Khusus: `#b45309` (Amber 700) teks pada `#fffbeb` (Amber 50).
  - Anomali Tinggi / Dugaan Fraud: `#b91c1c` (Red 700) teks pada `#fef2f2` (Red 50).

## Typography

- **Primary Font**: `Inter`, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif untuk seluruh teks fungsional UI.
- **Forensic & Data Code Font**: `JetBrains Mono`, "SF Mono", Monaco, Consolas, monospace untuk Nomor SEP, NIK terenkripsi, Kode INA-CBG, ICD-10, Nilai Klaim Rupiah, dan Hash SHA-256.
- **Hierarchy & Scale**:
  - H1 Display: 2rem (32px), bold, tracking-tight.
  - H2 Section: 1.5rem (24px), semibold, text-slate-900.
  - H3 Card Title: 1.125rem (18px), semibold, text-slate-800.
  - Body Text: 0.875rem (14px), regular, leading-relaxed.
  - Table Cell & Functional Labels: 0.75rem (12px) hingga 0.8125rem (13px), medium.
  - Floor Batas Keterbacaan: Teks fungsional tidak boleh berada di bawah 11px.

## Layout

- **Modular Grid**: Grid responsif 12 kolom untuk dashboard analitik dengan celah standar 16px hingga 24px.
- **Baseline Spacing System**: Token kelipatan 8pt (4px, 8px, 16px, 24px, 32px, 48px).
- **Density Control**: Komponen cockpit memprioritaskan densitas informasi tinggi tanpa mengorbankan ruang nafas pembacaan.

## Elevation & Depth

- **Tonal Layering**: Pemisahan hierarki visual mengutamakan kontras warna latar belakang dan garis batas tegas (`border-slate-200`) dibanding bayangan berlebihan.
- **Elevation Steps**:
  - Base: Flat canvas `#f8fafc`.
  - Level 1 (Card/Table): `bg-white`, `border border-slate-200`, `shadow-xs`.
  - Level 2 (Hover/Active Card): `shadow-sm`, `border-slate-300`.
  - Level 3 (Dropdown/Flyout): `shadow-md`, `border-slate-200/80`.
  - Level 4 (Modal/Drawer): `shadow-xl`, backdrop blur 8px.

## Shapes

- **Border Radius**:
  - Tombol dan Input: `rounded-lg` (8px).
  - Kartu Metrik dan Panel: `rounded-2xl` (16px).
  - Badges dan Status Pills: `rounded-full` (9999px).
- **Container Geometry**: Sudut lengkung terukur tanpa distorsi bentuk organik tak beraturan.

## Components

- **Audit Cards**: Kartu analitik seragam dengan padding 20px, judul terdefinisi jelas, dan badge status di pojok kanan atas.
- **Forensic Tables**: Baris tabel berdensitas tinggi dengan zebra striping lembut, header tetap (sticky header), dan seleksi baris interaktif.
- **Filter Controls**: Multi-select dropdown, date range picker, dan status tabs dengan feedback visual instan.
- **Action Buttons**: Tombol aksi primer berkontras tinggi dengan feedback status hover, focus ring terlihat jelas untuk aksesibilitas keyboard, dan status loading transparan.

## Do's and Don'ts

### Do's
- Gunakan data faktual berbasis regulasi RI (UU PDP 27/2022, Perpres 82/2018, Permenkes 26/2021).
- Terapkan kontras warna minimum 4.5:1 untuk seluruh teks fungsional.
- Sediakan indikator status ganda (warna disertai label teks eksplisit).
- Berikan loading skeleton dan empty state yang informatif di setiap tampilan data.

### Don'ts
- Dilarang keras menggunakan em dash (`—`) dalam teks UI; gunakan koma, titik dua, tanda kurung, atau titik.
- Dilarang menggunakan estetika AI generik seperti latar gelap bercahaya neon ungu/sian, partikel acak, atau kartu bertingkat di dalam kartu.
- Dilarang menggunakan font fungsional di bawah 11px.
- Dilarang membuat tombol navigasi palsu atau dead link tanpa aksi nyata.
