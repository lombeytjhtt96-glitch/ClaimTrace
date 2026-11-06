---
applyTo: 'backend/app/**/*.{py}'
description: 'Google SecOps Detection Engineering, YARA-L 2.0 rule authoring, SOAR incident lifecycle, and sovereign data boundary guidelines.'
---

# Google SecOps Detection Engineering & SOAR Case Guidelines

## Core Principles

1. YARA-L 2.0 Detection Rule Structure:
   - Rule Identifier: `rule <rule_identifier> { ... }`.
   - `meta:` section must specify: `author`, `description`, `severity`, `priority`, `mitre_attack_technique`, `mitre_f3_tag`, `regulatory_basis`, and `version`.
   - `events:` section: All event placeholders must be prefixed with `$` (e.g. `$claim`, `$sdmk`). Standard UDM fields must be used (`metadata.event_type`, `principal.resource.id`, `target.resource.attribute.labels`).
   - `match:` section: Mandatory for multi-event correlation or sliding window aggregation (e.g. `$faskes_id over 24h`).
   - `condition:` section: Explicit predicate expressions (e.g. `#claim >= 30 and $anomaly_score > 0.85`).

2. Google SecOps SOAR Case Management (`secops-cases`):
   - Every flagged claim or cluster is triaged into a formal `SecOpsClaimCase`.
   - Track case stage: `NEW`, `TRIAGE`, `INVESTIGATION`, `PENDING_DISPOSITION`, `CLOSED`.
   - Calculate remaining statutory SLA days under Perpres No. 82/2018 Pasal 76 ayat (2) (10 business days for Vedika).
   - Generate SHA-256 tamper-evident seals for individual cases and batch manifests.

3. Sovereign Data Boundary & Healthcare Compliance (`assured-workloads-basics`):
   - Adhere strictly to UU Perlindungan Data Pribadi (UU PDP No. 27/2022).
   - Zero-PHI preservation: Participant identifiers must be tokenized or pseudonymized with AES-256-GCM before ingestion into security telemetry.
   - Data residency: All claim telemetry, vector indexes, and audit logs must reside within the Indonesian sovereign territory (`asia-southeast2` Jakarta).

4. Strict Operational Rules:
   - Zero emojis across all rules, code, comments, and reports.
   - Remote repository freeze: Work exclusively on `dev-local`.
