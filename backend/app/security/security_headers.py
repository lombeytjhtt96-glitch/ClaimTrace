"""
ClaimTrace Security Headers Middleware
Implements OWASP Secure Headers Project standards, NIST CSF 2.0 PR.DS-01,
and UU PDP No. 27/2022 protective controls for healthcare endpoints.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from fastapi import Request, Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Injects enterprise-grade defensive HTTP headers into every response.
    Protects against Clickjacking, MIME-Sniffing, XSS, Downgrade Attacks,
    and Unauthorized Caching of Sensitive Patient / Verifier Data.
    """
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # 1. Anti-Clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # 2. Strict MIME Type Enforcement
        response.headers["X-Content-Type-Options"] = "nosniff"

        # 3. Content Security Policy (Zero Framing, Secure Resource Loading)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "frame-ancestors 'none'; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )

        # 4. Strict Transport Security (HSTS - 2 Years Preload)
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"

        # 5. Referrer Policy (Strict Origin When Cross-Origin)
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # 6. Device & Permissions Policy (Restricting Unneeded Hardware APIs)
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), "
            "camera=(), "
            "geolocation=(self), "
            "gyroscope=(), "
            "magnetometer=(), "
            "microphone=(), "
            "payment=(), "
            "usb=()"
        )

        # 7. Legacy XSS Protection Header
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # 8. Server Signature Hardening (Hide Python/Uvicorn details)
        response.headers["Server"] = "ClaimTrace-EnterpriseGateway/2.4 (BPJS-Kesehatan-Wasrik)"

        # 9. Sensitive API Cache Invalidation (Prevent caching of medical records and JWT tokens)
        path = request.url.path
        if path.startswith("/api/v1/auth") or path.startswith("/api/v1/claims") or path.startswith("/api/v1/duckdb") or path.startswith("/api/v1/claimtrace-ai"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"

        return response
