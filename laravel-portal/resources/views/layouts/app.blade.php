<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full overflow-x-hidden">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'ClaimTrace JKN') }} - @yield('title', 'Portal Verifikator VEDIKA & Anti-Fraud')</title>

    <!-- FOUC Prevention Script for Dark Mode Persistence -->
    <script>
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    </script>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

    <!-- Vite Assets -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body
    x-data="{
        darkMode: localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches),
        sidebarOpen: false,
        toggleTheme() {
            this.darkMode = !this.darkMode;
            localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
            if (this.darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }"
    :class="{ 'dark': darkMode }"
    class="h-full font-sans antialiased bg-slate-50 dark:bg-health-dark text-slate-800 dark:text-slate-100 flex flex-col overflow-x-hidden selection:bg-bpjs-green selection:text-white"
>
    <!-- Top Enterprise Header -->
    <header class="h-16 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-health-card/95 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between no-print overflow-x-hidden">
        <!-- Brand and Mobile Menu Button -->
        <div class="flex items-center gap-3">
            <button
                @click="sidebarOpen = !sidebarOpen"
                class="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-health-cardHover rounded-lg transition-colors"
                aria-label="Buka menu navigasi"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
            </button>

            <!-- BPJS Shield Emblem SVG -->
            <a href="{{ url('/cockpit') }}" class="flex items-center gap-3 group">
                <div class="w-9 h-9 rounded-xl bg-bpjs-green flex items-center justify-center text-white shadow-sm shadow-bpjs-green/30 group-hover:bg-bpjs-darkgreen transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                </div>
                <div class="flex flex-col">
                    <div class="flex items-center gap-2">
                        <span class="text-base font-bold tracking-tight text-slate-900 dark:text-white">ClaimTrace JKN</span>
                        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-bpjs-green/10 text-bpjs-darkgreen dark:bg-emerald-500/20 dark:text-emerald-300 border border-bpjs-green/20">VEDIKA</span>
                    </div>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">Sistem Pendukung Keputusan Deteksi Anomali Klaim</span>
                </div>
            </a>
        </div>

        <!-- Center: Live WIB Server Clock and Engine Health -->
        <div class="hidden md:flex items-center gap-4">
            <!-- Live WIB Regional Server Clock -->
            <div
                x-data="{
                    timeStr: '',
                    updateClock() {
                        const now = new Date();
                        const datePart = new Intl.DateTimeFormat('id-ID', {
                            timeZone: 'Asia/Jakarta',
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        }).format(now);
                        const timePart = new Intl.DateTimeFormat('id-ID', {
                            timeZone: 'Asia/Jakarta',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                        }).format(now).replace(/\./g, ':');
                        this.timeStr = datePart + ', ' + timePart + ' WIB';
                    }
                }"
                x-init="updateClock(); setInterval(() => updateClock(), 1000)"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-health-card border border-slate-200 dark:border-white/10 text-xs font-mono font-medium text-slate-600 dark:text-slate-300"
            >
                <svg class="w-3.5 h-3.5 text-bpjs-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span x-text="timeStr" class="tabular-nums">Memuat waktu WIB...</span>
            </div>

            <!-- FastAPI Engine Status Pill -->
            <div id="engine-health" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>FastAPI: Terhubung (8000)</span>
            </div>
        </div>

        <!-- Right: Theme Switcher and User Profile Pill -->
        <div class="flex items-center gap-3">
            <!-- Light/Dark Mode Switcher -->
            <button
                @click="toggleTheme()"
                type="button"
                class="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-health-cardHover border border-slate-200 dark:border-white/10 transition-colors"
                aria-label="Alihkan tema gelap/terang"
                :title="darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'"
            >
                <!-- Sun Icon (Dark Mode Active) -->
                <svg x-show="darkMode" class="w-4 h-4 text-health-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                <!-- Moon Icon (Light Mode Active) -->
                <svg x-show="!darkMode" class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
            </button>

            <!-- Verifier Profile Pill -->
            <div class="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-white/10">
                <div class="w-8 h-8 rounded-full bg-bpjs-darkgreen text-white font-semibold text-xs flex items-center justify-center">
                    DR
                </div>
                <div class="hidden sm:flex flex-col text-left">
                    <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">dr. Rizky Pratama, Sp.A</span>
                    <span class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">NIP: 198704202011012001</span>
                </div>
            </div>
        </div>
    </header>

    <!-- App Body: Sidebar + Main Content -->
    <div class="flex-1 flex min-w-0 overflow-x-hidden">
        <!-- Desktop Sidebar Navigation -->
        <aside class="w-64 shrink-0 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-health-card hidden lg:flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)] no-print">
            <nav class="space-y-1">
                <!-- 1. Cockpit -->
                <a
                    href="{{ url('/cockpit') }}"
                    class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all {{ request()->is('cockpit*') || request()->is('/') ? 'bg-bpjs-green text-white shadow-sm shadow-bpjs-green/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-health-cardHover' }}"
                >
                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                        </svg>
                        <span>Cockpit Eksekutif</span>
                    </div>
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-mono {{ request()->is('cockpit*') || request()->is('/') ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400' }}">1.7M</span>
                </a>

                <!-- 2. VEDIKA Antrean -->
                <a
                    href="{{ url('/vedika') }}"
                    class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all {{ request()->is('vedika*') && !request()->is('vedika/dossier*') && !request()->is('vedika/decision*') ? 'bg-bpjs-green text-white shadow-sm shadow-bpjs-green/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-health-cardHover' }}"
                >
                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span>VEDIKA Antrean FPK</span>
                    </div>
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-mono {{ request()->is('vedika*') && !request()->is('vedika/dossier*') && !request()->is('vedika/decision*') ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' }}">Antrean</span>
                </a>

                <!-- 3. Bedah Dossier -->
                <a
                    href="{{ url('/dossier') }}"
                    class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all {{ request()->is('*dossier*') ? 'bg-bpjs-green text-white shadow-sm shadow-bpjs-green/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-health-cardHover' }}"
                >
                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                        </svg>
                        <span>Bedah Dossier Digital</span>
                    </div>
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-mono {{ request()->is('*dossier*') ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400' }}">6 Dok</span>
                </a>

                <!-- 4. Konsol Putusan -->
                <a
                    href="{{ url('/putusan') }}"
                    class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all {{ request()->is('*putusan*') || request()->is('*decision*') ? 'bg-bpjs-green text-white shadow-sm shadow-bpjs-green/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-health-cardHover' }}"
                >
                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                        <span>Konsol Putusan 4-Status</span>
                    </div>
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-mono {{ request()->is('*putusan*') || request()->is('*decision*') ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }}">SLA 10 HK</span>
                </a>

                <!-- 5. Laporan BAHV -->
                <a
                    href="{{ url('/bahv') }}"
                    class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all {{ request()->is('*bahv*') || request()->is('reports/bahv*') ? 'bg-bpjs-green text-white shadow-sm shadow-bpjs-green/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-health-cardHover' }}"
                >
                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                        </svg>
                        <span>Laporan dan BAHV Resmi</span>
                    </div>
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-mono {{ request()->is('*bahv*') ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400' }}">PDF</span>
                </a>

                <!-- 6. Audit Ledger -->
                <a
                    href="{{ url('/ledger') }}"
                    class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all {{ request()->is('*ledger*') ? 'bg-bpjs-green text-white shadow-sm shadow-bpjs-green/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-health-cardHover' }}"
                >
                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                        <span>Audit Ledger SHA-256</span>
                    </div>
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-mono {{ request()->is('*ledger*') ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400' }}">Immutable</span>
                </a>

                <!-- 7. Pengaturan -->
                <a
                    href="{{ url('/pengaturan') }}"
                    class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all {{ request()->is('pengaturan*') || request()->is('settings*') ? 'bg-bpjs-green text-white shadow-sm shadow-bpjs-green/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-health-cardHover' }}"
                >
                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <span>Pengaturan Sistem</span>
                    </div>
                </a>
            </nav>

            <!-- Bottom Legal Footprint -->
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-health-dark/50 border border-slate-200 dark:border-white/5 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <div class="font-medium text-slate-700 dark:text-slate-300">Regulasi dan Privasi JKN</div>
                <p class="leading-relaxed">Sesuai UU PDP No. 27/2022, Perpres No. 82/2018, dan Permenkes No. 26/2021.</p>
                <div class="pt-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">Zero-PHI Enforcement</div>
            </div>
        </aside>

        <!-- Mobile Drawer Overlay -->
        <div
            x-show="sidebarOpen"
            x-transition:enter="transition-opacity ease-linear duration-200"
            x-transition:enter-start="opacity-0"
            x-transition:enter-end="opacity-100"
            x-transition:leave="transition-opacity ease-linear duration-200"
            x-transition:leave-start="opacity-100"
            x-transition:leave-end="opacity-0"
            @click="sidebarOpen = false"
            class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden"
            style="display: none;"
        ></div>

        <!-- Mobile Off-Canvas Drawer -->
        <aside
            x-show="sidebarOpen"
            x-transition:enter="transition ease-in-out duration-300 transform"
            x-transition:enter-start="-translate-x-full"
            x-transition:enter-end="translate-x-0"
            x-transition:leave="transition ease-in-out duration-300 transform"
            x-transition:leave-start="translate-x-0"
            x-transition:leave-end="-translate-x-full"
            class="fixed top-0 bottom-0 left-0 w-72 bg-white dark:bg-health-card border-r border-slate-200 dark:border-white/10 z-50 lg:hidden flex flex-col justify-between p-4 shadow-2xl"
            style="display: none;"
        >
            <div class="space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                    <span class="text-sm font-bold text-slate-900 dark:text-white">Menu Navigasi</span>
                    <button @click="sidebarOpen = false" class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-health-cardHover">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <nav class="space-y-1">
                    <a href="{{ url('/cockpit') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-health-cardHover">Cockpit Eksekutif</a>
                    <a href="{{ url('/vedika') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-health-cardHover">VEDIKA Antrean FPK</a>
                    <a href="{{ url('/dossier') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-health-cardHover">Bedah Dossier Digital</a>
                    <a href="{{ url('/putusan') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-health-cardHover">Konsol Putusan 4-Status</a>
                    <a href="{{ url('/bahv') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-health-cardHover">Laporan dan BAHV Resmi</a>
                    <a href="{{ url('/ledger') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-health-cardHover">Audit Ledger SHA-256</a>
                    <a href="{{ url('/pengaturan') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-health-cardHover">Pengaturan Sistem</a>
                </nav>
            </div>
            <div class="text-[11px] text-slate-400 font-mono">ClaimTrace JKN v1.0.0</div>
        </aside>

        <!-- Main Content Area: Responsive with Anti-Overflow Discipline -->
        <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
            <!-- Global Flash Messages -->
            @if(session('success'))
                <div class="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        <span>{{ session('success') }}</span>
                    </div>
                </div>
            @endif

            @if(session('error'))
                <div class="mb-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        <span>{{ session('error') }}</span>
                    </div>
                </div>
            @endif

            <!-- View Content Injection -->
            @yield('content')
        </main>
    </div>

    <!-- Minimalist Sticky Footer -->
    <footer class="border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-health-card/80 py-3 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 no-print overflow-x-hidden">
        <div class="flex items-center gap-2">
            <span class="font-semibold text-slate-700 dark:text-slate-300">ClaimTrace JKN</span>
            <span>&copy; {{ date('Y') }} BPJS Kesehatan. Hak Cipta Dilindungi Undang-Undang.</span>
        </div>
        <div class="flex items-center gap-3 text-[11px] font-mono">
            <span>FastAPI 3.14 + DuckDB OLAP</span>
            <span>&bull;</span>
            <span>Tamper-Evident SHA-256</span>
        </div>
    </footer>
</body>
</html>
