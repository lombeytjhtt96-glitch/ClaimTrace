import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  Edit3,
  Save,
  RefreshCw,
  Key,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  User,
  Phone,
  Building2,
  Clock,
  ArrowLeft,
  BadgeCheck,
  ShieldCheck,
  Award,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminProfileView({ currentUser, onUpdateUser, onBackToDashboard, isLight: propIsLight }) {
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

  const getDerivedNames = (fullName = '') => {
    const clean = fullName.trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { first: 'Budi', last: 'Santoso (Fiktif)' };
    if (parts.length === 1) return { first: parts[0], last: '' };
    return { first: parts[0], last: parts.slice(1).join(' ') };
  };

  const buildInitialProfile = (user) => {
    const names = getDerivedNames(user?.name);
    return {
      email: user?.email || 'admin.fraud@bpjs-kesehatan.go.id',
      name: user?.name || 'Budi Santoso, S.Kom, M.TI',
      firstName: user?.firstName || names.first,
      lastName: user?.lastName || names.last,
      nip: user?.nip || '19920815 201503 1 002 (Sintetis)',
      role: user?.role || user?.roleTitle || 'Analis Forensik Digital Anti-Fraud',
      unit: user?.unit || 'Kedeputian Bidang Pengawasan dan Pemeriksaan',
      phone: user?.phone || '+62 812-0000-0000 (Fiktif)',
      allowEmailCheckins: true,
    };
  };

  const [profile, setProfile] = useState(() => buildInitialProfile(currentUser));
  const [originalProfile, setOriginalProfile] = useState(() => buildInitialProfile(currentUser));
  const [isEditing, setIsEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const updated = buildInitialProfile(currentUser);
      setProfile(updated);
      setOriginalProfile(updated);
    }
  }, [currentUser]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    securityPin: '123123',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Auto-dismiss Toast Notification setelah 3.5 detik
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const [timestamps, setTimestamps] = useState({
    createdAt: '12 Januari 2025, 08:30 WIB',
    updatedAt: '24 Oktober 2026, 17:30 WIB',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const hasProfileChanges = useMemo(() => {
    return JSON.stringify(profile) !== JSON.stringify(originalProfile);
  }, [profile, originalProfile]);

  const handleProfileChange = (field, value) => {
    setProfile((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'firstName' || field === 'lastName') {
        next.name = `${next.firstName || ''} ${next.lastName || ''}`.trim();
      }
      return next;
    });
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!hasProfileChanges) {
      showToast('Data profil sudah paling mutakhir', 'info');
      setIsEditing(false);
      return;
    }

    setProfileSaving(true);
    setTimeout(() => {
      setOriginalProfile(profile);
      setIsEditing(false);
      setProfileSaving(false);
      const nowStr = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setTimestamps((prev) => ({ ...prev, updatedAt: `${nowStr} WIB` }));
      if (onUpdateUser) {
        onUpdateUser({
          ...currentUser,
          name: profile.name,
          email: profile.email,
          nip: profile.nip,
          unit: profile.unit,
          phone: profile.phone,
          role: profile.role,
          avatar: profile.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
        });
      }
      showToast('Profil verifikator berhasil diperbarui', 'success');
    }, 450);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast('Harap isi kata sandi saat ini dan kata sandi baru', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Kata sandi baru dan konfirmasi tidak cocok', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showToast('Kata sandi baru minimal 8 karakter', 'error');
      return;
    }

    setPasswordSaving(true);
    setTimeout(() => {
      setPasswordSaving(false);
      setPasswordForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      showToast('Kata sandi & PIN Otorisasi Audit berhasil diperbarui', 'success');
    }, 500);
  };

  return (
    <div className={`mx-auto max-w-4xl space-y-6 pb-24 ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.message}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-lg overflow-hidden ${
              toast.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              aria-label="Tutup notifikasi"
              className="ml-2 p-0.5 rounded hover:bg-black/5 cursor-pointer text-slate-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {/* Animasi Garis Countdown Waktu Menghilang */}
            <motion.div
              key={`progress-${toast.message}`}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3.5, ease: "linear" }}
              className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bersih & Fungsional */}
      <header className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b ${
        isLight ? 'border-slate-200' : 'border-white/10'
      }`}>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={`flex items-center gap-2 text-xl md:text-2xl font-bold ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <ShieldCheck className={`h-6 w-6 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
              Profil Verifikator &amp; Otorisasi
            </h1>
            <span className={`text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
              isLight 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-[#FFCA40]/10 text-[#FFCA40] border-[#FFCA40]/30'
            }`}>
              <BadgeCheck className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
              <span>NIST CSF PR.AC · MITRE F3: FA0001 (Level 4 Investigator)</span>
            </span>
          </div>
          <p className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-white/60'}`}>
            Identitas kedinasan verifikator medis BPJS Kesehatan dan manajemen kredensial otorisasi audit klaim.
          </p>
        </div>

        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-xs shrink-0 self-start sm:self-auto ${
              isLight
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-emerald-700'
                : 'border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-[#FFCA40]'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dasbor</span>
          </button>
        )}
      </header>

      {/* Section 1: Detail Profil Verifikator */}
      <section className={`rounded-2xl border p-5 md:p-6 backdrop-blur-xl space-y-5 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50'
      }`}>
        <div className={`flex items-center justify-between pb-3 border-b ${
          isLight ? 'border-slate-200' : 'border-white/10'
        }`}>
          <div>
            <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Rincian Identitas Kedinasan
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Identitas resmi auditor klaim dan otorisasi pengawasan pra-pembayaran JKN
            </p>
          </div>
          <button
            type="button"
            onClick={handleProfileSubmit}
            disabled={profileSaving}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${
              isEditing
                ? (isLight 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm' 
                    : 'bg-[#FFCA40] text-[#00134A] hover:bg-[#FFE08C] shadow-md shadow-[#FFCA40]/20')
                : (isLight
                    ? 'border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 hover:border-emerald-500'
                    : 'border border-white/10 bg-white/5 text-white hover:border-[#FFCA40]/60 hover:bg-white/10')
            }`}
          >
            {isEditing ? (
              profileSaving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )
            ) : (
              <>
                <Edit3 className="h-3.5 w-3.5" />
                <span>Ubah Profil</span>
              </>
            )}
          </button>
        </div>

        <form id="admin-profile-form" className="space-y-4" onSubmit={handleProfileSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            
            {/* NIP (Nomor Induk Pegawai) */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold flex items-center justify-between ${
                isLight ? 'text-slate-800' : 'text-white/80'
              }`}>
                <span className="flex items-center gap-1.5">
                  <Lock className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
                  Nomor Induk Pegawai (NIP Kedinasan)
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  isLight 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'text-[#FFCA40] bg-[#FFCA40]/10 border-[#FFCA40]/30'
                }`}>
                  Terdaftar BKN / BPJS
                </span>
              </label>
              <input
                type="text"
                value={profile.nip}
                disabled
                title="Nomor Induk Pegawai (Identitas Tunggal Kedinasan)"
                className={`w-full rounded-xl border px-3.5 py-2 text-xs font-mono font-bold disabled:cursor-not-allowed ${
                  isLight 
                    ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-xs' 
                    : 'border-white/10 bg-white/5 text-white/70'
                }`}
              />
            </div>

            {/* Email Kedinasan */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-slate-800' : 'text-white/80'
              }`}>
                <Mail className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-white/40'}`} />
                Alamat Email Kedinasan
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                title="Alamat email kedinasan (terkunci)"
                className={`w-full rounded-xl border px-3.5 py-2 text-xs font-medium disabled:cursor-not-allowed ${
                  isLight 
                    ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-xs' 
                    : 'border-white/10 bg-white/5 text-white/70'
                }`}
              />
            </div>

            {/* Peran / Jabatan Otorisasi */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-slate-800' : 'text-white/80'
              }`}>
                <Award className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-white/40'}`} />
                Peran &amp; Wewenang Audit
              </label>
              <input
                type="text"
                value={profile.role}
                disabled
                title="Wewenang otorisasi verifikator"
                className={`w-full rounded-xl border px-3.5 py-2 text-xs font-bold disabled:cursor-not-allowed ${
                  isLight 
                    ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-xs' 
                    : 'border-white/10 bg-white/5 text-white/80'
                }`}
              />
            </div>

            {/* Nama Lengkap & Gelar */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-slate-800' : 'text-white/80'
              }`}>
                <User className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-white/40'}`} />
                Nama Lengkap &amp; Gelar
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                disabled={!isEditing}
                placeholder="Nama tampilan verifikator"
                className={`w-full rounded-xl border px-3.5 py-2 text-xs transition disabled:cursor-not-allowed ${
                  isLight 
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:text-slate-800' 
                    : 'border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-[#FFCA40]/60 focus:bg-white/10 focus:ring-2 focus:ring-[#FFCA40]/20 disabled:opacity-75'
                }`}
              />
            </div>

            {/* Nama Depan */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>Nama Depan</label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => handleProfileChange('firstName', e.target.value)}
                disabled={!isEditing}
                placeholder="Nama depan"
                className={`w-full rounded-xl border px-3.5 py-2 text-xs transition disabled:cursor-not-allowed ${
                  isLight 
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:text-slate-800' 
                    : 'border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-[#FFCA40]/60 focus:bg-white/10 focus:ring-2 focus:ring-[#FFCA40]/20 disabled:opacity-75'
                }`}
              />
            </div>

            {/* Nama Belakang */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>Nama Belakang</label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => handleProfileChange('lastName', e.target.value)}
                disabled={!isEditing}
                placeholder="Nama belakang"
                className={`w-full rounded-xl border px-3.5 py-2 text-xs transition disabled:cursor-not-allowed ${
                  isLight 
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:text-slate-800' 
                    : 'border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-[#FFCA40]/60 focus:bg-white/10 focus:ring-2 focus:ring-[#FFCA40]/20 disabled:opacity-75'
                }`}
              />
            </div>

            {/* Nomor Telepon Dinas */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-slate-800' : 'text-white/80'
              }`}>
                <Phone className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-white/40'}`} />
                Nomor Telepon / WhatsApp Dinas
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                disabled={!isEditing}
                placeholder="+62 812-..."
                className={`w-full rounded-xl border px-3.5 py-2 text-xs transition disabled:cursor-not-allowed ${
                  isLight 
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:text-slate-800' 
                    : 'border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-[#FFCA40]/60 focus:bg-white/10 focus:ring-2 focus:ring-[#FFCA40]/20 disabled:opacity-75'
                }`}
              />
            </div>

            {/* Unit Kerja */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-slate-800' : 'text-white/80'
              }`}>
                <Building2 className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-white/40'}`} />
                Unit Kerja &amp; Kedeputian Wilayah
              </label>
              <input
                type="text"
                value={profile.unit}
                onChange={(e) => handleProfileChange('unit', e.target.value)}
                disabled={!isEditing}
                placeholder="Unit Kerja"
                className={`w-full rounded-xl border px-3.5 py-2 text-xs transition disabled:cursor-not-allowed ${
                  isLight 
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:text-slate-800' 
                    : 'border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-[#FFCA40]/60 focus:bg-white/10 focus:ring-2 focus:ring-[#FFCA40]/20 disabled:opacity-75'
                }`}
              />
            </div>

          </div>

          <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'border-white/10 bg-white/5 text-white'
          }`}>
            <div>
              <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Notifikasi Email Eskalasi SLA &amp; Audit
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Terima peringatan batas waktu SLA 10 Hari Kerja, laporan anomali IA, dan kode OTP verifikasi melalui email dinas.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={profile.allowEmailCheckins}
                onChange={(e) => handleProfileChange('allowEmailCheckins', e.target.checked)}
                disabled={!isEditing}
                className={`h-4 w-4 rounded disabled:cursor-not-allowed ${
                  isLight 
                    ? 'border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500/30' 
                    : 'border-white/20 bg-white/5 text-[#FFCA40] focus:ring-[#FFCA40]/40'
                }`}
              />
              <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Aktif</span>
            </label>
          </div>

          <div className={`flex flex-wrap gap-5 text-[11px] pt-1 ${
            isLight ? 'text-slate-500' : 'text-white/40'
          }`}>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Terdaftar: {timestamps.createdAt}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Pembaruan terakhir: {timestamps.updatedAt}
            </span>
          </div>
        </form>
      </section>

      {/* Section 2: Ubah Kata Sandi & Kredensial */}
      <section className={`rounded-2xl border p-5 md:p-6 backdrop-blur-xl space-y-5 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#00153A]/85 border-white/10 text-white shadow-xl shadow-[#00081c]/50'
      }`}>
        <div className={`pb-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <h2 className={`flex items-center gap-2 text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Key className={`h-5 w-5 ${isLight ? 'text-emerald-600' : 'text-[#FFCA40]'}`} />
            Ubah Kata Sandi &amp; Kredensial
          </h2>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Gunakan kata sandi yang kuat dan unik untuk menjaga keamanan akses verifikasi klaim JKN.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handlePasswordSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>Kata Sandi Saat Ini</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                }
                placeholder="Masukkan kata sandi saat ini"
                className={`w-full rounded-xl border px-3.5 py-2 text-xs transition ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                    : 'border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-[#FFCA40]/60 focus:bg-white/10 focus:ring-2 focus:ring-[#FFCA40]/20'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>Kata Sandi Baru</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="Masukkan kata sandi baru (min 8 karakter)"
                className={`w-full rounded-xl border px-3.5 py-2 text-xs transition ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                    : 'border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-[#FFCA40]/60 focus:bg-white/10 focus:ring-2 focus:ring-[#FFCA40]/20'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>Konfirmasi Kata Sandi Baru</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                }
                placeholder="Ketik ulang kata sandi baru"
                className={`w-full rounded-xl border px-3.5 py-2 text-xs transition ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                    : 'border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-[#FFCA40]/60 focus:bg-white/10 focus:ring-2 focus:ring-[#FFCA40]/20'
                }`}
              />
            </div>
          </div>

          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}>
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${
              isLight 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                : 'bg-white/5 border-white/10 text-white/80'
            }`}>
              <Lock className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`} />
              <span>
                PIN Otorisasi Eksekusi (6 Angka) Aktif:{' '}
                <strong className={`font-mono font-bold tracking-widest ${
                  isLight ? 'text-emerald-800' : 'text-[#FFCA40]'
                }`}>123123</strong>
              </span>
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer shadow-sm"
            >
              {passwordSaving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Memperbarui...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Perbarui Kata Sandi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
