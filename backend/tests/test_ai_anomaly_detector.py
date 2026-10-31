"""
Unit & Integration Tests for ClaimTrace AI Anomaly Detector
BPJS Kesehatan Healthkathon 2026 • Tim Pengembang Nasional ClaimTrace
"""

import pytest
from datetime import date
from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import (
    ClaimInput,
    EpisodeFingerprint,
    DPJPValidation,
    MobileJKNConfirmation,
)
from app.engine.ai_anomaly_detector import ai_anomaly_engine
from app.data.synthetic_seed import get_initial_claims

client = TestClient(app)

def test_ai_detector_initialization():
    """Memverifikasi bahwa engine AI Anomaly Detector terinisialisasi dengan Isolation Forest aktif."""
    assert ai_anomaly_engine.isolation_forest is not None
    assert len(ai_anomaly_engine._feature_names) == 10
    assert "Isolation Forest" in ai_anomaly_engine.model_family

def test_ai_detect_phantom_billing_anomaly():
    """
    Menguji kemampuan AI dalam mendeteksi anomali Modus #6 Phantom Billing secara otomatis.
    Klaim CLM-2026-8801 memiliki lonjakan klaster 8.5x dan 8/10 peserta menyangkal kehadiran.
    """
    claims = get_initial_claims()
    phantom_claim = claims["CLM-2026-8801"]

    prediction = ai_anomaly_engine.detect_anomaly(phantom_claim)

    assert prediction.is_anomaly is True
    assert prediction.anomaly_score >= 80.0
    assert prediction.confidence_score >= 90.0
    assert prediction.primary_anomaly_category == "PHANTOM_BILLING"
    assert len(prediction.top_feature_drivers) > 0
    assert "Phantom Billing" in prediction.clinical_ai_rationale
    assert "Jalur Merah" in prediction.automated_recommendation or "Tahan" in prediction.automated_recommendation

def test_ai_detect_repeat_billing_anomaly():
    """
    Menguji kemampuan AI dalam mendeteksi anomali Modus #11 Repeat Billing secara otomatis.
    Klaim CLM-2026-8802 memiliki indikasi klaim berulang pada episode sama.
    """
    claims = get_initial_claims()
    repeat_claim = claims["CLM-2026-8802"]

    prediction = ai_anomaly_engine.detect_anomaly(repeat_claim)

    assert prediction.is_anomaly is True
    assert prediction.anomaly_score >= 70.0
    assert prediction.primary_anomaly_category == "REPEAT_BILLING"
    assert "Repeat Billing" in prediction.clinical_ai_rationale

def test_ai_normal_claim_low_anomaly_score():
    """
    Menguji bahwa klaim normal (terjadwal hemodialisa kronis / presensi 100% verifikasi)
    tidak salah dideteksi sebagai anomali (Skor Anomali Rendah < 50%).
    """
    claims = get_initial_claims()
    normal_claim = claims["CLM-2026-8803"]

    prediction = ai_anomaly_engine.detect_anomaly(normal_claim)

    assert prediction.is_anomaly is False
    assert prediction.anomaly_score < 50.0
    assert prediction.primary_anomaly_category == "NORMAL_CLAIM"
    assert "konsisten dengan baseline" in prediction.clinical_ai_rationale.lower()

def test_api_ai_detect_anomaly_endpoint():
    """Menguji endpoint API POST /api/v1/ai/detect-anomaly."""
    claims = get_initial_claims()
    claim = claims["CLM-2026-8801"]

    res = client.post("/api/v1/ai/detect-anomaly", json=claim.model_dump(mode="json"))
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["claim_id"] == "CLM-2026-8801"
    assert "prediction" in data
    assert data["prediction"]["is_anomaly"] is True
    assert data["prediction"]["primary_anomaly_category"] == "PHANTOM_BILLING"

def test_api_ai_batch_scan_endpoint():
    """Menguji endpoint API GET /api/v1/ai/batch-scan."""
    res = client.get("/api/v1/ai/batch-scan")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["total_scanned"] > 0
    assert data["anomalies_detected"] > 0
    assert "breakdown" in data
    assert data["breakdown"]["phantom_billing_count"] >= 1
    assert data["breakdown"]["repeat_billing_count"] >= 1
    assert len(data["scanned_claims"]) > 0

def test_api_ai_model_info_endpoint():
    """Menguji endpoint API GET /api/v1/ai/model-info."""
    res = client.get("/api/v1/ai/model-info")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "active"
    assert "features" in data
    assert data["features_count"] == 10
    assert "Isolation Forest" in data["model_family"]
