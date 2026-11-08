import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  MapPin, 
  ChevronDown, 
  Search, 
  X, 
  Check, 
  Building2, 
  Landmark,
  Compass,
  Filter
} from 'lucide-react';
import { INDONESIA_PROVINCES, ALL_KABUPATEN_KOTA, TOTAL_KABUPATEN_KOTA, TOTAL_PROVINSI } from '../../data/indonesiaRegions';

export default function RegionSelector({ 
  value, 
  onChange, 
  isLight = false, 
  id = 'wbs-region-select',
  placeholder = 'Pilih Kabupaten / Kota (514 Wilayah se-Indonesia)...' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL'); // 'ALL' | 'Kabupaten' | 'Kota'
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Quick popular city shortcuts
  const popularRegions = [
    { name: 'Kota Administrasi Jakarta Pusat, DKI Jakarta', short: 'Jakarta Pusat' },
    { name: 'Kota Surabaya, Jawa Timur', short: 'Surabaya' },
    { name: 'Kota Bandung, Jawa Barat', short: 'Bandung' },
    { name: 'Kota Medan, Sumatera Utara', short: 'Medan' },
    { name: 'Kota Semarang, Jawa Tengah', short: 'Semarang' },
    { name: 'Kota Makassar, Sulawesi Selatan', short: 'Makassar' },
  ];

  // Filtered list based on search and filters
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_KABUPATEN_KOTA.filter(item => {
      // Province filter
      if (selectedProvinceFilter && item.province !== selectedProvinceFilter) {
        return false;
      }
      // Type filter (Kabupaten vs Kota)
      if (selectedTypeFilter !== 'ALL' && item.type !== selectedTypeFilter) {
        return false;
      }
      // Search query filter
      if (!q) return true;
      return (
        item.cityName.toLowerCase().includes(q) ||
        item.province.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedProvinceFilter, selectedTypeFilter]);

  // Group filtered results by province
  const groupedResults = useMemo(() => {
    const groups = {};
    for (const item of filteredList) {
      if (!groups[item.province]) {
        groups[item.province] = [];
      }
      groups[item.province].push(item);
    }
    return groups;
  }, [filteredList]);

  const handleSelect = (itemValue) => {
    onChange(itemValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  const provinceList = useMemo(() => Object.keys(INDONESIA_PROVINCES), []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Visual Clickable Button Trigger */}
      <div
        id={id}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full px-3 py-2.5 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all duration-150 select-none ${
          isLight
            ? isOpen 
              ? 'bg-white border-emerald-600 ring-2 ring-emerald-600/30 shadow-sm'
              : 'bg-slate-50 border-slate-300 text-slate-900 hover:bg-white hover:border-slate-400'
            : isOpen
              ? 'bg-[#00173d] border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-[#000c24]/70 border-white/15 text-white hover:border-white/30'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden pr-2">
          <MapPin className={`w-4 h-4 shrink-0 ${value ? 'text-emerald-500' : isLight ? 'text-slate-400' : 'text-white/40'}`} />
          {value ? (
            <span className="font-semibold text-sm truncate">
              {value}
            </span>
          ) : (
            <span className={`text-sm truncate ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Hapus pilihan wilayah"
              className={`p-1 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 transition ${
                isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-500' : isLight ? 'text-slate-400' : 'text-white/40'}`} />
        </div>
      </div>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-200 ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/60'
              : 'bg-[#001233]/95 border-white/15 text-white shadow-[#000000]/80'
          }`}
          style={{ maxHeight: '420px', display: 'flex', flexDirection: 'column' }}
        >
          {/* Header Controls: Search + Filters */}
          <div className={`p-3 border-b space-y-2.5 shrink-0 ${isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-[#000c24]/90 border-white/10'}`}>
            {/* Search Bar */}
            <div className="relative">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ketik untuk memfilter 514 kabupaten / kota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium border focus:outline-none transition ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                    : 'bg-[#00173d] border-white/15 text-white placeholder-white/40 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Bersihkan pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Province & Type Filter Controls */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <select
                  value={selectedProvinceFilter}
                  onChange={(e) => setSelectedProvinceFilter(e.target.value)}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-medium border focus:outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-700'
                      : 'bg-[#00173d] border-white/15 text-white/90'
                  }`}
                >
                  <option value="">Semua Provinsi ({TOTAL_PROVINSI} Provinsi)</option>
                  {provinceList.map((p) => (
                    <option key={p} value={p}>
                      {p} ({INDONESIA_PROVINCES[p].length} Wilayah)
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Switcher Pills */}
              <div className={`flex rounded-lg p-0.5 border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/30 border-white/10'}`}>
                {['ALL', 'Kota', 'Kabupaten'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTypeFilter(t)}
                    className={`px-2 py-1 rounded-md text-[10.5px] font-semibold transition ${
                      selectedTypeFilter === t
                        ? isLight
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'bg-emerald-600 text-white shadow-xs'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {t === 'ALL' ? 'Semua' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Chips: Pilihan Cepat Kota Populer */}
            {!searchQuery && !selectedProvinceFilter && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-thin">
                <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 mr-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                  Populer:
                </span>
                {popularRegions.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelect(p.name)}
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-md border shrink-0 transition ${
                      value === p.name
                        ? isLight
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                          : 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 font-bold'
                        : isLight
                        ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {p.short}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scrollable List of 514 Regencies/Cities Grouped by Province */}
          <div className="overflow-y-auto flex-1 p-2 space-y-3 scrollbar-thin">
            {Object.keys(groupedResults).length === 0 ? (
              <div className="p-8 text-center space-y-1">
                <p className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                  Tidak ditemukan kabupaten/kota yang sesuai dengan filter pencarian "{searchQuery}".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedProvinceFilter('');
                    setSelectedTypeFilter('ALL');
                  }}
                  className="text-xs text-emerald-600 hover:underline font-bold mt-2"
                >
                  Reset Filter & Tampilkan Semua 514 Wilayah
                </button>
              </div>
            ) : (
              Object.entries(groupedResults).map(([province, items]) => (
                <div key={province} className="space-y-1">
                  {/* Province Header */}
                  <div className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center justify-between sticky top-0 backdrop-blur-md z-10 ${
                    isLight 
                      ? 'bg-slate-100/90 text-slate-700 border border-slate-200' 
                      : 'bg-[#00173d]/90 text-emerald-300 border border-white/10'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      <Compass className="w-3 h-3 text-emerald-500" />
                      <span>Provinsi {province}</span>
                    </span>
                    <span className={`text-[9.5px] font-mono font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      {items.length} wilayah
                    </span>
                  </div>

                  {/* List of Cities/Kabupaten in this Province */}
                  <div className="grid grid-cols-1 gap-1 pt-0.5">
                    {items.map((item) => {
                      const isSelected = value === item.value;
                      const isKota = item.type === 'Kota';

                      return (
                        <div
                          key={item.value}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelect(item.value)}
                          className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors duration-150 ${
                            isSelected
                              ? isLight
                                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                                : 'bg-emerald-600/25 text-white font-bold border border-emerald-500/40'
                              : isLight
                              ? 'hover:bg-slate-100 text-slate-800'
                              : 'hover:bg-white/10 text-white/90'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                              isKota
                                ? isLight
                                  ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : isLight
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {isKota ? 'Kota' : 'Kab'}
                            </span>
                            <span className="truncate">
                              {item.cityName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] hidden sm:inline ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                              {province}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Info Counter */}
          <div className={`px-3 py-2 border-t text-[11px] flex items-center justify-between shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#000c24]/90 border-white/10 text-white/60'
          }`}>
            <span className="font-medium">
              Menampilkan <strong className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{filteredList.length}</strong> dari {TOTAL_KABUPATEN_KOTA} Kabupaten/Kota
            </span>
            <span className={`text-[10px] font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              38 Provinsi RI (Kemendagri / BPS)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
