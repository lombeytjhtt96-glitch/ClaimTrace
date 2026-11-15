"""
ClaimTrace Temporal Causality & Trajectory Coherence Engine
Healthkathon BPJS Kesehatan 2026 • Kategori: Efisiensi Risiko pada Faskes (#6 & #11)
Standar: Permenkes No. 26/2021 & Kaidah Validasi Rekam Medis Elektronik (RME)

Fitur:
1. Verifikasi Kausalitas Temporal Episode Layanan (Forward Clinical Trajectory Validation)
2. Deteksi Anomali Urutan Waktu (Temporal Inversion: Tindakan mendahului tanggal rujukan/admisi)
3. Deteksi Klaim Pasca Kematian (Post-Mortem Phantom Billing)
4. Geovelocity Haversine Collision Matrix (Deteksi perpindahan faskes berkecepatan mustahil > 120 km/jam)
"""

import math
import datetime
from typing import Dict, List, Any, Optional, Tuple


class TemporalCoherenceEngine:
    """
    Mesin Analisis Kausalitas & Kronologi Episode Medis untuk Penapisan Pra-Bayar BPJS Kesehatan.
    """
    _instance: Optional["TemporalCoherenceEngine"] = None

    @classmethod
    def get_instance(cls) -> "TemporalCoherenceEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _parse_date(self, val: Any) -> Optional[datetime.date]:
        if not val:
            return None
        if isinstance(val, datetime.date):
            return val
        if isinstance(val, datetime.datetime):
            return val.date()
        val_str = str(val).strip()
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y%m%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
            try:
                return datetime.datetime.strptime(val_str[:10], fmt[:8] if len(fmt) > 8 else fmt).date()
            except ValueError:
                continue
        return None

    def haversine_distance_km(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        Menghitung jarak lengkung bumi (Great Circle Distance) dalam kilometer menggunakan formula Haversine.
        """
        R = 6371.0 # Radius bumi dalam km
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (math.sin(delta_phi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return round(R * c, 2)

    def validate_geovelocity_collision(
        self,
        event_a: Dict[str, Any],
        event_b: Dict[str, Any],
        max_realistic_speed_kmh: float = 120.0
    ) -> Dict[str, Any]:
        """
        Memverifikasi kemungkinan perpindahan fisik dokter atau pasien antara dua faskes berbeda.
        event_a / event_b format: {"lat": float, "lon": float, "timestamp": str|datetime, "faskes_name": str}
        """
        lat1 = float(event_a.get("lat", 0.0))
        lon1 = float(event_a.get("lon", 0.0))
        lat2 = float(event_b.get("lat", 0.0))
        lon2 = float(event_b.get("lon", 0.0))

        distance_km = self.haversine_distance_km(lat1, lon1, lat2, lon2)
        
        # Ekstraksi delta waktu (dalam jam)
        dt_a = self._parse_date(event_a.get("timestamp") or event_a.get("service_date"))
        dt_b = self._parse_date(event_b.get("timestamp") or event_b.get("service_date"))

        # Jika hari yang sama, hitung selisih jam jika ada waktu spesifik, atau default minimum 0.5 jam
        hours_gap = 1.0
        if dt_a and dt_b:
            days_diff = abs((dt_b - dt_a).days)
            if days_diff == 0:
                # Same day collision
                hours_gap = float(event_b.get("hours_gap", 0.75)) # Default asumsi rentang waktu 45 menit jika beda RS di hari sama
            else:
                hours_gap = float(days_diff * 24.0)

        hours_gap = max(0.1, hours_gap)
        required_speed_kmh = round(distance_km / hours_gap, 1)

        is_impossible = (distance_km > 50.0 and required_speed_kmh > max_realistic_speed_kmh)

        return {
            "distance_km": distance_km,
            "time_gap_hours": hours_gap,
            "implied_speed_kmh": required_speed_kmh,
            "max_realistic_speed_kmh": max_realistic_speed_kmh,
            "is_physically_impossible": is_impossible,
            "faskes_origin": event_a.get("faskes_name", "Faskes A"),
            "faskes_destination": event_b.get("faskes_name", "Faskes B"),
            "fraud_flag": "IND-GEOVELOCITY-COLLISION" if is_impossible else None,
            "assessment": (
                f"ANOMALI KECEPATAN FISIK: Kecepatan perpindahan {required_speed_kmh} km/jam melebihi batas realistis darat."
                if is_impossible else "Perjalanan antar-lokasi berada dalam batas kewajaran geografis."
            )
        }

    def validate_episode_causality(
        self,
        admission_date_str: Any,
        discharge_date_str: Any,
        procedure_date_str: Optional[Any] = None,
        patient_death_date_str: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Validasi Urutan Waktu & Kausalitas Kronologis Klaim.
        Mendeteksi klaim berurutan terbalik (Temporal Inversion) dan klaim pasca kematian pasien.
        """
        adm = self._parse_date(admission_date_str)
        dis = self._parse_date(discharge_date_str)
        proc = self._parse_date(procedure_date_str)
        death = self._parse_date(patient_death_date_str)

        violations: List[str] = []
        is_coherent = True
        severity = "NORMAL"

        if adm and dis:
            if dis < adm:
                is_coherent = False
                violations.append("Tanggal pulang (discharge) mendahului tanggal masuk (admission).")
                severity = "CRITICAL"

        if proc and adm:
            if proc < adm:
                is_coherent = False
                violations.append("Tanggal prosedur medis mendahului tanggal pendaftaran/admisi pasien.")
                severity = "HIGH"

        if proc and dis:
            if proc > dis:
                is_coherent = False
                violations.append("Tanggal prosedur medis dilakukan setelah pasien resmi dinyatakan pulang.")
                severity = "HIGH"

        if death and adm:
            if adm > death:
                is_coherent = False
                violations.append(f"Klaim layanan diajukan pada tanggal {adm}, padahal peserta tercatat wafat pada {death} (Post-Mortem Phantom Billing Modus #6).")
                severity = "CRITICAL"

        return {
            "is_coherent": is_coherent,
            "severity": severity,
            "violations_count": len(violations),
            "violations": violations,
            "admission_date": str(adm) if adm else None,
            "discharge_date": str(dis) if dis else None,
            "procedure_date": str(proc) if proc else None,
            "patient_death_date": str(death) if death else None
        }


temporal_coherence = TemporalCoherenceEngine.get_instance()
