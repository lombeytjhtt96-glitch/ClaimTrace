import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app  # noqa: E402

client = TestClient(app)


def test_insights_privacy_and_severity_filters_real_duckdb():
    privacy_res = client.get("/api/v1/insights/privacy-status")
    assert privacy_res.status_code == 200
    pdata = privacy_res.json()
    assert pdata["k_value"] >= 5
    assert pdata["epsilon_total"] == 20.0
    assert pdata["total_users"] >= 1
    assert pdata["dataset_date_min"] >= "2023-01-01"

    crit_res = client.post(
        "/api/v1/insights/execute-query",
        json={"query_id": 1, "severity": "critical"},
    )
    assert crit_res.status_code == 200
    cdata = crit_res.json()
    assert cdata["status"] == "success"
    assert cdata["filter_applied"]["severity"] == "critical"
    assert cdata["result"]["total_records_anonymized"] > 0
    assert cdata["privacy_metadata"]["k_value"] >= 5

    bad_date_res = client.post(
        "/api/v1/insights/execute-query",
        json={"query_name": "high_risk_trends", "start_date": "2024-01-01; DROP TABLE bpjs_fkrtl_all"},
    )
    assert bad_date_res.status_code == 200
    assert bad_date_res.json()["status"] == "success"
    metrics_after = client.get("/api/v1/system/national-scale-metrics")
    assert metrics_after.status_code == 200
    assert metrics_after.json()["portfolio_metrics"]["fkrtl_claims_volume"] == 1699219


def test_national_metrics_windowed_and_telemetry_trends():
    res7 = client.get("/api/v1/system/national-scale-metrics?days=7")
    res30 = client.get("/api/v1/system/national-scale-metrics?days=30")
    assert res7.status_code == 200
    assert res30.status_code == 200
    d7 = res7.json()
    d30 = res30.json()
    assert "2014-01-01" not in str(d30)
    assert d7["window_metrics"]["claims_volume"] < d30["window_metrics"]["claims_volume"]

    t7 = client.get("/api/v1/system/national-telemetry-trends?days=7")
    t30 = client.get("/api/v1/system/national-telemetry-trends?days=30")
    assert t7.status_code == 200
    assert t30.status_code == 200
    assert len(t7.json()["trends"]) <= 7
    assert len(t30.json()["trends"]) <= 30


def test_analytics_retention_dpjp_and_mobile_telemetry():
    ret_res = client.get("/api/v1/analytics/retention")
    assert ret_res.status_code == 200
    ret = ret_res.json()
    assert len(ret["daily_activity"]) >= 7
    assert len(ret["cohorts"]) >= 5
    assert "retention" in ret["cohorts"][0]

    dpjp_res = client.get("/api/v1/analytics/dpjp-intelligence")
    assert dpjp_res.status_code == 200
    dpjp = dpjp_res.json()
    assert dpjp["total_dpjp"] >= 6
    for doc in dpjp["doctors"]:
        assert str(doc["nip_hash"]).startswith("AES256_")

    mob_res = client.get("/api/v1/analytics/mobile-telemetry")
    assert mob_res.status_code == 200
    mob = mob_res.json()
    assert mob["metrics"]["total_dispatched"] >= 1
    assert len(mob["logs"]) >= 1
    for entry in mob["logs"]:
        assert "Terproteksi" in entry["participantName"] or "AES256_" in entry["participantName"]

    push_res = client.post(
        "/api/v1/analytics/mobile-telemetry/push",
        json={"claim_id": "CLM-2026-8801", "nik": "TOKEN-TEST-8801"},
    )
    assert push_res.status_code == 200
    pushed = push_res.json()
    assert pushed["status"] == "success"
    assert pushed["log"]["claimId"] == "CLM-2026-8801"


def test_operations_cases_flags_schedules_interventions_and_directory():
    cases_res = client.get("/api/v1/operations/cases")
    assert cases_res.status_code == 200
    cases = cases_res.json()["cases"]
    assert len(cases) >= 6

    create_case = client.post(
        "/api/v1/operations/cases",
        json={
            "hospital": "RS Uji Integrasi JKN",
            "severity": "high",
            "summary_redacted": "Pengujian pembuatan berkas triase cepat live.",
        },
    )
    assert create_case.status_code == 200
    created_id = create_case.json()["case"]["id"]

    patch_case = client.patch(
        f"/api/v1/operations/cases/{created_id}",
        json={"status": "in_progress", "assigned_to": "dr. Siti Rahma, Sp.PK"},
    )
    assert patch_case.status_code == 200
    assert patch_case.json()["case"]["status"] == "in_progress"

    flags_res = client.get("/api/v1/operations/flags")
    assert flags_res.status_code == 200
    flags = flags_res.json()["flags"]
    assert len(flags) >= 4
    first_flag_id = flags[0]["id"]
    for f in flags:
        assert "0001829348122" not in str(f)

    patch_flag = client.patch(
        f"/api/v1/operations/flags/{first_flag_id}",
        json={"notes": "Catatan verifikasi unit test otomatis."},
    )
    assert patch_flag.status_code == 200
    assert patch_flag.json()["flag"]["notes"] == "Catatan verifikasi unit test otomatis."

    sched_res = client.get("/api/v1/operations/schedules")
    assert sched_res.status_code == 200
    schedules = sched_res.json()["schedules"]
    assert len(schedules) >= 3
    assert "verificator" in schedules[0]
    assert "faskes_pic" in schedules[0]

    int_res = client.get("/api/v1/operations/interventions")
    assert int_res.status_code == 200
    plans = int_res.json()["interventions"]
    assert len(plans) >= 3
    first_plan_id = plans[0]["id"]
    toggle_res = client.patch(
        f"/api/v1/operations/interventions/{first_plan_id}",
        json={"step_index": 1},
    )
    assert toggle_res.status_code == 200

    dir_res = client.get("/api/v1/operations/directory")
    assert dir_res.status_code == 200
    users = dir_res.json()["users"]
    assert len(users) >= 4
    for u in users:
        assert "*" in u["phone_masked"]

    conv_res = client.get("/api/v1/operations/conversations")
    assert conv_res.status_code == 200
    assert len(conv_res.json()["groups"]) >= 2


def test_settings_profile_and_sidebar_badges_roundtrip():
    badges_res = client.get("/api/v1/system/sidebar-badges")
    assert badges_res.status_code == 200
    badges = badges_res.json()
    assert badges["audit_chain_length"] >= 1
    assert badges["queue_count"] >= 6

    orig_settings = client.get("/api/v1/settings").json()["settings"]
    put_settings = client.put(
        "/api/v1/settings",
        json={"category": "thresholds_rules", "updates": {"sla_deadline_days": 12}},
    )
    assert put_settings.status_code == 200
    assert put_settings.json()["settings"]["sla_deadline_days"] == 12

    client.put(
        "/api/v1/settings",
        json={
            "category": "thresholds_rules",
            "updates": {"sla_deadline_days": orig_settings.get("sla_deadline_days", 10)},
        },
    )

    orig_profile = client.get("/api/v1/profile").json()["profile"]
    put_prof = client.put("/api/v1/profile", json={"location": "Surakarta, Jawa Tengah"})
    assert put_prof.status_code == 200
    assert put_prof.json()["profile"]["location"] == "Surakarta, Jawa Tengah"
    client.put("/api/v1/profile", json={"location": orig_profile.get("location", "DKI Jakarta, Indonesia")})
