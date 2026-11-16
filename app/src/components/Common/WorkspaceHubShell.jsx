import React, { Suspense } from 'react';
import { useCockpitTheme } from '../../hooks/useCockpitTheme';

/**
 * Shared sub-navigation shell for consolidated verifier workspace hubs.
 * Keeps the left sidebar uncluttered while keeping related clinical/audit tools one click apart.
 */
export default function WorkspaceHubShell({
  tabs = [],
  activeSubTab,
  onChangeSubTab,
  ariaLabel = 'Sub-navigasi modul kerja',
  isLight: propIsLight,
  children,
}) {
  const isLight = useCockpitTheme(propIsLight);

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={`flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl border transition-colors ${
          isLight
            ? 'bg-white border-slate-200/90 shadow-2xs'
            : 'bg-[#11141A] border-white/[0.08]'
        }`}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChangeSubTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 whitespace-nowrap ${
                isActive
                  ? isLight
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-emerald-600 text-white shadow-2xs'
                  : isLight
                    ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {Icon && (
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive
                      ? 'text-white'
                      : isLight
                        ? 'text-emerald-700'
                        : 'text-emerald-400'
                  }`}
                />
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== null && tab.badge !== '' && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md border leading-none tabular-nums ${
                    isActive
                      ? 'bg-emerald-900/40 text-white border-white/25'
                      : isLight
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-white/10 text-slate-200 border-white/15'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Suspense
        fallback={
          <div
            className={`rounded-2xl border p-8 flex flex-col items-center justify-center gap-3 ${
              isLight ? 'bg-white border-slate-200 text-slate-600 shadow-2xs' : 'bg-[#11141A] border-white/10 text-slate-300'
            }`}
          >
            <div className="w-6 h-6 rounded-full border-2 border-emerald-500/25 border-t-emerald-600 animate-spin" />
            <span className="text-xs font-medium">Memuat tampilan...</span>
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}
