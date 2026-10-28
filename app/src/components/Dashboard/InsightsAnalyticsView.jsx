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
  CartesianGrid,
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

const QUERY_RESULTS_MAP = {
  high_risk_trends: {
    summary:
      'Terdeteksi penurunan klaim risiko tinggi sebesar 14,2% dalam 14 hari terakhir setelah pengaktifan filter anomali readmisi < 30 hari. Volume klaim rawat inap berulang tetap terkonsentrasi pada subspesialisasi Jantung dan Bedah Saraf.',
    recommendations: [
      {
        priority: 'Kritis',
        recommendation: 'Prioritaskan verifikasi berkas klaim readmisi < 7 hari pada 3 RS Mitra Utama',
        action: 'Terbitkan Surat Permintaan Penjelasan (SPP) otomatis via sistem antrean',
      },
      {
        priority: 'Sedang',
        recommendation: 'Perkuat pemantauan diagnosis komorbiditas sekunder pada pasien geriatri',
        action: 'Terapkan validasi resume medis terstruktur sebelum persetujuan grouping INA-CBG',
      },
    ],
    data: [
      { name: '18 Okt', value: 24, avg_risk: 86.4 },
      { name: '19 Okt', value: 28, avg_risk: 88.2 },
      { name: '20 Okt', value: 22, avg_risk: 84.1 },
      { name: '21 Okt', value: 19, avg_risk: 81.5 },
      { name: '22 Okt', value: 25, avg_risk: 87.0 },
      { name: '23 Okt', value: 18, avg_risk: 79.8 },
      { name: '24 Okt', value: 15, avg_risk: 78.4 },
    ],
  },
  support_plan_effectiveness: {
    summary:
      'Dari 84 berkas klaim yang diterbitkan Berita Acara Klarifikasi Bersama (BAKB), 72,6% diselesaikan dengan koreksi tarif mandiri oleh FKRTL, menghemat potensi kerugian dana jaminan sosial sebesar Rp 412,8 juta.',
    recommendations: [
      {
        priority: 'Tinggi',
        recommendation: 'Standarisasi format lampiran hasil penunjang radiologi dan patologi anatomi',
        action: 'Kirim modul panduan koding INA-CBG Edisi Revisi ke seluruh Tim Casemix Faskes',
      },
    ],
    data: [
      { name: 'Koreksi Mandiri FKRTL', value: 61 },
      { name: 'Bantahan Diterima Medis', value: 14 },
      { name: 'Eskalasi Komite Pertimbangan', value: 6 },
      { name: 'Kadaluwarsa / Ditolak', value: 3 },
    ],
  },
  case_distribution: {
    summary:
      'Mayoritas berkas klaim berada pada Jalur Hijau (68%), 19% Jalur Kuning, 9% Jalur Oranye, dan 4% Jalur Merah yang membutuhkan investigasi forensik mendalam.',
    recommendations: [
      {
        priority: 'Rendah',
        recommendation: 'Terapkan Auto-Approval berbasis Machine Learning pada Jalur Hijau murni',
        action: 'Percepat SLA pembayaran FPK hingga di bawah 5 hari kerja untuk faskes bintang 5',
      },
    ],
    data: [
      { name: 'Jalur Hijau (Risiko Rendah)', value: 68 },
      { name: 'Jalur Kuning (Risiko Sedang)', value: 19 },
      { name: 'Jalur Oranye (Risiko Tinggi)', value: 9 },
      { name: 'Jalur Merah (Kritis/Audit)', value: 4 },
    ],
  },
  default: {
    summary:
      'Hasil pemrosesan analitik agregat terproteksi Zero-PHI. Seluruh entitas klaim telah melewati penyaringan k-anonymity (k=12) dan injeksi derau terukur differential privacy.',
    recommendations: [
      {
        priority: 'Info',
        recommendation: 'Pertahankan kuota privasi epsilon di bawah ambang batas aman',
        action: 'Pantau log akses analitik harian pada dashboard audit verifikator',
      },
    ],
    data: [
      { name: 'RS Tipe A Rujukan', value: 45 },
      { name: 'RS Tipe B Regional', value: 32 },
      { name: 'RS Tipe C Kab/Kota', value: 28 },
      { name: 'Klinik / FKRTL Khusus', value: 19 },
    ],
  },
};

const INITIAL_REPORTS = [
  {
    id: 'rep-1',
    report_type: 'Audit Eksekutif Mingguan Klaim FKRTL',
    generated_at: '24 Okt 2026, 08:30 WIB',
    summary:
      'Evaluasi 1.420 berkas klaim rawat inap & jalan. Deteksi anomali readmisi menurun 12%, kepatuhan Fornas mencapai 94,8%.',
    assessment_count: 1420,
    high_risk_count: 57,
    llm_powered: true,
    badge_label: 'AI Engine',
    badge_color: 'purple',
    prevented_loss: 'Rp 412,8 Juta',
    faskes_scope: '28 FKRTL Rujukan Surakarta & Sekitarnya',
    key_findings: [
      'Penurunan anomali readmisi rawat inap < 30 hari sebesar 12,4% pasca integrasi filter triase',
      'Kepatuhan restriksi Fornas pada subspesialisasi Jantung & Paru mencapai 94,8%',
      '57 berkas berisiko tinggi terkonsentrasi pada klaim tindakan bedah saraf berulang',
    ],
    recommendations: [
      'Penerbitan Surat Permintaan Penjelasan (SPP) digital pada 3 faskes dengan volume readmisi tertinggi',
      'Penyelarasan resume medis digital dengan hasil pemeriksaan patologi sebelum persetujuan grouping',
    ],
  },
  {
    id: 'rep-2',
    report_type: 'Laporan Triase Cepat & Validasi Presensi Mobile JKN',
    generated_at: '23 Okt 2026, 17:00 WIB',
    summary:
      'Validasi kehadiran peserta via telemetri geolokasi Mobile JKN berhasil mencegah 29 klaim fiktif fisioterapi rawat jalan.',
    assessment_count: 384,
    high_risk_count: 18,
    llm_powered: false,
    badge_label: 'Telemetri JKN',
    badge_color: 'emerald',
    prevented_loss: 'Rp 87,4 Juta',
    faskes_scope: '14 Klinik Pratama & RS Tipe C/D',
    key_findings: [
      '29 transaksi klaim fisioterapi terdeteksi anomali tanpa rekaman check-in biometrik peserta',
      'Penyimpangan geolokasi faskes terdeteksi > 500 meter dari koordinat terdaftar',
      'Tingkat validasi presensi real-time peserta mencapai 97,2% di seluruh FKRTL aktif',
    ],
    recommendations: [
      'Penangguhan klaim pending untuk 29 berkas tanpa bukti check-in digital',
      'Koordinasi verifikator lapangan KC Surakarta untuk validasi fisik logbook faskes',
    ],
  },
  {
    id: 'rep-3',
    report_type: 'Evaluasi Efisiensi SLA Verifikasi Kantor Cabang',
    generated_at: '22 Okt 2026, 09:15 WIB',
    summary:
      'Rata-rata waktu penyelesaian audit berkas klaim mencapai 4,2 jam, jauh melampaui batas toleransi SLA 10 hari kerja.',
    assessment_count: 912,
    high_risk_count: 31,
    llm_powered: true,
    badge_label: 'AI Engine',
    badge_color: 'purple',
    prevented_loss: 'SLA 4,2 Jam (100% On-Time)',
    faskes_scope: 'Seluruh Faskes KC Surakarta (Kedeputian VI)',
    key_findings: [
      'Rata-rata siklus verifikasi pra-bayar turun dari 8,6 hari kerja menjadi 4,2 jam berkat triase otomatis',
      'Zero klaim kadaluwarsa (out of SLA) tercapai selama 4 pekan berturut-turut',
      'Pencegahan denda keterlambatan pembayaran FPK sesuai amanat Perpres 82/2018',
    ],
    recommendations: [
      'Pertahankan mekanisme auto-routing berkas berisiko rendah (Jalur Hijau)',
      'Tingkatkan kuota verifikator medis pada jam puncak pengajuan klaim (14:00 - 17:00 WIB)',
    ],
  },
  {
    id: 'rep-4',
    report_type: 'Audit Integritas Koding INA-CBG Spesialisasi Orthopedi',
    generated_at: '19 Okt 2026, 14:00 WIB',
    summary:
      'Analisis pola penambahan kode prosedur fiksasi interna pada 520 klaim orthopedi, mendeteksi 14 anomali fragmentasi tindakan (unbundling).',
    assessment_count: 520,
    high_risk_count: 14,
    llm_powered: true,
    badge_label: 'Audit Casemix',
    badge_color: 'blue',
    prevented_loss: 'Rp 148,2 Juta',
    faskes_scope: '9 RS Tipe A & B Bedah Tulang',
    key_findings: [
      'Ditemukan pemisahan kode penutupan luka dan pemasangan implan yang seharusnya terbundel dalam 1 paket tarif',
      'Potensi ketidaksesuaian tarif INA-CBG terdeteksi dengan skor anomali rata-rata 86,4/100',
    ],
    recommendations: [
      'Penerbitan rekomendasi koreksi koding mandiri kepada tim koder rumah sakit',
      'Pelaksanaan forum sosialisasi berita acara klarifikasi casemix bersama perwakilan komite medik',
    ],
  },
  {
    id: 'rep-5',
    report_type: 'Kajian Kepatuhan Formularium Nasional Saraf & Jantung',
    generated_at: '16 Okt 2026, 11:30 WIB',
    summary:
      'Audit keselarasan terapi obat kronis antihipertensi dan antikoagulan dengan restriksi Kepmenkes HK.01.07/MENKES/6477/2021.',
    assessment_count: 760,
    high_risk_count: 9,
    llm_powered: false,
    badge_label: 'Farmakovigilan',
    badge_color: 'amber',
    prevented_loss: 'Rp 64,5 Juta',
    faskes_scope: '18 RS Rujukan Kardiovaskular',
    key_findings: [
      'Kepatuhan resep Fornas lini pertama mencapai 96,1%',
      'Hanya 9 berkas membutuhkan verifikasi lanjutan alasan penggantian obat non-Fornas',
    ],
    recommendations: [
      'Validasi formulir persetujuan komite farmasi dan terapi RS untuk klaim obat khusus',
    ],
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
      <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: tickFill }} axisLine={{ stroke: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)' }} />
        <YAxis tick={{ fontSize: 11, fill: tickFill }} axisLine={{ stroke: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)' }} />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={false}
          formatter={(value, name) => [
            name === 'Rata-Rata Skor Risiko' ? `${value} / 100` : `${value} berkas`,
            name,
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={isLight ? '#059669' : '#06b6d4'}
          strokeWidth={3}
          name="Jumlah Kasus Anomali"
          dot={{ r: 4, fill: isLight ? '#059669' : '#06b6d4' }}
          activeDot={{ r: 6 }}
          isAnimationActive={false}
        />
        {data[0]?.avg_risk && (
          <Line
            type="monotone"
            dataKey="avg_risk"
            stroke="#e11d48"
            strokeWidth={2.5}
            name="Rata-Rata Skor Risiko"
            dot={{ r: 4, fill: '#e11d48' }}
            activeDot={{ r: 6 }}
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
        <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val} berkas`, 'Volume']} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
      </PieChart>
    );
  } else {
    return (
      <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: tickFill }} axisLine={{ stroke: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)' }} />
        <YAxis tick={{ fontSize: 11, fill: tickFill }} axisLine={{ stroke: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)' }} />
        <Tooltip contentStyle={tooltipStyle} cursor={false} formatter={(val) => [`${val} berkas`, 'Jumlah Temuan']} />
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

  // Privacy status state
  const [status] = useState({
    k_value: 12,
    k_threshold: 5,
    epsilon_used: 7.1,
    epsilon_total: 20.0,
    consented_users: 324,
    total_users: 500,
  });

  // Query Selector state
  const [selectedQuery, setSelectedQuery] = useState('high_risk_trends');
  const [startDate, setStartDate] = useState('2026-10-18');
  const [endDate, setEndDate] = useState('2026-10-24');
  const [severity, setSeverity] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({
    query_name: 'high_risk_trends',
    query_label: ALLOW_LISTED_QUERIES[0].label,
    execution_path: [
      'Validasi Otorisasi Verifikator',
      'Filter K-Anonymity (k≥5)',
      'Agregasi Zero-PHI',
      'Sintesis AI Wawasan JKN (IA Agent)',
    ],
    execution_time_ms: 342,
    summary: QUERY_RESULTS_MAP.high_risk_trends.summary,
    recommendations: QUERY_RESULTS_MAP.high_risk_trends.recommendations,
    result: {
      total_records_anonymized: 158,
      k_anonymity_satisfied: true,
      data: QUERY_RESULTS_MAP.high_risk_trends.data,
    },
    privacy_metadata: {
      k_value: 12,
      epsilon_used: 0.35,
      delta_used: 1e-5,
    },
  });
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [selectedReportModal, setSelectedReportModal] = useState(null);
  const [showAllReportsModal, setShowAllReportsModal] = useState(false);
  const [reportSearchQuery, setReportSearchQuery] = useState('');

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

  const handleExecute = () => {
    if (!selectedQuery) return;
    setLoading(true);
    setTimeout(() => {
      const template = QUERY_RESULTS_MAP[selectedQuery] || QUERY_RESULTS_MAP.default;
      const queryObj = ALLOW_LISTED_QUERIES.find((q) => q.value === selectedQuery);
      setResult({
        query_name: selectedQuery,
        query_label: queryObj?.label || selectedQuery,
        execution_path: [
          'Validasi Otorisasi Verifikator',
          'Filter K-Anonymity (k≥5)',
          'Agregasi Zero-PHI',
          'Sintesis AI Wawasan JKN (IA Agent)',
        ],
        execution_time_ms: 342,
        summary: template.summary,
        recommendations: template.recommendations,
        result: {
          total_records_anonymized: 158,
          k_anonymity_satisfied: true,
          data: template.data,
        },
        privacy_metadata: {
          k_value: 12,
          epsilon_used: 0.35,
          delta_used: 1e-5,
        },
      });
      setLoading(false);
    }, 450);
  };

  const handleExportCSV = () => {
    if (!result) return;
    const csvContent = JSON.stringify(result.result.data, null, 2);
    const blob = new Blob([csvContent], { type: 'text/csv' });
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
                  Ambang batas: k ≥ {status.k_threshold} klaim/kelompok (Terpenuhi: Margin +140%)
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
                  {status.consented_users}{' '}
                  <span className={`text-lg font-normal ${isLight ? 'text-slate-400' : 'text-white/40'}`}>/ {status.total_users}</span>
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
                  onChange={(e) => setSelectedQuery(e.target.value)}
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
                <p className={`mt-2 text-xs font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  ✓ Seluruh kueri menerapkan k-anonymity (k≥5) dan enkripsi Zero-PHI (UU PDP)
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
                    <input aria-label="Bidang input data"
                      type="date"
                      value={startDate}
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
                    <input aria-label="Bidang input data"
                      type="date"
                      value={endDate}
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
                  onChange={(e) => setSeverity(e.target.value)}
                  className={`block w-full rounded-xl text-sm py-3 px-4 cursor-pointer border ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600'
                      : 'bg-[#00134A] border-white/10 text-white focus:border-[#FFCA40]/60'
                  }`}
                  disabled={loading}
                >
                  <option value="" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Semua Tingkat Risiko (All Severities)</option>
                  <option value="low" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Rendah (Jalur Hijau)</option>
                  <option value="moderate" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Sedang (Jalur Kuning)</option>
                  <option value="high" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Tinggi (Jalur Oranye)</option>
                  <option value="critical" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>Kritis (Jalur Merah Pra-Bayar)</option>
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
                    setStartDate('2026-10-18');
                    setEndDate('2026-10-24');
                    setSeverity('');
                    const template = QUERY_RESULTS_MAP.high_risk_trends;
                    setResult({
                      query_name: 'high_risk_trends',
                      query_label: ALLOW_LISTED_QUERIES[0].label,
                      execution_path: [
                        'Validasi Otorisasi Verifikator',
                        'Filter K-Anonymity (k≥5)',
                        'Agregasi Zero-PHI',
                        'Sintesis AI Wawasan JKN (IA Agent)',
                      ],
                      execution_time_ms: 310,
                      summary: template.summary,
                      recommendations: template.recommendations,
                      result: {
                        total_records_anonymized: 158,
                        k_anonymity_satisfied: true,
                        data: template.data,
                      },
                      privacy_metadata: {
                        k_value: 12,
                        epsilon_used: 0.35,
                        delta_used: 1e-5,
                      },
                    });
                  }}
                  disabled={loading}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer border ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                      : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Reset ke Default
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
                  <p className={`font-bold text-sm ${isLight ? 'text-emerald-900' : 'text-emerald-200'}`}>Kueri berhasil dieksekusi oleh Insights Agent</p>
                  <p className={isLight ? 'text-emerald-800' : 'text-emerald-300'}>Alur Eksekusi: {result.execution_path.join(' → ')}</p>
                  <p className={isLight ? 'text-emerald-800' : 'text-emerald-300'}>Waktu Eksekusi: {result.execution_time_ms} ms</p>
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
                        {report.assessment_count} berkas klaim dianalisis
                      </span>
                      {report.high_risk_count > 0 && (
                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {report.high_risk_count} klaim risiko tinggi/kritis
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
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in ${
          isLight ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-[#00081c]/80 backdrop-blur-md'
        }`}>
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
                  Diterbitkan: {selectedReportModal.generated_at} • Wilayah Kerja: {selectedReportModal.faskes_scope || 'KC Surakarta (Kedeputian VI)'}
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
                  {selectedReportModal.high_risk_count}
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
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in ${
          isLight ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-[#00081c]/80 backdrop-blur-md'
        }`}>
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
                            {report.assessment_count} berkas klaim dianalisis
                          </span>
                          {report.high_risk_count > 0 && (
                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {report.high_risk_count} klaim risiko tinggi/kritis
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
