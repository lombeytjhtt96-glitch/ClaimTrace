---
applyTo: 'app/src/**/*.{jsx,js,css}'
description: 'High-performance 60fps animation, GSAP timeline composition, useGSAP React hook lifecycle, and GPU compositing rules.'
---

# GSAP Animation & Performance Guidelines

## Core Principles

1. React Lifecycle Safety via useGSAP:
   - Always use the `useGSAP` hook from `@gsap/react` instead of standard `useEffect`.
   - Always register the plugin: `gsap.registerPlugin(useGSAP)`.
   - Scope all animations to a root container ref (`{ scope: containerRef, dependencies: [...] }`). This ensures automatic cleanup of all tweens, timelines, and listeners on component unmount or dependency change.

2. GPU Compositor Performance (60fps Rule):
   - Only animate transform properties (`x`, `y`, `scale`, `rotation`) and `autoAlpha`.
   - Never animate layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`). Layout thrashing causes frame drops and compromises adjudicator responsiveness.
   - Apply CSS class `will-change-transform` or inline `will-change: transform` on animated micro-components.

3. autoAlpha vs Opacity:
   - Always prefer `autoAlpha` over `opacity`.
   - `autoAlpha` automatically sets `visibility: hidden` when `opacity: 0`, preventing pointer event interception on hidden UI elements.

4. Timeline Sequencing:
   - Use `gsap.timeline({ defaults: { ease: 'power2.out' } })` for choreographed entrance sequences (e.g. status badge, cryptographic seal, table rows).
   - Use relative position offsets (`'-=0.15'`) to create natural organic staggering rather than rigid artificial delays.

5. Motion Physics & Timing:
   - Micro-interaction duration: 150ms to 250ms with `power2.out`.
   - Modal and card entrance: 250ms to 350ms with subtle scale (`scale: 0.95` to `1.0`) and `back.out(1.5)`.
   - Exit animations: 120ms to 200ms with `power2.in`.

6. Strict System Constraints:
   - Zero emojis across all code, selectors, and comments.
   - Respect `@media (prefers-reduced-motion: reduce)` by skipping or instant-finishing tweens.
