import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, ArrowLeft, AlertTriangle, ShieldCheck, 
  Clock, Hospital, Stethoscope, UserCheck, AlertOctagon,
  TrendingUp, FileText, CheckCircle2, XCircle, Share2, 
  ExternalLink, Info, Activity, GitBranch, ArrowRight, Lock, Check,
  Bot, Zap, ShieldAlert, Sparkles
} from 'lucide-react';

export default function CaseInvestigation({ 
  caseData, 
  s1 = 85, 
  s2 = 95, 
  s3 = 80, 
  patientResponse = null, 
  onBackToQueue,
  onOpenGraph,
  onOpenDecision,
  onOpenAgentCopilot,
  isLight = false
}) {
  const defaultCase = {
    id: typeof caseData === 'string' ? caseData : 'CLM-2026-10-085',
    sep: '0132R0011026V000085',
    hospital: 'RS Khusus Mitra Husada',
    hospitalType: 'FKRTL (RS Khusus Kelas C)',
    code: 'Z-3-12-0',
    description: 'Prosedur Fisioterapi / Rehabilitasi Medis Massal Pasca-Baksos',
    tariff: 'Rp 15.300.000 (85 Klaim)',
    dpjp: 'dr. Hendra, Sp.KFR',
    sipNumber: '446.1/108/DPJP/2023',
    date: '14 Okt 2026',
    batchTag: 'BAKSOS_MASSAL_OKT26',
    sampleCount: 10,
    participantCount: 10,
    deniedCount: patientResponse === 'denied' ? 9 : patientResponse === 'confirmed' ? 7 : 8,
  };

  const currentCase = {
    ...defaultCase,
    ...((typeof caseData === 'object' && caseData !== null) ? caseData : {}),
    id: (typeof caseData === 'object' && caseData?.id) || defaultCase.id,
    sep: (typeof caseData === 'object' && caseData?.sep) || defaultCase.sep,
    hospital: (typeof caseData === 'object' && caseData?.hospital) || defaultCase.hospital,
    hospitalType: (typeof caseData === 'object' && caseData?.hospitalType) || defaultCase.hospitalType,
    code: (typeof caseData === 'object' && caseData?.code) || defaultCase.code,
    description: (typeof caseData === 'object' && caseData?.description) || defaultCase.description,
    tariff: (typeof caseData === 'object' && caseData?.tariff) || defaultCase.tariff,
    dpjp: (typeof caseData === 'object' && caseData?.dpjp) || defaultCase.dpjp,
    sipNumber: (typeof caseData === 'object' && caseData?.sipNumber) || defaultCase.sipNumber,
    date: (typeof caseData === 'object' && caseData?.date) || defaultCase.date,
    deniedCount: (typeof caseData === 'object' && caseData?.deniedCount !== undefined)
      ? caseData.deniedCount
      : (patientResponse === 'denied' ? 9 : patientResponse === 'confirmed' ? 7 : 8),
    sampleCount: (typeof caseData === 'object' && caseData?.sampleCount !== undefined)
      ? caseData.sampleCount
      : 10,
    participantCount: (typeof caseData === 'object' && (caseData?.participantCount || caseData?.sampleCount))
      || 10,
  };

  const weightedS1 = Math.round(0.5 * s1 * 10) / 10;
  const weightedS2 = Math.round(0.3 * s2 * 10) / 10;
  const weightedS3 = Math.round(0.2 * s3 * 10) / 10;
  const totalScore = Math.round((weightedS1 + weightedS2 + weightedS3) * 10) / 10;

  // Verified participants array
  const verifiedParticipants = [
    { id: 'PST-77218902', name: 'Khalaf Faith P.', status: patientResponse === 'denied' ? 'denied' : patientResponse === 'confirmed' ? 'confirmed' : 'pending_denied', target: true },
    { id: 'PST-77218903', name: 'Ahmad S.', status: 'denied', target: false },
    { id: 'PST-77218904', name: 'Siti R.', status: 'denied', target: false },
    { id: 'PST-77218905', name: 'Budi W.', status: 'denied', target: false },
    { id: 'PST-77218906', name: 'Dewi A.', status: 'confirmed', target: false },
    { id: 'PST-77218907', name: 'Eko P.', status: 'denied', target: false },
    { id: 'PST-77218908', name: 'Fitri N.', status: 'denied', target: false },
    { id: 'PST-77218909', name: 'Gunawan H.', status: 'denied', target: false },
    { id: 'PST-77218910', name: 'Haryanto T.', status: 'denied', target: false },
    { id: 'PST-77218911', name: 'Indah K.', status: 'confirmed', target: false },
  ];

  return (
    <div className={`space-y-4 font-inter ${isLight ? 'text-slate-800' : 'text-white'} tabular-nums`}>
      {/* UNIFIED EXECUTIVE CASE CARD -GLASSMORPHISM */}
      <div className={`${isLight ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300' : 'bg-[#00153A]/85 border-white/10 shadow-2xl shadow-[#00081c]/50 hover:border-white/20'} backdrop-blur-xl border rounded-2xl p-4 space-y-3 transition-all duration-300`}>
        {/* Row 1: Breadcrumb & Case Classification */}
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <div className={`flex items-center space-x-2 text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            <button 
              type="button"
              onClick={onBackToQueue}
              className={`${isLight ? 'text-slate-700 hover:text-emerald-700' : 'text-white/80 hover:text-emerald-400'} transition font-bold flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded`}
              aria-label="Kembali ke antrean triage kasus"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Antrean Triage</span>
            </button>
            <span className={isLight ? 'text-slate-300' : 'text-white/20'}>/</span>
            <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{currentCase.hospital}</span>
            <span className={isLight ? 'text-slate-300' : 'text-white/20'}>/</span>
            <span className={`font-mono px-2.5 py-0.5 rounded-lg border font-bold tabular-nums shadow-xs ${isLight ? 'text-emerald-800 bg-emerald-50 border-emerald-300' : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'}`}>
              {currentCase.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/10 text-white/80 border-white/15'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Telaah Prioritas Pra-Bayar · <strong className={isLight ? 'text-rose-700 font-bold' : 'text-rose-400 font-bold'}>Jalur Merah</strong></span>
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border tabular-nums ${isLight ? 'text-slate-600 bg-slate-100 border-slate-200' : 'text-white/60 bg-white/5 border-white/10'}`}>
              SEP: {currentCase.sep}
            </span>
          </div>
        </div>

        {/* Row 2: Main Hospital Details & Score Badge */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-lg sm:text-xl font-bold tracking-tight drop-shadow-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {currentCase.hospital}
              </h1>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-lg font-medium border ${isLight ? 'text-slate-700 bg-slate-100 border-slate-200' : 'text-white/70 bg-white/10 border-white/10'}`}>
                {currentCase.hospitalType}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`font-semibold px-2.5 py-1 rounded-xl border ${isLight ? 'text-slate-800 bg-slate-50 border-slate-200' : 'text-white/90 bg-white/5 border-white/10'}`}>
                INA-CBG <strong className={`tabular-nums font-mono ${isLight ? 'text-amber-800' : 'text-[#FFCA40]'}`}>{currentCase.code}</strong>: <span className={isLight ? 'text-slate-600 font-normal' : 'text-white/70 font-normal'}>{currentCase.description}</span>
              </span>
              <span className={`font-bold px-2.5 py-1 rounded-xl font-mono tabular-nums shadow-xs border ${isLight ? 'text-emerald-800 bg-emerald-50 border-emerald-300' : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'}`}>
                {currentCase.tariff}
              </span>
              <span className={`px-2.5 py-1 rounded-xl border ${isLight ? 'text-slate-700 bg-slate-50 border-slate-200' : 'text-white/70 bg-white/5 border-white/10'}`}>
                Tanggal: <strong className={`font-mono tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>{currentCase.date}</strong>
              </span>
              <span className={`px-2.5 py-1 rounded-xl border ${isLight ? 'text-slate-700 bg-slate-50 border-slate-200' : 'text-white/70 bg-white/5 border-white/10'}`}>
                DPJP: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{currentCase.dpjp}</strong>
              </span>
            </div>
          </div>

          {/* Right Action: Clean Refined Score Badge & Primary CTA */}
          <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
            <div className={`relative overflow-hidden rounded-2xl px-4 py-2 text-center backdrop-blur border ${isLight ? 'bg-slate-50 border-slate-200 shadow-xs' : 'bg-white/5 border-white/10 shadow-md'}`}>
              <span className={`text-[9.5px] font-bold uppercase tracking-widest block ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                Skor Anomali
              </span>
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span className={`text-2xl font-bold font-mono leading-none tabular-nums ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                  {totalScore}
                </span>
                <span className={`text-[10px] font-bold tabular-nums ${isLight ? 'text-slate-400' : 'text-white/40'}`}>/ 100</span>
              </div>
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenDecision}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/20 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              aria-label="Eksekusi Berita Acara Klarifikasi Bersama"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Eksekusi BAKB</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* Row 3: SLA & AI Copilot Inline Strip */}
        <div className={`pt-2.5 border-t flex flex-wrap items-center justify-between text-xs gap-2 ${isLight ? 'border-slate-200 text-slate-700' : 'border-white/10 text-white/60'}`}>
          <div className={`flex items-center space-x-2 font-semibold ${isLight ? 'text-emerald-800' : 'text-amber-300'}`}>
            <Clock className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-amber-400'}`} />
            <span>Sisa Batas Verifikasi: <strong className={`tabular-nums font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>7 Hari Kerja</strong> <span className={isLight ? 'text-slate-600 font-normal' : 'text-white/60 font-normal'}>(Pasal 76 ayat 2 Perpres No. 82/2018)</span></span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenAgentCopilot}
              className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none border shadow-xs ${isLight ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300' : 'text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30'}`}
              aria-label="Buka AI Agent ReAct Copilot untuk investigasi mendalam"
            >
              <Bot className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
              <span>AI Agent ReAct Copilot: <strong className={isLight ? 'text-emerald-950' : 'text-white'}>Phantom &amp; Repeat Billing</strong></span>
              <ArrowRight className={`w-3 h-3 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 3-LAYER EVIDENCE MATRIX - GLASS PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* LAPIS 1: POLA TAGIHAN */}
        <div className={`${isLight ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300' : 'bg-[#00153A]/80 border-white/10 shadow-xl shadow-[#00081c]/40 hover:border-white/20'} backdrop-blur-md border rounded-2xl p-4 space-y-3 transition-all duration-300`}>
          <div className={`flex items-center justify-between border-b pb-2 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Lapis 1 · Radar Pola Tagihan
                </span>
                <span className={`text-[9.5px] font-mono font-bold block ${isLight ? 'text-emerald-800' : 'text-[#FFCA40]'}`}>
                  MITRE F3: FA0002.F1018 (Unbundling Arbitrage)
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold font-mono tabular-nums ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>S1: {s1}</span>
              <span className={`text-[9.5px] block tabular-nums font-semibold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Bobot 50% = +{weightedS1}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className={`p-2.5 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between text-[11px]">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Lonjakan Volume:</span>
                <span className={`font-semibold font-mono tabular-nums ${isLight ? 'text-slate-800' : 'text-white/90'}`}><strong className={isLight ? 'text-rose-700 font-bold' : 'text-rose-400 font-bold'}>8.5x</strong> Baseline Faskes</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Rentang Waktu:</span>
                <span className={`font-semibold font-mono tabular-nums ${isLight ? 'text-slate-900' : 'text-white/90'}`}>85 klaim dalam 48 jam</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Pola Episode:</span>
                <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>Penagihan Massal Tanpa Jeda</span>
              </div>
            </div>

            {/* MINI SPARKLINE BAR CHART WITH MOTION */}
            <div className={`p-2.5 rounded-xl border space-y-1.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000c24]/80 border-white/10'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold block uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-white/60'}`}>
                  Volume Harian vs Baseline
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${isLight ? 'text-rose-700 bg-slate-100 border-slate-200' : 'text-rose-400 bg-white/10 border-white/15'}`}>
                  Anomaly Spike
                </span>
              </div>
              <div className="flex items-end justify-between h-12 pt-1 px-1 gap-1.5 text-center font-mono tabular-nums">
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <span className={`text-[8.5px] font-bold tabular-nums ${isLight ? 'text-slate-800' : 'text-white/50'}`}>10</span>
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: '0.65rem' }} 
                    transition={{ duration: 0.2 }}
                    className={`w-full rounded-t ${isLight ? 'bg-slate-300' : 'bg-white/20'}`} 
                  />
                  <span className={`text-[8.5px] font-semibold ${isLight ? 'text-slate-700' : 'text-white/40'}`}>11 Okt</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <span className={`text-[8.5px] font-bold tabular-nums ${isLight ? 'text-slate-800' : 'text-white/50'}`}>12</span>
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: '0.8rem' }} 
                    transition={{ duration: 0.2 }}
                    className={`w-full rounded-t ${isLight ? 'bg-slate-300' : 'bg-white/20'}`} 
                  />
                  <span className={`text-[8.5px] font-semibold ${isLight ? 'text-slate-700' : 'text-white/40'}`}>12 Okt</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <span className={`text-[8.5px] font-bold tabular-nums ${isLight ? 'text-slate-800' : 'text-white/50'}`}>8</span>
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: '0.55rem' }} 
                    transition={{ duration: 0.2 }}
                    className={`w-full rounded-t ${isLight ? 'bg-slate-300' : 'bg-white/20'}`} 
                  />
                  <span className={`text-[8.5px] font-semibold ${isLight ? 'text-slate-700' : 'text-white/40'}`}>13 Okt</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <span className={`text-[8.5px] font-bold tabular-nums ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>85</span>
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: '2.1rem' }} 
                    transition={{ duration: 0.2, type: "spring", stiffness: 200 }}
                    className="w-full bg-rose-500 rounded-t shadow-xs" 
                  />
                  <span className={`text-[8.5px] font-bold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>14 Okt</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <span className={`text-[8.5px] font-bold tabular-nums ${isLight ? 'text-slate-800' : 'text-white/50'}`}>11</span>
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: '0.7rem' }} 
                    transition={{ duration: 0.2 }}
                    className={`w-full rounded-t ${isLight ? 'bg-slate-300' : 'bg-white/20'}`} 
                  />
                  <span className={`text-[8.5px] font-semibold ${isLight ? 'text-slate-700' : 'text-white/40'}`}>15 Okt</span>
                </div>
              </div>
            </div>

            <p className={`text-[10.5px] leading-relaxed font-medium ${isLight ? 'text-slate-800' : 'text-white/60'}`}>
              Analisis mendeteksi 85 klaim diajukan serentak pasca baksos tanpa rekam medis perorangan yang wajar.
            </p>
          </div>
        </div>

        {/* LAPIS 2: JEJAK SDMK */}
        <div className={`${isLight ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300' : 'bg-[#00153A]/80 border-white/10 shadow-xl shadow-[#00081c]/40 hover:border-white/20'} backdrop-blur-md border rounded-2xl p-4 space-y-3 transition-all duration-300`}>
          <div className={`flex items-center justify-between border-b pb-2 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-cyan-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Lapis 2 · Validasi SDMK
                </span>
                <span className={`text-[9.5px] font-mono font-bold block ${isLight ? 'text-emerald-800' : 'text-cyan-300'}`}>
                  MITRE ATT&amp;CK: T1078 · F3: FA0001
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>S2: {s2}</span>
              <span className={`text-[9.5px] block font-semibold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Bobot 30% = +{weightedS2}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className={`p-2.5 rounded-xl space-y-1 border ${isLight ? 'bg-slate-50 border-slate-200 shadow-xs' : 'bg-white/5 border-white/10 shadow-xs'}`}>
              <div className={`flex items-center space-x-1.5 font-bold text-[11px] ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                <AlertOctagon className={`w-4 h-4 shrink-0 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
                <span>HARD-TRIGGER: SIP DPJP Kedaluwarsa</span>
              </div>
              <p className={`text-[10.5px] leading-relaxed font-medium ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                SATUSEHAT SDMK mendeteksi DPJP telah mutasi &amp; tidak aktif berpraktik pada tgl layanan.
              </p>
            </div>

            <div className={`p-2.5 rounded-xl border space-y-1 text-[11px] ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>DPJP Tertera:</span>
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{currentCase.dpjp}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>No. SIP:</span>
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white/90'}`}>{currentCase.sipNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Status SATUSEHAT:</span>
                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}><span className={isLight ? 'text-rose-700' : 'text-rose-400'}>NON-AKTIF</span> (Mutasi)</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Kapasitas Pelayanan:</span>
                <span className={`font-bold ${isLight ? 'text-emerald-800' : 'text-cyan-300'}`}>85 Pasien / Hari</span>
              </div>
            </div>

            <div className={`p-2 rounded-xl border text-[10px] space-y-0.5 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/60'}`}>
              <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-white/90'}`}>Rujukan Standar Permenkes 14/2021:</span>
              <p className="leading-relaxed font-medium">
                Beban kerja maks 30–40 px/hari. Klaim 85 tindakan secara fisik melampaui kapasitas wajar.
              </p>
            </div>
          </div>
        </div>

        {/* LAPIS 3: KONFIRMASI PESERTA */}
        <div className={`rounded-2xl p-4 space-y-3 backdrop-blur-md border transition-all duration-300 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#00153A]/80 border-white/10 shadow-xl'
        }`}>
          <div className={`flex items-center justify-between border-b pb-2 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full shadow-md ${
                patientResponse === 'denied' ? 'bg-rose-500 shadow-rose-500/60' : 'bg-purple-500 shadow-purple-500/60'
              }`} />
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Lapis 3 · Konfirmasi Peserta
                </span>
                <span className={`text-[9.5px] font-mono font-bold block ${isLight ? 'text-purple-800' : 'text-purple-300'}`}>
                  MITRE F3: FA0001.F1005 · D3FEND: D3-MFA
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                S3: {s3}
              </span>
              <span className={`text-[9.5px] block font-semibold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Bobot 20% = +{weightedS3}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {/* LIVE RESPONSE STATUS */}
            <div className={`p-2.5 rounded-xl border backdrop-blur-xs ${
              patientResponse === 'denied'
                ? isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white'
                : patientResponse === 'confirmed'
                ? isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                : isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className={isLight ? 'text-slate-700' : 'text-white/80'}>Hasil Konfirmasi Peserta:</span>
                <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <strong className={isLight ? 'text-rose-700 font-bold' : 'text-rose-400 font-bold'}>{currentCase.deniedCount}</strong> / {currentCase.sampleCount} Menyangkal
                </span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden mt-1.5 flex ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentCase.deniedCount / currentCase.sampleCount) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-rose-500 h-full" 
                />
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentCase.sampleCount - currentCase.deniedCount) / currentCase.sampleCount) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-emerald-500 h-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" 
                />
              </div>
            </div>

            {/* LIVE PARTICIPANTS VERIFICATION GRID (COMPACT 4 ITEMS) */}
            <div className={`p-2.5 rounded-xl border space-y-1.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <div className={`flex items-center justify-between text-[10.5px] ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>Konfirmasi Faktual:</span>
                <span className={`font-bold text-[10px] flex items-center gap-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Mobile JKN Live</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {verifiedParticipants.slice(0, 4).map((p) => (
                  <motion.div 
                    key={p.id}
                    whileHover={{ y: -1 }}
                    className={`p-1.5 rounded-lg border text-[10.5px] flex items-center justify-between transition ${
                      p.target 
                        ? isLight ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-800 shadow-xs' : 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200' 
                        : isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white/80'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {p.status === 'denied' || (p.target && patientResponse === 'denied') ? (
                      <XCircle className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
                    ) : p.status === 'confirmed' || (p.target && patientResponse === 'confirmed') ? (
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                    ) : (
                      <Clock className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* PRIVACY GROUNDING */}
            <div className={`p-2 rounded-xl border text-[10px] flex items-start space-x-2 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-white/60'}`}>
              <ShieldCheck className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span className="leading-relaxed">
                <strong className={isLight ? 'text-slate-800' : 'text-white/90'}>UU PDP No. 27/2022:</strong> Konfirmasi biner tanpa membocorkan data medis sensitif.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* CROSS-VALIDATION EVIDENCE TABLE - DARK GLASS TABLE */}
      <div className={`${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#00153A]/85 border-white/10 shadow-2xl shadow-[#00081c]/50'} backdrop-blur-xl border rounded-2xl p-4 space-y-3`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <FileText className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-cyan-400'}`} />
            <span>Matriks Sintesis Bukti Pra-Bayar (Cross-Validation)</span>
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${isLight ? 'text-slate-700 bg-slate-100 border-slate-200' : 'text-white/50 bg-white/5 border-white/10'}`}>
            Protokol DSS BPJS Kesehatan
          </span>
        </div>

        <div className={`backdrop-blur-sm border rounded-xl overflow-hidden ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y text-left text-xs ${isLight ? 'divide-slate-200' : 'divide-white/10'}`}>
              <thead className={isLight ? 'bg-slate-100' : 'bg-black/30'}>
                <tr>
                  <th className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Lapis Analisis</th>
                  <th className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Indikator yang Diuji</th>
                  <th className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Hasil Evaluasi</th>
                  <th className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Tingkat Risiko</th>
                  <th className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>TTP Kerangka Kerja (F3 · ATT&amp;CK · NIST)</th>
                  <th className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Rujukan Regulasi</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-[11px] ${isLight ? 'divide-slate-100' : 'divide-white/10'}`}>
                <tr className={`${isLight ? 'hover:bg-slate-100/50' : 'hover:bg-white/5'} transition-colors`}>
                  <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>Lapis 1 (Pola)</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Analisis Klaster &amp; Repeat Billing</td>
                  <td className={`py-2.5 px-3 font-semibold font-mono ${isLight ? 'text-slate-800' : 'text-white/90'}`}>85 klaim dalam 48 jam (8.5x lonjakan)</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>TINGGI</span>
                  </td>
                  <td className={`py-2.5 px-3 font-mono text-[10px] font-bold ${isLight ? 'text-emerald-900' : 'text-[#FFCA40]'}`}>F3: FA0002.F1018 · NIST: DE.CM-01</td>
                  <td className={`py-2.5 px-3 font-semibold font-mono ${isLight ? 'text-slate-800' : 'text-white/60'}`}>Permenkes 26/2021</td>
                </tr>
                <tr className={`${isLight ? 'hover:bg-slate-100/50' : 'hover:bg-white/5'} transition-colors`}>
                  <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-emerald-800' : 'text-cyan-400'}`}>Lapis 2 (Jejak)</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Validasi SATUSEHAT &amp; Beban Kerja</td>
                  <td className={`py-2.5 px-3 font-semibold font-mono ${isLight ? 'text-slate-800' : 'text-white/90'}`}>SIP Non-Aktif &amp; Beban 85 px/hari</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>HARD-TRIGGER</span>
                  </td>
                  <td className={`py-2.5 px-3 font-mono text-[10px] font-bold ${isLight ? 'text-emerald-900' : 'text-cyan-300'}`}>ATT&amp;CK: T1078 · NIST: PR.AC-01</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-800' : 'text-white/60'}`}>Permenkes No. 14/2021</td>
                </tr>
                <tr className={`${isLight ? 'hover:bg-slate-100/50' : 'hover:bg-white/5'} transition-colors`}>
                  <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-purple-800' : 'text-purple-400'}`}>Lapis 3 (Peserta)</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Konfirmasi Kehadiran Mobile JKN</td>
                  <td className={`py-2.5 px-3 font-semibold font-mono ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                    {currentCase.deniedCount} dari {currentCase.sampleCount} peserta menyangkal
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>KONFIRMATIF</span>
                  </td>
                  <td className={`py-2.5 px-3 font-mono text-[10px] font-bold ${isLight ? 'text-purple-900' : 'text-purple-300'}`}>F3: FA0001.F1005 · D3FEND: D3-MFA</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-800' : 'text-white/60'}`}>UU PDP No. 27/2022</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className={`flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl p-3 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#00153A]/90 border-white/10 shadow-2xl'}`}>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onBackToQueue}
          className={`text-xs font-semibold flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${isLight ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200' : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'}`}
          aria-label="Kembali ke antrean kasus"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Antrean</span>
        </motion.button>

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenGraph}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer border shadow-xs ${isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-white/10 hover:bg-white/15 text-white border-white/15'}`}
          >
            <GitBranch className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-cyan-400'}`} />
            <span>Topologi Graf Relasi</span>
          </motion.button>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenDecision}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-2 transition shadow-md shadow-emerald-900/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Tindak Lanjut Konsol Keputusan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
