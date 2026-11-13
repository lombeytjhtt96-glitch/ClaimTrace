@extends('layouts.app')

@section('title', 'Cockpit Eksekutif & Corong Penapisan Anomali')

@section('content')
<div class="space-y-6">

    <!-- =========================================================================
         SECTION 1: HEADER STRIP, LIVE STATUS & ACTION BUTTONS
         ========================================================================= -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
            <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-bpjs-green/10 text-bpjs-darkgreen dark:bg-emerald-500/20 dark:text-emerald-300 border border-bpjs-green/20">
                    Sistem Produksi VEDIKA BPJS
                </span>
                <span class="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Gudang Data Nasional · 1,7 Juta Klaim FKRTL
                </span>
            </div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                Cockpit Eksekutif &amp; Corong Penapisan Anomali
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pemantauan pra-bayar Dana Jaminan Sosial (DJS) berbasis DuckDB OLAP SIMD, penapisan 3 lapis, dan penegakan SLA 10 Hari Kerja (Perpres 82/2018).
            </p>
        </div>

        <!-- Connection Status & Quick Action Buttons -->
        <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <!-- Connection Status Pill -->
            @if(isset($connectionStatus['connected']) && $connectionStatus['connected'])
                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 shadow-sm" data-testid="connection-pill-live">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>FASTAPI: Terhubung ({{ $connectionStatus['latency_ms'] ?? 24 }}ms)</span>
                </div>
            @else
                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300 shadow-sm" data-testid="connection-pill-fallback">
                    <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>FASTAPI: Mode Fallback Resilien (DuckDB Cached)</span>
                </div>
            @endif

            <!-- Quick Action: Antrean FPK -->
            <a href="{{ url('/vedika') }}" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-bpjs-green hover:bg-bpjs-darkgreen text-white shadow-sm transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <span>Buka Antrean VEDIKA</span>
            </a>
        </div>
    </div>

    <!-- =========================================================================
         SECTION 2: TOP EXECUTIVE KPI GRID (4 CARDS + EXPOSURE STRIP)
         ========================================================================= -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="cockpit-kpi-grid">
        <!-- Card 1: Total Klaim FKRTL -->
        <x-kpi-card
            title="Total Klaim FKRTL"
            :value="$kpis['total_claims'] ?? '1.699.219'"
            subtitle="Agregat nasional terindeks DuckDB"
            change="100% korpus siap audit"
            trend="up"
            badge="DUCKDB OLAP"
            colorScheme="bpjs-green"
            subtext="Sub-50ms SIMD"
        >
            <x-slot:icon>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </x-slot:icon>
        </x-kpi-card>

        <!-- Card 2: Total Portofolio Klaim -->
        <x-kpi-card
            title="Total Portofolio Klaim"
            :value="$kpis['total_portfolio_idr'] ?? 'Rp 1,536 T'"
            subtitle="Nilai pengajuan FKL47 RS (Rp 1.535.982.713.360)"
            change="Disetujui: Rp 1.534 T"
            trend="up"
            badge="FKL47 vs FKL48"
            colorScheme="bpjs-blue"
            subtext="Selisih Rp 2,07 M"
        >
            <x-slot:icon>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </x-slot:icon>
        </x-kpi-card>

        <!-- Card 3: Master Peserta Terdaftar -->
        <x-kpi-card
            title="Master Peserta Terdaftar"
            :value="$kpis['total_participants'] ?? '2.590.751'"
            subtitle="1.065.281 keluarga terintegrasi"
            change="306.710 pasien terlayani"
            trend="up"
            badge="ZERO-PHI UU PDP"
            colorScheme="cyan"
            subtext="K-Anonymity k>=5"
        >
            <x-slot:icon>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </x-slot:icon>
        </x-kpi-card>

        <!-- Card 4: FKRTL Terhubung -->
        <x-kpi-card
            title="FKRTL Terhubung"
            :value="$kpis['total_fkrtl'] ?? '2.091'"
            subtitle="496 Kab/Kota di 38 Provinsi"
            change="Kepatuhan SLA: 99,9%"
            trend="up"
            badge="SLA 10 HK"
            colorScheme="amber"
            subtext="Pasal 76 Perpres"
        >
            <x-slot:icon>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </x-slot:icon>
        </x-kpi-card>
    </div>

    <!-- Anomaly Exposure Strip -->
    <div class="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-emerald-50 dark:from-rose-950/30 dark:via-amber-950/30 dark:to-emerald-950/30 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <div>
                <span class="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Total Eksposur Anomali Dicegah Pra-Bayar:</span>
                <span class="ml-2 font-mono font-bold text-rose-700 dark:text-rose-300 text-sm tabular-nums">{{ $kpis['total_anomaly_idr'] ?? 'Rp 34,66 M' }}</span>
                <span class="text-[10px] text-slate-500 dark:text-slate-400 font-mono ml-1">(Rp 34.663.799.076)</span>
            </div>
        </div>
        <div class="flex items-center gap-4 text-[11px] font-mono text-slate-600 dark:text-slate-300">
            <span>Klaim Ganda: <strong class="text-amber-700 dark:text-amber-300">{{ $kpis['same_day_exposure_idr'] ?? 'Rp 32,59 M' }}</strong></span>
            <span>Koreksi Tarif: <strong class="text-blue-700 dark:text-blue-300">{{ $kpis['direct_correction_idr'] ?? 'Rp 2,07 M' }}</strong></span>
        </div>
    </div>

    <!-- =========================================================================
         SECTION 3: 4-STAGE SCREENING FUNNEL (CORONG PENYARINGAN KLAIM ANOMALI)
         ========================================================================= -->
    <div class="p-5 rounded-2xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
            <div>
                <h2 class="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-wider">
                    Corong Penapisan Anomali Klaim 4-Tahap (Screening Funnel)
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Proses purifikasi bertingkat dari total 1,7M berkas masuk hingga penetapan berkas berisiko tinggi pra-bayar.
                </p>
            </div>
            <div class="flex items-center gap-2 self-start sm:self-auto">
                <a href="{{ url('/vedika/queue?lane=green') }}" class="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors">
                    Filter Hijau
                </a>
                <a href="{{ url('/vedika/queue?lane=yellow') }}" class="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors">
                    Filter Kuning
                </a>
                <a href="{{ url('/vedika/queue?lane=red') }}" class="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 hover:bg-rose-100 transition-colors">
                    Filter Merah
                </a>
            </div>
        </div>

        <!-- 4-Stage Horizontal Flow Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            @foreach($screeningFunnel as $stage)
                <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-health-dark/50 flex flex-col justify-between space-y-3 transition-all hover:border-bpjs-green/40 dark:hover:border-bpjs-green/40">
                    <div>
                        <div class="flex items-center justify-between gap-2 mb-2">
                            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded border {{ $stage['stage'] === 4 ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' }}">
                                TAHAP {{ $stage['stage'] }}
                            </span>
                            <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">
                                {{ $stage['badge'] }}
                            </span>
                        </div>
                        <h3 class="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                            {{ $stage['name'] }}
                        </h3>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {{ $stage['rule'] }}
                        </p>
                    </div>

                    <div class="pt-2 border-t border-slate-200/60 dark:border-white/5 space-y-1.5">
                        <div class="flex items-center justify-between text-xs font-mono">
                            <span class="text-slate-500 dark:text-slate-400">Volume Berkas:</span>
                            <span class="font-bold text-slate-900 dark:text-white tabular-nums">{{ $stage['volume_claims'] }}</span>
                        </div>
                        <div class="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {{ $stage['status_action'] }}
                        </div>
                    </div>
                </div>
            @endforeach
        </div>

        <!-- Funnel Progression Conversion Bar -->
        <div class="p-3 rounded-xl bg-slate-100 dark:bg-health-dark border border-slate-200 dark:border-white/10 space-y-2">
            <div class="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span>Konversi Corong Penapisan:</span>
                <span class="font-mono">Ingest 100% &rarr; Filter Rule-based 22,6% &rarr; Tri-Layer AI Fusion 4,9% &rarr; Ajudikasi 1,1%</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden flex">
                <div class="bg-bpjs-green h-full" style="width: 77.4%" title="Fast-Track Lolos Bersih (77,4%)"></div>
                <div class="bg-bpjs-blue h-full" style="width: 17.7%" title="Filter Administratif (17,7%)"></div>
                <div class="bg-amber-500 h-full" style="width: 3.8%" title="Jalur Kuning Klarifikasi (3,8%)"></div>
                <div class="bg-rose-500 h-full" style="width: 1.1%" title="Jalur Merah Ajudikasi (1,1%)"></div>
            </div>
            <div class="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-bpjs-green"></span>
                    <span>Fast-Track Lolos Bersih: 1.697.588 (99,9%)</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-bpjs-blue"></span>
                    <span>Filter Rule-based: 11.186 tersaring</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Jalur Kuning (Klarifikasi): 53.379 dievaluasi</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Jalur Merah (Ajudikasi): 18.720 berkas risiko tinggi</span>
                </div>
            </div>
        </div>
    </div>

    <!-- =========================================================================
         SECTION 4: TRI-LAYER SCORING BREAKDOWN & INTERACTIVE CALCULATOR (ALPINE.JS)
         ========================================================================= -->
    <div
        x-data="{
            s1: 45,
            s2: 30,
            s3: 20,
            hardTrigger: false,
            get rawScore() {
                const val = (parseFloat(this.s1) * 0.50) + (parseFloat(this.s2) * 0.30) + (parseFloat(this.s3) * 0.20);
                return Math.round(val * 10) / 10;
            },
            get finalScore() {
                if (this.hardTrigger) {
                    return Math.max(75.0, this.rawScore);
                }
                return this.rawScore;
            },
            get formattedScore() {
                return this.finalScore.toFixed(1).replace('.', ',');
            },
            get lane() {
                if (this.hardTrigger || this.finalScore >= 75.0) return 'MERAH';
                if (this.finalScore >= 50.0) return 'KUNING';
                return 'HIJAU';
            },
            get laneLabel() {
                if (this.hardTrigger) return 'Hard Trigger - Prioritas Investigasi';
                if (this.finalScore >= 75.0) return 'Jalur Merah - Prioritas Investigasi';
                if (this.finalScore >= 50.0) return 'Jalur Kuning - Klarifikasi Administratif';
                return 'Jalur Hijau - Wajar / Fast-Track';
            },
            get laneDescription() {
                if (this.lane === 'MERAH') return 'Tahan pencairan sementara (HOLD_BAKB), verifikasi bukti fisik, terbitkan dokumen penolakan/sengketa.';
                if (this.lane === 'KUNING') return 'Permintaan berkas penunjang/sinkronisasi ke Faskes (DPJP Unsynced tidak langsung divonis fraud).';
                return 'Lolos otomatis (Auto-clearance) langsung ke antrean pembayaran reguler VClaim.';
            },
            applyPreset(s1Val, s2Val, s3Val, htVal) {
                this.s1 = s1Val;
                this.s2 = s2Val;
                this.s3 = s3Val;
                this.hardTrigger = htVal;
            }
        }"
        class="p-5 rounded-2xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 shadow-sm space-y-5"
        data-testid="tri-layer-calculator"
    >
        <!-- Calculator Header -->
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
            <div>
                <div class="flex items-center gap-2">
                    <h2 class="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-wider">
                        Kalkulator &amp; Rincian Pembobotan Tri-Layer AI
                    </h2>
                    <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-bpjs-green/10 text-bpjs-darkgreen dark:bg-emerald-500/20 dark:text-emerald-300 border border-bpjs-green/20">
                        Skala Resmi 0 - 100
                    </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    Formula: S = 0,50 · S1 (Pola Klinis) + 0,30 · S2 (SIP &amp; Geovelocity) + 0,20 · S3 (Mobile JKN)
                </p>
            </div>

            <!-- Quick Presets -->
            <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Preset Uji:</span>
                <button
                    type="button"
                    @click="applyPreset(15, 10, 0, false)"
                    class="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                >
                    Wajar (&lt;50)
                </button>
                <button
                    type="button"
                    @click="applyPreset(70, 50, 30, false)"
                    class="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                >
                    Klarifikasi (50-74)
                </button>
                <button
                    type="button"
                    @click="applyPreset(95, 80, 90, false)"
                    class="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 hover:bg-rose-100 transition-colors"
                >
                    Phantom / Repeat (&gt;=75)
                </button>
                <button
                    type="button"
                    @click="applyPreset(30, 20, 10, true)"
                    class="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-purple-300 bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 hover:bg-purple-100 transition-colors"
                >
                    Hard Trigger SIP
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <!-- Left: 3 Sub-Score Sliders & Hard Trigger Checkbox (7 Cols) -->
            <div class="lg:col-span-7 space-y-4">
                <!-- Slider S1 -->
                <div class="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-health-dark/40 space-y-2">
                    <div class="flex items-center justify-between text-xs font-semibold">
                        <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded bg-bpjs-green/10 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-[11px]">S1</span>
                            <span class="text-slate-800 dark:text-slate-200">Lapis 1: Pola Klinis &amp; Semantik</span>
                        </div>
                        <div class="flex items-center gap-1.5 font-mono">
                            <span class="text-slate-500 dark:text-slate-400 text-[11px]">Bobot 50%</span>
                            <span class="px-2 py-0.5 rounded bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 font-bold tabular-nums text-slate-900 dark:text-white" x-text="s1"></span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        x-model="s1"
                        class="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-bpjs-green"
                    />
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">
                        Lonjakan klaster spatiotemporal (#6 Phantom &gt;= 3.0x), kemiripan resume medis (MiniLM &gt;= 90%), dan klaim ganda hari sama (#11 Repeat).
                    </p>
                </div>

                <!-- Slider S2 -->
                <div class="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-health-dark/40 space-y-2">
                    <div class="flex items-center justify-between text-xs font-semibold">
                        <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded bg-bpjs-blue/10 text-blue-800 dark:text-blue-300 flex items-center justify-center font-mono font-bold text-[11px]">S2</span>
                            <span class="text-slate-800 dark:text-slate-200">Lapis 2: Legalitas &amp; Kapasitas DPJP</span>
                        </div>
                        <div class="flex items-center gap-1.5 font-mono">
                            <span class="text-slate-500 dark:text-slate-400 text-[11px]">Bobot 30%</span>
                            <span class="px-2 py-0.5 rounded bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 font-bold tabular-nums text-slate-900 dark:text-white" x-text="s2"></span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        x-model="s2"
                        class="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-bpjs-blue"
                    />
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">
                        Audit SIP aktif vs expired pada Kemenkes SISDMK, batasan beban &gt; 40 pasien/hari, dan kecepatan jelajah OSRM &gt; 120 km/jam.
                    </p>
                </div>

                <!-- Slider S3 -->
                <div class="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-health-dark/40 space-y-2">
                    <div class="flex items-center justify-between text-xs font-semibold">
                        <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 flex items-center justify-center font-mono font-bold text-[11px]">S3</span>
                            <span class="text-slate-800 dark:text-slate-200">Lapis 3: Triangulasi Peserta (Zero-PHI)</span>
                        </div>
                        <div class="flex items-center gap-1.5 font-mono">
                            <span class="text-slate-500 dark:text-slate-400 text-[11px]">Bobot 20%</span>
                            <span class="px-2 py-0.5 rounded bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 font-bold tabular-nums text-slate-900 dark:text-white" x-text="s3"></span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        x-model="s3"
                        class="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">
                        Sinyal konfirmasi kehadiran biner Mobile JKN. Penyangkalan peserta menaikkan S3 secara tajam; absen respon netral.
                    </p>
                </div>

                <!-- Hard Trigger Toggle -->
                <label class="flex items-start gap-3 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 cursor-pointer">
                    <input
                        type="checkbox"
                        x-model="hardTrigger"
                        class="mt-0.5 rounded text-rose-600 focus:ring-rose-500 dark:bg-health-card dark:border-white/20"
                    />
                    <div class="text-xs">
                        <span class="font-bold text-rose-800 dark:text-rose-300">Aktifkan Hard Trigger: SIP DPJP Kedaluwarsa / Geovelocity Anomali</span>
                        <p class="text-[11px] text-rose-700/80 dark:text-rose-300/70 mt-0.5">
                            Jika terpicu, sistem langsung menaikkan skor total menjadi minimal 75,0 (Jalur Merah) untuk penahanan klaim pra-bayar.
                        </p>
                    </div>
                </label>
            </div>

            <!-- Right: Live Score Result & Action Determination (5 Cols) -->
            <div class="lg:col-span-5 p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-health-dark/70 space-y-4">
                <div>
                    <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Hasil Perhitungan Fusi Live
                    </span>
                    <div class="mt-2 flex items-baseline gap-3">
                        <span class="text-4xl sm:text-5xl font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight" x-text="formattedScore"></span>
                        <span class="text-xs font-mono text-slate-500 dark:text-slate-400">/ 100,0</span>
                    </div>
                </div>

                <!-- Live Lane Status Pill -->
                <div class="space-y-1.5">
                    <div class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Keputusan Jalur Triase:
                    </div>
                    <div
                        class="p-3 rounded-xl border text-xs font-semibold space-y-1"
                        :class="{
                            'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300': lane === 'HIJAU',
                            'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300': lane === 'KUNING',
                            'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300': lane === 'MERAH'
                        }"
                    >
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="{
                                'bg-emerald-500': lane === 'HIJAU',
                                'bg-amber-500': lane === 'KUNING',
                                'bg-rose-500': lane === 'MERAH'
                            }"></span>
                            <span class="font-bold" x-text="laneLabel"></span>
                        </div>
                        <p class="text-[11px] font-normal leading-relaxed opacity-90" x-text="laneDescription"></p>
                    </div>
                </div>

                <!-- Reference Lane Thresholds -->
                <div class="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2 text-[11px] font-mono">
                    <div class="font-semibold font-sans text-slate-700 dark:text-slate-300">
                        Ambang Batas Resmi Kebijakan:
                    </div>
                    <div class="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                        <span>Hijau (Fast-Track)</span>
                        <span>0,0 - 49,9</span>
                    </div>
                    <div class="flex items-center justify-between text-amber-700 dark:text-amber-400">
                        <span>Kuning (Klarifikasi RS)</span>
                        <span>50,0 - 74,9</span>
                    </div>
                    <div class="flex items-center justify-between text-rose-700 dark:text-rose-400">
                        <span>Merah (Investigasi Fraud)</span>
                        <span>75,0 - 100,0</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- =========================================================================
         SECTION 5: ANOMALY MODUS INDICATORS (4 CARDS)
         ========================================================================= -->
    <div class="space-y-3">
        <div>
            <h2 class="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-wider">
                Indikator Tipologi Anomali &amp; Modus Utama (#6, #11, SIP, Upcoding)
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pengawasan terarah pada modus kebocoran tertinggi berdasarkan analisis data historis 1,7 Juta klaim FKRTL.
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            @foreach($anomalyModusList as $modus)
                <div class="p-4 rounded-xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-white/20 transition-all">
                    <div>
                        <div class="flex items-center justify-between gap-2 mb-1.5">
                            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded border {{ $modus['scheme'] === 'rose' ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' : ($modus['scheme'] === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' : ($modus['scheme'] === 'cyan' ? 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800' : 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800')) }}">
                                {{ $modus['code'] }}
                            </span>
                        </div>
                        <h3 class="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                            {{ $modus['title'] }}
                        </h3>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                            {{ $modus['trigger'] }}
                        </p>
                    </div>

                    <div class="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1">
                        <div class="text-[11px] font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {{ $modus['exposure'] }}
                        </div>
                        <div class="text-[10.5px] text-slate-500 dark:text-slate-400">
                            {{ $modus['action'] }}
                        </div>
                    </div>
                </div>
            @endforeach
        </div>
    </div>

    <!-- =========================================================================
         SECTION 6: FORENSIC HIGH-RISK QUEUE PREVIEW TABLE (ZERO-PHI & TABLE-FIXED)
         ========================================================================= -->
    <div class="space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
                <h2 class="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-wider">
                    Pratinjau Antrean Kasus Berisiko Tinggi (Jalur Merah &amp; Kuning)
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Data tersamar penuh sesuai UU PDP No. 27/2022 (Zero-PHI) dan ditampilkan dalam format <code class="font-mono">table-fixed</code> anti-luapan horizontal.
                </p>
            </div>
            <a href="{{ url('/vedika') }}" class="text-xs font-semibold text-bpjs-green hover:underline flex items-center gap-1 self-start sm:self-auto">
                <span>Lihat Seluruh Antrean FPK</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </a>
        </div>

        <div class="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm overflow-hidden">
            <div class="table-fixed-wrap overflow-x-auto">
                <table class="table-fixed w-full min-w-full divide-y divide-slate-200 dark:divide-white/10 text-xs">
                    <thead class="bg-slate-50 dark:bg-health-cardHover/60 text-slate-600 dark:text-slate-300 font-semibold">
                        <tr>
                            <th class="w-36 px-4 py-3 text-left">No. SEP</th>
                            <th class="w-48 px-4 py-3 text-left">Fasilitas Kesehatan</th>
                            <th class="w-36 px-4 py-3 text-left">NIK Peserta (UU PDP)</th>
                            <th class="w-32 px-4 py-3 text-left">No. Kartu BPJS</th>
                            <th class="w-32 px-4 py-3 text-left">Nama Peserta</th>
                            <th class="w-28 px-4 py-3 text-left">Kode INA-CBG</th>
                            <th class="w-32 px-4 py-3 text-right">Biaya Riil RS</th>
                            <th class="w-32 px-4 py-3 text-right">Tarif FKL48</th>
                            <th class="w-32 px-4 py-3 text-center">Skor Tri-Layer</th>
                            <th class="w-40 px-4 py-3 text-left">Modus Terindikasi</th>
                            <th class="w-28 px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 dark:divide-white/5 font-mono">
                        @foreach($highRiskClaims as $claim)
                            <tr class="hover:bg-slate-50/80 dark:hover:bg-health-cardHover/40 transition-colors">
                                <td class="px-4 py-3 text-bpjs-blue font-semibold truncate">{{ $claim['no_sep'] }}</td>
                                <td class="px-4 py-3 font-sans text-slate-900 dark:text-slate-100 truncate">{{ $claim['nama_faskes'] }}</td>
                                <td class="px-4 py-3 text-slate-700 dark:text-slate-300">{{ $claim['nik_masked'] }}</td>
                                <td class="px-4 py-3 text-slate-700 dark:text-slate-300">{{ $claim['bpjs_masked'] }}</td>
                                <td class="px-4 py-3 font-sans text-slate-700 dark:text-slate-300">{{ $claim['peserta_pseudonym'] }}</td>
                                <td class="px-4 py-3 text-slate-700 dark:text-slate-300">{{ $claim['ina_cbg'] }}</td>
                                <td class="px-4 py-3 text-right text-slate-900 dark:text-slate-100 tabular-nums">{{ $claim['biaya_riil_rs'] }}</td>
                                <td class="px-4 py-3 text-right text-slate-900 dark:text-slate-100 tabular-nums">{{ $claim['tarif_fkl48'] }}</td>
                                <td class="px-4 py-3 text-center">
                                    <x-score-pill :score="$claim['score']" :hardTrigger="$claim['hard_trigger']" size="sm" />
                                </td>
                                <td class="px-4 py-3 font-sans text-slate-700 dark:text-slate-300 truncate">
                                    <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold {{ $claim['lane'] === 'MERAH' ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' }}">
                                        {{ $claim['modus'] }}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-center font-sans">
                                    <a href="{{ url('/dossier') }}" class="inline-flex items-center px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition-colors">
                                        Periksa Berkas
                                    </a>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>

</div>
@endsection
