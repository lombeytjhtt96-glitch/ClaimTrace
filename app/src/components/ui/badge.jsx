import React from 'react';

const BADGE_VARIANTS = {
  default: 'bg-emerald-600 text-white hover:bg-emerald-700 border-transparent',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700',
  destructive: 'bg-rose-500 text-white hover:bg-rose-600 border-transparent',
  outline: 'text-slate-950 border-slate-300 dark:text-slate-50 dark:border-slate-700',
  
  // Case Queue Solid Status Badges
  'ticket-open': 'bg-[#00733B] text-white border-transparent shadow-2xs font-semibold',
  'ticket-pending': 'bg-[#ff7675] text-white border-transparent shadow-2xs font-semibold',
  'ticket-progress': 'bg-[#f59e0b] text-white border-transparent shadow-2xs font-semibold',
  'ticket-resolved': 'bg-[#00cec9] text-white border-transparent shadow-2xs font-semibold',
  
  // Case Queue Soft Priority Badges
  'ticket-low': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
  'ticket-medium': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  'ticket-high': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
  
  // Anti-Fraud Risk Severity Badges
  'risk-low': 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700',
  'risk-medium': 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700',
  'risk-high': 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700',
};

export function Badge({
  className = '',
  variant = 'default',
  children,
  ...props
}) {
  const variantClass = BADGE_VARIANTS[variant] || BADGE_VARIANTS.default;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-hidden ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
