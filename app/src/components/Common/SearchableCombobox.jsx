import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';

/**
 * Scalable Searchable Combobox for high-cardinality BPJS Kesehatan entities
 * (2,091+ FKRTL hospitals, millions of Claim IDs / FPK batches).
 * Caps rendered DOM suggestions to `maxResults` and requires typing to narrow down.
 */
export default function SearchableCombobox({
  id,
  ariaLabel,
  value,
  onChange,
  options = [], // [{ value, label, sublabel? }]
  placeholder = 'Ketik untuk mencari...',
  allowAll = false,
  allValue = 'all',
  allLabel = 'Semua',
  maxResults = 8,
  isLight = true,
  className = '',
}) {
  const autoId = useId();
  const inputId = id || `combobox-${autoId}`;
  const listboxId = `${inputId}-listbox`;
  const containerRef = useRef(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) || null,
    [options, value]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIdx, setHighlightedIdx] = useState(0);

  // Sync display text when closed
  const displayValue = isOpen
    ? query
    : allowAll && value === allValue
    ? ''
    : selectedOption?.label || (value && value !== allValue ? String(value) : '');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const hay = `${opt.label || ''} ${opt.value || ''} ${opt.sublabel || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  const visibleItems = useMemo(() => {
    const list = [];
    if (allowAll && !query.trim()) {
      list.push({ value: allValue, label: allLabel, isAll: true });
    }
    return [...list, ...filtered.slice(0, maxResults)];
  }, [allowAll, allValue, allLabel, filtered, maxResults, query]);

  const overflowCount = Math.max(0, filtered.length - maxResults);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const commitSelection = (val) => {
    onChange(val);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIdx(0);
      } else {
        setHighlightedIdx((prev) => Math.min(visibleItems.length - 1, prev + 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx((prev) => Math.max(0, prev - 1));
    } else if (e.key === 'Enter' && isOpen) {
      e.preventDefault();
      const target = visibleItems[highlightedIdx] || visibleItems[0];
      if (target) commitSelection(target.value);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  const showClear = allowAll && value !== allValue && value !== '';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search
          aria-hidden="true"
          className={`w-3.5 h-3.5 absolute left-2.5 pointer-events-none ${
            isLight ? 'text-slate-400' : 'text-white/40'
          }`}
        />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-label={ariaLabel || placeholder}
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          value={displayValue}
          placeholder={allowAll && value === allValue ? placeholder : placeholder}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
            setHighlightedIdx(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIdx(0);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full text-xs pl-8 pr-8 py-2 rounded-xl border focus:outline-none transition ${
            isLight
              ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
              : 'bg-white/5 text-white border-white/15 placeholder-white/45 focus:border-[#FFCA40]'
          }`}
        />
        {showClear ? (
          <button
            type="button"
            aria-label="Hapus pilihan filter"
            onClick={() => commitSelection(allValue)}
            className={`absolute right-2 p-0.5 rounded hover:bg-slate-200/70 dark:hover:bg-white/10 cursor-pointer ${
              isLight ? 'text-slate-500' : 'text-white/60'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Buka daftar pencarian"
            onClick={() => {
              setIsOpen((prev) => !prev);
              setQuery('');
            }}
            className={`absolute right-2 p-0.5 cursor-pointer ${
              isLight ? 'text-slate-400' : 'text-white/50'
            }`}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className={`absolute z-50 mt-1 w-full min-w-[240px] rounded-xl border shadow-lg overflow-hidden ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-[#0B1733] border-white/15 text-white'
          }`}
        >
          <div className="max-h-60 overflow-y-auto py-1">
            {visibleItems.length === 0 ? (
              <div className="px-3 py-2.5 text-[11px] opacity-65 text-center">
                Tidak ada data cocok untuk &ldquo;{query}&rdquo;
              </div>
            ) : (
              visibleItems.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isActive = idx === highlightedIdx;
                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIdx(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commitSelection(opt.value);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                      isActive
                        ? isLight
                          ? 'bg-emerald-50 text-emerald-950'
                          : 'bg-emerald-600/25 text-white'
                        : isLight
                        ? 'hover:bg-slate-50 text-slate-800'
                        : 'hover:bg-white/5 text-white/90'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="text-[10px] font-mono opacity-65 truncate">{opt.sublabel}</div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
          {overflowCount > 0 && (
            <div
              className={`px-3 py-1.5 text-[10px] border-t font-medium ${
                isLight
                  ? 'bg-slate-50 border-slate-100 text-slate-500'
                  : 'bg-white/[0.03] border-white/10 text-white/50'
              }`}
            >
              +{overflowCount} lainnya — ketik nama atau kode untuk mempersempit pencarian
            </div>
          )}
        </div>
      )}
    </div>
  );
}
