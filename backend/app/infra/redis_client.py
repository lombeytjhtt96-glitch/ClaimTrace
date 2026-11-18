"""
ClaimTrace JKN — Redis Cache, Distributed State & Async Job Registry Client.
Provides both synchronous and asynchronous Redis access with automatic graceful
in-memory fallback when Redis is unavailable (e.g. isolated CI/unit tests).
"""

from __future__ import annotations

import json
import os
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import redis
import redis.asyncio as aioredis
from arq.connections import RedisSettings

REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0").strip() or "redis://127.0.0.1:6379/0"
ARQ_QUEUE_NAME = os.getenv("CLAIMTRACE_ARQ_QUEUE", "claimtrace:arq").strip() or "claimtrace:arq"
WORKER_HEARTBEAT_KEY = "claimtrace:worker:heartbeat"
RECENT_JOBS_KEY = "claimtrace:jobs:recent"
JOB_KEY_PREFIX = "claimtrace:job:"
CACHE_KEY_PREFIX = "claimtrace:cache:"

_MEM_LOCK = threading.RLock()
_MEM_CACHE: Dict[str, tuple[float, str]] = {}
_MEM_JOBS: Dict[str, Dict[str, Any]] = {}
_MEM_JOB_ORDER: List[str] = []

_SYNC_CLIENT: Optional[redis.Redis] = None
_SYNC_LOCK = threading.Lock()


def get_arq_redis_settings() -> RedisSettings:
    """Builds ARQ RedisSettings parsed from REDIS_URL."""
    parsed = urlparse(REDIS_URL)
    db_num = 0
    if parsed.path and parsed.path.strip("/").isdigit():
        db_num = int(parsed.path.strip("/"))
    return RedisSettings(
        host=parsed.hostname or "127.0.0.1",
        port=parsed.port or 6379,
        database=db_num,
        password=parsed.password,
        ssl=(parsed.scheme == "rediss"),
    )


def get_sync_redis() -> Optional[redis.Redis]:
    """Returns a reusable synchronous Redis client (or None if unreachable)."""
    global _SYNC_CLIENT
    if os.getenv("CLAIMTRACE_DISABLE_REDIS") == "1":
        return None
    with _SYNC_LOCK:
        if _SYNC_CLIENT is None:
            try:
                _SYNC_CLIENT = redis.Redis.from_url(
                    REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=0.5,
                    socket_timeout=0.75,
                    health_check_interval=30,
                )
            except Exception:
                _SYNC_CLIENT = None
                return None
    try:
        _SYNC_CLIENT.ping()
        return _SYNC_CLIENT
    except Exception:
        return None


async def get_async_redis() -> Optional[aioredis.Redis]:
    """Creates a short-lived async Redis client and verifies connectivity."""
    if os.getenv("CLAIMTRACE_DISABLE_REDIS") == "1":
        return None
    try:
        client = aioredis.from_url(
            REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=0.5,
            socket_timeout=0.75,
        )
        await client.ping()
        return client
    except Exception:
        return None


def cache_get_json(key: str) -> Optional[Any]:
    """Reads JSON payload from Redis cache (falls back to in-memory TTL dict)."""
    full_key = f"{CACHE_KEY_PREFIX}{key}"
    client = get_sync_redis()
    if client is not None:
        try:
            raw = client.get(full_key)
            if raw is not None:
                return json.loads(raw)
            return None
        except Exception:
            pass
    with _MEM_LOCK:
        item = _MEM_CACHE.get(full_key)
        if not item:
            return None
        exp_ts, raw = item
        if exp_ts < time.time():
            _MEM_CACHE.pop(full_key, None)
            return None
        return json.loads(raw)


def cache_set_json(key: str, value: Any, ttl_seconds: int = 30) -> bool:
    """Writes JSON payload to Redis cache with TTL (plus in-memory fallback)."""
    full_key = f"{CACHE_KEY_PREFIX}{key}"
    serialized = json.dumps(value, ensure_ascii=False, default=str)
    ttl = max(1, int(ttl_seconds))
    client = get_sync_redis()
    if client is not None:
        try:
            client.setex(full_key, ttl, serialized)
            return True
        except Exception:
            pass
    with _MEM_LOCK:
        _MEM_CACHE[full_key] = (time.time() + ttl, serialized)
    return False


def cache_delete_prefix(prefix: str) -> int:
    """Deletes cached keys matching prefix from Redis and in-memory fallback."""
    full_prefix = f"{CACHE_KEY_PREFIX}{prefix}"
    removed = 0
    client = get_sync_redis()
    if client is not None:
        try:
            keys = list(client.scan_iter(match=f"{full_prefix}*", count=200))
            if keys:
                removed += int(client.delete(*keys))
        except Exception:
            pass
    with _MEM_LOCK:
        for k in [k for k in _MEM_CACHE if k.startswith(full_prefix)]:
            _MEM_CACHE.pop(k, None)
            removed += 1
    return removed


def save_job_record(job_id: str, record: Dict[str, Any], ttl_seconds: int = 86400) -> Dict[str, Any]:
    """Persists an async worker job status/result record to Redis, PostgreSQL (write-through), and memory fallback."""
    payload = {
        **record,
        "job_id": job_id,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    serialized = json.dumps(payload, ensure_ascii=False, default=str)
    persisted_to_redis = False
    client = get_sync_redis()
    if client is not None:
        try:
            pipe = client.pipeline()
            pipe.setex(f"{JOB_KEY_PREFIX}{job_id}", ttl_seconds, serialized)
            pipe.lrem(RECENT_JOBS_KEY, 0, job_id)
            pipe.lpush(RECENT_JOBS_KEY, job_id)
            pipe.ltrim(RECENT_JOBS_KEY, 0, 49)
            pipe.execute()
            persisted_to_redis = True
        except Exception:
            pass
    if not persisted_to_redis:
        with _MEM_LOCK:
            _MEM_JOBS[job_id] = payload
            if job_id in _MEM_JOB_ORDER:
                _MEM_JOB_ORDER.remove(job_id)
            _MEM_JOB_ORDER.insert(0, job_id)
            del _MEM_JOB_ORDER[50:]
    # Durable write-through to PostgreSQL `async_job_runs` (safe no-op if Postgres disabled/offline)
    try:
        from app.infra.postgres_db import upsert_async_job_to_postgres

        upsert_async_job_to_postgres(payload)
    except Exception:
        pass
    return payload


def get_job_record(job_id: str) -> Optional[Dict[str, Any]]:
    """Fetches a single job record from Redis or memory fallback."""
    client = get_sync_redis()
    if client is not None:
        try:
            raw = client.get(f"{JOB_KEY_PREFIX}{job_id}")
            if raw:
                return json.loads(raw)
        except Exception:
            pass
    with _MEM_LOCK:
        return _MEM_JOBS.get(job_id)


def list_recent_jobs(limit: int = 20) -> List[Dict[str, Any]]:
    """Lists most recent async worker jobs from Redis or memory fallback."""
    bounded = max(1, min(int(limit), 50))
    client = get_sync_redis()
    if client is not None:
        try:
            ids = client.lrange(RECENT_JOBS_KEY, 0, bounded - 1)
            if not ids:
                return []
            raw_items = client.mget([f"{JOB_KEY_PREFIX}{jid}" for jid in ids])
            out: List[Dict[str, Any]] = []
            for raw in raw_items:
                if raw:
                    try:
                        out.append(json.loads(raw))
                    except Exception:
                        continue
            return out
        except Exception:
            pass
    with _MEM_LOCK:
        return [_MEM_JOBS[jid] for jid in _MEM_JOB_ORDER[:bounded] if jid in _MEM_JOBS]


def set_worker_heartbeat(worker_id: str, metadata: Optional[Dict[str, Any]] = None, ttl_seconds: int = 45) -> bool:
    """Publishes ARQ worker liveness heartbeat in Redis."""
    body = {
        "worker_id": worker_id,
        "status": "online",
        "queue": ARQ_QUEUE_NAME,
        "heartbeat_at": datetime.now(timezone.utc).isoformat(),
        "pid": os.getpid(),
        **(metadata or {}),
    }
    client = get_sync_redis()
    if client is not None:
        try:
            client.setex(WORKER_HEARTBEAT_KEY, max(10, int(ttl_seconds)), json.dumps(body, ensure_ascii=False))
            return True
        except Exception:
            return False
    return False


def get_worker_heartbeat() -> Optional[Dict[str, Any]]:
    """Reads latest ARQ worker heartbeat from Redis."""
    client = get_sync_redis()
    if client is None:
        return None
    try:
        raw = client.get(WORKER_HEARTBEAT_KEY)
        return json.loads(raw) if raw else None
    except Exception:
        return None


def get_redis_status() -> Dict[str, Any]:
    """Returns live diagnostics for Redis server and ARQ async worker."""
    t0 = time.perf_counter()
    client = get_sync_redis()
    if client is None:
        return {
            "redis_connected": False,
            "mode": "in_memory_fallback",
            "redis_url_sanitized": _sanitize_redis_url(REDIS_URL),
            "latency_ms": None,
            "queue_name": ARQ_QUEUE_NAME,
            "queued_jobs": 0,
            "worker_active": False,
            "worker_heartbeat": None,
            "recent_jobs_count": len(list_recent_jobs(50)),
        }

    try:
        client.ping()
        latency_ms = round((time.perf_counter() - t0) * 1000, 2)
        info_srv = client.info("server")
        info_mem = client.info("memory")
        info_cli = client.info("clients")
        queue_len = int(client.zcard(ARQ_QUEUE_NAME) or 0)
        hb = get_worker_heartbeat()
        recent_count = int(client.llen(RECENT_JOBS_KEY) or 0)
        keyspace_keys = int(client.dbsize() or 0)
        return {
            "redis_connected": True,
            "mode": "redis_live",
            "redis_url_sanitized": _sanitize_redis_url(REDIS_URL),
            "redis_version": info_srv.get("redis_version"),
            "latency_ms": latency_ms,
            "used_memory_human": info_mem.get("used_memory_human"),
            "connected_clients": info_cli.get("connected_clients"),
            "keyspace_keys": keyspace_keys,
            "queue_name": ARQ_QUEUE_NAME,
            "queued_jobs": queue_len,
            "worker_active": hb is not None,
            "worker_heartbeat": hb,
            "recent_jobs_count": recent_count,
        }
    except Exception as exc:
        return {
            "redis_connected": False,
            "mode": "in_memory_fallback",
            "error": str(exc),
            "queue_name": ARQ_QUEUE_NAME,
            "queued_jobs": 0,
            "worker_active": False,
            "worker_heartbeat": None,
            "recent_jobs_count": len(list_recent_jobs(50)),
        }


def _sanitize_redis_url(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.hostname or "127.0.0.1"
    port = parsed.port or 6379
    path = parsed.path or "/0"
    return f"{parsed.scheme or 'redis'}://{host}:{port}{path}"
