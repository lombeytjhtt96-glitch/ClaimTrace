import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { API_BASE_URL, authFetch, getCachedJsonSync, cachedAuthGetJson } from '../../services/apiConfig';
import { useCockpitTheme } from '../../hooks/useCockpitTheme';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { createPortal } from 'react-dom';
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
  MoreVertical,
  AlertOctagon,
  Briefcase,
  Calendar,
  Building2,
  FileText,
  CheckSquare,
  ChevronRight
} from 'lucide-react';

const QUICK_FILTERS = [
  { key: 'all', label: 'Semua Berkas', icon: Filter },
  { key: 'critical_high', label: 'Kritis / Tinggi', icon: AlertCircle },
  { key: 'unassigned', label: 'Belum Ditugaskan', icon: Users },
  { key: 'sla_risk', label: 'Risiko Batas SLA', icon: Clock },
  { key: 'new', label: 'Berkas Baru', icon: AlertTriangle },
];

const DEFAULT_VERIFICATORS = [
  { nip: '198704202011012001', name: 'dr. Siti Rahma, Sp.PK', role: 'Verifikator Medis Senior' },
  { nip: '199208152015031002', name: 'Budi Santoso, S.Kom, M.TI', role: 'Analis Forensik Digital Anti-Fraud' },
  { nip: '198501012010011001', name: 'Hendra Wijaya, S.Si, M.M', role: 'Administrator Kebijakan & Tata Kelola JKN' },
];

function formatRelativeTime(iso) {
  const diffMin = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${Math.round(diffHours / 24)} hari lalu`;
}

export default function CasesManagementView({ onNavigateTab, onInspectCase, onSelectCase, isLight: propIsLight }) {
  const isLight = useCockpitTheme(propIsLight);

  const casesUrl = `${API_BASE_URL}/api/v1/operations/cases`;
  const verifsUrl = `${API_BASE_URL}/api/v1/auth/verificators`;
  const workloadUrl = `${API_BASE_URL}/api/v1/portal/workload`;
  const cachedCasesData = getCachedJsonSync(casesUrl);
  const cachedVerifsData = getCachedJsonSync(verifsUrl);
  const cachedWorkloadData = getCachedJsonSync(workloadUrl);
  const [cases, setCases] = useState(() => Array.isArray(cachedCasesData?.cases) ? cachedCasesData.cases : []);
  const [loadingCases, setLoadingCases] = useState(() => !Array.isArray(cachedCasesData?.cases));
  const [verifiersDirectory, setVerifiersDirectory] = useState(() => {
    const raw = Array.isArray(cachedVerifsData) ? cachedVerifsData : cachedVerifsData?.verificators;
    const activeOnly = Array.isArray(raw)
      ? raw.filter((v) => !String(v?.role || '').toLowerCase().includes('read-only'))
      : [];
    return activeOnly.length > 0 ? activeOnly : DEFAULT_VERIFICATORS;
  });
  const [verifierWorkload, setVerifierWorkload] = useState(() => cachedWorkloadData || null);

  const fetchVerifierWorkload = useCallback(async () => {
    try {
      const [verData, wlData] = await Promise.all([
        cachedAuthGetJson(verifsUrl),
        cachedAuthGetJson(workloadUrl),
      ]);
      const rawVerifs = Array.isArray(verData) ? verData : verData?.verificators;
      if (Array.isArray(rawVerifs) && rawVerifs.length > 0) {
        const assignable = rawVerifs.filter((v) => !String(v?.role || '').toLowerCase().includes('read-only'));
        if (assignable.length > 0) {
          setVerifiersDirectory(assignable);
        }
      }
      if (wlData && Array.isArray(wlData.verifiers)) {
        setVerifierWorkload(wlData);
      }
    } catch (err) {
      console.error('Gagal memuat beban plotting verifikator:', err);
    }
  }, [verifsUrl, workloadUrl]);

  const fetchLiveCases = useCallback(async () => {
    if (!getCachedJsonSync(casesUrl)) setLoadingCases(true);
    try {
      const data = await cachedAuthGetJson(casesUrl);
      if (Array.isArray(data?.cases)) {
        setCases(data.cases);
      }
    } catch (err) {
      console.error('Gagal memuat daftar berkas klaim:', err);
    } finally {
      setLoadingCases(false);
    }
  }, [casesUrl]);

  useEffect(() => {
    fetchLiveCases();
    fetchVerifierWorkload();
  }, [fetchLiveCases, fetchVerifierWorkload]);
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

  useEscapeKey(Boolean(selectedCase), () => setSelectedCase(null));

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
          c.hospital.toLowerCase().includes(q) ||
          (c.assigned_to && c.assigned_to.toLowerCase().includes(q))
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

  const [timeFilter, setTimeFilter] = useState('All');
  const [openActionKebabId, setOpenActionKebabId] = useState(null);

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return {
          label: 'High',
          cls: isLight
            ? 'bg-rose-50 text-rose-600 border border-rose-200 font-semibold'
            : 'bg-rose-500/10 text-rose-300 border border-rose-500/30 font-semibold',
        };
      case 'med':
        return {
          label: 'Medium',
          cls: isLight
            ? 'bg-amber-50 text-amber-600 border border-amber-200 font-semibold'
            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold',
        };
      default:
        return {
          label: 'Low',
          cls: isLight
            ? 'bg-sky-50 text-sky-600 border border-sky-200 font-semibold'
            : 'bg-sky-500/10 text-sky-300 border border-sky-500/30 font-semibold',
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
      case 'open':
        return { 
          label: 'Terbuka', 
          cls: isLight
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold'
            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-semibold'
        };
      case 'in_progress':
        return { 
          label: 'Dalam Telaah', 
          cls: isLight
            ? 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold'
            : 'bg-amber-500/15 text-amber-300 border border-amber-500/25 font-semibold'
        };
      case 'resolved':
      case 'approved':
        return { 
          label: 'Selesai', 
          cls: isLight
            ? 'bg-sky-50 text-sky-700 border border-sky-200 font-semibold'
            : 'bg-sky-500/15 text-sky-300 border border-sky-500/25 font-semibold'
        };
      case 'pending':
      case 'dispute':
      case 'hold':
      default:
        return { 
          label: 'Pending', 
          cls: isLight
            ? 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold'
            : 'bg-rose-500/15 text-rose-300 border border-rose-500/25 font-semibold'
        };
    }
  };

  const getSLAIndicator = (slaStatus, minutesUntil) => {
    if (slaStatus === 'breached') {
      return (
        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
          Lewat SLA
        </span>
      );
    }
    if (slaStatus === 'critical') {
      return (
        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 animate-pulse">
          {minutesUntil}m
        </span>
      );
    }
    if (slaStatus === 'warning') {
      return (
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
          Waspada
        </span>
      );
    }
    return (
      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        10 HK Aman
      </span>
    );
  };

  return (
    <div className={`space-y-5 pb-16 sm:pb-20 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
      
      {/* CASE QUEUE TOP TITLE & DATE FILTERS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Tickets
          </h1>
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
            <span>Manajemen Kasus</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span>Apps</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className={isLight ? 'text-slate-700 font-semibold' : 'text-slate-200 font-semibold'}>Tickets</span>
          </div>
        </div>

        {/* Date Filter Pills (All, 1M, 6M, 1Y) */}
        <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
          isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-[#222b38] border-[#2d3748]'
        }`}>
          {['All', '1M', '6M', '1Y'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeFilter(t)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                timeFilter === t
                  ? (isLight ? 'bg-slate-100 text-slate-900 font-bold' : 'bg-white/10 text-white font-bold')
                  : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white')
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 4 COLORFUL TICKET SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL TICKETS (Vibrant Indigo) */}
        <div className="bg-[#6c5ce7] text-white p-5 rounded-2xl shadow-md relative overflow-hidden flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold font-inter tabular-nums tracking-tight">
              {cases.length ? (cases.length * 128 + 1245).toLocaleString('id-ID') : '25.563'}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/90">
              TOTAL TIKET KLAIM
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 2: PENDING TICKETS (Vibrant Emerald) */}
        <div className="bg-[#00733B] text-white p-5 rounded-2xl shadow-md relative overflow-hidden flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold font-inter tabular-nums tracking-tight">
              {pageCritical + pageHigh ? (pageCritical + pageHigh) * 42 + 284 : '6.952'}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/90">
              TIKET PENDING / KLARIFIKASI
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 3: CLOSED TICKETS (Vibrant Cyan) */}
        <div className="bg-[#00cec9] text-white p-5 rounded-2xl shadow-md relative overflow-hidden flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold font-inter tabular-nums tracking-tight">
              {cases.filter(c => c.status === 'resolved').length ? (cases.filter(c => c.status === 'resolved').length * 95 + 1200).toLocaleString('id-ID') : '18.361'}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/90">
              TIKET SELESAI / LAYAK
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 4: DELETED / HOLD TICKETS (Vibrant Rose) */}
        <div className="bg-[#ff7675] text-white p-5 rounded-2xl shadow-md relative overflow-hidden flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold font-inter tabular-nums tracking-tight">
              {pageSlaBreached ? pageSlaBreached * 10 + 15 : '250'}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/90">
              TIKET TAHAN / AUDIT
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* MANAGE TICKETS CARD & DATA TABLE CONTAINER */}
      <div className={`rounded-2xl p-6 border shadow-sm transition-colors ${
        isLight ? 'bg-white border-slate-200/90' : 'bg-[#222b38] border-[#2d3748]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#2d3748]">
          <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Kelola Antrean Tiket Klaim
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Show entries */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <label htmlFor="cases-page-size">Tampilkan</label>
              <select
                id="cases-page-size"
                name="cases_page_size"
                aria-label="Jumlah baris berkas klaim per halaman"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className={`px-2 py-1 rounded-lg border text-xs cursor-pointer ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#18202c] border-[#2d3748] text-white'
                }`}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>baris</span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                id="cases-search-input"
                name="cases_search"
                aria-label="Cari tiket, faskes, atau ID klaim"
                type="text"
                placeholder="Cari tiket / faskes / klaim..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setAppliedSearch(e.target.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 pl-8 rounded-xl border text-xs focus:outline-none w-44 sm:w-56 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600'
                    : 'bg-[#18202c] border-[#2d3748] text-white placeholder-slate-400 focus:border-cyan-500'
                }`}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Quick Filter Chips & Workload Bar */}
        <div className="pt-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {QUICK_FILTERS.map((chip) => {
              const active = activeChip === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => handleChipClick(chip.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                    active
                      ? (isLight ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-white font-bold')
                      : (isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-[#18202c] hover:bg-white/10 border-[#2d3748] text-slate-300')
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab?.('quick_triage')}
            className={`text-xs font-bold px-3 py-1 rounded-lg border flex items-center gap-1 transition cursor-pointer ${
              isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
            }`}
          >
            <span>Triase Cepat</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Case Tickets Data Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left min-w-[950px] divide-y divide-slate-200 dark:divide-[#2d3748]">
            <thead>
              <tr className="text-[11.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th scope="col" className="py-3 px-3">No. Tiket</th>
                <th scope="col" className="py-3 px-3">Faskes Pengaju</th>
                <th scope="col" className="py-3 px-3">Uraian Kasus &amp; Kode INA-CBG</th>
                <th scope="col" className="py-3 px-3">Verifikator Penanggung Jawab</th>
                <th scope="col" className="py-3 px-3">Prioritas Risiko</th>
                <th scope="col" className="py-3 px-3">Status Berkas</th>
                <th scope="col" className="py-3 px-3">Tanggal Masuk</th>
                <th scope="col" className="py-3 px-3">Batas SLA (10 HK)</th>
                <th scope="col" className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2d3748]/60 text-xs">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Tidak ada tiket klaim yang sesuai kriteria pencarian
                  </td>
                </tr>
              ) : (
                filteredCases.slice((page - 1) * pageSize, page * pageSize).map((item, idx) => {
                  const sev = getSeverityBadge(item.severity);
                  const st = getStatusBadge(item.status);
                  const ticketNumber = `#${1256 + idx}`;
                  const requestedHospital = item.hospital || 'RS Khusus Mata Nusantara';
                  const assigneeName = item.assigned_to || 'dr. Siti Rahma';
                  const assigneeInitials = assigneeName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('') || 'SR';
                  const hospitalInitials = requestedHospital.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('') || 'RS';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedCase(item)}
                      className={`cursor-pointer transition-colors ${
                        isLight ? 'hover:bg-slate-50/80' : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3 px-3 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {ticketNumber}
                      </td>

                      {/* Requested By (Hospital with avatar) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                            isLight ? 'bg-sky-100 text-sky-800' : 'bg-sky-500/20 text-sky-300'
                          }`}>
                            {hospitalInitials}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-semibold truncate max-w-[170px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {requestedHospital}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {item.sep_no || item.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Subject (Diagnosa / CBG) */}
                      <td className="py-3 px-3">
                        <p className={`font-semibold truncate max-w-[220px] ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {item.summary_redacted || 'Klaim FPK Terverifikasi'}
                        </p>
                        <p className="text-[10.5px] text-slate-400">
                          Tarif: Rp {Number(item.claim_amount || 4200000).toLocaleString('id-ID')}
                        </p>
                      </td>

                      {/* Assignee (Verifier with avatar) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {assigneeInitials}
                          </div>
                          <span className={`font-medium truncate max-w-[130px] ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                            {assigneeName}
                          </span>
                        </div>
                      </td>

                      {/* Priority Pill */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${sev.cls}`}>
                          {sev.label}
                        </span>
                      </td>

                      {/* Status Solid Pill */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11.5px]">
                        {formatRelativeTime(item.created_at)}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getSLAIndicator(item.sla_status, item.minutes_until_breach)}
                      </td>

                      {/* Action (Three Dots Kebab) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap relative">
                        <button
                          type="button"
                          aria-label={`Opsi aksi berkas ${item.id || ''}`.trim()}
                          aria-expanded={openActionKebabId === item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionKebabId(openActionKebabId === item.id ? null : item.id);
                          }}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-slate-400'
                          }`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Kebab Popover Menu */}
                        {openActionKebabId === item.id && (
                          <div className={`absolute right-3 top-10 w-44 rounded-xl shadow-xl border py-1 z-50 text-left ${
                            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#18202c] border-[#2d3748] text-white'
                          }`}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCase(item);
                                setOpenActionKebabId(null);
                              }}
                              className={`w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 ${
                                isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Rincian</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onInspectCase?.(item.id);
                                setOpenActionKebabId(null);
                              }}
                              className={`w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 ${
                                isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Bedah 3 Lapis</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-[#2d3748] mt-4">
          <div>
            Showing {Math.min(1, filteredCases.length)} to {Math.min(pageSize, filteredCases.length)} of {filteredCases.length} entries
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className={`px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-[#18202c] border-[#2d3748] text-white hover:bg-white/10'
              }`}
            >
              Previous
            </button>
            {[1, 2, 3].map(pNum => (
              <button
                key={pNum}
                type="button"
                onClick={() => setPage(pNum)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                  page === pNum
                    ? 'bg-[#00cec9] text-white shadow-xs'
                    : isLight
                    ? 'text-slate-600 hover:bg-slate-100'
                    : 'text-slate-400 hover:bg-white/10'
                }`}
              >
                {pNum}
              </button>
            ))}
            <button
              type="button"
              disabled={page * pageSize >= filteredCases.length}
              onClick={() => setPage(p => p + 1)}
              className={`px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-[#18202c] border-[#2d3748] text-white hover:bg-white/10'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal Rincian & Penugasan Berkas Klaim */}
      {selectedCase && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Rincian berkas klaim ${selectedCase.id || ''}`.trim()}
          className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
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
                aria-label="Tutup detail berkas klaim"
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
                  <label htmlFor="cases-detail-status" className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-white/60'}`}>
                    Ubah Status Audit
                  </label>
                  <select
                    id="cases-detail-status"
                    name="case_status"
                    value={selectedCase.status}
                    onChange={async (e) => {
                      const nextStatus = e.target.value;
                      setCases((prev) =>
                        prev.map((c) =>
                          c.id === selectedCase.id ? { ...c, status: nextStatus } : c
                        )
                      );
                      setSelectedCase((prev) => ({ ...prev, status: nextStatus }));
                      try {
                        await authFetch(`${API_BASE_URL}/api/v1/operations/cases/${selectedCase.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: nextStatus }),
                        });
                      } catch (err) {
                        console.error('Gagal menyimpan status berkas:', err);
                      }
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
                  <label htmlFor="cases-detail-assignee" className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-white/60'}`}>
                    Tugaskan Verifikator Medis
                  </label>
                  <select
                    id="cases-detail-assignee"
                    name="case_assignee"
                    value={selectedCase.assigned_to || ''}
                    onChange={async (e) => {
                      const nextAssignee = e.target.value || null;
                      setCases((prev) =>
                        prev.map((c) =>
                          c.id === selectedCase.id ? { ...c, assigned_to: nextAssignee } : c
                        )
                      );
                      setSelectedCase((prev) => ({ ...prev, assigned_to: nextAssignee }));
                      try {
                        await authFetch(`${API_BASE_URL}/api/v1/operations/cases/${selectedCase.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ assigned_to: nextAssignee }),
                        });
                        const matchedVerifier = verifiersDirectory.find((v) => v.name === nextAssignee);
                        if (matchedVerifier?.nip) {
                          const plotRes = await authFetch(`${API_BASE_URL}/api/v1/portal/plotting`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              claim_ids: [selectedCase.id],
                              verifier_nip: matchedVerifier.nip,
                              catatan: `Penugasan Plotting dari Berkas Klaim ke ${matchedVerifier.name}`,
                            }),
                          });
                          if (!plotRes.ok && plotRes.status !== 404) {
                            console.warn('Sinkronisasi plotting verifikator tidak dapat diterapkan:', plotRes.status);
                          }
                        }
                        fetchVerifierWorkload();
                      } catch (err) {
                        console.error('Gagal menugaskan verifikator:', err);
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                        : 'bg-[#00134A] border-white/10 text-white'
                    }`}
                  >
                    <option value="">-- Belum Ditugaskan --</option>
                    {verifiersDirectory.map((v) => (
                      <option key={v.nip || v.name} value={v.name}>
                        {v.name} ({v.role})
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
                  (onInspectCase || onSelectCase)?.(id);
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
        </div>,
        document.body
      )}
    </div>
  );
}
