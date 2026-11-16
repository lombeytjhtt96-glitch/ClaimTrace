import React, { useState, useEffect } from 'react';
import WarehouseCohortPanel from './WarehouseCohortPanel';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Award,
  Building2,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  ExternalLink,
  ChevronRight,
  Eye,
  CheckCircle2,
  Layers,
  BarChart3,
  Scale,
  DollarSign,
  Activity,
  FileText,
  BadgeAlert,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { API_BASE_URL, authFetch, cachedAuthGetJson } from '../../services/apiConfig';

export default function FraudRankingView({ isLight = true, onSelectFaskes }) {
  const [rankingData, setRankingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedWilayah, setSelectedWilayah] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [sortBy, setSortBy] = useState('risk_score');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaskesDetail, setSelectedFaskesDetail] = useState(null);

  useEffect(() => {
    fetchRankings();
  }, [selectedWilayah, selectedKelas, sortBy]);

  const fetchRankings = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedWilayah) params.append('wilayah', selectedWilayah);
      if (selectedKelas) params.append('kelas_rs', selectedKelas);
      if (sortBy) params.append('sort_by', sortBy);

      const url = `${API_BASE_URL}/api/v1/analytics/fraud-ranking?${params.toString()}`;
      const data = forceRefresh
        ? await authFetch(url).then((r) => (r.ok ? r.json() : null))
        : await cachedAuthGetJson(url);
      if (data) {
        setRankingData(data);
        if (data.rankings && data.rankings.length > 0 && !selectedFaskesDetail) {
          setSelectedFaskesDetail(data.rankings[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch fraud rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRankings = (rankingData?.rankings || []).filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.faskes_name.toLowerCase().includes(q) ||
      f.faskes_id.toLowerCase().includes(q) ||
      f.kantor_cabang.toLowerCase().includes(q) ||
      f.dominant_anomaly_modus.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* HEADER SECTION */}
      <div className={`p-4 rounded-xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800 border border-rose-300 uppercase tracking-wider">
                Indeks Pengawasan Nasional
              </span>
              <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>· Permenkes No. 16/2019 Pencegahan Fraud JKN</span>
            </div>
            <h1 className={`text-xl font-bold tracking-tight mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Peringkat Risiko Kecurangan Faskes (Hospital Risk Leaderboard)
            </h1>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Evaluasi komprehensif tingkat kepatuhan klaim, rasio upcoding, potensi kerugian DJS, dan matriks kuadran risiko rumah sakit se-Indonesia.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={fetchRankings}
              title="Perbarui Data Leaderboard"
              className={`p-2 rounded-lg border transition cursor-pointer ${
                isLight ? 'hover:bg-slate-100 border-slate-200 text-slate-700' : 'hover:bg-slate-800 border-slate-700 text-white'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      {rankingData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Faskes Dipantau</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-display font-semibold tabular-nums text-[#061B31] dark:text-[#F3F5F8]">{rankingData.total_faskes_evaluated}</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">FKRTL Terdaftar</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Data FKRTL terintegrasi BPJS Kesehatan</p>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Rata-rata Skor Risiko Nasional</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className={`text-2xl font-black ${
                rankingData.national_average_risk_score >= 70 ? 'text-rose-600' : rankingData.national_average_risk_score >= 50 ? 'text-amber-600' : 'text-emerald-700'
              }`}>
                {rankingData.national_average_risk_score}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">/ 100</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Indeks anomali agregat multi-lapis</p>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Paparan Potensi Fraud DJS</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-display font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                Rp {(rankingData.total_potential_fraud_exposure_rp / 1000000000).toFixed(1)} M
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">Rupiah</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Total estimasi risiko anggaran JKN</p>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Faskes Risiko Kritis</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-display font-semibold tabular-nums text-rose-700 dark:text-rose-400">{rankingData.top_high_risk_faskes.length}</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">Rumah Sakit (Skor &ge; 75)</span>
            </div>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">Target Audit Mendalam Tim Fraud</p>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          {/* SEARCH */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="fraud-rank-search"
              name="fraud_rank_search"
              aria-label="Cari nama faskes, kode, atau cabang"
              type="text"
              placeholder="Cari nama faskes, kode, cabang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`text-xs pl-8 pr-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 w-56 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          {/* WILAYAH FILTER */}
          <select
            id="fraud-rank-wilayah"
            name="fraud_rank_wilayah"
            aria-label="Filter Kedeputian Wilayah"
            value={selectedWilayah}
            onChange={(e) => setSelectedWilayah(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <option value="">Semua Kedeputian Wilayah</option>
            <option value="Jawa Barat">Wilayah V (Jawa Barat)</option>
            <option value="Jawa Timur">Wilayah VII (Jawa Timur)</option>
            <option value="DKI Jakarta">Wilayah IV (DKI Jakarta)</option>
            <option value="Jawa Tengah">Wilayah VI (Jawa Tengah)</option>
            <option value="Sumatera Utara">Wilayah II (Sumatera Utara)</option>
            <option value="Sulawesi">Wilayah X (Sulawesi)</option>
            <option value="Yogyakarta">Wilayah V (DI Yogyakarta)</option>
          </select>

          {/* KELAS FILTER */}
          <select
            id="fraud-rank-kelas"
            name="fraud_rank_kelas"
            aria-label="Filter Kelas RS"
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <option value="">Semua Kelas RS</option>
            <option value="Kelas A">Kelas A</option>
            <option value="Kelas B">Kelas B</option>
            <option value="Kelas C">Kelas C</option>
          </select>
        </div>

        {/* SORT BY */}
        <div className="flex items-center space-x-2">
          <label htmlFor="fraud-rank-sort" className="text-xs text-slate-500 shrink-0">Urutkan:</label>
          <select
            id="fraud-rank-sort"
            name="fraud_rank_sort"
            aria-label="Urutkan peringkat risiko faskes"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <option value="risk_score">Skor Risiko Fraud Tertinggi</option>
            <option value="potential_loss">Potensi Kerugian DJS Tertinggi</option>
            <option value="volume">Volume Klaim Tertinggi</option>
            <option value="upcoding_rate">Rasio Upcoding Tertinggi</option>
          </select>
        </div>
      </div>

      {/* LEADERBOARD TABLE & DETAIL SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEADERBOARD TABLE (8 COLUMNS) */}
        <div className="lg:col-span-8 space-y-3">
          <div className={`rounded-xl border overflow-hidden ${
            isLight ? 'bg-white border-[#061B31]/[0.08] shadow-[0_1px_2px_rgba(6,27,49,0.04)]' : 'bg-[#11141A] border-white/[0.08] text-[#F3F5F8]'
          }`}>
            <div className="px-4 py-3 border-b border-[#061B31]/[0.08] dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Tabel Peringkat Risiko Faskes ({filteredRankings.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">Pembaruan: Real-time Komputasi</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b text-[10.5px] uppercase tracking-wider font-bold ${
                  isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-800/60 text-slate-400 border-slate-700'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3 text-center">Rank</th>
                    <th className="py-2.5 px-3">Fasilitas Kesehatan</th>
                    <th className="py-2.5 px-3 text-center">Skor Risiko</th>
                    <th className="py-2.5 px-3">Modus Anomali Dominan</th>
                    <th className="py-2.5 px-3 text-right">Potensi Kerugian</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRankings.map((faskes) => {
                    const isSelected = selectedFaskesDetail?.faskes_id === faskes.faskes_id;
                    const isTop3 = faskes.rank <= 3;
                    return (
                      <tr
                        key={faskes.faskes_id}
                        onClick={() => setSelectedFaskesDetail(faskes)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? (isLight ? 'bg-emerald-50/70 font-semibold' : 'bg-emerald-950/30 font-semibold')
                            : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50')
                        }`}
                      >
                        {/* RANK BADGE */}
                        <td className="py-2.5 px-3 text-center">
                          {faskes.rank === 1 ? (
                            <span className="font-mono font-semibold text-xs text-rose-600 dark:text-rose-400 tabular-nums">
                              #1
                            </span>
                          ) : faskes.rank === 2 ? (
                            <span className="font-mono font-semibold text-xs text-orange-600 dark:text-orange-400 tabular-nums">
                              #2
                            </span>
                          ) : faskes.rank === 3 ? (
                            <span className="font-mono font-semibold text-xs text-amber-600 dark:text-amber-400 tabular-nums">
                              #3
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono font-medium tabular-nums">#{faskes.rank}</span>
                          )}
                        </td>

                        {/* FASKES INFO */}
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-[#061B31] dark:text-[#F3F5F8]">{faskes.faskes_name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 mt-0.5">
                            <span className="font-mono">{faskes.faskes_id}</span>
                            <span>·</span>
                            <span>{faskes.kelas_rs}</span>
                            <span>·</span>
                            <span>{faskes.kantor_cabang}</span>
                          </div>
                        </td>

                        {/* FRAUD RISK SCORE */}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`font-mono text-sm font-semibold tabular-nums ${
                            faskes.fraud_risk_score >= 75
                              ? 'text-rose-700 dark:text-rose-400'
                              : faskes.fraud_risk_score >= 50
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}>
                            {faskes.fraud_risk_score}
                          </span>
                        </td>

                        {/* DOMINANT MODUS */}
                        <td className="py-2.5 px-3">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                            {faskes.dominant_anomaly_modus}
                          </span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400">
                            Upcoding: {faskes.upcoding_rate_pct}% · Hold: {faskes.triage_hold_count} klaim
                          </span>
                        </td>

                        {/* POTENTIAL LOSS */}
                        <td className="py-2.5 px-3 text-right">
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400 block">
                            Rp {(faskes.total_potensi_fraud_rp / 1000000).toFixed(0)} Jt
                          </span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                            Vol: {faskes.total_volume_klaim.toLocaleString()}
                          </span>
                        </td>

                        {/* ACTION */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            aria-label={`Lihat detail profil risiko ${faskes.faskes_name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFaskesDetail(faskes);
                              if (onSelectFaskes) onSelectFaskes(faskes.faskes_id);
                            }}
                            className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-emerald-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Lihat Detail Profil Risiko"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FASKES RISK PROFILE DETAIL CARD (4 COLUMNS) */}
        <div className="lg:col-span-4 space-y-3">
          {selectedFaskesDetail ? (
            <div className={`p-5 rounded-xl border transition-colors ${
              isLight ? 'bg-white border-[#061B31]/[0.08] shadow-[0_1px_2px_rgba(6,27,49,0.04)]' : 'bg-[#11141A] border-white/[0.08] text-[#F3F5F8]'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#061B31]/[0.08] dark:border-white/[0.08]">
                <div>
                  <span className="text-[11px] font-mono font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    Rank #{selectedFaskesDetail.rank} · Risiko Nasional
                  </span>
                  <h3 className="text-base font-display font-semibold text-[#061B31] dark:text-[#F3F5F8] mt-1">
                    {selectedFaskesDetail.faskes_name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{selectedFaskesDetail.faskes_id} · {selectedFaskesDetail.kelas_rs}</p>
                </div>
              </div>

              {/* DETAILED STATS */}
              <div className="space-y-3 my-3.5 text-xs">
                <div className="p-3 rounded-lg bg-[#F3F5F8] dark:bg-[#161A22] border border-[#061B31]/[0.06] dark:border-white/[0.06] space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Kategori Pengawasan</span>
                    <p className={`text-xs font-semibold mt-0.5 ${
                      selectedFaskesDetail.fraud_risk_score >= 75 ? 'text-rose-700 dark:text-rose-400' :
                      selectedFaskesDetail.fraud_risk_score >= 50 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {selectedFaskesDetail.risk_category}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Kuadran Prioritas Audit</span>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-[#11141A] text-slate-700 dark:text-slate-200 border border-[#061B31]/10 dark:border-white/10">
                        {String(selectedFaskesDetail.risk_quadrant || '').replace(/KUADRAN_([IVX]+)/g, 'Kuadran $1')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs tabular-nums">
                  <div className="p-2.5 rounded-lg border border-[#061B31]/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#161A22]">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Rasio Upcoding</span>
                    <p className="text-sm font-mono font-semibold text-rose-600 dark:text-rose-400 mt-0.5">{selectedFaskesDetail.upcoding_rate_pct}%</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#061B31]/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#161A22]">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Kepatuhan Berkas</span>
                    <p className="text-sm font-mono font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">{selectedFaskesDetail.document_compliance_rate_pct}%</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#061B31]/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#161A22]">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Kasus Ditahan</span>
                    <p className="text-sm font-mono font-semibold text-amber-600 dark:text-amber-400 mt-0.5">{selectedFaskesDetail.triage_hold_count} Klaim</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#061B31]/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#161A22]">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Flag Phantom</span>
                    <p className="text-sm font-mono font-semibold text-rose-600 dark:text-rose-400 mt-0.5">{selectedFaskesDetail.phantom_billing_flag_count} Kasus</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">Wilayah Kerja Kedinasan</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{selectedFaskesDetail.kepedutian_wilayah}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{selectedFaskesDetail.kantor_cabang} · Akreditasi: {selectedFaskesDetail.accreditation_status}</p>
                </div>

                {selectedFaskesDetail.cohort_hhi_specialty != null && (
                  <div className="p-3 rounded-lg border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs space-y-1.5 tabular-nums">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold">
                      Benchmark Kohort Gudang Data ({selectedFaskesDetail.warehouse_cohort_id})
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <span>HHI Poli: <strong>{selectedFaskesDetail.cohort_hhi_specialty}</strong></span>
                      <span>Rasio RITL: <strong>{selectedFaskesDetail.cohort_inpatient_ratio_pct}%</strong></span>
                      <span>ALOS (CV): <strong>{selectedFaskesDetail.cohort_avg_los_days}h ({selectedFaskesDetail.cohort_los_uniformity_cv})</strong></span>
                      <span>Klaim/Pasien: <strong>{selectedFaskesDetail.cohort_claims_per_patient}x</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    if (onSelectFaskes) onSelectFaskes(selectedFaskesDetail.faskes_id);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Buka Dossier Investigasi Faskes</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl border border-dashed text-center text-slate-600 dark:text-slate-400 text-xs">
              Pilih faskes pada tabel leaderboard untuk melihat profil risiko detail.
            </div>
          )}
        </div>
      </div>

      {/* LIVE WAREHOUSE COHORT PROFILING (1.699M ROWS) */}
      <WarehouseCohortPanel isLight={isLight} kelasFilter={selectedKelas} />
    </div>
  );
}
