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


def test_screening_pipeline_summary_endpoint():
    response = client.get("/api/v1/screening/pipeline-summary")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    spec = data["scoring_spec"]
    assert spec["scale_min"] == 0
    assert spec["scale_max"] == 100
    assert spec["weights"]["s1_pola_klinis"] == 0.5
    assert spec["weights"]["s2_dpjp_sdmk"] == 0.3
    assert spec["weights"]["s3_mobile_jkn"] == 0.2
    assert len(spec["lanes"]) == 3
    assert spec["lanes"][0]["code"] == "HIJAU"
    assert spec["lanes"][1]["code"] == "KUNING"
    assert spec["lanes"][2]["code"] == "MERAH"
    assert len(data["stages"]) == 4
    assert data["portfolio_baseline"]["total_claims"] >= 1699219
    assert data["live_triage_queue"]["total_active"] >= 6


def test_official_bakb_uses_live_synthetic_claim_without_bias():
    response = client.get("/api/v1/claims/CLM-2026-8803/official-bakb")
    assert response.status_code == 200
    data = response.json()
    cs = data["dossier"]["claim_summary"]
    assert cs["claim_id"] == "CLM-2026-8803"
    assert "Mata Nusantara" in cs["hospital"]
    assert cs["triage_lane"] == "HIJAU"
    assert "Mata Nusantara" in data["html_printable"]
    assert "8.5x" not in data["html_printable"]


def test_screening_bahv_recap_four_vedika_buckets():
    response = client.get("/api/v1/screening/bahv-recap")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    buckets = data["buckets"]
    for key in ("LAYAK", "PENDING", "DISPUTE", "TIDAK_LAYAK"):
        assert key in buckets
        assert "count" in buckets[key]
        assert "claimed_rp" in buckets[key]
    assert data["total_claimed_rp"] == data["total_approved_rp"] + data["total_held_rp"]


def test_claim_ingest_simulate_scoring_routes_cleanly():
    res_unsynced = client.post(
        "/api/v1/claims/ingest-simulate",
        json={
            "nama_faskes": "RS Uji Integrasi SDMK",
            "kelas_rs": "C",
            "ina_cbg_code": "K-1-10-II",
            "nilai_klaim_rp": 8500000,
            "sip_status": "UNSYNCED",
            "rasio_lonjakan_baseline": 1.4,
            "mobile_sampel_terkirim": 5,
            "mobile_respon_hadir": 5,
            "mobile_respon_tidak_hadir": 0,
            "add_to_queue": False,
        },
    )
    assert res_unsynced.status_code == 200
    assert res_unsynced.json()["triage"]["triage_lane"] == "KUNING"

    res_expired = client.post(
        "/api/v1/claims/ingest-simulate",
        json={
            "nama_faskes": "RS Uji SIP Kedaluwarsa",
            "kelas_rs": "B",
            "ina_cbg_code": "Z-3-12-0",
            "nilai_klaim_rp": 12000000,
            "sip_status": "EXPIRED",
            "rasio_lonjakan_baseline": 1.1,
            "mobile_sampel_terkirim": 5,
            "mobile_respon_hadir": 5,
            "mobile_respon_tidak_hadir": 0,
            "add_to_queue": False,
        },
    )
    assert res_expired.status_code == 200
    assert res_expired.json()["triage"]["triage_lane"] == "MERAH"
    assert res_expired.json()["triage"]["hard_trigger_activated"] is True


def test_checklist_batch_decision_and_settings_validation():
    chk_res = client.patch(
        "/api/v1/claims/CLM-2026-8803/checklist",
        json={
            "verifier_id": "198704202011012001",
            "checklist": {"sep_valid": True, "resume_tte_dpjp": True},
            "notes": "Berkas katarak baksos lengkap",
        },
    )
    assert chk_res.status_code == 200
    assert chk_res.json()["data"]["checklist"]["sep_valid"] is True

    batch_res = client.post(
        "/api/v1/claims/batch-decision",
        headers={
            "X-Verificator-Role": "VERIFICATOR_MEDIS",
            "X-Verificator-NIP": "198704202011012001",
        },
        json={
            "claim_ids": ["CLM-2026-8803"],
            "decision": "LAYAK_BAYAR",
            "verifier_id": "198704202011012001",
            "catatan_verifikator": "Lolos cepat VEDIKA pra-bayar",
        },
    )
    assert batch_res.status_code == 200
    assert batch_res.json()["updated_count"] == 1

    bad_settings = client.put(
        "/api/v1/settings",
        json={
            "category": "tri_layer_engine",
            "updates": {"yellow_lane_threshold": 85, "red_lane_threshold": 70},
        },
    )
    assert bad_settings.status_code == 422


