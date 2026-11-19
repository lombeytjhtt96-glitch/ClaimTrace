# ClaimTrace JKN — Submission & Presentation Materials
**BPJS Kesehatan Healthkathon 2026** · Tim TINEERENSE (MAN 1 Surakarta)

Folder ini berisi seluruh artefak pendaftaran, proposal, materi presentasi (deck), dan skrip rekaman video demo:

```text
submissions/
└── healthkathon/
    ├── assets/                                     # Tangkapan layar UI live & grafik HKEval / Coaching
    ├── deck/
    │   ├── TINEERENSE.pdf                          # Deck Final Resmi 20 Besar (8 Slide Canva, <= 15 MB)
    │   ├── deck_data.py                            # Single-source-of-truth metrik & konten presentasi
    │   ├── build_charts.py                         # Generator grafik HKEval, Before-After, & TCO
    │   ├── build_final_deck.py                     # Generator PPTX cadangan berbasis python-pptx
    │   └── export_final_deck_to_pdf.py             # Konverter PDF cadangan berbasis Chromium
    ├── proposal/
    │   ├── RINGKASAN_EKSEKUTIF_PROPOSAL_HEALTHKATHON.md
    │   ├── ClaimTrace_Mentoring_Coaching_Dossier_Final.md
    │   ├── METADATA_SUBMISI_HEALTHKATHON.txt
    │   ├── healthkathon_logo.png
    │   └── SUBMISSION_HEALTHKATHON_2026_TINEERENSE.zip
    └── demo_video/
        ├── PANDUAN_RECORDING_VIDEO_DEMO.md         # Panduan & naskah video final 6 bagian (<= 10 menit, 8 slide)
        └── ClaimTrace_Official_3Min_YouTube_Demo_Script.md
```


## Demo Video Recordings, Screenshots & Historical Archives

- `submissions/healthkathon/demo_video/recordings/ClaimTrace_Live_Demo_Recording.webm` — Rekaman live demo antarmuka ClaimTrace (`48 MB`).
- `submissions/healthkathon/demo_video/slide_screenshots/` — 4 tangkapan layar terbaru UI live (`1_dashboard_eksekutif.png`, `2_telaah_4lapis_klinis.png`, `3_cek_7dokumen_icd10.png`, `4_laporan_bahv_sha256.png`).
- `submissions/healthkathon/demo_video/demo_script_dan_koreksi_3_menit.md` — Naskah presenter 3 menit tersinkronisasi dengan rekaman demo.
- `submissions/archive/` — Arsip dokumen proposal, presentasi, pengembangan bertahap, serta dossier & project final Healthkathon 2026 (`submissions/archive/healthkathon_guides/`).
- `archive/legacy_v1/` — Arsip prototipe awal Next.js/FastAPI (`v1`), skrip Neo4j (`claimtrace_neo4j_syndicate.cypher`), dokumen desain awal, dan custom engineering skills (tanpa `node_modules`, `.next`, `.env*`, `*.duckdb*`, atau data mentah `bpjs_sample_2025`).
