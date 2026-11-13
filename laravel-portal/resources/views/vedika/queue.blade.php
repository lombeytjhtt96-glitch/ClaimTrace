@extends('layouts.app')

@section('title', 'VEDIKA Antrean FPK & Plotting')

@section('content')
<div
    x-data="{
        showTarikModal: false,
        showPlotModal: false,
        selectedClaims: ['CLM-2026-8801', 'CLM-2026-8802'],
        toggleClaim(id) {
            if (this.selectedClaims.includes(id)) {
                this.selectedClaims = this.selectedClaims.filter(c => c !== id);
            } else {
                this.selectedClaims.push(id);
            }
        },
        toggleAll(ids) {
            if (this.selectedClaims.length === ids.length) {
                this.selectedClaims = [];
            } else {
                this.selectedClaims = [...ids];
            }
        }
    }"
    class="space-y-6 min-w-0 overflow-x-hidden vedika-queue"
    data-testid="queue-container"
>
    <!-- Top Action Bar & Summary Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
            <div class="flex items-center gap-2">
                <span class="text-xs font-bold tracking-wider uppercase text-bpjs-green dark:text-emerald-400 font-mono">Modul VEDIKA v2.4</span>
                <span class="text-slate-500 dark:text-slate-400">&bull;</span>
                <span class="text-xs text-slate-500 dark:text-slate-400">Verifikasi Digital Klaim BPJS Kesehatan</span>
            </div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">Antrean Berkas FPK & Penugasan Verifikator</h1>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-2.5">
            <!-- Tarik Data FPK Modal Trigger -->
            <button
                type="button"
                @click="showTarikModal = true"
                data-testid="btn-tarik-fpk"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-bpjs-green text-white hover:bg-bpjs-darkgreen transition-all shadow-sm shadow-bpjs-green/20 flex items-center gap-2"
            >
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                <span>Tarik Data FPK (VClaim)</span>
            </button>

            <!-- Batch Plotting Modal Trigger -->
            <button
                type="button"
                @click="showPlotModal = true"
                data-testid="btn-batch-plotting"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-health-cardHover transition-all shadow-sm flex items-center gap-2"
            >
                <svg class="w-4 h-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <span>Batch Plotting Verifikator</span>
                <span
                    x-show="selectedClaims.length > 0"
                    x-text="selectedClaims.length"
                    class="px-1.5 py-0.2 rounded-full bg-bpjs-green text-white font-mono text-[10px]"
                ></span>
            </button>

            <!-- Workload Page Link -->
            <a
                href="{{ url('/vedika/workload') }}"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20 transition-all flex items-center gap-2"
            >
                <svg class="w-4 h-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <span>Monitor Beban Kerja</span>
            </a>
        </div>
    </div>

    <!-- Verifier Workload Chips Strip -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        @foreach($workload['verifiers'] ?? [] as $v)
            @php
                $assignedCount = (int) ($v['assigned_claims_count'] ?? $v['assigned_total'] ?? $v['open_count'] ?? 0);
            @endphp
            <div class="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm flex items-center justify-between gap-3">
                <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full {{ $assignedCount > 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600' }}"></span>
                        <h4 class="text-xs font-bold text-slate-900 dark:text-white truncate">{{ $v['name'] }}</h4>
                    </div>
                    <div class="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        NIP: {{ $v['nip'] }}
                    </div>
                </div>
                <div class="text-right shrink-0">
                    <span class="text-xs font-mono font-bold text-slate-900 dark:text-white">{{ $assignedCount }}</span>
                    <span class="text-[10px] text-slate-500 dark:text-slate-400 block">Klaim Aktif</span>
                </div>
            </div>
        @endforeach
    </div>

    <!-- Filter and Search Toolbar -->
    <form method="GET" action="{{ url('/vedika/queue') }}" class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <!-- Search Query Input -->
            <div>
                <label for="search" class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Pencarian Faskes / DPJP / CBG</label>
                <div class="relative">
                    <input
                        type="text"
                        id="search"
                        name="search"
                        value="{{ request('search') }}"
                        placeholder="Contoh: Cipto, Bambang, C-4..."
                        class="w-full text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark px-3 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-bpjs-green"
                    >
                </div>
            </div>

            <!-- Filter Jalur Triage -->
            <div>
                <label for="lane" class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Jalur Prioritas (Triage)</label>
                <select
                    id="lane"
                    name="lane"
                    class="w-full text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-bpjs-green"
                >
                    <option value="all" {{ request('lane') === 'all' || !request('lane') ? 'selected' : '' }}>Semua Jalur ({{ $totalClaims }})</option>
                    <option value="HIJAU" {{ strtoupper(request('lane') ?? '') === 'HIJAU' || request('lane') === 'green' ? 'selected' : '' }}>Hijau - Auto-Approval ({{ $countHijau }})</option>
                    <option value="KUNING" {{ strtoupper(request('lane') ?? '') === 'KUNING' || request('lane') === 'yellow' ? 'selected' : '' }}>Kuning - Klarifikasi ({{ $countKuning }})</option>
                    <option value="MERAH" {{ strtoupper(request('lane') ?? '') === 'MERAH' || request('lane') === 'red' ? 'selected' : '' }}>Merah - Audit Forensik ({{ $countMerah }})</option>
                </select>
            </div>

            <!-- Filter Jenis Pelayanan -->
            <div>
                <label for="jenis_pelayanan" class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Tingkat Layanan</label>
                <select
                    id="jenis_pelayanan"
                    name="jenis_pelayanan"
                    class="w-full text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-bpjs-green"
                >
                    <option value="ALL" {{ request('jenis_pelayanan') === 'ALL' || !request('jenis_pelayanan') ? 'selected' : '' }}>Semua Layanan (RJTL + RITL)</option>
                    <option value="RJTL" {{ request('jenis_pelayanan') === 'RJTL' ? 'selected' : '' }}>RJTL - Rawat Jalan Tingkat Lanjut</option>
                    <option value="RITL" {{ request('jenis_pelayanan') === 'RITL' ? 'selected' : '' }}>RITL - Rawat Inap Tingkat Lanjut</option>
                </select>
            </div>

            <!-- Filter Jenis Pengajuan -->
            <div>
                <label for="jenis_pengajuan" class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Jenis Pengajuan</label>
                <select
                    id="jenis_pengajuan"
                    name="jenis_pengajuan"
                    class="w-full text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-bpjs-green"
                >
                    <option value="ALL" {{ request('jenis_pengajuan') === 'ALL' || !request('jenis_pengajuan') ? 'selected' : '' }}>Semua Jenis Pengajuan</option>
                    <option value="Reguler" {{ request('jenis_pengajuan') === 'Reguler' ? 'selected' : '' }}>Reguler (Bulan Berjalan)</option>
                    <option value="Susulan" {{ request('jenis_pengajuan') === 'Susulan' ? 'selected' : '' }}>Susulan (Klaim Tertunda)</option>
                    <option value="LUPIS" {{ request('jenis_pengajuan') === 'LUPIS' ? 'selected' : '' }}>LUPIS (Pelayanan Luar Paket)</option>
                </select>
            </div>

            <!-- Filter No FPK & Submit -->
            <div>
                <label for="no_fpk" class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Nomor Berkas FPK</label>
                <div class="flex items-center gap-2">
                    <input
                        type="text"
                        id="no_fpk"
                        name="no_fpk"
                        value="{{ request('no_fpk') }}"
                        placeholder="Contoh: FPK-0114..."
                        class="w-full text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark px-3 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-bpjs-green"
                    >
                    <button
                        type="submit"
                        class="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all shrink-0"
                    >
                        Terapkan
                    </button>
                </div>
            </div>
        </div>
    </form>

    <!-- FPK Claims Table Container (Responsive with Zero Horizontal Scroll) -->
    <div class="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm overflow-hidden min-w-0 w-full">
        <div class="overflow-x-auto w-full">
            <table class="w-full table-fixed text-left border-collapse text-xs">
                <thead>
                    <tr class="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark/60 text-slate-600 dark:text-slate-300 font-semibold text-[11px] uppercase tracking-wider">
                        <th class="w-10 px-3 py-3 text-center">
                            <input
                                type="checkbox"
                                @click="toggleAll([@foreach($claims as $c)'{{ $c['id'] }}'{{ !$loop->last ? ',' : '' }}@endforeach])"
                                :checked="selectedClaims.length === {{ count($claims) }} && {{ count($claims) }} > 0"
                                class="rounded border-slate-300 text-bpjs-green focus:ring-bpjs-green"
                            >
                        </th>
                        <th class="w-40 px-3 py-3">ID Klaim & No. SEP</th>
                        <th class="w-48 px-3 py-3">Faskes & Layanan</th>
                        <th class="w-44 px-3 py-3">Peserta JKN (Zero-PHI)</th>
                        <th class="w-48 px-3 py-3">Kode INA-CBG</th>
                        <th class="w-36 px-3 py-3 text-right">Tarif FKL47 & 48</th>
                        <th class="w-28 px-3 py-3 text-center">Jalur & Skor</th>
                        <th class="w-32 px-3 py-3 text-center">SLA HK (H-10)</th>
                        <th class="w-36 px-3 py-3">Verifikator & Status</th>
                        <th class="w-24 px-3 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                    @forelse($claims as $claim)
                        @php
                            $claimId = $claim['id'] ?? $claim['claim_id'] ?? 'CLM-2026-8801';
                            $lane = strtoupper($claim['lane'] ?? $claim['triage']['lane'] ?? 'HIJAU');
                            $score = (float) ($claim['total_score'] ?? $claim['score'] ?? 0.0);
                            $slaDays = max(0, (int) ($claim['sla_working_days'] ?? 3));
                            $tarif47 = (int) ($claim['tarif_fkl47'] ?? 0);
                            $tarif48 = (int) ($claim['tarif_fkl48'] ?? $tarif47);
                            $status = $claim['status'] ?? 'MENUNGGU';

                            // SLA HK Indicator calculation per Perpres 82/2018 Pasal 76 ayat (2)
                            if ($slaDays <= 5) {
                                $slaBadgeText = $slaDays . '/10 HK Normal';
                                $slaBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
                            } elseif ($slaDays <= 9) {
                                $slaBadgeText = $slaDays . '/10 HK Peringatan SLA';
                                $slaBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-semibold';
                            } elseif ($slaDays === 10) {
                                $slaBadgeText = '10/10 HK Kritis SLA';
                                $slaBadgeClass = 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-800 font-bold';
                            } else {
                                $slaBadgeText = $slaDays . '/10 HK Terlampaui SLA';
                                $slaBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800 font-bold';
                            }
                        @endphp
                        <tr class="hover:bg-slate-50/80 dark:hover:bg-health-cardHover/60 transition-colors">
                            <!-- Checkbox -->
                            <td class="px-3 py-3 text-center">
                                <input
                                    type="checkbox"
                                    :checked="selectedClaims.includes('{{ $claimId }}')"
                                    @click="toggleClaim('{{ $claimId }}')"
                                    class="rounded border-slate-300 text-bpjs-green focus:ring-bpjs-green"
                                >
                            </td>

                            <!-- ID Klaim & SEP -->
                            <td class="px-3 py-3">
                                <span class="font-mono font-bold text-slate-900 dark:text-white block">{{ $claimId }}</span>
                                <span class="font-mono text-[10px] text-slate-500 dark:text-slate-400 block truncate" title="{{ $claim['no_sep'] ?? '' }}">
                                    {{ $claim['no_sep'] ?? 'SEP-TIDAK-TERCATAT' }}
                                </span>
                                <span class="text-[10px] font-mono text-bpjs-darkgreen dark:text-emerald-400 truncate block">
                                    {{ $claim['no_fpk'] ?? '' }}
                                </span>
                            </td>

                            <!-- Faskes & Layanan -->
                            <td class="px-3 py-3">
                                <span class="font-semibold text-slate-900 dark:text-white line-clamp-1 block" title="{{ $claim['nama_faskes'] ?? '' }}">
                                    {{ $claim['nama_faskes'] ?? 'RS Faskes Rujukan' }}
                                </span>
                                <div class="flex items-center gap-1.5 mt-1">
                                    <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                                        {{ $claim['jenis_pelayanan'] ?? 'RJTL' }}
                                    </span>
                                    <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                                        {{ $claim['jenis_pengajuan'] ?? 'Reguler' }}
                                    </span>
                                </div>
                            </td>

                            <!-- Zero-PHI Masked Peserta -->
                            <td class="px-3 py-3">
                                <span class="font-medium text-slate-900 dark:text-white block truncate">
                                    {{ $claim['patient_pseudo'] ?? 'Pasien JKN' }}
                                </span>
                                <span class="font-mono text-[10px] text-slate-500 dark:text-slate-400 block">
                                    NIK: {{ $claim['patient_nik_masked'] ?? '3171********0001' }}
                                </span>
                                <span class="font-mono text-[10px] text-slate-500 dark:text-slate-400 block">
                                    BPJS: {{ $claim['patient_card_masked'] ?? '0001********' }}
                                </span>
                            </td>

                            <!-- CBG Code & Description -->
                            <td class="px-3 py-3">
                                <span class="font-mono font-bold text-slate-800 dark:text-slate-100 block">
                                    {{ $claim['kode_cbg'] ?? 'Z-3-12-0' }}
                                </span>
                                <span class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1" title="{{ $claim['deskripsi_cbg'] ?? '' }}">
                                    {{ $claim['deskripsi_cbg'] ?? 'Pelayanan Kesehatan JKN' }}
                                </span>
                            </td>

                            <!-- Tarif FKL47 vs FKL48 -->
                            <td class="px-3 py-3 text-right font-mono">
                                <div class="text-slate-900 dark:text-white font-semibold">
                                    Rp {{ number_format($tarif47, 0, ',', '.') }}
                                </div>
                                <div class="text-[10px] text-emerald-600 dark:text-emerald-400">
                                    FKL48: Rp {{ number_format($tarif48, 0, ',', '.') }}
                                </div>
                            </td>

                            <!-- Jalur & Skor Tri-Layer -->
                            <td class="px-3 py-3 text-center">
                                @if($lane === 'MERAH')
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                                        MERAH &bull; {{ number_format($score, 1, ',', '.') }}
                                    </span>
                                @elseif($lane === 'KUNING')
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                        KUNING &bull; {{ number_format($score, 1, ',', '.') }}
                                    </span>
                                @else
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                        HIJAU &bull; {{ number_format($score, 1, ',', '.') }}
                                    </span>
                                @endif
                            </td>

                            <!-- SLA HK Badge (H-10 Perpres 82/2018) -->
                            <td class="px-3 py-3 text-center">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] border {{ $slaBadgeClass }}">
                                    {{ $slaBadgeText }}
                                </span>
                            </td>

                            <!-- Verifikator & Status -->
                            <td class="px-3 py-3">
                                <span class="font-medium text-slate-800 dark:text-slate-200 block truncate" title="{{ $claim['assigned_verifier_name'] ?? 'Belum Ditugaskan' }}">
                                    {{ $claim['assigned_verifier_name'] ?? 'Belum Ditugaskan' }}
                                </span>
                                <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                                    {{ $claim['assigned_verifier_nip'] ?? '-' }}
                                </span>
                                <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 inline-block mt-0.5">
                                    {{ $status }}
                                </span>
                            </td>

                            <!-- Aksi -->
                            <td class="px-3 py-3 text-center">
                                <a
                                    href="{{ url('/vedika/claims/' . $claimId . '/dossier') }}"
                                    class="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-bpjs-green/10 text-bpjs-darkgreen hover:bg-bpjs-green hover:text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white transition-all shadow-sm"
                                >
                                    Bedah
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="10" class="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                <p class="text-sm font-semibold">Tidak ada berkas klaim yang cocok dengan kriteria filter.</p>
                                <p class="text-xs mt-1">Coba sesuaikan kata kunci pencarian atau gunakan tombol Tarik Data FPK.</p>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <!-- MODAL 1: Tarik Data FPK (VClaim BPJS) -->
    <div
        x-show="showTarikModal"
        id="modal-tarik-fpk"
        data-testid="modal-tarik-fpk"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        style="display: none;"
    >
        <div
            @click.away="showTarikModal = false"
            class="w-full max-w-lg rounded-2xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-4"
        >
            <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-bpjs-green/10 text-bpjs-darkgreen dark:bg-emerald-500/20 dark:text-emerald-300 flex items-center justify-center font-bold">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Tarik Data FPK dari VClaim BPJS</h3>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400">Integrasi Web Service VClaim BPJS Kesehatan untuk penarikan batch klaim.</p>
                    </div>
                </div>
                <button
                    type="button"
                    @click="showTarikModal = false"
                    data-testid="close-modal"
                    class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>

            <form method="POST" action="{{ url('/vedika/fpk-pull') }}" class="space-y-3.5">
                @csrf
                <div>
                    <label for="modal_no_fpk" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nomor Berkas FPK</label>
                    <input
                        type="text"
                        id="modal_no_fpk"
                        name="no_fpk"
                        required
                        value="FPK-0114-202611-099"
                        class="w-full text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark px-3 py-2 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-bpjs-green"
                    >
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label for="modal_bulan_pelayanan" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bulan Pelayanan (YYYY-MM)</label>
                        <input
                            type="text"
                            id="modal_bulan_pelayanan"
                            name="bulan_pelayanan"
                            required
                            pattern="\d{4}-(0[1-9]|1[0-2])"
                            value="2026-11"
                            class="w-full text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark px-3 py-2 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-bpjs-green"
                        >
                    </div>
                    <div>
                        <label for="modal_jumlah_klaim" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jumlah Berkas Klaim</label>
                        <input
                            type="number"
                            id="modal_jumlah_klaim"
                            name="jumlah_klaim"
                            required
                            min="1"
                            max="500"
                            value="5"
                            class="w-full text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark px-3 py-2 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-bpjs-green"
                        >
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label for="modal_jenis_pengajuan" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jenis Pengajuan</label>
                        <select
                            id="modal_jenis_pengajuan"
                            name="jenis_pengajuan"
                            class="w-full text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark px-3 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-bpjs-green"
                        >
                            <option value="Reguler">Reguler</option>
                            <option value="Susulan">Susulan</option>
                            <option value="LUPIS">LUPIS</option>
                        </select>
                    </div>
                    <div>
                        <label for="modal_jenis_pelayanan" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tingkat Layanan</label>
                        <select
                            id="modal_jenis_pelayanan"
                            name="jenis_pelayanan"
                            class="w-full text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark px-3 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-bpjs-green"
                        >
                            <option value="ALL">Semua Layanan</option>
                            <option value="RJTL">RJTL</option>
                            <option value="RITL">RITL</option>
                        </select>
                    </div>
                </div>

                <div class="p-3 rounded-lg bg-slate-50 dark:bg-health-dark/60 border border-slate-100 dark:border-white/5">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="auto_plot"
                            value="1"
                            checked
                            class="rounded border-slate-300 text-bpjs-green focus:ring-bpjs-green"
                        >
                        <span class="text-xs text-slate-700 dark:text-slate-300 font-medium">Otomatis plot berkas ke verifikator medis secara merata (Round-Robin)</span>
                    </label>
                </div>

                <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                    <button
                        type="button"
                        @click="showTarikModal = false"
                        data-testid="close-modal"
                        class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        class="px-4 py-2 rounded-xl text-xs font-semibold bg-bpjs-green text-white hover:bg-bpjs-darkgreen transition-all shadow-sm"
                    >
                        Tarik Berkas VClaim
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- MODAL 2: Batch Plotting Verifikator -->
    <div
        x-show="showPlotModal"
        id="modal-batch-plotting"
        data-testid="modal-batch-plotting"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        style="display: none;"
    >
        <div
            @click.away="showPlotModal = false"
            class="w-full max-w-lg rounded-2xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-4"
        >
            <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-bpjs-green/10 text-bpjs-darkgreen dark:bg-emerald-500/20 dark:text-emerald-300 flex items-center justify-center font-bold">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Batch Plotting Berkas Klaim</h3>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400">Penugasan berkas klaim terpilih ke verifikator berwenang.</p>
                    </div>
                </div>
                <button
                    type="button"
                    @click="showPlotModal = false"
                    data-testid="close-modal"
                    class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>

            <form method="POST" action="{{ url('/vedika/plotting') }}" class="space-y-3.5">
                @csrf
                <!-- Selected Claims Overview -->
                <div>
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Berkas Terpilih (<span x-text="selectedClaims.length"></span> Klaim)
                    </label>
                    <div class="p-3 rounded-lg bg-slate-50 dark:bg-health-dark/60 border border-slate-200 dark:border-white/10 max-h-28 overflow-y-auto font-mono text-[11px]">
                        <template x-for="cid in selectedClaims" :key="cid">
                            <span class="inline-block px-2 py-0.5 rounded bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 mr-1 mb-1">
                                <span x-text="cid"></span>
                                <input type="hidden" name="claim_ids[]" :value="cid">
                            </span>
                        </template>
                        <span x-show="selectedClaims.length === 0" class="text-slate-400 font-sans text-xs">
                            Belum ada klaim terpilih. Silakan centang kotak pada tabel antrean.
                        </span>
                    </div>
                </div>

                <!-- Select Verifikator -->
                <div>
                    <label for="verifier_nip" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tugaskan ke Verifikator Terdaftar</label>
                    <select
                        id="verifier_nip"
                        name="verifier_nip"
                        required
                        class="w-full text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark px-3 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-bpjs-green font-sans"
                    >
                        @foreach($verifiers as $nip => $v)
                            <option value="{{ $nip }}" {{ $nip === '198704202011012001' ? 'selected' : '' }}>
                                {{ $v['name'] ?? 'Verifikator' }} (NIP: {{ $nip }}) - {{ is_array($v['allowedRoles'] ?? null) ? implode(', ', $v['allowedRoles']) : ($v['role'] ?? 'Verifikator') }}
                            </option>
                        @endforeach
                    </select>
                </div>

                <!-- Notes Textarea -->
                <div>
                    <label for="catatan" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Catatan Penugasan (Opsional)</label>
                    <textarea
                        id="catatan"
                        name="catatan"
                        rows="2"
                        placeholder="Contoh: Prioritas telaah koding severity III dan telaah SIP..."
                        class="w-full text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-bpjs-green"
                    ></textarea>
                </div>

                <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                    <button
                        type="button"
                        @click="showPlotModal = false"
                        data-testid="close-modal"
                        class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        :disabled="selectedClaims.length === 0"
                        class="px-4 py-2 rounded-xl text-xs font-semibold bg-bpjs-green text-white hover:bg-bpjs-darkgreen transition-all shadow-sm disabled:opacity-50"
                    >
                        Konfirmasi Penugasan
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
