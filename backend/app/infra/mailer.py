"""
ClaimTrace JKN — FastAPI-Mail + Jinja2 Notification Engine.
Supports both real SMTP delivery (when MAIL_USERNAME/MAIL_PASSWORD/MAIL_SERVER are configured)
and safe local sandbox/spool delivery (SUPPRESS_SEND=1) with full Jinja2 HTML rendering and
outbox audit inspection.
"""

from __future__ import annotations

import json
import os
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates" / "mail"
OUTBOX_SPOOL_FILE = Path(__file__).resolve().parent.parent.parent / "data" / ".mail_outbox_spool.json"

_OUTBOX_LOCK = threading.RLock()
_MEM_OUTBOX: List[Dict[str, Any]] = []

TemplateNameLiteral = Literal["clarification_notice", "backup_report", "audit_alert"]

_JINJA_ENV = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


def _is_smtp_configured() -> bool:
    return bool(
        os.getenv("MAIL_SERVER", "").strip()
        and os.getenv("MAIL_USERNAME", "").strip()
        and os.getenv("MAIL_PASSWORD", "").strip()
        and os.getenv("CLAIMTRACE_MAIL_LIVE_SMTP") == "1"
    )


def build_mail_config() -> ConnectionConfig:
    live = _is_smtp_configured()
    return ConnectionConfig(
        MAIL_USERNAME=os.getenv("MAIL_USERNAME", "noreply@claimtrace.internal"),
        MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "local-dev-sandbox-secret"),
        MAIL_FROM=os.getenv("MAIL_FROM", "noreply@claimtrace.internal"),
        MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "ClaimTrace JKN DSS"),
        MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
        MAIL_SERVER=os.getenv("MAIL_SERVER", "localhost"),
        MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "1") == "1",
        MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "0") == "1",
        USE_CREDENTIALS=live,
        VALIDATE_CERTS=live,
        TEMPLATE_FOLDER=TEMPLATES_DIR,
        SUPPRESS_SEND=0 if live else 1,
    )


def render_mail_template(template_name: str, context: Dict[str, Any]) -> str:
    fname = template_name if template_name.endswith(".html") else f"{template_name}.html"
    tpl = _JINJA_ENV.get_template(fname)
    return tpl.render(**context)


def _persist_outbox_entry(entry: Dict[str, Any]) -> None:
    with _OUTBOX_LOCK:
        _MEM_OUTBOX.insert(0, entry)
        del _MEM_OUTBOX[50:]
        if os.getenv("PYTEST_CURRENT_TEST"):
            return
        try:
            OUTBOX_SPOOL_FILE.parent.mkdir(parents=True, exist_ok=True)
            OUTBOX_SPOOL_FILE.write_text(
                json.dumps(_MEM_OUTBOX, indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
        except Exception:
            pass


def list_mail_outbox(limit: int = 20) -> List[Dict[str, Any]]:
    bounded = max(1, min(int(limit), 50))
    with _OUTBOX_LOCK:
        if not _MEM_OUTBOX and not os.getenv("PYTEST_CURRENT_TEST") and OUTBOX_SPOOL_FILE.exists():
            try:
                loaded = json.loads(OUTBOX_SPOOL_FILE.read_text(encoding="utf-8"))
                if isinstance(loaded, list):
                    _MEM_OUTBOX.extend(loaded[:50])
            except Exception:
                pass
        return _MEM_OUTBOX[:bounded]


async def send_templated_mail(
    recipients: List[str],
    subject: str,
    template_name: TemplateNameLiteral,
    context: Dict[str, Any],
) -> Dict[str, Any]:
    """Renders Jinja2 HTML template and dispatches via FastAPI-Mail (SMTP or sandbox spool)."""
    html_body = render_mail_template(template_name, context)
    conf = build_mail_config()
    fm = FastMail(conf)

    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        template_body=context,
        subtype=MessageType.html,
    )
    await fm.send_message(message, template_name=f"{template_name}.html")

    mail_id = f"MAIL-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
    mode = "smtp_live" if _is_smtp_configured() else "sandbox_spool_suppressed"
    entry = {
        "mail_id": mail_id,
        "recipients": recipients,
        "subject": subject,
        "template_name": f"{template_name}.html",
        "delivery_mode": mode,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "html_preview_length": len(html_body),
        "html_preview": html_body[:2000],
    }
    _persist_outbox_entry(entry)
    return entry


def get_mailer_status() -> Dict[str, Any]:
    templates = sorted(p.name for p in TEMPLATES_DIR.glob("*.html")) if TEMPLATES_DIR.exists() else []
    return {
        "engine": "fastapi-mail + jinja2",
        "mode": "smtp_live" if _is_smtp_configured() else "sandbox_spool_suppressed",
        "template_dir": str(TEMPLATES_DIR),
        "available_templates": templates,
        "outbox_count": len(list_mail_outbox(50)),
    }
