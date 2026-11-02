"""
Unit & Integration Tests for Post-Healthkathon Expansion Suite:
1. Multi-Typology Fraud Detection (Upcoding Severity Level #4 & Unbundling/Fragmentation #9)
2. FRISTA Biometric & Liveness Telemetry (Quad-Triangulation / Lapis Bukti Ke-4)
3. HealthAI Copilot RAG Regulatory & INA-CBG Clinical Coding Auditor
4. Berita Acara Resmi & Cryptographic SHA-256 QR Matrix Dossier Generator
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_expanded_typology_cases():
    resp = client.get("/api/v1/expansion/typologies")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["total_cases"] >= 4
    assert data["summary_metrics"]["total_cost_recovery_rp"] > 0
    codes = [c["typology_code"] for c in data["cases"]]
    assert "MODUS_04_UPCODING_SEVERITY" in codes
    assert "MODUS_09_UNBUNDLING_FRAGMENTATION" in codes


def test_audit_clinical_coding_upcoding():
    payload = {
        "claim_id": "CLM-2026-8806",
        "icd10_primary": "K29.7",
        "icd10_secondary": ["A41.9", "K92.2"],
        "hemoglobin": 13.6,
        "leukocytes": 7400.0,
        "temperature": 36.7,
        "sofa_score": 0,
        "visit_count_7d": 1,
        "claimed_tariff_rp": 14850000
    }
    resp = client.post("/api/v1/expansion/audit-coding", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["upcoding_detected"] is True
    assert data["financial_impact"]["cost_recovery_rp"] > 10000000
    assert len(data["flags"]) >= 2


def test_audit_clinical_coding_unbundling():
    payload = {
        "claim_id": "CLM-2026-8809",
        "icd10_primary": "H25.9",
        "icd10_secondary": ["Z01.0"],
        "hemoglobin": 14.0,
        "leukocytes": 6800.0,
        "temperature": 36.5,
        "sofa_score": 0,
        "visit_count_7d": 3,
        "claimed_tariff_rp": 1840000
    }
    resp = client.post("/api/v1/expansion/audit-coding", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["unbundling_detected"] is True
    assert data["financial_impact"]["cost_recovery_rp"] > 0


def test_get_frista_biometric_telemetry():
    resp = client.get("/api/v1/expansion/frista-biometrics?claim_id=CLM-2026-10-085")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    telemetry = data["biometric_telemetry"]
    assert telemetry["claim_id"] == "CLM-2026-10-085"
    assert "quad_triangulation" in telemetry
    assert telemetry["quad_triangulation"]["lapis_4_frista_biometric"] >= 90.0


def test_query_healthai_regulatory_rag():
    payload = {
        "query": "Bagaimana aturan koding sepsis A41.9 dan perdarahan GI K92.2 menurut Permenkes 26/2021?",
        "claim_id": "CLM-2026-8806"
    }
    resp = client.post("/api/v1/expansion/rag-regulatory", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert len(data["retrieved_regulations"]) >= 1
    assert "Permenkes" in data["synthesized_response"]


def test_generate_official_berita_acara():
    payload = {
        "claim_id": "CLM-2026-10-085",
        "verifier_name": "Khalaf Faith Pradyatama",
        "verifier_nip": "198704202011012001",
        "action_type": "TUNDA_BERITA_ACARA_KLARIFIKASI"
    }
    resp = client.post("/api/v1/expansion/berita-acara", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["ba_number"].startswith("BA-VERIF/JKN-FKRTL/")
    seal = data["cryptographic_seal"]
    assert len(seal["document_hash"]) == 64
    assert len(seal["qr_matrix_21x21"]) == 21
    assert len(seal["qr_matrix_21x21"][0]) == 21
