import React, { useState } from 'react';
import { ChevronLeft, QrCode, Clock, Hospital, Calendar, User, CheckCircle, AlertCircle } from 'lucide-react';

export default function AntreanScreen({ onNavigate }) {
  const [faskesType, setFaskesType] = useState('fktp'); // 'fktp' | 'fkrtl'
  const [poli, setPoli] = useState('Poli Umum');
  const [keluhan, setKeluhan] = useState('');
  const [antreanSuccess, setAntreanSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAntreanSuccess(true);
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
            Pendaftaran Pelayanan (Antrean)
          </h2>
          <span className="text-[10px] text-slate-500 font-medium">
            Fasilitas Kesehatan Terdaftar
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {antreanSuccess ? (
          /* TIKET ANTREAN SUKSES */
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ANTREAN TERDAFTAR
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  KLINIK PRATAMA NASIONAL BPJS
                </h3>
                <p className="text-xs text-slate-500">{poli} · Hari ini</p>
              </div>

              {/* Box Nomor Antrean */}
              <div className="bg-gradient-to-tr from-[#0288D1] to-[#01A65A] text-white p-5 rounded-2xl shadow-xs my-2">
                <span className="text-xs uppercase tracking-widest font-bold opacity-80">
                  Nomor Antrean Anda
                </span>
                <div className="text-4xl font-bold tracking-wider mt-1">
                  A - 024
                </div>
                <div className="flex justify-center items-center space-x-2 text-xs mt-2 pt-2 border-t border-white/20">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Sisa Antrean: 3 Pasien Lagi</span>
                </div>
              </div>

              {/* QR Code Check-In */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center space-y-2">
                <QrCode className="w-24 h-24 text-slate-800" />
                <span className="text-[10px] text-slate-500 font-medium text-center">
                  Scan QR ini di Anjungan Mandiri Faskes saat tiba di lokasi untuk konfirmasi kehadiran (Check-in).
                </span>
              </div>

              <button type="button"
                onClick={() => setAntreanSuccess(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition"
              >
                Kembali ke Formulir
              </button>
            </div>
          </div>
        ) : (
          /* FORMULIR ANTREAN */
          <div className="space-y-3">
            {/* Tab Pilihan Faskes */}
            <div className="grid grid-cols-2 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
              <button type="button"
                onClick={() => setFaskesType('fktp')}
                className={`py-2 rounded-lg transition ${
                  faskesType === 'fktp' ? 'bg-white text-[#0288D1] shadow-sm' : 'text-slate-600'
                }`}
              >
                Faskes Tingkat Pertama
              </button>
              <button type="button"
                onClick={() => setFaskesType('fkrtl')}
                className={`py-2 rounded-lg transition ${
                  faskesType === 'fkrtl' ? 'bg-white text-[#0288D1] shadow-sm' : 'text-slate-600'
                }`}
              >
                Faskes Rujukan (RS)
              </button>
            </div>

            {/* Info Faskes Terpilih */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-[#0288D1] p-2 rounded-xl">
                  <Hospital className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {faskesType === 'fktp' ? 'KLINIK PRATAMA NASIONAL BPJS' : 'RSUPN Dr. Cipto Mangunkusumo (Rujukan)'}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">
                    {faskesType === 'fktp' 
                      ? 'Jl. Letjen Suprapto No. 120, Jakarta Pusat (Faskes Terdaftar Anda)' 
                      : 'Memerlukan Surat Rujukan Aktif dari FKTP'}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Input */}
            <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Pilih Poli / Layanan</label>
                <select
                  value={poli}
                  onChange={(e) => setPoli(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Poli Umum">Poli Umum (dr. Siti Rahma)</option>
                  <option value="Poli Gigi">Poli Gigi & Mulut (drg. Anindya)</option>
                  <option value="Poli KIA / Anak">Poli KIA & Anak</option>
                  <option value="Poli Fisioterapi / Rehab">Poli Fisioterapi & Rehabilitasi</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Tanggal Kunjungan</label>
                <div className="relative">
                  <input aria-label="Bidang input data"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Keluhan Singkat (Opsional)</label>
                <textarea
                  value={keluhan}
                  onChange={(e) => setKeluhan(e.target.value)}
                  placeholder="Tuliskan keluhan atau gejala sakit yang dirasakan..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200/80 p-2.5 rounded-xl flex items-start space-x-2 text-[10px] text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Pastikan Anda datang maksimal 30 menit sebelum jam estimasi pelayanan untuk melakukan verifikasi sidik jari/wajah di faskes.
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#0288D1] to-[#03A9F4] hover:from-blue-600 hover:to-blue-500 text-white font-bold py-2.5 rounded-xl shadow-xs shadow-blue-500/20 active:scale-95 transition"
              >
                Ambil Nomor Antrean Sekarang
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
