import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  MarkerType,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  GitBranch, ZoomIn, ZoomOut, RotateCcw, Filter, 
  Download, Hospital, Stethoscope, User, Calendar, 
  Activity, AlertTriangle, CheckCircle2, XCircle, 
  Info, ArrowRight, Eye, ShieldAlert, Lock, Sparkles, Database,
  Layers, Compass, ShieldCheck, Check
} from 'lucide-react';

// =========================================================================
// CUSTOM XYFLOW HIGH-DEFINITION ENTITY CARD COMPONENTS
// =========================================================================

const CustomHospitalCard = ({ data, selected }) => (
  <div className={`w-[270px] rounded-2xl p-4 border transition-all duration-200 select-none ${
    data.isLight 
      ? 'bg-white border-indigo-300 shadow-xl text-slate-900' 
      : 'bg-[#00153A] border-indigo-500/60 shadow-2xl shadow-indigo-950/70 text-white'
  } ${selected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900' : ''}`}>
    <Handle type="target" position={Position.Left} id="target-left" className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white" />
    <Handle type="target" position={Position.Top} id="target-top" className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white" />
    <div className="flex items-center justify-between pb-2.5 border-b border-indigo-500/20">
      <div className="flex items-center space-x-2.5">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shadow-inner">
          <Hospital className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div>
          <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-300">EPISENTRUM KLAIM</span>
          <h4 className="text-xs font-bold leading-tight truncate">{data.title}</h4>
        </div>
      </div>
      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">FKRTL</span>
    </div>
    
    <div className="mt-2.5 space-y-1.5 text-[11px]">
      <div className="flex justify-between text-slate-600 dark:text-white/70">
        <span className="font-medium">Total Pengajuan:</span>
        <strong className="text-slate-900 dark:text-white font-bold">{data.claimsCount} Klaim Serentak</strong>
      </div>
      <div className="flex justify-between text-slate-600 dark:text-white/70">
        <span className="font-medium">Nominal Tagihan:</span>
        <strong className="text-amber-600 dark:text-amber-400 font-bold font-mono">{data.totalTariff}</strong>
      </div>
    </div>

    <div className="mt-3 pt-2 border-t border-indigo-500/15 flex items-center justify-between">
      <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        Audit Pra-Bayar Aktif
      </span>
      <span className="text-[9.5px] text-slate-400 dark:text-white/40 font-mono">ID: 0132R001</span>
    </div>
    <Handle type="source" position={Position.Right} id="source-right" className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white" />
    <Handle type="source" position={Position.Bottom} id="source-bottom" className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white" />
  </div>
);

const CustomDpjpCard = ({ data, selected }) => (
  <div className={`w-[250px] rounded-2xl p-3.5 border transition-all duration-200 select-none ${
    data.isLight 
      ? 'bg-white border-rose-300 shadow-xl text-slate-900' 
      : 'bg-[#180812] border-rose-500/60 shadow-2xl shadow-rose-950/70 text-white'
  } ${selected ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-slate-900' : ''}`}>
    <div className="flex items-center space-x-2.5">
      <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold shrink-0">
        <Stethoscope className="w-5 h-5 text-rose-500" />
      </div>
      <div className="min-w-0">
        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-500 dark:text-rose-300">DPJP TERTERA</span>
        <h4 className="text-xs font-bold leading-tight truncate">{data.title}</h4>
      </div>
    </div>
    
    <div className="mt-2.5 bg-rose-500/10 dark:bg-rose-500/15 p-2 rounded-xl border border-rose-500/30 text-[10.5px] space-y-1">
      <div className="text-rose-600 dark:text-rose-300 font-bold flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>SIP NON-AKTIF (SDMK)</span>
      </div>
      <p className="text-[10px] text-slate-600 dark:text-white/70 leading-snug">
        Beban 85 Pasien / Hari · Melebihi Batas Fisik Standar Kemenkes
      </p>
    </div>
    <Handle type="source" position={Position.Right} id="source-right" className="!w-3 !h-3 !bg-rose-500 !border-2 !border-white" />
  </div>
);

const CustomEventCard = ({ data, selected }) => (
  <div className={`w-[250px] rounded-2xl p-3.5 border transition-all duration-200 select-none ${
    data.isLight 
      ? 'bg-white border-sky-300 shadow-xl text-slate-900' 
      : 'bg-[#06162a] border-sky-500/60 shadow-2xl shadow-sky-950/70 text-white'
  } ${selected ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-slate-900' : ''}`}>
    <div className="flex items-center space-x-2.5">
      <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
        <Calendar className="w-5 h-5 text-sky-500" />
      </div>
      <div className="min-w-0">
        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-sky-500 dark:text-sky-300">SUMBER IDENTITAS</span>
        <h4 className="text-xs font-bold leading-tight truncate">{data.title}</h4>
      </div>
    </div>

    <div className="mt-2.5 bg-sky-500/10 dark:bg-sky-500/15 p-2 rounded-xl border border-sky-500/30 text-[10.5px] space-y-1">
      <div className="text-sky-600 dark:text-sky-300 font-bold flex items-center gap-1">
        <Activity className="w-3.5 h-3.5 shrink-0" />
        <span>12 OKT 2026 (48 JAM SEBELUMNYA)</span>
      </div>
      <p className="text-[10px] text-slate-600 dark:text-white/70 leading-snug">
        Pemanenan NIK Massal KIS Peserta Tanpa Rujukan FKTP
      </p>
    </div>
    <Handle type="source" position={Position.Right} id="source-right" className="!w-3 !h-3 !bg-sky-500 !border-2 !border-white" />
  </div>
);

const CustomProcedureCard = ({ data, selected }) => (
  <div className={`w-[250px] rounded-2xl p-3.5 border transition-all duration-200 select-none ${
    data.isLight 
      ? 'bg-white border-amber-300 shadow-xl text-slate-900' 
      : 'bg-[#1e1507] border-amber-500/60 shadow-2xl shadow-amber-950/70 text-white'
  } ${selected ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-900' : ''}`}>
    <Handle type="target" position={Position.Left} id="target-left" className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white" />
    <div className="flex items-center space-x-2.5">
      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
        <Database className="w-5 h-5 text-amber-500" />
      </div>
      <div className="min-w-0">
        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-500 dark:text-amber-300">INA-CBG PROSEDUR</span>
        <h4 className="text-xs font-bold leading-tight truncate">{data.title}</h4>
      </div>
    </div>

    <div className="mt-2.5 bg-amber-500/10 dark:bg-amber-500/15 p-2 rounded-xl border border-amber-500/30 text-[10.5px] space-y-1">
      <div className="text-amber-600 dark:text-amber-300 font-bold font-mono">
        Rp 180.000 / Pasien (85 Klaim)
      </div>
      <p className="text-[10px] text-slate-600 dark:text-white/70 leading-snug">
        Fisioterapi Massal · Pelanggaran PNPK &amp; Fornas
      </p>
    </div>
  </div>
);

const CustomPatientCard = ({ data, selected }) => (
  <div className={`w-[250px] rounded-2xl p-3.5 border transition-all duration-200 select-none ${
    data.isLight 
      ? 'bg-white border-rose-300 shadow-xl text-slate-900' 
      : 'bg-[#180812] border-rose-500/60 shadow-2xl shadow-rose-950/70 text-white'
  } ${selected ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-slate-900' : ''}`}>
    <Handle type="target" position={Position.Left} id="target-left" className="!w-3 !h-3 !bg-rose-500 !border-2 !border-white" />
    <div className="flex items-center space-x-2.5">
      <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold shrink-0">
        <User className="w-5 h-5 text-rose-500" />
      </div>
      <div className="min-w-0">
        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-500 dark:text-rose-300">PESERTA MOBILE JKN</span>
        <h4 className="text-xs font-bold leading-tight truncate">{data.title}</h4>
      </div>
    </div>

    <div className="mt-2.5 bg-rose-500/10 dark:bg-rose-500/15 p-2 rounded-xl border border-rose-500/30 text-[10.5px] space-y-1">
      <div className="text-rose-600 dark:text-rose-300 font-bold flex items-center gap-1.5">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>SANGKALAN FAKTUAL</span>
      </div>
      <p className="text-[10px] text-slate-600 dark:text-white/70 leading-snug">
        Menyangkal Hadir Layanan Medis · Radius GPS &gt; 15 KM
      </p>
    </div>
  </div>
);

// Custom internal flow component that uses useReactFlow hooks
function FlowCanvasWrapper({ 
  nodes, 
  edges, 
  nodeTypes, 
  isLightMode, 
  onNodeClick 
}) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.25, duration: 400 });
    }, 150);
    return () => clearTimeout(timer);
  }, [fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      colorMode={isLightMode ? 'light' : 'dark'}
      minZoom={0.4}
      maxZoom={1.8}
    >
      <Background 
        variant="dots" 
        gap={22} 
        size={1.5} 
        color={isLightMode ? '#CBD5E1' : '#38BDF8'} 
      />
      <Controls 
        showInteractive={false}
        className="!bg-white dark:!bg-[#00153A] !border !border-slate-200 dark:!border-white/10 !rounded-xl !shadow-lg !bottom-4 !left-4" 
      />
    </ReactFlow>
  );
}

export default function GraphVisualizer({ 
  caseData,
  patientResponse = null,
  onOpenDecision,
  onBackToInvestigation,
  isLight = false
}) {
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

  // Nodes definition for drawer and metadata
  const nodes = useMemo(() => ({
    'mitra-husada': {
      id: 'mitra-husada',
      type: 'hospital',
      title: 'RS Khusus Mitra Husada',
      subtitle: 'FKRTL (RS Khusus Kelas C) · Kode: 0132R001',
      category: 'Fasilitas Kesehatan Penagih',
      risk: 'AUDIT PRA-BAYAR (Pusat Anomali)',
      details: 'Fasilitas kesehatan yang menagihkan 85 klaim paket fisioterapi INA-CBG Z-3-12-0 serentak pasca baksos dalam 48 jam.',
      color: '#6366F1',
      tariff: 'Rp 15.300.000 (85 Klaim)',
      sdmkStatus: 'Pusat Faskes Teridentifikasi',
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
      tariff: 'Spesialis Kedokteran Fisik & Rehabilitasi',
      sdmkStatus: 'Kredensial Non-Aktif (SDMK Kemenkes)',
    },
    'baksos-event': {
      id: 'baksos-event',
      type: 'event',
      title: 'Kegiatan Baksos Donor Darah',
      subtitle: 'Batch: BAKSOS_MASSAL_OKT26 · 12 Okt 2026',
      category: 'Sumber Pengumpulan Data Peserta',
      risk: 'PENGUMPULAN IDENTITAS (Harvesting)',
      details: 'Kegiatan bakti sosial donor darah tempat identitas KIS 85 peserta dikumpulkan tanpa indikasi rujukan rawat jalan spesialis.',
      color: '#0284C7',
      tariff: '85 Data Peserta Terpapar',
      sdmkStatus: 'Identitas KIS Dikumpulkan Tanpa Surat Rujukan',
    },
    'inacbg-code': {
      id: 'inacbg-code',
      type: 'procedure',
      title: 'INA-CBG: Z-3-12-0',
      subtitle: 'Prosedur Fisioterapi / Rehab Medis Massal',
      category: 'Tarif Paket Klaim JKN',
      risk: 'ANOMALI FREKUENSI (Repeat Billing)',
      details: 'Tarif Rp 180.000 / klaim. Total tagihan Rp 15.300.000 untuk 85 peserta tanpa riwayat rujukan sah dari FKTP.',
      color: '#D97706',
      tariff: 'Rp 180.000 / Episode Klaim',
      sdmkStatus: 'Restriksi Fornas & PNPK Terlanggar',
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
      color: isKhalafDenied ? '#E11D48' : '#10B981',
      tariff: 'Klaim Fiktif Diblokir (Hold BAKB)',
      sdmkStatus: 'Telemetri GPS: Radius > 15 KM dari Faskes',
    }
  }), [isKhalafDenied]);

  // Node types registry for ReactFlow
  const nodeTypes = useMemo(() => ({
    hospitalNode: CustomHospitalCard,
    dpjpNode: CustomDpjpCard,
    eventNode: CustomEventCard,
    procedureNode: CustomProcedureCard,
    patientNode: CustomPatientCard,
  }), []);

  // Flow Nodes with deliberate layout positioning
  const flowNodes = useMemo(() => [
    {
      id: 'mitra-husada',
      type: 'hospitalNode',
      position: { x: 380, y: 150 },
      data: {
        title: 'RS Khusus Mitra Husada',
        claimsCount: 85,
        totalTariff: 'Rp 15.300.000',
        isLight: isLightMode
      },
      selected: selectedNode === 'mitra-husada'
    },
    {
      id: 'dr-hendra',
      type: 'dpjpNode',
      position: { x: 40, y: 40 },
      data: {
        title: 'dr. Hendra, Sp.KFR',
        isLight: isLightMode
      },
      selected: selectedNode === 'dr-hendra'
    },
    {
      id: 'baksos-event',
      type: 'eventNode',
      position: { x: 40, y: 270 },
      data: {
        title: 'Baksos Donor Darah',
        isLight: isLightMode
      },
      selected: selectedNode === 'baksos-event'
    },
    {
      id: 'inacbg-code',
      type: 'procedureNode',
      position: { x: 730, y: 40 },
      data: {
        title: 'INA-CBG: Z-3-12-0',
        isLight: isLightMode
      },
      selected: selectedNode === 'inacbg-code'
    },
    {
      id: 'khalaf-patient',
      type: 'patientNode',
      position: { x: 730, y: 270 },
      data: {
        title: 'Khalaf Faith Pradyatama',
        isLight: isLightMode
      },
      selected: selectedNode === 'khalaf-patient'
    }
  ], [isLightMode, selectedNode]);

  // Flow Edges with animated flows & labels
  const flowEdges = useMemo(() => [
    {
      id: 'e-dpjp-hospital',
      source: 'dr-hendra',
      target: 'mitra-husada',
      sourceHandle: 'source-right',
      targetHandle: 'target-top',
      animated: true,
      label: 'SIP Non-Aktif (SDMK)',
      labelStyle: { fill: '#F43F5E', fontWeight: 700, fontSize: 11 },
      labelBgStyle: { fill: isLightMode ? '#ffffff' : '#180812', fillOpacity: 0.9, rx: 6, ry: 6 },
      labelBgPadding: [6, 3],
      style: { stroke: '#F43F5E', strokeWidth: 2.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#F43F5E', width: 18, height: 18 }
    },
    {
      id: 'e-event-hospital',
      source: 'baksos-event',
      target: 'mitra-husada',
      sourceHandle: 'source-right',
      targetHandle: 'target-left',
      animated: true,
      label: 'Klaster Baksos 48 Jam',
      labelStyle: { fill: '#0284C7', fontWeight: 700, fontSize: 11 },
      labelBgStyle: { fill: isLightMode ? '#ffffff' : '#06162a', fillOpacity: 0.9, rx: 6, ry: 6 },
      labelBgPadding: [6, 3],
      style: { stroke: '#0284C7', strokeWidth: 2.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#0284C7', width: 18, height: 18 }
    },
    {
      id: 'e-hospital-procedure',
      source: 'mitra-husada',
      target: 'inacbg-code',
      sourceHandle: 'source-right',
      targetHandle: 'target-left',
      animated: true,
      label: 'Tagihan Rp 15,3 Jt',
      labelStyle: { fill: '#D97706', fontWeight: 700, fontSize: 11 },
      labelBgStyle: { fill: isLightMode ? '#ffffff' : '#1e1507', fillOpacity: 0.9, rx: 6, ry: 6 },
      labelBgPadding: [6, 3],
      style: { stroke: '#D97706', strokeWidth: 2.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#D97706', width: 18, height: 18 }
    },
    {
      id: 'e-hospital-patient',
      source: 'mitra-husada',
      target: 'khalaf-patient',
      sourceHandle: 'source-bottom',
      targetHandle: 'target-left',
      animated: true,
      label: isKhalafDenied ? 'SANGKALAN FAKTUAL' : 'Hadir Terverifikasi',
      labelStyle: { fill: isKhalafDenied ? '#E11D48' : '#10B981', fontWeight: 700, fontSize: 11 },
      labelBgStyle: { fill: isLightMode ? '#ffffff' : '#180812', fillOpacity: 0.9, rx: 6, ry: 6 },
      labelBgPadding: [6, 3],
      style: { stroke: isKhalafDenied ? '#E11D48' : '#10B981', strokeWidth: 2.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: isKhalafDenied ? '#E11D48' : '#10B981', width: 18, height: 18 }
    }
  ], [isKhalafDenied, isLightMode]);

  const handleExportGraph = () => {
    const graphData = {
      graphMeta: {
        id: "SYNDICATE-MITRA-HUSADA-OKT26",
        generatedAt: new Date().toISOString(),
        totalNodes: Object.keys(nodes).length,
        totalEdges: 4,
        engine: "XYFlow Entity Cards",
        fraudClassification: "Phantom Billing & Repeat Billing"
      },
      nodes: Object.values(nodes),
      edges: [
        { source: "dr-hendra", target: "mitra-husada", relation: "SIP KEDALUWARSA (SDMK)" },
        { source: "baksos-event", target: "mitra-husada", relation: "HARVESTING NIK (85 Klaim)" },
        { source: "khalaf-patient", target: "mitra-husada", relation: "SANGKALAN PRESENSI (Mobile JKN)" },
        { source: "inacbg-code", target: "mitra-husada", relation: "TAGIHAN INA-CBG Z-3-12-0" }
      ]
    };

    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claimtrace_syndicate_graph_${Date.now()}.json`;
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
      // Fallback
    }

    const cypherScript = `// CLAIMTRACE NEO4J CYPHER FRAUD KNOWLEDGE GRAPH
// BPJS Kesehatan Tingkat Nasional
CREATE CONSTRAINT IF NOT EXISTS FOR (c:Claim) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (f:Faskes) REQUIRE f.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (d:DPJP) REQUIRE d.id IS UNIQUE;

MERGE (f:Faskes {id: '0132R001', name: 'RS Khusus Mitra Husada', kelas: 'C', kota: 'Kota Serang'})
MERGE (d:DPJP {id: 'DPJP-HENDRA-KFR', name: 'dr. Hendra, Sp.KFR', sip: '446.1/108/DPJP/2023', sdmk_valid: false})
MERGE (e:Event {id: 'BAKSOS_MASSAL_OKT26', title: 'Baksos Donor Darah', tanggal: '2026-10-12'})
MERGE (cbg:InaCbg {code: 'Z-3-12-0', deskripsi: 'Prosedur Fisioterapi Massal', tarif: 180000})
MERGE (p:Peserta {id: 'PST-77218902', name: 'Khalaf Faith Pradyatama', mobile_jkn_denied: true})

MERGE (d)-[:PRACTICES_AT {status: 'SIP_EXPIRED_SDMK', patient_load: 85}]->(f)
MERGE (e)-[:HARVESTED_IDENTITY {count_claims: 85, timeframe_hours: 48}]->(f)
MERGE (p)-[:DENIED_SERVICE_ATTENDANCE {lapis: 3, timestamp: '2026-10-14T09:30:00Z'}]->(f)
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

  const activeNodeData = nodes[selectedNode] || nodes['mitra-husada'];

  return (
    <div className="space-y-4 font-inter text-slate-800 dark:text-white pb-20">
      {/* TOP HEADER STRIP - CONTROLS */}
      <div className="w-full bg-white dark:bg-[#00153A]/85 backdrop-blur-xl px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 shadow-sm dark:shadow-2xl dark:shadow-[#00081c]/50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center font-bold shadow-xs">
            <GitBranch className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                Topologi Graf Relasi Sindikat Klaim #CLM-2026-085
              </span>
              <span className="bg-indigo-50 text-indigo-800 border border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shadow-xs inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                XYFLOW KARTU ENTITAS
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-800 border border-slate-300 dark:bg-white/5 dark:text-[#FFCA40] dark:border-white/10 font-mono font-bold px-2 py-0.5 rounded">
                MITRE F3: FA0001 Syndicate · ATT&amp;CK: T1078
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-white/60 font-medium">
              Matriks Hubungan Bipartit: Faskes ↔ DPJP ↔ Kegiatan Baksos ↔ Peserta · Validasi Forensik 3 Lapis BPJS Kesehatan.
            </p>
          </div>
        </div>

        {/* QUICK FILTERS & EXPORT BUTTONS */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          
          {/* Quick Node Filter Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 font-semibold">
            <button
              type="button"
              onClick={() => { setFilterMode('all'); setSelectedNode('mitra-husada'); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua Simpul
            </button>
            <button
              type="button"
              onClick={() => { setFilterMode('dpjp'); setSelectedNode('dr-hendra'); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                filterMode === 'dpjp'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>DPJP Bermasalah</span>
            </button>
            <button
              type="button"
              onClick={() => { setFilterMode('denials'); setSelectedNode('khalaf-patient'); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                filterMode === 'denials'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Sangkalan Mobile JKN (8)</span>
            </button>
          </div>

          {/* Export Buttons */}
          <button
            type="button"
            onClick={handleExportGraph}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border-white/15 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700 dark:text-cyan-400" />
            <span>Ekspor JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportCypher}
            className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
            <span>Ekspor Cypher</span>
          </button>
        </div>
      </div>

      {/* GRAPH CANVAS & FORENSIC DRAWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* XYFLOW VIEWPORT CONTAINER (8 COLS) */}
        <div className="lg:col-span-8 bg-slate-50 dark:bg-gradient-to-b dark:from-[#000c24] dark:via-[#00112e] dark:to-[#001D58] border border-slate-200 dark:border-white/10 rounded-2xl relative overflow-hidden shadow-sm dark:shadow-2xl min-h-[460px] h-[480px] xl:h-[510px]">
          
          {/* Spatial Telemetry HUD (Top-Left) */}
          <div className="absolute top-3 left-3 bg-white/95 dark:bg-[#000c24]/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 text-[11px] font-mono space-y-1 z-20 shadow-md dark:shadow-xl pointer-events-none">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              <span>STATUS RELASI SINDIKAT</span>
            </div>
            <div className="text-slate-700 dark:text-white/60 space-y-0.5 text-[10px]">
              <div>KLASTER: <strong className="text-slate-900 dark:text-white font-bold">BAKSOS-085 (SERANG)</strong></div>
              <div>SIMPUL ENTITAS: <strong className="text-indigo-600 dark:text-cyan-300 font-bold">5 UTAMA</strong> · POLA RELASI: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">TERAUTENTIKASI</strong></div>
            </div>
          </div>

          {/* XYFLOW INTERACTIVE GRAPH CANVAS */}
          <div className="w-full h-full">
            <ReactFlowProvider>
              <FlowCanvasWrapper
                nodes={flowNodes}
                edges={flowEdges}
                nodeTypes={nodeTypes}
                isLightMode={isLightMode}
                onNodeClick={(_, node) => {
                  if (nodes[node.id]) setSelectedNode(node.id);
                }}
              />
            </ReactFlowProvider>
          </div>
        </div>

        {/* FORENSIC TELEMETRY DRAWER (4 COLS) */}
        <div className="lg:col-span-4 space-y-3 flex flex-col justify-between">
          
          {/* ANOMALY SYNTHESIS CARD */}
          <div className="bg-white dark:bg-[#00153A]/85 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-sm dark:shadow-xl dark:shadow-[#00081c]/40">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Analisis Topologi Graf</span>
            </div>
            
            <p className="text-[11px] text-slate-700 dark:text-white/80 leading-relaxed font-medium">
              <strong className="text-slate-900 dark:text-white font-bold">Anomali Klaster Bipartit Terverifikasi:</strong> Sebanyak 85 identitas KIS peserta dari satu kegiatan baksos donor darah ditagihkan serentak untuk fisioterapi spesialis menggunakan SIP dokter kedaluwarsa.
            </p>

            <div className="bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-[10.5px] font-mono space-y-1">
              <div className="flex justify-between text-slate-700 dark:text-white/70">
                <span className="font-semibold">Topologi Graf:</span>
                <span className="text-indigo-600 dark:text-cyan-300 font-bold">1:1:1:85 Star Network</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-white/70">
                <span className="font-semibold">Klasifikasi Modus:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">Phantom + Repeat Billing</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-white/70">
                <span className="font-semibold">Mesin Visualisasi:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">XYFlow Entity Cards</span>
              </div>
            </div>
          </div>

          {/* ACTIVE NODE INSPECTOR CARD */}
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
                  <span className="text-[10px] font-mono text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-300 dark:text-cyan-300 dark:bg-white/5 dark:border-white/10 font-bold">
                    {activeNodeData.id}
                  </span>
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
                      <span className="font-bold text-rose-600 dark:text-rose-400">{activeNodeData.risk}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-white/60 font-medium">Kredensial / SDMK:</span>
                      <span className="font-bold text-slate-800 dark:text-white/80">{activeNodeData.sdmkStatus}</span>
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
