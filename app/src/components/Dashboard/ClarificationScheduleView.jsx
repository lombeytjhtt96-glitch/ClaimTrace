import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  ChevronRight,
  Building2,
  ShieldCheck,
  X,
  ExternalLink,
  Printer
} from 'lucide-react';

/**
 * ClarificationScheduleView:
 * Dual-Themed (Cosmic Obsidian & Clinical White)
 * Jadwal Klarifikasi & Sidang Audit Medis Klaim (Appointments).
 */

const INITIAL_APPOINTMENTS = [
  {
    id: 801,
    user_id: 10293,
    psychologist_id: 201,
    appointment_datetime: new Date(Date.now() + 2.5 * 3600000).toISOString(),
    notes: 'Klarifikasi peningkatan severity level INA-CBG I-4-10-III pada SEP-0114R0010326V008291. Tim Casemix diminta menyiapkan hasil Troponin I serial dan laporan Ekokardiografi.',
    status: 'scheduled',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    user: {
      id: 10293,
      name: 'RSUD Dr. Soetomo · dr. Hendra Sp.JP (DPJP)',
      email: 'casemix.soetomo@rsudsoetomo.jatimprov.go.id',
      student_id: 'FKRTL-1301R001 · SEP #008291'
    },
    psychologist: {
      id: 201,
      name: 'dr. Arief Pratama, Sp.KP (Verifikator Utama)',
      specialization: 'Verifikasi Klaim Kardiologi & Kardiovaskular',
      image_url: null
    },
    appointment_type: {
      id: 1,
      name: 'Klarifikasi Koding INA-CBG',
      duration_minutes: 45,
      description: 'Pertemuan daring konfirmasi kode diagnosis primer/sekunder dan prosedur ICD-9-CM sesuai kaidah PMK 26/2021.'
    }
  },
  {
    id: 802,
    user_id: 20481,
    psychologist_id: 202,
    appointment_datetime: new Date(Date.now() + 6 * 3600000).toISOString(),
    notes: 'Audit investigasi sangkalan presensi Mobile JKN Lapis 3 oleh peserta Ny. Siti Aminah (SEP-0301R0120326V001044). Konfirmasi bukti admisi rawat inap dan log sidik jari biometrik VClaim.',
    status: 'scheduled',
    created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    user: {
      id: 20481,
      name: 'RSUP Dr. Hasan Sadikin · Tim Anti-Fraud RS',
      email: 'jkn.rshs@rshs.or.id',
      student_id: 'FKRTL-1001R002 · SEP #001044'
    },
    psychologist: {
      id: 202,
      name: 'dr. Nadia Kusuma, M.Kes (Tim PK-JKN)',
      specialization: 'Investigasi Anomali Biometrik & Presensi Lapis 3',
      image_url: null
    },
    appointment_type: {
      id: 2,
      name: 'Audit Klinis PNPK & Presensi Lapis 3',
      duration_minutes: 60,
      description: 'Sesi gelar perkara klaim berisiko tinggi (High-Risk Flag) bersama Tim Pencegahan Kecurangan JKN.'
    }
  },
  {
    id: 803,
    user_id: 30912,
    psychologist_id: 203,
    appointment_datetime: new Date(Date.now() + 26 * 3600000).toISOString(),
    notes: 'Pembahasan berkas klaim pending (BAKK) terkait diagnosis sekunder Gagal Napas Akut (J96.0) pada pasien Pneumonia Komunitas. Evaluasi hasil Analisis Gas Darah (AGD).',
    status: 'scheduled',
    created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    user: {
      id: 30912,
      name: 'RSUPN Dr. Cipto Mangunkusumo · dr. Lukman Sp.P',
      email: 'instalasi.jkn@rscm.co.id',
      student_id: 'FKRTL-0901R001 · SEP #004912'
    },
    psychologist: {
      id: 203,
      name: 'Prof. dr. Rahmat Hidayat, Sp.PD (Ketua TKMKB)',
      specialization: 'Tim Kendali Mutu & Kendali Biaya (TKMKB) Provinsi',
      image_url: null
    },
    appointment_type: {
      id: 3,
      name: 'Sidang Komite Medis & TKMKB',
      duration_minutes: 90,
      description: 'Penyelesaian sengketa klinis (clinical dispute) antara FKRTL dan BPJS Kesehatan bersama panel ahli TKMKB.'
    }
  },
  {
    id: 804,
    user_id: 49102,
    psychologist_id: 204,
    appointment_datetime: new Date(Date.now() - 20 * 3600000).toISOString(),
    notes: 'Rekonsiliasi klaim rawat jalan berulang rehabilitasi medik dan fototerapi neonatus. Disepakati penyesuaian 4 berkas SEP sesuai protokol frekuensi layanan per minggu.',
    status: 'completed',
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 19 * 3600000).toISOString(),
    user: {
      id: 49102,
      name: 'RSUP Dr. Sardjito · Unit Penjaminan JKN',
      email: 'casemix@sardjito.co.id',
      student_id: 'FKRTL-1201R004 · SEP #003118'
    },
    psychologist: {
      id: 204,
      name: 'dr. Bima Sakti, Sp.A (Auditor Klinis)',
      specialization: 'Verifikasi Klaim Pediatri & Perinatologi',
      image_url: null
    },
    appointment_type: {
      id: 4,
      name: 'Konfirmasi Klaim Pending (BAKK)',
      duration_minutes: 30,
      description: 'Konfirmasi kelengkapan dokumen administrasi dan resume medis untuk pencairan klaim pending.'
    }
  },
  {
    id: 805,
    user_id: 58201,
    psychologist_id: 201,
    appointment_datetime: new Date(Date.now() - 52 * 3600000).toISOString(),
    notes: 'Dibatalkan karena FKRTL telah mengunggah faktur e-Katalog implan ortopedi dan laporan operasi lengkap sebelum jadwal klarifikasi berlangsung (otomatis disetujui BAHV).',
    status: 'cancelled',
    created_at: new Date(Date.now() - 96 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 50 * 3600000).toISOString(),
    user: {
      id: 58201,
      name: 'RSUP Fatmawati · dr. Dimas Sp.OT',
      email: 'klaim.jkn@rsupfatmawati.id',
      student_id: 'FKRTL-0902R007 · SEP #007721'
    },
    psychologist: {
      id: 201,
      name: 'dr. Arief Pratama, Sp.KP (Verifikator Utama)',
      specialization: 'Verifikasi Klaim Bedah & Ortopedi',
      image_url: null
    },
    appointment_type: {
      id: 4,
      name: 'Konfirmasi Klaim Pending (BAKK)',
      duration_minutes: 30,
      description: 'Konfirmasi kelengkapan dokumen administrasi dan resume medis untuk pencairan klaim pending.'
    }
  }
];

export default function ClarificationScheduleView({ onNavigateTab, onSelectCase, isLight: propIsLight }) {
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

  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Auto-dismiss Toast Feedback setelah 3.5 detik
  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => {
      setToastMsg(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('upcoming'); 
  const [selectedDateFrom, setSelectedDateFrom] = useState('');
  const [selectedDateTo, setSelectedDateTo] = useState('');

  // View state
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 350);
  };

  // Unique appointment types
  const appointmentTypes = useMemo(() => {
    const types = new Map();
    appointments.forEach((apt) => {
      if (apt.appointment_type) {
        types.set(apt.appointment_type.id, apt.appointment_type.name);
      }
    });
    return Array.from(types.entries()).map(([id, name]) => ({ id, name }));
  }, [appointments]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.user?.name?.toLowerCase().includes(q) ||
          apt.user?.email?.toLowerCase().includes(q) ||
          apt.user?.student_id?.toLowerCase().includes(q) ||
          apt.psychologist?.name?.toLowerCase().includes(q) ||
          apt.psychologist?.specialization?.toLowerCase().includes(q) ||
          apt.appointment_type?.name?.toLowerCase().includes(q) ||
          apt.notes?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((apt) => apt.appointment_type?.id?.toString() === typeFilter);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateFilter === 'today') {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointment_datetime);
        return aptDate >= today && aptDate < tomorrow;
      });
    } else if (dateFilter === 'upcoming') {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointment_datetime);
        return aptDate >= now;
      });
    } else if (dateFilter === 'past') {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointment_datetime);
        return aptDate < now;
      });
    }

    if (selectedDateFrom) {
      const fromDate = new Date(selectedDateFrom);
      filtered = filtered.filter((apt) => new Date(apt.appointment_datetime) >= fromDate);
    }
    if (selectedDateTo) {
      const toDate = new Date(selectedDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((apt) => new Date(apt.appointment_datetime) <= toDate);
    }

    filtered.sort(
      (a, b) => new Date(b.appointment_datetime).getTime() - new Date(a.appointment_datetime).getTime()
    );

    return filtered;
  }, [appointments, searchQuery, statusFilter, typeFilter, dateFilter, selectedDateFrom, selectedDateTo]);

  // Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const total = appointments.length;
    const scheduled = appointments.filter((a) => a.status === 'scheduled').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
    const upcoming = appointments.filter(
      (a) => new Date(a.appointment_datetime) >= now && a.status === 'scheduled'
    ).length;

    return { total, scheduled, completed, cancelled, upcoming };
  }, [appointments]);

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return {
          icon: <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-blue-700' : 'text-blue-300'}`} />,
          label: 'Terjadwal (Scheduled)',
          className: isLight
            ? 'bg-blue-50 text-blue-900 border-blue-300'
            : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`} />,
          label: 'Selesai (Completed)',
          className: isLight
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
        };
      case 'cancelled':
        return {
          icon: <XCircle className={`w-3.5 h-3.5 ${isLight ? 'text-rose-700' : 'text-rose-300'}`} />,
          label: 'Dibatalkan (Cancelled)',
          className: isLight
            ? 'bg-rose-50 text-rose-900 border-rose-300'
            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        };
      case 'no_show':
        return {
          icon: <AlertCircle className={`w-3.5 h-3.5 ${isLight ? 'text-amber-800' : 'text-[#FFCA40]'}`} />,
          label: 'Tidak Hadir (No Show)',
          className: isLight
            ? 'bg-amber-50 text-amber-900 border-amber-300'
            : 'bg-amber-500/10 text-[#FFCA40] border-amber-500/30'
        };
      default:
        return {
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          label: status,
          className: isLight
            ? 'bg-slate-100 text-slate-800 border-slate-300'
            : 'bg-white/10 text-white/70 border-white/20'
        };
    }
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('id-ID', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time:
        date.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        }) + ' WIB',
      relative: getRelativeTime(date)
    };
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMs < 0) {
      const absDays = Math.abs(diffDays);
      if (absDays === 0) return 'Hari ini (Lampau)';
      if (absDays === 1) return 'Kemarin';
      if (absDays < 7) return `${absDays} hari lalu`;
      return `${Math.floor(absDays / 7)} minggu lalu`;
    } else {
      if (diffMinutes < 60) return `Dalam ${diffMinutes} menit`;
      if (diffHours < 24) return `Dalam ${diffHours} jam`;
      if (diffDays === 0) return 'Hari ini';
      if (diffDays === 1) return 'Besok';
      return `Dalam ${diffDays} hari`;
    }
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Tanggal & Waktu',
      'FKRTL & DPJP',
      'Email Casemix',
      'Kode FKRTL / SEP',
      'Verifikator / TKMKB',
      'Spesialisasi Audit',
      'Jenis Klarifikasi',
      'Durasi (menit)',
      'Status',
      'Catatan Klarifikasi'
    ];

    const rows = filteredAppointments.map((apt) => [
      apt.id,
      apt.appointment_datetime,
      apt.user?.name || 'N/A',
      apt.user?.email || 'N/A',
      apt.user?.student_id || 'N/A',
      apt.psychologist?.name || 'N/A',
      apt.psychologist?.specialization || 'N/A',
      apt.appointment_type?.name || 'N/A',
      apt.appointment_type?.duration_minutes || 'N/A',
      apt.status,
      (apt.notes || '').replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jadwal_klarifikasi_jkn_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFilter('all');
    setSelectedDateFrom('');
    setSelectedDateTo('');
  };

  return (
    <div className={`space-y-6 pb-20 animate-fade-in ${isLight ? 'text-slate-800' : 'text-white'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Jadwal Klarifikasi &amp; Audit Medis
            </h1>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${
              isLight
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white/10 text-[#FFCA40] border-white/10'
            }`}>
              MITRE F3: FA0001 · NIST CSF 2.0: RS.CO-03
            </span>
          </div>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Kelola dan pantau seluruh jadwal klarifikasi klaim antara FKRTL/DPJP, Tim Casemix, dan Verifikator Medis BPJS Kesehatan (SOP Penanganan Fraud &amp; Rekonsiliasi).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportToCSV}
            disabled={filteredAppointments.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors disabled:opacity-50 text-xs font-bold shadow-xs cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
            }`}
          >
            <Download className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-bold shadow-xs cursor-pointer border ${
              isLight
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                : 'bg-gradient-to-tr from-health-blue-dark to-health-blue hover:from-health-blue hover:to-health-blue-light text-white border-emerald-400/40'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan (Refresh)</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            key={toastMsg}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`relative overflow-hidden px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-lg ${
              isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-emerald-950/5'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-950/40'
            }`}
          >
            <span>✓ {toastMsg}</span>
            <button 
              type="button" 
              onClick={() => setToastMsg(null)} 
              aria-label="Tutup notifikasi"
              className="cursor-pointer p-0.5 rounded hover:bg-black/5"
            >
              <X className="w-4 h-4" />
            </button>
            {/* Animasi Garis Countdown Waktu Menghilang */}
            <motion.div
              key={`progress-${toastMsg}`}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3.5, ease: "linear" }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm text-slate-800'
            : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 text-white'
        }`}>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className={`text-xs uppercase font-bold tracking-wider ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Total</span>
            <div className={`p-1.5 rounded-lg border ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
              <Calendar className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
            </div>
          </div>
          <div className={`text-2xl font-bold relative z-10 ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.total}</div>
          <div className={`text-xs mt-1 relative z-10 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Seluruh jadwal klarifikasi</div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm text-slate-800'
            : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 text-white'
        }`}>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className={`text-xs uppercase font-bold tracking-wider ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Mendatang (Upcoming)</span>
            <div className={`p-1.5 rounded-lg border ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/20 border-blue-500/30'}`}>
              <Clock className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
            </div>
          </div>
          <div className={`text-2xl font-bold relative z-10 ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.upcoming}</div>
          <div className={`text-xs mt-1 relative z-10 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Terjadwal ke depan</div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm text-slate-800'
            : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 text-white'
        }`}>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className={`text-xs uppercase font-bold tracking-wider ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Terjadwal (Scheduled)</span>
            <div className={`p-1.5 rounded-lg border ${isLight ? 'bg-cyan-50 border-cyan-200' : 'bg-cyan-500/20 border-cyan-500/30'}`}>
              <AlertCircle className={`w-4 h-4 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
            </div>
          </div>
          <div className={`text-2xl font-bold relative z-10 ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.scheduled}</div>
          <div className={`text-xs mt-1 relative z-10 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Status aktif</div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm text-slate-800'
            : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 text-white'
        }`}>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className={`text-xs uppercase font-bold tracking-wider ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Selesai (Completed)</span>
            <div className={`p-1.5 rounded-lg border ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
              <CheckCircle2 className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
            </div>
          </div>
          <div className={`text-2xl font-bold relative z-10 ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.completed}</div>
          <div className={`text-xs mt-1 relative z-10 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Berita acara selesai</div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm text-slate-800'
            : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 text-white'
        }`}>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className={`text-xs uppercase font-bold tracking-wider ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Dibatalkan (Cancelled)</span>
            <div className={`p-1.5 rounded-lg border ${isLight ? 'bg-rose-50 border-rose-200' : 'bg-rose-500/20 border-rose-500/30'}`}>
              <XCircle className={`w-4 h-4 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
            </div>
          </div>
          <div className={`text-2xl font-bold relative z-10 ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.cancelled}</div>
          <div className={`text-xs mt-1 relative z-10 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Tidak dilanjutkan</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className={`relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm text-slate-800'
          : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 text-white'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className={`w-5 h-5 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
          <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Filter Jadwal (Filters)</h2>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setDateFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              dateFilter === 'all'
                ? isLight ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-md'
                : isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            Semua (All)
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('today')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              dateFilter === 'today'
                ? isLight ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-md'
                : isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            Hari Ini (Today)
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('upcoming')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              dateFilter === 'upcoming'
                ? isLight ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-md'
                : isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            Mendatang (Upcoming)
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('past')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              dateFilter === 'past'
                ? isLight ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-md'
                : isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            Lampau (Past)
          </button>

          {(searchQuery ||
            statusFilter !== 'all' ||
            typeFilter !== 'all' ||
            dateFilter !== 'all' ||
            selectedDateFrom ||
            selectedDateTo) && (
            <button
              type="button"
              onClick={resetFilters}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ml-auto cursor-pointer border ${
                isLight
                  ? 'bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-300'
                  : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border-rose-500/20'
              }`}
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Advanced 5-Column Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isLight ? 'text-slate-400' : 'text-white/40'
            }`} />
            <input aria-label="Cari FKRTL, DPJP, verifikator..."
              type="text"
              placeholder="Cari FKRTL, DPJP, verifikator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm border focus:outline-none transition ${
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
            aria-label="Filter berdasarkan status jadwal"
            className={`px-4 py-2 rounded-xl font-semibold text-sm border focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
                : 'bg-[#00134A] border-white/10 text-white focus:border-[#FFCA40]/60'
            }`}
          >
            <option value="all">Semua Status (All Statuses)</option>
            <option value="scheduled">Terjadwal (Scheduled)</option>
            <option value="completed">Selesai (Completed)</option>
            <option value="cancelled">Dibatalkan (Cancelled)</option>
            <option value="no_show">Tidak Hadir (No Show)</option>
          </select>

          {/* Appointment Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter berdasarkan jenis klarifikasi"
            className={`px-4 py-2 rounded-xl font-semibold text-sm border focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
                : 'bg-[#00134A] border-white/10 text-white focus:border-[#FFCA40]/60'
            }`}
          >
            <option value="all">Semua Jenis (All Types)</option>
            {appointmentTypes.map((type) => (
              <option key={type.id} value={type.id.toString()}>
                {type.name}
              </option>
            ))}
          </select>

          {/* Date From */}
          <div className="relative">
            <span className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Dari Tanggal
            </span>
            <input aria-label="Dari tanggal"
              type="date"
              value={selectedDateFrom}
              onChange={(e) => setSelectedDateFrom(e.target.value)}
              title="Dari tanggal klarifikasi"
              className={`w-full px-4 py-2 rounded-xl text-sm border focus:outline-none ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
                  : 'bg-[#00134A] border-white/10 text-white focus:border-[#FFCA40]/60'
              }`}
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <span className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Sampai Tanggal
            </span>
            <input aria-label="Sampai tanggal"
              type="date"
              value={selectedDateTo}
              onChange={(e) => setSelectedDateTo(e.target.value)}
              title="Sampai tanggal klarifikasi"
              className={`w-full px-4 py-2 rounded-xl text-sm border focus:outline-none ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
                  : 'bg-[#00134A] border-white/10 text-white focus:border-[#FFCA40]/60'
              }`}
            />
          </div>
        </div>

        <div className={`mt-4 text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
          Menampilkan <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>{filteredAppointments.length}</span> dari{' '}
          <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{appointments.length}</span> jadwal klarifikasi
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <div className={`inline-flex rounded-xl border p-1 shadow-xs backdrop-blur-md ${
          isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#00153A]/90'
        }`}>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'cards'
                ? isLight ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-md'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
            }`}
          >
            Kartu (Cards)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table'
                ? isLight ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-md'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
            }`}
          >
            Daftar Tabel (List)
          </button>
        </div>
      </div>

      {/* Appointments Display */}
      {filteredAppointments.length === 0 ? (
        <div className={`relative overflow-hidden rounded-2xl border p-12 text-center backdrop-blur-xl ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#00153A]/85 border-white/10 shadow-xl'
        }`}>
          <Calendar className={`w-14 h-14 mx-auto mb-3 ${isLight ? 'text-slate-300' : 'text-white/20'}`} />
          <h3 className={`text-lg font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Tidak Ada Jadwal Klarifikasi Ditemukan</h3>
          <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            {appointments.length === 0
              ? 'Belum ada jadwal klarifikasi klaim yang terdaftar di sistem.'
              : 'Tidak ada jadwal yang cocok dengan kriteria filter Anda. Coba ubah filter di atas.'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAppointments.map((apt) => {
            const statusBadge = getStatusBadge(apt.status);
            const dateTime = formatDateTime(apt.appointment_datetime);

            return (
              <div
                key={apt.id}
                onClick={() => setSelectedAppointment(apt)}
                className={`relative overflow-hidden rounded-2xl border p-6 transition-all cursor-pointer group flex flex-col justify-between backdrop-blur-xl ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md text-slate-800 shadow-xs'
                    : 'bg-[#00153A]/85 border-white/10 hover:border-[#FFCA40]/50 hover:shadow-xl hover:shadow-[#00081c]/60 text-white'
                }`}
              >
                <div>
                  {/* Header with Status and Date */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-5 h-5 shrink-0 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
                      <div>
                        <div className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{dateTime.date}</div>
                        <div className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                          {dateTime.time} · <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>{dateTime.relative}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadge.className}`}
                    >
                      {statusBadge.icon}
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Appointment Type */}
                  {apt.appointment_type && (
                    <div className={`mb-4 pb-4 border-b ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
                      <div className={`text-xs font-bold uppercase tracking-wider ${
                        isLight ? 'text-emerald-800' : 'text-[#FFCA40]'
                      }`}>
                        {apt.appointment_type.name}
                      </div>
                      {apt.appointment_type.duration_minutes && (
                        <div className={`text-xs mt-0.5 font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                          Durasi Sesi: {apt.appointment_type.duration_minutes} menit
                        </div>
                      )}
                    </div>
                  )}

                  {/* FKRTL / DPJP Info */}
                  <div className="mb-3">
                    <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1 ${
                      isLight ? 'text-slate-500' : 'text-white/40'
                    }`}>
                      <Building2 className="w-3.5 h-3.5" />
                      <span>FKRTL &amp; DPJP Pengaju</span>
                    </div>
                    <div className={`font-bold text-sm pl-5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {apt.user?.name || `FKRTL #${apt.user_id}`}
                    </div>
                    {apt.user?.email && (
                      <div className={`text-xs pl-5 truncate ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{apt.user.email}</div>
                    )}
                    {apt.user?.student_id && (
                      <div className={`text-xs font-mono font-bold pl-5 mt-0.5 ${
                        isLight ? 'text-emerald-800' : 'text-cyan-400'
                      }`}>
                        {apt.user.student_id}
                      </div>
                    )}
                  </div>

                  {/* Verifikator / TKMKB Info */}
                  <div className="mb-4">
                    <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1 ${
                      isLight ? 'text-slate-500' : 'text-white/40'
                    }`}>
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Verifikator / Panel TKMKB</span>
                    </div>
                    <div className={`font-bold text-sm pl-5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {apt.psychologist?.name || `Verifikator #${apt.psychologist_id}`}
                    </div>
                    {apt.psychologist?.specialization && (
                      <div className={`text-xs pl-5 font-medium ${isLight ? 'text-slate-600' : 'text-white/50'}`}>{apt.psychologist.specialization}</div>
                    )}
                  </div>

                  {/* Notes Preview */}
                  {apt.notes && (
                    <div className={`mt-3 pt-3 border-t ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
                      <div className={`flex items-center gap-2 text-xs font-bold mb-1 ${
                        isLight ? 'text-slate-600' : 'text-white/50'
                      }`}>
                        <FileText className="w-3.5 h-3.5" />
                        <span>Pokok Bahasan Klaim</span>
                      </div>
                      <div className={`text-xs leading-relaxed p-2.5 rounded-lg border ${
                        isLight ? 'text-slate-700 bg-slate-50 border-slate-200' : 'text-white/80 bg-white/5 border-white/10'
                      }`}>
                        {apt.notes}
                      </div>
                    </div>
                  )}
                </div>

                {/* View Details Link */}
                <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold transition-colors ${
                  isLight
                    ? 'border-slate-100 text-emerald-700 group-hover:text-emerald-900'
                    : 'border-white/10 text-[#FFCA40] group-hover:text-amber-300'
                }`}>
                  <span>Lihat Rincian &amp; Berita Acara</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl ${
          isLight ? 'bg-white border-slate-200 shadow-sm text-slate-800' : 'bg-[#00153A]/85 border-white/10 shadow-xl text-white'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/70'
              }`}>
                <tr>
                  <th className="px-6 py-3.5 text-left">Tanggal &amp; Waktu</th>
                  <th className="px-6 py-3.5 text-left">FKRTL &amp; DPJP</th>
                  <th className="px-6 py-3.5 text-left">Verifikator / TKMKB</th>
                  <th className="px-6 py-3.5 text-left">Jenis Klarifikasi</th>
                  <th className="px-6 py-3.5 text-left">Status</th>
                  <th className="px-6 py-3.5 text-left">Pokok Bahasan</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/10'}`}>
                {filteredAppointments.map((apt) => {
                  const statusBadge = getStatusBadge(apt.status);
                  const dateTime = formatDateTime(apt.appointment_datetime);

                  return (
                    <tr
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className={`transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{dateTime.date}</div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{dateTime.time}</div>
                        <div className={`text-xs font-bold ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>{dateTime.relative}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {apt.user?.name || `FKRTL #${apt.user_id}`}
                        </div>
                        {apt.user?.email && <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{apt.user.email}</div>}
                        {apt.user?.student_id && (
                          <div className={`text-xs font-mono font-bold ${isLight ? 'text-emerald-800' : 'text-cyan-400'}`}>
                            {apt.user.student_id}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {apt.psychologist?.name || `Verifikator #${apt.psychologist_id}`}
                        </div>
                        {apt.psychologist?.specialization && (
                          <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{apt.psychologist.specialization}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-bold ${isLight ? 'text-emerald-800' : 'text-[#FFCA40]'}`}>
                          {apt.appointment_type?.name || 'N/A'}
                        </div>
                        {apt.appointment_type?.duration_minutes && (
                          <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                            {apt.appointment_type.duration_minutes} menit
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge.className}`}
                        >
                          {statusBadge.icon}
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className={`text-xs truncate ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                          {apt.notes || 'Tidak ada catatan'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <span className={`font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                          isLight ? 'text-emerald-700 hover:text-emerald-900' : 'text-[#FFCA40] hover:text-[#FFE08C]'
                        }`}>
                          Rincian
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedAppointment(null)}
        >
          <div
            className={`border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl transition-all ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#00153A] border-white/20 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-start justify-between mb-6 pb-4 border-b ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <div>
                <h2 className={`text-xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Detail Jadwal Klarifikasi Klaim
                </h2>
                <p className={`text-xs font-mono font-bold ${isLight ? 'text-emerald-800' : 'text-[#FFCA40]'}`}>
                  ID Jadwal: #{selectedAppointment.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Date & Time + Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`border rounded-xl p-4 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                    isLight ? 'text-slate-500' : 'text-white/40'
                  }`}>
                    Tanggal &amp; Waktu Sesi
                  </div>
                  <div className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {formatDateTime(selectedAppointment.appointment_datetime).date}
                  </div>
                  <div className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    {formatDateTime(selectedAppointment.appointment_datetime).time} (
                    {formatDateTime(selectedAppointment.appointment_datetime).relative})
                  </div>
                </div>

                <div className={`border rounded-xl p-4 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <div className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${
                    isLight ? 'text-slate-500' : 'text-white/40'
                  }`}>
                    Status Sesi
                  </div>
                  <div>
                    {(() => {
                      const statusBadge = getStatusBadge(selectedAppointment.status);
                      return (
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${statusBadge.className}`}
                        >
                          {statusBadge.icon}
                          {statusBadge.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Appointment Type */}
              {selectedAppointment.appointment_type && (
                <div className={`border rounded-xl p-4 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                    isLight ? 'text-emerald-800' : 'text-[#FFCA40]'
                  }`}>
                    Jenis Klarifikasi
                  </div>
                  <div className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {selectedAppointment.appointment_type.name}
                  </div>
                  {selectedAppointment.appointment_type.duration_minutes && (
                    <div className={`text-xs mt-0.5 font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                      Durasi: {selectedAppointment.appointment_type.duration_minutes} menit
                    </div>
                  )}
                  {selectedAppointment.appointment_type.description && (
                    <div className={`text-xs mt-1.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                      {selectedAppointment.appointment_type.description}
                    </div>
                  )}
                </div>
              )}

              {/* FKRTL Information */}
              <div className={`border rounded-xl p-4 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                  isLight ? 'text-slate-500' : 'text-white/40'
                }`}>
                  Informasi FKRTL &amp; DPJP Pengaju
                </div>
                <div className="space-y-1 text-sm">
                  <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {selectedAppointment.user?.name || `FKRTL #${selectedAppointment.user_id}`}
                  </div>
                  {selectedAppointment.user?.email && (
                    <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>Email Casemix: {selectedAppointment.user.email}</div>
                  )}
                  {selectedAppointment.user?.student_id && (
                    <div className={`font-mono font-bold text-xs ${isLight ? 'text-emerald-800' : 'text-cyan-400'}`}>
                      Kode FKRTL / SEP: {selectedAppointment.user.student_id}
                    </div>
                  )}
                </div>
              </div>

              {/* Verifikator Information */}
              <div className={`border rounded-xl p-4 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                  isLight ? 'text-slate-500' : 'text-white/40'
                }`}>
                  Informasi Verifikator / Panel TKMKB
                </div>
                <div className="space-y-1 text-sm">
                  <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {selectedAppointment.psychologist?.name ||
                      `Verifikator #${selectedAppointment.psychologist_id}`}
                  </div>
                  {selectedAppointment.psychologist?.specialization && (
                    <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                      Bidang Audit: {selectedAppointment.psychologist.specialization}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div>
                  <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                    isLight ? 'text-slate-500' : 'text-white/40'
                  }`}>
                    Pokok Bahasan &amp; Catatan Klarifikasi Klaim
                  </div>
                  <div className={`border rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white/80'
                  }`}>
                    {selectedAppointment.notes}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className={`pt-3 border-t grid grid-cols-2 gap-4 text-xs ${
                isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-white/40'
              }`}>
                <div>
                  <span className={`font-semibold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Dibuat:</span>{' '}
                  {new Date(selectedAppointment.created_at).toLocaleString('id-ID')}
                </div>
                <div>
                  <span className={`font-semibold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Diperbarui:</span>{' '}
                  {new Date(selectedAppointment.updated_at).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div className={`mt-6 pt-4 border-t flex flex-wrap items-center justify-between gap-3 ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const sepMatch = selectedAppointment.user?.student_id?.match(/SEP\s*#?([A-Za-z0-9]+)/i);
                    const caseTarget = sepMatch ? sepMatch[1] : `CLM-2026-${selectedAppointment.id}`;
                    setSelectedAppointment(null);
                    if (onSelectCase) {
                      onSelectCase(caseTarget);
                    } else if (onNavigateTab) {
                      onNavigateTab('investigation');
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isLight
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Tinjau Berkas SEP</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setToastMsg(`Berita Acara Klarifikasi #${selectedAppointment.id} (${selectedAppointment.appointment_type?.name}) siap diunduh / dicetak.`);
                    setTimeout(() => setToastMsg(null), 4000);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/20'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Berita Acara</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  isLight
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
