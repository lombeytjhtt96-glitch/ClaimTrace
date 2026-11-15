import React from 'react';
import { ShieldCheck, ArrowRight, Lock, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function SignOutPage({ user, reason, onLoginAgain, onGoToLogin, isLight: propIsLight }) {
  const handleLogin = onLoginAgain || onGoToLogin;

  const isLight = (() => {
    if (typeof propIsLight === 'boolean') return propIsLight;
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('claimtrace_theme') !== 'dark';
      } catch {}
    }
    return true;
  })();

  const endedAt = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={`min-h-screen flex flex-col justify-center items-center p-5 relative font-inter overflow-y-auto transition-colors duration-300 ${
        isLight ? 'bg-[#F7F8FA] text-[#061B31]' : 'bg-[#090B0E] text-[#F1F5F9]'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md space-y-5 text-center relative z-10 my-auto"
      >
        <div className="space-y-2">
          <div
            className={`inline-flex p-3 rounded-2xl border shadow-sm mb-1 ${
              isLight
                ? 'bg-white border-[#E2E8F0] text-[#00733B]'
                : 'bg-[#11141A] border-white/10 text-emerald-400'
            }`}
          >
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Sesi Ditutup
          </h1>
          <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {reason || 'Token sesi telah dicabut dan cache perangkat dibersihkan.'}
          </p>
        </div>

        <div
          className={`rounded-2xl border p-5 text-left space-y-4 ${
            isLight
              ? 'bg-white border-[#E2E8F0] shadow-[0_1px_2px_rgba(6,27,49,0.04)]'
              : 'bg-[#11141A] border-white/10 shadow-xl'
          }`}
        >
          <div className={`border-b pb-3 flex items-center justify-between gap-3 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="min-w-0">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Akun Terakhir
              </span>
              <h3 className="text-sm font-bold truncate mt-0.5">
                {user?.name || 'Verifikator BPJS Kesehatan'}
              </h3>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-1 rounded-md border shrink-0 ${
                isLight ? 'text-slate-600 bg-slate-50 border-slate-200' : 'text-slate-300 bg-[#161A22] border-white/10'
              }`}
            >
              {user?.nip || 'REVOKED'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>Waktu Keluar</span>
              </span>
              <span className="font-mono font-semibold">{endedAt} WIB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status Sesi</span>
              </span>
              <span className={`font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                Dicabut
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          className="w-full py-3 px-4 rounded-xl bg-[#00733B] hover:bg-[#005E30] text-white font-semibold text-xs shadow-sm flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <Lock className="w-4 h-4" />
          <span>Masuk Kembali</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
