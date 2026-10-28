import React, { useState } from 'react';
import { ChevronLeft, MessageSquare, AlertCircle, CheckCircle, Upload, Paperclip } from 'lucide-react';

export default function PengaduanScreen({ onNavigate }) {
  const [kategori, setKategori] = useState('Biaya Tambahan Diluar Ketentuan');
  const [faskes, setFaskes] = useState('');
  const [kronologi, setKronologi] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center space-x-3 shadow-sm shrink-0">
        <button type="button" onClick={() => onNavigate('home')} className="p-1 text-slate-700 hover:text-black rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-tight">
            Pengaduan Layanan JKN
          </h2>
          <span className="text-[10px] text-slate-500 font-medium">
            Kanal Pengaduan Resmi BPJS Kesehatan
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {submitted ? (
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs text-center space-y-3 animate-in fade-in">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                PENGADUAN DITERIMA
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">
                Tiket Pengaduan #TIK-2026-10-891
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Laporan Anda telah diteruskan ke Petugas BPJS SATU! (Siap Membantu) Kantor Layanan Terpadu BPJS Kesehatan untuk ditindaklanjuti maksimal 1x24 jam.
              </p>
            </div>
            <button type="button"
              onClick={() => {
                setSubmitted(false);
                setKronologi('');
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition"
            >
              Buat Pengaduan Lainnya
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <div className="bg-amber-50 border border-amber-200/80 p-2.5 rounded-xl text-[10.5px] text-amber-800 space-y-1">
              <span className="font-bold flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Janji Layanan BPJS Kesehatan:
              </span>
              <p>Fasilitas kesehatan dilarang memungut iur biaya tambahan di luar ketentuan dan melarang fotokopi berkas.</p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Kategori Pengaduan</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none"
              >
                <option value="Biaya Tambahan Diluar Ketentuan">Iur Biaya / Pungutan Tambahan Tidak Sah</option>
                <option value="Obat Kosong / Diminta Beli Diluar">Obat Kosong / Diminta Beli di Luar</option>
                <option value="Penolakan Pelayanan">Penolakan Rawat Inap / Kamar Penuh</option>
                <option value="Diskriminasi Pasien">Diskriminasi Pelayanan Pasien JKN</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Nama Fasilitas Kesehatan</label>
              <input aria-label="Bidang input data"
                type="text"
                value={faskes}
                onChange={(e) => setFaskes(e.target.value)}
                placeholder="Contoh: RS Mitra Husada / Klinik Pratama..."
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Uraian / Kronologi Keluhan</label>
              <textarea
                value={kronologi}
                onChange={(e) => setKronologi(e.target.value)}
                placeholder="Jelaskan secara rinci tanggal kejadian, nama petugas/dokter, dan kronologi keluhan..."
                rows={4}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Lampiran Bukti (Kuitansi / Foto)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-3 text-center text-slate-400 hover:border-blue-400 cursor-pointer">
                <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                <span className="text-[10px]">Klik untuk unggah foto kuitansi atau berkas pendukung (Maks. 5MB)</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-xs shadow-rose-600/20 active:scale-95 transition text-xs"
            >
              Kirimkan Laporan Pengaduan
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
