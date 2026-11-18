#!/usr/bin/env bash
set -euo pipefail

# ClaimTrace JKN — Standalone Scheduled Backup Script
# Archives PostgreSQL dump, Redis snapshot metadata, and forensic SHA-256 audit ledger files.
# Suitable for cron, systemd timers, or Docker Compose backup-scheduler container.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${REPO_ROOT}/backend"

export DATABASE_URL="${DATABASE_URL:-postgresql+psycopg://claimtrace:claimtrace_local_dev@127.0.0.1:5432/claimtrace_db}"
export REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379/0}"
export CLAIMTRACE_BACKUP_DIR="${CLAIMTRACE_BACKUP_DIR:-${BACKEND_DIR}/backups}"
export CLAIMTRACE_BACKUP_RETENTION_COUNT="${CLAIMTRACE_BACKUP_RETENTION_COUNT:-14}"

cd "${BACKEND_DIR}"
python3 - <<'PY'
import json
from app.infra.backup_manager import create_scheduled_backup

result = create_scheduled_backup(trigger="scheduled_cron_script")
print(json.dumps(result, indent=2, ensure_ascii=False))
PY
