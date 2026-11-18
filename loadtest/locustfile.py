"""
ClaimTrace JKN — Locust Load & Stress Test Suite.
Targets the Nginx Reverse Proxy edge gateway (default http://localhost:8080)
to benchmark end-to-end throughput and tail latency across:
- Nginx Reverse Proxy -> FastAPI Backend -> PostgreSQL OLTP + Redis Cache + ARQ Worker

Usage:
  Interactive Web UI (:8089):
    python3 -m locust -f loadtest/locustfile.py --host http://localhost:8080

  Headless CI/Benchmark run:
    python3 -m locust -f loadtest/locustfile.py --headless -u 12 -r 4 -t 15s --host http://localhost:8080
"""

from __future__ import annotations

import uuid

from locust import HttpUser, between, task


class GatewayHealthUser(HttpUser):
    """Lightweight synthetic monitor stressing Nginx Reverse Proxy & backend health endpoints."""

    weight = 3
    wait_time = between(0.2, 0.8)

    @task(2)
    def check_nginx_proxy_health(self):
        with self.client.get("/proxy-health", name="GET /proxy-health", catch_response=True) as res:
            if res.status_code != 200:
                res.failure(f"Unexpected status {res.status_code}")

    @task(3)
    def check_backend_health(self):
        with self.client.get("/api/v1/health", name="GET /api/v1/health", catch_response=True) as res:
            if res.status_code != 200:
                res.failure(f"Unexpected status {res.status_code}")

    @task(1)
    def scrape_prometheus_metrics(self):
        with self.client.get("/metrics", name="GET /metrics", catch_response=True) as res:
            if res.status_code != 200 or "claimtrace_audit_integrity_status" not in res.text:
                res.failure("Missing ClaimTrace OpenMetrics exposition payload")


class VerifikatorJknUser(HttpUser):
    """Authenticated BPJS Verifikator workload hitting claims, Redis cache, PostgreSQL SQL, and audit ledger."""

    weight = 6
    wait_time = between(0.3, 1.2)

    def on_start(self):
        self.device_fp = f"CT-WKS-LOCUST-{uuid.uuid4().hex[:10].upper()}"
        self.auth_headers = {"X-Device-Fingerprint": self.device_fp}
        res = self.client.post(
            "/api/v1/auth/jury-demo-login",
            json={"device_fingerprint": self.device_fp},
            name="POST /api/v1/auth/jury-demo-login",
        )
        if res.status_code == 200:
            token = res.json().get("token")
            if token:
                self.auth_headers["Authorization"] = f"Bearer {token}"

    @task(4)
    def fetch_sidebar_badges_cached(self):
        self.client.get(
            "/api/v1/system/sidebar-badges",
            headers=self.auth_headers,
            name="GET /api/v1/system/sidebar-badges",
        )

    @task(3)
    def fetch_triage_claims(self):
        self.client.get(
            "/api/v1/claims",
            headers=self.auth_headers,
            name="GET /api/v1/claims",
        )

    @task(3)
    def fetch_postgres_claims(self):
        self.client.get(
            "/api/v1/system/postgres/claims?limit=15",
            headers=self.auth_headers,
            name="GET /api/v1/system/postgres/claims",
        )

    @task(2)
    def fetch_audit_logs(self):
        self.client.get(
            "/api/v1/audit-logs",
            headers=self.auth_headers,
            name="GET /api/v1/audit-logs",
        )

    @task(2)
    def fetch_infrastructure_status(self):
        self.client.get(
            "/api/v1/system/infrastructure/status",
            headers=self.auth_headers,
            name="GET /api/v1/system/infrastructure/status",
        )

    @task(1)
    def fetch_backup_inventory(self):
        self.client.get(
            "/api/v1/system/backups",
            headers=self.auth_headers,
            name="GET /api/v1/system/backups",
        )


class AsyncJobWorkloadUser(HttpUser):
    """Low-frequency async queue producer verifying Redis + ARQ + PostgreSQL write-through under load."""

    weight = 1
    wait_time = between(2.0, 4.0)

    def on_start(self):
        self.device_fp = f"CT-WKS-LOCUSTQ-{uuid.uuid4().hex[:8].upper()}"
        self.auth_headers = {"X-Device-Fingerprint": self.device_fp}
        res = self.client.post(
            "/api/v1/auth/jury-demo-login",
            json={"device_fingerprint": self.device_fp},
            name="POST /api/v1/auth/jury-demo-login",
        )
        if res.status_code == 200:
            token = res.json().get("token")
            if token:
                self.auth_headers["Authorization"] = f"Bearer {token}"

    @task
    def enqueue_analytics_refresh(self):
        with self.client.post(
            "/api/v1/jobs/enqueue",
            json={"job_type": "analytics_refresh"},
            headers=self.auth_headers,
            name="POST /api/v1/jobs/enqueue [analytics_refresh]",
            catch_response=True,
        ) as res:
            if res.status_code != 202:
                res.failure(f"Expected 202 Accepted, got {res.status_code}")
