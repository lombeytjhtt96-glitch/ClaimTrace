"""High-DPI Clinical Precision chart and diagram renderer for ClaimTrace JKN.

Renders razor-sharp PNG figures via headless Chromium HTML/SVG at 2x DPI into
submissions/healthkathon/assets/charts/ so both PPTX and Chromium PDF consume
pixel-identical analytical visuals.
"""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path
from PIL import Image

ASSETS_CHARTS_DIR = (
    Path(__file__).resolve().parents[1] / "assets" / "charts"
)
TEMP_HTML_DIR = Path(__file__).resolve().parents[1] / "assets" / "_tmp_charts"

COMMON_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html, body {
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  color: #061B31;
  font-family: 'Lato', 'Liberation Sans', 'DejaVu Sans', sans-serif;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}
.canvas {
  width: 100%;
  height: 100%;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #FFFFFF;
}
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 1.5px solid #E2E8F0;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.chart-title {
  font-size: 18px;
  font-weight: 900;
  color: #061B31;
  letter-spacing: -0.01em;
}
.chart-sub {
  font-size: 12.5px;
  font-weight: 700;
  color: #047857;
}
.chart-foot {
  font-size: 11px;
  color: #64748B;
  margin-top: 8px;
  border-top: 1px solid #E2E8F0;
  padding-top: 6px;
}
"""


def _find_chromium() -> str:
    for candidate in ("chromium-browser", "chromium", "google-chrome"):
        found = shutil.which(candidate)
        if found:
            return found
    raise FileNotFoundError("Chromium binary not found for chart rendering.")


def _render_html_to_png(
    html_body: str,
    width: int,
    height: int,
    out_png: Path,
    scale: int = 2,
) -> Path:
    ASSETS_CHARTS_DIR.mkdir(parents=True, exist_ok=True)
    TEMP_HTML_DIR.mkdir(parents=True, exist_ok=True)
    html_file = TEMP_HTML_DIR / f"{out_png.stem}.html"
    full_html = f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<style>
{COMMON_CSS}
html, body {{ width: {width}px; height: {height}px; }}
</style>
</head>
<body>
{html_body}
</body>
</html>
"""
    html_file.write_text(full_html, encoding="utf-8")
    chromium = _find_chromium()
    cmd = [
        chromium,
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--hide-scrollbars",
        f"--force-device-scale-factor={scale}",
        f"--window-size={width},{height}",
        f"--screenshot={out_png}",
        f"file://{html_file}",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if proc.returncode != 0 or not out_png.exists():
        raise RuntimeError(
            f"Chromium chart render failed ({proc.returncode}): {proc.stderr}"
        )
    # Trim exact pixel size cleanly so no transparent fringes remain
    with Image.open(out_png) as img:
        rgb = img.convert("RGB")
        rgb.save(out_png, format="PNG", optimize=True)
    return out_png


def build_coaching_before_after() -> Path:
    """Render Slide 4 comparison scorecard: Sebelum vs Sesudah Coaching."""
    rows = [
        (
            "Latensi Evaluasi AI",
            "> 4.000 ms (LLM Cloud)",
            "< 15 ms core (11,90 ms API live)",
            100,
            4,
        ),
        (
            "Risiko Transfer Data Eksternal",
            "Ketergantungan API Asing",
            "0% (100% On-Premise UU PDP)",
            100,
            0,
        ),
        (
            "False Positive Kasus Sah (Z49.1)",
            "Belum Terkalibrasi",
            "0,0% FPR (512 Kasus FairGuard)",
            75,
            0,
        ),
        (
            "Kelengkapan Lapis Triangulasi",
            "3 Lapis Dasar",
            "4-Lapis + FRISTA + BSrE TTE",
            60,
            100,
        ),
        (
            "Verifikasi Otomatis Backend",
            "Pengujian Parsial",
            "299 Uji Backend + 16/16 Stack",
            35,
            100,
        ),
    ]
    rows_html = []
    for label, before_txt, after_txt, w_before, w_after in rows:
        bar_b = f"""
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
          <span style="width:68px;font-size:11px;font-weight:700;color:#64748B;">Sebelum</span>
          <div style="flex:1;height:14px;background:#F1F5F9;border-radius:3px;overflow:hidden;">
            <div style="width:{max(w_before, 4)}%;height:100%;background:#94A3B8;border-radius:3px;"></div>
          </div>
          <span style="width:185px;font-size:11.5px;color:#475569;text-align:right;">{before_txt}</span>
        </div>"""
        is_reduction = w_after < w_before
        bar_color = "#00733B" if not is_reduction else "#047857"
        bar_a = f"""
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="width:68px;font-size:11px;font-weight:900;color:#00733B;">Sesudah</span>
          <div style="flex:1;height:14px;background:#ECFDF5;border-radius:3px;overflow:hidden;border:1px solid #A7F3D0;">
            <div style="width:{max(w_after, 5)}%;height:100%;background:{bar_color};border-radius:3px;"></div>
          </div>
          <span style="width:185px;font-size:11.5px;font-weight:900;color:#061B31;text-align:right;">{after_txt}</span>
        </div>"""
        rows_html.append(
            f"""
        <div style="padding:6px 11px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;">
          <div style="font-size:12px;font-weight:900;color:#061B31;margin-bottom:4px;">{label}</div>
          {bar_b}
          {bar_a}
        </div>"""
        )

    body = f"""
    <div class="canvas" style="padding:16px 20px;">
      <div class="title-row" style="margin-bottom:8px;padding-bottom:6px;">
        <div class="chart-title" style="font-size:16.5px;">Transformasi Pasca-Coaching (Okt -&gt; 15 Nov 2026)</div>
        <div class="chart-sub">Seluruh Masukan Mentor Teruji Live</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;flex:1;justify-content:center;">
        {"".join(rows_html)}
      </div>
      <div class="chart-foot" style="margin-top:6px;">
        Sumber: Pengukuran live /api/v1/health &amp; /api/v1/verify, FairGuard Benchmark (512 hard-negative), dan laporan uji 15 Nov 2026.
      </div>
    </div>
    """
    return _render_html_to_png(
        body, 740, 480, ASSETS_CHARTS_DIR / "chart_coaching_before_after.png"
    )


def build_architecture_diagram() -> Path:
    """Render Slide 5 End-to-End Architecture Flow (AS-IS vs TO-BE + 6 Stage + 4 Layer)."""
    stages = [
        ("1. Ingesti BEA C01-C02", "VClaim / INA-CBG FKRTL\n4,5 Jt+ klaim/bln\nSchema & Hash SHA-256", "#F8FAFC", "#061B31"),
        ("2. Gudang Data SQL", "6,26 Jt baris transaksi\n1,69 Jt klaim FKRTL\nIn-Memory On-Premise", "#F8FAFC", "#061B31"),
        ("3. 3 Model ML + NLP", "IsolationForest + .pkl\nall-MiniLM-L6-v2 lokal\nLatensi < 15 ms (Rp 0)", "#ECFDF5", "#00733B"),
        ("4. Triangulasi 4-Lapis", "0,50*S1 + 0,30*S2 + 0,20*S3\nL4 RME-TTE, FRISTA\n& Hard Trigger SIP", "#ECFDF5", "#00733B"),
        ("5. FairGuard Z49.1", "5 aturan deterministik\nLindungi HD/Thalassemia\n0,0% FPR (512 uji)", "#FFFBEB", "#B45309"),
        ("6. 3 Jalur SLA <= 10 HK", "Hijau <50 -> S06 Cair\nKuning 50-74,9 -> Telaah\nMerah >=75 -> BAHV QR", "#FFF1F2", "#BE123C"),
    ]
    cards = []
    for i, (head, desc, bg, accent) in enumerate(stages):
        arrow = (
            '<div style="display:flex;align-items:center;font-size:20px;font-weight:900;color:#00733B;padding:0 2px;">&rarr;</div>'
            if i < len(stages) - 1
            else ""
        )
        desc_br = desc.replace("\n", "<br/>")
        cards.append(
            f"""
            <div style="flex:1;background:{bg};border:1.5px solid #CBD5E1;border-top:4px solid {accent};border-radius:8px;padding:10px 10px;display:flex;flex-direction:column;justify-content:space-between;min-height:142px;">
              <div style="font-size:12.5px;font-weight:900;color:{accent};line-height:1.25;margin-bottom:6px;">{head}</div>
              <div style="font-size:11.5px;color:#334155;line-height:1.45;font-weight:700;">{desc_br}</div>
            </div>
            {arrow}"""
        )

    body = f"""
    <div class="canvas" style="padding:16px 20px;">
      <div class="title-row" style="margin-bottom:10px;">
        <div class="chart-title">Arsitektur Sidecar BEA (C01-S06) & Pipa Inference POST /api/v1/verify</div>
        <div class="chart-sub">Zero API Eksternal | Zero Perubahan Skema VClaim</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px;">
        <div style="background:#FFF1F2;border:1px solid #FECDD3;border-radius:6px;padding:8px 12px;">
          <span style="font-size:11.5px;font-weight:900;color:#BE123C;">AS-IS MANUAL:</span>
          <span style="font-size:11.5px;color:#475569;"> Antrean C03 menumpuk, sampling acak RS jujur ikut tersita, jeda verifikasi &gt; 15 HK sebelum S06 cair.</span>
        </div>
        <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:6px;padding:8px 12px;">
          <span style="font-size:11.5px;font-weight:900;color:#00733B;">TO-BE SIDECAR CLAIMTRACE:</span>
          <span style="font-size:11.5px;color:#061B31;font-weight:700;"> C03.04 tersaring otomatis &lt; 15 ms, RS jujur lolos Hijau ke S06, Verifikator fokus ke Merah.</span>
        </div>
      </div>

      <div style="display:flex;align-items:stretch;gap:4px;flex:1;">
        {"".join(cards)}
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px;">
        <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:6px;padding:7px 10px;font-size:11.5px;">
          <strong style="color:#00733B;">JALUR HIJAU (Skor &lt; 50):</strong> Rilis cepat ke S06 Payment Gateway &lt;= 1 HK.
        </div>
        <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:7px 10px;font-size:11.5px;">
          <strong style="color:#B45309;">JALUR KUNING (50-74,9 / UNSYNCED):</strong> Cek dokumen RME & koreksi faskes &lt;= 5 HK.
        </div>
        <div style="background:#FFF1F2;border:1px solid #FECDD3;border-radius:6px;padding:7px 10px;font-size:11.5px;">
          <strong style="color:#BE123C;">JALUR MERAH (&gt;= 75 / SIP EXPIRED):</strong> Hold & putusan 2-Tier + BAHV QR &lt;= 10 HK.
        </div>
      </div>
    </div>
    """
    return _render_html_to_png(
        body, 1180, 390, ASSETS_CHARTS_DIR / "diagram_architecture_flow.png"
    )


def build_hkeval_benchmark_chart() -> Path:
    """Render Slide 10 benchmark visual from live credible_evaluation_benchmark.py."""
    ablation_bars = [
        ("Aturan Baku Saja (Rules Alone)", 56.0, "28/50 fraud | Lift 28,0x", "#94A3B8", "#475569"),
        ("Aturan + ClaimTrace (Utama)", 86.0, "43/50 fraud | Lift 43,0x (+30,0% p=0,0012)", "#00733B", "#061B31"),
        ("Kondisi Sulit (Hard Cases)", 92.0, "46/50 fraud | Lift 46,0x", "#047857", "#061B31"),
        ("Konsentrasi 3 RS (Concentrated)", 82.0, "41/50 fraud | Lift 41,0x", "#0D9488", "#061B31"),
        ("Prevalensi Tinggi (10%)", 100.0, "50/50 fraud | 100,0% P@50", "#061B31", "#061B31"),
    ]
    left_rows = []
    for name, val, meta, bar_col, txt_col in ablation_bars:
        val_id = f"{val:.1f}".replace(".", ",")
        left_rows.append(
            f"""
            <div style="margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px;">
                <span style="font-weight:900;color:{txt_col};">{name}</span>
                <span style="font-weight:900;color:{bar_col};">{val_id}%</span>
              </div>
              <div style="height:15px;background:#F1F5F9;border-radius:4px;overflow:hidden;">
                <div style="width:{val:.1f}%;height:100%;background:{bar_col};border-radius:4px;"></div>
              </div>
              <div style="font-size:10.5px;color:#64748B;margin-top:2px;">{meta}</div>
            </div>"""
        )

    right_metrics = [
        ("Rupiah Recall@50 (Top-50 antrean)", 66.3, "Rp 200,07 Jt / Rp 301,88 Jt", "#047857"),
        ("Rupiah Recall@100 (Top-100 antrean)", 96.8, "58/60 kasus fraud (Recall 96,7%)", "#00733B"),
        ("Akurasi Blind Review (Tanpa RS Uji)", 95.0, "19/20 terdeteksi vs 0/20 manual", "#061B31"),
        ("RS Jujur Ikut Teraudit@50", 21.9, "Hanya 7 dari 32 RS jujur (rendah=baik)", "#D97706"),
        ("Hard-Negative FPR (512 Kasus Sah)", 0.0, "0/512 klaim sah terblokir keliru", "#00733B"),
    ]
    right_rows = []
    for name, val, meta, col in right_metrics:
        val_id = f"{val:.1f}".replace(".", ",")
        right_rows.append(
            f"""
            <div style="margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px;">
                <span style="font-weight:900;color:#061B31;">{name}</span>
                <span style="font-weight:900;color:{col};">{val_id}%</span>
              </div>
              <div style="height:15px;background:#F1F5F9;border-radius:4px;overflow:hidden;border:1px solid #E2E8F0;">
                <div style="width:{val:.1f}%;height:100%;background:{col};border-radius:3px;"></div>
              </div>
              <div style="font-size:10.5px;color:#64748B;margin-top:2px;">{meta}</div>
            </div>"""
        )

    body = f"""
    <div class="canvas" style="padding:15px 18px;">
      <div class="title-row" style="margin-bottom:9px;padding-bottom:6px;">
        <div class="chart-title" style="font-size:16.5px;">Hasil Benchmark Kredibel (n=3.002 Klaim, 60 Fraud 2,0%, Multi-Dial HKEval)</div>
        <div class="chart-sub">5/5 REFORMS Lolos | Paired p = 0,0012</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;flex:1;">
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:10px 13px;">
          <div style="font-size:12px;font-weight:900;color:#061B31;margin-bottom:7px;border-bottom:1px solid #E2E8F0;padding-bottom:4px;">
            Precision@50 &amp; Uji Ablasi (+30,0% Poin Lift Nyata)
          </div>
          {"".join(left_rows)}
        </div>
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:10px 13px;">
          <div style="font-size:12px;font-weight:900;color:#061B31;margin-bottom:7px;border-bottom:1px solid #E2E8F0;padding-bottom:4px;">
            Pemulihan Rupiah, Blind Review &amp; Perlindungan RS Jujur
          </div>
          {"".join(right_rows)}
        </div>
      </div>
      <div class="chart-foot" style="margin-top:6px;">
        Catatan Keterbukaan Ilmiah (Hold-Out Unseen Patterns): Unbundling 66,7% (2/3) &amp; Prolonged LOS 0,0% (0/11) dipetakan sebagai fokus kalibrasi aturan Fase Pilot.
      </div>
    </div>
    """
    return _render_html_to_png(
        body, 900, 460, ASSETS_CHARTS_DIR / "chart_hkeval_benchmark.png"
    )


def build_roadmap_tco_chart() -> Path:
    """Render Slide 11 3-Phase Financial & Operational Scaling Chart."""
    phases = [
        ("Tahap 1 (Bln 1-3)", "12 FKRTL Piloting", 0.45, 18.5, "41,1x"),
        ("Tahap 2 (Bln 4-9)", "126 KC & 850 FKRTL", 1.85, 142.0, "76,8x"),
        ("Tahap 3 (Bln 10-18)", "3.221 FKRTL & 23.816 FKTP", 4.20, 485.0, "115,5x"),
    ]
    max_sav = 485.0
    cols_html = []
    for title, scope, tco_m, sav_m, ratio in phases:
        h_sav = max(18, int((sav_m / max_sav) * 165))
        h_tco = max(6, int((tco_m / max_sav) * 165))
        tco_id = f"{tco_m:.2f}".replace(".", ",")
        sav_id = f"{sav_m:.1f}".replace(".", ",")
        cols_html.append(
            f"""
            <div style="flex:1;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:10px 13px;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="font-size:13px;font-weight:900;color:#061B31;">{title}</div>
                <div style="font-size:11px;font-weight:700;color:#00733B;margin-top:2px;">{scope}</div>
              </div>
              <div style="height:190px;display:flex;align-items:flex-end;justify-content:center;gap:20px;border-bottom:1.5px solid #CBD5E1;padding:8px 0 0 0;margin:6px 0;">
                <div style="display:flex;flex-direction:column;align-items:center;width:76px;">
                  <div style="font-size:11px;font-weight:900;color:#475569;margin-bottom:4px;">Rp {tco_id} M</div>
                  <div style="width:46px;height:{h_tco}px;background:#64748B;border-radius:4px 4px 0 0;"></div>
                  <div style="font-size:10px;font-weight:700;color:#64748B;margin-top:4px;">TCO Infra</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:center;width:86px;">
                  <div style="font-size:12px;font-weight:900;color:#00733B;margin-bottom:4px;">Rp {sav_id} M</div>
                  <div style="width:52px;height:{h_sav}px;background:#00733B;border-radius:4px 4px 0 0;"></div>
                  <div style="font-size:10px;font-weight:900;color:#061B31;margin-top:4px;">Potensi DJS</div>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;">
                <span style="color:#475569;font-weight:700;">Rasio Manfaat / Biaya</span>
                <span style="background:#ECFDF5;color:#00733B;border:1px solid #A7F3D0;border-radius:4px;padding:2px 8px;font-weight:900;">{ratio}</span>
              </div>
            </div>"""
        )

    body = f"""
    <div class="canvas" style="padding:15px 18px;">
      <div class="title-row" style="margin-bottom:9px;padding-bottom:6px;">
        <div class="chart-title" style="font-size:16.5px;">Proyeksi Ekonomi 3 Tahap: Pemulihan DJS vs TCO On-Premise</div>
        <div class="chart-sub">Rp 0 API/Token | Rp 0 SaaS</div>
      </div>
      <div style="display:flex;gap:12px;flex:1;">
        {"".join(cols_html)}
      </div>
      <div class="chart-foot" style="margin-top:8px;">
        Basis kalkulasi: credible_evaluation_benchmark.py (TCO Rp 450 Jt / Rp 1,85 M / Rp 4,20 M per thn vs hemat Rp 18,5 M / Rp 142,0 M / Rp 485,0 M per thn).
      </div>
    </div>
    """
    return _render_html_to_png(
        body, 820, 440, ASSETS_CHARTS_DIR / "chart_roadmap_tco.png"
    )


def build_all_charts() -> list[Path]:
    outputs = [
        build_coaching_before_after(),
        build_architecture_diagram(),
        build_hkeval_benchmark_chart(),
        build_roadmap_tco_chart(),
    ]
    shutil.rmtree(TEMP_HTML_DIR, ignore_errors=True)
    return outputs


if __name__ == "__main__":
    paths = build_all_charts()
    for p in paths:
        with Image.open(p) as im:
            print(f"OK {p.name}: {im.size[0]}x{im.size[1]} ({p.stat().st_size} bytes)")
