"""
ClaimTrace JKN - Live SQL Provider Fraud Profiling Engine
Aggregates 1.699M+ live rows from bpjs_fkrtl_all in the analytical warehouse
to compute provider-cohort behavioral metrics (HHI specialty concentration,
inpatient ratio, ALOS, LOS uniformity CV, claims/patient ratio, chronic
condition intensity, Severity III rate, and verification correction rate).
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Any, Dict, List, Optional

logger = logging.getLogger("claimtrace.warehouse_fraud_profiler")

OWNERSHIP_MAP: Dict[int, str] = {
    1: "RS Vertikal (Kemenkes)",
    2: "RSUD Pemda Provinsi",
    3: "RSUD Pemda Kab/Kota",
    4: "RS TNI",
    5: "RS POLRI",
    6: "RS BUMN",
    7: "RS Swasta Pratama",
    8: "RS Swasta Khusus",
    9: "RS Swasta / Yayasan",
}

FACILITY_CLASS_MAP: Dict[int, str] = {
    1: "Kelas A",
    2: "Kelas B",
    3: "Kelas C",
    4: "Kelas D",
    5: "Kelas D Pratama",
    6: "Swasta Setara Kelas B",
    7: "Swasta Setara Kelas C",
    8: "Swasta Setara Kelas D",
    9: "Swasta Setara Kelas A",
    10: "RS Khusus",
    11: "Klinik Utama / Balai",
    12: "RS Jiwa",
    13: "RS Kusta",
    14: "RS Mata",
    16: "FKRTL Khusus",
    17: "RS Ibu & Anak",
    18: "RS Bedah",
    19: "RS Jantung",
    21: "RS Khusus Rujukan",
    22: "RS Paru",
    24: "RS Kanker",
    26: "Klinik Hemodialisis",
    99: "FKRTL Non-Kelas / Lainnya",
}


class WarehouseFraudProfiler:
    """Thread-safe TTL-cached SQL provider cohort profiler over bpjs_fkrtl_all."""

    CACHE_TTL_SECONDS = 300.0

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._cache_payload: Optional[Dict[str, Any]] = None
        self._cache_ts: float = 0.0

    def invalidate_cache(self) -> None:
        with self._lock:
            self._cache_payload = None
            self._cache_ts = 0.0

    def get_warehouse_clusters(
        self,
        kelas_filter: Optional[str] = None,
        min_claims: int = 500,
        force_refresh: bool = False,
    ) -> Dict[str, Any]:
        """Return live SQL provider cohort clusters aggregated across bpjs_fkrtl_all."""
        now = time.monotonic()
        with self._lock:
            if (
                not force_refresh
                and min_claims == 500
                and self._cache_payload is not None
                and (now - self._cache_ts) < self.CACHE_TTL_SECONDS
            ):
                cached = self._cache_payload
            else:
                cached = self._query_warehouse(min_claims=min_claims)
                if min_claims == 500 and cached.get("warehouse_available"):
                    self._cache_payload = cached
                    self._cache_ts = now

        clusters = list(cached.get("clusters", []))
        if kelas_filter and kelas_filter.lower() != "all":
            kf = kelas_filter.lower()
            clusters = [
                c
                for c in clusters
                if kf in c["facility_class"].lower() or kf in c["cohort_label"].lower()
            ]

        return {
            "warehouse_available": cached.get("warehouse_available", False),
            "source_table": "bpjs_fkrtl_all",
            "total_rows_scanned": cached.get("total_rows_scanned", 0),
            "total_cohorts": len(clusters),
            "query_elapsed_ms": cached.get("query_elapsed_ms", 0.0),
            "cached_at_epoch": cached.get("cached_at_epoch", int(time.time())),
            "clusters": clusters,
        }

    def enrich_rankings_with_warehouse(
        self,
        rankings: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Attach live warehouse cohort benchmarks to static RS rankings."""
        summary = self.get_warehouse_clusters()
        clusters = summary.get("clusters", [])
        by_class_best: Dict[str, Dict[str, Any]] = {}
        for cluster in clusters:
            fclass = cluster["facility_class"]
            for key in ("Kelas A", "Kelas B", "Kelas C", "Kelas D", "Klinik Utama"):
                if key in fclass:
                    prev = by_class_best.get(key)
                    if prev is None or cluster["claim_count"] > prev["claim_count"]:
                        by_class_best[key] = cluster

        fallback = clusters[0] if clusters else None
        for row in rankings:
            kelas_rs = row.get("kelas_rs", "")
            matched = None
            for key in ("Kelas A", "Kelas B", "Kelas C", "Kelas D", "Klinik Utama"):
                if key in kelas_rs and key in by_class_best:
                    matched = by_class_best[key]
                    break
            matched = matched or fallback
            if matched:
                row["warehouse_cohort_id"] = matched["cohort_id"]
                row["warehouse_cohort_label"] = matched["cohort_label"]
                row["cohort_claim_volume"] = matched["claim_count"]
                row["cohort_claims_per_patient"] = matched["rasio_klaim_per_pasien"]
                row["cohort_inpatient_ratio_pct"] = matched["inpatient_ratio_pct"]
                row["cohort_avg_los_days"] = matched["avg_los_days"]
                row["cohort_los_uniformity_cv"] = matched["los_uniformity_cv"]
                row["cohort_chronic_intensity_pct"] = matched["chronic_condition_intensity_pct"]
                row["cohort_hhi_specialty"] = matched["hhi_specialty_concentration"]
                row["cohort_severity_iii_pct"] = matched["severity_iii_pct"]
                row["benchmark_source"] = "bpjs_fkrtl_all_live_sql"

        return {
            "warehouse_available": summary["warehouse_available"],
            "total_rows_scanned": summary["total_rows_scanned"],
            "query_elapsed_ms": summary["query_elapsed_ms"],
            "live_warehouse_clusters": clusters[:12],
        }

    def _query_warehouse(self, min_claims: int = 500) -> Dict[str, Any]:
        from app.engine.duckdb_analytics import duckdb_engine

        t0 = time.perf_counter()
        con = duckdb_engine.con
        if con is None:
            return {"warehouse_available": False, "clusters": [], "total_rows_scanned": 0}

        try:
            tbl_exists = con.execute(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'bpjs_fkrtl_all'"
            ).fetchone()[0]
            if not tbl_exists:
                return {"warehouse_available": False, "clusters": [], "total_rows_scanned": 0}

            total_rows = int(con.execute("SELECT COUNT(*) FROM bpjs_fkrtl_all").fetchone()[0])

            sql = """
            WITH base AS (
                SELECT
                    CAST(FKL07 AS INTEGER) AS fkl07,
                    CAST(FKL09 AS INTEGER) AS fkl09,
                    COUNT(*) AS claim_count,
                    COUNT(DISTINCT PSTV01) AS unique_patients,
                    ROUND(COUNT(*) * 1.0 / NULLIF(COUNT(DISTINCT PSTV01), 0), 2) AS rasio_klaim_per_pasien,
                    ROUND(COUNT(*) FILTER (WHERE FKL10 = 2) * 100.0 / NULLIF(COUNT(*), 0), 2) AS inpatient_ratio_pct,
                    ROUND(COALESCE(AVG(
                        CASE WHEN FKL10 = 2 AND FKL04 >= FKL03
                        THEN DATEDIFF('day', FKL03, FKL04) END
                    ), 0), 2) AS avg_los_days,
                    ROUND(COALESCE(
                        STDDEV_SAMP(CASE WHEN FKL10 = 2 AND FKL04 >= FKL03 THEN DATEDIFF('day', FKL03, FKL04) END) /
                        NULLIF(AVG(CASE WHEN FKL10 = 2 AND FKL04 >= FKL03 THEN DATEDIFF('day', FKL03, FKL04) END), 0),
                    0), 3) AS los_uniformity_cv,
                    ROUND(COUNT(*) FILTER (WHERE
                        FKL15A LIKE 'E1%' OR FKL15A LIKE 'I1%' OR FKL15A LIKE 'I2%' OR
                        FKL15A LIKE 'I50%' OR FKL15A LIKE 'N18%' OR FKL15A LIKE 'C%' OR
                        FKL15A LIKE 'J44%' OR FKL15A LIKE 'J45%'
                    ) * 100.0 / NULLIF(COUNT(*), 0), 2) AS chronic_condition_intensity_pct,
                    ROUND(COUNT(*) FILTER (WHERE FKL19 LIKE '%-III') * 100.0 / NULLIF(COUNT(*), 0), 2) AS severity_iii_pct,
                    ROUND(COUNT(*) FILTER (WHERE FKL48 < FKL47) * 100.0 / NULLIF(COUNT(*), 0), 2) AS correction_rate_pct,
                    COALESCE(SUM(FKL47), 0) AS total_billed_rp,
                    COALESCE(SUM(FKL48), 0) AS total_verified_rp,
                    COALESCE(SUM(GREATEST(FKL47 - FKL48, 0)), 0) AS potential_savings_rp
                FROM bpjs_fkrtl_all
                WHERE FKL07 IS NOT NULL AND FKL09 IS NOT NULL
                GROUP BY FKL07, FKL09
                HAVING COUNT(*) >= ?
            ),
            spec AS (
                SELECT
                    CAST(FKL07 AS INTEGER) AS fkl07,
                    CAST(FKL09 AS INTEGER) AS fkl09,
                    FKL11,
                    COUNT(*) AS poli_cnt
                FROM bpjs_fkrtl_all
                WHERE FKL07 IS NOT NULL AND FKL09 IS NOT NULL AND FKL11 IS NOT NULL AND FKL11 != 998
                GROUP BY FKL07, FKL09, FKL11
            ),
            spec_tot AS (
                SELECT fkl07, fkl09, SUM(poli_cnt) AS tot_poli FROM spec GROUP BY 1, 2
            ),
            hhi AS (
                SELECT
                    s.fkl07,
                    s.fkl09,
                    ROUND(SUM(POWER(s.poli_cnt * 1.0 / NULLIF(st.tot_poli, 0), 2)) * 10000, 1) AS hhi_specialty_concentration
                FROM spec s
                JOIN spec_tot st ON s.fkl07 = st.fkl07 AND s.fkl09 = st.fkl09
                GROUP BY 1, 2
            )
            SELECT
                b.fkl07,
                b.fkl09,
                b.claim_count,
                b.unique_patients,
                b.rasio_klaim_per_pasien,
                b.inpatient_ratio_pct,
                b.avg_los_days,
                b.los_uniformity_cv,
                b.chronic_condition_intensity_pct,
                b.severity_iii_pct,
                b.correction_rate_pct,
                b.total_billed_rp,
                b.total_verified_rp,
                b.potential_savings_rp,
                COALESCE(h.hhi_specialty_concentration, 0.0) AS hhi_specialty_concentration
            FROM base b
            LEFT JOIN hhi h ON b.fkl07 = h.fkl07 AND b.fkl09 = h.fkl09
            ORDER BY b.claim_count DESC
            """
            rows = con.execute(sql, [int(min_claims)]).fetchall()
        except Exception as exc:
            logger.warning("Warehouse fraud profiler fallback triggered: %s", exc)
            return {"warehouse_available": False, "clusters": [], "total_rows_scanned": 0}

        clusters: List[Dict[str, Any]] = []
        for r in rows:
            fkl07, fkl09 = int(r[0]), int(r[1])
            claim_count = int(r[2])
            unique_patients = int(r[3])
            rasio_kpp = float(r[4] or 0.0)
            inpatient_pct = float(r[5] or 0.0)
            avg_los = float(r[6] or 0.0)
            los_cv = float(r[7] or 0.0)
            chronic_pct = float(r[8] or 0.0)
            sev3_pct = float(r[9] or 0.0)
            corr_pct = float(r[10] or 0.0)
            billed_rp = float(r[11] or 0.0)
            verified_rp = float(r[12] or 0.0)
            savings_rp = float(r[13] or 0.0)
            hhi_val = float(r[14] or 0.0)

            ownership = OWNERSHIP_MAP.get(fkl07, f"Kepemilikan Kode {fkl07}")
            fclass = FACILITY_CLASS_MAP.get(fkl09, f"Tipe FKRTL {fkl09}")

            anomaly_flags: List[str] = []
            score = 22.0
            if hhi_val >= 1500.0:
                score += 22.0
                anomaly_flags.append(f"HHI Konsentrasi Spesialisasi Tinggi ({hhi_val:.0f})")
            elif hhi_val >= 1000.0:
                score += 12.0
                anomaly_flags.append(f"HHI Spesialisasi Terkonsentrasi ({hhi_val:.0f})")

            if rasio_kpp >= 6.0:
                score += 18.0
                anomaly_flags.append(f"Frekuensi Klaim/Pasien Tinggi ({rasio_kpp:.2f}x)")
            elif rasio_kpp >= 4.5:
                score += 9.0

            if inpatient_pct >= 20.0:
                score += 16.0
                anomaly_flags.append(f"Rasio Rawat Inap Tinggi ({inpatient_pct:.1f}%)")
            elif inpatient_pct >= 13.0:
                score += 8.0

            if inpatient_pct > 2.0 and 0.0 < los_cv < 0.65:
                score += 14.0
                anomaly_flags.append(f"Keseragaman LOS Anomali (CV {los_cv:.3f})")

            if sev3_pct >= 1.2:
                score += 14.0
                anomaly_flags.append(f"Proporsi Severity III Tinggi ({sev3_pct:.2f}%)")

            if chronic_pct >= 26.0:
                score += 8.0
                anomaly_flags.append(f"Intensitas Penyakit Kronis Tinggi ({chronic_pct:.1f}%)")

            if corr_pct >= 0.05 or savings_rp >= 100_000_000:
                score += 8.0
                anomaly_flags.append("Deviasi Biaya Tagih vs Verifikasi Signifikan")

            cohort_risk = round(min(99.2, max(15.0, score)), 1)
            clusters.append(
                {
                    "cohort_id": f"FKL07-{fkl07}_FKL09-{fkl09}",
                    "fkl07_code": fkl07,
                    "fkl09_code": fkl09,
                    "cohort_label": f"{ownership} ({fclass})",
                    "ownership_group": ownership,
                    "facility_class": fclass,
                    "claim_count": claim_count,
                    "unique_patients": unique_patients,
                    "rasio_klaim_per_pasien": rasio_kpp,
                    "inpatient_ratio_pct": inpatient_pct,
                    "avg_los_days": avg_los,
                    "los_uniformity_cv": los_cv,
                    "chronic_condition_intensity_pct": chronic_pct,
                    "severity_iii_pct": sev3_pct,
                    "correction_rate_pct": corr_pct,
                    "hhi_specialty_concentration": hhi_val,
                    "total_billed_rp": billed_rp,
                    "total_verified_rp": verified_rp,
                    "potential_savings_rp": savings_rp,
                    "cohort_risk_score": cohort_risk,
                    "anomaly_flags": anomaly_flags,
                }
            )

        elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 2)
        return {
            "warehouse_available": True,
            "total_rows_scanned": total_rows,
            "query_elapsed_ms": elapsed_ms,
            "cached_at_epoch": int(time.time()),
            "clusters": clusters,
        }


warehouse_fraud_profiler = WarehouseFraudProfiler()
