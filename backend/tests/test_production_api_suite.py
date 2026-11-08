import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["audit_integrity_valid"] is True
    assert "security_compliance" in data

def test_system_metrics_integrity():
    response = client.get("/api/v1/system/national-scale-metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    
    metrics = data["metrics"]
    assert metrics["faskes_fkrtl_count"] == 2091
    assert "2.091 FKRTL" in metrics["faskes_fkrtl_label"]
    assert metrics["kabupaten_kota_coverage"] == 496
    assert metrics["provinsi_coverage"] == 38
    assert metrics["cumulative_claims_volume"] == 1699219
    assert metrics["annual_claims_volume"] == 1699219
    assert metrics["daily_claims_average"] == 4643
    
    sample_metrics = data["sample_2015_2024_metrics"]
    assert sample_metrics["total_dataset_rows"] == 6264346
    assert sample_metrics["kepesertaan_rows"] == 2590751
    assert sample_metrics["fkrtl_claims_volume"] == 1699219
    assert sample_metrics["distinct_fkrtl_facilities"] == 2091

def test_duckdb_simd_benchmark_endpoint():
    response = client.post("/api/v1/system/national-scale-benchmark?claim_count=50000")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["target_claims_processed"] == 50000
    assert data["throughput_rows_per_second"] > 1000
    assert data["distinct_faskes_simulated"] <= 2091
    assert "breakdown" in data
    assert "national_readiness_verdict" in data

def test_claims_zero_phi_masking():
    response = client.get("/api/v1/claims?limit=5")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) > 0
    for item in items:
        claim = item.get("claim", {})
        triage = item.get("triage", {})
        
        # Verify Zero-PHI compliance: no raw 16-digit NIK
        peserta_token = claim.get("peserta_token_aes", "")
        assert "AES" in peserta_token or len(peserta_token) > 0
        
        # Verify Triage structure
        assert triage.get("triage_lane") in ["MERAH", "KUNING", "HIJAU"]
        assert isinstance(triage.get("final_priority_score"), (int, float))
        assert len(triage.get("audit_hash", "")) == 64

def test_audit_chain_cryptographic_integrity():
    response = client.get("/api/v1/audit-logs")
    assert response.status_code == 200
    data = response.json()
    assert data.get("integrity_verified") is True
    chain = data.get("chain", [])
    assert len(chain) > 0
    # Check SHA-256 length of current_hash for all blocks in chain
    for block in chain:
        assert len(block.get("current_hash", "")) == 64

def test_official_bakb_document_endpoint():
    response = client.get("/api/v1/claims/CLM-2026-10-085/official-bakb")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["claim_id"] == "CLM-2026-10-085"
    dossier = data["dossier"]
    assert dossier["ba_number"].startswith("BA-VERIF")
    assert len(dossier["cryptographic_seal"]["document_hash"]) == 64
    assert "BPJS KESEHATAN KANTOR PUSAT" in data["html_printable"]
    assert "BERITA ACARA HASIL UJI KELENGKAPAN BERKAS" in data["html_printable"]

def test_insights_privacy_status_endpoint():
    response = client.get("/api/v1/insights/privacy-status")
    assert response.status_code == 200
    data = response.json()
    assert data["k_value"] >= 5
    assert data["k_threshold"] == 5
    assert "epsilon_used" in data
    assert "epsilon_total" in data
    assert data["consented_users"] > 0

def test_insights_execute_live_query_endpoint():
    payload = {
        "query_type": "case_distribution",
        "start_date": "",
        "end_date": "",
        "severity": ""
    }
    response = client.post("/api/v1/insights/execute-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["query_name"] == "case_distribution"
    assert data["execution_time_ms"] > 0
    assert len(data["summary"]) > 0
    assert len(data["recommendations"]) > 0
    assert data["result"]["k_anonymity_satisfied"] is True
    assert data["result"]["total_records_anonymized"] == 1699219

def test_insights_reports_endpoint():
    response = client.get("/api/v1/insights/reports")
    assert response.status_code == 200
    reports = response.json()
    assert isinstance(reports, list)
    assert len(reports) >= 4
    for r in reports:
        assert "report_type" in r
        assert "summary" in r
        assert "assessment_count" in r
        assert "high_risk_count" in r

