import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Palet Warna Resmi Healthkathon 2026 & BPJS Kesehatan
    DARK_NAVY = RGBColor(22, 38, 59)          # #16263B (Latar Cover & Penutup)
    LIGHT_BG = RGBColor(248, 250, 252)        # #F8FAFC (Latar Belakang Slide Konten)
    CARD_BG = RGBColor(255, 255, 255)         # #FFFFFF (Warna Dasar Kartu)
    CARD_BORDER = RGBColor(167, 243, 208)     # #A7F3D0 (Garis Batas Mint Lembut)
    CARD_BORDER_STEP = RGBColor(186, 230, 253)# #BAE6FD (Border Biru Lembut)
    DARK_CARD_BG = RGBColor(15, 42, 58)       # #0F2A3A (Kartu Kontras Gelap)
    EMERALD = RGBColor(0, 176, 116)           # #00B074 (Hijau Primer Healthkathon)
    EMERALD_DARK = RGBColor(16, 155, 99)      # #109B63 (Hijau Badge & Header)
    MINT_LIGHT = RGBColor(240, 253, 244)      # #F0FDF4 (Latar Kartu Indikator)
    TEXT_DARK = RGBColor(30, 41, 59)          # #1E293B (Teks Judul & Isi Utama)
    TEXT_MUTED = RGBColor(100, 116, 139)      # #64748B (Teks Keterangan Abu)
    TEXT_WHITE = RGBColor(255, 255, 255)
    ACCENT_CYAN = RGBColor(125, 168, 196)     # #7DA8C4 (Aksen Teks Terang)
    ALERT_RED = RGBColor(225, 29, 72)         # #E11D48 (Aksen Peringatan/Masalah)
    FONT_NAME = "Segoe UI"                    # Kompatibel sempurna di Windows PowerPoint

    logo_path = '/home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/healthkathon_logo.png'
    screenshot_path = '/home/Khalaf-Dev/.gemini/antigravity/brain/bc1217c1-62d5-40a9-8f47-eade18d108bf/screenshots/view_dual_cockpit_mobile.png'

    def set_slide_bg(slide, color):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_header(slide, badge_num, title, meta=None):
        # Badge Hijau Bernomor Sesuai Template
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.42), Inches(0.82), Inches(0.82))
        badge.fill.solid()
        badge.fill.fore_color.rgb = EMERALD_DARK
        badge.line.fill.background()
        tf_b = badge.text_frame
        tf_b.word_wrap = True
        tf_b.vertical_anchor = MSO_ANCHOR.MIDDLE
        p_b = tf_b.paragraphs[0]
        p_b.text = badge_num
        p_b.alignment = PP_ALIGN.CENTER
        p_b.font.size = Pt(26)
        p_b.font.bold = True
        p_b.font.name = FONT_NAME
        p_b.font.color.rgb = TEXT_WHITE

        # Judul Slide
        title_box = slide.shapes.add_textbox(Inches(1.8), Inches(0.38), Inches(10.7), Inches(0.85))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        p_t = tf_t.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(24)
        p_t.font.bold = True
        p_t.font.name = FONT_NAME
        p_t.font.color.rgb = TEXT_DARK

        if meta:
            p_m = tf_t.add_paragraph()
            p_m.text = meta
            p_m.font.size = Pt(11)
            p_m.font.name = FONT_NAME
            p_m.font.color.rgb = TEXT_MUTED
            p_m.space_before = Pt(2)

    def add_footer(slide, page_num):
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(11.733), Inches(0.32))
        tf = footer_box.text_frame
        p = tf.paragraphs[0]
        p.text = f"Project Final Healthkathon 2026          Detect Smarter, Protect JKN - Smarter Protection for a Stronger JKN          Slide {page_num}"
        p.font.size = Pt(9.5)
        p.font.name = FONT_NAME
        p.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 1: COVER
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s1, DARK_NAVY)

    # Subtitle top
    top_box = s1.shapes.add_textbox(Inches(0.9), Inches(1.1), Inches(8), Inches(0.4))
    p_top = top_box.text_frame.paragraphs[0]
    p_top.text = "PANDUAN PROJECT FINAL"
    p_top.font.size = Pt(13)
    p_top.font.bold = True
    p_top.font.name = FONT_NAME
    p_top.font.color.rgb = EMERALD

    # Main Title
    title_box1 = s1.shapes.add_textbox(Inches(0.9), Inches(1.55), Inches(9.5), Inches(1.2))
    p_main = title_box1.text_frame.paragraphs[0]
    p_main.text = "Healthkathon 2026"
    p_main.font.size = Pt(44)
    p_main.font.bold = True
    p_main.font.name = FONT_NAME
    p_main.font.color.rgb = TEXT_WHITE

    # Subtitle
    sub_box1 = s1.shapes.add_textbox(Inches(0.9), Inches(2.75), Inches(11), Inches(0.6))
    p_sub1 = sub_box1.text_frame.paragraphs[0]
    p_sub1.text = "Detect Smarter, Protect JKN - Smarter Protection for a Stronger JKN: Efisiensi Risiko Program JKN"
    p_sub1.font.size = Pt(13.5)
    p_sub1.font.italic = True
    p_sub1.font.name = FONT_NAME
    p_sub1.font.color.rgb = ACCENT_CYAN

    # Logo
    if os.path.exists(logo_path):
        s1.shapes.add_picture(logo_path, Inches(10.8), Inches(0.8), width=Inches(1.7))

    # 4 Info Boxes on Cover
    box_w = Inches(2.75)
    box_h = Inches(2.25)
    box_gap = Inches(0.24)
    start_x = Inches(0.9)
    start_y = Inches(3.9)

    cover_cards = [
        ("N A M A  S O L U S I", "ClaimTrace", [
            "• Decision Support System (DSS) pra-bayar",
            "• Sinergi 3 lapis sinyal verifikasi faskes",
            "• Menghasilkan berkas telaah siap-audit"
        ]),
        ("N A M A  T I M", "TINEERENSE", [
            "• Khalaf Faith Pradyatama (Ketua)",
            "• Gaudiansyah Abiyu Mahya (Anggota)",
            "• Institusi Asal: MAN 1 Surakarta"
        ]),
        ("I D  T I M", "HK2026-TINEERENSE", [
            "• Tim Siswa/Mahasiswa Berprestasi",
            "• Kategori Pengawasan Faskes JKN",
            "• Finalist Project Healthkathon 2026"
        ]),
        ("K A T E G O R I", "Efisiensi Risiko Faskes", [
            "• Sub-kategori #6: Phantom Billing",
            "• Sub-kategori #11: Repeat Billing",
            "• Fokus: Klaim Fisioterapi FKRTL"
        ])
    ]

    for i, (tag, val, bullets) in enumerate(cover_cards):
        bx = start_x + i * (box_w + box_gap)
        card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, start_y, box_w, box_h)
        card.fill.solid()
        card.fill.fore_color.rgb = DARK_CARD_BG
        card.line.color.rgb = EMERALD
        card.line.width = Pt(1.5)
        tf_c = card.text_frame
        tf_c.word_wrap = True
        tf_c.margin_left = Inches(0.18)
        tf_c.margin_right = Inches(0.18)
        tf_c.margin_top = Inches(0.18)
        
        p1 = tf_c.paragraphs[0]
        p1.text = tag
        p1.font.size = Pt(9)
        p1.font.bold = True
        p1.font.name = FONT_NAME
        p1.font.color.rgb = EMERALD
        
        p2 = tf_c.add_paragraph()
        p2.text = val
        p2.font.size = Pt(13)
        p2.font.bold = True
        p2.font.name = FONT_NAME
        p2.font.color.rgb = TEXT_WHITE
        p2.space_before = Pt(3)
        
        for b in bullets:
            pb = tf_c.add_paragraph()
            pb.text = b
            pb.font.size = Pt(9.5)
            pb.font.name = FONT_NAME
            pb.font.color.rgb = RGBColor(203, 213, 225)
            pb.space_before = Pt(3)

    # Note
    note_box = s1.shapes.add_textbox(Inches(0.9), Inches(6.55), Inches(11.5), Inches(0.4))
    p_note = note_box.text_frame.paragraphs[0]
    p_note.text = "Inovasi Sinergi Penapisan Pra-Bayar: Radar Pola, Uji Jejak SATUSEHAT SDMK, & Konfirmasi Mobile JKN Terarah"
    p_note.font.size = Pt(10)
    p_note.font.italic = True
    p_note.font.name = FONT_NAME
    p_note.font.color.rgb = ACCENT_CYAN

    # =========================================================================
    # SLIDE 2: 1 PERKENALAN TIM
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s2, LIGHT_BG)
    add_header(s2, "1", "Perkenalan Tim", "Nama tim: TINEERENSE  |  Kategori: Efisiensi Risiko pada Fasilitas Kesehatan  |  Institusi: MAN 1 Surakarta")
    add_footer(s2, 1)

    card_w2 = Inches(3.75)
    card_h2 = Inches(5.1)
    gap2 = Inches(0.24)
    start_x2 = Inches(0.8)
    start_y2 = Inches(1.55)

    team_members = [
        ("A N G G O T A  1  ( K E T U A  T I M )", "Khalaf Faith Pradyatama", "Lead Architect, Full-Stack & AppSec", [
            "• Siswa Kelas XII MIPA, MAN 1 Surakarta",
            "• Arsitektur backend Python / FastAPI & basis data graf",
            "• Penerapan Application Security (AppSec) & AES-256",
            "• Reverse-engineering Mobile JKN & bridge reaktif",
            "• Implementasi tamper-evident ledger hash SHA-256",
            "• Berpengalaman dalam audit forensik dan keamanan siber"
        ]),
        ("A N G G O T A  2", "Gaudiansyah Abiyu Mahya", "AI / ML Engineer & Health Data Analyst", [
            "• Siswa Kelas XII MIPA, MAN 1 Surakarta",
            "• Pengembangan generator simulasi data klaim sintetis",
            "• Analisis regulasi JKN & kaidah koding INA-CBG",
            "• Perancangan UI/UX high-density Verificator Cockpit",
            "• Evaluasi metrik performa holdout (Precision@k, Recall)",
            "• Kalibrasi ambang batas matematis fusi skor multi-lapis"
        ]),
        ("P E N D A M P I N G  &  K O L A B O R A S I", "Tim Pembimbing & Mentor", "Regulatory Advisor & Domain Specialist", [
            "• Pembimbing Akademik: Tim Pembina KIR MAN 1 Surakarta",
            "• Supervisi integritas metodologi & kepatuhan riset",
            "• Kepatuhan UU PDP No. 27/2022 pada skema data sintetis",
            "• Penyelarasan SLA 10 hari verifikasi (Perpres 82/2018)",
            "• Konsultasi kaidah koding klaim INA-CBG Permenkes 3/2023",
            "• Pendampingan persiapan teknis dan presentasi finalis"
        ])
    ]

    for i, (tag, name, role, bullets) in enumerate(team_members):
        bx = start_x2 + i * (card_w2 + gap2)
        card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, start_y2, card_w2, card_h2)
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1.5)
        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.22)
        tf.margin_right = Inches(0.22)
        tf.margin_top = Inches(0.22)

        # Tag
        p1 = tf.paragraphs[0]
        p1.text = tag
        p1.font.size = Pt(9.5)
        p1.font.bold = True
        p1.font.name = FONT_NAME
        p1.font.color.rgb = EMERALD_DARK

        # Name
        p2 = tf.add_paragraph()
        p2.text = name
        p2.font.size = Pt(14)
        p2.font.bold = True
        p2.font.name = FONT_NAME
        p2.font.color.rgb = TEXT_DARK
        p2.space_before = Pt(3)

        # Role
        p3 = tf.add_paragraph()
        p3.text = role
        p3.font.size = Pt(10.5)
        p3.font.bold = True
        p3.font.name = FONT_NAME
        p3.font.color.rgb = EMERALD
        p3.space_before = Pt(2)

        # Divider
        p_div = tf.add_paragraph()
        p_div.text = "Keahlian & Pengalaman Relevan:"
        p_div.font.size = Pt(9.5)
        p_div.font.bold = True
        p_div.font.name = FONT_NAME
        p_div.font.color.rgb = TEXT_MUTED
        p_div.space_before = Pt(10)

        for b in bullets:
            pb = tf.add_paragraph()
            pb.text = b
            pb.font.size = Pt(9.2)
            pb.font.name = FONT_NAME
            pb.font.color.rgb = TEXT_DARK
            pb.space_before = Pt(4)

    # =========================================================================
    # SLIDE 3: 2 JUDUL IDE, DESKRIPSI, DAN TUJUAN
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s3, LIGHT_BG)
    add_header(s3, "2", "Judul Ide, Deskripsi, dan Tujuan")
    add_footer(s3, 2)

    # Left Dark Card (Hero Card)
    left_w = Inches(4.7)
    left_h = Inches(5.1)
    card_left = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.55), left_w, left_h)
    card_left.fill.solid()
    card_left.fill.fore_color.rgb = DARK_NAVY
    card_left.line.color.rgb = EMERALD
    card_left.line.width = Pt(1.5)
    tf_l = card_left.text_frame
    tf_l.word_wrap = True
    tf_l.margin_left = Inches(0.28)
    tf_l.margin_right = Inches(0.28)
    tf_l.margin_top = Inches(0.28)

    p_ltag = tf_l.paragraphs[0]
    p_ltag.text = "C L A I M T R A C E"
    p_ltag.font.size = Pt(9.5)
    p_ltag.font.bold = True
    p_ltag.font.name = FONT_NAME
    p_ltag.font.color.rgb = EMERALD

    p_lname = tf_l.add_paragraph()
    p_lname.text = "CLAIMTRACE"
    p_lname.font.size = Pt(28)
    p_lname.font.bold = True
    p_lname.font.name = FONT_NAME
    p_lname.font.color.rgb = TEXT_WHITE
    p_lname.space_before = Pt(2)

    p_lsub = tf_l.add_paragraph()
    p_lsub.text = "Inovasi ini membantu verifikator BPJS agar mempermudah dalam mendeteksi anomali klaim faskes secara otomatis berbasis Artificial Intelligence"
    p_lsub.font.size = Pt(10.5)
    p_lsub.font.bold = True
    p_lsub.font.name = FONT_NAME
    p_lsub.font.color.rgb = ACCENT_CYAN
    p_lsub.space_before = Pt(8)

    p_ktag = tf_l.add_paragraph()
    p_ktag.text = "KATEGORI DAN SUB KATEGORI"
    p_ktag.font.size = Pt(9.5)
    p_ktag.font.bold = True
    p_ktag.font.name = FONT_NAME
    p_ktag.font.color.rgb = EMERALD
    p_ktag.space_before = Pt(14)

    p_kval = tf_l.add_paragraph()
    p_kval.text = "Efisiensi Risiko pada Fasilitas Kesehatan (FKRTL)\n\nSub-kategori:\n#6: Phantom Billing (Klaim Fiktif Fisioterapi/Baksos)\n#11: Repeat Billing (Penagihan Klaim Berulang)"
    p_kval.font.size = Pt(9.5)
    p_kval.font.name = FONT_NAME
    p_kval.font.color.rgb = RGBColor(226, 232, 240)
    p_kval.space_before = Pt(4)

    # Right Top Card (Deskripsi Singkat)
    right_x = Inches(5.75)
    right_w = Inches(6.78)
    card_desc = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, right_x, Inches(1.55), right_w, Inches(2.6))
    card_desc.fill.solid()
    card_desc.fill.fore_color.rgb = CARD_BG
    card_desc.line.color.rgb = CARD_BORDER
    card_desc.line.width = Pt(1.5)
    tf_d = card_desc.text_frame
    tf_d.word_wrap = True
    tf_d.margin_left = Inches(0.24)
    tf_d.margin_right = Inches(0.24)
    tf_d.margin_top = Inches(0.2)

    pd_tag = tf_d.paragraphs[0]
    pd_tag.text = "D E S K R I P S I  S I N G K A T"
    pd_tag.font.size = Pt(10)
    pd_tag.font.bold = True
    pd_tag.font.name = FONT_NAME
    pd_tag.font.color.rgb = EMERALD_DARK

    p_desc_body = tf_d.add_paragraph()
    p_desc_body.text = (
        "Sistem pendukung keputusan berbasis Artificial Intelligence yang mempermudah verifikator BPJS Kesehatan "
        "dalam mendeteksi anomali klaim faskes, khususnya pada kasus Phantom Billing dan Repeat Billing. "
        "Sistem ini bekerja secara preventif pada tahap pra-bayar melalui Matriks Bukti 3 Lapis: menganalisis lonjakan klaster "
        "klaim spatiotemporal serta kemiripan Episode Fingerprint, memvalidasi silang keaktifan SIP dan beban harian dokter "
        "pada registry SATUSEHAT SDMK, serta mengonfirmasi kehadiran pasien secara langsung melalui aplikasi Mobile JKN."
    )
    p_desc_body.font.size = Pt(9.2)
    p_desc_body.font.name = FONT_NAME
    p_desc_body.font.color.rgb = TEXT_DARK
    p_desc_body.space_before = Pt(4)

    # Right Bottom Card (Tujuan)
    card_goal = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, right_x, Inches(4.3), right_w, Inches(2.35))
    card_goal.fill.solid()
    card_goal.fill.fore_color.rgb = CARD_BG
    card_goal.line.color.rgb = CARD_BORDER
    card_goal.line.width = Pt(1.5)
    tf_g = card_goal.text_frame
    tf_g.word_wrap = True
    tf_g.margin_left = Inches(0.24)
    tf_g.margin_right = Inches(0.24)
    tf_g.margin_top = Inches(0.2)

    pg_tag = tf_g.paragraphs[0]
    pg_tag.text = "T U J U A N"
    pg_tag.font.size = Pt(10)
    pg_tag.font.bold = True
    pg_tag.font.name = FONT_NAME
    pg_tag.font.color.rgb = EMERALD_DARK

    goal_bullets = [
        "• Mendeteksi anomali klaim secara otomatis sebelum klaim dibayarkan.",
        "• Memvalidasi jejak operasional faskes secara lintas sumber.",
        "• Menghasilkan berkas siap audit yang objektif dan transparan bagi verifikator."
    ]
    for gb in goal_bullets:
        pgb = tf_g.add_paragraph()
        pgb.text = gb
        pgb.font.size = Pt(9.6)
        pgb.font.name = FONT_NAME
        pgb.font.color.rgb = TEXT_DARK
        pgb.space_before = Pt(4)

    # =========================================================================
    # SLIDE 4: 3 LATAR BELAKANG DAN DAMPAK
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s4, LIGHT_BG)
    add_header(s4, "3", "Latar Belakang dan Dampak")
    add_footer(s4, 3)

    # Left: Latar Belakang
    card_lb = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.55), Inches(5.6), Inches(5.1))
    card_lb.fill.solid()
    card_lb.fill.fore_color.rgb = CARD_BG
    card_lb.line.color.rgb = CARD_BORDER
    card_lb.line.width = Pt(1.5)
    tf_lb = card_lb.text_frame
    tf_lb.word_wrap = True
    tf_lb.margin_left = Inches(0.24)
    tf_lb.margin_right = Inches(0.24)
    tf_lb.margin_top = Inches(0.22)

    plb_tag = tf_lb.paragraphs[0]
    plb_tag.text = "L A T A R  B E L A K A N G  &  U R G E N S I"
    plb_tag.font.size = Pt(10)
    plb_tag.font.bold = True
    plb_tag.font.name = FONT_NAME
    plb_tag.font.color.rgb = ALERT_RED

    lb_bullets = [
        "• Ekosistem Skala Masif: Melayani >1,9 juta pemanfaatan layanan JKN/hari di seluruh faskes mitra se-Indonesia (Paparan BPJS 2025).",
        "• Temuan Kerugian Riil KPK & Kemenkes (Juli 2024): Dugaan klaim fiktif sebesar ±Rp34 Miliar pada 3 RS khusus (rentang Rp1–3 M, Rp4–10 M, Rp20–30 M).",
        "• Keparahan Ekstrem Phantom Billing (#6): 75,3% (3.269 dari 4.341 klaim fisioterapi di 3 RS khusus terbukti fiktif tanpa ada pasien).",
        "• Titik Buta Verifikasi Pra-Bayar (Vedika): Hanya memeriksa kelengkapan administrasi digital (klaim lolos jika dokumen rekam medis tersusun rapi).",
        "• Keterlambatan Audit Pasca-Bayar: Verifikasi Pasca-Klaim (VPK) & AAK bersifat reaktif setelah dana DJS terlanjur dibayarkan ke faskes nakal.",
        "• Kebutuhan Regulasi: Verifikator membutuhkan sinyal risiko pra-bayar sebelum batas 10 hari penerbitan Berita Acara Kelengkapan Berkas."
    ]
    for lbb in lb_bullets:
        plb = tf_lb.add_paragraph()
        plb.text = lbb
        plb.font.size = Pt(9.2)
        plb.font.name = FONT_NAME
        plb.font.color.rgb = TEXT_DARK
        plb.space_before = Pt(5)

    # Right Top: Dampak
    card_dp = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.65), Inches(1.55), Inches(5.88), Inches(2.65))
    card_dp.fill.solid()
    card_dp.fill.fore_color.rgb = CARD_BG
    card_dp.line.color.rgb = CARD_BORDER
    card_dp.line.width = Pt(1.5)
    tf_dp = card_dp.text_frame
    tf_dp.word_wrap = True
    tf_dp.margin_left = Inches(0.24)
    tf_dp.margin_right = Inches(0.24)
    tf_dp.margin_top = Inches(0.2)

    pdp_tag = tf_dp.paragraphs[0]
    pdp_tag.text = "D A M P A K  &  P E R B A I K A N  T E R U K U R"
    pdp_tag.font.size = Pt(10)
    pdp_tag.font.bold = True
    pdp_tag.font.name = FONT_NAME
    pdp_tag.font.color.rgb = EMERALD_DARK

    dp_bullets = [
        "• Transformasi Pengawasan: Bergeser dari audit pasca-bayar yang reaktif menjadi penapisan pra-bayar berbasis bukti yang preventif.",
        "• Proteksi Identitas Peserta: Mencegah pencatutan data NIK/KIS peserta baksos untuk klaim fiktif tanpa persetujuan pasien.",
        "• Keadilan Bagi Faskes Patuh: Klaim wajar (90%+) masuk jalur cepat (fast-track), klarifikasi hanya ditujukan pada anomali terbukti.",
        "• Efisiensi Kerja Verifikator: Waktu penelaahan berkas dipangkas drastis dengan berkas siap-audit transparan bebas debat."
    ]
    for dpb in dp_bullets:
        pdp = tf_dp.add_paragraph()
        pdp.text = dpb
        pdp.font.size = Pt(9.2)
        pdp.font.name = FONT_NAME
        pdp.font.color.rgb = TEXT_DARK
        pdp.space_before = Pt(4)

    # Right Bottom: 3 Stat Cards
    stat_w = Inches(1.85)
    stat_h = Inches(2.25)
    stat_gap = Inches(0.16)
    stat_start_x = Inches(6.65)
    stat_y = Inches(4.4)

    stat_cards = [
        ("100%", "Precision@100", "Deteksi presisi pada 100 anomali skor teratas dalam benchmark uji holdout."),
        ("0,00%", "FPR ke Merah", "0% klaim faskes patuh salah ditolak (dialihkan ke Kuning jika data tertunda)."),
        ("100%", "Recall Antrean", "Seluruh klaim anomali tertangkap dalam antrean telaah (Kuning + Merah).")
    ]

    for i, (val, title_s, desc_s) in enumerate(stat_cards):
        bx = stat_start_x + i * (stat_w + stat_gap)
        sc = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, stat_y, stat_w, stat_h)
        sc.fill.solid()
        sc.fill.fore_color.rgb = MINT_LIGHT
        sc.line.color.rgb = CARD_BORDER
        sc.line.width = Pt(1.5)
        tf_s = sc.text_frame
        tf_s.word_wrap = True
        tf_s.margin_left = Inches(0.12)
        tf_s.margin_right = Inches(0.12)
        tf_s.margin_top = Inches(0.16)

        ps1 = tf_s.paragraphs[0]
        ps1.text = val
        ps1.alignment = PP_ALIGN.CENTER
        ps1.font.size = Pt(22)
        ps1.font.bold = True
        ps1.font.name = FONT_NAME
        ps1.font.color.rgb = EMERALD_DARK

        ps2 = tf_s.add_paragraph()
        ps2.text = title_s
        ps2.alignment = PP_ALIGN.CENTER
        ps2.font.size = Pt(10)
        ps2.font.bold = True
        ps2.font.name = FONT_NAME
        ps2.font.color.rgb = TEXT_DARK
        ps2.space_before = Pt(2)

        ps3 = tf_s.add_paragraph()
        ps3.text = desc_s
        ps3.alignment = PP_ALIGN.CENTER
        ps3.font.size = Pt(8.5)
        ps3.font.name = FONT_NAME
        ps3.font.color.rgb = TEXT_MUTED
        ps3.space_before = Pt(4)

    # =========================================================================
    # SLIDE 5: 4 ALUR PROSES APLIKASI
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s5, LIGHT_BG)
    add_header(s5, "4", "Alur Proses Aplikasi")
    add_footer(s5, 4)

    # 5 Horizontal Process Steps
    step_w = Inches(2.22)
    step_h = Inches(2.45)
    step_gap = Inches(0.15)
    step_x = Inches(0.8)
    step_y = Inches(1.55)

    steps_data = [
        ("1. Input", DARK_NAVY, [
            "• Berkas klaim digital (vClaim)",
            "• Diagnosa ICD-10 & ICD-9-CM",
            "• Profil DPJP SATUSEHAT SDMK",
            "• Baseline volume klaim faskes"
        ]),
        ("2. Proses", DARK_NAVY, [
            "• Episode Fingerprint matching",
            "• Deteksi klaster lonjakan baksos",
            "• Pengecekan beban wajar DPJP (>60)",
            "• Pemodelan graf faskes-dokter-pasien"
        ]),
        ("3. Analisis AI", EMERALD_DARK, [
            "• Network Graph anomaly scoring",
            "• Fusi: S = 0.5·S1 + 0.3·S2 + 0.2·S3",
            "• Hard Trigger: SIP mati -> auto MERAH",
            "• Penilaian deterministik bebas halusinasi"
        ]),
        ("4. Output", DARK_NAVY, [
            "• Triage: Hijau (<50) | Kuning | Merah (>=75)",
            "• Berkas Telaah Siap-Audit transparan",
            "• Notifikasi presensi biner Mobile JKN",
            "• Urutan antrean prioritas verifikator"
        ]),
        ("5. Tindak Lanjut", DARK_NAVY, [
            "• Human-in-the-Loop verifikator BPJS",
            "• Eksekusi: Lolos / Minta Klarifikasi / Audit",
            "• Penundaan Berita Acara sebelum 10 hari",
            "• Stempel audit SHA-256 tamper-evident"
        ])
    ]

    for i, (title_step, bg_color, bullets) in enumerate(steps_data):
        bx = step_x + i * (step_w + step_gap)
        box = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, step_y, step_w, step_h)
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = bg_color
        box.line.width = Pt(1.5)
        tf_st = box.text_frame
        tf_st.word_wrap = True
        tf_st.margin_left = Inches(0.12)
        tf_st.margin_right = Inches(0.12)
        tf_st.margin_top = Inches(0.12)

        # Header tag banner
        p_hdr = tf_st.paragraphs[0]
        p_hdr.text = title_step
        p_hdr.alignment = PP_ALIGN.CENTER
        p_hdr.font.size = Pt(11)
        p_hdr.font.bold = True
        p_hdr.font.name = FONT_NAME
        p_hdr.font.color.rgb = bg_color

        for b in bullets:
            pb = tf_st.add_paragraph()
            pb.text = b
            pb.font.size = Pt(8.5)
            pb.font.name = FONT_NAME
            pb.font.color.rgb = TEXT_DARK
            pb.space_before = Pt(3)

    # 3 Summary Boxes Below
    sub_w = Inches(3.78)
    sub_h = Inches(2.6)
    sub_gap = Inches(0.2)
    sub_start_x = Inches(0.8)
    sub_y = Inches(4.25)

    bottom_sections = [
        ("P E N G G U N A  /  A K T O R", [
            "• Verifikator Klaim BPJS (Aktor Utama): Mengoperasikan dashboard, menelaah bukti anomali, dan mengeksekusi keputusan hukum klaim (HITL).",
            "• Peserta JKN (Subjek Validasi): Menerima notifikasi konfirmasi presensi 1-klik di Mobile JKN untuk membuktikan kehadiran fisik layanan.",
            "• Faskes Mitra (Entitas Terpantau): Memperoleh jalur hijau cepat untuk klaim wajar dan transparansi bukti saat ada permintaan klarifikasi."
        ]),
        ("D A T A  Y A N G  D I P A K A I", [
            "• Data Klaim Terstandarisasi: Nomor SEP, kode INA-CBG, diagnosa primer/sekunder ICD-10, dan kode tindakan fisioterapi ICD-9-CM.",
            "• Data SDMK Kemenkes: Status Surat Izin Praktik (SIP), nomor STR, dan faskes tempat penugasan aktif DPJP.",
            "• Dataset Sintetis Terkalibrasi: 3.002 baris transaksi klaim terpartisi tanpa menggunakan data pribadi peserta riil (Patuh UU PDP No. 27/2022)."
        ]),
        ("T E K N O L O G I  &  A R S I T E K T U R", [
            "• Backend & Algoritma: Python, FastAPI, Spatiotemporal Clustering, Network Graph Relational Modeling, dan Deterministic Fusion Engine.",
            "• Frontend Verifikator: React, Vite, Tailwind CSS, High-Density Analytics Cockpit, dan Reactive Mobile JKN Simulator.",
            "• Standar Keamanan: On-premise deployment, Enkripsi AES-256 at-rest, TLS 1.3 in-transit, dan Tamper-Evident SHA-256 Audit Trail."
        ])
    ]

    for i, (title_sec, bullets) in enumerate(bottom_sections):
        bx = sub_start_x + i * (sub_w + sub_gap)
        sc = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, sub_y, sub_w, sub_h)
        sc.fill.solid()
        sc.fill.fore_color.rgb = CARD_BG
        sc.line.color.rgb = CARD_BORDER
        sc.line.width = Pt(1.5)
        tf_sc = sc.text_frame
        tf_sc.word_wrap = True
        tf_sc.margin_left = Inches(0.18)
        tf_sc.margin_right = Inches(0.18)
        tf_sc.margin_top = Inches(0.16)

        p_h = tf_sc.paragraphs[0]
        p_h.text = title_sec
        p_h.font.size = Pt(9.5)
        p_h.font.bold = True
        p_h.font.name = FONT_NAME
        p_h.font.color.rgb = EMERALD_DARK

        for b in bullets:
            pb = tf_sc.add_paragraph()
            pb.text = b
            pb.font.size = Pt(8.5)
            pb.font.name = FONT_NAME
            pb.font.color.rgb = TEXT_DARK
            pb.space_before = Pt(3)

    # =========================================================================
    # SLIDE 6: 5 DEMO APLIKASI / PROTOTYPE
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s6, LIGHT_BG)
    add_header(s6, "5", "Demo Aplikasi / Prototype")
    add_footer(s6, 5)

    # Left: Screenshot of Dual Cockpit Prototype (preserve exact 16:10 aspect ratio)
    img_left_w = Inches(6.8)
    img_left_h = Inches(4.25)
    img_left_x = Inches(0.8)
    img_left_y = Inches(1.9)

    # Frame shape for screenshot
    frame = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, img_left_x - Inches(0.04), img_left_y - Inches(0.04), img_left_w + Inches(0.08), img_left_h + Inches(0.08))
    frame.fill.solid()
    frame.fill.fore_color.rgb = DARK_NAVY
    frame.line.color.rgb = EMERALD
    frame.line.width = Pt(1.5)

    if os.path.exists(screenshot_path):
        s6.shapes.add_picture(screenshot_path, img_left_x, img_left_y, width=img_left_w, height=img_left_h)

    # Caption under screenshot
    cap_box = s6.shapes.add_textbox(img_left_x, img_left_y + img_left_h + Inches(0.1), img_left_w, Inches(0.45))
    p_cap = cap_box.text_frame.paragraphs[0]
    p_cap.text = "Tampilan Dual-Cockpit ClaimTrace: Web Dashboard Verifikator BPJS (Kiri) & Mobile JKN Peserta (Kanan)"
    p_cap.alignment = PP_ALIGN.CENTER
    p_cap.font.size = Pt(9)
    p_cap.font.italic = True
    p_cap.font.name = FONT_NAME
    p_cap.font.color.rgb = TEXT_MUTED

    # Right: Skenario Demo Box
    right_demo_x = Inches(7.85)
    right_demo_w = Inches(4.68)
    card_demo = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, right_demo_x, Inches(1.55), right_demo_w, Inches(3.7))
    card_demo.fill.solid()
    card_demo.fill.fore_color.rgb = CARD_BG
    card_demo.line.color.rgb = CARD_BORDER
    card_demo.line.width = Pt(1.5)
    tf_dm = card_demo.text_frame
    tf_dm.word_wrap = True
    tf_dm.margin_left = Inches(0.2)
    tf_dm.margin_right = Inches(0.2)
    tf_dm.margin_top = Inches(0.18)

    pdm_tag = tf_dm.paragraphs[0]
    pdm_tag.text = "S K E N A R I O  D E M O  ( 1 0  M E N I T )"
    pdm_tag.font.size = Pt(10)
    pdm_tag.font.bold = True
    pdm_tag.font.name = FONT_NAME
    pdm_tag.font.color.rgb = EMERALD_DARK

    demo_steps = [
        ("1", "Triage Antrean & Deteksi Klaster:", "Verifikator membuka dashboard, sistem menampilkan 85 klaim fisioterapi RS Mitra Husada pasca-baksos masuk Jalur Merah (Skor 87)."),
        ("2", "Inspeksi Matriks Bukti 3 Lapis:", "Verifikator memeriksa lonjakan klaim 8,5x baseline (L1) dan validasi SATUSEHAT yang mengungkap SIP DPJP telah berakhir (L2)."),
        ("3", "Simulasi Live Mobile JKN:", "Notifikasi presensi terkirim ke ponsel peserta; peserta memilih [Tidak Pernah Hadir] -> Skor di cockpit seketika bereaksi reaktif!"),
        ("4", "Keputusan & Cetak Audit Trail:", "Verifikator mengeksekusi [Tunda Berita Acara & Minta Klarifikasi], sistem menerbitkan berkas audit dengan stempel hash SHA-256.")
    ]

    for num, stitle, sdesc in demo_steps:
        p_s = tf_dm.add_paragraph()
        p_s.text = f"• Langkah {num} - {stitle} {sdesc}"
        p_s.font.size = Pt(8.5)
        p_s.font.name = FONT_NAME
        p_s.font.color.rgb = TEXT_DARK
        p_s.space_before = Pt(4)

    # Right Bottom: Tautan Prototype
    card_link = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, right_demo_x, Inches(5.4), right_demo_w, Inches(1.25))
    card_link.fill.solid()
    card_link.fill.fore_color.rgb = MINT_LIGHT
    card_link.line.color.rgb = CARD_BORDER
    card_link.line.width = Pt(1.5)
    tf_lk = card_link.text_frame
    tf_lk.word_wrap = True
    tf_lk.margin_left = Inches(0.2)
    tf_lk.margin_right = Inches(0.2)
    tf_lk.margin_top = Inches(0.12)

    plk_tag = tf_lk.paragraphs[0]
    plk_tag.text = "T A U T A N  P R O T O T Y P E  &  R E P O S I T O R I"
    plk_tag.font.size = Pt(9.5)
    plk_tag.font.bold = True
    plk_tag.font.name = FONT_NAME
    plk_tag.font.color.rgb = EMERALD_DARK

    p_l1 = tf_lk.add_paragraph()
    p_l1.text = "• Web App Local Master: http://localhost:3000 (React Master Suite)"
    p_l1.font.size = Pt(8.5)
    p_l1.font.bold = True
    p_l1.font.name = FONT_NAME
    p_l1.font.color.rgb = TEXT_DARK
    p_l1.space_before = Pt(2)

    p_l2 = tf_lk.add_paragraph()
    p_l2.text = "• Repositori: github.com/tineerense/claimtrace-jkn"
    p_l2.font.size = Pt(8.5)
    p_l2.font.name = FONT_NAME
    p_l2.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 7: 6 PENJELASAN FITUR
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s7, LIGHT_BG)
    add_header(s7, "6", "Penjelasan Fitur")
    add_footer(s7, 6)

    card_fw = Inches(5.75)
    card_fh = Inches(2.45)
    f_gap_x = Inches(0.25)
    f_gap_y = Inches(0.2)
    start_fx = Inches(0.8)
    start_fy = Inches(1.55)

    features = [
        ("1", "Deteksi Otomatis AI & Radar Klaster (Isolation Forest + ChromaDB)", [
            "• Fungsi: Memindai klaim faskes secara otomatis berbasis AI (Ensemble Isolation Forest + ChromaDB HNSW Cosine Vector Space) untuk mendeteksi lonjakan klaster massal (#6 Phantom Billing) dan kemiripan Episode Fingerprint (#11 Repeat Billing) sebelum klaim dibayarkan.",
            "• Menjawab Masalah: Menghentikan modus klaim fiktif terorganisir pasca-baksos dan klaim duplikat terapi fisioterapi yang lolos dari verifikasi manual berkas Vedika."
        ]),
        ("2", "Uji Jejak Layanan SATUSEHAT SDMK (Lapis 2 - Bobot 30%)", [
            "• Fungsi: Merekonsiliasi data penugasan DPJP terhadap registry Kemenkes (keaktifan SIP pada tanggal layanan) serta memonitor beban wajar dokter (>60 pasien/hari).",
            "• Menjawab Masalah: Menghentikan pencatutan nama dokter yang sudah tidak bertugas di RS dan anomali kapasitas layanan fisik dokter yang mustahil. Dilengkapi Hard Trigger mandiri."
        ]),
        ("3", "Konfirmasi Presensi Mobile JKN (Lapis 3 - Bobot 20%)", [
            "• Fungsi: Mengirimkan verifikasi biner (1-klik Ya/Tidak) secara acak-terarah ke aplikasi Mobile JKN peserta dengan prinsip minimasi data tanpa rincian klinis.",
            "• Menjawab Masalah: Menyediakan bukti empiris riil pasien tanpa membuka diagnosa medis sensitif, mematahkan manipulasi tanda tangan dan dokumen fisik."
        ]),
        ("4", "Decision Console & Tamper-Evident SHA-256 Ledger", [
            "• Fungsi: Menyajikan antarmuka triage terpadu (Hijau/Kuning/Merah), Berkas Telaah Siap-Audit transparan, serta mengunci keputusan verifikator dengan stempel hash kriptografis SHA-256.",
            "• Menjawab Masalah: Menghilangkan alert fatigue verifikator, memfasilitasi audit forensik yang dapat dipertanggungjawabkan hukum, dan mematuhi batas 10 hari Berita Acara."
        ])
    ]

    for idx, (num_f, title_f, bullets_f) in enumerate(features):
        row = idx // 2
        col = idx % 2
        fx = start_fx + col * (card_fw + f_gap_x)
        fy = start_fy + row * (card_fh + f_gap_y)

        cf = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, fx, fy, card_fw, card_fh)
        cf.fill.solid()
        cf.fill.fore_color.rgb = CARD_BG
        cf.line.color.rgb = CARD_BORDER
        cf.line.width = Pt(1.5)
        tf_f = cf.text_frame
        tf_f.word_wrap = True
        tf_f.margin_left = Inches(0.2)
        tf_f.margin_right = Inches(0.2)
        tf_f.margin_top = Inches(0.16)

        pf1 = tf_f.paragraphs[0]
        pf1.text = title_f
        pf1.font.size = Pt(10.5)
        pf1.font.bold = True
        pf1.font.name = FONT_NAME
        pf1.font.color.rgb = EMERALD_DARK

        for bf in bullets_f:
            pbf = tf_f.add_paragraph()
            pbf.text = bf
            pbf.font.size = Pt(8.5)
            pbf.font.name = FONT_NAME
            pbf.font.color.rgb = TEXT_DARK
            pbf.space_before = Pt(4)

    # =========================================================================
    # SLIDE 8: + SLIDE TAMBAHAN: ARSITEKTUR & KEAMANAN DATA
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s8, LIGHT_BG)
    add_header(s8, "+", "Slide Tambahan: Arsitektur Teknis, Keamanan & Privasi", "Fondasi Rekayasa Perangkat Lunak, Kepatuhan UU PDP No. 27/2022, dan Tata Kelola AI")
    add_footer(s8, 7)

    col3_w = Inches(3.78)
    col3_h = Inches(5.1)
    col3_gap = Inches(0.2)
    start_c3x = Inches(0.8)
    start_c3y = Inches(1.55)

    add_cards_1 = [
        ("A R S I T E K T U R  A I  &  A N O M A L I", [
            "• AI Anomaly Engine Otomatis: Model unsupervised Isolation Forest terkalibrasi dengan 10 vektor fitur matematis, mendeteksi anomali multidimensional sebelum pembayaran.",
            "• ChromaDB Semantic Vector Space: Model embedding all-MiniLM-L6-v2 mendeteksi copy-paste / fabrikasi resume medis antar-pasien dalam klaster faskes yang sama.",
            "• Graph Sequence Anomaly: Penelusuran graf relasi untuk mencegah penagihan berulang (#11 Repeat Billing) dan deteksi mustahil jarak fisik DPJP (Impossible Travel).",
            "• Explainable AI (XAI): Setiap skor anomali dilengkapi dekomposisi kontribusi fitur (SHAP-like) dan rekomendasi klinis otomatis bagi verifikator BPJS."
        ]),
        ("K E A M A N A N  &  P E R L I N D U N G A N  D A T A", [
            "• Kepatuhan Penuh UU PDP No. 27/2022: Implementasi prinsip minimasi data dan perlindungan data pribadi pasien yang ketat.",
            "• Standar Kriptografi Berlapis: Basis data terenkripsi AES-256 (at-rest) dan seluruh komunikasi API terproteksi TLS 1.3 (in-transit).",
            "• Pseudonimisasi Identitas Peserta: Identitas pasien (NIK / No. KIS) dipisahkan secara kriptografis dari data klaim layanan medis.",
            "• Tamper-Evident SHA-256 Ledger: Seluruh keputusan verifikator dan histori telaah klaim dikunci dengan stempel hash anti-manipulasi."
        ]),
        ("T A T A  K E L O L A  A I  &  E T I K A  H I T L", [
            "• Human-in-the-Loop Mutlak: Sistem AI hanya berfungsi sebagai Decision Support System (pemberi rekomendasi), vonis klaim 100% di tangan verifikator manusia.",
            "• Mitigasi Bias Terhadap Faskes: Kegiatan bakti sosial resmi (sah) dimasukkan ke dalam baseline kontrol agar tidak terkena penandaan keliru.",
            "• Jalur Keberatan Faskes: Faskes diberikan transparansi bukti anomali dan SLA klarifikasi resmi sebelum dilakukan audit lapangan lanjutan.",
            "• Mitigasi Phishing Peserta: Konfirmasi hanya dapat diakses melalui aplikasi resmi Mobile JKN yang terotentikasi, bukan via SMS/WhatsApp terbuka."
        ])
    ]

    for i, (title_ac, bullets_ac) in enumerate(add_cards_1):
        bx = start_c3x + i * (col3_w + col3_gap)
        cac = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, start_c3y, col3_w, col3_h)
        cac.fill.solid()
        cac.fill.fore_color.rgb = CARD_BG
        cac.line.color.rgb = CARD_BORDER
        cac.line.width = Pt(1.5)
        tf_ac = cac.text_frame
        tf_ac.word_wrap = True
        tf_ac.margin_left = Inches(0.18)
        tf_ac.margin_right = Inches(0.18)
        tf_ac.margin_top = Inches(0.18)

        pac1 = tf_ac.paragraphs[0]
        pac1.text = title_ac
        pac1.font.size = Pt(9.5)
        pac1.font.bold = True
        pac1.font.name = FONT_NAME
        pac1.font.color.rgb = EMERALD_DARK

        for bac in bullets_ac:
            pbac = tf_ac.add_paragraph()
            pbac.text = bac
            pbac.font.size = Pt(8.5)
            pbac.font.name = FONT_NAME
            pbac.font.color.rgb = TEXT_DARK
            pbac.space_before = Pt(4)

    # =========================================================================
    # SLIDE 9: + SLIDE TAMBAHAN: HASIL UJI & KESIAPAN IMPLEMENTASI
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s9, LIGHT_BG)
    add_header(s9, "+", "Slide Tambahan: Hasil Uji Validasi & Kesiapan Implementasi", "Pengujian Holdout Dataset, Rencana Piloting, dan Roadmap Pengembangan Pascakompetisi")
    add_footer(s9, 8)

    add_cards_2 = [
        ("H A S I L  U J I  D A T A S E T  H O L D O U T", [
            "• Ukuran Dataset Uji: 3.002 baris transaksi klaim fisioterapi sintetis terkalibrasi dengan pemisahan partisi latih/uji independen.",
            "• Precision@100 = 100%: 100 kasus teratas dengan skor prioritas telaah tertinggi seluruhnya terbukti mengandung anomali (#6/#11).",
            "• False Positive Rate (FPR) ke Merah = 0,00%: Tidak ada satu pun klaim sah dari faskes patuh yang salah dimasukkan ke Jalur Merah.",
            "• Penanganan Data Tertunda: Klaim dengan data SIP belum tersinkronisasi di SATUSEHAT otomatis dialihkan ke Jalur Kuning untuk klarifikasi.",
            "• Recall Antrean (Kuning + Merah) = 100%: Seluruh klaim bermasalah berhasil ditapis masuk antrean telaah verifikator."
        ]),
        ("K E S I A P A N  I M P L E M E N T A S I  B P J S", [
            "• Kompatibilitas Skema Sistem: Mengadopsi struktur data standar BPJS (vClaim, TrustMark, INA-CBG) dan SATUSEHAT SDMK Kemenkes.",
            "• Non-Disruptive Add-on: Bekerja sebagai lapisan kecerdasan komplementer tanpa merombak arsitektur sistem core verifikasi BPJS.",
            "• Kesiapan Prototipe: Master Suite React & simulator interaktif telah selesai dibangun 100% dan siap didemokan langsung.",
            "• Efisiensi Komputasi: Kalkulasi fusi skor rata-rata selesai dalam <2 detik per berkas klaim, sangat memadai untuk SLA pra-bayar."
        ]),
        ("R E N C A N A  P E N G E M B A N G A N  ( R O A D M A P )", [
            "• Fase 1 (Bulan 1–2): Bimbingan teknis intensif bersama tim IT & verifikator BPJS untuk kalibrasi bobot parameter skor di lapangan.",
            "• Fase 2 (Bulan 3–4): Piloting implementasi terbatas di 1 Kantor Cabang percontohan (fokus klaim fisioterapi FKRTL).",
            "• Fase 3 (Bulan 5–6): Evaluasi komparatif akurasi deteksi pra-bayar terhadap temuan audit pasca-bayar (VPK & AAK).",
            "• Fase 4 (Bulan 7+): Integrasi log validasi biometrik FRISTA di faskes & ekspansi deteksi ke 14 tipologi kecurangan JKN lainnya."
        ])
    ]

    for i, (title_ac, bullets_ac) in enumerate(add_cards_2):
        bx = start_c3x + i * (col3_w + col3_gap)
        cac = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, start_c3y, col3_w, col3_h)
        cac.fill.solid()
        cac.fill.fore_color.rgb = CARD_BG
        cac.line.color.rgb = CARD_BORDER
        cac.line.width = Pt(1.5)
        tf_ac = cac.text_frame
        tf_ac.word_wrap = True
        tf_ac.margin_left = Inches(0.18)
        tf_ac.margin_right = Inches(0.18)
        tf_ac.margin_top = Inches(0.18)

        pac1 = tf_ac.paragraphs[0]
        pac1.text = title_ac
        pac1.font.size = Pt(9.5)
        pac1.font.bold = True
        pac1.font.name = FONT_NAME
        pac1.font.color.rgb = EMERALD_DARK

        for bac in bullets_ac:
            pbac = tf_ac.add_paragraph()
            pbac.text = bac
            pbac.font.size = Pt(8.5)
            pbac.font.name = FONT_NAME
            pbac.font.color.rgb = TEXT_DARK
            pbac.space_before = Pt(4)

    # =========================================================================
    # SLIDE 10: TERIMA KASIH (CLOSING)
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s10, DARK_NAVY)

    # Logo top right
    if os.path.exists(logo_path):
        s10.shapes.add_picture(logo_path, Inches(10.8), Inches(0.8), width=Inches(1.7))

    # Big Title
    title_box10 = s10.shapes.add_textbox(Inches(0.9), Inches(1.8), Inches(9.5), Inches(1.2))
    p_main10 = title_box10.text_frame.paragraphs[0]
    p_main10.text = "Terima kasih"
    p_main10.font.size = Pt(50)
    p_main10.font.bold = True
    p_main10.font.name = FONT_NAME
    p_main10.font.color.rgb = TEXT_WHITE

    sub_box10 = s10.shapes.add_textbox(Inches(0.9), Inches(3.0), Inches(11), Inches(0.5))
    p_sub10 = sub_box10.text_frame.paragraphs[0]
    p_sub10.text = "Detect Smarter, Protect JKN - Smarter Protection for a Stronger JKN: Efisiensi Risiko Program JKN"
    p_sub10.font.size = Pt(13)
    p_sub10.font.italic = True
    p_sub10.font.name = FONT_NAME
    p_sub10.font.color.rgb = ACCENT_CYAN

    # 3 Bottom Cards
    cw10 = Inches(3.78)
    ch10 = Inches(2.25)
    gap10 = Inches(0.2)
    start_x10 = Inches(0.9)
    start_y10 = Inches(3.9)

    closing_cards = [
        ("T A U T A N  P R O T O T Y P E  /  D E M O", [
            "• Live Web App: claimtrace-healthkathon.vercel.app",
            "• Local Suite: http://localhost:3000",
            "• Antarmuka interaktif Dual Cockpit & Split-Sync",
            "• Simulator Mobile JKN terintegrasi real-time"
        ]),
        ("T A U T A N  R E P O S I T O R I", [
            "• github.com/lombeytjhtt96-glitch/ClaimTrace",
            "• Kode sumber lengkap (Frontend & Backend)",
            "• Skrip pengujian E2E (99/99 Unit Tests Passed)",
            "• Dokumentasi PRD, Desain & Arsitektur Lengkap"
        ]),
        ("K O N T A K  T I M  T I N E E R E N S E", [
            "• Ketua Tim: Khalaf Faith Pradyatama",
            "• Email: khalaf.pradyatama@gmail.com",
            "• Anggota Tim: Gaudiansyah Abiyu Mahya",
            "• Asal Institusi: MAN 1 Surakarta"
        ])
    ]

    for i, (title_c, bullets_c) in enumerate(closing_cards):
        bx = start_x10 + i * (cw10 + gap10)
        card = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, start_y10, cw10, ch10)
        card.fill.solid()
        card.fill.fore_color.rgb = DARK_CARD_BG
        card.line.color.rgb = EMERALD
        card.line.width = Pt(1.5)
        tf_c = card.text_frame
        tf_c.word_wrap = True
        tf_c.margin_left = Inches(0.2)
        tf_c.margin_right = Inches(0.2)
        tf_c.margin_top = Inches(0.18)

        p1 = tf_c.paragraphs[0]
        p1.text = title_c
        p1.font.size = Pt(9.5)
        p1.font.bold = True
        p1.font.name = FONT_NAME
        p1.font.color.rgb = EMERALD

        for b in bullets_c:
            pb = tf_c.add_paragraph()
            pb.text = b
            pb.font.size = Pt(9.5)
            pb.font.name = FONT_NAME
            pb.font.color.rgb = TEXT_WHITE
            pb.space_before = Pt(3)

    # Footer on Closing
    ft_box = s10.shapes.add_textbox(Inches(0.9), Inches(6.6), Inches(11.5), Inches(0.4))
    p_ft = ft_box.text_frame.paragraphs[0]
    p_ft.text = "Detect Smarter, Protect JKN - Smarter Protection for a Stronger JKN"
    p_ft.font.size = Pt(10.5)
    p_ft.font.italic = True
    p_ft.font.name = FONT_NAME
    p_ft.font.color.rgb = ACCENT_CYAN

    # Save outputs
    out_dir_local = '/home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn'
    out_pptx_1 = os.path.join(out_dir_local, 'ClaimTrace_Healthkathon_2026_Final.pptx')
    prs.save(out_pptx_1)
    print(f"Presentation saved locally to: {out_pptx_1}")

    out_dir_win = '/mnt/c/Users/Asus/Downloads/HealthKathon'
    if os.path.exists(out_dir_win):
        out_pptx_2 = os.path.join(out_dir_win, 'ClaimTrace_Healthkathon_2026_Final.pptx')
        prs.save(out_pptx_2)
        print(f"Presentation saved to Windows folder: {out_pptx_2}")

if __name__ == '__main__':
    build_presentation()
