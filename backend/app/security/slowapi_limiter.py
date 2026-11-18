"""
ClaimTrace JKN — SlowAPI Rate Limiter Integration.
Uses Redis backend storage when available (with automatic memory:// fallback in tests
or when Redis is unavailable) and provides standard FastAPI route-level `@limiter.limit(...)`
throttling with Indonesian JSON 429 responses.
"""

from __future__ import annotations

import os
from typing import Any, Dict

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address


def _resolve_slowapi_storage() -> str:
    if os.getenv("PYTEST_CURRENT_TEST") or os.getenv("CLAIMTRACE_DISABLE_REDIS") == "1":
        return "memory://"
    redis_url = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0").strip()
    try:
        from app.infra.redis_client import get_sync_redis

        if get_sync_redis() is not None and redis_url:
            return redis_url
    except Exception:
        pass
    return "memory://"


SLOWAPI_STORAGE_URI = _resolve_slowapi_storage()

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["240/minute"],
    storage_uri=SLOWAPI_STORAGE_URI,
    headers_enabled=False,
)


async def claimtrace_rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={
            "status": "error",
            "error_code": "SLOWAPI_RATE_LIMIT_EXCEEDED",
            "detail": f"Batas frekuensi permintaan terlampaui ({exc.detail}). Silakan coba lagi beberapa saat.",
            "path": request.url.path,
        },
        headers={"Retry-After": "60", "Cache-Control": "no-store, max-age=0"},
    )


def get_slowapi_status() -> Dict[str, Any]:
    return {
        "enabled": True,
        "engine": "slowapi",
        "storage_backend": "redis" if SLOWAPI_STORAGE_URI.startswith("redis") else "memory",
        "default_limit": "240/minute",
    }
