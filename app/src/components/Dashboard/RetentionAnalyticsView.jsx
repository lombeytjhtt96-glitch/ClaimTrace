import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Calendar,
  RefreshCw,
  TrendingUp,
  Users,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Shield,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

// Data aktivitas harian 30 hari terakhir (Verifikator Medis BPJS & Tim Casemix FKRTL)
const INITIAL_DAILY_ACTIVITY = [
  { date: '2026-10-24', activeUsers: 184, totalRequests: 1420 },
  { date: '2026-10-23', activeUsers: 179, totalRequests: 1385 },
  { date: '2026-10-22', activeUsers: 192, totalRequests: 1510 },
  { date: '2026-10-21', activeUsers: 188, totalRequests: 1465 },
  { date: '2026-10-20', activeUsers: 176, totalRequests: 1310 },
  { date: '2026-10-19', activeUsers: 142, totalRequests: 980 },
  { date: '2026-10-18', activeUsers: 138, totalRequests: 925 },
  { date: '2026-10-17', activeUsers: 185, totalRequests: 1440 },
  { date: '2026-10-16', activeUsers: 181, totalRequests: 1390 },
  { date: '2026-10-15', activeUsers: 190, totalRequests: 1495 },
  { date: '2026-10-14', activeUsers: 174, totalRequests: 1290 },
  { date: '2026-10-13', activeUsers: 169, totalRequests: 1245 },
  { date: '2026-10-12', activeUsers: 135, totalRequests: 890 },
  { date: '2026-10-11', activeUsers: 131, totalRequests: 860 },
  { date: '2026-10-10', activeUsers: 178, totalRequests: 1360 },
  { date: '2026-10-09', activeUsers: 172, totalRequests: 1305 },
  { date: '2026-10-08', activeUsers: 168, totalRequests: 1270 },
  { date: '2026-10-07', activeUsers: 175, totalRequests: 1330 },
  { date: '2026-10-06', activeUsers: 164, totalRequests: 1210 },
  { date: '2026-10-05', activeUsers: 129, totalRequests: 840 },
  { date: '2026-10-04', activeUsers: 124, totalRequests: 815 },
  { date: '2026-10-03', activeUsers: 166, totalRequests: 1235 },
  { date: '2026-10-02', activeUsers: 161, totalRequests: 1190 },
  { date: '2026-10-01', activeUsers: 170, totalRequests: 1280 },
  { date: '2026-09-30', activeUsers: 168, totalRequests: 1250 },
  { date: '2026-09-29', activeUsers: 165, totalRequests: 1220 },
  { date: '2026-09-28', activeUsers: 162, totalRequests: 1190 },
  { date: '2026-09-27', activeUsers: 130, totalRequests: 850 },
  { date: '2026-09-26', activeUsers: 126, totalRequests: 820 },
  { date: '2026-09-25', activeUsers: 172, totalRequests: 1290 },
];

// Data retensi kohort kepatuhan FKRTL & Verifikator Medis
const INITIAL_COHORTS = [
  {
    cohort_date: '2026-10-23',
    cohort_size: 48,
    retention: {
      1: { retained_users: 46, retention_rate: 0.9583 },
      7: { retained_users: 0, retention_rate: null },
      30: { retained_users: 0, retention_rate: null },
    },
  },
  {
    cohort_date: '2026-10-20',
    cohort_size: 54,
    retention: {
      1: { retained_users: 51, retention_rate: 0.9444 },
      7: { retained_users: 0, retention_rate: null },
      30: { retained_users: 0, retention_rate: null },
    },
  },
  {
    cohort_date: '2026-10-16',
    cohort_size: 62,
    retention: {
      1: { retained_users: 59, retention_rate: 0.9516 },
      7: { retained_users: 56, retention_rate: 0.9032 },
      30: { retained_users: 0, retention_rate: null },
    },
  },
  {
    cohort_date: '2026-10-12',
    cohort_size: 45,
    retention: {
      1: { retained_users: 42, retention_rate: 0.9333 },
      7: { retained_users: 39, retention_rate: 0.8667 },
      30: { retained_users: 0, retention_rate: null },
    },
  },
  {
    cohort_date: '2026-10-08',
    cohort_size: 58,
    retention: {
      1: { retained_users: 55, retention_rate: 0.9483 },
      7: { retained_users: 52, retention_rate: 0.8966 },
      30: { retained_users: 0, retention_rate: null },
    },
  },
  {
    cohort_date: '2026-10-01',
    cohort_size: 64,
    retention: {
      1: { retained_users: 61, retention_rate: 0.9531 },
      7: { retained_users: 57, retention_rate: 0.8906 },
      30: { retained_users: 0, retention_rate: null },
    },
  },
  {
    cohort_date: '2026-09-24',
    cohort_size: 70,
    retention: {
      1: { retained_users: 67, retention_rate: 0.9571 },
      7: { retained_users: 63, retention_rate: 0.9000 },
      30: { retained_users: 59, retention_rate: 0.8429 },
    },
  },
];

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

// Komponen KpiCard (Dual Theme dengan Watermark Icon & Progress Bar)
function KpiCard({ title, value, subtitle, badge, isLight, icon: Icon, progressPercent, trend }) {
  return (
    <div className={`rounded-2xl border p-5 transition-all relative overflow-hidden group ${
      isLight
        ? 'bg-white border-slate-200 shadow-sm hover:border-emerald-500/50 hover:shadow-md'
        : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl hover:border-[#FFCA40]/40 text-white'
    }`}>
      {Icon && (
        <div className="absolute top-2 right-3 p-2 opacity-10 pointer-events-none transition-transform group-hover:scale-110">
          <Icon className={`w-14 h-14 ${isLight ? 'text-slate-900' : 'text-white'}`} />
        </div>
      )}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className={`text-xs font-semibold uppercase tracking-wider ${
          isLight ? 'text-slate-500' : 'text-white/50'
        }`}>{title}</div>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
            isLight
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
              : 'bg-[#FFCA40]/10 text-[#FFCA40] border-[#FFCA40]/30'
          }`}>
            {badge}
          </span>
        )}
      </div>
      <div className={`mt-2 text-2xl font-bold flex items-baseline gap-2 relative z-10 ${
        isLight ? 'text-slate-900' : 'text-white'
      }`}>
        <span>{value}</span>
        {trend && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            trend.startsWith('+')
              ? (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300')
              : (isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-white/70')
          }`}>
            {trend}
          </span>
        )}
      </div>
      {subtitle && (
        <div className={`mt-1 text-xs relative z-10 ${
          isLight ? 'text-slate-600' : 'text-white/60'
        }`}>{subtitle}</div>
      )}
      {typeof progressPercent === 'number' && (
        <div className={`mt-3 h-1.5 rounded-full overflow-hidden relative z-10 ${
          isLight ? 'bg-slate-200' : 'bg-white/10'
        }`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent >= 90
                ? 'bg-emerald-500'
                : progressPercent >= 80
                ? 'bg-blue-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Komponen TrendChart (Dual Theme dengan Margin Sumbu Y Optimal & Formatter Tooltip)
function TrendChart({
  data,
  title = 'Tren Aktivitas',
  subtitle,
  color,
  height = 260,
  isLight = false,
}) {
  const chartColor = color || (isLight ? '#059669' : '#FFCA40');

  const stats = useMemo(() => {
    if (!data || data.length === 0) return { maxValue: 0, minValue: 0, avgValue: 0 };
    const values = data.map((d) => d.count);
    const maxValue = Math.max(...values, 1);
    const minValue = values.length > 0 ? Math.min(...values) : 0;
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    return { maxValue, minValue, avgValue };
  }, [data]);

  const formatDateLabel = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`rounded-2xl border p-6 flex flex-col justify-between ${
      isLight
        ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
        : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50 backdrop-blur-xl'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            <TrendingUp className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
            {title}
          </h3>
          {subtitle && (
            <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>{subtitle}</p>
          )}
        </div>
        <div className={`flex items-center gap-4 text-xs px-3 py-1.5 rounded-lg border ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-700'
            : 'bg-white/5 border-white/10 text-white/70'
        }`}>
          <div>
            <span className={isLight ? 'text-slate-400' : 'text-white/40'}>Maks: </span>
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.maxValue}</span>
          </div>
          <div>
            <span className={isLight ? 'text-slate-400' : 'text-white/40'}>Rata-rata: </span>
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.avgValue.toFixed(1)}</span>
          </div>
          <div>
            <span className={isLight ? 'text-slate-400' : 'text-white/40'}>Min: </span>
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.minValue}</span>
          </div>
        </div>
      </div>

      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 25, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="retentionAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={isLight ? 0.45 : 0.35} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? 'rgba(148, 163, 184, 0.25)' : 'rgba(255,255,255,0.08)'} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              tick={{ fill: isLight ? '#475569' : 'rgba(255,255,255,0.6)', fontSize: 11 }}
              axisLine={{ stroke: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              tick={{ fill: isLight ? '#475569' : 'rgba(255,255,255,0.6)', fontSize: 11 }}
              axisLine={{ stroke: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)' }}
            />
            <RechartsTooltip
              cursor={false}
              contentStyle={{
                backgroundColor: isLight ? '#FFFFFF' : '#00153A',
                borderColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: isLight ? '#0F172A' : '#FFFFFF',
                boxShadow: isLight ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : '0 10px 25px -5px rgba(0, 8, 28, 0.6)',
                fontSize: '12px',
              }}
              labelFormatter={(label) => `Tanggal: ${formatDateLabel(label)}`}
              formatter={(value) => [`${value} verifikator & faskes`, 'Aktif Harian']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={chartColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#retentionAreaGrad)"
              name="Verifikator Aktif"
              activeDot={{ r: 5, fill: chartColor, stroke: isLight ? '#059669' : '#FFFFFF', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function RetentionAnalyticsView({ onNavigateTab, isLight: propIsLight }) {
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

  const [asOfDate, setAsOfDate] = useState('2026-10-24');
  const [dailyActivity, setDailyActivity] = useState(INITIAL_DAILY_ACTIVITY);
  const [cohorts] = useState(INITIAL_COHORTS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setAsOfDate('2026-10-24');
      setDailyActivity([...INITIAL_DAILY_ACTIVITY]);
      setIsRefreshing(false);
    }, 300);
  };

  // Urutan kronologis untuk grafik tren
  const activeUsersTrend = useMemo(() => {
    return [...dailyActivity]
      .reverse()
      .map((p) => ({ date: p.date, count: p.activeUsers }));
  }, [dailyActivity]);

  return (
    <div className={`space-y-6 pb-16 sm:pb-20 ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* Header Halaman */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b pb-5 ${
        isLight ? 'border-slate-200' : 'border-white/10'
      }`}>
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className={`text-2xl font-bold flex items-center gap-2.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <Activity className={`w-6 h-6 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
              Analitik Retensi &amp; Aktivitas Pengawasan
            </h1>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-white/5 text-white/70 border-white/10'
            }`}>
              NIST CSF 2.0: RS.AN-03 · MITRE F3 Longitudinal Audit
            </span>
          </div>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Keaktifan harian, mingguan, dan bulanan verifikator medis &amp; tim casemix FKRTL, aktivitas audit klaim, dan retensi kohort kepatuhan (Standar Retensi Rekam Audit BPK &amp; KPK).
          </p>
        </div>

        <div className={`flex items-center gap-2 text-xs px-3.5 py-2 rounded-lg border shadow-sm ${
          isLight
            ? 'bg-white border-slate-200 text-slate-700'
            : 'bg-white/5 border-white/10 text-white/70'
        }`}>
          <Calendar className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
          <span>Per Tanggal: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{asOfDate}</strong></span>
        </div>
      </div>

      {/* Baris 1 KPI Cards: DAU, WAU, MAU */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          isLight={isLight}
          title="DAU (Aktif Hari Ini)"
          value="184"
          subtitle="Verifikator Medis & Tim Casemix FKRTL aktif hari ini"
          badge="Harian"
          icon={Users}
          trend="+8.2%"
        />
        <KpiCard
          isLight={isLight}
          title="WAU (Aktif 7 Hari)"
          value="412"
          subtitle="Auditor & FKRTL unik aktif dalam 7 hari terakhir"
          badge="Mingguan"
          icon={Activity}
          trend="+4.5%"
        />
        <KpiCard
          isLight={isLight}
          title="MAU (Aktif 30 Hari)"
          value="628"
          subtitle="Total entitas pengawasan aktif dalam 30 hari terakhir"
          badge="Bulanan"
          icon={Building2}
          trend="+12.1%"
        />
      </div>

      {/* Baris 2 KPI Cards: D1, D7, D30 Retention */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          isLight={isLight}
          title="Retensi H+1 (D1 Retention)"
          value="95.8%"
          subtitle="Kohort 2026-10-23 (46/48 verifikator & faskes aktif kembali)"
          badge="Kohort H+1"
          icon={CheckCircle2}
          progressPercent={95.8}
        />
        <KpiCard
          isLight={isLight}
          title="Retensi H+7 (D7 Retention)"
          value="90.3%"
          subtitle="Kohort 2026-10-16 (56/62 verifikator & faskes konsisten)"
          badge="Kohort H+7"
          icon={TrendingUp}
          progressPercent={90.3}
        />
        <KpiCard
          isLight={isLight}
          title="Retensi H+30 (D30 Retention)"
          value="84.3%"
          subtitle="Kohort 2026-09-24 (59/70 faskes patuh SLA berkelanjutan)"
          badge="Kohort H+30"
          icon={ShieldCheck}
          progressPercent={84.3}
        />
      </div>

      {/* Grid Tengah: TrendChart + Tabel Daily Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart
          isLight={isLight}
          data={activeUsersTrend}
          title="Verifikator & Faskes Aktif Harian (30 Hari Terakhir)"
          subtitle="Dihitung dari log aktivitas verifikasi klaim & kueri audit per hari (UTC)"
          color={isLight ? '#059669' : '#FFCA40'}
          height={280}
        />

        <div className={`rounded-2xl border p-6 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50 backdrop-blur-xl'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Aktivitas Verifikasi & Kueri Harian</h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                Verifikator aktif dan total pemrosesan berkas/kueri audit klaim per hari
              </p>
            </div>
            <button type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? `animate-spin ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}` : (isLight ? 'text-slate-500' : 'text-white/60')}`} />
              Segarkan
            </button>
          </div>

          <div className={`max-h-[290px] overflow-auto border rounded-lg ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}>
            <table className="w-full text-sm">
              <thead className={`sticky top-0 border-b ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#00134A] border-white/10 text-white/60'
              }`}>
                <tr>
                  <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">Tanggal</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">Pengguna Aktif</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">Pemrosesan Audit</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">Status Beban</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200 bg-white' : 'divide-white/5'}`}>
                {dailyActivity.slice(0, 14).map((row) => (
                  <tr key={row.date} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                    <td className={`py-2.5 px-3 font-mono text-xs ${isLight ? 'text-slate-700 font-semibold' : 'text-white/90'}`}>{row.date}</td>
                    <td className={`py-2.5 px-3 text-right font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{row.activeUsers}</td>
                    <td className={`py-2.5 px-3 text-right ${isLight ? 'text-slate-600' : 'text-white/70'}`}>{row.totalRequests.toLocaleString('id-ID')}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        row.totalRequests >= 1400
                          ? (isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                          : row.totalRequests < 1000
                          ? (isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/10 text-white/60 border-white/10')
                          : (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                      }`}>
                        {row.totalRequests >= 1400 ? 'Puncak Klaim' : row.totalRequests < 1000 ? 'Akhir Pekan' : 'Optimal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tabel Bawah: Cohort Retention */}
      <div className={`rounded-2xl border p-6 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50 backdrop-blur-xl'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <h2 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Retensi Kohort Kepatuhan & Verifikasi</h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
              Kohort berdasarkan tanggal aktivitas audit klaim pertama (30 hari terakhir)
            </p>
          </div>
          <div className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-white/5 border-white/10 text-white/70'
          }`}>
            Hari Pengamatan: <strong className={isLight ? 'text-slate-900' : 'text-white'}>1, 7, 30</strong>
          </div>
        </div>

        {/* Banner Penjelasan Konteks BPJS Kesehatan */}
        <div className={`mb-4 p-3 rounded-lg flex items-center justify-between text-xs border ${
          isLight
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-blue-500/10 border-blue-500/20 text-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${isLight ? 'text-emerald-800' : 'text-[#FFCA40]'}`}>Tolok Ukur SLA JKN:</span>
            <span><strong>D1 (H+1):</strong> Triase anomali kilat • <strong>D7 (H+7):</strong> Rekonsiliasi resume rekam medis &amp; BAKB • <strong>D30 (H+30):</strong> Kepatuhan tuntas SLA Perpres 82/2018</span>
          </div>
          <span className={`text-[11px] font-semibold hidden sm:inline ${isLight ? 'text-emerald-700 font-bold' : 'text-[#FFCA40]'}`}>Standar Mutu KC</span>
        </div>

        <div className={`overflow-x-auto border rounded-lg ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <table className="w-full text-sm">
            <thead className={`border-b ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/60'
            }`}>
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider">Tanggal Kohort</th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider">Ukuran Kohort</th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider">Hari ke-1 (D1)</th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider">Hari ke-7 (D7)</th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider">Hari ke-30 (D30)</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200 bg-white' : 'divide-white/5'}`}>
              {cohorts.map((row) => (
                <tr key={row.cohort_date} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                  <td className={`py-3 px-4 font-mono text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{row.cohort_date}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${isLight ? 'text-slate-700' : 'text-white/80'}`}>{row.cohort_size} entitas</td>
                  {[1, 7, 30].map((d) => {
                    const cell = row.retention?.[d];
                    const rate = cell ? cell.retention_rate : null;
                    const retained = cell ? cell.retained_users : 0;
                    return (
                      <td key={d} className="py-3 px-4 text-right">
                        {rate !== null ? (
                          <div className="inline-flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                isLight
                                  ? rate >= 0.9
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : rate >= 0.85
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                    : rate >= 0.80
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : rate >= 0.9
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : rate >= 0.85
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : rate >= 0.80
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {formatPercent(rate)}
                            </span>
                            <span className={`text-xs ${isLight ? 'text-slate-500 font-medium' : 'text-white/40'}`}>({retained})</span>
                          </div>
                        ) : (
                          <span className={isLight ? 'text-slate-400' : 'text-white/40'}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
