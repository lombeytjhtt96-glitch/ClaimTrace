import React from 'react';

export function Input({
  className = '',
  type = 'text',
  disabled = false,
  ...props
}) {
  return (
    <input
      type={type}
      disabled={disabled}
      className={`flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-slate-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-[#18202c] dark:text-slate-100 dark:placeholder:text-slate-500 ${className}`}
      {...props}
    />
  );
}
