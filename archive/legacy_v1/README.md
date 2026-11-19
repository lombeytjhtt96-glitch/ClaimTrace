# ClaimTrace Legacy v1 Prototype Archive

Arsip kode sumber prototipe awal ClaimTrace (`Next.js` App Router + `FastAPI` v1 + Neo4j syndicate graph script).

## Catatan Arsip & Eksklusi
- Dependensi & cache build (`frontend/node_modules/`, `frontend/.next/`, `tsconfig.tsbuildinfo`, `__pycache__/`, `.pytest_cache/`, `test-results/`) dikecualikan agar repositori tetap ringan.
- Rahasia & kredensial lokal (`backend/.env`, `backend/.env.local`) dikecualikan demi keamanan repositori publik.
- Dataset `master_icd_x.json` (SHA-256 `78e5f7a52d4de330`, identik dengan `v1`) sudah dilacak di `../../backend/data/master_icd_x.json`.
- Data mentah BPJS (`bpjs_sample_2025/`) dan warehouse DuckDB (`claimtrace_warehouse.duckdb*`) melebihi batas ukuran file GitHub 100 MB sehingga tetap disimpan secara lokal / eksternal.
- Skrip graf sindikat Neo4j disimpan di `claimtrace_neo4j_syndicate.cypher`.
