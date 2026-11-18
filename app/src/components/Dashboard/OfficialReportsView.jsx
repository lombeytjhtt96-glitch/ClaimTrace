import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, Printer, Download, CheckCircle, AlertTriangle, 
  ShieldCheck, ArrowLeft, RefreshCw, QrCode, Building2, 
  Calendar, FileSpreadsheet, Send, Search, UserCheck
} from 'lucide-react';
import { API_BASE_URL, authFetch, cachedAuthGetJson } from '../../services/apiConfig';
import { exportCsvFile } from '../../utils/exportCsv';
import SearchableCombobox from '../Common/SearchableCombobox';

export default function OfficialReportsView({ 
  initialReportType = 'bahv-kolektif',
  onBack,
  isLight = false,
  currentUser = null,
  selectedCase = null
}) {
  const [activeTab, setActiveTab] = useState(initialReportType);
  const [selectedHospital, setSelectedHospital] = useState(selectedCase?.hospital || 'RS Khusus Mitra Husada');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [fpkBatches, setFpkBatches] = useState([
    { id: '', label: 'Semua Batch FPK Aktif (Rekapitulasi Kolektif)' },
    { id: 'FPK-0114-202611-001', label: 'FPK-0114-202611-001 · Batch Reguler & Klaster Aktif' },
    { id: 'FPK-0114-202611-002', label: 'FPK-0114-202611-002 · Batch Rawat Inap & Dispute' },
    { id: 'FPK-0114-202611-003', label: 'FPK-0114-202611-003 · Batch Susulan & Katarak' },
  ]);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [serverPrintBusy, setServerPrintBusy] = useState(false);
  const [reportNotice, setReportNotice] = useState('');
  const [claimsList, setClaimsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ledgerHeadHash, setLedgerHeadHash] = useState('');
  const [sha256Seal, setSha256Seal] = useState('8f9b2a7c4e1d3b5f6a8e0c2d4f6b8a1c3e5d7f9a2b4c6e8d0f1a3b5c7e9d1f3a');

  useEffect(() => {
    if (selectedCase?.hospital) {
      setSelectedHospital(selectedCase.hospital);
    }
  }, [selectedCase?.hospital]);

  const defaultHospitals = [
    { id: 'RS Khusus Mitra Husada', name: 'RS Khusus Mitra Husada (Kelas B - DKI Jakarta)', code: 'FSK-RSX-01' },
    { id: 'RS Citra Medika', name: 'RS Citra Medika (Kelas B - Jakarta Timur)', code: '0112R001' },
    { id: 'RS Medika Sejahtera', name: 'RS Medika Sejahtera (Kelas B - Bandung)', code: '0115R004' },
    { id: 'RS Prima Sehat', name: 'RS Prima Sehat (Kelas C - Bekasi)', code: '0119R008' },
  ];

  const hospitals = (() => {
    const map = new Map(defaultHospitals.map((h) => [h.id, h]));
    claimsList.forEach((item) => {
      const c = item?.claim || item;
      if (c?.nama_faskes) {
        const cleanFaskesName = String(c.nama_faskes).replace(/\s*\(Kelas\s+[A-D]\)\s*$/i, '').trim();
        if (!map.has(c.nama_faskes) && !map.has(cleanFaskesName)) {
          const hasRegionOrClass = /\(Kelas\s+[A-D]/i.test(String(c.nama_faskes));
          map.set(cleanFaskesName, {
            id: cleanFaskesName,
            name: hasRegionOrClass ? String(c.nama_faskes) : `${cleanFaskesName} (Kelas ${c.kelas_rs || 'B'})`,
            code: c.faskes_id || '0112R001',
          });
        }
      }
    });
    return Array.from(map.values());
  })();
  const selectedHospitalMeta = hospitals.find((h) => h.id === selectedHospital) || hospitals[0];

  const batches = fpkBatches;

  // Fetch real claim data, real FPK batches & ledger head hash from backend FastAPI
  useEffect(() => {
    let active = true;
    const fetchClaims = async () => {
      setLoading(true);
      try {
        const [claimsJson, ledgerJson, recapJson] = await Promise.all([
          cachedAuthGetJson(`${API_BASE_URL}/api/v1/claims?limit=40`),
          cachedAuthGetJson(`${API_BASE_URL}/api/v1/audit-logs`).catch(() => null),
          cachedAuthGetJson(`${API_BASE_URL}/api/v1/screening/bahv-recap`).catch(() => null),
        ]);
        if (claimsJson) {
          const items = Array.isArray(claimsJson) ? claimsJson : (claimsJson?.claims || []);
          if (active && items.length > 0) {
            setClaimsList(items);
          }
        }
        if (ledgerJson) {
          const latestEntry = Array.isArray(ledgerJson?.chain)
            ? ledgerJson.chain[0]
            : (Array.isArray(ledgerJson?.entries) ? ledgerJson.entries[0] : (Array.isArray(ledgerJson) ? ledgerJson[0] : null));
          if (active && latestEntry?.current_hash) {
            setLedgerHeadHash(latestEntry.current_hash);
          }
        }
        if (active && Array.isArray(recapJson?.fpk_batches) && recapJson.fpk_batches.length > 0) {
          const dynamicBatches = recapJson.fpk_batches.map((b) => {
            const batchId = b.no_fpk || b.batch_id || '';
            const count = b.total_claims ?? b.claim_count ?? 0;
            return batchId
              ? { id: batchId, label: `${batchId} · ${count} Kasus (${b.jenis_pengajuan || 'Reguler'})` }
              : null;
          }).filter(Boolean);
          if (dynamicBatches.length > 0) {
            setFpkBatches([
              { id: '', label: 'Semua Batch FPK Aktif (Rekapitulasi Kolektif)' },
              ...dynamicBatches,
            ]);
          }
        }
      } catch (e) {
        console.warn('Gagal memuat klaim untuk laporan:', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchClaims();
    return () => { active = false; };
  }, [selectedHospital, selectedBatch]);

  // Fallback claims if API is unreachable
  const defaultClaims = [
    { id: 'CLM-2026-8801', sep: '2608801001', clusterCount: 85, patient: 'Ny. S**** (000182*****)', diagnosis: 'Prosedur Fisioterapi (Z-3-12-0)', icd9: '93.39', tariff_submitted: 15300000, tariff_approved: 0, status: 'FRAUD_SUSPECT', note: 'Anomali klaster 85 SEP baksos fiktif (@ Rp 180.000 × 85 SEP) dan SIP DPJP kadaluwarsa.' },
    { id: 'CLM-2026-8802', sep: '0301R0010326V000102', clusterCount: 1, patient: 'Tn. B**** (000291*****)', diagnosis: 'Infark Miokard Akut (I21.9)', icd9: '88.56', tariff_submitted: 32400000, tariff_approved: 0, status: 'PENDING', note: 'Memerlukan hasil EKG serial dan resume medis lengkap.' },
    { id: 'CLM-2026-8803', sep: '0301R0010326V000103', clusterCount: 1, patient: 'An. R**** (000412*****)', diagnosis: 'Demam Berdarah Dengue (A91)', icd9: '90.59', tariff_submitted: 6800000, tariff_approved: 6800000, status: 'LAYAK', note: 'Hasil trombosit serial terlampir dan sesuai standar.' },
    { id: 'CLM-2026-8804', sep: '0301R0010326V000104', clusterCount: 1, patient: 'Tn. A**** (000553*****)', diagnosis: 'Apendisitis Akut (K35.8)', icd9: '47.09', tariff_submitted: 14200000, tariff_approved: 0, status: 'DISPUTE', note: 'Perbedaan interpretasi kode komplikasi K35.3 vs K35.8.' },
    { id: 'CLM-2026-8805', sep: '0301R0010326V000105', clusterCount: 1, patient: 'Ny. D**** (000671*****)', diagnosis: 'Katarak Senilis (H25.0)', icd9: '13.41', tariff_submitted: 8900000, tariff_approved: 0, status: 'FRAUD_SUSPECT', note: 'Terdeteksi anomali geovelocity DPJP dan split-billing.' },
    { id: 'CLM-2026-8806', sep: '0301R0010326V000106', clusterCount: 1, patient: 'Tn. K**** (000789*****)', diagnosis: 'Hernia Inguinalis (K40.9)', icd9: '53.05', tariff_submitted: 11500000, tariff_approved: 11500000, status: 'LAYAK', note: 'Laporan operasi dan bukti billing farmasi terverifikasi.' },
  ];

  const mapClaimReportStatus = (c, triage) => {
    const raw = String(c?.status_verifikasi || c?.status || '').toUpperCase();
    if (['LAYAK_BAYAR', 'LOLOSKAN_KLAIM', 'SETUJUI_LAYAK', 'LAYAK'].includes(raw)) return 'LAYAK';
    if (['TIDAK_LAYAK_FRAUD', 'TOLAK_FRAUD', 'FRAUD_SUSPECT', 'AUDIT_LAPANGAN'].includes(raw)) return 'FRAUD_SUSPECT';
    if (['DISPUTE_TKMKB', 'DISPUTE_KODING', 'DISPUTE'].includes(raw)) return 'DISPUTE';
    if (['PENDING_KLARIFIKASI', 'KLARIFIKASI_FASKES', 'HOLD_KLARIFIKASI', 'PENDING'].includes(raw)) return 'PENDING';
    if (triage?.triage_lane === 'MERAH') return 'FRAUD_SUSPECT';
    if (triage?.triage_lane === 'KUNING') return 'PENDING';
    return 'LAYAK';
  };

  const statusBadgeLabels = {
    LAYAK: 'Layak Bayar',
    PENDING: 'Pending Berkas',
    DISPUTE: 'Dispute Koding',
    FRAUD_SUSPECT: 'Indikasi Fraud',
  };

  const hospitalFilteredClaims = claimsList.filter((item) => {
    const c = item?.claim || item;
    return !selectedHospital || c?.nama_faskes === selectedHospital;
  });
  const effectiveSourceClaims = hospitalFilteredClaims.length > 0 ? hospitalFilteredClaims : claimsList;

  const inferServiceLevel = (c) => {
    const explicit = String(c?.jenis_pelayanan || '').toUpperCase();
    if (explicit === 'RJTL' || explicit === 'RITL') return explicit;
    const cbg = String(c?.ina_cbg_code || c?.fkl30_kode_cbg || '').toUpperCase().trim();
    const parts = cbg.split('-');
    // Permenkes INA-CBG: group digit 2/3/5 or severity 0 (e.g. Z-3-12-0, Q-5-44-0) = RJTL; group 1/4 with I/II/III = RITL
    if (parts.length >= 4 && (parts[1] === '2' || parts[1] === '3' || parts[1] === '5' || parts[3] === '0')) {
      return 'RJTL';
    }
    return 'RITL';
  };

  const serviceLevelsInScope = new Set(
    effectiveSourceClaims.map((item) => inferServiceLevel(item?.claim || item))
  );
  const jenisPelayananLabel =
    serviceLevelsInScope.size === 1 && serviceLevelsInScope.has('RJTL')
      ? 'RJTL (Rawat Jalan Tingkat Lanjutan)'
      : serviceLevelsInScope.size === 1 && serviceLevelsInScope.has('RITL')
      ? 'RITL (Rawat Inap Tingkat Lanjutan)'
      : 'Campuran (RJTL & RITL)';

  const activeClaims = effectiveSourceClaims.length > 0 ? effectiveSourceClaims.slice(0, 15).map((item, i) => {
    const c = item?.claim || item;
    const triage = item?.triage || null;
    const mappedStatus = mapClaimReportStatus(c, triage);
    const submitted = Number(c?.nilai_klaim_rp ?? c?.fkl47_biaya_tagih ?? c?.billing_amount ?? (15000000 + i * 2500000));
    const approved = mappedStatus === 'LAYAK'
      ? Number(c?.fkl48_biaya_verifikasi ?? submitted)
      : 0;
    const clusterCount = Number(
      c?.episode_meta?.jumlah_klaim_klaster || (c?.claim_id === 'CLM-2026-8801' ? 85 : 1)
    );
    return {
      id: c?.claim_id || `CLM-2026-880${i + 1}`,
      sep: c?.fkl02_id_kunjungan || c?.sep_number || (c?.claim_id === 'CLM-2026-8801' ? '2608801001' : `0301R0010326V000${100 + i}`),
      clusterCount,
      patient: c?.pstv01_peserta_id
        ? `${String(c.pstv01_peserta_id).slice(0, 8)}****`
        : c?.peserta_token_aes
        ? `Peserta ${String(c.peserta_token_aes).slice(-6)}`
        : `Peserta P${i + 1}****`,
      diagnosis: c?.deskripsi_cbg ? `${c.icd10_primary || c.ina_cbg_code} (${c.ina_cbg_code})` : (c?.diagnosis || 'Diagnosis Klinis Terverifikasi'),
      icd9: (c?.icd9cm_procedure || c?.icd9_code || '99.04').split(' ')[0],
      tariff_submitted: submitted,
      tariff_approved: approved,
      status: mappedStatus,
      note: c?.catatan_verifikator || triage?.rekomendasi_sop || c?.recommendation || 'Audit penapisan pra-bayar selesai.',
    };
  }) : defaultClaims;

  const formatCaseCount = (list, defaultSuffix = '') => {
    if (!list.length) return defaultSuffix ? `0 ${defaultSuffix}` : '0';
    const totalSep = list.reduce((acc, item) => acc + Number(item.clusterCount || 1), 0);
    const hasCluster = list.some((item) => Number(item.clusterCount || 1) > 1);
    if (hasCluster) {
      return `${list.length} Klaster (${totalSep} SEP)`;
    }
    return defaultSuffix ? `${list.length} ${defaultSuffix}` : `${list.length}`;
  };

  const totalSubmitted = activeClaims.reduce((acc, c) => acc + (c.tariff_submitted || 0), 0);
  const totalApproved = activeClaims.reduce((acc, c) => acc + (c.tariff_approved || 0), 0);
  const totalPending = activeClaims.filter(c => c.status === 'PENDING').reduce((acc, c) => acc + (c.tariff_submitted || 0), 0);
  const totalDispute = activeClaims.filter(c => c.status === 'DISPUTE').reduce((acc, c) => acc + (c.tariff_submitted || 0), 0);

  const reportNow = new Date();
  const formattedDateShort = reportNow.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  const formattedDayName = reportNow.toLocaleDateString('id-ID', { weekday: 'long' });
  const formattedDateLong = reportNow.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const verifiedTimestampIso = reportNow.toISOString();
  const docPeriodCode = `${String(reportNow.getMonth() + 1).padStart(2, '0')}${String(reportNow.getFullYear()).slice(-2)}`;
  const docRomanMonth = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][reportNow.getMonth()] || 'XI';

  useEffect(() => {
    let alive = true;
    const seedPayload = `${selectedHospital}|${selectedHospitalMeta?.code || ''}|${selectedBatch}|${activeTab}|${activeClaims.length}|${totalSubmitted}|${totalApproved}`;
    if (typeof window !== 'undefined' && window.crypto?.subtle && typeof TextEncoder !== 'undefined') {
      window.crypto.subtle
        .digest('SHA-256', new TextEncoder().encode(seedPayload))
        .then((buf) => {
          if (!alive) return;
          const hex = Array.from(new Uint8Array(buf))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          setSha256Seal(hex);
        })
        .catch(() => {});
    }
    return () => { alive = false; };
  }, [selectedHospital, selectedBatch, activeTab, activeClaims.length, totalSubmitted, totalApproved, selectedHospitalMeta?.code]);

  const formatIDR = (num) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenServerPrintable = async (endpointPath, fallbackName) => {
    setServerPrintBusy(true);
    setReportNotice('');
    try {
      const params = new URLSearchParams({
        signer_name: currentUser?.name || 'dr. Siti Rahma, Sp.PK',
        signer_nip: currentUser?.nip || '19870420 201101 2 001',
      });
      if (selectedBatch) {
        params.set('no_fpk', selectedBatch);
      }
      const res = await authFetch(`${API_BASE_URL}${endpointPath}?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const htmlStr = data?.html_printable;
      if (!htmlStr) throw new Error('Templat cetak server kosong');
      const win = typeof window !== 'undefined' ? window.open('', '_blank', 'width=1024,height=780') : null;
      if (win) {
        win.document.open();
        win.document.write(htmlStr);
        win.document.close();
        win.focus();
        setReportNotice(`Templat resmi ${fallbackName} dibuka dari server.`);
      } else {
        const blob = new Blob([htmlStr], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fallbackName || `Dokumen_BAHV_${selectedBatch || 'Kolektif'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setReportNotice(`Berkas resmi ${fallbackName} berhasil diunduh.`);
      }
    } catch (err) {
      setReportNotice(`Gagal memuat pratinjau cetak server (${err?.message || 'offline'}).`);
    } finally {
      setServerPrintBusy(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['No. SEP', 'Peserta', 'Diagnosis', 'ICD-9', 'Tarif Diajukan (Rp)', 'Tarif Disetujui (Rp)', 'Status', 'Catatan'];
    const rows = activeClaims.map((c) => [
      c.sep,
      c.patient,
      c.diagnosis,
      c.icd9,
      c.tariff_submitted,
      c.tariff_approved,
      statusBadgeLabels[c.status] || c.status,
      c.note,
    ]);
    exportCsvFile({
      filename: `Laporan_${activeTab}_${selectedBatch || 'Kolektif'}.csv`,
      headers,
      rows,
    });
    setReportNotice('Lampiran CSV berhasil diunduh.');
  };

  const copyHash = () => {
    navigator.clipboard.writeText(ledgerHeadHash || sha256Seal);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* ACTION HEADER (NO PRINT) */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Kembali ke konsol putusan"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
                PENGAWASAN RESMI BPJS
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Dokumen & Laporan Kedinasan BPJS Kesehatan
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Format baku Berita Acara Hasil Verifikasi Klaim Kolektif &amp; Tindak Lanjut Perpres No. 82/2018
              {reportNotice ? ` · ${reportNotice}` : ''}
            </p>
          </div>
        </div>

        {/* PRINT & EXPORT BUTTONS */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={copyHash}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{copyFeedback ? 'Hash Tersalin!' : 'Salin SHA-256'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Unduh CSV</span>
          </button>
          <button
            type="button"
            disabled={serverPrintBusy}
            onClick={() => handleOpenServerPrintable(
              activeTab === 'ba-pending' ? '/api/v1/vedika/ba-pending-printable' : '/api/v1/vedika/fpk-bahv-printable',
              activeTab === 'ba-pending' ? `BA_Pending_${selectedBatch || 'Kolektif'}.html` : `BAHV_${selectedBatch || 'Kolektif'}.html`
            )}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer disabled:opacity-60"
          >
            <FileText className="w-4 h-4" />
            <span>{serverPrintBusy ? 'Memuat...' : 'Pratinjau VEDIKA Server'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen Resmi</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS & REPORT TYPE TABS (NO PRINT) */}
      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
        {/* TABS SELECTOR */}
        <div className="space-y-1">
          <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Jenis Dokumen Kedinasan:
          </span>
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('bahv-kolektif')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'bahv-kolektif'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              BAHV Kolektif
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ba-pending')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'ba-pending'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              BA Pending
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sp1-audit')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'sp1-audit'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              SP-1 VPK
            </button>
          </div>
        </div>

        {/* HOSPITAL SELECTOR */}
        <div className="space-y-1">
          <label htmlFor="official-report-hospital" className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Fasilitas Kesehatan Rujukan (FKRTL):
          </label>
          <SearchableCombobox
            id="official-report-hospital"
            ariaLabel="Cari Fasilitas Kesehatan Rujukan (FKRTL)"
            value={selectedHospital}
            onChange={(val) => setSelectedHospital(val)}
            options={hospitals.map((h) => ({ value: h.id, label: h.name, sublabel: h.id }))}
            placeholder="Ketik nama / kode RS FKRTL..."
            isLight={isLight}
          />
        </div>

        {/* BATCH SELECTOR */}
        <div className="space-y-1">
          <label htmlFor="official-report-batch" className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Nomor Batch Formulir Pengajuan Klaim (FPK):
          </label>
          <SearchableCombobox
            id="official-report-batch"
            ariaLabel="Cari Nomor Batch FPK"
            value={selectedBatch}
            onChange={(val) => setSelectedBatch(val)}
            options={batches.map((b) => ({ value: b.id, label: b.label, sublabel: b.id }))}
            placeholder="Ketik nomor FPK / periode..."
            isLight={isLight}
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* OFFICIAL PRINTABLE DOCUMENT PAPER CONTAINER              */}
      {/* ======================================================== */}
      <div className="printable-document bg-white text-slate-950 p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-xl max-w-5xl mx-auto font-sans leading-relaxed">
        
        {/* KOP SURAT RESMI BPJS KESEHATAN */}
        <div className="border-b-4 border-double border-slate-900 pb-5 mb-6 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mb-2">
            <div className="w-20 h-20 shrink-0 flex items-center justify-center p-1 border border-slate-200 rounded-lg">
              <img 
                src="/assets/images/bpjs_icon.png" 
                alt="BPJS Kesehatan" 
                className="w-full h-full object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-extrabold uppercase tracking-wider text-slate-950">
                BADAN PENYELENGGARA JAMINAN SOSIAL KESEHATAN
              </h1>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                KEDEPUTIAN WILAYAH JABODETABEK · KANTOR CABANG UTAMA
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Gedung Terpadu BPJS Kesehatan Lt. 4, Jl. Letjen Suprapto Kav. 20, Cempaka Putih, Jakarta Pusat
              </p>
              <p className="text-[11px] text-slate-500">
                Telepon: (021) 5000-0000 (Simulasi) · Call Center: 165 · Portal: claimtrace.bpjs.test · Data Berita Acara Uji Sintetis (UU PDP No. 27/2022)
              </p>
            </div>
            <div className="w-20 shrink-0 text-right">
              <div className="p-1 border border-slate-300 rounded inline-block">
                <QrCode className="w-16 h-16 text-slate-800" />
                <span className="block text-[8px] font-mono font-bold text-center mt-0.5">CLAIMTRACE-SEAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* DOKUMEN TIPE 1: BAHV KOLEKTIF */}
        {activeTab === 'bahv-kolektif' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-base font-display font-bold uppercase underline decoration-2 underline-offset-4 tracking-wide">
                BERITA ACARA HASIL VERIFIKASI KLAIM (BAHV) KOLEKTIF
              </h3>
              <p className="text-xs font-mono text-slate-700">
                Nomor: 0428/BAHV/WASRIK/{docPeriodCode} · Kode FPK: {selectedBatch || 'Kolektif Seluruh FPK'}
              </p>
            </div>

            <p className="text-xs leading-relaxed text-justify">
              Pada hari ini, <strong>{formattedDayName}</strong> tanggal <strong>{formattedDateLong} ({formattedDateShort})</strong>, bertempat di Kantor Cabang BPJS Kesehatan, telah dilakukan audit dan penapisan anomali pra-pembayaran klaim JKN terhadap berkas pengajuan klaim Formulir Pengajuan Klaim (FPK) dari:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p><span className="text-slate-500 w-32 inline-block">Nama Faskes / RS:</span> <strong>{selectedHospitalMeta?.id || selectedHospital}</strong></p>
                <p><span className="text-slate-500 w-32 inline-block">Kode PPK Faskes:</span> <span className="font-mono font-bold">{selectedHospitalMeta?.code || 'FSK-RSX-01'}</span></p>
                <p><span className="text-slate-500 w-32 inline-block">Jenis Pelayanan:</span> {jenisPelayananLabel}</p>
              </div>
              <div>
                <p><span className="text-slate-500 w-32 inline-block">Periode Pelayanan:</span> {batches.find((b) => b.id === selectedBatch)?.label || (selectedBatch || 'Semua Batch Aktif')}</p>
                <p><span className="text-slate-500 w-32 inline-block">Nomor Batch FPK:</span> {selectedBatch || 'Kolektif Seluruh FPK'}</p>
                <p><span className="text-slate-500 w-32 inline-block">Tanggal Selesai Verif:</span> {formattedDateLong}</p>
              </div>
            </div>

            {/* TABEL REKAPITULASI RESMI */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Rekapitulasi Hasil Verifikasi Kolektif FPK:
              </h4>
              <table className="w-full text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 text-left">
                    <th className="p-2 border-r border-slate-300">Kategori Putusan</th>
                    <th className="p-2 border-r border-slate-300 text-center">Jumlah Kasus</th>
                    <th className="p-2 border-r border-slate-300 text-right">Nilai Pengajuan (Rp)</th>
                    <th className="p-2 border-r border-slate-300 text-right">Nilai Disetujui (Rp)</th>
                    <th className="p-2 text-right">Selisih Rekonsiliasi (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 border-r border-slate-200 font-semibold text-emerald-800">1. Layak Bayar (Disetujui Penuh)</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold">{formatCaseCount(activeClaims.filter(c => c.status === 'LAYAK'))}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">{formatIDR(totalApproved)}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-800">{formatIDR(totalApproved)}</td>
                    <td className="p-2 text-right font-mono text-slate-500">Rp 0</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-200 font-semibold text-amber-800">2. Pending (Penundaan Berkas)</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold">{formatCaseCount(activeClaims.filter(c => c.status === 'PENDING'))}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">{formatIDR(totalPending)}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">Rp 0</td>
                    <td className="p-2 text-right font-mono text-amber-700">-{formatIDR(totalPending)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-200 font-semibold text-indigo-800">3. Dispute (Klaim Sengketa Koding)</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold">{formatCaseCount(activeClaims.filter(c => c.status === 'DISPUTE'))}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">{formatIDR(totalDispute)}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">Rp 0</td>
                    <td className="p-2 text-right font-mono text-indigo-700">-{formatIDR(totalDispute)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-200 font-semibold text-rose-800">4. Dugaan Fraud / Tidak Layak</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold">{formatCaseCount(activeClaims.filter(c => c.status === 'FRAUD_SUSPECT'))}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">{formatIDR(activeClaims.filter(c => c.status === 'FRAUD_SUSPECT').reduce((a,b)=>a+b.tariff_submitted, 0))}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">Rp 0</td>
                    <td className="p-2 text-right font-mono text-rose-700 font-bold">Ditahan</td>
                  </tr>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <td className="p-2 border-r border-slate-300">TOTAL FORMULIR PENGAJUAN KLAIM</td>
                    <td className="p-2 border-r border-slate-300 text-center">{formatCaseCount(activeClaims, 'Kasus')}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono">{formatIDR(totalSubmitted)}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono text-emerald-800">{formatIDR(totalApproved)}</td>
                    <td className="p-2 text-right font-mono text-rose-700">-{formatIDR(totalSubmitted - totalApproved)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* RINCIAN INDIVIDUAL SAMPEL KASUS */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Daftar Lampiran Kasus FPK Terpilih:
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-300 text-left">
                      <th className="p-1.5 border-r border-slate-300">No. SEP</th>
                      <th className="p-1.5 border-r border-slate-300">Peserta (Masked)</th>
                      <th className="p-1.5 border-r border-slate-300">Diagnosis & ICD</th>
                      <th className="p-1.5 border-r border-slate-300 text-right">Diajukan</th>
                      <th className="p-1.5 border-r border-slate-300 text-right">Disetujui</th>
                      <th className="p-1.5 border-r border-slate-300 text-center">Status</th>
                      <th className="p-1.5">Catatan Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeClaims.map((c) => {
                      const isCluster = Number(c.clusterCount || 1) > 1;
                      const sepLabel = isCluster
                        ? `${c.sep}–${String(c.clusterCount).padStart(3, '0')} (${c.clusterCount} SEP)`
                        : c.sep;
                      const unitTariff = isCluster ? Math.round((c.tariff_submitted || 0) / c.clusterCount) : 0;
                      return (
                      <tr key={c.id}>
                        <td className="p-1.5 border-r border-slate-200 font-mono">{sepLabel}</td>
                        <td className="p-1.5 border-r border-slate-200">{c.patient}</td>
                        <td className="p-1.5 border-r border-slate-200">{c.diagnosis} ({c.icd9})</td>
                        <td className="p-1.5 border-r border-slate-200 text-right font-mono">
                          <div>{formatIDR(c.tariff_submitted)}</div>
                          {isCluster && (
                            <div className="text-[9px] text-slate-500">
                              @ {formatIDR(unitTariff)} × {c.clusterCount} SEP
                            </div>
                          )}
                        </td>
                        <td className="p-1.5 border-r border-slate-200 text-right font-mono font-bold text-emerald-700">{formatIDR(c.tariff_approved)}</td>
                        <td className="p-1.5 border-r border-slate-200 text-center">
                          <span className={`px-1 py-0.5 rounded font-bold text-[9px] ${
                            c.status === 'LAYAK' ? 'bg-emerald-100 text-emerald-800' :
                            c.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            c.status === 'DISPUTE' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {statusBadgeLabels[c.status] || c.status}
                          </span>
                        </td>
                        <td className="p-1.5 text-slate-600">{c.note}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DASAR HUKUM */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] space-y-1">
              <p className="font-bold text-slate-800">Dasar Hukum & Ketentuan Kepatuhan:</p>
              <p className="text-slate-600">
                1. Peraturan Presiden No. 82 Tahun 2018 tentang Jaminan Kesehatan Pasal 74 s.d. 76.<br />
                2. Peraturan Menteri Kesehatan No. 26 Tahun 2021 tentang Pedoman Pencegahan dan Penanganan Kecurangan JKN.<br />
                3. Berkas digital dilindungi kepatuhan Zero-PHI sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
              </p>
            </div>

            {/* TANDA TANGAN LEGAL */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-center">
              <div className="space-y-16">
                <div>
                  <p className="text-slate-600">Pihak Fasilitas Kesehatan (FKRTL),</p>
                  <p className="font-bold">Direktur Utama {selectedHospital}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold underline">dr. Hendra Gunawan, Sp.B, MARS</p>
                  <p className="text-[10px] text-slate-500 font-mono">SIP: 503/4412/SIP.D/2021</p>
                </div>
              </div>

              <div className="space-y-16">
                <div>
                  <p className="text-slate-600">Pihak BPJS Kesehatan,</p>
                  <p className="font-bold">Verifikator Medis Senior Kedinasan</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold underline">{currentUser?.name || 'dr. Siti Rahma, Sp.PK'}</p>
                  <p className="text-[10px] text-slate-500 font-mono">NIP: {currentUser?.nip || '19870420 201101 2 001'}</p>
                </div>
              </div>
            </div>

            {/* CRYPTOGRAPHIC AUDIT SEAL */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[9px] text-slate-600 font-mono">
              <span>SHA-256 INTEGRITY SEAL: {ledgerHeadHash || sha256Seal}</span>
              <span>VERIFIED TIMESTAMP: {verifiedTimestampIso}</span>
            </div>
          </div>
        )}

        {/* DOKUMEN TIPE 2: BA PENDING */}
        {activeTab === 'ba-pending' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-base font-display font-bold uppercase underline decoration-2 underline-offset-4 tracking-wide">
                BERITA ACARA PENUNDAAN KLAIM (BA PENDING)
              </h3>
              <p className="text-xs font-mono text-slate-700">
                Nomor: 0118/BA-PENDING/WASRIK/{docPeriodCode} · Ref FPK: {selectedBatch || 'Kolektif Seluruh FPK'}
              </p>
            </div>

            <p className="text-xs leading-relaxed text-justify">
              Menindaklanjuti proses penapisan dan audit klaim pra-pembayaran JKN, bersama ini disampaikan daftar klaim yang <strong>DITUNDA PEMBAYARANNYA (PENDING)</strong> kepada <strong>{selectedHospital}</strong> dikarenakan belum memenuhi kelengkapan berkas administrasi dan/atau pembuktian medis klinis sebagaimana disyaratkan dalam Pedoman Verifikasi BPJS Kesehatan.
            </p>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Daftar Klaim Pending &amp; Bukti Kelengkapan yang Wajib Dipenuhi:
              </h4>
              <table className="w-full text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-left">
                    <th className="p-2 border-r border-slate-300">Nomor SEP</th>
                    <th className="p-2 border-r border-slate-300">Diagnosa Diajukan</th>
                    <th className="p-2 border-r border-slate-300 text-right">Tarif Ditunda</th>
                    <th className="p-2 border-r border-slate-300">Kekurangan Berkas / Alasan Pending</th>
                    <th className="p-2 text-center">Batas Waktu Revisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(activeClaims.filter((c) => c.status === 'PENDING' || c.status === 'DISPUTE').length > 0
                    ? activeClaims.filter((c) => c.status === 'PENDING' || c.status === 'DISPUTE')
                    : activeClaims.slice(0, 2)
                  ).map((pc) => (
                    <tr key={pc.id}>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold">{pc.sep}</td>
                      <td className="p-2 border-r border-slate-200">{pc.diagnosis}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-amber-800">{formatIDR(pc.tariff_submitted)}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-700">{pc.note}</td>
                      <td className="p-2 text-center font-bold text-rose-700">14 Hari Kerja</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs leading-relaxed text-justify">
              Sesuai dengan ketentuan regulasi JKN, pihak FKRTL diberikan batas waktu maksimal <strong>14 (empat belas) hari kerja</strong> sejak Berita Acara ini diterbitkan untuk melengkapi dan mengunggah kembali dokumen perbaikan melalui portal pengajuan klaim resmi BPJS Kesehatan. Apabila sampai batas waktu tersebut berkas tidak dilengkapi, klaim akan diputuskan <strong>TIDAK LAYAK BAYAR</strong>.
            </p>

            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-center">
              <div className="space-y-16">
                <p className="font-bold">Menerima dan Mengetahui,<br />Pihak RS {selectedHospital}</p>
                <p className="font-bold underline">Manager Pelayanan Pasien (MPP)</p>
              </div>
              <div className="space-y-16">
                <p className="font-bold">Diterbitkan Oleh,<br />Verifikator Medis BPJS Kesehatan</p>
                <div className="space-y-0.5">
                  <p className="font-bold underline">{currentUser?.name || 'dr. Siti Rahma, Sp.PK'}</p>
                  <p className="text-[10px] text-slate-500 font-mono">NIP: {currentUser?.nip || '19870420 201101 2 001'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOKUMEN TIPE 3: SP-1 VPK */}
        {activeTab === 'sp1-audit' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black uppercase underline decoration-2 underline-offset-4 tracking-wide text-rose-950">
                SURAT PERINGATAN TINGKAT I (SP-1) PENGAWASAN KLAIM JKN
              </h3>
              <p className="text-xs font-mono text-slate-700">
                Nomor: 0092/SP1-VPK/{docRomanMonth}/{docPeriodCode} · Klasifikasi: RAHASIA / PERINGATAN FORMAL
              </p>
            </div>

            <div className="text-xs space-y-1 bg-rose-50 border border-rose-200 p-4 rounded-xl">
              <p><strong>Kepada Yth:</strong> Direktur Utama {selectedHospital}</p>
              <p><strong>Perihal:</strong> Peringatan Audit Indikasi Pola Klaim Anomali Berulang (Phantom Billing / Upcoding)</p>
              <p><strong>Lampiran:</strong> 1 (Satu) Berkas Hasil Investigasi Algoritmik ClaimTrace JKN</p>
            </div>

            <p className="text-xs leading-relaxed text-justify">
              Berdasarkan hasil penapisan algoritmik 3-lapis mesin <strong>ClaimTrace JKN</strong> terhadap pengajuan FPK periode berjalan, Tim Pengawasan dan Pencegahan Kecurangan JKN menemukan indikasi pola anomali kepatuhan berat yang bertentangan dengan <strong>PMK No. 26 Tahun 2021</strong>, antara lain:
            </p>

            <ul className="list-disc list-inside text-xs space-y-1.5 pl-2 text-slate-800">
              <li>
                <strong>Ikhtisar Klaster Temuan ({selectedHospital}):</strong> Terdapat{' '}
                {activeClaims.filter((c) => c.status === 'FRAUD_SUSPECT').length} berkas berindikasi risiko tinggi/fraud dan{' '}
                {activeClaims.filter((c) => c.status === 'PENDING' || c.status === 'DISPUTE').length} berkas pending/dispute dengan total nilai pengajuan ditahan sebesar{' '}
                {formatIDR(totalSubmitted - totalApproved)}.
              </li>
              {activeClaims.filter((c) => c.status !== 'LAYAK').slice(0, 2).map((item) => (
                <li key={item.id}>
                  <strong>Berkas {item.id} (SEP {item.sep}):</strong> {item.diagnosis} senilai {formatIDR(item.tariff_submitted)} · Catatan Verifikator: {item.note}
                </li>
              ))}
              <li>
                <strong>Kepatuhan Konfirmasi Mobile JKN &amp; Rekam Medis:</strong> FKRTL wajib menyerahkan bukti pendukung sah serta rekonsiliasi kehadiran peserta sesuai Perpres No. 82 Tahun 2018.
              </li>
            </ul>

            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-1 text-amber-900">
              <p className="font-bold">PERINTAH TINDAK LANJUT RESMI:</p>
              <p>
                1. Memerintahkan komite medik FKRTL untuk melakukan audit internal dalam waktu 7 (tujuh) hari kerja.<br />
                2. Menunda pembayaran atas klaster klaim yang terindikasi hingga Berita Acara Klarifikasi Bersama (BAKB) selesai.<br />
                3. Menghadiri rapat koordinasi audit faktual bersama Kedeputian Wasrik BPJS Kesehatan.
              </p>
            </div>

            <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-center">
              <div className="space-y-16">
                <p className="font-bold">Mengetahui,<br />Deputi Direksi Wilayah BPJS Kesehatan</p>
                <p className="font-bold underline">Pejabat Pengawas Wilayah Terotorisasi</p>
              </div>
              <div className="space-y-16">
                <p className="font-bold">Pemeriksa Investigasi,<br />{currentUser?.roleTitle || currentUser?.role || 'Verifikator Medis BPJS Kesehatan'}</p>
                <div className="space-y-0.5">
                  <p className="font-bold underline">{currentUser?.name || 'dr. Siti Rahma, Sp.PK'}</p>
                  <p className="text-[10px] text-slate-600 font-mono">NIP: {currentUser?.nip || '19870420 201101 2 001'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-document, .printable-document * {
            visibility: visible;
          }
          .printable-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20mm;
            border: none;
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
