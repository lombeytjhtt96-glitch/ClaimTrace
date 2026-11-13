@extends('layouts.app')

@section('title', 'Form Pengajuan Ulang Klaim Susulan - ' . $id)

@section('content')
<div class="py-6 space-y-6 max-w-4xl mx-auto">
    <!-- Breadcrumb & Top Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
            <div class="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <a href="{{ route('vedika.queue') }}" class="hover:text-bpjs-green transition-colors">VEDIKA Antrean</a>
                <span>/</span>
                <a href="{{ route('vedika.claims.dossier', $id) }}" class="hover:text-bpjs-green transition-colors">{{ $id }}</a>
                <span>/</span>
                <span class="text-slate-800 dark:text-slate-200 font-semibold">Pengajuan Ulang Susulan</span>
            </div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-white mt-1">
                Formulir Pengajuan Ulang Klaim Susulan (Revisi Faskes)
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">
                Lengkapi perbaikan berkas digital, koding INA-CBG, atau penyesuaian tarif klaim tertunda
            </p>
        </div>

        <div class="flex items-center gap-2">
            <a href="{{ route('vedika.claims.dossier', $id) }}" class="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-bpjs-green transition-colors">
                Batal & Kembali
            </a>
        </div>
    </div>

    <!-- Claim Context Card -->
    <div class="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
            <span class="text-[11px] font-semibold text-slate-400 uppercase">ID Klaim & Faskes</span>
            <div class="font-bold font-mono text-slate-900 dark:text-white mt-0.5">{{ $id }}</div>
            <div class="text-slate-600 dark:text-slate-300">{{ $dossier['fpk_metadata']['nama_faskes'] ?? 'RSUP Persahabatan' }}</div>
        </div>
        <div>
            <span class="text-[11px] font-semibold text-slate-400 uppercase">Diagnosa & INA-CBG Awal</span>
            <div class="font-bold font-mono text-bpjs-darkgreen dark:text-emerald-400 mt-0.5">{{ $dossier['fpk_metadata']['kode_cbg'] ?? 'I-4-10-III' }}</div>
            <div class="text-slate-600 dark:text-slate-300">{{ $dossier['fpk_metadata']['deskripsi_cbg'] ?? 'Penyakit Jantung Iskemik Berat' }}</div>
        </div>
        <div>
            <span class="text-[11px] font-semibold text-slate-400 uppercase">Status Pengajuan</span>
            <div class="mt-0.5">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                    Menunggu Klarifikasi / Susulan
                </span>
            </div>
            <div class="text-slate-500 text-[11px] mt-1 font-mono">Revisi Ke-{{ (session("resubmission_count.{$id}", 1)) }}</div>
        </div>
    </div>

    <!-- Error Summary if any -->
    @if($errors->any())
        <div class="p-4 rounded-xl border border-rose-300 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 text-xs space-y-1">
            <div class="font-bold uppercase tracking-wider">Terdapat Kesalahan Input:</div>
            <ul class="list-disc list-inside space-y-0.5 text-[11px]">
                @foreach($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <!-- Resubmission Form -->
    <div class="p-6 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card shadow-sm">
        <form method="POST" action="{{ route('vedika.claims.resubmit', $id) }}" class="space-y-5 text-xs">
            @csrf

            <!-- Revision Notes (Catatan Faskes) -->
            <div>
                <label for="catatan_faskes" class="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Catatan Perbaikan / Klarifikasi Faskes <span class="text-rose-500">*</span>
                </label>
                <textarea
                    id="catatan_faskes"
                    name="catatan_faskes"
                    rows="4"
                    required
                    placeholder="Uraikan kelengkapan berkas, perbaikan koding, atau justifikasi klinis yang diperbaiki..."
                    class="w-full text-xs rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-health-dark p-3 text-slate-900 dark:text-white focus:ring-1 focus:ring-bpjs-green font-sans"
                >{{ old('catatan_faskes', 'Dokumen TTE DPJP telah dilengkapi sesuai permintaan verifikator.') }}</textarea>
                <p class="text-[11px] text-slate-400 mt-1">Minimal 3 karakter. Teks akan disanitasi secara otomatis sesuai ketentuan Zero-PHI.</p>
            </div>

            <!-- Two-Column Fields: ICD-10 & CBG -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label for="perbaikan_icd10" class="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        Koreksi Koding ICD-10 Diagnosis (Opsional)
                    </label>
                    <input
                        type="text"
                        id="perbaikan_icd10"
                        name="perbaikan_icd10"
                        value="{{ old('perbaikan_icd10', 'I25.1') }}"
                        placeholder="Contoh: I25.1, H25.0"
                        class="w-full text-xs font-mono rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-health-dark px-3 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-bpjs-green"
                    >
                </div>

                <div>
                    <label for="perbaikan_cbg" class="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        Koreksi Kode INA-CBG (Opsional)
                    </label>
                    <input
                        type="text"
                        id="perbaikan_cbg"
                        name="perbaikan_cbg"
                        value="{{ old('perbaikan_cbg', 'I-4-10-I') }}"
                        placeholder="Contoh: I-4-10-I, C-4-13-I"
                        class="w-full text-xs font-mono rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-health-dark px-3 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-bpjs-green"
                    >
                </div>
            </div>

            <!-- Revised Tariff -->
            <div>
                <label for="tarif_revisi_rp" class="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Tarif Pengajuan Hasil Revisi (Nominal Rupiah)
                </label>
                <input
                    type="number"
                    id="tarif_revisi_rp"
                    name="tarif_revisi_rp"
                    min="0"
                    step="1000"
                    value="{{ old('tarif_revisi_rp', 4500000) }}"
                    class="w-full text-xs font-mono rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-health-dark px-3 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-bpjs-green"
                >
                <p class="text-[11px] text-slate-400 mt-1">Isi nominal tarif revisi tanpa titik koma. Rekonsiliasi FKL47/FKL48 akan disesuaikan otomatis.</p>
            </div>

            <!-- Submit Button Bar -->
            <div class="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3">
                <a href="{{ route('vedika.claims.dossier', $id) }}" class="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold">
                    Batal
                </a>
                <button
                    type="submit"
                    class="px-5 py-2 rounded-lg bg-bpjs-green hover:bg-bpjs-darkgreen text-white font-bold transition-colors shadow-sm"
                >
                    Kirim Pengajuan Ulang Susulan
                </button>
            </div>
        </form>
    </div>
</div>
@endsection
