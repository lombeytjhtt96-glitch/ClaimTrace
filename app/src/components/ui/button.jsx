import React from 'react';

const BUTTON_VARIANTS = {
  default: 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs border-transparent',
  primary: 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs border-transparent',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700',
  outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  ghost: 'hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300 border-transparent',
  destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs border-transparent',
  
  // Cockpit Accent Variants
  indigo: 'bg-[#6c5ce7] text-white hover:bg-[#5b4cc4] shadow-xs border-transparent',
  emerald: 'bg-[#00733B] text-white hover:bg-[#005E30] shadow-xs border-transparent',
  cyan: 'bg-[#00cec9] text-white hover:bg-[#00b5b0] shadow-xs border-transparent',
  rose: 'bg-[#ff7675] text-white hover:bg-[#e66767] shadow-xs border-transparent',
};

const BUTTON_SIZES = {
  default: 'h-9 px-4 py-2 text-xs',
  sm: 'h-8 rounded-lg px-3 text-[11px]',
  lg: 'h-11 rounded-xl px-8 text-sm',
  icon: 'h-9 w-9 p-0 flex items-center justify-center',
};

export function Button({
  className = '',
  variant = 'default',
  size = 'default',
  disabled = false,
  children,
  type = 'button',
  ...props
}) {
  const variantClass = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.default;
  const sizeClass = BUTTON_SIZES[size] || BUTTON_SIZES.default;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold transition-all duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-50 select-none border ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
