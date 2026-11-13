@extends('layouts.app')

@section('title', 'Dossier Digital Klaim ' . $id)

@section('content')
<div class="py-6 space-y-6 investigation-dossier" data-testid="dossier-container">
    <!-- Top Action Breadcrumb & Identity Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div class="space-y-1">
            <div class="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <a href="{{ route('vedika.queue') }}" class="hover:text-bpjs-green transition-colors">VEDIKA Antrean</a>
                <span>/</span>
                <span class="text-slate-800 dark:text-slate-200 font-semibold">{{ $id }}</span>
                <span>/</span>
                <span class="text-bpjs-darkgreen dark:text-emerald-400 font-medium">Digital Dossier</span>
            </div>
            <div class="flex items-center gap-3">
                <h1 class="text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{{ $id }}</h1>
                @php
                    $status = $dossier['status'] ?? 'MENUNGGU';
                    $statusBadge = match($status) {
                        'LAYAK_BAYAR' => 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
                        'PENDING_KLARIFIKASI', 'KLAIM_SUSULAN' => 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
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
                <span class="px-2.5 py-0.5 text-xs font-bold rounded-full border {{ $laneBadge }}" data-testid="tri-layer-badge">
                    Jalur {{ $lane }} &bull; {{ number_format($score, 1, '.', '') }}
                </span>
                @if(($dossier['fpk_metadata']['jenis_pengajuan'] ?? '') === 'Susulan' || ($dossier['resubmission_timeline']['resubmission_count'] ?? 0) > 0)
                    <span class="px-2 py-0.5 text-[11px] font-semibold rounded-full border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                        Klaim Susulan (Revisi #{{ $dossier['resubmission_timeline']['resubmission_count'] ?? 1 }})
                    </span>
                @endif
            </div>
        </div>

        <!-- Quick Sub-Navigation Pills -->
        <div class="flex items-center flex-wrap gap-2 text-xs">
            <a href="{{ route('vedika.claims.show', $id) }}" class="px-3 py-1.5 rounded-lg font-semibold bg-bpjs-green text-white shadow-sm">
                Dossier & Evidensi
            </a>
            <a href="{{ route('vedika.claims.icare', $id) }}" class="px-3 py-1.5 rounded-lg font-medium bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-bpjs-green transition-colors">
                i-Care Riwayat
            </a>
            <a href="{{ route('vedika.claims.billing', $id) }}" class="px-3 py-1.5 rounded-lg font-medium bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-bpjs-green transition-colors">
                Billing Rekonsiliasi
            </a>
            <a href="{{ route('vedika.claims.sdmk', $id) }}" class="px-3 py-1.5 rounded-lg font-medium bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-bpjs-green transition-colors">
                SATUSEHAT SDMK
            </a>
            <a href="{{ route('vedika.claims.checklist', $id) }}" class="px-3 py-1.5 rounded-lg font-medium bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-bpjs-green transition-colors">
                6 Kaidah
            </a>
            @if($status !== 'LAYAK_BAYAR')
                <a href="{{ route('vedika.claims.resubmit.form', $id) }}" class="px-3 py-1.5 rounded-lg font-medium bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors">
                    Form Susulan
                </a>
            @endif
        </div>
    </div>

    <!-- Patient & FPK Summary Header Card (Zero-PHI Compliant) -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm">
        <div class="space-y-1">
            <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Identitas Peserta (Zero-PHI)</span>
            <div class="text-sm font-bold text-slate-900 dark:text-white">{{ $dossier['participant']['pseudo_name'] ?? 'Tn. A*** P***' }}</div>
            <div class="text-xs font-mono text-slate-600 dark:text-slate-300">
                No. Kartu: {{ $dossier['participant']['no_kartu_masked'] ?? '0001********' }}
            </div>
            <div class="text-xs font-mono text-slate-500 dark:text-slate-400">
                NIK: {{ $dossier['participant']['nik_masked'] ?? '3171********0001' }}
            </div>
        </div>

        <div class="space-y-1">
            <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Fasilitas Kesehatan</span>
            <div class="text-sm font-bold text-slate-900 dark:text-white">{{ $dossier['fpk_metadata']['nama_faskes'] ?? 'RSUP Persahabatan' }}</div>
            <div class="text-xs text-slate-600 dark:text-slate-300">
                Kode Faskes: {{ $dossier['fpk_metadata']['faskes_id'] ?? '0114R001' }}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400">
                Pelayanan: {{ $dossier['fpk_metadata']['jenis_pelayanan'] ?? 'RITL' }} ({{ $dossier['participant']['kelas_rawat'] ?? 'Kelas 1' }})
            </div>
        </div>

        <div class="space-y-1">
            <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Koding INA-CBG & Tarif</span>
            <div class="text-sm font-bold font-mono text-bpjs-darkgreen dark:text-emerald-400">
                {{ $dossier['fpk_metadata']['kode_cbg'] ?? 'C-4-13-I' }}
            </div>
            <div class="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                {{ $dossier['fpk_metadata']['deskripsi_cbg'] ?? 'Prosedur Katarak Tanpa Komplikasi' }}
            </div>
            <div class="text-xs font-semibold text-slate-900 dark:text-white font-mono">
                Rp {{ number_format($dossier['billing_reconciliation']['fkl47_submitted_rp'] ?? 5200000, 0, ',', '.') }}
            </div>
        </div>

        <div class="space-y-1">
            <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Triage & Skor Tri-Layer</span>
            <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 text-xs font-bold rounded-full border {{ $laneBadge }}">
                    Jalur {{ $lane }}
                </span>
                <span class="text-sm font-bold font-mono text-slate-900 dark:text-white">
                    {{ number_format($score, 1, '.', '') }}
                </span>
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400">
                Formula: 0.50 S1 + 0.30 S2 + 0.20 S3
            </div>
            @if(($dossier['tri_layer']['hard_trigger'] ?? false) || ($dossier['evidence_layers']['layer_2_satusehat']['sip_status'] ?? '') === 'EXPIRED')
                <div class="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    HARD TRIGGER: SIP Kedaluwarsa
                </div>
            @endif
        </div>

        <div class="space-y-1">
            <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status Kelayakan VEDIKA</span>
            <div class="flex items-center gap-2">
                <span class="text-sm font-bold {{ $completedCount === 6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400' }}">
                    {{ $completedCount }}/6 Kaidah Terpenuhi
                </span>
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400">
                FPK: {{ $dossier['fpk_metadata']['no_fpk'] ?? 'FPK-0114-202611-001' }}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400">
                Bulan Pelayanan: {{ $dossier['fpk_metadata']['bulan_pelayanan'] ?? '2026-11' }}
            </div>
        </div>
    </div>

    <!-- Main Grid: Documents (Left) and 4-Layer Matrix + 6 Kaidah (Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6" x-data="{ activeDoc: 'DOC-SEP' }">
        <!-- Left: 6 Mandatory Documents Tabs (4 cols) -->
        <div class="lg:col-span-4 space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    6 Berkas Digital Wajib
                </h3>
                <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400">Integritas SHA-256</span>
            </div>

            <div class="space-y-2.5">
                @foreach($dossier['dokumen_berkas_digital'] ?? [] as $doc)
                    <div
                        @click="activeDoc = '{{ $doc['code'] }}'"
                        :class="activeDoc === '{{ $doc['code'] }}' ? 'border-bpjs-green ring-1 ring-bpjs-green bg-bpjs-green/5 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-health-card hover:border-slate-300'"
                        class="p-3.5 rounded-xl border transition-all cursor-pointer shadow-sm text-left"
                    >
                        <div class="flex items-center justify-between gap-2 mb-1.5">
                            <span class="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">{{ $doc['code'] }}</span>
                            @php
                                $dStatus = $doc['status'] ?? 'VALID';
                                $dClass = match($dStatus) {
                                    'VALID' => 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
                                    'PERLU_KLARIFIKASI' => 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
                                    default => 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
                                };
                            @endphp
                            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border {{ $dClass }}">
                                {{ $dStatus }}
                            </span>
                        </div>
                        <div class="text-xs font-medium text-slate-800 dark:text-slate-100 line-clamp-1 mb-1.5">
                            {{ $doc['name'] }}
                        </div>
                        <div class="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                            {{ $doc['notes'] ?? 'Berkas digital tervalidasi' }}
                        </div>
                        <div class="p-1.5 rounded bg-slate-50 dark:bg-health-dark/70 border border-slate-200 dark:border-white/5">
                            <div class="text-[10px] font-mono text-slate-600 dark:text-slate-400 mb-0.5 uppercase">SHA-256 Hash</div>
                            <div class="text-[10px] font-mono text-slate-700 dark:text-slate-300 break-all select-all leading-tight font-semibold">
                                {{ $doc['sha256'] ?? $doc['hash_sha256'] }}
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>

            <!-- Historical Feedback Notes Timeline for Resubmissions -->
            @if(!empty($dossier['resubmission_timeline']['history']))
                <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm space-y-3">
                    <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                        <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Timeline Riwayat Catatan Faskes
                        </h4>
                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {{ count($dossier['resubmission_timeline']['history']) }} Catatan
                        </span>
                    </div>
                    <div class="space-y-3">
                        @foreach($dossier['resubmission_timeline']['history'] as $hist)
                            <div class="p-3 rounded-lg bg-slate-50 dark:bg-health-dark/60 border border-slate-100 dark:border-white/5 text-xs space-y-1">
                                <div class="flex items-center justify-between text-[11px]">
                                    <span class="font-semibold text-slate-800 dark:text-slate-200">{{ $hist['petugas'] ?? 'Casemix Faskes' }}</span>
                                    <span class="font-mono text-slate-600 dark:text-slate-400">{{ $hist['tanggal'] ?? '-' }}</span>
                                </div>
                                <p class="text-slate-700 dark:text-slate-300 italic">"{{ $hist['faskes_catatan'] ?? '' }}"</p>
                                @if(($hist['tarif_revisi_rp'] ?? 0) > 0)
                                    <div class="text-[11px] font-mono text-bpjs-darkgreen dark:text-emerald-400 font-semibold pt-1">
                                        Tarif Pengajuan Ulang: Rp {{ number_format($hist['tarif_revisi_rp'], 0, ',', '.') }}
                                    </div>
                                @endif
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif
        </div>

        <!-- Right: 4-Layer Evidence Matrix & 6 Kaidah Worksheet (8 cols) -->
        <div class="lg:col-span-8 space-y-6">
            <!-- 4-Layer Evidence Matrix Header -->
            <div class="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                    <div>
                        <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Matriks Evidensi 4 Lapis (Anti-Fraud)
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Sintesis validasi otomatis lintas sistem BPJS, SATUSEHAT Kemenkes, dan Mobile JKN
                        </p>
                    </div>
                    <span class="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-bpjs-green/10 text-bpjs-darkgreen dark:bg-emerald-950/40 dark:text-emerald-300 border border-bpjs-green/30">
                        Zero-PHI Compliance
                    </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Layer 1: Cluster & Repeat Metrics -->
                    <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-health-dark/40 space-y-2.5">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">Layer 1</span>
                                <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase">Klaster & Baseline</h4>
                            </div>
                            <span class="text-[10px] font-mono text-slate-500">MITRE {{ $dossier['evidence_layers']['layer_1_cluster']['mitre_f3_code'] ?? 'FA0002.F1018' }}</span>
                        </div>
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Kode F3 MITRE:</span>
                                <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">{{ $dossier['evidence_layers']['layer_1_cluster']['mitre_f3_code'] ?? 'FA0002.F1018' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Spike Ratio vs Baseline:</span>
                                <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">{{ $dossier['evidence_layers']['layer_1_cluster']['spike_ratio'] ?? '1.1' }}x Baseline</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Ukuran Klaster Kasus:</span>
                                <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">{{ $dossier['evidence_layers']['layer_1_cluster']['cluster_size'] ?? 28 }} klaim</span>
                            </div>
                        </div>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-white/5">
                            {{ $dossier['evidence_layers']['layer_1_cluster']['interpretation'] ?? 'Frekuensi normal sesuai kapasitas pelayanan bedah RSUP' }}
                        </p>
                    </div>

                    <!-- Layer 2: SATUSEHAT SDMK & Workload -->
                    <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-health-dark/40 space-y-2.5">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Layer 2</span>
                                <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase">SATUSEHAT SDMK & SIP</h4>
                            </div>
                            @php
                                $sipStatus = $dossier['evidence_layers']['layer_2_satusehat']['sip_status'] ?? 'ACTIVE';
                                $sipClass = $sipStatus === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300';
                            @endphp
                            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border {{ $sipClass }}">
                                SIP {{ $sipStatus }}
                            </span>
                        </div>
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Status Registrasi SIP:</span>
                                <span class="font-semibold text-slate-800 dark:text-slate-200">{{ $sipStatus === 'ACTIVE' ? 'Aktif (Kemenkes SDMK)' : 'Kedaluwarsa / EXPIRED' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Beban Pasien Harian DPJP:</span>
                                <span class="font-mono font-semibold {{ ($dossier['evidence_layers']['layer_2_satusehat']['daily_patient_count'] ?? 18) > 40 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200' }}">
                                    {{ $dossier['evidence_layers']['layer_2_satusehat']['daily_patient_count'] ?? 18 }} / maks 40 pasien
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Kecepatan Transit Antar-Faskes:</span>
                                <span class="font-mono font-semibold {{ ($dossier['evidence_layers']['layer_2_satusehat']['osrm_transit_speed_kmh'] ?? 12) > 120 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200' }}">
                                    {{ $dossier['evidence_layers']['layer_2_satusehat']['osrm_transit_speed_kmh'] ?? 12 }} km/jam
                                </span>
                            </div>
                        </div>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-white/5">
                            {{ $dossier['evidence_layers']['layer_2_satusehat']['catatan'] ?? 'Validasi SDMK Kemenkes terkonfirmasi' }}
                        </p>
                    </div>

                    <!-- Layer 3: Mobile JKN Attendance & Telemetry -->
                    <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-health-dark/40 space-y-2.5">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Layer 3</span>
                                <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase">Mobile JKN & Telemetri</h4>
                            </div>
                            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                                Kehadiran Sah
                            </span>
                        </div>
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Konfirmasi Kehadiran Peserta:</span>
                                <span class="font-semibold text-slate-800 dark:text-slate-200">
                                    {{ $dossier['evidence_layers']['layer_3_mobile_jkn']['confirmed_attendance'] ?? 5 }}/{{ $dossier['evidence_layers']['layer_3_mobile_jkn']['sample_count'] ?? 5 }} Responden
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Status Penyangkalan (Denial):</span>
                                <span class="font-mono font-semibold text-emerald-600 dark:text-emerald-400">0 Kasus</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Telemetri Check-in Geolocation:</span>
                                <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">Presisi GPS Radius 15m</span>
                            </div>
                        </div>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-white/5">
                            Telemetri Mobile JKN mengonfirmasi kehadiran fisik pasien di ruang rawat faskes
                        </p>
                    </div>

                    <!-- Layer 4: FRISTA Biometric Verification -->
                    <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-health-dark/40 space-y-2.5">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">Layer 4</span>
                                <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase">FRISTA Biometrik Wajah</h4>
                            </div>
                            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                                Match {{ $dossier['evidence_layers']['layer_4_frista']['match_confidence_pct'] ?? '99.2' }}%
                            </span>
                        </div>
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Status Biometrik:</span>
                                <span class="font-semibold text-emerald-600 dark:text-emerald-400">Terverifikasi FRISTA</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Tingkat Kemiripan (Confidence):</span>
                                <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">{{ $dossier['evidence_layers']['layer_4_frista']['match_confidence_pct'] ?? '99.2' }}%</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Titik Verifikasi:</span>
                                <span class="text-slate-800 dark:text-slate-200">Kios Admisi Rumah Sakit</span>
                            </div>
                        </div>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-white/5">
                            Identitas pasien sesuai secara biometrik dengan data rekam biometrik BPJS Kesehatan
                        </p>
                    </div>
                </div>
            </div>

            <!-- 6 Kaidah Verification Worksheet Card -->
            <div class="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                    <div>
                        <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Kertas Kerja Verifikasi 6 Kaidah Mutlak
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Seluruh 6 kaidah wajib terpenuhi (centang hijau) sebelum klaim dapat diputuskan Layak Bayar
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold px-3 py-1 rounded-full border {{ $completedCount === 6 ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300' }}">
                            {{ $completedCount }}/6 Kaidah Terpenuhi
                        </span>
                    </div>
                </div>

                <!-- Interactive Checklist Form -->
                <div class="space-y-3">
                    @php
                        $kaidahList = [
                            [
                                'key' => 'sep_valid',
                                'label' => 'Kaidah 1: Keabsahan SEP dan Kepesertaan Aktif',
                                'desc' => 'Nomor SEP terbit sesuai regulasi, kepesertaan aktif saat pelayanan, tidak ada selisih hak kelas rawat.',
                            ],
                            [
                                'key' => 'rujukan_prb_valid',
                                'label' => 'Kaidah 2: Rujukan Berjenjang / Pasca Rawat PRB Sah',
                                'desc' => 'Surat rujukan FKTP / antar-faskes berlaku aktif, rujukan vertikal atau surat kontrol spesialis memenuhi ketentuan.',
                            ],
                            [
                                'key' => 'resume_tte_dpjp',
                                'label' => 'Kaidah 3: Resume Medis Lengkap Bertanda Tangan Elektronik DPJP',
                                'desc' => 'Resume medis memuat kronologis, indikasi rawat, terapi, dan telah ditandatangani TTE bersertifikasi BSrE oleh DPJP.',
                            ],
                            [
                                'key' => 'koding_inacbg_sesuai',
                                'label' => 'Kaidah 4: Kesesuaian Koding Diagnosis & Tindakan INA-CBG',
                                'desc' => 'Koding ICD-10 diagnosis utama/sekunder dan ICD-9-CM prosedur tindakan sesuai rekam medis, bebas upcoding.',
                            ],
                            [
                                'key' => 'bukti_penunjang_lengkap',
                                'label' => 'Kaidah 5: Kelengkapan Bukti Penunjang Medis & Tindakan',
                                'desc' => 'Hasil laboratorium, radiologi, patologi anatomi, atau laporan operasi melampirkan bukti objektif terverifikasi.',
                            ],
                            [
                                'key' => 'konfirmasi_peserta_sah',
                                'label' => 'Kaidah 6: Konfirmasi Keabsahan Peserta & Absensi Pelayanan',
                                'desc' => 'FRISTA biometrik atau konfirmasi Mobile JKN membuktikan pelayanan benar-benar diterima peserta sah (bukan klaim fiktif).',
                            ],
                        ];
                    @endphp

                    @foreach($kaidahList as $k)
                        @php $isChecked = !empty($checklist[$k['key']]); @endphp
                        <form method="POST" action="{{ route('vedika.claims.checklist.update', $id) }}" class="flex items-start gap-3 p-3 rounded-lg border {{ $isChecked ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20' : 'border-slate-200 bg-slate-50/60 dark:border-white/5 dark:bg-health-dark/30' }} transition-colors">
                            @csrf
                            @method('PATCH')
                            <input type="hidden" name="item" value="{{ $k['key'] }}">
                            <input type="hidden" name="value" value="{{ $isChecked ? '0' : '1' }}">

                            <button type="submit" class="mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors {{ $isChecked ? 'bg-bpjs-green border-bpjs-green text-white' : 'border-slate-300 dark:border-white/20 bg-white dark:bg-health-card' }}">
                                @if($isChecked)
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                                    </svg>
                                @endif
                            </button>

                            <div class="flex-1 text-xs">
                                <div class="flex items-center justify-between gap-2">
                                    <span class="font-bold {{ $isChecked ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300' }}">
                                        {{ $k['label'] }}
                                    </span>
                                    <span class="font-mono text-[10px] {{ $isChecked ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-600 dark:text-slate-400' }}">
                                        {{ $k['key'] }}
                                    </span>
                                </div>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {{ $k['desc'] }}
                                </p>
                            </div>
                        </form>
                    @endforeach
                </div>

                <!-- Adjudication Action Bar -->
                <div class="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div class="text-xs text-slate-500 dark:text-slate-400">
                        @if($completedCount === 6)
                            <span class="text-emerald-600 dark:text-emerald-400 font-semibold">
                                Seluruh 6 kaidah mutlak telah diverifikasi valid. Klaim memenuhi syarat adjudikasi Layak Bayar.
                            </span>
                        @else
                            <span class="text-amber-600 dark:text-amber-400 font-semibold">
                                Peringatan: Masih terdapat {{ 6 - $completedCount }} kaidah yang belum terpenuhi. Tombol Layak Bayar dinonaktifkan.
                            </span>
                        @endif
                    </div>

                    <div class="flex items-center gap-3">
                        <button
                            type="button"
                            id="btn-layak-bayar"
                            class="btn-layak-bayar px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm {{ $completedCount === 6 ? 'bg-bpjs-green hover:bg-bpjs-darkgreen text-white cursor-pointer' : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60' }}"
                            {{ $completedCount === 6 ? '' : 'disabled' }}
                        >
                            Layak Bayar (Adjudikasi)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
