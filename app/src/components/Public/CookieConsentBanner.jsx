import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Cookie, X, ExternalLink, Lock } from 'lucide-react';

export default function CookieConsentBanner({ onOpenPrivacy }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a decision
    const consent = localStorage.getItem('claimtrace_cookie_consent');
    if (!consent) {
      // Delay slightly for smooth non-intrusive entrance
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('claimtrace_cookie_consent', 'accepted_all');
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('claimtrace_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="fixed bottom-6 left-4 right-4 sm:right-auto sm:left-6 sm:max-w-md z-40 bg-[#00153A]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl text-white"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 text-[#FFCA40] border border-white/15 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
            <Lock className="w-4 h-4 text-[#FFCA40]" />
          </div>
          
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-[#FFCA40] tracking-wider">
                Pemberitahuan Privasi &amp; Kepatuhan Data (UU PDP)
              </span>
              <button type="button" 
                onClick={handleAcceptEssential}
                aria-label="Tutup pemberitahuan privasi"
                className="text-white/40 hover:text-white p-0.5 rounded transition cursor-pointer"
                title="Tutup &amp; Gunakan Sesi Esensial"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Portal ClaimTrace DSS BPJS Kesehatan menggunakan penyimpanan sesi esensial dan telemetri terenkripsi <em>Zero-PHI</em> untuk memverifikasi legalitas klaim tanpa merekam data medis sensitif ke server publik, sesuai amanat <strong>UU PDP No. 27 Tahun 2022</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button type="button"
                onClick={handleAcceptAll}
                className="px-3.5 py-1.5 rounded-xl bg-[#FFCA40] hover:bg-[#ffd566] text-[#000c24] font-bold text-xs shadow-md shadow-[#FFCA40]/20 transition cursor-pointer"
              >
                Setujui Telemetri Esensial
              </button>

              <button type="button"
                onClick={handleAcceptEssential}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold text-xs transition cursor-pointer"
              >
                Hanya Sesi Wajib
              </button>

              <button type="button"
                onClick={onOpenPrivacy}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-2 transition cursor-pointer ml-1"
              >
                Baca Kebijakan Privasi
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}