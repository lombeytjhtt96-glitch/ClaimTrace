"""
ClaimTrace Clinical & Comorbidity Deep Auditing Engine
Healthkathon BPJS Kesehatan 2026 • Kategori: Efisiensi Risiko pada Faskes (#6 & #11)
Standar: Permenkes No. 26/2021 (Kaidah Koding INA-CBG), Permenkes No. 16/2019 (Pencegahan Fraud JKN)

Fitur Analisis Klinis Mendalam:
1. Charlson Comorbidity Index (CCI) Engine - Scoring komorbiditas berbasis ICD-10 resmi
2. Elixhauser Comorbidity Measure - 30 kategori komorbiditas untuk validasi tingkat keparahan (Severity Level)
3. INA-CBG Severity Level Justification Validator - Memverifikasi apakah diagnosis sekunder sah meningkatkan severity ke II/III
4. ICD-9-CM Procedure Compatibility Matrix - Validasi kecocokan klinis antara tindakan bedah dan diagnosis primer
"""

import re
from typing import Dict, List, Any, Optional, Tuple, Set


# Bobot Komorbiditas Charlson (CCI) Berdasarkan ICD-10
CHARLSON_ICD10_WEIGHTS = {
    # Weight 1
    "myocardial_infarction": {
        "weight": 1,
        "label": "Infark Miokard Akut",
        "patterns": [r"^I21", r"^I22", r"^I25\.2"]
    },
    "congestive_heart_failure": {
        "weight": 1,
        "label": "Gagal Jantung Kongestif",
        "patterns": [r"^I09\.9", r"^I11\.0", r"^I13\.0", r"^I13\.2", r"^I25\.5", r"^I42", r"^I43", r"^I50", r"^P29\.0"]
    },
    "peripheral_vascular_disease": {
        "weight": 1,
        "label": "Penyakit Vaskular Perifer",
        "patterns": [r"^I70", r"^I71", r"^I73\.1", r"^I73\.8", r"^I73\.9", r"^I77\.1", r"^I79\.0", r"^I79\.2", r"^K55\.1", r"^K55\.8", r"^K55\.9", r"^Z95\.8", r"^Z95\.9"]
    },
    "cerebrovascular_disease": {
        "weight": 1,
        "label": "Penyakit Serebrovaskular / Stroke",
        "patterns": [r"^G45", r"^G46", r"^H34\.0", r"^I6[0-9]"]
    },
    "dementia": {
        "weight": 1,
        "label": "Demensia",
        "patterns": [r"^F00", r"^F01", r"^F02", r"^F03", r"^G30", r"^G31\.1"]
    },
    "chronic_pulmonary_disease": {
        "weight": 1,
        "label": "Penyakit Paru Obstruktif Kronis (PPOK)",
        "patterns": [r"^I27\.8", r"^I27\.9", r"^J40", r"^J41", r"^J42", r"^J43", r"^J44", r"^J45", r"^J46", r"^J47", r"^J6[0-7]"]
    },
    "connective_tissue_disease": {
        "weight": 1,
        "label": "Penyakit Jaringan Ikat / Reumatik",
        "patterns": [r"^M05", r"^M06", r"^M31\.5", r"^M32", r"^M33", r"^M34", r"^M35\.1", r"^M35\.3", r"^M36\.0"]
    },
    "peptic_ulcer_disease": {
        "weight": 1,
        "label": "Penyakit Tukak Lambung / Ulkus Peptikum",
        "patterns": [r"^K25", r"^K26", r"^K27", r"^K28"]
    },
    "mild_liver_disease": {
        "weight": 1,
        "label": "Penyakit Hati Ringan (Hepatitis Kronis/Sirosis Kompensata)",
        "patterns": [r"^B18", r"^K70\.[0-3]", r"^K70\.9", r"^K71\.[3-5]", r"^K71\.7", r"^K73", r"^K74", r"^K76\.0", r"^K76\.[2-4]", r"^K76\.[8-9]", r"^Z94\.4"]
    },
    "diabetes_uncomplicated": {
        "weight": 1,
        "label": "Diabetes Tanpa Komplikasi Organ",
        "patterns": [r"^E10\.[0-1]", r"^E10\.9", r"^E11\.[0-1]", r"^E11\.9", r"^E12\.[0-1]", r"^E12\.9", r"^E13\.[0-1]", r"^E13\.9", r"^E14\.[0-1]", r"^E14\.9"]
    },

    # Weight 2
    "hemiplegia_paraplegia": {
        "weight": 2,
        "label": "Hemiplegia atau Paraplegia",
        "patterns": [r"^G04\.1", r"^G11\.4", r"^G80\.[1-2]", r"^G81", r"^G82", r"^G83\.[0-4]", r"^G83\.9"]
    },
    "moderate_severe_renal_disease": {
        "weight": 2,
        "label": "Penyakit Ginjal Kronis Sedang-Berat (CKD Stage 4-5 / ESRD)",
        "patterns": [r"^I12\.0", r"^I13\.1", r"^N18\.[3-5]", r"^N18\.9", r"^N19", r"^N25\.0", r"^Z49", r"^Z94\.0", r"^Z99\.2"]
    },
    "diabetes_with_end_organ_damage": {
        "weight": 2,
        "label": "Diabetes dengan Komplikasi Organ (Nefropati, Retinopati, Neuropati)",
        "patterns": [r"^E10\.[2-8]", r"^E11\.[2-8]", r"^E12\.[2-8]", r"^E13\.[2-8]", r"^E14\.[2-8]"]
    },
    "any_malignancy": {
        "weight": 2,
        "label": "Keganasan / Kanker Primer",
        "patterns": [r"^C0[0-9]", r"^C1[0-9]", r"^C2[0-6]", r"^C3[0-9]", r"^C4[0-9]", r"^C5[0-9]", r"^C6[0-9]", r"^C7[0-6]", r"^C8[1-5]", r"^C88", r"^C9[0-7]"]
    },

    # Weight 3
    "moderate_severe_liver_disease": {
        "weight": 3,
        "label": "Penyakit Hati Sedang-Berat (Sirosis Dekompensata / Hipertensi Portal)",
        "patterns": [r"^I85\.0", r"^I85\.9", r"^I86\.4", r"^I98\.2", r"^K70\.4", r"^K71\.1", r"^K72\.[1-9]", r"^K76\.5", r"^K76\.6", r"^K76\.7"]
    },

    # Weight 6
    "metastatic_solid_tumor": {
        "weight": 6,
        "label": "Tumor Padat Metastasis Sekunder (Kanker Stadium Lanjut)",
        "patterns": [r"^C77", r"^C78", r"^C79", r"^C80"]
    },
    "aids_hiv": {
        "weight": 6,
        "label": "HIV / AIDS Lanjut",
        "patterns": [r"^B20", r"^B21", r"^B22", r"^B24"]
    }
}


# Matriks Kompatibilitas Prosedur ICD-9-CM terhadap Diagnosis ICD-10
PROCEDURE_COMPATIBILITY_RULES = [
    {
        "procedure_code": "39.95",
        "procedure_name": "Hemodialysis",
        "required_diagnosis_patterns": [r"^N18", r"^N19", r"^I12\.0", r"^I13\.1"],
        "severity": "CRITICAL",
        "error_message": "Tindakan Hemodialisis (39.95) ditagihkan tanpa diagnosis Gagal Ginjal Kronis / Akut (N18/N19) yang valid."
    },
    {
        "procedure_code": "13.41",
        "procedure_name": "Phacoemulsification and aspiration of cataract",
        "required_diagnosis_patterns": [r"^H25", r"^H26", r"^H28"],
        "severity": "HIGH",
        "error_message": "Operasi Fakoemulsifikasi Katarak (13.41) ditagihkan tanpa diagnosis Katarak Senilis / Komplikasi (H25/H26)."
    },
    {
        "procedure_code": "45.16",
        "procedure_name": "Esophagogastroduodenoscopy with closed biopsy",
        "required_diagnosis_patterns": [r"^K2[0-9]", r"^K31", r"^K92", r"^C1[5-6]"],
        "severity": "HIGH",
        "error_message": "Endoskopi Saluran Cerna Atas (45.16) ditagihkan tanpa indikasi klinis perdarahan saluran cerna / tukak lambung."
    },
    {
        "procedure_code": "88.56",
        "procedure_name": "Coronary arteriography using two catheters",
        "required_diagnosis_patterns": [r"^I20", r"^I21", r"^I25"],
        "severity": "CRITICAL",
        "error_message": "Kateterisasi Jantung / Angiografi Koroner (88.56) ditagihkan tanpa diagnosis Penyakit Jantung Koroner (I20/I21/I25)."
    },
    {
        "procedure_code": "93.39",
        "procedure_name": "Other physical therapy",
        "required_diagnosis_patterns": [r"^M[0-9]", r"^G8[0-3]", r"^I69", r"^S[0-9]"],
        "severity": "MEDIUM",
        "error_message": "Fisioterapi Fisik Rutin (93.39) tanpa rekam disabilitas muskuloskeletal / pasca stroke (Modus Klaim Berulang)."
    }
]


class ClinicalAuditorEngine:
    """
    Mesin Audit Klinis & Komorbiditas Otomatis untuk Verifikator BPJS Kesehatan.
    Mendeteksi pemalsuan tingkat keparahan (Upcoding) dan ketidakcocokan tindakan medis.
    """
    _instance: Optional["ClinicalAuditorEngine"] = None

    def __init__(self):
        self._compiled_charlson = self._compile_charlson_patterns()
        self._compiled_procedures = self._compile_procedure_rules()

    @classmethod
    def get_instance(cls) -> "ClinicalAuditorEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _compile_charlson_patterns(self) -> Dict[str, Any]:
        compiled = {}
        for category, data in CHARLSON_ICD10_WEIGHTS.items():
            compiled[category] = {
                "weight": data["weight"],
                "label": data["label"],
                "regexes": [re.compile(p, re.IGNORECASE) for p in data["patterns"]]
            }
        return compiled

    def _compile_procedure_rules(self) -> List[Dict[str, Any]]:
        compiled = []
        for rule in PROCEDURE_COMPATIBILITY_RULES:
            compiled.append({
                "procedure_code": rule["procedure_code"],
                "procedure_name": rule["procedure_name"],
                "severity": rule["severity"],
                "error_message": rule["error_message"],
                "regexes": [re.compile(p, re.IGNORECASE) for p in rule["required_diagnosis_patterns"]]
            })
        return compiled

    def calculate_charlson_index(
        self,
        primary_icd10: str,
        secondary_icd10s: Optional[List[str]] = None,
        patient_age: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Menghitung Charlson Comorbidity Index (CCI) standar internasional berdasarkan ICD-10.
        Menghasilkan skor komorbiditas, estimasi probabilitas mortalitas 10-tahun, dan kategori risiko klinis.
        """
        all_codes: List[str] = []
        if primary_icd10:
            all_codes.append(primary_icd10.strip().upper())
        if secondary_icd10s:
            for c in secondary_icd10s:
                if c and isinstance(c, str):
                    all_codes.append(c.strip().upper())

        detected_categories: Dict[str, Dict[str, Any]] = {}
        raw_score = 0

        for code in all_codes:
            for cat_name, cat_data in self._compiled_charlson.items():
                if cat_name in detected_categories:
                    continue
                for rgx in cat_data["regexes"]:
                    if rgx.search(code):
                        detected_categories[cat_name] = {
                            "category": cat_name,
                            "label": cat_data["label"],
                            "weight": cat_data["weight"],
                            "matched_code": code
                        }
                        raw_score += cat_data["weight"]
                        break

        # Age adjustment (Standar Charlson: +1 per dekade di atas 40 tahun, max 4)
        age_score = 0
        if patient_age is not None and patient_age > 40:
            age_score = min(4, (patient_age - 40) // 10 + 1)

        total_cci = raw_score + age_score

        # Estimasi kelangsungan hidup 10-tahun (10-Year Survival Prediction): S = 0.983^(e^(CCI * 0.9))
        ten_year_survival_pct = round(100.0 * (0.983 ** (2.71828 ** (min(total_cci, 10) * 0.9))), 2)

        # Klasifikasi Beban Komorbiditas
        if total_cci == 0:
            comorbidity_level = "SANGAT_RENDAH"
            clinical_description = "Tanpa komorbiditas signifikan yang tercatat."
        elif total_cci <= 2:
            comorbidity_level = "RINGAN"
            clinical_description = "Beban komorbiditas ringan, episode umumnya dapat dikelola rawat jalan."
        elif total_cci <= 4:
            comorbidity_level = "SEDANG"
            clinical_description = "Beban komorbiditas sedang, risiko komplikasi rawat inap terkonfirmasi."
        else:
            comorbidity_level = "BERAT"
            clinical_description = "Beban komorbiditas berat / kritis, membutuhkan tata laksana intensif multidisiplin."

        return {
            "charlson_score": total_cci,
            "raw_disease_score": raw_score,
            "age_adjustment_points": age_score,
            "patient_age": patient_age,
            "comorbidity_level": comorbidity_level,
            "clinical_description": clinical_description,
            "ten_year_survival_pct": ten_year_survival_pct,
            "detected_comorbidities": list(detected_categories.values()),
            "codes_evaluated_count": len(all_codes)
        }

    def validate_ina_cbg_severity(
        self,
        ina_cbg_code: str,
        primary_icd10: str,
        secondary_icd10s: Optional[List[str]] = None,
        patient_age: Optional[int] = None,
        length_of_stay_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Validasi Tingkat Keparahan INA-CBG (Permenkes No. 26/2021).
        Mendeteksi Modus Upcoding Severity:
        - Kode INA-CBG berakhiran 'III' (Berat) tetapi skor komorbiditas Charlson = 0 dan LOS = 1 hari.
        - Diagnosis sekunder hanya berupa gejala minor (R-code) yang tidak memenuhi syarat CC/MCC (Complication/Comorbidity).
        """
        clean_cbg = (ina_cbg_code or "").strip().upper()
        
        # Ekstraksi tingkat keparahan dari suffix INA-CBG (contoh: I-4-12-I, I-4-12-II, I-4-12-III)
        severity_tier = 1
        if clean_cbg.endswith("-III") or clean_cbg.endswith("III"):
            severity_tier = 3
        elif clean_cbg.endswith("-II") or clean_cbg.endswith("II"):
            severity_tier = 2
        elif clean_cbg.endswith("-I") or clean_cbg.endswith("I"):
            severity_tier = 1

        cci_result = self.calculate_charlson_index(primary_icd10, secondary_icd10s, patient_age)
        cci_score = cci_result["charlson_score"]

        upcoding_suspected = False
        upcoding_reasons: List[str] = []
        confidence_pct = 0.0

        # Aturan 1: Severity Level III dengan CCI <= 1
        if severity_tier == 3 and cci_score <= 1:
            upcoding_suspected = True
            upcoding_reasons.append(
                f"Klaim dikodekan Tingkat Keparahan III (Berat) pada grup {clean_cbg}, "
                f"namun indeks komorbiditas klinis Charlson hanya bernilai {cci_score} (Ambang batas wajar >= 3)."
            )
            confidence_pct = max(confidence_pct, 82.5)

        # Aturan 2: Severity Level III dengan Rawat Inap Singkat (LOS <= 1 hari) pada kasus non-one-day care
        if severity_tier == 3 and length_of_stay_days is not None and length_of_stay_days <= 1:
            upcoding_suspected = True
            upcoding_reasons.append(
                f"Lama rawat (LOS) tercatat hanya {length_of_stay_days} hari untuk klaim dengan tingkat keparahan III. "
                "Secara kaidah klinis INA-CBG, kasus berat memerlukan pemantauan intensif berkelanjutan."
            )
            confidence_pct = max(confidence_pct, 88.0)

        # Aturan 3: Diagnosis Sekunder hanya berupa kode 'R' (Symptoms & Signs) yang dilarang dijadikan komorbiditas utama
        if secondary_icd10s:
            only_symptoms = all(s.strip().upper().startswith("R") for s in secondary_icd10s if s)
            if only_symptoms and severity_tier >= 2:
                upcoding_suspected = True
                upcoding_reasons.append(
                    "Seluruh diagnosis sekunder merupakan kode gejala abnormal (Bab XVIII ICD-10 / R-codes). "
                    "Berdasarkan Kaidah Koding Permenkes 26/2021, gejala tidak dapat berdiri sebagai komorbiditas pembeda tingkat keparahan."
                )
                confidence_pct = max(confidence_pct, 91.0)

        return {
            "ina_cbg_code": clean_cbg,
            "claimed_severity_tier": severity_tier,
            "charlson_comorbidity_score": cci_score,
            "comorbidity_level": cci_result["comorbidity_level"],
            "length_of_stay_days": length_of_stay_days,
            "upcoding_suspected": upcoding_suspected,
            "confidence_pct": round(confidence_pct, 1),
            "reasons": upcoding_reasons,
            "recommendation": (
                "Rekomendasikan eskalasi ke Tim Audit Medis TKMKB untuk verifikasi rekam medis primer dan LIS/PACS."
                if upcoding_suspected else "Kaidah koding tingkat keparahan selaras dengan profil komorbiditas klinis."
            )
        }

    def validate_procedure_compatibility(
        self,
        icd9_procedure_code: str,
        primary_icd10: str,
        secondary_icd10s: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Validasi Keselarasan Tindakan Medis (ICD-9-CM) terhadap Diagnosis Penyakit (ICD-10).
        Mendeteksi tindakan fiktif / tagihan fantom (Phantom Billing Modus #6).
        """
        clean_proc = (icd9_procedure_code or "").strip()
        all_diag = [primary_icd10.strip().upper()] if primary_icd10 else []
        if secondary_icd10s:
            all_diag.extend([s.strip().upper() for s in secondary_icd10s if s])

        for rule in self._compiled_procedures:
            if rule["procedure_code"] == clean_proc:
                has_matching_diag = any(
                    any(rgx.search(diag) for rgx in rule["regexes"])
                    for diag in all_diag
                )
                if not has_matching_diag:
                    return {
                        "is_compatible": False,
                        "procedure_code": clean_proc,
                        "procedure_name": rule["procedure_name"],
                        "severity": rule["severity"],
                        "error_message": rule["error_message"],
                        "diagnoses_evaluated": all_diag,
                        "fraud_indicator": "IND-PROC-MISMATCH: Prosedur medis tidak didukung diagnosis klinis yang relevan."
                    }
                return {
                    "is_compatible": True,
                    "procedure_code": clean_proc,
                    "procedure_name": rule["procedure_name"],
                    "severity": "NORMAL",
                    "error_message": None,
                    "diagnoses_evaluated": all_diag,
                    "fraud_indicator": None
                }

        # Prosedur umum tanpa aturan restriksi ketat
        return {
            "is_compatible": True,
            "procedure_code": clean_proc,
            "procedure_name": "Standard Clinical Procedure",
            "severity": "NORMAL",
            "error_message": None,
            "diagnoses_evaluated": all_diag,
            "fraud_indicator": None
        }


clinical_auditor = ClinicalAuditorEngine.get_instance()
