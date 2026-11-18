import time
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.infra.redis_client import (
    cache_delete_prefix,
    cache_get_json,
    cache_set_json,
    get_job_record,
    get_redis_status,
)

client = TestClient(app)


def test_redis_cache_roundtrip_and_prefix_invalidation():
    key = "pytest_roundtrip_sample"
    payload = {"claims": 11, "status": "ok"}
    cache_set_json(key, payload, ttl_seconds=30)
    assert cache_get_json(key) == payload
    removed = cache_delete_prefix("pytest_roundtrip")
    assert removed >= 1
    assert cache_get_json(key) is None


def test_health_exposes_redis_and_worker_fields():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert "redis_connected" in body
    assert "async_worker_active" in body
    assert body["async_queue"] == "claimtrace:arq"


def test_redis_worker_status_endpoint():
    res = client.get("/api/v1/system/redis-worker/status")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "success"
    assert body["queue_name"] == "claimtrace:arq"
    assert isinstance(body["redis_connected"], bool)


@pytest.mark.parametrize(
    "job_type",
    ["batch_triage", "audit_integrity_check", "analytics_refresh", "mobile_jkn_batch"],
)
def test_enqueue_and_complete_async_jobs(job_type):
    res = client.post("/api/v1/jobs/enqueue", json={"job_type": job_type})
    assert res.status_code == 202
    data = res.json()
    job_id = data["job_id"]
    assert job_id.startswith("JOB-")

    # Poll until completed (async background task completes quickly in test/local mode)
    final_job = None
    for _ in range(30):
        poll = client.get(f"/api/v1/jobs/{job_id}")
        assert poll.status_code == 200
        final_job = poll.json()["job"]
        if final_job["status"] in ("complete", "failed"):
            break
        time.sleep(0.1)

    assert final_job is not None
    assert final_job["status"] == "complete", f"Job {job_type} failed: {final_job}"
    assert isinstance(final_job.get("result"), dict)
    assert get_job_record(job_id)["status"] == "complete"

    list_res = client.get("/api/v1/jobs?limit=10")
    assert list_res.status_code == 200
    job_ids = [j["job_id"] for j in list_res.json()["jobs"]]
    assert job_id in job_ids


def test_unknown_job_returns_404():
    res = client.get("/api/v1/jobs/JOB-DOES-NOT-EXIST")
    assert res.status_code == 404


def test_redis_status_helper_fallback_mode(monkeypatch):
    monkeypatch.setenv("CLAIMTRACE_DISABLE_REDIS", "1")
    status = get_redis_status()
    assert status["redis_connected"] is False
    assert status["mode"] == "in_memory_fallback"
