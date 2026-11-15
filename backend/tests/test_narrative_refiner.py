import pytest
from fastapi.testclient import TestClient
from app.main import app, SYNTHETIC_CLAIMS_DATABASE
from app.engine.narrative_refiner import (
    detect_ai_patterns,
    clean_ai_prose,
    refine_claim_prose,
    generate_refined_claim_narrative,
)

client = TestClient(app)

def test_detect_ai_patterns_multiple_tells():
    text = (
        "Tentu saja! Mari kita bedah berkas ini. Bukan sekadar selisih tarif melainkan "
        "indikasi unbundling yang krusial. Biarkan fakta ini meresap. Semoga ini membantu!"
    )
    detected = detect_ai_patterns(text)
    assert "§1_not_x_but_y" in detected
    assert "§2_one_line_closers" in detected
    assert "§4_staged_run_up" in detected
    assert "§12_overused_ai_words" in detected
    assert "§22_chatbot_residue" in detected

def test_detect_ai_patterns_clean_text():
    text = "Verifikasi berkas SEP-2026-001 selesai. Tarif diajukan sesuai dengan plafon INA-CBG."
    detected = detect_ai_patterns(text)
    assert len(detected) == 0

def test_clean_ai_prose_preserves_facts():
    raw = (
        "Tentu saja! Mari kita bedah klaim berikut: **Kode CBG:** K-4-17-I senilai Rp 15.000.000 — "
        "ditemukan tindakan unbundling yang krusial. Biarkan fakta ini meresap. Semoga ini membantu!"
    )
    cleaned = clean_ai_prose(raw)
    # Emojis and chatbot wrappers must be stripped
    assert "Tentu saja" not in cleaned
    assert "Semoga ini membantu" not in cleaned
    assert "Biarkan fakta ini meresap" not in cleaned
    assert "Mari kita bedah" not in cleaned
    # Buzzwords replaced
    assert "krusial" not in cleaned
    assert "penting" in cleaned
    # Factual data preserved
    assert "K-4-17-I" in cleaned
    assert "15.000.000" in cleaned

def test_refine_claim_prose_metrics():
    raw = "Tentu saja! Pada intinya, mari kita selami kasus ini yang krusial. Semoga ini membantu!"
    result = refine_claim_prose(raw)
    assert result.spec_version == "1.0.0"
    assert len(result.patterns_detected) >= 3
    assert result.word_count_after < result.word_count_before
    assert result.word_count_reduction_pct > 0.0
    assert len(result.refined_hash) == 64

def test_generate_refined_claim_narrative_existing_claim():
    claim_id = next(iter(SYNTHETIC_CLAIMS_DATABASE.keys()))
    narrative = generate_refined_claim_narrative(claim_id)
    assert narrative.spec_version == "1.0.0"
    assert len(narrative.refined_text) > 0
    assert len(narrative.refined_hash) == 64

def test_api_refine_prose_endpoint():
    payload = {
        "text": "Tentu saja! Mari kita bedah kasus ini. Bukan sekadar selisih tarif melainkan fraud krusial. Semoga ini membantu!"
    }
    response = client.post("/api/v1/claims/refine-narrative", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["spec_version"] == "1.0.0"
    assert len(data["patterns_detected"]) > 0
    assert "refined_text" in data
    assert len(data["refined_hash"]) == 64

def test_api_refined_narrative_endpoint():
    claim_id = next(iter(SYNTHETIC_CLAIMS_DATABASE.keys()))
    response = client.get(f"/api/v1/claims/{claim_id}/refined-narrative")
    assert response.status_code == 200
    data = response.json()
    assert data["spec_version"] == "1.0.0"
    assert "Verifikasi berkas" in data["refined_text"]

def test_api_refined_narrative_endpoint_404():
    response = client.get("/api/v1/claims/NONEXISTENT-NARRATIVE-ID/refined-narrative")
    assert response.status_code == 404
    assert "tidak ditemukan" in response.json()["detail"]
