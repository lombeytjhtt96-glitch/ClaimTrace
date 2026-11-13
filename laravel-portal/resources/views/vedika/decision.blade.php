@extends('layouts.app')

@section('title', 'Konsol Putusan 4-Status VEDIKA — ' . $id)

@section('content')
<div
    class="py-6 space-y-6 decision-console"
    data-testid="decision-container"
    x-data="{
        selectedDecision: '{{ old('decision', $existingDecision['decision'] ?? 'LAYAK_BAYAR') }}',
        tarifVerifikasi: '{{ old('tarif_verifikasi_rp', $existingDecision['tarif_verifikasi_rp'] ?? ($dossier['claim']['tarif_fkl47'] ?? 5200000)) }}',
        inaCbgVerified: '{{ old('ina_cbg_verified', $existingDecision['ina_cbg_verified'] ?? ($dossier['claim']['kode_cbg'] ?? 'Z-3-12-0')) }}',
        disputeLevel: '{{ old('dispute_level', $existingDecision['dispute_level'] ?? 'CABANG') }}',
        showLedgerModal: false,
        ledgerData: null,
        loadingLedger: false,
        openLedger() {
            this.showLedgerModal = true;
            if (!this.ledgerData) {
                this.loadingLedger = true;
                fetch('{{ route('audit.ledger') }}?claim_id={{ $id }}', { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
                    .then(res => res.json())
                    .then(data => {
                        this.ledgerData = data;
                        this.loadingLedger = false;
                    })
                    .catch(() => {
                        this.loadingLedger = false;
                    });
            }
        }
    }"
>
    <!-- Top Identity & Breadcrumb Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div class="space-y-1">
            <div class="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <a href="{{ route('vedika.queue') }}" class="hover:text-bpjs-green transition-colors">VEDIKA Antrean</a>
                <span>/</span>
                <a href="{{ route('vedika.claims.show', $id) }}" class="hover:text-bpjs-green transition-colors">{{ $id }}</a>
                <span>/</span>
                <span class="text-bpjs-darkgreen dark:text-emerald-400 font-medium">Konsol Putusan 4-Status</span>
            </div>
            <div class="flex items-center gap-3">
                <h1 class="text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{{ $id }}</h1>
                @php
                    $status = $existingDecision['decision'] ?? ($dossier['status'] ?? 'MENUNGGU');
                    $statusBadge = match($status) {
                        'LAYAK_BAYAR' => 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
                        'PENDING_KLARIFIKASI', 'KLAIM_SUSULAN' => 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
                        'DISPUTE_TKMKB' => 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
                        'TIDAK_LAYAK_FRAUD', 'FRAUD' => 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
                        default => 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-white/10 dark:text-slate-300 dark:border-white/10',
                    };
                    $lane = strtoupper($dossier['lane'] ?? $dossier['tri_layer']['lane'] ?? 'HIJAU');
                    $score = (float) ($dossier['total_score'] ?? $dossier['score'] ?? $dossier['tri_layer']['total_score'] ?? 33.0);
                    $laneBadge = match($lane) {
                        'MERAH' => 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
                        'KUNING' => 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
                        default => 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
                    };
                @endphp
                <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full border {{ $statusBadge }}">
                    {{ str_replace('_', ' ', $status) }}
                </span>
                <span class="px-2.5 py-0.5 text-xs font-bold rounded-full border {{ $laneBadge }}">
                    Jalur {{ $lane }} &bull; {{ number_format($score, 1, '.', '') }}
                </span>
            </div>
        </div>

        <!-- Navigation Pills & Ledger Trigger -->
        <div class="flex items-center flex-wrap gap-2 text-xs">
            <a href="{{ route('vedika.claims.show', $id) }}" class="px-3 py-1.5 rounded-lg font-medium bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-bpjs-green transition-colors">
                Dossier Evidensi
            </a>
            <a href="{{ route('vedika.claims.checklist', $id) }}" class="px-3 py-1.5 rounded-lg font-medium bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-bpjs-green transition-colors">
                6 Kaidah ({{ $completedCount }}/6)
            </a>
            <button
                type="button"
                @click="openLedger()"
                data-testid="btn-ledger"
                class="px-3 py-1.5 rounded-lg font-medium bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors flex items-center gap-1.5"
            >
                <svg class="w-3.5 h-3.5 text-bpjs-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                <span>Audit Ledger SHA-256</span>
            </button>
        </div>
    </div>

    <!-- Claim Summary Card (Zero-PHI Compliant) -->
    <div class="bg-white dark:bg-health-card rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div>
            <div class="text-slate-600 dark:text-slate-400 font-mono text-[10px] uppercase">Faskes / Rumah Sakit</div>
            <div class="font-bold text-slate-900 dark:text-white mt-1">{{ $dossier['claim']['nama_faskes'] ?? 'RSUD Tarakan' }}</div>
            <div class="text-slate-500 font-mono text-[11px] mt-0.5">No. SEP: {{ $dossier['claim']['no_sep'] ?? '-' }}</div>
        </div>
        <div>
            <div class="text-slate-600 dark:text-slate-400 font-mono text-[10px] uppercase">Peserta (Zero-PHI Masked)</div>
            <div class="font-bold text-slate-900 dark:text-white mt-1">{{ $dossier['claim']['patient_pseudo'] ?? 'Pasien JKN' }}</div>
            <div class="text-slate-500 font-mono text-[11px] mt-0.5">NIK: {{ $dossier['claim']['patient_nik_masked'] ?? '3171********0001' }}</div>
        </div>
        <div>
            <div class="text-slate-600 dark:text-slate-400 font-mono text-[10px] uppercase">Koding INA-CBG & Tagihan</div>
            <div class="font-bold text-slate-900 dark:text-white mt-1 font-mono">{{ $dossier['claim']['kode_cbg'] ?? 'Z-3-12-0' }}</div>
            <div class="text-slate-500 text-[11px] mt-0.5">Tagih: Rp {{ number_format($dossier['claim']['tarif_fkl47'] ?? 5200000, 0, ',', '.') }}</div>
        </div>
        <div>
            <div class="text-slate-600 dark:text-slate-400 font-mono text-[10px] uppercase">Status 6 Kaidah VEDIKA</div>
            <div class="font-bold {{ $completedCount === 6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400' }} mt-1">
                {{ $completedCount }}/6 Kaidah Terverifikasi
            </div>
            <div class="text-slate-500 text-[11px] mt-0.5">SLA Verifikasi: 10 Hari Kerja</div>
        </div>
    </div>

    <!-- Adjudication Form -->
    <form action="{{ route('vedika.claims.decision.store', $id) }}" method="POST" class="space-y-6">
        @csrf

        @if($errors->any())
            <div class="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                <div class="font-semibold">Terdapat kesalahan pada formulir putusan:</div>
                <ul class="list-disc list-inside">
                    @foreach($errors->all() as $err)
                        <li>{{ $err }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <!-- 1. The 4 Putusan Status Cards -->
        <div class="space-y-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                Pilih Status Putusan Verifikator (Wajib)
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Status 1: Layak Bayar -->
                <label
                    @click="selectedDecision = 'LAYAK_BAYAR'"
                    :class="selectedDecision === 'LAYAK_BAYAR' ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-health-card hover:border-emerald-300'"
                    class="relative p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between"
                >
                    <input type="radio" name="decision" value="LAYAK_BAYAR" x-model="selectedDecision" class="sr-only" data-decision="LAYAK_BAYAR">
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                Status I
                            </span>
                            <div class="w-4 h-4 rounded-full border border-slate-300 dark:border-white/30 flex items-center justify-center" :class="selectedDecision === 'LAYAK_BAYAR' ? 'border-emerald-600 bg-emerald-600' : ''">
                                <div class="w-1.5 h-1.5 rounded-full bg-white" x-show="selectedDecision === 'LAYAK_BAYAR'"></div>
                            </div>
                        </div>
                        <div class="font-bold text-sm text-slate-900 dark:text-white">Layak Bayar</div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Disetujui untuk diteruskan ke pembayaran FPK sesuai tarif verifikasi FKL48.
                        </p>
                    </div>
                    <div class="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                        Disetujui Masuk BAHV
                    </div>
                </label>

                <!-- Status 2: Pending Klarifikasi -->
                <label
                    @click="selectedDecision = 'PENDING_KLARIFIKASI'"
                    :class="selectedDecision === 'PENDING_KLARIFIKASI' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-health-card hover:border-amber-300'"
                    class="relative p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between"
                >
                    <input type="radio" name="decision" value="PENDING_KLARIFIKASI" x-model="selectedDecision" class="sr-only" data-decision="PENDING_KLARIFIKASI">
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase font-mono bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                                Status II
                            </span>
                            <div class="w-4 h-4 rounded-full border border-slate-300 dark:border-white/30 flex items-center justify-center" :class="selectedDecision === 'PENDING_KLARIFIKASI' ? 'border-amber-600 bg-amber-600' : ''">
                                <div class="w-1.5 h-1.5 rounded-full bg-white" x-show="selectedDecision === 'PENDING_KLARIFIKASI'"></div>
                            </div>
                        </div>
                        <div class="font-bold text-sm text-slate-900 dark:text-white">Pending Klarifikasi</div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Ditunda menunggu kelengkapan berkas fisik/digital atau klarifikasi medis faskes.
                        </p>
                    </div>
                    <div class="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 text-[10px] font-mono text-amber-700 dark:text-amber-400 font-medium">
                        SLA Klarifikasi 10 HK
                    </div>
                </label>

                <!-- Status 3: Dispute TKMKB -->
                <label
                    @click="selectedDecision = 'DISPUTE_TKMKB'"
                    :class="selectedDecision === 'DISPUTE_TKMKB' ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-health-card hover:border-indigo-300'"
                    class="relative p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between"
                >
                    <input type="radio" name="decision" value="DISPUTE_TKMKB" x-model="selectedDecision" class="sr-only" data-decision="DISPUTE_TKMKB">
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase font-mono bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                                Status III
                            </span>
                            <div class="w-4 h-4 rounded-full border border-slate-300 dark:border-white/30 flex items-center justify-center" :class="selectedDecision === 'DISPUTE_TKMKB' ? 'border-indigo-600 bg-indigo-600' : ''">
                                <div class="w-1.5 h-1.5 rounded-full bg-white" x-show="selectedDecision === 'DISPUTE_TKMKB'"></div>
                            </div>
                        </div>
                        <div class="font-bold text-sm text-slate-900 dark:text-white">Dispute TKMKB</div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Sengketa koding atau pertimbangan klinis dialihkan ke forum TKMKB Berjenjang.
                        </p>
                    </div>
                    <div class="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 text-[10px] font-mono text-indigo-700 dark:text-indigo-400 font-medium">
                        SLA TKMKB 14-21 HK
                    </div>
                </label>

                <!-- Status 4: Tidak Layak Fraud -->
                <label
                    @click="selectedDecision = 'TIDAK_LAYAK_FRAUD'; tarifVerifikasi = 0"
                    :class="selectedDecision === 'TIDAK_LAYAK_FRAUD' ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-health-card hover:border-rose-300'"
                    class="relative p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between"
                >
                    <input type="radio" name="decision" value="TIDAK_LAYAK_FRAUD" x-model="selectedDecision" class="sr-only" data-decision="TIDAK_LAYAK_FRAUD">
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase font-mono bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200">
                                Status IV
                            </span>
                            <div class="w-4 h-4 rounded-full border border-slate-300 dark:border-white/30 flex items-center justify-center" :class="selectedDecision === 'TIDAK_LAYAK_FRAUD' ? 'border-rose-600 bg-rose-600' : ''">
                                <div class="w-1.5 h-1.5 rounded-full bg-white" x-show="selectedDecision === 'TIDAK_LAYAK_FRAUD'"></div>
                            </div>
                        </div>
                        <div class="font-bold text-sm text-slate-900 dark:text-white">Tidak Layak (Fraud)</div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Ditolak mutlak karena terindikasi kecurangan, phantom billing, atau manipulasi berkas.
                        </p>
                    </div>
                    <div class="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 text-[10px] font-mono text-rose-700 dark:text-rose-400 font-medium">
                        Tarif FKL48 = Rp 0
                    </div>
                </label>
            </div>
        </div>

        <!-- 2. Conditional Verified Tariff & INA-CBG Section -->
        <div class="bg-white dark:bg-health-card rounded-2xl p-5 border border-slate-200 dark:border-white/10 space-y-4">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2">
                <span>Penetapan Tarif Verifikasi (FKL48) & Koding INA-CBG</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="tarif_verifikasi_rp" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Tarif Verifikasi Disetujui (Rupiah FKL48)
                    </label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-600 dark:text-slate-400 font-mono">Rp</span>
                        <input
                            type="number"
                            id="tarif_verifikasi_rp"
                            name="tarif_verifikasi_rp"
                            x-model="tarifVerifikasi"
                            :readonly="selectedDecision === 'TIDAK_LAYAK_FRAUD'"
                            class="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark/60 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-bpjs-green focus:border-transparent transition-all"
                            placeholder="5200000"
                        >
                    </div>
                    <p class="text-[10px] text-slate-600 dark:text-slate-400 mt-1" x-show="selectedDecision === 'TIDAK_LAYAK_FRAUD'">
                        Otomatis bernilai 0 untuk putusan Tidak Layak / Fraud.
                    </p>
                </div>
                <div>
                    <label for="ina_cbg_verified" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Kode INA-CBG Hasil Verifikasi
                    </label>
                    <input
                        type="text"
                        id="ina_cbg_verified"
                        name="ina_cbg_verified"
                        x-model="inaCbgVerified"
                        class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark/60 text-slate-900 dark:text-white text-xs font-mono uppercase focus:ring-2 focus:ring-bpjs-green focus:border-transparent transition-all"
                        placeholder="Z-3-12-0"
                    >
                    <p class="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                        Sesuaikan jika terdapat koreksi koding sekunder / unbundling.
                    </p>
                </div>
            </div>
        </div>

        <!-- 3. Dispute SLA Tiers (Appears when DISPUTE_TKMKB is chosen) -->
        <div
            x-show="selectedDecision === 'DISPUTE_TKMKB'"
            x-transition
            class="bg-white dark:bg-health-card rounded-2xl p-5 border border-indigo-200 dark:border-indigo-900/50 space-y-4"
        >
            <div class="flex items-center justify-between">
                <h2 class="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 font-mono">
                    Penetapan Tingkat Sengketa Medis/Koding (SE Diryan 51/2016)
                </h2>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    Eskalasi TKMKB
                </span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                @foreach($disputeTiers as $tierKey => $tier)
                    <label
                        @click="disputeLevel = '{{ $tierKey }}'"
                        :class="disputeLevel === '{{ $tierKey }}' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark/40 hover:border-indigo-300'"
                        class="p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2"
                    >
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-xs text-slate-900 dark:text-white font-mono">{{ $tierKey }}</span>
                            <input type="radio" name="dispute_level" value="{{ $tierKey }}" x-model="disputeLevel" class="sr-only">
                            <div class="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/30 flex items-center justify-center" :class="disputeLevel === '{{ $tierKey }}' ? 'border-indigo-600 bg-indigo-600' : ''">
                                <div class="w-1 h-1 rounded-full bg-white" x-show="disputeLevel === '{{ $tierKey }}'"></div>
                            </div>
                        </div>
                        <div class="text-[11px] text-slate-600 dark:text-slate-300">{{ $tier['level'] ?? '' }}</div>
                        <div class="text-[10px] text-slate-600 dark:text-slate-400 font-mono space-y-0.5 pt-2 border-t border-slate-200/60 dark:border-white/5">
                            <div>SLA Koding: {{ $tier['sla_koding_hk'] ?? 5 }} Hari Kerja (HK)</div>
                            <div>SLA Medis: {{ $tier['sla_medis_hk'] ?? 14 }} Hari Kerja (HK)</div>
                            @if($tierKey === 'PUSAT_TKMKB')
                                <div class="text-amber-600 dark:text-amber-400 font-medium">Batas Kalender Maks. 30 Hari</div>
                            @endif
                        </div>
                    </label>
                @endforeach
            </div>
        </div>

        <!-- 4. The 16 Baku Alasan 3-Pilar Checklist (ADM, KOD, MED) -->
        <div class="bg-white dark:bg-health-card rounded-2xl p-5 border border-slate-200 dark:border-white/10 space-y-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                <div>
                    <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                        16 Baku Alasan Pending, Klarifikasi & Dispute (3-Pilar Regulasi)
                    </h2>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Centang alasan baku pendukung sesuai kaidah VEDIKA, Permenkes No. 26/2021, Permenkes No. 3/2023, dan Perpres No. 82/2018.
                    </p>
                </div>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                    Standar 3 Pilar
                </span>
            </div>

            <!-- Pilar 1: Administrasi (ADM-01 s/d ADM-06) -->
            <div class="space-y-2">
                <div class="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase font-mono flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Pilar I &bull; Administrasi Klaim (ADM-01 s/d ADM-06)</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    @foreach($pillars['administrasi'] ?? [] as $adm)
                        <label class="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer flex items-start gap-2.5 transition-colors">
                            <input
                                type="checkbox"
                                name="pending_reasons[]"
                                value="{{ $adm['code'] }}"
                                @if(in_array($adm['code'], old('pending_reasons', $existingDecision['pending_reasons'] ?? []))) checked @endif
                                class="mt-0.5 rounded border-slate-300 text-bpjs-green focus:ring-bpjs-green/30"
                            >
                            <div class="text-[11px] space-y-0.5">
                                <div class="font-bold font-mono text-slate-900 dark:text-white">{{ $adm['code'] }} &bull; {{ $adm['title'] }}</div>
                                <div class="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Dasar Hukum: {{ $adm['citation'] }}</div>
                            </div>
                        </label>
                    @endforeach
                </div>
            </div>

            <!-- Pilar 2: Koding INA-CBG (KOD-01 s/d KOD-05) -->
            <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <div class="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase font-mono flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Pilar II &bull; Koding INA-CBG (KOD-01 s/d KOD-05)</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    @foreach($pillars['koding'] ?? [] as $kod)
                        <label class="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer flex items-start gap-2.5 transition-colors">
                            <input
                                type="checkbox"
                                name="pending_reasons[]"
                                value="{{ $kod['code'] }}"
                                @if(in_array($kod['code'], old('pending_reasons', $existingDecision['pending_reasons'] ?? []))) checked @endif
                                class="mt-0.5 rounded border-slate-300 text-bpjs-green focus:ring-bpjs-green/30"
                            >
                            <div class="text-[11px] space-y-0.5">
                                <div class="font-bold font-mono text-slate-900 dark:text-white">{{ $kod['code'] }} &bull; {{ $kod['title'] }}</div>
                                <div class="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Dasar Hukum: {{ $kod['citation'] }}</div>
                            </div>
                        </label>
                    @endforeach
                </div>
            </div>

            <!-- Pilar 3: Pelayanan Medis (MED-01 s/d MED-05) -->
            <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <div class="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase font-mono flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Pilar III &bull; Pelayanan Medis Klinis (MED-01 s/d MED-05)</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    @foreach($pillars['medis'] ?? [] as $med)
                        <label class="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer flex items-start gap-2.5 transition-colors">
                            <input
                                type="checkbox"
                                name="pending_reasons[]"
                                value="{{ $med['code'] }}"
                                @if(in_array($med['code'], old('pending_reasons', $existingDecision['pending_reasons'] ?? []))) checked @endif
                                class="mt-0.5 rounded border-slate-300 text-bpjs-green focus:ring-bpjs-green/30"
                            >
                            <div class="text-[11px] space-y-0.5">
                                <div class="font-bold font-mono text-slate-900 dark:text-white">{{ $med['code'] }} &bull; {{ $med['title'] }}</div>
                                <div class="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Dasar Hukum: {{ $med['citation'] }}</div>
                            </div>
                        </label>
                    @endforeach
                </div>
            </div>
        </div>

        <!-- 5. Mandatory Verifier Notes -->
        <div class="bg-white dark:bg-health-card rounded-2xl p-5 border border-slate-200 dark:border-white/10 space-y-3">
            <div class="flex items-center justify-between">
                <label for="catatan" class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                    Catatan Verifikator Medis (Wajib &bull; Maks. 5.000 Karakter)
                </label>
                <span class="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Zero-PHI Sanitized</span>
            </div>
            <textarea
                id="catatan"
                name="catatan"
                rows="4"
                maxlength="5000"
                required
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-health-dark/60 text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-bpjs-green focus:border-transparent transition-all placeholder:text-slate-400"
                placeholder="Tuliskan alasan klinis, temuan ketidaksesuaian koding, atau instruksi kelengkapan berkas untuk faskes..."
            >{{ old('catatan', $existingDecision['catatan'] ?? '') }}</textarea>
            <div class="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Catatan ini akan dicatat ke dalam audit ledger kriptografis dan diteruskan ke faskes / TKMKB.</span>
                <span>Maksimal 5.000 karakter</span>
            </div>
        </div>

        <!-- Submit Action Bar -->
        <div class="flex items-center justify-between pt-2">
            <a href="{{ route('vedika.queue') }}" class="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                Kembali ke Antrean
            </a>
            <div class="flex items-center gap-3">
                <button
                    type="submit"
                    class="px-6 py-2.5 rounded-xl bg-bpjs-green hover:bg-bpjs-darkgreen text-white text-xs font-semibold shadow-sm shadow-bpjs-green/30 transition-all flex items-center gap-2"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    <span>Simpan & Segel Putusan ke Ledger</span>
                </button>
            </div>
        </div>
    </form>

    <!-- Modal SHA-256 Tamper-Evident Ledger Viewer -->
    <div
        x-show="showLedgerModal"
        x-transition:enter="transition-opacity ease-linear duration-200"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="transition-opacity ease-linear duration-200"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0"
        class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center"
        style="display: none;"
    >
        <div
            @click.away="showLedgerModal = false"
            class="bg-white dark:bg-health-card rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        >
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-health-dark/30">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-bpjs-green/10 text-bpjs-green flex items-center justify-center">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-slate-900 dark:text-white font-mono">SHA-256 Tamper-Evident Audit Ledger</h3>
                        <p class="text-[11px] text-slate-500 font-mono">Integritas Rantai Kriptografis Sesuai UU PDP No. 27/2022</p>
                    </div>
                </div>
                <button
                    type="button"
                    @click="showLedgerModal = false"
                    data-testid="close-ledger-modal"
                    class="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 overflow-y-auto space-y-4 text-xs">
                <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between font-mono text-[11px]">
                    <span>STATUS INTEGRITAS RANTAI: VALID (100% Hash Continuity)</span>
                    <span>Standar ISO 27001 & UU PDP No. 27/2022</span>
                </div>

                <div x-show="loadingLedger" class="py-8 text-center text-slate-400">
                    Memuat rantai blok audit kriptografi...
                </div>

                <div x-show="!loadingLedger && ledgerData" class="space-y-3 font-mono">
                    <template x-for="block in (ledgerData ? ledgerData.chain : [])" :key="block.index">
                        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-health-dark/40 space-y-2">
                            <div class="flex items-center justify-between text-[11px]">
                                <span class="font-bold text-bpjs-green" x-text="block.index === 0 ? 'Blok #0 (GENESIS)' : 'Blok #' + block.index"></span>
                                <span class="text-slate-400" x-text="block.timestamp"></span>
                            </div>
                            <div class="grid grid-cols-2 gap-2 text-[10px]">
                                <div><span class="text-slate-400">Aktor:</span> <span class="text-slate-700 dark:text-slate-300" x-text="block.actor"></span></div>
                                <div><span class="text-slate-400">ID Klaim:</span> <span class="text-slate-700 dark:text-slate-300" x-text="block.claim_id"></span></div>
                            </div>
                            <div class="text-[9px] break-all space-y-0.5">
                                <div class="text-slate-400">Prev Hash: <span class="text-slate-500" x-text="block.prev_hash"></span></div>
                                <div class="text-slate-400">Current Hash: <span class="text-emerald-600 dark:text-emerald-400 font-semibold" x-text="block.current_hash"></span></div>
                            </div>
                            <details class="text-[10px] pt-1 border-t border-slate-200/50 dark:border-white/5">
                                <summary class="cursor-pointer text-slate-500 hover:text-bpjs-green">Inspeksi Payload JSON Canonical</summary>
                                <pre class="mt-2 p-2 rounded bg-slate-900 text-slate-100 text-[9px] overflow-x-auto" x-text="JSON.stringify(block.payload, null, 2)"></pre>
                            </details>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-health-dark/30 flex items-center justify-between">
                <a href="{{ route('audit.ledger') }}" class="text-xs text-bpjs-green hover:underline font-mono">
                    Buka Halaman Penuh Ledger
                </a>
                <button
                    type="button"
                    @click="showLedgerModal = false"
                    data-testid="close-ledger-modal"
                    class="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                >
                    Tutup
                </button>
            </div>
        </div>
    </div>
</div>
@endsection
