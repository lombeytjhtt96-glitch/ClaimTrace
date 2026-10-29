"""
REA Forensics & Client Reverse Engineering Engine for ClaimTrace
BPJS Kesehatan Healthkathon 2026 - Kategori: Efisiensi Risiko pada Faskes
Fokus: #6 Phantom Billing & #11 Repeat Billing
Inspired by morluto/rea (REA: Reverse Engineer Anything v6.7.0)

Provides static analysis, decompilation evidence, and tampering detection for:
1. SIMRS automated claim injection scripts (Modus #6 Phantom Billing)
2. Counterfeit / repacked Mobile JKN APK clients (Presensi fiktif bot)
3. Modified vClaim bridging adapters & DLL hooks (Upcoding & duplicate bypass)
4. Evidence-backed forensic ledger generation
"""

import hashlib
import json
import re
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

# Curated Forensic Samples representing real-world IT audit discoveries in healthcare fraud
FORENSIC_SAMPLES_CATALOG = {
    "FS-SIMRS-INJECTOR": {
        "target_id": "FS-SIMRS-INJECTOR",
        "title": "SIMRS Automated Claim Injector Script",
        "category": "JavaScript / SIMRS Web Hook",
        "filename": "simrs_auto_claim_injector.js",
        "target_faskes": "RS Khusus Mitra Husada",
        "associated_cluster": "CLS-PHANTOM-85",
        "sha256": "7d9b4f2c8a1e3b5d6f0c4a7e9b2d8f1a3c5e7b9d1f3a5c7e9b2d4f6a8c0e2b4d",
        "source_code": """// SIMRS Auto-Claim Injection Daemon (Discovered in Faskes Auditing)
// Forges 85 simultaneous claims for INA-CBG Z-3-12-0 without physical consultation
const axios = require('axios');
const patientTokens = require('./harvested_jkn_participants.json');

async function batchInjectClaims() {
  console.log('[!] Starting batch claim injection for cluster CLS-PHANTOM-85...');
  for (let i = 0; i < patientTokens.length; i++) {
    const payload = {
      nomor_sep: `SEP-20261014-99${String(i).padStart(3, '0')}`,
      token_peserta_aes: patientTokens[i],
      faskes_id: "FSK-RSX-01",
      tanggal_layanan: "2026-10-14",
      ina_cbg: "Z-3-12-0",
      dpjp_id_hash: "dr_hendra_kfr_hash",
      nilai_klaim_rp: 15300000,
      skip_mobile_jkn_push: true, // Bypass notification flag
      bypass_biometric_validation: true // Direct database injection
    };
    await axios.post('http://internal-simrs/bridge/vclaim/submit', payload);
  }
}
batchInjectClaims();""",
        "risk_verdict": "CRITICAL_FRAUD_INJECTOR",
        "mitre_f3": "FA0002.001 (Automated Phantom Billing Fabricator)",
        "detected_anomalies": [
            "Loop injeksi otomatis 85 berkas klaim massal tanpa rekaman EMR/SIMRS fisik",
            "Parameter manipulasi 'skip_mobile_jkn_push: true' untuk menghindari notifikasi peserta",
            "Bypass validasi biometrik wajah/sidik jari di pintu masuk poliklinik",
            "Penggunaan token kepesertaan hasil panen kegiatan baksos lampau"
        ]
    },
    "FS-APK-JKN-BOT": {
        "target_id": "FS-APK-JKN-BOT",
        "title": "Counterfeit Mobile JKN Repacked APK Client",
        "category": "Android APK / Dalvik Bytecode",
        "filename": "mobile_jkn_spoof_client.apk",
        "target_faskes": "RS Daerah Kartini (Kelas B)",
        "associated_cluster": "CLS-PHANTOM-75",
        "sha256": "4a8c0e2b4d7d9b4f2c8a1e3b5d6f0c4a7e9b2d8f1a3c5e7b9d1f3a5c7e9b2d8f",
        "decompiled_summary": """Class: com.bpjs.mobilejkn.service.AttendanceVerificationService
Hook: Xposed / Frida injection targeting checkInLocation() and confirmAttendance()
Bypass Logic:
- Overrides GPS Location Provider with fixed coordinates (-7.5583, 110.8272)
- Replaces camera preview feed with pre-recorded static JPG selfie
- Forges HTTP POST to /api/v1/mobile/confirm with status: ATTENDED_AUTO_CONFIRMED""",
        "risk_verdict": "CRITICAL_SPOOFING_CLIENT",
        "mitre_f3": "F1005.006 (Beneficiary Impersonation Bot)",
        "detected_anomalies": [
            "Sertifikat penandatanganan APK tidak cocok dengan SHA-256 resmi BPJS Kesehatan",
            "Pustaka Hooking libfrida-gadget.so disematkan dalam folder lib/arm64-v8a",
            "Pemalsuan koordinat geolokasi faskes secara statis (GPS Spoofing)",
            "Automasi konfirmasi presensi biner palsu pada lapis 3 triase pra-bayar"
        ]
    },
    "FS-VCLAIM-BRIDGE-HOOK": {
        "target_id": "FS-VCLAIM-BRIDGE-HOOK",
        "title": "vClaim Bridging Adapter IL/CIL Hook",
        "category": ".NET Assembly / CIL Bytecode",
        "filename": "BPJS.Bridging.Adapter.vClaim.dll",
        "target_faskes": "RS Medika Prima",
        "associated_cluster": "CLS-UPCODING-8806",
        "sha256": "3c5e7b9d1f3a5c7e9b2d4f6a8c0e2b4d7d9b4f2c8a1e3b5d6f0c4a7e9b2d8f1a",
        "decompiled_summary": """Method: BPJS.Bridging.Adapter.vClaim.GrouperService::MapInaCbgCode(ClaimRecord record)
CIL Instruction Patch:
IL_0012: ldarg.1
IL_0013: ldfld string ClaimRecord::PrimaryDiagnosis
IL_0018: ldstr "K29.7" // Gastritis Ringan (Tarif Rp1.950.000)
IL_001d: call bool [mscorlib]System.String::op_Equality(string, string)
IL_0022: brfalse.s IL_0035
// PATCH INJECTED: Intercept and upcode to K-1-10-III (Tarif Rp28.600.000)
IL_0024: ldarg.1
IL_0025: ldstr "K-1-10-III"
IL_002a: stfld string ClaimRecord::InaCbgCode
IL_002f: ldarg.1
IL_0030: ldc.i8 28600000
IL_0035: ret""",
        "risk_verdict": "CRITICAL_UPCODING_INTERCEPTOR",
        "mitre_f3": "FA0001.002 (Grouper Interception & INA-CBG Upcoding)",
        "detected_anomalies": [
            "Injeksi instruksi CIL IL_0024 yang mengubah kode CBG K-4-17-I menjadi K-1-10-III",
            "Penggelembungan nilai klaim sebesar 14.6x (dari Rp1.950.000 menjadi Rp28.600.000)",
            "Checksum PE header berbeda dari berkas adapter vClaim terverifikasi BPJS",
            "Memicu sinyal diskrepansi diagnosis Lapis 1 pada klaim CLM-2026-8806"
        ]
    }
}

class ReaForensicsEngine:
    """
    Engine Forensik Klien & Analisis Binary/Script Terintegrasi ClaimTrace.
    Mengadaptasi metodologi morluto/rea (Evidence-backed client reverse engineering).
    """
    _instance: Optional["ReaForensicsEngine"] = None

    @classmethod
    def get_instance(cls) -> "ReaForensicsEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def list_samples(self) -> List[Dict[str, Any]]:
        """Mengembalikan daftar berkas bukti forensik klien yang tersedia"""
        return list(FORENSIC_SAMPLES_CATALOG.values())

    def get_sample(self, target_id: str) -> Optional[Dict[str, Any]]:
        """Mengambil rincian berkas bukti forensik berdasarkan target_id"""
        return FORENSIC_SAMPLES_CATALOG.get(target_id)

    def analyze_script_content(self, script_text: str) -> Dict[str, Any]:
        """
        Analisis statis heuristik kode JavaScript/SIMRS kustom:
        Mendeteksi pola loop injeksi, bypass notifikasi, dan manipulasi data peserta.
        """
        clean_text = script_text.strip()
        sha256_hash = hashlib.sha256(clean_text.encode("utf-8")).hexdigest()

        anomalies = []
        risk_score = 0

        # Pattern 1: Batch loop / bulk iteration
        if re.search(r"for\s*\([^)]*patientTokens|while\s*\(|batchInject", clean_text, re.IGNORECASE):
            anomalies.append("Terdeteksi loop iterasi massal token kepesertaan (Indikasi Modus #6 Batch Injection)")
            risk_score += 40

        # Pattern 2: Bypass Mobile JKN
        if re.search(r"skip_mobile_jkn|bypass_mobile|no_push|disable_notification", clean_text, re.IGNORECASE):
            anomalies.append("Terdeteksi parameter bypass notifikasi Mobile JKN (Menghindari konfirmasi peserta Lapis 3)")
            risk_score += 30

        # Pattern 3: Biometric bypass
        if re.search(r"bypass_biometric|skip_face|skip_fingerprint", clean_text, re.IGNORECASE):
            anomalies.append("Terdeteksi parameter bypass validasi biometrik fisik poliklinik")
            risk_score += 25

        # Pattern 4: Direct bridging API call
        if re.search(r"axios\.post|fetch\(|http://.*/bridge/vclaim", clean_text, re.IGNORECASE):
            anomalies.append("Terdeteksi pemanggilan langsung ke API bridging vClaim secara tidak wajar")
            risk_score += 15

        verdict = "BERSIH"
        if risk_score >= 70:
            verdict = "MALICIOUS_INJECTOR_CRITICAL"
        elif risk_score >= 35:
            verdict = "SUSPICIOUS_SCRIPT_WARNING"

        return {
            "status": "success",
            "artifact_sha256": sha256_hash,
            "line_count": len(clean_text.splitlines()),
            "risk_score": min(risk_score, 100),
            "verdict": verdict,
            "detected_anomalies": anomalies,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "rea_framework": "morluto/rea v6.7.0 Static Analysis Engine"
        }

    def get_rea_tools_catalog(self) -> List[Dict[str, Any]]:
        """Katalog tools resmi REA yang relevan dengan audit sistem BPJS"""
        return [
            {
                "tool": "analyze-javascript-application",
                "category": "JavaScript / Electron",
                "description": "Rekonstruksi statis aplikasi klien SIMRS berbasis Electron/Web tanpa eksekusi",
                "evidence_type": "Application Graph & Route Boundaries"
            },
            {
                "tool": "inspect_native_binary",
                "category": "Native Binary",
                "description": "Inspeksi simbol, dependensi DLL, dan pseudocode adapter vClaim eksternal",
                "evidence_type": "Decompiled C/Assembly & Symbol Table"
            },
            {
                "tool": "decode-android-resources",
                "category": "Android APK",
                "description": "Dekode berkas manifest, resource XML, dan string tabel aplikasi Mobile JKN",
                "evidence_type": "Decoded Manifest & Certificate Hash"
            },
            {
                "tool": "compare-application-versions",
                "category": "Integrity Verification",
                "description": "Bandingkan struktur AST aplikasi klien resmi BPJS vs versi faskes",
                "evidence_type": "Structural AST Diff & Integrity Delta"
            },
            {
                "tool": "inspect_sqlite_database",
                "category": "Database Forensics",
                "description": "Inspeksi basis data SQLite lokal workstation faskes untuk jejak audit tersembunyi",
                "evidence_type": "Schema, Index & Deleted Row Carving"
            },
            {
                "tool": "build-reconstruction-obligation-ledger",
                "category": "Evidence Ledger",
                "description": "Penerbitan buku besar kewajiban bukti rekonstruksi digital anti-rekayasa",
                "evidence_type": "Deterministic Evidence Ledger"
            }
        ]

rea_engine = ReaForensicsEngine.get_instance()
