---
name: ClaimTrace BPJS Healthcare Clean
slug: bpjs-healthcare-clean
theme: full-light
colors:
  primary: "#007A33"        # BPJS Kesehatan Emerald Green
  secondary: "#0C5CAB"      # Enterprise Trust Sapphire Blue
  surface: "#FFFFFF"        # Pure Crisp White Card Surface
  background: "#F8FAFC"     # Slate 50 Neutral Bright Canvas
  border: "#E2E8F0"         # Slate 200 Crisp Contrast Border
  text: "#0F172A"           # Slate 900 High-Legibility Primary Text
  text-muted: "#475569"     # Slate 600 Secondary Label Text
  success: "#16A34A"        # Green 600 - Jalur Hijau (Auto-Approve)
  warning: "#D97706"        # Amber 600 - Jalur Kuning (Klarifikasi RS)
  danger: "#DC2626"         # Red 600 - Jalur Merah (Audit Medis Lapangan)
typography:
  display:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "1.75rem"
    weight: "700"
  h1:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "1.5rem"
    weight: "700"
  h2:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "1.25rem"
    weight: "600"
  body-md:
    fontFamily: "Inter, Roboto, system-ui, sans-serif"
    fontSize: "0.875rem"
    lineHeight: "1.5"
    weight: "400"
  label-caps:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    letterSpacing: "0.05em"
    weight: "600"
  sourceScale: "11/12/14/16/20/24/32"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  baseline: "8pt baseline grid"
  scale: "4/8/12/16/20/24/32/48"
accessibility:
  wcag: "WCAG 2.2 AA (minimum 4.5:1 text contrast, verified 9.5:1 to 15.2:1)"
  touchTarget: "minimum 44x44px for all interactive elements"
  keyboard: "Visible 2px focus ring with 2px offset (ring-emerald-500)"
---

# ClaimTrace Design System Companion (DESIGN.md)

> Built according to the [awesome-design-skills](https://github.com/bergside/awesome-design-skills) standard and paired with [anti-slop](https://github.com/miqdadbadjuber/anti-slop).

## 1. Design Overview & Intent
ClaimTrace is a mission-critical pre-payment decision support system for BPJS Kesehatan claim verifiers (Verifikator Vedika). In accordance with verifier clinical ergonomics and the strict user mandate (**"Full Terang Semua" / 100% Light Theme**), the interface prioritizes:
- **Zero Eye Fatigue in Daylight**: Pure crisp white surfaces (`#FFFFFF`) over a light neutral slate background (`#F8FAFC`), eliminating low-contrast dark grays.
- **Clinical Data Density**: Tabular clarity, compact badges, and distinct color-coded triage lanes without decorative distractions.
- **Zero Slop**: Rejects unmotivated gradients, floating blur orbs, and generic card padding in strict compliance with `antislop.md`.

---

## 2. Color Palette & Semantic Tokens (Full Light)

| Token | Hex Value | Usage & Meaning | WCAG AA Ratio vs `#FFFFFF` |
|:---|:---|:---|:---:|
| `brand-bpjs` | `#007A33` | BPJS Kesehatan Official Green | **5.4 : 1** (Pass) |
| `brand-trust` | `#0C5CAB` | Enterprise Authority Blue | **6.1 : 1** (Pass) |
| `surface` | `#FFFFFF` | Primary Card & Table Surface | — |
| `background` | `#F8FAFC` | App Background (Slate-50) | — |
| `text-primary` | `#0F172A` | Slate-900 Primary Content | **15.2 : 1** (Pass AAA) |
| `text-secondary` | `#475569` | Slate-600 Supporting Context | **7.0 : 1** (Pass) |
| `border-subtle` | `#E2E8F0` | Slate-200 Crisp Card Borders | High legibility |
| `lane-red` | `#DC2626` / `#FEE2E2` | Jalur Merah (Audit Medis Lapangan) | Solid crimson on soft red |
| `lane-yellow` | `#D97706` / `#FEF3C7` | Jalur Kuning (Klarifikasi RS / Feedback) | Deep amber on light yellow |
| `lane-green` | `#16A34A` / `#DCFCE7` | Jalur Hijau (Auto-Approve Pre-Payment) | Forest green on soft mint |

---

## 3. Component Design Rules

### A. Triage Queue (Daftar Antrean Triase)
- **Compact Data Rows**: Tabular layout with zebra-hover (`hover:bg-slate-50`), bold SEP IDs, and patient anonymized identifiers (`P-882193-JKN`).
- **Lane Badges**: Solid pill badges with clear status borders and dark saturated badge text (never low-contrast pastel text).
- **SLA Countdown**: Monospace countdown tag indicating remaining days before Vedika 10-day statutory deadline (Perpres 82/2018).

### B. Case Dossier (Detail Kasus & Bukti)
- **Modular Cards**: White background, 1px solid slate-200 border, rounded-lg (8px), no heavy drop shadows.
- **Signal Breakdown Cards**: Explicit breakdown of $S_1$ (Klinis), $S_2$ (Digital/SATUSEHAT), and $S_3$ (Validasi Peserta Mobile JKN).
- **Timeline & Fingerprint Graph**: Clean light SVG canvas with slate gridlines, emerald nodes for verified events, and amber/red flags for clinical anomalies.

### C. Verifier Action Controls (Panel Keputusan)
- **Touch Target**: Every button must measure at least `min-h-[44px]` with `px-4 py-2.5`.
- **Primary Action (Approve)**: Solid BPJS Green (`bg-emerald-600 text-white hover:bg-emerald-700`).
- **Clarification Action**: Solid Warning Amber (`bg-amber-600 text-white hover:bg-amber-700`).
- **Audit Action**: Solid Alert Red (`bg-rose-600 text-white hover:bg-rose-700`).
- **Focus Rings**: `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600`.

---

## 4. Typography Hierarchy (8pt Baseline)
- **Display / Headers**: Poppins or system sans-serif, bold, tight tracking.
- **Data / Codes**: Monospace (`ui-monospace, SFMono-Regular, Menlo`), bold, used for ICD-10 (`I50.9`), INA-CBG (`I-4-10-I`), and SEP IDs.
- **Body & Notes**: Inter / Roboto, 14px (`text-sm`), line-height 1.5, slate-700 (`#334155`).

---

## 5. Maintenance & Quality Gates
- Every new component must be checked against `antislop.md` (R-01 to R-38).
- Every background must remain in the **Full Light Theme** family (`#FFFFFF`, `#F8FAFC`, `#F1F5F9`). Dark surfaces are strictly prohibited unless specifically switched via user toggle.
- Color contrast must be verified with minimum 4.5:1 for body copy and 3.0:1 for large graphical elements.

---

## 6. Modal Systems & RPA Automation UX (Full Light)
- **Modal Containers**: `bg-white border border-slate-300 rounded-2xl shadow-2xl`, with dark overlay scrim (`bg-slate-900/60 backdrop-blur-xs`) for focus isolation.
- **Tabbed Sub-navigation**: High-contrast active indicators with border-b-2 and soft tinted background (`bg-cyan-50/50 text-cyan-700` or `bg-indigo-50/50 text-indigo-700` or `bg-emerald-50/50 text-emerald-700`).
- **Interactive Robot Progress Cards**: Status transitions from neutral slate (`PENDING`), active pulsing cyan (`RUNNING`), to crisp emerald green checkmarks (`COMPLETED`).
- **Code & Cypher Blocks**: Dark terminal background (`bg-slate-900 border border-slate-800 text-slate-100`) strictly confined within code containers, while container parent surfaces remain 100% full light theme.

---

## 7. Vector Semantic Heatmap & Plagiarism Display (ChromaDB Integration)
- **Pairwise $N \times N$ Heatmap Matrix**:
  - High-density comparative matrix rendering similarity between clinical discharge texts across patient claims within an admission cluster:
    - **Kloning Kritis ($\ge 90.0\%$):** Merah Tegas (`bg-red-500 text-white font-extrabold`) — Membuktikan fabrikasi berkas baksos fiktif (#6 Phantom Billing).
    - **Parafrase Curiga ($70.0\% - 89.9\%$):** Kuning Lembut (`bg-amber-100 text-amber-900 font-bold`).
    - **Variasi Klinis Alami ($< 70.0\%$):** Hijau Lembut (`bg-emerald-50 text-emerald-800 font-bold`) — Membuktikan catatan medis independen dan sah.
- **Live Vector Search Feedback**: Real-time textarea input dengan indikator jumlah karakter dan tombol eksekusi vektor berkecepatan sub-milidetik.
- **Strict Compliance**: Menolak visualisasi neon gelap atau efek blur tak beralasan, tetap berorientasi pada ergonomi verifikator medis BPJS Kesehatan.

---

## 8. Columnar OLAP Analytics & SQL Console Design (DuckDB MCP)
- **Interactive SQL Workstation**:
  - Full Light Theme canvas dengan tab navigasi aktif beraksen warna kuning/amber khas DuckDB (`border-amber-600 text-amber-700 bg-amber-50/40`).
  - Dark Code Container terisolasi (`bg-slate-900 text-emerald-400 font-mono`) untuk penulisan kueri SQL analitik berpresisi tinggi.
  - Tabular Results Table: Zebra-hover dengan badge triase bersaturasi tegas (Merah, Kuning, Hijau) dan format mata uang Rupiah (`Rp 15.300.000`).
- **Published Tools Parameter Controls**:
  - Slider dan input numerik terikat label WCAG dengan batas minimum/maksimum yang tervalidasi.
  - Kartu ringkasan keluaran JSON berformat rapi (*indented*) dengan tombol salin cepat (*one-click clipboard copy*).



