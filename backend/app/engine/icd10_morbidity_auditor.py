"""
ClaimTrace JKN - ICD-10 Morbidity Coding Rules (MB1-MB5), Fornas & Live 30-Day Readmission Auditor
Implements Permenkes No. 76/2016 WHO Rule MB1-MB5 primary diagnosis resequencing,
Age/Sex biological plausibility edits, KMK Fornas drug restriction checks,
and <30-day same-patient readmission detection (supports both encounter lists and
live bpjs_fkrtl_all warehouse lookup by PSTV01).
"""

from __future__ import annotations

import logging
import re
from datetime import date, datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger("claimtrace.icd10_morbidity_auditor")

# Major acute / surgical / life-threatening ICD-10 prefixes that outweigh minor/symptom main codes (MB1/MB3)
_MAJOR_ETIOLOGY_PREFIXES = (
    "A41", "A40", "C", "I20", "I21", "I22", "I24", "I50", "I60", "I61", "I63",
    "J18", "J80", "J96", "K35", "K92", "N17", "N18.4", "N18.5", "O14", "O15", "S72",
)

# Combination code hints for MB2 (main + secondary should collapse into single combined ICD-10)
_MB2_COMBINATION_PAIRS = [
    (r"^E11\.9$", r"^(N18|H36|G63|E11\.[2-5])", "E11.2 / E11.3 / E11.4",
     "Diabetes Mellitus Tipe 2 dengan komplikasi ginjal/mata/saraf harus dikode sebagai kode kombinasi (bukan E11.9 terpisah)."),
    (r"^E10\.9$", r"^(N18|H36|G63|E10\.[2-5])", "E10.2 / E10.3 / E10.4",
     "Diabetes Mellitus Tipe 1 dengan komplikasi organ harus menggunakan subkode kombinasi .2-.4."),
    (r"^I10$", r"^I50", "I11.0",
     "Hipertensi esensial (I10) disertai Gagal Jantung (I50) sesuai kaidah WHO/MB2 dikodekan menjadi Hypertensive Heart Disease dengan gagal jantung (I11.0)."),
    (r"^I10$", r"^N18", "I12.0",
     "Hipertensi esensial (I10) disertai Penyakit Ginjal Kronis (N18) dikodekan sebagai Hypertensive Renal Disease (I12.0)."),
    (r"^K80\.[28]$", r"^K81", "K80.0 / K80.1",
     "Kolelitiasis dengan Kolesistitis akut/kronis harus dikodekan dengan kode kombinasi K80.0/K80.1."),
]

# Procedure-to-Primary ICD-10 Alignment (MB5)
_MB5_PROCEDURE_DIAGNOSIS_HINT = {
    "13.41": (r"^H2[568]", "Fakoemulsifikasi Katarak (13.41) mensyaratkan diagnosis katarak (H25/H26) sebagai kondisi utama sumber daya."),
    "39.95": (r"^(N1[789]|I1[23]\.|Z49)", "Hemodialisis (39.95) mensyaratkan Gagal Ginjal (N18/N17/Z49) sebagai diagnosis utama atau primer perawatan."),
    "88.56": (r"^I2[015]", "Angiografi Koroner (88.56) mensyaratkan Penyakit Jantung Koroner/Angina/Infark (I20-I25) sebagai diagnosis utama."),
    "47.0": (r"^K3[567]", "Apendektomi (47.0) mensyaratkan Apendisitis (K35-K37) sebagai kondisi utama."),
    "74.0": (r"^O", "Seksio Sesarea (74.0) mensyaratkan kode obstetri Bab XV (O00-O99) sebagai diagnosis utama."),
}

# Formularium Nasional (KMK HK.01.07/MENKES/200/2020 & pemutakhirannya)
_FORNAS_RESTRICTIONS = [
    {
        "keywords": ("albumin", "human albumin"),
        "drug_name": "Human Albumin 20% / 25%",
        "allowed_icd10_patterns": [r"^K74", r"^N04", r"^T2[0-9]", r"^E4[0-3]", r"^A41"],
        "clinical_requirement": "Kadar serum albumin < 2.5 g/dL dan/atau asites masif, sindrom nefrotik, luka bakar berat, atau sepsis ICU.",
        "legal_basis": "KMK Formularium Nasional (Restriksi Albumin 20%/25%)",
    },
    {
        "keywords": ("epoetin", "erythropoietin", "eritropoietin", "recormon", "hemapo"),
        "drug_name": "Erythropoietin (Epoetin Alfa/Beta)",
        "allowed_icd10_patterns": [r"^N18\.[345]", r"^N18\.9", r"^Z49", r"^C"],
        "clinical_requirement": "Anemia pada Penyakit Ginjal Kronis Stadium 3-5 / Hemodialisis (Hb < 10 g/dL, feritin > 100 ng/mL).",
        "legal_basis": "KMK Formularium Nasional (Restriksi Agen Stimulasi Eritropoiesis)",
    },
    {
        "keywords": ("trastuzumab", "herceptin"),
        "drug_name": "Trastuzumab",
        "allowed_icd10_patterns": [r"^C50"],
        "clinical_requirement": "Kanker Payudara (C50) dengan hasil pemeriksaan IHK/FISH HER2 Positif (+++) terlampir.",
        "legal_basis": "KMK Formularium Nasional (Obat Target Terapi Onkologi)",
    },
    {
        "keywords": ("rituximab", "mabthera"),
        "drug_name": "Rituximab",
        "allowed_icd10_patterns": [r"^C8[235]", r"^C91"],
        "clinical_requirement": "Limfoma Non-Hodgkin / CLL CD20+ terkonfirmasi patologi anatomi.",
        "legal_basis": "KMK Formularium Nasional (Antibodi Monoklonal Hematologi)",
    },
    {
        "keywords": ("meropenem", "doripenem", "ertapenem"),
        "drug_name": "Carbapenem (Meropenem/Doripenem/Ertapenem)",
        "allowed_icd10_patterns": [r"^A41", r"^J18", r"^N39\.0", r"^K65", r"^T81\.4"],
        "clinical_requirement": "Infeksi berat ESBL/MDR atau sepsis terkonfirmasi dengan hasil kultur mikrobiologi / uji kepekaan antibiotik.",
        "legal_basis": "PPRA Permenkes No. 8/2015 & Formularium Nasional (Antibiotik Lini 3)",
    },
]


def _normalize_icd(code: Optional[str]) -> str:
    return (code or "").strip().upper()


def _matches_any(code: str, patterns: List[str]) -> bool:
    return any(re.match(pat, code) for pat in patterns)


def audit_morbidity_rules(
    primary_icd10: str,
    secondary_icd10s: Optional[List[str]] = None,
    procedure_icd9cm: Optional[List[str]] = None,
    patient_age: Optional[int] = None,
    patient_sex: Optional[str] = None,
    tarif_klaim_rp: float = 0.0,
) -> Dict[str, Any]:
    """
    Evaluate Permenkes No. 76/2016 WHO Rule MB1-MB5, ICD-10 terminology lookup,
    and age/sex biological plausibility checks.
    """
    from app.engine.icd10_service import icd10_service

    prim = _normalize_icd(primary_icd10)
    secs = [_normalize_icd(s) for s in (secondary_icd10s or []) if _normalize_icd(s)]
    procs = [p.strip().upper() for p in (procedure_icd9cm or []) if p and p.strip()]
    findings: List[Dict[str, Any]] = []

    prim_info = icd10_service.lookup(prim) if prim else None
    terminology_checks: List[Dict[str, Any]] = []
    if prim:
        terminology_checks.append(
            {
                "code": prim,
                "role": "PRIMARY",
                "valid_in_master": prim_info is not None,
                "description": (prim_info or {}).get("display_id") or (prim_info or {}).get("display_en") or "Kode tidak ditemukan di master ICD-10",
            }
        )
        if prim_info is None and not re.match(r"^[A-Z]\d{2}(\.[0-9A-Z]{1,4})?$", prim):
            findings.append(
                {
                    "rule_code": "ICD10-FORMAT-INVALID",
                    "rule_group": "TERMINOLOGY",
                    "severity": "HIGH",
                    "title": f"Format Kode Diagnosis Primer ({prim}) Tidak Valid",
                    "detail": f"Kode '{prim}' tidak sesuai format standar ICD-10 WHO dan tidak terdaftar pada master terminologi.",
                    "recommended_code": None,
                }
            )
    for sec in secs[:15]:
        info = icd10_service.lookup(sec)
        terminology_checks.append(
            {
                "code": sec,
                "role": "SECONDARY",
                "valid_in_master": info is not None,
                "description": (info or {}).get("display_id") or (info or {}).get("display_en") or "Tidak terpetakan persis (subkode / lokal)",
            }
        )

    major_secondaries = [s for s in secs if s.startswith(_MAJOR_ETIOLOGY_PREFIXES)]

    # Rule MB3: Symptom/sign R00-R99 as primary while clear etiology exists in secondary
    is_symptom_primary = bool(re.match(r"^R\d{2}", prim))
    if is_symptom_primary and major_secondaries:
        findings.append(
            {
                "rule_code": "RULE-MB3",
                "rule_group": "MB3",
                "severity": "CRITICAL" if tarif_klaim_rp >= 5_000_000 else "HIGH",
                "title": f"Pelanggaran Rule MB3: Kode Gejala ({prim}) Menjadi Diagnosis Utama",
                "detail": (
                    f"Kode gejala Bab XVIII ({prim}) tidak boleh dipilih sebagai diagnosis utama karena etiologi "
                    f"definitif ({', '.join(major_secondaries)}) telah tercatat pada diagnosis sekunder."
                ),
                "recommended_code": major_secondaries[0],
            }
        )
    elif is_symptom_primary and secs:
        findings.append(
            {
                "rule_code": "RULE-MB3-REVIEW",
                "rule_group": "MB3",
                "severity": "MEDIUM",
                "title": f"Kode Gejala ({prim}) Sebagai Diagnosis Utama Perlu Verifikasi",
                "detail": f"Diagnosis utama menggunakan kode gejala ({prim}) sementara terdapat kondisi sekunder ({', '.join(secs[:3])}). Verifikasi apakah kondisi sekunder merupakan etiologi langsung.",
                "recommended_code": secs[0],
            }
        )

    # Rule MB1: Minor/Z/chronic primary while major acute/surgical etiology is in secondary
    is_minor_or_z = bool(re.match(r"^(Z0[0-9]|Z3[0-9]|J0[0-6]|K29|K30|M54\.5)", prim))
    if is_minor_or_z and major_secondaries:
        findings.append(
            {
                "rule_code": "RULE-MB1",
                "rule_group": "MB1",
                "severity": "HIGH",
                "title": f"Pelanggaran Rule MB1: Kondisi Minor ({prim}) Menggeser Diagnosis Mayor",
                "detail": (
                    f"Kondisi minor/pemeriksaan rutin ({prim}) ditempatkan sebagai diagnosis utama padahal episode perawatan "
                    f"melibatkan diagnosis mayor/emergensi ({', '.join(major_secondaries)})."
                ),
                "recommended_code": major_secondaries[0],
            }
        )

    # Rule MB2: Several conditions coded separately when combined ICD-10 exists
    all_codes = [prim] + secs
    for pat_a, pat_b, combined_hint, msg in _MB2_COMBINATION_PAIRS:
        has_a = any(re.match(pat_a, c) for c in all_codes)
        has_b = any(re.match(pat_b, c) for c in all_codes)
        if has_a and has_b:
            findings.append(
                {
                    "rule_code": "RULE-MB2",
                    "rule_group": "MB2",
                    "severity": "HIGH",
                    "title": f"Pelanggaran Rule MB2: Pemecahan Kode Kombinasi (Gunakan {combined_hint})",
                    "detail": msg,
                    "recommended_code": combined_hint,
                }
            )

    # Rule MB4: Specificity + Biological Age/Sex Checks
    if prim.endswith(".9") and any(s.startswith(prim[:3]) and not s.endswith(".9") for s in secs):
        specific = [s for s in secs if s.startswith(prim[:3]) and not s.endswith(".9")][0]
        findings.append(
            {
                "rule_code": "RULE-MB4-SPECIFICITY",
                "rule_group": "MB4",
                "severity": "MEDIUM",
                "title": f"Pelanggaran Rule MB4: Kode Tidak Spesifik ({prim}) vs Spesifik ({specific})",
                "detail": f"Gunakan subkategori anatomi/etiologi yang lebih spesifik ({specific}) dibanding kode .9 unspecified ({prim}).",
                "recommended_code": specific,
            }
        )

    sex_norm = (patient_sex or "").strip().upper()
    if patient_age is not None:
        if any(c.startswith("O") for c in all_codes) and (patient_age < 10 or patient_age > 60):
            findings.append(
                {
                    "rule_code": "RULE-MB4-AGE-OBSTETRIC",
                    "rule_group": "MB4",
                    "severity": "CRITICAL",
                    "title": "Anomali Usia pada Kode Obstetri (O00-O99)",
                    "detail": f"Kode kehamilan/persalinan ditemukan pada pasien usia {patient_age} tahun.",
                    "recommended_code": None,
                }
            )
        if any(c.startswith("P") for c in all_codes) and patient_age > 1:
            findings.append(
                {
                    "rule_code": "RULE-MB4-AGE-PERINATAL",
                    "rule_group": "MB4",
                    "severity": "CRITICAL",
                    "title": "Anomali Usia pada Kode Perinatal (P00-P96)",
                    "detail": f"Kode kondisi perinatal ({', '.join(c for c in all_codes if c.startswith('P'))}) hanya valid untuk neonatus, namun tercatat pada pasien usia {patient_age} tahun.",
                    "recommended_code": None,
                }
            )
    if sex_norm in ("L", "M", "MALE", "LAKI-LAKI"):
        if any(re.match(r"^(O|C5[1-8]|N7[0-7])", c) for c in all_codes):
            findings.append(
                {
                    "rule_code": "RULE-MB4-SEX-MALE",
                    "rule_group": "MB4",
                    "severity": "CRITICAL",
                    "title": "Ketidakcocokan Jenis Kelamin (Diagnosis Khusus Wanita pada Pasien Pria)",
                    "detail": "Kode obstetri/ginekologi tidak konsisten dengan demografi pasien laki-laki.",
                    "recommended_code": None,
                }
            )
    elif sex_norm in ("P", "F", "FEMALE", "PEREMPUAN"):
        if any(re.match(r"^(C6[0-3]|N4[0-9]|N50)", c) for c in all_codes):
            findings.append(
                {
                    "rule_code": "RULE-MB4-SEX-FEMALE",
                    "rule_group": "MB4",
                    "severity": "CRITICAL",
                    "title": "Ketidakcocokan Jenis Kelamin (Diagnosis Khusus Pria pada Pasien Wanita)",
                    "detail": "Kode prostat/organ reproduksi pria tidak konsisten dengan demografi pasien perempuan.",
                    "recommended_code": None,
                }
            )

    # Rule MB5: Procedure-driven Principal Resource Resequencing
    for proc in procs:
        for p_prefix, (req_pat, msg) in _MB5_PROCEDURE_DIAGNOSIS_HINT.items():
            if proc.startswith(p_prefix) and not re.match(req_pat, prim):
                sec_match = [s for s in secs if re.match(req_pat, s)]
                findings.append(
                    {
                        "rule_code": "RULE-MB5",
                        "rule_group": "MB5",
                        "severity": "HIGH",
                        "title": f"Pelanggaran Rule MB5: Prosedur Utama ({proc}) Tidak Selaras Diagnosis Primer ({prim})",
                        "detail": msg + (f" Diagnosis sekunder {sec_match[0]} seharusnya diurutkan sebagai primer." if sec_match else ""),
                        "recommended_code": sec_match[0] if sec_match else None,
                    }
                )

    return {
        "primary_icd10": prim,
        "secondary_icd10s": secs,
        "rules_evaluated": ["MB1", "MB2", "MB3", "MB4", "MB5", "ICD10_TERMINOLOGY"],
        "is_coding_compliant": len(findings) == 0,
        "total_findings": len(findings),
        "findings": findings,
        "terminology_checks": terminology_checks,
    }


def audit_fornas_compliance(
    medications: List[str],
    all_icd10_codes: List[str],
    clinical_notes: str = "",
) -> Dict[str, Any]:
    """Check prescribed drugs against KMK Formularium Nasional clinical restrictions."""
    med_text = " ".join(m.strip().lower() for m in medications if m)
    notes_lower = (clinical_notes or "").lower()
    codes = [_normalize_icd(c) for c in all_icd10_codes if c]

    flags: List[Dict[str, Any]] = []
    matched_drugs: List[str] = []

    for rule in _FORNAS_RESTRICTIONS:
        if any(kw in med_text or kw in notes_lower for kw in rule["keywords"]):
            matched_drugs.append(rule["drug_name"])
            if not any(_matches_any(c, rule["allowed_icd10_patterns"]) for c in codes):
                flags.append(
                    {
                        "rule_code": f"FORNAS-{rule['drug_name'].split()[0].upper()}",
                        "drug_name": rule["drug_name"],
                        "severity": "HIGH",
                        "clinical_requirement": rule["clinical_requirement"],
                        "legal_basis": rule["legal_basis"],
                        "detected_icd10_codes": codes,
                        "detail": (
                            f"Obat restriksi Fornas '{rule['drug_name']}' diberikan tanpa kode diagnosis indikasi yang sesuai "
                            f"({', '.join(rule['allowed_icd10_patterns'])}). Syarat wajib: {rule['clinical_requirement']}"
                        ),
                    }
                )

    return {
        "fornas_compliant": len(flags) == 0,
        "restricted_drugs_detected": matched_drugs,
        "total_fornas_flags": len(flags),
        "flags": flags,
    }


def _parse_dt(val: Any) -> Optional[date]:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, date):
        return val
    try:
        return datetime.fromisoformat(str(val).strip()[:10]).date()
    except Exception:
        return None


def check_30d_readmission(
    pstv01: Optional[int] = None,
    encounters: Optional[List[Dict[str, Any]]] = None,
    window_days: int = 30,
) -> Dict[str, Any]:
    """
    Detect <30-day same-patient readmission across submitted encounters and/or
    live bpjs_fkrtl_all inpatient visits by participant ID (PSTV01).
    """
    normalized: List[Dict[str, Any]] = []
    source = "submitted_encounters"

    if encounters:
        for e in encounters:
            adm = _parse_dt(e.get("admission_date"))
            dis = _parse_dt(e.get("discharge_date")) or adm
            if adm:
                normalized.append(
                    {
                        "claim_id": str(e.get("claim_id", "ENC")),
                        "admission_date": adm,
                        "discharge_date": dis,
                        "primary_icd10": _normalize_icd(e.get("primary_icd10")),
                        "is_inpatient": bool(e.get("is_inpatient", True)),
                    }
                )

    warehouse_rows_found = 0
    if pstv01 is not None and not encounters:
        try:
            from app.engine.duckdb_analytics import duckdb_engine

            con = duckdb_engine.con
            if con is not None:
                rows = con.execute(
                    """
                    SELECT FKL02, FKL03, FKL04, FKL15A, FKL10
                    FROM bpjs_fkrtl_all
                    WHERE PSTV01 = ? AND FKL03 IS NOT NULL
                    ORDER BY FKL03 ASC
                    LIMIT 50
                    """,
                    [int(pstv01)],
                ).fetchall()
                source = "bpjs_fkrtl_all"
                warehouse_rows_found = len(rows)
                for r in rows:
                    adm = _parse_dt(r[1])
                    dis = _parse_dt(r[2]) or adm
                    if adm:
                        normalized.append(
                            {
                                "claim_id": str(r[0] or "FKRTL"),
                                "admission_date": adm,
                                "discharge_date": dis,
                                "primary_icd10": _normalize_icd(r[3]),
                                "is_inpatient": int(r[4] or 1) == 2,
                            }
                        )
        except Exception as exc:
            logger.debug("Readmission DuckDB lookup skipped: %s", exc)

    # Focus readmission checks on inpatient episodes (FKL10=2) if present, else all
    inpatient_eps = [e for e in normalized if e["is_inpatient"]]
    target_eps = inpatient_eps if len(inpatient_eps) >= 2 else normalized
    target_eps.sort(key=lambda x: x["admission_date"])

    alerts: List[Dict[str, Any]] = []
    for i in range(1, len(target_eps)):
        prev_e = target_eps[i - 1]
        curr_e = target_eps[i]
        gap = (curr_e["admission_date"] - prev_e["discharge_date"]).days
        if 0 <= gap <= window_days:
            same_category = (
                bool(prev_e["primary_icd10"])
                and bool(curr_e["primary_icd10"])
                and prev_e["primary_icd10"][:3] == curr_e["primary_icd10"][:3]
            )
            alerts.append(
                {
                    "rule_code": "RUL-READMISSION-30D",
                    "prior_claim_id": prev_e["claim_id"],
                    "readmission_claim_id": curr_e["claim_id"],
                    "prior_discharge": prev_e["discharge_date"].isoformat(),
                    "readmission_date": curr_e["admission_date"].isoformat(),
                    "gap_days": gap,
                    "prior_icd10": prev_e["primary_icd10"],
                    "readmission_icd10": curr_e["primary_icd10"],
                    "same_diagnosis_prefix": same_category,
                    "severity": "CRITICAL" if same_category or gap <= 7 else "HIGH",
                    "detail": (
                        f"Readmisi dalam {gap} hari pasca pulang ({prev_e['claim_id']} -> {curr_e['claim_id']})"
                        + (f" dengan kelompok diagnosis serupa ({curr_e['primary_icd10'][:3]})." if same_category else ".")
                    ),
                }
            )

    return {
        "source": source,
        "pstv01": pstv01,
        "episodes_evaluated": len(target_eps),
        "warehouse_rows_found": warehouse_rows_found,
        "window_days": window_days,
        "has_readmission_alert": len(alerts) > 0,
        "alerts": alerts,
    }
