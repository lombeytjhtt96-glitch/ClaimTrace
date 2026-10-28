import React, { useState } from 'react';
import { ChevronLeft, Search, Hospital, Bed, Filter, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function TempatTidurScreen({ onNavigate }) {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedNotice, setSelectedNotice] = useState(null);

  const hospitals = [
    {
      id: 1,
      name: 'RSUPN Dr. Cipto Mangunkusumo',
      type: 'RS Pemerintah Kelas A (Rujukan Nasional)',
      address: 'Jl. Diponegoro No. 71, Jakarta Pusat',
      beds: {
        kelas1: { total: 84, available: 12 },
        kelas2: { total: 120, available: 18 },
        kelas3: { total: 240, available: 45 },
        icu: { total: 32, available: 4 },
        vip: { total: 40, available: 6 },
      },
      updated: '10 menit lalu',
    },
    {
      id: 2,
      name: 'RSUP Fatmawati',
      type: 'RS Pemerintah Kelas A',
      address: 'Jl. RS Fatmawati Raya No. 4, Jakarta Selatan',
      beds: {
        kelas1: { total: 45, available: 8 },
        kelas2: { total: 60, available: 11 },
        kelas3: { total: 95, available: 22 },
        icu: { total: 14, available: 2 },
        vip: { total: 25, available: 5 },
      },
      updated: '25 menit lalu',
    },
    {
      id: 3,
      name: 'RS Hermina Kemayoran',
      type: 'RS Swasta Kelas B',
      address: 'Jl. Selangit B-10 Kav. 4, Jakarta Pusat',
      beds: {
        kelas1: { total: 50, available: 7 },
        kelas2: { total: 75, available: 14 },
        kelas3: { total: 110, available: 19 },
        icu: { total: 16, available: 3 },
        vip: { total: 30, available: 4 },
      },
      updated: '15 menit lalu',
    },
    {
      id: 4,
      name: 'RS Khusus Jantung Harapan Kita',
      type: 'RS Khusus Kelas A',
      address: 'Jl. Letjen S. Parman Kav. 87, Jakarta Barat',
      beds: {
        kelas1: { total: 20, available: 5 },
        kelas2: { total: 30, available: 8 },
        kelas3: { total: 45, available: 12 },
        icu: { total: 6, available: 1 },
        vip: { total: 10, available: 2 },
      },
      updated: '5 menit lalu',
    },
  ];

  const filteredHospitals = hospitals.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center space-x-3 shadow-sm shrink-0">
        <button type="button" onClick={() => onNavigate('home')} className="p-1 text-slate-700 hover:text-black rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-tight">
            Ketersediaan Tempat Tidur
          </h2>
          <span className="text-[10px] text-slate-500 font-medium">
            Faskes Rujukan Terdaftar Nasional (Real-time)
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3 bg-white border-b border-slate-100 space-y-2 shrink-0">
        <div className="bg-slate-100 rounded-xl px-3 py-2 flex items-center space-x-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input aria-label="Bidang input data"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama rumah sakit..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1 text-[10px] font-bold">
          {['all', 'kelas3', 'kelas2', 'kelas1', 'icu', 'vip'].map((cls) => (
            <button type="button"
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
                selectedClass === cls
                  ? 'bg-[#0288D1] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cls === 'all'
                ? 'Semua Kelas'
                : cls === 'kelas3'
                ? 'Kelas 3'
                : cls === 'kelas2'
                ? 'Kelas 2'
                : cls === 'kelas1'
                ? 'Kelas 1'
                : cls.toUpperCase()}
            </button>
          ))}
        </div>

        {selectedNotice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-2.5 rounded-xl flex items-center space-x-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{selectedNotice}</span>
          </div>
        )}
      </div>

      {/* List Rumah Sakit */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredHospitals.map((h) => (
          <div key={h.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9.5px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {h.type}
                </span>
                <h3 className="text-xs font-bold text-slate-900 mt-1">{h.name}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{h.address}</p>
              </div>
              <span className="text-[9px] text-slate-400 whitespace-nowrap">{h.updated}</span>
            </div>

            {/* Bed Matrix */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="bg-emerald-50/80 border border-emerald-200 p-2 rounded-xl">
                <span className="text-[9.5px] text-slate-600 font-medium">Kelas 3</span>
                <div className="text-sm font-bold text-emerald-700 mt-0.5">
                  {h.beds.kelas3.available} <span className="text-[9px] text-slate-500 font-normal">/ {h.beds.kelas3.total}</span>
                </div>
                <span className="text-[8.5px] text-emerald-600 font-bold">Tersedia</span>
              </div>

              <div className="bg-blue-50/80 border border-blue-200 p-2 rounded-xl">
                <span className="text-[9.5px] text-slate-600 font-medium">Kelas 2</span>
                <div className="text-sm font-bold text-blue-700 mt-0.5">
                  {h.beds.kelas2.available} <span className="text-[9px] text-slate-500 font-normal">/ {h.beds.kelas2.total}</span>
                </div>
                <span className="text-[8.5px] text-blue-600 font-bold">Tersedia</span>
              </div>

              <div className="bg-purple-50/80 border border-purple-200 p-2 rounded-xl">
                <span className="text-[9.5px] text-slate-600 font-medium">Kelas 1</span>
                <div className="text-sm font-bold text-purple-700 mt-0.5">
                  {h.beds.kelas1.available} <span className="text-[9px] text-slate-500 font-normal">/ {h.beds.kelas1.total}</span>
                </div>
                <span className="text-[8.5px] text-purple-600 font-bold">Tersedia</span>
              </div>
            </div>

            {/* ICU & VIP Row */}
            <div className="flex justify-between items-center text-[10px] text-slate-600 px-1 pt-1 border-t border-slate-100">
              <span>ICU: <strong className="text-slate-900">{h.beds.icu.available} Kosong</strong></span>
              <span>VIP: <strong className="text-slate-900">{h.beds.vip.available} Kosong</strong></span>
              <button type="button" 
                onClick={() => {
                  setSelectedNotice(`Faskes ${h.name} dipilih untuk rujukan ketersediaan tempat tidur.`);
                  setTimeout(() => setSelectedNotice(null), 3500);
                }}
                className="text-[10px] font-bold text-[#0288D1] hover:underline cursor-pointer"
              >
                Pilih Faskes &gt;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
