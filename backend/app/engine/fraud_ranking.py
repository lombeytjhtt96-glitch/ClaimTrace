"""
Fraud Risk Ranking & Hospital Compliance Leaderboard Engine
============================================================
Kepatuhan Regulasi & Standar BPJS Kesehatan:
- Permenkes No. 16 Tahun 2019 (Pencegahan dan Penanganan Kecurangan JKN)
- Perpres No. 82 Tahun 2018 (Jaminan Kesehatan) & Perpres No. 59 Tahun 2024
- Standar Evaluasi Faskes & Profil Risiko Faskes (Hospital Risk Index)

Mesin ini menyusun peringkat risiko fraud rumah sakit se-Indonesia berdasarkan:
1. Agregat Skor Anomali Klaim (Multi-Layer Fraud Score).
2. Rasio Upcoding (Pangsa klaim Severity Level III vs Level I tak wajar).
3. Rasio Anomali Volume & Phantom / Repeat Billing.
4. Indeks Kepatuhan Berkas Digital Klaim (Document Completeness & Authenticity).
5. Potensi Kerugian Dana Jaminan Sosial (DJS) Kesehatan.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
import datetime
import math


@dataclass
class HospitalFraudProfile:
    rank: int
    faskes_id: str
    faskes_name: str
    kelas_rs: str  # Kelas A, Kelas B, Kelas C, Kelas D, Khusus
    kepedutian_wilayah: str
    kantor_cabang: str
    total_volume_klaim: int
    total_tagihan_rp: float
    total_potensi_fraud_rp: float
    fraud_risk_score: float  # 0.0 - 100.0
    risk_category: str  # TINGGI (CRITICAL), SEDANG (ELEVATED), RENDAH (COMPLIANT)
    dominant_anomaly_modus: str  # UPCODING, PHANTOM_BILLING, REPEAT_BILLING, UNBUNDLING, DOKUMEN_CACAT
    upcoding_rate_pct: float
    phantom_billing_flag_count: int
    document_compliance_rate_pct: float
    triage_hold_count: int
    accreditation_status: str
    risk_quadrant: str  # Kuadran I (High Vol, High Risk), Kuadran II (Low Vol, High Risk), etc.


class FraudRankingEngine:
    """
    Mesin Peringkat Risiko Faskes Nasional & Wilayah BPJS Kesehatan.
    """

    # Standar Direktori Profil Faskes Sintetis Teranotasi
    BASE_FASKES_PROFILES = [
        {
            "faskes_id": "RS001",
            "faskes_name": "RS Medika Prima",
            "kelas_rs": "Kelas B",
            "kepedutian_wilayah": "Wilayah IV (Jawa Barat)",
            "kantor_cabang": "KC Bandung",
            "accreditation_status": "Paripurna (KARS)",
            "base_volume": 12450,
            "base_nominal": 78500000000.0,
            "fraud_risk_score": 92.4,
            "dominant_modus": "Upcoding Tingkat Keparahan (Severity III)",
            "upcoding_rate": 34.8,
            "phantom_count": 14,
            "doc_compliance": 68.5,
            "hold_count": 85
        },
        {
            "faskes_id": "RS002",
            "faskes_name": "RS Khusus Mitra Husada",
            "kelas_rs": "Kelas C (Khusus)",
            "kepedutian_wilayah": "Wilayah VII (Jawa Timur)",
            "kantor_cabang": "KC Surabaya",
            "accreditation_status": "Utama",
            "base_volume": 8920,
            "base_nominal": 42100000000.0,
            "fraud_risk_score": 88.7,
            "dominant_modus": "Phantom Billing / Baksos Fiktif",
            "upcoding_rate": 18.2,
            "phantom_count": 42,
            "doc_compliance": 54.0,
            "hold_count": 64
        },
        {
            "faskes_id": "RS003",
            "faskes_name": "RS Jantung Harapan Sehat",
            "kelas_rs": "Kelas A (Rujukan Khusus)",
            "kepedutian_wilayah": "Wilayah IV (DKI Jakarta)",
            "kantor_cabang": "KC Jakarta Pusat",
            "accreditation_status": "Paripurna (JCI)",
            "base_volume": 24800,
            "base_nominal": 194000000000.0,
            "fraud_risk_score": 81.3,
            "dominant_modus": "Unbundling / Fragmentasi Kateterisasi",
            "upcoding_rate": 22.5,
            "phantom_count": 6,
            "doc_compliance": 79.2,
            "hold_count": 48
        },
        {
            "faskes_id": "RS004",
            "faskes_name": "RS Daerah Kartini",
            "kelas_rs": "Kelas B (RSUD)",
            "kepedutian_wilayah": "Wilayah VI (Jawa Tengah)",
            "kantor_cabang": "KC Semarang",
            "accreditation_status": "Paripurna",
            "base_volume": 16400,
            "base_nominal": 89000000000.0,
            "fraud_risk_score": 76.5,
            "dominant_modus": "Repeat Billing Prosedur Dialisis",
            "upcoding_rate": 16.0,
            "phantom_count": 8,
            "doc_compliance": 81.0,
            "hold_count": 32
        },
        {
            "faskes_id": "RS005",
            "faskes_name": "RS Ibu & Anak Bunda Sejahtera",
            "kelas_rs": "Kelas C (RSIA)",
            "kepedutian_wilayah": "Wilayah II (Sumatera Utara)",
            "kantor_cabang": "KC Medan",
            "accreditation_status": "Madya",
            "base_volume": 6800,
            "base_nominal": 29800000000.0,
            "fraud_risk_score": 73.8,
            "dominant_modus": "Upcoding Persalinan Sesar (SC Severity III)",
            "upcoding_rate": 29.4,
            "phantom_count": 3,
            "doc_compliance": 72.0,
            "hold_count": 27
        },
        {
            "faskes_id": "RS006",
            "faskes_name": "RS Mata Nusantara",
            "kelas_rs": "Kelas B (Khusus)",
            "kepedutian_wilayah": "Wilayah X (Sulawesi Selatan)",
            "kantor_cabang": "KC Makassar",
            "accreditation_status": "Utama",
            "base_volume": 5200,
            "base_nominal": 21500000000.0,
            "fraud_risk_score": 68.2,
            "dominant_modus": "Klaim Fakoemulsifikasi Ganda Bilateral",
            "upcoding_rate": 12.1,
            "phantom_count": 11,
            "doc_compliance": 84.5,
            "hold_count": 19
        },
        {
            "faskes_id": "RS007",
            "faskes_name": "RS Orthopedi Solo Indah",
            "kelas_rs": "Kelas B (Khusus)",
            "kepedutian_wilayah": "Wilayah VI (Jawa Tengah)",
            "kantor_cabang": "KC Surakarta",
            "accreditation_status": "Paripurna",
            "base_volume": 7400,
            "base_nominal": 48200000000.0,
            "fraud_risk_score": 64.0,
            "dominant_modus": "Penagihan Implan / Alkes di Luar INA-CBG",
            "upcoding_rate": 14.8,
            "phantom_count": 2,
            "doc_compliance": 86.0,
            "hold_count": 15
        },
        {
            "faskes_id": "RS008",
            "faskes_name": "RS Swasta As-Syifa",
            "kelas_rs": "Kelas C",
            "kepedutian_wilayah": "Wilayah V (DI Yogyakarta)",
            "kantor_cabang": "KC Yogyakarta",
            "accreditation_status": "Paripurna",
            "base_volume": 9100,
            "base_nominal": 36400000000.0,
            "fraud_risk_score": 45.2,
            "dominant_modus": "Diskrepansi Administratif Berkas Rujukan",
            "upcoding_rate": 8.5,
            "phantom_count": 1,
            "doc_compliance": 91.0,
            "hold_count": 8
        },
        {
            "faskes_id": "RS009",
            "faskes_name": "RSUP Dr. Sardjito",
            "kelas_rs": "Kelas A (Rujukan Nasional)",
            "kepedutian_wilayah": "Wilayah V (DI Yogyakarta)",
            "kantor_cabang": "KC Sleman",
            "accreditation_status": "Paripurna (KARS & JCI)",
            "base_volume": 38500,
            "base_nominal": 312000000000.0,
            "fraud_risk_score": 28.6,
            "dominant_modus": "Tertib Koding (Tingkat Kepatuhan Sangat Tinggi)",
            "upcoding_rate": 4.1,
            "phantom_count": 0,
            "doc_compliance": 96.8,
            "hold_count": 5
        },
        {
            "faskes_id": "RS010",
            "faskes_name": "RSUD Tarakan",
            "kelas_rs": "Kelas A (RSUD Provinsi)",
            "kepedutian_wilayah": "Wilayah IV (DKI Jakarta)",
            "kantor_cabang": "KC Jakarta Barat",
            "accreditation_status": "Paripurna",
            "base_volume": 29100,
            "base_nominal": 185000000000.0,
            "fraud_risk_score": 32.1,
            "dominant_modus": "Tertib Koding Klinis",
            "upcoding_rate": 5.2,
            "phantom_count": 0,
            "doc_compliance": 95.2,
            "hold_count": 6
        }
    ]

    def get_national_fraud_rankings(
        self,
        wilayah_filter: Optional[str] = None,
        kelas_filter: Optional[str] = None,
        min_risk_score: float = 0.0,
        sort_by: str = "risk_score"  # risk_score, potential_loss, volume, upcoding_rate
    ) -> Dict[str, Any]:
        """
        Menghasilkan papan peringkat risiko kecurangan rumah sakit.
        """
        profiles: List[HospitalFraudProfile] = []

        # Sort based on requested criteria
        sorted_raw = sorted(
            self.BASE_FASKES_PROFILES,
            key=lambda x: x["fraud_risk_score"],
            reverse=True
        )

        for idx, f in enumerate(sorted_raw, 1):
            # Apply filters
            if wilayah_filter and wilayah_filter.lower() not in f["kepedutian_wilayah"].lower():
                continue
            if kelas_filter and kelas_filter.lower() not in f["kelas_rs"].lower():
                continue
            if f["fraud_risk_score"] < min_risk_score:
                continue

            # Determine Risk Category
            score = f["fraud_risk_score"]
            if score >= 75.0:
                cat = "Tinggi (Prioritas Audit Kritis)"
            elif score >= 50.0:
                cat = "Sedang (Pengawasan Ketat)"
            else:
                cat = "Rendah (Kepatuhan Rutin)"

            # Estimate potential fraud financial loss (DJS exposure)
            # Potensi kerugian = Total Tagihan * (Score / 100) * 0.08
            potential_loss = round(f["base_nominal"] * (score / 100.0) * 0.075, 0)

            # Assign risk quadrant
            # Vol threshold: 15,000; Risk threshold: 65.0
            is_high_vol = f["base_volume"] >= 15000
            is_high_risk = score >= 65.0
            if is_high_vol and is_high_risk:
                quad = "Kuadran I (Volume Tinggi, Risiko Kritis)"
            elif not is_high_vol and is_high_risk:
                quad = "Kuadran II (Volume Terbatas, Anomali Tinggi)"
            elif is_high_vol and not is_high_risk:
                quad = "Kuadran III (Volume Tinggi, Patuh Klinis)"
            else:
                quad = "Kuadran IV (Volume Rendah, Patuh)"

            profiles.append(HospitalFraudProfile(
                rank=idx,
                faskes_id=f["faskes_id"],
                faskes_name=f["faskes_name"],
                kelas_rs=f["kelas_rs"],
                kepedutian_wilayah=f["kepedutian_wilayah"],
                kantor_cabang=f["kantor_cabang"],
                total_volume_klaim=f["base_volume"],
                total_tagihan_rp=f["base_nominal"],
                total_potensi_fraud_rp=potential_loss,
                fraud_risk_score=score,
                risk_category=cat,
                dominant_anomaly_modus=f["dominant_modus"],
                upcoding_rate_pct=f["upcoding_rate"],
                phantom_billing_flag_count=f["phantom_count"],
                document_compliance_rate_pct=f["doc_compliance"],
                triage_hold_count=f["hold_count"],
                accreditation_status=f["accreditation_status"],
                risk_quadrant=quad
            ))

        # Re-sort if different key requested
        if sort_by == "potential_loss":
            profiles.sort(key=lambda p: p.total_potensi_fraud_rp, reverse=True)
        elif sort_by == "volume":
            profiles.sort(key=lambda p: p.total_volume_klaim, reverse=True)
        elif sort_by == "upcoding_rate":
            profiles.sort(key=lambda p: p.upcoding_rate_pct, reverse=True)

        # Re-assign ranks after final sort
        for i, p in enumerate(profiles, 1):
            p.rank = i

        total_potential_loss = sum(p.total_potensi_fraud_rp for p in profiles)
        avg_score = round(sum(p.fraud_risk_score for p in profiles) / len(profiles), 1) if profiles else 0.0

        return {
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_faskes_evaluated": len(profiles),
            "national_average_risk_score": avg_score,
            "total_potential_fraud_exposure_rp": total_potential_loss,
            "filters_applied": {
                "wilayah": wilayah_filter,
                "kelas_rs": kelas_filter,
                "min_score": min_risk_score,
                "sort_by": sort_by
            },
            "rankings": [p.__dict__ for p in profiles],
            "top_high_risk_faskes": [p.__dict__ for p in profiles if p.fraud_risk_score >= 75.0],
            "quadrant_distribution": {
                "kuadran_1_prioritas_audit": len([p for p in profiles if "Kuadran I" in p.risk_quadrant or "KUADRAN_I" in p.risk_quadrant]),
                "kuadran_2_anomali_tinggi": len([p for p in profiles if "Kuadran II" in p.risk_quadrant or "KUADRAN_II" in p.risk_quadrant]),
                "kuadran_3_patuh_volume_tinggi": len([p for p in profiles if "Kuadran III" in p.risk_quadrant or "KUADRAN_III" in p.risk_quadrant]),
                "kuadran_4_patuh_rutin": len([p for p in profiles if "Kuadran IV" in p.risk_quadrant or "KUADRAN_IV" in p.risk_quadrant])
            }
        }


# Global Singleton
fraud_ranking_engine = FraudRankingEngine()
