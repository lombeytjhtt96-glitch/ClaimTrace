"""
Comprehensive Test Suite for ClaimTrace Clinical & Forensic Statistics Engines
Healthkathon BPJS Kesehatan 2026 • Kategori: Efisiensi Risiko pada Faskes (#6 & #11)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine.clinical_auditor import clinical_auditor
from app.engine.forensic_statistics import forensic_statistics
from app.engine.temporal_coherence import temporal_coherence


client = TestClient(app)


class TestClinicalAuditor:
    """Pengujian Unit Algoritma Klinis, Komorbiditas Charlson & Kaidah Koding INA-CBG."""

    def test_charlson_index_with_cardiovascular_and_diabetes(self):
        # Pasien 65 tahun dengan Infark Miokard Akut (I21.9) + Diabetes Komplikasi Organ (E11.2)
        # Weight AMI: 1, Weight DM Komplikasi: 2, Age 65: +3 points -> Total CCI = 6
        result = clinical_auditor.calculate_charlson_index(
            primary_icd10="I21.9",
            secondary_icd10s=["E11.2", "I10"],
            patient_age=65
        )
        assert result["raw_disease_score"] == 3 # 1 + 2
        assert result["age_adjustment_points"] == 3 # (65 - 40)//10 + 1 = 3
        assert result["charlson_score"] == 6
        assert result["comorbidity_level"] == "BERAT"
        assert len(result["detected_comorbidities"]) >= 2
        assert any(c["category"] == "myocardial_infarction" for c in result["detected_comorbidities"])
        assert any(c["category"] == "diabetes_with_end_organ_damage" for c in result["detected_comorbidities"])

    def test_charlson_index_clean_healthy_patient(self):
        # Pasien muda 25 tahun dengan Gastritis Akut (K29.1) tanpa komorbiditas
        result = clinical_auditor.calculate_charlson_index(
            primary_icd10="K29.1",
            secondary_icd10s=[],
            patient_age=25
        )
        assert result["raw_disease_score"] == 0
        assert result["age_adjustment_points"] == 0
        assert result["charlson_score"] == 0
        assert result["comorbidity_level"] == "SANGAT_RENDAH"
        assert result["ten_year_survival_pct"] > 95.0

    def test_upcoding_severity_suspected_when_severity_3_has_zero_comorbidity(self):
        # Kasus Penipuan Upcoding: INA-CBG Tingkat III (I-4-12-III) namun CCI = 0 dan LOS = 1 hari
        eval_res = clinical_auditor.validate_ina_cbg_severity(
            ina_cbg_code="I-4-12-III",
            primary_icd10="I10", # Hipertensi Esensial ringan
            secondary_icd10s=[],
            patient_age=35,
            length_of_stay_days=1
        )
        assert eval_res["upcoding_suspected"] is True
        assert eval_res["claimed_severity_tier"] == 3
        assert eval_res["confidence_pct"] >= 80.0
        assert len(eval_res["reasons"]) >= 1

    def test_upcoding_severity_valid_when_comorbidity_justifies_severity_3(self):
        # Kasus Valid: INA-CBG Tingkat III dengan komorbiditas nyata Gagal Jantung (I50.9) dan CKD (N18.5)
        eval_res = clinical_auditor.validate_ina_cbg_severity(
            ina_cbg_code="I-4-12-III",
            primary_icd10="I21.0",
            secondary_icd10s=["I50.9", "N18.5"],
            patient_age=68,
            length_of_stay_days=5
        )
        assert eval_res["upcoding_suspected"] is False
        assert eval_res["charlson_comorbidity_score"] >= 3

    def test_procedure_compatibility_hemodialysis(self):
        # Hemodialisis (39.95) cocok dengan Gagal Ginjal (N18.5)
        res_valid = clinical_auditor.validate_procedure_compatibility(
            icd9_procedure_code="39.95",
            primary_icd10="N18.5"
        )
        assert res_valid["is_compatible"] is True

        # Hemodialisis (39.95) tidak cocok dengan Dermatitis (L30.9)
        res_invalid = clinical_auditor.validate_procedure_compatibility(
            icd9_procedure_code="39.95",
            primary_icd10="L30.9"
        )
        assert res_invalid["is_compatible"] is False
        assert res_invalid["severity"] == "CRITICAL"


class TestForensicStatistics:
    """Pengujian Unit Statistika Forensik, Hukum Benford & Konsentrasi Gini."""

    def test_benford_law_with_natural_distribution(self):
        # Himpunan data alami yang mengikuti distribusi logaritmik Benford
        amounts = [100, 120, 150, 180, 210, 250, 310, 390, 420, 510, 620, 710, 830, 940] * 10
        result = forensic_statistics.analyze_benford_law(amounts)
        assert result["is_conclusive"] is True
        assert result["sample_size"] == 140
        assert result["chi_square_statistic"] >= 0.0

    def test_benford_law_detects_artificial_manipulation(self):
        # Data fabrikasi artifisial: 100 klaim yang semuanya berawalan digit 9 (contoh: 9.500.000)
        manipulated_amounts = [9500000 + i for i in range(100)]
        result = forensic_statistics.analyze_benford_law(manipulated_amounts)
        assert result["is_conclusive"] is True
        assert result["conforms_to_benford"] is False
        assert result["high_risk_fabrication"] is True
        assert result["chi_square_statistic"] > result["critical_value_alpha_01"]

    def test_gini_concentration_equal_vs_monopoly(self):
        # Distribusi merata (Gini rendah)
        equal_vals = [1000.0] * 20
        res_equal = forensic_statistics.calculate_gini_concentration(equal_vals)
        assert res_equal["gini_coefficient"] == 0.0

        # Monopoli ekstrim: 1 faskes mengambil 98% tagihan
        monopoly_vals = [10.0] * 19 + [100000.0]
        res_monopoly = forensic_statistics.calculate_gini_concentration(monopoly_vals)
        assert res_monopoly["gini_coefficient"] > 0.8
        assert res_monopoly["concentration_level"] == "KONSENTRASI_EKSTREM"

    def test_robust_outliers_mad(self):
        # 20 data normal (~10) + 2 data anomali ekstrem (500, 900)
        data = [10.0, 10.5, 9.8, 10.2, 11.0, 9.5, 10.1, 10.4, 9.9, 10.0] * 2 + [500.0, 900.0]
        mad_res = forensic_statistics.detect_robust_outliers_mad(data, threshold=3.5)
        assert mad_res["outlier_count"] == 2
        assert 500.0 in mad_res["outlier_values_sample"]
        assert 900.0 in mad_res["outlier_values_sample"]


class TestTemporalCoherence:
    """Pengujian Unit Kausalitas Kronologis & Deteksi Geovelocity / Post-Mortem."""

    def test_normal_episode_causality(self):
        res = temporal_coherence.validate_episode_causality(
            admission_date_str="2026-03-01",
            discharge_date_str="2026-03-05",
            procedure_date_str="2026-03-02"
        )
        assert res["is_coherent"] is True
        assert res["violations_count"] == 0

    def test_temporal_inversion_discharge_before_admission(self):
        res = temporal_coherence.validate_episode_causality(
            admission_date_str="2026-03-05",
            discharge_date_str="2026-03-01"
        )
        assert res["is_coherent"] is False
        assert "mendahului" in res["violations"][0]
        assert res["severity"] == "CRITICAL"

    def test_post_mortem_phantom_billing_detected(self):
        res = temporal_coherence.validate_episode_causality(
            admission_date_str="2026-03-10",
            discharge_date_str="2026-03-12",
            patient_death_date_str="2026-02-20"
        )
        assert res["is_coherent"] is False
        assert any("Post-Mortem Phantom Billing" in v for v in res["violations"])
        assert res["severity"] == "CRITICAL"

    def test_geovelocity_impossible_travel(self):
        # Event A: RS di Jakarta (-6.1751, 106.8650)
        # Event B: RS di Surabaya (-7.2575, 112.7521) ~ 660 km, jam yang sama (gap = 0.5 jam)
        event_a = {"lat": -6.1751, "lon": 106.8650, "service_date": "2026-03-01", "faskes_name": "RS Jakarta"}
        event_b = {"lat": -7.2575, "lon": 112.7521, "service_date": "2026-03-01", "faskes_name": "RS Surabaya", "hours_gap": 0.5}

        geo_res = temporal_coherence.validate_geovelocity_collision(event_a, event_b)
        assert geo_res["distance_km"] > 600.0
        assert geo_res["implied_speed_kmh"] > 1000.0
        assert geo_res["is_physically_impossible"] is True
        assert geo_res["fraud_flag"] == "IND-GEOVELOCITY-COLLISION"


class TestApiIntegrationClinicalForensics:
    """Pengujian Integrasi Endpoint REST API FastAPI."""

    def test_api_benford_audit(self):
        resp = client.get("/api/v1/analytics/benford-audit?sample_limit=500")
        assert resp.status_code == 200
        data = resp.json()
        assert data["tool_name"] == "benford_law_audit"
        assert "analysis" in data
        assert "chi_square_statistic" in data["analysis"]

    def test_api_gini_concentration(self):
        resp = client.get("/api/v1/analytics/gini-concentration?top_k=15")
        assert resp.status_code == 200
        data = resp.json()
        assert data["tool_name"] == "gini_market_concentration"
        assert "concentration_analysis" in data
        assert "gini_coefficient" in data["concentration_analysis"]

    def test_api_charlson_claim(self):
        resp = client.get("/api/v1/clinical/charlson/CLM-2026-8801")
        assert resp.status_code == 200
        data = resp.json()
        assert data["tool_name"] == "charlson_comorbidity_audit"
        assert "audit_result" in data
        assert "charlson_score" in data["audit_result"]

    def test_api_upcoding_audit(self):
        resp = client.get("/api/v1/clinical/upcoding-audit/CLM-2026-8801")
        assert resp.status_code == 200
        data = resp.json()
        assert data["tool_name"] == "ina_cbg_upcoding_audit"
        assert "upcoding_evaluation" in data

    def test_api_temporal_coherence(self):
        resp = client.get("/api/v1/clinical/temporal-coherence/CLM-2026-8801")
        assert resp.status_code == 200
        data = resp.json()
        assert data["tool_name"] == "temporal_coherence_audit"
        assert "coherence_evaluation" in data
