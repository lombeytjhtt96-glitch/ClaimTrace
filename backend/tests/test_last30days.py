import pytest
from fastapi.testclient import TestClient
from app.main import app, SYNTHETIC_CLAIMS_DATABASE
from app.engine.last30days_engine import (
    get_30day_temporal_radar,
    generate_claim_30day_intelligence,
    execute_last30days_cli,
    ACTIVE_30DAY_REGULATORY_CIRCULARS,
)

client = TestClient(app)

def test_get_30day_temporal_radar_structure():
    radar = get_30day_temporal_radar()
    assert radar.spec_version == "3.31.0"
    assert radar.total_signals_tracked == len(ACTIVE_30DAY_REGULATORY_CIRCULARS)
    assert len(radar.high_priority_alerts) > 0
    assert len(radar.typologies_in_focus) >= 3
    assert len(radar.radar_hash) == 64

def test_execute_last30days_cli_mock():
    res = execute_last30days_cli("BPJS upcoding", lookback_days=30, mock=True)
    assert res.get("schema_version") == "1.4"
    assert res.get("window_days") == 30
    assert "clusters" in res

def test_generate_claim_30day_intelligence_matched():
    # K92.2 matches Edaran Teknis BPJS Kes No. 33/2026
    claim_data = {
        "diagnosa_primer": "K92.2",
        "kode_cbg": "K-1-10-III",
        "hospital": "RSUD Dr. Soetomo",
        "biaya_riil": 15300000
    }
    brief = generate_claim_30day_intelligence("CLM-2026-TEST-01", claim_data, mock_search=True)
    assert brief.spec_version == "3.31.0"
    assert brief.claim_id == "CLM-2026-TEST-01"
    assert len(brief.active_regulatory_circulars) >= 1
    assert brief.risk_elevation_factor == 1.20
    assert "Edaran Teknis BPJS Kes No. 33/2026" in brief.adjudicator_guidance
    assert len(brief.temporal_hash) == 64

def test_generate_claim_30day_intelligence_unmatched():
    claim_data = {
        "diagnosa_primer": "J00",  # Nasofaringitis akut biasa
        "kode_cbg": "Q-5-44-0",
        "hospital": "Klinik Pratama",
        "biaya_riil": 150000
    }
    brief = generate_claim_30day_intelligence("CLM-2026-TEST-02", claim_data, mock_search=True)
    assert brief.risk_elevation_factor == 1.0
    assert len(brief.active_regulatory_circulars) == 0
    assert "Tidak ditemukan peringatan khusus" in brief.adjudicator_guidance

def test_api_get_30day_radar_endpoint():
    response = client.get("/api/v1/radar/last30days")
    assert response.status_code == 200
    data = response.json()
    assert data["spec_version"] == "3.31.0"
    assert data["total_signals_tracked"] == 7
    assert len(data["high_priority_alerts"]) == 7
    assert len(data["radar_hash"]) == 64

def test_api_get_claim_30day_intelligence_endpoint():
    claim_id = next(iter(SYNTHETIC_CLAIMS_DATABASE.keys()))
    response = client.get(f"/api/v1/claims/{claim_id}/last30days-intelligence")
    assert response.status_code == 200
    data = response.json()
    assert data["spec_version"] == "3.31.0"
    assert data["claim_id"] == claim_id
    assert data["lookback_window_days"] == 30
    assert "adjudicator_guidance" in data
    assert len(data["temporal_hash"]) == 64

def test_api_get_claim_30day_intelligence_not_found():
    response = client.get("/api/v1/claims/NON-EXISTENT-CLAIM-999/last30days-intelligence")
    assert response.status_code == 404

def test_api_query_30day_radar_endpoint():
    payload = {
        "query": "BPJS hemodialysis fraud",
        "days": 30,
        "mock": True
    }
    response = client.post("/api/v1/radar/last30days/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data.get("schema_version") == "1.4"
    assert data.get("window_days") == 30
