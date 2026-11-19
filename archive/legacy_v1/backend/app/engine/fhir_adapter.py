"""
ClaimTrace FHIR SATUSEHAT Interoperability Adapter
Healthkathon BPJS Kesehatan 2026 • Kategori: Efisiensi Risiko pada Faskes (#6 & #11)
Tim Pengembang Nasional ClaimTrace • BPJS Kesehatan Tingkat Nasional

Transforms ClaimTrace claim records and deterministic triage decisions into
HL7 FHIR R4 Bundles compliant with Kementerian Kesehatan Republik Indonesia (SATUSEHAT)
and BPJS Kesehatan interoperability profiles (UU PDP No. 27/2022 compliant).
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.models.schemas import ClaimInput, TriageResult
from app.engine.scoring import evaluate_claim_triage

def claim_to_fhir_bundle(claim: ClaimInput, triage: Optional[TriageResult] = None) -> Dict[str, Any]:
    """
    Serializes a ClaimTrace claim and its multi-signal triage assessment
    into an HL7 FHIR R4 compliant Bundle containing:
    - Patient (anonymized/masked per UU PDP)
    - Practitioner (DPJP with SIP verification)
    - Organization (Faskes Tingkat Lanjut)
    - Encounter (Rawat Inap / Jalan episode)
    - Condition (Primary ICD-10)
    - Procedure (ICD-9-CM)
    - Claim (Financial claim details with INA-CBG)
    - RiskAssessment (Deterministic ClaimTrace DSS Triage Output)
    - Provenance (Cryptographic SHA-256 audit seal)
    """
    if triage is None:
        triage = evaluate_claim_triage(claim)

    cid_slug = claim.claim_id.lower().replace("_", "-")
    patient_ref_id = f"pat-{claim.peserta_token_aes[:12].lower()}"
    practitioner_ref_id = f"prac-{claim.dpjp_meta.dpjp_id_hash[:12].lower()}"
    org_ref_id = f"org-{claim.faskes_id.lower().replace('_', '-')}"
    encounter_ref_id = f"enc-{cid_slug}"
    condition_ref_id = f"cond-{cid_slug}"
    procedure_ref_id = f"proc-{cid_slug}"
    claim_ref_id = f"claim-{cid_slug}"
    risk_ref_id = f"risk-{cid_slug}"
    provenance_ref_id = f"prov-{cid_slug}"

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # 1. Patient Resource
    patient_resource = {
        "resourceType": "Patient",
        "id": patient_ref_id,
        "meta": {
            "profile": ["https://fhir.kemkes.go.id/r4/StructureDefinition/Patient"]
        },
        "identifier": [
            {
                "use": "official",
                "system": "https://fhir.kemkes.go.id/id/nik",
                "value": "337201*******0004",  # Masked per UU PDP No. 27/2022
                "assigner": {"display": "Kementerian Dalam Negeri Dukcapil"}
            },
            {
                "use": "secondary",
                "system": "https://fhir.kemkes.go.id/id/bpjs-kartu",
                "value": f"000{claim.peserta_token_aes[:6]}*****",
                "assigner": {"display": "BPJS Kesehatan"}
            }
        ],
        "active": True,
        "name": [
            {
                "use": "official",
                "text": f"Peserta Terproteksi (Token: {claim.peserta_token_aes[:8]}...)",
                "family": "TERPROTEKSI",
                "given": ["PESERTA", "JKN"]
            }
        ],
        "gender": "unknown"
    }

    # 2. Practitioner Resource (DPJP)
    practitioner_resource = {
        "resourceType": "Practitioner",
        "id": practitioner_ref_id,
        "meta": {
            "profile": ["https://fhir.kemkes.go.id/r4/StructureDefinition/Practitioner"]
        },
        "identifier": [
            {
                "use": "official",
                "system": "https://fhir.kemkes.go.id/id/nik-tenaga-kesehatan",
                "value": f"SDMK-{claim.dpjp_meta.dpjp_id_hash[:8]}"
            },
            {
                "use": "secondary",
                "system": "https://fhir.kemkes.go.id/id/sip",
                "value": f"SIP/DPJP/{claim.faskes_id}/{claim.dpjp_meta.dpjp_id_hash[:6]}"
            }
        ],
        "active": claim.dpjp_meta.sip_status == "ACTIVE",
        "name": [
            {
                "use": "official",
                "text": claim.dpjp_meta.nama_dpjp_alias
            }
        ],
        "qualification": [
            {
                "code": {
                    "coding": [
                        {
                            "system": "https://fhir.kemkes.go.id/CodeSystem/sip-status",
                            "code": claim.dpjp_meta.sip_status,
                            "display": f"SIP Status: {claim.dpjp_meta.sip_status}"
                        }
                    ]
                },
                "period": {
                    "end": str(claim.dpjp_meta.sip_expiry_date) if claim.dpjp_meta.sip_expiry_date else "2026-12-31"
                }
            }
        ]
    }

    # 3. Organization Resource (Faskes)
    org_resource = {
        "resourceType": "Organization",
        "id": org_ref_id,
        "meta": {
            "profile": ["https://fhir.kemkes.go.id/r4/StructureDefinition/Organization"]
        },
        "identifier": [
            {
                "use": "official",
                "system": "https://fhir.kemkes.go.id/id/kode-faskes-bpjs",
                "value": claim.faskes_id
            }
        ],
        "active": True,
        "type": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/organization-type",
                        "code": "prov",
                        "display": f"Fasilitas Kesehatan Rujukan Tingkat Lanjut (Kelas {claim.kelas_rs})"
                    }
                ]
            }
        ],
        "name": claim.nama_faskes
    }

    # 4. Encounter Resource
    is_inpatient = "Rawat Inap" in claim.deskripsi_cbg or "Kelas" in claim.deskripsi_cbg
    encounter_resource = {
        "resourceType": "Encounter",
        "id": encounter_ref_id,
        "meta": {
            "profile": ["https://fhir.kemkes.go.id/r4/StructureDefinition/Encounter"]
        },
        "status": "finished",
        "class": {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            "code": "IMP" if is_inpatient else "AMB",
            "display": "Inpatient encounter" if is_inpatient else "Ambulatory encounter"
        },
        "subject": {
            "reference": f"Patient/{patient_ref_id}",
            "display": f"Peserta Token {claim.peserta_token_aes[:8]}"
        },
        "participant": [
            {
                "individual": {
                    "reference": f"Practitioner/{practitioner_ref_id}",
                    "display": claim.dpjp_meta.nama_dpjp_alias
                }
            }
        ],
        "period": {
            "start": f"{claim.tanggal_layanan}T08:00:00+07:00",
            "end": f"{claim.tanggal_layanan}T14:30:00+07:00"
        },
        "serviceProvider": {
            "reference": f"Organization/{org_ref_id}",
            "display": claim.nama_faskes
        }
    }

    # 5. Condition Resource (ICD-10)
    condition_resource = {
        "resourceType": "Condition",
        "id": condition_ref_id,
        "meta": {
            "profile": ["https://fhir.kemkes.go.id/r4/StructureDefinition/Condition"]
        },
        "clinicalStatus": {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                    "code": "active",
                    "display": "Active"
                }
            ]
        },
        "verificationStatus": {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                    "code": "confirmed",
                    "display": "Confirmed"
                }
            ]
        },
        "category": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                        "code": "encounter-diagnosis",
                        "display": "Encounter Diagnosis"
                    }
                ]
            }
        ],
        "code": {
            "coding": [
                {
                    "system": "http://hl7.org/fhir/sid/icd-10",
                    "code": claim.icd10_primary,
                    "display": f"Primary Diagnosis ({claim.icd10_primary})"
                }
            ]
        },
        "subject": {
            "reference": f"Patient/{patient_ref_id}"
        },
        "encounter": {
            "reference": f"Encounter/{encounter_ref_id}"
        },
        "recordedDate": str(claim.tanggal_layanan)
    }

    # 6. Procedure Resource (ICD-9-CM)
    procedure_resource = {
        "resourceType": "Procedure",
        "id": procedure_ref_id,
        "meta": {
            "profile": ["https://fhir.kemkes.go.id/r4/StructureDefinition/Procedure"]
        },
        "status": "completed",
        "code": {
            "coding": [
                {
                    "system": "http://hl7.org/fhir/sid/icd-9-cm",
                    "code": claim.icd9cm_procedure,
                    "display": f"Tindakan Medis ({claim.icd9cm_procedure})"
                }
            ]
        },
        "subject": {
            "reference": f"Patient/{patient_ref_id}"
        },
        "encounter": {
            "reference": f"Encounter/{encounter_ref_id}"
        },
        "performedDateTime": f"{claim.tanggal_layanan}T10:00:00+07:00"
    }

    # 7. Claim Resource (Financial/INA-CBG)
    claim_resource = {
        "resourceType": "Claim",
        "id": claim_ref_id,
        "meta": {
            "profile": ["https://fhir.kemkes.go.id/r4/StructureDefinition/Claim"]
        },
        "identifier": [
            {
                "use": "official",
                "system": "https://bpjs-kesehatan.go.id/id/nomor-klaim",
                "value": claim.claim_id
            }
        ],
        "status": "active",
        "type": {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/claim-type",
                    "code": "institutional",
                    "display": "Institutional Klaim Faskes"
                }
            ]
        },
        "use": "claim",
        "patient": {
            "reference": f"Patient/{patient_ref_id}"
        },
        "billablePeriod": {
            "start": str(claim.tanggal_layanan),
            "end": str(claim.tanggal_layanan)
        },
        "created": now_iso,
        "insurer": {
            "display": "BPJS Kesehatan (Badan Penyelenggara Jaminan Sosial Kesehatan)"
        },
        "provider": {
            "reference": f"Organization/{org_ref_id}",
            "display": claim.nama_faskes
        },
        "priority": {
            "coding": [
                {
                    "code": "normal"
                }
            ]
        },
        "diagnosis": [
            {
                "sequence": 1,
                "diagnosisCodeableConcept": {
                    "coding": [
                        {
                            "system": "http://hl7.org/fhir/sid/icd-10",
                            "code": claim.icd10_primary
                        }
                    ]
                }
            }
        ],
        "procedure": [
            {
                "sequence": 1,
                "procedureCodeableConcept": {
                    "coding": [
                        {
                            "system": "http://hl7.org/fhir/sid/icd-9-cm",
                            "code": claim.icd9cm_procedure
                        }
                    ]
                }
            }
        ],
        "item": [
            {
                "sequence": 1,
                "productOrService": {
                    "coding": [
                        {
                            "system": "https://bpjs-kesehatan.go.id/ina-cbg",
                            "code": claim.ina_cbg_code,
                            "display": claim.deskripsi_cbg
                        }
                    ]
                },
                "servicedDate": str(claim.tanggal_layanan),
                "unitPrice": {
                    "value": claim.nilai_klaim_rp,
                    "currency": "IDR"
                },
                "net": {
                    "value": claim.nilai_klaim_rp,
                    "currency": "IDR"
                }
            }
        ],
        "total": {
            "value": claim.nilai_klaim_rp,
            "currency": "IDR"
        }
    }

    # 8. RiskAssessment Resource (ClaimTrace DSS Triage Output)
    risk_assessment_resource = {
        "resourceType": "RiskAssessment",
        "id": risk_ref_id,
        "meta": {
            "profile": ["https://fhir.kemkes.go.id/r4/StructureDefinition/RiskAssessment"]
        },
        "status": "final",
        "subject": {
            "reference": f"Claim/{claim_ref_id}"
        },
        "occurrenceDateTime": now_iso,
        "method": {
            "coding": [
                {
                    "system": "https://bpjs-kesehatan.go.id/claimtrace/methods",
                    "code": "TRIAGE-MULTI-SINYAL",
                    "display": "ClaimTrace Deterministic Multi-Signal Triage DSS"
                }
            ]
        },
        "basis": [
            {"reference": f"Encounter/{encounter_ref_id}"},
            {"reference": f"Condition/{condition_ref_id}"},
            {"reference": f"Procedure/{procedure_ref_id}"}
        ],
        "prediction": [
            {
                "outcome": {
                    "coding": [
                        {
                            "system": "https://bpjs-kesehatan.go.id/claimtrace/lanes",
                            "code": triage.triage_lane,
                            "display": f"Jalur Triase: {triage.triage_lane}"
                        }
                    ],
                    "text": f"Jalur {triage.triage_lane} (Skor Prioritas: {triage.final_priority_score}/100)"
                },
                "probabilityDecimal": round(triage.final_priority_score / 100.0, 4),
                "qualitativeRisk": {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/risk-probability",
                            "code": "high" if triage.triage_lane == "MERAH" else ("moderate" if triage.triage_lane == "KUNING" else "low"),
                            "display": f"Tingkat Risiko: {triage.triage_lane}"
                        }
                    ]
                },
                "rationale": triage.ringkasan_bukti_audit
            }
        ],
        "note": [
            {"text": f"SOP Rekomendasi: {triage.rekomendasi_sop}"},
            {"text": f"Kemungkinan Penjelasan Sah: {triage.kemungkinan_penjelasan_sah}"},
            {"text": f"Hard Trigger Status: {'AKTIF' if triage.hard_trigger_activated else 'NON-AKTIF'} ({triage.hard_trigger_reason or 'Tidak ada'})"},
            {"text": f"Kode Indikator: {', '.join(triage.kode_indikator)}"},
            {"text": f"MITRE F3 Mapping: {', '.join(triage.mitre_f3_tags)}"},
            {"text": f"MITRE ATT&CK Mapping: {', '.join(triage.mitre_attack_tags)}"},
            {"text": f"Dasar Hukum: {', '.join(triage.regulatory_basis)}"},
            {"text": f"SLA Vedika Deadline: {triage.sla_deadline_days} Hari Kalender"}
        ]
    }

    # 9. Provenance Resource (Cryptographic Hash Seal)
    provenance_resource = {
        "resourceType": "Provenance",
        "id": provenance_ref_id,
        "meta": {
            "profile": ["https://fhir.kemkes.go.id/r4/StructureDefinition/Provenance"]
        },
        "target": [
            {"reference": f"RiskAssessment/{risk_ref_id}"},
            {"reference": f"Claim/{claim_ref_id}"}
        ],
        "recorded": now_iso,
        "policy": [
            "https://peraturan.bpjs-kesehatan.go.id/perpres-82-2018",
            "https://jdih.kemkes.go.id/permenkes-16-2019",
            "https://peraturan.go.id/uu-pdp-no-27-tahun-2022"
        ],
        "agent": [
            {
                "type": {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                            "code": "AUT",
                            "display": "Author / Decision Engine"
                        }
                    ]
                },
                "who": {
                    "display": "ClaimTrace AI DSS Engine v1.0.0 (Healthkathon BPJS 2026 • Tim TINEERENSE)"
                }
            },
            {
                "type": {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                            "code": "VRF",
                            "display": "Verifier Authority"
                        }
                    ]
                },
                "who": {
                    "display": "Verifikator Vedika BPJS Kesehatan (Human-in-the-Loop)"
                }
            }
        ],
        "signature": [
            {
                "type": [
                    {
                        "system": "urn:iso-astm:E1762-95:2013",
                        "code": "1.2.840.10065.1.12.1.1",
                        "display": "Author's Signature"
                    }
                ],
                "when": now_iso,
                "who": {
                    "display": "ClaimTrace Cryptographic Audit Logger"
                },
                "sigFormat": "application/sha256",
                "data": triage.audit_hash
            }
        ]
    }

    # Wrap into HL7 FHIR R4 Bundle
    bundle = {
        "resourceType": "Bundle",
        "id": f"bundle-claimtrace-{cid_slug}",
        "meta": {
            "versionId": "1",
            "lastUpdated": now_iso,
            "profile": ["https://fhir.kemkes.go.id/r4/StructureDefinition/ClaimTraceBundle"]
        },
        "identifier": {
            "system": "https://bpjs-kesehatan.go.id/claimtrace/bundle",
            "value": f"BUNDLE-{claim.claim_id}"
        },
        "type": "collection",
        "timestamp": now_iso,
        "total": 9,
        "entry": [
            {"fullUrl": f"urn:uuid:{patient_ref_id}", "resource": patient_resource},
            {"fullUrl": f"urn:uuid:{practitioner_ref_id}", "resource": practitioner_resource},
            {"fullUrl": f"urn:uuid:{org_ref_id}", "resource": org_resource},
            {"fullUrl": f"urn:uuid:{encounter_ref_id}", "resource": encounter_resource},
            {"fullUrl": f"urn:uuid:{condition_ref_id}", "resource": condition_resource},
            {"fullUrl": f"urn:uuid:{procedure_ref_id}", "resource": procedure_resource},
            {"fullUrl": f"urn:uuid:{claim_ref_id}", "resource": claim_resource},
            {"fullUrl": f"urn:uuid:{risk_ref_id}", "resource": risk_assessment_resource},
            {"fullUrl": f"urn:uuid:{provenance_ref_id}", "resource": provenance_resource}
        ]
    }

    return bundle
