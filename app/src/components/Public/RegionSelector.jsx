import React, { useState, useEffect } from 'react';
import { INDONESIA_PROVINCES, ALL_KABUPATEN_KOTA, TOTAL_KABUPATEN_KOTA, TOTAL_PROVINSI } from '../../data/indonesiaRegions';

export default function RegionSelector({ 
  value, 
  onChange, 
  isLight = false, 
  id = 'wbs-region-select'
}) {
  const [selectedProvince, setSelectedProvince] = useState('');

  // If value already has a province (e.g. "Kota Surabaya, Jawa Timur"), sync the province filter
  useEffect(() => {
    if (value && value.includes(', ')) {
      const parts = value.split(', ');
      if (parts.length >= 2) {
        const prov = parts[parts.length - 1].trim();
        if (INDONESIA_PROVINCES[prov]) {
          setSelectedProvince(prov);
        }
      }
    } else if (!value) {
      setSelectedProvince('');
    }
  }, [value]);

  const handleProvinceChange = (e) => {
    const prov = e.target.value;
    setSelectedProvince(prov);
    if (!prov) {
      // Keep or reset
    } else {
      // If the currently selected city doesn't belong to the newly selected province, reset city
      if (value) {
        const parts = value.split(', ');
        const currentProv = parts[parts.length - 1];
        if (currentProv !== prov) {
          onChange('');
        }
      }
    }
  };

  const handleCityChange = (e) => {
    const selectedVal = e.target.value;
    onChange(selectedVal);
    if (selectedVal && selectedVal.includes(', ')) {
      const parts = selectedVal.split(', ');
      const prov = parts[parts.length - 1];
      if (INDONESIA_PROVINCES[prov]) {
        setSelectedProvince(prov);
      }
    }
  };

  const provinceList = Object.keys(INDONESIA_PROVINCES);
  const currentCities = selectedProvince 
    ? INDONESIA_PROVINCES[selectedProvince] 
    : null;

  return (
    <div className="space-y-2">
      {/* 1. Filter Provinsi Dropdown */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className={`font-semibold ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
            Langkah 1: Pilih Provinsi (Penyaring Otomatis)
          </span>
          <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
            {TOTAL_PROVINSI} Provinsi
          </span>
        </div>
        <select
          value={selectedProvince}
          onChange={handleProvinceChange}
          aria-label="Pilih Provinsi untuk menyaring kabupaten atau kota"
          className={`w-full px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
            isLight
              ? 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-white focus-visible:bg-white'
              : 'bg-[#000c24]/70 border-white/15 text-white hover:border-white/30'
          }`}
        >
          <option value="" className={isLight ? "bg-white text-slate-900" : "bg-[#00134A] text-white"}>
            -- Tampilkan Semua 38 Provinsi --
          </option>
          {provinceList.map((p) => (
            <option 
              key={p} 
              value={p}
              className={isLight ? "bg-white text-slate-900" : "bg-[#00134A] text-white"}
            >
              Provinsi {p} ({INDONESIA_PROVINCES[p].length} Wilayah)
            </option>
          ))}
        </select>
      </div>

      {/* 2. Pilih Kabupaten / Kota Dropdown */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className={`font-semibold ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
            Langkah 2: Pilih Kabupaten / Kota (Langsung Klik)
          </span>
          <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            {selectedProvince ? `${currentCities.length} Pilihan di ${selectedProvince}` : `514 Wilayah se-Indonesia`}
          </span>
        </div>
        <select
          id={id}
          value={value}
          onChange={handleCityChange}
          aria-label="Pilih Kabupaten atau Kota di Indonesia"
          className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
            value
              ? isLight
                ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 font-bold'
                : 'bg-emerald-500/15 border-emerald-500/50 text-white font-bold'
              : isLight
              ? 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-white focus-visible:bg-white'
              : 'bg-[#000c24]/70 border-white/15 text-white hover:border-white/30'
          }`}
        >
          <option value="" className={isLight ? "bg-white text-slate-500" : "bg-[#00134A] text-white/50"}>
            {selectedProvince 
              ? `-- Pilih Kabupaten / Kota di ${selectedProvince} --`
              : `-- Pilih Kabupaten / Kota (514 Wilayah se-Indonesia) --`}
          </option>

          {/* If a province is selected, list only its cities */}
          {selectedProvince ? (
            currentCities.map((city) => (
              <option 
                key={city} 
                value={`${city}, ${selectedProvince}`}
                className={isLight ? "bg-white text-slate-900" : "bg-[#00134A] text-white"}
              >
                {city}
              </option>
            ))
          ) : (
            /* Otherwise, list all 514 grouped by optgroup for all 38 provinces */
            Object.entries(INDONESIA_PROVINCES).map(([prov, cities]) => (
              <optgroup 
                key={prov} 
                label={`Provinsi ${prov} (${cities.length} Wilayah)`}
                className={isLight ? "bg-slate-100 text-slate-900 font-bold" : "bg-[#000c24] text-emerald-400 font-bold"}
              >
                {cities.map((city) => (
                  <option 
                    key={city} 
                    value={`${city}, ${prov}`}
                    className={isLight ? "bg-white text-slate-900 font-normal" : "bg-[#00134A] text-white font-normal"}
                  >
                    {city} ({prov})
                  </option>
                ))}
              </optgroup>
            ))
          )}
        </select>
      </div>

      {/* Selected Value Confirmation Badge */}
      {value && (
        <div className={`p-2 rounded-lg border text-[11px] flex items-center justify-between transition ${
          isLight 
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
            : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
        }`}>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold truncate">
              Wilayah Terpilih: <strong>{value}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSelectedProvince('');
            }}
            className={`text-[10px] underline font-bold shrink-0 ml-2 ${
              isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/50 hover:text-white'
            }`}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
