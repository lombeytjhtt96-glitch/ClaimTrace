import React from 'react';

export function Table({ className = '', children, ...props }) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={`w-full caption-bottom text-xs text-left tabular-nums ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className = '', children, ...props }) {
  return (
    <thead className={`border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className = '', children, ...props }) {
  return (
    <tbody className={`divide-y divide-slate-100 dark:divide-slate-800/60 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableFooter({ className = '', children, ...props }) {
  return (
    <tfoot className={`border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 font-semibold ${className}`} {...props}>
      {children}
    </tfoot>
  );
}

export function TableRow({ className = '', children, ...props }) {
  return (
    <tr
      className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 data-[state=selected]:bg-slate-100 dark:data-[state=selected]:bg-slate-800 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className = '', children, ...props }) {
  return (
    <th
      className={`h-10 px-3.5 text-left align-middle font-bold text-slate-500 dark:text-slate-400 select-none ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ className = '', children, ...props }) {
  return (
    <td
      className={`p-3.5 align-middle text-slate-700 dark:text-slate-300 ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableCaption({ className = '', children, ...props }) {
  return (
    <caption
      className={`mt-4 text-xs text-slate-500 dark:text-slate-400 ${className}`}
      {...props}
    >
      {children}
    </caption>
  );
}
