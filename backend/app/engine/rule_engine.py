"""
ClaimTrace Deep Clinical & Regulatory Rules Engine
"Mempertebal Lapisan": Real Multi-Layer Validation across PNPK, Fornas,
Readmission Windows, Procedure Bundling, and Physician Workload Caps.
Adheres to Permenkes No. 26/2021, Perpres No. 82/2018, & Kepmenkes Standar Pelayanan Kedokteran.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, date
import hashlib

class RuleViolation:
    def __init__(
        self,
        rule_code: str,
        rule_name: str,
        severity: str, # "CRITICAL" | "HIGH" | "MODERATE" | "LOW"
        category: str, # "MEDICAL_NECESSITY" | "FORNAS_RESTRICTION" | "UPCODING" | "UNBUNDLING" | "READMISSION" | "DPJP_CAPACITY"
        description: str,
        legal_basis: str,
        potential_saving_rupiah: float,
        recommended_action: str
    ):
        self.rule_code = rule_code
        self.rule_name = rule_name
        self.severity = severity
        self.category = category
        self.description = description
        self.legal_basis = legal_basis
        self.potential_saving_rupiah = potential_saving_rupiah
        self.recommended_action = recommended_action

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_code": self.rule_code,
            "rule_name": self.rule_name,
            "severity": self.severity,
            "category": self.category,
            "description": self.description,
            "legal_basis": self.legal_basis,
            "potential_saving_rupiah": self.potential_saving_rupiah,
            "recommended_action": self.recommended_action
        }


class DeepClaimAuditEngine:
    """
    Evaluates claims against deep empirical rules before payment authorization (Pra-Bayar).
    """

    @staticmethod
    def audit_claim_clinical_validity(claim_data: Dict[str, Any]) -> Dict[str, Any]:
        violations: List[RuleViolation] = []
        cbg_code = str(claim_data.get("ina_cbg_code", "")).strip().upper()
        tariff = float(claim_data.get("tariff_rupiah", 0.0) or claim_data.get("claim_amount", 0.0) or 0.0)
        clinical_notes = str(claim_data.get("clinical_notes", "")).lower()
        diagnosis_primer = str(claim_data.get("diagnosis_primer", "")).upper()
        procedure_codes = [str(p).upper() for p in claim_data.get("procedure_codes", [])]
        dpjp_patient_count = int(claim_data.get("dpjp_daily_patient_count", 0))
        days_since_prior = claim_data.get("days_since_prior_discharge")

        # ----------------------------------------------------------------------
        # 1. PNPK Katarak & Bedah Mata (C-4-13-I / C-4-13-II / C-4-13-III)
        # ----------------------------------------------------------------------
        if cbg_code.startswith("C-4-13") or "katarak" in clinical_notes:
            # Check simultaneous bilateral surgery
            is_bilateral = ("bilateral" in clinical_notes or "od dan os" in clinical_notes or "kedua mata" in clinical_notes)
            if is_bilateral:
                violations.append(RuleViolation(
                    rule_code="RUL-PNPK-KATARAK-01",
                    rule_name="Bedah Katarak Bilateral Simultan",
                    severity="CRITICAL",
                    category="MEDICAL_NECESSITY",
                    description="Operasi fakoemulsifikasi bilateral pada hari yang sama dilarang dalam PNPK JKN demi pencegahan risiko endoftalmitis simultan.",
                    legal_basis="Kepmenkes Standar Pelayanan Kedokteran Mata & SE BPJS No. 2/2020",
                    potential_saving_rupiah=tariff * 0.5,
                    recommended_action="HOLD_BAKB_SPLIT_EPISODE"
                ))

            # Check visual acuity threshold (visus < 6/18)
            if "visus 6/6" in clinical_notes or "visus 6/12" in clinical_notes or "visus normal" in clinical_notes:
                violations.append(RuleViolation(
                    rule_code="RUL-PNPK-KATARAK-02",
                    rule_name="Indikasi Medis Visus Katarak Tidak Terpenuhi",
                    severity="HIGH",
                    category="MEDICAL_NECESSITY",
                    description="Visus pasien tercatat >= 6/18. Kriteria penjaminan fakoemulsifikasi BPJS Kesehatan mensyaratkan visus < 6/18.",
                    legal_basis="Panduan Klinis PERDAMI & Kepmenkes No. HK.01.07/MENKES/514/2015",
                    potential_saving_rupiah=tariff,
                    recommended_action="REJECT_CLAIM_OR_CLARIFY"
                ))

        # ----------------------------------------------------------------------
        # 2. Formularium Nasional: Restriksi Albumin Human 20%/25%
        # ----------------------------------------------------------------------
        if "albumin" in clinical_notes or any("ALB" in p for p in procedure_codes):
            has_severe_hypo = ("kadar < 2.5" in clinical_notes or "albumin 1." in clinical_notes or "albumin 2." in clinical_notes)
            if not has_severe_hypo and ("albumin 3" in clinical_notes or "kadar normal" in clinical_notes or "profilaksis" in clinical_notes):
                violations.append(RuleViolation(
                    rule_code="RUL-FORNAS-ALBUMIN-01",
                    rule_name="Pelanggaran Restriksi Formularium Nasional Albumin",
                    severity="HIGH",
                    category="FORNAS_RESTRICTION",
                    description="Pemberian sediaan Albumin Human 20%/25% hanya dijamin apabila kadar serum albumin pasien < 2.5 g/dL disertai indikasi klinis kritis (ICU/asites masif/luka bakar berat).",
                    legal_basis="Kepmenkes KMK No. HK.01.07/MENKES/200/2020 tentang Formularium Nasional",
                    potential_saving_rupiah=min(tariff * 0.35, 9750000.0),
                    recommended_action="ADJUST_TARIFF_EXCLUDE_ALBUMIN"
                ))

        # ----------------------------------------------------------------------
        # 3. Koding INA-CBG: Sepsis Neonatal Berat Tanpa Kultur (P-8-09-III)
        # ----------------------------------------------------------------------
        if cbg_code == "P-8-09-III":
            has_positive_culture = ("kultur positif" in clinical_notes or "bakteremia terkonfirmasi" in clinical_notes)
            has_negative_culture = ("kultur negatif" in clinical_notes or "tanpa kultur" in clinical_notes or "kultur darah (-)" in clinical_notes)
            if has_negative_culture and not has_positive_culture:
                violations.append(RuleViolation(
                    rule_code="RUL-UPCODING-SEPSIS-03",
                    rule_name="Upcoding Keparahan Tingkat III Sepsis Tanpa Konfirmasi Kultur",
                    severity="CRITICAL",
                    category="UPCODING",
                    description="Klaim Sepsis Neonatal Berat Tingkat III (P-8-09-III) diajukan tanpa bukti kultur darah positif atau bukti kegagalan organ multisistem.",
                    legal_basis="Permenkes No. 26/2021 Pedoman Anti-Fraud & Kaidah Koding INA-CBG Kemenkes",
                    potential_saving_rupiah=tariff - 14200000.0, # Downgrade to P-8-09-I
                    recommended_action="DOWNGRADE_SEVERITY_LEVEL_1"
                ))

        # ----------------------------------------------------------------------
        # 4. Unplanned Readmission < 30 Hari untuk Diagnosis Serupa
        # ----------------------------------------------------------------------
        if days_since_prior is not None and isinstance(days_since_prior, (int, float)):
            if 0 < days_since_prior <= 30:
                violations.append(RuleViolation(
                    rule_code="RUL-READMISSION-30D",
                    rule_name="Admisi Ulang Tidak Terencana < 30 Hari (Readmission)",
                    severity="HIGH",
                    category="READMISSION",
                    description=f"Pasien diadmisi kembali dalam kurun waktu {int(days_since_prior)} hari pasca pulang. Terindikasi pelepasan dini (premature discharge) atau pemecahan episode.",
                    legal_basis="Pasal 76 Perpres No. 82/2018 & Permenkes No. 26/2021",
                    potential_saving_rupiah=tariff * 0.4,
                    recommended_action="CONSOLIDATE_EPISODE_AUDIT"
                ))

        # ----------------------------------------------------------------------
        # 5. Batas Kapasitas Layanan DPJP (Permenkes 14/2021)
        # ----------------------------------------------------------------------
        if dpjp_patient_count > 40:
            violations.append(RuleViolation(
                rule_code="RUL-DPJP-CAPACITY-40",
                rule_name="Pelanggaran Batas Beban Pelayanan Harian DPJP",
                severity="HIGH",
                category="DPJP_CAPACITY",
                description=f"DPJP tercatat melayani {dpjp_patient_count} pasien rawat jalan pada hari yang sama (melebihi ambang batas mutu profesi 40 pasien/hari).",
                legal_basis="Permenkes No. 14 Tahun 2021 tentang Standar Kegiatan Usaha dan Produk Pelayanan Kesehatan",
                potential_saving_rupiah=tariff * 0.25,
                recommended_action="NOTIFY_KOMITE_MEDIK_CLARIFICATION"
            ))

        # ----------------------------------------------------------------------
        # 6. Unbundling Procedure Detection
        # ----------------------------------------------------------------------
        if len(procedure_codes) >= 2:
            # Example: Laparoscopy (54.21) + Adhesiolysis (54.59)
            if "54.21" in procedure_codes and "54.59" in procedure_codes:
                violations.append(RuleViolation(
                    rule_code="RUL-UNBUNDLING-5421-5459",
                    rule_name="Unbundling Tindakan Laparoskopi & Adhesiolisis",
                    severity="HIGH",
                    category="UNBUNDLING",
                    description="Tindakan adhesiolisis peritoneal merupakan bagian tak terpisahkan dari prosedur laparoskopi elektif dan tidak boleh ditagihkan terpisah.",
                    legal_basis="Buku Panduan Verifikasi Klaim INA-CBG & Permenkes No. 26/2021",
                    potential_saving_rupiah=tariff * 0.3,
                    recommended_action="BUNDLE_INTO_PRIMARY_CBG"
                ))

        # ----------------------------------------------------------------------
        # 7. VClaim & SEP Compliance: Deteksi SEP Ganda (SE BPJS 2024)
        # ----------------------------------------------------------------------
        has_dup_sep = bool(claim_data.get("has_duplicate_sep") or "sep ganda" in clinical_notes or claim_data.get("is_duplicate_sep"))
        if has_dup_sep:
            violations.append(RuleViolation(
                rule_code="RUL-VCLAIM-SEP-DUPLICATE",
                rule_name="Surat Eligibilitas Peserta (SEP) Ganda Aktif",
                severity="CRITICAL",
                category="VCLAIM_SEP_COMPLIANCE",
                description="Ditemukan lebih dari satu SEP aktif pada episode perawatan yang beririsan untuk peserta yang sama.",
                legal_basis="SE Direksi BPJS Kesehatan 2024 & Panduan Integrasi VClaim SIMRS (PMK 24/2022)",
                potential_saving_rupiah=tariff,
                recommended_action="REJECT_DUPLICATE_SEP"
            ))

        # ----------------------------------------------------------------------
        # 8. Kesesuaian Hak Kelas Rawat Inap (Perpres 82/2018 & PMK 3/2023)
        # ----------------------------------------------------------------------
        hak_kelas = claim_data.get("hak_kelas")
        kelas_rawat = claim_data.get("kelas_rawat")
        naik_kelas_approved = claim_data.get("naik_kelas_approved", False)
        if hak_kelas and kelas_rawat and str(hak_kelas) != str(kelas_rawat) and not naik_kelas_approved:
            violations.append(RuleViolation(
                rule_code="RUL-CLASS-MISMATCH-UNAPPROVED",
                rule_name="Ketidaksesuaian Kelas Rawat Inap Tanpa Persetujuan",
                severity="HIGH",
                category="CLASS_ENTITLEMENT",
                description=f"Ruang perawatan yang ditagihkan (Kelas {kelas_rawat}) melebihi hak kepesertaan (Kelas {hak_kelas}) tanpa kelengkapan bukti persetujuan selisih biaya penjaminan.",
                legal_basis="Pasal 51 Perpres No. 82/2018 & PMK No. 3/2023 tentang Standar Tarif Pelayanan Kesehatan JKN",
                potential_saving_rupiah=tariff * 0.2,
                recommended_action="ADJUST_TARIFF_TO_ENTITLED_CLASS"
            ))

        # ----------------------------------------------------------------------
        # 9. Rekonsiliasi RME: Inkonsistensi Koding Resume Medis vs SOAP IGD (PMK 24/2022)
        # ----------------------------------------------------------------------
        has_soap_mismatch = bool(claim_data.get("resume_soap_discrepancy") or "soap igd tidak sinkron" in clinical_notes or "inkonsistensi soap" in clinical_notes)
        if has_soap_mismatch:
            violations.append(RuleViolation(
                rule_code="RUL-RESUME-UNSYNC-SOAP",
                rule_name="Inkonsistensi Resume Medis dengan Catatan SOAP IGD",
                severity="HIGH",
                category="CLINICAL_DOCUMENTATION",
                description="Diagnosis primer pada resume medis elektronik tidak didukung oleh temuan pemeriksaan fisik dan assessment pada catatan SOAP IGD.",
                legal_basis="PMK No. 24/2022 tentang Rekam Medis Elektronik & Kaidah Koding ICD-10 Kemenkes",
                potential_saving_rupiah=tariff * 0.35,
                recommended_action="CLARIFICATION_DPJP_REQUIRED"
            ))

        total_potential_saving = sum(v.potential_saving_rupiah for v in violations)
        is_compliant = len(violations) == 0

        # Suggested Action Plan
        if any(v.severity == "CRITICAL" for v in violations):
            final_recommendation = "HOLD_BAKB_SPECIAL_AUDIT"
        elif any(v.severity == "HIGH" for v in violations):
            final_recommendation = "CLARIFICATION_SP1_SCHEDULED"
        elif not is_compliant:
            final_recommendation = "ADMINISTRATIVE_CORRECTION"
        else:
            final_recommendation = "APPROVE_LANE_GREEN"

        audit_payload = {
            "claim_id": claim_data.get("claim_id", "CLM-UNKNOWN"),
            "is_compliant": is_compliant,
            "total_violations": len(violations),
            "highest_severity": max([v.severity for v in violations], default="NONE"),
            "total_potential_saving_rupiah": total_potential_saving,
            "final_recommendation": final_recommendation,
            "violations": [v.to_dict() for v in violations],
            "audit_timestamp": datetime.now().isoformat()
        }

        # Generate formal BAKB (Berita Acara Kelayakan Berkas) decision package
        audit_payload["bakb_package"] = DeepClaimAuditEngine.generate_bakb_decision_letter(claim_data, audit_payload)
        
        # Generate evidence-traceable dossier adhering to scientific-writing & database-lookup standards
        audit_payload["evidence_dossier"] = DeepClaimAuditEngine.generate_evidence_dossier(claim_data, audit_payload)
        return audit_payload

    @staticmethod
    def generate_bakb_decision_letter(claim_data: Dict[str, Any], audit_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates formal BPJS Kesehatan BAKB Decision Package
        adhering to Payer Prior-Auth Review & Decision Standards.
        """
        claim_id = audit_result.get("claim_id", "CLM-UNKNOWN")
        is_compliant = audit_result.get("is_compliant", False)
        violations = audit_result.get("violations", [])
        
        now = datetime.now()
        date_str = now.strftime("%d/%m/%Y")
        
        if is_compliant:
            decision_status = "LAYAK_BAYAR"
            letter_type = "SURAT_KEPUTUSAN_PERSETUJUAN_KLAIM"
            title = "BERITA ACARA KELAYAKAN BERKAS (BAKB) - KLAIM DISETUJUI"
            rationale = "Seluruh kriteria penjaminan medis, restriksi Formularium Nasional, dan PNPK terpenuhi tanpa temuan anomali klinis."
        elif any(v.get("severity") == "CRITICAL" for v in violations):
            decision_status = "TIDAK_LAYAK_BAYAR"
            letter_type = "SURAT_PENOLAKAN_KLAIM_FRAUD_PREVENTION"
            title = "BERITA ACARA KELAYAKAN BERKAS (BAKB) - PENOLAKAN KLAIM"
            rationale = "; ".join([f"[{v.get('rule_code')}] {v.get('rule_name')}: {v.get('description')}" for v in violations])
        else:
            decision_status = "PENDING_KLARIFIKASI"
            letter_type = "SURAT_PERMINTAAN_KLARIFIKASI_MEDIS"
            title = "BERITA ACARA KELAYAKAN BERKAS (BAKB) - KLARIFIKASI DOKUMEN"
            rationale = "; ".join([f"[{v.get('rule_code')}] {v.get('rule_name')}: {v.get('description')}" for v in violations])

        letter_content = f"""================================================================================
BPJS KESEHATAN · SISTEM PENGAWASAN KLAIM PRA-BAYAR (CLAIMTRACE JKN)
{title}
Nomor Surat : BAKB/{now.strftime('%Y%m%d')}/{claim_id}
Tanggal     : {date_str}
================================================================================

Kepada Yth.
Direktur / Tim Pengendali Fraud Rumah Sakit
Faskes      : {claim_data.get('faskes_name', 'Faskes Rujukan Lanjutan')}

Perihal: Hasil Evaluasi Medis dan Kelayakan Berkas Klaim Pra-Bayar JKN
- Nomor Berkas Klaim : {claim_id}
- Nama Peserta       : {claim_data.get('patient_name', 'Peserta BPJS Kesehatan')}
- Nomor Kartu BPJS   : {claim_data.get('bpjs_card_no', '-')}
- Kode INA-CBG       : {claim_data.get('ina_cbg_code', '-')}
- Potensi Efisiensi  : Rp {audit_result.get('total_potential_saving_rupiah', 0):,.2f}

STATUS VERIFIKASI   : [{decision_status}]
Rekomendasi Tindakan: {audit_result.get('final_recommendation', '-')}

DASAR PERTIMBANGAN & TEMUAN AUDIT:
{rationale}
"""
        return {
            "bakb_number": f"BAKB/{now.strftime('%Y%m%d')}/{claim_id}",
            "letter_type": letter_type,
            "decision_status": decision_status,
            "title": title,
            "rationale": rationale,
            "letter_content": letter_content.strip()
        }

    @staticmethod
    def generate_evidence_dossier(claim_data: Dict[str, Any], audit_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates an evidence-traceable clinical audit dossier adhering to
        Scientific Agent Skills (scientific-writing & database-lookup) standards.
        Ensures cryptographic tamper-evidence, explicit source manifests,
        and uncertainty ratings for payer audit compliance.
        """
        claim_id = str(audit_result.get("claim_id", "CLM-UNKNOWN"))
        raw_fingerprint_str = f"{claim_id}|{claim_data.get('patient_name', '')}|{claim_data.get('ina_cbg_code', '')}|{claim_data.get('tariff_rupiah', 0)}|{claim_data.get('clinical_notes', '')}"
        fingerprint_hash = hashlib.sha256(raw_fingerprint_str.encode("utf-8")).hexdigest()

        violations = audit_result.get("violations", [])
        evidence_manifest: List[Dict[str, Any]] = []

        for idx, v in enumerate(violations, start=1):
            evidence_id = f"E{idx:03d}"
            rule_code = v.get("rule_code", "RUL-GENERIC")
            category = v.get("category", "CLINICAL_AUDIT")
            severity = v.get("severity", "MODERATE")
            
            # Map uncertainty and verification status from evidence rigor
            if severity == "CRITICAL":
                uncertainty = "low"
                verification_status = "CONFIRMED_ANOMALY"
            elif severity == "HIGH":
                uncertainty = "moderate"
                verification_status = "PENDING_CLARIFICATION"
            else:
                uncertainty = "moderate"
                verification_status = "FLAGGED_REVIEW"

            evidence_manifest.append({
                "evidence_id": evidence_id,
                "rule_code": rule_code,
                "category": category,
                "finding": v.get("description", ""),
                "authoritative_source": v.get("legal_basis", "Standar Verifikasi Klaim BPJS"),
                "verification_status": verification_status,
                "uncertainty": uncertainty,
                "potential_saving_rupiah": v.get("potential_saving_rupiah", 0.0),
                "remedial_action": v.get("recommended_action", "REVIEW")
            })

        return {
            "dossier_id": f"DOS-{claim_id}-{fingerprint_hash[:8].upper()}",
            "claim_fingerprint_sha256": fingerprint_hash,
            "evidence_count": len(evidence_manifest),
            "evidence_manifest": evidence_manifest,
            "analysis_intent": "confirmatory_payer_audit",
            "uncertainty_aggregate": "low" if any(v.get("severity") == "CRITICAL" for v in violations) else "moderate",
            "governance_notice": "DRAFT — EVIDENCE-BASED AUDIT DOSSIER — BPJS VERIFIKATOR AUTHORIZED SIGN-OFF REQUIRED",
            "standards_compliance": [
                "UU PDP No. 27/2022 (Data Protection)",
                "Permenkes No. 26/2021 (Pedoman Pencegahan & Penanganan Fraud)",
                "NIST CSF 2.0 PR.DS-01 (Data Integrity & Provenance)"
            ]
        }


# Singleton engine instance
deep_rules_engine = DeepClaimAuditEngine()
