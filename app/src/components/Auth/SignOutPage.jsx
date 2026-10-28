import React from 'react';
import { 
  LogOut, ShieldCheck, ArrowRight, CheckCircle2, 
  Clock, FileText, TrendingUp, AlertOctagon, Home
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SignOutPage({ user, onLoginAgain, onGoToLogin, onGoToLanding }) {
  const handleLogin = onLoginAgain || onGoToLogin;

  return (
    <div className="min-h-screen bg-[#000c24] text-white flex flex-col justify-center items-center p-4 relative font-inter overflow-y-auto">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-blue-900/30 via-[#001D58]/20 to-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

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
            className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 text-emerald-400 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl mb-1"
          >
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Sesi Berakhir dengan Aman
          </h1>
          <p className="text-xs text-white/60">
            Kredensial dan cache memori sesi Anda telah dihapus secara aman.
          </p>
        </div>

        {/* SECURITY CONFIRMATION CHIPS */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-[10.5px] font-medium text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
            ✓ Token SSO Dicabut
          </span>
          <span className="text-[10.5px] font-medium text-cyan-300 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/30">
            ✓ Memori Sesi Dibersihkan
          </span>
          <span className="text-[10.5px] font-medium text-white/70 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            ✓ Log Audit Tercatat
          </span>
        </div>

        {/* SESSION SUMMARY REPORT CARD */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#00153A]/85 p-6 shadow-2xl shadow-[#00081c]/80 backdrop-blur-xl space-y-4 text-left text-white">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-white/40 uppercase">Petugas Verifikasi</span>
              <h3 className="text-sm font-bold text-white">{user?.name || 'dr. Siti Rahma, Sp.PK'}</h3>
            </div>
            <span className="text-[10px] font-bold text-white/80 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
              {user?.unit || user?.branch || 'Kantor Pusat BPJS Kesehatan'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] text-white/50 block">Total Telaah Klaim</span>
              <span className="text-base font-bold font-mono text-white mt-0.5 block">18 Berkas</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] text-white/50 block">Durasi Kerja Aktif</span>
              <span className="text-base font-bold font-mono text-cyan-400 mt-0.5 block">2 Jam 45 Mnt</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-white/60">Jalur Hijau (Disetujui Wajar):</span>
              <span className="font-bold text-emerald-400 font-mono">14 Klaim (Rp 84,2 Juta)</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-white/60">Jalur Kuning (Klarifikasi Faskes):</span>
              <span className="font-bold text-emerald-400 font-mono">3 Klaim (Rp 18,5 Juta)</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-white/60">Jalur Merah (Ditahan / Investigasi):</span>
              <span className="font-bold text-rose-400 font-mono">1 Klaim (Rp 15,3 Juta)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between">
            <span className="text-emerald-300 font-bold">Dana DJS Diamankan:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">Rp 15.300.000</span>
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
            <span>Masuk Kembali ke Portal</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
          {onGoToLanding && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGoToLanding}
              className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
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
