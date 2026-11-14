---
name: Clinical Forensic Command
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bccabc'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#879487'
  outline-variant: '#3d4a3f'
  surface-tint: '#5bdf8c'
  primary: '#5bdf8c'
  on-primary: '#00391b'
  primary-container: '#02a65a'
  on-primary-container: '#003116'
  inverse-primary: '#006d39'
  secondary: '#96ccff'
  on-secondary: '#003353'
  secondary-container: '#2b97e1'
  on-secondary-container: '#002c48'
  tertiary: '#9acee8'
  on-tertiary: '#003547'
  tertiary-container: '#6597b0'
  on-tertiary-container: '#002e3e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#79fca5'
  primary-fixed-dim: '#5bdf8c'
  on-primary-fixed: '#00210d'
  on-primary-fixed-variant: '#00522a'
  secondary-fixed: '#cee5ff'
  secondary-fixed-dim: '#96ccff'
  on-secondary-fixed: '#001d32'
  on-secondary-fixed-variant: '#004a75'
  tertiary-fixed: '#bfe9ff'
  tertiary-fixed-dim: '#9acee8'
  on-tertiary-fixed: '#001f2a'
  on-tertiary-fixed-variant: '#104c63'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '900'
    lineHeight: 40px
    letterSpacing: -0.025em
  display-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.015em
  title-sm:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
  body-base:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-dense:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 15px
  body-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-caps:
    fontFamily: Montserrat
    fontSize: 10px
    fontWeight: '800'
    lineHeight: 14px
    letterSpacing: 0.08em
  mono-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
  mono-hash:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-mobile: 0.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system delivers an authoritative, high-density Enterprise Command Center and synced mobile companion for national healthcare pre-payment fraud triage. Rooted in clinical rigor, financial governance, and forensic accountability, the aesthetic rejects superficial decoration in favor of surgical precision, instant readability, and zero alert-fatigue. 

The style marries **High-Density Enterprise Dark UI** with **Clinical Skeuomorphic / Cryptographic Assurance**:
- **Enterprise Dark Slate Foundation:** Surfaces are steeped in slate-950 (`#020617`) and slate-900 (`#0F172A`), providing an anti-glare canvas for adjudicators performing sustained, multi-hour claim inspections.
- **Authoritative National Identity:** The system integrates BPJS institutional greens and telemetry blues into a disciplined status hierarchy.
- **Three-Tier Semantic Risk Lanes:** Rather than scattering high-friction red warnings, the interface categorizes all claim volumes into strict, low-cognitive-load semantic channels: Green (Fast-Track Legitimate), Yellow (Clarification Required), and Red (Audit Freeze Priority).
- **Dual-Pane Synchronous Verification:** Split-sync visual cues bridge desktop audit desks with citizen mobile endpoints, rendering real-time push confirmations, tamper-evident SHA-256 seals, and biometric timestamps with unequivocal transparency.

## Colors

The color palette is calibrated for high information density, WCAG AAA contrast, and immediate cognitive segregation between operational channels, telemetry, and forensic alerts.

### Core Canvas & Surfaces
- **Canvas / Root Background (`#020617`):** Base slate-950 foundation. Absorbs harsh display emissions and frames clinical data modules.
- **Card & Surface (`#0F172A`):** Slate-900 primary container color for dossier records, queue feeds, and inspector panes.
- **Nested Surface & Table Rows (`#1E293B`):** Slate-800 for nested inspect cards, table headers, hover states, and input field backgrounds.
- **Structural Borders (`#1E293B` and `#334155`):** Razor-thin structural divisions establishing clear cell and card definitions without visual weight.

### Institutional Brand Tokens
- **Core BPJS Green (`#01A65A`):** The primary identity anchor. Used for primary execution CTAs, verified patient identity elements, KIS digital cards, and positive validations.
- **BPJS Dark Green (`#008D4C`):** Hover, active, and gradient anchor for green interaction targets.
- **BPJS Blue (`#0288D1`):** Telemetry, live WebSocket sync indicators, biometric data streaming, and patient push notifications.
- **BPJS Deep Navy (`#0C4A60`):** Authoritative supervisory ribbons, command center mastheads, and high-level institutional headers.

### Three-Tier Semantic Triage System
- **Green Lane (Fast-Track Legitimate | Score < 50):**
  - Surface: `#064E3B` | Accent & Text: `#34D399` | Border: `#059669`
  - Applied to verified claims matching normative clinical profiles, standard lengths of stay, and correct INA-CBG tariffs.
- **Yellow Lane (Clarification Required | Score 50–74):**
  - Surface: `#78350F` | Accent & Text: `#FBBF24` | Border: `#D97706`
  - Applied to unbundling queries, atypical dosage patterns, or minor procedure deviations triggering patient or hospital coder clarification.
- **Red Lane (High-Risk Audit Priority | Score ≥ 75 or Hard Trigger):**
  - Surface: `#881337` | Accent & Text: `#FB7185` | Border: `#E11D48`
  - Reserved strictly for hard fraud signatures: phantom billing, upcoding, duplicate claim hashes, and deceased participant abuse.

### Cryptographic & Telemetry Tokens
- **Audit Stamp Container:** Surface `#0B1E28`, Border `#0288D1`, Text `#38BDF8`.
- **Focus Ring (`#38BDF8`):** Uncompromising 3:1 contrast focus outline for complete keyboard accessibility across all dark containers.

## Typography

The typography strategy leverages three purposeful font families to handle high data density without cognitive strain:
1. **Headings & Command Metrics (`Montserrat`):** Provides structural authority, punchy uppercase labeling, and anchor KPI values.
2. **Clinical Prose & Body Records (`Inter`):** Renders hospital admission notes, doctor discharge summaries, and auditor annotations with maximum legibility at sub-14px sizes.
3. **Forensic Identifiers & Tabular Figures (`JetBrains Mono`):** Dedicated to 13-digit KIS IDs, ICD-10/ICD-9-CM diagnostic codes, INA-CBG financial tariffs, and cryptographic SHA-256 ledger proof hashes.

### Rules of Alignment and Numerics
- All currency values (`Rp 48.720.500`), scores (`0–100`), and timestamps require monospace tabular numerals (`font-variant-numeric: tabular-nums`) and strict right alignment.
- Table column headers utilize `label-caps` in uppercase styling with deliberate tracking (`0.08em`) to demarcate data categories.
- Long diagnostic descriptions in `body-dense` or `body-base` maintain fixed line heights to prevent row height jitter during live queue streaming.

## Layout & Spacing

This design system uses a compact, disciplined 4px baseline rhythm (`0.25rem`) optimized for data-dense clinical interfaces where minimizing vertical scroll distance saves critical audit seconds.

### Layout Philosophy
- **Enterprise Command Center (Desktop):** A Tri-Panel Split Architecture conforming to a fluid grid:
  1. *Faceted Filter Rail (320px fixed width):* Multi-select triage lanes, fraud score range slider, faskes tier, ICD-10 clusters.
  2. *Live Triage Queue (Fluid 55% width):* Super-dense data grid (32px row heights) enabling rapid keyboard navigation (`J`/`K` navigation, `A` approve, `F` freeze).
  3. *Claim Inspector Dossier (Fluid 45% width):* Split side-by-side comparison of hospital claims vs. Mobile JKN patient confirmations and SHA-256 audit stamps.
- **Mobile JKN Companion (Mobile):** Single-column fluid stack with strict 16px (`1rem`) outer margins and touch targets conforming to a 48px baseline.

### Spacing Scale
- `space-xs` (4px): Micro-gaps between status badges, code chips, and pill icons.
- `space-sm` (8px): Gaps between paired metadata fields and input field interior vertical paddings.
- `space-md` (12px): Standard column gutter and internal card padding in high-density tables.
- `space-lg` (16px): Outer dossier card padding, module separations, and modal borders.
- `space-xl` (24px): Primary workstation panel gutters and page margins.

## Elevation & Depth

Visual hierarchy relies on **structural tonal layering and razor hairline outlines**, deliberately avoiding generic drop shadows that cause visual blur across dark canvases.

### Tonal Hierarchy
- **Canvas Base (`#020617`):** The ground floor holding navigation frames and structural panels.
- **Surface Elevation 1 (`#0F172A`):** Triage record cards, detail inspectors, and Mobile JKN bottom sheets.
- **Surface Elevation 2 (`#1E293B`):** Data table headers, active selected rows, input fields, and nested audit logs.
- **Surface Elevation 3 (`#0C4A60` / Navy):** Global session headers and status bar mastheads.

### Outlines & Borders
- All containers use crisp 1px borders (`#1E293B` or `#334155`).
- Triage priority cards feature an assertive 4px left-hand border accent representing lane severity (`#34D399`, `#FBBF24`, or `#E11D48`).

### Ambient Glows & Telemetry Halos
- Shadows are reserved strictly for active telemetry states. An active clarification prompt emits a soft cyan ambient pulse (`box-shadow: 0 0 12px rgba(2, 136, 209, 0.35)`).
- Critical audit freeze locks feature a focused rose highlight (`box-shadow: 0 0 12px rgba(225, 29, 72, 0.4)`).

## Shapes

The design system enforces a **Soft (Level 1)** geometric standard. Industrial, clinical, and data-dense tools demand compact corner radii to preserve interior pixel area for high-density tables and micro-badges.

- **Base Controls & Inputs (`rounded-sm` / 4px):** Applied to buttons, form inputs, table rows, and standard data cards.
- **Micro-Badges & Audit Seals (`rounded-xs` / 2px):** Applied to ICD-10 tags, cryptographic hash blocks, and triage lane pills.
- **Modal Sheets & Dossier Panes (`rounded-md` / 6px):** Used for elevated inspection dialogs and Mobile JKN summary cards.
- **Digital KIS Card:** Uses an 8px radius (`rounded-lg`) matching standard physical ISO identity card proportions.

## Components

### Buttons & Quick Triage Triggers
- **Fast-Track Approve Button (Green Lane):**
  - Background `#01A65A`, hover `#008D4C`, text `#FFFFFF`, radius 4px, font `Montserrat` 12px Bold.
  - Accompanied by shortcut tag `[A]` and verification badge (`[TERVERIFIKASI]`).
- **Request Clarification Button (Yellow Lane):**
  - Border 1px solid `#D97706`, background `rgba(120, 53, 15, 0.25)`, text `#FBBF24`, radius 4px.
  - Triggers push notification sync directly to the patient's Mobile JKN app.
- **Audit Freeze / Hard Stop (Red Lane):**
  - Background `#E11D48`, hover `#BE123C`, text `#FFFFFF`, border 1px solid `#FB7185`.
  - Applies immediate pre-payment lock, issues an immutable cryptographic hold memo, and marks the claim for forensic referral.

### Chips & Semantic Micro-Badges
- **Triage Lane Indicators:** Fixed-width center-aligned pills (e.g., `FAST-TRACK`, `CLARIFY`, `AUDIT-HOLD`). Height 20px, font `Montserrat` 10px ExtraBold (`label-caps`).
- **Diagnostic ICD Chips:** Monospace `JetBrains Mono` 11px tags with slate-800 background and slate-400 text (e.g., `ICD-10: I21.9`).
- **Fraud Signature Flags:** Micro-tags rendered beneath claim numbers for rapid scanning (e.g., `[UPCODE]`, `[PHANTOM]`, `[UNBUNDLE]`).

### Data Tables & High-Density Feeds
- **Queue Row Heights:** Strictly 32px for compact queue mode; 40px for detailed audit mode.
- **Header Formatting:** Slate-800 background, 1px bottom border (`#334155`), `label-caps` uppercase text in Slate-400.
- **Hover & Selected State:** Hover triggers `#1E293B`; selected active row renders a 2px left border matching its triage lane color.

### Checkboxes & Selection Controls
- Base container `#0F172A`, border 1px solid `#334155`, corner radius 2px.
- Checked state uses `#01A65A` with a crisp white tick. Focused state deploys a `#38BDF8` 2px ring.

### Input Fields & Filter Rails
- Background `#1E293B`, border 1px solid `#334155`, text `#F8FAFC`.
- Focus state shifts border to `#0288D1` with zero interior glow, preserving sharp boundary lines.

### Cryptographic Audit Stamp
- Container with `#0B1E28` surface, 1px solid `#0288D1` (40% opacity), and 2px border-radius.
- Contains padlock icon, SHA-256 truncated hash (`0x7f8a...3c21`), WIB timestamp, and verifier NIP code in `JetBrains Mono` 10px. Tamper-evident tooltip reveals verifiable blockchain proof.

### Mobile JKN Companion Primitives
- **Digital KIS Identity Card:** 16:9 ratio, gradient from `#01A65A` into `#008D4C`, embossed chip motif, masked 13-digit KIS ID in `JetBrains Mono` (`0001 8293 4810 2`), and quick-toggle barcode for clinic admission.
- **Anti-Phantom Patient Prompt Card:** Slate-900 surface with `#0288D1` border. Displays clinical question (*"Did you receive hemodialysis on 14 Oct at RSUD Fatmawati?"*) with binary verification triggers: *"Yes, Confirmed"* (`#01A65A`) vs *"No, Never Received"* (`#E11D48`).