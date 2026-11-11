import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, authFetch } from '../../services/apiConfig';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { 
  AlertOctagon, CheckCircle2, AlertTriangle, FileText, 
  Download, Printer, Shield, Lock, ArrowLeft, RefreshCw, 
  Send, UserCheck, Stethoscope, ChevronRight, Check, X,
  FileCheck, ShieldAlert, Gavel, Ban, Sparkles
} from 'lucide-react';
import { callClaimTraceGenerateContent } from '../../services/claimtraceOrchestratorService';

gsap.registerPlugin(useGSAP);

export default function DecisionConsole({
  caseData,
  totalScore = 87.0,
  s1 = 85,
  s2 = 95,
  s3 = 80,
  patientResponse = null,
  verificatorAction,
  onSetVerificatorAction,
  onBackToInvestigation,
  onBackToQueue,
  onOpenExpansionSuite,
  currentUser,
  isLight: propIsLight
}) {
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

  const defaultCase = {
    id: typeof caseData === 'string' ? caseData : 'CLM-2026-8801',
    hospital: 'RS Khusus Mitra Husada',
    sep: '0132R0011026V000085',
    tariff: 'Rp 15.300.000',
    claimCount: 85,
    code: 'Z-3-12-0',
    dpjp: 'dr. Hendra, Sp.KFR'
  };

  const currentCase = (typeof caseData === 'object' && caseData !== null) ? caseData : defaultCase;
  const rawClaim = currentCase.rawClaim || null;
  const rawTriage = currentCase.rawTriage || null;

  const effS1 = Math.round(rawClaim?.s1_score ?? rawTriage?.score_breakdown?.s1_value ?? s1);
  const effS2 = Math.round(rawClaim?.s2_score ?? rawTriage?.score_breakdown?.s2_value ?? s2);
  const effS3 = patientResponse !== null
    ? Math.round(s3)
    : Math.round(rawClaim?.s3_score ?? rawTriage?.score_breakdown?.s3_value ?? s3);
  const sipStatus = rawClaim?.dpjp_meta?.sip_status || 'ACTIVE';
  const hardTrigger = Boolean(rawTriage?.hard_trigger_activated || sipStatus === 'EXPIRED');
  const rawFusionScore = Math.round((0.5 * effS1 + 0.3 * effS2 + 0.2 * effS3) * 10) / 10;
  const effScore = patientResponse !== null
    ? (hardTrigger ? Math.max(rawFusionScore, 75) : rawFusionScore)
    : Number(rawTriage?.final_priority_score ?? totalScore);
  const effLane = (effScore >= 75 || hardTrigger)
    ? 'MERAH'
    : (effScore >= 50 || sipStatus === 'UNSYNCED')
    ? 'KUNING'
    : 'HIJAU';

  const spikeRatio = Number(rawClaim?.episode_meta?.rasio_lonjakan_baseline ?? (effLane === 'HIJAU' ? 1.1 : effLane === 'KUNING' ? 2.4 : 8.5));
  const clusterVolume = Number(rawClaim?.episode_meta?.jumlah_klaim_klaster ?? currentCase.claimCount ?? 1);
  const sampleCount = Math.max(1, Number(rawClaim?.mobile_meta?.sampel_terkirim ?? currentCase.sampleCount ?? 10));
  const deniedCount = Number(rawClaim?.mobile_meta?.respon_tidak_hadir ?? currentCase.deniedCount ?? (effLane === 'HIJAU' ? 0 : 8));
  const userRoles = Array.isArray(currentUser?.allowedRoles) ? currentUser.allowedRoles : [];
  const activeUserCanAdjudicate = !(
    currentUser?.role === 'AUDITOR_VIEWER' ||
    String(currentUser?.role || '').toLowerCase().includes('read-only') ||
    (userRoles.includes('AUDITOR_VIEWER') && !userRoles.includes('VERIFICATOR_MEDIS') && !userRoles.includes('ADMIN'))
  );

  const VEDIKA_REASON_OPTIONS = [
    'Resume medis belum dilengkapi tanda tangan DPJP',
    'Lampiran bukti lab / radiologi / laporan tindakan kurang memadai',
    'Verifikasi log biometrik FRISTA & kehadiran Mobile JKN',
    'Sinkronisasi status SIP/STR SATUSEHAT SDMK perlu konfirmasi',
    'Kesesuaian koding INA-CBG / indikasi unbundling & upcoding',
    'Eskalasi telaah klinis Tim Kendali Mutu dan Kendali Biaya (TKMKB)',
  ];

  const defaultNotesForCase = () => {
    if (rawTriage?.ringkasan_bukti_audit) {
      return `${rawTriage.ringkasan_bukti_audit} Disposisi verifikasi mengacu pada Perpres No. 82/2018 Pasal 74-76 dan Permenkes No. 16/2019.`;
    }
    if (effLane === 'HIJAU') {
      return `Klaim ${currentCase.id} (${currentCase.hospital}) lolos penyaringan Tri-Layer dengan skor ${effScore.toFixed(1)}/100. Dokumen klinis, keabsahan SDMK (${sipStatus}), dan konfirmasi kehadiran peserta tercatat konsisten sehingga layak diproses Fast-Track sesuai regulasi BPJS Kesehatan.`;
    }
    if (effLane === 'KUNING') {
      return `Klaim ${currentCase.id} (${currentCase.hospital}) berada pada Jalur Kuning (Skor ${effScore.toFixed(1)}/100). Diperlukan permintaan klarifikasi berkas penunjang dan sinkronisasi data kepada faskes dalam batas waktu maksimal 10 hari kerja sesuai Perpres 82/2018.`;
    }
    return `Terdeteksi indikasi anomali tinggi pada klaim ${currentCase.id} (${currentCase.hospital}) dengan Skor Fusi ${effScore.toFixed(1)}/100 (lonjakan ${spikeRatio.toFixed(1)}x baseline, SIP ${sipStatus}, ${deniedCount}/${sampleCount} sampel peserta menyangkal). Direkomendasikan penahanan pra-bayar / audit faktual sesuai Perpres 82/2018 Pasal 76.`;
  };

  const [activeSubTab, setActiveSubTab] = useState('disposisi');
  const [notes, setNotes] = useState(defaultNotesForCase);
  const [pendingReasons, setPendingReasons] = useState(() => (
    Array.isArray(currentCase.pendingReasons) && currentCase.pendingReasons.length > 0
      ? currentCase.pendingReasons
      : []
  ));
  const [bahvRecap, setBahvRecap] = useState(null);
  const [loadingRecap, setLoadingRecap] = useState(false);

  const [auditSealHash, setAuditSealHash] = useState('');
  const [sealTimestamp, setSealTimestamp] = useState('');
  const [officialBakbHtml, setOfficialBakbHtml] = useState('');
  const [officialBakbDossier, setOfficialBakbDossier] = useState(null);
  const [decisionError, setDecisionError] = useState(null);
  const [verifierInfo, setVerifierInfo] = useState({
    name: currentUser?.name || 'dr. Siti Rahma, Sp.PK',
    nip: currentUser?.nip || '198704202011012001',
  });

  const resolvedApiClaimId = (!currentCase?.id || currentCase.id === 'CLM-2026-10-085')
    ? 'CLM-2026-8801'
    : currentCase.id;

  useEffect(() => {
    setNotes(defaultNotesForCase());
    setPendingReasons(
      Array.isArray(currentCase.pendingReasons) && currentCase.pendingReasons.length > 0
        ? currentCase.pendingReasons
        : []
    );
    setDecisionError(null);
    setSuccessToast(false);
  }, [currentCase?.id]);

  useEffect(() => {
    if (currentUser?.name || currentUser?.nip) {
      setVerifierInfo({
        name: currentUser.name || 'dr. Siti Rahma, Sp.PK',
        nip: currentUser.nip || '198704202011012001',
      });
    }
  }, [currentUser?.name, currentUser?.nip]);

  const loadBahvRecap = async () => {
    setLoadingRecap(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/screening/bahv-recap`);
      if (res.ok) {
        const data = await res.json();
        setBahvRecap(data);
      }
    } catch (err) {
      console.warn('Gagal memuat rekapitulasi BAHV FPK:', err);
    } finally {
      setLoadingRecap(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'bahv_recap') {
      loadBahvRecap();
    }
  }, [activeSubTab]);

  useEffect(() => {
    let active = true;
    const loadSeal = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/v1/claims/${resolvedApiClaimId}/official-bakb`);
        if (res.ok && active) {
          const data = await res.json();
          const seal = data?.dossier?.cryptographic_seal;
          const ver = data?.dossier?.verifier;
          if (data?.html_printable) setOfficialBakbHtml(data.html_printable);
          if (data?.dossier) setOfficialBakbDossier(data.dossier);
          if (seal?.document_hash) setAuditSealHash(seal.document_hash);
          if (data?.dossier?.issued_at) setSealTimestamp(data.dossier.issued_at);
          if (!currentUser?.name && (ver?.name || ver?.nip)) {
            setVerifierInfo({
              name: ver.name || 'dr. Siti Rahma, Sp.PK',
              nip: ver.nip || '198704202011012001',
            });
          }
        }
      } catch (err) {
        console.warn('Gagal memuat segel kriptografis BAKB:', err);
      }
    };
    loadSeal();
    return () => { active = false; };
  }, [resolvedApiClaimId]);

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [isDraftingAiNotes, setIsDraftingAiNotes] = useState(false);

  const consoleRef = useRef(null);
  const modalRef = useRef(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showPdfModal) {
        setShowPdfModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPdfModal]);

  const handlePrintDossier = () => {
    if (officialBakbHtml && typeof window !== 'undefined') {
      const win = window.open('', '_blank', 'width=960,height=780');
      if (win) {
        win.document.open();
        win.document.write(officialBakbHtml);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 250);
        return;
      }
    }
    window.print();
  };

  // GSAP 60fps animation on action change
  useGSAP(() => {
    if (!consoleRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.fromTo(
      '.verdict-status-badge',
      { scale: 0.92, autoAlpha: 0.5 },
      { scale: 1, autoAlpha: 1, duration: 0.3 }
    )
    .fromTo(
      '.verdict-crypto-seal',
      { x: -6, autoAlpha: 0.6 },
      { x: 0, autoAlpha: 1, duration: 0.25 },
      '-=0.15'
    )
    .fromTo(
      '.action-active-indicator',
      { scale: 0.8, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.25, ease: 'back.out(2)' },
      '-=0.2'
    );
  }, { scope: consoleRef, dependencies: [verificatorAction] });

  // Animate inner verdict badge slightly without fighting Motion modal entrance
  useGSAP(() => {
    if (!showPdfModal || !modalRef.current) return;
    gsap.fromTo(
      '.verdict-stamp-print',
      { scale: 1.25, rotate: -10, autoAlpha: 0 },
      { scale: 1, rotate: -4, autoAlpha: 1, duration: 0.35, ease: 'back.out(1.8)' }
    );
  }, { scope: modalRef, dependencies: [showPdfModal] });

  const toggleReason = (reasonText) => {
    setPendingReasons((prev) =>
      prev.includes(reasonText) ? prev.filter((r) => r !== reasonText) : [...prev, reasonText]
    );
  };

  const handleDraftNotesWithAi = async () => {
    setIsDraftingAiNotes(true);
    try {
      const actionMap = {
        LAYAK_BAYAR: 'Layak Bayar (Setujui FPK Pra-Bayar)',
        PENDING_KLARIFIKASI: 'Pending Klarifikasi Faskes (Maksimal 10 Hari Kerja)',
        DISPUTE_TKMKB: 'Dispute Klinis & Eskalasi TKMKB',
        TIDAK_LAYAK_FRAUD: 'Tidak Layak Bayar (Penolakan Pra-Bayar / Audit Faktual VPK)',
        clarification: 'Tunda Berita Acara & Minta Klarifikasi Faskes (SOP 10 Hari)',
        audit: 'Jadwalkan Audit Faktual Lapangan',
        override: 'Layak Bayar (Override dengan Catatan Verifikator)',
      };
      const actionLabel = actionMap[verificatorAction] || actionMap.PENDING_KLARIFIKASI;
      const res = await callClaimTraceGenerateContent({
        prompt: `Susun 1 paragraf formal 'Catatan Resmi Verifikator' (maksimal 95 kata) untuk Berita Acara Kelengkapan Berkas (BAKB) BPJS Kesehatan atas klaim ${currentCase.id} (${currentCase.hospital}, SEP: ${currentCase.sep}, Kode: ${currentCase.code}, Tagihan: ${currentCase.tariff}, DPJP: ${currentCase.dpjp}, SIP: ${sipStatus}). Skor risiko: ${effScore}/100 (S1=${effS1}, S2=${effS2}, S3=${effS3}). Keputusan: ${actionLabel}. Cantumkan dasar hukum Perpres No. 82/2018 Pasal 74-76 dan Permenkes No. 16/2019. Jangan gunakan emoji.`,
        systemInstruction: 'Anda adalah Pejabat Verifikator Senior BPJS Kesehatan. Tulis paragraf hukum resmi tanpa emoji.'
      });
      if (res?.text) {
        setNotes(res.text.trim());
      }
    } finally {
      setIsDraftingAiNotes(false);
    }
  };

  const handleDownloadDossierPdf = () => {
    const htmlContent = officialBakbHtml || `<!doctype html>
<html lang="id"><head><meta charset="utf-8" /><title>BAKB Resmi BPJS Kesehatan - ${currentCase.id}</title></head>
<body style="font-family:Arial,sans-serif;max-width:860px;margin:24px auto;line-height:1.5;color:#111827">
<h2>BPJS KESEHATAN - BERITA ACARA HASIL UJI KELENGKAPAN BERKAS (BAKB / BAHV)</h2>
<p><strong>No. Klaim:</strong> ${currentCase.id} | <strong>Faskes:</strong> ${currentCase.hospital} | <strong>SEP:</strong> ${currentCase.sep}</p>
<p><strong>Kode INA-CBG:</strong> ${currentCase.code} | <strong>Tagihan:</strong> ${currentCase.tariff} (${clusterVolume} Berkas) | <strong>DPJP:</strong> ${currentCase.dpjp} (SIP ${sipStatus})</p>
<p><strong>Skor Fusi:</strong> ${effScore.toFixed(1)}/100 (S1=${effS1}, S2=${effS2}, S3=${effS3}) · <strong>Jalur ${effLane}</strong></p>
<p><strong>Catatan Verifikator:</strong> ${notes}</p>
<p><strong>Digital Seal SHA-256:</strong> ${auditSealHash || 'MENUNGGU-DISPOSISI-SHA256'}</p>
<p><strong>Verifikator:</strong> ${verifierInfo.name} (NIP ${verifierInfo.nip})</p>
</body></html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BAKB_Resmi_BPJS_${currentCase.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setShowPdfModal(false);
    setSuccessToast(true);
  };

  const handleActionClick = async (actionType) => {
    if (!activeUserCanAdjudicate) {
      setDecisionError('Akses dibatasi (Read-Only): Hanya Verifikator Medis atau Admin Cabang yang berwenang menetapkan putusan.');
      return;
    }
    setIsSubmitting(true);
    setDecisionError(null);
    const decisionMap = {
      LAYAK_BAYAR: 'LAYAK_BAYAR',
      PENDING_KLARIFIKASI: 'PENDING_KLARIFIKASI',
      DISPUTE_TKMKB: 'DISPUTE_TKMKB',
      TIDAK_LAYAK_FRAUD: 'TIDAK_LAYAK_FRAUD',
      clarification: 'PENDING_KLARIFIKASI',
      audit: 'TIDAK_LAYAK_FRAUD',
      override: 'LAYAK_BAYAR',
    };
    const backendDecision = decisionMap[actionType] || 'PENDING_KLARIFIKASI';
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/claims/${resolvedApiClaimId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifier_id: verifierInfo.nip || '198704202011012001',
          decision: backendDecision,
          catatan_verifikator: notes || 'Disposisi verifikator direkam melalui Konsol Keputusan Pra-Bayar.',
          pending_reasons: (backendDecision === 'PENDING_KLARIFIKASI' || backendDecision === 'DISPUTE_TKMKB' || backendDecision === 'TIDAK_LAYAK_FRAUD')
            ? pendingReasons
            : [],
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data?.audit_entry?.current_hash) {
        setAuditSealHash(data.audit_entry.current_hash);
      }
      if (data?.audit_entry?.timestamp) {
        setSealTimestamp(data.audit_entry.timestamp);
      }
      onSetVerificatorAction(backendDecision);
      setSuccessToast(true);
      if (bahvRecap) {
        loadBahvRecap();
      }
      // Refresh BAKB preview HTML to reflect new decision status immediately
      authFetch(`${API_BASE_URL}/api/v1/claims/${resolvedApiClaimId}/official-bakb`)
        .then((r) => (r.ok ? r.json() : null))
        .then((bakbData) => {
          if (bakbData?.html_printable) setOfficialBakbHtml(bakbData.html_printable);
          if (bakbData?.dossier) setOfficialBakbDossier(bakbData.dossier);
        })
        .catch(() => {});
    } catch (err) {
      setDecisionError(err.message || 'Gagal mencatat keputusan ke server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={consoleRef} className={`space-y-4 font-inter ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* HEADER BANNER */}
      <div className={`w-full px-4 py-3.5 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#00153A]/85 backdrop-blur-xl border-white/10 text-white shadow-2xl shadow-[#00081c]/50'
      }`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Konsol Keputusan VEDIKA &amp; Rekapitulasi BAHV FPK
            </h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
              effLane === 'MERAH'
                ? (isLight ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30')
                : effLane === 'KUNING'
                ? (isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                : (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
            }`}>
              JALUR {effLane} · {effLane === 'MERAH' ? 'AUDIT FREEZE' : effLane === 'KUNING' ? 'KLARIFIKASI FPK' : 'FAST-TRACK H+1'}
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              isLight
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white/5 text-[#FFCA40] border-white/10'
            }`}>
              VEDIKA 4-Status · Perpres 82/2018
            </span>
          </div>
          <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600 font-medium' : 'text-white/60'}`}>
            Penetapan putusan resmi verifikator (Layak, Pending, Dispute TKMKB, Tidak Layak Fraud) beserta BAHV / BAKB SHA-256.
          </p>
        </div>

        {/* SUB-TAB SWITCHER & STATUS TOAST */}
        <div className="flex flex-wrap items-center gap-2">
          <div className={`inline-flex p-1 rounded-xl border text-xs font-bold ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <button
              type="button"
              onClick={() => setActiveSubTab('disposisi')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeSubTab === 'disposisi'
                  ? (isLight ? 'bg-emerald-700 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-xs')
                  : (isLight ? 'text-slate-700 hover:bg-slate-200/70' : 'text-white/70 hover:text-white')
              }`}
            >
              Putusan Kasus &amp; BAKB
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('bahv_recap')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeSubTab === 'bahv_recap'
                  ? (isLight ? 'bg-emerald-700 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-xs')
                  : (isLight ? 'text-slate-700 hover:bg-slate-200/70' : 'text-white/70 hover:text-white')
              }`}
            >
              Rekapitulasi BAHV FPK (4 Status)
            </button>
          </div>
        </div>
      </div>

      {decisionError && (
        <div className={`px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 border ${
          isLight
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
        }`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{decisionError}</span>
        </div>
      )}
      {successToast && (
        <div className={`px-4 py-2.5 rounded-xl text-xs flex items-center justify-between space-x-2 shadow-md border ${
          isLight
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
        }`}>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
            <span>
              Keputusan verifikator berhasil dieksekusi dan dicatat ke dalam <strong className={isLight ? 'text-emerald-950 font-bold' : 'text-white'}>Audit Trail Kriptografis (SHA-256)</strong>.
            </span>
          </div>
          <button type="button" onClick={() => setSuccessToast(false)} className={`cursor-pointer ml-1 ${isLight ? 'text-emerald-700 hover:text-emerald-900' : 'text-emerald-400 hover:text-white'}`}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {!activeUserCanAdjudicate && activeSubTab === 'disposisi' && (
        <div className={`px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 border ${
          isLight ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-amber-500/15 border-amber-500/35 text-amber-200'
        }`}>
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            Mode Pengamat Aktif (<strong>{currentUser?.name}</strong> · Role <code>{currentUser?.role}</code>): Tombol eksekusi putusan VEDIKA dinonaktifkan untuk akun Read-Only Audit.
          </span>
        </div>
      )}

      {activeSubTab === 'bahv_recap' ? (
        <div className="space-y-4">
          <div className={`rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#00153A]/85 border-white/10'
          }`}>
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Berita Acara Hasil Verifikasi (BAHV) FPK Pra-Bayar — 4 Status VEDIKA
              </h3>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Periode: {bahvRecap?.period_label || 'FPK Berjalan Okt/Nov 2026'} · Total {bahvRecap?.total_claims_in_queue ?? 0} berkas antrean pra-bayar.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadBahvRecap}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer inline-flex items-center gap-1.5 ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingRecap ? 'animate-spin' : ''}`} />
                <span>Segarkan BAHV Live</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Rekap BAHV FPK</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { key: 'LAYAK', title: '1. Layak Bayar', desc: 'Lolos verifikasi & siap bayar H+1', tone: 'emerald' },
              { key: 'PENDING', title: '2. Pending Klarifikasi', desc: 'Menunggu kelengkapan Faskes (<= 10 HK)', tone: 'amber' },
              { key: 'DISPUTE', title: '3. Sengketa / Dispute TKMKB', desc: 'Eskalasi koding / klinis TKMKB', tone: 'purple' },
              { key: 'TIDAK_LAYAK', title: '4. Tidak Layak (Fraud)', desc: 'Ditolak / Tahan Bayar & Audit VPK', tone: 'rose' },
            ].map((card) => {
              const bucket = bahvRecap?.buckets?.[card.key] || { count: 0, claimed_rp: 0, items: [] };
              const bucketItems = Array.isArray(bucket.items) ? bucket.items : (Array.isArray(bucket.claims) ? bucket.claims : []);
              const bucketRp = Number(bucket.claimed_rp ?? bucket.total_tariff_rp ?? 0);
              return (
                <div key={card.key} className={`rounded-2xl p-4 border space-y-2 ${
                  isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#00153A]/80 border-white/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{card.title}</span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      card.tone === 'emerald'
                        ? (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                        : card.tone === 'amber'
                        ? (isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                        : card.tone === 'purple'
                        ? (isLight ? 'bg-purple-50 text-purple-800 border-purple-300' : 'bg-purple-500/20 text-purple-300 border-purple-500/30')
                        : (isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30')
                    }`}>
                      {bucket.count} Klaim
                    </span>
                  </div>
                  <div className={`text-lg font-extrabold font-mono tabular-nums ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    Rp {bucketRp.toLocaleString('id-ID')}
                  </div>
                  <p className={`text-[10.5px] ${isLight ? 'text-slate-500' : 'text-white/55'}`}>{card.desc}</p>
                  {bucketItems.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1 max-h-40 overflow-y-auto">
                      {bucketItems.map((bc) => (
                        <div key={bc.claim_id} className="text-[10.5px] flex items-center justify-between gap-2 font-mono">
                          <span className="truncate font-bold">{bc.claim_id} · {bc.hospital || bc.nama_faskes}</span>
                          <span className="shrink-0">Rp {Number(bc.claimed_rp || 0).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
      /* SCROLLABLE MAIN DECISION WORKSPACE */
      <div className="min-h-[460px] space-y-4 pb-2">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: ACTION CONSOLE (7 COLS) */}
        <div className="xl:col-span-7 space-y-4">
          
          {/* VERIFICATOR AUTHORITY BADGE */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
              : 'bg-[#00153A]/80 backdrop-blur-md border-white/10 text-white shadow-xl shadow-[#00081c]/40'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm font-mono shadow-md border ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border-cyan-400/40 text-cyan-300'
                }`}>
                  SR
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                  <Check className="w-2.5 h-2.5 font-bold" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{verifierInfo.name}</span>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-cyan-400'}`} />
                </div>
                <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                  Verifikator Medis Utama (Wasrik) • NIP: <span className={`font-mono font-bold ${isLight ? 'text-slate-800' : 'text-cyan-300'}`}>{verifierInfo.nip}</span>
                </span>
                <div className="flex items-center space-x-1.5 mt-1 font-mono text-[9.5px]">
                  <span className={`px-2 py-0.5 rounded uppercase border font-medium ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/5 text-white/70 border-white/10'
                  }`}>DIREKTORAT JAMPELKES PUSAT</span>
                  <span className={`px-2 py-0.5 rounded uppercase border font-medium ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/5 text-white/70 border-white/10'
                  }`}>SK DIREKSI NO. 0418/2024</span>
                </div>
              </div>
            </div>

            <div className="text-right sm:self-center font-mono">
              <span className={`text-[9.5px] font-bold block uppercase tracking-wider ${
                effLane === 'MERAH'
                  ? (isLight ? 'text-rose-700' : 'text-rose-300')
                  : effLane === 'KUNING'
                  ? (isLight ? 'text-amber-700' : 'text-amber-300')
                  : (isLight ? 'text-emerald-700' : 'text-emerald-300')
              }`}>SKOR FUSI KASUS</span>
              <span className={`text-2xl font-bold leading-none ${
                effLane === 'MERAH'
                  ? (isLight ? 'text-rose-600' : 'text-rose-400')
                  : effLane === 'KUNING'
                  ? (isLight ? 'text-amber-700' : 'text-amber-300')
                  : (isLight ? 'text-emerald-700' : 'text-emerald-400')
              }`}>{effScore.toFixed(1)}</span>
              <span className={`text-[9.5px] block mt-0.5 font-bold ${
                effLane === 'MERAH'
                  ? (isLight ? 'text-rose-700' : 'text-rose-300/80')
                  : effLane === 'KUNING'
                  ? (isLight ? 'text-amber-700' : 'text-amber-300/80')
                  : (isLight ? 'text-emerald-700' : 'text-emerald-300/80')
              }`}>Jalur {effLane}</span>
            </div>
          </div>

          {/* DECISION ACTION CARD */}
          <div className={`rounded-2xl p-4 space-y-3 border ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
              : 'bg-[#00153A]/80 backdrop-blur-md border-white/10 text-white shadow-xl shadow-[#00081c]/40'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`text-xs font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <ShieldAlert className={`w-4 h-4 ${
                  effLane === 'MERAH' ? 'text-rose-500' : effLane === 'KUNING' ? 'text-amber-500' : 'text-emerald-600'
                }`} />
                <span>Disposisi VEDIKA Pra-Bayar ({currentCase.id})</span>
              </span>
              <span className={`text-[11px] px-2.5 py-1 rounded-md font-semibold border font-mono ${
                effLane === 'MERAH'
                  ? (isLight ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30')
                  : effLane === 'KUNING'
                  ? (isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                  : (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
              }`}>
                REKOMENDASI: {effLane === 'MERAH' ? 'TIDAK LAYAK / AUDIT VPK' : effLane === 'KUNING' ? 'PENDING KLARIFIKASI' : 'LAYAK BAYAR'}
              </span>
            </div>

            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
              {effLane === 'HIJAU'
                ? `Sintesis 4 lapis pada ${currentCase.id} (${currentCase.hospital}) menunjukkan lonjakan wajar (${spikeRatio.toFixed(1)}x baseline), status SDMK ${sipStatus}, serta ${sampleCount - deniedCount}/${sampleCount} peserta mengonfirmasi kehadiran. Direkomendasikan status Layak Bayar.`
                : effLane === 'KUNING'
                ? `Terdeteksi indikasi ketidaklengkapan/sinkronisasi pada ${currentCase.id} (SIP ${sipStatus}, rasio ${spikeRatio.toFixed(1)}x baseline). Direkomendasikan status Pending Klarifikasi Faskes dalam koridor SLA maksimal 10 hari kerja.`
                : `Terdeteksi anomali kritikal pada ${currentCase.id} (${clusterVolume} berkas · ${spikeRatio.toFixed(1)}x baseline, SIP ${sipStatus}, serta ${deniedCount}/${sampleCount} sampel peserta menyangkal layanan). Sistem merekomendasikan penahanan pra-bayar / audit VPK:`}
            </p>

            {/* 4 OFFICIAL VEDIKA ACTION BUTTONS */}
            <div className="space-y-2 pt-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider block font-mono ${
                isLight ? 'text-slate-600' : 'text-white/50'
              }`}>
                Pilih Putusan Resmi Verifikator VEDIKA (4 Status):
              </span>

              {/* 1. LAYAK BAYAR */}
              <button type="button"
                disabled={isSubmitting || !activeUserCanAdjudicate}
                onClick={() => handleActionClick('LAYAK_BAYAR')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer disabled:opacity-55 ${
                  verificatorAction === 'LAYAK_BAYAR' || verificatorAction === 'override'
                    ? (isLight
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500 text-emerald-950 shadow-md'
                        : 'bg-emerald-500/20 border-emerald-500/60 ring-2 ring-emerald-500/40 text-white shadow-lg shadow-emerald-950/40')
                    : (isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90')
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className={`text-xs font-bold ${
                      verificatorAction === 'LAYAK_BAYAR' || verificatorAction === 'override'
                        ? (isLight ? 'text-emerald-900' : 'text-emerald-300')
                        : (isLight ? 'text-slate-900' : 'text-white')
                    }`}>
                      1. Layak Bayar (Setujui FPK &amp; Proses Pencairan Pra-Bayar)
                    </span>
                    {(verificatorAction === 'LAYAK_BAYAR' || verificatorAction === 'override') && (
                      <span className="action-active-indicator text-[9.5px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    Seluruh 6 kaidah administrasi &amp; klinis terpenuhi. Klaim disahkan masuk rekapitulasi BAHV Layak Bayar ({currentCase.tariff}).
                  </p>
                </div>
              </button>

              {/* 2. PENDING KLARIFIKASI */}
              <button type="button"
                disabled={isSubmitting || !activeUserCanAdjudicate}
                onClick={() => handleActionClick('PENDING_KLARIFIKASI')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer disabled:opacity-55 ${
                  verificatorAction === 'PENDING_KLARIFIKASI' || verificatorAction === 'clarification'
                    ? (isLight
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 text-amber-950 shadow-md'
                        : 'bg-amber-500/20 border-amber-500/60 ring-2 ring-amber-500/40 text-white shadow-lg shadow-amber-950/40')
                    : (isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90')
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className={`text-xs font-bold ${
                      verificatorAction === 'PENDING_KLARIFIKASI' || verificatorAction === 'clarification'
                        ? (isLight ? 'text-amber-900' : 'text-amber-300')
                        : (isLight ? 'text-slate-900' : 'text-white')
                    }`}>
                      2. Pending / Dikembalikan (Klarifikasi Faskes Maks 10 HK)
                    </span>
                    {(verificatorAction === 'PENDING_KLARIFIKASI' || verificatorAction === 'clarification') && (
                      <span className="action-active-indicator text-[9.5px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    Menahan pembayaran sementara untuk perbaikan kelengkapan resume medis, SIP SATUSEHAT, atau bukti penunjang sesuai Perpres 82/2018 Pasal 76.
                  </p>
                </div>
              </button>

              {/* 3. DISPUTE TKMKB */}
              <button type="button"
                disabled={isSubmitting || !activeUserCanAdjudicate}
                onClick={() => handleActionClick('DISPUTE_TKMKB')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer disabled:opacity-55 ${
                  verificatorAction === 'DISPUTE_TKMKB'
                    ? (isLight
                        ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-400 text-purple-950 shadow-md'
                        : 'bg-purple-500/20 border-purple-500/60 ring-2 ring-purple-500/40 text-white shadow-lg')
                    : (isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90')
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Gavel className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className={`text-xs font-bold ${
                      verificatorAction === 'DISPUTE_TKMKB'
                        ? (isLight ? 'text-purple-900' : 'text-purple-300')
                        : (isLight ? 'text-slate-900' : 'text-white')
                    }`}>
                      3. Sengketa / Dispute Klinis (Eskalasi TKMKB &amp; BA Sengketa)
                    </span>
                    {verificatorAction === 'DISPUTE_TKMKB' && (
                      <span className="action-active-indicator text-[9.5px] bg-purple-700 text-white px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    Ketidaksepakatan kaidah koding INA-CBG, severity level, atau urgensi medik antara Verifikator &amp; RS guna sidang mediasi TKMKB.
                  </p>
                </div>
              </button>

              {/* 4. TIDAK LAYAK FRAUD */}
              <button type="button"
                disabled={isSubmitting || !activeUserCanAdjudicate}
                onClick={() => handleActionClick('TIDAK_LAYAK_FRAUD')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer disabled:opacity-55 ${
                  verificatorAction === 'TIDAK_LAYAK_FRAUD' || verificatorAction === 'audit'
                    ? (isLight
                        ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-400 text-rose-950 shadow-md'
                        : 'bg-rose-500/20 border-rose-500/60 ring-2 ring-rose-500/40 text-white shadow-lg shadow-rose-950/40')
                    : (isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90')
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Ban className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className={`text-xs font-bold ${
                      verificatorAction === 'TIDAK_LAYAK_FRAUD' || verificatorAction === 'audit'
                        ? (isLight ? 'text-rose-900' : 'text-rose-300')
                        : (isLight ? 'text-slate-900' : 'text-white')
                    }`}>
                      4. Tidak Layak Bayar / Audit VPK (Tolak Indikasi Kecurangan JKN)
                    </span>
                    {(verificatorAction === 'TIDAK_LAYAK_FRAUD' || verificatorAction === 'audit') && (
                      <span className="action-active-indicator text-[9.5px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    Membekukan pencairan {currentCase.tariff} dan menerbitkan SP-1 + penjadwalan audit faktual Tim Pencegahan Kecurangan ke {currentCase.hospital}.
                  </p>
                </div>
              </button>
            </div>

            {/* ALASAN PENGEMBALIAN / DISPUTE / AUDIT VEDIKA */}
            <div className="pt-2 space-y-1.5">
              <div className={`text-[10.5px] font-bold flex items-center justify-between ${
                isLight ? 'text-slate-800' : 'text-white/80'
              }`}>
                <span>Daftar Alasan Baku Pending / Dispute / Penolakan VEDIKA ({pendingReasons.length} dipilih):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {VEDIKA_REASON_OPTIONS.map((reason) => {
                  const selected = pendingReasons.includes(reason);
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => toggleReason(reason)}
                      className={`px-2.5 py-1 rounded-lg border text-[10.5px] font-semibold transition cursor-pointer ${
                        selected
                          ? (isLight ? 'bg-amber-100 border-amber-400 text-amber-950' : 'bg-amber-500/25 border-amber-400/50 text-amber-200')
                          : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-white/65 hover:bg-white/10')
                      }`}
                    >
                      {selected ? '[Dipilih] ' : '+ '}
                      {reason}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* VERIFIER NOTES TEXTAREA */}
            <div className="space-y-1.5 pt-2">
              <div className={`text-[10.5px] font-bold flex flex-wrap items-center justify-between gap-2 ${
                isLight ? 'text-slate-800' : 'text-white/80'
              }`}>
                <span>Catatan Resmi Verifikator (Wajib untuk Berita Acara):</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDraftNotesWithAi}
                    disabled={isDraftingAiNotes}
                    className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                      isLight
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isDraftingAiNotes ? 'Menyusun Narasi...' : 'Susun Catatan Otomatis'}</span>
                  </button>
                  <span className={`text-[9.5px] font-mono font-bold ${
                    isLight ? 'text-emerald-700' : 'text-cyan-300'
                  }`}>TERENKRIPSI STANDAR UU PDP</span>
                </div>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={`w-full rounded-xl p-3 text-xs leading-relaxed font-sans transition focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20'
                    : 'bg-white/5 border border-white/15 focus:bg-white/10 focus:border-[#FFCA40] text-white placeholder:text-white/40'
                }`}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TAMPER-EVIDENT AUDIT VAULT & STATUS (5 COLS) */}
        <div className="xl:col-span-5 space-y-4">
          
          {/* CRYPTOGRAPHIC AUDIT VAULT PANEL */}
          <div className={`rounded-2xl p-4 space-y-3 border ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
              : 'bg-[#00153A]/80 backdrop-blur-md border-white/10 text-white shadow-xl shadow-[#00081c]/40'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2 ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <span className={`text-xs font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Lock className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-cyan-400'}`} />
                <span>Audit Trail Kriptografis (Anti-Rekayasa)</span>
              </span>
              <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-bold border ${
                isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
              }`}>
                FIPS 140-3
              </span>
            </div>

            <div className={`rounded-xl p-3 border font-mono text-[10px] space-y-2 ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800 shadow-2xs'
                : 'bg-[#000c24]/90 border-white/10 text-white/70'
            }`}>
              <div>
                <span className={`block text-[9px] ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'}`}>WAKTU SEGEL (ISO 8601):</span>
                <span className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} font-bold`}>{sealTimestamp || 'Menunggu segel disposisi'}</span>
              </div>

              <div>
                <span className={`block text-[9px] ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'}`}>ID VERIFIKATOR RESMI:</span>
                <span className={`${isLight ? 'text-emerald-800' : 'text-emerald-300'} font-bold block`}>{verifierInfo.nip} ({verifierInfo.name})</span>
              </div>

              <div>
                <span className={`block text-[9px] ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'}`}>TINDAKAN TERPILIH:</span>
                <span className={`verdict-status-badge will-change-transform font-bold block ${
                  (verificatorAction === 'TIDAK_LAYAK_FRAUD' || verificatorAction === 'audit') ? 'text-rose-600'
                  : (verificatorAction === 'PENDING_KLARIFIKASI' || verificatorAction === 'clarification') ? 'text-amber-600'
                  : verificatorAction === 'DISPUTE_TKMKB' ? 'text-purple-600'
                  : isLight ? 'text-emerald-700' : 'text-emerald-400'
                }`}>
                  {verificatorAction === 'LAYAK_BAYAR' || verificatorAction === 'override'
                    ? 'LAYAK BAYAR (DISETUJUI PRA-BAYAR)'
                    : verificatorAction === 'PENDING_KLARIFIKASI' || verificatorAction === 'clarification'
                    ? 'PENDING KLARIFIKASI FASKES (SLA 10 HK)'
                    : verificatorAction === 'DISPUTE_TKMKB'
                    ? 'SENGKETA / DISPUTE KLINIS TKMKB'
                    : verificatorAction === 'TIDAK_LAYAK_FRAUD' || verificatorAction === 'audit'
                    ? 'TIDAK LAYAK / AUDIT FAKTUAL VPK'
                    : 'MENUNGGU DISPOSISI'}
                </span>
              </div>

              <div>
                <span className={`block text-[9px] ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'}`}>HASH KRIPTOGRAFIS SHA-256:</span>
                <span className={`verdict-crypto-seal will-change-transform block ${isLight ? 'text-slate-700' : 'text-emerald-300'} font-bold text-[9px] break-all`}>
                  {auditSealHash || 'Memuat hash SHA-256 BAKB...'}
                </span>
              </div>

              <div>
                <span className={`block text-[9px] ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'}`}>STATUS TANDA TANGAN DIGITAL:</span>
                <span className={`${isLight ? 'text-emerald-800' : 'text-emerald-300'} font-bold flex items-center space-x-1`}>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>TERVERIFIKASI BPJS-KESEHATAN-ROOT-CA</span>
                </span>
              </div>

              <div className={`pt-2 border-t flex flex-wrap gap-1 text-[9px] ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <span className={`px-2 py-0.5 rounded font-bold border ${isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                  MITRE F3: FA0001 · FA0002
                </span>
                <span className={`px-2 py-0.5 rounded font-bold border ${isLight ? 'bg-sky-50 text-sky-800 border-sky-300' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'}`}>
                  ATT&amp;CK: T1078 · T1070
                </span>
                <span className={`px-2 py-0.5 rounded font-bold border ${isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                  D3FEND: D3-DS · D3-MFA
                </span>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border text-[10.5px] space-y-0.5 ${
              isLight
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-white/5 border-white/10 text-white/60'
            }`}>
              <span className={`font-semibold block ${isLight ? 'text-emerald-900' : 'text-white/90'}`}>
                Kekuatan Pembuktian Yuridis:
              </span>
              <p className="leading-relaxed">
                Log audit ini sah secara hukum pembuktian elektronik berdasarkan UU ITE & UU PDP No. 27/2022 sebagai dasar administratif penundaan pembayaran klaim faskes.
              </p>
            </div>
          </div>

          {/* ACTION BUTTON TO VIEW DOSSIER */}
          <div className={`rounded-2xl p-4 space-y-3 border ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
              : 'bg-[#00153A]/80 backdrop-blur-md border-white/10 text-white shadow-xl shadow-[#00081c]/40'
          }`}>
            <h4 className={`text-xs font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <FileCheck className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-cyan-400'}`} />
              <span>Berkas Berita Acara Siap-Audit (BAKB · 4 Lapis + QR SHA-256)</span>
            </h4>
            <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
              Seluruh bukti Lapis 1 (Pola), Lapis 2 (SATUSEHAT), Lapis 3 (Mobile JKN), dan Lapis 4 (Biometrik FRISTA) siap dicetak menjadi lembar rekomendasi resmi tim verifikator BPJS.
            </p>

            <div className="space-y-2">
              <button type="button"
                onClick={() => setShowPdfModal(true)}
                className={`w-full font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer ${
                  isLight
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-950/40'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Buka Pratinjau &amp; Cetak Dokumen PDF</span>
              </button>

              {onOpenExpansionSuite && (
                <button type="button"
                  onClick={onOpenExpansionSuite}
                  className={`w-full font-bold text-xs py-2 px-3 rounded-xl border transition flex items-center justify-center space-x-2 cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-white/10 hover:bg-white/15 text-emerald-300 border-white/15'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Berita Acara FKRTL + QR-Code SHA-256 (Suite 4 Pilar)</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* PDF DOSSIER PREVIEW MODAL WITH MOTION */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showPdfModal && (
            <motion.div
              key="bakb-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowPdfModal(false);
              }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            >
            <motion.div 
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className={`modal-content-panel will-change-transform border w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#00153A] border-white/20 text-white'
              }`}
            >
              {/* Modal Header */}
              <div className={`px-4 py-3 border-b flex items-center justify-between ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#000c24] border-white/10'
              }`}>
                <div className="flex items-center space-x-2">
                  <FileText className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-cyan-400'}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Pratinjau Berkas Telaah Pra-Bayar (PDF Resmi BPJS Kesehatan)
                  </span>
                </div>
                <button type="button" 
                  onClick={() => setShowPdfModal(false)}
                  className={`p-1 rounded-lg cursor-pointer transition ${
                    isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body: Official BPJS Letterhead */}
              <div className={`p-6 overflow-y-auto space-y-4 text-xs font-sans ${
                isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'
              }`}>
                
                {/* BPJS Letterhead */}
                <div className={`border-b-2 pb-3 flex items-start justify-between ${
                  isLight ? 'border-slate-300' : 'border-white/20'
                }`}>
                  <div>
                    <h1 className={`text-sm font-bold tracking-wider ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      BPJS KESEHATAN KANTOR PUSAT
                    </h1>
                    <p className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                      Direktorat Jaminan Pelayanan Kesehatan · Kedeputian Bidang Pengawasan dan Pemeriksaan FPK
                    </p>
                    <p className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      Jl. Letjen Suprapto Kav. 20 No. 14, Cempaka Putih, Jakarta Pusat 10510 · Telp: (021) 4212938
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      isLight ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      LEMBAR TELAAH PRA-BAYAR
                    </span>
                    <p className={`text-[9px] font-mono mt-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>No: {resolvedApiClaimId}/BAKB</p>
                  </div>
                </div>

                {/* Case Particulars */}
                <div className={`grid grid-cols-2 gap-2 text-[11px] p-3 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#000c24]/70 border-white/10 text-white/90'
                }`}>
                  <div>
                    <span className={isLight ? 'text-slate-500' : 'text-white/50'}>Fasilitas Kesehatan:</span>
                    <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{currentCase.hospital}</div>
                  </div>
                  <div>
                    <span className={isLight ? 'text-slate-500' : 'text-white/50'}>Nomor Berkas Klaim:</span>
                    <div className={`font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>{currentCase.id}</div>
                  </div>
                  <div>
                    <span className={isLight ? 'text-slate-500' : 'text-white/50'}>Prosedur INA-CBG:</span>
                    <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{currentCase.code} {currentCase.description ? `- ${currentCase.description}` : ''}</div>
                  </div>
                  <div>
                    <span className={isLight ? 'text-slate-500' : 'text-white/50'}>Nilai Tagihan:</span>
                    <div className={`font-bold ${
                      effLane === 'HIJAU'
                        ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                        : effLane === 'KUNING'
                        ? (isLight ? 'text-amber-700' : 'text-amber-300')
                        : 'text-rose-600'
                    }`}>{currentCase.tariff}{currentCase.claimCount ? ` (${currentCase.claimCount} Klaim)` : ''}</div>
                  </div>
                </div>

                {/* Multi-layer Findings */}
                <div className="space-y-1.5 text-[11px]">
                  <h4 className={`font-bold border-b pb-1 ${isLight ? 'text-slate-900 border-slate-200' : 'text-white border-white/10'}`}>
                    I. TEMUAN FORENSIK MULTI-LAPIS ({currentCase.id} · JALUR {effLane})
                  </h4>
                  <ul className={`list-disc pl-4 space-y-1 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                    <li>
                      <strong className={isLight ? 'text-slate-900' : 'text-white'}>Lapis 1 (Pola Spatiotemporal):</strong> Rasio pengajuan {spikeRatio.toFixed(1)}x dari baseline harian faskes ({clusterVolume} berkas klaster; S1 = {effS1}/100). {effLane === 'HIJAU' ? 'Konsisten dengan kapasitas layanan wajar.' : 'Memerlukan verifikasi kesesuaian episode dan dokumentasi klinis.'}
                    </li>
                    <li>
                      <strong className={isLight ? 'text-slate-900' : 'text-white'}>Lapis 2 (SDMK SATUSEHAT):</strong> DPJP {currentCase.dpjp} berstatus SIP <span className="font-mono font-bold">{sipStatus}</span> pada tanggal layanan {currentCase.date || '-'} (S2 = {effS2}/100).
                    </li>
                    <li>
                      <strong className={isLight ? 'text-slate-900' : 'text-white'}>Lapis 3 (Mobile JKN Confirmation):</strong>{' '}
                      {deniedCount === 0
                        ? `Seluruh ${sampleCount} dari ${sampleCount} peserta sampel mengonfirmasi kehadiran pelayanan secara sah (S3 = ${effS3}/100).`
                        : `${deniedCount} dari ${sampleCount} peserta sampel menyatakan tidak menerima layanan sesuai catatan klaim (S3 = ${effS3}/100).`}
                    </li>
                    <li>
                      <strong className={isLight ? 'text-slate-900' : 'text-white'}>Lapis 4 (Telemetri Biometrik FRISTA &amp; Koding):</strong>{' '}
                      {effLane === 'HIJAU'
                        ? `Biometrik FRISTA liveness pada SEP ${currentCase.sep} dan tarif ${currentCase.code} tervalidasi normal.`
                        : effLane === 'KUNING'
                        ? `Menunggu sinkronisasi log FRISTA dan kelengkapan berkas penunjang INA-CBG ${currentCase.code}.`
                        : `Terdeteksi anomali otentikasi biometrik / kesesuaian koding pada SEP ${currentCase.sep} (Skor Fusi: ${effScore.toFixed(1)}/100).`}
                    </li>
                  </ul>
                </div>

                {/* Verifier Verdict */}
                <div className={`p-3 rounded-xl text-[11px] space-y-1 border ${
                  effLane === 'HIJAU' || verificatorAction === 'LAYAK_BAYAR' || verificatorAction === 'override'
                    ? (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200')
                    : effLane === 'KUNING' || verificatorAction === 'PENDING_KLARIFIKASI'
                    ? (isLight ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-amber-500/10 border-amber-500/30 text-amber-200')
                    : (isLight ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-rose-500/10 border-rose-500/30 text-rose-200')
                }`}>
                  <h4 className={`font-bold ${
                    effLane === 'HIJAU' || verificatorAction === 'LAYAK_BAYAR' || verificatorAction === 'override'
                      ? (isLight ? 'text-emerald-800' : 'text-emerald-300')
                      : effLane === 'KUNING' || verificatorAction === 'PENDING_KLARIFIKASI'
                      ? (isLight ? 'text-amber-800' : 'text-amber-300')
                      : (isLight ? 'text-rose-800' : 'text-rose-300')
                  }`}>II. REKOMENDASI DAN KEPUTUSAN VERIFIKATOR</h4>
                  <p>{notes}</p>
                  {pendingReasons.length > 0 && (
                    <p className="font-mono text-[10px] pt-1">
                      Alasan VEDIKA: {pendingReasons.join('; ')}
                    </p>
                  )}
                </div>

                {/* Signature Block */}
                <div className="pt-4 flex justify-between items-end text-[10px]">
                  <div>
                    <p className={`font-mono ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Digital Seal: SHA-256 {auditSealHash ? `${auditSealHash.slice(0, 12)}...${auditSealHash.slice(-8)}` : 'menunggu disposisi'}</p>
                    <p className={isLight ? 'text-slate-500' : 'text-white/50'}>Waktu Segel: {sealTimestamp ? sealTimestamp : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="text-center w-52 relative pt-6">
                    <div className="verdict-stamp-print will-change-transform absolute top-0 right-3 pointer-events-none px-2.5 py-0.5 rounded border-2 border-emerald-600 text-emerald-700 font-mono font-black text-[9.5px] uppercase tracking-wider bg-emerald-50">
                      [SEALED · SAH]
                    </div>
                    <p className={`mb-7 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>Verifikator Klaim BPJS,</p>
                    <p className={`font-bold underline ${isLight ? 'text-slate-900' : 'text-white'}`}>{verifierInfo.name}</p>
                    <p className={isLight ? 'text-slate-500' : 'text-white/50'}>NIP: {verifierInfo.nip}</p>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className={`px-4 py-3 border-t flex items-center justify-between font-mono ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#000c24] border-white/10'
              }`}>
                <span className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                  STANDAR ARSIP: PDF/A-1b KEMENKES &amp; BPJS
                </span>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowPdfModal(false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                      isLight ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    Tutup
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handlePrintDossier}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border cursor-pointer transition ${
                      isLight 
                        ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100' 
                        : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Lembar BAKB</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleDownloadDossierPdf}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer transition ${
                      isLight 
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white' 
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Berkas Resmi</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* FOOTER ACTIONS */}
      <div className={`flex items-center justify-between p-3 rounded-2xl border ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
          : 'bg-[#00153A]/90 backdrop-blur-xl border-white/10 text-white shadow-2xl'
      }`}>
        <button type="button"
          onClick={onBackToInvestigation}
          className={`text-xs font-semibold flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer border ${
            isLight
              ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Matriks Investigasi</span>
        </button>

        <button type="button"
          onClick={onBackToQueue}
          className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer border ${
            isLight
              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
              : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
          }`}
        >
          <span>Selesai &amp; Kembali ke Antrean Triage</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      </div>
      )}
    </div>
  );
}
