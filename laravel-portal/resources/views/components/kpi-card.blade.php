@props([
    'title',
    'value',
    'subtitle' => null,
    'change' => null,
    'trend' => null,
    'badge' => null,
    'colorScheme' => 'bpjs-green',
    'subtext' => null,
])

@php
    $colorMap = [
        'bpjs-green' => [
            'iconBg' => 'bg-bpjs-green/10 text-bpjs-green dark:bg-emerald-500/20 dark:text-emerald-300 border border-bpjs-green/20',
            'badge' => 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
            'accent' => 'text-emerald-600 dark:text-emerald-400',
        ],
        'bpjs-blue' => [
            'iconBg' => 'bg-bpjs-blue/10 text-bpjs-blue dark:bg-blue-500/20 dark:text-blue-300 border border-bpjs-blue/20',
            'badge' => 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
            'accent' => 'text-bpjs-blue dark:text-blue-400',
        ],
        'amber' => [
            'iconBg' => 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/20',
            'badge' => 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
            'accent' => 'text-amber-600 dark:text-amber-400',
        ],
        'rose' => [
            'iconBg' => 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-500/20',
            'badge' => 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
            'accent' => 'text-rose-600 dark:text-rose-400',
        ],
        'cyan' => [
            'iconBg' => 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-500/20',
            'badge' => 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
            'accent' => 'text-cyan-600 dark:text-cyan-400',
        ],
        'emerald' => [
            'iconBg' => 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/20',
            'badge' => 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
            'accent' => 'text-emerald-600 dark:text-emerald-400',
        ],
    ];

    $scheme = $colorMap[$colorScheme] ?? $colorMap['bpjs-green'];
@endphp

<div {{ $attributes->merge(['class' => 'p-5 rounded-2xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 shadow-sm transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 flex flex-col justify-between']) }}>
    <div>
        <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {{ $title }}
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
                @if($badge)
                    <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border {{ $scheme['badge'] }}">
                        {{ $badge }}
                    </span>
                @endif
                @if(isset($icon))
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 {{ $scheme['iconBg'] }}">
                        {{ $icon }}
                    </div>
                @endif
            </div>
        </div>

        <div class="mt-3">
            <div class="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                {{ $value }}
            </div>

            @if($subtitle)
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    {{ $subtitle }}
                </p>
            @endif
        </div>
    </div>

    @if($change || $subtext)
        <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px]">
            @if($change)
                <div class="flex items-center gap-1 font-medium {{ $trend === 'down' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400' }}">
                    @if($trend === 'up')
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                    @elseif($trend === 'down')
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                    @endif
                    <span>{{ $change }}</span>
                </div>
            @endif
            @if($subtext)
                <span class="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                    {{ $subtext }}
                </span>
            @endif
        </div>
    @endif
</div>
