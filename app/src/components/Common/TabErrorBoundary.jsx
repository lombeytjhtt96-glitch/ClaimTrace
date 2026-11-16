import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { isChunkLoadError } from '../../utils/lazyWithRetry';

export default class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Terjadi kendala saat merender modul analitik.',
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { isLight = true, moduleLabel = 'Modul Portal', onGoHome } = this.props;
    const staleChunk = isChunkLoadError(this.state.errorMessage);
    const displayMessage = staleChunk
      ? 'Versi halaman di tab browser belum sinkron dengan server terbaru. Klik Muat Ulang Modul untuk menyinkronkan tanpa keluar dari sesi login Anda.'
      : this.state.errorMessage;
    return (
      <div
        role="alert"
        className={`rounded-2xl border p-6 shadow-sm ${
          isLight
            ? 'bg-white border-rose-200 text-slate-900'
            : 'bg-[#0E1116] border-rose-500/30 text-slate-100'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isLight
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold tracking-tight">
              Kendala Tampilan pada {moduleLabel}
            </h2>
            <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {displayMessage}
            </p>
            {staleChunk && (
              <p className={`text-[11px] font-mono mt-1 break-all ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                {this.state.errorMessage}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (staleChunk && typeof window !== 'undefined') {
                    window.location.reload();
                    return;
                  }
                  this.setState({ hasError: false, errorMessage: '' });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Muat Ulang Modul</span>
              </button>
              {typeof onGoHome === 'function' && (
                <button
                  type="button"
                  onClick={() => {
                    this.setState({ hasError: false, errorMessage: '' });
                    onGoHome();
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'bg-white/5 border-white/15 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Kembali ke Ringkasan</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
