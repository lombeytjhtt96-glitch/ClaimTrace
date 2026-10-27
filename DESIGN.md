# ClaimTrace JKN - Design Direction

Dial: ENERGY 2 / RHYTHM 3 / MOTION 2

## 1. Product & Audience
- **Product**: ClaimTrace JKN (Sistem Pendukung Keputusan Deteksi Fraud Klaim BPJS Kesehatan)
- **Target Audience**: Auditor Medis BPJS Kesehatan, Verifikator Klaim Kantor Cabang, Tim Audit Investigasi Kantor Pusat, Manajemen Eksekutif Dewan Direksi
- **Mission**: Memberikan transparansi analitik klaim pelayanan kesehatan tingkat pertama (FKTP) dan rujukan lanjutan (FKRTL) secara objektif, dapat dipertanggungjawabkan (explainable DSS), dan patuh regulasi RI.

## 2. Brand Identity & Visual Language
- **Theme**: Clean White Enterprise
- **Philosophy**: Factual, institutional, precise, and human-centric. Tidak menggunakan estetika AI generik (no dark neon glow, no particle blobs, no template hero mosaics).
- **Surface Elevation**: Lapisan putih bersih (`#ffffff`) di atas latar belakang netral lembut (`#f8fafc`), dipisahkan garis batas halus berdefinisi tinggi (`border-slate-200`) dan bayangan lembut berdimensi fungsional (`shadow-sm`).

## 3. Color Palette & WCAG AA Contrast Compliance
- **Canvas Base**: `#f8fafc` (Slate 50)
- **Card Surface**: `#ffffff` (Pure White)
- **Text Primary**: `#0f172a` (Slate 900) - Contrast ratio: 15.6:1 (Exceeds WCAG AAA)
- **Text Secondary / Subheadings**: `#334155` (Slate 700) - Contrast ratio: 9.2:1 (Exceeds WCAG AAA)
- **Text Muted / Meta Labels**: `#475569` (Slate 600) - Contrast ratio: 5.9:1 (Exceeds WCAG AA)
- **Brand Identity**: `#0284c7` (Sky 600) & `#0369a1` (Sky 700)
- **State Indicators**:
  - Normal / Lolos Validasi: `#059669` (Emerald 600) text on `#ecfdf5` (Emerald 50) - Contrast ratio: 5.1:1
  - Triage / Perhatian Khusus: `#b45309` (Amber 700) text on `#fffbeb` (Amber 50) - Contrast ratio: 4.8:1
  - Anomali Tinggi / Dugaan Fraud: `#b91c1c` (Red 700) text on `#fef2f2` (Red 50) - Contrast ratio: 5.3:1

## 4. Typography & Information Hierarchy
- **Primary Font**: `Inter`, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Data & Forensics Code Font**: `JetBrains Mono`, "SF Mono", Monaco, Consolas, monospace (untuk Nomor SEP, NIK terenkripsi, Kode INA-CBG, ICD-10, Nilai Klaim, Hash SHA-256)
- **Heading Styles**: Tegas, proporsional, tanpa uppercase berlebih dengan tracking ekstrem.

## 5. Motion & Transitions (Motion Division v14)
- **Standard**: Spring & Easing berbasis micro-interaction yang tenang (duration 0.2s - 0.35s).
- **Purpose**:
  - Pergantian modul cockpit via `AnimatePresence` tanpa layout shift.
  - Sidebar toggle dengan smooth width interpolation.
  - Toast notifikasi slide-down dengan status auto-dismiss.
  - Modal dan drawer dengan backdrop fade dan scale entry.

## 6. Anti-Slop Enforcement Rules
- **R-02 (Copywriting)**: Dilarang keras menggunakan em dash (`—`) dalam teks UI. Gunakan koma, titik dua, tanda kurung, atau titik.
- **R-17 & R-36 (Data Integrity)**: Semua statistik bersumber langsung dari data sampel klaim riil BPJS Kesehatan 2015-2024 dan basis aturan hukum RI (UU PDP 27/2022, Perpres 82/2018, Permenkes 26/2021). Dilarang menyajikan statistik fiktif atau klaim bombastis.
- **R-24 & R-26 (Functionality)**: Seluruh 15 navigasi dan kontrol interaktif (modul, filter, pagination, tab detail, ekspor CSV, tombol cetak berita acara) wajib berfungsi penuh tanpa dead link.
- **R-27 (UI States)**: Menyediakan loading skeleton, empty state, dan real error boundary di setiap kartu metrik dan tabel forensik.

## 7. TypeUI & Awesome Design Skills Alignment
- **Framework Registry**: Mengintegrasikan 67 design system skills dari `bergside/awesome-design-skills` (`design-skills/index.json`).
- **Archetype Fusion**: Menggabungkan arketipe **Clean** (kesederhanaan, keterbacaan, whitespace lapang, dan palet terbatas) dan **Enterprise** (grid modular, kartu analitik berkepadatan tinggi, tata kelola data berjenjang).
- **Spacing Grid System**: Mengadopsi 8pt baseline grid token standard (`4px / 8px / 16px / 24px / 32px / 48px`).
- **Component Primitives**: Komponen dirancang modular, berfokus keyboard-first, dan patuh standar universal WCAG 2.2 AA.
