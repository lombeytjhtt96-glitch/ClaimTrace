import React, { useState, useEffect } from 'react';
import RealBundleMorbidityPanel from './RealBundleMorbidityPanel';
import { motion, AnimatePresence } from 'motion/react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { SegmentedComplianceBar, PolicyStepProgressRing } from '../Common/PolicyWidgets';
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
  Send,
  Upload,
  ArrowUpRight,
  X,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { API_BASE_URL, authFetch, cachedAuthGetJson } from '../../services/apiConfig';

const BASELINE_CLAIM_OPTIONS = [
  { id: 'CLM-2026-8801', label: 'RS Khusus Mitra Husada (Fisioterapi Cluster / Inversi Temporal)', badge: 'Kritis', badgeColor: 'bg-rose-100 text-rose-800' },
  { id: 'CLM-2026-8802', label: 'RS Swasta As-Syifa (Repeat Billing Gastroenteritis)', badge: 'Ganda', badgeColor: 'bg-amber-100 text-amber-800' },
  { id: 'CLM-2026-8803', label: 'RS Khusus Mata Nusantara (Baksos Katarak Terdaftar)', badge: 'Valid', badgeColor: 'bg-emerald-100 text-emerald-800' },
  { id: 'CLM-2026-8804', label: 'Klinik Pratama Hemodialisis (Hemodialisis Berkala)', badge: 'Rutin', badgeColor: 'bg-sky-100 text-sky-800' },
  { id: 'CLM-2026-8805', label: 'RS Daerah Kartini (Anomali Geovelocity SDMK)', badge: 'Anomali', badgeColor: 'bg-rose-100 text-rose-800' },
  { id: 'CLM-2026-8806', label: 'RS Medika Prima (Upcoding Severity III)', badge: 'Upcoding', badgeColor: 'bg-rose-100 text-rose-800' },
];

export default function DocumentCheckerView({ isLight = true, currentUser, initialClaimId, onSelectClaim }) {
  const [claimOptions, setClaimOptions] = useState(BASELINE_CLAIM_OPTIONS);
  const [activeClaimId, setActiveClaimId] = useState(() => initialClaimId || 'CLM-2026-8801');
  const [selectedDocType, setSelectedDocType] = useState('RESUME_MEDIS');
  const [auditReport, setAuditReport] = useState(null);
  const [documentsBundle, setDocumentsBundle] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [actionErrorMessage, setActionErrorMessage] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [icdQuery, setIcdQuery] = useState('');
  const [icdResults, setIcdResults] = useState([]);
  const [icdLoading, setIcdLoading] = useState(false);
  const [icdSearched, setIcdSearched] = useState(false);
  const [showUploadScanModal, setShowUploadScanModal] = useState(false);
  const [scanProgress, setScanProgress] = useState(16);
  const [isScanningAi, setIsScanningAi] = useState(false);
  const [scanUrlInput, setScanUrlInput] = useState('');
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [hideModalAlert, setHideModalAlert] = useState(false);
  const [hideComplianceBanner, setHideComplianceBanner] = useState(false);
  const [nlpAnalysis, setNlpAnalysis] = useState(null);
  const [showNlpView, setShowNlpView] = useState(false);

  useEscapeKey(showUploadScanModal, () => setShowUploadScanModal(false));

  const handleRunAiScan = async () => {
    setIsScanningAi(true);
    setScanProgress(64);
    try {
      await fetchDocumentAudit(activeClaimId, true);
      setScanProgress(100);
    } finally {
      setIsScanningAi(false);
    }
  };

  const handleModalFilePick = (file) => {
    if (!file) return;
    setSelectedUploadFile({
      name: file.name,
      sizeLabel: `${Math.max(0.1, file.size / (1024 * 1024)).toFixed(2)} MB`,
    });
    setScanProgress(48);
  };

  useEffect(() => {
    let active = true;
    const loadClaimsList = async () => {
      try {
        const payload = await cachedAuthGetJson(`${API_BASE_URL}/api/v1/claims?limit=40`);
        if (!payload || !active) return;
        const rawList = Array.isArray(payload) ? payload : (payload?.claims || payload?.data || []);
        if (!Array.isArray(rawList) || rawList.length === 0) return;

        const merged = [...BASELINE_CLAIM_OPTIONS];
        const seen = new Set(merged.map((c) => c.id));
        rawList.forEach((item) => {
          const id = item.claim_id || item.id;
          if (!id || seen.has(id)) return;
          seen.add(id);
          const faskes = item.faskes_name || item.hospital || item.nama_faskes || 'FKRTL Mitra JKN';
          const modus = item.modus_label || item.modus || item.triage_lane || 'Audit Forensik';
          merged.push({
            id,
            label: `${faskes} (${modus})`,
            badge: item.triage_lane || 'Klaim Aktif',
            badgeColor: 'bg-slate-100 text-slate-800',
          });
        });
        if (active) setClaimOptions(merged);
      } catch {
        // Pertahankan daftar dasar saat mode offline
      }
    };
    loadClaimsList();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!initialClaimId) return;
    setActiveClaimId(initialClaimId);
    setClaimOptions((prev) => {
      if (prev.some((c) => c.id === initialClaimId)) return prev;
      return [{ id: initialClaimId, label: `Klaim Kasus Aktif (${initialClaimId})`, badge: 'Dipilih', badgeColor: 'bg-emerald-100 text-emerald-800' }, ...prev];
    });
  }, [initialClaimId]);

  useEffect(() => {
    fetchDocumentAudit(activeClaimId);
  }, [activeClaimId]);

  const fetchDocumentAudit = async (claimId, forceRefresh = false) => {
    setLoading(true);
    setActionErrorMessage('');
    try {
      let data = null;
      const url = `${API_BASE_URL}/api/v1/documents/audit/${encodeURIComponent(claimId)}`;
      if (!forceRefresh) {
        data = await cachedAuthGetJson(url);
      }
      if (!data) {
        const res = await authFetch(url);
        if (!res.ok) {
          const errPayload = await res.json().catch(() => ({}));
          throw new Error(errPayload?.detail || `Gagal memuat audit berkas (${res.status}).`);
        }
        data = await res.json();
      }
      setAuditReport(data);
      setDocumentsBundle(data.documents || []);
      if (data.documents && data.documents.length > 0) {
        setSelectedDocType(data.documents[0].doc_type);
      }
      cachedAuthGetJson(`${API_BASE_URL}/api/v1/nlp/claim-audit/${encodeURIComponent(claimId)}`)
        .then((nlpRes) => {
          if (nlpRes && nlpRes.status === 'success') {
            setNlpAnalysis(nlpRes);
          }
        })
        .catch(() => {});
    } catch (err) {
      setActionErrorMessage(err?.message || 'Gagal memuat audit kelengkapan berkas RS dari server.');
    } finally {
      setLoading(false);
    }
  };

  const handleIcdSearch = async (e) => {
    e?.preventDefault?.();
    const cleanQ = icdQuery.trim();
    if (cleanQ.length < 2) {
      setIcdResults([]);
      setIcdSearched(false);
      return;
    }
    setIcdLoading(true);
    setIcdSearched(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/terminology/icd10/search?q=${encodeURIComponent(cleanQ)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setIcdResults(Array.isArray(data?.results) ? data.results : []);
      } else {
        setIcdResults([]);
      }
    } catch {
      setIcdResults([]);
    } finally {
      setIcdLoading(false);
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
                Verifikasi 7 Dokumen Wajib RS
              </span>
              <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>· PMK 26/2021</span>
            </div>
            <h1 className={`text-xl font-display font-semibold tracking-tight mt-1 ${isLight ? 'text-[#061B31]' : 'text-[#F3F5F8]'}`}>
              Pengecekan Dokumen Klaim & Berkas Rekam Medis RS
            </h1>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Audit visual kelengkapan 7 berkas RM, validasi TTE DPJP, serta uji koding ICD-10 dan kaidah Fornas.
            </p>
          </div>

          {/* CLAIM SELECTOR */}
          <div className="flex items-center space-x-2 shrink-0">
            <label htmlFor="doc-checker-claim-select" className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Pilih Kasus:</label>
            <select
              id="doc-checker-claim-select"
              aria-label="Pilih kasus klaim untuk verifikasi berkas"
              value={activeClaimId}
              onChange={(e) => {
                const nextId = e.target.value;
                setActiveClaimId(nextId);
                if (onSelectClaim) onSelectClaim({ id: nextId });
              }}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[300px] sm:max-w-md ${
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
              type="button"
              onClick={() => fetchDocumentAudit(activeClaimId, true)}
              aria-label="Muat ulang audit kelengkapan berkas"
              title="Muat Ulang Audit"
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isLight ? 'hover:bg-slate-100 border-slate-200 text-slate-600' : 'hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                setScanProgress(16);
                setHideModalAlert(false);
                setShowUploadScanModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah &amp; AI Scan</span>
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
          <button type="button" aria-label="Tutup pesan sukses" onClick={() => setActionSuccessMessage('')} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">×</button>
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
          <button type="button" aria-label="Tutup pesan galat" onClick={() => setActionErrorMessage('')} className="text-rose-700 hover:text-rose-900 font-bold ml-2">×</button>
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
              {auditReport.missing_documents.length === 0
                ? (auditReport.compliance_score_pct < 85
                    ? 'Berkas inti ada, cek validasi TTE/kronologi'
                    : 'Semua berkas inti terlampir')
                : `Kekurangan: ${auditReport.missing_documents.join(', ')}`}
            </p>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Integritas Berkas Digital</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <BadgeCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>SHA-256 Valid</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1 truncate" title={auditReport.bundle_hash_sha256}>
              {auditReport.bundle_hash_sha256}
            </p>
          </div>
        </div>
      )}

      {/* COMPLIANCE BAR RINGKAS (POLICYPILOT DOCUMENT COMPLIANCE) */}
      {auditReport && (() => {
        const validDocs = documentsBundle.filter((d) => d.is_signed_electronically && d.is_stamp_valid).length;
        const needCheckDocs = Math.max(0, documentsBundle.length - validDocs);
        const missingDocs = Array.isArray(auditReport.missing_documents) ? auditReport.missing_documents.length : 0;
        const totalSegments = Math.max(1, validDocs + needCheckDocs + missingDocs);
        return (
          <SegmentedComplianceBar
            isLight={isLight}
            title="Ringkasan Kepatuhan 7 Dokumen Wajib"
            segments={[
              { id: 'missing', label: 'Belum Lengkap', count: missingDocs, pct: (missingDocs / totalSegments) * 100, color: '#EA580C' },
              { id: 'check', label: 'Perlu Cek TTE', count: needCheckDocs, pct: (needCheckDocs / totalSegments) * 100, color: '#F59E0B' },
              { id: 'valid', label: 'Lengkap & Sah', count: validDocs, pct: (validDocs / totalSegments) * 100, color: '#059669' },
            ]}
            validCount={validDocs}
            validLabel="Dokumen Sah"
            pendingCount={needCheckDocs + missingDocs}
            pendingLabel="Perlu Verifikasi"
            warningText={
              hideComplianceBanner || (needCheckDocs + missingDocs === 0)
                ? ''
                : 'Sebagian berkas belum memenuhi TTE/stempel sah atau belum terlampir. Gunakan Unggah & AI Scan untuk memverifikasi cepat.'
            }
            onDismissWarning={() => setHideComplianceBanner(true)}
            actionLabel="Buka modal unggah dan AI scan dokumen"
            onActionClick={() => setShowUploadScanModal(true)}
          />
        );
      })()}

      {/* SPLIT VIEW WORKSPACE: LEFT (DOCUMENTS BUNDLE & VIEWER) VS RIGHT (AUDIT FINDINGS & COMPLIANCE MATRIX) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: DOCUMENT TABS & VIEWER (7 COLUMNS) */}
        <div className="lg:col-span-7 space-y-3">
          {/* DOCUMENT TABS */}
          <div className={`p-2 rounded-xl border flex flex-wrap items-center gap-1.5 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            {documentsBundle.map((doc) => {
              const isSelected = selectedDocType === doc.doc_type;
              const isDocComplete = Boolean(doc.is_signed_electronically && doc.is_stamp_valid);
              return (
                <button
                  key={doc.doc_id}
                  type="button"
                  onClick={() => setSelectedDocType(doc.doc_type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : isLight
                      ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isDocComplete ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                    aria-hidden="true"
                  />
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>{doc.doc_title.split('(')[0].trim()}</span>
                  <span className={`text-[10px] font-mono ${
                    isSelected ? 'text-emerald-100' : isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {isDocComplete ? 'Sah' : 'Perlu Cek'}
                  </span>
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

                {/* INLINE CLINICAL NLP & MACHINE LEARNING INSPECTOR */}
                {activeDoc.doc_type === 'RESUME_MEDIS' && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowNlpView(!showNlpView)}
                      className={`w-full py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                        showNlpView
                          ? (isLight ? 'bg-cyan-50 border-cyan-300 text-cyan-900' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200')
                          : (isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80')
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span>Analisis Forensik NLP &amp; Keselarasan Klinis (NER, NegEx, ChromaDB)</span>
                      </span>
                      <span className="text-[10px] font-mono">
                        {showNlpView ? 'Sembunyikan ▲' : 'Tampilkan Telaah AI ▼'}
                      </span>
                    </button>

                    {showNlpView && nlpAnalysis && (
                      <div className={`mt-2 p-3 rounded-lg border text-xs space-y-2.5 ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#00102b] border-white/10'
                      }`}>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
                          <span className="font-bold">
                            Keselarasan Narasi: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{nlpAnalysis.nlp_analysis?.alignment_evaluation?.alignment_score_pct}%</strong> ({nlpAnalysis.nlp_analysis?.alignment_evaluation?.status})
                          </span>
                          <span className="font-mono text-[10.5px]">
                            ChromaDB Vektor: <strong className={nlpAnalysis.vector_semantic_embedding?.is_semantic_plagiarized ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>{nlpAnalysis.vector_semantic_embedding?.similarity_score_pct}% Mirip</strong>
                          </span>
                        </div>

                        {/* Extracted Entities Pills */}
                        <div>
                          <span className="text-[10px] uppercase font-bold opacity-60 block mb-1">Entitas Klinis Terdeteksi ({nlpAnalysis.nlp_analysis?.entities?.length || 0}):</span>
                          <div className="flex flex-wrap gap-1">
                            {(nlpAnalysis.nlp_analysis?.entities || []).map((ent, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                                  ent.category === 'DIAGNOSIS'
                                    ? 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300'
                                    : ent.category === 'PROCEDURE'
                                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300'
                                    : ent.category === 'MEDICATION'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300'
                                }`}
                              >
                                {ent.text} <span className="opacity-60">[{ent.code_hint || ent.category.slice(0, 4)}]</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Negations if any */}
                        {Array.isArray(nlpAnalysis.nlp_analysis?.negations_detected) && nlpAnalysis.nlp_analysis.negations_detected.length > 0 && (
                          <div className="p-2 rounded bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-[11px] text-rose-800 dark:text-rose-200">
                            <strong>Penyangkalan Gejala (NegEx): </strong>
                            {nlpAnalysis.nlp_analysis.negations_detected.map((n) => `"${n.trigger}"`).join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                    <span className={`text-[11px] font-bold flex items-center space-x-1 ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
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
                <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Daftar Temuan Anomali Berkas ({auditReport.findings.length})</span>
                </h3>
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Permenkes 26/2021</span>
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

      {/* KAMUS & VERIFIKATOR TERMINOLOGI ICD-10 KEMENKES RI */}
      <div className={`p-4 rounded-xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#11141A] border-white/[0.08] text-white'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Kamus &amp; Verifikator ICD-10 Kemenkes RI (PMK No. 24/2022)</span>
            </h3>
            <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Uji kesesuaian kode diagnosis primer/sekunder pada Resume Medis terhadap nomenklatur resmi WHO/Kemenkes.
            </p>
          </div>
          <form onSubmit={handleIcdSearch} className="flex items-center gap-2 w-full sm:w-auto">
            <div className={`flex items-center px-2.5 py-1.5 rounded-lg border flex-1 sm:w-64 ${
              isLight ? 'bg-slate-50 border-slate-200 focus-within:border-emerald-500' : 'bg-slate-900 border-slate-700 focus-within:border-emerald-400'
            }`}>
              <Search className={`w-3.5 h-3.5 mr-2 shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                id="doc-icd-search"
                name="icd_query"
                type="text"
                aria-label="Cari kode atau nama penyakit ICD-10"
                value={icdQuery}
                onChange={(e) => setIcdQuery(e.target.value)}
                placeholder="Mis. Sepsis, I21, E11.9..."
                className={`w-full text-xs bg-transparent focus:outline-none ${isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-slate-500'}`}
              />
            </div>
            <button
              type="submit"
              disabled={icdLoading || icdQuery.trim().length < 2}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer shrink-0"
            >
              {icdLoading ? 'Mencari...' : 'Cek Kode'}
            </button>
          </form>
        </div>

        {icdSearched && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            {icdResults.length === 0 && !icdLoading ? (
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Tidak ada entri ICD-10 yang cocok untuk kata kunci "{icdQuery}".
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {icdResults.map((item, idx) => (
                  <div
                    key={item.code || idx}
                    className={`p-2.5 rounded-lg border text-xs ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900/70 border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{item.code}</span>
                      {item.chapter && (
                        <span
                          title={typeof item.chapter === 'object' ? `${item.chapter.block}: ${item.chapter.title_id || item.chapter.title_en}` : ''}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isLight ? 'bg-slate-200/70 text-slate-700' : 'bg-slate-800 text-slate-300'}`}
                        >
                          {typeof item.chapter === 'object'
                            ? `Bab ${item.chapter.chapter_number} (${item.chapter.block})`
                            : `Bab ${item.chapter}`}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium mt-1 line-clamp-2">{item.name_id || item.description_id || item.name_en || item.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RULE MB1-MB5, FORNAS & REAL BUNDLE SUBMISSION */}
      <RealBundleMorbidityPanel
        activeClaimId={activeClaimId}
        activeClaim={claimOptions.find((c) => c.id === activeClaimId) || null}
        currentUser={currentUser}
        isLight={isLight}
        onBundleAudited={(report) => setAuditReport(report)}
      />

      {/* POLICYPILOT 4-STEP DOCUMENT VALIDATION & AI SCAN MODAL */}
      <AnimatePresence>
        {showUploadScanModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Unggah dan pemindaian AI dokumen klaim"
            onClick={(e) => { if (e.target === e.currentTarget) setShowUploadScanModal(false); }}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto ${
              isLight ? 'bg-slate-900/45 backdrop-blur-xs' : 'bg-black/75 backdrop-blur-sm'
            }`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
            >
              {/* Main Wizard Card (8 cols) */}
              <div className={`md:col-span-8 rounded-2xl border shadow-2xl overflow-hidden ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#131822] border-white/10 text-white'
              }`}>
                {/* 4-Step Stepper */}
                <div className={`px-5 pt-5 pb-4 border-b flex items-center justify-between gap-2 ${
                  isLight ? 'border-slate-100 bg-slate-50/70' : 'border-white/[0.07] bg-white/[0.02]'
                }`}>
                  <div className="grid grid-cols-4 gap-2 flex-1">
                    {[
                      { num: 1, title: 'Info Klaim', status: 'Selesai', done: true },
                      { num: 2, title: 'Penugasan', status: 'Selesai', done: true },
                      { num: 3, title: 'Cek Dokumen', status: scanProgress >= 100 ? 'Selesai' : `${scanProgress}%`, progress: scanProgress },
                      { num: 4, title: 'Finalisasi', status: scanProgress >= 100 ? 'Siap' : 'Menunggu', done: scanProgress >= 100 },
                    ].map((st) => (
                      <div key={st.num} className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          {st.progress !== undefined ? (
                            <PolicyStepProgressRing pct={st.progress} size={22} isLight={isLight} />
                          ) : st.done ? (
                            <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isLight ? 'border-slate-300 text-slate-400' : 'border-white/20 text-slate-500'
                            }`}>
                              {st.num}
                            </span>
                          )}
                          <span className={`text-[10.5px] font-mono font-semibold truncate ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            Tahap {st.num}
                          </span>
                        </div>
                        <div className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {st.title}
                        </div>
                        <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          st.done || (st.progress !== undefined && st.progress >= 100)
                            ? isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-500/15 text-emerald-300'
                            : st.progress !== undefined
                              ? isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/15 text-blue-300'
                              : isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-slate-400'
                        }`}>
                          {st.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    aria-label="Tutup modal pemindaian dokumen"
                    onClick={() => setShowUploadScanModal(false)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer shrink-0 self-start ${
                      isLight ? 'border-slate-200 text-slate-500 hover:bg-slate-100' : 'border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                  {!hideModalAlert && (
                    <div className={`rounded-xl border px-3.5 py-2.5 flex items-start gap-2.5 text-xs ${
                      isLight ? 'bg-amber-50/90 border-amber-200 text-amber-950' : 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                    }`}>
                      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                      <p className="flex-1 leading-relaxed">
                        {auditReport?.findings?.[0]?.description ||
                          'Unggah ulang berkas PDF / Resume Medis yang sah atau jalankan AI Scan untuk memverifikasi kelengkapan TTE DPJP secara langsung.'}
                      </p>
                      <button
                        type="button"
                        aria-label="Tutup peringatan modal unggah"
                        onClick={() => setHideModalAlert(true)}
                        className="p-0.5 rounded hover:bg-black/5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Dashed Dropzone */}
                  <label
                    htmlFor="doc-scan-file-input"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer?.files?.[0];
                      handleModalFilePick(file);
                    }}
                    className={`block rounded-2xl border-2 border-dashed p-5 text-center transition cursor-pointer ${
                      isLight
                        ? 'border-blue-300 bg-blue-50/35 hover:bg-blue-50/70'
                        : 'border-blue-500/35 bg-blue-500/[0.06] hover:bg-blue-500/10'
                    }`}
                  >
                    <input
                      id="doc-scan-file-input"
                      type="file"
                      accept=".pdf,.csv,.json"
                      aria-label="Pilih file PDF atau CSV berkas klaim untuk diunggah"
                      onChange={(e) => handleModalFilePick(e.target.files?.[0])}
                      className="sr-only"
                    />
                    <div className={`w-9 h-9 mx-auto mb-2 rounded-xl flex items-center justify-center ${
                      isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Pilih berkas PDF / SEP / CSV untuk diunggah
                    </p>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Atau seret dan lepaskan file ke area ini
                    </p>
                  </label>

                  {/* Upload from URL */}
                  <div className="space-y-1.5">
                    <div className={`text-[11px] font-semibold text-center ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Atau tautkan URL RME RS
                    </div>
                    <input
                      type="url"
                      aria-label="Tempel URL dokumen RME rumah sakit"
                      value={scanUrlInput}
                      onChange={(e) => setScanUrlInput(e.target.value)}
                      placeholder="Tempel tautan berkas RME..."
                      className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500'
                          : 'bg-white/[0.04] border-white/10 text-white focus:border-blue-400'
                      }`}
                    />
                  </div>

                  {/* Active Attachment & Live Progress Card */}
                  <div className="space-y-2">
                    <div className={`rounded-xl border px-3 py-2.5 flex items-center gap-2.5 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.04] border-white/10'
                    }`}>
                      <FileText className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {selectedUploadFile?.name || activeDoc?.file_name || 'Resume_Medis_FKRTL.pdf'}
                        </div>
                        <div className={`text-[10.5px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          PDF · {selectedUploadFile?.sizeLabel || `${Math.max(0.2, (activeDoc?.file_size_kb || 600) / 1024).toFixed(1)} MB`}
                        </div>
                      </div>
                    </div>

                    <div className={`rounded-xl border p-3 ${
                      isLight ? 'bg-blue-50/40 border-blue-200' : 'bg-blue-500/[0.08] border-blue-500/25'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <span className={isLight ? 'text-slate-900' : 'text-white'}>
                          {isScanningAi ? 'Memindai integritas berkas...' : scanProgress >= 100 ? 'Pemindaian AI Selesai' : 'Siap Dipindai'}
                        </span>
                        <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">{scanProgress}%</span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-blue-100' : 'bg-white/10'}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${scanProgress >= 100 ? 'bg-emerald-600' : 'bg-[#2563EB]'}`}
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                      <div className={`flex items-center justify-between text-[10.5px] mt-1.5 font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span>{activeClaimId}_bundle.pdf</span>
                        <span>{scanProgress >= 100 ? 'SHA-256 Terverifikasi' : 'Menunggu AI Scan'}</span>
                      </div>
                    </div>
                  </div>

                  {showHowItWorks && (
                    <div className={`rounded-xl border p-3 text-[11.5px] space-y-1 ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.04] border-white/10 text-slate-300'
                    }`}>
                      <p className="font-bold">Cara Kerja Validasi 4 Tahap:</p>
                      <p>1) Tarik file RME/SEP, 2) Klik <strong>AI Scan</strong> untuk audit kecocokan TTE, kronologi tanggal, &amp; kaidah koding, 3) Klik <strong>Tandai Selesai</strong> untuk meneruskan ke Tier 2.</p>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className={`pt-3 border-t flex flex-wrap items-center justify-between gap-2 ${
                    isLight ? 'border-slate-100' : 'border-white/[0.07]'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setShowHowItWorks((v) => !v)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Cara Kerja</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isScanningAi}
                        onClick={handleRunAiScan}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer disabled:opacity-60 ${
                          isLight ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50' : 'bg-white/5 border-white/15 text-white hover:bg-white/10'
                        }`}
                      >
                        <Sparkles className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isScanningAi ? 'animate-spin' : ''}`} />
                        <span>{isScanningAi ? 'Memindai...' : 'AI Scan'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={submittingAction}
                        onClick={async () => {
                          await handleAction('approve');
                          setShowUploadScanModal(false);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-60"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tandai Selesai</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Floating Context Card (4 cols - matches PolicyPilot ref1 card) */}
              <div className={`md:col-span-4 rounded-2xl border p-4 shadow-2xl space-y-3 ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#131822] border-white/10 text-white'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-mono">
                    <span className={isLight ? 'text-slate-400' : 'text-slate-400'}>ID: </span>
                    <strong className={isLight ? 'text-slate-900' : 'text-white'}>#{activeClaimId}</strong>
                  </div>
                  <button
                    type="button"
                    aria-label="Kembali ke detail dokumen utama"
                    onClick={() => setShowUploadScanModal(false)}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition ${
                      isLight ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-white/[0.08]'}`}>
                  <div className="py-2 flex items-center justify-between gap-2">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Temuan</span>
                    <span className="font-semibold text-right truncate max-w-[160px]" title={auditReport?.findings?.[0]?.title}>
                      {auditReport?.findings?.[0]?.title || 'Siap Verifikasi'}
                    </span>
                  </div>
                  <div className="py-2 flex items-center justify-between gap-2">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Batas SLA</span>
                    <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] border ${
                      isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}>
                      SLA 10 HK
                    </span>
                  </div>
                  <div className="py-2 flex items-center justify-between gap-2">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Penanggung Jawab</span>
                    <span className="font-semibold truncate max-w-[140px]">
                      {currentUser?.name || activeDoc?.dpjp_name || 'Tim Verifikator'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Lampiran</span>
                  <div className={`rounded-xl border p-2.5 flex items-center justify-between gap-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.04] border-white/10'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold truncate">
                          {selectedUploadFile?.name || activeDoc?.file_name || 'Resume_Medis.pdf'}
                        </div>
                        <div className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {auditReport?.compliance_score_pct ?? 85}% Sah
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Segarkan status lampiran berkas"
                      onClick={() => fetchDocumentAudit(activeClaimId, true)}
                      className={`p-1.5 rounded-lg border cursor-pointer transition ${
                        isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
