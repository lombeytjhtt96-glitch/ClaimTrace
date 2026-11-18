"""
ClaimTrace JKN — Redis & Async Worker (ARQ) Job Orchestration Router.
Provides endpoints for inspecting Redis/worker health, enqueuing background jobs,
and polling real-time job execution state.
"""

from __future__ import annotations

import asyncio
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from arq import create_pool
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from app.infra.redis_client import (
    ARQ_QUEUE_NAME,
    get_arq_redis_settings,
    get_job_record,
    get_redis_status,
    list_recent_jobs,
    save_job_record,
)
from app.workers.async_worker import JOB_HANDLER_MAP

async_jobs_router = APIRouter(tags=["Redis & Async Worker Jobs"])

JobTypeLiteral = Literal[
    "batch_triage",
    "audit_integrity_check",
    "analytics_refresh",
    "mobile_jkn_batch",
    "scheduled_backup",
]


class EnqueueJobRequest(BaseModel):
    job_type: JobTypeLiteral = Field(..., description="Jenis tugas latar belakang asinkron")
    claim_ids: Optional[List[str]] = Field(None, description="Daftar claim_id opsional untuk tugas batch")


@async_jobs_router.get("/api/v1/system/redis-worker/status")
def get_redis_worker_status():
    """Mengembalikan status konektivitas Redis, latensi, antrean ARQ, dan heartbeat worker."""
    return {
        "status": "success",
        **get_redis_status(),
    }


@async_jobs_router.get("/api/v1/jobs")
def list_async_jobs(limit: int = Query(20, ge=1, le=50)):
    """Daftar tugas asinkron terbaru dari Redis/ARQ worker."""
    jobs = list_recent_jobs(limit=limit)
    return {
        "status": "success",
        "total": len(jobs),
        "jobs": jobs,
    }


@async_jobs_router.get("/api/v1/jobs/{job_id}")
def get_async_job_status(job_id: str):
    """Memeriksa status dan hasil tugas latar belakang berdasarkan job_id."""
    record = get_job_record(job_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Job asinkron '{job_id}' tidak ditemukan.")
    return {
        "status": "success",
        "job": record,
    }


@async_jobs_router.post("/api/v1/jobs/enqueue", status_code=202)
async def enqueue_async_job(req: EnqueueJobRequest, request: Request):
    """
    Mengirimkan tugas berat ke antrean Redis + ARQ Worker secara non-blocking.
    Apabila ARQ worker eksternal belum aktif (misal saat unit test terisolasi),
    tugas tetap dijalankan secara asinkron di latar belakang dengan status tracking penuh.
    """
    job_id = f"JOB-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
    subject = getattr(request.state, "subject", None)
    requested_by = getattr(subject, "name", None) or getattr(subject, "nip", None) or "Administrator ClaimTrace"

    status_info = get_redis_status()
    use_arq = (
        not os.getenv("PYTEST_CURRENT_TEST")
        and status_info.get("redis_connected")
        and status_info.get("worker_active")
    )
    dispatch_mode = "arq_redis_worker" if use_arq else "local_async_fallback"

    queued_record = save_job_record(
        job_id,
        {
            "job_type": req.job_type,
            "status": "queued",
            "queue": ARQ_QUEUE_NAME,
            "dispatch_mode": dispatch_mode,
            "requested_by": requested_by,
            "claim_ids": req.claim_ids,
            "queued_at": datetime.now(timezone.utc).isoformat(),
            "result": None,
            "error": None,
        },
    )

    handler = JOB_HANDLER_MAP[req.job_type]
    func_name = handler.__name__

    if dispatch_mode == "arq_redis_worker":
        pool = None
        try:
            pool = await create_pool(get_arq_redis_settings(), default_queue_name=ARQ_QUEUE_NAME)
            if req.job_type in ("batch_triage", "mobile_jkn_batch"):
                await pool.enqueue_job(func_name, job_id, req.claim_ids, requested_by, _job_id=job_id)
            else:
                await pool.enqueue_job(func_name, job_id, requested_by, _job_id=job_id)
            return {
                "status": "accepted",
                "job_id": job_id,
                "dispatch_mode": dispatch_mode,
                "queue": ARQ_QUEUE_NAME,
                "job": queued_record,
            }
        except Exception:
            dispatch_mode = "local_async_fallback"
        finally:
            if pool is not None:
                await pool.aclose()

    # Non-blocking async fallback when worker daemon is not yet attached or in unit tests
    if req.job_type in ("batch_triage", "mobile_jkn_batch"):
        asyncio.create_task(handler({}, job_id, req.claim_ids, requested_by))
    else:
        asyncio.create_task(handler({}, job_id, requested_by))

    return {
        "status": "accepted",
        "job_id": job_id,
        "dispatch_mode": dispatch_mode,
        "queue": ARQ_QUEUE_NAME,
        "job": queued_record,
    }
