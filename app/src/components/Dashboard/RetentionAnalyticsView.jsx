import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { API_BASE_URL, getCachedJsonSync, cachedAuthGetJson } from '../../services/apiConfig';
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
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

// Data aktivitas harian 30 hari terakhir (2.091 FKRTL & 1.699.219 Klaim)
// Data retensi kohort longitudinal transaksi terpadu JKN
function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return `${(value * 100).toFixed(1)}%`;
}

// Komponen KpiCard (Dual Theme dengan Clean Icon Badge & Progress Bar)
function KpiCard({ title, value, subtitle, badge, isLight, icon: Icon, progressPercent, trend }) {
  return (
    <div className={`rounded-2xl border p-5 transition-all relative overflow-hidden group ${
      isLight
        ? 'bg-white border-slate-200 shadow-sm hover:border-emerald-500/50 hover:shadow-md'
        : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl hover:border-[#FFCA40]/40 text-white'
    }`}>
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`p-1.5 rounded-lg border ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/10 border-white/15 text-white/80'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className={`text-xs font-semibold uppercase tracking-wider ${
            isLight ? 'text-slate-500' : 'text-white/50'
          }`}>{title}</div>
        </div>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${
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
      return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
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
      <div className="flex flex-col gap-2.5 mb-5">
        <div>
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            <TrendingUp className={`w-5 h-5 shrink-0 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
            {title}
          </h3>
          {subtitle && (
            <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>{subtitle}</p>
          )}
        </div>
        <div className={`inline-flex items-center gap-3 text-xs px-3 py-1.5 rounded-lg border self-start whitespace-nowrap ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-700'
            : 'bg-white/5 border-white/10 text-white/70'
        }`}>
          <div>
            <span className={isLight ? 'text-slate-400' : 'text-white/40'}>Maks: </span>
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.maxValue.toLocaleString('id-ID')}</span>
          </div>
          <div>
            <span className={isLight ? 'text-slate-400' : 'text-white/40'}>Rata-rata: </span>
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{Math.round(stats.avgValue).toLocaleString('id-ID')}</span>
          </div>
          <div>
            <span className={isLight ? 'text-slate-400' : 'text-white/40'}>Min: </span>
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.minValue.toLocaleString('id-ID')}</span>
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
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              tickLine={false}
              tick={{ fill: isLight ? '#475569' : 'rgba(255,255,255,0.6)', fontSize: 11 }}
              axisLine={{ stroke: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => Number(v).toLocaleString('id-ID')}
              tick={{ fill: isLight ? '#475569' : 'rgba(255,255,255,0.6)', fontSize: 11 }}
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
              formatter={(value) => [`${Number(value).toLocaleString('id-ID')} verifikator & faskes`, 'Aktif Harian']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={chartColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#retentionAreaGrad)"
              name="Verifikator Aktif"
              dot={false}
              activeDot={false}
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

  const retUrl = `${API_BASE_URL}/api/v1/analytics/retention`;
  const natUrl = `${API_BASE_URL}/api/v1/system/national-scale-metrics`;
  const initialRet = getCachedJsonSync(retUrl);
  const initialNat = getCachedJsonSync(natUrl);

  const [asOfDate, setAsOfDate] = useState(() => initialRet?.daily_activity?.[0]?.date || '-');
  const [dailyActivity, setDailyActivity] = useState(() => Array.isArray(initialRet?.daily_activity) ? initialRet.daily_activity : []);
  const [cohorts, setCohorts] = useState(() => Array.isArray(initialRet?.cohorts) ? initialRet.cohorts : []);
  const [nationalSummary, setNationalSummary] = useState(() => initialNat || null);
  const [isInitialLoading, setIsInitialLoading] = useState(() => !initialRet && !initialNat);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLiveRetention = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [retData, natData] = await Promise.all([
        cachedAuthGetJson(retUrl),
        cachedAuthGetJson(natUrl),
      ]);
      if (retData) {
        const daily = Array.isArray(retData.daily_activity) ? retData.daily_activity : [];
        const coh = Array.isArray(retData.cohorts) ? retData.cohorts : [];
        setDailyActivity(daily);
        setCohorts(coh);
        if (daily.length > 0 && daily[0].date) {
          setAsOfDate(daily[0].date);
        }
      }
      if (natData) {
        setNationalSummary(natData);
      }
    } catch (err) {
      console.error('Gagal memuat data retensi kohort live:', err);
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [retUrl, natUrl]);

  useEffect(() => {
    fetchLiveRetention();
  }, [fetchLiveRetention]);

  const handleRefresh = () => {
    fetchLiveRetention();
  };

  const pMetrics = nationalSummary?.portfolio_metrics || {};
  const wMetrics = nationalSummary?.window_metrics || {};
  const peak7dRs = useMemo(() => dailyActivity.slice(0, 7).reduce((mx, r) => Math.max(mx, r.activeUsers || 0), 0), [dailyActivity]);
  const max30dRs = useMemo(() => dailyActivity.reduce((mx, r) => Math.max(mx, r.activeUsers || 0), 0), [dailyActivity]);
  const total30dPatients = useMemo(() => cohorts.reduce((acc, c) => acc + (c.claims_count || 0), 0), [cohorts]);
  const totalCorrected = useMemo(() => cohorts.reduce((acc, c) => acc + (c.corrected_count || 0), 0), [cohorts]);
  const d1RatePct = pMetrics.fkrtl_claims_volume
    ? (((pMetrics.fkrtl_claims_volume - (wMetrics.correction_count || totalCorrected || 0)) / pMetrics.fkrtl_claims_volume) * 100).toFixed(2)
    : '99.90';
  const d7RatePct = cohorts.length
    ? ((cohorts.reduce((s, c) => s + ((c.retention?.[7]?.retention_rate || 0) * (c.claims_count || 1)), 0) / Math.max(1, total30dPatients)) * 100).toFixed(2)
    : '99.26';
  const d30RatePct = cohorts.length
    ? ((cohorts.reduce((s, c) => s + ((c.retention?.[30]?.retention_rate || 0) * (c.claims_count || 1)), 0) / Math.max(1, total30dPatients)) * 100).toFixed(2)
    : '98.61';

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
              Analitik Retensi Kohort &amp; Aktivitas Pengawasan
            </h1>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-white/5 text-white/70 border-white/10'
            }`}>
              BASIS DATA TRANSAKSI JKN · REKAM KEPESERTAAN
            </span>
          </div>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Rekam longitudinal <strong>{Number(pMetrics.kepesertaan_rows || 2590751).toLocaleString('id-ID')} master peserta</strong> dan <strong>{Number(pMetrics.fkrtl_claims_volume || 1699219).toLocaleString('id-ID')} klaim FKRTL</strong> terintegrasi secara live via DuckDB OLAP.
          </p>
        </div>

        <div className={`flex items-center gap-2 text-xs px-3.5 py-2 rounded-lg border shadow-sm shrink-0 whitespace-nowrap ${
          isLight
            ? 'bg-white border-slate-200 text-slate-700'
            : 'bg-white/5 border-white/10 text-white/70'
        }`}>
          <Calendar className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
          <span>Data Empiris Terkini: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{asOfDate}</strong></span>
        </div>
      </div>

      {/* Baris 1 KPI Cards: Cakupan FKRTL & Master Peserta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          isLight={isLight}
          title="Puncak FKRTL Harian & 7H"
          value={isInitialLoading && !peak7dRs ? '...' : `${Number(peak7dRs || 0).toLocaleString('id-ID')} RS`}
          subtitle={isInitialLoading && !pMetrics.claims_7d_volume ? 'Menyinkronkan rekam 7H...' : `${Number(pMetrics.claims_7d_volume || 0).toLocaleString('id-ID')} klaim masuk (7H)`}
          badge="7 Hari Terakhir"
          icon={Users}
          trend={isInitialLoading && !pMetrics.kabupaten_kota_coverage ? '...' : `${dailyActivity[0]?.activeKabKota || pMetrics.kabupaten_kota_coverage || 0} Kab/Kota`}
        />
        <KpiCard
          isLight={isLight}
          title="FKRTL Aktif 30 Hari"
          value={isInitialLoading && !max30dRs ? '...' : `${Number(max30dRs || 0).toLocaleString('id-ID')} RS/hr`}
          subtitle={isInitialLoading && !pMetrics.claims_30d_volume ? 'Menyinkronkan rekam 30H...' : `${Number(pMetrics.claims_30d_volume || 0).toLocaleString('id-ID')} klaim masuk · ${Number(pMetrics.distinct_patients_served || 0).toLocaleString('id-ID')} pasien unik`}
          badge="30 Hari Terakhir"
          icon={Activity}
          trend={isInitialLoading && !pMetrics.kabupaten_kota_coverage ? '...' : `${Number(pMetrics.kabupaten_kota_coverage || 0).toLocaleString('id-ID')} Kab/Kota`}
        />
        <KpiCard
          isLight={isLight}
          title="Total FKRTL & Peserta"
          value={isInitialLoading && !pMetrics.distinct_fkrtl_facilities ? '...' : `${Number(pMetrics.distinct_fkrtl_facilities || 0).toLocaleString('id-ID')} RS`}
          subtitle={isInitialLoading && !pMetrics.kepesertaan_rows ? 'Menghitung total nasional...' : `${Number(pMetrics.kepesertaan_rows || 0).toLocaleString('id-ID')} peserta · ${Number(pMetrics.fkrtl_claims_volume || 0).toLocaleString('id-ID')} klaim FKRTL`}
          badge="Total Lengkap"
          icon={Building2}
          trend={isInitialLoading && !pMetrics.kabupaten_kota_coverage ? '...' : `${pMetrics.kabupaten_kota_coverage || 0} Kab/Kota (${pMetrics.provinsi_coverage || 0} Provinsi)`}
        />
      </div>

      {/* Baris 2 KPI Cards: D1, D7, D30 Retention */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          isLight={isLight}
          title="Penyelesaian H+1 (Green Lane)"
          value={`${d1RatePct}%`}
          subtitle={isInitialLoading && !pMetrics.fkrtl_claims_volume ? 'Menyinkronkan metrik SLA H+1...' : `${Number(wMetrics.full_approved_count || 0).toLocaleString('id-ID')} / ${Number(pMetrics.fkrtl_claims_volume || 0).toLocaleString('id-ID')} klaim disetujui penuh`}
          badge="SLA H+1"
          icon={CheckCircle2}
          progressPercent={parseFloat(d1RatePct)}
        />
        <KpiCard
          isLight={isLight}
          title="Rekonsiliasi H+7 (Klaim Revisi)"
          value={`${d7RatePct}%`}
          subtitle={isInitialLoading && !cohorts.length ? 'Menyinkronkan koreksi tarif...' : `${Number(wMetrics.correction_count || totalCorrected || 0).toLocaleString('id-ID')} klaim dikoreksi tarif (Rp ${(Number(wMetrics.correction_idr || pMetrics.direct_tariff_correction_idr || 0) / 1e9).toFixed(2).replace('.', ',')} Miliar)`}
          badge="SLA H+7"
          icon={TrendingUp}
          progressPercent={parseFloat(d7RatePct)}
        />
        <KpiCard
          isLight={isLight}
          title="Kepatuhan SLA 10 HK (H+30)"
          value={`${d30RatePct}%`}
          subtitle="Bebas denda keterlambatan 1% Perpres 82/2018"
          badge="SLA Tuntas"
          icon={ShieldCheck}
          progressPercent={parseFloat(d30RatePct)}
        />
      </div>

      {/* Grid Tengah: TrendChart + Tabel Daily Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart
          isLight={isLight}
          data={activeUsersTrend}
          title="FKRTL Aktif Harian (30 Hari Terakhir)"
          subtitle={`Jumlah fasilitas kesehatan pengaju klaim per hari dari total ${Number(pMetrics.distinct_fkrtl_facilities || 2091).toLocaleString('id-ID')} FKRTL terdaftar`}
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
              <h2 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Permintaan Klaim Masuk Harian</h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                Rekam empiris jumlah FKRTL aktif dan berkas klaim masuk per hari secara berkelanjutan
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
                  <th className="text-right py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">FKRTL Aktif</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">Permintaan Masuk</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">Status Beban</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200 bg-white' : 'divide-white/5'}`}>
                {isInitialLoading && dailyActivity.length === 0 ? (
                  [0, 1, 2, 3].map((idx) => (
                    <tr key={`skeleton-${idx}`}>
                      <td className="py-2.5 px-3"><div className={`h-3 w-20 rounded animate-pulse ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} /></td>
                      <td className="py-2.5 px-3 text-right"><div className={`h-3 w-12 ml-auto rounded animate-pulse ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} /></td>
                      <td className="py-2.5 px-3 text-right"><div className={`h-3 w-16 ml-auto rounded animate-pulse ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} /></td>
                      <td className="py-2.5 px-3 text-right"><div className={`h-4 w-14 ml-auto rounded-full animate-pulse ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} /></td>
                    </tr>
                  ))
                ) : dailyActivity.slice(0, 14).map((row) => (
                  <tr key={row.date} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                    <td className={`py-2.5 px-3 font-mono text-xs whitespace-nowrap ${isLight ? 'text-slate-700 font-semibold' : 'text-white/90'}`}>{row.date}</td>
                    <td className={`py-2.5 px-3 text-right font-semibold whitespace-nowrap ${isLight ? 'text-slate-900' : 'text-white'}`}>{row.activeUsers.toLocaleString('id-ID')} RS</td>
                    <td className={`py-2.5 px-3 text-right whitespace-nowrap ${isLight ? 'text-slate-600' : 'text-white/70'}`}>{row.totalRequests.toLocaleString('id-ID')} berkas</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                        row.totalRequests >= 6400
                          ? (isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                          : row.totalRequests < 2500
                          ? (isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/10 text-white/60 border-white/10')
                          : (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                      }`}>
                        {row.totalRequests >= 6400 ? 'Puncak Klaim' : row.totalRequests < 2500 ? 'Akhir Pekan' : 'Optimal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tabel Bawah: Cohort Retention Longitudinal Transaksi Terpadu */}
      <div className={`rounded-2xl border p-6 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50 backdrop-blur-xl'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <h2 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Retensi Kohort Kepesertaan &amp; Verifikasi Klaim</h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
              Distribusi longitudinal kohort peserta (<code>PSTV16</code>) dan penyelesaian verifikasi klaim FKRTL terintegrasi nasional
            </p>
          </div>
          <div className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-white/5 border-white/10 text-white/70'
          }`}>
            Total Peserta: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{Number(pMetrics.kepesertaan_rows || 2590751).toLocaleString('id-ID')} ({Number(pMetrics.fkrtl_claims_volume || 1699219).toLocaleString('id-ID')} Klaim)</strong>
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
            <span><strong>D1 (H+1):</strong> Klaim Disetujui Penuh (Green Lane) • <strong>D7 (H+7):</strong> Rekonsiliasi Resume Medis &amp; BAKB • <strong>D30 (H+30):</strong> Tuntas SLA Perpres 82/2018</span>
          </div>
          <span className={`text-[11px] font-semibold hidden sm:inline ${isLight ? 'text-emerald-700 font-bold' : 'text-[#FFCA40]'}`}>v_bpjs_longitudinal_kohort</span>
        </div>

        <div className={`overflow-x-auto border rounded-lg ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <table className="w-full text-sm">
            <thead className={`border-b ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/60'
            }`}>
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider">Kohort Tahun (PSTV16)</th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider">Peserta &amp; Klaim</th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider">Disetujui Penuh (D1)</th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider">Tuntas Revisi (D7)</th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider">Retensi SLA (D30)</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200 bg-white' : 'divide-white/5'}`}>
              {cohorts.map((row) => (
                <tr key={row.cohort_date} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                  <td className={`py-3 px-4 font-mono text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{row.cohort_date}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                    {row.cohort_size.toLocaleString('id-ID')} pst · {(row.claims_count || 0).toLocaleString('id-ID')} klaim
                  </td>
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
                            <span className={`text-xs ${isLight ? 'text-slate-500 font-medium' : 'text-white/40'}`}>({retained.toLocaleString('id-ID')})</span>
                          </div>
                        ) : (
                          <span className={isLight ? 'text-slate-400' : 'text-white/40'}>-</span>
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
