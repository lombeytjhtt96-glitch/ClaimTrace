import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, getDeviceFingerprint, saveAuthenticatedSession, clearSessionStorage } from '../../services/apiConfig';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Laptop, AlertCircle, Check, CheckCircle2, RefreshCw, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';

export default function SecurityVerificationModal({
  isOpen = false,
  user = null,
  identifier = '',
  preAuthToken = '',
  onCompleteVerification,
  onCancelSignOut,
  isLight = true,
}) {
  const effectiveIsLight =
    typeof isLight === 'boolean'
      ? isLight
      : typeof window !== 'undefined' && localStorage.getItem('claimtrace_theme') !== 'dark';

  const resolvedEmail = user?.email || (identifier && identifier.includes('@') ? identifier : 'Email terdaftar');
  const resolvedId = user?.nip || identifier || '';
  const deviceFingerprint = getDeviceFingerprint();

  // Sequential server-enforced MFA stages: 'pin' -> 'otp' -> 'device' (no manual skipping)
  const [step, setStep] = useState('pin');
  const [stageToken, setStageToken] = useState(preAuthToken || '');

  // Stage 1: PIN Otorisasi 6 Digit (selalu kosong di awal)
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [showPinDigits, setShowPinDigits] = useState(false);

  // Stage 2: OTP Email 6 Digit (selalu kosong, CSPRNG dari server)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpEmailDest, setOtpEmailDest] = useState(resolvedEmail);
  const [otpCountdown, setOtpCountdown] = useState(180);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Stage 3: Device & Strict Session Policy
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(15);
  const [idleTimeoutMinutes, setIdleTimeoutMinutes] = useState(15);
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [strictIpLock, setStrictIpLock] = useState(true);

  const [error, setError] = useState(null);
  const [stageLockedOut, setStageLockedOut] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const pinRefs = useRef([]);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (!isOpen) return;
    setStep('pin');
    setStageToken(preAuthToken || '');
    setPin(['', '', '', '', '', '']);
    setOtp(['', '', '', '', '', '']);
    setOtpEmailDest(resolvedEmail);
    setOtpCountdown(180);
    setResendCooldown(0);
    setError(null);
    setStageLockedOut(false);
    setTimeout(() => pinRefs.current[0]?.focus(), 80);
  }, [isOpen, preAuthToken, resolvedEmail]);

  useEffect(() => {
    if (!isOpen) return;
    if (step === 'pin') setTimeout(() => pinRefs.current[0]?.focus(), 60);
    if (step === 'otp') setTimeout(() => otpRefs.current[0]?.focus(), 60);
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen || step !== 'otp' || otpCountdown <= 0) return;
    const t = setInterval(() => setOtpCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [isOpen, step, otpCountdown]);

  useEffect(() => {
    if (!isOpen || resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [isOpen, resendCooldown]);

  if (!isOpen || !preAuthToken) return null;

  const handleDigitChange = (arr, setter, refs, index, rawVal) => {
    const clean = rawVal.replace(/\D/g, '');
    if (!clean && rawVal !== '') return;
    if (clean.length > 1) {
      // Support clean 6-digit paste directly into slot
      const pasted = clean.slice(0, 6).split('');
      const next = ['', '', '', '', '', ''];
      pasted.forEach((ch, idx) => {
        next[idx] = ch;
      });
      setter(next);
      setError(null);
      const focusIdx = Math.min(5, pasted.length - 1);
      refs.current[focusIdx]?.focus();
      return;
    }
    const next = [...arr];
    next[index] = clean;
    setter(next);
    setError(null);
    if (clean && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (arr, refs, index, e, submitFn) => {
    if (e.key === 'Backspace' && !arr[index] && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && arr.join('').length === 6) {
      submitFn();
    }
  };

  const handleHardAbort = () => {
    clearSessionStorage({ broadcast: false });
    if (onCancelSignOut) onCancelSignOut();
  };

  const handleVerifyPin = async () => {
    const enteredPin = pin.join('');
    if (enteredPin.length < 6) {
      setError('Masukkan 6 digit PIN otorisasi verifikator Anda.');
      return;
    }
    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${stageToken}`,
          'X-Device-Fingerprint': deviceFingerprint,
        },
        body: JSON.stringify({
          identifier: resolvedId,
          pin: enteredPin,
          pre_auth_token: stageToken,
          device_fingerprint: deviceFingerprint,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 && /dicabut|kedaluwarsa|dimulai ulang|Batas 3 kali/i.test(data.detail || '')) {
          setStageLockedOut(true);
        }
        setPin(['', '', '', '', '', '']);
        setError(data.detail || 'PIN Otorisasi 6 digit tidak valid.');
        return;
      }

      if (!data.pre_auth_token) {
        setError('Server tidak mengembalikan token tahapan OTP yang sah.');
        return;
      }
      setStageToken(data.pre_auth_token);
      setOtpEmailDest(data.email_destination || resolvedEmail);
      setOtp(['', '', '', '', '', '']);
      setOtpCountdown(data.ttl_seconds || 180);
      setResendCooldown(30);
      setStep('otp');
    } catch {
      setError('Koneksi ke server otorisasi BPJS Kesehatan gagal.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || stageLockedOut) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${stageToken}`,
          'X-Device-Fingerprint': deviceFingerprint,
        },
        body: JSON.stringify({
          identifier: resolvedId,
          pre_auth_token: stageToken,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || 'Gagal mengirim ulang kode OTP.');
        return;
      }
      setOtp(['', '', '', '', '', '']);
      setOtpCountdown(data.ttl_seconds || 180);
      setResendCooldown(30);
    } catch {
      setError('Gagal menghubungi server untuk pengiriman OTP ulang.');
    }
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      setError('Masukkan 6 digit kode OTP dari email Anda.');
      return;
    }
    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${stageToken}`,
          'X-Device-Fingerprint': deviceFingerprint,
        },
        body: JSON.stringify({
          identifier: resolvedId,
          otp: enteredOtp,
          pre_auth_token: stageToken,
          device_fingerprint: deviceFingerprint,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 && /dicabut|login ulang|Batas 3 kali/i.test(data.detail || '')) {
          setStageLockedOut(true);
        }
        setOtp(['', '', '', '', '', '']);
        setError(data.detail || 'Kode OTP Email tidak sesuai atau telah kedaluwarsa.');
        return;
      }

      if (!data.pre_auth_token) {
        setError('Server tidak menerbitkan token otorisasi perangkat.');
        return;
      }
      setStageToken(data.pre_auth_token);
      setStep('device');
    } catch {
      setError('Gagal memverifikasi kode OTP ke server otorisasi.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAuthorizeSession = async () => {
    setIsVerifying(true);
    setError(null);

    const effectiveIdle = Math.min(idleTimeoutMinutes, sessionDurationMinutes);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/authorize-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${stageToken}`,
          'X-Device-Fingerprint': deviceFingerprint,
        },
        body: JSON.stringify({
          identifier: resolvedId,
          device_fingerprint: deviceFingerprint,
          pre_auth_token: stageToken,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'ClaimTrace Workstation',
          session_duration_minutes: sessionDurationMinutes,
          idle_timeout_minutes: effectiveIdle,
          revoke_other_sessions: revokeOtherSessions,
          strict_ip_lock: strictIpLock,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          setStageLockedOut(true);
        }
        setError(data.detail || 'Otorisasi perangkat ditolak oleh server.');
        return;
      }

      if (!data.token || !data.token.startsWith('ct.') || !data.user?.isMfaVerified) {
        setError('Respons token sesi server tidak memenuhi standar kriptografis MFA.');
        return;
      }

      const saved = saveAuthenticatedSession(data.token, data.user);
      if (!saved) {
        setError('Gagal menyimpan sesi terenkripsi di peramban.');
        return;
      }

      if (onCompleteVerification) {
        onCompleteVerification(data.user, {
          expiresInSeconds: data.expires_in_seconds || sessionDurationMinutes * 60,
          idleTimeoutSeconds: data.idle_timeout_seconds || effectiveIdle * 60,
        });
      }
    } catch {
      setError('Gagal menyelesaikan otorisasi sesi perangkat dengan server.');
    } finally {
      setIsVerifying(false);
    }
  };

  const stages = [
    { key: 'pin', label: '1. PIN', done: step === 'otp' || step === 'device' },
    { key: 'otp', label: '2. OTP Email', done: step === 'device' },
    { key: 'device', label: '3. Perangkat', done: false },
  ];

  const surfaceCls = effectiveIsLight
    ? 'bg-white border-[#E2E8F0] text-[#061B31] shadow-2xl'
    : 'bg-[#11141A] border-white/10 text-[#F1F5F9] shadow-2xl';
  const subSurfaceCls = effectiveIsLight
    ? 'bg-[#F7F8FA] border-[#E2E8F0]'
    : 'bg-[#161A22] border-white/10';
  const inputCls = effectiveIsLight
    ? 'bg-[#F7F8FA] border-[#CBD5E1] text-[#061B31] focus:border-[#00733B] focus:bg-white focus:ring-2 focus:ring-emerald-500/20'
    : 'bg-[#161A22] border-white/15 text-white focus:border-emerald-400 focus:bg-[#1B202A] focus:ring-2 focus:ring-emerald-500/25';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm font-inter">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`relative w-full max-w-lg rounded-2xl border p-6 sm:p-7 ${surfaceCls}`}
      >
        <div className="text-center space-y-1.5 mb-5">
          <h2 className="text-lg font-bold tracking-tight">Verifikasi Keamanan</h2>
          <p className={`text-xs ${effectiveIsLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Selesaikan 3 tahap verifikasi untuk{' '}
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">{user?.name || resolvedId}</span>.
          </p>
        </div>

        {/* Non-clickable progress bar */}
        <div className="grid grid-cols-3 gap-2 mb-5" aria-label="Tahapan Verifikasi MFA">
          {stages.map((s) => {
            const isActive = step === s.key;
            return (
              <div
                key={s.key}
                className={`py-2 px-2.5 rounded-xl border text-center text-[11px] font-semibold select-none transition-colors ${
                  isActive
                    ? effectiveIsLight
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : s.done
                    ? effectiveIsLight
                      ? 'bg-slate-50 border-emerald-200 text-emerald-700'
                      : 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400'
                    : effectiveIsLight
                    ? 'bg-slate-50 border-slate-200 text-slate-400'
                    : 'bg-[#161A22] border-white/5 text-slate-500'
                }`}
              >
                {s.done ? <Check className="w-3 h-3 inline mr-1 shrink-0" /> : null}
                {s.label}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-medium leading-snug">{error}</p>
              {stageLockedOut && (
                <button
                  type="button"
                  onClick={handleHardAbort}
                  className="text-[11px] font-bold underline cursor-pointer"
                >
                  Muat Ulang Proses Login Sekarang
                </button>
              )}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 'pin' && (
            <motion.div
              key="step-pin"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${subSurfaceCls}`}>
                <div className="flex items-start gap-2.5 text-xs">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className={effectiveIsLight ? 'text-slate-600' : 'text-slate-300'}>
                    Masukkan 6 digit PIN otorisasi rahasia verifikator Anda (maksimum 3 kali percobaan).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPinDigits((v) => !v)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  title={showPinDigits ? 'Sembunyikan digit PIN' : 'Tampilkan digit PIN'}
                >
                  {showPinDigits ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-center gap-2 sm:gap-2.5 py-1">
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (pinRefs.current[i] = el)}
                    type={showPinDigits ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    disabled={stageLockedOut || isVerifying}
                    value={digit}
                    aria-label={`Digit PIN ${i + 1}`}
                    onChange={(e) => handleDigitChange(pin, setPin, pinRefs, i, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(pin, pinRefs, i, e, handleVerifyPin)}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-lg font-mono font-bold rounded-xl border focus:outline-none transition ${inputCls}`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleHardAbort}
                  className={`text-xs font-medium cursor-pointer ${
                    effectiveIsLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Batalkan & Keluar
                </button>
                <button
                  type="button"
                  onClick={handleVerifyPin}
                  disabled={isVerifying || stageLockedOut || pin.join('').length < 6}
                  className="px-5 py-2.5 rounded-xl bg-[#00733B] hover:bg-[#005E30] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isVerifying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Verifikasi PIN & Kirim OTP</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${subSurfaceCls}`}>
                <div className="flex items-start gap-2.5 text-xs">
                  <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className={effectiveIsLight ? 'text-slate-600' : 'text-slate-300'}>
                    Masukkan 6 digit kode OTP yang dikirim ke{' '}
                    <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">{otpEmailDest}</span>.
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shrink-0">
                  {Math.floor(otpCountdown / 60)}:{String(otpCountdown % 60).padStart(2, '0')}
                </span>
              </div>

              <div className="flex justify-center gap-2 sm:gap-2.5 py-1">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    disabled={stageLockedOut || isVerifying}
                    value={digit}
                    aria-label={`Digit OTP ${i + 1}`}
                    onChange={(e) => handleDigitChange(otp, setOtp, otpRefs, i, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(otp, otpRefs, i, e, handleVerifyOtp)}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-lg font-mono font-bold rounded-xl border focus:outline-none transition ${inputCls}`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || stageLockedOut}
                  className={`text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    effectiveIsLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{resendCooldown > 0 ? `Kirim Ulang (${resendCooldown}s)` : 'Kirim Ulang Kode OTP'}</span>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleHardAbort}
                    className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isVerifying || stageLockedOut || otp.join('').length < 6}
                    className="px-5 py-2.5 rounded-xl bg-[#00733B] hover:bg-[#005E30] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {isVerifying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Verifikasi OTP Email</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'device' && (
            <motion.div
              key="step-device"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className={`p-3.5 rounded-xl border space-y-2 ${subSurfaceCls}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Otorisasi Perangkat</span>
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                  ID Perangkat: {deviceFingerprint}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="space-y-1.5 block">
                  <span className={`text-[11px] font-semibold block ${effectiveIsLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Batas Maksimal Sesi
                  </span>
                  <select
                    value={sessionDurationMinutes}
                    onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none ${inputCls}`}
                  >
                    <option value={15}>15 Menit (Strict)</option>
                    <option value={30}>30 Menit</option>
                    <option value={60}>60 Menit (1 Jam)</option>
                    <option value={120}>120 Menit (Maksimum)</option>
                  </select>
                </label>

                <label className="space-y-1.5 block">
                  <span className={`text-[11px] font-semibold block ${effectiveIsLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Auto-Lock Idle Timeout
                  </span>
                  <select
                    value={idleTimeoutMinutes}
                    onChange={(e) => setIdleTimeoutMinutes(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none ${inputCls}`}
                  >
                    <option value={5}>5 Menit Tanpa Aktivitas</option>
                    <option value={10}>10 Menit Tanpa Aktivitas</option>
                    <option value={15}>15 Menit (Standar BPJS)</option>
                    <option value={30}>30 Menit</option>
                  </select>
                </label>
              </div>

              <div className="space-y-2.5 text-xs">
                <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer ${subSurfaceCls}`}>
                  <input
                    type="checkbox"
                    checked={revokeOtherSessions}
                    onChange={(e) => setRevokeOtherSessions(e.target.checked)}
                    className="mt-0.5 accent-emerald-600 rounded"
                  />
                  <div>
                    <span className="font-semibold block">Cabut Semua Sesi Perangkat Lain (Single-Session Enforcement)</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Otomatis menaikkan epoch token dan memutus sesi aktif sebelumnya di perangkat lain.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer ${subSurfaceCls}`}>
                  <input
                    type="checkbox"
                    checked={strictIpLock}
                    onChange={(e) => setStrictIpLock(e.target.checked)}
                    className="mt-0.5 accent-emerald-600 rounded"
                  />
                  <div>
                    <span className="font-semibold block">Strict IP & User-Agent Session Lock</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Menolak penggunaan ulang token jika alamat IP, User-Agent, atau Device Fingerprint berubah.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleHardAbort}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Batalkan Login
                </button>
                <button
                  type="button"
                  onClick={handleAuthorizeSession}
                  disabled={isVerifying || stageLockedOut}
                  className="px-5 py-2.5 rounded-xl bg-[#00733B] hover:bg-[#005E30] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Masuk</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`mt-5 pt-3 border-t flex items-center justify-between text-[10.5px] ${effectiveIsLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'}`}>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Sesi terenkripsi terikat perangkat</span>
          </span>
          <span className="font-mono">AAL2</span>
        </div>
      </motion.div>
    </div>
  );
}
