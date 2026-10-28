import React from 'react';
import { 
  LogOut, ShieldCheck, ArrowRight, CheckCircle2, 
  Clock, FileText, TrendingUp, AlertOctagon, Home, Lock
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SignOutPage({ user, onLoginAgain, onGoToLogin, onGoToLanding, isLight: propIsLight }) {
  const handleLogin = onLoginAgain || onGoToLogin;

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

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-4 relative font-inter overflow-y-auto transition-colors duration-300 ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#000c24] text-white'
    }`}>
      {/* Background glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] blur-3xl rounded-full pointer-events-none transition-all ${
        isLight
          ? 'bg-gradient-to-tr from-emerald-100/70 via-teal-100/50 to-blue-100/60'
          : 'bg-gradient-to-tr from-blue-900/30 via-[#001D58]/20 to-emerald-500/10'
      }`} />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md space-y-5 text-center relative z-10 my-auto"
      >
        {/* LOGO & HEADING */}
        <div className="space-y-2">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`inline-flex p-3 rounded-2xl border shadow-xl backdrop-blur-xl mb-1 ${
              isLight 
                ? 'bg-white border-slate-200 text-emerald-700 shadow-slate-200/60' 
                : 'bg-white/5 border-white/10 text-emerald-400 shadow-xl shadow-[#00081c]/50'
            }`}
          >
            <ShieldCheck className={`w-8 h-8 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
          </motion.div>
          <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Sesi Berakhir dengan Aman
          </h1>
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Kredensial dan cache memori sesi Anda telah dihapus secara aman.
          </p>
        </div>

        {/* SECURITY CONFIRMATION CHIPS */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className={`text-[10.5px] font-medium px-2.5 py-1 rounded-full border ${
            isLight
              ? 'text-emerald-800 bg-emerald-50 border-emerald-300'
              : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
          }`}>
            ✓ Token SSO Dicabut
          </span>
          <span className={`text-[10.5px] font-medium px-2.5 py-1 rounded-full border ${
            isLight
              ? 'text-cyan-800 bg-cyan-50 border-cyan-300'
              : 'text-cyan-300 bg-blue-500/10 border-blue-500/30'
          }`}>
            ✓ Memori Sesi Dibersihkan
          </span>
          <span className={`text-[10.5px] font-medium px-2.5 py-1 rounded-full border ${
            isLight
              ? 'text-slate-700 bg-slate-100 border-slate-300'
              : 'text-white/70 bg-white/5 border-white/10'
          }`}>
            ✓ Log Audit Tercatat
          </span>
        </div>

        {/* SESSION SUMMARY REPORT CARD */}
        <div className={`relative overflow-hidden rounded-3xl border p-6 shadow-2xl backdrop-blur-xl space-y-4 text-left transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/60'
            : 'border-white/10 bg-[#00153A]/85 text-white shadow-[#00081c]/80'
        }`}>
          <div className={`border-b pb-3 flex items-center justify-between ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}>
            <div>
              <span className={`text-[10px] font-bold uppercase ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                Petugas Verifikasi
              </span>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {user?.name || 'dr. Siti Rahma, Sp.PK'}
              </h3>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              isLight
                ? 'text-slate-700 bg-slate-100 border-slate-200'
                : 'text-white/80 bg-white/5 border-white/10'
            }`}>
              {user?.unit || user?.branch || 'Kantor Pusat BPJS Kesehatan'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className={`p-2.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
            }`}>
              <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Total Telaah Klaim
              </span>
              <span className={`text-base font-bold font-mono mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                18 Berkas
              </span>
            </div>
            <div className={`p-2.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
            }`}>
              <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Durasi Kerja Aktif
              </span>
              <span className={`text-base font-bold font-mono mt-0.5 block ${isLight ? 'text-teal-700' : 'text-cyan-400'}`}>
                2 Jam 45 Mnt
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-[11px]">
              <span className={isLight ? 'text-slate-600' : 'text-white/60'}>Jalur Hijau (Disetujui Wajar):</span>
              <span className={`font-bold font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>14 Klaim (Rp 84,2 Juta)</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className={isLight ? 'text-slate-600' : 'text-white/60'}>Jalur Kuning (Klarifikasi Faskes):</span>
              <span className={`font-bold font-mono ${isLight ? 'text-amber-800' : 'text-emerald-400'}`}>3 Klaim (Rp 18,5 Juta)</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className={isLight ? 'text-slate-600' : 'text-white/60'}>Jalur Merah (Ditahan / Investigasi):</span>
              <span className={`font-bold font-mono ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>1 Klaim (Rp 15,3 Juta)</span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            isLight
              ? 'bg-emerald-50 border-emerald-300'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            <span className={`font-bold ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
              Dana DJS Diamankan:
            </span>
            <span className={`text-sm font-bold font-mono ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
              Rp 15.300.000
            </span>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Masuk Kembali ke Portal</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
          {onGoToLanding && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGoToLanding}
              className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-900'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Halaman Depan</span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
