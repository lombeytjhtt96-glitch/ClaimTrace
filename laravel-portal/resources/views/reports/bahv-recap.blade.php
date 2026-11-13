@extends('layouts.app')

@section('title', 'Rekapitulasi BAHV & FPK Kolektif — VEDIKA')

@section('content')
<div class="py-6 space-y-6" data-testid="bahv-recap-container">
    <!-- Header Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div class="space-y-1">
            <div class="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <a href="{{ route('vedika.queue') }}" class="hover:text-bpjs-green transition-colors">VEDIKA Antrean</a>
                <span>/</span>
                <span class="text-bpjs-darkgreen dark:text-emerald-400 font-medium">Rekapitulasi BAHV</span>
            </div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Rekapitulasi Berita Acara Hasil Verifikasi (BAHV) & FPK Kolektif
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">
                Konsolidasi Pengawasan Klaim Pra-Bayar FPK Kolektif &bull; SLA 10 Hari Kerja sesuai Perpres No. 82/2018 & Permenkes No. 3/2023
            </p>
        </div>

        <div class="flex items-center flex-wrap gap-2 text-xs">
            <a
                href="{{ route('reports.bahv.kolektif') }}"
                target="_blank"
                class="px-4 py-2 rounded-xl bg-bpjs-green hover:bg-bpjs-darkgreen text-white font-semibold shadow-sm shadow-bpjs-green/20 transition-all flex items-center gap-2"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                <span>Cetak BAHV Kolektif (PDF/Print)</span>
            </a>
            <a
                href="{{ route('reports.ba.pending') }}"
                target="_blank"
                class="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-health-card hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 font-medium transition-all flex items-center gap-2"
            >
                <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span>Cetak BA Pending / Dispute</span>
            </a>
        </div>
    </div>

    <!-- Fraud Prevention Efficiency Banner -->
    <div class="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-bpjs-green/10 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-bpjs-green text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {{ number_format($recap['prevention_efficiency_pct'] ?? 86.92, 1, ',', '.') }}%
            </div>
            <div>
                <div class="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                    Rasio Efisiensi Pencegahan Fraud & Penyelamatan Dana JKN
                </div>
                <div class="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Efisiensi: {{ number_format($recap['prevention_efficiency_pct'] ?? 86.92, 2, ',', '.') }}% dana klaim berisiko berhasil ditahan sebelum proses transfer kas negara (BOA).
                </div>
            </div>
        </div>
        <div class="text-right text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <div>Total Diajukan: Rp {{ number_format($recap['total_claimed_rp'] ?? 110220000, 0, ',', '.') }}</div>
            <div class="text-emerald-700 dark:text-emerald-400 font-semibold">
                Disetujui: Rp {{ number_format($recap['total_approved_rp'] ?? 14420000, 0, ',', '.') }}
            </div>
        </div>
    </div>

    <!-- 4 Summary KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Card 1: Layak Bayar -->
        <div class="p-4 rounded-2xl bg-white dark:bg-health-card border border-emerald-200 dark:border-emerald-900/40 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase font-mono">Layak Bayar</span>
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <div class="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {{ $recap['buckets']['LAYAK']['count'] ?? 3 }} <span class="text-xs font-normal text-slate-500">berkas</span>
            </div>
            <div class="pt-2 border-t border-slate-100 dark:border-white/5 space-y-0.5 text-[11px]">
                <div class="flex justify-between text-slate-500">
                    <span>Disetujui:</span>
                    <span class="font-mono font-semibold text-emerald-600 dark:text-emerald-400">Rp {{ number_format($recap['buckets']['LAYAK']['approved_rp'] ?? 14420000, 0, ',', '.') }}</span>
                </div>
                <div class="flex justify-between text-slate-400 text-[10px]">
                    <span>Tagihan Awal:</span>
                    <span class="font-mono">Rp {{ number_format($recap['buckets']['LAYAK']['claimed_rp'] ?? 14420000, 0, ',', '.') }}</span>
                </div>
            </div>
        </div>

        <!-- Card 2: Pending Klarifikasi -->
        <div class="p-4 rounded-2xl bg-white dark:bg-health-card border border-amber-200 dark:border-amber-900/40 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase font-mono">Pending Klarifikasi</span>
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            </div>
            <div class="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {{ $recap['buckets']['PENDING']['count'] ?? 2 }} <span class="text-xs font-normal text-slate-500">berkas</span>
            </div>
            <div class="pt-2 border-t border-slate-100 dark:border-white/5 space-y-0.5 text-[11px]">
                <div class="flex justify-between text-slate-500">
                    <span>Tertahan:</span>
                    <span class="font-mono font-semibold text-amber-600 dark:text-amber-400">Rp {{ number_format($recap['buckets']['PENDING']['held_rp'] ?? 23350000, 0, ',', '.') }}</span>
                </div>
                <div class="flex justify-between text-slate-400 text-[10px]">
                    <span>SLA Klarifikasi:</span>
                    <span class="font-mono">10 Hari Kerja</span>
                </div>
            </div>
        </div>

        <!-- Card 3: Dispute TKMKB -->
        <div class="p-4 rounded-2xl bg-white dark:bg-health-card border border-indigo-200 dark:border-indigo-900/40 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase font-mono">Dispute TKMKB</span>
                <span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            </div>
            <div class="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {{ $recap['buckets']['DISPUTE']['count'] ?? 0 }} <span class="text-xs font-normal text-slate-500">berkas</span>
            </div>
            <div class="pt-2 border-t border-slate-100 dark:border-white/5 space-y-0.5 text-[11px]">
                <div class="flex justify-between text-slate-500">
                    <span>Tertahan:</span>
                    <span class="font-mono font-semibold text-indigo-600 dark:text-indigo-400">Rp {{ number_format($recap['buckets']['DISPUTE']['held_rp'] ?? 0, 0, ',', '.') }}</span>
                </div>
                <div class="flex justify-between text-slate-400 text-[10px]">
                    <span>Forum:</span>
                    <span class="font-mono">TKMKB Berjenjang</span>
                </div>
            </div>
        </div>

        <!-- Card 4: Tidak Layak Fraud -->
        <div class="p-4 rounded-2xl bg-white dark:bg-health-card border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase font-mono">Tidak Layak (Fraud)</span>
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            </div>
            <div class="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {{ $recap['buckets']['TIDAK_LAYAK']['count'] ?? 3 }} <span class="text-xs font-normal text-slate-500">berkas</span>
            </div>
            <div class="pt-2 border-t border-slate-100 dark:border-white/5 space-y-0.5 text-[11px]">
                <div class="flex justify-between text-slate-500">
                    <span>Tertahan:</span>
                    <span class="font-mono font-semibold text-rose-600 dark:text-rose-400">Rp {{ number_format($recap['buckets']['TIDAK_LAYAK']['held_rp'] ?? 72450000, 0, ',', '.') }}</span>
                </div>
                <div class="flex justify-between text-slate-400 text-[10px]">
                    <span>Tindak Lanjut:</span>
                    <span class="font-mono">SP-1 Wasrik PK-JKN</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Consolidation Table: RJTL vs RITL -->
    <div class="bg-white dark:bg-health-card rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                Tabel Konsolidasi Berita Acara Hasil Verifikasi (RJTL vs RITL)
            </h2>
            <span class="text-[10px] font-mono text-slate-400">Format Resmi Standar BPJS Kesehatan</span>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse table-fixed">
                <thead>
                    <tr class="bg-slate-50 dark:bg-white/5 text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                        <th class="py-3 px-4 w-44">Status Verifikasi</th>
                        <th class="py-3 px-3 text-center w-16">RJTL Kasus</th>
                        <th class="py-3 px-3 text-right w-28">RJTL Tagih</th>
                        <th class="py-3 px-3 text-right w-28">RJTL Disetujui</th>
                        <th class="py-3 px-3 text-center w-16">RITL Kasus</th>
                        <th class="py-3 px-3 text-right w-28">RITL Tagih</th>
                        <th class="py-3 px-3 text-right w-28">RITL Disetujui</th>
                        <th class="py-3 px-3 text-center w-20">Total Kasus</th>
                        <th class="py-3 px-4 text-right w-32">Total Disetujui</th>
                        <th class="py-3 px-4 text-right w-32">Total Selisih/Tahan</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
                    @php
                        $sb = $recap['service_breakdown'] ?? [];
                        $categories = [
                            'LAYAK' => ['name' => 'I. Klaim Layak Bayar (Disetujui)', 'badge' => 'text-emerald-700 dark:text-emerald-400 font-semibold'],
                            'PENDING' => ['name' => 'II. Klaim Pending / Klarifikasi', 'badge' => 'text-amber-700 dark:text-amber-400 font-semibold'],
                            'DISPUTE' => ['name' => 'III. Klaim Dispute Medis/Koding', 'badge' => 'text-indigo-700 dark:text-indigo-400 font-semibold'],
                            'TIDAK_LAYAK' => ['name' => 'IV. Klaim Tidak Layak / Fraud', 'badge' => 'text-rose-700 dark:text-rose-400 font-semibold'],
                        ];

                        $totRjtlKasus = 0; $totRjtlTagih = 0; $totRjtlApp = 0;
                        $totRitlKasus = 0; $totRitlTagih = 0; $totRitlApp = 0;
                        $totAllKasus = 0; $totAllApp = 0; $totAllHeld = 0;
                    @endphp

                    @foreach($categories as $catKey => $catMeta)
                        @php
                            $r = $sb[$catKey]['RJTL'] ?? ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0];
                            $i = $sb[$catKey]['RITL'] ?? ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0];
                            $t = $sb[$catKey]['TOTAL'] ?? ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0];

                            $totRjtlKasus += $r['kasus']; $totRjtlTagih += $r['biaya_tagih_rp']; $totRjtlApp += $r['biaya_disetujui_rp'];
                            $totRitlKasus += $i['kasus']; $totRitlTagih += $i['biaya_tagih_rp']; $totRitlApp += $i['biaya_disetujui_rp'];
                            $totAllKasus += $t['kasus']; $totAllApp += $t['biaya_disetujui_rp']; $totAllHeld += $t['selisih_rp'];
                        @endphp
                        <tr class="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                            <td class="py-3 px-4 font-sans text-xs {{ $catMeta['badge'] }} truncate">
                                {{ $catMeta['name'] }}
                            </td>
                            <td class="py-3 px-3 text-center">{{ $r['kasus'] }}</td>
                            <td class="py-3 px-3 text-right">Rp {{ number_format($r['biaya_tagih_rp'], 0, ',', '.') }}</td>
                            <td class="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">Rp {{ number_format($r['biaya_disetujui_rp'], 0, ',', '.') }}</td>
                            <td class="py-3 px-3 text-center">{{ $i['kasus'] }}</td>
                            <td class="py-3 px-3 text-right">Rp {{ number_format($i['biaya_tagih_rp'], 0, ',', '.') }}</td>
                            <td class="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">Rp {{ number_format($i['biaya_disetujui_rp'], 0, ',', '.') }}</td>
                            <td class="py-3 px-3 text-center font-bold">{{ $t['kasus'] }}</td>
                            <td class="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">Rp {{ number_format($t['biaya_disetujui_rp'], 0, ',', '.') }}</td>
                            <td class="py-3 px-4 text-right font-bold {{ $t['selisih_rp'] > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400' }}">
                                Rp {{ number_format($t['selisih_rp'], 0, ',', '.') }}
                            </td>
                        </tr>
                    @endforeach

                    <!-- Totals Row -->
                    <tr class="bg-slate-100 dark:bg-white/10 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-white/20">
                        <td class="py-3 px-4 font-sans text-xs">Total Konsolidasi FPK</td>
                        <td class="py-3 px-3 text-center">{{ $totRjtlKasus }}</td>
                        <td class="py-3 px-3 text-right">Rp {{ number_format($totRjtlTagih, 0, ',', '.') }}</td>
                        <td class="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">Rp {{ number_format($totRjtlApp, 0, ',', '.') }}</td>
                        <td class="py-3 px-3 text-center">{{ $totRitlKasus }}</td>
                        <td class="py-3 px-3 text-right">Rp {{ number_format($totRitlTagih, 0, ',', '.') }}</td>
                        <td class="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">Rp {{ number_format($totRitlApp, 0, ',', '.') }}</td>
                        <td class="py-3 px-3 text-center">{{ $totAllKasus }}</td>
                        <td class="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">Rp {{ number_format($totAllApp, 0, ',', '.') }}</td>
                        <td class="py-3 px-4 text-right text-rose-600 dark:text-rose-400">Rp {{ number_format($totAllHeld, 0, ',', '.') }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
