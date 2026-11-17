"""
ClaimTrace Verification Portal Engine
-------------------------------------
Authentic domain catalog, digital dossier builder, i-Care cross-faskes timeline,
billing & Special CMG reconciliation, RJTL/RITL BAHV aggregation, and printable
official BA Pending / FPK HTML generators aligned with BPJS Kesehatan BEA C03.04
(Perpres 82/2018 / Permenkes 3/2023 / SE Diryan 51/2016).

Strictly zero PHI: all participant identifiers remain pseudonymized AES tokens.
"""

from __future__ import annotations

import hashlib
import html
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# 1. Standardized 3-Pillar BA Kesepakatan Pending/Tolak Codes (Kemenkes - BPJS)
# ---------------------------------------------------------------------------
VEDIKA_PENDING_CODES: List[Dict[str, str]] = [
    {
        "code": "ADM-01",
        "pillar": "Administrasi",
        "title": "Eligibilitas SEP & Masa Kepesertaan Tidak Sesuai",
        "regulation": "Perpres 82/2018 & Juknis VClaim",
        "description": "Tanggal pelayanan / kelas rawat pada e-SEP tidak selaras dengan status aktif kepesertaan saat admisi."
    },
    {
        "code": "ADM-02",
        "pillar": "Administrasi",
        "title": "Absen Verifikasi Biometrik FRISTA / TTE DPJP",
        "regulation": "Kebijakan Verifikasi Biometrik & BSrE PSrE",
        "description": "e-SEP atau Resume Medis belum tervalidasi pengenalan wajah FRISTA / fingerprint atau tanda tangan elektronik DPJP."
    },
    {
        "code": "ADM-03",
        "pillar": "Administrasi",
        "title": "Ketidakcocokan Hak Kelas & Selisih Naik Kelas",
        "regulation": "Permenkes 3/2023 Pasal 46-48",
        "description": "Kenaikan kelas rawat inap belum dilengkapi surat pernyataan persetujuan selisih biaya atau bukti pembayaran pasien."
    },
    {
        "code": "ADM-04",
        "pillar": "Administrasi",
        "title": "Dugaan Penjaminan Khusus (KLL Jasa Raharja / Ketenagakerjaan / COB)",
        "regulation": "Perpres 82/2018 Koordinasi Manfaat",
        "description": "Indikasi kasus kecelakaan lalu lintas / kerja atau COB asuransi komersial yang belum melampirkan LP Kepolisian / SK Penjamin."
    },
    {
        "code": "ADM-05",
        "pillar": "Administrasi",
        "title": "Kelengkapan Rujukan Berjenjang / Syarat BBL <= 28 Hari",
        "regulation": "Permenkes Rujukan Berjenjang JKN",
        "description": "Surat rujukan FKTP/antar-FKRTL atau Surat Keterangan Lahir (BBL <= 28 hari) tidak terlampir pada berkas digital."
    },
    {
        "code": "ADM-06",
        "pillar": "Administrasi",
        "title": "Melewati Batas Daluwarsa Klaim 6 Bulan",
        "regulation": "Perpres 82/2018 Pasal 77",
        "description": "Pengajuan FPK melebihi batas mutlak 6 (enam) bulan kalender terhitung sejak pelayanan kesehatan selesai diberikan."
    },
    {
        "code": "KOD-01",
        "pillar": "Koding INA-CBG",
        "title": "Indikasi Upcoding Severity Level (I -> II / III)",
        "regulation": "BA Kesepakatan Koding Kemenkes-BPJS & Permenkes 26/2021",
        "description": "Diagnosis sekunder pemacu Severity Level II/III tidak didukung catatan tata laksana medis aktif maupun penunjang objektif."
    },
    {
        "code": "KOD-02",
        "pillar": "Koding INA-CBG",
        "title": "Ketidaksesuaian Diagnosis Utama vs Diagnosis Sekunder (ICD-10)",
        "regulation": "Kaidah Morbiditas Utama ICD-10",
        "description": "Diagnosis utama yang dikoding bukan merupakan kondisi utama yang menyita sumber daya perawatan terbesar pada episode."
    },
    {
        "code": "KOD-03",
        "pillar": "Koding INA-CBG",
        "title": "Unbundling / Fragmentasi Prosedur ICD-9-CM",
        "regulation": "Grouper INA-CBG & Permenkes 3/2023",
        "description": "Tindakan atau sesi layanan dipecah menjadi beberapa klaim terpisah padahal merupakan satu paket episode klinis tunggal."
    },
    {
        "code": "KOD-04",
        "pillar": "Koding INA-CBG",
        "title": "Ketidakcocokan Tingkat Layanan RJTL vs RITL",
        "regulation": "BA Kesepakatan & Kaidah Episode Rawat",
        "description": "Pelayanan observasi singkat / one-day care diklaim sebagai Rawat Inap Tingkat Lanjut (RITL) tanpa indikasi medis rawat inap."
    },
    {
        "code": "KOD-05",
        "pillar": "Koding INA-CBG",
        "title": "Validasi Top-Up Special CMG (SA/SP/RR/SI/SD) & Fornas",
        "regulation": "Permenkes 3/2023 Top-Up Special CMG",
        "description": "Klaim Top-Up Special Drugs/Prosthesis/Sub-Acute/Procedures belum melampirkan protokol terapi, faktur BMHP, atau kesesuaian Fornas."
    },
    {
        "code": "MED-01",
        "pillar": "Pelayanan Medis",
        "title": "Indikasi Phantom Billing / Konfirmasi Tidak Hadir Mobile JKN",
        "regulation": "Permenkes 16/2019 Anti-Fraud JKN",
        "description": "Peserta membantah kehadiran layanan melalui telemetri Mobile JKN dan tidak ada jejak log klinis RME yang memadai."
    },
    {
        "code": "MED-02",
        "pillar": "Pelayanan Medis",
        "title": "Readmisi Dini <= 30 Hari / Repeat Billing Episode",
        "regulation": "Audit Efisiensi Episode Klinis Klaim",
        "description": "Klaim berulang dalam <= 30 hari untuk diagnosis terkait tanpa bukti kondisi eksaserbasi akut baru yang terpisah."
    },
    {
        "code": "MED-03",
        "pillar": "Pelayanan Medis",
        "title": "Anomali Validitas SIP / Praktik Simultan SDMK DPJP",
        "regulation": "UU Kesehatan 17/2023 & Integrasi SISDMK",
        "description": "SIP DPJP berstatus EXPIRED/UNSYNCED atau terdeteksi praktik simultan pada FKRTL berbeda di jam pelayanan yang sama."
    },
    {
        "code": "MED-04",
        "pillar": "Pelayanan Medis",
        "title": "Over-Utilization Prosedur atau LOS Di Luar Kewajaran Klinis",
        "regulation": "Kendali Mutu Kendali Biaya (TKMKB)",
        "description": "Frekuensi tindakan/fisioterapi/LOS melebihi kewajaran klinis tanpa justifikasi progresif pada CPPT harian."
    },
    {
        "code": "MED-05",
        "pillar": "Pelayanan Medis",
        "title": "Berkas Penunjang Medis / Laporan Operasi / PA Belum Lengkap",
        "regulation": "Standar Uji Kelengkapan Berkas Digital",
        "description": "Laporan tindakan pembedahan, hasil laboratorium, radiologi, atau patologi anatomi tidak terunggah pada berkas digital."
    }
]

VEDIKA_CODE_LOOKUP: Dict[str, Dict[str, str]] = {
    item["code"]: item for item in VEDIKA_PENDING_CODES
}

DISPUTE_SLA_TIERS: Dict[str, Dict[str, Any]] = {
    "CABANG": {
        "label": "Dispute Tingkat Kantor Cabang",
        "koding_hk": 5,
        "medis_hk": 14,
        "forum": "Tim Pertimbangan Klinis / Verifikator Senior Kantor Cabang",
        "regulation": "SE Diryan 51/2016"
    },
    "KEDEPUTIAN": {
        "label": "Dispute Tingkat Kedeputian Wilayah",
        "koding_hk": 5,
        "medis_hk": 14,
        "forum": "Kedeputian Wilayah Bidang Penjaminan Manfaat Rujukan",
        "regulation": "SE Diryan 51/2016"
    },
    "PUSAT_TKMKB": {
        "label": "Dispute Eskalasi Pusat / TKMKB Nasional",
        "koding_hk": 14,
        "medis_hk": 21,
        "forum": "TKMKB Nasional & Tim Casemix Kementerian Kesehatan",
        "regulation": "SE Diryan 51/2016"
    }
}

VERIFICATOR_NAME_BY_NIP: Dict[str, str] = {
    "198704202011012001": "dr. Siti Rahma, Sp.PK",
    "199208152015031002": "Budi Santoso, S.Kom, M.TI",
    "198501012010011001": "Hendra Wijaya, S.Si, M.M",
    "199003152018011005": "dr. Andi Pratama, MARS"
}


# ---------------------------------------------------------------------------
# 2. Deterministic VEDIKA Metadata & Backfill Enrichment
# ---------------------------------------------------------------------------
_SEED_VEDIKA_PROFILES: Dict[str, Dict[str, Any]] = {
    "CLM-2026-8801": {
        "no_fpk": "FPK-0114-202611-001",
        "bulan_pelayanan": "2026-11",
        "jenis_pengajuan": "Reguler",
        "jenis_pelayanan": "RJTL",
        "hak_kelas": "2",
        "kelas_ditempati": "2",
        "naik_kelas_flag": False,
        "cara_masuk": "Rujukan FKTP Puskesmas",
        "cara_pulang": "Kontrol Ulang Rawat Jalan",
        "los_hari": 0,
        "icd10_secondary": ["M51.2 (Lumbar intervertebral disc displacement)"],
        "icd9_procedures": ["93.39 (Other physical therapy)", "93.11 (Assisting exercise)"],
        "tarif_rs_riil": 14850000,
        "special_cmg_list": [],
        "penjaminan_khusus": "JKN Murni",
        "frista_verified": False,
        "tte_dpjp_valid": True,
        "assigned_verifier_nip": "198704202011012001",
        "assigned_verifier_name": "dr. Siti Rahma, Sp.PK",
    },
    "CLM-2026-8802": {
        "no_fpk": "FPK-0114-202611-001",
        "bulan_pelayanan": "2026-11",
        "jenis_pengajuan": "Reguler",
        "jenis_pelayanan": "RJTL",
        "hak_kelas": "3",
        "kelas_ditempati": "3",
        "naik_kelas_flag": False,
        "cara_masuk": "Bakti Sosial Operasi Terjadwal",
        "cara_pulang": "Atas Persetujuan Dokter",
        "los_hari": 0,
        "icd10_secondary": ["Z96.1 (Presence of intraocular lens)"],
        "icd9_procedures": ["13.41 (Phacoemulsification of cataract)", "13.71 (Insertion of intraocular lens)"],
        "tarif_rs_riil": 11850000,
        "special_cmg_list": [],
        "penjaminan_khusus": "JKN Murni (Program Baksos Resmi)",
        "frista_verified": True,
        "tte_dpjp_valid": True,
        "assigned_verifier_nip": "198704202011012001",
        "assigned_verifier_name": "dr. Siti Rahma, Sp.PK",
    },
    "CLM-2026-8803": {
        "no_fpk": "FPK-0114-202611-002",
        "bulan_pelayanan": "2026-11",
        "jenis_pengajuan": "Susulan",
        "jenis_pelayanan": "RITL",
        "hak_kelas": "2",
        "kelas_ditempati": "1",
        "naik_kelas_flag": True,
        "cara_masuk": "IGD FKRTL",
        "cara_pulang": "Atas Persetujuan Dokter",
        "los_hari": 5,
        "icd10_secondary": ["I10 (Essential hypertension)", "E11.9 (Type 2 diabetes mellitus)"],
        "icd9_procedures": ["88.56 (Coronary arteriography)", "89.52 (Electrocardiogram)"],
        "tarif_rs_riil": 28400000,
        "special_cmg_list": ["SA-02: Perawatan Sub-Akut Kardiovaskular", "SD-04: Antiplatelet Fornas Terbatas"],
        "penjaminan_khusus": "JKN Murni (Selisih Naik Kelas 2 -> 1)",
        "frista_verified": True,
        "tte_dpjp_valid": False,
        "assigned_verifier_nip": None,
        "assigned_verifier_name": None,
        "resubmission_count": 1,
        "faskes_feedback_history": [
            {
                "timestamp": "2026-10-22T09:15:00Z",
                "actor": "Tim Casemix RS Mitra Husada Medika",
                "action": "KLARIFIKASI_SUSULAN_1",
                "notes": "Faskes melampirkan klarifikasi awal indikasi angiografi; TTE BSrE DPJP & berita acara readmisi <= 30 hari masih dalam konfirmasi."
            }
        ],
    },
    "CLM-2026-8804": {
        "no_fpk": "FPK-0114-202611-001",
        "bulan_pelayanan": "2026-11",
        "jenis_pengajuan": "Reguler",
        "jenis_pelayanan": "RJTL",
        "hak_kelas": "3",
        "kelas_ditempati": "3",
        "naik_kelas_flag": False,
        "cara_masuk": "IGD / Klinik Bedah",
        "cara_pulang": "Kontrol Poliklinik",
        "los_hari": 0,
        "icd10_secondary": ["Z48.0 (Attention to surgical dressings)"],
        "icd9_procedures": ["86.22 (Excisional debridement of wound)"],
        "tarif_rs_riil": 10900000,
        "special_cmg_list": [],
        "penjaminan_khusus": "JKN Murni",
        "frista_verified": False,
        "tte_dpjp_valid": False,
        "assigned_verifier_nip": "198704202011012001",
        "assigned_verifier_name": "dr. Siti Rahma, Sp.PK",
    },
    "CLM-2026-8805": {
        "no_fpk": "FPK-0114-202611-003",
        "bulan_pelayanan": "2026-11",
        "jenis_pengajuan": "Reguler",
        "jenis_pelayanan": "RITL",
        "hak_kelas": "1",
        "kelas_ditempati": "1",
        "naik_kelas_flag": False,
        "cara_masuk": "Poli Spesialis / Rawat Inap",
        "cara_pulang": "Atas Persetujuan Dokter",
        "los_hari": 4,
        "icd10_secondary": ["R50.9 (Fever, unspecified)"],
        "icd9_procedures": ["99.18 (Injection or infusion of electrolytes)"],
        "tarif_rs_riil": 9450000,
        "special_cmg_list": [],
        "penjaminan_khusus": "JKN Murni",
        "frista_verified": True,
        "tte_dpjp_valid": True,
        "assigned_verifier_nip": "198704202011012001",
        "assigned_verifier_name": "dr. Siti Rahma, Sp.PK",
    },
    "CLM-2026-8806": {
        "no_fpk": "FPK-0114-202611-003",
        "bulan_pelayanan": "2026-11",
        "jenis_pengajuan": "LUPIS",
        "jenis_pelayanan": "RITL",
        "hak_kelas": "3",
        "kelas_ditempati": "ICU",
        "naik_kelas_flag": False,
        "cara_masuk": "IGD Rujukan Antar-FKRTL",
        "cara_pulang": "Rujuk Balik / Rawat Lanjut",
        "los_hari": 7,
        "icd10_secondary": ["J96.0 (Acute respiratory failure)"],
        "icd9_procedures": ["96.71 (Continuous invasive mechanical ventilation < 96 hrs)"],
        "tarif_rs_riil": 24800000,
        "special_cmg_list": ["RR-01: Alat Bantu Ventilasi Non-Paket"],
        "penjaminan_khusus": "LUPIS / Alat Bantu Khusus",
        "frista_verified": True,
        "tte_dpjp_valid": True,
        "assigned_verifier_nip": "198704202011012001",
        "assigned_verifier_name": "dr. Siti Rahma, Sp.PK",
    },
}


def compute_daluwarsa_date(service_date: date) -> date:
    """Perpres 82/2018 Pasal 77: 6-month absolute expiry from service completion."""
    month = service_date.month - 1 + 6
    year = service_date.year + month // 12
    month = month % 12 + 1
    day = min(service_date.day, 28)
    return date(year, month, day)


def resolve_service_type(claim: Any) -> str:
    """Resolve RJTL vs RITL consistently across explicit VEDIKA field and Kamus FKL10."""
    explicit = getattr(claim, "jenis_pelayanan", None)
    if explicit in ("RJTL", "RITL"):
        return explicit
    fkl10 = (getattr(claim, "fkl10_tingkat_layanan", None) or "").upper()
    if "RJTL" in fkl10 or "RAWAT JALAN" in fkl10:
        return "RJTL"
    return "RITL"


def enrich_claim_vedika_defaults(claim: Any) -> Any:
    """
    Backfill missing VEDIKA portal attributes on any seeded or persisted ClaimInput
    without overwriting explicit user/verifier edits.
    """
    cid = getattr(claim, "claim_id", "")
    profile = _SEED_VEDIKA_PROFILES.get(cid, {})

    service_dt = getattr(claim, "tanggal_layanan", None) or date.today()
    is_ritl_from_fkl10 = "RITL" in (getattr(claim, "fkl10_tingkat_layanan", None) or "RITL").upper()

    # For curated seed claims, align jenis_pelayanan with profile unless explicitly altered by resubmit/pull
    if not getattr(claim, "no_fpk", None):
        claim.no_fpk = profile.get("no_fpk") or f"FPK-0114-{service_dt.strftime('%Y%m')}-001"
        # Apply seed jenis_pelayanan cleanly on initial hydration
        if profile.get("jenis_pelayanan"):
            claim.jenis_pelayanan = profile["jenis_pelayanan"]
        elif getattr(claim, "jenis_pelayanan", None) not in ("RJTL", "RITL"):
            claim.jenis_pelayanan = "RITL" if is_ritl_from_fkl10 else "RJTL"

    if not getattr(claim, "bulan_pelayanan", None):
        claim.bulan_pelayanan = profile.get("bulan_pelayanan") or service_dt.strftime("%Y-%m")

    if profile.get("jenis_pengajuan") and getattr(claim, "resubmission_count", 0) == 0 and getattr(claim, "jenis_pengajuan", "Reguler") == "Reguler":
        claim.jenis_pengajuan = profile["jenis_pengajuan"]

    if profile:
        if getattr(claim, "tarif_rs_riil", None) is None:
            claim.tarif_rs_riil = profile.get("tarif_rs_riil")
        if getattr(claim, "los_hari", None) is None:
            claim.los_hari = profile.get("los_hari")
        if not getattr(claim, "icd10_secondary", None):
            claim.icd10_secondary = list(profile.get("icd10_secondary", []))
        if not getattr(claim, "icd9_procedures", None):
            claim.icd9_procedures = list(profile.get("icd9_procedures", []))
        if not getattr(claim, "special_cmg_list", None):
            claim.special_cmg_list = list(profile.get("special_cmg_list", []))
        if not getattr(claim, "cara_masuk", None):
            claim.cara_masuk = profile.get("cara_masuk")
        if not getattr(claim, "cara_pulang", None):
            claim.cara_pulang = profile.get("cara_pulang")
        if getattr(claim, "penjaminan_khusus", None) in (None, "JKN Murni") and profile.get("penjaminan_khusus"):
            claim.penjaminan_khusus = profile["penjaminan_khusus"]
        if getattr(claim, "hak_kelas", None) == "3" and profile.get("hak_kelas"):
            claim.hak_kelas = profile["hak_kelas"]
        if getattr(claim, "kelas_ditempati", None) == "3" and profile.get("kelas_ditempati"):
            claim.kelas_ditempati = profile["kelas_ditempati"]
        if profile.get("naik_kelas_flag"):
            claim.naik_kelas_flag = True
        if "frista_verified" in profile and claim.claim_id in _SEED_VEDIKA_PROFILES:
            # Preserve manual override if set later, otherwise initialize seed behavior cleanly
            if getattr(claim, "frista_verified", True) and not profile["frista_verified"] and getattr(claim, "resubmission_count", 0) == 0:
                claim.frista_verified = False
        if "tte_dpjp_valid" in profile and claim.claim_id in _SEED_VEDIKA_PROFILES:
            if getattr(claim, "tte_dpjp_valid", True) and not profile["tte_dpjp_valid"] and getattr(claim, "resubmission_count", 0) == 0:
                claim.tte_dpjp_valid = False
        if not getattr(claim, "faskes_feedback_history", None) and profile.get("faskes_feedback_history"):
            claim.faskes_feedback_history = list(profile["faskes_feedback_history"])
        # Default plotting unless intentionally left unassigned (CLM-2026-8803)
        if getattr(claim, "assigned_verifier_nip", None) is None and cid != "CLM-2026-8803":
            claim.assigned_verifier_nip = profile.get("assigned_verifier_nip")
            claim.assigned_verifier_name = profile.get("assigned_verifier_name")

    # Generic fallback values for dynamically ingested claims
    if getattr(claim, "tarif_rs_riil", None) is None:
        claim.tarif_rs_riil = int(round(claim.nilai_klaim_rp * 1.08))
    if getattr(claim, "los_hari", None) is None:
        claim.los_hari = 3 if claim.jenis_pelayanan == "RITL" else 0
    if not getattr(claim, "cara_masuk", None):
        claim.cara_masuk = "IGD FKRTL" if claim.jenis_pelayanan == "RITL" else "Rujukan FKTP"
    if not getattr(claim, "cara_pulang", None):
        claim.cara_pulang = "Atas Persetujuan Dokter"
    if not getattr(claim, "icd9_procedures", None):
        claim.icd9_procedures = [claim.icd9cm_procedure]
    if getattr(claim, "fkl47_biaya_tagih", None) is None:
        claim.fkl47_biaya_tagih = claim.nilai_klaim_rp
    if getattr(claim, "fkl48_biaya_verifikasi", None) is None:
        claim.fkl48_biaya_verifikasi = claim.nilai_klaim_rp
    if getattr(claim, "daluwarsa_date", None) is None:
        claim.daluwarsa_date = compute_daluwarsa_date(service_dt)
    if getattr(claim, "assigned_verifier_nip", None) and not getattr(claim, "assigned_verifier_name", None):
        claim.assigned_verifier_name = VERIFICATOR_NAME_BY_NIP.get(
            claim.assigned_verifier_nip, claim.assigned_verifier_nip
        )
    return claim


def enrich_claims_map(claims_map: Dict[str, Any]) -> Dict[str, Any]:
    for claim in claims_map.values():
        enrich_claim_vedika_defaults(claim)
    return claims_map


# ---------------------------------------------------------------------------
# 3. Digital Dossier, i-Care JKN Cross-Faskes Timeline, & Billing Reconciliation
# ---------------------------------------------------------------------------
def build_icare_timeline(claim: Any) -> List[Dict[str, Any]]:
    """Build synthetic zero-PHI longitudinal service history (i-Care JKN view)."""
    service_dt = getattr(claim, "tanggal_layanan", None) or date.today()
    prev_gap = claim.episode_meta.selisih_hari_admisi
    timeline: List[Dict[str, Any]] = []

    if prev_gap is not None or claim.episode_meta.indikasi_repeat_billing:
        gap = prev_gap if prev_gap is not None else 2
        prev_dt = service_dt - timedelta(days=gap)
        prev_id = claim.episode_meta.klaim_episode_sebelumnya_id or f"SEP-PREV-{claim.claim_id[-4:]}"
        timeline.append({
            "visit_date": str(prev_dt),
            "sep_no": prev_id,
            "faskes": claim.nama_faskes,
            "service_level": "FKRTL - " + resolve_service_type(claim),
            "icd10": claim.icd10_primary,
            "dpjp": claim.dpjp_meta.nama_dpjp_alias,
            "flag": f"RED FLAG READMISI / REPEAT BILLING (Selisih {gap} hari <= 30 hari)" if gap <= 30 else "Kunjungan Sebelumnya"
        })

    timeline.append({
        "visit_date": str(service_dt - timedelta(days=14)),
        "sep_no": f"FKTP-RUJ-{hashlib.sha256(claim.claim_id.encode()).hexdigest()[:6].upper()}",
        "faskes": "Puskesmas Mitra Rujukan (FKTP Primer)",
        "service_level": "FKTP - RJTP Rujukan Berjenjang",
        "icd10": claim.icd10_primary,
        "dpjp": "Dokter Umum FKTP",
        "flag": "Rujukan Aktif Terverifikasi P-Care"
    })
    timeline.append({
        "visit_date": str(service_dt),
        "sep_no": claim.fkl02_id_kunjungan or claim.claim_id,
        "faskes": claim.nama_faskes,
        "service_level": f"FKRTL - {resolve_service_type(claim)} (Episode Aktif)",
        "icd10": claim.icd10_primary,
        "dpjp": claim.dpjp_meta.nama_dpjp_alias,
        "flag": "ANOMALI KEHADIRAN MOBILE JKN" if claim.mobile_meta.respon_tidak_hadir > 0 else "Episode Sedang Diverifikasi"
    })
    return sorted(timeline, key=lambda x: x["visit_date"], reverse=True)


def build_digital_documents(claim: Any, triage: Any) -> List[Dict[str, Any]]:
    """Build structured VEDIKA e-document viewer bundle with authentic validation signals."""
    frista_ok = bool(getattr(claim, "frista_verified", True))
    tte_ok = bool(getattr(claim, "tte_dpjp_valid", True))
    mobile_anomaly = claim.mobile_meta.respon_tidak_hadir > 0
    sip_ok = claim.dpjp_meta.sip_status == "ACTIVE"
    cbg_target = getattr(claim, "ina_cbg_verified", None) or claim.ina_cbg_code
    tarif_tagih = getattr(claim, "fkl47_biaya_tagih", None) or claim.nilai_klaim_rp
    tarif_verif = getattr(claim, "fkl48_biaya_verifikasi", None)
    if tarif_verif is None:
        tarif_verif = tarif_tagih

    def doc_hash(tag: str) -> str:
        return hashlib.sha256(f"{claim.claim_id}:{tag}:{claim.tanggal_layanan}".encode()).hexdigest()[:16].upper()

    docs = [
        {
            "doc_code": "DOC-SEP",
            "title": "e-SEP & Validasi Biometrik FRISTA",
            "status": "LENGKAP_VALID" if frista_ok else "PERLU_KLARIFIKASI",
            "signed_by": f"Registrasi VClaim ({claim.fkl02_id_kunjungan or claim.claim_id})",
            "hash_sha256": doc_hash("SEP"),
            "highlights": [
                f"Tingkat Layanan: {resolve_service_type(claim)} · Hak Kelas {claim.hak_kelas or '3'} -> Rawat Kelas {claim.kelas_ditempati or '3'}",
                f"Biometrik FRISTA / Fingerprint: {'TERVERIFIKASI' if frista_ok else 'BELUM TERVERIFIKASI / PERLU BUKTI KEHADIRAN'}",
                f"Cara Masuk: {claim.cara_masuk or 'Rujukan FKTP'} · Penjaminan: {claim.penjaminan_khusus or 'JKN Murni'}"
            ]
        },
        {
            "doc_code": "DOC-RESUME",
            "title": "Resume Medis Elektronik & TTE BSrE DPJP",
            "status": "LENGKAP_VALID" if (tte_ok and sip_ok) else "TIDAK_KONSISTEN",
            "signed_by": f"{claim.dpjp_meta.nama_dpjp_alias} ({claim.dpjp_meta.dpjp_id_hash})",
            "hash_sha256": doc_hash("RESUME"),
            "highlights": [
                f"Diagnosis Utama: {claim.icd10_primary}",
                f"Diagnosis Sekunder: {', '.join(claim.icd10_secondary) if claim.icd10_secondary else 'Tidak ada komorbid tercatat'}",
                f"Status SIP SISDMK: {claim.dpjp_meta.sip_status} · TTE Elektronik BSrE DPJP: {'VALID & TERSERTIFIKASI' if tte_ok else 'BELUM DIBUBUHKAN / TTE GAGAL'}"
            ]
        },
        {
            "doc_code": "DOC-CPPT",
            "title": "CPPT Harian & Asuhan Keperawatan / Klinis",
            "status": "TIDAK_KONSISTEN" if mobile_anomaly else "LENGKAP_VALID",
            "signed_by": f"Tim Keperawatan & {claim.dpjp_meta.nama_dpjp_alias}",
            "hash_sha256": doc_hash("CPPT"),
            "highlights": [
                f"Lama Hari Rawat (LOS): {claim.los_hari or 0} hari · Cara Pulang: {claim.cara_pulang or 'Atas Persetujuan Dokter'}",
                f"Konfirmasi Kehadiran Mobile JKN: {claim.mobile_meta.respon_hadir} Hadir vs {claim.mobile_meta.respon_tidak_hadir} Tidak Hadir",
                "Catatan CPPT harus menyertakan evaluasi harian yang membenarkan seluruh ICD-10 sekunder."
            ]
        },
        {
            "doc_code": "DOC-LAPOP",
            "title": "Laporan Operasi / Prosedur Medis (ICD-9-CM)",
            "status": "LENGKAP_VALID" if not claim.episode_meta.indikasi_repeat_billing else "PERLU_KLARIFIKASI",
            "signed_by": f"Kamar Tindakan / Poli Prosedur ({claim.dpjp_meta.nama_dpjp_alias})",
            "hash_sha256": doc_hash("LAPOP"),
            "highlights": [
                f"Prosedur ICD-9-CM: {', '.join(claim.icd9_procedures or [claim.icd9cm_procedure])}",
                f"Rasio Lonjakan Klaster Episode: {claim.episode_meta.rasio_lonjakan_baseline}x baseline (Klaster {claim.episode_meta.cluster_id})",
                f"Status Repeat/Split Billing: {'TERINDIKASI EPISODE BERULANG' if claim.episode_meta.indikasi_repeat_billing else 'Tidak ada tumpang tindih episode'}"
            ]
        },
        {
            "doc_code": "DOC-PENUNJANG",
            "title": "Penunjang Diagnostik (Lab / Radiologi / Patologi)",
            "status": "LENGKAP_VALID" if triage.triage_lane != "MERAH" else "PERLU_KLARIFIKASI",
            "signed_by": "Instalasi Laboratorium & Radiologi Terintegrasi",
            "hash_sha256": doc_hash("PENUNJANG"),
            "highlights": [
                f"Kode Grouper Diajukan: {claim.ina_cbg_code} ({claim.deskripsi_cbg})",
                f"Kode Grouper Terverifikasi: {cbg_target}",
                "Hasil pemeriksaan objektif wajib selaras dengan justifikasi Severity Level & Special CMG."
            ]
        },
        {
            "doc_code": "DOC-BILLING",
            "title": "Rincian Billing RS, Grouping INA-CBG & Fornas",
            "status": "LENGKAP_VALID" if tarif_verif == tarif_tagih else "PERLU_KLARIFIKASI",
            "signed_by": "Tim Casemix & Keuangan FKRTL",
            "hash_sha256": doc_hash("BILLING"),
            "highlights": [
                f"Tarif RS Riil: Rp {claim.tarif_rs_riil or tarif_tagih:,} vs Paket INA-CBG (FKL47): Rp {tarif_tagih:,}",
                f"Top-Up Special CMG: {', '.join(claim.special_cmg_list) if claim.special_cmg_list else 'Tidak ada komponen Special CMG'}",
                f"Tarif Disetujui Verifikator (FKL48): Rp {tarif_verif:,}"
            ]
        }
    ]
    return docs


def build_billing_reconciliation(claim: Any) -> Dict[str, Any]:
    """Produce itemized RS billing vs INA-CBG tariff & FKL48 correction summary."""
    tarif_tagih = int(getattr(claim, "fkl47_biaya_tagih", None) or claim.nilai_klaim_rp)
    tarif_rs = int(getattr(claim, "tarif_rs_riil", None) or int(round(tarif_tagih * 1.08)))
    tarif_verif = getattr(claim, "fkl48_biaya_verifikasi", None)
    tarif_verif = int(tarif_verif if tarif_verif is not None else tarif_tagih)

    akomodasi = int(round(tarif_rs * 0.22)) if resolve_service_type(claim) == "RITL" else 0
    prosedur = int(round(tarif_rs * 0.36))
    penunjang = int(round(tarif_rs * 0.18))
    obat_bmhp = int(round(tarif_rs * 0.16))
    visite = max(0, tarif_rs - akomodasi - prosedur - penunjang - obat_bmhp)

    line_items = [
        {"komponen": "Akomodasi Kamar / ICU" if resolve_service_type(claim) == "RITL" else "Administrasi Poliklinik RJTL", "nilai_rp": akomodasi},
        {"komponen": "Tindakan Medis / Prosedur & Kamar Operasi", "nilai_rp": prosedur},
        {"komponen": "Penunjang Diagnostik (Lab / Radiologi / PA)", "nilai_rp": penunjang},
        {"komponen": "Obat Fornas, Obat Kronis & BMHP", "nilai_rp": obat_bmhp},
        {"komponen": "Visite & Konsultasi DPJP / Anastesi", "nilai_rp": visite},
    ]

    return {
        "tarif_rs_riil_rp": tarif_rs,
        "fkl47_biaya_tagih_rp": tarif_tagih,
        "fkl48_biaya_verifikasi_rp": tarif_verif,
        "selisih_rs_vs_cbg_rp": tarif_rs - tarif_tagih,
        "selisih_koreksi_verifikasi_rp": tarif_tagih - tarif_verif,
        "ina_cbg_diajukan": claim.ina_cbg_code,
        "ina_cbg_verified": getattr(claim, "ina_cbg_verified", None) or claim.ina_cbg_code,
        "special_cmg_list": list(getattr(claim, "special_cmg_list", []) or []),
        "naik_kelas_flag": bool(getattr(claim, "naik_kelas_flag", False)),
        "hak_kelas": getattr(claim, "hak_kelas", "3") or "3",
        "kelas_ditempati": getattr(claim, "kelas_ditempati", "3") or "3",
        "line_items": line_items,
    }


def build_vedika_dossier(
    claim: Any,
    triage: Any,
    checklist_data: Dict[str, Any],
    pending_reasons: List[str]
) -> Dict[str, Any]:
    """Assemble full VEDIKA digital investigation dossier for a single claim."""
    enrich_claim_vedika_defaults(claim)
    today = date.today()
    daluwarsa_dt = getattr(claim, "daluwarsa_date", None) or compute_daluwarsa_date(claim.tanggal_layanan)
    days_left = (daluwarsa_dt - today).days
    dispute_tier = getattr(claim, "dispute_level", None) or "CABANG"

    resolved_reasons = [
        VEDIKA_CODE_LOOKUP.get(code, {"code": code, "pillar": "Catatan Verifikator", "title": code, "regulation": "Kaidah Klaim", "description": ""})
        for code in (pending_reasons or [])
    ]

    return {
        "claim_id": claim.claim_id,
        "fpk_metadata": {
            "no_fpk": claim.no_fpk,
            "sep_no": claim.fkl02_id_kunjungan or claim.claim_id,
            "bulan_pelayanan": claim.bulan_pelayanan,
            "jenis_pengajuan": claim.jenis_pengajuan,
            "jenis_pelayanan": resolve_service_type(claim),
            "tanggal_layanan": str(claim.tanggal_layanan),
            "los_hari": claim.los_hari or 0,
            "hak_kelas": claim.hak_kelas or "3",
            "kelas_ditempati": claim.kelas_ditempati or "3",
            "naik_kelas_flag": bool(claim.naik_kelas_flag),
            "cara_masuk": claim.cara_masuk or "Rujukan FKTP",
            "cara_pulang": claim.cara_pulang or "Atas Persetujuan Dokter",
            "penjaminan_khusus": claim.penjaminan_khusus or "JKN Murni",
            "frista_verified": bool(claim.frista_verified),
            "tte_dpjp_valid": bool(claim.tte_dpjp_valid),
            "assigned_verifier_nip": claim.assigned_verifier_nip,
            "assigned_verifier_name": claim.assigned_verifier_name or "Belum Di-plot",
            "daluwarsa_date": str(daluwarsa_dt),
            "days_until_daluwarsa": days_left,
            "is_near_daluwarsa": days_left <= 30,
            "payment_sla_days": 15,
            "late_penalty_pct_per_month": 1.0,
        },
        "dokumen_berkas_digital": build_digital_documents(claim, triage),
        "icare_history": build_icare_timeline(claim),
        "billing_reconciliation": build_billing_reconciliation(claim),
        "resubmission_timeline": {
            "resubmission_count": int(getattr(claim, "resubmission_count", 0) or 0),
            "history": list(getattr(claim, "faskes_feedback_history", []) or []),
            "dispute_level": getattr(claim, "dispute_level", None),
            "dispute_sla": DISPUTE_SLA_TIERS.get(dispute_tier, DISPUTE_SLA_TIERS["CABANG"]),
        },
        "resolved_pending_reasons": resolved_reasons,
        "checklist": checklist_data,
        "regulatory_anchors": {
            "daluwarsa": "Perpres 82/2018 Pasal 77 (Maks 6 Bulan)",
            "bakb_sla": "Perpres 82/2018 (BAKB/BAHV Maks 10 Hari Kerja)",
            "payment_sla": "Pembayaran Maks 15 Hari Pasca FPK Lengkap (Denda 1%/bulan)",
            "dispute_sla": "SE Diryan 51/2016 (Koding 5-14 HK, Medis 14-21 HK)"
        }
    }


# ---------------------------------------------------------------------------
# 4. VEDIKA Plotting Workload & RJTL/RITL BAHV Aggregator
# ---------------------------------------------------------------------------
def build_verifier_workload(
    claims_map: Dict[str, Any],
    evaluate_fn: Any,
    verificator_list: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Compute per-verifier queue workload and unassigned backlog for Plotting."""
    enrich_claims_map(claims_map)
    by_nip: Dict[str, Dict[str, Any]] = {}
    for v in verificator_list:
        nip = v["nip"]
        by_nip[nip] = {
            "nip": nip,
            "name": v["name"],
            "role": v["role"],
            "assigned_total": 0,
            "open_count": 0,
            "resolved_count": 0,
            "pending_dispute_count": 0,
            "merah_count": 0,
            "rjtl_count": 0,
            "ritl_count": 0,
            "total_nilai_rp": 0,
        }

    unassigned_claims: List[str] = []
    for cid, claim in claims_map.items():
        triage = evaluate_fn(claim)
        nip = getattr(claim, "assigned_verifier_nip", None)
        if not nip or nip not in by_nip:
            unassigned_claims.append(cid)
            continue
        slot = by_nip[nip]
        slot["assigned_total"] += 1
        slot["total_nilai_rp"] += int(claim.nilai_klaim_rp or 0)
        if triage.triage_lane == "MERAH":
            slot["merah_count"] += 1
        if resolve_service_type(claim) == "RJTL":
            slot["rjtl_count"] += 1
        else:
            slot["ritl_count"] += 1
        status = getattr(claim, "status_verifikasi", None)
        if not status:
            slot["open_count"] += 1
        elif status in ("LOLOSKAN_KLAIM", "LAYAK_BAYAR"):
            slot["resolved_count"] += 1
        else:
            slot["pending_dispute_count"] += 1

    return {
        "verifiers": list(by_nip.values()),
        "unassigned_count": len(unassigned_claims),
        "unassigned_claim_ids": unassigned_claims,
        "total_claims": len(claims_map),
    }


def humanize_verification_status(raw_status: Optional[str], triage_lane: Optional[str] = None) -> str:
    """Transform raw database enum/snake_case statuses into official human-friendly BPJS Healthkathon Indonesian terms."""
    val = (raw_status or "").strip().upper()
    if not val and triage_lane:
        val = f"REKOMENDASI_{triage_lane.upper()}"

    mapping = {
        "PENDING_KLARIFIKASI": "Pending Klarifikasi (SLA 10 HK)",
        "KLARIFIKASI_FASKES": "Pending Klarifikasi (SLA 10 HK)",
        "HOLD_KLARIFIKASI": "Pending Klarifikasi (SLA 10 HK)",
        "TIDAK_LAYAK_FRAUD": "Tidak Layak Bayar (Indikasi Fraud)",
        "TOLAK_FRAUD": "Tidak Layak Bayar (Indikasi Fraud)",
        "TOLAK_KLAIM": "Tidak Layak Bayar (Indikasi Fraud)",
        "DITOLAK": "Tidak Layak Bayar (Indikasi Fraud)",
        "AUDIT_LAPANGAN": "Audit Lapangan (Prioritas Merah)",
        "FRAUD_SUSPECT": "Tidak Layak Bayar (Indikasi Fraud)",
        "REKOMENDASI_MERAH": "Rekomendasi Jalur Merah (Audit Khusus)",
        "REKOMENDASI_KUNING": "Rekomendasi Jalur Kuning (Klarifikasi)",
        "REKOMENDASI_HIJAU": "Rekomendasi Jalur Hijau (Fast-Track)",
        "LAYAK_BAYAR": "Layak Bayar (ACC Pra-Bayar)",
        "LOLOSKAN_KLAIM": "Layak Bayar (ACC Pra-Bayar)",
        "DISETUJUI": "Layak Bayar (ACC Pra-Bayar)",
        "SETUJUI_LAYAK": "Layak Bayar (ACC Pra-Bayar)",
        "DISPUTE_TKMKB": "Dispute Klinis (Eskalasi TKMKB)",
        "DISPUTE_KODING": "Dispute Koding INA-CBG",
        "HOLD_AUDIT": "Penundaan Bayar (Audit Khusus)",
    }
    if val in mapping:
        return mapping[val]
    if "MERAH" in val or "RED" in val:
        return "Rekomendasi Jalur Merah (Audit Khusus)"
    if "KUNING" in val or "YELLOW" in val:
        return "Rekomendasi Jalur Kuning (Klarifikasi)"
    if "HIJAU" in val or "GREEN" in val:
        return "Rekomendasi Jalur Hijau (Fast-Track)"
    return val.replace("_", " ").title() if val else "Menunggu Penelaahan"


def _classify_bahv_bucket(claim: Any, triage: Any) -> str:
    st = getattr(claim, "status_verifikasi", None)
    if st in ("LOLOSKAN_KLAIM", "LAYAK_BAYAR", "DISETUJUI"):
        return "LAYAK"
    if st in ("AUDIT_LAPANGAN", "TIDAK_LAYAK_FRAUD", "DITOLAK", "TOLAK_KLAIM"):
        return "TIDAK_LAYAK"
    if st == "DISPUTE_TKMKB":
        return "DISPUTE"
    if st in ("KLARIFIKASI_FASKES", "PENDING_KLARIFIKASI"):
        return "PENDING"
    return "LAYAK" if triage.triage_lane == "HIJAU" else ("PENDING" if triage.triage_lane == "KUNING" else "TIDAK_LAYAK")


def build_bahv_recap_payload(
    claims_map: Dict[str, Any],
    evaluate_fn: Any,
    ops_store: Any,
    national_duckdb_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Build combined BAHV / FPK recapitulation preserving exact legacy bucket contracts
    while adding official RJTL vs RITL split table, FPK batch summary, and daluwarsa watch.
    """
    enrich_claims_map(claims_map)
    buckets: Dict[str, Dict[str, Any]] = {
        "LAYAK": {"label": "Layak Bayar (ACC Pra-Bayar / VIDI)", "count": 0, "claimed_rp": 0, "approved_rp": 0, "held_rp": 0, "items": []},
        "PENDING": {"label": "Pending / Klarifikasi Faskes (SLA 10 HK)", "count": 0, "claimed_rp": 0, "approved_rp": 0, "held_rp": 0, "items": []},
        "DISPUTE": {"label": "Dispute Klinis / Koding (Eskalasi TKMKB)", "count": 0, "claimed_rp": 0, "approved_rp": 0, "held_rp": 0, "items": []},
        "TIDAK_LAYAK": {"label": "Tidak Layak / Hold Audit Khusus PK-JKN", "count": 0, "claimed_rp": 0, "approved_rp": 0, "held_rp": 0, "items": []},
    }

    service_breakdown: Dict[str, Dict[str, Dict[str, Any]]] = {
        status_key: {
            "RJTL": {"kasus": 0, "hari_lbr": 0, "biaya_tagih_rp": 0, "biaya_disetujui_rp": 0, "selisih_rp": 0},
            "RITL": {"kasus": 0, "hari_lbr": 0, "biaya_tagih_rp": 0, "biaya_disetujui_rp": 0, "selisih_rp": 0},
            "TOTAL": {"kasus": 0, "hari_lbr": 0, "biaya_tagih_rp": 0, "biaya_disetujui_rp": 0, "selisih_rp": 0},
        }
        for status_key in ("LAYAK", "PENDING", "DISPUTE", "TIDAK_LAYAK")
    }

    fpk_batches: Dict[str, Dict[str, Any]] = {}
    daluwarsa_watch: List[Dict[str, Any]] = []
    today = date.today()

    for cid, c in claims_map.items():
        triage = evaluate_fn(c)
        key = _classify_bahv_bucket(c, triage)
        claimed_rp = int(getattr(c, "fkl47_biaya_tagih", None) or c.nilai_klaim_rp or 0)
        if key == "LAYAK":
            raw_verif = getattr(c, "fkl48_biaya_verifikasi", None)
            approved_rp = min(claimed_rp, int(raw_verif)) if raw_verif is not None else claimed_rp
        else:
            approved_rp = 0
        held_rp = claimed_rp - approved_rp

        svc = resolve_service_type(c)
        hari_lbr = int(c.los_hari or 0) if svc == "RITL" else 1
        reasons = ops_store.get_pending_reasons(claims_map, cid)
        raw_status = getattr(c, "status_verifikasi", None)

        buckets[key]["count"] += 1
        buckets[key]["claimed_rp"] += claimed_rp
        buckets[key]["approved_rp"] += approved_rp
        buckets[key]["held_rp"] += held_rp
        buckets[key]["items"].append({
            "claim_id": c.claim_id,
            "sep": c.fkl02_id_kunjungan or c.claim_id,
            "no_fpk": c.no_fpk,
            "hospital": c.nama_faskes,
            "nama_faskes": c.nama_faskes,
            "jenis_pelayanan": svc,
            "jenis_pengajuan": c.jenis_pengajuan,
            "cbg": c.ina_cbg_code,
            "ina_cbg_code": c.ina_cbg_code,
            "ina_cbg_verified": getattr(c, "ina_cbg_verified", None) or c.ina_cbg_code,
            "claimed_rp": claimed_rp,
            "nilai_klaim_rp": claimed_rp,
            "biaya_verifikasi_rp": approved_rp,
            "selisih_koreksi_rp": held_rp,
            "triage_lane": triage.triage_lane,
            "lane": triage.triage_lane,
            "score": triage.final_priority_score,
            "raw_status": raw_status or f"REKOMENDASI_{triage.triage_lane}",
            "recorded_decision": humanize_verification_status(raw_status, triage.triage_lane),
            "status_verifikasi": humanize_verification_status(raw_status, triage.triage_lane),
            "adjudicated_by": c.adjudicated_by,
            "assigned_verifier_name": c.assigned_verifier_name or "Belum Di-plot",
            "sla_days": triage.sla_deadline_days,
            "pending_reasons": reasons,
            "dispute_level": getattr(c, "dispute_level", None),
        })

        for seg in (svc, "TOTAL"):
            sb = service_breakdown[key][seg]
            sb["kasus"] += 1
            sb["hari_lbr"] += hari_lbr
            sb["biaya_tagih_rp"] += claimed_rp
            sb["biaya_disetujui_rp"] += approved_rp
            sb["selisih_rp"] += held_rp

        fpk_no = c.no_fpk or "FPK-DEFAULT"
        fpk_entry = fpk_batches.setdefault(fpk_no, {
            "no_fpk": fpk_no,
            "bulan_pelayanan": c.bulan_pelayanan or today.strftime("%Y-%m"),
            "jenis_pengajuan": c.jenis_pengajuan,
            "total_kasus": 0,
            "rjtl_kasus": 0,
            "ritl_kasus": 0,
            "total_tagih_rp": 0,
            "total_disetujui_rp": 0,
            "total_tertahan_rp": 0,
        })
        fpk_entry["total_kasus"] += 1
        fpk_entry["rjtl_kasus"] += (1 if svc == "RJTL" else 0)
        fpk_entry["ritl_kasus"] += (1 if svc == "RITL" else 0)
        fpk_entry["total_tagih_rp"] += claimed_rp
        fpk_entry["total_disetujui_rp"] += approved_rp
        fpk_entry["total_tertahan_rp"] += held_rp

        daluwarsa_dt = c.daluwarsa_date or compute_daluwarsa_date(c.tanggal_layanan)
        days_left = (daluwarsa_dt - today).days
        if days_left <= 60:
            daluwarsa_watch.append({
                "claim_id": c.claim_id,
                "nama_faskes": c.nama_faskes,
                "daluwarsa_date": str(daluwarsa_dt),
                "days_left": days_left,
            })

    total_claimed_rp = sum(b["claimed_rp"] for b in buckets.values())
    total_approved_rp = buckets["LAYAK"]["approved_rp"]
    total_held_rp = total_claimed_rp - total_approved_rp

    return {
        "status": "success",
        "period_label": "Periode FPK Pra-Bayar Aktif (SLA 10 Hari Kerja · Perpres 82/2018)",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "regulatory_basis": "Perpres No. 82/2018 (SLA BAKB 10 HK, Pembayaran 15 Hari, Denda 1%/bulan, Daluwarsa 6 Bulan) & Permenkes 3/2023",
        "total_claims": len(claims_map),
        "total_claims_in_queue": len(claims_map),
        "total_claimed_rp": total_claimed_rp,
        "total_approved_rp": total_approved_rp,
        "total_held_rp": total_held_rp,
        "prevention_efficiency_pct": round((total_held_rp / total_claimed_rp) * 100.0, 2) if total_claimed_rp else 0.0,
        "buckets": buckets,
        "service_breakdown": service_breakdown,
        "fpk_batches": sorted(fpk_batches.values(), key=lambda x: x["no_fpk"]),
        "daluwarsa_watch": sorted(daluwarsa_watch, key=lambda x: x["days_left"]),
        "national_duckdb_context": national_duckdb_context or {},
    }


# ---------------------------------------------------------------------------
# 5. Official Collective BAHV/FPK & BA Pending HTML Printables (Zero PHI)
# ---------------------------------------------------------------------------
def _fmt_rp(val: int) -> str:
    return f"Rp {val:,}".replace(",", ".")


def render_collective_fpk_bahv_html(
    recap_data: Dict[str, Any],
    signer_name: str,
    signer_nip: str,
    no_fpk_filter: Optional[str] = None
) -> Dict[str, Any]:
    """Generate printable collective Berita Acara Hasil Verifikasi (BAHV) & FPK (RJTL vs RITL)."""
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    sb = recap_data["service_breakdown"]
    rows_html = ""
    labels = {
        "LAYAK": "I. Klaim Layak Bayar (Disetujui Verifikator)",
        "PENDING": "II. Klaim Pending / Klarifikasi Faskes",
        "DISPUTE": "III. Klaim Dispute (Koding / Medis / TKMKB)",
        "TIDAK_LAYAK": "IV. Klaim Tidak Layak / Ditolak",
    }
    for key in ("LAYAK", "PENDING", "DISPUTE", "TIDAK_LAYAK"):
        rj = sb[key]["RJTL"]
        ri = sb[key]["RITL"]
        tt = sb[key]["TOTAL"]
        rows_html += (
            f"<tr>"
            f"<td><strong>{html.escape(labels[key])}</strong></td>"
            f"<td class='num'>{rj['kasus']}</td><td class='num'>{rj['hari_lbr']}</td><td class='num'>{_fmt_rp(rj['biaya_tagih_rp'])}</td>"
            f"<td class='num'>{ri['kasus']}</td><td class='num'>{ri['hari_lbr']}</td><td class='num'>{_fmt_rp(ri['biaya_tagih_rp'])}</td>"
            f"<td class='num'>{tt['kasus']}</td><td class='num'>{_fmt_rp(tt['biaya_tagih_rp'])}</td><td class='num'>{_fmt_rp(tt['biaya_disetujui_rp'])}</td><td class='num'>{_fmt_rp(tt['selisih_rp'])}</td>"
            f"</tr>"
        )

    doc_seed = f"BAHV:{no_fpk_filter or 'ALL'}:{recap_data['total_claims']}:{recap_data['total_approved_rp']}:{signer_nip}"
    doc_hash = hashlib.sha256(doc_seed.encode()).hexdigest().upper()

    html_doc = f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>BAHV & Rekapitulasi FPK Kolektif - ClaimTrace JKN</title>
<style>
  body {{ font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 24px; font-size: 11px; }}
  .hdr {{ border-bottom: 2px solid #047857; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; }}
  h1 {{ font-size: 15px; margin: 0 0 4px 0; color: #064e3b; text-transform: uppercase; }}
  .sub {{ font-size: 11px; color: #4b5563; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
  th, td {{ border: 1px solid #cbd5e1; padding: 6px 7px; text-align: left; }}
  th {{ background: #f1f5f9; font-size: 10px; text-transform: uppercase; text-align: center; }}
  td.num {{ text-align: right; font-variant-numeric: tabular-nums; }}
  .summary-box {{ margin-top: 12px; padding: 10px; background: #ecfdf5; border: 1px solid #a7f3d0; }}
  .sign {{ margin-top: 22px; display: flex; justify-content: space-between; }}
  .seal {{ margin-top: 14px; font-family: monospace; font-size: 10px; color: #374151; background: #f8fafc; padding: 8px; border: 1px dashed #94a3b8; }}
</style>
</head>
<body>
  <div class="hdr">
    <div>
      <h1>BERITA ACARA HASIL VERIFIKASI (BAHV) & FORMULIR PENGAJUAN KLAIM (FPK)</h1>
      <div class="sub">Sistem Pengawasan Klaim Pra-Bayar ClaimTrace · BEA C03.04 · {html.escape(no_fpk_filter or 'Rekapitulasi Kolektif Aktif')}</div>
    </div>
    <div style="text-align:right">
      <div><strong>Dicetak:</strong> {html.escape(now_iso)}</div>
      <div><strong>Dasar Hukum:</strong> Perpres 82/2018 & Permenkes 3/2023</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th rowspan="2">Status Hasil Verifikasi</th>
        <th colspan="3">Rawat Jalan Tingkat Lanjut (RJTL)</th>
        <th colspan="3">Rawat Inap Tingkat Lanjut (RITL)</th>
        <th colspan="4">Total Konsolidasi FPK</th>
      </tr>
      <tr>
        <th>Kasus</th><th>Lbr</th><th>Biaya Tagih</th>
        <th>Kasus</th><th>Hari</th><th>Biaya Tagih</th>
        <th>Kasus</th><th>Biaya Tagih</th><th>Biaya Disetujui</th><th>Selisih / Tahan</th>
      </tr>
    </thead>
    <tbody>
      {rows_html}
      <tr style="background:#f8fafc;font-weight:bold;">
        <td>TOTAL KESELURUHAN FPK</td>
        <td class="num">{sum(sb[k]['RJTL']['kasus'] for k in labels)}</td>
        <td class="num">{sum(sb[k]['RJTL']['hari_lbr'] for k in labels)}</td>
        <td class="num">{_fmt_rp(sum(sb[k]['RJTL']['biaya_tagih_rp'] for k in labels))}</td>
        <td class="num">{sum(sb[k]['RITL']['kasus'] for k in labels)}</td>
        <td class="num">{sum(sb[k]['RITL']['hari_lbr'] for k in labels)}</td>
        <td class="num">{_fmt_rp(sum(sb[k]['RITL']['biaya_tagih_rp'] for k in labels))}</td>
        <td class="num">{recap_data['total_claims']}</td>
        <td class="num">{_fmt_rp(recap_data['total_claimed_rp'])}</td>
        <td class="num">{_fmt_rp(recap_data['total_approved_rp'])}</td>
        <td class="num">{_fmt_rp(recap_data['total_held_rp'])}</td>
      </tr>
    </tbody>
  </table>
  <div class="summary-box">
    <strong>Ringkasan Kendali Anggaran DJSN:</strong> Total Klaim Diajukan {_fmt_rp(recap_data['total_claimed_rp'])} |
    Disetujui Dibayarkan (BOA SLA 15 Hari) {_fmt_rp(recap_data['total_approved_rp'])} |
    Tertahan / Dicegah Pra-Bayar {_fmt_rp(recap_data['total_held_rp'])} ({recap_data['prevention_efficiency_pct']}%).
  </div>
  <div class="sign">
    <div>
      <div>Disahkan oleh Verifikator Senior BPJS Kesehatan,</div>
      <div style="margin-top:34px;"><strong>{html.escape(signer_name)}</strong></div>
      <div>NIP. {html.escape(signer_nip)}</div>
    </div>
    <div style="text-align:right;">
      <div>Konfirmasi Umpan Balik Casemix FKRTL,</div>
      <div style="margin-top:34px;"><strong>Penanggung Jawab Klaim FKRTL</strong></div>
      <div>Sesuai SLA BAKB Maks. 10 Hari Kerja</div>
    </div>
  </div>
  <div class="seal">
    SHA-256 ELECTRONIC VERIFICATION SEAL: {doc_hash} · Zero-PHI Pseudonymized Export (UU PDP No. 27/2022)
  </div>
</body>
</html>"""

    return {
        "status": "success",
        "document_type": "BAHV_FPK_KOLEKTIF",
        "document_hash": doc_hash,
        "generated_at": now_iso,
        "html_printable": html_doc,
        "summary": {
            "total_claims": recap_data["total_claims"],
            "total_claimed_rp": recap_data["total_claimed_rp"],
            "total_approved_rp": recap_data["total_approved_rp"],
            "total_held_rp": recap_data["total_held_rp"],
        }
    }


def render_ba_pending_dispute_html(
    recap_data: Dict[str, Any],
    signer_name: str,
    signer_nip: str
) -> Dict[str, Any]:
    """Generate printable Berita Acara Pending & Dispute (BA Kesepakatan 3-Pilar reasons)."""
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    pending_items = (
        list(recap_data["buckets"]["PENDING"]["items"])
        + list(recap_data["buckets"]["DISPUTE"]["items"])
        + list(recap_data["buckets"]["TIDAK_LAYAK"]["items"])
    )
    rows = ""
    for idx, item in enumerate(pending_items, start=1):
        code_list = item.get("pending_reasons") or ["KLARIFIKASI-PRA-BAYAR"]
        descs = "; ".join(
            f"{code}: {VEDIKA_CODE_LOOKUP[code]['title']}" if code in VEDIKA_CODE_LOOKUP else code
            for code in code_list
        )
        raw_v = str(item.get('raw_status') or item.get('status_verifikasi') or '')
        human_status = humanize_verification_status(raw_v, item.get('triage_lane'))
        badge_style = (
            "background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;"
            if ("Fraud" in human_status or "Merah" in human_status)
            else "background:#fef3c7;color:#92400e;border:1px solid #fcd34d;"
            if ("Klarifikasi" in human_status or "Kuning" in human_status or "Dispute" in human_status)
            else "background:#dcfce7;color:#166534;border:1px solid #86efac;"
        )
        status_badge_html = (
            f"<span style='display:inline-block;padding:2px 8px;border-radius:6px;font-weight:700;font-size:10px;line-height:1.4;{badge_style}'>"
            f"{html.escape(human_status)}"
            f"</span>"
            + (f"<br/><small style='color:#64748b'>Tier: {html.escape(item['dispute_level'])}</small>" if item.get("dispute_level") else "")
        )
        rows += (
            f"<tr>"
            f"<td style='text-align:center'>{idx}</td>"
            f"<td><strong>{html.escape(item['claim_id'])}</strong><br/><small>{html.escape(item.get('no_fpk') or '-')}</small></td>"
            f"<td>{html.escape(item['nama_faskes'])}</td>"
            f"<td style='text-align:center'>{html.escape(item['jenis_pelayanan'])}<br/><small>{html.escape(item['ina_cbg_code'])}</small></td>"
            f"<td>{status_badge_html}</td>"
            f"<td>{html.escape(descs)}</td>"
            f"<td class='num'>{_fmt_rp(int(item['nilai_klaim_rp']))}</td>"
            f"</tr>"
        )

    if not rows:
        rows = "<tr><td colspan='7' style='text-align:center;color:#64748b'>Seluruh klaim aktif telah berstatus Layak Bayar (tidak ada berkas Pending/Dispute).</td></tr>"

    total_held = sum(int(i["nilai_klaim_rp"]) for i in pending_items)
    doc_hash = hashlib.sha256(f"BA_PENDING:{len(pending_items)}:{total_held}:{signer_nip}".encode()).hexdigest().upper()

    html_doc = f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Berita Acara Pending & Dispute Klaim JKN</title>
<style>
  body {{ font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 24px; font-size: 11px; }}
  h1 {{ font-size: 15px; margin: 0 0 4px 0; color: #92400e; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
  th, td {{ border: 1px solid #cbd5e1; padding: 6px; text-align: left; vertical-align: top; }}
  th {{ background: #fef3c7; font-size: 10px; text-transform: uppercase; }}
  td.num {{ text-align: right; font-variant-numeric: tabular-nums; }}
  .seal {{ margin-top: 16px; font-family: monospace; font-size: 10px; color: #475569; border-top: 1px dashed #94a3b8; padding-top: 8px; }}
</style>
</head>
<body>
  <h1>BERITA ACARA PENDING, KLARIFIKASI FASKES & DISPUTE MEDIS/KODING</h1>
  <div>Tanggal Terbit: {html.escape(now_iso)} · Verifikator: {html.escape(signer_name)} (NIP. {html.escape(signer_nip)})</div>
  <div>Acuan SLA: Koding 5 HK / Medis 14-21 HK (SE Diryan 51/2016) & BA Kesepakatan 3 Pilar (Administrasi, Koding, Pelayanan Medis)</div>
  <table>
    <thead>
      <tr>
        <th>No</th><th>ID Klaim & FPK</th><th>FKRTL</th><th>Layanan / CBG</th>
        <th>Status Disposisi</th><th>Alasan Pending Baku / Temuan Verifikator</th><th>Biaya Tertahan</th>
      </tr>
    </thead>
    <tbody>
      {rows}
    </tbody>
  </table>
  <p><strong>Total Berkas Tertahan / Klarifikasi:</strong> {len(pending_items)} berkas senilai {_fmt_rp(total_held)}.</p>
  <div class="seal">SHA-256 INTEGRITY SEAL: {doc_hash} · Dikelola melalui ClaimTrace DSS JKN</div>
</body>
</html>"""

    return {
        "status": "success",
        "document_type": "BA_PENDING_DISPUTE",
        "document_hash": doc_hash,
        "generated_at": now_iso,
        "pending_count": len(pending_items),
        "total_held_rp": total_held,
        "html_printable": html_doc,
    }
