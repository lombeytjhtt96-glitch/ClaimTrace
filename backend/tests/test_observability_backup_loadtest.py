"""
Integration tests for ClaimTrace Observability, Scheduled Backup & Load Testing stack:
- Prometheus OpenMetrics exposition (/metrics), HTTP RED middleware, alert rules & config
- Grafana datasource/dashboard provisioning & dashboard JSON validity
- Scheduled Backup engine (PostgreSQL pg_dump + Redis + forensic files + SHA-256 verification + pruning)
- Locust loadtest suite importability & user classes
"""

from __future__ import annotations

import importlib.util
import json
import os
import tarfile
from pathlib import Path

from fastapi.testclient import TestClient

from app.infra.backup_manager import create_scheduled_backup, list_backups, verify_backup_archive
from app.main import app
from app.workers.async_worker import JOB_HANDLER_MAP, WorkerSettings

client = TestClient(app)
REPO_ROOT = Path(__file__).resolve().parents[2]


def test_prometheus_configs_and_alert_rules_exist():
    prom_docker = REPO_ROOT / "infra" / "prometheus" / "prometheus.yml"
    prom_local = REPO_ROOT / "infra" / "prometheus" / "prometheus.local.yml"
    alert_rules = REPO_ROOT / "infra" / "prometheus" / "alert_rules.yml"
    assert prom_docker.exists()
    assert prom_local.exists()
    assert alert_rules.exists()

    rules_txt = alert_rules.read_text(encoding="utf-8")
    for alert_name in (
        "ClaimTraceBackendDown",
        "ClaimTracePostgresDown",
        "ClaimTraceRedisDown",
        "ClaimTraceArqWorkerDown",
        "ClaimTraceAuditChainCompromised",
        "ClaimTraceBackupStale",
    ):
        assert alert_name in rules_txt


def test_prometheus_metrics_endpoint_exposes_red_and_infra_metrics():
    # Trigger a request first so HTTP RED metrics are guaranteed populated
    health = client.get("/api/v1/health")
    assert health.status_code == 200

    res = client.get("/metrics")
    assert res.status_code == 200
    body = res.text
    for expected_metric in (
        "claimtrace_http_requests_total",
        "claimtrace_http_request_duration_seconds",
        "claimtrace_postgres_up",
        "claimtrace_postgres_table_rows",
        "claimtrace_redis_up",
        "claimtrace_arq_worker_up",
        "claimtrace_audit_integrity_status",
        "claimtrace_backup_total_archives",
    ):
        assert expected_metric in body, f"Missing Prometheus metric: {expected_metric}"


def test_grafana_provisioning_and_dashboard_json_are_valid():
    ds_file = REPO_ROOT / "infra" / "grafana" / "provisioning" / "datasources" / "prometheus.yml"
    db_prov = REPO_ROOT / "infra" / "grafana" / "provisioning" / "dashboards" / "dashboards.yml"
    dash_file = REPO_ROOT / "infra" / "grafana" / "dashboards" / "claimtrace-observability.json"

    assert ds_file.exists()
    assert db_prov.exists()
    assert dash_file.exists()
    assert "claimtrace-prometheus" in ds_file.read_text(encoding="utf-8")

    dashboard = json.loads(dash_file.read_text(encoding="utf-8"))
    assert dashboard["uid"] == "claimtrace-jkn-observability"
    assert len(dashboard["panels"]) >= 10
    exprs = [
        t.get("expr", "")
        for p in dashboard["panels"]
        for t in p.get("targets", [])
    ]
    assert any("claimtrace_postgres_up" in e for e in exprs)
    assert any("claimtrace_http_requests_total" in e for e in exprs)
    assert any("claimtrace_backup_total_archives" in e for e in exprs)


def test_scheduled_backup_api_and_sha256_verification(monkeypatch, tmp_path):
    monkeypatch.setenv("CLAIMTRACE_BACKUP_DIR", str(tmp_path))

    run_res = client.post("/api/v1/system/backups/run")
    assert run_res.status_code == 200
    payload = run_res.json()
    assert payload["status"] == "success"
    bk = payload["backup"]
    assert bk["verified"] is True
    assert bk["postgres_included"] is True
    assert bk["size_bytes"] > 0
    assert len(bk["sha256"]) == 64

    archive_file = Path(bk["archive_path"])
    assert archive_file.exists()
    with tarfile.open(archive_file, "r:gz") as tar:
        names = tar.getnames()
    assert any(n.endswith("claimtrace_db.sql") for n in names)
    assert any(n.endswith("redis_snapshot.json") for n in names)
    assert any(n.endswith("manifest.json") for n in names)

    list_res = client.get("/api/v1/system/backups")
    assert list_res.status_code == 200
    assert any(item["backup_id"] == bk["backup_id"] for item in list_res.json()["backups"])

    verify_res = client.post(f"/api/v1/system/backups/verify/{bk['backup_id']}")
    assert verify_res.status_code == 200
    ver = verify_res.json()["verification"]
    assert ver["verified"] is True
    assert ver["checksum_match"] is True
    assert ver["tar_readable"] is True


def test_scheduled_backup_retention_and_worker_cron(monkeypatch, tmp_path):
    monkeypatch.setenv("CLAIMTRACE_BACKUP_DIR", str(tmp_path))
    # Create 3 distinct backup archives and prune to retention_count=2
    for idx in range(3):
        fake = tmp_path / f"claimtrace-backup-20261118-00000{idx}.tar.gz"
        with tarfile.open(fake, "w:gz") as tar:
            m = tmp_path / f"m{idx}.txt"
            m.write_text("ok", encoding="utf-8")
            tar.add(m, arcname="manifest.json")
        os.utime(fake, (1700000000 + idx * 10, 1700000000 + idx * 10))

    created = create_scheduled_backup(trigger="retention_test", retention_count=2)
    assert created["verified"] is True
    remaining = list_backups(limit=10)
    assert len(remaining) == 2

    # Verify ARQ worker has scheduled_backup handler and daily cron registered
    assert "scheduled_backup" in JOB_HANDLER_MAP
    assert len(WorkerSettings.cron_jobs) >= 2

    backup_script = REPO_ROOT / "scripts" / "backup_claimtrace.sh"
    assert backup_script.exists()
    assert os.access(backup_script, os.X_OK)


def test_locust_loadtest_file_imports_cleanly():
    """Validates loadtest/locustfile.py in an isolated subprocess so gevent.monkey never patches pytest."""
    import subprocess
    import sys

    locust_file = REPO_ROOT / "loadtest" / "locustfile.py"
    assert locust_file.exists()
    code = (
        "import importlib.util; "
        f"spec = importlib.util.spec_from_file_location('claimtrace_locustfile', r'{locust_file}'); "
        "mod = importlib.util.module_from_spec(spec); "
        "spec.loader.exec_module(mod); "
        "assert hasattr(mod, 'GatewayHealthUser'); "
        "assert hasattr(mod, 'VerifikatorJknUser'); "
        "assert hasattr(mod, 'AsyncJobWorkloadUser'); "
        "print('LOCUST_OK')"
    )
    proc = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, timeout=15, check=False)
    assert proc.returncode == 0, f"Locust validation failed: {proc.stderr}"
    assert "LOCUST_OK" in proc.stdout
