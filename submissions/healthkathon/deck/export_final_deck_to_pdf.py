"""Pixel-synchronized 16:9 PDF exporter for ClaimTrace JKN Final Deck.

Consumes the exact same deck_data.SLIDES, assets/ screenshots, and
assets/charts/ figures as build_final_deck.py so ClaimTrace_Healthkathon_2026_Final.pdf
and TINEERENSE.pdf stay 100% identical to the editable .pptx deck.

Prints via headless Chromium (13.333in x 7.5in) and validates page count,
<= 15 MB size limit, and zero banned substrings via pdftotext/pypdf.
"""

from __future__ import annotations

import html
import shutil
import subprocess
from pathlib import Path

from pypdf import PdfReader

import deck_data as dd

MAX_PDF_BYTES = 15 * 1024 * 1024


def _esc(val: str) -> str:
    return html.escape(val, quote=True)


def _fmt_labeled_lines(items: list[str], extra_cls: str = "") -> str:
    out = []
    for raw in items:
        dd.assert_clean_text(raw, "pdf_labeled_line")
        if ":" in raw and raw.index(":") <= 34:
            lead, rest = raw.split(":", 1)
            out.append(
                f'<div class="bullet-row {extra_cls}">'
                f'<strong class="lead">{_esc(lead)}:</strong>{_esc(rest)}'
                f"</div>"
            )
        else:
            out.append(f'<div class="bullet-row {extra_cls}">{_esc(raw)}</div>')
    return "".join(out)


def _img_uri(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"Missing image asset for PDF: {path}")
    return f"file://{path}"


def _chrome_header(spec: dict) -> str:
    title_sz = "19pt" if len(spec["title"]) > 74 else "20.5pt"
    return f"""
    <div class="header-zone">
      <div class="section-pill">{_esc(spec["section"])}</div>
      <h1 class="slide-title" style="font-size:{title_sz};">{_esc(spec["title"])}</h1>
      <div class="slide-sub">{_esc(spec["subtitle"])}</div>
    </div>"""


def _chrome_footer(idx: int, total: int) -> str:
    return f"""
    <div class="footer-zone">
      <span>ClaimTrace JKN | Tim TINEERENSE (MAN 1 Surakarta) | HealthKathon BPJS Kesehatan 2026</span>
      <strong>{idx:02d} / {total:02d}</strong>
    </div>"""


def _html_cover(spec: dict, _idx: int, _total: int) -> str:
    pills = "".join(
        f'<div class="cover-pill">{_esc(p)}</div>' for p in spec["pills"]
    )
    meta = "".join(
        f"""<div class="cover-meta-card">
          <div class="meta-k">{_esc(k)}</div>
          <div class="meta-v">{_esc(v)}</div>
        </div>"""
        for k, v in spec["meta_items"]
    )
    kpis = "".join(
        f"""<div class="cover-kpi-card">
          <div class="kpi-v">{_esc(n)}</div>
          <div class="kpi-l">{_esc(l)}</div>
        </div>"""
        for n, l in spec["preview_kpis"]
    )
    return f"""
    <section class="slide slide-navy">
      <div class="cover-grid">
        <div class="cover-left">
          <img class="hk-logo" src="{_img_uri(dd.ASSETS_DIR / 'healthkathon_logo.png')}" alt="HealthKathon 2026" />
          <div class="cover-badge">{_esc(spec["section"])}</div>
          <h1 class="cover-title">{_esc(spec["title"])}</h1>
          <p class="cover-sub">{_esc(spec["subtitle"])}</p>
          <div class="cover-pills-grid">{pills}</div>
          <div class="cover-meta-grid">{meta}</div>
        </div>
        <div class="cover-right">
          <div class="cover-preview-title">{_esc(spec["preview_caption"])}</div>
          <div class="cover-shot-frame">
            <img src="{_img_uri(dd.ASSETS_DIR / spec['preview_image'])}" alt="Dashboard" />
          </div>
          <div class="cover-kpis-grid">{kpis}</div>
        </div>
      </div>
    </section>"""


def _html_team_problem(spec: dict, idx: int, total: int) -> str:
    kpis_html = []
    for i, (num, lbl) in enumerate(spec["kpis"]):
        hl = " kpi-highlight" if i == 3 else ""
        kpis_html.append(
            f'<div class="kpi-tile{hl}"><div class="kpi-num">{_esc(num)}</div><div class="kpi-lbl">{_esc(lbl)}</div></div>'
        )
    tbl = spec["anomaly_table"]
    ths = "".join(f"<th>{_esc(h)}</th>" for h in tbl["headers"])
    trs = []
    for r in tbl["rows"]:
        tds = "".join(
            f'<td class="{"col-strong" if ci == 0 else ("col-em" if ci == 2 else "")}">{_esc(c)}</td>'
            for ci, c in enumerate(r)
        )
        trs.append(f"<tr>{tds}</tr>")

    return f"""
    <section class="slide slide-light">
      {_chrome_header(spec)}
      <div class="content-area team-grid">
        <div class="stack-col">
          <div class="card">
            <div class="card-h">{_esc(spec["team_card"]["heading"])}</div>
            {_fmt_labeled_lines(spec["team_card"]["items"])}
          </div>
          <div class="card">
            <div class="card-h">{_esc(spec["problem_card"]["heading"])}</div>
            {_fmt_labeled_lines(spec["problem_card"]["items"])}
          </div>
        </div>
        <div class="stack-col-right">
          <div class="kpi-grid-2x2">{"".join(kpis_html)}</div>
          <div class="card table-card">
            <div class="card-h" style="margin-bottom:0.08in;">{_esc(tbl["heading"])}</div>
            <table class="cp-table compact-table">
              <thead><tr>{ths}</tr></thead>
              <tbody>{"".join(trs)}</tbody>
            </table>
          </div>
        </div>
      </div>
      {_chrome_footer(idx, total)}
    </section>"""


def _html_table_focus(spec: dict, idx: int, total: int) -> str:
    ths = "".join(f"<th>{_esc(h)}</th>" for h in spec["headers"])
    trs = []
    for r in spec["rows"]:
        tds = "".join(
            f'<td class="{"col-strong" if ci == 0 else ("col-em" if ci == 3 else "")}">{_esc(c)}</td>'
            for ci, c in enumerate(r)
        )
        trs.append(f"<tr>{tds}</tr>")
    return f"""
    <section class="slide slide-light">
      {_chrome_header(spec)}
      <div class="content-area">
        <table class="cp-table matrix-table">
          <colgroup>
            <col style="width:17.5%;" />
            <col style="width:25.5%;" />
            <col style="width:31.0%;" />
            <col style="width:26.0%;" />
          </colgroup>
          <thead><tr>{ths}</tr></thead>
          <tbody>{"".join(trs)}</tbody>
        </table>
      </div>
      {_chrome_footer(idx, total)}
    </section>"""


def _html_before_after(spec: dict, idx: int, total: int) -> str:
    cards = []
    for ev in spec["evidence_cards"]:
        cards.append(
            f"""<div class="card ev-card">
              <div class="ev-text">
                <div class="mini-pill">{_esc(ev["badge"])}</div>
                <div class="ev-title">{_esc(ev["title"])}</div>
                <div class="ev-cap">{_esc(ev["caption"])}</div>
              </div>
              <div class="ev-img-box">
                <img src="{_img_uri(dd.ASSETS_DIR / ev['image'])}" alt="{_esc(ev['title'])}" />
              </div>
            </div>"""
        )
    return f"""
    <section class="slide slide-light">
      {_chrome_header(spec)}
      <div class="content-area ba-grid">
        <div class="card chart-frame">
          <img src="{_img_uri(dd.CHARTS_DIR / spec['chart_image'])}" alt="Coaching Delta" />
        </div>
        <div class="ev-stack">{"".join(cards)}</div>
      </div>
      {_chrome_footer(idx, total)}
    </section>"""


def _html_solution_flow(spec: dict, idx: int, total: int) -> str:
    cards = []
    for c in spec["bottom_cards"]:
        cards.append(
            f"""<div class="card sol-card">
              <div class="card-h" style="font-size:10.8pt;color:{c['accent']};">{_esc(c["title"])}</div>
              {_fmt_labeled_lines(c["lines"], "small-row")}
            </div>"""
        )
    return f"""
    <section class="slide slide-light">
      {_chrome_header(spec)}
      <div class="content-area sol-layout">
        <div class="card diagram-frame">
          <img src="{_img_uri(dd.CHARTS_DIR / spec['diagram_image'])}" alt="Architecture Diagram" />
        </div>
        <div class="sol-bottom-grid">{"".join(cards)}</div>
      </div>
      {_chrome_footer(idx, total)}
    </section>"""


def _html_demo_dual(spec: dict, idx: int, total: int) -> str:
    panels = []
    for p in spec["panels"]:
        panels.append(
            f"""<div class="card demo-card">
              <div class="mini-pill">{_esc(p["badge"])}</div>
              <div class="demo-title">{_esc(p["title"])}</div>
              <div class="demo-shot-box">
                <img src="{_img_uri(dd.ASSETS_DIR / p['image'])}" alt="{_esc(p['title'])}" />
              </div>
              <div class="demo-points">{_fmt_labeled_lines(p["points"], "demo-row")}</div>
            </div>"""
        )
    return f"""
    <section class="slide slide-light">
      {_chrome_header(spec)}
      <div class="content-area dual-grid">{"".join(panels)}</div>
      {_chrome_footer(idx, total)}
    </section>"""


def _html_demo_trio_mobile(spec: dict, idx: int, total: int) -> str:
    lefts = []
    for p in spec["left_panels"]:
        lefts.append(
            f"""<div class="card demo-card">
              <div class="mini-pill">{_esc(p["badge"])}</div>
              <div class="demo-title">{_esc(p["title"])}</div>
              <div class="trio-shot-box">
                <img src="{_img_uri(dd.ASSETS_DIR / p['image'])}" alt="{_esc(p['title'])}" />
              </div>
              <div class="demo-points">{_fmt_labeled_lines(p["points"], "demo-row")}</div>
            </div>"""
        )
    mob = spec["mobile_panel"]
    return f"""
    <section class="slide slide-light">
      {_chrome_header(spec)}
      <div class="content-area trio-grid">
        {"".join(lefts)}
        <div class="card demo-card mobile-card">
          <div class="mini-pill" style="text-align:center;">{_esc(mob["badge"])}</div>
          <div class="demo-title" style="text-align:center;">{_esc(mob["title"])}</div>
          <div class="mobile-shot-box">
            <img src="{_img_uri(dd.ASSETS_DIR / mob['image'])}" alt="Mobile Cockpit" />
          </div>
          <div class="mobile-cap">{_esc(mob["caption"])}</div>
        </div>
      </div>
      {_chrome_footer(idx, total)}
    </section>"""


def _html_chart_plus_cards(
    spec: dict, idx: int, total: int, banner: str
) -> str:
    right = []
    for i, card in enumerate(spec["right_cards"]):
        cls = "card-tall" if i == 0 else "card-short"
        right.append(
            f"""<div class="card {cls}">
              <div class="card-h" style="color:{card['accent']};">{_esc(card["heading"])}</div>
              {_fmt_labeled_lines(card["items"], "evidence-row")}
            </div>"""
        )
    return f"""
    <section class="slide slide-light">
      {_chrome_header(spec)}
      <div class="content-area chart-cards-grid">
        <div class="chart-left-col">
          <div class="card chart-frame-tall">
            <img src="{_img_uri(dd.CHARTS_DIR / spec['chart_image'])}" alt="Benchmark Chart" />
          </div>
          <div class="emerald-banner">{_esc(banner)}</div>
        </div>
        <div class="chart-right-col">{"".join(right)}</div>
      </div>
      {_chrome_footer(idx, total)}
    </section>"""


def _html_impact_evidence(spec: dict, idx: int, total: int) -> str:
    return _html_chart_plus_cards(
        spec,
        idx,
        total,
        "Ringkasan Juri: ClaimTrace mencapai 86,0% Precision@50 (43,0x Lift, +30,0% p=0,0012), "
        "96,8% pemulihan Rupiah pada Top-100, serta 0,0% False Positive di 512 kasus rutin sah.",
    )


def _html_business_roadmap(spec: dict, idx: int, total: int) -> str:
    return _html_chart_plus_cards(
        spec,
        idx,
        total,
        "Keunggulan Ekonomi: Rp 0 biaya token/API eksternal dan Rp 0 SaaS; proyeksi skala nasional "
        "menyelamatkan Rp 485 Miliar/tahun dengan TCO infrastruktur Rp 4,2 Miliar/tahun (115,5x).",
    )


def _html_closing(spec: dict, _idx: int, _total: int) -> str:
    cards = "".join(
        f"""<div class="closing-card">
          <div class="closing-pill">{_esc(lbl)}</div>
          <div class="closing-val">{_esc(val)}</div>
          <div class="closing-desc">{_esc(desc)}</div>
        </div>"""
        for lbl, val, desc in spec["cards"]
    )
    return f"""
    <section class="slide slide-navy closing-slide">
      <img class="hk-logo-center" src="{_img_uri(dd.ASSETS_DIR / 'healthkathon_logo.png')}" alt="HealthKathon 2026" />
      <h1 class="closing-title">{_esc(spec["title"])}</h1>
      <div class="closing-sub">{_esc(spec["subtitle"])}</div>
      <div class="closing-grid">{cards}</div>
      <div class="closing-foot">{_esc(spec["footer_note"])}</div>
    </section>"""


HTML_RENDERERS = {
    "cover": _html_cover,
    "team_problem": _html_team_problem,
    "table_focus": _html_table_focus,
    "before_after": _html_before_after,
    "solution_flow": _html_solution_flow,
    "demo_dual": _html_demo_dual,
    "demo_trio_mobile": _html_demo_trio_mobile,
    "impact_evidence": _html_impact_evidence,
    "business_roadmap": _html_business_roadmap,
    "closing": _html_closing,
}

PAGE_CSS = """
@page {
  size: 13.333in 7.5in;
  margin: 0;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  font-family: 'Lato', 'Liberation Sans', 'DejaVu Sans', sans-serif;
  background: #F7F8FA;
  color: #061B31;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.slide {
  width: 13.333in;
  height: 7.5in;
  position: relative;
  overflow: hidden;
  page-break-after: always;
  break-after: page;
  padding: 0.24in 0.50in;
  display: flex;
  flex-direction: column;
}
.slide:last-child { page-break-after: auto; break-after: auto; }
.slide-light { background: #F7F8FA; color: #061B31; }
.slide-navy { background: #061B31; color: #FFFFFF; padding: 0.42in 0.50in; }

/* Standard Chrome */
.header-zone { margin-bottom: 0.12in; }
.section-pill {
  display: inline-block;
  background: #ECFDF5;
  color: #00733B;
  border: 1px solid #A7F3D0;
  border-radius: 999px;
  font-size: 8.5pt;
  font-weight: 900;
  padding: 0.03in 0.16in;
  letter-spacing: 0.02em;
  margin-bottom: 0.06in;
}
.slide-title {
  font-weight: 900;
  color: #061B31;
  line-height: 1.15;
  margin-bottom: 0.04in;
}
.slide-sub {
  font-size: 11pt;
  color: #475569;
  line-height: 1.25;
}
.content-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.footer-zone {
  margin-top: 0.10in;
  padding-top: 0.06in;
  border-top: 1px solid #E2E8F0;
  display: flex;
  justify-content: space-between;
  font-size: 8.5pt;
  color: #64748B;
}
.footer-zone strong { color: #061B31; }

.card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 0.13in 0.16in;
}
.card-h {
  font-size: 12pt;
  font-weight: 900;
  color: #061B31;
  margin-bottom: 0.08in;
}
.bullet-row {
  font-size: 9.8pt;
  line-height: 1.32;
  color: #475569;
  margin-bottom: 0.07in;
}
.bullet-row:last-child { margin-bottom: 0; }
.bullet-row .lead { color: #061B31; font-weight: 900; }
.small-row { font-size: 8.7pt; line-height: 1.24; margin-bottom: 0.04in; }
.demo-row { font-size: 9.5pt; line-height: 1.28; margin-bottom: 0.05in; }
.evidence-row { font-size: 9.3pt; line-height: 1.28; margin-bottom: 0.06in; }

.mini-pill {
  display: inline-block;
  align-self: flex-start;
  background: #ECFDF5;
  color: #00733B;
  border: 1px solid #A7F3D0;
  border-radius: 999px;
  font-size: 7.8pt;
  font-weight: 900;
  padding: 0.025in 0.12in;
  margin-bottom: 0.05in;
}

/* Cover */
.cover-grid { display: grid; grid-template-columns: 6.30in 5.78in; gap: 0.25in; height: 100%; align-items: stretch; }
.cover-left { display: flex; flex-direction: column; justify-content: space-between; }
.hk-logo { width: 2.55in; height: 0.88in; object-fit: contain; object-position: left center; }
.cover-badge {
  display: inline-block;
  align-self: flex-start;
  background: #00733B;
  color: #FFFFFF;
  font-size: 8.5pt;
  font-weight: 900;
  padding: 0.05in 0.16in;
  border-radius: 999px;
}
.cover-title { font-size: 40pt; font-weight: 900; color: #FFFFFF; line-height: 1.05; }
.cover-sub { font-size: 13.5pt; color: #E2E8F0; line-height: 1.35; }
.cover-pills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.10in 0.14in; }
.cover-pill {
  background: #0D2742;
  border: 1px solid #1E3A5F;
  color: #34D399;
  font-size: 9.3pt;
  font-weight: 900;
  text-align: center;
  padding: 0.06in 0.10in;
  border-radius: 999px;
}
.cover-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.10in 0.14in; }
.cover-meta-card {
  background: #0D2742;
  border: 1px solid #1E3A5F;
  border-radius: 8px;
  padding: 0.09in 0.14in;
}
.meta-k { font-size: 8pt; font-weight: 900; color: #34D399; margin-bottom: 0.02in; }
.meta-v { font-size: 11.8pt; font-weight: 900; color: #FFFFFF; }

.cover-right {
  background: #0D2742;
  border: 1px solid #1E3A5F;
  border-radius: 10px;
  padding: 0.16in 0.18in;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.cover-preview-title { font-size: 10.5pt; font-weight: 900; color: #34D399; }
.cover-shot-frame {
  background: #FFFFFF;
  border: 1px solid #1E3A5F;
  border-radius: 6px;
  height: 3.45in;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0.04in;
}
.cover-shot-frame img { width: 100%; height: 100%; object-fit: contain; }
.cover-kpis-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.12in; }
.cover-kpi-card {
  background: #061B31;
  border: 1px solid #1E3A5F;
  border-radius: 8px;
  padding: 0.09in 0.14in;
}
.kpi-v { font-size: 17pt; font-weight: 900; color: #34D399; }
.kpi-l { font-size: 9.2pt; color: #CBD5E1; margin-top: 0.02in; }

/* Slide 2 Team & Problem */
.team-grid { display: grid; grid-template-columns: 5.05in 7.08in; gap: 0.20in; }
.stack-col { display: grid; grid-template-rows: 1fr 1fr; gap: 0.14in; }
.stack-col-right { display: flex; flex-direction: column; gap: 0.14in; }
.kpi-grid-2x2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.12in; }
.kpi-tile {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 0.10in 0.16in;
}
.kpi-highlight { background: #ECFDF5; border-color: #A7F3D0; }
.kpi-num { font-size: 17.5pt; font-weight: 900; color: #061B31; }
.kpi-highlight .kpi-num { color: #00733B; }
.kpi-lbl { font-size: 9.3pt; font-weight: 700; color: #475569; margin-top: 0.02in; }
.table-card { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; gap: 0.12in; }

/* Tables */
.cp-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.cp-table th {
  background: #061B31;
  color: #FFFFFF;
  font-weight: 900;
  text-align: left;
  padding: 0.08in 0.10in;
  font-size: 10pt;
}
.cp-table td {
  padding: 0.09in 0.10in;
  border-bottom: 1px solid #E2E8F0;
  font-size: 9.3pt;
  line-height: 1.28;
  color: #475569;
  vertical-align: middle;
}
.cp-table tbody tr:nth-child(odd) { background: #FFFFFF; }
.cp-table tbody tr:nth-child(even) { background: #F3F5F8; }
.matrix-table { height: 100%; }
.matrix-table td { font-size: 9.5pt; padding: 0.11in 0.12in; }
.compact-table { flex: 1; }
.compact-table td { font-size: 9.2pt; padding: 0.11in 0.09in; }
.col-strong { font-weight: 900; color: #061B31 !important; }
.col-em { font-weight: 900; color: #047857 !important; }

/* Slide 4 Before After */
.ba-grid { display: grid; grid-template-columns: 7.10in 5.05in; gap: 0.18in; }
.chart-frame { display: flex; align-items: center; justify-content: center; padding: 0.10in; }
.chart-frame img { width: 100%; height: 100%; object-fit: contain; }
.ev-stack { display: grid; grid-template-rows: 1fr 1fr; gap: 0.14in; }
.ev-card { display: grid; grid-template-columns: 2.12in 1fr; gap: 0.12in; align-items: stretch; }
.ev-text { display: flex; flex-direction: column; }
.ev-title { font-size: 11pt; font-weight: 900; color: #061B31; line-height: 1.22; margin-bottom: 0.06in; }
.ev-cap { font-size: 9.3pt; color: #475569; line-height: 1.32; }
.ev-img-box {
  background: #F3F5F8;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.04in;
  overflow: hidden;
}
.ev-img-box img { width: 100%; height: 100%; object-fit: contain; }

/* Slide 5 Solution Flow */
.sol-layout { display: flex; flex-direction: column; gap: 0.12in; }
.diagram-frame {
  height: 3.82in;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.06in;
}
.diagram-frame img { width: 100%; height: 100%; object-fit: contain; }
.sol-bottom-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.21in; flex: 1; }
.sol-card { padding: 0.11in 0.14in; }

/* Demo Dual & Trio */
.dual-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.28in; }
.demo-card { display: flex; flex-direction: column; padding: 0.12in 0.16in; }
.demo-title { font-size: 12pt; font-weight: 900; color: #061B31; margin-bottom: 0.07in; }
.demo-shot-box {
  background: #F3F5F8;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  height: 3.55in;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.04in;
  margin-bottom: 0.08in;
}
.demo-shot-box img, .trio-shot-box img, .mobile-shot-box img { width: 100%; height: 100%; object-fit: contain; }
.demo-points { flex: 1; }

.trio-grid { display: grid; grid-template-columns: 4.48in 4.48in 1fr; gap: 0.20in; }
.trio-shot-box {
  background: #F3F5F8;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  height: 2.68in;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.04in;
  margin-bottom: 0.10in;
}
.mobile-card { align-items: stretch; }
.mobile-card .mini-pill { align-self: center; }
.mobile-shot-box {
  background: #F3F5F8;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  height: 3.92in;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.05in;
  margin-bottom: 0.08in;
}
.mobile-cap { font-size: 9pt; color: #475569; text-align: center; line-height: 1.3; }

/* Slide 10 & 11 Chart + Two Cards */
.chart-cards-grid { display: grid; grid-template-columns: 7.65in 1fr; gap: 0.20in; }
.chart-left-col { display: flex; flex-direction: column; gap: 0.10in; }
.chart-frame-tall {
  height: 4.66in;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.08in;
}
.chart-frame-tall img { width: 100%; height: 100%; object-fit: contain; }
.emerald-banner {
  flex: 1;
  background: #ECFDF5;
  border: 1px solid #A7F3D0;
  border-radius: 8px;
  padding: 0.10in 0.16in;
  font-size: 10pt;
  font-weight: 900;
  color: #061B31;
  display: flex;
  align-items: center;
  line-height: 1.32;
}
.chart-right-col { display: flex; flex-direction: column; gap: 0.14in; }
.card-tall { flex: 1.45; }
.card-short { flex: 1; }

/* Closing */
.closing-slide { justify-content: center; align-items: center; text-align: center; gap: 0.20in; }
.hk-logo-center { width: 3.00in; height: 1.04in; object-fit: contain; }
.closing-title { font-size: 28pt; font-weight: 900; color: #FFFFFF; }
.closing-sub { font-size: 13.5pt; color: #CBD5E1; margin-bottom: 0.10in; }
.closing-grid { width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.30in; margin-top: 0.08in; }
.closing-card {
  background: #0D2742;
  border: 1px solid #1E3A5F;
  border-radius: 10px;
  padding: 0.22in 0.20in;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.14in;
  min-height: 2.05in;
}
.closing-pill {
  background: #00733B;
  color: #FFFFFF;
  border-radius: 999px;
  font-size: 8.5pt;
  font-weight: 900;
  padding: 0.05in 0.14in;
}
.closing-val { font-size: 11.8pt; font-weight: 900; color: #34D399; word-break: break-word; }
.closing-desc { font-size: 10pt; color: #E2E8F0; line-height: 1.35; }
.closing-foot { font-size: 13pt; font-weight: 900; color: #34D399; margin-top: 0.12in; }
"""


def _find_chromium() -> str:
    for candidate in ("chromium-browser", "chromium", "google-chrome"):
        found = shutil.which(candidate)
        if found:
            return found
    raise FileNotFoundError("Chromium binary not found for PDF generation.")


def build_html_document() -> str:
    total = len(dd.SLIDES)
    sections = []
    for idx, spec in enumerate(dd.SLIDES, start=1):
        sections.append(HTML_RENDERERS[spec["layout"]](spec, idx, total))
    return f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>{_esc(dd.DECK_META["title"])}</title>
  <style>{PAGE_CSS}</style>
</head>
<body>
{"".join(sections)}
</body>
</html>
"""


def validate_pdf_output(pdf_path: Path) -> None:
    size_bytes = pdf_path.stat().st_size
    if size_bytes > MAX_PDF_BYTES:
        raise AssertionError(
            f"{pdf_path.name} exceeds 15 MB limit: {size_bytes / (1024*1024):.2f} MB"
        )
    reader = PdfReader(str(pdf_path))
    if len(reader.pages) != len(dd.SLIDES):
        raise AssertionError(
            f"{pdf_path.name} page count {len(reader.pages)} != {len(dd.SLIDES)}"
        )
    if shutil.which("pdftotext"):
        proc = subprocess.run(
            ["pdftotext", str(pdf_path), "-"],
            capture_output=True,
            text=True,
            check=True,
        )
        dd.assert_clean_text(proc.stdout, f"pdftotext:{pdf_path.name}")


def export_pdfs() -> list[Path]:
    html_file = dd.DECK_DIR / "_render_deck.html"
    primary_pdf = dd.DECK_DIR / "ClaimTrace_Healthkathon_2026_Final.pdf"
    team_pdf = dd.DECK_DIR / "TINEERENSE.pdf"

    html_file.write_text(build_html_document(), encoding="utf-8")
    try:
        chromium = _find_chromium()
        cmd = [
            chromium,
            "--headless",
            "--no-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--no-pdf-header-footer",
            f"--print-to-pdf={primary_pdf}",
            f"file://{html_file}",
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
        if proc.returncode != 0 or not primary_pdf.exists():
            raise RuntimeError(
                f"Chromium PDF export failed ({proc.returncode}): {proc.stderr}"
            )
    finally:
        if html_file.exists():
            html_file.unlink()

    shutil.copy2(primary_pdf, team_pdf)
    validate_pdf_output(primary_pdf)
    validate_pdf_output(team_pdf)
    return [primary_pdf, team_pdf]


if __name__ == "__main__":
    pdfs = export_pdfs()
    for p in pdfs:
        mb = p.stat().st_size / (1024 * 1024)
        pages = len(PdfReader(str(p)).pages)
        print(f"OK {p.name}: {pages} pages, {mb:.2f} MB (<= 15 MB, clean text)")
