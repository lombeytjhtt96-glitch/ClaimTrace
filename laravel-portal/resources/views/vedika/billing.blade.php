@extends('layouts.app')

@section('title', 'Rekonsiliasi Billing Rumah Sakit vs INA-CBG - ' . $id)

@section('content')
<div class="py-6 space-y-6 max-w-6xl mx-auto">
    <!-- Header & Breadcrumbs -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
            <div class="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <a href="{{ route('vedika.queue') }}" class="hover:text-bpjs-green transition-colors">VEDIKA Antrean</a>
                <span>/</span>
                <a href="{{ route('vedika.claims.dossier', $id) }}" class="hover:text-bpjs-green transition-colors">{{ $id }}</a>
                <span>/</span>
                <span class="text-slate-800 dark:text-slate-200 font-semibold">Rekonsiliasi Billing</span>
            </div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-white mt-1">
                Rekonsiliasi Billing Riil Rumah Sakit vs Tarif Paket INA-CBG
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">
                Audit komparasi Formulir FKL47 (Pengajuan RS) terhadap Formulir FKL48 (Hasil Verifikasi BPJS) & Special CMG
            </p>
        </div>

        <div class="flex items-center gap-2">
            <a href="{{ route('vedika.claims.dossier', $id) }}" class="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-bpjs-green transition-colors">
                Kembali ke Dossier
            </a>
        </div>
    </div>

    <!-- Discrepancy Alert Banner (If flagged, e.g. CLM-2026-8802) -->
    @if(!empty($billing['discrepancy_flag']) || $id === 'CLM-2026-8802')
        <div class="p-4 rounded-xl border border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 space-y-1.5 shadow-sm">
            <div class="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <span>Peringatan Diskrepansi Tarif Melebihi Ambang Batas Toleransi</span>
            </div>
            <p class="text-xs">
                Terdeteksi selisih signifikan antara tarif pengajuan rumah sakit FKL47 dan hasil adjudikasi formulir FKL48. Verifikator wajib memeriksa rincian tindakan dan justifikasi medis sebelum persetujuan akhir.
            </p>
            <div class="text-[11px] font-mono text-amber-800 dark:text-amber-300">
                Selisih Diskrepansi Koreksi: Rp {{ number_format($billing['selisih_koreksi_rp'] ?? 18500000, 0, ',', '.') }}
            </div>
        </div>
    @endif

    <!-- Reconciliation KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- FKL47 Submitted -->
        <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm space-y-1">
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">FKL47 Diajukan Faskes</span>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">Pengajuan</span>
            </div>
            <div class="text-xl font-bold font-mono text-slate-900 dark:text-white">
                Rp {{ number_format($billing['fkl47_submitted_rp'] ?? 5200000, 0, ',', '.') }}
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
                Kode CBG: <span class="font-mono font-semibold">{{ $billing['kode_cbg_diajukan'] ?? 'C-4-13-I' }}</span>
            </p>
        </div>

        <!-- FKL48 Verified -->
        <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm space-y-1">
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">FKL48 Hasil Verifikasi</span>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                    Disetujui
                </span>
            </div>
            <div class="text-xl font-bold font-mono text-bpjs-darkgreen dark:text-emerald-400">
                Rp {{ number_format($billing['fkl48_verified_rp'] ?? 5200000, 0, ',', '.') }}
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
                Status: <span class="font-semibold text-emerald-600 dark:text-emerald-400">Tarif Disetujui BPJS</span>
            </p>
        </div>

        <!-- Hospital Actual Real Bill -->
        <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm space-y-1">
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Billing Riil RS Itemized</span>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">SIMRS</span>
            </div>
            <div class="text-xl font-bold font-mono text-slate-800 dark:text-slate-200">
                Rp {{ number_format($billing['total_billing_rs_rp'] ?? 5150000, 0, ',', '.') }}
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
                Total Akumulasi Rincian Biaya Rumah Sakit
            </p>
        </div>
    </div>

    <!-- Special CMG & Top-Up Card -->
    <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Komponen Tambahan Special CMG & Top-Up Tarif
            </h3>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Top-Up Resmi Permenkes
            </span>
        </div>
        <div class="space-y-2">
            @forelse($billing['special_cmg_applied'] ?? [] as $cmg)
                <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-health-dark/60 text-xs">
                    <span class="font-medium text-slate-800 dark:text-slate-200">{{ $cmg }}</span>
                    <span class="font-mono text-[11px] font-semibold text-bpjs-darkgreen dark:text-emerald-400">Terverifikasi CMG</span>
                </div>
            @empty
                <p class="text-xs text-slate-400 italic">Tidak ada Special CMG atau Top-Up tarif tambahan pada klaim ini.</p>
            @endforelse
        </div>
    </div>

    <!-- Itemized Hospital Bill Table -->
    <div class="border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-health-card overflow-hidden shadow-sm">
        <div class="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Rincian Biaya Rumah Sakit (Itemized Hospital Bill)
            </h3>
            <span class="text-xs font-mono text-slate-500 dark:text-slate-400">
                Formulir Rincian Biaya Riil Pasien
            </span>
        </div>

        <div class="table-fixed-wrap overflow-x-auto">
            <table class="w-full min-w-full table-fixed text-left text-xs border-collapse">
                <thead class="bg-slate-50 dark:bg-health-dark/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-mono border-b border-slate-200 dark:border-white/5">
                    <tr>
                        <th class="w-14 px-4 py-3 text-center">No</th>
                        <th class="w-auto px-4 py-3">Kategori Komponen Pelayanan</th>
                        <th class="w-48 px-4 py-3 text-right">Nominal Subtotal (Rp)</th>
                        <th class="w-36 px-4 py-3 text-center">Status Verifikasi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-white/5">
                    @php $subtotalAccum = 0; @endphp
                    @forelse($billing['itemized_hospital_bill'] ?? [] as $idx => $item)
                        @php $subtotalAccum += ($item['nominal_rp'] ?? 0); @endphp
                        <tr class="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                            <td class="px-4 py-3 font-mono text-slate-400 text-center">{{ $idx + 1 }}</td>
                            <td class="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 truncate" title="{{ $item['kategori'] ?? '-' }}">
                                {{ $item['kategori'] ?? '-' }}
                            </td>
                            <td class="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                                Rp {{ number_format($item['nominal_rp'] ?? 0, 0, ',', '.') }}
                            </td>
                            <td class="px-4 py-3 text-center">
                                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    Disetujui
                                </span>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="4" class="px-4 py-6 text-center text-slate-400">
                                Data rincian billing itemized tidak tersedia.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
                <tfoot class="bg-slate-50/90 dark:bg-health-dark/90 font-bold border-t-2 border-slate-300 dark:border-white/10 text-xs">
                    <tr>
                        <td colspan="2" class="px-4 py-3 text-right uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Total Billing Riil Rumah Sakit (Subtotal Akumulasi):
                        </td>
                        <td class="px-4 py-3 text-right font-mono text-sm text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                            Rp {{ number_format($billing['total_billing_rs_rp'] ?? 5150000, 0, ',', '.') }}
                        </td>
                        <td class="px-4 py-3 text-center text-slate-400 font-mono text-[10px]">Lengkap</td>
                    </tr>
                    <tr>
                        <td colspan="2" class="px-4 py-3 text-right uppercase tracking-wider text-bpjs-darkgreen dark:text-emerald-400">
                            Total Tarif INA-CBG Paket Disetujui (FKL48 Grand Total):
                        </td>
                        <td class="px-4 py-3 text-right font-mono text-sm text-bpjs-darkgreen dark:text-emerald-400 tabular-nums whitespace-nowrap">
                            Rp {{ number_format($billing['fkl48_verified_rp'] ?? 5200000, 0, ',', '.') }}
                        </td>
                        <td class="px-4 py-3 text-center">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                Disetujui
                            </span>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</div>
@endsection
