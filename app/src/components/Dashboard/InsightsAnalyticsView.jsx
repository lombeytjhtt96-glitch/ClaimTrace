import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ShieldCheck,
  Check,
  X,
  FileText,
  Calendar,
  Eye,
  BarChart3,
  Download,
  AlertTriangle,
  Sparkles,
  Users,
  Shield,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { API_BASE_URL } from '../../services/apiConfig';

const CHART_COLORS = ['#059669', '#0284c7', '#f59e0b', '#dc2626', '#7c3aed', '#db2777'];

// ─── Allow-Listed Queries (Adapted from IAQuerySelector.tsx to JKN Claim Audit) ───
const ALLOW_LISTED_QUERIES = [
  {
    value: 'high_risk_trends',
    label: '1. Analisis Tren Klaim Risiko Tinggi (Red Lane)',
    description: 'Tren pengajuan klaim FKRTL berisiko tinggi (Skor Tri-Layer ≥ 80) dari waktu ke waktu',
  },
  {
    value: 'support_plan_effectiveness',
    label: '2. Efektivitas Intervensi & Klarifikasi BAKB Faskes',
    description: 'Tingkat keberhasilan koreksi klaim pasca penerbitan berita acara klarifikasi (BAKB)',
  },
  {
    value: 'case_distribution',
    label: '3. Distribusi Berkas Klaim Berdasarkan Tingkat Risiko',
    description: 'Proporsi berkas klaim lintas tingkat keparahan (Rendah, Sedang, Tinggi, Kritis)',
  },
  {
    value: 'resolution_times',
    label: '4. Rata-Rata Durasi Penyelesaian Audit Klaim (SLA 10 Hari)',
    description: 'Rata-rata waktu verifikasi klaim pra-bayar dibandingkan batas SLA Perpres 82/2018',
  },
  {
    value: 'peak_usage_patterns',
    label: '5. Pola Jam & Hari Puncak Pengajuan Klaim FKRTL',
    description: 'Analisis lonjakan beban pengajuan SEP dan berkas INA-CBG harian/mingguan',
  },
  {
    value: 'counselor_workload',
    label: '6. Beban Verifikasi Verifikator Medis BPJS',
    description: 'Distribusi beban berkas klaim per verifikator medis di Kantor Cabang',
  },
  {
    value: 'severity_transitions',
    label: '7. Dinamika Eskalasi Tingkat Risiko Klaim',
    description: 'Perpindahan status klaim dari investigasi awal menuju rekomendasi penolakan/pending',
  },
  {
    value: 'intervention_outcomes',
    label: '8. Hasil Audit Pasca Klarifikasi Lapangan',
    description: 'Distribusi keputusan akhir klaim: Disetujui, Pending Resume, Koreksi Tarif, Ditolak',
  },
  {
    value: 'feature_adoption',
    label: '9. Utilisasi Fitur Tri-Layer Verifikasi Digital',
    description: 'Tingkat penggunaan deteksi Lapisan 1, Lapisan 2, dan Validasi Mobile JKN',
  },
];

function getPriorityBadgeStyle(priority, isLight) {
  const p = (priority || '').toLowerCase();
  if (p === 'kritis' || p === 'critical') {
    return isLight
      ? 'bg-rose-100 text-rose-800 border-rose-300'
      : 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  }
  if (p === 'tinggi' || p === 'high') {
    return isLight
      ? 'bg-orange-100 text-orange-800 border-orange-300'
      : 'bg-orange-500/20 text-orange-300 border-orange-500/40';
  }
  if (p === 'sedang' || p === 'moderate' || p === 'medium') {
    return isLight
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  }
  return isLight
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
}

function getChartForQueryType(queryName, data, isLight = false) {
  const gridStroke = isLight ? 'rgba(148, 163, 184, 0.25)' : 'rgba(255,255,255,0.08)';
  const tickFill = isLight ? '#475569' : 'rgba(255,255,255,0.6)';
  const tooltipStyle = {
    backgroundColor: isLight ? '#FFFFFF' : '#00153A',
    borderColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    color: isLight ? '#0F172A' : '#FFFFFF',
    boxShadow: isLight ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : '0 10px 25px -5px rgba(0, 8, 28, 0.6)',
    fontSize: '12px',
  };

  if (queryName.includes('trend')) {
    return (
      <LineChart data={data} margin={{ top: 10, right: 35, left: 10, bottom: 5 }}>
        <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 11, fill: tickFill }} axisLine={{ stroke: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)' }} />
        <YAxis
          yAxisId="left"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: isLight ? '#059669' : '#06b6d4' }}
          tickFormatter={(v) => `${Number(v).toLocaleString('id-ID')} kss`}
        />
        {data[0]?.avg_risk !== undefined && (
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[60, 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#f43f5e' }}
            tickFormatter={(v) => `${v}%`}
          />
        )}
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={false}
          formatter={(value, name) => [
            name === 'Rata-Rata Skor Risiko' ? `${value}%` : `${Number(value).toLocaleString('id-ID')} berkas anomali`,
            name,
          ]}
        />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="value"
          stroke={isLight ? '#059669' : '#06b6d4'}
          strokeWidth={3}
          name="Jumlah Kasus Anomali"
          dot={false}
          activeDot={false}
          isAnimationActive={false}
        />
        {data[0]?.avg_risk && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="avg_risk"
            stroke="#e11d48"
            strokeWidth={2.5}
            name="Rata-Rata Skor Risiko"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        )}
      </LineChart>
    );
  } else if (queryName.includes('distribution') || queryName.includes('case')) {
    return (
      <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={115}
          fill="#8884d8"
          dataKey="value"
          isAnimationActive={false}
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} cursor={false} formatter={(val) => [`${Number(val).toLocaleString('id-ID')} berkas`, 'Volume']} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
      </PieChart>
    );
  } else {
    return (
      <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 11, fill: tickFill }} axisLine={{ stroke: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)' }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: tickFill }} tickFormatter={(v) => Number(v).toLocaleString('id-ID')} />
        <Tooltip contentStyle={tooltipStyle} cursor={false} formatter={(val) => [`${Number(val).toLocaleString('id-ID')} berkas`, 'Jumlah Temuan']} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
        <Bar
          dataKey="value"
          fill={isLight ? '#059669' : '#0284c7'}
          radius={[6, 6, 0, 0]}
          name="Jumlah Temuan Klaim"
          isAnimationActive={false}
        />
      </BarChart>
    );
  }
}

export default function InsightsAnalyticsView({ isLight: propIsLight, onNavigateTab }) {
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

  // Privacy status state (dynamically tracked from backend DuckDB)
  const [status, setStatus] = useState({
    k_value: 5,
    k_threshold: 5,
    epsilon_used: 0.0,
    epsilon_total: 20.0,
    consented_users: 0,
    total_users: 1,
    dataset_date_min: '',
    dataset_date_max: '',
  });

  // Query Selector state
  const [selectedQuery, setSelectedQuery] = useState('high_risk_trends');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [severity, setSeverity] = useState('');
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReportModal, setSelectedReportModal] = useState(null);
  const [showAllReportsModal, setShowAllReportsModal] = useState(false);
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  // Fetch real privacy status from live backend
  const fetchPrivacyStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/insights/privacy-status`);
      if (res.ok) {
        const data = await res.json();
        setStatus({
          k_value: typeof data.k_value === 'number' ? data.k_value : 5,
          k_threshold: data.k_threshold || 5,
          epsilon_used: typeof data.epsilon_used === 'number' ? data.epsilon_used : 0.0,
          epsilon_total: typeof data.epsilon_total === 'number' ? data.epsilon_total : 20.0,
          consented_users: typeof data.consented_users === 'number' ? data.consented_users : 0,
          total_users: typeof data.total_users === 'number' && data.total_users > 0 ? data.total_users : 1,
          dataset_date_min: data.dataset_date_min || '',
          dataset_date_max: data.dataset_date_max || '',
        });
      }
    } catch (err) {
      console.warn('Gagal memuat status privasi backend', err);
    }
  };

  // Fetch real synthesized audit reports from live backend
  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/insights/reports`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setReports(data);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat laporan analitik backend', err);
    }
  };

  // Execute live analytical query against backend DuckDB
  const executeLiveQuery = async (queryType, sDate, eDate, sev) => {
    const qName = queryType || selectedQuery;
    if (!qName) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/insights/execute-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_type: qName,
          start_date: sDate !== undefined ? sDate : startDate,
          end_date: eDate !== undefined ? eDate : endDate,
          severity: sev !== undefined ? sev : severity,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        await fetchPrivacyStatus();
      }
    } catch (err) {
      console.error('Gagal mengeksekusi kueri analitik DuckDB', err);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    fetchPrivacyStatus();
    fetchReports();
    executeLiveQuery('high_risk_trends', '', '', '');
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedReportModal) setSelectedReportModal(null);
        if (showAllReportsModal) setShowAllReportsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedReportModal, showAllReportsModal]);

  const handleDownloadReport = (rep) => {
    if (!rep) return;
    const blob = new Blob([JSON.stringify(rep, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Audit_ClaimTrace_${rep.id}_${(rep.generated_at || '').replace(/[\s,:]+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const kAnonymityPercent = Math.min((status.k_value / (status.k_threshold * 2)) * 100, 100);
  const epsilonPercent = (status.epsilon_used / status.epsilon_total) * 100;
  const consentPercent = (status.consented_users / status.total_users) * 100;

  const selectedQueryInfo = ALLOW_LISTED_QUERIES.find((q) => q.value === selectedQuery);

  const handleQueryChange = (newQuery) => {
    setSelectedQuery(newQuery);
    executeLiveQuery(newQuery, startDate, endDate, severity);
  };

  const handleExecute = () => {
    executeLiveQuery(selectedQuery, startDate, endDate, severity);
  };

  const handleExportCSV = () => {
    if (!result?.result?.data) return;
    const items = result.result.data;
    if (!Array.isArray(items) || items.length === 0) return;
    const header = Object.keys(items[0]).join(',');
    const rows = items.map((row) => Object.values(row).join(','));
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.query_name}_jkn_results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 pb-10 ${isLight ? 'text-slate-900' : 'text-white'}`}>
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className={`text-2xl md:text-3xl font-bold mb-1.5 tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Analitik Wawasan &amp; Privasi Klaim (Insights Analytics)
              </h1>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white/10 text-[#FFCA40] border-white/10'
              }`}>
                NIST CSF 2.0: PR.DS-02 · NIST AI RMF 1.0 · MITRE F3
              </span>
            </div>
            <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Analitik pengawasan klaim JKN berbasis <em>k-anonymity</em>,{' '}
              <em>differential privacy</em>, dan kepatuhan Zero-PHI (UU PDP No. 27/2022 &amp; NIST Privacy Framework).
            </p>
          </div>
        </div>

        {/* 1. Privacy Safeguards Status */}
        <div className={`relative overflow-hidden rounded-2xl border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50 backdrop-blur-xl'
        }`}>
          <div className={`p-6 border-b ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <h2 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Status Perlindungan Privasi Data Klaim
            </h2>
            <p className={`text-xs mt-1 font-mono uppercase tracking-wider ${
              isLight ? 'text-emerald-700 font-bold' : 'text-[#FFCA40]'
            }`}>
              PEMANTAUAN KEPATUHAN PRIVASI PESERTA &amp; REKAM MEDIS SECARA REAL-TIME
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: k-anonymity */}
              <div className={`rounded-xl p-5 relative overflow-hidden group border transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-emerald-500/40'
                  : 'bg-white/5 border-white/10 hover:border-[#FFCA40]/40'
              }`}>
                <div className="absolute top-2 right-3 p-2 opacity-10">
                  <Users className={`w-14 h-14 ${isLight ? 'text-slate-900' : 'text-white'}`} />
                </div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${
                    isLight ? 'text-slate-600' : 'text-white/60'
                  }`}>
                    K-ANONYMITY PESERTA
                  </h3>
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border ${
                    isLight
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className={`text-3xl font-bold relative z-10 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  k = {status.k_value}
                </p>
                <p className={`text-xs mt-1 font-mono relative z-10 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  Ambang batas: k ≥ {status.k_threshold} klaim/kelompok (Terpenuhi: Margin +{Math.max(0, Math.round(((status.k_value - status.k_threshold) / status.k_threshold) * 100))}%)
                </p>
                <div className={`mt-4 h-2 rounded-full overflow-hidden relative z-10 ${
                  isLight ? 'bg-slate-200' : 'bg-white/10'
                }`}>
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(kAnonymityPercent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Differential Privacy */}
              <div className={`rounded-xl p-5 relative overflow-hidden group border transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-emerald-500/40'
                  : 'bg-white/5 border-white/10 hover:border-[#FFCA40]/40'
              }`}>
                <div className="absolute top-2 right-3 p-2 opacity-10">
                  <Shield className={`w-14 h-14 ${isLight ? 'text-slate-900' : 'text-white'}`} />
                </div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${
                    isLight ? 'text-slate-600' : 'text-white/60'
                  }`}>
                    DIFFERENTIAL PRIVACY (ε-δ)
                  </h3>
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border ${
                    isLight
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className={`text-3xl font-bold relative z-10 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  ε = {status.epsilon_used.toFixed(2)}
                  <span className={`text-lg font-normal ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                    /{status.epsilon_total.toFixed(1)}
                  </span>
                </p>
                <p className={`text-xs mt-1 font-mono relative z-10 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  {status.epsilon_used.toFixed(2)} terpakai dari {status.epsilon_total.toFixed(1)} ({((1 - epsilonPercent / 100) * 100).toFixed(0)}% anggaran privasi aman tersisa)
                </p>
                <div className={`mt-4 h-2 rounded-full overflow-hidden relative z-10 ${
                  isLight ? 'bg-slate-200' : 'bg-white/10'
                }`}>
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${epsilonPercent}%` }}
                  />
                </div>
              </div>

              {/* Card 3: Consent & Zero-PHI Validation */}
              <div className={`rounded-xl p-5 relative overflow-hidden group border transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-emerald-500/40'
                  : 'bg-white/5 border-white/10 hover:border-[#FFCA40]/40'
              }`}>
                <div className="absolute top-2 right-3 p-2 opacity-10">
                  <CheckCircle2 className={`w-14 h-14 ${isLight ? 'text-slate-900' : 'text-white'}`} />
                </div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${
                    isLight ? 'text-slate-600' : 'text-white/60'
                  }`}>
                    VALIDASI PERSETUJUAN &amp; TOKENISASI
                  </h3>
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border ${
                    isLight
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className={`text-3xl font-bold relative z-10 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {Number(status.consented_users || 0).toLocaleString('id-ID')}{' '}
                  <span className={`text-lg font-normal ${isLight ? 'text-slate-400' : 'text-white/40'}`}>/ {Number(status.total_users || 0).toLocaleString('id-ID')}</span>
                </p>
                <p className={`text-xs mt-1 font-mono relative z-10 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  Peserta aktif terverifikasi presensi Mobile JKN
                </p>
                <div className={`mt-4 h-2 rounded-full overflow-hidden relative z-10 ${
                  isLight ? 'bg-slate-200' : 'bg-white/10'
                }`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLight ? 'bg-emerald-600' : 'bg-gradient-to-r from-[#FFCA40] to-amber-500'
                    }`}
                    style={{ width: `${consentPercent}%` }}
                  />
                </div>
                <p className={`text-xs mt-2 font-semibold relative z-10 ${
                  isLight ? 'text-emerald-700' : 'text-[#FFCA40]'
                }`}>
                  {consentPercent.toFixed(1)}% rasio persetujuan telemetri
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Run Allow-Listed Query */}
        <div className={`relative overflow-hidden rounded-2xl border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50 backdrop-blur-xl'
        }`}>
          <div className={`p-6 border-b ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <h2 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Jalankan Kueri Audit Terotorisasi (Allow-Listed Query)
            </h2>
            <p className={`text-xs mt-1 font-mono uppercase tracking-wider ${
              isLight ? 'text-emerald-700 font-bold' : 'text-[#FFCA40]'
            }`}>
              EKSEKUSI KUERI ANALITIK PENGAWASAN KLAIM JKN YANG DILINDUNGI PRIVASI
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="query-select"
                  className={`block text-xs font-semibold mb-2 ${
                    isLight ? 'text-slate-700' : 'text-white/70'
                  }`}
                >
                  Pilih Kueri Analitik Klaim
                </label>
                <select
                  id="query-select"
                  value={selectedQuery}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  className={`block w-full rounded-xl text-sm py-3 px-4 transition-all cursor-pointer border ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500'
                      : 'bg-[#00134A] border-white/10 text-white focus:border-[#FFCA40]/60'
                  }`}
                  disabled={loading}
                >
                  <option value="" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>-- Pilih kueri analitik terotorisasi --</option>
                  {ALLOW_LISTED_QUERIES.map((query) => (
                    <option key={query.value} value={query.value} className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>
                      {query.label}
                    </option>
                  ))}
                </select>
                {selectedQueryInfo && (
                  <p className={`mt-2 text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{selectedQueryInfo.description}</p>
                )}
                <p className={`mt-2 text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Seluruh kueri menerapkan k-anonymity (k≥5) dan enkripsi Zero-PHI (UU PDP)</span>
                </p>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-2 ${
                  isLight ? 'text-slate-700' : 'text-white/70'
                }`}>
                  Rentang Tanggal Pengajuan SEP (Opsional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input aria-label="Tanggal Awal SEP"
                      type="date"
                      value={startDate}
                      min={status.dataset_date_min || undefined}
                      max={status.dataset_date_max || undefined}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`block w-full rounded-xl text-sm py-3 px-4 border ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600'
                          : 'bg-[#00134A] border-white/10 text-white focus:border-[#FFCA40]/60'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <input aria-label="Tanggal Akhir SEP"
                      type="date"
                      value={endDate}
                      min={status.dataset_date_min || undefined}
                      max={status.dataset_date_max || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`block w-full rounded-xl text-sm py-3 px-4 border ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600'
                          : 'bg-[#00134A] border-white/10 text-white focus:border-[#FFCA40]/60'
                      }`}
                      disabled={loading}
                    />
                  </div>
                </div>
                {status.dataset_date_min && status.dataset_date_max && (
                  <p className={`mt-2 text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Cakupan tanggal aktif pada DuckDB: {status.dataset_date_min} s.d. {status.dataset_date_max}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="severity-filter"
                  className={`block text-xs font-semibold mb-2 ${
                    isLight ? 'text-slate-700' : 'text-white/70'
                  }`}
                >
                  Filter Tingkat Risiko Klaim (Opsional)
                </label>
                <select
                  id="severity-filter"
                  value={severity}
                  onChange={(e) => {
                    const nextSev = e.target.value;
                    setSeverity(nextSev);
                    executeLiveQuery(selectedQuery, startDate, endDate, nextSev);
                  }}
                  className={`block w-full rounded-xl text-sm py-3 px-4 cursor-pointer border ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600'
                      : 'bg-[#00134A] border-white/10 text-white focus:border-[#FFCA40]/60'
                  }`}
                  disabled={loading}
                >
                  <option value="" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Semua Tingkat Risiko (All Severities)</option>
                  <option value="low" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Rendah (Jalur Hijau / RJTL)</option>
                  <option value="moderate" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Sedang (Jalur Kuning / Severity I)</option>
                  <option value="high" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Tinggi (Jalur Oranye / Severity II)</option>
                  <option value="critical" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Kritis (Jalur Merah / Severity III)</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={handleExecute}
                disabled={!selectedQuery || loading}
                className={`inline-flex items-center gap-2 px-6 py-3 text-sm rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-gradient-to-r from-[#FFCA40] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Mengeksekusi Kueri via Insights Agent...' : 'Jalankan Analitik Privasi JKN'}
              </button>

              {selectedQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedQuery('high_risk_trends');
                    setStartDate('');
                    setEndDate('');
                    setSeverity('');
                    executeLiveQuery('high_risk_trends', '', '', '');
                  }}
                  disabled={loading}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer border ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                      : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Reset &amp; Kueri Ulang Live
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. Query Results */}
        <div className={`relative overflow-hidden rounded-2xl border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50 backdrop-blur-xl'
        }`}>
          <div className={`p-6 border-b flex justify-between items-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <div>
              <h2 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Hasil Kueri Analitik (Query Results)
              </h2>
              <p className={`text-xs mt-1 font-mono uppercase tracking-wider ${
                isLight ? 'text-emerald-700 font-bold' : 'text-[#FFCA40]'
              }`}>
                {result ? result.query_label : 'OUTPUT ANALITIK KLAIM JKN YANG DILINDUNGI PRIVASI'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={!result}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-colors ${
                result
                  ? isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900 cursor-pointer shadow-sm'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 cursor-pointer shadow-md'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <Download className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
              EKSPOR CSV
            </button>
          </div>

          {!result ? (
            <div className="p-10 flex items-center justify-center">
              <div className={`text-center py-8 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                <div className={`border rounded-full p-5 inline-block mb-4 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white/5 border-white/10 text-white/40'
                }`}>
                  <BarChart3 className="h-10 w-10" />
                </div>
                <p className={`text-base font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  Belum ada hasil kueri yang dijalankan
                </p>
                <p className={`text-xs mt-1.5 max-w-sm mx-auto ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  Pilih salah satu kueri audit pada panel di atas lalu klik{' '}
                  <strong className={isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}>&quot;Jalankan Analitik Privasi JKN&quot;</strong> untuk menghasilkan wawasan
                  pengawasan klaim yang aman secara privasi.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Success Banner */}
              <div className={`rounded-xl p-4 flex items-start gap-3 border ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}>
                <CheckCircle2 className={`h-5 w-5 shrink-0 mt-0.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                <div className="text-xs space-y-1">
                  <p className={`font-bold text-sm ${isLight ? 'text-emerald-900' : 'text-emerald-200'}`}>
                    Kueri berhasil dieksekusi langsung di DuckDB ({Number(result?.result?.total_records_anonymized || 0).toLocaleString('id-ID')} berkas teranonimisasi)
                  </p>
                  <p className={isLight ? 'text-emerald-800' : 'text-emerald-300'}>Alur Eksekusi: {(result.execution_path || []).join(' → ')}</p>
                  <p className={isLight ? 'text-emerald-800' : 'text-emerald-300'}>Waktu Eksekusi: {result.execution_time_ms} ms</p>
                  {result?.filter_applied?.filter_note && (
                    <p className={`mt-1.5 font-semibold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                      Catatan Filter: {result.filter_applied.filter_note}
                    </p>
                  )}
                </div>
              </div>

              {/* Summary & Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`rounded-xl p-5 border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white'
                }`}>
                  <h3 className={`text-base font-bold mb-2 flex items-center gap-2 ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    <Sparkles className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
                    Ringkasan Eksekutif IA
                  </h3>
                  <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>{result.summary}</p>
                </div>

                <div className={`rounded-xl p-5 border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white'
                }`}>
                  <h3 className={`text-base font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Rekomendasi Tindak Lanjut Audit
                  </h3>
                  <div className="space-y-2.5">
                    {result.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg p-3 border shadow-sm ${
                          isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <span className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {rec.recommendation}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${getPriorityBadgeStyle(rec.priority, isLight)}`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>→ {rec.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className={`rounded-xl p-5 border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <h3 className={`text-sm font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Visualisasi Hasil Kueri Teranonimisasi
                </h3>
                <div className="h-72 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    {getChartForQueryType(result.query_name, result.result.data, isLight)}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Recent Reports */}
        <div className={`relative overflow-hidden rounded-2xl border p-6 transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50 backdrop-blur-xl'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-bold flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <Calendar className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
              Laporan Wawasan Audit Terbaru (Recent Reports)
            </h2>
            <button
              type="button"
              onClick={() => setShowAllReportsModal(true)}
              className={`text-xs font-semibold transition-colors cursor-pointer ${
                isLight ? 'text-emerald-700 hover:text-emerald-900' : 'text-[#FFCA40] hover:text-amber-300'
              }`}
            >
              Lihat Semua ({reports.length})
            </button>
          </div>

          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReportModal(report)}
                className={`rounded-xl p-4 border transition-colors group cursor-pointer ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-emerald-500/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{report.report_type}</span>
                      {(report.badge_label || report.llm_powered) && (
                        <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-full ${
                          (report.badge_label === 'AI Engine' || (!report.badge_label && report.llm_powered))
                            ? (isLight ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-purple-500/20 text-purple-300 border-purple-500/30')
                            : report.badge_color === 'emerald'
                            ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                            : report.badge_color === 'blue'
                            ? (isLight ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-500/20 text-blue-300 border-blue-500/30')
                            : (isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                        }`}>
                          {report.badge_label || 'AI Engine'}
                        </span>
                      )}
                      <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{report.generated_at}</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>{report.summary}</p>
                    <div className={`flex items-center gap-4 mt-2 text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      <span className="flex items-center gap-1 font-medium">
                        <FileText className="w-3.5 h-3.5 opacity-60" />
                        {Number(report.assessment_count || 0).toLocaleString('id-ID')} berkas klaim dianalisis
                      </span>
                      {report.high_risk_count > 0 && (
                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {Number(report.high_risk_count || 0).toLocaleString('id-ID')} klaim risiko tinggi/kritis
                        </span>
                      )}
                    </div>
                  </div>
                  <Eye className={`w-4 h-4 transition-colors shrink-0 mt-1 ${
                    isLight ? 'text-slate-400 group-hover:text-emerald-600' : 'text-white/40 group-hover:text-[#FFCA40]'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Privacy Guarantees */}
        <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
            : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50 backdrop-blur-xl'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className={`p-2 rounded-xl border shrink-0 ${
              isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-[#FFCA40]/10 border-[#FFCA40]/30 text-[#FFCA40]'
            }`}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className={`text-base font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Jaminan Privasi &amp; Kepatuhan Regulasi (Privacy Guarantees)
              </h2>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-xs ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                <div className="flex items-start gap-2">
                  <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>•</span>
                  <span>
                    <strong className={isLight ? 'text-slate-900' : 'text-white'}>k-anonymity (k≥5):</strong> Setiap kelompok
                    hasil agregasi klaim minimal memuat 5 peserta untuk mencegah re-identifikasi
                    individu.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>•</span>
                  <span>
                    <strong className={isLight ? 'text-slate-900' : 'text-white'}>Differential Privacy:</strong> Pelacakan
                    kuota ε-δ mencegah kebocoran atribut medis sensitif pada kueri berulang.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>•</span>
                  <span>
                    <strong className={isLight ? 'text-slate-900' : 'text-white'}>Validasi Persetujuan &amp; Zero-PHI:</strong>{' '}
                    Seluruh NIK dan nomor kartu JKN disamarkan sesuai UU PDP No. 27 Tahun 2022.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>•</span>
                  <span>
                    <strong className={isLight ? 'text-slate-900' : 'text-white'}>Kueri Terotorisasi (Allow-listed):</strong>{' '}
                    Hanya 9 kueri audit resmi yang telah disetujui Komite Medik &amp; TI yang dapat
                    dijalankan.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Detail Modal (Comprehensive Audit Dossier) */}
      {selectedReportModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedReportModal(null); }}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in ${
            isLight ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-[#00081c]/80 backdrop-blur-md'
          }`}
        >
          <div className={`rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 border max-h-[90vh] overflow-y-auto ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#00153A] border-white/20 text-white'
          }`}>
            <div className={`flex items-start justify-between border-b pb-4 gap-3 ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {selectedReportModal.report_type}
                  </h3>
                  {(selectedReportModal.badge_label || selectedReportModal.llm_powered) && (
                    <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-full ${
                      (selectedReportModal.badge_label === 'AI Engine' || (!selectedReportModal.badge_label && selectedReportModal.llm_powered))
                        ? (isLight ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-purple-500/20 text-purple-300 border-purple-500/30')
                        : selectedReportModal.badge_color === 'emerald'
                        ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                        : selectedReportModal.badge_color === 'blue'
                        ? (isLight ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-500/20 text-blue-300 border-blue-500/30')
                        : (isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                    }`}>
                      {selectedReportModal.badge_label || 'AI Engine'}
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  Diterbitkan: {selectedReportModal.generated_at} • Wilayah Kerja: {selectedReportModal.faskes_scope || 'Pusat & Multiregional Nasional'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportModal(null)}
                className={`p-1.5 rounded-lg shrink-0 ${
                  isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 KPI metric tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <div className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  Berkas Dianalisis
                </div>
                <div className={`text-xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {selectedReportModal.assessment_count?.toLocaleString('id-ID')}
                  <span className={`text-xs font-normal ml-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>klaim</span>
                </div>
              </div>
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-rose-50/60 border-rose-200' : 'bg-rose-500/10 border-rose-500/20'
              }`}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Risiko Tinggi / Kritis
                </div>
                <div className="text-xl font-bold mt-1 text-rose-700 dark:text-rose-400">
                  {Number(selectedReportModal.high_risk_count || 0).toLocaleString('id-ID')}
                  <span className="text-xs font-normal ml-1 opacity-80">berkas</span>
                </div>
              </div>
              <div className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20'
              }`}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Proteksi / Efisiensi
                </div>
                <div className="text-xl font-bold mt-1 text-emerald-800 dark:text-emerald-300">
                  {selectedReportModal.prevented_loss || 'SLA 10 Hari'}
                </div>
              </div>
            </div>

            {/* Ringkasan Eksekutif */}
            <div className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
            }`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <Sparkles className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
                Ringkasan Eksekutif &amp; Evaluasi Audit
              </h4>
              <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                {selectedReportModal.summary}
              </p>
            </div>

            {/* Temuan Kunci */}
            {selectedReportModal.key_findings && selectedReportModal.key_findings.length > 0 && (
              <div className="space-y-2">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Temuan Kunci Lapangan &amp; Anomali Klaim:
                </h4>
                <ul className="space-y-1.5 text-xs">
                  {selectedReportModal.key_findings.map((finding, idx) => (
                    <li key={idx} className={`flex items-start gap-2 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                      <span className={`font-bold mt-0.5 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rekomendasi Komite */}
            {selectedReportModal.recommendations && selectedReportModal.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Rekomendasi Tindak Lanjut Verifikator &amp; Faskes:
                </h4>
                <div className="space-y-2">
                  {selectedReportModal.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                        isLight ? 'bg-emerald-50/50 border-emerald-200 text-slate-800' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <button
                type="button"
                onClick={() => handleDownloadReport(selectedReportModal)}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-white/10 hover:bg-white/15 text-white border-white/20'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Berkas Dossier (.JSON)
              </button>
              <button
                type="button"
                onClick={() => setSelectedReportModal(null)}
                className={`w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-gradient-to-r from-[#FFCA40] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                }`}
              >
                Tutup Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Reports Archive Modal */}
      {showAllReportsModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowAllReportsModal(false); }}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in ${
            isLight ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-[#00081c]/80 backdrop-blur-md'
          }`}
        >
          <div className={`rounded-2xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl space-y-4 border max-h-[90vh] overflow-y-auto ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#00153A] border-white/20 text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <Calendar className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
                  Arsip Lengkap Laporan Wawasan &amp; Audit Klaim
                </h3>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  Total {reports.length} laporan audit tervalidasi tersimpan di repositori ClaimTrace
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAllReportsModal(false);
                  setReportSearchQuery('');
                }}
                className={`p-1.5 rounded-lg ${
                  isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-slate-400' : 'text-white/40'
              }`} />
              <input
                type="text"
                value={reportSearchQuery}
                onChange={(e) => setReportSearchQuery(e.target.value)}
                placeholder="Cari judul, topik, atau kata kunci audit..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 focus:border-emerald-600 text-slate-900 placeholder:text-slate-400'
                    : 'bg-white/5 border-white/10 focus:border-[#FFCA40] text-white placeholder:text-white/40'
                }`}
              />
            </div>

            {/* List of Reports */}
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {reports
                .filter((r) => {
                  if (!reportSearchQuery) return true;
                  const q = reportSearchQuery.toLowerCase();
                  return (
                    r.report_type.toLowerCase().includes(q) ||
                    r.summary.toLowerCase().includes(q) ||
                    (r.badge_label || '').toLowerCase().includes(q)
                  );
                })
                .map((report) => (
                  <div
                    key={report.id}
                    onClick={() => {
                      setSelectedReportModal(report);
                      setShowAllReportsModal(false);
                    }}
                    className={`rounded-xl p-4 border transition-colors group cursor-pointer ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-emerald-500/40'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {report.report_type}
                          </span>
                          {(report.badge_label || report.llm_powered) && (
                            <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-full ${
                              (report.badge_label === 'AI Engine' || (!report.badge_label && report.llm_powered))
                                ? (isLight ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-purple-500/20 text-purple-300 border-purple-500/30')
                                : report.badge_color === 'emerald'
                                ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                                : report.badge_color === 'blue'
                                ? (isLight ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-500/20 text-blue-300 border-blue-500/30')
                                : (isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                            }`}>
                              {report.badge_label || 'AI Engine'}
                            </span>
                          )}
                          <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                            {report.generated_at}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                          {report.summary}
                        </p>
                        <div className={`flex flex-wrap items-center gap-4 mt-2 text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                          <span className="flex items-center gap-1 font-medium">
                            <FileText className="w-3.5 h-3.5 opacity-60" />
                            {Number(report.assessment_count || 0).toLocaleString('id-ID')} berkas klaim dianalisis
                          </span>
                          {report.high_risk_count > 0 && (
                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {Number(report.high_risk_count || 0).toLocaleString('id-ID')} klaim risiko tinggi/kritis
                            </span>
                          )}
                          {report.prevented_loss && (
                            <span className={`font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                              • Proteksi: {report.prevented_loss}
                            </span>
                          )}
                        </div>
                      </div>
                      <Eye className={`w-4 h-4 transition-colors shrink-0 mt-1 ${
                        isLight ? 'text-slate-400 group-hover:text-emerald-600' : 'text-white/40 group-hover:text-[#FFCA40]'
                      }`} />
                    </div>
                  </div>
                ))}
            </div>

            <div className={`flex justify-end pt-3 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <button
                type="button"
                onClick={() => {
                  setShowAllReportsModal(false);
                  setReportSearchQuery('');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-white/10 hover:bg-white/15 text-white border-white/20'
                }`}
              >
                Tutup Arsip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
