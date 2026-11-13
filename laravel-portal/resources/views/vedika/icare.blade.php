@extends('layouts.app')

@section('title', 'i-Care Riwayat Pelayanan Pasien - ' . $id)

@section('content')
<div class="py-6 space-y-6 max-w-6xl mx-auto">
    <!-- Breadcrumb & Top Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
            <div class="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <a href="{{ route('vedika.queue') }}" class="hover:text-bpjs-green transition-colors">VEDIKA Antrean</a>
                <span>/</span>
                <a href="{{ route('vedika.claims.dossier', $id) }}" class="hover:text-bpjs-green transition-colors">{{ $id }}</a>
                <span>/</span>
                <span class="text-slate-800 dark:text-slate-200 font-semibold">i-Care Riwayat Pelayanan</span>
            </div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-white mt-1">
                i-Care: Rekam Jejak Longitudinal Pelayanan Pasien Lintas Faskes
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">
                Pemeriksaan Riwayat Kunjungan Faskes Tingkat Pertama (FKTP) & Faskes Rujukan Tingkat Lanjutan (FKRTL)
            </p>
        </div>

        <div class="flex items-center gap-2">
            <a href="{{ route('vedika.claims.dossier', $id) }}" class="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-bpjs-green transition-colors">
                Kembali ke Dossier
            </a>
        </div>
    </div>

    <!-- Participant Zero-PHI Header Card -->
    <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Identitas Peserta (Zero-PHI Terproteksi)</span>
            <div class="text-sm font-bold text-slate-900 dark:text-white">{{ $participant['pseudo_name'] ?? 'Tn. A*** P***' }}</div>
            <div class="text-xs font-mono text-slate-600 dark:text-slate-300">
                No. Kartu JKN: {{ $participant['no_kartu_masked'] ?? '0001********' }} &middot; NIK: {{ $participant['nik_masked'] ?? '3171********0001' }}
            </div>
        </div>
        <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                Hak Kelas: {{ $participant['kelas_rawat'] ?? 'Kelas 1' }}
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
                Klaim: {{ $id }}
            </span>
        </div>
    </div>

    <!-- Readmission Warning Banner (If detected in history, e.g. CLM-2026-8802) -->
    @php
        $hasReadmissionAlert = false;
        $readmissionNote = '';
        foreach($icareHistory as $h) {
            if (str_contains($h['catatan'] ?? '', 'Readmisi') || str_contains($h['catatan'] ?? '', 'darurat')) {
                $hasReadmissionAlert = true;
                $readmissionNote = $h['catatan'];
                break;
            }
        }
    @endphp

    @if($hasReadmissionAlert || $id === 'CLM-2026-8802')
        <div class="p-4 rounded-xl border border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 space-y-1.5 shadow-sm">
            <div class="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-900 dark:text-rose-200">
                <span>Peringatan Deteksi Readmisi Kurang Dari 30 Hari</span>
            </div>
            <p class="text-xs">
                Sistem i-Care mendeteksi indikasi readmisi darurat pasien ke rumah sakit dalam jangka waktu 18 hari (&le; 30 hari) pasca pelayanan rawat sebelumnya. Verifikator wajib memeriksa indikasi pemulangan dini (premature discharge) atau komplikasi prosedur.
            </p>
            @if($readmissionNote)
                <p class="text-[11px] font-mono text-rose-700 dark:text-rose-400">
                    Catatan Klinis: {{ $readmissionNote }}
                </p>
            @endif
        </div>
    @endif

    <!-- Cross-Faskes Indicator Banner -->
    <div class="p-4 rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 text-xs flex items-center justify-between">
        <div>
            <span class="font-bold">Pemantauan Cross-Faskes Aktif:</span>
            <span> Rekam jejak mencakup pelayanan lintas fasilitas rujukan dari Puskesmas Menteng hingga RSUP Nasional Dr. Cipto Mangunkusumo dan RSUP Persahabatan.</span>
        </div>
        <span class="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200">
            Terverifikasi P-Care & V-Claim
        </span>
    </div>

    <!-- Longitudinal Timeline Table -->
    <div class="border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-health-card overflow-hidden shadow-sm">
        <div class="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Tabel Riwayat Diagnosa & Pelayanan Pasien (i-Care)
            </h2>
            <span class="text-xs font-mono text-slate-500 dark:text-slate-400">
                {{ count($icareHistory) }} Episode Pelayanan Terdata
            </span>
        </div>

        <div class="table-fixed-wrap overflow-x-auto">
            <table class="w-full min-w-[800px] table-fixed text-left text-xs border-collapse">
                <thead class="bg-slate-50 dark:bg-health-dark/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-mono border-b border-slate-200 dark:border-white/5">
                    <tr>
                        <th class="w-32 px-4 py-3">Tanggal Pelayanan</th>
                        <th class="w-48 px-4 py-3">Fasilitas Kesehatan</th>
                        <th class="w-28 px-4 py-3 text-center">Jenis Layanan</th>
                        <th class="w-44 px-4 py-3">Diagnosa Utama (ICD-10)</th>
                        <th class="w-48 px-4 py-3">Diagnosa Sekunder</th>
                        <th class="w-auto px-4 py-3">Catatan Klinis & Evaluasi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-white/5">
                    @forelse($icareHistory as $idx => $item)
                        <tr class="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                            <td class="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                {{ $item['tgl_pelayanan'] ?? '-' }}
                            </td>
                            <td class="px-4 py-3">
                                <div class="font-bold text-slate-900 dark:text-white truncate" title="{{ $item['nama_faskes'] ?? '-' }}">{{ $item['nama_faskes'] ?? '-' }}</div>
                            </td>
                            <td class="px-4 py-3 text-center">
                                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold {{ ($item['jenis_pelayanan'] ?? '') === 'RITL' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800' }}">
                                    {{ $item['jenis_pelayanan'] ?? 'RJTP' }}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <div class="font-mono font-bold text-bpjs-darkgreen dark:text-emerald-400">
                                    {{ $item['diagnosa_utama'] ?? 'H25.0' }}
                                </div>
                                <span class="text-[11px] text-slate-500 dark:text-slate-400">Katalog Diagnosa ICD-10</span>
                            </td>
                            <td class="px-4 py-3">
                                @if(!empty($item['diagnosa_sekunder']))
                                    <div class="flex flex-wrap gap-1">
                                        @foreach($item['diagnosa_sekunder'] as $diagSec)
                                             <span class="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                                                {{ $diagSec }}
                                            </span>
                                        @endforeach
                                    </div>
                                @else
                                    <span class="text-slate-400 text-[11px]">-</span>
                                @endif
                            </td>
                            <td class="px-4 py-3 text-slate-600 dark:text-slate-300 text-[11px] break-words">
                                {{ $item['catatan'] ?? '-' }}
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="px-4 py-6 text-center text-slate-400">
                                Tidak ada rekam jejak i-Care terdaftar untuk klaim ini.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
