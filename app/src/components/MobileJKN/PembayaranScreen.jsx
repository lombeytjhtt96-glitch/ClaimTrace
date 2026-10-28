import React, { useState } from 'react';
import { ChevronLeft, CreditCard, CheckCircle2, Copy, History, ArrowDownLeft, Shield } from 'lucide-react';

export default function PembayaranScreen({ onNavigate }) {
  const [copied, setCopied] = useState(false);

  const vaList = [
    { bank: 'BCA (Simulasi)', va: '88888 0009999999999', icon: '/assets/images/bca_icon.png' },
    { bank: 'Bank Mandiri (Simulasi)', va: '89888 0009999999999', icon: '/assets/images/bank_icon.png' },
    { bank: 'BNI (Simulasi)', va: '88888 0009999999999', icon: '/assets/images/bni_icon.png' },
    { bank: 'BRI (Simulasi)', va: '88888 0009999999999', icon: '/assets/images/bri_icon.png' },
  ];

  const handleCopy = (va) => {
    navigator.clipboard?.writeText(va.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center space-x-3 shadow-sm shrink-0">
        <button type="button" onClick={() => onNavigate('home')} className="p-1 text-slate-700 hover:text-black rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-tight">
            Info Iuran & Pembayaran
          </h2>
          <span className="text-[10px] text-slate-500 font-medium">
            Status Autodebet & Virtual Account
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Card Tagihan Bulan Berjalan */}
        <div className="bg-gradient-to-tr from-[#0288D1] to-[#01A65A] text-white p-4 rounded-3xl shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="opacity-80">Tagihan Bulan Oktober 2026</span>
            <span className="bg-white/20 backdrop-blur px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              Autodebet Aktif
            </span>
          </div>

          <div className="text-2xl font-bold">
            Rp 0
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-emerald-100 pt-1 border-t border-white/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Iuran kepesertaan bulan ini sudah lunas terbayar.</span>
          </div>
        </div>

        {/* VA List */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900">
            Nomor Pembayaran Virtual Account (VA)
          </h3>
          <div className="space-y-2">
            {vaList.map((v, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
                    {v.bank.slice(0, 3)}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{v.bank}</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">{v.va}</span>
                  </div>
                </div>
                <button type="button"
                  onClick={() => handleCopy(v.va)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Salin Nomor VA"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {copied && (
            <p className="text-[10px] text-emerald-600 font-bold text-center">
              ✓ Nomor Virtual Account berhasil disalin ke clipboard!
            </p>
          )}
        </div>

        {/* Riwayat Mutasi Pembayaran */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
            <History className="w-4 h-4 text-slate-500" />
            <span>Riwayat Transaksi Terakhir</span>
          </h3>

          <div className="space-y-2.5 divide-y divide-slate-100 text-xs">
            <div className="pt-2 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">Iuran Peserta Mandiri (Okt 2026)</p>
                <span className="text-[10px] text-slate-400">05 Okt 2026 · Autodebet Bank BCA</span>
              </div>
              <span className="font-bold text-emerald-600">Rp 150.000</span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">Iuran Peserta Mandiri (Sep 2026)</p>
                <span className="text-[10px] text-slate-400">05 Sep 2026 · Autodebet Bank BCA</span>
              </div>
              <span className="font-bold text-emerald-600">Rp 150.000</span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">Iuran Peserta Mandiri (Agt 2026)</p>
                <span className="text-[10px] text-slate-400">05 Agt 2026 · Autodebet Bank BCA</span>
              </div>
              <span className="font-bold text-emerald-600">Rp 150.000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
