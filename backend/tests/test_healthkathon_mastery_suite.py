from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_post_verify_phantom_billing_and_ml_pipeline():
    payload = {
        "claim_id": "CLM-2026-8801",
        "pstv01_peserta_id": "PSTV-77218902",
        "fkp02_rujukan_id": "FKP-109281",
        "hospital_name": "RS Khusus Mitra Husada",
        "fkl09_kelas_rs": "Kelas C",
        "fkl17_icd10_primer": "M54.5",
        "fkl24_secondary_diagnoses": [],
        "fkl30_icd9_procedure": "93.39",
        "fkl19_inacbg_code": "Z-3-12-0",
        "fkl23_severity_level": "0",
        "length_of_stay": 1,
        "fkl47_claimed_amount": 15300000.0,
        "fkl32_standard_tariff": 1800000.0,
        "cluster_spike_ratio": 8.5,
        "repeat_interval_days": 4,
        "terdaftar_baksos_resmi": False,
        "sip_status": "EXPIRED",
        "geovelocity_kmh": 28.0,
        "mobile_jkn_denied_ratio": 0.80,
        "clinical_text_clone_similarity": 0.94,
        "lapis4_vital_lab_coherence_score": 18.0,
        "simulate_llm_timeout": False,
    }
    res = client.post("/verify", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["claim_id"] == "CLM-2026-8801"
    assert data["triage_lane"] == "MERAH"
    assert data["risk_score"] >= 75.0
    assert data["risk_level"] == "CRITICAL_HOLD_PREPAYMENT"
    assert data["stage_4_in_memory_ml_inference"]["loaded_once_at_startup"] is True
    assert data["stage_4_in_memory_ml_inference"]["ml_inference_latency_ms"] < 100.0
    assert data["meets_sub_1s_production_sla"] is True
    assert data["bea_integration_touchpoints"]["s06_keuangan_guard"] == "BLOCKED_BEFORE_S06_IN_MONICA"


def test_post_verify_hard_negative_hemodialysis_protection():
    payload = {
        "claim_id": "CLM-2026-HN-HD01",
        "pstv01_peserta_id": "PSTV-88901234",
        "fkp02_rujukan_id": "FKP-209112",
        "hospital_name": "RSUP Dr. Hasan Sadikin",
        "fkl09_kelas_rs": "Kelas A",
        "fkl17_icd10_primer": "Z49.1",
        "fkl24_secondary_diagnoses": ["N18.5", "I12.0"],
        "fkl30_icd9_procedure": "39.95",
        "fkl19_inacbg_code": "N-3-15-0",
        "fkl23_severity_level": "0",
        "length_of_stay": 1,
        "fkl47_claimed_amount": 1850000.0,
        "fkl32_standard_tariff": 1800000.0,
        "cluster_spike_ratio": 2.4,
        "repeat_interval_days": 3,
        "terdaftar_baksos_resmi": False,
        "sip_status": "ACTIVE",
        "geovelocity_kmh": 12.0,
        "mobile_jkn_denied_ratio": 0.0,
        "clinical_text_clone_similarity": 0.25,
        "lapis4_vital_lab_coherence_score": 92.0,
        "simulate_llm_timeout": False,
    }
    res = client.post("/api/v1/verify", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["hard_negative_protected"] is True
    assert data["triage_lane"] == "HIJAU"
    assert data["risk_score"] <= 30.0
    assert data["recommended_action"] == "FAST_TRACK_APPROVE_C03_04"
    assert data["bea_integration_touchpoints"]["s06_keuangan_guard"] == "CLEARED_FOR_S06_PAYMENT"


def test_post_verify_resilient_fallback_on_llm_timeout():
    payload = {
        "claim_id": "CLM-2026-8809",
        "pstv01_peserta_id": "PSTV-44109283",
        "hospital_name": "RSUD Kota Pratama",
        "fkl09_kelas_rs": "Kelas B",
        "fkl17_icd10_primer": "I50.0",
        "fkl24_secondary_diagnoses": [],
        "fkl30_icd9_procedure": "89.52",
        "fkl19_inacbg_code": "I-4-10-III",
        "fkl23_severity_level": "III",
        "length_of_stay": 4,
        "fkl47_claimed_amount": 19500000.0,
        "fkl32_standard_tariff": 7200000.0,
        "cluster_spike_ratio": 4.2,
        "repeat_interval_days": 10,
        "sip_status": "EXPIRED",
        "geovelocity_kmh": 140.0,
        "mobile_jkn_denied_ratio": 0.65,
        "clinical_text_clone_similarity": 0.88,
        "lapis4_vital_lab_coherence_score": 22.0,
        "simulate_llm_timeout": True,
    }
    res = client.post("/verify", json=payload)
    assert res.status_code == 200
    data = res.json()

    fb = data["stage_5_and_6_llm_and_fallback"]
    assert fb["fallback_active"] is True
    assert fb["fallback_source"] == "LOCAL_DETERMINISTIC_RULE_ENGINE"
    assert "SIMULATED_LLM_TIMEOUT" in fb["fallback_reason"]
    assert len(fb["clinical_audit_summary"]) > 20
    assert len(fb["regulatory_citations"]) >= 3


def test_get_credible_evidence_hkeval_suite():
    res = client.get("/api/v1/healthkathon/credible-evidence?verifiers=1&cases_per_day=5&working_days=10")
    assert res.status_code == 200
    data = res.json()

    assert "Dari 50 berkas yang diaudit" in data["headline_jury_sentence"]["indonesian"]
    assert "Of 50 cases audited" in data["headline_jury_sentence"]["english"]

    metrics = data["baseline_benchmark_metrics"]
    assert metrics["capacity_k"] == 50
    assert metrics["precision_at_k_pct"] >= 70.0
    assert metrics["lift_over_random"] >= 25.0
    assert metrics["rupiah_recall_at_k_pct"] >= 55.0
    assert len(metrics["caught_fraud_ci_95"]) == 2

    dials = data["five_condition_dials"]
    assert len(dials) == 5

    holdout = data["hold_out_fraud_evaluation"]["breakdown"]
    modes = [item["modus"] for item in holdout]
    assert "HOLD_OUT_SERVICE_UNBUNDLING" in modes
    assert "HOLD_OUT_PROLONGED_LOS" in modes

    assert data["paired_ablation_study"]["net_improvement"]["precision_gain_pct_points"] > 15.0
    assert len(data["fidelity_and_leakage_audit"]["reforms_checks"]) == 5

    scores_path = Path(data["hkeval_artifacts"]["scores_csv_path"])
    truth_path = Path(data["hkeval_artifacts"]["truth_csv_path"])
    assert scores_path.exists()
    assert truth_path.exists()
    assert scores_path.read_text(encoding="utf-8").splitlines()[0] == "entity_id,group_id,score,strata"
    assert truth_path.read_text(encoding="utf-8").splitlines()[0] == "entity_id,label,modus,excess_rupiah"


def test_get_bea_governance_blueprint():
    res = client.get("/api/v1/healthkathon/bea-governance")
    assert res.status_code == 200
    data = res.json()

    codes = [item["bea_code"] for item in data["bea_macro_mapping"]]
    assert "C01" in codes
    assert "C02" in codes
    assert "C03" in codes
    assert "C03.04 / C03.04.02" in codes
    assert "S06" in codes

    assert len(data["four_layer_architecture"]) == 4
    assert data["four_layer_architecture"][3]["layer_number"] == 4
    assert len(data["six_ai_principles"]) == 6
    assert len(data["four_pre_ai_checks"]) == 4
    assert len(data["bpjs_sample_data_dictionary"]) == 8


def test_duckdb_deterministic_audit_result_and_zero_phi():
    from app.security.token_manager import create_access_token

    token = create_access_token({
        "nip": "199003152018011005",
        "name": "dr. Andi Pratama, MARS",
        "role": "Auditor Pengawasan (Read-Only)",
        "unit": "Kantor Pusat BPJS Kesehatan",
    })
    headers = {"Authorization": f"Bearer {token}"}

    sample_rows = [
        {
            "PSTV01": "PSTV-1001",
            "FKL19": "Z-3-12-0",
            "FKL47": 4500000,
            "FKL32": 1800000,
            "final_priority_score": 88.5,
            "sip_status": "EXPIRED",
        },
        {
            "PSTV01": "PSTV-1001",
            "FKL19": "Z-3-12-0",
            "FKL47": 3200000,
            "FKL32": 1800000,
            "final_priority_score": 76.0,
            "sip_status": "VALID",
        },
    ]

    res = client.post(
        "/api/v1/duckdb/audit-result",
        json={
            "table_name": "bpjs_fkrtl_2024",
            "sql_query": "SELECT * FROM bpjs_fkrtl_2024 LIMIT 2",
            "rows": sample_rows,
            "total_rows": 2,
        },
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["engine"] == "LOCAL_DETERMINISTIC_SQL_AUDITOR"
    assert data["zero_external_llm"] is True
    assert data["analyzed_rows"] == 2
    assert data["metrics"]["excess_claim_rows"] == 2
    assert data["metrics"]["total_excess_rp"] == 4100000.0
    assert data["metrics"]["high_risk_rows"] == 2
    assert data["metrics"]["duplicate_entity_rows"] == 1
    assert data["metrics"]["top_code"] == "Z-3-12-0"
    assert data["phi_audit"]["status"] == "PATUH_ZERO_PHI"
    assert data["human_in_the_loop_gate"] == "WAJIB_VERIFIKASI_DAN_PENGESAHAN_MANUSIA"
    rule_codes = [s["rule_code"] for s in data["anomaly_signals"]]
    assert "TARIFF_EXCESS_FKL47_FKL32" in rule_codes
    assert "SDMK_SIP_HARD_TRIGGER" in rule_codes
    assert "DUPLICATE_ENTITY_REPEAT_BILLING" in rule_codes

    # Verify PHI detection when unmasked 16-digit NIK appears in query rows
    phi_res = client.post(
        "/api/v1/duckdb/audit-result",
        json={
            "table_name": "bpjs_fkrtl_2024",
            "sql_query": "SELECT * FROM bpjs_fkrtl_2024 LIMIT 1",
            "rows": [{"PSTV01": "3273011205880004", "FKL47": 1000000, "FKL32": 1000000}],
            "total_rows": 1,
        },
        headers=headers,
    )
    assert phi_res.status_code == 200
    phi_data = phi_res.json()
    assert phi_data["phi_audit"]["status"] == "PERINGATAN_PHI_TERBUKA"
    assert phi_data["phi_audit"]["unmasked_identifiers_detected"] == 1


def test_legacy_gemini_route_completely_removed():
    res = client.post("/api/v1/gemini/generate", json={"prompt": "test"})
    assert res.status_code == 404
    openapi_paths = app.openapi().get("paths", {})
    assert "/api/v1/gemini/generate" not in openapi_paths
    assert "/api/v1/claimtrace-ai/generate" in openapi_paths
    assert "/api/v1/duckdb/audit-result" in openapi_paths


def test_healthkathon_four_pillars_and_openapi_clean():
    """
    Verify the 4-Pillar Healthkathon Scorecard, Before-vs-After Impact Matrix,
    GraviTI TW III/2026 Strategic Alignment, ROPA/DPIA Privacy Matrix,
    Business Model Rollout Roadmap, and zero duplicate OpenAPI operation IDs.
    """
    import warnings

    res = client.get("/api/v1/healthkathon/bea-governance")
    assert res.status_code == 200
    data = res.json()

    # 1. 4-Pillar Scorecard (4 x 25% = 100%)
    pillars = data.get("healthkathon_four_pillars_scorecard", [])
    assert len(pillars) == 4
    assert sum(p["weight_pct"] for p in pillars) == 100

    # 2. Before vs After Impact Matrix
    impact_matrix = data.get("before_vs_after_impact_matrix", [])
    assert len(impact_matrix) >= 6

    # 3. GraviTI TW III/2026 Strategic Alignment
    graviti = data.get("graviti_strategic_alignment_2026", {})
    scale = graviti.get("ecosystem_scale", {})
    assert scale.get("kantor_cabang_count") == 126
    assert scale.get("fktp_count") == 23816
    assert scale.get("fkrtl_count") == 3221
    assert scale.get("smart_vedika_pilot_fkrtl_count") == 12
    assert scale.get("bea_active_apps_total") == 159
    assert len(graviti.get("four_strategic_themes", [])) == 4
    assert len(graviti.get("key_initiatives_2026_2027", [])) == 4

    # 4. ROPA & DPIA Privacy Matrix (UU PDP No. 27/2022)
    ropa_dpia = data.get("ropa_dpia_privacy_matrix", [])
    assert len(ropa_dpia) >= 4

    # 5. Business Model & 3-Phase National Rollout Roadmap
    rollout = data.get("business_model_and_rollout_roadmap", {})
    assert len(rollout.get("phases", [])) == 3

    # 6. Verify OpenAPI schema generation produces zero Duplicate Operation ID warnings
    app.openapi_schema = None
    with warnings.catch_warnings(record=True) as caught_warnings:
        warnings.simplefilter("always")
        schema = app.openapi()
        assert "paths" in schema
        dup_warnings = [
            w for w in caught_warnings if "Duplicate Operation ID" in str(w.message)
        ]
        assert len(dup_warnings) == 0, f"Found duplicate operation IDs: {dup_warnings}"
