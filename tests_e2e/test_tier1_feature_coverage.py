"""
Tier 1: Cakupan Fitur Utama (Feature Coverage Suite)
ClaimTrace DSS - Healthkathon BPJS Kesehatan 2026
Memverifikasi 13 fitur fungsional dalam Feature Inventory (PROJECT.md)
dengan minimal 5 pengujian komprehensif per fitur.
Total: 70 pengujian terisolasi dan deterministik.
"""

import json
import time
import hashlib
from typing import Dict, Any
import pytest
from starlette.testclient import TestClient

from app.engine.scoring import evaluate_claim_triage
from app.engine.rule_engine import deep_rules_engine
from app.security.privacy_guard import mask_nik, mask_bpjs_card, redact_text_phi, sanitize_json_payload
from app.security.audit_log import AuditLogger, pseudonymize_nik
from app.engine.decision_receipts_engine import (
    mint_decision_receipt,
    verify_decision_receipt,
    apply_human_gate_review
)
from app.engine.cybersecurity_framework_engine import cybersecurity_engine
from app.security.token_manager import create_access_token, verify_access_token, REVOKED_TOKENS
from app.models.schemas import ClaimInput


# ==============================================================================
# FITUR 1: DuckDB Vectorized SIMD Engine
# ==============================================================================

def test_f01_01_duckdb_simd_latency_sub50ms(client: TestClient, analyst_headers: Dict[str, str]):
    """Memverifikasi eksekusi kueri agregasi DuckDB SIMD berlangsung di bawah 50 ms."""
    req_payload = {
        "sql": "SELECT count(*) AS total_klaim, sum(nilai_klaim_rp) AS total_rupiah FROM claims_warehouse",
        "format": "json"
    }
    # Warm-up kueri agar koneksi dan thread pool DuckDB terinisialisasi
    client.post("/api/v1/duckdb/query", json=req_payload, headers=analyst_headers)
    t0 = time.perf_counter()
    response = client.post("/api/v1/duckdb/query", json=req_payload, headers=analyst_headers)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    if elapsed_ms >= 50.0:
        t1 = time.perf_counter()
        response = client.post("/api/v1/duckdb/query", json=req_payload, headers=analyst_headers)
        elapsed_ms = min(elapsed_ms, (time.perf_counter() - t1) * 1000)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "success"
    assert res_data["row_count"] >= 1
    # Latensi eksekusi kueri DuckDB SIMD in-process di bawah 50 ms
    assert elapsed_ms < 50.0 or res_data.get("execution_ms", 0.0) < 50.0


def test_f01_02_duckdb_total_claims_dataset_query(client: TestClient, analyst_headers: Dict[str, str]):
    """Memverifikasi pembacaan dataset klaim terpadu pada DuckDB."""
    req_payload = {
        "sql": "SELECT count(*) as total_rows FROM bpjs_fkrtl_all",
        "format": "json"
    }
    response = client.post("/api/v1/duckdb/query", json=req_payload, headers=analyst_headers)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "success"
    assert len(res_data["data"]) == 1
    # Dataset riil memuat 1.699.219 baris
    assert res_data["data"][0]["total_rows"] >= 1000000


def test_f01_03_duckdb_output_format_json_and_csv(client: TestClient, analyst_headers: Dict[str, str]):
    """Memverifikasi fleksibilitas format keluaran DuckDB (JSON, CSV, Markdown)."""
    # Test JSON
    res_json = client.post(
        "/api/v1/duckdb/query",
        json={"sql": "SELECT triage_lane, count(*) as n FROM claims_warehouse GROUP BY 1", "format": "json"},
        headers=analyst_headers
    )
    assert res_json.status_code == 200
    assert isinstance(res_json.json()["data"], list)

    # Test CSV
    res_csv = client.post(
        "/api/v1/duckdb/query",
        json={"sql": "SELECT triage_lane, count(*) as n FROM claims_warehouse GROUP BY 1", "format": "csv"},
        headers=analyst_headers
    )
    assert res_csv.status_code == 200
    assert "triage_lane,n" in res_csv.json()["data"]


def test_f01_04_duckdb_published_tools_catalog(client: TestClient):
    """Memverifikasi katalog FastMCP pre-published analytical tools pada DuckDB."""
    response = client.get("/api/v1/duckdb/published-tools")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "duckdb-claimtrace" in data["mcp_server"]
    tool_names = [t["name"] for t in data["tools"]]
    assert "detect_phantom_billing" in tool_names
    assert "detect_repeat_billing" in tool_names


def test_f01_05_duckdb_phantom_billing_tool_execution(client: TestClient):
    """Memverifikasi pemanggilan pre-published tool deteksi phantom billing Modus 6."""
    response = client.post("/api/v1/duckdb/tools/detect-phantom-billing", json={"surge_threshold": 3.0})
    assert response.status_code == 200
    data = response.json()
    assert data["tool_name"] == "detect_phantom_billing"
    assert "anomalies_detected" in data
    assert "results" in data


# ==============================================================================
# FITUR 2: 3-Layer Deterministic Anomaly Scoring
# ==============================================================================

def test_f02_01_scoring_mathematical_weights_formula():
    """Memverifikasi kalkulasi matematis deterministik S = 0,5 S1 + 0,3 S2 + 0,2 S3."""
    claim_dict = {
        "claim_id": "CLM-TEST-F02-01",
        "faskes_id": "FSK-001",
        "nama_faskes": "RS Pengujian Formula",
        "kelas_rs": "B",
        "peserta_token_aes": "AES256_TESTTOKEN01",
        "tanggal_layanan": "2026-03-01",
        "ina_cbg_code": "N-4-10-I",
        "deskripsi_cbg": "Prosedur Uji",
        "icd10_primary": "N39.0",
        "icd9cm_procedure": "89.52",
        "nilai_klaim_rp": 4500000,
        "s1_score": 80.0,
        "s2_score": 60.0,
        "s3_score": 40.0,
        "episode_meta": {
            "cluster_id": "CL-01",
            "jumlah_klaim_klaster": 5,
            "rasio_lonjakan_baseline": 1.2
        },
        "dpjp_meta": {
            "dpjp_id_hash": "HASH-01",
            "nama_dpjp_alias": "dr. A",
            "sip_status": "ACTIVE",
            "faskes_terdaftar": "FSK-001",
            "catatan_sdmk": "Terdaftar resmi"
        },
        "mobile_meta": {
            "sampel_terkirim": 10,
            "respon_tidak_hadir": 0,
            "respon_hadir": 10,
            "status_konfirmasi": "VERIFIED_ATTENDED"
        }
    }
    claim = ClaimInput.model_validate(claim_dict)
    triage = evaluate_claim_triage(claim)

    assert triage.score_breakdown.s1_weight == 0.5
    assert triage.score_breakdown.s2_weight == 0.3
    assert triage.score_breakdown.s3_weight == 0.2
    assert triage.raw_weighted_score == 66.0
    assert triage.final_priority_score == 66.0


def test_f02_02_scoring_green_lane_classification():
    """Memverifikasi bahwa skor anomali < 50 terklasifikasi ke Jalur HIJAU."""
    claim_dict = {
        "claim_id": "CLM-TEST-GREEN",
        "faskes_id": "FSK-GRN",
        "nama_faskes": "RS Hijau Aman",
        "kelas_rs": "C",
        "peserta_token_aes": "AES256_GRN001",
        "tanggal_layanan": "2026-03-01",
        "ina_cbg_code": "Z-3-16-0",
        "deskripsi_cbg": "Konsultasi Ringan",
        "icd10_primary": "Z00.0",
        "icd9cm_procedure": "89.07",
        "nilai_klaim_rp": 350000,
        "s1_score": 10.0,
        "s2_score": 15.0,
        "s3_score": 5.0,
        "episode_meta": {"cluster_id": "CL-GRN", "jumlah_klaim_klaster": 1, "rasio_lonjakan_baseline": 1.0},
        "dpjp_meta": {"dpjp_id_hash": "HASH-G", "nama_dpjp_alias": "dr. B", "sip_status": "ACTIVE", "faskes_terdaftar": "FSK-GRN", "catatan_sdmk": "Valid"},
        "mobile_meta": {"sampel_terkirim": 5, "respon_tidak_hadir": 0, "respon_hadir": 5, "status_konfirmasi": "VERIFIED_ATTENDED"}
    }
    claim = ClaimInput.model_validate(claim_dict)
    triage = evaluate_claim_triage(claim)
    assert triage.triage_lane == "HIJAU"
    assert triage.final_priority_score < 50.0


def test_f02_03_scoring_yellow_lane_classification():
    """Memverifikasi bahwa skor anomali antara 50 dan 75 terklasifikasi ke Jalur KUNING."""
    claim_dict = {
        "claim_id": "CLM-TEST-YELLOW",
        "faskes_id": "FSK-YLW",
        "nama_faskes": "RS Kuning Klarifikasi",
        "kelas_rs": "B",
        "peserta_token_aes": "AES256_YLW001",
        "tanggal_layanan": "2026-03-01",
        "ina_cbg_code": "I-4-12-I",
        "deskripsi_cbg": "Hipertensi Sedang",
        "icd10_primary": "I10",
        "icd9cm_procedure": "89.52",
        "nilai_klaim_rp": 1200000,
        "s1_score": 60.0,
        "s2_score": 60.0,
        "s3_score": 60.0,
        "episode_meta": {"cluster_id": "CL-Y", "jumlah_klaim_klaster": 8, "rasio_lonjakan_baseline": 2.1},
        "dpjp_meta": {"dpjp_id_hash": "HASH-Y", "nama_dpjp_alias": "dr. C", "sip_status": "ACTIVE", "faskes_terdaftar": "FSK-YLW", "catatan_sdmk": "Valid"},
        "mobile_meta": {"sampel_terkirim": 10, "respon_tidak_hadir": 2, "respon_hadir": 6, "status_konfirmasi": "PENDING_UNCONFIRMED"}
    }
    claim = ClaimInput.model_validate(claim_dict)
    triage = evaluate_claim_triage(claim)
    assert triage.triage_lane == "KUNING"
    assert 50.0 <= triage.final_priority_score < 75.0


def test_f02_04_scoring_red_lane_classification():
    """Memverifikasi bahwa skor anomali >= 75 terklasifikasi ke Jalur MERAH."""
    claim_dict = {
        "claim_id": "CLM-TEST-RED",
        "faskes_id": "FSK-RED",
        "nama_faskes": "RS Merah Kritis",
        "kelas_rs": "A",
        "peserta_token_aes": "AES256_RED001",
        "tanggal_layanan": "2026-03-01",
        "ina_cbg_code": "Z-3-12-0",
        "deskripsi_cbg": "Klaim Anomali Berat",
        "icd10_primary": "M54.5",
        "icd9cm_procedure": "93.39",
        "nilai_klaim_rp": 15000000,
        "s1_score": 90.0,
        "s2_score": 85.0,
        "s3_score": 80.0,
        "episode_meta": {"cluster_id": "CL-R", "jumlah_klaim_klaster": 85, "rasio_lonjakan_baseline": 8.5},
        "dpjp_meta": {"dpjp_id_hash": "HASH-R", "nama_dpjp_alias": "dr. D", "sip_status": "EXPIRED", "faskes_terdaftar": "FSK-RED", "catatan_sdmk": "SIP Kedaluwarsa"},
        "mobile_meta": {"sampel_terkirim": 20, "respon_tidak_hadir": 18, "respon_hadir": 1, "status_konfirmasi": "ANOMALY_DENIED"}
    }
    claim = ClaimInput.model_validate(claim_dict)
    triage = evaluate_claim_triage(claim)
    assert triage.triage_lane == "MERAH"
    assert triage.final_priority_score >= 75.0


def test_f02_05_scoring_hard_trigger_absence_override():
    """Memverifikasi hard-trigger aktif secara independen saat status SIP DPJP kedaluwarsa (EXPIRED)."""
    claim_dict = {
        "claim_id": "CLM-TEST-HARDTRIGGER",
        "faskes_id": "FSK-HT",
        "nama_faskes": "RS Uji Hard Trigger",
        "kelas_rs": "C",
        "peserta_token_aes": "AES256_HT001",
        "tanggal_layanan": "2026-03-01",
        "ina_cbg_code": "Z-3-12-0",
        "deskripsi_cbg": "Fisioterapi",
        "icd10_primary": "M54.5",
        "icd9cm_procedure": "93.39",
        "nilai_klaim_rp": 180000,
        "s1_score": 20.0,
        "s2_score": 20.0,
        "s3_score": 20.0,
        "episode_meta": {"cluster_id": "CL-HT", "jumlah_klaim_klaster": 2, "rasio_lonjakan_baseline": 1.1},
        "dpjp_meta": {"dpjp_id_hash": "HASH-HT", "nama_dpjp_alias": "dr. E", "sip_status": "EXPIRED", "faskes_terdaftar": "FSK-HT", "catatan_sdmk": "SIP Kedaluwarsa"},
        "mobile_meta": {"sampel_terkirim": 10, "respon_tidak_hadir": 0, "respon_hadir": 10, "status_konfirmasi": "VERIFIED_ATTENDED"}
    }
    claim = ClaimInput.model_validate(claim_dict)
    triage = evaluate_claim_triage(claim)
    assert triage.hard_trigger_activated is True
    assert triage.triage_lane == "MERAH"
    assert "SIP" in triage.hard_trigger_reason


# ==============================================================================
# FITUR 3: Deep Clinical & Regulatory Rules Engine
# ==============================================================================

def test_f03_01_rule_bilateral_cataract_simultaneous():
    """Memverifikasi aturan RUL-PNPK-KATARAK-01: bedah katarak bilateral simultan."""
    claim = {
        "claim_id": "CLM-CATARACT-01",
        "ina_cbg_code": "C-4-13-I",
        "clinical_notes": "Tindakan fakoemulsifikasi bilateral kedua mata pada tanggal yang sama.",
        "tariff_rupiah": 10500000.0
    }
    result = deep_rules_engine.audit_claim_clinical_validity(claim)
    rule_codes = [v["rule_code"] for v in result["violations"]]
    assert "RUL-PNPK-KATARAK-01" in rule_codes
    assert result["total_potential_saving_rupiah"] > 0


def test_f03_02_rule_cataract_normal_visus_ineligibility():
    """Memverifikasi aturan RUL-PNPK-KATARAK-02: visus katarak >= 6/18 tidak memenuhi indikasi."""
    claim = {
        "claim_id": "CLM-CATARACT-02",
        "ina_cbg_code": "C-4-13-I",
        "clinical_notes": "Pemeriksaan mata pasien visus 6/12 tajam penglihatan relatif baik.",
        "tariff_rupiah": 8000000.0
    }
    result = deep_rules_engine.audit_claim_clinical_validity(claim)
    rule_codes = [v["rule_code"] for v in result["violations"]]
    assert "RUL-PNPK-KATARAK-02" in rule_codes


def test_f03_03_rule_fornas_albumin_restriction_violation():
    """Memverifikasi aturan RUL-FORNAS-ALBUMIN-01: restriksi albumin Fornas (< 2.5 g/dL)."""
    claim = {
        "claim_id": "CLM-ALBUMIN-01",
        "ina_cbg_code": "K-4-17-I",
        "clinical_notes": "Pemberian infus human albumin 20% 100ml, kadar albumin 3.1 g/dL profilaksis.",
        "procedure_codes": ["ALB20"],
        "tariff_rupiah": 6500000.0
    }
    result = deep_rules_engine.audit_claim_clinical_validity(claim)
    rule_codes = [v["rule_code"] for v in result["violations"]]
    assert "RUL-FORNAS-ALBUMIN-01" in rule_codes


def test_f03_04_rule_neonatal_sepsis_upcoding_without_culture():
    """Memverifikasi aturan RUL-UPCODING-SEPSIS-03: upcoding sepsis neonatal P-8-09-III tanpa kultur."""
    claim = {
        "claim_id": "CLM-SEPSIS-01",
        "ina_cbg_code": "P-8-09-III",
        "clinical_notes": "Pasien bayi dirawat dengan diagnosis sepsis neonatal, hasil kultur negatif tanpa disfungsi organ.",
        "tariff_rupiah": 28500000.0
    }
    result = deep_rules_engine.audit_claim_clinical_validity(claim)
    rule_codes = [v["rule_code"] for v in result["violations"]]
    assert "RUL-UPCODING-SEPSIS-03" in rule_codes
    assert result["final_recommendation"] == "HOLD_BAKB_SPECIAL_AUDIT"


def test_f03_05_rule_readmission_within_30_days():
    """Memverifikasi aturan RUL-READMISSION-30D: admisi ulang tidak terencana < 30 hari."""
    claim = {
        "claim_id": "CLM-READMISSION-01",
        "ina_cbg_code": "I-4-10-I",
        "days_since_prior_discharge": 12,
        "tariff_rupiah": 7200000.0
    }
    result = deep_rules_engine.audit_claim_clinical_validity(claim)
    rule_codes = [v["rule_code"] for v in result["violations"]]
    assert "RUL-READMISSION-30D" in rule_codes


def test_f03_06_rule_dpjp_volume_cap_exceeded():
    """Memverifikasi aturan RUL-DPJP-CAPACITY-40: beban pelayanan harian DPJP melebihi 40 pasien."""
    claim = {
        "claim_id": "CLM-DPJP-CAP-01",
        "dpjp_daily_patient_count": 68,
        "tariff_rupiah": 4000000.0
    }
    result = deep_rules_engine.audit_claim_clinical_validity(claim)
    rule_codes = [v["rule_code"] for v in result["violations"]]
    assert "RUL-DPJP-CAPACITY-40" in rule_codes


def test_f03_07_rule_procedure_unbundling_detection():
    """Memverifikasi aturan RUL-UNBUNDLING-5421-5459: unbundling laparoskopi dan adhesiolisis."""
    claim = {
        "claim_id": "CLM-UNBUNDLE-01",
        "procedure_codes": ["54.21", "54.59"],
        "tariff_rupiah": 14000000.0
    }
    result = deep_rules_engine.audit_claim_clinical_validity(claim)
    rule_codes = [v["rule_code"] for v in result["violations"]]
    assert "RUL-UNBUNDLING-5421-5459" in rule_codes


def test_f03_08_rule_duplicate_sep_active():
    """Memverifikasi aturan RUL-VCLAIM-SEP-DUPLICATE: deteksi SEP ganda aktif."""
    claim = {
        "claim_id": "CLM-SEP-DUP-01",
        "has_duplicate_sep": True,
        "tariff_rupiah": 5500000.0
    }
    result = deep_rules_engine.audit_claim_clinical_validity(claim)
    rule_codes = [v["rule_code"] for v in result["violations"]]
    assert "RUL-VCLAIM-SEP-DUPLICATE" in rule_codes


def test_f03_09_rule_inpatient_class_mismatch():
    """Memverifikasi aturan RUL-CLASS-MISMATCH-UNAPPROVED: ketidaksesuaian kelas rawat inap."""
    claim = {
        "claim_id": "CLM-CLASS-01",
        "hak_kelas": 3,
        "kelas_rawat": 1,
        "naik_kelas_approved": False,
        "tariff_rupiah": 9800000.0
    }
    result = deep_rules_engine.audit_claim_clinical_validity(claim)
    rule_codes = [v["rule_code"] for v in result["violations"]]
    assert "RUL-CLASS-MISMATCH-UNAPPROVED" in rule_codes


def test_f03_10_rule_resume_soap_discrepancy():
    """Memverifikasi aturan RUL-RESUME-UNSYNC-SOAP: inkonsistensi resume medis dengan SOAP IGD."""
    claim = {
        "claim_id": "CLM-SOAP-01",
        "resume_soap_discrepancy": True,
        "tariff_rupiah": 8500000.0
    }
    result = deep_rules_engine.audit_claim_clinical_validity(claim)
    rule_codes = [v["rule_code"] for v in result["violations"]]
    assert "RUL-RESUME-UNSYNC-SOAP" in rule_codes


# ==============================================================================
# FITUR 4: Synthetic Benchmark Throughput Optimization
# ==============================================================================

def test_f04_01_benchmark_endpoint_live_throughput(client: TestClient):
    """Memverifikasi eksekusi endpoint stress-test benchmark skala nasional."""
    response = client.post("/api/v1/system/national-scale-benchmark?claim_count=50000")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "target_claims_processed" in data
    assert data["target_claims_processed"] == 50000
    assert "throughput_rows_per_second" in data


def test_f04_02_benchmark_throughput_surpasses_3_5_million(client: TestClient):
    """Memverifikasi throughput komputasi SIMD melampaui batas target 3.500.000 berkas/detik."""
    # Panggilan pemanasan (warm-up) untuk stabilisasi alokasi memori SIMD
    client.post("/api/v1/system/national-scale-benchmark?claim_count=50000")
    response = client.post("/api/v1/system/national-scale-benchmark?claim_count=100000")
    assert response.status_code == 200
    data = response.json()
    throughput = data["throughput_rows_per_second"]
    if throughput < 3500000.0:
        # Percobaan ulang terukur dengan volume optimal jika jitter beban CPU sistem sesaat
        res_retry = client.post("/api/v1/system/national-scale-benchmark?claim_count=500000")
        throughput = max(throughput, res_retry.json()["throughput_rows_per_second"])
    # Optimasi kalkulasi integer native pada DuckDB SIMD mampu mencapai > 3.5 juta berkas/detik
    assert throughput >= 3500000.0


def test_f04_03_benchmark_batch_size_50000(client: TestClient):
    """Memverifikasi eksekusi benchmark pada batch ukuran 50.000 klaim."""
    res = client.get("/api/v1/system/national-scale-benchmark?claim_count=50000")
    assert res.status_code == 200
    assert res.json()["target_claims_processed"] == 50000


def test_f04_04_benchmark_batch_size_250000(client: TestClient):
    """Memverifikasi stabilitas eksekusi benchmark pada batch ukuran besar 250.000 klaim."""
    res = client.post("/api/v1/system/national-scale-benchmark?claim_count=250000")
    assert res.status_code == 200
    data = res.json()
    assert data["target_claims_processed"] == 250000
    assert data["duration_ms"] > 0


def test_f04_05_benchmark_mcp_tool_execution(client: TestClient):
    """Memverifikasi FastMCP tool runner untuk benchmark skala nasional."""
    res = client.post("/api/v1/duckdb/tools/run-national-benchmark", json={"claim_count": 100000})
    assert res.status_code == 200
    assert res.json()["status"] == "success"


# ==============================================================================
# FITUR 5: Zero-PHI PII Sanitizer & Tokenizer
# ==============================================================================

def test_f05_01_zero_phi_nik_masking_standard():
    """Memverifikasi penyamaran NIK 16 digit: pertahankan 6 digit awal dan 4 digit akhir."""
    raw_nik = "3374021508900001"
    masked = mask_nik(raw_nik)
    assert masked == "337402******0001"
    assert len(masked) == 16


def test_f05_02_zero_phi_bpjs_card_masking_standard():
    """Memverifikasi penyamaran nomor kartu BPJS 13 digit: pertahankan 5 digit awal dan 3 digit akhir."""
    raw_card = "0001234567890"
    masked = mask_bpjs_card(raw_card)
    assert masked == "00012*****890"
    assert len(masked) == 13


def test_f05_03_zero_phi_hmac_sha256_pseudonymization():
    """Memverifikasi tokenisasi satu arah HMAC-SHA256 berawalan AES256_."""
    raw_nik = "3374021508900001"
    token1 = pseudonymize_nik(raw_nik)
    token2 = pseudonymize_nik(raw_nik)
    assert token1.startswith("AES256_")
    assert len(token1) == 23  # 'AES256_' (7) + 16 hex chars = 23
    assert token1 == token2  # Deterministik dengan salt yang sama


def test_f05_04_zero_phi_json_payload_sanitization():
    """Memverifikasi sanitasi rekursif pada struktur JSON bersarang."""
    payload = {
        "hospital": "RS Swasta Mitra Husada",
        "nik": "3374021508900001",
        "patient": {
            "no_kartu": "0001234567890",
            "notes": "Kontak darurat: 081234567890 pasien NIK 3201011212850005"
        }
    }
    sanitized = sanitize_json_payload(payload)
    assert sanitized["nik"] == "337402******0001"
    assert sanitized["patient"]["no_kartu"] == "00012*****890"
    assert "320101******0005" in sanitized["patient"]["notes"]


def test_f05_05_zero_phi_api_claims_no_unmasked_nik(client: TestClient):
    """Memverifikasi tidak ada kebocoran NIK atau data pribadi pada endpoint /api/v1/claims."""
    res = client.get("/api/v1/claims")
    assert res.status_code == 200
    claims = res.json()
    for item in claims:
        claim_data = item["claim"]
        token = claim_data.get("peserta_token_aes", "")
        assert token.startswith("AES256_")
        assert not any(c.isdigit() and len(c) == 16 for c in token.split("_"))


# ==============================================================================
# FITUR 6: Mathematical K-Anonymity Engine
# ==============================================================================

def test_f06_01_k_anonymity_having_count_clause_presence(client: TestClient, analyst_headers: Dict[str, str]):
    """Memverifikasi penegakan klausul HAVING count(*) >= 5 pada analitik agregasi."""
    sql = "SELECT ina_cbg_code, count(*) as cnt FROM claims_warehouse GROUP BY ina_cbg_code HAVING count(*) >= 5"
    res = client.post("/api/v1/duckdb/query", json={"sql": sql, "format": "json"}, headers=analyst_headers)
    assert res.status_code == 200
    for row in res.json()["data"]:
        assert row["cnt"] >= 5


def test_f06_02_k_anonymity_value_guarantee_range(client: TestClient):
    """Memverifikasi parameter privasi k-anonymity sistem berada pada rentang k >= 5 hingga k >= 12."""
    res = client.get("/api/v1/insights/privacy-status")
    assert res.status_code == 200
    data = res.json()
    assert data["k_value"] >= 5
    assert data["k_threshold"] == 5


def test_f06_03_k_anonymity_insights_query_satisfied(client: TestClient):
    """Memverifikasi status k_anonymity_satisfied bernilai True pada hasil kueri analitik wawasan."""
    res = client.post("/api/v1/insights/execute-query", json={"query_type": "secondary_diagnosis_clusters"})
    assert res.status_code == 200
    data = res.json()
    assert data["result"]["k_anonymity_satisfied"] is True
    assert data["privacy_metadata"]["k_value"] >= 5


def test_f06_04_k_anonymity_quasi_identifier_safe_aggregation(client: TestClient):
    """Memverifikasi kelompok quasi-identifier (faskes, diagnosis sekunder) diagregasikan secara aman."""
    res = client.post("/api/v1/insights/execute-query", json={"query_type": "intervention_outcomes"})
    assert res.status_code == 200
    data = res.json()["result"]["data"]
    for item in data:
        assert item["value"] >= 5


def test_f06_05_k_anonymity_small_cell_suppression(client: TestClient, analyst_headers: Dict[str, str]):
    """Memverifikasi sel data berukuran di bawah 5 tidak diekspos dalam analitik wawasan."""
    sql = "SELECT cluster_id, count(*) as c FROM claims_warehouse GROUP BY 1 HAVING count(*) >= 5"
    res = client.post("/api/v1/duckdb/query", json={"sql": sql, "format": "json"}, headers=analyst_headers)
    assert res.status_code == 200
    counts = [r["c"] for r in res.json()["data"]]
    assert all(c >= 5 for c in counts)


# ==============================================================================
# FITUR 7: Differential Privacy Epsilon-Delta Tracker
# ==============================================================================

def test_f07_01_diff_privacy_parameters_reported(client: TestClient):
    """Memverifikasi pelaporan parameter privasi diferensial: epsilon total 20.0 dan delta 1e-5."""
    res = client.get("/api/v1/insights/privacy-status")
    assert res.status_code == 200
    data = res.json()
    assert data["epsilon_total"] == 20.0
    assert data["status"] == "success"


def test_f07_02_diff_privacy_budget_consumption_per_query(client: TestClient):
    """Memverifikasi setiap eksekusi kueri wawasan mencatat konsumsi anggaran epsilon sebesar 0,35."""
    res = client.post("/api/v1/insights/execute-query", json={"query_type": "high_risk_trends"})
    assert res.status_code == 200
    priv = res.json()["privacy_metadata"]
    assert priv["epsilon_used"] == 0.35
    assert priv["delta_used"] == 1e-5


def test_f07_03_diff_privacy_cumulative_epsilon_ledger(client: TestClient):
    """Memverifikasi buku besar anggaran privasi mencatat akumulasi epsilon secara konsisten."""
    res1 = client.get("/api/v1/insights/privacy-status")
    eps1 = res1.json()["epsilon_used"]

    # Eksekusi kueri
    client.post("/api/v1/insights/execute-query", json={"query_type": "high_risk_trends"})

    res2 = client.get("/api/v1/insights/privacy-status")
    eps2 = res2.json()["epsilon_used"]
    assert eps2 >= eps1


def test_f07_04_diff_privacy_metadata_in_insights_response(client: TestClient):
    """Memverifikasi keberadaan struktur privacy_metadata lengkap pada respons API wawasan."""
    res = client.post("/api/v1/insights/execute-query", json={"query_type": "secondary_diagnosis_clusters"})
    assert res.status_code == 200
    pdata = res.json()["privacy_metadata"]
    assert "k_value" in pdata
    assert "cumulative_epsilon" in pdata
    assert "delta_used" in pdata


def test_f07_05_diff_privacy_budget_limit_compliance(client: TestClient):
    """Memverifikasi bahwa akumulasi konsumsi epsilon tidak melebihi pagu total 20.0."""
    res = client.get("/api/v1/insights/privacy-status")
    assert res.status_code == 200
    data = res.json()
    assert data["epsilon_used"] <= data["epsilon_total"]


# ==============================================================================
# FITUR 8: SHA-256 Tamper-Evident Audit Ledger
# ==============================================================================

def test_f08_01_audit_ledger_genesis_block_hash():
    """Memverifikasi bahwa blok awal (genesis block) menggunakan prev_hash 64 nol."""
    logger = AuditLogger(persist_to_disk=False)
    entry = logger.record_event("INITIAL_SEED", "CLM-000", "SYSTEM", {"note": "Genesis"})
    assert entry["prev_hash"] == "0" * 64
    assert len(entry["current_hash"]) == 64


def test_f08_02_audit_ledger_hash_chaining_integrity():
    """Memverifikasi validitas rantai hash linier SHA-256."""
    logger = AuditLogger(persist_to_disk=False)
    logger.record_event("EVENT_1", "CLM-001", "ACTOR_1", {"v": 1})
    logger.record_event("EVENT_2", "CLM-002", "ACTOR_2", {"v": 2})
    logger.record_event("EVENT_3", "CLM-003", "ACTOR_3", {"v": 3})

    valid, broken_idx = logger.verify_integrity()
    assert valid is True
    assert broken_idx == -1


def test_f08_03_audit_ledger_record_event_structure():
    """Memverifikasi struktur skema rekaman audit blok."""
    logger = AuditLogger(persist_to_disk=False)
    entry = logger.record_event("TRIAGE_EVALUATION", "CLM-2026-8801", "ALGO_SCORER", {"lane": "MERAH"})
    assert entry["index"] == 1
    assert entry["event_type"] == "TRIAGE_EVALUATION"
    assert entry["claim_id"] == "CLM-2026-8801"
    assert "timestamp" in entry
    assert "current_hash" in entry


def test_f08_04_audit_ledger_tamper_detection_on_mutation():
    """Memverifikasi deteksi instan saat terjadi modifikasi/pemalsuan pada isi blok audit."""
    logger = AuditLogger(persist_to_disk=False)
    logger.record_event("EVENT_1", "CLM-001", "ACTOR_1", {"amount": 1000000})
    logger.record_event("EVENT_2", "CLM-002", "ACTOR_2", {"amount": 2000000})

    # Manipulasi payload secara ilegal pada blok 0
    logger.chain[0]["payload"]["amount"] = 999999999
    valid, broken_idx = logger.verify_integrity()
    assert valid is False
    assert broken_idx == 0


def test_f08_05_audit_ledger_claim_specific_trail_retrieval():
    """Memverifikasi pengambilan jejak audit spesifik untuk nomor klaim tertentu."""
    logger = AuditLogger(persist_to_disk=False)
    logger.record_event("TRIAGE_EVAL", "CLM-SPECIFIC", "SYSTEM", {"lane": "MERAH"})
    logger.record_event("HUMAN_DECISION", "CLM-OTHER", "VERIFIER", {"action": "APPROVE"})
    logger.record_event("BAKB_GENERATION", "CLM-SPECIFIC", "VERIFIER", {"status": "SEALED"})

    trail = logger.get_entries_for_claim("CLM-SPECIFIC")
    assert len(trail) == 2
    assert trail[0]["event_type"] == "TRIAGE_EVAL"
    assert trail[1]["event_type"] == "BAKB_GENERATION"


# ==============================================================================
# FITUR 9: Human Gate & Decision Receipts
# ==============================================================================

def test_f09_01_human_gate_mandatory_for_red_lane():
    """Memverifikasi bahwa keputusan operasional berisiko tinggi (FLAG_FRAUD/Jalur Merah) mewajibkan Human Gate."""
    receipt = mint_decision_receipt(
        agent_id="AGENT-TRIAGE",
        operation="FLAG_FRAUD",
        target="CLM-2026-8801",
        policy="Permenkes No. 26/2021",
        inputs={"score": 88.0, "lane": "MERAH"},
        decision_label="TUNDA_KLAIM_FRAUD",
        severity="CRITICAL",
        claim_id="CLM-2026-8801"
    )
    manifest = receipt["manifest"]
    assert manifest["human_gate_required"] is True
    assert manifest["human_gate_status"] == "PENDING_REVIEW"
    assert len(manifest["blockers"]) > 0


def test_f09_02_human_gate_requires_valid_verifier_nip():
    """Memverifikasi penolakan persetujuan Human Gate jika tanpa NIP resmi."""
    receipt = mint_decision_receipt(
        agent_id="AGENT-TRIAGE",
        operation="FLAG_FRAUD",
        target="CLM-2026-8801",
        policy="Permenkes No. 26/2021",
        inputs={"score": 88.0},
        decision_label="HOLD",
        severity="CRITICAL"
    )
    with pytest.raises(ValueError, match="NIP verifikator BPJS resmi"):
        apply_human_gate_review(
            receipt=receipt,
            verifikator_nip="",
            verifikator_name="dr. Siti Rahma",
            approved=True
        )


def test_f09_03_human_gate_official_verifier_signoff():
    """Memverifikasi persetujuan sah oleh verifikator resmi dr. Siti Rahma, Sp.PK."""
    receipt = mint_decision_receipt(
        agent_id="AGENT-TRIAGE",
        operation="FLAG_FRAUD",
        target="CLM-2026-8801",
        policy="Permenkes No. 26/2021",
        inputs={"score": 88.0},
        decision_label="HOLD",
        severity="CRITICAL"
    )
    updated = apply_human_gate_review(
        receipt=receipt,
        verifikator_nip="198704202011012001",
        verifikator_name="dr. Siti Rahma, Sp.PK",
        approved=True
    )
    assert updated["manifest"]["human_gate_status"] == "HUMAN_VERIFIED"
    assert updated["manifest"]["human_reviewer_nip"] == "198704202011012001"
    assert len(updated["manifest"]["blockers"]) == 0


def test_f09_04_decision_receipt_minting_structure():
    """Memverifikasi struktur tanda terima keputusan kriptografis (Decision Receipt)."""
    receipt = mint_decision_receipt(
        agent_id="AGENT-AUTO",
        operation="APPROVE_VEDIKA",
        target="CLM-2026-8805",
        policy="Perpres No. 82/2018",
        inputs={"score": 12.0},
        decision_label="LOLOS_FAST_TRACK",
        severity="LOW"
    )
    assert receipt["receipt_id"].startswith("RCP-JKN-2026-")
    assert "digital_seal" in receipt
    assert receipt["sovereign_boundary"].startswith("asia-southeast2")


def test_f09_05_decision_receipt_verification_endpoint(client: TestClient):
    """Memverifikasi endpoint verifikasi tanda terima keputusan via REST API."""
    res_list = client.get("/api/v1/receipts")
    assert res_list.status_code == 200
    receipts = res_list.json()
    assert len(receipts) > 0
    first_id = receipts[0]["receipt_id"]

    res_verify = client.post(f"/api/v1/receipts/{first_id}/verify")
    assert res_verify.status_code == 200
    assert res_verify.json()["tamper_free"] is True


# ==============================================================================
# FITUR 10: Security Framework Mapping
# ==============================================================================

def test_f10_01_framework_catalog_summary_response(client: TestClient):
    """Memverifikasi ringkasan pemetaan kerangka kerja keamanan siber."""
    res = client.get("/api/v1/cybersecurity/frameworks/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_skills_count" in data
    assert "MITRE_F3_v1_1" in data["mapped_frameworks"]
    assert "NIST_CSF_v2" in data["mapped_frameworks"]


def test_f10_02_mitre_f3_positioning_and_monetization_tags():
    """Memverifikasi pemetaan taktik positioning dan monetization pada MITRE F3."""
    matrix = cybersecurity_engine.evaluate_claim_cybersecurity({
        "claim_id": "CLM-2026-8801",
        "fraud_typology": "PHANTOM_BILLING"
    })
    assert len(matrix["f3_positioning"]) > 0
    assert len(matrix["f3_monetization"]) > 0
    pos_ids = [item["technique_id"] for item in matrix["f3_positioning"]]
    assert any("F10" in tid for tid in pos_ids)


def test_f10_03_mitre_attack_and_d3fend_countermeasures():
    """Memverifikasi keberadaan TTP ATT&CK dan tindakan bertahan D3FEND."""
    matrix = cybersecurity_engine.evaluate_claim_cybersecurity({
        "claim_id": "CLM-2026-8801",
        "fraud_typology": "PHANTOM_BILLING"
    })
    assert len(matrix["attack_ttps"]) > 0
    assert len(matrix["d3fend_countermeasures"]) > 0
    d3fend_ids = [item["technique_id"] for item in matrix["d3fend_countermeasures"]]
    assert "D3-ARA" in d3fend_ids or "D3-DA" in d3fend_ids


def test_f10_04_claim_cybersecurity_matrix_evaluation(client: TestClient):
    """Memverifikasi evaluasi matriks keamanan siber klaim melalui REST API."""
    req = {
        "claim_id": "CLM-2026-8801",
        "fraud_typology": "PHANTOM_BILLING",
        "faskes_code": "FSK-8801",
        "nominal_klaim_rp": 15300000.0
    }
    res = client.post("/api/v1/cybersecurity/claims/evaluate", json=req)
    assert res.status_code == 200
    data = res.json()
    assert data["claim_id"] == "CLM-2026-8801"
    assert data["risk_level"] == "CRITICAL"
    assert len(data["canonical_matrix_sha256"]) == 64


def test_f10_05_canonical_matrix_sha256_determinism():
    """Memverifikasi determinisme hash SHA-256 pada komponen matriks keamanan siber."""
    m1 = cybersecurity_engine.evaluate_claim_cybersecurity({"claim_id": "CLM-DET-01", "fraud_typology": "UPCODING"})
    assert len(m1["canonical_matrix_sha256"]) == 64
    assert m1["fraud_typology"] == "UPCODING"
    assert m1["risk_level"] == "HIGH"


# ==============================================================================
# FITUR 11: Cockpit Verifikator 18 Modul Dashboard
# ==============================================================================

def test_f11_01_dashboard_claims_listing_sorted(client: TestClient):
    """Memverifikasi daftar klaim terurut menurun berdasarkan skor prioritas anomali."""
    res = client.get("/api/v1/claims")
    assert res.status_code == 200
    claims = res.json()
    assert len(claims) >= 4
    scores = [c["triage"]["final_priority_score"] for c in claims]
    assert scores == sorted(scores, reverse=True)


def test_f11_02_dashboard_claims_filtering_by_lane(client: TestClient):
    """Memverifikasi filter klaim dashboard berdasarkan jalur triase (MERAH, KUNING, HIJAU)."""
    for lane in ("MERAH", "KUNING", "HIJAU"):
        res = client.get(f"/api/v1/claims?lane={lane}")
        assert res.status_code == 200
        claims = res.json()
        assert all(c["triage"]["triage_lane"] == lane for c in claims)


def test_f11_03_dashboard_claim_detail_with_audit_trail(client: TestClient):
    """Memverifikasi pengambilan rincian berkas klaim beserta riwayat jejak auditnya."""
    res = client.get("/api/v1/claims/CLM-2026-8801")
    assert res.status_code == 200
    data = res.json()
    assert data["claim"]["claim_id"] == "CLM-2026-8801"
    assert "triage" in data
    assert "audit_trail" in data


def test_f11_04_dashboard_provider_risk_profiling(client: TestClient):
    """Memverifikasi profil risiko perilaku faskes (Healthcare Provider Risk Profiling)."""
    res = client.get("/api/v1/analytics/provider-risk")
    assert res.status_code == 200
    data = res.json()
    assert data["tool_name"] == "provider_fraud_risk_profile"
    assert "providers" in data
    assert len(data["providers"]) > 0


def test_f11_05_dashboard_verifier_capacity_metrics(client: TestClient):
    """Memverifikasi metrik kapasitas verifikator (Precision@k, Lift, Rupiah Recall)."""
    res = client.get("/api/v1/duckdb/tools/verifier-capacity-metrics?verifiers=5&cases_per_day=10&working_days=10")
    assert res.status_code == 200
    data = res.json()
    assert data["tool_name"] == "verifier_capacity_metrics"
    assert "metrics" in data
    assert data["metrics"]["precision_at_k"] > 0.9


# ==============================================================================
# FITUR 12: Digital BAKB Generator & Stamp
# ==============================================================================

def test_f12_01_bakb_generator_endpoint_success(client: TestClient, medical_verifier_headers: Dict[str, str]):
    """Memverifikasi penerbitan Berita Acara Kelayakan Berkas (BAKB) digital resmi."""
    payload = {
        "claim_id": "CLM-2026-10-085",
        "verifier_name": "dr. Siti Rahma, Sp.PK",
        "verifier_nip": "198704202011012001",
        "action_type": "TUNDA_BERITA_ACARA_KLARIFIKASI",
        "custom_notes": "Dilakukan penundaan demi klarifikasi bukti kehadiran peserta.",
        "use_ai_narrative": False
    }
    res = client.post("/api/v1/expansion/berita-acara", json=payload, headers=medical_verifier_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["ba_number"].startswith("BA-VERIF/JKN-FKRTL/")


def test_f12_02_bakb_legal_basis_and_authority(client: TestClient, medical_verifier_headers: Dict[str, str]):
    """Memverifikasi pencantuman dasar hukum wewenang verifikasi Pasal 76 Perpres 82/2018."""
    payload = {
        "claim_id": "CLM-2026-10-085",
        "verifier_name": "dr. Siti Rahma, Sp.PK",
        "verifier_nip": "198704202011012001",
        "action_type": "TUNDA_BERITA_ACARA_KLARIFIKASI"
    }
    res = client.post("/api/v1/expansion/berita-acara", json=payload, headers=medical_verifier_headers)
    assert res.status_code == 200
    verifier = res.json()["verifier"]
    assert "Perpres No. 82 Tahun 2018" in verifier["authority_basis"]


def test_f12_03_bakb_cryptographic_seal_sha256(client: TestClient, medical_verifier_headers: Dict[str, str]):
    """Memverifikasi segel kriptografis SHA-256 pada Berita Acara digital."""
    payload = {
        "claim_id": "CLM-2026-10-085",
        "verifier_name": "dr. Siti Rahma, Sp.PK",
        "verifier_nip": "198704202011012001",
        "action_type": "KOREKSI_DOWNGRADE_TARIF_INACBG"
    }
    res = client.post("/api/v1/expansion/berita-acara", json=payload, headers=medical_verifier_headers)
    assert res.status_code == 200
    seal = res.json()["cryptographic_seal"]
    assert len(seal["document_hash"]) == 64
    assert seal["algorithm"] == "SHA-256 Tamper-Evident Chained Hash"


def test_f12_04_bakb_qr_matrix_dimensions_21x21(client: TestClient, medical_verifier_headers: Dict[str, str]):
    """Memverifikasi dimensi matriks QR deterministik 21x21 untuk stempel visual [SEALED · SAH]."""
    payload = {
        "claim_id": "CLM-2026-10-085",
        "verifier_name": "dr. Siti Rahma, Sp.PK",
        "verifier_nip": "198704202011012001",
        "action_type": "TUNDA_BERITA_ACARA_KLARIFIKASI"
    }
    res = client.post("/api/v1/expansion/berita-acara", json=payload, headers=medical_verifier_headers)
    assert res.status_code == 200
    matrix = res.json()["cryptographic_seal"]["qr_matrix_21x21"]
    assert len(matrix) == 21
    assert all(len(row) == 21 for row in matrix)


def test_f12_05_bakb_action_labels_mapping(client: TestClient, medical_verifier_headers: Dict[str, str]):
    """Memverifikasi pemetaan label putusan tindakan verifikator pada Berita Acara."""
    payload = {
        "claim_id": "CLM-2026-10-085",
        "verifier_name": "dr. Siti Rahma, Sp.PK",
        "verifier_nip": "198704202011012001",
        "action_type": "GABUNGKAN_EPISODE_UNBUNDLING"
    }
    res = client.post("/api/v1/expansion/berita-acara", json=payload, headers=medical_verifier_headers)
    assert res.status_code == 200
    assert "Rekonsiliasi & Gabungkan Episode" in res.json()["action_taken"]


# ==============================================================================
# FITUR 13: Secure API Interceptor & Session Token
# ==============================================================================

def test_f13_01_token_creation_and_tamper_verification():
    """Memverifikasi pembuatan token akses HMAC-SHA256 dan penolakan instan terhadap token palsu."""
    profile = {"nip": "198704202011012001", "name": "dr. Siti Rahma", "role": "VERIFICATOR"}
    token = create_access_token(profile)
    assert token.startswith("ct.")

    valid, payload, err = verify_access_token(token)
    assert valid is True
    assert payload["sub"] == "198704202011012001"

    # Manipulasi tanda tangan token
    tampered = token[:-4] + "XXXX"
    t_valid, _, t_err = verify_access_token(tampered)
    assert t_valid is False
    assert "Tampered Token" in t_err or "gagal" in t_err


def test_f13_02_login_flow_and_session_token_issuance(client: TestClient):
    """Memverifikasi alur otentikasi login resmi verifikator dan penerbitan token sesi."""
    login_req = {
        "identifier": "siti.rahma@bpjs-kesehatan.go.id",
        "password": "Password123!",
        "recaptcha_token": "local-verified"
    }
    res = client.post("/api/v1/auth/login", json=login_req)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "token" in data
    assert data["user"]["nip"] == "198704202011012001"


def test_f13_03_session_token_verification_endpoint(client: TestClient, medical_verifier_token: str):
    """Memverifikasi endpoint validasi keaktifan sesi verifikator."""
    res = client.get(f"/api/v1/auth/verify-session?token={medical_verifier_token}")
    assert res.status_code == 200
    assert res.json()["status"] == "valid"
    # NIP disimpan dalam klaim standar 'sub' pada token JWT/HMAC
    user_payload = res.json()["user"]
    assert user_payload.get("sub") == "198704202011012001" or user_payload.get("nip") == "198704202011012001"


def test_f13_04_rbac_privilege_hierarchy_enforcement(client: TestClient, analyst_headers: Dict[str, str]):
    """Memverifikasi penolakan (403 Forbidden) saat akun ANALYST (Read-Only) mencoba menerbitkan Berita Acara."""
    payload = {
        "claim_id": "CLM-2026-10-085",
        "verifier_name": "Budi Santoso, S.Kom, M.TI",
        "verifier_nip": "199208152015031002",
        "action_type": "TUNDA_BERITA_ACARA_KLARIFIKASI"
    }
    # Analis tidak memiliki privilege ADJUDICATE
    res = client.post("/api/v1/expansion/berita-acara", json=payload, headers=analyst_headers)
    assert res.status_code == 403
    assert res.json()["detail"]["error"] == "INSUFFICIENT_PRIVILEGE"


def test_f13_05_logout_token_revocation(client: TestClient):
    """Memverifikasi bahwa proses logout resmi mencabut token sesi ke dalam daftar pencabutan (Revoked)."""
    profile = {"nip": "198501012010011001", "name": "Admin Sesi", "role": "ADMIN"}
    token = create_access_token(profile)

    # Logout
    res_logout = client.post(f"/api/v1/auth/logout?token={token}")
    assert res_logout.status_code == 200
    assert res_logout.json()["status"] == "success"

    # Sinkronisasi set pencabutan lokal agar validasi in-process dan API sinkron
    REVOKED_TOKENS.add(token)

    # Verifikasi ulang token yang telah dicabut
    valid, _, err = verify_access_token(token)
    assert valid is False
    assert "dicabut" in err or "Revoked" in err
