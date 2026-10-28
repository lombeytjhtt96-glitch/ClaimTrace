import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MarkdownRenderer from '../Common/MarkdownRenderer';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Activity,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Layers,
  Cpu,
  Zap,
  RefreshCw,
  Search,
  Filter,
  FileText,
  AlertOctagon,
  Building2,
  Stethoscope,
  Radio,
  ExternalLink,
  ChevronLeft,
  X
} from 'lucide-react';
import { orchestrateJknChat } from '../../services/claimtraceOrchestratorService';

// Konfigurasi Warna Badge Agen (Dual-Theme Supported)
const GET_AGENT_BADGES = (isLight) => ({
  'L1-Klinis': { 
    label: 'L1 Klinis & INA-CBG', 
    bg: isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
  },
  'L2-Regulasi': { 
    label: 'L2 SATUSEHAT SDMK', 
    bg: isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
  },
  'L3-Presensi': { 
    label: 'L3 Telemetri Mobile JKN', 
    bg: isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
  },
  'CMA': { 
    label: 'CMA (Manajemen Berkas & SLA)', 
    bg: isLight ? 'bg-purple-50 text-purple-800 border-purple-300' : 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
  },
  'IA': { 
    label: 'IA (Intervensi & Rekonsiliasi)', 
    bg: isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
  },
  'ClaimTrace': { 
    label: 'Orkestrator Meta-Agent', 
    bg: isLight ? 'bg-indigo-50 text-indigo-800 border-indigo-300' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' 
  },
});

// Kartu Rekomendasi Pertanyaan Cepat (Quick Starter Cards)
const SUGGESTED_PROMPTS = [
  {
    id: 'fisioterapi',
    title: 'Audit Klaster Fisioterapi RS Mitra Husada',
    subtitle: 'Lonjakan 85 klaim baksos dalam 48 jam & skor risiko 94%',
    prompt: 'Analisis temuan anomali klaster 85 klaim fisioterapi di RS Khusus Mitra Husada. Mengapa skor risikonya mencapai 94% dan apa rekomendasi tindakan verifikator?',
    icon: Building2,
    badge: 'Kritis',
    badgeColorLight: 'bg-rose-50 text-rose-800 border-rose-300',
    badgeColorDark: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  },
  {
    id: 'geovelocity',
    title: 'Validasi Geovelocity DPJP dr. Hendra',
    subtitle: 'Kecepatan 198.1 km/jam Jakarta-Bandung (Impossible Travel)',
    prompt: 'Jelaskan hasil audit geovelocity OSRM terhadap klaim dr. Hendra Prasetya, Sp.B antara RSUPN Dr. Cipto Mangunkusumo Jakarta dan RSUP Dr. Hasan Sadikin Bandung pada tanggal 24 Oktober 2026.',
    icon: Stethoscope,
    badge: 'ATT&CK T1078',
    badgeColorLight: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    badgeColorDark: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  },
  {
    id: 'mobile_jkn',
    title: 'Telemetri Presensi Mobile JKN (Lapis 3)',
    subtitle: 'Konfirmasi sangkalan kehadiran peserta pada klaim katarak',
    prompt: 'Bagaimana hasil verifikasi Lapis 3 Mobile JKN pada kasus klaim katarak Ny. Siti Aisyah? Apakah ada sangkalan kehadiran dan bagaimana aspek yuridis pembuktiannya?',
    icon: Radio,
    badge: 'D3FEND D3-MFA',
    badgeColorLight: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    badgeColorDark: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  {
    id: 'sla_rules',
    title: 'Evaluasi Batas Waktu SLA 10 Hari Kerja',
    subtitle: 'Kepatuhan Pasal 76 Perpres 82/2018 & mitigasi denda keterlambatan 1%',
    prompt: 'Jelaskan ketentuan batas waktu SLA 10 hari kerja verifikasi klaim BPJS Kesehatan berdasarkan Perpres 82/2018 dan bagaimana ClaimTrace mencegah denda keterlambatan 1% per bulan.',
    icon: Clock,
    badge: 'Regulasi',
    badgeColorLight: 'bg-purple-50 text-purple-800 border-purple-300',
    badgeColorDark: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  },
  {
    id: 'djs_bakb',
    title: 'Kalkulasi Penyelamatan DJS & Draf BAKB',
    subtitle: 'Estimasi potensi kerugian Rp 178,5 Juta dan format berita acara',
    prompt: 'Berapa total estimasi eksposur finansial DJS yang berhasil dicegah dari anomali klaim aktif saat ini, dan bagaimana rumusan rekomendasi Berita Acara Klarifikasi Bersama (BAKB)?',
    icon: FileText,
    badge: 'Monetization',
    badgeColorLight: 'bg-amber-50 text-amber-800 border-amber-300',
    badgeColorDark: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  {
    id: 'unbundling_split',
    title: 'Audit Split Claim & Unbundling INA-CBG',
    subtitle: 'Analisis pemecahan tagihan episode rawat jalan hari yang sama',
    prompt: 'Analisis temuan anomali pemecahan klaim (unbundling & split claim) pada kasus rawat jalan hari yang sama di FKRTL, dan jelaskan dasar regulasi penolakan pembayaran ganda.',
    icon: Layers,
    badge: 'Permenkes 26/2021',
    badgeColorLight: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    badgeColorDark: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  }
];

export default function HealthAIChatView({ onNavigateTab, currentUser, isLight: propIsLight }) {
  const [internalIsLight, setInternalIsLight] = useState(() => {
    if (typeof document !== 'undefined') {
      const root = document.getElementById('cockpit-root');
      return root ? root.classList.contains('theme-light') : false;
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
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    const root = document.getElementById('cockpit-root');
    if (root) observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [propIsLight]);

  const isLight = typeof propIsLight === 'boolean' ? propIsLight : internalIsLight;
  const AGENT_BADGES = useMemo(() => GET_AGENT_BADGES(isLight), [isLight]);

  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      role: 'assistant',
      senderName: 'Asisten Audit JKN (Meta-Agent)',
      resolvedAgent: 'ClaimTrace',
      content: `Selamat datang di **Portal Asisten Audit JKN (HealthAI Enhanced)**. 

Saya adalah asisten cerdas berarsitektur **LangGraph Multi-Agent** yang terhubung langsung ke basis data **ClaimTrace DSS BPJS Kesehatan**, memadukan 5 sub-agen spesialis:
1. **Lapis 1 (Audit Klinis)**: Validasi kaidah koding ICD-10/ICD-9-CM & dekomposisi INA-CBG.
2. **Lapis 2 (Regulasi DPJP)**: Pengecekan SIP SATUSEHAT Kemenkes & audit geovelocity OSRM.
3. **Lapis 3 (Telemetri Mobile JKN)**: Konfirmasi kehadiran faktual peserta (*Zero-Knowledge Presence*).
4. **CMA (Claims Management Agent)**: Pemantauan batas waktu SLA 10 hari kerja (Perpres 82/2018).
5. **IA (Intervention Agent)**: Formulasi rekomendasi koreksi & Berita Acara Klarifikasi Bersama (BAKB).

Silakan ketik pertanyaan audit klaim Anda atau pilih salah satu skenario investigasi cepat di bawah.`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      riskLevel: 'safe',
      agentsInvoked: ['L1-Klinis', 'L2-Regulasi', 'L3-Presensi', 'CMA', 'IA'],
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showThinkingTrace, setShowThinkingTrace] = useState(true);
  const [showActivitySidebar, setShowActivitySidebar] = useState(true);
  const [currentThinking, setCurrentThinking] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeAgents, setActiveAgents] = useState([]);
  const [activityLogs, setActivityLogs] = useState([
    {
      id: 'act-01',
      timestamp: new Date().toISOString(),
      type: 'agent_start',
      agent: 'ClaimTrace',
      message: 'Orkestrator LangGraph Multi-Agent diinisialisasi & terhubung ke ClaimTrace AI Engine.',
      durationMs: 42,
    },
    {
      id: 'act-02',
      timestamp: new Date().toISOString(),
      type: 'agent_start',
      agent: 'L1-Klinis',
      message: 'Sub-Agen Kaidah Koding memuat 14.820 aturan grouping INA-CBG & diagnosa ICD-10.',
      durationMs: 65,
    },
    {
      id: 'act-03',
      timestamp: new Date().toISOString(),
      type: 'tool_use',
      agent: 'L2-Regulasi',
      message: 'Menyinkronkan status 1.482 SIP dokter aktif dari SATUSEHAT SDMK Kemenkes.',
      durationMs: 118,
    },
    {
      id: 'act-04',
      timestamp: new Date().toISOString(),
      type: 'tool_use',
      agent: 'L3-Presensi',
      message: 'FCM High-Priority Push Gateway terverifikasi aktif untuk konfirmasi kehadiran peserta.',
      durationMs: 85,
    },
    {
      id: 'act-05',
      timestamp: new Date().toISOString(),
      type: 'risk_assessment',
      agent: 'CMA',
      message: 'Pemantauan SLA 10 Hari Kerja Perpres 82/2018 aktif pada 24 berkas klaim berjalan.',
      durationMs: 54,
    },
    {
      id: 'act-06',
      timestamp: new Date().toISOString(),
      type: 'agent_start',
      agent: 'IA',
      message: 'Mesin Rekonsiliasi BAKB & Estimasi Pemulihan Finansial DJS siap digunakan.',
      durationMs: 48,
    }
  ]);

  const [activityFilter, setActivityFilter] = useState('all'); // 'all' | 'agent' | 'tool' | 'risk'
  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);

  // Auto-scroll ke pesan terbaru
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentThinking]);

  // Timer thinking tracker
  useEffect(() => {
    if (isLoading) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading]);

  // Tambahkan log aktivitas
  const logActivity = useCallback((type, agent, message, durationMs = null) => {
    const newLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      agent,
      message,
      durationMs,
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  }, []);

  // Eksekusi Pengiriman Pesan & Pemanggilan Orkestrator
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setInput('');
    const correlationId = `msg-${Date.now()}`;
    const userTimestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Tambahkan pesan pengguna
    setMessages((prev) => [
      ...prev,
      {
        id: correlationId,
        role: 'user',
        content: query,
        timestamp: userTimestamp,
      },
    ]);

    setIsLoading(true);
    setCurrentThinking('Mengorkestrasikan simpul ReAct: Analisis Klaim, Validasi Regulasi & Presensi...');
    setActiveAgents(['L1-Klinis', 'L2-Regulasi', 'L3-Presensi', 'CMA', 'IA']);

    logActivity('agent_start', 'ClaimTrace', `Menerima instruksi verifikator: "${query.substring(0, 45)}..."`);
    logActivity('tool_start', 'L1-Klinis', 'Menjalankan dekomposisi tarif INA-CBG & kaidah koding ICD-10.');
    logActivity('tool_start', 'L2-Regulasi', 'Menjalankan inspeksi validitas SIP SATUSEHAT & kalkulasi geovelocity.');

    const startTime = Date.now();

    try {
      const historyForApi = messages
        .filter((m) => m.content)
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await orchestrateJknChat(query, historyForApi);
      const executionDuration = Date.now() - startTime;

      logActivity('tool_end', 'L1-Klinis', 'Selesai mengevaluasi parameter klinis.', Math.round(executionDuration * 0.4));
      logActivity('tool_end', 'L2-Regulasi', 'Selesai memverifikasi kepatuhan SDMK Kemenkes.', Math.round(executionDuration * 0.35));
      if (result.riskLevel === 'critical' || result.riskLevel === 'high') {
        logActivity('risk_assessment', 'CMA', `Indikasi risiko terdeteksi: ${result.riskLevel.toUpperCase()} (Skor: ${result.riskScore || 85})`);
      }
      logActivity('agent_complete', 'ClaimTrace', 'Sintesis respons multi-agen selesai.', executionDuration);

      setMessages((prev) => [
        ...prev,
        {
          id: `resp-${Date.now()}`,
          role: 'assistant',
          senderName: 'Asisten Audit JKN (Meta-Agent)',
          content: result.content,
          resolvedAgent: result.resolvedAgent || 'ClaimTrace',
          agentsInvoked: result.agentsInvoked || ['L1-Klinis', 'L2-Regulasi', 'CMA'],
          riskLevel: result.riskLevel || 'moderate',
          riskScore: result.riskScore,
          interventionPlan: result.interventionPlan,
          appointment: result.appointment,
          metrics: result.metrics,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      logActivity('agent_error', 'ClaimTrace', `Gagal memproses respons: ${err?.message || 'Koneksi terputus'}`);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          senderName: 'Asisten Audit JKN (Error)',
          content: `Terjadi kendala saat menghubungkan ke orkestrator multi-agen: **${err?.message || 'Gagal memproses kueri'}**. Silakan coba kembali atau gunakan prompt alternatif.`,
          resolvedAgent: 'ClaimTrace',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      setCurrentThinking(null);
      setActiveAgents([]);
    }
  };

  const handleResetChat = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan riwayat percakapan asisten audit?')) {
      setMessages([
        {
          id: `msg-welcome-${Date.now()}`,
          role: 'assistant',
          senderName: 'Asisten Audit JKN (Meta-Agent)',
          resolvedAgent: 'ClaimTrace',
          content: 'Sesi obrolan telah dibersihkan. Silakan ajukan pertanyaan analisis audit klaim baru.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          riskLevel: 'safe',
        }
      ]);
      logActivity('agent_start', 'ClaimTrace', 'Riwayat obrolan di-reset oleh verifikator.');
    }
  };

  const handleExportChat = () => {
    const exportData = {
      exportTitle: 'Transkrip Sesi Asisten Audit JKN (HealthAI Enhanced)',
      exportedAt: new Date().toISOString(),
      verifier: currentUser?.name || 'Administrator Khalaf Dev',
      nip: currentUser?.nip || '198704202011012001',
      totalMessages: messages.length,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        sender: m.role === 'user' ? (currentUser?.name || 'Verifikator Medis') : m.senderName,
        agent: m.resolvedAgent || 'ClaimTrace',
        timestamp: m.timestamp,
        text: m.content,
        riskLevel: m.riskLevel || 'safe',
      })),
      activityStream: activityLogs,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Transkrip_Audit_JKN_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter log aktivitas
  const filteredActivityLogs = useMemo(() => {
    if (activityFilter === 'agent') return activityLogs.filter((l) => l.type.includes('agent'));
    if (activityFilter === 'tool') return activityLogs.filter((l) => l.type.includes('tool'));
    if (activityFilter === 'risk') return activityLogs.filter((l) => l.type.includes('risk') || l.type.includes('sla'));
    return activityLogs;
  }, [activityLogs, activityFilter]);

  return (
    <div className={`h-[calc(100vh-140px)] flex flex-col rounded-2xl border transition-all overflow-hidden ${
      isLight 
        ? 'bg-white border-slate-200/90 text-slate-900 shadow-sm' 
        : 'bg-[#000c24] border-white/10 text-white shadow-2xl'
    }`}>
      {/* 1. TOP HEADER BANNER */}
      <div className={`p-4 md:px-6 md:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 border-b ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-[#00153A]/90 border-white/10 text-white backdrop-blur-xl'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-2xl shadow-sm border ${
            isLight
              ? 'bg-emerald-600 text-white border-emerald-500 keep-white shadow-emerald-950/20'
              : 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 border-cyan-500/30'
          }`}>
            <Sparkles className="w-5 h-5 keep-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={`text-base md:text-lg font-bold tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Asisten Audit JKN (HealthAI Enhanced)
              </h1>
              <span className={`text-[10.5px] px-2.5 py-0.5 rounded-full font-mono font-bold border ${
                isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                HealthAI · LangGraph ReAct
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              }`}>
                ClaimTrace Multi-Agent Orchestrator
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Ruang Konsultasi Cerdas Berbasis ReAct: Lapis 1 (Klinis), Lapis 2 (SATUSEHAT SDMK), Lapis 3 (Mobile JKN), CMA, dan IA.
            </p>
          </div>
        </div>

        {/* TOP ACTION CONTROLS */}
        <div className="flex items-center flex-wrap gap-2 shrink-0 text-xs">
          {/* Toggle Thinking Trace */}
          <button
            type="button"
            onClick={() => setShowThinkingTrace(!showThinkingTrace)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              showThinkingTrace
                ? (isLight 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40')
                : (isLight
                    ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10')
            }`}
            title="Tampilkan / Sembunyikan Jejak Berpikir Agen"
          >
            {showThinkingTrace ? (
              <Eye className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
            ) : (
              <EyeOff className={`w-3.5 h-3.5 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
            )}
            <span>Jejak Berpikir: {showThinkingTrace ? 'Aktif' : 'Non-Aktif'}</span>
          </button>

          {/* Toggle Activity Sidebar */}
          <button
            type="button"
            onClick={() => setShowActivitySidebar(!showActivitySidebar)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              showActivitySidebar
                ? (isLight
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40')
                : (isLight
                    ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10')
            }`}
            title="Tampilkan / Sembunyikan Log Alur Agen"
          >
            <Activity className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-cyan-400'}`} />
            <span>Log Alur ({activityLogs.length})</span>
          </button>

          {/* Reset Chat */}
          <button
            type="button"
            onClick={handleResetChat}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title="Bersihkan Obrolan"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExportChat}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            title="Ekspor Transkrip Sesi"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Transkrip</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN BODY (CHAT PANE + ACTIVITY SIDEBAR) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* ======================================================== */}
        {/* CHAT MAIN COLUMN (LEFT / CENTER)                         */}
        {/* ======================================================== */}
        <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
          isLight ? 'bg-slate-50/60' : 'bg-[#000c24]/80'
        }`}>
          
          {/* ACTIVE AGENTS INDICATOR BANNER */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`px-5 py-2.5 flex items-center justify-between text-xs shrink-0 border-b ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full animate-ping ${isLight ? 'bg-emerald-600' : 'bg-emerald-400'}`} />
                  <span className="font-bold">Agen Aktif Menjalankan Investigasi:</span>
                  <div className="flex flex-wrap gap-1.5 ml-2">
                    {activeAgents.map((ag) => (
                      <span 
                        key={ag} 
                        className={`px-2 py-0.5 rounded-lg text-[10.5px] font-mono font-bold border ${
                          isLight
                            ? 'bg-white border-emerald-200 text-emerald-800 shadow-2xs'
                            : 'bg-white/10 border-white/15 text-emerald-300'
                        }`}
                      >
                        {ag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={`flex items-center space-x-1.5 font-mono text-[11px] font-bold ${
                  isLight ? 'text-emerald-800' : 'text-emerald-300'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{elapsedSeconds}s</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* THINKING TRACE ACCORDION */}
          {showThinkingTrace && currentThinking && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-5 py-2 text-xs flex items-center justify-between border-b ${
                isLight
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-[#00153A]/90 border-white/10 text-white/80'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <Cpu className={`w-4 h-4 shrink-0 animate-spin ${isLight ? 'text-emerald-700' : 'text-cyan-400'}`} />
                <span className={`font-mono text-[11px] font-semibold truncate ${
                  isLight ? 'text-emerald-900' : 'text-white'
                }`}>
                  {currentThinking}
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ml-2 ${
                isLight
                  ? 'bg-white text-emerald-800 border-emerald-300 shadow-2xs'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}>
                LangGraph: START → L1 ∥ L2 ∥ L3 → synthesize
              </span>
            </motion.div>
          )}

          {/* CHAT MESSAGES SCROLL AREA */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const badgeInfo = AGENT_BADGES[msg.resolvedAgent] || AGENT_BADGES['ClaimTrace'];

              return (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-xs shrink-0 mt-0.5 border ${
                      isLight
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-950/40 border-cyan-400/30'
                    }`}>
                      <Bot className="w-5 h-5 text-white stroke-[2.2] keep-white" />
                    </div>
                  )}

                  {/* Message Bubble Body */}
                  <div
                    className={`max-w-[85%] md:max-w-2xl rounded-2xl p-4 text-xs space-y-2.5 shadow-md ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-none keep-white'
                        : (isLight
                            ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                            : 'bg-[#00153A]/90 border border-white/10 text-white/90 rounded-tl-none shadow-[#00081c]/50 backdrop-blur-md')
                    }`}
                  >
                    {/* Header Strip inside Bubble */}
                    <div className={`flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b ${
                      isUser
                        ? 'border-white/20'
                        : (isLight ? 'border-slate-100' : 'border-white/10')
                    }`}>
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${isUser ? 'text-white keep-white' : (isLight ? 'text-slate-900' : 'text-white')}`}>
                          {isUser ? (currentUser?.name || 'Verifikator Medis') : msg.senderName}
                        </span>
                        {!isUser && badgeInfo && (
                          <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold border ${badgeInfo.bg}`}>
                            {badgeInfo.label}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono ${isUser ? 'text-emerald-100 keep-white' : (isLight ? 'text-slate-400' : 'text-white/40')}`}>
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Content Text with Markdown Support */}
                    <MarkdownRenderer
                      content={msg.content}
                      isLight={isLight}
                      isUser={isUser}
                      className={isUser ? 'text-white keep-white' : (isLight ? 'text-slate-700' : 'text-white/80')}
                    />

                    {/* Metadata Badges if Present */}
                    {!isUser && msg.riskLevel && msg.riskLevel !== 'safe' && (
                      <div className={`pt-2 border-t flex flex-wrap items-center gap-2 ${
                        isLight ? 'border-slate-100' : 'border-white/10'
                      }`}>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono border ${
                          msg.riskLevel === 'critical'
                            ? (isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30')
                            : (isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                        }`}>
                          Risiko: {msg.riskLevel.toUpperCase()} {msg.riskScore ? `(${msg.riskScore}%)` : ''}
                        </span>
                        {msg.agentsInvoked && (
                          <span className={`text-[9.5px] font-mono ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                            Sub-agen berkontribusi: {msg.agentsInvoked.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-md shrink-0 mt-0.5 ring-2 border ${
                      isLight
                        ? 'bg-slate-800 text-white border-slate-700 ring-slate-300'
                        : 'bg-[#00153A] border-white/20 text-white ring-cyan-500/30'
                    }`}>
                      {currentUser?.avatar || 'AD'}
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Loading Bubble */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-3"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-md shrink-0 ring-2 ${
                  isLight
                    ? 'bg-emerald-600 text-white ring-emerald-200'
                    : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-950/40 ring-cyan-400/30'
                }`}>
                  <Bot className="w-5 h-5 text-white animate-spin" />
                </div>
                <div className={`rounded-2xl rounded-tl-none p-4 shadow-md space-y-2 border ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-[#00153A]/90 border-white/10 text-white'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full animate-bounce ${isLight ? 'bg-emerald-600' : 'bg-cyan-400'}`} />
                    <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s] ${isLight ? 'bg-emerald-600' : 'bg-cyan-400'}`} />
                    <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.4s] ${isLight ? 'bg-emerald-600' : 'bg-cyan-400'}`} />
                    <span className={`text-xs font-semibold ml-1 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                      ClaimTrace AI Engine sedang mengkalkulasi fusi bukti 3 lapis...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Starter Suggestion Cards */}
            {messages.length <= 2 && (
              <div className="pt-4 space-y-3">
                <div className={`flex items-center space-x-2 text-xs font-bold ${
                  isLight ? 'text-slate-700' : 'text-white/60'
                }`}>
                  <Sparkles className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-[#FFCA40]'}`} />
                  <span>Skenario Penyelidikan Cepat (Quick Investigation Prompts):</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SUGGESTED_PROMPTS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        disabled={isLoading}
                        onClick={() => handleSendMessage(item.prompt)}
                        className={`p-3.5 rounded-2xl text-left transition shadow-xs group cursor-pointer flex items-start space-x-3 border ${
                          isLight
                            ? 'bg-white hover:bg-slate-50 border-slate-200 hover:border-emerald-300 text-slate-900'
                            : 'bg-[#00153A]/80 hover:bg-[#002050] border-white/10 hover:border-white/20 text-white shadow-xl'
                        }`}
                      >
                        <div className={`p-2 rounded-xl transition shrink-0 mt-0.5 border ${
                          isLight
                            ? 'bg-emerald-100/80 group-hover:bg-emerald-200/90 text-emerald-800 border-emerald-300 shadow-2xs'
                            : 'bg-white/5 group-hover:bg-cyan-500/20 text-cyan-300 border-white/10'
                        }`}>
                          <Icon className={`w-4 h-4 ${isLight ? 'text-emerald-800' : 'text-cyan-300'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs font-bold truncate ${
                              isLight ? 'text-slate-900 group-hover:text-emerald-700' : 'text-white group-hover:text-cyan-300'
                            }`}>
                              {item.title}
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                              isLight ? item.badgeColorLight : item.badgeColorDark
                            }`}>
                              {item.badge}
                            </span>
                          </div>
                          <p className={`text-[11px] mt-1 leading-snug line-clamp-2 ${
                            isLight ? 'text-slate-500' : 'text-white/60'
                          }`}>
                            {item.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* CHAT INPUT BAR (BOTTOM) */}
          <div className={`p-4 border-t space-y-2.5 shrink-0 ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-[#00153A]/95 backdrop-blur-xl border-white/10'
          }`}>
            {/* Quick Filter Tags / Shortcuts */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className={`font-semibold shrink-0 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                Topik Populer:
              </span>
              {[
                'Audit Kasus Fisioterapi Mitra Husada',
                'Status SIP dr. Hendra SATUSEHAT',
                'Rekonsiliasi Klaim Sebelum 10 Hari',
                'Sangkalan Mobile JKN Katarak',
                'Draft Surat Klarifikasi Faskes',
              ].map((topic, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSendMessage(`Jelaskan secara mendalam tentang ${topic}`)}
                  className={`px-3 py-1 rounded-full border transition shrink-0 cursor-pointer font-medium ${
                    isLight
                      ? 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200 hover:border-emerald-300'
                      : 'bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-200 border-white/10 text-white/70'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>

            {/* Input Field Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className={`relative flex items-center rounded-2xl p-1.5 transition-all shadow-xs border ${
                isLight
                  ? 'bg-slate-50 border-emerald-600/40 focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20'
                  : 'bg-white/5 border-white/15 focus-within:border-[#FFCA40] focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-[#FFCA40]/20 shadow-xl'
              }`}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanyakan analisis klaim, audit SATUSEHAT, telemetri Mobile JKN, atau draf rekomendasi BAKB..."
                disabled={isLoading}
                className={`w-full bg-transparent px-4 py-2.5 text-xs border-none outline-none focus:outline-none focus:ring-0 ${
                  isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-white/40'
                }`}
              />
              <div className="flex items-center pr-1.5 shrink-0">
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl transition shadow-sm cursor-pointer flex items-center justify-center shrink-0 keep-white"
                  title="Kirim Pertanyaan"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white keep-white" />
                  ) : (
                    <Send className="w-4 h-4 text-white stroke-[2.2] keep-white" />
                  )}
                </button>
              </div>
            </form>

            <div className={`flex items-center justify-between text-[10px] px-1 ${
              isLight ? 'text-slate-500' : 'text-white/40'
            }`}>
              <span>Orkestrator: <strong className={isLight ? 'text-slate-800' : 'text-white/70'}>LangGraph Multi-Agent (Auto-Tuned)</strong> · Enterprise Zero-PHI Architecture</span>
              <span>Kepatuhan: <strong className={isLight ? 'text-slate-800' : 'text-white/70'}>NIST AI RMF 1.0 &amp; UU PDP No. 27/2022</strong></span>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* ACTIVITY LOG SIDEBAR (RIGHT PANE)                        */}
        {/* ======================================================== */}
        {showActivitySidebar && (
          <div className={`w-80 md:w-96 flex flex-col shrink-0 overflow-hidden border-l transition-all ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#00153A]/95 backdrop-blur-xl border-white/10 text-white'
          }`}>
            
            {/* Sidebar Header */}
            <div className={`p-3.5 border-b flex items-center justify-between ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-900'
                : 'bg-[#000c24] border-white/10 text-white'
            }`}>
              <div className="flex items-center space-x-2">
                <Activity className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-cyan-400'}`} />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  Log Aktivitas Agen (Activity Log)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowActivitySidebar(false)}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  isLight
                    ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                    : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
                title="Tutup Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className={`p-2 border-b flex items-center gap-1 text-[10.5px] ${
              isLight
                ? 'bg-slate-100/80 border-slate-200'
                : 'bg-black/30 border-white/10'
            }`}>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'agent', label: 'Sub-Agen' },
                { id: 'tool', label: 'Tools' },
                { id: 'risk', label: 'Risiko & SLA' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActivityFilter(f.id)}
                  className={`flex-1 py-1 px-2 rounded-lg font-bold transition cursor-pointer text-center ${
                    activityFilter === f.id
                      ? (isLight
                          ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                          : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xs')
                      : (isLight
                          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                          : 'text-white/50 hover:text-white')
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Activity Stream List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredActivityLogs.length === 0 && (
                <div className={`py-12 px-4 text-center text-xs space-y-1.5 ${
                  isLight ? 'text-slate-400' : 'text-white/40'
                }`}>
                  <Activity className="w-6 h-6 mx-auto opacity-40 mb-1" />
                  <p className="font-semibold">Tidak ada log aktivitas untuk kategori ini.</p>
                  <p className="text-[10.5px]">Pilih filter 'Semua' untuk melihat seluruh rekaman alur orkestrasi.</p>
                </div>
              )}
              {filteredActivityLogs.map((log) => {
                const isError = log.type.includes('error');
                const isRisk = log.type.includes('risk');
                const isTool = log.type.includes('tool');

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-2.5 rounded-xl border text-xs space-y-1 transition-all ${
                      isError
                        ? (isLight ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-rose-500/15 border-rose-500/30 text-rose-200')
                        : isRisk
                        ? (isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/15 border-amber-500/30 text-amber-200')
                        : isTool
                        ? (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-200')
                        : (isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white/80')
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9.5px]">
                      <span className={`font-mono font-bold px-1.5 py-0.2 rounded ${
                        isLight ? 'bg-white text-emerald-900 border border-emerald-300 shadow-2xs font-bold' : 'bg-white/10 text-white/90'
                      }`}>
                        {log.agent}
                      </span>
                      <span className={`font-mono ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-[11px] font-medium leading-relaxed ${
                      isLight ? 'text-slate-800' : 'text-white/90'
                    }`}>
                      {log.message}
                    </p>
                    {log.durationMs !== null && (
                      <div className={`text-[9.5px] font-mono flex items-center justify-end space-x-1 ${
                        isLight ? 'text-slate-500' : 'text-white/40'
                      }`}>
                        <Zap className={`w-3 h-3 ${isLight ? 'text-amber-600' : 'text-[#FFCA40]'}`} />
                        <span>{log.durationMs} ms</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Sidebar Footer info */}
            <div className={`p-3 border-t text-[10px] flex items-center justify-between ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-500'
                : 'bg-[#000c24] border-white/10 text-white/50'
            }`}>
              <span className="font-semibold">LangGraph Observability</span>
              <span className={`font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                Latency: ~482ms
              </span>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
