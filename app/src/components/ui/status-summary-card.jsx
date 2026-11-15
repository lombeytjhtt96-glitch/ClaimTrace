import React from 'react';

const TICKET_COLOR_SCHEMES = {
  indigo: {
    bg: 'bg-[#6c5ce7] text-white',
    watermark: 'bg-white/20 text-white',
  },
  emerald: {
    bg: 'bg-[#00733B] text-white',
    watermark: 'bg-white/20 text-white',
  },
  cyan: {
    bg: 'bg-[#00cec9] text-white',
    watermark: 'bg-white/20 text-white',
  },
  rose: {
    bg: 'bg-[#ff7675] text-white',
    watermark: 'bg-white/20 text-white',
  },
  amber: {
    bg: 'bg-[#f59e0b] text-white',
    watermark: 'bg-white/20 text-white',
  },
};

export function StatusSummaryCard({
  count,
  label,
  icon: Icon,
  variant = 'indigo',
  className = '',
  onClick,
}) {
  const scheme = TICKET_COLOR_SCHEMES[variant] || TICKET_COLOR_SCHEMES.indigo;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl p-5 shadow-xs transition-all duration-200 select-none ${
        scheme.bg
      } ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight tabular-nums">
            {typeof count === 'number' ? count.toLocaleString('id-ID') : count}
          </h2>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-white/90">
            {label}
          </p>
        </div>

        {Icon && (
          <div className={`w-13 h-13 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${scheme.watermark}`}>
            <Icon className="w-6 h-6 stroke-[2]" />
          </div>
        )}
      </div>
    </div>
  );
}
