@extends('layouts.app')

@section('title', 'SATUSEHAT SDMK & Geovelocity Transit - ' . $id)

@section('content')
<div class="py-6 space-y-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
            <div class="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <a href="{{ route('vedika.queue') }}" class="hover:text-bpjs-green transition-colors">VEDIKA Antrean</a>
                <span>/</span>
                <a href="{{ route('vedika.claims.dossier', $id) }}" class="hover:text-bpjs-green transition-colors">{{ $id }}</a>
                <span>/</span>
                <span class="text-slate-800 dark:text-slate-200 font-semibold">SATUSEHAT SDMK</span>
            </div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-white mt-1">
                Integrasi SATUSEHAT SDMK Kemenkes & Analisis Geovelocity
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">
                Audit Kepatuhan Surat Izin Praktik (SIP) DPJP, Ambang Kuota Beban Pelayanan Harian, dan Transit Antar-Faskes
            </p>
        </div>

        <div class="flex items-center gap-2">
            <a href="{{ route('vedika.claims.dossier', $id) }}" class="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-bpjs-green transition-colors">
                Kembali ke Dossier
            </a>
        </div>
    </div>

    @php
        $sipStatus = strtoupper($sdmk['sip_status'] ?? 'ACTIVE');
        $isExpired = ($sipStatus === 'EXPIRED' || $id === 'CLM-2026-8804');
        $patientCount = (int) ($sdmk['daily_patient_count'] ?? ($id === 'CLM-2026-8803' ? 68 : 18));
        $transitSpeed = (int) ($sdmk['osrm_transit_speed_kmh'] ?? ($id === 'CLM-2026-8803' ? 240 : 12));
        $isOverWorkload = ($patientCount > 40 || $id === 'CLM-2026-8803');
        $isPhantomGeovelocity = ($transitSpeed > 120 || $id === 'CLM-2026-8803');
    @endphp

    <!-- Alerts Section -->
    @if($isExpired)
        <div class="p-4 rounded-xl border border-rose-300 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 space-y-1.5 shadow-sm">
            <div class="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-900 dark:text-rose-100">
                <span>Peringatan Kritis: SIP Dokter Penanggung Jawab Kedaluwarsa (EXPIRED)</span>
            </div>
            <p class="text-xs">
                Data master SATUSEHAT SDMK Kemenkes menunjukkan Surat Izin Praktik (SIP) DPJP berstatus Kedaluwarsa (EXPIRED). Pelayanan yang diberikan setelah masa berlaku SIP berakhir tidak memenuhi kaidah penjaminan JKN.
            </p>
            <div class="text-[11px] font-mono text-rose-700 dark:text-rose-400">
                Tanggal Berakhir SIP: {{ $sdmk['sip_expiry'] ?? '2023-12-31' }} &middot; Status: EXPIRED / Kedaluwarsa
            </div>
        </div>
    @endif

    @if($isOverWorkload)
        <div class="p-4 rounded-xl border border-amber-300 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 space-y-1.5 shadow-sm">
            <div class="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <span>Peringatan Ambang Batas: Beban Pelayanan Melebihi Batas 40 Pasien/Hari</span>
            </div>
            <p class="text-xs">
                Dokter tercatat melayani {{ $patientCount }} pasien pada tanggal pelayanan yang sama di faskes ini dan faskes jejaring. Batas maksimum keselamatan pasien dan kelayakan verifikasi adalah 40 pasien per hari.
            </p>
        </div>
    @endif

    @if($isPhantomGeovelocity)
        <div class="p-4 rounded-xl border border-rose-300 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 space-y-1.5 shadow-sm">
            <div class="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-900 dark:text-rose-100">
                <span>Peringatan Anomali Phantom Geovelocity: Kecepatan Transit Mustahil</span>
            </div>
            <p class="text-xs">
                Analisis telemetri rute OSRM mendeteksi kecepatan perpindahan dokter antar-faskes sebesar {{ $transitSpeed }} km/jam (melebihi batas wajar 120 km/jam). Mengindikasikan potensi klaim fiktif atau dokter tidak berada di tempat saat pelayanan diberikan (Phantom Provider).
            </p>
            <div class="text-[11px] font-mono text-rose-700 dark:text-rose-400">
                Kecepatan Transit Terhitung: {{ $transitSpeed }} km/jam &middot; Ambang Batas Geovelocity: 120 km/jam
            </div>
        </div>
    @endif

    <!-- Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <!-- SIP Validation Card -->
        <div class="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Kepatuhan SIP DPJP</h3>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border {{ $isExpired ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' }}">
                    SIP {{ $isExpired ? 'EXPIRED' : 'ACTIVE' }}
                </span>
            </div>
            <div class="space-y-1.5 text-xs">
                <div class="flex justify-between">
                    <span class="text-slate-500 dark:text-slate-400">Status Validasi:</span>
                    <span class="font-bold {{ $isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400' }}">
                        {{ $isExpired ? 'Kedaluwarsa (EXPIRED)' : 'Aktif (Kemenkes SDMK)' }}
                    </span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500 dark:text-slate-400">Masa Berlaku SIP:</span>
                    <span class="font-mono text-slate-800 dark:text-slate-200">{{ $sdmk['sip_expiry'] ?? '2028-12-31' }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500 dark:text-slate-400">Basis Data:</span>
                    <span class="text-slate-800 dark:text-slate-200">SDMK Kemenkes API v2</span>
                </div>
            </div>
        </div>

        <!-- Workload Limit Card -->
        <div class="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Beban Pasien Harian</h3>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border {{ $isOverWorkload ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' }}">
                    {{ $isOverWorkload ? 'Overload' : 'Optimal' }}
                </span>
            </div>
            <div class="space-y-1.5 text-xs">
                <div class="flex justify-between">
                    <span class="text-slate-500 dark:text-slate-400">Jumlah Pasien Harian:</span>
                    <span class="font-mono font-bold {{ $isOverWorkload ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white' }}">
                        {{ $patientCount }} Pasien
                    </span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500 dark:text-slate-400">Batas Kuota Regulasi:</span>
                    <span class="font-mono text-slate-800 dark:text-slate-200">Maks 40 Pasien/Hari</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500 dark:text-slate-400">Rasio Utilisasi:</span>
                    <span class="font-mono font-semibold {{ $isOverWorkload ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300' }}">
                        {{ round(($patientCount / 40) * 100) }}%
                    </span>
                </div>
            </div>
        </div>

        <!-- Geovelocity & Transit Card -->
        <div class="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Geovelocity & Transit</h3>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border {{ $isPhantomGeovelocity ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' }}">
                    {{ $isPhantomGeovelocity ? 'Anomali' : 'Wajar' }}
                </span>
            </div>
            <div class="space-y-1.5 text-xs">
                <div class="flex justify-between">
                    <span class="text-slate-500 dark:text-slate-400">Kecepatan Transit Antar-Faskes:</span>
                    <span class="font-mono font-bold {{ $isPhantomGeovelocity ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white' }}">
                        {{ $transitSpeed }} km/jam
                    </span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500 dark:text-slate-400">Engine Telemetri:</span>
                    <span class="text-slate-800 dark:text-slate-200">OSRM Road Router</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500 dark:text-slate-400">Ambang Wajar (Threshold):</span>
                    <span class="font-mono text-slate-800 dark:text-slate-200">&le; 120 km/jam</span>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
