# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the ClaimTrace codebase.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root: contains the ubiquitous domain language for BPJS Kesehatan claim verification, triage signals, and clinical audit concepts.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in (Quad-Triangulasi, Tamper-Evident Ledger, Zero-PHI Scrubber, and Analytical Store).

## File structure

Single-context repo:

```
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-quad-triangulation-triage.md
│   ├── 0002-tamper-evident-audit-chain.md
│   ├── 0003-zero-phi-scrubber-and-pseudonymization.md
│   └── 0004-high-performance-embedded-analytical-store.md
├── backend/app/
└── app/src/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> *Contradicts ADR-0001 (Quad-Triangulasi Sinyal Triase), but worth reopening because...*
