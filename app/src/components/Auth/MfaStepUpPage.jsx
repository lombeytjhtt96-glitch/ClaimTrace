import React, { useState, useEffect } from 'react';
import { 
  Smartphone, ShieldCheck, RefreshCw, ArrowLeft, 
  CheckCircle2, AlertTriangle, Lock, KeyRound
} from 'lucide-react';
import { motion } from 'motion/react';

export default function MfaStepUpPage({ user, onSuccess, onMfaSuccess, onCancel, isLight: propIsLight }) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [totpCode, setTotpCode] = useState(['', '', '', '', '', '']);
  const [isSimulatingApprove, setIsSimulatingApprove] = useState(false);

  const internalIsLight = (() => {
    if (typeof window !== 'undefined') {
      try {
        const storedTheme = localStorage.getItem('claimtrace_theme');
        if (storedTheme === 'light') return true;
        if (storedTheme === 'dark') return false;
        return document.documentElement.classList.contains('light');
      } catch {}
    }
    return true;
  })();

  const isLight = typeof propIsLight === 'boolean' ? propIsLight : internalIsLight;
  const handleSuccess = onSuccess || onMfaSuccess;

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSimulateMobileApprove = () => {
    setIsSimulatingApprove(true);
    setTimeout(() => {
      setIsSimulatingApprove(false);
      if (handleSuccess) handleSuccess();
    }, 600);
  };

  const handleTotpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newCode = [...totpCode];
    newCode[index] = value;
    setTotpCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`totp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    if (newCode.every((digit) => digit !== '')) {
      handleSimulateMobileApprove();
    }
  };

  return (
    <div className={`flex-1 min-h-[calc(100vh-8rem)] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none transition-colors duration-300 ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#000c24] text-white'
    }`}>
      {/* Dynamic Ambient Background Light */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <motion.div 
          animate={{
            scale: [1, 1.15, 0.95, 1],
            opacity: isLight ? [0.4, 0.6, 0.45, 0.4] : [0.25, 0.45, 0.3, 0.25],
            x: [0, 25, -20, 0],
            y: [0, -20, 15, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl ${
            isLight
              ? 'bg-gradient-to-br from-emerald-100/70 via-teal-100/50 to-blue-100/60'
              : 'bg-gradient-to-br from-blue-900/40 via-[#001D58]/30 to-emerald-500/10'
          }`}
        />
        <motion.div 
          animate={{
            scale: [1, 1.2, 0.92, 1],
            opacity: isLight ? [0.35, 0.55, 0.4, 0.35] : [0.2, 0.4, 0.25, 0.2],
            x: [0, -25, 18, 0],
            y: [0, 22, -16, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full blur-3xl ${
            isLight
              ? 'bg-gradient-to-tl from-teal-100/60 via-emerald-100/40 to-cyan-100/50'
              : 'bg-gradient-to-tl from-[#00153A] via-blue-900/20 to-emerald-500/10'
          }`}
        />
      </div>

      {/* Back Button */}
      {onCancel && (
        <motion.button 
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.96 }}
          onClick={onCancel}
          className={`absolute top-6 left-6 text-xs flex items-center space-x-1.5 transition font-medium z-20 cursor-pointer ${
            isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ganti Akun / Batal</span>
        </motion.button>
      )}

      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 24,
          mass: 0.8
        }}
        className="w-full max-w-md space-y-5 text-center relative z-10 my-auto"
      >
        {/* LOGO & HEADING */}
        <div className="space-y-2">
          <motion.div 
            whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
            transition={{ duration: 0.3 }}
            className={`inline-flex p-3 rounded-2xl border shadow-xl backdrop-blur-xl mb-1 cursor-pointer ${
              isLight
                ? 'bg-white border-slate-200 text-emerald-700 shadow-slate-200/60'
                : 'bg-white/5 border-white/10 text-emerald-400 shadow-xl shadow-[#00081c]/50'
            }`}
          >
            <Smartphone className={`w-8 h-8 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
          </motion.div>
          <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Verifikasi Dua Faktor (MFA)
          </h1>
          <div className={`flex items-center justify-center gap-1.5 text-[9.5px] font-mono py-1 px-3 rounded-full border w-fit mx-auto ${
            isLight
              ? 'text-slate-700 bg-slate-100 border-slate-300'
              : 'text-white/60 bg-white/5 border-white/10'
          }`}>
            <span>NIST CSF 2.0 PR.AC</span>
            <span>·</span>
            <span>MITRE D3FEND D3-MFA</span>
          </div>
          <p className={`text-xs max-w-sm mx-auto ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
            Notifikasi izin masuk telah dikirimkan ke aplikasi Mobile JKN pada perangkat kedinasan Anda.
          </p>
        </div>

        {/* MFA CHALLENGE CARD */}
        <motion.div 
          className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 text-left transition-all duration-300 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/70'
              : 'border-white/10 bg-[#00153A]/85 text-white shadow-[#00081c]/80'
          }`}
        >
          {/* USER INFO STRIP */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : 'bg-white/5 border-white/10 text-white'
          }`}>
            <div>
              <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {user?.name || 'dr. Siti Rahma, Sp.PK'}
              </span>
              <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                {user?.unit || user?.branch || 'Kantor Pusat BPJS Kesehatan'} · NIP {user?.nip || '198704202011012001'}
              </span>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              isLight
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              PERANGKAT SAH
            </span>
          </div>

          {/* TIMER STATUS */}
          <div className="text-center space-y-1">
            <div className={`text-[11px] font-bold uppercase tracking-wide ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Batas Waktu Validasi
            </div>
            <motion.div 
              animate={timeLeft <= 10 && timeLeft > 0 ? { scale: [1, 1.06, 1], color: ['#10b981', '#f43f5e', '#10b981'] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
              className={`text-3xl font-bold font-mono tracking-wider ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}
            >
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </motion.div>
            {timeLeft === 0 && (
              <span className="text-xs text-rose-600 font-semibold block">
                Batas waktu habis. Silakan kirim ulang sinyal verifikasi.
              </span>
            )}
          </div>

          {/* SIMULATED APPROVAL BUTTON */}
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSimulateMobileApprove}
            disabled={isSimulatingApprove || timeLeft === 0}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-950/30 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
          >
            {isSimulatingApprove ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memvalidasi Sesi Mobile JKN...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verifikasi Akses Mobile JKN</span>
              </>
            )}
          </motion.button>

          {/* FALLBACK: 6-DIGIT TOTP MANUAL */}
          <div className={`space-y-2.5 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="text-center">
              <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                Atau masukkan 6 digit kode keamanan Mobile JKN:
              </span>
            </div>
            <div className="flex justify-center gap-2">
              {totpCode.map((digit, idx) => (
                <input
                  key={idx}
                  id={`totp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleTotpChange(idx, e.target.value)}
                  className={`w-10 h-12 text-center text-lg font-mono font-bold rounded-xl focus:outline-none transition-all duration-200 ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20'
                      : 'bg-white/5 border border-white/10 text-white focus:border-emerald-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs">
            <button type="button"
              onClick={() => { setTimeLeft(60); setTotpCode(['', '', '', '', '', '']); }}
              className={`flex items-center space-x-1 transition font-medium cursor-pointer ${
                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Kirim Ulang Tantangan</span>
            </button>
            <span className={`text-[10.5px] font-mono ${isLight ? 'text-slate-400' : 'text-white/40'}`}>ID: CT-MFA-9821</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
