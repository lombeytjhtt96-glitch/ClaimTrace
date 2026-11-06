---
applyTo: 'app/src/**/*.{jsx,js,css}'
description: 'React, Vite, and Tailwind CSS guidelines for ClaimTrace JKN frontend, covering bundle optimization, WCAG 2.1 AA accessibility, and anti-slop principles.'
---

# Frontend React & UI Standards for ClaimTrace JKN

## Component Architecture
- Separate container logic (API fetching, state mutations) from pure presentation components.
- Keep components modular and single-purpose.
- Prefer functional components with hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).

## Accessibility and Navigation (WCAG 2.1 AA)
- Interactive components must have explicit keyboard focus rings: `focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none`.
- Actionable elements must display `cursor-pointer`.
- Icon buttons without visible text must include an `aria-label`.
- Dialogs and modals must implement focus trapping and ESC key dismissal.

## Performance & Chunking
- Keep heavy visualization modules split across dedicated chunks via `vite.config.js`.
- Use lazy loading (`React.lazy` and `Suspense`) for secondary modal views and intensive data grids.
- Ensure production build finishes cleanly without unresolved module warnings.

## Anti-Slop UI Doctrine
- Avoid generic placeholder cards, artificial animations, or filler metrics.
- Every metric, chart, and badge must reflect real BPJS Kesehatan claim verification workflows.
- Zero emojis in UI labels, badges, alert notices, and table headers.
