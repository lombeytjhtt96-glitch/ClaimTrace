"""
Unit & Integration Tests for Document Auditor, Fraud Ranking, and Two-Tier Human Adjudication
==============================================================================================
"""

import pytest
from app.engine.document_auditor import document_auditor, DocumentMetadata
from app.engine.fraud_ranking import fraud_ranking_engine
from app.engine.human_adjudication import human_adjudication_mgr
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_document_auditor_bundle_generation():
    docs = document_auditor.generate_synthetic_document_bundle("CLM-2026-8801")
    assert len(docs) >= 5
    doc_types = {d.doc_type for d in docs}
    assert "SEP" in doc_types
    assert "RESUME_MEDIS" in doc_types
    assert "BILLING_RS" in doc_types
    assert "RUJUKAN_FKTP" in doc_types


def test_document_auditor_temporal_inversion_detection():
    report = document_auditor.audit_claim_document_bundle(
        claim_id="CLM-2026-8801",
        ina_cbg_code="Z-3-12-0",
        primary_icd10="M54.5"
    )
    assert report.claim_id == "CLM-2026-8801"
    # CLM-2026-8801 has temporal inversion in resume medis (discharge 2026-01-03 before admission 2026-10-14)
    temporal_findings = [f for f in report.findings if f.category == "TEMPORAL"]
    assert len(temporal_findings) >= 1
    assert report.cross_document_checks["temporal_coherence_verified"] is False
    assert report.audit_status == "INDIKASI_FABRIKASI"


def test_document_auditor_surgical_without_report():
    # Pass custom docs without LAPORAN_OPERASI
    docs = document_auditor.generate_synthetic_document_bundle("CLM-NORMAL-01")
    report = document_auditor.audit_claim_document_bundle(
        claim_id="CLM-NORMAL-01",
        ina_cbg_code="M-1-04-I",
        primary_icd10="K80.0",
        procedure_icd9cm="51.23", # Laparoscopic cholecystectomy
        documents=docs
    )
    surg_findings = [f for f in report.findings if f.rule_id == "DOC-SURG-002"]
    assert len(surg_findings) == 1
    assert "Laporan Operasi" in surg_findings[0].title


def test_fraud_ranking_national_leaderboard():
    res = fraud_ranking_engine.get_national_fraud_rankings()
    assert res["total_faskes_evaluated"] >= 10
    assert len(res["rankings"]) >= 10
    # Top rank should have highest risk score
    top_faskes = res["rankings"][0]
    assert top_faskes["rank"] == 1
    assert top_faskes["fraud_risk_score"] >= 90.0
    assert "RS Medika Prima" in top_faskes["faskes_name"]


def test_fraud_ranking_filtering():
    res_filtered = fraud_ranking_engine.get_national_fraud_rankings(
        kelas_filter="Kelas B"
    )
    for p in res_filtered["rankings"]:
        assert "Kelas B" in p["kelas_rs"]


def test_two_tier_human_adjudication_flow():
    claim_id = "CLM-TEST-ADJUDICATION-99"
    # 1. Init
    dossier = human_adjudication_mgr.get_adjudication_dossier(claim_id)
    assert dossier.current_status == "MENUNGGU_TIER_1"

    # 2. Tier 1 Review
    d1 = human_adjudication_mgr.submit_tier_1_review(
        claim_id=claim_id,
        verifikator_name="dr. Siti Rahma, Sp.PK",
        verifikator_nip="19870420 201101 2 001",
        verdict="HOLD_KLARIFIKASI",
        clinical_notes="Perlu konfirmasi hasil kultur darah pada penjamin faskes.",
        documents_verified=["SEP", "RESUME_MEDIS"]
    )
    assert d1.current_status == "MENUNGGU_PENELAAH_TIER_2"
    assert d1.tier_1_record is not None
    assert d1.tier_1_record.preliminary_verdict == "HOLD_KLARIFIKASI"

    # 3. Tier 2 Override
    d2 = human_adjudication_mgr.submit_tier_2_override(
        claim_id=claim_id,
        reviewer_name="dr. H. Ahmad Fauzi, Sp.A",
        reviewer_nip="19780512 200312 1 002",
        final_verdict="SETUJUI_LAYAK",
        is_overridden=True,
        override_justification="Hasil kultur darah susulan telah diserahkan dan membuktikan bakteremia gram negatif.",
        regulatory_justification="Permenkes No. 26 Tahun 2021 Kaidah Koding Sepsis.",
        second_opinion_notes="Disetujui layak bayar setelah verifikasi langsung."
    )
    assert d2.current_status == "PUTUSAN_FINAL_DISAHKAN"
    assert d2.tier_2_record.is_system_overridden is True
    assert d2.tier_2_record.final_human_verdict == "SETUJUI_LAYAK"


def test_api_document_endpoints():
    res = client.get("/api/v1/documents/audit/CLM-2026-8801")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "compliance_score_pct" in data
    assert "findings" in data
    assert len(data["documents"]) >= 5

    res_bundle = client.get("/api/v1/documents/bundle/CLM-2026-8801")
    assert res_bundle.status_code == 200
    bundle = res_bundle.json()
    assert bundle["total_documents"] >= 5


def test_api_fraud_ranking_endpoint():
    res = client.get("/api/v1/analytics/fraud-ranking?sort_by=risk_score")
    assert res.status_code == 200
    data = res.json()
    assert data["total_faskes_evaluated"] >= 10
    assert len(data["rankings"]) >= 10


def test_api_two_tier_adjudication_endpoints():
    cid = "CLM-API-TEST-01"
    # Get initial
    g_res = client.get(f"/api/v1/adjudication/two-tier/{cid}")
    assert g_res.status_code == 200

    # Submit Tier 1
    t1_payload = {
        "claim_id": cid,
        "verifikator_name": "dr. Siti Rahma, Sp.PK",
        "verifikator_nip": "19870420 201101 2 001",
        "verdict": "DISPUTE_KODING",
        "clinical_notes": "Koding sekunder tidak memadai.",
        "documents_verified": ["SEP", "RESUME_MEDIS"]
    }
    t1_res = client.post("/api/v1/adjudication/tier-1-review", json=t1_payload)
    assert t1_res.status_code == 200
    assert t1_res.json()["dossier"]["current_status"] == "MENUNGGU_PENELAAH_TIER_2"

    # Submit Tier 2 Override
    t2_payload = {
        "claim_id": cid,
        "reviewer_name": "dr. H. Ahmad Fauzi, Sp.A",
        "reviewer_nip": "19780512 200312 1 002",
        "final_verdict": "SETUJUI_LAYAK",
        "is_overridden": True,
        "override_justification": "Dokter spesialis penelaah mengesahkan berdasarkan catatan klinis lengkap.",
        "regulatory_justification": "Permenkes 26/2021",
        "second_opinion_notes": "Disetujui penuh."
    }
    t2_res = client.post("/api/v1/adjudication/tier-2-override", json=t2_payload)
    assert t2_res.status_code == 200
    assert t2_res.json()["dossier"]["current_status"] == "PUTUSAN_FINAL_DISAHKAN"
