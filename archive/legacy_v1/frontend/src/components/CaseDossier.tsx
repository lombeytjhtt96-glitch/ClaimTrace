"use client";
import React, { useState } from "react";
import { ClaimWithTriage } from "../types/claim";
import EpisodeFingerprintGraph from "./EpisodeFingerprintGraph";
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  DollarSign,
  UserCheck,
  Activity,
  Layers,
  Sparkles,
  Zap,
  Printer,
  Copy,
  Check,
  Network,
  Stethoscope,
  Database,
  Workflow
} from "lucide-react";

interface CaseDossierProps {
  claimItem: ClaimWithTriage;
  onOpenExportModal?: () => void;
}

export default function CaseDossier({ claimItem, onOpenExportModal }: CaseDossierProps) {
  const { claim, triage } = claimItem;
  const [activeTab, setActiveTab] = useState<"DOSSIER" | "GRAPH" | "BPJS_DATA">("DOSSIER");
  const [copiedHash, setCopiedHash] = useState(false);

  const lane = triage.triage_lane;
  const laneConfig = {
    MERAH: {
      title: "Jalur Merah • Prioritas Telaah Pra-Bayar",
      bgBadge: "bg-[#fff1f0] text-[#cf1322] border-[#ffa39e]",
      accent: "text-[#cf1322]",
      border: "border-[#ffa39e]/70 shadow-[0_2px_12px_rgba(239,68,68,0.05)]",
      topIndicator: "bg-[#ef4444]",
      cbgBadge: "bg-[#fff1f0] text-[#cf1322] border-[#ffa39e]",
    },
    KUNING: {
      title: "Jalur Kuning • Klarifikasi Ketidakpastian Administratif",
      bgBadge: "bg-[#fffbe6] text-[#d48806] border-[#ffe58f]",
      accent: "text-[#d48806]",
      border: "border-[#ffe58f]/80 shadow-[0_2px_12px_rgba(245,158,11,0.05)]",
      topIndicator: "bg-[#f59e0b]",
      cbgBadge: "bg-[#fffbe6] text-[#d48806] border-[#ffe58f]",
    },
    HIJAU: {
      title: "Jalur Hijau • Alur Cepat Terverifikasi (Fast-Track)",
      bgBadge: "bg-[#f6ffed] text-[#389e0d] border-[#b7eb8f]",
      accent: "text-[#389e0d]",
      border: "border-[#b7eb8f]/80 shadow-[0_2px_12px_rgba(16,185,129,0.05)]",
      topIndicator: "bg-[#10b981]",
      cbgBadge: "bg-[#f6ffed] text-[#389e0d] border-[#b7eb8f]",
    },
  }[lane];

  const handleCopyHash = () => {
    navigator.clipboard.writeText(triage.audit_hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className={`flex flex-col bg-white border ${laneConfig.border} rounded-xl p-6 relative overflow-hidden transition-all duration-200`}>
      {/* Functional Top Status Bar Indicator */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${laneConfig.topIndicator}`} />

      {/* Dossier Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200/80 relative mt-1">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200/90 font-bold">
              {claim.claim_id}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200/80 font-medium">
              {claim.nama_faskes} (Kelas {claim.kelas_rs})
            </span>
            <span className="text-xs text-slate-600 flex items-center gap-1.5 font-mono bg-[#f8fafc] px-2.5 py-0.5 rounded-full border border-slate-200/80 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {claim.tanggal_layanan}
            </span>
          </div>

          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5 pt-1">
            <span className={`font-mono text-xs px-2.5 py-1 rounded-full border font-bold ${laneConfig.cbgBadge}`}>
              {claim.ina_cbg_code}
            </span>
            {claim.deskripsi_cbg}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
            <span>
              ICD-10: <b className="text-slate-900 font-mono">{claim.icd10_primary}</b>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              ICD-9-CM: <b className="text-slate-900 font-mono">{claim.icd9cm_procedure}</b>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Nilai Tagihan: <b className="text-[#059669] font-mono font-bold">Rp{claim.nilai_klaim_rp.toLocaleString("id-ID")}</b>
            </span>
          </div>
        </div>

        {/* Priority Score Display */}
        <div className="text-right flex flex-col items-end">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Skor Prioritas Telaah
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-4xl font-black text-slate-900 tracking-tight font-mono">
              {triage.final_priority_score}
            </span>
            <span className="text-slate-400 text-xs font-mono font-bold">/ 100</span>
          </div>
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border mt-1.5 inline-flex items-center gap-1.5 ${laneConfig.bgBadge}`}>
            {laneConfig.title}
          </span>
        </div>
      </div>

      {/* Hard Trigger Warning Alert Banner */}
      {triage.hard_trigger_activated && (
        <div className="mt-4 p-3.5 bg-[#fff1f0] border border-[#ffa39e] rounded-xl flex items-start gap-3 text-xs text-[#cf1322]">
          <Zap className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wide text-[#cf1322] block">
              Aturan Prioritas Independen Teraktivasi (Hard Trigger Lapis 2)
            </span>
            <p className="text-[#a8071a] mt-0.5 leading-relaxed font-medium">
              {triage.hard_trigger_reason || "Izin Praktik (SIP) DPJP berakhir pada tanggal layanan. Kasus dialihkan otomatis ke Jalur Merah tanpa bergantung skor multivariat."}
            </p>
          </div>
        </div>
      )}

      {/* 3-Layer Evidence Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-4">
        {/* Lapis 1: Radar Pola Episode (50%) */}
        <div className="bg-[#f0f5ff]/70 p-4 rounded-xl border border-[#d6e4ff] hover:border-[#adc6ff] transition">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#d6e4ff] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1d39c4] flex items-center gap-1.5 min-w-0">
              <Activity className="w-3.5 h-3.5 text-[#2f54eb] shrink-0" />
              <span className="truncate">Lapis 1 • Radar Pola (50%)</span>
            </span>
            <span className="text-xs font-mono font-bold text-[#1d39c4] bg-white px-2.5 py-0.5 rounded-full border border-[#adc6ff] shadow-2xs shrink-0 whitespace-nowrap">
              S1 = {claim.s1_score}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-600 shrink-0">ID Klaster:</span>
              <span className="font-mono text-[#1d39c4] font-bold truncate">{claim.episode_meta.cluster_id}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-600 shrink-0">Total Klaim Klaster:</span>
              <span className="font-bold text-slate-900 whitespace-nowrap">{claim.episode_meta.jumlah_klaim_klaster} Klaim</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-600 shrink-0">Rasio Lonjakan:</span>
              <span className={`font-bold font-mono whitespace-nowrap ${claim.episode_meta.rasio_lonjakan_baseline >= 3.0 ? "text-[#cf1322]" : "text-[#389e0d]"}`}>
                {claim.episode_meta.rasio_lonjakan_baseline}x Baseline
              </span>
            </div>
            {claim.episode_meta.indikasi_repeat_billing && (
              <div className="p-2 bg-[#fff1f0] border border-[#ffa39e] rounded-xl text-[11px] text-[#cf1322] font-medium">
                <b>Modus #11:</b> Terduplikasi dengan {claim.episode_meta.klaim_episode_sebelumnya_id}
              </div>
            )}
            {claim.episode_meta.terdaftar_baksos_resmi && (
              <div className="p-2 bg-[#f6ffed] border border-[#b7eb8f] rounded-xl text-[11px] text-[#389e0d] flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#389e0d] shrink-0" />
                <span>Terdaftar Baksos Resmi</span>
              </div>
            )}
          </div>
        </div>

        {/* Lapis 2: Uji Jejak Layanan DPJP SDMK (30%) */}
        <div className="bg-[#fffbe6]/70 p-4 rounded-xl border border-[#ffe58f] hover:border-[#ffd666] transition">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#ffe58f] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#b45309] flex items-center gap-1.5 min-w-0">
              <Stethoscope className="w-3.5 h-3.5 text-[#d48806] shrink-0" />
              <span className="truncate">Lapis 2 • SDMK DPJP (30%)</span>
            </span>
            <span className="text-xs font-mono font-bold text-[#b45309] bg-white px-2.5 py-0.5 rounded-full border border-[#ffd666] shadow-2xs shrink-0 whitespace-nowrap">
              S2 = {claim.s2_score}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-600 shrink-0">DPJP:</span>
              <span className="font-bold text-slate-900 truncate" title={claim.dpjp_meta.nama_dpjp_alias}>{claim.dpjp_meta.nama_dpjp_alias}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-600 shrink-0">Status SIP:</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${
                  claim.dpjp_meta.sip_status === "ACTIVE"
                    ? "bg-[#f6ffed] text-[#389e0d] border-[#b7eb8f]"
                    : claim.dpjp_meta.sip_status === "EXPIRED"
                    ? "bg-[#fff1f0] text-[#cf1322] border-[#ffa39e]"
                    : "bg-[#fffbe6] text-[#d48806] border-[#ffe58f]"
                }`}
              >
                {claim.dpjp_meta.sip_status}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 pt-1 leading-snug">
              {claim.dpjp_meta.catatan_sdmk}
            </p>
          </div>
        </div>

        {/* Lapis 3: Konfirmasi Peserta Mobile JKN (20%) */}
        <div className="bg-[#e6f7ff]/70 p-4 rounded-xl border border-[#91d5ff] hover:border-[#69c0ff] transition">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#91d5ff] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#096dd9] flex items-center gap-1.5 min-w-0">
              <UserCheck className="w-3.5 h-3.5 text-[#096dd9] shrink-0" />
              <span className="truncate">Lapis 3 • Mobile JKN (20%)</span>
            </span>
            <span className="text-xs font-mono font-bold text-[#096dd9] bg-white px-2.5 py-0.5 rounded-full border border-[#91d5ff] shadow-2xs shrink-0 whitespace-nowrap">
              S3 = {claim.s3_score}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-600 shrink-0">Sampel Terkirim:</span>
              <span className="font-bold text-slate-900 whitespace-nowrap">{claim.mobile_meta.sampel_terkirim} Peserta</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-600 shrink-0">Respon Menolak Hadir:</span>
              <span className={`font-bold font-mono whitespace-nowrap ${claim.mobile_meta.respon_tidak_hadir > 0 ? "text-[#cf1322]" : "text-[#389e0d]"}`}>
                {claim.mobile_meta.respon_tidak_hadir} dari {claim.mobile_meta.sampel_terkirim}
              </span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-600 shrink-0">Respon Konfirmasi Hadir:</span>
              <span className="font-bold text-[#389e0d] font-mono whitespace-nowrap">{claim.mobile_meta.respon_hadir} Peserta</span>
            </div>
            <div className="pt-1 text-[11px] text-slate-500 italic">
              *Terenkripsi AES-256; bebas pemaparan diagnosis medis (UU PDP 27/2022).
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Header: Dossier vs Graph View vs BPJS Data Sample */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 pb-2.5 mb-3.5 gap-2">
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setActiveTab("DOSSIER")}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl font-semibold transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              activeTab === "DOSSIER"
                ? "bg-blue-600 text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Langkah 2 • Berkas Alasan Siap-Audit (Bebas Halusinasi)
          </button>
          <button
            onClick={() => setActiveTab("GRAPH")}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl font-semibold transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              activeTab === "GRAPH"
                ? "bg-blue-600 text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Visualisasi Graf Klaster Anomali (XAI)
          </button>
          <button
            onClick={() => setActiveTab("BPJS_DATA")}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl font-semibold transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              activeTab === "BPJS_DATA"
                ? "bg-blue-600 text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Kamus Data Sampel BPJS & BEA C03.04
          </button>
        </div>

        {onOpenExportModal && (
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            Cetak / Ekspor Berkas
          </button>
        )}
      </div>

      {/* Tab Content 1: Structured Audit Dossier */}
      {activeTab === "DOSSIER" ? (
        <div className="space-y-3.5">
          {/* MITRE Fight Fraud Framework (F3) & Permenkes 16/2019 Card */}
          <div className="p-3.5 bg-[#f0f5ff]/70 border border-[#d6e4ff] rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1d39c4] flex items-center gap-1.5 uppercase tracking-wide">
                <ShieldAlert className="w-4 h-4 text-[#2f54eb]" />
                Taksonomi Ancaman Fraud (MITRE F3 v1.1 & Permenkes 16/2019)
              </span>
              <span className="font-mono text-[10px] font-bold bg-[#e6f7ff] text-[#096dd9] px-2.5 py-0.5 rounded-full border border-[#91d5ff]">
                MITRE F3 CTID Compliant
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="bg-white p-2.5 rounded-xl border border-[#d6e4ff]/80 space-y-1">
                <span className="text-slate-500 font-semibold block">Taktik F3 Terindikasi:</span>
                <div className="flex flex-wrap gap-1">
                  {triage.mitre_f3_tags && triage.mitre_f3_tags.length > 0 ? (
                    triage.mitre_f3_tags.map((tag, i) => (
                      <span key={i} className="font-mono font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="font-mono text-emerald-700 font-medium text-[11px]">
                      {lane === "MERAH"
                        ? "FA0001 (Positioning) • FA0002 (Monetization: F1025.003)"
                        : lane === "KUNING"
                        ? "FA0001 (Pre-Positioning: Kesenjangan Administratif)"
                        : "FA0000 (Baseline Bersih: Nol Pola Anomali)"}
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#d6e4ff]/80 space-y-1">
                <span className="text-slate-500 font-semibold block">Kepatuhan Regulasi & Standar:</span>
                <div className="flex flex-wrap gap-1">
                  {triage.regulatory_basis && triage.regulatory_basis.length > 0 ? (
                    triage.regulatory_basis.map((reg, i) => (
                      <span key={i} className="text-[10px] text-slate-800 font-medium bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                        {reg}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-800 font-medium text-[11px]">
                      Permenkes 16/2019 (Tipologi FKRTL) • UU PDP 27/2022
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Formula calculation bar */}
          <div className="p-3.5 bg-[#f8fafc] border border-slate-200/80 rounded-xl text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-800">
                Formulasi Fusi Multi-Sinyal:{" "}
                <code className="text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/80">
                  S = 0.5×S1 + 0.3×S2 + 0.2×S3
                </code>
              </span>
              <span className="font-mono text-slate-700 font-medium">
                0.5×({triage.score_breakdown.s1_value}) + 0.3×({triage.score_breakdown.s2_value}) + 0.2×({triage.score_breakdown.s3_value}) ={" "}
                <b className="text-slate-900 text-sm font-bold">{triage.raw_weighted_score}</b>
              </span>
            </div>

            {/* Score Contribution Progress Bar */}
            <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(triage.score_breakdown.s1_contribution / 100) * 100}%` }}
                className="bg-[#2f54eb] h-full"
                title={`S1 Kontribusi: ${triage.score_breakdown.s1_contribution}`}
              />
              <div
                style={{ width: `${(triage.score_breakdown.s2_contribution / 100) * 100}%` }}
                className="bg-[#f59e0b] h-full"
                title={`S2 Kontribusi: ${triage.score_breakdown.s2_contribution}`}
              />
              <div
                style={{ width: `${(triage.score_breakdown.s3_contribution / 100) * 100}%` }}
                className="bg-[#0284c7] h-full"
                title={`S3 Kontribusi: ${triage.score_breakdown.s3_contribution}`}
              />
            </div>
          </div>

          {/* Indicators list */}
          <div className="p-4 bg-[#f8fafc] border border-slate-200/80 rounded-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-2.5">
              Kode Indikator Pelanggaran Terdeteksi:
            </span>
            <div className="space-y-2">
              {triage.kode_indikator.map((ind, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-800">
                  <span className="text-blue-600 font-mono text-xs mt-0.5 font-bold">▶</span>
                  <span className="leading-relaxed font-medium">{ind}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kemungkinan Penjelasan Sah (Bias Mitigation) */}
          <div className="p-4 bg-[#fffbe6]/80 border border-[#ffe58f] rounded-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#b45309] block mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#d48806]" />
              Kemungkinan Penjelasan Sah (Mitigasi Bias & False Positive):
            </span>
            <p className="text-xs text-[#78350f] leading-relaxed font-medium">
              {triage.kemungkinan_penjelasan_sah}
            </p>
          </div>

          {/* Rekomendasi SOP Verifikasi (Perpres 82/2018) */}
          <div className="p-4 bg-[#f6ffed]/80 border border-[#b7eb8f] rounded-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#15803d] block mb-1.5">
              Rekomendasi Tindak Lanjut SOP (Perpres No. 82/2018 Pasal 76 Ayat 2):
            </span>
            <p className="text-xs text-[#14532d] leading-relaxed font-medium">
              {triage.rekomendasi_sop}
            </p>
          </div>
        </div>
      ) : activeTab === "GRAPH" ? (
        /* Tab Content 2: Visual Graph Topology */
        <div>
          <EpisodeFingerprintGraph graphData={triage.graph_data} claimId={claim.claim_id} />
        </div>
      ) : (
        /* Tab Content 3: BPJS Healthkathon Data Sample & BEA C03.04 Mapping */
        <div className="space-y-4 text-xs">
          {/* BEA C03.04 Card */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center gap-2 uppercase tracking-wide">
                <Workflow className="w-4 h-4 text-blue-600" />
                Arsitektur Bisnis BPJS Kesehatan (BEA {triage.bea_process_code || "C03.04 (Klaim)"})
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                Target: {triage.bea_target_system || "VIDI (Vedika Digital)"}
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">
              {triage.bea_action_summary || "Disposisi klaim pra-bayar diteruskan secara interoperabel ke modul sistem aktif BPJS Kesehatan."}
            </p>
          </div>

          {/* Data Sample Mapping Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-600" />
                Penyelarasan Standar Kamus Data Sampel BPJS Kesehatan (Healthkathon 2026)
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Spesifikasi Data Sampel FKRTL & FKTP Non-Kapitasi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-2.5 font-mono">Kode Variabel</th>
                    <th className="p-2.5">Nama Variabel Resmi BPJS</th>
                    <th className="p-2.5">Nilai Berkas Klaim</th>
                    <th className="p-2.5">Status Validasi & Integritas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-700">FKL02</td>
                    <td className="p-2.5">ID Kunjungan Peserta</td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">{claim.fkl02_id_kunjungan || claim.claim_id}</td>
                    <td className="p-2.5 text-emerald-700 font-semibold">Tervalidasi Unik</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-700">PSTV01</td>
                    <td className="p-2.5">Nomor Peserta (De-identifikasi)</td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">{claim.pstv01_peserta_id || claim.peserta_token_aes}</td>
                    <td className="p-2.5 text-emerald-700 font-semibold">Terenkripsi AES-256 (Patuh UU PDP)</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-700">FKL03 / FKL04</td>
                    <td className="p-2.5">Tanggal Masuk & Tanggal Pulang</td>
                    <td className="p-2.5 font-mono text-slate-900">{(claim.fkl03_tgl_masuk as any) || claim.tanggal_layanan} s.d. {(claim.fkl04_tgl_pulang as any) || claim.tanggal_layanan}</td>
                    <td className="p-2.5 text-slate-600">Sinkron Rekam Medis</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-700">FKL07 / FKL08</td>
                    <td className="p-2.5">Kepemilikan & Jenis Faskes</td>
                    <td className="p-2.5 text-slate-900">{claim.fkl07_kepemilikan || "Swasta"} • {claim.fkl08_jenis_faskes || "Rumah Sakit"}</td>
                    <td className="p-2.5 text-slate-600">HFIS BPJS Terdaftar</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-700">FKL09 / FKL10</td>
                    <td className="p-2.5">Tipe Faskes & Tingkat Layanan</td>
                    <td className="p-2.5 text-slate-900">Kelas {claim.kelas_rs} • {claim.fkl10_tingkat_layanan || "1 (Rawat Jalan)"}</td>
                    <td className="p-2.5 text-slate-600">Sesuai Izin Operasional</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-700">FKL11 / FKL17</td>
                    <td className="p-2.5">Segmen Peserta & Kelas Rawat</td>
                    <td className="p-2.5 text-slate-900">{claim.fkl11_segmen_peserta || "PBI APBN"} • {claim.fkl17_kelas_rawat || "Non-Kelas"}</td>
                    <td className="p-2.5 text-slate-600">Hak Kelas Sah</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-700">FKL24</td>
                    <td className="p-2.5">Diagnosa Utama ICD-10</td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">{claim.icd10_primary}</td>
                    <td className="p-2.5 text-blue-700 font-semibold">Tervektorisasi ChromaDB</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-700">FKL30 / FKL31</td>
                    <td className="p-2.5">Kode & Tarif INA-CBG</td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">{claim.ina_cbg_code} (Rp{claim.nilai_klaim_rp.toLocaleString("id-ID")})</td>
                    <td className="p-2.5 text-slate-600">Permenkes 3/2023 Valid</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-700">FKL47</td>
                    <td className="p-2.5">Biaya Tagih oleh Provider (RS)</td>
                    <td className="p-2.5 font-mono font-bold text-[#059669]">Rp{claim.nilai_klaim_rp.toLocaleString("id-ID")}</td>
                    <td className="p-2.5 text-slate-600">Tagihan Masuk VClaim</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-700">FKL48</td>
                    <td className="p-2.5">Biaya Verifikasi BPJS Kesehatan</td>
                    <td className="p-2.5 font-mono font-bold text-blue-700">
                      {claim.fkl48_biaya_verifikasi !== undefined && claim.fkl48_biaya_verifikasi > 0
                        ? `Rp${claim.fkl48_biaya_verifikasi.toLocaleString("id-ID")}`
                        : "Rp0 (Penundaan Bayar Pra-Bayar)"}
                    </td>
                    <td className={`p-2.5 font-semibold ${triage.triage_lane === "MERAH" ? "text-red-700" : "text-emerald-700"}`}>
                      {triage.triage_lane === "MERAH" ? "Dana Aman Tertahan (Audit Pra-Bayar)" : "Disetujui Bayar"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tamper-Evident SHA-256 Hash Seal */}
      <div className="mt-4 pt-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-600">
        <div className="flex items-center gap-2 flex-wrap">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-medium text-slate-700">Segel Kriptografis:</span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded border border-slate-300">
            SHA-256
          </span>
          <span
            className="text-slate-900 font-semibold select-all bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-300 font-mono"
            title={`Hash Lengkap: ${triage.audit_hash}`}
          >
            {triage.audit_hash.substring(0, 24)}...
          </span>
        </div>

        <button
          onClick={handleCopyHash}
          className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 transition font-medium focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
        >
          {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedHash ? "Tersalin!" : "Salin Hash"}
        </button>
      </div>
    </div>
  );
}
