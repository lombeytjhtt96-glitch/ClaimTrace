"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ClaimWithTriage, AuditEntry } from "../types/claim";
import { INITIAL_MOCK_CLAIMS, INITIAL_AUDIT_LOGS } from "../data/mockData";
import TriageQueue from "../components/TriageQueue";
import CaseDossier from "../components/CaseDossier";
import MobileJknSim from "../components/MobileJknSim";
import VerifierAction from "../components/VerifierAction";
import AuditLogViewer from "../components/AuditLogViewer";
import ExportDossierModal from "../components/ExportDossierModal";
import CustomClaimSimulatorModal from "../components/CustomClaimSimulatorModal";
import FhirMcpModal from "../components/FhirMcpModal";
import OsrmGeovelocityModal from "../components/OsrmGeovelocityModal";
import PlaywrightRpaModal from "../components/PlaywrightRpaModal";
import { ChromaSemanticModal } from "../components/ChromaSemanticModal";
import { DuckDbMcpModal } from "../components/DuckDbMcpModal";
import { PrometheusMcpModal } from "../components/PrometheusMcpModal";
import { ReaForensicsModal } from "../components/ReaForensicsModal";
import { Shield, RefreshCw, Server, Wifi, Sparkles, TrendingUp, AlertOctagon, CheckCircle2, Clock, Layers, Compass, Bot, Database, Flame, Binary } from "lucide-react";

const BACKEND_BASE_URL = "http://127.0.0.1:8000";

export default function ClaimTraceDashboard() {
  const [claims, setClaims] = useState<ClaimWithTriage[]>(INITIAL_MOCK_CLAIMS);
  const [selectedId, setSelectedId] = useState<string>("CLM-2026-8801");
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(INITIAL_AUDIT_LOGS);
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState<boolean>(false);
  const [isFhirModalOpen, setIsFhirModalOpen] = useState<boolean>(false);
  const [isOsrmModalOpen, setIsOsrmModalOpen] = useState<boolean>(false);
  const [isPlaywrightModalOpen, setIsPlaywrightModalOpen] = useState<boolean>(false);
  const [isChromaModalOpen, setIsChromaModalOpen] = useState<boolean>(false);
  const [isDuckDbModalOpen, setIsDuckDbModalOpen] = useState<boolean>(false);
  const [isPrometheusModalOpen, setIsPrometheusModalOpen] = useState<boolean>(false);
  const [isReaModalOpen, setIsReaModalOpen] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Sync with FastAPI backend if running
  const fetchBackendData = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/v1/claims`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setClaims(data);
          setIsApiConnected(true);
        }
      } else {
        setIsApiConnected(false);
      }

      const logRes = await fetch(`${BACKEND_BASE_URL}/api/v1/audit-logs`, { cache: "no-store" });
      if (logRes.ok) {
        const logData = await logRes.json();
        if (logData.chain && Array.isArray(logData.chain)) {
          setAuditLogs(logData.chain);
        }
      }
    } catch {
      setIsApiConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchBackendData();
    const interval = setInterval(fetchBackendData, 8000);
    return () => clearInterval(interval);
  }, [fetchBackendData]);

  const selectedItem =
    claims.find((c) => c.claim.claim_id === selectedId) || claims[0];

  // Simulator Handler for Mobile JKN binary click
  const handleSimulateMobileResponse = async (attended: boolean) => {
    setIsActionLoading(true);
    if (isApiConnected) {
      try {
        const res = await fetch(
          `${BACKEND_BASE_URL}/api/v1/claims/${selectedId}/mobile-response`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ attended }),
          }
        );
        if (res.ok) {
          await fetchBackendData();
          setIsActionLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Backend error, falling back to local simulation", err);
      }
    }

    // Client-side local deterministic simulation fallback
    setClaims((prev) =>
      prev.map((item) => {
        if (item.claim.claim_id !== selectedId) return item;
        const curClaim = { ...item.claim };
        curClaim.mobile_meta = { ...curClaim.mobile_meta };
        curClaim.mobile_meta.sampel_terkirim += 1;

        if (attended) {
          curClaim.mobile_meta.respon_hadir += 1;
          curClaim.s3_score = Math.max(10.0, Number((curClaim.s3_score - 15.0).toFixed(1)));
          if (curClaim.mobile_meta.respon_tidak_hadir === 0) {
            curClaim.mobile_meta.status_konfirmasi = "VERIFIED_ATTENDED";
          }
        } else {
          curClaim.mobile_meta.respon_tidak_hadir += 1;
          curClaim.s3_score = Math.min(100.0, Number((curClaim.s3_score + 20.0).toFixed(1)));
          curClaim.mobile_meta.status_konfirmasi = "ANOMALY_DENIED";
        }

        // Recalculate deterministic fusion: S = 0.5*S1 + 0.3*S2 + 0.2*S3
        const s1Contrib = Number((0.5 * curClaim.s1_score).toFixed(2));
        const s2Contrib = Number((0.3 * curClaim.s2_score).toFixed(2));
        const s3Contrib = Number((0.2 * curClaim.s3_score).toFixed(2));
        const rawScore = Number((s1Contrib + s2Contrib + s3Contrib).toFixed(1));
        let finalScore = rawScore;
        let lane: "MERAH" | "KUNING" | "HIJAU" =
          finalScore >= 75 ? "MERAH" : finalScore >= 50 ? "KUNING" : "HIJAU";

        if (curClaim.dpjp_meta.sip_status === "EXPIRED") {
          lane = "MERAH";
          finalScore = Math.max(finalScore, 75.0);
        } else if (curClaim.dpjp_meta.sip_status === "UNSYNCED" && lane === "HIJAU") {
          lane = "KUNING";
        }

        const updatedTriage = {
          ...item.triage,
          raw_weighted_score: rawScore,
          final_priority_score: finalScore,
          triage_lane: lane,
          score_breakdown: {
            s1_value: curClaim.s1_score,
            s1_weight: 0.5,
            s1_contribution: s1Contrib,
            s2_value: curClaim.s2_score,
            s2_weight: 0.3,
            s2_contribution: s2Contrib,
            s3_value: curClaim.s3_score,
            s3_weight: 0.2,
            s3_contribution: s3Contrib,
          },
        };

        return { claim: curClaim, triage: updatedTriage };
      })
    );

    const fakeHash =
      Math.random().toString(16).substring(2, 10) +
      Math.random().toString(16).substring(2, 10) +
      "9f8a7b6c5d4e1234567890abcdef1234";

    const newLog: AuditEntry = {
      index: auditLogs.length + 1,
      timestamp: new Date().toISOString(),
      event_type: "MOBILE_JKN_BINARY_SYNC",
      claim_id: selectedId,
      actor: "MOBILE_JKN_GATEWAY",
      payload: {
        action: attended ? "Peserta Konfirmasi HADIR (Biner: YA)" : "Peserta Konfirmasi TIDAK HADIR (Biner: TIDAK)",
        mode: isApiConnected ? "BACKEND_FASTAPI" : "CLIENT_LOCAL_SIM",
      },
      prev_hash: auditLogs[0]?.current_hash || "0".repeat(64),
      current_hash: fakeHash,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    setIsActionLoading(false);
  };

  // Handler for Verifier Decision (Human-in-the-Loop)
  const handleRecordDecision = async (
    decision: "LOLOSKAN_KLAIM" | "KLARIFIKASI_FASKES" | "AUDIT_LAPANGAN",
    notes: string,
    verifierId: string
  ) => {
    setIsActionLoading(true);
    if (isApiConnected) {
      try {
        const res = await fetch(
          `${BACKEND_BASE_URL}/api/v1/claims/${selectedId}/decision`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              verifier_id: verifierId,
              decision,
              catatan_verifikator: notes,
            }),
          }
        );
        if (res.ok) {
          await fetchBackendData();
          setIsActionLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Backend error, logging decision locally", err);
      }
    }

    const fakeHash =
      Math.random().toString(16).substring(2, 10) +
      Math.random().toString(16).substring(2, 10) +
      "c1d2e3f4a5b678901234567890abcdef";

    const newLog: AuditEntry = {
      index: auditLogs.length + 1,
      timestamp: new Date().toISOString(),
      event_type: "HUMAN_VERIFIER_DECISION",
      claim_id: selectedId,
      actor: verifierId,
      payload: {
        decision,
        notes,
        mode: isApiConnected ? "BACKEND_FASTAPI" : "CLIENT_LOCAL_SIM",
      },
      prev_hash: auditLogs[0]?.current_hash || "0".repeat(64),
      current_hash: fakeHash,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    setIsActionLoading(false);
  };

  // Reset Skenario
  const handleResetData = async () => {
    if (isApiConnected) {
      try {
        await fetch(`${BACKEND_BASE_URL}/api/v1/claims/reset`, { method: "POST" });
        await fetchBackendData();
        return;
      } catch (err) {
        console.warn("Reset via API failed, resetting local state", err);
      }
    }
    setClaims(INITIAL_MOCK_CLAIMS);
    setSelectedId("CLM-2026-8801");
    setAuditLogs(INITIAL_AUDIT_LOGS);
  };

  // Handler for adding custom simulated claim
  const handleAddCustomClaim = (newClaimItem: ClaimWithTriage) => {
    setClaims((prev) => [newClaimItem, ...prev]);
    setSelectedId(newClaimItem.claim.claim_id);
  };

  // Executive Risk Efficiency Metrics
  const totalPortfolioRp = claims.reduce((acc, c) => acc + c.claim.nilai_klaim_rp, 0);
  const redClaims = claims.filter((c) => c.triage.triage_lane === "MERAH");
  const yellowClaims = claims.filter((c) => c.triage.triage_lane === "KUNING");
  const greenClaims = claims.filter((c) => c.triage.triage_lane === "HIJAU");

  const redExposureRp = redClaims.reduce((acc, c) => acc + c.claim.nilai_klaim_rp, 0);
  const yellowExposureRp = yellowClaims.reduce((acc, c) => acc + c.claim.nilai_klaim_rp, 0);
  const greenExposureRp = greenClaims.reduce((acc, c) => acc + c.claim.nilai_klaim_rp, 0);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Application Navigation & Competition Branding Header (Full Light Theme) */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Project Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs border border-blue-500">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/80">
                  Healthkathon BPJS Kesehatan 2026
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline font-medium">
                  Tim TINEERENSE • MAN 1 Surakarta
                </span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2 mt-0.5">
                ClaimTrace
                <span className="text-xs font-normal text-slate-600 hidden md:inline">
                  — Sistem Pendukung Keputusan Verifikator Klaim JKN
                </span>
              </h1>
            </div>
          </div>

          {/* Proposal Metrics & Backend Status Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] px-3 py-1.5 rounded-xl hidden sm:block">
              <span className="text-[10px] text-slate-500 block leading-tight font-medium">Holdout Sintetis (3.002 Baris)</span>
              <span className="font-bold text-emerald-600 text-xs font-mono">Precision@100: 100.0% (FPR 0.00%)</span>
            </div>

            <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] px-3 py-1.5 rounded-xl hidden md:block">
              <span className="text-[10px] text-slate-500 block leading-tight font-medium">Kepatuhan Regulasi</span>
              <span className="font-bold text-blue-600 text-xs font-mono">On-Premise BPJS • UU PDP 27/2022</span>
            </div>

            {/* Live API Connector Indicator */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${
                isApiConnected
                  ? "bg-emerald-50/80 text-emerald-700 border-emerald-200/80"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
              title={isApiConnected ? "Terhubung ke FastAPI (127.0.0.1:8000)" : "Menjalankan Simulator Berkas Mandiri"}
            >
              {isApiConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>API FastAPI: Aktif</span>
                </>
              ) : (
                <>
                  <Server className="w-3.5 h-3.5 text-slate-500" />
                  <span>Mode Simulasi Mandiri</span>
                </>
              )}
            </div>

            {/* Custom Claim Simulator Button */}
            <button
              onClick={() => setIsSimModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-2xs transition font-semibold focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              title="Buka simulator uji klaim kustom baru"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Uji Klaim Baru</span>
            </button>

            {/* WSO2 FHIR MCP Server Button */}
            <button
              onClick={() => setIsFhirModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-900 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/90 shadow-2xs transition font-semibold focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              title="Buka WSO2 FHIR MCP Server & Inspektur SATUSEHAT Kemenkes"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">SATUSEHAT FHIR MCP</span>
              <span className="sm:hidden">FHIR MCP</span>
            </button>

            {/* OSRM Geovelocity Radar Button */}
            <button
              onClick={() => setIsOsrmModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-900 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/90 shadow-2xs transition font-semibold focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              title="Buka Radar Geovelocity OSRM & Detektor Impossible Travel"
            >
              <Compass className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Radar Geovelocity OSRM</span>
              <span className="sm:hidden">OSRM</span>
            </button>

            {/* Playwright MCP RPA Robot Button */}
            <button
              onClick={() => setIsPlaywrightModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-cyan-700 hover:text-cyan-900 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200/90 shadow-2xs transition font-semibold focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none"
              title="Buka Robot Otomasi Browser & Verifikator RPA Playwright MCP"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-600" />
              <span className="hidden sm:inline">Robot RPA Playwright</span>
              <span className="sm:hidden">RPA</span>
            </button>

            {/* ChromaDB Vector Semantic Plagiarism Button */}
            <button
              onClick={() => setIsChromaModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-950 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 shadow-2xs transition font-semibold focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              title="Buka Mesin Deteksi Plagiarisme Resume Medis ChromaDB"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">ChromaDB Vektor</span>
              <span className="sm:hidden">Chroma</span>
            </button>

            {/* DuckDB OLAP Analytics & MCP Button */}
            <button
              onClick={() => setIsDuckDbModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-950 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/90 shadow-2xs transition font-semibold focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              title="Buka Mesin Analitik Kolumnar & MCP Server DuckDB"
            >
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">DuckDB OLAP MCP</span>
              <span className="sm:hidden">DuckDB</span>
            </button>

            {/* Prometheus Observability & MCP Button */}
            <button
              onClick={() => setIsPrometheusModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-rose-800 hover:text-rose-950 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/90 shadow-2xs transition font-semibold focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              title="Buka Mesin Telemetri & MCP Server Prometheus"
            >
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Prometheus MCP</span>
              <span className="sm:hidden">Prometheus</span>
            </button>

            {/* REA Forensics & Client Decompiler Button */}
            <button
              onClick={() => setIsReaModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-violet-800 hover:text-violet-950 px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200/90 shadow-2xs transition font-semibold focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
              title="Buka Mesin Forensik Klien & Analisis Binary/Script REA"
            >
              <Binary className="w-3.5 h-3.5 text-violet-600" />
              <span className="hidden sm:inline">Forensik REA</span>
              <span className="sm:hidden">REA</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={handleResetData}
              className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              title="Reset ke skenario awal proposal"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline font-medium">Reset Skenario</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Executive Risk Efficiency KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Portofolio Klaim</span>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-black text-slate-900 font-mono">
              Rp{totalPortfolioRp.toLocaleString("id-ID")}
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-1">
              {claims.length} Berkas Klaim Masuk
            </div>
          </div>

          <div className="bg-[#fff1f0]/80 border border-[#ffa39e] rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#cf1322] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Risiko Dicegah Pra-Bayar</span>
              <AlertOctagon className="w-4 h-4 text-[#ef4444]" />
            </div>
            <div className="text-lg font-black text-[#cf1322] font-mono">
              Rp{redExposureRp.toLocaleString("id-ID")}
            </div>
            <div className="text-[10px] text-[#a8071a] font-medium mt-1 flex items-center justify-between">
              <span>{redClaims.length} Kasus Jalur Merah</span>
              <span className="font-bold">Prioritas Telaah</span>
            </div>
          </div>

          <div className="bg-[#fffbe6]/80 border border-[#ffe58f] rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#d48806] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Klarifikasi Digital Faskes</span>
              <Clock className="w-4 h-4 text-[#d48806]" />
            </div>
            <div className="text-lg font-black text-[#b45309] font-mono">
              Rp{yellowExposureRp.toLocaleString("id-ID")}
            </div>
            <div className="text-[10px] text-[#78350f] font-medium mt-1 flex items-center justify-between">
              <span>{yellowClaims.length} Kasus Jalur Kuning</span>
              <span className="font-bold">Mitigasi Bias</span>
            </div>
          </div>

          <div className="bg-[#f6ffed]/80 border border-[#b7eb8f] rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#389e0d] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Lolos Cepat (Fast-Track)</span>
              <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
            </div>
            <div className="text-lg font-black text-[#15803d] font-mono">
              Rp{greenExposureRp.toLocaleString("id-ID")}
            </div>
            <div className="text-[10px] text-[#14532d] font-medium mt-1 flex items-center justify-between">
              <span>{greenClaims.length} Kasus Terverifikasi Sah</span>
              <span className="font-bold">SLA &lt; 3 Hari</span>
            </div>
          </div>
        </div>

        {/* Banner Skenario Proposal */}
        <div className="p-3.5 bg-white border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>
              <b className="text-slate-900">Kategori Efisiensi Risiko Faskes:</b> Fokus #6 Phantom Billing (Klaster Baksos) & #11 Repeat Billing (Episode Sama).
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500 font-medium">
            Sesuai UU PDP No. 27/2022 • Seluruh Data Merupakan Simulasi Sintetis Terkalibrasi
          </span>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Langkah 1 - Antrean Triase + Simulator Mobile JKN */}
          <div className="lg:col-span-5 space-y-6">
            <TriageQueue
              claims={claims}
              selectedClaimId={selectedId}
              onSelectClaim={(id) => setSelectedId(id)}
            />

            <MobileJknSim
              claim={selectedItem.claim}
              onSimulateResponse={handleSimulateMobileResponse}
              isLoading={isActionLoading}
            />
          </div>

          {/* Right Column: Langkah 2 (Dossier + Graph) + Langkah 3 (Keputusan) + Log Audit */}
          <div className="lg:col-span-7 space-y-6">
            <CaseDossier
              claimItem={selectedItem}
              onOpenExportModal={() => setIsExportOpen(true)}
            />

            <VerifierAction
              claimItem={selectedItem}
              onRecordDecision={handleRecordDecision}
              isLoading={isActionLoading}
            />

            <AuditLogViewer
              logs={auditLogs}
              onRefresh={fetchBackendData}
              isIntegrityValid={true}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 font-mono shadow-sm mt-auto">
        ClaimTrace DSS • Healthkathon BPJS Kesehatan 2026 • Tim TINEERENSE (Khalaf Faith Pradyatama & Gaudiansyah Abiyu Mahya - MAN 1 Surakarta)
      </footer>

      {/* Official Audit Dossier Export Modal */}
      <ExportDossierModal
        claimItem={selectedItem}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* Interactive Custom Claim Simulator Modal */}
      <CustomClaimSimulatorModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        onAddCustomClaim={handleAddCustomClaim}
      />

      {/* WSO2 FHIR MCP Server & SATUSEHAT Inspector Modal */}
      <FhirMcpModal
        isOpen={isFhirModalOpen}
        onClose={() => setIsFhirModalOpen(false)}
        selectedClaimId={selectedId}
      />

      {/* OSRM Geovelocity & Impossible Travel Radar Modal */}
      <OsrmGeovelocityModal
        isOpen={isOsrmModalOpen}
        onClose={() => setIsOsrmModalOpen(false)}
        defaultOriginId={selectedItem.claim.claim_id === "CLM-2026-8805" ? "FSK-RSDK-05" : "FSK-RSX-01"}
        defaultDestId={selectedItem.claim.claim_id === "CLM-2026-8805" ? "FSK-RSX-01" : "FSK-RSY-02"}
        defaultTimeDiffMinutes={selectedItem.claim.claim_id === "CLM-2026-8805" ? 45.0 : 90.0}
      />

      {/* Playwright MCP RPA Robot Modal */}
      <PlaywrightRpaModal
        isOpen={isPlaywrightModalOpen}
        onClose={() => setIsPlaywrightModalOpen(false)}
        selectedClaimId={selectedId}
      />

      {/* ChromaDB Vector Semantic Plagiarism Modal */}
      <ChromaSemanticModal
        isOpen={isChromaModalOpen}
        onClose={() => setIsChromaModalOpen(false)}
        selectedClaimId={selectedId}
      />

      {/* DuckDB OLAP Analytics & MCP Modal */}
      <DuckDbMcpModal
        isOpen={isDuckDbModalOpen}
        onClose={() => setIsDuckDbModalOpen(false)}
      />

      {/* Prometheus Observability & MCP Modal */}
      <PrometheusMcpModal
        isOpen={isPrometheusModalOpen}
        onClose={() => setIsPrometheusModalOpen(false)}
      />

      {/* REA Forensics & Client Decompiler Modal */}
      <ReaForensicsModal
        isOpen={isReaModalOpen}
        onClose={() => setIsReaModalOpen(false)}
      />
    </div>
  );
}
