"""
Tests for ICD-10 Bilingual Master Terminology Service & Endpoints
Healthkathon BPJS Kesehatan 2026 • Tim Pengembang Nasional ClaimTrace • BPJS Kesehatan Tingkat Nasional
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine.icd10_service import icd10_service

client = TestClient(app)

def test_icd10_service_loaded():
    assert icd10_service.total_codes == 10469

def test_icd10_lookup_known_codes():
    # Sepsis
    res_sepsis = icd10_service.lookup("A41.9")
    assert res_sepsis is not None
    assert res_sepsis["code"] == "A41.9"
    assert "Septicaemia" in res_sepsis["name_en"]
    assert "tidak spesifik" in res_sepsis["name_id"]
    assert res_sepsis["chapter"]["chapter_number"] == "I"
    assert res_sepsis["chapter"]["block"] == "A00-B99"

    # Hipertensi Esensial
    res_ht = icd10_service.lookup("I10")
    assert res_ht is not None
    assert res_ht["code"] == "I10"
    assert "Hypertension" in res_ht["name_en"] or "hypertension" in res_ht["name_en"].lower()
    assert res_ht["chapter"]["chapter_number"] == "IX"

    # Normalized code without dot
    res_norm = icd10_service.lookup("A000")
    assert res_norm is not None
    assert res_norm["code"] == "A00.0"
    assert "Cholera" in res_norm["name_en"]

def test_icd10_search():
    # Search Bahasa Indonesia
    results_id = icd10_service.search("tifoid", limit=5)
    assert len(results_id) > 0
    assert any("tifoid" in r["name_id"].lower() for r in results_id)

    # Search English
    results_en = icd10_service.search("cholera", limit=5)
    assert len(results_en) > 0
    assert any("cholera" in r["name_en"].lower() for r in results_en)

    # Search Code Prefix
    results_code = icd10_service.search("A00", limit=10)
    assert len(results_code) >= 3
    assert any(r["code"] == "A00.0" for r in results_code)

def test_icd10_invalid_and_unknown():
    assert not icd10_service.is_valid_code("XYZ.99")
    assert not icd10_service.is_valid_code("999.99")
    assert icd10_service.lookup("NONEXISTENT_999") is None

def test_terminology_api_endpoints():
    # 1. Stats Endpoint
    res_stats = client.get("/api/v1/terminology/icd10/stats")
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert stats["status"] == "success"
    assert stats["total_registered_codes"] == 10469
    assert stats["total_chapters"] == 21

    # 2. Lookup Endpoint
    res_lookup = client.get("/api/v1/terminology/icd10/lookup?code=A41.9")
    assert res_lookup.status_code == 200
    data = res_lookup.json()["data"]
    assert data["code"] == "A41.9"
    assert "Septicaemia" in data["name_en"]
    assert data["chapter"]["chapter_number"] == "I"

    # 3. Lookup 404 for unknown code
    res_404 = client.get("/api/v1/terminology/icd10/lookup?code=INVALID_CODE_99")
    assert res_404.status_code == 404
    assert "tidak terdaftar" in res_404.json()["detail"]

    # 4. Search Endpoint
    res_search = client.get("/api/v1/terminology/icd10/search?q=kolera&limit=5")
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert search_data["status"] == "success"
    assert search_data["total_results"] > 0
    assert any("kolera" in r["name_id"].lower() for r in search_data["results"])

def test_fhir_condition_validation_with_master_icd10():
    # Valid registered ICD-10
    res_valid = client.post("/fhir/Condition", json={
        "resourceType": "Condition",
        "code": {"coding": [{"system": "http://hl7.org/fhir/sid/icd-10", "code": "A41.9"}]}
    })
    assert res_valid.status_code == 201

    # Syntactically plausible but unlisted ICD-10 code
    res_unlisted = client.post("/fhir/Condition", json={
        "resourceType": "Condition",
        "code": {"coding": [{"system": "http://hl7.org/fhir/sid/icd-10", "code": "Z99.99"}]}
    })
    assert res_unlisted.status_code == 422
    outcome = res_unlisted.json()
    assert outcome["resourceType"] == "OperationOutcome"
    assert "tidak terdaftar" in outcome["issue"][0]["diagnostics"]
