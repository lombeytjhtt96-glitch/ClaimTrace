"use client";
import React, { useState } from "react";
import { ClaimWithTriage } from "../types/claim";
import { AlertCircle, AlertTriangle, CheckCircle2, Search, Zap, Hospital } from "lucide-react";

interface TriageQueueProps {
  claims: ClaimWithTriage[];
  selectedClaimId: string;
  onSelectClaim: (claimId: string) => void;
}

export default function TriageQueue({
  claims,
  selectedClaimId,
  onSelectClaim,
}: TriageQueueProps) {
  const [filterLane, setFilterLane] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredClaims = claims.filter((item) => {
    if (filterLane !== "ALL" && item.triage.triage_lane !== filterLane) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchId = item.claim.claim_id.toLowerCase().includes(q);
      const matchFaskes = item.claim.nama_faskes.toLowerCase().includes(q);
      const matchCbg = item.claim.ina_cbg_code.toLowerCase().includes(q);
      const matchDesc = item.claim.deskripsi_cbg.toLowerCase().includes(q);
      return matchId || matchFaskes || matchCbg || matchDesc;
    }
    return true;
  });

  const countByLane = {
    ALL: claims.length,
    MERAH: claims.filter((c) => c.triage.triage_lane === "MERAH").length,
    KUNING: claims.filter((c) => c.triage.triage_lane === "KUNING").length,
    HIJAU: claims.filter((c) => c.triage.triage_lane === "HIJAU").length,
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-800">
            Langkah 1 • Antrean Triase Pra-Bayar
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/80 font-semibold">
          {filteredClaims.length} Kasus
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari ID klaim, faskes, atau INA-CBG..."
          className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent focus:outline-none transition shadow-2xs"
        />
      </div>

      {/* Lane Filter Tabs */}
      <div className="grid grid-cols-4 gap-1.5 mb-3 text-xs">
        <button
          onClick={() => setFilterLane("ALL")}
          className={`py-1.5 px-2 rounded-xl font-medium transition text-center focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
            filterLane === "ALL"
              ? "bg-blue-600 text-white shadow-2xs font-bold"
              : "text-slate-600 hover:bg-slate-100 bg-white border border-slate-200/80"
          }`}
        >
          Semua ({countByLane.ALL})
        </button>
        <button
          onClick={() => setFilterLane("MERAH")}
          className={`py-1.5 px-2 rounded-xl font-medium transition text-center flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none ${
            filterLane === "MERAH"
              ? "bg-[#ef4444] text-white font-bold shadow-2xs"
              : "text-[#e05638] hover:bg-[#fff1f0] bg-[#fff1f0]/70 border border-[#ffccc7]"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
          Merah ({countByLane.MERAH})
        </button>
        <button
          onClick={() => setFilterLane("KUNING")}
          className={`py-1.5 px-2 rounded-xl font-medium transition text-center flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
            filterLane === "KUNING"
              ? "bg-[#f59e0b] text-white font-bold shadow-2xs"
              : "text-[#d48806] hover:bg-[#fffbe6] bg-[#fffbe6]/70 border border-[#ffe58f]"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
          Kuning ({countByLane.KUNING})
        </button>
        <button
          onClick={() => setFilterLane("HIJAU")}
          className={`py-1.5 px-2 rounded-xl font-medium transition text-center flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
            filterLane === "HIJAU"
              ? "bg-[#10b981] text-white font-bold shadow-2xs"
              : "text-[#389e0d] hover:bg-[#f6ffed] bg-[#f6ffed]/70 border border-[#b7eb8f]"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#10b981]" />
          Hijau ({countByLane.HIJAU})
        </button>
      </div>

      {/* Claim Cards List */}
      <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)] pr-1 custom-scrollbar">
        {filteredClaims.map(({ claim, triage }) => {
          const isSelected = claim.claim_id === selectedClaimId;
          const lane = triage.triage_lane;

          const badgeConfig = {
            MERAH: {
              badge: "bg-[#fff1f0] text-[#cf1322] border-[#ffa39e]",
              icon: <AlertCircle className="w-3.5 h-3.5 text-[#e05638]" />,
              border: isSelected ? "border-[#ff7875] bg-[#fff8f7] shadow-[0_2px_10px_rgba(239,68,68,0.06)]" : "border-slate-200/90 hover:border-[#ffa39e]",
              cbgBadge: "bg-[#fff1f0] text-[#cf1322] border-[#ffa39e]",
            },
            KUNING: {
              badge: "bg-[#fffbe6] text-[#d48806] border-[#ffe58f]",
              icon: <AlertTriangle className="w-3.5 h-3.5 text-[#d48806]" />,
              border: isSelected ? "border-[#ffd666] bg-[#fffdf5] shadow-[0_2px_10px_rgba(245,158,11,0.06)]" : "border-slate-200/90 hover:border-[#ffe58f]",
              cbgBadge: "bg-[#fffbe6] text-[#d48806] border-[#ffe58f]",
            },
            HIJAU: {
              badge: "bg-[#f6ffed] text-[#389e0d] border-[#b7eb8f]",
              icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#389e0d]" />,
              border: isSelected ? "border-[#95de64] bg-[#f9fff6] shadow-[0_2px_10px_rgba(16,185,129,0.06)]" : "border-slate-200/90 hover:border-[#b7eb8f]",
              cbgBadge: "bg-[#f6ffed] text-[#389e0d] border-[#b7eb8f]",
            },
          }[lane];

          return (
            <div
              key={claim.claim_id}
              data-testid={`claim-card-${claim.claim_id}`}
              onClick={() => onSelectClaim(claim.claim_id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 relative overflow-hidden ${
                isSelected
                  ? `bg-white ${badgeConfig.border} shadow-[0_2px_8px_rgba(0,0,0,0.04)]`
                  : `bg-white ${badgeConfig.border} hover:bg-slate-50/50 shadow-2xs`
              }`}
            >
              {isSelected && (
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    lane === "MERAH" ? "bg-[#ef4444]" : lane === "KUNING" ? "bg-[#f59e0b]" : "bg-[#10b981]"
                  }`}
                />
              )}

              {/* Card Header */}
              <div className="flex items-center justify-between gap-2 mb-1.5 pl-1">
                <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
                  <span className="font-bold text-slate-900">{claim.claim_id}</span>
                  <span className="text-slate-300">•</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded-full text-slate-700 text-[10px] font-medium border border-slate-200/80">
                    Kelas {claim.kelas_rs}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {triage.hard_trigger_activated && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fff1f0] text-[#e11d48] border border-[#fda4af]">
                      <Zap className="w-2.5 h-2.5 text-[#e11d48]" />
                      HARD TRIGGER
                    </span>
                  )}
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${badgeConfig.badge}`}>
                    {badgeConfig.icon}
                    {triage.final_priority_score} / 100
                  </span>
                </div>
              </div>

              {/* Claim Title & Faskes */}
              <div className="pl-1">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <span className={`font-mono text-[11px] px-2 py-0.5 rounded-full border ${badgeConfig.cbgBadge}`}>
                    {claim.ina_cbg_code}
                  </span>
                  <span className="truncate">{claim.deskripsi_cbg}</span>
                </div>

                <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 truncate">
                  <Hospital className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{claim.nama_faskes}</span>
                </div>

                {/* Sub-Signals Visual Mini Badges */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="text-slate-500">L1:</span>
                    <span className={`font-mono font-bold ${claim.s1_score >= 75 ? "text-[#cf1322]" : "text-slate-800"}`}>
                      {claim.s1_score}
                    </span>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <span className="text-slate-500">L2:</span>
                    <span
                      className={`font-semibold ${
                        claim.dpjp_meta.sip_status === "EXPIRED"
                          ? "text-[#cf1322] font-bold"
                          : claim.dpjp_meta.sip_status === "UNSYNCED"
                          ? "text-[#d48806] font-bold"
                          : "text-[#389e0d]"
                      }`}
                    >
                      {claim.dpjp_meta.sip_status}
                    </span>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <span className="text-slate-500">L3:</span>
                    <span
                      className={`font-semibold ${
                        claim.mobile_meta.respon_tidak_hadir > 0
                          ? "text-[#cf1322] font-bold"
                          : "text-[#389e0d]"
                      }`}
                    >
                      {claim.mobile_meta.respon_tidak_hadir > 0
                        ? `${claim.mobile_meta.respon_tidak_hadir} Tolak`
                        : `${claim.mobile_meta.respon_hadir} Hadir`}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredClaims.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50">
            Tidak ada klaim yang sesuai dengan kriteria pencarian/filter.
          </div>
        )}
      </div>
    </div>
  );
}
