# CLAIMTRACE — MASTER SPECIFICATION & ARCHITECTURE SUITE
**Healthkathon 2026 BPJS Kesehatan · Tim TINEERENSE (MAN 1 Surakarta)**  
*Dokumen Arsitektur, Desain Antarmuka, dan Spesifikasi Teknis Lengkap*

---

## Indeks Dokumen Proyek:

1. [**PRD.md (Product Requirements Document)**](PRD.md):
   Dokumen persyaratan produk tingkat enterprise mencakup latar belakang kerugian Rp 34M, definisi sistem Decision Support System (DSS), aktor/persona, aturan fusi skor matematis ($S = 0.5 \cdot S_1 + 0.3 \cdot S_2 + 0.2 \cdot S_3$), kriteria ambang batas triage (Hijau/Kuning/Merah/Hard Trigger), dan kepatuhan hukum (UU PDP No. 27/2022 & Perpres 82/2018).

2. [**PRODUCT.md (Product Vision & Capabilities)**](PRODUCT.md):
   Visi produk, diferensiasi pasar, arsitektur modul, dan nilai strategis ClaimTrace bagi operasional BPJS Kesehatan.

3. [**DESIGN.md (Design System Specification)**](DESIGN.md):
   Spesifikasi sistem desain *Clinical Precision* ClaimTrace JKN, mencakup kanvas terang default (`#F7F8FA` / `#FFFFFF`), mode gelap opsional (`#090B0E`), token semantik triase (Hijau/Kuning/Merah), serta tipografi `Geist`, `Inter`, `Geist Mono`, dan `IBM Plex Serif`.

4. [**UI_DESIGN_SYSTEM_SPEC.md**](UI_DESIGN_SYSTEM_SPEC.md):
   Dokumentasi mendalam mengenai desain token, elevasi, dan komponen antarmuka klinis.

5. [**UI_WIREFRAME_PROMPTS.md (UI Screen Specifications)**](UI_WIREFRAME_PROMPTS.md):
   Spesifikasi layar antarmuka terfokus pada 3 kelompok navigasi utama (Alur Kerja Utama, Alat Investigasi, serta Laporan & Audit).

6. [**ARCHITECTURE.md (Technical Architecture & Data Contracts)**](ARCHITECTURE.md):
   Arsitektur teknis on-premise, diagram topologi sistem Mermaid, kontrak data JSON (`ClaimRecord`, `TriageEvaluation`, `PresenceVerificationRequest`, `AuditTrailLog`), serta mekanisme bus event sinkronisasi real-time antara Mobile JKN dan Web Dashboard.

7. [**ENTERPRISE_ARCHITECTURE_DOSSIER.md**](ENTERPRISE_ARCHITECTURE_DOSSIER.md):
   Dossier arsitektur enterprise menyeluruh yang memetakan keamanan, integrasi data, dan ketahanan sistem.

8. [**DEPLOYMENT_GUIDE.md**](DEPLOYMENT_GUIDE.md):
   Panduan lengkap deployment di lingkungan lokal, Docker, on-premise server, dan cloud hosting.

9. [**GLOSSARY.md**](GLOSSARY.md):
   Glosarium istilah baku kedinasan jaminan kesehatan (FPK, VEDIKA, BAHV, BAKB, INA-CBG, DPJP, SEP, PRB).

10. [**SOP_VERIFIKATOR_MEDIS_BPJS.md**](SOP_VERIFIKATOR_MEDIS_BPJS.md):
    Standar Operasional Prosedur bagi Verifikator Medis dan Wasrik dalam menelaah klaim berisiko.

11. [**testing/TEST_READY.md**](testing/TEST_READY.md):
    Matriks kesiapan pengujian, cakupan uji unit, integrasi, dan E2E test.
