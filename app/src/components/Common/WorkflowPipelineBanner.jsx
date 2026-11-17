import React from 'react';
import { ListFilter, FileText, ShieldAlert, Building2, ChevronRight } from 'lucide-react';

const PIPELINE_STEPS = [
  {
    step: 1,
    id: 'queue',
    label: '1. Triase & Antrean',
    shortLabel: '1. Antrean',
    desc: 'Penapisan SLA 10 Hari (3 Lajur)',
    icon: ListFilter,
  },
  {
    step: 2,
    id: 'investigation',
    label: '2. Telaah 3 Lapis',
    shortLabel: '2. Telaah',
    desc: 'Pola, DPJP & Mobile JKN',
    icon: FileText,
  },
  {
    step: 3,
    id: 'decision',
    label: '3. Putusan & BAKB',
    shortLabel: '3. Putusan',
    desc: 'Eksekusi Hukum & Sanggahan',
    icon: ShieldAlert,
  },
  {
    step: 4,
    id: 'faskes',
    label: '4. Pengawasan Faskes',
    shortLabel: '4. Faskes',
    desc: 'Indeks FRI & Deteksi Sindikat',
    icon: Building2,
  },
];

export default function WorkflowPipelineBanner({
  activeStep = 1,
  onNavigateTab,
  onOpenWorkflowMap,
  isLight = true,
  customNote,
}) {
  return (
    <div
      aria-label="Panduan Alur Verifikasi Klaim"
      className={`rounded-2xl border p-3.5 sm:p-4 transition-all ${
        isLight
          ? 'bg-gradient-to-r from-emerald-50/70 via-white to-slate-50 border-emerald-200/80 shadow-[0_2px_8px_rgba(4,120,87,0.04)] text-slate-900'
          : 'bg-gradient-to-r from-emerald-950/30 via-[#0B1528] to-[#0A101D] border-emerald-500/25 shadow-xl text-white'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Stepper Pipeline */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {PIPELINE_STEPS.map((item, idx) => {
            const Icon = item.icon;
            const isCurrent = item.step === activeStep;
            const isCompleted = item.step < activeStep;

            return (
              <React.Fragment key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab(item.id)}
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
                    isCurrent
                      ? isLight
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm font-semibold'
                        : 'bg-emerald-600 text-white border-emerald-500 font-semibold shadow-emerald-950/40'
                      : isCompleted
                      ? isLight
                        ? 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                        : 'bg-white/5 text-emerald-300 border-emerald-500/30 hover:bg-white/10'
                      : isLight
                      ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      : 'bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/5'
                  }`}
                  title={`Lompat ke ${item.label}`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isCurrent
                        ? 'text-white'
                        : isCompleted
                        ? isLight
                          ? 'text-emerald-700'
                          : 'text-emerald-400'
                        : isLight
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }`}
                  />
                  <div className="text-left">
                    <span className="block leading-tight font-display">{item.label}</span>
                    <span
                      className={`text-[9.5px] hidden sm:block ${
                        isCurrent
                          ? 'text-emerald-100'
                          : isLight
                          ? 'text-slate-500'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.desc}
                    </span>
                  </div>
                </button>

                {idx < PIPELINE_STEPS.length - 1 && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 hidden sm:block ${
                      isLight ? 'text-slate-300' : 'text-white/20'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Action Info & Map Trigger */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-white/10">
          {customNote ? (
            <p className={`text-[11px] leading-tight ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              {customNote}
            </p>
          ) : (
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                isLight
                  ? 'bg-emerald-100/60 text-emerald-900 border-emerald-300/80'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              }`}
            >
              SLA Pra-Bayar 10 Hari (Perpres 82/2018)
            </span>
          )}

          {onOpenWorkflowMap && (
            <button
              type="button"
              onClick={onOpenWorkflowMap}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                isLight
                  ? 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300 hover:border-emerald-400'
                  : 'bg-white/10 hover:bg-white/15 text-emerald-300 border-emerald-500/30'
              }`}
              title="Buka penjelasan interaktif seluruh alur kerja sistem"
            >
              <span>🧭 Peta Alur</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
