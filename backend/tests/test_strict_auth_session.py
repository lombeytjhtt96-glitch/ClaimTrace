import json
import os
import time
import pytest
from fastapi.testclient import TestClient

import app.main as main_mod
from app.main import app, VERIFICATOR_DIRECTORY, _lookup_otp_challenge, _persist_password_hash
from app.security.rate_limiter import rate_limiter
from app.security.token_manager import (
    create_access_token,
    verify_access_token,
    ACTIVE_SESSIONS,
)


client = TestClient(app)


def _mock_recaptcha_client(monkeypatch, *, success: bool, captured_payloads=None):
    class _FakeResp:
        def json(self):
            return {"success": success} if success else {"success": False, "error-codes": ["invalid-input-response"]}

    class _FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def post(self, url, data=None):
            if captured_payloads is not None:
                captured_payloads.append({"url": url, "data": data})
            return _FakeResp()

    monkeypatch.setattr(main_mod.httpx, "Client", _FakeClient)


@pytest.fixture(autouse=True)
def clean_security_counters():
    rate_limiter.reset_all_auth_lockouts()
    with rate_limiter._lock:
        rate_limiter._requests.clear()
    yield
    rate_limiter.reset_all_auth_lockouts()
    with rate_limiter._lock:
        rate_limiter._requests.clear()


def test_strict_session_gate_rejects_unauthenticated_and_preauth_requests(monkeypatch):
    monkeypatch.setenv("CLAIMTRACE_STRICT_API_AUTH", "1")

    res_unauth = client.get("/api/v1/claims")
    assert res_unauth.status_code == 401
    assert res_unauth.json()["error_code"] == "AUTH_SESSION_REQUIRED"

    # Health & password-reset validation endpoints remain accessible before login
    assert client.get("/api/v1/health").status_code == 200
    reset_val = client.get("/api/v1/auth/reset-password/validate?token=invalid-token")
    assert reset_val.status_code == 400

    # Stage 0 login (4 fields) issues PRE_AUTH token (NOT valid for API endpoints!)
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "username": "siti.rahma",
            "email": "siti.rahma@bpjs-kesehatan.go.id",
            "nip": "198704202011012001",
            "password": "Password123!",
            "recaptcha_token": "local-verified",
        },
        headers={"User-Agent": "StrictTestBrowser/1.0", "X-Device-Fingerprint": "DEV-STRICT-001"},
    )
    assert login_res.status_code == 200
    pre_token = login_res.json()["token"]
    assert login_res.json()["mfa_required"] is True
    assert login_res.json()["next_stage"] == "PIN_REQUIRED"
    assert login_res.json()["user"]["username"] == "siti.rahma"

    res_pre = client.get(
        "/api/v1/claims",
        headers={
            "Authorization": f"Bearer {pre_token}",
            "User-Agent": "StrictTestBrowser/1.0",
            "X-Device-Fingerprint": "DEV-STRICT-001",
        },
    )
    assert res_pre.status_code == 401

    res_verify_pre = client.get(f"/api/v1/auth/verify-session?token={pre_token}")
    assert res_verify_pre.status_code == 401


def test_sequential_mfa_and_zero_static_otp_bypass(monkeypatch):
    monkeypatch.setenv("CLAIMTRACE_STRICT_API_AUTH", "1")
    ua = "ClaimTraceWorkstation/2.4"
    dfp = "CT-FP-ALPHA-99"

    # 1. Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "identifier": "198704202011012001",
            "password": "Password123!",
            "recaptcha_token": "local-verified",
            "device_fingerprint": dfp,
        },
        headers={"User-Agent": ua, "X-Device-Fingerprint": dfp},
    )
    assert login_res.status_code == 200
    pin_stage_token = login_res.json()["token"]

    # Skipping straight to verify-otp or authorize-session with PIN_REQUIRED token fails closed
    skip_otp = client.post(
        "/api/v1/auth/verify-otp",
        json={"identifier": "198704202011012001", "otp": "849201"},
        headers={"Authorization": f"Bearer {pin_stage_token}", "User-Agent": ua},
    )
    assert skip_otp.status_code == 401

    skip_auth = client.post(
        "/api/v1/auth/authorize-session",
        json={"identifier": "198704202011012001", "device_fingerprint": dfp},
        headers={"Authorization": f"Bearer {pin_stage_token}", "User-Agent": ua},
    )
    assert skip_auth.status_code == 401

    # 2. Verify PIN (wrong PIN rejected, right PIN advances stage and consumes token)
    bad_pin = client.post(
        "/api/v1/auth/verify-pin",
        json={"identifier": "198704202011012001", "pin": "000000"},
        headers={"Authorization": f"Bearer {pin_stage_token}", "User-Agent": ua, "X-Device-Fingerprint": dfp},
    )
    assert bad_pin.status_code == 401

    pin_res = client.post(
        "/api/v1/auth/verify-pin",
        json={"identifier": "198704202011012001", "pin": "123456"},
        headers={"Authorization": f"Bearer {pin_stage_token}", "User-Agent": ua, "X-Device-Fingerprint": dfp},
    )
    assert pin_res.status_code == 200
    otp_stage_token = pin_res.json()["pre_auth_token"]

    # Replay of consumed PIN token must fail
    replay_pin = client.post(
        "/api/v1/auth/verify-pin",
        json={"identifier": "198704202011012001", "pin": "123456"},
        headers={"Authorization": f"Bearer {pin_stage_token}", "User-Agent": ua, "X-Device-Fingerprint": dfp},
    )
    assert replay_pin.status_code == 401

    # 3. Verify OTP - hardcoded legacy 849201 must NEVER bypass unless randomly drawn == 849201
    account = VERIFICATOR_DIRECTORY["198704202011012001"]
    real_otp = _lookup_otp_challenge(account)
    assert real_otp and len(real_otp) == 6
    if real_otp != "849201":
        legacy_bypass = client.post(
            "/api/v1/auth/verify-otp",
            json={"identifier": "198704202011012001", "otp": "849201"},
            headers={"Authorization": f"Bearer {otp_stage_token}", "User-Agent": ua, "X-Device-Fingerprint": dfp},
        )
        assert legacy_bypass.status_code == 401

    otp_res = client.post(
        "/api/v1/auth/verify-otp",
        json={"identifier": "198704202011012001", "otp": real_otp},
        headers={"Authorization": f"Bearer {otp_stage_token}", "User-Agent": ua, "X-Device-Fingerprint": dfp},
    )
    assert otp_res.status_code == 200
    device_stage_token = otp_res.json()["pre_auth_token"]

    # 4. Authorize Session -> issues real signed HMAC SESSION token
    auth_res = client.post(
        "/api/v1/auth/authorize-session",
        json={
            "identifier": "198704202011012001",
            "device_fingerprint": dfp,
            "session_duration_minutes": 15,
            "idle_timeout_minutes": 10,
            "revoke_other_sessions": True,
            "strict_ip_lock": True,
        },
        headers={"Authorization": f"Bearer {device_stage_token}", "User-Agent": ua, "X-Device-Fingerprint": dfp},
    )
    assert auth_res.status_code == 200
    session_token = auth_res.json()["token"]
    assert session_token.startswith("ct.")
    assert auth_res.json()["user"]["isMfaVerified"] is True

    # Verify authenticated access with matching UA + DFP
    claims_ok = client.get(
        "/api/v1/claims",
        headers={"Authorization": f"Bearer {session_token}", "User-Agent": ua, "X-Device-Fingerprint": dfp},
    )
    assert claims_ok.status_code == 200

    # Hijack attempts with mismatched UA or missing/wrong DFP fail closed (401)
    claims_bad_ua = client.get(
        "/api/v1/claims",
        headers={"Authorization": f"Bearer {session_token}", "User-Agent": "curl/8.0", "X-Device-Fingerprint": dfp},
    )
    assert claims_bad_ua.status_code == 401

    claims_no_dfp = client.get(
        "/api/v1/claims",
        headers={"Authorization": f"Bearer {session_token}", "User-Agent": ua},
    )
    assert claims_no_dfp.status_code == 401

    claims_bad_dfp = client.get(
        "/api/v1/claims",
        headers={"Authorization": f"Bearer {session_token}", "User-Agent": ua, "X-Device-Fingerprint": "WRONG-DFP"},
    )
    assert claims_bad_dfp.status_code == 401

    # Logout immediately revokes the session token
    logout_res = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {session_token}", "User-Agent": ua},
    )
    assert logout_res.status_code == 200
    claims_after_logout = client.get(
        "/api/v1/claims",
        headers={"Authorization": f"Bearer {session_token}", "User-Agent": ua, "X-Device-Fingerprint": dfp},
    )
    assert claims_after_logout.status_code == 401


def test_session_epoch_invalidation_and_idle_timeout():
    profile = {"nip": "199208152015031002", "name": "Budi Santoso", "role": "ANALYST"}
    tok1 = create_access_token(profile, ttl_minutes=60, idle_timeout_minutes=1)
    assert verify_access_token(tok1)[0] is True

    # Simulate idle timeout exceeding idle_sec (60s)
    ok, payload1, _ = verify_access_token(tok1)
    assert ok and payload1
    jti1 = payload1["jti"]
    ACTIVE_SESSIONS[jti1]["last_active"] = int(time.time()) - 120
    ok_idle, _, err_idle = verify_access_token(tok1)
    assert ok_idle is False
    assert "Idle Timeout" in err_idle

    # Epoch bump invalidates prior active session token
    tok2 = create_access_token(profile, ttl_minutes=60, idle_timeout_minutes=15)
    assert verify_access_token(tok2)[0] is True
    main_mod.bump_user_session_epoch("199208152015031002")
    ok_epoch, _, err_epoch = verify_access_token(tok2)
    assert ok_epoch is False
    assert "dinonaktifkan" in err_epoch


def test_google_recaptcha_v2_and_strict_4field_login(monkeypatch):
    monkeypatch.setenv("RECAPTCHA_ENFORCE_ALL_LAYERS", "false")
    monkeypatch.setenv("RECAPTCHA_SECRET_KEY", "test-recaptcha-secret")

    # Partial 4-field submission must fail (missing email) even in test mode
    partial_res = client.post(
        "/api/v1/auth/login",
        json={
            "username": "siti.rahma",
            "nip": "198704202011012001",
            "password": "Password123!",
            "recaptcha_token": "local-verified",
        },
    )
    assert partial_res.status_code == 400

    # Simulate non-pytest live runtime: legacy single identifier & dummy tokens must be rejected
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)

    legacy_only_res = client.post(
        "/api/v1/auth/login",
        json={
            "identifier": "198704202011012001",
            "password": "Password123!",
            "recaptcha_token": "google-token",
        },
    )
    assert legacy_only_res.status_code == 400

    dummy_cap_res = client.post(
        "/api/v1/auth/login",
        json={
            "username": "siti.rahma",
            "email": "siti.rahma@bpjs-kesehatan.go.id",
            "nip": "198704202011012001",
            "password": "Password123!",
            "recaptcha_token": "local-verified",
        },
    )
    assert dummy_cap_res.status_code == 400

    missing_cap_res = client.post(
        "/api/v1/auth/login",
        json={
            "username": "siti.rahma",
            "email": "siti.rahma@bpjs-kesehatan.go.id",
            "nip": "198704202011012001",
            "password": "Password123!",
        },
    )
    assert missing_cap_res.status_code == 400

    # Google siteverify rejection -> 400
    _mock_recaptcha_client(monkeypatch, success=False)
    rejected_cap = client.post(
        "/api/v1/auth/login",
        json={
            "username": "siti.rahma",
            "email": "siti.rahma@bpjs-kesehatan.go.id",
            "nip": "198704202011012001",
            "password": "Password123!",
            "recaptcha_token": "real-google-token-invalid",
        },
    )
    assert rejected_cap.status_code == 400

    # Reset test client rate-limit & lockout counters between test phases
    rate_limiter.reset_all_auth_lockouts()
    with rate_limiter._lock:
        rate_limiter._requests.clear()

    # Google siteverify approval + mismatched username (cross-account mixup) -> 401
    captured = []
    _mock_recaptcha_client(monkeypatch, success=True, captured_payloads=captured)
    mismatch_res = client.post(
        "/api/v1/auth/login",
        json={
            "username": "auditor.wasrik",
            "email": "siti.rahma@bpjs-kesehatan.go.id",
            "nip": "198704202011012001",
            "password": "Password123!",
            "recaptcha_token": "real-google-token-ok",
        },
    )
    assert mismatch_res.status_code == 401
    assert captured and captured[0]["url"] == "https://www.google.com/recaptcha/api/siteverify"
    assert captured[0]["data"]["response"] == "real-google-token-ok"

    # Valid 4 fields + verified Google reCAPTCHA -> 200 PRE_AUTH
    ok_res = client.post(
        "/api/v1/auth/login",
        json={
            "username": "siti.rahma",
            "email": "siti.rahma@bpjs-kesehatan.go.id",
            "nip": "198704202011012001",
            "password": "Password123!",
            "recaptcha_token": "real-google-token-ok",
        },
    )
    assert ok_res.status_code == 200
    assert ok_res.json()["next_stage"] == "PIN_REQUIRED"
    assert ok_res.json()["user"]["username"] == "siti.rahma"


def test_forgot_and_reset_password_lifecycle(monkeypatch, tmp_path):
    monkeypatch.setenv("RECAPTCHA_ENFORCE_ALL_LAYERS", "false")
    monkeypatch.setenv("RECAPTCHA_SECRET_KEY", "test-recaptcha-secret")
    monkeypatch.setenv("CLAIMTRACE_PUBLIC_URL", "http://localhost:3000")
    spool_path = tmp_path / "reset_spool.json"
    creds_path = tmp_path / "auth_creds.json"
    monkeypatch.setattr(main_mod, "PASSWORD_RESET_SPOOL_FILE", spool_path)
    monkeypatch.setattr(main_mod, "AUTH_CREDENTIALS_FILE", creds_path)

    nip = "198704202011012001"
    orig_hash = VERIFICATOR_DIRECTORY[nip]["password_hash"]

    try:
        # Missing CAPTCHA on forgot-password is always rejected even in pytest
        no_cap = client.post(
            "/api/v1/auth/forgot-password",
            json={
                "username": "siti.rahma",
                "email": "siti.rahma@bpjs-kesehatan.go.id",
                "nip": nip,
            },
        )
        assert no_cap.status_code == 400

        # Simulate live environment with isolated tmp_path spool/credentials files
        monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)

        # Valid Google reCAPTCHA mock
        _mock_recaptcha_client(monkeypatch, success=True)

        # Mismatched username/email/nip returns neutral 200 without creating a reset link or leaking tokens
        unmatched = client.post(
            "/api/v1/auth/forgot-password",
            json={
                "username": "auditor.wasrik",
                "email": "siti.rahma@bpjs-kesehatan.go.id",
                "nip": nip,
                "recaptcha_token": "valid-google-token",
            },
        )
        assert unmatched.status_code == 200
        assert "reset_token" not in unmatched.json()
        assert "reset_link" not in unmatched.json()
        assert not spool_path.exists()

        # Matched 3 fields dispatches reset link to spool (without exposing token in HTTP JSON)
        matched = client.post(
            "/api/v1/auth/forgot-password",
            json={
                "username": "siti.rahma",
                "email": "siti.rahma@bpjs-kesehatan.go.id",
                "nip": nip,
                "recaptcha_token": "valid-google-token",
            },
        )
        assert matched.status_code == 200
        assert "reset_token" not in matched.json()
        assert "reset_link" not in matched.json()
        assert spool_path.exists()
        assert (spool_path.stat().st_mode & 0o777) == 0o600

        entries = json.loads(spool_path.read_text(encoding="utf-8"))
        assert len(entries) == 1
        reset_token = entries[0]["reset_token"]
        assert reset_token.startswith("ctrst.")
        assert entries[0]["reset_link"] == f"http://localhost:3000/?view=reset_password&token={reset_token}"

        # Tampered token rejected
        assert client.get(f"/api/v1/auth/reset-password/validate?token={reset_token}x").status_code == 400

        # Valid token passes pre-validation and masks email
        val_res = client.get(f"/api/v1/auth/reset-password/validate?token={reset_token}")
        assert val_res.status_code == 200
        assert val_res.json()["username"] == "siti.rahma"
        assert "@bpjs-kesehatan.go.id" in val_res.json()["email_masked"]
        assert val_res.json()["expires_in_seconds"] > 0

        # Active session minted before password reset must be invalidated afterward
        prior_session = create_access_token(
            VERIFICATOR_DIRECTORY[nip],
            ttl_minutes=30,
            mfa_verified=True,
            stage="AUTHORIZED",
        )
        assert verify_access_token(prior_session)[0] is True

        # Reject mismatched confirm, weak password, and reusing old password
        assert client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": reset_token,
                "new_password": "Str0ngNew#Pass2026",
                "confirm_password": "Different#Pass2026",
            },
        ).status_code == 400

        assert client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": reset_token,
                "new_password": "weak",
                "confirm_password": "weak",
            },
        ).status_code == 400

        assert client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": reset_token,
                "new_password": "Password123!",
                "confirm_password": "Password123!",
            },
        ).status_code == 400

        # Valid reset succeeds, revokes token JTI, bumps epoch, and rotates password hash
        reset_res = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": reset_token,
                "new_password": "Str0ngNew#Pass2026",
                "confirm_password": "Str0ngNew#Pass2026",
            },
        )
        assert reset_res.status_code == 200
        assert creds_path.exists()
        assert (creds_path.stat().st_mode & 0o777) == 0o600

        # Single-use guarantee: validation & replay fail after consumption
        assert client.get(f"/api/v1/auth/reset-password/validate?token={reset_token}").status_code == 400
        assert client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": reset_token,
                "new_password": "Another#Pass2027",
                "confirm_password": "Another#Pass2027",
            },
        ).status_code == 400

        # Prior active session invalidated via epoch bump
        assert verify_access_token(prior_session)[0] is False

        # Old password fails, new password works
        old_login = client.post(
            "/api/v1/auth/login",
            json={
                "username": "siti.rahma",
                "email": "siti.rahma@bpjs-kesehatan.go.id",
                "nip": nip,
                "password": "Password123!",
                "recaptcha_token": "valid-google-token",
            },
        )
        assert old_login.status_code == 401

        new_login = client.post(
            "/api/v1/auth/login",
            json={
                "username": "siti.rahma",
                "email": "siti.rahma@bpjs-kesehatan.go.id",
                "nip": nip,
                "password": "Str0ngNew#Pass2026",
                "recaptcha_token": "valid-google-token",
            },
        )
        assert new_login.status_code == 200
    finally:
        _persist_password_hash(nip, orig_hash)
        rate_limiter.reset_all_auth_lockouts()




def test_strict_email_and_numeric_nip_validation(monkeypatch):
    monkeypatch.setenv("RECAPTCHA_SECRET_KEY", "test-recaptcha-secret")
    rate_limiter.reset_all_auth_lockouts()
    with rate_limiter._lock:
        rate_limiter._requests.clear()

    # Invalid emails (missing @ or .) must be rejected with HTTP 400
    for bad_email in ("siti.rahma", "siti@localhost", "siti@bpjs."):
        rate_limiter.reset_all_auth_lockouts()
        with rate_limiter._lock:
            rate_limiter._requests.clear()
        res_login = client.post(
            "/api/v1/auth/login",
            json={
                "username": "siti.rahma",
                "email": bad_email,
                "nip": "198704202011012001",
                "password": "Password123!",
                "recaptcha_token": "real-google-token-ok",
            },
        )
        assert res_login.status_code == 400

        res_forgot = client.post(
            "/api/v1/auth/forgot-password",
            json={
                "username": "siti.rahma",
                "email": bad_email,
                "nip": "198704202011012001",
                "recaptcha_token": "real-google-token-ok",
            },
        )
        assert res_forgot.status_code == 400

    # Non-digit NIP values must be rejected with HTTP 400
    for bad_nip in ("19870420abc", "19870420 001", "١٩٨٧٠٤٢٠"):
        rate_limiter.reset_all_auth_lockouts()
        with rate_limiter._lock:
            rate_limiter._requests.clear()
        res_login = client.post(
            "/api/v1/auth/login",
            json={
                "username": "siti.rahma",
                "email": "siti.rahma@bpjs-kesehatan.go.id",
                "nip": bad_nip,
                "password": "Password123!",
                "recaptcha_token": "real-google-token-ok",
            },
        )
        assert res_login.status_code == 400

        res_forgot = client.post(
            "/api/v1/auth/forgot-password",
            json={
                "username": "siti.rahma",
                "email": "siti.rahma@bpjs-kesehatan.go.id",
                "nip": bad_nip,
                "recaptcha_token": "real-google-token-ok",
            },
        )
        assert res_forgot.status_code == 400


def _mock_multilayer_recaptcha_client(
    monkeypatch,
    *,
    v2_secret: str = "sec-v2",
    v3_secret: str = "sec-v3",
    v2_success: bool = True,
    v3_success: bool = True,
    v3_score: float = 0.9,
    v3_action: str = "login",
    ent_status_code: int = 200,
    ent_valid: bool = True,
    ent_score: float = 0.9,
    ent_action: str = "LOGIN",
    captured_calls=None,
):
    class _MockResp:
        def __init__(self, status_code, payload):
            self.status_code = status_code
            self._payload = payload

        def json(self):
            return self._payload

    class _MockClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def post(self, url, data=None, json=None):
            if captured_calls is not None:
                captured_calls.append({"url": url, "data": data, "json": json})
            if "recaptcha/api/siteverify" in url:
                secret = (data or {}).get("secret")
                if secret == v2_secret:
                    return _MockResp(
                        200,
                        {"success": v2_success}
                        if v2_success
                        else {"success": False, "error-codes": ["invalid-input-response"]},
                    )
                if secret == v3_secret:
                    return _MockResp(
                        200,
                        {"success": v3_success, "score": v3_score, "action": v3_action}
                        if v3_success
                        else {"success": False, "error-codes": ["invalid-input-response"]},
                    )
                return _MockResp(200, {"success": False, "error-codes": ["invalid-input-secret"]})

            if "recaptchaenterprise.googleapis.com" in url:
                return _MockResp(
                    ent_status_code,
                    {
                        "tokenProperties": {"valid": ent_valid, "action": ent_action},
                        "riskAnalysis": {"score": ent_score, "reasons": []},
                    },
                )
            return _MockResp(500, {})

    monkeypatch.setattr(main_mod.httpx, "Client", _MockClient)


def test_all_recaptcha_layers_v2_v3_enterprise_enforced(monkeypatch, tmp_path):
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    monkeypatch.setenv("RECAPTCHA_ENFORCE_ALL_LAYERS", "true")
    monkeypatch.setenv("RECAPTCHA_V2_SECRET_KEY", "sec-v2")
    monkeypatch.setenv("RECAPTCHA_V3_SECRET_KEY", "sec-v3")
    monkeypatch.setenv("RECAPTCHA_V3_MIN_SCORE", "0.5")
    monkeypatch.setenv("RECAPTCHA_ENTERPRISE_PROJECT_ID", "gemini-510606")
    monkeypatch.setenv("RECAPTCHA_ENTERPRISE_SITE_KEY", "6Lc2NSEuAAAAADW7f9jk2eC16oSjNfNnmwcvv5QE")
    monkeypatch.setenv("RECAPTCHA_ENTERPRISE_MIN_SCORE", "0.5")
    monkeypatch.setenv("RECAPTCHA_ENTERPRISE_SECRET_KEY", "")

    base_login = {
        "username": "siti.rahma",
        "email": "siti.rahma@bpjs-kesehatan.go.id",
        "nip": "198704202011012001",
        "password": "Password123!",
    }

    # 1. Missing v3 or enterprise token must reject with 400
    assert (
        client.post("/api/v1/auth/login", json={**base_login, "recaptcha_v2_token": "tok-v2"}).status_code
        == 400
    )
    assert (
        client.post(
            "/api/v1/auth/login",
            json={**base_login, "recaptcha_v2_token": "tok-v2", "recaptcha_v3_token": "tok-v3"},
        ).status_code
        == 400
    )

    full_tokens = {
        "recaptcha_token": "tok-v2",
        "recaptcha_v2_token": "tok-v2",
        "recaptcha_v3_token": "tok-v3",
        "recaptcha_v3_action": "login",
        "recaptcha_enterprise_token": "tok-ent",
        "recaptcha_enterprise_action": "LOGIN",
    }

    def _clear_rate_limits():
        rate_limiter.reset_all_auth_lockouts()
        with rate_limiter._lock:
            rate_limiter._requests.clear()

    # 2. Missing RECAPTCHA_ENTERPRISE_API_KEY and secret fails closed with 503 after v2 & v3 pass
    _clear_rate_limits()
    monkeypatch.setenv("RECAPTCHA_ENTERPRISE_API_KEY", "")
    _mock_multilayer_recaptcha_client(monkeypatch)
    no_ent_cfg = client.post("/api/v1/auth/login", json={**base_login, **full_tokens})
    assert no_ent_cfg.status_code == 503

    # 3. With API key configured, v3 low score is rejected (400)
    _clear_rate_limits()
    monkeypatch.setenv("RECAPTCHA_ENTERPRISE_API_KEY", "test-ent-api-key")
    _mock_multilayer_recaptcha_client(monkeypatch, v3_score=0.2)
    low_v3 = client.post("/api/v1/auth/login", json={**base_login, **full_tokens})
    assert low_v3.status_code == 400

    # 4. v3 action mismatch is rejected (400)
    _clear_rate_limits()
    _mock_multilayer_recaptcha_client(monkeypatch, v3_action="wrong_action")
    bad_v3_act = client.post("/api/v1/auth/login", json={**base_login, **full_tokens})
    assert bad_v3_act.status_code == 400

    # 5. Enterprise invalid tokenProperties.valid=False is rejected (400)
    _clear_rate_limits()
    _mock_multilayer_recaptcha_client(monkeypatch, ent_valid=False)
    bad_ent = client.post("/api/v1/auth/login", json={**base_login, **full_tokens})
    assert bad_ent.status_code == 400

    # 6. Enterprise low score is rejected (400)
    _clear_rate_limits()
    _mock_multilayer_recaptcha_client(monkeypatch, ent_score=0.1)
    low_ent = client.post("/api/v1/auth/login", json={**base_login, **full_tokens})
    assert low_ent.status_code == 400

    _clear_rate_limits()

    # 7. All 3 layers passing (v2 + v3 + Enterprise CreateAssessment) -> 200 PRE_AUTH
    calls = []
    _mock_multilayer_recaptcha_client(monkeypatch, captured_calls=calls)
    ok_login = client.post("/api/v1/auth/login", json={**base_login, **full_tokens})
    assert ok_login.status_code == 200
    assert ok_login.json()["next_stage"] == "PIN_REQUIRED"
    assert len(calls) == 3
    assert "siteverify" in calls[0]["url"] and calls[0]["data"]["secret"] == "sec-v2"
    assert "siteverify" in calls[1]["url"] and calls[1]["data"]["secret"] == "sec-v3"
    assert (
        "recaptchaenterprise.googleapis.com/v1/projects/gemini-510606/assessments?key=test-ent-api-key"
        in calls[2]["url"]
    )
    assert calls[2]["json"]["event"]["siteKey"] == "6Lc2NSEuAAAAADW7f9jk2eC16oSjNfNnmwcvv5QE"
    assert calls[2]["json"]["event"]["expectedAction"] == "LOGIN"

    # 8. Forgot-password also enforces all 3 layers cleanly
    spool_path = tmp_path / "reset_spool_multi.json"
    monkeypatch.setattr(main_mod, "PASSWORD_RESET_SPOOL_FILE", spool_path)
    forgot_calls = []
    _mock_multilayer_recaptcha_client(
        monkeypatch,
        v3_action="forgot_password",
        ent_action="FORGOT_PASSWORD",
        captured_calls=forgot_calls,
    )
    ok_forgot = client.post(
        "/api/v1/auth/forgot-password",
        json={
            "username": "siti.rahma",
            "email": "siti.rahma@bpjs-kesehatan.go.id",
            "nip": "198704202011012001",
            "recaptcha_token": "tok-v2",
            "recaptcha_v2_token": "tok-v2",
            "recaptcha_v3_token": "tok-v3",
            "recaptcha_v3_action": "forgot_password",
            "recaptcha_enterprise_token": "tok-ent",
            "recaptcha_enterprise_action": "FORGOT_PASSWORD",
        },
    )
    assert ok_forgot.status_code == 200
    assert len(forgot_calls) == 3


def test_recaptcha_v2_and_invisible_v3_enforced_without_enterprise(monkeypatch, tmp_path):
    monkeypatch.setenv("CLAIMTRACE_ENFORCE_RECAPTCHA_IN_TEST", "1")
    monkeypatch.setenv("RECAPTCHA_ENFORCE_ALL_LAYERS", "v2_v3")
    monkeypatch.setenv("RECAPTCHA_V2_SECRET_KEY", "sec-v2")
    monkeypatch.setenv("RECAPTCHA_V3_SECRET_KEY", "sec-v3")
    monkeypatch.setenv("RECAPTCHA_V3_MIN_SCORE", "0.5")
    monkeypatch.setenv("RECAPTCHA_ENTERPRISE_API_KEY", "")
    monkeypatch.setenv("RECAPTCHA_ENTERPRISE_SECRET_KEY", "")

    base_login = {
        "username": "siti.rahma",
        "email": "siti.rahma@bpjs-kesehatan.go.id",
        "nip": "198704202011012001",
        "password": "Password123!",
    }

    # 1. Missing v3 token must be rejected with 400
    assert (
        client.post("/api/v1/auth/login", json={**base_login, "recaptcha_v2_token": "tok-v2"}).status_code
        == 400
    )

    # 2. Low v3 score is rejected with 400 without requiring Enterprise
    _mock_multilayer_recaptcha_client(monkeypatch, v3_score=0.2)
    full_v2_v3_payload = {
        **base_login,
        "recaptcha_token": "tok-v2",
        "recaptcha_v2_token": "tok-v2",
        "recaptcha_v3_token": "tok-v3",
        "recaptcha_v3_action": "login",
    }
    assert client.post("/api/v1/auth/login", json=full_v2_v3_payload).status_code == 400

    # 3. Valid v2 + invisible v3 succeeds with exactly 2 siteverify calls (no Enterprise call)
    calls = []
    _mock_multilayer_recaptcha_client(monkeypatch, captured_calls=calls)
    ok_login = client.post("/api/v1/auth/login", json=full_v2_v3_payload)
    assert ok_login.status_code == 200
    assert ok_login.json()["next_stage"] == "PIN_REQUIRED"
    assert len(calls) == 2
    assert "siteverify" in calls[0]["url"] and calls[0]["data"]["secret"] == "sec-v2"
    assert "siteverify" in calls[1]["url"] and calls[1]["data"]["secret"] == "sec-v3"

    # 4. Forgot-password also enforces v2 + invisible v3 without Enterprise
    spool_path = tmp_path / "reset_spool_v2_v3.json"
    monkeypatch.setattr(main_mod, "PASSWORD_RESET_SPOOL_FILE", spool_path)
    forgot_calls = []
    _mock_multilayer_recaptcha_client(
        monkeypatch,
        v3_action="forgot_password",
        captured_calls=forgot_calls,
    )
    ok_forgot = client.post(
        "/api/v1/auth/forgot-password",
        json={
            "username": "siti.rahma",
            "email": "siti.rahma@bpjs-kesehatan.go.id",
            "nip": "198704202011012001",
            "recaptcha_token": "tok-v2",
            "recaptcha_v2_token": "tok-v2",
            "recaptcha_v3_token": "tok-v3",
            "recaptcha_v3_action": "forgot_password",
        },
    )
    assert ok_forgot.status_code == 200
    assert len(forgot_calls) == 2


def test_sendcorex_primary_dispatch_and_spool_fallback(monkeypatch, tmp_path, caplog):
    mail_calls = []

    class _FakeResp:
        def __init__(self, status_code, body, headers=None):
            self.status_code = status_code
            self._body = body
            self.headers = headers or {}
            self.text = body if isinstance(body, str) else json.dumps(body)

        def json(self):
            if isinstance(self._body, str):
                raise ValueError("Expecting value: line 1 column 1 (char 0)")
            return self._body

    class _RoutingMailClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def post(self, url, headers=None, json=None, data=None):
            if "siteverify" in url:
                return _FakeResp(200, {"success": True, "score": 0.9, "action": (data or {}).get("action", "forgot_password")})
            if "/v3.0/send" in url:
                mail_calls.append({"provider": "sendcorex", "url": url, "headers": headers or {}, "json": json or {}})
                return _FakeResp(
                    200,
                    {
                        "success": True,
                        "message": "Email queued successfully",
                        "code": "EMAIL_QUEUED_SUCCESS",
                        "id": f"scx_{len(mail_calls)}",
                        "recipients": 1,
                    },
                )
            return _FakeResp(404, {"message": "not found"})

    monkeypatch.setenv("CLAIMTRACE_ENABLE_SENDCOREX_IN_TEST", "1")
    monkeypatch.setenv("SENDCOREX_API_KEY", "S.C.X.test_key")
    monkeypatch.setenv("SENDCOREX_API_URL", "https://mail.sendcorex.com/v3.0/send")
    monkeypatch.setenv("SENDCOREX_FROM_EMAIL", "claimtrace-portal@corexsend.com")
    monkeypatch.setenv("SENDCOREX_FROM_NAME", "ClaimTrace Portal")
    monkeypatch.setenv("SENDCOREX_REPLY_TO", "lombeytjhtt96@gmail.com")
    monkeypatch.setenv("RECAPTCHA_ENFORCE_ALL_LAYERS", "false")
    monkeypatch.setenv("RECAPTCHA_SECRET_KEY", "test-recaptcha-secret")
    monkeypatch.setenv("CLAIMTRACE_PUBLIC_URL", "http://localhost:3000")
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    monkeypatch.setattr(main_mod.httpx, "Client", _RoutingMailClient)

    otp_spool = tmp_path / "otp_spool_scx.json"
    reset_spool = tmp_path / "reset_spool_scx.json"
    monkeypatch.setattr(main_mod, "OTP_MAIL_SPOOL_FILE", otp_spool)
    monkeypatch.setattr(main_mod, "PASSWORD_RESET_SPOOL_FILE", reset_spool)

    acct = VERIFICATOR_DIRECTORY["198704202011012001"]
    main_mod._dispatch_otp_and_spool(acct, reason="UNIT_TEST_SCX_OTP")

    # Primary Sendcorex succeeds
    assert len(mail_calls) == 1
    scx_otp = mail_calls[0]
    assert scx_otp["provider"] == "sendcorex"
    assert scx_otp["url"] == "https://mail.sendcorex.com/v3.0/send"
    assert scx_otp["headers"]["Authorization"] == "Bearer S.C.X.test_key"
    assert scx_otp["headers"]["Idempotency-Key"]
    assert scx_otp["json"]["from"] == "claimtrace-portal@corexsend.com"
    assert scx_otp["json"]["senderName"] == "ClaimTrace Portal"
    assert scx_otp["json"]["replyTo"] == "lombeytjhtt96@gmail.com"
    assert scx_otp["json"]["to"] == acct["email"]
    assert scx_otp["json"]["transactional"] is True
    assert "<!DOCTYPE html>" in scx_otp["json"]["body"]
    otp_entries = json.loads(otp_spool.read_text(encoding="utf-8"))
    assert otp_entries[-1]["sendcorex_sent"] is True
    assert otp_entries[-1]["sendcorex_message_id"] == "scx_1"
    assert otp_entries[-1]["smtp_sent"] is False

    # Password reset via Sendcorex primary
    forgot_res = client.post(
        "/api/v1/auth/forgot-password",
        json={
            "username": acct["username"],
            "email": acct["email"],
            "nip": acct["nip"],
            "recaptcha_token": "valid-google-token",
        },
    )
    assert forgot_res.status_code == 200
    assert len(mail_calls) == 2
    assert mail_calls[1]["provider"] == "sendcorex"
    assert "/?view=reset_password&amp;token=ctrst." in mail_calls[1]["json"]["body"]
    rst_entries = json.loads(reset_spool.read_text(encoding="utf-8"))
    assert rst_entries[-1]["sendcorex_sent"] is True
    assert rst_entries[-1]["sendcorex_message_id"] == "scx_2"

    # Graceful local 0600 spool fallback when Sendcorex fails
    class _SendcorexDownClient(_RoutingMailClient):
        def post(self, url, headers=None, json=None, data=None):
            if "/v3.0/send" in url:
                return _FakeResp(503, {"success": False, "code": "UPSTREAM_UNAVAILABLE", "message": "Temporary outage"})
            return super().post(url, headers=headers, json=json, data=data)

    monkeypatch.setattr(main_mod.httpx, "Client", _SendcorexDownClient)
    with caplog.at_level("WARNING", logger="claimtrace"):
        main_mod._dispatch_otp_and_spool(acct, reason="UNIT_TEST_SCX_FALLBACK")
    assert len(mail_calls) == 2
    otp_entries_fallback = json.loads(otp_spool.read_text(encoding="utf-8"))
    assert otp_entries_fallback[-1]["sendcorex_sent"] is False
    assert otp_entries_fallback[-1]["smtp_sent"] is False
    assert "UPSTREAM_UNAVAILABLE" in caplog.text

    # Reject HTTP 200 HTML/WAF block pages instead of falsely marking sendcorex_sent=True
    class _WafHtmlBlockClient(_RoutingMailClient):
        def post(self, url, headers=None, json=None, data=None):
            if "/v3.0/send" in url:
                return _FakeResp(
                    200,
                    "<!DOCTYPE html><html><head><title>Access Denied - Spike Security</title></head><body>Blocked</body></html>",
                    headers={"content-type": "text/html; charset=UTF-8"},
                )
            return super().post(url, headers=headers, json=json, data=data)

    caplog.clear()
    monkeypatch.setattr(main_mod.httpx, "Client", _WafHtmlBlockClient)
    with caplog.at_level("WARNING", logger="claimtrace"):
        main_mod._dispatch_otp_and_spool(acct, reason="UNIT_TEST_SCX_WAF_HTML")
    assert len(mail_calls) == 2
    otp_entries_waf = json.loads(otp_spool.read_text(encoding="utf-8"))
    assert otp_entries_waf[-1]["sendcorex_sent"] is False
    assert otp_entries_waf[-1]["sendcorex_message_id"] is None
    assert otp_entries_waf[-1]["smtp_sent"] is False
    assert "non-JSON text/html: Access Denied - Spike Security" in caplog.text


def test_sendcorex_webhook_hmac_verification_and_audit_ledger(monkeypatch):
    import hashlib as _hashlib
    import hmac as _hmac

    main_mod.SENDCOREX_WEBHOOK_EVENTS.clear()
    monkeypatch.setenv("CLAIMTRACE_STRICT_API_AUTH", "1")

    # 1. Protected read route requires authenticated MFA session
    unauth_events = client.get("/api/v1/webhooks/sendcorex/events")
    assert unauth_events.status_code == 401

    # 2. Callback route is exempt from browser JWT gate, but fails closed without secret
    monkeypatch.setenv("SENDCOREX_WEBHOOK_SECRET", "")
    sample_delivered = {
        "event": "delivered",
        "emailId": "em_scx_001",
        "timestamp": "2026-11-16T06:00:00.000Z",
        "data": {
            "recipientEmail": "verifikator.rahasia@gmail.com",
            "fromAddress": "claimtrace-portal@corexsend.com",
        },
    }
    raw_delivered = json.dumps(sample_delivered).encode("utf-8")
    no_secret_res = client.post("/api/v1/webhooks/sendcorex", content=raw_delivered)
    assert no_secret_res.status_code == 503

    # 3. Rejects missing or wrong HMAC-SHA256 signature and records security event
    secret = "whsec_claimtrace_test_secret_2026"
    monkeypatch.setenv("SENDCOREX_WEBHOOK_SECRET", secret)
    bad_sig_res = client.post(
        "/api/v1/webhooks/sendcorex",
        content=raw_delivered,
        headers={"X-Webhook-Signature": "sha256=" + ("0" * 64), "Content-Type": "application/json"},
    )
    assert bad_sig_res.status_code == 401
    assert main_mod.audit_logger.chain[-1]["event_type"] == "EMAIL_WEBHOOK_SIGNATURE_INVALID"

    # 4. Accepts valid raw-body HMAC signature, masks PII, appends immutable Audit Ledger entry
    def _sign(raw_bytes: bytes) -> str:
        return "sha256=" + _hmac.new(secret.encode("utf-8"), raw_bytes, _hashlib.sha256).hexdigest()

    delivered_res = client.post(
        "/api/v1/webhooks/sendcorex",
        content=raw_delivered,
        headers={"X-Webhook-Signature": _sign(raw_delivered), "Content-Type": "application/json"},
    )
    assert delivered_res.status_code == 200
    d_body = delivered_res.json()
    assert d_body["status"] == "accepted"
    assert d_body["duplicate"] is False
    assert d_body["event"] == "delivered"
    assert d_body["audit_event_type"] == "EMAIL_WEBHOOK_DELIVERY"

    last_audit = main_mod.audit_logger.chain[-1]
    assert last_audit["event_type"] == "EMAIL_WEBHOOK_DELIVERY"
    assert last_audit["payload"]["recipient_masked"] != "verifikator.rahasia@gmail.com"
    assert last_audit["payload"]["recipient_masked"].endswith("@gmail.com")
    assert "verifikator.rahasia" not in json.dumps(last_audit)

    # 5. Deduplicates identical webhook retries without duplicating ledger entries
    chain_len_before_retry = len(main_mod.audit_logger.chain)
    dup_res = client.post(
        "/api/v1/webhooks/sendcorex",
        content=raw_delivered,
        headers={"X-Webhook-Signature": _sign(raw_delivered), "Content-Type": "application/json"},
    )
    assert dup_res.status_code == 200
    assert dup_res.json()["duplicate"] is True
    assert len(main_mod.audit_logger.chain) == chain_len_before_retry

    # 6. Maps bounced/spam/fbl_complaint to EMAIL_WEBHOOK_ALERT
    raw_bounced = json.dumps(
        {
            "event": "bounced",
            "emailId": "em_scx_002",
            "timestamp": "2026-11-16T06:01:00.000Z",
            "data": {
                "recipientEmail": "invalid.target@example.id",
                "fromAddress": "claimtrace-portal@corexsend.com",
                "reason": "Suppressed — Hard bounce within 90 days",
                "suppressed": True,
            },
        }
    ).encode("utf-8")
    bounced_res = client.post(
        "/api/v1/webhooks/sendcorex",
        content=raw_bounced,
        headers={"X-Webhook-Signature": _sign(raw_bounced), "Content-Type": "application/json"},
    )
    assert bounced_res.status_code == 200
    assert bounced_res.json()["audit_event_type"] == "EMAIL_WEBHOOK_ALERT"
    assert main_mod.audit_logger.chain[-1]["payload"]["suppressed"] is True

    valid_chain, broken_idx = main_mod.audit_logger.verify_integrity()
    assert valid_chain is True
    assert broken_idx == -1

    # 7. Authenticated MFA session can inspect recorded webhook summary & events
    acct = VERIFICATOR_DIRECTORY["198704202011012001"]
    mfa_token = create_access_token(
        acct,
        ttl_minutes=60,
        token_type="SESSION",
        stage="AUTHENTICATED",
        mfa_verified=True,
        device_fingerprint="DEV-WEBHOOK-01",
        user_agent="WebhookTestBrowser/1.0",
        ip_address="127.0.0.1",
    )
    events_res = client.get(
        "/api/v1/webhooks/sendcorex/events?limit=10",
        headers={
            "Authorization": f"Bearer {mfa_token}",
            "X-Device-Fingerprint": "DEV-WEBHOOK-01",
            "User-Agent": "WebhookTestBrowser/1.0",
        },
    )
    assert events_res.status_code == 200
    ev_json = events_res.json()
    assert ev_json["webhook_secret_configured"] is True
    assert ev_json["total_events"] == 2
    assert ev_json["counts_by_event"] == {"delivered": 1, "bounced": 1}


def test_jury_demo_admin_login_feature_gate(monkeypatch):
    # 1. Fail-closed by default in pytest when CLAIMTRACE_ALLOW_JURY_DEMO is not enabled
    monkeypatch.delenv("CLAIMTRACE_ALLOW_JURY_DEMO", raising=False)
    monkeypatch.setenv("CLAIMTRACE_STRICT_API_AUTH", "0")
    st_off = client.get("/api/v1/auth/jury-demo-status")
    assert st_off.status_code == 200
    assert st_off.json()["enabled"] is False
    deny_res = client.post("/api/v1/auth/jury-demo-login", json={"device_fingerprint": "JURY-TEST-FP"})
    assert deny_res.status_code == 403

    # 2. Never allowed when CLAIMTRACE_STRICT_API_AUTH=1 even if jury flag is set
    monkeypatch.setenv("CLAIMTRACE_STRICT_API_AUTH", "1")
    monkeypatch.setenv("CLAIMTRACE_ALLOW_JURY_DEMO", "1")
    assert client.get("/api/v1/auth/jury-demo-status").json()["enabled"] is False
    assert client.post("/api/v1/auth/jury-demo-login", json={"device_fingerprint": "JURY-TEST-FP"}).status_code == 403

    # 3. Issues real signed ADMIN SESSION JWT when enabled under non-strict demo mode
    monkeypatch.setenv("CLAIMTRACE_STRICT_API_AUTH", "0")
    monkeypatch.setenv("CLAIMTRACE_ALLOW_JURY_DEMO", "1")
    assert client.get("/api/v1/auth/jury-demo-status").json()["enabled"] is True

    ok_res = client.post(
        "/api/v1/auth/jury-demo-login",
        json={"device_fingerprint": "JURY-EVAL-FP01"},
        headers={"User-Agent": "JuryEvalBrowser/1.0"},
    )
    assert ok_res.status_code == 200
    body = ok_res.json()
    assert body["token"].startswith("ct.")
    assert body["user"]["isMfaVerified"] is True
    assert "ADMIN" in (body["user"].get("allowedRoles") or [])

    verify_res = client.get(
        "/api/v1/auth/verify-session",
        headers={
            "Authorization": f"Bearer {body['token']}",
            "X-Device-Fingerprint": "JURY-EVAL-FP01",
            "User-Agent": "JuryEvalBrowser/1.0",
        },
    )
    assert verify_res.status_code == 200
    assert main_mod.audit_logger.chain[-1]["event_type"] == "OTENTIKASI_SESI_SSO_MFA_VERIFIKATOR"
