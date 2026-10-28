import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hospital, AlertOctagon, CheckCircle2, Clock, ChevronRight, 
  Search, Filter, ShieldCheck, ArrowUpRight, TrendingUp, AlertTriangle,
  Lock, Calendar, Check, X, ArrowDownUp, FileText
} from 'lucide-react';

export default function TriageOverview({ onSelectCase, isLight: propIsLight }) {
  const [internalIsLight, setInternalIsLight] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('theme');
      if (p === 'light') return true;
      if (p === 'dark') return false;
      const root = document.getElementById('cockpit-root');
      if (root) return root.classList.contains('theme-light');
      return document.documentElement.classList.contains('light');
    }
    return false;
  });

  useEffect(() => {
    if (typeof propIsLight === 'boolean') {
      setInternalIsLight(propIsLight);
      return;
    }
    const updateTheme = () => {
      const root = document.getElementById('cockpit-root');
      if (root) setInternalIsLight(root.classList.contains('theme-light'));
      else setInternalIsLight(document.documentElement.classList.contains('light'));
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    const root = document.getElementById('cockpit-root');
    if (root) observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [propIsLight]);

  const isLight = typeof propIsLight === 'boolean' ? propIsLight : internalIsLight;

  const [activeLane, setActiveLane] = useState('all'); // 'all' | 'red' | 'yellow' | 'green'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaskes, setSelectedFaskes] = useState('all');

  const claims = [
    {
      id: 'CLM-2026-10-085',
      sep: '0132R0011026V000085',
      hospital: 'RS Khusus Mitra Husada',
      hospitalType: 'FKRTL (RS Khusus Kelas C)',
      code: 'Z-3-12-0',
      description: 'Prosedur Fisioterapi / Rehabilitasi Medis Massal Pasca-Baksos',
      tariff: 'Rp 15.300.000 (85 Klaim)',
      dpjp: 'dr. Hendra, Sp.KFR',
      sipNumber: '446.1/108/DPJP/2023',
      sampleCount: 10,
      deniedCount: 8,
      s1: 85,
      s2: 95,
      s3: 80,
      totalScore: 87.0,
      lane: 'red',
      status: 'AUDIT FREEZE MERAH',
      date: '14 Okt 2026',
      notes: 'Klaster baksos 85 pasien dalam 48 jam; SIP DPJP kedaluwarsa pada tgl layanan.',
      flags: ['PHANTOM', 'REPEAT'],
    },
    {
      id: 'CLM-2026-10-086',
      sep: '0132R0021026V000341',
      hospital: 'RS Hermina Kemayoran Jakarta',
      hospitalType: 'FKRTL (RS Swasta Kelas B)',
      code: 'Z-3-12-0',
      description: 'Prosedur Fisioterapi Rawat Jalan',
      tariff: 'Rp 360.000 (2 Tindakan)',
      dpjp: 'dr. Wijaya, Sp.KFR',
      sipNumber: '446.1/204/DPJP/2024',
      sampleCount: 10,
      deniedCount: 3,
      s1: 78,
      s2: 40,
      s3: 65,
      totalScore: 64.0,
      lane: 'yellow',
      status: 'KLARIFIKASI KUNING',
      date: '14 Okt 2026',
      notes: 'Penagihan berulang pada episode sama dalam 3 hari; memerlukan sinkronisasi rujukan.',
      flags: ['REPEAT'],
    },
    {
      id: 'CLM-2026-10-090',
      sep: '0114R0011026V004789',
      hospital: 'RSU Harapan Bunda',
      hospitalType: 'FKRTL (RS Swasta Kelas C)',
      code: 'I-4-10-III',
      description: 'Upcoding Sepsis Sekunder (A41.9) Rawat Inap',
      tariff: 'Rp 18.450.000',
      dpjp: 'dr. Nadia Kusuma, Sp.PK',
      sipNumber: '446.1/312/DPJP/2022',
      sampleCount: 10,
      deniedCount: 7,
      s1: 88,
      s2: 82,
      s3: 70,
      totalScore: 82.5,
      lane: 'red',
      status: 'AUDIT FREEZE MERAH',
      date: '14 Okt 2026',
      notes: 'Diagnosis sekunder berat tidak didukung hasil kultur darah maupun terapi antibiotik lini 3.',
      flags: ['UPCODING'],
    },
    {
      id: 'CLM-2026-10-092',
      sep: '0114R0011026V004390',
      hospital: 'RSUPN Dr. Cipto Mangunkusumo Jakarta',
      hospitalType: 'FKRTL (RS Pusat Rujukan Nasional Kelas A)',
      code: 'I-4-17-I',
      description: 'Pneumonia Bakterial Tanpa Komplikasi (J15.9)',
      tariff: 'Rp 5.800.000',
      dpjp: 'dr. Anton, Sp.P',
      sipNumber: '446.1/405/DPJP/2021',
      sampleCount: 10,
      deniedCount: 0,
      s1: 22,
      s2: 15,
      s3: 10,
      totalScore: 16.5,
      lane: 'green',
      status: 'FAST TRACK HIJAU',
      date: '14 Okt 2026',
      notes: 'Klaim wajar, konsisten dengan riwayat rawat inap dan konfirmasi Mobile JKN valid.',
      flags: ['REGULER'],
    },
    {
      id: 'CLM-2026-10-094',
      sep: '0114R0021026V001920',
      hospital: 'RSUP Dr. Sardjito Yogyakarta',
      hospitalType: 'FKRTL (RS Pemerintah Rujukan Kelas A)',
      code: 'K-4-12-I',
      description: 'Apendisitis Akut Tanpa Perforasi (K35.8)',
      tariff: 'Rp 7.200.000',
      dpjp: 'dr. Bambang, Sp.B',
      sipNumber: '446.1/510/DPJP/2023',
      sampleCount: 10,
      deniedCount: 0,
      s1: 18,
      s2: 12,
      s3: 14,
      totalScore: 14.8,
      lane: 'green',
      status: 'FAST TRACK HIJAU',
      date: '14 Okt 2026',
      notes: 'Tindakan operasi terdokumentasi lengkap dengan laporan anestesi dan patologi anatomi.',
      flags: ['REGULER'],
    },
    {
      id: 'CLM-2026-10-095',
      sep: '0114R0031026V002811',
      hospital: 'RSUP Fatmawati Jakarta',
      hospitalType: 'FKRTL (RS Pemerintah Kelas A)',
      code: 'N-4-10-II',
      description: 'Hemodialisis Rutin (Z49.1)',
      tariff: 'Rp 890.000',
      dpjp: 'dr. Farida, Sp.PD-KGH',
      sipNumber: '446.1/618/DPJP/2022',
      sampleCount: 10,
      deniedCount: 2,
      s1: 65,
      s2: 55,
      s3: 50,
      totalScore: 57.5,
      lane: 'yellow',
      status: 'KLARIFIKASI KUNING',
      date: '13 Okt 2026',
      notes: 'Jadwal HD overlap dengan entri SIMRS pada hari yang sama di faskes primer.',
      flags: ['DUPLICATE_TIME'],
    },
  ];

  const redCount = claims.filter(c => c.lane === 'red').length;
  const yellowCount = claims.filter(c => c.lane === 'yellow').length;
  const greenCount = claims.filter(c => c.lane === 'green').length;

  const filteredClaims = claims.filter(c => {
    const matchesLane = activeLane === 'all' || c.lane === activeLane;
    const matchesFaskes = selectedFaskes === 'all' || c.hospital.toLowerCase().includes(selectedFaskes.toLowerCase());
    const matchesSearch = searchQuery === '' || 
      c.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dpjp.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLane && matchesFaskes && matchesSearch;
  });

  return (
    <div className={`space-y-4 font-inter pb-16 sm:pb-20 ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* HEADER STRIP */}
      <div className={`w-full px-4 py-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#00153A]/85 backdrop-blur-xl border-white/10 text-white shadow-2xl shadow-[#00081c]/50'
      }`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Triase Multi-Kanal &amp; Segmentasi Jalur Klaim
            </h2>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              isLight 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-white/5 text-[#FFCA40] border-white/10'
            }`}>
              MITRE F3: FA0001 &amp; FA0002 · ATT&amp;CK: T1078 · NIST CSF: DE.CM-01
            </span>
          </div>
          <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600 font-medium' : 'text-white/60'}`}>
            Pemisahan otomatis pra-pembayaran: Jalur Hijau (Fast-Track 89.6%), Jalur Kuning (Klarifikasi Dokumen 8.4%), dan Jalur Merah (Audit Investigasi Fraud 2.0%).
          </p>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          whileHover={{ y: -2 }}
          className={`rounded-2xl p-4 border transition-all relative overflow-hidden group ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-slate-300'
              : 'bg-[#00153A]/80 backdrop-blur-md border-white/10 shadow-xl shadow-[#00081c]/40 hover:border-white/20'
          }`}
        >
          <div className="absolute top-2 right-3 p-2 opacity-10 pointer-events-none transition-transform group-hover:scale-110">
            <FileText className={`w-12 h-12 ${isLight ? 'text-slate-900' : 'text-white'}`} />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className={`text-[10.5px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Total Pengajuan Klaim
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/5 text-cyan-300 border-white/10'
            }`}>
              14 OKT 2026
            </span>
          </div>
          <div className={`text-3xl font-bold mt-1 tabular-nums relative z-10 ${isLight ? 'text-slate-900' : 'text-white'}`}>4.341</div>
          <p className={`text-[11px] mt-0.5 relative z-10 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Klaim terdaftar pada siklus ini</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          whileHover={{ y: -2 }}
          className={`border-l-4 border-l-emerald-600 rounded-2xl p-4 border transition-all relative overflow-hidden group ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-slate-300'
              : 'bg-[#00153A]/80 backdrop-blur-md border-white/10 shadow-xl shadow-[#00081c]/40 hover:border-white/20'
          }`}
        >
          <div className="absolute top-2 right-3 p-2 opacity-10 pointer-events-none transition-transform group-hover:scale-110">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className={`text-[10.5px] font-bold uppercase tracking-wider text-balance ${
              isLight ? 'text-emerald-800' : 'text-emerald-300'
            }`}>
              Jalur Hijau (Fast-Track)
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${
              isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
            }`}>89.6%</span>
          </div>
          <div className={`text-3xl font-bold mt-1 tabular-nums tracking-tight relative z-10 ${
            isLight ? 'text-emerald-600' : 'text-emerald-400'
          }`}>3.892</div>
          <p className={`text-[11px] mt-0.5 text-pretty relative z-10 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Klaim wajar terverifikasi sah</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          whileHover={{ y: -2 }}
          className={`border-l-4 border-l-amber-500 rounded-2xl p-4 border transition-all relative overflow-hidden group ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-slate-300'
              : 'bg-[#00153A]/80 backdrop-blur-md border-white/10 shadow-xl shadow-[#00081c]/40 hover:border-white/20'
          }`}
        >
          <div className="absolute top-2 right-3 p-2 opacity-10 pointer-events-none transition-transform group-hover:scale-110">
            <AlertTriangle className="w-12 h-12 text-amber-500" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className={`text-[10.5px] font-bold uppercase tracking-wider text-balance ${
              isLight ? 'text-amber-800' : 'text-amber-300'
            }`}>
              Jalur Kuning (Klarifikasi)
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${
              isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'text-amber-300 bg-amber-500/15 border-amber-500/30'
            }`}>8.4%</span>
          </div>
          <div className={`text-3xl font-bold mt-1 tabular-nums tracking-tight relative z-10 ${
            isLight ? 'text-amber-600' : 'text-amber-400'
          }`}>364</div>
          <p className={`text-[11px] mt-0.5 text-pretty relative z-10 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Memerlukan berkas penunjang</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          whileHover={{ y: -2 }}
          className={`border-l-4 border-l-rose-500 rounded-2xl p-4 border transition-all relative overflow-hidden group ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-slate-300'
              : 'bg-[#00153A]/80 backdrop-blur-md border-white/10 shadow-xl shadow-[#00081c]/40 hover:border-white/20'
          }`}
        >
          <div className="absolute top-2 right-3 p-2 opacity-10 pointer-events-none transition-transform group-hover:scale-110">
            <AlertOctagon className="w-12 h-12 text-rose-500" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className={`text-[10.5px] font-bold uppercase tracking-wider text-balance ${
              isLight ? 'text-rose-800' : 'text-rose-300'
            }`}>
              Jalur Merah (Telaah Pra-Bayar)
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${
              isLight ? 'bg-rose-50 text-rose-700 border-rose-300' : 'text-rose-300 bg-rose-500/15 border-rose-500/30'
            }`}>2.0%</span>
          </div>
          <div className={`text-3xl font-bold mt-1 tabular-nums tracking-tight relative z-10 ${
            isLight ? 'text-rose-600' : 'text-rose-400'
          }`}>85</div>
          <p className={`text-[11px] mt-0.5 text-pretty relative z-10 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Indikasi Phantom / Repeat Billing</p>
        </motion.div>
      </div>

      {/* FILTER CONTROLS STRIP */}
      <div className={`rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 border ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm'
          : 'bg-[#00153A]/85 backdrop-blur-xl border-white/10 shadow-2xl'
      }`}>
        
        {/* Triage Lane Pills */}
        <div className="flex items-center space-x-1.5 text-xs font-semibold flex-wrap gap-y-1.5">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveLane('all')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-bold ${
              activeLane === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : (isLight
                    ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300'
                    : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10')
            }`}
          >
            Semua ({claims.length})
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveLane('red')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer font-bold ${
              activeLane === 'red'
                ? 'bg-rose-600 text-white shadow-sm'
                : (isLight
                    ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300'
                    : 'text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30')
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Jalur Merah ({redCount})</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveLane('yellow')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer font-bold ${
              activeLane === 'yellow'
                ? 'bg-amber-600 text-white shadow-sm'
                : (isLight
                    ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300'
                    : 'text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30')
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Klarifikasi ({yellowCount})</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveLane('green')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer font-bold ${
              activeLane === 'green'
                ? 'bg-emerald-600 text-white shadow-sm'
                : (isLight
                    ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300'
                    : 'text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30')
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Fast-Track ({greenCount})</span>
          </motion.button>
        </div>

        {/* Faceted Dropdowns & Search */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
          <select 
            value={selectedFaskes}
            onChange={(e) => setSelectedFaskes(e.target.value)}
            className={`text-xs px-3 py-2 rounded-xl border focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                : 'bg-white/5 text-white border-white/15 focus:border-[#FFCA40]'
            }`}
          >
            <option value="all" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>Semua Faskes (Nasional)</option>
            <option value="Mitra Husada" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>RS Khusus Mitra Husada</option>
            <option value="Hermina" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>RS Hermina Kemayoran Jakarta</option>
            <option value="Harapan Bunda" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>RSU Harapan Bunda</option>
            <option value="Cipto" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>RSUPN Dr. Cipto Mangunkusumo</option>
            <option value="Sardjito" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>RSUP Dr. Sardjito</option>
            <option value="Fatmawati" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>RSUP Fatmawati Jakarta</option>
          </select>

          <div className="relative min-w-[220px]">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
              isLight ? 'text-slate-400' : 'text-white/40'
            }`} />
            <input aria-label="Bidang input data"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SEP, DPJP, Faskes..."
              className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs transition focus:outline-none ${
                isLight
                  ? 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                  : 'bg-white/5 border border-white/15 text-white placeholder:text-white/40 focus:border-[#FFCA40]'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Contextual Cluster Banner */}
      <div className={`rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 shadow-xs border transition-all ${
        activeLane === 'red'
          ? (isLight ? 'bg-rose-50 text-rose-950 border-rose-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-200')
          : activeLane === 'yellow'
          ? (isLight ? 'bg-amber-50 text-amber-950 border-amber-300' : 'bg-amber-500/15 border-amber-500/30 text-amber-200')
          : (isLight ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200')
      }`}>
        <div className="flex items-center gap-2">
          <ShieldCheck className={`w-4 h-4 shrink-0 ${
            activeLane === 'red'
              ? (isLight ? 'text-rose-700' : 'text-rose-400')
              : activeLane === 'yellow'
              ? (isLight ? 'text-amber-700' : 'text-amber-400')
              : (isLight ? 'text-emerald-700' : 'text-emerald-400')
          }`} />
          <span>
            {activeLane === 'all' && (
              <>Menampilkan <strong className={`font-bold ${isLight ? 'text-emerald-900' : 'text-white'}`}>{filteredClaims.length} berkas prioritas</strong> audit pra-bayar dari total <strong className={`font-bold ${isLight ? 'text-emerald-900' : 'text-white'}`}>4.341 pengajuan klaim</strong> aktif pada siklus verifikasi 14 Okt 2026.</>
            )}
            {activeLane === 'red' && (
              <>Menampilkan <strong className={`font-bold ${isLight ? 'text-rose-900' : 'text-white'}`}>{filteredClaims.length} berkas telaah investigasi</strong> dari total <strong className={`font-bold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>85 anomali Jalur Merah</strong> aktif pada siklus verifikasi 14 Okt 2026.</>
            )}
            {activeLane === 'yellow' && (
              <>Menampilkan <strong className={`font-bold ${isLight ? 'text-amber-900' : 'text-white'}`}>{filteredClaims.length} berkas klarifikasi dokumen</strong> dari total <strong className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>364 klaim Jalur Kuning</strong> aktif pada siklus verifikasi 14 Okt 2026.</>
            )}
            {activeLane === 'green' && (
              <>Menampilkan <strong className={`font-bold ${isLight ? 'text-emerald-900' : 'text-white'}`}>{filteredClaims.length} berkas fast-track terverifikasi</strong> dari total <strong className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>3.892 klaim wajar Jalur Hijau</strong> aktif pada siklus verifikasi 14 Okt 2026.</>
            )}
          </span>
        </div>
        <span className={`text-[11px] font-semibold font-mono shrink-0 ${
          activeLane === 'red'
            ? (isLight ? 'text-rose-800' : 'text-rose-300')
            : activeLane === 'yellow'
            ? (isLight ? 'text-amber-800' : 'text-amber-300')
            : (isLight ? 'text-emerald-800' : 'text-emerald-300')
        }`}>
          Klaster Faskes Rujukan Nasional · Kepatuhan SLA 10 HK
        </span>
      </div>

      {/* TRIAGE QUEUE TABLE */}
      <div className={`rounded-2xl overflow-hidden border ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm'
          : 'bg-[#00153A]/85 backdrop-blur-xl border-white/10 shadow-2xl shadow-[#00081c]/50'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-fixed">
            <thead className={`text-[10px] uppercase font-bold tracking-wider border-b ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-black/40 text-white/70 border-white/10'
            }`}>
              <tr>
                <th className="py-3 px-4 w-[28%]">Klaim &amp; Faskes</th>
                <th className="py-3 px-4 w-[22%]">Kode INA-CBG</th>
                <th className="py-3 px-4 w-[18%]">DPJP (Dokter)</th>
                <th className="py-3 px-2 text-center w-[6%]">S1 (Pola)</th>
                <th className="py-3 px-2 text-center w-[6%]">S2 (Jejak)</th>
                <th className="py-3 px-2 text-center w-[6%]">S3 (Peserta)</th>
                <th className="py-3 px-3 text-center w-[7%]">Skor Fusi</th>
                <th className="py-3 px-4 text-right w-[7%]">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isLight ? 'divide-slate-200 text-slate-800' : 'divide-white/10 text-white/90'
            }`}>
              {filteredClaims.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertOctagon className="w-8 h-8 text-slate-400" />
                      <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>Tidak ada klaim yang cocok dengan kriteria filter.</p>
                      <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Silakan ubah filter jalur triase atau kata kunci pencarian Anda.</p>
                      <button type="button"
                        onClick={() => { setActiveLane('all'); setSelectedFaskes('all'); setSearchQuery(''); }}
                        className={`mt-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                          isLight
                            ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                            : 'text-cyan-300 hover:text-cyan-200 bg-white/5 border-white/15'
                        }`}
                      >
                        Reset Semua Filter
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {filteredClaims.map((c) => (
                <motion.tr
                  layout
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  className={`group cursor-pointer transition-colors duration-150 ${
                    c.lane === 'red' 
                      ? (isLight ? 'bg-rose-50/50 hover:bg-rose-100/60 border-l-4 border-l-rose-500' : 'bg-rose-500/10 hover:bg-rose-500/20 border-l-4 border-l-rose-500')
                      : c.lane === 'yellow'
                      ? (isLight ? 'bg-amber-50/50 hover:bg-amber-100/60 border-l-4 border-l-amber-500' : 'bg-amber-500/10 hover:bg-amber-500/20 border-l-4 border-l-amber-500')
                      : (isLight ? 'hover:bg-slate-50 border-l-4 border-l-emerald-600' : 'hover:bg-white/5 border-l-4 border-l-emerald-500')
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        c.lane === 'red' ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]' : c.lane === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <div className="min-w-0">
                        <div className={`font-bold transition truncate ${
                          isLight ? 'text-slate-900 group-hover:text-emerald-700' : 'text-white group-hover:text-cyan-300'
                        }`}>
                          {c.hospital}
                        </div>
                        <div className={`flex items-center space-x-1.5 text-[10.5px] font-mono mt-0.5 truncate ${
                          isLight ? 'text-slate-500' : 'text-white/50'
                        }`}>
                          <span className="font-semibold">{c.id}</span>
                          <span>•</span>
                          <span>{c.date}</span>
                          {c.flags.map(f => (
                            <span key={f} className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold shrink-0 ${
                              f.includes('PHANTOM') || f.includes('REPEAT')
                                ? (isLight ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30')
                                : (isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-white/10 text-white/70')
                            }`}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`font-mono font-bold text-xs block ${
                      isLight ? 'text-emerald-700' : 'text-[#FFCA40]'
                    }`}>{c.code}</span>
                    <p className={`text-[10.5px] truncate ${isLight ? 'text-slate-600' : 'text-white/60'}`} title={c.description}>{c.description}</p>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className={`font-medium truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{c.dpjp}</div>
                    <span className={`text-[10.5px] font-mono block ${isLight ? 'text-slate-500 font-semibold' : 'text-white/50'}`}>{c.tariff}</span>
                  </td>

                  <td className={`py-3.5 px-2 text-center font-mono font-bold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
                    {c.s1}
                  </td>
                  <td className={`py-3.5 px-2 text-center font-mono font-bold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
                    {c.s2}
                  </td>
                  <td className={`py-3.5 px-2 text-center font-mono font-bold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
                    {c.s3}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono shadow-xs border ${
                      c.lane === 'red'
                        ? (isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/40')
                        : c.lane === 'yellow'
                        ? (isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/40')
                        : (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40')
                    }`}>
                      {Number(c.totalScore).toFixed(1)}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <span className={`text-[11px] font-bold inline-flex items-center space-x-0.5 group-hover:translate-x-0.5 transition-transform ${
                      isLight ? 'text-emerald-700 group-hover:text-emerald-800' : 'text-cyan-300 group-hover:text-cyan-200'
                    }`}>
                      <span>Investigasi</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BOTTOM REGULATORY STRIP */}
        <div className={`px-4 py-2.5 border-t flex flex-wrap items-center justify-between text-[11px] ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-600'
            : 'bg-[#000c24]/90 border-white/10 text-white/50'
        }`}>
          <div className="flex items-center space-x-3">
            <span>Standar SLA: <strong className={isLight ? 'text-slate-800 font-bold' : 'text-white/80'}>Maksimal 10 Hari Kerja</strong></span>
            <span>•</span>
            <span>Regulasi: <strong className={isLight ? 'text-slate-800 font-bold' : 'text-white/80'}>Perpres No. 82/2018 Pasal 76 ayat 2</strong></span>
          </div>
          <div className={`flex items-center space-x-1.5 ${isLight ? 'text-slate-600 font-medium' : 'text-white/60'}`}>
            <ShieldCheck className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
            <span>Sistem Otentikasi Terintegrasi Smart Vedika</span>
          </div>
        </div>
      </div>
    </div>
  );
}
