"use client";
import React, { useState, useEffect } from "react";
import {
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  X,
  Layers,
  Sparkles,
  Shield,
  FileText,
  GitCompare,
  Activity,
  Cpu,
  RefreshCw,
  ArrowRight,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";

interface ChromaSemanticModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClaimId: string;
}

interface MatchEntry {
  matched_claim_id: string;
  patient_name: string;
  nama_faskes: string;
  cluster_id: string;
  cosine_similarity_pct: number;
  diff_ratio_pct: number;
  is_same_faskes: boolean;
  is_same_cluster: boolean;
  is_plagiarized_clone: boolean;
  matched_excerpt: string;
}

interface PlagiarismAnalysis {
  claim_id: string;
  target_resume_text: string;
  is_plagiarized: boolean;
  max_similarity_pct: number;
  severity: string;
  recommendation: string;
  signal_code: string | null;
  matches: MatchEntry[];
}

interface ClusterMatrixData {
  cluster_id: string;
  claim_ids: string[];
  patient_names: string[];
  matrix: number[][];
  is_mass_clone_detected: boolean;
}

export const ChromaSemanticModal: React.FC<ChromaSemanticModalProps> = ({
  isOpen,
  onClose,
  selectedClaimId,
}) => {
  const [activeTab, setActiveTab] = useState<"ANALYSIS" | "MATRIX" | "CUSTOM_CHECK" | "SPEC">("ANALYSIS");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Analysis State
  const [analysisData, setAnalysisData] = useState<PlagiarismAnalysis | null>(null);

  // Matrix State
  const [selectedCluster, setSelectedCluster] = useState<string>("CLS-PHANTOM-85");
  const [matrixData, setMatrixData] = useState<ClusterMatrixData | null>(null);

  // Custom Text State
  const [customText, setCustomText] = useState<string>(
    "Pasien mengeluh nyeri punggung bawah (Low Back Pain) menjalar ke paha posterior dextra sejak 2 minggu. " +
    "Pemeriksaan fisik: Lasegue (+), Patrick (-), Kontraktur otot paravertebral L4-L5 (+). " +
    "Tindakan: Fisioterapi komprehensif, Short Wave Diathermy (SWD) dan Lumbar Traction 93.39 serial 5 sesi."
  );
  const [customResults, setCustomResults] = useState<any | null>(null);
  const [customLoading, setCustomLoading] = useState(false);

  // Fetch analysis for selected claim
  useEffect(() => {
    if (!isOpen) return;
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/api/v1/semantic/verify-claim/${selectedClaimId}`);
        if (res.ok) {
          const data = await res.json();
          setAnalysisData(data);
        }
      } catch (err) {
        console.error("Gagal memuat analisis ChromaDB:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [isOpen, selectedClaimId]);

  // Fetch matrix for cluster
  useEffect(() => {
    if (!isOpen) return;
    const fetchMatrix = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/semantic/cluster-matrix/${selectedCluster}`);
        if (res.ok) {
          const data = await res.json();
          setMatrixData(data);
        }
      } catch (err) {
        console.error("Gagal memuat matriks klaster:", err);
      }
    };
    fetchMatrix();
  }, [isOpen, selectedCluster]);

  const handleRunCustomCheck = async () => {
    if (!customText.trim()) return;
    setCustomLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/semantic/verify-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: customText, top_k: 4 }),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomResults(data);
      }
    } catch (err) {
      console.error("Gagal verifikasi teks:", err);
    } finally {
      setCustomLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">
                  ChromaDB Semantic Engine • Deteksi Plagiarisme Narasi Klinis
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ChromaDB v1.5.9
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                  all-MiniLM-L6-v2 (Local ONNX)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengawasan Vektor Antar-Pasien untuk Mencegah Fabrikasi Resume Medis pada Modus #6 Phantom Billing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab("ANALYSIS")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "ANALYSIS"
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/40"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Audit Klaim Terpilih ({selectedClaimId})
          </button>
          <button
            onClick={() => setActiveTab("MATRIX")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "MATRIX"
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/40"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Matriks Kemiripan Klaster (NxN Heatmap)
          </button>
          <button
            onClick={() => setActiveTab("CUSTOM_CHECK")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "CUSTOM_CHECK"
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/40"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            Uji Teks Resume Kustom (Live Vector Search)
          </button>
          <button
            onClick={() => setActiveTab("SPEC")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "SPEC"
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/40"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Spesifikasi Arsitektur Vektor
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {activeTab === "ANALYSIS" && (
            <div className="space-y-6">
              {/* Status Banner */}
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                  <p className="text-sm font-medium">Memindai embeddings vektor di ChromaDB...</p>
                </div>
              ) : analysisData ? (
                <>
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-4 ${
                      analysisData.is_plagiarized
                        ? "bg-red-50 border-red-200 text-red-900"
                        : analysisData.max_similarity_pct >= 75
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-emerald-50 border-emerald-200 text-emerald-900"
                    }`}
                  >
                    <div className="mt-0.5">
                      {analysisData.is_plagiarized ? (
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm">
                          {analysisData.is_plagiarized
                            ? "CRITICAL: Plagiarisme Teks Resume Medis Terdeteksi!"
                            : "DIVERSIFIKASI NORMAL: Narasi Klinis Terbukti Independen"}
                        </span>
                        {analysisData.signal_code && (
                          <span className="px-2 py-0.5 bg-red-600 text-white font-mono font-bold text-xs rounded shadow-sm">
                            {analysisData.signal_code}
                          </span>
                        )}
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/80 border">
                          Max Kemiripan: {analysisData.max_similarity_pct}%
                        </span>
                      </div>
                      <p className="text-xs mt-1.5 leading-relaxed font-medium">
                        {analysisData.recommendation}
                      </p>
                    </div>
                  </div>

                  {/* Target Claim Text */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        Teks Resume Medis Klaim Sasaran ({selectedClaimId})
                      </span>
                      <button
                        onClick={() => copyToClipboard(analysisData.target_resume_text)}
                        className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Tersalin" : "Salin Teks"}
                      </button>
                    </div>
                    <p className="text-xs font-mono text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                      {analysisData.target_resume_text}
                    </p>
                  </div>

                  {/* Nearest Vector Matches */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <GitCompare className="w-3.5 h-3.5 text-emerald-600" />
                      Tetangga Vektor Terdekat di Repositori Nasional (Top Matches)
                    </h4>

                    {analysisData.matches.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Tidak ada dokumen lain yang cocok.</p>
                    ) : (
                      analysisData.matches.map((m, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border transition ${
                            m.is_plagiarized_clone
                              ? "bg-red-50/60 border-red-300"
                              : "bg-white border-slate-200 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 font-mono">
                                {m.matched_claim_id}
                              </span>
                              <span className="text-xs text-slate-600">• {m.patient_name}</span>
                              <span className="text-xs text-slate-500">• {m.nama_faskes}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                                  m.cosine_similarity_pct >= 90
                                    ? "bg-red-600 text-white"
                                    : m.cosine_similarity_pct >= 70
                                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                }`}
                              >
                                Cosine Sim: {m.cosine_similarity_pct}%
                              </span>
                              <span className="text-xs text-slate-500 font-mono">
                                Diff Ratio: {m.diff_ratio_pct}%
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 text-xs font-mono text-slate-700 bg-white p-2.5 rounded border border-slate-200">
                            {m.matched_excerpt}
                          </div>

                          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              Klaster: <strong className="text-slate-700">{m.cluster_id}</strong>
                            </span>
                            <span>•</span>
                            <span className={m.is_same_faskes ? "text-amber-700 font-semibold" : "text-slate-500"}>
                              {m.is_same_faskes ? "⚠️ Faskes Sama" : "Faskes Berbeda"}
                            </span>
                            <span>•</span>
                            <span className={m.is_plagiarized_clone ? "text-red-700 font-bold" : "text-emerald-700"}>
                              {m.is_plagiarized_clone
                                ? "🚨 Terdeteksi Copy-Paste / Kloning Medis"
                                : "✅ Narasi Klinis Sah"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}

          {activeTab === "MATRIX" && (
            <div className="space-y-6">
              {/* Cluster Selector */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Pilih Klaster Pemeriksaan Baksos / Massal:
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCluster("CLS-PHANTOM-85")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        selectedCluster === "CLS-PHANTOM-85"
                          ? "bg-red-600 text-white border-red-700 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      CLS-PHANTOM-85 (Baksos Fiktif Fisioterapi - RS X)
                    </button>
                    <button
                      onClick={() => setSelectedCluster("CLS-LEGAL-KATARAK")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        selectedCluster === "CLS-LEGAL-KATARAK"
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      CLS-LEGAL-KATARAK (Baksos Katarak Resmi - RS Mata Z)
                    </button>
                  </div>
                </div>

                {matrixData && (
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        matrixData.is_mass_clone_detected
                          ? "bg-red-100 text-red-800 border border-red-300"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      }`}
                    >
                      {matrixData.is_mass_clone_detected ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          Kloning Massal Terbukti (&gt;90% Sim)
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Diversitas Klinis Sah
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Matrix Heatmap Table */}
              {matrixData && matrixData.matrix.length > 0 ? (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Matriks Kemiripan Pairwise Teks Resume Medis (Skala Persentase %)
                  </h4>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2.5 text-left bg-slate-100 border border-slate-200 font-bold text-slate-700">
                          Klaim / Pasien
                        </th>
                        {matrixData.claim_ids.map((cid, i) => (
                          <th
                            key={i}
                            className="p-2.5 text-center bg-slate-100 border border-slate-200 font-mono font-bold text-slate-700"
                          >
                            {cid}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixData.claim_ids.map((rowId, i) => (
                        <tr key={i} className="hover:bg-slate-50/80">
                          <td className="p-2.5 border border-slate-200 font-mono font-medium text-slate-900 bg-slate-50">
                            <div>{rowId}</div>
                            <div className="text-[10px] text-slate-500 font-sans">
                              {matrixData.patient_names[i]}
                            </div>
                          </td>
                          {matrixData.matrix[i].map((val, j) => {
                            const isDiag = i === j;
                            const isHigh = val >= 90.0 && !isDiag;
                            return (
                              <td
                                key={j}
                                className={`p-2.5 text-center border border-slate-200 font-mono font-bold ${
                                  isDiag
                                    ? "bg-slate-100 text-slate-400"
                                    : isHigh
                                    ? "bg-red-500 text-white font-extrabold shadow-inner"
                                    : val >= 70
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-emerald-50 text-emerald-800"
                                }`}
                              >
                                {val.toFixed(1)}%
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t pt-3">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-red-500 rounded"></span>
                        <strong>≥ 90%:</strong> Kloning / Copy-Paste Identik (Fraud)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-amber-100 border border-amber-300 rounded"></span>
                        <strong>70-89%:</strong> Parafrase Template
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-emerald-50 border border-emerald-300 rounded"></span>
                        <strong>&lt; 70%:</strong> Variasi Klinis Alami
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-white rounded-xl border">
                  Tidak ada data matriks untuk klaster ini.
                </div>
              )}
            </div>
          )}

          {activeTab === "CUSTOM_CHECK" && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Uji Narasi Resume Medis / Temuan Klinis Baru Terhadap Repositori Vektor BPJS:
                </label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={4}
                  className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50"
                  placeholder="Ketik atau tempel resume medis pasien di sini..."
                />
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-slate-500">
                    Karakter: <strong>{customText.length}</strong> | Model: <strong>all-MiniLM-L6-v2</strong>
                  </span>
                  <button
                    onClick={handleRunCustomCheck}
                    disabled={customLoading || !customText.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                  >
                    {customLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    {customLoading ? "Mencari Vektor..." : "Cari Kemiripan Semantik"}
                  </button>
                </div>
              </div>

              {/* Custom Check Results */}
              {customResults && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Hasil Pencarian Kemiripan Vektor ({customResults.total_matches} Temuan)
                    </h4>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded font-mono ${
                        customResults.highest_similarity_pct >= 90
                          ? "bg-red-600 text-white"
                          : customResults.highest_similarity_pct >= 70
                          ? "bg-amber-100 text-amber-800 border"
                          : "bg-emerald-100 text-emerald-800 border"
                      }`}
                    >
                      Kemiripan Tertinggi: {customResults.highest_similarity_pct}%
                    </span>
                  </div>

                  {customResults.matches.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs font-mono text-slate-900">{item.claim_id}</span>
                          <span className="text-xs text-slate-600">• {item.patient_name}</span>
                          <span className="text-xs text-slate-500">• {item.nama_faskes}</span>
                        </div>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 border text-slate-800">
                          Cosine Sim: {item.cosine_similarity_pct}%
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                        {item.resume_excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "SPEC" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  Arsitektur ChromaDB dalam Ekosistem ClaimTrace (Healthkathon 2026)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pada kecurangan <strong>Modus #6 Phantom Billing</strong>, sindikat faskes nakal kerap mendaftarkan
                  puluhan hingga ratusan peserta baksos palsu. Karena keterbatasan waktu dalam merekayasa berkas fisik,
                  oknum selalu melakukan <em>copy-paste</em> teks resume medis (temuan fisik, rencana terapi, instruksi pasca-bedah)
                  secara massal dan hanya mengganti nama/NIK pasien.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Vektor Indexing
                    </span>
                    <p className="font-bold text-sm text-slate-900 mt-1">HNSW Cosine Space</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Hierarchical Navigable Small World Graph dengan jarak kosinus berkecepatan sub-milidetik.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Model Embeddings
                    </span>
                    <p className="font-bold text-sm text-slate-900 mt-1">all-MiniLM-L6-v2 ONNX</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Berjalan 100% lokal di dalam server BPJS (Airgapped / On-Premise) tanpa mengirim data rekam medis ke internet.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Batas Ambang Fraud
                    </span>
                    <p className="font-bold text-sm text-red-600 mt-1">&ge; 90.0% Kemiripan</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Memicu sinyal deterministik <code>IND-SEM-COPYPASTE</code> dan merekomendasikan Triase Merah.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    Kepatuhan Regulasi & Non-Repudiasi:
                  </span>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
                    <li>
                      <strong>UU PDP No. 27/2022:</strong> Tokenisasi NIK dan penyamaran identitas medis dilakukan sebelum proses komputasi vektor.
                    </li>
                    <li>
                      <strong>Perpres 82/2018:</strong> Bukti kesamaan teks dihitung secara matematis dan transparan (bukan halusinasi generatif LLM) untuk mendukung kepatuhan SLA 10 hari kerja verifikator Vedika.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>ChromaDB Vector Security • BPJS Kesehatan Healthkathon 2026 • Tim TINEERENSE</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
