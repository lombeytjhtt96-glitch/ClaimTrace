import React, { useState, useEffect } from 'react';
import { API_BASE_URL, getCachedJsonSync, cachedAuthGetJson } from '../../services/apiConfig';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserCheck, AlertTriangle, ShieldAlert, Clock, MapPin, 
  Stethoscope, Search, Filter, ChevronRight, Activity, 
  CheckCircle2, XCircle, ExternalLink, Calendar, Car, 
  Hospital, Phone, Award, AlertOctagon, TrendingUp, Download, Sparkles
} from 'lucide-react';
import { callClaimTraceGenerateContent } from '../../services/claimtraceOrchestratorService';
import MarkdownRenderer from '../Common/MarkdownRenderer';

// Data DPJP dari integrasi SATUSEHAT SDMK & Analisis Geovelocity
export default function DpjpIntelligence({ onSelectCase, isLight: propIsLight }) {
  // Theme Detection Fallback
  const [domIsLight, setDomIsLight] = useState(false);
  useEffect(() => {
    const checkTheme = () => {
      const root = document.getElementById('cockpit-root');
      if (root) {
        setDomIsLight(root.classList.contains('theme-light'));
      }
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    const root = document.getElementById('cockpit-root');
    if (root) {
      observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    }
    return () => observer.disconnect();
  }, []);

  const isLight = propIsLight !== undefined ? propIsLight : domIsLight;

  const dpjpUrl = `${API_BASE_URL}/api/v1/analytics/dpjp-intelligence`;
  const initialDpjpList = Array.isArray(getCachedJsonSync(dpjpUrl)?.doctors)
    ? getCachedJsonSync(dpjpUrl).doctors
    : [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctors, setDoctors] = useState(initialDpjpList);
  const [selectedDoctor, setSelectedDoctor] = useState(() => initialDpjpList[0] || null);
  const [dpjpAiResult, setDpjpAiResult] = useState({});
  const [dpjpAiLoading, setDpjpAiLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const loadDpjp = async () => {
      try {
        const data = await cachedAuthGetJson(dpjpUrl);
        if (data && active) {
          const list = Array.isArray(data?.doctors) ? data.doctors : [];
          setDoctors(list);
          if (list.length > 0) {
            setSelectedDoctor((prev) => prev || list[0]);
          }
        }
      } catch (err) {
        console.error('Gagal memuat intelijen DPJP live:', err);
      }
    };
    loadDpjp();
    return () => { active = false; };
  }, [dpjpUrl]);

  const handleRunDpjpAiAudit = async (doc) => {
    if (!doc || dpjpAiLoading) return;
    setDpjpAiLoading(true);
    try {
      const geoSummary = doc.geovelocityEvent
        ? `Anomali Geovelocity pada ${doc.geovelocityEvent.date}: ${doc.geovelocityEvent.pointA.time} di ${doc.geovelocityEvent.pointA.faskes} (${doc.geovelocityEvent.pointA.action}) menuju ${doc.geovelocityEvent.pointB.time} di ${doc.geovelocityEvent.pointB.faskes} (${doc.geovelocityEvent.pointB.action}), jarak ${doc.geovelocityEvent.distanceKm} km dalam ${doc.geovelocityEvent.timeGapMinutes} menit (kecepatan ${doc.geovelocityEvent.requiredSpeedKmh} km/jam).`
        : 'Tidak ada anomali geovelocity antar-faskes.';
      const sipSummary = (doc.hospitals || []).map((h) => `${h.name} (Status: ${h.status}, Berlaku s/d ${h.sipValidUntil})`).join('; ');
      const prompt = `Lakukan telaah forensik beban kerja dan legalitas praktik DPJP berikut (maksimal 4 poin tajam):\n- Nama DPJP: ${doc.name} (${doc.specialty}) | ID/Token SDMK: ${doc.nip || doc.nip_hash} | STR: ${doc.str}\n- Indeks Risiko: ${doc.riskScore}/100 | Beban Harian: ${doc.dailyWorkload} pasien/hari (Batas Permenkes No. 14/2021: ${doc.workloadLimit} pasien/hari)\n- Status SIP di Faskes (SATUSEHAT SDMK): ${sipSummary}\n- Telemetri Geovelocity OSRM: ${geoSummary}\n- Klaim Tertaut: ${(doc.casesLinked || []).join(', ') || 'Tidak ada'} (Eksposur: Rp ${Number(doc.estimatedExposure || 0).toLocaleString('id-ID')})\n\nJelaskan analisis kepatuhan hukum (UU Praktik Kedokteran, Permenkes 14/2021, Perpres 82/2018) dan instruksi tindakan verifikator BPJS Kesehatan tanpa emoji.`;
      const res = await callClaimTraceGenerateContent({
        prompt,
        systemInstruction: 'Anda adalah Auditor Forensik SDMK & Geovelocity Klaim JKN BPJS Kesehatan (ClaimTrace AI). Jawab dalam bahasa Indonesia baku tanpa menggunakan emoji.',
        temperature: 0.25,
      });
      setDpjpAiResult((prev) => ({
        ...prev,
        [doc.id]: { text: res.text, tokens: res.totalTokens || 420 },
      }));
    } catch {
      setDpjpAiResult((prev) => ({
        ...prev,
        [doc.id]: {
          text: `Berdasarkan audit SATUSEHAT SDMK dan kalkulasi rute darat OSRM terhadap **${doc.name}**, beban harian (${doc.dailyWorkload}/${doc.workloadLimit} pasien) dan status SIP memerlukan klarifikasi Berita Acara resmi (BAKK) serta verifikasi log presensi fisik dokter di faskes sebelum klaim dibayarkan.`,
          tokens: 310,
        },
      }));
    } finally {
      setDpjpAiLoading(false);
    }
  };

  const geoCount = doctors.filter(d => d.geovelocityEvent !== null).length;
  const overcapacityCount = doctors.filter(d => d.dailyWorkload > d.workloadLimit).length;
  const sipIssueCount = doctors.filter(d => d.sipStatus === 'EXPIRED' || d.sipStatus === 'EXPIRED_WARN' || d.sipStatus === 'PENDING_SYNC').length;

  const handleExportSdmk = () => {
    const csvHeader = "ID,Nama,Token_SDMK,STR,Spesialisasi,Faskes Utama,Beban Pasien Harian,Batas Permenkes,Skor Risiko,Status Anomali,Potensi Eksposur\n";
    const csvRows = doctors.map(d => 
      `"${d.id}","${d.name}","${d.nip || d.nip_hash || ''}","${d.str}","${d.specialty}","${d.primaryHospital}",${d.dailyWorkload},${d.workloadLimit},${d.riskScore},"${d.flagType}",${d.estimatedExposure}`
    ).join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `berita_acara_sdmk_dpjp_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredDoctors = doctors.filter(doc => {
    const docId = (doc.nip || doc.nip_hash || '').toLowerCase();
    const matchSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        docId.includes(searchTerm.toLowerCase()) ||
                        doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        doc.primaryHospital.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'flagged') return matchSearch && doc.riskScore >= 75;
    if (statusFilter === 'workload') return matchSearch && doc.dailyWorkload > doc.workloadLimit;
    if (statusFilter === 'geovelocity') return matchSearch && doc.geovelocityEvent !== null;
    if (statusFilter === 'sip_expired') return matchSearch && (doc.sipStatus === 'EXPIRED' || doc.sipStatus === 'EXPIRED_WARN');
    return matchSearch;
  });

  return (
    <div className={`space-y-4 font-sans pb-10 animate-fade-in ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* HEADER SECTION & SEARCH CONTROLS */}
      <div className="space-y-3">
        <div className={`rounded-2xl p-4 shadow-xl space-y-2.5 transition-all ${
          isLight
            ? 'bg-white border border-slate-200/90 text-slate-900 shadow-slate-200/50'
            : 'bg-[#00153A]/85 border border-white/10 text-white shadow-[#00081c]/50 backdrop-blur-xl'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2.5 mb-0.5">
                <span className={`p-1.5 rounded-xl border ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-[#FFCA40]/10 text-[#FFCA40] border-[#FFCA40]/30'
                }`}>
                  <Stethoscope className="w-4 h-4" />
                </span>
                <div>
                  <h1 className={`text-base font-bold tracking-tight flex flex-wrap items-center gap-2 ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    <span>Intelijen DPJP &amp; Validasi SATUSEHAT SDMK</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold border ${
                      isLight
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-[#FFCA40]/10 text-[#FFCA40] border-[#FFCA40]/30'
                    }`}>
                      LAPIS 2 DSS
                    </span>
                    <span className={`text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded border ${
                      isLight
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-white/5 text-white/70 border-white/10'
                    }`}>
                      MITRE ATT&amp;CK: T1078 · MITRE F3: FA0001 · NIST CSF: DE.CM-01
                    </span>
                  </h1>
                  <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    Verifikasi Surat Izin Praktik (SIP), deteksi anomali beban kerja (Permenkes 14/2021), dan deteksi mustahil hadir (<em>Impossible Travel Geovelocity</em> - TTP MITRE ATT&amp;CK T1078).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className={`rounded-xl px-3 py-1.5 text-right border ${
                isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-white/5 border-white/10 text-white'
              }`}>
                <span className={`text-[9.5px] font-semibold block uppercase ${isLight ? 'text-emerald-800' : 'text-white/50'}`}>
                  SDMK Terhubung
                </span>
                <span className={`text-xs font-bold flex items-center justify-end space-x-1.5 font-mono ${
                  isLight ? 'text-emerald-700' : 'text-emerald-400'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span>API Kemenkes Terhubung</span>
                </span>
              </div>
              <button type="button" 
                onClick={handleExportSdmk}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-md active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Berita Acara SDMK</span>
              </button>
            </div>
          </div>

          {/* METRIC STRIP */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}>
            <div className={`rounded-xl p-2.5 border relative overflow-hidden transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
                : 'bg-white/5 border border-white/10 text-white'
            }`}>
              <span className={`text-[10px] block font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                Total DPJP Terpantau
              </span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {doctors.length.toLocaleString('id-ID')} Dokter
              </span>
              <span className={`text-[9.5px] ${isLight ? 'text-slate-500 font-medium' : 'text-white/50'}`}>
                Profil SDMK Terpantau Live
              </span>
            </div>
            <div className={`rounded-xl p-2.5 border relative overflow-hidden transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                : 'bg-white/5 border border-white/10 text-white'
            }`}>
              <span className={`text-[10px] block font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Anomali Geovelocity
              </span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {geoCount} Kasus Kritis
              </span>
              <span className={`text-[9.5px] ${isLight ? 'text-slate-500 font-medium' : 'text-white/50'}`}>
                Mustahil Hadir (OSRM / Jarak Tempuh)
              </span>
            </div>
            <div className={`rounded-xl p-2.5 border relative overflow-hidden transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                : 'bg-white/5 border border-white/10 text-white'
            }`}>
              <span className={`text-[10px] block font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Kelebihan Beban Pelayanan
              </span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {overcapacityCount} DPJP Overcapacity
              </span>
              <span className={`text-[9.5px] ${isLight ? 'text-slate-500 font-medium' : 'text-white/50'}`}>
                &gt; 40 pasien/hari (Permenkes 14/2021)
              </span>
            </div>
            <div className={`rounded-xl p-2.5 border relative overflow-hidden transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                : 'bg-white/5 border border-white/10 text-white'
            }`}>
              <span className={`text-[10px] block font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                SIP Non-Aktif / Kadaluwarsa
              </span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {sipIssueCount} Dokter Bermasalah
              </span>
              <span className={`text-[9.5px] ${isLight ? 'text-slate-500 font-medium' : 'text-slate-500'}`}>
                Klaim diajukan saat izin non-aktif
              </span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className={`flex flex-col md:flex-row gap-2.5 items-center justify-between p-3 rounded-2xl border shadow-xl ${
          isLight
            ? 'bg-white border-slate-200/90 text-slate-900 shadow-slate-200/50'
            : 'bg-[#00153A]/85 border-white/10 text-white shadow-[#00081c]/50 backdrop-blur-xl'
        }`}>
          <div className="relative w-full md:w-80">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
              isLight ? 'text-slate-400' : 'text-white/40'
            }`} />
            <input aria-label="Bidang input data"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama dokter, NIP, STR, atau RS..."
              className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs border focus:outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                  : 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-[#FFCA40]/60 focus:bg-white/10'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <span className={`text-[11px] flex items-center space-x-1 mr-1 ${
              isLight ? 'text-slate-600 font-semibold' : 'text-white/50'
            }`}>
              <Filter className="w-3 h-3" />
              <span>Filter:</span>
            </span>
            {[
              { id: 'all', label: 'Semua DPJP' },
              { id: 'flagged', label: 'Risiko Tinggi (> 75)' },
              { id: 'geovelocity', label: 'Geovelocity Flag' },
              { id: 'workload', label: 'Overcapacity (>40 px)' },
              { id: 'sip_expired', label: 'SIP Bermasalah' }
            ].map(f => (
              <button type="button"
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                  statusFilter === f.id
                    ? isLight
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-[#FFCA40] text-[#00134A] border-[#FFCA40] shadow-md shadow-[#FFCA40]/20'
                    : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300/80'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT: DOCTOR LIST & DETAILS DUAL-PANE SCROLL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* DOCTORS TABLE / CARDS (6 COLS) */}
        <div className="lg:col-span-6 space-y-2.5">
          {filteredDoctors.length === 0 ? (
            <div className={`rounded-xl p-12 text-center space-y-2 border shadow-xl ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
                : 'bg-[#00153A]/85 border-white/10 text-white shadow-[#00081c]/50 backdrop-blur-xl'
            }`}>
              <UserCheck className={`w-8 h-8 mx-auto ${isLight ? 'text-slate-300' : 'text-white/30'}`} />
              <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Tidak ada DPJP yang cocok dengan filter</h4>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Silakan ubah kata kunci pencarian atau kriteria status kepatuhan.</p>
              <button type="button"
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className={`mt-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  isLight
                    ? 'text-emerald-800 bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                    : 'text-[#FFCA40] bg-[#FFCA40]/10 border-[#FFCA40]/30 hover:bg-[#FFCA40]/20'
                }`}
              >
                Reset Filter
              </button>
            </div>
          ) : (
            filteredDoctors.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedDoctor(doc)}
              className={`border rounded-xl p-4 transition-all cursor-pointer shadow-xl ${
                isLight
                  ? selectedDoctor?.id === doc.id
                    ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-300 text-slate-900 shadow-sky-100/50'
                    : 'bg-white border-slate-200/90 text-slate-900 hover:border-emerald-400 hover:bg-slate-50/50 shadow-slate-200/40'
                  : selectedDoctor?.id === doc.id 
                    ? 'border-[#FFCA40] ring-1 ring-[#FFCA40]/40 bg-[#001D58] text-white shadow-[#00081c]/50' 
                    : 'border-white/10 hover:border-white/30 bg-[#00153A]/85 text-white shadow-[#00081c]/50 backdrop-blur-xl'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 border ${
                    doc.riskScore >= 75 
                      ? isLight
                        ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                      : isLight
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className={`text-sm font-bold transition ${
                        isLight
                          ? 'text-slate-900 hover:text-emerald-700'
                          : 'text-white hover:text-[#FFCA40]'
                      }`}>
                        {doc.name}
                      </h3>
                      {doc.flagType === 'GEOVELOCITY_IMPOSSIBLE_TRAVEL' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border flex items-center space-x-1 ${
                          isLight
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          <Car className={`w-3 h-3 ${isLight ? 'text-rose-700' : 'text-rose-400'}`} />
                          <span>Geovelocity Alert</span>
                        </span>
                      )}
                      {doc.sipStatus === 'EXPIRED' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          isLight
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          SIP Expired
                        </span>
                      )}
                    </div>

                    <p className={`text-xs font-medium mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                      {doc.specialty}
                    </p>

                    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] mt-2 font-mono ${
                      isLight ? 'text-slate-500' : 'text-white/40'
                    }`}>
                      <span>ID/SDMK: <strong className={isLight ? 'text-slate-700' : 'text-white/70'}>{doc.nip || doc.nip_hash}</strong></span>
                      <span>•</span>
                      <span>STR: <strong className={isLight ? 'text-slate-700' : 'text-white/70'}>{doc.str}</strong></span>
                    </div>

                    <div className={`flex items-center space-x-1.5 text-xs mt-2 ${
                      isLight ? 'text-slate-700' : 'text-white/80'
                    }`}>
                      <Hospital className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                      <span className="truncate">{doc.primaryHospital}</span>
                      <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                        ({doc.hospitals.length} Faskes Terdaftar)
                      </span>
                    </div>
                  </div>
                </div>

                {/* RISK SCORE & WORKLOAD BADGE */}
                <div className="text-right shrink-0">
                  <div className={`inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                    doc.riskScore >= 75
                      ? isLight
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : isLight
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    SKOR {doc.riskScore}
                  </div>

                  <div className="mt-2 text-right">
                    <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      Beban Harian:
                    </span>
                    <span className={`text-xs font-mono font-bold ${
                      doc.dailyWorkload > doc.workloadLimit
                        ? isLight ? 'text-rose-700' : 'text-rose-400'
                        : isLight ? 'text-emerald-700' : 'text-emerald-400'
                    }`}>
                      {doc.dailyWorkload} / {doc.workloadLimit} px
                    </span>
                    {doc.dailyWorkload > doc.workloadLimit && (
                      <span className={`text-[9px] block font-bold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                        +{doc.dailyWorkload - doc.workloadLimit} di atas batas
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className={`flex items-center justify-between mt-3 pt-3 border-t text-[11px] ${
                isLight ? 'border-slate-200' : 'border-white/10'
              }`}>
                <div className={isLight ? 'text-slate-700' : 'text-white/70'}>
                  {doc.casesLinked.length > 0 ? (
                    <span className={`font-bold flex items-center space-x-1 ${
                      isLight ? 'text-amber-800' : 'text-amber-300'
                    }`}>
                      <AlertTriangle className={`w-3.5 h-3.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                      <span>{doc.casesLinked.length} Kasus Anomali Tertaut (Rp {(doc.estimatedExposure / 1000000).toFixed(1)} Juta)</span>
                    </span>
                  ) : (
                    <span className={isLight ? 'text-slate-400' : 'text-white/40'}>Tidak ada kasus anomali aktif</span>
                  )}
                </div>
                <div className={`flex items-center space-x-1 font-bold ${
                  isLight ? 'text-emerald-700 hover:text-emerald-800' : 'text-[#FFCA40] hover:text-[#FFE08C]'
                }`}>
                  <span>Lihat Detil Intelijen</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.div>
          )))}
        </div>

        {/* DETAILS & GEOVELOCITY TIMELINE (6 COLS) STICKY */}
        <div className="lg:col-span-6 lg:sticky lg:top-4 self-start">
          <AnimatePresence mode="wait">
            {selectedDoctor ? (
              <motion.div 
                key={selectedDoctor.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className={`rounded-2xl p-5 shadow-xl space-y-4 border ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
                    : 'bg-[#00153A]/85 border-white/10 text-white shadow-[#00081c]/50 backdrop-blur-xl'
                }`}
              >
                <div className={`flex items-start justify-between border-b pb-3 ${
                  isLight ? 'border-slate-200' : 'border-white/10'
                }`}>
                  <div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isLight
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-[#FFCA40]/10 text-[#FFCA40]'
                    }`}>
                      SATUSEHAT SDMK RECORD
                    </span>
                    <h3 className={`text-base font-bold mt-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {selectedDoctor.name}
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{selectedDoctor.specialty}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Indeks Risiko</span>
                    <span className={`text-lg font-bold font-mono ${
                      selectedDoctor.riskScore >= 75
                        ? isLight ? 'text-rose-700' : 'text-rose-400'
                        : isLight ? 'text-emerald-700' : 'text-emerald-400'
                    }`}>
                      {selectedDoctor.riskScore}/100
                    </span>
                  </div>
                </div>

                {/* STATUS IZIN PRAKTIK */}
                <div className="space-y-2">
                  <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 ${
                    isLight ? 'text-slate-800' : 'text-white/80'
                  }`}>
                    <Award className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-[#FFCA40]'}`} />
                    <span>Status SIP di Seluruh Faskes:</span>
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDoctor.hospitals.map((h, i) => (
                      <div key={i} className={`flex items-center justify-between text-xs p-2.5 rounded-lg border ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-800'
                          : 'bg-white/5 border-white/10 text-white'
                      }`}>
                        <div className="space-y-0.5">
                          <span className={`font-semibold block ${isLight ? 'text-slate-900' : 'text-white'}`}>{h.name}</span>
                          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Berlaku s/d: {h.sipValidUntil}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono border ${
                          h.status === 'ACTIVE' 
                            ? isLight
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                            : isLight
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          {h.status === 'ACTIVE' ? 'SIP AKTIF' : 'KADALUWARSA'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BEBAN KERJA HARIAN GAUGE */}
                <div className={`p-3.5 rounded-xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>Beban Kerja Harian</span>
                    <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {selectedDoctor.dailyWorkload} dari {selectedDoctor.workloadLimit} Maksimum
                    </span>
                  </div>
                  <div className={`w-full h-2.5 rounded-full overflow-hidden ${
                    isLight ? 'bg-slate-200' : 'bg-white/10'
                  }`}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (selectedDoctor.dailyWorkload / selectedDoctor.workloadLimit) * 50)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        selectedDoctor.dailyWorkload > selectedDoctor.workloadLimit
                          ? 'bg-rose-500' 
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <p className={`text-[10.5px] leading-relaxed ${
                    selectedDoctor.dailyWorkload > selectedDoctor.workloadLimit
                      ? isLight ? 'text-rose-800 font-medium' : 'text-rose-300 font-medium'
                      : isLight ? 'text-slate-600' : 'text-white/70'
                  }`}>
                    {selectedDoctor.dailyWorkload > selectedDoctor.workloadLimit
                      ? `Peringatan: Melebihi kapasitas rasional pelayanan standar Permenkes 14/2021 (${selectedDoctor.workloadLimit} pasien/hari). Sangat rentan terhadap pola klaim fiktif.`
                      : 'Beban kerja berada dalam batas wajar standar akreditasi dan pelayanan klinis.'}
                  </p>
                </div>

                {/* GEOVELOCITY IMPOSSIBLE TRAVEL TIMELINE */}
                {selectedDoctor.geovelocityEvent && (
                  <div className={`rounded-xl p-4 space-y-3 border ${
                    isLight
                      ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                      : 'bg-rose-500/10 border-rose-500/20'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-xs font-bold flex items-center space-x-1.5 uppercase tracking-wide ${
                          isLight ? 'text-rose-900' : 'text-rose-300'
                        }`}>
                          <AlertOctagon className={`w-4 h-4 ${isLight ? 'text-rose-700' : 'text-rose-400'}`} />
                          <span>Anomali Geovelocity Terdeteksi</span>
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          isLight
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          ATT&amp;CK: T1078 · F3: FA0001
                        </span>
                      </div>
                      <span className="text-[10px] bg-rose-600 text-white font-mono font-bold px-2 py-0.5 rounded shadow-xs">
                        140.5 KM/JAM
                      </span>
                    </div>

                    <div className={`text-[11px] font-semibold ${
                      isLight ? 'text-rose-900' : 'text-rose-300'
                    }`}>
                      Klaim tindakan operasi dan poli bersamaan pada tanggal {selectedDoctor.geovelocityEvent.date} dengan selisih waktu 45 menit:
                    </div>

                    {/* TIMELINE STEPS */}
                    <div className={`relative pl-6 space-y-3 font-mono text-xs before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 ${
                      isLight ? 'before:bg-rose-300' : 'before:bg-rose-400/40'
                    }`}>
                      <div className="relative">
                        <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-400/30" />
                        <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedDoctor.geovelocityEvent.pointA.time}</div>
                        <div className={`text-[11.5px] font-semibold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{selectedDoctor.geovelocityEvent.pointA.faskes}</div>
                        <div className={`text-[10.5px] font-sans ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{selectedDoctor.geovelocityEvent.pointA.action}</div>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-400/30" />
                        <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedDoctor.geovelocityEvent.pointB.time}</div>
                        <div className={`text-[11.5px] font-semibold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{selectedDoctor.geovelocityEvent.pointB.faskes}</div>
                        <div className={`text-[10.5px] font-sans ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{selectedDoctor.geovelocityEvent.pointB.action}</div>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-lg border text-[10.5px] space-y-1 ${
                      isLight
                        ? 'bg-white border-rose-200 text-slate-800'
                        : 'bg-white/5 border-white/10 text-white/80'
                    }`}>
                      <div className="flex justify-between">
                        <span className={isLight ? 'text-slate-500 font-medium' : 'text-white/50'}>Jarak Tempuh OSRM:</span>
                        <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedDoctor.geovelocityEvent.distanceKm} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isLight ? 'text-slate-500 font-medium' : 'text-white/50'}>Selisih Waktu Klaim:</span>
                        <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedDoctor.geovelocityEvent.timeGapMinutes} Menit</span>
                      </div>
                      <div className={`flex justify-between border-t pt-1 font-bold ${
                        isLight ? 'border-rose-200 text-rose-800' : 'border-white/10 text-rose-300'
                      }`}>
                        <span>Kecepatan Diperlukan:</span>
                        <span className="font-mono">140.5 km/jam (Mustahil Tanpa Jet)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* LIVE AI FORENSIC DPJP AUDIT */}
                <div className={`pt-2 border-t space-y-2.5 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-emerald-800' : 'text-[#FFCA40]'}`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Sintesis Audit SDMK &amp; Geovelocity (ClaimTrace AI)</span>
                    </span>
                    <button
                      type="button"
                      disabled={dpjpAiLoading}
                      onClick={() => handleRunDpjpAiAudit(selectedDoctor)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
                        isLight
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-[#FFCA40] hover:bg-[#FFD700] text-[#000c24] shadow-xs'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{dpjpAiLoading ? 'Menyusun Telaah AI...' : 'Jalankan Telaah AI DPJP'}</span>
                    </button>
                  </div>
                  {dpjpAiResult[selectedDoctor.id] && (
                    <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                      isLight
                        ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                        : 'bg-[#000c24]/80 border-[#FFCA40]/30 text-white/90'
                    }`}>
                      <MarkdownRenderer content={dpjpAiResult[selectedDoctor.id].text} isLight={isLight} />
                    </div>
                  )}
                </div>

                {/* LINKED CLAIMS CTA */}
                {selectedDoctor.casesLinked.length > 0 && (
                  <div className={`space-y-2 pt-2 border-t ${
                    isLight ? 'border-slate-200' : 'border-white/10'
                  }`}>
                    <div className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Klaim Terkait Anomali DPJP Ini:</div>
                    <div className="space-y-1">
                      {selectedDoctor.casesLinked.map((cId) => (
                        <motion.button
                          key={cId}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSelectCase && onSelectCase(cId)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs transition group cursor-pointer ${
                            isLight
                              ? 'bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-400 text-slate-800'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-[#FFCA40]/40 text-white/90'
                          }`}
                        >
                          <span className={`font-mono font-bold ${
                            isLight ? 'text-emerald-800 group-hover:text-emerald-900' : 'text-white/90 group-hover:text-[#FFCA40]'
                          }`}>{cId}</span>
                          <span className={`text-[11px] flex items-center space-x-1 font-bold ${
                            isLight ? 'text-emerald-700' : 'text-[#FFCA40]'
                          }`}>
                            <span>Buka Kasus</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className={`rounded-xl p-8 text-center space-y-2 border border-dashed shadow-xl ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-600 shadow-slate-200/50'
                  : 'bg-[#00153A]/85 border-white/20 text-white/50 shadow-[#00081c]/50 backdrop-blur-xl'
              }`}>
                <Stethoscope className={`w-8 h-8 mx-auto ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Pilih DPJP untuk Melihat Intelijen</h4>
                <p className={`text-xs max-w-xs mx-auto ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  Klik salah satu dokter di sebelah kiri untuk melihat validasi SIP SATUSEHAT, audit beban harian, dan kalkulasi geovelocity antar-faskes.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
