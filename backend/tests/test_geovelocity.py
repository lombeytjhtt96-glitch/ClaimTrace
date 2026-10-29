"""
Unit and Integration Tests for ClaimTrace OSRM Geovelocity & Impossible Travel Verification
Healthkathon BPJS Kesehatan 2026
"""

import pytest
from app.engine.osrm_geovelocity import (
    calculate_haversine_distance,
    verify_geovelocity_feasibility,
    FASKES_GEO_DIRECTORY
)
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_haversine_distance_calculation():
    # Jakarta to Serang coordinates
    dist = calculate_haversine_distance(-6.2088, 106.8456, -6.1104, 106.1640)
    assert 75.0 <= dist <= 85.0  # Approx 76.1 km

def test_impossible_travel_detection():
    # 45 minutes between Jakarta and Serang (Surgery Case CLM-2026-8805)
    res = verify_geovelocity_feasibility(
        origin_id="FSK-RSDK-05",  # Jakarta Pusat
        destination_id="FSK-RSX-01",  # Serang
        time_diff_minutes=45.0,
        buffer_scrub_minutes=30.0
    )
    assert res.is_physically_impossible is True
    assert res.risk_lane == "MERAH"
    assert res.required_travel_speed_kmh > 100.0
    assert res.geovelocity_risk_score >= 85.0
    assert "FA0002.001" in res.mitre_f3_tag

def test_feasible_travel():
    # 180 minutes between Jakarta and Serang (feasible travel)
    res = verify_geovelocity_feasibility(
        origin_id="FSK-RSDK-05",
        destination_id="FSK-RSX-01",
        time_diff_minutes=180.0,
        buffer_scrub_minutes=30.0
    )
    assert res.is_physically_impossible is False
    assert res.risk_lane == "HIJAU"
    assert res.required_travel_speed_kmh < 70.0

def test_geovelocity_api_endpoints():
    # 1. Test verify endpoint
    res_verify = client.get("/api/v1/geovelocity/verify?origin_id=FSK-RSDK-05&dest_id=FSK-RSX-01&time_diff_minutes=45")
    assert res_verify.status_code == 200
    data = res_verify.json()
    assert data["is_physically_impossible"] is True
    assert data["risk_lane"] == "MERAH"
    assert "osrm_road_distance_km" in data

    # 2. Test faskes directory endpoint
    res_dir = client.get("/api/v1/geovelocity/faskes-directory")
    assert res_dir.status_code == 200
    dir_data = res_dir.json()
    assert dir_data["total"] >= 6
    assert any(f["city"] == "Jakarta Pusat" for f in dir_data["faskes"])
    assert any(f["city"] == "Kota Serang" for f in dir_data["faskes"])

    # 3. Test 404 for invalid faskes ID
    res_err = client.get("/api/v1/geovelocity/verify?origin_id=NON_EXISTENT&dest_id=FSK-RSX-01")
    assert res_err.status_code == 404
