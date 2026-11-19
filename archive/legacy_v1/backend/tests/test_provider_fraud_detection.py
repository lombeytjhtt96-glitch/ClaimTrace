"""
Unit and Integration Tests for Healthcare Provider Fraud Detection & Analysis
Healthkathon BPJS Kesehatan 2026 • Tim Pengembang Nasional ClaimTrace • BPJS Kesehatan Tingkat Nasional
Adapted from rohansoni634/Healthcare-Provider-Fraud-Detection-Analysis
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine.duckdb_analytics import duckdb_engine

client = TestClient(app)

def test_duckdb_provider_fraud_risk_profile_view():
    sql = "SELECT * FROM v_provider_fraud_risk_profile;"
    res = duckdb_engine.execute_query(sql, output_format="json")
    assert res["status"] == "success"
    assert len(res["data"]) > 0
    
    first = res["data"][0]
    expected_cols = [
        "faskes_id", "nama_faskes", "kelas_rs", "total_klaim",
        "total_pasien_unik", "total_dpjp_unik", "total_biaya_tagih_rp",
        "rasio_klaim_per_pasien", "total_klaim_repeat_billing",
        "skor_risiko_perilaku_faskes", "kategori_risiko_faskes"
    ]
    for col in expected_cols:
        assert col in first, f"Missing column {col} in v_provider_fraud_risk_profile"

def test_duckdb_tool_provider_fraud_risk_profile():
    tool_res = duckdb_engine.tool_provider_fraud_risk_profile()
    assert tool_res["tool_name"] == "provider_fraud_risk_profile"
    assert tool_res["total_providers"] > 0
    assert len(tool_res["providers"]) > 0

    # Test filtering by risk level
    tool_res_tinggi = duckdb_engine.tool_provider_fraud_risk_profile(risk_level="TINGGI")
    for p in tool_res_tinggi["providers"]:
        assert p["kategori_risiko_faskes"] == "TINGGI"

def test_published_tools_catalog_contains_provider_fraud():
    catalog = duckdb_engine.get_published_tools_catalog()
    tool_names = [t["name"] for t in catalog]
    assert "provider_fraud_risk_profile" in tool_names

def test_api_provider_risk_endpoints():
    # 1. Master List Endpoint
    res_list = client.get("/api/v1/analytics/provider-risk")
    assert res_list.status_code == 200
    data = res_list.json()
    assert data["total_providers"] > 0
    assert len(data["providers"]) > 0

    # 2. Specific Faskes Detail Endpoint
    res_detail = client.get("/api/v1/analytics/provider-risk/FSK-RSX-01")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["status"] == "success"
    assert detail["provider_profile"]["faskes_id"] == "FSK-RSX-01"
    assert "total_active_claims" in detail
    assert "claims_summary" in detail
    assert len(detail["claims_summary"]) > 0

    # 3. 404 for unknown Faskes
    res_404 = client.get("/api/v1/analytics/provider-risk/NONEXISTENT_FASKES_999")
    assert res_404.status_code == 404

    # 4. MCP Pre-published Tool Endpoint
    res_tool = client.get("/api/v1/duckdb/tools/provider-fraud-profile?risk_level=TINGGI")
    assert res_tool.status_code == 200
    tool_data = res_tool.json()
    assert tool_data["tool_name"] == "provider_fraud_risk_profile"
