"use client";
import React, { useState, useEffect } from "react";
import {
  Activity,
  Terminal,
  Play,
  Copy,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  Flame,
  BarChart3,
  RefreshCw,
  Cpu,
  Search,
  ExternalLink,
  Info,
  Radio,
  FileText
} from "lucide-react";

interface PrometheusMcpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AlertItem {
  labels: {
    alertname: string;
    severity: string;
    [key: string]: string;
  };
  annotations: {
    summary: string;
    description: string;
    runbook_url?: string;
  };
  state: string;
  activeAt: string;
  value: string;
}

interface MetricMeta {
  metric: string;
  type: string;
  help: string;
}

export const PrometheusMcpModal: React.FC<PrometheusMcpModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"PROMQL_CONSOLE" | "LIVE_TELEMETRY" | "ACTIVE_ALERTS" | "MCP_SPEC">("PROMQL_CONSOLE");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // PromQL Console State
  const [promqlQuery, setPromqlQuery] = useState<string>("claimtrace_financial_exposure_rupiah");
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [queryTimeMs, setQueryTimeMs] = useState<number>(0);
  const [resultFormat, setResultFormat] = useState<"table" | "json">("table");

  // Telemetry & Alerts State
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [metricsMetadata, setMetricsMetadata] = useState<MetricMeta[]>([]);
  const [metricsExpositionText, setMetricsExpositionText] = useState<string>("");
  const [runtimeInfo, setRuntimeInfo] = useState<any | null>(null);

  // Preset queries
  const PRESET_QUERIES = [
    {
      name: "Eksposur Finansial per Jalur",
      query: "claimtrace_financial_exposure_rupiah",
      description: "Agregasi Rupiah klaim aktif pada jalur MERAH, KUNING, dan HIJAU"
    },
    {
      name: "Skor Prioritas Triase",
      query: "claimtrace_priority_score",
      description: "Distribusi skor risiko triase multi-sinyal pra-bayar (0 - 100)"
    },
    {
      name: "Statutory SLA Vedika 10 Hari",
      query: "claimtrace_vedika_sla_days_remaining",
      description: "Hitung mundur sisa hari batas verifikasi sesuai Perpres 82/2018"
    },
    {
      name: "Status Integritas Audit Trail",
      query: "claimtrace_audit_integrity_status",
      description: "Kepatuhan rantai blok hash SHA-256 anti-tamper (1 = Valid, 0 = Rusak)"
    },
    {
      name: "Rasio Konfirmasi Mobile JKN",
      query: "claimtrace_mobile_jkn_confirmation_ratio",
      description: "Rasio presensi peserta mandiri vs anomali sanggahan kehadiran"
    },
    {
      name: "Total Volume Klaim Terproses",
      query: "claimtrace_claims_total",
      description: "Volume throughput berkas klaim masuk dalam pipeline verifikasi"
    }
  ];

  // Fetch initial telemetry data
  useEffect(() => {
    if (!isOpen) return;

    const fetchTelemetry = async () => {
      try {
        const [alertsRes, metaRes, expoRes, runtimeRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/v1/prometheus/alerts"),
          fetch("http://127.0.0.1:8000/api/v1/prometheus/metadata"),
          fetch("http://127.0.0.1:8000/metrics"),
          fetch("http://127.0.0.1:8000/api/v1/prometheus/runtime")
        ]);

        if (alertsRes.ok) {
          const aData = await alertsRes.json();
          setAlerts(aData?.data?.alerts || []);
        }

        if (metaRes.ok) {
          const mData = await metaRes.json();
          setMetricsMetadata(mData?.data || []);
        }

        if (expoRes.ok) {
          const eText = await expoRes.text();
          setMetricsExpositionText(eText);
        }

        if (runtimeRes.ok) {
          const rData = await runtimeRes.json();
          setRuntimeInfo(rData?.data || null);
        }
      } catch (err) {
        console.warn("Gagal memuat telemetri Prometheus dari backend:", err);
      }
    };

    fetchTelemetry();
    handleRunQuery("claimtrace_financial_exposure_rupiah");
  }, [isOpen]);

  const handleRunQuery = async (queryToRun?: string) => {
    const q = queryToRun || promqlQuery;
    if (!q.trim()) return;

    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/prometheus/query?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      setQueryResult(data);
    } catch (err) {
      console.error("PromQL Query execution error:", err);
      setQueryResult({
        status: "error",
        error: "Gagal terhubung ke Prometheus Engine pada port 8000."
      });
    } finally {
      setQueryTimeMs(Math.round(performance.now() - start));
      setLoading(false);
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
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-xs">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Prometheus MCP Server & Observability Engine
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                  Official MCP Spec
                </span>
                <span className="text-[10px] font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                  v2.54.0 • Port 8000
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemantauan real-time SLO/SLA statutory 10 hari Vedika, anomali lonjakan klaster (#6), dan rantai audit hash SHA-256
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
            onClick={() => setActiveTab("PROMQL_CONSOLE")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "PROMQL_CONSOLE"
                ? "border-rose-600 text-rose-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>PromQL Console & Query Runner</span>
          </button>

          <button
            onClick={() => setActiveTab("LIVE_TELEMETRY")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "LIVE_TELEMETRY"
                ? "border-rose-600 text-rose-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Telemetry & Gauges</span>
          </button>

          <button
            onClick={() => setActiveTab("ACTIVE_ALERTS")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "ACTIVE_ALERTS"
                ? "border-rose-600 text-rose-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Active Alerts & Rules</span>
            {alerts.length > 0 && (
              <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {alerts.length} Firing
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("MCP_SPEC")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "MCP_SPEC"
                ? "border-rose-600 text-rose-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Prometheus MCP Spec & Tools</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] space-y-6">

          {/* TAB 1: PROMQL CONSOLE */}
          {activeTab === "PROMQL_CONSOLE" && (
            <div className="space-y-5">
              {/* Presets Quick Picker */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Preset Kueri Metrik ClaimTrace</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {PRESET_QUERIES.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPromqlQuery(preset.query);
                        handleRunQuery(preset.query);
                      }}
                      className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 transition group"
                    >
                      <div className="text-xs font-bold text-slate-800 group-hover:text-rose-700">
                        {preset.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                        {preset.query}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Query Input Box */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-rose-600" />
                    <span>PromQL Expression</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setResultFormat("table")}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
                        resultFormat === "table"
                          ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      Tabel Vektor
                    </button>
                    <button
                      onClick={() => setResultFormat("json")}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
                        resultFormat === "json"
                          ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      JSON Response
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promqlQuery}
                    onChange={(e) => setPromqlQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRunQuery();
                    }}
                    placeholder="e.g. claimtrace_financial_exposure_rupiah or claimtrace_priority_score"
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-900"
                  />
                  <button
                    onClick={() => handleRunQuery()}
                    disabled={loading}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-white" />
                    )}
                    <span>Jalankan PromQL</span>
                  </button>
                </div>
              </div>

              {/* Query Result View */}
              {queryResult && (
                <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase tracking-wider text-slate-700">Hasil Evaluasi PromQL</span>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        Status: {queryResult.status}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        Tipe: {queryResult?.data?.resultType || "vector"}
                      </span>
                    </div>
                    <span className="font-mono text-slate-400">
                      Waktu Eksekusi: {queryTimeMs} ms
                    </span>
                  </div>

                  {resultFormat === "table" ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                            <th className="py-2 px-3">Metrik & Label Sets</th>
                            <th className="py-2 px-3 text-right">Nilai Telemetri</th>
                            <th className="py-2 px-3 text-right">Timestamp Evaluasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {queryResult?.data?.result?.map((item: any, idx: number) => {
                            const labels = Object.entries(item.metric)
                              .filter(([k]) => k !== "__name__")
                              .map(([k, v]) => `${k}="${v}"`)
                              .join(", ");
                            const metricName = item.metric["__name__"] || promqlQuery;
                            const val = item.value?.[1] || "0";
                            const numVal = parseFloat(val);
                            const formattedVal = !isNaN(numVal) && numVal > 1000
                              ? `Rp${numVal.toLocaleString("id-ID")}`
                              : val;

                            return (
                              <tr key={idx} className="hover:bg-slate-50/70 transition">
                                <td className="py-2.5 px-3">
                                  <span className="font-bold text-rose-700">{metricName}</span>
                                  {labels && (
                                    <span className="text-slate-500 ml-1.5 font-normal">
                                      {"{"}{labels}{"}"}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                  {formattedVal}
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                                  {new Date(item.value?.[0] * 1000).toLocaleTimeString("id-ID")}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={() => handleCopy(JSON.stringify(queryResult, null, 2))}
                        className="absolute top-2 right-2 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition"
                        title="Salin JSON"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-800 overflow-x-auto max-h-60">
                        {JSON.stringify(queryResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE TELEMETRY & GAUGES */}
          {activeTab === "LIVE_TELEMETRY" && (
            <div className="space-y-5">
              {/* Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Eksposur Finansial</span>
                    <BarChart3 className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    Rp79,62 Juta
                  </div>
                  <div className="text-[11px] text-rose-700 font-medium mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
                    <span>MERAH: Rp72,45 Jt (90.9%)</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Statutory SLA Vedika</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-xl font-black text-amber-600 font-mono">
                    3 Hari Kerja
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    Sisa waktu CLM-2026-8801 (Perpres 82)
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Rantai Audit SHA-256</span>
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-black text-emerald-600 font-mono">
                    100% Valid
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    Tamper-evident hash integrity aktif
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Presensi Peserta JKN</span>
                    <Radio className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xl font-black text-blue-600 font-mono">
                    54.2% Hadir
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    45.8% Sanggahan tidak hadir
                  </div>
                </div>
              </div>

              {/* Descriptive Metrics Catalog */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-rose-600" />
                  <span>Koleksi Metrik Prometheus Terdaftar</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {metricsMetadata.map((meta, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-rose-700">{meta.metric}</span>
                        <p className="text-slate-500 text-[11px] mt-0.5">{meta.help}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 uppercase border border-slate-200">
                        {meta.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Prometheus Exposition Text Viewer */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-rose-600" />
                    <span>Raw Exposition Output (GET /metrics)</span>
                  </div>
                  <button
                    onClick={() => handleCopy(metricsExpositionText)}
                    className="flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 font-medium"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>Salin Format Prometheus</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-800 overflow-x-auto max-h-52">
                  {metricsExpositionText || "# Menunggu pembacaan /metrics..."}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE ALERTS & RULES */}
          {activeTab === "ACTIVE_ALERTS" && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900">
                  <span className="font-bold">Pemantauan Alertmanager Otomatis:</span>{" "}
                  Alert Prometheus dievaluasi secara berkelanjutan. Jika terjadi lonjakan klaster mencurigakan di faskes atau transit dokter mustahil, sistem memicu status FIRING dan menginstruksikan verifikator untuk penahanan klaim pra-bayar.
                </div>
              </div>

              <div className="space-y-3">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {alert.labels.alertname}
                        </span>
                        <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {alert.state}
                        </span>
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                          {alert.labels.severity}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        Aktif: {alert.activeAt}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800">
                      {alert.annotations.summary}
                    </p>
                    <p className="text-xs text-slate-600">
                      {alert.annotations.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px] font-mono">
                      {Object.entries(alert.labels)
                        .filter(([k]) => !["alertname", "severity"].includes(k))
                        .map(([k, v], lIdx) => (
                          <span key={lIdx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {k}: {v}
                          </span>
                        ))}
                      <span className="ml-auto font-bold text-rose-700">
                        Nilai Trigger: {alert.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MCP SPEC & TOOLS */}
          {activeTab === "MCP_SPEC" && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-rose-600" />
                    <span>Daftar Tool MCP Prometheus (Official Specification)</span>
                  </div>
                  <span className="text-[10px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 font-bold">
                    FastMCP Stdio Transport
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                        <th className="py-2 px-3">Nama Tool MCP</th>
                        <th className="py-2 px-3">Parameter Input</th>
                        <th className="py-2 px-3">Deskripsi Operasi Telemetri</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-rose-700">query</td>
                        <td className="py-2.5 px-3 text-slate-500">query: string</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">Eksekusi kueri PromQL instan untuk inspeksi metrik klaim seketika.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-rose-700">range_query</td>
                        <td className="py-2.5 px-3 text-slate-500">query, start, end, step</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">Evaluasi matriks deret waktu time-series untuk visualisasi tren fraud.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-rose-700">list_alerts</td>
                        <td className="py-2.5 px-3 text-slate-500">tanpa argumen</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">Membaca daftar alert aktif (PhantomBillingSurge, ImpossibleTravel).</td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-rose-700">list_rules</td>
                        <td className="py-2.5 px-3 text-slate-500">tanpa argumen</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">Membaca aturan ambang batas SLO dan recording rules.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-rose-700">metric_metadata</td>
                        <td className="py-2.5 px-3 text-slate-500">metric: string (opsional)</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">Mendapatkan dokumentasi help text dan tipe metrik Prometheus.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-rose-700">runtime_info</td>
                        <td className="py-2.5 px-3 text-slate-500">tanpa argumen</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">Informasi versi, revision, dan status runtime Prometheus engine.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-rose-700">tsdb_stats</td>
                        <td className="py-2.5 px-3 text-slate-500">tanpa argumen</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">Statistik kardinalitas time-series dan alokasi chunks database.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-rose-700">healthy / ready</td>
                        <td className="py-2.5 px-3 text-slate-500">tanpa argumen</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">Liveness & readiness probe untuk koordinasi agen orkestrasi.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MCP Configuration Snippet */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-rose-600" />
                    <span>Konfigurasi mcp_config.json Antigravity</span>
                  </div>
                  <button
                    onClick={() => handleCopy(`{\n  "prometheus": {\n    "command": "python3",\n    "args": [\n      "/mnt/c/Users/Asus/Downloads/ClaimTrace/backend/app/engine/prometheus_mcp_server.py"\n    ]\n  }\n}`)}
                    className="flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 font-medium"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>Salin Konfigurasi</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 overflow-x-auto">
{`"prometheus": {
  "command": "python3",
  "args": [
    "/mnt/c/Users/Asus/Downloads/ClaimTrace/backend/app/engine/prometheus_mcp_server.py"
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
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>ClaimTrace Prometheus MCP • Healthkathon BPJS Kesehatan 2026</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition"
          >
            Tutup Panel Telemetri
          </button>
        </div>

      </div>
    </div>
  );
};
