"""
ClaimTrace Cryptographic Token & Strict Session Manager
Implements HMAC-SHA256 Signed Session & Stage-Locked Pre-Auth Tokens with:
- Unique JTI & Server-Side Revocation Persistence
- Per-User Monotonic Session Epochs (Instant Global Session Invalidation)
- Idle Timeout & Absolute Expiration Enforcement
- Client Device Fingerprint, User-Agent, and Optional Strict IP Binding
NIST CSF 2.0 PR.AC-01 / OWASP ASVS V3 Session Management.
"""

import os
import hmac
import json
import time
import base64
import secrets
import threading
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, Set, List


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

_SECURITY_STATE_FILE = Path(__file__).resolve().parent.parent.parent / "data" / ".session_security_state.json"
_STATE_LOCK = threading.RLock()
_LAST_PERSIST_TS = 0.0

# In-memory blacklists & active session tracking (persisted in non-pytest live runtime)
REVOKED_TOKENS: Set[str] = set()
REVOKED_JTIS: Set[str] = set()
USER_SESSION_EPOCHS: Dict[str, int] = {}
ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}


def _base64_url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64_url_decode(data: str) -> bytes:
    padding = "=" * (4 - (len(data) % 4)) if len(data) % 4 != 0 else ""
    return base64.urlsafe_b64decode(data + padding)


def normalize_ip(ip: Optional[str]) -> str:
    """Normalizes localhost dual-stack representations so ::1 and 127.0.0.1 match consistently."""
    cleaned = (ip or "").strip()
    if cleaned in ("", "::1", "::ffff:127.0.0.1", "localhost"):
        return "127.0.0.1"
    if cleaned.startswith("::ffff:"):
        return cleaned[7:]
    return cleaned


def _hash_binding(value: Optional[str], purpose: str) -> Optional[str]:
    """Creates a keyed, non-reversible 64-bit binding digest for UA/IP/device fingerprint checks."""
    cleaned = (value or "").strip()
    if not cleaned:
        return None
    digest = hmac.new(
        SECRET_KEY,
        f"{purpose}:{cleaned}".encode("utf-8"),
        "sha256",
    ).hexdigest()
    return digest[:16]


def sign_ephemeral_blob(payload: Dict[str, Any], prefix: str = "ctblob") -> str:
    """Signs a compact JSON dictionary using HMAC-SHA256."""
    payload_bytes = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    payload_b64 = _base64_url_encode(payload_bytes)
    sig_bytes = hmac.new(SECRET_KEY, f"{prefix}.{payload_b64}".encode("utf-8"), "sha256").digest()
    sig_b64 = _base64_url_encode(sig_bytes)
    return f"{prefix}.{payload_b64}.{sig_b64}"


def verify_ephemeral_blob(token: str, prefix: str = "ctblob") -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """Verifies signature and JSON payload of an HMAC-signed blob."""
    if not token or not isinstance(token, str):
        return False, None, "Token tidak tersedia atau format tidak valid."

    parts = token.strip().split(".")
    if len(parts) != 3 or parts[0] != prefix:
        return False, None, "Format token kriptografis tidak dikenali."

    _, payload_b64, sig_b64 = parts
    try:
        expected_sig = hmac.new(SECRET_KEY, f"{prefix}.{payload_b64}".encode("utf-8"), "sha256").digest()
        provided_sig = _base64_url_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, provided_sig):
            return False, None, "Tampered Token: tanda tangan HMAC-SHA256 gagal diverifikasi."
    except Exception:
        return False, None, "Tampered Token: struktur tanda tangan kriptografis gagal dibaca."

    try:
        payload = json.loads(_base64_url_decode(payload_b64).decode("utf-8"))
        if not isinstance(payload, dict):
            return False, None, "Payload token tidak valid."
    except Exception:
        return False, None, "Payload JSON token gagal didekode."

    return True, payload, None


def _prune_expired_sessions_unlocked(now_ts: int) -> None:
    for jti in list(ACTIVE_SESSIONS.keys()):
        sess = ACTIVE_SESSIONS.get(jti)
        if not isinstance(sess, dict):
            ACTIVE_SESSIONS.pop(jti, None)
            continue
        if jti in REVOKED_JTIS or int(sess.get("exp", 0)) < now_ts:
            ACTIVE_SESSIONS.pop(jti, None)
            continue
        idle_sec = int(sess.get("idle_sec", 900))
        if (now_ts - int(sess.get("last_active", sess.get("iat", now_ts)))) > idle_sec:
            REVOKED_JTIS.add(jti)
            ACTIVE_SESSIONS.pop(jti, None)


def _load_security_state() -> None:
    if os.getenv("PYTEST_CURRENT_TEST") or not _SECURITY_STATE_FILE.exists():
        return
    try:
        with _STATE_LOCK:
            with open(_SECURITY_STATE_FILE, "r", encoding="utf-8") as f:
                raw = json.load(f)
            if not isinstance(raw, dict):
                return
            now_ts = int(time.time())
            REVOKED_JTIS.update(str(j) for j in raw.get("revoked_jtis", [])[-5000:])
            for k, v in (raw.get("user_epochs") or {}).items():
                USER_SESSION_EPOCHS[str(k)] = max(1, int(v))
            for jti, sess in (raw.get("sessions") or {}).items():
                if isinstance(sess, dict) and int(sess.get("exp", 0)) >= now_ts and jti not in REVOKED_JTIS:
                    ACTIVE_SESSIONS[str(jti)] = sess
            _prune_expired_sessions_unlocked(now_ts)
    except Exception:
        pass


def _persist_security_state_unlocked(force: bool = False) -> None:
    global _LAST_PERSIST_TS
    if os.getenv("PYTEST_CURRENT_TEST"):
        return
    now_f = time.time()
    if not force and (now_f - _LAST_PERSIST_TS) < 25.0:
        return
    try:
        _prune_expired_sessions_unlocked(int(now_f))
        _SECURITY_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        tmp = _SECURITY_STATE_FILE.with_suffix(".tmp")
        state = {
            "revoked_jtis": list(REVOKED_JTIS)[-5000:],
            "user_epochs": USER_SESSION_EPOCHS,
            "sessions": ACTIVE_SESSIONS,
        }
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False)
        os.chmod(tmp, 0o600)
        tmp.replace(_SECURITY_STATE_FILE)
        _LAST_PERSIST_TS = now_f
    except Exception:
        pass


_load_security_state()


def get_user_session_epoch(nip: str) -> int:
    with _STATE_LOCK:
        return int(USER_SESSION_EPOCHS.get(str(nip), 1))


def bump_user_session_epoch(nip: str, *, exclude_jti: Optional[str] = None) -> int:
    """Invalidates all prior sessions issued for `nip` by advancing its monotonic epoch."""
    nip_key = str(nip)
    with _STATE_LOCK:
        next_epoch = int(USER_SESSION_EPOCHS.get(nip_key, 1)) + 1
        USER_SESSION_EPOCHS[nip_key] = next_epoch
        for jti, sess in list(ACTIVE_SESSIONS.items()):
            if str(sess.get("sub")) == nip_key and jti != exclude_jti:
                REVOKED_JTIS.add(jti)
                ACTIVE_SESSIONS.pop(jti, None)
        _persist_security_state_unlocked(force=True)
        return next_epoch


def create_access_token(
    user_profile: Dict[str, Any],
    ttl_minutes: int = 480,
    *,
    token_type: str = "SESSION",
    stage: str = "AUTHENTICATED",
    mfa_verified: Optional[bool] = None,
    device_fingerprint: Optional[str] = None,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
    strict_ip_lock: bool = False,
    idle_timeout_minutes: int = 15,
    session_epoch: Optional[int] = None,
) -> str:
    """
    Creates a tamper-evident HMAC-SHA256 signed token.
    - `token_type="SESSION"` issues a full authenticated session token with idle + epoch tracking.
    - `token_type="PRE_AUTH"` issues a stage-locked short-lived token for sequential MFA steps.
    """
    now = int(time.time())
    bounded_ttl = max(1, min(int(ttl_minutes), 720))
    bounded_idle = max(1, min(int(idle_timeout_minutes), 120))
    nip = str(user_profile.get("nip") or user_profile.get("sub") or "UNKNOWN")
    jti = secrets.token_hex(12)

    with _STATE_LOCK:
        epoch = int(session_epoch) if session_epoch is not None else int(USER_SESSION_EPOCHS.get(nip, 1))

    is_mfa = bool(user_profile.get("isMfaVerified", True)) if (mfa_verified is None and token_type == "SESSION") else bool(mfa_verified)

    payload: Dict[str, Any] = {
        "jti": jti,
        "typ": token_type,
        "stage": stage,
        "mfa": is_mfa,
        "ver": epoch,
        "sub": nip,
        "username": user_profile.get("username", ""),
        "name": user_profile.get("name", "Verifikator BPJS"),
        "email": user_profile.get("email", ""),
        "role": user_profile.get("role", "VERIFICATOR"),
        "unit": user_profile.get("unit", "Kantor Pusat BPJS Kesehatan"),
        "iat": now,
        "exp": now + (bounded_ttl * 60),
        "idle_sec": bounded_idle * 60,
    }

    dfp_hash = _hash_binding(device_fingerprint, "dfp")
    ua_hash = _hash_binding(user_agent, "uah")
    ip_hash = _hash_binding(normalize_ip(ip_address), "iph") if (strict_ip_lock and ip_address) else None

    if dfp_hash:
        payload["dfp"] = dfp_hash
    if ua_hash:
        payload["uah"] = ua_hash
    if ip_hash:
        payload["iph"] = ip_hash
        payload["ipl"] = True

    token = sign_ephemeral_blob(payload, prefix="ct")

    if token_type == "SESSION":
        with _STATE_LOCK:
            ACTIVE_SESSIONS[jti] = {
                "jti": jti,
                "sub": nip,
                "name": payload["name"],
                "role": payload["role"],
                "unit": payload["unit"],
                "iat": now,
                "exp": payload["exp"],
                "last_active": now,
                "idle_sec": payload["idle_sec"],
                "ver": epoch,
                "dfp_preview": (device_fingerprint or "")[:24],
                "ua_preview": (user_agent or "BPJS Workstation")[:80],
                "ip_preview": normalize_ip(ip_address) if ip_address else "-",
                "strict_ip_lock": bool(strict_ip_lock),
            }
            _persist_security_state_unlocked(force=True)

    return token


def verify_access_token(
    token: str,
    *,
    expected_type: Optional[str] = "SESSION",
    expected_stage: Optional[str] = None,
    require_mfa: bool = True,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
    device_fingerprint: Optional[str] = None,
    touch_activity: bool = True,
) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Validates HMAC signature, revocation status, epoch, stage/MFA, client bindings, and idle/abs expiry.
    """
    if not token or not isinstance(token, str):
        return False, None, "Token autentikasi tidak tersedia atau format tidak valid."

    if token in REVOKED_TOKENS:
        return False, None, "Token telah dicabut (Revoked) melalui proses logout resmi."

    ok, payload, err = verify_ephemeral_blob(token, prefix="ct")
    if not ok or payload is None:
        return False, None, err or "Token tidak sah."

    jti = str(payload.get("jti", ""))
    nip = str(payload.get("sub", ""))
    now = int(time.time())

    if payload.get("exp", 0) < now:
        return False, None, "Sesi verifikator telah kedaluwarsa. Silakan lakukan autentikasi ulang."

    token_type = str(payload.get("typ", "SESSION"))
    if expected_type and token_type != expected_type:
        if token_type == "PRE_AUTH":
            return False, None, "Token pra-autentikasi MFA tidak dapat mengakses sistem sebelum verifikasi 3 tahap selesai."
        return False, None, "Jenis token autentikasi tidak sesuai untuk operasi ini."

    if expected_stage and payload.get("stage") != expected_stage:
        return False, None, f"Tahapan autentikasi tidak sesuai (membutuhkan {expected_stage}). Ulangi proses masuk."

    if require_mfa and token_type == "SESSION" and payload.get("mfa") is False:
        return False, None, "Sesi belum menyelesaikan verifikasi multi-faktor (MFA)."

    # Client binding checks (when both claim and runtime context are present)
    if payload.get("uah") and user_agent:
        expected_uah = _hash_binding(user_agent, "uah")
        if not expected_uah or not hmac.compare_digest(str(payload["uah"]), expected_uah):
            return False, None, "Sesi ditolak: identitas peramban (User-Agent) tidak cocok dengan sesi terotorisasi."

    if payload.get("ipl") and payload.get("iph") and ip_address:
        expected_iph = _hash_binding(normalize_ip(ip_address), "iph")
        if not expected_iph or not hmac.compare_digest(str(payload["iph"]), expected_iph):
            return False, None, "Strict IP Lock aktif: alamat IP klien berubah dari sesi terdaftar."

    if payload.get("dfp") and device_fingerprint:
        expected_dfp = _hash_binding(device_fingerprint, "dfp")
        if not expected_dfp or not hmac.compare_digest(str(payload["dfp"]), expected_dfp):
            return False, None, "Sidik perangkat (Device Fingerprint) tidak sesuai dengan otorisasi."

    with _STATE_LOCK:
        current_epoch = int(USER_SESSION_EPOCHS.get(nip, 1))
        if int(payload.get("ver", 1)) < current_epoch:
            return False, None, "Sesi telah dinonaktifkan karena login baru atau pencabutan sesi perangkat."

        if jti and jti in REVOKED_JTIS:
            return False, None, "Token telah dicabut atau sudah dikonsumsi."

        if token_type == "SESSION" and jti and jti in ACTIVE_SESSIONS:
            sess = ACTIVE_SESSIONS[jti]
            idle_sec = int(sess.get("idle_sec") or payload.get("idle_sec") or 900)
            last_active = int(sess.get("last_active", now))
            if (now - last_active) > idle_sec:
                REVOKED_JTIS.add(jti)
                ACTIVE_SESSIONS.pop(jti, None)
                _persist_security_state_unlocked(force=True)
                return False, None, f"Sesi kedaluwarsa karena tidak ada aktivitas lebih dari {max(1, idle_sec // 60)} menit (Idle Timeout)."
            if touch_activity:
                sess["last_active"] = now
                _persist_security_state_unlocked(force=False)

    return True, payload, None


def get_session_timings(payload: Dict[str, Any]) -> Dict[str, int]:
    """Returns remaining idle and absolute seconds for an active verified SESSION payload."""
    now = int(time.time())
    exp = int(payload.get("exp", now))
    jti = str(payload.get("jti", ""))
    default_idle = int(payload.get("idle_sec", 900))
    abs_remaining = max(0, exp - now)
    with _STATE_LOCK:
        sess = ACTIVE_SESSIONS.get(jti)
        if sess:
            idle_sec = int(sess.get("idle_sec", default_idle))
            last_active = int(sess.get("last_active", now))
            idle_remaining = max(0, min(abs_remaining, idle_sec - (now - last_active)))
            return {"idle_remaining_seconds": idle_remaining, "abs_remaining_seconds": abs_remaining}
    return {"idle_remaining_seconds": min(abs_remaining, default_idle), "abs_remaining_seconds": abs_remaining}


def revoke_jti(jti: str) -> None:
    if not jti:
        return
    with _STATE_LOCK:
        REVOKED_JTIS.add(str(jti))
        ACTIVE_SESSIONS.pop(str(jti), None)
        _persist_security_state_unlocked(force=True)


def revoke_token(token: str) -> None:
    """Adds token and its embedded JTI to revocation lists."""
    if not token:
        return
    with _STATE_LOCK:
        REVOKED_TOKENS.add(token)
        ok, payload, _ = verify_ephemeral_blob(token, prefix="ct")
        if ok and payload and payload.get("jti"):
            jti = str(payload["jti"])
            REVOKED_JTIS.add(jti)
            ACTIVE_SESSIONS.pop(jti, None)
        _persist_security_state_unlocked(force=True)


def list_user_sessions(nip: str, current_jti: Optional[str] = None) -> List[Dict[str, Any]]:
    """Lists active, non-expired sessions for a given NIP."""
    now_ts = int(time.time())
    nip_key = str(nip)
    results: List[Dict[str, Any]] = []
    with _STATE_LOCK:
        _prune_expired_sessions_unlocked(now_ts)
        for jti, sess in ACTIVE_SESSIONS.items():
            if str(sess.get("sub")) != nip_key:
                continue
            idle_sec = int(sess.get("idle_sec", 900))
            last_active = int(sess.get("last_active", now_ts))
            results.append({
                "jti": jti,
                "is_current": bool(current_jti and jti == current_jti),
                "issued_at": int(sess.get("iat", now_ts)),
                "expires_at": int(sess.get("exp", now_ts)),
                "last_active": last_active,
                "idle_remaining_seconds": max(0, idle_sec - (now_ts - last_active)),
                "device_fingerprint": sess.get("dfp_preview") or "-",
                "user_agent": sess.get("ua_preview") or "BPJS Workstation",
                "ip_address": sess.get("ip_preview") or "-",
                "strict_ip_lock": bool(sess.get("strict_ip_lock", False)),
            })
    results.sort(key=lambda item: item["last_active"], reverse=True)
    return results


def is_jti_revoked(jti: str) -> bool:
    """Checks whether a token identifier (JTI) has already been consumed or revoked."""
    if not jti:
        return True
    with _STATE_LOCK:
        return str(jti) in REVOKED_JTIS
