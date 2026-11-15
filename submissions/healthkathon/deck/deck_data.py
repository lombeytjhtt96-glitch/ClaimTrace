"""Single-source-of-truth slide content, palette tokens, and antislop validators
for ClaimTrace JKN Final Deck (HealthKathon BPJS Kesehatan 2026).

Both build_final_deck.py (.pptx) and export_final_deck_to_pdf.py (.pdf) import
ALL copy, numbers, asset mappings, and design tokens from this module to guarantee
100% content and structural parity.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[1]
ASSETS_DIR = ROOT_DIR / "assets"
CHARTS_DIR = ASSETS_DIR / "charts"
DECK_DIR = Path(__file__).resolve().parent

# Clinical Precision palette from DESIGN.md
PALETTE = {
    "navy": "#061B31",
    "navy_card": "#0D2742",
    "navy_border": "#1E3A5F",
    "canvas": "#F7F8FA",
    "surface": "#FFFFFF",
    "inset": "#F3F5F8",
    "ink": "#061B31",
    "ink_secondary": "#475569",
    "muted": "#64748B",
    "hairline": "#E2E8F0",
    "emerald": "#00733B",
    "emerald_dark": "#047857",
    "emerald_soft": "#ECFDF5",
    "emerald_border": "#A7F3D0",
    "emerald_bright": "#34D399",
    "merah": "#BE123C",
    "merah_soft": "#FFF1F2",
    "merah_border": "#FECDD3",
    "kuning": "#B45309",
    "kuning_soft": "#FFFBEB",
    "kuning_border": "#FDE68A",
    "white": "#FFFFFF",
}

FONT_FAMILY = "Lato"

# Forbidden tokens per guidelines & antislop R-02/terminology rules
BANNED_SUBSTRINGS = (
    "\u2014",  # em-dash
    "\u2013",  # en-dash
    "\u2022",  # literal bullet character in PPTX strings
    "DuckDB",
    "duckdb",
    "Gemini",
    "gemini",
    "Claude",
    "OpenAI",
)

EMOJI_PATTERN = re.compile(
    "["
    "\U0001F300-\U0001F9FF"
    "\U00002600-\U000027BF"
    "\U0001FA00-\U0001FAFF"
    "]+",
    flags=re.UNICODE,
)


def assert_clean_text(text: str, location: str = "slide") -> None:
    """Raise ValueError if any string violates antislop or terminology policy."""
    for token in BANNED_SUBSTRINGS:
        if token in text:
            raise ValueError(
                f"Forbidden substring {token!r} found at {location}: {text!r}"
            )
    if " - " in text:
        raise ValueError(
            f"Spaced hyphen ' - ' found (use ':' or '|' instead) at {location}: {text!r}"
        )
    if EMOJI_PATTERN.search(text):
        raise ValueError(f"Emoji character found at {location}: {text!r}")


def validate_data_tree(obj: Any, path: str = "SLIDES") -> None:
    """Recursively validate every string in the slide specification."""
    if isinstance(obj, str):
        assert_clean_text(obj, path)
    elif isinstance(obj, dict):
        for k, v in obj.items():
            validate_data_tree(v, f"{path}.{k}")
    elif isinstance(obj, (list, tuple)):
        for i, item in enumerate(obj):
            validate_data_tree(item, f"{path}[{i}]")


DECK_META = {
    "title": "ClaimTrace JKN: Final Project HealthKathon BPJS Kesehatan 2026",
    "team": "Tim TINEERENSE",
    "institution": "MAN 1 Surakarta",
    "category": "Inovation (Mahasiswa / Umum)",
    "date": "15 November 2026",
    "live_url": "https://claimtrace-healthkathon.vercel.app",
    "repo_url": "https://github.com/Khalaf-Dev/claimtrace-jkn",
    "submission_email": "hackathonbpjs@bpjs-kesehatan.go.id",
    "slide_count": 12,
}

# Exact 12-slide content mapped 1:1 to Panduan 20 Besar Healthkathon 2026
SLIDES: list[dict[str, Any]] = [
    # ------------------------------------------------------------------ SLIDE 1
    {
        "id": "cover",
        "layout": "cover",
        "section": "FINAL PROJECT PRESENTATION | HEALTHKATHON BPJS KESEHATAN 2026",
        "title": "ClaimTrace JKN",
        "subtitle": (
            "Sistem Pra-Adjudikasi & Triangulasi Kecurangan Klaim FKRTL 4-Lapis On-Premise "
            "untuk Mitigasi Phantom Billing (#6) dan Repeat Billing (#11)"
        ),
        "pills": [
            "Sidecar BEA C03.04",
            "On-Premise UU PDP 27/2022",
            "Precision@50: 86,0% (Lift 43,0x)",
            "Rp 0 Biaya API Eksternal",
        ],
        "meta_items": [
            ("TIM", "TINEERENSE"),
            ("ASAL", "MAN 1 Surakarta"),
            ("KATEGORI", "Inovation | Final 20 Besar"),
            ("TANGGAL", "15 November 2026"),
        ],
        "preview_image": "ui_dashboard_light.png",
        "preview_caption": "Tangkapan Layar Live Kokpit Nasional (Versi 15 Nov 2026)",
        "preview_kpis": [
            ("1.699.219", "Klaim FKRTL Diaudit"),
            ("Rp 34,66 M", "Eksposur Anomali Awal"),
            ("< 15 ms", "Latensi Core On-Premise"),
            ("96,8%", "Rupiah Recall@100"),
        ],
    },
    # ------------------------------------------------------------------ SLIDE 2
    {
        "id": "sec1_team_problem",
        "layout": "team_problem",
        "section": "01 | PERKENALAN TIM & MASALAH NYATA DJS (1 MENIT)",
        "title": "Tim TINEERENSE Mengawal Keberlanjutan DJS dari Kebocoran Klaim FKRTL",
        "subtitle": (
            "Menjawab tantangan verifikasi manual 4,5 juta+ klaim per bulan bagi 284,38 juta peserta JKN."
        ),
        "team_card": {
            "heading": "Profil Tim TINEERENSE (MAN 1 Surakarta)",
            "items": [
                "Fokus Tim: Rekayasa AI Kesehatan, Arsitektur Data SQL In-Memory, & Tata Kelola JKN.",
                "Komitmen Kode & Riset: Pengembangan penuh dari pra-seleksi, coaching mentor, hingga sistem produksi.",
                "Misi Solusi: Memperkuat Verifikator BPJS tanpa memperlambat hak pencairan RS yang patuh.",
            ],
        },
        "problem_card": {
            "heading": "Mengapa Verifikasi FKRTL Saat Ini Kewalahan?",
            "items": [
                "Skala masif 4,5 Jt+ klaim FKRTL/bulan memaksa antrean C03 bergantung pada pemeriksaan manual & sampling acak.",
                "RS jujur ikut tertunda pencairannya (S06), sedangkan modus #6 Phantom Billing & #11 Repeat Billing menyelinap lolos.",
                "Dari audit 6.264.346 baris sampel BPJS ditemukan Rp 34,66 Miliar potensi pemborosan tersembunyi.",
            ],
        },
        "kpis": [
            ("6.264.346", "Total Baris Data Sampel BPJS"),
            ("1.699.219", "Klaim FKRTL | Rp 1,536 Triliun"),
            ("2.091 RS", "496 Kab/Kota | 38 Provinsi"),
            ("Rp 34,66 M", "Eksposur Anomali Teridentifikasi"),
        ],
        "anomaly_table": {
            "heading": "Peta Anomali Terverifikasi dari Gudang Data Analitik SQL On-Premise",
            "headers": ["Kategori Anomali JKN", "Volume Temuan", "Nilai Eksposur", "Keterangan Teknis"],
            "rows": [
                ["Koreksi Tarif INA-CBG", "1.631 klaim", "Rp 2,07 Miliar", "Deviasi tarif riil vs klaim tagihan"],
                ["Klaim Ganda Lintas RS (#11)", "2.584 pasang", "Rp 19,26 Miliar", "NIK & episode bertumpuk antar FKRTL"],
                ["Klaim Ganda Intra RS (#11)", "2.292 pasang", "Rp 13,33 Miliar", "Total 4.876 pasang / 9.555 berkas"],
                ["Dimensi Klinis Master", "2.590.751 peserta", "1.967.670 diag sek.", "Cakupan 6.706 kode ICD-10 aktif"],
            ],
        },
    },
    # ------------------------------------------------------------------ SLIDE 3
    {
        "id": "sec2a_coaching_matrix",
        "layout": "table_focus",
        "section": "02A | PERUBAHAN SETELAH COACHING (2 MENIT)",
        "title": "Lima Transformasi Inti Hasil Masukan Mentor HealthKathon 2026",
        "subtitle": (
            "Setiap masukan sesi mentoring diterjemahkan menjadi kode produksi dan diverifikasi dengan bukti terukur per 15 Nov 2026."
        ),
        "headers": [
            "Fokus Evaluasi",
            "Masukan Mentor Coaching",
            "Tindakan Implementasi Nyata",
            "Hasil & Bukti Terukur",
        ],
        "rows": [
            [
                "1. Penyelarasan BEA",
                "Petakan posisi ClaimTrace di proses resmi BEA (C01-S06), jangan mengganti VClaim.",
                "Menempatkan ClaimTrace sebagai sidecar C03.04 antara C03 & S06, mendampingi Smart Vedika/VIDI.",
                "Tab Arsitektur BEA live; zero perubahan skema VClaim; 3 jalur SLA <= 10 HK.",
            ],
            [
                "2. Kedaulatan Data AI",
                "Hilangkan ketergantungan API LLM cloud asing demi kepatuhan UU PDP & biaya nasional.",
                "Migrasi penuh ke 3 model ML (.pkl), Rule Engine, & Clinical NLP (all-MiniLM-L6-v2) on-premise.",
                "Latensi 11,90 ms API live (< 15 ms core), HTTP 200, Rp 0 biaya token/API.",
            ],
            [
                "3. Lapis 4 & RS Jujur",
                "Perkuat verifikasi dokumen RS & lindungi terapi kronis sah (mis. hemodialisis) dari blokir.",
                "Tambah Cek Dokumen RME-TTE, integrasi FRISTA, dan 5 aturan proteksi FairGuard Z49.1.",
                "0,0% FPR across 512 hard-negative; uji Z49.1 lolos Hijau (Skor 43,5).",
            ],
            [
                "4. Kontrol Akses & Hukum",
                "Sertakan otentikasi ketat dan luaran berita acara resmi yang kuat secara hukum.",
                "Bangun Auth 4-field Fail-Closed + MFA + reCAPTCHA, Konsol Putusan 2-Tier, & BAHV QR.",
                "14 rantai audit aktif valid; BAHV kolektif bersegel QR + checksum SHA-256.",
            ],
            [
                "5. UI Klinis & Regresi",
                "Sederhanakan antarmuka padat agar efisien bagi Verifikator dan teruji menyeluruh.",
                "Refaktor 9 modul bertema Clinical Precision (termasuk Cek Dokumen & Peringkat Risiko).",
                "299 uji backend lolos, 189 endpoint API, 112 skenario E2E, & 16/16 stack OK.",
            ],
        ],
    },
    # ------------------------------------------------------------------ SLIDE 4
    {
        "id": "sec2b_before_after",
        "layout": "before_after",
        "section": "02B | SEBELUM VS SESUDAH COACHING (2 MENIT)",
        "title": "Lonjakan Kesiapan Produksi: Latensi 11,90 ms, 0,0% FPR, & Auth Fail-Closed",
        "subtitle": (
            "Perbandingan langsung kondisi prototipe Oktober vs rilis final on-premise 15 November 2026."
        ),
        "chart_image": "chart_coaching_before_after.png",
        "evidence_cards": [
            {
                "image": "ui_settings_probe.png",
                "badge": "BUKTI LIVE PROBE API",
                "title": "POST /api/v1/verify: HTTP 200 | 11,90 ms",
                "caption": "Model .pkl startup SIAP, FairGuard Z49.1 AKTIF, Local Deterministic Engine.",
            },
            {
                "image": "ui_auth_login_light.png",
                "badge": "BUKTI KEAMANAN RILIS",
                "title": "Fail-Closed 4-Field Auth + 3-Stage MFA",
                "caption": "Validasi NIP, Email @bpjs.go.id, Kode KC/Faskes, Password & reCAPTCHA.",
            },
        ],
    },
    # ------------------------------------------------------------------ SLIDE 5
    {
        "id": "sec3_solution_flow",
        "layout": "solution_flow",
        "section": "03 | RINGKASAN SOLUSI & ALUR END-TO-END (1 MENIT)",
        "title": "Triangulasi 4-Lapis On-Premise Memutus Antrean Manual C03 Menuju S06",
        "subtitle": (
            "Arsitektur sidecar C03.04 menyaring 100% klaim masuk sebelum membebani Verifikator manusia."
        ),
        "diagram_image": "diagram_architecture_flow.png",
        "bottom_cards": [
            {
                "title": "Formula Risiko Transparan (scoring.py)",
                "accent": "#00733B",
                "lines": [
                    "Skor Komposit S = 0,50*S1 (Riwayat) + 0,30*S2 (Koherensi Klinis) + 0,20*S3 (Jejaring).",
                    "Hard Trigger SIP EXPIRED memicu Jalur MERAH otomatis tanpa menunggu antrean.",
                    "Status UNSYNCED dialihkan aman ke Jalur KUNING untuk validasi dokumen faskes.",
                ],
            },
            {
                "title": "6-Tahap Pipa Inference On-Premise",
                "accent": "#061B31",
                "lines": [
                    "JSON VClaim diterima POST /api/v1/verify dengan pengecekan skema dan hash integritas.",
                    "3 model ML + aturan deterministik + Clinical NLP all-MiniLM-L6-v2 berjalan lokal (< 15 ms).",
                    "Penjaga FairGuard mengembalikan skor aman apabila pasien tervalidasi terapi rutin (Z49.1).",
                ],
            },
            {
                "title": "Kepatuhan Hukum & Privasi Nasional",
                "accent": "#047857",
                "lines": [
                    "Kepatuhan penuh UU PDP No. 27/2022 & Perpres No. 82/2018: nol transmisi NIK ke cloud.",
                    "Rantai audit kriptografis mencatat setiap skor, alasan SHAP, & override Verifikator.",
                    "Beroperasi berdampingan dengan VClaim dan Smart Vedika / VIDI tanpa ubah tabel inti.",
                ],
            },
        ],
    },
    # ------------------------------------------------------------------ SLIDE 6
    {
        "id": "sec4_demo_1",
        "layout": "demo_dual",
        "section": "04 | DEMO PRODUK LIVE (1/4): KOKPIT & ANTREAN FAIRGUARD",
        "title": "Pemantauan Nasional 1,69 Jt Klaim & Uji Live FairGuard Jalur Hijau Z49.1",
        "subtitle": (
            "Kokpit Eksekutif memetakan eksposur nasional sekaligus memastikan terapi rutin sah lolos tanpa hambatan."
        ),
        "panels": [
            {
                "badge": "MODUL 1: KOKPIT EKSEKUTIF",
                "image": "ui_dashboard_light.png",
                "title": "Kokpit Pemantauan Nasional (Clinical Precision UI)",
                "points": [
                    "Mengagregasi 1.699.219 klaim FKRTL senilai Rp 1,536 T di 2.091 RS dengan SLA 99,9%.",
                    "Proporsi 1.699.219 berkas: Risiko Rendah 88,5% (1.503.675), Sedang 9,0%, Tinggi 1,9%, Kritis 0,6%.",
                ],
            },
            {
                "badge": "MODUL 2: ANTREAN & UJI FAIRGUARD",
                "image": "ui_queue_verify_modal.png",
                "title": "Verifikasi Real-Time Kasus Hemodialisis Z49.1",
                "points": [
                    "Simulasi uji langsung via POST /api/v1/verify menghasilkan HTTP 200 dalam 21,9 ms.",
                    "FairGuard melindungi kasus kronis sah menjadi JALUR HIJAU (Skor 43,5) -> CLEARED_FOR_S06.",
                ],
            },
        ],
    },
    # ------------------------------------------------------------------ SLIDE 7
    {
        "id": "sec4_demo_2",
        "layout": "demo_dual",
        "section": "04 | DEMO PRODUK LIVE (2/4): MODUL BARU PASCA-COACHING",
        "title": "Cek Dokumen RME-TTE PMK 26/2021 & Peringkat Risiko 2.091 Faskes",
        "subtitle": (
            "Dua modul baru pasca-coaching untuk menjembatani verifikasi administrasi FKRTL dan prioritisasi audit KC."
        ),
        "panels": [
            {
                "badge": "MODUL BARU 3: CEK DOKUMEN RS",
                "image": "ui_doc_checker.png",
                "title": "Validasi Digital RME-TTE & Hash SHA-256",
                "points": [
                    "Memindai kelengkapan berkas PMK 26/2021 (contoh CLM-2026-8801 deteksi DOC-SURG-002).",
                    "Mencegat klaim fiktif (#6 Phantom Billing) sebelum antrean pra-adjudikasi menumpuk.",
                ],
            },
            {
                "badge": "MODUL BARU 4: PERINGKAT RISIKO RS",
                "image": "ui_fraud_ranking.png",
                "title": "Prioritisasi 10 Faskes Risiko Tertinggi",
                "points": [
                    "Menghitung indeks risiko komposit & eksposur rupiah (contoh RS Medika Prima: 92,4 | Rp 42,6 M).",
                    "Membantu Verifikator KC mengarahkan audit tepat sasaran dan mengurangi pemeriksaan RS jujur.",
                ],
            },
        ],
    },
    # ------------------------------------------------------------------ SLIDE 8
    {
        "id": "sec4_demo_3",
        "layout": "demo_trio_mobile",
        "section": "04 | DEMO PRODUK LIVE (3/4): FORENSIK 4-LAPIS & MOBILE COCKPIT",
        "title": "Bedah Saring 4-Lapis, Audit Upcoding INA-CBG & Kokpit Verifikator Mobile",
        "subtitle": (
            "Inspeksi menyeluruh mulai dari bukti biometrik FRISTA, deviasi kode INA-CBG, hingga inspeksi lapangan."
        ),
        "left_panels": [
            {
                "badge": "MODUL 5: TELAAH KASUS 4-LAPIS",
                "image": "ui_investigation_4layer.png",
                "title": "Quad-Triangulation & Verifikasi 2-Lapis",
                "points": [
                    "Memadukan jejak klaim ganda, biometrik FRISTA, e-Dossier RME, & validitas SIP DPJP.",
                    "Memberikan ringkasan bukti klinis & penjelasan SHAP terstruktur bagi penelaah.",
                ],
            },
            {
                "badge": "MODUL 6: SUITE FORENSIK LANJUTAN",
                "image": "ui_forensik_suite.png",
                "title": "Deteksi Upcoding INA-CBG & Clinical NLP",
                "points": [
                    "Mengidentifikasi eskalasi tarif mencurigakan (K-4-17-III -> K-4-17-I, Rp 11.650.000).",
                    "Didukung semantic matching all-MiniLM-L6-v2 on-premise tanpa koneksi internet.",
                ],
            },
        ],
        "mobile_panel": {
            "badge": "RESPONSIVE COCKPIT",
            "image": "ui_mobile_cockpit.png",
            "title": "Kokpit Mobile",
            "caption": "Tata letak responsif 390px untuk tinjauan cepat Verifikator di fasilitas kesehatan.",
        },
    },
    # ------------------------------------------------------------------ SLIDE 9
    {
        "id": "sec4_demo_4",
        "layout": "demo_dual",
        "section": "04 | DEMO PRODUK LIVE (4/4): PUTUSAN 2-TIER & BAHV QR",
        "title": "Konsol Putusan 2-Tier Human-in-the-Loop & Berita Acara Resmi BAHV QR",
        "subtitle": (
            "Keputusan hukum final tetap berada di tangan Verifikator dan Dokter Penelaah Senior BPJS Kesehatan."
        ),
        "panels": [
            {
                "badge": "MODUL 7: KONSOL PUTUSAN",
                "image": "ui_decision_console.png",
                "title": "Eskalasi Tier 1 -> Tier 2 & 4 Disposisi Baku",
                "points": [
                    "Kasus Skor 87,0 (Jalur MERAH) wajib melewati peninjauan Tier 2 Dokter Penelaah Senior.",
                    "Empat disposisi standar (Setujui, Pending Dokumen, Tolak Sebagian, Tolak Penuh) siap BSrE.",
                ],
            },
            {
                "badge": "MODUL 8: LAPORAN RESMI BAHV",
                "image": "ui_official_reports_bahv.png",
                "title": "Berita Acara Hasil Verifikasi Kolektif Ber-QR",
                "points": [
                    "Menghasilkan draf BAHV kolektif otomatis beserta rincian kode pelanggaran & nilai efisiensi.",
                    "Dilengkapi segel QR Verifikasi & checksum SHA-256 anti-manipulasi untuk audit BPK/SPI.",
                ],
            },
        ],
    },
    # ------------------------------------------------------------------ SLIDE 10
    {
        "id": "sec5_impact_evidence",
        "layout": "impact_evidence",
        "section": "05 | DAMPAK & BUKTI TERUKUR (1,5 MENIT)",
        "title": "86,0% Precision@50 (43,0x Lift) & 96,8% Rupiah@100 Tanpa Ganggu RS Jujur",
        "subtitle": (
            "Dievaluasi pada n=3.002 klaim uji multi-kondisi (60 fraud, 2,0% prevalensi) dengan uji ablasi berpasangan."
        ),
        "chart_image": "chart_hkeval_benchmark.png",
        "right_cards": [
            {
                "heading": "Bukti Statistik & Benchmark Terverifikasi",
                "accent": "#00733B",
                "items": [
                    "Precision@50 = 86,0% (95% Cluster CI: 48,0%-98,0%; 43/50 fraud) vs Aturan Saja 56,0% (+30,0% poin, p=0,0012).",
                    "Rupiah Recall: 66,3% pada Top-50 (Rp 200,07 Jt / Rp 301,88 Jt) dan 96,8% pada Top-100 (58/60 fraud).",
                    "Blind Review tanpa histori RS uji: 19/20 (95,0%, Wilson CI 76,4%-99,1%) vs 0/20 metode konvensional.",
                    "Validasi REFORMS 5/5 LOLOS (kebocoran label r = -0,0068; alpha 0,942; beta 0,918; otentisitas 0,964).",
                ],
            },
            {
                "heading": "Kesiapan Produksi & Keterbukaan Ilmiah",
                "accent": "#061B31",
                "items": [
                    "Cakupan Rekayasa: 189 endpoint FastAPI, 299 uji backend tercatat lolos (unit/integrasi), 112 uji E2E, & 16/16 stack check.",
                    "Hold-Out Transparan: pola belum terlihat Unbundling 66,7% (2/3) & Prolonged LOS 0,0% (0/11) dipetakan sebagai fokus kalibrasi aturan Tahap 1.",
                ],
            },
        ],
    },
    # ------------------------------------------------------------------ SLIDE 11
    {
        "id": "sec6_business_roadmap",
        "layout": "business_roadmap",
        "section": "06 | MODEL BISNIS & PETA JALAN IMPLEMENTASI (1 MENIT)",
        "title": "Model Sidecar Rp 0 Biaya Token dengan Rasio Manfaat hingga 115,5x Skala Nasional",
        "subtitle": (
            "Dirancang khusus untuk infrastruktur on-premise BPJS Kesehatan tanpa biaya lisensi per kursi maupun API eksternal."
        ),
        "chart_image": "chart_roadmap_tco.png",
        "right_cards": [
            {
                "heading": "Keunggulan Ekonomi Sidecar On-Premise",
                "accent": "#00733B",
                "items": [
                    "Rp 0 Biaya Variabel API/Token: Inferensi lokal menghilangkan tagihan per panggilan AI eksternal.",
                    "Zero Lock-In Vendor: Seluruh model, aturan, & gudang data SQL dapat diaudit dan dikelola tim internal BPJS.",
                    "Dampak DJS Ganda: Menahan pencairan klaim bermasalah (#6 & #11) sekaligus mempercepat arus kas RS patuh.",
                ],
            },
            {
                "heading": "Peta Jalan Adopsi Bertahap 18 Bulan",
                "accent": "#061B31",
                "items": [
                    "Tahap 1 (Bln 1-3 | 12 FKRTL Piloting): Kalibrasi aturan LOS/Unbundling | Hemat Rp 18,5 M/thn vs TCO Rp 450 Jt.",
                    "Tahap 2 (Bln 4-9 | 126 KC & 850 FKRTL): Integrasi VClaim sidecar C03.04 | Hemat Rp 142 M/thn vs Rp 1,85 M.",
                    "Tahap 3 (Bln 10-18 | 3.221 FKRTL & 23.816 FKTP): Skala nasional penuh | Hemat Rp 485 M/thn vs Rp 4,2 M.",
                ],
            },
        ],
    },
    # ------------------------------------------------------------------ SLIDE 12
    {
        "id": "closing",
        "layout": "closing",
        "section": "PENUTUP & AKSES SUBMISI RESMI",
        "title": "ClaimTrace JKN: Menjaga Setiap Rupiah Iuran Peserta JKN",
        "subtitle": (
            "Solusi Pra-Adjudikasi FKRTL 4-Lapis On-Premise oleh Tim TINEERENSE (MAN 1 Surakarta)"
        ),
        "cards": [
            (
                "APLIKASI LIVE PRODUKSI",
                "https://claimtrace-healthkathon.vercel.app",
                "Sidecar BEA C03.04 + Fail-Closed Auth + 9 Modul Clinical Precision",
            ),
            (
                "REPOSITORI & VERIFIKASI TEKNIS",
                "github.com/Khalaf-Dev/claimtrace-jkn",
                "189 Endpoint FastAPI | 299 Uji Backend Tercatat Lolos | 16/16 Stack Check",
            ),
            (
                "SUBMISI FINAL 20 BESAR",
                "TINEERENSE.pdf -> hackathonbpjs@bpjs-kesehatan.go.id",
                "Periode 14-17 Nov 2026 | Video Demo Unlisted <= 10 Menit",
            ),
        ],
        "footer_note": (
            "Terima Kasih atas Bimbingan Mentor & Perhatian Dewan Juri HealthKathon BPJS Kesehatan 2026."
        ),
    },
]

# Run validation immediately upon module import
validate_data_tree(DECK_META, "DECK_META")
validate_data_tree(SLIDES, "SLIDES")


if __name__ == "__main__":
    print(f"Validated {len(SLIDES)} slides cleanly with zero antislop or terminology violations.")
