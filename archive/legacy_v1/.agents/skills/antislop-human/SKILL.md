---
name: antislop-human
description: Accessibility and human factors filter. Enforces WCAG AA contrast ratios (unrounded 4.5:1 minimum), keyboard navigable elements, clear focus outlines, visible interactive states, and readable font weights.
---

# antislop-human (Accessibility & Contrast Filter)

## Key Rules
- **Contrast Ratios (R-17):**
  - Minimum 4.5:1 for normal text (e.g., text-slate-300 on dark slate-900 / slate-950).
  - Minimum 3.0:1 for large text and essential UI indicators.
  - Never use faint `text-slate-500` or `text-slate-600` for essential claim numbers, diagnosis codes, or legal notices.
- **Interactive State Accessibility (R-18):**
  - Focus rings (`focus-visible:ring-2 focus-visible:ring-emerald-400 focus:outline-none`) on all buttons, tabs, and inputs.
  - Keyboard tab navigation support across all decision buttons, simulator buttons, and claim queue items.
  - Screen reader semantic tags (`aria-label`, `role="tab"`, semantic headings).
- **Reduced Motion & Readability:**
  - Avoid disorienting continuous spin animations or rapid flashing that could cause cognitive fatigue during extended audit sessions.
