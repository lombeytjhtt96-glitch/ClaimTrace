import React, { useState } from 'react';
import { ChevronLeft, Flame, Footprints, Heart, Target, Award, Plus } from 'lucide-react';

export default function BugarScreen({ onNavigate }) {
  const [steps, setSteps] = useState(6420);
  const targetSteps = 10000;
  const calories = Math.round((steps * 0.04) * 10) / 10;
  const distance = Math.round((steps * 0.00075) * 100) / 100;

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center space-x-3 shadow-sm shrink-0">
        <button type="button" onClick={() => onNavigate('home')} className="p-1 text-slate-700 hover:text-black rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-tight">
            Bugar (Aktivitas Fisik & Prolanis)
          </h2>
          <span className="text-[10px] text-slate-500 font-medium">
            Monitor Kebugaran & Pencegahan Penyakit Kronis
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Step Counter Hero */}
        <div className="bg-gradient-to-tr from-[#FF5722] via-[#FF9800] to-[#4CAF50] text-white p-5 rounded-3xl shadow-xs space-y-4 text-center">
          <span className="text-xs uppercase tracking-widest font-bold opacity-90">
            Langkah Kaki Hari Ini
          </span>

          <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
            {/* Circular Progress Ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="transparent"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="transparent"
                stroke="#FFFFFF"
                strokeWidth="10"
                strokeDasharray={264}
                strokeDashoffset={264 - (264 * (steps / targetSteps))}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <Footprints className="w-6 h-6 mb-1 opacity-90" />
              <span className="text-2xl font-bold">{steps.toLocaleString()}</span>
              <span className="text-[10px] opacity-80">/ {targetSteps.toLocaleString()}</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/20 text-xs">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-2.5">
              <div className="flex items-center justify-center space-x-1 opacity-80 text-[10px]">
                <Flame className="w-3.5 h-3.5" />
                <span>Kalori Terbakar</span>
              </div>
              <div className="text-base font-bold mt-0.5">{calories} <span className="text-[10px] font-normal">kkal</span></div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-2.5">
              <div className="flex items-center justify-center space-x-1 opacity-80 text-[10px]">
                <Target className="w-3.5 h-3.5" />
                <span>Jarak Tempuh</span>
              </div>
              <div className="text-base font-bold mt-0.5">{distance} <span className="text-[10px] font-normal">km</span></div>
            </div>
          </div>

          <button type="button"
            onClick={() => setSteps(steps + 500)}
            className="w-full bg-white text-orange-600 font-bold text-xs py-2.5 rounded-2xl shadow-xs active:scale-95 transition flex items-center justify-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Sinkronkan +500 Langkah</span>
          </button>
        </div>

        {/* Status Indeks Massa Tubuh (IMT) */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">Indeks Massa Tubuh (IMT)</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px] border border-emerald-200">
              Ideal / Normal
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold text-slate-900">21.8</span>
            <span className="text-[11px] text-slate-500">kg/m² (TB: 172 cm · BB: 64.5 kg)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
