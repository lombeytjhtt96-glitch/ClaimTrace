import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  Users,
  BarChart2,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Bot,
  User,
  Shield,
  FileText,
  CheckCircle,
  Flag,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Building2,
  X,
} from 'lucide-react';

// Realistic JKN AI Conversation Sessions
const INITIAL_CONVERSATION_GROUPS = [
  {
    userHash: 'usr_verif_0114_khalaf',
    userName: 'Verifikator Medis Tingkat Pusat',
    userRole: 'VERIFIKATOR',
    userEmail: 'verifikator.khalaf@bpjs-kesehatan.go.id',
    faskesName: 'Kantor Pusat BPJS Kesehatan · Kedeputian Wasrik',
    totalMessages: 18,
    lastActivityIso: '2026-10-24T19:45:00Z',
    openFlagCount: 1,
    sessions: [
      {
        session_id: 'SES-JKN-2026-10-85',
        title: 'Audit Fusi 3 Lapis: Klaster Fisioterapi RS Khusus Mitra Husada',
        claim_id: 'CLM-2026-10-085',
        first_time: '2026-10-24T19:30:00Z',
        last_time: '2026-10-24T19:45:00Z',
        message_count: 6,
        model_used: 'ClaimTrace Core AI',
        tokens_total: 2450,
        risk_level: 'CRITICAL',
        risk_score: 94,
        status: 'awaiting_approval',
        messages: [
          {
            role: 'user',
            sender_name: 'Verifikator Medis',
            text: 'Tolong evaluasi klaim fisioterapi 85 berkas pada RS Khusus Mitra Husada. Apakah ada indikasi Phantom Billing?',
            timestamp: '19:30',
          },
          {
            role: 'assistant',
            sender_name: 'CLAIMTRACE_AI (Orchestrator)',
            model: 'ClaimTrace Core AI',
            text: 'Berdasarkan fusi 3 lapis data, terdeteksi anomali kritis dengan skor 94.0%. 80% peserta menyangkal kehadiran via telemetri Mobile JKN Lapis 3, dan SIP DPJP dr. HS telah kedaluwarsa selama 42 hari di SATUSEHAT Lapis 1. Direkomendasikan tindakan Tunda Bayar BAKB sesuai Perpres 82/2018 Pasal 76.',
            tokens: 680,
            latency_ms: 480,
            citations: ['Perpres 82/2018 Pasal 76', 'Permenkes 14/2021', 'SATUSEHAT SDMK'],
            timestamp: '19:31',
          },
          {
            role: 'user',
            sender_name: 'Verifikator Medis',
            text: 'Berapa potensi kerugian biaya yang dicegah jika pembayaran klaim ini ditunda?',
            timestamp: '19:35',
          },
          {
            role: 'assistant',
            sender_name: 'TCA (Audit PNPK)',
            model: 'ClaimTrace Core AI',
            text: 'Total nilai klaim yang berisiko adalah Rp 148.500.000 untuk 85 berkas fisioterapi. Penundaan penandatanganan Berita Acara Kelengkapan Berkas (BAKB) melindungi dana amanah DJS tanpa melanggar SLA batas bayar 10 hari kerja.',
            tokens: 520,
            latency_ms: 410,
            citations: ['SE DJSN 01/2023', 'Regulasi Verifikasi Pasca-Bayar'],
            timestamp: '19:36',
          },
        ],
      },
      {
        session_id: 'SES-JKN-2026-10-84',
        title: 'Klarifikasi Koding Sepsis Neonatal RSUPN Dr. Cipto Mangunkusumo',
        claim_id: 'CLM-2026-10-084',
        first_time: '2026-10-24T18:10:00Z',
        last_time: '2026-10-24T18:22:00Z',
        message_count: 4,
        model_used: 'ClaimTrace Core AI',
        tokens_total: 1820,
        risk_level: 'HIGH',
        risk_score: 82,
        status: 'completed',
        messages: [
          {
            role: 'user',
            sender_name: 'Verifikator Medis',
            text: 'Periksa berkas SEP-0114R0010326V009210 dengan diagnosa Sepsis Berat pada bayi prematur.',
            timestamp: '18:10',
          },
          {
            role: 'assistant',
            sender_name: 'TCA (Audit PNPK)',
            model: 'ClaimTrace Core AI',
            text: 'Hasil audit Lapis 1 menemukan tidak adanya hasil kultur darah dan nilai CRP serial normal. Pengodean P-8-09-III tidak didukung resume medis PNPK Ikatan Dokter Anak Indonesia (IDAI). Sistem telah menerbitkan draf klarifikasi BAKK ke Casemix RSUPN Dr. Cipto Mangunkusumo.',
            tokens: 610,
            latency_ms: 440,
            citations: ['PNPK Sepsis Neonatal 2021', 'Berita Acara Kesepakatan Bersama 2020'],
            timestamp: '18:11',
          },
        ],
      },
    ],
  },
  {
    userHash: 'usr_casemix_mitrahusada',
    userName: 'Siti Rahmawati (Casemix RS Mitra Husada)',
    userRole: 'PIC_CASEMIX',
    userEmail: 'casemix.rahma@rskh-mitrahusada.co.id',
    faskesName: 'RS Khusus Mitra Husada (0114R005)',
    totalMessages: 12,
    lastActivityIso: '2026-10-24T18:40:00Z',
    openFlagCount: 2,
    sessions: [
      {
        session_id: 'SES-JKN-2026-10-82',
        title: 'Konsultasi Persyaratan Kelengkapan Berkas BAKK Fisioterapi',
        claim_id: 'CLM-2026-10-082',
        first_time: '2026-10-24T18:30:00Z',
        last_time: '2026-10-24T18:40:00Z',
        message_count: 4,
        model_used: 'ClaimTrace Core AI',
        tokens_total: 1650,
        risk_level: 'CRITICAL',
        risk_score: 89,
        status: 'flagged',
        messages: [
          {
            role: 'user',
            sender_name: 'PIC Casemix',
            text: 'Mengapa pengajuan klaim fisioterapi kami dihentikan sementara pada portal V-Claim?',
            timestamp: '18:30',
          },
          {
            role: 'assistant',
            sender_name: 'STA (Sub-Agen Regulasi)',
            model: 'ClaimTrace Core AI',
            text: 'Penghentian sementara dilakukan karena terdapat sangkalan presensi dari peserta terdaftar pada Mobile JKN dan masa berlaku SIP DPJP spesialis kedokteran fisik belum terbarukan di konsil KKI/SATUSEHAT. Silakan unggah SIP aktif dan lembar asesmen fisioterapi bertanda tangan basah.',
            tokens: 580,
            latency_ms: 390,
            citations: ['Permenkes 14/2021', 'Ketentuan Verifikasi Klaim FKRTL'],
            timestamp: '18:32',
          },
        ],
      },
    ],
  },
  {
    userHash: 'usr_wasrik_kedeputian_vi',
    userName: 'Auditor Wasrik Kedeputian Wilayah VI',
    userRole: 'WASRIK',
    userEmail: 'iwan.kusuma@bpjs-kesehatan.go.id',
    faskesName: 'Kedeputian Wilayah VI Jawa Tengah & DIY',
    totalMessages: 24,
    lastActivityIso: '2026-10-24T17:15:00Z',
    openFlagCount: 0,
    sessions: [
      {
        session_id: 'SES-JKN-2026-10-79',
        title: 'Audit Forensik Graph Sindikat Rujukan Antar Faskes',
        claim_id: 'CLM-2026-10-079',
        first_time: '2026-10-24T16:50:00Z',
        last_time: '2026-10-24T17:15:00Z',
        message_count: 8,
        model_used: 'ClaimTrace Core AI',
        tokens_total: 3100,
        risk_level: 'HIGH',
        risk_score: 78,
        status: 'completed',
        messages: [
          {
            role: 'user',
            sender_name: 'Auditor Wasrik',
            text: 'Tampilkan analisis klaster perpindahan rujukan berulang pada faskes rujukan di wilayah pemantauan.',
            timestamp: '16:50',
          },
          {
            role: 'assistant',
            sender_name: 'IA (Sub-Agen Intelijen Anomali)',
            model: 'ClaimTrace Core AI',
            text: 'Terdeteksi pola churn rujukan anomali (Jaccard similarity index 0.84) antara Klinik Pratama Sehat Mandiri dan RS Khusus Mitra Husada dengan 42 pasien yang sama didiagnosa klaim katarak beruntun tanpa jeda waktu rawat.',
            tokens: 720,
            latency_ms: 510,
            citations: ['Pedoman Wasrik 2024', 'Graf Sindikat ClaimTrace'],
            timestamp: '16:52',
          },
        ],
      },
    ],
  },
  {
    userHash: 'usr_mobile_jkn_citiz_01',
    userName: 'Siti Aminah (Peserta JKN Mandiri)',
    userRole: 'PESERTA_MOBILE_JKN',
    userEmail: 'peserta.siti@gmail.com',
    faskesName: 'Terdaftar di FKTP Klinik Pratama Nasional',
    totalMessages: 10,
    lastActivityIso: '2026-10-24T15:20:00Z',
    openFlagCount: 1,
    sessions: [
      {
        session_id: 'SES-JKN-2026-10-71',
        title: 'Konfirmasi Presensi Mobile JKN (Tantangan Push Notification)',
        claim_id: 'CLM-2026-10-071',
        first_time: '2026-10-24T15:10:00Z',
        last_time: '2026-10-24T15:20:00Z',
        message_count: 2,
        model_used: 'ClaimTrace Fast AI',
        tokens_total: 950,
        risk_level: 'CRITICAL',
        risk_score: 95,
        status: 'flagged',
        messages: [
          {
            role: 'assistant',
            sender_name: 'ClaimTrace FCM Push Bot',
            model: 'ClaimTrace Fast AI',
            text: 'Halo Ibu Siti Aminah, apakah Anda menerima pelayanan tindakan terapi fisik di RS Khusus Mitra Husada pada hari ini, 24 Oktober 2026 pukul 14:00?',
            tokens: 150,
            latency_ms: 220,
            timestamp: '15:10',
          },
          {
            role: 'user',
            sender_name: 'Peserta Mobile JKN',
            text: 'Tidak ada, saya seharian di rumah dan tidak pernah ke rumah sakit tersebut minggu ini.',
            timestamp: '15:15',
          },
        ],
      },
    ],
  },
];

export default function ConversationsView({ onSelectCase, isLight: propIsLight }) {
  const [themeIsLight, setThemeIsLight] = useState(() => {
    if (typeof propIsLight === 'boolean') return propIsLight;
    if (typeof document !== 'undefined') {
      const root = document.getElementById('cockpit-root') || document.documentElement;
      return root.classList.contains('theme-light');
    }
    return false;
  });

  useEffect(() => {
    if (typeof propIsLight === 'boolean') {
      setThemeIsLight(propIsLight);
      return;
    }
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      const root = document.getElementById('cockpit-root') || document.documentElement;
      setThemeIsLight(root.classList.contains('theme-light'));
    });
    const root = document.getElementById('cockpit-root') || document.documentElement;
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [propIsLight]);

  const isLight = typeof propIsLight === 'boolean' ? propIsLight : themeIsLight;

  const [userGroups, setUserGroups] = useState(INITIAL_CONVERSATION_GROUPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedSession, setSelectedSession] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('Indikasi kuat Phantom Billing & Sangkalan Pasien');
  const [toastMsg, setToastMsg] = useState(null);

  // Auto-dismiss Toast Feedback setelah 3.2 detik
  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => {
      setToastMsg(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  // Handle Refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    return userGroups.filter((g) => {
      const matchSearch =
        g.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.faskesName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.sessions.some((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.session_id.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRole = roleFilter === 'ALL' || g.userRole === roleFilter;

      return matchSearch && matchRole;
    });
  }, [userGroups, searchQuery, roleFilter]);

  // Aggregate Stats (Matching media_1792847792743_cc7652ee.png)
  const stats = useMemo(() => {
    const totalSessions = userGroups.reduce((acc, g) => acc + g.sessions.length, 0);
    const totalConversations = userGroups.reduce((acc, g) => acc + g.totalMessages, 0);
    const avgMessages = totalSessions > 0 ? (totalConversations / totalSessions).toFixed(1) : '0.0';

    return {
      totalSessions,
      totalUsers: userGroups.length,
      totalConversations,
      conversationsToday: 12,
      avgSession: avgMessages,
      thisWeek: 42,
    };
  }, [userGroups]);

  // Handle Flag Session
  const handleSaveFlag = () => {
    if (selectedSession) {
      setUserGroups((prev) =>
        prev.map((g) => ({
          ...g,
          sessions: g.sessions.map((s) =>
            s.session_id === selectedSession.session_id ? { ...s, status: 'flagged' } : s
          ),
        }))
      );
      setSelectedSession((prev) => (prev ? { ...prev, status: 'flagged' } : prev));
      setToastMsg(`Sesi ${selectedSession.session_id} berhasil ditandai bendera investigasi audit Wasrik.`);
    }
    setFlagModalOpen(false);
  };

  const handleExport = () => {
    const csvRows = [
      ['Session ID', 'Judul Sesi', 'Pengguna', 'Peran', 'Faskes', 'Berkas Klaim', 'Tingkat Risiko', 'Skor Risiko', 'Model AI', 'Total Pesan', 'Waktu Mulai', 'Waktu Selesai'],
    ];

    groups.forEach((g) => {
      g.sessions.forEach((s) => {
        csvRows.push([
          `"${s.session_id}"`,
          `"${(s.title || '').replace(/"/g, '""')}"`,
          `"${g.userName}"`,
          `"${g.userRole}"`,
          `"${g.faskesName}"`,
          `"${s.claim_id || '-'}"`,
          `"${s.risk_level}"`,
          s.risk_score || 0,
          `"${s.model_used || '-'}"`,
          s.message_count || 0,
          `"${s.first_time || ''}"`,
          `"${s.last_time || ''}"`,
        ]);
      });
    });

    const csvContent = '\uFEFF' + csvRows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Transkrip_Dialog_AI_Forensik_JKN_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <MessageSquare className={`w-6 h-6 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
              <span>Dialog AI Forensik &amp; Verifikator</span>
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-[#FFCA40]/10 text-[#FFCA40] border-[#FFCA40]/30'
            }`}>
              Multi-Agent Dialog Forensik JKN
            </span>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/10 text-white/80 border-white/10'
            }`}>
              NIST AI RMF 1.0 · MITRE ATLAS: AML.T0043 Guardrails
            </span>
          </div>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Pemantauan Percakapan Multi-Agen ClaimTrace AI &amp; Interaksi Verifikator Medis JKN · Tinjauan Tingkat Sesi &amp; Berkas Klaim (Terproteksi Anti-Prompt Injection MITRE ATLAS AML.T0043).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button aria-label="Segarkan data" type="button"
            onClick={handleRefresh}
            className={`p-2.5 rounded-xl transition-all shadow-md cursor-pointer border ${
              isLight 
                ? 'bg-white border-slate-300 text-slate-700 hover:text-emerald-700 hover:bg-slate-100' 
                : 'bg-white/5 border-white/10 hover:border-white/20 text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title="Segarkan Sesi"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-sky-600' : isLight ? 'text-slate-600' : 'text-[#FFCA40]'}`} />
          </button>
          <button type="button"
            onClick={handleExport}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md cursor-pointer border ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                : 'bg-white/5 border-white/10 hover:border-white/20 text-white hover:bg-white/10'
            }`}
          >
            <Download className={`h-4 w-4 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
            <span>Ekspor</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL SESSIONS */}
        <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-xl backdrop-blur-xl ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
            : 'bg-[#00153A]/85 border-white/10 text-white shadow-[#00081c]/50'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>TOTAL SESI DIALOG</p>
              <p className={`text-3xl font-bold mt-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.totalSessions}</p>
              <p className={`text-xs mt-2 ${isLight ? 'text-slate-500 font-medium' : 'text-white/40'}`}>{stats.totalUsers} pengguna terdaftar</p>
            </div>
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }`}>
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* CONVERSATIONS */}
        <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-xl backdrop-blur-xl ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
            : 'bg-[#00153A]/85 border-white/10 text-white shadow-[#00081c]/50'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>TOTAL PERCAKAPAN</p>
              <p className={`text-3xl font-bold mt-1.5 ${isLight ? 'text-amber-800' : 'text-[#FFCA40]'}`}>{stats.totalConversations}</p>
              <p className={`text-xs mt-2 ${isLight ? 'text-slate-500 font-medium' : 'text-white/40'}`}>{stats.conversationsToday} hari ini</p>
            </div>
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/10 text-[#FFCA40] border-amber-500/20'
            }`}>
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* AVG SESSION */}
        <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-xl backdrop-blur-xl ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
            : 'bg-[#00153A]/85 border-white/10 text-white shadow-[#00081c]/50'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>RATA-RATA SESI</p>
              <p className={`text-3xl font-bold mt-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.avgSession}</p>
              <p className={`text-xs mt-2 ${isLight ? 'text-slate-500 font-medium' : 'text-white/40'}`}>pesan per sesi</p>
            </div>
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}>
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* THIS WEEK */}
        <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-xl backdrop-blur-xl ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
            : 'bg-[#00153A]/85 border-white/10 text-white shadow-[#00081c]/50'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>MINGGU INI</p>
              <p className={`text-3xl font-bold mt-1.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{stats.thisWeek}</p>
              <p className={`text-xs mt-2 ${isLight ? 'text-slate-500 font-medium' : 'text-white/40'}`}>percakapan baru</p>
            </div>
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-xl backdrop-blur-xl ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
          : 'bg-[#00153A]/85 border-white/10 text-white shadow-[#00081c]/50'
      }`}>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
            <input aria-label="Cari percakapan berdasarkan pengguna, topik, ID sesi, atau berkas klaim..."
              type="text"
              placeholder="Cari percakapan berdasarkan pengguna, topik, ID sesi, atau berkas klaim..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs transition-all focus:outline-none border ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                  : 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-[#FFCA40]/60'
              }`}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`border rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none cursor-pointer ${
                isLight 
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500' 
                  : 'bg-[#00134A] border-white/10 text-white focus:border-[#FFCA40]/60'
              }`}
            >
              <option value="ALL" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Semua Peran</option>
              <option value="VERIFIKATOR" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Verifikator Medis</option>
              <option value="PIC_CASEMIX" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>PIC Casemix FKRTL</option>
              <option value="WASRIK" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Auditor Wasrik</option>
              <option value="PESERTA_MOBILE_JKN" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Peserta Mobile JKN</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Groups Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Kelompok Pengguna &amp; Verifikator</h2>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
              Pilih pengguna atau verifikator untuk melihat daftar sesi dialog. Menampilkan {filteredGroups.length} entitas terdaftar.
            </p>
          </div>
        </div>

        {filteredGroups.length === 0 ? (
          <div className={`relative overflow-hidden rounded-2xl border p-12 text-center shadow-xl transition-all ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
              : 'border-white/10 bg-[#00153A]/85 text-white shadow-[#00081c]/50'
          }`}>
            <Users className={`w-10 h-10 mx-auto mb-3 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
            <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Tidak ditemukan data pengguna pada filter ini.</p>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Coba sesuaikan kata kunci pencarian atau ganti filter peran pengguna.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((group) => (
              <div
                key={group.userHash}
                className={`relative overflow-hidden rounded-2xl border shadow-xl transition-all ${
                  isLight
                    ? 'bg-white border-slate-200/90 text-slate-900 shadow-slate-200/50 hover:border-emerald-500/60 hover:shadow-sky-100/40'
                    : 'border-white/10 bg-[#00153A]/85 text-white shadow-[#00081c]/50 hover:border-[#FFCA40]/40'
                }`}
              >
                {/* Group Summary Row */}
                <div className={`p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shadow-md ${
                      isLight
                        ? 'bg-gradient-to-br from-sky-600 to-blue-700 text-white'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                    }`}>
                      {group.userName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{group.userName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          isLight
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-white/10 text-white/80 border-white/10'
                        }`}>
                          {group.userRole}
                        </span>
                        {group.openFlagCount > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                            isLight
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-amber-500/15 text-[#FFCA40] border-amber-500/30'
                          }`}>
                            <Flag className={`w-3 h-3 ${isLight ? 'text-amber-700' : 'text-[#FFCA40]'}`} />
                            <span>{group.openFlagCount} Ditandai</span>
                          </span>
                        )}
                      </div>
                      <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        {group.userEmail} · {group.faskesName}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-4 text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    <div>
                      <span className={`font-bold ${isLight ? 'text-emerald-800' : 'text-[#FFCA40]'}`}>{group.sessions.length}</span> sesi
                    </div>
                    <div>
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{group.totalMessages}</span> pesan
                    </div>
                  </div>
                </div>

                {/* Sessions under this User Group */}
                <div className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                  {group.sessions.map((session) => (
                    <div
                      key={session.session_id}
                      onClick={() => setSelectedSession(session)}
                      className={`p-4 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group ${
                        isLight
                          ? 'hover:bg-emerald-50/50 text-slate-900'
                          : 'hover:bg-white/5 text-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg transition-colors mt-0.5 border ${
                          isLight
                            ? 'bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-800 border-slate-200'
                            : 'bg-white/5 text-white/70 group-hover:bg-[#FFCA40]/20 group-hover:text-[#FFCA40] border-white/10'
                        }`}>
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-xs font-bold ${
                              isLight ? 'text-emerald-800' : 'text-cyan-400'
                            }`}>{session.session_id}</span>
                            <span className={isLight ? 'text-slate-300' : 'text-white/20'}>•</span>
                            <span className={`font-bold text-xs transition-colors ${
                              isLight ? 'text-slate-900 group-hover:text-emerald-700' : 'text-white group-hover:text-[#FFCA40]'
                            }`}>
                              {session.title}
                            </span>
                          </div>
                          <div className={`flex flex-wrap items-center gap-2 text-[11px] mt-1 ${
                            isLight ? 'text-slate-500' : 'text-white/50'
                          }`}>
                            <span>Klaim Terkait: <strong className={isLight ? 'text-slate-800' : 'text-white/80'}>{session.claim_id}</strong></span>
                            <span>•</span>
                            <span>Model: <span className={`font-mono font-semibold ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>{session.model_used}</span></span>
                            <span>•</span>
                            <span>{session.message_count} pesan ({session.tokens_total} token)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {session.risk_level === 'CRITICAL' ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isLight
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}>
                            KRITIS ({session.risk_score})
                          </span>
                        ) : session.risk_level === 'HIGH' ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isLight
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-amber-500/15 text-[#FFCA40] border-amber-500/30'
                          }`}>
                            TINGGI ({session.risk_score})
                          </span>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isLight
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}>
                            BERSIH / PATUH
                          </span>
                        )}

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          isLight
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-white/10 text-white/70 border-white/10'
                        }`}>
                          {session.status === 'awaiting_approval'
                            ? 'MENUNGGU PERSETUJUAN'
                            : session.status === 'flagged'
                            ? 'DITANDAI WASRIK'
                            : 'TERVERIFIKASI'}
                        </span>

                        <ChevronRight className={`w-4 h-4 transition-all group-hover:translate-x-0.5 ${
                          isLight
                            ? 'text-slate-400 group-hover:text-emerald-700'
                            : 'text-white/40 group-hover:text-[#FFCA40]'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Detail Drilldown Modal */}
      <AnimatePresence>
        {selectedSession && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in ${
            isLight ? 'bg-slate-900/60 backdrop-blur-md' : 'bg-[#00081c]/80 backdrop-blur-md'
          }`}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-3xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/20'
                  : 'bg-[#00153A] border-white/20 text-white'
              }`}
            >
              {/* Modal Header */}
              <div className={`p-5 border-b flex items-start justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs font-bold ${isLight ? 'text-emerald-800' : 'text-cyan-400'}`}>
                      {selectedSession.session_id}
                    </span>
                    <span className={isLight ? 'text-slate-300' : 'text-white/20'}>•</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      isLight
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}>
                      {selectedSession.model_used}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      isLight
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {selectedSession.risk_level} ({selectedSession.risk_score})
                    </span>
                  </div>
                  <h3 className={`text-base font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {selectedSession.title}
                  </h3>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Klaim Terkait: <strong className={isLight ? 'text-slate-800' : 'text-white/80'}>{selectedSession.claim_id}</strong> · Total Token: {selectedSession.tokens_total}
                  </p>
                </div>
                <button type="button"
                  onClick={() => setSelectedSession(null)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message Transcript Stream */}
              <div className={`flex-1 overflow-y-auto p-5 space-y-4 ${
                isLight ? 'bg-slate-50/60' : 'bg-black/20'
              }`}>
                {selectedSession.messages.map((msg, idx) => {
                  const isAssistant = msg.role === 'assistant';

                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                    >
                      {isAssistant && (
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-md mt-1 ${
                          isLight
                            ? 'bg-gradient-to-br from-sky-600 to-blue-700 text-white'
                            : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                        }`}>
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] rounded-2xl p-4 shadow-md ${
                          isAssistant
                            ? isLight
                              ? 'bg-white border border-slate-200 text-slate-800 shadow-slate-200/50'
                              : 'bg-white/5 border border-white/10 text-white'
                            : isLight
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1.5">
                          <span
                            className={`text-[11px] font-bold ${
                              isAssistant
                                ? isLight ? 'text-emerald-800' : 'text-[#FFCA40]'
                                : 'text-blue-100'
                            }`}
                          >
                            {msg.sender_name}
                          </span>
                          <span
                            className={`text-[10px] font-mono ${
                              isAssistant
                                ? isLight ? 'text-slate-400' : 'text-white/40'
                                : 'text-blue-200'
                            }`}
                          >
                            {msg.timestamp}
                          </span>
                        </div>

                        <p className={`text-xs leading-relaxed whitespace-pre-wrap ${
                          isAssistant && isLight ? 'text-slate-700' : 'text-white'
                        }`}>{msg.text}</p>

                        {/* Citations & Telemetry if Assistant */}
                        {isAssistant && (
                          <div className={`mt-3 pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-[10px] ${
                            isLight ? 'border-slate-200' : 'border-white/10'
                          }`}>
                            {msg.citations && (
                              <div className="flex flex-wrap items-center gap-1">
                                <span className={isLight ? 'text-slate-500 font-semibold' : 'text-white/40 font-semibold'}>
                                  Sitasi Regulasi:
                                </span>
                                {msg.citations.map((cite, cIdx) => (
                                  <span
                                    key={cIdx}
                                    className={`px-1.5 py-0.5 rounded font-medium border ${
                                      isLight
                                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                                        : 'bg-white/10 text-white/80 border-white/10'
                                    }`}
                                  >
                                    {cite}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className={`font-mono ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                              {msg.tokens} token · {msg.latency_ms}ms
                            </div>
                          </div>
                        )}
                      </div>

                      {!isAssistant && (
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-md mt-1 ${
                          isLight ? 'bg-slate-700 text-white' : 'bg-slate-700 text-white'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Modal Actions Footer */}
              <div className={`p-4 border-t flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <button type="button"
                  onClick={() => setFlagModalOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    isLight
                      ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300'
                      : 'text-[#FFCA40] bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Tandai Sesi (Flag for Wasrik)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button type="button"
                    onClick={() => setSelectedSession(null)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isLight
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Tutup
                  </button>
                  {selectedSession.claim_id && (
                    <button type="button"
                      onClick={() => {
                        const cId = selectedSession.claim_id;
                        setSelectedSession(null);
                        if (onSelectCase) onSelectCase(cId);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                        isLight
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                          : 'bg-gradient-to-r from-[#FFCA40] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                      }`}
                    >
                      Buka Investigasi Klaim
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Flag Reason Dialog Modal */}
      {flagModalOpen && selectedSession && (
        <div className={`fixed inset-0 z-60 flex items-center justify-center p-4 animate-fade-in ${
          isLight ? 'bg-slate-900/60 backdrop-blur-md' : 'bg-[#00081c]/80 backdrop-blur-md'
        }`}>
          <div className={`w-full max-w-md rounded-2xl shadow-2xl border p-6 space-y-4 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#00153A] border-white/20 text-white'
          }`}>
            <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Flag className={`w-4 h-4 ${isLight ? 'text-amber-700' : 'text-[#FFCA40]'}`} />
              <span>Tandai Sesi untuk Audit Wasrik</span>
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Sesi <strong className={isLight ? 'text-slate-900' : 'text-white'}>{selectedSession.session_id}</strong> akan ditambahkan ke antrean Sesi Ditandai (Flags) untuk penelaahan mendalam oleh tim Pengawasan &amp; Pemeriksaan.
            </p>
            <div>
              <label className={`block text-[11px] font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                Alasan Penandaan
              </label>
              <textarea
                rows={3}
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className={`w-full rounded-xl p-3 text-xs border focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                    : 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-[#FFCA40]/60'
                }`}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button"
                onClick={() => setFlagModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Batal
              </button>
              <button type="button"
                onClick={handleSaveFlag}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-gradient-to-r from-[#FFCA40] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                }`}
              >
                Konfirmasi Tandai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            key={toastMsg}
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            transition={{ duration: 0.2 }}
            className={`fixed top-20 left-1/2 z-50 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 backdrop-blur-xl border overflow-hidden ${
              isLight
                ? 'bg-white text-slate-900 border-emerald-500/40 shadow-slate-300/50'
                : 'bg-[#00153A] text-white border-emerald-500/50 shadow-black/80'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{toastMsg}</span>
            <button
              onClick={() => setToastMsg(null)}
              aria-label="Tutup notifikasi"
              className={`ml-2 cursor-pointer p-0.5 rounded transition ${
                isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <motion.div
              key={`bar-${toastMsg}`}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3.2, ease: "linear" }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
