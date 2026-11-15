# CLAIMTRACE UI WIREFRAME & COMPONENT SPECIFICATIONS
## Project: ClaimTrace Verificator Suite (Healthkathon 2026)
**Target:** ClaimTrace Frontend UI Component Architecture  
**Output Format:** Screen-by-Screen UI Layout Specifications  

---

## Screen 1: Dashboard Overview & Triage Queue (Main Workspace)

### [LAYAR UI] Identitas Layar:
`claimtrace-triage-overview`

### [SPESIFIKASI] Deskripsi Tata Letak Antarmuka:
```text
Design a high-density, professional enterprise web dashboard for BPJS Kesehatan claim verification officers called "ClaimTrace: Evidence-First Pre-Payment Triage". 

The page background is dark slate (#020617) with clean card containers in #0F172A and subtle borders in #1E293B. Use typography 'Montserrat' for headings and 'Inter' for data tables.

Header Section:
- Top bar with BPJS Kesehatan logo, system title "ClaimTrace Triage Engine", live status badge with green pulsing dot "Live Pre-Payment Ingestion", and officer profile "dr. Siti Rahma (Kantor Cabang Surakarta)".
- Global search bar to filter by Hospital Name, SEP Number, or INA-CBG Code.

KPI Summary Cards (4 Columns):
1. Total Claims Ingested: "4,341 Claims" with subtitle "Healthkathon Synthetic Holdout Dataset".
2. Green Lane (Fast-Track): "3,892 (89.6%)" in emerald green badge, indicating legitimate claims cleared for payment.
3. Yellow Lane (Clarification): "364 (8.4%)" in amber badge, indicating administrative sync delays.
4. Red Lane (Audit Priority): "85 (2.0%)" in vibrant rose/red badge (#E11D48), indicating high-risk fraud clusters (#6 Phantom & #11 Repeat Billing).
- Right-aligned stat card: "Potential Risk Mitigated: Rp 1,530,000,000" with a small shield icon.

Main Section - Triage Queue Table:
- Filter tabs: [All Claims (4,341)], [Red Lane (85) - Active], [Yellow Lane (364)], [Green Lane (3,892)].
- Columns: Priority Rank, Claim ID, Healthcare Facility (Faskes), INA-CBG Code & Description, DPJP Doctor, S1 Pattern Score, S2 Provider Score, S3 Patient Score, Total Score (S), Action.
- Top row highlighted: Claim ID "#CLM-2026-085", Faskes "RS Khusus Mitra Husada", Code "Z-3-12-0 (Prosedur Fisioterapi / Rehab)", DPJP "dr. Hendra, Sp.KFR", S1: 85, S2: 95, S3: 80, Total Score: "87.0" with bold red badge "MERAH (HARD TRIGGER DPJP)".
- A button on the row: "Investigasi Berkas Bukti ->" that leads to the detail view.
```

---

## Screen 2: Evidence-First Case Investigation & 3-Layer Matrix

### [LAYAR UI] Identitas Layar:
`claimtrace-case-investigation`

### [SPESIFIKASI] Deskripsi Tata Letak Antarmuka:
```text
Design an in-depth case investigation view in dark theme (#020617) for BPJS claim verifiers investigating a high-risk claim cluster (#6 Phantom Billing).

Top Navigation:
- Breadcrumb: Triage Queue > RS Khusus Mitra Husada > Kasus #085-INA-CBG
- Case Summary Header: "RS Khusus Mitra Husada · 85 Klaim Fisioterapi (Z-3-12-0) Pasca-Baksos" with a prominent total score gauge on the right: "87.0 / 100" in large bold red text (#FB7185) with formula tag "0.5·S1 + 0.3·S2 + 0.2·S3".
- Compliance SLA countdown badge: "Batas Berita Acara: 7 Hari Tersisa (Pasal 76 ayat (2) Perpres 82/2018)".

The 3-Layer Evidence Matrix (3 Equal Cards Grid):
1. Layer 1 Card - Pattern Radar & Spatiotemporal Clumping (S1 = 85):
   - Emerald border accent.
   - Title: "Lapis 1: Radar Pola Penagihan".
   - Metrics: Volume Spike: "8.5x dari baseline harian", Clustered Window: "85 klaim diajukan dalam 48 jam", Episode Check: "Terdeteksi penagihan berulang pada episode fisioterapi tanpa jeda rujukan sah (#11 Repeat Billing)".
   - Small mini-chart showing a massive red bar spike on Oct 14-15 compared to normal flat days.

2. Layer 2 Card - Provider Trajectory & SATUSEHAT SDMK (S2 = 95):
   - Blue border accent with alert banner.
   - Title: "Lapis 2: Uji Jejak Layanan & DPJP".
   - Status: "HARD-TRIGGER AKTIF: Surat Izin Praktik (SIP) DPJP Kedaluwarsa".
   - Details: DPJP tertera dr. Hendra, Sp.KFR (SIP 446.1/108/DPJP/2023) tercatat telah mutasi dan tidak aktif bertugas di RS Khusus Mitra Husada pada 14 Oktober 2026 menurut data federasi SATUSEHAT SDMK Kemenkes.
   - Doctor Capacity check: "Terbaca 85 tindakan per hari (Kapasitas wajar dokter: maks 30-40 pasien/hari)".

3. Layer 3 Card - Patient Presence Confirmation (S3 = 80 -> 92):
   - Amber/Red border accent.
   - Title: "Lapis 3: Konfirmasi Peserta via Mobile JKN".
   - Status: "8 dari 10 Peserta Sampel MENYANGKAL Menerima Layanan".
   - Visual percentage bar showing 80% red (Disangkal) and 20% grey (Belum respon).
   - Real-time sync badge: "Tersambung langsung ke notifikasi Mobile JKN peserta".
   - Subtitle: "Data Minimization Enforced: Tidak membuka diagnosis rahasia (Sesuai UU PDP No. 27/2022)".
```

---

## Screen 3: Graph Network Cluster Visualizer (Entity Relationship)

### [LAYAR UI] Identitas Layar:
`claimtrace-graph-visualizer`

### [SPESIFIKASI] Deskripsi Tata Letak Antarmuka:
```text
Design an interactive Graph Network Topology view for fraud investigation inside ClaimTrace.

Canvas Area:
- Dark canvas background with subtle grid lines.
- Center Node: "RS Khusus Mitra Husada" (Hospital icon, large purple node).
- Connected Provider Node: "dr. Hendra, Sp.KFR (DPJP)" connected with a dashed red line labeled "SIP Inactive on Service Date (SATUSEHAT)".
- Connected Event Node: "Baksos Kesehatan Massal (12 Okt 2026)" connected with amber line.
- Cluster of Patient Nodes: 85 circular nodes representing patients.
  - 8 nodes highlighted in bright red with cross icon labeled "Peserta Menyangkal Hadir (Mobile JKN Response)".
  - Other nodes in grey/amber pending verification.
- Connected Procedure Node: "Z-3-12-0 (Fisioterapi Massal)".

Legend & Controls:
- Floating toolbar on top right: [Zoom In], [Zoom Out], [Filter Inactive Nodes], [Export Graph Image].
- Graph Insights Drawer on the right: Explains the topology anomaly: "Bipartite cluster anomaly detected: 85 patients linked to a mass charity event were simultaneously billed for specialized hospital rehabilitation under an inactive physician ID."
```

---

## Screen 4: Human-in-the-Loop Verificator Decision & Audit Trail

### [LAYAR UI] Identitas Layar:
`claimtrace-decision-console`

### [SPESIFIKASI] Deskripsi Tata Letak Antarmuka:
```text
Design a decision modal and tamper-evident audit trail console for BPJS claim verification officers.

Main Action Card:
- Header: "Konsol Keputusan Telaah Pra-Bayar (Human-in-the-Loop)" with an info pill "Sesuai Standar Operasional Prosedur Verifikasi Klaim BPJS Kesehatan".
- Summary recommendation box: "Berdasarkan fusi skor 87.0/100 (Jalur Merah) dengan pelanggaran legitimasi DPJP dan penyangkalan peserta, sistem merekomendasikan Penundaan Berita Acara Kelengkapan Berkas untuk klarifikasi faskes."
- 4 Clear Action Buttons:
  1. Primary Button (Red): "[TUNDA] Tunda Berita Acara & Minta Klarifikasi Faskes (SOP 10 Hari)"
  2. Secondary Button (Amber): "[AUDIT] Jadwalkan Uji Petik Lapangan / VPK"
  3. Neutral Button (Grey): "[OVERRIDE] Loloskan Klaim (Override Manual dengan Catatan Khusus)"
  4. Utility Button: "[CETAK] Cetak Berkas Telaah Siap-Audit (Format PDF Resmi)"

Audit Trail Section (Bottom Panel):
- Monospace font block showing cryptographic tamper-evident signing:
  - Timestamp: "2026-10-22T10:45:12.891+07:00"
  - Officer ID: "VERIF-SKR-0412 (dr. Siti Rahma)"
  - Decision Hash: "SHA-256: 9e8a7c2b512f43a91e0892cfa71290bb34102c98d7831fa281"
  - Digital Signature Status: "VERIFIED ON-PREMISE KEYSTORE"
  - Juridical Notice: "Catatan ini berkekuatan hukum untuk dasar administratif penundaan pembayaran klaim fasilitas kesehatan."
```

---

## Screen 5: Split-Sync Unified Presentation Layout

### [LAYAR UI] Identitas Layar:
`claimtrace-split-sync-suite`

### [SPESIFIKASI] Deskripsi Tata Letak Antarmuka:
```text
Design the ultimate hackathon presentation view combining two synchronized devices on one widescreen (16:9 1920x1080):

Left Viewport (40% width):
- Realistic modern smartphone frame (black titanium bezel, dynamic island, rounded corners) displaying the Mobile JKN app client.
- Shows the top header gradient (#018849 to #0288D1), "Hi, KHALAF", "v4.18.0", and a slide-down push notification: "Konfirmasi Presensi Layanan: Fisioterapi di RS Mitra Husada".
- A bottom sheet modal displaying the binary question: "Apakah Anda benar hadir dan menerima tindakan medis tersebut?" with two prominent buttons: [TOLAK: Tidak Pernah] and [KONFIRMASI: Ya, Saya Hadir].

Right Viewport (60% width):
- The ClaimTrace Verificator Dashboard running in real-time.
- Shows the Active Case #085-INA-CBG, the 3-Layer Evidence Matrix, and the Total Score Gauge.
- A glowing visual connection beam / arrow labeled "Live Reactive Bridge (Sub-second Sync)" showing that when the user taps [Tidak Pernah] on the phone on the left, the Layer 3 score on the right instantly jumps from 80 to 92 and the overall gauge turns flashing red 87.0!

Top Global Control Bar:
- Badges: "BPJS Healthkathon 2026 Finalist Prototype", "Team TINEERENSE", [View Mode Toggle: Split-Sync / Mobile Only / Dashboard Only], and a button [SIMULASI ANOMALI: Trigger Anomaly Simulation].
```
