import React, { useEffect } from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

/**
 * Legacy route /?view=mfa guard:
 * Zero client-side bypass allowed. Step-up verification runs exclusively inside the
 * backend-enforced PRE_AUTH token chain inside SignInPage + SecurityVerificationModal.
 */
export default function MfaStepUpPage({ onBackToLogin, isLight = true }) {
  useEffect(() => {
    if (onBackToLogin) {
      onBackToLogin();
    }
  }, [onBackToLogin]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 ${
        isLight ? 'bg-[#F7F8FA] text-[#061B31]' : 'bg-[#090B0E] text-[#F1F5F9]'
      }`}
    >
      <div
        className={`max-w-md w-full rounded-2xl border p-6 space-y-4 text-center ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#11141A] border-white/10'
        }`}
      >
        <div className="inline-flex p-3 rounded-xl bg-amber-500/10 text-amber-600 mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold">Autentikasi Tahap Awal Diperlukan</h2>
        <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Verifikasi MFA hanya dapat dijalankan secara berurutan setelah kredensial primer dan tantangan keamanan server tervalidasi.
        </p>
        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full py-2.5 px-4 rounded-xl bg-[#00733B] hover:bg-[#005E30] text-white font-semibold text-xs inline-flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Login</span>
        </button>
      </div>
    </div>
  );
}
