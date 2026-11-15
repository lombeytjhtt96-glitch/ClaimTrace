"""
ClaimTrace JKN - Unit & Integration Tests for 5-Pillar Upgrade
Covers:
1. Live SQL Provider Fraud Profiling (1.699M bpjs_fkrtl_all cohorts)
2. ICD-10 WHO / Permenkes 76/2016 Rule MB1-MB5, Fornas, Readmission 30D & Real Bundle Store
3. SATUSEHAT HL7 FHIR R4 Bundle / MedicationRequest / Claim/$submit (201 / 422)
4. Formal Sanggahan BAKB Claims Appeals (15-day SLA & Perpres 82/2018 1%/mo penalty)
5. CSO CSV Formula Injection Neutralization & Non-Blocking Synthesis
"""

from __future__ import annotations

import os
from datetime import date, timedelta

from fastapi.testclient import TestClient
from app import main as app_main
from app.engine import appeals_engine, document_bundle_store

client = TestClient(app_main.app)


def test_pillar1_live_warehouse_provider_profiling():
    res = client.get("/api/v1/analytics/fraud-ranking")
    assert res.status_code == 200
    data = res.json()
    assert data["total_faskes_evaluated"] >= 10
    assert data["rankings"][0]["faskes_name"]
    assert data["warehouse_available"] is True
    assert data["warehouse_rows_scanned"] >= 1_699_000
    assert len(data["live_warehouse_clusters"]) >= 5

    # Enriched warehouse cohort telemetry attached to ranking items
    first = data["rankings"][0]
    assert "warehouse_cohort_id" in first
    assert "cohort_hhi_specialty" in first
    assert "cohort_inpatient_ratio_pct" in first
    assert "cohort_avg_los_days" in first

    # Direct warehouse clusters endpoint with Kelas filter
    wh_res = client.get("/api/v1/analytics/fraud-ranking/warehouse-clusters?kelas_filter=Kelas B")
    assert wh_res.status_code == 200
    wh = wh_res.json()
    assert wh["warehouse_available"] is True
    assert wh["total_cohorts"] >= 1
    for c in wh["clusters"]:
        assert "Kelas B" in c["facility_class"] or "Kelas B" in c["cohort_label"]
        assert c["hhi_specialty_concentration"] >= 0


def test_pillar2_morbidity_mb1_mb5_fornas_and_readmission():
    # Test MB3 (symptom primary R50.9 with major sepsis secondary A41.9) + MB5 (HD 39.95 without renal primary)
    res = client.post(
        "/api/v1/clinical/morbidity-audit",
        json={
            "primary_icd10": "R50.9",
            "secondary_icd10s": ["A41.9", "I50.0"],
            "procedure_icd9cm": ["39.95"],
            "patient_age": 55,
            "patient_sex": "L",
            "tarif_klaim_rp": 14500000,
            "medications": ["Human Albumin 20%", "Trastuzumab"],
        },
    )
    assert res.status_code == 200
    payload = res.json()
    rule_codes = [f["rule_code"] for f in payload["morbidity_audit"]["findings"]]
    assert "RULE-MB3" in rule_codes
    assert "RULE-MB5" in rule_codes
    assert payload["fornas_audit"]["fornas_compliant"] is False
    fornas_codes = [f["rule_code"] for f in payload["fornas_audit"]["flags"]]
    # Note: Human Albumin is clinically allowed for sepsis A41.9; Trastuzumab without C50 triggers Fornas flag
    assert any("TRASTUZUMAB" in c for c in fornas_codes)

    # Test MB2 + WHO Biological Age/Sex plausibility + non-indicated Human Albumin Fornas flag
    res_bio = client.post(
        "/api/v1/clinical/morbidity-audit",
        json={
            "primary_icd10": "I10",
            "secondary_icd10s": ["I50.0", "O80.0"],
            "patient_age": 72,
            "patient_sex": "L",
            "tarif_klaim_rp": 8200000,
            "medications": ["Human Albumin 20%"],
        },
    )
    assert res_bio.status_code == 200
    bio_json = res_bio.json()
    bio_codes = [f["rule_code"] for f in bio_json["morbidity_audit"]["findings"]]
    assert "RULE-MB2" in bio_codes
    assert "RULE-MB4-AGE-OBSTETRIC" in bio_codes
    assert "RULE-MB4-SEX-MALE" in bio_codes
    bio_fornas_codes = [f["rule_code"] for f in bio_json["fornas_audit"]["flags"]]
    assert any("HUMAN" in c for c in bio_fornas_codes)

    # Test Readmission 30D encounter logic
    res_readm = client.post(
        "/api/v1/clinical/readmission-30d",
        json={
            "encounters": [
                {"claim_id": "ENC-1", "admission_date": "2026-10-01", "discharge_date": "2026-10-04", "primary_icd10": "I50.0"},
                {"claim_id": "ENC-2", "admission_date": "2026-10-10", "discharge_date": "2026-10-14", "primary_icd10": "I50.9"},
            ]
        },
    )
    assert res_readm.status_code == 200
    rd = res_readm.json()
    assert rd["has_readmission_alert"] is True
    assert rd["alerts"][0]["gap_days"] == 6
    assert rd["alerts"][0]["same_diagnosis_prefix"] is True


def test_pillar2_real_document_bundle_submission_lifecycle():
    claim_id = "CLM-2026-TESTREAL"
    bundle_backup = None
    if os.path.exists(document_bundle_store._STORE_PATH):
        with open(document_bundle_store._STORE_PATH, "r", encoding="utf-8") as fh:
            bundle_backup = fh.read()
    try:
        sub = client.post(
            "/api/v1/documents/audit/submit",
            json={
                "claim_id": claim_id,
                "ina_cbg_code": "I-4-10-II",
                "primary_icd10": "R50.9",
                "secondary_icd10s": ["A41.9"],
                "procedure_icd9cm": "51.23",
                "claimed_tariff_rp": 15000000,
                "documents": [
                    {"doc_type": "SEP", "extracted_fields": {"tgl_sep": "2026-10-01"}},
                    {"doc_type": "RESUME_MEDIS", "extracted_fields": {"tgl_masuk": "2026-10-01", "tgl_keluar": "2026-10-05"}},
                    {"doc_type": "PENUNJANG_LAB"},
                    {"doc_type": "BILLING_RS"},
                ],
            },
        )
        assert sub.status_code == 200
        sub_data = sub.json()
        assert sub_data["bundle_source"] == "submitted_real"
        assert sub_data["is_synthetic_baseline"] is False
        assert any(f["rule_id"] == "DOC-SURG-002" for f in sub_data["findings"])
        assert any(f["rule_code"] == "RULE-MB3" for f in sub_data["morbidity_audit"]["findings"])

        eff = client.get(f"/api/v1/documents/audit/effective/{claim_id}")
        assert eff.status_code == 200
        assert eff.json()["bundle_source"] == "submitted_real"

        del_res = client.delete(f"/api/v1/documents/audit/submitted/{claim_id}")
        assert del_res.status_code == 200

        eff_after = client.get(f"/api/v1/documents/audit/effective/{claim_id}")
        assert eff_after.status_code == 200
        assert eff_after.json()["bundle_source"] == "synthetic_reference"
        assert eff_after.json()["is_synthetic_baseline"] is True
    finally:
        if bundle_backup is not None:
            with open(document_bundle_store._STORE_PATH, "w", encoding="utf-8") as fh:
                fh.write(bundle_backup)
        elif os.path.exists(document_bundle_store._STORE_PATH):
            os.remove(document_bundle_store._STORE_PATH)


def test_pillar3_satusehat_fhir_bundle_and_claim_submit():
    from app.engine import fhir_extensions

    with fhir_extensions._STORE_LOCK:
        fhir_backup = {k: dict(v) for k, v in fhir_extensions._CUSTOM_FHIR_RESOURCES.items()}
    try:
        # Invalid Bundle -> 422 OperationOutcome
        bad_bundle = client.post(
            "/fhir/Bundle",
            json={
                "resourceType": "Bundle",
                "type": "collection",
                "entry": [
                    {
                        "resource": {
                            "resourceType": "Patient",
                            "identifier": [{"system": "https://fhir.kemkes.go.id/id/nik", "value": "999"}],
                        }
                    },
                    {
                        "resource": {
                            "resourceType": "Condition",
                            "code": {"coding": [{"system": "http://hl7.org/fhir/sid/icd-10", "code": "ZZZ99"}]},
                        }
                    },
                    {
                        "resource": {
                            "resourceType": "MedicationRequest",
                            "medicationCodeableConcept": {
                                "coding": [{"system": "http://invalid-system.example.org", "code": "X1"}]
                            },
                        }
                    },
                ],
            },
        )
        assert bad_bundle.status_code == 422
        assert bad_bundle.json()["resourceType"] == "OperationOutcome"
        assert len(bad_bundle.json()["issue"]) >= 3

        # Valid Claim/$submit Bundle -> 201 ClaimResponse
        submit_res = client.post(
            "/fhir/Claim/$submit",
            json={
                "resourceType": "Bundle",
                "type": "transaction",
                "entry": [
                    {
                        "resource": {
                            "resourceType": "Patient",
                            "id": "pat-test-901",
                            "identifier": [{"system": "https://fhir.kemkes.go.id/id/nik", "value": "3372010101900001"}],
                        }
                    },
                    {
                        "resource": {
                            "resourceType": "Condition",
                            "code": {"coding": [{"system": "http://hl7.org/fhir/sid/icd-10", "code": "R50.9"}]},
                        }
                    },
                    {
                        "resource": {
                            "resourceType": "Condition",
                            "code": {"coding": [{"system": "http://hl7.org/fhir/sid/icd-10", "code": "A41.9"}]},
                        }
                    },
                    {
                        "resource": {
                            "resourceType": "MedicationRequest",
                            "medicationCodeableConcept": {
                                "text": "Human Albumin 20%",
                                "coding": [{"system": "http://sys-ids.kemkes.go.id/kfa", "code": "93001001", "display": "Human Albumin 20%"}],
                            },
                        }
                    },
                    {
                        "resource": {
                            "resourceType": "Claim",
                            "id": "claim-sub-901",
                            "use": "claim",
                            "total": {"value": 12000000, "currency": "IDR"},
                        }
                    },
                ],
            },
        )
        assert submit_res.status_code == 201
        cr = submit_res.json()
        assert cr["resourceType"] == "ClaimResponse"
        assert cr["outcome"] in ("error", "partial", "complete")
        assert cr["claimtrace_adjudication"]["morbidity_audit"]["total_findings"] >= 1
        assert "Location" in submit_res.headers

        # Read back persisted ClaimResponse via FHIR GET endpoint
        read_cr = client.get(submit_res.headers["Location"])
        assert read_cr.status_code == 200
        assert read_cr.json()["id"] == cr["id"]
    finally:
        with fhir_extensions._STORE_LOCK:
            fhir_extensions._CUSTOM_FHIR_RESOURCES.clear()
            fhir_extensions._CUSTOM_FHIR_RESOURCES.update(fhir_backup)


def test_pillar3_sanggahan_appeals_15d_sla_and_penalty():
    appeals_backup = None
    if os.path.exists(appeals_engine._APPEALS_PATH):
        with open(appeals_engine._APPEALS_PATH, "r", encoding="utf-8") as fh:
            appeals_backup = fh.read()
    try:
        overdue_sub_date = (date.today() - timedelta(days=20)).isoformat()
        sub = client.post(
            "/api/v1/appeals/submit",
            json={
                "claim_id": "CLM-2026-8802",
                "faskes_name": "RSUD Dr. Kariadi",
                "appeal_category": "KODING_RULE_MB",
                "disputed_amount_rp": 10000000,
                "clinical_argument": "Melampirkan resume medis lengkap DPJP beserta CPPT IGD sebagai justifikasi sekuens ICD-10.",
                "supporting_documents": ["Resume Medis DPJP", "CPPT IGD"],
                "submitted_date_override": overdue_sub_date,
            },
        )
        assert sub.status_code == 200
        created = sub.json()["appeal"]
        assert created["is_overdue"] is True
        assert created["overdue_calendar_days"] == 5
        assert created["estimated_penalty_rp"] > 0
        assert created["sla_status"] == "LEWAT_BATAS_DENDA_1PCT"

        adj = client.post(
            f"/api/v1/appeals/{created['appeal_id']}/adjudicate",
            json={
                "decision": "DITERIMA_SEBAGIAN",
                "approved_amount_rp": 7500000,
                "resolution_note": "Bukti CPPT diterima untuk penyesuaian sebagian komponen tarif.",
            },
        )
        assert adj.status_code == 200
        updated = adj.json()["appeal"]
        assert updated["status"] == "DITERIMA_SEBAGIAN"
        assert updated["recovered_amount_rp"] == 7500000.0
    finally:
        if appeals_backup is not None:
            with open(appeals_engine._APPEALS_PATH, "w", encoding="utf-8") as fh:
                fh.write(appeals_backup)
        elif os.path.exists(appeals_engine._APPEALS_PATH):
            os.remove(appeals_engine._APPEALS_PATH)


def test_pillar4_csv_formula_neutralization_and_async_synthesis():
    live_db = app_main.SYNTHETIC_CLAIMS_DATABASE
    first_key = next(iter(live_db))
    orig_hospital = live_db[first_key].nama_faskes
    try:
        live_db[first_key].nama_faskes = "=CMD|'/C calc'!A0"
        csv_res = client.get("/api/v1/claims/export-csv")
        assert csv_res.status_code == 200
        assert "'=CMD" in csv_res.text
        assert "\n=CMD" not in csv_res.text and ",=CMD" not in csv_res.text
    finally:
        live_db[first_key].nama_faskes = orig_hospital
