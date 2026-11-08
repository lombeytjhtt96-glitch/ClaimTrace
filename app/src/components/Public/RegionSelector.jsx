import React, { useState, useEffect } from 'react';
import { INDONESIA_PROVINCES } from '../../data/indonesiaRegions';

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
      // keep
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. Dropdown Provinsi */}
      <div className="space-y-1.5">
        <label className={`font-bold block ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
          Provinsi
        </label>
        <select
          value={selectedProvince}
          onChange={handleProvinceChange}
          aria-label="Provinsi"
          className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 focus-visible:border-emerald-600 ${
            isLight
              ? 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-white focus-visible:bg-white'
              : 'bg-[#000c24]/70 border-white/15 text-white hover:border-white/30'
          }`}
        >
          <option value="" className={isLight ? "bg-white text-slate-900" : "bg-[#00134A] text-white"}>
            Semua Provinsi (Nasional)
          </option>
          {provinceList.map((p) => (
            <option 
              key={p} 
              value={p}
              className={isLight ? "bg-white text-slate-900" : "bg-[#00134A] text-white"}
            >
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Dropdown Kabupaten / Kota */}
      <div className="space-y-1.5">
        <label htmlFor={id} className={`font-bold block ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
          Kabupaten / Kota
        </label>
        <select
          id={id}
          value={value}
          onChange={handleCityChange}
          aria-label="Kabupaten atau Kota"
          className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 focus-visible:border-emerald-600 ${
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
            Pilih Kabupaten / Kota
          </option>

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
            Object.entries(INDONESIA_PROVINCES).map(([prov, cities]) => (
              <optgroup 
                key={prov} 
                label={prov}
                className={isLight ? "bg-slate-100 text-slate-900 font-bold" : "bg-[#000c24] text-emerald-400 font-bold"}
              >
                {cities.map((city) => (
                  <option 
                    key={city} 
                    value={`${city}, ${prov}`}
                    className={isLight ? "bg-white text-slate-900 font-normal" : "bg-[#00134A] text-white font-normal"}
                  >
                    {city}
                  </option>
                ))}
              </optgroup>
            ))
          )}
        </select>
      </div>
    </div>
  );
}
