"""
End-to-end integration tests for ClaimTrace Infrastructure Stack:
- Nginx Reverse Proxy header detection & config validation
- PostgreSQL 18 OLTP schema, sync, SQL querying, and write-through persistence
- Redis + PostgreSQL combined diagnostics & graceful fallback
"""

from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.infra.postgres_db import (
    get_postgres_status,
    init_postgres_schema,
    query_async_jobs_from_postgres,
    query_audit_blocks_from_postgres,
    query_claims_from_postgres,
    reset_postgres_engine,
    sync_operations_snapshot_to_postgres,
)
from app.infra.redis_client import save_job_record
from app.main import app

client = TestClient(app)


def test_nginx_reverse_proxy_configs_exist_and_have_upstreams():
    repo_root = Path(__file__).resolve().parents[2]
    docker_cfg = repo_root / "infra" / "nginx" / "nginx.conf"
    local_cfg = repo_root / "infra" / "nginx" / "nginx.local.conf"
    assert docker_cfg.exists()
    assert local_cfg.exists()

    docker_txt = docker_cfg.read_text(encoding="utf-8")
    assert "upstream claimtrace_backend" in docker_txt
    assert "upstream claimtrace_frontend" in docker_txt
    assert "location = /proxy-health" in docker_txt
    assert "X-ClaimTrace-Proxy" in docker_txt
    assert "limit_req_zone" in docker_txt

    local_txt = local_cfg.read_text(encoding="utf-8")
    assert "listen 8080;" in local_txt
    assert "127.0.0.1:8000" in local_txt
    assert "127.0.0.1:3000" in local_txt
    assert "X-ClaimTrace-Proxy" in local_txt


def test_postgres_live_schema_and_sync_endpoint():
    assert init_postgres_schema() is True
    res = client.post("/api/v1/system/postgres/sync")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "success"
    assert body["claims_synced"] >= 1
    assert body["postgres"]["postgres_connected"] is True
    assert body["postgres"]["database_name"] == "claimtrace_db"
    assert body["postgres"]["tables"]["claims"] >= body["claims_synced"]


def test_postgres_claims_sql_query_endpoint():
    init_postgres_schema()
    client.post("/api/v1/system/postgres/sync")

    res = client.get("/api/v1/system/postgres/claims?limit=20")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "success"
    assert body["source"] == "postgresql"
    assert body["total"] >= 1
    first = body["claims"][0]
    assert "claim_id" in first
    assert "nama_faskes" in first
    assert "nilai_klaim_rp" in first

    # Test filtered SQL query by lane
    red_res = client.get("/api/v1/system/postgres/claims?lane=MERAH&limit=10")
    assert red_res.status_code == 200
    red_body = red_res.json()
    assert all((c.get("triage_lane") or "").upper() == "MERAH" for c in red_body["claims"])


def test_postgres_audit_blocks_and_operations_snapshot():
    init_postgres_schema()
    client.post("/api/v1/system/postgres/sync")

    res = client.get("/api/v1/system/postgres/audit-blocks?limit=25")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "success"
    assert body["source"] == "postgresql"
    assert isinstance(body["blocks"], list)

    assert sync_operations_snapshot_to_postgres("test_snapshot_check", [{"ok": True}]) is True


def test_redis_job_write_through_persists_to_postgres():
    init_postgres_schema()
    job_id = "JOB-PG-WRITETHROUGH-TEST"
    save_job_record(
        job_id,
        {
            "job_type": "audit_integrity_check",
            "status": "completed",
            "queue": "claimtrace:arq",
            "dispatch_mode": "arq_redis_worker",
            "requested_by": "pytest-infra",
            "result": {"integrity_verified": True},
        },
    )
    rows = query_async_jobs_from_postgres(limit=50)
    matched = [r for r in rows if r["job_id"] == job_id]
    assert len(matched) == 1
    assert matched[0]["status"] == "completed"
    assert matched[0]["result"]["integrity_verified"] is True

    res = client.get("/api/v1/system/postgres/jobs?limit=50")
    assert res.status_code == 200
    assert any(j["job_id"] == job_id for j in res.json()["jobs"])


def test_infrastructure_status_detects_reverse_proxy_headers():
    res = client.get(
        "/api/v1/system/infrastructure/status",
        headers={
            "X-ClaimTrace-Proxy": "nginx-edge-local",
            "X-Forwarded-For": "203.0.113.10",
            "X-Forwarded-Proto": "https",
            "X-Real-IP": "203.0.113.10",
            "X-Request-ID": "req-test-001",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "success"
    assert body["reverse_proxy"]["detected"] is True
    assert body["reverse_proxy"]["engine"] == "nginx-edge-local"
    assert body["reverse_proxy"]["x_forwarded_for"] == "203.0.113.10"
    assert body["reverse_proxy"]["x_forwarded_proto"] == "https"
    assert body["postgres"]["postgres_connected"] is True
    assert "redis_connected" in body["redis"]


def test_health_endpoint_reports_postgres_redis_and_proxy():
    res = client.get(
        "/api/v1/health",
        headers={"X-ClaimTrace-Proxy": "nginx-edge-local", "X-Forwarded-For": "127.0.0.1"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "healthy"
    assert body["postgres_connected"] is True
    assert body["postgres_database"] == "claimtrace_db"
    assert body["reverse_proxy_detected"] is True
    assert body["reverse_proxy_engine"] == "nginx-edge-local"
    assert "redis_connected" in body


def test_postgres_graceful_fallback_when_disabled(monkeypatch):
    monkeypatch.setenv("CLAIMTRACE_DISABLE_POSTGRES", "1")
    reset_postgres_engine()
    try:
        status = get_postgres_status()
        assert status["postgres_connected"] is False
        assert status["mode"] == "json_fallback"
        assert query_claims_from_postgres() == []
        assert query_audit_blocks_from_postgres() == []
    finally:
        monkeypatch.delenv("CLAIMTRACE_DISABLE_POSTGRES", raising=False)
        reset_postgres_engine()
