import React, { useState, useEffect } from 'react';
import { API_BASE_URL, getCachedJsonSync, cachedAuthGetJson } from '../../services/apiConfig';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hospital, AlertOctagon, CheckCircle2, Clock, ChevronRight, 
  Search, Filter, ShieldCheck, ArrowUpRight, TrendingUp, AlertTriangle,
  Lock, Calendar, Check, X, ArrowDownUp, FileText
} from 'lucide-react';

export default function TriageOverview({ onSelectCase, isLight: propIsLight, initialSearchQuery = '' }) {
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

  const mapLiveClaims = (rawList) => (Array.isArray(rawList) ? rawList : []).map(({ claim, triage }) => {
    const laneCode = triage?.triage_lane === 'MERAH' ? 'red' : triage?.triage_lane === 'KUNING' ? 'yellow' : 'green';
    const flags = [];
    const addFlag = (tag) => {
      if (tag && !flags.includes(tag)) flags.push(tag);
    };
    addFlag(triage?.ai_anomaly_prediction?.primary_anomaly_category);
    if (claim.dpjp_meta?.sip_status === 'EXPIRED') addFlag('SIP_EXPIRED');
    if (claim.episode_meta?.indikasi_repeat_billing) addFlag('REPEAT_BILLING');
    if (claim.mobile_meta?.status_konfirmasi === 'ANOMALY_DENIED') addFlag('MOBILE_DENIED');
    if (flags.length === 0) addFlag(triage?.triage_lane === 'HIJAU' ? 'GREEN_VERIFIED' : 'REVIEW_REQUIRED');
    return {
      id: claim.claim_id,
      sep: claim.fkl02_id_kunjungan || claim.claim_id,
      hospital: claim.nama_faskes,
      date: claim.tanggal_layanan,
      code: claim.ina_cbg_code,
      description: claim.deskripsi_cbg,
      dpjp: claim.dpjp_meta?.nama_dpjp_alias || '-',
      tariff: `Rp ${Number(claim.nilai_klaim_rp || 0).toLocaleString('id-ID')}`,
      claimCount: claim.episode_meta?.jumlah_klaim_klaster || 1,
      s1: Math.round(claim.s1_score ?? triage?.score_breakdown?.s1_value ?? 0),
      s2: Math.round(claim.s2_score ?? triage?.score_breakdown?.s2_value ?? 0),
      s3: Math.round(claim.s3_score ?? triage?.score_breakdown?.s3_value ?? 0),
      totalScore: Number(triage?.final_priority_score ?? triage?.raw_weighted_score ?? 0),
      lane: laneCode,
      flags,
      statusVerifikasi: claim.status_verifikasi,
      rawClaim: claim,
      rawTriage: triage,
    };
  });

  const claimsUrl = `${API_BASE_URL}/api/v1/claims`;
  const statsUrl = `${API_BASE_URL}/api/v1/system/national-scale-metrics`;
  const pipelineUrl = `${API_BASE_URL}/api/v1/screening/pipeline-summary`;
  const cachedClaimsRaw = getCachedJsonSync(claimsUrl);
  const cachedStatsRaw = getCachedJsonSync(statsUrl);
  const cachedPipelineRaw = getCachedJsonSync(pipelineUrl);

  const [activeLane, setActiveLane] = useState('all'); // 'all' | 'red' | 'yellow' | 'green'
  const [activeModus, setActiveModus] = useState('all'); // 'all' | 'PHANTOM' | 'REPEAT' | 'SIP' | 'MOBILE' | 'UPCODING'
  const [showThresholdRules, setShowThresholdRules] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [selectedFaskes, setSelectedFaskes] = useState('all');
  const [liveClaims, setLiveClaims] = useState(() => cachedClaimsRaw ? mapLiveClaims(cachedClaimsRaw) : []);
  const [portfolioStats, setPortfolioStats] = useState(() => cachedStatsRaw?.window_metrics || cachedStatsRaw?.portfolio_metrics || null);
  const [pipelineSummary, setPipelineSummary] = useState(() => cachedPipelineRaw || null);
  const [isLoadingClaims, setIsLoadingClaims] = useState(() => !cachedClaimsRaw);

  useEffect(() => {
    let active = true;
    const fetchLiveQueue = async () => {
      if (!getCachedJsonSync(claimsUrl)) setIsLoadingClaims(true);
      try {
        const [rawList, statsData, pipeData] = await Promise.all([
          cachedAuthGetJson(claimsUrl),
          cachedAuthGetJson(statsUrl),
          cachedAuthGetJson(pipelineUrl),
        ]);
        if (rawList && active) {
          setLiveClaims(mapLiveClaims(rawList));
        }
        if (statsData && active) {
          setPortfolioStats(statsData?.window_metrics || statsData?.portfolio_metrics || null);
        }
        if (pipeData && active) {
          setPipelineSummary(pipeData);
        }
      } catch (err) {
        console.error('Gagal memuat antrean triase live:', err);
      } finally {
        if (active) setIsLoadingClaims(false);
      }
    };
    fetchLiveQueue();
    return () => { active = false; };
  }, [claimsUrl, statsUrl, pipelineUrl]);

  useEffect(() => {
    if (typeof initialSearchQuery === 'string') {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const redCount = liveClaims.filter(c => c.lane === 'red').length;
  const yellowCount = liveClaims.filter(c => c.lane === 'yellow').length;
  const greenCount = liveClaims.filter(c => c.lane === 'green').length;
  const totalQueueCount = liveClaims.length;
  const redPct = totalQueueCount ? ((redCount / totalQueueCount) * 100).toFixed(1) : '0.0';
  const yellowPct = totalQueueCount ? ((yellowCount / totalQueueCount) * 100).toFixed(1) : '0.0';
  const greenPct = totalQueueCount ? ((greenCount / totalQueueCount) * 100).toFixed(1) : '0.0';
  const uniqueFaskesOptions = Array.from(new Set(liveClaims.map(c => c.hospital).filter(Boolean)));

  const filteredClaims = liveClaims.filter(c => {
    const matchesLane = activeLane === 'all' || c.lane === activeLane;
    const matchesFaskes = selectedFaskes === 'all' || c.hospital.toLowerCase().includes(selectedFaskes.toLowerCase());
    const joinedFlags = `${c.flags.join(' ')} ${(c.rawTriage?.kode_indikator || []).join(' ')}`.toUpperCase();
    const matchesModus =
      activeModus === 'all' ||
      (activeModus === 'PHANTOM' && (joinedFlags.includes('PHANTOM') || joinedFlags.includes('IND-L1-06') || joinedFlags.includes('COPYPASTE'))) ||
      (activeModus === 'REPEAT' && (joinedFlags.includes('REPEAT') || joinedFlags.includes('IND-L1-11'))) ||
      (activeModus === 'SIP' && (joinedFlags.includes('SIP_EXPIRED') || joinedFlags.includes('IND-L2-SIP-EXP') || joinedFlags.includes('GEODIST') || joinedFlags.includes('SDMK'))) ||
      (activeModus === 'MOBILE' && (joinedFlags.includes('MOBILE_DENIED') || joinedFlags.includes('IND-L3-PRESENSI'))) ||
      (activeModus === 'UPCODING' && joinedFlags.includes('UPCODING'));
    const matchesSearch = searchQuery === '' || 
      c.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dpjp.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLane && matchesModus && matchesFaskes && matchesSearch;
  });

  const screeningStages = Array.isArray(pipelineSummary?.stages) && pipelineSummary.stages.length === 4
    ? pipelineSummary.stages
    : [
        {
          stage: 1,
          name: 'Tahap 1 · Filter Awal & Pengecualian PRB',
          rule: 'Menyaring 1.699.219 FPK dan mengecualikan resep kronis PRB <= 30 hari (PMK 3/2023 Pasal 37).',
          metric_label: '1.697.588 (99,90%) wajar -> Fast-Track Hijau',
        },
        {
          stage: 2,
          name: 'Tahap 2 · Pola Lonjakan & Klaim Ganda (#6/#11)',
          rule: 'Deteksi lonjakan klaster >= 3,0x baseline, koreksi tarif FKL47 vs FKL48, dan klaim ganda hari sama.',
          metric_label: '4.876 pasang klaim ganda (9.555 berkas) + 1.631 koreksi tarif',
        },
        {
          stage: 3,
          name: 'Tahap 3 · SDMK, Geovelocity & NLP ChromaDB',
          rule: 'Uji SIP Expired (Hard Trigger >= 75), kecepatan antar-RS OSRM > 120 km/jam, dan duplikasi teks >= 90%.',
          metric_label: 'S2 memisahkan SIP Expired (Merah) vs Unsynced (Kuning)',
        },
        {
          stage: 4,
          name: 'Tahap 4 · Konfirmasi Mobile JKN & Fusi (0 - 100)',
          rule: 'Skor = 0,50*S1 + 0,30*S2 + 0,20*S3 -> Hijau (<50), Kuning (50-74,9), Merah (>=75 / Hard Trigger).',
          metric_label: 'Keputusan tetap Human-in-the-Loop + BAKB SHA-256',
        },
      ];
  const thresholdList = pipelineSummary?.scoring_spec?.thresholds || [];

  return (
    <div className={`space-y-4 font-inter pb-16 sm:pb-20 ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* HEADER STRIP */}
      <div className={`w-full px-4 py-3.5 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#00153A]/85 backdrop-blur-xl border-white/10 text-white shadow-2xl shadow-[#00081c]/50'
      }`}>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Pipeline Penyaringan Klaim Anomali Pra-Bayar
            </h2>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              isLight 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-white/5 text-[#FFCA40] border-white/10'
            }`}>
              Skala Resmi 0 - 100 · S = 0,50·S1 + 0,30·S2 + 0,20·S3
            </span>
          </div>
          <p className={`text-[11px] ${isLight ? 'text-slate-600 font-medium' : 'text-white/65'}`}>
            Tujuan tunggal: mengendalikan kecurangan #6 Phantom Billing, #11 Repeat Billing, dan Upcoding pra-bayar. Rentang sistem: <strong className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>Hijau 0–49,9</strong> · <strong className={isLight ? 'text-amber-700' : 'text-amber-300'}>Kuning 50,0–74,9</strong> · <strong className={isLight ? 'text-rose-700' : 'text-rose-400'}>Merah 75,0–100 (+ Hard Trigger)</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowThresholdRules((v) => !v)}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
          }`}
        >
          {showThresholdRules ? 'Tutup Detail Ambang Saring' : 'Lihat Parameter & Ambang Saring'}
        </button>
      </div>

      {/* 4-TAHAP CORONG PENYARINGAN KLAIM ANOMALI (CARA SISTEM MENYARING) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {screeningStages.map((st) => (
          <div
            key={st.stage}
            className={`rounded-2xl border p-3.5 space-y-1.5 transition-all ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
                : 'bg-[#00153A]/75 border-white/10 text-white'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                st.stage === 4
                  ? (isLight ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-rose-500/15 text-rose-300 border-rose-500/30')
                  : (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30')
              }`}>
                TAHAP {st.stage}
              </span>
              <span className={`text-[10px] font-mono font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Pra-Bayar Gate
              </span>
            </div>
            <h3 className={`text-xs font-bold leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {st.name.replace(/^Tahap \d+ · /, '')}
            </h3>
            <p className={`text-[10.5px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/65'}`}>
              {st.rule}
            </p>
            <div className={`pt-1.5 border-t text-[10.5px] font-mono font-bold ${
              isLight ? 'border-slate-100 text-emerald-700' : 'border-white/10 text-[#FFCA40]'
            }`}>
              {st.metric_label}
            </div>
          </div>
        ))}
      </div>

      {showThresholdRules && thresholdList.length > 0 && (
        <div className={`rounded-2xl border p-4 space-y-2.5 ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#001336]/90 border-white/15 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Acuan Parameter Saring &amp; Ambang Batas Resmi (Audit Rule Engine)
            </h3>
            <span className="text-[10px] font-mono opacity-75">Skala Skor: 0 - 100</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {thresholdList.map((th) => (
              <div key={th.key} className={`p-2.5 rounded-xl border text-[11px] ${
                isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold">{th.label}</span>
                  <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    {th.signal}
                  </span>
                </div>
                <p className={isLight ? 'text-slate-600' : 'text-white/70'}>{th.limit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <div className="flex items-center justify-between relative z-10">
            <span className={`text-[10.5px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Total Antrean Aktif ({totalQueueCount} Berkas)
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/5 text-cyan-300 border-white/10'
            }`}>
              LIVE DUCKDB + ENGINE
            </span>
          </div>
          <div className={`text-3xl font-bold mt-1 tabular-nums relative z-10 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {portfolioStats?.claims_volume ? Number(portfolioStats.claims_volume).toLocaleString('id-ID') : totalQueueCount.toLocaleString('id-ID')}
          </div>
          <p className={`text-[11px] mt-0.5 relative z-10 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            {portfolioStats?.claims_volume ? `Total klaim FKRTL nasional (${totalQueueCount} berkas triase aktif)` : 'Berkas antrean triase pra-bayar aktif'}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          whileHover={{ y: -2 }}
          className={`rounded-2xl p-4 border transition-all relative overflow-hidden group ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-slate-300'
              : 'bg-[#00153A]/80 backdrop-blur-md border-white/10 shadow-xl shadow-[#00081c]/40 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between relative z-10">
            <span className={`text-[10.5px] font-bold uppercase tracking-wider text-balance ${
              isLight ? 'text-emerald-800' : 'text-emerald-300'
            }`}>
              Jalur Hijau (Fast-Track)
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${
              isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
            }`}>{greenPct}%</span>
          </div>
          <div className={`text-3xl font-bold mt-1 tabular-nums tracking-tight relative z-10 ${
            isLight ? 'text-emerald-600' : 'text-emerald-400'
          }`}>{greenCount.toLocaleString('id-ID')}</div>
          <p className={`text-[11px] mt-0.5 text-pretty relative z-10 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            {portfolioStats?.full_approved_count ? `${Number(portfolioStats.full_approved_count).toLocaleString('id-ID')} lolos nasional` : 'Klaim wajar terverifikasi sah'}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          whileHover={{ y: -2 }}
          className={`rounded-2xl p-4 border transition-all relative overflow-hidden group ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-slate-300'
              : 'bg-[#00153A]/80 backdrop-blur-md border-white/10 shadow-xl shadow-[#00081c]/40 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between relative z-10">
            <span className={`text-[10.5px] font-bold uppercase tracking-wider text-balance ${
              isLight ? 'text-amber-800' : 'text-amber-300'
            }`}>
              Jalur Kuning (Klarifikasi)
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${
              isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'text-amber-300 bg-amber-500/15 border-amber-500/30'
            }`}>{yellowPct}%</span>
          </div>
          <div className={`text-3xl font-bold mt-1 tabular-nums tracking-tight relative z-10 ${
            isLight ? 'text-amber-600' : 'text-amber-400'
          }`}>{yellowCount.toLocaleString('id-ID')}</div>
          <p className={`text-[11px] mt-0.5 text-pretty relative z-10 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Memerlukan berkas penunjang</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          whileHover={{ y: -2 }}
          className={`rounded-2xl p-4 border transition-all relative overflow-hidden group ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-slate-300'
              : 'bg-[#00153A]/80 backdrop-blur-md border-white/10 shadow-xl shadow-[#00081c]/40 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between relative z-10">
            <span className={`text-[10.5px] font-bold uppercase tracking-wider text-balance ${
              isLight ? 'text-rose-800' : 'text-rose-300'
            }`}>
              Jalur Merah (Telaah Pra-Bayar)
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${
              isLight ? 'bg-rose-50 text-rose-700 border-rose-300' : 'text-rose-300 bg-rose-500/15 border-rose-500/30'
            }`}>{redPct}%</span>
          </div>
          <div className={`text-3xl font-bold mt-1 tabular-nums tracking-tight relative z-10 ${
            isLight ? 'text-rose-600' : 'text-rose-400'
          }`}>{redCount.toLocaleString('id-ID')}</div>
          <p className={`text-[11px] mt-0.5 text-pretty relative z-10 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            {portfolioStats?.severity_distribution?.Kritis ? `${Number(portfolioStats.severity_distribution.Kritis).toLocaleString('id-ID')} kritis historis` : 'Indikasi Phantom / Repeat Billing'}
          </p>
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
                ? (isLight ? 'bg-emerald-700 text-white shadow-sm' : 'bg-emerald-600 text-white shadow-sm')
                : (isLight
                    ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300'
                    : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10')
            }`}
          >
            Semua ({liveClaims.length})
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
                ? (isLight ? 'bg-emerald-700 text-white shadow-sm' : 'bg-emerald-600 text-white shadow-sm')
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
            aria-label="Filter berdasarkan modus anomali"
            value={activeModus}
            onChange={(e) => setActiveModus(e.target.value)}
            className={`text-xs px-3 py-2 rounded-xl border focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                : 'bg-white/5 text-white border-white/15 focus:border-[#FFCA40]'
            }`}
          >
            <option value="all" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>Semua Saringan Modus</option>
            <option value="PHANTOM" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>#6 Phantom / Lonjakan &gt;= 3x</option>
            <option value="REPEAT" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>#11 Repeat Billing</option>
            <option value="SIP" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>Hard-Trigger SIP / Geovelocity</option>
            <option value="MOBILE" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>Bantahan Mobile JKN</option>
            <option value="UPCODING" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>Upcoding INA-CBG</option>
          </select>

          <select 
            value={selectedFaskes}
            onChange={(e) => setSelectedFaskes(e.target.value)}
            className={`text-xs px-3 py-2 rounded-xl border focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                : 'bg-white/5 text-white border-white/15 focus:border-[#FFCA40]'
            }`}
          >
            <option value="all" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>Semua Faskes ({uniqueFaskesOptions.length})</option>
            {uniqueFaskesOptions.map((hosp) => (
              <option key={hosp} value={hosp} className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>{hosp}</option>
            ))}
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
              <>Menampilkan <strong className={`font-bold ${isLight ? 'text-emerald-900' : 'text-white'}`}>{filteredClaims.length} berkas prioritas</strong> dari <strong className={`font-bold ${isLight ? 'text-emerald-900' : 'text-white'}`}>{totalQueueCount} antrean triase live</strong> (Basis Nasional: {portfolioStats?.claims_volume ? Number(portfolioStats.claims_volume).toLocaleString('id-ID') : '-'} klaim).</>
            )}
            {activeLane === 'red' && (
              <>Menampilkan <strong className={`font-bold ${isLight ? 'text-rose-900' : 'text-white'}`}>{filteredClaims.length} berkas telaah investigasi</strong> dari total <strong className={`font-bold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>{redCount} anomali Jalur Merah</strong> aktif pra-bayar.</>
            )}
            {activeLane === 'yellow' && (
              <>Menampilkan <strong className={`font-bold ${isLight ? 'text-amber-900' : 'text-white'}`}>{filteredClaims.length} berkas klarifikasi dokumen</strong> dari total <strong className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{yellowCount} klaim Jalur Kuning</strong> aktif.</>
            )}
            {activeLane === 'green' && (
              <>Menampilkan <strong className={`font-bold ${isLight ? 'text-emerald-900' : 'text-white'}`}>{filteredClaims.length} berkas fast-track terverifikasi</strong> dari total <strong className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{greenCount} klaim wajar Jalur Hijau</strong> aktif.</>
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
                        onClick={() => { setActiveLane('all'); setActiveModus('all'); setSelectedFaskes('all'); setSearchQuery(''); }}
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
                      ? (isLight ? 'bg-rose-50/50 hover:bg-rose-100/60 border-l-2 border-l-rose-500' : 'bg-rose-500/10 hover:bg-rose-500/20 border-l-2 border-l-rose-500')
                      : c.lane === 'yellow'
                      ? (isLight ? 'bg-amber-50/50 hover:bg-amber-100/60 border-l-2 border-l-amber-500' : 'bg-amber-500/10 hover:bg-amber-500/20 border-l-2 border-l-amber-500')
                      : (isLight ? 'hover:bg-slate-50 border-l-2 border-l-emerald-600' : 'hover:bg-white/5 border-l-2 border-l-emerald-500')
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        c.lane === 'red' ? 'bg-rose-500' : c.lane === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <div className="min-w-0">
                        <div className={`font-bold transition truncate ${
                          isLight ? 'text-slate-900 group-hover:text-emerald-700' : 'text-white group-hover:text-cyan-300'
                        }`}>
                          {c.hospital}
                        </div>
                        <div className={`flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono mt-0.5 ${
                          isLight ? 'text-slate-500' : 'text-white/50'
                        }`}>
                          <span className="font-semibold">{c.id}</span>
                          <span>•</span>
                          <span>{c.date}</span>
                          {c.flags.map((f, flagIdx) => (
                            <span key={`${c.id}-${f}-${flagIdx}`} className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
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
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold font-mono shadow-xs border ${
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
