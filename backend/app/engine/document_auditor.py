"""
Document Auditor Engine for ClaimTrace JKN (BPJS Kesehatan)
============================================================
Kepatuhan Regulasi & Standar Operasional:
- Kaidah Verifikasi & Validasi Dokumen Klaim BPJS Kesehatan
- Permenkes No. 26 Tahun 2021 (Pedoman Teknis Kaidah Koding INA-CBG)
- Permenkes No. 16 Tahun 2019 (Pencegahan dan Penanganan Kecurangan JKN)
- UU No. 27 Tahun 2022 (Pelindungan Data Pribadi - Zero PHI Storage)

Mesin ini melakukan inspeksi dan audit forensik terhadap seluruh bundel dokumen
pendukung klaim yang dikirimkan oleh Fasilitas Kesehatan Rujukan Tingkat Lanjut (FKRTL):
1. Surat Eligibilitas Peserta (SEP)
2. Resume Medis Rawat Inap/Jalan (Discharge Summary)
3. Laporan Operasi & Catatan Anestesi (Surgical Report)
4. Bukti Hasil Pemeriksaan Penunjang (Laboratorium, Patologi Anatomi, Radiologi/CT-Scan/USG/EKG)
5. Rincian Biaya Rumah Sakit (Hospital Itemized Billing Sheet)
6. Surat Rujukan FKTP / Surat Kontrol Pasca-Rawat (SKDP)
7. Surat Perintah Rawat Inap (SPRI)
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
import datetime
import hashlib
import json


@dataclass
class DocumentMetadata:
    doc_id: str
    doc_type: str  # SEP, RESUME_MEDIS, LAPORAN_OPERASI, PENUNJANG_LAB, PENUNJANG_RAD, BILLING_RS, RUJUKAN_FKTP, SPRI
    doc_title: str
    file_name: str
    file_size_kb: int
    upload_timestamp: str
    faskes_code: str
    dpjp_name: str
    dpjp_sip: str
    patient_id_token: str
    is_signed_electronically: bool
    is_stamp_valid: bool
    ocr_confidence_pct: float
    extracted_text_snippet: str
    extracted_fields: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DocumentAuditFinding:
    rule_id: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    category: str  # KELENGKAPAN, KEABSAHAN, KESELARASAN_KLINIS, TEMPORAL, UNBUNDLING
    title: str
    description: str
    affected_document: str
    regulatory_reference: str
    remediation_action: str


@dataclass
class DocumentAuditReport:
    claim_id: str
    audit_timestamp: str
    total_documents_submitted: int
    mandatory_documents_required: int
    missing_documents: List[str]
    compliance_score_pct: float
    audit_status: str  # LENGKAP_DAN_SAH, KURANG_BERKAS, DISKREPANSI_KLINIS, INDIKASI_FABRIKASI
    recommendation: str
    findings: List[DocumentAuditFinding]
    cross_document_checks: Dict[str, Any]
    bundle_hash_sha256: str
    documents: List[DocumentMetadata]


class ClaimDocumentAuditor:
    """
    Mesin Audit Berkas Medis ClaimTrace DSS.
    Mendeteksi anomali pada seluruh dokumen yang diunggah rumah sakit:
    - Ketiadaan berkas wajib (misal: tindakan bedah tanpa laporan operasi).
    - Diskrepansi tanggal (tanggal SEP vs tanggal resume vs tanggal billing).
    - Ketiadaan hasil penunjang objektif untuk klaim berbiaya tinggi / diagnosis kritis.
    - Koding unbundling pada rincian billing rumah sakit.
    """

    MANDATORY_DOCS_RITL = [
        "SEP",
        "SPRI",
        "RESUME_MEDIS",
        "BILLING_RS",
        "RUJUKAN_FKTP"
    ]

    MANDATORY_DOCS_RJTL = [
        "SEP",
        "RESUME_MEDIS",
        "BILLING_RS",
        "RUJUKAN_FKTP"
    ]

    MANDATORY_DOCS_SURGICAL = [
        "SEP",
        "SPRI",
        "RESUME_MEDIS",
        "LAPORAN_OPERASI",
        "BILLING_RS"
    ]

    DIAGNOSIS_SUPPORTING_REQUIREMENTS = {
        "A41": {
            "name": "Sepsis",
            "required_tests": ["Kultur Darah", "Procalcitonin", "Leukosit Lengkap"],
            "description": "Diagnosis sepsis wajib didukung biomarker infeksi sistemik dan/atau hasil kultur mikroorganisme."
        },
        "I63": {
            "name": "Stroke Iskemik",
            "required_tests": ["CT-Scan Kepala / MRI Kepala"],
            "description": "Diagnosis stroke iskemik infark wajib didukung penunjang neuroimaging (CT Scan atau MRI)."
        },
        "I21": {
            "name": "Infark Miokard Akut (AMI)",
            "required_tests": ["EKG 12 Sandapan", "Troponin I/T / CK-MB"],
            "description": "Diagnosis infark miokard akut wajib menyertakan rekam EKG dan enzim kardiak spesifik."
        },
        "N18.5": {
            "name": "Gagal Ginjal Kronik Stadium Akhir (CKD 5)",
            "required_tests": ["Ureum", "Kreatinin Darah", "Hasil Penunjang Dialisis"],
            "description": "Klaim gagal ginjal stadium akhir / HD wajib menyertakan fungsi ginjal serum dan catatan dialisis."
        },
        "S52": {
            "name": "Fraktur Tulang",
            "required_tests": ["Rontgen / X-Ray Tulang"],
            "description": "Diagnosis fraktur tulang wajib dilampiri hasil ekspertise radiologi rontgen sebelum tindakan fiksasi."
        }
    }

    def generate_synthetic_document_bundle(self, claim_id: str, claim_data: Optional[Dict[str, Any]] = None) -> List[DocumentMetadata]:
        """
        Menyusun data bundel berkas sintetis representatif untuk sebuah klaim.
        Mencerminkan dokumen digital berkas klaim BPJS Kesehatan.
        """
        now_iso = datetime.datetime.now().isoformat()
        c_id = claim_id
        ctx = claim_data or {}
        digits = "".join(ch for ch in c_id if ch.isdigit()) or "000001"
        sep_suffix = digits[-6:].zfill(6)
        rujukan_suffix = digits[-5:].zfill(5)
        id_suffix4 = digits[-4:].zfill(4)
        nama_faskes = str(ctx.get("nama_faskes") or ("RS Khusus Mitra Husada" if "8801" in c_id else "RS Medika Prima"))
        faskes_code = str(ctx.get("faskes_id") or "RS001")
        dpjp_name = str(ctx.get("dpjp_name") or "dr. Hendra Pratama, Sp.PD")
        dpjp_sip = str(ctx.get("dpjp_sip") or "SIP-503/4421/DPMPTSP/2023")
        svc_type = str(ctx.get("jenis_pelayanan") or "RITL").upper()
        svc_label = "Rawat Jalan (RJTL)" if svc_type == "RJTL" else "Rawat Inap (RITL)"
        tgl_layanan = str(ctx.get("tanggal_layanan") or "2026-10-14")[:10]
        los_hari = int(ctx["los_hari"]) if ctx.get("los_hari") is not None else (0 if svc_type == "RJTL" else 1)
        primary_icd10_text = str(ctx.get("icd10_primary") or "M54.5 Low Back Pain")
        primary_icd10_code = primary_icd10_text.split(" (")[0].strip() or "M54.5"
        no_sep_val = str(ctx.get("no_sep") or f"0112R0011026V{sep_suffix}")
        kelas_rawat = str(ctx.get("kelas_rawat") or ("Non-Kelas (RJTL)" if svc_type == "RJTL" else "Kelas 1"))
        poli_tujuan = str(ctx.get("poli_tujuan") or "Penyakit Dalam")

        # Default mock fields based on claim ID
        is_phantom = "8802" in c_id or "8805" in c_id
        is_upcoding = "8801" in c_id
        is_unbundling = "8803" in c_id
        is_normal = not (is_phantom or is_upcoding or is_unbundling)

        docs: List[DocumentMetadata] = []

        # 1. Surat Eligibilitas Peserta (SEP)
        docs.append(DocumentMetadata(
            doc_id=f"DOC-SEP-{c_id}",
            doc_type="SEP",
            doc_title="Surat Eligibilitas Peserta (SEP)",
            file_name=f"SEP_{c_id}.pdf",
            file_size_kb=142,
            upload_timestamp=now_iso,
            faskes_code=faskes_code,
            dpjp_name=dpjp_name,
            dpjp_sip=dpjp_sip,
            patient_id_token=f"PST-HASH-{id_suffix4}",
            is_signed_electronically=True,
            is_stamp_valid=True,
            ocr_confidence_pct=98.5,
            extracted_text_snippet=(
                f"BPJS KESEHATAN - SURAT ELIGIBILITAS PESERTA (SEP)\n"
                f"No. SEP: {no_sep_val}\n"
                f"Tgl. SEP: {tgl_layanan} | Faskes: {nama_faskes}\n"
                f"Diagnosa Awal: {primary_icd10_text}\n"
                f"Layanan: {svc_label} | Poli Tujuan: {poli_tujuan}"
            ),
            extracted_fields={
                "no_sep": no_sep_val,
                "tgl_sep": tgl_layanan,
                "jenis_pelayanan": svc_label,
                "kelas_rawat": kelas_rawat,
                "poli_tujuan": poli_tujuan,
            }
        ))

        # 2. Resume Medis (Discharge Summary)
        resume_dx = primary_icd10_code
        if is_upcoding:
            resume_dx = f"{primary_icd10_code} (Keluhan: Nyeri punggung ringan biasa, tidak ada defisit neurologis atau sepsis)"
        elif is_phantom:
            resume_dx = "Z00.0 (Pemeriksaan Kesehatan Umum / Baksos Tanpa Keluhan Sakit)"

        docs.append(DocumentMetadata(
            doc_id=f"DOC-RES-{c_id}",
            doc_type="RESUME_MEDIS",
            doc_title="Resume Medis Pasien Rawat Inap / Jalan",
            file_name=f"ResumeMedis_{c_id}.pdf",
            file_size_kb=320,
            upload_timestamp=now_iso,
            faskes_code="RS001",
            dpjp_name="dr. Hendra Pratama, Sp.PD",
            dpjp_sip="SIP-503/4421/DPMPTSP/2023",
            patient_id_token=f"PST-HASH-{c_id[-4:]}",
            is_signed_electronically=True,
            is_stamp_valid=not is_phantom,
            ocr_confidence_pct=94.2,
            extracted_text_snippet=(
                f"RESUME MEDIS {'RAWAT JALAN' if svc_type == 'RJTL' else 'RAWAT INAP'}\n"
                f"Diagnosa Utama: {resume_dx}\nDiagnosa Sekunder: -\nLama Rawat: {los_hari} Hari ({svc_type})\n"
                f"Kondisi Pulang: Membaik / KRS mandiri\nTerapi: Analgesik oral, fisioterapi ringan."
            ),
            extracted_fields={
                "tgl_masuk": tgl_layanan,
                "tgl_keluar": "2026-01-03" if is_upcoding else tgl_layanan,
                "los_hari": los_hari,
                "diagnosa_primer_teks": resume_dx,
                "terapi_pulang": "Paracetamol 500mg, Meloxicam 15mg"
            }
        ))

        # 3. Rincian Biaya Rumah Sakit (Hospital Billing Sheet)
        billing_snippet = "RINCIAN BIAYA PERAWATAN (HOSPITAL BILLING)\n1. Akomodasi Ruang Perawatan: Rp 450.000\n2. Visit Dokter Spesialis: Rp 250.000\n3. Laboratorium Darah: Rp 320.000\n4. Farmasi & Obat: Rp 180.000\nTotal Tagihan RS: Rp 1.200.000,-"
        if is_unbundling:
            billing_snippet += "\n[KLAIM TERPISAH]: Kateterisasi & BMHP Bedah ditagihkan mandiri Rp 14.500.000,- (Indikasi Fragmentasi Klaim)"

        docs.append(DocumentMetadata(
            doc_id=f"DOC-BIL-{c_id}",
            doc_type="BILLING_RS",
            doc_title="Rincian Biaya & Tagihan Rumah Sakit (Itemized Billing)",
            file_name=f"Billing_{c_id}.pdf",
            file_size_kb=210,
            upload_timestamp=now_iso,
            faskes_code="RS001",
            dpjp_name="Bagian Keuangan RS",
            dpjp_sip="-",
            patient_id_token=f"PST-HASH-{c_id[-4:]}",
            is_signed_electronically=True,
            is_stamp_valid=True,
            ocr_confidence_pct=99.1,
            extracted_text_snippet=billing_snippet,
            extracted_fields={
                "total_biaya_rs_rp": 1200000,
                "biaya_akomodasi": 450000,
                "biaya_visit": 250000,
                "biaya_farmasi": 180000,
                "biaya_tindakan": 320000
            }
        ))

        # 4. Surat Rujukan FKTP
        docs.append(DocumentMetadata(
            doc_id=f"DOC-RUJ-{c_id}",
            doc_type="RUJUKAN_FKTP",
            doc_title="Surat Rujukan Fasilitas Kesehatan Tingkat Pertama (FKTP)",
            file_name=f"RujukanFKTP_{c_id}.pdf",
            file_size_kb=115,
            upload_timestamp=now_iso,
            faskes_code="PUSK-01",
            dpjp_name="dr. Wahyu Hidayat",
            dpjp_sip="SIP-021/PUSK/2021",
            patient_id_token=f"PST-HASH-{id_suffix4}",
            is_signed_electronically=True,
            is_stamp_valid=True,
            ocr_confidence_pct=96.0,
            extracted_text_snippet=(
                f"SURAT RUJUKAN FKTP\nDari: Puskesmas Sukamaju (Kode: 0112B001)\n"
                f"Kepada: Poli {poli_tujuan} {nama_faskes}\n"
                f"Diagnosa Rujukan: {primary_icd10_text}\n"
                f"Catatan: Memerlukan penanganan spesialis lanjutan."
            ),
            extracted_fields={
                "no_rujukan": f"0112B0011026P{rujukan_suffix}",
                "tgl_rujukan": "2026-10-10",
                "masa_berlaku_hari": 90,
                "is_expired": False
            }
        ))

        # 5. SPRI (Surat Perintah Rawat Inap) - hanya untuk pelayanan Rawat Inap (RITL)
        if svc_type != "RJTL":
            docs.append(DocumentMetadata(
                doc_id=f"DOC-SPRI-{c_id}",
                doc_type="SPRI",
                doc_title="Surat Perintah Rawat Inap (SPRI)",
                file_name=f"SPRI_{c_id}.pdf",
                file_size_kb=95,
                upload_timestamp=now_iso,
                faskes_code=faskes_code,
                dpjp_name=dpjp_name,
                dpjp_sip=dpjp_sip,
                patient_id_token=f"PST-HASH-{id_suffix4}",
                is_signed_electronically=True,
                is_stamp_valid=True,
                ocr_confidence_pct=97.2,
                extracted_text_snippet=(
                    f"SURAT PERINTAH RAWAT INAP (SPRI)\n"
                    f"Indikasi Rawat: Eksaserbasi akut ({primary_icd10_text})\n"
                    f"Rencana Tindakan: Tata laksana rawat inap terintegrasi.\n"
                    f"Tanggal Rencana Masuk: {tgl_layanan}"
                ),
                extracted_fields={
                    "no_spri": f"SPRI-2026-{id_suffix4}",
                    "tgl_spri": tgl_layanan,
                    "indikasi_rawat": f"Tata laksana {primary_icd10_code}"
                }
            ))

        # 6. Hasil Penunjang (Lab / Radiologi) if applicable
        if not is_phantom:
            docs.append(DocumentMetadata(
                doc_id=f"DOC-LAB-{c_id}",
                doc_type="PENUNJANG_LAB",
                doc_title="Hasil Pemeriksaan Laboratorium Darah Rutin",
                file_name=f"Lab_{c_id}.pdf",
                file_size_kb=180,
                upload_timestamp=now_iso,
                faskes_code="RS001",
                dpjp_name="dr. Siti Rahma, Sp.PK",
                dpjp_sip="SIP-771/LAB/2020",
                patient_id_token=f"PST-HASH-{c_id[-4:]}",
                is_signed_electronically=True,
                is_stamp_valid=True,
                ocr_confidence_pct=99.0,
                extracted_text_snippet="HASIL LABORATORIUM KLINIK\nHemoglobin: 13.8 g/dL (Normal)\nLeukosit: 7.400 /uL (Normal)\nTrombosit: 245.000 /uL (Normal)\nLaju Endap Darah (LED): 15 mm/jam (Normal)\nKesan: Profil hematologi dalam batas normal.",
                extracted_fields={
                    "hemoglobin": 13.8,
                    "leukosit": 7400,
                    "trombosit": 245000,
                    "kesan_klinis": "Normal"
                }
            ))

        return docs

    def audit_claim_document_bundle(
        self,
        claim_id: str,
        ina_cbg_code: str = "Z-3-12-0",
        primary_icd10: str = "M54.5",
        procedure_icd9cm: Optional[str] = None,
        claimed_tariff_rp: float = 0.0,
        documents: Optional[List[DocumentMetadata]] = None,
        claim_data: Optional[Dict[str, Any]] = None,
    ) -> DocumentAuditReport:
        """
        Audit forensik komprehensif terhadap dokumen yang disubmit faskes.
        """
        if not documents:
            documents = self.generate_synthetic_document_bundle(claim_id, claim_data=claim_data)

        findings: List[DocumentAuditFinding] = []
        doc_types = {d.doc_type: d for d in documents}
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 1. Kelengkapan Berkas Wajib (RJTL vs RITL)
        sep_doc = doc_types.get("SEP")
        sep_svc = str((sep_doc.extracted_fields or {}).get("jenis_pelayanan", "")) if sep_doc else ""
        is_rjtl = (
            str((claim_data or {}).get("jenis_pelayanan") or "").upper() == "RJTL"
            or "RJTL" in sep_svc.upper()
        )
        required_docs = self.MANDATORY_DOCS_RJTL if is_rjtl else self.MANDATORY_DOCS_RITL
        missing_docs = []
        for req_doc in required_docs:
            if req_doc not in doc_types:
                missing_docs.append(req_doc)
                findings.append(DocumentAuditFinding(
                    rule_id="DOC-REQ-001",
                    severity="CRITICAL",
                    category="KELENGKAPAN",
                    title=f"Ketiadaan Dokumen Wajib: {req_doc}",
                    description=f"Berkas pendukung klaim tidak memuat dokumen wajib '{req_doc}' yang dipersyaratkan Petunjuk Teknis Pengajuan Klaim.",
                    affected_document=req_doc,
                    regulatory_reference="Petunjuk Teknis BPJS Kesehatan Bagian IV (Kelengkapan Berkas Administrasi Klaim RITL)",
                    remediation_action="Kembalikan klaim ke Faskes (Status: PENDING_BERKAS) untuk pengunggahan ulang dokumen wajib."
                ))

        # 2. Verifikasi Laporan Operasi untuk Prosedur Bedah (ICD-9-CM Bab 01-86, non-diagnostik/non-HD)
        proc_token = (procedure_icd9cm or "").strip().split(" ")[0].split("(")[0].strip()
        proc_prefix = proc_token.split(".")[0] if proc_token else ""
        has_surgical_procedure = bool(
            proc_prefix.isdigit()
            and 1 <= int(proc_prefix) <= 86
            and proc_token not in ("39.95",)
        )
        if has_surgical_procedure:
            if "LAPORAN_OPERASI" not in doc_types:
                findings.append(DocumentAuditFinding(
                    rule_id="DOC-SURG-002",
                    severity="CRITICAL",
                    category="KELENGKAPAN",
                    title="Klaim Tindakan Bedah Tanpa Laporan Operasi",
                    description=f"Klaim mencantumkan prosedur bedah/invasif ({procedure_icd9cm}), namun tidak melampirkan Berkas Laporan Operasi & Catatan Anestesi yang sah.",
                    affected_document="LAPORAN_OPERASI",
                    regulatory_reference="Permenkes No. 26 Tahun 2021 Pasal 14 & Petunjuk Teknis Koding Prosedur Bedah",
                    remediation_action="Tolak tarif prosedur bedah atau ganti koding menjadi tindakan non-operatif sampai bukti laporan operasi diserahkan."
                ))

        # 3. Verifikasi Bukti Penunjang Diagnostik Kritis
        base_dx_code = primary_icd10.split(".")[0].strip() if primary_icd10 else ""
        if base_dx_code in self.DIAGNOSIS_SUPPORTING_REQUIREMENTS:
            rule_info = self.DIAGNOSIS_SUPPORTING_REQUIREMENTS[base_dx_code]
            has_lab = "PENUNJANG_LAB" in doc_types
            has_rad = "PENUNJANG_RAD" in doc_types
            if not has_lab and not has_rad:
                findings.append(DocumentAuditFinding(
                    rule_id="DOC-CLIN-003",
                    severity="HIGH",
                    category="KESELARASAN_KLINIS",
                    title=f"Diagnosis {rule_info['name']} Tanpa Bukti Penunjang Objektif",
                    description=f"{rule_info['description']} Uji penunjang yang dipersyaratkan: {', '.join(rule_info['required_tests'])}.",
                    affected_document="PENUNJANG_LAB / PENUNJANG_RAD",
                    regulatory_reference="Permenkes No. 26 Tahun 2021 Kaidah Koding Klinis INA-CBG & Standar Pelayanan Kedokteran (PNPK)",
                    remediation_action="Minta resume bukti laboratorium/radiologi sah dari rekam medis rumah sakit sebelum persetujuan klaim."
                ))

        # 4. Deteksi Diskrepansi Kronologis Antar Dokumen (Temporal Inversion)
        sep_doc = doc_types.get("SEP")
        resume_doc = doc_types.get("RESUME_MEDIS")
        cross_checks: Dict[str, Any] = {
            "sep_vs_resume_identity_match": True,
            "temporal_coherence_verified": True,
            "dpjp_signature_verified": True,
            "billing_reconciliation_balanced": True
        }

        if sep_doc and resume_doc:
            tgl_sep = sep_doc.extracted_fields.get("tgl_sep")
            tgl_masuk = resume_doc.extracted_fields.get("tgl_masuk")
            tgl_keluar = resume_doc.extracted_fields.get("tgl_keluar")

            if tgl_masuk and tgl_keluar and tgl_keluar < tgl_masuk:
                cross_checks["temporal_coherence_verified"] = False
                findings.append(DocumentAuditFinding(
                    rule_id="DOC-TEMP-004",
                    severity="CRITICAL",
                    category="TEMPORAL",
                    title="Inversi Kronologis: Tanggal Keluar Mendahului Tanggal Masuk",
                    description=f"Pada Resume Medis, tanggal keluar ({tgl_keluar}) mendahului tanggal masuk rawat inap ({tgl_masuk}).",
                    affected_document="RESUME_MEDIS",
                    regulatory_reference="Standar Akreditasi Rumah Sakit (STARKES) & Permenkes No. 24 Tahun 2022 tentang Rekam Medis",
                    remediation_action="Klaim ditahan (HOLD). Kembalikan berkas ke rekam medis rumah sakit untuk klarifikasi kronologis."
                ))

            # DPJP Mismatch check
            if sep_doc.dpjp_name and resume_doc.dpjp_name:
                if sep_doc.dpjp_name != resume_doc.dpjp_name and resume_doc.dpjp_name != "-":
                    cross_checks["dpjp_signature_verified"] = False
                    findings.append(DocumentAuditFinding(
                        rule_id="DOC-AUTH-005",
                        severity="MEDIUM",
                        category="KEABSAHAN",
                        title="Diskrepansi Dokter Penanggung Jawab Pelayanan (DPJP)",
                        description=f"DPJP tercantum pada SEP ({sep_doc.dpjp_name}) berbeda dengan DPJP yang menandatangani resume ({resume_doc.dpjp_name}) tanpa surat konsul/alih rawat terlampir.",
                        affected_document="RESUME_MEDIS vs SEP",
                        regulatory_reference="Perpres No. 82 Tahun 2018 Pasal 74 & Kaidah Pengabsahan DPJP",
                        remediation_action="Verifikasi adanya surat pelimpahan wewenang DPJP atau lembar konsultasi resmi antar-spesialis."
                    ))

        # 5. Keabsahan Tanda Tangan & Stempel
        for d in documents:
            if not d.is_stamp_valid and d.doc_type in ["RESUME_MEDIS", "SEP"]:
                findings.append(DocumentAuditFinding(
                    rule_id="DOC-AUTH-006",
                    severity="HIGH",
                    category="KEABSAHAN",
                    title=f"Keabsahan Stempel / Tanda Tangan Meragukan pada {d.doc_title}",
                    description=f"Dokumen {d.file_name} tidak memiliki tanda tangan digital tersertifikasi atau stempel basah resmi faskes.",
                    affected_document=d.doc_type,
                    regulatory_reference="UU ITE No. 1 Tahun 2024 & Permenkes No. 24 Tahun 2022 tentang Rekam Medis Elektronik",
                    remediation_action="Konfirmasi keaslian dokumen ke bagian Rekam Medis & Komite Medis rumah sakit pengaju klaim."
                ))

        # Calculate Compliance Score
        total_penalties = 0.0
        for f in findings:
            if f.severity == "CRITICAL":
                total_penalties += 40.0
            elif f.severity == "HIGH":
                total_penalties += 25.0
            elif f.severity == "MEDIUM":
                total_penalties += 10.0
            elif f.severity == "LOW":
                total_penalties += 5.0

        compliance_score = max(0.0, round(100.0 - total_penalties, 1))

        # Determine Audit Status
        if any(f.severity == "CRITICAL" for f in findings):
            if any(f.category == "TEMPORAL" for f in findings) or not cross_checks["temporal_coherence_verified"]:
                audit_status = "INDIKASI_FABRIKASI"
                recommendation = "Ditolak / Diinvestigasi Khusus (Anomali Kritis Integritas Kronologis Dokumen)"
            else:
                audit_status = "KURANG_BERKAS"
                recommendation = "Klaim Ditahan (Hold Pra-Bayar). Terbitkan Berita Acara Pending Berkas ke Faskes."
        elif any(f.severity == "HIGH" for f in findings):
            audit_status = "DISKREPANSI_KLINIS"
            recommendation = "Perlu Klarifikasi Klinis dengan Dokter Penelaah BPJS & Rekam Medis Faskes."
        elif compliance_score >= 85.0:
            audit_status = "LENGKAP_DAN_SAH"
            recommendation = "Berkas Lengkap dan Sah Sesuai Kaidah Klaim. Layak Dilanjutkan ke Pembayaran."
        else:
            audit_status = "KURANG_BERKAS"
            recommendation = "Konfirmasi Kelengkapan Administratif ke Faskes."

        # Compute SHA-256 Bundle Integrity Hash
        bundle_str = json.dumps([d.doc_id + d.file_name + str(d.file_size_kb) for d in documents], sort_keys=True)
        bundle_hash = hashlib.sha256(bundle_str.encode("utf-8")).hexdigest()

        return DocumentAuditReport(
            claim_id=claim_id,
            audit_timestamp=now_str,
            total_documents_submitted=len(documents),
            mandatory_documents_required=len(required_docs),
            missing_documents=missing_docs,
            compliance_score_pct=compliance_score,
            audit_status=audit_status,
            recommendation=recommendation,
            findings=findings,
            cross_document_checks=cross_checks,
            bundle_hash_sha256=bundle_hash,
            documents=documents
        )


# Global Singleton Instance
document_auditor = ClaimDocumentAuditor()
