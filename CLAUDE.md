# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes, derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on LLM coding pitfalls (`multica-ai/andrej-karpathy-skills`).

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" -> "Write tests for invalid inputs, then make them pass"
- "Fix the bug" -> "Write a test that reproduces it, then make it pass"
- "Refactor X" -> "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## Agent skills

### Issue tracker

Local markdown in `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`GLOSSARY.md` and `docs/adr/`). See `docs/agents/domain.md`.

---

## Project-Specific Guidelines (ClaimTrace JKN - Localhost Development)

- **Strict Remote Freeze**: Keep all development strictly on local branch `dev-local` (`localhost:3000` and `localhost:8000`). Never run `git push` to `main` or `vercel deploy`.
- **Zero Emoji Policy**: Never include emojis in UI components, backend responses, comments, or documentation.
- **Clean Terminology & No Vendor Leaks**:
  - Never expose AI model names (e.g., `Google Gemini`, `gemini-3.5-flash-lite`) or a `MODEL` column in the UI.
  - Never expose DBMS brand names (`DuckDB`) in user-facing UI text or AI outputs; use `database` or `basis data`.
  - Never render raw `JSON.stringify` dumps or `UPPER_CASE_UNDERSCORE` / `snake_case_underscore` codes directly in the UI; map them to clean Indonesian labels.
- **Verification Loop**:
  - Backend changes must pass `pytest` in `backend/tests/`.
  - Frontend changes must pass `npm run build` (`vite build`) in `app/` with zero errors.
