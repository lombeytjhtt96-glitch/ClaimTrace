---
name: antislop-code
description: Code comment hygiene filter. Removes generic AI-generated comments (e.g., '// handle click', '// returns string', '// import react') and preserves high-value architectural, security, and algorithmic rationale comments.
---

# antislop-code (Code Comment Hygiene)

## Key Rules
- **Strip Obvious Comments:**
  - Delete redundant restatements like `// import react`, `// initialize state`, `// handle click event`.
- **Preserve High-Value Context:**
  - Maintain comments explaining statutory deadlines (e.g. `// Batas 10 hari kerja berita acara: Perpres 82/2018 Pasal 76 ayat (2)`).
  - Maintain mathematical formula derivations (e.g. `// S = 0.5*S1 + 0.3*S2 + 0.2*S3`).
  - Maintain cryptographic rationale (e.g. `// SHA-256 hash chaining prevents covert tampering of audit records`).
- **Never Modify Business Logic Silently:**
  - Only clean comments; do not alter functional code execution during comment cleanup.
