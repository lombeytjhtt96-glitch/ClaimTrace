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
