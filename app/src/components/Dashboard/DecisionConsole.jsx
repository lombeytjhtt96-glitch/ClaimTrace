import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertOctagon, CheckCircle2, AlertTriangle, FileText, 
  Download, Printer, Shield, Lock, ArrowLeft, RefreshCw, 
  Send, UserCheck, Stethoscope, ChevronRight, Check, X,
  FileCheck, ShieldAlert, Gavel, Ban, Sparkles
} from 'lucide-react';

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
    id: typeof caseData === 'string' ? caseData : 'CLM-2026-10-085',
    hospital: 'RS Khusus Mitra Husada',
    sep: '0132R0011026V000085',
    tariff: 'Rp 15.300.000',
    claimCount: 85,
    code: 'Z-3-12-0',
    dpjp: 'dr. Hendra, Sp.KFR'
  };

  const currentCase = (typeof caseData === 'object' && caseData !== null) ? caseData : defaultCase;

  const [notes, setNotes] = useState(
    'Ditemukan indikasi kuat klaim fiktif massal (Phantom Billing) pasca kegiatan Baksos 12 Okt 2026. Data federasi SATUSEHAT SDMK membuktikan SIP DPJP telah tidak aktif/mutasi pada tanggal pelayanan. Respon langsung out-of-band Mobile JKN memvalidasi 8 dari 10 peserta tidak pernah hadir menerima fisioterapi. Direkomendasikan penundaan Berita Acara Kelengkapan Berkas (BAKB) sesuai Pasal 76 ayat (2) Perpres 82/2018.'
  );

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const handleDownloadDossierPdf = () => {
    const reportText = `BPJS KESEHATAN KANTOR PUSAT
DIREKTORAT JAMINAN PELAYANAN KESEHATAN
BERITA ACARA KELENGKAPAN BERKAS (BAKB) & REKOMENDASI AUDIT KLAIM
Nomor Registrasi: BAKB/BPJS/IX/2026/0881
Status: TUNDA BAYAR (JALUR MERAH)
Dasar Hukum: Pasal 76 ayat (2) Perpres No. 82/2018 & Permenkes No. 26/2021

I. IDENTITAS KASUS KLAIM
- Nomor Registrasi: ${currentCase.id}
- Fasilitas Kesehatan: ${currentCase.hospital}
- Nomor SEP: ${currentCase.sep}
- Kode INA-CBG: ${currentCase.code}
- Total Tagihan: ${currentCase.tariff} (${currentCase.claimCount || 85} Berkas Klaim)
- DPJP Tertera: ${currentCase.dpjp}

II. TEMUAN KECURANGAN MULTI-LAPIS (3-LAYER FORENSICS)
1. Lapis 1 (Pola Spatiotemporal):
   Lonjakan klaim massal 8.5x dari baseline rata-rata harian faskes pasca baksos 12 Okt 2026.
   Terindikasi modus Phantom Billing & Repeat Billing.
2. Lapis 2 (SATUSEHAT SDMK):
   Surat Izin Praktik (SIP) dokter ${currentCase.dpjp} tidak aktif di faskes ini pada tanggal pelayanan.
3. Lapis 3 (Mobile JKN Telemetry):
   Verifikasi out-of-band ke peserta terdaftar membuktikan 8 dari 10 peserta menyangkal pernah hadir.

III. PEMETAAN KERANGKA KERJA SIBER & FRAUD (ANTHROPIC CYBERSECURITY SKILLS)
1. MITRE Fight Fraud Framework (F3 v1.1):
   - FA0001 (Positioning): F1005.001 (Unauthorized Patient Identity Seeding)
   - FA0002 (Monetization): F1018 (Unbundling & Split Claim Arbitrage) · F1025.003
2. MITRE ATT&CK v19.1:
   - TA0001 (Initial Access): T1078 (Valid Accounts - Inactive DPJP Credentials)
   - TA0005 (Stealth): T1070 (Indicator Removal / Missing Medical Records)
3. NIST CSF 2.0: DE.CM-01 (Continuous Monitoring) & RS.AN-03 (Fraud Analysis)
4. MITRE D3FEND: D3-DS (Digital Signature Chaining) & D3-MFA (Presence Attestation)
5. NIST AI RMF 1.0: Faithfulness 0.998 · Zero-PHI Preserved

IV. KEPUTUSAN & INSTRUKSI VERIFIKATOR
1. Penundaan penandatanganan Berita Acara Kelengkapan Berkas (BAKB).
2. Penerbitan Surat Klarifikasi (SP-1) kepada Direktur ${currentCase.hospital}.
3. Penjadwalan audit fisik lapangan oleh Tim Pencegahan Kecurangan JKN.

Diterbitkan secara digital oleh:
Verifikator Medis: dr. Siti Rahma, Sp.PK (NIP: 19880412 201402 2 001)
Digital Seal SHA-256: 9e8a7c2b512f43a91e0892cfa71290bb34102c98d7831fa281
Timestamp: ${new Date().toISOString()}`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BAKB_BPJS_${currentCase.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowPdfModal(false);
    setSuccessToast(true);
  };

  const handleActionClick = (actionType) => {
    setIsSubmitting(true);
    setTimeout(() => {
      onSetVerificatorAction(actionType);
      setIsSubmitting(false);
      setSuccessToast(true);
    }, 400);
  };

  return (
    <div className={`space-y-4 font-inter ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* HEADER BANNER */}
      <div className={`w-full px-4 py-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#00153A]/85 backdrop-blur-xl border-white/10 text-white shadow-2xl shadow-[#00081c]/50'
      }`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Konsol Keputusan Verifikator Medis &amp; Disposisi Klaim
            </h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
              isLight
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}>
              JALUR MERAH · AUDIT FREEZE
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              isLight
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white/5 text-[#FFCA40] border-white/10'
            }`}>
              MITRE F3: FA0002 · Perpres 82/2018
            </span>
          </div>
          <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600 font-medium' : 'text-white/60'}`}>
            Keputusan mengikat verifikator pra-bayar berdasarkan sintesis bukti 3 lapis, rekonsiliasi data faskes, dan audit trail anti-rekayasa.
          </p>
        </div>

        {/* Action Status Toast */}
        {successToast && (
          <div className={`px-3 py-1.5 rounded-xl text-xs flex items-center space-x-2 animate-fade-in shadow-md border ${
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
      </div>

      {/* SCROLLABLE MAIN DECISION WORKSPACE */}
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
                  <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>dr. Siti Rahma, Sp.PK</span>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-cyan-400'}`} />
                </div>
                <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                  Verifikator Medis Utama (Wasrik) • NIP: <span className={`font-mono font-bold ${isLight ? 'text-slate-800' : 'text-cyan-300'}`}>VERIF-NAT-0412</span>
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
                isLight ? 'text-rose-700' : 'text-rose-300'
              }`}>SKOR FUSI KASUS</span>
              <span className={`text-2xl font-bold leading-none ${
                isLight ? 'text-rose-600' : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]'
              }`}>{totalScore}</span>
              <span className={`text-[9.5px] block mt-0.5 font-bold ${
                isLight ? 'text-rose-700' : 'text-rose-300/70'
              }`}>Jalur Merah</span>
            </div>
          </div>

          {/* DECISION ACTION CARD */}
          <div className={`rounded-2xl p-4 space-y-3 border ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
              : 'bg-[#00153A]/80 backdrop-blur-md border-white/10 text-white shadow-xl shadow-[#00081c]/40'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Rekomendasi Keputusan Berdasarkan Fusi Bukti</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border font-mono ${
                isLight
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                REKOMENDASI: TUNDA BAKB
              </span>
            </div>

            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
              Berdasarkan temuan anomali multi-lapis (lonjakan 8.5x klaim baksos, DPJP terbukti non-aktif di SATUSEHAT SDMK, serta konfirmasi peserta pada Mobile JKN menyatakan tidak pernah menerima layanan fisioterapi), sistem merekomendasikan:
            </p>

            {/* ACTION BUTTONS */}
            <div className="space-y-2.5 pt-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider block font-mono ${
                isLight ? 'text-slate-600' : 'text-white/50'
              }`}>
                Pilih Tindakan Verifikator:
              </span>

              {/* 1. TUNDA BERITA ACARA */}
              <button type="button"
                disabled={isSubmitting}
                onClick={() => handleActionClick('clarification')}
                className={`w-full p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  verificatorAction === 'clarification'
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
                    <span className={`text-xs font-bold break-words text-balance ${
                      verificatorAction === 'clarification'
                        ? (isLight ? 'text-rose-900 font-bold' : 'text-rose-300')
                        : (isLight ? 'text-slate-900' : 'text-white')
                    }`}>
                      Tunda Berita Acara &amp; Minta Klarifikasi Faskes (SOP 10 Hari)
                    </span>
                    {verificatorAction === 'clarification' && (
                      <span className="text-[9.5px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-1 leading-relaxed text-pretty ${
                    isLight ? 'text-slate-600' : 'text-white/60'
                  }`}>
                    Menahan pencairan tagihan Rp 15.300.000 sebelum batas SLA 10 hari sesuai Pasal 76 ayat (2) Perpres No. 82/2018.
                  </p>
                </div>
              </button>

              {/* 2. JADWALKAN AUDIT FAKTUAL LAPANGAN */}
              <button type="button"
                disabled={isSubmitting}
                onClick={() => handleActionClick('audit')}
                className={`w-full p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  verificatorAction === 'audit'
                    ? (isLight
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 text-amber-950 shadow-md'
                        : 'bg-amber-500/20 border-amber-500/60 ring-2 ring-amber-500/40 text-white shadow-lg shadow-amber-950/40')
                    : (isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90')
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 to-yellow-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                  <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className={`text-xs font-bold break-words text-balance ${
                      verificatorAction === 'audit'
                        ? (isLight ? 'text-amber-900 font-bold' : 'text-amber-300')
                        : (isLight ? 'text-slate-900' : 'text-white')
                    }`}>
                      Jadwalkan Audit Faktual Lapangan (Tim VPK BPJS)
                    </span>
                    {verificatorAction === 'audit' && (
                      <span className="text-[9.5px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-1 leading-relaxed text-pretty ${
                    isLight ? 'text-slate-600' : 'text-white/60'
                  }`}>
                    Menerjunkan verifikator paska-klaim ke RS Khusus Mitra Husada untuk memeriksa logbook fisioterapi fisik.
                  </p>
                </div>
              </button>

              {/* 3. OVERRIDE LOLOSKAN */}
              <button type="button"
                disabled={isSubmitting}
                onClick={() => handleActionClick('override')}
                className={`w-full p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  verificatorAction === 'override'
                    ? (isLight
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500 text-emerald-950 shadow-md'
                        : 'bg-emerald-500/20 border-emerald-500/60 ring-2 ring-emerald-500/40 text-white shadow-lg shadow-emerald-950/40')
                    : (isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90')
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className={`text-xs font-bold break-words text-balance ${
                      verificatorAction === 'override'
                        ? (isLight ? 'text-emerald-900 font-bold' : 'text-emerald-300')
                        : (isLight ? 'text-slate-900' : 'text-white')
                    }`}>
                      Loloskan Klaim (Override Manual dengan Catatan Khusus)
                    </span>
                    {verificatorAction === 'override' && (
                      <span className="text-[9.5px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-1 leading-relaxed text-pretty ${
                    isLight ? 'text-slate-600' : 'text-white/60'
                  }`}>
                    Hanya digunakan bila faskes telah menyertakan bukti fisik darurat yang sah dan disetujui Kepala Cabang.
                  </p>
                </div>
              </button>
            </div>

            {/* VERIFIER NOTES TEXTAREA */}
            <div className="space-y-1.5 pt-2">
              <label className={`text-[10.5px] font-bold flex items-center justify-between ${
                isLight ? 'text-slate-800' : 'text-white/80'
              }`}>
                <span>Catatan Resmi Verifikator (Wajib untuk Berita Acara):</span>
                <span className={`text-[9.5px] font-mono font-bold ${
                  isLight ? 'text-emerald-700' : 'text-cyan-300'
                }`}>TERENKRIPSI STANDAR UU PDP</span>
              </label>
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
                <span className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} font-bold`}>2026-10-22T10:45:12.891+07:00</span>
              </div>

              <div>
                <span className={`block text-[9px] ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'}`}>ID VERIFIKATOR RESMI:</span>
                <span className={`${isLight ? 'text-emerald-800' : 'text-emerald-300'} font-bold block`}>VERIF-NAT-0412 (dr. Siti Rahma, Sp.PK)</span>
              </div>

              <div>
                <span className={`block text-[9px] ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'}`}>TINDAKAN TERPILIH:</span>
                <span className={`font-bold ${
                  verificatorAction === 'clarification' ? 'text-rose-600' : verificatorAction === 'audit' ? 'text-amber-600' : isLight ? 'text-emerald-700' : 'text-emerald-400'
                }`}>
                  {verificatorAction ? (verificatorAction === 'clarification' ? 'TUNDA BAKB & KLARIFIKASI FASKES' : verificatorAction === 'audit' ? 'AUDIT FAKTUAL LAPANGAN' : 'OVERRIDE LOLOSKAN') : 'MENUNGGU DISPOSISI'}
                </span>
              </div>

              <div>
                <span className={`block text-[9px] ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'}`}>HASH KRIPTOGRAFIS SHA-256:</span>
                <span className={`${isLight ? 'text-slate-700' : 'text-emerald-300'} font-bold text-[9px] break-all`}>
                  9e8a7c2b512f43a91e0892cfa71290bb34102c98d7831fa281
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
              <span>Berkas Berita Acara Siap-Audit (BAKB)</span>
            </h4>
            <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
              Seluruh bukti Lapis 1 (Pola), Lapis 2 (SATUSEHAT), dan Lapis 3 (Mobile JKN) siap dicetak menjadi lembar rekomendasi resmi tim verifikator BPJS.
            </p>

            <button type="button"
              onClick={() => setShowPdfModal(true)}
              className={`w-full font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer ${
                isLight
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-950/40'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Buka Pratinjau &amp; Cetak Dokumen PDF</span>
            </button>
          </div>

        </div>

      </div>

      {/* PDF DOSSIER PREVIEW MODAL WITH MOTION */}
      <AnimatePresence>
        {showPdfModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className={`border w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${
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
                    <p className={`text-[9px] font-mono mt-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>No: 085/BAKB/X/2026</p>
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
                    <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{currentCase.code} - Fisioterapi Massal</div>
                  </div>
                  <div>
                    <span className={isLight ? 'text-slate-500' : 'text-white/50'}>Nilai Tagihan:</span>
                    <div className="font-bold text-rose-600">{currentCase.tariff} (85 Klaim)</div>
                  </div>
                </div>

                {/* Multi-layer Findings */}
                <div className="space-y-1.5 text-[11px]">
                  <h4 className={`font-bold border-b pb-1 ${isLight ? 'text-slate-900 border-slate-200' : 'text-white border-white/10'}`}>
                    I. TEMUAN KECURANGAN MULTI-LAPIS (EVIDENCE SYNTHESIS)
                  </h4>
                  <ul className={`list-disc pl-4 space-y-1 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                    <li>
                      <strong className={isLight ? 'text-slate-900' : 'text-white'}>Lapis 1 (Pola Spatiotemporal):</strong> Lonjakan penagihan mendadak 8.5x dari baseline pasca acara baksos 12 Okt 2026. Terindikasi modus Phantom Billing &amp; Repeat Billing.
                    </li>
                    <li>
                      <strong className={isLight ? 'text-slate-900' : 'text-white'}>Lapis 2 (SDMK SATUSEHAT):</strong> DPJP tertera dr. Hendra, Sp.KFR tercatat tidak memiliki SIP aktif di faskes ini pada tanggal pelayanan (Hard-Trigger).
                    </li>
                    <li>
                      <strong className={isLight ? 'text-slate-900' : 'text-white'}>Lapis 3 (Mobile JKN Confirmation):</strong> Verifikasi out-of-band ke peserta terdaftar mengonfirmasi 8 dari 10 peserta tidak pernah hadir menerima layanan.
                    </li>
                  </ul>
                </div>

                {/* Verifier Verdict */}
                <div className={`p-3 rounded-xl text-[11px] space-y-1 border ${
                  isLight ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                }`}>
                  <h4 className={`font-bold ${isLight ? 'text-rose-800' : 'text-rose-300'}`}>II. REKOMENDASI DAN KEPUTUSAN VERIFIKATOR</h4>
                  <p>
                    Tagihan ditunda pencairannya sebelum Berita Acara Kelengkapan Berkas (BAKB) ditandatangani. Faskes wajib memberikan klarifikasi formal dalam jangka waktu 10 hari kalender sesuai ketentuan Pasal 76 ayat (2) Perpres No. 82/2018.
                  </p>
                </div>

                {/* Signature Block */}
                <div className="pt-4 flex justify-between items-end text-[10px]">
                  <div>
                    <p className={`font-mono ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Digital Seal: SHA-256 9e8a7c2b...f43a91e</p>
                    <p className={isLight ? 'text-slate-500' : 'text-white/50'}>Tanggal: 22 Oktober 2026, 10:45 WIB</p>
                  </div>
                  <div className="text-center w-48">
                    <p className={`mb-8 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>Verifikator Klaim BPJS,</p>
                    <p className={`font-bold underline ${isLight ? 'text-slate-900' : 'text-white'}`}>dr. Siti Rahma, Sp.PK</p>
                    <p className={isLight ? 'text-slate-500' : 'text-white/50'}>NIP: 19880412 201402 2 001</p>
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
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                      isLight ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    Tutup
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleDownloadDossierPdf}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer transition ${
                      isLight 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Berkas Resmi (.txt/PDF)</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
  );
}
