@extends('layouts.app')

@section('title', 'Kertas Kerja 6 Kaidah - ' . $id)

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
                <span class="text-slate-800 dark:text-slate-200 font-semibold">Kertas Kerja 6 Kaidah</span>
            </div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-white mt-1">Lembar Verifikasi 6 Kaidah Mutlak VEDIKA</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">Klaim: <span class="font-mono font-semibold">{{ $id }}</span> &middot; Faskes: {{ $dossier['fpk_metadata']['nama_faskes'] ?? 'RSUP Persahabatan' }}</p>
        </div>
        <div class="flex items-center gap-2">
            <a href="{{ route('vedika.claims.dossier', $id) }}" class="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-bpjs-green transition-colors">
                Kembali ke Dossier
            </a>
        </div>
    </div>

    <!-- Kaidah Cards List -->
    <div class="space-y-4">
        @php
            $kaidahItems = [
                [
                    'code' => 'sep_valid',
                    'title' => 'Kaidah 1: Keabsahan Surat Eligibilitas Peserta (SEP)',
                    'desc' => 'Nomor SEP terbit secara sah, status kepesertaan aktif, hak kelas rawat sesuai premi iuran JKN.',
                ],
                [
                    'code' => 'rujukan_prb_valid',
                    'title' => 'Kaidah 2: Rujukan Berjenjang / Pasca Rawat PRB Sah',
                    'desc' => 'Surat rujukan FKTP aktif atau surat kontrol spesialis diterbitkan sesuai prosedur rujukan berjenjang.',
                ],
                [
                    'code' => 'resume_tte_dpjp',
                    'title' => 'Kaidah 3: Resume Medis Lengkap Bertanda Tangan Elektronik DPJP',
                    'desc' => 'Resume medis terisi lengkap dengan TTE bersertifikasi BSrE dokter penanggung jawab pelayanan.',
                ],
                [
                    'code' => 'koding_inacbg_sesuai',
                    'title' => 'Kaidah 4: Kesesuaian Koding Diagnosis & Tindakan INA-CBG',
                    'desc' => 'Koding diagnosis ICD-10 dan prosedur tindakan ICD-9-CM selaras dengan rekam medis serta kaidah koding.',
                ],
                [
                    'code' => 'bukti_penunjang_lengkap',
                    'title' => 'Kaidah 5: Kelengkapan Bukti Penunjang Medis & Tindakan',
                    'desc' => 'Hasil pemeriksaan penunjang (laboratorium, radiologi, patologi) melampirkan bukti autentik.',
                ],
                [
                    'code' => 'konfirmasi_peserta_sah',
                    'title' => 'Kaidah 6: Konfirmasi Keabsahan Peserta & Absensi Pelayanan',
                    'desc' => 'Verifikasi biometrik FRISTA atau telemetri kehadiran Mobile JKN valid dan bebas indikasi klaim fiktif.',
                ],
            ];
        @endphp

        @foreach($kaidahItems as $item)
            @php $checked = !empty($checklist[$item['code']]); @endphp
            <div class="p-4 rounded-xl border {{ $checked ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-health-card' }} shadow-sm">
                <div class="flex items-start justify-between gap-4">
                    <div class="space-y-1">
                        <div class="flex items-center gap-2">
                            <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200">
                                {{ $item['code'] }}
                            </span>
                            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ $item['title'] }}</h3>
                        </div>
                        <p class="text-xs text-slate-600 dark:text-slate-300">{{ $item['desc'] }}</p>
                    </div>

                    <form method="POST" action="{{ route('vedika.claims.checklist.update', $id) }}">
                        @csrf
                        @method('PATCH')
                        <input type="hidden" name="item" value="{{ $item['code'] }}">
                        <input type="hidden" name="value" value="{{ $checked ? '0' : '1' }}">
                        <button
                            type="submit"
                            class="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors {{ $checked ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 border-slate-300 dark:bg-white/10 dark:border-white/20 text-slate-700 dark:text-slate-300 hover:bg-slate-200' }}"
                        >
                            {{ $checked ? 'Terpenuhi (Valid)' : 'Tandai Terpenuhi' }}
                        </button>
                    </form>
                </div>
            </div>
        @endforeach
    </div>
</div>
@endsection
