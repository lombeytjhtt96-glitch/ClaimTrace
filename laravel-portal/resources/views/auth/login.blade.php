<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full overflow-x-hidden">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>Masuk - {{ config('app.name', 'ClaimTrace JKN') }}</title>

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

    <!-- Tailwind / Vite Assets -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body
    x-data="{
        darkMode: localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches),
        nip: '198704202011012001',
        password: 'Password123!',
        captcha: 'TEST',
        toggleTheme() {
            this.darkMode = !this.darkMode;
            localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
            if (this.darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        },
        selectPersona(nipVal, pwdVal) {
            this.nip = nipVal;
            this.password = pwdVal;
            this.captcha = 'TEST';
        }
    }"
    :class="{ 'dark': darkMode }"
    class="min-h-full font-sans antialiased bg-slate-50 dark:bg-health-dark text-slate-800 dark:text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-bpjs-green selection:text-white overflow-x-hidden"
>
    <!-- Top Bar with Dark Mode Toggle -->
    <div class="w-full max-w-4xl mx-auto flex items-center justify-between pb-4">
        <div class="flex items-center gap-2">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-bpjs-green/10 text-bpjs-darkgreen dark:bg-emerald-500/20 dark:text-emerald-300 border border-bpjs-green/20">
                SSO Kedinasan BPJS Kesehatan
            </span>
            <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
                Protokol C03.04 Fail-Closed
            </span>
        </div>

        <!-- Light/Dark Mode Switcher -->
        <button
            @click="toggleTheme()"
            type="button"
            class="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-health-cardHover border border-slate-200 dark:border-white/10 transition-colors"
            aria-label="Alihkan tema gelap atau terang"
            :title="darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'"
        >
            <svg x-show="darkMode" class="w-4 h-4 text-health-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <svg x-show="!darkMode" class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
        </button>
    </div>

    <!-- Main Central Container -->
    <div class="sm:mx-auto sm:w-full sm:max-w-2xl my-auto">
        <!-- Logo and System Title -->
        <div class="text-center">
            <div class="mx-auto w-14 h-14 rounded-2xl bg-bpjs-green flex items-center justify-center text-white shadow-lg shadow-bpjs-green/20 mb-3">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
            </div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                ClaimTrace JKN
            </h1>
            <p class="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
                Portal Verifikator Klaim VEDIKA &amp; Pengendalian Fraud
            </p>
            <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Sistem Pendukung Keputusan Deteksi Anomali Klaim FKRTL
            </p>
        </div>

        <!-- Quick Switcher Persona Bar -->
        <div class="mt-6 p-3 rounded-2xl bg-white dark:bg-health-card border border-slate-200 dark:border-white/10 shadow-sm">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-white/5">
                <span class="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Direktori Akses Cepat Kedinasan (Quick Persona Switcher)
                </span>
                <span class="text-[10px] text-slate-400 font-mono">Pilih Akun Pengujian</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <!-- 1. Verifikator Medis Senior -->
                <button
                    type="button"
                    data-nip="198704202011012001"
                    data-persona="VERIFIKATOR_MEDIS"
                    @click="selectPersona('198704202011012001', 'Password123!')"
                    :class="nip === '198704202011012001' ? 'ring-2 ring-bpjs-green bg-bpjs-green/5 dark:bg-bpjs-green/10' : 'hover:bg-slate-50 dark:hover:bg-health-cardHover'"
                    class="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-left transition-all flex items-start justify-between"
                >
                    <div class="min-w-0">
                        <div class="text-xs font-semibold text-slate-900 dark:text-white truncate">dr. Siti Rahma, Sp.PK</div>
                        <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">NIP: 198704202011012001</div>
                        <div class="text-[10px] text-slate-600 dark:text-slate-300">Verifikator Medis Senior</div>
                    </div>
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 shrink-0">ADJUDICATE</span>
                </button>

                <!-- 2. Analis Forensik Anti-Fraud -->
                <button
                    type="button"
                    data-nip="199208152015031002"
                    data-persona="ANALIS_FRAUD"
                    @click="selectPersona('199208152015031002', 'Password123!')"
                    :class="nip === '199208152015031002' ? 'ring-2 ring-bpjs-green bg-bpjs-green/5 dark:bg-bpjs-green/10' : 'hover:bg-slate-50 dark:hover:bg-health-cardHover'"
                    class="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-left transition-all flex items-start justify-between"
                >
                    <div class="min-w-0">
                        <div class="text-xs font-semibold text-slate-900 dark:text-white truncate">Budi Santoso, S.Kom</div>
                        <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">NIP: 199208152015031002</div>
                        <div class="text-[10px] text-slate-600 dark:text-slate-300">Analis Forensik Anti-Fraud</div>
                    </div>
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 shrink-0">READ/VIEW</span>
                </button>

                <!-- 3. Administrator Kebijakan -->
                <button
                    type="button"
                    data-nip="198501012010011001"
                    data-persona="ADMINISTRATOR"
                    @click="selectPersona('198501012010011001', 'Password123!')"
                    :class="nip === '198501012010011001' ? 'ring-2 ring-bpjs-green bg-bpjs-green/5 dark:bg-bpjs-green/10' : 'hover:bg-slate-50 dark:hover:bg-health-cardHover'"
                    class="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-left transition-all flex items-start justify-between"
                >
                    <div class="min-w-0">
                        <div class="text-xs font-semibold text-slate-900 dark:text-white truncate">Hendra Wijaya, SE, Ak</div>
                        <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">NIP: 198501012010011001</div>
                        <div class="text-[10px] text-slate-600 dark:text-slate-300">Administrator Kebijakan</div>
                    </div>
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 shrink-0">ADMIN</span>
                </button>

                <!-- 4. Auditor Pengawasan (Read-Only) -->
                <button
                    type="button"
                    data-nip="199003152018011005"
                    data-persona="AUDITOR"
                    @click="selectPersona('199003152018011005', 'Password123!')"
                    :class="nip === '199003152018011005' ? 'ring-2 ring-bpjs-green bg-bpjs-green/5 dark:bg-bpjs-green/10' : 'hover:bg-slate-50 dark:hover:bg-health-cardHover'"
                    class="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-left transition-all flex items-start justify-between"
                >
                    <div class="min-w-0">
                        <div class="text-xs font-semibold text-slate-900 dark:text-white truncate">dr. Andi Pratama, MARS</div>
                        <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">NIP: 199003152018011005</div>
                        <div class="text-[10px] text-slate-600 dark:text-slate-300">Auditor Pengawasan (Read-Only)</div>
                    </div>
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 shrink-0">READ-ONLY</span>
                </button>
            </div>
        </div>

        <!-- Login Form Card -->
        <div data-testid="login-card" class="login-container mt-4 bg-white dark:bg-health-card py-6 px-4 shadow-xl border border-slate-200 dark:border-white/10 sm:rounded-2xl sm:px-8">
            <!-- Error Flash -->
            @if ($errors->any())
                <div class="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">
                    <div class="font-semibold mb-1">Terjadi Kesalahan Autentikasi:</div>
                    <ul class="list-disc pl-4 space-y-0.5">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form method="POST" action="{{ route('login') }}" class="space-y-4">
                @csrf

                <!-- NIP Input -->
                <div>
                    <label for="identifier" class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Nomor Induk Pegawai (NIP Kedinasan 18 Digit)
                    </label>
                    <div class="relative rounded-xl shadow-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                        </div>
                        <input
                            id="identifier"
                            name="identifier"
                            type="text"
                            inputmode="numeric"
                            maxlength="18"
                            pattern="\d{18}"
                            required
                            x-model="nip"
                            placeholder="Contoh: 198704202011012001"
                            class="block w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-health-dark text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bpjs-green focus:border-transparent transition-all tabular-nums"
                        >
                    </div>
                    <span class="text-[10px] text-slate-400 mt-1 block">Wajib 18 digit format NIP BKN atau BPJS Kesehatan.</span>
                </div>

                <!-- Password Input -->
                <div>
                    <label for="password" class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Kata Sandi Resmi SSO
                    </label>
                    <div class="relative rounded-xl shadow-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            maxlength="255"
                            required
                            x-model="password"
                            placeholder="Masukkan kata sandi resmi"
                            class="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-health-dark text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bpjs-green focus:border-transparent transition-all"
                        >
                    </div>
                </div>

                <!-- CAPTCHA Security Input -->
                <div>
                    <label for="captcha_input" class="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Verifikasi Keamanan (Math / Code CAPTCHA)
                    </label>
                    <div class="flex items-center gap-2">
                        <div class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-health-cardHover border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 select-none tracking-widest">
                            TEST
                        </div>
                        <input
                            id="captcha_input"
                            name="captcha_input"
                            type="text"
                            required
                            x-model="captcha"
                            placeholder="Masukkan kode di samping"
                            class="block flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-health-dark text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bpjs-green focus:border-transparent transition-all"
                        >
                        <input type="hidden" name="captcha_code" value="TEST">
                    </div>
                </div>

                <!-- Remember Me & Policy -->
                <div class="flex items-center justify-between text-xs pt-1">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="remember" class="w-4 h-4 rounded text-bpjs-green focus:ring-bpjs-green border-slate-300 dark:border-white/10 bg-white dark:bg-health-dark">
                        <span class="text-slate-600 dark:text-slate-300 text-[11px]">Ingat sesi selama 8 jam dinas</span>
                    </label>
                    <span class="text-[11px] text-slate-600 dark:text-slate-400">Zero-PHI Enforcement</span>
                </div>

                <!-- Submit Button -->
                <button
                    type="submit"
                    class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-bpjs-green hover:bg-bpjs-darkgreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bpjs-green shadow-sm transition-all"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                    </svg>
                    <span>Masuk ke Portal Verifikator VEDIKA</span>
                </button>
            </form>
        </div>
    </div>

    <!-- Minimalist Legal Compliance Footer -->
    <div class="w-full max-w-4xl mx-auto text-center pt-8 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
        <div>Kepatuhan Regulasi: UU PDP No. 27/2022, Perpres No. 82/2018, dan Permenkes No. 26/2021.</div>
        <div>ClaimTrace JKN &copy; {{ date('Y') }} BPJS Kesehatan. Seluruh Hak Cipta Dilindungi Undang-Undang.</div>
    </div>
</body>
</html>
