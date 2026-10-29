#!/usr/bin/env python3
"""
Prometheus MCP Server for ClaimTrace (BPJS Kesehatan Healthkathon 2026)
Standard Model Context Protocol (MCP) Server using Python FastMCP
Inspired by prometheus/prometheus-mcp (Official Prometheus Ecosystem)

Allows AI assistants (Antigravity, Claude, Cursor) to execute PromQL queries,
inspect SLO/SLA metrics, active alerts, and evaluate system health for BPJS claims.
"""

import sys
import os
import json

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from mcp.server.fastmcp import FastMCP
from app.engine.prometheus_metrics import prometheus_engine

mcp = FastMCP("prometheus-claimtrace")

@mcp.tool()
def query(query: str) -> str:
    """
    Execute an instant PromQL query against the ClaimTrace Prometheus datasource.
    Example: claimtrace_financial_exposure_rupiah or claimtrace_priority_score{lane="MERAH"}
    """
    res = prometheus_engine.execute_promql_query(query)
    return json.dumps(res, indent=2)

@mcp.tool()
def range_query(query: str, start: str = "", end: str = "", step: str = "60s") -> str:
    """
    Execute a range query against the ClaimTrace Prometheus datasource, returning values over a time window.
    """
    res = prometheus_engine.execute_range_query(query)
    return json.dumps(res, indent=2)

@mcp.tool()
def list_alerts() -> str:
    """
    List all active Prometheus alerts in ClaimTrace (e.g. PhantomBillingSurgeCritical, ImpossibleTravelDoctorDetected).
    """
    alerts = prometheus_engine.get_active_alerts()
    return json.dumps({"alerts": alerts}, indent=2)

@mcp.tool()
def list_rules() -> str:
    """
    List all alerting and recording rules loaded in ClaimTrace Prometheus engine.
    """
    rules = prometheus_engine.get_alerting_rules()
    return json.dumps({"groups": rules}, indent=2)

@mcp.tool()
def metric_metadata(metric: str = "") -> str:
    """
    Returns metadata (help text and metric type) about ClaimTrace metrics.
    """
    meta = prometheus_engine.get_metric_metadata(metric if metric else None)
    return json.dumps(meta, indent=2)

@mcp.tool()
def runtime_info() -> str:
    """
    Get ClaimTrace Prometheus runtime and build information.
    """
    info = prometheus_engine.get_runtime_info()
    return json.dumps(info, indent=2)

@mcp.tool()
def tsdb_stats() -> str:
    """
    Get TSDB usage and cardinality statistics.
    """
    stats = prometheus_engine.get_tsdb_stats()
    return json.dumps(stats, indent=2)

@mcp.tool()
def healthy() -> str:
    """
    Liveness probe: verifies that ClaimTrace telemetry subsystem is up and healthy.
    """
    return json.dumps({"status": "healthy", "service": "prometheus-claimtrace"}, indent=2)

@mcp.tool()
def ready() -> str:
    """
    Readiness probe: verifies that ClaimTrace Prometheus MCP server is ready to accept client sessions.
    """
    return json.dumps({"status": "ready", "service": "prometheus-claimtrace"}, indent=2)

if __name__ == "__main__":
    mcp.run()
