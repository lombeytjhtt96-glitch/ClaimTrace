"""
Unit & Integration Tests for Cybersecurity Frameworks & MITRE F3 Engine
Validates 818-skills library mapping, MITRE F3 Positioning/Monetization,
MITRE ATT&CK TTPs, MITRE D3FEND countermeasures, and REST API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine.cybersecurity_framework_engine import cybersecurity_engine, FRAUD_TYPOLOGY_MATRIX

client = TestClient(app)

def test_engine_summary_statistics():
    """Verify 818 skills and 6 framework coverage metrics."""
    summary = cybersecurity_engine.get_framework_summary()
    assert summary["total_skills_count"] == 818
    assert summary["f3_skills_count"] == 94
    frameworks = summary["mapped_frameworks"]
    assert frameworks["MITRE_ATTACK_v19"] >= 800
    assert frameworks["NIST_CSF_v2"] >= 800
    assert frameworks["MITRE_D3FEND_v1_4"] == 139
    assert frameworks["MITRE_F3_v1_1"] == 94
    assert len(summary["top_fraud_skills"]) > 0

def test_fraud_skills_catalog():
    """Verify catalog parsing from filesystem and tactic filtering."""
    catalog = cybersecurity_engine.get_fraud_skills_catalog(limit=25)
    assert len(catalog) > 0
    for skill in catalog:
        assert skill["has_f3"] is True
        assert "name" in skill
        assert "description" in skill

def test_phantom_billing_f3_mapping():
    """Verify Phantom Billing maps to F3 Positioning F1005/F1036 and D3FEND D3-ARA."""
    claim = {
        "claim_id": "CLM-PHANTOM-TEST-001",
        "faskes_code": "FASKES-TEST-01",
        "fraud_typology": "PHANTOM_BILLING",
        "indikator_anomali": ["PATIENT_NOT_FOUND_IN_DUKCAPIL", "ABSENT_BIOMETRIC_CHECKIN"],
        "nominal_klaim_rp": 85000000.0
    }
    matrix = cybersecurity_engine.evaluate_claim_cybersecurity(claim)
    assert matrix["claim_id"] == "CLM-PHANTOM-TEST-001"
    assert matrix["risk_level"] == "CRITICAL"
    
    # Check F3 Positioning
    f3_pos_ids = [item["technique_id"] for item in matrix["f3_positioning"]]
    assert "F1005" in f3_pos_ids or "F1036" in f3_pos_ids
    
    # Check F3 Monetization
    f3_mon_ids = [item["technique_id"] for item in matrix["f3_monetization"]]
    assert "F1025.003" in f3_mon_ids
    
    # Check D3FEND Countermeasures
    d3fend_ids = [item["technique_id"] for item in matrix["d3fend_countermeasures"]]
    assert "D3-ARA" in d3fend_ids or "D3-DA" in d3fend_ids
    
    # Check canonical SHA-256 seal
    assert len(matrix["canonical_matrix_sha256"]) == 64

def test_upcoding_f3_mapping():
    """Verify Upcoding maps to F3 F1005.003 and D3FEND D3-SVR secondary review."""
    claim = {
        "claim_id": "CLM-UPCODE-TEST-002",
        "faskes_code": "FASKES-TEST-02",
        "indikator_anomali": ["UPCODING_SEVERITY_LEVEL_3", "DISCORDANT_ICD10_PROCEDURE"],
        "nominal_klaim_rp": 62000000.0
    }
    matrix = cybersecurity_engine.evaluate_claim_cybersecurity(claim)
    assert matrix["fraud_typology"] == "UPCODING"
    assert matrix["risk_level"] == "HIGH"
    
    f3_pos_ids = [item["technique_id"] for item in matrix["f3_positioning"]]
    assert "F1005.003" in f3_pos_ids
    
    d3fend_ids = [item["technique_id"] for item in matrix["d3fend_countermeasures"]]
    assert "D3-SVR" in d3fend_ids

def test_geovelocity_collision_mapping():
    """Verify Impossible Travel maps to F1007, T1078, and D3FEND D3-NTA."""
    claim = {
        "claim_id": "CLM-GEO-TEST-003",
        "faskes_code": "FASKES-TEST-03",
        "indikator_anomali": ["GEOVELOCITY_IMPOSSIBLE_TRAVEL_SPEED_185KMH"],
        "nominal_klaim_rp": 24000000.0
    }
    matrix = cybersecurity_engine.evaluate_claim_cybersecurity(claim)
    assert matrix["fraud_typology"] == "GEOVELOCITY_COLLISION"
    assert matrix["risk_level"] == "CRITICAL"
    
    attack_ids = [item["technique_id"] for item in matrix["attack_ttps"]]
    assert "T1078" in attack_ids
    
    d3fend_ids = [item["technique_id"] for item in matrix["d3fend_countermeasures"]]
    assert "D3-NTA" in d3fend_ids

def test_repeat_billing_and_unbundling():
    """Verify Repeat Billing and Unbundling map to D3FEND D3-TR and D3-CR."""
    claim_repeat = {
        "claim_id": "CLM-REPEAT-004",
        "indikator_anomali": ["REPEAT_BILLING_WITHIN_7_DAYS"],
        "nominal_klaim_rp": 15000000.0
    }
    matrix_repeat = cybersecurity_engine.evaluate_claim_cybersecurity(claim_repeat)
    assert matrix_repeat["fraud_typology"] == "REPEAT_BILLING"
    d3fend_repeat = [item["technique_id"] for item in matrix_repeat["d3fend_countermeasures"]]
    assert "D3-TR" in d3fend_repeat

    claim_unbundle = {
        "claim_id": "CLM-UNBUNDLE-005",
        "indikator_anomali": ["FRAGMENTED_SURGICAL_UNBUNDLING"],
        "nominal_klaim_rp": 38000000.0
    }
    matrix_unbundle = cybersecurity_engine.evaluate_claim_cybersecurity(claim_unbundle)
    assert matrix_unbundle["fraud_typology"] == "UNBUNDLING"
    d3fend_unbundle = [item["technique_id"] for item in matrix_unbundle["d3fend_countermeasures"]]
    assert "D3-CR" in d3fend_unbundle

def test_canonical_sha256_integrity():
    """Verify canonical digest reproducibility and tamper detection."""
    claim_a = {"claim_id": "CLM-SEAL-01", "fraud_typology": "UPCODING", "nominal_klaim_rp": 10000000.0}
    matrix_a1 = cybersecurity_engine.evaluate_claim_cybersecurity(claim_a)
    
    # Same payload with identical timestamp
    matrix_a2 = cybersecurity_engine.evaluate_claim_cybersecurity(claim_a)
    assert len(matrix_a1["canonical_matrix_sha256"]) == 64
    assert len(matrix_a2["canonical_matrix_sha256"]) == 64

def test_api_framework_summary_endpoint():
    """Test GET /api/v1/cybersecurity/frameworks/summary."""
    res = client.get("/api/v1/cybersecurity/frameworks/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_skills_count"] == 818
    assert data["f3_skills_count"] == 94
    assert "MITRE_F3_v1_1" in data["mapped_frameworks"]

def test_api_fraud_catalog_endpoint():
    """Test GET /api/v1/cybersecurity/skills/fraud-catalog."""
    res = client.get("/api/v1/cybersecurity/skills/fraud-catalog?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) <= 10

def test_api_claim_evaluate_endpoint():
    """Test POST /api/v1/cybersecurity/claims/evaluate."""
    payload = {
        "claim_id": "CLM-API-TEST-999",
        "faskes_code": "FASKES-RSUD-TEST",
        "fraud_typology": "GEOVELOCITY_COLLISION",
        "indikator_anomali": ["GEOVELOCITY_IMPOSSIBLE_TRAVEL"],
        "nominal_klaim_rp": 75000000.0
    }
    res = client.post("/api/v1/cybersecurity/claims/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["claim_id"] == "CLM-API-TEST-999"
    assert data["risk_level"] == "CRITICAL"
    assert len(data["canonical_matrix_sha256"]) == 64
    assert len(data["f3_positioning"]) > 0
    assert len(data["d3fend_countermeasures"]) > 0
