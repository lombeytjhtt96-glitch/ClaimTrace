import React, { useState, useEffect } from 'react';
import { API_BASE_URL, authFetch, cachedAuthGetJson } from '../../services/apiConfig';
import { Gavel, Clock, CheckCircle2, AlertTriangle, RefreshCw, Send } from 'lucide-react';

export default function SanggahanAppealsPanel({
  activeClaimId = 'CLM-2026-8801',
  faskesName = 'RS Medika Prima',
  canAdjudicate = true,
  isLight = true,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [category, setCategory] = useState('KODING_RULE_MB');
  const [disputedRp, setDisputedRp] = useState('12500000');
  const [argumentText, setArgumentText] = useState(
    'Faskes melampirkan RME bertanda tangan elektronik DPJP, CPPT harian, serta hasil laboratorium objektif sebagai dasar pemenuhan kriteria medis INA-CBG.'
  );
  const [docsList, setDocsList] = useState('Resume Medis Elektronik, Hasil Laboratorium Terverifikasi');
  const [submitting, setSubmitting] = useState(false);

  const loadAppeals = async (forceRefresh = false) => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (forceRefresh) {
        const res = await authFetch(`${API_BASE_URL}/api/v1/appeals`);
        if (!res.ok) {
          throw new Error(`Gagal memuat daftar sanggahan BAKB (${res.status}).`);
        }
        setData(await res.json());
      } else {
        const payload = await cachedAuthGetJson(`${API_BASE_URL}/api/v1/appeals`);
        if (payload) {
          setData(payload);
        } else {
          const res = await authFetch(`${API_BASE_URL}/api/v1/appeals`);
          if (!res.ok) {
            throw new Error(`Gagal memuat daftar sanggahan BAKB (${res.status}).`);
          }
          setData(await res.json());
        }
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Tidak dapat terhubung ke layanan Sanggahan BAKB.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppeals();
  }, [activeClaimId]);

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/appeals/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: activeClaimId,
          faskes_name: faskesName,
          appeal_category: category,
          disputed_amount_rp: Number(disputedRp || 0),
          clinical_argument: argumentText,
          supporting_documents: docsList.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Gagal mengajukan sanggahan (${res.status}).`);
      }
      const out = await res.json();
      setSuccessMsg(`Sanggahan ${out.appeal?.appeal_id} terdaftar dengan tenggat SLA ${out.appeal?.sla_deadline}.`);
      await loadAppeals(true);
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal mengajukan sanggahan BAKB.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjudicate = async (appeal) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/appeals/${appeal.appeal_id}/adjudicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'DITERIMA_SEBAGIAN',
          approved_amount_rp: Math.round((appeal.disputed_amount_rp || 0) * 0.75),
          resolution_note: 'Disetujui sebagian setelah verifikasi bukti penunjang klinis dan CPPT DPJP.',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Gagal menetapkan keputusan sanggahan (${res.status}).`);
      }
      setSuccessMsg(`Keputusan sanggahan ${appeal.appeal_id} tersimpan ke audit ledger SHA-256.`);
      await loadAppeals(true);
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal memproses keputusan sanggahan.');
    }
  };

  const inputClass = `w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
    isLight ? 'bg-slate-50 border-slate-200 text-[#061B31]' : 'bg-[#161A22] border-white/15 text-[#F3F5F8]'
  }`;

  const appeals = data?.appeals || [];

  return (
    <section
      aria-label="Manajemen Sanggahan BAKB & SLA 15 Hari Perpres 82/2018"
      className={`p-5 rounded-2xl border transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-[#061B31] shadow-sm'
          : 'bg-[#11141A] border-white/10 text-[#F3F5F8]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            <Gavel className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sanggahan BAKB &amp; Sengketa Klinis (Perpres 82/2018 Pasal 76)</span>
          </div>
          <h2 className="text-base font-display font-semibold tracking-tight mt-0.5">
            Pelacakan SLA 15 Hari Kalender &amp; Eskalasi Denda 1%/Bulan
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs tabular-nums">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 font-mono">
            Aktif: <strong>{data?.open_appeals ?? 0}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-mono">
            Kritis &lt;= 3 hr: <strong>{data?.urgent_count ?? 0}</strong>
          </span>
          <button
            type="button"
            onClick={loadAppeals}
            aria-label="Muat ulang daftar sanggahan"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div role="alert" className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div role="status" className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FORM PENGAJUAN SANGGAHAN BARU */}
      <form onSubmit={handleSubmitAppeal} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10">
        <div>
          <label htmlFor="appeal-cat" className="block text-[11px] font-semibold text-slate-500 mb-1">
            Kategori Sanggahan ({activeClaimId})
          </label>
          <select id="appeal-cat" name="appeal_category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option value="KODING_RULE_MB">Sekuens Diagnosis Rule MB1-MB5</option>
            <option value="FORNAS_RESTRICTION">Restriksi Obat Formularium Nasional</option>
            <option value="READMISSION_CLINICAL">Readmisi &lt; 30 Hari (Indikasi Baru)</option>
            <option value="DOCUMENT_COMPLETENESS">Susulan Kelengkapan Berkas SEP/RME</option>
          </select>
        </div>
        <div>
          <label htmlFor="appeal-amount" className="block text-[11px] font-semibold text-slate-500 mb-1">
            Nilai Selisih Disengketakan (Rp)
          </label>
          <input
            id="appeal-amount"
            name="disputed_amount_rp"
            type="number"
            min="1000"
            value={disputedRp}
            onChange={(e) => setDisputedRp(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="appeal-docs" className="block text-[11px] font-semibold text-slate-500 mb-1">
            Lampiran Bukti Klinis (pisah koma)
          </label>
          <input
            id="appeal-docs"
            name="supporting_documents"
            type="text"
            value={docsList}
            onChange={(e) => setDocsList(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="appeal-arg" className="block text-[11px] font-semibold text-slate-500 mb-1">
            Justifikasi Klinis &amp; Dasar Regulasi
          </label>
          <input
            id="appeal-arg"
            name="clinical_argument"
            type="text"
            value={argumentText}
            onChange={(e) => setArgumentText(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{submitting ? 'Mengirim...' : 'Ajukan Sanggahan BAKB'}</span>
          </button>
        </div>
      </form>

      {/* DAFTAR SANGGAHAN */}
      <div className="mt-4 space-y-2.5">
        {appeals.slice(0, 5).map((ap) => {
          const remainingDays = Number(ap.remaining_calendar_days ?? 0);
          const slaDaysLabel = remainingDays < 0
            ? `Terlambat ${Math.abs(remainingDays)} hr`
            : `Sisa ${remainingDays} hr`;
          return (
          <div
            key={ap.appeal_id}
            className={`p-3 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#161A22] border-white/10'
            }`}
          >
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-[#061B31] dark:text-white">{ap.appeal_id}</span>
                <span className="font-mono text-[11px] text-slate-500">{ap.claim_id}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    ap.sla_status === 'LEWAT_BATAS_DENDA_1PCT'
                      ? 'bg-rose-100 text-rose-800'
                      : ap.sla_status === 'KRITIS_MENDEKATI_BATAS'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <Clock className="w-3 h-3 inline mr-1" aria-hidden="true" />
                  {ap.status} · {slaDaysLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">{ap.clinical_argument}</p>
              <div className="text-[10px] font-mono text-slate-500">
                Dispute: Rp {Number(ap.disputed_amount_rp || 0).toLocaleString('id-ID')} · Denda Berjalan: Rp{' '}
                {Number(ap.estimated_penalty_rp || 0).toLocaleString('id-ID')} · Batas: {ap.sla_deadline}
              </div>
            </div>

            {canAdjudicate && !['DITERIMA_PENUH', 'DITERIMA_SEBAGIAN', 'DITOLAK_TETAP'].includes(ap.status) && (
              <button
                type="button"
                onClick={() => handleAdjudicate(ap)}
                className="px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold shrink-0 cursor-pointer transition"
              >
                Putuskan Sebagian (75%)
              </button>
            )}
          </div>
          );
        })}
      </div>
    </section>
  );
}
