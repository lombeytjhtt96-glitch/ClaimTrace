import React from 'react';

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-xl border transition-colors duration-200 bg-white border-slate-200 shadow-xs dark:bg-[#222b38] dark:border-[#2d3748] dark:shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div
      className={`flex flex-col space-y-1.5 p-5 border-b border-slate-100 dark:border-slate-800/80 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3
      className={`text-base font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p
      className={`text-xs text-slate-500 dark:text-slate-400 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div
      className={`flex items-center p-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
