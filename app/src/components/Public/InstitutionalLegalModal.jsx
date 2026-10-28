import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, FileText, Lock, Clock, CheckCircle2, AlertTriangle, 
  Search, Copy, Check, Printer, X, ExternalLink, Scale, 
  Building2, Award, FileCheck, Eye, Download, Info, Landmark
} from 'lucide-react';

export default function InstitutionalLegalModal({ isOpen, onClose, initialTab = 'privacy', isLight = undefined }) {
  const [internalIsLight, setInternalIsLight] = useState(() => {
    if (typeof isLight === 'boolean') return isLight;
    if (typeof document !== 'undefined') {
      const root = document.getElementById('cockpit-root');
      if (root) return root.classList.contains('theme-light');
      return localStorage.getItem('claimtrace_theme') === 'light';
    }
    return false;
  });

  useEffect(() => {
    if (typeof isLight === 'boolean') {
      setInternalIsLight(isLight);
      return;
    }
    const update = () => {
      const root = document.getElementById('cockpit-root');
      if (root) {
        setInternalIsLight(root.classList.contains('theme-light'));
      } else {
        setInternalIsLight(localStorage.getItem('claimtrace_theme') === 'light');
      }
    };
    update();
    const observer = new MutationObserver(update);
    const root = document.getElementById('cockpit-root');
    if (root) observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [isLight]);

  const effectiveIsLight = typeof isLight === 'boolean' ? isLight : internalIsLight;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync tab when initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyText = () => {
    const contentElem = document.getElementById('legal-modal-body');
    if (contentElem) {
      navigator.clipboard.writeText(contentElem.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs = [
    {
      id: 'privacy',
      label: 'Kebijakan Privasi (UU PDP)',
      badge: 'UU No. 27/2022',
      icon: Shield,
    },
    {
      id: 'terms',
      label: 'Syarat & Ketentuan Layanan',
      badge: 'Pakta Integritas',
      icon: FileCheck,
    },
    {
      id: 'security',
      label: 'Keamanan Siber & ISO 27001',
      badge: 'SMKI & BSSN',
      icon: Lock,
    },
    {
      id: 'sla',
      label: 'Standar SLA 10 Hari Kerja',
      badge: 'Perpres 82/2018',
      icon: Clock,
    },
    {
      id: 'frameworks',
      label: '6 Standar Siber & Anti-Fraud',
      badge: 'MITRE F3 · ATT&CK · NIST',
      icon: Shield,
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className={`fixed inset-0 backdrop-blur-md transition-opacity ${
            effectiveIsLight ? 'bg-slate-900/50' : 'bg-[#00081c]/80'
          }`}
        />

        {/* Modal Window */}
        <motion.div 
          id="institutional-legal-window"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className={`relative w-full max-w-4xl rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] z-10 transition-colors duration-200 ${
            effectiveIsLight 
              ? 'bg-white text-slate-800 border-slate-200 shadow-slate-400/40' 
              : 'bg-[#00153A] text-white border-white/20 shadow-black/80'
          }`}
        >
          {/* MODAL HEADER */}
          <div className={`shrink-0 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ${
            effectiveIsLight 
              ? 'bg-slate-50 border-slate-200 text-slate-900' 
              : 'bg-[#00134A] border-white/10 text-white'
          }`}>
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm ${
                effectiveIsLight 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-950/30'
              }`}>
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                    effectiveIsLight 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}>
                    Dokumen Hukum Resmi
                  </span>
                  <span className={`text-[10px] font-mono ${effectiveIsLight ? 'text-slate-400' : 'text-white/50'}`}>
                    DOK-HUKUM/BPJS/CT-2026
                  </span>
                </div>
                <h2 className={`text-lg sm:text-xl font-bold mt-0.5 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                  Tata Kelola, Regulasi & Integritas Data JKN
                </h2>
                <p className={`text-xs ${effectiveIsLight ? 'text-slate-500' : 'text-white/60'}`}>
                  BPJS Kesehatan Kantor Pusat · Kedeputian Bidang Pengawasan dan Pemeriksaan
                </p>
              </div>
            </div>

            {/* Actions: Search, Copy, Print, Close */}
            <div className="flex items-center space-x-2 self-end sm:self-center">
              <button type="button"
                onClick={handleCopyText}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                  effectiveIsLight 
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs' 
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                }`}
                title="Salin Dokumen Lengkap"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Tersalin' : 'Salin'}</span>
              </button>

              <button type="button"
                onClick={handlePrint}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                  effectiveIsLight 
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs' 
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                }`}
                title="Cetak Dokumen"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Cetak</span>
              </button>

              <button type="button"
                onClick={onClose}
                aria-label="Tutup jendela dokumen hukum"
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  effectiveIsLight 
                    ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 shadow-xs' 
                    : 'bg-white/10 border-transparent text-white hover:bg-white/20'
                }`}
                title="Tutup (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TAB BAR NAVIGATION */}
          <div className={`shrink-0 px-4 sm:px-6 flex overflow-x-auto space-x-2 scrollbar-none py-2 border-b ${
            effectiveIsLight 
              ? 'bg-white border-slate-200' 
              : 'bg-[#000c24] border-white/10'
          }`}>
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button type="button"
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all cursor-pointer ${
                    isActive 
                      ? (effectiveIsLight 
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                          : 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40') 
                      : (effectiveIsLight 
                          ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' 
                          : 'text-white/60 hover:bg-white/5 hover:text-white')
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? (effectiveIsLight ? 'text-white' : 'text-[#000c24]') : (effectiveIsLight ? 'text-slate-400' : 'text-white/40')}`} />
                  <span>{t.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    isActive 
                      ? (effectiveIsLight ? 'bg-emerald-700/60 text-white' : 'bg-[#000c24]/20 text-[#000c24]') 
                      : (effectiveIsLight ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-white/60')
                  }`}>
                    {t.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SEARCH IN DOCUMENT */}
          <div className={`shrink-0 px-4 sm:px-6 py-2.5 border-b flex items-center justify-between gap-3 text-xs ${
            effectiveIsLight 
              ? 'bg-slate-50/80 border-slate-200 text-slate-800' 
              : 'bg-[#00153A]/90 border-white/10 text-white'
          }`}>
            <div className="relative flex-1 max-w-sm">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${effectiveIsLight ? 'text-slate-400' : 'text-white/40'}`} />
              <input aria-label="Cari pasal, regulasi, hak data, atau kata kunci..." 
                type="text"
                placeholder="Cari pasal, regulasi, hak data, atau kata kunci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none transition-all ${
                  effectiveIsLight 
                    ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' 
                    : 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-emerald-500'
                }`}
              />
            </div>
            <div className={`text-[11px] hidden sm:flex items-center space-x-1.5 ${effectiveIsLight ? 'text-slate-500' : 'text-white/50'}`}>
              <Info className={`w-3.5 h-3.5 ${effectiveIsLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>Berlaku secara mengikat untuk seluruh entitas faskes & verifikator</span>
            </div>
          </div>

          {/* MODAL BODY (CONTENT SCROLLABLE) */}
          <div id="legal-modal-body" className={`flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs sm:text-[13px] leading-relaxed ${
            effectiveIsLight ? 'bg-white text-slate-700' : 'text-white/80'
          }`}>
            
            {/* TAB 1: KEBIJAKAN PRIVASI & UU PDP */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                {/* Banner Header */}
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  effectiveIsLight 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-emerald-500/10 border-emerald-500/30'
                }`}>
                  <div className={`flex items-center space-x-2 font-bold ${effectiveIsLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs uppercase tracking-wide">
                      Pernyataan Kepatuhan Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27/2022)
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${effectiveIsLight ? 'text-emerald-800/90' : 'text-white/70'}`}>
                    BPJS Kesehatan dan Tim Pengembang Rekayasa Sistem berkomitmen penuh melindungi privasi peserta Jaminan Kesehatan Nasional (JKN) dan kerahasiaan rekam medis sesuai dengan peraturan perundang-undangan yang berlaku di Republik Indonesia.
                  </p>
                </div>

                {/* Pasal 1 */}
                <div className={`space-y-2 border-b pb-4 ${effectiveIsLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <h3 className={`font-bold text-sm sm:text-base flex items-center space-x-2 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    <span className="text-emerald-600 font-bold">Pasal 1:</span>
                    <span>Landasan Hukum Pemrosesan Data JKN</span>
                  </h3>
                  <p className={effectiveIsLight ? 'text-slate-600' : 'text-white/70'}>
                    Pemrosesan data dalam platform ClaimTrace Decision Support System (DSS) dilakukan semata-mata berdasarkan dasar hukum yang sah:
                  </p>
                  <ul className={`list-disc pl-5 space-y-1 ${effectiveIsLight ? 'text-slate-600' : 'text-white/70'}`}>
                    <li><strong>Undang-Undang No. 27 Tahun 2022</strong> tentang Perlindungan Data Pribadi (khususnya Pasal 20 mengenai kewajiban pemrosesan data untuk pemenuhan kewajiban hukum pengendali data jaminan sosial).</li>
                    <li><strong>Peraturan Presiden No. 82 Tahun 2018</strong> tentang Jaminan Kesehatan (beserta perubahannya).</li>
                    <li><strong>Undang-Undang No. 17 Tahun 2023</strong> tentang Kesehatan (khususnya mengenai kerahasiaan rekam medis dan data kesehatan pribadi).</li>
                    <li><strong>Peraturan Menteri Kesehatan No. 24 Tahun 2022</strong> tentang Rekam Medis Elektronik (RME).</li>
                    <li><strong>Peraturan Menteri Kesehatan No. 14 Tahun 2021 & No. 26 Tahun 2021</strong> tentang Standar Usaha dan Tata Kelola Fasilitas Kesehatan.</li>
                  </ul>
                </div>

                {/* Pasal 2 */}
                <div className={`space-y-2 border-b pb-4 ${effectiveIsLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <h3 className={`font-bold text-sm sm:text-base flex items-center space-x-2 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    <span className="text-emerald-600 font-bold">Pasal 2:</span>
                    <span>Prinsip Zero-PHI Telemetry & Minimalisasi Data</span>
                  </h3>
                  <p className={effectiveIsLight ? 'text-slate-600' : 'text-white/70'}>
                    ClaimTrace menerapkan doktrin <em>Zero-PHI (Zero Protected Health Information)</em> dalam transmisi telemetri:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className={`p-3.5 rounded-xl border ${
                      effectiveIsLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-800' 
                        : 'bg-[#000c24]/70 border-white/10 text-white'
                    }`}>
                      <span className={`font-bold block mb-1 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                        1. Telemetri Presensi Biner Mobile JKN
                      </span>
                      <p className={`text-[11px] leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/60'}`}>
                        Notifikasi konfirmasi ke smartphone peserta hanya mengirimkan permintaan verifikasi kehadiran biner <code className={effectiveIsLight ? 'bg-slate-200 text-slate-900 px-1 py-0.5 rounded font-mono' : ''}>[Konfirmasi: Ya/Tidak]</code> tanpa menyertakan riwayat penyakit, diagnosis mendalam, atau catatan sensitif.
                      </p>
                    </div>
                    <div className={`p-3.5 rounded-xl border ${
                      effectiveIsLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-800' 
                        : 'bg-[#000c24]/70 border-white/10 text-white'
                    }`}>
                      <span className={`font-bold block mb-1 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                        2. Pseudonimisasi & Masking Data
                      </span>
                      <p className={`text-[11px] leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/60'}`}>
                        Nomor Identitas Kependudukan (NIK) dan Nomor Kartu Peserta disamarkan dalam antarmuka pengawasan (misal: <code className={effectiveIsLight ? 'bg-slate-200 text-slate-900 px-1 py-0.5 rounded font-mono' : ''}>00028917*****</code>) dan disimpan dalam hash bergaram (*salted hash*).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pasal 3 */}
                <div className={`space-y-2 border-b pb-4 ${effectiveIsLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <h3 className={`font-bold text-sm sm:text-base flex items-center space-x-2 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    <span className="text-emerald-600 font-bold">Pasal 3:</span>
                    <span>Hak Subjek Data Pribadi (Peserta & Tenaga Medis)</span>
                  </h3>
                  <p className={effectiveIsLight ? 'text-slate-600' : 'text-white/70'}>
                    Sesuai Bab IV UU No. 27 Tahun 2022, peserta dan tenaga medis memiliki hak mutlak:
                  </p>
                  <ul className={`list-disc pl-5 space-y-1 ${effectiveIsLight ? 'text-slate-600' : 'text-white/70'}`}>
                    <li><strong>Hak Mendapatkan Informasi:</strong> Mengetahui tujuan penapisan klaim dan alasan keterlibatan data pelayanan.</li>
                    <li><strong>Hak Mengakses & Memperoleh Salinan:</strong> Peserta berhak melihat riwayat klaim yang diajukan atas namanya melalui menu Riwayat Pelayanan di aplikasi Mobile JKN.</li>
                    <li><strong>Hak Perbaikan & Koreksi Data:</strong> Mengajukan koreksi apabila faskes melakukan penagihan ganda atau pencatatan tindakan fiktif (*Phantom Billing*).</li>
                    <li><strong>Hak Menolak Keputusan Otomatis Penuh:</strong> ClaimTrace menjamin bahwa tidak ada klaim yang ditolak atau disetujui semata-mata oleh kecerdasan buatan probabilistik tanpa telaah verifikator manusia.</li>
                  </ul>
                </div>

                {/* Pasal 4 */}
                <div className={`space-y-2 border-b pb-4 ${effectiveIsLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <h3 className={`font-bold text-sm sm:text-base flex items-center space-x-2 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    <span className="text-emerald-600 font-bold">Pasal 4:</span>
                    <span>Masa Retensi & Penghapusan Data</span>
                  </h3>
                  <p className={`leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/70'}`}>
                    Data penagihan klaim dan audit trail disimpan selama 10 (sepuluh) tahun sesuai dengan Jadwal Retensi Arsip (JRA) Keuangan Negara dan Standar Audit Badan Pemeriksa Keuangan (BPK). Setelah masa retensi berakhir, berkas audit akan dianonimkan secara permanen atau dimusnahkan dengan berita acara resmi.
                  </p>
                </div>

                {/* Pasal 5 */}
                <div className="space-y-2">
                  <h3 className={`font-bold text-sm sm:text-base flex items-center space-x-2 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    <span className="text-emerald-600 font-bold">Pasal 5:</span>
                    <span>Pejabat Perlindungan Data Pribadi (DPO) & Pengaduan</span>
                  </h3>
                  <p className={`leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/70'}`}>
                    Apabila Anda menemukan dugaan kebocoran data, anomali penggunaan identitas peserta oleh fasilitas kesehatan, atau ingin melaksanakan hak subjek data Anda, hubungi:
                  </p>
                  <div className={`p-3.5 rounded-xl border text-xs space-y-1 font-mono ${
                    effectiveIsLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-800' 
                      : 'bg-[#000c24]/70 border-white/10 text-white/80'
                  }`}>
                    <p><strong className={effectiveIsLight ? 'text-slate-900' : 'text-white'}>Unit DPO:</strong> Kantor Pusat BPJS Kesehatan · Bagian Kepatuhan & Hukum</p>
                    <p><strong className={effectiveIsLight ? 'text-slate-900' : 'text-white'}>Alamat:</strong> Jl. Letjen Suprapto Kav. 20 No. 14, Cempaka Putih, Jakarta Pusat 10510</p>
                    <p><strong className={effectiveIsLight ? 'text-slate-900' : 'text-white'}>Email Khusus Privasi:</strong> dpo@bpjs-kesehatan.go.id</p>
                    <p><strong className={effectiveIsLight ? 'text-slate-900' : 'text-white'}>Call Center Pengaduan:</strong> BPJS Care Center 165 (Bebas Pulsa 24 Jam)</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SYARAT & KETENTUAN LAYANAN */}
            {activeTab === 'terms' && (
              <div className="space-y-6">
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  effectiveIsLight 
                    ? 'bg-sky-50 border-sky-200 text-sky-950' 
                    : 'bg-cyan-500/10 border-cyan-500/30'
                }`}>
                  <div className={`flex items-center space-x-2 font-bold ${effectiveIsLight ? 'text-sky-800' : 'text-cyan-300'}`}>
                    <FileCheck className="w-4 h-4 text-sky-600" />
                    <span className="text-xs uppercase tracking-wide">
                      Pakta Integritas & Ketentuan Akses Resmi Portal Verifikator
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${effectiveIsLight ? 'text-sky-900/80' : 'text-white/70'}`}>
                    Akses terhadap portal ClaimTrace DSS hanya diberikan kepada pegawai berwenang BPJS Kesehatan, tim audit medik, dan perwakilan fasilitas kesehatan rujukan yang telah menandatangani pakta integritas kedinasan.
                  </p>
                </div>

                {/* Pasal 1 */}
                <div className={`space-y-2 border-b pb-4 ${effectiveIsLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <h3 className={`font-bold text-sm sm:text-base flex items-center space-x-2 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    <span className="text-sky-600 font-bold">Pasal 1:</span>
                    <span>Otorisasi Akun & Autentikasi Berlapis</span>
                  </h3>
                  <ul className={`list-disc pl-5 space-y-1 ${effectiveIsLight ? 'text-slate-600' : 'text-white/70'}`}>
                    <li>Setiap verifikator wajib menggunakan NIP Kedinasan resmi yang terdaftar di Sistem SDM BPJS Kesehatan.</li>
                    <li>Wajib mengaktifkan Verifikasi Dua Faktor (MFA) via aplikasi Mobile JKN atau TOTP resmi.</li>
                    <li>Dilarang meminjamkan, membagikan, atau mempercayakan kredensial akun kepada pihak ketiga tanpa surat pelimpahan wewenang tertulis dari Kepala Cabang.</li>
                  </ul>
                </div>

                {/* Pasal 2 */}
                <div className={`space-y-2 border-b pb-4 ${effectiveIsLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <h3 className={`font-bold text-sm sm:text-base flex items-center space-x-2 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    <span className="text-sky-600 font-bold">Pasal 2:</span>
                    <span>Larangan Keras & Konsekuensi Tindak Pidana</span>
                  </h3>
                  <p className={effectiveIsLight ? 'text-slate-600' : 'text-white/70'}>
                    Tindakan-tindakan berikut dikualifikasikan sebagai pelanggaran berat dengan konsekuensi sanksi administratif dan tuntutan pidana:
                  </p>
                  <div className={`p-3.5 border rounded-xl space-y-2 ${
                    effectiveIsLight 
                      ? 'bg-rose-50 border-rose-200 text-rose-900' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  }`}>
                    <div className={`flex items-center space-x-2 font-bold text-xs ${effectiveIsLight ? 'text-rose-700' : 'text-rose-300'}`}>
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Sanksi Yuridis UU ITE, UU Tipikor & UU PDP:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-[11.5px] leading-relaxed">
                      <li><strong>Pasal 30 & 32 UU ITE No. 1/2024:</strong> Mengakses, mengubah, merusak, atau menyusupkan kode jahat ke sistem diancam pidana penjara paling lama 8 (delapan) tahun dan denda hingga Rp 3 Miliar.</li>
                      <li><strong>UU Tipikor No. 31/1999 jo. No. 20/2001:</strong> Berkolusi dengan fasilitas kesehatan untuk meloloskan klaim rekayasa atau fiktif merupakan perbuatan korupsi yang merugikan keuangan negara (DJS).</li>
                      <li><strong>Pasal 67 UU PDP No. 27/2022:</strong> Memperjualbelikan atau membocorkan data pribadi peserta diancam pidana penjara 5 (lima) tahun dan denda Rp 5 Miliar.</li>
                    </ul>
                  </div>
                </div>

                {/* Pasal 3 */}
                <div className={`space-y-2 border-b pb-4 ${effectiveIsLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <h3 className={`font-bold text-sm sm:text-base flex items-center space-x-2 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    <span className="text-sky-600 font-bold">Pasal 3:</span>
                    <span>Otoritas Penilaian Medis (Human-in-the-Loop)</span>
                  </h3>
                  <p className={`leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/70'}`}>
                    Sistem ClaimTrace DSS bertindak sebagai instrumen bantu keputusan (*decision support tool*). Algoritma menghitung skor risiko triase berdasarkan formula deterministik objektif. Otoritas penolakan klaim, persetujuan klaim, atau pengalihan sengketa medik sepenuhnya berada di tangan verifikator medis manusia yang memiliki surat keputusan penugasan.
                  </p>
                </div>

                {/* Pasal 4 */}
                <div className="space-y-2">
                  <h3 className={`font-bold text-sm sm:text-base flex items-center space-x-2 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    <span className="text-sky-600 font-bold">Pasal 4:</span>
                    <span>Hak Sanggah & Klarifikasi Fasilitas Kesehatan</span>
                  </h3>
                  <p className={`leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/70'}`}>
                    Fasilitas kesehatan rujukan berhak mendapatkan notifikasi resmi apabila berkas klaim terdeteksi masuk dalam Jalur Kuning atau Jalur Merah. Faskes diberikan waktu 3 (tiga) hari kerja untuk melengkapi dokumen pembuktian medis sebelum verifikator mengeluarkan Berita Acara Pending atau Tolak Klaim.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: STANDAR KEAMANAN SIBER & ISO 27001 */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  effectiveIsLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-900' 
                    : 'bg-white/5 border border-white/10 text-white'
                }`}>
                  <div className={`flex items-center space-x-2 font-bold ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    <Lock className={`w-4 h-4 ${effectiveIsLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                    <span className="text-xs uppercase tracking-wide">
                      Arsitektur Keamanan Siber & Kepatuhan Standar BSSN
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/70'}`}>
                    Sistem dirancang mengacu pada kerangka kerja Sistem Manajemen Keamanan Informasi (SMKI) ISO/IEC 27001:2022 serta standar keamanan infrastruktur informasi vital Badan Siber dan Sandi Negara (BSSN).
                  </p>
                </div>

                {/* Framework 1 */}
                <div className={`space-y-2 border-b pb-4 ${effectiveIsLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <h3 className={`font-bold text-sm sm:text-base flex items-center space-x-2 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    <span className={effectiveIsLight ? 'text-emerald-600 font-bold' : 'text-emerald-400'}>1.</span>
                    <span>Protokol Enkripsi Berlapis (Defense-in-Depth)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className={`p-3.5 rounded-xl border ${
                      effectiveIsLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-800' 
                        : 'bg-[#000c24]/70 border-white/10 text-white'
                    }`}>
                      <span className={`font-bold block text-xs mb-1 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>TLS 1.3 Transport</span>
                      <p className={`text-[11px] ${effectiveIsLight ? 'text-slate-600' : 'text-white/50'}`}>Enkripsi komunikasi data jaringan publik menggunakan Perfect Forward Secrecy.</p>
                    </div>
                    <div className={`p-3.5 rounded-xl border ${
                      effectiveIsLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-800' 
                        : 'bg-[#000c24]/70 border-white/10 text-white'
                    }`}>
                      <span className={`font-bold block text-xs mb-1 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>AES-256 at Rest</span>
                      <p className={`text-[11px] ${effectiveIsLight ? 'text-slate-600' : 'text-white/50'}`}>Penyimpanan basis data terenkripsi militer pada server cloud pemerintah terakreditasi.</p>
                    </div>
                    <div className={`p-3.5 rounded-xl border ${
                      effectiveIsLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-800' 
                        : 'bg-[#000c24]/70 border-white/10 text-white'
                    }`}>
                      <span className={`font-bold block text-xs mb-1 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>SHA-256 Ledger</span>
                      <p className={`text-[11px] ${effectiveIsLight ? 'text-slate-600' : 'text-white/50'}`}>Segel audit trail kriptografis tak terhapuskan untuk menjamin integritas pembuktian BPK.</p>
                    </div>
                  </div>
                </div>

                {/* Framework 2 */}
                <div className={`space-y-2 border-b pb-4 ${effectiveIsLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <h3 className={`font-bold text-sm sm:text-base flex items-center space-x-2 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    <span className={effectiveIsLight ? 'text-emerald-600 font-bold' : 'text-emerald-400'}>2.</span>
                    <span>Isolasi Analitik Lokal DuckDB (Privacy-Preserving)</span>
                  </h3>
                  <p className={`leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/70'}`}>
                    Pemrosesan OLAP pada transaksi klaim dioperasikan dalam lingkungan WebAssembly terisolasi di sisi peramban (*client-side sandboxed execution*). Pendekatan ini memastikan data sensitif tidak dipaparkan ke pihak ketiga serta mengeliminasi risiko serangan *Distributed Denial of Service* (DDoS) pada server inti BPJS.
                  </p>
                </div>

                {/* Framework 3 */}
                <div className="space-y-2">
                  <h3 className={`font-bold text-sm sm:text-base flex items-center space-x-2 ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    <span className={effectiveIsLight ? 'text-emerald-600 font-bold' : 'text-emerald-400'}>3.</span>
                    <span>Tanggap Insiden Siber (BPJS-CSIRT)</span>
                  </h3>
                  <p className={`leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/70'}`}>
                    Setiap anomali lalu lintas data, upaya brute-force pada pintu masuk NIP, atau ketidaksesuaian sertifikat sesi otomatis memicu isolasi akun dan pelaporan ke Tim Tanggap Insiden Keamanan Komputer BPJS Kesehatan (BPJS-CSIRT) dalam waktu kurang dari 15 menit.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: SERVICE LEVEL AGREEMENT (SLA) 10 HARI */}
            {activeTab === 'sla' && (
              <div className="space-y-6">
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  effectiveIsLight 
                    ? 'bg-amber-50 border-amber-200 text-amber-950' 
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <div className={`flex items-center space-x-2 font-bold ${effectiveIsLight ? 'text-amber-800' : 'text-amber-300'}`}>
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-xs uppercase tracking-wide">
                      Komitmen Kepatuhan Batas Waktu Verifikasi Klaim 10 Hari Kerja
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${effectiveIsLight ? 'text-amber-900/80' : 'text-white/70'}`}>
                    Sesuai amanat Pasal 76 ayat (2) Peraturan Presiden No. 82 Tahun 2018, BPJS Kesehatan wajib menyelesaikan verifikasi klaim paling lambat 10 (sepuluh) hari kerja sejak berkas penagihan diterima lengkap dari faskes.
                  </p>
                </div>

                {/* Metric Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`p-4 rounded-2xl border text-center ${
                    effectiveIsLight 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                      : 'bg-[#000c24]/70 border-emerald-500/30'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase block ${effectiveIsLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Jalur Hijau (Fast-Track)</span>
                    <span className={`text-2xl font-bold my-1 block ${effectiveIsLight ? 'text-emerald-800' : 'text-emerald-300'}`}>&lt; 24 Jam</span>
                    <span className={`text-[11px] ${effectiveIsLight ? 'text-emerald-700/80' : 'text-white/60'}`}>Lolos verifikasi otomatis &amp; terbit FPK</span>
                  </div>
                  <div className={`p-4 rounded-2xl border text-center ${
                    effectiveIsLight 
                      ? 'bg-amber-50 border-amber-200 text-amber-950' 
                      : 'bg-[#000c24]/70 border-amber-500/30'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase block ${effectiveIsLight ? 'text-amber-700' : 'text-amber-400'}`}>Jalur Kuning (Klarifikasi)</span>
                    <span className={`text-2xl font-bold my-1 block ${effectiveIsLight ? 'text-amber-800' : 'text-amber-300'}`}>3 Hari Kerja</span>
                    <span className={`text-[11px] ${effectiveIsLight ? 'text-amber-700/80' : 'text-white/60'}`}>Konfirmasi berkas rekam medis faskes</span>
                  </div>
                  <div className={`p-4 rounded-2xl border text-center ${
                    effectiveIsLight 
                      ? 'bg-rose-50 border-rose-200 text-rose-950' 
                      : 'bg-[#000c24]/70 border-rose-500/30'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase block ${effectiveIsLight ? 'text-rose-700' : 'text-rose-400'}`}>Jalur Merah (Investigasi)</span>
                    <span className={`text-2xl font-bold my-1 block ${effectiveIsLight ? 'text-rose-800' : 'text-rose-300'}`}>Pending Resmi</span>
                    <span className={`text-[11px] ${effectiveIsLight ? 'text-rose-700/80' : 'text-white/60'}`}>Audit forensik medik &amp; telemetri JKN</span>
                  </div>
                </div>

                <div className={`space-y-2 border-b pb-4 ${effectiveIsLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <h3 className={`font-bold text-sm sm:text-base ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    Sanksi Denda Keterlambatan Pembayaran BPJS (Pasal 76 ayat 4)
                  </h3>
                  <p className={`leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/70'}`}>
                    Apabila keterlambatan verifikasi dan pembayaran klaim diakibatkan oleh kelalaian operasional internal BPJS Kesehatan di luar sengketa medik, BPJS Kesehatan membayar ganti rugi denda sebesar 1% (satu persen) per bulan dari jumlah yang harus dibayarkan. ClaimTrace DSS dirancang khusus untuk memotong 60% waktu telaah manual agar denda keterlambatan nihil (0%).
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className={`font-bold text-sm sm:text-base ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    Ketersediaan Layanan (System Uptime Commitment)
                  </h3>
                  <p className={`leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/70'}`}>
                    Infrastruktur ClaimTrace beroperasi dengan target ketersediaan layanan <strong>99.9% Uptime</strong>, dengan jendela pemeliharaan berkala terjadwal hanya pada hari Minggu pukul 01.00 – 04.00 WIB guna menjamin kelancaran penagihan faskes di seluruh Indonesia.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 5: 6 STANDAR SIBER & KERANGKA KERJA ANTI-FRAUD INTERNASIONAL */}
            {activeTab === 'frameworks' && (
              <div className="space-y-6">
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  effectiveIsLight 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                    : 'bg-white/5 border border-white/10 text-white'
                }`}>
                  <div className={`flex items-center space-x-2 font-bold ${effectiveIsLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs uppercase tracking-wide">
                      Adopsi 6 Kerangka Kerja Keamanan Siber &amp; Anti-Fraud Finansial Internasional
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed text-pretty ${effectiveIsLight ? 'text-emerald-900/80' : 'text-white/70'}`}>
                    ClaimTrace JKN mengadopsi standar taksonomi <strong>Keamanan Siber &amp; Anti-Fraud Internasional</strong> yang dipetakan ke 6 kerangka kerja terkemuka dunia guna menindak kejahatan siber finansial dan penagihan klaim fiktif secara presisi, akuntabel, dan berstandar internasional.
                  </p>
                </div>

                {/* 6 FRAMEWORKS METRIC CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                    effectiveIsLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs' 
                      : 'bg-[#000c24]/70 border-white/10 text-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        effectiveIsLight 
                          ? 'bg-rose-100 text-rose-800 border-rose-200' 
                          : 'text-rose-300 bg-rose-500/20 border-rose-500/30'
                      }`}>
                        MITRE F3 v1.1
                      </span>
                      <span className={`text-[10px] font-bold font-mono ${effectiveIsLight ? 'text-slate-500' : 'text-white/50'}`}>94 Teknik</span>
                    </div>
                    <span className={`font-bold block text-xs ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>Fight Fraud Framework</span>
                    <p className={`text-[11px] leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/50'}`}>Taktik Positioning (FA0001) &amp; Monetization (FA0002) untuk menindak phantom &amp; repeat billing.</p>
                  </div>

                  <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                    effectiveIsLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs' 
                      : 'bg-[#000c24]/70 border-white/10 text-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        effectiveIsLight 
                          ? 'bg-sky-100 text-sky-800 border-sky-200' 
                          : 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30'
                      }`}>
                        MITRE ATT&amp;CK v19.1
                      </span>
                      <span className={`text-[10px] font-bold font-mono ${effectiveIsLight ? 'text-slate-500' : 'text-white/50'}`}>805 Skills</span>
                    </div>
                    <span className={`font-bold block text-xs ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>Adversary Tactics</span>
                    <p className={`text-[11px] leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/50'}`}>T1078 (Valid Accounts), T1070 (Audit Evasion), T1110 (Brute Force), dan proteksi kredensial DPJP.</p>
                  </div>

                  <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                    effectiveIsLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs' 
                      : 'bg-[#000c24]/70 border-white/10 text-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        effectiveIsLight 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30'
                      }`}>
                        NIST CSF 2.0
                      </span>
                      <span className={`text-[10px] font-bold font-mono ${effectiveIsLight ? 'text-slate-500' : 'text-white/50'}`}>6 Fungsi</span>
                    </div>
                    <span className={`font-bold block text-xs ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>Cybersecurity Framework</span>
                    <p className={`text-[11px] leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/50'}`}>Govern (GV), Identify (ID), Protect (PR), Detect (DE.CM), Respond (RS.AN), dan Recover (RC).</p>
                  </div>

                  <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                    effectiveIsLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs' 
                      : 'bg-[#000c24]/70 border-white/10 text-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        effectiveIsLight 
                          ? 'bg-purple-100 text-purple-800 border-purple-200' 
                          : 'text-purple-300 bg-purple-500/20 border-purple-500/30'
                      }`}>
                        MITRE ATLAS
                      </span>
                      <span className={`text-[10px] font-bold font-mono ${effectiveIsLight ? 'text-slate-500' : 'text-white/50'}`}>AI Threat Matrix</span>
                    </div>
                    <span className={`font-bold block text-xs ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>Adversarial ML Defense</span>
                    <p className={`text-[11px] leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/50'}`}>Proteksi Model AI dari Prompt Injection (AML.T0043) dan Evasion manipulasi INA-CBG (AML.T0047).</p>
                  </div>

                  <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                    effectiveIsLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs' 
                      : 'bg-[#000c24]/70 border-white/10 text-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        effectiveIsLight 
                          ? 'bg-teal-100 text-teal-800 border-teal-200' 
                          : 'text-teal-300 bg-teal-500/20 border-teal-500/30'
                      }`}>
                        MITRE D3FEND
                      </span>
                      <span className={`text-[10px] font-bold font-mono ${effectiveIsLight ? 'text-slate-500' : 'text-white/50'}`}>270 Teknik</span>
                    </div>
                    <span className={`font-bold block text-xs ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>Defensive Countermeasure</span>
                    <p className={`text-[11px] leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/50'}`}>D3-DS (Segel Hash SHA-256), D3-MFA (ZK-Proof Telemetri Mobile JKN), dan D3-PSMD validasi.</p>
                  </div>

                  <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                    effectiveIsLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs' 
                      : 'bg-[#000c24]/70 border-white/10 text-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        effectiveIsLight 
                          ? 'bg-amber-100 text-amber-800 border-amber-200' 
                          : 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
                      }`}>
                        NIST AI RMF 1.0
                      </span>
                      <span className={`text-[10px] font-bold font-mono ${effectiveIsLight ? 'text-slate-500' : 'text-white/50'}`}>Govern/Measure</span>
                    </div>
                    <span className={`font-bold block text-xs ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>AI Risk Management</span>
                    <p className={`text-[11px] leading-relaxed ${effectiveIsLight ? 'text-slate-600' : 'text-white/50'}`}>Tata kelola otonomi LangGraph ReAct Copilot dengan metrik Faithfulness 0.998 dan Zero-PHI.</p>
                  </div>
                </div>

                {/* DETAILED TTP MAPPINGS */}
                <div className={`space-y-3 border-t pt-4 ${effectiveIsLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <h3 className={`font-bold text-sm sm:text-base ${effectiveIsLight ? 'text-slate-900' : 'text-white'}`}>
                    Pemetaan TTP pada 3 Lapis Penapisan ClaimTrace JKN
                  </h3>

                  <div className="overflow-x-auto">
                    <table className={`w-full text-left text-xs border rounded-xl overflow-hidden ${
                      effectiveIsLight ? 'border-slate-200' : 'border-white/10'
                    }`}>
                      <thead className={`text-[10px] uppercase font-bold border-b ${
                        effectiveIsLight 
                          ? 'bg-slate-100 text-slate-700 border-slate-200' 
                          : 'bg-[#00134A] text-white/70 border-white/10'
                      }`}>
                        <tr>
                          <th className="py-2.5 px-3">Lapis ClaimTrace</th>
                          <th className="py-2.5 px-3">Teknik Siber &amp; Fraud</th>
                          <th className="py-2.5 px-3">Mitigasi Bertahan (D3FEND)</th>
                          <th className="py-2.5 px-3">Regulasi RI Terkait</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y text-[11px] tabular-nums ${
                        effectiveIsLight 
                          ? 'divide-slate-200 text-slate-800 bg-white' 
                          : 'divide-white/5 text-white/80'
                      }`}>
                        <tr>
                          <td className={`py-2.5 px-3 font-bold ${effectiveIsLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Lapis 1 (Pola Spatiotemporal)</td>
                          <td className="py-2.5 px-3">
                            <span className={`font-mono font-bold block ${effectiveIsLight ? 'text-rose-700' : 'text-rose-300'}`}>F3: FA0002.F1018 (Unbundling)</span>
                            <span className={`text-[10px] ${effectiveIsLight ? 'text-slate-500' : 'text-white/50'}`}>Lonjakan klaim massal repeat billing 48 jam</span>
                          </td>
                          <td className={`py-2.5 px-3 font-mono font-semibold ${effectiveIsLight ? 'text-sky-800' : 'text-cyan-300'}`}>D3-NTA · Analitik DuckDB OLAP</td>
                          <td className={`py-2.5 px-3 ${effectiveIsLight ? 'text-slate-600' : 'text-white/50'}`}>Permenkes 26/2021</td>
                        </tr>
                        <tr>
                          <td className={`py-2.5 px-3 font-bold ${effectiveIsLight ? 'text-sky-700' : 'text-cyan-400'}`}>Lapis 2 (Jejak SATUSEHAT SDMK)</td>
                          <td className="py-2.5 px-3">
                            <span className={`font-mono font-bold block ${effectiveIsLight ? 'text-rose-700' : 'text-rose-300'}`}>ATT&amp;CK: T1078 (Valid Accounts)</span>
                            <span className={`text-[10px] ${effectiveIsLight ? 'text-slate-500' : 'text-white/50'}`}>Penyalahgunaan akun DPJP mutasi &amp; impossible travel</span>
                          </td>
                          <td className={`py-2.5 px-3 font-mono font-semibold ${effectiveIsLight ? 'text-sky-800' : 'text-cyan-300'}`}>D3-SDA · Verifikasi Geovelocity</td>
                          <td className={`py-2.5 px-3 ${effectiveIsLight ? 'text-slate-600' : 'text-white/50'}`}>Permenkes 14/2021</td>
                        </tr>
                        <tr>
                          <td className={`py-2.5 px-3 font-bold ${effectiveIsLight ? 'text-indigo-700' : 'text-indigo-400'}`}>Lapis 3 (Konfirmasi Mobile JKN)</td>
                          <td className="py-2.5 px-3">
                            <span className={`font-mono font-bold block ${effectiveIsLight ? 'text-rose-700' : 'text-rose-300'}`}>F3: FA0001.F1005 (Identity Seeding)</span>
                            <span className={`text-[10px] ${effectiveIsLight ? 'text-slate-500' : 'text-white/50'}`}>Pencatutan nama peserta tanpa kehadiran fisik</span>
                          </td>
                          <td className={`py-2.5 px-3 font-mono font-semibold ${effectiveIsLight ? 'text-sky-800' : 'text-cyan-300'}`}>D3-MFA · Out-of-Band ZK-Proof</td>
                          <td className={`py-2.5 px-3 ${effectiveIsLight ? 'text-slate-600' : 'text-white/50'}`}>UU PDP 27/2022</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* MODAL FOOTER */}
          <div className={`shrink-0 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t ${
            effectiveIsLight 
              ? 'bg-slate-50 border-slate-200 text-slate-600' 
              : 'bg-[#00134A] border-white/10 text-white/70'
          }`}>
            <div className="flex items-center space-x-2">
              <Scale className={`w-4 h-4 shrink-0 ${effectiveIsLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>
                Dokumen ini merupakan standar operasional prosedur (SOP) hukum resmi. Terakhir diperbarui: <strong className={effectiveIsLight ? 'text-slate-900' : 'text-white'}>Oktober 2026</strong>.
              </span>
            </div>
            <button type="button"
              onClick={onClose}
              className={`px-5 py-2 rounded-xl font-bold transition cursor-pointer shrink-0 shadow-lg ${
                effectiveIsLight 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
              }`}
            >
              Saya Mengerti &amp; Setuju
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
