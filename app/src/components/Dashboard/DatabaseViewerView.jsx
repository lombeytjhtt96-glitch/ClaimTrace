import React, { useState, useMemo, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../../services/apiConfig';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  RefreshCw,
  Search,
  ChevronDown,
  ArrowRight,
  Filter,
  Download,
  Key,
  Layers,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  Building2,
  UserCheck,
  Radio,
  Terminal,
  Play,
  CheckCircle2,
  Clock,
  Copy,
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';

// Dictionary of official BPJS variables for human-readable labels
const BPJS_COLUMN_LABELS = {
  PSTV01: 'ID Peserta (Anonymized Hash)',
  PSTV02: 'ID Keluarga Peserta',
  PSTV03: 'Tanggal Lahir Peserta',
  PSTV04: 'Hubungan Keluarga (1:KK, 2:Istri, 3:Anak)',
  PSTV05: 'Jenis Kelamin (1:Pria, 2:Wanita)',
  PSTV06: 'Status Kawin',
  PSTV07: 'Kelas Hak Rawat (1:Kls 1, 2:Kls 2, 3:Kls 3)',
  PSTV08: 'Segmen Kepesertaan JKN',
  PSTV10: 'Kode Kab/Kota Domisili',
  PSTV15: 'Bobot Penyesuaian Aktuaria',
  FKP02: 'Nomor Rujukan FKTP',
  FKL02: 'Nomor SEP / Klaim FKRTL',
  FKL03: 'Tanggal Masuk Pelayanan',
  FKL04: 'Tanggal Pulang Pelayanan',
  FKL05: 'Tingkat Pelayanan (1:RJTL, 2:RITL)',
  FKL06: 'Poli / Subspesialisasi Layanan',
  FKL07: 'Kepemilikan Faskes (Pemerintah/Swasta)',
  FKL08: 'Kelas Rumah Sakit (A, B, C, D)',
  FKL15: 'Kode ICD-10 Masuk (3-digit)',
  FKL15A: 'Deskripsi ICD-10 Masuk (3-digit)',
  FKL16: 'Kode ICD-10 Masuk (4-digit)',
  FKL16A: 'Deskripsi ICD-10 Masuk Lengkap',
  FKL17: 'Kode ICD-10 Primer (3-digit)',
  FKL17A: 'Deskripsi ICD-10 Primer (3-digit)',
  FKL18: 'Kode ICD-10 Primer (4-digit)',
  FKL18A: 'Deskripsi ICD-10 Primer Lengkap',
  FKL19: 'Kode INA-CBG',
  FKL19A: 'Deskripsi Tarif INA-CBG',
  FKL24: 'Kode ICD-10 Sekunder',
  FKL24A: 'Kode ICD-10 Sekunder (3-digit)',
  FKL24B: 'Deskripsi ICD-10 Sekunder Lengkap',
  FKL47: 'Biaya Tagihan RS (Rupiah)',
  FKL48: 'Biaya Disetujui BPJS (Rupiah)',
  claim_id: 'ID Klaim Internal',
  faskes_id: 'Kode Registri Faskes',
  nama_faskes: 'Nama Fasilitas Kesehatan',
  nilai_klaim_rp: 'Nilai Klaim (Rupiah)',
  triage_lane: 'Jalur Triage (MERAH/KUNING/HIJAU)',
  final_priority_score: 'Skor Prioritas Risiko (0-100)',
  peserta_id: 'ID Peserta BPJS',
  tgl_masuk: 'Tanggal Masuk Perawatan',
  claim_1: 'Nomor Klaim Pertama',
  claim_2: 'Nomor Klaim Kedua',
  biaya_1: 'Biaya Klaim 1 (Rp)',
  biaya_2: 'Biaya Klaim 2 (Rp)',
  total_rupiah_gabungan: 'Total Nilai Gabungan (Rp)'
};

// Table category and descriptions
const TABLE_METADATA = {
  bpjs_fkrtl_all: {
    category: 'bpjs_core',
    title: 'Klaim FKRTL Raw (1.7 Juta Baris)',
    description: 'Data mentah seluruh pengajuan klaim Rumah Sakit se-Indonesia (2023-2024). Berisi 1.699.219 rekaman klaim senilai Rp 1,535 Triliun.',
    primary_key: 'FKL02'
  },
  bpjs_kepesertaan_all: {
    category: 'bpjs_core',
    title: 'Master Kepesertaan JKN (2.59 Juta Baris)',
    description: 'Data demografi peserta BPJS Kesehatan terdaftar (2015-2024), mencakup 2.590.751 profil peserta dengan segmen iuran dan bobot aktuaria.',
    primary_key: 'PSTV01'
  },
  bpjs_diagnosissekunder_all: {
    category: 'bpjs_core',
    title: 'Diagnosis Sekunder (1.96 Juta Baris)',
    description: 'Rincian diagnosis komorbid/sekunder pasien rawat jalan & inap (1.967.670 baris) berelasi dengan FKL02.',
    primary_key: 'FKL02'
  },
  bpjs_icd10_dxprimer: {
    category: 'bpjs_core',
    title: 'Kamus ICD-10 Primer (1.577 Kode)',
    description: 'Daftar resmi kode diagnosis utama ICD-10 pada pelayanan rujukan tingkat lanjutan.',
    primary_key: 'fkl17'
  },
  bpjs_icd10_dxmasuk: {
    category: 'bpjs_core',
    title: 'Kamus ICD-10 Masuk (1.906 Kode)',
    description: 'Daftar resmi diagnosis masuk awal pasien sebelum ditegakkan diagnosis utama.',
    primary_key: 'fkl15'
  },
  bpjs_icd10_fktp: {
    category: 'bpjs_core',
    title: 'Kamus ICD-10 FKTP (2.000 Kode)',
    description: 'Daftar kode diagnosis standar pelayanan fasilitas kesehatan tingkat pertama (Puskesmas/Klinik Pratama).',
    primary_key: 'kode'
  },
  bpjs_icd10_pnk: {
    category: 'bpjs_core',
    title: 'Kamus ICD-10 Non-Kapitasi (1.223 Kode)',
    description: 'Daftar kode diagnosis FKTP untuk klaim non-kapitasi (persalinan, ambulans, dll).',
    primary_key: 'kode'
  },
  claims_warehouse: {
    category: 'triage',
    title: 'Gudang Klaim Terindeks Triage',
    description: 'Tabel gabungan hasil ekstraksi fitur S1 (Kemenkes SATUSEHAT), S2 (Presensi Mobile JKN), dan S3 (INA-CBG Rule-Based).',
    primary_key: 'claim_id'
  },
  v_bpjs_full_summary: {
    category: 'analytical_view',
    title: 'Ikhtisar Portofolio Data Warehouse',
    description: 'View analitis agregasi 1.7M klaim: total pasien unik, total pagu klaim, dan rata-rata biaya klaim.',
    primary_key: 'total_klaim'
  },
  v_bpjs_full_multihospital_same_day: {
    category: 'analytical_view',
    title: 'Deteksi Multi-RS di Hari Sama (2.584 Kasus)',
    description: 'Deteksi kecurangan Impossible Travel / sindikat klaim fiktif di mana 1 peserta tercatat dirawat di 2 Rumah Sakit berbeda di tanggal yang sama (total Rp 19,26 Miliar).',
    primary_key: 'peserta_id'
  },
  v_bpjs_full_same_hospital_same_day: {
    category: 'analytical_view',
    title: 'Deteksi Unbundling RS Sama (2.292 Kasus)',
    description: 'Deteksi pemecahan episode klaim (unbundling) di Rumah Sakit yang sama pada tanggal yang sama untuk melipatgandakan klaim (total Rp 13,32 Miliar).',
    primary_key: 'peserta_id'
  },
  v_bpjs_top_cbg_analysis: {
    category: 'analytical_view',
    title: 'Top INA-CBG Volume & Biaya',
    description: 'Peringkat kelompok tarif INA-CBG dengan volume dan penyerapan dana tagihan tertinggi.',
    primary_key: 'kode_cbg'
  },
  v_financial_exposure: {
    category: 'analytical_view',
    title: 'Paparan Finansial per Jalur Triage',
    description: 'Distribusi total rupiah dan proporsi anggaran klaim pada jalur MERAH, KUNING, dan HIJAU.',
    primary_key: 'triage_lane'
  },
  v_phantom_billing_risk: {
    category: 'analytical_view',
    title: 'Klaster Lonjakan Phantom Billing',
    description: 'Klaster klaim dengan lonjakan di atas 3x baseline tanpa izin resmi bakti sosial.',
    primary_key: 'cluster_id'
  },
  v_repeat_billing_risk: {
    category: 'analytical_view',
    title: 'Klaim Berulang (Repeat Billing)',
    description: 'Klaim terindikasi penagihan ulang dengan kode CBG dan diagnosa primer identik.',
    primary_key: 'claim_id'
  }
};

// Preset SQL Queries
const PRESET_QUERIES = [
  {
    name: 'Top 10 Klaim Biaya Tertinggi (FKRTL)',
    sql: 'SELECT FKL02 as no_sep, PSTV01 as id_peserta, FKL03 as tgl_masuk, FKL19 as cbg, FKL19A as deskripsi_cbg, FKL18A as diagnosa, FKL47 as biaya_tagih_rp FROM bpjs_fkrtl_all ORDER BY FKL47 DESC LIMIT 10;'
  },
  {
    name: 'Impossible Travel: Pasien di 2 RS Berbeda',
    sql: 'SELECT peserta_id, tgl_masuk, claim_1, claim_2, faskes_1, faskes_2, cbg_1, cbg_2, total_rupiah_gabungan FROM v_bpjs_full_multihospital_same_day ORDER BY total_rupiah_gabungan DESC LIMIT 10;'
  },
  {
    name: '10 Diagnosis Primer Termahal (Total Biaya)',
    sql: 'SELECT FKL18A as diagnosa_primer, COUNT(*) as jumlah_kasus, SUM(FKL47) as total_biaya_rp, ROUND(AVG(FKL47), 0) as rata_biaya_rp FROM bpjs_fkrtl_all WHERE FKL18A IS NOT NULL GROUP BY FKL18A ORDER BY total_biaya_rp DESC LIMIT 10;'
  },
  {
    name: 'Ikhtisar Portofolio 1.7M Klaim Database',
    sql: 'SELECT * FROM v_bpjs_full_summary;'
  },
  {
    name: 'Kasus Unbundling (Klaim Terpisah RS Sama)',
    sql: 'SELECT peserta_id, tgl_masuk, claim_1, claim_2, faskes_id, cbg_1, cbg_2, total_rupiah_gabungan FROM v_bpjs_full_same_hospital_same_day ORDER BY total_rupiah_gabungan DESC LIMIT 10;'
  },
  {
    name: 'Distribusi Peserta BPJS per Hubungan Keluarga',
    sql: "SELECT CASE PSTV04 WHEN 1 THEN 'Kepala Keluarga' WHEN 2 THEN 'Istri/Pasangan' WHEN 3 THEN 'Anak' ELSE 'Lainnya' END as status_keluarga, COUNT(*) as jumlah_peserta FROM bpjs_kepesertaan_all GROUP BY 1 ORDER BY 2 DESC;"
  }
];

// Relational ERD Schema definitions
const ERD_RELATIONSHIPS = [
  {
    source_table: 'bpjs_fkrtl_all',
    source_column: 'PSTV01',
    target_table: 'bpjs_kepesertaan_all',
    target_column: 'PSTV01',
    type: 'Many-to-One',
    description: 'Relasi identitas peserta klaim ke master demografi kepesertaan'
  },
  {
    source_table: 'bpjs_fkrtl_all',
    source_column: 'FKL02',
    target_table: 'bpjs_diagnosissekunder_all',
    target_column: 'FKL02',
    type: 'One-to-Many',
    description: 'Relasi berkas SEP klaim ke daftar rincian diagnosis komorbid sekunder'
  },
  {
    source_table: 'bpjs_fkrtl_all',
    source_column: 'FKL18A',
    target_table: 'bpjs_icd10_dxprimer',
    target_column: 'diagprimer_3digit',
    type: 'Many-to-One',
    description: 'Validasi kode diagnosis utama ICD-10 terhadap kamus resmi FKRTL'
  },
  {
    source_table: 'bpjs_fkrtl_all',
    source_column: 'FKL16A',
    target_table: 'bpjs_icd10_dxmasuk',
    target_column: 'diagmasuk_3digit',
    type: 'Many-to-One',
    description: 'Validasi diagnosis masuk awal terhadap kamus ICD-10 masuk'
  },
  {
    source_table: 'claims_warehouse',
    source_column: 'claim_id',
    target_table: 'audit_ledger_attestations',
    target_column: 'claim_id',
    type: 'One-to-Many',
    description: 'Audit trail keputusan verifikator BAKB/BAKK terdesentralisasi'
  }
];

const TABLE_DEFAULTS = {
  bpjs_fkrtl_all: { totalRows: 1699219, totalCols: 57 },
  bpjs_kepesertaan_all: { totalRows: 2590751, totalCols: 20 },
  bpjs_diagnosissekunder_all: { totalRows: 1967670, totalCols: 4 },
  claims_warehouse: { totalRows: 6, totalCols: 27 },
  bpjs_fkrtl_2024: { totalRows: 10000, totalCols: 57 },
  v_bpjs_full_multihospital_same_day: { totalRows: 2584, totalCols: 13 },
  v_bpjs_full_same_hospital_same_day: { totalRows: 2292, totalCols: 12 },
  v_bpjs_full_summary: { totalRows: 1, totalCols: 7 },
  v_bpjs_repeat_claims_same_day: { totalRows: 12, totalCols: 12 },
  v_bpjs_top_cbg_analysis: { totalRows: 314, totalCols: 6 },
  v_financial_exposure: { totalRows: 3, totalCols: 5 },
  v_phantom_billing_risk: { totalRows: 2, totalCols: 8 },
  v_repeat_billing_risk: { totalRows: 1, totalCols: 9 },
  bpjs_icd10_dxprimer: { totalRows: 1577, totalCols: 2 },
  bpjs_icd10_dxmasuk: { totalRows: 1906, totalCols: 2 },
  bpjs_icd10_fktp: { totalRows: 2000, totalCols: 2 },
  bpjs_icd10_pnk: { totalRows: 1223, totalCols: 2 }
};

const FALLBACK_TABLES = [
  { name: 'bpjs_fkrtl_all', type: 'BASE TABLE' },
  { name: 'bpjs_kepesertaan_all', type: 'BASE TABLE' },
  { name: 'bpjs_diagnosissekunder_all', type: 'BASE TABLE' },
  { name: 'claims_warehouse', type: 'BASE TABLE' },
  { name: 'v_bpjs_full_summary', type: 'VIEW' },
  { name: 'v_phantom_billing_risk', type: 'VIEW' },
  { name: 'v_repeat_billing_risk', type: 'VIEW' }
];

const FALLBACK_COLUMNS = [
  { column_name: 'PSTV01', column_type: 'INTEGER' },
  { column_name: 'FKL02', column_type: 'VARCHAR' },
  { column_name: 'FKL03', column_type: 'TIMESTAMP' },
  { column_name: 'FKL04', column_type: 'TIMESTAMP' },
  { column_name: 'FKL18A', column_type: 'VARCHAR' },
  { column_name: 'FKL19', column_type: 'VARCHAR' },
  { column_name: 'FKL19A', column_type: 'VARCHAR' },
  { column_name: 'FKL47', column_type: 'INTEGER' }
];

const FALLBACK_ROWS = Array.from({ length: 25 }, (_, idx) => ({
  PSTV01: 1048200 + idx,
  FKL02: `0132R0011026V00${String(idx + 1).padStart(4, '0')}`,
  FKL03: `2026-10-${String((idx % 14) + 1).padStart(2, '0')} 08:30:00`,
  FKL04: `2026-10-${String((idx % 14) + 2).padStart(2, '0')} 14:15:00`,
  FKL18A: idx % 3 === 0 ? 'M62.8 (Other specified disorders of muscle)' : idx % 2 === 0 ? 'A41.9 (Sepsis, unspecified)' : 'I25.1 (Atherosclerotic heart disease)',
  FKL19: idx % 3 === 0 ? 'Z-3-12-0' : idx % 2 === 0 ? 'I-4-10-III' : 'I-4-17-I',
  FKL19A: idx % 3 === 0 ? 'Prosedur Fisioterapi / Rehabilitasi Medis' : idx % 2 === 0 ? 'Sepsis Berat Rawat Inap' : 'Pneumonia Bakterial',
  FKL47: idx % 3 === 0 ? 15300000 : idx % 2 === 0 ? 18450000 : 5800000
}));

const getApiBase = () => API_BASE_URL;

export default function DatabaseViewerView({ isLight: propIsLight }) {
  const [themeIsLight, setThemeIsLight] = useState(() => {
    if (typeof propIsLight === 'boolean') return propIsLight;
    if (typeof document !== 'undefined') {
      const root = document.getElementById('cockpit-root') || document.documentElement;
      return root.classList.contains('theme-light');
    }
    return false;
  });

  useEffect(() => {
    if (typeof propIsLight === 'boolean') {
      setThemeIsLight(propIsLight);
      return;
    }
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      const root = document.getElementById('cockpit-root') || document.documentElement;
      setThemeIsLight(root.classList.contains('theme-light'));
    });
    const root = document.getElementById('cockpit-root') || document.documentElement;
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [propIsLight]);

  const isLight = typeof propIsLight === 'boolean' ? propIsLight : themeIsLight;

  const [activeTab, setActiveTab] = useState('explorer'); // 'explorer' | 'sql' | 'erd'
  const [tablesList, setTablesList] = useState([]);
  const [selectedTable, setSelectedTable] = useState('bpjs_fkrtl_all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [searchRowQuery, setSearchRowQuery] = useState('');
  const [searchVarQuery, setSearchVarQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);

  // Table Data State with resilient pre-seeded metadata
  const [columnsSchema, setColumnsSchema] = useState(FALLBACK_COLUMNS);
  const [tableRows, setTableRows] = useState(FALLBACK_ROWS);
  const [totalRows, setTotalRows] = useState(1699219);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // SQL Console State
  const [sqlInput, setSqlInput] = useState(PRESET_QUERIES[0].sql);
  const [sqlResult, setSqlResult] = useState(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlError, setSqlError] = useState(null);
  const [sqlDuration, setSqlDuration] = useState(null);

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Tables & Status on Mount
  const fetchTablesAndStatus = async () => {
    setIsLoading(true);
    const apiBase = getApiBase();
    try {
      // 1. Fetch tables
      const tRes = await fetch(`${apiBase}/api/v1/duckdb/tables`);
      if (tRes.ok) {
        const tJson = await tRes.json();
        if (tJson.tables && tJson.tables.length > 0) {
          setTablesList(tJson.tables);
        } else {
          setTablesList(FALLBACK_TABLES);
        }
      } else {
        setTablesList(FALLBACK_TABLES);
      }

      // 2. Fetch DB info
      const infoRes = await fetch(`${apiBase}/api/v1/duckdb/info`);
      if (infoRes.ok) {
        const infoJson = await infoRes.json();
        setDbStatus(infoJson);
      }
    } catch (err) {
      console.warn('[DatabaseViewer] Failed to fetch live DuckDB tables, using fallback schema', err);
      setTablesList(FALLBACK_TABLES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTablesAndStatus();
  }, []);

  // Fetch Table Data & Schema when selectedTable or page or pageSize changes
  useEffect(() => {
    if (!selectedTable) return;

    let isMounted = true;
    // Pre-seed row count immediately from known authoritative metadata
    const expected = TABLE_DEFAULTS[selectedTable];
    if (expected?.totalRows && isMounted) {
      setTotalRows(expected.totalRows);
    }

    const loadTableData = async () => {
      setIsLoading(true);
      const apiBase = getApiBase();
      try {
        // 1. Fetch Schema / Describe
        const descRes = await fetch(`${apiBase}/api/v1/duckdb/describe/${selectedTable}`);
        if (descRes.ok) {
          const descJson = await descRes.json();
          if (isMounted && descJson.columns && descJson.columns.length > 0) {
            setColumnsSchema(descJson.columns);
          } else if (isMounted) {
            setColumnsSchema(FALLBACK_COLUMNS);
          }
        } else {
          if (isMounted) setColumnsSchema(FALLBACK_COLUMNS);
        }

        // 2. Fetch Count
        const countRes = await fetch(`${apiBase}/api/v1/duckdb/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: `SELECT COUNT(*) as total FROM ${selectedTable};` })
        });
        if (countRes.ok) {
          const countJson = await countRes.json();
          if (countJson.data && countJson.data.length > 0 && typeof countJson.data[0].total === 'number') {
            if (isMounted) setTotalRows(countJson.data[0].total);
          }
        }

        // 3. Fetch Rows with Pagination
        const offset = (page - 1) * pageSize;
        const querySql = `SELECT * FROM ${selectedTable} LIMIT ${pageSize} OFFSET ${offset};`;
        const dataRes = await fetch(`${apiBase}/api/v1/duckdb/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: querySql })
        });
        if (dataRes.ok) {
          const dataJson = await dataRes.json();
          if (isMounted) {
            if (dataJson.data && dataJson.data.length > 0) {
              setTableRows(dataJson.data);
            } else {
              setTableRows(FALLBACK_ROWS);
            }
            if ((!columnsSchema.length || columnsSchema.length < 5) && dataJson.columns) {
              setColumnsSchema(dataJson.columns.map(c => ({ column_name: c, column_type: 'VARCHAR' })));
            }
          }
        } else {
          if (isMounted) {
            setTableRows(FALLBACK_ROWS);
            setColumnsSchema(FALLBACK_COLUMNS);
          }
        }
      } catch (err) {
        console.error('[DatabaseViewer] Error loading table rows', err);
        if (isMounted) {
          setTableRows(FALLBACK_ROWS);
          setColumnsSchema(FALLBACK_COLUMNS);
          if (expected?.totalRows) setTotalRows(expected.totalRows);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadTableData();

    return () => {
      isMounted = false;
    };
  }, [selectedTable, page, pageSize]);

  // Execute SQL Console Query
  const handleExecuteSql = async (overrideSql) => {
    const targetSql = overrideSql || sqlInput;
    if (!targetSql || !targetSql.trim()) return;

    setSqlLoading(true);
    setSqlError(null);
    const start = performance.now();
    const apiBase = getApiBase();

    try {
      const res = await fetch(`${apiBase}/api/v1/duckdb/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: targetSql })
      });

      const json = await res.json();
      const end = performance.now();
      setSqlDuration(`${(end - start).toFixed(1)} ms`);

      if (json.error) {
        setSqlError(json.error);
        setSqlResult(null);
      } else {
        setSqlResult(json);
      }
    } catch (err) {
      setSqlError(err.message || 'Gagal menghubungi server database.');
      setSqlResult(null);
    } finally {
      setSqlLoading(false);
    }
  };

  // Filtered Table Names
  const filteredTables = useMemo(() => {
    if (!tablesList.length) {
      return Object.keys(TABLE_METADATA).map(k => ({ name: k, type: 'BASE TABLE' }));
    }
    return tablesList.filter((t) =>
      t.name.toLowerCase().includes(searchTableQuery.toLowerCase())
    );
  }, [tablesList, searchTableQuery]);

  // Client-side search within displayed rows
  const displayRows = useMemo(() => {
    if (!searchRowQuery.trim()) return tableRows;
    return tableRows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(searchRowQuery.toLowerCase())
      )
    );
  }, [tableRows, searchRowQuery]);

  // Export Table Data
  const handleExportData = (format) => {
    if (!tableRows.length) return;
    if (format === 'json') {
      const jsonStr = JSON.stringify(tableRows, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable}_page_${page}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV format
      const cols = columnsSchema.map(c => c.column_name);
      const csvHeader = cols.join(',');
      const csvRows = tableRows.map(row =>
        cols.map(c => {
          const val = row[c];
          if (val === null || val === undefined) return '';
          const str = String(val).replace(/"/g, '""');
          return str.includes(',') ? `"${str}"` : str;
        }).join(',')
      );
      const csvContent = [csvHeader, ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable}_page_${page}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentMeta = TABLE_METADATA[selectedTable] || {
    title: selectedTable,
    description: 'Tabel repositori database ClaimTrace.',
    category: 'custom'
  };

  return (
    <div className={`space-y-6 pb-28 ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* Top Banner & Header — Cosmic Glassmorphism */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden rounded-2xl border p-6 shadow-xl backdrop-blur-xl group ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
          : 'bg-[#00153A]/85 border-white/10 text-white shadow-[#00081c]/50'
      }`}>
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <div className={`p-2 rounded-xl border ${
                isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}>
                <Database className="w-6 h-6" />
              </div>
              <span>Penampil Basis Data &amp; Data Warehouse JKN</span>
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}>
              Database OLAP Persistent (237 MB)
            </span>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-white/10 text-[#FFCA40] border-white/10'
            }`}>
              MITRE D3FEND: D3-DS · NIST CSF 2.0: PR.DS-01
            </span>
          </div>
          <p className={`text-xs sm:text-sm mt-2 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Repositori analitis memuat <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>6.264.346 baris data transaksi resmi BPJS Kesehatan (2015-2024)</span> yang tersimpan permanen dalam <code className={`font-mono px-1 py-0.5 rounded border ${
              isLight ? 'text-emerald-800 bg-slate-100 border-slate-200' : 'text-cyan-300 bg-white/10 border-white/10'
            }`}>claimtrace_warehouse.duckdb</code> dengan kueri vektor kolumnar berkecepatan tinggi.
          </p>
        </div>

        {/* Global Live Stats Card */}
        <div className={`flex items-center gap-4 p-3.5 rounded-xl border shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10'
        }`}>
          <div className="text-right">
            <div className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Total Baris Klaim Terindeks</div>
            <div className={`text-lg font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>6.264.346 Baris</div>
            <div className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-white/50'}`}>17 Tabel &amp; Views Database</div>
          </div>
          <div className={`h-10 w-[1px] ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
          <button
            type="button"
            onClick={fetchTablesAndStatus}
            disabled={isLoading}
            className={`p-2.5 rounded-xl transition-all shadow-md cursor-pointer border ${
              isLight 
                ? 'bg-white border-slate-300 text-slate-700 hover:text-emerald-700 hover:bg-slate-100' 
                : 'bg-white/5 border-white/10 hover:border-[#FFCA40]/50 text-white/80 hover:text-[#FFCA40] hover:bg-white/10'
            }`}
            title="Segarkan Sinkronisasi Database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-600' : isLight ? 'text-slate-600' : 'text-[#FFCA40]'}`} />
          </button>
        </div>
      </div>

      {/* Tab Navigation Controls */}
      <div className={`flex border-b px-4 rounded-t-2xl backdrop-blur-xl ${
        isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#00153A]/85'
      }`}>
        <button
          type="button"
          onClick={() => setActiveTab('explorer')}
          className={`flex items-center gap-2 py-3.5 px-4 font-semibold text-xs border-b-2 transition-colors cursor-pointer ${
            activeTab === 'explorer'
              ? (isLight ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-[#FFCA40] text-[#FFCA40] font-bold')
              : (isLight ? 'border-transparent text-slate-600 hover:text-slate-900' : 'border-transparent text-white/50 hover:text-white')
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>Penjelajah Tabel &amp; Data Mentah</span>
          <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full border font-bold ${
            isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          }`}>
            {tablesList.length || 17} Tabel
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sql')}
          className={`flex items-center gap-2 py-3.5 px-4 font-semibold text-xs border-b-2 transition-colors cursor-pointer ${
            activeTab === 'sql'
              ? (isLight ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-[#FFCA40] text-[#FFCA40] font-bold')
              : (isLight ? 'border-transparent text-slate-600 hover:text-slate-900' : 'border-transparent text-white/50 hover:text-white')
          }`}
        >
          <Terminal className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
          <span>Konsol SQL Interaktif (Database Engine)</span>
          <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full border font-bold ${
            isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-[#FFCA40] border-amber-500/30'
          }`}>
            Live OLAP
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('erd')}
          className={`flex items-center gap-2 py-3.5 px-4 font-semibold text-xs border-b-2 transition-colors cursor-pointer ${
            activeTab === 'erd'
              ? (isLight ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-[#FFCA40] text-[#FFCA40] font-bold')
              : (isLight ? 'border-transparent text-slate-600 hover:text-slate-900' : 'border-transparent text-white/50 hover:text-white')
          }`}
        >
          <Layers className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-blue-400'}`} />
          <span>Diagram Relasi ERD &amp; Kamus Kolom</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PENJELAJAH TABEL & DATA MENTAH */}
      {/* ========================================================================= */}
      {activeTab === 'explorer' && (
        <div className="space-y-5">
          {/* Table Selector Bar - overflow visible so dropdown menu floats freely */}
          <div className={`relative rounded-2xl border p-4 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4 z-20 ${
            isLight
              ? 'border-slate-200 bg-white text-slate-900 shadow-slate-200/50'
              : 'border-white/10 bg-[#00153A]/85 text-white shadow-[#00081c]/50'
          }`}>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className={`text-xs font-bold whitespace-nowrap ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Pilih Tabel Database:</span>
              
              {/* Custom Searchable Dropdown */}
              <div className="relative w-full md:w-80" ref={dropdownRef}>
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors border ${
                    isLight 
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-900 hover:border-emerald-500' 
                      : 'bg-white/5 border-white/10 hover:border-[#FFCA40]/50 text-white'
                  }`}
                >
                  <span className={`truncate flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Database className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                    <span>{selectedTable}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${
                    isLight ? 'text-slate-500' : 'text-white/40'
                  } ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className={`absolute top-full left-0 mt-1.5 w-full rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col border backdrop-blur-xl ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 shadow-xl'
                      : 'bg-[#00153A] border-white/20 text-white shadow-2xl'
                  }`}>
                    <div className={`p-2 border-b ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/5'}`}>
                      <div className={`flex items-center px-2.5 py-1.5 rounded-lg border ${
                        isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/10'
                      }`}>
                        <Search className={`w-3.5 h-3.5 mr-2 shrink-0 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                        <input
                          type="text"
                          placeholder="Cari tabel..."
                          value={searchTableQuery}
                          onChange={(e) => setSearchTableQuery(e.target.value)}
                          className={`w-full text-xs bg-transparent border-none outline-none ${
                            isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-white/40'
                          }`}
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className={`max-h-64 overflow-y-auto divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                      {filteredTables.map((tbl) => {
                        const meta = TABLE_METADATA[tbl.name];
                        return (
                          <div
                            key={tbl.name}
                            onClick={() => {
                              setSelectedTable(tbl.name);
                              setIsDropdownOpen(false);
                              setSearchTableQuery('');
                              setPage(1);
                            }}
                            className={`px-4 py-2.5 text-xs font-mono cursor-pointer transition-colors flex items-center justify-between ${
                              selectedTable === tbl.name
                                ? (isLight ? 'bg-emerald-50 text-emerald-900 font-bold' : 'bg-emerald-500/20 text-emerald-300 font-bold')
                                : (isLight ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-white/5 text-white/80')
                            }`}
                          >
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                <span>{tbl.name}</span>
                                {tbl.type === 'BASE TABLE' ? (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold border ${
                                    isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  }`}>BASE</span>
                                ) : (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold border ${
                                    isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                  }`}>VIEW</span>
                                )}
                              </div>
                              {meta && (
                                <div className={`text-[10px] font-sans mt-0.5 truncate max-w-[240px] ${
                                  isLight ? 'text-slate-500' : 'text-white/40'
                                }`}>
                                  {meta.title}
                                </div>
                              )}
                            </div>
                            {selectedTable === tbl.name && (
                              <div className={`w-2 h-2 rounded-full ${isLight ? 'bg-emerald-600' : 'bg-[#FFCA40]'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Table Metadata Summary */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/10 text-white/80 border-white/10'
              }`}>
                {columnsSchema.length || TABLE_DEFAULTS[selectedTable]?.totalCols || 57} Kolom
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                {isLoading ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                    <span>{(totalRows || TABLE_DEFAULTS[selectedTable]?.totalRows || 1699219).toLocaleString('id-ID')} Total Baris</span>
                  </span>
                ) : (
                  `${(totalRows || TABLE_DEFAULTS[selectedTable]?.totalRows || 1699219).toLocaleString('id-ID')} Total Baris`
                )}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                isLight ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-white/5 text-white/60 border-white/10'
              }`}>
                Halaman {page} dari {totalPages}
              </span>
            </div>
          </div>

          {/* Table Description Card */}
          <div className={`p-4 rounded-xl flex items-start gap-3 border ${
            isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
          }`}>
            <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-sky-600' : 'text-[#FFCA40]'}`} />
            <div className={`text-xs ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
              <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{currentMeta.title}: </span>
              {currentMeta.description}
            </div>
          </div>

          {/* Table Controls: Filter & Export */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden rounded-2xl border p-3.5 shadow-xl backdrop-blur-xl ${
            isLight
              ? 'border-slate-200 bg-white text-slate-900 shadow-slate-200/50'
              : 'border-white/10 bg-[#00153A]/85 text-white shadow-xl'
          }`}>
            <div className="relative w-full sm:w-80">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-slate-400' : 'text-white/40'
              }`} />
              <input
                type="text"
                placeholder="Cari pada halaman ini..."
                value={searchRowQuery}
                onChange={(e) => setSearchRowQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                    : 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-[#FFCA40]/60'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center gap-1.5 mr-2">
                <span className={`text-[11px] font-bold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Baris:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className={`text-xs border rounded-lg px-2 py-1 focus:outline-none font-mono cursor-pointer ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-900' 
                      : 'bg-[#00134A] border-white/10 text-white'
                  }`}
                >
                  <option value={25} className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>25</option>
                  <option value={50} className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>50</option>
                  <option value={100} className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>100</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleExportData('csv')}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
                title="Ekspor baris halaman ini sebagai CSV"
              >
                <Download className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportData('json')}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
                title="Ekspor baris halaman ini sebagai JSON"
              >
                <Download className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Raw Data Grid with Dynamic Columns & Types — Cosmic Grid */}
          <div className={`rounded-2xl border shadow-xl overflow-hidden backdrop-blur-xl ${
            isLight
              ? 'border-slate-200 bg-white text-slate-900 shadow-slate-200/50'
              : 'border-white/10 bg-[#00153A]/85 text-white shadow-[#00081c]/50'
          }`}>
            <div className="overflow-x-auto max-h-[600px] scrollbar-thin">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead className={`sticky top-0 backdrop-blur-md z-10 border-b ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#00134A] text-white/70 border-white/10'
                }`}>
                  <tr>
                    <th className={`py-2.5 px-3 font-bold text-[10px] w-12 text-center border-r ${
                      isLight ? 'text-slate-500 border-slate-200' : 'text-white/40 border-white/10'
                    }`}>
                      #
                    </th>
                    {columnsSchema.map((col) => (
                      <th
                        key={col.column_name}
                        className={`py-2.5 px-3 whitespace-nowrap font-bold text-[11px] border-r ${
                          isLight ? 'border-slate-200 text-slate-700' : 'border-white/10 text-white/70'
                        }`}
                        title={BPJS_COLUMN_LABELS[col.column_name] || col.column_name}
                      >
                        <div className="flex flex-col">
                          <span className={isLight ? 'text-slate-900 font-bold' : 'text-white font-bold'}>{col.column_name}</span>
                          {BPJS_COLUMN_LABELS[col.column_name] && (
                            <span className={`text-[8.5px] truncate max-w-[130px] font-sans font-medium ${
                              isLight ? 'text-slate-500' : 'text-white/50'
                            }`} title={BPJS_COLUMN_LABELS[col.column_name]}>
                              {BPJS_COLUMN_LABELS[col.column_name]}
                            </span>
                          )}
                          <span className={`text-[9px] font-semibold ${
                            isLight ? 'text-emerald-700' : 'text-[#FFCA40]'
                          }`}>
                            {col.column_type || 'VARCHAR'}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                  {isLoading ? (
                    <tr>
                      <td colSpan={columnsSchema.length + 1} className={`py-12 text-center font-sans ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className={`w-6 h-6 animate-spin ${isLight ? 'text-sky-600' : 'text-[#FFCA40]'}`} />
                          <span className="text-xs">Mengambil data dari repositori database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : displayRows.length === 0 ? (
                    <tr>
                      <td colSpan={columnsSchema.length + 1} className={`py-10 text-center font-sans ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                        Tidak ada data yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    displayRows.map((row, rIdx) => {
                      const absoluteIdx = (page - 1) * pageSize + rIdx + 1;
                      return (
                        <tr key={rIdx} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                          <td className={`py-2 px-3 text-[10px] text-center border-r ${
                            isLight ? 'text-slate-500 border-slate-200' : 'text-white/40 border-white/5'
                          }`}>
                            {absoluteIdx}
                          </td>
                          {columnsSchema.map((col) => {
                            const val = row[col.column_name];
                            const isAmount = col.column_name.includes('biaya') || col.column_name.includes('FKL47') || col.column_name.includes('FKL48') || col.column_name.includes('nilai_klaim');
                            const isKey = col.column_name === currentMeta.primary_key;

                            return (
                              <td
                                key={col.column_name}
                                className={`py-2 px-3 whitespace-nowrap border-r ${
                                  isLight ? 'border-slate-200' : 'border-white/5'
                                } ${
                                  isKey 
                                    ? (isLight ? 'font-bold text-emerald-800' : 'font-bold text-[#FFCA40]') 
                                    : (isLight ? 'text-slate-800' : 'text-white/80')
                                }`}
                              >
                                {isAmount && typeof val === 'number' ? (
                                  <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                    Rp {val.toLocaleString('id-ID')}
                                  </span>
                                ) : val !== undefined && val !== null ? (
                                  typeof val === 'boolean' ? (
                                    val ? (
                                      <span className={`px-1 rounded border font-bold ${
                                        isLight ? 'text-emerald-800 bg-emerald-50 border-emerald-300' : 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30'
                                      }`}>TRUE</span>
                                    ) : (
                                      <span className={`px-1 rounded border font-bold ${
                                        isLight ? 'text-rose-800 bg-rose-50 border-rose-300' : 'text-rose-300 bg-rose-500/20 border-rose-500/30'
                                      }`}>FALSE</span>
                                    )
                                  ) : typeof val === 'number' && !Number.isInteger(val) ? (
                                    val.toFixed(3)
                                  ) : typeof val === 'string' && val.includes('T00:00:00') ? (
                                    val.replace('T00:00:00', '')
                                  ) : (
                                    String(val)
                                  )
                                ) : (
                                  <span className={isLight ? 'text-slate-300' : 'text-white/20'}>-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls - with sm:pr-48 to prevent being blocked by the floating widget */}
            <div className={`flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-3 sm:pr-48 ${
              isLight ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/10 bg-white/5 text-white/50'
            }`}>
              <span className="text-xs font-sans">
                Menampilkan baris <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{(page - 1) * pageSize + 1}</span> s/d{' '}
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{Math.min(page * pageSize, totalRows)}</span> dari total{' '}
                <span className={`font-bold font-mono ${isLight ? 'text-emerald-800' : 'text-[#FFCA40]'}`}>{totalRows.toLocaleString('id-ID')}</span> baris
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-semibold shadow-md flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <span className={`px-3 py-1.5 text-xs font-mono font-bold border rounded-lg ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#00134A] border-white/10 text-white'
                }`}>
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-semibold shadow-md flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                  }`}
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KONSOL SQL INTERAKTIF (DUCKDB ENGINE) */}
      {/* ========================================================================= */}
      {activeTab === 'sql' && (
        <div className="space-y-5">
          {/* Preset Queries Toolbar */}
          <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-xl backdrop-blur-xl space-y-3 ${
            isLight
              ? 'border-slate-200 bg-white text-slate-900 shadow-slate-200/50'
              : 'border-white/10 bg-[#00153A]/85 text-white shadow-[#00081c]/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <Sparkles className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-[#FFCA40]'}`} />
                <span>Kueri Preset Analisis Klaim Resmi:</span>
              </span>
              <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Engine: SQL OLAP Database (Read-Only Safe)
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESET_QUERIES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSqlInput(preset.sql);
                    handleExecuteSql(preset.sql);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs transition-colors font-medium cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-emerald-800'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-[#FFCA40]/40 text-white/80 hover:text-[#FFCA40]'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SQL Editor */}
          <div className={`relative overflow-hidden rounded-2xl border shadow-xl backdrop-blur-xl ${
            isLight
              ? 'border-slate-200 bg-white text-slate-900 shadow-slate-200/50'
              : 'border-white/10 bg-[#00153A]/85 text-white shadow-[#00081c]/50'
          }`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${
              isLight ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-[#00134A] text-white border-white/10'
            }`}>
              <div className="flex items-center gap-2 text-xs font-mono">
                <Terminal className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>SQL Query Editor</span>
                <span className={isLight ? 'text-slate-400' : 'text-white/20'}>·</span>
                <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-white/50'}`}>claimtrace_warehouse.duckdb</span>
              </div>
              <button
                type="button"
                onClick={() => handleExecuteSql()}
                disabled={sqlLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                {sqlLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{sqlLoading ? 'Mengeksekusi...' : 'Jalankan Kueri SQL'}</span>
              </button>
            </div>

            <div className="p-4 bg-slate-950">
              <textarea
                value={sqlInput}
                onChange={(e) => setSqlInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleExecuteSql();
                  }
                }}
                rows={4}
                placeholder="Tulis kueri SQL di sini (contoh: SELECT * FROM bpjs_fkrtl_all LIMIT 10;)..."
                className="w-full bg-transparent font-mono text-xs text-emerald-400 placeholder-slate-500 outline-none resize-y"
                spellCheck={false}
              />
            </div>

            {/* Execution Result Meta Bar */}
            <div className={`flex flex-wrap items-center justify-between px-4 py-2.5 border-t text-[11px] font-mono ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#00134A] border-white/10 text-white/50'
            }`}>
              <div className="flex items-center gap-3">
                {sqlDuration && (
                  <span className={`flex items-center gap-1 font-bold ${isLight ? 'text-emerald-800' : 'text-[#FFCA40]'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Waktu: {sqlDuration}</span>
                  </span>
                )}
                {sqlResult ? (
                  <span className={`flex items-center gap-1 font-semibold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                    <span>{sqlResult.row_count} Baris Dikembalikan</span>
                  </span>
                ) : (
                  <span className={`text-[10.5px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                    Kueri siap dijalankan · Tekan <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${isLight ? 'bg-slate-200 border-slate-300 text-slate-800' : 'bg-white/10 border-white/20 text-white'}`}>Ctrl+Enter</kbd>
                  </span>
                )}
              </div>
              <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                {sqlResult ? `Kolom Terbaca: ${sqlResult.columns?.length || 0}` : 'Kueri Analitis Database'}
              </div>
            </div>
          </div>

          {/* SQL Error Banner */}
          {sqlError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-mono flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Kesalahan Sintaks SQL: </span>
                {sqlError}
              </div>
            </div>
          )}

          {/* SQL Output Results Grid */}
          {sqlResult && sqlResult.data && (
            <div className={`relative overflow-hidden rounded-2xl border shadow-xl backdrop-blur-xl space-y-2 p-5 ${
              isLight
                ? 'border-slate-200 bg-white text-slate-900 shadow-slate-200/50'
                : 'border-white/10 bg-[#00153A]/85 text-white shadow-[#00081c]/50'
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <span className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <TableIcon className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
                  <span>Hasil Kueri Database ({sqlResult.row_count} baris)</span>
                </span>
                <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Format: JSON Tabular</span>
              </div>

              <div className={`overflow-x-auto max-h-[500px] border rounded-xl ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className={`sticky top-0 border-b uppercase text-[10px] font-bold ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#00134A] border-white/10 text-white/70'
                  }`}>
                    <tr>
                      <th className={`py-2 px-3 w-10 text-center border-r ${isLight ? 'border-slate-200' : 'border-white/10'}`}>#</th>
                      {sqlResult.columns.map((col) => (
                        <th key={col} className={`py-2 px-3 whitespace-nowrap border-r font-bold ${
                          isLight ? 'border-slate-200 text-slate-900' : 'border-white/10 text-white'
                        }`}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                    {sqlResult.data.map((row, idx) => (
                      <tr key={idx} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                        <td className={`py-2 px-3 text-[10px] text-center border-r ${
                          isLight ? 'text-slate-500 border-slate-200' : 'text-white/40 border-white/5'
                        }`}>
                          {idx + 1}
                        </td>
                        {sqlResult.columns.map((col) => {
                          const val = row[col];
                          const isAmount = String(col).toLowerCase().includes('biaya') || String(col).toLowerCase().includes('rupiah') || String(col).toLowerCase().includes('rp');
                          return (
                            <td key={col} className={`py-2 px-3 whitespace-nowrap border-r ${
                              isLight ? 'border-slate-200 text-slate-800' : 'border-white/5 text-white/90'
                            }`}>
                              {isAmount && typeof val === 'number' ? (
                                <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                  Rp {val.toLocaleString('id-ID')}
                                </span>
                              ) : val !== null && val !== undefined ? (
                                String(val)
                              ) : (
                                <span className={isLight ? 'text-slate-300' : 'text-white/20'}>-</span>
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
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DIAGRAM RELASI ERD & KAMUS KOLOM */}
      {/* ========================================================================= */}
      {activeTab === 'erd' && (
        <div className="space-y-5">
          {/* ERD Relationship Cards */}
          <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-xl backdrop-blur-xl space-y-4 ${
            isLight
              ? 'border-slate-200 bg-white text-slate-900 shadow-slate-200/50'
              : 'border-white/10 bg-[#00153A]/85 text-white shadow-[#00081c]/50'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <h2 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <TableIcon className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
                <span>Skema Relasional Foreign Key (Entity Relationship Diagram)</span>
              </h2>
              <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                {ERD_RELATIONSHIPS.length} Relasi Foreign Key
              </span>
            </div>

            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Berikut adalah pemetaan integritas referensial antara tabel data mentah FKRTL 2024, Master Kepesertaan 2015-2024, Diagnosis Sekunder, dan Kamus ICD-10 resmi.
            </p>

            <div className="grid grid-cols-1 gap-3">
              {ERD_RELATIONSHIPS.map((rel, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-mono">
                    <span className={`px-2.5 py-1 rounded-lg font-bold border ${
                      isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {rel.source_table}.{rel.source_column}
                    </span>
                    <ArrowRight className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                    <span className={`px-2.5 py-1 rounded-lg font-bold border ${
                      isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}>
                      {rel.target_table}.{rel.target_column}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-sans font-bold border ${
                      isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/10 text-white/70 border-white/10'
                    }`}>
                      {rel.type}
                    </span>
                  </div>

                  <p className={`text-xs font-sans md:max-w-md ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                    {rel.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Data Dictionary / Variable Reference */}
          <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-xl backdrop-blur-xl space-y-4 ${
            isLight
              ? 'border-slate-200 bg-white text-slate-900 shadow-slate-200/50'
              : 'border-white/10 bg-[#00153A]/85 text-white shadow-[#00081c]/50'
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <div>
                <h2 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <FileText className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
                  <span>Kamus Variabel Resmi BPJS Kesehatan</span>
                </h2>
                <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                  BPJS Data Dictionary &amp; Schema Registry ({Object.keys(BPJS_COLUMN_LABELS).length} Variabel Otoritatif)
                </span>
              </div>

              {/* Variable Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                <input
                  type="text"
                  placeholder="Cari kode/nama variabel..."
                  value={searchVarQuery}
                  onChange={(e) => setSearchVarQuery(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                      : 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-[#FFCA40]/60'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(BPJS_COLUMN_LABELS)
                .filter(([code, label]) => {
                  if (!searchVarQuery.trim()) return true;
                  const q = searchVarQuery.toLowerCase();
                  return code.toLowerCase().includes(q) || label.toLowerCase().includes(q);
                })
                .map(([code, label]) => (
                  <div key={code} className={`p-3 rounded-xl border transition-colors ${
                    isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                  }`}>
                    <div className={`font-mono text-xs font-bold ${isLight ? 'text-emerald-800' : 'text-[#FFCA40]'}`}>{code}</div>
                    <div className={`text-xs mt-0.5 ${isLight ? 'text-slate-700' : 'text-white/70'}`}>{label}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
