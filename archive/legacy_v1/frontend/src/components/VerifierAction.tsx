"use client";
import React, { useState } from "react";
import { ClaimWithTriage } from "../types/claim";
import { UserCheck, CheckCircle2, AlertTriangle, AlertOctagon, Sparkles } from "lucide-react";

interface VerifierActionProps {
  claimItem: ClaimWithTriage;
  onRecordDecision: (
    decision: "LOLOSKAN_KLAIM" | "KLARIFIKASI_FASKES" | "AUDIT_LAPANGAN",
    notes: string,
    verifierId: string
  ) => Promise<void> | void;
  isLoading?: boolean;
}

export default function VerifierAction({
  claimItem,
  onRecordDecision,
  isLoading = false,
}: VerifierActionProps) {
  const { claim, triage } = claimItem;
  const [selectedDecision, setSelectedDecision] = useState<
    "LOLOSKAN_KLAIM" | "KLARIFIKASI_FASKES" | "AUDIT_LAPANGAN" | null
  >(null);
  const [verifierId, setVerifierId] = useState<string>("VRF-JKN-KHALAF-01");
  const [notes, setNotes] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (decisionType: "LOLOSKAN_KLAIM" | "KLARIFIKASI_FASKES" | "AUDIT_LAPANGAN") => {
    setSelectedDecision(decisionType);
    const defaultNote =
      notes.trim() !== ""
        ? notes
        : decisionType === "LOLOSKAN_KLAIM"
        ? "Klaim diverifikasi sah melalui jalur cepat (Fast-Track). Seluruh jejak DPJP dan presensi konsisten."
        : decisionType === "KLARIFIKASI_FASKES"
        ? "Permintaan klarifikasi administratif digital dikirimkan ke faskes sebelum batas waktu berita acara (10 hari kerja, Perpres 82/2018)."
        : "Eskalasi audit lapangan direkomendasikan karena anomali konvergen pada Lapis 1 (Klaster baksos) & Lapis 2 (SIP Expired).";

    await onRecordDecision(decisionType, defaultNote, verifierId);
    setSuccessMessage(`Keputusan '${decisionType}' berhasil dicatat dan disegel ke Rantai Audit Tamper-Evident SHA-256!`);
    setTimeout(() => {
      setSuccessMessage(null);
      setSelectedDecision(null);
    }, 4000);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Langkah 3 • Keputusan Verifikator (Human-in-the-Loop)
            </h3>
            <p className="text-xs text-slate-500">
              AI Hanya Menerbitkan Rekomendasi Prioritas • Hak Putus Mutlak di Tangan Verifikator
            </p>
          </div>
        </div>

        {/* Verifier Badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-xs text-slate-600 font-semibold">Verifikator:</span>
          <select
            value={verifierId}
            onChange={(e) => setVerifierId(e.target.value)}
            className="bg-white border border-slate-200/90 text-slate-900 text-xs rounded-xl px-2.5 py-1.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none shadow-2xs font-medium"
          >
            <option value="VRF-JKN-KHALAF-01">Khalaf F. P. (Lead Verifikator)</option>
            <option value="VRF-JKN-GAUDI-02">Gaudiansyah A. M. (Assoc. Verifikator)</option>
            <option value="VRF-JKN-PUSAT-03">Verifikator Kantor Cabang Surakarta</option>
          </select>
        </div>
      </div>

      {/* Suggested Action Helper */}
      <div className="mb-4 p-3 bg-[#f8fafc] border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-slate-800 font-medium">
            Saran Sistem Berdasarkan Fusi Bukti:
          </span>
          <span
            className={`font-bold px-2.5 py-0.5 rounded-full text-xs border ${
              triage.triage_lane === "MERAH"
                ? "bg-[#fff1f0] text-[#cf1322] border-[#ffa39e]"
                : triage.triage_lane === "KUNING"
                ? "bg-[#fffbe6] text-[#d48806] border-[#ffe58f]"
                : "bg-[#f6ffed] text-[#389e0d] border-[#b7eb8f]"
            }`}
          >
            {triage.triage_lane === "MERAH"
              ? "Prioritaskan Klarifikasi / Audit Lapangan"
              : triage.triage_lane === "KUNING"
              ? "Klarifikasi Administratif Digital Faskes"
              : "Loloskan Klaim (Fast-Track)"}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono font-medium">
          Perpres 82/2018 Pasal 76 (2)
        </span>
      </div>

      {/* Verifier Note Input */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-slate-700 block mb-1">
          Catatan Verifikator Tambahan (Opsional):
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tuliskan catatan telaah khusus, hasil koordinasi dengan faskes, atau alasan pertimbangan verifikator..."
          className="w-full bg-white border border-slate-200/90 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition shadow-2xs"
        />
      </div>

      {/* 3 Human-in-the-Loop Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Button 1: Loloskan Klaim */}
        <button
          disabled={isLoading}
          onClick={() => handleSubmit("LOLOSKAN_KLAIM")}
          className="min-h-[44px] py-2.5 px-3 rounded-xl bg-[#10b981] hover:bg-[#059669] active:scale-98 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs border border-[#059669] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus:outline-none"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
          <span>Loloskan Klaim (Fast-Track)</span>
        </button>

        {/* Button 2: Minta Klarifikasi Faskes */}
        <button
          disabled={isLoading}
          onClick={() => handleSubmit("KLARIFIKASI_FASKES")}
          className="min-h-[44px] py-2.5 px-3 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] active:scale-98 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs border border-[#d97706] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus:outline-none"
        >
          <AlertTriangle className="w-4 h-4 text-amber-100 shrink-0" />
          <span>Minta Klarifikasi Faskes</span>
        </button>

        {/* Button 3: Rekomendasi Audit Lapangan */}
        <button
          disabled={isLoading}
          onClick={() => handleSubmit("AUDIT_LAPANGAN")}
          className="min-h-[44px] py-2.5 px-3 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] active:scale-98 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs border border-[#dc2626] focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus:outline-none"
        >
          <AlertOctagon className="w-4 h-4 text-rose-100 shrink-0" />
          <span>Eskalasi Audit Lapangan / VPK</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="mt-3 p-3 bg-[#f6ffed] border border-[#b7eb8f] rounded-xl text-xs text-[#15803d] flex items-center gap-2 animate-fadeIn font-medium">
          <CheckCircle2 className="w-4 h-4 text-[#389e0d] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
}
