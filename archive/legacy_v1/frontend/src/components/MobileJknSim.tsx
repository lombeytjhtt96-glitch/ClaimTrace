"use client";
import React, { useState } from "react";
import { ClaimItem } from "../types/claim";
import { Smartphone, Shield, CheckCircle, XCircle, Bell, Wifi, Battery, Clock } from "lucide-react";

interface MobileJknSimProps {
  claim: ClaimItem;
  onSimulateResponse: (attended: boolean) => Promise<void> | void;
  isLoading?: boolean;
}

export default function MobileJknSim({
  claim,
  onSimulateResponse,
  isLoading = false,
}: MobileJknSimProps) {
  const [lastClicked, setLastClicked] = useState<"ATTENDED" | "DENIED" | null>(null);

  const handleClick = async (attended: boolean) => {
    setLastClicked(attended ? "ATTENDED" : "DENIED");
    await onSimulateResponse(attended);
    setTimeout(() => {
      setLastClicked(null);
    }, 2500);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.03)] relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Simulator Kanal Mobile JKN (Lapis 3)
            </h3>
            <p className="text-[11px] text-slate-500">
              Konfirmasi Presensi Biner Peserta Terarah • Real-Time Interaktif
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/80 font-semibold">
          Uji Live Interaktif
        </span>
      </div>

      {/* Simulated Smartphone Frame (Full Light Theme) */}
      <div className="bg-[#f4f7fb] border border-slate-200/90 rounded-2xl p-3 shadow-sm max-w-sm mx-auto">
        {/* Smartphone Status Bar */}
        <div className="flex items-center justify-between text-xs text-slate-600 px-1 pb-2 border-b border-slate-200/70 font-mono">
          <span className="flex items-center gap-1 font-semibold text-slate-800">
            <Clock className="w-3 h-3 text-slate-400" /> 14:40 WIB
          </span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-slate-400" />
            <Battery className="w-3 h-3 text-emerald-600" />
            <span className="text-[10px] text-slate-600 font-bold">98%</span>
          </div>
        </div>

        {/* Mobile JKN App Header */}
        <div className="bg-[#059669] text-white p-2.5 rounded-xl my-2 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[#059669] font-black text-xs shadow-2xs">
              JKN
            </div>
            <div>
              <div className="font-bold text-xs leading-tight">Mobile JKN</div>
              <div className="text-[10px] text-emerald-100 font-medium">BPJS Kesehatan RI</div>
            </div>
          </div>
          <Bell className="w-3.5 h-3.5 text-emerald-100" />
        </div>

        {/* Push Notification Card */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 text-xs space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#059669]" />
              Konfirmasi Pelayanan Peserta
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Baru saja</span>
          </div>

          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            Apakah Anda hadir menerima layanan kesehatan pada tanggal{" "}
            <b className="text-slate-900 font-mono">{claim.tanggal_layanan}</b> di{" "}
            <b className="text-[#059669]">{claim.nama_faskes}</b>?
          </p>

          {/* Privacy Note */}
          <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/80 text-xs text-slate-600 leading-normal">
            <span className="font-bold text-slate-900 block mb-0.5">
              Prinsip Minimasi Data (UU PDP No. 27/2022):
            </span>
            Pertanyaan hanya memvalidasi kehadiran fisik secara biner (Ya/Tidak) tanpa membuka rekam medis / rincian tindakan klinis.
          </div>

          {/* Interactive Simulation Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              disabled={isLoading}
              onClick={() => handleClick(false)}
              className={`flex-1 min-h-[44px] py-2 px-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-2xs focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus:outline-none ${
                lastClicked === "DENIED"
                  ? "bg-rose-800 scale-98"
                  : "bg-[#ef4444] hover:bg-[#dc2626] active:scale-98"
              }`}
            >
              <XCircle className="w-4 h-4 shrink-0" />
              <span>Tidak Merasa Hadir</span>
            </button>

            <button
              disabled={isLoading}
              onClick={() => handleClick(true)}
              className={`flex-1 min-h-[44px] py-2 px-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-2xs focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus:outline-none ${
                lastClicked === "ATTENDED"
                  ? "bg-emerald-800 scale-98"
                  : "bg-[#10b981] hover:bg-[#059669] active:scale-98"
              }`}
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Ya, Saya Hadir</span>
            </button>
          </div>

          {/* Live Action Toast Indicator */}
          {lastClicked && (
            <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-center text-xs text-slate-900 animate-fadeIn">
              {lastClicked === "DENIED" ? (
                <span className="text-[#cf1322] font-semibold">
                  ⚠️ Anomali Tercatat: Sinyal &quot;Tidak Hadir&quot; mendongkrak S3 dan mengalirkan bukti ke Berkas Siap-Audit!
                </span>
              ) : (
                <span className="text-[#389e0d] font-semibold">
                  ✅ Konfirmasi Sah: Peserta hadir! S3 ditekan ke batas wajar dan tercatat pada rantai audit SHA-256.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Statistics */}
        <div className="mt-2.5 text-center text-xs text-slate-600 font-mono">
          Sampel terkirim: <b className="text-slate-900">{claim.mobile_meta.sampel_terkirim}</b> • Hadir:{" "}
          <span className="text-emerald-700 font-bold">{claim.mobile_meta.respon_hadir}</span> • Tolak:{" "}
          <span className="text-rose-700 font-bold">{claim.mobile_meta.respon_tidak_hadir}</span>
        </div>
      </div>
    </div>
  );
}
