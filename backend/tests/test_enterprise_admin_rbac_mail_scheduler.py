"""
Integration tests for ClaimTrace Enterprise Admin, RBAC, Rate Limiting, Scheduler & Mailer Stack:
- SQLAdmin (/sqladmin) backed by PostgreSQL SQLAlchemy 2.0
- FastAPI-Admin Portal (/admin-portal) rendered via Jinja2
- PyCasbin RBAC hierarchical policy enforcement
- SlowAPI rate limiter binding
- APScheduler + ARQ Cron jobs registry
- FastAPI-Mail + Jinja2 HTML email templating & outbox spool
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_sqladmin_and_fastapi_admin_portal_are_accessible():
    sqladmin_res = client.get("/sqladmin/")
    assert sqladmin_res.status_code == 200
    assert "ClaimTrace" in sqladmin_res.text or "SQLAdmin" in sqladmin_res.text

    portal_res = client.get("/admin-portal")
    assert portal_res.status_code == 200
    assert "FastAPI-Admin Portal" in portal_res.text
    assert "PyCasbin RBAC" in portal_res.text
    assert "APScheduler" in portal_res.text


def test_pycasbin_rbac_policies_and_hierarchical_enforcement():
    pol_res = client.get("/api/v1/security/casbin/policies")
    assert pol_res.status_code == 200
    body = pol_res.json()
    assert body["engine"] == "pycasbin"
    assert body["total_policies"] >= 15
    assert body["total_role_links"] >= 3

    # ADMIN allowed on /sqladmin
    r_admin = client.post(
        "/api/v1/security/casbin/enforce",
        json={"role": "ADMIN", "resource": "/sqladmin/claims", "action": "DELETE"},
    )
    assert r_admin.status_code == 200
    assert r_admin.json()["allowed"] is True

    # ANALYST allowed GET /api/v1/claims, denied POST /api/v1/system/backups/run
    r_analyst_read = client.post(
        "/api/v1/security/casbin/enforce",
        json={"role": "ANALYST", "resource": "/api/v1/claims", "action": "GET"},
    )
    assert r_analyst_read.json()["allowed"] is True

    r_analyst_backup = client.post(
        "/api/v1/security/casbin/enforce",
        json={"role": "ANALYST", "resource": "/api/v1/system/backups/run", "action": "POST"},
    )
    assert r_analyst_backup.json()["allowed"] is False

    # KEPALA_CABANG inherits VERIFICATOR_MEDIS & ANALYST
    r_kacab = client.post(
        "/api/v1/security/casbin/enforce",
        json={"role": "KEPALA_CABANG", "resource": "/api/v1/system/backups/run", "action": "POST"},
    )
    assert r_kacab.json()["allowed"] is True
    assert "ANALYST" in r_kacab.json()["inherited_roles"]


def test_apscheduler_and_arq_cron_jobs_endpoint():
    res = client.get("/api/v1/system/scheduler/jobs")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "success"
    assert body["apscheduler_jobs_count"] >= 3
    assert body["arq_cron_jobs_count"] >= 2
    ap_ids = {j["id"] for j in body["apscheduler_jobs"]}
    assert "postgres_oltp_heartbeat_sync" in ap_ids
    assert "prometheus_metrics_refresh" in ap_ids
    assert "daily_backup_verification" in ap_ids


def test_fastapi_mail_jinja2_dispatch_and_outbox():
    send_res = client.post(
        "/api/v1/system/mail/send",
        json={
            "recipients": ["casemix.mitrahusada@example.org"],
            "subject": "Undangan Klarifikasi Klaim CLM-2026-8801",
            "template_name": "clarification_notice",
            "context": {
                "recipient_name": "dr. Wahyu Hidayat, Sp.B, MARS",
                "faskes_name": "RS Khusus Mitra Husada",
                "claim_id": "CLM-2026-8801",
                "ina_cbg_code": "Z-3-12-0",
            },
        },
    )
    assert send_res.status_code == 200
    mail = send_res.json()["mail"]
    assert mail["mail_id"].startswith("MAIL-")
    assert mail["template_name"] == "clarification_notice.html"
    assert "CLM-2026-8801" in mail["html_preview"]

    outbox_res = client.get("/api/v1/system/mail/outbox")
    assert outbox_res.status_code == 200
    outbox = outbox_res.json()
    assert outbox["mailer"]["engine"] == "fastapi-mail + jinja2"
    assert any(item["mail_id"] == mail["mail_id"] for item in outbox["outbox"])


def test_enterprise_stack_unified_status_and_slowapi_binding():
    assert hasattr(app.state, "limiter")
    res = client.get("/api/v1/system/enterprise-stack/status")
    assert res.status_code == 200
    body = res.json()
    assert body["sqladmin"]["mounted"] is True
    assert body["fastapi_admin_portal"]["enabled"] is True
    assert body["slowapi"]["enabled"] is True
    assert body["casbin"]["engine"] == "pycasbin"
    assert body["mailer"]["engine"] == "fastapi-mail + jinja2"
    assert body["scheduler"]["apscheduler_jobs_count"] >= 3
