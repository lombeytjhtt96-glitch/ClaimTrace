# ClaimTrace JKN Frontend Architecture & Tokens (`app/DESIGN.md`)

- **Design System**: ClaimTrace Clinical Precision (`Geist` + `Inter` + `Geist Mono` + `IBM Plex Serif`).
- **Light Surface Tokens**: Canvas `#F7F8FA`, Surface `#FFFFFF`, Inset `#F3F5F8`, Ink `#061B31`, Hairline `rgba(6, 27, 49, 0.08)`, Accent `#047857`.
- **Dark Surface Tokens (Obsidian Charcoal)**: Canvas `#090B0E`, Surface `#11141A`, Elevated `#161A22`, Ink `#F3F5F8`, Muted `#9CA3AF`, Hairline `rgba(255, 255, 255, 0.08)`, Accent `#10B981`.
- **Typography Features**:
  - `font-display`: `Geist`, `Inter`, system-ui (`-0.025em` letter-spacing)
  - `font-sans`: `Inter`, `Geist`, system-ui (`"cv01", "ss01", "ss03"`)
  - `font-mono`: `Geist Mono`, `JetBrains Mono`, monospace (`"tnum", "zero"`)
  - `font-serif`: `IBM Plex Serif`, Georgia, serif (BAHV/BAI print layouts)
- **Elevation Model**: Layered micro-shadows in light mode (`0 1px 2px rgba(6,27,49,0.05), 0 0 0 1px rgba(6,27,49,0.06)`) and luminance-stepped hairline cards (`1px solid rgba(255,255,255,0.08)`) in dark mode.
- **Table & Card Hygiene**: Tabular numerals on numeric columns, max 1 status badge per row, zero rainbow accents or 3px colored KPI card top stripes, zero em-dashes or en-dashes in DOM text.
