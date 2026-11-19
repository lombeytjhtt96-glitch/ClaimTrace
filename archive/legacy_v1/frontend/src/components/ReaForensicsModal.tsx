"use client";
import React, { useState, useEffect } from "react";
import {
  Code2,
  Terminal,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Play,
  Copy,
  Check,
  X,
  FileCode,
  Smartphone,
  Cpu,
  Layers,
  Search,
  ExternalLink,
  Flame,
  Bug,
  Binary
} from "lucide-react";

interface ReaForensicsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ForensicSample {
  target_id: string;
  title: string;
  category: string;
  filename: string;
  target_faskes: string;
  associated_cluster: string;
  sha256: string;
  source_code?: string;
  decompiled_summary?: string;
  risk_verdict: string;
  mitre_f3: string;
  detected_anomalies: string[];
}

const DEFAULT_SAMPLES: ForensicSample[] = [
  {
    target_id: "FS-SIMRS-INJECTOR",
    title: "SIMRS Automated Claim Injector Script",
    category: "JavaScript / SIMRS Web Hook",
    filename: "simrs_auto_claim_injector.js",
    target_faskes: "RS Sintetis X (Simulasi Baksos)",
    associated_cluster: "CLS-PHANTOM-85",
    sha256: "7d9b4f2c8a1e3b5d6f0c4a7e9b2d8f1a3c5e7b9d1f3a5c7e9b2d4f6a8c0e2b4d",
    source_code: `// SIMRS Auto-Claim Injection Daemon (Discovered in Faskes Auditing)
// Forges 85 simultaneous claims for INA-CBG Z-3-12-0 without physical consultation
const axios = require('axios');
const patientTokens = require('./harvested_jkn_participants.json');

async function batchInjectClaims() {
  console.log('[!] Starting batch claim injection for cluster CLS-PHANTOM-85...');
  for (let i = 0; i < patientTokens.length; i++) {
    const payload = {
      nomor_sep: \`SEP-20261014-99\${String(i).padStart(3, '0')}\`,
      token_peserta_aes: patientTokens[i],
      faskes_id: "FSK-RSX-01",
      tanggal_layanan: "2026-10-14",
      ina_cbg: "Z-3-12-0",
      dpjp_id_hash: "dr_sintetis_kfr_hash",
      nilai_klaim_rp: 15300000,
      skip_mobile_jkn_push: true, // Bypass notification flag
      bypass_biometric_validation: true // Direct database injection
    };
    await axios.post('http://internal-simrs/bridge/vclaim/submit', payload);
  }
}
batchInjectClaims();`,
    risk_verdict: "CRITICAL_FRAUD_INJECTOR",
    mitre_f3: "FA0002.001 (Automated Phantom Billing Fabricator)",
    detected_anomalies: [
      "Loop injeksi otomatis 85 berkas klaim massal tanpa rekaman EMR/SIMRS fisik",
      "Parameter manipulasi 'skip_mobile_jkn_push: true' untuk menghindari notifikasi peserta",
      "Bypass validasi biometrik wajah/sidik jari di pintu masuk poliklinik",
      "Penggunaan token kepesertaan hasil panen kegiatan baksos lampau"
    ]
  },
  {
    target_id: "FS-APK-JKN-BOT",
    title: "Counterfeit Mobile JKN Repacked APK Client",
    category: "Android APK / Dalvik Bytecode",
    filename: "mobile_jkn_spoof_client.apk",
    target_faskes: "RS Daerah Kartini (Kelas B)",
    associated_cluster: "CLS-PHANTOM-75",
    sha256: "4a8c0e2b4d7d9b4f2c8a1e3b5d6f0c4a7e9b2d8f1a3c5e7b9d1f3a5c7e9b2d8f",
    decompiled_summary: `Class: com.bpjs.mobilejkn.service.AttendanceVerificationService
Hook: Xposed / Frida injection targeting checkInLocation() and confirmAttendance()
Bypass Logic:
- Overrides GPS Location Provider with fixed coordinates (-7.5583, 110.8272)
- Replaces camera preview feed with pre-recorded static JPG selfie
- Forges HTTP POST to /api/v1/mobile/confirm with status: ATTENDED_AUTO_CONFIRMED`,
    risk_verdict: "CRITICAL_SPOOFING_CLIENT",
    mitre_f3: "F1005.006 (Beneficiary Impersonation Bot)",
    detected_anomalies: [
      "Sertifikat penandatanganan APK tidak cocok dengan SHA-256 resmi BPJS Kesehatan",
      "Pustaka Hooking libfrida-gadget.so disematkan dalam folder lib/arm64-v8a",
      "Pemalsuan koordinat geolokasi faskes secara statis (GPS Spoofing)",
      "Automasi konfirmasi presensi biner palsu pada lapis 3 triase pra-bayar"
    ]
  },
  {
    target_id: "FS-VCLAIM-BRIDGE-HOOK",
    title: "vClaim Bridging Adapter IL/CIL Hook",
    category: ".NET Assembly / CIL Bytecode",
    filename: "BPJS.Bridging.Adapter.vClaim.dll",
    target_faskes: "RS Sintetis Medika Prima",
    associated_cluster: "CLS-UPCODING-8806",
    sha256: "3c5e7b9d1f3a5c7e9b2d4f6a8c0e2b4d7d9b4f2c8a1e3b5d6f0c4a7e9b2d8f1a",
    decompiled_summary: `Method: BPJS.Bridging.Adapter.vClaim.GrouperService::MapInaCbgCode(ClaimRecord record)
CIL Instruction Patch:
IL_0012: ldarg.1
IL_0013: ldfld string ClaimRecord::PrimaryDiagnosis
IL_0018: ldstr "K29.7" // Gastritis Ringan (Tarif Rp1.950.000)
IL_001d: call bool [mscorlib]System.String::op_Equality(string, string)
IL_0022: brfalse.s IL_0035
// PATCH INJECTED: Intercept and upcode to K-1-10-III (Tarif Rp28.600.000)
IL_0024: ldarg.1
IL_0025: ldstr "K-1-10-III"
IL_002a: stfld string ClaimRecord::InaCbgCode
IL_002f: ldarg.1
IL_0030: ldc.i8 28600000
IL_0035: ret`,
    risk_verdict: "CRITICAL_UPCODING_INTERCEPTOR",
    mitre_f3: "FA0001.002 (Grouper Interception & INA-CBG Upcoding)",
    detected_anomalies: [
      "Injeksi instruksi CIL IL_0024 yang mengubah kode CBG K-4-17-I menjadi K-1-10-III",
      "Penggelembungan nilai klaim sebesar 14.6x (dari Rp1.950.000 menjadi Rp28.600.000)",
      "Checksum PE header berbeda dari berkas adapter vClaim terverifikasi BPJS",
      "Memicu sinyal diskrepansi diagnosis Lapis 1 pada klaim CLM-2026-8806"
    ]
  }
];

export const ReaForensicsModal: React.FC<ReaForensicsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"DECOMPILER" | "ANALYZER" | "APK_INSPECTOR" | "REA_SPEC">("DECOMPILER");
  const [samples, setSamples] = useState<ForensicSample[]>(DEFAULT_SAMPLES);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("FS-SIMRS-INJECTOR");
  const [copied, setCopied] = useState(false);

  // Script Analyzer State
  const [customCode, setCustomCode] = useState<string>(DEFAULT_SAMPLES[0].source_code || "");
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const selectedSample = samples.find((s) => s.target_id === selectedTargetId) || samples[0];

  useEffect(() => {
    if (!isOpen) return;

    const fetchSamples = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/rea/samples");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.samples) && data.samples.length > 0) {
            setSamples(data.samples);
          }
        }
      } catch (err) {
        console.warn("Gagal memuat sampel bukti forensik dari backend:", err);
      }
    };

    fetchSamples();
  }, [isOpen]);

  const handleRunStaticAnalysis = async () => {
    if (!customCode.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/rea/analyze-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: customCode })
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
      }
    } catch (err) {
      console.error("Gagal menjalankan analisis statis REA:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* Header Modal - Full Light Theme */}
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs">
              <Binary className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  REA Forensik Klien & Reverse Engineering Engine
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200">
                  morluto/rea v6.7.0
                </span>
                <span className="text-[10px] font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                  207 MCP Tools
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Investigasi bukti digital berkas SIMRS faskes, dekompilasi bot presensi APK, dan analisis manipulasi adapter vClaim
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab("DECOMPILER")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "DECOMPILER"
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Bukti Dekompilasi & Artefak Audit</span>
          </button>

          <button
            onClick={() => setActiveTab("ANALYZER")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "ANALYZER"
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Analisis Statis Skrip Klien (AST)</span>
          </button>

          <button
            onClick={() => setActiveTab("APK_INSPECTOR")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "APK_INSPECTOR"
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Inspektor APK Mobile JKN Palsu</span>
          </button>

          <button
            onClick={() => setActiveTab("REA_SPEC")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "REA_SPEC"
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>REA Spec & Tool Catalog</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] space-y-6">

          {/* TAB 1: BUKTI DEKOMPILASI & ARTEFAK AUDIT */}
          {activeTab === "DECOMPILER" && (
            <div className="space-y-5">
              {/* Target Artifact Selector */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-violet-600" />
                  <span>Pilih Artefak Bukti Forensik Klien yang Disita saat Audit Lapangan</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {samples.map((s) => (
                    <button
                      key={s.target_id}
                      onClick={() => {
                        setSelectedTargetId(s.target_id);
                        if (s.source_code) setCustomCode(s.source_code);
                      }}
                      className={`text-left p-3 rounded-xl border transition ${
                        selectedTargetId === s.target_id
                          ? "bg-violet-50/70 border-violet-400 shadow-2xs"
                          : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {s.title}
                      </div>
                      <div className="text-[11px] font-mono text-violet-700 mt-0.5 truncate">
                        {s.filename}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>{s.category}</span>
                        <span className="font-bold text-rose-600">{s.risk_verdict.split("_")[0]}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Artifact Metadata Card */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>{selectedSample.title}</span>
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {selectedSample.risk_verdict}
                      </span>
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5 font-mono">
                      Faskes Sasaran: {selectedSample.target_faskes} • Klaster: {selectedSample.associated_cluster}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Taksonomi MITRE F3</span>
                    <div className="font-mono text-xs font-bold text-violet-700">{selectedSample.mitre_f3}</div>
                  </div>
                </div>

                {/* Detected Anomalies List */}
                <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3 space-y-1.5">
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Temuan Anomali & Bukti Rekayasa Forensik:</span>
                  </div>
                  <ul className="text-xs text-rose-800 space-y-1 list-disc list-inside">
                    {selectedSample.detected_anomalies.map((anom, idx) => (
                      <li key={idx}>{anom}</li>
                    ))}
                  </ul>
                </div>

                {/* Code / Bytecode Display */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold uppercase tracking-wider">
                      {selectedSample.source_code ? "Dekomplikasi Kode Sumber JavaScript" : "Hasil Disassembly CIL / Dalvik Bytecode"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        SHA-256: {selectedSample.sha256.substring(0, 16)}...
                      </span>
                      <button
                        onClick={() => handleCopy(selectedSample.source_code || selectedSample.decompiled_summary || "")}
                        className="text-violet-700 hover:text-violet-900 flex items-center gap-1 font-medium"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Salin</span>
                      </button>
                    </div>
                  </div>

                  <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-72 leading-relaxed border border-slate-800">
                    {selectedSample.source_code || selectedSample.decompiled_summary}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANALISIS STATIS SKRIP KLIEN (AST) */}
          {activeTab === "ANALYZER" && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-violet-600" />
                    <span>Uji Kode Sumber Skrip Bridging SIMRS / Script Faskes</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCustomCode(DEFAULT_SAMPLES[0].source_code || "")}
                      className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    >
                      Muat Skrip Injector (#6)
                    </button>
                    <button
                      onClick={() => setCustomCode(`function logVisit(nik) {\n  console.log('Antrean pasien terverifikasi:', nik);\n  return true;\n}`)}
                      className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    >
                      Muat Kode Bersih
                    </button>
                  </div>
                </div>

                <textarea
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  rows={8}
                  className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white text-slate-900"
                  placeholder="Tempelkan kode JavaScript atau CIL adapter yang ditemukan pada workstation faskes..."
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleRunStaticAnalysis}
                    disabled={isAnalyzing}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{isAnalyzing ? "Menganalisis Kode..." : "Jalankan Analisis Statis REA"}</span>
                  </button>
                </div>
              </div>

              {/* Analysis Result Display */}
              {analysisResult && (
                <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Hasil Audit Statis REA</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        analysisResult.risk_score >= 70
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        Vonis: {analysisResult.verdict}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      Skor Risiko Klien: {analysisResult.risk_score} / 100
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Baris Kode (SLOC)</span>
                      <div className="font-bold text-slate-900 font-mono mt-0.5">{analysisResult.line_count} Baris</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Anomali Terdeteksi</span>
                      <div className="font-bold text-rose-700 font-mono mt-0.5">{analysisResult.detected_anomalies.length} Pelanggaran</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Segel SHA-256</span>
                      <div className="font-mono text-[11px] text-slate-600 truncate mt-0.5">{analysisResult.artifact_sha256}</div>
                    </div>
                  </div>

                  {analysisResult.detected_anomalies.length > 0 && (
                    <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3 space-y-1">
                      <span className="text-xs font-bold text-rose-900">Rincian Pola Kecurangan:</span>
                      <ul className="text-xs text-rose-800 space-y-1 list-disc list-inside">
                        {analysisResult.detected_anomalies.map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INSPEKTOR APK MOBILE JKN PALSU */}
          {activeTab === "APK_INSPECTOR" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-violet-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Anatomi Rekayasa APK Mobile JKN Palsu (Modus Sindikat #6)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Bagaimana sindikat mencoba memalsukan respons biner konfirmasi kehadiran pada Lapis 3 Triase ClaimTrace
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Bug className="w-3.5 h-3.5 text-rose-600" />
                      <span>Metode Penetrasi & Tampering Sindikat</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sindikat menyebarkan APK klonifikasi atau menyuntikkan modul Xposed / Frida (`mobile_jkn_spoof_client.apk`) pada perangkat ponsel milik oknum faskes untuk melakukan auto-confirm kehadiran peserta baksos fiktif secara massal.
                    </p>
                    <div className="text-[11px] font-mono bg-rose-50 text-rose-700 p-2 rounded border border-rose-200">
                      Target Hook: checkInLocation() & confirmAttendance()
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                    <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pertahanan Multi-Sinyal ClaimTrace</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      ClaimTrace tidak mempercayai sinyal Mobile JKN secara terisolasi. Jika APK mencoba memalsukan presensi, Lapis 1 (Lonjakan Klaster 8.5x) dan Lapis 2 (SIP DPJP Expired) tetap memicu **Hard Trigger Jalur Merah**, menggagalkan pencairan klaim pra-bayar.
                    </p>
                    <div className="text-[11px] font-mono bg-white text-emerald-800 p-2 rounded border border-emerald-200">
                      Aturan Deterministik: Hard Trigger Independen Aktif
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REA SPEC & TOOL CATALOG */}
          {activeTab === "REA_SPEC" && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-violet-600" />
                    <span>Daftar Tool Forensik REA (morluto/rea Specification)</span>
                  </div>
                  <span className="text-[10px] font-mono bg-violet-50 text-violet-700 px-2 py-0.5 rounded border border-violet-200 font-bold">
                    FastMCP Stdio Transport
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                        <th className="py-2 px-3">Nama Tool REA</th>
                        <th className="py-2 px-3">Kategori Analisis</th>
                        <th className="py-2 px-3">Kegunaan Forensik Klaim JKN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-violet-700">analyze-javascript-application</td>
                        <td className="py-2.5 px-3 text-slate-500 font-sans">JavaScript / Electron</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">Rekonstruksi statis aplikasi klien SIMRS berbasis Electron/Web tanpa eksekusi langsung.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-violet-700">inspect_native_binary</td>
                        <td className="py-2.5 px-3 text-slate-500 font-sans">Native / DLL</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">Inspeksi simbol, dependensi DLL, dan pseudocode adapter vClaim eksternal faskes.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-violet-700">decode-android-resources</td>
                        <td className="py-2.5 px-3 text-slate-500 font-sans">Android APK</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">Dekode berkas manifest dan certificate hash untuk verifikasi keaslian aplikasi Mobile JKN.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-violet-700">compare-application-versions</td>
                        <td className="py-2.5 px-3 text-slate-500 font-sans">Integrity Verification</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">Membandingkan struktur AST aplikasi bridging resmi BPJS vs versi modifikasi faskes.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-violet-700">inspect_sqlite_database</td>
                        <td className="py-2.5 px-3 text-slate-500 font-sans">Database Forensics</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">Inspeksi basis data SQLite lokal workstation faskes untuk melacak transaksi terhapus.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-violet-700">build-reconstruction-obligation-ledger</td>
                        <td className="py-2.5 px-3 text-slate-500 font-sans">Evidence Ledger</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">Penerbitan buku besar kewajiban bukti rekonstruksi digital anti-rekayasa.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MCP Configuration Snippet */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-violet-600" />
                    <span>Konfigurasi mcp_config.json Antigravity</span>
                  </div>
                  <button
                    onClick={() => handleCopy(`{\n  "rea": {\n    "command": "node",\n    "args": [\n      "/home/Khalaf-Dev/.npm/_npx/a1722018f28f9df2/node_modules/rea-agents/scripts/rea.mjs",\n      "mcp"\n    ]\n  }\n}`)}
                    className="flex items-center gap-1 text-xs text-violet-700 hover:text-violet-900 font-medium"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>Salin Konfigurasi</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 overflow-x-auto">
{`"rea": {
  "command": "node",
  "args": [
    "/home/Khalaf-Dev/.npm/_npx/a1722018f28f9df2/node_modules/rea-agents/scripts/rea.mjs",
    "mcp"
  ]
}`}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Binary className="w-3.5 h-3.5 text-violet-600" />
            <span>ClaimTrace REA Forensics • Healthkathon BPJS Kesehatan 2026</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition"
          >
            Tutup Panel Forensik
          </button>
        </div>

      </div>
    </div>
  );
};
