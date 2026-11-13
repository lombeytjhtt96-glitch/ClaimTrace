@props([
    'score',
    'showLane' => true,
    'size' => 'md',
    'hardTrigger' => false,
    'compact' => false,
])

@php
    $numScore = is_numeric($score) ? (float) $score : 0.0;
    $isRed = $hardTrigger || $numScore >= 75.0;
    $isYellow = !$isRed && $numScore >= 50.0;
    $isGreen = !$isRed && !$isYellow;

    $laneCode = $isRed ? 'MERAH' : ($isYellow ? 'KUNING' : 'HIJAU');
    $laneLabel = $isRed 
        ? ($hardTrigger ? 'Hard Trigger' : 'Jalur Merah') 
        : ($isYellow ? 'Jalur Kuning' : 'Jalur Hijau');

    $sizeClasses = [
        'sm' => 'px-2 py-0.5 text-[11px] gap-1',
        'md' => 'px-2.5 py-1 text-xs gap-1.5',
        'lg' => 'px-3.5 py-1.5 text-sm gap-2',
    ][$size] ?? 'px-2.5 py-1 text-xs gap-1.5';

    $dotSizes = [
        'sm' => 'w-1.5 h-1.5',
        'md' => 'w-2 h-2',
        'lg' => 'w-2.5 h-2.5',
    ][$size] ?? 'w-2 h-2';

    if ($isRed) {
        $containerClass = 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
        $dotClass = 'bg-rose-500';
    } elseif ($isYellow) {
        $containerClass = 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
        $dotClass = 'bg-amber-500';
    } else {
        $containerClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
        $dotClass = 'bg-emerald-500';
    }

    $formattedScore = number_format($numScore, 1, ',', '.');
@endphp

<span {{ $attributes->merge(['class' => "inline-flex items-center rounded-lg border font-mono font-semibold tabular-nums {$sizeClasses} {$containerClass}"]) }}>
    <span class="rounded-full shrink-0 {{ $dotSizes }} {{ $dotClass }}"></span>
    <span>{{ $formattedScore }}</span>
    @if($showLane && !$compact)
        <span class="font-sans font-medium text-[10px] opacity-85 ml-0.5">
            ({{ $laneLabel }})
        </span>
    @endif
</span>
