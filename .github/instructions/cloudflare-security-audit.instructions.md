---
description: Cloudflare Security Audit Harness and Vulnerability Discovery Rules
globs: ["backend/app/security/**/*.py", "backend/app/main.py", "backend/app/engine/evidence_chain.py"]
---

# Cloudflare Security Audit Guidance

Apply the Cloudflare Security Audit methodology (`cloudflare/security-audit-skill`) to ClaimTrace JKN security boundaries, input filters, and API authorization checks.

## Core Rules

1. **Source-First Boundary Analysis**:
   - Every security finding candidate must identify the lower-trust principal, input surface, crossed trust boundary, affected resource, and observable outcome.
   - Theoretical checklist deviations without a reachable boundary violation must not be reported as vulnerabilities.

2. **Strict Three-Verdict Taxonomy**:
   - `confirmed`: Source-grounded vulnerability with complete source trace (entrypoint -> propagation -> sink) and bounded local observed result. Severity anchored strictly to demonstrated impact.
   - `needs_validation`: Specific boundary hypothesis where verification is blocked by missing operational facts (e.g. edge proxy TLS settings). Must never have a severity score assigned.
   - `rejected`: Candidate explicitly disproved by existing defensive controls (e.g. query firewall, rate limiter, RBAC check). Must state concrete refutation reason and never have a severity score assigned.

3. **Defensive Separation and Invariant Fixes**:
   - Propose the smallest effective source fix enforcing the required invariant at the last trusted decision point.
   - Retain sandboxed local verification and reject live probing against production infrastructure.
