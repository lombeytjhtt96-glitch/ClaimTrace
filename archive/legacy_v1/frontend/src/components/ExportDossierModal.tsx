"use client";
import React, { useState } from "react";
import { ClaimWithTriage } from "../types/claim";
import { X, Printer, Download, ShieldCheck, Copy, Check, FileSpreadsheet, Layers } from "lucide-react";

interface ExportDossierModalProps {
  claimItem: ClaimWithTriage;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportDossierModal({
  claimItem,
  isOpen,
  onClose,
}: ExportDossierModalProps) {
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const { claim, triage } = claimItem;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(claimItem, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Berkas_Siap_Audit_${claim.claim_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopySummary = () => {
    const textSummary = `=== LEMBAR TELAAH KLAIM ANOMALI PRA-BAYAR (CLAIMTRACE) ===
Nomor Berkas : BK-CT-${claim.claim_id}
Tanggal      : ${new Date().toLocaleDateString("id-ID")}
Fasilitas    : ${claim.nama_faskes} (Kelas ${claim.kelas_rs})
Kode CBG     : ${claim.ina_cbg_code} - ${claim.deskripsi_cbg}
Nilai Klaim  : Rp${claim.nilai_klaim_rp.toLocaleString("id-ID")}
-----------------------------------------------------------------
SKOR TRIASE & JALUR
Skor Prioritas Telaah: ${triage.final_priority_score}/100
Jalur Penetapan      : JALUR ${triage.triage_lane}
Hard Trigger Aktif   : ${triage.hard_trigger_activated ? "YA (SIP Expired)" : "TIDAK"}
Fusi Skor: S1(Pola)=${claim.s1_score} | S2(SDMK)=${claim.s2_score} | S3(MobileJKN)=${claim.s3_score}
-----------------------------------------------------------------
RINGKASAN BUKTI AUDIT:
${triage.ringkasan_bukti_audit}

KEMUNGKINAN PENJELASAN SAH (MITIGASI BIAS):
${triage.kemungkinan_penjelasan_sah}

REKOMENDASI SOP (PERPRES NO. 82/2018 PASAL 76 AYAT 2):
${triage.rekomendasi_sop}
-----------------------------------------------------------------
Segel Kriptografis SHA-256:
${triage.audit_hash}
Kepatuhan Regulasi: UU PDP No. 27/2022 & Perpres No. 82/2018
Tim Pengusul: TINEERENSE (MAN 1 Surakarta)
`;
    navigator.clipboard.writeText(textSummary);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownloadCSV = () => {
    const headers = "ID_Klaim,Faskes,Kelas_RS,Tanggal,INA_CBG,Deskripsi_CBG,Nilai_Rp,S1_Score,S2_Score,S3_Score,Skor_Prioritas,Jalur,Hard_Trigger,Audit_Hash\n";
    const row = `"${claim.claim_id}","${claim.nama_faskes}","${claim.kelas_rs}","${claim.tanggal_layanan}","${claim.ina_cbg_code}","${claim.deskripsi_cbg.replace(/"/g, '""')}",${claim.nilai_klaim_rp},${claim.s1_score},${claim.s2_score},${claim.s3_score},${triage.final_priority_score},"${triage.triage_lane}","${triage.hard_trigger_activated}","${triage.audit_hash}"\n`;
    const blob = new Blob([headers + row], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekapitulasi_Klaim_${claim.claim_id}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDownloadFHIR = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/claims/${claim.claim_id}/fhir`);
      if (res.ok) {
        const bundle = await res.json();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bundle, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `ClaimTrace_SATUSEHAT_FHIR_${claim.claim_id}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        return;
      }
    } catch {
      // Fallback: construct standard FHIR bundle locally
    }

    const localBundle = {
      resourceType: "Bundle",
      id: `bundle-claimtrace-${claim.claim_id.toLowerCase().replace(/_/g, "-")}`,
      type: "collection",
      timestamp: new Date().toISOString(),
      total: 9,
      entry: [
        { resource: { resourceType: "Patient", id: `pat-${claim.peserta_token_aes.substring(0, 10)}`, active: true } },
        { resource: { resourceType: "Practitioner", id: `prac-${claim.dpjp_meta.dpjp_id_hash.substring(0, 10)}`, name: [{ text: claim.dpjp_meta.nama_dpjp_alias }] } },
        { resource: { resourceType: "Organization", id: `org-${claim.faskes_id}`, name: claim.nama_faskes } },
        { resource: { resourceType: "Encounter", id: `enc-${claim.claim_id}`, status: "finished" } },
        { resource: { resourceType: "Condition", id: `cond-${claim.claim_id}`, code: { text: claim.icd10_primary } } },
        { resource: { resourceType: "Procedure", id: `proc-${claim.claim_id}`, code: { text: claim.icd9cm_procedure } } },
        { resource: { resourceType: "Claim", id: `claim-${claim.claim_id}`, total: { value: claim.nilai_klaim_rp, currency: "IDR" } } },
        { resource: { resourceType: "RiskAssessment", id: `risk-${claim.claim_id}`, prediction: [{ outcome: { text: triage.triage_lane } }] } },
        { resource: { resourceType: "Provenance", id: `prov-${claim.claim_id}`, signature: [{ data: triage.audit_hash }] } }
      ]
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localBundle, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ClaimTrace_SATUSEHAT_FHIR_${claim.claim_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200/80 bg-[#f8fafc]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Pratinjau Berkas Alasan Kasus Siap-Audit (Audit Dossier)
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs transition font-medium focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Salin ringkasan teks untuk berita acara"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copiedText ? "Tersalin!" : "Salin Teks"}</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs transition font-medium focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Unduh format spreadsheet CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleDownloadFHIR}
              className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs transition font-medium focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Unduh Bundle HL7 FHIR R4 (Kemenkes SATUSEHAT)"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>FHIR R4</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs transition font-medium focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              JSON
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-xl font-bold text-white transition shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Berkas
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Content (Formatted like Official Audit Sheet) */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed font-sans printable-area bg-white">
          {/* BPJS Letterhead */}
          <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 block">
                BPJS Kesehatan • Healthkathon 2026
              </span>
              <h1 className="text-base font-black text-slate-900 mt-0.5">
                LEMBAR TELAAH KLAIM ANOMALI PRA-BAYAR (CLAIMTRACE)
              </h1>
              <p className="text-[11px] text-slate-600">
                Sistem Pendukung Keputusan Verifikator Klaim JKN • Bukti Deterministik Bebas Halusinasi
              </p>
            </div>
            <div className="text-right font-mono text-[11px]">
              <div>Nomor Berkas: <b className="text-slate-900">BK-CT-{claim.claim_id}</b></div>
              <div className="text-slate-500">Tanggal Telaah: {new Date().toLocaleDateString("id-ID")}</div>
            </div>
          </div>

          {/* Section 1: Profil Klaim */}
          <div>
            <h3 className="font-bold text-emerald-800 text-xs uppercase tracking-wider mb-2">
              1. Identitas Berkas Klaim
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">ID KLAIM</span>
                <span className="text-slate-900 font-bold">{claim.claim_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">TANGGAL LAYANAN</span>
                <span className="text-slate-900 font-semibold">{claim.tanggal_layanan}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">KODE INA-CBG</span>
                <span className="text-emerald-800 font-bold">{claim.ina_cbg_code}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">NILAI TAGIHAN</span>
                <span className="text-slate-900 font-bold">Rp{claim.nilai_klaim_rp.toLocaleString("id-ID")}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px]">FASILITAS KESEHATAN</span>
                <span className="text-slate-800 font-medium">{claim.nama_faskes} (Kelas {claim.kelas_rs})</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px]">DESKRIPSI TINDAKAN / ICD-10</span>
                <span className="text-slate-800 font-medium">{claim.deskripsi_cbg} | {claim.icd10_primary}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Fusi Skor & Bukti 3 Lapis */}
          <div>
            <h3 className="font-bold text-emerald-800 text-xs uppercase tracking-wider mb-2">
              2. Rekonsiliasi Multi-Sinyal 3 Lapis
            </h3>
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="p-2.5 rounded bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] text-indigo-700 font-bold uppercase block">Lapis 1 • Radar Pola (50%)</span>
                <div className="text-sm font-black text-slate-900 mt-1 font-mono">S1 = {claim.s1_score}</div>
                <p className="text-[10px] text-slate-600 mt-1">
                  Lonjakan: {claim.episode_meta.rasio_lonjakan_baseline}x baseline ({claim.episode_meta.jumlah_klaim_klaster} klaim)
                </p>
              </div>

              <div className="p-2.5 rounded bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] text-amber-700 font-bold uppercase block">Lapis 2 • SDMK DPJP (30%)</span>
                <div className="text-sm font-black text-slate-900 mt-1 font-mono">S2 = {claim.s2_score}</div>
                <p className="text-[10px] text-slate-600 mt-1">
                  SIP: <b className={claim.dpjp_meta.sip_status === "EXPIRED" ? "text-rose-700" : "text-emerald-700"}>{claim.dpjp_meta.sip_status}</b> ({claim.dpjp_meta.nama_dpjp_alias})
                </p>
              </div>

              <div className="p-2.5 rounded bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] text-sky-700 font-bold uppercase block">Lapis 3 • Mobile JKN (20%)</span>
                <div className="text-sm font-black text-slate-900 mt-1 font-mono">S3 = {claim.s3_score}</div>
                <p className="text-[10px] text-slate-600 mt-1">
                  Respons Tolak: {claim.mobile_meta.respon_tidak_hadir} dari {claim.mobile_meta.sampel_terkirim} sampel
                </p>
              </div>
            </div>

            <div className="mt-2 p-2.5 bg-slate-100 rounded-xl border border-slate-200 flex justify-between items-center font-mono">
              <span className="text-slate-700">Formula Fusi: 0.5×({claim.s1_score}) + 0.3×({claim.s2_score}) + 0.2×({claim.s3_score})</span>
              <span className="font-bold text-slate-900 text-sm">
                Skor Prioritas: {triage.final_priority_score}/100 (Jalur {triage.triage_lane})
              </span>
            </div>
          </div>

          {/* Section 3: Indikator & Berkas Siap-Audit */}
          <div className="space-y-3">
            <h3 className="font-bold text-emerald-800 text-xs uppercase tracking-wider">
              3. Berkas Alasan Kasus & Rekomendasi Yuridis
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-900 block text-[11px]">Kode Indikator Pelanggaran:</span>
              {triage.kode_indikator.map((ind, i) => (
                <div key={i} className="text-slate-800 text-[11px] flex items-start gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span> {ind}
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
              <span className="font-bold text-amber-900 block text-[11px] mb-1">
                Kemungkinan Penjelasan Sah (Mitigasi Bias Layanan Sah):
              </span>
              <p className="text-amber-950 text-[11px] leading-relaxed">
                {triage.kemungkinan_penjelasan_sah}
              </p>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <span className="font-bold text-emerald-900 block text-[11px] mb-1">
                Rekomendasi Tindak Lanjut SOP (Perpres No. 82/2018):
              </span>
              <p className="text-emerald-950 text-[11px] leading-relaxed">
                {triage.rekomendasi_sop}
              </p>
            </div>
          </div>

          {/* Section 4: Standar Interoperabilitas SATUSEHAT (HL7 FHIR R4) */}
          <div className="space-y-2 pt-1">
            <h3 className="font-bold text-indigo-900 text-xs uppercase tracking-wider flex items-center justify-between">
              <span>4. Interoperabilitas Data Klinis • SATUSEHAT Kemenkes RI (HL7 FHIR R4)</span>
              <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                UU PDP No. 27/2022 Compliant
              </span>
            </h3>

            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-2">
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Berkas klaim ini kompatibel penuh dengan standar pertukaran data kesehatan nasional <b>Kementerian Kesehatan RI (SATUSEHAT)</b> melalui 9 sumber daya FHIR R4 terpadu:
              </p>

              <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                <div className="bg-white p-1.5 rounded border border-indigo-100 text-slate-800">
                  <b className="text-indigo-800">Patient:</b> NIK & No. Kartu (Masked)
                </div>
                <div className="bg-white p-1.5 rounded border border-indigo-100 text-slate-800">
                  <b className="text-indigo-800">Practitioner:</b> SDMK & Status SIP
                </div>
                <div className="bg-white p-1.5 rounded border border-indigo-100 text-slate-800">
                  <b className="text-indigo-800">Organization:</b> FKRTL & Kelas RS
                </div>
                <div className="bg-white p-1.5 rounded border border-indigo-100 text-slate-800">
                  <b className="text-indigo-800">Encounter:</b> Episode Rawat & Durasi
                </div>
                <div className="bg-white p-1.5 rounded border border-indigo-100 text-slate-800">
                  <b className="text-indigo-800">Condition:</b> ICD-10 ({claim.icd10_primary})
                </div>
                <div className="bg-white p-1.5 rounded border border-indigo-100 text-slate-800">
                  <b className="text-indigo-800">Procedure:</b> ICD-9-CM ({claim.icd9cm_procedure})
                </div>
                <div className="bg-white p-1.5 rounded border border-indigo-100 text-slate-800">
                  <b className="text-indigo-800">Claim:</b> INA-CBG ({claim.ina_cbg_code})
                </div>
                <div className="bg-white p-1.5 rounded border border-indigo-100 text-slate-800">
                  <b className="text-indigo-800">RiskAssessment:</b> Triase ClaimTrace
                </div>
                <div className="bg-white p-1.5 rounded border border-indigo-100 text-slate-800">
                  <b className="text-indigo-800">Provenance:</b> Segel SHA-256
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Cryptographic Seal & Signatures */}
          <div className="pt-4 border-t-2 border-slate-300 flex justify-between items-end font-mono text-[10px] text-slate-600">
            <div>
              <div>Segel Kriptografis SHA-256 (Tamper-Evident):</div>
              <div className="text-emerald-800 font-bold select-all break-all text-xs">
                {triage.audit_hash}
              </div>
              <div className="text-slate-500 mt-0.5">
                *Tercatat pada blok audit nomor berantai tidak dapat dimanipulasi secara diam-diam.
              </div>
            </div>

            <div className="text-right">
              <div className="text-slate-600">Verifikator JKN:</div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                (Tim TINEERENSE BPJS Kesehatan)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
