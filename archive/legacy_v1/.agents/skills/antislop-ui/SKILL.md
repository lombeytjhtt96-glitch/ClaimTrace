---
name: antislop-ui
description: UI & visual design filter for anti-slop. Rejects unmotivated gradients, floating blur orbs, excessive pill radiuses, and generic card grids. Requires intentional hierarchy, authentic healthcare data visualization, and purpose-driven aesthetics.
---

# antislop-ui (Visual & UI Filter)

## Key Rules
- **No Unmotivated Glows (R-02):** Replace decorative blur orbs and glowing radial blobs with functional border highlights, clear status badges, and sharp structural dividers.
- **Intentional Border Radius (R-03):** Use standard architectural radiuses (`rounded-xl` for cards, `rounded-lg` for interactive inputs/buttons) rather than making every single button and modal a giant pill shape.
- **Color Purpose:** Colors must represent clinical / administrative state:
  - Emerald: Jalur Hijau (Fast-Track / Valid DPJP / Attended)
  - Amber: Jalur Kuning (Administrative Uncertainty / SDMK Sync delay)
  - Rose / Crimson: Jalur Merah (Anomalies / SIP Expired Hard Trigger / Repeat Billing)
  - Slate: Neutral data hierarchy
- **Data Density for Workstations:** Verifiers process high volume claims daily. Visual hierarchy must prioritize scannability: Claim ID, INA-CBG, DPJP SIP Status, and Attendance Rates must be readable in under 3 seconds.
- **Graph Visualization:** Node and edge graphs must represent meaningful topology (Faskes -> DPJP -> Cluster -> Claim -> Patient) with clear edge legends.
