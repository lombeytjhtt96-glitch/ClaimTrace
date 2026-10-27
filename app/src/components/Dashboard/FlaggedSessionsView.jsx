import React, { useState, useMemo, useEffect } from 'react';
import {
  Flag,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Tag,
  ShieldAlert,
  FileWarning,
  Fingerprint,
  X
} from 'lucide-react';

/**
 * FlaggedSessionsView:
 * Dual-Themed (Cosmic Obsidian & Clinical White)
 * Sesi Klaim & Audit Ditandai (Flagged Sessions).
 */

const PREDEFINED_CATEGORIES = [
  { 
    value: 'fraud_indicator', 
    label: 'Indikator Risiko Fraud', 
    darkColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    lightColor: 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
  },
  { 
    value: 'repeated_upcoding', 
    label: 'Pola Upcoding Berulang', 
    darkColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    lightColor: 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
  },
  { 
    value: 'resume_discrepancy', 
    label: 'Diskrepansi Resume Medis', 
    darkColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    lightColor: 'bg-orange-50 text-orange-900 border-orange-300 font-bold'
  },
  { 
    value: 'presence_denial', 
    label: 'Sangkalan Presensi Peserta', 
    darkColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    lightColor: 'bg-red-50 text-red-900 border-red-300 font-bold'
  },
  { 
    value: 'security_alert', 
    label: 'Peringatan Keamanan Klaim', 
    darkColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    lightColor: 'bg-purple-50 text-purple-900 border-purple-300 font-bold'
  },
  { 
    value: 'compliance_verified', 
    label: 'Kepatuhan Terverifikasi', 
    darkColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    lightColor: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
  },
];

const INITIAL_FLAGS = [
  {
    id: 501,
    session_id: 'SEP-0114R0010326V008291 · Sesi Audit #AUD-9921',
    user_id: 10293,
    peserta_name: 'Tn. Bambang Suryanto (0001829348122)',
    fkrtl: 'RSUD Dr. Soetomo Surabaya',
    ina_cbg: 'I-4-10-III (Infark Miokard Akut - Berat)',
    tarif_selisih: 'Rp 9.450.000',
    reason: 'Peningkatan derajat keparahan INA-CBG ke Level III tanpa bukti penunjang Troponin I serial dan hasil ekokardiografi pada berkas klaim elektronik.',
    status: 'open',
    flagged_by_admin_id: 1,
    flagged_by_name: 'dr. Arief Pratama, Sp.KP (Verifikator Utama)',
    created_at: new Date(Date.now() - 42 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60000).toISOString(),
    tags: ['fraud_indicator', 'repeated_upcoding', 'kardiologi-level-3'],
    notes: 'Perlu klarifikasi langsung dengan DPJP Kardiologi dan Tim Casemix RSUD Dr. Soetomo sebelum batas SLA 10 hari kerja.'
  },
  {
    id: 502,
    session_id: 'SEP-0301R0120326V001044 · Sesi Lapis 3 #MJK-4410',
    user_id: 20481,
    peserta_name: 'Ny. Siti Aminah (0002938471920)',
    fkrtl: 'RSUP Dr. Hasan Sadikin Bandung',
    ina_cbg: 'K-4-17-I (Nyeri Abdomen & Gastroenteritis)',
    tarif_selisih: 'Rp 4.280.000',
    reason: 'Peserta menekan tombol "Bukan Saya / Sangkalan Presensi" pada notifikasi real-time Mobile JKN untuk klaim rawat inap 3 hari.',
    status: 'open',
    flagged_by_admin_id: 2,
    flagged_by_name: 'Sentinel-AI Engine Lapis 3',
    created_at: new Date(Date.now() - 3.2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1.1 * 3600000).toISOString(),
    tags: ['presence_denial', 'fraud_indicator', 'phantom-billing-alert'],
    notes: 'Log geolokasi Mobile JKN menunjukkan peserta berada di luar kota saat tanggal admisi SEP diterbitkan. Eskalasi ke Tim Pencegahan Kecurangan (PK-JKN).'
  },
  {
    id: 503,
    session_id: 'SEP-0092R0040326V004912 · Sesi Audit #AUD-9884',
    user_id: 30912,
    peserta_name: 'Tn. Hendra Wijaya (0008391029384)',
    fkrtl: 'RSUPN Dr. Cipto Mangunkusumo (RSCM)',
    ina_cbg: 'J-1-20-II (Pneumonia Komunitas dgn Komorbid)',
    tarif_selisih: 'Rp 3.120.000',
    reason: 'Diskrepansi antara diagnosis sekunder J96.0 (Gagal Napas Akut) di lembar koding INA-CBG dengan catatan SOAP perawat yang mencatat saturasi O2 98% udara ruang.',
    status: 'reviewed',
    flagged_by_admin_id: 1,
    flagged_by_name: 'dr. Nadia Kusuma, M.Kes',
    created_at: new Date(Date.now() - 9.5 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2.4 * 3600000).toISOString(),
    tags: ['resume_discrepancy', 'audit-pnpk-paru'],
    notes: 'Sudah dikirimkan Berita Acara Konfirmasi Koding (BAKK) ke bagian rekam medis RSCM. Menunggu unggahan hasil analisis gas darah (AGD).'
  },
  {
    id: 504,
    session_id: 'SEP-0211R0080326V003118 · Sesi Audit #AUD-9810',
    user_id: 49102,
    peserta_name: 'An. Rafa Putra Pratama (0004920192831)',
    fkrtl: 'RSUP Dr. Sardjito Yogyakarta',
    ina_cbg: 'P-8-08-II (Observasi Neonatus & Fototerapi)',
    tarif_selisih: 'Rp 1.850.000',
    reason: 'Anomali frekuensi klaim fisioterapi/fototerapi berulang dalam siklus 14 hari pada nomor kartu JKN yang sama (indikasi fragmentasi layanan).',
    status: 'reviewed',
    flagged_by_admin_id: 3,
    flagged_by_name: 'dr. Bima Sakti, Sp.A (Auditor Klinis)',
    created_at: new Date(Date.now() - 22 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    tags: ['repeated_upcoding', 'security_alert'],
    notes: 'Sedang ditinjau kesesuaian indikasi rawat ulang berdasarkan pedoman IDAI dan Peraturan BPJS Kesehatan.'
  },
  {
    id: 505,
    session_id: 'SEP-0188R0020326V007721 · Sesi Audit #AUD-9742',
    user_id: 58201,
    peserta_name: 'Ny. Ratna Dewi Lestari (0007182930192)',
    fkrtl: 'RSUP Fatmawati Jakarta',
    ina_cbg: 'M-1-40-I (Tindakan Artroskopi Lutut)',
    tarif_selisih: 'Rp 0 (Terverifikasi Sesuai)',
    reason: 'Penandaan otomatis untuk verifikasi kelengkapan laporan operasi implan ortopedi dan kesesuaian e-Katalog.',
    status: 'resolved',
    flagged_by_admin_id: 1,
    flagged_by_name: 'dr. Arief Pratama, Sp.KP',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 3600000).toISOString(),
    tags: ['compliance_verified', 'ortopedi-ekatalog'],
    notes: 'Faktur implan dan laporan operasi telah diverifikasi lengkap. Klaim disetujui masuk ke Berita Acara Hasil Verifikasi (BAHV).'
  }
];

export default function FlaggedSessionsView({ onNavigateTab, onSelectCase, isLight: propIsLight }) {
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

  const [flags, setFlags] = useState(INITIAL_FLAGS);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection states for bulk operations
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Detail/edit modal states
  const [expandedId, setExpandedId] = useState(501);
  const [editNotes, setEditNotes] = useState(INITIAL_FLAGS[0].notes || '');
  const [editReason, setEditReason] = useState(INITIAL_FLAGS[0].reason || '');
  const [editTags, setEditTags] = useState(INITIAL_FLAGS[0].tags || []);
  const [customTag, setCustomTag] = useState('');

  // Bulk tag modal state
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [bulkTagsToAdd, setBulkTagsToAdd] = useState([]);
  const [bulkActionMessage, setBulkActionMessage] = useState(null);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 350);
  };

  // Filtered flags
  const filteredFlags = useMemo(() => {
    return flags.filter((flag) => {
      if (statusFilter !== 'all' && flag.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'all' && (!flag.tags || !flag.tags.includes(categoryFilter))) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchSession = flag.session_id.toLowerCase().includes(q);
        const matchReason = flag.reason?.toLowerCase().includes(q);
        const matchNotes = flag.notes?.toLowerCase().includes(q);
        const matchFkrtl = flag.fkrtl?.toLowerCase().includes(q);
        const matchPeserta = flag.peserta_name?.toLowerCase().includes(q);
        if (!matchSession && !matchReason && !matchNotes && !matchFkrtl && !matchPeserta) {
          return false;
        }
      }
      return true;
    });
  }, [flags, statusFilter, categoryFilter, searchQuery]);

  // Stats counts
  const stats = useMemo(() => {
    return {
      total: flags.length,
      open: flags.filter((f) => f.status === 'open').length,
      reviewed: flags.filter((f) => f.status === 'reviewed').length,
      resolved: flags.filter((f) => f.status === 'resolved').length,
    };
  }, [flags]);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFlags.length && filteredFlags.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFlags.map((f) => f.id)));
    }
  };

  const openDetail = (flag) => {
    if (expandedId === flag.id) {
      setExpandedId(null);
    } else {
      setExpandedId(flag.id);
      setEditNotes(flag.notes || '');
      setEditReason(flag.reason || '');
      setEditTags(flag.tags || []);
    }
  };

  const handleSaveDetail = (flagId) => {
    setFlags((prev) =>
      prev.map((f) =>
        f.id === flagId
          ? {
              ...f,
              reason: editReason || null,
              notes: editNotes || null,
              tags: editTags,
              updated_at: new Date().toISOString(),
            }
          : f
      )
    );
    setExpandedId(null);
    setBulkActionMessage(`Detail penandaan sesi #${flagId} berhasil diperbarui.`);
    setTimeout(() => setBulkActionMessage(null), 3500);
  };

  const handleQuickStatusToggle = (flag) => {
    const nextStatus =
      flag.status === 'open' ? 'reviewed' : flag.status === 'reviewed' ? 'resolved' : 'open';
    setFlags((prev) =>
      prev.map((f) =>
        f.id === flag.id ? { ...f, status: nextStatus, updated_at: new Date().toISOString() } : f
      )
    );
  };

  const handleBulkClose = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    setFlags((prev) =>
      prev.map((f) =>
        selectedIds.has(f.id)
          ? { ...f, status: 'resolved', updated_at: new Date().toISOString() }
          : f
      )
    );
    setSelectedIds(new Set());
    setBulkActionMessage(`${count} sesi klaim yang ditandai berhasil ditutup (Selesai).`);
    setTimeout(() => setBulkActionMessage(null), 3500);
  };

  const handleBulkTag = () => {
    if (selectedIds.size === 0 || bulkTagsToAdd.length === 0) return;
    const count = selectedIds.size;
    setFlags((prev) =>
      prev.map((f) =>
        selectedIds.has(f.id)
          ? {
              ...f,
              tags: Array.from(new Set([...(f.tags || []), ...bulkTagsToAdd])),
              updated_at: new Date().toISOString(),
            }
          : f
      )
    );
    setShowBulkTagModal(false);
    setBulkTagsToAdd([]);
    setSelectedIds(new Set());
    setBulkActionMessage(`Kategori tag berhasil ditambahkan ke ${count} sesi klaim.`);
    setTimeout(() => setBulkActionMessage(null), 3500);
  };

  const toggleEditTag = (tag) => {
    if (editTags.includes(tag)) {
      setEditTags(editTags.filter((t) => t !== tag));
    } else {
      setEditTags([...editTags, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim().toLowerCase().replace(/\s+/g, '-');
    if (trimmed && !editTags.includes(trimmed)) {
      setEditTags([...editTags, trimmed]);
      setCustomTag('');
    }
  };

  const getCategoryInfo = (tag) => {
    const found = PREDEFINED_CATEGORIES.find((c) => c.value === tag);
    if (found) {
      return {
        value: found.value,
        label: found.label,
        color: isLight ? found.lightColor : found.darkColor
      };
    }
    return {
      value: tag,
      label: tag,
      color: isLight ? 'bg-slate-100 text-slate-800 border-slate-300 font-medium' : 'bg-white/10 text-white/70 border-white/10',
    };
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return {
          bg: isLight
            ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30',
          icon: <AlertTriangle className={`w-3.5 h-3.5 ${isLight ? 'text-amber-800' : 'text-amber-400'}`} />,
          label: 'Terbuka (Open)',
        };
      case 'reviewed':
        return {
          bg: isLight
            ? 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100'
            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30',
          icon: <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-sky-700' : 'text-cyan-400'}`} />,
          label: 'Ditinjau (Reviewed)',
        };
      case 'resolved':
        return {
          bg: isLight
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30',
          icon: <CheckCircle2 className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />,
          label: 'Selesai (Resolved)',
        };
      default:
        return {
          bg: isLight
            ? 'bg-slate-100 text-slate-800 border-slate-300'
            : 'bg-white/10 text-white/70 border-white/10',
          icon: null,
          label: status,
        };
    }
  };

  return (
    <div className={`space-y-6 pb-20 animate-fade-in ${isLight ? 'text-slate-800' : 'text-white'}`}>
      {/* Header & Stats Summary Card */}
      <div className={`p-6 rounded-2xl border backdrop-blur-xl transition-all ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm text-slate-800'
          : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 text-white'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md border ${
              isLight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-gradient-to-tr from-[#00134A] to-[#001D58] border-[#FFCA40]/30 text-[#FFCA40] shadow-[#FFCA40]/10'
            }`}>
              <Flag className={`w-5 h-5 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Sesi Klaim &amp; Audit Ditandai (Flagged Sessions)
                </h1>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                  isLight
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-[#FFCA40]/20 text-[#FFCA40] border-[#FFCA40]/40'
                }`}>
                  {stats.total} total
                </span>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-white/10 text-white/80 border-white/10'
                }`}>
                  MITRE ATT&CK: Anti-T1070 · MITRE F3: FA0001
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Tinjau penandaan anomali SEP, sangkalan presensi Mobile JKN Lapis 3, dan diskrepansi resume medis FKRTL anti-rekayasa.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs self-start sm:self-auto cursor-pointer border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'} ${loading ? 'animate-spin' : ''}`} />
            Segarkan (Refresh)
          </button>
        </div>

        {/* Summary Stat Pills */}
        <div className="flex flex-wrap gap-2.5 mb-5">
          <div className={`px-3.5 py-1.5 rounded-xl border text-xs flex items-center gap-2 font-medium ${
            isLight
              ? 'bg-amber-50 border-amber-300 text-slate-800'
              : 'bg-amber-500/15 border-amber-500/30 text-white/70'
          }`}>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Terbuka (Open):</span>
            <span className={`font-bold ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>{stats.open}</span>
          </div>
          <div className={`px-3.5 py-1.5 rounded-xl border text-xs flex items-center gap-2 font-medium ${
            isLight
              ? 'bg-sky-50 border-sky-300 text-slate-800'
              : 'bg-blue-500/15 border-blue-500/30 text-white/70'
          }`}>
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>Ditinjau (Reviewed):</span>
            <span className={`font-bold ${isLight ? 'text-sky-900' : 'text-blue-300'}`}>{stats.reviewed}</span>
          </div>
          <div className={`px-3.5 py-1.5 rounded-xl border text-xs flex items-center gap-2 font-medium ${
            isLight
              ? 'bg-emerald-50 border-emerald-300 text-slate-800'
              : 'bg-emerald-500/15 border-emerald-500/30 text-white/70'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Selesai (Resolved):</span>
            <span className={`font-bold ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>{stats.resolved}</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isLight ? 'text-slate-400' : 'text-white/40'
            }`} />
            <input aria-label="Cari berdasarkan ID SEP/sesi, FKRTL, alasan penandaan, atau catatan klinis..."
              type="text"
              placeholder="Cari berdasarkan ID SEP/sesi, FKRTL, alasan penandaan, atau catatan klinis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 text-sm rounded-xl border focus:outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500'
                  : 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-[#FFCA40]/60'
              }`}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter berdasarkan status"
            className={`px-3.5 py-2 text-sm rounded-xl font-semibold border focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
                : 'bg-[#00134A] border-white/10 text-white focus:border-[#FFCA40]/60'
            }`}
          >
            <option value="all">Semua Status (All Status)</option>
            <option value="open">Terbuka (Open)</option>
            <option value="reviewed">Ditinjau (Reviewed)</option>
            <option value="resolved">Selesai (Resolved)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter berdasarkan kategori"
            className={`px-3.5 py-2 text-sm rounded-xl font-semibold border focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
                : 'bg-[#00134A] border-white/10 text-white focus:border-[#FFCA40]/60'
            }`}
          >
            <option value="all">Semua Kategori (All Categories)</option>
            {PREDEFINED_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Actions Bar */}
        {filteredFlags.length > 0 && (
          <div className={`flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}>
            <div className="flex items-center gap-3">
              <label className={`flex items-center gap-2 text-xs font-bold cursor-pointer ${
                isLight ? 'text-slate-700' : 'text-white/70'
              }`}>
                <input aria-label="Kotak centang opsi"
                  type="checkbox"
                  checked={selectedIds.size === filteredFlags.length && filteredFlags.length > 0}
                  onChange={toggleSelectAll}
                  className={`rounded cursor-pointer ${
                    isLight
                      ? 'border-slate-300 text-emerald-600 focus:ring-emerald-500'
                      : 'border-white/20 bg-white/10 text-[#FFCA40] focus:ring-[#FFCA40]/40'
                  }`}
                />
                Pilih semua ({selectedIds.size} terpilih)
              </label>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkClose}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  Tutup Terpilih ({selectedIds.size})
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkTagModal(true)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                    isLight
                      ? 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100'
                      : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/40'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  Tambah Tag ({selectedIds.size})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Action Feedback Toast */}
      {bulkActionMessage && (
        <div className={`rounded-xl px-4 py-3 text-xs font-bold flex items-center justify-between border shadow-sm ${
          isLight
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{bulkActionMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBulkActionMessage(null)}
            className="hover:underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Flags List Card */}
      <div className={`p-6 rounded-2xl border backdrop-blur-xl transition-all ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm text-slate-800'
          : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 text-white'
      }`}>
        {filteredFlags.length === 0 ? (
          <div className="text-center py-12">
            <Flag className={`w-12 h-12 mx-auto mb-3 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
            <div className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
              {flags.length === 0
                ? 'Belum ada sesi klaim yang ditandai.'
                : 'Tidak ada penandaan sesi yang cocok dengan filter Anda.'}
            </div>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Coba ubah filter status, kategori temuan, atau kata kunci pencarian di atas.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredFlags.map((flag) => {
              const isExpanded = expandedId === flag.id;
              const isSelected = selectedIds.has(flag.id);
              const badge = getStatusBadge(flag.status);

              return (
                <div
                  key={flag.id}
                  className={`rounded-2xl border transition-all ${
                    isSelected
                      ? isLight
                        ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-200 shadow-xs'
                        : 'bg-white/10 border-[#FFCA40]/50 shadow-md shadow-[#00081c]/50'
                      : isLight
                        ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  {/* Main Row */}
                  <div className="p-4 flex items-start gap-3.5">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(flag.id)}
                      aria-label={`Pilih penandaan ${flag.id}`}
                      className={`mt-1 rounded cursor-pointer ${
                        isLight
                          ? 'border-slate-300 text-emerald-600 focus:ring-emerald-500'
                          : 'border-white/20 bg-white/10 text-[#FFCA40] focus:ring-[#FFCA40]/40'
                      }`}
                    />

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {/* Quick Status Cycle Button */}
                        <button
                          type="button"
                          onClick={() => handleQuickStatusToggle(flag)}
                          title="Klik untuk mengganti status penandaan (Terbuka → Ditinjau → Selesai)"
                          className={`text-xs px-2.5 py-1 rounded-xl border font-bold transition flex items-center gap-1.5 cursor-pointer ${badge.bg}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </button>

                        {/* Session / SEP ID */}
                        <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-xl border ${
                          isLight
                            ? 'bg-slate-100 text-slate-800 border-slate-200'
                            : 'bg-white/5 text-[#FFCA40] border-white/10'
                        }`}>
                          {flag.session_id}
                        </span>

                        {/* FKRTL Badge */}
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-xl border ${
                          isLight
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {flag.fkrtl}
                        </span>

                        {/* Discrepancy Value */}
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-xl border ${
                          isLight
                            ? 'bg-rose-50 text-rose-900 border-rose-300'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          Eksposur: {flag.tarif_selisih}
                        </span>

                        {/* Action Links */}
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectCase) {
                                const sepMatch = flag.session_id.match(/SEP-([A-Za-z0-9]+)/);
                                onSelectCase(sepMatch ? sepMatch[1] : `CLM-2026-${flag.id}`);
                              } else if (onNavigateTab) {
                                onNavigateTab('cases_mgmt');
                              }
                            }}
                            className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-xl transition cursor-pointer ${
                              isLight
                                ? 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
                                : 'text-[#FFCA40] hover:text-[#FFE08C] hover:bg-white/10'
                            }`}
                          >
                            <ExternalLink className="w-3 h-3" />
                            Lihat Berkas SEP
                          </button>

                          <button
                            type="button"
                            onClick={() => openDetail(flag)}
                            className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-xl border transition cursor-pointer ${
                              isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                                : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
                            }`}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" />
                                Ciutkan
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" />
                                Perluas
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Sub-row: Peserta & INA-CBG */}
                      <div className={`text-xs mb-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 ${
                        isLight ? 'text-slate-600' : 'text-white/60'
                      }`}>
                        <span>
                          Peserta: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>{flag.peserta_name}</strong>
                        </span>
                        <span>
                          Grouping: <strong className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{flag.ina_cbg}</strong>
                        </span>
                      </div>

                      {/* Reason */}
                      <div className={`text-sm font-semibold mb-2 leading-relaxed ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        {flag.reason || <span className="italic opacity-50">Tidak ada alasan penandaan</span>}
                      </div>

                      {/* Tags */}
                      {flag.tags && flag.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {flag.tags.map((tag) => {
                            const catInfo = getCategoryInfo(tag);
                            return (
                              <span
                                key={tag}
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${catInfo.color}`}
                              >
                                {catInfo.label}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Notes Preview */}
                      {flag.notes && !isExpanded && (
                        <div className={`text-xs rounded-xl px-3 py-1.5 mb-2 truncate border ${
                          isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-700'
                            : 'bg-white/5 border-white/10 text-white/80'
                        }`}>
                          <span className={`font-bold ${isLight ? 'text-emerald-800' : 'text-[#FFCA40]'}`}>Catatan Verifikator: </span>
                          {flag.notes}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className={`text-[11px] flex flex-wrap gap-4 font-medium ${
                        isLight ? 'text-slate-500' : 'text-white/50'
                      }`}>
                        <span>Ditandai: {new Date(flag.created_at).toLocaleString('id-ID')}</span>
                        <span>Diperbarui: {new Date(flag.updated_at).toLocaleString('id-ID')}</span>
                        {flag.flagged_by_name && <span>Oleh: {flag.flagged_by_name}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail/Edit Section */}
                  {isExpanded && (
                    <div className={`px-5 pb-5 pt-3 border-t rounded-b-2xl space-y-4 ${
                      isLight
                        ? 'bg-slate-50/80 border-slate-200 text-slate-800'
                        : 'bg-[#00134A]/80 border-white/10 text-white'
                    }`}>
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                          isLight ? 'text-slate-700' : 'text-white/80'
                        }`}>
                          Alasan Penandaan Sesi / Klaim (Flag Reason)
                        </label>
                        <input aria-label="Bidang input data"
                          type="text"
                          value={editReason}
                          onChange={(e) => setEditReason(e.target.value)}
                          placeholder="Masukkan alasan penandaan klaim..."
                          className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none transition ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                              : 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-[#FFCA40]/60'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                          isLight ? 'text-slate-700' : 'text-white/80'
                        }`}>
                          Catatan Audit Verifikator (Clinical & Fraud Notes)
                        </label>
                        <textarea
                          rows={3}
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Tambahkan catatan hasil konfirmasi DPJP, temuan rekam medis, atau instruksi tindak lanjut..."
                          className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none transition ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                              : 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-[#FFCA40]/60'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                          isLight ? 'text-slate-700' : 'text-white/80'
                        }`}>
                          Kategori & Tag Temuan Audit
                        </label>

                        {/* Predefined Categories */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {PREDEFINED_CATEGORIES.map((cat) => {
                            const isActive = editTags.includes(cat.value);
                            const activeClass = isLight ? cat.lightColor : cat.darkColor;
                            return (
                              <button
                                key={cat.value}
                                type="button"
                                onClick={() => toggleEditTag(cat.value)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition cursor-pointer ${
                                  isActive
                                    ? `${activeClass} ring-2 ring-emerald-300 dark:ring-[#FFCA40]/40 shadow-xs`
                                    : isLight
                                      ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                      : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                                }`}
                              >
                                {isActive ? '✓ ' : '+ '}
                                {cat.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Custom tags */}
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {editTags
                            .filter((t) => !PREDEFINED_CATEGORIES.some((c) => c.value === t))
                            .map((tag) => (
                              <span
                                key={tag}
                                className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 font-bold ${
                                  isLight
                                    ? 'bg-white text-slate-800 border-slate-200 shadow-xs'
                                    : 'bg-white/10 text-white/80 border-white/10'
                                }`}
                              >
                                #{tag}
                                <button
                                  type="button"
                                  onClick={() => toggleEditTag(tag)}
                                  className="text-slate-400 hover:text-rose-600 dark:text-white/40 dark:hover:text-rose-400 cursor-pointer ml-0.5"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                        </div>

                        {/* Add custom tag input */}
                        <div className="flex gap-2">
                          <input aria-label="Bidang input data"
                            type="text"
                            value={customTag}
                            onChange={(e) => setCustomTag(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                            placeholder="Tambah tag audit kustom (mis. pnpk-sepsis, klaim-pending)..."
                            className={`flex-1 px-3.5 py-1.5 text-xs rounded-xl border focus:outline-none transition ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                                : 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-[#FFCA40]/60'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={addCustomTag}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                              isLight
                                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                                : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                            }`}
                          >
                            Tambah Tag
                          </button>
                        </div>
                      </div>

                      <div className={`flex justify-end gap-2 pt-2 border-t ${
                        isLight ? 'border-slate-200' : 'border-white/10'
                      }`}>
                        <button
                          type="button"
                          onClick={() => setExpandedId(null)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                            isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                              : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
                          }`}
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveDetail(flag.id)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer ${
                            isLight
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/10'
                              : 'bg-gradient-to-tr from-health-blue-dark to-health-blue hover:from-health-blue hover:to-health-blue-light border border-[#FFCA40]/40 text-[#FFCA40]'
                          }`}
                        >
                          Simpan Perubahan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bulk Tag Modal */}
      {showBulkTagModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={`border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#00153A] border-white/20 text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Tambah Tag ke {selectedIds.size} Sesi Klaim Terpilih
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowBulkTagModal(false);
                  setBulkTagsToAdd([]);
                }}
                className={`p-1 rounded-xl cursor-pointer ${
                  isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {PREDEFINED_CATEGORIES.map((cat) => {
                const isSelected = bulkTagsToAdd.includes(cat.value);
                const activeColor = isLight ? cat.lightColor : cat.darkColor;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setBulkTagsToAdd(bulkTagsToAdd.filter((t) => t !== cat.value));
                      } else {
                        setBulkTagsToAdd([...bulkTagsToAdd, cat.value]);
                      }
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border transition cursor-pointer ${
                      isSelected
                        ? `${activeColor} ring-2 ring-emerald-300 dark:ring-[#FFCA40]/40 shadow-xs`
                        : isLight
                          ? 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                          : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className={`flex justify-end gap-2 pt-3 border-t ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setShowBulkTagModal(false);
                  setBulkTagsToAdd([]);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBulkTag}
                disabled={bulkTagsToAdd.length === 0}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition disabled:opacity-40 cursor-pointer shadow-sm ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/10'
                    : 'bg-gradient-to-tr from-health-blue-dark to-health-blue hover:from-health-blue hover:to-health-blue-light border border-[#FFCA40]/40 text-[#FFCA40]'
                }`}
              >
                Terapkan Tag ({bulkTagsToAdd.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
