"""
Unit and Integration Tests for DuckDB OLAP Analytics Engine in ClaimTrace
BPJS Kesehatan Healthkathon 2026 - Modus #6 Phantom Billing & Modus #11 Repeat Billing
Inspired by teaguesterling/duckdb_mcp
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine.duckdb_analytics import duckdb_engine

client = TestClient(app)

def test_duckdb_database_info():
    info = duckdb_engine.database_info()
    assert info["engine"] == "DuckDB In-Memory OLAP"
    assert "1.5" in info["version"]
    assert info["total_claims_indexed"] >= 6
    assert info["total_portfolio_rupiah"] > 0
    assert info["tables_and_views_count"] >= 4

def test_duckdb_list_and_describe_tables():
    tables = duckdb_engine.list_tables()
    table_names = [t["name"] for t in tables]
    assert "claims_warehouse" in table_names
    assert "v_phantom_billing_risk" in table_names
    assert "v_repeat_billing_risk" in table_names
    assert "v_financial_exposure" in table_names

    desc = duckdb_engine.describe_table("claims_warehouse")
    col_names = [c["column_name"] for c in desc]
    assert "claim_id" in col_names
    assert "faskes_id" in col_names
    assert "nilai_klaim_rp" in col_names
    assert "triage_lane" in col_names
    assert "rasio_lonjakan_baseline" in col_names

def test_duckdb_execute_query_formats():
    sql = "SELECT claim_id, nilai_klaim_rp, triage_lane FROM claims_warehouse ORDER BY nilai_klaim_rp DESC LIMIT 2;"

    # 1. JSON Format
    res_json = duckdb_engine.execute_query(sql, output_format="json")
    assert res_json["status"] == "success"
    assert res_json["row_count"] == 2
    assert isinstance(res_json["data"], list)
    assert "claim_id" in res_json["data"][0]

    # 2. Markdown Format (Token-efficient)
    res_md = duckdb_engine.execute_query(sql, output_format="markdown")
    assert res_md["status"] == "success"
    assert "| claim_id |" in res_md["data"]
    assert "| --- |" in res_md["data"]

    # 3. CSV Format
    res_csv = duckdb_engine.execute_query(sql, output_format="csv")
    assert res_csv["status"] == "success"
    assert "claim_id,nilai_klaim_rp,triage_lane" in res_csv["data"]

def test_duckdb_read_only_safety():
    # Attempting destructive DDL/DML must be blocked
    malicious_queries = [
        "DROP TABLE claims_warehouse;",
        "DELETE FROM claims_warehouse WHERE 1=1;",
        "UPDATE claims_warehouse SET nilai_klaim_rp = 0;",
        "ALTER TABLE claims_warehouse DROP COLUMN claim_id;"
    ]
    for m_sql in malicious_queries:
        res = duckdb_engine.execute_query(m_sql)
        assert "error" in res
        assert "tidak diizinkan" in res["error"]

def test_duckdb_published_tool_detect_phantom_billing():
    res = duckdb_engine.tool_detect_phantom_billing(surge_threshold=3.0)
    assert res["tool_name"] == "detect_phantom_billing"
    assert res["anomalies_detected"] >= 1
    # CLM-2026-8801 (RS X, surge 8.5x) or CLM-2026-8806 (RS MP, surge 4.8x)
    cluster_ids = [r["cluster_id"] for r in res["results"]]
    assert "CLS-PHANTOM-85" in cluster_ids

def test_duckdb_published_tool_detect_repeat_billing():
    res = duckdb_engine.tool_detect_repeat_billing(max_gap_days=30)
    assert res["tool_name"] == "detect_repeat_billing"
    assert res["anomalies_detected"] >= 1
    # CLM-2026-8802 has repeat billing flag
    claim_ids = [r["claim_id"] for r in res["results"]]
    assert "CLM-2026-8802" in claim_ids

def test_duckdb_published_tool_financial_risk_summary():
    res = duckdb_engine.tool_financial_risk_summary()
    assert res["tool_name"] == "financial_risk_summary"
    lanes = [l["triage_lane"] for l in res["summary_lanes"]]
    assert "MERAH" in lanes
    assert "HIJAU" in lanes

def test_duckdb_api_endpoints():
    # 1. Info endpoint
    res_info = client.get("/api/v1/duckdb/info")
    assert res_info.status_code == 200
    assert res_info.json()["engine"] == "DuckDB In-Memory OLAP"

    # 2. Tables endpoint
    res_tables = client.get("/api/v1/duckdb/tables")
    assert res_tables.status_code == 200
    assert len(res_tables.json()["tables"]) >= 4

    # 3. Query endpoint
    res_q = client.post("/api/v1/duckdb/query", json={
        "sql": "SELECT count(*) as total FROM claims_warehouse",
        "format": "json"
    })
    assert res_q.status_code == 200
    assert res_q.json()["row_count"] == 1
    assert res_q.json()["data"][0]["total"] >= 6

    # 4. Published tools catalog
    res_cat = client.get("/api/v1/duckdb/published-tools")
    assert res_cat.status_code == 200
    assert len(res_cat.json()["tools"]) >= 3

    # 5. Tool phantom billing
    res_pb = client.post("/api/v1/duckdb/tools/detect-phantom-billing", json={"surge_threshold": 3.0})
    assert res_pb.status_code == 200
    assert res_pb.json()["anomalies_detected"] >= 1

    # 6. Tool repeat billing
    res_rb = client.post("/api/v1/duckdb/tools/detect-repeat-billing", json={"max_gap_days": 30})
    assert res_rb.status_code == 200
    assert res_rb.json()["anomalies_detected"] >= 1

    # 7. Tool financial summary
    res_fin = client.get("/api/v1/duckdb/tools/financial-risk-summary")
    assert res_fin.status_code == 200
    assert len(res_fin.json()["summary_lanes"]) >= 2

    # 8. Tool BPJS sample anomalies
    res_bpjs = client.post("/api/v1/duckdb/tools/detect-bpjs-sample-anomalies?limit=10")
    assert res_bpjs.status_code == 200
    assert res_bpjs.json()["tool_name"] == "detect_bpjs_sample_anomalies"

def test_duckdb_bpjs_sample_views_and_query():
    # Verify official Healthkathon 2026 BPJS Data Sample (10,000 FKRTL claims)
    tables = duckdb_engine.list_tables()
    table_names = [t["name"] for t in tables]
    assert "bpjs_fkrtl_2024" in table_names
    assert "v_bpjs_repeat_claims_same_day" in table_names
    assert "v_bpjs_top_cbg_analysis" in table_names

    # Run query on bpjs_fkrtl_2024
    res = duckdb_engine.execute_query("SELECT count(*) as total_sample_claims FROM bpjs_fkrtl_2024")
    assert res["status"] == "success"
    assert res["data"][0]["total_sample_claims"] == 10000

    # Test published tool detect_bpjs_sample_anomalies
    tool_res = duckdb_engine.tool_detect_bpjs_sample_anomalies(limit=5)
    assert tool_res["tool_name"] == "detect_bpjs_sample_anomalies"
    assert tool_res["total_anomalies_returned"] >= 1
    assert "claim_1" in tool_res["anomalies"][0]
    assert "claim_2" in tool_res["anomalies"][0]
