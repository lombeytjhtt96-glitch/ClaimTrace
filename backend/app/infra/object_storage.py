"""
ClaimTrace JKN — MinIO S3-Compatible On-Premise Object Storage Layer.
Stores medical verification document bundles (`claimtrace-documents`) and
SHA-256 verified scheduled backups (`claimtrace-backups`) on MinIO S3 when live,
with transparent on-premise local S3 mirror fallback (`backend/data/s3_mirror`)
when MinIO is offline or during isolated unit tests.
"""

from __future__ import annotations

import hashlib
import io
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from minio import Minio

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "127.0.0.1:9000").strip() or "127.0.0.1:9000"
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "claimtrace_minio").strip()
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "claimtrace_minio_secret_2026").strip()
MINIO_SECURE = os.getenv("MINIO_SECURE", "0") == "1"

BUCKET_BACKUPS = os.getenv("MINIO_BUCKET_BACKUPS", "claimtrace-backups")
BUCKET_DOCUMENTS = os.getenv("MINIO_BUCKET_DOCUMENTS", "claimtrace-documents")

LOCAL_S3_MIRROR = Path(__file__).resolve().parent.parent.parent / "data" / "s3_mirror"


def _get_minio_client() -> Optional[Minio]:
    if os.getenv("CLAIMTRACE_DISABLE_MINIO") == "1" or os.getenv("PYTEST_CURRENT_TEST"):
        return None
    try:
        client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_SECURE,
        )
        # Fast connectivity check (list_buckets throws quickly on connection refused)
        client.list_buckets()
        return client
    except Exception:
        return None


def _ensure_local_bucket(bucket: str) -> Path:
    custom_root = os.getenv("CLAIMTRACE_S3_MIRROR_DIR", "").strip()
    root = Path(custom_root) if custom_root else LOCAL_S3_MIRROR
    bpath = root / Path(bucket).name
    bpath.mkdir(parents=True, exist_ok=True)
    return bpath


def upload_object_bytes(
    bucket: str,
    object_name: str,
    data: bytes,
    content_type: str = "application/octet-stream",
) -> Dict[str, Any]:
    """Uploads bytes to MinIO S3 (or local on-premise S3 mirror fallback) with SHA-256 ETag."""
    safe_name = object_name.lstrip("/")
    sha256_hex = hashlib.sha256(data).hexdigest()
    now_iso = datetime.now(timezone.utc).isoformat()

    client = _get_minio_client()
    if client is not None:
        try:
            if not client.bucket_exists(bucket):
                client.make_bucket(bucket)
            client.put_object(
                bucket,
                safe_name,
                io.BytesIO(data),
                length=len(data),
                content_type=content_type,
                metadata={"sha256": sha256_hex},
            )
            presigned = client.presigned_get_object(bucket, safe_name, expires=timedelta(hours=1))
            return {
                "storage_mode": "minio_s3_live",
                "bucket": bucket,
                "object_name": safe_name,
                "size_bytes": len(data),
                "sha256": sha256_hex,
                "content_type": content_type,
                "presigned_url": presigned,
                "uploaded_at": now_iso,
            }
        except Exception:
            pass

    # Transparent local on-premise S3 mirror fallback
    bpath = _ensure_local_bucket(bucket)
    target = bpath / safe_name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return {
        "storage_mode": "local_s3_mirror",
        "bucket": bucket,
        "object_name": safe_name,
        "size_bytes": len(data),
        "sha256": sha256_hex,
        "content_type": content_type,
        "local_path": str(target),
        "uploaded_at": now_iso,
    }


def list_bucket_objects(bucket: str, limit: int = 50) -> List[Dict[str, Any]]:
    bounded = max(1, min(int(limit), 200))
    client = _get_minio_client()
    if client is not None:
        try:
            if not client.bucket_exists(bucket):
                return []
            out: List[Dict[str, Any]] = []
            for obj in client.list_objects(bucket, recursive=True):
                out.append({
                    "bucket": bucket,
                    "object_name": obj.object_name,
                    "size_bytes": obj.size,
                    "etag": obj.etag,
                    "last_modified": obj.last_modified.isoformat() if obj.last_modified else None,
                    "storage_mode": "minio_s3_live",
                })
                if len(out) >= bounded:
                    break
            return out
        except Exception:
            pass

    bpath = _ensure_local_bucket(bucket)
    files = sorted((p for p in bpath.rglob("*") if p.is_file()), key=lambda p: p.stat().st_mtime, reverse=True)
    return [
        {
            "bucket": bucket,
            "object_name": str(f.relative_to(bpath)),
            "size_bytes": f.stat().st_size,
            "last_modified": datetime.fromtimestamp(f.stat().st_mtime, tz=timezone.utc).isoformat(),
            "storage_mode": "local_s3_mirror",
        }
        for f in files[:bounded]
    ]


def get_object_storage_status() -> Dict[str, Any]:
    client = _get_minio_client()
    live = client is not None
    backup_objs = list_bucket_objects(BUCKET_BACKUPS, limit=50)
    doc_objs = list_bucket_objects(BUCKET_DOCUMENTS, limit=50)
    return {
        "engine": "minio-s3",
        "minio_connected": live,
        "mode": "minio_s3_live" if live else "local_s3_mirror",
        "endpoint": MINIO_ENDPOINT,
        "buckets": {
            BUCKET_BACKUPS: len(backup_objs),
            BUCKET_DOCUMENTS: len(doc_objs),
        },
        "total_objects": len(backup_objs) + len(doc_objs),
    }
