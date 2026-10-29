## PR Reviewer Guide 🔍

Here are some key observations to aid the review process:

### ⏱️ Estimated effort to review: 4 🔵🔵🔵🔵⚪

### 🧪 PR contains tests

### 🔒 No security concerns identified

### ⚡ Recommended focus areas for review

#### 
**In-Memory State**

Active OTP challenges are stored in a global in-memory dictionary. In a multi-worker deployment environment (such as Uvicorn or Gunicorn with multiple workers), the send-otp and verify-otp requests can land on different worker processes, causing verification to fail because the state is not shared across workers.





<hr>

⚠️ **Review coverage:** The following files were not included in this review because of the token budget:
- `app/engine/duckdb_analytics.py`
- `app/engine/chroma_semantic.py`
- `app/engine/fhir_adapter.py`
- `app/engine/scoring.py`
- `app/engine/prometheus_metrics.py`
- `app/engine/neo4j_graph.py`
- `app/engine/osrm_geovelocity.py`
- `app/engine/rea_forensics.py`
- `tests/test_security_and_rules.py`
- `app/engine/fhir_server.py`
- `app/security/rate_limiter.py`
- `app/engine/episode_graph.py`
- `app/security/token_manager.py`
- `app/engine/duckdb_mcp_server.py`
- `app/security/sql_guard.py`
- `app/engine/prometheus_mcp_server.py`
- `app/security/privacy_guard.py`
- `app/security/audit_log.py`
- `app/security/security_headers.py`
- `app/security/prompt_guard.py`