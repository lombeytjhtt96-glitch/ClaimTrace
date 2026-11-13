@extends('layouts.app')

@section('title', 'Beban Kerja Verifikator VEDIKA')

@section('content')
<div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Distribusi Beban Kerja Verifikator VEDIKA</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Monitoring kuota harian dan kepatuhan SLA 10 Hari Kerja per verifikator terdaftar.</p>
        </div>
        <div class="flex items-center gap-2">
            <a href="{{ url('/vedika/queue') }}" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20 transition-all flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                <span>Kembali ke Antrean FPK</span>
            </a>
        </div>
    </div>

    <!-- Verifier Workload Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        @foreach($workload['verifiers'] ?? [] as $v)
            @php
                $assignedCount = (int) ($v['assigned_claims_count'] ?? $v['assigned_total'] ?? $v['open_count'] ?? 0);
                $pendingCount = (int) ($v['pending_claims_count'] ?? $v['pending_dispute_count'] ?? 0);
                $disputeCount = (int) ($v['dispute_claims_count'] ?? 0);
                $redCount = (int) ($v['red_lane_claims_count'] ?? $v['merah_count'] ?? 0);
                $slaPct = (float) ($v['sla_compliance_pct'] ?? 100.0);
                $totalRp = (int) ($v['total_value_assigned_rp'] ?? $v['total_nilai_rp'] ?? 0);
            @endphp
            <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all">
                <div class="flex items-center justify-between gap-2 mb-3">
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold">
                        {{ $v['nip'] }}
                    </span>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full {{ $assignedCount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400' }}">
                        {{ $assignedCount > 0 ? 'Aktif Bertugas' : 'Siap Menerima' }}
                    </span>
                </div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{{ $v['name'] }}</h3>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-4">{{ $v['role'] }}</p>

                <div class="space-y-2 pt-3 border-t border-slate-100 dark:border-white/5 text-xs">
                    <div class="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Beban Berkas Aktif</span>
                        <span class="font-bold font-mono text-slate-900 dark:text-white">{{ $assignedCount }} Klaim</span>
                    </div>
                    <div class="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Pending Klarifikasi</span>
                        <span class="font-bold font-mono text-amber-600 dark:text-amber-400">{{ $pendingCount }} Berkas</span>
                    </div>
                    <div class="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Sengketa / Dispute</span>
                        <span class="font-bold font-mono text-rose-600 dark:text-rose-400">{{ $disputeCount }} Berkas</span>
                    </div>
                    <div class="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Prioritas Merah</span>
                        <span class="font-bold font-mono text-red-600 dark:text-red-400">{{ $redCount }} Berkas</span>
                    </div>
                    <div class="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-white/5">
                        <span>Nilai Portofolio</span>
                        <span class="font-bold font-mono text-slate-900 dark:text-white">Rp {{ number_format($totalRp, 0, ',', '.') }}</span>
                    </div>
                    <div class="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Kepatuhan SLA</span>
                        <span class="font-bold font-mono text-emerald-600 dark:text-emerald-400">{{ number_format($slaPct, 1, ',', '.') }}%</span>
                    </div>
                </div>
            </div>
        @endforeach
    </div>

    <!-- Summary Box -->
    <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-bpjs-green/10 text-bpjs-darkgreen dark:bg-emerald-500/20 dark:text-emerald-300 flex items-center justify-center font-bold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </div>
            <div>
                <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Kumpulan Berkas Antrean Belum Terdistribusi</h4>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">Total klaim dalam antrean FPK yang siap dialokasikan melalui modul Batch Plotting.</p>
            </div>
        </div>
        <div class="flex items-center gap-3">
            <span class="text-sm font-bold font-mono text-slate-900 dark:text-white">{{ $workload['unassigned_pool_count'] ?? $workload['unassigned_count'] ?? 14 }} Klaim Tersedia</span>
            <a href="{{ url('/vedika/queue') }}" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-bpjs-green text-white hover:bg-bpjs-darkgreen transition-all shadow-sm">
                Plotting Sekarang
            </a>
        </div>
    </div>
</div>
@endsection
