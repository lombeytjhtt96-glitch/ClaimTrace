#!/usr/bin/env python3
"""
Verification Script: ClaimTrace JKN - Cybersecurity Skills & MITRE F3/D3FEND Stack Integration
Validates global repository installation (818 skills), manifest registration, project symlinks,
deterministic framework evaluation, 4 REST API endpoints, backend pytest suite (10/10 tests),
frontend AuditLedger modal tabs, agent and instruction documentation, zero emojis, and zero vendor leaks.
"""

import os
import sys
import json
import re
import subprocess
from pathlib import Path

PROJECT_ROOT = Path("/home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn")
BACKEND_DIR = PROJECT_ROOT / "backend"
APP_DIR = PROJECT_ROOT / "app"
SKILLS_JSON_PATH = Path("/home/Khalaf-Dev/.gemini/config/skills.json")
CYBER_SKILLS_PATH = Path("/home/Khalaf-Dev/Anthropic-Cybersecurity-Skills")

def check_1_global_repo_exists():
    print("[1/10] Checking global cybersecurity skills repository (818 skills)...")
    assert CYBER_SKILLS_PATH.exists(), f"Directory not found: {CYBER_SKILLS_PATH}"
    skills_dir = CYBER_SKILLS_PATH / "skills"
    assert skills_dir.exists(), f"Skills dir not found: {skills_dir}"
    
    skill_dirs = [d for d in skills_dir.iterdir() if d.is_dir() and (d / "SKILL.md").exists()]
    assert len(skill_dirs) >= 800, f"Expected at least 800 skills, found {len(skill_dirs)}"
    print(f"[PASS] 1. Global cybersecurity skills repository exists ({len(skill_dirs)} skills)")

def check_2_skills_json_registered():
    print("[2/10] Checking ~/.gemini/config/skills.json registration...")
    assert SKILLS_JSON_PATH.exists(), f"Config file not found: {SKILLS_JSON_PATH}"
    with open(SKILLS_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    entries = [e.get("path") for e in data.get("entries", [])]
    target_path = str(CYBER_SKILLS_PATH / "skills")
    assert target_path in entries, f"Path {target_path} not found in skills.json entries"
    print(f"[PASS] 2. cybersecurity-skills registered in skills.json (Total entries: {len(entries)})")

def check_3_project_symlink():
    print("[3/10] Checking project symlink in .github/skills/...")
    symlink_path = PROJECT_ROOT / ".github" / "skills" / "cybersecurity-skills"
    assert symlink_path.exists(), f"Symlink not found: {symlink_path}"
    assert symlink_path.is_symlink(), f"Path is not a symlink: {symlink_path}"
    resolved = symlink_path.resolve()
    assert resolved == (CYBER_SKILLS_PATH / "skills").resolve(), f"Symlink resolved to {resolved}"
    print(f"[PASS] 3. Project symlink valid -> {resolved}")

def check_4_framework_engine_evaluation():
    print("[4/10] Checking cybersecurity framework engine evaluation and canonical digest...")
    sys.path.insert(0, str(BACKEND_DIR))
    from app.engine.cybersecurity_framework_engine import CybersecurityFrameworkEngine
    engine = CybersecurityFrameworkEngine()
    
    # Test evaluation for all 5 fraud typologies
    typologies = ["PHANTOM_BILLING", "UPCODING", "GEOVELOCITY_COLLISION", "REPEAT_BILLING", "UNBUNDLING"]
    for t in typologies:
        res = engine.evaluate_claim_cybersecurity({
            "claim_id": "CLM-TEST-001",
            "indikator_anomali": [t],
            "faskes_code": "RS Test Verifikasi",
            "nominal_klaim_rp": 15000000.0
        })
        assert res["claim_id"] == "CLM-TEST-001"
        assert len(res["canonical_matrix_sha256"]) == 64
        assert len(res["d3fend_countermeasures"]) > 0
        assert len(res["f3_positioning"]) > 0
        assert len(res["f3_monetization"]) > 0
    print("[PASS] 4. Framework engine successfully evaluates typologies with 64-char SHA-256 seal")

def check_5_rest_api_endpoints():
    print("[5/10] Checking all 4 Cybersecurity REST API endpoints via TestClient...")
    sys.path.insert(0, str(BACKEND_DIR))
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    
    # 1. Summary
    r_sum = client.get("/api/v1/cybersecurity/frameworks/summary")
    assert r_sum.status_code == 200, f"Summary failed: {r_sum.status_code}"
    data_sum = r_sum.json()
    assert data_sum["f3_skills_count"] == 94
    assert data_sum["total_skills_count"] >= 800
    
    # 2. Fraud Catalog
    r_cat = client.get("/api/v1/cybersecurity/skills/fraud-catalog?limit=100")
    assert r_cat.status_code == 200, f"Catalog failed: {r_cat.status_code}"
    data_cat = r_cat.json()
    assert isinstance(data_cat, list)
    assert len(data_cat) == 94
    
    # 3. Claim Matrix
    r_mat = client.get("/api/v1/cybersecurity/claims/CLM-VERIFY-001/matrix")
    assert r_mat.status_code == 200, f"Matrix failed: {r_mat.status_code}"
    data_mat = r_mat.json()
    assert data_mat["claim_id"] == "CLM-VERIFY-001"
    assert len(data_mat["canonical_matrix_sha256"]) == 64
    
    # 4. Evaluate Claim
    r_eval = client.post("/api/v1/cybersecurity/claims/evaluate", json={
        "claim_id": "CLM-API-TEST",
        "fraud_typology": "GEOVELOCITY_COLLISION",
        "faskes_code": "RS Siloam Denpasar",
        "indikator_anomali": ["GEOVELOCITY_IMPOSSIBLE_TRAVEL"],
        "nominal_klaim_rp": 12500000.0
    })
    assert r_eval.status_code == 200, f"Evaluate failed: {r_eval.status_code}"
    data_eval = r_eval.json()
    assert data_eval["claim_id"] == "CLM-API-TEST"
    assert any(c["technique_id"] == "D3-NTA" for c in data_eval["d3fend_countermeasures"])
    
    print("[PASS] 5. All 4 Cybersecurity REST API endpoints verified via TestClient (200 OK)")

def check_6_pytest_suite():
    print("[6/10] Running pytest tests/test_cybersecurity_frameworks.py...")
    res = subprocess.run(
        ["python3", "-m", "pytest", "tests/test_cybersecurity_frameworks.py", "-q"],
        cwd=str(BACKEND_DIR),
        capture_output=True,
        text=True
    )
    assert res.returncode == 0, f"Pytest failed with code {res.returncode}:\n{res.stderr}\n{res.stdout}"
    assert "10 passed" in res.stdout, f"Expected 10 passed tests, got:\n{res.stdout}"
    print(f"[PASS] 6. Backend pytest suite verified (10 passed tests)")

def check_7_frontend_audit_ledger_ui():
    print("[7/10] Checking AuditLedger.jsx MITRE F3 & D3FEND integration...")
    ledger_path = APP_DIR / "src" / "components" / "Dashboard" / "AuditLedger.jsx"
    assert ledger_path.exists(), f"AuditLedger.jsx not found at {ledger_path}"
    content = ledger_path.read_text(encoding="utf-8")
    
    assert "MITRE F3 &amp; D3FEND Matrix" in content or "MITRE F3 & D3FEND Matrix" in content, "Toolbar button label missing"
    assert "showCyberModal" in content, "showCyberModal state missing"
    assert "cyberTab" in content, "cyberTab state missing"
    assert "Matriks Fraud Klaim (MITRE F3)" in content, "Tab 1 missing"
    assert "Mitigasi Bertahan (MITRE D3FEND)" in content, "Tab 2 missing"
    assert "Katalog 94 Skill F3" in content, "Tab 3 missing"
    assert "canonical_matrix_sha256" in content, "Canonical SHA-256 seal display missing"
    assert "aria-label=\"Tutup jendela matriks keamanan siber\"" in content, "Close button missing accessible aria-label"
    print("[PASS] 7. AuditLedger.jsx contains MITRE F3 & D3FEND button, modal console, and all 3 tabs")

def check_8_instructions_and_agent_docs():
    print("[8/10] Checking instructions, agent documentation, and copilot instructions...")
    inst_path = PROJECT_ROOT / ".github" / "instructions" / "cybersecurity-frameworks.instructions.md"
    agent_path = PROJECT_ROOT / ".github" / "agents" / "cybersecurity-fraud-auditor.agent.md"
    copilot_path = PROJECT_ROOT / ".github" / "copilot-instructions.md"
    
    assert inst_path.exists(), f"Instructions file missing: {inst_path}"
    assert agent_path.exists(), f"Agent file missing: {agent_path}"
    assert copilot_path.exists(), f"Copilot instructions missing: {copilot_path}"
    
    inst_text = inst_path.read_text(encoding="utf-8")
    agent_text = agent_path.read_text(encoding="utf-8")
    copilot_text = copilot_path.read_text(encoding="utf-8")
    
    assert "MITRE Fight Fraud Framework (F3 v1.1)" in inst_text, "Instructions missing F3 v1.1 reference"
    assert "MITRE D3FEND v1.4.0" in inst_text, "Instructions missing D3FEND v1.4.0 reference"
    assert "Cybersecurity Fraud Auditor" in agent_text, "Agent markdown missing agent name"
    assert "MITRE F3 / D3FEND Fraud Countermeasures" in copilot_text, "Copilot instructions missing section"
    print("[PASS] 8. Instructions, Agent markdown, and Copilot instructions verified")

def check_9_zero_emojis():
    print("[9/10] Checking zero emojis across modified and newly added files...")
    emoji_pattern = re.compile(r"[\U00010000-\U0010ffff]|[\u2600-\u27ff]|[\u2300-\u23ff]")
    files_to_check = [
        PROJECT_ROOT / ".github" / "instructions" / "cybersecurity-frameworks.instructions.md",
        PROJECT_ROOT / ".github" / "agents" / "cybersecurity-fraud-auditor.agent.md",
        PROJECT_ROOT / ".github" / "copilot-instructions.md",
        BACKEND_DIR / "app" / "engine" / "cybersecurity_framework_engine.py",
        BACKEND_DIR / "app" / "models" / "schemas.py",
        BACKEND_DIR / "app" / "main.py",
        BACKEND_DIR / "tests" / "test_cybersecurity_frameworks.py",
        APP_DIR / "src" / "components" / "Dashboard" / "AuditLedger.jsx",
        PROJECT_ROOT / "scripts" / "verify_claimtrace_cybersecurity_skills_stack.py"
    ]
    for p in files_to_check:
        if p.exists() and not p.is_symlink():
            content = p.read_text(encoding="utf-8")
            matches = emoji_pattern.findall(content)
            assert not matches, f"Emojis found in {p}: {matches[:5]}"
    print("[PASS] 9. Zero emojis verified across all target files")

def check_10_zero_vendor_leaks():
    print("[10/10] Checking zero proprietary AI / vendor leaks...")
    vendor_pattern = re.compile(
        r"\b(Anthropic|Claude|OpenAI|ChatGPT|GPT-3|GPT-4|Mistral|Llama|Pinecone|Weaviate|Qdrant|Milvus)\b",
        re.IGNORECASE
    )
    files_to_check = [
        PROJECT_ROOT / ".github" / "instructions" / "cybersecurity-frameworks.instructions.md",
        PROJECT_ROOT / ".github" / "agents" / "cybersecurity-fraud-auditor.agent.md",
        PROJECT_ROOT / ".github" / "copilot-instructions.md",
        BACKEND_DIR / "app" / "engine" / "cybersecurity_framework_engine.py",
        BACKEND_DIR / "app" / "models" / "schemas.py",
        BACKEND_DIR / "app" / "main.py",
        BACKEND_DIR / "tests" / "test_cybersecurity_frameworks.py",
        APP_DIR / "src" / "components" / "Dashboard" / "AuditLedger.jsx"
    ]
    for p in files_to_check:
        if p.exists() and not p.is_symlink():
            content = p.read_text(encoding="utf-8")
            matches = vendor_pattern.findall(content)
            assert not matches, f"Vendor leak detected in {p}: {matches}"
    print("[PASS] 10. Zero proprietary AI / vendor leaks verified across all files")

def main():
    print("=" * 60)
    print("CLAIMTRACE JKN - CYBERSECURITY SKILLS & MITRE F3/D3FEND VERIFICATION")
    print("=" * 60)
    
    check_1_global_repo_exists()
    check_2_skills_json_registered()
    check_3_project_symlink()
    check_4_framework_engine_evaluation()
    check_5_rest_api_endpoints()
    check_6_pytest_suite()
    check_7_frontend_audit_ledger_ui()
    check_8_instructions_and_agent_docs()
    check_9_zero_emojis()
    check_10_zero_vendor_leaks()
    
    print("=" * 60)
    print("RESULT: 10/10 CHECKS PASSED")
    print("=" * 60)

if __name__ == "__main__":
    main()
