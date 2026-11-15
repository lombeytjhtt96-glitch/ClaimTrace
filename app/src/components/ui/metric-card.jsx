import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TINT_COLORS = {
  cyan: {
    badge: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400',
    trend: 'text-cyan-600 dark:text-cyan-400',
  },
  emerald: {
    badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    trend: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    trend: 'text-amber-600 dark:text-amber-400',
  },
  blue: {
    badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    trend: 'text-blue-600 dark:text-blue-400',
  },
  rose: {
    badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    trend: 'text-rose-600 dark:text-rose-400',
  },
  indigo: {
    badge: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
    trend: 'text-indigo-600 dark:text-indigo-400',
  },
};

export function MetricCard({
  title,
  value,
  trend,
  trendDirection = 'up',
  period = 'Since last month',
  icon: Icon,
  color = 'cyan',
  className = '',
  onClick,
}) {
  const scheme = TINT_COLORS[color] || TINT_COLORS.cyan;
  const isUp = trendDirection === 'up';

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl border transition-all duration-200 select-none bg-white border-[#061B31]/10 shadow-[0_1px_2px_rgba(6,27,49,0.04)] hover:shadow-[0_4px_12px_rgba(6,27,49,0.06)] dark:bg-[#11141A] dark:border-white/[0.08] ${
        onClick ? 'cursor-pointer hover:border-[#061B31]/20 dark:hover:border-white/[0.14]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1.5 min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {title}
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-[#061B31] dark:text-[#F3F5F8] tabular-nums">
            {value}
          </h3>
          {trend && (
            <div className="flex items-center space-x-1.5 pt-0.5 text-xs font-medium">
              <span className={`inline-flex items-center space-x-0.5 ${isUp ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{trend}</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                {period}
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={`w-10 h-10 rounded-lg border border-current/15 flex items-center justify-center shrink-0 ml-3 transition-transform group-hover:scale-105 ${scheme.badge}`}>
            <Icon className="w-5 h-5 stroke-[1.75]" />
          </div>
        )}
      </div>
    </div>
  );
}
