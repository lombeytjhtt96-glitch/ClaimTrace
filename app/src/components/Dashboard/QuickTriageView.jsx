import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderOpen,
  Clock,
  AlertTriangle,
  Users,
  Send,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Search,
  X,
  CheckCircle2,
  User,
} from 'lucide-react';

const INITIAL_QUEUE_CASES = [
  {
    case_id: 'CLM-2026-884120',
    sep_no: '0114R0011026V004812',
    hospital: 'RS Khusus Mitra Husada',
    severity: 'critical',
    status: 'new',
    sla_breach_at: new Date(Date.now() + 85 * 60000).toISOString(),
    assigned_to: null,
    created_at: new Date(Date.now() - 40 * 60000).toISOString(),
  },
  {
    case_id: 'CLM-2026-883904',
    sep_no: '0114R0011026V004789',
    hospital: 'RSU Harapan Bunda',
    severity: 'high',
    status: 'in_progress',
    sla_breach_at: new Date(Date.now() + 3.2 * 3600000).toISOString(),
    assigned_to: 'dr. Nadia Kusuma, Sp.PK',
    created_at: new Date(Date.now() - 2.5 * 3600000).toISOString(),
  },
  {
    case_id: 'CLM-2026-883519',
    sep_no: '0114R0011026V004650',
    hospital: 'RSUD Mitra Sehat',
    severity: 'moderate',
    status: 'in_progress',
    sla_breach_at: new Date(Date.now() + 18 * 3600000).toISOString(),
    assigned_to: 'dr. Hendra Wijaya, MARS',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    case_id: 'CLM-2026-883102',
    sep_no: '0114R0011026V004511',
    hospital: 'RS Islam Kasih Ibu',
    severity: 'high',
    status: 'new',
    sla_breach_at: new Date(Date.now() + 1.8 * 3600000).toISOString(),
    assigned_to: null,
    created_at: new Date(Date.now() - 1.2 * 3600000).toISOString(),
  },
  {
    case_id: 'CLM-2026-882740',
    sep_no: '0114R0011026V004210',
    hospital: 'RSUP Persahabatan Jakarta',
    severity: 'moderate',
    status: 'in_progress',
    sla_breach_at: new Date(Date.now() + 24 * 3600000).toISOString(),
    assigned_to: 'dr. Bima Santoso, Sp.PD',
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    case_id: 'CLM-2026-882890',
    sep_no: '0114R0011026V004390',
    hospital: 'RSUPN Dr. Cipto Mangunkusumo Jakarta',
    severity: 'low',
    status: 'in_progress',
    sla_breach_at: new Date(Date.now() + 48 * 3600000).toISOString(),
    assigned_to: 'apt. Siti Rahmawati',
    created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
  },
];

const SEVERITY_OPTIONS = [
  {
    value: 'critical',
    label: 'Kritis (Critical)',
    sla: 'SLA 1 Jam Audit',
    description: 'Indikasi Phantom Billing / Fraud Aktif',
    color: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    selectedColor: 'border-rose-500 bg-rose-500/20 text-rose-200 ring-2 ring-rose-500/40',
    dot: 'bg-rose-500',
  },
  {
    value: 'high',
    label: 'Tinggi (High)',
    sla: 'SLA 4 Jam Audit',
    description: 'Risiko Upcoding / Selisih INA-CBG Tinggi',
    color: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    selectedColor: 'border-orange-500 bg-orange-500/20 text-orange-200 ring-2 ring-orange-500/40',
    dot: 'bg-orange-500',
  },
  {
    value: 'moderate',
    label: 'Sedang (Moderate)',
    sla: 'SLA Standar BAKB',
    description: 'Perlu Tindak Lanjut Klarifikasi Medis',
    color: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    selectedColor: 'border-amber-500 bg-amber-500/20 text-amber-200 ring-2 ring-amber-500/40',
    dot: 'bg-amber-500',
  },
  {
    value: 'low',
    label: 'Rendah (Low)',
    sla: 'SLA Rutin 10 HK',
    description: 'Pemantauan Kepatuhan Fornas Rutin',
    color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    selectedColor: 'border-emerald-500 bg-emerald-500/20 text-emerald-200 ring-2 ring-emerald-500/40',
    dot: 'bg-emerald-500',
  },
];

const VERIFICATION_LAYERS = [
  { value: 'layer_1', label: 'Lapis 1 (Koding & Fornas)', color: 'bg-blue-500', textColor: 'text-blue-400' },
  { value: 'layer_2', label: 'Lapis 2 (SIP DPJP & Jejak)', color: 'bg-purple-500', textColor: 'text-purple-400' },
  { value: 'layer_3', label: 'Lapis 3 (Mobile JKN Telemetri)', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  { value: 'tri_layer', label: 'Tri-Layer (Komposit 3-Lapis)', color: 'bg-[#FFCA40]', textColor: 'text-[#FFCA40]' },
];

const INTENT_OPTIONS = [
  { value: 'upcoding_review', label: 'Klarifikasi Indikasi Upcoding Diagnosis' },
  { value: 'phantom_billing', label: 'Investigasi Phantom Billing & Presensi Lapis 3' },
  { value: 'readmission_audit', label: 'Evaluasi Readmisi Dini (< 7 Hari)' },
  { value: 'unbundling_check', label: 'Audit Unbundling Tagihan Penunjang / IGD' },
  { value: 'fornas_compliance', label: 'Verifikasi Restriksi Fornas & Obat Kronis' },
  { value: 'bakb_dispute', label: 'Penyelesaian Sengketa Klaim & BAKB' },
];

const SEVERITY_BADGES = {
  critical: 'bg-rose-500/20 border-rose-500/30 text-rose-300',
  high: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
  moderate: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
  low: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
};

const SEVERITY_LABELS = {
  critical: 'Kritis',
  high: 'Tinggi',
  moderate: 'Sedang',
  low: 'Rendah',
};

const STATUS_BADGES = {
  new: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
  in_progress: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
  resolved: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
  closed: 'bg-white/10 border-white/10 text-white/60',
};

const STATUS_LABELS = {
  new: 'Baru',
  in_progress: 'Sedang Diaudit',
  resolved: 'Selesai',
  closed: 'Ditutup',
};

export default function QuickTriageView({ onNavigateTab, onSelectCase, isLight: propIsLight }) {
  const [isLight, setIsLight] = useState(() => {
    if (propIsLight !== undefined) return propIsLight;
    if (typeof window !== 'undefined') {
      const urlTheme = new URLSearchParams(window.location.search).get('theme');
      if (urlTheme === 'light') return true;
      if (urlTheme === 'dark') return false;
      return localStorage.getItem('claimtrace_theme') === 'light' || document.getElementById('cockpit-root')?.classList.contains('theme-light');
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

  const [cases, setCases] = useState(INITIAL_QUEUE_CASES);
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

  const [formData, setFormData] = useState({
    user_id: '',
    session_id: '',
    user_hash: '',
    severity: 'high',
    message: '',
    intent: 'upcoding_review',
    verification_layer: 'tri_layer',
  });
  const [messageExpanded, setMessageExpanded] = useState(false);

  // Filter Priority Queue
  const [searchQuery, setSearchQuery] = useState('');
  const [severityChip, setSeverityChip] = useState('all');

  const stats = useMemo(() => {
    return {
      pending: cases.filter((c) => c.status === 'new').length,
      active: cases.filter((c) => c.status === 'in_progress').length,
      slaRisk: cases.filter((c) => {
        if (!c.sla_breach_at) return false;
        const hoursUntil =
          (new Date(c.sla_breach_at).getTime() - Date.now()) / (1000 * 60 * 60);
        return hoursUntil < 4 && hoursUntil > 0;
      }).length,
      assigned: cases.filter((c) => Boolean(c.assigned_to)).length,
    };
  }, [cases]);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const newCaseId = `CLM-2026-${Math.floor(885000 + Math.random() * 9000)}`;
    const slaHours =
      formData.severity === 'critical'
        ? 1
        : formData.severity === 'high'
        ? 4
        : formData.severity === 'moderate'
        ? 12
        : 48;

    const newRecord = {
      case_id: newCaseId,
      sep_no: formData.session_id || '0114R0011026V004901',
      hospital: formData.user_id.toLowerCase().includes('rs')
        ? formData.user_id
        : `RS Faskes (${formData.user_id || '0114R001'})`,
      severity: formData.severity,
      status: 'new',
      sla_breach_at: new Date(Date.now() + slaHours * 3600000).toISOString(),
      assigned_to: 'dr. Nadia Kusuma, Sp.PK',
      created_at: new Date().toISOString(),
    };

    setCases((prev) => [newRecord, ...prev]);
    setFormData({
      user_id: '',
      session_id: '',
      user_hash: '',
      severity: 'high',
      message: '',
      intent: 'upcoding_review',
      verification_layer: 'tri_layer',
      risk_level: 2,
    });
    setMessageExpanded(false);
    setLoading(false);
    setToastMsg(`Berkas klaim ${newCaseId} berhasil dibuat & dijadwalkan oleh CMA`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleAutofillTemplate = () => {
    setFormData({
      user_id: 'RSUPN Dr. Cipto Mangunkusumo Jakarta (0112R001)',
      session_id: '0114R0011026V004928',
      user_hash: 'JKN-9948201-BMS',
      severity: 'high',
      message: 'Diskrepansi derajat keparahan INA-CBG dari Level I ke Level III (I-4-10-III). Dokumen penunjang hasil Troponin I serial dan EKG 12-lead belum terlampir pada berkas klaim digital.',
      intent: 'upcoding_review',
      verification_layer: 'tri_layer',
      risk_level: 2,
    });
    setMessageExpanded(true);
  };

  const filteredQueue = useMemo(() => {
    let list = [...cases];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.case_id.toLowerCase().includes(q) ||
          (c.sep_no && c.sep_no.toLowerCase().includes(q))
      );
    }
    if (severityChip !== 'all') {
      list = list.filter((c) => c.severity === severityChip);
    }
    return list.sort(
      (a, b) => new Date(a.sla_breach_at).getTime() - new Date(b.sla_breach_at).getTime()
    );
  }, [cases, searchQuery, severityChip]);

  const getTimeUntilBreach = (slaBreachAt) => {
    const hoursUntil = (new Date(slaBreachAt).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 0) return { text: 'LEWAT SLA', color: 'text-red-600', urgent: true };
    if (hoursUntil < 1)
      return { text: `${Math.floor(hoursUntil * 60)}m`, color: 'text-red-600', urgent: true };
    if (hoursUntil < 4)
      return { text: `${hoursUntil.toFixed(1)}j`, color: isLight ? 'text-amber-700 font-bold' : 'text-orange-400 font-bold', urgent: true };
    return { text: `${hoursUntil.toFixed(1)}j`, color: isLight ? 'text-slate-800' : 'text-white/80', urgent: false };
  };

  const inputClass = isLight
    ? 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all'
    : 'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#FFCA40]/60 focus:ring-1 focus:ring-[#FFCA40]/60 text-sm transition-all';

  return (
    <div className={`space-y-6 pb-16 sm:pb-20 ${isLight ? 'text-slate-800' : 'text-white'}`}>
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
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{toastMsg}</span>
            </span>
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

      {/* Header (Dual-Theme Cosmic / Clinical) */}
      <div className={`backdrop-blur-xl border rounded-2xl p-5 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <div className={`p-2 rounded-xl border ${
                isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                  : 'bg-gradient-to-tr from-[#00134A] to-[#001D58] border-[#FFCA40]/30 text-[#FFCA40] shadow-md shadow-[#FFCA40]/10'
              }`}>
                <FolderOpen className={`w-5 h-5 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
              </div>
              <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Triase Cepat Klaim (Quick Triage)
              </h1>
              <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}>
                REAL-TIME
              </span>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-white/10 text-white/80 border-white/10'
              }`}>
                MITRE F3: FA0001 · FA0002.F1018 · NIST CSF 2.0: DE.CM-01
              </span>
            </div>
            <p className={`text-xs ml-12 ${isLight ? 'text-slate-700 font-medium' : 'text-white/60'}`}>
              Registrasi berkas klaim anomali via Orkestrator CMA dengan klasifikasi taksonomi kejahatan finansial MITRE F3 v1.1.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab?.('cases_mgmt')}
              className={`ml-12 mt-2 text-xs font-bold flex items-center gap-1 transition-colors inline-flex cursor-pointer ${
                isLight ? 'text-emerald-700 hover:text-emerald-800' : 'text-[#FFCA40] hover:text-[#FFE08C]'
              }`}
            >
              Lihat semua berkas klaim
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-semibold ${
            isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
          }`}>
            <div className={`h-2 w-2 rounded-full animate-pulse ${isLight ? 'bg-emerald-600' : 'bg-emerald-400'}`} />
            Live
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`relative overflow-hidden backdrop-blur-xl border rounded-2xl p-5 transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm text-slate-800' : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50'
        }`}>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Menunggu (Pending)
            </p>
            <div className={`p-2 rounded-xl border ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/20 border-blue-500/30'}`}>
              <FolderOpen className={`w-4 h-4 ${isLight ? 'text-blue-700' : 'text-blue-400'}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold relative z-10 ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.pending}</p>
          <p className={`text-[11px] mt-1 font-medium relative z-10 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Menunggu penugasan auditor</p>
        </div>

        <div className={`relative overflow-hidden backdrop-blur-xl border rounded-2xl p-5 transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm text-slate-800' : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50'
        }`}>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Aktif (Active)
            </p>
            <div className={`p-2 rounded-xl border ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
              <Users className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold relative z-10 ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.active}</p>
          <p className={`text-[11px] mt-1 font-medium relative z-10 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Sedang diaudit verifikator</p>
        </div>

        <div className={`relative overflow-hidden backdrop-blur-xl border rounded-2xl p-5 transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm text-slate-800' : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50'
        }`}>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Risiko SLA (SLA Risk)
            </p>
            <div className={`p-2 rounded-xl border ${isLight ? 'bg-rose-50 border-rose-200' : 'bg-rose-500/20 border-rose-500/30'}`}>
              <AlertTriangle className={`w-4 h-4 ${isLight ? 'text-rose-700' : 'text-rose-400'}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold relative z-10 ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>{stats.slaRisk}</p>
          <p className={`text-[11px] mt-1 font-medium relative z-10 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Sisa waktu &lt; 4 jam kerja</p>
        </div>

        <div className={`relative overflow-hidden backdrop-blur-xl border rounded-2xl p-5 transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm text-slate-800' : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50'
        }`}>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Ditugaskan (Assigned)
            </p>
            <div className={`p-2 rounded-xl border ${isLight ? 'bg-purple-50 border-purple-200' : 'bg-purple-500/20 border-purple-500/30'}`}>
              <Clock className={`w-4 h-4 ${isLight ? 'text-purple-700' : 'text-purple-400'}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold relative z-10 ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.assigned}</p>
          <p className={`text-[11px] mt-1 font-medium relative z-10 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Ditugaskan otomatis oleh CMA</p>
        </div>
      </div>

      {/* Case Creation Form */}
      <div className={`backdrop-blur-xl border rounded-2xl overflow-hidden shadow-xl ${
        isLight ? 'bg-white border-slate-200 shadow-sm text-slate-900' : 'bg-[#00153A]/85 border-white/10 text-white shadow-[#00081c]/50'
      }`}>
        <div className={`px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
          isLight 
            ? 'bg-slate-50 border-slate-200 text-slate-900' 
            : 'bg-gradient-to-r from-[#00134A] to-[#1C3C80] border-white/10 text-white'
        }`}>
          <div>
            <h2 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <FolderOpen className={`w-5 h-5 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
              Buat Berkas Audit via CMA (Create Case via CMA)
            </h2>
            <p className={`text-xs mt-0.5 ml-7 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Kalkulasi batas SLA otomatis dan penugasan Verifikator Medis BPJS Kesehatan
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutofillTemplate}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer self-start sm:self-auto flex items-center gap-1.5 ${
              isLight
                ? 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-[#FFCA40] border-[#FFCA40]/40 shadow-xs'
            }`}
          >
            <span>+</span>
            <span>Isi Contoh Audit Cepat</span>
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleCreateCase} className="space-y-6">
            {/* Row 1: Identity Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                  Kode Faskes / ID Pengaju <span className="text-rose-500">*</span>
                </label>
                <input aria-label="Bidang input data"
                  type="text"
                  required
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className={inputClass}
                  placeholder="Contoh: 0114R001"
                  disabled={loading}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                  Nomor SEP / ID Sesi Klaim <span className="text-rose-500">*</span>
                </label>
                <input aria-label="Bidang input data"
                  type="text"
                  required
                  value={formData.session_id}
                  onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
                  className={inputClass}
                  placeholder="Masukkan Nomor SEP / Sesi"
                  disabled={loading}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                  Hash Peserta (Zero-PHI) <span className="text-rose-500">*</span>
                </label>
                <input aria-label="Bidang input data"
                  type="text"
                  required
                  value={formData.user_hash}
                  onChange={(e) => setFormData({ ...formData, user_hash: e.target.value })}
                  className={inputClass}
                  placeholder="Hash teranonimisasi (JKN-...)"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Row 2: Severity Card Selector */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                Tingkat Keparahan (Severity) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {SEVERITY_OPTIONS.map((opt) => {
                  const isSelected = formData.severity === opt.value;
                  const lightColor = 
                    opt.value === 'critical' ? (isSelected ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-200' : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/30') :
                    opt.value === 'high' ? (isSelected ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-200' : 'bg-white border-slate-200 hover:border-orange-300 hover:bg-orange-50/30') :
                    opt.value === 'moderate' ? (isSelected ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-200' : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30') :
                    (isSelected ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200' : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30');

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={loading}
                      onClick={() => setFormData({ ...formData, severity: opt.value })}
                      className={`relative p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer shadow-xs ${
                        isLight ? lightColor : (isSelected ? opt.selectedColor : `${opt.color} hover:bg-white/5`)
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />
                        <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{opt.label}</span>
                      </div>
                      <p className={`text-[11px] leading-tight font-medium ${isLight ? 'text-slate-700' : 'text-white/60'}`}>{opt.description}</p>
                      <span className={`mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-white/10 border-white/15 text-white/80'
                      }`}>
                        {opt.sla}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5">
                          <CheckCircle2 className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 3: Verification Layer Segmented Control + Intent Dropdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                  Jalur Verifikasi Utama (Verification Layer)
                </label>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-1.5 rounded-xl border p-1.5 ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'border-white/10 bg-white/5'
                }`}>
                  {VERIFICATION_LAYERS.map((layer) => {
                    const isSelected = formData.verification_layer === layer.value;
                    return (
                      <button
                        key={layer.value}
                        type="button"
                        disabled={loading}
                        onClick={() => setFormData({ ...formData, verification_layer: layer.value })}
                        className={`py-2 px-2.5 text-xs rounded-lg transition-all duration-200 relative cursor-pointer border flex items-center justify-center gap-2 ${
                          isSelected
                            ? isLight
                              ? '!bg-emerald-600 !text-white !border-emerald-600 shadow-sm font-bold'
                              : `${layer.textColor} bg-gradient-to-r from-health-blue-dark to-health-blue border border-[#FFCA40]/40 shadow-sm font-bold`
                            : isLight
                              ? 'bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border-slate-200/90 font-semibold'
                              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5 font-semibold'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isSelected 
                              ? isLight ? '!bg-white' : layer.color 
                              : isLight ? 'bg-slate-400' : 'bg-white/30'
                          }`}
                        />
                        <span className={`truncate text-center ${isSelected ? (isLight ? '!text-white font-bold' : '') : (isLight ? 'text-slate-700 font-semibold' : '')}`}>
                          {layer.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                  Kategori Temuan Audit (Intent)
                </label>
                <select
                  value={formData.intent}
                  onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-500'
                      : 'bg-[#00134A] border-white/10 text-white focus:border-[#FFCA40]/60'
                  }`}
                  disabled={loading}
                >
                  {INTENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className={isLight ? 'bg-white text-slate-900' : 'bg-[#00134A] text-white'}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Expandable Case Message */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`block text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                  Rincian Temuan &amp; Catatan Klinis <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMessageExpanded(!messageExpanded)}
                  className={`flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer ${
                    isLight ? 'text-slate-700 hover:text-slate-950' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {messageExpanded ? (
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
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={messageExpanded ? 8 : 3}
                className={`${inputClass} resize-none`}
                placeholder="Jelaskan rincian indikasi ketidaksesuaian klaim, kode INA-CBG, atau bukti medis yang diperlukan..."
                disabled={loading}
              />
              <p className={`text-[11px] font-semibold mt-1.5 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                {formData.message.length} karakter
              </p>
            </div>

            {/* CMA Info Banner */}
            <div className={`rounded-xl p-4 border ${
              isLight ? 'bg-emerald-50/70 border-emerald-200 text-slate-800' : 'bg-white/5 border-white/10 text-white/80'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg border ${
                  isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-[#FFCA40]/20 border-[#FFCA40]/30 text-[#FFCA40]'
                }`}>
                  <CheckCircle2 className={`h-4 w-4 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
                </div>
                <div className={`text-xs leading-relaxed ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
                  <span className={`font-bold ${isLight ? 'text-emerald-950 font-bold' : 'text-[#FFCA40]'}`}>Alur Kerja Graf CMA: </span>
                  Menghitung tenggat SLA secara otomatis, menugaskan Verifikator Medis yang siaga, membuat berkas audit terlacak, dan mengaktifkan pemantauan SLA 10 Hari Kerja.
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2.5 font-bold rounded-xl transition-all duration-200 shadow-md flex items-center gap-2 text-sm cursor-pointer ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
                    : 'bg-gradient-to-tr from-health-blue-dark to-health-blue hover:from-health-blue hover:to-health-blue-light border border-emerald-400/40 text-white shadow-emerald-950/20'
                }`}
              >
                <Send className="w-4 h-4 text-white" />
                {loading ? 'Membuat Berkas...' : 'Buat Berkas Audit'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Priority Queue Card */}
      <div className={`backdrop-blur-xl border rounded-2xl overflow-hidden shadow-xl ${
        isLight ? 'bg-white border-slate-200 shadow-sm text-slate-900' : 'bg-[#00153A]/85 border-white/10 text-white shadow-[#00081c]/50'
      }`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-gradient-to-r from-[#00134A] to-[#1C3C80] border-white/10'
        }`}>
          <div>
            <h2 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Clock className={`w-5 h-5 ${isLight ? 'text-emerald-700' : 'text-cyan-400'}`} />
              Antrean Prioritas SLA (Priority Queue)
            </h2>
            <p className={`text-xs mt-0.5 ml-7 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Berkas klaim aktif diurutkan berdasarkan urgensi jatuh tempo SLA
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCases([...INITIAL_QUEUE_CASES])}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              isLight ? 'text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border-slate-200' : 'text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            Segarkan
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
              <input aria-label="Cari ID Berkas atau SEP..."
                type="text"
                placeholder="Cari ID Berkas atau SEP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm transition-all focus:outline-none ${
                  isLight 
                    ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500' 
                    : 'bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#FFCA40]/60'
                }`}
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'critical', label: 'Kritis' },
                { id: 'high', label: 'Tinggi' },
                { id: 'moderate', label: 'Sedang' },
                { id: 'low', label: 'Rendah' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSeverityChip(chip.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    severityChip === chip.id
                      ? isLight
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-bold'
                        : 'bg-gradient-to-r from-health-blue-dark to-health-blue border-[#FFCA40]/50 text-[#FFCA40] shadow-md'
                      : isLight
                        ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Menampilkan <strong className={isLight ? 'text-slate-900' : 'text-white'}>{filteredQueue.length}</strong> dari <strong className={isLight ? 'text-slate-900' : 'text-white'}>{cases.length}</strong>{' '}
            berkas dalam antrean prioritas
          </div>

          {/* Table */}
          <div className={`overflow-x-auto border rounded-xl ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <table className={`w-full divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
              <thead className={isLight ? 'bg-slate-50 border-b border-slate-200' : 'bg-white/5 border-b border-white/10'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                    ID Berkas / SEP
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                    Keparahan
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                    Status
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                    Verifikator Ditugaskan
                  </th>
                  <th className={`px-4 py-3 text-right text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                    Sisa SLA
                  </th>
                  <th className={`px-4 py-3 text-right text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                {filteredQueue.map((c) => {
                  const slaInfo = getTimeUntilBreach(c.sla_breach_at);
                  return (
                    <tr
                      key={c.case_id}
                      className={`transition-colors ${
                        isLight
                          ? slaInfo.urgent ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50'
                          : slaInfo.urgent ? 'bg-rose-500/10 hover:bg-rose-500/15' : 'hover:bg-white/5'
                      }`}
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className={`text-xs font-mono font-bold flex items-center gap-2 ${isLight ? 'text-emerald-800' : 'text-[#FFCA40]'}`}>
                          <span>{c.case_id}</span>
                          {c.sep_no && (
                            <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${
                              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/10 text-white/75 border-white/10'
                            }`}>
                              {c.sep_no}
                            </span>
                          )}
                        </div>
                        <div className={`text-[11px] font-medium mt-1 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{c.hospital}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                            SEVERITY_BADGES[c.severity] || SEVERITY_BADGES.moderate
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {SEVERITY_LABELS[c.severity] || c.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${
                            STATUS_BADGES[c.status] || STATUS_BADGES.new
                          }`}
                        >
                          {STATUS_LABELS[c.status] || c.status}
                        </span>
                      </td>
                      <td className={`px-4 py-3.5 whitespace-nowrap text-xs ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
                        {c.assigned_to ? (
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            <User className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`} />
                            {c.assigned_to}
                          </span>
                        ) : (
                          <span className={`italic ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Belum ditugaskan</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-sm font-bold ${slaInfo.color}`}>
                            {slaInfo.text}
                          </span>
                          {slaInfo.urgent && (
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">MENDESAK</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectCase) {
                              onSelectCase(c.case_id);
                            } else {
                              onNavigateTab?.('cases_mgmt');
                            }
                          }}
                          className={`font-bold hover:underline cursor-pointer ${
                            isLight ? 'text-emerald-700 hover:text-emerald-800' : 'text-[#FFCA40] hover:text-[#FFE08C]'
                          }`}
                        >
                          Tinjau Kasus →
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
    </div>
  );
}
