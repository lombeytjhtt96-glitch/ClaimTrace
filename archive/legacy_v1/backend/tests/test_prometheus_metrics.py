"""
Unit and Integration Tests for Prometheus Observability Engine in ClaimTrace
BPJS Kesehatan Healthkathon 2026 - Real-time SLO/SLA & Fraud Velocity Telemetry
Inspired by prometheus/prometheus-mcp
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine.prometheus_metrics import prometheus_engine

client = TestClient(app)

def test_prometheus_metrics_exposition():
    """Verifies that the /metrics exposition generates valid OpenMetrics/Prometheus format"""
    exposition = prometheus_engine.get_metrics_exposition()
    assert "# HELP claimtrace_claims_total" in exposition
    assert "# TYPE claimtrace_claims_total counter" in exposition
    assert "# HELP claimtrace_priority_score" in exposition
    assert "claimtrace_priority_score{claim_id=\"CLM-2026-8801\",lane=\"MERAH\"}" in exposition
    assert "claimtrace_financial_exposure_rupiah{lane=\"MERAH\"}" in exposition
    assert "claimtrace_audit_integrity_status" in exposition
    assert "claimtrace_vedika_sla_days_remaining" in exposition

def test_prometheus_promql_instant_query():
    """Tests instant PromQL evaluation engine"""
    # 1. Financial exposure query
    res = prometheus_engine.execute_promql_query("claimtrace_financial_exposure_rupiah")
    assert res["status"] == "success"
    assert res["data"]["resultType"] == "vector"
    assert len(res["data"]["result"]) >= 3
    lanes = [item["metric"]["lane"] for item in res["data"]["result"]]
    assert "MERAH" in lanes
    assert "HIJAU" in lanes

    # 2. Priority score query
    res_score = prometheus_engine.execute_promql_query("claimtrace_priority_score")
    assert res_score["status"] == "success"
    claim_ids = [item["metric"]["claim_id"] for item in res_score["data"]["result"]]
    assert "CLM-2026-8801" in claim_ids

    # 3. Audit integrity query
    res_audit = prometheus_engine.execute_promql_query("claimtrace_audit_integrity_status")
    assert res_audit["status"] == "success"
    assert res_audit["data"]["result"][0]["value"][1] == "1"

    # 4. Vedika SLA query
    res_sla = prometheus_engine.execute_promql_query("claimtrace_vedika_sla_days_remaining")
    assert res_sla["status"] == "success"
    assert len(res_sla["data"]["result"]) >= 3

def test_prometheus_promql_range_query():
    """Tests range query matrix format output"""
    res = prometheus_engine.execute_range_query(
        "claimtrace_financial_exposure_rupiah",
        start_ts=1700000000,
        end_ts=1700000300,
        step_seconds=60
    )
    assert res["status"] == "success"
    assert res["data"]["resultType"] == "matrix"
    assert len(res["data"]["result"]) > 0
    # Each time series has timestamps array
    assert len(res["data"]["result"][0]["values"]) == 6

def test_prometheus_active_alerts():
    """Tests Prometheus alerting engine for Modus #6 and statutory SLA alerts"""
    alerts = prometheus_engine.get_active_alerts()
    alert_names = [a["labels"]["alertname"] for a in alerts]
    assert "PhantomBillingSurgeCritical" in alert_names
    assert "ImpossibleTravelDoctorDetected" in alert_names
    assert "VedikaSlaBreachImminent" in alert_names

    # Check alert structure
    phantom_alert = next(a for a in alerts if a["labels"]["alertname"] == "PhantomBillingSurgeCritical")
    assert phantom_alert["labels"]["severity"] == "critical"
    assert "8.5x" in phantom_alert["annotations"]["description"]
    assert phantom_alert["state"] == "firing"

def test_prometheus_alerting_rules():
    """Tests alerting and recording rule configuration"""
    rules_groups = prometheus_engine.get_alerting_rules()
    assert len(rules_groups) >= 1
    rules = rules_groups[0]["rules"]
    rule_names = [r["name"] for r in rules]
    assert "PhantomBillingSurgeCritical" in rule_names
    assert "AuditChainIntegrityFailure" in rule_names

def test_prometheus_runtime_and_tsdb_info():
    """Tests runtime metadata and TSDB cardinality stats"""
    info = prometheus_engine.get_runtime_info()
    assert info["status"] == "READY"
    assert "prometheus-mcp" in info["revision"]

    tsdb = prometheus_engine.get_tsdb_stats()
    assert tsdb["series_count"] > 0
    assert tsdb["label_names_count"] > 0

def test_prometheus_metadata():
    """Tests descriptive metadata lookup"""
    all_meta = prometheus_engine.get_metric_metadata()
    assert len(all_meta) >= 7
    specific_meta = prometheus_engine.get_metric_metadata("claimtrace_claims_total")
    assert len(specific_meta) == 1
    assert specific_meta[0]["type"] == "counter"

def test_fastapi_prometheus_endpoints():
    """Integration test: verifies all Prometheus FastAPI endpoints"""
    # 1. /metrics exposition
    r_metrics = client.get("/metrics")
    assert r_metrics.status_code == 200
    assert "claimtrace_priority_score" in r_metrics.text

    # 2. /api/v1/prometheus/query
    r_query = client.get("/api/v1/prometheus/query?query=claimtrace_financial_exposure_rupiah")
    assert r_query.status_code == 200
    assert r_query.json()["status"] == "success"

    # 3. /api/v1/prometheus/alerts
    r_alerts = client.get("/api/v1/prometheus/alerts")
    assert r_alerts.status_code == 200
    assert len(r_alerts.json()["data"]["alerts"]) >= 3

    # 4. /api/v1/prometheus/rules
    r_rules = client.get("/api/v1/prometheus/rules")
    assert r_rules.status_code == 200
    assert len(r_rules.json()["data"]["groups"]) >= 1

    # 5. /api/v1/prometheus/runtime
    r_runtime = client.get("/api/v1/prometheus/runtime")
    assert r_runtime.status_code == 200
    assert r_runtime.json()["data"]["status"] == "READY"

    # 6. /api/v1/prometheus/tsdb
    r_tsdb = client.get("/api/v1/prometheus/tsdb")
    assert r_tsdb.status_code == 200
    assert r_tsdb.json()["data"]["series_count"] > 0

    # 7. /api/v1/prometheus/metadata
    r_meta = client.get("/api/v1/prometheus/metadata")
    assert r_meta.status_code == 200
    assert len(r_meta.json()["data"]) >= 7
