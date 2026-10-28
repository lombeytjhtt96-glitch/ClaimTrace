import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardList,
  CheckCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  BarChart2,
  TrendingDown,
  Layers,
  Search,
  Filter,
  Check,
  X,
  Send,
  Building2,
  FileText,
  User,
  ExternalLink,
  RefreshCw,
  Download,
  AlertOctagon,
  Calendar,
  ChevronRight,
  Shield,
  ShieldCheck,
  Zap,
  Activity,
  Timer,
  CheckSquare,
  ArrowUpRight,
} from 'lucide-react';

// Realistic JKN / BPJS Kesehatan Intervention Plans
const INITIAL_INTERVENTION_PLANS = [
  {
    id: 1,
    faskes_code: '0114R005',
    faskes_name: 'RS Khusus Mitra Husada',
    pic_name: 'Siti Rahmawati, S.Kep., Ners',
    pic_email: 'casemix.rahma@rskh-mitrahusada.co.id',
    plan_title: 'Intervensi & Rekonsiliasi 85 Berkas Fisioterapi (Phantom Cluster)',
    claim_id: 'CLM-2026-10-085',
    risk_level: 'CRITICAL',
    risk_score: 94,
    status: 'pending_review',
    total_steps: 4,
    completed_steps: 1,
    viewed_in_24h: true,
    stale_days: 0,
    created_at: '2026-10-24T18:00:00Z',
    updated_at: '2026-10-24T19:30:00Z',
    plan_steps: [
      {
        title: 'Penundaan Penandatanganan BAKB',
        description: 'Tunda berita acara pembayaran 85 klaim fisioterapi sesuai Perpres 82/2018 Pasal 76.',
        completed: true,
      },
      {
        title: 'Pengunggahan SIP DPJP Terbarukan',
        description: 'Faskes wajib mengunggah perpanjangan SIP dokter spesialis KFR pada portal SATUSEHAT.',
        completed: false,
      },
      {
        title: 'Klarifikasi Sangkalan Presensi 80% Pasien',
        description: 'Faskes memberikan bukti absensi biometrik / rekam medis manual untuk pasien yang menyangkal hadir di Mobile JKN.',
        completed: false,
      },
      {
        title: 'Rekonsiliasi Bersama Tim Wasrik BPJS Kesehatan',
        description: 'Sidang klarifikasi bersama Tim Pencegahan Kecurangan (PK-JKN) BPJS Kesehatan Pusat.',
        completed: false,
      },
    ],
  },
  {
    id: 2,
    faskes_code: '0114R001',
    faskes_name: 'RSUPN Dr. Cipto Mangunkusumo Jakarta',
    pic_name: 'dr. Hendra Setiawan, Sp.A',
    pic_email: 'hendra.setiawan@rscm.co.id',
    plan_title: 'Klarifikasi Koding Sepsis Neonatal (P-8-09-III) Non-Kultur',
    claim_id: 'CLM-2026-10-084',
    risk_level: 'SEVERE',
    risk_score: 82,
    status: 'in_progress',
    total_steps: 3,
    completed_steps: 2,
    viewed_in_24h: true,
    stale_days: 1,
    created_at: '2026-10-23T14:20:00Z',
    updated_at: '2026-10-24T17:15:00Z',
    plan_steps: [
      {
        title: 'Penerbitan Surat Klarifikasi BAKK',
        description: 'Kirim draf ketidaksesuaian resume medis koding INA-CBG Sepsis Berat.',
        completed: true,
      },
      {
        title: 'Penyerahan Hasil Kultur Darah & CRP Serial',
        description: 'Casemix RSUPN menyerahkan bukti lampiran pemeriksaan mikrobiologi bayi prematur.',
        completed: true,
      },
      {
        title: 'Penyesuaian Tarif Koding Menjadi P-8-09-I (Ringan)',
        description: 'Koreksi klaim jika hasil kultur negatif dan klinis membaik tanpa syok sepsis.',
        completed: false,
      },
    ],
  },
  {
    id: 3,
    faskes_code: '0114R002',
    faskes_name: 'RSUP Fatmawati Jakarta',
    pic_name: 'Ahmad Faisal, S.Farm., Apt',
    pic_email: 'faisal.apt@rs-fatmawati.go.id',
    plan_title: 'Audit Restriksi Fornas Albumin Human 20% Pasca-Bedah',
    claim_id: 'CLM-2026-10-082',
    risk_level: 'MODERATE',
    risk_score: 58,
    status: 'completed',
    total_steps: 3,
    completed_steps: 3,
    viewed_in_24h: false,
    stale_days: 4,
    created_at: '2026-10-20T09:00:00Z',
    updated_at: '2026-10-22T16:00:00Z',
    plan_steps: [
      {
        title: 'Pemeriksaan Hasil Lab Serum Albumin',
        description: 'Faskes melampirkan hasil lab kadar albumin <2.5 g/dL sebelum pemberian infus.',
        completed: true,
      },
      {
        title: 'Verifikasi Peresepan DPJP Bedah',
        description: 'Kesesuaian dosis maksimal 100 ml per hari sesuai Formularium Nasional.',
        completed: true,
      },
      {
        title: 'Persetujuan Klaim oleh Verifikator Medis',
        description: 'Berkas dinyatakan lengkap dan lolos verifikasi pra-pembayaran.',
        completed: true,
      },
    ],
  },
  {
    id: 4,
    faskes_code: '0114R004',
    faskes_name: 'RSUP Dr. Sardjito Yogyakarta',
    pic_name: 'Dewi Lestari, S.Tr.Kes',
    pic_email: 'dewi.rekammedis@rs-sardjito.co.id',
    plan_title: 'Penertiban Koding Unbundling Endoskopi Lambung',
    claim_id: 'CLM-2026-10-079',
    risk_level: 'SEVERE',
    risk_score: 72,
    status: 'pending_review',
    total_steps: 3,
    completed_steps: 0,
    viewed_in_24h: false,
    stale_days: 8,
    created_at: '2026-10-15T11:00:00Z',
    updated_at: '2026-10-16T10:00:00Z',
    plan_steps: [
      {
        title: 'Konsolidasi Tagihan Biopsi dan Endoskopi',
        description: 'Penyatuan klaim tindakan terpisah menjadi satu episode rawat jalan terpadu.',
        completed: false,
      },
      {
        title: 'Pemberitahuan Kepatuhan Koding Berita Acara 2020',
        description: 'Penyuluhan staf koder rekam medis terkait regulasi anti-unbundling.',
        completed: false,
      },
      {
        title: 'Otorisasi Ulang oleh Wasrik BPJS Kesehatan',
        description: 'Verifikasi kesepakatan nilai klaim revisi.',
        completed: false,
      },
    ],
  },
];

export default function InterventionsView({ onSelectCase, isLight: propIsLight }) {
  // Theme Detection Fallback
  const [domIsLight, setDomIsLight] = useState(false);
  useEffect(() => {
    const checkTheme = () => {
      const root = document.getElementById('cockpit-root');
      if (root) {
        setDomIsLight(root.classList.contains('theme-light'));
      }
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    const root = document.getElementById('cockpit-root');
    if (root) {
      observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    }
    return () => observer.disconnect();
  }, []);

  const isLight = propIsLight !== undefined ? propIsLight : domIsLight;

  // 4 Tabs: 'dashboard' | 'queue' | 'plans' | 'users'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [plans, setPlans] = useState(INITIAL_INTERVENTION_PLANS);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reviewNoteModal, setReviewNoteModal] = useState({
    isOpen: false,
    planId: null,
    type: 'approve', // 'approve' | 'reject'
    note: '',
  });

  // Handle Refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  // Compute 8 Key Metrics (Matching exact 8 cards from Image 1)
  const metrics = useMemo(() => {
    const totalPlans = plans.length;
    const activePlans = plans.filter((p) => p.status === 'in_progress' || p.status === 'pending_review').length;
    const completedPlans = plans.filter((p) => p.status === 'completed').length;
    const completionRate = totalPlans > 0 ? ((completedPlans / totalPlans) * 100).toFixed(1) : '0.0';
    
    // Average completion percentage across all steps
    const totalStepCompletion = plans.reduce((acc, p) => acc + (p.completed_steps / p.total_steps), 0);
    const avgCompletion = totalPlans > 0 ? ((totalStepCompletion / totalPlans) * 100).toFixed(1) : '0.0';

    const viewed24h = plans.filter((p) => p.viewed_in_24h).length;
    const stale7d = plans.filter((p) => p.stale_days >= 7).length;
    const abandonmentRate = totalPlans > 0 ? ((stale7d / totalPlans) * 100).toFixed(1) : '0.0';

    return {
      totalPlans,
      activePlans,
      completedPlans,
      completionRate,
      avgCompletion,
      viewed24h,
      stale7d,
      avgDaysToComplete: '3.4',
      abandonmentRate,
    };
  }, [plans]);

  // Risk Distribution
  const riskDistribution = useMemo(() => {
    return {
      Critical: plans.filter((p) => p.risk_level === 'CRITICAL').length,
      Severe: plans.filter((p) => p.risk_level === 'SEVERE').length,
      Moderate: plans.filter((p) => p.risk_level === 'MODERATE').length,
      Low: plans.filter((p) => p.risk_level === 'LOW').length,
    };
  }, [plans]);

  // Filtered Plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchSearch =
        p.plan_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.faskes_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.faskes_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.claim_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRisk = riskFilter === 'ALL' || p.risk_level === riskFilter;
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;

      return matchSearch && matchRisk && matchStatus;
    });
  }, [plans, searchQuery, riskFilter, statusFilter]);

  // Toggle step completion interactively
  const handleToggleStep = (planId, stepIdx) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const newSteps = p.plan_steps.map((st, i) =>
          i === stepIdx ? { ...st, completed: !st.completed } : st
        );
        const completedCount = newSteps.filter((st) => st.completed).length;
        const isAllDone = completedCount === newSteps.length;
        const newStatus = isAllDone ? 'completed' : p.status === 'completed' ? 'in_progress' : p.status;
        const targetStep = p.plan_steps[stepIdx];
        
        setToastFeedback({
          type: 'success',
          message: targetStep.completed 
            ? `Tahapan "${targetStep.title}" ditandai belum selesai.`
            : `Tahapan "${targetStep.title}" berhasil diselesaikan & diverifikasi.`,
        });
        setTimeout(() => setToastFeedback(null), 3500);

        return {
          ...p,
          plan_steps: newSteps,
          completed_steps: completedCount,
          status: newStatus,
        };
      })
    );
  };

  // Review Queue Plans (pending approval)
  const queuePlans = useMemo(() => {
    return plans.filter((p) => p.status === 'pending_review');
  }, [plans]);

  // Toast feedback state
  const [toastFeedback, setToastFeedback] = useState(null);

  // Auto-dismiss Toast Feedback setelah 3.5 detik
  useEffect(() => {
    if (!toastFeedback) return;
    const timer = setTimeout(() => {
      setToastFeedback(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toastFeedback]);

  // Helper to map plan to complete investigation case dossier
  const getPlanCaseDossier = (plan) => {
    if (!plan) return null;
    if (plan.id === 1) {
      return {
        id: 'CLM-2026-10-085',
        sep: '0132R0011026V000085',
        hospital: 'RS Khusus Mitra Husada',
        hospitalType: 'FKRTL (RS Khusus Kelas C)',
        code: 'Z-3-12-0',
        description: 'Intervensi & Rekonsiliasi 85 Berkas Fisioterapi (Phantom Cluster)',
        tariff: 'Rp 15.300.000 (85 Klaim)',
        dpjp: 'dr. Hendra, Sp.KFR',
        sipNumber: '446.1/108/DPJP/2023',
        date: '14 Okt 2026',
        batchTag: 'BAKSOS_MASSAL_OKT26',
        sampleCount: 10,
        participantCount: 10,
        deniedCount: 8,
        s1: 85,
        s2: 95,
        s3: 80,
        totalScore: 88.0,
        lane: 'red',
        status: 'AUDIT KHUSUS MERAH',
        notes: 'Klaster Baksos 85 klaim fisioterapi tanpa rujukan FKTP sah; SIP DPJP mutasi.',
        flags: ['BAKSOS MASSAL', 'SIP MUTASI']
      };
    }
    if (plan.id === 2) {
      return {
        id: 'CLM-2026-10-084',
        sep: '0114R0011026V000084',
        hospital: 'RSUPN Dr. Cipto Mangunkusumo Jakarta',
        hospitalType: 'FKRTL (RS Pusat Rujukan Nasional Kelas A)',
        code: 'P-8-09-III',
        description: 'Klarifikasi Koding Sepsis Neonatal Berat Non-Kultur',
        tariff: 'Rp 28.450.000',
        dpjp: 'dr. Hendra Setiawan, Sp.A',
        sipNumber: '449.1/092/SIP/2024',
        date: '23 Okt 2026',
        batchTag: 'NEONATAL_SEPSIS_OKT26',
        sampleCount: 10,
        participantCount: 10,
        deniedCount: 0,
        s1: 90,
        s2: 82,
        s3: 65,
        totalScore: 82.0,
        lane: 'yellow',
        status: 'TELAAH KODING INA-CBG',
        notes: 'Klaim Sepsis Berat Neonatal (P-8-09-III) diajukan tanpa bukti hasil kultur kuman mikrobiologi positif.',
        flags: ['UPCODING TINGKAT SEVERITY', 'KULTUR DARAH NEGATIF']
      };
    }
    if (plan.id === 3) {
      return {
        id: 'CLM-2026-10-082',
        sep: '0114R0021026V000082',
        hospital: 'RSUP Fatmawati Jakarta',
        hospitalType: 'FKRTL (RS Swasta Kelas B)',
        code: 'I-4-10-III',
        description: 'Audit Restriksi Fornas Albumin Human 20% Pasca-Bedah',
        tariff: 'Rp 9.750.000',
        dpjp: 'dr. Bambang Prasetyo, Sp.JP(K)',
        sipNumber: '448.2/115/SIP/2025',
        date: '20 Okt 2026',
        batchTag: 'RESTRIKSI_FORNAS_OKT26',
        sampleCount: 10,
        participantCount: 10,
        deniedCount: 0,
        s1: 72,
        s2: 60,
        s3: 45,
        totalScore: 58.0,
        lane: 'yellow',
        status: 'AUDIT FARMAKOLOGI',
        notes: 'Pemberian sediaan albumin human 20% pasca bedah terindikasi melebihi batas restriksi Formularium Nasional.',
        flags: ['RESTRIKSI FORNAS', 'KADAR LAB TERVERIFIKASI']
      };
    }
    return {
      id: plan.claim_id || 'CLM-2026-10-079',
      sep: '0114R0041026V000079',
      hospital: plan.faskes_name,
      hospitalType: 'FKRTL (RS Swasta Kelas B)',
      code: 'K-4-17-I',
      description: plan.plan_title,
      tariff: 'Rp 12.800.000',
      dpjp: 'dr. Satrio Wibowo, Sp.PD-KGEH',
      sipNumber: '446.3/088/SIP/2024',
      date: '15 Okt 2026',
      batchTag: 'UNBUNDLING_PROCEDURE_OKT26',
      sampleCount: 10,
      participantCount: 10,
      deniedCount: 0,
      s1: 85,
      s2: 74,
      s3: 60,
      totalScore: plan.risk_score || 72.0,
      lane: 'yellow',
      status: 'KLARIFIKASI KODING',
      notes: 'Penyatuan klaim tindakan terpisah menjadi satu episode rawat jalan terpadu.',
      flags: ['UNBUNDLING PROSEDUR', 'EPISODE GANDA RAWAT JALAN']
    };
  };

  const handleApprovePlan = (id, note) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'in_progress', approval_note: note } : p))
    );
    setReviewNoteModal({ isOpen: false, planId: null, type: 'approve', note: '' });
    setToastFeedback({
      type: 'success',
      message: `Rencana intervensi #${id} berhasil disetujui untuk dieksekusi bersama FKRTL.`,
    });
    setTimeout(() => setToastFeedback(null), 4000);
  };

  const handleRejectPlan = (id, note) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'rejected', rejection_note: note } : p))
    );
    setReviewNoteModal({ isOpen: false, planId: null, type: 'reject', note: '' });
    setToastFeedback({
      type: 'error',
      message: `Rencana intervensi #${id} ditolak: ${note || 'Alasan penolakan dicatat dalam ledger audit'}.`,
    });
    setTimeout(() => setToastFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <ClipboardList className={`w-6 h-6 ${isLight ? 'text-sky-600' : 'text-[#FFCA40]'}`} />
              <span>Rencana Intervensi FKRTL</span>
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              isLight
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-[#FFCA40]/10 text-[#FFCA40] border-[#FFCA40]/30'
            }`}>
              Sub-Agen TCA &amp; Wasrik JKN
            </span>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-white/5 text-white/70 border-white/10'
            }`}>
              MITRE D3FEND: D3-ICA · MITRE F3: FA0002 Clawback
            </span>
          </div>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Pemantauan &amp; Eksekusi Rencana Intervensi Faskes Hasil Audit Forensik TCA BPJS Kesehatan · Penyelesaian BAKB, Kepatuhan SLA, dan Mitigasi Kerugian Finansial (MITRE F3 Monetization).
          </p>
        </div>

        {/* 4 Tabs Bar: Dashboard, Review Queue, All Plans, User Progress */}
        <div className={`flex items-center p-1 rounded-xl border shadow-sm ${
          isLight
            ? 'bg-slate-100 border-slate-300/80'
            : 'bg-[#00134A]/80 border-white/10 shadow-inner'
        }`}>
          <button type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? isLight
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-[#FFCA40] text-[#00134A] shadow-md shadow-[#FFCA40]/20'
                : isLight
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-white/60 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Dasbor Intervensi</span>
          </button>

          <button type="button"
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'queue'
                ? isLight
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-[#FFCA40] text-[#00134A] shadow-md shadow-[#FFCA40]/20'
                : isLight
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-white/60 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Antrean Telaah (HITL)</span>
            {queuePlans.length > 0 && (
              <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'queue'
                  ? isLight
                    ? 'bg-sky-800 text-white'
                    : 'bg-[#000c24] text-[#FFCA40]'
                  : isLight
                    ? 'bg-slate-200 text-slate-800'
                    : 'bg-white/10 text-white'
              }`}>
                {queuePlans.length}
              </span>
            )}
          </button>

          <button type="button"
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'plans'
                ? isLight
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-[#FFCA40] text-[#00134A] shadow-md shadow-[#FFCA40]/20'
                : isLight
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua Rencana</span>
          </button>

          <button type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? isLight
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-[#FFCA40] text-[#00134A] shadow-md shadow-[#FFCA40]/20'
                : isLight
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-white/60 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Progres FKRTL</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: DASHBOARD (8 Metric Cards + Risk Level Distribution + 30D)  */}
      {/* =================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* 8 Metric Cards with Subtle Watermarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: TOTAL PLANS */}
            <div className={`rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden group ${
              isLight
                ? 'bg-white border border-slate-200/90 shadow-slate-200/50 hover:border-emerald-500/60 hover:shadow-sky-100/40'
                : 'bg-[#00153A]/85 border border-white/10 shadow-[#00081c]/50 backdrop-blur-xl hover:border-[#FFCA40]/40'
            }`}>
              <ClipboardList className={`absolute -right-3 -bottom-3 w-20 h-20 pointer-events-none transition-all duration-300 ${
                isLight ? 'text-slate-900 opacity-[0.04] group-hover:opacity-[0.08]' : 'text-white opacity-[0.05] group-hover:opacity-[0.10]'
              }`} />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white/10 border-white/15 text-white/90'
                }`}>
                  <ClipboardList className="w-4 h-4" />
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-white/50'
                }`}>TOTAL RENCANA INTERVENSI</span>
              </div>
              <div className={`text-3xl font-bold relative z-10 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {metrics.totalPlans}
              </div>
            </div>

            {/* Card 2: ACTIVE PLANS */}
            <div className={`rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden group ${
              isLight
                ? 'bg-white border border-slate-200/90 shadow-slate-200/50 hover:border-emerald-500/60 hover:shadow-emerald-100/40'
                : 'bg-[#00153A]/85 border border-white/10 shadow-[#00081c]/50 backdrop-blur-xl hover:border-emerald-400/40'
            }`}>
              <Activity className={`absolute -right-3 -bottom-3 w-20 h-20 pointer-events-none transition-all duration-300 text-emerald-500 ${
                isLight ? 'opacity-[0.05] group-hover:opacity-[0.10]' : 'opacity-[0.06] group-hover:opacity-[0.12]'
              }`} />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                }`}>
                  <Activity className="w-4 h-4" />
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-white/50'
                }`}>RENCANA AKTIF BERJALAN</span>
              </div>
              <div className={`text-3xl font-bold relative z-10 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                {metrics.activePlans}
              </div>
            </div>

            {/* Card 3: COMPLETED */}
            <div className={`rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden group ${
              isLight
                ? 'bg-white border border-slate-200/90 shadow-slate-200/50 hover:border-blue-500/60 hover:shadow-blue-100/40'
                : 'bg-[#00153A]/85 border border-white/10 shadow-[#00081c]/50 backdrop-blur-xl hover:border-blue-400/40'
            }`}>
              <CheckCircle2 className={`absolute -right-3 -bottom-3 w-20 h-20 pointer-events-none transition-all duration-300 text-blue-500 ${
                isLight ? 'opacity-[0.05] group-hover:opacity-[0.10]' : 'opacity-[0.06] group-hover:opacity-[0.12]'
              }`} />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isLight ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-white/50'
                }`}>SELESAI DIREKONSILIASI</span>
              </div>
              <div className={`text-3xl font-bold relative z-10 ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
                {metrics.completedPlans}
              </div>
              <div className={`text-xs mt-1 relative z-10 ${isLight ? 'text-slate-600 font-semibold' : 'text-white/60'}`}>
                {metrics.completionRate}% tingkat tuntas
              </div>
            </div>

            {/* Card 4: AVG COMPLETION */}
            <div className={`rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden group ${
              isLight
                ? 'bg-white border border-slate-200/90 shadow-slate-200/50 hover:border-emerald-500/60 hover:shadow-sky-100/40'
                : 'bg-[#00153A]/85 border border-white/10 shadow-[#00081c]/50 backdrop-blur-xl hover:border-[#FFCA40]/40'
            }`}>
              <BarChart2 className={`absolute -right-3 -bottom-3 w-20 h-20 pointer-events-none transition-all duration-300 text-amber-500 ${
                isLight ? 'opacity-[0.05] group-hover:opacity-[0.10]' : 'opacity-[0.06] group-hover:opacity-[0.12]'
              }`} />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-[#FFCA40]/20 border-[#FFCA40]/30 text-[#FFCA40]'
                }`}>
                  <BarChart2 className="w-4 h-4" />
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-white/50'
                }`}>RATA-RATA PENYELESAIAN</span>
              </div>
              <div className={`text-3xl font-bold relative z-10 ${isLight ? 'text-emerald-800' : 'text-[#FFCA40]'}`}>
                {metrics.avgCompletion}%
              </div>
            </div>

            {/* Card 5: VIEWED (24H) */}
            <div className={`rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden group ${
              isLight
                ? 'bg-white border border-slate-200/90 shadow-slate-200/50 hover:border-purple-500/60 hover:shadow-purple-100/40'
                : 'bg-[#00153A]/85 border border-white/10 shadow-[#00081c]/50 backdrop-blur-xl hover:border-purple-400/40'
            }`}>
              <Eye className={`absolute -right-3 -bottom-3 w-20 h-20 pointer-events-none transition-all duration-300 text-purple-500 ${
                isLight ? 'opacity-[0.05] group-hover:opacity-[0.10]' : 'opacity-[0.06] group-hover:opacity-[0.12]'
              }`} />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isLight ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                }`}>
                  <Eye className="w-4 h-4" />
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-white/50'
                }`}>DITINJAU (24 JAM)</span>
              </div>
              <div className={`text-3xl font-bold relative z-10 ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>
                {metrics.viewed24h}
              </div>
            </div>

            {/* Card 6: STALE (7D) */}
            <div className={`rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden group ${
              isLight
                ? 'bg-white border border-slate-200/90 shadow-slate-200/50 hover:border-rose-500/60 hover:shadow-rose-100/40'
                : 'bg-[#00153A]/85 border border-white/10 shadow-[#00081c]/50 backdrop-blur-xl hover:border-rose-400/40'
            }`}>
              <Clock className={`absolute -right-3 -bottom-3 w-20 h-20 pointer-events-none transition-all duration-300 text-rose-500 ${
                isLight ? 'opacity-[0.05] group-hover:opacity-[0.10]' : 'opacity-[0.06] group-hover:opacity-[0.12]'
              }`} />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isLight ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-white/50'
                }`}>TERTUNDA (&gt;7 HARI)</span>
              </div>
              <div className={`text-3xl font-bold relative z-10 ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                {metrics.stale7d}
              </div>
              <div className={`text-xs mt-1 relative z-10 ${isLight ? 'text-slate-600 font-semibold' : 'text-white/60'}`}>
                belum ditinjau
              </div>
            </div>

            {/* Card 7: AVG DAYS TO COMPLETE */}
            <div className={`rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden group ${
              isLight
                ? 'bg-white border border-slate-200/90 shadow-slate-200/50 hover:border-teal-500/60 hover:shadow-teal-100/40'
                : 'bg-[#00153A]/85 border border-white/10 shadow-[#00081c]/50 backdrop-blur-xl hover:border-cyan-400/40'
            }`}>
              <Timer className={`absolute -right-3 -bottom-3 w-20 h-20 pointer-events-none transition-all duration-300 text-teal-500 ${
                isLight ? 'opacity-[0.05] group-hover:opacity-[0.10]' : 'opacity-[0.06] group-hover:opacity-[0.12]'
              }`} />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isLight ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-teal-500/20 border-teal-500/30 text-cyan-400'
                }`}>
                  <Timer className="w-4 h-4" />
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-white/50'
                }`}>RATA-RATA WAKTU TUNTAS</span>
              </div>
              <div className={`text-3xl font-bold relative z-10 ${isLight ? 'text-teal-700' : 'text-cyan-400'}`}>
                {metrics.avgDaysToComplete} hari
              </div>
            </div>

            {/* Card 8: ABANDONMENT RATE */}
            <div className={`rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden group ${
              isLight
                ? 'bg-white border border-slate-200/90 shadow-slate-200/50 hover:border-slate-400/60 hover:shadow-slate-100/40'
                : 'bg-[#00153A]/85 border border-white/10 shadow-[#00081c]/50 backdrop-blur-xl hover:border-slate-300/40'
            }`}>
              <TrendingDown className={`absolute -right-3 -bottom-3 w-20 h-20 pointer-events-none transition-all duration-300 text-slate-400 ${
                isLight ? 'opacity-[0.05] group-hover:opacity-[0.10]' : 'opacity-[0.06] group-hover:opacity-[0.12]'
              }`} />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white/10 border-white/15 text-white/80'
                }`}>
                  <TrendingDown className="w-4 h-4" />
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-white/50'
                }`}>TINGKAT KETERLAMBATAN</span>
              </div>
              <div className={`text-3xl font-bold relative z-10 ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
                {metrics.abandonmentRate}%
              </div>
            </div>
          </div>

          {/* Risk Level Distribution */}
          <div className={`rounded-2xl p-6 shadow-xl space-y-4 ${
            isLight
              ? 'bg-white border border-slate-200 shadow-slate-200/50'
              : 'bg-[#00153A]/85 border border-white/10 shadow-[#00081c]/50 backdrop-blur-xl'
          }`}>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>Distribusi Tingkat Risiko Klaim</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl border ${
                isLight ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-rose-500/10 border-rose-500/20'
              }`}>
                <p className={`text-xs font-bold uppercase ${isLight ? 'text-rose-800' : 'text-rose-400'}`}>
                  Critical (Kritis)
                </p>
                <p className={`text-2xl font-bold mt-1 ${isLight ? 'text-rose-900' : 'text-rose-300'}`}>
                  {riskDistribution.Critical}
                </p>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-rose-700 font-medium' : 'text-rose-400/80'}`}>
                  Indikasi Phantom &amp; SIP Expired
                </p>
              </div>
              <div className={`p-4 rounded-xl border ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                <p className={`text-xs font-bold uppercase ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                  Severe (Berat)
                </p>
                <p className={`text-2xl font-bold mt-1 ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                  {riskDistribution.Severe}
                </p>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-amber-700 font-medium' : 'text-amber-400/80'}`}>
                  Unbundling &amp; Sepsis Upcoding
                </p>
              </div>
              <div className={`p-4 rounded-xl border ${
                isLight ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-blue-500/10 border-blue-500/20'
              }`}>
                <p className={`text-xs font-bold uppercase ${isLight ? 'text-blue-800' : 'text-blue-400'}`}>
                  Moderate (Sedang)
                </p>
                <p className={`text-2xl font-bold mt-1 ${isLight ? 'text-blue-900' : 'text-blue-300'}`}>
                  {riskDistribution.Moderate}
                </p>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-blue-700 font-medium' : 'text-blue-400/80'}`}>
                  Restriksi Obat Fornas
                </p>
              </div>
              <div className={`p-4 rounded-xl border ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-500/10 border-emerald-500/20'
              }`}>
                <p className={`text-xs font-bold uppercase ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                  Low (Rendah)
                </p>
                <p className={`text-2xl font-bold mt-1 ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>
                  {riskDistribution.Low}
                </p>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-emerald-700 font-medium' : 'text-emerald-400/80'}`}>
                  Kelengkapan Administrasi
                </p>
              </div>
            </div>
          </div>

          {/* Summary for Last 30 Days */}
          <div className={`rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs ${
            isLight
              ? 'bg-slate-50 border border-slate-200 text-slate-800'
              : 'bg-white/5 border border-white/10 text-white backdrop-blur-md'
          }`}>
            <div>
              <h3 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Ringkasan Kepatuhan 30 Hari Terakhir
              </h3>
              <div className={`flex flex-wrap items-center gap-4 mt-1 ${
                isLight ? 'text-slate-600' : 'text-white/70'
              }`}>
                <span>Tingkat Penyelesaian: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{metrics.completionRate}%</strong></span>
                <span>•</span>
                <span>Rencana Aktif: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{metrics.activePlans} / {metrics.totalPlans}</strong></span>
              </div>
            </div>
            <div className={`font-mono text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
              Dihasilkan: <strong className={isLight ? 'text-slate-700' : 'text-white/70'}>{new Date().toLocaleDateString('id-ID')}, {new Date().toLocaleTimeString('id-ID')} WIB</strong>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: REVIEW QUEUE (Pending Human Verification by Verifier Medis) */}
      {/* =================================================================== */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Antrean Peninjauan Intervensi Faskes (HITL)
            </h2>
            <span className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-white/50'}`}>
              Menampilkan {queuePlans.length} rencana intervensi yang menunggu otorisasi Verifikator Medis
            </span>
          </div>

          {queuePlans.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border shadow-xl ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
                : 'bg-[#00153A]/85 border-white/10 text-white shadow-[#00081c]/50 backdrop-blur-xl'
            }`}>
              <CheckCircle className={`w-10 h-10 mx-auto mb-2 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white/90'}`}>Tidak ada rencana intervensi pending review.</p>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Semua usulan sub-agen TCA telah diverifikasi.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queuePlans.map((plan) => {
                const isCritical = plan.risk_level === 'CRITICAL';
                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      isCritical
                        ? isLight
                          ? 'border-rose-300/90 bg-white text-slate-900 shadow-slate-200/50 hover:border-rose-400'
                          : 'border-rose-500/40 bg-[#00153A]/85 text-white shadow-[#00081c]/50 backdrop-blur-xl hover:border-rose-400/60'
                        : isLight
                          ? 'border-amber-300/90 bg-white text-slate-900 shadow-slate-200/50 hover:border-amber-400'
                          : 'border-amber-500/40 bg-[#00153A]/85 text-white shadow-[#00081c]/50 backdrop-blur-xl hover:border-amber-400/60'
                    }`}
                  >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-mono text-xs font-bold ${isLight ? 'text-emerald-800' : 'text-cyan-400'}`}>
                        #{plan.id}
                      </span>
                      <span className={isLight ? 'text-slate-300' : 'text-white/30'}>•</span>
                      <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{plan.plan_title}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          plan.risk_level === 'CRITICAL'
                            ? isLight
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : isLight
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {plan.risk_level === 'CRITICAL' ? 'KRITIS' : plan.risk_level === 'SEVERE' ? 'BERAT' : plan.risk_level === 'MODERATE' ? 'SEDANG' : 'RENDAH'} ({plan.risk_score})
                      </span>
                    </div>
                    <div className={`text-xs flex flex-wrap items-center gap-3 ${
                      isLight ? 'text-slate-600' : 'text-white/70'
                    }`}>
                      <span>Faskes: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{plan.faskes_name} ({plan.faskes_code})</strong></span>
                      <span>•</span>
                      <span>Klaim Terkait: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{plan.claim_id}</strong></span>
                      <span>•</span>
                      <span>PIC: <strong className={isLight ? 'text-slate-800' : 'text-white/90'}>{plan.pic_name}</strong></span>
                    </div>
                    <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      Langkah Intervensi: {plan.completed_steps} dari {plan.total_steps} selesai disepakati
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onSelectCase && (
                      <button type="button"
                        onClick={() => onSelectCase(getPlanCaseDossier(plan))}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer flex items-center gap-1.5 ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                            : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                        }`}
                        title="Telaah berkas rekam medis dan bukti telemetri klaim ini"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Lihat Berkas</span>
                      </button>
                    )}
                    <button type="button"
                      onClick={() =>
                        setReviewNoteModal({
                          isOpen: true,
                          planId: plan.id,
                          type: 'approve',
                          note: '',
                        })
                      }
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Setujui Intervensi</span>
                    </button>
                    <button type="button"
                      onClick={() =>
                        setReviewNoteModal({
                          isOpen: true,
                          planId: plan.id,
                          type: 'reject',
                          note: '',
                        })
                      }
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isLight
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: ALL PLANS (Detailed Table & Accordion Steps)               */}
      {/* =================================================================== */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className={`flex flex-col sm:flex-row gap-3 items-center justify-between p-4 rounded-2xl border shadow-xl ${
            isLight
              ? 'bg-white border-slate-200/90 shadow-slate-200/50'
              : 'bg-[#00153A]/85 border-white/10 shadow-[#00081c]/50 backdrop-blur-xl'
          }`}>
            <div className="relative flex-1 w-full">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
              <input aria-label="Cari rencana intervensi berdasarkan faskes, klaim, atau topik..."
                type="text"
                placeholder="Cari rencana intervensi berdasarkan faskes, klaim, atau topik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs border focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                    : 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-[#FFCA40]/60'
                }`}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className={`flex-1 sm:flex-none border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    : 'bg-[#00134A] border-white/10 text-white focus:border-[#FFCA40]/60'
                }`}
              >
                <option value="ALL" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Semua Tingkat Risiko</option>
                <option value="CRITICAL" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Kritis (Critical)</option>
                <option value="SEVERE" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Berat (Severe)</option>
                <option value="MODERATE" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Sedang (Moderate)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`flex-1 sm:flex-none border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    : 'bg-[#00134A] border-white/10 text-white focus:border-[#FFCA40]/60'
                }`}
              >
                <option value="ALL" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Semua Status</option>
                <option value="pending_review" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Menunggu Telaah (HITL)</option>
                <option value="in_progress" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Sedang Berjalan</option>
                <option value="completed" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Selesai Direkonsiliasi</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredPlans.map((plan) => {
              const isExpanded = expandedPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border shadow-xl overflow-hidden transition-all ${
                    isLight
                      ? 'bg-white border-slate-200/90 shadow-slate-200/50 hover:border-emerald-400'
                      : 'border-white/10 bg-[#00153A]/85 shadow-[#00081c]/50 backdrop-blur-xl hover:border-white/20'
                  }`}
                >
                  <div
                    onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                    className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors ${
                      isLight ? 'hover:bg-slate-50/80' : 'hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-mono text-xs font-bold ${isLight ? 'text-emerald-800' : 'text-cyan-400'}`}>
                          #{plan.id}
                        </span>
                        <span className={isLight ? 'text-slate-300' : 'text-white/30'}>•</span>
                        <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{plan.plan_title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            plan.risk_level === 'CRITICAL'
                              ? isLight
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : isLight
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {plan.risk_level === 'CRITICAL' ? 'KRITIS' : plan.risk_level === 'SEVERE' ? 'BERAT' : plan.risk_level === 'MODERATE' ? 'SEDANG' : 'RENDAH'} ({plan.risk_score})
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                        {plan.faskes_name} ({plan.faskes_code}) · Berkas Klaim: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{plan.claim_id}</strong> · PIC: {plan.pic_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          plan.status === 'completed'
                            ? isLight
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : plan.status === 'in_progress'
                            ? isLight
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : isLight
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {plan.status === 'completed'
                          ? 'SELESAI DIREKONSILIASI'
                          : plan.status === 'in_progress'
                          ? 'SEDANG BERJALAN'
                          : plan.status === 'pending_review'
                          ? 'MENUNGGU TELAAH (HITL)'
                          : plan.status}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${isLight ? 'text-slate-400' : 'text-white/50'} ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Accordion Steps Detail */}
                  {isExpanded && (
                    <div className={`p-5 space-y-4 border-t ${
                      isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-white/5 border-white/10'
                    }`}>
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold uppercase tracking-wider ${
                          isLight ? 'text-slate-800' : 'text-white/80'
                        }`}>
                          Tahapan Rencana Aksi Intervensi ({plan.completed_steps}/{plan.total_steps})
                        </h4>
                        <span className={`text-[10px] italic ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                          Klik tahapan untuk mengubah status verifikasi
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {plan.plan_steps.map((step, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleToggleStep(plan.id, idx)}
                            className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer select-none transition-all ${
                              step.completed
                                ? isLight
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:bg-emerald-100/60 shadow-xs'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                                : isLight
                                  ? 'bg-white border-slate-200 text-slate-800 hover:border-emerald-300 shadow-xs'
                                  : 'bg-[#00134A]/80 border-white/10 text-white hover:border-white/20'
                            }`}
                            title={step.completed ? "Klik untuk membatalkan status verifikasi" : "Klik untuk menandai tahapan ini selesai diverifikasi"}
                          >
                            <div className="mt-0.5">
                              {step.completed ? (
                                <CheckCircle className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                              ) : (
                                <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                                  isLight ? 'border-slate-300 group-hover:border-emerald-500' : 'border-white/30'
                                }`} />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`text-xs font-bold ${step.completed ? (isLight ? 'text-emerald-900 line-through/20' : 'text-emerald-300') : ''}`}>
                                {step.title}
                              </p>
                              <p className={`text-[11px] mt-0.5 leading-relaxed ${
                                isLight
                                  ? step.completed ? 'text-emerald-800' : 'text-slate-600'
                                  : step.completed ? 'text-emerald-300/80' : 'text-white/60'
                              }`}>
                                {step.description}
                              </p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border self-center shrink-0 ${
                              step.completed
                                ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-white/50 border-white/10'
                            }`}>
                              {step.completed ? 'TERVERIFIKASI' : 'BELUM'}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        {onSelectCase && plan.claim_id && (
                          <button type="button"
                            onClick={() => onSelectCase(getPlanCaseDossier(plan))}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
                              isLight
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-[#FFCA40] text-[#00134A] hover:bg-[#ffd566]'
                            }`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Buka Investigasi Klaim</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: FASKES PROGRESS (Table Tracking by Hospital)                */}
      {/* =================================================================== */}
      {activeTab === 'users' && (
        <div className={`rounded-2xl border shadow-xl overflow-hidden ${
          isLight
            ? 'bg-white border-slate-200 shadow-slate-200/50'
            : 'bg-[#00153A]/85 border-white/10 shadow-[#00081c]/50 backdrop-blur-xl'
        }`}>
          <div className={`p-4 border-b ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Progres Intervensi Fasilitas Kesehatan (FKRTL)
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Pemantauan penyelesaian rencana tindak lanjut per rumah sakit rekanan BPJS Kesehatan
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b font-bold uppercase text-[10px] ${
                  isLight
                    ? 'bg-slate-100/90 border-slate-200 text-slate-700'
                    : 'bg-white/5 border-white/10 text-white/60 font-bold'
                }`}>
                  <th className="py-3 px-4">FASKES FKRTL</th>
                  <th className="py-3 px-4">PIC CASEMIX</th>
                  <th className="py-3 px-4">TOTAL INTERVENSI</th>
                  <th className="py-3 px-4">PROGRES TAHAPAN</th>
                  <th className="py-3 px-4">STATUS TINDAK LANJUT</th>
                  <th className="py-3 px-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                {plans.map((p) => {
                  const pct = Math.round((p.completed_steps / p.total_steps) * 100);

                  return (
                    <tr key={p.id} className={`transition-colors ${
                      isLight ? 'hover:bg-emerald-50/40 text-slate-900' : 'hover:bg-white/5 text-white'
                    }`}>
                      <td className={`py-3.5 px-4 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {p.faskes_name}
                        <span className={`block text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                          {p.faskes_code}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
                        {p.pic_name}
                        <span className={`block text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                          {p.pic_email}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white/90'}`}>
                        {p.total_steps} langkah
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-36">
                          <div className={`flex justify-between text-[10px] font-semibold mb-1 ${
                            isLight ? 'text-slate-700' : 'text-white/70'
                          }`}>
                            <span>{p.completed_steps}/{p.total_steps}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className={`w-full rounded-full h-1.5 overflow-hidden ${
                            isLight ? 'bg-slate-200' : 'bg-white/10'
                          }`}>
                            <div
                              className={`h-1.5 rounded-full ${isLight ? 'bg-emerald-600' : 'bg-[#FFCA40]'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            p.status === 'completed'
                              ? isLight
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : p.status === 'in_progress'
                              ? isLight
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : isLight
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {p.status === 'completed'
                            ? 'SELESAI DIREKONSILIASI'
                            : p.status === 'in_progress'
                            ? 'SEDANG BERJALAN'
                            : p.status === 'pending_review'
                            ? 'MENUNGGU TELAAH'
                            : p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button type="button"
                          onClick={() => {
                            if (onSelectCase) onSelectCase(getPlanCaseDossier(p));
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                            isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                              : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                          }`}
                        >
                          Detail Kasus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal Dialog */}
      {reviewNoteModal.isOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          isLight ? 'bg-slate-900/60 backdrop-blur-md' : 'bg-[#00081c]/80 backdrop-blur-md'
        }`}>
          <div className={`w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl border ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#00153A] border-white/20 text-white'
          }`}>
            <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {reviewNoteModal.type === 'approve' ? (
                <Check className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              ) : (
                <X className={`w-5 h-5 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
              )}
              <span>
                {reviewNoteModal.type === 'approve'
                  ? 'Setujui Rencana Intervensi'
                  : 'Tolak Rencana Intervensi'}
              </span>
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              {reviewNoteModal.type === 'approve'
                ? 'Rencana aksi intervensi ini akan dikirimkan secara resmi ke Casemix Faskes terkait.'
                : 'Tuliskan alasan penolakan draf rencana intervensi.'}
            </p>
            <div>
              <label className={`block text-[11px] font-bold uppercase mb-1 ${
                isLight ? 'text-slate-700' : 'text-white/70'
              }`}>
                Catatan Verifikator Medis (Opsional)
              </label>
              <textarea
                rows={3}
                value={reviewNoteModal.note}
                onChange={(e) =>
                  setReviewNoteModal((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="Tuliskan catatan arahan tindak lanjut..."
                className={`w-full rounded-xl p-3 text-xs border focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                    : 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-[#FFCA40]/60'
                }`}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button"
                onClick={() =>
                  setReviewNoteModal({ isOpen: false, planId: null, type: 'approve', note: '' })
                }
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Batal
              </button>
              <button type="button"
                onClick={() => {
                  if (reviewNoteModal.type === 'approve') {
                    handleApprovePlan(reviewNoteModal.planId, reviewNoteModal.note);
                  } else {
                    handleRejectPlan(reviewNoteModal.planId, reviewNoteModal.note);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer ${
                  reviewNoteModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Feedback Notification */}
      <AnimatePresence>
        {toastFeedback && (
          <motion.div
            key={toastFeedback.message}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 border backdrop-blur-xl text-xs font-semibold overflow-hidden ${
              toastFeedback.type === 'success'
                ? isLight
                  ? 'bg-white text-emerald-800 border-emerald-300 shadow-emerald-500/10'
                  : 'bg-[#00153A] text-emerald-300 border-emerald-500/40 shadow-black/80'
                : isLight
                  ? 'bg-white text-rose-800 border-rose-300 shadow-rose-500/10'
                  : 'bg-[#00153A] text-rose-300 border-rose-500/40 shadow-black/80'
            }`}
          >
            {toastFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{toastFeedback.message}</span>
            <button
              onClick={() => setToastFeedback(null)}
              aria-label="Tutup notifikasi"
              className={`ml-2 p-0.5 rounded cursor-pointer ${
                isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-white/50'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {/* Animasi Garis Countdown Waktu Menghilang */}
            <motion.div
              key={`progress-${toastFeedback.message}`}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3.5, ease: "linear" }}
              className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                toastFeedback.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
