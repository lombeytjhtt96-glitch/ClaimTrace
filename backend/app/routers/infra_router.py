"""
ClaimTrace JKN — Infrastructure Observability & PostgreSQL OLTP Router.
Exposes live telemetry for Nginx Reverse Proxy, PostgreSQL 18 OLTP database,
and Redis + ARQ Async Worker, plus on-demand PostgreSQL sync and direct SQL query endpoints.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query, Request

from app.infra.backup_manager import (
    create_scheduled_backup,
    get_backup_status,
    list_backups,
    verify_backup_archive,
)
from app.infra.postgres_db import (
    get_postgres_status,
    query_async_jobs_from_postgres,
    query_audit_blocks_from_postgres,
    query_claims_from_postgres,
    sync_audit_blocks_to_postgres,
    sync_claims_to_postgres,
    sync_operations_snapshot_to_postgres,
)
from app.infra.redis_client import get_redis_status

infra_router = APIRouter(tags=["Infrastructure (Reverse Proxy, PostgreSQL, Redis)"])


def detect_reverse_proxy(request: Request) -> Dict[str, Any]:
    """Inspects forwarded headers injected by the Nginx Reverse Proxy edge gateway."""
    proxy_marker = request.headers.get("x-claimtrace-proxy")
    forwarded_for = request.headers.get("x-forwarded-for")
    forwarded_proto = request.headers.get("x-forwarded-proto")
    real_ip = request.headers.get("x-real-ip")
    request_id = request.headers.get("x-request-id")
    detected = bool(proxy_marker or forwarded_for or real_ip)
    return {
        "detected": detected,
        "engine": proxy_marker or ("nginx-forwarded" if detected else "direct_backend_connection"),
        "host": request.headers.get("host"),
        "x_forwarded_for": forwarded_for,
        "x_forwarded_proto": forwarded_proto or request.url.scheme,
        "x_real_ip": real_ip,
        "x_request_id": request_id,
        "upstream_client": request.client.host if request.client else None,
    }


@infra_router.get("/api/v1/system/infrastructure/status")
def get_infrastructure_status(request: Request):
    """Status real-time terpadu untuk Reverse Proxy (Nginx), PostgreSQL OLTP, Redis/ARQ, Observability, dan Scheduled Backup."""
    proxy_diag = detect_reverse_proxy(request)
    pg_diag = get_postgres_status()
    redis_diag = get_redis_status()
    backup_diag = get_backup_status()
    return {
        "status": "success",
        "reverse_proxy": proxy_diag,
        "postgres": pg_diag,
        "redis": redis_diag,
        "scheduled_backup": backup_diag,
        "observability": {
            "prometheus_metrics_endpoint": "/metrics",
            "prometheus_ui": "http://localhost:9090",
            "grafana_dashboard_uid": "claimtrace-jkn-observability",
            "grafana_ui": "http://localhost:3001",
            "locust_loadtest_ui": "http://localhost:8089",
        },
    }


@infra_router.get("/api/v1/system/backups")
def get_scheduled_backups(limit: int = Query(30, ge=1, le=100)):
    """Daftar arsip backup terjadwal beserta kebijakan retensi dan checksum SHA-256."""
    return {
        "status": "success",
        "policy": get_backup_status(),
        "backups": list_backups(limit=limit),
    }


@infra_router.post("/api/v1/system/backups/run")
def trigger_scheduled_backup():
    """Menjalankan backup penuh PostgreSQL + Redis + Audit Ledger SHA-256 secara langsung."""
    metadata = create_scheduled_backup(trigger="api_manual_trigger")
    return {
        "status": "success",
        "backup": metadata,
    }


@infra_router.post("/api/v1/system/backups/verify/{backup_id}")
def verify_scheduled_backup(backup_id: str):
    """Memverifikasi integritas arsip backup terhadap checksum SHA-256."""
    result = verify_backup_archive(backup_id)
    if not result.get("exists"):
        raise HTTPException(status_code=404, detail=f"Arsip backup '{backup_id}' tidak ditemukan.")
    return {
        "status": "success",
        "verification": result,
    }


@infra_router.post("/api/v1/system/postgres/sync")
def sync_runtime_state_to_postgres():
    """Menyinkronkan seluruh klaim aktif, blok SHA-256 Audit Ledger, dan state operasional ke PostgreSQL."""
    from app.main import SYNTHETIC_CLAIMS_DATABASE, audit_logger, evaluate_claim_triage, operations_store

    claims_synced = sync_claims_to_postgres(SYNTHETIC_CLAIMS_DATABASE, evaluator=evaluate_claim_triage)
    blocks_synced = sync_audit_blocks_to_postgres(audit_logger.chain)

    ops_synced: Dict[str, bool] = {}
    try:
        ops_synced["cases"] = sync_operations_snapshot_to_postgres(
            "cases", operations_store.list_cases(SYNTHETIC_CLAIMS_DATABASE)
        )
    except Exception:
        ops_synced["cases"] = False
    try:
        ops_synced["flags"] = sync_operations_snapshot_to_postgres(
            "flags", operations_store.list_flags(SYNTHETIC_CLAIMS_DATABASE)
        )
    except Exception:
        ops_synced["flags"] = False
    try:
        ops_synced["schedules"] = sync_operations_snapshot_to_postgres(
            "schedules", operations_store.list_schedules(SYNTHETIC_CLAIMS_DATABASE)
        )
    except Exception:
        ops_synced["schedules"] = False
    try:
        ops_synced["interventions"] = sync_operations_snapshot_to_postgres(
            "interventions", operations_store.list_interventions(SYNTHETIC_CLAIMS_DATABASE)
        )
    except Exception:
        ops_synced["interventions"] = False
    try:
        ops_synced["mobile_telemetry"] = sync_operations_snapshot_to_postgres(
            "mobile_telemetry", operations_store.get_mobile_telemetry(SYNTHETIC_CLAIMS_DATABASE)
        )
    except Exception:
        ops_synced["mobile_telemetry"] = False

    return {
        "status": "success",
        "claims_synced": claims_synced,
        "audit_blocks_synced": blocks_synced,
        "operations_namespaces": ops_synced,
        "postgres": get_postgres_status(),
    }


@infra_router.get("/api/v1/system/postgres/claims")
def get_postgres_claims(
    lane: Optional[str] = Query(None, description="Filter jalur triase: HIJAU, KUNING, MERAH"),
    jenis_pelayanan: Optional[str] = Query(None, description="Filter RJTL atau RITL"),
    limit: int = Query(50, ge=1, le=200),
):
    """Membaca daftar klaim JKN langsung dari tabel PostgreSQL `claims`."""
    rows = query_claims_from_postgres(lane=lane, jenis_pelayanan=jenis_pelayanan, limit=limit)
    return {
        "status": "success",
        "source": "postgresql",
        "total": len(rows),
        "claims": rows,
    }


@infra_router.get("/api/v1/system/postgres/audit-blocks")
def get_postgres_audit_blocks(
    claim_id: Optional[str] = Query(None, description="Filter berdasarkan claim_id"),
    limit: int = Query(50, ge=1, le=200),
):
    """Membaca rantai blok audit SHA-256 langsung dari tabel PostgreSQL `audit_ledger_blocks`."""
    rows = query_audit_blocks_from_postgres(claim_id=claim_id, limit=limit)
    return {
        "status": "success",
        "source": "postgresql",
        "total": len(rows),
        "blocks": rows,
    }


@infra_router.get("/api/v1/system/postgres/jobs")
def get_postgres_async_jobs(limit: int = Query(20, ge=1, le=100)):
    """Membaca riwayat job asinkron ARQ yang tersimpan permanen di tabel PostgreSQL `async_job_runs`."""
    rows = query_async_jobs_from_postgres(limit=limit)
    return {
        "status": "success",
        "source": "postgresql",
        "total": len(rows),
        "jobs": rows,
    }
