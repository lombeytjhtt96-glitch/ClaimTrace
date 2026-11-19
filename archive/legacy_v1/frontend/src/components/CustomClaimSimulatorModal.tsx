"use client";
import React, { useState } from "react";
import { ClaimWithTriage, TriageLane, SipStatus } from "../types/claim";
import { X, Sparkles, Zap, ShieldCheck, Plus, Check } from "lucide-react";

interface CustomClaimSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomClaim: (newClaimItem: ClaimWithTriage) => void;
}

export default function CustomClaimSimulatorModal({
  isOpen,
  onClose,
  onAddCustomClaim,
}: CustomClaimSimulatorModalProps) {
  const [claimId, setClaimId] = useState<string>("CLM-2026-CUSTOM");
  const [namaFaskes, setNamaFaskes] = useState<string>("RS Pengujian Sehat");
  const [kelasRs, setKelasRs] = useState<"A" | "B" | "C" | "Klinik">("B");
  const [cbgCode, setCbgCode] = useState<string>("N-3-10-0");
  const [cbgDesc, setCbgDesc] = useState<string>("Prosedur Hemodialisis & Ginjal");
  const [nilaiKlaim, setNilaiKlaim] = useState<number>(4500000);
  const [s1, setS1] = useState<number>(50);
  const [s2, setS2] = useState<number>(50);
  const [s3, setS3] = useState<number>(50);
  const [sipStatus, setSipStatus] = useState<SipStatus>("ACTIVE");
  const [sampleSent, setSampleSent] = useState<number>(10);
  const [sampleDenied, setSampleDenied] = useState<number>(2);

  if (!isOpen) return null;

  // Real-time deterministic calculation: S = 0.5*S1 + 0.3*S2 + 0.2*S3
  const s1Contrib = Number((0.5 * s1).toFixed(2));
  const s2Contrib = Number((0.3 * s2).toFixed(2));
  const s3Contrib = Number((0.2 * s3).toFixed(2));
  const rawScore = Number((s1Contrib + s2Contrib + s3Contrib).toFixed(1));

  let finalScore = rawScore;
  let hardTrigger = false;
  let triggerReason = "";

  if (sipStatus === "EXPIRED") {
    hardTrigger = true;
    triggerReason = "Hard Trigger Lapis 2: Izin Praktik (SIP) DPJP berakhir pada tanggal layanan.";
    finalScore = Math.max(finalScore, 75.0);
  }

  let lane: TriageLane = "HIJAU";
  if (finalScore >= 75.0) {
    lane = "MERAH";
  } else if (finalScore >= 50.0) {
    lane = "KUNING";
  } else {
    lane = "HIJAU";
  }

  if (sipStatus === "UNSYNCED" && lane === "HIJAU") {
    lane = "KUNING"; // Administrative uncertainty principle
  }

  const handleCreateAndAdd = () => {
    const attended = Math.max(0, sampleSent - sampleDenied);
    const newClaim: ClaimWithTriage = {
      claim: {
        claim_id: claimId.trim() || `CLM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        faskes_id: `FSK-CUST-${Math.floor(10 + Math.random() * 90)}`,
        nama_faskes: namaFaskes.trim() || "RS Pengujian Interaktif",
        kelas_rs: kelasRs,
        peserta_token_aes: `AES256_${Math.random().toString(16).substring(2, 10)}`,
        tanggal_layanan: new Date().toISOString().split("T")[0],
        ina_cbg_code: cbgCode.trim() || "Z-0-00-0",
        deskripsi_cbg: cbgDesc.trim() || "Layanan Penanganan Kasus Kustom",
        icd10_primary: "R69 (Illness, unspecified)",
        icd9cm_procedure: "89.03 (Clinical Examination)",
        nilai_klaim_rp: Number(nilaiKlaim) || 2500000,
        s1_score: s1,
        s2_score: s2,
        s3_score: s3,
        episode_meta: {
          cluster_id: "CLS-CUSTOM-TEST",
          jumlah_klaim_klaster: Math.round(s1 / 10) + 1,
          rasio_lonjakan_baseline: Number((s1 / 20).toFixed(1)),
          indikasi_repeat_billing: false,
          terdaftar_baksos_resmi: false,
        },
        dpjp_meta: {
          dpjp_id_hash: `SDMK-DR-${Math.floor(1000 + Math.random() * 9000)}`,
          nama_dpjp_alias: "dr. Spesialis Pengujian (Simulasi Kustom)",
          sip_status: sipStatus,
          sip_expiry_date: sipStatus === "EXPIRED" ? "2026-10-01" : "2027-12-31",
          jam_praktik_valid: sipStatus !== "EXPIRED",
          faskes_terdaftar: namaFaskes,
          catatan_sdmk:
            sipStatus === "EXPIRED"
              ? "SIP Terbukti Berakhir pada Tanggal Layanan (Hard Trigger Aktif)"
              : sipStatus === "UNSYNCED"
              ? "Profil DPJP belum tersinkronisasi di SATUSEHAT SDMK (Ketidakpastian Administratif)"
              : "SIP Aktif & Jam Praktik Terverifikasi di SATUSEHAT SDMK",
        },
        mobile_meta: {
          sampel_terkirim: sampleSent,
          respon_tidak_hadir: sampleDenied,
          respon_hadir: attended,
          status_konfirmasi:
            sampleDenied > 0 ? "ANOMALY_DENIED" : attended > 0 ? "VERIFIED_ATTENDED" : "PENDING_UNCONFIRMED",
        },
      },
      triage: {
        claim_id: claimId,
        raw_weighted_score: rawScore,
        final_priority_score: finalScore,
        triage_lane: lane,
        hard_trigger_activated: hardTrigger,
        hard_trigger_reason: hardTrigger ? triggerReason : undefined,
        score_breakdown: {
          s1_value: s1,
          s1_weight: 0.5,
          s1_contribution: s1Contrib,
          s2_value: s2,
          s2_weight: 0.3,
          s2_contribution: s2Contrib,
          s3_value: s3,
          s3_weight: 0.2,
          s3_contribution: s3Contrib,
        },
        kode_indikator: [
          `IND-SIM-FUSION: Skor Fusi Deterministik S = 0.5*(${s1}) + 0.3*(${s2}) + 0.2*(${s3}) = ${finalScore}`,
          sipStatus === "EXPIRED"
            ? "IND-L2-SIP-EXP: SIP DPJP tercatat berakhir pada tanggal layanan (Hard Trigger Lapis 2)"
            : sipStatus === "UNSYNCED"
            ? "IND-L2-SDMK-SYNC: Profil DPJP dalam proses sinkronisasi SATUSEHAT SDMK"
            : "IND-L2-SIP-ACTIVE: SIP Aktif terverifikasi resmi",
          sampleDenied > 0
            ? `IND-L3-PRESENSI: ${sampleDenied}/${sampleSent} sampel peserta menyatakan tidak hadir via Mobile JKN`
            : "IND-L3-VERIFIED: Konfirmasi kehadiran peserta konsisten",
        ],
        ringkasan_bukti_audit: `Klaim uji kustom ${claimId} di ${namaFaskes} (${cbgCode}) menghasilkan Skor Prioritas ${finalScore}/100 [S1=${s1}, S2=${s2}, S3=${s3}]. Status Jalur: ${lane}.`,
        kemungkinan_penjelasan_sah:
          sipStatus === "UNSYNCED"
            ? "Jeda sinkronisasi server SATUSEHAT SDMK Kemenkes (Prinsip Anti-Bias: Bukan Vonis Fraud Sepihak)."
            : "Verifikasi dokumen pendukung SIMRS dan kelayakan administratif berkas.",
        rekomendasi_sop:
          lane === "MERAH"
            ? "Prioritaskan klarifikasi berkas ke faskes sesuai SOP verifikasi sebelum batas berita acara 10 hari kerja (Perpres 82/2018)."
            : lane === "KUNING"
            ? "Kirimkan klarifikasi administratif digital ke faskes tanpa menunda berkas klaim lainnya."
            : "Lanjutkan ke alur verifikasi cepat pra-bayar (Fast-Track / Jalur Hijau).",
        audit_hash: `sha256_${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
        mitre_f3_tags:
          lane === "MERAH"
            ? ["FA0001 (Positioning)", "FA0002 (Monetization)"]
            : lane === "KUNING"
            ? ["FA0001 (Administrative Boundary / SDMK Sync Delay)"]
            : [],
        regulatory_basis: [
          "Perpres No. 82/2018 Pasal 76 ayat (2) (SLA Vedika 10 Hari Kerja)",
          "UU Perlindungan Data Pribadi No. 27/2022 (Minimasi Data & Privasi Peserta)"
        ],
        sla_deadline_days: lane === "MERAH" ? 3 : lane === "KUNING" ? 5 : 2,
        graph_data: {
          nodes: [
            { id: "FSK-CUST", label: namaFaskes, type: "FASKES", status: `Kelas ${kelasRs}`, risk_level: s1 >= 70 ? "MEDIUM" : "LOW" },
            { id: "SDMK-CUST", label: `dr. Simulasi (${sipStatus})`, type: "DPJP", status: `Status SIP: ${sipStatus}`, risk_level: sipStatus === "EXPIRED" ? "HIGH" : "LOW" },
            { id: "CLS-CUST", label: "Klaster Kustom", type: "EPISODE", status: `Skor S1: ${s1}`, risk_level: s1 >= 75 ? "HIGH" : "LOW" },
            { id: claimId, label: `Klaim (${cbgCode})`, type: "CLAIM", status: `Rp${nilaiKlaim.toLocaleString("id-ID")}`, risk_level: lane === "MERAH" ? "HIGH" : "LOW" },
            { id: "PES-CUST", label: "Peserta (AES256_...)", type: "PESERTA", status: `${sampleDenied} Tolak Hadir`, risk_level: sampleDenied > 0 ? "HIGH" : "LOW" },
          ],
          edges: [
            { source: "FSK-CUST", target: "SDMK-CUST", label: "Penugasan SDMK", is_anomaly: sipStatus === "EXPIRED" },
            { source: "SDMK-CUST", target: claimId, label: "DPJP Pemeriksa", is_anomaly: sipStatus === "EXPIRED" },
            { source: claimId, target: "CLS-CUST", label: "Anggota Klaster", is_anomaly: s1 >= 75 },
            { source: claimId, target: "PES-CUST", label: "Presensi Mobile JKN", is_anomaly: sampleDenied > 0 },
          ],
        },
      },
    };

    onAddCustomClaim(newClaim);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200/80 bg-[#f8fafc]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Uji Klaim Baru (Simulator Interaktif Mandiri)
              </h2>
              <p className="text-[11px] text-slate-500">
                Simulasi Fusi Multi-Sinyal 3 Lapis & Evaluasi Aturan Prioritas Secara Real-Time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed font-sans custom-scrollbar">
          {/* Live Outcome Preview Box */}
          <div
            className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
              lane === "MERAH"
                ? "bg-[#fff1f0] border-[#ffa39e]"
                : lane === "KUNING"
                ? "bg-[#fffbe6] border-[#ffe58f]"
                : "bg-[#f6ffed] border-[#b7eb8f]"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    lane === "MERAH"
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : lane === "KUNING"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-emerald-100 text-emerald-800 border-emerald-300"
                  }`}
                >
                  JALUR {lane}
                </span>
                {hardTrigger && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    <Zap className="w-3 h-3 text-rose-600" />
                    HARD TRIGGER AKTIF
                  </span>
                )}
                {sipStatus === "UNSYNCED" && (
                  <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Mitigasi Bias SDMK
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-600 mt-1 font-mono">
                Formula: 0.5×({s1}) + 0.3×({s2}) + 0.2×({s3}) = <b>{rawScore}</b>
                {hardTrigger && " ➔ Dinaikkan ke ≥ 75.0 (SIP Expired)"}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Skor Prioritas</span>
              <span className="text-2xl font-black font-mono text-slate-900">{finalScore}</span>
              <span className="text-slate-400 text-xs font-mono font-bold"> / 100</span>
            </div>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                ID Klaim
              </label>
              <input
                type="text"
                value={claimId}
                onChange={(e) => setClaimId(e.target.value)}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Nama Faskes & Kelas RS
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={namaFaskes}
                  onChange={(e) => setNamaFaskes(e.target.value)}
                  className="flex-1 bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
                />
                <select
                  value={kelasRs}
                  onChange={(e) => setKelasRs(e.target.value as "A" | "B" | "C" | "Klinik")}
                  className="bg-[#f8fafc] border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
                >
                  <option value="A">Kelas A</option>
                  <option value="B">Kelas B</option>
                  <option value="C">Kelas C</option>
                  <option value="Klinik">Klinik</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Kode & Deskripsi INA-CBG
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cbgCode}
                  onChange={(e) => setCbgCode(e.target.value)}
                  className="w-24 bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  value={cbgDesc}
                  onChange={(e) => setCbgDesc(e.target.value)}
                  className="flex-1 bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Nilai Tagihan Klaim (Rp)
              </label>
              <input
                type="number"
                value={nilaiKlaim}
                onChange={(e) => setNilaiKlaim(Number(e.target.value))}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Signal Sliders */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
              Pengaturan Nilai Sinyal 3 Lapis (0 – 100)
            </span>

            {/* S1 Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-blue-700">Lapis 1 • Radar Pola Klaster (Bobot 50%):</span>
                <span className="font-mono font-bold text-slate-900">S1 = {s1} (Kontribusi: {s1Contrib})</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={s1}
                onChange={(e) => setS1(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* S2 Slider & Status SIP */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-amber-700">Lapis 2 • Uji SDMK DPJP (Bobot 30%):</span>
                <span className="font-mono font-bold text-slate-900">S2 = {s2} (Kontribusi: {s2Contrib})</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={s2}
                onChange={(e) => setS2(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-slate-600 font-medium">Status SIP DPJP:</span>
                <div className="flex gap-1.5">
                  {(["ACTIVE", "EXPIRED", "UNSYNCED"] as SipStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSipStatus(status)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold font-mono transition ${
                        sipStatus === status
                          ? status === "EXPIRED"
                            ? "bg-rose-600 text-white border-rose-600"
                            : status === "UNSYNCED"
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* S3 Slider & Sample Count */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-sky-700">Lapis 3 • Presensi Mobile JKN (Bobot 20%):</span>
                <span className="font-mono font-bold text-slate-900">S3 = {s3} (Kontribusi: {s3Contrib})</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={s3}
                onChange={(e) => setS3(Number(e.target.value))}
                className="w-full accent-sky-600"
              />
              <div className="flex items-center gap-3 pt-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">Sampel:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={sampleSent}
                    onChange={(e) => setSampleSent(Math.max(1, Number(e.target.value)))}
                    className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 font-mono text-xs text-center"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">Tolak Hadir:</span>
                  <input
                    type="number"
                    min="0"
                    max={sampleSent}
                    value={sampleDenied}
                    onChange={(e) => setSampleDenied(Math.min(sampleSent, Math.max(0, Number(e.target.value))))}
                    className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 font-mono text-xs text-center text-rose-600 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200/80 bg-[#f8fafc] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Kepatuhan UU PDP No. 27/2022 & Perpres 82/2018</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleCreateAndAdd}
              className="px-4 py-2 rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambahkan ke Antrean Triase</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
