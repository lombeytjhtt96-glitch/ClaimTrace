"""
Tests for VEDIKA (Portal Verifikator Klaim BPJS Kesehatan) End-to-End Parity Suite.
Covers:
- Standardized 3-pillar BA Kesepakatan pending/dispute codes & SE Diryan 51/2016 dispute SLA tiers
- Verifier Plotting workload aggregation & RBAC fail-closed authorization (C03.04)
- Collective FPK VClaim pull + automated Tri-Layer Pra-Purifikasi & query filters
- Digital Dossier (6 VEDIKA documents, i-Care JKN history, RS vs CBG billing reconciliation)
- Klaim Susulan / Umpan Balik FKRTL resubmission & evidence flag resolution
- FKL48 partial verified tariff, verified INA-CBG code & Dispute Tier adjudication
- RJTL vs RITL BAHV recapitulation arithmetic invariants & printable HTML documents
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.security.token_manager import create_access_token

client = TestClient(app)


def _make_token(nip: str, name: str, role: str, unit: str = "Kantor Pusat BPJS Kesehatan") -> str:
    return create_access_token({
        "nip": nip,
        "name": name,
        "role": role,
        "unit": unit,
    })


VERIFIKATOR_HEADERS = lambda: {
    "Authorization": f"Bearer {_make_token('198704202011012001', 'dr. Siti Rahma, Sp.PK', 'Verifikator Medis Senior')}"
}
ADMIN_HEADERS = lambda: {
    "Authorization": f"Bearer {_make_token('198501012010011001', 'Hendra Wijaya, S.Si, M.M', 'Administrator Kebijakan & Tata Kelola JKN')}"
}
ANALYST_HEADERS = lambda: {
    "Authorization": f"Bearer {_make_token('199208152015031002', 'Budi Santoso, S.Kom, M.TI', 'Analis Forensik Digital Anti-Fraud')}"
}
AUDITOR_HEADERS = lambda: {
    "Authorization": f"Bearer {_make_token('199003152018011005', 'dr. Andi Pratama, MARS', 'Auditor Pengawasan (Read-Only)')}"
}


@pytest.fixture(autouse=True, scope="module")
def reset_seed_around_module():
    res = client.post("/api/v1/claims/reset", headers=ADMIN_HEADERS())
    assert res.status_code == 200
    yield
    client.post("/api/v1/claims/reset", headers=ADMIN_HEADERS())


def test_vedika_pending_codes_and_sla_tiers():
    res = client.get("/api/v1/vedika/pending-codes")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"

    codes = data["codes"]
    assert len(codes) == 16
    pillars = {item["pillar"] for item in codes}
    assert pillars == {"Administrasi", "Koding INA-CBG", "Pelayanan Medis"}
    prefixes = {item["code"].split("-")[0] for item in codes}
    assert prefixes == {"ADM", "KOD", "MED"}

    tiers = data["dispute_sla_tiers"]
    assert set(tiers.keys()) == {"CABANG", "KEDEPUTIAN", "PUSAT_TKMKB"}
    for key, tier in tiers.items():
        assert isinstance(tier["koding_hk"], int)
        assert isinstance(tier["medis_hk"], int)
        assert tier["koding_hk"] > 0
        assert tier["medis_hk"] > 0
        assert tier["label"]


def test_vedika_workload_and_plotting_rbac():
    wl_res = client.get("/api/v1/vedika/workload")
    assert wl_res.status_code == 200
    wl = wl_res.json()
    assert wl["status"] == "success"
    assert wl["total_claims"] >= 6
    assert wl["unassigned_count"] >= 1
    assert "CLM-2026-8803" in wl["unassigned_claim_ids"]

    # Read-Only Auditor cannot execute plotting
    auditor_res = client.post(
        "/api/v1/vedika/plotting",
        headers=AUDITOR_HEADERS(),
        json={"claim_ids": ["CLM-2026-8803"], "verifier_nip": "198704202011012001", "catatan": "Uji RBAC auditor"},
    )
    assert auditor_res.status_code == 403

    # Analyst without ADJUDICATE privilege cannot execute plotting
    analyst_res = client.post(
        "/api/v1/vedika/plotting",
        headers=ANALYST_HEADERS(),
        json={"claim_ids": ["CLM-2026-8803"], "verifier_nip": "198704202011012001", "catatan": "Uji RBAC analyst"},
    )
    assert analyst_res.status_code == 403

    # Unknown verifier NIP returns 404
    unknown_nip_res = client.post(
        "/api/v1/vedika/plotting",
        headers=VERIFIKATOR_HEADERS(),
        json={"claim_ids": ["CLM-2026-8803"], "verifier_nip": "999999999999999999", "catatan": "NIP fiktif"},
    )
    assert unknown_nip_res.status_code == 404

    # Unknown claim IDs returns 404
    unknown_claim_res = client.post(
        "/api/v1/vedika/plotting",
        headers=VERIFIKATOR_HEADERS(),
        json={"claim_ids": ["CLM-UNKNOWN-999"], "verifier_nip": "198704202011012001"},
    )
    assert unknown_claim_res.status_code == 404

    # Verifikator Medis Senior plots CLM-2026-8803 successfully
    ok_res = client.post(
        "/api/v1/vedika/plotting",
        headers=VERIFIKATOR_HEADERS(),
        json={
            "claim_ids": ["CLM-2026-8803"],
            "verifier_nip": "198704202011012001",
            "catatan": "Distribusi beban RITL ke dr. Siti Rahma",
        },
    )
    assert ok_res.status_code == 200
    body = ok_res.json()
    assert body["assigned_verifier_nip"] == "198704202011012001"
    assert body["assigned_verifier_name"] == "dr. Siti Rahma, Sp.PK"
    assert body["updated_count"] == 1
    assert "CLM-2026-8803" in body["updated_ids"]

    wl_after = client.get("/api/v1/vedika/workload").json()
    assert "CLM-2026-8803" not in wl_after["unassigned_claim_ids"]


def test_vedika_fpk_pull_and_claim_query_filters():
    # Read-Only Auditor cannot pull FPK batch
    forbidden_res = client.post(
        "/api/v1/vedika/fpk-pull",
        headers=AUDITOR_HEADERS(),
        json={
            "no_fpk": "FPK-TEST-AUD-001",
            "bulan_pelayanan": "2026-11",
            "jenis_pengajuan": "Reguler",
            "jenis_pelayanan": "RJTL",
            "jumlah_klaim": 2,
            "auto_plot": True,
        },
    )
    assert forbidden_res.status_code == 403

    fpk_code = "FPK-UNITTEST-202611"
    res = client.post(
        "/api/v1/vedika/fpk-pull",
        headers=VERIFIKATOR_HEADERS(),
        json={
            "no_fpk": fpk_code,
            "bulan_pelayanan": "2026-11",
            "jenis_pengajuan": "Reguler",
            "jenis_pelayanan": "ALL",
            "jumlah_klaim": 3,
            "auto_plot": True,
            "nama_faskes": "RS Uji VClaim Nusantara",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["no_fpk"] == fpk_code
    assert data["pulled_count"] == 3
    assert len(data["pulled_claims"]) == 3
    assert sum(data["lane_counts"].values()) == 3

    # Verify filter params on GET /api/v1/claims
    filtered_fpk = client.get(f"/api/v1/claims?no_fpk={fpk_code}")
    assert filtered_fpk.status_code == 200
    fpk_items = filtered_fpk.json()
    assert len(fpk_items) == 3
    for item in fpk_items:
        assert item["claim"]["no_fpk"] == fpk_code

    filtered_rjtl = client.get(f"/api/v1/claims?no_fpk={fpk_code}&jenis_pelayanan=RJTL")
    assert filtered_rjtl.status_code == 200
    rjtl_items = filtered_rjtl.json()
    assert len(rjtl_items) >= 1
    assert all(it["claim"]["jenis_pelayanan"] == "RJTL" for it in rjtl_items)

    filtered_reguler = client.get("/api/v1/claims?jenis_pengajuan=Reguler")
    assert filtered_reguler.status_code == 200
    assert all(it["claim"]["jenis_pengajuan"] == "Reguler" for it in filtered_reguler.json())


def test_vedika_dossier_and_susulan_resubmission():
    missing_res = client.get("/api/v1/claims/CLM-NONEXISTENT-404/vedika-dossier")
    assert missing_res.status_code == 404

    dossier_res = client.get("/api/v1/claims/CLM-2026-8801/vedika-dossier")
    assert dossier_res.status_code == 200
    dossier = dossier_res.json()["dossier"]
    assert dossier["claim_id"] == "CLM-2026-8801"
    assert len(dossier["dokumen_berkas_digital"]) == 6
    assert len(dossier["icare_history"]) >= 1
    assert "billing_reconciliation" in dossier
    assert "tarif_rs_riil_rp" in dossier["billing_reconciliation"]
    assert "fkl47_biaya_tagih_rp" in dossier["billing_reconciliation"]
    assert "selisih_rs_vs_cbg_rp" in dossier["billing_reconciliation"]
    assert len(dossier["regulatory_anchors"]) >= 1

    # Read-Only Auditor cannot resubmit Susulan
    forbidden_sub = client.post(
        "/api/v1/claims/CLM-2026-8802/resubmit-susulan",
        headers=AUDITOR_HEADERS(),
        json={
            "catatan_faskes": "Coba kirim ulang oleh read-only",
            "dokumen_tambahan": ["SEP_FRISTA_VCLAIM"],
        },
    )
    assert forbidden_sub.status_code == 403

    before_count = client.get("/api/v1/claims/CLM-2026-8802/vedika-dossier").json()["dossier"]["resubmission_timeline"]["resubmission_count"]
    sub_res = client.post(
        "/api/v1/claims/CLM-2026-8802/resubmit-susulan",
        headers=VERIFIKATOR_HEADERS(),
        json={
            "catatan_faskes": "FKRTL melampirkan ulang Resume Medis bertanda TTE DPJP dan verifikasi FRISTA",
            "perbaikan_icd10": "I21.4 (Non-ST elevation myocardial infarction)",
            "perbaikan_cbg": "I-4-10-I",
            "tarif_revisi_rp": 14500000,
            "dokumen_tambahan": ["SEP_FRISTA_VCLAIM", "RESUME_TTE_DPJP"],
            "jenis_pengajuan": "Susulan",
        },
    )
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert sub_data["status"] == "success"
    assert sub_data["resubmission_count"] == before_count + 1
    updated_claim = sub_data["claim"]
    assert updated_claim["jenis_pengajuan"] == "Susulan"
    assert updated_claim["ina_cbg_verified"] == "I-4-10-I"
    assert updated_claim["fkl48_biaya_verifikasi"] == 14500000
    assert updated_claim["frista_verified"] is True
    assert updated_claim["tte_dpjp_valid"] is True
    assert updated_claim["status_verifikasi"] is None

    # Susulan filter picks up CLM-2026-8802
    susulan_list = client.get("/api/v1/claims?jenis_pengajuan=Susulan").json()
    assert any(item["claim"]["claim_id"] == "CLM-2026-8802" for item in susulan_list)


def test_vedika_fkl48_dispute_tier_and_bahv_recap_invariants():
    dec_res = client.post(
        "/api/v1/claims/CLM-2026-8804/decision",
        headers=VERIFIKATOR_HEADERS(),
        json={
            "verifier_id": "198704202011012001",
            "decision": "DISPUTE_TKMKB",
            "catatan_verifikator": "Koreksi severity INA-CBG dan eskalasi dispute Kedeputian Wilayah",
            "pending_reasons": ["KOD-02", "MED-01"],
            "tarif_verifikasi_rp": 12000000,
            "ina_cbg_verified": "I-4-10-I",
            "dispute_level": "KEDEPUTIAN",
        },
    )
    assert dec_res.status_code == 200
    dec_data = dec_res.json()
    assert dec_data["status"] == "success"
    dossier_after = client.get("/api/v1/claims/CLM-2026-8804/vedika-dossier").json()["dossier"]
    assert dossier_after["billing_reconciliation"]["fkl48_biaya_verifikasi_rp"] == 12000000
    assert dossier_after["billing_reconciliation"]["ina_cbg_verified"] == "I-4-10-I"
    assert dossier_after["resubmission_timeline"]["dispute_level"] == "KEDEPUTIAN"
    assert [r["code"] for r in dossier_after["resolved_pending_reasons"]] == ["KOD-02", "MED-01"]

    recap_res = client.get("/api/v1/screening/bahv-recap")
    assert recap_res.status_code == 200
    recap = recap_res.json()
    assert recap["status"] == "success"
    assert "buckets" in recap
    assert "service_breakdown" in recap
    assert "fpk_batches" in recap
    assert "daluwarsa_watch" in recap

    sb = recap["service_breakdown"]
    for bucket_name in ("LAYAK", "PENDING", "DISPUTE", "TIDAK_LAYAK"):
        assert bucket_name in sb
        b = sb[bucket_name]
        assert set(b.keys()) >= {"RJTL", "RITL", "TOTAL"}
        assert b["RJTL"]["kasus"] + b["RITL"]["kasus"] == b["TOTAL"]["kasus"]
        assert b["RJTL"]["biaya_tagih_rp"] + b["RITL"]["biaya_tagih_rp"] == b["TOTAL"]["biaya_tagih_rp"]
        assert b["RJTL"]["biaya_disetujui_rp"] + b["RITL"]["biaya_disetujui_rp"] == b["TOTAL"]["biaya_disetujui_rp"]
        assert b["RJTL"]["selisih_rp"] + b["RITL"]["selisih_rp"] == b["TOTAL"]["selisih_rp"]


def test_vedika_printable_documents_and_no_emoji():
    bahv_res = client.get("/api/v1/vedika/fpk-bahv-printable")
    assert bahv_res.status_code == 200
    bahv = bahv_res.json()
    assert bahv["status"] == "success"
    assert len(bahv["document_hash"]) == 64
    assert "BERITA ACARA HASIL VERIFIKASI" in bahv["html_printable"]
    assert "RJTL" in bahv["html_printable"]
    assert "RITL" in bahv["html_printable"]
    assert not any(ord(ch) > 0x2600 for ch in bahv["html_printable"])

    pending_res = client.get("/api/v1/vedika/ba-pending-printable")
    assert pending_res.status_code == 200
    pending_doc = pending_res.json()
    assert pending_doc["status"] == "success"
    assert len(pending_doc["document_hash"]) == 64
    assert "DISPUTE" in pending_doc["html_printable"] or "PENDING" in pending_doc["html_printable"]
    assert not any(ord(ch) > 0x2600 for ch in pending_doc["html_printable"])
