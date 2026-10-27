import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserCheck, AlertTriangle, ShieldAlert, Clock, MapPin, 
  Stethoscope, Search, Filter, ChevronRight, Activity, 
  CheckCircle2, XCircle, ExternalLink, Calendar, Car, 
  Hospital, Phone, Award, AlertOctagon, TrendingUp, Download
} from 'lucide-react';

// Data DPJP dari integrasi SATUSEHAT SDMK & Analisis Geovelocity
const DOCTORS_DATA = [
  {
    id: 'DPJP-001',
    name: 'dr. Hendra Prasetya, Sp.B',
    nip: '198204122008011003',
    str: 'STR-3372-99214-B',
    sip: 'SIP.503/4412/DPMPTSP/2023',
    sipStatus: 'EXPIRED_WARN', // SIP kadaluwarsa di salah satu faskes
    specialty: 'Spesialis Bedah Umum',
    primaryHospital: 'RSUD Dr. Moewardi Surakarta',
    hospitals: [
      { name: 'RSUD Dr. Moewardi Surakarta', sipValidUntil: '2027-04-12', status: 'ACTIVE' },
      { name: 'RSUP Dr. Kariadi Semarang', sipValidUntil: '2024-01-15', status: 'EXPIRED' }, // Expired!
      { name: 'RS Swasta Medika Kasih', sipValidUntil: '2026-11-20', status: 'ACTIVE' }
    ],
    dailyWorkload: 85, // Pasien/hari
    workloadLimit: 40, // Batas Permenkes No. 14/2021
    riskScore: 94, // High Risk
    flagType: 'GEOVELOCITY_IMPOSSIBLE_TRAVEL',
    casesLinked: ['KLAIM-2026-0881', 'KLAIM-2026-0882', 'KLAIM-2026-0894'],
    estimatedExposure: 178500000,
    geovelocityEvent: {
      date: '24 Oktober 2026',
      pointA: {
        time: '10:00 WIB',
        faskes: 'RSUD Dr. Moewardi, Surakarta',
        action: 'Prosedur Operasi Laparotomi (45 menit)',
        lat: -7.5583,
        lng: 110.8561
      },
      pointB: {
        time: '10:45 WIB',
        faskes: 'RSUP Dr. Kariadi, Semarang',
        action: 'Visite & Tindakan Bedah Minor Poli',
        lat: -6.9942,
        lng: 110.4079
      },
      distanceKm: 105.4,
      timeGapMinutes: 45,
      requiredSpeedKmh: 140.5,
      verdict: 'IMPOSSIBLE_TRAVEL_HARD_TRIGGER'
    }
  },
  {
    id: 'DPJP-002',
    name: 'dr. Ratna Wulandari, Sp.A',
    nip: '198709142012022001',
    str: 'STR-3372-88120-A',
    sip: 'SIP.503/1102/DPMPTSP/2025',
    sipStatus: 'VALID',
    specialty: 'Spesialis Anak',
    primaryHospital: 'RS Ibu & Anak Kasih Bunda',
    hospitals: [
      { name: 'RS Ibu & Anak Kasih Bunda', sipValidUntil: '2028-09-14', status: 'ACTIVE' },
      { name: 'Klinik Utama Pratama Sehat', sipValidUntil: '2027-05-10', status: 'ACTIVE' }
    ],
    dailyWorkload: 72,
    workloadLimit: 40,
    riskScore: 78,
    flagType: 'WORKLOAD_EXCESSIVE',
    casesLinked: ['KLAIM-2026-0744', 'KLAIM-2026-0751'],
    estimatedExposure: 54000000,
    geovelocityEvent: null
  },
  {
    id: 'DPJP-003',
    name: 'dr. Bambang Sujatmiko, Sp.PD',
    nip: '197503112003011002',
    str: 'STR-3371-12004-P',
    sip: 'SIP.503/9921/DPMPTSP/2024',
    sipStatus: 'VALID',
    specialty: 'Spesialis Penyakit Dalam',
    primaryHospital: 'RS Swasta Medika Kasih Surakarta',
    hospitals: [
      { name: 'RS Swasta Medika Kasih Surakarta', sipValidUntil: '2027-03-11', status: 'ACTIVE' },
      { name: 'RSUD Bung Karno', sipValidUntil: '2026-08-30', status: 'ACTIVE' }
    ],
    dailyWorkload: 34,
    workloadLimit: 40,
    riskScore: 24,
    flagType: 'NORMAL',
    casesLinked: [],
    estimatedExposure: 0,
    geovelocityEvent: null
  },
  {
    id: 'DPJP-004',
    name: 'dr. Maya Kusuma, Sp.OG',
    nip: '198006202006042003',
    str: 'STR-3372-44510-O',
    sip: 'SIP.503/3321/DPMPTSP/2021',
    sipStatus: 'EXPIRED',
    specialty: 'Spesialis Obstetri & Ginekologi',
    primaryHospital: 'RS Hermina Solo',
    hospitals: [
      { name: 'RS Hermina Solo', sipValidUntil: '2024-06-20', status: 'EXPIRED' }
    ],
    dailyWorkload: 28,
    workloadLimit: 40,
    riskScore: 82,
    flagType: 'SIP_EXPIRED_ACTIVE_BILLING',
    casesLinked: ['KLAIM-2026-0612', 'KLAIM-2026-0619'],
    estimatedExposure: 67200000,
    geovelocityEvent: null
  },
  {
    id: 'DPJP-005',
    name: 'dr. Anton Wijanarko, Sp.A',
    nip: '198402172009021001',
    str: 'STR-3372-55123-A',
    sip: 'SIP.503/1209/DPMPTSP/2024',
    sipStatus: 'VALID',
    specialty: 'Spesialis Anak',
    primaryHospital: 'RS Khusus Mitra Husada',
    hospitals: [
      { name: 'RS Khusus Mitra Husada', sipValidUntil: '2027-02-17', status: 'ACTIVE' },
      { name: 'RSUD Dr. Moewardi Surakarta', sipValidUntil: '2028-12-01', status: 'ACTIVE' }
    ],
    dailyWorkload: 31,
    workloadLimit: 40,
    riskScore: 18,
    flagType: 'NORMAL',
    casesLinked: [],
    estimatedExposure: 0,
    geovelocityEvent: null
  },
  {
    id: 'DPJP-006',
    name: 'dr. Farhan Malik, Sp.Rad',
    nip: '197908222005011004',
    str: 'STR-3372-66190-R',
    sip: 'SIP.503/7712/DPMPTSP/2023',
    sipStatus: 'VALID',
    specialty: 'Spesialis Radiologi',
    primaryHospital: 'RSUD Dr. Moewardi Surakarta',
    hospitals: [
      { name: 'RSUD Dr. Moewardi Surakarta', sipValidUntil: '2027-08-22', status: 'ACTIVE' },
      { name: 'RS Indriati Solo Baru', sipValidUntil: '2026-05-14', status: 'ACTIVE' }
    ],
    dailyWorkload: 65,
    workloadLimit: 40,
    riskScore: 76,
    flagType: 'WORKLOAD_EXCESSIVE',
    casesLinked: ['KLAIM-2026-0921'],
    estimatedExposure: 42000000,
    geovelocityEvent: null
  },
  {
    id: 'DPJP-007',
    name: 'dr. Sinta Anggraini, Sp.M',
    nip: '198601302011012002',
    str: 'STR-3372-77201-M',
    sip: 'SIP.503/8890/DPMPTSP/2022',
    sipStatus: 'EXPIRED_WARN',
    specialty: 'Spesialis Mata',
    primaryHospital: 'RS Mata Solo',
    hospitals: [
      { name: 'RS Mata Solo', sipValidUntil: '2027-01-30', status: 'ACTIVE' },
      { name: 'Klinik Mata Sejahtera Boyolali', sipValidUntil: '2024-03-10', status: 'EXPIRED' }
    ],
    dailyWorkload: 54,
    workloadLimit: 40,
    riskScore: 86,
    flagType: 'GEOVELOCITY_IMPOSSIBLE_TRAVEL',
    casesLinked: ['KLAIM-2026-1002'],
    estimatedExposure: 89000000,
    geovelocityEvent: {
      date: '21 Oktober 2026',
      pointA: {
        time: '13:00 WIB',
        faskes: 'RS Mata Solo, Surakarta',
        action: 'Operasi Phacoemulsifikasi Katarak',
        lat: -7.5667,
        lng: 110.8167
      },
      pointB: {
        time: '13:30 WIB',
        faskes: 'Klinik Mata Sejahtera, Boyolali',
        action: 'Pemeriksaan Refraksi & Slit Lamp',
        lat: -7.5333,
        lng: 110.5958
      },
      distanceKm: 28.5,
      timeGapMinutes: 30,
      requiredSpeedKmh: 98.2,
      verdict: 'IMPOSSIBLE_TRAVEL_PEAK_HOUR'
    }
  }
];

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

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState(() => DOCTORS_DATA[0]);

  const doctors = DOCTORS_DATA;

  const handleExportSdmk = () => {
    const csvHeader = "ID,Nama,NIP,STR,Spesialisasi,Faskes Utama,Beban Pasien Harian,Batas Permenkes,Skor Risiko,Status Anomali,Potensi Eksposur\n";
    const csvRows = doctors.map(d => 
      `"${d.id}","${d.name}","${d.nip}","${d.str}","${d.specialty}","${d.primaryHospital}",${d.dailyWorkload},${d.workloadLimit},${d.riskScore},"${d.flagType}",${d.estimatedExposure}`
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
    const matchSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        doc.nip.includes(searchTerm) ||
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

          {/* METRIC STRIP DENGAN WATERMARK ICON */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}>
            <div className={`rounded-xl p-2.5 border relative overflow-hidden transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
                : 'bg-white/5 border border-white/10 text-white'
            }`}>
              <Stethoscope className="w-16 h-16 absolute -right-2 -bottom-2 text-slate-700/10 dark:text-white/5 pointer-events-none" />
              <span className={`text-[10px] block font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                Total DPJP Terpantau
              </span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                1.482 Dokter
              </span>
              <span className={`text-[9.5px] ${isLight ? 'text-slate-500 font-medium' : 'text-white/50'}`}>
                Cabang Surakarta &amp; Sekitarnya
              </span>
            </div>
            <div className={`rounded-xl p-2.5 border relative overflow-hidden transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                : 'bg-white/5 border border-white/10 text-white'
            }`}>
              <Car className="w-16 h-16 absolute -right-2 -bottom-2 text-slate-700/10 dark:text-white/5 pointer-events-none" />
              <span className={`text-[10px] block font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Anomali Geovelocity
              </span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                3 Kasus Kritis
              </span>
              <span className={`text-[9.5px] ${isLight ? 'text-slate-500 font-medium' : 'text-white/50'}`}>
                Kecepatan &gt; 120 km/jam antar-RS
              </span>
            </div>
            <div className={`rounded-xl p-2.5 border relative overflow-hidden transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                : 'bg-white/5 border border-white/10 text-white'
            }`}>
              <Activity className="w-16 h-16 absolute -right-2 -bottom-2 text-slate-700/10 dark:text-white/5 pointer-events-none" />
              <span className={`text-[10px] block font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Kelebihan Beban Pelayanan
              </span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                14 DPJP Overcapacity
              </span>
              <span className={`text-[9.5px] ${isLight ? 'text-slate-500 font-medium' : 'text-white/50'}`}>
                &gt; 40 pasien/hari (Permenkes)
              </span>
            </div>
            <div className={`rounded-xl p-2.5 border relative overflow-hidden transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                : 'bg-white/5 border border-white/10 text-white'
            }`}>
              <Award className="w-16 h-16 absolute -right-2 -bottom-2 text-slate-700/10 dark:text-white/5 pointer-events-none" />
              <span className={`text-[10px] block font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                SIP Non-Aktif / Kadaluwarsa
              </span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                7 Dokter Bermasalah
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
                      <span>NIP: <strong className={isLight ? 'text-slate-700' : 'text-white/70'}>{doc.nip}</strong></span>
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
                      ? `⚠️ Peringatan: Melebihi kapasitas rasional pelayanan standar Permenkes 14/2021 (${selectedDoctor.workloadLimit} pasien/hari). Sangat rentan terhadap pola klaim fiktif.`
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
