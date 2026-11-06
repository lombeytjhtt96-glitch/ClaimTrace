"""
Google Skills & SecOps Detection Engineering Stack Verification for ClaimTrace JKN.
Verifies global installation, registry mapping, YARA-L 2.0 rules, SOAR incident lifecycles,
UU PDP No. 27/2022 sovereignty compliance, REST API endpoints, and quality gates.
"""

import os
import re
import json
import subprocess
import sys

def run_checks():
    checks_passed = 0
    total_checks = 10

    print("==================================================")
    print("CLAIMTRACE JKN - GOOGLE SKILLS & SECOPS VERIFICATION")
    print("==================================================")

    # 1. Global Repository Installation
    google_repo = "/home/Khalaf-Dev/google-skills"
    subdirs = ["cloud", "identity", "developers", "analytics", "ads"]
    all_subdirs_exist = all(os.path.isdir(os.path.join(google_repo, "skills", d)) for d in subdirs)
    
    total_skills = 0
    if os.path.isdir(google_repo):
        for root, dirs, files in os.walk(google_repo):
            if "SKILL.md" in files:
                total_skills += 1

    if all_subdirs_exist and total_skills >= 180:
        print(f"[PASS] 1. Global google-skills repository exists ({total_skills} skills across 5 categories)")
        checks_passed += 1
    else:
        print(f"[FAIL] 1. Global google-skills repository invalid: subdirs_exist={all_subdirs_exist}, total={total_skills}")

    # 2. Global Skills Registry
    registry_path = "/home/Khalaf-Dev/.gemini/config/skills.json"
    try:
        with open(registry_path, "r", encoding="utf-8") as f:
            registry = json.load(f)
        entries = registry.get("entries", registry.get("skills", []))
        google_entries = [item for item in entries if "google-skills" in item.get("path", "")]
        if len(google_entries) >= 5 and len(entries) >= 50:
            print(f"[PASS] 2. google-skills registered in ~/.gemini/config/skills.json ({len(entries)} total entries, {len(google_entries)} google paths)")
            checks_passed += 1
        else:
            print(f"[FAIL] 2. Incomplete registration in skills.json: total={len(entries)}, google={len(google_entries)}")
    except Exception as e:
        print(f"[FAIL] 2. Error reading skills.json: {e}")

    # 3. Project Symlinks
    symlink_path = os.path.abspath(".github/skills/google-skills")
    if os.path.islink(symlink_path) and os.path.exists(symlink_path):
        target = os.readlink(symlink_path)
        print(f"[PASS] 3. Project symlink .github/skills/google-skills is valid -> {target}")
        checks_passed += 1
    else:
        print("[FAIL] 3. Project symlink .github/skills/google-skills invalid or missing")

    # 4. Engine & Schemas Integrity
    try:
        sys.path.insert(0, os.path.abspath("backend"))
        from app.engine.google_secops_engine import (
            PRECOMPILED_YARA_L_RULES,
            validate_yara_l_syntax,
            compile_dynamic_yara_l_rule,
            generate_secops_cases,
            generate_sovereignty_assessment_report,
        )

        assert len(PRECOMPILED_YARA_L_RULES) == 5, f"Expected 5 rules, got {len(PRECOMPILED_YARA_L_RULES)}"
        
        # Test compiler
        compile_res = compile_dynamic_yara_l_rule(
            rule_name="jkn_custom_phantom_surge",
            description="Testing dynamic compiler",
            severity="Critical",
            cbg_codes=["Z-3-12-0"],
            threshold_count=15,
            time_window_hours=24
        )
        assert compile_res["syntax_valid"] is True, "Dynamic rule failed syntax validation"
        
        # Test SOAR cases & sovereignty report with sample mock data
        mock_claims = [
            {
                "claim_id": "CLM-MOCK-001",
                "nama_faskes": "RS Mock Husada",
                "nilai_klaim_rp": 15000000,
                "ina_cbg_code": "Z-3-12-0",
                "tanggal_layanan": "2026-10-14",
                "icd10_primary": "M54.5",
                "s1_score": 90.0,
                "s2_score": 85.0,
                "s3_score": 75.0
            }
        ]
        manifest = generate_secops_cases(mock_claims)
        assert manifest["total_cases"] >= 1, "SOAR case generator produced insufficient cases"
        
        report = generate_sovereignty_assessment_report()
        assert report["overall_compliance_status"] == "CERTIFIED_SOVEREIGN", "Sovereignty status not compliant"

        print(f"[PASS] 4. Backend engine and schemas verified (5 precompiled rules, dynamic compilation, SOAR generator)")
        checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 4. Backend engine verification failed: {e}")

    # 5. REST API Endpoints via TestClient
    try:
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)

        # GET /rules
        r_rules = client.get("/api/v1/secops/rules")
        assert r_rules.status_code == 200, f"GET /rules failed: {r_rules.status_code}"
        rules_data = r_rules.json()
        assert len(rules_data) == 5, f"Expected 5 rules from API, got {len(rules_data)}"

        # GET /rules/{id}
        r_rule1 = client.get("/api/v1/secops/rules/YARA-L-JKN-001")
        assert r_rule1.status_code == 200, f"GET /rules/id failed: {r_rule1.status_code}"

        # POST /rules/compile
        r_compile = client.post("/api/v1/secops/rules/compile", json={
            "rule_name": "API Test Rule",
            "description": "API verification compilation",
            "severity": "Critical",
            "cbg_codes": ["Z-3-12-0"],
            "threshold_count": 5,
            "time_window_hours": 12
        })
        assert r_compile.status_code == 200, f"POST /rules/compile failed: {r_compile.status_code}"

        # GET /cases
        r_cases = client.get("/api/v1/secops/cases")
        assert r_cases.status_code == 200, f"GET /cases failed: {r_cases.status_code}"

        # GET /cases/{id}
        r_case1 = client.get("/api/v1/secops/cases/CLM-2026-8801")
        assert r_case1.status_code == 200, f"GET /cases/id failed: {r_case1.status_code}"

        # GET /sovereignty/assessment
        r_sov = client.get("/api/v1/secops/sovereignty/assessment")
        assert r_sov.status_code == 200, f"GET /sovereignty/assessment failed: {r_sov.status_code}"

        print("[PASS] 5. All 6 SecOps REST API endpoints verified via FastAPI TestClient (200 OK)")
        checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 5. REST API endpoint verification failed: {e}")

    # 6. Pytest Unit Tests Suite
    try:
        res = subprocess.run(
            ["python3", "-m", "pytest", "tests/test_secops_engine.py", "-q"],
            cwd=os.path.abspath("backend"),
            capture_output=True,
            text=True,
        )
        if res.returncode == 0 and "10 passed" in res.stdout:
            print("[PASS] 6. Backend SecOps unit test suite passed (10/10 tests)")
            checks_passed += 1
        else:
            print(f"[FAIL] 6. Pytest test_secops_engine.py failed:\n{res.stdout}\n{res.stderr}")
    except Exception as e:
        print(f"[FAIL] 6. Error running pytest: {e}")

    # 7. Frontend Integration in AuditLedger.jsx
    comp_file = "app/src/components/Dashboard/AuditLedger.jsx"
    try:
        with open(comp_file, "r", encoding="utf-8") as f:
            code = f.read()
        indicators = [
            "Google SecOps",
            "showSecOpsModal",
            "secopsTab",
            "secopsRules",
            "secopsCases",
            "secopsSovereignty",
            "Perpres No. 82/2018",
            "UU PDP No. 27/2022",
        ]
        all_indicators_present = all(ind in code for ind in indicators)
        if all_indicators_present:
            print("[PASS] 7. Frontend AuditLedger.jsx verified (SecOps modal, tabs, YARA-L viewer, SOAR SLA)")
            checks_passed += 1
        else:
            missing = [ind for ind in indicators if ind not in code]
            print(f"[FAIL] 7. Missing indicators in {comp_file}: {missing}")
    except Exception as e:
        print(f"[FAIL] 7. Error reading {comp_file}: {e}")

    # 8. Instructions & Agent Files
    inst_file = ".github/instructions/google-secops.instructions.md"
    agent_file = ".github/agents/google-secops-auditor.agent.md"
    if os.path.isfile(inst_file) and os.path.isfile(agent_file):
        with open(inst_file, "r", encoding="utf-8") as f:
            inst_text = f.read()
        with open(agent_file, "r", encoding="utf-8") as f:
            agent_text = f.read()
        
        has_reqs = "YARA-L 2.0" in inst_text and "Perpres No. 82/2018" in inst_text and "UU PDP No. 27/2022" in agent_text
        if has_reqs:
            print("[PASS] 8. Instructions and Agent markdown files verified with SecOps and Indonesian legal standards")
            checks_passed += 1
        else:
            print("[FAIL] 8. Instruction or Agent file missing required standards")
    else:
        print("[FAIL] 8. Missing instruction or agent file")

    # 9. Zero Emojis Quality Gate
    files_to_scan = [
        "app/src/components/Dashboard/AuditLedger.jsx",
        "backend/app/engine/google_secops_engine.py",
        "backend/app/models/schemas.py",
        "backend/tests/test_secops_engine.py",
        inst_file,
        agent_file,
        ".github/copilot-instructions.md"
    ]
    emoji_pattern = re.compile(r"[\U00010000-\U0010ffff]", re.UNICODE)
    emoji_free = True
    for path in files_to_scan:
        if os.path.isfile(path):
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            matches = emoji_pattern.findall(content)
            if matches:
                emoji_free = False
                print(f"[FAIL] 9. Emojis detected in {path}: {matches}")
    if emoji_free:
        print("[PASS] 9. Zero emojis verified across all modified and newly added files")
        checks_passed += 1

    # 10. Zero Vendor Leaks Gate (Proprietary AI and external vector DBs)
    vendor_pattern = re.compile(r"\b(Anthropic|Claude|OpenAI|GPT-3|GPT-4|Mistral|Llama|Pinecone|Weaviate|Qdrant|Milvus)\b", re.IGNORECASE)
    vendor_free = True
    for path in files_to_scan:
        if os.path.isfile(path):
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            matches = vendor_pattern.findall(content)
            if matches:
                vendor_free = False
                print(f"[FAIL] 10. Vendor leak detected in {path}: {matches}")
    if vendor_free:
        print("[PASS] 10. Zero proprietary AI / vendor leaks verified across all files")
        checks_passed += 1

    print("==================================================")
    print(f"RESULT: {checks_passed}/{total_checks} CHECKS PASSED")
    print("==================================================")

    return checks_passed == total_checks

if __name__ == "__main__":
    success = run_checks()
    sys.exit(0 if success else 1)
