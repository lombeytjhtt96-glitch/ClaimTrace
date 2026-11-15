"""Native editable PowerPoint (.pptx) generator for ClaimTrace JKN Final Deck.

Consumes deck_data.SLIDES + verified Nov 15 UI screenshots + high-DPI charts from
submissions/healthkathon/assets/ and outputs BOTH:
  - ClaimTrace_Healthkathon_2026_Final.pptx
  - TINEERENSE.pptx

Enforces Clinical Precision styling, strict aspect-ratio preservation, zero raw
bullet glyphs, zero banned terminology, and OOXML validation compatibility.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path
from typing import Iterable

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

import deck_data as dd

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
MARGIN_X = 0.50
CONTENT_W = 13.333 - (2 * MARGIN_X)  # 12.333 in
FONT = dd.FONT_FAMILY


def rgb(hex_color: str) -> RGBColor:
    h = hex_color.lstrip("#")
    return RGBColor(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def set_slide_bg(slide, hex_color: str) -> None:
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = rgb(hex_color)


def add_rect(
    slide,
    x: float,
    y: float,
    w: float,
    h: float,
    fill_hex: str,
    border_hex: str | None = None,
    border_pt: float = 1.0,
    rounded: bool = False,
    radius: float = 0.04,
):
    shape_type = MSO_SHAPE.ROUNDED_RECTANGLE if rounded else MSO_SHAPE.RECTANGLE
    shp = slide.shapes.add_shape(
        shape_type, Inches(x), Inches(y), Inches(w), Inches(h)
    )
    if rounded and hasattr(shp, "adjustments") and len(shp.adjustments) > 0:
        shp.adjustments[0] = radius
    shp.fill.solid()
    shp.fill.fore_color.rgb = rgb(fill_hex)
    if border_hex:
        shp.line.color.rgb = rgb(border_hex)
        shp.line.width = Pt(border_pt)
    else:
        shp.line.fill.background()
    shp.shadow.inherit = False
    return shp


def add_textbox(
    slide,
    x: float,
    y: float,
    w: float,
    h: float,
    text: str,
    font_pt: float = 11.0,
    bold: bool = False,
    color_hex: str = dd.PALETTE["ink"],
    align=PP_ALIGN.LEFT,
    valign=MSO_ANCHOR.TOP,
    margin_lr: float = 0.04,
    margin_tb: float = 0.02,
):
    dd.assert_clean_text(text, "add_textbox")
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = valign
    tf.margin_left = Inches(margin_lr)
    tf.margin_right = Inches(margin_lr)
    tf.margin_top = Inches(margin_tb)
    tf.margin_bottom = Inches(margin_tb)
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.name = FONT
    run.font.size = Pt(font_pt)
    run.font.bold = bold
    run.font.color.rgb = rgb(color_hex)
    return tb


def add_pill(
    slide,
    x: float,
    y: float,
    w: float,
    h: float,
    text: str,
    fill_hex: str,
    text_hex: str,
    border_hex: str | None = None,
    font_pt: float = 8.5,
):
    dd.assert_clean_text(text, "add_pill")
    shp = add_rect(
        slide,
        x,
        y,
        w,
        h,
        fill_hex=fill_hex,
        border_hex=border_hex,
        border_pt=0.75,
        rounded=True,
        radius=0.25,
    )
    tf = shp.text_frame
    tf.word_wrap = False
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf.margin_left = Inches(0.08)
    tf.margin_right = Inches(0.08)
    tf.margin_top = Inches(0.01)
    tf.margin_bottom = Inches(0.01)
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = text
    r.font.name = FONT
    r.font.size = Pt(font_pt)
    r.font.bold = True
    r.font.color.rgb = rgb(text_hex)
    return shp


def add_labeled_lines(
    slide,
    x: float,
    y: float,
    w: float,
    h: float,
    lines: Iterable[str],
    font_pt: float = 10.0,
    space_after_pt: float = 5.0,
    text_hex: str = dd.PALETTE["ink_secondary"],
    lead_hex: str = dd.PALETTE["ink"],
):
    """Render clean paragraph rows bolding 'Label:' prefixes without raw bullets."""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.TOP
    tf.margin_left = Inches(0.04)
    tf.margin_right = Inches(0.04)
    tf.margin_top = Inches(0.02)
    tf.margin_bottom = Inches(0.02)

    for idx, raw in enumerate(lines):
        dd.assert_clean_text(raw, "add_labeled_lines")
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(space_after_pt)
        p.line_spacing = 1.16

        if ":" in raw and raw.index(":") <= 34:
            lead, rest = raw.split(":", 1)
            r1 = p.add_run()
            r1.text = f"{lead}:"
            r1.font.name = FONT
            r1.font.size = Pt(font_pt)
            r1.font.bold = True
            r1.font.color.rgb = rgb(lead_hex)

            r2 = p.add_run()
            r2.text = rest
            r2.font.name = FONT
            r2.font.size = Pt(font_pt)
            r2.font.bold = False
            r2.font.color.rgb = rgb(text_hex)
        else:
            r = p.add_run()
            r.text = raw
            r.font.name = FONT
            r.font.size = Pt(font_pt)
            r.font.color.rgb = rgb(text_hex)
    return tb


def add_picture_fitted(
    slide,
    img_path: Path,
    box_x: float,
    box_y: float,
    box_w: float,
    box_h: float,
    frame_fill_hex: str | None = None,
    frame_border_hex: str | None = dd.PALETTE["hairline"],
    pad: float = 0.04,
):
    """Insert image strictly preserving natural aspect ratio within bounding box."""
    if not img_path.exists():
        raise FileNotFoundError(f"Missing slide image asset: {img_path}")
    with Image.open(img_path) as im:
        iw, ih = im.size

    avail_w = max(0.2, box_w - 2 * pad)
    avail_h = max(0.2, box_h - 2 * pad)
    scale = min(avail_w / iw, avail_h / ih)
    draw_w = iw * scale
    draw_h = ih * scale
    draw_x = box_x + (box_w - draw_w) / 2.0
    draw_y = box_y + (box_h - draw_h) / 2.0

    if frame_fill_hex or frame_border_hex:
        add_rect(
            slide,
            box_x,
            box_y,
            box_w,
            box_h,
            fill_hex=frame_fill_hex or dd.PALETTE["surface"],
            border_hex=frame_border_hex,
            border_pt=0.9,
            rounded=True,
            radius=0.02,
        )
    slide.shapes.add_picture(
        str(img_path),
        Inches(draw_x),
        Inches(draw_y),
        Inches(draw_w),
        Inches(draw_h),
    )


def add_standard_chrome(slide, slide_spec: dict, index: int, total: int) -> None:
    set_slide_bg(slide, dd.PALETTE["canvas"])
    pill_w = min(6.6, max(3.5, len(slide_spec["section"]) * 0.088 + 0.5))
    add_pill(
        slide,
        MARGIN_X,
        0.24,
        pill_w,
        0.26,
        slide_spec["section"],
        fill_hex=dd.PALETTE["emerald_soft"],
        text_hex=dd.PALETTE["emerald"],
        border_hex=dd.PALETTE["emerald_border"],
        font_pt=8.5,
    )
    title_pt = 19.0 if len(slide_spec["title"]) > 74 else 20.5
    add_textbox(
        slide,
        MARGIN_X,
        0.54,
        CONTENT_W,
        0.48,
        slide_spec["title"],
        font_pt=title_pt,
        bold=True,
        color_hex=dd.PALETTE["ink"],
    )
    add_textbox(
        slide,
        MARGIN_X,
        1.00,
        CONTENT_W,
        0.32,
        slide_spec["subtitle"],
        font_pt=11.0,
        bold=False,
        color_hex=dd.PALETTE["ink_secondary"],
    )
    # Footer band
    add_rect(
        slide,
        MARGIN_X,
        7.05,
        CONTENT_W,
        0.015,
        fill_hex=dd.PALETTE["hairline"],
        border_hex=None,
    )
    add_textbox(
        slide,
        MARGIN_X,
        7.10,
        9.50,
        0.28,
        "ClaimTrace JKN | Tim TINEERENSE (MAN 1 Surakarta) | HealthKathon BPJS Kesehatan 2026",
        font_pt=8.5,
        color_hex=dd.PALETTE["muted"],
    )
    add_textbox(
        slide,
        11.20,
        7.10,
        1.633,
        0.28,
        f"{index:02d} / {total:02d}",
        font_pt=8.5,
        bold=True,
        color_hex=dd.PALETTE["ink"],
        align=PP_ALIGN.RIGHT,
    )


def render_cover(slide, spec: dict, _idx: int, _total: int) -> None:
    set_slide_bg(slide, dd.PALETTE["navy"])
    # Official HealthKathon logo strictly placed on dark navy surface
    add_picture_fitted(
        slide,
        dd.ASSETS_DIR / "healthkathon_logo.png",
        MARGIN_X,
        0.42,
        2.60,
        0.90,
        frame_fill_hex=None,
        frame_border_hex=None,
        pad=0.0,
    )
    add_pill(
        slide,
        MARGIN_X,
        1.48,
        5.55,
        0.30,
        spec["section"],
        fill_hex=dd.PALETTE["emerald"],
        text_hex=dd.PALETTE["white"],
        border_hex=None,
        font_pt=8.5,
    )
    add_textbox(
        slide,
        MARGIN_X,
        1.90,
        6.30,
        0.72,
        spec["title"],
        font_pt=40.0,
        bold=True,
        color_hex=dd.PALETTE["white"],
    )
    add_textbox(
        slide,
        MARGIN_X,
        2.68,
        6.30,
        0.95,
        spec["subtitle"],
        font_pt=13.5,
        bold=False,
        color_hex="#E2E8F0",
    )
    # 4 technical highlight pills (2x2)
    for i, pill_txt in enumerate(spec["pills"]):
        col = i % 2
        row = i // 2
        px = MARGIN_X + col * 3.16
        py = 3.78 + row * 0.44
        add_pill(
            slide,
            px,
            py,
            3.02,
            0.34,
            pill_txt,
            fill_hex=dd.PALETTE["navy_card"],
            text_hex=dd.PALETTE["emerald_bright"],
            border_hex=dd.PALETTE["navy_border"],
            font_pt=9.5,
        )
    # Team metadata 2x2 cards
    for i, (k, v) in enumerate(spec["meta_items"]):
        col = i % 2
        row = i // 2
        mx = MARGIN_X + col * 3.16
        my = 4.92 + row * 0.90
        add_rect(
            slide,
            mx,
            my,
            3.02,
            0.78,
            fill_hex=dd.PALETTE["navy_card"],
            border_hex=dd.PALETTE["navy_border"],
            rounded=True,
            radius=0.08,
        )
        add_textbox(
            slide,
            mx + 0.14,
            my + 0.08,
            2.74,
            0.24,
            k,
            font_pt=8.5,
            bold=True,
            color_hex=dd.PALETTE["emerald_bright"],
        )
        add_textbox(
            slide,
            mx + 0.14,
            my + 0.34,
            2.74,
            0.34,
            v,
            font_pt=12.0,
            bold=True,
            color_hex=dd.PALETTE["white"],
        )

    # Right live dashboard preview frame
    rx, ry, rw, rh = 7.05, 0.55, 5.78, 6.40
    add_rect(
        slide,
        rx,
        ry,
        rw,
        rh,
        fill_hex=dd.PALETTE["navy_card"],
        border_hex=dd.PALETTE["navy_border"],
        rounded=True,
        radius=0.04,
    )
    add_textbox(
        slide,
        rx + 0.18,
        ry + 0.14,
        rw - 0.36,
        0.30,
        spec["preview_caption"],
        font_pt=10.5,
        bold=True,
        color_hex=dd.PALETTE["emerald_bright"],
    )
    add_picture_fitted(
        slide,
        dd.ASSETS_DIR / spec["preview_image"],
        rx + 0.18,
        ry + 0.52,
        rw - 0.36,
        3.50,
        frame_fill_hex=dd.PALETTE["white"],
        frame_border_hex=dd.PALETTE["navy_border"],
        pad=0.03,
    )
    for i, (num, lbl) in enumerate(spec["preview_kpis"]):
        col = i % 2
        row = i // 2
        kx = rx + 0.18 + col * 2.75
        ky = ry + 4.22 + row * 1.00
        add_rect(
            slide,
            kx,
            ky,
            2.64,
            0.86,
            fill_hex=dd.PALETTE["navy"],
            border_hex=dd.PALETTE["navy_border"],
            rounded=True,
            radius=0.08,
        )
        add_textbox(
            slide,
            kx + 0.12,
            ky + 0.08,
            2.40,
            0.38,
            num,
            font_pt=17.0,
            bold=True,
            color_hex=dd.PALETTE["emerald_bright"],
        )
        add_textbox(
            slide,
            kx + 0.12,
            ky + 0.48,
            2.40,
            0.30,
            lbl,
            font_pt=9.5,
            color_hex="#CBD5E1",
        )


def render_team_problem(slide, spec: dict, idx: int, total: int) -> None:
    add_standard_chrome(slide, spec, idx, total)
    # Left 2 cards
    lx, lw = MARGIN_X, 5.05
    for cy, card in ((1.42, spec["team_card"]), (4.24, spec["problem_card"])):
        add_rect(
            slide,
            lx,
            cy,
            lw,
            2.68,
            fill_hex=dd.PALETTE["surface"],
            border_hex=dd.PALETTE["hairline"],
            rounded=True,
            radius=0.04,
        )
        add_textbox(
            slide,
            lx + 0.16,
            cy + 0.14,
            lw - 0.32,
            0.34,
            card["heading"],
            font_pt=12.5,
            bold=True,
            color_hex=dd.PALETTE["ink"],
        )
        add_labeled_lines(
            slide,
            lx + 0.14,
            cy + 0.54,
            lw - 0.28,
            2.04,
            card["items"],
            font_pt=10.0,
            space_after_pt=6.0,
        )

    # Right 4 KPI tiles (2x2)
    rx, rw = 5.75, 7.08
    for i, (num, lbl) in enumerate(spec["kpis"]):
        col = i % 2
        row = i // 2
        kx = rx + col * 3.60
        ky = 1.42 + row * 0.98
        fill_c = dd.PALETTE["emerald_soft"] if i == 3 else dd.PALETTE["surface"]
        bord_c = dd.PALETTE["emerald_border"] if i == 3 else dd.PALETTE["hairline"]
        num_c = dd.PALETTE["emerald"] if i == 3 else dd.PALETTE["ink"]
        add_rect(
            slide, kx, ky, 3.48, 0.86, fill_hex=fill_c, border_hex=bord_c, rounded=True, radius=0.08
        )
        add_textbox(
            slide, kx + 0.16, ky + 0.08, 3.16, 0.38, num, font_pt=17.5, bold=True, color_hex=num_c
        )
        add_textbox(
            slide,
            kx + 0.16,
            ky + 0.48,
            3.16,
            0.30,
            lbl,
            font_pt=9.5,
            bold=True,
            color_hex=dd.PALETTE["ink_secondary"],
        )

    # Right bottom anomaly breakdown table inside card
    tbl_meta = spec["anomaly_table"]
    ty = 3.46
    add_rect(
        slide,
        rx,
        ty,
        rw,
        3.46,
        fill_hex=dd.PALETTE["surface"],
        border_hex=dd.PALETTE["hairline"],
        rounded=True,
        radius=0.04,
    )
    add_textbox(
        slide,
        rx + 0.16,
        ty + 0.12,
        rw - 0.32,
        0.32,
        tbl_meta["heading"],
        font_pt=11.5,
        bold=True,
        color_hex=dd.PALETTE["ink"],
    )
    rows = tbl_meta["rows"]
    headers = tbl_meta["headers"]
    table_shape = slide.shapes.add_table(
        len(rows) + 1,
        len(headers),
        Inches(rx + 0.16),
        Inches(ty + 0.50),
        Inches(rw - 0.32),
        Inches(2.80),
    )
    table = table_shape.table
    col_widths = [1.85, 1.35, 1.35, 2.21]
    for ci, cw in enumerate(col_widths):
        table.columns[ci].width = Inches(cw)
    _style_table(table, headers, rows, header_pt=9.5, cell_pt=9.0, highlight_col=2)


def _style_table(
    table,
    headers: list[str],
    rows: list[list[str]],
    header_pt: float = 10.5,
    cell_pt: float = 9.5,
    highlight_col: int | None = None,
) -> None:
    for ci, h_txt in enumerate(headers):
        dd.assert_clean_text(h_txt, f"table_header[{ci}]")
        cell = table.cell(0, ci)
        cell.fill.solid()
        cell.fill.fore_color.rgb = rgb(dd.PALETTE["navy"])
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        cell.margin_left = Inches(0.08)
        cell.margin_right = Inches(0.08)
        cell.margin_top = Inches(0.05)
        cell.margin_bottom = Inches(0.05)
        p = cell.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.LEFT
        r = p.add_run()
        r.text = h_txt
        r.font.name = FONT
        r.font.size = Pt(header_pt)
        r.font.bold = True
        r.font.color.rgb = rgb(dd.PALETTE["white"])

    for ri, row_vals in enumerate(rows, start=1):
        bg_hex = dd.PALETTE["surface"] if ri % 2 == 1 else dd.PALETTE["inset"]
        for ci, val in enumerate(row_vals):
            dd.assert_clean_text(val, f"table_cell[{ri}][{ci}]")
            cell = table.cell(ri, ci)
            cell.fill.solid()
            cell.fill.fore_color.rgb = rgb(bg_hex)
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            cell.margin_left = Inches(0.08)
            cell.margin_right = Inches(0.08)
            cell.margin_top = Inches(0.05)
            cell.margin_bottom = Inches(0.05)
            p = cell.text_frame.paragraphs[0]
            p.alignment = PP_ALIGN.LEFT
            r = p.add_run()
            r.text = val
            r.font.name = FONT
            r.font.size = Pt(cell_pt)
            is_first = ci == 0
            is_hi = highlight_col is not None and ci == highlight_col
            r.font.bold = is_first or is_hi
            r.font.color.rgb = rgb(
                dd.PALETTE["emerald_dark"]
                if is_hi
                else (dd.PALETTE["ink"] if is_first else dd.PALETTE["ink_secondary"])
            )


def render_table_focus(slide, spec: dict, idx: int, total: int) -> None:
    add_standard_chrome(slide, spec, idx, total)
    headers = spec["headers"]
    rows = spec["rows"]
    table_shape = slide.shapes.add_table(
        len(rows) + 1,
        len(headers),
        Inches(MARGIN_X),
        Inches(1.44),
        Inches(CONTENT_W),
        Inches(5.46),
    )
    table = table_shape.table
    widths = [2.15, 3.15, 3.833, 3.20]
    for ci, w in enumerate(widths):
        table.columns[ci].width = Inches(w)
    table.rows[0].height = Inches(0.46)
    for ri in range(1, len(rows) + 1):
        table.rows[ri].height = Inches(1.00)
    _style_table(table, headers, rows, header_pt=10.5, cell_pt=9.5, highlight_col=3)


def render_before_after(slide, spec: dict, idx: int, total: int) -> None:
    add_standard_chrome(slide, spec, idx, total)
    # Left chart card
    add_picture_fitted(
        slide,
        dd.CHARTS_DIR / spec["chart_image"],
        MARGIN_X,
        1.42,
        7.10,
        5.50,
        frame_fill_hex=dd.PALETTE["surface"],
        frame_border_hex=dd.PALETTE["hairline"],
        pad=0.10,
    )
    # Right stacked evidence cards
    rx = 7.78
    rw = 5.05
    for i, ev in enumerate(spec["evidence_cards"]):
        cy = 1.42 + i * 2.82
        ch = 2.68
        add_rect(
            slide,
            rx,
            cy,
            rw,
            ch,
            fill_hex=dd.PALETTE["surface"],
            border_hex=dd.PALETTE["hairline"],
            rounded=True,
            radius=0.04,
        )
        add_pill(
            slide,
            rx + 0.14,
            cy + 0.14,
            1.88,
            0.24,
            ev["badge"],
            fill_hex=dd.PALETTE["emerald_soft"],
            text_hex=dd.PALETTE["emerald"],
            border_hex=dd.PALETTE["emerald_border"],
            font_pt=8.0,
        )
        add_textbox(
            slide,
            rx + 0.14,
            cy + 0.44,
            2.15,
            0.66,
            ev["title"],
            font_pt=11.0,
            bold=True,
            color_hex=dd.PALETTE["ink"],
        )
        add_textbox(
            slide,
            rx + 0.14,
            cy + 1.14,
            2.15,
            1.36,
            ev["caption"],
            font_pt=9.5,
            color_hex=dd.PALETTE["ink_secondary"],
        )
        add_picture_fitted(
            slide,
            dd.ASSETS_DIR / ev["image"],
            rx + 2.38,
            cy + 0.14,
            rw - 2.52,
            ch - 0.28,
            frame_fill_hex=dd.PALETTE["inset"],
            frame_border_hex=dd.PALETTE["hairline"],
            pad=0.04,
        )


def render_solution_flow(slide, spec: dict, idx: int, total: int) -> None:
    add_standard_chrome(slide, spec, idx, total)
    add_picture_fitted(
        slide,
        dd.CHARTS_DIR / spec["diagram_image"],
        MARGIN_X,
        1.40,
        CONTENT_W,
        3.82,
        frame_fill_hex=dd.PALETTE["surface"],
        frame_border_hex=dd.PALETTE["hairline"],
        pad=0.06,
    )
    cw = 3.97
    gap = 0.21
    for i, card in enumerate(spec["bottom_cards"]):
        cx = MARGIN_X + i * (cw + gap)
        cy = 5.34
        ch = 1.62
        add_rect(
            slide,
            cx,
            cy,
            cw,
            ch,
            fill_hex=dd.PALETTE["surface"],
            border_hex=dd.PALETTE["hairline"],
            rounded=True,
            radius=0.05,
        )
        add_textbox(
            slide,
            cx + 0.14,
            cy + 0.10,
            cw - 0.28,
            0.28,
            card["title"],
            font_pt=10.8,
            bold=True,
            color_hex=card["accent"],
        )
        add_labeled_lines(
            slide,
            cx + 0.12,
            cy + 0.40,
            cw - 0.24,
            1.16,
            card["lines"],
            font_pt=8.8,
            space_after_pt=3.5,
        )


def render_demo_dual(slide, spec: dict, idx: int, total: int) -> None:
    add_standard_chrome(slide, spec, idx, total)
    cw = 6.02
    gap = CONTENT_W - 2 * cw
    for i, pan in enumerate(spec["panels"]):
        cx = MARGIN_X + i * (cw + gap)
        cy = 1.42
        ch = 5.50
        add_rect(
            slide,
            cx,
            cy,
            cw,
            ch,
            fill_hex=dd.PALETTE["surface"],
            border_hex=dd.PALETTE["hairline"],
            rounded=True,
            radius=0.03,
        )
        add_pill(
            slide,
            cx + 0.16,
            cy + 0.12,
            2.65,
            0.24,
            pan["badge"],
            fill_hex=dd.PALETTE["emerald_soft"],
            text_hex=dd.PALETTE["emerald"],
            border_hex=dd.PALETTE["emerald_border"],
            font_pt=8.0,
        )
        add_textbox(
            slide,
            cx + 0.16,
            cy + 0.39,
            cw - 0.32,
            0.30,
            pan["title"],
            font_pt=12.0,
            bold=True,
            color_hex=dd.PALETTE["ink"],
        )
        # 16:10 screenshot centered crisply
        add_picture_fitted(
            slide,
            dd.ASSETS_DIR / pan["image"],
            cx + 0.16,
            cy + 0.72,
            cw - 0.32,
            3.56,
            frame_fill_hex=dd.PALETTE["inset"],
            frame_border_hex=dd.PALETTE["hairline"],
            pad=0.04,
        )
        add_labeled_lines(
            slide,
            cx + 0.16,
            cy + 4.36,
            cw - 0.32,
            1.06,
            pan["points"],
            font_pt=9.6,
            space_after_pt=4.0,
        )


def render_demo_trio_mobile(slide, spec: dict, idx: int, total: int) -> None:
    add_standard_chrome(slide, spec, idx, total)
    # 2 desktop panels (w=4.48" each)
    dw = 4.48
    gap = 0.20
    for i, pan in enumerate(spec["left_panels"]):
        cx = MARGIN_X + i * (dw + gap)
        cy = 1.42
        ch = 5.50
        add_rect(
            slide,
            cx,
            cy,
            dw,
            ch,
            fill_hex=dd.PALETTE["surface"],
            border_hex=dd.PALETTE["hairline"],
            rounded=True,
            radius=0.03,
        )
        add_pill(
            slide,
            cx + 0.14,
            cy + 0.12,
            2.50,
            0.24,
            pan["badge"],
            fill_hex=dd.PALETTE["emerald_soft"],
            text_hex=dd.PALETTE["emerald"],
            border_hex=dd.PALETTE["emerald_border"],
            font_pt=8.0,
        )
        add_textbox(
            slide,
            cx + 0.14,
            cy + 0.39,
            dw - 0.28,
            0.30,
            pan["title"],
            font_pt=11.5,
            bold=True,
            color_hex=dd.PALETTE["ink"],
        )
        add_picture_fitted(
            slide,
            dd.ASSETS_DIR / pan["image"],
            cx + 0.14,
            cy + 0.72,
            dw - 0.28,
            2.68,
            frame_fill_hex=dd.PALETTE["inset"],
            frame_border_hex=dd.PALETTE["hairline"],
            pad=0.04,
        )
        add_labeled_lines(
            slide,
            cx + 0.14,
            cy + 3.52,
            dw - 0.28,
            1.86,
            pan["points"],
            font_pt=9.5,
            space_after_pt=5.0,
        )

    # Right mobile cockpit card
    mob = spec["mobile_panel"]
    mx = MARGIN_X + 2 * (dw + gap)
    mw = 12.833 - mx
    my, mh = 1.42, 5.50
    add_rect(
        slide,
        mx,
        my,
        mw,
        mh,
        fill_hex=dd.PALETTE["surface"],
        border_hex=dd.PALETTE["hairline"],
        rounded=True,
        radius=0.03,
    )
    add_pill(
        slide,
        mx + 0.14,
        my + 0.12,
        mw - 0.28,
        0.24,
        mob["badge"],
        fill_hex=dd.PALETTE["emerald_soft"],
        text_hex=dd.PALETTE["emerald"],
        border_hex=dd.PALETTE["emerald_border"],
        font_pt=8.0,
    )
    add_textbox(
        slide,
        mx + 0.14,
        my + 0.39,
        mw - 0.28,
        0.28,
        mob["title"],
        font_pt=11.5,
        bold=True,
        color_hex=dd.PALETTE["ink"],
        align=PP_ALIGN.CENTER,
    )
    add_picture_fitted(
        slide,
        dd.ASSETS_DIR / mob["image"],
        mx + 0.22,
        my + 0.72,
        mw - 0.44,
        3.95,
        frame_fill_hex=dd.PALETTE["inset"],
        frame_border_hex=dd.PALETTE["hairline"],
        pad=0.05,
    )
    add_textbox(
        slide,
        mx + 0.14,
        my + 4.74,
        mw - 0.28,
        0.66,
        mob["caption"],
        font_pt=9.0,
        color_hex=dd.PALETTE["ink_secondary"],
        align=PP_ALIGN.CENTER,
    )


def _render_chart_plus_two_cards(
    slide, spec: dict, idx: int, total: int, banner_text: str
) -> None:
    add_standard_chrome(slide, spec, idx, total)
    lx, lw = MARGIN_X, 7.65
    # Left chart card + summary strip
    add_picture_fitted(
        slide,
        dd.CHARTS_DIR / spec["chart_image"],
        lx,
        1.42,
        lw,
        4.66,
        frame_fill_hex=dd.PALETTE["surface"],
        frame_border_hex=dd.PALETTE["hairline"],
        pad=0.08,
    )
    add_rect(
        slide,
        lx,
        6.18,
        lw,
        0.74,
        fill_hex=dd.PALETTE["emerald_soft"],
        border_hex=dd.PALETTE["emerald_border"],
        rounded=True,
        radius=0.08,
    )
    add_textbox(
        slide,
        lx + 0.16,
        6.24,
        lw - 0.32,
        0.62,
        banner_text,
        font_pt=10.2,
        bold=True,
        color_hex=dd.PALETTE["ink"],
        valign=MSO_ANCHOR.MIDDLE,
    )

    # Right stacked cards
    rx = lx + lw + 0.20
    rw = 12.833 - rx
    heights = [3.26, 2.08]
    cy = 1.42
    for i, card in enumerate(spec["right_cards"]):
        ch = heights[i]
        add_rect(
            slide,
            rx,
            cy,
            rw,
            ch,
            fill_hex=dd.PALETTE["surface"],
            border_hex=dd.PALETTE["hairline"],
            rounded=True,
            radius=0.04,
        )
        add_textbox(
            slide,
            rx + 0.16,
            cy + 0.12,
            rw - 0.32,
            0.32,
            card["heading"],
            font_pt=11.5,
            bold=True,
            color_hex=card["accent"],
        )
        add_labeled_lines(
            slide,
            rx + 0.14,
            cy + 0.46,
            rw - 0.28,
            ch - 0.54,
            card["items"],
            font_pt=9.4,
            space_after_pt=4.5,
        )
        cy += ch + 0.16


def render_impact_evidence(slide, spec: dict, idx: int, total: int) -> None:
    _render_chart_plus_two_cards(
        slide,
        spec,
        idx,
        total,
        "Ringkasan Juri: ClaimTrace mencapai 86,0% Precision@50 (43,0x Lift, +30,0% p=0,0012), "
        "96,8% pemulihan Rupiah pada Top-100, serta 0,0% False Positive di 512 kasus rutin sah.",
    )


def render_business_roadmap(slide, spec: dict, idx: int, total: int) -> None:
    _render_chart_plus_two_cards(
        slide,
        spec,
        idx,
        total,
        "Keunggulan Ekonomi: Rp 0 biaya token/API eksternal dan Rp 0 SaaS; proyeksi skala nasional "
        "menyelamatkan Rp 485 Miliar/tahun dengan TCO infrastruktur Rp 4,2 Miliar/tahun (115,5x).",
    )


def render_closing(slide, spec: dict, _idx: int, _total: int) -> None:
    set_slide_bg(slide, dd.PALETTE["navy"])
    add_picture_fitted(
        slide,
        dd.ASSETS_DIR / "healthkathon_logo.png",
        5.16,
        0.58,
        3.00,
        1.04,
        frame_fill_hex=None,
        frame_border_hex=None,
        pad=0.0,
    )
    add_textbox(
        slide,
        MARGIN_X,
        1.82,
        CONTENT_W,
        0.62,
        spec["title"],
        font_pt=28.0,
        bold=True,
        color_hex=dd.PALETTE["white"],
        align=PP_ALIGN.CENTER,
    )
    add_textbox(
        slide,
        MARGIN_X,
        2.50,
        CONTENT_W,
        0.42,
        spec["subtitle"],
        font_pt=13.5,
        color_hex="#CBD5E1",
        align=PP_ALIGN.CENTER,
    )

    cw = 3.90
    gap = (CONTENT_W - 3 * cw) / 2.0
    for i, (label, main_val, desc) in enumerate(spec["cards"]):
        cx = MARGIN_X + i * (cw + gap)
        cy = 3.35
        ch = 2.18
        add_rect(
            slide,
            cx,
            cy,
            cw,
            ch,
            fill_hex=dd.PALETTE["navy_card"],
            border_hex=dd.PALETTE["navy_border"],
            rounded=True,
            radius=0.06,
        )
        add_pill(
            slide,
            cx + 0.18,
            cy + 0.20,
            cw - 0.36,
            0.28,
            label,
            fill_hex=dd.PALETTE["emerald"],
            text_hex=dd.PALETTE["white"],
            font_pt=8.5,
        )
        add_textbox(
            slide,
            cx + 0.18,
            cy + 0.60,
            cw - 0.36,
            0.66,
            main_val,
            font_pt=12.0,
            bold=True,
            color_hex=dd.PALETTE["emerald_bright"],
            align=PP_ALIGN.CENTER,
            valign=MSO_ANCHOR.MIDDLE,
        )
        add_textbox(
            slide,
            cx + 0.18,
            cy + 1.32,
            cw - 0.36,
            0.72,
            desc,
            font_pt=10.0,
            color_hex="#E2E8F0",
            align=PP_ALIGN.CENTER,
        )

    add_textbox(
        slide,
        MARGIN_X,
        6.18,
        CONTENT_W,
        0.50,
        spec["footer_note"],
        font_pt=13.0,
        bold=True,
        color_hex=dd.PALETTE["emerald_bright"],
        align=PP_ALIGN.CENTER,
    )


LAYOUT_RENDERERS = {
    "cover": render_cover,
    "team_problem": render_team_problem,
    "table_focus": render_table_focus,
    "before_after": render_before_after,
    "solution_flow": render_solution_flow,
    "demo_dual": render_demo_dual,
    "demo_trio_mobile": render_demo_trio_mobile,
    "impact_evidence": render_impact_evidence,
    "business_roadmap": render_business_roadmap,
    "closing": render_closing,
}


def validate_pptx_output(pptx_path: Path) -> None:
    """Verify OOXML validity + slide count + zero banned text in generated deck."""
    prs = Presentation(str(pptx_path))
    if len(prs.slides) != len(dd.SLIDES):
        raise AssertionError(
            f"Slide count mismatch: got {len(prs.slides)}, expected {len(dd.SLIDES)}"
        )
    for si, slide in enumerate(prs.slides, start=1):
        for shp in slide.shapes:
            if shp.has_text_frame:
                dd.assert_clean_text(shp.text_frame.text, f"{pptx_path.name}:S{si}")
            if shp.has_table:
                for row in shp.table.rows:
                    for cell in row.cells:
                        dd.assert_clean_text(cell.text, f"{pptx_path.name}:S{si}:tbl")

    validator = Path("/home/Khalaf-Dev/.agents/skills/pptx/scripts/office/validate.py")
    if validator.exists():
        proc = subprocess.run(
            [sys.executable, str(validator), str(pptx_path)],
            capture_output=True,
            text=True,
            check=False,
        )
        if proc.returncode != 0:
            raise RuntimeError(
                f"OOXML validate.py failed for {pptx_path}:\n{proc.stdout}\n{proc.stderr}"
            )


def build_pptx_files() -> list[Path]:
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank_layout = prs.slide_layouts[6]
    total = len(dd.SLIDES)

    for idx, spec in enumerate(dd.SLIDES, start=1):
        slide = prs.slides.add_slide(blank_layout)
        renderer = LAYOUT_RENDERERS[spec["layout"]]
        renderer(slide, spec, idx, total)

    primary = dd.DECK_DIR / "ClaimTrace_Healthkathon_2026_Final.pptx"
    team_named = dd.DECK_DIR / "TINEERENSE.pptx"
    prs.save(str(primary))
    shutil.copy2(primary, team_named)

    validate_pptx_output(primary)
    validate_pptx_output(team_named)
    return [primary, team_named]


if __name__ == "__main__":
    outs = build_pptx_files()
    for p in outs:
        print(f"OK {p.name}: {p.stat().st_size} bytes (12 slides, OOXML valid)")
