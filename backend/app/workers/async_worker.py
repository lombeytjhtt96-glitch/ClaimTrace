"""
ClaimTrace JKN — Dedicated Redis + ARQ Async Background Worker.

Start locally with:
    cd backend && python3 -m arq app.workers.async_worker.WorkerSettings

Handles heavy/IO-bound healthcare verification tasks off the FastAPI request loop:
1. Batch 4-Layer Claim Triage & Scoring (`run_batch_claim_triage_job`)
2. SHA-256 Cryptographic Audit Ledger Integrity Verification (`run_audit_integrity_verification_job`)
3. DuckDB OLAP / FPK Analytics Cache Refresh (`run_fpk_analytics_refresh_job`)
4. Layer-3 Mobile JKN Presence Attestation Batch Dispatch (`run_mobile_jkn_batch_dispatch_job`)
"""

from __future__ import annotations

import hashlib
import logging
import os
import socket
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from arq import cron

from app.infra.redis_client import (
    ARQ_QUEUE_NAME,
    cache_delete_prefix,
    cache_set_json,
    get_arq_redis_settings,
    get_job_record,
    save_job_record,
    set_worker_heartbeat,
)

logger = logging.getLogger("claimtrace.worker")
WORKER_ID = f"claimtrace-arq-{socket.gethostname()}-{os.getpid()}"


def _load_claims_snapshot() -> Dict[str, Any]:
    """Loads persisted claims cleanly without importing the entire FastAPI ASGI app twice."""
    from pathlib import Path
    import json
    from app.data.synthetic_seed import get_initial_claims
    from app.models.schemas import ClaimInput

    claims_file = Path(__file__).resolve().parent.parent.parent / "data" / "claims_state.json"
    if claims_file.exists():
        try:
            raw = json.loads(claims_file.read_text(encoding="utf-8"))
            if isinstance(raw, dict) and raw:
                return {cid: ClaimInput.model_validate(item) for cid, item in raw.items()}
        except Exception as exc:
            logger.warning("Fallback to initial seed claims in worker: %s", exc)
    return get_initial_claims()


def _mark_started(job_id: str, job_type: str, requested_by: str) -> float:
    prev = get_job_record(job_id) or {}
    save_job_record(
        job_id,
        {
            **prev,
            "job_type": job_type,
            "status": "in_progress",
            "requested_by": requested_by,
            "worker_id": WORKER_ID,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    return time.perf_counter()


def _mark_completed(job_id: str, job_type: str, requested_by: str, started_perf: float, result: Dict[str, Any]) -> Dict[str, Any]:
    duration_ms = round((time.perf_counter() - started_perf) * 1000, 2)
    prev = get_job_record(job_id) or {}
    record = save_job_record(
        job_id,
        {
            **prev,
            "job_type": job_type,
            "status": "complete",
            "requested_by": requested_by,
            "worker_id": WORKER_ID,
            "duration_ms": duration_ms,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "result": result,
            "error": None,
        },
    )
    return record


def _mark_failed(job_id: str, job_type: str, requested_by: str, started_perf: float, exc: Exception) -> Dict[str, Any]:
    duration_ms = round((time.perf_counter() - started_perf) * 1000, 2)
    prev = get_job_record(job_id) or {}
    return save_job_record(
        job_id,
        {
            **prev,
            "job_type": job_type,
            "status": "failed",
            "requested_by": requested_by,
            "worker_id": WORKER_ID,
            "duration_ms": duration_ms,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "error": str(exc),
        },
    )


async def run_batch_claim_triage_job(
    ctx: Dict[str, Any],
    job_id: str,
    claim_ids: Optional[List[str]] = None,
    requested_by: str = "SYSTEM",
) -> Dict[str, Any]:
    """Re-evaluates claims asynchronously through the 4-layer ClaimTrace scoring engine."""
    t0 = _mark_started(job_id, "batch_triage", requested_by)
    try:
        from app.engine.scoring import evaluate_claim_triage

        claims_map = _load_claims_snapshot()
        target_ids = [cid for cid in (claim_ids or list(claims_map.keys())) if cid in claims_map]
        lanes = {"MERAH": 0, "KUNING": 0, "HIJAU": 0}
        evaluated: List[Dict[str, Any]] = []
        for cid in target_ids:
            triage = evaluate_claim_triage(claims_map[cid])
            lane_key = str(triage.triage_lane).upper()
            if lane_key in lanes:
                lanes[lane_key] += 1
            evaluated.append({
                "claim_id": cid,
                "score": triage.final_priority_score,
                "lane": lane_key,
                "hard_trigger": triage.hard_trigger_activated,
            })

        result = {
            "processed_claims": len(evaluated),
            "lane_distribution": lanes,
            "highest_risk": max(evaluated, key=lambda x: x["score"]) if evaluated else None,
            "cached_in_redis": cache_set_json("batch_triage_latest", {"lanes": lanes, "items": evaluated}, ttl_seconds=120),
        }
        cache_delete_prefix("sidebar_badges")
        return _mark_completed(job_id, "batch_triage", requested_by, t0, result)
    except Exception as exc:
        logger.exception("run_batch_claim_triage_job failed: %s", exc)
        return _mark_failed(job_id, "batch_triage", requested_by, t0, exc)


async def run_audit_integrity_verification_job(
    ctx: Dict[str, Any],
    job_id: str,
    requested_by: str = "SYSTEM",
) -> Dict[str, Any]:
    """Verifies the complete persisted SHA-256 Audit Ledger hash chain asynchronously."""
    t0 = _mark_started(job_id, "audit_integrity_check", requested_by)
    try:
        from app.security.audit_log import AuditLogger

        verifier_logger = AuditLogger(persist_to_disk=True)
        is_valid, broken_idx = verifier_logger.verify_integrity()
        head_hash = verifier_logger.chain[-1]["current_hash"] if verifier_logger.chain else None
        result = {
            "integrity_verified": is_valid,
            "chain_length": len(verifier_logger.chain),
            "broken_at_index": None if is_valid else broken_idx,
            "head_hash": head_hash,
            "verified_at": datetime.now(timezone.utc).isoformat(),
        }
        cache_set_json("audit_integrity_latest", result, ttl_seconds=120)
        return _mark_completed(job_id, "audit_integrity_check", requested_by, t0, result)
    except Exception as exc:
        logger.exception("run_audit_integrity_verification_job failed: %s", exc)
        return _mark_failed(job_id, "audit_integrity_check", requested_by, t0, exc)


async def run_fpk_analytics_refresh_job(
    ctx: Dict[str, Any],
    job_id: str,
    requested_by: str = "SYSTEM",
) -> Dict[str, Any]:
    """Refreshes claim portfolio financial totals and caches summary metrics in Redis."""
    t0 = _mark_started(job_id, "analytics_refresh", requested_by)
    try:
        claims_map = _load_claims_snapshot()
        total_rp = sum(int(c.nilai_klaim_rp or 0) for c in claims_map.values())
        total_sep = sum(int(getattr(c.episode_meta, "jumlah_klaim_klaster", 1) or 1) for c in claims_map.values())
        unique_faskes = len({c.nama_faskes for c in claims_map.values()})
        result = {
            "active_claims": len(claims_map),
            "total_sep_episodes": total_sep,
            "unique_faskes": unique_faskes,
            "total_claimed_rp": total_rp,
            "refreshed_at": datetime.now(timezone.utc).isoformat(),
        }
        cache_set_json("fpk_analytics_summary", result, ttl_seconds=180)
        cache_delete_prefix("sidebar_badges")
        return _mark_completed(job_id, "analytics_refresh", requested_by, t0, result)
    except Exception as exc:
        logger.exception("run_fpk_analytics_refresh_job failed: %s", exc)
        return _mark_failed(job_id, "analytics_refresh", requested_by, t0, exc)


async def run_mobile_jkn_batch_dispatch_job(
    ctx: Dict[str, Any],
    job_id: str,
    claim_ids: Optional[List[str]] = None,
    requested_by: str = "SYSTEM",
) -> Dict[str, Any]:
    """Dispatches Zero-PHI Layer-3 Mobile JKN presence attestation challenges in batch."""
    t0 = _mark_started(job_id, "mobile_jkn_batch", requested_by)
    try:
        claims_map = _load_claims_snapshot()
        target_ids = [cid for cid in (claim_ids or list(claims_map.keys())[:5]) if cid in claims_map]
        dispatched = []
        for cid in target_ids:
            c = claims_map[cid]
            token_digest = hashlib.sha256(str(c.peserta_token_aes).encode("utf-8")).hexdigest()
            dispatched.append({
                "claim_id": cid,
                "faskes": c.nama_faskes,
                "participant_hash": f"SHA256_{token_digest[:12]}",
                "attestation_channel": "Mobile JKN Push (TLS/FCM)",
            })
        result = {
            "dispatched_count": len(dispatched),
            "zero_phi_compliant": True,
            "dispatched": dispatched,
        }
        cache_set_json("mobile_jkn_batch_latest", result, ttl_seconds=120)
        return _mark_completed(job_id, "mobile_jkn_batch", requested_by, t0, result)
    except Exception as exc:
        logger.exception("run_mobile_jkn_batch_dispatch_job failed: %s", exc)
        return _mark_failed(job_id, "mobile_jkn_batch", requested_by, t0, exc)


async def worker_heartbeat_cron(ctx: Dict[str, Any]) -> None:
    """Periodic 15-second heartbeat so API/UI can monitor live ARQ worker health."""
    set_worker_heartbeat(WORKER_ID, {"mode": "arq_worker_process"})


async def on_startup(ctx: Dict[str, Any]) -> None:
    set_worker_heartbeat(WORKER_ID, {"mode": "arq_worker_process", "started_at": datetime.now(timezone.utc).isoformat()})
    logger.info("ClaimTrace ARQ Worker online: %s (queue=%s)", WORKER_ID, ARQ_QUEUE_NAME)


async def on_shutdown(ctx: Dict[str, Any]) -> None:
    logger.info("ClaimTrace ARQ Worker shutting down: %s", WORKER_ID)


JOB_HANDLER_MAP = {
    "batch_triage": run_batch_claim_triage_job,
    "audit_integrity_check": run_audit_integrity_verification_job,
    "analytics_refresh": run_fpk_analytics_refresh_job,
    "mobile_jkn_batch": run_mobile_jkn_batch_dispatch_job,
}


class WorkerSettings:
    """ARQ WorkerSettings entrypoint (`python3 -m arq app.workers.async_worker.WorkerSettings`)."""

    redis_settings = get_arq_redis_settings()
    queue_name = ARQ_QUEUE_NAME
    functions = [
        run_batch_claim_triage_job,
        run_audit_integrity_verification_job,
        run_fpk_analytics_refresh_job,
        run_mobile_jkn_batch_dispatch_job,
    ]
    cron_jobs = [
        cron(worker_heartbeat_cron, second={0, 15, 30, 45}),
    ]
    on_startup = on_startup
    on_shutdown = on_shutdown
    max_jobs = 10
    job_timeout = 120
    keep_result = 3600
