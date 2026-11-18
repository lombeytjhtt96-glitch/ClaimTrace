"""Initial ClaimTrace JKN PostgreSQL OLTP schema (claims, audit_ledger_blocks, async_job_runs, operations_snapshots).

Revision ID: 20261118_0001
Revises:
Create Date: 2026-11-18 17:36:00+07:00
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20261118_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _existing_tables() -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return set(inspector.get_table_names())


def upgrade() -> None:
    existing = _existing_tables()

    if "claims" not in existing:
        op.create_table(
            "claims",
            sa.Column("claim_id", sa.String(length=64), primary_key=True),
            sa.Column("faskes_id", sa.String(length=64), nullable=False, index=True),
            sa.Column("nama_faskes", sa.String(length=255), nullable=False, index=True),
            sa.Column("kelas_rs", sa.String(length=32), nullable=False, server_default="B"),
            sa.Column("peserta_token_aes", sa.String(length=128), nullable=False, index=True),
            sa.Column("tanggal_layanan", sa.String(length=64), nullable=False, index=True),
            sa.Column("ina_cbg_code", sa.String(length=64), nullable=False, index=True),
            sa.Column("icd10_primary", sa.String(length=160), nullable=False, index=True),
            sa.Column("nilai_klaim_rp", sa.BigInteger(), nullable=False, server_default="0"),
            sa.Column("jenis_pelayanan", sa.String(length=32), nullable=False, server_default="RITL", index=True),
            sa.Column("jenis_pengajuan", sa.String(length=64), nullable=False, server_default="Reguler"),
            sa.Column("no_fpk", sa.String(length=96), nullable=True, index=True),
            sa.Column("status_verifikasi", sa.String(length=96), nullable=True, index=True),
            sa.Column("triage_lane", sa.String(length=32), nullable=True, index=True),
            sa.Column("priority_score", sa.Float(), nullable=True),
            sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        )

    if "audit_ledger_blocks" not in existing:
        op.create_table(
            "audit_ledger_blocks",
            sa.Column("block_index", sa.Integer(), primary_key=True),
            sa.Column("timestamp", sa.String(length=64), nullable=False, index=True),
            sa.Column("event_type", sa.String(length=128), nullable=False, index=True),
            sa.Column("claim_id", sa.String(length=64), nullable=False, index=True),
            sa.Column("actor", sa.String(length=128), nullable=False, index=True),
            sa.Column("prev_hash", sa.String(length=64), nullable=False),
            sa.Column("current_hash", sa.String(length=64), nullable=False, unique=True, index=True),
            sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        )

    if "async_job_runs" not in existing:
        op.create_table(
            "async_job_runs",
            sa.Column("job_id", sa.String(length=96), primary_key=True),
            sa.Column("job_type", sa.String(length=64), nullable=False, index=True),
            sa.Column("status", sa.String(length=32), nullable=False, index=True),
            sa.Column("queue_name", sa.String(length=64), nullable=False, server_default="claimtrace:arq"),
            sa.Column("dispatch_mode", sa.String(length=64), nullable=False, server_default="arq_redis_worker"),
            sa.Column("requested_by", sa.String(length=128), nullable=False, server_default="Administrator ClaimTrace"),
            sa.Column("queued_at", sa.String(length=64), nullable=True),
            sa.Column("result_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        )

    if "operations_snapshots" not in existing:
        op.create_table(
            "operations_snapshots",
            sa.Column("namespace", sa.String(length=64), primary_key=True),
            sa.Column("item_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        )


def downgrade() -> None:
    op.drop_table("operations_snapshots")
    op.drop_table("async_job_runs")
    op.drop_table("audit_ledger_blocks")
    op.drop_table("claims")
