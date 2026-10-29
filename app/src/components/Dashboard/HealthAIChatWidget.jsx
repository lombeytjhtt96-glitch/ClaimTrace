import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MarkdownRenderer from '../Common/MarkdownRenderer';
import {
  MessageSquare,
  X,
  Send,
  Minimize2,
  Maximize2,
  Activity,
  Shield,
  Users,
  Calendar,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { orchestrateJknChat } from '../../services/claimtraceOrchestratorService';

/**
 * HealthAIChatWidget:
 * `frontend/src/components/admin/chat/HealthAIChatWidget.tsx`
 * Enhanced with deep cosmic navy glassmorphism.
 */

const PILL_COLOR = {
  triage: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  analytics: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  intervention: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  claimtrace_ai: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  'L1-Klinis': 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  'L2-Regulasi': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  'L3-Presensi': 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CMA: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  IA: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
};

const RISK_LEVEL_COLORS = {
  none: { bg: 'bg-emerald-500/20 border border-emerald-500/30', text: 'text-emerald-300' },
  low: { bg: 'bg-emerald-500/20 border border-emerald-500/30', text: 'text-emerald-300' },
  moderate: { bg: 'bg-amber-500/20 border border-amber-500/30', text: 'text-amber-300' },
  high: { bg: 'bg-orange-500/20 border border-orange-500/30', text: 'text-orange-300' },
  critical: { bg: 'bg-rose-500/20 border border-rose-500/30', text: 'text-rose-300' },
};

export default function HealthAIChatWidget({ onOpenFullScreen, onNavigateTab, isLight: propIsLight }) {
  const [isLight, setIsLight] = useState(() => {
    if (propIsLight !== undefined) return propIsLight;
    if (typeof document !== 'undefined') {
      return document.getElementById('cockpit-root')?.classList.contains('theme-light') || false;
    }
    return false;
  });

  useEffect(() => {
    if (propIsLight !== undefined) {
      setIsLight(propIsLight);
      return;
    }
    const root = document.getElementById('cockpit-root');
    if (!root) return;
    const obs = new MutationObserver(() => {
      setIsLight(root.classList.contains('theme-light'));
    });
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, [propIsLight]);

  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('chat') === 'open';
    }
    return false;
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentThinking, setCurrentThinking] = useState(null);
  const [activeAgents, setActiveAgents] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && !isMinimized && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const executeOrchestratorResponse = async (queryText, correlationId) => {
    setIsLoading(true);
    setCurrentThinking('Menghubungi ClaimTrace AI · Mengorkestrasi Agen Audit JKN...');
    setActiveAgents([
      {
        agent: 'IA',
        name: 'Agen Analitik Wawasan (IA)',
        description: 'Mengevaluasi telemetri klaim FKRTL & SLA 10 Hari Kerja via ClaimTrace AI Engine',
      },
      {
        agent: 'CMA',
        name: 'Agen Manajemen Berkas (CMA)',
        description: 'Memeriksa antrean verifikator & jadwal klarifikasi DPJP',
      },
    ]);

    try {
      const historyForApi = messages
        .filter((m) => !m.pending && m.content)
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await orchestrateJknChat(queryText, historyForApi);

      setCurrentThinking(null);
      setActiveAgents([]);

      setMessages((prev) =>
        prev.map((m) =>
          m.correlationId === correlationId && m.role === 'assistant'
            ? {
                ...m,
                content: result.content,
                pending: false,
                resolvedAgent: result.resolvedAgent,
                agentsInvoked: result.agentsInvoked,
                riskLevel: result.riskLevel,
                riskScore: result.riskScore,
                interventionPlan: result.interventionPlan,
                appointment: result.appointment,
                metrics: result.metrics,
              }
            : m
        )
      );
    } catch (err) {
      setCurrentThinking(null);
      setActiveAgents([]);
      setMessages((prev) =>
        prev.map((m) =>
          m.correlationId === correlationId && m.role === 'assistant'
            ? {
                ...m,
                content: `Gagal memproses kueri: ${err.message || 'Koneksi terputus'}. Silakan coba kembali.`,
                pending: false,
                isError: true,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    const correlationId = `corr-${Date.now()}`;

    const newMessages = [
      ...messages,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userText,
        correlationId,
      },
      {
        id: `assistant-${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        pending: true,
        correlationId,
      },
    ];

    setMessages(newMessages);
    executeOrchestratorResponse(userText, correlationId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const handleCardSelection = (promptText) => {
    setInput(promptText);
    setTimeout(() => {
      const correlationId = `corr-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: promptText,
          correlationId,
        },
        {
          id: `assistant-${Date.now() + 1}`,
          role: 'assistant',
          content: '',
          pending: true,
          correlationId,
        },
      ]);
      executeOrchestratorResponse(promptText, correlationId);
      setInput('');
    }, 100);
  };

  return (
    <AnimatePresence mode="wait">
      {!isOpen ? (
        <motion.button
          key="asisten-audit-jkn-trigger"
          type="button"
          initial={{ opacity: 0, scale: 0.85, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 15 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-11 sm:bottom-12 right-6 px-4 py-2.5 text-white rounded-full shadow-xl flex items-center gap-2 group z-[9999] border cursor-pointer select-none transition-all ${
            isLight
              ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-500 hover:to-teal-700 shadow-emerald-900/30 border border-emerald-400/50'
              : 'bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-950/60 border border-emerald-400/30'
          }`}
          aria-label="Buka Asisten Audit JKN AI"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse shrink-0" />
          <span className="text-xs font-bold tracking-wide">Asisten Audit JKN</span>
        </motion.button>
      ) : (
        <motion.div
          key="asisten-audit-jkn-window"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className={`fixed bottom-14 sm:bottom-16 right-6 z-[9999] flex flex-col backdrop-blur-2xl border rounded-2xl shadow-2xl overflow-hidden ${
            isLight
              ? 'bg-white border border-emerald-600/30 shadow-2xl shadow-slate-900/20 text-slate-800'
              : 'bg-[#00153A]/98 border border-white/20 shadow-black/80 text-white'
          } ${
            isMinimized 
              ? 'h-[64px] w-84 sm:w-92' 
              : 'h-[520px] max-h-[calc(100dvh-4.5rem)] w-[92vw] sm:w-[410px]'
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 ${isMinimized ? 'py-2.5 border-b-0' : 'py-3 border-b'} flex items-center justify-between cursor-pointer select-none shrink-0 ${
              isLight
                ? 'bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 border-emerald-800 text-white shadow-xs'
                : 'bg-[#000c24] border-white/10 text-white'
            }`}
            onClick={() => isMinimized && setIsMinimized(false)}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-950/40 shrink-0">
                <Sparkles className="w-4 h-4 text-[#FFCA40]" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm leading-tight">
                  Asisten Audit JKN (AI)
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-[10px] text-white/80 font-semibold uppercase tracking-wider leading-none">
                    Orkestrator Online · NIST AI RMF 1.0
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {onOpenFullScreen && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    onOpenFullScreen();
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors cursor-pointer"
                  title="Buka Halaman Penuh Asisten Audit JKN"
                  aria-label="Buka Halaman Penuh Asisten Audit JKN"
                >
                  <ExternalLink className="w-4 h-4 text-cyan-300" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors cursor-pointer"
                title={isMinimized ? 'Perbesar' : 'Perkecil'}
                aria-label={isMinimized ? 'Perbesar' : 'Perkecil'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="p-1.5 hover:bg-rose-500/25 rounded-lg text-white/80 hover:text-rose-200 transition-colors cursor-pointer"
                title="Tutup Asisten"
                aria-label="Tutup Asisten"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

      {/* Chat Area */}
      {!isMinimized && (
        <>
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#000c24]/80 text-white'}`}>
            {messages.length === 0 && (
              <div className={`text-center py-6 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className={`text-xs font-medium mb-4 px-2 leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                  Halo! Saya <strong className={isLight ? 'text-emerald-800 font-bold' : 'text-white'}>Asisten Audit JKN</strong>, kopilot multi-agen untuk Verifikator Medis BPJS Kesehatan. Ada yang bisa dibantu hari ini?
                </p>
                <div className="flex flex-col gap-2 px-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCardSelection('Tampilkan statistik verifikasi klaim hari ini')
                    }
                    className={`text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer text-left ${
                      isLight
                        ? 'bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 hover:text-emerald-900 shadow-xs'
                        : 'bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-400/30 text-white/90 hover:text-emerald-200'
                    }`}
                  >
                    <Activity className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                    <span>Statistik Klaim Hari Ini</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleCardSelection('Ada berapa verifikator medis yang siaga hari ini?')
                    }
                    className={`text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer text-left ${
                      isLight
                        ? 'bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 hover:text-emerald-900 shadow-xs'
                        : 'bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-400/30 text-white/90 hover:text-emerald-200'
                    }`}
                  >
                    <Users className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                    <span>Verifikator Medis Siaga</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleCardSelection('Ada jadwal klarifikasi klaim DPJP yang terjadwal hari ini?')
                    }
                    className={`text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer text-left ${
                      isLight
                        ? 'bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 hover:text-emerald-900 shadow-xs'
                        : 'bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-400/30 text-white/90 hover:text-emerald-200'
                    }`}
                  >
                    <Calendar className={`w-4 h-4 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                    <span>Jadwal Klarifikasi DPJP</span>
                  </button>
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-lg ${
                    m.role === 'user'
                      ? isLight
                        ? 'bg-emerald-600 text-white font-medium rounded-tr-none shadow-xs keep-white'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-medium rounded-tr-none shadow-emerald-950/40 keep-white'
                      : isLight
                        ? 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-xs'
                        : 'bg-[#00153A]/90 text-white/90 rounded-tl-none border border-white/10 shadow-[#00081c]/50'
                  }`}
                >
                  {m.pending && currentThinking ? (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span
                          className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                      <span className="text-white/60 text-xs">{currentThinking}</span>
                    </div>
                  ) : (
                    <MarkdownRenderer
                      content={m.content}
                      isLight={isLight}
                      isUser={m.role === 'user'}
                      className={
                        m.role === 'user'
                          ? 'text-white'
                          : isLight
                          ? 'text-slate-800'
                          : 'text-white/90 text-xs'
                      }
                    />
                  )}

                  {m.role === 'assistant' && !m.pending && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {/* Agent Pills */}
                      <div className="flex flex-wrap gap-1">
                        {m.resolvedAgent && (
                          <span
                            className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                              isLight
                                ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                : PILL_COLOR[m.resolvedAgent] || 'bg-white/10 text-white/80 border border-white/15'
                            }`}
                          >
                            {m.resolvedAgent}
                          </span>
                        )}
                        {m.agentsInvoked &&
                          m.agentsInvoked.map((agent, idx) => (
                            <span
                              key={idx}
                              className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                                isLight
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                  : PILL_COLOR[agent] || 'bg-white/10 text-white/80 border border-white/15'
                              }`}
                            >
                              {agent}
                            </span>
                          ))}
                      </div>

                      {/* Risk Level Indicator */}
                      {m.riskLevel && m.riskLevel !== 'none' && (
                        <div
                          className={`text-[9.5px] px-2 py-0.5 rounded-lg flex items-center gap-1.5 border font-semibold ${
                            isLight
                              ? m.riskLevel === 'critical'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : m.riskLevel === 'high'
                                ? 'bg-orange-50 text-orange-800 border-orange-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                              : `${RISK_LEVEL_COLORS[m.riskLevel]?.bg || 'bg-white/10'} ${RISK_LEVEL_COLORS[m.riskLevel]?.text || 'text-white/80'}`
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span className="font-bold uppercase">Risiko: {m.riskLevel}</span>
                          {m.riskScore !== undefined && (
                            <span className={isLight ? 'text-slate-600 font-semibold' : 'text-white/60 font-semibold'}>
                              ({(m.riskScore * 100).toFixed(0)}%)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Processing Time & ClaimTrace AI Model Telemetry */}
                      {m.metrics?.processing_time_ms && (
                        <div className={`flex items-center gap-1.5 text-[9.5px] font-mono ${
                          isLight ? 'text-slate-500' : 'text-white/40'
                        }`}>
                          <span>{m.metrics.processing_time_ms.toFixed(0)}ms</span>
                          {m.metrics.model_used && (
                            <>
                              <span>·</span>
                              <span className={isLight ? 'text-emerald-700 font-semibold' : 'text-cyan-300 font-semibold'}>
                                {m.metrics.model_used}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Intervention Plan Card */}
                {m.role === 'assistant' && m.interventionPlan && (
                  <div className={`mt-2 max-w-[90%] rounded-xl p-3 text-xs border ${
                    isLight
                      ? 'bg-emerald-50/90 border-emerald-300 text-slate-800 shadow-xs'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-white'
                  }`}>
                    <div className={`flex items-center gap-1.5 font-bold mb-1 ${
                      isLight ? 'text-emerald-900' : 'text-emerald-300'
                    }`}>
                      <Activity className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                      Rencana Tindak Lanjut Audit
                    </div>
                    <div className={`space-y-1 text-[11px] ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                      {m.interventionPlan.immediate_actions && (
                        <p>
                          <span className={`font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Tindakan:</span>{' '}
                          {m.interventionPlan.immediate_actions}
                        </p>
                      )}
                      {m.interventionPlan.priority && (
                        <p>
                          <span className={`font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Prioritas:</span>{' '}
                          {m.interventionPlan.priority}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className={`p-3 border-t rounded-b-2xl shrink-0 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#00153A] border-white/10'
            }`}
          >
            <div className="relative flex items-center gap-2">
              <input aria-label="Bidang input data"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanyakan ke Asisten Audit JKN..."
                className={`flex-1 border rounded-xl px-3.5 py-2 text-xs transition-all ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500'
                    : 'bg-white/5 border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[#FFCA40]'
                }`}
                disabled={isLoading}
              />
              <button aria-label="Kirim pesan"
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-2 disabled:opacity-40 text-white rounded-xl transition-all shadow-md cursor-pointer keep-white ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-950/40'
                }`}
              >
                <Send className="w-4 h-4 text-white keep-white stroke-[2.2]" />
              </button>
            </div>
          </form>
        </>
      )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
