"""
ClaimTrace Cryptographic Token & Session Manager
Implements HMAC-SHA256 Signed Session Tokens with Expiration, Tamper-Evident Signatures,
and In-Memory Revocation List (NIST CSF 2.0 PR.AC-01 / OWASP ASVS V3 Session Management).
"""

import os
import hmac
import base64
import json
import time
import hashlib
from typing import Dict, Any, Tuple, Optional, Set

import secrets

def _resolve_session_secret() -> bytes:
    """
    Resolves HMAC session secret key securely.
    Prioritizes CLAIMTRACE_SESSION_SECRET from environment.
    If absent, generates or reads a cryptographically secure 256-bit key from a protected local secret file.
    Zero static fallback string to prevent credential cracking.
    """
    env_secret = os.getenv("CLAIMTRACE_SESSION_SECRET")
    if env_secret and len(env_secret.strip()) >= 16:
        return env_secret.strip().encode("utf-8")
    
    secret_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
    os.makedirs(secret_dir, exist_ok=True)
    secret_file = os.path.join(secret_dir, ".session_secret")
    
    if os.path.exists(secret_file):
        try:
            with open(secret_file, "rb") as f:
                key = f.read().strip()
                if len(key) >= 32:
                    return key
        except Exception:
            pass
            
    new_key = secrets.token_hex(32).encode("utf-8")
    try:
        with open(secret_file, "wb") as f:
            f.write(new_key)
        os.chmod(secret_file, 0o600)
    except Exception:
        pass
    return new_key

# Master Secret Key for HMAC-SHA256 Token Signing
SECRET_KEY = _resolve_session_secret()

# In-memory blacklist for revoked tokens (e.g. on logout or session breach)
REVOKED_TOKENS: Set[str] = set()

def _base64_url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def _base64_url_decode(data: str) -> bytes:
    padding = "=" * (4 - (len(data) % 4)) if len(data) % 4 != 0 else ""
    return base64.urlsafe_b64decode(data + padding)

def create_access_token(user_profile: Dict[str, Any], ttl_minutes: int = 480) -> str:
    """
    Creates a tamper-evident HMAC-SHA256 signed access token.
    Format: payload_b64.signature_b64
    """
    now = int(time.time())
    payload = {
        "sub": user_profile.get("nip", "UNKNOWN"),
        "name": user_profile.get("name", "Verifikator BPJS"),
        "email": user_profile.get("email", ""),
        "role": user_profile.get("role", "VERIFICATOR"),
        "unit": user_profile.get("unit", "Kantor Pusat BPJS Kesehatan"),
        "iat": now,
        "exp": now + (ttl_minutes * 60)
    }

    payload_json = json.dumps(payload, sort_keys=True).encode("utf-8")
    payload_b64 = _base64_url_encode(payload_json)

    signature = hmac.new(SECRET_KEY, payload_b64.encode("utf-8"), hashlib.sha256).digest()
    sig_b64 = _base64_url_encode(signature)

    return f"ct.{payload_b64}.{sig_b64}"

def verify_access_token(token: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Verifies token signature, expiration, and revocation status.
    Returns: (is_valid, payload_dict, rejection_reason)
    """
    if not token or not token.startswith("ct."):
        return False, None, "Format token sesi tidak valid. Token harus memiliki tanda tangan kriptografis ct.<payload>.<sig>."

    if token in REVOKED_TOKENS:
        return False, None, "Token telah dicabut (Revoked) melalui proses logout resmi."

    parts = token.split(".")
    if len(parts) != 3:
        return False, None, "Segmen token tidak lengkap."

    _, payload_b64, sig_b64 = parts

    # 1. Verify HMAC Signature
    try:
        expected_sig = hmac.new(SECRET_KEY, payload_b64.encode("utf-8"), hashlib.sha256).digest()
        provided_sig = _base64_url_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, provided_sig):
            return False, None, "Integritas kriptografis token gagal diverifikasi (Tampered Token)."
    except Exception:
        return False, None, "Gagal memverifikasi tanda tangan digital token."

    # 2. Decode and Validate Expiration
    try:
        payload_bytes = _base64_url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return False, None, "Payload token rusak atau tidak dapat di-parse."

    now = int(time.time())
    if payload.get("exp", 0) < now:
        return False, None, "Sesi verifikator telah kedaluwarsa. Silakan lakukan autentikasi ulang."

    return True, payload, None

def revoke_token(token: str) -> None:
    """Adds token to in-memory revocation list."""
    if token:
        REVOKED_TOKENS.add(token)
