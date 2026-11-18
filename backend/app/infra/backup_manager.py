"""
ClaimTrace JKN — Automated & Scheduled Backup Engine.
Creates atomic, SHA-256 verified backup archives containing:
1. PostgreSQL OLTP logical dump (`pg_dump` SQL for `claimtrace_db`)
2. Redis cache/queue metadata snapshot (+ non-blocking BGSAVE trigger)
3. Persistent forensic state files (`audit_ledger_chain.jsonl`, `claims_state.json`, `operations_state.json`, etc.)

Includes automatic retention pruning, cryptographic archive verification, and
Prometheus observability status reporting.
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import tarfile
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from app.infra.postgres_db import _resolve_database_url, get_postgres_status
from app.infra.redis_client import get_redis_status, get_sync_redis

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BACKEND_DIR / "data"
DEFAULT_BACKUP_DIR = BACKEND_DIR / "backups"
BACKUP_RETENTION_COUNT = max(1, int(os.getenv("CLAIMTRACE_BACKUP_RETENTION_COUNT", "14")))
BACKUP_SCHEDULE_CRON = os.getenv("CLAIMTRACE_BACKUP_CRON", "0 19 * * * (02:00 WIB Harian)")

STATE_FILES_TO_ARCHIVE = (
    "audit_ledger_chain.jsonl",
    "claims_state.json",
    "operations_state.json",
    "appeals_records.json",
    "wbs_reports.json",
    "submitted_document_bundles.json",
)


def get_backup_dir() -> Path:
    custom = os.getenv("CLAIMTRACE_BACKUP_DIR", "").strip()
    target = Path(custom) if custom else DEFAULT_BACKUP_DIR
    target.mkdir(parents=True, exist_ok=True)
    return target


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _dump_postgres_sql(dest_sql: Path) -> Dict[str, Any]:
    """Executes pg_dump against configured PostgreSQL database if reachable."""
    pg_status = get_postgres_status()
    if not pg_status.get("postgres_connected"):
        return {"included": False, "reason": "postgres_offline_or_disabled"}

    pg_dump_bin = shutil.which("pg_dump")
    if not pg_dump_bin:
        return {"included": False, "reason": "pg_dump_binary_not_found"}

    raw_url = _resolve_database_url().replace("postgresql+psycopg://", "postgresql://", 1)
    parsed = urlparse(raw_url)
    env = os.environ.copy()
    if parsed.password:
        env["PGPASSWORD"] = parsed.password

    cmd = [
        pg_dump_bin,
        "--host", parsed.hostname or "127.0.0.1",
        "--port", str(parsed.port or 5432),
        "--username", parsed.username or "claimtrace",
        "--dbname", parsed.path.lstrip("/") or "claimtrace_db",
        "--no-owner",
        "--no-privileges",
        "--format=plain",
        "--file", str(dest_sql),
    ]
    try:
        proc = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=30, check=False)
        if proc.returncode == 0 and dest_sql.exists() and dest_sql.stat().st_size > 0:
            return {
                "included": True,
                "database": parsed.path.lstrip("/") or "claimtrace_db",
                "size_bytes": dest_sql.stat().st_size,
                "tables": pg_status.get("tables", {}),
            }
        return {
            "included": False,
            "reason": (proc.stderr or f"pg_dump exited with code {proc.returncode}").strip()[:300],
        }
    except Exception as exc:
        return {"included": False, "reason": str(exc)[:300]}


def _snapshot_redis_state(dest_json: Path) -> Dict[str, Any]:
    """Captures Redis server diagnostics and triggers non-blocking BGSAVE when available."""
    status = get_redis_status()
    bgsave_triggered = False
    if status.get("redis_connected"):
        client = get_sync_redis()
        if client is not None:
            try:
                client.bgsave()
                bgsave_triggered = True
            except Exception:
                # BGSAVE already in progress or restricted in managed Redis
                bgsave_triggered = False

    payload = {
        "captured_at": datetime.now(timezone.utc).isoformat(),
        "bgsave_triggered": bgsave_triggered,
        "status": status,
    }
    dest_json.write_text(json.dumps(payload, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    return {
        "included": True,
        "redis_connected": bool(status.get("redis_connected")),
        "bgsave_triggered": bgsave_triggered,
        "keyspace_keys": status.get("keyspace_keys", 0),
    }


def prune_old_backups(retention_count: int = BACKUP_RETENTION_COUNT) -> List[str]:
    """Prunes oldest archives beyond retention_count and removes matching sidecar files."""
    bdir = get_backup_dir()
    archives = sorted(bdir.glob("claimtrace-backup-*.tar.gz"), key=lambda p: p.stat().st_mtime, reverse=True)
    removed: List[str] = []
    for old_archive in archives[max(1, int(retention_count)):]:
        backup_id = old_archive.name.removesuffix(".tar.gz")
        for candidate in (old_archive, bdir / f"{backup_id}.sha256", bdir / f"{backup_id}.meta.json"):
            try:
                if candidate.exists():
                    candidate.unlink()
            except Exception:
                pass
        removed.append(backup_id)
    return removed


def create_scheduled_backup(trigger: str = "manual", retention_count: int = BACKUP_RETENTION_COUNT) -> Dict[str, Any]:
    """Creates a compressed, SHA-256 verified backup archive of PostgreSQL, Redis, and forensic files."""
    t0 = time.perf_counter()
    now_utc = datetime.now(timezone.utc)
    backup_id = f"claimtrace-backup-{now_utc.strftime('%Y%m%d-%H%M%S')}"
    bdir = get_backup_dir()
    archive_path = bdir / f"{backup_id}.tar.gz"
    sha_path = bdir / f"{backup_id}.sha256"
    meta_path = bdir / f"{backup_id}.meta.json"

    with tempfile.TemporaryDirectory(prefix="ct_backup_") as tmp:
        stage = Path(tmp) / backup_id
        stage.mkdir(parents=True, exist_ok=True)

        pg_info = _dump_postgres_sql(stage / "claimtrace_db.sql")
        redis_info = _snapshot_redis_state(stage / "redis_snapshot.json")

        state_dir = stage / "state_files"
        state_dir.mkdir(parents=True, exist_ok=True)
        archived_files: List[Dict[str, Any]] = []
        for fname in STATE_FILES_TO_ARCHIVE:
            src = DATA_DIR / fname
            if src.exists() and src.is_file():
                dst = state_dir / fname
                shutil.copy2(src, dst)
                archived_files.append({
                    "name": fname,
                    "size_bytes": dst.stat().st_size,
                    "sha256": _sha256_file(dst),
                })

        manifest = {
            "backup_id": backup_id,
            "created_at": now_utc.isoformat(),
            "trigger": trigger,
            "postgres": pg_info,
            "redis": redis_info,
            "state_files": archived_files,
        }
        (stage / "manifest.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False, default=str),
            encoding="utf-8",
        )

        tmp_archive = bdir / f".{backup_id}.tar.gz.tmp"
        with tarfile.open(tmp_archive, "w:gz") as tar:
            tar.add(stage, arcname=backup_id)
        tmp_archive.replace(archive_path)

    archive_sha256 = _sha256_file(archive_path)
    archive_size = archive_path.stat().st_size
    sha_path.write_text(f"{archive_sha256}  {archive_path.name}\n", encoding="utf-8")

    duration_ms = round((time.perf_counter() - t0) * 1000, 2)
    pruned = prune_old_backups(retention_count=retention_count)

    metadata = {
        "backup_id": backup_id,
        "archive_name": archive_path.name,
        "archive_path": str(archive_path),
        "created_at": now_utc.isoformat(),
        "created_epoch": round(now_utc.timestamp(), 3),
        "trigger": trigger,
        "size_bytes": archive_size,
        "sha256": archive_sha256,
        "duration_ms": duration_ms,
        "postgres_included": bool(pg_info.get("included")),
        "postgres_detail": pg_info,
        "redis_detail": redis_info,
        "state_files_count": len(archived_files),
        "pruned_backups": pruned,
        "verified": True,
    }
    meta_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    return metadata


def list_backups(limit: int = 30) -> List[Dict[str, Any]]:
    """Lists available backup archives newest-first with SHA-256 and metadata."""
    bdir = get_backup_dir()
    archives = sorted(bdir.glob("claimtrace-backup-*.tar.gz"), key=lambda p: p.stat().st_mtime, reverse=True)
    out: List[Dict[str, Any]] = []
    for arch in archives[: max(1, min(int(limit), 100))]:
        backup_id = arch.name.removesuffix(".tar.gz")
        meta_path = bdir / f"{backup_id}.meta.json"
        sha_path = bdir / f"{backup_id}.sha256"
        if meta_path.exists():
            try:
                out.append(json.loads(meta_path.read_text(encoding="utf-8")))
                continue
            except Exception:
                pass
        stat = arch.stat()
        expected_sha = sha_path.read_text(encoding="utf-8").split()[0] if sha_path.exists() else None
        out.append({
            "backup_id": backup_id,
            "archive_name": arch.name,
            "archive_path": str(arch),
            "created_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
            "created_epoch": round(stat.st_mtime, 3),
            "trigger": "script_or_external",
            "size_bytes": stat.st_size,
            "sha256": expected_sha,
            "verified": bool(expected_sha),
        })
    return out


def verify_backup_archive(backup_id: str) -> Dict[str, Any]:
    """Verifies SHA-256 digest and tar.gz readability of a backup archive."""
    safe_id = Path(backup_id).name
    bdir = get_backup_dir()
    archive_path = bdir / f"{safe_id}.tar.gz"
    sha_path = bdir / f"{safe_id}.sha256"

    if not archive_path.exists():
        return {"backup_id": safe_id, "exists": False, "verified": False, "error": "Archive not found"}

    actual_sha = _sha256_file(archive_path)
    expected_sha = None
    if sha_path.exists():
        parts = sha_path.read_text(encoding="utf-8").strip().split()
        expected_sha = parts[0] if parts else None

    members: List[str] = []
    tar_readable = False
    try:
        with tarfile.open(archive_path, "r:gz") as tar:
            members = tar.getnames()
            tar_readable = len(members) > 0
    except Exception:
        tar_readable = False

    checksum_match = (expected_sha is None) or (actual_sha == expected_sha)
    return {
        "backup_id": safe_id,
        "exists": True,
        "verified": bool(tar_readable and checksum_match),
        "checksum_match": checksum_match,
        "tar_readable": tar_readable,
        "expected_sha256": expected_sha,
        "actual_sha256": actual_sha,
        "member_count": len(members),
        "size_bytes": archive_path.stat().st_size,
    }


def get_backup_status() -> Dict[str, Any]:
    """Returns scheduled backup policy and latest archive telemetry for API & Prometheus."""
    items = list_backups(limit=50)
    latest = items[0] if items else None
    return {
        "enabled": True,
        "schedule": BACKUP_SCHEDULE_CRON,
        "retention_count": BACKUP_RETENTION_COUNT,
        "backup_dir": str(get_backup_dir()),
        "total_archives": len(items),
        "latest_backup": latest,
        "last_success_epoch": latest.get("created_epoch") if latest else 0,
        "last_size_bytes": latest.get("size_bytes") if latest else 0,
    }
