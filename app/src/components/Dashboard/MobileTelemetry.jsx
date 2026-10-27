import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, Radio, Send, CheckCircle2, XCircle, Clock, 
  ShieldCheck, AlertTriangle, RefreshCw, Filter, Search, 
  Download, ArrowUpRight, BarChart3, Wifi, BellRing, Lock,
  EyeOff, RotateCcw
} from 'lucide-react';

export default function MobileTelemetry({ 
  onTriggerPush, 
  onToggleSimulator, 
  onCloseSimulator, 
  isSimulatorOpen, 
  patientResponse, 
  onResetDemo,
  isLight: propIsLight
}) {
  const [internalIsLight, setInternalIsLight] = useState(() => {
    if (typeof document !== 'undefined') {
      const root = document.getElementById('cockpit-root');
      return root ? root.classList.contains('theme-light') : false;
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
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    const root = document.getElementById('cockpit-root');
    if (root) observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [propIsLight]);

  const isLight = typeof propIsLight === 'boolean' ? propIsLight : internalIsLight;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [testNik, setTestNik] = useState('3372015509920002');
  const [testClaimId, setTestClaimId] = useState('KLAIM-2026-0881');
  const [sendingPush, setSendingPush] = useState(false);
  const [pushSentSuccess, setPushSentSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState(null);
  const [showComplianceModal, setShowComplianceModal] = useState(false);

  const handleSyncData = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncNotice('Sinkronisasi Berhasil: 1.248 sesi FCM aktif terpantau dengan integritas ZK-Proof 100%.');
      setTimeout(() => setSyncNotice(null), 4000);
    }, 900);
  };

  // Live telemetry logs of Lapis 3 Mobile JKN Push Bridge
  const [telemetryLogs, setTelemetryLogs] = useState([
    {
      id: 'TEL-8821',
      claimId: 'KLAIM-2026-0881',
      participantName: 'Ny. Siti Aisyah',
      nikHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      faskes: 'RS Swasta Medika Kasih',
      procedure: 'Operasi Katarak Fakoemulsifikasi',
      dispatchedAt: '24 Okt 2026 14:15 WIB',
      respondedAt: '24 Okt 2026 14:28 WIB',
      latencyMin: 13,
      status: 'DENIED', // Pasien menyangkal! Phantom billing flag!
      channel: 'Mobile JKN Push (FCM-Encrypted)',
      zkProof: '0x9a8f...21ce (Valid Presence Signature)'
    },
    {
      id: 'TEL-8820',
      claimId: 'KLAIM-2026-0879',
      participantName: 'Tn. Agus Salim',
      nikHash: 'b5d4045c3f466fa91fe2cc6abe79232a1a57cdf104f7a26e716e0a1e2789df78',
      faskes: 'RSUD Dr. Moewardi',
      procedure: 'Hemodialisa Rutin',
      dispatchedAt: '24 Okt 2026 13:50 WIB',
      respondedAt: '24 Okt 2026 14:02 WIB',
      latencyMin: 12,
      status: 'CONFIRMED',
      channel: 'Mobile JKN Push (FCM-Encrypted)',
      zkProof: '0x1b4c...f78a (Valid Presence Signature)'
    },
    {
      id: 'TEL-8819',
      claimId: 'KLAIM-2026-0875',
      participantName: 'Ny. Sri Wahyuni',
      nikHash: '7d793037a0760186574b0282f2f435e7b1e50774690f4e020e9ea73d9c0e724f',
      faskes: 'RS Hermina Solo',
      procedure: 'Fisioterapi Rehabilitasi Medik',
      dispatchedAt: '24 Okt 2026 13:20 WIB',
      respondedAt: '24 Okt 2026 13:35 WIB',
      latencyMin: 15,
      status: 'CONFIRMED',
      channel: 'Mobile JKN Push (FCM-Encrypted)',
      zkProof: '0x3e12...890d (Valid Presence Signature)'
    },
    {
      id: 'TEL-8818',
      claimId: 'KLAIM-2026-0870',
      participantName: 'Tn. Joko Riyanto',
      nikHash: '4a6b2c...991e',
      faskes: 'Klinik Pratama Sehat Sejahtera',
      procedure: 'Pemeriksaan Darah Lengkap & Kimia',
      dispatchedAt: '24 Okt 2026 12:45 WIB',
      respondedAt: '24 Okt 2026 13:01 WIB',
      latencyMin: 16,
      status: 'DENIED',
      channel: 'Mobile JKN Push (FCM-Encrypted)',
      zkProof: '0x7f4a...1102 (Valid Presence Signature)'
    },
    {
      id: 'TEL-8817',
      claimId: 'KLAIM-2026-0868',
      participantName: 'Ny. Endang Susanti',
      nikHash: '98d3ef...3321',
      faskes: 'RS Panti Waluyo',
      procedure: 'Rawat Jalan Spesialis Penyakit Dalam',
      dispatchedAt: '24 Okt 2026 12:10 WIB',
      respondedAt: 'Belum merespons',
      latencyMin: null,
      status: 'PENDING',
      channel: 'Mobile JKN Push (FCM-Encrypted)',
      zkProof: 'Pending Challenge'
    }
  ]);

  const handleSendTestPush = (e) => {
    e.preventDefault();
    setSendingPush(true);
    setPushSentSuccess(false);

    setTimeout(() => {
      setSendingPush(false);
      setPushSentSuccess(true);
      
      const newLog = {
        id: `TEL-${Math.floor(Math.random() * 9000) + 1000}`,
        claimId: testClaimId,
        participantName: 'Peserta Terverifikasi (Khalaf Faith P.)',
        nikHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        faskes: 'RS Swasta Medika Kasih',
        procedure: 'Konfirmasi Presensi Lapis 3 (Telemetri Mobile JKN)',
        dispatchedAt: 'Baru saja (Live Push)',
        respondedAt: 'Menunggu respon di smartphone...',
        latencyMin: null,
        status: 'PENDING',
        channel: 'Mobile JKN Bridge Direct',
        zkProof: 'Generating...'
      };
      
      setTelemetryLogs([newLog, ...telemetryLogs]);

      if (onTriggerPush) {
        onTriggerPush();
      }

      setTimeout(() => setPushSentSuccess(false), 4000);
    }, 800);
  };

  const filteredLogs = telemetryLogs.filter(log => {
    const matchSearch = log.claimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.faskes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'confirmed') return matchSearch && log.status === 'CONFIRMED';
    if (filterStatus === 'denied') return matchSearch && log.status === 'DENIED';
    if (filterStatus === 'pending') return matchSearch && log.status === 'PENDING';
    return matchSearch;
  });

  const handleExportLogs = () => {
    const headers = ['ID Telemetri', 'No. Klaim', 'Peserta', 'NIK Hash', 'Faskes', 'Prosedur', 'Waktu Kirim', 'Waktu Respon', 'Status Respon', 'Bukti Kriptografis ZK-Proof'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.claimId,
      `"${l.participantName}"`,
      l.nikHash,
      `"${l.faskes}"`,
      `"${l.procedure}"`,
      `"${l.dispatchedAt}"`,
      `"${l.respondedAt}"`,
      l.status === 'CONFIRMED' ? 'Hadir Sah' : l.status === 'DENIED' ? 'Menyangkal (Phantom)' : 'Menunggu Respons',
      `"${l.zkProof}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_telemetri_mobile_jkn_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-4 font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* HEADER SECTION & 4 METRICS */}
      <div className="space-y-3">
        <div className={`rounded-2xl p-4 md:p-5 border transition-all ${
          isLight
            ? 'bg-white border-slate-200/90 shadow-sm text-slate-900'
            : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2.5 mb-1">
                <span className={`p-2 rounded-xl border ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-[#FFCA40]/10 text-[#FFCA40] border-[#FFCA40]/30'
                }`}>
                  <Radio className="w-4 h-4" />
                </span>
                <div>
                  <h1 className="text-base md:text-lg font-bold tracking-tight flex flex-wrap items-center gap-2">
                    <span className={isLight ? 'text-slate-900' : 'text-white'}>Gateway Telemetri Mobile JKN</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                      isLight
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-[#FFCA40]/10 text-[#FFCA40] border-[#FFCA40]/30'
                    }`}>
                      LAPIS 3 VERIFIKASI PESERTA
                    </span>
                    <span className={`text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                      isLight
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-white/5 text-white/70 border-white/10'
                    }`}>
                      MITRE D3FEND: D3-MFA · MITRE F3: FA0001.F1005
                    </span>
                  </h1>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    Pemantauan saluran <em>Push Notification Bridge</em> ke aplikasi peserta secara <em>real-time</em> untuk konfirmasi kehadiran faktual &amp; pencegahan klaim fiktif (MITRE D3FEND D3-MFA Presence Attestation).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className={`rounded-xl px-3 py-1.5 text-right border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <span className={`text-[9.5px] font-semibold block uppercase tracking-wider ${
                  isLight ? 'text-slate-500' : 'text-white/50'
                }`}>
                  Push Gateway Engine
                </span>
                <span className={`text-xs font-bold flex items-center justify-end space-x-1.5 font-mono ${
                  isLight ? 'text-emerald-700' : 'text-[#FFCA40]'
                }`}>
                  <span className={`w-2 h-2 rounded-full inline-block animate-pulse ${
                    isLight ? 'bg-emerald-600' : 'bg-[#FFCA40]'
                  }`} />
                  <span>FCM High-Priority</span>
                </span>
              </div>
              <button 
                type="button" 
                onClick={handleSyncData}
                disabled={isSyncing}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm active:scale-95 disabled:opacity-75 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Data'}</span>
              </button>
            </div>
          </div>

          {/* SYNC SUCCESS NOTICE */}
          {syncNotice && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 border mt-2.5 ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>{syncNotice}</span>
            </motion.div>
          )}

          {/* METRICS ROW */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 mt-3 border-t ${
            isLight ? 'border-slate-100' : 'border-white/10'
          }`}>
            <div className={`relative overflow-hidden rounded-xl p-2.5 border transition-all ${
              isLight ? 'bg-slate-50/70 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <Radio className="absolute right-1 -bottom-1 w-10 h-10 opacity-[0.06] pointer-events-none" />
              <span className={`text-[10px] block font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Notifikasi Terkirim (24j)
              </span>
              <span className={`text-base font-semibold tabular-nums mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                1.248
              </span>
              <span className={`text-[9.5px] flex items-center space-x-1 mt-0.5 font-medium ${
                isLight ? 'text-emerald-700' : 'text-emerald-400'
              }`}>
                <ArrowUpRight className="w-3 h-3" />
                <span>Tingkat Terkirim 99,4%</span>
              </span>
            </div>

            <div className={`relative overflow-hidden rounded-xl p-2.5 border transition-all ${
              isLight ? 'bg-slate-50/70 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <CheckCircle2 className="absolute right-1 -bottom-1 w-10 h-10 opacity-[0.06] pointer-events-none" />
              <span className={`text-[10px] block font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Tingkat Respons Peserta
              </span>
              <span className={`text-base font-semibold tabular-nums mt-0.5 block ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                78,6%
              </span>
              <span className={`text-[9.5px] font-normal ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Rerata Respons: 14,2 Menit
              </span>
            </div>

            <div className={`relative overflow-hidden rounded-xl p-2.5 border transition-all ${
              isLight ? 'bg-slate-50/70 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <XCircle className="absolute right-1 -bottom-1 w-10 h-10 opacity-[0.06] pointer-events-none" />
              <span className={`text-[10px] block font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Penolakan / Sangkalan Peserta
              </span>
              <span className={`text-base font-semibold tabular-nums mt-0.5 block ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                135 (10,8%)
              </span>
              <span className={`text-[9.5px] font-medium ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>
                Klaim Ditahan Otomatis
              </span>
            </div>

            <div className={`relative overflow-hidden rounded-xl p-2.5 border transition-all ${
              isLight ? 'bg-slate-50/70 border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
            }`}>
              <ShieldCheck className="absolute right-1 -bottom-1 w-10 h-10 opacity-[0.06] pointer-events-none" />
              <span className={`text-[10px] block font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Kepatuhan UU PDP No. 27/2022
              </span>
              <span className={`text-base font-semibold tabular-nums mt-0.5 block ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                100% ZK-Proof
              </span>
              <span className={`text-[9.5px] font-medium ${
                isLight ? 'text-slate-500' : 'text-white/50'
              }`}>
                Hash SHA-256 Terdesentralisasi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DISPATCH TEST SIMULATOR & ZERO-KNOWLEDGE PROOF INFO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* PUSH DISPATCHER CONSOLE (5 COLS) */}
        <div className={`relative overflow-hidden lg:col-span-5 rounded-2xl p-4 md:p-5 border transition-all space-y-3 ${
          isLight
            ? 'bg-white border-slate-200/90 shadow-sm text-slate-800'
            : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
        }`}>
          <Send className="absolute right-3 -bottom-3 w-28 h-28 opacity-[0.03] pointer-events-none" />
          <div className={`flex items-center space-x-2 border-b pb-2.5 ${
            isLight ? 'border-slate-100 text-emerald-700' : 'border-white/10 text-white'
          }`}>
            <Send className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-[#FFCA40]'}`} />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Kirim Notifikasi Verifikasi Presensi
            </h3>
          </div>

          <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
            Kirimkan sinyal konfirmasi kehadiran langsung ke perangkat peserta melalui aplikasi Mobile JKN untuk memvalidasi pelayanan faktual.
          </p>

          <form onSubmit={handleSendTestPush} className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-[11px] font-sans block font-semibold ${
                  isLight ? 'text-slate-700' : 'text-white/60'
                }`}>
                  ID Kasus Klaim:
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTestClaimId('KLAIM-2026-0881');
                      setTestNik('3372015509920002');
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition border cursor-pointer ${
                      testClaimId === 'KLAIM-2026-0881'
                        ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' : 'bg-[#FFCA40]/20 text-[#FFCA40] border-[#FFCA40]/40 font-bold')
                        : (isLight ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10')
                    }`}
                    title="Pilih kasus Katarak dr. Hendra"
                  >
                    0881 (Katarak)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTestClaimId('KLAIM-2026-0870');
                      setTestNik('3372011203850001');
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition border cursor-pointer ${
                      testClaimId === 'KLAIM-2026-0870'
                        ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' : 'bg-[#FFCA40]/20 text-[#FFCA40] border-[#FFCA40]/40 font-bold')
                        : (isLight ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10')
                    }`}
                    title="Pilih kasus Lab Darah"
                  >
                    0870 (Lab)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTestClaimId('KLAIM-2026-0868');
                      setTestNik('3372014408790003');
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition border cursor-pointer ${
                      testClaimId === 'KLAIM-2026-0868'
                        ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' : 'bg-[#FFCA40]/20 text-[#FFCA40] border-[#FFCA40]/40 font-bold')
                        : (isLight ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10')
                    }`}
                    title="Pilih kasus Penyakit Dalam"
                  >
                    0868 (Interna)
                  </button>
                </div>
              </div>
              <input 
                aria-label="Bidang input data"
                type="text"
                value={testClaimId}
                onChange={(e) => setTestClaimId(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 transition text-xs font-mono font-semibold ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-500/30'
                    : 'bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#FFCA40]/60 focus:bg-white/10'
                }`}
              />
            </div>

            <div>
              <label className={`text-[11px] font-sans block mb-1 font-semibold ${
                isLight ? 'text-slate-700' : 'text-white/60'
              }`}>
                NIK Peserta Terdaftar:
              </label>
              <input 
                aria-label="Bidang input data"
                type="text"
                value={testNik}
                onChange={(e) => setTestNik(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 transition text-xs font-mono font-semibold ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-500/30'
                    : 'bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#FFCA40]/60 focus:bg-white/10'
                }`}
              />
            </div>

            <div className={`p-3 rounded-xl border text-[11px] font-sans space-y-1.5 ${
              isLight
                ? 'bg-emerald-50/70 border-emerald-200 text-slate-700'
                : 'bg-white/5 border-white/10 text-white/70'
            }`}>
              <div className={`flex items-center space-x-1.5 font-bold ${
                isLight ? 'text-emerald-800' : 'text-[#FFCA40]'
              }`}>
                <Lock className="w-3.5 h-3.5" />
                <span>Enkripsi Sinyal Lapis 3:</span>
              </div>
              <p className="leading-relaxed">
                Data dikirim melalui saluran aman TLS 1.3 dengan hashing payload SHA-256. Peserta hanya perlu memilih [Ya, Saya Hadir] atau [Tidak, Ini Klaim Fiktif].
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="submit"
                disabled={sendingPush}
                className="w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50"
              >
                {sendingPush ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengirimkan Sinyal ke Mobile JKN...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Sinyal Verifikasi ke Smartphone</span>
                  </>
                )}
              </button>

              {isSimulatorOpen && (
                <button
                  type="button"
                  onClick={onCloseSimulator}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer border ${
                    isLight
                      ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200 hover:border-rose-300'
                      : 'bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 border-white/10 hover:border-rose-500/30'
                  }`}
                  title="Tutup layar Mobile JKN agar tidak muncul di layar"
                >
                  <EyeOff className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`} />
                  <span>Tutup Layar Mobile JKN</span>
                </button>
              )}

              {onResetDemo && (
                <button
                  type="button"
                  onClick={onResetDemo}
                  className={`w-full py-1.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center space-x-1 transition cursor-pointer border ${
                    isLight
                      ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-transparent hover:border-slate-200'
                      : 'text-white/50 hover:text-white hover:bg-white/5 border-transparent hover:border-white/10'
                  }`}
                  title="Kembalikan status respon peserta ke default"
                >
                  <RotateCcw className={`w-3 h-3 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                  <span>Reset Status Presensi Peserta</span>
                </button>
              )}
            </div>

            {pushSentSuccess && (
              <div className={`p-2.5 rounded-xl text-xs font-sans flex items-center space-x-2 border ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                <span>Sinyal Lapis 3 berhasil diteruskan ke Mobile JKN!</span>
              </div>
            )}
          </form>
        </div>

        {/* SECURITY & PRIVACY ACCREDITATION (7 COLS) */}
        <div className={`relative overflow-hidden lg:col-span-7 rounded-2xl p-4 md:p-5 border transition-all flex flex-col justify-between ${
          isLight
            ? 'bg-white border-slate-200/90 shadow-sm text-slate-800'
            : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
        }`}>
          <ShieldCheck className="absolute right-3 -bottom-3 w-32 h-32 opacity-[0.03] pointer-events-none" />
          <div>
            <div className={`flex items-center space-x-2 border-b pb-2.5 mb-3 ${
              isLight ? 'border-slate-100' : 'border-white/10'
            }`}>
              <ShieldCheck className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Protokol Privasi & Zero-Knowledge Proof (UU PDP No. 27/2022)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
              <div className={`p-3 rounded-xl border space-y-1 ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <span className={`text-[11px] font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Pseudonimitas Data Medis
                </span>
                <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                  Nama pasien dan diagnosis sensitif dienkripsi satu arah menggunakan algoritma SHA-256 bersalting sebelum diproses oleh penapisan anomali.
                </p>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <span className={`text-[11px] font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Zero-Knowledge Presence
                </span>
                <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                  Tidak melacak koordinat GPS kontinu peserta. Hanya memvalidasi tanda tangan kriptografis dari perangkat ponsel yang terotentikasi saat verifikasi.
                </p>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <span className={`text-[11px] font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Consent-Based Inquiry
                </span>
                <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                  Pemberitahuan kepada peserta disajikan secara transparan dengan opsi eskalasi langsung ke kanal pelaporan aduan kecurangan (BPJS Call Center 165).
                </p>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <span className={`text-[11px] font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Audit Log Kriptografis
                </span>
                <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                  Setiap respon konfirmasi maupun sangkalan tercatat ke dalam <em>SHA-256 Tamper-Evident Ledger</em> yang tidak dapat dimanipulasi oleh pihak manapun.
                </p>
              </div>
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <div className="space-y-0.5">
              <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Standar Keamanan Nasional Terpenuhi
              </span>
              <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                ISO 27001 Information Security Management &amp; Peraturan BPJS Kesehatan No. 9 Tahun 2024.
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setShowComplianceModal(true)}
              className={`text-[11px] underline font-bold shrink-0 cursor-pointer ${
                isLight ? 'text-emerald-700 hover:text-emerald-900' : 'text-[#FFCA40] hover:text-[#FFE08C]'
              }`}
            >
              Lihat Dokumen Kepatuhan
            </button>
          </div>
        </div>
      </div>

      {/* TELEMETRY LOGS TABLE */}
      <div className={`rounded-2xl p-4 md:p-5 border transition-all space-y-3.5 ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-sm text-slate-800'
          : 'bg-[#00153A]/85 border-white/10 shadow-xl shadow-[#00081c]/50 backdrop-blur-xl text-white'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold flex items-center space-x-2">
              <span className={isLight ? 'text-slate-900' : 'text-white'}>Log Telemetri Verifikasi Presensi Lapis 3</span>
              <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                ({filteredLogs.length} Data)
              </span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Rekap waktu nyata respon konfirmasi peserta dari aplikasi Mobile JKN
            </p>
          </div>

          {/* SEARCH & FILTER */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-slate-400' : 'text-white/40'
              }`} />
              <input 
                aria-label="Bidang input data"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari ID klaim, pasien, RS..."
                className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs transition font-medium ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white'
                    : 'bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#FFCA40]/60 focus:bg-white/10'
                }`}
              />
            </div>

            <div className={`flex items-center rounded-xl p-0.5 text-xs font-semibold border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#00134A] border-white/10'
            }`}>
              <button 
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filterStatus === 'all'
                    ? (isLight ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'bg-[#FFCA40] text-[#00134A] shadow-md font-bold')
                    : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white')
                }`}
              >
                Semua
              </button>
              <button 
                type="button"
                onClick={() => setFilterStatus('denied')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filterStatus === 'denied'
                    ? 'bg-rose-600 text-white shadow-sm font-bold'
                    : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white')
                }`}
              >
                Sangkalan
              </button>
              <button 
                type="button"
                onClick={() => setFilterStatus('confirmed')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filterStatus === 'confirmed'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white')
                }`}
              >
                Konfirmasi
              </button>
              <button 
                type="button"
                onClick={() => setFilterStatus('pending')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filterStatus === 'pending'
                    ? 'bg-amber-600 text-white shadow-sm font-bold'
                    : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white')
                }`}
              >
                Menunggu
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportLogs}
              title="Ekspor rekap log telemetri ke format CSV untuk audit verifikator"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer shrink-0 ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className={`overflow-x-auto overflow-y-auto max-h-[380px] rounded-xl border ${
          isLight ? 'border-slate-200' : 'border-white/10'
        }`}>
          <table className="w-full text-left text-xs font-sans">
            <thead className={`sticky top-0 z-10 uppercase text-[10.5px] tracking-wider border-b ${
              isLight 
                ? 'bg-slate-100 text-slate-700 border-slate-200 font-bold' 
                : 'bg-[#00134A] text-white/70 border-white/10 font-bold'
            }`}>
              <tr>
                <th className="py-3 px-3.5">ID Telemetri</th>
                <th className="py-3 px-3.5">No. Klaim</th>
                <th className="py-3 px-3.5">Peserta &amp; Hash NIK</th>
                <th className="py-3 px-3.5">Faskes / Prosedur</th>
                <th className="py-3 px-3.5">Waktu Kirim / Respon</th>
                <th className="py-3 px-3.5 text-center">Status Respon</th>
                <th className="py-3 px-3.5">ZK-Proof / Hash</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${
              isLight ? 'divide-slate-100' : 'divide-white/5'
            }`}>
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 text-center font-sans">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Smartphone className={`w-8 h-8 ${isLight ? 'text-slate-300' : 'text-white/30'}`} />
                      <p className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                        Tidak ada log telemetri yang cocok dengan filter.
                      </p>
                      <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                        Silakan ubah filter status respon atau kata kunci pencarian.
                      </p>
                      <button 
                        type="button"
                        onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                        className={`mt-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                          isLight
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'text-[#FFCA40] hover:text-[#FFE08C] bg-[#FFCA40]/10 border-[#FFCA40]/30'
                        }`}
                      >
                        Reset Filter
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {filteredLogs.map((log) => (
                <tr 
                  key={log.id}
                  className={`transition-colors duration-150 ${
                    isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'
                  }`}
                >
                  <td className={`py-3 px-3.5 font-bold ${
                    isLight ? 'text-emerald-700' : 'text-[#FFCA40]'
                  }`}>
                    {log.id}
                  </td>
                  <td className={`py-3 px-3.5 font-semibold ${
                    isLight ? 'text-slate-900' : 'text-white/90'
                  }`}>
                    {log.claimId}
                  </td>
                  <td className="py-3 px-3.5 font-sans">
                    <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {log.participantName}
                    </span>
                    <span className={`text-[10px] font-mono block truncate max-w-[140px] ${
                      isLight ? 'text-slate-400' : 'text-white/50'
                    }`}>
                      {log.nikHash}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 font-sans">
                    <span className={`font-medium block ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
                      {log.faskes}
                    </span>
                    <span className={`text-[10.5px] block ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      {log.procedure}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-[11px] font-sans">
                    <span className={`block font-medium ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                      {log.dispatchedAt}
                    </span>
                    <span className={`text-[10px] block ${isLight ? 'text-slate-400' : 'text-white/50'}`}>
                      {log.latencyMin ? `Latensi: ${log.latencyMin} menit` : log.respondedAt}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-center font-sans">
                    {log.status === 'CONFIRMED' && (
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isLight
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Hadir Sah</span>
                      </span>
                    )}
                    {log.status === 'DENIED' && (
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isLight
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        <XCircle className="w-3 h-3" />
                        <span>Menyangkal (Phantom)</span>
                      </span>
                    )}
                    {log.status === 'PENDING' && (
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isLight
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>Menunggu Peserta</span>
                      </span>
                    )}
                  </td>
                  <td className={`py-3 px-3.5 font-mono text-[10px] truncate max-w-[120px] ${
                    isLight ? 'text-slate-400' : 'text-white/40'
                  }`}>
                    {log.zkProof}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL KEPATUHAN & SERTIFIKASI REGULASI */}
      <AnimatePresence>
        {showComplianceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`rounded-2xl border shadow-2xl max-w-lg w-full p-6 space-y-4 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900'
                  : 'bg-[#00153A] border-white/20 text-white'
              }`}
            >
              <div className={`flex items-center justify-between pb-3 border-b ${
                isLight ? 'border-slate-100' : 'border-white/10'
              }`}>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                  <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Dokumen Kepatuhan &amp; Sertifikasi Keamanan
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowComplianceModal(false)}
                  className={`p-1 rounded-lg ${
                    isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className={`space-y-3 text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                <div className={`p-3 rounded-xl border space-y-1 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <span className={`font-bold block ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>
                    1. ISO/IEC 27001:2022
                  </span>
                  <p>Sertifikasi Sistem Manajemen Keamanan Informasi (SMKI) pada seluruh transmisi FCM dan API Gateway BPJS Kesehatan.</p>
                </div>
                <div className={`p-3 rounded-xl border space-y-1 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <span className={`font-bold block ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>
                    2. UU No. 27 Tahun 2022 (UU PDP)
                  </span>
                  <p>Pasal 34: Pemrosesan data medis spesifik dilakukan menggunakan enkripsi SHA-256 dan ZK-Proof tanda tangan kehadiran.</p>
                </div>
                <div className={`p-3 rounded-xl border space-y-1 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <span className={`font-bold block ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]'}`}>
                    3. Peraturan BPJS Kesehatan No. 9 Tahun 2024
                  </span>
                  <p>Standar perlindungan integritas dana jaminan sosial kesehatan dan larangan klaim fiktif berbasis verifikasi faktual peserta.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="button"
                  onClick={() => setShowComplianceModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Tutup Dokumen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
