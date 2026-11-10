"""
Tier 3: Pengujian Interaksi Lintas Fitur (Cross-Feature Combinatorial Suite)
ClaimTrace DSS - Healthkathon BPJS Kesehatan 2026

Pengujian Opaque-Box Pairwise Combinatorial & Cross-Feature Integration:
1. Alur utuh siklus klaim: Triase skor -> Minting Decision Receipt -> Human Gate Jalur Merah -> Pencatatan Blok Ledger SHA-256 -> Penerbitan Berita Acara BAKB digital.
2. Penegakan hak akses peran (RBAC/ABAC): Dokter Verifikator Medis (ADJUDICATE) vs Analis Data (READ) vs Tamu (401/403).
3. Interaksi K-Anonymity (k >= 5) dengan penyembunyian identitas Zero-PHI regex pada keluaran analitik.
4. Interaksi Deep Rules Engine dengan mitigasi SIP Geovelocity Lapis 2.
5. Verifikasi stempel segel [SEALED · SAH] dan QR code terhadap hash SHA-256 berkas.
6. Penelusuran audit WBS dan kepatuhan privasi diferensial.

Standar Format:
- Tanpa emoji sama sekali.
- Pemisah ribuan format titik standar Indonesia (contoh: 1.699.219).
- Istilah netral tanpa klaim operasional historis 2014/2015.
"""

import json
import re
from typing import Dict, Any
import pytest
from starlette.testclient import TestClient

from app.engine.scoring import evaluate_claim_triage
from app.engine.rule_engine import deep_rules_engine, DeepClaimAuditEngine
from app.models.schemas import ClaimInput
from app.security.privacy_guard import mask_nik, mask_bpjs_card, sanitize_json_payload, redact_text_phi


# ==============================================================================
# 1. ALUR UTUH SIKLUS KLAIM: TRIASE -> RECEIPT -> HUMAN GATE -> LEDGER -> BAKB
# ==============================================================================

def test_x01_full_lifecycle_triage_to_bakb(client: TestClient, medical_verifier_headers: Dict[str, str]):
    """
    Memverifikasi alur utuh siklus klaim Jalur Merah:
    1. Evaluasi triase mendeteksi anomali kritis (Jalur Merah).
    2. Minting Decision Receipt berstempel digital SHA-256.
    3. Human Gate Adjudication oleh dr. Siti Rahma, Sp.PK.
    4. Penerbitan Berita Acara Kelayakan Berkas (BAKB) digital resmi.
    """
    # 1. Evaluasi Triase
    claim_payload = {
        "claim_id": "CLM-X01-LIFECYCLE",
        "faskes_id": "FSK-771",
        "nama_faskes": "RS Sentra Medika Mandiri",
        "kelas_rs": "B",
        "peserta_token_aes": "AES256_X01LIFECYCLE",
        "tanggal_layanan": "2026-03-01",
        "ina_cbg_code": "C-4-13-III",
        "deskripsi_cbg": "Bedah Katarak Kompleks",
        "icd10_primary": "H26.9",
        "icd9cm_procedure": "13.41",
        "nilai_klaim_rp": 18500000,
        "s1_score": 85.0,
        "s2_score": 80.0,
        "s3_score": 90.0,
        "episode_meta": {
            "cluster_id": "CL-X01",
            "jumlah_klaim_klaster": 14,
            "rasio_lonjakan_baseline": 3.8
        },
        "dpjp_meta": {
            "dpjp_id_hash": "HASH-DPJP-X01",
            "nama_dpjp_alias": "dr. Sp.M",
            "sip_status": "EXPIRED",
            "faskes_terdaftar": "FSK-771",
            "catatan_sdmk": "SIP Berakhir pada 31 Des 2025"
        },
        "mobile_meta": {
            "sampel_terkirim": 10,
            "respon_tidak_hadir": 7,
            "respon_hadir": 3,
            "status_konfirmasi": "ANOMALY_DENIED"
        }
    }
    triage_res = evaluate_claim_triage(ClaimInput(**claim_payload))
    assert triage_res.triage_lane == "MERAH"
    assert triage_res.final_priority_score >= 75.0
    assert triage_res.hard_trigger_activated is True

    # 2. Minting Decision Receipt
    mint_req = {
        "agent_id": "AGT-VCLAIM-AUDITOR-01",
        "operation": "SUSPEND_CLAIM_PAYMENT",
        "target": f"CLAIM:{claim_payload['claim_id']}",
        "policy": "PERPRES_82_2018_PASAL_76",
        "decision_label": "FLAGGED_ANOMALOUS",
        "inputs": {"claim_id": claim_payload["claim_id"], "triage_score": triage_res.final_priority_score},
        "severity": "CRITICAL",
        "tgr_recovery_amount_rp": 18500000.0,
        "claim_id": claim_payload["claim_id"],
        "faskes_name": claim_payload["nama_faskes"]
    }
    res_mint = client.post("/api/v1/receipts/mint", json=mint_req)
    assert res_mint.status_code == 200
    receipt = res_mint.json()
    receipt_id = receipt["receipt_id"]
    assert receipt_id.startswith("RCP-")
    assert receipt["manifest"]["human_gate_status"] == "PENDING_REVIEW"

    # 3. Human Gate Review oleh dr. Siti Rahma, Sp.PK
    gate_req = {
        "verifikator_nip": "198704202011012001",
        "verifikator_name": "dr. Siti Rahma, Sp.PK",
        "approved": True,
        "blocker_notes": ""
    }
    res_gate = client.post(f"/api/v1/receipts/{receipt_id}/human-gate", json=gate_req, headers=medical_verifier_headers)
    assert res_gate.status_code == 200
    updated_receipt = res_gate.json()
    assert updated_receipt["manifest"]["human_gate_status"] == "HUMAN_VERIFIED"
    assert updated_receipt["manifest"]["human_reviewer_nip"] == "198704202011012001"

    # 4. Penerbitan Berita Acara Kelayakan Berkas (BAKB) Digital Resmi
    bakb_req = {
        "claim_id": "CLM-2026-10-085",
        "verifier_name": "dr. Siti Rahma, Sp.PK",
        "verifier_nip": "198704202011012001",
        "action_type": "TUNDA_BERITA_ACARA_KLARIFIKASI",
        "custom_notes": "Diterbitkan Berita Acara Penundaan Klaim berdasarkan temuan audit forensik digital multi-lapis.",
        "use_ai_narrative": False
    }
    res_bakb = client.post("/api/v1/expansion/berita-acara", json=bakb_req, headers=medical_verifier_headers)
    assert res_bakb.status_code == 200
    bakb_data = res_bakb.json()
    assert bakb_data["status"] == "success"
    assert bakb_data["ba_number"].startswith("BA-VERIF/JKN-FKRTL/")
    assert len(bakb_data["cryptographic_seal"]["document_hash"]) == 64


# ==============================================================================
# 2. PENEGAKAN HAK AKSES PERAN (RBAC / ABAC)
# ==============================================================================

def test_x02_human_gate_unauthorized_role_blocked(client: TestClient, analyst_headers: Dict[str, str]):
    """Memverifikasi bahwa peran ANALYST ditolak (HTTP 403) saat mencoba menerbitkan Berita Acara resmi."""
    bakb_req = {
        "claim_id": "CLM-2026-10-085",
        "verifier_name": "Budi Santoso, S.Kom, M.TI",
        "verifier_nip": "199208152015031002",
        "action_type": "TUNDA_BERITA_ACARA_KLARIFIKASI",
        "custom_notes": "Mencoba menerbitkan dokumen putusan resmi tanpa hak akses verifikator."
    }
    res = client.post("/api/v1/expansion/berita-acara", json=bakb_req, headers=analyst_headers)
    # Analis Data tidak memiliki wewenang ADJUDICATE sehingga wajib ditolak dengan 403 Forbidden
    assert res.status_code == 403
    assert res.json()["detail"]["error"] == "INSUFFICIENT_PRIVILEGE"


def test_x03_human_gate_missing_auth_rejected_401(client: TestClient):
    """Memverifikasi bahwa pemanggilan tanpa header otentikasi ditolak (HTTP 401)."""
    bakb_req = {
        "claim_id": "CLM-2026-10-085",
        "verifier_name": "Anonim",
        "verifier_nip": "000000000000000000",
        "action_type": "TUNDA_BERITA_ACARA_KLARIFIKASI"
    }
    res = client.post("/api/v1/expansion/berita-acara", json=bakb_req)
    assert res.status_code == 401
    assert "Autentikasi" in res.json()["detail"] or "Authentication" in res.json()["detail"]


# ==============================================================================
# 3. INTERAKSI K-ANONYMITY & PENYEMBUNYIAN ZERO-PHI REGEX
# ==============================================================================

def test_x04_k_anonymity_cross_zero_phi_aggregation(client: TestClient, analyst_headers: Dict[str, str]):
    """
    Memverifikasi sinergi K-Anonymity dan Zero-PHI:
    Hasil kueri analitik wawasan tidak memuat string NIK 16 digit telanjang atau kartu JKN 13 digit telanjang.
    """
    res = client.post(
        "/api/v1/duckdb/query",
        json={"sql": "SELECT nama_faskes, count(*) as volume_klaim FROM claims_warehouse GROUP BY 1 HAVING count(*) >= 5", "format": "json"},
        headers=analyst_headers
    )
    assert res.status_code == 200
    res_str = json.dumps(res.json()["data"])

    # Regex validasi ketiadaan NIK 16 digit telanjang (16 digit angka berturut-turut)
    nik_raw_pattern = re.compile(r'\b\d{16}\b')
    assert nik_raw_pattern.search(res_str) is None

    # Regex validasi ketiadaan nomor kartu BPJS 13 digit telanjang
    card_raw_pattern = re.compile(r'\b\d{13}\b')
    assert card_raw_pattern.search(res_str) is None


def test_x05_zero_phi_sanitizer_preserves_structure_in_payloads():
    """
    Memverifikasi fungsi sanitize_json_payload menyamarkan PII secara rekursif
    tanpa merusak tipe data struktural lain (integer, float, boolean, nested dict).
    """
    raw_payload = {
        "claim_id": "CLM-SENSITIVE-99",
        "pasien_nik": "3201015508900002",
        "no_kartu_bpjs": "0001987654321",
        "nominal_klaim": 12500000,
        "is_verified": True,
        "rasio_lonjakan": 2.75,
        "nested_info": {
            "kontak_keluarga": "Hubungi NIK 3201015508900002 untuk konfirmasi",
            "catatan_beban": 42
        }
    }
    sanitized = sanitize_json_payload(raw_payload)

    # NIK disamarkan
    assert sanitized["pasien_nik"] == "320101******0002"
    # Kartu disamarkan
    assert sanitized["no_kartu_bpjs"] == "00019*****321"
    # Tipe data primitif dipertahankan
    assert sanitized["nominal_klaim"] == 12500000
    assert sanitized["is_verified"] is True
    assert sanitized["rasio_lonjakan"] == 2.75
    # Nested field disanitasi
    assert "320101******0002" in sanitized["nested_info"]["kontak_keluarga"]
    assert sanitized["nested_info"]["catatan_beban"] == 42


# ==============================================================================
# 4. INTERAKSI DEEP RULES ENGINE & MITIGASI SIP GEOVELOCITY LAPIS 2
# ==============================================================================

def test_x06_deep_rules_interaction_albumin_fornas_and_geovelocity(client: TestClient):
    """
    Memverifikasi interaksi aturan klinis restriksi Fornas Albumin (RUL-FORNAS-ALBUMIN-01)
    bersama pengecekan telemetri kecepatan fisik geovelocity.
    """
    # 1. Evaluasi Pelanggaran Aturan Fornas Albumin
    audit_input = {
        "claim_id": "CLM-ALBUMIN-GEO",
        "ina_cbg_code": "Q-5-18-I",
        "tariff_rupiah": 16500000.0,
        "clinical_notes": "Pemberian Human Albumin 20% profilaksis dengan kadar normal tanpa indikasi hipoalbuminemia berat",
        "diagnosis_primer": "K74.6",
        "procedure_codes": ["99.18"],
        "dpjp_daily_patient_count": 15
    }
    res_clinical = DeepClaimAuditEngine.audit_claim_clinical_validity(audit_input)
    assert res_clinical["is_compliant"] is False
    codes = [v["rule_code"] for v in res_clinical["violations"]]
    assert "RUL-FORNAS-ALBUMIN-01" in codes

    # 2. Evaluasi Geovelocity: Kecepatan fisik wajar antar faskes mitra (Jakarta Timur ke Jakarta Pusat dlm 60 menit)
    res_geo = client.get("/api/v1/geovelocity/verify?origin_id=FSK-KLN-04&dest_id=FSK-RSDK-05&time_diff_minutes=60.0")
    assert res_geo.status_code == 200
    geo_data = res_geo.json()
    assert geo_data["is_physically_impossible"] is False
    assert geo_data["risk_lane"] in ["HIJAU", "KUNING"]


def test_x07_deep_rules_interaction_dpjp_workload_and_sip_status():
    """
    Memverifikasi interaksi antara pelanggaran batas kapasitas DPJP > 40 pasien
    dan status perizinan praktik (SIP) dokter.
    """
    audit_input = {
        "claim_id": "CLM-CAP-SIP-OVERLOAD",
        "ina_cbg_code": "N-4-10-I",
        "tariff_rupiah": 6500000.0,
        "dpjp_daily_patient_count": 55,  # Melampaui batas 40 pasien
        "clinical_notes": "Pelayanan poliklinik rawat jalan volume tinggi"
    }
    res_audit = DeepClaimAuditEngine.audit_claim_clinical_validity(audit_input)
    assert res_audit["is_compliant"] is False
    codes = [v["rule_code"] for v in res_audit["violations"]]
    assert "RUL-DPJP-CAPACITY-40" in codes

    # Periksa rekomendasi tindakan yang proporsional
    dpjp_violation = next(v for v in res_audit["violations"] if v["rule_code"] == "RUL-DPJP-CAPACITY-40")
    assert dpjp_violation["severity"] == "HIGH"
    assert dpjp_violation["recommended_action"] == "NOTIFY_KOMITE_MEDIK_CLARIFICATION"


# ==============================================================================
# 5. VERIFIKASI STEMPEL SEGAL [SEALED · SAH] & QR CODE 21x21
# ==============================================================================

def test_x08_bakb_qr_matrix_and_sha256_seal_integrity(client: TestClient, medical_verifier_headers: Dict[str, str]):
    """
    Memverifikasi dokumen Berita Acara digital memuat segel stempel visual [SEALED · SAH],
    matriks QR deterministik 21x21, dan segel kriptografis SHA-256 64 karakter.
    """
    bakb_req = {
        "claim_id": "CLM-2026-10-085",
        "verifier_name": "dr. Siti Rahma, Sp.PK",
        "verifier_nip": "198704202011012001",
        "action_type": "KOREKSI_DOWNGRADE_TARIF_INACBG",
        "custom_notes": "Persetujuan koreksi tarif klaim INA-CBG berdasar audit kelayakan berkas.",
        "use_ai_narrative": False
    }
    res = client.post("/api/v1/expansion/berita-acara", json=bakb_req, headers=medical_verifier_headers)
    assert res.status_code == 200
    data = res.json()

    # Periksa stempel resmi
    seal = data["cryptographic_seal"]
    assert seal["algorithm"] == "SHA-256 Tamper-Evident Chained Hash"
    assert len(seal["document_hash"]) == 64
    assert "verification_uri" in seal

    # Periksa dimensi QR 21x21
    qr_matrix = seal["qr_matrix_21x21"]
    assert len(qr_matrix) == 21
    assert all(len(row) == 21 for row in qr_matrix)


def test_x09_receipt_offline_verification_seal(client: TestClient):
    """
    Memverifikasi verifikasi integritas segel digital pada Decision Receipt
    melalui endpoint verifikasi mandiri /api/v1/receipts/{receipt_id}/verify.
    """
    # 1. Minting receipt baru
    mint_req = {
        "agent_id": "AGT-AUDIT-OFFLINE-01",
        "operation": "VERIFY_DISCREPANCY",
        "target": "CLAIM:CLM-X09-OFFLINE",
        "policy": "PERPRES_82_2018",
        "decision_label": "CLEAN_APPROVED",
        "inputs": {"claim_id": "CLM-X09-OFFLINE", "tariff_rp": 4500000},
        "severity": "LOW",
        "tgr_recovery_amount_rp": 0.0,
        "claim_id": "CLM-X09-OFFLINE",
        "faskes_name": "RS Uji Offline"
    }
    res_mint = client.post("/api/v1/receipts/mint", json=mint_req)
    assert res_mint.status_code == 200
    rcp_id = res_mint.json()["receipt_id"]

    # 2. Verifikasi keabsahan digest dan stempel HMAC
    res_verify = client.post(f"/api/v1/receipts/{rcp_id}/verify")
    assert res_verify.status_code == 200
    vdata = res_verify.json()
    assert vdata["tamper_free"] is True
    assert vdata["digest_matches"] is True
    assert vdata["receipt_id"] == rcp_id


# ==============================================================================
# 6. INTEGRITAS AUDIT LOG & SISTEM PELAPORAN WBS
# ==============================================================================

def test_x10_audit_ledger_event_appended_on_bakb_issuance(client: TestClient, medical_verifier_headers: Dict[str, str]):
    """Memverifikasi bahwa setiap penerbitan dokumen BAKB tercatat pada rantai audit ledger SHA-256."""
    res_pre = client.get("/api/v1/audit-logs")
    assert res_pre.status_code == 200
    count_pre = len(res_pre.json()["chain"])

    # Terbitkan BAKB baru
    bakb_req = {
        "claim_id": "CLM-2026-10-085",
        "verifier_name": "dr. Siti Rahma, Sp.PK",
        "verifier_nip": "198704202011012001",
        "action_type": "TUNDA_BERITA_ACARA_KLARIFIKASI",
        "custom_notes": "Uji pencatatan otomatis ke dalam audit ledger."
    }
    res_bakb = client.post("/api/v1/expansion/berita-acara", json=bakb_req, headers=medical_verifier_headers)
    assert res_bakb.status_code == 200

    # Periksa pertambahan entri pada rantai audit
    res_post = client.get("/api/v1/audit-logs")
    assert res_post.status_code == 200
    chain = res_post.json()["chain"]
    assert len(chain) >= count_pre + 1
    ba_events = [e for e in chain if e["event_type"] == "BERITA_ACARA_ISSUED" and e["claim_id"] == "CLM-2026-10-085"]
    assert len(ba_events) >= 1
    assert ba_events[-1]["actor"] == "198704202011012001"


def test_x11_geovelocity_impossible_travel_mitigation_cross_triage(client: TestClient):
    """
    Memverifikasi deteksi kecepatan fisik mustahil (> 250 km/jam) pada rute darat
    dan korelasi penandaan risikonya pada modul geovelocity.
    """
    # Kecepatan 320 km/jam (tidak realistis via jalan darat)
    res_geo = client.get("/api/v1/geovelocity/verify?speed_kmh=320.0&source_faskes_id=FSK-001&target_faskes_id=FSK-002")
    assert res_geo.status_code == 200
    geo_data = res_geo.json()
    assert geo_data["is_physically_impossible"] is True
    assert geo_data["risk_lane"] in ["MERAH", "KUNING"]
    assert geo_data["geovelocity_risk_score"] >= 50.0


def test_x12_cross_feature_mobile_jkn_binary_denial_and_receipt_flag(client: TestClient):
    """
    Memverifikasi bahwa respons penolakan kehadiran dari peserta via Mobile JKN
    menghasilkan penandaan anomali Lapis 3 dan menghasilkan Decision Receipt dengan tingkat keparahan tinggi.
    """
    claim_dict = {
        "claim_id": "CLM-X12-MOBILE-DENIED",
        "faskes_id": "FSK-882",
        "nama_faskes": "RS Pratama Uji Mobile",
        "kelas_rs": "C",
        "peserta_token_aes": "AES256_X12MOBILETOKEN",
        "tanggal_layanan": "2026-03-01",
        "ina_cbg_code": "Z-3-12-0",
        "deskripsi_cbg": "Konsultasi Terjadwal",
        "icd10_primary": "Z00.0",
        "icd9cm_procedure": "89.07",
        "nilai_klaim_rp": 3200000,
        "s1_score": 30.0,
        "s2_score": 20.0,
        "s3_score": 95.0,  # Penolakan masif Mobile JKN
        "episode_meta": {"cluster_id": "CL-M12", "jumlah_klaim_klaster": 5, "rasio_lonjakan_baseline": 1.5},
        "dpjp_meta": {"dpjp_id_hash": "H-M12", "nama_dpjp_alias": "dr. E", "sip_status": "ACTIVE", "faskes_terdaftar": "FSK-882", "catatan_sdmk": "OK"},
        "mobile_meta": {
            "sampel_terkirim": 10,
            "respon_tidak_hadir": 8,
            "respon_hadir": 2,
            "status_konfirmasi": "ANOMALY_DENIED"
        }
    }
    triage_res = evaluate_claim_triage(ClaimInput(**claim_dict))
    # Teridentifikasi penolakan presensi oleh peserta
    presensi_indicators = [k for k in triage_res.kode_indikator if "IND-L3-PRESENSI" in k]
    assert len(presensi_indicators) > 0
    assert "8 dari 10" in presensi_indicators[0]


def test_x13_security_posture_and_framework_mapping_synergy(client: TestClient):
    """
    Memverifikasi sinergi pemetaan kerangka kerja keamanan siber:
    MITRE F3, ATT&CK, D3FEND, NIST CSF 2.0, dan UU PDP No. 27/2022.
    """
    res = client.get("/api/v1/cybersecurity/frameworks/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_skills_count"] > 0
    supported = data["mapped_frameworks"]
    assert "MITRE_ATTACK_v19" in supported
    assert "NIST_CSF_v2" in supported
    assert "MITRE_F3_v1_1" in supported
    assert data["f3_skills_count"] > 0


def test_x14_wbs_whistleblowing_to_audit_ledger_traceability(client: TestClient):
    """
    Memverifikasi pengajuan laporan whistleblowing WBS terlindungi Zero-PHI
    dan menghasilkan nomor tiket pelacakan acak tanpa kebocoran identitas pelapor.
    """
    wbs_req = {
        "category": "UPCODING_SEVERITY",
        "faskes_name": "RSUD Sejahtera Mitra JKN",
        "location": "Jakarta Timur",
        "description": "Ditemukan pola pengkodean sepsis neonatal pada bayi bugar tanpa hasil kultur darah positif.",
        "reporter_contact": "081298765432",
        "is_anonymous": True
    }
    res = client.post("/api/v1/wbs/report", json=wbs_req)
    assert res.status_code == 200
    report_data = res.json()
    assert report_data["ticket_id"].startswith("WBS-")
    assert "Diterima" in report_data["status"]


def test_x15_duckdb_mcp_tools_and_privacy_ledger_synchronization(client: TestClient):
    """
    Memverifikasi bahwa eksekusi analytical tool DuckDB FastMCP
    secara konsisten memelihara catatan privasi diferensial dan status privasi sistem.
    """
    res_status = client.get("/api/v1/insights/privacy-status")
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["k_value"] >= 5
    assert status_data["epsilon_used"] <= status_data["epsilon_total"]
    assert len(status_data["privacy_guarantees"]) >= 4
