import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Shield,
  Key,
  Clock,
  Database,
  Terminal,
  Cpu,
  Layers,
  ShieldCheck,
  Check,
  X,
  Copy,
  Zap,
  Server,
  Plus,
  Send,
  GitBranch,
  Activity,
  Sliders,
  Sparkles,
  ExternalLink,
  FileText,
  CheckCircle,
  Save,
  TrendingUp,
  Info,
  ShieldAlert,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import {
  getAiTelemetryState,
  setActiveClaimTraceModel,
  updateAutopilotPolicyState,
  reviewAutopilotDecision,
  callClaimTraceGenerateContent,
  CLAIMTRACE_MODEL_CHAIN,
} from '../../services/claimtraceOrchestratorService';

/**
 * AgentCopilot:
 * 1. `frontend/src/app/admin/(protected)/langgraph/page.tsx` (LangGraph Observability, Topology & Execution Trace Grid)
 * 2. `frontend/src/app/admin/(protected)/api-keys/page.tsx` (ClaimTrace AI Model Routing & Live Sandbox)
 * 3. `frontend/src/app/admin/(protected)/autopilot/page.tsx` & `agent-decisions/page.tsx` (Autopilot Policy & Agent Decisions)
 * 4. ReAct Forensic Trajectory & Human-in-the-Loop (HITL) Verification
 *
 * Strictly in Light Theme (Tema Terang) and 100% adapted to ClaimTrace JKN / BPJS Kesehatan.
 */

const DEFAULT_AGENT_DATA = {
  trace_id: 'tr-2026-jkn-clm202610085-4e30',
  claim_id: 'CLM-2026-10-085',
  faskes_name: 'RS Khusus Mitra Husada',
  evaluation_metrics: {
    total_latency_ms: 482,
    total_tokens_used: 2355,
    estimated_cost_usd: '0.00042',
    faithfulness_score: 0.998,
    step_count: 6,
    max_steps_guardian: 8,
    nist_ai_rmf: 'MEASURE-2.6 (Faithfulness 0.998)',
    mitre_atlas: 'AML.T0043 / AML.T0047 (Guardrails Active)',
    mitre_f3: 'FA0001 (Positioning) / FA0002 (Monetization)',
  },
  legal_citations: [
    'Pasal 76 ayat 2 Perpres No. 82/2018 (Batas Waktu Verifikasi Klaim 10 Hari Kerja)',
    'Permenkes No. 14/2021 (Standar Beban Kerja Fisioterapis Maksimal 40 Pasien/Hari)',
    'UU PDP No. 27/2022 Pasal 34 (Validasi Telemetri Presensi Pasien Mandiri Zero-PHI)',
    'MITRE Fight Fraud Framework (F3 v1.1) FA0001 (Positioning) & FA0002.F1018 (Monetization)',
    'MITRE ATT&CK v19.1 T1078 (Valid Accounts) & NIST AI RMF 1.0 (Faithfulness & Guardrails)',
  ],
  human_action_required: true,
  steps: [
    {
      step_number: 1,
      thought:
        'Memulai penapisan pra-bayar berkas klaim pada basis data historis DuckDB OLAP untuk mendeteksi anomali volume pasca-kegiatan massal.',
      tool_call: { tool_name: 'query_duckdb_claims' },
      observation: {
        total_claims_queried: 85,
        cluster_surge_ratio: 8.5,
        primary_icd10: 'M62.8 (Other specified disorders of muscle)',
        primary_icd9cm: '93.39 (Other physical therapy)',
        baseline_daily_average: 10.0,
        anomalous_burst_detected: true,
        finding:
          'Lonjakan penagihan fisioterapi massal 8.5x dari rata-rata harian faskes tanpa izin baksos.',
      },
      tokens_used: 320,
      duration_ms: 62,
    },
    {
      step_number: 2,
      thought:
        'Validasi identitas dan legalitas SIP dokter penanggung jawab pelayanan (dr. Hendra, Sp.KFR) ke registri SATUSEHAT SDMK Kemenkes.',
      tool_call: { tool_name: 'query_satusehat_sdmk' },
      observation: {
        dpjp_name: 'dr. Hendra, Sp.KFR',
        sip_status: 'EXPIRED_MUTASI',
        compliance_violation: true,
        finding:
          'SIP DPJP telah kedaluwarsa pada 10 Okt 2026 (2 hari sebelum tanggal pelayanan).',
      },
      tokens_used: 410,
      duration_ms: 84,
    },
    {
      step_number: 3,
      thought:
        'Melakukan konfirmasi presensi langsung out-of-band ke peserta terkait via Mobile JKN Lapis 3 (STA Background Task).',
      tool_call: { tool_name: 'send_mobile_jkn_telemetry' },
      observation: {
        fcm_status: 'DELIVERED',
        verified_participants: 10,
        denial_rate_pct: 80,
        finding:
          '8 dari 10 peserta terdaftar menyangkal pernah hadir menerima layanan fisioterapi.',
      },
      tokens_used: 385,
      duration_ms: 95,
    },
    {
      step_number: 4,
      thought:
        'Hasil telemetri Mobile JKN mengonfirmasi 80% peserta menyangkal hadir. Menghubungkan temuan ke korpus regulasi JKN.',
      tool_call: { tool_name: 'rag_search_regulations' },
      observation: {
        citations: ['Perpres 82/2018 Pasal 76', 'Permenkes 14/2021', 'Permenkes 26/2021'],
        finding: 'Bukti kuat pemenuhan unsur sengketa pra-bayar dan indikasi Phantom Billing.',
      },
      tokens_used: 510,
      duration_ms: 110,
    },
    {
      step_number: 5,
      thought:
        'Mengompilasi bukti fusi 3 lapis melalui node Synthesize menjadi rekomendasi tindak lanjut verifikator medis.',
      tool_call: { tool_name: 'compile_investigation_brief' },
      observation: {
        action_recommendation: 'TUNDA_BAYAR_BAKB',
        anomaly_score: 94.0,
      },
      tokens_used: 430,
      duration_ms: 78,
    },
    {
      step_number: 6,
      thought:
        'Rekomendasi Jalur Merah (Tunda Bayar BAKB) siap diajukan untuk otorisasi Verifikator Medis (Human-in-the-Loop).',
      tool_call: null,
      status: 'awaiting_approval',
      tokens_used: 300,
      duration_ms: 53,
    },
  ],
};

const TOPOLOGY_NODES = [
  {
    id: 'verifikator_input',
    label: 'VERIFIKATOR / SEP INPUT',
    role: 'ENTRY POINT',
    status: 'healthy',
    successRate: '100.0',
    description:
      'Menerima pengajuan berkas klaim SEP FKRTL, kueri Verifikator Medis, atau sinyal presensi peserta Mobile JKN.',
  },
  {
    id: 'claimtrace_ai',
    label: 'CLAIMTRACE_AI (ORCHESTRATOR)',
    role: 'DECISION NODE (CLAIMTRACE AI)',
    status: 'healthy',
    successRate: '99.4',
    description:
      'Node keputusan pertama (diadaptasi dari health_ai_decision_node). Mengklasifikasikan intensi, menghitung risiko awal, dan merutekan ke sub-agen spesialis.',
  },
  {
    id: 'tca',
    label: 'TCA (AUDIT PNPK & REGULASI)',
    role: 'MODERATE RISK ROUTE',
    status: 'healthy',
    successRate: '98.8',
    description:
      'Memeriksa kesesuaian koding INA-CBG, ICD-10, ICD-9-CM, Fornas, dan status aktif SIP DPJP pada registri SATUSEHAT.',
  },
  {
    id: 'parallel_crisis',
    label: 'PARALLEL CRISIS (L1 ∥ CMA)',
    role: 'CRITICAL FRAUD FAN-OUT (asyncio.gather)',
    status: 'healthy',
    successRate: '99.1',
    description:
      'Eksekusi paralel berkecepatan tinggi saat terdeteksi indikasi Phantom Billing / Upcoding Kritis: menyusun bukti klinis Lapis 1 sekaligus mengeskalasi berkas via CMA.',
  },
  {
    id: 'ia',
    label: 'IA (ANALITIK WAWASAN & PRIVASI)',
    role: 'ANALYTICS & UU PDP ROUTE',
    status: 'healthy',
    successRate: '99.7',
    description:
      'Menjalankan kueri analitik agregat berpelindung privasi (k-anonymity k ≥ 5, differential privacy ε = 0.5 sesuai UU PDP No. 27/2022).',
  },
  {
    id: 'synthesize',
    label: 'SYNTHESIZE FINAL RESPONSE',
    role: 'CONVERGENCE NODE',
    status: 'healthy',
    successRate: '99.6',
    description:
      'Menggabungkan keluaran sub-agen menjadi rekomendasi verifikasi, draf BAKK/BAKB, dan segel audit kriptografis.',
  },
  {
    id: 'sta_bg',
    label: 'STA PROCESS (LAPIS 3 MOBILE JKN)',
    role: 'ASYNC BACKGROUND TASK',
    status: 'healthy',
    successRate: '99.2',
    description:
      'Tugas latar belakang asinkron (fire-and-forget) untuk menganalisis respons konfirmasi kehadiran peserta di aplikasi Mobile JKN.',
  },
];

/** SVG Donut Ring for API Key Success Rate (ported from api-keys/page.tsx) */
function SuccessRateRing({ rate, size = 36 }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(Math.max(rate, 0), 100);
  const color = fill >= 90 ? '#10b981' : fill >= 70 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="3.5"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeDasharray={`${(fill / 100) * circ} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

/** 3-Column Micro Bar Chart for Key Activity (Dual Theme Support) */
function ActivityMiniChart({ snapshot, isLight }) {
  const bars = [
    { label: 'Req/jam', value: snapshot.requests_last_hour, color: '#2563eb' },
    { label: 'Err/jam', value: snapshot.errors_last_hour, color: '#ef4444' },
    { label: 'Limit', value: snapshot.rate_limited_hits, color: '#f59e0b' },
  ];
  const maxVal = Math.max(...bars.map((b) => b.value), 1);
  const chartH = 28;

  return (
    <div className={`mb-3 rounded-xl px-3 py-2.5 border ${
      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#000c24]/70 border-white/10 text-white'
    }`}>
      <p className={`mb-1.5 text-[10px] font-bold uppercase tracking-wider ${
        isLight ? 'text-slate-500' : 'text-white/50'
      }`}>
        Aktivitas 1 Jam Terakhir
      </p>
      <div className="flex items-end gap-3">
        {bars.map((bar) => {
          const barH = Math.max((bar.value / maxVal) * chartH, 3);
          return (
            <div key={bar.label} className="flex flex-1 flex-col items-center gap-1">
              <span
                className="text-[11px] font-mono font-bold tabular-nums"
                style={{ color: bar.color }}
              >
                {bar.value}
              </span>
              <div
                className="w-full rounded-sm transition-all duration-500"
                style={{
                  height: `${barH}px`,
                  backgroundColor: bar.color,
                  opacity: 0.85,
                }}
              />
              <span className={`text-[9.5px] font-semibold ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{bar.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AgentCopilot({ 
  selectedClaimId = 'CLM-2026-10-085',
  onGoToCase,
  onGoToDecision,
  onGoToAudit,
  isLight: propIsLight
}) {
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

  // 5 Unified AI Modules
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const subtab = new URLSearchParams(window.location.search).get('subtab');
      if (['langgraph', 'autopilot', 'agent_decisions', 'trajectory'].includes(subtab)) {
        return subtab;
      }
    } catch {
      // ignore
    }
    return 'langgraph';
  }); // 'langgraph' | 'autopilot' | 'agent_decisions' | 'trajectory'

  // Shared live telemetry state
  const [telemetry, setTelemetry] = useState(() => getAiTelemetryState());

  // Autopilot Actions vs Policy Sub-tabs (from autopilot/page.tsx)
  const [autopilotSubTab, setAutopilotSubTab] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('autopilot_tab');
      if (['actions', 'policy'].includes(p)) return p;
    } catch {
      // ignore
    }
    return 'actions';
  }); // 'actions' | 'policy'
  const [autopilotFilter, setAutopilotFilter] = useState('awaiting_approval'); // 'awaiting_approval' | 'all' | 'in_progress' | 'completed' | 'failed'
  const [policyForm, setPolicyForm] = useState(() => ({
    autopilot_enabled: true,
    onchain_placeholder: true,
    worker_interval_seconds: 15,
  }));
  const [policySavedFeedback, setPolicySavedFeedback] = useState(false);
  const [noteDialog, setNoteDialog] = useState({
    isOpen: false,
    type: null,
    actionId: null,
    title: '',
    message: '',
    inputLabel: '',
    inputPlaceholder: '',
    confirmLabel: '',
    note: '',
    errorMessage: '',
  });

  // Auto-dismiss pesan error dialog setelah 3.5 detik
  useEffect(() => {
    if (!noteDialog.errorMessage) return;
    const timer = setTimeout(() => {
      setNoteDialog((prev) => ({ ...prev, errorMessage: '' }));
    }, 3500);
    return () => clearTimeout(timer);
  }, [noteDialog.errorMessage]);

  // LangGraph Observability state (from langgraph/page.tsx)
  const [analyticsDays, setAnalyticsDays] = useState(7);
  const [selectedNodeId, setSelectedNodeId] = useState('claimtrace_ai');
  const [traceStatusFilter, setTraceStatusFilter] = useState('');
  const [traceAgentFilter, setTraceAgentFilter] = useState('');
  const [liveTraceLoading, setLiveTraceLoading] = useState(false);

  // ReAct Trajectory state
  const [agentData] = useState(DEFAULT_AGENT_DATA);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [liveAiSynthesis, setLiveAiSynthesis] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState('pending');
  const [verifierNotes, setVerifierNotes] = useState(
    'Disetujui penundaan penandatanganan BAKB berdasarkan pembuktian fusi 3 lapis: SIP DPJP kedaluwarsa di SATUSEHAT dan 80% sangkalan peserta di Mobile JKN.'
  );

  useEffect(() => {
    const onUpdate = () => setTelemetry(getAiTelemetryState());
    window.addEventListener('claimtrace-ai-telemetry-updated', onUpdate);
    return () => window.removeEventListener('claimtrace-ai-telemetry-updated', onUpdate);
  }, []);

  // Computed LangGraph Financial & Token metrics (from AnalyticsOverview.tsx)
  const langGraphStats = useMemo(() => {
    const execs = telemetry.langgraph_executions || [];
    const totalPrompt = execs.reduce((acc, e) => acc + (e.tokens?.prompt || 0), 0);
    const totalComp = execs.reduce((acc, e) => acc + (e.tokens?.completion || 0), 0);
    const totalTokens = totalPrompt + totalComp;
    const failedCount = execs.filter((e) => e.status === 'failed').length;
    const errorRate = execs.length > 0 ? (failedCount / execs.length) * 100 : 0;

    return {
      totalTokensK: ((totalTokens + 48200) / 1000).toFixed(1),
      promptTokensK: ((totalPrompt + 29400) / 1000).toFixed(1),
      compTokensK: ((totalComp + 18800) / 1000).toFixed(1),
      errorRate: errorRate.toFixed(2),
      topCostNode: 'TCA (Audit PNPK L2)',
      totalRuns: execs.length + 210,
    };
  }, [telemetry]);

  const filteredExecutions = useMemo(() => {
    return (telemetry.langgraph_executions || []).filter((exec) => {
      if (traceStatusFilter && exec.status !== traceStatusFilter) return false;
      if (traceAgentFilter && exec.graph_name !== traceAgentFilter) return false;
      return true;
    });
  }, [telemetry, traceStatusFilter, traceAgentFilter]);

  const selectedNodeObj = useMemo(
    () => TOPOLOGY_NODES.find((n) => n.id === selectedNodeId) || TOPOLOGY_NODES[1],
    [selectedNodeId]
  );

  // Run live ClaimTrace AI trigger for trace recording
  const handleTriggerLiveAuditTrace = async () => {
    if (liveTraceLoading) return;
    setLiveTraceLoading(true);
    await callClaimTraceGenerateContent({
      prompt: 'Evaluasi kepatuhan koding INA-CBG dan integritas presensi Mobile JKN untuk antrean klaim terkini.',
      systemInstruction:
        'Anda adalah Auditor Medis Senior & Orkestrator AI ClaimTrace JKN BPJS Kesehatan. Berikan analisis tajam, terstruktur, dan mengacu pada regulasi JKN (Perpres 82/2018, Permenkes 26/2021, PNPK, dan UU PDP No. 27/2022).',
      preferredModel: telemetry.active_model,
      graphName: 'claimtrace_ai',
      nodePath: 'START → claimtrace_decision → execute_tca_pnpk → synthesize → END',
    });
    setTelemetry(getAiTelemetryState());
    setLiveTraceLoading(false);
  };

  const handleRunLiveReActSynthesis = async () => {
    setIsRunningAudit(true);
    const res = await callClaimTraceGenerateContent({
      prompt: `Berikan kesimpulan eksekutif audit forensik (3-4 kalimat) untuk berkas klaim ${selectedClaimId} di RS Khusus Mitra Husada dengan temuan: (1) Lonjakan 85 klaim fisioterapi ICD-10 M62.8 (8.5x rata-rata harian), (2) SIP DPJP dr. Hendra Sp.KFR kedaluwarsa di SATUSEHAT, (3) 80% peserta menyangkal kehadiran di Mobile JKN Lapis 3. Sebutkan rekomendasi tindak lanjut BAKB dan dasar hukumnya.`,
      preferredModel: telemetry.active_model,
      graphName: 'tca',
      nodePath: 'START → claimtrace_decision → parallel_crisis (L1∥CMA) → synthesize → END',
    });
    setLiveAiSynthesis(res);
    setTelemetry(getAiTelemetryState());
    setIsRunningAudit(false);
  };

  return (
    <div className={`space-y-6 pb-10 font-inter ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* Top Header & Navigation Bar */}
      <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-4 ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-sm text-slate-900'
          : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
      }`}>
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
            isLight
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs'
              : 'bg-[#FFCA40]/10 border-[#FFCA40]/30 text-[#FFCA40] shadow-lg shadow-[#FFCA40]/10'
          }`}>
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Pusat Orkestrator Multi-Agen AI &amp; Observabilitas LangGraph JKN
              </h1>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 font-mono ${
                isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLight ? 'bg-emerald-600' : 'bg-emerald-400'}`} />
                SYS:HEALTHY · {telemetry.active_model}
              </span>
            </div>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Arsitektur Multi-Agen Forensik Klaim BPJS Kesehatan: Observabilitas LangGraph StateGraph, Manajemen Model Inferensi ClaimTrace AI, Kebijakan Autopilot Otonom, dan ReAct Loop Forensik
            </p>
          </div>
        </div>

        {/* 4 Operational Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('langgraph')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'langgraph'
                ? (isLight ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-bold' : 'bg-[#FFCA40] text-[#000c24] border-[#FFCA40] shadow-lg shadow-[#FFCA40]/20')
                : (isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300 font-bold' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white')
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            LangGraph &amp; Topologi
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('autopilot')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'autopilot'
                ? (isLight ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-bold' : 'bg-[#FFCA40] text-[#000c24] border-[#FFCA40] shadow-lg shadow-[#FFCA40]/20')
                : (isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300 font-bold' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white')
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Autopilot Penapisan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agent_decisions')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'agent_decisions'
                ? (isLight ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-bold' : 'bg-[#FFCA40] text-[#000c24] border-[#FFCA40] shadow-lg shadow-[#FFCA40]/20')
                : (isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300 font-bold' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white')
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Keputusan &amp; Atestasi
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trajectory')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'trajectory'
                ? (isLight ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-bold' : 'bg-[#FFCA40] text-[#000c24] border-[#FFCA40] shadow-lg shadow-[#FFCA40]/20')
                : (isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300 font-bold' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white')
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Lintasan ReAct
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: LANGGRAPH OBSERVABILITY & TOPOLOGY (from langgraph/page.tsx)   */}
      {/* ===================================================================== */}
      {activeTab === 'langgraph' && (
        <div className="space-y-6">
          {/* Financial & Technical Telemetry Ribbon */}
          <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
            isLight
              ? 'bg-white border-slate-200/90 shadow-sm text-slate-900'
              : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b ${
              isLight ? 'border-slate-100' : 'border-white/10'
            }`}>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className={`text-sm font-bold uppercase tracking-wider font-mono ${
                    isLight ? 'text-emerald-800' : 'text-[#FFCA40]'
                  }`}>
                    LANGGRAPH OBSERVABILITY · TELEMETRI TEKNIS &amp; BIAYA TOKEN
                  </h2>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  }`}>
                    NIST AI RMF 1.0 · MITRE ATLAS · MITRE F3
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                  Pemantauan waktu-nyata seluruh StateGraph Multi-Agen ClaimTrace JKN (`claimtrace_ai`, `STA`, `TCA`, `CMA`, `IA`) dengan proteksi anti-prompt injection (AML.T0043) &amp; anti-evasion (AML.T0047).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`inline-flex rounded-xl border p-1 text-xs font-mono ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'border-white/10 bg-white/5'
                }`}>
                  {[7, 30, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setAnalyticsDays(days)}
                      className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                        analyticsDays === days
                          ? (isLight ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-[#FFCA40] text-[#000c24] shadow-xs')
                          : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white')
                      }`}
                    >
                      {days}H
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-mono">
              <div className={`relative overflow-hidden p-3.5 rounded-xl border transition-all ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isLight ? 'text-slate-500' : 'text-white/50'
                }`}>
                  Potensi Dana JKN Terlindungi
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-2xl font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    Rp 2,34 M
                  </span>
                  <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>/ {analyticsDays}h</span>
                </div>
              </div>

              <div className={`relative overflow-hidden p-3.5 rounded-xl border transition-all ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isLight ? 'text-slate-500' : 'text-white/50'
                }`}>
                  Throughput Audit Klinis
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-cyan-400'}`}>
                    1.699.219
                  </span>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Klaim DuckDB
                  </span>
                </div>
              </div>

              <div className={`relative overflow-hidden p-3.5 rounded-xl border transition-all ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isLight ? 'text-slate-500' : 'text-white/50'
                }`}>
                  Kepatuhan SLA Regulasi
                </span>
                <div className="mt-1">
                  <span className={`text-xl font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    99,4%
                  </span>
                  <span className={`text-[11px] ml-2 ${isLight ? 'text-slate-500 font-semibold' : 'text-white/50'}`}>Perpres 82/2018</span>
                </div>
              </div>

              <div className={`relative overflow-hidden p-3.5 rounded-xl border transition-all ${
                isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-white/5 border-white/10'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isLight ? 'text-amber-800' : 'text-white/50'
                }`}>
                  Pilar Deteksi Tertinggi
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    isLight
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'text-[#FFCA40] bg-[#FFCA40]/10 border-[#FFCA40]/30'
                  }`}>
                    {langGraphStats.topCostNode.replace('PMPK', 'PNPK')}
                  </span>
                  <span className={`text-xs font-bold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                    85 Berkas Kritis
                  </span>
                </div>
              </div>

              <div className={`relative overflow-hidden p-3.5 rounded-xl border transition-all ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isLight ? 'text-slate-500' : 'text-white/50'
                }`}>
                  Total Eksekusi Graf
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {langGraphStats.totalRuns}
                  </span>
                  <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>runs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid: Agentic Architecture Topology (Left) & Execution Trace Grid (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 6 Cols: Agentic Architecture Topology */}
            <div className={`lg:col-span-6 relative overflow-hidden rounded-2xl border p-5 transition-all flex flex-col space-y-4 ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-sm text-slate-900'
                : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${
                isLight ? 'border-slate-100' : 'border-white/10'
              }`}>
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    Topologi Arsitektur Multi-Agen (StateGraph)
                  </h3>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                    Klik pada node agen untuk melihat inspeksi rute dan metrik keberhasilan
                  </p>
                </div>
                <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
                  isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/5 text-white/70 border-white/10'
                }`}>
                  LangGraph v0.2
                </span>
              </div>

              {/* Visual Interactive Topology Diagram */}
              <div className={`relative border rounded-xl p-4 sm:p-5 font-mono space-y-3.5 transition-all ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#000c24]/90 border-white/10'
              }`}>
                {/* Legend */}
                <div className={`flex flex-wrap items-center gap-3 text-[10px] rounded-lg px-3 py-2 border ${
                  isLight ? 'bg-white border-slate-200 text-slate-700 shadow-2xs' : 'bg-white/5 border-white/10 text-white/70'
                }`}>
                  <span className={`font-bold uppercase ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Legenda Rute:</span>
                  <span className={`flex items-center gap-1.5 font-bold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                    <span className={`w-3 h-0.5 inline-block ${isLight ? 'bg-slate-500' : 'bg-white'}`} /> INPUT / OUTPUT
                  </span>
                  <span className={`flex items-center gap-1.5 font-bold ${isLight ? 'text-amber-800' : 'text-[#FFCA40]'}`}>
                    <span className={`w-3 h-0.5 inline-block ${isLight ? 'bg-amber-600' : 'bg-[#FFCA40]'}`} /> MODERATE (TCA)
                  </span>
                  <span className={`flex items-center gap-1.5 font-bold ${isLight ? 'text-rose-800' : 'text-rose-400'}`}>
                    <span className="w-3 h-0.5 bg-rose-500 inline-block" /> CRITICAL (L1 &amp; CMA)
                  </span>
                  <span className={`flex items-center gap-1.5 font-bold ${isLight ? 'text-purple-800' : 'text-purple-400'}`}>
                    <span className="w-3 h-0.5 bg-purple-500 inline-block" /> ANALYTICS (IA)
                  </span>
                </div>

                {/* Row 1: Entry Node */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId('verifikator_input')}
                    className={`px-5 py-2.5 rounded-xl border-2 text-center transition cursor-pointer ${
                      selectedNodeId === 'verifikator_input'
                        ? (isLight ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-[#FFCA40] text-[#000c24] border-[#FFCA40] shadow-lg shadow-[#FFCA40]/20')
                        : (isLight ? 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 shadow-2xs' : 'bg-white/5 text-white border-white/20 hover:border-white/40')
                    }`}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider">
                      VERIFIKATOR / BERKAS SEP
                    </div>
                    <div className={`text-[10px] ${isLight ? 'opacity-80 font-semibold' : 'opacity-75'}`}>INPUT STREAM</div>
                  </button>
                </div>

                <div className={`flex justify-center text-xs font-bold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>↓ INPUT</div>

                {/* Row 2: First Decision Node (CLAIMTRACE_AI) + Async STA */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('claimtrace_ai')}
                      className={`w-full p-3.5 rounded-xl border-2 text-left transition cursor-pointer ${
                        selectedNodeId === 'claimtrace_ai'
                          ? (isLight ? 'bg-emerald-100/90 border-emerald-600 ring-2 ring-emerald-400 shadow-sm' : 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-500/30')
                          : (isLight ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-400 shadow-2xs' : 'bg-emerald-950/40 border-emerald-500/30 hover:border-emerald-400')
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase ${
                          isLight ? 'text-emerald-950' : 'text-emerald-300'
                        }`}>
                          CLAIMTRACE_AI (ORCHESTRATOR)
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          SRATE: 99.4%
                        </span>
                      </div>
                      <div className={`text-[10px] mt-1 ${isLight ? 'text-emerald-800 font-medium' : 'text-white/60'}`}>
                        STATUS: HEALTHY · Model: {telemetry.active_model}
                      </div>
                    </button>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('sta_bg')}
                      className={`w-full p-3 rounded-xl border-2 border-dashed text-left transition cursor-pointer ${
                        selectedNodeId === 'sta_bg'
                          ? (isLight ? 'bg-sky-100/90 border-emerald-600 ring-2 ring-sky-400 shadow-sm' : 'bg-blue-500/20 border-blue-400')
                          : (isLight ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-400 shadow-2xs' : 'bg-blue-950/40 border-white/10 hover:border-blue-400')
                      }`}
                    >
                      <div className={`text-[11px] font-bold uppercase ${isLight ? 'text-sky-950' : 'text-white'}`}>
                        STA PROCESS
                      </div>
                      <div className={`text-[9.5px] font-bold ${isLight ? 'text-emerald-800' : 'text-blue-400'}`}>
                        ASYNC LAPIS 3
                      </div>
                      <div className={`text-[9px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        Presensi Mobile JKN
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 text-center text-[10px] font-bold">
                  <span className={isLight ? 'text-amber-800' : 'text-[#FFCA40]'}>↙ MODERATE</span>
                  <span className={isLight ? 'text-rose-800' : 'text-rose-400'}>↓ CRITICAL</span>
                  <span className={isLight ? 'text-purple-800' : 'text-purple-400'}>↘ ANALYTICS</span>
                </div>

                {/* Row 3: Specialist Sub-Agents (TCA, PARALLEL CRISIS, IA) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* TCA */}
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId('tca')}
                    className={`p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                      selectedNodeId === 'tca'
                        ? (isLight ? 'bg-amber-100/90 border-amber-600 ring-2 ring-amber-400 shadow-sm' : 'bg-[#FFCA40]/20 border-[#FFCA40] ring-2 ring-[#FFCA40]/30')
                        : (isLight ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400 shadow-2xs' : 'bg-[#FFCA40]/5 border-[#FFCA40]/30 hover:border-[#FFCA40]')
                    }`}
                  >
                    <div className={`text-xs font-bold uppercase ${isLight ? 'text-amber-950' : 'text-[#FFCA40]'}`}>
                      TCA (PNPK L2)
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-600 font-medium' : 'text-white/70'}`}>
                      Audit Koding &amp; SIP
                    </div>
                    <div className={`mt-2 pt-1.5 border-t flex justify-between text-[10px] font-bold ${
                      isLight ? 'border-amber-200 text-slate-800' : 'border-white/10 text-white/80'
                    }`}>
                      <span>SRATE</span>
                      <span className={isLight ? 'text-amber-800 font-bold' : 'text-[#FFCA40]'}>98.8%</span>
                    </div>
                  </button>

                  {/* Parallel Crisis (L1 || CMA) */}
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId('parallel_crisis')}
                    className={`p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                      selectedNodeId === 'parallel_crisis'
                        ? (isLight ? 'bg-rose-100/90 border-rose-600 ring-2 ring-rose-400 shadow-sm' : 'bg-rose-500/20 border-rose-400 ring-2 ring-rose-500/30')
                        : (isLight ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400 shadow-2xs' : 'bg-rose-950/40 border-rose-500/30 hover:border-rose-400')
                    }`}
                  >
                    <div className={`text-xs font-bold uppercase ${isLight ? 'text-rose-950' : 'text-rose-300'}`}>
                      PARALLEL CRISIS
                    </div>
                    <div className={`text-[9.5px] font-bold mb-1.5 ${isLight ? 'text-rose-800' : 'text-rose-400'}`}>
                      asyncio.gather
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-center text-[9.5px] font-bold">
                      <div className={`py-1 rounded border ${
                        isLight
                          ? 'bg-white border-rose-200 text-rose-800 shadow-2xs'
                          : 'border-[#FFCA40]/30 bg-[#FFCA40]/10 text-[#FFCA40]'
                      }`}>
                        L1 Klinis
                      </div>
                      <div className={`py-1 rounded border ${
                        isLight
                          ? 'bg-white border-rose-200 text-rose-800 shadow-2xs'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                      }`}>
                        CMA SLA
                      </div>
                    </div>
                  </button>

                  {/* IA */}
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId('ia')}
                    className={`p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                      selectedNodeId === 'ia'
                        ? (isLight ? 'bg-purple-100/90 border-purple-600 ring-2 ring-purple-400 shadow-sm' : 'bg-purple-500/20 border-purple-400 ring-2 ring-purple-500/30')
                        : (isLight ? 'bg-purple-50/70 border-purple-300 hover:border-purple-400 shadow-2xs' : 'bg-purple-950/40 border-purple-500/30 hover:border-purple-400')
                    }`}
                  >
                    <div className={`text-xs font-bold uppercase ${isLight ? 'text-purple-950' : 'text-purple-300'}`}>
                      IA (ANALYTICS)
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-600 font-medium' : 'text-white/70'}`}>
                      Privasi k≥5 · ε=0.5
                    </div>
                    <div className={`mt-2 pt-1.5 border-t flex justify-between text-[10px] font-bold ${
                      isLight ? 'border-purple-200 text-slate-800' : 'border-white/10 text-white/80'
                    }`}>
                      <span>SRATE</span>
                      <span className={isLight ? 'text-purple-800 font-bold' : 'text-purple-300'}>99.7%</span>
                    </div>
                  </button>
                </div>

                <div className={`flex justify-center text-xs font-bold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                  ↘ &nbsp;&nbsp;&nbsp; ↓ MERGE &nbsp;&nbsp;&nbsp; ↙
                </div>

                {/* Row 4: Synthesize -> END */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId('synthesize')}
                    className={`px-5 py-2.5 rounded-xl border-2 text-center transition cursor-pointer ${
                      selectedNodeId === 'synthesize'
                        ? (isLight ? 'bg-sky-100/90 border-emerald-600 ring-2 ring-sky-400 text-sky-950 shadow-sm' : 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-2 ring-cyan-500/30')
                        : (isLight ? 'bg-white border-slate-300 text-slate-800 hover:border-emerald-400 shadow-2xs' : 'bg-white/5 border-white/10 text-white hover:border-cyan-400')
                    }`}
                  >
                    <div className="text-xs font-bold uppercase">SYNTHESIZE</div>
                    <div className={`text-[9.5px] ${isLight ? 'text-slate-500 font-semibold' : 'text-white/50'}`}>RESPONS AKHIR &amp; SEGEL SHA-256</div>
                  </button>
                  <span className={`font-bold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>→</span>
                  <div className={`px-4 py-2 rounded-xl border text-xs font-bold ${
                    isLight ? 'border-slate-300 bg-white text-slate-600 shadow-2xs' : 'border-white/10 bg-white/5 text-white/60'
                  }`}>
                    END
                  </div>
                </div>
              </div>

              {/* Selected Node Inspector */}
              <div className={`rounded-xl border p-4 text-xs font-mono transition-all ${
                isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'border-white/10 bg-white/5 text-white'
              }`}>
                <div className={`flex items-center justify-between border-b pb-2 mb-2 ${
                  isLight ? 'border-slate-100' : 'border-white/10'
                }`}>
                  <span className={`font-bold uppercase ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Inspektur Node Terpilih (Selected Node Inspector)
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    STATUS: {selectedNodeObj.status.toUpperCase()} ({selectedNodeObj.successRate}%)
                  </span>
                </div>
                <div className={`font-bold mb-1 ${isLight ? 'text-emerald-800' : 'text-[#FFCA40]'}`}>
                  NODE ID: {selectedNodeObj.id.toUpperCase()} — {selectedNodeObj.label}
                </div>
                <p className={`font-sans text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                  {selectedNodeObj.description}
                </p>
              </div>
            </div>

            {/* Right 6 Cols: Execution Trace Grid */}
            <div className={`lg:col-span-6 relative overflow-hidden rounded-2xl border p-5 transition-all flex flex-col space-y-4 ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-sm text-slate-900'
                : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
            }`}>
              <div>
                <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-4 ${
                  isLight ? 'border-slate-100' : 'border-white/10'
                }`}>
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      Execution Trace Grid (Jejak Eksekusi LangGraph)
                    </h3>
                    <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                      Log eksekusi langsung dari panggilan ClaimTrace AI &amp; sub-agen JKN
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <select
                      value={traceStatusFilter}
                      onChange={(e) => setTraceStatusFilter(e.target.value)}
                      aria-label="Filter status eksekusi"
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer border ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600'
                          : 'bg-[#00134A] border-white/10 text-white focus:outline-none focus:border-[#FFCA40]/50'
                      }`}
                    >
                      <option value="">STATUS: SEMUA</option>
                      <option value="completed">COMPLETED</option>
                      <option value="failed">FAILED</option>
                    </select>

                    <select
                      value={traceAgentFilter}
                      onChange={(e) => setTraceAgentFilter(e.target.value)}
                      aria-label="Filter agen"
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer border ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600'
                          : 'bg-[#00134A] border-white/10 text-white focus:outline-none focus:border-[#FFCA40]/50'
                      }`}
                    >
                      <option value="">AGEN: SEMUA</option>
                      <option value="claimtrace_ai">CLAIMTRACE_AI</option>
                      <option value="tca">TCA (PNPK)</option>
                      <option value="cma">CMA (SLA)</option>
                      <option value="ia">IA (WAWASAN)</option>
                      <option value="sta">STA (LAPIS 3)</option>
                    </select>
                  </div>
                </div>

                <div className={`overflow-x-auto rounded-xl border max-h-[460px] overflow-y-auto ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <table className="w-full text-left text-xs font-mono">
                    <thead className={`border-b uppercase ${
                      isLight
                        ? 'bg-slate-100 border-slate-200 text-slate-700 font-bold'
                        : 'bg-[#00134A] border-white/10 text-white/50'
                    }`}>
                      <tr>
                        <th className="py-2.5 pl-3 pr-2">ID</th>
                        <th className="py-2.5 px-2">WAKTU</th>
                        <th className="py-2.5 px-2">AGEN</th>
                        <th className="py-2.5 px-2">MODEL</th>
                        <th className="py-2.5 px-2 text-right">DURASI</th>
                        <th className="py-2.5 px-2 text-right">EVALUASI BUKTI</th>
                        <th className="py-2.5 pl-2 pr-3 text-right">POTENSI FRAUD (IDR)</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                      {filteredExecutions.map((exec, idx) => {
                        const sampleAmounts = ['Rp 14.250.000', 'Rp 8.920.000', 'Rp 24.100.000', 'Rp 5.400.000', 'Rp 18.750.000', 'Rp 11.300.000'];
                        const amountStr = sampleAmounts[idx % sampleAmounts.length];
                        return (
                          <tr
                            key={exec.execution_id}
                            className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
                          >
                            <td className={`py-2.5 pl-3 pr-2 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {exec.execution_id.slice(0, 10)}
                            </td>
                            <td className={`py-2.5 px-2 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                              {new Date(exec.started_at).toLocaleTimeString('id-ID')}
                            </td>
                            <td className="py-2.5 px-2">
                              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] border ${
                                isLight
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                              }`}>
                                {exec.graph_name}
                              </span>
                            </td>
                            <td className={`py-2.5 px-2 text-[11px] ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                              {exec.model_used || 'ClaimTrace Core'}
                            </td>
                            <td className={`py-2.5 px-2 text-right font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                              {exec.total_execution_time_ms}ms
                            </td>
                            <td className={`py-2.5 px-2 text-right ${isLight ? 'text-slate-600 font-semibold' : 'text-white/80'}`}>
                              L1+L2+L3 Tervalidasi
                            </td>
                            <td className={`py-2.5 pl-2 pr-3 text-right font-bold ${isLight ? 'text-amber-800' : 'text-[#FFCA40]'}`}>
                              {amountStr}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Live Trigger inside Trace Card */}
              <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isLight
                  ? 'bg-emerald-50/80 border-emerald-200 text-slate-900'
                  : 'bg-gradient-to-r from-[#FFCA40]/10 to-blue-500/10 border-[#FFCA40]/30 text-white'
              }`}>
                <div>
                  <div className={`text-xs font-bold ${isLight ? 'text-emerald-900' : 'text-[#FFCA40]'}`}>
                    Eksekusi LangGraph Operasional (Live ClaimTrace AI)
                  </div>
                  <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                    Klik untuk memicu panggilan evaluasi ke engine ClaimTrace AI dan mencatat trace baru di tabel atas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTriggerLiveAuditTrace()}
                  disabled={liveTraceLoading}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 transition-all ${
                    isLight
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      : 'bg-[#FFCA40] hover:bg-[#FFD700] text-[#000c24] shadow-lg shadow-[#FFCA40]/20'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  {liveTraceLoading ? 'Memproses Audit...' : 'Picu Trace AI Live'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: AUTOPILOT ACTIONS & POLICY (Matching media_1792848347061 & 71) */}
      {/* ===================================================================== */}
      {activeTab === 'autopilot' && (
        <div className="space-y-6">
          {/* Header */}
          <div className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col gap-6 transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm text-slate-800'
              : 'border-white/10 bg-[#00153A]/85 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
          }`}>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className={`flex items-center gap-3 text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-[#FFCA40] shadow-md">
                    <Cpu className="w-7 h-7" />
                  </div>
                  <span>Autopilot Penapisan JKN</span>
                </h1>
                <p className={`mt-1.5 text-xs max-w-2xl leading-relaxed ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                  Pemantauan &amp; tata kelola aksi otonom agen AI. Konfigurasi kebijakan runtime penapisan dan telaah keputusan berisiko tinggi (Human-in-the-Loop).
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTelemetry(getAiTelemetryState())}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{autopilotSubTab === 'actions' ? 'Perbarui Data' : 'Segarkan'}</span>
                </button>
              </div>
            </div>

            {/* Main Autopilot Switcher Tabs: Actions vs Policy */}
            <div className={`flex border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <button
                type="button"
                onClick={() => setAutopilotSubTab('actions')}
                className={`px-6 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  autopilotSubTab === 'actions'
                    ? isLight
                      ? 'border-emerald-600 text-emerald-700 font-bold'
                      : 'border-[#FFCA40] text-[#FFCA40]'
                    : isLight
                      ? 'border-transparent text-slate-500 hover:text-slate-800'
                      : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                Daftar Aksi Otonom (Actions)
              </button>
              <button
                type="button"
                onClick={() => setAutopilotSubTab('policy')}
                className={`px-6 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  autopilotSubTab === 'policy'
                    ? isLight
                      ? 'border-emerald-600 text-emerald-700 font-bold'
                      : 'border-[#FFCA40] text-[#FFCA40]'
                    : isLight
                      ? 'border-transparent text-slate-500 hover:text-slate-800'
                      : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                Kebijakan Runtime (Policy)
              </button>
            </div>
          </div>

          {/* SUB-VIEW 1: ACTIONS */}
          {autopilotSubTab === 'actions' && (
            <div className="space-y-6">
              {/* 4 Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* System Status */}
                <div
                  className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm backdrop-blur-xl transition-all ${
                    policyForm.autopilot_enabled
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-white'
                      : isLight
                        ? 'bg-rose-50 border-rose-200 text-rose-950'
                        : 'bg-rose-500/10 border-rose-500/30 text-white'
                  }`}
                >
                  <div className={`text-xs font-semibold mb-1 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Status Sistem</div>
                  <div
                    className={`text-xl font-bold flex items-center gap-2 ${
                      policyForm.autopilot_enabled
                        ? isLight ? 'text-emerald-700' : 'text-emerald-400'
                        : isLight ? 'text-rose-700' : 'text-rose-400'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>{policyForm.autopilot_enabled ? 'Aktif Berjalan' : 'Dinonaktifkan'}</span>
                  </div>
                  <div className={`mt-2 text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Interval Polling: {policyForm.worker_interval_seconds} detik
                  </div>
                </div>

                {/* Execution Mode */}
                <div
                  className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm backdrop-blur-xl transition-all ${
                    policyForm.onchain_placeholder
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-200 text-sky-950'
                        : 'bg-blue-500/10 border-blue-500/30 text-white'
                      : isLight
                        ? 'bg-amber-50 border-amber-200 text-amber-950'
                        : 'bg-[#FFCA40]/10 border-[#FFCA40]/30 text-white'
                  }`}
                >
                  <div className={`text-xs font-semibold mb-1 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Mode Eksekusi</div>
                  <div
                    className={`text-xl font-bold flex items-center gap-2 ${
                      policyForm.onchain_placeholder
                        ? isLight ? 'text-emerald-800' : 'text-cyan-300'
                        : isLight ? 'text-amber-800' : 'text-[#FFCA40]'
                    }`}
                  >
                    {policyForm.onchain_placeholder ? <Activity className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <span>{policyForm.onchain_placeholder ? 'Ledger SHA-256' : 'Validasi Pra-Registri'}</span>
                  </div>
                  <div className={`mt-2 text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    {policyForm.onchain_placeholder
                      ? 'Pencatatan langsung ke rantai blok audit SHA-256'
                      : 'Aksi divalidasi sebelum segel definitif'}
                  </div>
                </div>

                {/* Queue Health */}
                <div className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-sm text-slate-800'
                    : 'border-white/10 bg-[#00153A]/85 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
                }`}>
                  <div className={`text-xs font-semibold mb-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Antrean Telaah</div>
                  <div className={`text-xl font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Clock className={`w-5 h-5 ${isLight ? 'text-amber-600' : 'text-[#FFCA40]'}`} />
                    <span>
                      {telemetry.agent_decisions.filter((d) => d.status === 'awaiting_approval').length} Menunggu
                    </span>
                  </div>
                  <div className={`mt-2 text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Memerlukan telaah verifikator (HITL)</div>
                </div>

                {/* Success Rate */}
                <div className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-sm text-slate-800'
                    : 'border-white/10 bg-[#00153A]/85 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
                }`}>
                  <div className={`text-xs font-semibold mb-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Kepatuhan Regulasi</div>
                  <div className={`text-xl font-bold flex items-center gap-2 ${isLight ? 'text-purple-700' : 'text-white'}`}>
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span>
                      {telemetry.agent_decisions.length > 0 ? '99.2%' : '0%'}
                    </span>
                  </div>
                  <div className={`mt-2 text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    {telemetry.agent_decisions.filter((d) => d.status !== 'failed').length} diproses,{' '}
                    {telemetry.agent_decisions.filter((d) => d.status === 'failed').length} ditolak
                  </div>
                </div>
              </div>

              {/* Alur Kerja Otonom Autopilot */}
              <section className={`relative overflow-hidden rounded-2xl border p-6 transition-all ${
                isLight
                  ? 'bg-white border-slate-200 shadow-sm text-slate-800'
                  : 'border-white/10 bg-[#00153A]/85 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
              }`}>
                <h2 className={`text-sm font-bold mb-6 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <Activity className="w-4 h-4 text-amber-500 dark:text-[#FFCA40]" />
                  <span>Alur Kerja Otonom Autopilot JKN</span>
                </h2>

                <div className="relative">
                  {/* Connecting Line */}
                  <div className={`hidden md:block absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2 z-0 opacity-40 ${
                    isLight
                      ? 'bg-gradient-to-r from-emerald-500 via-sky-500 to-purple-500'
                      : 'bg-gradient-to-r from-emerald-400 via-[#FFCA40] to-purple-400'
                  }`} />

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 relative z-10">
                    {[
                      {
                        icon: Cpu,
                        title: '1. Pemicu Agen',
                        desc: 'AI mendeteksi anomali pola berkas klaim & SEP',
                        color: isLight ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                      },
                      {
                        icon: Shield,
                        title: '2. Evaluasi Kebijakan',
                        desc: 'Penapisan terhadap PNPK & regulasi Perpres 82/2018',
                        color: isLight ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
                      },
                      {
                        icon: Clock,
                        title: '3. Antrean Telaah',
                        desc: 'Risiko tinggi wajib otorisasi verifikator (HITL)',
                        color: isLight ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-[#FFCA40] bg-[#FFCA40]/10 border-[#FFCA40]/30',
                      },
                      {
                        icon: Play,
                        title: '4. Eksekusi Aksi',
                        desc: 'Worker memproses disposisi yang disetujui',
                        color: isLight ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-blue-400 bg-blue-500/10 border-blue-500/30',
                      },
                      {
                        icon: Database,
                        title: '5. Segel Kriptografis',
                        desc: 'Penyegelan bukti ke Ledger SHA-256 BPJS',
                        color: isLight ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-purple-400 bg-purple-500/10 border-purple-500/30',
                      },
                    ].map((step, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col items-center text-center p-4 rounded-xl border transition-all shadow-xs group ${
                          isLight
                            ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div
                          className={`p-3 rounded-full mb-3 border ${step.color} group-hover:scale-105 transition-transform`}
                        >
                          <step.icon className="w-5 h-5" />
                        </div>
                        <h3 className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{step.title}</h3>
                        <p className={`text-[11px] mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-white/60'}`}>{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Action Filter Pills */}
              <div className={`flex flex-wrap items-center gap-1 border-b pb-2 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                {[
                  {
                    id: 'awaiting_approval',
                    label: 'Perlu Telaah (HITL)',
                    count: telemetry.agent_decisions.filter((d) => d.status === 'awaiting_approval').length,
                    icon: AlertTriangle,
                  },
                  {
                    id: 'all',
                    label: 'Semua Aksi',
                    count: telemetry.agent_decisions.length,
                    icon: Layers,
                  },
                  {
                    id: 'in_progress',
                    label: 'Sedang Berjalan',
                    count: 0,
                    icon: Play,
                  },
                  {
                    id: 'completed',
                    label: 'Tereksekusi',
                    count: telemetry.agent_decisions.filter((d) => d.status === 'confirmed' || d.status === 'approved').length,
                    icon: CheckCircle,
                  },
                  {
                    id: 'failed',
                    label: 'Ditolak / Batal',
                    count: telemetry.agent_decisions.filter((d) => d.status === 'failed').length,
                    icon: X,
                  },
                ].map((pill) => {
                  const isActive = autopilotFilter === pill.id;

                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setAutopilotFilter(pill.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? isLight
                            ? 'bg-emerald-600 text-white shadow-md font-bold'
                            : 'bg-[#FFCA40] text-[#000c24] shadow-lg shadow-[#FFCA40]/20 font-bold'
                          : isLight
                            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <pill.icon className="w-3.5 h-3.5" />
                      <span>{pill.label}</span>
                      {pill.count !== undefined && (
                        <span
                          className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? isLight ? 'bg-white/20 text-white' : 'bg-[#000c24]/20 text-[#000c24]'
                              : isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-white/70'
                          }`}
                        >
                          {pill.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Actions Queue List */}
              <div className="space-y-3">
                {telemetry.agent_decisions
                  .filter((item) => {
                    if (autopilotFilter === 'awaiting_approval') return item.status === 'awaiting_approval';
                    if (autopilotFilter === 'completed') return item.status === 'confirmed' || item.status === 'approved';
                    if (autopilotFilter === 'failed') return item.status === 'failed';
                    if (autopilotFilter === 'in_progress') return item.status === 'running';
                    return true;
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`relative overflow-hidden rounded-2xl border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        isLight
                          ? 'bg-white border-slate-200 shadow-sm text-slate-800'
                          : 'border-white/10 bg-[#00153A]/85 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`font-mono text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            #{item.id} · {item.action_type}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.risk_level === 'critical'
                                ? isLight
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : item.risk_level === 'high'
                                ? isLight
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-[#FFCA40]/20 text-[#FFCA40] border border-[#FFCA40]/30'
                                : isLight
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-500/20 text-cyan-300 border border-blue-500/30'
                            }`}
                          >
                            {item.risk_level}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            isLight
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-white/10 text-white/70 border-white/10'
                          }`}>
                            {item.source}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed max-w-3xl ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                          {item.agent_reasoning}
                        </p>
                        <div className={`flex flex-wrap items-center gap-3 text-[11px] font-mono pt-1 ${
                          isLight ? 'text-slate-400' : 'text-white/40'
                        }`}>
                          <span>Kebijakan: {item.policy_decision}</span>
                          <span>•</span>
                          <span>Atestasi: {item.attestation_record_id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === 'awaiting_approval' ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setNoteDialog({
                                  isOpen: true,
                                  type: 'approve',
                                  actionId: item.id,
                                  title: `Setujui Tindakan Autopilot #${item.id}`,
                                  message: `Apakah Anda yakin menyetujui tindakan ${item.action_type}? Tindakan akan dijadwalkan untuk dieksekusi secara otomatis.`,
                                  inputLabel: 'Catatan Verifikator Medis (Opsional)',
                                  inputPlaceholder: 'Tuliskan catatan disposisi persetujuan...',
                                  confirmLabel: 'Setujui Tindakan',
                                  note: '',
                                baggage: item,
                                })
                              }
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setNoteDialog({
                                  isOpen: true,
                                  type: 'reject',
                                  actionId: item.id,
                                  title: `Tolak Tindakan Autopilot #${item.id}`,
                                  message: `Apakah Anda yakin menolak tindakan ${item.action_type}? Tindakan ini tidak akan dijalankan.`,
                                  inputLabel: 'Alasan Penolakan (Wajib Diisi)',
                                  inputPlaceholder: 'Tuliskan alasan penolakan tindakan...',
                                  confirmLabel: 'Tolak Tindakan',
                                  note: '',
                                baggage: item,
                                })
                              }
                              className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer border ${
                                isLight
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>
                          </>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              item.status === 'confirmed' || item.status === 'approved'
                                ? isLight
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isLight
                                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                  : 'bg-white/10 text-white/50 border border-white/10'
                            }`}
                          >
                            {item.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: POLICY (Matching media_1792848371014_a237e9d1.png) */}
          {autopilotSubTab === 'policy' && (
            <div className="space-y-6">
              {/* Kebijakan Penapisan & Alur Keputusan */}
              <div className={`relative overflow-hidden rounded-2xl border p-6 space-y-3 transition-all ${
                isLight
                  ? 'bg-white border-slate-200 shadow-sm text-slate-800'
                  : 'border-white/10 bg-[#00153A]/85 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
              }`}>
                <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Alur Kebijakan Keputusan Autopilot JKN</h2>
                <div className={`space-y-2 text-xs leading-relaxed font-sans ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                  <p>1. Agen AI menganalisis berkas klaim dan menyertakan metadata estimasi risiko klinis.</p>
                  <p>2. Kebijakan runtime mengevaluasi tipe tindakan dan batas toleransi fraud (PNPK &amp; Permenkes).</p>
                  <p>3. Tindakan berisiko rendah/sedang otomatis diteruskan; tindakan berisiko tinggi (&gt; 75%) ditahan untuk otorisasi verifikator.</p>
                  <p>4. Setiap keputusan yang disetujui disegel langsung ke dalam Audit Ledger Kriptografis SHA-256 BPJS Kesehatan.</p>
                </div>
              </div>

              {/* Pengaturan Kebijakan Runtime */}
              <div className={`relative overflow-hidden rounded-2xl border p-6 space-y-5 transition-all ${
                isLight
                  ? 'bg-white border-slate-200 shadow-sm text-slate-800'
                  : 'border-white/10 bg-[#00153A]/85 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
              }`}>
                <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Konfigurasi Kebijakan Runtime (Policy Settings)</h2>

                {/* Switch 1: Autopilot Enabled */}
                <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 transition-all ${
                  isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/5'
                }`}>
                  <div>
                    <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Autopilot Penapisan Aktif</p>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      Mengaktifkan pemrosesan worker antrean otonom untuk klasifikasi berkas klaim latar belakang.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={policyForm.autopilot_enabled}
                    onClick={() =>
                      setPolicyForm((prev) => ({
                        ...prev,
                        autopilot_enabled: !prev.autopilot_enabled,
                      }))
                    }
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                      policyForm.autopilot_enabled
                        ? 'bg-emerald-600'
                        : isLight ? 'bg-slate-300' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        policyForm.autopilot_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch 2: SHA-256 Ledger Live Mode */}
                <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 transition-all ${
                  isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/5'
                }`}>
                  <div>
                    <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Penyegelan Audit Kriptografis SHA-256</p>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      Menyegel setiap tindakan otomatis dengan hash SHA-256 bertaut (tamper-evident) pada ledger audit resmi.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={policyForm.onchain_placeholder}
                    onClick={() =>
                      setPolicyForm((prev) => ({
                        ...prev,
                        onchain_placeholder: !prev.onchain_placeholder,
                      }))
                    }
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                      policyForm.onchain_placeholder
                        ? 'bg-emerald-600'
                        : isLight ? 'bg-slate-300' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        policyForm.onchain_placeholder ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Input: Worker Interval (seconds) */}
                <div className={`rounded-xl border p-4 space-y-1.5 transition-all ${
                  isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/5'
                }`}>
                  <label className={`block text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Interval Polling Pemrosesan (Detik)
                  </label>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Frekuensi pemeriksaan berkas klaim baru yang masuk ke antrean penapisan otonom.
                  </p>
                  <input aria-label="Bidang input data"
                    type="number"
                    min="1"
                    max="120"
                    value={policyForm.worker_interval_seconds}
                    onChange={(e) =>
                      setPolicyForm((prev) => ({
                        ...prev,
                        worker_interval_seconds: Number(e.target.value) || 5,
                      }))
                    }
                    className={`w-32 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none mt-2 transition-all ${
                      isLight
                        ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500'
                        : 'bg-white/5 border border-white/10 text-white focus:border-[#FFCA40]/60'
                    }`}
                  />
                </div>

                {/* Notice Box */}
                <div className={`rounded-xl border p-4 flex items-start gap-2.5 text-xs transition-all ${
                  isLight
                    ? 'border-amber-200 bg-amber-50/70 text-amber-900'
                    : 'border-white/10 bg-white/5 text-white/70'
                }`}>
                  <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-amber-600' : 'text-[#FFCA40]'}`} />
                  <p className="text-[11px] leading-relaxed">
                    Pembaruan runtime <strong>langsung diterapkan pada orkestrator aktif</strong>. Tindakan jalur merah (penahanan BAKB) tetap mewajibkan otorisasi verifikator medis sebelum jatuh tempo 10 hari sesuai Pasal 76 ayat (2) Perpres No. 82/2018.
                  </p>
                </div>

                {/* Save Policy Button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateAutopilotPolicyState({
                        autopilot_enabled: policyForm.autopilot_enabled,
                        sha256_attestation_anchor: policyForm.onchain_placeholder,
                        worker_interval_seconds: policyForm.worker_interval_seconds,
                      });
                      setPolicySavedFeedback(true);
                      setTimeout(() => setPolicySavedFeedback(false), 3000);
                    }}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-md flex items-center gap-2 cursor-pointer ${
                      isLight
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        : 'bg-[#FFCA40] hover:bg-[#FFD700] text-[#000c24] shadow-amber-500/20'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Kebijakan Autopilot</span>
                  </button>

                  <span className={`text-xs flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{policySavedFeedback ? 'Kebijakan berhasil disimpan!' : 'Kebijakan tersinkronisasi'}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: AGENT DECISIONS & ATTESTATIONS                                */}
      {/* ===================================================================== */}
      {activeTab === 'agent_decisions' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm text-slate-800'
              : 'border-white/10 bg-[#00153A]/85 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
          }`}>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Log Keputusan &amp; Atestasi Otonom Multi-Agen
              </h1>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                Transparansi keputusan penapisan otonom AI, hasil evaluasi guardrails, dan keterkaitan segel hash audit SHA-256.
              </p>
              <p className={`mt-2 text-xs font-mono ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Total Catatan: <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>{telemetry.agent_decisions.length}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTelemetry(getAiTelemetryState())}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs flex items-center gap-2 self-start md:self-auto cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Perbarui Log</span>
            </button>
          </div>

          {/* Section: Recent Decisions */}
          <section className={`relative overflow-hidden rounded-2xl border p-5 space-y-4 transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm text-slate-800'
              : 'border-white/10 bg-[#00153A]/85 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
          }`}>
            <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Daftar Keputusan Otonom Terkini</h2>

            <div className={`overflow-x-auto border rounded-xl ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                    isLight
                      ? 'border-slate-200 bg-slate-100 text-slate-700'
                      : 'border-white/10 bg-[#00134A] text-white/50'
                  }`}>
                    <th className="px-3 py-3">AGEN / SUMBER</th>
                    <th className="px-3 py-3">TINDAKAN REKOMENDASI</th>
                    <th className="px-3 py-3">KEBIJAKAN RUNTIME</th>
                    <th className="px-3 py-3">PENALARAN KLINIS &amp; REGULASI</th>
                    <th className="px-3 py-3">STATUS DISPOSISI</th>
                    <th className="px-3 py-3">ID BUKTI &amp; REGISTRASI</th>
                    <th className="px-3 py-3">HASH AUDIT SHA-256</th>
                    <th className="px-3 py-3">WAKTU</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200 bg-white' : 'divide-white/5'}`}>
                  {telemetry.agent_decisions.map((item) => (
                    <tr key={item.id} className={`align-top transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                      {/* SOURCE */}
                      <td className={`px-3 py-3 font-mono text-[11px] font-semibold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                        {item.source}
                      </td>

                      {/* ACTION */}
                      <td className="px-3 py-3">
                        <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          #{item.id} · {item.action_type}
                        </div>
                        <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                          risk={item.risk_level} intent={item.next_step || 'system_fallback'}
                        </div>
                      </td>

                      {/* POLICY */}
                      <td className="px-3 py-3">
                        <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>{item.policy_decision}</div>
                        <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                          next={item.next_step || 'none'}
                        </div>
                      </td>

                      {/* REASONING */}
                      <td className={`px-3 py-3 max-w-xs text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                        <p className="line-clamp-3">{item.agent_reasoning}</p>
                      </td>

                      {/* STATUS */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.status === 'confirmed' || item.status === 'approved'
                              ? isLight
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.status === 'awaiting_approval'
                              ? isLight
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-[#FFCA40]/20 text-[#FFCA40] border border-[#FFCA40]/30'
                              : isLight
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-white/10 text-white/60 border border-white/10'
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.status === 'awaiting_approval' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('autopilot');
                              setAutopilotSubTab('actions');
                              setAutopilotFilter('awaiting_approval');
                            }}
                            className={`mt-1.5 flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                              isLight
                                ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'border-[#FFCA40]/30 bg-[#FFCA40]/10 text-[#FFCA40] hover:bg-[#FFCA40]/20'
                            }`}
                          >
                            <span>Telaah Aksi</span>
                            <ChevronRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </td>

                      {/* ATTESTATION */}
                      <td className={`px-3 py-3 font-mono text-[11px] ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                        <div>record: {item.attestation_record_id || '-'}</div>
                        <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>status: {item.status}</div>
                        <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                          hash: {item.attestation_tx_hash ? `${item.attestation_tx_hash.slice(0, 8)}...${item.attestation_tx_hash.slice(-6)}` : '-'}
                        </div>
                      </td>

                      {/* HASH AUDIT SHA-256 */}
                      <td className={`px-3 py-3 font-mono text-[11px] ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                        <div>
                          {item.attestation_tx_hash
                            ? `${item.attestation_tx_hash.slice(0, 6)}...${item.attestation_tx_hash.slice(-4)}`
                            : '-'}
                        </div>
                        {item.attestation_tx_hash && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              if (onGoToAudit) onGoToAudit();
                            }}
                            className={`mt-1 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                              isLight
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                : 'border-[#FFCA40]/30 bg-[#FFCA40]/10 text-[#FFCA40] hover:bg-[#FFCA40]/20'
                            }`}
                          >
                            <span>Buka di Ledger Audit</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </td>

                      {/* CREATED */}
                      <td className={`px-3 py-3 text-[11px] font-mono whitespace-nowrap ${isLight ? 'text-slate-400' : 'text-white/50'}`}>
                        {new Date().toLocaleDateString('id-ID')}, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: REACT FORENSIC TRAJECTORY & LIVE CLAIMTRACE AI SYNTHESIS        */}
      {/* ===================================================================== */}
      {activeTab === 'trajectory' && (
        <div className="space-y-6">
          <div className={`relative overflow-hidden rounded-2xl border p-6 space-y-5 transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm text-slate-800'
              : 'border-white/10 bg-[#00153A]/85 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <div>
                <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Lintasan Penalaran ReAct (Thought → Tool Call → Observation)
                </h3>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                  Berkas Klaim: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{agentData.claim_id}</strong> · {agentData.faskes_name}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunLiveReActSynthesis}
                disabled={isRunningAudit}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-all ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-[#FFCA40] hover:bg-[#FFD700] text-[#000c24] shadow-amber-500/20'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {isRunningAudit
                  ? 'Menyusun Sintesis via ClaimTrace AI...'
                  : 'Susun Sintesis Yuridis Live (ClaimTrace AI)'}
              </button>
            </div>

            {liveAiSynthesis && (
              <div className={`p-4 rounded-xl border space-y-2 ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-slate-800'
                  : 'bg-gradient-to-r from-[#FFCA40]/10 to-blue-500/10 border-[#FFCA40]/30 text-white'
              }`}>
                <div className={`flex items-center justify-between text-xs font-bold ${isLight ? 'text-emerald-800' : 'text-[#FFCA40]'}`}>
                  <span>Hasil Sintesis Langsung ClaimTrace AI ({liveAiSynthesis.modelUsed})</span>
                  <span className={`font-mono ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                    {liveAiSynthesis.durationMs}ms · {liveAiSynthesis.totalTokens} token
                  </span>
                </div>
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                  {liveAiSynthesis.text}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {agentData.steps.map((step) => {
                const isHitlStep = step.status === 'awaiting_approval';
                return (
                  <div
                    key={step.step_number}
                    className={`p-4 rounded-xl border transition-all ${
                      isHitlStep
                        ? isLight
                          ? 'bg-rose-50 border-rose-200 text-rose-950'
                          : 'bg-rose-500/10 border-rose-500/30 text-white'
                        : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-800'
                          : 'bg-white/5 border-white/10 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            isHitlStep ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {step.step_number}
                        </span>
                        <span className={`font-bold uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Langkah {step.step_number}
                        </span>
                        {step.tool_call && (
                          <span className={`font-mono text-[11px] px-2 py-0.5 rounded font-semibold border ${
                            isLight
                              ? 'bg-sky-100 border-emerald-200 text-emerald-800'
                              : 'bg-white/10 border-white/10 text-cyan-300'
                          }`}>
                            tool: {step.tool_call.tool_name}
                          </span>
                        )}
                      </div>
                      <span className={`font-mono text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        {step.duration_ms}ms · {step.tokens_used} tok
                      </span>
                    </div>

                    <div className={`text-xs leading-relaxed mb-2 pl-7 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                      <strong className={isLight ? 'text-slate-900' : 'text-white'}>Penalaran Agen: </strong>
                      {step.thought}
                    </div>

                    {step.observation && (
                      <div className="pl-7">
                        <pre className={`border rounded-lg p-3 text-[11px] font-mono overflow-x-auto shadow-inner ${
                          isLight
                            ? 'bg-slate-100 border-slate-300 text-slate-800'
                            : 'bg-slate-950 border-slate-800 text-emerald-400'
                        }`}>
                          {JSON.stringify(step.observation, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* HITL Approval Card */}
          <div className={`relative overflow-hidden rounded-2xl border p-5 md:p-6 space-y-4 transition-all ${
            isLight
              ? 'border-slate-200 bg-white text-slate-900 shadow-sm'
              : 'border-white/10 bg-[#00153A]/90 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <div>
                <span className={`text-[11px] font-semibold uppercase ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                  Gerbang Otorisasi Verifikator Medis (Human-in-the-Loop)
                </span>
                <h3 className={`text-base font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Rekomendasi Tindakan: Jalur Khusus (Tunda Bayar BAKB)
                </h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-800'
                  : 'bg-white/10 border-white/20 text-white'
              }`}>
                Skor Fusi: 94.0 / 100
              </span>
            </div>

            {approvalStatus === 'pending' ? (
              <div className="space-y-3">
                <textarea
                  rows={2}
                  value={verifierNotes}
                  onChange={(e) => setVerifierNotes(e.target.value)}
                  className={`w-full p-3 rounded-xl text-xs focus:outline-none transition-all ${
                    isLight
                      ? 'border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:border-emerald-600 shadow-2xs'
                      : 'border border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-emerald-400'
                  }`}
                  placeholder="Tambahkan catatan verifikator medis sebelum otorisasi..."
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setApprovalStatus('approved');
                      const state = getAiTelemetryState();
                      const existingIndex = state.agent_decisions.findIndex((d) => d.id === 901);
                      if (existingIndex !== -1) {
                        state.agent_decisions[existingIndex] = {
                          ...state.agent_decisions[existingIndex],
                          status: 'approved',
                          attestation_status: 'SEALED_SHA256',
                          agent_reasoning: verifierNotes
                            ? `${state.agent_decisions[existingIndex].agent_reasoning} [Otorisasi Verifikator: ${verifierNotes}]`
                            : state.agent_decisions[existingIndex].agent_reasoning,
                        };
                        saveAiTelemetryState(state);
                        setTelemetry(getAiTelemetryState());
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Setujui Rekomendasi & Segel Ledger SHA-256
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApprovalStatus('rejected');
                      const state = getAiTelemetryState();
                      const existingIndex = state.agent_decisions.findIndex((d) => d.id === 901);
                      if (existingIndex !== -1) {
                        state.agent_decisions[existingIndex] = {
                          ...state.agent_decisions[existingIndex],
                          status: 'failed',
                          agent_reasoning: verifierNotes
                            ? `${state.agent_decisions[existingIndex].agent_reasoning} [Ditolak Verifikator: ${verifierNotes}]`
                            : state.agent_decisions[existingIndex].agent_reasoning,
                        };
                        saveAiTelemetryState(state);
                        setTelemetry(getAiTelemetryState());
                      }
                    }}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs border cursor-pointer transition-all ${
                      isLight
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                    }`}
                  >
                    Tolak
                  </button>
                </div>
              </div>
            ) : (
              <div className={`p-4 rounded-xl border text-xs space-y-3 transition-all ${
                approvalStatus === 'approved'
                  ? isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-white'
                  : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-800'
                    : 'bg-white/5 border-white/10 text-white'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${approvalStatus === 'approved' ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span className="font-bold">
                      {approvalStatus === 'approved'
                        ? 'Keputusan Verifikator Medis telah disahkan & disegel ke dalam Ledger Audit SHA-256.'
                        : 'Keputusan rekomendasi telah ditolak oleh Verifikator Medis.'}
                    </span>
                  </div>
                  {approvalStatus === 'approved' && (
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300/50">
                      SEALED: 0x9f84c2...a4b5c6
                    </span>
                  )}
                </div>
                <div className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                  Catatan Verifikasi: <em>&quot;{verifierNotes}&quot;</em>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {onGoToAudit && (
                    <button
                      type="button"
                      onClick={() => onGoToAudit()}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isLight
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-[#FFCA40] hover:bg-[#FFD700] text-[#000c24]'
                      }`}
                    >
                      <span>Buka di Ledger Audit</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                  {onGoToCase && (
                    <button
                      type="button"
                      onClick={() => onGoToCase()}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                        isLight
                          ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                      }`}
                    >
                      Buka Berkas Investigasi
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setApprovalStatus('pending')}
                    className={`ml-auto text-[11px] hover:underline cursor-pointer ${
                      isLight ? 'text-slate-500' : 'text-white/50'
                    }`}
                  >
                    Buka Kembali Otorisasi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* NoteInputDialog for Autopilot Approval / Rejection */}
      {noteDialog.isOpen && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all ${
          isLight ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-[#00081c]/80 backdrop-blur-md'
        }`}>
          <div className={`relative overflow-hidden rounded-2xl border p-6 max-w-md w-full space-y-4 shadow-2xl transition-all ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800'
              : 'border-white/20 bg-[#00153A] text-white'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {noteDialog.type === 'approve' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                )}
                <span>{noteDialog.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setNoteDialog((prev) => ({ ...prev, isOpen: false }))}
                className={`p-1 rounded-lg transition-colors ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/50 hover:text-white'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>{noteDialog.message}</p>

            <AnimatePresence>
              {noteDialog.errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{noteDialog.errorMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNoteDialog((prev) => ({ ...prev, errorMessage: '' }))}
                    className="p-0.5 rounded hover:bg-rose-500/10 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className={`block text-xs font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                {noteDialog.inputLabel}
              </label>
              <textarea
                rows={3}
                value={noteDialog.note}
                onChange={(e) => setNoteDialog((prev) => ({ ...prev, note: e.target.value, errorMessage: '' }))}
                placeholder={noteDialog.inputPlaceholder}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none transition-all ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500'
                    : 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[#FFCA40]/60'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNoteDialog((prev) => ({ ...prev, isOpen: false, errorMessage: '' }))}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                  isLight
                    ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'border-white/10 text-white/80 hover:bg-white/5'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (noteDialog.type === 'reject' && !noteDialog.note.trim()) {
                    setNoteDialog((prev) => ({ ...prev, errorMessage: 'Alasan penolakan wajib diisi sebelum menyimpan keputusan.' }));
                    return;
                  }
                  const status = noteDialog.type === 'approve' ? 'approved' : 'rejected';
                  const noteText = noteDialog.note.trim() || (noteDialog.type === 'approve' ? 'Disetujui Verifikator Medis' : 'Ditolak');
                  const next = reviewAutopilotDecision(noteDialog.actionId, status, noteText);
                  setTelemetry({ ...next });
                  setNoteDialog((prev) => ({ ...prev, isOpen: false, errorMessage: '' }));
                }}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs cursor-pointer ${
                  noteDialog.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {noteDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
