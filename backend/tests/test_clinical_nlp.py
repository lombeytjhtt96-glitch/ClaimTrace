"""
Unit & Integration Tests for ClaimTrace Clinical NLP & Machine Learning Engine
BPJS Kesehatan Healthkathon • Pemrosesan Bahasa Alami Rekam Medis
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine.clinical_nlp import clinical_nlp_engine, ml_claim_auditor

client = TestClient(app)


def test_clinical_nlp_entity_extraction():
    """Menguji Named Entity Recognition (NER) pada narasi rekam medis Indonesia."""
    text = (
        "Pasien mengeluh nyeri punggung bawah Low Back Pain menjalar ke paha posterior dextra. "
        "Pemeriksaan fisik: Lasegue (+), Patrick (-). "
        "Tindakan: Fisioterapi Short Wave Diathermy SWD 93.39 serial 5 sesi. "
        "Terapi obat: Pantoprazole 40mg tab dan Albumin human 20% infus."
    )
    entities = clinical_nlp_engine.extract_entities(text)
    assert len(entities) >= 5

    categories = {e["category"] for e in entities}
    assert "DIAGNOSIS" in categories
    assert "PROCEDURE" in categories
    assert "MEDICATION" in categories
    assert "ANATOMICAL_SITE" in categories


def test_clinical_nlp_negation_detection():
    """Menguji deteksi negasi (NegEx) pada penyangkalan komorbid dan hasil penunjang negatif."""
    text = (
        "Pasien datang tanpa komplikasi organ. "
        "Kultur darah (-) dan tidak ditemukan tanda sepsis. "
        "Tidak ada riwayat trauma fisik."
    )
    negations = clinical_nlp_engine.detect_negations(text)
    assert len(negations) >= 2

    triggers = [n["trigger"].lower() for n in negations]
    assert any("tanpa" in t for t in triggers) or any("tidak" in t for t in triggers) or any("(-)" in t for t in triggers)


def test_clinical_alignment_scoring():
    """Menguji penilaian keselarasan dokumen klinis terhadap koding klaim."""
    # Skenario 1: Selaras penuh
    valid_text = (
        "Pasien dengan keluhan Low Back Pain M54.5. "
        "Telah dilakukan fisioterapi short wave diathermy SWD 93.39. Lasegue (+)."
    )
    res_valid = clinical_nlp_engine.evaluate_clinical_alignment(
        resume_text=valid_text,
        billed_icd10="M54.5",
        billed_cbg="Z-3-12-0",
        procedure_code="93.39"
    )
    assert res_valid["alignment_score_pct"] >= 75.0
    assert res_valid["status"] == "SELARAS_VALID"

    # Skenario 2: Diskrepansi berat (teks tidak ada korelasi dengan tagihan)
    mismatch_text = "Pasien kontrol rutin periksa mata katarak senilis VOD 6/18."
    res_mismatch = clinical_nlp_engine.evaluate_clinical_alignment(
        resume_text=mismatch_text,
        billed_icd10="M54.5",
        billed_cbg="Z-3-12-0",
        procedure_code="93.39"
    )
    assert res_mismatch["alignment_score_pct"] <= 50.0
    assert len(res_mismatch["unsupported_items"]) >= 1


def test_stylometric_metrics():
    """Menguji analisis stilometri untuk deteksi template repetitif."""
    natural_text = (
        "Pasien wanita 45 tahun dirawat dengan keluhan nyeri ulu hati tembus ke punggung. "
        "Dilakukan pemeriksaan USG abdomen dan pemberian antasida serta analgesik intravena."
    )
    metrics = clinical_nlp_engine.compute_stylometric_metrics(natural_text)
    assert metrics["token_count"] > 10
    assert metrics["type_token_ratio"] > 0.5


def test_api_nlp_analyze_endpoint():
    """Menguji HTTP endpoint /api/v1/nlp/analyze-clinical-note."""
    payload = {
        "text": "Pasien dengan keluhan Low Back Pain. Dilakukan fisioterapi SWD 93.39.",
        "billed_icd10": "M54.5",
        "billed_cbg": "Z-3-12-0",
        "procedure_code": "93.39"
    }
    response = client.post("/api/v1/nlp/analyze-clinical-note", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["entities_count"] >= 2
    assert "alignment" in data
    assert "stylometry" in data


def test_api_claim_nlp_audit_endpoint():
    """Menguji HTTP endpoint /api/v1/nlp/claim-audit/{claim_id}."""
    response = client.get("/api/v1/nlp/claim-audit/CLM-2026-8801")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "nlp_analysis" in data
    assert "vector_semantic_embedding" in data
    assert "machine_learning_inference" in data
    assert data["machine_learning_inference"]["risk_lane"] in ["MERAH", "KUNING", "HIJAU"]
