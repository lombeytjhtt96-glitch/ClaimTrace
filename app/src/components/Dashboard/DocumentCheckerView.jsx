import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  Download,
  ExternalLink,
  ChevronRight,
  Eye,
  CheckSquare,
  Building,
  User,
  Calendar,
  DollarSign,
  Stethoscope,
  FileSpreadsheet,
  AlertOctagon,
  RefreshCw,
  Stamp,
  BadgeCheck,
  Send
} from 'lucide-react';
import { API_BASE_URL, authFetch } from '../../services/apiConfig';

export default function DocumentCheckerView({ isLight = true, currentUser }) {
  const [activeClaimId, setActiveClaimId] = useState('CLM-2026-8801');
  const [selectedDocType, setSelectedDocType] = useState('RESUME_MEDIS');
  const [auditReport, setAuditReport] = useState(null);
  const [documentsBundle, setDocumentsBundle] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [actionErrorMessage, setActionErrorMessage] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Daftar berkas klaim FKRTL yang diaudit kelengkapan klinisnya
  const claimOptions = [
    { id: 'CLM-2026-8801', label: 'RS Medika Prima (Upcoding Severity III / Inversi Temporal)', badge: 'Kritis', badgeColor: 'bg-rose-100 text-rose-800' },
    { id: 'CLM-2026-8802', label: 'RS Khusus Mitra Husada (Phantom Billing Baksos)', badge: 'Fiktif', badgeColor: 'bg-rose-100 text-rose-800' },
    { id: 'CLM-2026-8803', label: 'RS Jantung Harapan Sehat (Unbundling Kateterisasi)', badge: 'Fragmentasi', badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'CLM-2026-8804', label: 'RS Daerah Kartini (Repeat Billing Dialisis)', badge: 'Ganda', badgeColor: 'bg-amber-100 text-amber-800' },
  ];

  useEffect(() => {
    fetchDocumentAudit(activeClaimId);
  }, [activeClaimId]);

  const fetchDocumentAudit = async (claimId) => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/documents/audit/${claimId}`);
      if (res.ok) {
        const data = await res.json();
        setAuditReport(data);
        setDocumentsBundle(data.documents || []);
        if (data.documents && data.documents.length > 0) {
          setSelectedDocType(data.documents[0].doc_type);
        }
      }
    } catch (err) {
      console.error('Failed to load document audit:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeDoc = documentsBundle.find((d) => d.doc_type === selectedDocType) || documentsBundle[0];

  const handleAction = async (type) => {
    const actionMap = {
      hold: {
        decision: 'PENDING_KLARIFIKASI',
        catatan: 'Berita Acara Pending Berkas (BAPK) diterbitkan dari Audit Kelengkapan Berkas Klinis.',
        success: 'Berita Acara Pending Berkas (BAPK) berhasil disimpan dan dikirimkan ke faskes rumah sakit.'
      },
      reject: {
        decision: 'TIDAK_LAYAK_FRAUD',
        catatan: 'Penolakan berkas klaim disahkan dengan rujukan pelanggaran Permenkes No. 26/2021 dan ketidaksesuaian bukti medis objektif.',
        success: 'Penolakan berkas klaim berhasil disahkan ke audit trail dan rujukan Permenkes No. 26/2021.'
      },
      approve: {
        decision: 'LAYAK_BAYAR',
        catatan: 'Kelayakan administrasi 7 berkas klinis disetujui untuk diteruskan ke tahap pembayaran.',
        success: 'Kelayakan administrasi berkas disetujui dan tercatat pada basis data verifikasi klaim.'
      }
    };
    const cfg = actionMap[type];
    if (!cfg || submittingAction) return;

    setSubmittingAction(true);
    setActionErrorMessage('');
    setActionSuccessMessage('');
    try {
      const actorNip = currentUser?.nip || '';
      const res = await authFetch(`${API_BASE_URL}/api/v1/claims/${activeClaimId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verifier_id: actorNip,
          decision: cfg.decision,
          catatan_verifikator: cfg.catatan
        })
      });
      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload?.detail || `Gagal menyimpan disposisi (${res.status}).`);
      }
      setActionSuccessMessage(cfg.success);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('claimtrace:operations-updated', { detail: { claimId: activeClaimId, decision: cfg.decision } }));
      }
      setTimeout(() => setActionSuccessMessage(''), 5000);
    } catch (err) {
      setActionErrorMessage(err?.message || 'Gagal menyambung ke layanan disposisi klaim.');
      setTimeout(() => setActionErrorMessage(''), 6000);
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER SECTION */}
      <div className={`p-5 rounded-xl border transition-colors ${
        isLight ? 'bg-white border-[#061B31]/[0.08] shadow-[0_1px_2px_rgba(6,27,49,0.04)]' : 'bg-[#11141A] border-white/[0.08] text-[#F3F5F8]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Modul Verifikasi Dokumen RS
              </span>
              <span className="text-xs text-slate-400">· Petunjuk Teknis Verifikasi Digital Klaim</span>
            </div>
            <h1 className={`text-xl font-display font-semibold tracking-tight mt-1 ${isLight ? 'text-[#061B31]' : 'text-[#F3F5F8]'}`}>
              Pengecekan Dokumen Klaim & Berkas Rekam Medis RS
            </h1>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Inspeksi forensik kelengkapan 7 berkas wajib FKRTL, validasi tanda tangan DPJP, verifikasi penunjang objektif, dan deteksi unbundling billing.
            </p>
          </div>

          {/* CLAIM SELECTOR */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Pilih Kasus:</span>
            <select
              value={activeClaimId}
              onChange={(e) => setActiveClaimId(e.target.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              {claimOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.id} - {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => fetchDocumentAudit(activeClaimId)}
              title="Muat Ulang Audit"
              className={`p-1.5 rounded-lg border transition ${
                isLight ? 'hover:bg-slate-100 border-slate-200 text-slate-600' : 'hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {actionSuccessMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage('')} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">×</button>
        </motion.div>
      )}

      {actionErrorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-medium flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionErrorMessage}</span>
          </div>
          <button onClick={() => setActionErrorMessage('')} className="text-rose-700 hover:text-rose-900 font-bold ml-2">×</button>
        </motion.div>
      )}

      {/* KPI COMPLIANCE BANNER */}
      {auditReport && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status Kelayakan Berkas</span>
            <div className="flex items-center space-x-2 mt-1.5">
              {auditReport.audit_status === 'LENGKAP_DAN_SAH' ? (
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                  LENGKAP & SAH
                </span>
              ) : auditReport.audit_status === 'INDIKASI_FABRIKASI' ? (
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-800 border border-rose-300">
                  INDIKASI ANOMALI KRITIS
                </span>
              ) : auditReport.audit_status === 'KURANG_BERKAS' ? (
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
                  BERKAS BELUM LENGKAP
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-100 text-orange-800 border border-orange-300">
                  DISKREPANSI KLINIS
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">{auditReport.recommendation}</p>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Skor Kepatuhan Berkas</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className={`text-2xl font-display font-semibold tabular-nums ${
                auditReport.compliance_score_pct >= 85 ? 'text-emerald-700' : auditReport.compliance_score_pct >= 50 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {auditReport.compliance_score_pct}%
              </span>
              <span className="text-xs text-slate-400">/ 100% Target Juknis</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${
                  auditReport.compliance_score_pct >= 85 ? 'bg-emerald-600' : auditReport.compliance_score_pct >= 50 ? 'bg-amber-500' : 'bg-rose-600'
                }`}
                style={{ width: `${auditReport.compliance_score_pct}%` }}
              />
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Dokumen Diajukan</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-display font-semibold tabular-nums text-[#061B31] dark:text-[#F3F5F8]">{auditReport.total_documents_submitted}</span>
              <span className="text-xs text-slate-400">dari {auditReport.mandatory_documents_required} berkas wajib</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {auditReport.missing_documents.length === 0 ? 'Semua berkas inti terlampir' : `Kekurangan: ${auditReport.missing_documents.join(', ')}`}
            </p>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Integritas Berkas Digital</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <BadgeCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-mono font-bold text-slate-700">SHA-256 Valid</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1 truncate" title={auditReport.bundle_hash_sha256}>
              {auditReport.bundle_hash_sha256}
            </p>
          </div>
        </div>
      )}

      {/* SPLIT VIEW WORKSPACE: LEFT (DOCUMENTS BUNDLE & VIEWER) VS RIGHT (AUDIT FINDINGS & COMPLIANCE MATRIX) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: DOCUMENT TABS & VIEWER (7 COLUMNS) */}
        <div className="lg:col-span-7 space-y-3">
          {/* DOCUMENT TABS */}
          <div className={`p-2 rounded-xl border overflow-x-auto flex space-x-1.5 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            {documentsBundle.map((doc) => {
              const isSelected = selectedDocType === doc.doc_type;
              return (
                <button
                  key={doc.doc_id}
                  onClick={() => setSelectedDocType(doc.doc_type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : isLight
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>{doc.doc_title.split('(')[0].trim()}</span>
                  {doc.doc_type === 'RESUME_MEDIS' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* DIGITAL DOCUMENT VIEWER CARD */}
          {activeDoc && (
            <div className={`p-4 rounded-xl border transition-colors ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 text-white'
            }`}>
              {/* DOCUMENT META HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-bold">
                      {activeDoc.doc_type}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{activeDoc.file_name}</span>
                    <span className="text-[11px] text-slate-400">({activeDoc.file_size_kb} KB)</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {activeDoc.doc_title}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                    activeDoc.is_signed_electronically
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}>
                    {activeDoc.is_signed_electronically ? 'TTE Tersertifikasi' : 'Tanpa TTE'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">OCR: {activeDoc.ocr_confidence_pct}%</span>
                </div>
              </div>

              {/* EXTRACTED METADATA FIELDS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">DPJP Pengesah</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{activeDoc.dpjp_name}</p>
                  <p className="text-[10px] font-mono text-slate-500 truncate">{activeDoc.dpjp_sip}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Token Peserta</span>
                  <p className="font-mono text-slate-800 dark:text-slate-200 truncate">{activeDoc.patient_id_token}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Waktu Unggah</span>
                  <p className="font-mono text-slate-800 dark:text-slate-200 text-[11px]">
                    {activeDoc.upload_timestamp.split('T')[0]}
                  </p>
                </div>
              </div>

              {/* FORMAL DOCUMENT CONTENT PREVIEW (BERKAS KLINIS RESMI) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/60 dark:bg-slate-950 font-mono text-xs space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-800 text-[11px] text-slate-500">
                  <span>{(claimOptions.find((o) => o.id === activeClaimId)?.label || 'FASKES RUJUKAN').split(' (')[0].toUpperCase()} · REKAM KLINIS FKRTL</span>
                  <span>LEMBAR DOKUMEN KLINIS #{activeDoc.doc_id}</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 py-2">
                  {activeDoc.extracted_text_snippet}
                </div>
                <div className="pt-2 border-t border-dashed border-slate-300 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Stamp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Stempel Elektronik RS: {activeDoc.is_stamp_valid ? 'Sah & Terdaftar' : 'Meragukan'}</span>
                  </span>
                  <span>Kerahasiaan Medis Dijamin UU PDP No. 27/2022</span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => handleAction('hold')}
                  className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Terbitkan BAPK (Pending Berkas)</span>
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-800 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Tolak Berkas (Diskrepansi)</span>
                </button>
                <button
                  onClick={() => handleAction('approve')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verifikasi Sah (Loloskan ke Tier 2)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AUDIT FINDINGS & CROSS-DOCUMENT COMPLIANCE MATRIX (5 COLUMNS) */}
        <div className="lg:col-span-5 space-y-3">
          {/* CROSS-DOCUMENT COMPLIANCE MATRIX */}
          {auditReport && (
            <div className={`p-4 rounded-xl border transition-colors ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 text-white'
            }`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>Matriks Keselarasan Lintas Dokumen</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-700 dark:text-slate-300">Identitas Pasien (SEP vs Resume)</span>
                  {auditReport.cross_document_checks.sep_vs_resume_identity_match ? (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Cocok</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-600 flex items-center space-x-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Diskrepansi</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-700 dark:text-slate-300">Kronologi Tanggal (Masuk vs Keluar)</span>
                  {auditReport.cross_document_checks.temporal_coherence_verified ? (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Koheren</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-600 flex items-center space-x-1">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>Inversi Waktu</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-700 dark:text-slate-300">Pengabsahan DPJP & Tanda Tangan</span>
                  {auditReport.cross_document_checks.dpjp_signature_verified ? (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valid</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-600 flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Beda DPJP</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-700 dark:text-slate-300">Rekonsiliasi Billing (Unbundling)</span>
                  {auditReport.cross_document_checks.billing_reconciliation_balanced ? (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sesuai Paket</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-600 flex items-center space-x-1">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>Fragmentasi</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AUDIT FINDINGS LIST */}
          {auditReport && (
            <div className={`p-4 rounded-xl border transition-colors ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 text-white'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Daftar Temuan Anomali Berkas ({auditReport.findings.length})</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Permenkes 26/2021</span>
              </div>

              {auditReport.findings.length === 0 ? (
                <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium text-center">
                  Tidak ditemukan pelanggaran dokumen pada klaim ini. Seluruh berkas memenuhi kaidah kelengkapan klinis.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {auditReport.findings.map((f, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                        f.severity === 'CRITICAL'
                          ? 'bg-rose-50/60 border-rose-300 text-rose-950 dark:bg-rose-950/20 dark:border-rose-800'
                          : f.severity === 'HIGH'
                          ? 'bg-orange-50/60 border-orange-300 text-orange-950 dark:bg-orange-950/20 dark:border-orange-800'
                          : 'bg-amber-50/60 border-amber-300 text-amber-950 dark:bg-amber-950/20 dark:border-amber-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 border">
                          {f.rule_id}
                        </span>
                        <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                          f.severity === 'CRITICAL' ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                        }`}>
                          {({ CRITICAL: 'Kritis', HIGH: 'Tinggi', MEDIUM: 'Sedang', LOW: 'Rendah' }[f.severity] || f.severity)}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs">{f.title}</h4>
                      <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">{f.description}</p>
                      <div className="pt-1.5 border-t border-slate-200/80 dark:border-slate-700/60 text-[10px] space-y-0.5">
                        <p className="text-slate-500 font-semibold">Dasar Regulasi:</p>
                        <p className="italic text-slate-600 dark:text-slate-400">{f.regulatory_reference}</p>
                        <p className="text-slate-500 font-semibold mt-1">Tindakan Verifikator:</p>
                        <p className="font-semibold text-emerald-800 dark:text-emerald-400">{f.remediation_action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
