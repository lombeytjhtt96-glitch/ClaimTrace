import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GitBranch, ZoomIn, ZoomOut, RotateCcw, Filter, 
  Download, Hospital, Stethoscope, User, Calendar, 
  Activity, AlertTriangle, CheckCircle2, XCircle, 
  Info, ArrowRight, Eye, ShieldAlert, Lock, Sparkles, Database
} from 'lucide-react';

export default function GraphVisualizer({ 
  caseData,
  patientResponse = null,
  onOpenDecision,
  onBackToInvestigation,
  isLight = false
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNode, setSelectedNode] = useState('mitra-husada');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'dpjp' | 'denials'

  const [isLightMode, setIsLightMode] = useState(() => {
    if (isLight !== undefined) return isLight;
    if (typeof document !== 'undefined') {
      return document.getElementById('cockpit-root')?.classList.contains('theme-light') || false;
    }
    return false;
  });

  useEffect(() => {
    if (isLight !== undefined) {
      setIsLightMode(isLight);
      return;
    }
    const root = document.getElementById('cockpit-root');
    if (!root) return;
    const obs = new MutationObserver(() => {
      setIsLightMode(root.classList.contains('theme-light'));
    });
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, [isLight]);

  // Patient denied status responds directly to live simulator
  const isKhalafDenied = patientResponse === 'denied' || patientResponse === null;

  const handleExportGraph = () => {
    const graphData = {
      graphMeta: {
        id: "SYNDICATE-MITRA-HUSADA-OKT26",
        generatedAt: new Date().toISOString(),
        totalNodes: Object.keys(nodes).length,
        totalEdges: 6,
        fraudClassification: "Phantom Billing & Repeat Billing"
      },
      nodes: Object.values(nodes).map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        category: n.category,
        risk: n.risk,
        details: n.details
      })),
      edges: [
        { source: "dr-hendra", target: "mitra-husada", relation: "SIP KEDALUWARSA (SDMK)" },
        { source: "baksos-event", target: "mitra-husada", relation: "HARVESTING NIK (85 Klaim)" },
        { source: "khalaf-patient", target: "mitra-husada", relation: "SANGKALAN PRESENSI (Mobile JKN)" },
        { source: "khalaf-patient", target: "dr-hendra", relation: "TIDAK PERNAH DIPERIKSA" },
        { source: "verified-patients", target: "mitra-husada", relation: "8/10 SANGKALAN FAKTUAL" },
        { source: "baksos-event", target: "verified-patients", relation: "DISTRIBUSI BANTUAN" }
      ]
    };

    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graph_network_syndicate_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCypher = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/graph/cypher-export');
      if (res.ok) {
        const text = await res.text();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `claimtrace_neo4j_syndicate_${Date.now()}.cypher`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // Fallback to local compliant Cypher query definition
    }
    const cypherScript = `// =========================================================================
// CLAIMTRACE NEO4J CYPHER FRAUD KNOWLEDGE GRAPH
// Tim Pengembang Nasional ClaimTrace • BPJS Kesehatan Tingkat Nasional
// =========================================================================

CREATE CONSTRAINT IF NOT EXISTS FOR (c:Claim) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (f:Faskes) REQUIRE f.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (d:DPJP) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (p:Peserta) REQUIRE p.id IS UNIQUE;

MERGE (f:Faskes {id: '0132R001', name: 'RS Khusus Mitra Husada', kelas: 'B', kota: 'Kota Serang', provinsi: 'Banten'})
MERGE (d:DPJP {id: 'DPJP-HENDRA-KFR', name: 'dr. Hendra, Sp.KFR', sip: '446.1/108/DPJP/2023', sdmk_valid: false})
MERGE (e:Event {id: 'BAKSOS_MASSAL_OKT26', title: 'Baksos Pengumpulan NIK Massal', tanggal: '2026-10-12'})
MERGE (cbg:InaCbg {code: 'Z-3-12-0', deskripsi: 'Prosedur Fisioterapi / Rehab Medis Massal', tarif: 180000})
MERGE (p:Peserta {id: 'PST-77218902', name: 'Khalaf Faith Pradyatama', jkn_active: true, mobile_jkn_denied: true})

MERGE (d)-[:PRACTICES_AT {status: 'SIP_EXPIRED_SDMK', patient_load: 85}]->(f)
MERGE (e)-[:HARVESTED_IDENTITY {count_claims: 85, timeframe_hours: 48}]->(f)
MERGE (p)-[:DENIED_SERVICE_ATTENDANCE {lapis: 3, verified_geofence: false, timestamp: '2026-10-14T09:30:00Z'}]->(f)
MERGE (p)-[:NEVER_EXAMINED_BY]->(d)
MERGE (f)-[:BILLED_PROCEDURE {batch_id: 'BAK-2026-X-085', nominal: 15300000}]->(cbg);
`;
    const blob = new Blob([cypherScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claimtrace_neo4j_syndicate_${Date.now()}.cypher`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Nodes definition
  const nodes = {
    'mitra-husada': {
      id: 'mitra-husada',
      type: 'hospital',
      title: 'RS Khusus Mitra Husada',
      subtitle: 'FKRTL (RS Khusus Kelas C) · Kode: 0132R001',
      category: 'Fasilitas Kesehatan Penagih',
      risk: 'AUDIT PRA-BAYAR (Pusat Anomali)',
      details: 'Fasilitas kesehatan yang menagihkan 85 klaim paket fisioterapi INA-CBG Z-3-12-0 serentak pasca baksos dalam 48 jam.',
      color: '#818CF8',
      x: 380,
      y: 220
    },
    'dr-hendra': {
      id: 'dr-hendra',
      type: 'doctor',
      title: 'dr. Hendra, Sp.KFR',
      subtitle: 'DPJP Tertera · SIP: 446.1/108/DPJP/2023',
      category: 'Dokter Penanggung Jawab Pelayanan',
      risk: 'HARD-TRIGGER (SIP Kedaluwarsa / Mutasi)',
      details: 'Pemeriksaan silang SATUSEHAT SDMK mendeteksi SIP DPJP tidak aktif di RS Khusus Mitra Husada pada 14 Okt 2026. Beban 85 pasien/hari melampaui batas kewajaran.',
      color: '#F43F5E',
      x: 180,
      y: 120
    },
    'baksos-event': {
      id: 'baksos-event',
      type: 'event',
      title: 'Kegiatan Baksos Donor Darah',
      subtitle: 'Batch: BAKSOS_MASSAL_OKT26 · 12 Okt 2026',
      category: 'Sumber Pengumpulan Data Peserta',
      risk: 'PENGUMPULAN IDENTITAS (Harvesting)',
      details: 'Kegiatan bakti sosial donor darah tempat identitas KIS 85 peserta dikumpulkan tanpa indikasi rujukan rawat jalan spesialis.',
      color: '#38BDF8',
      x: 180,
      y: 320
    },
    'inacbg-code': {
      id: 'inacbg-code',
      type: 'procedure',
      title: 'INA-CBG: Z-3-12-0',
      subtitle: 'Prosedur Fisioterapi / Rehab Medis Massal',
      category: 'Tarif Paket Klaim JKN',
      risk: 'ANOMALI FREKUENSI (Repeat Billing)',
      details: 'Tarif Rp 180.000 / klaim. Total tagihan Rp 15.300.000 untuk 85 peserta tanpa riwayat rujukan sah dari FKTP.',
      color: '#FFCA40',
      x: 580,
      y: 120
    },
    'khalaf-patient': {
      id: 'khalaf-patient',
      type: 'patient',
      title: 'Khalaf Faith Pradyatama',
      subtitle: 'PST-77218902 · Peserta JKN-KIS Aktif',
      category: 'Konfirmasi Faktual Mobile JKN',
      risk: isKhalafDenied ? 'INDIKASI FIKTIF (Menyangkal Hadir)' : 'TERKONFIRMASI HADIR',
      details: isKhalafDenied 
        ? 'Peserta telah mengonfirmasi melalui Mobile JKN bahwa TIDAK PERNAH menerima layanan fisioterapi pada 14 Oktober 2026 di faskes ini.'
        : 'Peserta menyatakan hadir menerima layanan medis.',
      color: isKhalafDenied ? '#F43F5E' : '#10B981',
      x: 580,
      y: 320
    }
  };

  // Generate patient cluster coordinates
  const patientCluster = Array.from({ length: 24 }).map((_, i) => {
    const isDenied = i < 8 || (i === 8 && patientResponse === 'denied');
    const angle = (i / 24) * 2 * Math.PI;
    const radius = 130 + (i % 3) * 20;
    const cx = 380 + radius * Math.cos(angle);
    const cy = 220 + radius * Math.sin(angle);
    return {
      index: i + 1,
      id: `PST-KLAIM-${i + 1}`,
      isDenied,
      cx,
      cy
    };
  });

  const activeNodeData = nodes[selectedNode] || nodes['mitra-husada'];

  return (
    <div className="space-y-4 font-inter text-slate-800 dark:text-white pb-20">
      {/* TOP BANNER / HEADER STRIP - GLASSMORPHISM */}
      <div className="w-full bg-white dark:bg-[#00153A]/85 backdrop-blur-xl px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 shadow-sm dark:shadow-2xl dark:shadow-[#00081c]/50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-cyan-500/15 text-emerald-700 dark:text-cyan-300 border border-emerald-200 dark:border-cyan-500/30 flex items-center justify-center font-bold shadow-xs">
            <GitBranch className="w-5 h-5 text-emerald-600 dark:text-cyan-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                Topologi Graf Relasi Kasus #CLM-2026-085
              </span>
              <span className="bg-slate-100 text-slate-800 border border-slate-300 dark:bg-white/10 dark:text-white/80 dark:border-white/15 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shadow-xs inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                JEJARING ANOMALI
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-white/5 dark:text-[#FFCA40] dark:border-white/10 font-mono font-bold px-2 py-0.5 rounded">
                MITRE F3: FA0001 Syndicate · ATT&CK: T1078
              </span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-white/60 font-medium">
              Analisis Hubungan Bipartit: Faskes ↔ DPJP ↔ Kegiatan ↔ Peserta · Validasi SATUSEHAT Kemenkes &amp; Deteksi Sindikat Klaim Fiktif.
            </p>
          </div>
        </div>

        {/* GRAPH INTERACTION CONTROLS */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center bg-slate-100 dark:bg-white/5 rounded-xl p-1 border border-slate-200 dark:border-white/10 font-semibold">
            <button type="button" 
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg text-xs transition cursor-pointer ${
                filterMode === 'all' 
                  ? 'bg-emerald-600 text-white font-bold shadow-xs dark:bg-emerald-600 dark:text-white' 
                  : 'text-slate-700 hover:text-slate-900 dark:text-white/60 dark:hover:text-white'
              }`}
            >
              Semua Simpul
            </button>
            <button type="button" 
              onClick={() => { setFilterMode('dpjp'); setSelectedNode('dr-hendra'); }}
              className={`px-3 py-1 rounded-lg text-xs flex items-center space-x-1.5 transition cursor-pointer ${
                filterMode === 'dpjp' 
                  ? 'bg-slate-900 text-white font-bold shadow-xs dark:bg-white/20 dark:text-white' 
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>DPJP Bermasalah</span>
            </button>
            <button type="button" 
              onClick={() => { setFilterMode('denials'); setSelectedNode('khalaf-patient'); }}
              className={`px-3 py-1 rounded-lg text-xs flex items-center space-x-1.5 transition cursor-pointer ${
                filterMode === 'denials' 
                  ? 'bg-slate-900 text-white font-bold shadow-xs dark:bg-white/20 dark:text-white' 
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Menyangkal (8)</span>
            </button>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-white/5 rounded-xl p-1 border border-slate-200 dark:border-white/10">
            <button type="button" 
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
              aria-label="Perbesar tampilan graf relasi"
              className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white rounded cursor-pointer transition"
              title="Perbesar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button type="button" 
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.7))}
              aria-label="Perkecil tampilan graf relasi"
              className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white rounded cursor-pointer transition"
              title="Perkecil"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button type="button" 
              onClick={() => setZoomLevel(1)}
              aria-label="Reset ukuran dan pusatkan graf relasi"
              className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white rounded cursor-pointer transition"
              title="Pusatkan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button type="button" 
            onClick={handleExportGraph}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border-white/15 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700 dark:text-cyan-400" />
            <span>Ekspor JSON/Graf</span>
          </button>

          <button type="button" 
            onClick={handleExportCypher}
            className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition text-xs font-semibold shadow-xs cursor-pointer"
            title="Ekspor Skrip Kueri Graf Neo4j Cypher Resmi"
          >
            <Database className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
            <span>Ekspor Cypher Neo4j</span>
          </button>
        </div>
      </div>

      {/* GRAPH CANVAS & FORENSIC DRAWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* SVG INTERACTIVE GRAPH CANVAS (8 COLS) - CYBERNETIC DEEP SPACE */}
        <div className="lg:col-span-8 bg-slate-50 dark:bg-gradient-to-b dark:from-[#000c24] dark:via-[#00112e] dark:to-[#001D58] border border-slate-200 dark:border-white/10 rounded-2xl p-2 relative overflow-hidden shadow-sm dark:shadow-2xl min-h-[400px] h-[410px] xl:h-[440px] flex items-center justify-center">
          
          {/* Futuristic Cyber Dot Grid */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: isLightMode 
                ? 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)' 
                : 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              opacity: isLightMode ? 0.45 : 0.25
            }}
          />

          {/* Spatial Telemetry HUD (Top-Left) */}
          <div className="absolute top-3 left-3 bg-white/95 dark:bg-[#000c24]/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 text-[11px] font-mono space-y-1 z-10 shadow-md dark:shadow-xl dark:shadow-black/60">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              <span>STATUS RELASI KASUS</span>
            </div>
            <div className="text-slate-700 dark:text-white/60 space-y-0.5 text-[10px]">
              <div>KLASTER: <strong className="text-slate-900 dark:text-white font-bold">BAKSOS-085</strong></div>
              <div>SIMPUL: <strong className="text-emerald-800 dark:text-cyan-300 font-bold">92</strong> · HUBUNGAN: <strong className="text-emerald-800 dark:text-cyan-300 font-bold">176</strong></div>
            </div>
          </div>

          {/* SVG Canvas with Zoom transform */}
          <div 
            className="w-full h-full transition-transform duration-300 flex items-center justify-center select-none"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <svg 
              viewBox="0 0 760 440" 
              className="w-full max-w-[760px] h-auto overflow-visible cursor-grab active:cursor-grabbing"
            >
              <defs>
                {/* Glow Filter for High-Tech Nodes and Edges */}
                <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* EDGES / CONNECTIONS */}
              {/* Edge: Hospital <-> Doctor */}
              <line 
                x1="380" y1="220" 
                x2="180" y2="120" 
                stroke={isLightMode ? '#e11d48' : '#F43F5E'} 
                strokeWidth="2.5" 
                strokeDasharray="6,4"
                filter="url(#glow-red)"
              />
              <text 
                x="250" 
                y="155" 
                fill={isLightMode ? '#881337' : '#FDA4AF'} 
                fontSize="9.5" 
                fontWeight="900" 
                transform="rotate(-26, 250, 155)"
                style={{ paintOrder: 'stroke fill', stroke: isLightMode ? '#ffffff' : '#00134A', strokeWidth: '4px', strokeLinejoin: 'round' }}
              >
                SIP Non-Aktif (SDMK)
              </text>

              {/* Edge: Hospital <-> Baksos Event */}
              <line 
                x1="380" y1="220" 
                x2="180" y2="320" 
                stroke={isLightMode ? '#0284c7' : '#38BDF8'} 
                strokeWidth="2" 
                strokeDasharray="4,4"
                filter="url(#glow-cyan)"
              />
              <text 
                x="245" 
                y="285" 
                fill={isLightMode ? '#075985' : '#7DD3FC'} 
                fontSize="9.5" 
                fontWeight="900" 
                transform="rotate(26, 245, 285)"
                style={{ paintOrder: 'stroke fill', stroke: isLightMode ? '#ffffff' : '#00134A', strokeWidth: '4px', strokeLinejoin: 'round' }}
              >
                Klaster Baksos 48 Jam
              </text>

              {/* Edge: Hospital <-> INA-CBG Code */}
              <line 
                x1="380" y1="220" 
                x2="580" y2="120" 
                stroke={isLightMode ? '#d97706' : '#FFCA40'} 
                strokeWidth="2" 
              />
              <text 
                x="450" 
                y="155" 
                fill={isLightMode ? '#78350f' : '#FFE082'} 
                fontSize="9.5" 
                fontWeight="900" 
                transform="rotate(26, 450, 155)"
                style={{ paintOrder: 'stroke fill', stroke: isLightMode ? '#ffffff' : '#00134A', strokeWidth: '4px', strokeLinejoin: 'round' }}
              >
                Tagihan Z-3-12-0 (Rp 15,3 Jt)
              </text>

              {/* Edge: Hospital <-> Khalaf Patient */}
              <line 
                x1="380" y1="220" 
                x2="580" y2="320" 
                stroke={isKhalafDenied ? (isLightMode ? '#e11d48' : '#F43F5E') : (isLightMode ? '#059669' : '#10B981')} 
                strokeWidth="2.5" 
                strokeDasharray={isKhalafDenied ? '4,4' : 'none'}
                filter={isKhalafDenied ? 'url(#glow-red)' : ''}
              />
              <text 
                x="430" 
                y="245" 
                fill={isKhalafDenied ? (isLightMode ? '#881337' : '#FDA4AF') : (isLightMode ? '#064e3b' : '#6EE7B7')} 
                fontSize="9.5" 
                fontWeight="900" 
                transform="rotate(26, 430, 245)"
                style={{ paintOrder: 'stroke fill', stroke: isLightMode ? '#ffffff' : '#00134A', strokeWidth: '4px', strokeLinejoin: 'round' }}
              >
                {isKhalafDenied ? 'Mobile JKN: DISANGKAL' : 'Mobile JKN: DIKONFIRMASI'}
              </text>

              {/* Minor Edges to Patient Cluster */}
              {patientCluster.map((p) => {
                if (filterMode === 'denials' && !p.isDenied) return null;
                return (
                  <line 
                    key={`edge-${p.id}`}
                    x1="380" y1="220" 
                    x2={p.cx} y2={p.cy} 
                    stroke={p.isDenied ? (isLightMode ? '#e11d48' : '#F43F5E') : (isLightMode ? 'rgba(148,163,184,0.45)' : 'rgba(255,255,255,0.2)')} 
                    strokeWidth={p.isDenied ? '1.5' : '0.8'}
                    strokeOpacity={p.isDenied ? 0.8 : 0.25}
                  />
                );
              })}

              {/* Patient Cluster Nodes (Outer Ring) */}
              {patientCluster.map((p) => {
                if (filterMode === 'denials' && !p.isDenied) return null;
                return (
                  <g 
                    key={p.id}
                    className="cursor-pointer transition-transform hover:scale-150"
                    onClick={() => setSelectedNode('khalaf-patient')}
                  >
                    <circle 
                      cx={p.cx} 
                      cy={p.cy} 
                      r={p.isDenied ? 6.5 : 4} 
                      fill={p.isDenied ? (isLightMode ? '#e11d48' : '#F43F5E') : (isLightMode ? '#94a3b8' : '#64748B')}
                      stroke={p.isDenied ? (isLightMode ? '#fecdd3' : '#FFE4E6') : (isLightMode ? '#f1f5f9' : '#1E293B')}
                      strokeWidth="1.5"
                      filter={p.isDenied ? 'url(#glow-red)' : ''}
                    />
                  </g>
                );
              })}

              {/* MAIN ENTITY NODES */}
              
              {/* 1. DOCTOR NODE (Top Left) */}
              <g 
                className="cursor-pointer"
                onClick={() => setSelectedNode('dr-hendra')}
              >
                <circle 
                  cx="180" cy="120" r="32" 
                  fill={isLightMode ? '#fff1f2' : '#1E0E1A'} 
                  stroke={isLightMode ? '#e11d48' : '#F43F5E'} 
                  strokeWidth={selectedNode === 'dr-hendra' ? '4' : '2'}
                  filter="url(#glow-red)"
                />
                <text x="180" y="118" textAnchor="middle" fill={isLightMode ? '#e11d48' : '#FDA4AF'} fontSize="16">
                  👨‍⚕️
                </text>
                <text x="180" y="132" textAnchor="middle" fill={isLightMode ? '#e11d48' : '#F43F5E'} fontSize="8" fontWeight="bold">
                  DPJP
                </text>
                <text x="180" y="166" textAnchor="middle" fill={isLightMode ? '#0f172a' : '#FFFFFF'} fontSize="10" fontWeight="bold">
                  dr. Hendra, Sp.KFR
                </text>
                <text x="180" y="178" textAnchor="middle" fill={isLightMode ? '#9f1239' : '#FDA4AF'} fontSize="8" fontWeight="bold">
                  SIP Tidak Aktif
                </text>
              </g>

              {/* 2. BAKSOS EVENT NODE (Bottom Left) */}
              <g 
                className="cursor-pointer"
                onClick={() => setSelectedNode('baksos-event')}
              >
                <circle 
                  cx="180" cy="320" r="32" 
                  fill={isLightMode ? '#f0f9ff' : '#081A36'} 
                  stroke={isLightMode ? '#0284c7' : '#38BDF8'} 
                  strokeWidth={selectedNode === 'baksos-event' ? '4' : '2'}
                  filter="url(#glow-cyan)"
                />
                <text x="180" y="318" textAnchor="middle" fill={isLightMode ? '#0284c7' : '#38BDF8'} fontSize="16">
                  🩸
                </text>
                <text x="180" y="332" textAnchor="middle" fill={isLightMode ? '#0284c7' : '#7DD3FC'} fontSize="8" fontWeight="bold">
                  EVENT
                </text>
                <text x="180" y="366" textAnchor="middle" fill={isLightMode ? '#0f172a' : '#FFFFFF'} fontSize="10" fontWeight="bold">
                  Baksos Donor Darah
                </text>
                <text x="180" y="378" textAnchor="middle" fill={isLightMode ? '#475569' : '#7DD3FC'} fontSize="8">
                  12 Okt 2026
                </text>
              </g>

              {/* 3. INA-CBG PROCEDURE NODE (Top Right) */}
              <g 
                className="cursor-pointer"
                onClick={() => setSelectedNode('inacbg-code')}
              >
                <circle 
                  cx="580" cy="120" r="32" 
                  fill={isLightMode ? '#fefce8' : '#241B08'} 
                  stroke={isLightMode ? '#d97706' : '#FFCA40'} 
                  strokeWidth={selectedNode === 'inacbg-code' ? '4' : '2'}
                />
                <text x="580" y="118" textAnchor="middle" fill={isLightMode ? '#d97706' : '#FFCA40'} fontSize="16">
                  📑
                </text>
                <text x="580" y="132" textAnchor="middle" fill={isLightMode ? '#92400e' : '#FFE082'} fontSize="8" fontWeight="bold">
                  Z-3-12-0
                </text>
                <text x="580" y="166" textAnchor="middle" fill={isLightMode ? '#0f172a' : '#FFFFFF'} fontSize="10" fontWeight="bold">
                  INA-CBG Z-3-12-0
                </text>
                <text x="580" y="178" textAnchor="middle" fill={isLightMode ? '#92400e' : '#FFE082'} fontSize="8">
                  Fisioterapi Massal
                </text>
              </g>

              {/* 4. KHALAF PATIENT NODE (Bottom Right - Live Sync) */}
              <g 
                className="cursor-pointer"
                onClick={() => setSelectedNode('khalaf-patient')}
              >
                <circle 
                  cx="580" cy="320" r="32" 
                  fill={isKhalafDenied ? (isLightMode ? '#fff1f2' : '#240C16') : (isLightMode ? '#f0fdf4' : '#092419')} 
                  stroke={isKhalafDenied ? (isLightMode ? '#e11d48' : '#F43F5E') : (isLightMode ? '#059669' : '#10B981')} 
                  strokeWidth={selectedNode === 'khalaf-patient' ? '4' : '2'}
                  filter={isKhalafDenied ? 'url(#glow-red)' : ''}
                />
                <text x="580" y="318" textAnchor="middle" fill={isKhalafDenied ? (isLightMode ? '#e11d48' : '#FDA4AF') : (isLightMode ? '#059669' : '#6EE7B7')} fontSize="16">
                  📱
                </text>
                <text x="580" y="332" textAnchor="middle" fill={isKhalafDenied ? (isLightMode ? '#9f1239' : '#F43F5E') : (isLightMode ? '#065f46' : '#10B981')} fontSize="8" fontWeight="bold">
                  MOBILE JKN
                </text>
                <text x="580" y="366" textAnchor="middle" fill={isLightMode ? '#0f172a' : '#FFFFFF'} fontSize="10" fontWeight="bold">
                  Khalaf Faith P.
                </text>
                <text x="580" y="378" textAnchor="middle" fill={isKhalafDenied ? (isLightMode ? '#9f1239' : '#FDA4AF') : (isLightMode ? '#065f46' : '#6EE7B7')} fontSize="8" fontWeight="bold">
                  {isKhalafDenied ? '❌ Menyangkal Hadir' : '✅ Mengonfirmasi Hadir'}
                </text>
              </g>

              {/* 5. CENTER HOSPITAL NODE (EPICENTER) */}
              <g 
                className="cursor-pointer"
                onClick={() => setSelectedNode('mitra-husada')}
              >
                <circle 
                  cx="380" cy="220" r="48" 
                  fill={isLightMode ? '#eff6ff' : '#00153A'} 
                  stroke={isLightMode ? '#4f46e5' : '#818CF8'} 
                  strokeWidth={selectedNode === 'mitra-husada' ? '5' : '3'}
                  filter="url(#glow-purple)"
                />
                <text x="380" y="215" textAnchor="middle" fill={isLightMode ? '#4338ca' : '#A5B4FC'} fontSize="22">
                  🏥
                </text>
                <text x="380" y="235" textAnchor="middle" fill={isLightMode ? '#4338ca' : '#818CF8'} fontSize="9" fontWeight="bold" letterSpacing="1">
                  RS KHUSUS
                </text>
                <text x="380" y="282" textAnchor="middle" fill={isLightMode ? '#0f172a' : '#FFFFFF'} fontSize="11" fontWeight="bold">
                  RS Khusus Mitra Husada
                </text>
                <text x="380" y="295" textAnchor="middle" fill={isLightMode ? '#475569' : '#94A3B8'} fontSize="9">
                  85 Klaim (Rp 15.300.000)
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* FORENSIC TELEMETRY DRAWER (4 COLS) */}
        <div className="lg:col-span-4 space-y-3 flex flex-col justify-between">
          
          {/* ANOMALY SYNTHESIS INSIGHT CARD */}
          <div className="bg-white dark:bg-[#00153A]/85 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-sm dark:shadow-xl dark:shadow-[#00081c]/40">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Analisis Topologi Graf</span>
            </div>
            
            <p className="text-[11px] text-slate-700 dark:text-white/80 leading-relaxed font-medium">
              <strong className="text-slate-900 dark:text-white font-bold">Anomali Klaster Bipartit Terdeteksi:</strong> Sebanyak 85 data identitas peserta dari satu kegiatan baksos ditagihkan serentak untuk layanan spesialisasi fisioterapi menggunakan identitas dokter yang telah mutasi.
            </p>

            <div className="bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-[10.5px] font-mono space-y-1">
              <div className="flex justify-between text-slate-700 dark:text-white/70">
                <span className="font-semibold">Topologi:</span>
                <span className="text-slate-900 dark:text-white font-bold">1:1:1:85 Star Topology</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-white/70">
                <span className="font-semibold">Modus:</span>
                <span className="font-bold text-slate-900 dark:text-white">Phantom + Repeat Billing</span>
              </div>
            </div>
          </div>

          {/* ACTIVE NODE INSPECTOR CARD WITH MOTION */}
          <div className="bg-white dark:bg-[#00153A]/85 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm dark:shadow-xl dark:shadow-[#00081c]/40 flex-1 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNodeData.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-white/50">
                    Rincian Simpul Terpilih
                  </span>
                  <span className="text-[10px] font-mono text-emerald-900 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300 dark:text-cyan-300 dark:bg-white/5 dark:border-white/10 font-bold">{activeNodeData.id}</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{activeNodeData.title}</h3>
                    <p className="text-[10px] text-slate-600 dark:text-white/50 font-medium">{activeNodeData.subtitle}</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-xl border border-slate-200 dark:border-white/10 space-y-1 text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-white/60 font-medium">Kategori:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{activeNodeData.category}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-white/60 font-medium">Status Risiko:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{activeNodeData.risk}</span>
                    </div>
                  </div>

                  <p className="text-[10.5px] text-slate-800 dark:text-white/70 leading-relaxed bg-slate-50 dark:bg-white/5 p-2 rounded-xl border border-slate-200 dark:border-white/10 font-normal">
                    {activeNodeData.details}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="pt-2">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenDecision}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-900/20 cursor-pointer"
              >
                <span>Buka Konsol Keputusan Kasus Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>

        </div>

      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between bg-white dark:bg-[#00153A]/90 backdrop-blur-xl p-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-2xl">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onBackToInvestigation}
          className="text-xs font-semibold text-slate-800 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200 dark:text-white/70 dark:hover:text-white dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer"
        >
          <span>← Kembali ke Matriks Investigasi</span>
        </motion.button>

        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenDecision}
          className="text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white flex items-center space-x-2 transition shadow-md shadow-emerald-900/20 cursor-pointer"
        >
          <span>Lanjutkan ke Keputusan Verifikator</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  );
}
