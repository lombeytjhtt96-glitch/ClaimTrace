"""
ClaimTrace DuckDB SQL Security Guard & Query Firewall
Enforces Strict Read-Only Analytical Execution, Anti-SQL Injection,
and Zero-Arbitrary File-System/SSRF Access (NIST CSF 2.0 PR.DS-01).
"""

import re
from typing import Tuple, Optional, Set

# Dangerous SQL Commands that mutate state, modify schema, or manage database
FORBIDDEN_KEYWORDS: Set[str] = {
    "DROP", "CREATE", "ALTER", "TRUNCATE", "INSERT", "UPDATE", "DELETE",
    "ATTACH", "DETACH", "COPY", "PRAGMA", "INSTALL", "LOAD", "EXPORT",
    "IMPORT", "CALL", "CHECKPOINT", "VACUUM", "SET", "RESET", "RENAME",
    "GRANT", "REVOKE", "COMMIT", "ROLLBACK", "TRANSACTION", "BEGIN"
}

# Dangerous DuckDB functions that read or write arbitrary host files, secrets, or remote URLs
FORBIDDEN_FUNCTIONS: Set[str] = {
    "read_csv", "read_csv_auto", "read_parquet", "read_json", "read_json_auto",
    "read_ndjson", "read_ndjson_auto", "read_xlsx", "read_blob", "read_text",
    "scan_parquet", "parquet_scan", "csv_scan", "json_scan", "sniff_csv", "glob",
    "sqlite_scan", "postgres_scan", "httpfs", "iceberg_scan", "iceberg_metadata",
    "delta_scan", "duckdb_secrets", "duckdb_settings", "current_setting",
    "getenv", "pragma_database_list", "http_get",
}

DIRECT_FILE_SCAN_PATTERN = re.compile(
    r"""['"](?:(?:file|s3|gs|az|abfs|https?|hf):\/\/|\/[^'"]*|\.\.?\/[^'"]*|[^'"]+\.(?:parquet|csv|tsv|json|ndjson|jsonl|xlsx?|sqlite|db|duckdb))['"]""",
    re.IGNORECASE,
)


def strip_sql_comments(sql: str) -> str:
    """Strips /* ... */ block comments and -- ... line comments to defeat token obfuscation."""
    no_block = re.sub(r"/\*[\s\S]*?\*/", " ", sql)
    return re.sub(r"--[^\r\n]*", " ", no_block)


def remove_string_literals(sql: str) -> str:
    """
    Strips single and double quoted string literals to allow safe token scanning
    without false positives on text values.
    """
    clean = re.sub(r"'([^']|'')*'", "''", sql)
    clean = re.sub(r'"([^"]|"")*"', '""', clean)
    return clean


def validate_sql_query(raw_sql: str) -> Tuple[bool, Optional[str]]:
    """
    Validates that a SQL query is strictly a safe, read-only analytical query.
    Returns (is_valid, rejection_reason).
    """
    if not raw_sql or not raw_sql.strip():
        return False, "Kueri SQL tidak boleh kosong."

    sql_trimmed = raw_sql.strip()

    # 1. Max length limit to prevent buffer / memory exhaustion
    if len(sql_trimmed) > 8192:
        return False, "Panjang kueri SQL melebihi batas keamanan maksimum (8.192 karakter)."

    # 2. Strip comments before structural checks so /* ... */ cannot split keywords or functions
    comment_stripped = strip_sql_comments(sql_trimmed)

    # 3. Prevent statement chaining (Stacked Queries) via semicolon
    clean_sql = remove_string_literals(comment_stripped).rstrip().rstrip(";")
    if ";" in clean_sql:
        return False, "Pemisah titik-koma (;) ganda tidak diizinkan untuk mencegah serangan stacked queries."

    # 4. Enforce that query starts with SELECT, WITH, EXPLAIN, or DESCRIBE
    first_word_match = re.match(r"^\s*([a-zA-Z]+)", clean_sql)
    if not first_word_match:
        return False, "Format kueri SQL tidak valid."

    first_word = first_word_match.group(1).upper()
    if first_word not in {"SELECT", "WITH", "EXPLAIN", "DESCRIBE"}:
        return False, f"Operasi '{first_word}' tidak diizinkan. Hanya kueri SELECT atau WITH analitik yang diizinkan."

    # 5. Check against forbidden command keywords
    tokens = set(re.findall(r"\b[A-Z_]+\b", clean_sql.upper()))
    intersection = tokens.intersection(FORBIDDEN_KEYWORDS)
    if intersection:
        forbidden_word = sorted(list(intersection))[0]
        return False, f"Operasi '{forbidden_word}' tidak diizinkan demi menjaga integritas data klaim BPJS Kesehatan."

    # 6. Check against forbidden file-system and remote scan functions
    clean_lower = clean_sql.lower()
    for func in FORBIDDEN_FUNCTIONS:
        pattern = rf"\b{func}\s*\("
        if re.search(pattern, clean_lower):
            return False, f"Pemanggilan fungsi berkas '{func}()' tidak diizinkan untuk mencegah akses file sistem yang tidak sah."

    # 7. Block DuckDB direct file replacement scans (e.g. SELECT * FROM '/etc/passwd' or 's3://...')
    if DIRECT_FILE_SCAN_PATTERN.search(comment_stripped):
        return False, "Akses berkas langsung atau URL jarak jauh di dalam kueri tidak diizinkan."

    return True, None
