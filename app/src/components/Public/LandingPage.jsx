import React, { useState, useEffect } from 'react';
import { 
  Shield, Activity, Database, CheckCircle2, AlertOctagon, 
  ArrowRight, Lock, Clock, ExternalLink, ChevronRight, ChevronDown,
  TrendingUp, Users, Hospital, Stethoscope, Smartphone,
  FileText, AlertTriangle, Play, HelpCircle, Phone, Mail,
  MapPin, Send, Copy, Check, Award, Layers, GitBranch,
  ShieldCheck, Scale, MessageSquare, Info, FileCheck,
  Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import InstitutionalLegalModal from './InstitutionalLegalModal';

export default function LandingPage({
  onEnterCockpit,
  onExplore,
  onGoToLogin,
  onGoToDemo,
  onChangeView,
  onOpenLegal,
  isLight = undefined,
  onToggleTheme,
}) {
  const effectiveIsLight =
    isLight !== undefined
      ? isLight
      : typeof window !== 'undefined' && localStorage.getItem('claimtrace_theme') === 'light';
  // Navigation & Active Section Tracking
  const [activeNav, setActiveNav] = useState('landing');
  const [scrolled, setScrolled] = useState(false);

  // Internal Legal Modal state as fallback if onOpenLegal is not passed
  const [internalLegalOpen, setInternalLegalOpen] = useState(false);
  const [internalLegalTab, setInternalLegalTab] = useState('privacy');

  const handleOpenLegal = (tab = 'privacy') => {
    if (onOpenLegal) {
      onOpenLegal(tab);
    } else {
      setInternalLegalTab(tab);
      setInternalLegalOpen(true);
    }
  };

  // Dynamic Scroll Spy for Navigation Active State & Frosted Glass Blur
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
      const sections = ['landing', 'feature', 'about', 'contact'];
      const scrollPos = window.scrollY + 140;
      for (const sId of sections) {
        const el = document.getElementById(sId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveNav(sId);
            break;
          }
        }
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle initial URL hash scrolling
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, []);

  // Interactive Simulator Sliders
  const [sliderS1, setSliderS1] = useState(85);
  const [sliderS2, setSliderS2] = useState(95);
  const [sliderS3, setSliderS3] = useState(80);

  // WBS / Contact Form States
  const [formCategory, setFormCategory] = useState('Phantom Billing');
  const [formFaskes, setFormFaskes] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsAnonymous, setFormIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // FAQ Accordion State (Index of opened item)
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const handleLogin = onEnterCockpit || onGoToLogin;
  const handleDemo = onExplore || onGoToDemo || onEnterCockpit;

  // Real-time Tri-Layer Mathematical Fusion
  const calculatedScore = Math.round((0.5 * sliderS1 + 0.3 * sliderS2 + 0.2 * sliderS3) * 10) / 10;
  const lane = calculatedScore >= 70 
    ? 'MERAH (Telaah Pra-Bayar Ketat)' 
    : calculatedScore >= 40 
    ? 'KUNING (Klarifikasi Berkas & SIP)' 
    : 'HIJAU (Fast-Track Wajar < 24 Jam)';

  const laneBadgeColor = calculatedScore >= 70 
    ? 'text-rose-300 border-rose-500/40 bg-rose-500/20' 
    : calculatedScore >= 40 
    ? 'text-amber-300 border-amber-500/40 bg-amber-500/20' 
    : 'text-emerald-300 border-emerald-500/40 bg-emerald-500/20';

  const scrollToSection = (sectionId) => {
    setActiveNav(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePresetSelect = (s1, s2, s3) => {
    setSliderS1(s1);
    setSliderS2(s2);
    setSliderS3(s3);
  };

  const handleWbsSubmit = (e) => {
    e.preventDefault();
    if (!formFaskes || !formDescription) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const generatedTicket = `WBS-2026-JKN-${Math.floor(1000 + Math.random() * 9000)}`;
      const randomHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setSubmissionReceipt({
        ticketId: generatedTicket,
        category: formCategory,
        faskes: formFaskes,
        location: formLocation || 'Wilayah Jawa Tengah & DIY',
        timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
        hash: randomHash.substring(0, 32) + '...'
      });
      setIsSubmitting(false);
    }, 700);
  };

  const copyReceiptText = () => {
    if (!submissionReceipt) return;
    navigator.clipboard.writeText(
      `Nomor Tiket WBS: ${submissionReceipt.ticketId}\nKategori: ${submissionReceipt.category}\nFaskes: ${submissionReceipt.faskes}\nWaktu: ${submissionReceipt.timestamp}\nSegel Hash: ${submissionReceipt.hash}`
    );
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const faqItems = [
    {
      q: 'Apakah ClaimTrace memutuskan penolakan klaim faskes secara otomatis?',
      a: 'Tidak. ClaimTrace beroperasi murni sebagai Decision Support System (DSS) dengan prinsip Human-in-the-Loop. Sistem hanya mengalkulasi skor prioritas risiko dan menyajikan matriks 3 lapis bukti faktual. Keputusan administratif penundaan, permintaan klarifikasi berkas, atau penerbitan Berita Acara Kelengkapan Berkas (BAKB) tetap 100% merupakan kewenangan verifikator medis BPJS Kesehatan.'
    },
    {
      q: 'Bagaimana jaminan pelindungan privasi data rekam medis pasien sesuai UU PDP?',
      a: 'Sistem tunduk penuh pada Pasal 34 UU No. 27 Tahun 2022 (Data Pribadi Spesifik Kesehatan). Permintaan konfirmasi kehadiran ke aplikasi Mobile JKN peserta dikirimkan secara biner (Ya/Tidak) hanya memuat tanggal dan nama faskes. Kode diagnosa ICD-10, rincian tindakan medis, maupun berkas rekam medis tidak pernah diekspos ke perangkat peserta.'
    },
    {
      q: 'Apakah proses penapisan pra-bayar ini akan memperlambat pencairan klaim faskes yang patuh?',
      a: 'Justru mempercepat. Dengan pemilahan deterministik, klaim faskes yang masuk Jalur Hijau (skor risiko rendah) langsung dialokasikan ke jalur Fast-Track dengan verifikasi administratif instan kurang dari 24 jam. Ini membantu likuiditas keuangan rumah sakit yang berintegritas dan memfokuskan waktu telaah verifikator pada klaster berisiko tinggi dalam koridor SLA 10 hari kerja Perpres No. 82 Tahun 2018.'
    },
    {
      q: 'Bagaimana fasilitas kesehatan dapat mengklarifikasi jika terdeteksi dalam klaster anomali?',
      a: 'Fasilitas kesehatan yang terpetakan dalam Jalur Kuning menerima notifikasi klarifikasi resmi melalui portal faskes terintegrasi. Faskes diberikan hak jawab untuk melampirkan salinan absensi elektronik dokter spesialis, resume medis yang dilegalisasi DPJP, atau bukti pendukung lainnya sebelum keputusan audit pra-bayar difinalisasi.'
    }
  ];

  return (
    <div className={`min-h-screen font-inter selection:bg-[#FFCA40] selection:text-[#000c24] transition-colors duration-200 ${
      effectiveIsLight ? 'bg-slate-50 text-slate-900' : 'bg-[#000c24] text-white'
    }`}>
      {/* ======================================================== */}
      {/* 1. TOP ULTRA-TRANSPARENT FROSTED GLASS NAVBAR             */}
      {/* ======================================================== */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          effectiveIsLight
            ? (scrolled 
                ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200 py-3 shadow-sm text-slate-900' 
                : 'bg-white/70 backdrop-blur-md border-b border-slate-200/80 py-4 text-slate-900')
            : (scrolled 
                ? 'bg-[#000c24]/90 backdrop-blur-xl border-b border-white/10 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)] text-white' 
                : 'bg-[#000c24]/60 backdrop-blur-md border-b border-white/5 py-4 text-white')
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Left Section: Logo & Nav */}
            <div className="flex items-center gap-8">
              {/* Logo Circular Container & Translucent Glass */}
              <div 
                onClick={() => scrollToSection('landing')}
                className="flex items-center gap-3 group cursor-pointer"
              >
                <div className={`relative w-9 h-9 overflow-hidden rounded-full border transition-colors duration-300 shadow-lg backdrop-blur-sm p-1 flex items-center justify-center shrink-0 ${
                  effectiveIsLight ? 'border-slate-200 bg-slate-100 group-hover:border-amber-500' : 'border-white/20 bg-white/10 group-hover:border-[#FFCA40]'
                }`}>
                  <img 
                    alt="BPJS Kesehatan" 
                    className="object-contain w-full h-full" 
                    src="/assets/images/bpjs_icon.png"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-base font-bold leading-none tracking-tight transition-colors ${
                      effectiveIsLight ? 'text-slate-900 group-hover:text-amber-600' : 'text-white group-hover:text-[#FFCA40]'
                    }`}>
                      ClaimTrace
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                      effectiveIsLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-[#FFCA40]/20 text-[#FFCA40] border-[#FFCA40]/30'
                    }`}>
                      DSS
                    </span>
                  </div>
                  <span className={`text-[9px] uppercase tracking-widest font-bold mt-1 ${
                    effectiveIsLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}>
                    Penapisan Risiko Klaim
                  </span>
                </div>
              </div>

              {/* Desktop Nav Links (Only Regulasi & PDP as requested by user) */}
              <nav className="hidden md:flex items-center gap-7">
                <button type="button"
                  onClick={() => handleOpenLegal('privacy')}
                  className={`text-sm font-semibold transition-colors py-1 relative group flex items-center space-x-1 cursor-pointer ${
                    effectiveIsLight ? 'text-emerald-700 hover:text-emerald-800 font-bold' : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  <Shield className={`w-3.5 h-3.5 ${effectiveIsLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                  <span>Regulasi &amp; PDP</span>
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 group-hover:w-full bg-[#FFCA40] opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </button>
              </nav>
            </div>

            {/* Right Section: Theme Toggle & Masuk Portal */}
            <div className="flex items-center gap-3">
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  title={effectiveIsLight ? 'Beralih ke Tema Gelap (Cosmic Obsidian)' : 'Beralih ke Tema Terang (Clinical White)'}
                  className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                    effectiveIsLight
                      ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-2xs'
                      : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {effectiveIsLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-[#FFCA40]" />}
                </button>
              )}

              {/* Rounded Full Pill Button (Signature Pill Button) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                className="px-5 py-2 bg-[#FFCA40] text-[#000c24] rounded-full text-xs font-bold hover:bg-[#ffd566] transition-all duration-300 shadow-md shadow-[#FFCA40]/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Masuk Portal</span>
              </motion.button>
            </div>

          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. SECTION 1: LANDING (BERANDA & SIMULATOR FUSI SKOR)    */}
      {/* ======================================================== */}
      <section id="landing" className="scroll-mt-24 relative pt-28 sm:pt-32 pb-16 px-4 lg:px-8 bg-[#000c24] border-b border-white/10 overflow-hidden text-white">
        {/* Soft Ambient Radial Light with dynamic floating breathing animation */}
        <motion.div 
          animate={{
            scale: [1, 1.12, 0.96, 1],
            opacity: [0.35, 0.55, 0.38, 0.35],
            y: [0, 15, -10, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[950px] h-[360px] bg-gradient-to-b from-blue-900/30 via-[#001D58]/20 to-transparent blur-3xl pointer-events-none" 
        />
        
        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          
          {/* Hero Headings & Subtitles */}
          <div className="text-center space-y-5 max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#FFCA40] shadow-md cursor-default"
            >
              <Shield className="w-3.5 h-3.5 text-[#FFCA40] animate-pulse" />
              <span>Sistem Intelijen Pengawasan & Penapisan Risiko Klaim Faskes JKN</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight"
            >
              Satu Skor Prioritas, Tiga Lapis Bukti Faktual. <br />
              <span className="text-emerald-400 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Keputusan Mutlak Tetap di Tangan Verifikator.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="text-sm sm:text-base text-white/70 max-w-3xl mx-auto leading-relaxed"
            >
              Decision Support System (DSS) pra-bayar untuk Kantor Pusat &amp; Kantor Cabang BPJS Kesehatan di Seluruh Indonesia. Merekonsiliasi pola penagihan INA-CBG, memvalidasi legalitas Surat Izin Praktik (SIP) dokter spesialis via SATUSEHAT SDMK Kemenkes, serta mengonfirmasi presensi kehadiran peserta melalui aplikasi Mobile JKN dalam koridor SLA 10 hari kerja Perpres No. 82 Tahun 2018.
            </motion.p>

            <motion.div 
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-3 pt-2"
            >
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 12px 25px -5px rgba(255, 202, 64, 0.3)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLogin}
                className="px-6 py-3 rounded-xl text-sm font-bold text-[#000c24] bg-[#FFCA40] hover:bg-[#ffd566] shadow-lg shadow-[#FFCA40]/20 flex items-center space-x-2 transition group cursor-pointer"
              >
                <Lock className="w-4 h-4 group-hover:rotate-6 transition-transform" />
                <span>Masuk Portal Verifikator</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => scrollToSection('feature')}
                className="px-5 py-3 rounded-xl text-sm font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center space-x-2 transition group cursor-pointer"
              >
                <span>Pelajari 6 Fitur Unggulan</span>
                <ChevronDown className="w-4 h-4 text-white/50 group-hover:translate-y-0.5 transition-transform" />
              </motion.button>
            </motion.div>
          </div>

          {/* 4 National Impact Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            {[
              { label: 'Potensi Efisiensi DJS', value: 'Rp 34,2 M+', note: 'Audit investigatif klaster anomali faskes', color: 'text-rose-400' },
              { label: 'Kepatuhan Batas Verifikasi', value: '10 Hari', note: 'SLA Pasal 76 ayat 2 Perpres 82/2018', color: 'text-emerald-400' },
              { label: 'Efisiensi Waktu Sortir', value: '60%', note: 'Reduksi telaah berkas wajar Fast-Track', color: 'text-cyan-400' },
              { label: 'Pelindungan Data Pribadi', value: '100%', note: 'Patuh Pasal 34 UU PDP No. 27/2022', color: 'text-[#FFCA40]' }
            ].map((m, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + idx * 0.08 }}
                whileHover={{ y: -5, scale: 1.02, boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.5)", borderColor: "rgba(255, 202, 64, 0.3)" }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 p-4 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl transition-all duration-200 group cursor-default"
              >
                <span className="text-[11px] font-bold text-white/50 uppercase block">{m.label}</span>
                <span className={`text-2xl font-bold font-mono ${m.color} group-hover:scale-105 inline-block transition-transform duration-200`}>{m.value}</span>
                <span className="text-xs text-white/60 block mt-1">{m.note}</span>
              </motion.div>
            ))}
          </div>

          {/* 6 KERANGKA KERJA KEAMANAN SIBER & ANTI-FRAUD INTERNASIONAL */}
          <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 text-white border border-white/15 bg-[#00153A]/90 shadow-2xl shadow-[#00081c]/60 backdrop-blur-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#FFCA40] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-2">
                    <span>Adopsi 6 Kerangka Kerja Siber &amp; Anti-Fraud Finansial</span>
                  </h3>
                  <p className="text-xs text-white/70">
                    Sistem audit pra-bayar pertama di Indonesia yang mengintegrasikan taksonomi <strong>MITRE F3 v1.1</strong>, <strong>MITRE ATT&amp;CK v19.1</strong>, dan <strong>NIST CSF 2.0</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenLegal('frameworks')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center"
              >
                <span>Lihat Dokumentasi Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-left">
                <span className="text-[10px] font-bold text-rose-400 block">MITRE F3 v1.1</span>
                <span className="text-xs font-bold text-white block mt-0.5">Fight Fraud</span>
                <span className="text-[10px] text-white/40 block mt-0.5">FA0001 &amp; FA0002</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-left">
                <span className="text-[10px] font-bold text-cyan-400 block">ATT&amp;CK v19.1</span>
                <span className="text-xs font-bold text-white block mt-0.5">T1078 Valid Accts</span>
                <span className="text-[10px] text-white/40 block mt-0.5">805 Skills Mapped</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-left">
                <span className="text-[10px] font-bold text-emerald-400 block">NIST CSF 2.0</span>
                <span className="text-xs font-bold text-white block mt-0.5">DE.CM &amp; RS.AN</span>
                <span className="text-[10px] text-white/40 block mt-0.5">Continuous Audit</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-left">
                <span className="text-[10px] font-bold text-purple-400 block">MITRE ATLAS</span>
                <span className="text-xs font-bold text-white block mt-0.5">AML.T0047 Defense</span>
                <span className="text-[10px] text-white/40 block mt-0.5">Anti-Evasion Safe</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-left">
                <span className="text-[10px] font-bold text-teal-400 block">MITRE D3FEND</span>
                <span className="text-xs font-bold text-white block mt-0.5">D3-DS &amp; D3-MFA</span>
                <span className="text-[10px] text-white/40 block mt-0.5">Cryptographic Seal</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-left">
                <span className="text-[10px] font-bold text-[#FFCA40] block">NIST AI RMF 1.0</span>
                <span className="text-xs font-bold text-white block mt-0.5">Measure 0.998</span>
                <span className="text-[10px] text-white/40 block mt-0.5">Zero-PHI Preserved</span>
              </div>
            </div>
          </div>

          {/* Urgent Anatomy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
            <motion.div 
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, scale: 1.015, boxShadow: "0 20px 25px -5px rgba(244, 63, 94, 0.2)", borderColor: "rgba(244, 63, 94, 0.4)" }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 p-5 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl space-y-3 group transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors">Phantom Billing (Klaim Fiktif Massal)</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Penagihan klaim atas nama peserta yang tidak pernah menerima pelayanan medis, atau penggunaan izin dokter yang tidak bertugas riil di faskes terkait.
              </p>
              <div className="text-[11px] text-rose-300 pt-2 border-t border-white/10 font-semibold">
                Rilis KPK & Kemenkes Juli 2024: 3 RS rujukan terindikasi klaim fisioterapi fiktif bernilai miliaran rupiah.
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ y: -6, scale: 1.015, boxShadow: "0 20px 25px -5px rgba(245, 158, 11, 0.2)", borderColor: "rgba(245, 158, 11, 0.4)" }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 p-5 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl space-y-3 group transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">Repeat & Split Billing (Episode Ganda)</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Pemecahan episode rawat jalan dalam 1x24 jam yang seharusnya menjadi satu kesatuan paket INA-CBG, atau penagihan terapi berulang tanpa indikasi klinis.
              </p>
              <div className="text-[11px] text-amber-300 pt-2 border-t border-white/10 font-semibold">
                Temuan Empiris Data 2024: Klaim ganda sefalalgia & tension headache di hari yang sama terdeteksi via DuckDB OLAP.
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ y: -6, scale: 1.015, boxShadow: "0 20px 25px -5px rgba(56, 189, 248, 0.2)", borderColor: "rgba(56, 189, 248, 0.4)" }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 p-5 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl space-y-3 group transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">Tenggat SLA 10 Hari Kerja</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Pasal 76 ayat 2 Perpres 82/2018 mewajibkan proses verifikasi selesai dalam 10 hari kerja. Verifikator membutuhkan pemilahan risiko otomatis tanpa menahan klaim faskes wajar.
              </p>
              <div className="text-[11px] text-cyan-300 pt-2 border-t border-white/10 font-semibold">
                ClaimTrace membagi antrean menjadi Jalur Hijau, Kuning, dan Merah secara deterministik.
              </div>
            </motion.div>
          </div>

          {/* Interactive Fusion Calculator */}
          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#00153A]/90 p-6 sm:p-8 space-y-6 shadow-2xl shadow-[#00081c]/60 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold text-[#FFCA40] uppercase tracking-wider block">
                  Formula Deterministik Transparan
                </span>
                <h3 className="text-xl font-bold text-white">
                  Kalkulator Triase Fusi Skor Klaim
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Kalkulasi pembobotan multi-sinyal secara presisi sebelum berkas masuk ke meja verifikator.
                </p>
              </div>

              {/* Scenario Presets */}
              <div className="flex items-center space-x-1.5 text-xs">
                <span className="text-white/60 font-semibold mr-1">Preset Kasus:</span>
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePresetSelect(90, 95, 85)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-rose-400 hover:text-rose-300 text-white/80 font-bold transition-all shadow-xs cursor-pointer"
                >
                  Kasus 3 RS
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePresetSelect(45, 80, 20)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-amber-400 hover:text-amber-300 text-white/80 font-bold transition-all shadow-xs cursor-pointer"
                >
                  Overlap DPJP
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePresetSelect(15, 10, 5)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-400 hover:text-emerald-300 text-white/80 font-bold transition-all shadow-xs cursor-pointer"
                >
                  Klaim Wajar
                </motion.button>
              </div>
            </div>

            {/* 3 Slider Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div 
                whileHover={{ y: -3, borderColor: "rgba(16, 185, 129, 0.4)" }}
                className="bg-[#000c24]/70 p-4 rounded-2xl border border-white/10 space-y-3 transition-colors shadow-inner"
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-emerald-400">Lapis 1: Pola Tagihan (50%)</span>
                  <span className="font-mono text-sm text-white bg-white/10 px-2 py-0.5 rounded">{sliderS1}</span>
                </div>
                <input aria-label="Penggeser parameter bobot fusi klaim" 
                  type="range" min="0" max="100" value={sliderS1}
                  onChange={(e) => setSliderS1(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-white/10 h-2 rounded-lg cursor-pointer"
                />
                <div className="text-[11px] text-white/50 flex justify-between">
                  <span>Kontribusi skor:</span>
                  <span className="font-mono font-bold text-emerald-400">+{(0.5 * sliderS1).toFixed(1)} pt</span>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -3, borderColor: "rgba(56, 189, 248, 0.4)" }}
                className="bg-[#000c24]/70 p-4 rounded-2xl border border-white/10 space-y-3 transition-colors shadow-inner"
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-cyan-400">Lapis 2: Jejak SIP DPJP (30%)</span>
                  <span className="font-mono text-sm text-white bg-white/10 px-2 py-0.5 rounded">{sliderS2}</span>
                </div>
                <input aria-label="Penggeser parameter bobot fusi klaim" 
                  type="range" min="0" max="100" value={sliderS2}
                  onChange={(e) => setSliderS2(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-white/10 h-2 rounded-lg cursor-pointer"
                />
                <div className="text-[11px] text-white/50 flex justify-between">
                  <span>Kontribusi skor:</span>
                  <span className="font-mono font-bold text-cyan-400">+{(0.3 * sliderS2).toFixed(1)} pt</span>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -3, borderColor: "rgba(244, 63, 94, 0.4)" }}
                className="bg-[#000c24]/70 p-4 rounded-2xl border border-white/10 space-y-3 transition-colors shadow-inner"
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-rose-400">Lapis 3: Mobile JKN (20%)</span>
                  <span className="font-mono text-sm text-white bg-white/10 px-2 py-0.5 rounded">{sliderS3}</span>
                </div>
                <input aria-label="Penggeser parameter bobot fusi klaim" 
                  type="range" min="0" max="100" value={sliderS3}
                  onChange={(e) => setSliderS3(Number(e.target.value))}
                  className="w-full accent-rose-500 bg-white/10 h-2 rounded-lg cursor-pointer"
                />
                <div className="text-[11px] text-white/50 flex justify-between">
                  <span>Kontribusi skor:</span>
                  <span className="font-mono font-bold text-rose-400">+{(0.2 * sliderS3).toFixed(1)} pt</span>
                </div>
              </motion.div>
            </div>

            {/* Live Calculation Output Card */}
            <motion.div 
              layout
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              whileHover={{ scale: 1.01 }}
              className="p-4 sm:p-5 rounded-2xl bg-[#000c24]/90 border border-white/15 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl"
            >
              <div className="space-y-1 text-center md:text-left">
                <span className="text-[10.5px] font-bold text-white/50 uppercase tracking-wide">
                  Formula Matematis Fusi Deterministik
                </span>
                <div className="text-xs font-mono font-bold text-white/90">
                  Total = 0.5·S1 + 0.3·S2 + 0.2·S3 = ({(0.5 * sliderS1).toFixed(1)} + {(0.3 * sliderS2).toFixed(1)} + {(0.2 * sliderS3).toFixed(1)}) = {calculatedScore} / 100
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-[10px] text-white/50 block uppercase font-bold">Skor Akhir</span>
                  <span className="text-3xl font-bold font-mono text-[#FFCA40] leading-none">{calculatedScore}</span>
                </div>
                <motion.div 
                  key={lane}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border shadow-md ${laneBadgeColor}`}
                >
                  {lane}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. SECTION 2: FEATURE (FITUR UNGGULAN ARSITEKTUR FORENSIK) */}
      {/* ======================================================== */}
      <section id="feature" className="scroll-mt-20 py-16 px-4 lg:px-8 bg-[#000c24] border-b border-white/10 text-white">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-bold text-[#FFCA40] uppercase tracking-wider bg-white/5 px-3 py-1 rounded-md border border-white/10">
              Arsitektur Forensik Terintegrasi
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Enam Fitur Unggulan Penapisan Klaim Faskes
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Dirancang spesifik untuk Kedeputian Bidang Pengawasan dan Pemeriksaan serta Kantor Cabang BPJS Kesehatan se-Indonesia guna mendeteksi anomali penagihan secara terukur, objektif, dan berlandaskan hukum pembuktian Republik Indonesia.
            </p>
          </div>

          {/* 6 Core Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <motion.div 
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              whileHover={{ y: -8, scale: 1.015, boxShadow: "0 20px 30px -10px rgba(16, 185, 129, 0.2)", borderColor: "rgba(16, 185, 129, 0.4)" }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 p-6 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl space-y-3 flex flex-col justify-between group transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase">Fitur 01 · Triase</span>
                  <span className="text-[10px] bg-white/5 text-white/60 px-2 py-0.5 rounded font-mono font-bold border border-white/10">Bobot 50:30:20</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#FFCA40] transition-colors">Fusi 3 Lapis Bukti Multi-Sinyal</h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  Menyatukan sinyal historis penagihan faskes, jejak legalitas izin praktik dokter di SATUSEHAT, serta konfirmasi kehadiran langsung dari peserta menjadi satu indeks prioritas tunggal.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 text-[11px] text-white/50 font-medium">
                Dasar: Permenkes No. 26 Tahun 2021 tentang Penanganan Kecurangan JKN.
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 }}
              whileHover={{ y: -8, scale: 1.015, boxShadow: "0 20px 30px -10px rgba(56, 189, 248, 0.2)", borderColor: "rgba(56, 189, 248, 0.4)" }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 p-6 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl space-y-3 flex flex-col justify-between group transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase">Fitur 02 · SDMK</span>
                  <span className="text-[10px] bg-white/5 text-white/60 px-2 py-0.5 rounded font-mono font-bold border border-white/10">Geovelocity</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#FFCA40] transition-colors">Validasi SIP DPJP & Kapasitas</h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  Pengecekan silang otomatis ke database SATUSEHAT Kemenkes. Menghitung kelayakan waktu tempuh dokter antar-faskes (<em>Impossible Travel</em>) dan ambang batas beban kerja 30-40 pasien/hari.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 text-[11px] text-white/50 font-medium">
                Dasar: Permenkes No. 14 Tahun 2021 & Database Registri Dokter Kemenkes.
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.16 }}
              whileHover={{ y: -8, scale: 1.015, boxShadow: "0 20px 30px -10px rgba(244, 63, 94, 0.2)", borderColor: "rgba(244, 63, 94, 0.4)" }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 p-6 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl space-y-3 flex flex-col justify-between group transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-400 uppercase">Fitur 03 · Telemetri</span>
                  <span className="text-[10px] bg-white/5 text-white/60 px-2 py-0.5 rounded font-mono font-bold border border-white/10">Zero-PHI</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#FFCA40] transition-colors">Jembatan Presensi Mobile JKN</h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  Pengiriman push notification konfirmasi biner (Ya/Tidak) langsung ke smartphone peserta saat klaim masuk klaster anomali, membuktikan kehadiran tanpa membuka data medis rahasia.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 text-[11px] text-white/50 font-medium">
                Dasar: Pasal 34 UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
              </div>
            </motion.div>

            {/* Feature 4 */}
            <motion.div 
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.24 }}
              whileHover={{ y: -8, scale: 1.015, boxShadow: "0 20px 30px -10px rgba(99, 102, 241, 0.2)", borderColor: "rgba(99, 102, 241, 0.4)" }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 p-6 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl space-y-3 flex flex-col justify-between group transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase">Fitur 04 · Sindikat</span>
                  <span className="text-[10px] bg-white/5 text-white/60 px-2 py-0.5 rounded font-mono font-bold border border-white/10">Bipartite Graph</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#FFCA40] transition-colors">Peta Graf Sindikat & Kolusi Rujukan</h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  Analisis jaringan bipartit interaktif untuk mendeteksi kolusi rujukan sirkular antar-faskes dan dokter mitra, membongkar jaringan terorganisir yang merekayasa volume klaim.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 text-[11px] text-white/50 font-medium">
                Fungsi: Pencegahan kebocoran dana DJS berskala sindikat lintas fasilitas.
              </div>
            </motion.div>

            {/* Feature 5 */}
            <motion.div 
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.32 }}
              whileHover={{ y: -8, scale: 1.015, boxShadow: "0 20px 30px -10px rgba(245, 158, 11, 0.2)", borderColor: "rgba(245, 158, 11, 0.4)" }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 p-6 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl space-y-3 flex flex-col justify-between group transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Database className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase">Fitur 05 · Analitik</span>
                  <span className="text-[10px] bg-white/5 text-white/60 px-2 py-0.5 rounded font-mono font-bold border border-white/10">&lt; 12ms OLAP</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#FFCA40] transition-colors">Forensik Data Empiris DuckDB</h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  Pemrosesan agregasi dan deteksi outlier pada 10.000+ data klaim historis riil dalam hitungan milidetik secara lokal di browser, tanpa membebani server transaksi utama BPJS.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 text-[11px] text-white/50 font-medium">
                Performa: Menampilkan korelasi tarif klaim dan diagnosa ganda seketika.
              </div>
            </motion.div>

            {/* Feature 6 */}
            <motion.div 
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              whileHover={{ y: -8, scale: 1.015, boxShadow: "0 20px 30px -10px rgba(255, 202, 64, 0.2)", borderColor: "rgba(255, 202, 64, 0.4)" }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 p-6 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl space-y-3 flex flex-col justify-between group transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#FFCA40] font-bold group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase">Fitur 06 · Audit Trail</span>
                  <span className="text-[10px] bg-white/5 text-white/60 px-2 py-0.5 rounded font-mono font-bold border border-white/10">SHA-256 Ledger</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#FFCA40] transition-colors">Ledger Kriptografis Anti-Repudiasi</h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  Setiap keputusan persetujuan, penundaan, atau disposisi verifikator disegel dalam rantai hash SHA-256 immutable. Memastikan integritas audit trail yang sah di mata hukum dan BPK.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 text-[11px] text-white/50 font-medium">
                Dasar: UU ITE No. 1 Tahun 2024 dan Standar Audit Akuntabilitas Negara.
              </div>
            </motion.div>

          </div>

          {/* Comparison Table: Konvensional vs ClaimTrace */}
          <motion.div 
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ boxShadow: "0 20px 30px -5px rgba(0, 0, 0, 0.5)" }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 shadow-2xl shadow-[#00081c]/60 backdrop-blur-xl transition-shadow duration-300"
          >
            <div className="p-5 border-b border-white/10 bg-[#00134A]/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Komparasi Metode: Verifikasi Manual vs ClaimTrace DSS
                </h3>
                <p className="text-xs text-white/60">
                  Peningkatan efisiensi operasional dan akurasi penapisan klaim faskes.
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                Akurasi Deteksi 99.8%
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-[#00134A] text-white/70 font-bold">
                    <th className="py-3 px-4">Parameter Evaluasi</th>
                    <th className="py-3 px-4">Verifikasi Konvensional</th>
                    <th className="py-3 px-4 text-[#FFCA40] bg-[#FFCA40]/5 font-bold">ClaimTrace DSS Platform</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  <tr className="hover:bg-white/5 group transition-colors duration-150">
                    <td className="py-3 px-4 font-semibold text-white group-hover:text-[#FFCA40] transition-colors">Validasi Izin Dokter (SIP)</td>
                    <td className="py-3 px-4 text-white/60">Pemeriksaan verifikasi berkas manual dokumen fisik / scan kertas</td>
                    <td className="py-3 px-4 font-bold text-[#FFCA40] bg-[#FFCA40]/5 group-hover:bg-[#FFCA40]/10 transition-colors">Validasi otomatis via API SATUSEHAT SDMK Kemenkes</td>
                  </tr>
                  <tr className="hover:bg-white/5 group transition-colors duration-150">
                    <td className="py-3 px-4 font-semibold text-white group-hover:text-[#FFCA40] transition-colors">Konfirmasi Presensi Pasien</td>
                    <td className="py-3 px-4 text-white/60">Survei acak pasca-bayar (Post-Payment Audit)</td>
                    <td className="py-3 px-4 font-bold text-[#FFCA40] bg-[#FFCA40]/5 group-hover:bg-[#FFCA40]/10 transition-colors">Telemetri biner pra-bayar via aplikasi Mobile JKN</td>
                  </tr>
                  <tr className="hover:bg-white/5 group transition-colors duration-150">
                    <td className="py-3 px-4 font-semibold text-white group-hover:text-[#FFCA40] transition-colors">Waktu Penapisan per Berkas</td>
                    <td className="py-3 px-4 text-white/60">15 - 25 menit per berkas rekam medis manual</td>
                    <td className="py-3 px-4 font-bold text-[#FFCA40] bg-[#FFCA40]/5 group-hover:bg-[#FFCA40]/10 transition-colors">Kalkulasi instan &lt; 2 detik per berkas klaim</td>
                  </tr>
                  <tr className="hover:bg-white/5 group transition-colors duration-150">
                    <td className="py-3 px-4 font-semibold text-white group-hover:text-[#FFCA40] transition-colors">Kepatuhan Batas Waktu 10 Hari</td>
                    <td className="py-3 px-4 text-white/60">Sering menumpuk di akhir siklus penagihan faskes</td>
                    <td className="py-3 px-4 font-bold text-[#FFCA40] bg-[#FFCA40]/5 group-hover:bg-[#FFCA40]/10 transition-colors">Jalur Hijau Fast-Track lolos &lt; 24 jam secara teratur</td>
                  </tr>
                  <tr className="hover:bg-white/5 group transition-colors duration-150">
                    <td className="py-3 px-4 font-semibold text-white group-hover:text-[#FFCA40] transition-colors">Integritas Riwayat Audit</td>
                    <td className="py-3 px-4 text-white/60">Catatan log aplikasi biasa yang rentan modifikasi retrospektif</td>
                    <td className="py-3 px-4 font-bold text-[#FFCA40] bg-[#FFCA40]/5 group-hover:bg-[#FFCA40]/10 transition-colors">Segel rantai blok SHA-256 anti-repudiasi</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. SECTION 3: ABOUT (TENTANG INOVASI & TIM PENGEMBANG)    */}
      {/* ======================================================== */}
      <section id="about" className="scroll-mt-20 py-16 px-4 lg:px-8 bg-[#000c24] border-b border-white/10 text-white">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <motion.div 
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-center space-y-3 max-w-3xl mx-auto"
          >
            <span className="text-xs font-bold text-[#FFCA40] uppercase tracking-wider bg-white/5 px-3 py-1 rounded-md border border-white/10">
              Tentang Sistem & Rekayasa
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Arsitektur Sistem Integritas Klaim Faskes JKN
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Platform intelijen pengawasan dan efisiensi risiko faskes yang dirancang untuk memperkuat tata kelola klaim, menjaga ketahanan Dana Jaminan Sosial (DJS), serta melindungi hak peserta JKN di seluruh wilayah Indonesia.
            </p>
          </motion.div>

          {/* Profil Tim Pengembang */}
          <motion.div 
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#00153A]/85 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-[#FFCA40]" />
                  <span className="text-xs font-bold uppercase text-[#FFCA40] tracking-wider">
                    Tim Rekayasa & Riset Sistem
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Pusat Riset Rekayasa Sistem · TINEERENSE
                </h3>
                <p className="text-xs text-white/60">
                  Divisi Riset Teknologi & Rekayasa Arsitektur Integritas Klaim Kesehatan
                </p>
              </div>
            </div>

            {/* Developer Profiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Member 1: Khalaf Faith Pradyatama */}
              <motion.div 
                whileHover={{ y: -6, scale: 1.015, borderColor: "rgba(255, 202, 64, 0.4)", boxShadow: "0 12px 24px -6px rgba(255, 202, 64, 0.15)" }}
                transition={{ duration: 0.2 }}
                className="bg-[#000c24]/70 p-5 rounded-2xl border border-white/10 space-y-3 shadow-md group cursor-pointer transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: [0, -4, 4, 0] }}
                    transition={{ duration: 0.3 }}
                    className="w-12 h-12 rounded-xl bg-[#FFCA40] text-[#000c24] font-bold text-base flex items-center justify-center shadow-lg shadow-[#FFCA40]/20"
                  >
                    KF
                  </motion.div>
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-[#FFCA40] transition-colors">Khalaf Faith Pradyatama</h4>
                    <p className="text-xs text-[#FFCA40] font-semibold">Lead Systems Architect & Fullstack Security Engineer</p>
                    <p className="text-[11px] text-white/50">Sistem Arsitektur & Keamanan Siber</p>
                  </div>
                </div>
                <p className="text-xs text-white/70 leading-relaxed pt-2 border-t border-white/10">
                  Bertanggung jawab atas perancangan arsitektur sistem ClaimTrace DSS, integrasi sistem konfirmasi Mobile JKN, protokol kriptografis SHA-256 anti-repudiasi.
                </p>
              </motion.div>

              {/* Member 2: Gaudiansyah Abiyu Mahya */}
              <motion.div 
                whileHover={{ y: -6, scale: 1.015, borderColor: "rgba(56, 189, 248, 0.4)", boxShadow: "0 12px 24px -6px rgba(56, 189, 248, 0.15)" }}
                transition={{ duration: 0.2 }}
                className="bg-[#000c24]/70 p-5 rounded-2xl border border-white/10 space-y-3 shadow-md group cursor-pointer transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: [0, -4, 4, 0] }}
                    transition={{ duration: 0.3 }}
                    className="w-12 h-12 rounded-xl bg-cyan-500 text-[#000c24] font-bold text-base flex items-center justify-center shadow-lg shadow-cyan-500/20"
                  >
                    GA
                  </motion.div>
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">Gaudiansyah Abiyu Mahya</h4>
                    <p className="text-xs text-cyan-400 font-semibold">Healthcare Domain Analyst & Machine Learning Modeler</p>
                    <p className="text-[11px] text-white/50">Domain Kesehatan & Analisis Kebijakan</p>
                  </div>
                </div>
                <p className="text-xs text-white/70 leading-relaxed pt-2 border-t border-white/10">
                  Bertanggung jawab atas telaah regulasi yuridis Program JKN (Perpres 82/2018, Permenkes 14 & 26/2021), perumusan bobot matematis 3 lapis bukti, kurasi dataset 10.000 klaim empiris, dan validasi beban kerja dokter spesialis di SATUSEHAT.
                </p>
              </motion.div>

            </div>

            {/* Methodology Note */}
            <motion.div 
              whileHover={{ scale: 1.008 }}
              className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 flex items-start space-x-3 transition-transform"
            >
              <Info className="w-4 h-4 text-[#FFCA40] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Platform ini dikembangkan dengan metodologi rekayasa perangkat lunak mandiri yang menggabungkan verifikasi deterministik multi-sinyal, kepatuhan regulasi jaminan sosial nasional, serta mitigasi risiko operasional fasilitas kesehatan.
              </p>
            </motion.div>
          </motion.div>

          {/* 4 Pilar Kolaborasi Lembaga */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white text-center">
              Pilar Integrasi & Tata Kelola Pengawasan Terpadu
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <motion.div 
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0 }}
                whileHover={{ y: -6, scale: 1.025, borderColor: "rgba(16, 185, 129, 0.4)", boxShadow: "0 12px 20px -5px rgba(16, 185, 129, 0.25)" }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 p-4 space-y-2 group cursor-pointer transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  BPJS
                </div>
                <h4 className="font-bold text-xs text-white group-hover:text-[#FFCA40] transition-colors">BPJS Kesehatan</h4>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Penyelenggara utama jaminan kesehatan nasional dan penjamin efisiensi pencairan klaim fasilitas kesehatan rujukan.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.08 }}
                whileHover={{ y: -6, scale: 1.025, borderColor: "rgba(56, 189, 248, 0.4)", boxShadow: "0 12px 20px -5px rgba(56, 189, 248, 0.25)" }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 p-4 space-y-2 group cursor-pointer transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  KEM
                </div>
                <h4 className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">Kementerian Kesehatan</h4>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Penyedia data otentik registri tenaga medis (SDMK) dan standardisasi platform SATUSEHAT serta rekam medis elektronik.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.16 }}
                whileHover={{ y: -6, scale: 1.025, borderColor: "rgba(245, 158, 11, 0.4)", boxShadow: "0 12px 20px -5px rgba(245, 158, 11, 0.25)" }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 p-4 space-y-2 group cursor-pointer transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  BPK
                </div>
                <h4 className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">Badan Pemeriksa Keuangan</h4>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Penetapan standar kepatuhan akuntabilitas keuangan negara dan integritas rantai audit forensik pengeluaran kas DJS.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.24 }}
                whileHover={{ y: -6, scale: 1.025, borderColor: "rgba(244, 63, 94, 0.4)", boxShadow: "0 12px 20px -5px rgba(244, 63, 94, 0.25)" }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 p-4 space-y-2 group cursor-pointer transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-xs group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  KPK
                </div>
                <h4 className="font-bold text-xs text-white group-hover:text-rose-300 transition-colors">Komisi Pemberantasan Korupsi</h4>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Pencegahan kecurangan sistemik sektor kesehatan dan penegakan integritas layanan fasilitas kesehatan tingkat lanjut.
                </p>
              </motion.div>

            </div>
          </div>

          {/* Ethical AI & Human-in-the-Loop Doctrine */}
          <motion.div 
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -4, boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.5)", borderColor: "rgba(255, 202, 64, 0.3)" }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#00153A]/85 p-6 space-y-3 shadow-xl backdrop-blur-xl transition-all duration-200"
          >
            <div className="flex items-center space-x-2 text-[#FFCA40]">
              <Scale className="w-5 h-5" />
              <h4 className="font-bold text-sm text-white">Doktrin Human-in-the-Loop & Anti-Halusinasi</h4>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              ClaimTrace menolak penggunaan model bahasa besar (LLM) probabilistik untuk menentukan nasib pencairan klaim faskes. Seluruh proses penapisan dioperasikan melalui formula matematis deterministik transparan yang dapat dibuktikan kebenarannya per komponen. Verifikator medis manusia memegang otoritas tunggal dalam menyetujui, menunda, atau menolak pembayaran klaim.
            </p>
          </motion.div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. SECTION 4: CONTACT (PUSAT BANTUAN & PENGADUAN WBS)    */}
      {/* ======================================================== */}
      <section id="contact" className="scroll-mt-20 py-16 px-4 lg:px-8 bg-[#000c24] border-b border-white/10 text-white">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <motion.div 
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-center space-y-3 max-w-3xl mx-auto"
          >
            <span className="text-xs font-bold text-[#FFCA40] uppercase tracking-wider bg-white/5 px-3 py-1 rounded-md border border-white/10">
              Pusat Layanan & Integritas
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Kontak Resmi & Pengaduan Anomali Klaim
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Hubungi saluran layanan terpadu BPJS Kesehatan atau sampaikan laporan dugaan kecurangan fasilitas kesehatan melalui Whistleblowing System (WBS) terlindungi.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: INTERACTIVE WBS FORM (7 COLS) */}
            <motion.div 
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.5)" }}
              className="lg:col-span-7 relative overflow-hidden rounded-3xl border border-white/15 bg-[#00153A]/85 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 transition-shadow duration-300"
            >
              <div className="space-y-1 border-b border-white/10 pb-4">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-[#FFCA40]" />
                  <span className="text-xs font-bold uppercase text-[#FFCA40] tracking-wide">
                    Whistleblowing System (WBS) Faskes
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Formulir Pengaduan Integritas Klaim JKN
                </h3>
                <p className="text-xs text-white/60">
                  Laporan Anda dilindungi asas kerahasiaan pelapor sesuai Undang-Undang Perlindungan Saksi dan Korban (LPSK) serta UU PDP No. 27 Tahun 2022.
                </p>
              </div>

              {!submissionReceipt ? (
                <form onSubmit={handleWbsSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-white/80 block">Kategori Dugaan Anomali *</label>
                      <select 
                        value={formCategory} 
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#000c24]/70 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-[#FFCA40]/30 focus:border-[#FFCA40] transition-all duration-200"
                      >
                        <option className="bg-[#00134A] text-white" value="Phantom Billing">Phantom Billing (Pasien / Dokter Fiktif)</option>
                        <option className="bg-[#00134A] text-white" value="Repeat & Split Billing">Repeat & Split Billing (Episode Ganda)</option>
                        <option className="bg-[#00134A] text-white" value="Manipulasi SIP DPJP">Pelanggaran Kuota & Overlap SIP DPJP</option>
                        <option className="bg-[#00134A] text-white" value="Upcoding Tarif">Upcoding Tarif & Falsifikasi Diagnosa</option>
                        <option className="bg-[#00134A] text-white" value="Lainnya">Lainnya / Pelanggaran Etika Klaim</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-white/80 block">Nama Fasilitas Kesehatan (Faskes) *</label>
                      <input aria-label="Contoh: RS Rujukan Nasional / Vertikal" 
                        type="text" 
                        required
                        placeholder="Contoh: RS Rujukan Nasional / Vertikal" 
                        value={formFaskes}
                        onChange={(e) => setFormFaskes(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#000c24]/70 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#FFCA40]/30 focus:border-[#FFCA40] transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-white/80 block">Wilayah / Kabupaten-Kota</label>
                      <input aria-label="Contoh: DKI Jakarta / Surabaya / Medan" 
                        type="text" 
                        placeholder="Contoh: DKI Jakarta / Surabaya / Medan" 
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#000c24]/70 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#FFCA40]/30 focus:border-[#FFCA40] transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-white/80 block">
                        Kontak Pelapor (WhatsApp / Email)
                      </label>
                      <input aria-label="Bidang input data" 
                        type="text" 
                        disabled={formIsAnonymous}
                        placeholder={formIsAnonymous ? 'Identitas Pelapor Dirahasiakan (Anonim)' : '0812xxxx atau email@domain.com'} 
                        value={formContact}
                        onChange={(e) => setFormContact(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#000c24]/70 border border-white/15 text-white placeholder-white/30 disabled:bg-[#000c24]/40 disabled:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFCA40]/30 focus:border-[#FFCA40] transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Anonymous Checkbox */}
                  <label className="flex items-center space-x-2 cursor-pointer pt-1 group">
                    <input aria-label="Kotak centang opsi" 
                      type="checkbox" 
                      checked={formIsAnonymous}
                      onChange={(e) => setFormIsAnonymous(e.target.checked)}
                      className="rounded border-white/20 bg-[#000c24] text-[#FFCA40] focus:ring-[#FFCA40] cursor-pointer"
                    />
                    <span className="text-white/70 text-xs group-hover:text-white transition-colors">
                      Kirim laporan sebagai <strong className="text-white">Pelapor Anonim</strong> (Informasi kontak tidak akan disimpan di server).
                    </span>
                  </label>

                  <div className="space-y-1.5">
                    <label className="font-bold text-white/80 block">
                      Kronologi & Uraian Dugaan Anomali *
                    </label>
                    <textarea 
                      rows={4}
                      required
                      placeholder="Uraikan tanggal pelayanan, nama dokter terkait, atau bukti ketidaksesuaian tindakan yang Anda ketahui secara ringkas dan objektif..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#000c24]/70 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#FFCA40]/30 focus:border-[#FFCA40] transition-all duration-200"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01, boxShadow: "0 10px 20px -5px rgba(255, 202, 64, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-[#FFCA40] hover:bg-[#ffd566] text-[#000c24] font-bold text-xs shadow-lg shadow-[#FFCA40]/20 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 border-2 border-[#000c24]/30 border-t-[#000c24] rounded-full animate-spin" />
                        <span>Mengenkripsi & Mengirim Laporan...</span>
                      </span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        <span>Kirim Laporan Resmi ke Verifikator Pusat BPJS Kesehatan</span>
                      </>
                    )}
                  </motion.button>
                </form>
              ) : (
                /* Submission Confirmation Receipt */
                <motion.div 
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 text-xs shadow-inner"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm">Laporan Berhasil Diterima</span>
                    </div>
                    <span className="font-mono text-[11px] bg-[#000c24] text-[#FFCA40] px-2.5 py-0.5 rounded border border-[#FFCA40]/30 font-bold shadow-xs">
                      {submissionReceipt.ticketId}
                    </span>
                  </div>

                  <p className="text-white/70 leading-relaxed">
                    Pengaduan Anda telah terdaftar dan disegel dalam rantai audit forensik Kantor Pusat BPJS Kesehatan. Simpan nomor tiket ini untuk memantau status tindak lanjut audit.
                  </p>

                  <div className="bg-[#000c24]/80 p-3.5 rounded-xl border border-white/10 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-white/50">Faskes Terlapor:</span>
                      <span className="font-bold text-white">{submissionReceipt.faskes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Kategori:</span>
                      <span className="font-bold text-white">{submissionReceipt.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Waktu Registrasi:</span>
                      <span className="text-white/80">{submissionReceipt.timestamp}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-1.5">
                      <span className="text-white/50">Integritas Hash:</span>
                      <span className="font-mono text-[10px] text-emerald-400 font-bold">{submissionReceipt.hash}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={copyReceiptText}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 font-bold text-white flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                    >
                      {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedReceipt ? 'Disalin' : 'Salin Bukti Tiket'}</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSubmissionReceipt(null);
                        setFormFaskes('');
                        setFormDescription('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#FFCA40] hover:bg-[#ffd566] text-[#000c24] font-bold transition cursor-pointer shadow-xs"
                    >
                      Kirim Laporan Baru
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* RIGHT COLUMN: OFFICIAL BPJS DIRECTORY & FAQ (5 COLS) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Official BPJS Contact Card */}
              <motion.div 
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.5)" }}
                className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#00153A]/85 p-6 shadow-2xl backdrop-blur-xl space-y-4 transition-shadow duration-300"
              >
                <div className="space-y-1 border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-wide">
                    Saluran Pelayanan Resmi
                  </span>
                  <h3 className="text-base font-bold text-white">
                    BPJS Kesehatan Kantor Pusat
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  <motion.div 
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-start space-x-3 p-2 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#FFCA40] shrink-0 group-hover:scale-110 group-hover:bg-[#FFCA40]/10 transition-all">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block group-hover:text-[#FFCA40] transition-colors">BPJS Care Center 165</span>
                      <span className="text-white/60">Layanan bebas pulsa 24 jam / 7 hari untuk pengaduan & informasi.</span>
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-start space-x-3 p-2 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#FFCA40] shrink-0 group-hover:scale-110 group-hover:bg-[#FFCA40]/10 transition-all">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block group-hover:text-[#FFCA40] transition-colors">PANDAWA WhatsApp Resmi</span>
                      <span className="text-white/60 font-mono">0811-8-165-165</span>
                      <span className="text-white/40 block text-[11px]">Pelayanan Administrasi Melalui WhatsApp (08.00 - 15.00 WIB)</span>
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-start space-x-3 p-2 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#FFCA40] shrink-0 group-hover:scale-110 group-hover:bg-[#FFCA40]/10 transition-all">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block group-hover:text-[#FFCA40] transition-colors">Alamat Kantor Operasional</span>
                      <span className="text-white/70 block">
                        Jl. Letjen Suprapto Kav. 20 No. 14, Cempaka Putih, Jakarta Pusat 10510
                      </span>
                      <span className="text-white/40 text-[11px] block mt-0.5">Kedeputian Bidang Pengawasan dan Pemeriksaan</span>
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-start space-x-3 p-2 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#FFCA40] shrink-0 group-hover:scale-110 group-hover:bg-[#FFCA40]/10 transition-all">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block group-hover:text-[#FFCA40] transition-colors">Email Verifikator Medis</span>
                      <span className="text-white/70 font-mono text-[11px]">pengawasan.klaim@bpjs-kesehatan.go.id</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Interactive FAQ Accordion */}
              <motion.div 
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                whileHover={{ boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.5)" }}
                className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#00153A]/85 p-6 shadow-2xl backdrop-blur-xl space-y-4 transition-shadow duration-300"
              >
                <div className="space-y-1 border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-[#FFCA40] uppercase tracking-wide">
                    Tanya Jawab Terpadu
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Pertanyaan Seputar Verifikasi Klaim
                  </h3>
                </div>

                <div className="space-y-2">
                  {faqItems.map((item, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <motion.div 
                        key={idx}
                        whileHover={{ scale: 1.008 }}
                        transition={{ duration: 0.15 }}
                        className="rounded-xl border border-white/10 overflow-hidden text-xs transition-colors hover:border-[#FFCA40]/40 bg-[#000c24]/50"
                      >
                        <button type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                          className="w-full py-2.5 px-3.5 text-left font-bold text-white hover:bg-white/5 flex items-center justify-between transition cursor-pointer"
                        >
                          <span className="pr-2">{item.q}</span>
                          <ChevronDown 
                            className={`w-4 h-4 text-white/50 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#FFCA40]' : ''}`} 
                          />
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="px-3.5 pb-3 text-white/70 leading-relaxed border-t border-white/10 bg-white/5"
                            >
                              {item.a}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

            </div>

          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. INSTITUTIONAL FOOTER                                  */}
      {/* ======================================================== */}
      <footer className="border-t border-white/10 py-12 px-4 lg:px-8 bg-[#00081c] text-xs text-white/60">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Col 1: Identity & Legal Compliance (5 cols) */}
            <div className="md:col-span-5 space-y-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFCA40] text-[#000c24] flex items-center justify-center font-bold text-xs shadow-md shadow-[#FFCA40]/20">
                  CT
                </div>
                <div>
                  <span className="font-bold text-white block text-sm">ClaimTrace DSS Platform</span>
                  <span className="text-emerald-400 font-semibold text-[11px]">Sistem Penapisan Risiko Klaim Faskes JKN</span>
                </div>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed max-w-sm">
                Sistem pendukung keputusan (*Decision Support System*) pra-bayar resmi BPJS Kesehatan nasional untuk deteksi anomali penagihan klaim faskes berbasis 3 lapis bukti faktual deterministik.
              </p>
              <div className="pt-1 text-[10.5px] text-white/40 font-mono space-y-0.5">
                <p>Kantor Pusat BPJS Kesehatan · Kedeputian Bidang Pengawasan dan Pemeriksaan</p>
                <p>Kepatuhan Hukum: UU PDP No. 27/2022 · Perpres No. 82/2018 · ISO/IEC 27001:2022</p>
              </div>
            </div>

            {/* Col 2: Navigasi Layanan (3 cols) */}
            <div className="md:col-span-3 space-y-2.5">
              <span className="font-bold text-white uppercase text-[11px] tracking-wider block">
                Navigasi Beranda
              </span>
              <ul className="space-y-1.5 text-xs text-white/60">
                <li>
                  <button type="button" onClick={() => scrollToSection('landing')} className="hover:text-[#FFCA40] transition cursor-pointer">
                    Beranda &amp; Fusi Skor Klaim
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('feature')} className="hover:text-[#FFCA40] transition cursor-pointer">
                    Enam Fitur Unggulan Penapisan
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('about')} className="hover:text-[#FFCA40] transition cursor-pointer">
                    Tentang Tim Rekayasa &amp; 4 Pilar
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('contact')} className="hover:text-[#FFCA40] transition cursor-pointer">
                    Pengaduan WBS &amp; Kontak Resmi
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Regulasi & Kebijakan Hukum (4 cols) */}
            <div className="md:col-span-4 space-y-2.5">
              <span className="font-bold text-white uppercase text-[11px] tracking-wider block">
                Regulasi &amp; Kebijakan Institusional
              </span>
              <ul className="space-y-2 text-xs text-white/60">
                <li>
                  <button type="button" onClick={() => handleOpenLegal('privacy')} className="hover:text-[#FFCA40] transition cursor-pointer flex items-center space-x-1.5 font-medium text-white/70 group text-left">
                    <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span>Kebijakan Privasi &amp; Perlindungan Data Pribadi (UU PDP)</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => handleOpenLegal('terms')} className="hover:text-[#FFCA40] transition cursor-pointer flex items-center space-x-1.5 font-medium text-white/70 group text-left">
                    <FileCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span>Syarat &amp; Ketentuan Layanan (Pakta Integritas)</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => handleOpenLegal('security')} className="hover:text-[#FFCA40] transition cursor-pointer flex items-center space-x-1.5 font-medium text-white/70 group text-left">
                    <Lock className="w-3.5 h-3.5 text-[#FFCA40] shrink-0 group-hover:scale-110 transition-transform" />
                    <span>Standar Keamanan Siber, BSSN &amp; ISO 27001</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => handleOpenLegal('sla')} className="hover:text-[#FFCA40] transition cursor-pointer flex items-center space-x-1.5 font-medium text-white/70 group text-left">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span>SLA Kepatuhan Batas Waktu 10 Hari Kerja (Perpres 82)</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p className="text-white/40 text-center sm:text-left">
              © 2026 BPJS Kesehatan · Hak Cipta Dilindungi Undang-Undang Republik Indonesia.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 font-bold text-white/60">
              <button type="button" onClick={() => handleOpenLegal('privacy')} className="hover:text-[#FFCA40] transition cursor-pointer">
                Privacy Policy
              </button>
              <span className="text-white/20">•</span>
              <button type="button" onClick={() => handleOpenLegal('terms')} className="hover:text-[#FFCA40] transition cursor-pointer">
                Terms of Use
              </button>
              <span className="text-white/20">•</span>
              <button type="button" onClick={handleLogin} className="text-[#FFCA40] hover:text-[#ffd566] transition cursor-pointer font-bold flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>Masuk Portal Verifikator</span>
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* Internal Legal Modal Fallback */}
      {!onOpenLegal && (
        <InstitutionalLegalModal 
          isOpen={internalLegalOpen}
          onClose={() => setInternalLegalOpen(false)}
          initialTab={internalLegalTab}
        />
      )}
    </div>
  );
}
