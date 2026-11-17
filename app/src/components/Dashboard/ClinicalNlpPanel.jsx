import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { API_BASE_URL, authFetch, cachedAuthGetJson } from '../../services/apiConfig';
import {
  Brain,
  Sparkles,
  Cpu,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Layers,
  Activity,
  Send,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronRight,
  Info,
  Scale,
  TrendingUp,
} from 'lucide-react';

const CATEGORY_COLORS = {
  DIAGNOSIS: {
    bgLight: 'bg-cyan-100/80 text-cyan-900 border-cyan-300',
    bgDark: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40',
    pill: 'bg-cyan-500',
    label: 'Diagnosa Medis (ICD-10)',
  },
  PROCEDURE: {
    bgLight: 'bg-indigo-100/80 text-indigo-900 border-indigo-300',
    bgDark: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40',
    pill: 'bg-indigo-500',
    label: 'Prosedur & Intervensi (ICD-9)',
  },
  MEDICATION: {
    bgLight: 'bg-emerald-100/80 text-emerald-900 border-emerald-300',
    bgDark: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
    pill: 'bg-emerald-500',
    label: 'Farmakoterapi / Obat',
  },
  LAB_AND_FINDING: {
    bgLight: 'bg-amber-100/80 text-amber-900 border-amber-300',
    bgDark: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
    pill: 'bg-amber-500',
    label: 'Lab & Temuan Fisik Objektif',
  },
  ANATOMICAL_SITE: {
    bgLight: 'bg-sky-100/80 text-sky-900 border-sky-300',
    bgDark: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
    pill: 'bg-sky-500',
    label: 'Regio Anatomi',
  },
  NEGATION: {
    bgLight: 'bg-rose-100/90 text-rose-900 border-rose-300 line-through decoration-rose-600',
    bgDark: 'bg-rose-500/25 text-rose-200 border-rose-500/50 line-through decoration-rose-400',
    pill: 'bg-rose-500',
    label: 'Penyangkalan (NegEx)',
  },
};

const PRESET_SANDBOX_NOTES = [
  {
    title: 'Fisioterapi Kloning (LBP M54.5)',
    icd10: 'M54.5',
    cbg: 'Z-3-12-0',
    proc: '93.39',
    text: 'Pasien mengeluh nyeri punggung bawah (Low Back Pain) menjalar ke paha posterior dextra sejak 2 minggu. Pemeriksaan fisik: Lasegue (+), Patrick (-), Kontraktur otot paravertebral L4-L5 (+), refleks fisiologis normal. Tindakan: Fisioterapi komprehensif, Short Wave Diathermy (SWD) dan Lumbar Traction 93.39 serial 5 sesi. Tidak ada riwayat trauma pelvis. Terapi: Eperisone 50mg 3x1 dan Meloxicam 15mg.',
  },
  {
    title: 'Dugaan Upcoding Sepsis Berat (P-8-09)',
    icd10: 'P-8-09',
    cbg: 'I-4-10-III',
    proc: '',
    text: 'Bayi usia 10 hari dirawat dengan febris subfebris dan batuk pilek ringan. Keadaan umum sedang, refleks hisap aktif baik. Pemeriksaan darah: Leukosit 11.200 (dalam batas normal usia neonatus), CRP normal. Kultur darah (-) steril tanpa pertumbuhan kuman. Pasien tidak syok, hemodinamik stabil tanpa inotropik. Diberikan ampicillin profilaksis.',
  },
  {
    title: 'Klaim Wajar Apendisitis Akut (K35.8)',
    icd10: 'K35.8',
    cbg: 'K-4-13-I',
    proc: '47.01',
    text: 'Pasien admisi darurat dengan nyeri perut kanan bawah akut memberat 12 jam, febris 38.3C, skor Alvarado 8. Pemeriksaan darah: leukosit 16.400 /uL, neutrofilia 84%. USG abdomen: gambaran target sign appendix diameter 8.5 mm non-compressible. Tindakan cito: Apendektomi laparoskopi 47.01. Terapi pasca bedah: Ceftriaxone 1g IV, Ketorolac 30mg IV, Metronidazole 500mg drip.',
  },
];

export default function ClinicalNlpPanel({
  claimId = 'CLM-2026-8801',
  currentCase = null,
  rawClaim = null,
  rawTriage = null,
  isLight = true,
}) {
  const [activeTab, setActiveTab] = useState('ner'); // 'ner' | 'alignment' | 'vector_ml' | 'sandbox'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState(null);

  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sandbox state
  const [sandboxText, setSandboxText] = useState(PRESET_SANDBOX_NOTES[0].text);
  const [sandboxIcd10, setSandboxIcd10] = useState(PRESET_SANDBOX_NOTES[0].icd10);
  const [sandboxCbg, setSandboxCbg] = useState(PRESET_SANDBOX_NOTES[0].cbg);
  const [sandboxProc, setSandboxProc] = useState(PRESET_SANDBOX_NOTES[0].proc);
  const [sandboxResult, setSandboxResult] = useState(null);
  const [sandboxBusy, setSandboxBusy] = useState(false);

  // Fetch claim audit
  const fetchClaimNlpAudit = React.useCallback(async (targetId) => {
    if (!targetId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await cachedAuthGetJson(`${API_BASE_URL}/api/v1/nlp/claim-audit/${targetId}`);
      if (data && data.status === 'success') {
        setAuditData(data);
      } else {
        throw new Error(data?.detail || 'Gagal memuat audit NLP');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Koneksi audit NLP offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaimNlpAudit(claimId);
  }, [claimId, fetchClaimNlpAudit]);

  // Handle Sandbox analysis
  const handleRunSandbox = async (e) => {
    if (e) e.preventDefault();
    setSandboxBusy(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/nlp/analyze-clinical-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sandboxText,
          billed_icd10: sandboxIcd10,
          billed_cbg: sandboxCbg,
          procedure_code: sandboxProc || null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setSandboxResult(json);
    } catch (err) {
      alert(`Gagal menganalisis sandbox: ${err.message}`);
    } finally {
      setSandboxBusy(false);
    }
  };

  const nlp = auditData?.nlp_analysis;
  const entities = nlp?.entities || [];
  const negations = nlp?.negations_detected || [];
  const alignment = nlp?.alignment_evaluation;
  const stylometry = nlp?.stylometric_metrics;
  const vectorSem = auditData?.vector_semantic_embedding;
  const mlInference = auditData?.machine_learning_inference;

  const filteredEntities = selectedCategory === 'ALL'
    ? entities
    : entities.filter((e) => e.category === selectedCategory);

  // Render text with interactive spans
  const renderAnnotatedResume = (text, entityList, negationList) => {
    if (!text) return <span className="opacity-60 italic">Tidak ada narasi rekam medis tersimpan.</span>;

    // Build segments with offset verification against actual narrative text
    const sortedTokens = [];
    const lowerText = text.toLowerCase();

    // Add entities
    entityList.forEach((ent) => {
      let start = Number(ent.start);
      let end = Number(ent.end);
      const needle = String(ent.text || '').trim();
      const sliceMatches =
        needle &&
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        start >= 0 &&
        end <= text.length &&
        text.slice(start, end).toLowerCase() === needle.toLowerCase();

      if (!sliceMatches && needle) {
        const foundAt = lowerText.indexOf(needle.toLowerCase());
        if (foundAt !== -1) {
          start = foundAt;
          end = foundAt + needle.length;
        } else {
          return;
        }
      }
      if (start >= 0 && end > start && end <= text.length) {
        sortedTokens.push({
          start,
          end,
          type: 'ENTITY',
          data: ent,
        });
      }
    });

    // Add negations
    negationList.forEach((neg) => {
      let start = Number(neg.start);
      const triggerLen = neg.trigger ? neg.trigger.length : 10;
      let end = start + triggerLen;
      if (neg.trigger && text.slice(start, end).toLowerCase() !== neg.trigger.toLowerCase()) {
        const foundAt = lowerText.indexOf(neg.trigger.toLowerCase());
        if (foundAt !== -1) {
          start = foundAt;
          end = foundAt + neg.trigger.length;
        } else {
          return;
        }
      }
      if (start >= 0 && end > start && end <= text.length) {
        sortedTokens.push({
          start,
          end,
          type: 'NEGATION',
          data: neg,
        });
      }
    });

    sortedTokens.sort((a, b) => a.start - b.start);

    // Merge non-overlapping
    const validTokens = [];
    let lastIdx = 0;
    sortedTokens.forEach((tok) => {
      if (tok.start >= lastIdx && tok.end <= text.length) {
        validTokens.push(tok);
        lastIdx = tok.end;
      }
    });

    const elements = [];
    let cursor = 0;

    validTokens.forEach((tok, i) => {
      if (tok.start > cursor) {
        elements.push(
          <span key={`text-${cursor}`}>{text.slice(cursor, tok.start)}</span>
        );
      }

      if (tok.type === 'NEGATION') {
        elements.push(
          <mark
            key={`neg-${i}`}
            className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border transition cursor-pointer mx-0.5 ${
              isLight ? CATEGORY_COLORS.NEGATION.bgLight : CATEGORY_COLORS.NEGATION.bgDark
            }`}
            title={`Penyangkalan (NegEx): ${tok.data.trigger}`}
          >
            {text.slice(tok.start, tok.end)}
          </mark>
        );
      } else {
        const ent = tok.data;
        const colorStyle = CATEGORY_COLORS[ent.category] || CATEGORY_COLORS.DIAGNOSIS;
        const isSelected = selectedEntity && selectedEntity.start === ent.start;

        elements.push(
          <button
            type="button"
            key={`ent-${i}`}
            onClick={() => setSelectedEntity(ent)}
            className={`inline-block px-1.5 py-0.2 rounded text-[11px] font-mono font-semibold border transition cursor-pointer mx-0.5 ${
              isLight ? colorStyle.bgLight : colorStyle.bgDark
            } ${isSelected ? 'ring-2 ring-emerald-500 scale-105 shadow-sm' : 'hover:opacity-80'}`}
          >
            {text.slice(tok.start, tok.end)}
            <span className="text-[9px] opacity-75 ml-1 font-sans uppercase">[{ent.code_hint || ent.category.slice(0, 4)}]</span>
          </button>
        );
      }

      cursor = tok.end;
    });

    if (cursor < text.length) {
      elements.push(<span key={`text-end`}>{text.slice(cursor)}</span>);
    }

    return elements;
  };

  return (
    <div
      className={`backdrop-blur-xl border rounded-2xl p-4 space-y-3.5 transition-all duration-300 ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm'
          : 'bg-[#00153A]/85 border-white/10 shadow-2xl shadow-[#00081c]/50'
      }`}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-cyan-900/20">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xs sm:text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Forensik NLP (Natural Language Processing) &amp; Machine Learning
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                Permenkes 26/2021 &amp; Anti-Fraud
              </span>
            </div>
            <p className={`text-[10.5px] ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
              Ekstraksi entitas klinis (NER), deteksi negasi (NegEx), keselarasan narasi koding CBG, dan estimasi risiko Isolation Forest.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchClaimNlpAudit(claimId)}
            disabled={loading}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
            }`}
            title="Muat ulang inferensi NLP & ML"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-[10.5px]">Refresh AI</span>
          </button>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
          {[
            { id: 'ner', label: '1. Telaah Narasi & NER Medis', icon: FileText, count: entities.length },
            { id: 'alignment', label: '2. Keselarasan & Kaidah Koding', icon: Scale, score: alignment ? `${alignment.alignment_score_pct}%` : null },
            { id: 'vector_ml', label: '3. Vektor Semantik & ML XAI', icon: Cpu, isWarning: vectorSem?.is_semantic_plagiarized },
            { id: 'sandbox', label: '4. Sandbox Uji Narasi Bebas', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
                  isActive
                    ? (isLight
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/30')
                    : (isLight
                        ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        : 'bg-white/5 text-white/75 border-white/10 hover:bg-white/10')
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-white/70'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.score && (
                  <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {tab.score}
                  </span>
                )}
                {tab.isWarning && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Indikasi Kloning / Duplikasi" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: NER & CLINICAL TEXT ANNOTATION */}
      {activeTab === 'ner' && (
        <div className="space-y-3">
          {/* Entity Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
            <span className={`font-semibold mr-1 flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              <Filter className="w-3 h-3" /> Filter Entitas:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2 py-0.5 rounded-lg border font-semibold transition cursor-pointer ${
                selectedCategory === 'ALL'
                  ? (isLight ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-900 border-white')
                  : (isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-white/60 border-white/10')
              }`}
            >
              Semua ({entities.length})
            </button>
            {Object.keys(CATEGORY_COLORS).map((cat) => {
              const count = cat === 'NEGATION'
                ? negations.length
                : entities.filter((e) => e.category === cat).length;
              if (count === 0 && cat !== 'NEGATION') return null;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded-lg border font-semibold transition cursor-pointer ${
                    selectedCategory === cat
                      ? (isLight ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-900 border-white')
                      : (isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-white/60 border-white/10')
                  }`}
                >
                  {CATEGORY_COLORS[cat].label.split(' (')[0]} ({count})
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* ANNOTATED TEXT CONTAINER */}
            <div className={`lg:col-span-2 p-3.5 rounded-xl border space-y-2.5 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-black/30 border-white/10'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                <span className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Naskah Resume Medis Rawat Inap/Jalan (Dengan Highlight Entitas Klinis)
                </span>
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  {stylometry?.token_count || 0} Kata · {entities.length} Entitas Terdeteksi
                </span>
              </div>

              <div className={`text-xs leading-relaxed p-3 rounded-lg border font-sans ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#00102b]/60 border-white/10 text-slate-200'
              }`}>
                {renderAnnotatedResume(
                  auditData?.resume_text || currentCase?.rawClaim?.resume_text || currentCase?.description || (auditData ? 'Memuat naskah rekam medis...' : ''),
                  filteredEntities,
                  selectedCategory === 'ALL' || selectedCategory === 'NEGATION' ? negations : []
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-[10.5px]">
                <span className="font-semibold opacity-70">Legenda Anotasi:</span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-500" />
                  <span>Diagnosa</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
                  <span>Prosedur</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                  <span>Obat</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                  <span>Lab/Objektif</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                  <span>Negasi (-)</span>
                </span>
              </div>
            </div>

            {/* ENTITY INSPECTOR SIDEBAR */}
            <div className={`p-3.5 rounded-xl border space-y-3 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-black/30 border-white/10'
            }`}>
              <div className="border-b border-slate-200 dark:border-white/10 pb-2 flex items-center justify-between">
                <span className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Inspector Entitas Klinis
                </span>
                <span className="text-[10px] font-mono opacity-60">
                  {selectedEntity ? 'Entitas Terpilih' : 'Pilih dari Naskah'}
                </span>
              </div>

              {selectedEntity ? (
                <div className={`p-3 rounded-lg border space-y-2 text-xs ${
                  isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      CATEGORY_COLORS[selectedEntity.category]?.bgLight || 'bg-slate-100 text-slate-800'
                    }`}>
                      {selectedEntity.category}
                    </span>
                    <span className="text-[10px] font-mono opacity-70">
                      Index: {selectedEntity.start}-{selectedEntity.end}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10.5px] opacity-60 block">Teks Narasi Medis:</span>
                    <strong className="text-sm font-mono text-emerald-600 dark:text-emerald-400">
                      &quot;{selectedEntity.text}&quot;
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10.5px] opacity-60 block">Interpretasi Kamus Klinis:</span>
                    <p className="font-semibold text-xs">{selectedEntity.label}</p>
                  </div>

                  {selectedEntity.code_hint && (
                    <div className="pt-1 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-[11px]">
                      <span className="opacity-70">Kode Rujukan Terkait:</span>
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10">
                        {selectedEntity.code_hint}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-xs opacity-60 italic">
                  Klik entitas berwarna pada naskah resume medis di sebelah kiri untuk melihat detail kamus regulasi &amp; kode INA-CBG terkait.
                </div>
              )}

              {/* Quick Summary of Extracted Tokens */}
              <div className="space-y-1.5 pt-1">
                <span className={`text-[10.5px] font-bold block ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                  Daftar Entitas Terkatalog ({filteredEntities.length}):
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {filteredEntities.map((ent, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedEntity(ent)}
                      className={`p-1.5 rounded-lg border text-[10.5px] flex items-center justify-between cursor-pointer transition ${
                        selectedEntity === ent
                          ? (isLight ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-500/20 border-emerald-500/40')
                          : (isLight ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-white/5 border-white/5 hover:bg-white/10')
                      }`}
                    >
                      <span className="font-semibold truncate max-w-[140px]">{ent.text}</span>
                      <span className="text-[9.5px] font-mono opacity-70">[{ent.code_hint || ent.category.slice(0, 4)}]</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALIGNMENT & STYLOMETRIC AUDIT */}
      {activeTab === 'alignment' && alignment && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Alignment Score Meter */}
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-black/30 border-white/10'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Documentation Alignment Score
                </span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  alignment.alignment_score_pct >= 80
                    ? (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                    : alignment.alignment_score_pct >= 50
                    ? (isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                    : (isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30')
                }`}>
                  {alignment.status}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {alignment.alignment_score_pct}%
                </span>
                <span className="text-xs opacity-70">Kesesuaian Narasi Medis vs Koding</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    alignment.alignment_score_pct >= 80 ? 'bg-emerald-500' : alignment.alignment_score_pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${alignment.alignment_score_pct}%` }}
                />
              </div>

              <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                {alignment.summary}
              </p>
            </div>

            {/* Stylometric Analysis */}
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-black/30 border-white/10'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Analisis Stilometri Leksikal
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  stylometry?.is_repetitive
                    ? (isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/20 text-rose-300')
                    : (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300')
                }`}>
                  {stylometry?.template_risk || 'NORMAL'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className={`p-2 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5'}`}>
                  <span className="opacity-60 block text-[10px]">Total Kata / Token:</span>
                  <strong className="font-mono text-sm">{stylometry?.token_count || 0}</strong>
                </div>
                <div className={`p-2 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5'}`}>
                  <span className="opacity-60 block text-[10px]">Kosakata Unik:</span>
                  <strong className="font-mono text-sm">{stylometry?.unique_words || 0}</strong>
                </div>
                <div className={`p-2 rounded-lg border col-span-2 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex justify-between items-center">
                    <span className="opacity-60 text-[10px]">Type-Token Ratio (TTR):</span>
                    <strong className="font-mono">{stylometry?.type_token_ratio || 0}</strong>
                  </div>
                  <p className="text-[10px] opacity-60 mt-0.5">
                    Rasio TTR rendah (&lt; 0.40) mengindikasikan teks template copy-paste atau fabrikasi massal.
                  </p>
                </div>
              </div>
            </div>

            {/* Validation Checklist */}
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-black/30 border-white/10'
            }`}>
              <span className={`text-[11px] font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Pilar Keselarasan Kaidah
              </span>
              <div className="space-y-1.5 text-[11px]">
                {(alignment.supported_items || []).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
                {(alignment.unsupported_items || []).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-rose-700 dark:text-rose-300">
                    <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
                {(alignment.warnings || []).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VECTOR SEMANTICS & MACHINE LEARNING INFERENCE */}
      {activeTab === 'vector_ml' && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* ChromaDB Vector Semantic Embedding Card */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-black/30 border-white/10'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className={`w-4 h-4 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
                  <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    ChromaDB Vector Semantic Space
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  vectorSem?.is_semantic_plagiarized
                    ? (isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30')
                    : (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                }`}>
                  {vectorSem?.flag || 'SEMANTIC_OK'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="opacity-70">Embedding Model:</span>
                  <span className="font-mono text-[11px] font-bold">{vectorSem?.vector_space || 'all-MiniLM-L6-v2'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-70">Max Cosine Similarity:</span>
                  <span className="font-mono font-extrabold text-sm text-cyan-600 dark:text-cyan-400">
                    {vectorSem?.similarity_score_pct ?? 0}%
                  </span>
                </div>
                {vectorSem?.nearest_matched_claim && (
                  <div className="flex justify-between items-center">
                    <span className="opacity-70">Klaster / Kasus Terdekat:</span>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10">
                      {vectorSem.nearest_matched_claim}
                    </span>
                  </div>
                )}
                <div className={`p-2.5 rounded-lg text-[11px] border leading-relaxed ${
                  vectorSem?.is_semantic_plagiarized
                    ? (isLight ? 'bg-rose-50/70 border-rose-200 text-rose-900' : 'bg-rose-500/10 border-rose-500/20 text-rose-200')
                    : (isLight ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200')
                }`}>
                  {vectorSem?.is_semantic_plagiarized
                    ? 'PERINGATAN FORENSIK: Teks rekam medis memiliki kemiripan semantik ekstrem (>90%) dengan berkas lain di faskes ini, mengindikasikan duplikasi narasi tanpa pemeriksaan individual peserta (Indikasi Phantom Billing / Pabrik Klaim).'
                    : 'Narasi rekam medis memiliki variasi linguistik alami dan tidak terdeteksi salin-tempel massal pada ruang vektor semantik ChromaDB.'}
                </div>
              </div>
            </div>

            {/* Machine Learning Isolation Forest Card */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-black/30 border-white/10'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className={`w-4 h-4 ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`} />
                  <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Machine Learning Risk Inference
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  mlInference?.risk_lane === 'MERAH'
                    ? (isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30')
                    : mlInference?.risk_lane === 'KUNING'
                    ? (isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                    : (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')
                }`}>
                  Jalur {mlInference?.risk_lane || 'HIJAU'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5'}`}>
                  <span className="opacity-60 block text-[10px]">Model Architecture:</span>
                  <strong className="text-[10.5px] truncate block font-mono">
                    {mlInference?.model_architecture || 'Isolation Forest + Bayesian'}
                  </strong>
                </div>
                <div className={`p-2 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5'}`}>
                  <span className="opacity-60 block text-[10px]">Anomaly Score:</span>
                  <strong className="text-sm font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                    {mlInference?.anomaly_score ?? 0} / 100
                  </strong>
                </div>
              </div>

              <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Model unsupervised Isolation Forest mendeteksi isolasi titik multivariat pada ruang dimensi dimensi lonjakan, koordinat geovelocity, presensi, dan kemiripan leksikal.
              </p>
            </div>
          </div>

          {/* EXPLAINABLE AI (XAI) FEATURE CONTRIBUTION DRIVERS */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-black/30 border-white/10'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Activity className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Explainable AI (XAI) · Kontribusi Sinyal Fitur Terhadap Keputusan
                </span>
              </div>
              <span className={`text-[10.5px] font-mono ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Shapley-Calibrated Weights
              </span>
            </div>

            <div className="space-y-2.5">
              {(mlInference?.feature_contributions || []).map((driver, dIdx) => (
                <div key={dIdx} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        driver.is_anomalous ? 'bg-rose-500' : 'bg-emerald-500'
                      }`} />
                      <span>{driver.feature_label}</span>
                    </span>
                    <span className="font-mono font-bold tabular-nums">
                      {driver.contribution_pct}% · <span className="opacity-60">{driver.raw_value}</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        driver.is_anomalous ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, driver.contribution_pct * 2.5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INTERACTIVE NLP SANDBOX */}
      {activeTab === 'sandbox' && (
        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Uji Coba Langsung Pemrosesan Bahasa Alami (Interactive NLP Engine)
            </span>
            <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
              <span className="opacity-60">Muat Preset:</span>
              {PRESET_SANDBOX_NOTES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSandboxText(preset.text);
                    setSandboxIcd10(preset.icd10);
                    setSandboxCbg(preset.cbg);
                    setSandboxProc(preset.proc);
                    setSandboxResult(null);
                  }}
                  className={`px-2 py-0.5 rounded border font-semibold transition cursor-pointer ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                  }`}
                >
                  {preset.title.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleRunSandbox} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-[10.5px]">Billed ICD-10 Primer</label>
                <input
                  type="text"
                  value={sandboxIcd10}
                  onChange={(e) => setSandboxIcd10(e.target.value)}
                  placeholder="cth: M54.5"
                  className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                    isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/15'
                  }`}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-[10.5px]">Billed INA-CBG Code</label>
                <input
                  type="text"
                  value={sandboxCbg}
                  onChange={(e) => setSandboxCbg(e.target.value)}
                  placeholder="cth: Z-3-12-0"
                  className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                    isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/15'
                  }`}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-[10.5px]">Prosedur ICD-9-CM (Opsional)</label>
                <input
                  type="text"
                  value={sandboxProc}
                  onChange={(e) => setSandboxProc(e.target.value)}
                  placeholder="cth: 93.39"
                  className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                    isLight ? 'bg-white border-slate-300' : 'bg-white/5 border-white/15'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-[10.5px]">
                Naskah Catatan Klinis / Resume Medis Pasien (Bahasa Indonesia / Medis Latin)
              </label>
              <textarea
                rows={4}
                value={sandboxText}
                onChange={(e) => setSandboxText(e.target.value)}
                placeholder="Ketik atau tempelkan resume medis dokter..."
                className={`w-full p-2.5 rounded-lg border text-xs font-sans leading-relaxed ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/5 border-white/15 text-white'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={sandboxBusy || !sandboxText.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{sandboxBusy ? 'Menganalisis Naskah NLP...' : 'Jalankan Analisis NLP & Keselarasan Koding'}</span>
            </button>
          </form>

          {/* SANDBOX RESULT DISPLAY */}
          {sandboxResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border space-y-3 mt-3 ${
                isLight ? 'bg-emerald-50/40 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20'
              }`}
            >
              <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-500/30 pb-2">
                <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Hasil Ekstraksi NLP Sandbox ({sandboxResult.entities_count} Entitas Ditemukan)
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                  Kesesuaian: {sandboxResult.alignment?.alignment_score_pct}%
                </span>
              </div>

              {/* Annotated Preview of Sandbox Text */}
              <div className={`p-3 rounded-lg border text-xs leading-relaxed ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-black/30 border-white/10 text-white'
              }`}>
                {renderAnnotatedResume(sandboxText, sandboxResult.entities || [], sandboxResult.negations || [])}
              </div>

              {/* Summary Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div className="space-y-1">
                  <span className="font-bold block opacity-70">Item Selaras:</span>
                  {(sandboxResult.alignment?.supported_items || []).map((it, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{it}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <span className="font-bold block opacity-70">Penyangkalan (NegEx) / Peringatan:</span>
                  {(sandboxResult.negations || []).map((neg, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Negasi: &quot;{neg.trigger}&quot;</span>
                    </div>
                  ))}
                  {(sandboxResult.alignment?.warnings || []).map((w, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
