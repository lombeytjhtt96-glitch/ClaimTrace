import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Cookie, X, ExternalLink, Lock } from 'lucide-react';

export default function CookieConsentBanner({ onOpenPrivacy, isLight: propIsLight }) {
  const [isVisible, setIsVisible] = useState(false);

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
        className={`fixed bottom-6 left-4 right-4 sm:right-auto sm:left-6 sm:max-w-md z-40 backdrop-blur-xl border rounded-2xl p-4 shadow-2xl transition-all duration-300 ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/60'
            : 'bg-[#00153A]/95 border-white/20 text-white'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-md ${
            isLight
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-white/10 border-white/15 text-emerald-400'
          }`}>
            <Lock className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
          </div>
          
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                isLight ? 'text-emerald-800' : 'text-emerald-400'
              }`}>
                Pemberitahuan Privasi &amp; Kepatuhan Data (UU PDP)
              </span>
              <button type="button" 
                onClick={handleAcceptEssential}
                aria-label="Tutup pemberitahuan privasi"
                className={`p-0.5 rounded transition cursor-pointer ${
                  isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'
                }`}
                title="Tutup &amp; Gunakan Sesi Esensial"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
              Portal ClaimTrace DSS BPJS Kesehatan menggunakan penyimpanan sesi esensial dan telemetri terenkripsi <span className="italic">Zero-PHI</span> untuk memverifikasi legalitas klaim tanpa merekam data medis sensitif ke server publik, sesuai amanat <strong className={isLight ? 'text-slate-900' : 'text-white'}>UU PDP No. 27 Tahun 2022</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button type="button"
                onClick={handleAcceptAll}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Setujui Telemetri Esensial
              </button>

              <button type="button"
                onClick={handleAcceptEssential}
                className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
                }`}
              >
                Hanya Sesi Wajib
              </button>

              <button type="button"
                onClick={onOpenPrivacy}
                className={`text-xs font-bold underline underline-offset-2 transition cursor-pointer ml-1 ${
                  isLight
                    ? 'text-emerald-700 hover:text-emerald-800'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
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
