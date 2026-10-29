import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
  PieChart,
  Pie,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  ArrowUp,
  ArrowDown,
  Users,
  AlertTriangle,
  Flame,
  Clock,
  Calendar,
  Sparkles,
  BellRing,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Info,
  BarChart3,
  SlidersHorizontal,
  ChevronRight,
  MessageSquare,
  Heart,
  Cpu,
  Settings,
  X,
  RefreshCw,
  ShieldCheck,
  Activity,
  LayoutDashboard,
  Briefcase,
  Zap,
  Flag,
  FileText,
  Database,
} from 'lucide-react';
import {
  generateClaimTraceExecutiveReport,
  generateClaimTraceInterventionCampaign,
} from '../../services/claimtraceOrchestratorService';

const PIE_COLORS = ['#059669', '#f59e0b', '#f97316', '#ef4444'];

const colorMap = {
  blue: '#3b82f6',
  green: '#059669',
  purple: '#a855f7',
  cyan: '#06b6d4',
  amber: '#f59e0b',
};

// ─── Data Awal Diadaptasi ke Konteks ClaimTrace JKN / BPJS Kesehatan ───
const INITIAL_OVERVIEW = {
  kpis: {
    total_active_cases: 14,
    critical_Waiting_cases: 3,
    cases_opened_7d: 28,
    cases_closed_7d: 24,
    avg_resolution_time_hours: 4.2,
    sla_breach_count: 1,
    active_sessions: 19,
    avg_sentiment_score: 0.942,
  },
  active_users: {
    dau: 342,
    wau: 1280,
    mau: 4650,
  },
  insights: {
    ia_summary:
      'Evaluasi 7 hari terakhir menunjukkan kecepatan penyelesaian audit klaim yang stabil (rata-rata 4,2 jam/berkas) dengan peningkatan deteksi pada modus Upcoding Diagnosis Level III (Readmisi < 7 Hari) dan Phantom Billing Rawat Jalan. Pra-skrining FPK otomatis berhasil menurunkan eskalasi sengketa klaim manual sebesar 18,4%.',
    report_generated_at: '2026-10-24T09:30:00Z',
    report_period: '17 Okt 2026 – 24 Okt 2026',
    llm_powered: true,
    patterns: [
      {
        title: 'Lonjakan Upcoding Severity Level III pada FKRTL Regional',
        description:
          'Terdeteksi peningkatan 42% penambahan diagnosis sekunder komorbiditas pada klaim rawat inap dalam 48 jam menjelang kepulangan pasien.',
        trend: 'increasing',
        severity: 'tinggi',
      },
      {
        title: 'Penurunan Klaim Fiktif Rawat Jalan Pasca-Validasi Biometrik',
        description:
          'Konfirmasi kehadiran Lapis 3 Mobile JKN menurunkan pengajuan klaim fisioterapi rawat jalan tanpa bukti kehadiran sebesar 31%.',
        trend: 'decreasing',
        severity: 'rendah',
      },
      {
        title: 'Unbundling Tagihan Laboratorium & Radiologi IGD',
        description:
          'Pola pemecahan tagihan (split billing) antara admisi IGD dan rawat inap hari ke-1 teridentifikasi secara konsisten pada 4 RS mitra.',
        trend: 'stable',
        severity: 'sedang',
      },
    ],
    recommendations: [
      {
        title: 'Wajibkan Lampiran Resume Medis DPJP Terstruktur pada Klaim Level III',
        description:
          'Terapkan validasi kelengkapan bukti kultur laboratorium dan resume medis sebelum persetujuan grouping INA-CBG otomatis.',
        priority: 'tinggi',
        category: 'intervensi',
      },
      {
        title: 'Penerbitan Berita Acara Klarifikasi Bersama (BAKB) Segera',
        description:
          'Jadwalkan rekonsiliasi teknis dengan komite medis dan tim koder casemix 3 RS dengan indeks diskrepansi tarif tertinggi.',
        priority: 'tinggi',
        category: 'edukasi faskes',
      },
      {
        title: 'Perluas Cakupan Verifikasi Pra-Bayar FPK Berkas Ekstrem',
        description:
          'Tingkatkan ambang batas verifikasi pra-bayar untuk klaim katastropik kardiovaskular dan onkologi dengan tarif di atas Rp 50 juta.',
        priority: 'sedang',
        category: 'protokol audit',
      },
    ],
    trending_topics: [
      { topic: 'Readmisi < 30 Hari Tak Terencana', count: 48 },
      { topic: 'Upcoding Severity Level III (Komorbid)', count: 39 },
      { topic: 'Split Billing IGD vs Rawat Inap', count: 31 },
      { topic: 'Phantom Billing Fisioterapi Rawat Jalan', count: 24 },
      { topic: 'Kesesuaian Restriksi Fornas Obat Kronis', count: 18 },
    ],
    severity_distribution: {
      Rendah: 42,
      Sedang: 28,
      Tinggi: 19,
      Kritis: 7,
    },
  },
  alerts: [
    {
      id: 'alt-1',
      claim_id: 'CLM-2026-10-085',
      faskes_name: 'RS Siloam Kebon Jeruk',
      severity: 'critical',
      message:
        'Indikasi Readmisi Cepat Terencana (Readmisi < 7 Hari) pada prosedur PTCA Jantung. Selisih tarif Rp 48,2 Juta.',
      timestamp: '12 menit yang lalu',
    },
    {
      id: 'alt-2',
      claim_id: 'CLM-2026-10-092',
      faskes_name: 'RS Hermina Kemayoran',
      severity: 'critical',
      message:
        'Sengketa Klaim Farmasi Kronis: Peresepan albumin dan antibiotik lini 3 melampaui restriksi e-Katalog/Fornas.',
      timestamp: '28 menit yang lalu',
    },
    {
      id: 'alt-3',
      claim_id: 'CLM-2026-10-077',
      faskes_name: 'RS Mitra Keluarga Kelapa Gading',
      severity: 'high',
      message:
        'Diskrepansi Kehadiran Pasien: Validasi Mobile JKN tidak mendeteksi presensi biometrik pada 3 sesi rehabilitasi medik.',
      timestamp: '45 menit yang lalu',
    },
    {
      id: 'alt-4',
      claim_id: 'CLM-2026-10-104',
      faskes_name: 'RSUD Pasar Minggu',
      severity: 'medium',
      message:
        'Batas Waktu SLA 10 Hari Kerja: Berkas klaim pending resume medis DPJP tersisa 48 jam sebelum auto-approval regulasi.',
      timestamp: '1 jam yang lalu',
    },
  ],
};

const INITIAL_TRENDS = {
  cases_opened_trend: [
    { date: '2026-10-18', value: 18 },
    { date: '2026-10-19', value: 24 },
    { date: '2026-10-20', value: 29 },
    { date: '2026-10-21', value: 22 },
    { date: '2026-10-22', value: 31 },
    { date: '2026-10-23', value: 27 },
    { date: '2026-10-24', value: 28 },
  ],
  cases_closed_trend: [
    { date: '2026-10-18', value: 15 },
    { date: '2026-10-19', value: 20 },
    { date: '2026-10-20', value: 26 },
    { date: '2026-10-21', value: 25 },
    { date: '2026-10-22', value: 28 },
    { date: '2026-10-23', value: 24 },
    { date: '2026-10-24', value: 24 },
  ],
  sentiment_trend: [
    { date: '2026-10-18', value: 92.1 },
    { date: '2026-10-19', value: 93.4 },
    { date: '2026-10-20', value: 91.8 },
    { date: '2026-10-21', value: 94.2 },
    { date: '2026-10-22', value: 95.0 },
    { date: '2026-10-23', value: 93.8 },
    { date: '2026-10-24', value: 94.2 },
  ],
  auditor_trend: [
    { date: '2026-10-18', value: 318 },
    { date: '2026-10-19', value: 324 },
    { date: '2026-10-20', value: 329 },
    { date: '2026-10-21', value: 335 },
    { date: '2026-10-22', value: 338 },
    { date: '2026-10-23', value: 340 },
    { date: '2026-10-24', value: 342 },
  ],
};

const INITIAL_VERIFIKATORS = [
  {
    id: 'v-1',
    name: 'dr. Hendra Kurniawan, Sp.A',
    specialization: 'Verifikator Medis Pediatri & Neonatologi',
    rating: 4.9,
    years_of_experience: 8,
    is_available: true,
    total_patients: 24,
    total_appointments: 58,
    completed_appointments: 52,
    upcoming_appointments: 3,
  },
  {
    id: 'v-2',
    name: 'dr. Ratna Dewi, Sp.JP(K)',
    specialization: 'Verifikator Medis Kardiovaskular & Bedah Jantung',
    rating: 4.8,
    years_of_experience: 12,
    is_available: true,
    total_patients: 18,
    total_appointments: 50,
    completed_appointments: 44,
    upcoming_appointments: 4,
  },
  {
    id: 'v-3',
    name: 'apt. Siti Rahmawati, S.Farm, M.Clin.Pharm',
    specialization: 'Verifikator Kepatuhan Fornas & Farmasi Klinis',
    rating: 4.9,
    years_of_experience: 6,
    is_available: true,
    total_patients: 15,
    total_appointments: 36,
    completed_appointments: 34,
    upcoming_appointments: 2,
  },
  {
    id: 'v-4',
    name: 'dr. Bima Santoso, Sp.PD',
    specialization: 'Komite Medis Penyakit Dalam & Evaluasi Readmisi',
    rating: 4.7,
    years_of_experience: 11,
    is_available: true,
    total_patients: 29,
    total_appointments: 64,
    completed_appointments: 55,
    upcoming_appointments: 7,
  },
];

// ─── Tooltips ──────────────────────────────────
function NumberTooltip({ active, payload, label, isLight }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs shadow-xl ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#00153A] border-white/10 text-white'
    }`}>
      {label && <p className={`mb-1 font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{label}</p>}
      {payload.map((item, index) => (
        <p key={`${item.name ?? 'metric'}-${index}`} className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {item.name ?? 'Nilai'}: <span className={`font-mono ${isLight ? 'text-emerald-700 font-bold' : 'text-cyan-300'}`}>{Number(item.value).toFixed(1)}</span>
        </p>
      ))}
    </div>
  );
}

function MiniTooltip({ active, payload, isLight }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-lg border px-2 py-1 text-xs font-semibold font-mono shadow-md ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#00153A] border-white/10 text-white'
    }`}>
      {Number(payload[0].value).toFixed(1)}
    </div>
  );
}

// ─── KPICard ─────────
function KPICard({ title, value, subtitle, trend, icon, severity = 'info', isLight }) {
  const cardStyleClass = isLight 
    ? 'border-slate-200 bg-white shadow-xs text-slate-900' 
    : 'border-white/10 bg-white/5 shadow-black/20 text-white';

  const iconStyleClass = {
    critical: isLight ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    warning: isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    success: isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    info: isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/80',
  }[severity] || (isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/80');

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${cardStyleClass}`}
    >
      <div className="relative space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className={`text-xs font-semibold uppercase tracking-wide text-balance ${
              isLight ? 'text-slate-500' : 'text-white/60'
            }`}>
              {title}
            </div>
            <div className={`text-3xl font-bold tabular-nums tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{value}</div>
          </div>
          {icon && (
            <div className={`p-2.5 rounded-xl border ${iconStyleClass}`}>
              {icon}
            </div>
          )}
        </div>

        {(subtitle || trend) && (
          <div className="flex items-center justify-between text-xs">
            {subtitle && <span className={isLight ? 'text-slate-600' : 'text-white/50'}>{subtitle}</span>}
            {trend && (
              <div
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-semibold ${
                  trend.direction === 'up'
                    ? isLight
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : isLight
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {trend.direction === 'up' ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                <span className="font-mono">
                  {trend.value.toFixed(1)}
                  {trend.label || '%'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── MicroTrendCard ────────
function getTrendDirection(values) {
  if (values.length < 2) return 'flat';
  const previous = values[values.length - 2];
  const current = values[values.length - 1];
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
}

function calculateDeltaPercent(values) {
  if (values.length < 2 || values[values.length - 2] === 0) return 0;
  const previous = values[values.length - 2];
  const current = values[values.length - 1];
  return ((current - previous) / previous) * 100;
}

function MicroTrendCard({ title, value, subtitle, data, color, icon, isLight }) {
  const values = data.map((point) => point.value);
  const direction = getTrendDirection(values);
  const delta = Math.abs(calculateDeltaPercent(values));
  const hasSparkline = data.length > 1;

  const yMin = values.length > 0 
    ? Math.max(0, Math.min(...values) - (Math.max(...values) - Math.min(...values) || 2) * 0.25)
    : 0;
  const yMax = values.length > 0
    ? Math.max(...values) + (Math.max(...values) - Math.min(...values) || 2) * 0.25
    : 100;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-2xl border p-4 transition-all duration-300 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-emerald-500/40'
          : 'border-white/10 bg-[#00153A]/80 backdrop-blur-md shadow-xl shadow-[#00081c]/40 hover:border-white/20 text-white'
      }`}
      aria-label={`${title} metric`}
    >
      <div className={`mb-3 flex items-start justify-between ${!hasSparkline ? 'mb-0' : ''}`}>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider text-balance ${
            isLight ? 'text-slate-500' : 'text-white/50'
          }`}>{title}</p>
          <p className={`text-2xl font-bold mt-0.5 tabular-nums tracking-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>{value}</p>
          <p className={`text-xs mt-0.5 text-pretty ${
            isLight ? 'text-slate-600' : 'text-white/50'
          }`}>{subtitle}</p>
        </div>
        {hasSparkline ? (
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${
              direction === 'up'
                ? isLight
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : direction === 'down'
                ? isLight
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : isLight
                ? 'bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-white/10 text-white/70 border-white/15'
            }`}
          >
            {direction === 'up' && <ArrowUp className="h-3 w-3" />}
            {direction === 'down' && <ArrowDown className="h-3 w-3" />}
            {direction === 'flat' ? 'Stabil' : `${delta.toFixed(1)}%`}
          </div>
        ) : (
          icon && (
            <div className={`rounded-xl border p-2 ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10'
            }`}>
              {icon}
            </div>
          )
        )}
      </div>

      {hasSparkline && (
        <div className="h-16 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <YAxis hide domain={[yMin, yMax]} />
              <Tooltip content={<MiniTooltip isLight={isLight} />} cursor={false} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={colorMap[color]}
                strokeWidth={2}
                fill={colorMap[color]}
                fillOpacity={isLight ? 0.25 : 0.2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.article>
  );
}

function MicroTrendsGrid({ trends, sentimentValue, avgResolutionHours, activeUsers, isLight }) {
  const auditorPoints = trends?.auditor_trend ?? [];
  const sentimentPoints = trends?.sentiment_trend ?? [];
  const openedPoints = trends?.cases_opened_trend ?? [];
  const closedPoints = trends?.cases_closed_trend ?? [];

  const dauLabel = activeUsers ? String(activeUsers.dau) : (auditorPoints.length ? String(auditorPoints[auditorPoints.length - 1].value) : '342');
  const dauSub = '128 FKRTL · 214 Verifikator Medis';

  return (
    <section
      aria-label="Metrik operasional klaim"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <MicroTrendCard
        isLight={isLight}
        title="Faskes & Auditor Aktif"
        value={dauLabel}
        subtitle={dauSub}
        data={auditorPoints}
        color="cyan"
      />
      <MicroTrendCard
        isLight={isLight}
        title="Indeks Kepatuhan FKRTL"
        value={typeof sentimentValue === 'number' ? `${sentimentValue.toFixed(1)}%` : '94.2%'}
        subtitle="Skor konkordansi klinis & INA-CBG"
        data={sentimentPoints}
        color="blue"
      />
      <MicroTrendCard
        isLight={isLight}
        title="Volume Klaim Masuk"
        value={openedPoints.length ? `${openedPoints[openedPoints.length - 1].value}` : '28'}
        subtitle="Batch pengajuan FPK harian terbaru"
        data={openedPoints}
        color="purple"
      />
      <MicroTrendCard
        isLight={isLight}
        title="Kecepatan Verifikasi"
        value={typeof avgResolutionHours === 'number' ? `${avgResolutionHours.toFixed(1)}j` : '4.2j'}
        subtitle="Rata-rata waktu penyelesaian berkas"
        data={closedPoints}
        color="green"
      />
    </section>
  );
}

// ─── InteractiveMetricsCharts ──────────────────────────────────────
function InteractiveMetricsCharts({ overview, trends, isLight }) {
  const [activeSeverity, setActiveSeverity] = useState(0);
  const [caseMode, setCaseMode] = useState('all');

  const severityData = useMemo(() => {
    const source = overview.insights.severity_distribution;
    if (!source) return [];
    return [
      { name: 'Rendah', value: source.Rendah },
      { name: 'Sedang', value: source.Sedang },
      { name: 'Tinggi', value: source.Tinggi },
      { name: 'Kritis', value: source.Kritis },
    ].filter((item) => item.value > 0);
  }, [overview.insights.severity_distribution]);

  const totalClaimsCount = useMemo(
    () => severityData.reduce((acc, curr) => acc + curr.value, 0),
    [severityData]
  );

  const topicData = useMemo(
    () =>
      [...(overview.insights.trending_topics ?? [])]
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
    [overview.insights.trending_topics]
  );

  const lifecycleData = useMemo(() => {
    if (!trends) return [];
    const opened = trends.cases_opened_trend;
    const closed = trends.cases_closed_trend;

    return opened.map((point, index) => ({
      date: new Date(point.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
      opened: point.value ?? 0,
      closed: closed[index]?.value ?? 0,
    }));
  }, [trends]);

  const gridStroke = isLight ? 'rgba(148, 163, 184, 0.25)' : 'rgba(255,255,255,0.08)';
  const axisStroke = isLight ? '#64748b' : 'rgba(255,255,255,0.5)';

  return (
    <section
      className="grid grid-cols-1 gap-5 xl:grid-cols-3"
      aria-label="Grafik interaktif pengawasan klaim"
    >
      <article className={`rounded-2xl border p-5 shadow-sm xl:col-span-2 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900'
          : 'border-white/10 bg-[#00153A]/85 backdrop-blur-xl shadow-2xl text-white'
      }`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Tren Siklus Verifikasi Klaim</h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
              Perbandingan laju berkas masuk harian vs penyelesaian audit klaim
            </p>
          </div>
          <div className={`inline-flex rounded-xl border p-1 gap-1 ${
            isLight ? 'bg-slate-100 border-slate-300' : 'border-white/10 bg-white/5'
          }`}>
            <button
              type="button"
              onClick={() => setCaseMode('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                caseMode === 'all'
                  ? isLight
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'bg-white/20 text-white font-bold shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setCaseMode('opened')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                caseMode === 'opened'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Berkas Masuk
            </button>
            <button
              type="button"
              onClick={() => setCaseMode('closed')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                caseMode === 'closed'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Berkas Selesai
            </button>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lifecycleData}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke={axisStroke} tick={{ fontSize: 11 }} />
              <YAxis stroke={axisStroke} tick={{ fontSize: 11 }} />
              <Tooltip content={<NumberTooltip isLight={isLight} />} cursor={false} />
              <Legend verticalAlign="bottom" height={32} wrapperStyle={{ paddingTop: '8px', color: isLight ? '#334155' : 'rgba(255,255,255,0.8)', fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="opened"
                stroke="#2563eb"
                strokeWidth={caseMode === 'opened' ? 3.5 : caseMode === 'all' ? 2.5 : 1.5}
                strokeOpacity={caseMode === 'closed' ? 0.35 : 1}
                dot={{ r: 3, fill: '#2563eb' }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
                name="Berkas Masuk"
              />
              <Line
                type="monotone"
                dataKey="closed"
                stroke="#059669"
                strokeWidth={caseMode === 'closed' ? 3.5 : caseMode === 'all' ? 2.5 : 1.5}
                strokeOpacity={caseMode === 'opened' ? 0.35 : 1}
                dot={{ r: 3, fill: '#059669' }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
                name="Berkas Selesai"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className={`rounded-2xl border p-5 shadow-sm ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900'
          : 'border-white/10 bg-[#00153A]/85 backdrop-blur-xl shadow-2xl text-white'
      }`}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Proporsi Tingkat Risiko Klaim</h3>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-white/70'
          }`}>
            {totalClaimsCount} Total
          </span>
        </div>
        <div className="relative h-56 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={severityData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={76}
                activeIndex={activeSeverity}
                onMouseEnter={(_, index) => setActiveSeverity(index)}
                paddingAngle={3}
                isAnimationActive={false}
              >
                {severityData.map((entry, index) => (
                  <Cell
                    key={`${entry.name}-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<NumberTooltip isLight={isLight} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-2xl font-bold tabular-nums tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {totalClaimsCount}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
              Total Klaim
            </span>
          </div>
        </div>
        <ul className={`mt-3 space-y-1.5 text-xs ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
          {severityData.map((item, index) => (
            <li key={item.name} className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-2 font-medium ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                />
                Risiko {item.name}
              </span>
              <span className={`font-semibold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.value} berkas</span>
            </li>
          ))}
        </ul>
      </article>

      <article className={`rounded-2xl border p-5 shadow-sm xl:col-span-3 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900'
          : 'border-white/10 bg-[#00153A]/85 backdrop-blur-xl shadow-2xl text-white'
      }`}>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Topik Modus Anomali Klaim Tertinggi
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
              Distribusi pola kecurangan dan potensi sengketa klaim paling dominan pada audit berkas FKRTL
            </p>
          </div>
          <span className={`self-start sm:self-auto text-xs font-semibold px-2.5 py-1 rounded-full border ${
            isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
          }`}>
            Total 160 Temuan
          </span>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topicData} layout="vertical" margin={{ left: 10, right: 65, top: 10, bottom: 10 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
              <XAxis type="number" stroke={axisStroke} tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="topic"
                type="category"
                stroke={axisStroke}
                tick={{ fontSize: 11, fill: isLight ? '#1e293b' : '#f1f5f9', fontWeight: 500 }}
                width={250}
              />
              <Tooltip content={<NumberTooltip isLight={isLight} />} cursor={{ fill: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255, 255, 255, 0.05)' }} />
              <Bar
                dataKey="count"
                radius={[0, 8, 8, 0]}
                isAnimationActive={false}
                name="Temuan Berkas"
              >
                {topicData.map((_, index) => {
                  const barColorsLight = ['#e11d48', '#ea580c', '#d97706', '#0284c7', '#059669'];
                  const barColorsDark = ['#f43f5e', '#fb923c', '#fbbf24', '#38bdf8', '#34d399'];
                  return (
                    <Cell
                      key={`topic-cell-${index}`}
                      fill={isLight ? barColorsLight[index % barColorsLight.length] : barColorsDark[index % barColorsDark.length]}
                    />
                  );
                })}
                <LabelList
                  dataKey="count"
                  position="right"
                  formatter={(val) => `${val} berkas`}
                  fill={isLight ? '#0f172a' : '#ffffff'}
                  fontSize={11}
                  fontWeight={700}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}

// ─── OnDutyVerifikatorsPanel ────────
function classifyWorkload(upcomingAppointments) {
  const percentage = Math.min(100, Math.max(15, Math.round((upcomingAppointments / 8) * 100)));
  if (upcomingAppointments <= 2) {
    return {
      label: 'Optimal',
      textClass: 'text-emerald-600 dark:text-emerald-400 font-bold',
      barClass: 'bg-emerald-500',
      width: percentage,
    };
  }
  if (upcomingAppointments <= 4) {
    return {
      label: 'Sedang',
      textClass: 'text-amber-600 dark:text-amber-400 font-bold',
      barClass: 'bg-amber-500',
      width: percentage,
    };
  }
  return {
    label: 'Padat',
    textClass: 'text-rose-600 dark:text-rose-400 font-bold',
    barClass: 'bg-rose-500',
    width: percentage,
  };
}

function OnDutyVerifikatorsPanel({ counselors, onManageCounselors, isLight }) {
  const onDutyCounselors = counselors.filter((c) => c.is_available);
  const [allocationNotice, setAllocationNotice] = useState(null);

  const handleRebalance = () => {
    onManageCounselors();
    setAllocationNotice('Beban antrean berkas klaim berhasil diseimbangkan secara proporsional ke 4 Verifikator Medis Bertugas.');
    setTimeout(() => {
      setAllocationNotice(null);
    }, 4500);
  };

  return (
    <section
      className={`rounded-2xl border p-5 transition-all ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'border-white/10 bg-[#00153A]/85 backdrop-blur-xl shadow-xl shadow-[#00081c]/50 text-white'
      }`}
      aria-label="Verifikator medis bertugas"
    >
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Verifikator Medis Bertugas (On-Duty)
          </h2>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
            Ketersediaan langsung, indeks akurasi audit, dan beban antrean berkas FPK
          </p>
        </div>
        <button
          type="button"
          onClick={handleRebalance}
          className={`inline-flex items-center self-start sm:self-auto rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
            isLight
              ? 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 border-slate-300'
              : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white hover:border-emerald-500/40'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
          Alokasikan Beban Verifikator
        </button>
      </div>

      <AnimatePresence>
        {allocationNotice && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
              isLight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{allocationNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setAllocationNotice(null)}
              className="text-xs opacity-60 hover:opacity-100 cursor-pointer p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className={`rounded-xl border p-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'border-white/10 bg-white/5'
        }`}>
          <div className={`mb-1 flex items-center gap-2 text-xs font-medium ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            <Users className={`h-4 w-4 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
            Verifikator Siaga
          </div>
          <p className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{onDutyCounselors.length} Auditor</p>
        </div>
        <div className={`rounded-xl border p-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'border-white/10 bg-white/5'
        }`}>
          <div className={`mb-1 flex items-center gap-2 text-xs font-medium ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            Skor Akurasi Audit
          </div>
          <p className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {(
              onDutyCounselors.reduce((acc, item) => acc + item.rating, 0) /
              onDutyCounselors.length
            ).toFixed(1)}{' '}
            / 5.0
          </p>
        </div>
        <div className={`rounded-xl border p-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'border-white/10 bg-white/5'
        }`}>
          <div className={`mb-1 flex items-center gap-2 text-xs font-medium ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            <Clock className="h-4 w-4 text-cyan-500" />
            Rata-Rata Masa Kerja
          </div>
          <p className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {Math.round(
              onDutyCounselors.reduce((acc, item) => acc + (item.years_of_experience ?? 0), 0) /
                onDutyCounselors.length
            )}{' '}
            thn
          </p>
        </div>
      </div>

      <div className={`overflow-x-auto border rounded-xl ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <table className="min-w-full">
          <thead>
            <tr className={`border-b text-left text-xs font-semibold uppercase tracking-wide ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'border-white/10 text-white/60 bg-white/5'
            }`}>
              <th className="px-4 py-2.5">Verifikator Medis</th>
              <th className="px-4 py-2.5">Berkas Ditangani</th>
              <th className="px-4 py-2.5">Ketepatan SLA</th>
              <th className="px-4 py-2.5">Beban Antrean</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isLight ? 'divide-slate-200 bg-white' : 'divide-white/5'}`}>
            {onDutyCounselors.map((counselor, index) => {
              const completionRate =
                counselor.total_appointments > 0
                  ? (counselor.completed_appointments / counselor.total_appointments) * 100
                  : 0;
              const workload = classifyWorkload(counselor.upcoming_appointments);
              return (
                <motion.tr
                  key={counselor.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
                >
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col">
                      <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{counselor.name}</span>
                      <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>{counselor.specialization}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                    {counselor.total_patients} berkas
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                      completionRate >= 92
                        ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : completionRate >= 88
                        ? isLight ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : isLight ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {completionRate.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={workload.textClass}>{workload.label}</span>
                        <span className={isLight ? 'text-slate-500' : 'text-white/60'}>
                          {counselor.upcoming_appointments} antrean baru
                        </span>
                      </div>
                      <div className={`h-1.5 w-full rounded-full ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                        <div
                          className={`h-1.5 rounded-full ${workload.barClass}`}
                          style={{ width: `${workload.width}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── InsightsPanelCard ────────
function TrendIcon({ trend }) {
  if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-rose-500" />;
  if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-emerald-500" />;
  return <Minus className="w-4 h-4 text-amber-500" />;
}

function getSeverityBadge(severity, isLight) {
  if (severity === 'tinggi') return isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  if (severity === 'sedang') return isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  return isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
}

function PriorityIcon({ priority }) {
  if (priority === 'tinggi') return <AlertTriangle className="w-4 h-4 text-rose-500" />;
  if (priority === 'sedang') return <Info className="w-4 h-4 text-amber-500" />;
  return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
}

function getCategoryColor(category, isLight) {
  if (category === 'intervensi')
    return isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-50 text-rose-700 border border-rose-200';
  if (category === 'protokol audit')
    return isLight ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-50 text-blue-700 border border-blue-200';
  if (category === 'edukasi faskes' || category === 'communication')
    return isLight ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-purple-50 text-purple-700 border border-purple-200';
  return isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-cyan-50 text-cyan-700 border border-cyan-200';
}

function InsightsPanelCard({ insights, onGenerateReport, onGenerateCampaign, isLight }) {
  const hasInsights = insights.ia_summary && insights.ia_summary.trim().length > 0;
  const hasPatterns = insights.patterns && insights.patterns.length > 0;
  const hasRecommendations = insights.recommendations && insights.recommendations.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-2xl border overflow-hidden transition-all ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'border-white/10 bg-[#00153A]/85 backdrop-blur-xl shadow-xl shadow-[#00081c]/50 text-white'
      }`}
    >
      {/* Header */}
      <div className={`px-6 py-4 border-b ${
        isLight
          ? 'bg-slate-50 border-slate-200'
          : 'border-white/10 bg-gradient-to-r from-[#00134A]/80 via-[#00153A]/90 to-[#1C3C80]/40'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Wawasan AI Forensik Klaim (IA)</h3>
            </div>
            {insights.report_generated_at && (
              <div className={`flex items-center gap-2 text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                <span>
                  Diperbarui {new Date(insights.report_generated_at).toLocaleDateString('id-ID')}
                </span>
              </div>
            )}
            {insights.report_period && (
              <div className={`flex items-center gap-2 text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>Periode: {insights.report_period}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onGenerateReport && (
              <button
                type="button"
                onClick={onGenerateReport}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-gradient-to-r from-health-blue-dark to-health-blue hover:from-health-blue hover:to-health-blue-light border border-[#FFCA40]/40 text-white shadow-[#00081c]/50'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isLight ? 'text-white' : 'text-[#FFCA40]'}`} />
                Buat Laporan
              </button>
            )}
            {onGenerateCampaign && hasInsights && (
              <button
                type="button"
                onClick={onGenerateCampaign}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  isLight
                    ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                <BellRing className="w-3.5 h-3.5" />
                Intervensi Faskes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${isLight ? 'text-slate-900' : 'text-white/90'}`}>Ringkasan Eksekutif</h4>
          <p className={`text-sm leading-relaxed rounded-xl p-4 border ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-white/5 border-white/10 text-white/70'
          }`}>{insights.ia_summary}</p>
        </div>

        {hasPatterns && (
          <div>
            <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white/90'
            }`}>
              <Lightbulb className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
              Pola Anomali Teridentifikasi
            </h4>
            <div className="space-y-2.5">
              {insights.patterns.map((pattern, index) => (
                <div
                  key={index}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 hover:border-emerald-500/40'
                      : 'bg-white/5 border-white/10 hover:border-[#FFCA40]/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <TrendIcon trend={pattern.trend} />
                      <span className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{pattern.title}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full border uppercase ${getSeverityBadge(
                        pattern.severity,
                        isLight
                      )}`}
                    >
                      {pattern.severity}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed pl-6 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                    {pattern.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasRecommendations && (
          <div>
            <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white/90'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Rekomendasi Tindak Lanjut Audit
            </h4>
            <div className="space-y-2.5">
              {insights.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 hover:border-emerald-500/40'
                      : 'bg-white/5 border-white/10 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <PriorityIcon priority={rec.priority} />
                      <span className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{rec.title}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase border ${getCategoryColor(
                        rec.category,
                        isLight
                      )}`}
                    >
                      {rec.category}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed pl-6 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── ClaimAnomalyOverviewCard ─────────────
function ClaimAnomalyOverviewCard({ trendingTopics, severityDistribution, isLight }) {
  if (!trendingTopics?.length && !severityDistribution) return null;
  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${
      isLight
        ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
        : 'border-white/10 bg-[#00153A]/85 backdrop-blur-xl shadow-xl shadow-[#00081c]/50 text-white'
    }`}>
      {severityDistribution && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-base font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Distribusi Tingkat Keparahan Klaim
            </h3>
            <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Beban Triase FPK</span>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {Object.entries(severityDistribution).map(([level, count]) => (
              <div
                key={level}
                className={`p-3 rounded-xl text-center border ${
                  level === 'Kritis'
                    ? isLight ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-rose-500/15 border-rose-500/30 text-white'
                    : level === 'Tinggi'
                    ? isLight ? 'bg-orange-50 border-orange-200 text-orange-900' : 'bg-orange-500/15 border-orange-500/30 text-white'
                    : level === 'Sedang'
                    ? isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/15 border-amber-500/30 text-white'
                    : isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-500/15 border-emerald-500/30 text-white'
                }`}
              >
                <div
                  className={`text-xl font-bold ${
                    level === 'Kritis'
                      ? isLight ? 'text-rose-700' : 'text-rose-400'
                      : level === 'Tinggi'
                      ? isLight ? 'text-orange-700' : 'text-orange-400'
                      : level === 'Sedang'
                      ? isLight ? 'text-amber-700' : 'text-amber-400'
                      : isLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  {count}
                </div>
                <div className={`text-xs capitalize font-semibold mt-0.5 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>{level}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {trendingTopics && trendingTopics.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Modus Anomali Klaim Dominan
            </h3>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Penapisan Tri-Layer</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTopics.map((topic, index) => {
              const dotColors = [
                'bg-rose-500',
                'bg-orange-500',
                'bg-amber-500',
                'bg-sky-500',
                'bg-emerald-500',
              ];
              const dotClass = dotColors[index % dotColors.length];
              return (
                <span
                  key={topic.topic}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isLight
                      ? 'bg-slate-100 text-slate-800 border-slate-300 hover:border-slate-400 hover:bg-slate-200/60'
                      : 'bg-white/5 text-white/90 border-white/10 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                  <span>{topic.topic}</span>
                  <span className={`text-[11px] font-mono font-bold ml-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    ({topic.count} berkas)
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AlertsFeed ───────────────────────
function AlertsFeed({ alerts, onInspectCase, isLight }) {
  const darkSeverityConfig = {
    critical: {
      icon: Flame,
      color: 'text-rose-400',
      bg: 'bg-rose-500/15',
      border: 'border-rose-500/30',
      label: 'Kritis',
    },
    high: {
      icon: AlertTriangle,
      color: 'text-orange-400',
      bg: 'bg-orange-500/15',
      border: 'border-orange-500/30',
      label: 'Tinggi',
    },
    medium: {
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30',
      label: 'Sedang',
    },
  };

  const lightSeverityConfig = {
    critical: {
      icon: Flame,
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      label: 'Kritis',
    },
    high: {
      icon: AlertTriangle,
      color: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      label: 'Tinggi',
    },
    medium: {
      icon: AlertTriangle,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      label: 'Sedang',
    },
  };

  const severityConfig = isLight ? lightSeverityConfig : darkSeverityConfig;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      isLight
        ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
        : 'border-white/10 bg-[#00153A]/85 backdrop-blur-xl shadow-xl shadow-[#00081c]/50 text-white'
    }`}>
      <div className={`px-6 py-4 border-b ${
        isLight
          ? 'bg-rose-50/50 border-rose-200'
          : 'border-white/10 bg-gradient-to-r from-rose-950/60 via-[#00153A]/90 to-[#00134A]/80'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Peringatan Anomali Klaim Kritis</h3>
          <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${
            isLight
              ? 'bg-rose-100 text-rose-800 border-rose-300'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
          }`}>
            {alerts.length} berkas aktif
          </span>
        </div>
      </div>

      <div className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity] || severityConfig.medium;
          const Icon = config.icon;
          return (
            <div
              key={alert.id}
              role="button"
              tabIndex={0}
              onClick={() => onInspectCase?.(alert.claim_id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onInspectCase?.(alert.claim_id);
                }
              }}
              className={`p-4 transition-all cursor-pointer group flex items-start justify-between gap-3 ${
                isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`p-2 rounded-xl border shrink-0 ${config.bg} ${config.border} ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>{alert.claim_id}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${config.bg} ${config.color} ${config.border}`}>
                        {config.label}
                      </span>
                    </div>
                    <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{alert.timestamp}</span>
                  </div>
                  <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{alert.faskes_name}</p>
                  <p className={`text-xs mt-0.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>{alert.message}</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 mt-2 shrink-0 transition-transform group-hover:translate-x-1 ${
                isLight ? 'text-slate-400 group-hover:text-emerald-700' : 'text-white/30 group-hover:text-[#FFCA40]'
              }`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── QuickLinksPanel ─────────────────
function QuickLinksPanel({ onNavigateTab, isLight }) {
  const links = [
    {
      tab: 'cases_mgmt',
      label: 'Manajemen Berkas Klaim (Cases)',
      description: 'Kelola seluruh berkas klaim yang dieskalasikan Agen Manajemen Klaim (CMA) & pantau SLA 10 HK',
      icon: <Briefcase className="h-5 w-5 text-rose-500" />,
    },
    {
      tab: 'quick_triage',
      label: 'Triase Cepat Klaim (Quick Triage)',
      description: 'Buat berkas audit klaim manual via CMA dan kelola antrean prioritas SLA FKRTL',
      icon: <Zap className="h-5 w-5 text-amber-500" />,
    },
    {
      tab: 'flagged_sessions',
      label: 'Sesi Klaim Ditandai (Flagged)',
      description: 'Tinjau penandaan anomali SEP, sangkalan presensi Lapis 3, dan diskrepansi resume medis',
      icon: <Flag className="h-5 w-5 text-orange-500" />,
    },
    {
      tab: 'appointments',
      label: 'Jadwal Klarifikasi Medis (Appointments)',
      description: 'Kelola jadwal klarifikasi klaim antara FKRTL/DPJP, Tim Casemix, dan Verifikator BPJS',
      icon: <Calendar className="h-5 w-5 text-cyan-500" />,
    },
    {
      tab: 'insights',
      label: 'Analitik Wawasan & Privasi (IA)',
      description: 'Kueri agregat k-anonymity (k ≥ 5), anggaran ε, dan kepatuhan UU PDP',
      icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
    },
    {
      tab: 'retention',
      label: 'Analitik Retensi & Kohort',
      description: 'Pantau keaktifan harian & bulanan verifikator, volume telaah berkas, dan kepatuhan kohort faskes',
      icon: <Activity className="h-5 w-5 text-blue-500" />,
    },
    {
      tab: 'profile',
      label: 'Profil Verifikator',
      description: 'Tinjau kredensial auditor medis dan log diagnostik sesi perangkat',
      icon: <Users className="h-5 w-5 text-purple-500" />,
    },
    {
      tab: 'settings',
      label: 'Pengaturan Sistem',
      description: 'Konfigurasi ambang batas deteksi anomali dan parameter operasional',
      icon: <Settings className="h-5 w-5 text-teal-500" />,
    },
  ];

  return (
    <section
      aria-label="Pintasan modul pengawasan"
      className={`rounded-2xl border p-5 transition-all ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'border-white/10 bg-[#00153A]/85 backdrop-blur-xl shadow-xl shadow-[#00081c]/50 text-white'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Pintasan Modul Pengawasan</h2>
        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Navigasi cepat antar-modul</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((link) => (
          <button
            key={link.label}
            type="button"
            onClick={() => onNavigateTab?.(link.tab)}
            className={`group text-left rounded-xl border p-3.5 transition-all duration-200 cursor-pointer ${
              isLight
                ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-emerald-500/40 text-slate-900'
                : 'border-white/10 bg-white/5 hover:border-[#FFCA40]/40 hover:bg-white/10 text-white'
            }`}
          >
            <div className={`mb-1.5 flex items-center gap-2.5 text-sm font-semibold ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <span className={`rounded-lg p-1.5 group-hover:scale-105 transition-transform border ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-white/10 border-white/10'
              }`}>{link.icon}</span>
              {link.label}
            </div>
            <p className={`text-xs leading-relaxed transition-colors ${
              isLight ? 'text-slate-600 group-hover:text-slate-800' : 'text-white/60 group-hover:text-white/80'
            }`}>{link.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

// ─── Main ExecutiveHub Component ─────────────
export default function ExecutiveHub({
  onNavigateTab,
  onInspectCase,
  onNavigateToQueue,
  onNavigateToEmpirical,
  onSelectCriticalCase,
  isLight: propIsLight,
}) {
  const [internalIsLight, setInternalIsLight] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('theme') === 'light') return true;
      const root = document.getElementById('cockpit-root');
      if (root?.classList.contains('theme-light')) return true;
    }
    return false;
  });

  useEffect(() => {
    const root = document.getElementById('cockpit-root');
    if (!root) return;
    const observer = new MutationObserver(() => {
      const isLightMode = root.classList.contains('theme-light');
      setInternalIsLight(isLightMode);
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const isLight = typeof propIsLight === 'boolean' ? propIsLight : internalIsLight;

  const [overview, setOverview] = useState(INITIAL_OVERVIEW);
  const [trends] = useState(INITIAL_TRENDS);
  const [counselors, setCounselors] = useState(INITIAL_VERIFIKATORS);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [reportType, setReportType] = useState('mingguan');
  const [useLLM, setUseLLM] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaignGenerated, setCampaignGenerated] = useState(null);
  const [timeRange, setTimeRange] = useState(7);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLiveOverviewData = async () => {
    try {
      const [resClaims, resRisk] = await Promise.allSettled([
        fetch('http://localhost:8000/api/v1/claims'),
        fetch('http://localhost:8000/api/v1/duckdb/tools/financial-risk-summary')
      ]);

      let activeClaims = [];
      if (resClaims.status === 'fulfilled' && resClaims.value.ok) {
        activeClaims = await resClaims.value.json();
      }

      let riskSummary = null;
      if (resRisk.status === 'fulfilled' && resRisk.value.ok) {
        riskSummary = await resRisk.value.json();
      }

      if (activeClaims.length > 0 || riskSummary?.summary_lanes) {
        const criticalCount = activeClaims.filter(c => c?.triage?.triage_lane === 'MERAH' || c?.claim?.priority_score >= 80).length;

        setOverview(prev => ({
          ...prev,
          kpis: {
            ...prev.kpis,
            total_active_cases: activeClaims.length > 0 ? activeClaims.length : prev.kpis.total_active_cases,
            critical_Waiting_cases: criticalCount > 0 ? criticalCount : prev.kpis.critical_Waiting_cases,
          },
          insights: {
            ...prev.insights,
            severity_distribution: {
              Rendah: activeClaims.filter(c => c?.triage?.triage_lane === 'HIJAU').length || prev.insights.severity_distribution.Rendah,
              Sedang: activeClaims.filter(c => c?.triage?.triage_lane === 'KUNING').length || prev.insights.severity_distribution.Sedang,
              Tinggi: activeClaims.filter(c => c?.triage?.triage_lane === 'MERAH' && c?.triage?.final_priority_score < 85).length || prev.insights.severity_distribution.Tinggi,
              Kritis: activeClaims.filter(c => c?.triage?.triage_lane === 'MERAH' && c?.triage?.final_priority_score >= 85).length || prev.insights.severity_distribution.Kritis,
            }
          }
        }));
      }
    } catch (e) {
      console.warn('[ExecutiveHub] Live backend sync fallback to deterministic baseline:', e);
    }
  };

  useEffect(() => {
    fetchLiveOverviewData();
  }, []);

  const handleRefreshData = () => {
    setIsRefreshing(true);
    fetchLiveOverviewData().finally(() => {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    });
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await generateClaimTraceExecutiveReport(reportType);
      setOverview((prev) => ({
        ...prev,
        insights: {
          ...prev.insights,
          report_generated_at: new Date().toISOString(),
          report_period:
            reportType === 'mingguan'
              ? `7 Hari Terakhir (${res.modelUsed} · ${res.durationMs}ms)`
              : reportType === 'bulanan'
                ? `30 Hari Terakhir (${res.modelUsed} · ${res.durationMs}ms)`
                : `Periode Kustom (${res.modelUsed} · ${res.durationMs}ms)`,
          ia_summary: res.summary,
        },
      }));
    } catch (err) {
      console.warn('[ExecutiveHub] Report generation fallback:', err);
    } finally {
      setIsGenerating(false);
      setIsReportModalOpen(false);
    }
  };

  const handleGenerateCampaignConfig = async () => {
    setIsGenerating(true);
    try {
      const res = await generateClaimTraceInterventionCampaign(
        'Fasilitasi Koreksi Tarif Upcoding Rawat Inap & Validasi Presensi Mobile JKN'
      );
      setCampaignGenerated(res);
    } catch (err) {
      console.warn('[ExecutiveHub] Intervensi campaign generation error, using fallback:', err);
      setCampaignGenerated({
        campaign_name: 'Intervensi Kepatuhan Koding INA-CBG & Pencegahan Readmisi Dini Q4',
        target_audience: 'Tim Casemix RS & Verifikator FKRTL (18 Rumah Sakit Mitra Regional)',
        priority: 'Tinggi',
        message_template:
          'Pemberitahuan Resmi: Seluruh pengajuan klaim INA-CBG Severity Level III wajib menyertakan Resume Medis DPJP terstruktur dan bukti penunjang laboratorium/radiologi sebelum batas SLA 10 Hari Kerja.',
        ai_rationale:
          'Menargetkan 2 modus anomali tertinggi (Upcoding Diagnosis Level III & Phantom Billing Rawat Jalan) yang terdeteksi oleh Agen Analitik Wawasan (IA).',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`space-y-6 pb-8 ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* HEADER ATAS */}
      <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b pb-4 ${
        isLight ? 'border-slate-200' : 'border-white/10'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border shadow-sm ${
            isLight
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-gradient-to-tr from-health-blue-dark to-health-blue border-white/10 text-white'
          }`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className={`text-base font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Pusat Komando &amp; Analitik Eksekutif JKN
              </h1>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold shrink-0 ${
                isLight
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                LIVE
              </span>
            </div>
            <p className={`text-xs mt-0.5 truncate ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
              Pemantauan pra-pembayaran klaim FKRTL, konkordansi INA-CBG, dan kepatuhan SLA 10 Hari Kerja
            </p>
          </div>
        </div>

        {/* Kontrol Eksekutif: Rentang Waktu, Refresh & Buat Laporan */}
        <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 flex-wrap">
          <div className={`inline-flex rounded-xl border p-1 ${
            isLight ? 'bg-slate-100 border-slate-300' : 'border-white/10 bg-white/5'
          }`}>
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setTimeRange(days)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  timeRange === days
                    ? isLight
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'bg-gradient-to-r from-health-blue-dark to-health-blue text-[#FFCA40] border border-[#FFCA40]/40 shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {days} Hari
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm cursor-pointer transition-colors ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'} ${isRefreshing ? 'animate-spin' : ''}`} />
            Perbarui
          </button>

          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-md cursor-pointer transition-all ${
              isLight
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                : 'bg-gradient-to-tr from-health-blue-dark to-health-blue hover:from-health-blue hover:to-health-blue-light border border-[#FFCA40]/40 text-white shadow-[#00081c]/50'
            }`}
          >
            <FileText className={`w-3.5 h-3.5 ${isLight ? 'text-white' : 'text-[#FFCA40]'}`} />
            Ekspor Laporan
          </button>
        </div>
      </div>

      {/* Banner Portofolio Data Transaksi Klaim Resmi BPJS Kesehatan 2024 */}
      <section className={`rounded-2xl p-5 border relative overflow-hidden transition-all ${
        isLight
          ? 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-200 text-slate-900 shadow-sm'
          : 'bg-gradient-to-r from-[#00134A] via-[#001D58] to-[#000c24] text-white shadow-xl shadow-[#00081c]/50 border-white/10'
      }`}>
        <div className={`absolute right-0 top-0 w-96 h-full blur-3xl pointer-events-none ${
          isLight ? 'bg-emerald-400/10' : 'bg-[#FFCA40]/5'
        }`} />
        <div className="relative z-10">
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b pb-3 ${
            isLight ? 'border-emerald-200' : 'border-white/10'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className={`p-2 rounded-xl border ${
                isLight
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-[#FFCA40]/15 border-[#FFCA40]/30 text-[#FFCA40]'
              }`}>
                <Database className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-sm font-bold tracking-tight uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Portofolio Data Transaksi Klaim Resmi BPJS Kesehatan 2024 (100% Ingestion)
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono ${
                    isLight
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-[#FFCA40]/20 text-[#FFCA40] border-[#FFCA40]/40'
                  }`}>
                    Database OLAP In-Memory
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                  1.699.219 Klaim FKRTL · 2.590.751 Master Peserta · Terindeks Seketika (&lt; 1,5 Detik)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono px-2.5 py-1 rounded-xl border ${
                isLight
                  ? 'bg-white text-emerald-800 border-emerald-300 font-bold'
                  : 'bg-white/5 text-[#FFCA40] border border-white/10'
              }`}>
                Formula Henry Lucky (Binus): k = 500 | Lift = 4.81x
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`rounded-xl p-3.5 border transition-all ${
              isLight
                ? 'bg-white border-slate-200 shadow-xs'
                : 'bg-white/5 border-white/10 hover:border-[#FFCA40]/30'
            }`}>
              <p className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Total Portofolio Klaim</p>
              <p className={`text-xl font-bold mt-1 tabular-nums tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Rp 1,535 Triliun</p>
              <p className={`text-[10px] mt-0.5 tabular-nums ${isLight ? 'text-slate-600 font-medium' : 'text-white/50'}`}>1.699.219 Berkas FKRTL</p>
            </div>
            <div className={`rounded-xl p-3.5 border transition-all ${
              isLight
                ? 'bg-white border-slate-200 shadow-xs'
                : 'bg-white/5 border-white/10 hover:border-[#FFCA40]/30'
            }`}>
              <p className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Temuan Anomali Hari Sama</p>
              <p className={`text-xl font-bold mt-1 tabular-nums tracking-tight ${isLight ? 'text-amber-700' : 'text-[#FFCA40]'}`}>Rp 32,59 Miliar</p>
              <p className={`text-[10px] mt-0.5 tabular-nums ${isLight ? 'text-amber-800 font-medium' : 'text-[#FFE08C]/80'}`}>4.876 Pasang Klaim Ganda</p>
            </div>
            <div className={`rounded-xl p-3.5 border transition-all ${
              isLight
                ? 'bg-white border-slate-200 shadow-xs'
                : 'bg-white/5 border-white/10 hover:border-rose-500/30'
            }`}>
              <p className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Klaim Lintas 2 RS Hari Sama</p>
              <p className={`text-xl font-bold mt-1 tabular-nums tracking-tight ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>2.584 Kasus</p>
              <p className={`text-[10px] mt-0.5 tabular-nums ${isLight ? 'text-rose-800 font-medium' : 'text-rose-300/80'}`}>Rp 19,26 M (Geovelocity Fraud)</p>
            </div>
            <div className={`rounded-xl p-3.5 border transition-all ${
              isLight
                ? 'bg-white border-slate-200 shadow-xs'
                : 'bg-white/5 border-white/10 hover:border-emerald-500/30'
            }`}>
              <p className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Akurasi Audit Kapasitas (k=500)</p>
              <p className={`text-xl font-bold mt-1 tabular-nums tracking-tight ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Precision@k 94.2%</p>
              <p className={`text-[10px] mt-0.5 tabular-nums ${isLight ? 'text-emerald-800 font-medium' : 'text-emerald-300/80'}`}>Beban RS Jujur Hanya 2.1%</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6 KERANGKA KERJA KEAMANAN SIBER & DETEKSI FRAUD */}
      <section aria-label="Postur Keamanan Siber & Anti-Fraud" className={`rounded-2xl border p-4 transition-all ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'border-white/10 bg-[#00153A]/85 backdrop-blur-xl shadow-xl shadow-[#00081c]/50 text-white'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
          isLight ? 'border-slate-200' : 'border-white/10'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
              isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-[#FFCA40]/15 border-[#FFCA40]/30 text-[#FFCA40]'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-xs sm:text-sm font-bold tracking-tight flex items-center gap-1.5 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <span>Postur Keamanan Siber &amp; Anti-Fraud Komprehensif</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isLight
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-[#FFCA40]/20 text-[#FFCA40] border-[#FFCA40]/40'
                }`}>
                  6 Framework Terintegrasi
                </span>
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                Terpetakan ke 818 keahlian keamanan siber berstandar <strong>Keamanan Siber Internasional</strong> &amp; <strong>MITRE F3 v1.1</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Audit Posture: AKTIF &amp; TERVALIDASI</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3">
          <div className={`p-3 rounded-xl border text-left space-y-0.5 transition-colors ${
            isLight ? 'bg-slate-50 border-slate-200 hover:border-rose-400' : 'bg-white/5 border-white/10 hover:border-rose-500/40'
          }`}>
            <span className="text-[9px] font-mono font-bold text-rose-600 dark:text-rose-400 block">MITRE F3 v1.1</span>
            <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>Fight Fraud</span>
            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-white/60'}`}>FA0001 &amp; FA0002 (94 Teknik)</span>
          </div>
          <div className={`p-3 rounded-xl border text-left space-y-0.5 transition-colors ${
            isLight ? 'bg-slate-50 border-slate-200 hover:border-blue-400' : 'bg-white/5 border-white/10 hover:border-blue-500/40'
          }`}>
            <span className="text-[9px] font-mono font-bold text-blue-600 dark:text-blue-400 block">ATT&amp;CK v19.1</span>
            <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>T1078 Valid Accts</span>
            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-white/60'}`}>805 Skills Mapped</span>
          </div>
          <div className={`p-3 rounded-xl border text-left space-y-0.5 transition-colors ${
            isLight ? 'bg-slate-50 border-slate-200 hover:border-emerald-400' : 'bg-white/5 border-white/10 hover:border-emerald-500/40'
          }`}>
            <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block">NIST CSF 2.0</span>
            <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>DE.CM &amp; RS.AN</span>
            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-white/60'}`}>6 Core Functions</span>
          </div>
          <div className={`p-3 rounded-xl border text-left space-y-0.5 transition-colors ${
            isLight ? 'bg-slate-50 border-slate-200 hover:border-purple-400' : 'bg-white/5 border-white/10 hover:border-purple-500/40'
          }`}>
            <span className="text-[9px] font-mono font-bold text-purple-600 dark:text-purple-400 block">MITRE ATLAS</span>
            <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>AML.T0047 Defense</span>
            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Anti-Evasion &amp; Prompt Safe</span>
          </div>
          <div className={`p-3 rounded-xl border text-left space-y-0.5 transition-colors ${
            isLight ? 'bg-slate-50 border-slate-200 hover:border-teal-400' : 'bg-white/5 border-white/10 hover:border-teal-500/40'
          }`}>
            <span className="text-[9px] font-mono font-bold text-teal-600 dark:text-teal-400 block">MITRE D3FEND</span>
            <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>D3-DS &amp; D3-MFA</span>
            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-white/60'}`}>270 Defensive Techniques</span>
          </div>
          <div className={`p-3 rounded-xl border text-left space-y-0.5 transition-colors ${
            isLight ? 'bg-slate-50 border-slate-200 hover:border-indigo-400' : 'bg-white/5 border-white/10 hover:border-indigo-500/40'
          }`}>
            <span className={`text-[9px] font-mono font-bold block ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>NIST AI RMF 1.0</span>
            <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>Measure 0.998</span>
            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Zero-PHI AI Governance</span>
          </div>
        </div>
      </section>

      {/* KPI Cards Grid */}
      <section aria-label="Indikator kinerja utama">
        <div className="mb-3 flex items-center justify-between">
          <h2 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Ringkasan Eksekutif Klaim
          </h2>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Kesehatan operasional verifikasi waktu-nyata</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KPICard
            isLight={isLight}
            title="Berkas Klaim Aktif"
            value={overview.kpis.total_active_cases}
            subtitle={`${overview.kpis.cases_opened_7d} berkas masuk minggu ini`}
            severity="info"
            trend={{
              direction:
                overview.kpis.cases_opened_7d > overview.kpis.cases_closed_7d ? 'up' : 'down',
              value:
                ((overview.kpis.cases_opened_7d - overview.kpis.cases_closed_7d) /
                  Math.max(overview.kpis.cases_closed_7d, 1)) *
                100,
            }}
          />

          <KPICard
            isLight={isLight}
            title="Anomali Kritis Menunggu"
            value={overview.kpis.critical_Waiting_cases}
            subtitle={
              overview.kpis.sla_breach_count > 0
                ? `${overview.kpis.sla_breach_count} mendekati batas SLA 10 HK`
                : 'Seluruh berkas sesuai SLA'
            }
            severity={overview.kpis.critical_Waiting_cases > 0 ? 'critical' : 'success'}
          />

          <KPICard
            isLight={isLight}
            title="Rata-Rata Durasi Audit"
            value={
              overview.kpis.avg_resolution_time_hours
                ? `${overview.kpis.avg_resolution_time_hours.toFixed(1)}j`
                : 'N/A'
            }
            subtitle={`${overview.kpis.cases_closed_7d} berkas selesai minggu ini`}
            severity="info"
          />

          <KPICard
            isLight={isLight}
            title="Sesi Verifikator Aktif"
            value={overview.kpis.active_sessions}
            subtitle={
              overview.kpis.avg_sentiment_score
                ? `Konkordansi Klinis: ${(overview.kpis.avg_sentiment_score * 100).toFixed(0)}%`
                : '24 jam terakhir'
            }
            severity="success"
          />
        </div>
      </section>

      {/* Trend Analysis */}
      <section aria-label="Analisis tren klaim" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Analisis Tren Verifikasi & Anomali
          </h2>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>7 hari terakhir</p>
        </div>

        <MicroTrendsGrid
          isLight={isLight}
          trends={trends}
          sentimentValue={
            overview.kpis.avg_sentiment_score ? overview.kpis.avg_sentiment_score * 100 : null
          }
          avgResolutionHours={overview.kpis.avg_resolution_time_hours}
          activeUsers={overview.active_users}
        />

        <InteractiveMetricsCharts isLight={isLight} overview={overview} trends={trends} />
      </section>

      {/* Operations & Intelligence */}
      <section aria-label="Operasional dan intelijen audit" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Operasional Verifikator & Intelijen Forensik
          </h2>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            Kesiapan verifikator medis, peringatan klaim kritis, dan sintesis AI
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-7">
            <OnDutyVerifikatorsPanel
              isLight={isLight}
              counselors={counselors}
              onManageCounselors={() =>
                setCounselors((prev) => {
                  const isBalanced = prev.every((c) => c.upcoming_appointments === 4);
                  if (!isBalanced) {
                    return prev.map((c) => ({
                      ...c,
                      upcoming_appointments: 4,
                    }));
                  } else {
                    return prev.map((c, idx) => ({
                      ...c,
                      upcoming_appointments: [3, 4, 2, 7][idx % 4],
                    }));
                  }
                })
              }
            />
            <AlertsFeed isLight={isLight} alerts={overview.alerts} onInspectCase={onInspectCase} />
            <ClaimAnomalyOverviewCard
              isLight={isLight}
              trendingTopics={overview.insights.trending_topics}
              severityDistribution={overview.insights.severity_distribution}
            />
          </div>

          <div className="space-y-6 xl:col-span-5">
            <InsightsPanelCard
              isLight={isLight}
              insights={overview.insights}
              onGenerateReport={() => setIsReportModalOpen(true)}
              onGenerateCampaign={() => setIsCampaignModalOpen(true)}
            />
          </div>
        </div>

        {/* Pintasan Modul Pengawasan */}
        <QuickLinksPanel isLight={isLight} onNavigateTab={onNavigateTab} />
      </section>

      {/* Generate Report Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
            isLight ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-black/75 backdrop-blur-md'
          }`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#00153A] border-white/20 text-white'
              }`}
            >
              <div className={`px-6 py-4 border-b flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'border-white/10 bg-gradient-to-r from-[#00134A] to-[#1C3C80]'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-[#FFCA40]/20 border-[#FFCA40]/30 text-[#FFCA40]'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Buat Laporan Wawasan IA</h2>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                      Sintesis otomatis Agen Analitik Wawasan Klaim JKN
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className={`p-1.5 rounded-xl transition cursor-pointer ${
                    isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGenerateReport} className="p-6 space-y-5">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                    isLight ? 'text-slate-600' : 'text-white/60'
                  }`}>
                    Periode Laporan Audit
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {['mingguan', 'bulanan', 'kustom'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setReportType(type)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all capitalize cursor-pointer ${
                          reportType === type
                            ? isLight
                              ? '!bg-emerald-600 !text-white !border-emerald-600 shadow-md font-bold'
                              : '!bg-gradient-to-r !from-health-blue-dark !to-health-blue !text-[#FFCA40] !border-[#FFCA40]/50 shadow-md'
                            : isLight
                            ? '!bg-slate-100 !text-slate-700 !border-slate-300 hover:!bg-slate-200'
                            : '!bg-white/5 !text-white/80 !border-white/10 hover:!bg-white/10 hover:!text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center gap-3">
                    <Cpu className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
                    <div>
                      <p className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Analisis Forensik AI Terpadu
                      </p>
                      <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                        Susun ringkasan pola upcoding, phantom billing, dan rekomendasi intervensi
                      </p>
                    </div>
                  </div>
                  <input aria-label="Kotak centang opsi"
                    type="checkbox"
                    checked={useLLM}
                    onChange={(e) => setUseLLM(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition cursor-pointer ${
                      isLight
                        ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                      isLight
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        : 'bg-gradient-to-r from-health-blue-dark to-health-blue hover:from-health-blue border border-[#FFCA40]/40 text-white shadow-[#00081c]/50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGenerating ? 'Memproses Sintesis...' : 'Buat Laporan Audit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Insights Campaign Modal */}
      <AnimatePresence>
        {isCampaignModalOpen && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
            isLight ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-black/75 backdrop-blur-md'
          }`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-2xl shadow-2xl border w-full max-w-2xl overflow-hidden ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#00153A] border-white/20 text-white'
              }`}
            >
              <div className={`px-6 py-4 border-b flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'border-white/10 bg-gradient-to-r from-[#00134A] to-[#1C3C80]'
              }`}>
                <div className="flex items-center gap-3">
                  <Sparkles className={`w-6 h-6 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
                  <div>
                    <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Buat Program Intervensi Kepatuhan Faskes
                    </h2>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                      AI menyusun instruksi pembinaan Casemix RS berdasarkan temuan anomali klaim
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCampaignGenerated(null);
                    setIsCampaignModalOpen(false);
                  }}
                  className={`p-1.5 rounded-xl transition cursor-pointer ${
                    isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className={`p-4 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                    isLight ? 'text-emerald-700 font-bold' : 'text-[#FFCA40]'
                  }`}>
                    Sumber Temuan Wawasan IA
                  </h3>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                    {overview.insights.ia_summary}
                  </p>
                </div>

                {!campaignGenerated ? (
                  <div className="text-center py-6">
                    <button
                      type="button"
                      onClick={handleGenerateCampaignConfig}
                      disabled={isGenerating}
                      className={`px-6 py-3 font-semibold rounded-xl shadow-md inline-flex items-center gap-2 text-sm cursor-pointer ${
                        isLight
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                          : 'bg-gradient-to-r from-health-blue-dark to-health-blue hover:from-health-blue border border-[#FFCA40]/40 text-white shadow-[#00081c]/50'
                      }`}
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Menyusun Intervensi dengan AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Susun Draf Intervensi Faskes
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border space-y-2 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'border-white/10 bg-white/5'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                          Nama Program Intervensi
                        </span>
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 uppercase">
                          Prioritas {campaignGenerated.priority}
                        </span>
                      </div>
                      <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {campaignGenerated.campaign_name}
                      </p>
                      <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                        <strong className={isLight ? 'text-slate-800' : 'text-white'}>Sasaran Faskes:</strong> {campaignGenerated.target_audience}
                      </p>
                      <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                        <strong className={isLight ? 'text-slate-800' : 'text-white'}>Pesan Pembinaan:</strong> {campaignGenerated.message_template}
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCampaignGenerated(null);
                          setIsCampaignModalOpen(false);
                        }}
                        className={`px-5 py-2.5 text-xs font-semibold rounded-xl shadow-md cursor-pointer ${
                          isLight
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                            : 'bg-gradient-to-r from-health-blue-dark to-health-blue hover:from-health-blue border border-[#FFCA40]/40 text-white shadow-lg'
                        }`}
                      >
                        Setujui & Kirim ke Casemix FKRTL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
