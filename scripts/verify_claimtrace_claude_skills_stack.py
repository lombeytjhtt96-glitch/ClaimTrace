"""
Claude Skills & Decision Receipts Stack Verification for ClaimTrace JKN.
Verifies global installation of alirezarezvani/claude-skills, skills.json registration,
Agent Decision Receipts (ISO 27001 / RA-QM), Human Gate review protocols (Permenkes 26/2021),
offline cryptographic verifiability, REST API endpoints, and quality gates.
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
    print("CLAIMTRACE JKN - CLAUDE SKILLS & RECEIPTS VERIFICATION")
    print("==================================================")

    # 1. Global Repository Installation
    claude_repo = "/home/Khalaf-Dev/claude-skills"
    subdirs = [".gemini", "ra-qm-team", "engineering", "compliance-os", "finance"]
    all_subdirs_exist = all(os.path.isdir(os.path.join(claude_repo, d)) for d in subdirs)
    
    total_skills = 0
    if os.path.isdir(claude_repo):
        for root, dirs, files in os.walk(claude_repo):
            if "SKILL.md" in files:
                total_skills += 1

    if all_subdirs_exist and total_skills >= 450:
        print(f"[PASS] 1. Global claude-skills repository exists ({total_skills} skills across all domains)")
        checks_passed += 1
    else:
        print(f"[FAIL] 1. Global claude-skills repository invalid: subdirs_exist={all_subdirs_exist}, total={total_skills}")

    # 2. Global Skills Registry
    registry_path = "/home/Khalaf-Dev/.gemini/config/skills.json"
    try:
        with open(registry_path, "r", encoding="utf-8") as f:
            registry = json.load(f)
        entries = registry.get("entries", registry.get("skills", []))
        claude_entries = [item for item in entries if "claude-skills" in item.get("path", "")]
        if len(claude_entries) >= 7 and len(entries) >= 57:
            print(f"[PASS] 2. claude-skills registered in ~/.gemini/config/skills.json ({len(entries)} total entries, {len(claude_entries)} claude paths)")
            checks_passed += 1
        else:
            print(f"[FAIL] 2. Incomplete registration in skills.json: total={len(entries)}, claude={len(claude_entries)}")
    except Exception as e:
        print(f"[FAIL] 2. Error reading skills.json: {e}")

    # 3. Project Symlinks
    symlink_path = os.path.abspath(".github/skills/claude-skills")
    if os.path.islink(symlink_path) and os.path.exists(symlink_path):
        target = os.readlink(symlink_path)
        print(f"[PASS] 3. Project symlink .github/skills/claude-skills is valid -> {target}")
        checks_passed += 1
    else:
        print("[FAIL] 3. Project symlink .github/skills/claude-skills invalid or missing")

    # 4. Engine & Schemas Integrity
    try:
        sys.path.insert(0, os.path.abspath("backend"))
        from app.engine.decision_receipts_engine import (
            mint_decision_receipt,
            verify_decision_receipt,
            apply_human_gate_review,
            compute_batch_receipts_manifest,
            list_all_decision_receipts,
            get_decision_receipt
        )
        from app.models.schemas import (
            DecisionReceiptItem,
            MintReceiptRequest,
            HumanGateReviewRequest,
            ReceiptVerificationResponse,
            BatchReceiptsManifest
        )

        test_rcp = mint_decision_receipt(
            agent_id="test-agent",
            operation="FLAG_FRAUD",
            target="CLM-TEST-CHECK",
            policy="Perpres No. 82/2018",
            decision_label="PHANTOM_BILLING",
            inputs={"surge": 4.0},
            severity="CRITICAL",
            tgr_recovery_amount_rp=10000000.0
        )
        assert len(test_rcp["canonical_digest_sha256"]) == 64
        assert len(test_rcp["digital_seal"]) == 64
        assert test_rcp["manifest"]["human_gate_status"] == "PENDING_REVIEW"

        ver = verify_decision_receipt(test_rcp)
        assert ver["tamper_free"] is True
        assert ver["is_executable"] is False

        # Apply human review
        updated = apply_human_gate_review(
            receipt=test_rcp,
            verifikator_nip="198504122010121001",
            verifikator_name="Dr. Budi Santoso",
            approved=True
        )
        assert updated["manifest"]["human_gate_status"] == "HUMAN_VERIFIED"
        assert verify_decision_receipt(updated)["is_executable"] is True

        manifest = compute_batch_receipts_manifest()
        assert len(manifest["master_manifest_seal_sha256"]) == 64

        print(f"[PASS] 4. Backend engine and schemas verified (minting, canonical digest, human gate, batch manifest)")
        checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 4. Backend engine verification failed: {e}")

    # 5. REST API Endpoints via TestClient
    try:
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)

        # 1. GET /receipts
        r_list = client.get("/api/v1/receipts")
        assert r_list.status_code == 200, f"GET /receipts failed: {r_list.status_code}"
        receipts_data = r_list.json()
        assert len(receipts_data) >= 4, f"Expected at least 4 receipts, got {len(receipts_data)}"

        # 2. GET /receipts/manifest/verify
        r_man = client.get("/api/v1/receipts/manifest/verify")
        assert r_man.status_code == 200, f"GET /receipts/manifest/verify failed: {r_man.status_code}"
        assert len(r_man.json()["master_manifest_seal_sha256"]) == 64

        # 3. GET /receipts/{id}
        sample_id = receipts_data[0]["receipt_id"]
        r_single = client.get(f"/api/v1/receipts/{sample_id}")
        assert r_single.status_code == 200, f"GET /receipts/id failed: {r_single.status_code}"

        # 4. POST /receipts/mint
        r_mint = client.post("/api/v1/receipts/mint", json={
            "agent_id": "test-agent-api",
            "operation": "FLAG_FRAUD",
            "target": "CLM-VERIFY-001 - RS Uji",
            "policy": "Perpres No. 82/2018 Pasal 76",
            "decision_label": "SURGICAL_UNBUNDLING",
            "inputs": {"code": "47.01"},
            "severity": "HIGH",
            "tgr_recovery_amount_rp": 5000000.0,
            "claim_id": "CLM-VERIFY-001",
            "faskes_name": "RS Uji"
        })
        assert r_mint.status_code == 200, f"POST /receipts/mint failed: {r_mint.status_code}"
        new_rcp = r_mint.json()
        new_id = new_rcp["receipt_id"]

        # 5. POST /receipts/{id}/verify
        r_ver = client.post(f"/api/v1/receipts/{new_id}/verify")
        assert r_ver.status_code == 200, f"POST /receipts/id/verify failed: {r_ver.status_code}"
        assert r_ver.json()["tamper_free"] is True

        # 6. POST /receipts/{id}/human-gate
        r_gate = client.post(f"/api/v1/receipts/{new_id}/human-gate", json={
            "verifikator_nip": "198801012012121001",
            "verifikator_name": "Verifikator Resmi BPJS",
            "approved": True
        })
        assert r_gate.status_code == 200, f"POST /receipts/id/human-gate failed: {r_gate.status_code}"
        assert r_gate.json()["manifest"]["human_gate_status"] == "HUMAN_VERIFIED"

        print("[PASS] 5. All 6 Decision Receipts REST API endpoints verified via FastAPI TestClient (200 OK)")
        checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 5. REST API endpoint verification failed: {e}")

    # 6. Pytest Unit Tests Suite
    try:
        res = subprocess.run(
            ["python3", "-m", "pytest", "tests/test_decision_receipts.py", "-q"],
            cwd=os.path.abspath("backend"),
            capture_output=True,
            text=True,
        )
        if res.returncode == 0 and "10 passed" in res.stdout:
            print("[PASS] 6. Backend Decision Receipts unit test suite passed (10/10 tests)")
            checks_passed += 1
        else:
            print(f"[FAIL] 6. Pytest test_decision_receipts.py failed:\n{res.stdout}\n{res.stderr}")
    except Exception as e:
        print(f"[FAIL] 6. Error running pytest: {e}")

    # 7. Frontend Integration in AuditLedger.jsx
    comp_file = "app/src/components/Dashboard/AuditLedger.jsx"
    try:
        with open(comp_file, "r", encoding="utf-8") as f:
            code = f.read()
        indicators = [
            "Decision Receipts &amp; Human Gate",
            "showReceiptsModal",
            "receiptsTab",
            "receiptsList",
            "selectedReceipt",
            "receiptsManifest",
            "receiptVerifyResult",
            "gateNip",
            "OpenAgentOntology",
            "Permenkes No. 26/2021",
        ]
        all_indicators_present = all(ind in code for ind in indicators)
        if all_indicators_present:
            print("[PASS] 7. Frontend AuditLedger.jsx verified (Receipts modal, tabs, offline verify, Human Gate NIP)")
            checks_passed += 1
        else:
            missing = [ind for ind in indicators if ind not in code]
            print(f"[FAIL] 7. Missing indicators in {comp_file}: {missing}")
    except Exception as e:
        print(f"[FAIL] 7. Error reading {comp_file}: {e}")

    # 8. Instructions & Agent Files
    inst_file = ".github/instructions/claude-skills-receipts.instructions.md"
    agent_file = ".github/agents/decision-receipts-auditor.agent.md"
    if os.path.isfile(inst_file) and os.path.isfile(agent_file):
        with open(inst_file, "r", encoding="utf-8") as f:
            inst_text = f.read()
        with open(agent_file, "r", encoding="utf-8") as f:
            agent_text = f.read()
        
        has_reqs = "agent-decision-receipts" in inst_text and "human-gate" in inst_text and "Permenkes No. 26/2021" in agent_text
        if has_reqs:
            print("[PASS] 8. Instructions and Agent markdown files verified with RA-QM and Human Gate standards")
            checks_passed += 1
        else:
            print("[FAIL] 8. Instruction or Agent file missing required standards")
    else:
        print("[FAIL] 8. Missing instruction or agent file")

    # 9. Zero Emojis Quality Gate
    files_to_scan = [
        "app/src/components/Dashboard/AuditLedger.jsx",
        "backend/app/engine/decision_receipts_engine.py",
        "backend/app/models/schemas.py",
        "backend/tests/test_decision_receipts.py",
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
