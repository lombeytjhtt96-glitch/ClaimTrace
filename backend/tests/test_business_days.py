import pytest
from datetime import date
from fastapi.testclient import TestClient
from app.main import app
from app.engine.business_days import (
    is_business_day,
    add_business_days,
    count_business_days_between,
    calculate_sla_status,
    INDONESIAN_HOLIDAYS_2026,
)

client = TestClient(app)


def test_is_business_day_standard_weekdays():
    # 2026-10-14 is Wednesday (normal working day)
    assert is_business_day(date(2026, 10, 14)) is True
    # 2026-10-15 is Thursday
    assert is_business_day(date(2026, 10, 15)) is True
    # 2026-10-16 is Friday
    assert is_business_day(date(2026, 10, 16)) is True


def test_is_business_day_weekends():
    # 2026-10-17 is Saturday
    assert is_business_day(date(2026, 10, 17)) is False
    # 2026-10-18 is Sunday
    assert is_business_day(date(2026, 10, 18)) is False


def test_is_business_day_indonesian_holidays():
    # New Year 2026 (Thursday)
    assert is_business_day(date(2026, 1, 1)) is False
    # Independence Day 2026 (Monday)
    assert is_business_day(date(2026, 8, 17)) is False
    # Idul Fitri 1447 H (Friday)
    assert is_business_day(date(2026, 3, 20)) is False


def test_add_business_days():
    # Friday 2026-10-16 + 1 working day -> Monday 2026-10-19
    res = add_business_days(date(2026, 10, 16), 1)
    assert res == date(2026, 10, 19)

    # Friday 2026-10-16 + 5 working days -> Friday 2026-10-23
    res_5 = add_business_days(date(2026, 10, 16), 5)
    assert res_5 == date(2026, 10, 23)


def test_count_business_days_between():
    # Same date returns 0
    assert count_business_days_between(date(2026, 10, 14), date(2026, 10, 14)) == 0
    # End before start returns 0
    assert count_business_days_between(date(2026, 10, 16), date(2026, 10, 14)) == 0
    # Monday 2026-10-12 to Friday 2026-10-16 -> 4 days elapsed after Monday
    assert count_business_days_between(date(2026, 10, 12), date(2026, 10, 16)) == 4


def test_calculate_sla_status_normal():
    # Claim submitted on 2026-10-14, checked on 2026-10-16 (2 days elapsed)
    status = calculate_sla_status(
        service_date=date(2026, 10, 14),
        max_business_days=10,
        reference_date=date(2026, 10, 16),
    )
    assert status["statutory_sla_business_days"] == 10
    assert status["elapsed_business_days"] == 2
    assert status["remaining_business_days"] == 8
    assert status["is_breached"] is False
    assert status["urgency_level"] == "NORMAL"


def test_calculate_sla_status_urgent_and_critical():
    # 6 days elapsed -> 4 days remaining -> URGENT
    ref_urgent = add_business_days(date(2026, 10, 14), 6)
    status_urgent = calculate_sla_status(
        service_date=date(2026, 10, 14),
        max_business_days=10,
        reference_date=ref_urgent,
    )
    assert status_urgent["remaining_business_days"] == 4
    assert status_urgent["urgency_level"] == "URGENT"

    # 9 days elapsed -> 1 day remaining -> CRITICAL_SLA
    ref_crit = add_business_days(date(2026, 10, 14), 9)
    status_crit = calculate_sla_status(
        service_date=date(2026, 10, 14),
        max_business_days=10,
        reference_date=ref_crit,
    )
    assert status_crit["remaining_business_days"] == 1
    assert status_crit["urgency_level"] == "CRITICAL_SLA"


def test_calculate_sla_status_breached():
    # 12 working days elapsed -> BREACHED
    ref_breach = add_business_days(date(2026, 10, 14), 12)
    status_breach = calculate_sla_status(
        service_date=date(2026, 10, 14),
        max_business_days=10,
        reference_date=ref_breach,
    )
    assert status_breach["elapsed_business_days"] == 12
    assert status_breach["remaining_business_days"] == 0
    assert status_breach["is_breached"] is True
    assert status_breach["urgency_level"] == "BREACHED"


def test_claim_sla_endpoint():
    # Test valid claim
    response = client.get("/api/v1/claims/CLM-2026-8801/sla?reference_date=2026-10-18")
    assert response.status_code == 200
    data = response.json()
    assert data["claim_id"] == "CLM-2026-8801"
    assert "statutory_sla" in data
    assert data["statutory_sla"]["statutory_sla_business_days"] == 10

    # Test non-existent claim
    bad_resp = client.get("/api/v1/claims/CLM-NON-EXISTENT/sla")
    assert bad_resp.status_code == 404


def test_claim_detail_includes_sla_status():
    response = client.get("/api/v1/claims/CLM-2026-8801")
    assert response.status_code == 200
    data = response.json()
    assert "sla_status" in data
    assert data["sla_status"]["statutory_sla_business_days"] == 10
