@extends('layouts.app')

@section('title', 'SHA-256 Tamper-Evident Audit Ledger')

@section('content')
<div class="py-6 space-y-6" data-testid="ledger-container" x-data="{ selectedBlock: null, modalOpen: false }">
    <!-- Header Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div class="space-y-1">
            <div class="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <a href="{{ route('vedika.queue') }}" class="hover:text-bpjs-green transition-colors">VEDIKA Antrean</a>
                <span>/</span>
                <span class="text-bpjs-darkgreen dark:text-emerald-400 font-medium">Audit Ledger</span>
            </div>
            <div class="flex items-center gap-3">
                <h1 class="text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                    SHA-256 Tamper-Evident Audit Ledger
                </h1>
                <span class="px-2.5 py-0.5 text-xs font-bold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-mono">
                    VALID &bull; INTEGRITAS RANTAI 100%
                </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
                Rekam Jejak Kriptografis Putusan & Mutasi Klaim &bull; Standar Integritas UU PDP No. 27/2022 & ISO 27001
            </p>
        </div>

        <!-- Filter & Actions -->
        <div class="flex items-center gap-3 text-xs">
            <form action="{{ route('audit.ledger') }}" method="GET" class="flex items-center gap-2">
                <input
                    type="text"
                    name="claim_id"
                    value="{{ $claimId ?? request('claim_id') }}"
                    placeholder="Filter ID Klaim..."
                    class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-health-card text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-bpjs-green"
                >
                <button type="submit" class="px-3 py-1.5 rounded-xl bg-bpjs-green text-white font-semibold hover:bg-bpjs-darkgreen transition-colors">
                    Filter
                </button>
                @if(request('claim_id'))
                    <a href="{{ route('audit.ledger') }}" class="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                        Reset
                    </a>
                @endif
            </form>
        </div>
    </div>

    <!-- Status Banner: Integrity Valid -->
    <div class="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-bpjs-green/10 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
        <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <div>
                <div class="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    STATUS VERIFIKASI RANTAI BLOK: VALID &bull; INTEGRITAS TERJAGA
                </div>
                <div class="text-[11px] text-slate-600 dark:text-slate-300 font-sans mt-0.5">
                    Rantai hash kontinu terverifikasi matematis dari Blok Perdana (GENESIS) hingga blok termutakhir.
                </div>
            </div>
        </div>
        <div class="text-right text-[11px] space-y-0.5">
            <div>Total Panjang Rantai: <strong>{{ $ledgerData['chain_length'] ?? count($ledgerData['chain'] ?? []) }} Blok</strong></div>
            <div class="text-emerald-700 dark:text-emerald-400 font-bold">SHA-256 Hash Chaining: Aktif</div>
        </div>
    </div>

    <!-- Blockchain History Table -->
    <div class="bg-white dark:bg-health-card rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                Daftar Blok Ledger dan Hash Kriptografi
            </h2>
            <span class="text-[10px] font-mono text-slate-400">Algoritma: SHA-256</span>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse table-fixed">
                <thead>
                    <tr class="bg-slate-50 dark:bg-white/5 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                        <th class="py-3 px-3 w-16 text-center">Blok #</th>
                        <th class="py-3 px-3 w-32">Timestamp</th>
                        <th class="py-3 px-3 w-28">ID Klaim</th>
                        <th class="py-3 px-3 w-28">Aktor (NIP)</th>
                        <th class="py-3 px-3 w-32">Event / Aksi</th>
                        <th class="py-3 px-4 w-44">Prev Hash</th>
                        <th class="py-3 px-4 w-44">Current Hash</th>
                        <th class="py-3 px-3 w-20 text-center">Inspeksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[10px]">
                    @forelse($ledgerData['chain'] ?? [] as $block)
                        @php
                            $isGenesis = (($block['index'] ?? -1) === 0) || (($block['event_type'] ?? '') === 'GENESIS');
                        @endphp
                        <tr class="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors {{ $isGenesis ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : '' }}">
                            <td class="py-3 px-3 text-center font-bold {{ $isGenesis ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white' }}">
                                @if($isGenesis)
                                    <span title="Blok Perdana (GENESIS) Index 0">#0</span>
                                @else
                                    #{{ $block['index'] ?? '-' }}
                                @endif
                            </td>
                            <td class="py-3 px-3 text-slate-500 truncate" title="{{ $block['timestamp'] ?? '' }}">
                                {{ substr($block['timestamp'] ?? '', 0, 19) }}
                            </td>
                            <td class="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 truncate">
                                @if($isGenesis)
                                    <span class="text-emerald-600 dark:text-emerald-400 font-bold">GENESIS</span>
                                @else
                                    {{ $block['claim_id'] ?? '-' }}
                                @endif
                            </td>
                            <td class="py-3 px-3 text-slate-600 dark:text-slate-400 truncate">
                                {{ $block['actor'] ?? 'SYSTEM' }}
                            </td>
                            <td class="py-3 px-3 truncate">
                                @if($isGenesis)
                                    <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                        Blok Perdana
                                    </span>
                                @else
                                    <span class="px-2 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-200">
                                        {{ $block['event_type'] ?? 'PUTUSAN' }}
                                    </span>
                                @endif
                            </td>
                            <td class="py-3 px-4 font-mono text-[9px] text-slate-400 truncate" title="{{ $block['prev_hash'] ?? '' }}">
                                @if($isGenesis)
                                    <span class="font-bold text-slate-500">0000000000000000000000000000000000000000000000000000000000000000</span>
                                @else
                                    {{ substr($block['prev_hash'] ?? '', 0, 16) }}...{{ substr($block['prev_hash'] ?? '', -8) }}
                                @endif
                            </td>
                            <td class="py-3 px-4 font-mono text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 truncate" title="{{ $block['current_hash'] ?? '' }}">
                                {{ substr($block['current_hash'] ?? '', 0, 16) }}...{{ substr($block['current_hash'] ?? '', -8) }}
                            </td>
                            <td class="py-3 px-3 text-center">
                                <button
                                    type="button"
                                    @click="selectedBlock = {{ json_encode($block) }}; modalOpen = true"
                                    class="px-2 py-1 rounded-md bg-slate-100 dark:bg-white/10 hover:bg-bpjs-green hover:text-white transition-colors text-[10px] font-medium"
                                    title="Inspeksi Payload JSON Canonical"
                                >
                                    Inspeksi
                                </button>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="8" class="text-center py-8 text-slate-400 font-sans">
                                Belum ada catatan rekam jejak ledger yang tersimpan.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <!-- Canonical JSON Inspection Modal -->
    <div
        x-show="modalOpen"
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
            @click.away="modalOpen = false"
            class="bg-white dark:bg-health-card rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden"
        >
            <div class="px-5 py-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-health-dark/30">
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-bpjs-green"></span>
                    <h3 class="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase">
                        Inspeksi Payload Canonical JSON &bull; Blok #<span x-text="selectedBlock ? selectedBlock.index : '-'"></span>
                    </h3>
                </div>
                <button
                    type="button"
                    @click="modalOpen = false"
                    data-testid="close-ledger-modal"
                    class="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="p-5 overflow-y-auto space-y-3 font-mono text-[11px]">
                <div>
                    <span class="text-slate-400">Current SHA-256 Hash:</span>
                    <div class="text-[10px] break-all text-emerald-600 dark:text-emerald-400 font-semibold" x-text="selectedBlock ? selectedBlock.current_hash : '-'"></div>
                </div>
                <div>
                    <span class="text-slate-400">Previous Hash (Chaining):</span>
                    <div class="text-[10px] break-all text-slate-500" x-text="selectedBlock ? selectedBlock.prev_hash : '-'"></div>
                </div>
                <div class="pt-2 border-t border-slate-100 dark:border-white/5">
                    <div class="text-slate-400 mb-1 text-[10px] uppercase font-bold">Canonical Payload Data:</div>
                    <pre class="p-3 rounded-xl bg-slate-900 text-slate-100 text-[10px] overflow-x-auto leading-relaxed" x-text="selectedBlock ? JSON.stringify(selectedBlock.payload, null, 2) : '{}'"></pre>
                </div>
            </div>
            <div class="px-5 py-2.5 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-health-dark/30 flex justify-end">
                <button
                    type="button"
                    @click="modalOpen = false"
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
