"use client";
import React, { useState } from "react";
import {
  Bot,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Copy,
  Check,
  X,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  Shield,
  FileText,
  Clock,
  ArrowRight,
  RefreshCw,
  Cpu
} from "lucide-react";

interface PlaywrightRpaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClaimId: string;
}

interface RpaStep {
  step: number;
  tool: string;
  action: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  detail: string;
  outputSnippet?: string;
  durationMs?: number;
}

const INITIAL_RPA_STEPS: RpaStep[] = [
  {
    step: 1,
    tool: "browser_navigate",
    action: "Navigasi ke Portal Verifikasi BPJS (vClaim / Vedika Gateway)",
    status: "PENDING",
    detail: "Membuka antarmuka klaim rumah sakit: http://vclaim.bpjs-kesehatan.go.id/vedika-gateway",
    outputSnippet: "HTTP 200 OK • DOM Loaded • TLS 1.3 Certified",
    durationMs: 420
  },
  {
    step: 2,
    tool: "browser_snapshot",
    action: "Ekstraksi Semantic Accessibility Tree Rekam Medis & SEP",
    status: "PENDING",
    detail: "Mengambil struktur semantik data pasien tanpa OCR vision token-bloat untuk mencegah halusinasi.",
    outputSnippet: "Extracted: SEP-20261018-0091 • Diagnosis: B-1-10-II • DPJP: dr. Sintetis Sp.B-KBD",
    durationMs: 310
  },
  {
    step: 3,
    tool: "browser_evaluate",
    action: "Cross-Check Triase Multi-Sinyal ClaimTrace (S1-S2-S3 Fusion)",
    status: "PENDING",
    detail: "Memverifikasi rumus S = 0.5×S1 + 0.3×S2 + 0.2×S3 dan memeriksa Hard Trigger SIP / Geovelocity.",
    outputSnippet: "S1=60.0, S2=96.0, S3=75.0 → Score=75.0 (JALUR MERAH: Hard Trigger SIP Expired)",
    durationMs: 180
  },
  {
    step: 4,
    tool: "browser_click",
    action: "Aktivasi Radar Geovelocity OSRM (Impossible Travel Detection)",
    status: "PENDING",
    detail: "Menghitung jarak jalan tol Trans-Jawa Semarang ke Solo (107.5 km) dalam jeda klaim 45 menit.",
    outputSnippet: "V_required = 142.7 km/jam > Batas 100 km/jam → ANOMALI MUSTAHIL SECARA FISIK",
    durationMs: 250
  },
  {
    step: 5,
    tool: "browser_fill_form",
    action: "Entri Otomatis Catatan Rekomendasi Verifikator (Perpres 82/2018)",
    status: "PENDING",
    detail: "Mengisi formulir rekomendasi: 'Tunda Bayar - Klarifikasi Jadwal OK Faskes & Log SATUSEHAT SDMK'.",
    outputSnippet: "Form Field #decision-note populated with cryptographic audit rationale",
    durationMs: 140
  },
  {
    step: 6,
    tool: "browser_pdf_save",
    action: "Penerbitan Berkas Audit Digital Non-Repudiation (Segel SHA-256)",
    status: "PENDING",
    detail: "Menyimpan snapshot berkas siap-audit lengkap dengan stempel digital tamper-evident.",
    outputSnippet: "Saved: /evidence/Dossier_CLM-2026-8805.pdf • SHA-256: 5c84d9f01e23a4567890bcdef...",
    durationMs: 520
  }
];

const PLAYWRIGHT_CODE_SNIPPET = `// Playwright E2E Robot Verifikator BPJS Kesehatan (ClaimTrace DSS)
// Kompatibel dengan microsoft/playwright-mcp (@playwright/mcp@latest)
import { test, expect } from '@playwright/test';

test('Automated Verifier RPA Flow for Modus #6 Phantom Billing', async ({ page }) => {
  // Step 1: Navigasi ke portal verifikasi klaim
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'load' });
  await expect(page).toHaveTitle(/ClaimTrace/);

  // Step 2: Pilih berkas anomali di Jalur Merah
  const claimCard = page.locator('[data-testid="claim-card-CLM-2026-8805"]');
  await expect(claimCard).toBeVisible();
  await claimCard.click();

  // Step 3: Verifikasi diagnosis dan anomali fisik
  await expect(page.getByText('B-1-10-II').first()).toBeVisible();
  await expect(page.getByText('dr. Sintetis Sp.B-KBD').first()).toBeVisible();

  // Step 4: Buka radar OSRM Geovelocity
  await page.locator('button[title*="Radar Geovelocity"]').click();
  await expect(page.getByText('Uji Kelayakan Fisika').first()).toBeVisible();
  await expect(page.getByText('Kecepatan Dibutuhkan').first()).toBeVisible();
  await page.locator('.fixed button:has-text("Tutup")').click();

  // Step 5: Eksekusi simulasi kanal Mobile JKN (Biner: Tidak Hadir)
  await page.locator('button:has-text("Tidak Merasa Hadir")').click();
  await expect(page.getByText('MOBILE_JKN_BINARY_SYNC').first()).toBeVisible();

  // Step 6: Ekspor Berkas Audit dengan Segel SHA-256
  await page.locator('button:has-text("Cetak / Ekspor Berkas")').click();
  await expect(page.getByText('PRATINJAU BERKAS ALASAN KASUS SIAP-AUDIT').first()).toBeVisible();
  await page.locator('.fixed button:has(svg.lucide-x)').first().click();
});
`;

export default function PlaywrightRpaModal({
  isOpen,
  onClose,
  selectedClaimId,
}: PlaywrightRpaModalProps) {
  const [activeTab, setActiveTab] = useState<"SIMULATOR" | "TOOLS" | "CODE">("SIMULATOR");
  const [steps, setSteps] = useState<RpaStep[]>(INITIAL_RPA_STEPS);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRunSimulation = async () => {
    setIsRunning(true);
    setIsFinished(false);

    // Reset steps
    const reset = INITIAL_RPA_STEPS.map((s) => ({ ...s, status: "PENDING" as const }));
    setSteps(reset);

    // Run sequentially
    for (let i = 0; i < reset.length; i++) {
      setSteps((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "RUNNING" as const } : s))
      );

      // Simulated network execution delay
      await new Promise((resolve) => setTimeout(resolve, reset[i].durationMs || 400));

      setSteps((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "COMPLETED" as const } : s))
      );
    }

    setIsRunning(false);
    setIsFinished(true);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PLAYWRIGHT_CODE_SNIPPET);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200/80 bg-[#f8fafc]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white shadow-2xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200/80">
                  Playwright MCP RPA Robot
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  microsoft/playwright-mcp • Automated Verifier Assistant
                </span>
              </div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight mt-0.5">
                Otomasi Triase & Audit Berkas Klaim Pra-Bayar Berbasis Browser Agent
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunSimulation}
              disabled={isRunning}
              className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl font-bold transition shadow-2xs ${
                isRunning
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-cyan-600 hover:bg-cyan-700 text-white focus-visible:ring-2 focus-visible:ring-cyan-500"
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
                  <span>Robot Berjalan...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Jalankan Robot RPA</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-200 bg-white">
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setActiveTab("SIMULATOR")}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-t-lg font-semibold border-b-2 transition ${
                activeTab === "SIMULATOR"
                  ? "border-cyan-600 text-cyan-700 bg-cyan-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Simulasi Eksekusi Robot (RPA)</span>
            </button>
            <button
              onClick={() => setActiveTab("TOOLS")}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-t-lg font-semibold border-b-2 transition ${
                activeTab === "TOOLS"
                  ? "border-cyan-600 text-cyan-700 bg-cyan-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Katalog Tools Playwright MCP</span>
            </button>
            <button
              onClick={() => setActiveTab("CODE")}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-t-lg font-semibold border-b-2 transition ${
                activeTab === "CODE"
                  ? "border-cyan-600 text-cyan-700 bg-cyan-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Kode Skrip E2E TypeScript</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
            Target Klaim: <span className="font-bold text-slate-900">{selectedClaimId}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8fafc]/50">
          {activeTab === "SIMULATOR" && (
            <div className="space-y-6">
              {/* Architecture Highlight Card */}
              <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex items-start gap-3.5">
                <div className="p-2 bg-cyan-50 border border-cyan-200 rounded-lg text-cyan-700 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-slate-900">
                    Robotic Process Automation (RPA) Tanpa Halusinasi & Minim Token
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Playwright MCP menggunakan <b>Semantic Accessibility Tree Snapshots</b>, bukan gambar mentah
                    vision LLM. Pendekatan ini menghemat <b>95% konsumsi token AI</b>, mempercepat audit dari menit ke
                    hitungan detik, dan menjamin verifikator mendapatkan bukti otentik yang dapat diuji ulang secara hukum (non-repudiation).
                  </p>
                </div>
              </div>

              {/* Execution Status Banner */}
              {isFinished && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <b>Otomasi Verifikasi Selesai:</b> Berkas klaim berhasil ditriase, divalidasi silang ke OSRM & Mobile JKN, serta diekspor ke format audit resmi.
                    </span>
                  </div>
                  <span className="font-mono text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    6/6 Langkah Sukses (1.82s)
                  </span>
                </div>
              )}

              {/* Sequential Steps List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Urutan Kerja Robot Verifikator (Audit Pipeline)</span>
                  <span className="text-[11px] font-mono text-slate-400">microsoft/playwright-mcp @latest</span>
                </h4>

                <div className="space-y-2.5">
                  {steps.map((st) => (
                    <div
                      key={st.step}
                      className={`p-3.5 rounded-xl border transition-all text-xs bg-white ${
                        st.status === "RUNNING"
                          ? "border-cyan-400 bg-cyan-50/30 shadow-xs ring-1 ring-cyan-400/50"
                          : st.status === "COMPLETED"
                          ? "border-emerald-200/90 shadow-2xs"
                          : "border-slate-200 opacity-80"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                              st.status === "COMPLETED"
                                ? "bg-emerald-600 text-white"
                                : st.status === "RUNNING"
                                ? "bg-cyan-600 text-white animate-pulse"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {st.status === "COMPLETED" ? "✓" : st.step}
                          </span>
                          <span className="font-bold text-slate-900">{st.action}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200/60 font-semibold">
                            {st.tool}
                          </span>
                          {st.durationMs && st.status === "COMPLETED" && (
                            <span className="font-mono text-[10px] text-slate-400">
                              {st.durationMs}ms
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-600 pl-7 text-[11px] mb-2">{st.detail}</p>

                      {st.outputSnippet && (
                        <div className="ml-7 p-2 bg-[#f8fafc] border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{st.outputSnippet}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "TOOLS" && (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-600" />
                  Katalog 8 Tools Inti Playwright MCP untuk Ekosistem JKN
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Server MCP Playwright yang terpasang pada konfigurasi ClaimTrace (
                  <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">
                    /home/Khalaf-Dev/.gemini/config/mcp_config.json
                  </code>
                  ) menyediakan perkakas otomatisasi tingkat peramban dengan proteksi sandboxing dan kemampuan ekspor bukti hukum:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      browser_navigate
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Aktif</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    Membuka URL aplikasi rumah sakit (SIMRS) atau portal BPJS vClaim secara aman dengan isolasi konteks peramban per-sesi verifikasi.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      browser_snapshot
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Aktif</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    Mengambil Accessibility Tree untuk membaca data form SEP dan tarif INA-CBG tanpa membutuhkan token vision LLM yang boros biaya.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      browser_click
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Aktif</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    Melakukan klik presisi pada elemen tombol triase (Merah/Kuning/Hijau), konfirmasi presensi biner, dan kontrol investigasi grafik.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      browser_pdf_save
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Aktif (--caps pdf)</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    Menerbitkan berkas alasan kasus siap-audit (audit dossier) dalam format PDF resmi dengan stempel digital SHA-256 untuk arsip legal.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      browser_fill_form
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Aktif</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    Mengisi formulir berita acara verifikasi digital, catatan telaah kepatuhan Perpres 82/2018, dan parameter kueri OSRM secara otomatis.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      browser_evaluate
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Aktif</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    Mengeksekusi perhitungan deterministik di lingkungan browser untuk memverifikasi fusi skor multi-sinyal tanpa ketergantungan API pihak ketiga.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "CODE" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  Skrip Uji Otomasi End-to-End (@playwright/test)
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold shadow-2xs transition"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedCode ? "Tersalin!" : "Salin Kode Test"}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] overflow-x-auto shadow-inner leading-relaxed border border-slate-800">
                <pre>{PLAYWRIGHT_CODE_SNIPPET}</pre>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <span className="font-bold">Cara Menjalankan di Lingkungan CI/CD BPJS Kesehatan:</span>
                <p className="text-[11px] text-blue-800 font-mono">
                  $ cd frontend && npx playwright test e2e/verifier_flow.spec.ts --reporter=list
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200/80 bg-[#f8fafc] text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>Playwright MCP v0.0.83 • Chromium Headless Engine</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
