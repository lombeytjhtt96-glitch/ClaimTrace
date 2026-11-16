import React, { useState, useEffect } from 'react';
import { API_BASE_URL, authFetch } from '../../services/apiConfig';
import { Activity, Database, AlertTriangle, RefreshCw, Layers } from 'lucide-react';

export default function WarehouseCohortPanel({ isLight = true, kelasFilter = '' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadClusters = async (forceRefresh = false) => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (kelasFilter) qs.set('kelas_filter', kelasFilter);
      if (forceRefresh) qs.set('force_refresh', 'true');
      const url = `${API_BASE_URL}/api/v1/analytics/fraud-ranking/warehouse-clusters${qs.toString() ? `?${qs.toString()}` : ''}`;
      const res = await authFetch(url);
      if (!res.ok) {
        throw new Error(`Gagal memuat kohort gudang data (${res.status}).`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err?.message || 'Gagal mengambil metrik perilaku FKRTL dari server analitik.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters(false);
  }, [kelasFilter]);

  const clusters = data?.clusters || [];

  return (
    <section
      aria-label="Pemetaan Risiko Perilaku Faskes Gudang Data BPJS"
      className={`p-5 rounded-xl border transition-colors ${
        isLight
          ? 'bg-white border-[#061B31]/[0.08] shadow-[0_1px_2px_rgba(6,27,49,0.04)] text-[#061B31]'
          : 'bg-[#11141A] border-white/[0.08] text-[#F3F5F8]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#061B31]/[0.08] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            <Database className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Agregasi Gudang Data BPJS FKRTL Live</span>
            {data?.total_rows_scanned > 0 && (
              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] tabular-nums">
                {data.total_rows_scanned.toLocaleString('id-ID')} Baris ({data.query_elapsed_ms} ms)
              </span>
            )}
          </div>
          <h2 className="text-base font-display font-semibold tracking-tight mt-1">
            Profil Risiko Perilaku Kohort Provider (HHI, Rawat Inap, ALOS &amp; Kasus Kronis)
          </h2>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Kalkulasi SQL langsung atas data klaim FKRTL nasional per segmen kepemilikan dan kelas rumah sakit.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadClusters(true)}
          disabled={loading}
          aria-label="Hitung ulang agregasi gudang data"
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 shrink-0 ${
            isLight
              ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-200'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Hitung Ulang SQL</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {loading && clusters.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">Menghitung metrik HHI dan intensitas kronis dari 1,69 juta baris FKRTL...</div>
      ) : clusters.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">Tidak ada kohort provider yang memenuhi filter kelas saat ini.</div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-[11px] uppercase tracking-wider ${
                isLight ? 'border-slate-200 text-slate-500 bg-slate-50/70' : 'border-white/10 text-slate-400 bg-white/5'
              }`}>
                <th scope="col" className="py-2.5 px-3 font-semibold">Kohort Provider</th>
                <th scope="col" className="py-2.5 px-3 font-semibold text-right">Volume Klaim</th>
                <th scope="col" className="py-2.5 px-3 font-semibold text-right">Klaim / Pasien</th>
                <th scope="col" className="py-2.5 px-3 font-semibold text-right">Rasio RITL</th>
                <th scope="col" className="py-2.5 px-3 font-semibold text-right">ALOS (CV)</th>
                <th scope="col" className="py-2.5 px-3 font-semibold text-right">HHI Poli</th>
                <th scope="col" className="py-2.5 px-3 font-semibold text-right">Kronis</th>
                <th scope="col" className="py-2.5 px-3 font-semibold text-center">Skor Kohort</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/10 tabular-nums">
              {clusters.slice(0, 8).map((c) => (
                <tr key={c.cohort_id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-[#061B31] dark:text-[#F3F5F8]">{c.cohort_label}</div>
                    {c.anomaly_flags?.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.anomaly_flags.slice(0, 2).map((flag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">{c.cohort_id}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold">
                    {Number(c.claim_count).toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {Number(c.rasio_klaim_per_pasien).toFixed(2)}x
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {Number(c.inpatient_ratio_pct).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {Number(c.avg_los_days).toFixed(2)} hr{' '}
                    <span className="text-slate-400">({Number(c.los_uniformity_cv).toFixed(2)})</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {Number(c.hhi_specialty_concentration).toFixed(0)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {Number(c.chronic_condition_intensity_pct).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-xs font-bold ${
                        c.cohort_risk_score >= 70
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : c.cohort_risk_score >= 45
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      <Layers className="w-3 h-3" aria-hidden="true" />
                      {c.cohort_risk_score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
