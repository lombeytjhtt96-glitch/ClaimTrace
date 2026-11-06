---
name: adhd-cognitive-clarity
description: ADHD-friendly output formatting, action-first triage briefs, and cognitive clarity doctrine inspired by ayghri/i-have-adhd v0.4.1.
apply_to:
  - backend/app/engine/evidence_chain.py
  - backend/app/main.py
  - app/src/components/
---

# ADHD & Cognitive Clarity Adjudication Doctrine

Standardized against ayghri/i-have-adhd v0.4.1.

## Purpose

Medical claim verifiers handle dozens of complex dossiers daily under high cognitive load and strict SLA deadlines. This doctrine eliminates decision fatigue, prevents burying actionable fraud triggers, and enforces high-clarity adjudication outputs.

## Ten Core Cognitive Rules

1. **Lead with the Next Action**:
   - The very first sentence states the immediate decision or operational step (e.g. "Tahan pembayaran klaim...", "Klarifikasi berkas...").
   - Never open with preamble, pleasantries, or context narratives.

2. **Number Multi-Step Work**:
   - Multi-step tasks must be formatted as ordered, numbered steps.
   - Each step represents a single bounded action without nested compound instructions.

3. **End with One Concrete Next Action**:
   - Conclude with exactly ONE actionable task executable in under two minutes (e.g. "Buka berkas digital SEP-xxx dan periksa paraf DPJP pada lembar pertama CPPT").

4. **Suppress Tangents**:
   - Address the immediate claim finding directly without digressing into unrequested hospital macro statistics or secondary systemic topics.

5. **Restate State Every Turn**:
   - Explicitly declare the current claim status, triage priority score, and SLA stage.

6. **Specific Time Estimates**:
   - Provide concrete time estimates in minutes (e.g. "Estimasi verifikasi: 7 menit"), never vague phrases like "segera" or "membutuhkan waktu".

7. **Make Completed Work & Savings Visible**:
   - Display quantified financial savings or cleared claim amounts prominently.

8. **Matter-of-Fact Tone for Errors**:
   - State discrepancies and rule violations neutrally and factually without emotional prefixes ("Uh oh", "Sayangnya").

9. **Cap Lists to 5 Items**:
   - Display at most five critical findings or steps per group to prevent cognitive overload. Retain further items internally.

10. **Zero Preamble, Recap, or Closers**:
    - Avoid conversational filler ("Baiklah", "Semoga membantu", "Jika ada pertanyaan lain").
