"""
ClaimTrace JKN — PostgreSQL Relational OLTP Persistence & Sync Layer (SQLAlchemy 2.0 + psycopg3).
Provides durable relational persistence for claims, SHA-256 audit ledger blocks,
ARQ async job history, and operational snapshots with automatic graceful fallback
when PostgreSQL is unavailable or disabled in isolated unit tests.
"""

from __future__ import annotations

import os
import threading
import time
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Iterable, List, Optional
from urllib.parse import urlparse

from sqlalchemy import (
    BigInteger,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    create_engine,
    desc,
    func,
    select,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.types import JSON

DEFAULT_DATABASE_URL = "postgresql+psycopg://claimtrace:claimtrace_local_dev@127.0.0.1:5432/claimtrace_db"


def _resolve_database_url() -> str:
    raw = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL).strip() or DEFAULT_DATABASE_URL
    if raw.startswith("postgresql://"):
        return raw.replace("postgresql://", "postgresql+psycopg://", 1)
    if raw.startswith("postgres://"):
        return raw.replace("postgres://", "postgresql+psycopg://", 1)
    return raw


JSONType = JSON().with_variant(JSONB(), "postgresql")


class Base(DeclarativeBase):
    pass


class ClaimRecord(Base):
    __tablename__ = "claims"

    claim_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    faskes_id: Mapped[str] = mapped_column(String(64), index=True)
    nama_faskes: Mapped[str] = mapped_column(String(255), index=True)
    kelas_rs: Mapped[str] = mapped_column(String(32), default="B")
    peserta_token_aes: Mapped[str] = mapped_column(String(128), index=True)
    tanggal_layanan: Mapped[str] = mapped_column(String(64), index=True)
    ina_cbg_code: Mapped[str] = mapped_column(String(64), index=True)
    icd10_primary: Mapped[str] = mapped_column(String(160), index=True)
    nilai_klaim_rp: Mapped[int] = mapped_column(BigInteger, default=0)
    jenis_pelayanan: Mapped[str] = mapped_column(String(32), default="RITL", index=True)
    jenis_pengajuan: Mapped[str] = mapped_column(String(64), default="Reguler")
    no_fpk: Mapped[Optional[str]] = mapped_column(String(96), nullable=True, index=True)
    status_verifikasi: Mapped[Optional[str]] = mapped_column(String(96), nullable=True, index=True)
    triage_lane: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, index=True)
    priority_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    payload_json: Mapped[Dict[str, Any]] = mapped_column(JSONType, default=dict)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class AuditLedgerBlockRecord(Base):
    __tablename__ = "audit_ledger_blocks"

    block_index: Mapped[int] = mapped_column(Integer, primary_key=True)
    timestamp: Mapped[str] = mapped_column(String(64), index=True)
    event_type: Mapped[str] = mapped_column(String(128), index=True)
    claim_id: Mapped[str] = mapped_column(String(64), index=True)
    actor: Mapped[str] = mapped_column(String(128), index=True)
    prev_hash: Mapped[str] = mapped_column(String(64))
    current_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    payload_json: Mapped[Dict[str, Any]] = mapped_column(JSONType, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class AsyncJobRunRecord(Base):
    __tablename__ = "async_job_runs"

    job_id: Mapped[str] = mapped_column(String(96), primary_key=True)
    job_type: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(32), index=True)
    queue_name: Mapped[str] = mapped_column(String(64), default="claimtrace:arq")
    dispatch_mode: Mapped[str] = mapped_column(String(64), default="arq_redis_worker")
    requested_by: Mapped[str] = mapped_column(String(128), default="Administrator ClaimTrace")
    queued_at: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    result_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONType, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class OperationsSnapshotRecord(Base):
    __tablename__ = "operations_snapshots"

    namespace: Mapped[str] = mapped_column(String(64), primary_key=True)
    item_count: Mapped[int] = mapped_column(Integer, default=0)
    payload_json: Mapped[Any] = mapped_column(JSONType, default=dict)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


_ENGINE_LOCK = threading.Lock()
_ENGINE: Optional[Engine] = None
_ENGINE_URL: Optional[str] = None
_SESSION_FACTORY: Optional[sessionmaker] = None
_SCHEMA_INITIALIZED = False


def sanitize_database_url(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.hostname or "127.0.0.1"
    port = parsed.port or 5432
    db = parsed.path.lstrip("/") or "claimtrace_db"
    user = parsed.username or "claimtrace"
    scheme = parsed.scheme or "postgresql+psycopg"
    return f"{scheme}://{user}:***@{host}:{port}/{db}"


def reset_postgres_engine() -> None:
    """Disposes cached SQLAlchemy engine (useful for tests or URL reconfiguration)."""
    global _ENGINE, _ENGINE_URL, _SESSION_FACTORY, _SCHEMA_INITIALIZED
    with _ENGINE_LOCK:
        if _ENGINE is not None:
            try:
                _ENGINE.dispose()
            except Exception:
                pass
        _ENGINE = None
        _ENGINE_URL = None
        _SESSION_FACTORY = None
        _SCHEMA_INITIALIZED = False


def get_postgres_engine() -> Optional[Engine]:
    """Returns a pooled SQLAlchemy engine connected to PostgreSQL, or None if disabled/unreachable."""
    global _ENGINE, _ENGINE_URL, _SESSION_FACTORY
    if os.getenv("CLAIMTRACE_DISABLE_POSTGRES") == "1":
        return None
    target_url = _resolve_database_url()
    with _ENGINE_LOCK:
        if _ENGINE is not None and _ENGINE_URL != target_url:
            try:
                _ENGINE.dispose()
            except Exception:
                pass
            _ENGINE = None
            _SESSION_FACTORY = None
        if _ENGINE is None:
            try:
                _ENGINE = create_engine(
                    target_url,
                    pool_pre_ping=True,
                    pool_size=5,
                    max_overflow=10,
                    pool_recycle=1800,
                    connect_args={"connect_timeout": 2},
                )
                _ENGINE_URL = target_url
                _SESSION_FACTORY = sessionmaker(bind=_ENGINE, autoflush=False, autocommit=False)
            except Exception:
                _ENGINE = None
                _SESSION_FACTORY = None
                return None
    try:
        with _ENGINE.connect() as conn:
            conn.execute(text("SELECT 1"))
        return _ENGINE
    except Exception:
        return None


def get_postgres_session() -> Optional[Session]:
    engine = get_postgres_engine()
    if engine is None or _SESSION_FACTORY is None:
        return None
    return _SESSION_FACTORY()


def init_postgres_schema(force: bool = False) -> bool:
    """Idempotently creates ClaimTrace OLTP tables in PostgreSQL."""
    global _SCHEMA_INITIALIZED
    if _SCHEMA_INITIALIZED and not force:
        return get_postgres_engine() is not None
    engine = get_postgres_engine()
    if engine is None:
        return False
    try:
        Base.metadata.create_all(bind=engine)
        _SCHEMA_INITIALIZED = True
        return True
    except Exception:
        return False


def sync_claims_to_postgres(
    claims_map: Dict[str, Any],
    evaluator: Optional[Callable[[Any], Any]] = None,
) -> int:
    """Upserts active ClaimInput records into PostgreSQL `claims` table."""
    if not init_postgres_schema():
        return 0
    session = get_postgres_session()
    if session is None:
        return 0
    synced = 0
    try:
        now = datetime.now(timezone.utc)
        for cid, claim in claims_map.items():
            dumped = claim.model_dump(mode="json") if hasattr(claim, "model_dump") else dict(claim)
            triage_lane = None
            priority_score = None
            if evaluator is not None:
                try:
                    triage = evaluator(claim)
                    triage_lane = getattr(triage, "triage_lane", None)
                    priority_score = float(getattr(triage, "final_priority_score", 0.0))
                except Exception:
                    pass
            row = session.get(ClaimRecord, cid)
            if row is None:
                row = ClaimRecord(claim_id=cid)
                session.add(row)
            row.faskes_id = str(dumped.get("faskes_id") or "")
            row.nama_faskes = str(dumped.get("nama_faskes") or "")
            row.kelas_rs = str(dumped.get("kelas_rs") or "B")
            row.peserta_token_aes = str(dumped.get("peserta_token_aes") or "")
            row.tanggal_layanan = str(dumped.get("tanggal_layanan") or "")
            row.ina_cbg_code = str(dumped.get("ina_cbg_code") or "")
            row.icd10_primary = str(dumped.get("icd10_primary") or "")
            row.nilai_klaim_rp = int(dumped.get("nilai_klaim_rp") or 0)
            row.jenis_pelayanan = str(dumped.get("jenis_pelayanan") or "RITL")
            row.jenis_pengajuan = str(dumped.get("jenis_pengajuan") or "Reguler")
            row.no_fpk = dumped.get("no_fpk")
            row.status_verifikasi = dumped.get("status_verifikasi")
            if triage_lane is not None:
                row.triage_lane = str(triage_lane)
            if priority_score is not None:
                row.priority_score = priority_score
            row.payload_json = dumped
            row.updated_at = now
            synced += 1
        session.commit()
        return synced
    except Exception:
        session.rollback()
        return 0
    finally:
        session.close()


def upsert_audit_block_to_postgres(entry: Dict[str, Any]) -> bool:
    """Write-through single SHA-256 audit ledger block into PostgreSQL."""
    if not init_postgres_schema():
        return False
    session = get_postgres_session()
    if session is None:
        return False
    try:
        idx = int(entry.get("index", 0))
        if idx <= 0:
            return False
        row = session.get(AuditLedgerBlockRecord, idx)
        if row is None:
            row = AuditLedgerBlockRecord(block_index=idx)
            session.add(row)
        row.timestamp = str(entry.get("timestamp") or "")
        row.event_type = str(entry.get("event_type") or "")
        row.claim_id = str(entry.get("claim_id") or "")
        row.actor = str(entry.get("actor") or "")
        row.prev_hash = str(entry.get("prev_hash") or "")
        row.current_hash = str(entry.get("current_hash") or "")
        row.payload_json = entry.get("payload") or {}
        session.commit()
        return True
    except Exception:
        session.rollback()
        return False
    finally:
        session.close()


def sync_audit_blocks_to_postgres(chain: Iterable[Dict[str, Any]]) -> int:
    """Reconciles full SHA-256 audit ledger chain into PostgreSQL `audit_ledger_blocks`."""
    if not init_postgres_schema():
        return 0
    session = get_postgres_session()
    if session is None:
        return 0
    synced = 0
    try:
        entries = list(chain)
        valid_indices = set()
        for entry in entries:
            idx = int(entry.get("index", 0))
            if idx <= 0:
                continue
            valid_indices.add(idx)
            row = session.get(AuditLedgerBlockRecord, idx)
            if row is None:
                row = AuditLedgerBlockRecord(block_index=idx)
                session.add(row)
            row.timestamp = str(entry.get("timestamp") or "")
            row.event_type = str(entry.get("event_type") or "")
            row.claim_id = str(entry.get("claim_id") or "")
            row.actor = str(entry.get("actor") or "")
            row.prev_hash = str(entry.get("prev_hash") or "")
            row.current_hash = str(entry.get("current_hash") or "")
            row.payload_json = entry.get("payload") or {}
            synced += 1
        # Remove stale rows with higher block_index if chain was cleanly re-seeded
        if valid_indices:
            existing_rows = session.scalars(select(AuditLedgerBlockRecord)).all()
            for r in existing_rows:
                if r.block_index not in valid_indices:
                    session.delete(r)
        session.commit()
        return synced
    except Exception:
        session.rollback()
        return 0
    finally:
        session.close()


def upsert_async_job_to_postgres(record: Dict[str, Any]) -> bool:
    """Write-through async worker job status/result from Redis to PostgreSQL."""
    if not init_postgres_schema():
        return False
    session = get_postgres_session()
    if session is None:
        return False
    try:
        job_id = str(record.get("job_id") or "").strip()
        if not job_id:
            return False
        row = session.get(AsyncJobRunRecord, job_id)
        if row is None:
            row = AsyncJobRunRecord(job_id=job_id)
            session.add(row)
        row.job_type = str(record.get("job_type") or "unknown")
        row.status = str(record.get("status") or "queued")
        row.queue_name = str(record.get("queue") or "claimtrace:arq")
        row.dispatch_mode = str(record.get("dispatch_mode") or "arq_redis_worker")
        row.requested_by = str(record.get("requested_by") or "Administrator ClaimTrace")
        row.queued_at = str(record.get("queued_at") or "")
        row.result_json = record.get("result")
        row.error_message = record.get("error")
        row.updated_at = datetime.now(timezone.utc)
        session.commit()
        return True
    except Exception:
        session.rollback()
        return False
    finally:
        session.close()


def sync_operations_snapshot_to_postgres(namespace: str, data: Any) -> bool:
    """Upserts an operational state namespace (cases, clarifications, interventions, etc.) into PostgreSQL."""
    if not init_postgres_schema():
        return False
    session = get_postgres_session()
    if session is None:
        return False
    try:
        count = len(data) if isinstance(data, (list, dict)) else 1
        row = session.get(OperationsSnapshotRecord, namespace)
        if row is None:
            row = OperationsSnapshotRecord(namespace=namespace)
            session.add(row)
        row.item_count = count
        row.payload_json = data
        row.updated_at = datetime.now(timezone.utc)
        session.commit()
        return True
    except Exception:
        session.rollback()
        return False
    finally:
        session.close()


def query_claims_from_postgres(
    lane: Optional[str] = None,
    jenis_pelayanan: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """Queries ClaimTrace claims directly from PostgreSQL ordered by priority_score DESC."""
    if not init_postgres_schema():
        return []
    session = get_postgres_session()
    if session is None:
        return []
    try:
        stmt = select(ClaimRecord)
        if lane:
            stmt = stmt.where(func.upper(ClaimRecord.triage_lane) == lane.upper())
        if jenis_pelayanan and jenis_pelayanan.upper() != "ALL":
            stmt = stmt.where(func.upper(ClaimRecord.jenis_pelayanan) == jenis_pelayanan.upper())
        stmt = stmt.order_by(desc(ClaimRecord.priority_score), ClaimRecord.claim_id).limit(max(1, min(int(limit), 200)))
        rows = session.scalars(stmt).all()
        return [
            {
                "claim_id": r.claim_id,
                "faskes_id": r.faskes_id,
                "nama_faskes": r.nama_faskes,
                "kelas_rs": r.kelas_rs,
                "tanggal_layanan": r.tanggal_layanan,
                "ina_cbg_code": r.ina_cbg_code,
                "icd10_primary": r.icd10_primary,
                "nilai_klaim_rp": r.nilai_klaim_rp,
                "jenis_pelayanan": r.jenis_pelayanan,
                "jenis_pengajuan": r.jenis_pengajuan,
                "no_fpk": r.no_fpk,
                "status_verifikasi": r.status_verifikasi,
                "triage_lane": r.triage_lane,
                "priority_score": r.priority_score,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            }
            for r in rows
        ]
    except Exception:
        return []
    finally:
        session.close()


def query_audit_blocks_from_postgres(
    claim_id: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """Queries SHA-256 audit ledger blocks directly from PostgreSQL newest-first."""
    if not init_postgres_schema():
        return []
    session = get_postgres_session()
    if session is None:
        return []
    try:
        stmt = select(AuditLedgerBlockRecord)
        if claim_id:
            stmt = stmt.where(AuditLedgerBlockRecord.claim_id == claim_id)
        stmt = stmt.order_by(desc(AuditLedgerBlockRecord.block_index)).limit(max(1, min(int(limit), 200)))
        rows = session.scalars(stmt).all()
        return [
            {
                "index": r.block_index,
                "timestamp": r.timestamp,
                "event_type": r.event_type,
                "claim_id": r.claim_id,
                "actor": r.actor,
                "prev_hash": r.prev_hash,
                "current_hash": r.current_hash,
                "payload": r.payload_json,
            }
            for r in rows
        ]
    except Exception:
        return []
    finally:
        session.close()


def query_async_jobs_from_postgres(limit: int = 20) -> List[Dict[str, Any]]:
    """Queries persisted async job history directly from PostgreSQL newest-first."""
    if not init_postgres_schema():
        return []
    session = get_postgres_session()
    if session is None:
        return []
    try:
        stmt = select(AsyncJobRunRecord).order_by(desc(AsyncJobRunRecord.updated_at)).limit(max(1, min(int(limit), 100)))
        rows = session.scalars(stmt).all()
        return [
            {
                "job_id": r.job_id,
                "job_type": r.job_type,
                "status": r.status,
                "queue": r.queue_name,
                "dispatch_mode": r.dispatch_mode,
                "requested_by": r.requested_by,
                "queued_at": r.queued_at,
                "result": r.result_json,
                "error": r.error_message,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            }
            for r in rows
        ]
    except Exception:
        return []
    finally:
        session.close()


def get_postgres_status() -> Dict[str, Any]:
    """Returns live diagnostics for PostgreSQL server, pool, and table row counts."""
    url = _resolve_database_url()
    t0 = time.perf_counter()
    engine = get_postgres_engine()
    if engine is None:
        return {
            "postgres_connected": False,
            "mode": "json_fallback",
            "database_url_sanitized": sanitize_database_url(url),
            "postgres_version": None,
            "database_name": None,
            "latency_ms": None,
            "tables": {
                "claims": 0,
                "audit_ledger_blocks": 0,
                "async_job_runs": 0,
                "operations_snapshots": 0,
            },
        }

    try:
        init_postgres_schema()
        with engine.connect() as conn:
            ver_row = conn.execute(text("SELECT version(), current_database()")).first()
            latency_ms = round((time.perf_counter() - t0) * 1000, 2)
            claims_cnt = int(conn.execute(select(func.count()).select_from(ClaimRecord)).scalar() or 0)
            audit_cnt = int(conn.execute(select(func.count()).select_from(AuditLedgerBlockRecord)).scalar() or 0)
            jobs_cnt = int(conn.execute(select(func.count()).select_from(AsyncJobRunRecord)).scalar() or 0)
            ops_cnt = int(conn.execute(select(func.count()).select_from(OperationsSnapshotRecord)).scalar() or 0)
        return {
            "postgres_connected": True,
            "mode": "postgresql_live",
            "database_url_sanitized": sanitize_database_url(url),
            "postgres_version": (ver_row[0].split(",")[0] if ver_row and ver_row[0] else "PostgreSQL"),
            "database_name": (ver_row[1] if ver_row else "claimtrace_db"),
            "latency_ms": latency_ms,
            "tables": {
                "claims": claims_cnt,
                "audit_ledger_blocks": audit_cnt,
                "async_job_runs": jobs_cnt,
                "operations_snapshots": ops_cnt,
            },
        }
    except Exception as exc:
        return {
            "postgres_connected": False,
            "mode": "json_fallback",
            "database_url_sanitized": sanitize_database_url(url),
            "error": str(exc),
            "postgres_version": None,
            "database_name": None,
            "latency_ms": None,
            "tables": {
                "claims": 0,
                "audit_ledger_blocks": 0,
                "async_job_runs": 0,
                "operations_snapshots": 0,
            },
        }
