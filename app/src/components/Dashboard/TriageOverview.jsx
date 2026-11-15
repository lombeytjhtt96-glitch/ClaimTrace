import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, authFetch, getCachedJsonSync, cachedAuthGetJson } from '../../services/apiConfig';
import { motion } from 'motion/react';
import { 
  AlertOctagon, CheckCircle2, Clock, ChevronRight, 
  Search, ShieldCheck, CheckSquare, Square, PlusCircle, Download, Check, X,
  UserCheck, Layers
} from 'lucide-react';

const SIMULATE_PRESETS = [
  {
    id: 'baksos_sah',
    label: 'Baksos Katarak Resmi (Harus HIJAU)',
    payload: {
      nama_faskes: 'RS Khusus Mata Nusantara',
      kelas_rs: 'B',
      ina_cbg_code: 'H-2-36-0',
      deskripsi_cbg: 'Prosedur Operasi Katarak (Baksos Terdaftar Resmi)',
      icd10_primary: 'H25.9 (Senile Cataract)',
      icd9cm_procedure: '13.41 (Phacoemulsification)',
      nilai_klaim_rp: 4200000,
      dpjp_name: 'dr. Linda Kusuma, Sp.M',
      sip_status: 'ACTIVE',
      rasio_lonjakan_baseline: 4.5,
      jumlah_klaim_klaster: 42,
      terdaftar_baksos_resmi: true,
      indikasi_repeat_billing: false,
      mobile_sampel_terkirim: 10,
      mobile_respon_hadir: 10,
      mobile_respon_tidak_hadir: 0,
    },
  },
  {
    id: 'phantom_baksos',
    label: 'Phantom Billing Baksos Fiktif (#6 · MERAH)',
    payload: {
      nama_faskes: 'RS Khusus Rehabilitasi Sentosa',
      kelas_rs: 'C',
      ina_cbg_code: 'Z-3-12-0',
      deskripsi_cbg: 'Prosedur Fisioterapi Massal Tanpa Rujukan',
      icd10_primary: 'M54.5 (Low Back Pain)',
      icd9cm_procedure: '93.39 (Physical Therapy)',
      nilai_klaim_rp: 18400000,
      dpjp_name: 'dr. Ahmad Fauzi, Sp.KFR',
      sip_status: 'EXPIRED',
      rasio_lonjakan_baseline: 7.8,
      jumlah_klaim_klaster: 78,
      terdaftar_baksos_resmi: false,
      indikasi_repeat_billing: false,
      mobile_sampel_terkirim: 10,
      mobile_respon_hadir: 2,
      mobile_respon_tidak_hadir: 8,
    },
  },
  {
    id: 'sdmk_unsynced',
    label: 'SDMK Belum Sinkron (Anti-False Positive -> KUNING)',
    payload: {
      nama_faskes: 'RSUD Daerah Harapan',
      kelas_rs: 'B',
      ina_cbg_code: 'I-4-10-I',
      deskripsi_cbg: 'Rawat Inap Kardiologi Ringan (SIP Dalam Sinkronisasi)',
      icd10_primary: 'I10 (Essential Hypertension)',
      icd9cm_procedure: '89.52 (Electrocardiogram)',
      nilai_klaim_rp: 5900000,
      dpjp_name: 'dr. Rina Amelia, Sp.JP',
      sip_status: 'UNSYNCED',
      rasio_lonjakan_baseline: 1.5,
      jumlah_klaim_klaster: 6,
      terdaftar_baksos_resmi: false,
      indikasi_repeat_billing: false,
      mobile_sampel_terkirim: 6,
      mobile_respon_hadir: 6,
      mobile_respon_tidak_hadir: 0,
    },
  },
  {
    id: 'repeat_billing',
    label: 'Repeat / Split Billing Hari Sama (#11 · MERAH)',
    payload: {
      nama_faskes: 'RS Utama Medika Jaya',
      kelas_rs: 'B',
      ina_cbg_code: 'K-1-10-II',
      deskripsi_cbg: 'Duplikasi Klaim Episode Rawat Inap Saluran Cerna',
      icd10_primary: 'K92.2 (GI Hemorrhage)',
      icd9cm_procedure: '45.13 (Endoscopy)',
      nilai_klaim_rp: 24750000,
      dpjp_name: 'dr. Bambang H., Sp.PD',
      sip_status: 'ACTIVE',
      rasio_lonjakan_baseline: 4.2,
      jumlah_klaim_klaster: 18,
      terdaftar_baksos_resmi: false,
      indikasi_repeat_billing: true,
      klaim_episode_sebelumnya_id: 'CLM-2026-8801',
      selisih_hari_admisi: 0,
      mobile_sampel_terkirim: 8,
      mobile_respon_hadir: 3,
      mobile_respon_tidak_hadir: 5,
    },
  },
  {
    id: 'hard_negative_hd',
    label: 'Hemodialisis Rutin RS Kelas A (Z49.1 · FairGuard -> HIJAU)',
    payload: {
      nama_faskes: 'RSUPN Dr. Cipto Mangunkusumo',
      kelas_rs: 'A',
      ina_cbg_code: 'N-3-15-0',
      deskripsi_cbg: 'Prosedur Hemodialisis Kronis Terjadwal RS Rujukan',
      icd10_primary: 'Z49.1 (Extracorporeal dialysis)',
      icd9cm_procedure: '39.95 (Hemodialysis)',
      nilai_klaim_rp: 2950000,
      dpjp_name: 'dr. Hartono, Sp.PD-KGH',
      sip_status: 'ACTIVE',
      rasio_lonjakan_baseline: 3.1,
      jumlah_klaim_klaster: 48,
      terdaftar_baksos_resmi: false,
      indikasi_repeat_billing: false,
      mobile_sampel_terkirim: 10,
      mobile_respon_hadir: 10,
      mobile_respon_tidak_hadir: 0,
    },
  },
  {
    id: 'hard_negative_kemo',
    label: 'Kemoterapi Terjadwal RS Tipe B (Z51.1 · FairGuard -> HIJAU)',
    payload: {
      nama_faskes: 'RS Kanker Dharmais Regional',
      kelas_rs: 'B',
      ina_cbg_code: 'C-4-11-I',
      deskripsi_cbg: 'Sesi Kemoterapi Neoadjuvan Terjadwal',
      icd10_primary: 'Z51.1 (Antineoplastic chemotherapy)',
      icd9cm_procedure: '99.25 (Injection of chemotherapeutic substance)',
      nilai_klaim_rp: 8400000,
      dpjp_name: 'dr. Ratna Sari, Sp.PD-KHOM',
      sip_status: 'ACTIVE',
      rasio_lonjakan_baseline: 2.8,
      jumlah_klaim_klaster: 24,
      terdaftar_baksos_resmi: false,
      indikasi_repeat_billing: false,
      mobile_sampel_terkirim: 8,
      mobile_respon_hadir: 8,
      mobile_respon_tidak_hadir: 0,
    },
  },
];

const formatDecisionStatus = (statusCode, lane = 'green') => {
  if (lane === 'red') {
    if (statusCode === 'override' || statusCode === 'DISETUJUI_DENGAN_CATATAN') {
      return { label: 'DISETUJUI (BAHV)', tone: 'green' };
    }
    if (statusCode === 'TIDAK_LAYAK_FRAUD' || statusCode === 'AUDIT_LAPANGAN' || statusCode === 'DITOLAK') {
      return { label: 'TAHAN FRAUD', tone: 'red' };
    }
    if (statusCode === 'PENDING_KLARIFIKASI' || statusCode === 'KLARIFIKASI_FASKES') {
      return { label: 'PENDING', tone: 'amber' };
    }
    if (statusCode === 'DISPUTE_TKMKB') {
      return { label: 'DISPUTE TKMKB', tone: 'purple' };
    }
    return { label: 'TAHAN FRAUD', tone: 'red' };
  }
  if (!statusCode) {
    if (lane === 'yellow') return { label: 'PERLU KLARIFIKASI', tone: 'amber' };
    return { label: 'SIAP VERIFIKASI', tone: 'slate' };
  }
  switch (statusCode) {
    case 'LAYAK_BAYAR':
    case 'LOLOSKAN_KLAIM':
    case 'DISETUJUI':
      return { label: 'LAYAK BAYAR', tone: 'green' };
    case 'PENDING_KLARIFIKASI':
    case 'KLARIFIKASI_FASKES':
      return { label: 'PENDING', tone: 'amber' };
    case 'DISPUTE_TKMKB':
      return { label: 'DISPUTE TKMKB', tone: 'purple' };
    case 'TIDAK_LAYAK_FRAUD':
    case 'AUDIT_LAPANGAN':
    case 'DITOLAK':
      return { label: 'TAHAN FRAUD', tone: 'red' };
    default:
      return { label: 'MENUNGGU TELAAH', tone: 'slate' };
  }
};

export default function TriageOverview({ onSelectCase, isLight: propIsLight, initialSearchQuery = '' }) {
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

  const mapLiveClaimsSafe = (rawList) => (Array.isArray(rawList) ? rawList : []).map((entry) => {
    const { claim, triage, checklist, pending_reasons, sla_deadline_days } = entry;
    const laneCode = triage?.triage_lane === 'MERAH' ? 'red' : triage?.triage_lane === 'KUNING' ? 'yellow' : 'green';
    const flags = [];
    const addFlag = (tag) => {
      if (tag && !flags.includes(tag)) flags.push(tag);
    };
    addFlag(triage?.ai_anomaly_prediction?.primary_anomaly_category);
    if (claim.dpjp_meta?.sip_status === 'EXPIRED') addFlag('SIP_EXPIRED');
    if (claim.episode_meta?.indikasi_repeat_billing) addFlag('REPEAT_BILLING');
    if (claim.mobile_meta?.status_konfirmasi === 'ANOMALY_DENIED') addFlag('MOBILE_DENIED');
    if (flags.length === 0) addFlag(triage?.triage_lane === 'HIJAU' ? 'GREEN_VERIFIED' : 'REVIEW_REQUIRED');
    return {
      id: claim.claim_id,
      sep: claim.fkl02_id_kunjungan || claim.claim_id,
      hospital: claim.nama_faskes,
      date: claim.tanggal_layanan,
      code: claim.ina_cbg_code,
      description: (claim.deskripsi_cbg || '').replace(/\s*\(Permenkes[^)]*\)/gi, '').trim(),
      dpjp: claim.dpjp_meta?.nama_dpjp_alias || '-',
      tariff: `Rp ${Number(claim.nilai_klaim_rp || 0).toLocaleString('id-ID')}`,
      claimCount: claim.episode_meta?.jumlah_klaim_klaster || 1,
      s1: Math.round(claim.s1_score ?? triage?.score_breakdown?.s1_value ?? 0),
      s2: Math.round(claim.s2_score ?? triage?.score_breakdown?.s2_value ?? 0),
      s3: Math.round(claim.s3_score ?? triage?.score_breakdown?.s3_value ?? 0),
      totalScore: Number(triage?.final_priority_score ?? triage?.raw_weighted_score ?? 0),
      lane: laneCode,
      flags,
      statusVerifikasi: claim.status_verifikasi,
      checklist: checklist || null,
      pendingReasons: Array.isArray(pending_reasons) ? pending_reasons : [],
      slaDays: sla_deadline_days ?? triage?.sla_deadline_days ?? (laneCode === 'red' ? 3 : laneCode === 'yellow' ? 5 : 2),
      noFpk: claim.no_fpk || 'FPK-2026-001',
      bulanPelayanan: claim.bulan_pelayanan || String(claim.tanggal_layanan || '').slice(0, 7),
      jenisPelayanan: claim.jenis_pelayanan || ((claim.fkl10_tingkat_layanan || '').toUpperCase().includes('RJTL') ? 'RJTL' : 'RITL'),
      jenisPengajuan: claim.jenis_pengajuan || 'Reguler',
      assignedVerifierNip: claim.assigned_verifier_nip || '',
      assignedVerifierName: claim.assigned_verifier_name || 'Belum Di-plot',
      fkl48BiayaVerifikasi: claim.fkl48_biaya_verifikasi ?? claim.nilai_klaim_rp,
      inaCbgVerified: claim.ina_cbg_verified || claim.ina_cbg_code,
      resubmissionCount: Number(claim.resubmission_count || 0),
      fristaVerified: claim.frista_verified !== false,
      tteDpjpValid: claim.tte_dpjp_valid !== false,
      daluwarsaDate: claim.daluwarsa_date || '',
      rawClaim: claim,
      rawTriage: triage,
    };
  });

  const claimsUrl = `${API_BASE_URL}/api/v1/claims`;
  const statsUrl = `${API_BASE_URL}/api/v1/system/national-scale-metrics`;
  const pipelineUrl = `${API_BASE_URL}/api/v1/screening/pipeline-summary`;
  const verifsUrl = `${API_BASE_URL}/api/v1/auth/verificators`;
  const cachedClaimsRaw = getCachedJsonSync(claimsUrl);
  const cachedStatsRaw = getCachedJsonSync(statsUrl);
  const cachedPipelineRaw = getCachedJsonSync(pipelineUrl);

  const [activeLane, setActiveLane] = useState('all'); // 'all' | 'red' | 'yellow' | 'green'
  const [activeModus, setActiveModus] = useState('all'); // 'all' | 'PHANTOM' | 'REPEAT' | 'SIP' | 'MOBILE' | 'UPCODING'
  const [activeServiceLevel, setActiveServiceLevel] = useState('all'); // 'all' | 'RJTL' | 'RITL'
  const [activeSubmissionType, setActiveSubmissionType] = useState('all'); // 'all' | 'Reguler' | 'Susulan' | 'LUPIS'
  const [activeFpkFilter, setActiveFpkFilter] = useState('all');
  const [activePlottingFilter, setActivePlottingFilter] = useState('all');
  const [verificatorsList, setVerificatorsList] = useState(() => getCachedJsonSync(verifsUrl) || []);
  const [batchPlotNip, setBatchPlotNip] = useState('198704202011012001');
  const [showFpkPullModal, setShowFpkPullModal] = useState(false);
  const [fpkPullForm, setFpkPullForm] = useState({
    no_fpk: '',
    bulan_pelayanan: '2026-11',
    jenis_pengajuan: 'Reguler',
    jenis_pelayanan: 'ALL',
    nama_faskes: '',
    jumlah_klaim: 2,
    auto_plot: true,
  });
  const [fpkPullSubmitting, setFpkPullSubmitting] = useState(false);
  const [fpkPullResult, setFpkPullResult] = useState(null);
  const [showThresholdRules, setShowThresholdRules] = useState(false);
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [ingestForm, setIngestForm] = useState(() => ({ ...SIMULATE_PRESETS[0].payload, add_to_queue: true, simulate_llm_timeout: false }));
  const [ingestSubmitting, setIngestSubmitting] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);
  const [capVerifiers, setCapVerifiers] = useState(1);
  const [capPerDay, setCapPerDay] = useState(5);
  const [capacityPriorityOnly, setCapacityPriorityOnly] = useState(false);
  const [capacityReport, setCapacityReport] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [queueToast, setQueueToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [selectedFaskes, setSelectedFaskes] = useState('all');
  const [liveClaims, setLiveClaims] = useState(() => cachedClaimsRaw ? mapLiveClaimsSafe(cachedClaimsRaw) : []);
  const [portfolioStats, setPortfolioStats] = useState(() => cachedStatsRaw?.window_metrics || cachedStatsRaw?.portfolio_metrics || null);
  const [pipelineSummary, setPipelineSummary] = useState(() => cachedPipelineRaw || null);
  const [isLoadingClaims, setIsLoadingClaims] = useState(() => !cachedClaimsRaw);

  const reloadClaimsQueue = useCallback(async () => {
    try {
      const res = await authFetch(claimsUrl);
      if (res.ok) {
        const raw = await res.json();
        setLiveClaims(mapLiveClaimsSafe(raw));
      }
    } catch (err) {
      console.error('Gagal memuat ulang antrean:', err);
    } finally {
      setIsLoadingClaims(false);
    }
  }, [claimsUrl]);

  useEffect(() => {
    let active = true;
    const loadIndependent = async () => {
      if (!getCachedJsonSync(claimsUrl)) setIsLoadingClaims(true);
      cachedAuthGetJson(claimsUrl).then((rawList) => {
        if (rawList && active) setLiveClaims(mapLiveClaimsSafe(rawList));
      }).finally(() => {
        if (active) setIsLoadingClaims(false);
      });
      cachedAuthGetJson(pipelineUrl).then((pipeData) => {
        if (pipeData && active) setPipelineSummary(pipeData);
      });
      cachedAuthGetJson(statsUrl).then((statsData) => {
        if (statsData && active) setPortfolioStats(statsData?.window_metrics || statsData?.portfolio_metrics || null);
      });
      cachedAuthGetJson(verifsUrl).then((vList) => {
        if (Array.isArray(vList) && active) setVerificatorsList(vList);
      });
    };
    loadIndependent();
    return () => { active = false; };
  }, [claimsUrl, statsUrl, pipelineUrl, verifsUrl]);

  useEffect(() => {
    let active = true;
    const safeV = Math.max(1, Math.min(50, Number(capVerifiers) || 1));
    const safeC = Math.max(1, Math.min(50, Number(capPerDay) || 5));
    authFetch(`${API_BASE_URL}/api/v1/healthkathon/credible-evidence?verifiers=${safeV}&cases_per_day=${safeC}&working_days=10`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setCapacityReport(data);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [capVerifiers, capPerDay]);

  useEffect(() => {
    if (!queueToast) return;
    const t = setTimeout(() => setQueueToast(null), 4000);
    return () => clearTimeout(t);
  }, [queueToast]);

  useEffect(() => {
    if (typeof initialSearchQuery === 'string') {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const redCount = liveClaims.filter(c => c.lane === 'red').length;
  const yellowCount = liveClaims.filter(c => c.lane === 'yellow').length;
  const greenCount = liveClaims.filter(c => c.lane === 'green').length;
  const totalQueueCount = liveClaims.length;
  const redPct = totalQueueCount ? ((redCount / totalQueueCount) * 100).toFixed(1) : '0.0';
  const yellowPct = totalQueueCount ? ((yellowCount / totalQueueCount) * 100).toFixed(1) : '0.0';
  const greenPct = totalQueueCount ? ((greenCount / totalQueueCount) * 100).toFixed(1) : '0.0';
  const uniqueFaskesOptions = Array.from(new Set(liveClaims.map(c => c.hospital).filter(Boolean)));
  const uniqueFpkOptions = Array.from(new Set(liveClaims.map(c => c.noFpk).filter(Boolean))).sort();

  const filteredClaims = liveClaims.filter(c => {
    const matchesLane = activeLane === 'all' || c.lane === activeLane;
    const matchesFaskes = selectedFaskes === 'all' || c.hospital.toLowerCase().includes(selectedFaskes.toLowerCase());
    const matchesService = activeServiceLevel === 'all' || c.jenisPelayanan === activeServiceLevel;
    const matchesSubmission = activeSubmissionType === 'all' || c.jenisPengajuan === activeSubmissionType;
    const matchesFpk = activeFpkFilter === 'all' || c.noFpk === activeFpkFilter;
    const matchesPlotting =
      activePlottingFilter === 'all' ||
      (activePlottingFilter === 'UNASSIGNED' ? !c.assignedVerifierNip : c.assignedVerifierNip === activePlottingFilter);
    const joinedFlags = `${c.flags.join(' ')} ${(c.rawTriage?.kode_indikator || []).join(' ')}`.toUpperCase();
    const matchesModus =
      activeModus === 'all' ||
      (activeModus === 'PHANTOM' && (joinedFlags.includes('PHANTOM') || joinedFlags.includes('IND-L1-06') || joinedFlags.includes('COPYPASTE'))) ||
      (activeModus === 'REPEAT' && (joinedFlags.includes('REPEAT') || joinedFlags.includes('IND-L1-11'))) ||
      (activeModus === 'SIP' && (joinedFlags.includes('SIP_EXPIRED') || joinedFlags.includes('IND-L2-SIP-EXP') || joinedFlags.includes('GEODIST') || joinedFlags.includes('SDMK'))) ||
      (activeModus === 'MOBILE' && (joinedFlags.includes('MOBILE_DENIED') || joinedFlags.includes('IND-L3-PRESENSI'))) ||
      (activeModus === 'UPCODING' && joinedFlags.includes('UPCODING'));
    const q = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      c.hospital.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.noFpk.toLowerCase().includes(q) ||
      c.dpjp.toLowerCase().includes(q);
    return matchesLane && matchesModus && matchesFaskes && matchesService && matchesSubmission && matchesFpk && matchesPlotting && matchesSearch;
  });

  const capacityBudgetK = Math.max(1, (Number(capVerifiers) || 1) * (Number(capPerDay) || 5) * 10);
  const displayedClaims = capacityPriorityOnly
    ? [...filteredClaims]
        .sort((a, b) => (b.totalScore - a.totalScore) || (Number(b.rawClaim?.nilai_klaim_rp || 0) - Number(a.rawClaim?.nilai_klaim_rp || 0)))
        .slice(0, capacityBudgetK)
    : filteredClaims;

  const allVisibleSelected =
    displayedClaims.length > 0 && displayedClaims.every((c) => selectedIds.includes(c.id));

  const toggleSelectClaim = (claimId) => {
    setSelectedIds((prev) =>
      prev.includes(claimId) ? prev.filter((id) => id !== claimId) : [...prev, claimId]
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleSet = new Set(displayedClaims.map((c) => c.id));
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      const merged = new Set([...selectedIds, ...displayedClaims.map((c) => c.id)]);
      setSelectedIds(Array.from(merged));
    }
  };

  const handleBatchDecision = async (decisionCode) => {
    if (!selectedIds.length || batchSubmitting) return;
    setBatchSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/claims/batch-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_ids: selectedIds,
          decision: decisionCode,
          verifier_id: 'VERIF-CLAIMTRACE-01',
          catatan_verifikator:
            decisionCode === 'LAYAK_BAYAR'
              ? 'Putusan kolektif Layak Bayar pasca-screening Fast-Track Pra-Bayar.'
              : 'Putusan kolektif Pending Klarifikasi FPK (kelengkapan SEP/resume medis).',
          pending_reasons:
            decisionCode === 'PENDING_KLARIFIKASI'
              ? ['Konfirmasi ulang berkas penunjang FPK kolektif']
              : [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await reloadClaimsQueue();
        setSelectedIds([]);
        setQueueToast({
          tone: decisionCode === 'LAYAK_BAYAR' ? 'green' : 'amber',
          message: `Putusan kolektif ${decisionCode.replace(/_/g, ' ')} berhasil diterapkan ke ${data.updated_count} berkas FPK.`,
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setQueueToast({
          tone: 'red',
          message: err.detail || 'Otoritas peran Anda tidak mengizinkan putusan kolektif FPK.',
        });
      }
    } catch {
      setQueueToast({ tone: 'red', message: 'Koneksi ke server verifikasi terputus.' });
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleBatchPlotting = async () => {
    if (!selectedIds.length || batchSubmitting || !batchPlotNip) return;
    setBatchSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/portal/plotting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_ids: selectedIds,
          verifier_nip: batchPlotNip,
          catatan: 'Plotting berkas FPK dari antrean pra-bayar.',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await reloadClaimsQueue();
        setSelectedIds([]);
        setQueueToast({
          tone: 'green',
          message: `${data.updated_count} berkas FPK di-plot ke ${data.assigned_verifier_name}.`,
        });
      } else {
        setQueueToast({
          tone: 'red',
          message: data.detail || 'Peran Anda tidak diizinkan mengubah plotting verifikator.',
        });
      }
    } catch {
      setQueueToast({ tone: 'red', message: 'Gagal menghubungi endpoint plotting verifikator.' });
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleRunFpkPull = async (e) => {
    e.preventDefault();
    if (fpkPullSubmitting) return;
    setFpkPullSubmitting(true);
    setFpkPullResult(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/portal/fpk-pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fpkPullForm,
          no_fpk: fpkPullForm.no_fpk.trim() || null,
          nama_faskes: fpkPullForm.nama_faskes.trim() || null,
          jumlah_klaim: Number(fpkPullForm.jumlah_klaim) || 2,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setFpkPullResult(data);
        await reloadClaimsQueue();
        setQueueToast({
          tone: 'green',
          message: `Tarik FPK ${data.no_fpk} selesai (${data.pulled_count} berkas masuk Pra-Purifikasi ClaimTrace).`,
        });
      } else {
        setQueueToast({ tone: 'red', message: data.detail || 'Gagal menarik FPK dari VClaim.' });
      }
    } catch {
      setQueueToast({ tone: 'red', message: 'Koneksi ke endpoint FPK Pull terputus.' });
    } finally {
      setFpkPullSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/claims/export-csv`);
      if (!res.ok) {
        setQueueToast({ tone: 'red', message: 'Gagal mengunduh CSV rekap FPK.' });
        return;
      }
      const csvText = await res.text();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ClaimTrace_Rekap_FPK_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setQueueToast({ tone: 'green', message: 'Berkas CSV rekap FPK berhasil diunduh.' });
    } catch {
      setQueueToast({ tone: 'red', message: 'Terjadi gangguan jaringan saat ekspor CSV.' });
    }
  };

  const handleRunIngestSimulate = async (e) => {
    e.preventDefault();
    if (ingestSubmitting) return;
    setIngestSubmitting(true);
    setIngestResult(null);
    try {
      const cleanIcd = String(ingestForm.icd10_primary || 'M54.5').split(' ')[0].trim();
      const cbgParts = String(ingestForm.ina_cbg_code || 'Z-3-12-0').split('-');
      const sevToken = cbgParts[3] || '0';
      const sampelTotal = Math.max(1, Number(ingestForm.mobile_sampel_terkirim) || 10);
      const deniedTotal = Number(ingestForm.mobile_respon_tidak_hadir) || 0;

      const ingestPayload = {
        nama_faskes: ingestForm.nama_faskes,
        kelas_rs: ingestForm.kelas_rs,
        ina_cbg_code: ingestForm.ina_cbg_code,
        deskripsi_cbg: ingestForm.deskripsi_cbg,
        icd10_primary: ingestForm.icd10_primary,
        icd9cm_procedure: ingestForm.icd9cm_procedure,
        nilai_klaim_rp: Number(ingestForm.nilai_klaim_rp) || 0,
        dpjp_name: ingestForm.dpjp_name,
        sip_status: ingestForm.sip_status,
        rasio_lonjakan_baseline: Number(ingestForm.rasio_lonjakan_baseline) || 1,
        jumlah_klaim_klaster: Number(ingestForm.jumlah_klaim_klaster) || 1,
        terdaftar_baksos_resmi: Boolean(ingestForm.terdaftar_baksos_resmi),
        indikasi_repeat_billing: Boolean(ingestForm.indikasi_repeat_billing),
        klaim_episode_sebelumnya_id: ingestForm.klaim_episode_sebelumnya_id,
        selisih_hari_admisi: ingestForm.selisih_hari_admisi,
        mobile_sampel_terkirim: Number(ingestForm.mobile_sampel_terkirim) || 0,
        mobile_respon_hadir: Number(ingestForm.mobile_respon_hadir) || 0,
        mobile_respon_tidak_hadir: deniedTotal,
        add_to_queue: Boolean(ingestForm.add_to_queue),
      };

      const verifyPayload = {
        hospital_name: ingestForm.nama_faskes,
        fkl09_kelas_rs: `Kelas ${ingestForm.kelas_rs || 'B'}`,
        fkl17_icd10_primer: cleanIcd,
        fkl30_icd9_procedure: String(ingestForm.icd9cm_procedure || '93.39').split(' ')[0].trim(),
        fkl19_inacbg_code: ingestForm.ina_cbg_code,
        fkl23_severity_level: sevToken,
        fkl47_claimed_amount: Math.max(100000, Number(ingestForm.nilai_klaim_rp) || 100000),
        fkl32_standard_tariff: Math.max(100000, Math.round((Number(ingestForm.nilai_klaim_rp) || 1000000) * 0.45)),
        cluster_spike_ratio: Number(ingestForm.rasio_lonjakan_baseline) || 1.0,
        repeat_interval_days: ingestForm.indikasi_repeat_billing ? Number(ingestForm.selisih_hari_admisi ?? 0) : 30,
        terdaftar_baksos_resmi: Boolean(ingestForm.terdaftar_baksos_resmi),
        sip_status: ingestForm.sip_status,
        mobile_jkn_denied_ratio: Math.min(1.0, Math.max(0.0, deniedTotal / sampelTotal)),
        simulate_llm_timeout: Boolean(ingestForm.simulate_llm_timeout),
      };

      const [res, verifyRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/v1/claims/ingest-simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ingestPayload),
        }),
        authFetch(`${API_BASE_URL}/api/v1/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...verifyPayload }),
        }).catch(() => null),
      ]);

      const data = await res.json();
      const verifyData = verifyRes && verifyRes.ok ? await verifyRes.json().catch(() => null) : null;

      if (res.ok && data?.claim && data?.triage) {
        setIngestResult({ ...data, verify_pipeline: verifyData });
        if (data.added_to_queue) {
          await reloadClaimsQueue();
        }
        setQueueToast({
          tone: data.triage.triage_lane === 'MERAH' ? 'red' : data.triage.triage_lane === 'KUNING' ? 'amber' : 'green',
          message: `Verifikasi Pra-Bayar ${data.claim.claim_id} selesai: Jalur ${data.triage.triage_lane} (Skor ${Number(data.triage.final_priority_score).toFixed(1)}).`,
        });
      } else {
        setQueueToast({ tone: 'red', message: data?.detail || 'Gagal menjalankan verifikasi berkas FPK.' });
      }
    } catch {
      setQueueToast({ tone: 'red', message: 'Gagal menghubungi mesin verifikasi Lapis 1-4 FastAPI.' });
    } finally {
      setIngestSubmitting(false);
    }
  };

  const screeningStages = Array.isArray(pipelineSummary?.stages) && pipelineSummary.stages.length === 4
    ? pipelineSummary.stages
    : [
        {
          stage: 1,
          name: 'Tahap 1 · Filter Awal & Pengecualian PRB',
          rule: 'Menyaring 1.699.219 FPK dan mengecualikan resep kronis PRB <= 30 hari (PMK 3/2023 Pasal 37).',
          metric_label: '1.697.588 (99,90%) wajar -> Fast-Track Hijau',
        },
        {
          stage: 2,
          name: 'Tahap 2 · Pola Lonjakan & Klaim Ganda (#6/#11)',
          rule: 'Deteksi lonjakan klaster >= 3,0x baseline, koreksi tarif FKL47 vs FKL48, dan klaim ganda hari sama.',
          metric_label: '4.876 pasang klaim ganda (9.555 berkas) + 1.631 koreksi tarif',
        },
        {
          stage: 3,
          name: 'Tahap 3 · SDMK, Geovelocity & NLP Semantik',
          rule: 'Uji SIP Expired (Hard Trigger >= 75), kecepatan antar-RS OSRM > 120 km/jam, dan duplikasi teks >= 90%.',
          metric_label: 'S2 memisahkan SIP Expired (Merah) vs Unsynced (Kuning)',
        },
        {
          stage: 4,
          name: 'Tahap 4 · Konfirmasi Mobile JKN & Fusi (0 - 100)',
          rule: 'Skor = 0,50*S1 + 0,30*S2 + 0,20*S3 -> Hijau (<50), Kuning (50-74,9), Merah (>=75 / Hard Trigger).',
          metric_label: 'Keputusan verifikator medis + BAHV Bersegel Elektronik BSrE',
        },
      ];
  const thresholdList = pipelineSummary?.scoring_spec?.thresholds || [];

  return (
    <div className={`space-y-4 font-sans pb-16 sm:pb-20 ${isLight ? 'text-[#061B31]' : 'text-[#F3F5F8]'}`}>
      {/* TOP TITLE & ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={`text-lg sm:text-xl font-display font-semibold tracking-tight ${isLight ? 'text-[#061B31]' : 'text-[#F3F5F8]'}`}>
            Antrean Berkas Klaim (FPK)
          </h1>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Penyaringan klaim pra-pembayaran JKN berdasarkan prioritas anomali dan batas waktu verifikasi SLA 10 HK.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setFpkPullResult(null);
              setShowFpkPullModal(true);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer inline-flex items-center gap-1.5 ${
              isLight
                ? 'bg-white hover:bg-[#F3F5F8] text-[#061B31] border-[#061B31]/15'
                : 'bg-[#161A22] hover:bg-white/[0.06] text-[#F3F5F8] border-white/[0.1]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Tarik Data FPK</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIngestResult(null);
              setShowIngestModal(true);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer inline-flex items-center gap-1.5 ${
              isLight
                ? 'bg-[#00733B] hover:bg-[#005E30] text-white border-[#00733B]'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/40'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Input Berkas Baru</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer inline-flex items-center gap-1.5 ${
              isLight
                ? 'bg-white hover:bg-[#F3F5F8] text-[#061B31] border-[#061B31]/15'
                : 'bg-[#161A22] hover:bg-white/[0.06] text-[#F3F5F8] border-white/[0.1]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {queueToast && (
        <div className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
          queueToast.tone === 'red'
            ? (isLight ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-rose-500/15 border-rose-500/30 text-rose-200')
            : queueToast.tone === 'amber'
            ? (isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-500/15 border-amber-500/30 text-amber-200')
            : (isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200')
        }`}>
          <span>{queueToast.message}</span>
          <button type="button" onClick={() => setQueueToast(null)} className="text-[11px] font-bold underline cursor-pointer shrink-0">
            Tutup
          </button>
        </div>
      )}

      {/* COCKPIT 4 SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL ANTREAN */}
        <div className={`rounded-2xl p-4 border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#1e2530] border-[#2d3748] text-white shadow-xl'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Total Antrean
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
              isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
            }`}>
              Aktif
            </span>
          </div>
          <div className="text-3xl font-extrabold mt-1.5 tabular-nums tracking-tight">
            {totalQueueCount.toLocaleString('id-ID')}
          </div>
          <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Berkas klaim siap diproses verifikator
          </p>
        </div>

        {/* Card 2: JALUR MERAH (RISIKO TINGGI) */}
        <div className={`rounded-2xl p-4 border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#1e2530] border-[#2d3748] text-white shadow-xl'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
              Jalur Merah (Risiko Tinggi)
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${
              isLight ? 'bg-rose-50 text-rose-700 border-rose-300' : 'text-rose-300 bg-rose-500/20 border-rose-500/30'
            }`}>{redPct}%</span>
          </div>
          <div className={`text-3xl font-extrabold mt-1.5 tabular-nums tracking-tight ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>
            {redCount.toLocaleString('id-ID')}
          </div>
          <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Indikasi anomali berat &amp; wajib telaah
          </p>
        </div>

        {/* Card 3: JALUR KUNING (KLARIFIKASI) */}
        <div className={`rounded-2xl p-4 border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#1e2530] border-[#2d3748] text-white shadow-xl'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
              Jalur Kuning (Klarifikasi)
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${
              isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'text-amber-300 bg-amber-500/20 border-amber-500/30'
            }`}>{yellowPct}%</span>
          </div>
          <div className={`text-3xl font-extrabold mt-1.5 tabular-nums tracking-tight ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
            {yellowCount.toLocaleString('id-ID')}
          </div>
          <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Konfirmasi dokumen penunjang faskes
          </p>
        </div>

        {/* Card 4: JALUR HIJAU (LAYAK) */}
        <div className={`rounded-2xl p-4 border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#1e2530] border-[#2d3748] text-white shadow-xl'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              Jalur Hijau (Layak Lolos)
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${
              isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30'
            }`}>{greenPct}%</span>
          </div>
          <div className={`text-3xl font-extrabold mt-1.5 tabular-nums tracking-tight ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
            {greenCount.toLocaleString('id-ID')}
          </div>
          <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Klaim wajar tanpa indikasi kecurangan
          </p>
        </div>
      </div>

      {/* FILTER CONTROLS STRIP */}
      <div className={`rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 border ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm'
          : 'bg-[#00153A]/85 backdrop-blur-xl border-white/10 shadow-2xl'
      }`}>
        
        {/* Triage Lane Pills */}
        <div className="flex items-center space-x-1.5 text-xs font-semibold flex-wrap gap-y-1.5">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveLane('all')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-bold ${
              activeLane === 'all'
                ? (isLight ? 'bg-emerald-700 text-white shadow-sm' : 'bg-emerald-600 text-white shadow-sm')
                : (isLight
                    ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300'
                    : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10')
            }`}
          >
            Semua ({liveClaims.length})
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveLane('red')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer font-bold ${
              activeLane === 'red'
                ? 'bg-rose-600 text-white shadow-sm'
                : (isLight
                    ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300'
                    : 'text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30')
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Jalur Merah ({redCount})</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveLane('yellow')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer font-bold ${
              activeLane === 'yellow'
                ? 'bg-amber-600 text-white shadow-sm'
                : (isLight
                    ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300'
                    : 'text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30')
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Klarifikasi ({yellowCount})</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveLane('green')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer font-bold ${
              activeLane === 'green'
                ? (isLight ? 'bg-emerald-700 text-white shadow-sm' : 'bg-emerald-600 text-white shadow-sm')
                : (isLight
                    ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300'
                    : 'text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30')
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Fast-Track ({greenCount})</span>
          </motion.button>
        </div>

        {/* Clean, Focused Filter Controls */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
          <select
            aria-label="Filter jenis pelayanan klaim"
            value={activeServiceLevel}
            onChange={(e) => setActiveServiceLevel(e.target.value)}
            className={`text-xs px-3 py-2 rounded-xl border focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                : 'bg-white/5 text-white border-white/15 focus:border-[#FFCA40]'
            }`}
          >
            <option value="all" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>Semua Layanan (RJTL & RITL)</option>
            <option value="RJTL" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>Rawat Jalan (RJTL)</option>
            <option value="RITL" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>Rawat Inap (RITL)</option>
          </select>

          <select 
            aria-label="Filter Fasilitas Kesehatan"
            value={selectedFaskes}
            onChange={(e) => setSelectedFaskes(e.target.value)}
            className={`text-xs px-3 py-2 rounded-xl border focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                : 'bg-white/5 text-white border-white/15 focus:border-[#FFCA40]'
            }`}
          >
            <option value="all" className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>Semua Fasilitas Kesehatan</option>
            {uniqueFaskesOptions.map((hosp) => (
              <option key={hosp} value={hosp} className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>{hosp}</option>
            ))}
          </select>

          <div className="relative min-w-[240px]">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
              isLight ? 'text-slate-400' : 'text-white/40'
            }`} />
            <input aria-label="Bidang input data"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Klaim, SEP, DPJP..."
              className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs transition focus:outline-none ${
                isLight
                  ? 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                  : 'bg-white/5 border border-white/15 text-white placeholder:text-white/40 focus:border-[#FFCA40]'
              }`}
            />
          </div>
        </div>
      </div>

      {/* KAPASITAS TIM CABANG & PRIORITAS TOP-K PRA-BAYAR (C03.04 -> S06 HOLD) */}
      <div className={`rounded-2xl px-4 py-2.5 border flex flex-wrap items-center justify-between gap-3 text-xs ${
        isLight
          ? 'bg-slate-50/90 border-slate-200 text-slate-800'
          : 'bg-[#00153A]/70 border-white/10 text-white/90'
      }`}>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
            Alokasi Kapasitas SLA 10 HK:
          </span>
          <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
            <span>Verifikator</span>
            <input
              aria-label="Jumlah Verifikator"
              type="number"
              min="1"
              max="50"
              value={capVerifiers}
              onChange={(e) => setCapVerifiers(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              className={`w-14 px-2 py-1 rounded-lg border text-xs font-mono font-bold text-center ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/10 border-white/20 text-white'
              }`}
            />
          </label>
          <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
            <span>Berkas/Hari</span>
            <input
              aria-label="Berkas per Hari per Verifikator"
              type="number"
              min="1"
              max="50"
              value={capPerDay}
              onChange={(e) => setCapPerDay(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              className={`w-14 px-2 py-1 rounded-lg border text-xs font-mono font-bold text-center ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/10 border-white/20 text-white'
              }`}
            />
          </label>
          <button
            type="button"
            onClick={() => setCapacityPriorityOnly((prev) => !prev)}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
              capacityPriorityOnly
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : (isLight
                    ? 'bg-white hover:bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-white/5 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/35')
            }`}
          >
            {capacityPriorityOnly ? `Fokus Top-${capacityBudgetK} Prioritas Aktif` : `Prioritaskan Top-${capacityBudgetK} Berkas`}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <span>
            Target <strong className={isLight ? 'text-slate-900' : 'text-white'}>k = {capacityBudgetK}</strong>
          </span>
          {capacityReport?.baseline_benchmark_metrics && (
            <>
              <span className={isLight ? 'text-emerald-700 font-bold' : 'text-emerald-300 font-bold'}>
                Precision@k: {capacityReport.baseline_benchmark_metrics.precision_at_k_pct}%
              </span>
              <span className={isLight ? 'text-cyan-800 font-bold' : 'text-cyan-300 font-bold'}>
                Rupiah Recall@k: {capacityReport.baseline_benchmark_metrics.rupiah_recall_at_k_pct}%
              </span>
              <span className={isLight ? 'text-amber-800 font-bold' : 'text-[#FFCA40] font-bold'}>
                Lift: {capacityReport.baseline_benchmark_metrics.lift_over_random}x
              </span>
            </>
          )}
        </div>
      </div>



      {selectedIds.length > 0 && (
        <div className={`rounded-2xl px-4 py-3 border flex flex-wrap items-center justify-between gap-3 shadow-sm ${
          isLight
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-100'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{selectedIds.length} berkas FPK dipilih untuk putusan kolektif pra-bayar</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={batchSubmitting}
              onClick={() => handleBatchDecision('LAYAK_BAYAR')}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
            >
              Setujui Massal (Layak Bayar)
            </button>
            <button
              type="button"
              disabled={batchSubmitting}
              onClick={() => handleBatchDecision('PENDING_KLARIFIKASI')}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
            >
              Pending Klarifikasi Massal
            </button>
            <div className="inline-flex items-center gap-1.5">
              <select
                aria-label="Pilih verifikator untuk plotting massal"
                value={batchPlotNip}
                onChange={(e) => setBatchPlotNip(e.target.value)}
                className={`text-[11px] px-2.5 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#00153A] border-white/20 text-white'
                }`}
              >
                {(verificatorsList.length > 0 ? verificatorsList : [{ nip: '198704202011012001', name: 'dr. Siti Rahma, Sp.PK' }]).map((v) => (
                  <option key={v.nip} value={v.nip} className={isLight ? 'bg-white text-slate-900' : 'bg-[#00153A] text-white'}>
                    {v.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={batchSubmitting}
                onClick={handleBatchPlotting}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer inline-flex items-center gap-1 disabled:opacity-50 ${
                  isLight ? 'bg-cyan-700 hover:bg-cyan-800 text-white border-cyan-700' : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400/40'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Plot Berkas</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                isLight ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              Batalkan Pilihan
            </button>
          </div>
        </div>
      )}

      {/* TRIAGE QUEUE TABLE */}
      <div className={`rounded-xl overflow-hidden border ${
        isLight
          ? 'bg-white border-[#061B31]/[0.08] shadow-[0_1px_2px_rgba(6,27,49,0.04)]'
          : 'bg-[#11141A] border-white/[0.08]'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-fixed min-w-[920px]">
            <thead className={`text-[10px] uppercase font-semibold tracking-wider border-b ${
              isLight
                ? 'bg-[#F3F5F8] text-slate-600 border-[#061B31]/[0.08]'
                : 'bg-[#161A22] text-slate-400 border-white/[0.08]'
            }`}>
              <tr>
                <th className="py-3 pl-3 pr-2 w-[4%]">
                  <button
                    type="button"
                    aria-label="Pilih semua berkas tampil"
                    onClick={toggleSelectAllVisible}
                    className={`p-1 rounded border transition cursor-pointer ${
                      allVisibleSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : (isLight ? 'border-slate-300 text-slate-500 hover:border-emerald-600' : 'border-white/20 text-white/60 hover:border-cyan-400')
                    }`}
                  >
                    {allVisibleSelected ? <Check className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                  </button>
                </th>
                <th className="py-3 px-3 w-[13%]">No. Klaim</th>
                <th className="py-3 px-3 w-[20%]">Fasilitas Kesehatan</th>
                <th className="py-3 px-3 w-[18%]">Layanan &amp; Diagnosis</th>
                <th className="py-3 px-3 w-[11%]">Dokter DPJP</th>
                <th className="py-3 px-3 w-[11%]">Nilai Tagihan</th>
                <th className="py-3 px-2 text-center w-[6%]">Risiko</th>
                <th className="py-3 px-3 w-[8%]">Status</th>
                <th className="py-3 pl-2 pr-4 text-right w-[9%]">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isLight ? 'divide-slate-200 text-slate-800' : 'divide-white/10 text-white/90'
            }`}>
              {displayedClaims.length === 0 && (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertOctagon className="w-8 h-8 text-slate-400" />
                      <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>Tidak ada klaim yang cocok dengan kriteria filter.</p>
                      <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Silakan ubah filter jalur triase atau kata kunci pencarian Anda.</p>
                      <button type="button"
                        onClick={() => {
                          setActiveLane('all');
                          setActiveModus('all');
                          setActiveServiceLevel('all');
                          setActiveSubmissionType('all');
                          setActiveFpkFilter('all');
                          setActivePlottingFilter('all');
                          setSelectedFaskes('all');
                          setCapacityPriorityOnly(false);
                          setSearchQuery('');
                        }}
                        className={`mt-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                          isLight
                            ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                            : 'text-cyan-300 hover:text-cyan-200 bg-white/5 border-white/15'
                        }`}
                      >
                        Reset Semua Filter
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {displayedClaims.map((c) => {
                const isChecked = selectedIds.includes(c.id);
                const statusBadge = formatDecisionStatus(c.statusVerifikasi, c.lane);
                return (
                <motion.tr
                  layout
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  className={`group cursor-pointer transition-colors duration-150 ${
                    c.lane === 'red' 
                      ? (isLight ? 'bg-rose-500/[0.025] hover:bg-rose-500/[0.05] border-l-2 border-l-rose-500' : 'bg-rose-500/[0.05] hover:bg-rose-500/[0.09] border-l-2 border-l-rose-500')
                      : c.lane === 'yellow'
                      ? (isLight ? 'bg-amber-500/[0.025] hover:bg-amber-500/[0.05] border-l-2 border-l-amber-500' : 'bg-amber-500/[0.05] hover:bg-amber-500/[0.09] border-l-2 border-l-amber-500')
                      : (isLight ? 'hover:bg-[#F7F8FA] border-l-2 border-l-emerald-600' : 'hover:bg-white/[0.03] border-l-2 border-l-emerald-500')
                  }`}
                >
                  <td
                    className="py-3.5 pl-3 pr-2 align-middle"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectClaim(c.id);
                    }}
                  >
                    <button
                      type="button"
                      aria-label={`Pilih klaim ${c.id}`}
                      className={`p-1 rounded border transition cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : (isLight ? 'border-slate-300 bg-white text-slate-400 hover:border-emerald-600' : 'border-white/25 bg-white/5 text-white/40 hover:border-cyan-400')
                      }`}
                    >
                      {isChecked ? <Check className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                    </button>
                  </td>

                  {/* 1. No. Klaim & Tanggal */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        c.lane === 'red' ? 'bg-rose-500' : c.lane === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <span className={`font-mono font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {c.id}
                      </span>
                    </div>
                    <div className={`text-[11px] font-mono mt-0.5 ml-4 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      {c.date}
                    </div>
                  </td>

                  {/* 2. Fasilitas Kesehatan */}
                  <td className="py-3.5 px-3">
                    <div className={`font-bold transition truncate text-xs ${
                      isLight ? 'text-slate-900 group-hover:text-emerald-700' : 'text-white group-hover:text-cyan-300'
                    }`} title={c.hospital}>
                      {c.hospital}
                    </div>
                    <div className={`flex items-center gap-1.5 text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      <span>{c.jenisPelayanan}</span>
                      <span>·</span>
                      <span>{c.jenisPengajuan}</span>
                    </div>
                  </td>

                  {/* 3. Layanan & Diagnosis */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-mono font-bold text-xs ${
                        isLight ? 'text-emerald-700' : 'text-[#FFCA40]'
                      }`}>
                        {c.code}
                      </span>
                      {c.lane === 'red' && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                          isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}>
                          {c.flags.includes('SIP_EXPIRED') ? 'SIP Kedaluwarsa' : c.flags.includes('MOBILE_DENIED') ? 'Sangkalan Pasien' : c.flags.includes('REPEAT_BILLING') ? 'Klaim Berulang' : 'Anomali Berat'}
                        </span>
                      )}
                      {c.lane === 'yellow' && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                          isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}>
                          Klarifikasi Dokumen
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`} title={c.description}>
                      {c.description}
                    </p>
                  </td>

                  {/* 4. Dokter DPJP */}
                  <td className="py-3.5 px-3">
                    <div className={`font-medium text-xs truncate ${isLight ? 'text-slate-900' : 'text-white'}`} title={c.dpjp}>
                      {c.dpjp}
                    </div>
                  </td>

                  {/* 5. Nilai Tagihan */}
                  <td className="py-3.5 px-3">
                    <span className={`font-mono font-semibold text-xs tabular-nums block ${isLight ? 'text-[#061B31]' : 'text-[#F3F5F8]'}`}>
                      {c.tariff}
                    </span>
                  </td>

                  {/* 6. Tingkat Risiko */}
                  <td className="py-3.5 px-2 text-center">
                    <span className={`text-sm font-semibold font-mono tabular-nums ${
                      c.lane === 'red'
                        ? (isLight ? 'text-rose-700' : 'text-rose-400')
                        : c.lane === 'yellow'
                        ? (isLight ? 'text-amber-700' : 'text-amber-400')
                        : (isLight ? 'text-emerald-700' : 'text-emerald-400')
                    }`}>
                      {Number(c.totalScore).toFixed(1)}
                    </span>
                  </td>

                  {/* 7. Status & SLA */}
                  <td className="py-3.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                      statusBadge.tone === 'green'
                        ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                        : statusBadge.tone === 'amber'
                        ? (isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                        : statusBadge.tone === 'red'
                        ? (isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30')
                        : (isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/10 text-white/75 border-white/15')
                    }`}>
                      {statusBadge.label}
                    </span>
                    <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      SLA {c.slaDays} HK
                    </div>
                  </td>

                  {/* 8. Aksi */}
                  <td className="py-3.5 pl-2 pr-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(c);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer inline-flex items-center gap-1 whitespace-nowrap ${
                        isLight
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-700 shadow-2xs'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-xs'
                      }`}
                    >
                      <span>Telaah</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* BOTTOM REGULATORY STRIP */}
        <div className={`px-4 py-2.5 border-t flex flex-wrap items-center justify-between text-[11px] ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-600'
            : 'bg-[#000c24]/90 border-white/10 text-white/50'
        }`}>
          <div className="flex items-center space-x-3">
            <span>Standar SLA: <strong className={isLight ? 'text-slate-800 font-bold' : 'text-white/80'}>Maksimal 10 Hari Kerja</strong></span>
            <span>•</span>
            <span>Regulasi: <strong className={isLight ? 'text-slate-800 font-bold' : 'text-white/80'}>Perpres No. 82/2018 Pasal 76 ayat 2</strong></span>
          </div>
          <div className={`flex items-center space-x-1.5 ${isLight ? 'text-slate-600 font-medium' : 'text-white/60'}`}>
            <ShieldCheck className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
            <span>Sistem Otentikasi Terintegrasi Smart ClaimTrace</span>
          </div>
        </div>
      </div>

      {/* INPUT & VERIFIKASI PRA-BAYAR FPK BARU (C03.04) MODAL */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#00153A] border-white/15 text-white'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/10'
            }`}>
              <div>
                <h3 className="text-sm font-bold">Registrasi &amp; Verifikasi Pra-Bayar FPK Baru (C03.04)</h3>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                  Penyaringan VClaim/VIDI 6-tahap ML + Lapis 1-4 beserta FairGuard sebelum rilis pembayaran S06 (In-Monica).
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup modal input FPK"
                onClick={() => setShowIngestModal(false)}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100' : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRunIngestSimulate} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div>
                <div className={`text-[10.5px] font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  Templat Kasus FPK Klinis &amp; FairGuard
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SIMULATE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setIngestForm((prev) => ({ ...preset.payload, add_to_queue: prev.add_to_queue, simulate_llm_timeout: prev.simulate_llm_timeout }));
                        setIngestResult(null);
                      }}
                      className={`text-left px-3 py-2 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                        isLight
                          ? 'bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-800'
                          : 'bg-white/5 hover:bg-white/10 border-white/15 text-white/90'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Nama Faskes Rujukan</label>
                  <input
                    type="text"
                    required
                    value={ingestForm.nama_faskes}
                    onChange={(e) => setIngestForm({ ...ingestForm, nama_faskes: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/5 border-white/15 text-white'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Kode INA-CBG (FKL19)</label>
                    <input
                      type="text"
                      required
                      value={ingestForm.ina_cbg_code}
                      onChange={(e) => setIngestForm({ ...ingestForm, ina_cbg_code: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/5 border-white/15 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Tarif Klaim (Rp)</label>
                    <input
                      type="number"
                      min="100000"
                      required
                      value={ingestForm.nilai_klaim_rp}
                      onChange={(e) => setIngestForm({ ...ingestForm, nilai_klaim_rp: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/5 border-white/15 text-white'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Diagnosis Primer ICD-10 (FKL17)</label>
                  <input
                    type="text"
                    required
                    value={ingestForm.icd10_primary || ''}
                    onChange={(e) => setIngestForm({ ...ingestForm, icd10_primary: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/5 border-white/15 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Kelas RS (FKL09)</label>
                  <select
                    aria-label="Kelas Rumah Sakit"
                    value={ingestForm.kelas_rs || 'B'}
                    onChange={(e) => setIngestForm({ ...ingestForm, kelas_rs: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#001f4d] border-white/15 text-white'
                    }`}
                  >
                    <option value="A">Kelas A (Rujukan Tersier)</option>
                    <option value="B">Kelas B</option>
                    <option value="C">Kelas C</option>
                    <option value="D">Kelas D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">DPJP &amp; Status SIP SDMK</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={ingestForm.dpjp_name}
                      onChange={(e) => setIngestForm({ ...ingestForm, dpjp_name: e.target.value })}
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/5 border-white/15 text-white'
                      }`}
                    />
                    <select
                      aria-label="Status SIP Dokter"
                      value={ingestForm.sip_status}
                      onChange={(e) => setIngestForm({ ...ingestForm, sip_status: e.target.value })}
                      className={`px-2.5 py-2 rounded-xl border text-xs font-mono font-bold ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#001f4d] border-white/15 text-white'
                      }`}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="UNSYNCED">UNSYNCED</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Lonjakan (x Baseline)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={ingestForm.rasio_lonjakan_baseline}
                      onChange={(e) => setIngestForm({ ...ingestForm, rasio_lonjakan_baseline: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/5 border-white/15 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Bantah Mobile JKN</label>
                    <input
                      type="number"
                      min="0"
                      value={ingestForm.mobile_respon_tidak_hadir}
                      onChange={(e) => setIngestForm({ ...ingestForm, mobile_respon_tidak_hadir: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/5 border-white/15 text-white'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px]">
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={Boolean(ingestForm.terdaftar_baksos_resmi)}
                    onChange={(e) => setIngestForm({ ...ingestForm, terdaftar_baksos_resmi: e.target.checked })}
                  />
                  <span>Terdaftar Baksos / Skrining Resmi Dinas Kesehatan</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={Boolean(ingestForm.indikasi_repeat_billing)}
                    onChange={(e) => setIngestForm({ ...ingestForm, indikasi_repeat_billing: e.target.checked })}
                  />
                  <span>Indikasi Repeat / Split Billing (#11)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={Boolean(ingestForm.simulate_llm_timeout)}
                    onChange={(e) => setIngestForm({ ...ingestForm, simulate_llm_timeout: e.target.checked })}
                  />
                  <span>Mode Cadangan Lokal (Fallback Deterministik)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={Boolean(ingestForm.add_to_queue)}
                    onChange={(e) => setIngestForm({ ...ingestForm, add_to_queue: e.target.checked })}
                  />
                  <span>Masukkan ke Antrean Live Penapisan</span>
                </label>
              </div>

              {ingestResult?.triage && (
                <div className={`p-3.5 rounded-xl border space-y-2 ${
                  ingestResult.triage.triage_lane === 'MERAH'
                    ? (isLight ? 'bg-rose-50 border-rose-300 text-rose-950' : 'bg-rose-500/15 border-rose-500/35 text-rose-100')
                    : ingestResult.triage.triage_lane === 'KUNING'
                    ? (isLight ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-amber-500/15 border-amber-500/35 text-amber-100')
                    : (isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-100')
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs">
                      {ingestResult.claim.claim_id} · JALUR {ingestResult.triage.triage_lane}
                    </span>
                    <span className="font-mono font-bold text-xs">
                      Skor Fusi: {Number(ingestResult.triage.final_priority_score).toFixed(1)} (S1:{Math.round(ingestResult.triage.score_breakdown?.s1_value || 0)} · S2:{Math.round(ingestResult.triage.score_breakdown?.s2_value || 0)} · S3:{Math.round(ingestResult.triage.score_breakdown?.s3_value || 0)})
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{ingestResult.triage.ringkasan_bukti_audit}</p>
                  {ingestResult.verify_pipeline && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-current/15 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">
                        ML Risk Prob: {(Number(ingestResult.verify_pipeline.stage_4_in_memory_ml_inference?.ml_fraud_probability || 0) * 100).toFixed(1)}%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">
                        Latensi /verify: {Number(ingestResult.verify_pipeline.total_pipeline_latency_ms || 0).toFixed(1)} ms
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">
                        S06 Guard: {ingestResult.verify_pipeline.bea_integration_touchpoints?.s06_keuangan_guard}
                      </span>
                      {ingestResult.verify_pipeline.hard_negative_protected && (
                        <span className="px-2 py-0.5 rounded bg-cyan-600 text-white font-bold">
                          FairGuard Hard-Negative AKTIF
                        </span>
                      )}
                      {ingestResult.verify_pipeline.stage_5_and_6_llm_and_fallback?.fallback_active && (
                        <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold">
                          Local Rule Fallback HTTP 200
                        </span>
                      )}
                    </div>
                  )}
                  {ingestResult.added_to_queue && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const mapped = mapLiveClaimsSafe([{
                            claim: ingestResult.claim,
                            triage: ingestResult.triage,
                            checklist: ingestResult.checklist,
                            pending_reasons: [],
                            sla_deadline_days: ingestResult.triage.sla_deadline_days,
                          }])[0];
                          setShowIngestModal(false);
                          if (mapped) onSelectCase(mapped);
                        }}
                        className="px-3 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 cursor-pointer"
                      >
                        Buka Telaah Forensik 4-Lapis untuk {ingestResult.claim.claim_id}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-white/5 border-white/15 text-white/80 hover:bg-white/10'
                  }`}
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={ingestSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition cursor-pointer disabled:opacity-50"
                >
                  {ingestSubmitting ? 'Menjalankan Inferensi Lapis 1-4...' : 'Verifikasi & Daftarkan FPK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TARIK DATA FPK KOLEKTIF VCLAIM + PRA-PURIFIKASI CLAIMTRACE */}
      {showFpkPullModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#00153A] border-white/15 text-white'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/10'
            }`}>
              <div>
                <h3 className="text-sm font-bold">Tarik Data Klaim / FPK Kolektif (VClaim &rarr; ClaimTrace)</h3>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                  Sinkronisasi batch FPK FKRTL + Pra-Purifikasi Tri-Lapis otomatis &amp; Plotting awal.
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup modal tarik FPK"
                onClick={() => setShowFpkPullModal(false)}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100' : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRunFpkPull} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Nomor FPK (Opsional / Otomatis)</label>
                  <input
                    type="text"
                    value={fpkPullForm.no_fpk}
                    onChange={(e) => setFpkPullForm({ ...fpkPullForm, no_fpk: e.target.value })}
                    placeholder="cth: FPK-0114-202611-202"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/5 border-white/15 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Bulan Pelayanan</label>
                  <input
                    type="text"
                    value={fpkPullForm.bulan_pelayanan}
                    onChange={(e) => setFpkPullForm({ ...fpkPullForm, bulan_pelayanan: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/5 border-white/15 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Jenis Pelayanan (FKL10)</label>
                  <select
                    value={fpkPullForm.jenis_pelayanan}
                    onChange={(e) => setFpkPullForm({ ...fpkPullForm, jenis_pelayanan: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#00153A] border-white/15 text-white'
                    }`}
                  >
                    <option value="ALL">Campuran (RJTL + RITL)</option>
                    <option value="RJTL">RJTL (Rawat Jalan)</option>
                    <option value="RITL">RITL (Rawat Inap)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Jenis Pengajuan Klaim</label>
                  <select
                    value={fpkPullForm.jenis_pengajuan}
                    onChange={(e) => setFpkPullForm({ ...fpkPullForm, jenis_pengajuan: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#00153A] border-white/15 text-white'
                    }`}
                  >
                    <option value="Reguler">Reguler Bulanan</option>
                    <option value="Susulan">Klaim Susulan / Revisi</option>
                    <option value="LUPIS">LUPIS (Alat Bantu Khusus)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Filter FKRTL (Opsional)</label>
                  <input
                    type="text"
                    value={fpkPullForm.nama_faskes}
                    onChange={(e) => setFpkPullForm({ ...fpkPullForm, nama_faskes: e.target.value })}
                    placeholder="Semua RS Rujukan Cabang"
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/5 border-white/15 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Jumlah Berkas Ditarik (1 - 5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={fpkPullForm.jumlah_klaim}
                    onChange={(e) => setFpkPullForm({ ...fpkPullForm, jumlah_klaim: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/5 border-white/15 text-white'
                    }`}
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={Boolean(fpkPullForm.auto_plot)}
                  onChange={(e) => setFpkPullForm({ ...fpkPullForm, auto_plot: e.target.checked })}
                />
                <span>Lakukan Auto-Plotting seimbang ke Verifikator Medis aktif</span>
              </label>

              {fpkPullResult && (
                <div className={`p-3.5 rounded-xl border space-y-2 ${
                  isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-100'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="font-mono">{fpkPullResult.no_fpk} ({fpkPullResult.pulled_count} berkas)</span>
                    <span className="font-mono text-[11px]">
                      Merah: {fpkPullResult.lane_counts?.MERAH || 0} · Kuning: {fpkPullResult.lane_counts?.KUNING || 0} · Hijau: {fpkPullResult.lane_counts?.HIJAU || 0}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {(fpkPullResult.pulled_claims || []).map((pc) => (
                      <div key={pc.claim_id} className="flex items-center justify-between text-[11px] font-mono">
                        <span>{pc.claim_id} ({pc.jenis_pelayanan}) · {pc.nama_faskes}</span>
                        <span className="font-bold">{pc.triage_lane} ({Number(pc.score).toFixed(1)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowFpkPullModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-white/5 border-white/15 text-white/80 hover:bg-white/10'
                  }`}
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={fpkPullSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition cursor-pointer disabled:opacity-50"
                >
                  {fpkPullSubmitting ? 'Menarik & Pra-Purifikasi...' : 'Tarik FPK & Jalankan Pra-Purifikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
