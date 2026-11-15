import React from 'react';
import { Info, ArrowRight } from 'lucide-react';

export function NoticeBanner({
  message,
  actionText = 'Action Now',
  onAction,
  icon: Icon = Info,
  className = '',
}) {
  return (
    <div
      className={`flex items-center justify-between p-3.5 px-4 rounded-xl text-xs transition-colors duration-200 border bg-cyan-50/70 border-cyan-200/80 text-cyan-950 dark:bg-cyan-950/20 dark:border-cyan-800/40 dark:text-cyan-200 shadow-2xs ${className}`}
    >
      <div className="flex items-center space-x-2.5 min-w-0 pr-3">
        <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
        <p className="truncate font-medium text-[11.5px] leading-relaxed">
          {message}
        </p>
      </div>

      {actionText && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-600 dark:text-slate-900"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
