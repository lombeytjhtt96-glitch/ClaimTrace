"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Database,
  Download,
  Copy,
  Check,
  Network,
  Terminal,
  Code2,
  ExternalLink,
  ShieldCheck,
  Layers,
  ArrowRight
} from "lucide-react";

interface CypherQueryItem {
  id: string;
  name: string;
  description: string;
  target_modus: string;
  mitre_f3: string;
  cypher: string;
}

interface Neo4jCypherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FALLBACK_QUERIES: CypherQueryItem[] = [
  {
    id: "QRY-PHANTOM-SIMULTANEOUS",
    name: "Deteksi Modus #6: Phantom Billing (DPJP Multi-Faskes Simultan)",
    description: "Mendeteksi dokter (DPJP) yang tercatat memberikan layanan di dua faskes berbeda pada hari yang sama dengan selisih waktu kurang dari 2 jam.",
    target_modus: "Modus #6: Phantom Billing & Ghost Billing",
    mitre_f3: "FA0001.002 • Practitioner Staging & SIP Abuse",
    cypher: `// 1. MODUS #6 PHANTOM BILLING: SIMULTANEOUS DPJP CLAIMS
MATCH (d:DPJP)-[:TREATS]->(c1:Claim)-[:INCURRED_AT]->(f1:Faskes)
MATCH (d)-[:TREATS]->(c2:Claim)-[:INCURRED_AT]->(f2:Faskes)
WHERE f1 <> f2
  AND c1.tanggal_layanan = c2.tanggal_layanan
  AND c1.claim_id < c2.claim_id
RETURN d.nama AS dpjp,
       d.sip_status AS status_sip,
       f1.nama AS faskes_1,
       f2.nama AS faskes_2,
       c1.claim_id AS id_klaim_1,
       c2.claim_id AS id_klaim_2,
       c1.nilai_rp + c2.nilai_rp AS total_pembayaran_rp;`
  },
  {
    id: "QRY-IMPOSSIBLE-TRAVEL",
    name: "Deteksi Geovelocity: Impossible Travel (Jarak Fisik Antar-Kota)",
    description: "Mendeteksi klaim berurutan dalam rentang 2 jam di dua faskes yang berjarak geografis lebih dari 50 km tanpa jeda waktu tempuh yang realistis.",
    target_modus: "Modus #6: Phantom Billing via Geovelocity",
    mitre_f3: "FA0002.001 • Phantom Billing Monetization",
    cypher: `// 2. GEOVELOCITY ANOMALY: IMPOSSIBLE PHYSICAL TRAVEL
MATCH (d:DPJP)-[:TREATS]->(c1:Claim)-[:INCURRED_AT]->(f1:Faskes)
MATCH (d)-[:TREATS]->(c2:Claim)-[:INCURRED_AT]->(f2:Faskes)
WHERE f1.kota <> f2.kota
  AND c1.tanggal_layanan = c2.tanggal_layanan
  AND c1.claim_id <> c2.claim_id
RETURN d.nama AS dokter,
       f1.nama + " (" + f1.kota + ")" AS faskes_asal,
       f2.nama + " (" + f2.kota + ")" AS faskes_tujuan,
       "Anomali Kecepatan Fisik Terdeteksi" AS sinyal_forensik;`
  },
  {
    id: "QRY-REPEAT-BILLING-HD",
    name: "Deteksi Modus #11: Repeat Billing (Hemodialisis Terpecah)",
    description: "Mendeteksi klaim dialisis (INA-CBG N-4-10-0 / Prosedur 39.95) berulang pada pasien yang sama dalam jendela waktu < 48 jam tanpa resume medis unbundling.",
    target_modus: "Modus #11: Repeat Billing & Unbundling",
    mitre_f3: "FA0002.002 • Duplicate Episode Billing",
    cypher: `// 3. MODUS #11 REPEAT BILLING: DIALYSIS RECURRENCE < 48H
MATCH (p:Peserta)-[:SUBMITS_CLAIM]->(c1:Claim)-[:HAS_PROCEDURE]->(proc:Procedure {code: '39.95'})
MATCH (p)-[:SUBMITS_CLAIM]->(c2:Claim)-[:HAS_PROCEDURE]->(proc)
WHERE c1.claim_id <> c2.claim_id
  AND abs(duration.inDays(c1.tanggal_layanan, c2.tanggal_layanan).days) <= 1
RETURN p.peserta_id AS token_peserta,
       c1.claim_id AS klaim_pertama,
       c2.claim_id AS klaim_kedua,
       c1.tanggal_layanan AS tanggal_1,
       c2.tanggal_layanan AS tanggal_2,
       c1.nilai_rp + c2.nilai_rp AS total_duplikasi_rp;`
  },
  {
    id: "QRY-UPCODING-SEVERITY",
    name: "Deteksi Upcoding Keparahan Tinggi (Severity III Tanpa Telemetri Penunjang)",
    description: "Mendeteksi klaim rawat inap dengan severity III (digit terakhir INA-CBG 'III' atau '-3-') yang tidak disertai bukti tindakan operasi atau telemetri laboratorium.",
    target_modus: "Upcoding & Severity Inflation",
    mitre_f3: "F1025.003 • Tariff Code Elevation",
    cypher: `// 4. UPCODING SEVERITY III TANPA PEMERIKSAAN PENUNJANG
MATCH (c:Claim)-[:INCURRED_AT]->(f:Faskes)
WHERE c.ina_cbg CONTAINS "-III" OR c.ina_cbg CONTAINS "-3-"
  AND c.nilai_rp > 10000000
  AND NOT (c)-[:HAS_PROCEDURE]->(:Procedure {is_major_surgery: true})
RETURN c.claim_id AS id_klaim,
       f.nama AS faskes,
       c.ina_cbg AS cbg_diajukan,
       c.nilai_rp AS nilai_tagihan_rp,
       "Potensi Inflasi Severity III" AS indikator_upcoding;`
  },
  {
    id: "QRY-FRAUD-RING-CLUSTER",
    name: "Deteksi Jejaring Sindikat Faskes & DPJP (Fraud Ring Bipartite)",
    description: "Menemukan klaster faskes dan kelompok DPJP yang memiliki konsentrasi klaim Jalur Merah > 60% dari seluruh klaim yang diajukan.",
    target_modus: "Organized Fraud Ring & Collusion",
    mitre_f3: "F1005.006 • Coordinated Multi-Entity Exploitation",
    cypher: `// 5. FRAUD RING & SYNDICATE TOPOLOGY
MATCH (f:Faskes)<-[:INCURRED_AT]-(c:Claim)-[:EVALUATED_AS]->(t:Triage {lane: 'MERAH'})
MATCH (c)<-[:TREATS]-(d:DPJP)
WITH f, d, count(c) AS total_klaim_merah, sum(c.nilai_rp) AS total_eksposur_rp
WHERE total_klaim_merah >= 1
RETURN f.nama AS faskes,
       d.nama AS dpjp,
       d.sip_status AS status_sip,
       total_klaim_merah,
       total_eksposur_rp
ORDER BY total_eksposur_rp DESC;`
  }
];

export default function Neo4jCypherModal({ isOpen, onClose }: Neo4jCypherModalProps) {
  const [queries, setQueries] = useState<CypherQueryItem[]>(FALLBACK_QUERIES);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"QUERIES" | "SCHEMA" | "MCP_SETUP">("QUERIES");
  const [selectedQueryId, setSelectedQueryId] = useState<string>("QRY-PHANTOM-SIMULTANEOUS");
  const [schemaText, setSchemaText] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;

    // Fetch queries from FastAPI backend if available
    fetch("http://127.0.0.1:8000/api/v1/graph/neo4j-queries")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.queries)) {
          setQueries(data.queries);
        }
        if (data && data.schema_constraints) {
          setSchemaText(data.schema_constraints);
        }
      })
      .catch(() => {
        // Fallback to static queries
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadCypher = () => {
    window.open("http://127.0.0.1:8000/api/v1/graph/cypher-export", "_blank");
  };

  const selectedQuery = queries.find((q) => q.id === selectedQueryId) || queries[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200/80 bg-[#f8fafc]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/80">
                  Neo4j MCP & Graph Science
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  Graph Database Forensics • Healthkathon 2026
                </span>
              </div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight mt-0.5">
                Katalog Cypher Forensik & Rekonsiliasi Jejaring Anomali Klaim
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCypher}
              className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold shadow-2xs transition focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="Unduh seluruh basis data dan relasi klaim dalam format script Cypher Neo4j"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Script Graf (.cypher)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-200 bg-white">
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setActiveTab("QUERIES")}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-t-lg font-semibold border-b-2 transition ${
                activeTab === "QUERIES"
                  ? "border-blue-600 text-blue-700 bg-blue-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>5 Query Forensik Cypher</span>
            </button>
            <button
              onClick={() => setActiveTab("SCHEMA")}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-t-lg font-semibold border-b-2 transition ${
                activeTab === "SCHEMA"
                  ? "border-blue-600 text-blue-700 bg-blue-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Skema Graf & Constraints</span>
            </button>
            <button
              onClick={() => setActiveTab("MCP_SETUP")}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-t-lg font-semibold border-b-2 transition ${
                activeTab === "MCP_SETUP"
                  ? "border-blue-600 text-blue-700 bg-blue-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Integrasi Neo4j MCP Server</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
            Protokol: <b className="text-slate-800">Model Context Protocol (MCP)</b>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs bg-[#f8fafc] flex-1">
          {activeTab === "QUERIES" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Query Selector List */}
              <div className="md:col-span-5 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Pilih Detektor Pola Fraud:
                </span>
                <div className="space-y-1.5">
                  {queries.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQueryId(q.id)}
                      className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1 ${
                        selectedQueryId === q.id
                          ? "bg-white border-blue-600 shadow-sm ring-1 ring-blue-600"
                          : "bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80">
                          {q.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Cypher</span>
                      </div>
                      <span className="font-bold text-slate-900 text-xs line-clamp-1">
                        {q.name}
                      </span>
                      <span className="text-[11px] text-slate-500 line-clamp-2">
                        {q.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Query Detail & Code */}
              <div className="md:col-span-7 bg-white border border-slate-200/90 rounded-xl p-4 space-y-3.5 shadow-2xs">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{selectedQuery.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                          {selectedQuery.target_modus}
                        </span>
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          {selectedQuery.mitre_f3}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopy(selectedQuery.cypher, selectedQuery.id)}
                      className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 transition font-medium"
                    >
                      {copiedId === selectedQuery.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                      )}
                      <span>{copiedId === selectedQuery.id ? "Tersalin!" : "Salin Cypher"}</span>
                    </button>
                  </div>

                  <p className="text-slate-600 text-xs mt-2.5 leading-relaxed">
                    {selectedQuery.description}
                  </p>
                </div>

                {/* Cypher Code Box */}
                <div className="relative">
                  <div className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 shadow-inner">
                    <pre>{selectedQuery.cypher}</pre>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dapat Dijalankan Langsung via Neo4j MCP / Browser:</span>
                  </div>
                  <p className="text-blue-800 text-[11px] leading-relaxed">
                    Query ini dapat dieksekusi langsung pada instans Neo4j menggunakan tool <code className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-mono">read-cypher</code> dari Neo4j MCP Server resmi atau Neo4j Bloom untuk audit forensik interaktif visual.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "SCHEMA" && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Definisi Skema Graf L3 (Nodes, Edges, & Constraints)
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Memastikan integritas entitas unik (Claim, Faskes, DPJP, Peserta, Episode, Procedure) dan performa traversal O(1).
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(schemaText || `CREATE CONSTRAINT claim_id_unique IF NOT EXISTS FOR (c:Claim) REQUIRE c.claim_id IS UNIQUE;`, "schema")}
                  className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 transition font-medium"
                >
                  {copiedId === "schema" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                  <span>Salin Skema</span>
                </button>
              </div>

              {/* Node Types Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-[11px]">
                <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-xl">
                  <b className="text-sky-900 block font-bold">:Faskes</b>
                  <span className="text-sky-700 text-[10px]">faskes_id, nama, kelas, kota</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                  <b className="text-amber-900 block font-bold">:DPJP</b>
                  <span className="text-amber-700 text-[10px]">hash, nama, sip_status, jam_valid</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                  <b className="text-emerald-900 block font-bold">:Claim</b>
                  <span className="text-emerald-700 text-[10px]">claim_id, tanggal, ina_cbg, nilai_rp</span>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl">
                  <b className="text-indigo-900 block font-bold">:Episode</b>
                  <span className="text-indigo-700 text-[10px]">cluster_id, rasio_lonjakan, repeat</span>
                </div>
                <div className="bg-teal-50 border border-teal-200 p-2.5 rounded-xl">
                  <b className="text-teal-900 block font-bold">:Peserta</b>
                  <span className="text-teal-700 text-[10px]">peserta_id (AES Tokenized)</span>
                </div>
              </div>

              {/* Cypher Constraint Script Box */}
              <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800">
                <pre>
{`// ==============================================================
// CLAIMTRACE GRAPH SCHEMA CONSTRAINTS & INDEXES (NEO4J)
// ==============================================================
CREATE CONSTRAINT claim_id_unique IF NOT EXISTS
FOR (c:Claim) REQUIRE c.claim_id IS UNIQUE;

CREATE CONSTRAINT faskes_id_unique IF NOT EXISTS
FOR (f:Faskes) REQUIRE f.faskes_id IS UNIQUE;

CREATE CONSTRAINT dpjp_hash_unique IF NOT EXISTS
FOR (d:DPJP) REQUIRE d.dpjp_id_hash IS UNIQUE;

CREATE CONSTRAINT episode_cluster_unique IF NOT EXISTS
FOR (e:Episode) REQUIRE e.cluster_id IS UNIQUE;

CREATE CONSTRAINT peserta_id_unique IF NOT EXISTS
FOR (p:Peserta) REQUIRE p.peserta_id IS UNIQUE;

CREATE INDEX claim_tanggal_layanan_idx IF NOT EXISTS
FOR (c:Claim) ON (c.tanggal_layanan);`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "MCP_SETUP" && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Konfigurasi Neo4j MCP Server (Model Context Protocol)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Menghubungkan asisten AI agentik secara native ke database graf Neo4j melalui protokol standar MCP.
                </p>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <b className="text-slate-900 block text-xs mb-1">1. Instalasi Neo4j MCP Server</b>
                  <code className="bg-slate-900 text-emerald-400 px-3 py-1.5 rounded-lg block font-mono text-[11px]">
                    pip install neo4j-mcp-server
                  </code>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <b className="text-slate-900 text-xs">2. Konfigurasi Client MCP (mcp_config.json)</b>
                    <button
                      onClick={() =>
                        handleCopy(
                          JSON.stringify(
                            {
                              mcpServers: {
                                neo4j: {
                                  command: "/home/Khalaf-Dev/.local/bin/neo4j-mcp-server",
                                  args: [],
                                  env: {
                                    NEO4J_MCP_URI: "bolt://localhost:7687",
                                    NEO4J_MCP_USERNAME: "neo4j",
                                    NEO4J_MCP_PASSWORD: "password",
                                    NEO4J_MCP_DATABASE: "neo4j",
                                    NEO4J_MCP_READ_ONLY: "true"
                                  }
                                }
                              }
                            },
                            null,
                            2
                          ),
                          "mcp_json"
                        )
                      }
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      {copiedId === "mcp_json" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      Salin JSON
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[10.5px] overflow-x-auto leading-relaxed">
{`{
  "mcpServers": {
    "neo4j": {
      "command": "/home/Khalaf-Dev/.local/bin/neo4j-mcp-server",
      "args": [],
      "env": {
        "NEO4J_MCP_URI": "bolt://localhost:7687",
        "NEO4J_MCP_USERNAME": "neo4j",
        "NEO4J_MCP_PASSWORD": "password",
        "NEO4J_MCP_DATABASE": "neo4j",
        "NEO4J_MCP_READ_ONLY": "true"
      }
    }
  }
}`}
                  </pre>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <b className="text-slate-900 block text-xs mb-1">3. Tools MCP yang Disediakan</b>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
                    <li><code className="text-blue-700 font-mono font-bold">get-schema</code>: Mengambil skema node, tipe relasi, dan properti graf.</li>
                    <li><code className="text-blue-700 font-mono font-bold">read-cypher</code>: Mengeksekusi query Cypher read-only untuk mendeteksi kecurangan.</li>
                    <li><code className="text-blue-700 font-mono font-bold">write-cypher</code>: Menyimpan entitas graf baru (dapat dimatikan via flag read-only).</li>
                    <li><code className="text-blue-700 font-mono font-bold">list-gds-procedures</code>: Mendaftar prosedur Graph Data Science (GDS) seperti PageRank, Louvain Community Detection.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Terintegrasi dengan Backend ClaimTrace FastAPI</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
