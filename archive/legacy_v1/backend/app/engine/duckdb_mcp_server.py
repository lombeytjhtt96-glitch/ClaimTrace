#!/usr/bin/env python3
"""
DuckDB MCP Server for ClaimTrace (BPJS Kesehatan Healthkathon 2026)
Standard Model Context Protocol (MCP) Server using Python FastMCP
Inspired by teaguesterling/duckdb_mcp

Allows AI assistants (Antigravity, Claude, Cursor) to execute high-speed analytical
SQL queries and pre-published forensic tools against the ClaimTrace BPJS data warehouse.
"""

import sys
import os
import json

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from mcp.server.fastmcp import FastMCP
from app.engine.duckdb_analytics import duckdb_engine

mcp = FastMCP("duckdb-claimtrace")

@mcp.tool()
def query(sql: str, format: str = "json") -> str:
    """
    Execute a read-only analytical SQL query on ClaimTrace DuckDB warehouse.
    Supports formats: 'json', 'markdown', or 'csv'.
    Example: SELECT faskes_id, sum(nilai_klaim_rp) FROM claims_warehouse GROUP BY faskes_id
    """
    res = duckdb_engine.execute_query(sql, output_format=format)
    if "error" in res and res["error"]:
        return json.dumps({"status": "error", "message": res["error"]})
    if format == "json":
        return json.dumps(res["data"], indent=2, default=str)
    return str(res["data"])

@mcp.tool()
def describe(table_name: str = "claims_warehouse") -> str:
    """
    Get column names, data types, and nullability for a table or view in DuckDB warehouse.
    """
    try:
        desc = duckdb_engine.describe_table(table_name)
        return json.dumps(desc, indent=2)
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})

@mcp.tool()
def list_tables() -> str:
    """
    List all tables and analytical views in the ClaimTrace DuckDB database.
    """
    tables = duckdb_engine.list_tables()
    return json.dumps(tables, indent=2)

@mcp.tool()
def database_info() -> str:
    """
    Get overview of DuckDB database status, memory engine version, total claims indexed, and total portfolio Rp.
    """
    info = duckdb_engine.database_info()
    return json.dumps(info, indent=2)

@mcp.tool()
def detect_phantom_billing(surge_threshold: float = 3.0) -> str:
    """
    Published Forensic Tool: Detect clusters with high surge ratio above baseline without official baksos permit (Modus #6 Phantom Billing).
    """
    res = duckdb_engine.tool_detect_phantom_billing(surge_threshold=surge_threshold)
    return json.dumps(res, indent=2, default=str)

@mcp.tool()
def detect_repeat_billing(max_gap_days: int = 30) -> str:
    """
    Published Forensic Tool: Detect duplicate claims on identical episodes within statutory window (Modus #11 Repeat Billing).
    """
    res = duckdb_engine.tool_detect_repeat_billing(max_gap_days=max_gap_days)
    return json.dumps(res, indent=2, default=str)

@mcp.tool()
def detect_bpjs_sample_anomalies(limit: int = 20) -> str:
    """
    Published Forensic Tool: Detect same-day duplicate/split claims directly from the official Healthkathon 2026 BPJS Data Sample (10,000 FKRTL claims).
    """
    res = duckdb_engine.tool_detect_bpjs_sample_anomalies(limit=limit)
    return json.dumps(res, indent=2, default=str)

@mcp.tool()
def financial_risk_summary() -> str:
    """
    Published Forensic Tool: Aggregate total financial exposure and budget allocation across triage lanes (Hijau, Kuning, Merah).
    """
    res = duckdb_engine.tool_financial_risk_summary()
    return json.dumps(res, indent=2, default=str)

if __name__ == "__main__":
    # Run standard stdio MCP transport
    mcp.run()
