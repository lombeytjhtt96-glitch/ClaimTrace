"use client";
import React, { useState } from "react";
import { ClusterGraphData, ClusterGraphNode } from "../types/claim";
import { Info, Network, Database } from "lucide-react";
import Neo4jCypherModal from "./Neo4jCypherModal";

interface EpisodeFingerprintGraphProps {
  graphData?: ClusterGraphData;
  claimId: string;
}

export default function EpisodeFingerprintGraph({
  graphData,
  claimId,
}: EpisodeFingerprintGraphProps) {
  const [selectedNode, setSelectedNode] = useState<ClusterGraphNode | null>(null);
  const [isCypherModalOpen, setIsCypherModalOpen] = useState(false);

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
        Data topologi graf episode belum tersedia untuk kasus ini.
      </div>
    );
  }

  const nodePositions: Record<string, { x: number; y: number }> = {};
  const width = 640;
  const height = 280;

  let faskesCount = 0;
  let episodeCount = 0;

  graphData.nodes.forEach((node, i) => {
    if (node.type === "FASKES") {
      if (faskesCount === 0) {
        nodePositions[node.id] = { x: 75, y: 70 };
      } else {
        nodePositions[node.id] = { x: 75, y: 200 };
      }
      faskesCount++;
    } else if (node.type === "DPJP") {
      nodePositions[node.id] = { x: 200, y: 140 };
    } else if (node.type === "EPISODE") {
      if (episodeCount === 0) {
        nodePositions[node.id] = { x: 335, y: 65 };
      } else {
        nodePositions[node.id] = { x: 335, y: 205 };
      }
      episodeCount++;
    } else if (node.type === "CLAIM") {
      if (node.id.includes("PREV-")) {
        nodePositions[node.id] = { x: 560, y: 205 };
      } else {
        nodePositions[node.id] = { x: 450, y: 140 };
      }
    } else if (node.type === "PESERTA") {
      nodePositions[node.id] = { x: 560, y: 70 };
    } else {
      nodePositions[node.id] = { x: 100 + (i * 90) % (width - 150), y: 120 + (i % 2) * 50 };
    }
  });

  return (
    <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 relative overflow-hidden shadow-2xs">
      {/* Graph Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80 mb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Episode Fingerprint Graph • Rekonsiliasi Jejaring Anomali
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-600 font-mono font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0284c7]" /> Faskes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> DPJP
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4f46e5]" /> Klaster
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ef4444]" /> Sinyal Anomali
            </span>
          </div>

          <button
            onClick={() => setIsCypherModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-blue-700 bg-white hover:bg-blue-50 border border-blue-200/90 px-2.5 py-1 rounded-lg font-semibold transition shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Buka katalog Cypher dan unduh script graf Neo4j"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Katalog Cypher & Neo4j</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas (Clean Light Theme) */}
      <div className="relative w-full overflow-x-auto bg-white rounded-lg border border-slate-200">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[300px] select-none"
        >
          <defs>
            <pattern id="graph-grid-light" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#graph-grid-light)" />

          {/* Render Edges */}
          {graphData.edges.map((edge, idx) => {
            const src = nodePositions[edge.source] || { x: 50, y: 50 };
            const tgt = nodePositions[edge.target] || { x: 200, y: 200 };
            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={edge.is_anomaly ? "#e11d48" : "#94a3b8"}
                  strokeWidth={edge.is_anomaly ? 2.5 : 1.5}
                  strokeDasharray={edge.is_anomaly ? "5 3" : "none"}
                />
                {/* Edge Label Badge */}
                <rect
                  x={midX - 35}
                  y={midY - 8}
                  width="70"
                  height="16"
                  rx="4"
                  fill="#ffffff"
                  stroke={edge.is_anomaly ? "#fca5a5" : "#cbd5e1"}
                  strokeWidth="1"
                />
                <text
                  x={midX}
                  y={midY + 3.5}
                  fill={edge.is_anomaly ? "#be123c" : "#475569"}
                  fontSize="7.5"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {edge.label.length > 13 ? edge.label.substring(0, 12) + "…" : edge.label}
                </text>
              </g>
            );
          })}

          {/* Render Nodes */}
          {graphData.nodes.map((node) => {
            const pos = nodePositions[node.id] || { x: 100, y: 100 };
            const isTargetClaim = node.id === claimId;
            const isAnomalyNode = node.risk_level === "HIGH";

            const nodeColors = {
              FASKES: { fill: "#e0f2fe", stroke: "#0284c7", text: "#0369a1" },
              DPJP: isAnomalyNode
                ? { fill: "#ffe4e6", stroke: "#e11d48", text: "#be123c" }
                : { fill: "#fef3c7", stroke: "#d97706", text: "#b45309" },
              EPISODE: isAnomalyNode
                ? { fill: "#fce7f3", stroke: "#db2777", text: "#9d174d" }
                : { fill: "#e0e7ff", stroke: "#4f46e5", text: "#3730a3" },
              CLAIM: isAnomalyNode
                ? { fill: "#ffe4e6", stroke: "#e11d48", text: "#be123c" }
                : { fill: "#d1fae5", stroke: "#059669", text: "#065f46" },
              PESERTA: isAnomalyNode
                ? { fill: "#ffe4e6", stroke: "#e11d48", text: "#be123c" }
                : { fill: "#ccfbf1", stroke: "#0d9488", text: "#115e59" },
            }[node.type] || { fill: "#f1f5f9", stroke: "#64748b", text: "#334155" };

            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer transition-transform hover:scale-105"
                transform={`translate(${pos.x}, ${pos.y})`}
              >
                {/* Outer Ring if Anomaly */}
                {isAnomalyNode && (
                  <circle
                    r="23"
                    fill="none"
                    stroke="#e11d48"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r={isTargetClaim ? 20 : 17}
                  fill={nodeColors.fill}
                  stroke={nodeColors.stroke}
                  strokeWidth={isTargetClaim ? 2.5 : 1.8}
                />

                {/* Inner Icon or Initial */}
                <text
                  x="0"
                  y="4"
                  fill={nodeColors.text}
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {node.type.substring(0, 3)}
                </text>

                {/* Node Label Below */}
                <rect
                  x="-55"
                  y="23"
                  width="110"
                  height="16"
                  rx="4"
                  fill="#ffffff"
                  stroke={nodeColors.stroke}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="34"
                  fill="#0f172a"
                  fontSize="8"
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {node.label.length > 17 ? node.label.substring(0, 16) + "…" : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Mini Inspector */}
      {selectedNode && (
        <div className="mt-2.5 p-2.5 bg-white border border-slate-300 rounded-lg flex items-center justify-between text-xs shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600" />
            <div>
              <span className="font-bold text-slate-900">
                [{selectedNode.type}] {selectedNode.label}:
              </span>{" "}
              <span className="text-slate-600 font-medium">{selectedNode.status || "Status terverifikasi normal"}</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="text-[10px] text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 font-semibold"
          >
            Tutup
          </button>
        </div>
      )}
      {/* Neo4j Cypher & Graph Science Catalog Modal */}
      <Neo4jCypherModal
        isOpen={isCypherModalOpen}
        onClose={() => setIsCypherModalOpen(false)}
      />
    </div>
  );
}
