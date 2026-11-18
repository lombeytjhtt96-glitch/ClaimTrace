"""
ClaimTrace JKN — APScheduler (`AsyncIOScheduler`) + ARQ Cron Orchestration Registry.
Manages recurring in-process FastAPI governance jobs alongside out-of-process ARQ Redis cron jobs.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger("claimtrace.scheduler")

_SCHEDULER: Optional[AsyncIOScheduler] = None
_LAST_RUNS: Dict[str, str] = {}


def _job_postgres_oltp_heartbeat_sync() -> None:
    try:
        from app.infra.postgres_db import init_postgres_schema, sync_audit_blocks_to_postgres, sync_claims_to_postgres
        from app.main import SYNTHETIC_CLAIMS_DATABASE, audit_logger, evaluate_claim_triage

        if init_postgres_schema():
            sync_claims_to_postgres(SYNTHETIC_CLAIMS_DATABASE, evaluator=evaluate_claim_triage)
            sync_audit_blocks_to_postgres(audit_logger.chain)
        _LAST_RUNS["postgres_oltp_heartbeat_sync"] = datetime.now(timezone.utc).isoformat()
    except Exception as exc:
        logger.warning("APScheduler postgres sync notice: %s", exc)


def _job_prometheus_metrics_refresh() -> None:
    try:
        from app.engine.telemetry_metrics import telemetry_engine

        telemetry_engine.sync_metrics_from_data()
        _LAST_RUNS["prometheus_metrics_refresh"] = datetime.now(timezone.utc).isoformat()
    except Exception as exc:
        logger.warning("APScheduler prometheus refresh notice: %s", exc)


def _job_daily_backup_verification() -> None:
    try:
        from app.infra.backup_manager import list_backups, verify_backup_archive

        items = list_backups(limit=1)
        if items:
            verify_backup_archive(items[0]["backup_id"])
        _LAST_RUNS["daily_backup_verification"] = datetime.now(timezone.utc).isoformat()
    except Exception as exc:
        logger.warning("APScheduler backup verification notice: %s", exc)


def get_scheduler() -> AsyncIOScheduler:
    global _SCHEDULER
    if _SCHEDULER is None:
        _SCHEDULER = AsyncIOScheduler(timezone="UTC")
        _SCHEDULER.add_job(
            _job_postgres_oltp_heartbeat_sync,
            trigger=IntervalTrigger(minutes=5),
            id="postgres_oltp_heartbeat_sync",
            name="Sinkronisasi Berkala PostgreSQL OLTP (5 Menit)",
            replace_existing=True,
        )
        _SCHEDULER.add_job(
            _job_prometheus_metrics_refresh,
            trigger=IntervalTrigger(seconds=60),
            id="prometheus_metrics_refresh",
            name="Refresh Metrik Prometheus & Telemetri (60 Detik)",
            replace_existing=True,
        )
        _SCHEDULER.add_job(
            _job_daily_backup_verification,
            trigger=CronTrigger(hour=19, minute=30),
            id="daily_backup_verification",
            name="Verifikasi Integritas SHA-256 Backup Harian (02:30 WIB)",
            replace_existing=True,
        )
    return _SCHEDULER


def start_scheduler() -> bool:
    if os.getenv("PYTEST_CURRENT_TEST"):
        return False
    sched = get_scheduler()
    if not sched.running:
        try:
            sched.start()
            return True
        except Exception as exc:
            logger.warning("APScheduler start notice: %s", exc)
            return False
    return True


def shutdown_scheduler() -> None:
    global _SCHEDULER
    if _SCHEDULER is not None and _SCHEDULER.running:
        try:
            _SCHEDULER.shutdown(wait=False)
        except Exception:
            pass


def get_scheduler_status() -> Dict[str, Any]:
    sched = get_scheduler()
    ap_jobs: List[Dict[str, Any]] = []
    for job in sched.get_jobs():
        next_run = getattr(job, "next_run_time", None)
        ap_jobs.append({
            "id": job.id,
            "name": job.name,
            "trigger": str(job.trigger),
            "next_run_time": next_run.isoformat() if next_run else None,
            "last_run_at": _LAST_RUNS.get(job.id),
            "engine": "apscheduler",
        })

    arq_crons = [
        {
            "id": "worker_heartbeat_cron",
            "name": "ARQ Worker Heartbeat Liveness (Tiap 15 Detik)",
            "trigger": "cron(second={0,15,30,45})",
            "engine": "arq_cron",
        },
        {
            "id": "scheduled_backup_cron",
            "name": "ARQ Backup Terjadwal PostgreSQL + Redis + Ledger (02:00 WIB)",
            "trigger": "cron(hour=19, minute=0 UTC)",
            "engine": "arq_cron",
        },
    ]

    return {
        "apscheduler_running": bool(sched.running),
        "apscheduler_jobs_count": len(ap_jobs),
        "arq_cron_jobs_count": len(arq_crons),
        "apscheduler_jobs": ap_jobs,
        "arq_cron_jobs": arq_crons,
    }
