"""
ClaimTrace Native FHIR R4 Server Router
Healthkathon BPJS Kesehatan 2026 • Kategori: Efisiensi Risiko pada Faskes (#6 & #11)
Tim Pengembang Nasional ClaimTrace • BPJS Kesehatan Tingkat Nasional

Implements FHIR R4 standard endpoints for direct integration with:
- Standard FHIR MCP clients and healthcare interoperability gateways
- Kementerian Kesehatan RI SATUSEHAT Data Platform (PMK 24/2022)
- BPJS Kesehatan vClaim / Interoperabilitas Klaim / BAKB

Supported Resources:
- Patient, Practitioner, Organization, Encounter, Condition, Procedure,
  Claim, ClaimResponse, Composition, RiskAssessment, Provenance, CapabilityStatement (metadata)
"""

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
import json
import re
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from app.data.synthetic_seed import SYNTHETIC_CLAIMS_DATABASE
from app.engine.scoring import evaluate_claim_triage
from app.engine.fhir_adapter import claim_to_fhir_bundle
from app.engine.icd10_service import icd10_service

fhir_router = APIRouter(prefix="/fhir", tags=["FHIR R4 SATUSEHAT"])

def get_all_fhir_resources() -> Dict[str, Dict[str, Any]]:
    """
    Builds an in-memory index of all FHIR resources from active ClaimTrace claims.
    Indexed by f"{resourceType}/{id}" (case-insensitive for convenience).
    Includes ClaimResponse adjudications and Composition clinical audit dossiers.
    """
    index: Dict[str, Dict[str, Any]] = {}
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    for cid, claim in SYNTHETIC_CLAIMS_DATABASE.items():
        triage = evaluate_claim_triage(claim)
        bundle = claim_to_fhir_bundle(claim, triage)
        for entry in bundle.get("entry", []):
            res = entry.get("resource", {})
            rtype = res.get("resourceType")
            rid = res.get("id")
            if rtype and rid:
                key = f"{rtype}/{rid}".lower()
                index[key] = res
                # Also index with original claim ID aliases for convenience
                if rtype == "Claim":
                    index[f"claim/{cid}".lower()] = res

        cid_slug = claim.claim_id.lower().replace("_", "-")
        faskes_slug = claim.faskes_id.lower().replace("_", "-")

        # 1. SATUSEHAT & BPJS Adjudication ClaimResponse
        claim_resp = {
            "resourceType": "ClaimResponse",
            "id": f"claimresp-{cid_slug}",
            "meta": {
                "profile": ["https://fhir.kemkes.go.id/r4/StructureDefinition/ClaimResponse"]
            },
            "identifier": [
                {
                    "system": "http://bpjs-kesehatan.go.id/claimresponse",
                    "value": f"RESP-{claim.claim_id}"
                }
            ],
            "status": "active",
            "type": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/claim-type",
                        "code": "institutional",
                        "display": "Klaim Fasilitas Kesehatan Rujukan Tingkat Lanjut (FKRTL)"
                    }
                ]
            },
            "use": "claim",
            "patient": {
                "reference": f"Patient/pat-{claim.peserta_token_aes[:12].lower()}",
                "display": f"Peserta Terproteksi (Token: {claim.peserta_token_aes[:8]}...)"
            },
            "created": now_iso,
            "insurer": {
                "reference": "Organization/bpjs-kesehatan",
                "display": "Badan Penyelenggara Jaminan Sosial Kesehatan"
            },
            "requestor": {
                "reference": f"Organization/org-{faskes_slug}",
                "display": claim.nama_faskes
            },
            "request": {
                "reference": f"Claim/claim-{cid_slug}"
            },
            "outcome": "complete" if triage.triage_lane == "HIJAU" else ("error" if triage.triage_lane == "MERAH" else "partial"),
            "disposition": f"Rekomendasi Triase DSS: Jalur {triage.triage_lane} (Skor Prioritas: {triage.final_priority_score:.2f}). {triage.rekomendasi_sop}",
            "preAuthRef": f"BAKB/2026/{claim.claim_id}" if triage.triage_lane in ("KUNING", "MERAH") else f"SEP/{claim.fkl02_id_kunjungan or claim.claim_id}",
            "adjudication": [
                {
                    "category": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/adjudication",
                                "code": "benefit",
                                "display": "Manfaat Pertanggungan JKN"
                            }
                        ]
                    },
                    "amount": {
                        "value": float(claim.fkl48_biaya_verifikasi or (claim.nilai_klaim_rp if triage.triage_lane == "HIJAU" else 0)),
                        "currency": "IDR"
                    },
                    "reason": {
                        "coding": [
                            {
                                "system": "http://bpjs-kesehatan.go.id/adjudication-reason",
                                "code": "ACC" if triage.triage_lane == "HIJAU" else "PENDING_AUDIT",
                                "display": "Disetujui Otomatis (Straight-Through Processing)" if triage.triage_lane == "HIJAU" else "Memerlukan Verifikasi Lapangan / Berita Acara Klaim Bermasalah (BAKB)"
                            }
                        ]
                    }
                }
            ],
            "total": [
                {
                    "category": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/adjudication",
                                "code": "submitted",
                                "display": "Total Pengajuan Biaya Klaim"
                            }
                        ]
                    },
                    "amount": {
                        "value": float(claim.nilai_klaim_rp),
                        "currency": "IDR"
                    }
                }
            ]
        }
        index[f"claimresponse/claimresp-{cid_slug}"] = claim_resp
        index[f"claimresponse/{claim.claim_id.lower()}"] = claim_resp

        # 2. SATUSEHAT Clinical Audit & Medical Record Composition
        comp = {
            "resourceType": "Composition",
            "id": f"comp-{cid_slug}",
            "meta": {
                "profile": ["https://fhir.kemkes.go.id/r4/StructureDefinition/Composition"]
            },
            "status": "final",
            "type": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": "11503-0",
                        "display": "Medical Records"
                    }
                ]
            },
            "title": f"Dossier Klinis & Audit Klaim {claim.claim_id}",
            "subject": {
                "reference": f"Patient/pat-{claim.peserta_token_aes[:12].lower()}"
            },
            "encounter": {
                "reference": f"Encounter/enc-{cid_slug}"
            },
            "date": now_iso,
            "author": [
                {
                    "reference": f"Practitioner/prac-{claim.dpjp_meta.dpjp_id_hash[:12].lower()}",
                    "display": claim.dpjp_meta.nama_dpjp_alias
                }
            ],
            "custodian": {
                "reference": f"Organization/org-{faskes_slug}",
                "display": claim.nama_faskes
            },
            "section": [
                {
                    "title": "Catatan Klinis Rekam Medis Elektronik (SOAP & INA-CBG)",
                    "text": {
                        "status": "generated",
                        "div": f"<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><strong>Assessment (ICD-10):</strong> {claim.icd10_primary} ({claim.deskripsi_cbg})</p><p><strong>Prosedur (ICD-9-CM):</strong> {claim.icd9cm_procedure}</p><p><strong>Tarif INA-CBG:</strong> {claim.ina_cbg_code} (Rp {claim.nilai_klaim_rp:,})</p><p><strong>DPJP:</strong> {claim.dpjp_meta.nama_dpjp_alias} (SIP: {claim.dpjp_meta.sip_status})</p></div>"
                    }
                },
                {
                    "title": "Adjudikasi Audit Triase ClaimTrace",
                    "text": {
                        "status": "generated",
                        "div": f"<div xmlns=\"http://www.w3.org/1999/xhtml\"><p>Jalur Triase: {triage.triage_lane} | Skor Prioritas: {triage.final_priority_score:.2f}</p><p>Rekomendasi SOP: {triage.rekomendasi_sop}</p><p>Audit Hash SHA-256: {triage.audit_hash}</p></div>"
                    }
                }
            ]
        }
        index[f"composition/comp-{cid_slug}"] = comp
        index[f"composition/{claim.claim_id.lower()}"] = comp

    return index

@fhir_router.get("/metadata")
def get_capability_statement():
    """
    FHIR Conformance Statement / CapabilityStatement.
    Required by SMART-on-FHIR clients, Kemenkes SATUSEHAT, and standard FHIR MCP connectors.
    """
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {
        "resourceType": "CapabilityStatement",
        "id": "claimtrace-satusehat-conformance",
        "name": "ClaimTraceFHIRGateway",
        "title": "ClaimTrace BPJS Pre-Payment Decision Support System FHIR R4 API",
        "status": "active",
        "date": now_iso,
        "publisher": "BPJS Kesehatan • Kedeputian Bidang Jaminan Pelayanan Kesehatan",
        "description": "Gerbang Interoperabilitas FHIR R4 untuk SATUSEHAT Kemenkes & Analisis Fraud Pra-Bayar",
        "kind": "instance",
        "software": {
            "name": "ClaimTrace DSS Core Engine",
            "version": "1.0.0"
        },
        "implementation": {
            "description": "Kemenkes SATUSEHAT & BPJS Kesehatan Triase Multi-Sinyal (#6 Phantom & #11 Repeat Billing)",
            "url": "http://127.0.0.1:8000/fhir"
        },
        "fhirVersion": "4.0.1",
        "format": ["application/json", "application/fhir+json"],
        "rest": [
            {
                "mode": "server",
                "security": {
                    "cors": True,
                    "description": "UU Perlindungan Data Pribadi No. 27/2022 compliant tokenized pseudonymization"
                },
                "resource": [
                    {"type": "Patient", "interaction": [{"code": "read"}, {"code": "search-type"}]},
                    {"type": "Practitioner", "interaction": [{"code": "read"}, {"code": "search-type"}]},
                    {"type": "Organization", "interaction": [{"code": "read"}, {"code": "search-type"}]},
                    {"type": "Encounter", "interaction": [{"code": "read"}, {"code": "search-type"}]},
                    {"type": "Condition", "interaction": [{"code": "read"}, {"code": "search-type"}]},
                    {"type": "Procedure", "interaction": [{"code": "read"}, {"code": "search-type"}]},
                    {"type": "Claim", "interaction": [{"code": "read"}, {"code": "search-type"}]},
                    {"type": "ClaimResponse", "interaction": [{"code": "read"}, {"code": "search-type"}]},
                    {"type": "Composition", "interaction": [{"code": "read"}, {"code": "search-type"}]},
                    {"type": "RiskAssessment", "interaction": [{"code": "read"}, {"code": "search-type"}]},
                    {"type": "Provenance", "interaction": [{"code": "read"}, {"code": "search-type"}]}
                ]
            }
        ]
    }

@fhir_router.get("/{resource_type}")
def search_fhir_resources(resource_type: str, request: Request):
    """
    Executes a standard FHIR search interaction returning a Bundle of type 'searchset'.
    Supports query parameters and filters for standard FHIR 'search' operations.
    """
    res_index = get_all_fhir_resources()
    target_type = resource_type.lower()
    
    query_params = dict(request.query_params)
    matched_resources = []
    
    for key, res in res_index.items():
        if key.startswith(f"{target_type}/"):
            # If search filters exist, apply basic property matching
            matches = True
            for param_key, param_val in query_params.items():
                if param_key.startswith("_"):
                    continue
                # Simple recursive property string match
                val_str = str(res).lower()
                if param_val.lower() not in val_str:
                    matches = False
                    break
            if matches:
                # Deduplicate by unique id
                if not any(m["id"] == res["id"] for m in matched_resources):
                    matched_resources.append(res)
    
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    bundle = {
        "resourceType": "Bundle",
        "id": f"searchset-{target_type}-{int(datetime.now().timestamp())}",
        "type": "searchset",
        "timestamp": now_iso,
        "total": len(matched_resources),
        "entry": [
            {
                "fullUrl": f"http://127.0.0.1:8000/fhir/{r.get('resourceType')}/{r.get('id')}",
                "resource": r
            }
            for r in matched_resources
        ]
    }
    return bundle

@fhir_router.get("/{resource_type}/{resource_id}")
def read_fhir_resource(resource_type: str, resource_id: str):
    """
    Performs a standard FHIR 'read' interaction to retrieve a single resource instance.
    Directly consumed by standard FHIR 'read' connectors.
    """
    res_index = get_all_fhir_resources()
    lookup_key = f"{resource_type.lower()}/{resource_id.lower()}"
    
    if lookup_key in res_index:
        return res_index[lookup_key]
    
    # Try finding by partial ID match (e.g., pat-..., claim-...)
    for key, res in res_index.items():
        if key.startswith(f"{resource_type.lower()}/") and resource_id.lower() in res.get("id", "").lower():
            return res
            
    raise HTTPException(
        status_code=404,
        detail={
            "resourceType": "OperationOutcome",
            "issue": [
                {
                    "severity": "error",
                    "code": "not-found",
                    "diagnostics": f"Resource {resource_type}/{resource_id} tidak ditemukan pada repositori ClaimTrace FHIR."
                }
            ]
        }
    )

@fhir_router.post("/{resource_type}")
def create_fhir_resource(resource_type: str, payload: Dict[str, Any]):
    """
    Handles FHIR 'create' interaction with SATUSEHAT validation.
    Enforces NIK format and ICD-10 diagnostic standard checks.
    Consumed by standard FHIR gateways and SIMRS/HIS adapters.
    """
    validation_issues = []
    claimed_type = payload.get("resourceType")
    if claimed_type and claimed_type.lower() != resource_type.lower():
        validation_issues.append({
            "severity": "error",
            "code": "structure",
            "diagnostics": f"Mismatched resourceType: URL '{resource_type}' but payload specifies '{claimed_type}'."
        })

    # 1. Validate NIK on Patient per SATUSEHAT specs (16 digits)
    if resource_type.lower() == "patient":
        identifiers = payload.get("identifier", [])
        for ident in identifiers:
            system = str(ident.get("system", ""))
            val = str(ident.get("value", ""))
            if "nik" in system.lower() or "kemkes.go.id/id/nik" in system:
                if not (val.isdigit() and len(val) == 16):
                    validation_issues.append({
                        "severity": "error",
                        "code": "value",
                        "diagnostics": f"Format NIK tidak valid: '{val}'. SATUSEHAT mewajibkan 16 digit numerik (KMK HK.01.07/MENKES/1423/2022).",
                        "expression": ["Patient.identifier"]
                    })

    # 2. Validate ICD-10 on Condition per SATUSEHAT / WHO ICD-10 specs
    if resource_type.lower() == "condition":
        code_obj = payload.get("code", {})
        codings = code_obj.get("coding", [])
        for c in codings:
            system = str(c.get("system", ""))
            code_val = str(c.get("code", "")).strip()
            if "icd-10" in system.lower():
                if not re.match(r"^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$", code_val):
                    validation_issues.append({
                        "severity": "error",
                        "code": "value",
                        "diagnostics": f"Format kode ICD-10 tidak valid: '{code_val}'. Standar ICD-10 WHO / PMK 24/2022 mewajibkan huruf kapital diikuti 2 digit angka.",
                        "expression": ["Condition.code.coding"]
                    })
                elif not icd10_service.is_valid_code(code_val):
                    validation_issues.append({
                        "severity": "error",
                        "code": "code-invalid",
                        "diagnostics": f"Kode diagnosis ICD-10 '{code_val}' tidak terdaftar dalam Master Data ICD-10 WHO & Kemenkes RI (10.469 kode).",
                        "expression": ["Condition.code.coding"]
                    })

    from app.engine.fhir_extensions import (
        validate_fhir_resource_payload,
        store_custom_fhir_resource,
        merge_custom_fhir_resources,
        extract_claim_audit_context,
        build_claim_response,
    )

    if resource_type in ("Bundle", "MedicationRequest", "Claim"):
        validation_issues.extend(validate_fhir_resource_payload(resource_type, payload))

    if validation_issues:
        return JSONResponse(
            status_code=422,
            content={
                "resourceType": "OperationOutcome",
                "issue": validation_issues
            }
        )

    stored = store_custom_fhir_resource(resource_type, payload)
    if resource_type == "Bundle":
        for entry in payload.get("entry", []):
            res = (entry or {}).get("resource") if isinstance(entry, dict) else None
            if isinstance(res, dict) and res.get("resourceType"):
                store_custom_fhir_resource(str(res["resourceType"]), res)

    return JSONResponse(
        content=stored,
        status_code=201,
        headers={"Location": f"/fhir/{resource_type}/{stored['id']}"}
    )


_orig_get_all_fhir_resources = get_all_fhir_resources


def get_all_fhir_resources() -> Dict[str, Any]:
    from app.engine.fhir_extensions import merge_custom_fhir_resources

    return merge_custom_fhir_resources(_orig_get_all_fhir_resources())


@fhir_router.post("/Claim/$submit")
def submit_fhir_claim_operation(payload: Dict[str, Any]):
    """
    SATUSEHAT HL7 FHIR R4 Claim/$submit operation.
    Validates either a FHIR Claim (with optional contained resources) or a full FHIR Bundle,
    runs ICD-10 Rule MB1-MB5, Fornas compliance, and DeepClaimAuditEngine adjudication,
    returning HTTP 201 ClaimResponse or HTTP 422 OperationOutcome.
    """
    from app.engine.fhir_extensions import (
        validate_fhir_resource_payload,
        store_custom_fhir_resource,
        extract_claim_audit_context,
        build_claim_response,
    )
    from app.engine.icd10_morbidity_auditor import audit_morbidity_rules, audit_fornas_compliance
    from app.engine.rule_engine import DeepClaimAuditEngine

    if not isinstance(payload, dict):
        return JSONResponse(
            status_code=422,
            content={
                "resourceType": "OperationOutcome",
                "issue": [{"severity": "error", "code": "structure", "diagnostics": "Payload must be a JSON object."}],
            },
        )

    rtype = payload.get("resourceType", "Claim")
    issues = validate_fhir_resource_payload(rtype, payload)
    if issues:
        return JSONResponse(
            status_code=422,
            content={"resourceType": "OperationOutcome", "issue": issues},
        )

    store_custom_fhir_resource(rtype, payload)
    ctx = extract_claim_audit_context(payload)
    claim_obj = ctx.get("claim") or {}
    total_rp = float(((claim_obj.get("total") or {}).get("value")) or 0.0)
    ina_cbg_code = ""
    for item in claim_obj.get("item", []):
        for c in ((item or {}).get("productOrService") or {}).get("coding", []):
            if "ina-cbg" in str((c or {}).get("system", "")).lower():
                ina_cbg_code = str(c.get("code", "")).upper()

    morbidity_report = audit_morbidity_rules(
        primary_icd10=ctx.get("primary_icd10", ""),
        secondary_icd10s=ctx.get("secondary_icd10s", []),
        procedure_icd9cm=ctx.get("procedures", []),
        tarif_klaim_rp=total_rp,
    )
    fornas_report = audit_fornas_compliance(
        medications=ctx.get("medications", []),
        all_icd10_codes=ctx.get("all_icd10s", []),
    )
    deep_report = DeepClaimAuditEngine.audit_claim_clinical_validity(
        {
            "claim_id": claim_obj.get("id", "CLM-FHIR-SUBMIT"),
            "ina_cbg_code": ina_cbg_code or "Z-3-12-0",
            "tariff_rupiah": total_rp,
            "diagnosis_primer": ctx.get("primary_icd10", ""),
            "diagnosis_sekunder": ctx.get("secondary_icd10s", []),
            "procedure_codes": ctx.get("procedures", []),
            "clinical_notes": " ".join(ctx.get("medications", [])),
        }
    )

    claim_response = build_claim_response(
        request_payload=payload,
        context=ctx,
        morbidity_report=morbidity_report,
        fornas_report=fornas_report,
        deep_audit_report=deep_report,
    )
    store_custom_fhir_resource("ClaimResponse", claim_response)
    return JSONResponse(
        content=claim_response,
        status_code=201,
        headers={"Location": f"/fhir/ClaimResponse/{claim_response['id']}"},
    )

