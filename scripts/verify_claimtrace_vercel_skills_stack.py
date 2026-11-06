#!/usr/bin/env python3
"""
Verification Script: ClaimTrace JKN - Vercel Agent Skills Stack Integration
Validates global repository installation, skills manifest registration, project symlinks,
Vite bundle chunking, CSS View Transitions, accessibility attributes, production build,
zero emojis policy, and zero vendor leaks.
"""

import os
import sys
import json
import re
import subprocess
from pathlib import Path

PROJECT_ROOT = Path("/home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn")
APP_DIR = PROJECT_ROOT / "app"
SKILLS_JSON_PATH = Path("/home/Khalaf-Dev/.gemini/config/skills.json")
VERCEL_SKILLS_PATH = Path("/home/Khalaf-Dev/vercel-agent-skills")

EXPECTED_SKILLS = [
    "composition-patterns",
    "deploy-to-vercel",
    "react-best-practices",
    "react-native-skills",
    "react-view-transitions",
    "vercel-cli-with-tokens",
    "vercel-optimize",
    "web-design-guidelines",
    "writing-guidelines"
]

def check_1_global_repo_exists():
    print("[1/10] Checking global vercel-agent-skills repository...")
    assert VERCEL_SKILLS_PATH.exists(), f"Directory not found: {VERCEL_SKILLS_PATH}"
    skills_dir = VERCEL_SKILLS_PATH / "skills"
    assert skills_dir.exists(), f"Skills dir not found: {skills_dir}"
    
    found_skills = [d.name for d in skills_dir.iterdir() if d.is_dir()]
    for exp in EXPECTED_SKILLS:
        assert exp in found_skills, f"Expected skill {exp} not found in {skills_dir}"
    print(f"[PASS] 1. Global vercel-agent-skills repository exists ({len(found_skills)} skills)")

def check_2_skills_json_registered():
    print("[2/10] Checking ~/.gemini/config/skills.json registration...")
    assert SKILLS_JSON_PATH.exists(), f"Config file not found: {SKILLS_JSON_PATH}"
    with open(SKILLS_JSON_PATH, "r") as f:
        data = json.load(f)
    entries = [e.get("path") for e in data.get("entries", [])]
    target_path = str(VERCEL_SKILLS_PATH / "skills")
    assert target_path in entries, f"Path {target_path} not found in skills.json entries"
    print(f"[PASS] 2. vercel-agent-skills registered in skills.json (Total entries: {len(entries)})")

def check_3_project_symlink():
    print("[3/10] Checking project symlink in .github/skills/...")
    symlink_path = PROJECT_ROOT / ".github" / "skills" / "vercel-agent-skills"
    assert symlink_path.exists(), f"Symlink not found: {symlink_path}"
    assert symlink_path.is_symlink(), f"Path is not a symlink: {symlink_path}"
    resolved = symlink_path.resolve()
    assert resolved == (VERCEL_SKILLS_PATH / "skills").resolve(), f"Symlink resolved to {resolved}"
    print(f"[PASS] 3. Project symlink valid -> {resolved}")

def check_4_vite_chunk_splitting():
    print("[4/10] Checking app/vite.config.js chunk configuration...")
    vite_config = APP_DIR / "vite.config.js"
    assert vite_config.exists(), f"vite.config.js not found at {vite_config}"
    content = vite_config.read_text()
    assert "motion" in content, "motion chunk missing from vite.config.js"
    assert "dashboard-views" in content, "dashboard-views chunk missing from vite.config.js"
    assert "mobile-jkn" in content, "mobile-jkn chunk missing from vite.config.js"
    print("[PASS] 4. vite.config.js contains optimized chunk splitting rules")

def check_5_css_view_transitions_and_rules():
    print("[5/10] Checking app/src/index.css for View Transitions and content-visibility...")
    css_path = APP_DIR / "src" / "index.css"
    assert css_path.exists(), f"index.css not found at {css_path}"
    content = css_path.read_text()
    assert "::view-transition-old" in content, "View Transitions CSS missing"
    assert "::view-transition-new" in content, "View Transitions CSS missing"
    assert "prefers-reduced-motion" in content, "Reduced motion override missing"
    assert "content-visibility: auto" in content, "content-visibility utility missing"
    assert ".claim-row-lazy" in content, ".claim-row-lazy selector missing"
    print("[PASS] 5. index.css contains native View Transitions, reduced-motion, and lazy rows")

def check_6_audit_ledger_accessibility():
    print("[6/10] Checking AuditLedger.jsx accessibility and tabular numerals...")
    ledger_path = APP_DIR / "src" / "components" / "Dashboard" / "AuditLedger.jsx"
    assert ledger_path.exists(), f"AuditLedger.jsx not found at {ledger_path}"
    content = ledger_path.read_text()
    assert "role=\"button\"" in content, "Interactive table row missing role button"
    assert "aria-label=\"Tutup jendela resi keputusan\"" in content, "Receipt modal close button missing aria-label"
    assert "aria-label=\"Tutup jendela SecOps\"" in content, "SecOps modal close button missing aria-label"
    assert "claim-row-lazy" in content, "Audit rows missing claim-row-lazy class"
    assert "tabular-nums" in content, "Tabular nums class missing in numeric cells"
    print("[PASS] 6. AuditLedger.jsx conforms to Web Interface Guidelines and accessibility")

def check_7_instructions_and_agent_docs():
    print("[7/10] Checking instructions and agent documentation...")
    instructions = PROJECT_ROOT / ".github" / "instructions" / "vercel-agent-skills.instructions.md"
    agent = PROJECT_ROOT / ".github" / "agents" / "vercel-frontend-optimizer.agent.md"
    copilot = PROJECT_ROOT / ".github" / "copilot-instructions.md"
    
    assert instructions.exists(), f"Missing instructions: {instructions}"
    assert agent.exists(), f"Missing agent: {agent}"
    assert copilot.exists(), f"Missing copilot instructions: {copilot}"
    
    assert "Vercel Agent Skills" in copilot.read_text(), "copilot-instructions.md missing Vercel section"
    assert "react-best-practices" in instructions.read_text(), "instructions missing react-best-practices"
    assert "vercel-frontend-optimizer" in agent.read_text(), "agent file missing identifier"
    print("[PASS] 7. Documentation and agent definitions verified")

def check_8_production_build():
    print("[8/10] Running npm run build in app/ to verify bundle integrity...")
    res = subprocess.run(
        ["npm", "run", "build"],
        cwd=str(APP_DIR),
        capture_output=True,
        text=True
    )
    assert res.returncode == 0, f"npm run build failed with code {res.returncode}:\n{res.stderr}\n{res.stdout}"
    assert "built in" in res.stdout, "Vite build did not indicate completion"
    assert "Some chunks are larger than" not in res.stdout, f"Build emitted chunk size warning:\n{res.stdout}"
    print("[PASS] 8. Frontend production build succeeded with zero chunk size warnings")

def check_9_zero_emojis():
    print("[9/10] Checking zero emojis across modified and created files...")
    emoji_pattern = re.compile(r"[\U00010000-\U0010ffff]|[\u2600-\u27ff]|[\u2300-\u23ff]")
    files_to_check = [
        APP_DIR / "vite.config.js",
        APP_DIR / "src" / "index.css",
        APP_DIR / "src" / "components" / "Dashboard" / "AuditLedger.jsx",
        PROJECT_ROOT / ".github" / "instructions" / "vercel-agent-skills.instructions.md",
        PROJECT_ROOT / ".github" / "agents" / "vercel-frontend-optimizer.agent.md",
        PROJECT_ROOT / ".github" / "copilot-instructions.md",
        PROJECT_ROOT / "scripts" / "verify_claimtrace_vercel_skills_stack.py"
    ]
    for p in files_to_check:
        if p.exists() and not p.is_symlink():
            content = p.read_text()
            matches = emoji_pattern.findall(content)
            assert not matches, f"Emojis found in {p}: {matches[:5]}"
    print("[PASS] 9. Zero emojis verified across all target files")

def check_10_zero_vendor_leaks():
    print("[10/10] Checking zero proprietary AI / vendor leaks...")
    # Disallow proprietary LLM names and commercial DB names
    forbidden_pattern = re.compile(
        r"\b(Anthropic|Claude|OpenAI|ChatGPT|GPT-3|GPT-4|Mistral|Llama|Pinecone|Weaviate|Qdrant|Milvus)\b",
        re.IGNORECASE
    )
    files_to_check = [
        APP_DIR / "vite.config.js",
        APP_DIR / "src" / "index.css",
        APP_DIR / "src" / "components" / "Dashboard" / "AuditLedger.jsx",
        PROJECT_ROOT / ".github" / "instructions" / "vercel-agent-skills.instructions.md",
        PROJECT_ROOT / ".github" / "agents" / "vercel-frontend-optimizer.agent.md",
        PROJECT_ROOT / ".github" / "copilot-instructions.md"
    ]
    for p in files_to_check:
        if p.exists() and not p.is_symlink():
            content = p.read_text()
            matches = forbidden_pattern.findall(content)
            assert not matches, f"Vendor leak detected in {p}: {matches}"
    print("[PASS] 10. Zero proprietary AI / vendor leaks verified")

def main():
    print("=" * 50)
    print("CLAIMTRACE JKN - VERCEL AGENT SKILLS VERIFICATION")
    print("=" * 50)
    
    check_1_global_repo_exists()
    check_2_skills_json_registered()
    check_3_project_symlink()
    check_4_vite_chunk_splitting()
    check_5_css_view_transitions_and_rules()
    check_6_audit_ledger_accessibility()
    check_7_instructions_and_agent_docs()
    check_8_production_build()
    check_9_zero_emojis()
    check_10_zero_vendor_leaks()
    
    print("=" * 50)
    print("RESULT: 10/10 CHECKS PASSED")
    print("=" * 50)

if __name__ == "__main__":
    main()
