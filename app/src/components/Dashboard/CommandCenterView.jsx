import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  BarChart2,
  AlertTriangle,
  ShieldAlert,
  Phone,
  Mail,
  ExternalLink,
  ChevronDown,
  Building2,
  UserCheck,
  CheckCircle,
  XCircle,
  Eye,
  X,
  Calendar,
  Clock,
  Shield,
  FileText,
  Activity,
  ChevronRight,
  Send,
  MessageSquare,
  AlertOctagon,
  Users,
} from 'lucide-react';

// Realistic JKN / BPJS Kesehatan Users, Hospital PICs & Verifiers
const INITIAL_JKN_USERS = [
  {
    id: 1,
    name: 'dr. Hendra Setiawan, Sp.A',
    email: 'hendra.setiawan@rscm.co.id',
    phone: '081229348123',
    faskes: 'RSUPN Dr. Cipto Mangunkusumo Jakarta',
    faskes_code: '0112R001',
    role: 'DPJP_SPESIALIS',
    role_label: 'DPJP Spesialis Anak',
    is_active: true,
    screening_risk: 'CRITICAL',
    screening_score: 94,
    screening_finding: 'Indikasi Upcoding Neonatal Sepsis (P-8-09-III) & SIP kedaluwarsa 42 hari',
    streak_days: 0,
    sentiment_pct: 12,
    sla_compliance: 45,
    last_activity: '10 menit yang lalu',
    total_claims_handled: 184,
    avatar_color: 'bg-rose-500',
    avatar_initials: 'HS',
  },
  {
    id: 2,
    name: 'Siti Rahmawati, S.Kep., Ners',
    email: 'casemix.rahma@rskh-mitrahusada.co.id',
    phone: '081390451829',
    faskes: 'RS Khusus Mitra Husada',
    faskes_code: '0114R005',
    role: 'PIC_CASEMIX',
    role_label: 'PIC Casemix FKRTL',
    is_active: true,
    screening_risk: 'CRITICAL',
    screening_score: 91,
    screening_finding: 'Lonjakan 85 berkas klaim fisioterapi tanpa presensi Mobile JKN (Phantom Cluster)',
    streak_days: 0,
    sentiment_pct: 8,
    sla_compliance: 60,
    last_activity: '25 menit yang lalu',
    total_claims_handled: 320,
    avatar_color: 'bg-amber-500',
    avatar_initials: 'SR',
  },
  {
    id: 3,
    name: 'Ahmad Faisal, S.Farm., Apt',
    email: 'faisal.apt@rs-fatmawati.go.id',
    phone: '082138947512',
    faskes: 'RSUP Fatmawati Jakarta',
    faskes_code: '0112R002',
    role: 'PIC_CASEMIX',
    role_label: 'Koordinator Farmasi & Casemix',
    is_active: true,
    screening_risk: 'SEVERE',
    screening_score: 76,
    screening_finding: 'Restriksi Fornas Albumin Human 20% tanpa kadar serum albumin <2.5 g/dL',
    streak_days: 3,
    sentiment_pct: 42,
    sla_compliance: 82,
    last_activity: '1 jam yang lalu',
    total_claims_handled: 215,
    avatar_color: 'bg-orange-500',
    avatar_initials: 'AF',
  },
  {
    id: 4,
    name: 'dr. Bambang Prasetyo, Sp.JP(K)',
    email: 'bambang.prasetyo@rs-persahabatan.go.id',
    phone: '08112648931',
    faskes: 'RSUP Persahabatan Jakarta',
    faskes_code: '0112R003',
    role: 'DPJP_SPESIALIS',
    role_label: 'DPJP Jantung & Pembuluh Darah',
    is_active: true,
    screening_risk: 'MODERATE',
    screening_score: 58,
    screening_finding: 'Klaim Kateterisasi Jantung (I-4-10-III) tanpa kelengkapan lembar hemostasis',
    streak_days: 5,
    sentiment_pct: 75,
    sla_compliance: 89,
    last_activity: '3 jam yang lalu',
    total_claims_handled: 98,
    avatar_color: 'bg-blue-500',
    avatar_initials: 'BP',
  },
  {
    id: 5,
    name: 'Tri Wahyuni, SKM',
    email: 'tri.wahyuni@bpjs-kesehatan.go.id',
    phone: '085741298456',
    faskes: 'BPJS Kesehatan Kantor Pusat',
    faskes_code: 'KP-0001',
    role: 'VERIFIKATOR',
    role_label: 'Verifikator Medis Utama (Pusat)',
    is_active: true,
    screening_risk: 'CLEAN',
    screening_score: 12,
    screening_finding: 'Verifikasi berkas tertib PNPK & SLA tinjauan 99.4%',
    streak_days: 14,
    sentiment_pct: 98,
    sla_compliance: 99,
    last_activity: 'Aktif Sekarang',
    total_claims_handled: 640,
    avatar_color: 'bg-emerald-600',
    avatar_initials: 'TW',
  },
  {
    id: 6,
    name: 'Drs. Iwan Kusuma, MM',
    email: 'iwan.kusuma@bpjs-kesehatan.go.id',
    phone: '081290384721',
    faskes: 'Kedeputian Bidang Wasrik Pusat',
    faskes_code: 'KEDEP-WASRIK',
    role: 'WASRIK',
    role_label: 'Auditor Pengawasan & Pemeriksaan (Wasrik)',
    is_active: true,
    screening_risk: 'CLEAN',
    screening_score: 5,
    screening_finding: 'Audit forensik kepatuhan regulasi Perpres 82/2018',
    streak_days: 21,
    sentiment_pct: 100,
    sla_compliance: 100,
    last_activity: '12 menit yang lalu',
    total_claims_handled: 890,
    avatar_color: 'bg-indigo-600',
    avatar_initials: 'IK',
  },
  {
    id: 7,
    name: 'Dewi Lestari, S.Tr.Kes',
    email: 'dewi.rekammedis@rs-hasansadikin.go.id',
    phone: '082245981245',
    faskes: 'RSUP Dr. Hasan Sadikin Bandung',
    faskes_code: '0115R004',
    role: 'PIC_CASEMIX',
    role_label: 'Staf Koder & Rekam Medis',
    is_active: false,
    screening_risk: 'SEVERE',
    screening_score: 72,
    screening_finding: 'Koding ganda (unbundling) tindakan endoskopi & biopsi lambung',
    streak_days: 0,
    sentiment_pct: 35,
    sla_compliance: 71,
    last_activity: '2 hari yang lalu',
    total_claims_handled: 142,
    avatar_color: 'bg-slate-500',
    avatar_initials: 'DL',
  },
  {
    id: 8,
    name: 'dr. Agus Santoso, Sp.OT',
    email: 'agus.santoso@rs-sardjito.co.id',
    phone: '081328904512',
    faskes: 'RSUP Dr. Sardjito Yogyakarta',
    faskes_code: '0116R008',
    role: 'DPJP_SPESIALIS',
    role_label: 'DPJP Bedah Ortopedi',
    is_active: true,
    screening_risk: 'CLEAN',
    screening_score: 18,
    screening_finding: 'Dokumentasi implan ORIF lengkap rontgen pra & pasca operasi',
    streak_days: 8,
    sentiment_pct: 94,
    sla_compliance: 96,
    last_activity: '4 jam yang lalu',
    total_claims_handled: 156,
    avatar_color: 'bg-teal-600',
    avatar_initials: 'AS',
  },
];

export default function CommandCenterView({ onSelectCase, isLight: propIsLight }) {
  const [internalIsLight, setInternalIsLight] = useState(() => {
    if (typeof document !== 'undefined') {
      const root = document.getElementById('cockpit-root');
      return root ? root.classList.contains('theme-light') : false;
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
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    const root = document.getElementById('cockpit-root');
    if (root) observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [propIsLight]);

  const isLight = typeof propIsLight === 'boolean' ? propIsLight : internalIsLight;

  const [users, setUsers] = useState(INITIAL_JKN_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('overview'); // 'overview' | 'screening' | 'crm'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);
  const [crmNoteModal, setCrmNoteModal] = useState({ isOpen: false, user: null, note: '' });
  const [toastMsg, setToastMsg] = useState(null);

  // Auto-dismiss Toast Feedback setelah 3.2 detik
  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => {
      setToastMsg(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  // Handle Refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.faskes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.faskes_code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchRisk = riskFilter === 'ALL' || u.screening_risk === riskFilter;

      return matchSearch && matchRole && matchRisk;
    });
  }, [users, searchQuery, roleFilter, riskFilter]);

  // Purpose-Driven Metric Cards
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const reqAttention = users.filter((u) => u.screening_risk === 'CRITICAL' || u.screening_risk === 'SEVERE').length;
    const criticalCount = users.filter((u) => u.screening_risk === 'CRITICAL').length;
    const severeCount = users.filter((u) => u.screening_risk === 'SEVERE').length;
    const active7d = users.filter((u) => u.is_active && u.streak_days > 0).length;

    return {
      total: totalUsers,
      newThisWeek: 3,
      reqAttention,
      criticalCount,
      severeCount,
      active7d: active7d + 12,
    };
  }, [users]);

  // Handle WhatsApp Call / Msg
  const getWhatsAppLink = (phone, user) => {
    const clean = phone.replace(/\D/g, '');
    const intl = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
    const msg = encodeURIComponent(
      `Yth. ${user.name} (${user.faskes}), Tim Verifikator BPJS Kesehatan Pusat menyampaikan konfirmasi berkas klaim & kepatuhan SLA JKN.`
    );
    return `https://wa.me/${intl}?text=${msg}`;
  };

  // Handle Open User Drawer
  const handleOpenUser = (u) => {
    setSelectedUser(u);
    setDrawerTab('overview');
    setDrawerOpen(true);
    setActionMenuOpenId(null);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Nama', 'Email', 'Faskes', 'Kode Faskes', 'Peran', 'Risiko', 'Skor', 'Status'];
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.faskes}"`,
      u.faskes_code,
      u.role,
      u.screening_risk,
      u.screening_score,
      u.is_active ? 'AKTIF' : 'NONAKTIF',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CommandCenter_JKN_Users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-6 ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* Header Banner */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-5 rounded-2xl border transition-all ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-sm text-slate-900'
          : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
      }`}>
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Pusat Komando &amp; CRM Terpadu JKN</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              isLight
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-[#FFCA40]/10 text-[#FFCA40] border-[#FFCA40]/30'
            }`}>
              CRM &amp; Penapisan Integritas JKN
            </span>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-white/10 text-white/80 border-white/10'
            }`}>
              6 STANDAR SIBER &amp; ANTI-FRAUD AKTIF
            </span>
          </div>
          <p className={`text-xs md:text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Dasbor Terpadu Pengawasan Verifikator Medis, PIC Casemix FKRTL, dan Integritas Klaim JKN (MITRE F3, ATT&amp;CK, NIST CSF 2.0, ATLAS, D3FEND, NIST AI RMF).
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button aria-label="Segarkan data" type="button"
            onClick={handleRefresh}
            className={`p-2.5 rounded-xl border transition-all shadow-xs cursor-pointer ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                : 'bg-white/5 border-white/10 hover:border-white/20 text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title="Segarkan Data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? (isLight ? 'animate-spin text-sky-600' : 'animate-spin text-[#FFCA40]') : ''}`} />
          </button>
          <button type="button"
            onClick={handleExportCsv}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs transition-all shadow-xs cursor-pointer ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                : 'bg-white/5 border-white/10 hover:border-white/20 text-white hover:bg-white/10'
            }`}
          >
            <Download className={`h-4 w-4 ${isLight ? 'text-sky-600' : 'text-[#FFCA40]'}`} />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Purpose-Driven Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Monitored Users */}
        <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
          isLight
            ? 'bg-white border-slate-200/90 shadow-sm text-slate-900'
            : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
        }`}>
          <Users className="absolute right-2 -bottom-2 w-16 h-16 opacity-[0.05] pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${
                isLight ? 'text-slate-500' : 'text-white/60'
              }`}>
                Total Pengguna Terpantau
              </p>
              <p className="text-3xl font-bold mt-1.5">{stats.total}</p>
            </div>
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }`}>
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs">
            <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>+{stats.newThisWeek}</span>
            <span className={`ml-1.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>pengguna baru minggu ini</span>
          </div>
        </div>

        {/* Card 2: Requires Attention */}
        <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
          isLight
            ? 'bg-rose-50/80 border-rose-200 shadow-sm text-rose-950'
            : 'bg-[#00153A]/85 border-rose-500/20 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
        }`}>
          <AlertTriangle className="absolute right-2 -bottom-2 w-16 h-16 opacity-[0.05] pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${
                isLight ? 'text-rose-700' : 'text-white/60'
              }`}>
                Perlu Perhatian Khusus
              </p>
              <p className={`text-3xl font-bold mt-1.5 ${
                isLight ? 'text-rose-800' : 'text-rose-400'
              }`}>
                {stats.reqAttention}
              </p>
            </div>
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-rose-100/80 text-rose-700 border-rose-300' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className={`mt-4 flex items-center text-xs ${isLight ? 'text-rose-700 font-medium' : 'text-white/50'}`}>
            <span>Berdasarkan sinyal penapisan anomali</span>
          </div>
        </div>

        {/* Card 3: High Risk Profiles */}
        <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
          isLight
            ? 'bg-amber-50/80 border-amber-200 shadow-sm text-amber-950'
            : 'bg-[#00153A]/85 border-amber-500/20 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
        }`}>
          <ShieldAlert className="absolute right-2 -bottom-2 w-16 h-16 opacity-[0.05] pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${
                isLight ? 'text-amber-800' : 'text-white/60'
              }`}>
                Profil Berisiko Tinggi
              </p>
              <p className={`text-3xl font-bold mt-1.5 ${
                isLight ? 'text-amber-800' : 'text-[#FFCA40]'
              }`}>
                {stats.criticalCount + stats.severeCount}
              </p>
            </div>
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-amber-100/80 text-amber-800 border-amber-300' : 'bg-amber-500/10 text-[#FFCA40] border-amber-500/20'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs">
            <span className={`font-bold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>{stats.criticalCount} Kritis</span>
            <span className={`mx-2 ${isLight ? 'text-amber-300' : 'text-white/20'}`}>•</span>
            <span className={`font-bold ${isLight ? 'text-amber-800' : 'text-[#FFCA40]'}`}>{stats.severeCount} Berat</span>
          </div>
        </div>

        {/* Card 4: Engagement Health */}
        <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
          isLight
            ? 'bg-emerald-50/80 border-emerald-200 shadow-sm text-emerald-950'
            : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
        }`}>
          <Activity className="absolute right-2 -bottom-2 w-16 h-16 opacity-[0.05] pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${
                isLight ? 'text-emerald-800' : 'text-white/60'
              }`}>
                Skor Kepatuhan &amp; Aktivitas
              </p>
              <p className={`text-3xl font-bold mt-1.5 ${
                isLight ? 'text-emerald-800' : 'text-emerald-400'
              }`}>
                {stats.active7d}
              </p>
            </div>
            <div className={`p-3 rounded-xl border ${
              isLight ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <div className={`mt-4 flex items-center text-xs ${isLight ? 'text-emerald-700 font-medium' : 'text-white/50'}`}>
            <span>Pengguna aktif dalam 7 hari terakhir</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-sm text-slate-800'
          : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
      }`}>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${
              isLight ? 'text-slate-400' : 'text-white/40'
            }`} />
            <input aria-label="Cari nama petugas, NIP, email, atau kode faskes..."
              type="text"
              placeholder="Cari nama petugas, NIP, email, atau kode faskes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs transition-all font-medium ${
                isLight
                  ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600'
                  : 'bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFCA40]/30 focus:border-[#FFCA40]/60'
              }`}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                showFilters
                  ? (isLight ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-[#FFCA40] border-[#FFCA40] text-slate-950 shadow-md')
                  : (isLight ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white')
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filter Lanjutan</span>
              {(roleFilter !== 'ALL' || riskFilter !== 'ALL') && (
                <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-white' : 'bg-[#FFCA40]'}`} />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Filter Tray */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`overflow-hidden pt-4 mt-4 border-t ${isLight ? 'border-slate-100' : 'border-white/10'}`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                    isLight ? 'text-slate-600' : 'text-white/60'
                  }`}>
                    Akses &amp; Peran JKN
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-xs transition font-semibold ${
                      isLight
                        ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600'
                        : 'bg-[#00134A] border border-white/10 text-white focus:outline-none focus:border-[#FFCA40]/60'
                    }`}
                  >
                    <option value="ALL">Semua Peran</option>
                    <option value="VERIFIKATOR">Verifikator Medis</option>
                    <option value="WASRIK">Auditor Wasrik</option>
                    <option value="PIC_CASEMIX">PIC Casemix FKRTL</option>
                    <option value="DPJP_SPESIALIS">DPJP Spesialis</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                    isLight ? 'text-slate-600' : 'text-white/60'
                  }`}>
                    Risiko Skrining Integritas
                  </label>
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-xs transition font-semibold ${
                      isLight
                        ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600'
                        : 'bg-[#00134A] border border-white/10 text-white focus:outline-none focus:border-[#FFCA40]/60'
                    }`}
                  >
                    <option value="ALL">Semua Tingkat Risiko</option>
                    <option value="CRITICAL">Kritis (Critical)</option>
                    <option value="SEVERE">Berat (Severe)</option>
                    <option value="MODERATE">Sedang (Moderate)</option>
                    <option value="CLEAN">Bersih (Clean)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="button"
                    onClick={() => {
                      setRoleFilter('ALL');
                      setRiskFilter('ALL');
                      setSearchQuery('');
                    }}
                    className={`w-full py-2 px-3 text-xs font-bold rounded-xl transition-colors border cursor-pointer ${
                      isLight
                        ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
                        : 'text-white/70 bg-white/5 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Table */}
      <div className={`relative overflow-hidden rounded-2xl border transition-all ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-sm text-slate-800'
          : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b uppercase tracking-wider text-[11px] ${
                isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-200 font-bold'
                  : 'bg-white/5 border-b border-white/10 text-white/70 font-bold'
              }`}>
                <th className="py-3.5 px-4">PROFIL PETUGAS / DPJP</th>
                <th className="py-3.5 px-4">PERAN &amp; STATUS AKSES</th>
                <th className="py-3.5 px-4">PENAPISAN RISIKO INTEGRITAS</th>
                <th className="py-3.5 px-4">AKTIVITAS &amp; KEPATUHAN SLA</th>
                <th className="py-3.5 px-4">KANAL KOMUNIKASI CRM</th>
                <th className="py-3.5 px-4 text-right">TINDAKAN DISPOSISI</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`py-12 text-center font-medium ${
                    isLight ? 'text-slate-400' : 'text-white/40'
                  }`}>
                    Tidak ditemukan data pengguna atau PIC faskes yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isMenuOpen = actionMenuOpenId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors cursor-pointer group ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'
                      }`}
                      onClick={() => handleOpenUser(user)}
                    >
                      {/* USER PROFILE */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${user.avatar_color} text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-md`}
                          >
                            {user.avatar_initials}
                          </div>
                          <div>
                            <div className={`font-bold transition-colors flex items-center gap-2 ${
                              isLight ? 'text-slate-900 group-hover:text-emerald-700' : 'text-white group-hover:text-[#FFCA40]'
                            }`}>
                              <span>{user.name}</span>
                              {!user.is_active && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                  isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white/10 text-white/40 border-white/10'
                                }`}>
                                  Nonaktif
                                </span>
                              )}
                            </div>
                            <div className={`text-[11px] font-mono mt-0.5 truncate max-w-xs ${
                              isLight ? 'text-slate-500' : 'text-white/60'
                            }`}>
                              {user.email}
                            </div>
                            <div className={`text-[11px] flex items-center gap-1 mt-0.5 ${
                              isLight ? 'text-slate-600' : 'text-white/40'
                            }`}>
                              <Building2 className={`w-3 h-3 ${isLight ? 'text-sky-600' : 'text-[#FFCA40]'}`} />
                              <span>{user.faskes} ({user.faskes_code})</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ACCESS & ROLE */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            isLight
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-white/10 text-white/80 border-white/10'
                          }`}>
                            {user.role}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[9.5px] font-bold uppercase tracking-wider border ${
                              user.is_active
                                ? (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30')
                                : (isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white/5 text-white/40 border-white/10')
                            }`}
                          >
                            {user.is_active ? 'AKTIF' : 'DITANGGUHKAN'}
                          </span>
                        </div>
                      </td>

                      {/* SCREENING RISK */}
                      <td className="py-3.5 px-4">
                        {user.screening_risk === 'CRITICAL' ? (
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}>
                              <AlertOctagon className={`w-3 h-3 ${isLight ? 'text-rose-700' : 'text-rose-400'}`} />
                              KRITIS ({user.screening_score})
                            </span>
                            <p className={`text-[10px] mt-1 max-w-xs line-clamp-1 ${
                              isLight ? 'text-slate-600' : 'text-white/60'
                            }`}>
                              {user.screening_finding}
                            </p>
                          </div>
                        ) : user.screening_risk === 'SEVERE' ? (
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/15 text-[#FFCA40] border-amber-500/30'
                            }`}>
                              <AlertTriangle className={`w-3 h-3 ${isLight ? 'text-amber-700' : 'text-[#FFCA40]'}`} />
                              BERAT ({user.screening_score})
                            </span>
                            <p className={`text-[10px] mt-1 max-w-xs line-clamp-1 ${
                              isLight ? 'text-slate-600' : 'text-white/60'
                            }`}>
                              {user.screening_finding}
                            </p>
                          </div>
                        ) : user.screening_risk === 'MODERATE' ? (
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            }`}>
                              SEDANG ({user.screening_score})
                            </span>
                            <p className={`text-[10px] mt-1 max-w-xs line-clamp-1 ${
                              isLight ? 'text-slate-600' : 'text-white/60'
                            }`}>
                              {user.screening_finding}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            }`}>
                              <CheckCircle className={`w-3 h-3 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                              BERSIH / PATUH
                            </span>
                          </div>
                        )}
                      </td>

                      {/* ENGAGEMENT */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            isLight ? 'text-slate-700 bg-slate-100 border-slate-200' : 'text-white/80 bg-white/10 border-white/10'
                          }`}>
                            Hari Aktif: {user.streak_days} Hari
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                              user.sentiment_pct > 70
                                ? (isLight ? 'bg-emerald-50 text-emerald-800' : 'bg-emerald-500/15 text-emerald-300')
                                : user.sentiment_pct > 30
                                ? (isLight ? 'bg-amber-50 text-amber-800' : 'bg-amber-500/15 text-[#FFCA40]')
                                : (isLight ? 'bg-rose-50 text-rose-800' : 'bg-rose-500/15 text-rose-300')
                            }`}
                          >
                            Kepatuhan: {user.sentiment_pct}%
                          </span>
                          <span className={`text-[9.5px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                            SLA: {user.sla_compliance}%
                          </span>
                        </div>
                      </td>

                      {/* CRM OUTPUT */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <a
                            href={getWhatsAppLink(user.phone, user)}
                            target="_blank"
                            rel="noreferrer"
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              isLight
                                ? 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200 hover:border-emerald-300'
                                : 'bg-white/5 hover:bg-emerald-500/20 text-white/70 hover:text-emerald-300 border-white/10 hover:border-emerald-500/30'
                            }`}
                            title={`Hubungi via Hotline/WhatsApp (${user.phone})`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`mailto:${user.email}?subject=Konfirmasi Kepatuhan Klaim JKN - ${user.faskes}`}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              isLight
                                ? 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200 hover:border-emerald-300'
                                : 'bg-white/5 hover:bg-blue-500/20 text-white/70 hover:text-blue-300 border-white/10 hover:border-blue-500/30'
                            }`}
                            title={`Kirim Email Resmi (${user.email})`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                          <button type="button"
                            onClick={() => setCrmNoteModal({ isOpen: true, user, note: '' })}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              isLight
                                ? 'bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-800 border-slate-200 hover:border-purple-300'
                                : 'bg-white/5 hover:bg-purple-500/20 text-white/70 hover:text-purple-300 border-white/10 hover:border-purple-500/30'
                            }`}
                            title="Catat Histori Interaksi CRM"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-left">
                          <button type="button"
                            onClick={() => setActionMenuOpenId(isMenuOpen ? null : user.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs border transition-colors cursor-pointer ${
                              isLight
                                ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-2xs'
                                : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                            }`}
                          >
                            <span>Pilih Tindakan...</span>
                            <ChevronDown className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-white/40'}`} />
                          </button>

                          {/* Action Dropdown Menu */}
                          {isMenuOpen && (
                            <div className={`absolute right-0 mt-1 w-52 rounded-xl shadow-xl border py-1.5 z-30 ${
                              isLight
                                ? 'bg-white border-slate-200 text-slate-800'
                                : 'bg-[#00153A] border-white/20 text-white'
                            }`}>
                              <button type="button"
                                onClick={() => handleOpenUser(user)}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 font-medium ${
                                  isLight ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900' : 'text-white/80 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <Eye className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                                <span>Lihat Profil &amp; Histori</span>
                              </button>
                              <button type="button"
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  if (onSelectCase) {
                                    onSelectCase({
                                      id: `CLM-2026-10-08${user.id}`,
                                      sep: `0114R0011026V00008${user.id}`,
                                      hospital: user.faskes,
                                      hospitalType: 'FKRTL (Fasilitas Kesehatan Rujukan Tingkat Lanjut)',
                                      code: user.screening_finding.includes('P-8-09') ? 'P-8-09-III' : user.screening_finding.includes('I-4-10') ? 'I-4-10-III' : 'Z-3-12-0',
                                      description: user.screening_finding,
                                      tariff: user.screening_risk === 'CRITICAL' ? 'Rp 34.500.000' : 'Rp 15.300.000',
                                      dpjp: user.name,
                                      sipNumber: '446.1/108/DPJP/2023',
                                      date: '24 Okt 2026',
                                      batchTag: 'AUDIT_INTEGRITAS_OKT26',
                                      sampleCount: 10,
                                      participantCount: 10,
                                      deniedCount: user.screening_score > 90 ? 8 : 3,
                                      s1: user.screening_score,
                                      s2: 88,
                                      s3: 80,
                                      totalScore: user.screening_score,
                                      lane: user.screening_risk === 'CRITICAL' ? 'red' : 'yellow',
                                      status: user.screening_risk === 'CRITICAL' ? 'AUDIT KHUSUS MERAH' : 'AUDIT KUNING',
                                      notes: `${user.role_label} di ${user.faskes}: ${user.screening_finding}.`,
                                      flags: [user.role_label, user.screening_risk]
                                    });
                                  }
                                }}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 font-medium ${
                                  isLight ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900' : 'text-white/80 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <FileText className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-[#FFCA40]'}`} />
                                <span>Investigasi Berkas Klaim</span>
                              </button>
                              <button type="button"
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  setCrmNoteModal({ isOpen: true, user, note: '' });
                                }}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 font-medium ${
                                  isLight ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900' : 'text-white/80 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <Send className={`w-3.5 h-3.5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                                <span>Kirim Draf Klarifikasi BAKK</span>
                              </button>
                              <div className={`my-1 border-t ${isLight ? 'border-slate-100' : 'border-white/10'}`} />
                              <button type="button"
                                onClick={() => {
                                  setActionMenuOpenId(null);
                                  setUsers((prev) =>
                                    prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
                                  );
                                }}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 font-bold ${
                                  user.is_active
                                    ? (isLight ? 'text-rose-700 hover:bg-rose-50' : 'text-rose-400 hover:bg-rose-500/10')
                                    : (isLight ? 'text-emerald-700 hover:bg-emerald-50' : 'text-emerald-400 hover:bg-emerald-500/10')
                                }`}
                              >
                                {user.is_active ? (
                                  <>
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Tangguhkan Akses JKN</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Aktifkan Kembali Akses</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Profile Slide-over Drawer */}
      <AnimatePresence>
        {drawerOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`w-full max-w-xl h-full shadow-2xl flex flex-col border-l overflow-hidden ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#00153A] border-white/20 text-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className={`p-6 border-b ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl ${selectedUser.avatar_color} text-white font-bold flex items-center justify-center text-lg shadow-md`}
                    >
                      {selectedUser.avatar_initials}
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {selectedUser.name}
                      </h2>
                      <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                        {selectedUser.email}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/10 text-white/80 border-white/10'
                        }`}>
                          {selectedUser.role}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            selectedUser.is_active
                              ? (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30')
                              : (isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white/5 text-white/40 border-white/10')
                          }`}
                        >
                          {selectedUser.is_active ? 'Aktif' : 'Ditangguhkan'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button type="button"
                    onClick={() => setDrawerOpen(false)}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200' : 'text-white/40 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Subtabs */}
                <div className={`flex gap-2 mt-6 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <button type="button"
                    onClick={() => setDrawerTab('overview')}
                    className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      drawerTab === 'overview'
                        ? (isLight ? 'border-emerald-600 text-emerald-700' : 'border-[#FFCA40] text-[#FFCA40]')
                        : (isLight ? 'border-transparent text-slate-500 hover:text-slate-900' : 'border-transparent text-white/50 hover:text-white')
                    }`}
                  >
                    Ringkasan Profil
                  </button>
                  <button type="button"
                    onClick={() => setDrawerTab('screening')}
                    className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      drawerTab === 'screening'
                        ? (isLight ? 'border-emerald-600 text-emerald-700' : 'border-[#FFCA40] text-[#FFCA40]')
                        : (isLight ? 'border-transparent text-slate-500 hover:text-slate-900' : 'border-transparent text-white/50 hover:text-white')
                    }`}
                  >
                    Skrining Integritas Klaim
                  </button>
                  <button type="button"
                    onClick={() => setDrawerTab('crm')}
                    className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      drawerTab === 'crm'
                        ? (isLight ? 'border-emerald-600 text-emerald-700' : 'border-[#FFCA40] text-[#FFCA40]')
                        : (isLight ? 'border-transparent text-slate-500 hover:text-slate-900' : 'border-transparent text-white/50 hover:text-white')
                    }`}
                  >
                    Log Interaksi CRM JKN
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {drawerTab === 'overview' && (
                  <div className="space-y-5">
                    {/* Faskes Info */}
                    <div className={`rounded-xl border p-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                      <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                        Afiliasi Faskes FKRTL BPJS Kesehatan
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className={`block text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Nama Faskes:</span>
                          <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedUser.faskes}</span>
                        </div>
                        <div>
                          <span className={`block text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Kode Faskes:</span>
                          <span className={`font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-cyan-400'}`}>{selectedUser.faskes_code}</span>
                        </div>
                        <div>
                          <span className={`block text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Kepatuhan SLA:</span>
                          <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{selectedUser.sla_compliance}%</span>
                        </div>
                        <div>
                          <span className={`block text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Klaim Dikelola:</span>
                          <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedUser.total_claims_handled} berkas</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className={`rounded-xl border p-4 space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                        Kanal Komunikasi Terverifikasi
                      </h3>
                      <div className={`flex items-center justify-between text-xs py-1 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                        <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                          <Mail className="w-3.5 h-3.5" /> Email Dinas:
                        </span>
                        <span className={`font-mono font-semibold ${isLight ? 'text-slate-900' : 'text-white/90'}`}>{selectedUser.email}</span>
                      </div>
                      <div className={`flex items-center justify-between text-xs py-1 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                        <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                          <Phone className="w-3.5 h-3.5" /> No. Telepon / WA:
                        </span>
                        <span className={`font-mono font-semibold ${isLight ? 'text-slate-900' : 'text-white/90'}`}>{selectedUser.phone}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1">
                        <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                          <Clock className="w-3.5 h-3.5" /> Terakhir Aktif:
                        </span>
                        <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white/90'}`}>{selectedUser.last_activity}</span>
                      </div>
                    </div>

                    {/* Quick CRM Outreach CTA */}
                    <div className={`p-4 rounded-xl border ${isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-blue-500/10 border-blue-500/20'}`}>
                      <p className={`text-xs font-bold mb-1 ${isLight ? 'text-emerald-900' : 'text-blue-300'}`}>
                        Hubungi Langsung Melalui CRM JKN
                      </p>
                      <p className={`text-[11px] mb-3 ${isLight ? 'text-emerald-700' : 'text-blue-200/70'}`}>
                        Kirimkan pemberitahuan resmi atau klarifikasi verifikasi pra-pembayaran langsung ke nomor terdaftar.
                      </p>
                      <div className="flex gap-2">
                        <a
                          href={getWhatsAppLink(selectedUser.phone, selectedUser)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 text-center py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Kirim Pesan WA</span>
                        </a>
                        <a
                          href={`mailto:${selectedUser.email}`}
                          className="flex-1 text-center py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Kirim Email</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {drawerTab === 'screening' && (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-xl border ${
                        selectedUser.screening_risk === 'CRITICAL'
                          ? (isLight ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-rose-500/10 border-rose-500/30 text-rose-300')
                          : selectedUser.screening_risk === 'SEVERE'
                          ? (isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-[#FFCA40]')
                          : (isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300')
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Status Penapisan: {selectedUser.screening_risk === 'CRITICAL' ? 'KRITIS' : selectedUser.screening_risk === 'SEVERE' ? 'BERAT' : selectedUser.screening_risk === 'MODERATE' ? 'SEDANG' : 'BERSIH'}
                        </span>
                        <span className="text-base font-bold">{selectedUser.screening_score} / 100</span>
                      </div>
                      <p className="text-xs font-semibold leading-relaxed">{selectedUser.screening_finding}</p>
                    </div>

                    <div className="space-y-3">
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                        Dimensi Evaluasi Integritas
                      </h4>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-white/60'}`}>Validitas SIP DPJP di SATUSEHAT</span>
                          <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {selectedUser.screening_risk === 'CRITICAL' ? 'Kedaluwarsa (0%)' : 'Valid (100%)'}
                          </span>
                        </div>
                        <div className={`w-full rounded-full h-2 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                          <div
                            className={`h-2 rounded-full ${
                              selectedUser.screening_risk === 'CRITICAL' ? 'bg-rose-500 w-1/12' : 'bg-emerald-500 w-full'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-white/60'}`}>Kesesuaian Presensi Pasien Mobile JKN</span>
                          <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {selectedUser.screening_risk === 'CRITICAL' ? '80% Sangkalan' : '98% Hadir Fisik'}
                          </span>
                        </div>
                        <div className={`w-full rounded-full h-2 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                          <div
                            className={`h-2 rounded-full ${
                              selectedUser.screening_risk === 'CRITICAL' ? 'bg-rose-500 w-1/5' : 'bg-emerald-500 w-11/12'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-white/60'}`}>Kepatuhan Koding PNPK &amp; Fornas</span>
                          <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedUser.sla_compliance}%</span>
                        </div>
                        <div className={`w-full rounded-full h-2 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                          <div
                            className="h-2 rounded-full bg-emerald-600"
                            style={{ width: `${selectedUser.sla_compliance}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {drawerTab === 'crm' && (
                  <div className="space-y-4">
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                      Riwayat Interaksi &amp; Notifikasi Klarifikasi
                    </h4>
                    <div className="space-y-3">
                      <div className={`p-3 rounded-xl border text-xs ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                        <div className={`flex justify-between text-[10px] mb-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                          <span>NOTIFIKASI V-CLAIM</span>
                          <span>24/10/2026, 18:30</span>
                        </div>
                        <p className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                          Pengiriman draf permintaan kelengkapan BAKK terkait berkas SEP-0114R001.
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl border text-xs ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                        <div className={`flex justify-between text-[10px] mb-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                          <span>LOG HOTLINE</span>
                          <span>22/10/2026, 11:15</span>
                        </div>
                        <p className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                          Panggilan verifikator BPJS Kesehatan Pusat mengonfirmasi kehadiran DPJP di poli rawat jalan.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className={`p-4 border-t flex justify-end gap-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <button type="button"
                  onClick={() => setDrawerOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Tutup
                </button>
                <button type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    if (onSelectCase) {
                      onSelectCase({
                        id: `CLM-2026-10-08${selectedUser?.id || 5}`,
                        sep: `0114R0011026V00008${selectedUser?.id || 5}`,
                        hospital: selectedUser?.faskes || 'RS Khusus Mitra Husada',
                        hospitalType: 'FKRTL (Fasilitas Kesehatan Rujukan Tingkat Lanjut)',
                        code: selectedUser?.screening_finding?.includes('P-8-09') ? 'P-8-09-III' : selectedUser?.screening_finding?.includes('I-4-10') ? 'I-4-10-III' : 'Z-3-12-0',
                        description: selectedUser?.screening_finding || 'Prosedur Fisioterapi / Rehabilitasi Medis Massal Pasca-Baksos',
                        tariff: selectedUser?.screening_risk === 'CRITICAL' ? 'Rp 34.500.000' : 'Rp 15.300.000',
                        dpjp: selectedUser?.name || 'dr. Hendra, Sp.KFR',
                        sipNumber: '446.1/108/DPJP/2023',
                        date: '24 Okt 2026',
                        batchTag: 'AUDIT_INTEGRITAS_OKT26',
                        sampleCount: 10,
                        participantCount: 10,
                        deniedCount: (selectedUser?.screening_score || 88) > 90 ? 8 : 4,
                        s1: selectedUser?.screening_score || 88,
                        s2: 88,
                        s3: 80,
                        totalScore: selectedUser?.screening_score || 88,
                        lane: selectedUser?.screening_risk === 'CRITICAL' ? 'red' : 'yellow',
                        status: selectedUser?.screening_risk === 'CRITICAL' ? 'AUDIT KHUSUS MERAH' : 'AUDIT KUNING',
                        notes: `${selectedUser?.role_label || 'Petugas'} di ${selectedUser?.faskes || 'Faskes'}: ${selectedUser?.screening_finding || 'Audit berkas klaim'}.`,
                        flags: [selectedUser?.role_label || 'Petugas', selectedUser?.screening_risk || 'RISIKO']
                      });
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm cursor-pointer"
                >
                  Buka Berkas Investigasi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CRM Note Dialog Modal */}
      {crmNoteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl border p-6 space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#00153A] border-white/20 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Catat Interaksi CRM JKN
              </h3>
              <button type="button"
                onClick={() => setCrmNoteModal({ isOpen: false, user: null, note: '' })}
                className={`cursor-pointer ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Menambahkan catatan kontak untuk <strong>{crmNoteModal.user?.name}</strong> ({crmNoteModal.user?.faskes}).
            </p>
            <textarea
              rows={4}
              value={crmNoteModal.note}
              onChange={(e) => setCrmNoteModal((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Tuliskan ringkasan hasil klarifikasi telepon, temuan berkas, atau komitmen penyelesaian faskes..."
              className={`w-full rounded-xl p-3 text-xs transition font-medium ${
                isLight
                  ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20'
                  : 'bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFCA40]/30 focus:border-[#FFCA40]/60'
              }`}
            />
            <div className="flex justify-end gap-2">
              <button type="button"
                onClick={() => setCrmNoteModal({ isOpen: false, user: null, note: '' })}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  isLight ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Batal
              </button>
              <button type="button"
                onClick={() => {
                  setToastMsg('Catatan interaksi CRM berhasil disimpan ke Ledger Pengawasan JKN.');
                  setCrmNoteModal({ isOpen: false, user: null, note: '' });
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            key={toastMsg}
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            transition={{ duration: 0.2 }}
            className={`fixed top-20 left-1/2 z-50 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 backdrop-blur-xl border overflow-hidden ${
              isLight
                ? 'bg-white text-slate-900 border-emerald-500/40 shadow-slate-300/50'
                : 'bg-[#00153A] text-white border-emerald-500/50 shadow-black/80'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{toastMsg}</span>
            <button
              onClick={() => setToastMsg(null)}
              aria-label="Tutup notifikasi"
              className={`ml-2 cursor-pointer p-0.5 rounded transition ${
                isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <motion.div
              key={`bar-${toastMsg}`}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3.2, ease: "linear" }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
