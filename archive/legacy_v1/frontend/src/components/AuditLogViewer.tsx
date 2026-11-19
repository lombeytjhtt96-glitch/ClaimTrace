"use client";
import React, { useState } from "react";
import { AuditEntry } from "../types/claim";
import { ShieldCheck, Link2, Clock, ChevronDown, ChevronRight, Copy, Check, RefreshCw } from "lucide-react";

interface AuditLogViewerProps {
  logs: AuditEntry[];
  onRefresh?: () => void;
  isIntegrityValid?: boolean;
}

export default function AuditLogViewer({
  logs,
  onRefresh,
  isIntegrityValid = true,
}: AuditLogViewerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleCopy = (hashStr: string) => {
    navigator.clipboard.writeText(hashStr);
    setCopiedHash(hashStr);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Jejak Audit Tamper-Evident (Rantai Hash SHA-256)
            </h3>
            <p className="text-xs text-slate-500">
              Setiap Kalkulasi Skor & Keputusan Verifikator Terikat Permanen (UU PDP No. 27/2022)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Integrity Badge */}
          <span
            className={`text-xs font-bold font-mono px-3 py-1 rounded-full border flex items-center gap-1.5 ${
              isIntegrityValid
                ? "bg-[#f6ffed] text-[#389e0d] border-[#b7eb8f]"
                : "bg-[#fff1f0] text-[#cf1322] border-[#ffa39e]"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#389e0d]" />
            {isIntegrityValid ? "Integritas Rantai: 100% Valid" : "Peringatan: Hash Terputus!"}
          </span>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200/90 shadow-2xs transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              title="Perbarui Rantai Hash"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Chain Stream */}
      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 font-mono custom-scrollbar">
        {logs.map((entry) => {
          const isExpanded = expandedIndex === entry.index;
          return (
            <div
              key={entry.index}
              className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-3 text-xs transition hover:bg-slate-100/60"
            >
              <div
                onClick={() => toggleExpand(entry.index)}
                className="flex flex-wrap items-center justify-between gap-2 cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-slate-200/80 font-bold text-xs text-slate-700 border border-slate-300/80">
                    #{entry.index}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(entry.timestamp).toLocaleTimeString("id-ID")}
                  </span>
                  <span className="text-slate-900 font-bold">{entry.event_type}</span>
                  <span className="text-blue-700 text-xs font-bold">[{entry.claim_id}]</span>
                  <span className="text-slate-500 text-xs">oleh {entry.actor}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[#096dd9] text-xs bg-[#e6f7ff] px-2.5 py-0.5 rounded-full border border-[#91d5ff] font-semibold">
                    sha256:{entry.current_hash.substring(0, 10)}...
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
              </div>

              {/* Expanded JSON Inspector */}
              {isExpanded && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-2 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between text-slate-600 text-xs">
                    <span className="flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-slate-400" /> Prev Hash:{" "}
                      <code className="text-slate-800 font-semibold">{entry.prev_hash}</code>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(entry.current_hash);
                      }}
                      className="flex items-center gap-1 text-slate-700 hover:text-slate-900 px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 border border-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none font-medium"
                    >
                      {copiedHash === entry.current_hash ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                      Salin Hash
                    </button>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-slate-200 overflow-x-auto text-slate-800 shadow-inner">
                    <pre className="text-xs leading-normal">
                      {JSON.stringify(entry.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {logs.length === 0 && (
          <div className="text-center py-6 text-xs text-slate-500">
            Belum ada aktivitas tercatat pada jejak audit.
          </div>
        )}
      </div>
    </div>
  );
}
