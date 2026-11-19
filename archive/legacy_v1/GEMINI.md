# ClaimTrace Gemini Configuration

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) and then the skill for the task:
- UI / visual: `.agents/skills/antislop-ui/SKILL.md`
- Copy & text: `.agents/skills/antislop-copywriting/SKILL.md`
- People: `.agents/skills/antislop-human/SKILL.md`
- Mobile / responsive: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `.agents/skills/antislop-code/SKILL.md`

Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source.
<!-- antislop:end -->

## Design System (awesome-design-skills standard)
For UI tokens, styling foundations, light-theme palette, and component specifications:
- Root Companion: `DESIGN.md`
- Design Skill: `.agents/skills/bpjs-healthcare-clean/SKILL.md`
- Philosophy: Pairs with `antislop` (anti-slop = filter; DESIGN.md = soul, brand, tokens, palette).

## Cybersecurity & Fraud Defense (Anthropic Cybersecurity Skills standard)
For healthcare fraud taxonomy, MITRE F3, ATT&CK, ATLAS, and tamper-evident audit trails:
- Fraud Defense Skill: `.agents/skills/bpjs-fraud-mitre-f3/SKILL.md`
- Standards & Regulatory Mappings: `.agents/skills/bpjs-fraud-mitre-f3/references/standards.md`
- Frameworks: MITRE F3 v1.1, MITRE ATT&CK v19.1, MITRE ATLAS, NIST AI RMF, UU PDP No. 27/2022.
