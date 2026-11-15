"""
Unit & Integration Tests: Two-Tier Human Review & Adjudication Override Engine
==============================================================================
Kepatuhan Regulasi & Standar BPJS Kesehatan:
- Perpres No. 82/2018 (Pasal 74, 75, 76)
- UU No. 27/2022 (Audit Trail Kriptografis Putusan Pejabat)
- Petunjuk Teknis Verifikasi BPJS Kesehatan (Dual-Level Verification: Verifikator 1 & Dokter Penelaah 2)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine.human_adjudication import HumanAdjudicationManager, human_adjudication_mgr


client = TestClient(app)


def test_human_adjudication_seed_case():
    """Memastikan data awal untuk CLM-2026-8801 terinisialisasi lengkap."""
    dossier = human_adjudication_mgr.get_adjudication_dossier("CLM-2026-8801")
    assert dossier.claim_id == "CLM-2026-8801"
    assert dossier.current_status == "PUTUSAN_FINAL_DISAHKAN"
    assert dossier.tier_1_record is not None
    assert dossier.tier_1_record.verifikator_name == "dr. Siti Rahma, Sp.PK"
    assert dossier.tier_2_record is not None
    assert dossier.tier_2_record.is_system_overridden is True
    assert "Fauzi" in dossier.tier_2_record.reviewer_name
    assert len(dossier.tier_2_record.digital_signature_hash) == 64


def test_human_adjudication_workflow_lifecycle():
    """Menguji siklus hidup verifikasi manusia 2-lapis dari Tier 1 hingga Tier 2."""
    mgr = HumanAdjudicationManager()
    test_claim_id = "CLM-TEST-ADJUDICATION-99"

    # Inisialisasi awal
    dossier = mgr.get_adjudication_dossier(test_claim_id)
    assert dossier.current_status == "MENUNGGU_TIER_1"
    assert dossier.tier_1_record is None
    assert dossier.tier_2_record is None

    # Step 1: Telaah Tier 1 oleh Verifikator Medis Pertama
    dossier_t1 = mgr.submit_tier_1_review(
        claim_id=test_claim_id,
        verifikator_name="Verifikator Rina, S.Kep",
        verifikator_nip="199201012015022001",
        verdict="DISPUTE_KODING",
        clinical_notes="Ditemukan indikasi penulisan diagnosa sekunder yang tidak didukung bukti rekam medis.",
        documents_verified=["SEP", "RESUME_MEDIS", "LAPORAN_OPERASI"]
    )
    assert dossier_t1.current_status == "MENUNGGU_PENELAAH_TIER_2"
    assert dossier_t1.tier_1_record.is_completed is True
    assert dossier_t1.tier_1_record.preliminary_verdict == "DISPUTE_KODING"

    # Step 2: Pengesahan & Hak Koreksi Tier 2 oleh Dokter Penelaah Senior
    dossier_t2 = mgr.submit_tier_2_override(
        claim_id=test_claim_id,
        reviewer_name="dr. Budi Setiawan, Sp.B (Dokter Penelaah Senior BPJS)",
        reviewer_nip="197503152000031002",
        final_verdict="DISPUTE_KODING",
        is_overridden=True,
        override_justification="Anulir putusan penolakan total sistem. Disetujui penyesuaian koding sesuai Permenkes 26/2021.",
        regulatory_justification="Permenkes No. 26/2021 Bab IV Kaidah Koding INA-CBG",
        second_opinion_notes="Tindakan bedah terkonfirmasi terjadi namun severity level diturunkan ke Level I."
    )
    assert dossier_t2.current_status == "PUTUSAN_FINAL_DISAHKAN"
    assert dossier_t2.tier_2_record.is_signed_off is True
    assert dossier_t2.tier_2_record.is_system_overridden is True
    assert len(dossier_t2.tier_2_record.digital_signature_hash) == 64
    assert len(dossier_t2.audit_chain_hash) == 64


def test_api_two_tier_adjudication_endpoints():
    """Menguji endpoint REST API verifikasi 2-lapis."""
    claim_id = "CLM-2026-8802"

    # GET Status
    res_get = client.get(f"/api/v1/adjudication/two-tier/{claim_id}")
    assert res_get.status_code == 200
    data_get = res_get.json()
    assert data_get["claim_id"] == claim_id

    # POST Tier 1
    t1_payload = {
        "claim_id": claim_id,
        "verifikator_name": "dr. Siti Rahma, Sp.PK",
        "verifikator_nip": "19870420 201101 2 001",
        "verdict": "HOLD_KLARIFIKASI",
        "clinical_notes": "Memerlukan konfirmasi bukti radiologi dada sebelum verifikasi final.",
        "documents_verified": ["SEP", "BILLING_RS"]
    }
    res_t1 = client.post("/api/v1/adjudication/tier-1-review", json=t1_payload)
    assert res_t1.status_code == 200
    assert res_t1.json()["status"] == "success"

    # POST Tier 2 Override
    t2_payload = {
        "claim_id": claim_id,
        "reviewer_name": "dr. H. Ahmad Fauzi, Sp.A",
        "reviewer_nip": "19780512 200312 1 002",
        "final_verdict": "HOLD_KLARIFIKASI",
        "is_overridden": False,
        "override_justification": None,
        "regulatory_justification": "Perpres No. 82/2018 Pasal 76",
        "second_opinion_notes": "Menyetujui telaah Tier 1 untuk klarifikasi faktual ke rumah sakit."
    }
    res_t2 = client.post("/api/v1/adjudication/tier-2-override", json=t2_payload)
    assert res_t2.status_code == 200
    assert res_t2.json()["status"] == "success"

    # Verify updated dossier
    res_check = client.get(f"/api/v1/adjudication/two-tier/{claim_id}")
    assert res_check.status_code == 200
    assert res_check.json()["current_status"] == "PUTUSAN_FINAL_DISAHKAN"
