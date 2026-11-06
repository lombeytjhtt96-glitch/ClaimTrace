---
applyTo: 'backend/app/**/*.{py}'
description: 'Agent Decision Receipts (ISO 27001 / RA-QM) and Human Gate review protocols for ClaimTrace JKN.'
---

# Agent Decision Receipts & Human Gate Guidelines

## Core Principles

1. Consequential Action Receipts (`ra-qm-team/agent-decision-receipts`):
   - Every side-effecting, consequential, or later-provable AI action (`FLAG_FRAUD`, `APPROVE_VEDIKA`, `REJECT_CLAIM`, `ISSUE_TGR`, `DISPOSE_JALUR_MERAH`) must mint an immutable Agent Decision Receipt.
   - Action manifest must carry: `agent_id`, `operation`, `target`, `policy`, `inputs_hash`, `decision_label`, `severity`.
   - Evidence must be ASCII-encoded so that the SHA-256 canonical digest reproduces identically across any operating environment.
   - Digital seal must use HMAC-SHA256 bound to the canonical digest and verifikator NIP.

2. Human Gate Review Enforcement (`engineering/human-gate`):
   - In accordance with Permenkes No. 26/2021 Pasal 74, automated AI actions on Jalur Merah or TGR recoveries cannot execute unilaterally without a named human verifikator.
   - The Human Gate refuses sign-off if the BPJS Verifikator NIP is missing, invalid, or shorter than 5 characters.
   - Gate states: `PENDING_REVIEW`, `GATE_BLOCKED`, `HUMAN_VERIFIED`, `REJECTED`.
   - If open blockers exist, the gate remains blocked and `is_executable` evaluates to false.

3. Offline Cryptographic Verifiability:
   - Receipts must be verifiable offline from the certificate data alone without relying on external databases or networks.
   - Batch manifest computes a master SHA-256 seal across all sorted receipt digests to maintain audit chain immutability.

4. Strict Operational Rules:
   - Zero emojis across all code, manifests, comments, and reports.
   - Remote repository freeze: Work exclusively on `dev-local`.
