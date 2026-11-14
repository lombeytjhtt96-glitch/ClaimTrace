# CLAIMTRACE — MASTER SPECIFICATION & STITCH PLANNING SUITE
**Healthkathon 2026 BPJS Kesehatan · Tim TINEERENSE (MAN 1 Surakarta)**  
*Dokumen Arsitektur, Desain, dan Panduan Google Stitch Lengkap*

---

## Indeks Dokumen Proyek:

1. [**PRD.md (Product Requirements Document)**](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/docs/PRD.md):
   Dokumen persyaratan produk tingkat enterprise mencakup latar belakang kerugian Rp 34M, definisi sistem Decision Support System (DSS), aktor/persona, aturan fusi skor matematis ($S = 0.5 \cdot S_1 + 0.3 \cdot S_2 + 0.2 \cdot S_3$), kriteria ambang batas triage (Hijau/Kuning/Merah/Hard Trigger), dan kepatuhan hukum (UU PDP No. 27/2022 & Perpres 82/2018).

2. [**PRODUCT.md (Product Vision & Capabilities)**](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/docs/PRODUCT.md):
   Visi produk, diferensiasi pasar, arsitektur modul, dan nilai strategis ClaimTrace bagi operasional BPJS Kesehatan.

3. [**DESIGN.md (Design System Specification)**](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/docs/DESIGN.md):
   Spesifikasi visual komprehensif untuk Google Stitch, mencakup token palet warna resmi BPJS (`#01A65A`, `#0288D1`, `#0C4A60`), warna semantik triage risiko, tipografi Montserrat & Inter, grid layout 12-kolom, komponen atomik (*Triage Metric Cards, Evidence Matrix, Decision Console*), serta aturan micro-interactions.

4. [**STITCH_DESIGN_SYSTEM.md**](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/docs/STITCH_DESIGN_SYSTEM.md):
   Dokumentasi mendalam mengenai desain token, elevasi, dan komponen Stitch.

5. [**STITCH_PROMPTS.md (Google Stitch UI Prompts)**](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/docs/STITCH_PROMPTS.md):
   Prompt layar-demi-layar siap pakai untuk di-input langsung ke Google Stitch guna mendesain 5 layar utama.

6. [**ARCHITECTURE.md (Technical Architecture & Data Contracts)**](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/docs/ARCHITECTURE.md):
   Arsitektur teknis on-premise, diagram topologi sistem Mermaid, kontrak data JSON (`ClaimRecord`, `TriageEvaluation`, `PresenceVerificationRequest`, `AuditTrailLog`), serta mekanisme bus event sinkronisasi real-time antara Mobile JKN dan Web Dashboard.

7. [**ENTERPRISE_ARCHITECTURE_DOSSIER.md**](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/docs/ENTERPRISE_ARCHITECTURE_DOSSIER.md):
   Dossier arsitektur enterprise menyeluruh yang memetakan keamanan, integrasi data, dan ketahanan sistem.

8. [**DEPLOYMENT_GUIDE.md**](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/docs/DEPLOYMENT_GUIDE.md):
   Panduan lengkap deployment di lingkungan lokal, Docker, on-premise server, dan cloud hosting.

9. [**GLOSSARY.md**](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/docs/GLOSSARY.md):
   Glosarium istilah baku kedinasan jaminan kesehatan (FPK, VEDIKA, BAHV, BAKB, INA-CBG, DPJP, SEP, PRB).

10. [**SOP_VERIFIKATOR_MEDIS_BPJS.md**](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/docs/SOP_VERIFIKATOR_MEDIS_BPJS.md):
    Standar Operasional Prosedur bagi Verifikator Medis dan Wasrik dalam menelaah klaim berisiko.

11. [**testing/TEST_READY.md**](file:///home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/docs/testing/TEST_READY.md):
    Matriks kesiapan pengujian, cakupan uji unit, integrasi, dan E2E test.
