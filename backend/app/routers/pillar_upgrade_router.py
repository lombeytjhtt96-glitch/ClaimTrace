"""
ClaimTrace JKN - Modular Pillar Upgrade Router
Exposes:
1. Live SQL Provider Fraud Profiling (1.699M bpjs_fkrtl_all cohorts, HHI, ALOS, LOS CV)
2. WHO / Permenkes 76/2016 Rule MB1-MB5 Morbidity Coding, Fornas & <30D Readmission Audit
3. Real Claim Document Bundle Submission & Effective Audit (replacing unlabeled synthetic fallback)
4. Formal Claims Appeals / Sanggahan BAKB with Perpres 82/2018 Pasal 76 15-Day SLA & Penalty Tracker
"""

from __future__ import annotations

import uuid
from dataclasses import asdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from app.security.audit_log import get_audit_logger
from app.engine.appeals_engine import (
    adjudicate_appeal,
    list_appeals,
    submit_appeal,
)
from app.engine.document_bundle_store import (
    delete_submitted_bundle,
    get_submitted_bundle,
    list_submitted_bundles,
    save_submitted_bundle,
)
from app.engine.icd10_morbidity_auditor import (
    audit_fornas_compliance,
    audit_morbidity_rules,
    check_30d_readmission,
)
from app.engine.warehouse_fraud_profiler import warehouse_fraud_profiler

pillar_router = APIRouter(tags=["ClaimTrace JKN Pillars"])
audit_logger = get_audit_logger()


def _resolve_actor(request: Request, fallback: str = "Verifikator JKN") -> str:
    """Resolve authenticated actor from cookie or Bearer header without failing test mode."""
    token = request.cookies.get("claimtrace_access_token")
    if not token:
        auth_hdr = request.headers.get("authorization", "")
        if auth_hdr.lower().startswith("bearer "):
            token = auth_hdr[7:].strip()
    if token:
        try:
            from app.security.token_manager import verify_access_token

            payload = verify_access_token(token)
            if payload and payload.get("sub"):
                return str(payload["sub"])
        except Exception:
            pass
    return fallback


# ---------------------------------------------------------------------------
# Pydantic Request Schemas
# ---------------------------------------------------------------------------


class EncounterItem(BaseModel):
    claim_id: str = "ENC-001"
    admission_date: str
    discharge_date: Optional[str] = None
    primary_icd10: Optional[str] = None
    is_inpatient: bool = True


class MorbidityAuditRequest(BaseModel):
    primary_icd10: str = Field(..., min_length=2, max_length=16)
    secondary_icd10s: List[str] = Field(default_factory=list, max_length=30)
    procedure_icd9cm: List[str] = Field(default_factory=list, max_length=20)
    patient_age: Optional[int] = Field(default=None, ge=0, le=125)
    patient_sex: Optional[str] = Field(default=None, max_length=16)
    tarif_klaim_rp: float = Field(default=0.0, ge=0.0)
    medications: List[str] = Field(default_factory=list, max_length=30)
    clinical_notes: str = Field(default="", max_length=4000)
    pstv01: Optional[int] = Field(default=None, ge=1)
    encounters: Optional[List[EncounterItem]] = None


class ReadmissionCheckRequest(BaseModel):
    pstv01: Optional[int] = Field(default=None, ge=1)
    encounters: Optional[List[EncounterItem]] = None
    window_days: int = Field(default=30, ge=1, le=180)


class SubmittedDocumentInput(BaseModel):
    doc_id: Optional[str] = None
    doc_type: str = Field(..., min_length=2, max_length=40)
    doc_title: Optional[str] = None
    file_name: Optional[str] = None
    file_size_kb: int = Field(default=240, ge=1, le=102400)
    faskes_code: str = Field(default="0114R001", max_length=32)
    dpjp_name: str = Field(default="dr. Hendra Wijaya, Sp.PD", max_length=120)
    dpjp_sip: str = Field(default="SIP-3372-2026-001", max_length=64)
    patient_id_token: str = Field(default="PST-ANON-JKN", max_length=64)
    is_signed_electronically: bool = True
    is_stamp_valid: bool = True
    ocr_confidence_pct: float = Field(default=96.5, ge=0.0, le=100.0)
    extracted_text_snippet: str = Field(default="", max_length=2000)
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)


class SubmitDocumentBundleRequest(BaseModel):
    claim_id: str = Field(..., min_length=3, max_length=64)
    ina_cbg_code: str = Field(default="Z-3-12-0", max_length=24)
    primary_icd10: str = Field(default="M54.5", max_length=16)
    secondary_icd10s: List[str] = Field(default_factory=list, max_length=30)
    procedure_icd9cm: Optional[str] = Field(default=None, max_length=24)
    claimed_tariff_rp: float = Field(default=0.0, ge=0.0)
    documents: List[SubmittedDocumentInput] = Field(..., min_length=1, max_length=25)


class SubmitAppealRequest(BaseModel):
    claim_id: str = Field(..., min_length=3, max_length=64)
    bakb_number: Optional[str] = Field(default=None, max_length=64)
    faskes_name: str = Field(..., min_length=2, max_length=160)
    appeal_category: str = Field(default="DOCUMENT_COMPLETENESS", max_length=64)
    disputed_amount_rp: float = Field(..., gt=0.0)
    clinical_argument: str = Field(..., min_length=10, max_length=4000)
    supporting_documents: List[str] = Field(default_factory=list, max_length=20)
    proposed_icd10: Optional[str] = Field(default=None, max_length=16)
    submitted_date_override: Optional[str] = Field(default=None, max_length=16)


class AdjudicateAppealRequest(BaseModel):
    decision: str = Field(..., min_length=3, max_length=40)
    approved_amount_rp: float = Field(default=0.0, ge=0.0)
    resolution_note: str = Field(..., min_length=5, max_length=2000)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _serialize_document_report(report: Any) -> Dict[str, Any]:
    if hasattr(report, "__dataclass_fields__"):
        return asdict(report)
    if isinstance(report, dict):
        return report
    return dict(report)


def _to_document_metadata_list(items: List[Dict[str, Any]]) -> List[Any]:
    from app.engine.document_auditor import DocumentMetadata

    now_iso = datetime.now(timezone.utc).isoformat()
    docs = []
    for idx, item in enumerate(items):
        dtype = str(item.get("doc_type", "SEP")).strip().upper()
        docs.append(
            DocumentMetadata(
                doc_id=item.get("doc_id") or f"DOC-REAL-{idx + 1}-{uuid.uuid4().hex[:6].upper()}",
                doc_type=dtype,
                doc_title=item.get("doc_title") or f"Berkas {dtype.replace('_', ' ')}",
                file_name=item.get("file_name") or f"{dtype.lower()}_submitted.pdf",
                file_size_kb=int(item.get("file_size_kb") or 240),
                upload_timestamp=item.get("upload_timestamp") or now_iso,
                faskes_code=item.get("faskes_code") or "0114R001",
                dpjp_name=item.get("dpjp_name") or "DPJP Faskes",
                dpjp_sip=item.get("dpjp_sip") or "SIP-TERVALIDASI",
                patient_id_token=item.get("patient_id_token") or "PST-ANON-JKN",
                is_signed_electronically=bool(item.get("is_signed_electronically", True)),
                is_stamp_valid=bool(item.get("is_stamp_valid", True)),
                ocr_confidence_pct=float(item.get("ocr_confidence_pct") or 96.5),
                extracted_text_snippet=item.get("extracted_text_snippet") or f"Dokumen {dtype} diunggah resmi oleh Faskes.",
                extracted_fields=dict(item.get("extracted_fields") or {}),
            )
        )
    return docs


# ---------------------------------------------------------------------------
# Pillar 1 Routes: Live SQL Warehouse Fraud Profiling
# ---------------------------------------------------------------------------


@pillar_router.get("/api/v1/analytics/fraud-ranking/warehouse-clusters")
def get_warehouse_provider_clusters(
    kelas_filter: Optional[str] = Query(default=None),
    min_claims: int = Query(default=500, ge=50, le=50000),
    force_refresh: bool = Query(default=False),
) -> Dict[str, Any]:
    """Return live SQL provider-cohort metrics over 1.699M bpjs_fkrtl_all rows."""
    return warehouse_fraud_profiler.get_warehouse_clusters(
        kelas_filter=kelas_filter,
        min_claims=min_claims,
        force_refresh=force_refresh,
    )


# ---------------------------------------------------------------------------
# Pillar 2 Routes: Rule MB1-MB5, Fornas, Readmission 30D & Real Documents
# ---------------------------------------------------------------------------


@pillar_router.post("/api/v1/clinical/morbidity-audit")
def evaluate_clinical_morbidity_audit(req: MorbidityAuditRequest) -> Dict[str, Any]:
    """Evaluate WHO/Permenkes 76/2016 Rule MB1-MB5, Age/Sex plausibility, Fornas & Readmission."""
    morbidity = audit_morbidity_rules(
        primary_icd10=req.primary_icd10,
        secondary_icd10s=req.secondary_icd10s,
        procedure_icd9cm=req.procedure_icd9cm,
        patient_age=req.patient_age,
        patient_sex=req.patient_sex,
        tarif_klaim_rp=req.tarif_klaim_rp,
    )
    all_codes = [req.primary_icd10] + list(req.secondary_icd10s)
    fornas = audit_fornas_compliance(
        medications=req.medications,
        all_icd10_codes=all_codes,
        clinical_notes=req.clinical_notes,
    )
    readmission = None
    if req.pstv01 is not None or req.encounters:
        readmission = check_30d_readmission(
            pstv01=req.pstv01,
            encounters=[e.model_dump() for e in req.encounters] if req.encounters else None,
        )

    return {
        "morbidity_audit": morbidity,
        "fornas_audit": fornas,
        "readmission_audit": readmission,
    }


@pillar_router.post("/api/v1/clinical/readmission-30d")
def check_patient_readmission_window(req: ReadmissionCheckRequest) -> Dict[str, Any]:
    """Check <30-day same-patient readmission using encounter history or live bpjs_fkrtl_all PSTV01 lookup."""
    if req.pstv01 is None and not req.encounters:
        raise HTTPException(
            status_code=422,
            detail="Harap sertakan minimal 'pstv01' peserta atau daftar 'encounters'.",
        )
    return check_30d_readmission(
        pstv01=req.pstv01,
        encounters=[e.model_dump() for e in req.encounters] if req.encounters else None,
        window_days=req.window_days,
    )


@pillar_router.post("/api/v1/documents/audit/submit")
def submit_and_audit_real_documents(req: SubmitDocumentBundleRequest, request: Request) -> Dict[str, Any]:
    """Persist Faskes-submitted real document bundle and run full Document + ICD-10 MB1-MB5 audit."""
    from app.engine.document_auditor import document_auditor

    actor = _resolve_actor(request)
    raw_docs = [d.model_dump() for d in req.documents]
    saved = save_submitted_bundle(
        claim_id=req.claim_id,
        documents=raw_docs,
        submitted_by=actor,
        ina_cbg_code=req.ina_cbg_code,
        primary_icd10=req.primary_icd10,
        secondary_icd10s=req.secondary_icd10s,
        procedure_icd9cm=req.procedure_icd9cm,
        claimed_tariff_rp=req.claimed_tariff_rp,
    )
    meta_docs = _to_document_metadata_list(raw_docs)
    report = document_auditor.audit_claim_document_bundle(
        claim_id=saved["claim_id"],
        ina_cbg_code=saved["ina_cbg_code"],
        primary_icd10=saved["primary_icd10"],
        procedure_icd9cm=saved["procedure_icd9cm"],
        claimed_tariff_rp=saved["claimed_tariff_rp"],
        documents=meta_docs,
    )
    payload = _serialize_document_report(report)
    payload["bundle_source"] = "submitted_real"
    payload["is_synthetic_baseline"] = False
    payload["submitted_by"] = actor
    payload["submitted_at"] = saved["submitted_at"]
    payload["morbidity_audit"] = audit_morbidity_rules(
        primary_icd10=saved["primary_icd10"],
        secondary_icd10s=saved.get("secondary_icd10s", []),
        procedure_icd9cm=[saved["procedure_icd9cm"]] if saved.get("procedure_icd9cm") else [],
        tarif_klaim_rp=saved["claimed_tariff_rp"],
    )

    audit_logger.record_event(
        event_type="REAL_DOCUMENT_BUNDLE_SUBMITTED",
        claim_id=saved["claim_id"],
        actor=actor,
        payload={
            "doc_count": len(raw_docs),
            "ina_cbg_code": saved["ina_cbg_code"],
            "overall_doc_status": payload.get("overall_doc_status"),
            "mb_findings": payload["morbidity_audit"]["total_findings"],
        },
    )
    return payload


@pillar_router.get("/api/v1/documents/audit/submitted")
def list_submitted_document_bundles() -> Dict[str, Any]:
    """List all Faskes-submitted real document bundles."""
    items = list_submitted_bundles()
    return {"total": len(items), "bundles": items}


@pillar_router.get("/api/v1/documents/audit/effective/{claim_id}")
def get_effective_document_audit(
    claim_id: str,
    ina_cbg_code: str = Query(default="Z-3-12-0"),
    primary_icd10: str = Query(default="M54.5"),
    procedure_icd9cm: Optional[str] = Query(default=None),
    claimed_tariff_rp: float = Query(default=0.0, ge=0.0),
) -> Dict[str, Any]:
    """Audit real submitted bundle when present, otherwise fall back to clearly labeled synthetic baseline."""
    from app.engine.document_auditor import document_auditor

    saved = get_submitted_bundle(claim_id)
    if saved:
        meta_docs = _to_document_metadata_list(saved.get("documents", []))
        report = document_auditor.audit_claim_document_bundle(
            claim_id=saved["claim_id"],
            ina_cbg_code=saved.get("ina_cbg_code", ina_cbg_code),
            primary_icd10=saved.get("primary_icd10", primary_icd10),
            procedure_icd9cm=saved.get("procedure_icd9cm") or procedure_icd9cm,
            claimed_tariff_rp=float(saved.get("claimed_tariff_rp") or claimed_tariff_rp or 0.0),
            documents=meta_docs,
        )
        payload = _serialize_document_report(report)
        payload["bundle_source"] = "submitted_real"
        payload["is_synthetic_baseline"] = False
        payload["submitted_by"] = saved.get("submitted_by")
        payload["submitted_at"] = saved.get("submitted_at")
        payload["morbidity_audit"] = audit_morbidity_rules(
            primary_icd10=saved.get("primary_icd10", primary_icd10),
            secondary_icd10s=saved.get("secondary_icd10s", []),
            procedure_icd9cm=[saved["procedure_icd9cm"]] if saved.get("procedure_icd9cm") else [],
            tarif_klaim_rp=float(saved.get("claimed_tariff_rp") or 0.0),
        )
        return payload

    report = document_auditor.audit_claim_document_bundle(
        claim_id=claim_id,
        ina_cbg_code=ina_cbg_code,
        primary_icd10=primary_icd10,
        procedure_icd9cm=procedure_icd9cm,
        claimed_tariff_rp=claimed_tariff_rp,
    )
    payload = _serialize_document_report(report)
    payload["bundle_source"] = "synthetic_reference"
    payload["is_synthetic_baseline"] = True
    payload["morbidity_audit"] = audit_morbidity_rules(
        primary_icd10=primary_icd10,
        procedure_icd9cm=[procedure_icd9cm] if procedure_icd9cm else [],
        tarif_klaim_rp=claimed_tariff_rp,
    )
    return payload


@pillar_router.delete("/api/v1/documents/audit/submitted/{claim_id}")
def remove_submitted_document_bundle(claim_id: str, request: Request) -> Dict[str, Any]:
    """Remove a submitted real document bundle so claim reverts to synthetic reference baseline."""
    actor = _resolve_actor(request)
    deleted = delete_submitted_bundle(claim_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Submitted document bundle for '{claim_id}' not found.")
    audit_logger.record_event(
        event_type="REAL_DOCUMENT_BUNDLE_REMOVED",
        claim_id=claim_id.upper(),
        actor=actor,
        payload={"action": "revert_to_reference"},
    )
    return {"status": "deleted", "claim_id": claim_id.upper()}


# ---------------------------------------------------------------------------
# Pillar 3 Routes: Formal Claims Appeals / Sanggahan BAKB (15-Day SLA)
# ---------------------------------------------------------------------------


@pillar_router.get("/api/v1/appeals")
def get_claims_appeals(status_filter: Optional[str] = Query(default=None)) -> Dict[str, Any]:
    """List formal Sanggahan BAKB appeals with Perpres 82/2018 Pasal 76 15-day SLA & penalty tracking."""
    return list_appeals(status_filter=status_filter)


@pillar_router.post("/api/v1/appeals/submit")
def create_claim_appeal(req: SubmitAppealRequest, request: Request) -> Dict[str, Any]:
    """Submit a formal Faskes Sanggahan BAKB dossier against hold/rejection."""
    actor = _resolve_actor(request, fallback="Tim JKN Faskes")
    created = submit_appeal(
        claim_id=req.claim_id,
        faskes_name=req.faskes_name,
        appeal_category=req.appeal_category,
        disputed_amount_rp=req.disputed_amount_rp,
        clinical_argument=req.clinical_argument,
        supporting_documents=req.supporting_documents,
        submitted_by=actor,
        bakb_number=req.bakb_number,
        proposed_icd10=req.proposed_icd10,
        submitted_date_override=req.submitted_date_override,
    )
    audit_logger.record_event(
        event_type="CLAIM_APPEAL_SUBMITTED",
        claim_id=created["claim_id"],
        actor=actor,
        payload={
            "appeal_id": created["appeal_id"],
            "category": created["appeal_category"],
            "disputed_amount_rp": created["disputed_amount_rp"],
            "sla_deadline": created["sla_deadline"],
        },
    )
    return {"status": "submitted", "appeal": created}


@pillar_router.post("/api/v1/appeals/{appeal_id}/adjudicate")
def adjudicate_claim_appeal(appeal_id: str, req: AdjudicateAppealRequest, request: Request) -> Dict[str, Any]:
    """Adjudicate a formal Sanggahan BAKB appeal with final payment recovery disposition."""
    actor = _resolve_actor(request, fallback="Verifikator Senior BPJS")
    updated = adjudicate_appeal(
        appeal_id=appeal_id,
        decision=req.decision,
        approved_amount_rp=req.approved_amount_rp,
        resolution_note=req.resolution_note,
        resolved_by=actor,
    )
    if updated is None:
        raise HTTPException(status_code=404, detail=f"Sanggahan '{appeal_id}' tidak ditemukan.")

    audit_logger.record_event(
        event_type="CLAIM_APPEAL_ADJUDICATED",
        claim_id=updated["claim_id"],
        actor=actor,
        payload={
            "appeal_id": updated["appeal_id"],
            "decision": updated["status"],
            "recovered_amount_rp": updated["recovered_amount_rp"],
        },
    )
    return {"status": "adjudicated", "appeal": updated}
