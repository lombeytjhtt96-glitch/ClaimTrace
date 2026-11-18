"""
Integration tests for the 6 Enterprise Production Hardening Pillars:
1. Alembic PostgreSQL schema migration (`alembic_version` == `20261118_0001`)
2. Structured Logging (`structlog` JSON) + OpenTelemetry Tracing (`FastAPIInstrumentor` spans)
3. MinIO S3-Compatible Object Storage (`claimtrace-backups` & `claimtrace-documents` buckets)
4. CI/CD Quality & Security configs (`.github/workflows/ci-quality-security.yml`, `pyproject.toml`)
5. Keycloak OIDC / SAML 2.0 SSO discovery & realm export
6. X.509 / BSrE Cryptographic PDF Digital Signing & Verification (`pyHanko` + `ReportLab`)
"""

from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
REPO_ROOT = Path(__file__).resolve().parents[2]


def test_alembic_migration_files_and_live_revision():
    alembic_ini = REPO_ROOT / "backend" / "alembic.ini"
    alembic_env = REPO_ROOT / "backend" / "alembic" / "env.py"
    rev_file = REPO_ROOT / "backend" / "alembic" / "versions" / "20261118_0001_initial_oltp_schema.py"
    assert alembic_ini.exists()
    assert alembic_env.exists()
    assert rev_file.exists()

    res = client.get("/api/v1/system/enterprise-stack/status")
    assert res.status_code == 200
    alembic_info = res.json()["alembic"]
    assert alembic_info["configured"] is True
    assert "20261118_0001" in str(alembic_info["current_revision"])


def test_structlog_and_opentelemetry_tracing_capture_requests():
    h = client.get("/api/v1/health", headers={"X-Request-ID": "req-otel-verify-01"})
    assert h.status_code == 200
    assert h.headers.get("X-Request-ID") == "req-otel-verify-01"

    res = client.get("/api/v1/system/observability/traces?limit=20")
    assert res.status_code == 200
    body = res.json()
    assert body["structlog_enabled"] is True
    assert body["structlog_format"] == "json"
    assert body["opentelemetry_enabled"] is True
    assert body["total_recorded_logs"] >= 1
    assert body["total_recorded_spans"] >= 1
    assert any(log.get("request_id") == "req-otel-verify-01" for log in body["recent_logs"])


def test_minio_object_storage_and_backup_mirror(monkeypatch, tmp_path):
    monkeypatch.setenv("CLAIMTRACE_S3_MIRROR_DIR", str(tmp_path / "s3"))
    monkeypatch.setenv("CLAIMTRACE_BACKUP_DIR", str(tmp_path / "backups"))

    bk_res = client.post("/api/v1/system/backups/run")
    assert bk_res.status_code == 200
    bk = bk_res.json()["backup"]
    assert bk["object_storage"] is not None
    assert bk["object_storage"]["bucket"] == "claimtrace-backups"

    st_res = client.get("/api/v1/system/object-storage/status")
    assert st_res.status_code == 200
    assert st_res.json()["engine"] == "minio-s3"
    assert st_res.json()["buckets"]["claimtrace-backups"] >= 1

    obj_res = client.get("/api/v1/system/object-storage/objects?bucket=claimtrace-backups")
    assert obj_res.status_code == 200
    assert obj_res.json()["total"] >= 1


def test_keycloak_oidc_config_and_realm_export():
    realm_file = REPO_ROOT / "infra" / "keycloak" / "claimtrace-realm.json"
    assert realm_file.exists()
    realm = json.loads(realm_file.read_text(encoding="utf-8"))
    assert realm["realm"] == "claimtrace-jkn"
    assert any(c["clientId"] == "claimtrace-web" for c in realm["clients"])

    res = client.get("/api/v1/auth/oidc/config?state=teststate123")
    assert res.status_code == 200
    body = res.json()
    assert body["engine"] == "keycloak-oidc-saml"
    assert body["realm"] == "claimtrace-jkn"
    assert "state=teststate123" in body["authorization_url"]
    assert "openid-configuration" in body["endpoints"]["discovery_url"]


def test_x509_pyhanko_bahv_pdf_signing_and_cryptographic_verification(monkeypatch, tmp_path):
    monkeypatch.setenv("CLAIMTRACE_S3_MIRROR_DIR", str(tmp_path / "s3"))

    status_res = client.get("/api/v1/reports/pdf-signer/status")
    assert status_res.status_code == 200
    assert status_res.json()["engine"] == "pyhanko-x509-cms-pkcs7"
    assert len(status_res.json()["fingerprint_sha256"]) == 64

    # Sign + verify + store in MinIO S3 bucket `claimtrace-documents`
    sv_res = client.post("/api/v1/reports/bahv/CLM-2026-8801/sign-and-verify")
    assert sv_res.status_code == 200
    sv = sv_res.json()
    assert sv["verification"]["signed"] is True
    assert sv["verification"]["intact"] is True
    assert sv["verification"]["valid"] is True
    assert sv["verification"]["trusted"] is True
    assert sv["stored_object"]["bucket"] == "claimtrace-documents"

    # Download actual signed binary PDF
    dl_res = client.get("/api/v1/reports/bahv/CLM-2026-8801/signed-pdf")
    assert dl_res.status_code == 200
    assert dl_res.headers["content-type"].startswith("application/pdf")
    assert dl_res.content.startswith(b"%PDF-")
    assert b"/ByteRange" in dl_res.content


def test_ci_and_loki_configs_exist():
    assert (REPO_ROOT / ".github" / "workflows" / "ci-quality-security.yml").exists()
    assert (REPO_ROOT / "backend" / "pyproject.toml").exists()
    assert (REPO_ROOT / "infra" / "loki" / "loki-config.yml").exists()
    assert (REPO_ROOT / "infra" / "grafana" / "provisioning" / "datasources" / "loki.yml").exists()
