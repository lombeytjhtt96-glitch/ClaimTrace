---
applyTo: 'app/src/**/*.{jsx,js,css}'
description: 'Anti-AI-slop design rules, data visualization discipline, and Floor standards inspired by Nutlope/hallmark v2.0.0.'
---

# Hallmark Design Standards for ClaimTrace JKN Frontend

## The Floor (Non-Negotiable)

1. Overflow Boundaries:
   - Always set `overflow-x: clip` on `html` and `body` (never `hidden` which breaks sticky containers, and never `100vw`).

2. Motion and Transition Discipline:
   - Never use `transition: all`. Specify exact properties (e.g. `transition: color 150ms, border-color 150ms, background-color 150ms`).
   - Never animate `width`, `height`, `top`, or `left`. Animate `transform` and `opacity` only.
   - Always provide `@media (prefers-reduced-motion: reduce)` fallbacks.

3. Visual Honesty:
   - Never use purple-to-blue gradients, artificial card-in-card containers, or emojis as icons.
   - Use clean Lucide icons and authentic healthcare telemetry states.

4. Typography & Numerals:
   - Always apply `tabular-nums` (`font-variant-numeric: tabular-nums`) to all currency values, tables, and timestamp displays to eliminate visual jitter.
   - Maintain sentence-case or clean untracked labels; avoid artificial all-caps badges.

5. Interactive States:
   - Ensure every actionable button and control provides instant `:focus-visible` ring and physical `:active` depression affordance (`translateY(1px)`).
