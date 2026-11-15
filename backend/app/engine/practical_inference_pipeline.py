"""
Production-Grade AI Inference Pipeline for ClaimTrace JKN.

Implements the 6-Stage FastAPI Pipeline Architecture from Said Achmad (BINUS University),
"Building Practical AI Inference Pipeline: From Data to API" (Healthkathon 2026):
1. Client Request (POST /verify & POST /api/v1/verify)
2. Strict Pydantic Schema Validation (ClaimVerificationRequest)
3. Vectorized NumPy Feature Engineering (cost ratio, LOS z-score, severity mismatch,
   Lapis 1 episode spike, Lapis 2 SDMK SIP/geovelocity, Lapis 3 Mobile JKN, Lapis 4 RME coherence)
4. In-Memory ML Inference (StandardScaler + RandomForestClassifier loaded once at startup
   from .pkl artifact for < 15 ms latency, well below the < 1.0s production target)
5. Asynchronous LLM Service (httpx.AsyncClient) with:
   - Context Handover (ML probability + 4-Layer scores handed to LLM)
   - Behavior Bounding (strictly bounded to Permenkes 26/2021, Perpres 82/2018, Human-in-the-Loop)
   - Structured JSON Output
6. Resilient Local Rule Engine Fallback:
   - Guarantees HTTP 200 OK even when external LLM API times out, fails, or is offline.
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
import joblib
import numpy as np
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler


class ClaimVerificationRequest(BaseModel):
    """Pydantic schema validation for Stage 2 of the AI Inference Pipeline."""

    claim_id: str = Field(default="CLM-2026-8801", description="ID berkas klaim atau FKL02")
    pstv01_peserta_id: str = Field(default="PSTV-77218902", description="ID peserta ter-de-identifikasi (PSTV01)")
    fkp02_rujukan_id: Optional[str] = Field(default="FKP-109281", description="ID rujukan FKTP (FKP02)")
    hospital_name: str = Field(default="RS Khusus Mitra Husada", description="Nama FKRTL pengaju klaim")
    fkl09_kelas_rs: str = Field(default="Kelas C", description="Kelas RS: Kelas A, Kelas B, Kelas C, atau Kelas D")
    patient_age: int = Field(default=46, ge=0, le=120, description="Usia peserta (tahun)")
    gender: str = Field(default="L", description="Jenis kelamin peserta (L/P)")
    fkl17_icd10_primer: str = Field(default="M54.5", description="Kode ICD-10 diagnosis primer (FKL17)")
    fkl24_secondary_diagnoses: List[str] = Field(
        default_factory=list,
        description="Daftar kode ICD-10 diagnosis sekunder komorbiditas/komplikasi (FKL24)",
    )
    fkl30_icd9_procedure: str = Field(default="93.39", description="Kode prosedur ICD-9-CM (FKL30)")
    fkl19_inacbg_code: str = Field(default="Z-3-12-0", description="Kode INA-CBGs 4-Digit (FKL19)")
    fkl23_severity_level: str = Field(default="0", description="Digit ke-4 Severity Level: 0, I, II, atau III")
    length_of_stay: int = Field(default=1, ge=1, le=365, description="Lama hari rawat FKL04 - FKL03 (hari)")
    fkl47_claimed_amount: float = Field(default=15_300_000.0, gt=0, description="Biaya tagih faskes dalam Rupiah (FKL47)")
    fkl32_standard_tariff: float = Field(default=1_800_000.0, gt=0, description="Tarif standar regional INA-CBGs (FKL32)")
    cluster_spike_ratio: float = Field(default=8.5, ge=0.1, le=50.0, description="Rasio lonjakan volume klaster Lapis 1")
    repeat_interval_days: int = Field(default=4, ge=0, le=365, description="Jarak hari dari kunjungan sebelumnya")
    terdaftar_baksos_resmi: bool = Field(default=False, description="Apakah kegiatan baksos resmi terdaftar BPJS")
    sip_status: str = Field(default="EXPIRED", description="Status SIP DPJP di SATUSEHAT SDMK: ACTIVE, UNSYNCED, EXPIRED")
    geovelocity_kmh: float = Field(default=28.0, ge=0.0, le=1000.0, description="Kecepatan perpindahan DPJP antar-RS (km/jam)")
    mobile_jkn_denied_ratio: float = Field(
        default=0.80, ge=0.0, le=1.0, description="Rasio peserta menyangkal kehadiran di Mobile JKN (0.0 - 1.0)"
    )
    clinical_text_clone_similarity: float = Field(
        default=0.94, ge=0.0, le=1.0, description="Indeks kemiripan teks resume medis antar-pasien (Lapis 4)"
    )
    lapis4_vital_lab_coherence_score: float = Field(
        default=18.0,
        ge=0.0,
        le=100.0,
        description="Skor kecocokan bukti vital/lab RME-TTE terhadap klaim (100 = sangat koheren, 0 = kontradiktif)",
    )
    clinical_notes_summary: str = Field(
        default="Klaster 85 klaim fisioterapi rawat jalan pasca-baksos dengan teks anamnesis identik 94%, SIP DPJP berakhir, dan 8/10 peserta menyangkal kehadiran di Mobile JKN.",
        description="Ringkasan rekam medis elektronik (RME-TTE) untuk telaah Lapis 4",
    )
    simulate_llm_timeout: bool = Field(
        default=False,
        description="Simulasikan kegagalan/timeout API LLM eksternal untuk menguji mekanisme Local Rule Engine Fallback (HTTP 200 OK)",
    )


class PracticalAIInferencePipeline:
    """In-memory ML + Async LLM + Resilient Fallback inference pipeline."""

    FEATURE_NAMES = [
        "cost_ratio_fkl47_fkl32",
        "los_zscore",
        "severity_numeric",
        "secondary_diag_deficit",
        "lapis1_cluster_spike_ratio",
        "lapis1_repeat_visit_flag",
        "lapis2_sip_risk_numeric",
        "lapis2_geovelocity_ratio",
        "lapis3_mobile_denied_ratio",
        "lapis4_coherence_deficit",
    ]

    def __init__(self) -> None:
        t0 = time.perf_counter()
        self.model_dir = Path(__file__).resolve().parent.parent / "models"
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.artifact_path = self.model_dir / "claimtrace_rf_pipeline.pkl"
        self.scaler: StandardScaler
        self.rf_model: RandomForestClassifier
        self._load_or_build_startup_model()
        self.startup_load_ms = round((time.perf_counter() - t0) * 1000.0, 2)

    def _load_or_build_startup_model(self) -> None:
        """
        Slide 8: Load Model Once at Startup.
        Loads serialized StandardScaler + RandomForestClassifier from .pkl into RAM.
        If artifact does not exist yet, trains a deterministic calibrated model once and saves it.
        """
        if self.artifact_path.exists():
            try:
                bundle = joblib.load(self.artifact_path)
                self.scaler = bundle["scaler"]
                self.rf_model = bundle["rf_model"]
                return
            except Exception:
                pass

        rng = np.random.default_rng(20261014)
        n_samples = 1600
        n_fraud = 400
        n_honest = n_samples - n_fraud

        # Honest feature matrix (including Hard Negatives)
        x_honest = np.column_stack([
            rng.uniform(0.85, 1.35, size=n_honest),      # cost_ratio
            rng.normal(0.0, 0.85, size=n_honest),        # los_zscore
            rng.choice([0.0, 1.0, 2.0, 3.0], size=n_honest, p=[0.45, 0.30, 0.15, 0.10]),
            rng.choice([0.0, 0.5], size=n_honest, p=[0.90, 0.10]),  # secondary_diag_deficit
            rng.uniform(0.7, 2.3, size=n_honest),        # spike_ratio
            rng.choice([0.0, 1.0], size=n_honest, p=[0.92, 0.08]),  # repeat_visit_flag
            rng.choice([0.0, 0.55], size=n_honest, p=[0.92, 0.08]), # sip_risk
            rng.uniform(0.05, 0.40, size=n_honest),      # geovelocity_ratio
            rng.choice([0.0, 0.20], size=n_honest, p=[0.96, 0.04]), # mobile_denied_ratio
            rng.uniform(0.05, 0.30, size=n_honest),      # lapis4_coherence_deficit
        ])
        y_honest = np.zeros(n_honest, dtype=int)

        # Fraud feature matrix (Phantom, Repeat, Upcoding, SIP Expired, Unbundling)
        x_fraud = np.column_stack([
            rng.uniform(1.50, 8.50, size=n_fraud),       # cost_ratio
            rng.normal(1.65, 1.10, size=n_fraud),        # los_zscore
            rng.choice([0.0, 1.0, 2.0, 3.0], size=n_fraud, p=[0.35, 0.15, 0.15, 0.35]),
            rng.choice([0.0, 1.5, 2.5], size=n_fraud, p=[0.35, 0.30, 0.35]),
            rng.uniform(2.5, 9.0, size=n_fraud),         # spike_ratio
            rng.choice([0.0, 1.0], size=n_fraud, p=[0.30, 0.70]),
            rng.choice([0.0, 0.55, 1.0], size=n_fraud, p=[0.45, 0.15, 0.40]),
            rng.uniform(0.20, 1.60, size=n_fraud),
            rng.uniform(0.35, 0.95, size=n_fraud),
            rng.uniform(0.60, 0.98, size=n_fraud),
        ])
        y_fraud = np.ones(n_fraud, dtype=int)

        x_all = np.vstack([x_honest, x_fraud])
        y_all = np.concatenate([y_honest, y_fraud])

        scaler = StandardScaler()
        x_scaled = scaler.fit_transform(x_all)

        rf = RandomForestClassifier(
            n_estimators=80,
            max_depth=8,
            min_samples_leaf=4,
            random_state=20261014,
        )
        rf.fit(x_scaled, y_all)

        self.scaler = scaler
        self.rf_model = rf
        joblib.dump({"scaler": scaler, "rf_model": rf}, self.artifact_path)

    def engineer_features(self, req: ClaimVerificationRequest) -> Dict[str, Any]:
        """Stage 3: Vectorized NumPy Feature Engineering."""
        cost_ratio = float(req.fkl47_claimed_amount) / max(1.0, float(req.fkl32_standard_tariff))
        expected_los = 1.0 if req.fkl23_severity_level == "0" else (3.0 if req.fkl23_severity_level == "I" else 5.0)
        los_zscore = (float(req.length_of_stay) - expected_los) / 2.0

        sev_map = {"0": 0.0, "I": 1.0, "II": 2.0, "III": 3.0}
        sev_num = sev_map.get(req.fkl23_severity_level.upper(), 1.0)
        sec_count = len(req.fkl24_secondary_diagnoses)
        sec_deficit = max(0.0, sev_num - float(sec_count)) if sev_num >= 2.0 else 0.0

        # Check Hard Negative clinical whitelists (Principle 5: Fairness)
        icd_clean = req.fkl17_icd10_primer.strip().upper()
        is_routine_whitelist = (
            icd_clean in ("Z49.1", "Z51.1", "I69.3")
            and req.mobile_jkn_denied_ratio < 0.15
            and req.sip_status.upper() == "ACTIVE"
        )
        is_valid_tertiary_icu = (
            req.fkl09_kelas_rs in ("Kelas A", "Kelas B")
            and sev_num == 3.0
            and sec_count >= 3
            and req.lapis4_vital_lab_coherence_score >= 70.0
            and req.sip_status.upper() == "ACTIVE"
        )

        eff_spike = 1.2 if (req.terdaftar_baksos_resmi or is_routine_whitelist) else float(req.cluster_spike_ratio)
        repeat_flag = 0.0 if (is_routine_whitelist or req.repeat_interval_days > 14) else 1.0

        sip_upper = req.sip_status.strip().upper()
        sip_risk = 1.0 if sip_upper == "EXPIRED" else (0.55 if sip_upper == "UNSYNCED" else 0.0)
        geovel_ratio = float(req.geovelocity_kmh) / 110.0
        denied_ratio = float(req.mobile_jkn_denied_ratio)

        coherence_deficit = max(
            float(req.clinical_text_clone_similarity),
            (100.0 - float(req.lapis4_vital_lab_coherence_score)) / 100.0,
        )
        if is_valid_tertiary_icu or is_routine_whitelist:
            coherence_deficit = min(coherence_deficit, 0.18)

        vec = np.array(
            [[
                cost_ratio,
                los_zscore,
                sev_num,
                sec_deficit,
                eff_spike,
                repeat_flag,
                sip_risk,
                geovel_ratio,
                denied_ratio,
                coherence_deficit,
            ]],
            dtype=np.float64,
        )

        return {
            "vector": vec,
            "feature_dict": {
                name: round(float(vec[0, i]), 4)
                for i, name in enumerate(self.FEATURE_NAMES)
            },
            "is_routine_whitelist": is_routine_whitelist,
            "is_valid_tertiary_icu": is_valid_tertiary_icu,
        }

    def run_in_memory_inference(self, req: ClaimVerificationRequest, feat_bundle: Dict[str, Any]) -> Dict[str, Any]:
        """Stage 4: In-Memory ML Inference + 4-Layer BEA Score Fusion."""
        t0 = time.perf_counter()
        vec = feat_bundle["vector"]
        x_scaled = self.scaler.transform(vec)
        ml_prob = float(self.rf_model.predict_proba(x_scaled)[0, 1])

        fdict = feat_bundle["feature_dict"]
        is_routine = feat_bundle["is_routine_whitelist"]
        is_icu_valid = feat_bundle["is_valid_tertiary_icu"]

        # Compute 4-Layer Scores (0 - 100)
        if req.terdaftar_baksos_resmi or is_routine:
            s1 = 16.0
        else:
            s1 = min(
                98.0,
                15.0
                + max(0.0, (fdict["lapis1_cluster_spike_ratio"] - 2.0) * 12.0)
                + fdict["lapis1_repeat_visit_flag"] * 22.0
                + (18.0 if req.clinical_text_clone_similarity >= 0.75 else 0.0),
            )

        sip_upper = req.sip_status.strip().upper()
        if sip_upper == "EXPIRED":
            s2 = 96.0
        elif sip_upper == "UNSYNCED":
            s2 = 55.0
        else:
            s2 = 92.0 if req.geovelocity_kmh >= 110.0 else (65.0 if req.geovelocity_kmh >= 75.0 else 12.0)

        if req.mobile_jkn_denied_ratio >= 0.50:
            s3 = min(98.0, 65.0 + req.mobile_jkn_denied_ratio * 35.0)
        elif req.mobile_jkn_denied_ratio >= 0.20:
            s3 = 52.0 + req.mobile_jkn_denied_ratio * 40.0
        else:
            s3 = 10.0

        s4 = 12.0 if (is_routine or is_icu_valid) else round(fdict["lapis4_coherence_deficit"] * 100.0, 1)

        tri_score = 0.50 * s1 + 0.30 * s2 + 0.20 * s3
        lapis4_boost = max(0.0, (s4 - 65.0) * 0.55) if not (is_routine or is_icu_valid) else 0.0
        deterministic_score = min(99.5, round(tri_score + lapis4_boost, 2))

        if sip_upper == "EXPIRED":
            deterministic_score = max(deterministic_score, 82.0)
        elif sip_upper == "UNSYNCED" and deterministic_score >= 70.0 and req.mobile_jkn_denied_ratio < 0.30:
            deterministic_score = 64.5

        if is_routine or is_icu_valid:
            ml_prob = min(ml_prob, 0.18)
            deterministic_score = min(deterministic_score, 28.0)

        triage_lane = (
            "MERAH"
            if deterministic_score >= 75.0
            else ("KUNING" if deterministic_score >= 50.0 else "HIJAU")
        )
        risk_level = (
            "CRITICAL_HOLD_PREPAYMENT"
            if triage_lane == "MERAH"
            else ("MEDIUM_ADMIN_CLARIFICATION" if triage_lane == "KUNING" else "LOW_FAST_TRACK_APPROVE")
        )

        # Rank top feature drivers from RandomForest importances * standardized magnitude
        importances = self.rf_model.feature_importances_
        magnitudes = np.abs(x_scaled[0]) * importances
        total_mag = max(1e-6, float(np.sum(magnitudes)))
        top_indices = np.argsort(magnitudes)[::-1][:4]
        top_drivers = [
            {
                "feature": self.FEATURE_NAMES[idx],
                "raw_value": fdict[self.FEATURE_NAMES[idx]],
                "contribution_pct": round(float(magnitudes[idx] / total_mag) * 100.0, 1),
            }
            for idx in top_indices
        ]

        ml_latency_ms = round((time.perf_counter() - t0) * 1000.0, 3)

        return {
            "ml_fraud_probability": round(ml_prob, 4),
            "final_priority_score": deterministic_score,
            "triage_lane": triage_lane,
            "risk_level": risk_level,
            "layer_scores": {
                "lapis_1_episode_klaster": round(s1, 1),
                "lapis_2_sdmk_geovelocity": round(s2, 1),
                "lapis_3_mobile_jkn_presensi": round(s3, 1),
                "lapis_4_rme_tte_koherensi": round(s4, 1),
            },
            "top_feature_drivers": top_drivers,
            "hard_negative_protected": bool(is_routine or is_icu_valid or req.terdaftar_baksos_resmi),
            "ml_inference_latency_ms": ml_latency_ms,
        }

    def _build_local_rule_engine_fallback(
        self,
        req: ClaimVerificationRequest,
        ml_res: Dict[str, Any],
        fallback_reason: str,
    ) -> Dict[str, Any]:
        """
        Stage 6: Local Rule Engine Fallback (Slide 11).
        Produces the exact same structured JSON schema deterministically when LLM API is unavailable/timeout.
        """
        lane = ml_res["triage_lane"]
        score = ml_res["final_priority_score"]
        ls = ml_res["layer_scores"]

        if ml_res["hard_negative_protected"]:
            summary = (
                f"Berkas {req.claim_id} ({req.fkl19_inacbg_code}, ICD-10 {req.fkl17_icd10_primer}) "
                f"teridentifikasi sebagai layanan berulang/kompleks yang SAH (Hard Negative Protected) di {req.hospital_name}. "
                f"Skor prioritas {score}/100 (Jalur {lane}). Direkomendasikan lolos cepat (Fast-Track) tanpa menghambat arus kas RS."
            )
            action = "FAST_TRACK_APPROVE_C03_04"
            bahv_point = "Layanan memenuhi kriteria klinis berulang/rujukan tersier sah sesuai Permenkes No. 26 Tahun 2021."
        elif lane == "MERAH":
            summary = (
                f"Berkas {req.claim_id} di {req.hospital_name} memperoleh skor risiko pra-bayar {score}/100 "
                f"(Probabilitas ML: {round(ml_res['ml_fraud_probability'] * 100, 1)}%, Jalur MERAH). "
                f"Bukti berlapis: Lapis 1 Klaster={ls['lapis_1_episode_klaster']}, Lapis 2 SDMK={ls['lapis_2_sdmk_geovelocity']} "
                f"(SIP: {req.sip_status}), Lapis 3 Mobile JKN={ls['lapis_3_mobile_jkn_presensi']} "
                f"(Rasio sanggah: {int(req.mobile_jkn_denied_ratio * 100)}%), dan Lapis 4 Koherensi RME-TTE={ls['lapis_4_rme_tte_koherensi']}."
            )
            action = "HOLD_PREPAYMENT_AND_ISSUE_BAHV_C03_04"
            bahv_point = (
                f"Penahanan sementara pembayaran pra-bayar pada proses C03.04 sebelum masuk ke S06 (In-Monica) "
                f"untuk klarifikasi Berita Acara Hasil Verifikasi (BAHV) dalam batas SLA 10 Hari Kerja."
            )
        elif lane == "KUNING":
            summary = (
                f"Berkas {req.claim_id} berada di Jalur KUNING ({score}/100). "
                f"Ditemukan ketidakpastian administratif (SIP: {req.sip_status}) atau deviasi moderat yang memerlukan "
                f"konfirmasi dokumen Casemix RS tanpa vonis kecurangan sepihak."
            )
            action = "REQUEST_ADMINISTRATIVE_CLARIFICATION_C03_04"
            bahv_point = "Konfirmasi sinkronisasi SIP SATUSEHAT SDMK / kelengkapan lampiran RME sebelum pencairan."
        else:
            summary = (
                f"Berkas {req.claim_id} berada di Jalur HIJAU ({score}/100). "
                f"Seluruh indikator Lapis 1-4 konsisten dengan baseline wajar."
            )
            action = "FAST_TRACK_APPROVE_C03_04"
            bahv_point = "Lolos saring otomatis pra-bayar menuju proses pembayaran S06."

        return {
            "fallback_active": True,
            "fallback_source": "LOCAL_DETERMINISTIC_RULE_ENGINE",
            "fallback_reason": fallback_reason,
            "context_handover_applied": True,
            "behavior_bounding_applied": True,
            "clinical_audit_summary": summary,
            "recommended_verifier_action": action,
            "bahv_draft_clause": bahv_point,
            "regulatory_citations": [
                "Perpres RI No. 82 Tahun 2018 Pasal 75 (SLA 10 Hari Kerja Verifikasi Klaim)",
                "Permenkes RI No. 26 Tahun 2021 (Pedoman Koding INA-CBG & Verifikasi Klaim)",
                "Permenkes RI No. 16 Tahun 2019 (Pencegahan dan Penanganan Kecurangan JKN)",
                "UU RI No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (Zero-PHI Masking)",
            ],
            "human_in_the_loop_gate": "WAJIB_PENGESAHAN_VERIFIKATOR_MEDIS_DAN_DOKTER_PENELAAH",
        }

    async def verify_claim_async(self, req: ClaimVerificationRequest) -> Dict[str, Any]:
        """
        Execute all 6 stages of the Production AI Inference Pipeline:
        Request -> Pydantic Validation -> Feature Engineering -> In-Memory ML -> Async LLM -> Fallback.
        Always returns HTTP 200 OK compatible dictionary.
        """
        t_start = time.perf_counter()

        # Stage 3: Feature Engineering
        feat_bundle = self.engineer_features(req)

        # Stage 4: In-Memory ML Inference
        ml_res = self.run_in_memory_inference(req, feat_bundle)

        # Stage 5 & 6: Async LLM Service with Context Handover, Behavior Bounding, and Fallback
        llm_endpoint = os.environ.get("CLAIMTRACE_LLM_ENDPOINT", "").strip()
        llm_api_key = os.environ.get("CLAIMTRACE_LLM_API_KEY", "").strip()

        if req.simulate_llm_timeout:
            llm_explanation = self._build_local_rule_engine_fallback(
                req,
                ml_res,
                fallback_reason="SIMULATED_LLM_TIMEOUT: Skenario uji ketahanan diaktifkan; Local Rule Engine mengambil alih otomatis (HTTP 200 OK).",
            )
        elif not llm_endpoint or not llm_api_key:
            llm_explanation = self._build_local_rule_engine_fallback(
                req,
                ml_res,
                fallback_reason="ON_PREMISE_DETERMINISTIC_MODE: Endpoint LLM eksternal dinonaktifkan demi kedaulatan data (Cek Data & Cek Akun); menggunakan Local Rule Engine.",
            )
        else:
            # Stage 5 Async HTTPX call with strict 2.0s timeout and automatic fallback on any error
            prompt_payload = {
                "context_handover": {
                    "claim_id": req.claim_id,
                    "ml_fraud_probability": ml_res["ml_fraud_probability"],
                    "final_priority_score": ml_res["final_priority_score"],
                    "triage_lane": ml_res["triage_lane"],
                    "layer_scores": ml_res["layer_scores"],
                    "top_feature_drivers": ml_res["top_feature_drivers"],
                },
                "behavior_bounding": (
                    "Anda adalah asisten Decision Support System (DSS) Verifikator Medis BPJS Kesehatan. "
                    "Wajib mematuhi Permenkes 26/2021 dan Perpres 82/2018. Dilarang memvonis sepihak tanpa pengesahan manusia. "
                    "Keluarkan output murni dalam format JSON terstruktur."
                ),
            }
            try:
                async with httpx.AsyncClient(timeout=2.0) as client:
                    resp = await client.post(
                        llm_endpoint,
                        headers={"Authorization": f"Bearer {llm_api_key}", "Content-Type": "application/json"},
                        json=prompt_payload,
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    llm_explanation = {
                        "fallback_active": False,
                        "fallback_source": "ASYNC_LLM_SERVICE_HTTPX",
                        "fallback_reason": "NONE",
                        "context_handover_applied": True,
                        "behavior_bounding_applied": True,
                        "clinical_audit_summary": data.get("clinical_audit_summary", ""),
                        "recommended_verifier_action": data.get("recommended_verifier_action", "HOLD_PREPAYMENT"),
                        "bahv_draft_clause": data.get("bahv_draft_clause", ""),
                        "regulatory_citations": data.get("regulatory_citations", []),
                        "human_in_the_loop_gate": "WAJIB_PENGESAHAN_VERIFIKATOR_MEDIS_DAN_DOKTER_PENELAAH",
                    }
            except Exception as exc:
                llm_explanation = self._build_local_rule_engine_fallback(
                    req,
                    ml_res,
                    fallback_reason=f"LLM_API_EXCEPTION_FALLBACK ({type(exc).__name__}): Layanan tetap merespons HTTP 200 OK melalui Local Rule Engine.",
                )

        total_latency_ms = round((time.perf_counter() - t_start) * 1000.0, 3)

        return {
            "status": "ok",
            "http_status_code": 200,
            "pipeline_architecture": "Said Achmad 6-Stage Practical AI Inference Pipeline (FastAPI + Pydantic + NumPy + In-Memory PKL + Async LLM + Fallback)",
            "claim_id": req.claim_id,
            "pstv01_peserta_id": req.pstv01_peserta_id,
            "hospital_name": req.hospital_name,
            "fkl09_kelas_rs": req.fkl09_kelas_rs,
            "fkl19_inacbg_code": req.fkl19_inacbg_code,
            "fkl47_claimed_amount": req.fkl47_claimed_amount,
            "fkl32_standard_tariff": req.fkl32_standard_tariff,
            "risk_score": ml_res["final_priority_score"],
            "triage_lane": ml_res["triage_lane"],
            "risk_level": ml_res["risk_level"],
            "hard_negative_protected": ml_res["hard_negative_protected"],
            "recommended_action": llm_explanation["recommended_verifier_action"],
            "stage_2_pydantic_validation": "PASSED",
            "stage_3_engineered_features": feat_bundle["feature_dict"],
            "stage_4_in_memory_ml_inference": {
                "model_artifact": str(self.artifact_path.name),
                "loaded_once_at_startup": True,
                "startup_load_ms": self.startup_load_ms,
                "ml_inference_latency_ms": ml_res["ml_inference_latency_ms"],
                "ml_fraud_probability": ml_res["ml_fraud_probability"],
                "final_priority_score": ml_res["final_priority_score"],
                "triage_lane": ml_res["triage_lane"],
                "risk_level": ml_res["risk_level"],
                "layer_scores": ml_res["layer_scores"],
                "top_feature_drivers": ml_res["top_feature_drivers"],
                "hard_negative_protected": ml_res["hard_negative_protected"],
            },
            "stage_5_and_6_llm_and_fallback": llm_explanation,
            "bea_integration_touchpoints": {
                "c01_kepesertaan": "Mobile JKN 1-Click Presence Challenge (Zero-PHI Masking) & FRISTA Log",
                "c03_pelayanan": "VClaim SEP Ingestion & HFIS x SATUSEHAT SDMK SIP Sync",
                "c03_04_klaim": "VClaim & VIDI (Smart Vedika) Pre-Payment Screening Console",
                "s06_keuangan_guard": (
                    "BLOCKED_BEFORE_S06_IN_MONICA"
                    if ml_res["triage_lane"] == "MERAH"
                    else ("PENDING_CLARIFICATION_C03_04" if ml_res["triage_lane"] == "KUNING" else "CLEARED_FOR_S06_PAYMENT")
                ),
            },
            "total_pipeline_latency_ms": total_latency_ms,
            "meets_sub_1s_production_sla": total_latency_ms < 1000.0,
        }


_INFERENCE_PIPELINE_SINGLETON: Optional[PracticalAIInferencePipeline] = None


def get_practical_inference_pipeline() -> PracticalAIInferencePipeline:
    """Return singleton instance loaded once at startup."""
    global _INFERENCE_PIPELINE_SINGLETON
    if _INFERENCE_PIPELINE_SINGLETON is None:
        _INFERENCE_PIPELINE_SINGLETON = PracticalAIInferencePipeline()
    return _INFERENCE_PIPELINE_SINGLETON
