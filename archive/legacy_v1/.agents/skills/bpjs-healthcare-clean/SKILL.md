---
name: bpjs-healthcare-clean
description: Clean, high-density full-light healthcare enterprise design system for BPJS Kesehatan claim verification dashboards.
license: MIT
metadata:
  author: TINEERENSE
---

<!-- TYPEUI_SH_MANAGED_START -->
# BPJS Healthcare Clean Design System Skill

## Mission
You are an expert healthcare enterprise design-system guideline author and implementer for ClaimTrace.
Create practical, production-ready frontend components for Indonesian BPJS Kesehatan claim verification with a 100% full-light aesthetic, zero visual clutter, and strict compliance with `antislop.md`.

## Brand
Official, authoritative, clinical, and transparent. Designed specifically for BPJS Kesehatan Verifikator Vedika who inspect complex multi-signal hospital claims across an 8-hour workday without visual fatigue.

## Style Foundations
- **Visual Style**: Clean, modern, high-contrast, full-light enterprise healthcare aesthetic. Crisp white cards (`#FFFFFF`) on light slate canvas (`#F8FAFC`). Zero floating blur orbs, zero rainbow gradients.
- **Typography Scale**: 11 / 12 / 14 / 16 / 20 / 24 / 32
  - Primary / Headers: `Poppins, system-ui, sans-serif` (600, 700)
  - Body Copy: `Inter, Roboto, system-ui, sans-serif` (400, 500)
  - Medical / Technical Codes: `ui-monospace, SFMono-Regular, Menlo, monospace` (ICD-10, INA-CBG, SEP)
- **Color Palette (100% Full Light Theme)**:
  - `primary`: `#007A33` (BPJS Official Emerald Green)
  - `secondary`: `#0C5CAB` (Enterprise Trust Blue)
  - `surface`: `#FFFFFF` (Card & Table Surface)
  - `background`: `#F8FAFC` (App Canvas Slate-50)
  - `border`: `#E2E8F0` (Card Border Slate-200)
  - `text`: `#0F172A` (High-Legibility Slate-900)
  - `text-muted`: `#475569` (Slate-600)
  - `success / Jalur Hijau`: `#16A34A` text on `#DCFCE7` background, border `#86EFAC`
  - `warning / Jalur Kuning`: `#D97706` text on `#FEF3C7` background, border `#FDE68A`
  - `danger / Jalur Merah`: `#DC2626` text on `#FEE2E2` background, border `#FECACA`
- **Spacing Scale**: 8pt baseline grid (`4px / 8px / 12px / 16px / 24px / 32px / 48px`).

## Accessibility Constraints
- **WCAG 2.2 AA**: All text elements must exceed 4.5:1 contrast (Slate-900 on White achieves 15.2:1).
- **Touch Target**: Interactive buttons, tabs, and filters must meet a minimum dimension of `44x44px` (`min-h-[44px]`).
- **Focus States**: High-visibility 2px focus ring with 2px offset (`focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2`).
- **Semantic Structure**: Proper `<h1>`, `<header>`, `<main>`, `<section>`, and `<button>` elements.

## Writing Tone & Terminology
- Indonesian statutory terms: BPJS Kesehatan, Vedika (Verifikasi Digital Klaim), SEP (Surat Eligibilitas Peserta), INA-CBG, ICD-10, ICD-9-CM, SATUSEHAT SDMK, Perpres 82/2018, UU PDP No. 27/2022.
- Precise, objective, evidence-based descriptions. Zero marketing fluff.

## Rules: Do
- Keep all surfaces bright, crisp, and high-contrast (`#FFFFFF` surfaces, `#F8FAFC` background).
- Pair with `antislop.md` to prune AI clichés and preserve purposeful layout rhythm.
- Display mathematical confidence intervals and formulas ($S = 0.5 \cdot S_1 + 0.3 \cdot S_2 + 0.2 \cdot S_3$) clearly.
- Render medical codes in monospace fonts for rapid scanning.
- Highlight Vedika 10-day statutory SLA countdown clearly on every claim row.

## Rules: Don't
- Never introduce dark-mode card containers or muddy gray background when Full Light Mode is requested.
- Avoid unmotivated CSS gradient backgrounds or decorative blur balls (`blur-3xl`).
- Never set interactive buttons smaller than 44px in height.
- Never use pastel low-contrast text for critical triage status tags.
<!-- TYPEUI_SH_MANAGED_END -->
