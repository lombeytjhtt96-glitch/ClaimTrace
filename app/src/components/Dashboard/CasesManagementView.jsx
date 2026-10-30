import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  AlertCircle,
  AlertTriangle,
  Users,
  Clock,
  Filter,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Eye,
  UserCheck,
} from 'lucide-react';

const INITIAL_CASES = [
  {
    id: 'CLM-2026-884120',
    sep_no: '0114R0011026V004812',
    user_hash: 'JKN-94A8F21C09E4',
    hospital: 'RS Khusus Mitra Husada',
    severity: 'critical',
    status: 'new',
    sla_status: 'critical',
    minutes_until_breach: 95,
    summary_redacted:
      'Anomali Phantom Billing: Tindakan fisioterapi & bedah minor rawat jalan diajukan tanpa presensi biometrik Mobile JKN Lapis 3.',
    assigned_to: null,
    risk_score: 0.94,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'CLM-2026-883904',
    sep_no: '0114R0011026V004789',
    user_hash: 'JKN-73B1D80A22C1',
    hospital: 'RSU Harapan Bunda',
    severity: 'high',
    status: 'in_progress',
    sla_status: 'warning',
    minutes_until_breach: 320,
    summary_redacted:
      'Indikasi Upcoding Level III: Penambahan diagnosis sekunder Sepsis (A41.9) tanpa bukti kultur darah atau pemantauan ICU.',
    assigned_to: 'dr. Nadia Kusuma, Sp.PK',
    risk_score: 0.86,
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 50 * 60000).toISOString(),
  },
  {
    id: 'CLM-2026-883519',
    sep_no: '0114R0011026V004650',
    user_hash: 'JKN-61C9E44B10F8',
    hospital: 'RSUD Mitra Sehat',
    severity: 'med',
    status: 'in_progress',
    sla_status: 'safe',
    minutes_until_breach: 1440,
    summary_redacted:
      'Readmisi Dini < 7 Hari: Pasien dirawat kembali dalam 4 hari pasca-pulang dengan grup INA-CBG primer identik (I-4-10-II).',
    assigned_to: 'dr. Hendra Wijaya, MARS',
    risk_score: 0.72,
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'CLM-2026-883102',
    sep_no: '0114R0011026V004511',
    user_hash: 'JKN-52D4A19E88B3',
    hospital: 'RS Islam Kasih Ibu',
    severity: 'high',
    status: 'new',
    sla_status: 'breached',
    minutes_until_breach: 0,
    summary_redacted:
      'Unbundling Pemeriksaan Penunjang: Pemecahan tagihan panel laboratorium & radiologi IGD terpisah dari paket rawat inap hari ke-1.',
    assigned_to: null,
    risk_score: 0.81,
    created_at: new Date(Date.now() - 26 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'CLM-2026-882890',
    sep_no: '0114R0011026V004390',
    user_hash: 'JKN-39E0C72D51A6',
    hospital: 'RSUPN Dr. Cipto Mangunkusumo Jakarta',
    severity: 'low',
    status: 'resolved',
    sla_status: 'safe',
    minutes_until_breach: 2880,
    summary_redacted:
      'Klarifikasi Fornas Selesai: Resep obat kronis diabetes melitus telah dilengkapi protokol terapi DPJP sesuai restriksi Fornas.',
    assigned_to: 'apt. Siti Rahmawati, M.Clin.Pharm',
    risk_score: 0.34,
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'CLM-2026-882740',
    sep_no: '0114R0011026V004210',
    user_hash: 'JKN-88D1B43E29A1',
    hospital: 'RSUP Persahabatan Jakarta',
    severity: 'med',
    status: 'in_progress',
    sla_status: 'warning',
    minutes_until_breach: 180,
    summary_redacted:
      'Readmisi Dini < 7 Hari: Pasien dirawat kembali dalam 4 hari pasca-pulang dengan grup INA-CBG primer identik (I-4-10-II).',
    assigned_to: 'dr. Hendra Wijaya, MARS',
    risk_score: 0.68,
    created_at: new Date(Date.now() - 16 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'CLM-2026-882512',
    sep_no: '0114R0011026V004105',
    user_hash: 'JKN-14F9E82C31D0',
    hospital: 'RS Hermina Kemayoran Jakarta',
    severity: 'high',
    status: 'new',
    sla_status: 'critical',
    minutes_until_breach: 75,
    summary_redacted:
      'Siklus Terapi Fisioterapi Berulang: Penagihan berulang pada episode sama dalam 3 hari tanpa rujukan baru FKTP.',
    assigned_to: null,
    risk_score: 0.84,
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'CLM-2026-882190',
    sep_no: '0114R0011026V003980',
    user_hash: 'JKN-66A3D91F04B8',
    hospital: 'RSUP Dr. Sardjito Yogyakarta',
    severity: 'low',
    status: 'resolved',
    sla_status: 'safe',
    minutes_until_breach: 3200,
    summary_redacted:
      'Hemodialisa Rutin Terkonfirmasi: Jadwal terapi berkala dan log mesin hemodialisa terverifikasi di SIMRS & FRISTA.',
    assigned_to: 'dr. Nadia Kusuma, Sp.PK',
    risk_score: 0.22,
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

const QUICK_FILTERS = [
  { key: 'all', label: 'Semua Berkas', icon: Filter },
  { key: 'critical_high', label: 'Kritis / Tinggi', icon: AlertCircle },
  { key: 'unassigned', label: 'Belum Ditugaskan', icon: Users },
  { key: 'sla_risk', label: 'Risiko Batas SLA', icon: Clock },
  { key: 'new', label: 'Berkas Baru', icon: AlertTriangle },
];

const VERIFIKATOR_LIST = [
  'dr. Nadia Kusuma, Sp.PK',
  'dr. Hendra Wijaya, MARS',
  'apt. Siti Rahmawati, M.Clin.Pharm',
  'dr. Bima Santoso, Sp.PD',
];

function formatRelativeTime(iso) {
  const diffMin = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${Math.round(diffHours / 24)} hari lalu`;
}

export default function CasesManagementView({ onNavigateTab, onInspectCase, isLight: propIsLight }) {
  const [internalIsLight, setInternalIsLight] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('theme');
      if (p === 'light') return true;
      if (p === 'dark') return false;
      const root = document.getElementById('cockpit-root');
      if (root) return root.classList.contains('theme-light');
      return document.documentElement.classList.contains('light');
    }
    return false;
  });

  useEffect(() => {
    if (typeof propIsLight === 'boolean') {
      setInternalIsLight(propIsLight);
      return;
    }
    const updateTheme = () => {
      const root = document.getElementById('cockpit-root');
      if (root) setInternalIsLight(root.classList.contains('theme-light'));
      else setInternalIsLight(document.documentElement.classList.contains('light'));
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    const root = document.getElementById('cockpit-root');
    if (root) observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [propIsLight]);

  const isLight = typeof propIsLight === 'boolean' ? propIsLight : internalIsLight;

  const [cases, setCases] = useState(INITIAL_CASES);
  const [activeChip, setActiveChip] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('');
  const [slaBreachedOnly, setSlaBreachedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [selectedCase, setSelectedCase] = useState(null);

  const handleChipClick = (key) => {
    setActiveChip(key);
    setPage(1);

    if (key === 'all') {
      setStatusFilter('');
      setSeverityFilter('');
      setAssignmentFilter('');
      setSlaBreachedOnly(false);
    } else if (key === 'critical_high') {
      setStatusFilter('');
      setSeverityFilter('critical_high');
      setAssignmentFilter('');
      setSlaBreachedOnly(false);
    } else if (key === 'unassigned') {
      setStatusFilter('');
      setSeverityFilter('');
      setAssignmentFilter('unassigned');
      setSlaBreachedOnly(false);
    } else if (key === 'sla_risk') {
      setStatusFilter('');
      setSeverityFilter('');
      setAssignmentFilter('');
      setSlaBreachedOnly(true);
    } else if (key === 'new') {
      setStatusFilter('new');
      setSeverityFilter('');
      setAssignmentFilter('');
      setSlaBreachedOnly(false);
    }
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredCases = useMemo(() => {
    let list = [...cases];

    if (appliedSearch.trim()) {
      const q = appliedSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.user_hash.toLowerCase().includes(q) ||
          c.sep_no.toLowerCase().includes(q) ||
          c.summary_redacted.toLowerCase().includes(q) ||
          c.hospital.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      list = list.filter((c) => c.status === statusFilter);
    }

    if (severityFilter === 'critical_high') {
      list = list.filter((c) => c.severity === 'critical' || c.severity === 'high');
    } else if (severityFilter) {
      list = list.filter((c) => c.severity === severityFilter);
    }

    if (assignmentFilter === 'unassigned') {
      list = list.filter((c) => !c.assigned_to);
    } else if (assignmentFilter === 'assigned') {
      list = list.filter((c) => Boolean(c.assigned_to));
    }

    if (slaBreachedOnly) {
      list = list.filter((c) => c.sla_status === 'breached' || c.sla_status === 'critical');
    }

    const severityRank = { critical: 4, high: 3, med: 2, low: 1 };
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'severity') {
        cmp = (severityRank[a.severity] || 0) - (severityRank[b.severity] || 0);
      } else if (sortBy === 'updated_at') {
        cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      } else {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [
    cases,
    appliedSearch,
    statusFilter,
    severityFilter,
    assignmentFilter,
    slaBreachedOnly,
    sortBy,
    sortOrder,
  ]);

  const pageCritical = cases.filter((c) => c.severity === 'critical').length;
  const pageHigh = cases.filter((c) => c.severity === 'high').length;
  const pageUnassigned = cases.filter((c) => !c.assigned_to).length;
  const pageSlaBreached = cases.filter((c) => c.sla_status === 'breached').length;

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          label: 'Kritis',
          cls: isLight
            ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
            : 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold',
        };
      case 'high':
        return {
          label: 'Tinggi',
          cls: isLight
            ? 'bg-orange-50 text-orange-700 border-orange-300 font-bold'
            : 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold',
        };
      case 'med':
        return {
          label: 'Sedang',
          cls: isLight
            ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
            : 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold',
        };
      default:
        return {
          label: 'Rendah',
          cls: isLight
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold',
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return { 
          label: 'Baru', 
          cls: isLight 
            ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold' 
            : 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
        };
      case 'in_progress':
        return { 
          label: 'Sedang Diaudit', 
          cls: isLight 
            ? 'bg-purple-50 text-purple-700 border-purple-300 font-bold' 
            : 'bg-purple-500/20 text-purple-300 border-purple-500/40' 
        };
      case 'resolved':
        return { 
          label: 'Selesai', 
          cls: isLight 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' 
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
        };
      default:
        return { 
          label: 'Ditutup', 
          cls: isLight 
            ? 'bg-slate-100 text-slate-700 border-slate-300' 
            : 'bg-white/10 text-white/60 border-white/10' 
        };
    }
  };

  const getSLAIndicator = (slaStatus, minutesUntil) => {
    if (slaStatus === 'breached') {
      return (
        <div className="flex items-center gap-2" title="Melewati batas SLA!">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
          <span className="text-xs font-bold text-rose-600">Lewat SLA</span>
        </div>
      );
    }
    if (slaStatus === 'critical') {
      return (
        <div className="flex items-center gap-2" title={`${minutesUntil} menit menuju batas SLA`}>
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-xs" />
          <span className="text-xs font-bold text-rose-600">{minutesUntil}m</span>
        </div>
      );
    }
    if (slaStatus === 'warning') {
      return (
        <div className="flex items-center gap-2" title="Mendekati batas SLA">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
          <span className={`text-xs font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>Waspada</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2" title="Sesuai SLA 10 Hari Kerja">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-xs" />
        <span className={`text-xs font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>Aman</span>
      </div>
    );
  };

  return (
    <div className={`space-y-4 pb-16 sm:pb-20 ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* Compact Header */}
      <div className={`rounded-2xl p-5 border ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#00153A]/85 backdrop-blur-xl border-white/10 text-white shadow-xl shadow-[#00081c]/50'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <div className={`p-2 rounded-xl border shadow-xs ${
                isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-gradient-to-tr from-[#00134A] to-[#001D58] border-[#FFCA40]/30 text-[#FFCA40] shadow-[#FFCA40]/10'
              }`}>
                <Shield className="w-5 h-5" />
              </div>
              <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Berkas Klaim (Cases)
              </h1>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-blue-500/20 border-blue-500/30 text-blue-300'
              }`}>
                {filteredCases.length} total
              </span>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-white/10 text-white/80 border-white/10'
              }`}>
                MITRE F3: FA0002.F1018 · FA0001 · ATT&amp;CK: T1078
              </span>
            </div>
            <p className={`text-xs ml-12 ${isLight ? 'text-slate-600 font-medium' : 'text-white/60'}`}>
              Pantau dan kelola berkas klaim FKRTL berisiko dengan pelacakan SLA 10 Hari Kerja secara real-time terklasifikasi menurut taksonomi MITRE Fight Fraud Framework (F3).
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab?.('quick_triage')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs ${
              isLight
                ? 'border border-emerald-600 bg-white text-emerald-700 hover:bg-emerald-50'
                : 'bg-gradient-to-tr from-health-blue-dark to-health-blue hover:from-health-blue hover:to-health-blue-light border border-[#FFCA40]/40 text-[#FFCA40]'
            }`}
          >
            Triase Cepat
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Compact Summary Bar */}
        <div className="flex flex-wrap items-center gap-6 mt-4 ml-12 text-xs">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="text-rose-500 w-4 h-4" />
            <span className={isLight ? 'text-slate-600 font-medium' : 'text-white/60'}>Kritis:</span>
            <span className="text-rose-600 font-bold">{pageCritical}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="text-orange-500 w-4 h-4" />
            <span className={isLight ? 'text-slate-600 font-medium' : 'text-white/60'}>Tinggi:</span>
            <span className="text-orange-600 font-bold">{pageHigh}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="text-purple-500 w-4 h-4" />
            <span className={isLight ? 'text-slate-600 font-medium' : 'text-white/60'}>Belum Ditugaskan:</span>
            <span className="text-purple-600 font-bold">{pageUnassigned}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="text-rose-500 w-4 h-4" />
            <span className={isLight ? 'text-slate-600 font-medium' : 'text-white/60'}>Melewati SLA:</span>
            <span className="text-rose-600 font-bold">{pageSlaBreached}</span>
          </div>
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {QUICK_FILTERS.map((chip) => {
          const Icon = chip.icon;
          const active = activeChip === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => handleChipClick(chip.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                active
                  ? (isLight
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-gradient-to-r from-health-blue-dark to-health-blue border-[#FFCA40]/50 text-[#FFCA40] shadow-md shadow-[#00081c]/50')
                  : (isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white')
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Filter & Search Cases Card */}
      <div className={`rounded-2xl p-6 space-y-4 border ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#00153A]/85 backdrop-blur-xl border-white/10 text-white shadow-xl shadow-[#00081c]/50'
      }`}>
        <h2 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          <Search className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
          Filter &amp; Cari Berkas Klaim
        </h2>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAppliedSearch(searchInput);
            setPage(1);
          }}
          className="flex gap-3"
        >
          <div className="flex-1 relative">
            <input aria-label="Bidang input data"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari berdasarkan Hash Peserta, Nomor SEP, FKRTL, atau ringkasan temuan..."
              className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none ${
                isLight
                  ? 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                  : 'bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#FFCA40]/60 focus:ring-1 focus:ring-[#FFCA40]/60'
              }`}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setAppliedSearch('');
                }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition ${
                  isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className={`px-6 py-2.5 font-bold rounded-xl shadow-xs text-sm cursor-pointer transition-all ${
              isLight
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-gradient-to-tr from-health-blue-dark to-health-blue hover:from-health-blue hover:to-health-blue-light border border-[#FFCA40]/40 text-white shadow-[#00081c]/50'
            }`}
          >
            Cari
          </button>
        </form>

        {/* 5 Filter Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className={`block text-xs mb-1.5 font-bold uppercase tracking-wide ${
              isLight ? 'text-slate-700' : 'text-white/60'
            }`}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setActiveChip('all');
                setStatusFilter(e.target.value);
              }}
              className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none cursor-pointer ${
                isLight
                  ? 'bg-white border border-slate-300 text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                  : 'bg-[#00134A] border border-white/10 text-white focus:border-[#FFCA40]/60'
              }`}
            >
              <option value="">Semua Status</option>
              <option value="new">Baru (New)</option>
              <option value="in_progress">Sedang Diaudit</option>
              <option value="resolved">Selesai (Resolved)</option>
              <option value="closed">Ditutup (Closed)</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs mb-1.5 font-bold uppercase tracking-wide ${
              isLight ? 'text-slate-700' : 'text-white/60'
            }`}>
              Tingkat Risiko
            </label>
            <select
              value={severityFilter}
              onChange={(e) => {
                setActiveChip('all');
                setSeverityFilter(e.target.value);
              }}
              className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none cursor-pointer ${
                isLight
                  ? 'bg-white border border-slate-300 text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                  : 'bg-[#00134A] border border-white/10 text-white focus:border-[#FFCA40]/60'
              }`}
            >
              <option value="">Semua Tingkat Risiko</option>
              <option value="low">Rendah (Low)</option>
              <option value="med">Sedang (Medium)</option>
              <option value="high">Tinggi (High)</option>
              <option value="critical">Kritis (Critical)</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs mb-1.5 font-bold uppercase tracking-wide ${
              isLight ? 'text-slate-700' : 'text-white/60'
            }`}>
              Penugasan Verifikator
            </label>
            <select
              value={assignmentFilter}
              onChange={(e) => {
                setActiveChip('all');
                setAssignmentFilter(e.target.value);
              }}
              className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none cursor-pointer ${
                isLight
                  ? 'bg-white border border-slate-300 text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                  : 'bg-[#00134A] border border-white/10 text-white focus:border-[#FFCA40]/60'
              }`}
            >
              <option value="">Semua Penugasan</option>
              <option value="unassigned">Belum Ditugaskan</option>
              <option value="assigned">Sudah Ditugaskan</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs mb-1.5 font-bold uppercase tracking-wide ${
              isLight ? 'text-slate-700' : 'text-white/60'
            }`}>
              Status SLA
            </label>
            <label className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors h-[38px] border ${
              isLight
                ? 'bg-white border-slate-300 hover:bg-slate-50'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}>
              <input aria-label="Kotak centang opsi"
                type="checkbox"
                checked={slaBreachedOnly}
                onChange={(e) => {
                  setActiveChip('all');
                  setSlaBreachedOnly(e.target.checked);
                }}
                className={`rounded ${
                  isLight 
                    ? 'border-slate-300 text-emerald-600 focus:ring-emerald-500/30' 
                    : 'border-white/20 bg-white/10 text-[#FFCA40] focus:ring-[#FFCA40]/40'
                }`}
              />
              <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>Risiko / Lewat SLA</span>
            </label>
          </div>

          <div>
            <label className={`block text-xs mb-1.5 font-bold uppercase tracking-wide ${
              isLight ? 'text-slate-700' : 'text-white/60'
            }`}>
              Per Halaman
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none cursor-pointer ${
                isLight
                  ? 'bg-white border border-slate-300 text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                  : 'bg-[#00134A] border border-white/10 text-white focus:border-[#FFCA40]/60'
              }`}
            >
              <option value={10}>10 berkas</option>
              <option value={20}>20 berkas</option>
              <option value={50}>50 berkas</option>
              <option value={100}>100 berkas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Berkas Klaim */}
      <div className={`rounded-2xl overflow-hidden border ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm'
          : 'bg-[#00153A]/85 backdrop-blur-xl border-white/10 shadow-xl shadow-[#00081c]/50'
      }`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className={`border-b ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/70'
            }`}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  SLA
                </th>
                <th
                  onClick={() => handleSortChange('severity')}
                  className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1">
                    <span>Tingkat Risiko</span>
                    {sortBy === 'severity' ? (
                      sortOrder === 'asc' ? (
                        <ChevronUp className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
                      ) : (
                        <ChevronDown className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
                      )
                    ) : (
                      <span className={isLight ? 'text-slate-400' : 'text-white/30'}>↕</span>
                    )}
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  Hash Peserta / SEP
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  Ringkasan Temuan Audit
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  Ditugaskan Ke
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  Skor Risiko
                </th>
                <th
                  onClick={() => handleSortChange('created_at')}
                  className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1">
                    <span>Diajukan</span>
                    {sortBy === 'created_at' ? (
                      sortOrder === 'asc' ? (
                        <ChevronUp className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
                      ) : (
                        <ChevronDown className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
                      )
                    ) : (
                      <span className={isLight ? 'text-slate-400' : 'text-white/30'}>↕</span>
                    )}
                  </span>
                </th>
                <th
                  onClick={() => handleSortChange('updated_at')}
                  className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1">
                    <span>Diperbarui</span>
                    {sortBy === 'updated_at' ? (
                      sortOrder === 'asc' ? (
                        <ChevronUp className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
                      ) : (
                        <ChevronDown className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
                      )
                    ) : (
                      <span className={isLight ? 'text-slate-400' : 'text-white/30'}>↕</span>
                    )}
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isLight ? 'divide-slate-200 text-slate-800' : 'divide-white/5 text-white'
            }`}>
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center">
                    <p className={`text-base font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      Tidak ada berkas klaim yang ditemukan
                    </p>
                    <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                      Coba sesuaikan filter pencarian atau kriteria status di atas
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCases.slice(0, pageSize).map((item) => {
                  const sev = getSeverityBadge(item.severity);
                  const st = getStatusBadge(item.status);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedCase(item)}
                      className={`cursor-pointer transition-colors ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'
                      }`}
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getSLAIndicator(item.sla_status, item.minutes_until_breach)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full border ${sev.cls}`}
                        >
                          {sev.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full border ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className={`text-xs font-mono font-bold ${
                          isLight ? 'text-slate-900' : 'text-[#FFCA40]'
                        }`}>
                          {item.user_hash}
                        </div>
                        <div className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{item.hospital}</div>
                      </td>
                      <td className={`px-4 py-3.5 text-xs max-w-xs truncate ${
                        isLight ? 'text-slate-700' : 'text-white/80'
                      }`}>
                        {item.summary_redacted}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        {item.assigned_to ? (
                          <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white/90'}`}>{item.assigned_to}</span>
                        ) : (
                          <span className={`italic ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Belum ditugaskan</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        <span
                          className={`font-bold ${
                            item.risk_score >= 0.8
                              ? (isLight ? 'text-rose-700' : 'text-rose-400')
                              : item.risk_score >= 0.6
                              ? (isLight ? 'text-amber-700' : 'text-amber-400')
                              : (isLight ? 'text-emerald-700' : 'text-emerald-400')
                          }`}
                        >
                          {(item.risk_score * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className={`px-4 py-3.5 whitespace-nowrap text-xs ${
                        isLight ? 'text-slate-500' : 'text-white/60'
                      }`}>
                        {formatRelativeTime(item.created_at)}
                      </td>
                      <td className={`px-4 py-3.5 whitespace-nowrap text-xs ${
                        isLight ? 'text-slate-500' : 'text-white/60'
                      }`}>
                        {formatRelativeTime(item.updated_at)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCase(item);
                          }}
                          className={`font-bold hover:underline cursor-pointer ${
                            isLight ? 'text-emerald-700 hover:text-emerald-900' : 'text-[#FFCA40] hover:text-[#FFE08C]'
                          }`}
                        >
                          Lihat Rincian
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className={`px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t text-xs ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-700'
            : 'bg-white/5 border-white/10 text-white/70'
        }`}>
          <div>
            Menampilkan{' '}
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {filteredCases.length === 0 ? 0 : 1}
            </span>{' '}
            hingga{' '}
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {Math.min(pageSize, filteredCases.length)}
            </span>{' '}
            dari <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{filteredCases.length}</span> berkas
            klaim
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition ${
                isLight
                  ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              Sebelumnya
            </button>
            <div className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs ${
              isLight
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-health-blue-dark to-health-blue border border-[#FFCA40]/40 text-[#FFCA40]'
            }`}>
              Halaman {page}
            </div>
            <button
              type="button"
              disabled={filteredCases.length <= pageSize}
              onClick={() => setPage((p) => p + 1)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition ${
                isLight
                  ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Modal Rincian & Penugasan Berkas Klaim */}
      {selectedCase && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedCase(null)}
        >
          <div
            className={`border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#00153A] border-white/20 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-start justify-between border-b pb-4 ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <div>
                <span className={`text-xs font-mono font-bold ${
                  isLight ? 'text-emerald-700' : 'text-[#FFCA40]'
                }`}>
                  {selectedCase.id} · {selectedCase.sep_no}
                </span>
                <h3 className={`text-lg font-bold mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {selectedCase.hospital}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`p-4 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white'
              }`}>
                <p className={`font-bold uppercase tracking-wide text-[11px] mb-1 ${
                  isLight ? 'text-emerald-700' : 'text-[#FFCA40]'
                }`}>
                  Ringkasan Temuan Anomali
                </p>
                <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-white/80'}`}>
                  {selectedCase.summary_redacted}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-white/60'}`}>
                    Ubah Status Audit
                  </label>
                  <select
                    value={selectedCase.status}
                    onChange={(e) => {
                      const nextStatus = e.target.value;
                      setCases((prev) =>
                        prev.map((c) =>
                          c.id === selectedCase.id ? { ...c, status: nextStatus } : c
                        )
                      );
                      setSelectedCase((prev) => ({ ...prev, status: nextStatus }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                        : 'bg-[#00134A] border-white/10 text-white'
                    }`}
                  >
                    <option value="new">Baru (New)</option>
                    <option value="in_progress">Sedang Diaudit</option>
                    <option value="resolved">Selesai (Resolved)</option>
                    <option value="closed">Ditutup (Closed)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-white/60'}`}>
                    Tugaskan Verifikator Medis
                  </label>
                  <select
                    value={selectedCase.assigned_to || ''}
                    onChange={(e) => {
                      const nextAssignee = e.target.value || null;
                      setCases((prev) =>
                        prev.map((c) =>
                          c.id === selectedCase.id ? { ...c, assigned_to: nextAssignee } : c
                        )
                      );
                      setSelectedCase((prev) => ({ ...prev, assigned_to: nextAssignee }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                        : 'bg-[#00134A] border-white/10 text-white'
                    }`}
                  >
                    <option value="">-- Belum Ditugaskan --</option>
                    {VERIFIKATOR_LIST.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={`flex items-center justify-end gap-2 pt-3 border-t ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  isLight
                    ? 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = selectedCase.id;
                  setSelectedCase(null);
                  onInspectCase?.(id);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs ${
                  isLight
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-gradient-to-tr from-health-blue-dark to-health-blue hover:from-health-blue hover:to-health-blue-light border border-[#FFCA40]/40 text-[#FFCA40]'
                }`}
              >
                Buka Matriks Bukti 3 Lapis →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
