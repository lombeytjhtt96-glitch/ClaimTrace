---
name: BPJS Healthcare Clean
slug: bpjs-healthcare-clean
colors:
  primary: "#007A33"
  secondary: "#0C5CAB"
  success: "#16A34A"
  warning: "#D97706"
  danger: "#DC2626"
  surface: "#FFFFFF"
  background: "#F8FAFC"
  border: "#E2E8F0"
  text: "#0F172A"
typography:
  h1:
    fontFamily: "Poppins"
    fontSize: 1.5rem
  body-md:
    fontFamily: "Inter"
    fontSize: 0.875rem
  label-caps:
    fontFamily: "ui-monospace"
    fontSize: 0.75rem
  sourceScale: "11/12/14/16/20/24/32"
  weights: "400, 500, 600, 700"
rounded:
  sm: 4px
  md: 8px
  lg: 12px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
  sourceScale: "8pt baseline grid"
---

## Overview
BPJS Healthcare Clean is a bespoke design system for the ClaimTrace pre-payment claim decision support dashboard. It pairs with the `antislop` filter to provide clean, high-contrast, clinical data density in 100% full light mode.

## Rationale
- **White Surface Clarity**: Verification officers process hundreds of line-items per shift; white and light slate canvases reduce pupil dilation and eye strain compared to mixed high-contrast dark modes.
- **Auditable Visual Evidence**: Colors are reserved strictly for clinical triage lanes (Red: Audit, Yellow: Clarify, Green: Approve) rather than arbitrary decoration.
- **8pt Grid Consistency**: Guarantees alignment across complex data tables, case dossiers, and interactive multi-signal episode graphs.
