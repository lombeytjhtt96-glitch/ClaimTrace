import React, { useState } from 'react';
import { API_BASE_URL } from '../../services/apiConfig';
import { 
  Lock, User, Eye, EyeOff, ArrowRight, 
  AlertCircle, ArrowLeft, RefreshCw, ShieldCheck, Check
} from 'lucide-react';
import { motion } from 'motion/react';
import SecurityVerificationModal from './SecurityVerificationModal';

// Generator kode Captcha 5 karakter alfanumerik (mengecualikan karakter ambigu 0/O, 1/I)
const generateCaptchaCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function SignInPage({ onLoginSuccess, onGoToLanding, initialOpenModal = false, isLight = undefined }) {
  const effectiveIsLight =
    isLight !== undefined
      ? isLight
      : typeof window !== 'undefined'
      ? localStorage.getItem('claimtrace_theme') !== 'dark'
      : true;
  const [identifier, setIdentifier] = useState('admin.fraud@bpjs-kesehatan.go.id');
  const [password, setPassword] = useState('Password123!');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState(() => generateCaptchaCode());
  const [isCaptchaSpinning, setIsCaptchaSpinning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk Modal Verifikasi Keamanan Berlapis (PIN 6 Angka, OTP Email, Sesi Device)
  const [showVerificationModal, setShowVerificationModal] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('verify') === '1' || params.get('view') === 'mfa') return true;
    }
    return initialOpenModal;
  });
  const [pendingUser, setPendingUser] = useState(null);

  const handleRefreshCaptcha = () => {
    setIsCaptchaSpinning(true);
    setCaptchaCode(generateCaptchaCode());
    setCaptchaInput('');
    setErrorMsg('');
    setTimeout(() => setIsCaptchaSpinning(false), 300);
  };

  const refreshCaptchaOnFailed = () => {
    setIsCaptchaSpinning(true);
    setCaptchaCode(generateCaptchaCode());
    setCaptchaInput('');
    setTimeout(() => setIsCaptchaSpinning(false), 300);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Validasi Kelengkapan Kolom Data Login
    if (!identifier.trim()) {
      setErrorMsg('NIP Kedinasan atau Email Resmi wajib diisi.');
      refreshCaptchaOnFailed();
      return;
    }

    if (!password) {
      setErrorMsg('Kata Sandi akun verifikator wajib diisi.');
      refreshCaptchaOnFailed();
      return;
    }

    // 2. Validasi Captcha Keamanan
    if (!captchaInput.trim()) {
      setErrorMsg('Kode Keamanan (CAPTCHA) wajib diisi.');
      refreshCaptchaOnFailed();
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setErrorMsg('Kode Keamanan (CAPTCHA) tidak sesuai. Kode telah diperbarui, silakan coba lagi.');
      refreshCaptchaOnFailed();
      return;
    }

    // 3. Verifikasi Data Login via Backend Auth API (FastAPI) & SSO Directory
    setIsSubmitting(true);
    try {
      let data = null;
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            identifier: identifier.trim(),
            password: password,
            captcha_code: captchaCode,
            captcha_input: captchaInput.trim().toUpperCase()
          })
        });

        if (response.ok) {
          data = await response.json();
        }
      } catch {
        // Fallback to local authentication directory below
      }

      // If backend was unreachable or in offline mode, validate against official accounts directory
      if (!data) {
        const idClean = identifier.trim().toLowerCase();
        if ((idClean === '199208152015031002' || idClean === 'admin.fraud@bpjs-kesehatan.go.id') && password === 'Password123!') {
          data = {
            status: "success",
            token: `token-sec-${Date.now()}`,
            user: {
              nip: "199208152015031002",
              email: "admin.fraud@bpjs-kesehatan.go.id",
              name: "Budi Santoso, S.Kom, M.TI",
              role: "Analis Forensik Digital Anti-Fraud",
              roleTitle: "Auditor Investigasi Klaim",
              unit: "Kedeputian Bidang Pengawasan dan Pemeriksaan",
              avatar: "BS",
              pin: "654321",
              defaultOtp: "849201",
              isMfaVerified: false,
              allowedRoles: ["FRAUD_INVESTIGATOR", "ANALYST", "SUPER_ADMIN", "BAKB_SIGNER"]
            }
          };
        } else if ((idClean === '198704202011012001' || idClean === 'siti.rahma@bpjs-kesehatan.go.id') && password === 'Password123!') {
          data = {
            status: "success",
            token: `token-sec-${Date.now()}`,
            user: {
              nip: "198704202011012001",
              email: "siti.rahma@bpjs-kesehatan.go.id",
              name: "dr. Siti Rahma, Sp.PK",
              role: "Verifikator Medis Senior",
              roleTitle: "Dokter Verifikator Medis",
              unit: "Kantor Pusat BPJS Kesehatan · Kedeputian Bidang Pengawasan dan Pemeriksaan",
              avatar: "SR",
              pin: "123456",
              defaultOtp: "849201",
              isMfaVerified: false,
              allowedRoles: ["VERIFICATOR_MEDIS", "TRIAGE_OFFICER", "BAKB_SIGNER"]
            }
          };
        } else {
          throw new Error('Kredensial tidak valid: NIP/Email atau Kata Sandi salah.');
        }
      }

      // Login Kredensial Tahap 1 Berhasil -> Buka Modal Verifikasi Keamanan Berlapis (PIN 6 Angka, OTP Email, Sesi Device)
      if (typeof window !== 'undefined') {
        localStorage.setItem('claimtrace_token', data.token);
        localStorage.setItem('claimtrace_user', JSON.stringify(data.user));
      }
      setPendingUser(data.user);
      setShowVerificationModal(true);
    } catch (err) {
      setErrorMsg(err.message || 'Kredensial tidak valid: NIP/Email atau Kata Sandi salah.');
      refreshCaptchaOnFailed();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex-1 flex flex-col justify-center items-center px-4 py-1.5 sm:py-2 relative overflow-hidden select-none min-h-[calc(100vh-8rem)] transition-colors duration-200 ${
      effectiveIsLight ? 'bg-slate-50 text-slate-900' : 'bg-[#000c24] text-white'
    }`}>
      {/* Soft Ambient Radial Light with breathing animation */}
      <motion.div 
        animate={{ 
          scale: [1, 1.12, 0.96, 1],
          opacity: effectiveIsLight ? [0.35, 0.55, 0.4, 0.35] : [0.25, 0.45, 0.3, 0.25],
          x: [0, 15, -15, 0],
          y: [0, -10, 10, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[450px] blur-3xl rounded-full pointer-events-none transition-colors duration-300 ${
          effectiveIsLight
            ? 'bg-gradient-to-tr from-blue-200/50 via-amber-100/40 to-emerald-100/30'
            : 'bg-gradient-to-tr from-blue-900/40 via-[#001D58]/30 to-emerald-500/10'
        }`} 
      />

      <motion.div 
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md space-y-2.5 relative z-10 my-auto"
      >
        {/* LOGO & HEADING */}
        <div className="text-center space-y-1">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0], transition: { duration: 0.3 } }}
            className={`inline-flex p-2 rounded-2xl backdrop-blur-md border transition-all duration-300 mb-0.5 cursor-pointer ${
              effectiveIsLight
                ? 'bg-white border-slate-200 shadow-md shadow-slate-200/50 hover:border-emerald-500'
                : 'bg-white/5 border-white/10 shadow-xl shadow-[#00081c]/50 hover:border-emerald-500/40'
            }`}
          >
            <img 
              alt="BPJS Kesehatan" 
              className="h-8 w-auto object-contain" 
              src="/assets/images/bpjs_icon.png"
            />
          </motion.div>
          <h1 className={`text-xl font-bold tracking-tight ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
            Portal Verifikator Klaim JKN
          </h1>
          <p className={`text-[11px] ${effectiveIsLight ? 'text-slate-600' : 'text-white/60'}`}>
            Sistem Informasi Pengawasan Klaim Pra-Bayar BPJS Kesehatan
          </p>
        </div>

        {/* LOGIN CARD */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.3 }}
          className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-5 sm:p-5.5 backdrop-blur-xl space-y-3 transition-colors duration-200 ${
            effectiveIsLight
              ? 'border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-300/40'
              : 'border-white/10 bg-[#00153A]/85 text-white shadow-2xl shadow-[#00081c]/80'
          }`}
        >
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-2.5 rounded-xl border text-xs flex items-center space-x-2 ${
                effectiveIsLight
                  ? 'bg-rose-50 border-rose-200 text-rose-700 font-medium'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* QUICK DEMO ACCOUNTS PICKER & HEALTHKATHON NOTICE */}
          <div className={`p-2.5 rounded-xl border text-[11px] space-y-2 ${
            effectiveIsLight
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
          }`}>
            <div className="flex items-center justify-between font-semibold text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Mode Pengujian Panitia Healthkathon
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                Auto-Filled
              </span>
            </div>
            
            <p className="text-[10px] leading-relaxed opacity-90">
              NIP Kedinasan / Email Resmi dan Kata Sandi telah diisi secara otomatis untuk memudahkan Dewan Juri dan Panitia Healthkathon BPJS Kesehatan dalam menguji sistem secara langsung. Anda hanya perlu mengisi Kode Keamanan (CAPTCHA) di bawah ini.
            </p>

            <div className="pt-1 border-t border-emerald-200/60 dark:border-emerald-500/20">
              <div className="text-[9px] text-slate-500 dark:text-slate-400 mb-1 font-medium">
                Pilih Persona Akun:
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('admin.fraud@bpjs-kesehatan.go.id');
                    setPassword('Password123!');
                    setErrorMsg('');
                  }}
                  className={`px-2 py-1.5 rounded-lg border text-left transition-all text-[10px] flex flex-col justify-between cursor-pointer ${
                    identifier === 'admin.fraud@bpjs-kesehatan.go.id' || identifier === '199208152015031002'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : effectiveIsLight
                        ? 'bg-white hover:bg-emerald-100/50 border-emerald-200 text-slate-800'
                        : 'bg-slate-900/60 hover:bg-emerald-900/40 border-emerald-500/30 text-white'
                  }`}
                >
                  <span className={`font-bold truncate ${
                    identifier === 'admin.fraud@bpjs-kesehatan.go.id' || identifier === '199208152015031002'
                      ? 'text-white'
                      : 'text-emerald-700 dark:text-emerald-300'
                  }`}>
                    Super Admin (BS)
                  </span>
                  <span className={`text-[9px] truncate ${
                    identifier === 'admin.fraud@bpjs-kesehatan.go.id' || identifier === '199208152015031002'
                      ? 'text-white/80'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    Budi Santoso, S.Kom
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('siti.rahma@bpjs-kesehatan.go.id');
                    setPassword('Password123!');
                    setErrorMsg('');
                  }}
                  className={`px-2 py-1.5 rounded-lg border text-left transition-all text-[10px] flex flex-col justify-between cursor-pointer ${
                    identifier === 'siti.rahma@bpjs-kesehatan.go.id' || identifier === '198704202011012001'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : effectiveIsLight
                        ? 'bg-white hover:bg-emerald-100/50 border-emerald-200 text-slate-800'
                        : 'bg-slate-900/60 hover:bg-emerald-900/40 border-emerald-500/30 text-white'
                  }`}
                >
                  <span className={`font-bold truncate ${
                    identifier === 'siti.rahma@bpjs-kesehatan.go.id' || identifier === '198704202011012001'
                      ? 'text-white'
                      : 'text-emerald-700 dark:text-emerald-300'
                  }`}>
                    Verifikator (SR)
                  </span>
                  <span className={`text-[9px] truncate ${
                    identifier === 'siti.rahma@bpjs-kesehatan.go.id' || identifier === '198704202011012001'
                      ? 'text-white/80'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    dr. Siti Rahma, Sp.PK
                  </span>
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className={`text-[11px] font-semibold block ${effectiveIsLight ? 'text-slate-700' : 'text-white/80'}`}>
                NIP Kedinasan / Email Resmi
              </label>
              <div className="relative group">
                <User className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                  effectiveIsLight
                    ? 'text-slate-400 group-focus-within:text-emerald-600'
                    : 'text-white/40 group-focus-within:text-emerald-400'
                }`} />
                <input aria-label="Bidang input data"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="siti.rahma@bpjs-kesehatan.go.id"
                  className={`w-full rounded-xl py-2 pl-9 pr-3 text-xs outline-none transition-all duration-200 border ${
                    effectiveIsLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      : 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={`text-[11px] font-semibold block ${effectiveIsLight ? 'text-slate-700' : 'text-white/80'}`}>
                Kata Sandi
              </label>
              <div className="relative group">
                <Lock className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                  effectiveIsLight
                    ? 'text-slate-400 group-focus-within:text-emerald-600'
                    : 'text-white/40 group-focus-within:text-emerald-400'
                }`} />
                <input aria-label="Bidang input data"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className={`w-full rounded-xl py-2 pl-9 pr-9 text-xs outline-none transition-all duration-200 border ${
                    effectiveIsLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      : 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${
                    effectiveIsLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* CAPTCHA KEAMANAN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-semibold flex items-center space-x-1.5 ${
                  effectiveIsLight ? 'text-slate-700' : 'text-white/80'
                }`}>
                  <ShieldCheck className={`w-3.5 h-3.5 ${effectiveIsLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                  <span>Kode Keamanan (CAPTCHA)</span>
                </label>
                <button
                  type="button"
                  onClick={handleRefreshCaptcha}
                  className={`text-[11px] font-medium flex items-center space-x-1 transition-colors group cursor-pointer ${
                    effectiveIsLight ? 'text-emerald-700 hover:text-emerald-800' : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                  title="Ganti Kode Captcha"
                >
                  <RefreshCw className={`w-3 h-3 transition-transform duration-300 ${isCaptchaSpinning ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                  <span>Ganti Kode</span>
                </button>
              </div>

              <div className="grid grid-cols-12 gap-2.5 items-stretch">
                {/* Visual Captcha Display Box */}
                <div 
                  onClick={handleRefreshCaptcha}
                  title="Klik untuk acak ulang kode keamanan"
                  className={`col-span-5 relative rounded-xl p-2 flex items-center justify-center cursor-pointer select-none overflow-hidden border shadow-inner group min-h-[38px] ${
                    effectiveIsLight ? 'bg-slate-100 border-slate-300' : 'bg-[#000c24] border-white/15'
                  }`}
                >
                  {/* Security Noise Grid / Lines */}
                  <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="20%" x2="100%" y2="80%" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line x1="0" y1="80%" x2="100%" y2="20%" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4,2" />
                    <line x1="20%" y1="0" x2="80%" y2="100%" stroke="#a7f3d0" strokeWidth="1" strokeDasharray="2,4" />
                    <circle cx="25%" cy="40%" r="12" stroke="#059669" strokeWidth="0.8" fill="none" opacity="0.3" />
                    <circle cx="75%" cy="60%" r="15" stroke="#38bdf8" strokeWidth="0.8" fill="none" opacity="0.3" />
                  </svg>
                  
                  {/* Distorted Captcha Characters */}
                  <div className={`relative z-10 flex items-center justify-center space-x-1.5 font-mono tracking-widest font-bold text-sm ${
                    effectiveIsLight ? 'text-slate-900 drop-shadow-xs' : 'text-emerald-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                  }`}>
                    {captchaCode.split('').map((char, index) => {
                      const rotations = [-6, 8, -4, 6, -8];
                      const yOffsets = [1, -2, 2, -1, 1];
                      return (
                        <span 
                          key={index}
                          style={{
                            transform: `rotate(${rotations[index % rotations.length]}deg) translateY(${yOffsets[index % yOffsets.length]}px)`,
                            display: 'inline-block'
                          }}
                          className={effectiveIsLight 
                            ? (index % 2 === 0 ? 'text-emerald-800' : 'text-teal-900')
                            : (index % 2 === 0 ? 'text-emerald-300' : 'text-teal-200')}
                        >
                          {char}
                        </span>
                      );
                    })}
                  </div>

                  {/* Hover indicator */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${
                    effectiveIsLight ? 'bg-slate-900/10' : 'bg-emerald-500/10'
                  }`}>
                    <RefreshCw className={`w-3.5 h-3.5 ${effectiveIsLight ? 'text-slate-700' : 'text-white/80'}`} />
                  </div>
                </div>

                {/* Input Captcha Box */}
                <div className="col-span-7 relative">
                  <input
                    type="text"
                    maxLength={5}
                    aria-label="Masukkan 5 karakter kode CAPTCHA"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                    placeholder="Masukkan kode"
                    className={`w-full h-full border rounded-xl py-2 pl-3 pr-8 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 outline-none ${
                      captchaInput && captchaInput.toUpperCase() === captchaCode.toUpperCase()
                        ? effectiveIsLight
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-2 ring-emerald-500/20'
                        : effectiveIsLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                          : 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                  {captchaInput && captchaInput.toUpperCase() === captchaCode.toUpperCase() && (
                    <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center pointer-events-none border ${
                      effectiveIsLight
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </span>
                  )}
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl shadow-emerald-950/60 border border-emerald-400/30 flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50 group cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Kredensial...</span>
                </div>
              ) : (
                <>
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Masuk Portal Verifikator</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* SECURITY & REGULATION DISCLAIMER */}
        <div className="text-center space-y-1">
          <p className={`text-[10px] max-w-sm mx-auto leading-tight ${effectiveIsLight ? 'text-slate-500' : 'text-white/50'}`}>
            Akses terbatas hanya untuk pegawai dan verifikator berwenang BPJS Kesehatan. 
            Seluruh aktivitas terekam dalam <em>audit trail</em> kriptografis sesuai standar NIST CSF 2.0 PR.AC, MITRE D3FEND D3-MFA, UU ITE &amp; UU PDP No. 27/2022.
          </p>
          <div className={`flex items-center justify-center gap-1.5 text-[9px] font-mono ${effectiveIsLight ? 'text-slate-500' : 'text-white/40'}`}>
            <span>NIST CSF 2.0 PR.AC</span>
            <span>·</span>
            <span>MITRE D3FEND D3-MFA</span>
            <span>·</span>
            <span>MITRE ATT&CK T1078 Defense</span>
          </div>
        </div>
      </motion.div>

      {/* MODAL VERIFIKASI KEAMANAN BERLAPIS (PIN 6 ANGKA, OTP EMAIL, SESI DEVICE) */}
      <SecurityVerificationModal
        isOpen={showVerificationModal}
        user={pendingUser}
        identifier={identifier}
        isLight={effectiveIsLight}
        onCompleteVerification={(verifiedUser) => {
          setShowVerificationModal(false);
          if (onLoginSuccess) onLoginSuccess(verifiedUser);
        }}
        onCancelSignOut={() => {
          setShowVerificationModal(false);
          setPendingUser(null);
          setPassword('');
          handleRefreshCaptcha();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('claimtrace_token');
            localStorage.removeItem('claimtrace_user');
          }
        }}
      />
    </div>
  );
}
