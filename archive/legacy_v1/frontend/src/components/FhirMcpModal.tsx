"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Layers,
  Download,
  Copy,
  Check,
  Terminal,
  Code2,
  ExternalLink,
  ShieldCheck,
  Activity,
  Search,
  FileCode,
  Sparkles,
  Server
} from "lucide-react";

interface FhirMcpModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClaimId?: string;
}

export default function FhirMcpModal({ isOpen, onClose, selectedClaimId = "CLM-2026-8801" }: FhirMcpModalProps) {
  const [activeTab, setActiveTab] = useState<"TOOLS" | "LIVE_INSPECTOR" | "CONFIG">("TOOLS");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [liveData, setLiveData] = useState<any>(null);
  const [selectedResourceType, setSelectedResourceType] = useState<string>("Claim");
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    fetchLiveResource("Claim");
  }, [isOpen, selectedClaimId]);

  const fetchLiveResource = async (type: string) => {
    setIsLoadingLive(true);
    try {
      let endpoint = `http://127.0.0.1:8000/fhir/${type}`;
      if (type === "metadata") {
        endpoint = `http://127.0.0.1:8000/fhir/metadata`;
      } else if (type === "SelectedClaim") {
        endpoint = `http://127.0.0.1:8000/fhir/Claim/claim-${selectedClaimId.toLowerCase().replace(/_/g, "-")}`;
      } else if (type === "SelectedRisk") {
        endpoint = `http://127.0.0.1:8000/fhir/RiskAssessment/risk-${selectedClaimId.toLowerCase().replace(/_/g, "-")}`;
      }
      
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setLiveData(data);
      } else {
        setLiveData({ error: `HTTP ${res.status}: Resource tidak ditemukan.` });
      }
    } catch (err: any) {
      setLiveData({
        error: "Tidak dapat terhubung ke endpoint FHIR backend (127.0.0.1:8000). Pastikan backend FastAPI sedang berjalan.",
        details: err?.message
      });
    } finally {
      setIsLoadingLive(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadMasterBundle = () => {
    window.open("http://127.0.0.1:8000/api/v1/fhir/export-all", "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200/80 bg-[#f8fafc]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/80">
                  WSO2 FHIR MCP Server
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  Kemenkes SATUSEHAT • HL7 FHIR R4 Standard
                </span>
              </div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight mt-0.5">
                Integrasi Server MCP FHIR & Gateway Data Kesehatan Nasional
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMasterBundle}
              className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl font-bold shadow-2xs transition focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Unduh seluruh portofolio klaim dalam format Bundle SATUSEHAT FHIR R4 JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Bundle SATUSEHAT</span>
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
              onClick={() => setActiveTab("TOOLS")}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-t-lg font-semibold border-b-2 transition ${
                activeTab === "TOOLS"
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>7 Tools MCP FHIR Resmi</span>
            </button>
            <button
              onClick={() => setActiveTab("LIVE_INSPECTOR")}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-t-lg font-semibold border-b-2 transition ${
                activeTab === "LIVE_INSPECTOR"
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Inspektur Endpoint FHIR Live</span>
            </button>
            <button
              onClick={() => setActiveTab("CONFIG")}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-t-lg font-semibold border-b-2 transition ${
                activeTab === "CONFIG"
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Konfigurasi Client MCP</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
            Standar: <b className="text-slate-800">HL7 FHIR R4 (4.0.1)</b>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs bg-[#f8fafc] flex-1">
          {activeTab === "TOOLS" && (
            <div className="space-y-3.5">
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-2 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm">
                  Daftar Alat Model Context Protocol (MCP) dari wso2/fhir-mcp-server
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Server MCP ini bertindak sebagai jembatan antara asisten AI agentik (Claude, Antigravity, LLM) dan repositori data klinis FHIR/SATUSEHAT Kemenkes, memungkinkan query, pencarian, dan pembuatan sumber daya secara otomatis dan aman.
                </p>
              </div>

              {/* 7 Tools Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-200/80">
                      get_capabilities
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Metadata Tool</span>
                  </div>
                  <p className="text-slate-700 text-xs">
                    Mengambil CapabilityStatement server untuk mengecek jenis resource yang didukung, parameter pencarian yang sah, dan operasi kustom (misal: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">$everything</code>).
                  </p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-200/80">
                      search
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Query Tool</span>
                  </div>
                  <p className="text-slate-700 text-xs">
                    Mengeksekusi pencarian standar FHIR pada resource (misal: mencari klaim dengan status tertentu, filter tanggal, atau ekspresi filter FHIRPath respons).
                  </p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-200/80">
                      read
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Fetch Tool</span>
                  </div>
                  <p className="text-slate-700 text-xs">
                    Mengambil satu instans resource spesifik berdasar tipe dan ID (misal: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">Claim/claim-clm-2026-8801</code> atau <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">RiskAssessment/risk-clm-2026-8801</code>).
                  </p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-200/80">
                      create
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Persist Tool</span>
                  </div>
                  <p className="text-slate-700 text-xs">
                    Menyimpan resource FHIR baru ke server (misal: menyimpan hasil evaluasi triase risiko atau bukti klarifikasi berkas dari faskes).
                  </p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-200/80">
                      update
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Mutate Tool</span>
                  </div>
                  <p className="text-slate-700 text-xs">
                    Memperbarui data resource yang ada dengan payload baru (misal: merubah status klaim setelah keputusan verifikator manusia).
                  </p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-200/80">
                      get_user
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Auth Profile Tool</span>
                  </div>
                  <p className="text-slate-700 text-xs">
                    Mengambil identitas profil tenaga kesehatan / verifikator yang sedang terotentikasi via SMART-on-FHIR OAuth2.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "LIVE_INSPECTOR" && (
            <div className="space-y-3.5">
              {/* Endpoint Selector Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-500 font-semibold mr-1">Uji Endpoint:</span>
                  {[
                    { label: "CapabilityStatement", type: "metadata" },
                    { label: "Klaim Terpilih", type: "SelectedClaim" },
                    { label: "RiskAssessment DSS", type: "SelectedRisk" },
                    { label: "Seluruh Klaim (Searchset)", type: "Claim" },
                    { label: "Data Pasien (Pseudonim)", type: "Patient" },
                    { label: "Data Praktisi DPJP", type: "Practitioner" }
                  ].map((btn) => (
                    <button
                      key={btn.type}
                      onClick={() => {
                        setSelectedResourceType(btn.type);
                        fetchLiveResource(btn.type);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition ${
                        selectedResourceType === btn.type
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleCopy(JSON.stringify(liveData, null, 2), "live_json")}
                  className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-300 font-medium"
                >
                  {copiedId === "live_json" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === "live_json" ? "Tersalin!" : "Salin JSON"}</span>
                </button>
              </div>

              {/* JSON Payload Viewer */}
              <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] leading-relaxed max-h-[380px] overflow-y-auto border border-slate-800 shadow-inner">
                {isLoadingLive ? (
                  <div className="text-slate-400 py-6 text-center">Memuat respons dari backend FHIR...</div>
                ) : (
                  <pre>{JSON.stringify(liveData, null, 2)}</pre>
                )}
              </div>
            </div>
          )}

          {activeTab === "CONFIG" && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Konfigurasi Integrasi fhir-mcp-server dengan ClaimTrace
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Menjalankan server MCP FHIR terhubung ke API backend lokal ClaimTrace (<code className="font-mono">http://127.0.0.1:8000/fhir</code>).
                </p>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <b className="text-slate-900 text-xs">1. Registrasi pada mcp_config.json (Antigravity / Claude)</b>
                    <button
                      onClick={() =>
                        handleCopy(
                          JSON.stringify(
                            {
                              fhir: {
                                command: "/home/Khalaf-Dev/.local/bin/fhir-mcp-server",
                                args: ["--transport", "stdio"],
                                env: {
                                  FHIR_SERVER_BASE_URL: "http://127.0.0.1:8000/fhir",
                                  FHIR_SERVER_DISABLE_AUTHORIZATION: "True"
                                }
                              }
                            },
                            null,
                            2
                          ),
                          "mcp_config"
                        )
                      }
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      {copiedId === "mcp_config" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      Salin JSON
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[10.5px] overflow-x-auto leading-relaxed">
{`"fhir": {
  "command": "/home/Khalaf-Dev/.local/bin/fhir-mcp-server",
  "args": ["--transport", "stdio"],
  "env": {
    "FHIR_SERVER_BASE_URL": "http://127.0.0.1:8000/fhir",
    "FHIR_SERVER_DISABLE_AUTHORIZATION": "True"
  }
}`}
                  </pre>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <b className="text-slate-900 block text-xs mb-1">2. Dukungan Transport Protokol MCP</b>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
                    <li><b>STDIO:</b> Sangat ideal untuk eksekusi lokal aman tanpa eksposur port jaringan tambahan.</li>
                    <li><b>SSE (Server-Sent Events):</b> Mendukung arsitektur microservices terdistribusi antar-cabang BPJS.</li>
                    <li><b>Streamable HTTP:</b> Mendukung integrasi cloud modern dengan timeout configurable.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Kemenkes SATUSEHAT • Terdaftar di Antigravity Fleet</span>
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
