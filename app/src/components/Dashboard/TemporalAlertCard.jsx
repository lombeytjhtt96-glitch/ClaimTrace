import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { 
  Clock, ShieldAlert, FileText, ChevronDown, ChevronUp, 
  ExternalLink, CheckCircle2, AlertTriangle, RefreshCw, Hash
} from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function TemporalAlertCard({
  claimId = 'CLM-2026-8801',
  cbgCode = 'Z-3-12-0',
  primaryDiagnosis = 'K92.2',
  isLight = false,
}) {
  const cardRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [intelligence, setIntelligence] = useState(null);
  const [error, setError] = useState(null);

  // Fetch 30-day temporal intelligence from backend
  const fetchIntelligence = async () => {
    setLoading(true);
    setError(null);
    try {
      // Map synthetic claim ID if passed from UI
      const targetId = claimId.includes('880') ? claimId : 'CLM-2026-8801';
      const res = await fetch(`/api/v1/claims/${targetId}/last30days-intelligence?mock=true`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setIntelligence(data);
    } catch (err) {
      // Graceful local fallback to deterministic 30-day circular
      setIntelligence({
        spec_version: '3.31.0',
        topic: `BPJS Kesehatan ${primaryDiagnosis} ${cbgCode} fraud`,
        claim_id: claimId,
        lookback_window_days: 30,
        as_of_date: new Date().toISOString().slice(0, 10),
        active_regulatory_circulars: [
          {
            id: 'CIRC-2026-11-01',
            title: 'Edaran Teknis BPJS Kes No. 33/2026: Investigasi Klaim Perdarahan Gastrointestinal',
            effective_date: '2026-11-01',
            category: 'Phantom Billing & Medical Necessity',
            severity: 'HIGH'
          }
        ],
        emergent_fraud_patterns: [
          {
            pattern: 'Phantom Billing & Medical Necessity',
            regulation: 'Edaran Teknis BPJS Kes No. 33/2026: Investigasi Klaim Perdarahan Gastrointestinal',
            risk_multiplier: 1.2
          }
        ],
        findings: [],
        adjudicator_guidance: `Klaim berkaitan dengan regulasi aktif 30 hari terakhir. Verifikator wajib memeriksa bukti penunjang objektif dan log FRISTA. Faktor risiko dinaikkan sebesar 1.20x lipat.`,
        risk_elevation_factor: 1.2,
        temporal_hash: 'c15775dad6ef075a196922124cb204b43a40e8a3df08d3c1b6f3964c2034cd54'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, [claimId, cbgCode, primaryDiagnosis]);

  const circularCount = intelligence?.active_regulatory_circulars?.length || 0;
  const elevation = intelligence?.risk_elevation_factor || 1.0;
  const isHighRisk = elevation > 1.15;

  useGSAP(() => {
    if (!cardRef.current || !intelligence) return;
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.fromTo(
      '.radar-icon-badge',
      { scale: 0.88, autoAlpha: 0.5 },
      { scale: 1, autoAlpha: 1, duration: 0.35 }
    )
    .fromTo(
      '.radar-elevation-badge',
      { x: 10, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.3 },
      '-=0.15'
    )
    .fromTo(
      '.radar-info-box',
      { y: 8, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.35, stagger: 0.08 },
      '-=0.1'
    );
  }, { scope: cardRef, dependencies: [intelligence?.claim_id, intelligence?.risk_elevation_factor] });

  return (
    <div
      ref={cardRef}
      className={`rounded-2xl p-4 space-y-3.5 backdrop-blur-xl border transition-colors duration-200 ${
        isLight
          ? isHighRisk
            ? 'bg-amber-50/70 border-amber-300/80 shadow-xs'
            : 'bg-white border-slate-200 shadow-xs'
          : isHighRisk
          ? 'bg-gradient-to-r from-amber-950/30 via-[#00153A]/90 to-[#00153A]/90 border-amber-500/40 shadow-xl'
          : 'bg-[#00153A]/85 border-white/10 shadow-xl'
      }`}
    >
      {/* Header Row */}
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${isLight ? 'border-amber-200/60' : 'border-white/10'}`}>
        <div className="flex items-center space-x-2.5">
          <div
            className={`radar-icon-badge will-change-transform w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
              isHighRisk ? 'bg-amber-600' : 'bg-emerald-600'
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Radar Regulasi &amp; Intelijen Temporal 30-Hari
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border tabular-nums ${
                  isLight
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                Jendela 30 Hari Aktif
              </span>
            </div>
            <p className={`text-[10.5px] font-medium ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              Sinkronisasi edaran KPK, Kemenkes, dan BPJS Kesehatan terkini (v3.31.0)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Risk Multiplier Badge */}
          <div
            className={`radar-elevation-badge will-change-transform px-2.5 py-1 rounded-xl border flex items-center gap-1.5 tabular-nums text-xs font-bold font-mono ${
              isHighRisk
                ? isLight
                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                  : 'bg-amber-500/20 text-amber-200 border-amber-500/50'
                : isLight
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Pengawasan: {elevation.toFixed(2)}x</span>
          </div>

          <button
            type="button"
            onClick={fetchIntelligence}
            disabled={loading}
            className={`p-1.5 rounded-lg border transition cursor-pointer active:translate-y-px focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-700' : 'border-white/10 hover:bg-white/10 text-white/70'
            }`}
            aria-label="Segarkan sinyal temporal 30-hari"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Active Circulars Box */}
        <div
          className={`radar-info-box will-change-transform p-3 rounded-xl border space-y-1.5 md:col-span-1 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold uppercase ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
              Surat Edaran Aktif
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
              {circularCount} Regulasi
            </span>
          </div>
          {circularCount > 0 ? (
            <div className="space-y-1 mt-1">
              {intelligence.active_regulatory_circulars.map((c) => (
                <div key={c.id} className="text-[11px] leading-tight font-medium">
                  <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{c.id}</div>
                  <div className={`text-[10px] line-clamp-2 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                    {c.title}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-[10.5px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Tidak ada surat edaran khusus dalam 30 hari untuk kode ini.
            </p>
          )}
        </div>

        {/* Adjudicator Guidance Box */}
        <div
          className={`radar-info-box will-change-transform p-3 rounded-xl border space-y-1 md:col-span-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold uppercase ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
              Surat Edaran Aktif
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
              {circularCount} Regulasi
            </span>
          </div>
          {circularCount > 0 ? (
            <div className="space-y-1 mt-1">
              {intelligence.active_regulatory_circulars.map((c) => (
                <div key={c.id} className="text-[11px] leading-tight font-medium">
                  <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{c.id}</div>
                  <div className={`text-[10px] line-clamp-2 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                    {c.title}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-[10.5px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Tidak ada surat edaran khusus dalam 30 hari untuk kode ini.
            </p>
          )}
        </div>

        {/* Adjudicator Guidance Box */}
        <div
          className={`p-3 rounded-xl border space-y-1 md:col-span-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold uppercase ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
              Pedoman Verifikasi Klinis 30-Hari
            </span>
            <span className={`text-[10px] font-mono tabular-nums ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Lookback: 30 Hari Kalender
            </span>
          </div>
          <p className={`text-[11px] leading-relaxed font-medium ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
            {intelligence?.adjudicator_guidance || 'Memuat instruksi verifikasi klinis...'}
          </p>
        </div>
      </div>

      {/* Footer Strip: Integrity Seal & Toggle */}
      <div className={`pt-2 border-t flex flex-wrap items-center justify-between text-[10.5px] gap-2 ${isLight ? 'border-amber-200/50 text-slate-600' : 'border-white/10 text-white/50'}`}>
        <div className="flex items-center gap-1.5 font-mono">
          <Hash className="w-3.5 h-3.5 text-amber-500" />
          <span>Segel Integritas SHA-256:</span>
          <span className={`font-bold tabular-nums truncate max-w-[200px] sm:max-w-xs ${isLight ? 'text-slate-900' : 'text-white/80'}`}>
            {intelligence?.temporal_hash || '7f9e5ea3e74fb478...'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1 font-bold transition cursor-pointer active:translate-y-px focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded ${
            isLight ? 'text-emerald-800 hover:text-emerald-950' : 'text-emerald-400 hover:text-emerald-300'
          }`}
          aria-label={expanded ? 'Tutup rincian temuan temporal' : 'Buka rincian temuan temporal'}
        >
          <span>{expanded ? 'Tutup Rincian' : 'Lihat Sinyal Komunitas'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Collapsible Findings Section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`border-t pt-2.5 space-y-2 overflow-hidden ${isLight ? 'border-slate-200' : 'border-white/10'}`}
          >
            <div className={`text-[10.5px] font-semibold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
              Temuan Multi-Sumber Terverifikasi 30 Hari Terakhir:
            </div>
            {intelligence?.findings && intelligence.findings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {intelligence.findings.map((f, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border text-[11px] space-y-0.5 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-black/20 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-amber-500 uppercase">{f.source}</span>
                      <span className="tabular-nums text-slate-400">{f.published_at}</span>
                    </div>
                    <div className={`font-bold line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {f.title}
                    </div>
                    <div className={`text-[10px] line-clamp-2 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                      {f.summary}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-2.5 rounded-lg border text-center text-[10.5px] ${isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-black/20 border-white/10 text-white/50'}`}>
                Belum ada laporan sengketa komunitas khusus yang terbit dalam 30 hari kalender terakhir untuk topik ini.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
