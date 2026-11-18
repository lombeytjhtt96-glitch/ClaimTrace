import React from 'react';
import { ArrowUpRight, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

/**
 * PolicyPilot-inspired segmented horizontal compliance bar with counts and alert strip.
 * Used across ExecutiveHub and DocumentCheckerView to replace dense metric paragraphs.
 */
export function SegmentedComplianceBar({
  title = 'Kepatuhan Dokumen & Klaim',
  segments = [],
  validCount = 0,
  validLabel = 'Berkas Valid',
  pendingCount = 0,
  pendingLabel = 'Perlu Tinjauan',
  warningText = '',
  onDismissWarning,
  actionLabel = '',
  onActionClick,
  isLight = true,
}) {
  const safeSegments = segments.filter((s) => Number(s.pct) > 0);
  const rawNormalized = safeSegments.length > 0 ? safeSegments : [{ id: 'default', label: 'Valid', pct: 100, count: validCount, color: '#059669' }];
  // Format 1-decimal percentages guaranteed to sum to exactly 100.0%
  const rawTotalPct = rawNormalized.reduce((acc, s) => acc + Number(s.pct || 0), 0) || 100;
  let runningRounded = 0;
  const normalized = rawNormalized.map((seg, idx) => {
    const scaled = (Number(seg.pct || 0) / rawTotalPct) * 100;
    const isLast = idx === rawNormalized.length - 1;
    const displayPct = isLast
      ? Number(Math.max(0, 100 - runningRounded).toFixed(1))
      : Number(scaled.toFixed(1));
    runningRounded = Number((runningRounded + displayPct).toFixed(1));
    return { ...seg, displayPct };
  });

  return (
    <section
      aria-label={title}
      className={`rounded-2xl border p-5 transition-colors duration-300 glass-panel ${
        isLight ? 'text-slate-900' : 'text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className={`text-sm font-display font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {title}
        </h3>
        {actionLabel && onActionClick && (
          <button
            type="button"
            onClick={onActionClick}
            aria-label={actionLabel}
            title={actionLabel}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition cursor-pointer ${
              isLight
                ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Percentage markers + segmented bar */}
      <div className="space-y-2">
        <div className="flex items-end gap-1 text-xs font-mono font-bold tabular-nums">
          {normalized.map((seg) => (
            <div
              key={seg.id}
              style={{ width: `${Math.max(16, seg.displayPct)}%` }}
              className={`min-w-0 whitespace-nowrap border-l pl-1.5 ${
                isLight ? 'border-slate-200 text-slate-700' : 'border-white/15 text-slate-200'
              }`}
            >
              {seg.displayPct.toFixed(1).replace('.', ',')}%
            </div>
          ))}
        </div>

        <div
          className={`w-full h-2 rounded-full overflow-hidden flex ${
            isLight ? 'bg-slate-200/70' : 'bg-white/10'
          }`}
          role="img"
          aria-label={normalized.map((s) => `${s.label} ${s.displayPct.toFixed(1)}%`).join(', ')}
        >
          {normalized.map((seg) => (
            <div
              key={seg.id}
              style={{ width: `${Math.max(4, seg.displayPct)}%`, backgroundColor: seg.color }}
              className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              title={`${seg.label}: ${Number(seg.count || 0).toLocaleString('id-ID')} (${seg.displayPct.toFixed(1)}%)`}
            />
          ))}
        </div>
      </div>

      {/* Sub-chips */}
      <div className="grid grid-cols-3 gap-2 mt-3.5">
        {segments.slice(0, 3).map((seg) => (
          <div
            key={seg.id}
            className={`rounded-xl border px-2 py-2 transition-colors glass-item min-w-0 ${
              isLight ? 'hover:bg-white/90' : 'hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} aria-hidden="true" />
              <span className={`text-xs font-mono font-bold tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {Number(seg.count || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <p className={`text-[11px] font-medium whitespace-nowrap mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {seg.label}
            </p>
          </div>
        ))}
      </div>

      {/* Big Counters Row */}
      <div className={`flex flex-wrap items-baseline justify-between gap-3 mt-4 pt-3.5 border-t ${
        isLight ? 'border-slate-100' : 'border-white/[0.07]'
      }`}>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-xl font-display font-bold tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {Number(validCount || 0).toLocaleString('id-ID')}
          </span>
          <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {validLabel}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-xl font-display font-bold tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {Number(pendingCount || 0).toLocaleString('id-ID')}
          </span>
          <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {pendingLabel}
          </span>
        </div>
      </div>

      {/* Dismissible Soft Warning Banner */}
      {warningText && (
        <div
          className={`mt-3.5 rounded-xl border px-3 py-2.5 flex items-start gap-2.5 text-xs ${
            isLight
              ? 'bg-amber-50/90 border-amber-200/90 text-amber-950'
              : 'bg-amber-500/10 border-amber-500/25 text-amber-200'
          }`}
        >
          <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
          <p className="flex-1 text-xs leading-relaxed font-medium">{warningText}</p>
          {onDismissWarning && (
            <button
              type="button"
              onClick={onDismissWarning}
              aria-label="Tutup peringatan kepatuhan"
              className={`p-0.5 rounded transition cursor-pointer shrink-0 ${
                isLight ? 'text-amber-700 hover:bg-amber-200/50' : 'text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * PolicyPilot-inspired vivid gradient highlight card with segmented radial gauge OR queue stat tiles.
 */
export function SegmentedRadialHighlightCard({
  title = 'Antrean & Kapasitas SLA',
  percentage = 99.9,
  centerPrimary = '99,9%',
  centerSub = 'SLA Terkendali',
  breakdownRows = [],
  queueTiles = [],
  footerNote = '',
  ctaLabel = 'Buka Antrean',
  onCtaClick,
  tone = 'emerald-blue',
  isLight = true,
}) {
  const ticks = 40;
  const activeTicks = Math.max(1, Math.min(ticks, Math.round((Number(percentage) / 100) * ticks)));

  return (
    <section
      aria-label={title}
      className={`rounded-2xl border p-5 transition-colors duration-300 relative overflow-hidden glass-panel ${
        isLight ? 'text-slate-900' : 'text-slate-100'
      }`}
    >
      <div className="relative z-10 flex items-center justify-between gap-2 mb-4">
        <h3 className={`text-sm font-display font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {title}
        </h3>
        {onCtaClick && (
          <button
            type="button"
            onClick={onCtaClick}
            aria-label={ctaLabel}
            title={ctaLabel}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition cursor-pointer shrink-0 ${
              isLight
                ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {queueTiles.length > 0 ? (
        <div className="relative z-10 space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            {queueTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={tile.onClick || onCtaClick}
                  className={`text-left rounded-xl border p-3 transition cursor-pointer group glass-item ${
                    isLight
                      ? 'hover:bg-white/90'
                      : 'hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={`text-lg font-display font-bold tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {tile.value}
                    </span>
                    {Icon && <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />}
                  </div>
                  <p className={`text-xs font-medium truncate mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{tile.label}</p>
                </button>
              );
            })}
          </div>
          {footerNote && (
            <div className={`rounded-xl border px-3 py-2 flex items-center gap-2 text-xs glass-item ${
              isLight
                ? 'text-slate-700'
                : 'text-white/90'
            }`}>
              <Info className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span className="leading-snug">{footerNote}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Segmented Radial Tick Ring */}
          <div className="sm:col-span-5 flex items-center justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
                {Array.from({ length: ticks }).map((_, idx) => {
                  const angle = (idx / ticks) * 2 * Math.PI;
                  const x1 = 60 + 44 * Math.cos(angle);
                  const y1 = 60 + 44 * Math.sin(angle);
                  const x2 = 60 + 53 * Math.cos(angle);
                  const y2 = 60 + 53 * Math.sin(angle);
                  const active = idx < activeTicks;
                  return (
                    <line
                      key={idx}
                      x1={x1.toFixed(2)}
                      y1={y1.toFixed(2)}
                      x2={x2.toFixed(2)}
                      y2={y2.toFixed(2)}
                      stroke={active ? (isLight ? '#059669' : '#10B981') : (isLight ? '#E2E8F0' : 'rgba(255,255,255,0.12)')}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                <span className={`text-xl font-display font-bold tabular-nums leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {centerPrimary}
                </span>
                <span className={`text-xs font-semibold mt-1 leading-tight ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  {centerSub}
                </span>
              </div>
            </div>
          </div>

          {/* Translucent / Subtle Breakdown Tiles */}
          <div className="sm:col-span-7 space-y-2">
            {breakdownRows.map((row) => (
              <div
                key={row.id}
                className={`rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-2.5 transition-colors glass-item ${
                  isLight
                    ? 'hover:bg-white/90'
                    : 'hover:bg-white/[0.08]'
                }`}
              >
                <div className="min-w-0">
                  <div className={`text-sm font-mono font-bold tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {row.metric}
                  </div>
                  <div className={`text-xs font-medium truncate mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {row.label}
                  </div>
                </div>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Mini SVG Circular Step Progress Ring for PolicyPilot-style 4-Step Document Upload/AI Scan flow.
 */
export function PolicyStepProgressRing({ pct = 16, size = 24, isLight = true }) {
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (clamped / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0" aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={isLight ? '#DBEAFE' : 'rgba(59,130,246,0.22)'}
        strokeWidth="2.5"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={clamped >= 100 ? '#059669' : '#2563EB'}
        strokeWidth="2.5"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.35s ease' }}
      />
    </svg>
  );
}

/**
 * Normalizes categorical axis labels so horizontal Recharts bars never wrap awkwardly onto multiple lines.
 */
export function formatAxisLabel(raw, { maxChars = 32, stripParens = false } = {}) {
  let label = String(raw || '').trim();
  if (stripParens) {
    label = label
      .replace(/\s*\([^)]*\)\s*/g, ' ')
      .replace(/\s+Sehat Mandiri\b/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (label.length <= maxChars) return label;
  const sliced = label.slice(0, maxChars - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  const clean = lastSpace > Math.floor(maxChars * 0.45) ? sliced.slice(0, lastSpace) : sliced;
  return `${clean.trimEnd()}…`;
}

/**
 * Pure single-line SVG Y-axis tick for Recharts horizontal bar charts.
 */
export function SingleLineYAxisTick({
  x = 0,
  y = 0,
  payload,
  fill = '#334155',
  fontSize = 11,
  fontWeight = 500,
  maxChars = 32,
  stripParens = false,
}) {
  const fullVal = String(payload?.value || '');
  const displayVal = formatAxisLabel(fullVal, { maxChars, stripParens });
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{fullVal}</title>
      <text
        x={-6}
        y={0}
        dy={4}
        textAnchor="end"
        fill={fill}
        fontSize={fontSize}
        fontWeight={fontWeight}
        fontFamily="'Plus Jakarta Sans', 'Inter', system-ui, sans-serif"
      >
        {displayVal}
      </text>
    </g>
  );
}
