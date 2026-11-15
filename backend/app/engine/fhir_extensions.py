"""
ClaimTrace JKN - SATUSEHAT HL7 FHIR R4 Validation, Bundle & Claim/$submit Extensions
Provides persistent thread-safe custom FHIR resource storage, strict R4 Bundle
and MedicationRequest KFA validators returning OperationOutcome issues, and
ClaimResponse adjudication builder for POST /fhir/Claim/$submit.
"""

from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

_STORE_LOCK = threading.Lock()
_CUSTOM_FHIR_RESOURCES: Dict[str, Dict[str, Dict[str, Any]]] = {}

SUPPORTED_WRITE_RESOURCE_TYPES = (
    "Patient",
    "Practitioner",
    "Organization",
    "Encounter",
    "Condition",
    "Procedure",
    "MedicationRequest",
    "Claim",
    "ClaimResponse",
    "Bundle",
    "RiskAssessment",
    "Provenance",
)


def store_custom_fhir_resource(resource_type: str, resource: Dict[str, Any]) -> Dict[str, Any]:
    """Store a created FHIR resource thread-safely and return it with guaranteed id."""
    stored = dict(resource)
    stored["resourceType"] = resource_type
    if not stored.get("id"):
        stored["id"] = f"{resource_type.lower()}-{uuid.uuid4().hex[:10]}"
    meta = dict(stored.get("meta") or {})
    meta["lastUpdated"] = datetime.now(timezone.utc).isoformat()
    stored["meta"] = meta

    with _STORE_LOCK:
        bucket = _CUSTOM_FHIR_RESOURCES.setdefault(resource_type, {})
        bucket[stored["id"]] = stored
    return stored


def merge_custom_fhir_resources(base_store: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Merge persisted custom FHIR resources into the flat {type/id: resource} index."""
    with _STORE_LOCK:
        for rtype, items in _CUSTOM_FHIR_RESOURCES.items():
            rtype_low = rtype.lower()
            for rid, res in items.items():
                base_store[f"{rtype_low}/{str(rid).lower()}"] = res
    return base_store


def _issue(severity: str, code: str, diagnostics: str, expression: Optional[str] = None) -> Dict[str, Any]:
    item: Dict[str, Any] = {
        "severity": severity,
        "code": code,
        "diagnostics": diagnostics,
    }
    if expression:
        item["expression"] = [expression]
    return item


def validate_fhir_resource_payload(
    resource_type: str,
    payload: Dict[str, Any],
    prefix: str = "",
) -> List[Dict[str, Any]]:
    """
    Validate SATUSEHAT HL7 FHIR R4 resource constraints cleanly.
    Preserves existing lenient Patient/Condition/Claim behavior when optional
    nested blocks are omitted (for full backward compatibility).
    """
    from app.engine.icd10_service import icd10_service
    import re

    issues: List[Dict[str, Any]] = []
    path = f"{prefix}." if prefix else ""

    if not isinstance(payload, dict):
        issues.append(_issue("error", "structure", "FHIR resource payload must be a JSON object.", prefix or resource_type))
        return issues

    if resource_type == "Patient":
        for idx, ident in enumerate(payload.get("identifier", [])):
            if not isinstance(ident, dict):
                continue
            sys_uri = str(ident.get("system", ""))
            val = str(ident.get("value", ""))
            sys_low = sys_uri.lower()
            is_nik_field = "nik" in sys_low or not sys_uri
            if is_nik_field and len(val) > 0:
                is_raw_nik = bool(re.match(r"^\d{16}$", val))
                is_uupdp_masked_nik = bool(re.match(r"^\d{6}\*{4,8}\d{4}$", val))
                if not (is_raw_nik or is_uupdp_masked_nik):
                    issues.append(
                        _issue(
                            "error",
                            "value",
                            f"SATUSEHAT Patient NIK '{val}' tidak valid (wajib tepat 16 digit numerik).",
                            f"{path}Patient.identifier[{idx}].value",
                        )
                    )

    elif resource_type == "Condition":
        ina_cbg_who_extensions = {"N18.5", "K35.8"}
        codings = (payload.get("code") or {}).get("coding", [])
        if not codings:
            issues.append(
                _issue(
                    "error",
                    "required",
                    "Resource Condition wajib memiliki code.coding dengan terminologi ICD-10.",
                    f"{path}Condition.code.coding",
                )
            )
        for idx, c in enumerate(codings):
            code_val = str((c or {}).get("code", "")).strip().upper()
            if not re.match(r"^[A-Z]\d{2}(\.[0-9A-Z]{1,4})?$", code_val):
                issues.append(
                    _issue(
                        "error",
                        "code-invalid",
                        f"Kode ICD-10 '{code_val}' tidak memenuhi format standar WHO/SATUSEHAT.",
                        f"{path}Condition.code.coding[{idx}].code",
                    )
                )
            elif not (icd10_service.is_valid_code(code_val) or code_val in ina_cbg_who_extensions):
                issues.append(
                    _issue(
                        "error",
                        "code-invalid",
                        f"Kode ICD-10 '{code_val}' tidak terdaftar pada master terminologi ICD-10 ClaimTrace.",
                        f"{path}Condition.code.coding[{idx}].code",
                    )
                )

    elif resource_type == "MedicationRequest":
        med_cc = payload.get("medicationCodeableConcept")
        med_ref = payload.get("medicationReference")
        if not med_cc and not med_ref:
            issues.append(
                _issue(
                    "error",
                    "required",
                    "MedicationRequest wajib menyertakan medicationCodeableConcept (KFA) atau medicationReference.",
                    f"{path}MedicationRequest.medicationCodeableConcept",
                )
            )
        elif isinstance(med_cc, dict):
            codings = med_cc.get("coding", [])
            if codings:
                for idx, c in enumerate(codings):
                    sys_uri = str((c or {}).get("system", "")).lower()
                    code_val = str((c or {}).get("code", "")).strip()
                    if not code_val:
                        issues.append(
                            _issue(
                                "error",
                                "required",
                                "Coding obat MedicationRequest wajib memiliki kode KFA/ATC yang valid.",
                                f"{path}MedicationRequest.medicationCodeableConcept.coding[{idx}].code",
                            )
                        )
                    elif sys_uri and ("kfa" not in sys_uri and "kemkes" not in sys_uri and "atc" not in sys_uri):
                        issues.append(
                            _issue(
                                "error",
                                "value",
                                f"Sistem terminologi obat '{sys_uri}' bukan URI resmi SATUSEHAT KFA (http://sys-ids.kemkes.go.id/kfa).",
                                f"{path}MedicationRequest.medicationCodeableConcept.coding[{idx}].system",
                            )
                        )

    elif resource_type == "Claim":
        # Check any provided diagnosis coding elements strictly, while keeping minimal {"use","total"} valid
        for idx, diag in enumerate(payload.get("diagnosis", [])):
            cc = (diag or {}).get("diagnosisCodeableConcept") or {}
            for cidx, c in enumerate(cc.get("coding", [])):
                code_val = str((c or {}).get("code", "")).strip().upper()
                if code_val and not re.match(r"^[A-Z]\d{2}(\.[0-9A-Z]{1,4})?$", code_val):
                    issues.append(
                        _issue(
                            "error",
                            "code-invalid",
                            f"Diagnosis Klaim ke-{idx + 1} kode '{code_val}' tidak sesuai format ICD-10.",
                            f"{path}Claim.diagnosis[{idx}].diagnosisCodeableConcept.coding[{cidx}].code",
                        )
                    )
        total_val = ((payload.get("total") or {}).get("value")) if isinstance(payload.get("total"), dict) else None
        if total_val is not None:
            try:
                if float(total_val) <= 0:
                    issues.append(
                        _issue(
                            "error",
                            "value",
                            "Nilai total klaim (Claim.total.value) harus lebih besar dari 0 Rupiah.",
                            f"{path}Claim.total.value",
                        )
                    )
            except (TypeError, ValueError):
                issues.append(
                    _issue(
                        "error",
                        "value",
                        "Nilai Claim.total.value harus berupa angka numerik.",
                        f"{path}Claim.total.value",
                    )
                )

    elif resource_type == "Bundle":
        btype = str(payload.get("type", "")).lower()
        if btype not in ("collection", "transaction", "batch", "document", "message"):
            issues.append(
                _issue(
                    "error",
                    "value",
                    f"Bundle.type '{payload.get('type')}' tidak valid. Gunakan 'transaction', 'collection', atau 'document'.",
                    "Bundle.type",
                )
            )
        entries = payload.get("entry")
        if not isinstance(entries, list) or len(entries) == 0:
            issues.append(
                _issue(
                    "error",
                    "required",
                    "FHIR Bundle wajib memuat minimal 1 entry resource.",
                    "Bundle.entry",
                )
            )
        else:
            for i, entry in enumerate(entries):
                res = (entry or {}).get("resource") if isinstance(entry, dict) else None
                if not isinstance(res, dict) or not res.get("resourceType"):
                    issues.append(
                        _issue(
                            "error",
                            "required",
                            f"Bundle.entry[{i}].resource wajib memiliki field 'resourceType'.",
                            f"Bundle.entry[{i}].resource.resourceType",
                        )
                    )
                    continue
                sub_rtype = str(res["resourceType"])
                if sub_rtype not in SUPPORTED_WRITE_RESOURCE_TYPES:
                    issues.append(
                        _issue(
                            "error",
                            "not-supported",
                            f"ResourceType '{sub_rtype}' pada Bundle.entry[{i}] tidak didukung server SATUSEHAT ClaimTrace.",
                            f"Bundle.entry[{i}].resource.resourceType",
                        )
                    )
                    continue
                if sub_rtype != "Bundle":
                    issues.extend(validate_fhir_resource_payload(sub_rtype, res, prefix=f"Bundle.entry[{i}].resource"))

    return issues


def extract_claim_audit_context(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract Claim, Conditions (ICD-10), Medications (KFA), and Procedures (ICD-9-CM)
    from either a direct FHIR Claim (including contained resources) or a FHIR Bundle.
    """
    claim_res: Dict[str, Any] = {}
    conditions: List[str] = []
    medications: List[str] = []
    procedures: List[str] = []

    def _collect_from_resource(res: Dict[str, Any]) -> None:
        nonlocal claim_res
        rt = res.get("resourceType")
        if rt == "Claim" and not claim_res:
            claim_res = res
            for diag in res.get("diagnosis", []):
                cc = (diag or {}).get("diagnosisCodeableConcept") or {}
                for c in cc.get("coding", []):
                    code = str((c or {}).get("code", "")).strip().upper()
                    if code:
                        conditions.append(code)
            for proc in res.get("procedure", []):
                cc = (proc or {}).get("procedureCodeableConcept") or {}
                for c in cc.get("coding", []):
                    code = str((c or {}).get("code", "")).strip().upper()
                    if code:
                        procedures.append(code)
            for sub in res.get("contained", []):
                if isinstance(sub, dict):
                    _collect_from_resource(sub)
        elif rt == "Condition":
            for c in ((res.get("code") or {}).get("coding", [])):
                code = str((c or {}).get("code", "")).strip().upper()
                if code:
                    conditions.append(code)
        elif rt == "MedicationRequest":
            cc = res.get("medicationCodeableConcept") or {}
            text = str(cc.get("text", "")).strip()
            if text:
                medications.append(text)
            for c in cc.get("coding", []):
                disp = str((c or {}).get("display") or (c or {}).get("code") or "").strip()
                if disp:
                    medications.append(disp)
        elif rt == "Procedure":
            for c in ((res.get("code") or {}).get("coding", [])):
                code = str((c or {}).get("code", "")).strip().upper()
                if code:
                    procedures.append(code)

    if payload.get("resourceType") == "Bundle":
        for entry in payload.get("entry", []):
            res = (entry or {}).get("resource")
            if isinstance(res, dict):
                _collect_from_resource(res)
    else:
        if not payload.get("resourceType"):
            payload = {**payload, "resourceType": "Claim"}
        _collect_from_resource(payload)

    dedup_icd: List[str] = []
    for c in conditions:
        if c not in dedup_icd:
            dedup_icd.append(c)

    dedup_proc: List[str] = []
    for p in procedures:
        if p not in dedup_proc:
            dedup_proc.append(p)

    return {
        "claim": claim_res,
        "primary_icd10": dedup_icd[0] if dedup_icd else "",
        "secondary_icd10s": dedup_icd[1:],
        "all_icd10s": dedup_icd,
        "procedures": dedup_proc,
        "medications": medications,
    }


def build_claim_response(
    request_payload: Dict[str, Any],
    context: Dict[str, Any],
    morbidity_report: Dict[str, Any],
    fornas_report: Dict[str, Any],
    deep_audit_report: Dict[str, Any],
) -> Dict[str, Any]:
    """Construct an HL7 FHIR R4 ClaimResponse resource from ClaimTrace audit outputs."""
    claim_obj = context.get("claim") or {}
    claim_id = str(claim_obj.get("id") or f"claim-{uuid.uuid4().hex[:8]}")
    resp_id = f"claimresponse-{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    total_rp = float(((claim_obj.get("total") or {}).get("value")) or 0.0)
    saving_rp = float(deep_audit_report.get("total_potential_saving_rupiah", 0.0) or 0.0)
    mb_findings = morbidity_report.get("findings", [])
    fornas_flags = fornas_report.get("flags", [])
    deep_violations = deep_audit_report.get("violations", [])

    has_critical = any(
        f.get("severity") == "CRITICAL" for f in (mb_findings + fornas_flags + deep_violations)
    )
    has_any_issue = bool(mb_findings or fornas_flags or deep_violations)

    if has_critical:
        outcome = "error"
        disposition = "Klaim ditangguhkan (HOLD BAKB): ditemukan deviasi klinis/koding kritis yang memerlukan klarifikasi & sanggahan Faskes."
        adjudication_code = "denied"
    elif has_any_issue:
        outcome = "partial"
        disposition = "Klaim memerlukan penyesuaian koding/Fornas (PENDING KLARIFIKASI SLA 15 hari kalender Perpres 82/2018)."
        adjudication_code = "submitted"
    else:
        outcome = "complete"
        disposition = "Klaim lolos pra-verifikasi klinis, terminologi ICD-10 MB1-MB5, dan restriksi Fornas (LAYAK BAYAR)."
        adjudication_code = "benefit"

    benefit_rp = max(0.0, total_rp - saving_rp) if total_rp > 0 else 0.0

    response_resource: Dict[str, Any] = {
        "resourceType": "ClaimResponse",
        "id": resp_id,
        "status": "active",
        "type": claim_obj.get("type") or {
            "coding": [{"system": "http://terminology.hl7.org/CodeSystem/claim-type", "code": "institutional"}]
        },
        "use": claim_obj.get("use", "claim"),
        "patient": claim_obj.get("patient") or {"reference": "Patient/anonymous-jkn"},
        "created": now_iso,
        "insurer": {"display": "BPJS Kesehatan (ClaimTrace JKN Sovereign Verifier)"},
        "request": {"reference": f"Claim/{claim_id}"},
        "outcome": outcome,
        "disposition": disposition,
        "total": [
            {
                "category": {
                    "coding": [{"system": "http://terminology.hl7.org/CodeSystem/adjudication", "code": adjudication_code}]
                },
                "amount": {"value": benefit_rp, "currency": "IDR"},
            }
        ],
        "extension": [
            {
                "url": "https://claimtrace.bpjs.id/fhir/StructureDefinition/bakb-recommendation",
                "valueString": deep_audit_report.get("final_recommendation", "APPROVE_LANE_GREEN"),
            },
            {
                "url": "https://claimtrace.bpjs.id/fhir/StructureDefinition/morbidity-mb-findings-count",
                "valueInteger": len(mb_findings),
            },
            {
                "url": "https://claimtrace.bpjs.id/fhir/StructureDefinition/fornas-flags-count",
                "valueInteger": len(fornas_flags),
            },
        ],
        "claimtrace_adjudication": {
            "morbidity_audit": morbidity_report,
            "fornas_audit": fornas_report,
            "deep_audit": {
                "is_compliant": deep_audit_report.get("is_compliant", True),
                "final_recommendation": deep_audit_report.get("final_recommendation"),
                "total_potential_saving_rupiah": saving_rp,
                "violations": deep_violations,
                "bakb_number": (deep_audit_report.get("bakb_package") or {}).get("bakb_number"),
            },
        },
    }

    stored = store_custom_fhir_resource("ClaimResponse", response_resource)
    return stored
