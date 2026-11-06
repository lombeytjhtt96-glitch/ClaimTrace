# ClaimTrace JKN - GitHub Copilot Repository Instructions

## Repository Identity and Mission
ClaimTrace JKN is an enterprise-grade Decision Support System (DSS) designed for BPJS Kesehatan claim verifiers. The platform automates multi-signal triage across administrative, clinical, and forensic fraud dimensions (BAKB, Geovelocity anomalies, D3MFA identity telemetry, and D3FEND audit defense).

---

## Core Non-Negotiable Rules

1. Zero Emojis Policy:
   - Never output emojis in code, comments, documentation, commit messages, or responses.
   - Use clean textual indicators, ASCII badges, or Lucide icons instead.

2. Strict Remote Freeze:
   - Work strictly on the local development branch (dev-local).
   - Never push commits to remote repositories or trigger cloud deployments without explicit authorization.

3. Architecture Integrity and Vendor Agnosticism:
   - Never hardcode or leak proprietary commercial AI model names or proprietary commercial vector database vendor names in client-facing UI, logs, or error responses.
   - Use generic domain terminology: "Semantic Engine", "Local Vector Index", "Heuristic Rules Evaluator", "Forensic Decision Core".

4. Verifiable Evidence and Quality Gate:
   - Every fraud triage finding must be grounded in verified evidence with taint tracing (ICD-10 codes, tarip delta, timestamp anomalies, geographic coordinates).
   - Adhere to the audit integrity standard: never suppress valid fraud indicators; maintain intellectual honesty and rigorous scoring (minimum quality score >= 8/10).

---

## Backend Guidelines (FastAPI + Python 3.14 + DuckDB)

- Scope: Files under `backend/app/**/*.py`
- Framework: FastAPI 0.115+ with Pydantic v2 data models.
- Type Safety: Enforce strict Python type annotations across all function signatures, requests, and responses.
- Asynchronous Handlers: Prefer `async def` for I/O-bound endpoints (database queries, network requests, file persistence).
- Database & Analytics: Use DuckDB for high-throughput OLAP queries and claim aggregation. Always use parameterized queries to prevent SQL injection.
- Security Headers: Maintain OWASP Secure Headers (CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Cache-Control for sensitive paths).
- Rate Limiting: Respect Token-Bucket and sliding window rate limiters. Always handle rate-limit exceptions gracefully.
- Health & Observability: Maintain `/health`, `/healthz`, and `/metrics` (Prometheus) endpoints with zero sensitive data exposure.
- Academic & Evidentiary Integrity (ARS v3.24.2 Standards):
  - Every claim triage dossier supports an `AcademicEvidencePassport` with Stage 4.5 integrity verification, L3 claim-faithfulness, statutory citation anchors, and a cryptographic reproducibility lock (`repro_lock`).
  - Strict anti-sycophancy: Devil's Advocate concession threshold >= 4.0 before conceding against rebuttal or pushback.
- Atomic Predicate Audit & Anti-Deception (AAS v20.6.0 Standards):
  - Every claim fraud triage dossier supports an atomic predicate audit ledger (`ClaimAuditLedger`) via `audit-agent-run-evidence` specification.
  - Every predicate statement must link directly to an external witness (SIMRS, SISDMK, BPJS VClaim, INA-CBG engine) with exact cryptographic evidence hashes.
  - Anti-Deception Gate: Enforce strict rejection of manufactured urgency, VIP authority appeals, or pressure to bypass deterministic audit rules.
  - Omission Bias Gate: Negative findings, discrepancies, and counterevidences must never be suppressed or omitted from final audit outputs.
  - AKF Trust Metadata: Immutable provenance stamping (`AkfProvenanceStamp`) with cryptographic ledger hash and statutory compliance citations (Permenkes 26/2021, Permenkes 3/2023, UU 27/2022 PDP, ISO 27001).
- Clinical Decision Support & ISO Standards Readiness (K-Dense-AI Standards):
  - Strict Hard Safety Boundary: DSS outputs are research, audit, and decision-support artifacts only; automated denial, settlement, or treatment interference without licensed human sign-off is prohibited.
  - Every claim supports a Clinical Decision Support Evaluation Dossier (`CdsEvaluationDossier`) incorporating GRADE evidence profile evaluation (High/Moderate/Low/Very Low) and decision logic traceability.
  - ISO 14971 & ISO 13485 Risk Controls: Maintain risk control entries for SaMD hazards (false-positive delay, false-negative deficit, participant privacy exposure).
  - Draft Watermark: Unreviewed outputs carry explicit draft watermark declarations.
- ADHD & Cognitive Clarity Adjudication (ayghri/i-have-adhd Standards):
  - Every claim supports an action-first cognitive triage brief (`CognitiveTriageBrief`) leading directly with the decision (e.g. approve, hold, clarify).
  - Number multi-step review tasks with explicit integer minute estimates; cap review steps and findings lists to maximum 5 items per group.
  - Conclude every brief with exactly one concrete next action executable in under two minutes.
  - Zero preamble, conversational pleasantries, or redundant recaps in audit summaries.
- Cloudflare Security Audit Harness & Finding Taxonomy (cloudflare/security-audit-skill Standards):
  - Every evaluated trust boundary supports the Cloudflare 6-phase harness workflow and strict 3-verdict taxonomy (`confirmed`, `needs_validation`, `rejected`).
  - Prohibit severity or CVSS scores on `needs_validation` or `rejected` candidates.
  - For `confirmed` vulnerabilities, calibrate severity strictly against demonstrated local impact.
  - Adversarial Verification: Verification of candidate findings must be conducted independently from candidate hypothesis generation.
  - Expose `/api/v1/security/audit-ledger` delivering `SecurityAuditCoverageLedger` with deterministic cryptographic audit hashes.
- Humanizer Plain Prose & Anti-AI Tells (blader/humanizer v3.1.0 Standards):
  - Strip all 26 Wikipedia signs of AI writing from clinical adjudication prose, dispute reports, and summary briefs.
  - Enforce removal of staged run-ups (§4), not-X-but-Y formulas (§1), dramatic closers (§2), forced triads (§6), decorative em-dashes (§8), buzzwords like "krusial/lanskap/merajut" (§12), and chatbot wrappers (§22).
  - Expose `/api/v1/claims/humanize-prose` and `/api/v1/claims/{claim_id}/humanized-narrative` returning `HumanizedAdjudicationText`.
- Last30Days Temporal Intelligence & Regulatory Radar (mvanhorn/last30days-skill v3.31.0 Standards):
  - Implement 30-day sliding window temporal radar for active regulatory circulars (KPK, Kemenkes, BPJS) and emergent fraud typologies.
  - Dynamically compute claim risk elevation multipliers (1.10x - 1.35x) based on active 30-day field audit circulars and code matches.
  - Support deterministic mock and offline fallback modes for CI/CD test stability.
  - Expose `/api/v1/radar/last30days`, `/api/v1/claims/{claim_id}/last30days-intelligence`, and `/api/v1/radar/last30days/query` with SHA-256 tamper-evident integrity seals.

---

## Frontend Guidelines (React 18 + Vite 5 + Tailwind CSS)

- Scope: Files under `app/src/**/*.{jsx,js,css}`
- Architecture: Component-driven architecture with clean separation between presentation and data hooks.
- Performance & Bundling: Keep vendor chunks split into dedicated rollup bundles (`icons`, `flow`, `charts`, `index`). Use dynamic imports for heavy modal flows.
- Styling: Use Tailwind CSS utility classes with structured semantic tokens (slate, emerald, amber, rose).
- Anti-Slop & Hallmark Floor Standards:
  - Strict Hallmark Floor compliance: zero horizontal overflow bleed (`overflow-x: clip`), no `transition: all`, never animate layout dimensions.
  - Number & Currency Stability: Enforce tabular figures (`tabular-nums`) across all tables, financial amounts, timestamps, and metric counters.
  - Tactile Affordances: Active button feedback (`transform: translateY(1px)` on `:active:not(:disabled)`).
- Motion Craft & Mobile Native (Emil Kowalski Standards):
  - Enter animations: snappy ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`), subtle scale emergence (`scale(0.96)` to `scale(1)`), never scale from 0.
  - Exit animations: snappier duration (60-70% of enter) with ease-in.
  - Mobile touch polish: `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation` (no 300ms tap delay), `user-select: none` on interactive controls, min 16px input font size.
- Accessibility (WCAG 2.1 AA):
  - All interactive elements must provide visible focus indicators (`focus-visible:ring-2 focus-visible:ring-emerald-500`).
  - Buttons and actionable elements must provide explicit `cursor-pointer`.
  - Provide descriptive `aria-label` or accessible names for icon-only buttons.
  - Form controls must have associated labels and distinct error announcements.
- Resilient State: Handle loading states, empty states, and API error states gracefully with fallback UI.

---

## Testing & Quality Assurance

- Backend: Run `python3 -m pytest tests/` from `backend/`. All unit and integration tests must pass before declaring work complete.
- Frontend: Run `npm run build` from `app/` to ensure zero compilation or bundling errors.
- Contract Drift: When modifying backend schemas in `backend/app/models/schemas.py`, immediately verify and update matching frontend consumers in `app/src/`.

---

## Awesome Codex Skills & Claim Dossier Standards

- **Skills Source**: Repositories located at `/home/Khalaf-Dev/awesome-codex-skills` and symlinked in `.github/skills/awesome-codex-skills`.
- **Claim Dossier Engine**: `backend/app/engine/claim_dossier_engine.py` generates standardized audit dossiers using the filename convention `YYYY-MM-DD_FASKES_SEP_CLAIMID_TYPOLOGY_STATUS.json`.
- **Financial Liability Standards**: Compute cost recovery and 50% legal administrative sanctions per Permenkes RI No. 26 Tahun 2021 Pasal 74 across dispute lanes (MERAH, KUNING, HIJAU).
- **Dynamic Formula Export**: All CSV exports must include active spreadsheet formulas (`=SUM()`, `=COUNTA()`) per `spreadsheet-formula-helper`.
- **Integrity Sealing**: Enforce SHA-256 cryptographic verification for every claim item and batch manifest.
- **Strict Guardrails**: Zero emojis and zero vendor leaks across all files, documentation, and user-facing copy.

---

## GreenSock GSAP Skills & 60fps Animation Standards (greensock/gsap-skills)

- **Skills Source**: Repositories located at `/home/Khalaf-Dev/gsap-skills` and symlinked in `.github/skills/gsap-skills`.
- **Lifecycle Integration**: Always use the `@gsap/react` `useGSAP` hook with explicit scoping (`{ scope: containerRef, dependencies: [...] }`) and top-level plugin registration (`gsap.registerPlugin(useGSAP)`).
- **GPU Compositor Performance**: Animate strictly transform properties (`x`, `y`, `scale`, `rotation`) and `autoAlpha`. Never animate layout dimensions (`width`, `height`, `top`, `left`, `margin`, `padding`).
- **Tactile Verifier Feedback**: Micro-interactions, status badges, and action buttons use snappy, choreographed timelines (`power2.out`, 180ms - 250ms) to deliver zero-lag feedback for adjudicators.
- **Rollup Chunking**: Keep GSAP and `@gsap/react` isolated in a dedicated Vite bundle (`manualChunks: { gsap: ['gsap', '@gsap/react'] }`).

---

## Google Skills & SecOps Detection Engineering Standards (google/skills)

- **Skills Source**: Repositories located at `/home/Khalaf-Dev/google-skills` and symlinked in `.github/skills/google-skills`.
- **YARA-L 2.0 Rules**: Pre-compiled and dynamic detection rules in `backend/app/engine/google_secops_engine.py` adhering to `secops-detection-engineering` syntax (`meta:`, `events:`, `condition:`, UDM variables).
- **SOAR Incident Lifecycle**: Triage flagged claims into `SecOpsClaimCase` instances with 10-day Vedika statutory SLA tracking (Perpres 82/2018 Pasal 76 ayat 2).
- **Data Sovereignty (UU PDP No. 27/2022)**: Ensure zero unencrypted PHI in security telemetry and strict data residency in the Indonesian sovereign region (`asia-southeast2` Jakarta).
- **REST Endpoints**: Expose `/api/v1/secops/rules`, `/api/v1/secops/rules/compile`, `/api/v1/secops/cases`, and `/api/v1/secops/sovereignty/assessment` with SHA-256 tamper-evident integrity seals.

---

## RA-QM Decision Receipts & Human Gate Standards (OpenAgentOntology)

- **Skills Source**: Repositories symlinked in `.github/skills/decision-receipts`.
- **Agent Decision Receipts**: Codified in `backend/app/engine/decision_receipts_engine.py` following the OpenAgentOntology standard (`ra-qm-team/agent-decision-receipts`) for side-effecting, consequential, and later-provable decisions.
- **Human Gate Review (`engineering/human-gate`)**: Enforce human-in-the-loop review on all Jalur Merah or TGR recovery decisions per Permenkes No. 26/2021. The gate strictly refuses sign-off without a valid BPJS Verifikator NIP and clears only when all blockers are resolved.
- **Offline Verifiability**: Every receipt must be verifiable offline from its canonical SHA-256 digest and HMAC-SHA256 digital seal alone without reliance on an external database or network.
- **Batch Manifest Sealing**: Master SHA-256 seal links all active decision receipts into an immutable, tamper-evident audit record.
- **REST Endpoints**: Expose `/api/v1/receipts`, `/api/v1/receipts/{id}`, `/api/v1/receipts/mint`, `/api/v1/receipts/{id}/human-gate`, `/api/v1/receipts/{id}/verify`, and `/api/v1/receipts/manifest/verify`.

---

## Vercel Agent Skills: Frontend Performance, Guidelines & Composition (vercel-labs/agent-skills)

- **Skills Source**: Repositories located at `/home/Khalaf-Dev/vercel-agent-skills` and symlinked in `.github/skills/vercel-agent-skills`.
- **React Best Practices (`react-best-practices`)**:
  - Eliminate Waterfalls: Parallelize independent async operations (`Promise.all()`), defer awaiting non-critical values, and start promises early.
  - Bundle Size Optimization: Use dynamic imports (`React.lazy` with `Suspense`) for heavy views, avoid barrel file re-exports, and isolate heavy libraries (`motion`, `charts`, `flow`) in separate Vite chunks.
  - Re-render Optimization: Hoist default non-primitive props, use functional `setState` for stable callbacks, derive state during render rather than in effects, and avoid subscribing to state only needed in callbacks.
  - Rendering Performance: Use `content-visibility: auto; contain-intrinsic-size: 0 48px;` on long audit and claim table rows (`.claim-row-lazy`) to skip off-screen layout and paint calculations.
- **Web Interface Guidelines (`web-design-guidelines`)**:
  - Keyboard Navigation & Focus: Interactive table rows and cards must support `tabIndex={0}`, `role="button"`, and keyboard triggers (`Enter` / `Space`). Maintain visible focus rings (`:focus-visible` with 2px offset).
  - Accessible Buttons: Icon-only buttons must provide an explicit, localized `aria-label` attribute and mark inner decorative SVG icons with `aria-hidden="true"`.
  - Typography & Numeric Alignment: Financial figures, case IDs, hashes, and timestamps must use `font-variant-numeric: tabular-nums` (`.tabular-nums`) for perfect vertical grid alignment.
  - Motion Reduction: All transitions and animations must honor `prefers-reduced-motion: reduce` by zeroing durations and disabling view transition pseudo-elements.
- **React Composition Patterns (`composition-patterns`)**:
  - Avoid boolean prop proliferation by structuring complex components as compound components with shared context.
  - Use explicit variant components rather than boolean flags to govern distinct workflow modes.
- **View Transitions (`react-view-transitions`)**:
  - Implement native CSS view transitions (`@view-transition`, `::view-transition-old`, `::view-transition-new`) for lateral tab changes and state morphs with smooth, low-latency timing.

---

## Cybersecurity Skills & MITRE F3 / D3FEND Fraud Countermeasures (cybersecurity-skills)

- **Skills Source**: Repositories located at global cybersecurity skills repository (818 production-grade cybersecurity skills across 34 domains) and symlinked in `.github/skills/cybersecurity-skills`.
- **MITRE Fight Fraud Framework (F3 v1.1)**: Dual-phase fraud taxonomy mapping:
  - Positioning (`FA0001`): Synthetic identity seeding (`F1005`), fake provider credential setup (`F1036`), and compromised verifier sessions.
  - Monetization (`FA0002`): Unauthorized claim payout extraction (`F1025.003`), tariff delta inflation, and systemic unbundling.
- **MITRE ATT&CK Alignment**: TTP identification for cyber-enabled fraud (`T1078` Valid Accounts, `T1565.001` Stored Data Manipulation, `T1657` Financial Theft).
- **MITRE D3FEND v1.4.0 Defensive Countermeasures**:
  - `D3-ARA`: User Account Lockdown on rogue verifier accounts.
  - `D3-DA`: Cryptographic Data Authenticity verification on claim payloads.
  - `D3-NTA`: Inbound Network Traffic Analysis for geovelocity anomalies.
  - `D3-SVR`: Secondary Verification Review for high-risk ICD-10 upcoding.
  - `D3-TR`: Bidirectional Transaction Reconciliation against hospital SIMRS ledgers.
- **Evidentiary Integrity & Cryptographic Seal**:
  - Deterministic SHA-256 canonical matrix digest (`canonical_matrix_sha256`) per claim evaluation for statutory admissibility under Permenkes RI No. 26/2021 and UU PDP No. 27/2022.
- **REST Endpoints**:
  - `GET /api/v1/cybersecurity/frameworks/summary`
  - `GET /api/v1/cybersecurity/skills/fraud-catalog`
  - `GET /api/v1/cybersecurity/claims/{claim_id}/matrix`
  - `POST /api/v1/cybersecurity/claims/evaluate`
- **Strict Guardrails**: Zero emojis and zero vendor leaks across all files, documentation, and user-facing copy.


