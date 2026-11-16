# ClaimTrace JKN Design System Specification (Clinical Precision)

## 1. Visual Thesis & Architecture
ClaimTrace JKN is an institutional pre-payment audit & clinical fraud decision-support cockpit for BPJS Kesehatan FKRTL operations. Its visual language defines **Clinical Precision**:
- **Cool Ink & Layered Elevation**: Deep navy slate ink (`#061B31`) on light neutral sub-surfaces (`#F7F8FA`), separated by crisp structural whites (`#FFFFFF`) and layered micro-shadows (`0 1px 2px rgba(6,27,49,0.05), 0 0 0 1px rgba(6,27,49,0.06)`).
- **Hairline Structural Discipline**: 1px hairline separation instead of heavy boxy fills, razor-sharp typography, restrained radii (`8px` controls, `12px` cards), and zero decorative rainbow top-borders.
- **Obsidian Dark Surfaces**: Stepped dark luminance (`#090B0E` canvas, `#11141A` surface, `#161A22` inset, `rgba(255,255,255,0.08)` hairline border) replacing dated `#000c24`/`#00153A` saturated navy blocks.
- **Tabular Data Discipline**: 8px spacing cadence, tabular numerals (`font-variant-numeric: tabular-nums`), and bare scannable data in dense forensic tables.

## 2. Typography
- **Display & Headings**: `Geist`, `Inter`, system sans-serif (`-0.025em` tracking on H1/H2, weights `500` to `700`). Avoid clumsy `font-black` / `font-extrabold` except compact numeric hero telemetry if needed.
- **Body & UI Controls**: `Inter`, `Geist`, system sans-serif with OpenType features `"cv01"`, `"ss01"`, `"ss03"`.
- **Forensic Codes, Numerals & SEP IDs**: `Geist Mono`, `JetBrains Mono`, monospace (`font-feature-settings: "tnum", "zero"`).
- **Legal Print Documents (BAHV / BAI)**: `IBM Plex Serif`, `Georgia`, serif.

## 3. Color Palette & Surface Hierarchy
### Light Mode (Default Clinical Precision)
- **Canvas**: `#F7F8FA`
- **Primary Surface**: `#FFFFFF`
- **Secondary Sub-Surface / Inset**: `#F3F5F8`
- **Primary Ink**: `#061B31`
- **Secondary Ink**: `#475569`
- **Muted / Metadata Ink**: `#526175`
- **Hairline Border**: `rgba(6, 27, 49, 0.08)` / `#E2E8F0`
- **Primary Accent (Clinical Emerald)**: `#047857` (hover `#065F46`, soft surface `#ECFDF5`)
- **Deep Brand Header Banner (Preserved Anchor)**: `#00134A` with white crisp typography (only inside explicit `.hero-navy-banner` institutional banners).

### Dark Mode (Obsidian Charcoal)
- **Canvas**: `#090B0E`
- **Primary Surface**: `#11141A`
- **Elevated / Interactive Surface**: `#161A22`
- **Primary Ink**: `#F3F5F8`
- **Secondary Ink**: `#9CA3AF`
- **Muted Ink**: `#8B95A5`
- **Hairline Border**: `rgba(255, 255, 255, 0.08)`
- **Primary Accent**: `#10B981` (text `#34D399`, soft surface `rgba(16, 185, 129, 0.12)`)

### Semantic Severity (Restrained, High Signal-to-Noise)
- **Merah / Tunda**: Light `#BE123C` on `#FFF1F2`, Dark `#FB7185`
- **Kuning / Klarifikasi**: Light `#B45309` on `#FFFBEB`, Dark `#FBBF24`
- **Hijau / Lolos**: Light `#047857` on `#ECFDF5`, Dark `#34D399`

## 4. Guardrails & Anti-Slop Rules
- **R-01**: Zero unreasoned gradient bars (no 3px rainbow topbar strips, no colored top stripes on KPI cards).
- **R-02**: Zero em-dashes or en-dashes anywhere in UI strings or tooltips. Use `,`, `:`, `.`, or ASCII `-` cleanly.
- **Anti-Badge-Soup**: Maximum 1 status dot/pill per table row. Render rank indices, IDR amounts, and risk scores as crisp tabular numerals directly on the surface without bordered pill wrappers.
- **Responsive Zero-Overflow**: Zero horizontal overflow (`overflowX: 0`) across `1440px` desktop and `390px` mobile viewports.
