---
description: Humanizer Plain Language Writing Rules based on Wikipedia Signs of AI Writing
globs: ["backend/app/engine/humanizer_engine.py", "backend/app/main.py", "**/*.md"]
---

# Humanizer Plain Language Guidance

Apply the 26 AI writing pattern filters from `blader/humanizer` (v3.1.0) to all clinical adjudication summaries, dispute responses, and audit reports in ClaimTrace JKN.

## The Six Core Categories

1. **A. Staging Instead of Stating**:
   - Strip not-X-but-Y formulas (§1): state the point directly.
   - Remove one-line closers and dramatic fragments (§2): cut closers that merely repeat facts ("Let that sink in", "Biarkan fakta ini meresap").
   - Eliminate pseudo-deep aphorisms (§3): replace "Pada intinya / At its core" with concrete statements.
   - Strip staged run-ups (§4): drop "Mari kita bedah / Let's dive in" and start with the finding.
   - Avoid arguing with phantom objections (§5): remove unraised objections.

2. **B. Rhythm by Rule**:
   - Avoid forced triads (§6): do not force groups of three unless meaning requires it.
   - Vary sentence openings (§7): alternate subjects and verbs.
   - Ban decorative em-dashes (§8): replace em-dashes (—) with commas, periods, or colons.
   - Eliminate stacked qualifiers (§9) and unnecessary hyphenated pairs (§10).

3. **C. Inflation and Borrowed Authority**:
   - Eliminate overused AI buzzwords (§12): "krusial", "lanskap", "merajut", "pivotal", "delve", "showcase".
   - Cut inflated significance (§13): state the fact without declaring it a historic turning point.
   - Avoid avoiding simple verbs (§18): use "is", "are", "has" instead of "serves as", "features", "boasts".

4. **D. Formatting by Rule**:
   - Remove bold as decoration (§19): do not bold every label or noun.
   - Remove decorative emojis in headings and lists (§20).

5. **E. Leftovers from Chat and Drafts**:
   - Cut chatbot residue (§22): remove "Tentu saja!", "Semoga ini membantu!", "Great question!".
   - Cut meta-commentary about the document itself (§25): write about the subject, not the file.

6. **F. Writing for the Right Reader**:
   - Lead with the decision (§26): never make the verifier read through paragraphs of background before reaching the conclusion.
