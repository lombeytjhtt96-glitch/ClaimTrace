#!/usr/bin/env python3
"""
scripts/verify_claimtrace_huggingface_skills_stack.py

End-to-End Stack Verification for Hugging Face Skills Integration in ClaimTrace JKN:
1. Hugging Face Skills Installation Manifest (~/.agents/skills/ & ~/.gemini/config/skills/)
2. Hugging Face Hub CLI (hf) Binary and Environment Validation
3. Backend ChromaDB & Hugging Face all-MiniLM-L6-v2 384d Local Embeddings
4. Clinical Claim Semantic Plagiarism Audit (IND-SEM-COPYPASTE & Modus #6 Phantom Billing)
5. Custom Clinical Text Vector Matching
6. Pairwise Cluster Semantic Matrix Computation
7. Zero-PHI Regulatory Compliance Check (UU PDP No. 27/2022 & Perpres No. 82/2018)
"""

import sys
import os
import subprocess
import json
import urllib.request
from pathlib import Path

def main():
    print("=" * 65)
    print("CLAIMTRACE JKN - HUGGING FACE SKILLS STACK VERIFICATION")
    print("=" * 65)

    checks_passed = 0
    total_checks = 7

    # 1. Hugging Face Skills Directory Verification
    skills_dir = Path("/home/Khalaf-Dev/.agents/skills")
    required_skills = [
        "hf-cli",
        "transformers-js",
        "train-sentence-transformers",
        "huggingface-local-models",
        "huggingface-datasets",
        "trl-training"
    ]
    missing_skills = [s for s in required_skills if not (skills_dir / s / "SKILL.md").exists()]
    if not missing_skills:
        print(f"[PASS] 1. Hugging Face Agent Skills Registered: {len(required_skills)} core skills verified")
        checks_passed += 1
    else:
        print(f"[FAIL] 1. Missing Hugging Face Skills: {missing_skills}")

    # 2. Hugging Face Hub CLI (hf) Binary Check
    hf_bin = Path("/home/Khalaf-Dev/.local/bin/hf")
    if hf_bin.exists() and os.access(hf_bin, os.X_OK):
        try:
            res = subprocess.run([str(hf_bin), "version"], capture_output=True, text=True, check=True)
            version_str = res.stdout.strip()
            print(f"[PASS] 2. Hugging Face Hub CLI Ready: {version_str} at {hf_bin}")
            checks_passed += 1
        except Exception as e:
            print(f"[FAIL] 2. HF CLI execution error: {e}")
    else:
        print(f"[FAIL] 2. HF CLI binary not found at {hf_bin}")

    # 3. Backend Hugging Face Semantic Engine Stats
    try:
        with urllib.request.urlopen("http://localhost:8000/api/v1/semantic/stats", timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data["status"] == "ONLINE_ACTIVE"
            assert "all-MiniLM-L6-v2" in data["model"]
            assert data["total_documents"] >= 6
            print(f"[PASS] 3. Backend Semantic Engine Online: {data['model']} ({data['total_documents']} documents indexed)")
            checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 3. Backend Semantic Engine: {e}")

    # 4. Clinical Claim Semantic Plagiarism Audit
    try:
        with urllib.request.urlopen("http://localhost:8000/api/v1/semantic/verify-claim/CLM-2026-8801", timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data["is_plagiarized"] is True
            assert data["max_similarity_pct"] == 100.0
            assert data["signal_code"] == "IND-SEM-COPYPASTE"
            print(f"[PASS] 4. Plagiarism Detection Verified: {data['signal_code']} ({data['max_similarity_pct']}% match detected)")
            checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 4. Plagiarism Detection: {e}")

    # 5. Live Custom Clinical Text Vector Matching
    try:
        req_data = json.dumps({
            "text": "Pasien mengeluh nyeri punggung bawah Low Back Pain menjalar ke paha kanan fisioterapi serial 5 sesi",
            "top_k": 3
        }).encode("utf-8")
        req = urllib.request.Request(
            "http://localhost:8000/api/v1/semantic/verify-text",
            data=req_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data["total_matches"] >= 1
            assert data["highest_similarity_pct"] > 60.0
            print(f"[PASS] 5. Custom Text Matching: Highest similarity {data['highest_similarity_pct']}% across {data['total_matches']} candidates")
            checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 5. Custom Text Matching: {e}")

    # 6. Pairwise Cluster Matrix Computation
    try:
        with urllib.request.urlopen("http://localhost:8000/api/v1/semantic/cluster-matrix/CLS-PHANTOM-85", timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data["is_mass_clone_detected"] is True
            assert len(data["matrix"]) >= 3
            print(f"[PASS] 6. Cluster Semantic Matrix: Mass cloning confirmed for {data['cluster_id']} ({len(data['matrix'])}x{len(data['matrix'])})")
            checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 6. Cluster Semantic Matrix: {e}")

    # 7. Zero-PHI Architecture & Regulatory Compliance
    try:
        with urllib.request.urlopen("http://localhost:8000/api/v1/secops/sovereignty/assessment", timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data["overall_compliance_status"] == "CERTIFIED_SOVEREIGN"
            assert data["phi_protection_level"] == "RESTRICTED_PSEUDONYMIZED"
            print(f"[PASS] 7. Zero-PHI Regulatory Compliance: {data['framework']} ({data['compliant_controls']}/{data['total_controls_audited']} Controls COMPLIANT)")
            checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 7. Zero-PHI Compliance: {e}")

    print("=" * 65)
    print(f"VERIFICATION SUMMARY: {checks_passed}/{total_checks} CHECKS PASSED")
    print("=" * 65)

    if checks_passed == total_checks:
        print("RESULT: ALL HUGGING FACE SKILLS & PIPELINES OPERATIONAL FOR CLAIMTRACE.")
        return 0
    else:
        print("RESULT: VERIFICATION HAD FAILURES.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
