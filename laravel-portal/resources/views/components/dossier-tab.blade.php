@props([
    'code' => '',
    'name' => '',
    'sha256' => '',
    'status' => 'VALID',
    'active' => false,
])

@php
    $statusClass = match(strtoupper($status)) {
        'VALID' => 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        'PERLU_KLARIFIKASI' => 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        'TIDAK_KONSISTEN', 'TIDAK_VALID' => 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        default => 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10',
    };
@endphp

<button
    type="button"
    {{ $attributes->merge(['class' => 'text-left p-3.5 rounded-xl border transition-all ' . ($active ? 'bg-bpjs-green/10 border-bpjs-green text-bpjs-darkgreen dark:bg-emerald-950/30 dark:border-emerald-500 dark:text-emerald-300 shadow-sm' : 'bg-white dark:bg-health-card border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/20')]) }}
>
    <div class="flex items-center justify-between gap-2 mb-1.5">
        <span class="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">{{ $code }}</span>
        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border {{ $statusClass }}">
            {{ $status }}
        </span>
    </div>
    <div class="text-xs font-medium text-slate-800 dark:text-slate-100 line-clamp-1 mb-2">
        {{ $name }}
    </div>
    <div class="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
        <svg class="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
        <span class="truncate" title="{{ $sha256 }}">SHA-256: {{ substr($sha256, 0, 16) }}...</span>
    </div>
</button>
