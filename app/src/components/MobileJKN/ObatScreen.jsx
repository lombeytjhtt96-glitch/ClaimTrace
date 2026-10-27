import React, { useState } from 'react';
import { ChevronLeft, Pill, Check, Clock, AlertCircle, Plus } from 'lucide-react';

export default function ObatScreen({ onNavigate }) {
  const [reminders, setReminders] = useState([
    { id: 1, name: 'Paracetamol 500mg', dose: '1 Tablet setelah makan', time: 'Pagi (08:00)', taken: true },
    { id: 2, name: 'Vitamin C 500mg', dose: '1 Tablet setelah makan', time: 'Siang (13:00)', taken: false },
    { id: 3, name: 'Amoxicillin 500mg', dose: '1 Tablet (Habiskan)', time: 'Malam (20:00)', taken: false },
  ]);

  const toggleTaken = (id) => {
    setReminders(reminders.map((r) => (r.id === id ? { ...r, taken: !r.taken } : r)));
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
            Info Obat & Kepatuhan Minum Obat
          </h2>
          <span className="text-[10px] text-slate-500 font-medium">
            Program Rujuk Balik (PRB) & Resep Digital
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Banner Kepatuhan */}
        <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl text-xs text-blue-900 space-y-1">
          <span className="font-bold flex items-center">
            <Clock className="w-4 h-4 mr-1.5 text-blue-600" />
            Jadwal Pengingat Minum Obat Hari Ini
          </span>
          <p className="text-[10.5px] text-blue-700 leading-relaxed">
            Menjaga kepatuhan konsumsi obat sesuai anjuran DPJP untuk percepatan pemulihan dan efisiensi terapi.
          </p>
        </div>

        {/* List Obat */}
        <div className="space-y-2.5">
          {reminders.map((r) => (
            <div
              key={r.id}
              onClick={() => toggleTaken(r.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                r.taken
                  ? 'bg-emerald-50/80 border-emerald-300'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2.5 rounded-xl ${
                  r.taken ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${
                    r.taken ? 'text-emerald-950 line-through' : 'text-slate-900'
                  }`}>
                    {r.name}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">{r.dose}</p>
                  <span className="text-[9.5px] font-semibold text-blue-600 mt-1 inline-block">
                    {r.time}
                  </span>
                </div>
              </div>

              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition ${
                r.taken
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 text-transparent hover:border-slate-400'
              }`}>
                <Check className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>

        {/* Info Ketersediaan Obat di Apotek Mitra */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5 text-xs">
          <span className="font-bold text-slate-900 block">Ketersediaan Obat di Faskes Anda</span>
          <div className="flex justify-between items-center text-[11px] p-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <p className="font-bold text-slate-800">Apotek Klinik Pratama Surakarta</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Stok Obat Lengkap (100%)</span>
            </div>
            <span className="text-[10px] text-slate-400">Buka 24 Jam</span>
          </div>
        </div>
      </div>
    </div>
  );
}
