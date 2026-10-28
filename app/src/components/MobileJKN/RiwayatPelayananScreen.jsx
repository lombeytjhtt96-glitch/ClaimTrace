import React from 'react';
import { ChevronLeft, Hospital, Calendar, Stethoscope, Shield, AlertTriangle, CheckCircle, ChevronRight, FileText } from 'lucide-react';

export default function RiwayatPelayananScreen({ onNavigate, onOpenClaimTrace, patientResponse }) {
  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center space-x-3 shadow-sm shrink-0">
        <button type="button" onClick={() => onNavigate('home')} className="p-1 text-slate-700 hover:text-black rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-tight">
            Riwayat Pelayanan (I-Care JKN)
          </h2>
          <span className="text-[10px] text-slate-500 font-medium">
            Rekam Medis & Verifikasi Integritas Klaim
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Banner Penjelasan ClaimTrace */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3.5 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wide">
                Proteksi Integritas Layanan (ClaimTrace)
              </h3>
            </div>
            <span className="text-[9px] bg-white/20 font-mono font-bold px-1.5 py-0.5 rounded">
              MITRE D3FEND D3-MFA
            </span>
          </div>
          <p className="text-[10.5px] text-emerald-100 leading-relaxed">
            Sistem memindai rekonsiliasi klaim faskes dengan basis data SATUSEHAT untuk mencegah klaim fiktif (Phantom Billing - MITRE F3 FA0001.F1005) yang mencatut nama Anda.
          </p>
        </div>

        {/* DAFTAR RIWAYAT KLAIM */}
        <div className="space-y-3">
          
          {/* KASUS 1: RS MITRA HUSADA (INDIKASI ANOMALI) */}
          <div 
            onClick={onOpenClaimTrace}
            className={`bg-white rounded-2xl p-3.5 border transition-all cursor-pointer shadow-sm relative overflow-hidden ${
              patientResponse === 'denied'
                ? 'border-rose-400 ring-2 ring-rose-500/20'
                : patientResponse === 'confirmed'
                ? 'border-emerald-400 ring-2 ring-emerald-500/20'
                : 'border-amber-400 ring-2 ring-amber-500/20'
            }`}
          >
            {/* Status Strip */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              patientResponse === 'denied'
                ? 'bg-rose-500'
                : patientResponse === 'confirmed'
                ? 'bg-emerald-500'
                : 'bg-amber-500 animate-pulse'
            }`} />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9.5px] font-bold text-slate-400 uppercase">
                  Faskes Rujukan Lanjutan (FKRTL)
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                  RS Khusus Mitra Husada
                </h4>
              </div>
              
              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                patientResponse === 'denied'
                  ? 'bg-rose-100 text-rose-700'
                  : patientResponse === 'confirmed'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {patientResponse === 'denied' ? (
                  <><span>Disangkal Peserta</span></>
                ) : patientResponse === 'confirmed' ? (
                  <><span>Terkonfirmasi Sah</span></>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    <span>Perlu Konfirmasi Anda</span>
                  </>
                )}
              </span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
              <div className="flex items-center text-slate-600">
                <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                <span>14 Oktober 2026 (Klaim Massal Baksos)</span>
              </div>
              <div className="flex items-center text-slate-600">
                <FileText className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-900">Prosedur Fisioterapi / Rehab (INA-CBG: Z-3-12-0)</span>
              </div>
              <div className="flex items-center text-slate-600">
                <Stethoscope className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                <span>DPJP: dr. Hendra, Sp.KFR</span>
              </div>
            </div>

            {/* Banner Call-to-Action */}
            <div className="mt-3 p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[10px] text-blue-600 font-bold">
              <span>Ketuk untuk tinjau bukti konfirmasi presensi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* KASUS 2: KLINIK PRATAMA NASIONAL (SAH) */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9.5px] font-bold text-slate-400 uppercase">
                  Faskes Tingkat Pertama (FKTP)
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                  KLINIK PRATAMA NASIONAL BPJS
                </h4>
              </div>
              <span className="text-[9.5px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Terverifikasi Sah
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
              <div className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                <span>28 September 2026</span>
              </div>
              <div className="flex items-center">
                <FileText className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                <span>Rawat Jalan Tingkat Pertama (Poli Umum)</span>
              </div>
              <div className="flex items-center">
                <Stethoscope className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                <span>DPJP: dr. Siti Rahma</span>
              </div>
            </div>
          </div>

          {/* KASUS 3: RSUPN DR. CIPTO MANGUNKUSUMO (SAH) */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9.5px] font-bold text-slate-400 uppercase">
                  Faskes Rujukan Lanjutan (FKRTL)
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                  RSUPN Dr. Cipto Mangunkusumo Jakarta
                </h4>
              </div>
              <span className="text-[9.5px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Terverifikasi Sah
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
              <div className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                <span>12 Juli 2026</span>
              </div>
              <div className="flex items-center">
                <FileText className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                <span>Pemeriksaan Laboratorium & Konsultasi Spesialis</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
