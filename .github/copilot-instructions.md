# ClaimTrace JKN Development Guidelines

ClaimTrace JKN is an institutional pre-payment audit and clinical fraud decision-support cockpit for BPJS Kesehatan FKRTL claim verification.

## Architecture & Key Paths
- **Backend (`backend/`)**: FastAPI + Uvicorn API on `http://localhost:8000` with DuckDB in-process analytics (`duckdb_analytics.py`), FHIR R4 adapter (`fhir_server.py`), cryptographic audit ledger (`audit_ledger.py`), decision receipts (`decision_receipts_engine.py`), detection & SOAR engine (`detection_soar_engine.py`), threat defense matrix (`threat_defense_engine.py`), telemetry exporter (`telemetry_metrics.py`), client forensics (`client_forensics.py`), narrative refiner (`narrative_refiner.py`), and temporal radar (`temporal_radar_engine.py`).
- **Frontend (`app/`)**: React + Vite + Tailwind CSS v3 cockpit on `http://localhost:3000` styled with Clinical Precision tokens (`app/src/styles/clinical-precision.css`, `app/src/index.css`).
- **Tests (`backend/tests/`, `tests_e2e/`)**: Pytest unit, API, security, and end-to-end verification suites.

## Engineering Standards
- Enforce **Zero-PHI** redaction (UU No. 27 Tahun 2022) across logs, API payloads, and UI components.
- Preserve **Human-in-the-Loop** adjudication: AI signals advise verifiers; final decisions are strictly server-authorized (`access_control.py`) and SHA-256 sealed.
- Avoid emojis in UI copy, logs, comments, or documentation.
- Write institutional Indonesian labels in user-facing UI components and keep numeric columns tabular (`tabular-nums`).

## Verification Commands
- Backend tests: `cd backend && python3 -m pytest tests/ -q`
- Frontend production build: `cd app && npm run build`
