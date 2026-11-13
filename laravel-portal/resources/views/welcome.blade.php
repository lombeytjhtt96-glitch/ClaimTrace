@extends('layouts.app')

@section('title', 'Cockpit Eksekutif & Verifikasi Klaim')

@section('content')
<div class="space-y-6">
    @if(isset($activeClaim))
        <div id="dossier-claim-scoring-summary" class="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card text-xs font-mono">
            <span class="font-bold">{{ $activeClaim['lane'] }}</span>
            <span class="ml-2">{{ $activeClaim['score'] }}</span>
            <span class="ml-2">{{ $activeClaim['score_dot'] ?? '' }}</span>
            <span class="ml-2">{{ $activeClaim['lane_label'] ?? '' }}</span>
        </div>
    @endif
    <!-- Page Header Title and Context -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
            <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-bpjs-green/10 text-bpjs-darkgreen dark:bg-emerald-500/20 dark:text-emerald-300 border border-bpjs-green/20">
                    Sistem Produksi VEDIKA
                </span>
                <span class="text-xs text-slate-500 dark:text-slate-400 font-mono">Kantor Cabang Utama Jakarta Selatan</span>
            </div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                Cockpit Eksekutif Verifikasi Klaim JKN
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pemantauan analitik anomali klaim FKRTL secara real-time berbasis mesin OLAP DuckDB dan pembelajaran mesin.
            </p>
        </div>

        <!-- Quick Status Pills -->
        <div class="flex items-center gap-2 shrink-0">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 shadow-sm">
                <svg class="w-3.5 h-3.5 text-bpjs-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Audit SHA-256 Aktif</span>
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 shadow-sm">
                <svg class="w-3.5 h-3.5 text-bpjs-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>Engine 1.7M Klaim</span>
            </span>
        </div>
    </div>

    <!-- 4 KPI Summary Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Card 1: Total Klaim -->
        <div class="p-5 rounded-2xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Klaim Terverifikasi</span>
                <div class="w-8 h-8 rounded-xl bg-bpjs-green/10 text-bpjs-green flex items-center justify-center">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                </div>
            </div>
            <div class="mt-3">
                <div class="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                    1.699.219
                </div>
                <div class="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                    <span>100% korpus terindeks DuckDB</span>
                </div>
            </div>
        </div>

        <!-- Card 2: Total Nilai Klaim -->
        <div class="p-5 rounded-2xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Nilai Tagihan</span>
                <div class="w-8 h-8 rounded-xl bg-bpjs-blue/10 text-bpjs-blue flex items-center justify-center">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            </div>
            <div class="mt-3">
                <div class="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                    Rp 1.536 T
                </div>
                <div class="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <span>Agregat portofolio nasional FKRTL</span>
                </div>
            </div>
        </div>

        <!-- Card 3: Anomali Terdeteksi -->
        <div class="p-5 rounded-2xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Tingkat Anomali Sistemik</span>
                <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
            </div>
            <div class="mt-3">
                <div class="text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                    4,78%
                </div>
                <div class="flex items-center gap-1.5 mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    <span>81.222 berkas memerlukan audit</span>
                </div>
            </div>
        </div>

        <!-- Card 4: Kepatuhan SLA Perpres -->
        <div class="p-5 rounded-2xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Kepatuhan SLA (10 Hari Kerja)</span>
                <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            </div>
            <div class="mt-3">
                <div class="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                    99,4%
                </div>
                <div class="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Sesuai Perpres No. 82/2018 Pasal 76</span>
                </div>
            </div>
        </div>
    </div>

    <!-- 7 Operational Modules Grid -->
    <div class="space-y-3">
        <h2 class="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-wider text-xs">
            Modul Operasional VEDIKA & Pengawasan
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Modul 1: VEDIKA Antrean -->
            <a href="{{ url('/vedika') }}" class="p-4 rounded-xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 hover:border-bpjs-green/50 dark:hover:border-bpjs-green/50 transition-all hover:shadow-md group">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-xl bg-bpjs-green/10 text-bpjs-green flex items-center justify-center shrink-0 group-hover:bg-bpjs-green group-hover:text-white transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-bpjs-green transition-colors">
                            VEDIKA Antrean FPK
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Penyortiran berkas FPK otomatis berdasarkan risiko anomali, nomor SEP, dan batas waktu SLA 10 hari kerja.
                        </p>
                        <div class="mt-2 flex items-center gap-2 text-[11px] font-mono text-bpjs-darkgreen dark:text-emerald-400 font-medium">
                            <span>Buka Antrean</span>
                            <svg class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </div>
                    </div>
                </div>
            </a>

            <!-- Modul 2: Bedah Dossier -->
            <a href="{{ url('/dossier') }}" class="p-4 rounded-xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 hover:border-bpjs-green/50 dark:hover:border-bpjs-green/50 transition-all hover:shadow-md group">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-xl bg-bpjs-blue/10 text-bpjs-blue flex items-center justify-center shrink-0 group-hover:bg-bpjs-blue group-hover:text-white transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                        </svg>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-bpjs-blue transition-colors">
                            Bedah Dossier Digital
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Inspeksi silang 6 dokumen digital: Resume Medis, Billing RS, Hasil Lab, Resep Obat, Bukti Penunjang, dan SEP.
                        </p>
                        <div class="mt-2 flex items-center gap-2 text-[11px] font-mono text-bpjs-blue dark:text-cyan-400 font-medium">
                            <span>Bedah Dokumen</span>
                            <svg class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </div>
                    </div>
                </div>
            </a>

            <!-- Modul 3: Konsol Putusan -->
            <a href="{{ url('/putusan') }}" class="p-4 rounded-xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 hover:border-bpjs-green/50 dark:hover:border-bpjs-green/50 transition-all hover:shadow-md group">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                            Konsol Putusan 4-Status
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Pengambilan keputusan verifikasi formal: Layak, Pending (Klarifikasi RS), Tidak Layak, atau Eskalasi Fraud.
                        </p>
                        <div class="mt-2 flex items-center gap-2 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-medium">
                            <span>Konsol Verifikator</span>
                            <svg class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </div>
                    </div>
                </div>
            </a>

            <!-- Modul 4: Laporan BAHV -->
            <a href="{{ url('/bahv') }}" class="p-4 rounded-xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 hover:border-bpjs-green/50 dark:hover:border-bpjs-green/50 transition-all hover:shadow-md group">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                        </svg>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-500 transition-colors">
                            Laporan dan BAHV Resmi
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Penerbitan Berita Acara Hasil Verifikasi (BAHV) sesuai regulasi siap cetak dan ekspor format resmi BPJS.
                        </p>
                        <div class="mt-2 flex items-center gap-2 text-[11px] font-mono text-purple-600 dark:text-purple-400 font-medium">
                            <span>Format Cetak BAHV</span>
                            <svg class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </div>
                    </div>
                </div>
            </a>

            <!-- Modul 5: Audit Ledger -->
            <a href="{{ url('/ledger') }}" class="p-4 rounded-xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 hover:border-bpjs-green/50 dark:hover:border-bpjs-green/50 transition-all hover:shadow-md group">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                            Audit Ledger SHA-256
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Rantai audit terenkripsi SHA-256 anti-tamper untuk setiap putusan verifikator sesuai mandat kepatuhan UU PDP.
                        </p>
                        <div class="mt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                            <span>Verifikasi Hash</span>
                            <svg class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </div>
                    </div>
                </div>
            </a>

            <!-- Modul 6: Pengaturan -->
            <a href="{{ url('/pengaturan') }}" class="p-4 rounded-xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 hover:border-bpjs-green/50 dark:hover:border-bpjs-green/50 transition-all hover:shadow-md group">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-slate-500 group-hover:text-white transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-slate-600 transition-colors">
                            Pengaturan Sistem
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Konfigurasi koneksi FastAPI port 8000, database lokal SQLite, profil verifikator medis, dan preferensi tema.
                        </p>
                        <div class="mt-2 flex items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400 font-medium">
                            <span>Kelola Sistem</span>
                            <svg class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </div>
                    </div>
                </div>
            </a>
        </div>
    </div>

    <!-- Forensic Table Demonstration with Anti-Overflow and table-fixed Discipline -->
    <div class="space-y-3">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                    Sampel Antrean Berkas Klaim Berisiko Tinggi
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    Contoh visualisasi tabel berpresisi tinggi dengan font JetBrains Mono dan batasan lebar tanpa luapan horizontal.
                </p>
            </div>
            <span class="text-xs font-mono text-slate-500 dark:text-slate-400">5 dari 81.222 entri</span>
        </div>

        <div class="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm overflow-hidden">
            <div class="table-fixed-wrap">
                <table class="table-fixed w-full min-w-full divide-y divide-slate-200 dark:divide-white/10 text-xs">
                    <thead class="bg-slate-50 dark:bg-health-cardHover/60 text-slate-600 dark:text-slate-300 font-semibold">
                        <tr>
                            <th class="w-40 px-4 py-3 text-left">Nomor SEP</th>
                            <th class="w-44 px-4 py-3 text-left">Fasilitas Kesehatan</th>
                            <th class="w-36 px-4 py-3 text-left">NIK Peserta (UU PDP)</th>
                            <th class="w-32 px-4 py-3 text-left">No. Kartu BPJS</th>
                            <th class="w-32 px-4 py-3 text-left">Nama Peserta</th>
                            <th class="w-28 px-4 py-3 text-left">Kode INA-CBG</th>
                            <th class="w-32 px-4 py-3 text-right">Biaya Riil RS</th>
                            <th class="w-32 px-4 py-3 text-right">Tarif INA-CBG</th>
                            <th class="w-28 px-4 py-3 text-center">Skor Anomali</th>
                            <th class="w-32 px-4 py-3 text-center">Status VEDIKA</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 dark:divide-white/5 font-mono">
                        <tr class="hover:bg-slate-50/80 dark:hover:bg-health-cardHover/40 transition-colors">
                            <td class="px-4 py-3 text-bpjs-blue font-semibold truncate">0123R0010124V000001</td>
                            <td class="px-4 py-3 font-sans text-slate-900 dark:text-slate-100 truncate">RSUP Dr. Cipto Mangunkusumo</td>
                            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">3171********0001</td>
                            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">000123*******</td>
                            <td class="px-4 py-3 font-sans text-slate-700 dark:text-slate-300">S*** R**** (Ny.)</td>
                            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">I-4-10-I</td>
                            <td class="px-4 py-3 text-right text-slate-900 dark:text-slate-100 tabular-nums">Rp 18.450.000</td>
                            <td class="px-4 py-3 text-right text-slate-900 dark:text-slate-100 tabular-nums">Rp 12.800.000</td>
                            <td class="px-4 py-3 text-center">
                                <span class="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                    0,94 (Kritis)
                                </span>
                            </td>
                            <td class="px-4 py-3 text-center font-sans">
                                <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    Pending RS
                                </span>
                            </td>
                        </tr>
                        <tr class="hover:bg-slate-50/80 dark:hover:bg-health-cardHover/40 transition-colors">
                            <td class="px-4 py-3 text-bpjs-blue font-semibold truncate">0123R0010124V000002</td>
                            <td class="px-4 py-3 font-sans text-slate-900 dark:text-slate-100 truncate">RSUD Tarakan Jakarta</td>
                            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">3172********0002</td>
                            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">000124*******</td>
                            <td class="px-4 py-3 font-sans text-slate-700 dark:text-slate-300">B*** S****** (Tn.)</td>
                            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">Q-5-18-0</td>
                            <td class="px-4 py-3 text-right text-slate-900 dark:text-slate-100 tabular-nums">Rp 6.120.000</td>
                            <td class="px-4 py-3 text-right text-slate-900 dark:text-slate-100 tabular-nums">Rp 5.980.000</td>
                            <td class="px-4 py-3 text-center">
                                <span class="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    0,12 (Wajar)
                                </span>
                            </td>
                            <td class="px-4 py-3 text-center font-sans">
                                <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-bpjs-green/10 text-bpjs-darkgreen dark:bg-emerald-500/20 dark:text-emerald-300 border border-bpjs-green/20">
                                    Layak
                                </span>
                            </td>
                        </tr>
                        <tr class="hover:bg-slate-50/80 dark:hover:bg-health-cardHover/40 transition-colors">
                            <td class="px-4 py-3 text-bpjs-blue font-semibold truncate">0123R0010124V000003</td>
                            <td class="px-4 py-3 font-sans text-slate-900 dark:text-slate-100 truncate">RS Jantung Harapan Kita</td>
                            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">3173********0003</td>
                            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">000125*******</td>
                            <td class="px-4 py-3 font-sans text-slate-700 dark:text-slate-300">A*** P****** (Tn.)</td>
                            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">I-1-03-III</td>
                            <td class="px-4 py-3 text-right text-slate-900 dark:text-slate-100 tabular-nums">Rp 74.300.000</td>
                            <td class="px-4 py-3 text-right text-slate-900 dark:text-slate-100 tabular-nums">Rp 48.000.000</td>
                            <td class="px-4 py-3 text-center">
                                <span class="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                    0,89 (Tinggi)
                                </span>
                            </td>
                            <td class="px-4 py-3 text-center font-sans">
                                <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                    Fraud Review
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endsection
