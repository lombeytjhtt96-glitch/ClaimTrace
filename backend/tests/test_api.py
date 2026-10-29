import pytest
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "ClaimTrace DSS API"
    assert "BPJS Kesehatan Healthkathon 2026" in data["competition"]
    assert "TINEERENSE" in data["team"]


def test_health_check_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["audit_integrity_valid"] is True
    assert data["active_claims_count"] >= 4


def test_list_claims_and_sorting():
    response = client.get("/api/v1/claims")
    assert response.status_code == 200
    claims = response.json()
    assert len(claims) >= 4
    # Verify sorted by priority score descending
    scores = [c["triage"]["final_priority_score"] for c in claims]
    assert scores == sorted(scores, reverse=True)


def test_filter_claims_by_lane():
    response = client.get("/api/v1/claims?lane=MERAH")
    assert response.status_code == 200
    claims = response.json()
    assert all(c["triage"]["triage_lane"] == "MERAH" for c in claims)


def test_get_claim_detail():
    response = client.get("/api/v1/claims/CLM-2026-8801")
    assert response.status_code == 200
    data = response.json()
    assert data["claim"]["claim_id"] == "CLM-2026-8801"
    assert data["triage"]["triage_lane"] == "MERAH"
    assert "audit_trail" in data


def test_simulate_mobile_jkn_response():
    response = client.post(
        "/api/v1/claims/CLM-2026-8801/mobile-response",
        json={"attended": True}
    )
    assert response.status_code == 200
    data = response.json()
    assert "latest_audit_entry" in data
    assert data["latest_audit_entry"]["event_type"] == "MOBILE_JKN_BINARY_SYNC"


def test_record_verifier_decision():
    response = client.post(
        "/api/v1/claims/CLM-2026-8801/decision",
        json={
            "verifier_id": "VRF-JKN-TEST",
            "decision": "AUDIT_LAPANGAN",
            "catatan_verifikator": "Uji Keputusan Otomasi"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["audit_entry"]["actor"] == "VRF-JKN-TEST"


def test_get_audit_chain_and_integrity():
    response = client.get("/api/v1/audit-logs")
    assert response.status_code == 200
    data = response.json()
    assert data["integrity_verified"] is True
    assert len(data["chain"]) > 0


def test_simulate_custom_claim_endpoint():
    payload = {
        "claim_id": "CLM-CUST-999",
        "faskes_id": "FSK-CUST",
        "nama_faskes": "RS Uji Coba",
        "kelas_rs": "B",
        "peserta_token_aes": "AES256_custom",
        "tanggal_layanan": "2026-10-20",
        "ina_cbg_code": "Z-3-12-0",
        "deskripsi_cbg": "Fisioterapi",
        "icd10_primary": "M54.5",
        "icd9cm_procedure": "93.39",
        "nilai_klaim_rp": 5000000,
        "s1_score": 80.0,
        "s2_score": 70.0,
        "s3_score": 90.0,
        "episode_meta": {
            "cluster_id": "CLS-CUSTOM",
            "jumlah_klaim_klaster": 10,
            "rasio_lonjakan_baseline": 3.5,
            "indikasi_repeat_billing": False,
            "terdaftar_baksos_resmi": False
        },
        "dpjp_meta": {
            "dpjp_id_hash": "SDMK-DR-99",
            "nama_dpjp_alias": "dr. Custom",
            "sip_status": "ACTIVE",
            "jam_praktik_valid": True,
            "faskes_terdaftar": "RS Uji Coba",
            "catatan_sdmk": "Aktif"
        },
        "mobile_meta": {
            "sampel_terkirim": 10,
            "respon_tidak_hadir": 8,
            "respon_hadir": 2,
            "status_konfirmasi": "ANOMALY_DENIED"
        }
    }
    response = client.post("/api/v1/claims/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["triage"]["claim_id"] == "CLM-CUST-999"
    # 0.5*80 + 0.3*70 + 0.2*90 = 40 + 21 + 18 = 79.0
    assert data["triage"]["raw_weighted_score"] == 79.0
    assert data["triage"]["triage_lane"] == "MERAH"


def test_reset_endpoint():
    response = client.post("/api/v1/claims/reset")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "reset_successful"
    assert data["total_claims"] == 6


def test_cypher_export_endpoint():
    response = client.get("/api/v1/graph/cypher-export")
    assert response.status_code == 200
    assert "CLAIMTRACE GRAPH DATABASE SEED SCRIPT (CYPHER)" in response.text
    assert "MERGE (f:Faskes" in response.text
    assert "MERGE (d:DPJP" in response.text
    assert "MERGE (c:Claim" in response.text


def test_neo4j_queries_endpoint():
    response = client.get("/api/v1/graph/neo4j-queries")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_queries"] >= 4
    assert any("Phantom Billing" in q["name"] for q in data["queries"])
    assert any("Repeat Billing" in q["name"] for q in data["queries"])


def test_playwright_automation_spec_endpoint():
    response = client.get("/api/v1/automation/playwright-spec")
    assert response.status_code == 200
    data = response.json()
    assert data["mcp_server"] == "microsoft/playwright-mcp"
    assert data["total_e2e_tests"] == 7
    assert data["test_suite_status"] == "100% PASSED"
    assert len(data["test_cases"]) == 7
    assert "browser_navigate" in data["active_mcp_tools"]
    assert "browser_pdf_save" in data["active_mcp_tools"]


