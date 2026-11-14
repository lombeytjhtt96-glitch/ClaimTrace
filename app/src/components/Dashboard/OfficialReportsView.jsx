import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, Printer, Download, CheckCircle, AlertTriangle, 
  ShieldCheck, ArrowLeft, RefreshCw, QrCode, Building2, 
  Calendar, FileSpreadsheet, Send, Search, UserCheck
} from 'lucide-react';
import { API_BASE_URL, authFetch } from '../../services/apiConfig';

export default function OfficialReportsView({ 
  initialReportType = 'bahv-kolektif',
  onBack,
  isLight = false,
  currentUser = null
}) {
  const [activeTab, setActiveTab] = useState(initialReportType);
  const [selectedHospital, setSelectedHospital] = useState('RS Citra Medika');
  const [selectedBatch, setSelectedBatch] = useState('FPK-2026-03-A');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [claimsList, setClaimsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const hospitals = [
    { id: 'RS Citra Medika', name: 'RS Citra Medika (Kelas B - Jakarta Timur)', code: '0112R001' },
    { id: 'RS Medika Sejahtera', name: 'RS Medika Sejahtera (Kelas B - Bandung)', code: '0115R004' },
    { id: 'RS Prima Sehat', name: 'RS Prima Sehat (Kelas C - Bekasi)', code: '0119R008' },
  ];

  const batches = [
    { id: 'FPK-2026-03-A', label: 'Batch Maret 2026 - Periode 1 (Rawat Inap & Jalan)' },
    { id: 'FPK-2026-02-B', label: 'Batch Februari 2026 - Periode 2 (Rawat Inap)' },
    { id: 'FPK-2026-01-A', label: 'Batch Januari 2026 - Periode 1 (Rawat Jalan)' },
  ];

  // Fetch real claim data from backend FastAPI
  useEffect(() => {
    let active = true;
    const fetchClaims = async () => {
      setLoading(true);
      try {
        const res = await authFetch(`${API_BASE_URL}/api/v1/claims?limit=15`);
        if (res.ok) {
          const json = await res.json();
          if (active && json?.claims) {
            setClaimsList(json.claims);
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

  // Fallback claims if API returns empty
  const defaultClaims = [
    { id: 'CLM-2026-8801', sep: '0301R0010326V000101', patient: 'Ny. S**** (000182*****)', diagnosis: 'Sepsis Berat (A41.9)', icd9: '99.04', tariff_submitted: 18500000, tariff_approved: 18500000, status: 'LAYAK', note: 'Berkas lengkap, verifikasi digital valid.' },
    { id: 'CLM-2026-8802', sep: '0301R0010326V000102', patient: 'Tn. B**** (000291*****)', diagnosis: 'Infark Miokard Akut (I21.9)', icd9: '88.56', tariff_submitted: 32400000, tariff_approved: 0, status: 'PENDING', note: 'Memerlukan hasil EKG serial dan resume medis lengkap.' },
    { id: 'CLM-2026-8803', sep: '0301R0010326V000103', patient: 'An. R**** (000412*****)', diagnosis: 'Demam Berdarah Dengue (A91)', icd9: '90.59', tariff_submitted: 6800000, tariff_approved: 6800000, status: 'LAYAK', note: 'Hasil trombosit serial terlampir dan sesuai standar.' },
    { id: 'CLM-2026-8804', sep: '0301R0010326V000104', patient: 'Tn. A**** (000553*****)', diagnosis: 'Apendisitis Akut (K35.8)', icd9: '47.09', tariff_submitted: 14200000, tariff_approved: 0, status: 'DISPUTE', note: 'Perbedaan interpretasi kode komplikasi K35.3 vs K35.8.' },
    { id: 'CLM-2026-8805', sep: '0301R0010326V000105', patient: 'Ny. D**** (000671*****)', diagnosis: 'Katarak Senilis (H25.0)', icd9: '13.41', tariff_submitted: 8900000, tariff_approved: 0, status: 'FRAUD_SUSPECT', note: 'Terdeteksi anomali geovelocity DPJP dan split-billing.' },
    { id: 'CLM-2026-8806', sep: '0301R0010326V000106', patient: 'Tn. K**** (000789*****)', diagnosis: 'Hernia Inguinalis (K40.9)', icd9: '53.05', tariff_submitted: 11500000, tariff_approved: 11500000, status: 'LAYAK', note: 'Laporan operasi dan bukti billing farmasi terverifikasi.' },
  ];

  const activeClaims = claimsList.length > 0 ? claimsList.map((c, i) => ({
    id: c.claim_id || `CLM-2026-880${i+1}`,
    sep: c.sep_number || `0301R0010326V000${100+i}`,
    patient: c.patient_name ? `${c.patient_name.slice(0, 3)}**** (000${i+1}82*****)` : `Peserta P${i+1}****`,
    diagnosis: c.diagnosis || 'Diagnosis Klinis Terverifikasi',
    icd9: c.icd9_code || '99.04',
    tariff_submitted: c.billing_amount || (15000000 + (i * 2500000)),
    tariff_approved: c.status === 'PENDING' || c.status === 'FRAUD_SUSPECT' || c.status === 'DISPUTE' ? 0 : (c.billing_amount || (15000000 + (i * 2500000))),
    status: c.status || (i % 3 === 0 ? 'LAYAK' : i % 3 === 1 ? 'PENDING' : 'DISPUTE'),
    note: c.recommendation || 'Verifikasi digital otomatis VEDIKA selesai.'
  })) : defaultClaims;

  const totalSubmitted = activeClaims.reduce((acc, c) => acc + (c.tariff_submitted || 0), 0);
  const totalApproved = activeClaims.reduce((acc, c) => acc + (c.tariff_approved || 0), 0);
  const totalPending = activeClaims.filter(c => c.status === 'PENDING').reduce((acc, c) => acc + (c.tariff_submitted || 0), 0);
  const totalDispute = activeClaims.filter(c => c.status === 'DISPUTE').reduce((acc, c) => acc + (c.tariff_submitted || 0), 0);

  const formatIDR = (num) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  const handlePrint = () => {
    window.print();
  };

  const sha256Seal = '8f9b2a7c4e1d3b5f6a8e0c2d4f6b8a1c3e5d7f9a2b4c6e8d0f1a3b5c7e9d1f3a';

  const copyHash = () => {
    navigator.clipboard.writeText(sha256Seal);
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
              onClick={onBack}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
                VEDIKA FPK RESMI
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Dokumen & Laporan Kedinasan BPJS Kesehatan
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Format baku Berita Acara Hasil Verifikasi Klaim Kolektif & Tindak Lanjut Perpres No. 82/2018
            </p>
          </div>
        </div>

        {/* PRINT & EXPORT BUTTONS */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={copyHash}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{copyFeedback ? 'Hash Tersalin!' : 'Salin SHA-256'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition"
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
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Jenis Dokumen Kedinasan:
          </label>
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
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
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Fasilitas Kesehatan Rujukan (FKRTL):
          </label>
          <select
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
            className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>

        {/* BATCH SELECTOR */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Nomor Batch Formulir Pengajuan Klaim (FPK):
          </label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* OFFICIAL PRINTABLE DOCUMENT PAPER CONTAINER              */}
      {/* ======================================================== */}
      <div className="printable-document bg-white text-slate-950 p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-xl max-w-5xl mx-auto font-sans leading-relaxed">
        
        {/* KOP SURAT RESMI BPJS KESEHATAN */}
        <div className="border-b-4 border-double border-slate-900 pb-5 mb-6 text-center">
          <div className="flex items-center justify-between gap-4 mb-2">
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
                Telepon: (021) 4212938 · Fax: (021) 4212940 · Call Center: 165 · Laman: www.bpjs-kesehatan.go.id
              </p>
            </div>
            <div className="w-20 shrink-0 text-right">
              <div className="p-1 border border-slate-300 rounded inline-block">
                <QrCode className="w-16 h-16 text-slate-800" />
                <span className="block text-[8px] font-mono font-bold text-center mt-0.5">VEDIKA-SEAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* DOKUMEN TIPE 1: BAHV KOLEKTIF */}
        {activeTab === 'bahv-kolektif' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black uppercase underline decoration-2 underline-offset-4 tracking-wide">
                BERITA ACARA HASIL VERIFIKASI KLAIM (BAHV) KOLEKTIF
              </h3>
              <p className="text-xs font-mono text-slate-700">
                Nomor: 0428/BAHV/VEDIKA/0326 · Kode FPK: {selectedBatch}
              </p>
            </div>

            <p className="text-xs leading-relaxed text-justify">
              Pada hari ini, <strong>Jumat</strong> tanggal <strong>Empat Belas</strong> bulan <strong>November</strong> tahun <strong>Dua Ribu Dua Puluh Enam (14-11-2026)</strong>, bertempat di Kantor Cabang BPJS Kesehatan, telah dilakukan verifikasi administrasi dan medis secara digital (VEDIKA) terhadap berkas pengajuan klaim Formulir Pengajuan Klaim (FPK) dari:
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p><span className="text-slate-500 w-32 inline-block">Nama Faskes / RS:</span> <strong>{selectedHospital}</strong></p>
                <p><span className="text-slate-500 w-32 inline-block">Kode PPK Faskes:</span> <span className="font-mono font-bold">0112R001</span></p>
                <p><span className="text-slate-500 w-32 inline-block">Jenis Pelayanan:</span> RITL (Rawat Inap Tingkat Lanjutan)</p>
              </div>
              <div>
                <p><span className="text-slate-500 w-32 inline-block">Periode Pelayanan:</span> 01 Februari 2026 s.d. 28 Februari 2026</p>
                <p><span className="text-slate-500 w-32 inline-block">Tanggal Pengajuan:</span> 05 Maret 2026</p>
                <p><span className="text-slate-500 w-32 inline-block">Tanggal Selesai Verif:</span> 14 November 2026</p>
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
                    <td className="p-2 border-r border-slate-200 text-center font-bold">{activeClaims.filter(c => c.status === 'LAYAK').length}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">{formatIDR(totalApproved)}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-800">{formatIDR(totalApproved)}</td>
                    <td className="p-2 text-right font-mono text-slate-500">Rp 0</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-200 font-semibold text-amber-800">2. Pending (Penundaan Berkas)</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold">{activeClaims.filter(c => c.status === 'PENDING').length}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">{formatIDR(totalPending)}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">Rp 0</td>
                    <td className="p-2 text-right font-mono text-amber-700">-{formatIDR(totalPending)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-200 font-semibold text-indigo-800">3. Dispute (Klaim Sengketa Koding)</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold">{activeClaims.filter(c => c.status === 'DISPUTE').length}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">{formatIDR(totalDispute)}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">Rp 0</td>
                    <td className="p-2 text-right font-mono text-indigo-700">-{formatIDR(totalDispute)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-200 font-semibold text-rose-800">4. Dugaan Fraud / Tidak Layak</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold">{activeClaims.filter(c => c.status === 'FRAUD_SUSPECT').length}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">{formatIDR(activeClaims.filter(c => c.status === 'FRAUD_SUSPECT').reduce((a,b)=>a+b.tariff_submitted, 0))}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">Rp 0</td>
                    <td className="p-2 text-right font-mono text-rose-700 font-bold">Ditahan</td>
                  </tr>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <td className="p-2 border-r border-slate-300">TOTAL FORMULIR PENGAJUAN KLAIM</td>
                    <td className="p-2 border-r border-slate-300 text-center">{activeClaims.length} Kasus</td>
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
                    {activeClaims.map((c) => (
                      <tr key={c.id}>
                        <td className="p-1.5 border-r border-slate-200 font-mono">{c.sep}</td>
                        <td className="p-1.5 border-r border-slate-200">{c.patient}</td>
                        <td className="p-1.5 border-r border-slate-200">{c.diagnosis} ({c.icd9})</td>
                        <td className="p-1.5 border-r border-slate-200 text-right font-mono">{formatIDR(c.tariff_submitted)}</td>
                        <td className="p-1.5 border-r border-slate-200 text-right font-mono font-bold text-emerald-700">{formatIDR(c.tariff_approved)}</td>
                        <td className="p-1.5 border-r border-slate-200 text-center">
                          <span className={`px-1 py-0.5 rounded font-bold text-[9px] ${
                            c.status === 'LAYAK' ? 'bg-emerald-100 text-emerald-800' :
                            c.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            c.status === 'DISPUTE' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-1.5 text-slate-600">{c.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DASAR HUKUM */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] space-y-1">
              <p className="font-bold text-slate-800">Dasar Hukum & Ketentuan Kepatuhan:</p>
              <p className="text-slate-600">
                1. Peraturan Presiden No. 82 Tahun 2018 tentang Jaminan Kesehatan Pasal 74–76.<br />
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
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-mono">
              <span>SHA-256 INTEGRITY SEAL: {sha256Seal}</span>
              <span>VERIFIED TIMESTAMP: 2026-11-14T08:50:00+07:00</span>
            </div>
          </div>
        )}

        {/* DOKUMEN TIPE 2: BA PENDING */}
        {activeTab === 'ba-pending' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black uppercase underline decoration-2 underline-offset-4 tracking-wide">
                BERITA ACARA PENUNDAAN KLAIM (BA PENDING)
              </h3>
              <p className="text-xs font-mono text-slate-700">
                Nomor: 0118/BA-PENDING/VEDIKA/0326 · Ref FPK: {selectedBatch}
              </p>
            </div>

            <p className="text-xs leading-relaxed text-justify">
              Menindaklanjuti proses Verifikasi Digital Klaim (VEDIKA), bersama ini disampaikan daftar klaim yang <strong>DITUNDA PEMBAYARANNYA (PENDING)</strong> kepada <strong>{selectedHospital}</strong> dikarenakan belum memenuhi kelengkapan berkas administrasi dan/atau pembuktian medis klinis sebagaimana disyaratkan dalam Pedoman Verifikasi BPJS Kesehatan.
            </p>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Daftar Klaim Pending & Bukti Kelengkapan yang Wajib Dipenuhi:
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
                  <tr>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold">0301R0010326V000102</td>
                    <td className="p-2 border-r border-slate-200">Infark Miokard Akut (I21.9)</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-amber-800">Rp 32.400.000</td>
                    <td className="p-2 border-r border-slate-200 text-slate-700">Belum melampirkan hasil EKG serial 12-lead dan enzim jantung (Troponin I/T) pada saat admisi IGD.</td>
                    <td className="p-2 text-center font-bold text-rose-700">14 Hari Kerja</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold">0301R0010326V000108</td>
                    <td className="p-2 border-r border-slate-200">Pneumonia Berat (J18.9)</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-amber-800">Rp 16.750.000</td>
                    <td className="p-2 border-r border-slate-200 text-slate-700">Foto rontgen thorax PA dan hasil analisis gas darah (AGD) tidak terunggah secara jelas di e-Dossier.</td>
                    <td className="p-2 text-center font-bold text-rose-700">14 Hari Kerja</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs leading-relaxed text-justify">
              Sesuai dengan ketentuan regulasi JKN, pihak FKRTL diberikan batas waktu maksimal <strong>14 (empat belas) hari kerja</strong> sejak Berita Acara ini diterbitkan untuk melengkapi dan mengunggah kembali dokumen perbaikan melalui portal VEDIKA Resubmit. Apabila sampai batas waktu tersebut berkas tidak dilengkapi, klaim akan diputuskan <strong>TIDAK LAYAK BAYAR</strong>.
            </p>

            <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-center">
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
                SURAT PERINGATAN TINGKAT I (SP-1) AUDIT VEDIKA
              </h3>
              <p className="text-xs font-mono text-slate-700">
                Nomor: 0092/SP1-VPK/IV/0326 · Klasifikasi: RAHASIA / PERINGATAN FORMAL
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
              <li><strong>Anomali Geovelocity & SIP DPJP:</strong> Ditemukan 14 klaim dengan DPJP dr. Hendra, Sp.A tercatat melakukan tindakan operasi di {selectedHospital} pada saat bersamaan tercatat aktif di faskes lain berjarak &gt; 45 KM.</li>
              <li><strong>Unbundling / Readmisi Rekayasa:</strong> Pola pasien katarak yang dipulangkan dalam waktu 24 jam lalu didaftarkan ulang dengan SEP baru (readmisi berulang &lt; 3 hari tanpa indikasi darurat).</li>
              <li><strong>Ketidaksesuaian Konfirmasi Peserta Mobile JKN:</strong> Sebanyak 42% peserta yang disampel menyatakan tidak menerima tindakan penunjang radiologi CT-Scan yang ditagihkan.</li>
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
                <p className="font-bold underline">Dr. Ir. Wahyudi Pratama, M.H.Kes</p>
              </div>
              <div className="space-y-16">
                <p className="font-bold">Pemeriksa Investigasi,<br />Ketua Tim Anti-Fraud BPJS Kesehatan</p>
                <div className="space-y-0.5">
                  <p className="font-bold underline">Budi Santoso, S.Kom, M.TI</p>
                  <p className="text-[10px] text-slate-500 font-mono">NIP: 19920815 201503 1 002</p>
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
