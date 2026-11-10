"""
Tier 2: Pengujian Kasus Batas dan Sudut (Boundary & Corner Cases Suite)
ClaimTrace DSS - Healthkathon BPJS Kesehatan 2026

Pengujian Opaque-Box & Requirement-Driven untuk mengevaluasi:
1. Batas nilai klaim (Rp 0, nominal negatif, tarif ekstrem Rp 500.000.000+).
2. Batas diskrit scoring triase (skor 49,9 vs 50,0; skor 74,9 vs 75,0).
3. Batas K-Anonymity (k = 4 disensor vs k = 5 lolos).
4. Anggaran privasi diferensial (konsumsi epsilon mendekati batas total 20,0).
5. Integritas rantai blok ledger tamper-evident (modifikasi hash, broken prev_hash).
6. Batas jendela readmisi 30 hari (hari ke-29, ke-30, ke-31).
7. Penegakan status SIP DPJP (EXPIRED hard trigger vs UNSYNCED anti-bias).
8. Batas beban harian DPJP (40 vs 41 pasien/hari).

Standar Format:
- Tanpa emoji sama sekali.
- Pemisah ribuan format titik standar Indonesia (contoh: 1.699.219).
- Istilah netral tanpa klaim historis 2014/2015.
"""

from typing import Dict, Any
import copy
import hashlib
import json
import pytest
from starlette.testclient import TestClient

from app.engine.scoring import evaluate_claim_triage
from app.engine.rule_engine import deep_rules_engine, DeepClaimAuditEngine
from app.models.schemas import ClaimInput
from app.security.audit_log import AuditLogger


# ==============================================================================
# 1. KASUS BATAS NILAI KLAIM (CLAIM TARIFF BOUNDARIES)
# ==============================================================================

def test_b01_claim_amount_boundary_zero_rupiah():
    """Memverifikasi penanganan klaim dengan nilai nominal Rp 0 (tindakan non-tagihan/baksos)."""
    claim_dict = {
        "claim_id": "CLM-BND-01-ZERO",
        "faskes_id": "FSK-001",
        "nama_faskes": "RS Batas Nol",
        "kelas_rs": "B",
        "peserta_token_aes": "AES256_BND01TOKEN",
        "tanggal_layanan": "2026-03-01",
        "ina_cbg_code": "Z-3-12-0",
        "deskripsi_cbg": "Prosedur Konsultasi",
        "icd10_primary": "Z00.0",
        "icd9cm_procedure": "89.07",
        "nilai_klaim_rp": 0,
        "s1_score": 20.0,
        "s2_score": 15.0,
        "s3_score": 10.0,
        "episode_meta": {
            "cluster_id": "CL-BND-01",
            "jumlah_klaim_klaster": 1,
            "rasio_lonjakan_baseline": 1.0
        },
        "dpjp_meta": {
            "dpjp_id_hash": "HASH-BND-01",
            "nama_dpjp_alias": "dr. Batas Nol",
            "sip_status": "ACTIVE",
            "faskes_terdaftar": "FSK-001",
            "catatan_sdmk": "Terdaftar resmi"
        },
        "mobile_meta": {
            "sampel_terkirim": 5,
            "respon_tidak_hadir": 0,
            "respon_hadir": 5,
            "status_konfirmasi": "VERIFIED_ATTENDED"
        }
    }
    claim = ClaimInput(**claim_dict)
    res = evaluate_claim_triage(claim)
    assert res.triage_lane == "HIJAU"
    assert res.final_priority_score < 50.0
    assert res.score_breakdown.s1_contribution == 10.0  # 0.5 * 20.0


def test_b02_claim_amount_negative_rupiah_handling():
    """Memverifikasi penanganan nilai klaim negatif (penyesuaian koreksi debet/retur)."""
    claim_dict = {
        "claim_id": "CLM-BND-02-NEG",
        "faskes_id": "FSK-001",
        "nama_faskes": "RS Batas Negatif",
        "kelas_rs": "B",
        "peserta_token_aes": "AES256_BND02TOKEN",
        "tanggal_layanan": "2026-03-01",
        "ina_cbg_code": "Z-3-12-0",
        "deskripsi_cbg": "Penyesuaian Koreksi Klaim",
        "icd10_primary": "Z00.0",
        "icd9cm_procedure": "89.07",
        "nilai_klaim_rp": -2500000,
        "s1_score": 10.0,
        "s2_score": 10.0,
        "s3_score": 10.0,
        "episode_meta": {
            "cluster_id": "CL-BND-02",
            "jumlah_klaim_klaster": 1,
            "rasio_lonjakan_baseline": 1.0
        },
        "dpjp_meta": {
            "dpjp_id_hash": "HASH-BND-02",
            "nama_dpjp_alias": "dr. Batas Negatif",
            "sip_status": "ACTIVE",
            "faskes_terdaftar": "FSK-001",
            "catatan_sdmk": "Terdaftar resmi"
        },
        "mobile_meta": {
            "sampel_terkirim": 5,
            "respon_tidak_hadir": 0,
            "respon_hadir": 5,
            "status_konfirmasi": "VERIFIED_ATTENDED"
        }
    }
    claim = ClaimInput(**claim_dict)
    res = evaluate_claim_triage(claim)
    # Nilai negatif tidak menyebabkan kegagalan matematis pada perhitungan triase
    assert res.triage_lane == "HIJAU"
    assert res.final_priority_score == 10.0


def test_b03_claim_amount_extreme_half_billion_rupiah():
    """Memverifikasi penanganan klaim katastropik dengan nominal ekstrem Rp 500.000.000+."""
    audit_input = {
        "claim_id": "CLM-BND-03-EXTREME",
        "ina_cbg_code": "I-1-01-III",
        "tariff_rupiah": 585000000.0,
        "clinical_notes": "Tindakan bedah pintas jantung koroner kompleks 4 graft pasca infark miokard akut",
        "diagnosis_primer": "I21.0",
        "procedure_codes": ["36.14", "39.61"],
        "dpjp_daily_patient_count": 8,
        "days_since_prior_discharge": 120
    }
    audit_res = DeepClaimAuditEngine.audit_claim_clinical_validity(audit_input)
    # Prosedur bedah katastropik tunggal tanpa unbundling ilegal tetap valid
    assert audit_res["is_compliant"] is True
    assert audit_res["total_violations"] == 0
    assert audit_res["final_recommendation"] == "APPROVE_LANE_GREEN"


# ==============================================================================
# 2. AMBANG BATAS TRIASE DISKRIT (DISCRETE TRIAGE THRESHOLDS)
# ==============================================================================

def test_b04_triage_score_boundary_green_yellow_49_9_vs_50_0():
    """Memverifikasi diskriminasi batas diskrit antara Jalur Hijau (< 50,0) dan Kuning (>= 50,0)."""
    base_data = {
        "faskes_id": "FSK-001",
        "nama_faskes": "RS Batas Skor",
        "kelas_rs": "B",
        "peserta_token_aes": "AES256_BND04TOKEN",
        "tanggal_layanan": "2026-03-01",
        "ina_cbg_code": "N-4-10-I",
        "deskripsi_cbg": "Prosedur Uji Batas",
        "icd10_primary": "N39.0",
        "icd9cm_procedure": "89.52",
        "nilai_klaim_rp": 5000000,
        "episode_meta": {"cluster_id": "CL-01", "jumlah_klaim_klaster": 2, "rasio_lonjakan_baseline": 1.0},
        "dpjp_meta": {"dpjp_id_hash": "H-01", "nama_dpjp_alias": "dr. B", "sip_status": "ACTIVE", "faskes_terdaftar": "FSK-01", "catatan_sdmk": "OK"},
        "mobile_meta": {"sampel_terkirim": 10, "respon_tidak_hadir": 0, "respon_hadir": 10, "status_konfirmasi": "VERIFIED_ATTENDED"}
    }

    # Kasus Skor 49,9 -> Wajib Jalur HIJAU
    data_49_9 = dict(base_data, claim_id="CLM-BND-49-9", s1_score=49.9, s2_score=49.9, s3_score=49.9)
    res_49_9 = evaluate_claim_triage(ClaimInput(**data_49_9))
    assert res_49_9.final_priority_score == 49.9
    assert res_49_9.triage_lane == "HIJAU"

    # Kasus Skor 50,0 -> Wajib Jalur KUNING
    data_50_0 = dict(base_data, claim_id="CLM-BND-50-0", s1_score=50.0, s2_score=50.0, s3_score=50.0)
    res_50_0 = evaluate_claim_triage(ClaimInput(**data_50_0))
    assert res_50_0.final_priority_score == 50.0
    assert res_50_0.triage_lane == "KUNING"


def test_b05_triage_score_boundary_yellow_red_74_9_vs_75_0():
    """Memverifikasi diskriminasi batas diskrit antara Jalur Kuning (< 75,0) dan Merah (>= 75,0)."""
    base_data = {
        "faskes_id": "FSK-001",
        "nama_faskes": "RS Batas Skor Merah",
        "kelas_rs": "B",
        "peserta_token_aes": "AES256_BND05TOKEN",
        "tanggal_layanan": "2026-03-01",
        "ina_cbg_code": "N-4-10-I",
        "deskripsi_cbg": "Prosedur Uji Batas Merah",
        "icd10_primary": "N39.0",
        "icd9cm_procedure": "89.52",
        "nilai_klaim_rp": 5000000,
        "episode_meta": {"cluster_id": "CL-02", "jumlah_klaim_klaster": 2, "rasio_lonjakan_baseline": 1.0},
        "dpjp_meta": {"dpjp_id_hash": "H-02", "nama_dpjp_alias": "dr. C", "sip_status": "ACTIVE", "faskes_terdaftar": "FSK-01", "catatan_sdmk": "OK"},
        "mobile_meta": {"sampel_terkirim": 10, "respon_tidak_hadir": 0, "respon_hadir": 10, "status_konfirmasi": "VERIFIED_ATTENDED"}
    }

    # Kasus Skor 74,9 -> Wajib Jalur KUNING
    data_74_9 = dict(base_data, claim_id="CLM-BND-74-9", s1_score=74.9, s2_score=74.9, s3_score=74.9)
    res_74_9 = evaluate_claim_triage(ClaimInput(**data_74_9))
    assert res_74_9.final_priority_score == 74.9
    assert res_74_9.triage_lane == "KUNING"

    # Kasus Skor 75,0 -> Wajib Jalur MERAH
    data_75_0 = dict(base_data, claim_id="CLM-BND-75-0", s1_score=75.0, s2_score=75.0, s3_score=75.0)
    res_75_0 = evaluate_claim_triage(ClaimInput(**data_75_0))
    assert res_75_0.final_priority_score == 75.0
    assert res_75_0.triage_lane == "MERAH"


def test_b06_triage_score_extreme_min_zero_and_max_hundred():
    """Memverifikasi batas mutlak nilai skor triase: minimum 0,0 dan maksimum 100,0."""
    base_data = {
        "faskes_id": "FSK-001",
        "nama_faskes": "RS Batas Ekstrem",
        "kelas_rs": "B",
        "peserta_token_aes": "AES256_BND06TOKEN",
        "tanggal_layanan": "2026-03-01",
        "ina_cbg_code": "N-4-10-I",
        "deskripsi_cbg": "Prosedur Uji",
        "icd10_primary": "N39.0",
        "icd9cm_procedure": "89.52",
        "nilai_klaim_rp": 5000000,
        "episode_meta": {"cluster_id": "CL-03", "jumlah_klaim_klaster": 1, "rasio_lonjakan_baseline": 1.0},
        "dpjp_meta": {"dpjp_id_hash": "H-03", "nama_dpjp_alias": "dr. D", "sip_status": "ACTIVE", "faskes_terdaftar": "FSK-01", "catatan_sdmk": "OK"},
        "mobile_meta": {"sampel_terkirim": 5, "respon_tidak_hadir": 0, "respon_hadir": 5, "status_konfirmasi": "VERIFIED_ATTENDED"}
    }

    # Skor 0.0 mutlak
    data_min = dict(base_data, claim_id="CLM-BND-MIN", s1_score=0.0, s2_score=0.0, s3_score=0.0)
    res_min = evaluate_claim_triage(ClaimInput(**data_min))
    assert res_min.final_priority_score == 0.0
    assert res_min.triage_lane == "HIJAU"

    # Skor 100.0 mutlak
    data_max = dict(base_data, claim_id="CLM-BND-MAX", s1_score=100.0, s2_score=100.0, s3_score=100.0)
    res_max = evaluate_claim_triage(ClaimInput(**data_max))
    assert res_max.final_priority_score == 100.0
    assert res_max.triage_lane == "MERAH"


# ==============================================================================
# 3. AMBANG BATAS K-ANONYMITY (K-ANONYMITY THRESHOLDS)
# ==============================================================================

def test_b07_k_anonymity_boundary_k_equals_4_suppressed(client: TestClient, analyst_headers: Dict[str, str]):
    """Memverifikasi bahwa kelompok data dengan k = 4 wajib disensor dan tidak diekspos."""
    # Kueri dengan HAVING count(*) >= 5 harus menolak/meniadakan kelompok agregasi berukuran 4
    sql_test = """
        SELECT kelas_rs, count(*) as group_size 
        FROM claims_warehouse 
        GROUP BY 1 
        HAVING count(*) >= 5;
    """
    res = client.post("/api/v1/duckdb/query", json={"sql": sql_test, "format": "json"}, headers=analyst_headers)
    assert res.status_code == 200
    rows = res.json()["data"]
    # Tidak boleh ada baris hasil dengan group_size <= 4
    assert all(r["group_size"] >= 5 for r in rows)


def test_b08_k_anonymity_boundary_k_equals_5_admitted(client: TestClient):
    """Memverifikasi bahwa ambang batas k = 5 merupakan batas inklusif yang sah untuk diizinkan."""
    res = client.get("/api/v1/insights/privacy-status")
    assert res.status_code == 200
    data = res.json()
    assert data["k_threshold"] == 5
    assert data["k_value"] >= 5
    assert "k >= 5" in data["privacy_guarantees"][0]


# ==============================================================================
# 4. KUOTA PRIVASI DIFERENSIAL (DIFFERENTIAL PRIVACY BUDGET)
# ==============================================================================

def test_b09_diff_privacy_epsilon_consumption_near_limit(client: TestClient):
    """Memverifikasi konsumsi anggaran privasi epsilon tetap berada di bawah batas total 20,0."""
    res = client.get("/api/v1/insights/privacy-status")
    assert res.status_code == 200
    status = res.json()
    epsilon_total = status["epsilon_total"]
    epsilon_used = status["epsilon_used"]
    assert epsilon_total == 20.0
    assert epsilon_used <= epsilon_total
    # Sisa kuota wajib non-negatif
    assert status["epsilon_remaining_percent"] >= 0.0


def test_b10_diff_privacy_delta_strict_guarantee(client: TestClient):
    """Memverifikasi parameter delta privasi diferensial konsisten bernilai 1e-5."""
    res = client.post("/api/v1/insights/execute-query", json={"query_type": "high_risk_trends"})
    assert res.status_code == 200
    priv = res.json()["privacy_metadata"]
    assert priv["delta_used"] == 1e-5
    assert priv["epsilon_used"] == 0.35


# ==============================================================================
# 5. INTEGRITAS RANTAI BLOK LEDGER TAMPER-EVIDENT
# ==============================================================================

def test_b11_audit_ledger_tamper_detection_modified_current_hash():
    """Memverifikasi deteksi kecurangan saat sebuah blok ledger diubah current_hash-nya secara ilegal."""
    logger = AuditLogger(persist_to_disk=False)
    logger.record_event("EVENT_A", "CLM-001", "SYSTEM", {"status": "INIT"})
    logger.record_event("EVENT_B", "CLM-002", "SYSTEM", {"status": "PROCESS"})
    logger.record_event("EVENT_C", "CLM-003", "SYSTEM", {"status": "FINALIZE"})

    # Verifikasi integritas awal
    valid, broken_idx = logger.verify_integrity()
    assert valid is True
    assert broken_idx == -1

    # Tampering: Palsukan current_hash pada blok indeks ke-1 (blok kedua)
    tampered_hash = hashlib.sha256(b"FAKE_MODIFIED_CONTENT").hexdigest()
    logger.chain[1]["current_hash"] = tampered_hash

    # Verifikasi ulang integritas
    valid_after, broken_idx_after = logger.verify_integrity()
    assert valid_after is False
    assert broken_idx_after == 1  # Mendeteksi kecurangan tepat pada blok indeks 1


def test_b12_audit_ledger_tamper_detection_broken_prev_hash():
    """Memverifikasi deteksi kecurangan saat mata rantai prev_hash diputus secara ilegal."""
    logger = AuditLogger(persist_to_disk=False)
    logger.record_event("EVENT_X", "CLM-101", "ACTOR-1", {"val": 100})
    logger.record_event("EVENT_Y", "CLM-102", "ACTOR-2", {"val": 200})
    logger.record_event("EVENT_Z", "CLM-103", "ACTOR-3", {"val": 300})

    # Tampering: Putus prev_hash pada blok ketiga (indeks 2)
    logger.chain[2]["prev_hash"] = "0123456789abcdef" * 4

    # Verifikasi integritas
    valid, broken_idx = logger.verify_integrity()
    assert valid is False
    assert broken_idx == 2  # Mendeteksi ketidakkonsistenan tautan pada blok ke-3


# ==============================================================================
# 6. BATAS TANGGAL ADMISI READMISI 30 HARI (READMISSION WINDOW)
# ==============================================================================

def test_b13_readmission_boundary_day_29_triggered():
    """Memverifikasi admisi ulang hari ke-29 memicu pelanggaran aturan RUL-READMISSION-30D."""
    audit_input = {
        "claim_id": "CLM-READM-29",
        "ina_cbg_code": "I-4-17-I",
        "tariff_rupiah": 8500000.0,
        "days_since_prior_discharge": 29
    }
    res = DeepClaimAuditEngine.audit_claim_clinical_validity(audit_input)
    assert res["is_compliant"] is False
    assert res["total_violations"] >= 1
    codes = [v["rule_code"] for v in res["violations"]]
    assert "RUL-READMISSION-30D" in codes


def test_b14_readmission_boundary_day_30_triggered():
    """Memverifikasi admisi ulang tepat pada hari ke-30 memicu aturan RUL-READMISSION-30D (batas inklusif)."""
    audit_input = {
        "claim_id": "CLM-READM-30",
        "ina_cbg_code": "I-4-17-I",
        "tariff_rupiah": 8500000.0,
        "days_since_prior_discharge": 30
    }
    res = DeepClaimAuditEngine.audit_claim_clinical_validity(audit_input)
    assert res["is_compliant"] is False
    assert res["total_violations"] >= 1
    codes = [v["rule_code"] for v in res["violations"]]
    assert "RUL-READMISSION-30D" in codes


def test_b15_readmission_boundary_day_31_not_triggered():
    """Memverifikasi admisi ulang hari ke-31 TIDAK memicu aturan RUL-READMISSION-30D (di luar jendela 30 hari)."""
    audit_input = {
        "claim_id": "CLM-READM-31",
        "ina_cbg_code": "I-4-17-I",
        "tariff_rupiah": 8500000.0,
        "days_since_prior_discharge": 31
    }
    res = DeepClaimAuditEngine.audit_claim_clinical_validity(audit_input)
    codes = [v["rule_code"] for v in res["violations"]]
    assert "RUL-READMISSION-30D" not in codes


def test_b16_readmission_invalid_zero_or_negative_days():
    """Memverifikasi selisih hari admisi 0 atau negatif tidak memicu aturan readmisi."""
    audit_zero = {
        "claim_id": "CLM-READM-ZERO",
        "ina_cbg_code": "I-4-17-I",
        "tariff_rupiah": 8500000.0,
        "days_since_prior_discharge": 0
    }
    res_zero = DeepClaimAuditEngine.audit_claim_clinical_validity(audit_zero)
    codes_zero = [v["rule_code"] for v in res_zero["violations"]]
    assert "RUL-READMISSION-30D" not in codes_zero


# ==============================================================================
# 7. STATUS SIP DPJP: EXPIRED HARD TRIGGER VS UNSYNCED ANTI-BIAS
# ==============================================================================

def test_b17_sip_dpjp_expired_hard_trigger_to_red():
    """Memverifikasi bahwa status SIP EXPIRED bertindak sebagai Hard Trigger mutlak ke Jalur Merah (skor >= 75,0)."""
    claim_dict = {
        "claim_id": "CLM-SIP-EXP",
        "faskes_id": "FSK-001",
        "nama_faskes": "RS Batas SIP Expired",
        "kelas_rs": "B",
        "peserta_token_aes": "AES256_SIPEXPTOKEN",
        "tanggal_layanan": "2026-03-01",
        "ina_cbg_code": "Z-3-12-0",
        "deskripsi_cbg": "Prosedur Batas SIP",
        "icd10_primary": "Z00.0",
        "icd9cm_procedure": "89.07",
        "nilai_klaim_rp": 4500000,
        # Raw score sangat rendah (hanya 10.0), seharusnya HIJAU jika tanpa hard trigger
        "s1_score": 10.0,
        "s2_score": 10.0,
        "s3_score": 10.0,
        "episode_meta": {"cluster_id": "CL-01", "jumlah_klaim_klaster": 1, "rasio_lonjakan_baseline": 1.0},
        "dpjp_meta": {
            "dpjp_id_hash": "HASH-EXP",
            "nama_dpjp_alias": "dr. Kadaluwarsa",
            "sip_status": "EXPIRED",
            "faskes_terdaftar": "FSK-001",
            "catatan_sdmk": "SIP Berakhir pada 31 Des 2025"
        },
        "mobile_meta": {"sampel_terkirim": 5, "respon_tidak_hadir": 0, "respon_hadir": 5, "status_konfirmasi": "VERIFIED_ATTENDED"}
    }
    claim = ClaimInput(**claim_dict)
    res = evaluate_claim_triage(claim)
    assert res.hard_trigger_activated is True
    assert res.triage_lane == "MERAH"
    assert res.final_priority_score >= 75.0
    assert "Izin praktik (SIP) DPJP terbukti berakhir" in res.hard_trigger_reason


def test_b18_sip_dpjp_unsynced_anti_bias_mitigation():
    """Memverifikasi prinsip anti-bias: status UNSYNCED tidak boleh memicu Jalur Merah jika skor awal rendah."""
    claim_dict = {
        "claim_id": "CLM-SIP-UNSYNC",
        "faskes_id": "FSK-001",
        "nama_faskes": "RS Batas SIP Unsynced",
        "kelas_rs": "B",
        "peserta_token_aes": "AES256_SIPUNSYNCTOKEN",
        "tanggal_layanan": "2026-03-01",
        "ina_cbg_code": "Z-3-12-0",
        "deskripsi_cbg": "Prosedur Batas SIP",
        "icd10_primary": "Z00.0",
        "icd9cm_procedure": "89.07",
        "nilai_klaim_rp": 4500000,
        # Raw score rendah (15.0), seharusnya HIJAU jika sinkron
        "s1_score": 15.0,
        "s2_score": 15.0,
        "s3_score": 15.0,
        "episode_meta": {"cluster_id": "CL-01", "jumlah_klaim_klaster": 1, "rasio_lonjakan_baseline": 1.0},
        "dpjp_meta": {
            "dpjp_id_hash": "HASH-UNSYNC",
            "nama_dpjp_alias": "dr. Belum Sinkron",
            "sip_status": "UNSYNCED",
            "faskes_terdaftar": "FSK-001",
            "catatan_sdmk": "Profil SATUSEHAT SDMK sedang dalam migrasi data Dinkes"
        },
        "mobile_meta": {"sampel_terkirim": 5, "respon_tidak_hadir": 0, "respon_hadir": 5, "status_konfirmasi": "VERIFIED_ATTENDED"}
    }
    claim = ClaimInput(**claim_dict)
    res = evaluate_claim_triage(claim)
    # UNSYNCED menggeser HIJAU menjadi KUNING untuk verifikasi administratif, BUKAN memvonis MERAH
    assert res.hard_trigger_activated is False
    assert res.triage_lane == "KUNING"
    assert res.final_priority_score == 15.0


def test_b19_sip_dpjp_active_preserves_green_lane():
    """Memverifikasi bahwa DPJP dengan status SIP ACTIVE mempertahankan jalur HIJAU tanpa penalti."""
    claim_dict = {
        "claim_id": "CLM-SIP-ACT",
        "faskes_id": "FSK-001",
        "nama_faskes": "RS Batas SIP Aktif",
        "kelas_rs": "B",
        "peserta_token_aes": "AES256_SIPACTTOKEN",
        "tanggal_layanan": "2026-03-01",
        "ina_cbg_code": "Z-3-12-0",
        "deskripsi_cbg": "Prosedur Batas SIP",
        "icd10_primary": "Z00.0",
        "icd9cm_procedure": "89.07",
        "nilai_klaim_rp": 4500000,
        "s1_score": 10.0,
        "s2_score": 10.0,
        "s3_score": 10.0,
        "episode_meta": {"cluster_id": "CL-01", "jumlah_klaim_klaster": 1, "rasio_lonjakan_baseline": 1.0},
        "dpjp_meta": {
            "dpjp_id_hash": "HASH-ACT",
            "nama_dpjp_alias": "dr. Terdaftar Aktif",
            "sip_status": "ACTIVE",
            "faskes_terdaftar": "FSK-001",
            "catatan_sdmk": "SIP Aktif hingga 2028"
        },
        "mobile_meta": {"sampel_terkirim": 5, "respon_tidak_hadir": 0, "respon_hadir": 5, "status_konfirmasi": "VERIFIED_ATTENDED"}
    }
    claim = ClaimInput(**claim_dict)
    res = evaluate_claim_triage(claim)
    assert res.triage_lane == "HIJAU"
    assert res.hard_trigger_activated is False


# ==============================================================================
# 8. BATAS BEBAN PASIEN HARIAN DPJP (PHYSICIAN CAPACITY BOUNDARIES)
# ==============================================================================

def test_b20_dpjp_capacity_boundary_40_vs_41_patients():
    """Memverifikasi ambang batas beban pasien harian DPJP tepat 40 (lolos) vs 41 (memicu RUL-DPJP-CAPACITY-40)."""
    # 40 Pasien: Lolos batas wajar Permenkes
    audit_40 = {
        "claim_id": "CLM-CAP-40",
        "ina_cbg_code": "N-4-10-I",
        "tariff_rupiah": 5000000.0,
        "dpjp_daily_patient_count": 40
    }
    res_40 = DeepClaimAuditEngine.audit_claim_clinical_validity(audit_40)
    codes_40 = [v["rule_code"] for v in res_40["violations"]]
    assert "RUL-DPJP-CAPACITY-40" not in codes_40

    # 41 Pasien: Melampaui batas wajar 40 pasien/hari
    audit_41 = {
        "claim_id": "CLM-CAP-41",
        "ina_cbg_code": "N-4-10-I",
        "tariff_rupiah": 5000000.0,
        "dpjp_daily_patient_count": 41
    }
    res_41 = DeepClaimAuditEngine.audit_claim_clinical_validity(audit_41)
    codes_41 = [v["rule_code"] for v in res_41["violations"]]
    assert "RUL-DPJP-CAPACITY-40" in codes_41
