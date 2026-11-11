import React, { useState, useEffect } from 'react';
import { API_BASE_URL, authFetch, getCachedJsonSync, cachedAuthGetJson } from '../../services/apiConfig';
import { motion, AnimatePresence } from 'motion/react';
import TemporalAlertCard from './TemporalAlertCard';
import { 
  ChevronRight, ArrowLeft, AlertTriangle, ShieldCheck, 
  Clock, Hospital, Stethoscope, UserCheck, AlertOctagon,
  TrendingUp, FileText, CheckCircle2, XCircle, Share2, 
  ExternalLink, Info, Activity, GitBranch, ArrowRight, Lock, Check,
  Bot, Zap, ShieldAlert, Sparkles, Cpu
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

const volumeChartData = [
  { date: '11 Okt', volume: 10, isSpike: false },
  { date: '12 Okt', volume: 12, isSpike: false },
  { date: '13 Okt', volume: 8, isSpike: false },
  { date: '14 Okt', volume: 85, isSpike: true },
  { date: '15 Okt', volume: 11, isSpike: false },
];

function VolumeChartTooltip({ active, payload, isLight }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs shadow-xl backdrop-blur-md ${
      isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/60' : 'bg-[#00153A] border-white/10 text-white shadow-2xl'
    }`}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className={`font-semibold ${isLight ? 'text-slate-500' : 'text-white/60'}`}>{data.date} 2026</span>
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
      <p className={`text-[10px] flex items-center justify-between gap-4 mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
        <span>Baseline Faskes:</span>
        <span className="font-mono font-medium">10 berkas/hari</span>
      </p>
      {data.isSpike && (
        <div className="mt-1.5 pt-1 border-t border-rose-100 dark:border-white/10 text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>Lonjakan 8.5x di atas kapasitas wajar</span>
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
  onOpenGraph,
  onOpenDecision,
  onOpenAgentCopilot,
  onOpenExpansionSuite,
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

  const VEDIKA_CHECKLIST_META = [
    { key: 'sep_valid', label: '1. Kelengkapan SEP & Eligibilitas JKN', rule: 'Perpres 82/2018 Pasal 46' },
    { key: 'resume_medis', label: '2. Resume Medis & Otorisasi DPJP', rule: 'PMK 24/2022 Rekam Medis' },
    { key: 'penunjang_klinis', label: '3. Bukti Lab / Radiologi / Terapi Sah', rule: 'Panduan Audit VEDIKA' },
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
          verifier_id: 'VERIF-VEDIKA-01',
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

  const checkedCount = VEDIKA_CHECKLIST_META.filter((m) => Boolean(caseChecklist[m.key])).length;

  const clusterVolume = Number(rawClaim?.episode_meta?.jumlah_klaim_klaster ?? currentCase.claimCount ?? 85);
  const spikeRatio = Number(rawClaim?.episode_meta?.rasio_lonjakan_baseline ?? 8.5);
  const baselineVol = Math.max(1, Math.round(clusterVolume / Math.max(spikeRatio, 1)));
  const dynamicVolumeData = [
    { date: 'H-3', volume: baselineVol, isSpike: false },
    { date: 'H-2', volume: Math.max(1, baselineVol + 2), isSpike: false },
    { date: 'H-1', volume: Math.max(1, baselineVol - 1), isSpike: false },
    { date: 'Tgl Klaim', volume: clusterVolume, isSpike: spikeRatio >= 3.0 },
    { date: 'H+1', volume: Math.max(1, baselineVol + 1), isSpike: false },
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

  const aiAnomalyCategory = liveAi?.primary_anomaly_category
    ? (categoryNames[liveAi.primary_anomaly_category] || liveAi.primary_anomaly_category)
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
        { label: 'Kemiripan Semantik Resume Medis ChromaDB', pct: 28.2, val: '98.4% Cosine Match (>= 90%)', anomalous: true },
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
      ? 'Tahan Pembayaran Pra-Bayar (Jalur Merah) · Terbitkan Berita Acara Klarifikasi Bersama (BAKB)'
      : effectiveLane === 'KUNING'
      ? 'Minta Klarifikasi Dokumen / Sinkronisasi SDMK Faskes (Jalur Kuning)'
      : 'Lolos Cepat Vedika Digital (Jalur Hijau < 24 Jam)');

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
    { id: 'PST-77218902', name: 'Ahmad Syafiq (Peserta Fiktif)', status: patientResponse === 'denied' ? 'denied' : patientResponse === 'confirmed' ? 'confirmed' : 'pending_denied', target: true },
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
    const item = volumeChartData[index];
    if (!item?.isSpike) return null;
    return (
      <g>
        <rect
          x={x + width / 2 - 14}
          y={y - 21}
          width={28}
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
          85
        </text>
      </g>
    );
  };

  const renderCustomXTick = ({ x, y, payload }) => {
    const isSpike = payload?.value === '14 Okt';
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
              <h1 className={`text-lg sm:text-xl font-bold tracking-tight drop-shadow-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {currentCase.hospital}
              </h1>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-lg font-medium border ${isLight ? 'text-slate-700 bg-slate-100 border-slate-200' : 'text-white/70 bg-white/10 border-white/10'}`}>
                {currentCase.hospitalType}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`font-semibold px-2.5 py-1 rounded-xl border ${isLight ? 'text-slate-800 bg-slate-50 border-slate-200' : 'text-white/90 bg-white/5 border-white/10'}`}>
                INA-CBG <strong className={`tabular-nums font-mono ${isLight ? 'text-amber-800' : 'text-[#FFCA40]'}`}>{currentCase.code}</strong>: <span className={isLight ? 'text-slate-600 font-normal' : 'text-white/70 font-normal'}>{currentCase.description}</span>
              </span>
              <span className={`font-bold px-2.5 py-1 rounded-xl font-mono tabular-nums shadow-xs border ${isLight ? 'text-emerald-800 bg-emerald-50 border-emerald-300' : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'}`}>
                {currentCase.tariff}
              </span>
              <span className={`px-2.5 py-1 rounded-xl border ${isLight ? 'text-slate-700 bg-slate-50 border-slate-200' : 'text-white/70 bg-white/5 border-white/10'}`}>
                Tanggal: <strong className={`font-mono tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>{currentCase.date}</strong>
              </span>
              <span className={`px-2.5 py-1 rounded-xl border ${isLight ? 'text-slate-700 bg-slate-50 border-slate-200' : 'text-white/70 bg-white/5 border-white/10'}`}>
                DPJP: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{currentCase.dpjp}</strong>
              </span>
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
              aria-label="Eksekusi Berita Acara Klarifikasi Bersama"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Eksekusi BAKB</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* Row 3: SLA & AI Copilot Inline Strip */}
        <div className={`pt-2.5 border-t flex flex-wrap items-center justify-between text-xs gap-2 ${isLight ? 'border-slate-200 text-slate-700' : 'border-white/10 text-white/60'}`}>
          <div className={`flex items-center space-x-2 font-semibold ${isLight ? 'text-emerald-800' : 'text-amber-300'}`}>
            <Clock className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-amber-400'}`} />
            <span>Sisa Batas Verifikasi: <strong className={`tabular-nums font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>7 Hari Kerja</strong> <span className={isLight ? 'text-slate-600 font-normal' : 'text-white/60 font-normal'}>(Pasal 76 ayat 2 Perpres No. 82/2018)</span></span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenAgentCopilot}
              className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none border shadow-xs ${isLight ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300' : 'text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30'}`}
              aria-label="Buka AI Agent ReAct Copilot untuk investigasi mendalam"
            >
              <Bot className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
              <span>AI Agent ReAct Copilot: <strong className={isLight ? 'text-emerald-950' : 'text-white'}>Phantom &amp; Repeat Billing</strong></span>
              <ArrowRight className={`w-3 h-3 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* AI AUTOMATIC ANOMALY DETECTION ENGINE PANEL */}
      <div className={`${isLight ? 'bg-gradient-to-r from-emerald-50/80 via-white to-cyan-50/80 border-emerald-200/80 shadow-md' : 'bg-gradient-to-r from-[#00173d]/90 via-[#001b44]/80 to-[#001330]/90 border-emerald-500/30 shadow-2xl shadow-emerald-950/20'} backdrop-blur-xl border rounded-2xl p-4 space-y-3.5 transition-all duration-300`}>
        {/* Header Bar */}
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${isLight ? 'border-emerald-100' : 'border-white/10'}`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Deteksi Anomali Klaim Otomatis Berbasis Artificial Intelligence
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}`}>
                  AI Model Active v2.4
                </span>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Ensemble: Isolation Forest (Scikit-Learn) · ChromaDB Semantic Vector (MiniLM) · Spatiotemporal Graph Traversal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${isLight ? 'bg-white text-slate-700 border-slate-200' : 'bg-white/5 text-white/80 border-white/10'}`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Otomasi Pra-Bayar (Pre-Payment Realtime)</span>
            </span>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Card 1: AI Anomaly Score */}
          <div className={`p-3 rounded-xl border space-y-1 ${isLight ? 'bg-white/80 border-slate-200 shadow-2xs' : 'bg-white/5 border-white/10'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Skor Anomali AI
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-mono tabular-nums ${aiAnomalyScore >= 75 ? (isLight ? 'text-rose-700' : 'text-rose-400') : (isLight ? 'text-emerald-700' : 'text-emerald-400')}`}>
                {aiAnomalyScore}%
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${aiAnomalyScore >= 75 ? (isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/20 text-rose-300') : (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300')}`}>
                {aiAnomalyScore >= 75 ? 'OUTLIER KRITIS' : 'NORMAL'}
              </span>
            </div>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Unsupervised Isolation Forest
            </p>
          </div>

          {/* Card 2: Confidence */}
          <div className={`p-3 rounded-xl border space-y-1 ${isLight ? 'bg-white/80 border-slate-200 shadow-2xs' : 'bg-white/5 border-white/10'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Tingkat Keyakinan Model
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-mono tabular-nums ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>
                {aiConfidenceScore}%
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-500/20 text-cyan-300'}`}>
                TINGGI
              </span>
            </div>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Cross-Validated 10 Fitur
            </p>
          </div>

          {/* Card 3: Detected Archetype */}
          <div className={`p-3 rounded-xl border space-y-1 sm:col-span-2 ${isLight ? 'bg-white/80 border-slate-200 shadow-2xs' : 'bg-white/5 border-white/10'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Klasifikasi Modus Anomali Otomatis
            </span>
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-4 h-4 shrink-0 ${aiAnomalyScore >= 75 ? (isLight ? 'text-rose-600' : 'text-rose-400') : (isLight ? 'text-emerald-600' : 'text-emerald-400')}`} />
              <span className={`text-xs font-bold leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {aiAnomalyCategory}
              </span>
            </div>
            <p className={`text-[10.5px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              {aiRecommendation}
            </p>
          </div>
        </div>

        {/* Explainable AI (XAI) Feature Importance Drivers */}
        <div className={`p-3 rounded-xl border space-y-2 ${isLight ? 'bg-white/60 border-slate-200' : 'bg-black/20 border-white/10'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>Dekomposisi Kontribusi Fitur Anomali (Explainable AI · XAI)</span>
            </span>
            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              SHAP-equivalent Feature Attribution
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {aiDrivers.map((driver, dIdx) => (
              <div key={dIdx} className="space-y-1">
                <div className="flex justify-between text-[10.5px]">
                  <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                    {driver.label}
                  </span>
                  <span className="font-mono font-bold tabular-nums">
                    <strong className={driver.anomalous ? (isLight ? 'text-rose-700' : 'text-rose-400') : (isLight ? 'text-emerald-700' : 'text-emerald-400')}>
                      {driver.val}
                    </strong>
                    <span className={`ml-1.5 text-[9.5px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      (+{driver.pct}%)
                    </span>
                  </span>
                </div>
                <div className={`h-1.5 w-full rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${driver.anomalous ? (isLight ? 'bg-rose-500' : 'bg-rose-400') : (isLight ? 'bg-emerald-500' : 'bg-emerald-400')}`}
                    style={{ width: `${driver.pct * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Clinical AI Rationale Callout */}
          <div className={`mt-2 p-2.5 rounded-lg border text-[11px] leading-relaxed flex items-start gap-2 ${isLight ? 'bg-emerald-50/70 border-emerald-200 text-slate-800' : 'bg-emerald-500/10 border-emerald-500/20 text-white/90'}`}>
            <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
            <div>
              <strong className={isLight ? 'text-emerald-950 font-bold' : 'text-emerald-300 font-bold'}>
                Rasional Deteksi AI Otomatis:
              </strong>{' '}
              <span>{aiRationale}</span>
            </div>
          </div>
        </div>
      </div>

      {/* JEJAK PENYARINGAN 4 TAHAP KLAIM INI (DECISION TRACE) */}
      <div className={`${isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#00153A]/85 border-white/10'} border rounded-2xl p-4 space-y-2.5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Cara Sistem Menyaring Klaim Ini (Jejak Keputusan 4 Tahap · Skala 0 - 100)
          </span>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
            effectiveLane === 'MERAH'
              ? (isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/15 text-rose-300 border-rose-500/30')
              : effectiveLane === 'KUNING'
              ? (isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/15 text-amber-300 border-amber-500/30')
              : (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30')
          }`}>
            Hasil Akhir: Jalur {effectiveLane} ({totalScore} / 100)
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
          {screeningTraceSteps.map((st) => (
            <div key={st.step} className={`p-3 rounded-xl border text-[11px] space-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold">{st.title}</span>
              </div>
              <span className={`inline-block text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                st.passed
                  ? (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300')
                  : (isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/20 text-rose-300')
              }`}>
                {st.status}
              </span>
              <p className={`text-[10.5px] leading-snug ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                {st.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* LAST30DAYS TEMPORAL REGULATORY RADAR CARD */}
      <TemporalAlertCard
        claimId={currentCase.id}
        cbgCode={currentCase.code}
        primaryDiagnosis={currentCase.primaryDiagnosis || (currentCase.code?.startsWith('H') ? 'H25.9' : currentCase.code?.startsWith('Z') ? 'K92.2' : 'K92.2')}
        isLight={isLight}
      />

      {/* 3-LAYER EVIDENCE MATRIX - GLASS PANELS */}
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
                <span className={`text-[9.5px] font-mono font-bold block ${isLight ? 'text-emerald-800' : 'text-[#FFCA40]'}`}>
                  MITRE F3: FA0002.F1018 (Unbundling Arbitrage)
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold font-mono tabular-nums ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>S1: {effS1}</span>
              <span className={`text-[9.5px] block tabular-nums font-semibold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Bobot 50% = +{weightedS1}</span>
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

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold">
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
              <div className="h-44 w-full pt-1">
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
                {volumeChartData.map((d) => (
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
                    <div className={`text-[9px] ${d.isSpike ? (isLight ? 'text-rose-600 font-bold' : 'text-rose-300 font-bold') : (isLight ? 'text-slate-500' : 'text-white/40')}`}>
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
                <span className={`text-[9.5px] font-mono font-bold block ${isLight ? 'text-emerald-800' : 'text-cyan-300'}`}>
                  MITRE ATT&amp;CK: T1078 · F3: FA0001
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>S2: {effS2}</span>
              <span className={`text-[9.5px] block font-semibold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Bobot 30% = +{weightedS2}</span>
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
                <span className={`text-[9.5px] font-mono font-bold block ${isLight ? 'text-purple-800' : 'text-purple-300'}`}>
                  MITRE F3: FA0001.F1005 · D3FEND: D3-MFA
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                S3: {effS3}
              </span>
              <span className={`text-[9.5px] block font-semibold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Bobot 20% = +{weightedS3}</span>
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
          {onOpenExpansionSuite && (
            <button
              type="button"
              onClick={onOpenExpansionSuite}
              aria-label="Buka Suite Ekspansi 4 Pilar FRISTA, Upcoding, RAG, dan QR PDF"
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors duration-150 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <Sparkles className="size-3.5" />
              <span>Buka Suite Ekspansi 4 Pilar (FRISTA · Upcoding · RAG · QR PDF)</span>
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
                ? `${currentCase.deniedCount}/${currentCase.sampleCount} sampel peserta menyangkal kehadiran pada klaster ${clusterVolume} SEP tanpa liveness valid.`
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
                  <th className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Lapis Analisis</th>
                  <th className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Indikator yang Diuji</th>
                  <th className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Hasil Evaluasi</th>
                  <th className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Tingkat Risiko</th>
                  <th className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>TTP Kerangka Kerja (F3 · ATT&amp;CK · NIST)</th>
                  <th className={`py-2.5 px-3 text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-800' : 'text-white/70'}`}>Rujukan Regulasi</th>
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
                  <td className={`py-2.5 px-3 font-mono text-[10px] font-bold ${isLight ? 'text-emerald-900' : 'text-[#FFCA40]'}`}>F3: FA0002.F1018 · NIST: DE.CM-01</td>
                  <td className={`py-2.5 px-3 font-semibold font-mono ${isLight ? 'text-slate-800' : 'text-white/60'}`}>Permenkes 26/2021</td>
                </tr>
                <tr className={`${isLight ? 'hover:bg-slate-100/50' : 'hover:bg-white/5'} transition-colors`}>
                  <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-emerald-800' : 'text-cyan-400'}`}>Lapis 2 (Jejak)</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Validasi SATUSEHAT &amp; Beban Kerja</td>
                  <td className={`py-2.5 px-3 font-semibold font-mono ${isLight ? 'text-slate-800' : 'text-white/90'}`}>SIP {sipStatus} · S2={effS2}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${sipStatus === 'EXPIRED' ? (isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/30') : sipStatus === 'UNSYNCED' ? (isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/20 text-amber-300 border-amber-500/30') : (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')}`}>{sipStatus === 'EXPIRED' ? 'HARD-TRIGGER' : sipStatus === 'UNSYNCED' ? 'KLARIFIKASI' : 'VALID'}</span>
                  </td>
                  <td className={`py-2.5 px-3 font-mono text-[10px] font-bold ${isLight ? 'text-emerald-900' : 'text-cyan-300'}`}>ATT&amp;CK: T1078 · NIST: PR.AC-01</td>
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
                  <td className={`py-2.5 px-3 font-mono text-[10px] font-bold ${isLight ? 'text-purple-900' : 'text-purple-300'}`}>F3: FA0001.F1005 · D3FEND: D3-MFA</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-800' : 'text-white/60'}`}>UU PDP No. 27/2022</td>
                </tr>
                <tr className={`${isLight ? 'hover:bg-slate-100/50' : 'hover:bg-white/5'} transition-colors`}>
                  <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>Lapis 4 (FRISTA)</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Biometrik FRISTA &amp; Audit Upcoding/Unbundling</td>
                  <td className={`py-2.5 px-3 font-semibold font-mono ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                    {effectiveLane === 'MERAH'
                      ? `${currentCase.deniedCount}/${currentCase.sampleCount} sampel anomali tanpa biometrik liveness sah`
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
                  <td className={`py-2.5 px-3 font-mono text-[10px] font-bold ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>D3FEND: D3-BA · ISO 30107-3</td>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-slate-800' : 'text-white/60'}`}>SE BPJS FRISTA 2024</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* KERTAS KERJA PEMERIKSAAN VERIFIKATOR (6 KAIDAH VEDIKA) */}
      <div className={`${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#00153A]/85 border-white/10 shadow-2xl'} backdrop-blur-xl border rounded-2xl p-4 space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
            <div>
              <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Kertas Kerja Verifikator (6 Kaidah Administratif &amp; Klinis VEDIKA)
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
          {VEDIKA_CHECKLIST_META.map((item) => {
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

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenGraph}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer border shadow-xs ${isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-white/10 hover:bg-white/15 text-white border-white/15'}`}
          >
            <GitBranch className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-cyan-400'}`} />
            <span>Topologi Graf Relasi</span>
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
