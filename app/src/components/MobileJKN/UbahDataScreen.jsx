import React, { useState } from 'react';
import { ChevronLeft, Hospital, User, Phone, Mail, MapPin, Check, ChevronRight } from 'lucide-react';

export default function UbahDataScreen({ onNavigate }) {
  const [faskes, setFaskes] = useState('KLINIK PRATAMA NASIONAL BPJS (0112U001)');
  const [kelas, setKelas] = useState('Kelas 1');
  const [phone, setPhone] = useState('0812-0000-0000');
  const [email, setEmail] = useState('peserta.simulasi@mail.fiktif.id');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
            Perubahan Data Peserta
          </h2>
          <span className="text-[10px] text-slate-500 font-medium">
            AHMAD SYAFIQ (PESERTA SIMULASI)
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {saved && (
          <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-2xl flex items-center space-x-2 text-xs text-emerald-800 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Perubahan data berhasil disimpan dan diperbarui di sistem Dukcapil & BPJS Kesehatan.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          {/* Faskes Tk 1 */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
            <div className="flex items-center space-x-2 text-[#0288D1]">
              <Hospital className="w-4 h-4" />
              <label className="text-xs font-bold text-slate-900">Fasilitas Kesehatan Tk. I (FKTP)</label>
            </div>
            <select
              value={faskes}
              onChange={(e) => setFaskes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none"
            >
              <option value="KLINIK PRATAMA NASIONAL BPJS (0112U001)">KLINIK PRATAMA NASIONAL BPJS (0112U001)</option>
              <option value="PUSKESMAS CEMPAKA PUTIH (0112P004)">PUSKESMAS CEMPAKA PUTIH (0112P004)</option>
              <option value="KLINIK SEHAT SEJAHTERA (0112U009)">KLINIK SEHAT SEJAHTERA (0112U009)</option>
            </select>
            <p className="text-[9.5px] text-slate-400">
              *Perpindahan faskes mulai berlaku pada tanggal 1 bulan berikutnya sesuai regulasi BPJS Kesehatan.
            </p>
          </div>

          {/* Kelas Rawat */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
            <label className="text-xs font-bold text-slate-900 block">Kelas Rawat</label>
            <div className="grid grid-cols-3 gap-2">
              {['Kelas 1', 'Kelas 2', 'Kelas 3'].map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setKelas(k)}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    kelas === k
                      ? 'bg-blue-50 border-[#0288D1] text-[#0288D1] shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Kontak & Email */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
            <span className="text-xs font-bold text-slate-900 block">Kontak & Verifikasi OTP</span>
            
            <div>
              <label className="text-[10.5px] text-slate-500 font-medium block mb-1">Nomor Handphone (Aktif)</label>
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <input aria-label="Bidang input data"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 w-full focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10.5px] text-slate-500 font-medium block mb-1">Alamat Email</label>
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <input aria-label="Bidang input data"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 w-full focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Alamat Surat */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
            <div className="flex items-center space-x-2 text-[#0288D1]">
              <MapPin className="w-4 h-4" />
              <label className="text-xs font-bold text-slate-900">Alamat Surat Domisili</label>
            </div>
            <textarea
              defaultValue="Jl. Merdeka Sejahtera No. 12, Jakarta Pusat (Alamat Simulasi Fiktif)"
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#01A65A] to-[#0288D1] text-white font-bold py-3 rounded-xl shadow-xs shadow-emerald-500/20 active:scale-95 transition text-xs"
          >
            Simpan Perubahan Data
          </button>
        </form>
      </div>
    </div>
  );
}
