"""
Unit and Integration Tests for Google SecOps Detection Engineering & SOAR Engine
Applies patterns from google/skills:
- secops-detection-engineering (YARA-L 2.0 validation, UDM testing)
- secops-cases (SOAR incident case lifecycle, SLA calculations)
- assuredworkloads-environment-assessor (Sovereignty compliance per UU PDP 27/2022)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine.google_secops_engine import (
    PRECOMPILED_YARA_L_RULES,
    validate_yara_l_syntax,
    compile_dynamic_yara_l_rule,
    generate_secops_cases,
    generate_sovereignty_assessment_report
)

client = TestClient(app)

def test_precompiled_rules_validity():
    """Verifies that all precompiled YARA-L 2.0 rules have valid syntax."""
    assert len(PRECOMPILED_YARA_L_RULES) >= 5
    for r in PRECOMPILED_YARA_L_RULES:
        val = validate_yara_l_syntax(r["rule_text"])
        assert val["valid"] is True, f"Rule {r['rule_name']} invalid: {val['errors']}"
        assert r["meta"]["author"] is not None
        assert r["meta"]["severity"] in ["Critical", "High", "Medium", "Low"]
        assert "rule " in r["rule_text"]
        assert "events:" in r["rule_text"]
        assert "condition:" in r["rule_text"]

def test_dynamic_yara_l_compilation():
    """Verifies dynamic synthesis of YARA-L 2.0 rules from custom triage parameters."""
    res = compile_dynamic_yara_l_rule(
        rule_name="jkn_custom_hemodialysis_surge",
        description="Deteksi lonjakan klaim hemodialisis tanpa verifikasi sidik jari",
        severity="Critical",
        cbg_codes=["N-3-10-0", "Z49.1"],
        threshold_count=20,
        time_window_hours=12
    )
    assert res["syntax_valid"] is True
    assert res["rule_name"] == "jkn_custom_hemodialysis_surge"
    assert "N-3-10-0" in res["rule_text"]
    assert "#claim >= 20" in res["rule_text"]
    assert "over 12h" in res["rule_text"]

def test_secops_cases_generation():
    """Verifies SecOps SOAR case generation, SLA tracking, and SHA-256 integrity."""
    mock_claims = [
        {
            "claim_id": "CLM-2026-8801",
            "nama_faskes": "RS Khusus Mitra Husada",
            "nilai_klaim_rp": 15300000,
            "ina_cbg_code": "Z-3-12-0",
            "tanggal_layanan": "2026-10-14",
            "icd10_primary": "M54.5",
            "s1_score": 85.0,
            "s2_score": 95.0,
            "s3_score": 80.0
        },
        {
            "claim_id": "CLM-2026-8804",
            "nama_faskes": "Klinik Pratama Hemodialisis",
            "nilai_klaim_rp": 1020000,
            "ina_cbg_code": "N-3-10-0",
            "tanggal_layanan": "2026-10-17",
            "icd10_primary": "N18.5",
            "s1_score": 20.0,
            "s2_score": 15.0,
            "s3_score": 10.0
        }
    ]
    manifest = generate_secops_cases(mock_claims)
    assert manifest["total_cases"] == 2
    assert manifest["critical_cases"] == 1
    assert len(manifest["integrity_seal"]) == 64
    
    crit_case = manifest["cases"][0]
    assert crit_case["claim_id"] == "CLM-2026-8801"
    assert crit_case["severity"] == "CRITICAL"
    assert crit_case["priority"] == "HIGH"
    assert "FA0001" in crit_case["mitre_f3_tags"]

def test_sovereignty_assessment_report():
    """Verifies Indonesian health data boundary compliance (UU PDP No. 27/2022)."""
    rep = generate_sovereignty_assessment_report()
    assert rep["overall_compliance_status"] == "CERTIFIED_SOVEREIGN"
    assert rep["data_residency_region"] == "asia-southeast2 (Jakarta, Indonesia)"
    assert rep["total_controls_audited"] == 4
    assert rep["compliant_controls"] == 4
    assert len(rep["sovereign_seal_sha256"]) == 64

def test_api_list_secops_rules():
    """Integration test for GET /api/v1/secops/rules."""
    res = client.get("/api/v1/secops/rules")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5
    rule_names = [r["rule_name"] for r in data]
    assert "jkn_phantom_billing_cluster" in rule_names
    assert "jkn_inactive_dpjp_credential_abuse" in rule_names

def test_api_get_secops_rule_by_id():
    """Integration test for GET /api/v1/secops/rules/{rule_id}."""
    res = client.get("/api/v1/secops/rules/YARA-L-JKN-001")
    assert res.status_code == 200
    data = res.json()
    assert data["rule_id"] == "YARA-L-JKN-001"
    assert data["syntax_validation"]["valid"] is True

def test_api_compile_secops_rule():
    """Integration test for POST /api/v1/secops/rules/compile."""
    payload = {
        "rule_name": "test_rule_katarak_upcoding",
        "description": "Deteksi klaim fakoemulsifikasi tanpa visus",
        "severity": "High",
        "cbg_codes": ["H-2-36-0"],
        "threshold_count": 10,
        "time_window_hours": 24
    }
    res = client.post("/api/v1/secops/rules/compile", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["syntax_valid"] is True
    assert "H-2-36-0" in data["rule_text"]

def test_api_list_secops_cases():
    """Integration test for GET /api/v1/secops/cases."""
    res = client.get("/api/v1/secops/cases")
    assert res.status_code == 200
    data = res.json()
    assert data["spec_version"] == "1.2.0-secops"
    assert data["total_cases"] >= 6
    assert data["critical_cases"] >= 1

def test_api_get_secops_case_detail():
    """Integration test for GET /api/v1/secops/cases/CLM-2026-8801."""
    res = client.get("/api/v1/secops/cases/CLM-2026-8801")
    assert res.status_code == 200
    data = res.json()
    assert data["claim_id"] == "CLM-2026-8801"
    assert data["severity"] == "CRITICAL"
    assert "RS Khusus Mitra Husada" in data["hospital"]

def test_api_sovereignty_assessment():
    """Integration test for GET /api/v1/secops/sovereignty/assessment."""
    res = client.get("/api/v1/secops/sovereignty/assessment")
    assert res.status_code == 200
    data = res.json()
    assert data["overall_compliance_status"] == "CERTIFIED_SOVEREIGN"
    assert "Jakarta" in data["data_residency_region"]
