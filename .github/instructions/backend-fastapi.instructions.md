---
applyTo: 'backend/**/*.py'
description: 'FastAPI and Python backend standards for ClaimTrace JKN, covering asynchronous patterns, Pydantic v2 validation, DuckDB queries, and error handling.'
---

# Backend FastAPI Standards for ClaimTrace JKN

## Asynchronous Architecture
- Use `async def` for all route handlers performing database access, network I/O, or audit logging.
- For CPU-bound mathematical operations (e.g. geometric velocity calculations), use thread offloading if blocking exceeds 10ms.

## Schema Modeling with Pydantic v2
- Use `pydantic.BaseModel` with strict type annotations.
- Leverage `field_validator` and `model_validator(mode='after')` for cross-field consistency checks.
- Keep serialization clean: use `.model_dump(mode='json')` instead of legacy `.dict()`.
- Never expose internal tracebacks in `HTTPException` detail responses.

## DuckDB Analytical Queries
- Always execute queries using parameterized queries: `conn.execute("SELECT ... WHERE claim_id = ?", [claim_id])`.
- Avoid string interpolation or formatting inside SQL execution blocks.
- Close connections or use context managers to prevent descriptor leaks.

## Rate Limiting and Security Middleware
- Wrap state-altering routes with role-based dependencies (`require_adjudicator`, `require_admin`).
- Ensure all sensitive endpoints adhere to cache invalidation headers (`no-store, no-cache, must-revalidate`).
