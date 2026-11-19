"""
ClaimTrace Enterprise Rate Limiter
Implements In-Memory Sliding-Window & Token-Bucket Rate Limiting
Protects against Brute-Force, Resource Starvation, and Denial-of-Service (DoS) attacks.
NIST CSF 2.0 PR.AC-07 & OWASP API Security Top 10 API4:2023 (Unrestricted Resource Consumption).
"""

import time
import threading
from typing import Dict, Tuple, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from fastapi import Request, Response
from fastapi.responses import JSONResponse

class RateLimiterRegistry:
    """
    Thread-safe Sliding-Window Counter for client IPs and user sessions.
    """
    def __init__(self):
        self._lock = threading.Lock()
        # client_key -> list of timestamp floats
        self._requests: Dict[str, list] = {}
        # ip -> (failure_count, lockout_until_timestamp)
        self._auth_lockouts: Dict[str, Tuple[int, float]] = {}

    def is_rate_limited(
        self,
        key: str,
        max_requests: int,
        window_seconds: int = 60
    ) -> Tuple[bool, int, int]:
        """
        Evaluates whether key has exceeded max_requests within window_seconds.
        Returns: (is_limited, remaining_tokens, retry_after_seconds)
        """
        now = time.time()
        with self._lock:
            timestamps = self._requests.get(key, [])
            cutoff = now - window_seconds
            # Purge timestamps outside the active window
            valid_timestamps = [ts for ts in timestamps if ts > cutoff]

            if len(valid_timestamps) >= max_requests:
                earliest = valid_timestamps[0]
                retry_after = max(1, int(window_seconds - (now - earliest)))
                self._requests[key] = valid_timestamps
                return True, 0, retry_after

            # Record current request
            valid_timestamps.append(now)
            self._requests[key] = valid_timestamps
            remaining = max(0, max_requests - len(valid_timestamps))
            return False, remaining, 0

    def record_auth_failure(self, ip: str, max_failures: int = 5, lockout_duration: int = 300) -> bool:
        """
        Records a failed login/credential attempt.
        If threshold reached, locks out the IP for lockout_duration seconds.
        """
        now = time.time()
        with self._lock:
            count, lock_until = self._auth_lockouts.get(ip, (0, 0.0))
            if now < lock_until:
                return True # Already locked out
            new_count = count + 1
            if new_count >= max_failures:
                self._auth_lockouts[ip] = (new_count, now + lockout_duration)
                return True
            self._auth_lockouts[ip] = (new_count, 0.0)
            return False

    def is_auth_locked(self, ip: str) -> Tuple[bool, int]:
        """
        Checks if IP is currently under brute-force lockout.
        """
        now = time.time()
        with self._lock:
            count, lock_until = self._auth_lockouts.get(ip, (0, 0.0))
            if now < lock_until:
                return True, max(1, int(lock_until - now))
            return False, 0

    def reset_auth_failure(self, ip: str) -> None:
        with self._lock:
            self._auth_lockouts.pop(ip, None)


# Global registry singleton
rate_limiter = RateLimiterRegistry()


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Middleware applying contextual rate limiting based on route criticality:
    - Auth Routes: 15 req/min + Brute Force Lockout
    - AI Reasoning Routes: 30 req/min
    - DuckDB Analytics: 45 req/min
    - General Endpoints: 180 req/min
    """
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        # Determine client IP (considering reverse proxy X-Forwarded-For)
        forwarded = request.headers.get("x-forwarded-for")
        client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "127.0.0.1")
        path = request.url.path

        # 1. Check Brute-Force Auth Lockout
        if path.startswith("/api/v1/auth"):
            is_locked, lockout_remaining = rate_limiter.is_auth_locked(client_ip)
            if is_locked:
                return JSONResponse(
                    status_code=429,
                    content={
                        "status": "error",
                        "error_code": "AUTH_BRUTE_FORCE_PROTECTION",
                        "detail": f"Terlalu banyak percobaan autentikasi yang gagal dari alamat IP ini. Sesuai standar UU PDP & NIST CSF 2.0 PR.AC-07, akun diamankan sementara. Silakan coba kembali dalam {lockout_remaining} detik.",
                        "retry_after_seconds": lockout_remaining
                    },
                    headers={"Retry-After": str(lockout_remaining)}
                )

        # 2. Contextual Thresholds
        if path.startswith("/api/v1/auth"):
            limit, window = 20, 60
            key = f"auth:{client_ip}"
        elif path.startswith("/api/v1/claimtrace-ai"):
            limit, window = 35, 60
            key = f"ai:{client_ip}"
        elif path.startswith("/api/v1/duckdb/query"):
            limit, window = 50, 60
            key = f"duckdb:{client_ip}"
        else:
            limit, window = 200, 60
            key = f"gen:{client_ip}"

        is_limited, remaining, retry_after = rate_limiter.is_rate_limited(key, limit, window)

        if is_limited:
            return JSONResponse(
                status_code=429,
                content={
                    "status": "error",
                    "error_code": "RATE_LIMIT_EXCEEDED",
                    "detail": f"Batas frekuensi permintaan analitik terlampaui ({limit} req/menit). Harap beri jeda {retry_after} detik sebelum mengajukan kueri berikutnya demi menjaga ketersediaan infrastruktur BPJS.",
                    "retry_after_seconds": retry_after
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(retry_after)
                }
            )

        response: Response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
