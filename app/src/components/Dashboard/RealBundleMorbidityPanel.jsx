import React, { useState } from 'react';
import { API_BASE_URL, authFetch } from '../../services/apiConfig';
import { Stethoscope, Upload, CheckCircle2, AlertTriangle, RefreshCw, Activity } from 'lucide-react';

export default function RealBundleMorbidityPanel({ activeClaimId = 'CLM-2026-8801', isLight = true, onBundleAudited }) {
  const [primaryIcd, setPrimaryIcd] = useState('R50.9');
  const [secondaryIcdText, setSecondaryIcdText] = useState('A41.9, N18.5');
  const [procedureCode, setProcedureCode] = useState('39.95');
  const [medicationsText, setMedicationsText] = useState('Human Albumin 20%, Epoetin Alfa');
  const [patientAge, setPatientAge] = useState('58');
  const [patientSex, setPatientSex] = useState('L');
  const [tarifRp, setTarifRp] = useState('18500000');
  const [tglMasuk, setTglMasuk] = useState('2026-10-02');
  const [tglKeluar, setTglKeluar] = useState('2026-10-06');
  const [signedDpjp, setSignedDpjp] = useState(true);
  const [pstv01Sample, setPstv01Sample] = useState('87010924');

  const [mbResult, setMbResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [loadingMb, setLoadingMb] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const parseList = (str) =>
    String(str || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const runMorbidityAudit = async (e) => {
    e.preventDefault();
    setLoadingMb(true);
    setErrorMsg('');
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/clinical/morbidity-audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_icd10: primaryIcd.trim().toUpperCase(),
          secondary_icd10s: parseList(secondaryIcdText).map((c) => c.toUpperCase()),
          procedure_icd9cm: procedureCode.trim() ? [procedureCode.trim().toUpperCase()] : [],
          patient_age: patientAge ? Number(patientAge) : null,
          patient_sex: patientSex || null,
          tarif_klaim_rp: Number(tarifRp || 0),
          medications: parseList(medicationsText),
          pstv01: pstv01Sample ? Number(pstv01Sample) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Audit Rule MB1-MB5 gagal (${res.status}).`);
      }
      setMbResult(await res.json());
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal memproses evaluasi Rule MB1-MB5 & Fornas.');
    } finally {
      setLoadingMb(false);
    }
  };

  const submitRealBundle = async () => {
    setLoadingSubmit(true);
    setErrorMsg('');
    try {
      const docs = [
        {
          doc_type: 'SEP',
          is_signed_electronically: signedDpjp,
          extracted_fields: { tgl_sep: tglMasuk },
        },
        {
          doc_type: 'RESUME_MEDIS',
          is_signed_electronically: signedDpjp,
          extracted_fields: { tgl_masuk: tglMasuk, tgl_keluar: tglKeluar },
        },
        {
          doc_type: 'PENUNJANG_LAB',
          is_signed_electronically: true,
        },
        {
          doc_type: 'BILLING_RS',
          is_signed_electronically: true,
        },
      ];
      if (procedureCode.trim()) {
        docs.push({
          doc_type: 'LAPORAN_OPERASI',
          is_signed_electronically: signedDpjp,
          extracted_fields: { procedure_code: procedureCode.trim() },
        });
      }

      const res = await authFetch(`${API_BASE_URL}/api/v1/documents/audit/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: activeClaimId,
          ina_cbg_code: 'I-4-10-II',
          primary_icd10: primaryIcd.trim().toUpperCase(),
          secondary_icd10s: parseList(secondaryIcdText).map((c) => c.toUpperCase()),
          procedure_icd9cm: procedureCode.trim() || null,
          claimed_tariff_rp: Number(tarifRp || 0),
          documents: docs,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Gagal menyimpan bundel dokumen riil (${res.status}).`);
      }
      const data = await res.json();
      setSubmitResult(data);
      if (onBundleAudited) onBundleAudited(data);
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal mengunggah bundel dokumen klaim riil.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const inputClass = `w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
    isLight ? 'bg-slate-50 border-slate-200 text-[#061B31]' : 'bg-[#161A22] border-white/15 text-[#F3F5F8]'
  }`;

  return (
    <section
      aria-label="Validator Koding Rule MB1-MB5, Fornas, Readmisi 30 Hari & Pengunggahan Bundel Dokumen Riil"
      className={`p-5 rounded-xl border transition-colors ${
        isLight
          ? 'bg-white border-[#061B31]/[0.08] shadow-[0_1px_2px_rgba(6,27,49,0.04)] text-[#061B31]'
          : 'bg-[#11141A] border-white/[0.08] text-[#F3F5F8]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#061B31]/[0.08] dark:border-white/[0.08]">
        <div>
          <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Modul Klinis Permenkes 76/2016 &amp; Pengajuan Berkas Faskes
          </span>
          <h2 className="text-base font-display font-semibold tracking-tight mt-0.5">
            Audit Rule MB1-MB5, Kepatuhan Fornas, Readmisi 30 Hari &amp; Bundel Dokumen Riil
          </h2>
        </div>
        <div className="text-xs font-mono text-slate-500">Klaim Target: {activeClaimId}</div>
      </div>

      {errorMsg && (
        <div role="alert" className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={runMorbidityAudit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <div>
          <label htmlFor="mb-primary-icd" className="block text-[11px] font-semibold text-slate-500 mb-1">
            Diagnosis Primer (ICD-10)
          </label>
          <input
            id="mb-primary-icd"
            type="text"
            value={primaryIcd}
            onChange={(e) => setPrimaryIcd(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="mb-secondary-icd" className="block text-[11px] font-semibold text-slate-500 mb-1">
            Diagnosis Sekunder (pisah koma)
          </label>
          <input
            id="mb-secondary-icd"
            type="text"
            value={secondaryIcdText}
            onChange={(e) => setSecondaryIcdText(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="mb-proc" className="block text-[11px] font-semibold text-slate-500 mb-1">
            Prosedur ICD-9-CM
          </label>
          <input
            id="mb-proc"
            type="text"
            value={procedureCode}
            onChange={(e) => setProcedureCode(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="mb-meds" className="block text-[11px] font-semibold text-slate-500 mb-1">
            Obat Restriksi Fornas
          </label>
          <input
            id="mb-meds"
            type="text"
            value={medicationsText}
            onChange={(e) => setMedicationsText(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="mb-age" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Usia (Thn)
            </label>
            <input
              id="mb-age"
              type="number"
              min="0"
              max="120"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="mb-sex" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Kelamin
            </label>
            <select id="mb-sex" value={patientSex} onChange={(e) => setPatientSex(e.target.value)} className={inputClass}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="mb-masuk" className="block text-[11px] font-semibold text-slate-500 mb-1">
            Tanggal Masuk SEP / RME
          </label>
          <input id="mb-masuk" type="date" value={tglMasuk} onChange={(e) => setTglMasuk(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="mb-keluar" className="block text-[11px] font-semibold text-slate-500 mb-1">
            Tanggal Keluar Resume
          </label>
          <input id="mb-keluar" type="date" value={tglKeluar} onChange={(e) => setTglKeluar(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label htmlFor="mb-tarif" className="block text-[11px] font-semibold text-slate-500 mb-1">
            Tarif Tagih (Rp) &amp; PSTV01
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input id="mb-tarif" type="number" min="0" value={tarifRp} onChange={(e) => setTarifRp(e.target.value)} className={inputClass} />
            <input
              aria-label="ID Peserta PSTV01 Readmisi"
              type="number"
              value={pstv01Sample}
              onChange={(e) => setPstv01Sample(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={signedDpjp}
              onChange={(e) => setSignedDpjp(e.target.checked)}
              className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
            />
            <span>TTE Elektronik DPJP Valid pada Resume &amp; SEP</span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={loadingMb}
              className="px-3.5 py-2 rounded-lg bg-[#061B31] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              {loadingMb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Stethoscope className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>Uji Rule MB1-MB5 &amp; Fornas</span>
            </button>
            <button
              type="button"
              disabled={loadingSubmit}
              onClick={submitRealBundle}
              className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              {loadingSubmit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Upload className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>Ajukan &amp; Audit Bundel Riil</span>
            </button>
          </div>
        </div>
      </form>

      {(mbResult || submitResult) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
          {mbResult && (
            <div className={`p-3.5 rounded-lg border text-xs space-y-2 ${isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                  Hasil Rule MB1-MB5 &amp; Fornas
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  mbResult.morbidity_audit?.is_coding_compliant && mbResult.fornas_audit?.fornas_compliant
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {mbResult.morbidity_audit?.total_findings || 0} Temuan MB · {mbResult.fornas_audit?.total_fornas_flags || 0} Fornas
                </span>
              </div>
              {mbResult.morbidity_audit?.findings?.map((f, idx) => (
                <div key={idx} className="p-2.5 rounded bg-white dark:bg-[#11141A] border border-rose-200 dark:border-rose-900/50 space-y-0.5">
                  <div className="font-mono text-[10px] font-bold text-rose-700 dark:text-rose-400">
                    {f.rule_code} ({f.severity})
                  </div>
                  <div className="font-semibold">{f.title}</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">{f.detail}</p>
                </div>
              ))}
              {mbResult.fornas_audit?.flags?.map((fl, idx) => (
                <div key={`f-${idx}`} className="p-2.5 rounded bg-white dark:bg-[#11141A] border border-amber-200 dark:border-amber-900/50 space-y-0.5">
                  <div className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    {fl.rule_code}: {fl.drug_name}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">{fl.detail}</p>
                </div>
              ))}
              {mbResult.readmission_audit && (
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Evaluasi Readmisi 30 Hari ({mbResult.readmission_audit.source}):{' '}
                  <strong>{mbResult.readmission_audit.episodes_evaluated} episode</strong>{' '}
                  {mbResult.readmission_audit.has_readmission_alert
                    ? `- Terdeteksi ${mbResult.readmission_audit.alerts.length} alert readmisi <= 30 hari.`
                    : '- Tidak ditemukan readmisi < 30 hari.'}
                </div>
              )}
            </div>
          )}

          {submitResult && (
            <div className={`p-3.5 rounded-lg border text-xs space-y-2 ${isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-800/40'}`}>
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  Bundel Dokumen Riil Tersimpan ({submitResult.claim_id})
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white dark:bg-[#11141A] border border-emerald-300 dark:border-emerald-700">
                  Sumber: {submitResult.bundle_source}
                </span>
              </div>
              <p className="text-[11px]">
                Skor Kepatuhan: <strong className="font-mono">{submitResult.compliance_score_pct}%</strong> · Status:{' '}
                <strong>{submitResult.audit_status}</strong> · Temuan Klinis: <strong>{submitResult.findings?.length || 0}</strong>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">{submitResult.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
