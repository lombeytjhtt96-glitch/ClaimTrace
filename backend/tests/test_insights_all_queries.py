import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

ALLOW_LISTED_QUERIES = [
    "high_risk_trends",
    "support_plan_effectiveness",
    "case_distribution",
    "resolution_times",
    "peak_usage_patterns",
    "counselor_workload",
    "severity_transitions",
    "intervention_outcomes",
    "feature_adoption"
]

@pytest.mark.parametrize("query_type", ALLOW_LISTED_QUERIES)
def test_all_allow_listed_insights_queries(query_type):
    payload = {
        "query_type": query_type,
        "start_date": "",
        "end_date": "",
        "severity": ""
    }
    response = client.post("/api/v1/insights/execute-query", json=payload)
    assert response.status_code == 200, f"Query {query_type} failed with status {response.status_code}: {response.text}"
    
    data = response.json()
    assert data["query_name"] == query_type
    assert "execution_time_ms" in data
    assert data["execution_time_ms"] > 0
    assert len(data["summary"]) > 0
    assert len(data["recommendations"]) > 0
    assert "result" in data
    assert data["result"]["k_anonymity_satisfied"] is True
    assert isinstance(data["result"]["data"], list)
    assert len(data["result"]["data"]) > 0
    assert "privacy_metadata" in data
    assert data["privacy_metadata"]["k_value"] >= 5
