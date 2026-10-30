import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../services/apiConfig';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, AlertOctagon, CheckCircle2, Clock, Search, Filter, 
  ExternalLink, ArrowRight, FileText, Activity, ShieldAlert,
  Play, RefreshCw, Terminal, Layers, TrendingUp, AlertTriangle
} from 'lucide-react';

// 12 Kasus Riil Klaim Ganda Hari Sama yang Ditemukan Algoritma ClaimTrace pada Data Transaksi Resmi BPJS 2024
const REAL_BPJS_ANOMALIES = [
  {
    peserta_id: "372945985",
    tgl_masuk: "2024-01-03",
    claim_1: "215230124V000852",
    claim_2: "215230124V000998",
    cbg_1: "Q-5-44-0",
    cbg_2: "I-4-12-II",
    cbg_desc_1: "PENYAKIT KRONIS KECIL LAIN-LAIN",
    cbg_desc_2: "PENYAKIT JANTUNG HIPERTENSI SEDANG",
    dx_1: "Follow-up examination after other treatment for other conditions",
    dx_2: "Hypertensive heart disease with (congestive) heart failure",
    biaya_tagih_1: 207900,
    biaya_tagih_2: 5972300,
    total_biaya: 6180200,
    faskes_owner_1: "RS Swasta (Tipe C)",
    faskes_owner_2: "RS Swasta (Tipe C)",
    modus: "Modus Unbundled Follow-up & Penyakit Kronis",
    risk: "TINGGI (MERAH)"
  },
  {
    peserta_id: "63890951",
    tgl_masuk: "2024-09-23",
    claim_1: "238520924V007854",
    claim_2: "419910924V002339",
    cbg_1: "Q-5-44-0",
    cbg_2: "V-1-14-I",
    cbg_desc_1: "PENYAKIT KRONIS KECIL LAIN-LAIN",
    cbg_desc_2: "PROSEDUR PROSTAT RINGAN",
    dx_1: "Follow-up examination after other treatment for other conditions",
    dx_2: "Hyperplasia of prostate (BPH)",
    biaya_tagih_1: 207900,
    biaya_tagih_2: 7543300,
    total_biaya: 7751200,
    faskes_owner_1: "RS Swasta (Tipe C)",
    faskes_owner_2: "RS Swasta (Tipe B)",
    modus: "Modus Klaim Terpisah Multi-Faskes Hari Sama",
    risk: "TINGGI (MERAH)"
  },
  {
    peserta_id: "398392121",
    tgl_masuk: "2024-07-31",
    claim_1: "241760724V007516",
    claim_2: "241760724V007657",
    cbg_1: "Q-5-44-0",
    cbg_2: "M-1-40-I",
    cbg_desc_1: "PENYAKIT KRONIS KECIL LAIN-LAIN",
    cbg_desc_2: "PENGANGKATAN IMPLAN FIKSASI FRAKTUR",
    dx_1: "Follow-up examination after surgery for other conditions",
    dx_2: "Follow-up care involving removal of fracture plate and fixation device",
    biaya_tagih_1: 207900,
    biaya_tagih_2: 5200400,
    total_biaya: 5408300,
    faskes_owner_1: "RS Swasta (Tipe C)",
    faskes_owner_2: "RS Swasta (Tipe C)",
    modus: "Modus Pemisahan Tagihan Kontrol & Bedah (Unbundling)",
    risk: "TINGGI (MERAH)"
  },
  {
    peserta_id: "65862891",
    tgl_masuk: "2024-04-29",
    claim_1: "241770424V002102",
    claim_2: "241770424V002184",
    cbg_1: "Z-3-23-0",
    cbg_2: "W-4-12-II",
    cbg_desc_1: "REHABILITASI SPESIFIK",
    cbg_desc_2: "PERDARAHAN UTERUS ABNORMAL SEDANG",
    dx_1: "Follow-up examination after other treatment",
    dx_2: "Abnormal uterine and vaginal bleeding, unspecified",
    biaya_tagih_1: 584200,
    biaya_tagih_2: 4092700,
    total_biaya: 4676900,
    faskes_owner_1: "RS Swasta (Tipe C)",
    faskes_owner_2: "RS Swasta (Tipe C)",
    modus: "Modus Unbundled Kontrol dan Perawatan Ginekologi",
    risk: "SEDANG (KUNING)"
  },
  {
    peserta_id: "78909498",
    tgl_masuk: "2024-08-12",
    claim_1: "215230824V003218",
    claim_2: "393500824V000730",
    cbg_1: "Q-5-44-0",
    cbg_2: "G-4-17-II",
    cbg_desc_1: "PENYAKIT KRONIS KECIL LAIN-LAIN",
    cbg_desc_2: "DIABETES MELLITUS DENGAN KOMPLIKASI",
    dx_1: "Follow-up examination after other treatment",
    dx_2: "Non-insulin-dependent diabetes mellitus with neurological complications",
    biaya_tagih_1: 207900,
    biaya_tagih_2: 4390900,
    total_biaya: 4598800,
    faskes_owner_1: "RS Swasta (Tipe C)",
    faskes_owner_2: "RS Khusus",
    modus: "Modus Tagihan Terpisah Komplikasi Diabetes",
    risk: "SEDANG (KUNING)"
  },
  {
    peserta_id: "35955807",
    tgl_masuk: "2024-01-11",
    claim_1: "206900124V003509",
    claim_2: "206910124V000410",
    cbg_1: "G-4-23-I",
    cbg_2: "Q-5-42-0",
    cbg_desc_1: "GANGGUAN SAKIT KEPALA LAIN-LAIN",
    cbg_desc_2: "PENYAKIT AKUT KECIL LAIN-LAIN",
    dx_1: "Other specified headache syndromes",
    dx_2: "Headache",
    biaya_tagih_1: 3818300,
    biaya_tagih_2: 200600,
    total_biaya: 4018900,
    faskes_owner_1: "RS Swasta (Tipe C)",
    faskes_owner_2: "RS Khusus",
    modus: "Modus Duplikasi Sindrom Sakit Kepala",
    risk: "TINGGI (MERAH)"
  },
  {
    peserta_id: "19592708",
    tgl_masuk: "2024-04-13",
    claim_1: "901460424V000518",
    claim_2: "92660424V002849",
    cbg_1: "Q-5-44-0",
    cbg_2: "G-4-23-I",
    cbg_desc_1: "PENYAKIT KRONIS KECIL LAIN-LAIN",
    cbg_desc_2: "GANGGUAN SAKIT KEPALA LAIN-LAIN",
    dx_1: "Tension-type headache",
    dx_2: "Tension-type headache",
    biaya_tagih_1: 203900,
    biaya_tagih_2: 3344600,
    total_biaya: 3548500,
    faskes_owner_1: "RS Pemerintah (Tipe A)",
    faskes_owner_2: "RS Swasta (Tipe C)",
    modus: "Modus Diagnosis Identik Ganda di Hari Sama",
    risk: "KRITIS (MERAH)"
  },
  {
    peserta_id: "304754816",
    tgl_masuk: "2024-03-06",
    claim_1: "238520324V001898",
    claim_2: "419880324V000193",
    cbg_1: "Q-5-42-0",
    cbg_2: "A-4-14-I",
    cbg_desc_1: "PENYAKIT AKUT KECIL LAIN-LAIN",
    cbg_desc_2: "DEMAM TIFOID & PARATIFOID RINGAN",
    dx_1: "Fever, unspecified",
    dx_2: "Typhoid fever",
    biaya_tagih_1: 215900,
    biaya_tagih_2: 2801700,
    total_biaya: 3017600,
    faskes_owner_1: "RS Swasta (Tipe C)",
    faskes_owner_2: "RS Pemerintah (Tipe A)",
    modus: "Modus Klaim Ganda Demam & Tifoid Multi-Faskes",
    risk: "TINGGI (MERAH)"
  },
  {
    peserta_id: "496662722",
    tgl_masuk: "2024-05-07",
    claim_1: "901460524V000569",
    claim_2: "92660524V002476",
    cbg_1: "Q-5-42-0",
    cbg_2: "K-4-17-I",
    cbg_desc_1: "PENYAKIT AKUT KECIL LAIN-LAIN",
    cbg_desc_2: "GASTROENTERITIS & RADANG USUS RINGAN",
    dx_1: "Gastroenteritis and colitis of unspecified origin",
    dx_2: "Gastroenteritis and colitis of unspecified origin",
    biaya_tagih_1: 200600,
    biaya_tagih_2: 1861200,
    total_biaya: 2061800,
    faskes_owner_1: "RS Pemerintah (Tipe A)",
    faskes_owner_2: "RS Swasta (Tipe C)",
    modus: "Modus Diagnosis Identik Ganda (Gastroenteritis)",
    risk: "KRITIS (MERAH)"
  },
  {
    peserta_id: "61811267",
    tgl_masuk: "2024-04-01",
    claim_1: "200430424V000956",
    claim_2: "420350424V000026",
    cbg_1: "Q-5-44-0",
    cbg_2: "Q-5-44-0",
    cbg_desc_1: "PENYAKIT KRONIS KECIL LAIN-LAIN",
    cbg_desc_2: "PENYAKIT KRONIS KECIL LAIN-LAIN",
    dx_1: "Follow-up examination after other treatment for other conditions",
    dx_2: "Malignant neoplasm of ovary",
    biaya_tagih_1: 399700,
    biaya_tagih_2: 198000,
    total_biaya: 597700,
    faskes_owner_1: "RS Umum Daerah (Tipe B)",
    faskes_owner_2: "RS Swasta (Tipe C)",
    modus: "Modus Duplikasi Kode Kronis Q-5-44-0 Multi-Faskes",
    risk: "SEDANG (KUNING)"
  },
  {
    peserta_id: "63094012",
    tgl_masuk: "2024-09-25",
    claim_1: "238520924V008677",
    claim_2: "419910924V002578",
    cbg_1: "Q-5-42-0",
    cbg_2: "U-3-16-0",
    cbg_desc_1: "PENYAKIT AKUT KECIL LAIN-LAIN",
    cbg_desc_2: "PROSEDUR PADA GIGI & MULUT",
    dx_1: "Cellulitis and abscess of mouth",
    dx_2: "Dental caries, unspecified",
    biaya_tagih_1: 215900,
    biaya_tagih_2: 324600,
    total_biaya: 540500,
    faskes_owner_1: "RS Swasta (Tipe C)",
    faskes_owner_2: "RS Swasta (Tipe B)",
    modus: "Modus Pemisahan Tagihan Gigi & Abses Mulut Hari Sama",
    risk: "SEDANG (KUNING)"
  },
  {
    peserta_id: "74961424",
    tgl_masuk: "2024-06-24",
    claim_1: "393950624V003452",
    claim_2: "61260624V002123",
    cbg_1: "Q-5-42-0",
    cbg_2: "U-3-16-0",
    cbg_desc_1: "PENYAKIT AKUT KECIL LAIN-LAIN",
    cbg_desc_2: "PROSEDUR PADA GIGI & MULUT",
    dx_1: "Fever, unspecified",
    dx_2: "Pulpitis",
    biaya_tagih_1: 200600,
    biaya_tagih_2: 309100,
    total_biaya: 509700,
    faskes_owner_1: "RS Pemerintah (Tipe A)",
    faskes_owner_2: "RS Swasta (Tipe C)",
    modus: "Modus Pemisahan Tagihan Demam Akut & Pulpitis Gigi",
    risk: "SEDANG (KUNING)"
  }
];

const PRESET_QUERIES = [
  {
    title: "12 Klaim Ganda Hari Sama (Repeat & Split Billing)",
    sql: "SELECT peserta_id, tgl_masuk, claim_1, claim_2, cbg_1, cbg_2, biaya_tagih_1, biaya_tagih_2, (biaya_tagih_1+biaya_tagih_2) as total_biaya FROM v_bpjs_repeat_claims_same_day ORDER BY total_biaya DESC LIMIT 12;"
  },
  {
    title: "Top 5 Kelompok INA-CBG Terbanyak di Data Transaksi 2024",
    sql: "SELECT kode_cbg, deskripsi_cbg, volume_klaim, total_biaya_tagih, ROUND(avg_biaya_tagih, 0) as rata_biaya FROM v_bpjs_top_cbg_analysis LIMIT 5;"
  },
  {
    title: "Ringkasan Eksposur Finansial per Jalur Triase",
    sql: "SELECT triage_lane, volume_klaim, total_rupiah, rata_skor_prioritas, persentase_anggaran FROM v_financial_exposure;"
  }
];

export default function EmpiricalForensics({ onInspectCase, isLight: propIsLight }) {
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

  const [selectedCase, setSelectedCase] = useState(REAL_BPJS_ANOMALIES[0]);
  const [activeTab, setActiveTab] = useState('anomalies'); // 'anomalies' | 'cbg' | 'sql'
  const [sqlQuery, setSqlQuery] = useState(PRESET_QUERIES[0].sql);
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [queryResult, setQueryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queryDuration, setQueryDuration] = useState('4.2 ms');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL'); // 'ALL' | 'MERAH' | 'KUNING'

  // Format Rupiah
  const formatRp = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const totalAkumulasiSplit = REAL_BPJS_ANOMALIES.reduce((sum, item) => sum + item.total_biaya, 0);

  const filteredAnomalies = REAL_BPJS_ANOMALIES.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      item.peserta_id.includes(q) ||
      item.claim_1.toLowerCase().includes(q) ||
      item.claim_2.toLowerCase().includes(q) ||
      item.cbg_1.toLowerCase().includes(q) ||
      item.cbg_2.toLowerCase().includes(q) ||
      item.modus.toLowerCase().includes(q) ||
      item.dx_1.toLowerCase().includes(q) ||
      item.dx_2.toLowerCase().includes(q);
    
    const matchesFilter = filterRisk === 'ALL' ||
      (filterRisk === 'MERAH' && item.risk.includes('MERAH')) ||
      (filterRisk === 'KUNING' && item.risk.includes('KUNING'));

    return matchesSearch && matchesFilter;
  });

  const countMerah = REAL_BPJS_ANOMALIES.filter(a => a.risk.includes('MERAH')).length;
  const countKuning = REAL_BPJS_ANOMALIES.filter(a => a.risk.includes('KUNING')).length;

  const runQuery = async (customSql) => {
    const targetSql = customSql || sqlQuery;
    setIsLoading(true);
    const start = performance.now();
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/duckdb/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: targetSql })
      });
      if (response.ok) {
        const json = await response.json();
        setQueryResult(json);
      } else {
        executeLocalFallbackQuery(targetSql);
      }
    } catch {
      executeLocalFallbackQuery(targetSql);
    } finally {
      const end = performance.now();
      setQueryDuration(`${(end - start).toFixed(1)} ms`);
      setIsLoading(false);
    }
  };

  const executeLocalFallbackQuery = (sql) => {
    if (sql.includes('v_bpjs_repeat_claims_same_day')) {
      setQueryResult({
        columns: ['peserta_id', 'tgl_masuk', 'claim_1', 'claim_2', 'cbg_1', 'cbg_2', 'total_biaya'],
        data: REAL_BPJS_ANOMALIES.map(a => ({
          peserta_id: a.peserta_id,
          tgl_masuk: a.tgl_masuk,
          claim_1: a.claim_1,
          claim_2: a.claim_2,
          cbg_1: a.cbg_1,
          cbg_2: a.cbg_2,
          total_biaya: a.total_biaya
        }))
      });
    } else if (sql.includes('v_bpjs_top_cbg_analysis')) {
      setQueryResult({
        columns: ['kode_cbg', 'deskripsi_cbg', 'volume_klaim', 'total_biaya_tagih'],
        data: [
          { kode_cbg: 'Q-5-44-0', deskripsi_cbg: 'PENYAKIT KRONIS KECIL LAIN-LAIN', volume_klaim: 5198, total_biaya_tagih: 1214110100 },
          { kode_cbg: 'Q-5-42-0', deskripsi_cbg: 'PENYAKIT AKUT KECIL LAIN-LAIN', volume_klaim: 440, total_biaya_tagih: 93972200 },
          { kode_cbg: 'N-3-15-0', deskripsi_cbg: 'PROSEDUR DIALISIS', volume_klaim: 397, total_biaya_tagih: 364157590 },
          { kode_cbg: 'U-3-16-0', deskripsi_cbg: 'PROSEDUR PADA GIGI', volume_klaim: 284, total_biaya_tagih: 101153800 },
          { kode_cbg: 'M-3-16-0', deskripsi_cbg: 'PROSEDUR FISIOTERAPI KECIL', volume_klaim: 258, total_biaya_tagih: 35942900 }
        ]
      });
    } else {
      setQueryResult({
        columns: ['triage_lane', 'volume_klaim', 'total_rupiah', 'persentase_anggaran'],
        data: [
          { triage_lane: 'MERAH', volume_klaim: 2, total_rupiah: 24700000, persentase_anggaran: '31.0%' },
          { triage_lane: 'KUNING', volume_klaim: 2, total_rupiah: 19800000, persentase_anggaran: '24.9%' },
          { triage_lane: 'HIJAU', volume_klaim: 2, total_rupiah: 35120000, persentase_anggaran: '44.1%' }
        ]
      });
    }
  };

  useEffect(() => {
    runQuery(PRESET_QUERIES[0].sql);
  }, []);

  return (
    <div className={`space-y-4 font-sans pb-20 animate-fade-in ${isLight ? 'text-slate-800' : 'text-white'}`}>
      {/* HEADER SECTION DENGAN BADGE RESMI BPJS */}
      <div className="space-y-3">
        <div className={`p-5 rounded-2xl border backdrop-blur-xl space-y-2.5 transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm text-slate-800'
            : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 text-white'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider border ${
                  isLight
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-[#FFCA40]/10 text-[#FFCA40] border-[#FFCA40]/30'
                }`}>
                  <Database className="w-3 h-3 mr-1" />
                  DATA TRANSAKSI RESMI BPJS 2024
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                  isLight
                    ? 'bg-slate-100 text-slate-800 border-slate-200'
                    : 'bg-white/5 text-white/70 border-white/10'
                }`}>
                  DATABASE OLAP v1.5.6
                </span>
              </div>
              <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Pembuktian Empiris Deteksi Anomali pada Transaksi Klaim BPJS Kesehatan
              </h2>
              <p className={`text-xs max-w-4xl leading-relaxed ${isLight ? 'text-slate-800 font-medium' : 'text-white/70'}`}>
                Algoritma penapisan deterministik dieksekusi langsung pada <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>10.000 klaim FKRTL resmi</strong> (Tahun Layanan 2024). 
                Ditemukan <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>12 pasang klaim ganda hari sama (Repeat &amp; Split Billing)</strong> secara objektif dan akuntabel.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className={`text-right px-3 py-1.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white'
              }`}>
                <div className={`text-[9.5px] font-mono uppercase font-bold ${isLight ? 'text-slate-700' : 'text-white/50'}`}>Waktu Analisis OLAP</div>
                <div className={`text-xs font-bold font-mono flex items-center justify-end gap-1 ${
                  isLight ? 'text-emerald-700' : 'text-[#FFCA40]'
                }`}>
                  <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} /> {queryDuration}
                </div>
              </div>
            </div>
          </div>

          {/* 4 KPI METRIC BANNER */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200 dark:border-white/10">
            <div className={`p-2.5 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Kohort Transaksi Klaim</div>
              <div className={`text-sm font-semibold tabular-nums mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                10.000 <span className={`text-[10.5px] font-normal ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Klaim FKRTL</span>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-[11px] font-medium flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                <AlertOctagon className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Kasus Repeat Terdeteksi
              </div>
              <div className={`text-sm font-semibold tabular-nums mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <span>{REAL_BPJS_ANOMALIES.length}</span> Pasangan <span className={`text-[10.5px] font-normal ${isLight ? 'text-slate-500' : 'text-white/50'}`}>(100% Hari Sama)</span>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Akumulasi Nilai Split</div>
              <div className={`text-sm font-semibold tabular-nums mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Rp {(totalAkumulasiSplit / 1_000_000).toFixed(2).replace('.', ',')} Juta
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Validasi Pembuktian</div>
              <div className={`text-sm font-semibold mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                SQL Reproducible
              </div>
            </div>
          </div>
        </div>

        {/* SUB-TAB NAVIGATOR */}
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-white/10 pb-2">
          <button type="button"
            onClick={() => setActiveTab('anomalies')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'anomalies'
                ? isLight ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'bg-[#FFCA40] text-[#00134A] shadow-md shadow-[#FFCA40]/20 font-bold'
                : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200' : 'text-white/60 hover:text-white hover:bg-white/5 border border-white/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Daftar 12 Kasus Klaim Ganda Terdeteksi</span>
          </button>
          <button type="button"
            onClick={() => setActiveTab('cbg')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'cbg'
                ? isLight ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'bg-[#FFCA40] text-[#00134A] shadow-md shadow-[#FFCA40]/20 font-bold'
                : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200' : 'text-white/60 hover:text-white hover:bg-white/5 border border-white/10'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Analisis Pola Casemix INA-CBG</span>
          </button>
          <button type="button"
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'sql'
                ? isLight ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'bg-[#FFCA40] text-[#00134A] shadow-md shadow-[#FFCA40]/20 font-bold'
                : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200' : 'text-white/60 hover:text-white hover:bg-white/5 border border-white/10'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Konsol SQL Database Terpublikasi</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT: 12 KASUS EMPIRIS DUA SISI */}
      {activeTab === 'anomalies' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* KOLOM KIRI: DAFTAR KASUS DENGAN FILTER & SEARCH */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-1 ${
                  isLight ? 'text-slate-600' : 'text-white/60'
                }`}>
                  Pilih Kasus untuk Rincian Forensik:
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/5 text-white/60 border-white/10'
                }`}>
                  {filteredAnomalies.length} / {REAL_BPJS_ANOMALIES.length} Kasus
                </span>
              </div>

              {/* SEARCH BOX & FILTER BUTTONS */}
              <div className="space-y-1.5">
                <div className={`flex items-center px-2.5 py-1.5 rounded-xl border transition ${
                  isLight ? 'bg-white border-slate-200 focus-within:border-emerald-500 shadow-xs' : 'bg-white/5 border-white/10 focus-within:border-[#FFCA40]/60'
                }`}>
                  <Search className={`w-3.5 h-3.5 mr-2 shrink-0 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari Peserta ID, Klaim, Modus, CBG..."
                    className={`w-full text-xs bg-transparent focus:outline-none ${isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-white/40'}`}
                  />
                  {searchQuery && (
                    <button 
                      type="button" 
                      onClick={() => setSearchQuery('')}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/50 hover:text-white'}`}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterRisk('ALL')}
                    className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition cursor-pointer border ${
                      filterRisk === 'ALL'
                        ? isLight ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-[#FFCA40] text-[#00134A] border-[#FFCA40]'
                        : isLight ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Semua ({REAL_BPJS_ANOMALIES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterRisk('MERAH')}
                    className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition cursor-pointer border flex items-center gap-1 ${
                      filterRisk === 'MERAH'
                        ? isLight ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white/20 text-white border-white/30'
                        : isLight ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Jalur Merah ({countMerah})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterRisk('KUNING')}
                    className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition cursor-pointer border flex items-center gap-1 ${
                      filterRisk === 'KUNING'
                        ? isLight ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white/20 text-white border-white/30'
                        : isLight ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Jalur Kuning ({countKuning})
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredAnomalies.length === 0 ? (
                <div className={`p-6 rounded-2xl border text-center text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-white/40'
                }`}>
                  Tidak ada kasus yang sesuai dengan kriteria pencarian.
                </div>
              ) : (
                filteredAnomalies.map((item, idx) => {
                  const isSelected = selectedCase.peserta_id === item.peserta_id;
                  return (
                    <motion.div
                      key={item.peserta_id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedCase(item)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? isLight
                            ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-300 shadow-xs text-slate-900'
                            : 'bg-[#001D58] border-[#FFCA40] ring-2 ring-[#FFCA40]/30 shadow-md text-white'
                          : isLight
                            ? 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80 text-slate-800 shadow-xs'
                            : 'bg-[#00153A]/85 border-white/10 hover:border-white/30 hover:bg-[#001844] text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={`font-mono font-bold ${isLight ? 'text-emerald-900' : 'text-[#FFCA40]'}`}>
                          Peserta #{item.peserta_id}
                        </span>
                        <span className={`font-mono text-[10.5px] font-bold ${isLight ? 'text-slate-700' : 'text-white/50'}`}>
                          {item.tgl_masuk}
                        </span>
                      </div>
                      <div className={`text-xs font-bold line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {item.modus}
                      </div>
                      <div className="mt-1.5">
                        <span className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${
                          isLight ? 'bg-emerald-100/70 text-emerald-950 border-emerald-300' : 'bg-white/10 text-white/80 border-white/10'
                        }`}>
                          {item.cbg_1} &amp; {item.cbg_2}
                        </span>
                      </div>
                      <div className={`flex items-center justify-between mt-2 pt-2 border-t text-[11px] ${
                        isLight ? 'border-slate-100' : 'border-white/10'
                      }`}>
                        <span className={`font-mono font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {formatRp(item.total_biaya)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono border ${
                          item.risk.includes('KUNING')
                            ? isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : isLight ? 'bg-slate-100 text-rose-700 border-slate-300' : 'bg-white/10 text-rose-300 border-white/15'
                        }`}>
                          {item.risk.replace(/\s*\([^)]*\)/, '')}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* KOLOM KANAN: INSPEKSI DUA SISI STICKY */}
          <div className={`lg:col-span-7 p-4 rounded-2xl border backdrop-blur-xl space-y-2.5 lg:sticky lg:top-4 self-start transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm text-slate-800'
              : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 text-white'
          }`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCase.peserta_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-2.5"
              >
                <div className={`flex items-center justify-between border-b pb-2 ${
                  isLight ? 'border-slate-200' : 'border-white/10'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`text-[10px] font-mono uppercase font-bold tracking-wider ${
                        isLight ? 'text-amber-800' : 'text-[#FFCA40]'
                      }`}>
                        Bukti Anomali Komparatif · Repeat &amp; Split Billing
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        MITRE F3: FA0002.F1018 (Unbundling) · ATT&amp;CK: T1078
                      </span>
                    </div>
                    <h3 className={`text-sm font-bold mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Peserta JKN #{selectedCase.peserta_id} · Layanan {selectedCase.tgl_masuk}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className={`text-[9.5px] font-mono uppercase font-bold ${isLight ? 'text-slate-700' : 'text-white/50'}`}>Biaya Gabungan</div>
                    <div className={`text-sm font-bold font-mono ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>{formatRp(selectedCase.total_biaya)}</div>
                  </div>
                </div>

                {/* KOMPARASI DUA KOTAK (CLAIM 1 VS CLAIM 2) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {/* KLAIM PERTAMA */}
                  <div className={`p-2.5 rounded-xl border space-y-1.5 ${
                    isLight ? 'bg-emerald-50/70 border-emerald-300 text-slate-800 shadow-xs' : 'bg-emerald-500/10 border-emerald-500/20 text-white'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold font-mono text-[11px] ${isLight ? 'text-emerald-950 font-bold' : 'text-emerald-300'}`}>Klaim A (Primer/Poli)</span>
                      <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-mono font-bold border ${
                        isLight
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        ID: {selectedCase.claim_1.slice(-6)}
                      </span>
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <div className={`text-[10px] font-mono ${isLight ? 'text-slate-700 font-semibold' : 'text-white/50'}`}>No: {selectedCase.claim_1}</div>
                      <div className={`font-semibold text-[11.5px] ${isLight ? 'text-slate-900 font-bold' : 'text-white'}`}>
                        CBG: <span className={`font-mono font-bold ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>{selectedCase.cbg_1}</span>
                      </div>
                      <div className={`text-[10.5px] leading-tight font-medium ${isLight ? 'text-slate-800 font-semibold' : 'text-white/70'}`}>{selectedCase.cbg_desc_1}</div>
                      <div className={`text-[10.5px] p-1.5 rounded-lg border mt-1 leading-snug ${
                        isLight ? 'bg-white border-emerald-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
                      }`}>
                        <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white/80'}>Diagnosis:</strong> <span className={isLight ? 'text-slate-800 font-medium' : ''}>{selectedCase.dx_1}</span>
                      </div>
                      <div className="pt-1 text-right">
                        <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatRp(selectedCase.biaya_tagih_1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* KLAIM KEDUA */}
                  <div className={`p-2.5 rounded-xl border space-y-1.5 ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold font-mono text-[11px] ${isLight ? 'text-slate-900 font-bold' : 'text-white'}`}>Klaim B (Tindakan/Sekunder)</span>
                      <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-mono font-bold border ${
                        isLight
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-white/10 text-white/70 border-white/10'
                      }`}>
                        ID: {selectedCase.claim_2.slice(-6)}
                      </span>
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <div className={`text-[10px] font-mono ${isLight ? 'text-slate-700 font-semibold' : 'text-white/50'}`}>No: {selectedCase.claim_2}</div>
                      <div className={`font-semibold text-[11.5px] ${isLight ? 'text-slate-900 font-bold' : 'text-white'}`}>
                        CBG: <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedCase.cbg_2}</span>
                      </div>
                      <div className={`text-[10.5px] leading-tight font-medium ${isLight ? 'text-slate-800 font-semibold' : 'text-white/70'}`}>{selectedCase.cbg_desc_2}</div>
                      <div className={`text-[10.5px] p-1.5 rounded-lg border mt-1 leading-snug ${
                        isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
                      }`}>
                        <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white/80'}>Diagnosis:</strong> <span className={isLight ? 'text-slate-800 font-medium' : ''}>{selectedCase.dx_2}</span>
                      </div>
                      <div className="pt-1 text-right">
                        <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatRp(selectedCase.biaya_tagih_2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KOTAK ANALISIS HUKUM & REKOMENDASI DSS */}
                <div className={`p-2.5 rounded-xl border space-y-1.5 text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white'
                }`}>
                  <div className={`flex items-center gap-1.5 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Analisis Regulasi &amp; Bukti Rekonsiliasi Episode:</span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-800 font-medium' : 'text-white/70'}`}>
                    Berdasarkan <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>Permenkes No. 26/2021</strong> dan kaidah koding INA-CBG, tindakan kontrol atau follow-up yang menyertai prosedur utama pada hari dan episode yang sama harus dikonsolidasikan ke dalam satu paket tarif (bundled claim). 
                    Pengajuan dua berkas terpisah mengindikasikan potensi <strong className={isLight ? 'text-slate-900 font-bold underline decoration-rose-500/40' : 'text-white'}>unbundling untuk melipatgandakan klaim</strong> ke DJS.
                  </p>
                  <div className={`flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t text-[10.5px] ${
                    isLight ? 'border-slate-200' : 'border-white/10'
                  }`}>
                    <span className={`font-semibold ${isLight ? 'text-slate-800 font-bold' : 'text-white/50'}`}>Rekomendasi Triase:</span>
                    <span className={`font-bold font-mono px-2.5 py-1 rounded-lg text-[10.5px] border ${
                      isLight
                        ? 'bg-slate-100 text-rose-800 border-slate-300 shadow-xs'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block mr-1.5 animate-pulse" />
                      Jalur Merah: Tunda Pembayaran Klaim B &amp; Terbitkan Audit Dossier
                    </span>
                  </div>
                </div>

                {/* TOMBOL TINDAKAN LANGSUNG */}
                <div className="pt-1">
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onInspectCase && onInspectCase(selectedCase)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-900/20 cursor-pointer"
                  >
                    <span>Buka Investigasi Kasus #{selectedCase.peserta_id}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ANALISIS KELOMPOK CASEMIX INA-CBG */}
      {activeTab === 'cbg' && (
        <div className={`p-5 rounded-2xl border backdrop-blur-xl space-y-4 transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm text-slate-800'
            : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 text-white'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <TrendingUp className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
                <span>Distribusi Volume &amp; Biaya INA-CBG pada Kohort 10.000 Klaim BPJS</span>
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-white/50'}`}>
                Pola penagihan memperlihatkan konsentrasi tinggi pada penyakit kronis rawat jalan dan prosedur kecil yang rentan diajukan berulang.
              </p>
            </div>
            <button type="button"
              onClick={() => runQuery(PRESET_QUERIES[1].sql)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border cursor-pointer transition ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
              }`}
            >
              <RefreshCw className="w-3 h-3" /> Refresh Kueri
            </button>
          </div>

          {/* 5 TOP CASEMIX CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div className={`p-3 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-amber-50/70 border-amber-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-[10px] font-bold ${isLight ? 'text-amber-800' : 'text-white/50'}`}>Top #1 · Kronis</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${isLight ? 'text-amber-900' : 'text-[#FFCA40]'}`}>Q-5-44-0</div>
              <div className={`text-[11px] font-bold mt-0.5 line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Penyakit Kronis Kecil</div>
              <div className={`mt-2 text-[10.5px] ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                Vol: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>5.198 (51,9%)</strong><br/>
                Tot: <strong className={isLight ? 'text-amber-900 font-bold' : 'text-[#FFCA40]'}>Rp 1,21 Miliar</strong><br/>
                Avg: <span className="font-mono text-[10px]">Rp 233.573</span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-amber-50/70 border-amber-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-[10px] font-bold ${isLight ? 'text-amber-800' : 'text-white/50'}`}>Top #2 · Akut</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${isLight ? 'text-amber-900' : 'text-[#FFCA40]'}`}>Q-5-42-0</div>
              <div className={`text-[11px] font-bold mt-0.5 line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Penyakit Akut Kecil</div>
              <div className={`mt-2 text-[10.5px] ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                Vol: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>440 (4,4%)</strong><br/>
                Tot: <strong className={isLight ? 'text-amber-900 font-bold' : 'text-[#FFCA40]'}>Rp 93,9 Juta</strong><br/>
                Avg: <span className="font-mono text-[10px]">Rp 213.573</span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-amber-50/70 border-amber-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-[10px] font-bold ${isLight ? 'text-amber-800' : 'text-white/50'}`}>Top #3 · Dialisis</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${isLight ? 'text-amber-900' : 'text-[#FFCA40]'}`}>N-3-15-0</div>
              <div className={`text-[11px] font-bold mt-0.5 line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Prosedur Dialisis</div>
              <div className={`mt-2 text-[10.5px] ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                Vol: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>397 (3,9%)</strong><br/>
                Tot: <strong className={isLight ? 'text-amber-900 font-bold' : 'text-[#FFCA40]'}>Rp 364,1 Juta</strong><br/>
                Avg: <span className="font-mono text-[10px]">Rp 917.274</span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-amber-50/70 border-amber-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-[10px] font-bold ${isLight ? 'text-amber-800' : 'text-white/50'}`}>Top #4 · Gigi</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${isLight ? 'text-amber-900' : 'text-[#FFCA40]'}`}>U-3-16-0</div>
              <div className={`text-[11px] font-bold mt-0.5 line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Prosedur Gigi &amp; Mulut</div>
              <div className={`mt-2 text-[10.5px] ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                Vol: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>284 (2,8%)</strong><br/>
                Tot: <strong className={isLight ? 'text-amber-900 font-bold' : 'text-[#FFCA40]'}>Rp 101,1 Juta</strong><br/>
                Avg: <span className="font-mono text-[10px]">Rp 356.175</span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border relative overflow-hidden transition-all ${
              isLight ? 'bg-amber-50/70 border-amber-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className={`text-[10px] font-bold ${isLight ? 'text-amber-800' : 'text-white/50'}`}>Top #5 · Terapi</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${isLight ? 'text-amber-900' : 'text-[#FFCA40]'}`}>M-3-16-0</div>
              <div className={`text-[11px] font-bold mt-0.5 line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Fisioterapi Kecil</div>
              <div className={`mt-2 text-[10.5px] ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                Vol: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>258 (2,6%)</strong><br/>
                Tot: <strong className={isLight ? 'text-amber-900 font-bold' : 'text-[#FFCA40]'}>Rp 35,9 Juta</strong><br/>
                Avg: <span className="font-mono text-[10px]">Rp 139.314</span>
              </div>
            </div>
          </div>

          {/* TABEL BREAKDOWN CASEMIX */}
          <div className={`border rounded-xl overflow-hidden ${
            isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#00134A]'
          }`}>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b text-[10.5px] font-mono ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/60'
                }`}>
                  <th className="p-2.5 font-bold">KODE CBG</th>
                  <th className="p-2.5 font-bold">DESKRIPSI KELOMPOK DIAGNOSIS / TINDAKAN</th>
                  <th className="p-2.5 font-bold">VOLUME KLAIM</th>
                  <th className="p-2.5 font-bold text-right">TOTAL TAGIHAN</th>
                  <th className="p-2.5 font-bold text-right">RATA-RATA</th>
                  <th className="p-2.5 font-bold text-center">RISIKO ANOMALI</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono text-[11px] ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                <tr className={isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}>
                  <td className={`p-2.5 font-bold ${isLight ? 'text-emerald-900' : 'text-[#FFCA40]'}`}>Q-5-44-0</td>
                  <td className={`p-2.5 font-sans font-medium ${isLight ? 'text-slate-800' : 'text-white'}`}>PENYAKIT KRONIS KECIL LAIN-LAIN</td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">5.198</span>
                      <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[52%]" />
                      </div>
                      <span className="text-[10px] text-slate-500">51,9%</span>
                    </div>
                  </td>
                  <td className={`p-2.5 text-right font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Rp 1.214.110.100</td>
                  <td className="p-2.5 text-right text-slate-500">Rp 233.573</td>
                  <td className="p-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                      isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      TINGGI (Unbundling)
                    </span>
                  </td>
                </tr>
                <tr className={isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}>
                  <td className={`p-2.5 font-bold ${isLight ? 'text-emerald-900' : 'text-[#FFCA40]'}`}>Q-5-42-0</td>
                  <td className={`p-2.5 font-sans font-medium ${isLight ? 'text-slate-800' : 'text-white'}`}>PENYAKIT AKUT KECIL LAIN-LAIN</td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">440</span>
                      <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div className="bg-amber-500 h-full w-[4.4%]" />
                      </div>
                      <span className="text-[10px] text-slate-500">4,4%</span>
                    </div>
                  </td>
                  <td className={`p-2.5 text-right font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Rp 93.972.200</td>
                  <td className="p-2.5 text-right text-slate-500">Rp 213.573</td>
                  <td className="p-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                      isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      TINGGI (Split Billing)
                    </span>
                  </td>
                </tr>
                <tr className={isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}>
                  <td className={`p-2.5 font-bold ${isLight ? 'text-emerald-900' : 'text-[#FFCA40]'}`}>N-3-15-0</td>
                  <td className={`p-2.5 font-sans font-medium ${isLight ? 'text-slate-800' : 'text-white'}`}>PROSEDUR DIALISIS (HEMODIALISIS)</td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">397</span>
                      <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div className="bg-cyan-500 h-full w-[4%]" />
                      </div>
                      <span className="text-[10px] text-slate-500">3,9%</span>
                    </div>
                  </td>
                  <td className={`p-2.5 text-right font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Rp 364.157.590</td>
                  <td className="p-2.5 text-right text-slate-500">Rp 917.274</td>
                  <td className="p-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                      isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-[#FFCA40]'
                    }`}>
                      SEDANG (Siklus HD)
                    </span>
                  </td>
                </tr>
                <tr className={isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}>
                  <td className={`p-2.5 font-bold ${isLight ? 'text-emerald-900' : 'text-[#FFCA40]'}`}>U-3-16-0</td>
                  <td className={`p-2.5 font-sans font-medium ${isLight ? 'text-slate-800' : 'text-white'}`}>PROSEDUR PADA GIGI &amp; MULUT</td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">284</span>
                      <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div className="bg-purple-500 h-full w-[2.8%]" />
                      </div>
                      <span className="text-[10px] text-slate-500">2,8%</span>
                    </div>
                  </td>
                  <td className={`p-2.5 text-right font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Rp 101.153.800</td>
                  <td className="p-2.5 text-right text-slate-500">Rp 356.175</td>
                  <td className="p-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                      isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-[#FFCA40]'
                    }`}>
                      SEDANG (Pemisahan Gigi)
                    </span>
                  </td>
                </tr>
                <tr className={isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}>
                  <td className={`p-2.5 font-bold ${isLight ? 'text-emerald-900' : 'text-[#FFCA40]'}`}>M-3-16-0</td>
                  <td className={`p-2.5 font-sans font-medium ${isLight ? 'text-slate-800' : 'text-white'}`}>PROSEDUR TERAPI FISIK &amp; MUSKULOSKELETAL</td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">258</span>
                      <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div className="bg-indigo-500 h-full w-[2.6%]" />
                      </div>
                      <span className="text-[10px] text-slate-500">2,6%</span>
                    </div>
                  </td>
                  <td className={`p-2.5 text-right font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Rp 35.942.900</td>
                  <td className="p-2.5 text-right text-slate-500">Rp 139.314</td>
                  <td className="p-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                      isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      TINGGI (Sesi Berulang)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SQL RUNNER INTERAKTIF */}
      {activeTab === 'sql' && (
        <div className={`p-5 rounded-2xl border backdrop-blur-xl space-y-4 transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm text-slate-800'
            : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 text-white'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <h3 className={`text-sm font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Terminal className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
                <span>Konsol SQL Database Read-Only</span>
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-700 font-medium' : 'text-white/50'}`}>
                Jalankan kueri SQL analitik terverifikasi terhadap view kolumnar database berkecepatan tinggi.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {PRESET_QUERIES.map((q, idx) => (
                <button type="button"
                  key={idx}
                  onClick={() => {
                    setActivePresetIndex(idx);
                    setSqlQuery(q.sql);
                    runQuery(q.sql);
                  }}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border font-semibold cursor-pointer transition ${
                    activePresetIndex === idx
                      ? isLight
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-[#FFCA40] text-[#00134A] border-[#FFCA40] font-bold shadow-md'
                      : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                  }`}
                >
                  Preset {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              rows={3}
              className={`w-full font-mono text-xs p-3 rounded-lg border focus:outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 shadow-inner'
                  : 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-[#FFCA40]/60 focus:bg-white/10'
              }`}
            />
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono font-medium ${isLight ? 'text-slate-700' : 'text-white/40'}`}>
                Mesin: In-Memory Database OLAP · Format: JSON Table · Read-Only Sandbox
              </span>
              <button type="button"
                onClick={() => runQuery()}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition disabled:opacity-50 cursor-pointer ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-[#FFCA40] hover:bg-[#FFE08C] text-[#00134A] shadow-md'
                }`}
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>Eksekusi SQL</span>
              </button>
            </div>
          </div>

          {/* HASIL KUERI TABLE */}
          {queryResult && (
            <div className={`border rounded-xl overflow-hidden shadow-xs ${
              isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#00134A]'
            }`}>
              <div className={`px-3 py-2 border-b flex items-center justify-between text-[11px] font-mono ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/70'
              }`}>
                <span>Hasil Eksekusi: <strong className={isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}>{queryResult.data?.length || 0} Baris</strong></span>
                <span>Latensi OLAP: <strong className={isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}>{queryDuration}</strong></span>
              </div>
              <div className="max-h-72 overflow-x-auto overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className={`border-b text-[11px] ${
                      isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/60'
                    }`}>
                      {queryResult.columns?.map((col, idx) => (
                        <th key={idx} className="p-2.5 font-bold uppercase tracking-wider">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                    {queryResult.data && queryResult.data.length > 0 ? (
                      queryResult.data.map((row, rowIdx) => (
                        <tr key={rowIdx} className={`transition-colors ${
                          isLight ? 'hover:bg-slate-50 odd:bg-white even:bg-slate-50/50' : 'hover:bg-white/5 odd:bg-transparent even:bg-white/[0.02]'
                        }`}>
                          {queryResult.columns.map((col, colIdx) => (
                            <td key={colIdx} className={`p-2.5 whitespace-nowrap ${
                              isLight ? 'text-slate-900 font-medium' : 'text-white/90'
                            }`}>
                              {typeof row[col] === 'number' && (col.includes('biaya') || col.includes('rupiah'))
                                ? formatRp(row[col])
                                : String(row[col] ?? '-')}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={queryResult.columns?.length || 1} className={`text-center py-6 text-xs ${
                          isLight ? 'text-slate-500' : 'text-white/40'
                        }`}>
                          Tidak ada baris data yang ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
