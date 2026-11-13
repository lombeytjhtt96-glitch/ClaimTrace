@props([
    'layerNumber' => '1',
    'title' => '',
    'subtitle' => '',
    'badge' => '',
    'badgeType' => 'info',
])

@php
    $badgeClass = match($badgeType) {
        'success' => 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        'warning' => 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        'danger' => 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        default => 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    };
@endphp

<div {{ $attributes->merge(['class' => 'p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm']) }}>
    <div class="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5 mb-3">
        <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-bpjs-green/10 text-bpjs-darkgreen dark:bg-emerald-500/20 dark:text-emerald-300 font-bold text-xs flex items-center justify-center font-mono">
                L{{ $layerNumber }}
            </span>
            <div>
                <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{{ $title }}</h4>
                @if($subtitle)
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ $subtitle }}</p>
                @endif
            </div>
        </div>
        @if($badge)
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border {{ $badgeClass }}">
                {{ $badge }}
            </span>
        @endif
    </div>
    <div class="space-y-2 text-xs">
        {{ $slot }}
    </div>
</div>
