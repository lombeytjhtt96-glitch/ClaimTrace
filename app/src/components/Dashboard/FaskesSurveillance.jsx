import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE_URL, getCachedJsonSync, cachedAuthGetJson } from '../../services/apiConfig';
import { useCockpitTheme } from '../../hooks/useCockpitTheme';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { SingleLineYAxisTick, formatAxisLabel } from '../Common/PolicyWidgets';
import WorkflowPipelineBanner from '../Common/WorkflowPipelineBanner';
import { motion, AnimatePresence } from 'motion/react';
import {
  Hospital, Search, Filter, AlertTriangle, ShieldCheck,
  ExternalLink, TrendingUp, Building2, MapPin, CheckCircle2,
  XCircle, Clock, ChevronRight, AlertOctagon, Activity, X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts';

export default function FaskesSurveillance({
  onSelectHospital,
  onSelectFaskesCase,
  onNavigateTab,
  onOpenWorkflowMap,
  isLight: propIsLight,
}) {
  const isLight = useCockpitTheme(propIsLight);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedFaskesDetail, setSelectedFaskesDetail] = useState(null);
  const [faskesAiAudit, setFaskesAiAudit] = useState({});
  const [faskesAiLoading, setFaskesAiLoading] = useState(false);

  useEscapeKey(Boolean(selectedFaskesDetail), () => setSelectedFaskesDetail(null));

  const handleRunFaskesAiAudit = (faskes) => {
    if (!faskes || faskesAiLoading) return;
    setFaskesAiLoading(true);
    try {
      const friVal = Number(faskes.friScore || 0);
      const isCritical = friVal >= 70;
      const findings = [
        {
          label: 'Indeks Risiko Faskes (FRI)',
          value: `${faskes.friScore}/100 (${faskes.riskLevel})`,
          rule: 'Permenkes RI No. 16 Tahun 2019 (Pencegahan Kecurangan JKN)',
        },
        {
          label: 'Volume & Rasio Anomali',
          value: `${faskes.anomalyCount} berkas anomali dari ${faskes.totalClaimsMonth} klaim/bulan (Lonjakan ${faskes.spikeRatio})`,
          rule: 'Perpres RI No. 82 Tahun 2018 Ps. 75-76 (SLA 10 Hari Kerja)',
        },
        {
          label: 'Status Biometrik FRISTA & Temuan',
          value: `${faskes.fristaStatus} - ${faskes.primaryFinding}`,
          rule: 'Audit Kredensial & Presensi Multi-Lapis FKRTL',
        },
      ];
      const recommendedStep = isCritical
        ? 'Tunda pembayaran klaim berisiko pada Berita Acara Kelengkapan Berkas (BAKB), wajibkan klarifikasi RME bertanda tangan asli, dan eskalasi ke Tim Pencegahan Kecurangan Kantor Cabang.'
        : 'Lakukan uji petik kelengkapan dokumen RME-TTE pada klaim bertanda kuning dan pantau kepatuhan aktivasi FRISTA di loket SEP.';

      setFaskesAiAudit((prev) => ({
        ...prev,
        [faskes.id]: {
          findings,
          recommendedStep,
          historyAudit: faskes.historyAudit,
          humanGate: 'Wajib verifikasi dan tanda tangan Pejabat Verifikator / Wasrik BPJS Kesehatan.',
        },
      }));
    } finally {
      setFaskesAiLoading(false);
    }
  };

  const mapProvidersToFaskes = (provData, claimsRaw) => {
    const claimsByFaskes = {};
    (Array.isArray(claimsRaw) ? claimsRaw : []).forEach((item) => {
      const c = item?.claim;
      const t = item?.triage;
      if (c?.faskes_id) claimsByFaskes[c.faskes_id] = { claim: c, triage: t };
    });
    const providers = Array.isArray(provData?.providers) ? provData.providers : [];
    return providers.map((p) => {
      const linked = claimsByFaskes[p.faskes_id];
      const c = linked?.claim || {};
      const t = linked?.triage || {};
      const triageScore = Number(t.final_priority_score ?? p.rata_skor_prioritas_klaim ?? p.skor_risiko_perilaku_faskes ?? 0);
      const friScore = Number(triageScore > p.skor_risiko_perilaku_faskes ? triageScore : p.skor_risiko_perilaku_faskes).toFixed(1);
      const numericFri = Number(friScore);
      const riskLevel = numericFri >= 70
        ? 'TINGGI / KRITIS (MERAH)'
        : numericFri >= 40
        ? 'SEDANG (KUNING)'
        : 'RENDAH (HIJAU)';
      const isExpired = c.dpjp_meta?.sip_status === 'EXPIRED';
      const spikeRatio = c.episode_meta?.rasio_lonjakan_baseline
        ? `${Number(c.episode_meta.rasio_lonjakan_baseline).toFixed(1)}x`
        : `${Number(p.rasio_klaim_per_pasien || 1).toFixed(1)}x`;
      return {
        id: p.faskes_id,
        linkedClaimId: c.claim_id || 'CLM-2026-8801',
        name: p.nama_faskes,
        type: `${c.fkl08_jenis_faskes || 'Rumah Sakit'} Kelas ${p.kelas_rs || c.kelas_rs || 'B'}`,
        city: p.nama_faskes.includes('Bandung') ? 'Bandung' : p.nama_faskes.includes('Surabaya') ? 'Surabaya' : p.nama_faskes.includes('Yogyakarta') ? 'Yogyakarta' : 'Jabodetabek',
        province: 'Indonesia',
        director: c.dpjp_meta?.nama_dpjp_alias ? `PIC Medis: ${c.dpjp_meta.nama_dpjp_alias}` : 'Komite Medik FKRTL',
        friScore: numericFri,
        riskLevel,
        totalClaimsMonth: Number(p.total_klaim || 0),
        totalRupiahMonth: `Rp ${Number(p.total_biaya_tagih_rp || 0).toLocaleString('id-ID')}`,
        anomalyCount: Number(p.jumlah_klaim_merah || p.total_klaim_repeat_billing || 0),
        spikeRatio,
        primaryFinding: t.ringkasan_bukti_audit || `Skor perilaku faskes ${p.skor_risiko_perilaku_faskes}/100 (${p.kategori_risiko_faskes}).`,
        fristaStatus: isExpired ? 'ANOMALI HARD-TRIGGER' : numericFri >= 40 ? 'KLARIFIKASI AKTIF' : 'AKTIF TERVERIFIKASI',
        historyAudit: t.rekomendasi_sop || `Pemantauan Basis Data real-time atas ${p.total_klaim} berkas klaim & ${p.total_dpjp_unik} DPJP unik.`,
      };
    });
  };

  const provUrl = `${API_BASE_URL}/api/v1/analytics/provider-risk`;
  const claimsUrl = `${API_BASE_URL}/api/v1/claims`;
  const natUrl = `${API_BASE_URL}/api/v1/system/national-scale-metrics`;
  const cachedProv = getCachedJsonSync(provUrl);
  const cachedClaims = getCachedJsonSync(claimsUrl);
  const cachedNat = getCachedJsonSync(natUrl);

  const [liveFaskes, setLiveFaskes] = useState(() =>
    cachedProv ? mapProvidersToFaskes(cachedProv, cachedClaims) : []
  );
  const [nationalSummary, setNationalSummary] = useState(() => cachedNat?.portfolio_metrics || null);

  useEffect(() => {
    let active = true;
    const loadFaskesIntelligence = async () => {
      try {
        const [provData, claimsRaw, nat] = await Promise.all([
          cachedAuthGetJson(provUrl),
          cachedAuthGetJson(claimsUrl),
          cachedAuthGetJson(natUrl),
        ]);
        if (provData && active) {
          setLiveFaskes(mapProvidersToFaskes(provData, claimsRaw));
        }
        if (nat && active) {
          setNationalSummary(nat?.portfolio_metrics || null);
        }
      } catch (err) {
        console.error('Gagal memuat data pengawasan faskes:', err);
      }
    };
    loadFaskesIntelligence();
    return () => { active = false; };
  }, [provUrl, claimsUrl, natUrl]);

  const criticalFaskesList = liveFaskes.filter(f => f.friScore >= 70);
  const mediumFaskesList = liveFaskes.filter(f => f.friScore >= 40 && f.friScore < 70);
  const safeFaskesList = liveFaskes.filter(f => f.friScore < 40);

  const filteredFaskes = liveFaskes.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || f.type.toLowerCase().includes(selectedClass.toLowerCase());
    return matchesSearch && matchesClass;
  });

  return (
    <div className={`space-y-4 font-sans pb-20 animate-fade-in ${isLight ? 'text-slate-800' : 'text-white'}`}>
      {/* HEADER SECTION & SEARCH CONTROLS */}
      <div className="space-y-3">
        <div className={`p-5 rounded-2xl border backdrop-blur-xl space-y-2 transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm text-slate-800'
            : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 text-white'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}>
                  Surveilans Faskes (FRI)
                </span>
                <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  Direktori FKRTL Nasional · PMK 26/2021
                </span>
              </div>
              <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Pemantauan Kepatuhan &amp; Indeks Risiko Fasilitas Kesehatan
              </h2>
            </div>
          </div>

          {/* 4 KPI METRIC BANNER */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200 dark:border-white/10">
            <div className={`p-3 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                Total Faskes Terpantau
              </div>
              <div className={`text-base font-bold tabular-nums mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {Number(nationalSummary?.distinct_fkrtl_facilities || 2091).toLocaleString('id-ID')} FKRTL Terpantau
              </div>
              <div className={`text-xs font-normal mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                {Number(nationalSummary?.kabupaten_kota_coverage || 496).toLocaleString('id-ID')} Kab/Kota ({liveFaskes.length} Audit Prioritas)
              </div>
            </div>

            <div className={`p-3 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                <AlertOctagon className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Risiko Kritis (FRI ≥ 70)
              </div>
              <div className={`text-base font-bold tabular-nums mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {criticalFaskesList.length} RS Kritis
              </div>
              <div className={`text-xs font-normal mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                {criticalFaskesList[0] ? `${criticalFaskesList[0].name} (Skor ${criticalFaskesList[0].friScore})` : 'Memuat evaluasi...'}
              </div>
            </div>

            <div className={`p-3 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                Pengawasan Khusus (40-70)
              </div>
              <div className={`text-base font-bold tabular-nums mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {mediumFaskesList.length} RS Sedang
              </div>
              <div className={`text-xs font-normal mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                {mediumFaskesList.length > 0 ? mediumFaskesList.slice(0, 2).map(x => x.name).join(' & ') : 'Pantauan berkala aktif'}
              </div>
            </div>

            <div className={`p-3 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                Kepatuhan Terverifikasi
              </div>
              <div className={`text-base font-bold tabular-nums mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {safeFaskesList.length} RS Terakreditasi
              </div>
              <div className={`text-xs font-normal mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Skor FRI Rendah (&lt; 40)
              </div>
            </div>
          </div>
        </div>

        {/* GRAFIK PERBANDINGAN INDEKS RISIKO FRI FASKES */}
        {filteredFaskes.length > 0 && (
          <div className={`rounded-2xl p-4 sm:p-5 border ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#00153A]/75 border-white/10'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Peta Risiko Faskes (Top 6 Indeks FRI)
                </h2>
                <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Perbandingan visual skor risiko kecurangan antar fasilitas kesehatan (ambang waspada ≥ 40, kritis ≥ 65)
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-semibold">
                <span className="inline-flex items-center gap-1.5 text-rose-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  Kritis (&ge; 65)
                </span>
                <span className="inline-flex items-center gap-1.5 text-amber-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  Waspada (40-64)
                </span>
                <span className="inline-flex items-center gap-1.5 text-emerald-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  Normal (&lt; 40)
                </span>
              </div>
            </div>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...filteredFaskes]
                    .sort((a, b) => Number(b.friScore) - Number(a.friScore))
                    .slice(0, 6)
                    .map((f) => ({
                      shortName: formatAxisLabel(f.name, { maxChars: 32, stripParens: true }),
                      fullName: f.name,
                      friScore: Number(f.friScore || 0),
                      anomalyCount: f.anomalyCount || 0,
                    }))}
                  layout="vertical"
                  margin={{ top: 4, right: 44, left: 6, bottom: 4 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fontSize: 11, fill: isLight ? '#64748b' : '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    width={218}
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                    tick={
                      <SingleLineYAxisTick
                        fill={isLight ? '#334155' : '#e2e8f0'}
                        fontSize={11}
                        fontWeight={600}
                        maxChars={32}
                        stripParens
                      />
                    }
                  />
                  <Tooltip
                    cursor={false}
                    formatter={(val, _name, item) => [`${val} / 100 (${item?.payload?.anomalyCount || 0} anomali)`, 'Skor FRI']}
                    labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullName || ''}
                    contentStyle={{
                      backgroundColor: isLight ? '#ffffff' : '#0b1936',
                      borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      fontSize: '12px',
                      color: isLight ? '#0f172a' : '#f8fafc',
                    }}
                  />
                  <Bar dataKey="friScore" radius={[0, 6, 6, 0]} barSize={18} isAnimationActive={false}>
                    {[...filteredFaskes]
                      .sort((a, b) => Number(b.friScore) - Number(a.friScore))
                      .slice(0, 6)
                      .map((entry, idx) => {
                        const score = Number(entry.friScore || 0);
                        const fill = score >= 65 ? '#f43f5e' : score >= 40 ? '#f59e0b' : '#10b981';
                        return <Cell key={`fri-cell-${entry.id || idx}`} fill={fill} />;
                      })}
                    <LabelList
                      dataKey="friScore"
                      position="right"
                      formatter={(val) => Number(val || 0).toFixed(1).replace('.', ',')}
                      style={{
                        fontSize: 11,
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontWeight: 700,
                        fill: isLight ? '#0f172a' : '#f8fafc',
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm text-slate-800'
            : 'bg-[#00153A]/85 border-white/10 shadow-xl text-white'
        }`}>
          <div className="relative flex-1 min-w-[280px]">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isLight ? 'text-slate-400' : 'text-white/40'
            }`} />
            <input
              id="faskes-search-input"
              name="faskes_search"
              aria-label="Cari rumah sakit, kode FKRTL, atau wilayah"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama RS atau Kode Faskes (e.g. Mitra Husada, FSK-0132R001)..."
              className={`w-full rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none transition border ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500'
                  : 'bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#FFCA40]/60 focus:bg-white/10'
              }`}
            />
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold">
            <button type="button"
              onClick={() => setSelectedClass('all')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                selectedClass === 'all'
                  ? isLight ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'bg-[#FFCA40] text-[#00134A] shadow-md shadow-[#FFCA40]/20 font-bold'
                  : isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200' : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              Semua Kelas ({liveFaskes.length})
            </button>
            <button type="button"
              onClick={() => setSelectedClass('khusus')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                selectedClass === 'khusus'
                  ? isLight ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'bg-[#FFCA40] text-[#00134A] shadow-md shadow-[#FFCA40]/20 font-bold'
                  : isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200' : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              RS Khusus ({liveFaskes.filter(f => f.type.toLowerCase().includes('khusus')).length})
            </button>
            <button type="button"
              onClick={() => setSelectedClass('kelas a')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                selectedClass === 'kelas a'
                  ? isLight ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'bg-[#FFCA40] text-[#00134A] shadow-md shadow-[#FFCA40]/20 font-bold'
                  : isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200' : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              Kelas A ({liveFaskes.filter(f => f.type.toLowerCase().includes('kelas a')).length})
            </button>
            <button type="button"
              onClick={() => setSelectedClass('kelas b')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                selectedClass === 'kelas b'
                  ? isLight ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'bg-[#FFCA40] text-[#00134A] shadow-md shadow-[#FFCA40]/20 font-bold'
                  : isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200' : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              Kelas B ({liveFaskes.filter(f => f.type.toLowerCase().includes('kelas b')).length})
            </button>
          </div>
        </div>
      </div>

      {/* FASKES GRID CARDS CONTAINER */}
      <div className="pt-1">
        {filteredFaskes.length === 0 ? (
          <div className={`rounded-2xl p-12 text-center space-y-2 border backdrop-blur-xl ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#00153A]/85 border-white/10 shadow-xl'
          }`}>
            <AlertOctagon className={`w-8 h-8 mx-auto ${isLight ? 'text-slate-400' : 'text-white/30'}`} />
            <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Tidak ada Fasilitas Kesehatan yang sesuai</h4>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Coba periksa kembali kata kunci pencarian atau ganti filter kelas faskes.</p>
            <button type="button"
              onClick={() => { setSearchQuery(''); setSelectedClass('all'); }}
              className={`mt-2 text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                  : 'text-[#FFCA40] bg-[#FFCA40]/10 border-[#FFCA40]/30 hover:bg-[#FFCA40]/20'
              }`}
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredFaskes.map((faskes) => {
              const isCritical = faskes.friScore >= 70;
              const isMedium = faskes.friScore >= 40 && faskes.friScore < 70;
              return (
                <motion.div 
                  key={faskes.id}
                  initial={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  className={`p-4 rounded-2xl border transition-all space-y-3 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden ${
                    isLight
                      ? isCritical
                        ? 'bg-rose-50/50 border-rose-300 hover:border-rose-400 text-slate-900 shadow-xs'
                        : isMedium
                        ? 'bg-amber-50/50 border-amber-300 hover:border-amber-400 text-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                      : isCritical 
                        ? 'border-rose-500/40 hover:border-rose-400 bg-rose-500/10 text-white shadow-xl shadow-[#00081c]/50' 
                        : isMedium 
                        ? 'border-amber-500/40 hover:border-amber-400 bg-amber-500/10 text-white shadow-xl shadow-[#00081c]/50' 
                        : 'border-white/10 hover:border-white/30 bg-[#00153A]/85 text-white shadow-xl shadow-[#00081c]/50'
                  }`}
                >
                  <div className="space-y-2">
                    {/* CARD HEADER WITH PROMINENT HOSPITAL TITLE */}
                    <div className={`flex items-start justify-between gap-2 border-b pb-2.5 ${
                      isLight ? 'border-slate-200' : 'border-white/10'
                    }`}>
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          isCritical
                            ? isLight ? 'bg-rose-100 border-rose-300 text-rose-800' : 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                            : isMedium
                            ? isLight ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                            : isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                        }`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-mono font-bold block ${isLight ? 'text-slate-500' : 'text-white/60'}`}>{faskes.id}</span>
                          <h3 className={`text-sm font-bold tracking-tight truncate ${isLight ? 'text-slate-900' : 'text-white'}`} title={faskes.name}>
                            {faskes.name}
                          </h3>
                          <span className={`text-xs font-medium block ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                            {faskes.type} · {faskes.city}
                          </span>
                        </div>
                      </div>

                      <div className={`px-2.5 py-1 rounded-xl text-center border font-mono shrink-0 ${
                        isCritical 
                          ? isLight ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold' : 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold'
                          : isMedium 
                          ? isLight ? 'bg-amber-100 text-amber-950 border-amber-300 font-bold' : 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold'
                          : isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold'
                      }`}>
                        <span className="text-[10px] uppercase block font-bold tracking-wider">Skor FRI</span>
                        <span className="text-sm font-bold leading-none">{faskes.friScore}</span>
                      </div>
                    </div>

                    <div className={`space-y-1.5 text-xs p-3 rounded-xl border ${
                      isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Status Risiko:</span>
                        <span className={`font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                          isCritical 
                            ? isLight ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : isMedium 
                            ? isLight ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {faskes.riskLevel}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-0.5">
                        <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Klaim Bulan Ini:</span>
                        <span className={`font-mono font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{faskes.totalClaimsMonth} klaim</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Anomali Terdeteksi:</span>
                        <span className={`font-mono font-bold text-xs ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>{faskes.anomalyCount} klaim ({faskes.spikeRatio})</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Validasi FRISTA:</span>
                        <span className={`font-mono font-bold text-xs ${isLight ? 'text-slate-800' : 'text-white/80'}`}>{faskes.fristaStatus}</span>
                      </div>
                    </div>

                    <p className={`text-xs line-clamp-2 leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                      <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>Temuan Utama:</strong> {faskes.primaryFinding}
                    </p>

                    {isCritical && (
                      <div className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                        isLight ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        Prioritas Audit Kredensial &amp; SIP DPJP
                      </div>
                    )}
                    {isMedium && (
                      <div className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                        isLight ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        Indikasi Pemecahan Klaim (Unbundling)
                      </div>
                    )}
                    {!isCritical && !isMedium && (
                      <div className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                        isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        Kepatuhan Terverifikasi
                      </div>
                    )}
                  </div>

                  <div className={`pt-2 border-t flex items-center justify-between text-xs ${
                    isLight ? 'border-slate-200' : 'border-white/10'
                  }`}>
                    <button type="button"
                      onClick={() => setSelectedFaskesDetail(faskes)}
                      className={`text-xs font-bold flex items-center space-x-1 cursor-pointer ${
                        isLight ? 'text-emerald-700 hover:text-emerald-800' : 'text-[#FFCA40] hover:text-[#FFE08C]'
                      }`}
                    >
                      <span>Lihat Riwayat Audit</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    {isCritical && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectFaskesCase && onSelectFaskesCase(faskes.linkedClaimId || 'CLM-2026-8801')}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs font-mono cursor-pointer"
                      >
                        Telaah Kasus Kritis &rarr;
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL MODAL DRAWER WITH MOTION */}
      <AnimatePresence>
        {selectedFaskesDetail && typeof document !== 'undefined' && createPortal(
          <motion.div 
            role="dialog"
            aria-modal="true"
            aria-label={`Rincian faskes ${selectedFaskesDetail.name || ''}`.trim()}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedFaskesDetail(null); }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all bg-black/75 backdrop-blur-md"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className={`border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#00153A] border-white/20 text-white'
              }`}
            >
              <div className={`flex items-start justify-between border-b pb-3 ${
                isLight ? 'border-slate-200' : 'border-white/10'
              }`}>
                <div>
                  <span className={`text-xs font-mono uppercase font-bold ${isLight ? 'text-slate-500' : 'text-white/60'}`}>{selectedFaskesDetail.id}</span>
                  <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedFaskesDetail.name}</h3>
                  <span className={`text-xs font-bold ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>{selectedFaskesDetail.type} · {selectedFaskesDetail.city}</span>
                </div>
                <button type="button"
                  onClick={() => setSelectedFaskesDetail(null)}
                  aria-label="Tutup detail faskes"
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className={`p-3 rounded-lg border space-y-1 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <span className={`text-xs font-mono uppercase font-bold ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Rekam Jejak Pengawasan AAK &amp; VPK</span>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>{selectedFaskesDetail.historyAudit}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded-lg border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                  }`}>
                    <span className={`text-xs block font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Direktur Faskes</span>
                    <span className={`text-sm font-bold mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedFaskesDetail.director}</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                  }`}>
                    <span className={`text-xs block font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Total Pembayaran Bulan Ini</span>
                    <span className={`text-sm font-bold font-mono mt-0.5 block ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{selectedFaskesDetail.totalRupiahMonth}</span>
                  </div>
                </div>

                {/* Deterministic Rule Engine & BEA Matrix Evaluation */}
                <div className={`p-3 rounded-xl border space-y-2.5 ${
                  isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${
                      isLight ? 'text-emerald-800' : 'text-[#FFCA40]'
                    }`}>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Matriks Evaluasi Kepatuhan Faskes (Rule Engine)</span>
                    </span>
                    <button
                      type="button"
                      disabled={faskesAiLoading}
                      onClick={() => handleRunFaskesAiAudit(selectedFaskesDetail)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
                        isLight
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-[#FFCA40] hover:bg-[#FFD700] text-[#000c24]'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{faskesAiLoading ? 'Mengevaluasi...' : 'Evaluasi Matriks Intervensi Faskes'}</span>
                    </button>
                  </div>
                  {faskesAiAudit[selectedFaskesDetail.id] && typeof faskesAiAudit[selectedFaskesDetail.id] === 'object' && (
                    <div className={`space-y-2.5 pt-2 border-t text-xs ${
                      isLight ? 'border-emerald-200/80 text-slate-800' : 'border-white/10 text-white/90'
                    }`}>
                      {Array.isArray(faskesAiAudit[selectedFaskesDetail.id].findings) && (
                        <div className="grid grid-cols-1 gap-1.5">
                          {faskesAiAudit[selectedFaskesDetail.id].findings.map((item, idx) => (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                                isLight ? 'bg-white border-emerald-100' : 'bg-[#000c24]/70 border-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className={`font-bold text-xs ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                                  {item.label}
                                </span>
                                <span className={`font-mono font-bold text-xs ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>
                                  {item.value}
                                </span>
                              </div>
                              {item.rule && (
                                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                                  Dasar Aturan: {item.rule}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {faskesAiAudit[selectedFaskesDetail.id].recommendedStep && (
                        <div className={`p-2.5 rounded-lg border text-xs ${
                          isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        }`}>
                          <span className="font-bold">Langkah Intervensi: </span>
                          <span>{faskesAiAudit[selectedFaskesDetail.id].recommendedStep}</span>
                        </div>
                      )}
                      {faskesAiAudit[selectedFaskesDetail.id].historyAudit && (
                        <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/75'}`}>
                          <span className="font-semibold">Jejak Audit Faskes: </span>
                          <span>{faskesAiAudit[selectedFaskesDetail.id].historyAudit}</span>
                        </div>
                      )}
                      {faskesAiAudit[selectedFaskesDetail.id].humanGate && (
                        <div className={`p-2.5 rounded-lg border text-xs font-semibold flex items-start gap-1.5 ${
                          isLight ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
                        }`}>
                          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{faskesAiAudit[selectedFaskesDetail.id].humanGate}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedFaskesDetail(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Tutup Pratinjau
                </motion.button>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}
