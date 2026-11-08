# Model Arsitektur Sistem ClaimTrace DSS (Draw.io Architecture Studio)

Dokumen ini memuat model arsitektur sistem resmi **ClaimTrace DSS** yang dihasilkan menggunakan toolchain **drawio-skill** (Agents365-ai). Seluruh diagram bersifat *maintainable*, terstruktur dalam format Diagram IR v1, dan dapat diedit secara langsung menggunakan draw.io / diagrams.net.

---

## Berkas Arsitektur yang Dihasilkan

1. **`claimtrace_architecture.ir.json`**
   - Model representasi menengah kanonik (*Diagram IR v1*) yang memetakan seluruh komponen:
     - **Client Tier**: Web Verifier Portal, Mobile JKN Screen, Whistleblowing System (WBS).
     - **Gateway Tier**: FastAPI Ingress, Internet2 Grouper RBAC, Rate Limiter.
     - **Intelligence Core**: Triangulation Engine (S1, S2, S3), AI Anomaly Detector (XGBoost/RF), ChromaDB Vector DB.
     - **Analytics & Storage**: DuckDB OLAP (1.7M Klaim BPJS) dengan Firewall `sql_guard.py`, REA Graph, Claims State Store.
     - **Audit & Governance**: SHA-256 Tamper-Evident Audit Ledger & Decision Receipts.

2. **`claimtrace_architecture.drawio`**
   - Diagram arsitektur visual native draw.io (14 nodes, 15 edges) dengan layout optimal.
   - **Skor Validasi Geometri**: 0 error, 0 warning, 0 edge-through-vertex, 0 collisions.
   - Dapat dibuka dan diedit di aplikasi desktop [draw.io](https://app.diagrams.net/).

3. **`claimtrace_multiview.drawio`**
   - Model proyeksi multi-sudut pandang dalam satu berkas multi-halaman:
     - **Halaman 1 (Executive)**: Ringkasan tingkat tinggi untuk dewan pengawas dan juri.
     - **Halaman 2 (System)**: Topologi sistem lengkap antar-komponen mikroservis.
     - **Halaman 3 (Security)**: Peta zona batas kepercayaan (*trust boundaries*), RBAC, dan filter keamanan.
     - **Halaman 4 (Dataflow)**: Alur transmisi data dari pelaporan faskes hingga segel blok audit.

4. **`claimtrace_walkthrough.html`**
   - Panduan interaktif visual mandiri (*self-contained & offline*) yang dapat dibuka di peramban apa pun.
   - Mendukung fitur pencarian komponen, pan/zoom, dan inspeksi metadata setiap subsistem ClaimTrace.

5. **`impact_satusehat_failure.json`**
   - Laporan simulasi kegagalan (*what-if failure analysis*) menguji ketahanan sistem saat layanan eksternal Kemenkes SATUSEHAT mengalami disrupsi.
