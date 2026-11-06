---
applyTo: 'app/src/**/*.{jsx,js,css}'
description: 'Design engineering, animation decision framework, motion craft, and mobile-native polish based on Emil Kowalski philosophy.'
---

# Emil Kowalski Design Engineering & Motion Craft Guidelines

## Core Principles

1. Unseen Details Compound:
   - When a micro-interaction operates with absolute physical consistency, the user proceeds without cognitive friction.
   - Invisible craft separates enterprise software that feels heavy from tools users genuinely enjoy.

2. Taste is Trained:
   - Always choose easing curves, durations, and spring parameters deliberately.
   - Enter transitions require snappy ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`); never use `ease-in` on enter.

## The Animation Decision Framework

1. Frequency Gate:
   - Frequent actions (>10 times per session, like tab switching or quick triage): Instant or sub-150ms.
   - Standard actions (modal opening, alerts panel, toast display): 180ms - 220ms with ease-out curve.
   - Rare actions (complex graph generation, multi-stage report export): Expressive motion up to 300ms.

2. Motion Physics:
   - Never scale in from 0 (`scale(0)`). Scale subtly from `scale(0.95)` or `scale(0.98)`.
   - Popovers scale from their trigger anchor (`transform-origin: top right`). Modals stay centered.
   - Exit animations are faster than enter animations (approx. 60-70% duration) using ease-in.

3. Performance & GPU Compositing:
   - Animate only `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`, `margin`, or `padding`.
   - Never use `transition: all`. Specify exact CSS properties explicitly.
   - Always respect `@media (prefers-reduced-motion: reduce)`.

## Mobile-Native Touch Standards

1. Tap Feedback:
   - Suppress ugly browser tap highlight flash via `-webkit-tap-highlight-color: transparent`.
   - Eliminate 300ms mobile tap delay using `touch-action: manipulation` on buttons and links.

2. Text Selection:
   - Set `user-select: none` on buttons, interactive chips, and navigation triggers to prevent long-press text selection.

3. Viewport & Input Focus:
   - Use dynamic viewport height (`100dvh`) for full-bleed mobile views instead of buggy `100vh`.
   - Maintain minimum 16px input font size on screens under 768px to prevent iOS Safari auto-zoom.
