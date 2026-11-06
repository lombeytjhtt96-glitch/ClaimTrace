# Vercel Agent Skills: Frontend Performance, UI Guidelines & Composition Instructions

## 1. Overview and Operational Purpose

This standard operating procedure governs the application of Vercel Engineering guidelines to the ClaimTrace JKN platform. It incorporates rules from `vercel-labs/agent-skills`:
- **React Best Practices** (`react-best-practices`): 70 rules prioritized by impact across 8 performance categories.
- **Web Interface Guidelines** (`web-design-guidelines`): Web interface standards covering accessibility, visible focus, keyboard interactions, forms, and typography.
- **React Composition Patterns** (`composition-patterns`): Architecture patterns preventing boolean prop proliferation through compound components and state lifting.
- **React View Transitions** (`react-view-transitions`): Low-latency native CSS transitions with graceful fallback and reduced motion compliance.
- **Writing Guidelines** (`writing-guidelines`): Active voice, sentence-case headings, and standardized technical measurement units.

---

## 2. React Performance Rules (Impact-Prioritized)

### 2.1 Eliminating Waterfalls (Critical)
1. **Parallel Execution**: Use `Promise.all()` for independent asynchronous data fetches (e.g. claims list, anomaly metrics, audit chain summary). Never sequentially await independent requests.
2. **Early Promise Initiation**: Start fetching promises at the earliest possible boundary and defer `await` until the branch where the value is consumed.
3. **Cheap Conditions First**: Evaluate local in-memory or cheap synchronous guards before initiating remote queries.

### 2.2 Bundle Size & Code-Splitting (Critical)
1. **Dynamic Chunk Splitting**: Heavy forensic modules (graph visualizers, analytics views, empirical forensics) must be separated via Vite `manualChunks` or dynamic imports.
2. **Barrel File Elimination**: Import components and utility functions directly from their concrete module files rather than traversing heavy index barrel files.
3. **Third-Party Isolation**: Isolate large animation, visualization, and icon libraries into dedicated chunks (`motion`, `charts`, `flow`, `icons`).

### 2.3 Re-render & DOM Optimization (Medium to High)
1. **Content Visibility**: Apply `.claim-row-lazy` (`content-visibility: auto; contain-intrinsic-size: 0 48px;`) to long audit and claim table rows so browsers skip layout and paint calculations for off-screen items.
2. **Stable State Callbacks**: Use functional updater syntax (`setCount(prev => prev + 1)`) to preserve stable callback identities and avoid unnecessary child re-renders.
3. **Derived Values**: Calculate derived boolean and numeric states directly during render rather than synchronizing them across separate `useEffect` hooks.

---

## 3. Web Interface Guidelines & Accessibility

### 3.1 Focus States & Keyboard Affordance
1. **Universal Focus Ring**: All actionable elements must provide an unambiguous `:focus-visible` ring with 2px offset (`#059669` emerald).
2. **Interactive Row Accessibility**: Interactive table rows must specify `tabIndex={0}`, `role="button"`, `aria-label`, and keyboard event handlers (`Enter` and `Space` keys).

### 3.2 Icon Buttons & Form Elements
1. **Explicit Text Alternatives**: Icon-only buttons must declare an explicit `aria-label` attribute describing their exact action in Indonesian.
2. **Decorative Icons**: All visual SVG icon components must include `aria-hidden="true"` to prevent screen reader noise.

### 3.3 Typography & Numerals
1. **Tabular Numerals**: All monetary sums, percentage values, hashes, timestamps, and case identifiers must apply `font-variant-numeric: tabular-nums` (`.tabular-nums`) for strict vertical grid alignment.
2. **Measurement Units**: Format units consistently with a non-breaking space (e.g. `150 ms`, `64 KB`, `100 %`).

### 3.4 Reduced Motion
1. **Motion Media Queries**: Wrap all animated elements and View Transitions in `@media (prefers-reduced-motion: reduce)` to zero duration and remove translate offsets when requested by the operating system.

---

## 4. Verification Gate

Every frontend modification must satisfy:
1. `npm run build` in `app/` completes with zero syntax errors, zero circular chunk cycles, and zero chunks exceeding warning limits.
2. Zero emojis across all source files, comments, and documentation.
3. Zero proprietary AI model names or commercial vector database vendor leaks.
