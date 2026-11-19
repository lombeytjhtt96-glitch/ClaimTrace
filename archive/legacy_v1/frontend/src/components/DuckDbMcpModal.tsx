"use client";
import React, { useState, useEffect } from "react";
import {
  Database,
  Terminal,
  Play,
  Copy,
  Check,
  X,
  Layers,
  Sparkles,
  Shield,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Search,
  Download,
  Code2
} from "lucide-react";

interface DuckDbMcpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TableInfo {
  name: string;
  type: string;
}

interface PublishedTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

const INITIAL_TABLES: TableInfo[] = [
  { name: "claims_warehouse", type: "BASE TABLE" },
  { name: "bpjs_fkrtl_2024", type: "VIEW" },
  { name: "v_bpjs_repeat_claims_same_day", type: "VIEW" },
  { name: "v_bpjs_top_cbg_analysis", type: "VIEW" },
  { name: "v_financial_exposure", type: "VIEW" },
  { name: "v_phantom_billing_risk", type: "VIEW" },
  { name: "v_repeat_billing_risk", type: "VIEW" },
];

const INITIAL_COLUMNS = [
  { column_name: "claim_id", column_type: "VARCHAR", null: "NO" },
  { column_name: "faskes_id", column_type: "VARCHAR", null: "YES" },
  { column_name: "nilai_klaim_rp", column_type: "BIGINT", null: "YES" },
  { column_name: "triage_lane", column_type: "VARCHAR", null: "YES" },
  { column_name: "rasio_lonjakan_baseline", column_type: "DOUBLE", null: "YES" },
];

export const DuckDbMcpModal: React.FC<DuckDbMcpModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"SQL_CONSOLE" | "PUBLISHED_TOOLS" | "SCHEMA" | "MCP_CONFIG">("SQL_CONSOLE");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // SQL Console State
  const [sqlQuery, setSqlQuery] = useState<string>(
    "SELECT cluster_id, faskes_id, nama_faskes, jumlah_klaim_klaster, rasio_lonjakan_baseline, nilai_klaim_rp, triage_lane \nFROM claims_warehouse \nORDER BY rasio_lonjakan_baseline DESC;"
  );
  const [queryFormat, setQueryFormat] = useState<"json" | "markdown" | "csv">("json");
  const [queryResult, setQueryResult] = useState<any | null>(null);

  // Published Tools State
  const [toolsList, setToolsList] = useState<PublishedTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>("detect_phantom_billing");
  const [surgeThreshold, setSurgeThreshold] = useState<number>(3.0);
  const [maxGapDays, setMaxGapDays] = useState<number>(30);
  const [toolResult, setToolResult] = useState<any | null>(null);
  const [toolLoading, setToolLoading] = useState(false);

  // Schema State
  const [tables, setTables] = useState<TableInfo[]>(INITIAL_TABLES);
  const [selectedTable, setSelectedTable] = useState<string>("claims_warehouse");
  const [tableColumns, setTableColumns] = useState<any[]>(INITIAL_COLUMNS);

  // Fetch initial metadata
  useEffect(() => {
    if (!isOpen) return;

    const fetchMetadata = async () => {
      try {
        const [tablesRes, toolsRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/v1/duckdb/tables"),
          fetch("http://127.0.0.1:8000/api/v1/duckdb/published-tools")
        ]);

        if (tablesRes.ok) {
          const tData = await tablesRes.json();
          setTables(tData.tables || []);
        }

        if (toolsRes.ok) {
          const tlData = await toolsRes.json();
          setToolsList(tlData.tools || []);
        }
      } catch (err) {
        console.error("Gagal memuat metadata DuckDB:", err);
      }
    };

    fetchMetadata();
    handleRunQuery();
  }, [isOpen]);

  const fetchTableDesc = async (tableName: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/duckdb/describe/${tableName}`);
      if (res.ok) {
        const data = await res.json();
        if (data.columns && data.columns.length > 0) {
          setTableColumns(data.columns);
        }
      }
    } catch (err) {
      console.error("Gagal mendeskripsikan tabel:", err);
    }
  };

  // Fetch columns when table changes
  useEffect(() => {
    if (!isOpen || !selectedTable) return;
    fetchTableDesc(selectedTable);
  }, [isOpen, selectedTable]);

  const handleRunQuery = async (customSql?: string) => {
    const queryToRun = customSql || sqlQuery;
    if (!queryToRun.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/duckdb/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: queryToRun, format: queryFormat })
      });
      if (res.ok) {
        const data = await res.json();
        setQueryResult(data);
      }
    } catch (err) {
      console.error("Gagal menjalankan kueri SQL DuckDB:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTool = async () => {
    setToolLoading(true);
    try {
      let url = "";
      let body: any = null;

      if (selectedTool === "detect_phantom_billing") {
        url = "http://127.0.0.1:8000/api/v1/duckdb/tools/detect-phantom-billing";
        body = { surge_threshold: surgeThreshold };
      } else if (selectedTool === "detect_repeat_billing") {
        url = "http://127.0.0.1:8000/api/v1/duckdb/tools/detect-repeat-billing";
        body = { max_gap_days: maxGapDays };
      } else if (selectedTool === "detect_bpjs_sample_anomalies") {
        url = "http://127.0.0.1:8000/api/v1/duckdb/tools/detect-bpjs-sample-anomalies?limit=20";
        body = null;
      } else {
        url = "http://127.0.0.1:8000/api/v1/duckdb/tools/financial-risk-summary";
      }

      const res = await fetch(url, {
        method: body ? "POST" : "GET",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined
      });

      if (res.ok) {
        const data = await res.json();
        setToolResult(data);
      }
    } catch (err) {
      console.error("Gagal menjalankan published tool:", err);
    } finally {
      setToolLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setPresetSql = (sql: string) => {
    setSqlQuery(sql);
    handleRunQuery(sql);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">
                  DuckDB OLAP Analytics & MCP Server
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  DuckDB v1.5.6
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                  teaguesterling/duckdb_mcp Spec
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mesin Kueri Kolumnar Berkecepatan Tinggi untuk Audit Agregasi Modus #6 Phantom Billing & #11 Repeat Billing
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
            onClick={() => setActiveTab("SQL_CONSOLE")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "SQL_CONSOLE"
                ? "border-amber-600 text-amber-700 bg-amber-50/40"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Konsol SQL Interaktif
          </button>
          <button
            onClick={() => setActiveTab("PUBLISHED_TOOLS")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "PUBLISHED_TOOLS"
                ? "border-amber-600 text-amber-700 bg-amber-50/40"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Tools Terpublikasi (mcp_publish_tool)
          </button>
          <button
            onClick={() => setActiveTab("SCHEMA")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "SCHEMA"
                ? "border-amber-600 text-amber-700 bg-amber-50/40"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Skema Tabel & Views
          </button>
          <button
            onClick={() => setActiveTab("MCP_CONFIG")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "MCP_CONFIG"
                ? "border-amber-600 text-amber-700 bg-amber-50/40"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Konfigurasi DuckDB MCP
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {activeTab === "SQL_CONSOLE" && (
            <div className="space-y-4">
              {/* Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Preset Audit:
                </span>
                <button
                  onClick={() =>
                    setPresetSql(
                      "SELECT cluster_id, faskes_id, nama_faskes, jumlah_klaim_klaster, rasio_lonjakan_baseline, nilai_klaim_rp, triage_lane \nFROM claims_warehouse \nWHERE rasio_lonjakan_baseline >= 3.0 \nORDER BY rasio_lonjakan_baseline DESC;"
                    )
                  }
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs transition"
                >
                  ⚡ Scan Lonjakan Klaster (#6)
                </button>
                <button
                  onClick={() =>
                    setPresetSql(
                      "SELECT claim_id, faskes_id, nama_faskes, peserta_token_aes, ina_cbg_code, nilai_klaim_rp, triage_lane \nFROM claims_warehouse \nWHERE indikasi_repeat_billing = TRUE;"
                    )
                  }
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs transition"
                >
                  🔁 Deteksi Klaim Ganda (#11)
                </button>
                <button
                  onClick={() =>
                    setPresetSql(
                      "SELECT triage_lane, volume_klaim, total_rupiah, rata_skor_prioritas, persentase_anggaran \nFROM v_financial_exposure;"
                    )
                  }
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs transition"
                >
                  💰 Rekap Finansial per Jalur
                </button>
                <button
                  onClick={() =>
                    setPresetSql(
                      "SELECT nama_dpjp_alias, sip_status, COUNT(*) as total_klaim, SUM(nilai_klaim_rp) as total_rupiah \nFROM claims_warehouse \nGROUP BY nama_dpjp_alias, sip_status \nORDER BY total_rupiah DESC;"
                    )
                  }
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs transition"
                >
                  👨‍⚕️ Beban DPJP & Status SIP
                </button>
                <button
                  onClick={() =>
                    setPresetSql(
                      "SELECT FKL19 as kode_cbg, FKL19A as deskripsi_cbg, count(*) as volume_klaim, sum(FKL47) as total_biaya_tagih, sum(FKL48) as total_biaya_verifikasi \nFROM bpjs_fkrtl_2024 \nGROUP BY 1, 2 \nORDER BY volume_klaim DESC \nLIMIT 8;"
                    )
                  }
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold text-blue-800 shadow-2xs transition"
                >
                  📊 10K Sampel BPJS: Top CBG
                </button>
                <button
                  onClick={() =>
                    setPresetSql(
                      "SELECT peserta_id, tgl_masuk, claim_1, claim_2, cbg_1, cbg_2, dx_1, dx_2, biaya_tagih_1, biaya_tagih_2 \nFROM v_bpjs_repeat_claims_same_day \nLIMIT 10;"
                    )
                  }
                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold text-red-800 shadow-2xs transition"
                >
                  🔍 Repeat Hari Sama (Data Sampel)
                </button>
              </div>

              {/* SQL Textarea */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-amber-600" />
                    Pernyataan SQL SELECT (Read-Only Safe):
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Format Keluaran:</span>
                    <select
                      value={queryFormat}
                      onChange={(e) => setQueryFormat(e.target.value as any)}
                      className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="json">JSON Table</option>
                      <option value="markdown">Markdown</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>
                </div>

                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={4}
                  className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-900 text-emerald-400 leading-relaxed"
                  placeholder="Ketik kueri SQL di sini..."
                />

                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-slate-500">
                    Engine: <strong>DuckDB 1.5.6 (Columnar Vectorized Execution)</strong>
                  </span>
                  <button
                    onClick={() => handleRunQuery()}
                    disabled={loading || !sqlQuery.trim()}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    {loading ? "Mengeksekusi..." : "Jalankan Kueri SQL"}
                  </button>
                </div>
              </div>

              {/* Query Results */}
              {queryResult && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Hasil Eksekusi:
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {queryResult.row_count} Baris Ditemukan
                      </span>
                    </div>
                    {queryResult.data && (
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(queryResult.data, null, 2))}
                        className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Tersalin" : "Salin Hasil"}
                      </button>
                    )}
                  </div>

                  {queryResult.error ? (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-mono">
                      {queryResult.error}
                    </div>
                  ) : queryFormat === "markdown" ? (
                    <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono overflow-x-auto text-slate-800">
                      {queryResult.data}
                    </pre>
                  ) : queryFormat === "csv" ? (
                    <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono overflow-x-auto text-slate-800">
                      {queryResult.data}
                    </pre>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr>
                            {queryResult.columns?.map((col: string, idx: number) => (
                              <th
                                key={idx}
                                className="p-2.5 text-left bg-slate-100 border border-slate-200 font-bold text-slate-700"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.data?.map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-50">
                              {queryResult.columns?.map((col: string, cIdx: number) => {
                                const val = row[col];
                                const isMoney = col.includes("nilai") || col.includes("rupiah");
                                const isLane = col === "triage_lane";
                                return (
                                  <td
                                    key={cIdx}
                                    className={`p-2.5 border border-slate-200 font-mono text-slate-800 ${
                                      isLane && val === "MERAH"
                                        ? "bg-red-50 text-red-700 font-bold"
                                        : isLane && val === "KUNING"
                                        ? "bg-amber-50 text-amber-700 font-bold"
                                        : isLane && val === "HIJAU"
                                        ? "bg-emerald-50 text-emerald-700 font-bold"
                                        : ""
                                    }`}
                                  >
                                    {isMoney && typeof val === "number"
                                      ? `Rp ${val.toLocaleString("id-ID")}`
                                      : String(val)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "PUBLISHED_TOOLS" && (
            <div className="space-y-6">
              {/* Tool Selection */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Pilih Tool Analitik Terpublikasi (mcp_publish_tool):
                </label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setSelectedTool("detect_phantom_billing")}
                    className={`p-3 rounded-xl border text-left transition ${
                      selectedTool === "detect_phantom_billing"
                        ? "bg-amber-50 border-amber-500 shadow-2xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 block font-mono">
                      detect_phantom_billing
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Memindai klaster lonjakan klaim massal faskes tanpa izin baksos resmi (#6).
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedTool("detect_repeat_billing")}
                    className={`p-3 rounded-xl border text-left transition ${
                      selectedTool === "detect_repeat_billing"
                        ? "bg-amber-50 border-amber-500 shadow-2xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 block font-mono">
                      detect_repeat_billing
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Mendeteksi klaim berulang pada episode yang sama yang telah ditagihkan (#11).
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedTool("detect_bpjs_sample_anomalies")}
                    className={`p-3 rounded-xl border text-left transition ${
                      selectedTool === "detect_bpjs_sample_anomalies"
                        ? "bg-blue-50 border-blue-500 shadow-2xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 block font-mono">
                      bpjs_sample_anomalies
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Deteksi pasangan klaim ganda hari sama dari 10.000 data sampel resmi BPJS 2024.
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedTool("financial_risk_summary")}
                    className={`p-3 rounded-xl border text-left transition ${
                      selectedTool === "financial_risk_summary"
                        ? "bg-amber-50 border-amber-500 shadow-2xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 block font-mono">
                      financial_risk_summary
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Agregasi total anggaran dan penghematan dana JKN berdasarkan jalur triase.
                    </span>
                  </button>
                </div>

                {/* Parameters */}
                <div className="border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-4">
                  {selectedTool === "detect_phantom_billing" && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-700">
                        Batas Rasio Lonjakan (Surge Threshold):
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        min="1.0"
                        max="10.0"
                        value={surgeThreshold}
                        onChange={(e) => setSurgeThreshold(parseFloat(e.target.value) || 3.0)}
                        className="w-20 text-xs font-mono border border-slate-300 rounded px-2 py-1 text-slate-800"
                      />
                      <span className="text-xs text-slate-500 font-mono">x baseline faskes</span>
                    </div>
                  )}

                  {selectedTool === "detect_repeat_billing" && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-700">
                        Rentang Hari Maksimum (Max Gap Days):
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={maxGapDays}
                        onChange={(e) => setMaxGapDays(parseInt(e.target.value) || 30)}
                        className="w-20 text-xs font-mono border border-slate-300 rounded px-2 py-1 text-slate-800"
                      />
                      <span className="text-xs text-slate-500 font-mono">hari</span>
                    </div>
                  )}

                  {selectedTool === "detect_bpjs_sample_anomalies" && (
                    <span className="text-xs text-blue-700 font-medium">
                      Memindai seluruh 10.000 klaim resmi BPJS Kesehatan (Data Sampel Edisi 2025/2024) untuk menemukan klaim ganda/split unbundling pada hari yang sama.
                    </span>
                  )}

                  {selectedTool === "financial_risk_summary" && (
                    <span className="text-xs text-slate-500">
                      Parameter otomatis dihitung dari seluruh portofolio klaim aktif.
                    </span>
                  )}

                  <button
                    onClick={handleExecuteTool}
                    disabled={toolLoading}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition"
                  >
                    {toolLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {toolLoading ? "Mengeksekusi..." : "Jalankan Published Tool"}
                  </button>
                </div>
              </div>

              {/* Tool Execution Result */}
              {toolResult && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                      Keluaran Tool: {toolResult.tool_name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                      Status: SUCCESS
                    </span>
                  </div>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                    {JSON.stringify(toolResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === "SCHEMA" && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pilih Tabel / View:
                </span>
                <div className="flex gap-2">
                  {tables.map((t, idx) => (
                    <button
                      key={idx}
                      data-testid={`duckdb-table-${t.name}`}
                      onClick={() => {
                        setSelectedTable(t.name);
                        fetchTableDesc(t.name);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        selectedTable === t.name
                          ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {t.name} ({t.type})
                    </button>
                  ))}
                </div>
              </div>

              {tableColumns.length > 0 && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Struktur Kolom Tabel: <strong className="font-mono text-amber-700">{selectedTable}</strong>
                  </h4>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2.5 text-left bg-slate-100 border border-slate-200 font-bold text-slate-700">
                          Nama Kolom
                        </th>
                        <th className="p-2.5 text-left bg-slate-100 border border-slate-200 font-bold text-slate-700">
                          Tipe Data
                        </th>
                        <th className="p-2.5 text-center bg-slate-100 border border-slate-200 font-bold text-slate-700">
                          Nullable
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableColumns.map((col, cIdx) => (
                        <tr key={cIdx} className="hover:bg-slate-50">
                          <td className="p-2.5 border border-slate-200 font-mono font-semibold text-slate-900">
                            {col.column_name}
                          </td>
                          <td className="p-2.5 border border-slate-200 font-mono text-slate-600">
                            {col.column_type}
                          </td>
                          <td className="p-2.5 border border-slate-200 text-center font-mono text-slate-500">
                            {col.null === "YES" ? "YES" : "NO"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "MCP_CONFIG" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-600" />
                  Integrasi DuckDB MCP Server (teaguesterling/duckdb_mcp Spec)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ekstensi <strong>DuckDB MCP</strong> memungkinkan asisten kecerdasan artifisial (Claude, Antigravity, Verifikator Vedika)
                  untuk terhubung langsung ke basis data klaim kolumnar DuckDB via protokol Model Context Protocol (MCP stdio).
                </p>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-900 text-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-amber-400">
                      ~/.gemini/config/mcp_config.json
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(
                            {
                              mcpServers: {
                                duckdb: {
                                  command: "python3",
                                  args: [
                                    "/mnt/c/Users/Asus/Downloads/ClaimTrace/backend/app/engine/duckdb_mcp_server.py"
                                  ]
                                }
                              }
                            },
                            null,
                            2
                          )
                        )
                      }
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Tersalin" : "Salin JSON"}
                    </button>
                  </div>
                  <pre className="text-xs font-mono leading-relaxed overflow-x-auto text-emerald-400">
{`"duckdb": {
  "command": "python3",
  "args": [
    "/mnt/c/Users/Asus/Downloads/ClaimTrace/backend/app/engine/duckdb_mcp_server.py"
  ]
}`}
                  </pre>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    Katalog Perkakas (Tools) MCP Aktif:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono">
                      <strong>query(sql, format)</strong>: SELECT read-only safe execution.
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono">
                      <strong>describe(table_name)</strong>: Introspeksi skema kolom tabel.
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono">
                      <strong>list_tables()</strong>: Daftar tabel dan view analitik.
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono">
                      <strong>detect_phantom_billing()</strong>: Filter klaster lonjakan tak wajar.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>DuckDB OLAP Engine • BPJS Kesehatan Healthkathon 2026 • Tim TINEERENSE</span>
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
