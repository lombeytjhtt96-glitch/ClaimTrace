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

# Dangerous DuckDB functions that read or write arbitrary host files or remote URLs
FORBIDDEN_FUNCTIONS: Set[str] = {
    "read_csv", "read_csv_auto", "read_parquet", "read_json", "read_json_auto",
    "read_blob", "read_text", "scan_parquet", "sniff_csv", "glob",
    "sqlite_scan", "postgres_scan", "httpfs", "iceberg_scan", "delta_scan"
}

def remove_string_literals(sql: str) -> str:
    """
    Strips single and double quoted string literals to allow safe token scanning
    without false positives on text values.
    """
    # Replace contents of single quotes
    clean = re.sub(r"'([^']|'')*'", "''", sql)
    # Replace contents of double quotes
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

    # 2. Prevent statement chaining (Stacked Queries) via semicolon
    clean_sql = remove_string_literals(sql_trimmed).rstrip(";")
    if ";" in clean_sql:
        return False, "Pemisah titik-koma (;) ganda tidak diizinkan untuk mencegah serangan stacked queries."

    # 3. Enforce that query starts with SELECT or WITH (Common Table Expressions)
    first_word_match = re.match(r"^\s*([a-zA-Z]+)", clean_sql)
    if not first_word_match:
        return False, "Format kueri SQL tidak valid."

    first_word = first_word_match.group(1).upper()
    if first_word not in {"SELECT", "WITH", "EXPLAIN", "DESCRIBE"}:
        return False, f"Operasi '{first_word}' tidak diizinkan. Hanya kueri SELECT atau WITH analitik yang diizinkan."

    # 4. Check against forbidden command keywords
    tokens = set(re.findall(r"\b[A-Z_]+\b", clean_sql.upper()))
    intersection = tokens.intersection(FORBIDDEN_KEYWORDS)
    if intersection:
        forbidden_word = sorted(list(intersection))[0]
        return False, f"Operasi '{forbidden_word}' tidak diizinkan demi menjaga integritas data klaim BPJS Kesehatan."

    # 5. Check against forbidden file-system and remote scan functions
    clean_lower = clean_sql.lower()
    for func in FORBIDDEN_FUNCTIONS:
        pattern = rf"\b{func}\s*\("
        if re.search(pattern, clean_lower):
            return False, f"Pemanggilan fungsi berkas '{func}()' tidak diizinkan untuk mencegah akses file sistem yang tidak sah."

    return True, None
