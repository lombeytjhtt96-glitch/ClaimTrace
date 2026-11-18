"""
ClaimTrace JKN — Enterprise Admin & Governance Suite:
- SQLAdmin (`/sqladmin`) backed by PostgreSQL SQLAlchemy 2.0 Engine
- FastAPI-Admin Portal (`/admin-portal`) rendered via Jinja2
- PyCasbin RBAC Policy & Enforcement APIs
- SlowAPI Rate-Limited Governance Endpoints
- APScheduler + ARQ Cron Job Inspector
- FastAPI-Mail + Jinja2 Dispatch & Outbox APIs
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, FastAPI, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, Response
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pydantic import BaseModel, Field
from sqladmin import Admin, ModelView

from app.infra.backup_manager import get_backup_status
from app.infra.mailer import (
    TemplateNameLiteral,
    get_mailer_status,
    list_mail_outbox,
    send_templated_mail,
)
from app.infra.object_storage import (
    BUCKET_BACKUPS,
    BUCKET_DOCUMENTS,
    get_object_storage_status,
    list_bucket_objects,
    upload_object_bytes,
)
from app.infra.observability import get_observability_snapshot
from app.infra.postgres_db import (
    AsyncJobRunRecord,
    AuditLedgerBlockRecord,
    ClaimRecord,
    OperationsSnapshotRecord,
    get_postgres_engine,
    get_postgres_status,
    init_postgres_schema,
)
from app.infra.redis_client import get_redis_status
from app.infra.scheduler import get_scheduler_status
from app.security.casbin_rbac import enforce_policy, list_casbin_policies
from app.security.keycloak_oidc import build_pkce_authorization_url, get_keycloak_status
from app.security.pdf_signer import (
    build_bahv_pdf_bytes,
    get_pdf_signer_status,
    sign_pdf_bytes,
    verify_signed_pdf_bytes,
)
from app.security.slowapi_limiter import get_slowapi_status, limiter

ADMIN_TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates" / "admin"
_ADMIN_JINJA = Environment(
    loader=FileSystemLoader(str(ADMIN_TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)

admin_suite_router = APIRouter(tags=["Enterprise Admin, Casbin RBAC, Scheduler & Mail"])

_SQLADMIN_MOUNTED = False


class ClaimAdmin(ModelView, model=ClaimRecord):
    name = "Klaim JKN"
    name_plural = "Klaim JKN (PostgreSQL)"
    icon = "fa-solid fa-file-medical"
    column_list = [
        ClaimRecord.claim_id,
        ClaimRecord.nama_faskes,
        ClaimRecord.ina_cbg_code,
        ClaimRecord.icd10_primary,
        ClaimRecord.nilai_klaim_rp,
        ClaimRecord.triage_lane,
        ClaimRecord.priority_score,
        ClaimRecord.status_verifikasi,
    ]
    column_searchable_list = [ClaimRecord.claim_id, ClaimRecord.nama_faskes, ClaimRecord.ina_cbg_code, ClaimRecord.icd10_primary]
    column_sortable_list = [ClaimRecord.priority_score, ClaimRecord.nilai_klaim_rp, ClaimRecord.claim_id]
    page_size = 25


class AuditLedgerBlockAdmin(ModelView, model=AuditLedgerBlockRecord):
    name = "Blok Audit SHA-256"
    name_plural = "Audit Ledger SHA-256 (Immutable)"
    icon = "fa-solid fa-shield-halved"
    can_create = False
    can_edit = False
    can_delete = False
    column_list = [
        AuditLedgerBlockRecord.block_index,
        AuditLedgerBlockRecord.timestamp,
        AuditLedgerBlockRecord.event_type,
        AuditLedgerBlockRecord.claim_id,
        AuditLedgerBlockRecord.actor,
        AuditLedgerBlockRecord.current_hash,
    ]
    column_searchable_list = [AuditLedgerBlockRecord.claim_id, AuditLedgerBlockRecord.event_type, AuditLedgerBlockRecord.actor]
    column_default_sort = [(AuditLedgerBlockRecord.block_index, True)]


class AsyncJobRunAdmin(ModelView, model=AsyncJobRunRecord):
    name = "Async Job ARQ"
    name_plural = "Riwayat Async Jobs (ARQ + Redis)"
    icon = "fa-solid fa-gears"
    can_create = False
    column_list = [
        AsyncJobRunRecord.job_id,
        AsyncJobRunRecord.job_type,
        AsyncJobRunRecord.status,
        AsyncJobRunRecord.dispatch_mode,
        AsyncJobRunRecord.requested_by,
        AsyncJobRunRecord.updated_at,
    ]
    column_searchable_list = [AsyncJobRunRecord.job_id, AsyncJobRunRecord.job_type, AsyncJobRunRecord.status]


class OperationsSnapshotAdmin(ModelView, model=OperationsSnapshotRecord):
    name = "Snapshot Operasional"
    name_plural = "Snapshot Operasional"
    icon = "fa-solid fa-database"
    column_list = [
        OperationsSnapshotRecord.namespace,
        OperationsSnapshotRecord.item_count,
        OperationsSnapshotRecord.updated_at,
    ]


def mount_sqladmin(app: FastAPI) -> Optional[Admin]:
    """Mounts SQLAdmin at `/sqladmin` when PostgreSQL engine is available."""
    global _SQLADMIN_MOUNTED
    if _SQLADMIN_MOUNTED:
        return None
    engine = get_postgres_engine()
    if engine is None:
        return None
    try:
        init_postgres_schema()
        admin = Admin(
            app=app,
            engine=engine,
            title="ClaimTrace JKN · SQLAdmin (PostgreSQL OLTP)",
            base_url="/sqladmin",
        )
        admin.add_view(ClaimAdmin)
        admin.add_view(AuditLedgerBlockAdmin)
        admin.add_view(AsyncJobRunAdmin)
        admin.add_view(OperationsSnapshotAdmin)
        _SQLADMIN_MOUNTED = True
        return admin
    except Exception:
        return None


class CasbinEnforceRequest(BaseModel):
    role: str = Field(..., description="Peran BPJS (ADMIN, KEPALA_CABANG, VERIFICATOR_MEDIS, ANALYST)")
    resource: str = Field(..., description="Path endpoint atau modul")
    action: str = Field("GET", description="HTTP method atau aksi")


class SendTemplatedMailRequest(BaseModel):
    recipients: List[str] = Field(..., min_length=1, description="Daftar alamat email tujuan")
    subject: str = Field(..., min_length=3, description="Subjek email")
    template_name: TemplateNameLiteral = Field("clarification_notice", description="Nama template Jinja2 HTML")
    context: Dict[str, Any] = Field(default_factory=dict, description="Variabel konteks Jinja2")


@admin_suite_router.get("/admin-portal", response_class=HTMLResponse, include_in_schema=False)
def render_fastapi_admin_portal():
    """FastAPI-Admin Jinja2 Operations Portal consolidating SQLAdmin, Casbin, SlowAPI, Scheduler & Mail."""
    tpl = _ADMIN_JINJA.get_template("portal.html")
    html = tpl.render(
        postgres=get_postgres_status(),
        redis=get_redis_status(),
        casbin=list_casbin_policies(),
        slowapi=get_slowapi_status(),
        scheduler=get_scheduler_status(),
        backup=get_backup_status(),
        mailer=get_mailer_status(),
    )
    return HTMLResponse(content=html)


@admin_suite_router.get("/api/v1/security/casbin/policies")
@limiter.limit("60/minute")
def get_casbin_policies(request: Request):
    """Mengembalikan seluruh kebijakan akses PyCasbin RBAC dan hierarki peran."""
    return {"status": "success", **list_casbin_policies()}


@admin_suite_router.post("/api/v1/security/casbin/enforce")
@limiter.limit("60/minute")
def evaluate_casbin_policy(request: Request, payload: CasbinEnforceRequest):
    """Mengevaluasi izin akses peran terhadap resource menggunakan mesin PyCasbin RBAC."""
    return {
        "status": "success",
        **enforce_policy(payload.role, payload.resource, payload.action),
    }


@admin_suite_router.get("/api/v1/system/scheduler/jobs")
def get_registered_scheduler_jobs():
    """Mengembalikan daftar seluruh jadwal APScheduler dan ARQ Cron Jobs."""
    return {"status": "success", **get_scheduler_status()}


@admin_suite_router.post("/api/v1/system/mail/send")
@limiter.limit("30/minute")
async def send_claimtrace_mail(request: Request, payload: SendTemplatedMailRequest):
    """Merender template Jinja2 HTML dan mengirim notifikasi melalui FastAPI-Mail."""
    default_ctx: Dict[str, Any] = {
        "recipient_name": "Tim Casemix FKRTL",
        "faskes_name": "RS Khusus Mitra Husada",
        "claim_id": "CLM-2026-8801",
        "ina_cbg_code": "Z-3-12-0",
        "schedule_date": "20 November 2026 · 10:00 WIB",
        "notes": "Mohon melampirkan resume medis asli dan log kehadiran rehabilitasi medik.",
        "backup_id": "claimtrace-backup-latest",
        "size_bytes": 0,
        "sha256": "-",
        "created_at": "2026-11-18T10:00:00Z",
        "alert_title": "Notifikasi Integritas Klaim",
        "severity": "HIGH",
        "summary": "Terdeteksi anomali klaim yang memerlukan telaah verifikator.",
        "reference_id": "CLM-2026-8801",
    }
    merged_ctx = {**default_ctx, **(payload.context or {})}
    record = await send_templated_mail(
        recipients=payload.recipients,
        subject=payload.subject,
        template_name=payload.template_name,
        context=merged_ctx,
    )
    return {"status": "success", "mail": record}


@admin_suite_router.get("/api/v1/system/mail/outbox")
def get_claimtrace_mail_outbox(limit: int = Query(20, ge=1, le=50)):
    """Daftar riwayat email yang dirender/dikirim oleh FastAPI-Mail + Jinja2."""
    items = list_mail_outbox(limit=limit)
    return {
        "status": "success",
        "mailer": get_mailer_status(),
        "total": len(items),
        "outbox": items,
    }


@admin_suite_router.get("/api/v1/system/observability/traces")
def get_live_observability_traces(limit: int = Query(25, ge=1, le=100)):
    """Mengembalikan jejak span OpenTelemetry dan log JSON terstruktur structlog terbaru."""
    return {"status": "success", **get_observability_snapshot(limit=limit)}


@admin_suite_router.get("/api/v1/system/object-storage/status")
def get_s3_object_storage_status():
    """Status konektivitas MinIO S3-Compatible On-Premise Object Storage & jumlah objek per bucket."""
    return {"status": "success", **get_object_storage_status()}


@admin_suite_router.get("/api/v1/system/object-storage/objects")
def get_s3_bucket_objects(
    bucket: str = Query(BUCKET_BACKUPS, description="Nama bucket MinIO S3"),
    limit: int = Query(30, ge=1, le=100),
):
    """Daftar objek tersimpan pada bucket MinIO S3 atau mirror on-premise lokal."""
    items = list_bucket_objects(bucket=bucket, limit=limit)
    return {"status": "success", "bucket": bucket, "total": len(items), "objects": items}


@admin_suite_router.get("/api/v1/auth/oidc/config")
def get_keycloak_oidc_config(state: str = Query("claimtrace-oidc")):
    """Konfigurasi Keycloak OIDC/SAML 2.0 SSO dan URL otorisasi PKCE untuk BPJS Kesehatan."""
    status = get_keycloak_status()
    return {
        "status": "success",
        **status,
        "authorization_url": build_pkce_authorization_url(state=state),
    }


@admin_suite_router.get("/api/v1/reports/pdf-signer/status")
def get_x509_pdf_signer_status():
    """Informasi sertifikat X.509 / BSrE-Compatible RSA-2048 untuk tanda tangan digital PDF BAHV."""
    return {"status": "success", **get_pdf_signer_status()}


@admin_suite_router.get("/api/v1/reports/bahv/{claim_id}/signed-pdf")
def download_signed_bahv_pdf(claim_id: str):
    """Menghasilkan dan mengunduh dokumen PDF BAHV yang ditandatangani kriptografis X.509 (pyHanko)."""
    from app.main import SYNTHETIC_CLAIMS_DATABASE

    claim = SYNTHETIC_CLAIMS_DATABASE.get(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail=f"Klaim '{claim_id}' tidak ditemukan.")
    raw_pdf = build_bahv_pdf_bytes(claim.model_dump(mode="json"))
    signed_pdf = sign_pdf_bytes(raw_pdf)
    return Response(
        content=signed_pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="BAHV_{claim_id}_Signed_X509.pdf"',
            "X-ClaimTrace-Signature": "pyHanko-X509-SHA256",
        },
    )


@admin_suite_router.post("/api/v1/reports/bahv/{claim_id}/sign-and-verify")
def sign_and_verify_bahv_pdf(claim_id: str):
    """Menandatangani BAHV PDF dengan X.509 pyHanko, menyimpan ke MinIO S3, dan memverifikasi tanda tangan."""
    from app.main import SYNTHETIC_CLAIMS_DATABASE

    claim = SYNTHETIC_CLAIMS_DATABASE.get(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail=f"Klaim '{claim_id}' tidak ditemukan.")
    raw_pdf = build_bahv_pdf_bytes(claim.model_dump(mode="json"))
    signed_pdf = sign_pdf_bytes(raw_pdf)
    verification = verify_signed_pdf_bytes(signed_pdf)
    stored = upload_object_bytes(
        BUCKET_DOCUMENTS,
        f"bahv_signed/BAHV_{claim_id}_Signed_X509.pdf",
        signed_pdf,
        content_type="application/pdf",
    )
    return {
        "status": "success",
        "claim_id": claim_id,
        "verification": verification,
        "stored_object": stored,
        "certificate": get_pdf_signer_status(),
    }


def _get_alembic_revision() -> Dict[str, Any]:
    try:
        from sqlalchemy import text

        engine = get_postgres_engine()
        if engine is not None:
            with engine.connect() as conn:
                rev = conn.execute(text("SELECT version_num FROM alembic_version LIMIT 1")).scalar()
                return {"configured": True, "current_revision": rev or "uninitialized"}
    except Exception:
        pass
    return {"configured": True, "current_revision": "20261118_0001 (offline)"}


@admin_suite_router.get("/api/v1/system/enterprise-stack/status")
def get_enterprise_stack_status():
    """Ringkasan status aktif seluruh stack Enterprise ClaimTrace."""
    return {
        "status": "success",
        "sqladmin": {"mounted": _SQLADMIN_MOUNTED, "url": "/sqladmin"},
        "fastapi_admin_portal": {"enabled": True, "url": "/admin-portal", "engine": "fastapi + jinja2"},
        "alembic": _get_alembic_revision(),
        "observability": get_observability_snapshot(limit=10),
        "object_storage": get_object_storage_status(),
        "keycloak_oidc": get_keycloak_status(),
        "pdf_signer": get_pdf_signer_status(),
        "casbin": list_casbin_policies(),
        "slowapi": get_slowapi_status(),
        "scheduler": get_scheduler_status(),
        "mailer": get_mailer_status(),
        "postgres": get_postgres_status(),
        "redis": get_redis_status(),
        "scheduled_backup": get_backup_status(),
    }
