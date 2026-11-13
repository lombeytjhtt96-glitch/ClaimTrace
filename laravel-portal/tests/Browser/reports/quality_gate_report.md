# ClaimTrace JKN - DOM Quality Gate Audit Report

- Timestamp: 2026-11-13T21:41:51.792Z
- Target Application: http://127.0.0.1:8001
- Overall Status: ALL QUALITY GATES PASSED (100%)
- Passed: 6 / 6
- Execution Time: 32801 ms

## Scenarios Audit Table

| Scenario | Status | Duration | Notes / Findings |
|---|:---:|:---:|---|
| Scenario 01: Login & SSO NIP Directory | PASSED | 2759ms | All gates green |
| Scenario 02: Cockpit Executive & Screening Funnel | PASSED | 4923ms | All gates green |
| Scenario 03: VEDIKA Antrean FPK & Plotting Queue | PASSED | 5205ms | All gates green |
| Scenario 04: Bedah Investigasi & Dossier Digital | PASSED | 4337ms | All gates green |
| Scenario 05: Konsol Putusan 4-Status & BAHV Ledger | PASSED | 5017ms | All gates green |
| Scenario 06: Official Printable Reports (BAHV/BA/SP1) | PASSED | 10015ms | All gates green |

## 5 Quality Gates Verification Matrix

1. Gate 1: Dual Theme (Light & Dark)
   - Status: Active verification of light canvas vs dark canvas, localStorage persistence across page reloads, and WCAG AA contrast ratio compliance (>= 4.5:1 normal text, >= 3.0:1 large text).
2. Gate 2: Zero Console Errors & Warnings
   - Status: Intercepting page.on('console') and page.on('pageerror'). Zero unhandled exceptions or developer warnings allowed.
3. Gate 3: Zero HTTP 4xx/5xx Responses
   - Status: Intercepting page.on('response'). All assets, Vite bundles, and route transitions must return HTTP 2xx/3xx.
4. Gate 4: Zero Horizontal Overflow & table-fixed Enforcement
   - Status: Validating scrollWidth <= clientWidth (+ 1px subpixel tolerance). Ensuring all tabular queues implement table-fixed or responsive scroll wrapper.
5. Gate 5: Zero Emojis Compliance
   - Status: Unicode 15.0+ Extended Pictographic Tree-Walker audit across all DOM text nodes, attribute values, and document.title with zero tolerance.

## Visual Artifacts
Full-page screenshots in Light and Dark themes are preserved in `tests/Browser/reports/screenshots/`.
