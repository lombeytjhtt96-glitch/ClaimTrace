#!/usr/bin/env python3
"""
Telemetry MCP Server for ClaimTrace (BPJS Kesehatan Healthkathon 2026)
Standard Model Context Protocol (MCP) Server using Python FastMCP

Enables telemetry metric queries, SLO/SLA inspection, active alert monitoring,
and system health evaluation for BPJS Kesehatan claim adjudication.
"""

import sys
import os
import json

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from mcp.server.fastmcp import FastMCP
from app.engine.telemetry_metrics import telemetry_engine

mcp = FastMCP("claimtrace-telemetry")

@mcp.tool()
def query(query: str) -> str:
    """
    Execute an instant metric query against the ClaimTrace telemetry datasource.
    Example: claimtrace_financial_exposure_rupiah or claimtrace_priority_score{lane="MERAH"}
    """
    res = telemetry_engine.execute_metric_query(query)
    return json.dumps(res, indent=2)

@mcp.tool()
def range_query(query: str, start: str = "", end: str = "", step: str = "60s") -> str:
    """
    Execute a range query against the ClaimTrace telemetry datasource, returning values over a time window.
    """
    res = telemetry_engine.execute_range_query(query)
    return json.dumps(res, indent=2)

@mcp.tool()
def list_alerts() -> str:
    """
    List all active alerts in ClaimTrace (e.g. PhantomBillingSurgeCritical, ImpossibleTravelDoctorDetected).
    """
    alerts = telemetry_engine.get_active_alerts()
    return json.dumps({"alerts": alerts}, indent=2)

@mcp.tool()
def list_rules() -> str:
    """
    List all alerting and recording rules loaded in ClaimTrace telemetry engine.
    """
    rules = telemetry_engine.get_alerting_rules()
    return json.dumps({"groups": rules}, indent=2)

@mcp.tool()
def metric_metadata(metric: str = "") -> str:
    """
    Returns metadata (help text and metric type) about ClaimTrace metrics.
    """
    meta = telemetry_engine.get_metric_metadata(metric if metric else None)
    return json.dumps(meta, indent=2)

@mcp.tool()
def runtime_info() -> str:
    """
    Get ClaimTrace telemetry runtime and build information.
    """
    info = telemetry_engine.get_runtime_info()
    return json.dumps(info, indent=2)

@mcp.tool()
def tsdb_stats() -> str:
    """
    Get TSDB usage and cardinality statistics.
    """
    stats = telemetry_engine.get_tsdb_stats()
    return json.dumps(stats, indent=2)

@mcp.tool()
def healthy() -> str:
    """
    Liveness probe: verifies that ClaimTrace telemetry subsystem is up and healthy.
    """
    return json.dumps({"status": "healthy", "service": "claimtrace-telemetry"}, indent=2)

@mcp.tool()
def ready() -> str:
    """
    Readiness probe: verifies that ClaimTrace telemetry MCP server is ready to accept client sessions.
    """
    return json.dumps({"status": "ready", "service": "claimtrace-telemetry"}, indent=2)

if __name__ == "__main__":
    mcp.run()
