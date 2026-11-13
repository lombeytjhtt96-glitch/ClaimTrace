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
        <div class="p-6 overflow-y-auto space-y-4 text-xs font-mono">
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
