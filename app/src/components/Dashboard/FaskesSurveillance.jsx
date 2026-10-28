import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hospital, Search, Filter, AlertTriangle, ShieldCheck, 
  ExternalLink, TrendingUp, Building2, MapPin, CheckCircle2, 
  XCircle, Clock, ChevronRight, AlertOctagon, Activity
} from 'lucide-react';

export default function FaskesSurveillance({ onSelectHospital, onSelectFaskesCase, isLight: propIsLight }) {
  const [isLight, setIsLight] = useState(() => {
    if (propIsLight !== undefined) return propIsLight;
    if (typeof document !== 'undefined') {
      return document.getElementById('cockpit-root')?.classList.contains('theme-light') || false;
    }
    return false;
  });

  useEffect(() => {
    if (propIsLight !== undefined) {
      setIsLight(propIsLight);
      return;
    }
    const root = document.getElementById('cockpit-root');
    if (!root) return;
    const obs = new MutationObserver(() => {
      setIsLight(root.classList.contains('theme-light'));
    });
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, [propIsLight]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedFaskesDetail, setSelectedFaskesDetail] = useState(null);

  const FASKES_DATA = [
    {
      id: 'FSK-0132R001',
      name: 'RS Khusus Mitra Husada Jakarta',
      type: 'RS Khusus (Kelas C)',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      director: 'dr. Anton Wijanarko, Sp.A',
      friScore: 88.0,
      riskLevel: 'KRITIS (MERAH)',
      totalClaimsMonth: 342,
      totalRupiahMonth: 'Rp 642.800.000',
      anomalyCount: 85,
      spikeRatio: '8.5x',
      primaryFinding: 'Klaster Baksos 85 klaim fisioterapi tanpa rujukan FKTP sah; SIP DPJP mutasi.',
      fristaStatus: 'BELUM AKTIF',
      historyAudit: 'Pernah ditegur AAK TW IV/2025 terkait klaim rehabilitasi medis berulang.'
    },
    {
      id: 'FSK-0132R002',
      name: 'RS Hermina Kemayoran Jakarta',
      type: 'RS Swasta (Kelas B)',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      director: 'dr. Liliana Dewi, M.Kes',
      friScore: 64.0,
      riskLevel: 'SEDANG (KUNING)',
      totalClaimsMonth: 1240,
      totalRupiahMonth: 'Rp 2.450.000.000',
      anomalyCount: 14,
      spikeRatio: '2.1x',
      primaryFinding: 'Penagihan berulang rawat jalan fisioterapi dalam jeda 3 hari (Unbundled).',
      fristaStatus: 'AKTIF (92%)',
      historyAudit: 'Kepatuhan koding INA-CBG secara umum baik, butuh sinkronisasi rujukan berkala.'
    },
    {
      id: 'FSK-0132R003',
      name: 'RSUPN Dr. Cipto Mangunkusumo',
      type: 'RS Pemerintah Kelas A (Rujukan Nasional)',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      director: 'dr. Cahyono Hadi, Sp.OG',
      friScore: 11.5,
      riskLevel: 'RENDAH (HIJAU)',
      totalClaimsMonth: 5820,
      totalRupiahMonth: 'Rp 14.850.000.000',
      anomalyCount: 2,
      spikeRatio: '1.0x',
      primaryFinding: 'Seluruh rekam medis terhubung RME & validasi FRISTA biometrik 100%.',
      fristaStatus: 'AKTIF (100%)',
      historyAudit: 'Faskes rujukan utama dengan tata kelola klaim sangat tertib.'
    },
    {
      id: 'FSK-0132R004',
      name: 'RSUP Fatmawati Jakarta',
      type: 'RS Pemerintah (Kelas A)',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      director: 'dr. Ndaru Kurniawan, Sp.B',
      friScore: 16.5,
      riskLevel: 'RENDAH (HIJAU)',
      totalClaimsMonth: 980,
      totalRupiahMonth: 'Rp 1.820.000.000',
      anomalyCount: 1,
      spikeRatio: '1.0x',
      primaryFinding: 'Klaim persalinan dan bedah umum sesuai kaidah Permenkes No. 3/2023.',
      fristaStatus: 'AKTIF (96%)',
      historyAudit: 'Tidak ada temuan anomali mayor pada 3 periode audit terakhir.'
    },
    {
      id: 'FSK-0132R005',
      name: 'RSUP Dr. Sardjito Yogyakarta',
      type: 'RS Pemerintah Kelas A (Rujukan Wilayah)',
      city: 'Sleman',
      province: 'D.I. Yogyakarta',
      director: 'dr. Mardiatmo, Sp.Rad',
      friScore: 14.2,
      riskLevel: 'RENDAH (HIJAU)',
      totalClaimsMonth: 1650,
      totalRupiahMonth: 'Rp 3.120.000.000',
      anomalyCount: 3,
      spikeRatio: '1.1x',
      primaryFinding: 'Layanan hemodialisa rutin terjadwal dengan log mesin terintegrasi.',
      fristaStatus: 'AKTIF (98%)',
      historyAudit: 'Kepatuhan rujukan online sangat baik.'
    },
    {
      id: 'FSK-0132R006',
      name: 'RSUP Dr. Wahidin Sudirohusodo',
      type: 'RS Pemerintah Kelas A (Rujukan Wilayah Timur)',
      city: 'Makassar',
      province: 'Sulawesi Selatan',
      director: 'Prof. dr. Mansyur Arif, Ph.D, Sp.PK(K)',
      friScore: 12.8,
      riskLevel: 'RENDAH (HIJAU)',
      totalClaimsMonth: 2140,
      totalRupiahMonth: 'Rp 6.940.000.000',
      anomalyCount: 2,
      spikeRatio: '1.0x',
      primaryFinding: 'Implan ortopedi tervalidasi e-Katalog LKPP dan laporan operasi lengkap.',
      fristaStatus: 'AKTIF (99%)',
      historyAudit: 'Pusat rujukan nasional kawasan timur Indonesia dengan kepatuhan regulasi tinggi.'
    },
    {
      id: 'FSK-0132R007',
      name: 'RSUP Dr. Hasan Sadikin',
      type: 'RS Pemerintah Kelas A (Rujukan Utama)',
      city: 'Bandung',
      province: 'Jawa Barat',
      director: 'dr. Imelda Tandiyo, M.Kes',
      friScore: 48.5,
      riskLevel: 'SEDANG (KUNING)',
      totalClaimsMonth: 1120,
      totalRupiahMonth: 'Rp 2.180.000.000',
      anomalyCount: 8,
      spikeRatio: '1.8x',
      primaryFinding: 'Diskrepansi lembar penunjang CT-Scan kepala non-kontras pada klaim stroke.',
      fristaStatus: 'AKTIF (89%)',
      historyAudit: 'Sedang dilakukan audit klinis bersama Komite Medis dan TKMKB cabang.'
    },
    {
      id: 'FSK-0132R008',
      name: 'RSUP Dr. Kariadi',
      type: 'RS Pemerintah Kelas A (Rujukan Utama)',
      city: 'Semarang',
      province: 'Jawa Tengah',
      director: 'dr. Didit Novianto, Sp.PD',
      friScore: 15.0,
      riskLevel: 'RENDAH (HIJAU)',
      totalClaimsMonth: 890,
      totalRupiahMonth: 'Rp 1.640.000.000',
      anomalyCount: 1,
      spikeRatio: '1.0x',
      primaryFinding: 'Tertib administrasi rawat inap dan verifikasi kepesertaan digital Mobile JKN.',
      fristaStatus: 'AKTIF (97%)',
      historyAudit: 'Tingkat kepatuhan berkas klaim mencapai 98.5% pada triwulan berjalan.'
    }
  ];

  const filteredFaskes = FASKES_DATA.filter((f) => {
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
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  isLight
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-[#FFCA40]/10 text-[#FFCA40] border-[#FFCA40]/30'
                }`}>
                  FASKES SURVEILLANCE &amp; RISK PROFILING
                </span>
                <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  Direktori FKRTL Pemantauan Nasional · Multiregional
                </span>
              </div>
              <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Pemantauan Kepatuhan &amp; Indeks Risiko Fasilitas Kesehatan
              </h2>
              <p className={`text-xs max-w-4xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                Menilai profil risiko fraud fasilitas kesehatan (<em>Fraud Risk Index - FRI</em>) berdasarkan riwayat lonjakan klaim massal, keabsahan SIP DPJP pada portal SATUSEHAT Kemenkes, dan kepatuhan koding INA-CBG sesuai Permenkes No. 26/2021.
              </p>
            </div>
          </div>

          {/* 4 KPI METRIC BANNER */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200 dark:border-white/10">
            <div className={`p-2.5 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-[10px] font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Total Faskes Terpantau
              </div>
              <div className={`text-sm font-semibold tabular-nums mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {FASKES_DATA.length} FKRTL
              </div>
              <div className={`text-[9.5px] font-normal ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Faskes Rujukan Terintegrasi Nasional
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                <AlertOctagon className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Risiko Kritis (FRI ≥ 70)
              </div>
              <div className={`text-sm font-semibold tabular-nums mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                1 RS Kritis
              </div>
              <div className={`text-[9.5px] font-normal ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                RS Khusus Mitra Husada (Skor 88)
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-[10px] font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Pengawasan Khusus (40-70)
              </div>
              <div className={`text-sm font-semibold tabular-nums mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                2 RS Sedang
              </div>
              <div className={`text-[9.5px] font-normal ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                RS Hermina &amp; RS Indriati
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-[10px] font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Kepatuhan Terverifikasi
              </div>
              <div className={`text-sm font-semibold tabular-nums mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                5 RS Terakreditasi
              </div>
              <div className={`text-[9.5px] font-normal ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Validasi Biometrik FRISTA &gt; 96%
              </div>
            </div>
          </div>
        </div>

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
            <input aria-label="Bidang input data"
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
              Semua Kelas ({FASKES_DATA.length})
            </button>
            <button type="button"
              onClick={() => setSelectedClass('khusus')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                selectedClass === 'khusus'
                  ? isLight ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'bg-[#FFCA40] text-[#00134A] shadow-md shadow-[#FFCA40]/20 font-bold'
                  : isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200' : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              RS Khusus (2)
            </button>
            <button type="button"
              onClick={() => setSelectedClass('kelas a')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                selectedClass === 'kelas a'
                  ? isLight ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'bg-[#FFCA40] text-[#00134A] shadow-md shadow-[#FFCA40]/20 font-bold'
                  : isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200' : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              Kelas A (2)
            </button>
            <button type="button"
              onClick={() => setSelectedClass('kelas b')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                selectedClass === 'kelas b'
                  ? isLight ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'bg-[#FFCA40] text-[#00134A] shadow-md shadow-[#FFCA40]/20 font-bold'
                  : isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200' : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              Kelas B (4)
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
                          <span className={`text-[9.5px] font-mono font-bold block ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{faskes.id}</span>
                          <h3 className={`text-sm font-bold tracking-tight truncate ${isLight ? 'text-slate-900' : 'text-white'}`} title={faskes.name}>
                            {faskes.name}
                          </h3>
                          <span className={`text-[10.5px] font-medium block ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
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
                        <span className="text-[8px] uppercase block font-bold">Skor FRI</span>
                        <span className="text-sm font-bold leading-none">{faskes.friScore}</span>
                      </div>
                    </div>

                    <div className={`space-y-1 text-xs p-2.5 rounded-xl border ${
                      isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Status Risiko:</span>
                        <span className={`font-bold text-[11px] px-2 py-0.5 rounded-full border ${
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
                        <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Klaim Bulan Ini:</span>
                        <span className={`font-mono font-bold text-[11px] ${isLight ? 'text-slate-900' : 'text-white'}`}>{faskes.totalClaimsMonth} klaim</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Anomali Terdeteksi:</span>
                        <span className={`font-mono font-bold text-[11px] ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>{faskes.anomalyCount} klaim ({faskes.spikeRatio})</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Validasi FRISTA:</span>
                        <span className={`font-mono font-bold text-[11px] ${isLight ? 'text-slate-800' : 'text-white/80'}`}>{faskes.fristaStatus}</span>
                      </div>
                    </div>

                    <p className={`text-[11px] line-clamp-2 leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                      <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>Temuan Utama:</strong> {faskes.primaryFinding}
                    </p>

                    {isCritical && (
                      <div className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isLight ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        MITRE F3: FA0001 (Positioning) · ATT&amp;CK: T1078
                      </div>
                    )}
                    {isMedium && (
                      <div className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isLight ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        MITRE F3: FA0002.F1018 (Unbundling Arbitrage)
                      </div>
                    )}
                    {!isCritical && !isMedium && (
                      <div className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        NIST CSF 2.0: DE.CM-01 (Kepatuhan Terverifikasi)
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
                        onClick={() => onSelectFaskesCase && onSelectFaskesCase('CLM-2026-10-085')}
                        className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-xs font-mono cursor-pointer"
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
        {selectedFaskesDetail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#00081c]/80 backdrop-blur-md flex items-center justify-center p-4"
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
                  <span className={`text-[10px] font-mono uppercase font-bold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{selectedFaskesDetail.id}</span>
                  <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedFaskesDetail.name}</h3>
                  <span className={`text-xs font-bold ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>{selectedFaskesDetail.type} · {selectedFaskesDetail.city}</span>
                </div>
                <button type="button"
                  onClick={() => setSelectedFaskesDetail(null)}
                  className={`p-1 rounded-lg cursor-pointer ${
                    isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className={`p-3 rounded-lg border space-y-1 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <span className={`text-[10px] font-mono uppercase font-bold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Rekam Jejak Pengawasan AAK &amp; VPK</span>
                  <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>{selectedFaskesDetail.historyAudit}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded-lg border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                  }`}>
                    <span className={`text-[10px] block font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Direktur Faskes</span>
                    <span className={`font-bold mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedFaskesDetail.director}</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                  }`}>
                    <span className={`text-[10px] block font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Total Pembayaran Bulan Ini</span>
                    <span className={`font-bold font-mono mt-0.5 block ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{selectedFaskesDetail.totalRupiahMonth}</span>
                  </div>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
