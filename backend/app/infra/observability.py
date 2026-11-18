"""
ClaimTrace JKN — Structured Logging (structlog JSON) & OpenTelemetry Distributed Tracing.
Correlates Nginx Reverse Proxy `X-Request-ID` across structured JSON logs and
OpenTelemetry FastAPI spans, keeping a bounded ring buffer of recent spans for
live inspection inside the ClaimTrace Infrastructure Console.
"""

from __future__ import annotations

import logging
import threading
from collections import deque
from datetime import datetime, timezone
from typing import Any, Deque, Dict, List, Optional, Sequence

import structlog
from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import ReadableSpan, TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, SpanExporter, SpanExportResult

_OBS_LOCK = threading.RLock()
_RECENT_SPANS: Deque[Dict[str, Any]] = deque(maxlen=120)
_RECENT_LOGS: Deque[Dict[str, Any]] = deque(maxlen=120)
_INITIALIZED = False


class RingBufferSpanExporter(SpanExporter):
    """Captures OpenTelemetry spans into a bounded in-memory ring buffer for live diagnostics."""

    def export(self, spans: Sequence[ReadableSpan]) -> SpanExportResult:
        with _OBS_LOCK:
            for sp in spans:
                ctx = sp.get_span_context()
                dur_ms = 0.0
                if sp.start_time and sp.end_time and sp.end_time >= sp.start_time:
                    dur_ms = round((sp.end_time - sp.start_time) / 1_000_000.0, 2)
                attrs = {str(k): str(v)[:160] for k, v in (sp.attributes or {}).items()}
                _RECENT_SPANS.appendleft({
                    "trace_id": f"{ctx.trace_id:032x}" if ctx else None,
                    "span_id": f"{ctx.span_id:016x}" if ctx else None,
                    "name": sp.name,
                    "duration_ms": dur_ms,
                    "status": sp.status.status_code.name if sp.status else "UNSET",
                    "attributes": attrs,
                    "recorded_at": datetime.now(timezone.utc).isoformat(),
                })
        return SpanExportResult.SUCCESS

    def shutdown(self) -> None:
        return None


def _capture_structlog_ring(_, __, event_dict: Dict[str, Any]) -> Dict[str, Any]:
    with _OBS_LOCK:
        _RECENT_LOGS.appendleft({
            "timestamp": event_dict.get("timestamp") or datetime.now(timezone.utc).isoformat(),
            "level": event_dict.get("level", "info"),
            "event": event_dict.get("event", ""),
            "request_id": event_dict.get("request_id"),
            "method": event_dict.get("method"),
            "path": event_dict.get("path"),
            "status_code": event_dict.get("status_code"),
            "duration_ms": event_dict.get("duration_ms"),
        })
    return event_dict


def configure_observability(app: Optional[FastAPI] = None) -> None:
    """Idempotently configures structlog JSON logging and OpenTelemetry FastAPI tracing."""
    global _INITIALIZED
    with _OBS_LOCK:
        if not _INITIALIZED:
            structlog.configure(
                processors=[
                    structlog.contextvars.merge_contextvars,
                    structlog.processors.add_log_level,
                    structlog.processors.TimeStamper(fmt="iso", utc=True),
                    _capture_structlog_ring,
                    structlog.processors.JSONRenderer(),
                ],
                wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
                cache_logger_on_first_use=True,
            )
            resource = Resource.create({
                "service.name": "claimtrace-jkn-api",
                "service.version": "2.4.0",
                "deployment.environment": "on-premise-bpjs",
            })
            provider = TracerProvider(resource=resource)
            provider.add_span_processor(SimpleSpanProcessor(RingBufferSpanExporter()))
            trace.set_tracer_provider(provider)
            _INITIALIZED = True

        if app is not None and not getattr(app.state, "_otel_instrumented", False):
            FastAPIInstrumentor.instrument_app(app, excluded_urls="metrics")
            app.state._otel_instrumented = True


def get_structured_logger(name: str = "claimtrace.api"):
    configure_observability()
    return structlog.get_logger(name)


def get_observability_snapshot(limit: int = 25) -> Dict[str, Any]:
    bounded = max(1, min(int(limit), 100))
    with _OBS_LOCK:
        spans = list(_RECENT_SPANS)[:bounded]
        logs = list(_RECENT_LOGS)[:bounded]
    return {
        "structlog_enabled": True,
        "structlog_format": "json",
        "opentelemetry_enabled": True,
        "service_name": "claimtrace-jkn-api",
        "total_recorded_spans": len(_RECENT_SPANS),
        "total_recorded_logs": len(_RECENT_LOGS),
        "recent_spans": spans,
        "recent_logs": logs,
    }
