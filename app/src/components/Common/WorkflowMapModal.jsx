import React from 'react';
import {
  X,
  Compass,
  ArrowRight,
  ListFilter,
  FileText,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Scale,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  FileCheck2,
  Users,
} from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';

export default function WorkflowMapModal({
  isOpen,
  onClose,
  onNavigateTab,
  isLight = true,
}) {
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const STAGES = [
    {
      step: 'Tahap 1',
      id: 'queue',
      title: 'Triase & Antrean Klaim (The Triage Gate)',
      badge: 'Pra-Bayar · SLA 10 Hari',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
      icon: ListFilter,
      summary:
        'Satu pintu masuk seluruh berkas FPK bulan berjalan. Mesin in-memory DuckDB SIMD menapis jutaan baris dalam sub-50ms dan memilah klaim ke dalam 3 Lajur Risiko.',
      highlights: [
        '🟢 Jalur Hijau (Skor < 50): Wajar & Lolos Verifikasi Administrasi (Auto-Approval ke BAKB bulanan).',
        '🟡 Jalur Kuning (Skor 50–74.9): Ketidakpastian administrasi (Klarifikasi data faskes dalam SLA).',
        '🔴 Jalur Merah (Skor >= 75 / Hard Trigger): Indikasi kuat Phantom Billing (#6), Repeat Billing (#11), atau SIP Expired (Wajib ditunda).',
      ],
      legalRef: 'Pasal 76 ayat (2) Perpres No. 82/2018 (Batas 10 hari sebelum otomatis dianggap lengkap).',
    },
    {
      step: 'Tahap 2',
      id: 'investigation',
      title: 'Lembar Telaah Berkas Terpadu (Unified Dossier)',
      badge: 'Bedah 3 Lapis Bukti',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
      icon: FileText,
      summary:
        'Satu lembar kerja komprehensif saat satu berkas klaim dipilih. Verifikator tidak perlu berpindah tab untuk memeriksa riwayat klinis, dokumen pendukung, dan bukti anomali.',
      highlights: [
        'Lapis 1 (Pola & Riwayat): Deteksi lonjakan klaim massal pasca-baksos & duplikasi episode berulang hari sama.',
        'Lapis 2 (Integritas DPJP): Verifikasi SIP aktif via SATUSEHAT, batas beban harian dokter (40 px/hari), & Geovelocity OSRM.',
        'Lapis 3 (Konfirmasi Peserta): Log kehadiran biometrik wajah FRISTA di RS & respon voting aplikasi Mobile JKN.',
        'Checklist 7 Dokumen: SEP, Resume Medis, Laporan Operasi, Hasil Lab/Rad, Billing, Surat Kontrol, Resep.',
      ],
      legalRef: 'Permenkes No. 16 Tahun 2019 (Pencegahan & Deteksi Fraud) & Pedoman INA-CBG PMK 26/2021.',
    },
    {
      step: 'Tahap 3',
      id: 'decision',
      title: 'Konsol Putusan & Penanganan Sengketa (Adjudication)',
      badge: 'Eksekusi Yuridis & TKMKB',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
      icon: ShieldAlert,
      summary:
        'Pusat penetapan putusan resmi oleh Verifikator Medis (dr. Siti Rahma, Sp.PK - NIP Wajib). Dilengkapi fasilitas mediasi sanggahan faskes hingga sidang pertimbangan TKMKB.',
      highlights: [
        '4 Opsi Putusan Resmi: SETUJU (Siap Bayar), PENDING (Tunda Klarifikasi), KOREKSI (Downgrade Upcoding), TOLAK (Fraud).',
        'Alur Sanggahan & Dispute: Jika faskes menyanggah penundaan klaim, berkas masuk mediasi atau eskalasi ke sidang TKMKB.',
        'Decision Receipts Kriptografis: Pembubuhan stempel digital HMAC-SHA256 yang mengikat secara yuridis.',
        'Penerbitan Dokumen Resmi: Cetak BAKB Digital, Surat Panggilan Klarifikasi (SP-1), dan Berita Acara bersegel [SEALED · SAH].',
      ],
      legalRef: 'Pasal 76 Perpres 82/2018 (Penundaan Berita Acara) & Forum Sengketa Klinis TKMKB.',
    },
    {
      step: 'Tahap 4',
      id: 'faskes',
      title: 'Pengawasan Faskes & Forensik Retrospektif',
      badge: 'Surveilans & Anti-Sindikat',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
      icon: Building2,
      summary:
        'Area intelijen strategis bagi Kedeputian Wilayah, Kantor Cabang, dan Tim Wasrik untuk mengawasi profil kepatuhan fasilitas kesehatan secara agregat dan mendeteksi sindikat.',
      highlights: [
        'Peta Indeks Risiko Faskes (FRI): Peringkat rumah sakit berisiko tinggi di 496 kabupaten/kota.',
        'Intelijen Tenaga Medis (DPJP): Pelacakan dokter praktik ganda ilegal dan anomali mobilitas fisik lintas pulau.',
        'Laboratorium Forensik Data: Analisis distribusi digit Hukum Benford, rasio ketimpangan Gini, dan kueri analitik SQL warehouse.',
        'Tamper-Evident Audit Ledger: Rantai blok log SHA-256 yang menjamin setiap putusan tidak dapat diubah secara diam-diam.',
      ],
      legalRef: 'UU No. 24/2011 (Tata Kelola Pengawasan BPJS) & UU No. 27/2022 tentang Perlindungan Data Pribadi (Zero-PHI).',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workflow-map-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in"
    >
      <div
        className={`relative w-full max-w-4xl my-auto rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/20'
            : 'bg-[#0B1320] border-white/10 text-white shadow-black/80'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-5 border-b flex items-start justify-between gap-4 ${
            isLight
              ? 'bg-gradient-to-r from-emerald-50/80 via-white to-slate-50 border-slate-200'
              : 'bg-gradient-to-r from-emerald-950/40 via-[#0E1726] to-[#0A101C] border-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-950/20">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="workflow-map-title" className="text-lg sm:text-xl font-display font-bold tracking-tight">
                  Peta Alur Kerja &amp; Konsep Sistem ClaimTrace
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  v1.0 ARSITEKTUR
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Siklus Verifikasi Pra-Bayar dan Pengendalian Kecurangan (Fraud) JKN sesuai Regulasi Resmi BPJS Kesehatan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup peta alur kerja"
            className={`p-2 rounded-xl transition cursor-pointer border ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Doktrin Utama */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isLight
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Doktrin Utama Sistem
                </h4>
                <p className="text-xs font-medium mt-0.5">
                  &ldquo;Satu skor prioritas deterministik, tiga lapis pembuktian multi-sinyal, dan keputusan akhir tetap mutlak di tangan Verifikator Medis (Human-in-the-Loop).&rdquo;
                </p>
              </div>
            </div>
            <div className="text-[11px] font-mono shrink-0 px-2.5 py-1 rounded-lg bg-white/70 dark:bg-black/30 border border-emerald-300/40 font-bold">
              Target: #6 Phantom &amp; #11 Repeat
            </div>
          </div>

          {/* 4 Tahapan Utama */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              4 Pilar Siklus Kerja Verifikator Medis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STAGES.map((st) => {
                const Icon = st.icon;
                return (
                  <div
                    key={st.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between transition-all group ${
                      isLight
                        ? 'bg-slate-50/70 hover:bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
                        : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {st.step}
                            </span>
                            <h4 className="text-sm font-display font-bold leading-tight">{st.title}</h4>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border whitespace-nowrap ${st.badgeColor}`}>
                          {st.badge}
                        </span>
                      </div>

                      <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {st.summary}
                      </p>

                      <ul className="space-y-1.5 pt-1">
                        {st.highlights.map((h, i) => (
                          <li key={i} className="text-[11px] leading-snug flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
                      <span className={`text-[10px] italic leading-tight truncate max-w-[240px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {st.legalRef}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateTab(st.id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition cursor-pointer shrink-0 shadow-xs"
                      >
                        <span>Buka</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alur Sengketa Medis & TKMKB */}
          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Alur Penanganan Sanggahan Medis (Dispute) &amp; Sidang TKMKB
              </h4>
            </div>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Bila FKRTL tidak sepakat dengan penundaan klaim (*Pending*) atau koreksi *downgrade*, faskes dapat mengirimkan berkas klarifikasi formal. Jika tercapai kesepakatan, berkas dipulihkan ke Jalur Hijau. Jika terjadi perbedaan penafsiran klinis yang tajam (*deadlock*), berkas dieskalasi ke <strong>Tim Kendali Mutu dan Kendali Biaya (TKMKB)</strong> yang beranggotakan pakar klinis organisasi profesi untuk memberikan opini medis mengikat.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090F1A] border-white/10'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Siklus penapisan pra-bayar mengikat batas waktu SLA 10 Hari Kalender.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition cursor-pointer shadow-md shadow-emerald-950/20"
          >
            Tutup &amp; Mulai Bekerja
          </button>
        </div>
      </div>
    </div>
  );
}
