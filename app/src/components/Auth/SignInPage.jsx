import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import SecurityVerificationModal from './SecurityVerificationModal';
import { API_BASE_URL, getDeviceFingerprint, clearSessionStorage } from '../../services/apiConfig';

const GOOGLE_RECAPTCHA_V2_SITE_KEY =
  (import.meta.env.VITE_RECAPTCHA_V2_SITE_KEY || import.meta.env.VITE_RECAPTCHA_SITE_KEY || '').trim() ||
  '6LenfyEuAAAAAIO8NmwteCBYTckl9ms1oH_ylxgP';
const GOOGLE_RECAPTCHA_V3_SITE_KEY =
  (import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY || '').trim() ||
  '6LeEjSEuAAAAAPXb9p-mI1zU62h1d83aHzqLrEW2';
const GOOGLE_RECAPTCHA_ENTERPRISE_SITE_KEY =
  (import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY || '').trim() ||
  '6Lc2NSEuAAAAADW7f9jk2eC16oSjNfNnmwcvv5QE';

function getRecaptchaSdk() {
  if (typeof window === 'undefined' || !window.grecaptcha) return null;
  if (window.grecaptcha.enterprise && typeof window.grecaptcha.enterprise.render === 'function') {
    return window.grecaptcha.enterprise;
  }
  if (typeof window.grecaptcha.render === 'function') {
    return window.grecaptcha;
  }
  return null;
}

export default function SignInPage({
  onLoginSuccess,
  sessionNotice,
  initialMode = 'login',
  resetToken = '',
  onExitReset,
}) {

  const [mode, setMode] = useState(
    initialMode === 'reset' ? 'reset' : initialMode === 'forgot' ? 'forgot' : 'login'
  );

  // 4-field strict credentials
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Google reCAPTCHA multi-layer state (v2 Checkbox + v3 Score + Enterprise)
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaEnterpriseToken, setRecaptchaEnterpriseToken] = useState('');
  const [recaptchaV2Ready, setRecaptchaV2Ready] = useState(false);
  const [recaptchaEnterpriseReady, setRecaptchaEnterpriseReady] = useState(false);
  const [recaptchaV3Status, setRecaptchaV3Status] = useState('idle');
  const [recaptchaLoadError, setRecaptchaLoadError] = useState(false);
  const recaptchaV2ContainerRef = useRef(null);
  const recaptchaEnterpriseContainerRef = useRef(null);
  const recaptchaV2WidgetIdRef = useRef(null);
  const recaptchaEnterpriseWidgetIdRef = useRef(null);

  // Feedback & submit state
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  // Reset password state
  const [resetValidating, setResetValidating] = useState(false);
  const [resetInvalidMsg, setResetInvalidMsg] = useState('');
  const [resetAccountInfo, setResetAccountInfo] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  // MFA Modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [preAuthToken, setPreAuthToken] = useState('');

  useEffect(() => {
    if (initialMode === 'reset') {
      setMode('reset');
    } else if (initialMode === 'login' && mode === 'reset') {
      setMode('login');
    }
  }, [initialMode]);

  useEffect(() => {
    if (sessionNotice && mode === 'login') {
      setErrorMsg(sessionNotice);
    }
  }, [sessionNotice, mode]);

  const resetRecaptchaWidget = useCallback(() => {
    setRecaptchaToken('');
    setRecaptchaEnterpriseToken('');
    setRecaptchaV3Status('idle');
    const sdk = getRecaptchaSdk();
    if (!sdk || typeof sdk.reset !== 'function') return;
    [recaptchaV2WidgetIdRef.current, recaptchaEnterpriseWidgetIdRef.current].forEach((widgetId) => {
      if (widgetId !== null) {
        try {
          sdk.reset(widgetId);
        } catch {}
      }
    });
  }, []);

  // Load unified Enterprise script once (for v2 Checkbox + v3 Score + Enterprise Checkbox)
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const needsWidget = mode === 'login' || (mode === 'forgot' && !forgotSubmitted);
    if (!needsWidget) return undefined;

    let cancelled = false;
    let initTimer = null;
    let pollTimer = null;
    let timeoutTimer = null;
    setRecaptchaToken('');
    setRecaptchaEnterpriseToken('');
    setRecaptchaV2Ready(false);
    setRecaptchaEnterpriseReady(false);
    setRecaptchaV3Status('idle');
    setRecaptchaLoadError(false);
    recaptchaV2WidgetIdRef.current = null;
    recaptchaEnterpriseWidgetIdRef.current = null;

    const clearTimers = () => {
      if (initTimer) {
        clearTimeout(initTimer);
        initTimer = null;
      }
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
    };

    const renderCheckboxSlot = (sdk, containerRef, widgetIdRef, siteKey, extraParams, onToken, onReady) => {
      if (widgetIdRef.current !== null) return true;
      if (!containerRef.current) return false;
      const mountNode = document.createElement('div');
      containerRef.current.replaceChildren(mountNode);
      const widgetId = sdk.render(mountNode, {
        sitekey: siteKey,
        theme: 'light',
        hl: 'id',
        ...extraParams,
        callback: (token) => {
          if (!cancelled) {
            onToken(token || '');
            setErrorMsg('');
          }
        },
        'expired-callback': () => {
          if (!cancelled) onToken('');
        },
        'error-callback': () => {
          if (!cancelled) onToken('');
        },
      });
      widgetIdRef.current = widgetId;
      onReady(true);
      return true;
    };

    const renderWidgets = () => {
      if (cancelled) return false;
      const sdk = getRecaptchaSdk();
      if (!sdk) return false;

      try {
        const v2Ok = renderCheckboxSlot(
          sdk,
          recaptchaV2ContainerRef,
          recaptchaV2WidgetIdRef,
          GOOGLE_RECAPTCHA_V2_SITE_KEY,
          {},
          setRecaptchaToken,
          setRecaptchaV2Ready
        );
        const entOk = renderCheckboxSlot(
          sdk,
          recaptchaEnterpriseContainerRef,
          recaptchaEnterpriseWidgetIdRef,
          GOOGLE_RECAPTCHA_ENTERPRISE_SITE_KEY,
          { action: mode === 'forgot' ? 'FORGOT_PASSWORD' : 'LOGIN' },
          setRecaptchaEnterpriseToken,
          setRecaptchaEnterpriseReady
        );
        if (v2Ok && entOk) {
          clearTimers();
          setRecaptchaLoadError(false);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    window.claimtraceRecaptchaCallback = () => {
      renderWidgets();
    };

    if (!document.getElementById('google-recaptcha-api-script')) {
      const script = document.createElement('script');
      script.id = 'google-recaptcha-api-script';
      script.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(
        GOOGLE_RECAPTCHA_V3_SITE_KEY
      )}&onload=claimtraceRecaptchaCallback&hl=id`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        if (!cancelled) setRecaptchaLoadError(true);
      };
      document.head.appendChild(script);
    }

    // Defer initial render across React 18 StrictMode's synchronous double-mount
    initTimer = setTimeout(() => {
      if (cancelled || renderWidgets()) return;
      pollTimer = setInterval(() => {
        renderWidgets();
      }, 200);
      timeoutTimer = setTimeout(() => {
        if (
          !cancelled &&
          (recaptchaV2WidgetIdRef.current === null || recaptchaEnterpriseWidgetIdRef.current === null)
        ) {
          setRecaptchaLoadError(true);
          clearTimers();
        }
      }, 12000);
    }, 0);

    return () => {
      cancelled = true;
      clearTimers();
      recaptchaV2WidgetIdRef.current = null;
      recaptchaEnterpriseWidgetIdRef.current = null;
    };
  }, [mode, forgotSubmitted]);

  // Validate password reset token whenever viewing reset_password route
  useEffect(() => {
    if (mode !== 'reset') return;
    let active = true;
    setErrorMsg('');
    setResetInvalidMsg('');
    setResetAccountInfo(null);
    setResetSuccessMsg('');
    setNewPassword('');
    setConfirmPassword('');

    if (!resetToken || !resetToken.trim()) {
      setResetInvalidMsg('Tautan ubah password tidak ditemukan atau tidak lengkap.');
      return;
    }

    const validateToken = async () => {
      setResetValidating(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/auth/reset-password/validate?token=${encodeURIComponent(resetToken.trim())}`,
          { method: 'GET', cache: 'no-store' }
        );
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok) {
          setResetInvalidMsg(data.detail || 'Tautan ubah password tidak valid atau sudah kedaluwarsa.');
          return;
        }
        setResetAccountInfo(data);
      } catch {
        if (active) {
          setResetInvalidMsg('Gagal memeriksa tautan ke server autentikasi.');
        }
      } finally {
        if (active) setResetValidating(false);
      }
    };

    validateToken();
    return () => {
      active = false;
    };
  }, [mode, resetToken]);

  const switchMode = (nextMode) => {
    setErrorMsg('');
    setForgotSubmitted(false);
    setForgotMessage('');
    setResetInvalidMsg('');
    setResetSuccessMsg('');
    if (nextMode !== 'reset' && mode === 'reset' && onExitReset) {
      onExitReset();
    }
    setMode(nextMode);
  };

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidStrictEmail = (val) =>
    val.includes('@') && val.includes('.') && EMAIL_PATTERN.test(val);
  const isDigitsOnlyNip = (val) => /^\d+$/.test(val);

  const handleNipChange = (e) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/\D/g, '');
    setNip(digitsOnly);
    if (raw !== digitsOnly) {
      setErrorMsg('NIP wajib menggunakan angka saja.');
    } else if (errorMsg) {
      setErrorMsg('');
    }
  };

  const handleEmailBlur = () => {
    const em = email.trim();
    if (em && !isValidStrictEmail(em)) {
      setErrorMsg('Format Email tidak valid (wajib mengandung @ dan .).');
    }
  };

  const executeRecaptchaV3Token = async (actionName) => {
    const sdk = getRecaptchaSdk();
    if (!sdk || typeof sdk.execute !== 'function') {
      throw new Error('SDK Google reCAPTCHA v3 belum siap.');
    }
    setRecaptchaV3Status('running');
    const timeoutMs = 8000;
    const execPromise = new Promise((resolve, reject) => {
      const runExec = () => {
        try {
          Promise.resolve(sdk.execute(GOOGLE_RECAPTCHA_V3_SITE_KEY, { action: actionName }))
            .then((token) => {
              if (!token) reject(new Error('Token Google reCAPTCHA v3 kosong.'));
              else resolve(token);
            })
            .catch(reject);
        } catch (err) {
          reject(err);
        }
      };
      if (typeof sdk.ready === 'function') {
        sdk.ready(runExec);
      } else {
        runExec();
      }
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Waktu verifikasi reCAPTCHA v3 habis.')), timeoutMs)
    );
    const token = await Promise.race([execPromise, timeoutPromise]);
    setRecaptchaV3Status('verified');
    return token;
  };

  const buildLayeredCaptchaPayload = async (flowType) => {
    if (!recaptchaToken || !recaptchaEnterpriseToken) {
      setErrorMsg(
        'Selesaikan seluruh verifikasi Google reCAPTCHA (v2 Checkbox dan Enterprise Checkbox) terlebih dahulu.'
      );
      return null;
    }
    const v3Action = flowType === 'forgot' ? 'forgot_password' : 'login';
    const entAction = flowType === 'forgot' ? 'FORGOT_PASSWORD' : 'LOGIN';
    try {
      const v3Token = await executeRecaptchaV3Token(v3Action);
      return {
        recaptcha_token: recaptchaToken,
        recaptcha_v2_token: recaptchaToken,
        recaptcha_v3_token: v3Token,
        recaptcha_v3_action: v3Action,
        recaptcha_enterprise_token: recaptchaEnterpriseToken,
        recaptcha_enterprise_action: entAction,
      };
    } catch (v3Err) {
      setRecaptchaV3Status('error');
      setErrorMsg(
        v3Err?.message
          ? `Verifikasi reCAPTCHA v3 gagal: ${v3Err.message}`
          : 'Verifikasi Google reCAPTCHA v3 gagal dijalankan.'
      );
      return null;
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const u = username.trim();
    const em = email.trim();
    const np = nip.trim();

    if (!u || !em || !np || !password) {
      setErrorMsg('Username, Email, NIP, dan Password wajib diisi lengkap.');
      return;
    }
    if (!isValidStrictEmail(em)) {
      setErrorMsg('Format Email tidak valid (wajib mengandung @ dan .).');
      return;
    }
    if (!isDigitsOnlyNip(np)) {
      setErrorMsg('NIP wajib menggunakan angka saja.');
      return;
    }

    setIsSubmitting(true);
    const captchaPayload = await buildLayeredCaptchaPayload('login');
    if (!captchaPayload) {
      setIsSubmitting(false);
      return;
    }

    const deviceFingerprint = getDeviceFingerprint();

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Fingerprint': deviceFingerprint,
        },
        body: JSON.stringify({
          username: u,
          email: em,
          nip: np,
          password,
          ...captchaPayload,
          device_fingerprint: deviceFingerprint,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMsg(data.detail || 'Username, Email, NIP, atau Password tidak valid.');
        setPassword('');
        resetRecaptchaWidget();
        return;
      }

      if (!data.token || !data.user) {
        setErrorMsg('Respons server tidak lengkap.');
        resetRecaptchaWidget();
        return;
      }

      setPendingUser(data.user);
      setPreAuthToken(data.token);
      setPassword('');
      setShowVerificationModal(true);
    } catch {
      setErrorMsg('Tidak dapat terhubung ke server autentikasi.');
      resetRecaptchaWidget();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const u = username.trim();
    const em = email.trim();
    const np = nip.trim();

    if (!u || !em || !np) {
      setErrorMsg('Username, Email, dan NIP wajib diisi lengkap.');
      return;
    }
    if (!isValidStrictEmail(em)) {
      setErrorMsg('Format Email tidak valid (wajib mengandung @ dan .).');
      return;
    }
    if (!isDigitsOnlyNip(np)) {
      setErrorMsg('NIP wajib menggunakan angka saja.');
      return;
    }

    setIsSubmitting(true);
    const captchaPayload = await buildLayeredCaptchaPayload('forgot');
    if (!captchaPayload) {
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: u,
          email: em,
          nip: np,
          ...captchaPayload,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMsg(data.detail || 'Permintaan lupa password ditolak.');
        resetRecaptchaWidget();
        return;
      }
      setForgotMessage(
        data.message ||
          'Jika Username, Email, dan NIP sesuai dengan akun terdaftar, tautan ubah password telah dikirim ke email Anda.'
      );
      setForgotSubmitted(true);
      setRecaptchaToken('');
      setRecaptchaEnterpriseToken('');
      setRecaptchaV3Status('idle');
    } catch {
      setErrorMsg('Tidak dapat terhubung ke server autentikasi.');
      resetRecaptchaWidget();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword || !confirmPassword) {
      setErrorMsg('Password baru dan konfirmasi password wajib diisi.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken.trim(),
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMsg(data.detail || 'Gagal memperbarui password.');
        return;
      }
      setNewPassword('');
      setConfirmPassword('');
      setResetSuccessMsg(
        data.message || 'Password berhasil diubah. Silakan masuk kembali dengan password baru Anda.'
      );
    } catch {
      setErrorMsg('Tidak dapat terhubung ke server autentikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardSurface =
    'bg-white border-[#E2E8F0] text-[#061B31] shadow-[0_12px_36px_-12px_rgba(6,27,49,0.12)]';

  const inputSurface =
    'bg-[#F7F8FA] border-[#CBD5E1] text-[#061B31] placeholder-slate-400 focus:border-[#00733B] focus:bg-white focus:ring-2 focus:ring-[#00733B]/15';

  const labelClass = 'text-xs font-medium block text-slate-700';

  const renderRecaptchaBlock = () => {
    const bothWidgetsReady = recaptchaV2Ready && recaptchaEnterpriseReady;
    return (
      <div className="pt-1 space-y-2.5">
        <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00733B]" />
              <span>Verifikasi Keamanan Multi-Layer</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-medium">
              <span
                className={`px-1.5 py-0.5 rounded border ${
                  recaptchaToken
                    ? 'bg-emerald-50 border-emerald-200 text-[#00733B]'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                v2 {recaptchaToken ? <Check className="w-3 h-3 inline ml-0.5" /> : <span className="ml-0.5">-</span>}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded border ${
                  recaptchaEnterpriseToken
                    ? 'bg-emerald-50 border-emerald-200 text-[#00733B]'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                Enterprise {recaptchaEnterpriseToken ? <Check className="w-3 h-3 inline ml-0.5" /> : <span className="ml-0.5">-</span>}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded border ${
                  recaptchaV3Status === 'verified'
                    ? 'bg-emerald-50 border-emerald-200 text-[#00733B]'
                    : recaptchaV3Status === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                v3 {recaptchaV3Status === 'verified' ? <Check className="w-3 h-3 inline ml-0.5" /> : 'Auto'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-medium text-slate-600">
              1. Google reCAPTCHA v2 Checkbox
            </p>
            <div className="flex justify-center overflow-x-auto min-h-[78px]">
              <div key={`${mode}-v2`} ref={recaptchaV2ContainerRef} />
            </div>
          </div>

          <div className="space-y-1 pt-1 border-t border-slate-200/80">
            <p className="text-[11px] font-medium text-slate-600">
              2. Google reCAPTCHA Enterprise
            </p>
            <div className="flex justify-center overflow-x-auto min-h-[78px]">
              <div key={`${mode}-ent`} ref={recaptchaEnterpriseContainerRef} />
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-600">3. Google reCAPTCHA v3 (Score)</span>
            <span
              className={
                recaptchaV3Status === 'verified'
                  ? 'text-[#00733B] font-semibold'
                  : recaptchaV3Status === 'error'
                  ? 'text-rose-600 font-semibold'
                  : 'text-slate-500'
              }
            >
              {recaptchaV3Status === 'running'
                ? 'Memverifikasi skor...'
                : recaptchaV3Status === 'verified'
                ? 'Skor terverifikasi'
                : recaptchaV3Status === 'error'
                ? 'Gagal dijalankan'
                : 'Otomatis saat kirim'}
            </span>
          </div>

          {!bothWidgetsReady && !recaptchaLoadError && (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Memuat Google reCAPTCHA v2, v3 & Enterprise...</span>
            </div>
          )}

          {recaptchaLoadError && (
            <div className="text-center space-y-1.5 py-1">
              <p className="text-xs text-rose-600">
                Gagal memuat widget Google reCAPTCHA.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-xs font-medium text-[#00733B] underline cursor-pointer"
              >
                Muat ulang halaman
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 bg-[#F7F8FA] text-[#061B31]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-[430px] space-y-5 relative z-10"
      >
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#061B31]">
            {mode === 'login'
              ? 'Masuk ClaimTrace'
              : mode === 'forgot'
              ? 'Lupa Password'
              : 'Ubah Password'}
          </h1>
          {mode === 'forgot' && (
            <p className="text-xs text-slate-600">
              Masukkan Username, Email, dan NIP akun terdaftar.
            </p>
          )}
          {mode === 'reset' && (
            <p className="text-xs text-slate-600">
              Tetapkan password baru untuk akun Anda.
            </p>
          )}
        </div>

        <div className={`rounded-2xl border p-6 sm:p-7 space-y-4 ${cardSurface}`}>
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-snug">{errorMsg}</span>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} autoComplete="off" noValidate className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="login-username" className={labelClass}>
                  Username
                </label>
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  placeholder="Masukan Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${inputSurface}`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="login-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Masukan Email" onBlur={handleEmailBlur}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${inputSurface}`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="login-nip" className={labelClass}>
                  NIP
                </label>
                <input
                  id="login-nip"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Masukan NIP" pattern="[0-9]*"
                  value={nip}
                  onChange={handleNipChange}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none transition ${inputSurface}`}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className={labelClass}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs font-medium cursor-pointer hover:underline text-[#00733B]"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none transition ${inputSurface}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {renderRecaptchaBlock()}

              <button
                type="submit"
                disabled={isSubmitting || !recaptchaToken || !recaptchaEnterpriseToken}
                className="w-full py-2.5 px-4 rounded-xl bg-[#00733B] hover:bg-[#005E30] text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk'}</span>
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <>
              {forgotSubmitted ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-emerald-800 text-xs leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{forgotMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#00733B] hover:bg-[#005E30] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Masuk</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} autoComplete="off" noValidate className="space-y-3.5">
                  <div className="space-y-1">
                    <label htmlFor="forgot-username" className={labelClass}>
                      Username
                    </label>
                    <input
                      id="forgot-username"
                      type="text"
                      placeholder="Masukan Username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${inputSurface}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="forgot-email" className={labelClass}>
                      Email
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="Masukan Email" onBlur={handleEmailBlur}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${inputSurface}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="forgot-nip" className={labelClass}>
                      NIP
                    </label>
                    <input
                      id="forgot-nip"
                      type="text"
                      inputMode="numeric"
                      placeholder="Masukan NIP" pattern="[0-9]*"
                      value={nip}
                      onChange={handleNipChange}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none transition ${inputSurface}`}
                    />
                  </div>

                  {renderRecaptchaBlock()}

                  <button
                    type="submit"
                    disabled={isSubmitting || !recaptchaToken || !recaptchaEnterpriseToken}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#00733B] hover:bg-[#005E30] text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <span>{isSubmitting ? 'Mengirim...' : 'Kirim'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full py-2 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali ke Masuk</span>
                  </button>
                </form>
              )}
            </>
          )}

          {mode === 'reset' && (
            <>
              {resetValidating ? (
                <div className="py-8 flex flex-col items-center gap-2.5 text-xs text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#00733B]" />
                  <span>Memeriksa tautan ubah password...</span>
                </div>
              ) : resetInvalidMsg ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-700 text-xs leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{resetInvalidMsg}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Halaman Masuk
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="py-2.5 px-3 rounded-xl bg-[#00733B] hover:bg-[#005E30] text-white text-xs font-semibold cursor-pointer"
                    >
                      Minta Link Baru
                    </button>
                  </div>
                </div>
              ) : resetSuccessMsg ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-emerald-800 text-xs leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{resetSuccessMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#00733B] hover:bg-[#005E30] text-white font-semibold text-sm cursor-pointer"
                  >
                    Masuk Sekarang
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} autoComplete="off" className="space-y-3.5">
                  {resetAccountInfo && (
                    <div className="px-3.5 py-2.5 rounded-xl border text-xs flex items-center justify-between bg-[#F7F8FA] border-[#E2E8F0] text-slate-700">
                      <span className="font-semibold">{resetAccountInfo.username}</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {resetAccountInfo.email_masked}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="reset-new-password" className={labelClass}>
                      Password Baru
                    </label>
                    <div className="relative">
                      <input
                        id="reset-new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Minimal 10 karakter"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none transition ${inputSurface}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        aria-label={showNewPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="reset-confirm-password" className={labelClass}>
                      Konfirmasi Password Baru
                    </label>
                    <input
                      id="reset-confirm-password"
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Ulangi password baru"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${inputSurface}`}
                    />
                  </div>

                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Wajib minimal 10 karakter dengan huruf besar, huruf kecil, angka, dan simbol.
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#00733B] hover:bg-[#005E30] text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full py-2 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali ke Masuk</span>
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </motion.div>

      <SecurityVerificationModal
        isOpen={showVerificationModal}
        user={pendingUser}
        identifier={pendingUser?.nip || nip || username || email}
        preAuthToken={preAuthToken}
        isLight={true}
        onCompleteVerification={(verifiedUser, sessionMeta) => {
          setShowVerificationModal(false);
          setPreAuthToken('');
          if (onLoginSuccess) onLoginSuccess(verifiedUser, sessionMeta);
        }}
        onCancelSignOut={() => {
          setShowVerificationModal(false);
          setPendingUser(null);
          setPreAuthToken('');
          setPassword('');
          clearSessionStorage({ broadcast: false });
          resetRecaptchaWidget();
        }}
      />
    </div>
  );
}
