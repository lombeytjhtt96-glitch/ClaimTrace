import React, { useState, useEffect } from 'react';
import { API_BASE_URL, authFetch, getCachedJsonSync, cachedAuthGetJson } from '../../services/apiConfig';
import { motion, AnimatePresence } from 'motion/react';
import TemporalAlertCard from './TemporalAlertCard';
import { 
  ChevronRight, ArrowLeft, AlertTriangle, ShieldCheck, 
  Clock, Hospital, Stethoscope, UserCheck, AlertOctagon,
  TrendingUp, FileText, CheckCircle2, XCircle, Share2, 
  ExternalLink, Info, Activity, GitBranch, ArrowRight, Lock, Check,
  Bot, Zap, ShieldAlert, Sparkles, Cpu, Layers, History, Send, Receipt, Gavel
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
  AreaChart,
  Area,
} from 'recharts';

function VolumeChartTooltip({ active, payload, isLight }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const baseline = data.baseline ?? 10;
  const ratioLabel = data.spikeRatio ? Number(data.spikeRatio).toFixed(1) : '3.0';
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs shadow-xl backdrop-blur-md ${
      isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/60' : 'bg-[#00153A] border-white/10 text-white shadow-2xl'
    }`}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className={`font-semibold ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{data.date}</span>
        {data.isSpike && (
          <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
            isLight ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
            ANOMALI SPIKE
          </span>
        )}
      </div>
      <p className={`font-semibold flex items-center justify-between gap-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
        <span className={isLight ? 'text-slate-600' : 'text-white/70'}>Volume Klaim:</span>
        <span className={`font-mono font-bold ${data.isSpike ? (isLight ? 'text-rose-600' : 'text-rose-400') : (isLight ? 'text-slate-900' : 'text-cyan-300')}`}>
          {data.volume} berkas
        </span>
      </p>
      <p className={`text-[10px] flex items-center justify-between gap-4 mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
        <span>Baseline Faskes:</span>
        <span className="font-mono font-medium">{baseline} berkas/hari</span>
      </p>
      {data.isSpike && (
        <div className="mt-1.5 pt-1 border-t border-rose-100 dark:border-white/10 text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>Lonjakan {ratioLabel}x di atas kapasitas wajar</span>
        </div>
      )}
    </div>
  );
}

export default function CaseInvestigation({ 
  caseData, 
  s1 = 85, 
  s2 = 95, 
  s3 = 80, 
  patientResponse = null, 
  onBackToQueue,
  onOpenDecision,
  onOpenDocumentChecker,
  isLight = false
}) {
  const [volumeViewType, setVolumeViewType] = useState('bar'); // 'bar' | 'area'
  const claimsUrl = `${API_BASE_URL}/api/v1/claims`;
  const [hydratedLeadCase, setHydratedLeadCase] = useState(() => {
    const rawList = getCachedJsonSync(claimsUrl);
    if (!Array.isArray(rawList) || rawList.length === 0) return null;
    const redFirst = rawList.find((r) => r?.triage?.triage_lane === 'MERAH') || rawList[0];
    return redFirst ? { rawClaim: redFirst.claim, rawTriage: redFirst.triage } : null;
  });

  useEffect(() => {
    if (caseData && typeof caseData === 'object' && caseData.rawClaim) return;
    let active = true;
    cachedAuthGetJson(claimsUrl).then((rawList) => {
      if (!active || !Array.isArray(rawList) || rawList.length === 0) return;
      const targetId = typeof caseData === 'string' ? caseData : caseData?.id;
      const matched = (targetId && rawList.find((r) => r?.claim?.claim_id === targetId))
        || rawList.find((r) => r?.triage?.triage_lane === 'MERAH')
        || rawList[0];
      if (matched) {
        setHydratedLeadCase({ rawClaim: matched.claim, rawTriage: matched.triage });
      }
    });
    return () => { active = false; };
  }, [caseData, claimsUrl]);

  const rawClaim = (typeof caseData === 'object' && caseData?.rawClaim) || hydratedLeadCase?.rawClaim || null;
  const rawTriage = (typeof caseData === 'object' && caseData?.rawTriage) || hydratedLeadCase?.rawTriage || null;

  const defaultCase = {
    id: typeof caseData === 'string' ? caseData : rawClaim?.claim_id || 'CLM-2026-8801',
    sep: rawClaim?.fkl02_id_kunjungan || '0132R0011026V000085',
    hospital: rawClaim?.nama_faskes || 'RS Khusus Mitra Husada',
    hospitalType: `${rawClaim?.fkl08_jenis_faskes || 'FKRTL'} (Kelas ${rawClaim?.kelas_rs || 'C'})`,
    code: rawClaim?.ina_cbg_code || 'Z-3-12-0',
    description: rawClaim?.deskripsi_cbg || 'Prosedur Fisioterapi / Rehabilitasi Medis Massal Pasca-Baksos',
    tariff: `Rp ${Number(rawClaim?.nilai_klaim_rp || 15300000).toLocaleString('id-ID')}`,
    dpjp: rawClaim?.dpjp_meta?.nama_dpjp_alias || 'dr. Hendra, Sp.KFR',
    sipNumber: rawClaim?.dpjp_meta?.dpjp_id_hash || '446.1/108/DPJP/2023',
    date: rawClaim?.tanggal_layanan || '2026-10-14',
    batchTag: rawClaim?.episode_meta?.cluster_id || 'BAKSOS_MASSAL_OKT26',
    sampleCount: rawClaim?.mobile_meta?.sampel_terkirim || 10,
    participantCount: rawClaim?.mobile_meta?.sampel_terkirim || 10,
    deniedCount: rawClaim?.mobile_meta?.respon_tidak_hadir ?? (patientResponse === 'denied' ? 9 : patientResponse === 'confirmed' ? 7 : 8),
  };

  const currentCase = {
    ...defaultCase,
    ...((typeof caseData === 'object' && caseData !== null) ? caseData : {}),
    id: (typeof caseData === 'object' && caseData?.id) || defaultCase.id,
    sep: (typeof caseData === 'object' && caseData?.sep) || defaultCase.sep,
    hospital: (typeof caseData === 'object' && caseData?.hospital) || defaultCase.hospital,
    hospitalType: (typeof caseData === 'object' && caseData?.hospitalType) || defaultCase.hospitalType,
    code: (typeof caseData === 'object' && caseData?.code) || defaultCase.code,
    description: (typeof caseData === 'object' && caseData?.description) || defaultCase.description,
    tariff: (typeof caseData === 'object' && caseData?.tariff) || defaultCase.tariff,
    dpjp: (typeof caseData === 'object' && caseData?.dpjp) || defaultCase.dpjp,
    sipNumber: (typeof caseData === 'object' && caseData?.sipNumber) || defaultCase.sipNumber,
    date: (typeof caseData === 'object' && caseData?.date) || defaultCase.date,
    deniedCount: rawClaim?.mobile_meta?.respon_tidak_hadir !== undefined
      ? rawClaim.mobile_meta.respon_tidak_hadir
      : ((typeof caseData === 'object' && caseData?.deniedCount !== undefined)
        ? caseData.deniedCount
        : (patientResponse === 'denied' ? 9 : patientResponse === 'confirmed' ? 7 : 8)),
    sampleCount: Math.max(1, Number(rawClaim?.mobile_meta?.sampel_terkirim ?? ((typeof caseData === 'object' && caseData?.sampleCount) || 10))),
    participantCount: Math.max(1, Number(rawClaim?.mobile_meta?.sampel_terkirim ?? ((typeof caseData === 'object' && (caseData?.participantCount || caseData?.sampleCount)) || 10))),
  };

  const effS1 = Number(rawClaim?.s1_score ?? rawTriage?.score_breakdown?.s1_value ?? s1);
  const effS2 = Number(rawClaim?.s2_score ?? rawTriage?.score_breakdown?.s2_value ?? s2);
  const effS3 = patientResponse !== null ? Number(s3) : Number(rawClaim?.s3_score ?? rawTriage?.score_breakdown?.s3_value ?? s3);
  const weightedS1 = Math.round(0.5 * effS1 * 10) / 10;
  const weightedS2 = Math.round(0.3 * effS2 * 10) / 10;
  const weightedS3 = Math.round(0.2 * effS3 * 10) / 10;
  const rawFusionScore = Math.round((weightedS1 + weightedS2 + weightedS3) * 10) / 10;

  const sipStatus = rawClaim?.dpjp_meta?.sip_status || 'EXPIRED';
  const hardTriggerActivated = Boolean(rawTriage?.hard_trigger_activated || sipStatus === 'EXPIRED');
  const totalScore = patientResponse !== null
    ? (hardTriggerActivated ? Math.max(rawFusionScore, 75) : rawFusionScore)
    : Number(rawTriage?.final_priority_score ?? (hardTriggerActivated ? Math.max(rawFusionScore, 75) : rawFusionScore));

  const effectiveLane = (totalScore >= 75 || hardTriggerActivated)
    ? 'MERAH'
    : (totalScore >= 50 || sipStatus === 'UNSYNCED')
    ? 'KUNING'
    : 'HIJAU';

  const AUDIT_CHECKLIST_META = [
    { key: 'sep_valid', label: '1. Kelengkapan SEP & Eligibilitas JKN', rule: 'Perpres 82/2018 Pasal 46' },
    { key: 'resume_medis', label: '2. Resume Medis & Otorisasi DPJP', rule: 'PMK 24/2022 Rekam Medis' },
    { key: 'penunjang_klinis', label: '3. Bukti Lab / Radiologi / Terapi Sah', rule: 'Panduan Audit Klinis' },
    { key: 'koding_cbg', label: '4. Kepatuhan Koding ICD-10 / ICD-9 & Tarif CBG', rule: 'Permenkes 26/2021' },
    { key: 'sdmk_aktif', label: '5. Validitas SIP/STR & Rasio Kapasitas SDMK', rule: 'Permenkes 14/2021' },
    { key: 'biometrik_mobile', label: '6. Log FRISTA & Konfirmasi Mobile JKN', rule: 'SE FRISTA / UU PDP' },
  ];

  const defaultChecklistForLane = (lane) => ({
    sep_valid: true,
    resume_medis: lane !== 'MERAH',
    penunjang_klinis: lane === 'HIJAU',
    koding_cbg: lane !== 'MERAH',
    sdmk_aktif: sipStatus === 'ACTIVE',
    biometrik_mobile: lane === 'HIJAU',
  });

  const [caseChecklist, setCaseChecklist] = useState(() => (
    (typeof caseData === 'object' && caseData?.checklist && typeof caseData.checklist === 'object')
      ? { ...defaultChecklistForLane(effectiveLane), ...caseData.checklist }
      : defaultChecklistForLane(effectiveLane)
  ));
  const [checklistSaving, setChecklistSaving] = useState(false);
  const [checklistNotice, setChecklistNotice] = useState('');

  useEffect(() => {
    let active = true;
    setChecklistNotice('');
    cachedAuthGetJson(`${API_BASE_URL}/api/v1/claims/${currentCase.id}/checklist`).then((data) => {
      if (!active) return;
      if (data?.checklist && typeof data.checklist === 'object') {
        setCaseChecklist({ ...defaultChecklistForLane(effectiveLane), ...data.checklist });
      } else {
        setCaseChecklist(defaultChecklistForLane(effectiveLane));
      }
    }).catch(() => {
      if (active) setCaseChecklist(defaultChecklistForLane(effectiveLane));
    });
    return () => { active = false; };
  }, [currentCase.id]);

  const handleToggleChecklistItem = async (itemKey) => {
    const updated = { ...caseChecklist, [itemKey]: !caseChecklist[itemKey] };
    setCaseChecklist(updated);
    setChecklistSaving(true);
    setChecklistNotice('');
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/claims/${currentCase.id}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifier_id: 'VERIF-WASRIK-01',
          checklist: updated,
          notes: `Pembaruan Kertas Kerja 6 Kaidah pada ${currentCase.id}`,
        }),
      });
      if (res.ok) {
        setChecklistNotice('Kertas kerja tersimpan ke log audit.');
      } else {
        setChecklistNotice('Disimpan lokal (mode viewer tidak menyimpan ke server).');
      }
    } catch {
      setChecklistNotice('Gagal menyinkronkan ke backend.');
    } finally {
      setChecklistSaving(false);
    }
  };

  const checkedCount = AUDIT_CHECKLIST_META.filter((m) => Boolean(caseChecklist[m.key])).length;

  const [claimDossier, setClaimDossier] = useState(() => getCachedJsonSync(`${API_BASE_URL}/api/v1/claims/${currentCase.id}/dossier`)?.dossier || null);
  const [dossierSubTab, setDossierSubTab] = useState('berkas'); // 'berkas' | 'icare' | 'billing' | 'susulan' | 'adjudication'
  const [resubmitForm, setResubmitForm] = useState({
    catatan_faskes: '',
    perbaikan_icd10: '',
    perbaikan_cbg: '',
    tarif_revisi_rp: '',
    dok_frista: false,
    dok_tte: false,
  });
  const [resubmitBusy, setResubmitBusy] = useState(false);
  const [resubmitMsg, setResubmitMsg] = useState(null);

  const [adjudicationData, setAdjudicationData] = useState(() => getCachedJsonSync(`${API_BASE_URL}/api/v1/adjudication/two-tier/${currentCase.id}`) || null);
  const [tier1Form, setTier1Form] = useState({
    verifikator_name: 'dr. Siti Rahma, Sp.PK',
    verifikator_nip: '19870420 201101 2 001',
    verdict: 'DISPUTE_KODING',
    clinical_notes: 'Ditemukan ketidaksesuaian koding tingkat keparahan III pada kasus nyeri punggung. Rekomendasi koding diturunkan ke Severity I (Recoding).',
    documents_verified: ['SEP', 'RESUME_MEDIS', 'BILLING_RS']
  });
  const [tier2Form, setTier2Form] = useState({
    reviewer_name: 'dr. H. Ahmad Fauzi, Sp.A (Dokter Penelaah Senior BPJS)',
    reviewer_nip: '19780512 200312 1 002',
    final_verdict: 'DISPUTE_KODING',
    is_overridden: true,
    override_justification: 'Hasil penelaahan dokter spesialis menyepakati bahwa tindakan rawat inap memang terjadi namun tidak memenuhi kriteria Severity III. Tidak langsung ditolak total (fraud), melainkan diselesaikan melalui mekanisme Dispute Koding Berita Acara (BAHV) sesuai Permenkes 26/2021.',
    regulatory_justification: 'Permenkes No. 26 Tahun 2021 Bab IV Kaidah Koding INA-CBG & Berita Acara Kesepakatan Bersama Tim Pencegahan Kecurangan.',
    second_opinion_notes: 'Disetujui untuk dibayarkan pada plafon tarif Severity Level I (Rp 3.200.000,-). Cost recovery sebesar Rp 8.450.000,- diamankan.'
  });
  const [adjudicationBusy, setAdjudicationBusy] = useState(false);
  const [adjudicationMsg, setAdjudicationMsg] = useState(null);
  const [cypherBusy, setCypherBusy] = useState(false);

  const handleExportCypher = async () => {
    setCypherBusy(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/graph/cypher-export`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claimtrace_neo4j_${currentCase.id || 'graph'}.cypher`;
      a.click();
      URL.revokeObjectURL(url);
      setChecklistNotice('Skrip graf Neo4j (.cypher) berhasil diunduh dari backend.');
    } catch {
      setChecklistNotice('Gagal mengekspor skrip graf Neo4j dari server.');
    } finally {
      setCypherBusy(false);
    }
  };

  const loadClaimDossier = React.useCallback(async () => {
    try {
      const json = await cachedAuthGetJson(`${API_BASE_URL}/api/v1/claims/${currentCase.id}/dossier`);
      if (json?.dossier) setClaimDossier(json.dossier);
    } catch {
      // keep fallback UI clean
    }
  }, [currentCase.id]);

  const [clinicalAudit, setClinicalAudit] = useState({
    charlson: null,
    upcoding: null,
    temporal: null,
    loading: false,
  });

  useEffect(() => {
    let active = true;
    setResubmitMsg(null);
    setAdjudicationMsg(null);
    setClinicalAudit((prev) => ({ ...prev, loading: true }));
    cachedAuthGetJson(`${API_BASE_URL}/api/v1/claims/${currentCase.id}/dossier`).then((json) => {
      if (active && json?.dossier) {
        setClaimDossier(json.dossier);
      }
    });
    cachedAuthGetJson(`${API_BASE_URL}/api/v1/adjudication/two-tier/${currentCase.id}`).then((json) => {
      if (active && json) {
        setAdjudicationData(json);
      }
    });
    Promise.all([
      cachedAuthGetJson(`${API_BASE_URL}/api/v1/clinical/charlson/${currentCase.id}`).catch(() => null),
      cachedAuthGetJson(`${API_BASE_URL}/api/v1/clinical/upcoding-audit/${currentCase.id}`).catch(() => null),
      cachedAuthGetJson(`${API_BASE_URL}/api/v1/clinical/temporal-coherence/${currentCase.id}`).catch(() => null),
    ]).then(([charlsonRes, upcodingRes, temporalRes]) => {
      if (!active) return;
      setClinicalAudit({
        charlson: charlsonRes?.audit_result || null,
        upcoding: upcodingRes?.upcoding_evaluation || null,
        temporal: temporalRes?.coherence_evaluation || null,
        loading: false,
      });
    });
    return () => { active = false; };
  }, [currentCase.id]);

  const handleTier1Submit = async (e) => {
    e.preventDefault();
    setAdjudicationBusy(true);
    setAdjudicationMsg(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/adjudication/tier-1-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: currentCase.id,
          verifikator_name: tier1Form.verifikator_name,
          verifikator_nip: tier1Form.verifikator_nip,
          verdict: tier1Form.verdict,
          clinical_notes: tier1Form.clinical_notes,
          documents_verified: tier1Form.documents_verified
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAdjudicationMsg({ tone: 'green', text: data.message });
        const refresh = await authFetch(`${API_BASE_URL}/api/v1/adjudication/two-tier/${currentCase.id}`);
        if (refresh.ok) setAdjudicationData(await refresh.json());
      } else {
        setAdjudicationMsg({ tone: 'red', text: 'Gagal menyimpan telaah Tier 1.' });
      }
    } catch (err) {
      setAdjudicationMsg({ tone: 'red', text: String(err) });
    } finally {
      setAdjudicationBusy(false);
    }
  };

  const handleTier2Submit = async (e) => {
    e.preventDefault();
    setAdjudicationBusy(true);
    setAdjudicationMsg(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/adjudication/tier-2-override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: currentCase.id,
          reviewer_name: tier2Form.reviewer_name,
          reviewer_nip: tier2Form.reviewer_nip,
          final_verdict: tier2Form.final_verdict,
          is_overridden: tier2Form.is_overridden,
          override_justification: tier2Form.override_justification,
          regulatory_justification: tier2Form.regulatory_justification,
          second_opinion_notes: tier2Form.second_opinion_notes
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAdjudicationMsg({ tone: 'green', text: data.message });
        const refresh = await authFetch(`${API_BASE_URL}/api/v1/adjudication/two-tier/${currentCase.id}`);
        if (refresh.ok) setAdjudicationData(await refresh.json());
      } else {
        setAdjudicationMsg({ tone: 'red', text: 'Gagal mengesahkan putusan Tier 2.' });
      }
    } catch (err) {
      setAdjudicationMsg({ tone: 'red', text: String(err) });
    } finally {
      setAdjudicationBusy(false);
    }
  };

  const handleSusulanResubmit = async (e) => {
    e.preventDefault();
    if (resubmitBusy || !resubmitForm.catatan_faskes.trim()) return;
    setResubmitBusy(true);
    setResubmitMsg(null);
    const docs = [];
    if (resubmitForm.dok_frista) docs.push('BUKTI_FRISTA_ESEP');
    if (resubmitForm.dok_tte) docs.push('RESUME_MEDIS_TTE_DPJP');
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/claims/${currentCase.id}/resubmit-susulan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catatan_faskes: resubmitForm.catatan_faskes.trim(),
          perbaikan_icd10: resubmitForm.perbaikan_icd10.trim() || null,
          perbaikan_cbg: resubmitForm.perbaikan_cbg.trim() || null,
          tarif_revisi_rp: resubmitForm.tarif_revisi_rp ? Number(resubmitForm.tarif_revisi_rp) : null,
          dokumen_tambahan: docs,
          jenis_pengajuan: 'Susulan',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResubmitMsg({ tone: 'green', text: `Klaim Susulan #${data.resubmission_count} berhasil direkam ke antrean penapisan & audit SHA-256.` });
        setResubmitForm({ catatan_faskes: '', perbaikan_icd10: '', perbaikan_cbg: '', tarif_revisi_rp: '', dok_frista: false, dok_tte: false });
        await loadClaimDossier();
      } else {
        setResubmitMsg({ tone: 'red', text: data.detail || 'Otoritas peran tidak mengizinkan perekaman Klaim Susulan.' });
      }
    } catch {
      setResubmitMsg({ tone: 'red', text: 'Gagal terhubung ke endpoint Resubmit Susulan.' });
    } finally {
      setResubmitBusy(false);
    }
  };

  const clusterVolume = Number(rawClaim?.episode_meta?.jumlah_klaim_klaster ?? currentCase.claimCount ?? 85);
  const spikeRatio = Number(rawClaim?.episode_meta?.rasio_lonjakan_baseline ?? 8.5);
  const baselineVol = Math.max(1, Math.round(clusterVolume / Math.max(spikeRatio, 1)));
  const dynamicVolumeData = [
    { date: 'H-3', volume: baselineVol, baseline: baselineVol, spikeRatio, isSpike: false },
    { date: 'H-2', volume: Math.max(1, baselineVol + 2), baseline: baselineVol, spikeRatio, isSpike: false },
    { date: 'H-1', volume: Math.max(1, baselineVol - 1), baseline: baselineVol, spikeRatio, isSpike: false },
    { date: 'Tgl Klaim', volume: clusterVolume, baseline: baselineVol, spikeRatio, isSpike: spikeRatio >= 3.0 },
    { date: 'H+1', volume: Math.max(1, baselineVol + 1), baseline: baselineVol, spikeRatio, isSpike: false },
  ];

  // AI Automatic Anomaly Detection Variables (grounded on live backend triage output when present)
  const liveAi = rawTriage?.ai_anomaly_prediction;
  const isPhantomBilling = liveAi?.primary_anomaly_category === 'PHANTOM_BILLING' || (!liveAi && (currentCase.code === 'Z-3-12-0' || currentCase.id.includes('8801') || currentCase.id.includes('085') || currentCase.batchTag?.includes('BAKSOS')));
  const isRepeatBilling = liveAi?.primary_anomaly_category === 'REPEAT_BILLING' || (!liveAi && (currentCase.id.includes('8802') || currentCase.code?.startsWith('K-4') || currentCase.description?.toLowerCase().includes('berulang')));

  const categoryNames = {
    PHANTOM_BILLING: 'Modus #6: Phantom Billing (Klaim Fiktif Klaster Massal)',
    REPEAT_BILLING: 'Modus #11: Repeat Billing (Penagihan Klaim Berulang Episode)',
    IMPOSSIBLE_TRAVEL: 'Anomali Geovelocity DPJP > 120 km/jam (Impossible Travel)',
    UPCODING_SEVERITY: 'Modus Upcoding Tingkat Keparahan INA-CBG Level III',
    ADMINISTRATIVE_HARD_TRIGGER: 'Hard Trigger: SIP DPJP Kedaluwarsa pada Tanggal Layanan',
    ADMINISTRATIVE_UNCERTAINTY: 'Ketidakpastian Sinkronisasi SATUSEHAT SDMK (Jalur Kuning)',
    NORMAL_CLAIM: 'Klaim Wajar Konsisten (Lolos Saring Fast-Track)',
  };

  const formatStatusLabel = (code, fallback = 'Menunggu Verifikasi') => {
    const labelMap = {
      MENUNGGU_TIER_1: 'Menunggu Verifikasi Tier 1',
      MENUNGGU_PENELAAH_TIER_2: 'Menunggu Penelaah Tier 2',
      PUTUSAN_FINAL_DISAHKAN: 'Putusan Final Disahkan',
      SETUJUI_LAYAK: 'Setujui Layak Bayar',
      HOLD_KLARIFIKASI: 'Tahan Klarifikasi',
      DISPUTE_KODING: 'Dispute Koding',
      TOLAK_FRAUD: 'Tolak Indikasi Fraud',
    };
    if (!code) return fallback;
    if (labelMap[code]) return labelMap[code];
    return String(code)
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  };

  const aiAnomalyCategory = liveAi?.primary_anomaly_category
    ? (categoryNames[liveAi.primary_anomaly_category] || formatStatusLabel(liveAi.primary_anomaly_category))
    : isPhantomBilling
    ? categoryNames.PHANTOM_BILLING
    : isRepeatBilling
    ? categoryNames.REPEAT_BILLING
    : effectiveLane === 'MERAH'
    ? 'Anomali Multivariat Tingkat Tinggi'
    : effectiveLane === 'KUNING'
    ? categoryNames.ADMINISTRATIVE_UNCERTAINTY
    : categoryNames.NORMAL_CLAIM;

  const aiAnomalyScore = liveAi ? Number(liveAi.anomaly_score) : (effectiveLane === 'MERAH' ? Math.max(totalScore, 85) : effectiveLane === 'KUNING' ? 58.0 : Math.min(24.5, totalScore));
  const aiConfidenceScore = liveAi ? Number(liveAi.confidence_score) : 95.0;

  const aiDrivers = Array.isArray(liveAi?.feature_drivers) && liveAi.feature_drivers.length > 0
    ? liveAi.feature_drivers.map((d) => ({
        label: d.feature_label || d.feature_name,
        pct: Math.round(Number(d.contribution_pct || 0) * 10) / 10,
        val: String(d.raw_value ?? '-'),
        anomalous: Number(d.contribution_pct || 0) >= 20 || effectiveLane === 'MERAH',
      }))
    : isPhantomBilling ? [
        { label: `Rasio Lonjakan Klaster Spatiotemporal (${spikeRatio.toFixed(1)}x)`, pct: 34.5, val: `${clusterVolume} Klaim / Klaster`, anomalous: true },
        { label: 'Kemiripan Teks Resume Medis (Indikasi Salin-Tempel)', pct: 28.2, val: 'Kesesuaian Teks 98.4%', anomalous: true },
        { label: 'Rasio Penolakan Presensi Mobile JKN', pct: 22.1, val: `${currentCase.deniedCount}/${currentCase.sampleCount} Peserta Menolak`, anomalous: currentCase.deniedCount > 0 },
        { label: 'Diskrepansi Izin Praktik DPJP SATUSEHAT', pct: 15.2, val: sipStatus === 'EXPIRED' ? 'SIP Expired (Hard-Trigger)' : sipStatus, anomalous: sipStatus === 'EXPIRED' },
      ] : isRepeatBilling ? [
        { label: 'Indikasi Klaim Berulang Episode Sama', pct: 41.5, val: 'Repeat / Split Billing <= 30 Hr', anomalous: true },
        { label: 'Interval Admisi Terlalu Singkat', pct: 26.5, val: 'Episode Terkait Sebelumnya', anomalous: true },
        { label: 'Kesamaan Kode CBG & ICD-10 Primer', pct: 19.5, val: currentCase.code, anomalous: true },
        { label: 'Status SIP DPJP SDMK', pct: 12.5, val: sipStatus, anomalous: sipStatus === 'EXPIRED' },
      ] : [
        { label: 'Konsistensi Riwayat Layanan & Baseline', pct: 45.0, val: `${spikeRatio.toFixed(1)}x baseline (Wajar)`, anomalous: false },
        { label: 'Status Keaktifan SIP DPJP di SDMK', pct: 25.0, val: sipStatus === 'UNSYNCED' ? 'UNSYNCED (Kuning Administratif)' : 'SIP Aktif Valid', anomalous: sipStatus !== 'ACTIVE' },
        { label: 'Tingkat Konfirmasi Mobile JKN', pct: 20.0, val: `${currentCase.sampleCount - currentCase.deniedCount}/${currentCase.sampleCount} Hadir`, anomalous: currentCase.deniedCount > 0 },
        { label: 'Kesesuaian Tarif INA-CBG Permenkes', pct: 10.0, val: currentCase.code, anomalous: false },
      ];

  const aiRationale = liveAi?.explanation_rationale
    || rawTriage?.ringkasan_bukti_audit
    || (effectiveLane === 'HIJAU'
      ? `Klaim ${currentCase.id} berada pada rentang Hijau (${totalScore}/100 < 50): pola episode normal (${spikeRatio.toFixed(1)}x baseline), SIP DPJP valid, dan kehadiran peserta konsisten.`
      : effectiveLane === 'KUNING'
      ? `Klaim ${currentCase.id} masuk jalur Kuning (${totalScore}/100, batas 50-74,9 atau status SDMK UNSYNCED): memerlukan klarifikasi administratif faskes, bukan vonis kecurangan sepihak.`
      : `Sistem mendeteksi anomali kritis (${totalScore}/100 >= 75 atau Hard Trigger): lonjakan ${spikeRatio.toFixed(1)}x baseline dan temuan bukti lintas lapis.`);

  const aiRecommendation = liveAi?.recommended_action
    || rawTriage?.rekomendasi_sop
    || (effectiveLane === 'MERAH'
      ? 'Tahan Pembayaran Pra-Bayar (Jalur Merah) · Terbitkan Berita Acara Hasil Verifikasi (BAHV)'
      : effectiveLane === 'KUNING'
      ? 'Minta Klarifikasi Dokumen / Sinkronisasi SDMK Faskes (Jalur Kuning)'
      : 'Lolos Cepat Verifikasi Pra-Bayar (Jalur Hijau < 24 Jam)');

  const screeningTraceSteps = [
    {
      step: 1,
      title: 'Tahap 1 · Filter Dasar & PRB',
      status: rawClaim?.episode_meta?.terdaftar_baksos_resmi ? 'PENGECUALIAN SAH' : 'TERCATAT DI ANTREAN',
      passed: true,
      detail: rawClaim?.episode_meta?.terdaftar_baksos_resmi
        ? 'Kegiatan baksos/program terdaftar resmi (dikecualikan dari penalti lonjakan).'
        : `FPK ${currentCase.code} (${currentCase.tariff}) masuk penyaringan pra-bayar.`,
    },
    {
      step: 2,
      title: 'Tahap 2 · Pola & Semantik (S1 50%)',
      status: effS1 >= 70 ? `TERFLAG (${effS1}/100)` : `WAJAR (${effS1}/100)`,
      passed: effS1 < 70,
      detail: rawClaim?.episode_meta?.terdaftar_baksos_resmi
        ? `Rasio ${spikeRatio.toFixed(1)}x lolos pengecualian baksos resmi · Klaster ${clusterVolume} klaim · Sumbangan +${weightedS1} pt.`
        : `Lonjakan ${spikeRatio.toFixed(1)}x baseline (ambang >= 3,0x) · Klaster ${clusterVolume} klaim · Sumbangan +${weightedS1} pt.`,
    },
    {
      step: 3,
      title: 'Tahap 3 · SDMK & Geovelocity (S2 30%)',
      status: sipStatus === 'EXPIRED' ? 'HARD-TRIGGER MERAH' : sipStatus === 'UNSYNCED' ? 'KUNING (UNSYNCED)' : `VALID (${effS2}/100)`,
      passed: sipStatus === 'ACTIVE' && effS2 < 70,
      detail: sipStatus === 'EXPIRED'
        ? 'SIP DPJP Expired pada tgl layanan (Hard Trigger >= 75,0).'
        : sipStatus === 'UNSYNCED'
        ? 'Profil DPJP UNSYNCED di SATUSEHAT (dialihkan ke Kuning, dicegah jadi false positive Merah).'
        : `SIP aktif valid · Sumbangan +${weightedS2} pt.`,
    },
    {
      step: 4,
      title: 'Tahap 4 · Mobile JKN & Fusi (0 - 100)',
      status: `${effectiveLane} (${totalScore}/100)`,
      passed: effectiveLane === 'HIJAU',
      detail: `${currentCase.deniedCount}/${currentCase.sampleCount} peserta menyangkal · Total fusi = ${totalScore} (Batas: Hijau <50 | Kuning 50-74,9 | Merah >=75).`,
    },
  ];

  // Verified participants array
  const verifiedParticipants = [
    { id: 'PST-77218902', name: 'Ahmad Syafiq', status: patientResponse === 'denied' ? 'denied' : patientResponse === 'confirmed' ? 'confirmed' : 'pending_denied', target: true },
    { id: 'PST-77218903', name: 'Ahmad S.', status: 'denied', target: false },
    { id: 'PST-77218904', name: 'Siti R.', status: 'denied', target: false },
    { id: 'PST-77218905', name: 'Budi W.', status: 'denied', target: false },
    { id: 'PST-77218906', name: 'Dewi A.', status: 'confirmed', target: false },
    { id: 'PST-77218907', name: 'Eko P.', status: 'denied', target: false },
    { id: 'PST-77218908', name: 'Fitri N.', status: 'denied', target: false },
    { id: 'PST-77218909', name: 'Gunawan H.', status: 'denied', target: false },
    { id: 'PST-77218910', name: 'Haryanto T.', status: 'denied', target: false },
    { id: 'PST-77218911', name: 'Indah K.', status: 'confirmed', target: false },
  ];

  const renderCustomBarLabel = (props) => {
    const { x, y, width, index } = props;
    const item = dynamicVolumeData[index];
    if (!item?.isSpike) return null;
    const labelText = String(item.volume);
    const pillWidth = Math.max(28, labelText.length * 8 + 12);
    return (
      <g>
        <rect
          x={x + width / 2 - pillWidth / 2}
          y={y - 21}
          width={pillWidth}
          height={17}
          rx={5}
          fill={isLight ? '#e11d48' : '#f43f5e'}
        />
        <text
          x={x + width / 2}
          y={y - 9}
          fill="#ffffff"
          textAnchor="middle"
          fontSize={10}
          fontWeight={800}
          fontFamily="monospace"
        >
          {labelText}
        </text>
      </g>
    );
  };

  const renderCustomXTick = ({ x, y, payload }) => {
    const matchedPoint = dynamicVolumeData.find((pt) => pt.date === payload?.value);
    const isSpike = Boolean(matchedPoint?.isSpike);
    return (
      <text
        x={x}
        y={y + 12}
        textAnchor="middle"
        fill={isSpike ? (isLight ? '#e11d48' : '#fb7185') : (isLight ? '#475569' : '#94a3b8')}
        fontSize={10}
        fontWeight={isSpike ? 800 : 500}
      >
        {payload?.value}
      </text>
    );
  };

  return (
    <div className={`space-y-4 font-inter ${isLight ? 'text-slate-800' : 'text-white'} tabular-nums`}>
      {/* UNIFIED EXECUTIVE CASE CARD -GLASSMORPHISM */}
      <div className={`${isLight ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300' : 'bg-[#00153A]/85 border-white/10 shadow-2xl shadow-[#00081c]/50 hover:border-white/20'} backdrop-blur-xl border rounded-2xl p-4 space-y-3 transition-all duration-300`}>
        {/* Row 1: Breadcrumb & Case Classification */}
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <div className={`flex items-center space-x-2 text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            <button 
              type="button"
              onClick={onBackToQueue}
              className={`${isLight ? 'text-slate-700 hover:text-emerald-700' : 'text-white/80 hover:text-emerald-400'} transition font-bold flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded`}
              aria-label="Kembali ke antrean triage kasus"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Antrean Triage</span>
            </button>
            <span className={isLight ? 'text-slate-300' : 'text-white/20'}>/</span>
            <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{currentCase.hospital}</span>
            <span className={isLight ? 'text-slate-300' : 'text-white/20'}>/</span>
            <span className={`font-mono px-2.5 py-0.5 rounded-lg border font-bold tabular-nums shadow-xs ${isLight ? 'text-emerald-800 bg-emerald-50 border-emerald-300' : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'}`}>
              {currentCase.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/10 text-white/80 border-white/15'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${effectiveLane === 'MERAH' ? 'bg-rose-500 animate-pulse' : effectiveLane === 'KUNING' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span>Penapisan Pra-Bayar · <strong className={effectiveLane === 'MERAH' ? (isLight ? 'text-rose-700 font-bold' : 'text-rose-400 font-bold') : effectiveLane === 'KUNING' ? (isLight ? 'text-amber-700 font-bold' : 'text-amber-300 font-bold') : (isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400 font-bold')}>Jalur {effectiveLane}</strong></span>
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border tabular-nums ${isLight ? 'text-slate-600 bg-slate-100 border-slate-200' : 'text-white/60 bg-white/5 border-white/10'}`}>
              SEP: {currentCase.sep}
            </span>
          </div>
        </div>

        {/* Row 2: Main Hospital Details & Score Badge */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-lg sm:text-xl font-display font-extrabold tracking-tight drop-shadow-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {currentCase.hospital}
              </h1>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-lg font-medium border ${isLight ? 'text-slate-700 bg-slate-100 border-slate-200' : 'text-white/70 bg-white/10 border-white/10'}`}>
                {currentCase.hospitalType}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs pt-1">
              {(() => {
                const cbgParts = String(currentCase.code || 'Z-3-12-0').split('-');
                const fkl20 = cbgParts[0] || 'Z';
                const fkl21 = cbgParts[1] || '3';
                const fkl23 = cbgParts[3] || '0';
                const icdRaw = String(rawClaim?.icd10_primary || '').toUpperCase();
                const isHardNegDiag = ['Z49.1', 'Z51.1', 'I69.3'].some((code) => icdRaw.includes(code));
                const boxCls = isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-white/5 border-white/10';
                return (
                  <>
                    <div className={`px-3 py-2 rounded-xl border ${boxCls}`}>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        INA-CBG · {fkl20}-{fkl21 === '4' ? 'RI' : 'RJ'} Lv.{fkl23}
                      </span>
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 mt-0.5">
                        <strong className={`font-mono text-xs whitespace-nowrap shrink-0 ${isLight ? 'text-slate-900' : 'text-white'}`}>{currentCase.code}</strong>
                        <span className={`font-mono font-bold text-xs tabular-nums whitespace-nowrap shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>{currentCase.tariff}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-2 rounded-xl border ${boxCls}`}>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        DPJP &amp; Layanan
                      </span>
                      <div className={`font-semibold truncate mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`} title={currentCase.dpjp}>
                        {currentCase.dpjp}
                      </div>
                    </div>
                    <div className={`px-3 py-2 rounded-xl border ${boxCls}`}>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        Tanggal &amp; Prosedur
                      </span>
                      <div className={`truncate mt-0.5 ${isLight ? 'text-slate-800' : 'text-white/90'}`} title={currentCase.description}>
                        <span className="font-mono font-semibold">{currentCase.date}</span> · {currentCase.description}
                      </div>
                    </div>
                    <div className={`px-3 py-2 rounded-xl border ${
                      effectiveLane === 'MERAH'
                        ? (isLight ? 'bg-rose-50/80 border-rose-200' : 'bg-rose-500/10 border-rose-500/30')
                        : effectiveLane === 'KUNING'
                        ? (isLight ? 'bg-amber-50/80 border-amber-200' : 'bg-amber-500/10 border-amber-500/30')
                        : (isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30')
                    }`}>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider block ${
                        effectiveLane === 'MERAH' ? (isLight ? 'text-rose-700' : 'text-rose-300') : effectiveLane === 'KUNING' ? (isLight ? 'text-amber-700' : 'text-amber-300') : (isLight ? 'text-emerald-700' : 'text-emerald-300')
                      }`}>
                        Rekomendasi Penapisan
                      </span>
                      <div className={`font-bold mt-0.5 truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {isHardNegDiag || sipStatus === 'UNSYNCED'
                          ? (sipStatus === 'UNSYNCED' ? 'Tunda Klarifikasi (FairGuard SIP)' : 'Layanan Kronis Terlindungi')
                          : effectiveLane === 'HIJAU'
                          ? 'Siap Layak Bayar (Fast-Track)'
                          : effectiveLane === 'KUNING'
                          ? 'Klarifikasi Dokumen FPK'
                          : 'Tahan Bayar · Wajib Audit'}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Right Action: Clean Refined Score Badge & Primary CTA */}
          <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
            <div className={`relative overflow-hidden rounded-2xl px-4 py-2 text-center backdrop-blur border ${isLight ? 'bg-slate-50 border-slate-200 shadow-xs' : 'bg-white/5 border-white/10 shadow-md'}`}>
              <span className={`text-[9.5px] font-bold uppercase tracking-widest block ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                Skor Anomali
              </span>
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span className={`text-2xl font-bold font-mono leading-none tabular-nums ${
                  effectiveLane === 'MERAH'
                    ? (isLight ? 'text-rose-700' : 'text-rose-400')
                    : effectiveLane === 'KUNING'
                    ? (isLight ? 'text-amber-700' : 'text-amber-300')
                    : (isLight ? 'text-emerald-700' : 'text-emerald-400')
                }`}>
                  {totalScore}
                </span>
                <span className={`text-[10px] font-bold tabular-nums ${isLight ? 'text-slate-400' : 'text-white/40'}`}>/ 100</span>
              </div>
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenDecision}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/20 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              aria-label="Tetapkan Putusan Verifikasi Klaim"
            >
              <Gavel className="w-4 h-4" />
              <span>Tetapkan Putusan Klaim</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* Row 3: SLA & Regulatory Reference */}
        <div className={`pt-2.5 border-t flex flex-wrap items-center justify-between text-xs gap-2 ${isLight ? 'border-slate-200 text-slate-700' : 'border-white/10 text-white/60'}`}>
          <div className={`flex items-center space-x-2 font-semibold ${isLight ? 'text-emerald-800' : 'text-amber-300'}`}>
            <Clock className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-amber-400'}`} />
            <span>Sisa Batas Waktu Verifikasi: <strong className={`tabular-nums font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>7 Hari Kerja</strong> <span className={isLight ? 'text-slate-600 font-normal' : 'text-white/60 font-normal'}>(Pasal 76 ayat 2 Perpres No. 82/2018)</span></span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Standar Pembuktian: Rekam Medis &amp; Presensi Faktual</span>
          </div>
        </div>
      </div>

      {/* VISUAL PROFIL RISIKO 4-LAPIS (RINGKAS & VISUAL-FIRST) */}
      <div className={`border rounded-2xl p-4 space-y-3 transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#00153A] border-white/10 shadow-lg'
      }`}>
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Profil Risiko Verifikasi Medis
              </h2>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                PMK 26/2021 · Perpres 82/2018 · Perbandingan Skor Lapis 1 - 4
              </p>
            </div>
          </div>

          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
            effectiveLane === 'MERAH'
              ? (isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/15 text-rose-300 border-rose-500/30')
              : effectiveLane === 'KUNING'
              ? (isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/15 text-amber-300 border-amber-500/30')
              : (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30')
          }`}>
            {effectiveLane === 'MERAH' ? 'Klarifikasi Faskes / Tunda Bayar' : effectiveLane === 'KUNING' ? 'Konfirmasi Dokumen' : 'Layak Lolos Verifikasi'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Grafik Batang Horizontal 4-Lapis */}
          <div className="lg:col-span-7 h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={[
                  { layer: 'Lapis 1 · Pola', score: Math.round(effS1) },
                  { layer: 'Lapis 2 · SDMK', score: Math.round(effS2) },
                  { layer: 'Lapis 3 · Mobile', score: Math.round(effS3) },
                  { layer: 'Skor Akhir', score: Math.round(Number(totalScore || 0)) },
                ]}
                margin={{ top: 2, right: 36, left: 8, bottom: 2 }}
              >
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="layer"
                  width={108}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: isLight ? '#334155' : '#cbd5e1', fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: isLight ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.04)' }}
                  formatter={(v) => [`${v} / 100`, 'Skor Anomali']}
                  contentStyle={{
                    borderRadius: 10,
                    fontSize: 11,
                    backgroundColor: isLight ? '#ffffff' : '#0E1116',
                    borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.15)',
                    color: isLight ? '#0f172a' : '#f8fafc',
                  }}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={16} isAnimationActive={false}>
                  {[effS1, effS2, effS3, totalScore].map((val, idx) => {
                    const n = Number(val || 0);
                    const fill = n >= 75 ? (isLight ? '#BE123C' : '#FB7185') : n >= 50 ? (isLight ? '#B45309' : '#FBBF24') : (isLight ? '#047857' : '#34D399');
                    return <Cell key={idx} fill={fill} />;
                  })}
                  <LabelList
                    dataKey="score"
                    position="right"
                    style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, fill: isLight ? '#0f172a' : '#f8fafc' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 3 Indikator Visual Cepat */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
            <div className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-white/60'}`}>Izin Praktik SIP</span>
              <span className={`text-xs font-bold ${sipStatus === 'EXPIRED' ? (isLight ? 'text-rose-700' : 'text-rose-400') : (isLight ? 'text-emerald-700' : 'text-emerald-400')}`}>
                {sipStatus === 'EXPIRED' ? 'Kadaluwarsa' : sipStatus === 'UNSYNCED' ? 'Perlu Sinkron' : 'Aktif Sah'}
              </span>
            </div>
            <div className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-white/60'}`}>Konfirmasi Peserta</span>
              <span className={`text-xs font-bold font-mono tabular-nums ${currentCase.deniedCount > 0 ? (isLight ? 'text-rose-700' : 'text-rose-400') : (isLight ? 'text-emerald-700' : 'text-emerald-400')}`}>
                {currentCase.deniedCount > 0 ? `${currentCase.deniedCount}/${currentCase.sampleCount} Menolak` : `${currentCase.sampleCount}/${currentCase.sampleCount} Hadir`}
              </span>
            </div>
            <div className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-white/60'}`}>Frekuensi Klaster</span>
              <span className={`text-xs font-bold font-mono tabular-nums ${spikeRatio >= 3 ? (isLight ? 'text-rose-700' : 'text-rose-400') : (isLight ? 'text-emerald-700' : 'text-emerald-400')}`}>
                {spikeRatio.toFixed(1)}x Baseline · {clusterVolume} SEP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-LAYER EVIDENCE MATRIX - CLINICAL FINDINGS PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* LAPIS 1: POLA TAGIHAN */}
        <div className={`${isLight ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300' : 'bg-[#00153A]/80 border-white/10 shadow-xl shadow-[#00081c]/40 hover:border-white/20'} backdrop-blur-md border rounded-2xl p-4 space-y-3 transition-all duration-300`}>
          <div className={`flex items-center justify-between border-b pb-2 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Lapis 1 · Radar Pola Tagihan
                </span>
                <span className={`text-[9.5px] font-medium block ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                  Pola Frekuensi &amp; Episode Klaim (Permenkes 26/2021)
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border whitespace-nowrap inline-block ${isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/10 text-white/80 border-white/15'}`}>
                Kaidah 1
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className={`p-2.5 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between text-[11px]">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Lonjakan Volume:</span>
                <span className={`font-semibold font-mono tabular-nums ${isLight ? 'text-slate-800' : 'text-white/90'}`}><strong className={spikeRatio >= 3 ? (isLight ? 'text-rose-700 font-bold' : 'text-rose-400 font-bold') : (isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400 font-bold')}>{spikeRatio.toFixed(1)}x</strong> Baseline Faskes</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Volume Klaster:</span>
                <span className={`font-semibold font-mono tabular-nums ${isLight ? 'text-slate-900' : 'text-white/90'}`}>{clusterVolume} klaim / klaster</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Pola Episode:</span>
                <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{isRepeatBilling ? 'Penagihan Berulang Episode' : isPhantomBilling ? 'Penagihan Massal Tanpa Jeda' : 'Layanan Terjadwal Wajar'}</span>
              </div>
            </div>

            {/* VOLUME HARIAN VS BASELINE (RECHARTS DUAL-MODE: BATANG & TREN - EXECUTIVE STANDARD) */}
            <div className={`p-3 rounded-xl border space-y-2.5 transition-all ${
              isLight
                ? 'bg-white border-slate-200 shadow-xs'
                : 'bg-[#000d28]/70 border-white/10 shadow-inner'
            }`}>
              {/* Header: Title, Subtitle, Toggle & Badge */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
                    Volume Harian vs Baseline
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 whitespace-nowrap shrink-0 ${
                    spikeRatio >= 3
                      ? (isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/10 text-rose-300 border-rose-500/30')
                      : (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30')
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${spikeRatio >= 3 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span>{spikeRatio.toFixed(1)}x Baseline</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    <span className={`inline-flex items-center gap-1 font-semibold ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
                      Baseline: {baselineVol} berkas
                    </span>
                    <span className="text-slate-300 dark:text-white/20">·</span>
                    <span className={`inline-flex items-center gap-1 font-bold ${spikeRatio >= 3 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${spikeRatio >= 3 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'} shrink-0`} />
                      Klaster: {clusterVolume} berkas
                    </span>
                  </div>

                  {/* Mode Toggle: Batang vs Tren */}
                  <div className={`p-0.5 rounded-lg border flex items-center text-[10px] font-semibold shrink-0 ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/10 border-white/10'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setVolumeViewType('bar')}
                      aria-label="Tampilkan visualisasi grafik batang volume klaim"
                      className={`px-2 py-0.5 rounded-md transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 ${
                        volumeViewType === 'bar'
                          ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-[#00153A] text-white font-bold shadow-xs'
                          : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Batang
                    </button>
                    <button
                      type="button"
                      onClick={() => setVolumeViewType('area')}
                      aria-label="Tampilkan visualisasi grafik tren area volume klaim"
                      className={`px-2 py-0.5 rounded-md transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 ${
                        volumeViewType === 'area'
                          ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-[#00153A] text-white font-bold shadow-xs'
                          : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Tren Area
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart SVG Canvas */}
              <div className="h-52 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  {volumeViewType === 'bar' ? (
                    <BarChart
                      data={dynamicVolumeData}
                      margin={{ top: 22, right: 10, left: -24, bottom: 2 }}
                    >
                      <defs>
                        <linearGradient id="anomalySpikeGradientLight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e11d48" stopOpacity={1} />
                          <stop offset="100%" stopColor="#be123c" stopOpacity={0.9} />
                        </linearGradient>
                        <linearGradient id="anomalySpikeGradientDark" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fb7185" stopOpacity={1} />
                          <stop offset="100%" stopColor="#e11d48" stopOpacity={0.9} />
                        </linearGradient>
                        <linearGradient id="normalVolumeGradientLight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#cbd5e1" stopOpacity={1} />
                          <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="normalVolumeGradientDark" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" stopOpacity={1} />
                          <stop offset="100%" stopColor="rgba(255,255,255,0.15)" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        stroke={isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)'}
                        tick={renderCustomXTick}
                        tickLine={false}
                        axisLine={{ stroke: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)' }}
                      />
                      <YAxis
                        stroke={isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)'}
                        domain={[0, 'auto']}
                        tick={{
                          fontSize: 9,
                          fill: isLight ? '#64748b' : 'rgba(255,255,255,0.4)',
                          fontFamily: 'monospace',
                        }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={<VolumeChartTooltip isLight={isLight} />}
                        cursor={false}
                      />
                      <Bar
                        dataKey="volume"
                        radius={[6, 6, 0, 0]}
                        barSize={30}
                        isAnimationActive={false}
                      >
                        {dynamicVolumeData.map((entry, index) => (
                          <Cell
                            key={`vol-cell-${index}`}
                            fill={
                              entry.isSpike
                                ? (isLight ? 'url(#anomalySpikeGradientLight)' : 'url(#anomalySpikeGradientDark)')
                                : (isLight ? 'url(#normalVolumeGradientLight)' : 'url(#normalVolumeGradientDark)')
                            }
                          />
                        ))}
                        <LabelList
                          dataKey="volume"
                          content={renderCustomBarLabel}
                        />
                      </Bar>
                    </BarChart>
                  ) : (
                    <AreaChart
                      data={dynamicVolumeData}
                      margin={{ top: 22, right: 10, left: -24, bottom: 2 }}
                    >
                      <defs>
                        <linearGradient id="volumeAreaGradientLight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e11d48" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#e11d48" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="volumeAreaGradientDark" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fb7185" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#fb7185" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        stroke={isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)'}
                        tick={renderCustomXTick}
                        tickLine={false}
                        axisLine={{ stroke: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)' }}
                      />
                      <YAxis
                        stroke={isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)'}
                        domain={[0, 'auto']}
                        tick={{
                          fontSize: 9,
                          fill: isLight ? '#64748b' : 'rgba(255,255,255,0.4)',
                          fontFamily: 'monospace',
                        }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={<VolumeChartTooltip isLight={isLight} />}
                        cursor={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke={isLight ? '#e11d48' : '#fb7185'}
                        strokeWidth={2}
                        fill={isLight ? 'url(#volumeAreaGradientLight)' : 'url(#volumeAreaGradientDark)'}
                        dot={false}
                        activeDot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Data Summary Grid Pill Row: Pristine, Non-Overlapping Digits */}
              <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-100 dark:border-white/10 text-center font-mono">
                {dynamicVolumeData.map((d) => (
                  <div
                    key={d.date}
                    className={`py-1 px-1 rounded-lg border transition ${
                      d.isSpike
                        ? isLight
                          ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                          : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-white/5 border-white/10 text-white/70'
                    }`}
                  >
                    <div className={`text-[11.5px] font-bold ${d.isSpike ? (isLight ? 'text-rose-700 font-extrabold' : 'text-rose-400 font-extrabold') : (isLight ? 'text-slate-900' : 'text-white')}`}>
                      {d.volume}
                    </div>
                    <div className={`text-[9px] ${d.isSpike ? (isLight ? 'text-rose-700 font-bold' : 'text-rose-300 font-bold') : (isLight ? 'text-slate-600' : 'text-white/50')}`}>
                      {d.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className={`text-[10.5px] leading-relaxed font-medium ${isLight ? 'text-slate-800' : 'text-white/60'}`}>
              {effectiveLane === 'HIJAU'
                ? `Terdeteksi ${clusterVolume} berkas dalam batas distribusi normal (${spikeRatio.toFixed(1)}x baseline) dan konsisten dengan riwayat pelayanan faskes.`
                : isRepeatBilling
                ? `Terdeteksi pengulangan episode ${clusterVolume} berkas (${spikeRatio.toFixed(1)}x baseline) dengan indikasi duplikasi kode atau pemecahan tagihan.`
                : `Analisis mendeteksi ${clusterVolume} klaim (${spikeRatio.toFixed(1)}x baseline) dengan deviasi volume atau keseragaman dokumentasi klinis.`}
            </p>
          </div>
        </div>

        {/* LAPIS 2: JEJAK SDMK */}
        <div className={`${isLight ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300' : 'bg-[#00153A]/80 border-white/10 shadow-xl shadow-[#00081c]/40 hover:border-white/20'} backdrop-blur-md border rounded-2xl p-4 space-y-3 transition-all duration-300`}>
          <div className={`flex items-center justify-between border-b pb-2 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Lapis 2 · Validasi SDMK
                </span>
                <span className={`text-[9.5px] font-medium block ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                  Status Izin Praktik DPJP (SATUSEHAT SDMK)
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border whitespace-nowrap inline-block ${isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/10 text-white/80 border-white/15'}`}>
                Kaidah 2
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className={`p-2.5 rounded-xl space-y-1 border ${isLight ? 'bg-slate-50 border-slate-200 shadow-xs' : 'bg-white/5 border-white/10 shadow-xs'}`}>
              <div className={`flex items-center space-x-1.5 font-bold text-[11px] ${
                sipStatus === 'EXPIRED' ? (isLight ? 'text-rose-700' : 'text-rose-400')
                : sipStatus === 'UNSYNCED' ? (isLight ? 'text-amber-700' : 'text-amber-300')
                : (isLight ? 'text-emerald-700' : 'text-emerald-400')
              }`}>
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>
                  {sipStatus === 'EXPIRED'
                    ? 'HARD-TRIGGER: SIP DPJP Kedaluwarsa'
                    : sipStatus === 'UNSYNCED'
                    ? 'SINKRONISASI: Profil SDMK Belum Tersinkron (Jalur Kuning)'
                    : 'VALID: SIP DPJP Terdaftar Aktif'}
                </span>
              </div>
              <p className={`text-[10.5px] leading-relaxed font-medium ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                {sipStatus === 'EXPIRED'
                  ? 'SATUSEHAT SDMK mendeteksi SIP DPJP telah kedaluwarsa pada tgl layanan -> otomatis masuk prioritas Jalur Merah.'
                  : sipStatus === 'UNSYNCED'
                  ? 'Sinkronisasi SATUSEHAT SDMK tertunda; sistem melarang vonis fraud Merah dan mengalihkan ke klarifikasi Jalur Kuning.'
                  : 'Izin praktik DPJP aktif pada tanggal layanan dan beban harian dalam koridor Permenkes 14/2021.'}
              </p>
            </div>

            <div className={`p-2.5 rounded-xl border space-y-1 text-[11px] ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>DPJP Tertera:</span>
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{currentCase.dpjp}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>No. SIP:</span>
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white/90'}`}>{currentCase.sipNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Status SATUSEHAT:</span>
                <span className={`font-bold ${
                  sipStatus === 'EXPIRED' ? (isLight ? 'text-rose-700' : 'text-rose-400')
                  : sipStatus === 'UNSYNCED' ? (isLight ? 'text-amber-700' : 'text-amber-300')
                  : (isLight ? 'text-emerald-700' : 'text-emerald-400')
                }`}>{sipStatus}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Volume Klaster:</span>
                <span className={`font-bold ${isLight ? 'text-emerald-800' : 'text-cyan-300'}`}>{clusterVolume} Berkas</span>
              </div>
            </div>

            <div className={`p-2 rounded-xl border text-[10px] space-y-0.5 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/60'}`}>
              <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-white/90'}`}>Rujukan Standar Permenkes 14/2021:</span>
              <p className="leading-relaxed font-medium">
                {effectiveLane === 'HIJAU'
                  ? `Beban layanan ${clusterVolume} berkas berada dalam koridor praktik klinis wajar (batas kapasitas 30-40 pasien/hari).`
                  : `Beban kerja maks 30-40 px/hari. Pengajuan ${clusterVolume} klaim (${spikeRatio.toFixed(1)}x baseline) memerlukan verifikasi rasio jam praktik DPJP.`}
              </p>
            </div>
          </div>
        </div>

        {/* LAPIS 3: KONFIRMASI PESERTA */}
        <div className={`rounded-2xl p-4 space-y-3 backdrop-blur-md border transition-all duration-300 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#00153A]/80 border-white/10 shadow-xl'
        }`}>
          <div className={`flex items-center justify-between border-b pb-2 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full shadow-md ${
                patientResponse === 'denied' ? 'bg-rose-500 shadow-rose-500/60' : 'bg-purple-500 shadow-purple-500/60'
              }`} />
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Lapis 3 · Konfirmasi Peserta
                </span>
                <span className={`text-[9.5px] font-medium block ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                  Presensi Pasien (Mobile JKN &amp; Biometrik FRISTA)
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border whitespace-nowrap inline-block ${isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/10 text-white/80 border-white/15'}`}>
                Kaidah 3
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {/* LIVE RESPONSE STATUS */}
            <div className={`p-2.5 rounded-xl border backdrop-blur-xs ${
              patientResponse === 'denied'
                ? isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white'
                : patientResponse === 'confirmed'
                ? isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                : isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className={isLight ? 'text-slate-700' : 'text-white/80'}>Hasil Konfirmasi Peserta:</span>
                <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <strong className={isLight ? 'text-rose-700 font-bold' : 'text-rose-400 font-bold'}>{currentCase.deniedCount}</strong> / {currentCase.sampleCount} Menyangkal
                </span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden mt-1.5 flex ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentCase.deniedCount / currentCase.sampleCount) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-rose-500 h-full" 
                />
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentCase.sampleCount - currentCase.deniedCount) / currentCase.sampleCount) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-emerald-500 h-full" 
                />
              </div>
            </div>

            {/* LIVE PARTICIPANTS VERIFICATION GRID (COMPACT 4 ITEMS) */}
            <div className={`p-2.5 rounded-xl border space-y-1.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <div className={`flex items-center justify-between text-[10.5px] ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>Konfirmasi Faktual:</span>
                <span className={`font-bold text-[10px] flex items-center gap-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Mobile JKN Live</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {verifiedParticipants.slice(0, 4).map((p) => (
                  <motion.div 
                    key={p.id}
                    whileHover={{ y: -1 }}
                    className={`p-1.5 rounded-lg border text-[10.5px] flex items-center justify-between transition ${
                      p.target 
                        ? isLight ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-800 shadow-xs' : 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200' 
                        : isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white/80'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {p.status === 'denied' || (p.target && patientResponse === 'denied') ? (
                      <XCircle className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
                    ) : p.status === 'confirmed' || (p.target && patientResponse === 'confirmed') ? (
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                    ) : (
                      <Clock className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* PRIVACY GROUNDING */}
            <div className={`p-2 rounded-xl border text-[10px] flex items-start space-x-2 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-white/60'}`}>
              <ShieldCheck className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span className="leading-relaxed">
                <strong className={isLight ? 'text-slate-800' : 'text-white/90'}>UU PDP No. 27/2022:</strong> Konfirmasi biner tanpa membocorkan data medis sensitif.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* LAPIS BUKTI KE-4 (QUAD-TRIANGULATION): TELEMETRI BIOMETRIK FRISTA & EKSPANSI MULTI-TIPOLOGI */}
      <div className={`${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#00153A]/85 border-white/10 shadow-2xl shadow-[#00081c]/50'} backdrop-blur-xl border rounded-2xl p-4 space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
              LAPIS 4 · QUAD-TRIANGULATION
            </span>
            <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Telemetri Biometrik FRISTA BPJS (Face + Sidik Jari) &amp; Deteksi Multi-Tipologi (Upcoding #4 · Unbundling #9)
            </h3>
          </div>
          {onOpenDocumentChecker && (
            <button
              type="button"
              onClick={onOpenDocumentChecker}
              aria-label="Buka kelengkapan 7 dokumen RS dan uji koding ICD-10"
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors duration-150 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <Layers className="size-3.5" />
              <span>Cek 7 Dokumen &amp; ICD-10</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className={`p-3 rounded-xl border ${
            effectiveLane === 'MERAH'
              ? (isLight ? 'bg-rose-50/70 border-rose-200' : 'bg-rose-500/10 border-rose-500/30')
              : effectiveLane === 'KUNING'
              ? (isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-amber-500/10 border-amber-500/30')
              : (isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30')
          }`}>
            <div className={`text-[10px] font-mono uppercase font-bold ${
              effectiveLane === 'MERAH' ? 'text-rose-600 dark:text-rose-300' : effectiveLane === 'KUNING' ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'
            }`}>Log Biometrik FRISTA SEP</div>
            <div className={`text-sm font-bold mt-1 font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {effectiveLane === 'MERAH'
                ? `${Math.min(99, Math.round((Math.max(1, currentCase.deniedCount) / Math.max(1, currentCase.sampleCount)) * 100))}% Anomali Bypass Liveness`
                : effectiveLane === 'KUNING'
                ? 'Menunggu Verifikasi FRISTA SEP'
                : '100% Liveness Terverifikasi'}
            </div>
            <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-700' : 'text-white/75'}`}>
              {effectiveLane === 'MERAH'
                ? `${currentCase.deniedCount}/${currentCase.sampleCount} peserta terkonfirmasi menyangkal kehadiran pada klaster ${clusterVolume} SEP tanpa liveness valid.`
                : effectiveLane === 'KUNING'
                ? `Log FRISTA pada ${currentCase.sep} perlu pencocokan ulang sidik jari/wajah bersama berkas FPK.`
                : `Otentikasi biometrik wajah/sidik jari pada SEP ${currentCase.sep} tercatat sah saat registrasi.`}
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
            <div className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-300">Audit Upcoding (Kode {currentCase.code})</div>
            <div className={`text-sm font-bold mt-1 font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {effectiveLane === 'MERAH' && !isRepeatBilling && !isPhantomBilling
                ? 'Terindikasi Eskalasi Severity'
                : effectiveLane === 'HIJAU'
                ? 'Tarif CBG Konsisten'
                : 'Dalam Uji Koding PMK 26/2021'}
            </div>
            <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
              {effectiveLane === 'HIJAU'
                ? `Tarif ${currentCase.tariff} (${currentCase.code}) sepadan dengan diagnosis ${rawClaim?.icd10_primary || 'klinis tercatat'}.`
                : `Audit kesesuaian kode ${currentCase.code} (${currentCase.tariff}) terhadap bukti lab, penunjang, dan resume medis.`}
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
            <div className="text-[10px] font-mono uppercase font-bold text-cyan-700 dark:text-cyan-300">Audit Unbundling &amp; Repeat (#11)</div>
            <div className={`text-sm font-bold mt-1 font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {isRepeatBilling ? 'Terdeteksi Duplikasi Episode' : effectiveLane === 'HIJAU' ? 'Tidak Ada Split Episode' : `${clusterVolume} Berkas Klaster Terpaut`}
            </div>
            <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
              {isRepeatBilling
                ? `Ditemukan kemiripan episode ${rawClaim?.episode_meta?.klaim_episode_sebelumnya_id || 'sebelumnya'} (selisih ${rawClaim?.episode_meta?.selisih_hari_admisi ?? 0} hari).`
                : effectiveLane === 'HIJAU'
                ? 'Tidak ada pemecahan kunjungan atau penagihan berulang pada NIK peserta yang sama.'
                : 'Pengujian keterkaitan antar-SEP satu NIK dan satu periode pelayanan guna mencegah arbitrase tarif.'}
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
            <div className="text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-emerald-300">Skor Inti Tri-Layer (0 - 100)</div>
            <div className={`text-lg font-extrabold mt-0.5 font-mono ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>{totalScore} / 100</div>
            <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-emerald-800' : 'text-emerald-200/80'}`}>
              0,50·S1 + 0,30·S2 + 0,20·S3 (+ Validasi FRISTA) · Jalur {effectiveLane} · Siap Cetak Berita Acara QR SHA-256.
            </p>
          </div>
        </div>
      </div>

      {/* CROSS-VALIDATION EVIDENCE TABLE - DARK GLASS TABLE */}
      <div className={`${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#00153A]/85 border-white/10 shadow-2xl shadow-[#00081c]/50'} backdrop-blur-xl border rounded-2xl p-4 space-y-3`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <FileText className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-cyan-400'}`} />
            <span>Matriks Sintesis Bukti Pra-Bayar (4-Layer Quad-Triangulation)</span>
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${isLight ? 'text-slate-700 bg-slate-100 border-slate-200' : 'text-white/50 bg-white/5 border-white/10'}`}>
            Protokol DSS BPJS Kesehatan
          </span>
        </div>

        <div className={`backdrop-blur-sm border rounded-xl overflow-hidden ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y text-left text-xs ${isLight ? 'divide-slate-200' : 'divide-white/10'}`}>
              <thead className={isLight ? 'bg-slate-100' : 'bg-black/30'}>
                <tr>
                  <th scope="col" className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Lapis Analisis</th>
                  <th scope="col" className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Indikator yang Diuji</th>
                  <th scope="col" className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Hasil Evaluasi</th>
                  <th scope="col" className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Tingkat Risiko</th>
                  <th scope="col" className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Kategori Pengawasan</th>
                  <th scope="col" className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Rujukan Regulasi</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-[11px] ${isLight ? 'divide-slate-100' : 'divide-white/10'}`}>
                <tr className={`${isLight ? 'hover:bg-slate-100/50' : 'hover:bg-white/5'} transition-colors`}>
                  <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>Lapis 1 (Pola)</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Analisis Klaster &amp; Repeat Billing</td>
                  <td className={`py-2.5 px-3 font-semibold font-mono ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{clusterVolume} klaim ({spikeRatio.toFixed(1)}x baseline) · S1={effS1}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${effS1 >= 70 ? (isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/30') : (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')}`}>{effS1 >= 70 ? 'TINGGI' : effS1 >= 45 ? 'SEDANG' : 'WAJAR'}</span>
                  </td>
                  <td className={`py-2.5 px-3 font-medium text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Kaidah Volume &amp; Episode</td>
                  <td className={`py-2.5 px-3 font-semibold font-mono ${isLight ? 'text-slate-800' : 'text-white/60'}`}>Permenkes 26/2021</td>
                </tr>
                <tr className={`${isLight ? 'hover:bg-slate-100/50' : 'hover:bg-white/5'} transition-colors`}>
                  <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-emerald-800' : 'text-cyan-400'}`}>Lapis 2 (Jejak)</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Validasi SATUSEHAT &amp; Beban Kerja</td>
                  <td className={`py-2.5 px-3 font-semibold font-mono ${isLight ? 'text-slate-800' : 'text-white/90'}`}>SIP {sipStatus}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${sipStatus === 'EXPIRED' ? (isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/30') : sipStatus === 'UNSYNCED' ? (isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/20 text-amber-300 border-amber-500/30') : (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')}`}>{sipStatus === 'EXPIRED' ? 'HARD-TRIGGER' : sipStatus === 'UNSYNCED' ? 'KLARIFIKASI' : 'VALID'}</span>
                  </td>
                  <td className={`py-2.5 px-3 font-medium text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Kaidah Izin Praktik DPJP</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-800' : 'text-white/60'}`}>Permenkes No. 14/2021</td>
                </tr>
                <tr className={`${isLight ? 'hover:bg-slate-100/50' : 'hover:bg-white/5'} transition-colors`}>
                  <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-purple-800' : 'text-purple-400'}`}>Lapis 3 (Peserta)</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Konfirmasi Kehadiran Mobile JKN</td>
                  <td className={`py-2.5 px-3 font-semibold font-mono ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                    {currentCase.deniedCount === 0
                      ? `${currentCase.sampleCount} dari ${currentCase.sampleCount} peserta mengonfirmasi hadir`
                      : `${currentCase.deniedCount} dari ${currentCase.sampleCount} peserta menyangkal`}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${
                      currentCase.deniedCount === 0
                        ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                        : (isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/30')
                    }`}>
                      {currentCase.deniedCount === 0 ? 'HADIR SAH' : 'KONFIRMATIF'}
                    </span>
                  </td>
                  <td className={`py-2.5 px-3 font-medium text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Kaidah Presensi Peserta</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-800' : 'text-white/60'}`}>UU PDP No. 27/2022</td>
                </tr>
                <tr className={`${isLight ? 'hover:bg-slate-100/50' : 'hover:bg-white/5'} transition-colors`}>
                  <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>Lapis 4 (FRISTA)</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Biometrik FRISTA &amp; Audit Upcoding/Unbundling</td>
                  <td className={`py-2.5 px-3 font-semibold font-mono ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                    {effectiveLane === 'MERAH'
                      ? `${currentCase.deniedCount}/${currentCase.sampleCount} konfirmasi peserta menyangkal tanpa biometrik liveness sah`
                      : effectiveLane === 'KUNING'
                      ? `Perlu klarifikasi kelengkapan FRISTA & berkas penunjang (${currentCase.sep})`
                      : `Biometrik FRISTA 3D Liveness & tarif ${currentCase.code} tervalidasi`}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${
                      effectiveLane === 'MERAH'
                        ? (isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/30')
                        : effectiveLane === 'KUNING'
                        ? (isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                        : (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                    }`}>
                      {effectiveLane === 'MERAH' ? 'BIOMETRIC FAIL' : effectiveLane === 'KUNING' ? 'VERIFIKASI ULANG' : 'TERVERIFIKASI'}
                    </span>
                  </td>
                  <td className={`py-2.5 px-3 font-mono text-[10px] font-bold ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>Kaidah Biometrik FRISTA</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-800' : 'text-white/60'}`}>SE BPJS FRISTA 2024</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PORTAL BERKAS DIGITAL e-DOSSIER, i-CARE LINTAS FASKES & KLAIM SUSULAN */}
      {claimDossier && (
        <div className={`${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#00153A]/85 border-white/10 shadow-2xl'} backdrop-blur-xl border rounded-2xl p-4 space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Layers className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-cyan-400'}`} />
              <div>
                <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Viewer Berkas Digital e-Dossier, Riwayat i-Care JKN &amp; Klaim Susulan
                </h3>
                <p className={`text-[10.5px] font-mono ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                  {claimDossier.fpk_metadata?.no_fpk} · {claimDossier.fpk_metadata?.jenis_pelayanan} · {claimDossier.fpk_metadata?.jenis_pengajuan} · Hak Kelas {claimDossier.fpk_metadata?.hak_kelas} &rarr; Rawat {claimDossier.fpk_metadata?.kelas_ditempati} · Daluwarsa: {claimDossier.fpk_metadata?.daluwarsa_date} ({claimDossier.fpk_metadata?.days_until_daluwarsa} hari lagi)
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
              {[
                { id: 'berkas', label: 'Berkas Digital (6)' },
                { id: 'icare', label: 'Riwayat i-Care Lintas Faskes' },
                { id: 'billing', label: 'Billing RS vs INA-CBG' },
                { id: 'susulan', label: `Klaim Susulan (${claimDossier.resubmission_timeline?.resubmission_count || 0})` },
                { id: 'adjudication', label: 'Verifikasi 2-Lapis & Putusan Manusia' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDossierSubTab(t.id)}
                  className={`px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                    dossierSubTab === t.id
                      ? (isLight ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-emerald-600 text-white border-emerald-500')
                      : (isLight ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' : 'bg-white/5 text-white/75 border-white/10 hover:bg-white/10')
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {dossierSubTab === 'berkas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {(claimDossier.dokumen_berkas_digital || []).map((doc) => (
                <div
                  key={doc.doc_code}
                  className={`p-3 rounded-xl border space-y-1.5 ${
                    doc.status === 'LENGKAP_VALID'
                      ? (isLight ? 'bg-emerald-50/40 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/25')
                      : doc.status === 'TIDAK_KONSISTEN'
                      ? (isLight ? 'bg-rose-50/60 border-rose-200' : 'bg-rose-500/10 border-rose-500/30')
                      : (isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-500/10 border-amber-500/30')
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{doc.doc_code}</span>
                      <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{doc.title}</div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold shrink-0 border ${
                      doc.status === 'LENGKAP_VALID'
                        ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35')
                        : doc.status === 'TIDAK_KONSISTEN'
                        ? (isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/35')
                        : (isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/35')
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  <ul className={`text-[10.5px] space-y-0.5 ${isLight ? 'text-slate-700' : 'text-white/75'}`}>
                    {(doc.highlights || []).map((hl, hIdx) => (
                      <li key={hIdx}>• {hl}</li>
                    ))}
                  </ul>
                  <div className={`text-[9.5px] font-mono pt-1 border-t truncate ${isLight ? 'border-slate-200/70 text-slate-500' : 'border-white/10 text-white/45'}`}>
                    {doc.signed_by} · SHA: {doc.hash_sha256}
                  </div>
                </div>
              ))}
            </div>
          )}

          {dossierSubTab === 'icare' && (
            <div className="space-y-2">
              <div className={`text-[11px] flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                <History className="w-3.5 h-3.5 text-emerald-600" />
                <span>Riwayat kunjungan lintas FKTP/FKRTL ter-pseudonimisasi (i-Care JKN) untuk deteksi readmisi &lt;= 30 hari &amp; duplikasi episode.</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`text-[10px] uppercase font-bold ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-black/30 text-white/65'}`}>
                    <tr>
                      <th scope="col" className="py-2 px-3">Tanggal</th>
                      <th scope="col" className="py-2 px-3">No. SEP / Rujukan</th>
                      <th scope="col" className="py-2 px-3">Faskes &amp; Tingkat Layanan</th>
                      <th scope="col" className="py-2 px-3">ICD-10 &amp; DPJP</th>
                      <th scope="col" className="py-2 px-3">Catatan Kontrol i-Care</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200 text-slate-800' : 'divide-white/10 text-white/85'}`}>
                    {(claimDossier.icare_history || []).map((ev, eIdx) => (
                      <tr key={eIdx}>
                        <td className="py-2 px-3 font-mono font-semibold">{ev.visit_date}</td>
                        <td className="py-2 px-3 font-mono">{ev.sep_no}</td>
                        <td className="py-2 px-3">
                          <div className="font-semibold">{ev.faskes}</div>
                          <div className="text-[10px] opacity-70">{ev.service_level}</div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-mono text-[11px]">{ev.icd10}</div>
                          <div className="text-[10px] opacity-70">{ev.dpjp}</div>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            ev.flag?.includes('RED FLAG') || ev.flag?.includes('ANOMALI')
                              ? (isLight ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/35')
                              : (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35')
                          }`}>
                            {ev.flag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {dossierSubTab === 'billing' && claimDossier.billing_reconciliation && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
              <div className={`p-3 rounded-xl border space-y-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/25 border-white/10'}`}>
                <div className="flex items-center gap-1.5 font-bold">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Rincian Billing Riil FKRTL ({claimDossier.fpk_metadata?.jenis_pelayanan})</span>
                </div>
                <div className="space-y-1.5">
                  {(claimDossier.billing_reconciliation.line_items || []).map((li, lIdx) => (
                    <div key={lIdx} className="flex items-center justify-between text-[11px] border-b border-dashed border-slate-300/60 dark:border-white/10 pb-1">
                      <span>{li.komponen}</span>
                      <span className="font-mono font-bold">Rp {Number(li.nilai_rp || 0).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between font-bold pt-1">
                  <span>Total Tarif RS Riil</span>
                  <span className="font-mono">Rp {Number(claimDossier.billing_reconciliation.tarif_rs_riil_rp || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl border space-y-2 ${isLight ? 'bg-emerald-50/40 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/25'}`}>
                <div className="font-bold">Rekonsiliasi Grouping INA-CBG &amp; Special CMG</div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>INA-CBG Diajukan vs Verified</span>
                    <span className="font-mono font-bold">{claimDossier.billing_reconciliation.ina_cbg_diajukan} &rarr; {claimDossier.billing_reconciliation.ina_cbg_verified}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FKL47 Biaya Tagih Paket INA-CBG</span>
                    <span className="font-mono font-bold">Rp {Number(claimDossier.billing_reconciliation.fkl47_biaya_tagih_rp || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FKL48 Tarif Disetujui Verifikator</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">Rp {Number(claimDossier.billing_reconciliation.fkl48_biaya_verifikasi_rp || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Selisih RS vs CBG / Koreksi Verifikasi</span>
                    <span className="font-mono font-bold">
                      Rp {Number(claimDossier.billing_reconciliation.selisih_rs_vs_cbg_rp || 0).toLocaleString('id-ID')} / Koreksi Rp {Number(claimDossier.billing_reconciliation.selisih_koreksi_verifikasi_rp || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-emerald-200/70 dark:border-white/10">
                    <span className="font-semibold">Special CMG Top-Up (SA/SP/RR/SI/SD): </span>
                    <span className="font-mono">
                      {(claimDossier.billing_reconciliation.special_cmg_list || []).length > 0
                        ? claimDossier.billing_reconciliation.special_cmg_list.join(', ')
                        : 'Tidak ada komponen Special CMG'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {dossierSubTab === 'susulan' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
              <div className="space-y-2">
                <div className="font-bold">Riwayat Umpan Balik FKRTL &amp; SLA Dispute ({claimDossier.resubmission_timeline?.dispute_sla?.label})</div>
                <div className={`text-[11px] p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-black/25 border-white/10 text-white/75'}`}>
                  Batas SE Diryan 51/2016: Koding {claimDossier.resubmission_timeline?.dispute_sla?.koding_hk} HK · Medis {claimDossier.resubmission_timeline?.dispute_sla?.medis_hk} HK · Forum: {claimDossier.resubmission_timeline?.dispute_sla?.forum}.
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(claimDossier.resubmission_timeline?.history || []).length === 0 ? (
                    <div className={`text-[11px] italic ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      Belum ada riwayat pengajuan ulang Klaim Susulan pada berkas ini.
                    </div>
                  ) : (claimDossier.resubmission_timeline?.history || []).map((h, hIdx) => (
                    <div key={hIdx} className={`p-2.5 rounded-xl border text-[11px] ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex justify-between font-mono font-bold text-[10px]">
                        <span>{h.action}</span>
                        <span>{String(h.timestamp || '').slice(0, 19).replace('T', ' ')}</span>
                      </div>
                      <p className="mt-1">{h.notes}</p>
                      <div className="text-[10px] opacity-70 mt-0.5">{h.actor}</div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSusulanResubmit} className={`p-3 rounded-xl border space-y-2.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/25 border-white/10'}`}>
                <div className="font-bold flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Terima Tanggapan FKRTL &amp; Rekam Klaim Susulan</span>
                </div>
                {resubmitMsg && (
                  <div className={`p-2 rounded-lg text-[11px] font-semibold border ${
                    resubmitMsg.tone === 'green'
                      ? (isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-500/20 border-emerald-500/35 text-emerald-100')
                      : (isLight ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-rose-500/20 border-rose-500/35 text-rose-100')
                  }`}>
                    {resubmitMsg.text}
                  </div>
                )}
                <textarea
                  id="ci-resubmit-notes"
                  name="catatan_faskes"
                  aria-label="Catatan klarifikasi Tim Casemix RS dan lampiran bukti klinis susulan"
                  required
                  rows={2}
                  value={resubmitForm.catatan_faskes}
                  onChange={(e) => setResubmitForm({ ...resubmitForm, catatan_faskes: e.target.value })}
                  placeholder="Catatan klarifikasi Tim Casemix RS & lampiran bukti klinis susulan..."
                  className={`w-full px-2.5 py-2 rounded-lg border text-xs ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/5 border-white/15 text-white'
                  }`}
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    id="ci-resubmit-icd10"
                    name="perbaikan_icd10"
                    aria-label="Revisi kode ICD-10"
                    type="text"
                    value={resubmitForm.perbaikan_icd10}
                    onChange={(e) => setResubmitForm({ ...resubmitForm, perbaikan_icd10: e.target.value })}
                    placeholder="Revisi ICD-10"
                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-mono ${isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/15 text-white'}`}
                  />
                  <input
                    id="ci-resubmit-cbg"
                    name="perbaikan_cbg"
                    aria-label="Revisi kode INA-CBG"
                    type="text"
                    value={resubmitForm.perbaikan_cbg}
                    onChange={(e) => setResubmitForm({ ...resubmitForm, perbaikan_cbg: e.target.value })}
                    placeholder="Revisi INA-CBG"
                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-mono ${isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/15 text-white'}`}
                  />
                  <input
                    id="ci-resubmit-tarif"
                    name="tarif_revisi_rp"
                    aria-label="Tarif klaim revisi (Rp)"
                    type="number"
                    min="0"
                    value={resubmitForm.tarif_revisi_rp}
                    onChange={(e) => setResubmitForm({ ...resubmitForm, tarif_revisi_rp: e.target.value })}
                    placeholder="Tarif Baru (Rp)"
                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-mono ${isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/15 text-white'}`}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-3">
                    <label htmlFor="ci-resubmit-frista" className="inline-flex items-center gap-1 cursor-pointer">
                      <input id="ci-resubmit-frista" name="dok_frista" type="checkbox" checked={resubmitForm.dok_frista} onChange={(e) => setResubmitForm({ ...resubmitForm, dok_frista: e.target.checked })} />
                      <span>Unggah FRISTA</span>
                    </label>
                    <label htmlFor="ci-resubmit-tte" className="inline-flex items-center gap-1 cursor-pointer">
                      <input id="ci-resubmit-tte" name="dok_tte" type="checkbox" checked={resubmitForm.dok_tte} onChange={(e) => setResubmitForm({ ...resubmitForm, dok_tte: e.target.checked })} />
                      <span>TTE BSrE DPJP</span>
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={resubmitBusy}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    {resubmitBusy ? 'Merekam Susulan...' : 'Ajukan Ulang Klaim Susulan'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {dossierSubTab === 'adjudication' && (
            <div className="space-y-4 text-xs">
              <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/10'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                    <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Koreksi &amp; Adjudikasi Manusia Nyata (Dual-Level Verification)
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                      adjudicationData?.current_status === 'PUTUSAN_FINAL_DISAHKAN'
                        ? (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                        : adjudicationData?.current_status === 'MENUNGGU_PENELAAH_TIER_2'
                        ? (isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-300' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30')
                        : (isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                    }`}>
                      {formatStatusLabel(adjudicationData?.current_status || 'MENUNGGU_TIER_1')}
                    </span>
                  </div>
                  <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    Sesuai Perpres 82/2018 &amp; Juknis Verifikasi BPJS Kesehatan: Sistem AI hanya berfungsi sebagai Decision Support System (DSS). Keputusan akhir mengikat berada di tangan Verifikator Medis dan Dokter Penelaah Senior.
                  </p>
                </div>
                {adjudicationData?.tier_2_record?.is_system_overridden && (
                  <div className={`px-2.5 py-1.5 rounded-lg border font-mono text-[10.5px] font-bold ${
                    isLight ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}>
                    HAK KOREKSI / OVERRIDE AKTIF: Putusan Sistem Dianulir Pejabat Penelaah
                  </div>
                )}
              </div>

              {adjudicationMsg && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold border ${
                  adjudicationMsg.tone === 'green'
                    ? (isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-500/20 border-emerald-500/35 text-emerald-100')
                    : (isLight ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-rose-500/20 border-rose-500/35 text-rose-100')
                }`}>
                  {adjudicationMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* TIER 1: VERIFIKATOR MEDIS PERTAMA */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono font-bold text-[11px] flex items-center justify-center">1</div>
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Tier 1: Verifikator Medis Pertama</span>
                    </div>
                    {adjudicationData?.tier_1_record?.is_completed ? (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'}`}>TERVERIFIKASI</span>
                    ) : (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'}`}>MENUNGGU TELAAH</span>
                    )}
                  </div>

                  {adjudicationData?.tier_1_record ? (
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="opacity-70">Pejabat Verifikator:</span>
                        <span className="font-semibold">{adjudicationData.tier_1_record.verifikator_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-70">NIP Pegawai:</span>
                        <span className="font-mono">{adjudicationData.tier_1_record.verifikator_nip}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-70">Waktu Verifikasi:</span>
                        <span className="font-mono">{String(adjudicationData.tier_1_record.review_timestamp || '').slice(0, 19).replace('T', ' ')}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-white/10">
                        <span className="font-semibold">Putusan Awal:</span>
                        <span className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] ${
                          adjudicationData.tier_1_record.preliminary_verdict === 'SETUJUI_LAYAK'
                            ? (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300')
                            : adjudicationData.tier_1_record.preliminary_verdict === 'DISPUTE_KODING'
                            ? (isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300')
                            : (isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/20 text-rose-300')
                        }`}>
                          {formatStatusLabel(adjudicationData.tier_1_record.preliminary_verdict)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/5 dark:bg-black/30 border border-slate-200 dark:border-white/10">
                        <span className="font-semibold block mb-0.5">Catatan Klinis Verifikator 1:</span>
                        <p>{adjudicationData.tier_1_record.clinical_notes}</p>
                      </div>
                      <div className="pt-1">
                        <span className="font-semibold text-[10.5px] block mb-1">Dokumen Fisik &amp; Digital yang Diperiksa:</span>
                        <div className="flex flex-wrap gap-1">
                          {(adjudicationData.tier_1_record.documents_verified || []).map((doc, dIdx) => (
                            <span key={dIdx} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleTier1Submit} className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="ci-tier1-verifikator-name" className="text-[10.5px] font-semibold block mb-0.5">Nama Verifikator</label>
                          <input
                            id="ci-tier1-verifikator-name"
                            name="verifikator_name"
                            type="text"
                            required
                            value={tier1Form.verifikator_name}
                            onChange={(e) => setTier1Form({ ...tier1Form, verifikator_name: e.target.value })}
                            className={`w-full px-2 py-1.5 rounded-lg border text-[11px] ${isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/15'}`}
                          />
                        </div>
                        <div>
                          <label htmlFor="ci-tier1-verifikator-nip" className="text-[10.5px] font-semibold block mb-0.5">NIP Verifikator</label>
                          <input
                            id="ci-tier1-verifikator-nip"
                            name="verifikator_nip"
                            type="text"
                            required
                            value={tier1Form.verifikator_nip}
                            onChange={(e) => setTier1Form({ ...tier1Form, verifikator_nip: e.target.value })}
                            className={`w-full px-2 py-1.5 rounded-lg border text-[11px] font-mono ${isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/15'}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="ci-tier1-verdict" className="text-[10.5px] font-semibold block mb-0.5">Putusan Awal Tier 1</label>
                        <select
                          id="ci-tier1-verdict"
                          name="verdict"
                          value={tier1Form.verdict}
                          onChange={(e) => setTier1Form({ ...tier1Form, verdict: e.target.value })}
                          className={`w-full px-2 py-1.5 rounded-lg border text-[11px] font-semibold ${isLight ? 'bg-white border-slate-300' : 'bg-[#00153A] border-white/15'}`}
                        >
                          <option value="SETUJUI_LAYAK">Setujui Layak (Lolos Uji Kelayakan)</option>
                          <option value="HOLD_KLARIFIKASI">Tahan Klarifikasi (Minta Berkas Tambahan)</option>
                          <option value="DISPUTE_KODING">Dispute Koding (Koreksi ICD/CBG)</option>
                          <option value="TOLAK_FRAUD">Tolak Klaim (Indikasi Kecurangan Kuat)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="ci-tier1-notes" className="text-[10.5px] font-semibold block mb-0.5">Catatan Klinis &amp; Hasil Uji Berkas</label>
                        <textarea
                          id="ci-tier1-notes"
                          name="clinical_notes"
                          rows={2}
                          required
                          value={tier1Form.clinical_notes}
                          onChange={(e) => setTier1Form({ ...tier1Form, clinical_notes: e.target.value })}
                          placeholder="Uraikan temuan pemeriksaan dokumen medis..."
                          className={`w-full px-2 py-1.5 rounded-lg border text-[11px] ${isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/15'}`}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={adjudicationBusy}
                        className="w-full py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {adjudicationBusy ? 'Menyimpan...' : 'Kirim Telaah Verifikator 1'}
                      </button>
                    </form>
                  )}
                </div>

                {/* TIER 2: DOKTER PENELAAH SENIOR / HAK KOREKSI */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-cyan-600 text-white font-mono font-bold text-[11px] flex items-center justify-center">2</div>
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Tier 2: Dokter Penelaah Senior (Hak Koreksi)</span>
                    </div>
                    {adjudicationData?.tier_2_record?.is_signed_off ? (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'}`}>DISAHKAN (SIGNED)</span>
                    ) : (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-500/20 text-cyan-300'}`}>MENUNGGU PENGESAHAN</span>
                    )}
                  </div>

                  {adjudicationData?.tier_2_record ? (
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="opacity-70">Dokter Penelaah:</span>
                        <span className="font-semibold">{adjudicationData.tier_2_record.reviewer_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-70">NIP Pejabat:</span>
                        <span className="font-mono">{adjudicationData.tier_2_record.reviewer_nip}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-70">Waktu Pengesahan:</span>
                        <span className="font-mono">{String(adjudicationData.tier_2_record.review_timestamp || '').slice(0, 19).replace('T', ' ')}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-white/10">
                        <span className="font-semibold">Putusan Akhir Manusia:</span>
                        <span className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] ${
                          adjudicationData.tier_2_record.is_system_overridden
                            ? (isLight ? 'bg-indigo-100 text-indigo-800' : 'bg-indigo-500/20 text-indigo-300')
                            : (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300')
                        }`}>
                          {formatStatusLabel(adjudicationData.tier_2_record.final_human_verdict)}
                        </span>
                      </div>
                      {adjudicationData.tier_2_record.is_system_overridden && (
                        <div className={`p-2.5 rounded-lg border text-[11px] space-y-1 ${
                          isLight ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950' : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-200'
                        }`}>
                          <div className="font-bold">Justifikasi Koreksi Putusan Sistem (Override):</div>
                          <p>{adjudicationData.tier_2_record.override_justification}</p>
                          <div className="text-[10px] font-mono pt-1">
                            <strong>Dasar Regulasi:</strong> {adjudicationData.tier_2_record.regulatory_justification}
                          </div>
                        </div>
                      )}
                      <div className="p-2.5 rounded-lg bg-black/5 dark:bg-black/30 border border-slate-200 dark:border-white/10">
                        <span className="font-semibold block mb-0.5">Catatan Second Opinion:</span>
                        <p>{adjudicationData.tier_2_record.second_opinion_notes}</p>
                      </div>
                      <div className="pt-1 text-[10px] font-mono break-all opacity-80">
                        <span>Digital Signature SHA-256: </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{adjudicationData.tier_2_record.digital_signature_hash}</span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleTier2Submit} className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="ci-tier2-reviewer-name" className="text-[10.5px] font-semibold block mb-0.5">Nama Dokter Penelaah</label>
                          <input
                            id="ci-tier2-reviewer-name"
                            name="reviewer_name"
                            type="text"
                            required
                            value={tier2Form.reviewer_name}
                            onChange={(e) => setTier2Form({ ...tier2Form, reviewer_name: e.target.value })}
                            className={`w-full px-2 py-1.5 rounded-lg border text-[11px] ${isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/15'}`}
                          />
                        </div>
                        <div>
                          <label htmlFor="ci-tier2-reviewer-nip" className="text-[10.5px] font-semibold block mb-0.5">NIP Penelaah Senior</label>
                          <input
                            id="ci-tier2-reviewer-nip"
                            name="reviewer_nip"
                            type="text"
                            required
                            value={tier2Form.reviewer_nip}
                            onChange={(e) => setTier2Form({ ...tier2Form, reviewer_nip: e.target.value })}
                            className={`w-full px-2 py-1.5 rounded-lg border text-[11px] font-mono ${isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/15'}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="ci-tier2-final-verdict" className="text-[10.5px] font-semibold block mb-0.5">Putusan Akhir Dokter Penelaah</label>
                        <select
                          id="ci-tier2-final-verdict"
                          name="final_verdict"
                          value={tier2Form.final_verdict}
                          onChange={(e) => setTier2Form({ ...tier2Form, final_verdict: e.target.value })}
                          className={`w-full px-2 py-1.5 rounded-lg border text-[11px] font-semibold ${isLight ? 'bg-white border-slate-300' : 'bg-[#00153A] border-white/15'}`}
                        >
                          <option value="SETUJUI_LAYAK">Setujui Layak (Persetujuan Penuh Hak Klaim)</option>
                          <option value="DISPUTE_KODING">Dispute Koding (Disetujui Penyesuaian Tarif/Recoding)</option>
                          <option value="HOLD_KLARIFIKASI">Tahan Klarifikasi (Klarifikasi Tim Wasrik/Faskes)</option>
                          <option value="TOLAK_FRAUD">Tolak Klaim (Penolakan Tetap Indikasi Fraud)</option>
                        </select>
                      </div>
                      <div className={`p-2 rounded-lg border space-y-1.5 ${isLight ? 'bg-indigo-50/40 border-indigo-200' : 'bg-indigo-500/10 border-indigo-500/25'}`}>
                        <label htmlFor="ci-tier2-override-check" className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold">
                          <input
                            id="ci-tier2-override-check"
                            name="is_overridden"
                            type="checkbox"
                            checked={tier2Form.is_overridden}
                            onChange={(e) => setTier2Form({ ...tier2Form, is_overridden: e.target.checked })}
                          />
                          <span>Hak Koreksi / Override Sistem (Anulir Rekomendasi AI)</span>
                        </label>
                        {tier2Form.is_overridden && (
                          <>
                            <textarea
                              id="ci-tier2-override-justification"
                              name="override_justification"
                              aria-label="Alasan klinis atau kasuistis menganulir rekomendasi awal sistem"
                              rows={2}
                              required
                              value={tier2Form.override_justification}
                              onChange={(e) => setTier2Form({ ...tier2Form, override_justification: e.target.value })}
                              placeholder="Alasan klinis/kasuistis menganulir rekomendasi awal sistem..."
                              className={`w-full px-2 py-1.5 rounded border text-[10.5px] ${isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/15'}`}
                            />
                            <input
                              id="ci-tier2-regulatory-justification"
                              name="regulatory_justification"
                              aria-label="Dasar regulasi override sistem"
                              type="text"
                              value={tier2Form.regulatory_justification}
                              onChange={(e) => setTier2Form({ ...tier2Form, regulatory_justification: e.target.value })}
                              placeholder="Dasar Regulasi (cth: Permenkes 26/2021)"
                              className={`w-full px-2 py-1 rounded border text-[10.5px] font-mono ${isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/15'}`}
                            />
                          </>
                        )}
                      </div>
                      <div>
                        <label htmlFor="ci-tier2-second-opinion" className="text-[10.5px] font-semibold block mb-0.5">Catatan Second Opinion Penelaah Senior</label>
                        <textarea
                          id="ci-tier2-second-opinion"
                          name="second_opinion_notes"
                          rows={2}
                          required
                          value={tier2Form.second_opinion_notes}
                          onChange={(e) => setTier2Form({ ...tier2Form, second_opinion_notes: e.target.value })}
                          placeholder="Pertimbangan medis final dokter penelaah..."
                          className={`w-full px-2 py-1.5 rounded-lg border text-[11px] ${isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/15'}`}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={adjudicationBusy}
                        className="w-full py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {adjudicationBusy ? 'Mengesahkan...' : 'Sahkan Putusan Final & TTE Digital (SHA-256)'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PANEL AUDIT KLINIS MENDALAM: CHARLSON CCI, UPCODING SEVERITY & KOHERENSI TEMPORAL */}
      <div className={`${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#00153A]/85 border-white/10 shadow-2xl'} backdrop-blur-xl border rounded-2xl p-4 space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Stethoscope className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
            <div>
              <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Audit Klinis &amp; Kaidah Koding INA-CBG (Permenkes 26/2021)
              </h3>
              <p className={`text-[10.5px] ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Evaluasi Indeks Komorbiditas Charlson (CCI), validasi severity level upcoding, dan kausalitas tanggal layanan {currentCase.id}.
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
            clinicalAudit.loading
              ? (isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-slate-300 border-white/15')
              : (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30')
          }`}>
            {clinicalAudit.loading ? 'Memuat Audit Klinis...' : 'Audit Klinis Tersinkron'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Card 1: Charlson Comorbidity Index */}
          <div className={`p-3 rounded-xl border space-y-2 ${
            isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Charlson Comorbidity Index (CCI)
              </span>
              <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded border tabular-nums ${
                (clinicalAudit.charlson?.charlson_score ?? 0) >= 3
                  ? (isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                  : (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
              }`}>
                Skor {clinicalAudit.charlson?.charlson_score ?? 0}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10.5px]">
              <div className={`p-2 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-black/20 border-white/10'}`}>
                <span className={`block ${isLight ? 'text-slate-600' : 'text-white/55'}`}>Level Beban</span>
                <strong className="font-mono">{clinicalAudit.charlson?.comorbidity_level || 'SANGAT_RENDAH'}</strong>
              </div>
              <div className={`p-2 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-black/20 border-white/10'}`}>
                <span className={`block ${isLight ? 'text-slate-600' : 'text-white/55'}`}>Survival 10-Thn</span>
                <strong className="font-mono tabular-nums">{clinicalAudit.charlson?.ten_year_survival_pct ?? 98.3}%</strong>
              </div>
            </div>
            <p className={`text-[10.5px] leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/75'}`}>
              {clinicalAudit.charlson?.clinical_description || 'Evaluasi profil ICD-10 primer dan sekunder peserta aktif.'}
            </p>
            {Array.isArray(clinicalAudit.charlson?.detected_comorbidities) && clinicalAudit.charlson.detected_comorbidities.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {clinicalAudit.charlson.detected_comorbidities.slice(0, 3).map((c) => (
                  <span key={c.category} className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border ${
                    isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-200'
                  }`}>
                    {c.matched_code}: {c.label} (+{c.weight})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Upcoding Severity Detector */}
          <div className={`p-3 rounded-xl border space-y-2 ${
            clinicalAudit.upcoding?.upcoding_suspected
              ? (isLight ? 'bg-rose-50/70 border-rose-200' : 'bg-rose-500/10 border-rose-500/30')
              : (isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-white/5 border-white/10')
          }`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Audit Upcoding Severity INA-CBG
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                clinicalAudit.upcoding?.upcoding_suspected
                  ? (isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/40')
                  : (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
              }`}>
                {clinicalAudit.upcoding?.upcoding_suspected
                  ? `INDIKASI UPCODING (${clinicalAudit.upcoding.confidence_pct}%)`
                  : `SESUAI (TIER ${clinicalAudit.upcoding?.claimed_severity_tier ?? 1})`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10.5px]">
              <div className={`p-2 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-black/20 border-white/10'}`}>
                <span className={`block ${isLight ? 'text-slate-600' : 'text-white/55'}`}>Kode &amp; Tier CBG</span>
                <strong className="font-mono">{clinicalAudit.upcoding?.ina_cbg_code || currentCase.code}</strong>
              </div>
              <div className={`p-2 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-black/20 border-white/10'}`}>
                <span className={`block ${isLight ? 'text-slate-600' : 'text-white/55'}`}>Lama Rawat (LOS)</span>
                <strong className="font-mono tabular-nums">
                  {clinicalAudit.upcoding?.length_of_stay_days === 0
                    ? '0 hari (Rawat Jalan RJTL)'
                    : `${clinicalAudit.upcoding?.length_of_stay_days ?? 1} hari`}
                </strong>
              </div>
            </div>
            <p className={`text-[10.5px] leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/75'}`}>
              {Array.isArray(clinicalAudit.upcoding?.reasons) && clinicalAudit.upcoding.reasons.length > 0
                ? clinicalAudit.upcoding.reasons[0]
                : (clinicalAudit.upcoding?.recommendation || 'Kaidah koding tingkat keparahan selaras dengan profil komorbiditas klinis.')}
            </p>
          </div>

          {/* Card 3: Temporal Coherence Validation */}
          <div className={`p-3 rounded-xl border space-y-2 ${
            clinicalAudit.temporal && !clinicalAudit.temporal.is_coherent
              ? (isLight ? 'bg-rose-50/70 border-rose-200' : 'bg-rose-500/10 border-rose-500/30')
              : (isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-white/5 border-white/10')
          }`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Koherensi Kronologi Episode
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                clinicalAudit.temporal && !clinicalAudit.temporal.is_coherent
                  ? (isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/40')
                  : (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
              }`}>
                {clinicalAudit.temporal && !clinicalAudit.temporal.is_coherent
                  ? `INVERSI (${clinicalAudit.temporal.severity})`
                  : 'KRONOLOGI KOHEREN'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10.5px]">
              <div className={`p-2 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-black/20 border-white/10'}`}>
                <span className={`block ${isLight ? 'text-slate-600' : 'text-white/55'}`}>Admisi Layanan</span>
                <strong className="font-mono tabular-nums">{clinicalAudit.temporal?.admission_date || currentCase.date}</strong>
              </div>
              <div className={`p-2 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-black/20 border-white/10'}`}>
                <span className={`block ${isLight ? 'text-slate-600' : 'text-white/55'}`}>Pulang Episode</span>
                <strong className="font-mono tabular-nums">{clinicalAudit.temporal?.discharge_date || currentCase.date}</strong>
              </div>
            </div>
            <p className={`text-[10.5px] leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/75'}`}>
              {Array.isArray(clinicalAudit.temporal?.violations) && clinicalAudit.temporal.violations.length > 0
                ? clinicalAudit.temporal.violations[0]
                : 'Urutan tanggal pendaftaran, pelaksanaan tindakan klinis, dan pemulangan peserta terverifikasi valid.'}
            </p>
          </div>
        </div>
      </div>

      {/* KERTAS KERJA PEMERIKSAAN VERIFIKATOR (6 KAIDAH PENGAWASAN KLAIM) */}
      <div className={`${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#00153A]/85 border-white/10 shadow-2xl'} backdrop-blur-xl border rounded-2xl p-4 space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
            <div>
              <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Kertas Kerja Verifikator (6 Kaidah Administratif &amp; Klinis)
              </span>
              <span className={`text-[10.5px] ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                Centang kelengkapan berkas {currentCase.id} sebelum putusan final · Tersinkron ke audit trail.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {checklistNotice && (
              <span className={`text-[10.5px] font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                {checklistNotice}
              </span>
            )}
            <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
              checkedCount === 6
                ? (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                : (isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
            }`}>
              {checkedCount} / 6 Kaidah Terpenuhi {checklistSaving ? '(Menyimpan...)' : ''}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {AUDIT_CHECKLIST_META.map((item) => {
            const isChecked = Boolean(caseChecklist[item.key]);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleToggleChecklistItem(item.key)}
                className={`text-left p-3 rounded-xl border transition flex items-start gap-2.5 cursor-pointer ${
                  isChecked
                    ? (isLight ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100/70' : 'bg-emerald-500/10 border-emerald-500/35 hover:bg-emerald-500/20')
                    : (isLight ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-100/60' : 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20')
                }`}
              >
                <span className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                  isChecked
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : (isLight ? 'bg-white border-rose-400 text-rose-600' : 'bg-black/30 border-rose-400 text-rose-300')
                }`}>
                  {isChecked ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                </span>
                <div className="min-w-0">
                  <div className={`text-[11px] font-bold leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {item.label}
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${
                    isChecked
                      ? (isLight ? 'text-emerald-700' : 'text-emerald-300')
                      : (isLight ? 'text-rose-700' : 'text-rose-300')
                  }`}>
                    {isChecked ? 'TERPENUHI' : 'PERLU KLARIFIKASI'} · {item.rule}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className={`flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl p-3 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#00153A]/90 border-white/10 shadow-2xl'}`}>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onBackToQueue}
          className={`text-xs font-semibold flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${isLight ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200' : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'}`}
          aria-label="Kembali ke antrean kasus"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Antrean</span>
        </motion.button>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenDocumentChecker && (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenDocumentChecker}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer border shadow-xs ${
                isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300' : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
              <span>Cek 7 Dokumen RS</span>
            </motion.button>
          )}

          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            disabled={cypherBusy}
            onClick={handleExportCypher}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer border shadow-xs disabled:opacity-60 ${isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-white/10 hover:bg-white/15 text-white border-white/15'}`}
          >
            <GitBranch className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-cyan-400'}`} />
            <span>{cypherBusy ? 'Mengekspor Cypher...' : 'Ekspor Graf Neo4j (.cypher)'}</span>
          </motion.button>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenDecision}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white flex items-center space-x-2 transition shadow-md shadow-emerald-900/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Tindak Lanjut Konsol Keputusan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
