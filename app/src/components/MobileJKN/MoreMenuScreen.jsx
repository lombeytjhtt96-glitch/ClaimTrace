import React, { useState } from 'react';
import { ChevronLeft, Search, Shield, ChevronRight, Sparkles } from 'lucide-react';

export default function MoreMenuScreen({ onNavigate, onOpenClaimTrace }) {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      id: 'pelayanan',
      title: 'Pelayanan Kesehatan',
      desc: 'Layanan medis, antrean, dan konsultasi dokter',
      badge: 'Prioritas',
      items: [
        {
          id: 'antrean',
          title: 'Pendaftaran Pelayanan (Antrean)',
          subtitle: 'Ambil nomor antrean online FKTP & FKRTL',
          icon: '/assets/images/antrian_icon.png',
          route: 'antrean',
        },
        {
          id: 'claimtrace',
          title: 'ClaimTrace · Verifikasi Presensi',
          subtitle: 'Lapis 3: Lindungi kepesertaan dari klaim anomali',
          icon: null,
          customIcon: (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xs shadow-emerald-500/30">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
          ),
          specialBadge: 'Inovasi Baru',
          action: onOpenClaimTrace,
        },
        {
          id: 'riwayat',
          title: 'Riwayat Pelayanan',
          subtitle: 'I-Care JKN & catatan rekam medis',
          icon: '/assets/images/riwayatpel_new_icon.png',
          route: 'riwayat',
        },
        {
          id: 'chat_dokter',
          title: 'Konsultasi Dokter',
          subtitle: 'Telemedisin online dengan dokter faskes',
          icon: '/assets/images/chat_dokter_icon.png',
          route: 'chat_dokter',
        },
        {
          id: 'tempat_tidur',
          title: 'Ketersediaan Tempat Tidur',
          subtitle: 'Cek tempat tidur RS secara real-time',
          icon: '/assets/images/tempattidur_new_icon.png',
          route: 'tempat_tidur',
        },
        {
          id: 'obat',
          title: 'Info Obat & Jadwal Minum Obat',
          subtitle: 'Ketersediaan obat faskes & pengingat PRB',
          icon: '/assets/images/obat_new_icon.png',
          route: 'obat',
        },
        {
          id: 'skrining',
          title: 'Skrining Riwayat Kesehatan',
          subtitle: 'Deteksi dini potensi penyakit diabetes & hipertensi',
          icon: '/assets/images/skrining_new_icon.png',
          route: 'skrining',
        },
        {
          id: 'jadwal_operasi',
          title: 'Jadwal Tindakan Operasi',
          subtitle: 'Lihat antrean operasi di faskes rujukan',
          icon: '/assets/images/surgery_icon.png',
          route: 'jadwal_operasi',
        },
      ],
    },
    {
      id: 'peserta',
      title: 'Kepesertaan & Data',
      desc: 'Informasi kartu dan administrasi peserta',
      items: [
        {
          id: 'kartu',
          title: 'Kartu Peserta KIS Digital',
          subtitle: 'Tampilkan identitas KIS digital Anda',
          icon: '/assets/images/peserta_new_icon.png',
          route: 'kartu',
        },
        {
          id: 'ubah_data',
          title: 'Perubahan Data Peserta',
          subtitle: 'Pindah faskes, ubah kelas rawat & kontak',
          icon: '/assets/images/ubahdata_new_icon.png',
          route: 'ubah_data',
        },
        {
          id: 'pendaftaran_peserta',
          title: 'Pendaftaran Peserta Baru',
          subtitle: 'Daftar anggota keluarga atau peserta baru',
          icon: '/assets/images/daftar_icon.png',
          route: 'pendaftaran_peserta',
        },
        {
          id: 'autodebet',
          title: 'Pendaftaran Autodebet',
          subtitle: 'Kemudahan autodebet bank & dompet digital',
          icon: '/assets/images/autodebet_new_icon.png',
          route: 'autodebet',
        },
      ],
    },
    {
      id: 'tagihan',
      title: 'Iuran & Pembayaran',
      desc: 'Catatan pembayaran dan skema cicilan',
      items: [
        {
          id: 'pembayaran',
          title: 'Info Iuran & Riwayat Pembayaran',
          subtitle: 'Cek tagihan & riwayat mutasi iuran',
          icon: '/assets/images/pembayaran_new_icon.png',
          route: 'pembayaran',
        },
        {
          id: 'rehab',
          title: 'REHAB (Rencana Pembayaran Bertahap)',
          subtitle: 'Program cicilan bagi peserta menunggak',
          icon: '/assets/images/cicilan_icon.png',
          route: 'rehab',
        },
      ],
    },
    {
      id: 'umum',
      title: 'Bantuan, Fitur & Layanan Umum',
      desc: 'Kanal pengaduan, pusat panggilan dan kebugaran',
      items: [
        {
          id: 'bugar',
          title: 'Bugar (Aktivitas Fisik & Prolanis)',
          subtitle: 'Penghitung langkah kaki & target kesehatan',
          icon: '/assets/images/prolanis_muda_icon.png',
          route: 'bugar',
        },
        {
          id: 'pengaduan',
          title: 'Pengaduan Layanan JKN',
          subtitle: 'Sampaikan keluhan pelayanan faskes / biaya',
          icon: '/assets/images/informasipengaduan_new_icon.png',
          route: 'pengaduan',
        },
        {
          id: 'lokasi_faskes',
          title: 'Lokasi Fasilitas Kesehatan',
          subtitle: 'Peta faskes terdekat, apotek & optik',
          icon: '/assets/images/fasilitas_icon.png',
          route: 'lokasi_faskes',
        },
        {
          id: 'bpjs_keliling',
          title: 'BPJS Keliling',
          subtitle: 'Jadwal armada mobil BPJS di wilayah Anda',
          icon: '/assets/images/bpjs_keliling.png',
          route: 'bpjs_keliling',
        },
        {
          id: 'care_center',
          title: 'Care Center 165',
          subtitle: 'Panggilan darurat & informasi 24 jam',
          icon: '/assets/images/care_center_165.png',
          route: 'care_center',
        },
      ],
    },
  ];

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center space-x-3 shadow-sm shrink-0">
        <button type="button" 
          onClick={() => onNavigate('home')} 
          className="p-1 text-slate-700 hover:text-black rounded-lg active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-tight">
            Menu Lengkap Mobile JKN
          </h2>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center">
            <Sparkles className="w-3 h-3 mr-1" />
            Versi Developer · ClaimTrace Active
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 bg-white border-b border-slate-100 shrink-0">
        <div className="bg-slate-100 rounded-xl px-3 py-2 flex items-center space-x-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input aria-label="Bidang input data"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari fitur (misal: Antrean, Obat, Tempat Tidur, ClaimTrace)..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {cat.title}
                </h3>
                <p className="text-[10px] text-slate-500">{cat.desc}</p>
              </div>
              {cat.badge && (
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {cat.badge}
                </span>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {cat.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else if (item.route) {
                      onNavigate(item.route);
                    }
                  }}
                  className={`p-3 flex items-center space-x-3 cursor-pointer transition active:bg-slate-50 ${
                    item.specialBadge ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Icon */}
                  {item.customIcon ? (
                    item.customIcon
                  ) : item.icon ? (
                    <img
                      src={item.icon}
                      alt={item.title}
                      className="w-11 h-11 object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  )}

                  {/* Text details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.title}
                      </h4>
                      {item.specialBadge && (
                        <span className="text-[9px] font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-2 py-0.5 rounded-full shadow-sm shadow-emerald-500/20">
                          {item.specialBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
