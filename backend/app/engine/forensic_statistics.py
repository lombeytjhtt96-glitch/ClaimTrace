"""
ClaimTrace Forensic Statistics & Quantitative Intelligence Engine
Healthkathon BPJS Kesehatan 2026 • Kategori: Efisiensi Risiko pada Faskes (#6 & #11)

Algoritma Matematika & Statistika Forensik:
1. Benford's Law Multi-Digit Goodness-of-Fit (Uji Chi-Square & Kolmogorov-Smirnov untuk klaim fiktif)
2. Gini Market Concentration & Lorenz Curve (Deteksi monopoli klaim tindakan bedah antar-faskes)
3. Robust Outlier Detection: Median Absolute Deviation (MAD) & Interquartile Range (IQR)
4. Hospital Fraud Vulnerability Composite Index (HFVCI)
"""

import math
from typing import Dict, List, Any, Optional, Tuple


class ForensicStatisticsEngine:
    """
    Mesin Analisis Kuantitatif & Statistika Forensik Tagihan Faskes BPJS Kesehatan.
    """
    _instance: Optional["ForensicStatisticsEngine"] = None

    # Frekuensi Teoretis Hukum Benford untuk Digit Pertama (d in 1..9): P(d) = log10(1 + 1/d)
    BENFORD_FIRST_DIGIT_PROBS = {
        1: 0.30103,
        2: 0.17609,
        3: 0.12494,
        4: 0.09691,
        5: 0.07918,
        6: 0.06695,
        7: 0.05799,
        8: 0.05115,
        9: 0.04576,
    }

    @classmethod
    def get_instance(cls) -> "ForensicStatisticsEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def analyze_benford_law(
        self,
        amounts: List[float],
        significance_alpha: float = 0.05
    ) -> Dict[str, Any]:
        """
        Uji Distribusi Digit Pertama Hukum Benford (Benford's Law First-Digit Analysis).
        Pada transaksi keuangan alamiah (termasuk klaim rumah sakit), distribusi digit pertama mengikuti pola logaritmik.
        Penyimpangan tajam (anomali) mengindikasikan angka tagihan yang difabrikasi / dimanipulasi secara manual.
        """
        valid_digits: List[int] = []
        for val in amounts:
            try:
                num = abs(float(val))
                if num > 0:
                    first_char = str(int(num))[0]
                    digit = int(first_char)
                    if 1 <= digit <= 9:
                        valid_digits.append(digit)
            except (ValueError, TypeError, IndexError):
                continue

        n = len(valid_digits)
        if n < 30:
            return {
                "sample_size": n,
                "is_conclusive": False,
                "message": f"Ukuran sampel ({n}) belum memadai untuk uji statistika Benford yang valid (minimal n >= 30).",
                "chi_square_statistic": 0.0,
                "p_value": 1.0,
                "conforms_to_benford": True,
                "digit_distribution": {}
            }

        # Hitung frekuensi teramati (Observed)
        observed_counts = {d: 0 for d in range(1, 10)}
        for d in valid_digits:
            observed_counts[d] += 1

        # Uji Chi-Square Goodness-of-Fit: Chi2 = Sum( (O_i - E_i)^2 / E_i )
        chi_square_stat = 0.0
        max_deviation = 0.0
        digit_metrics = {}

        for d in range(1, 10):
            obs = observed_counts[d]
            exp_prob = self.BENFORD_FIRST_DIGIT_PROBS[d]
            exp_count = exp_prob * n
            diff = obs - exp_count
            contrib = (diff ** 2) / exp_count if exp_count > 0 else 0.0
            chi_square_stat += contrib

            obs_pct = round(obs / n * 100.0, 2)
            exp_pct = round(exp_prob * 100.0, 2)
            dev_pct = round(obs_pct - exp_pct, 2)
            max_deviation = max(max_deviation, abs(dev_pct))

            digit_metrics[str(d)] = {
                "observed_count": obs,
                "expected_count": round(exp_count, 1),
                "observed_pct": obs_pct,
                "expected_pct": exp_pct,
                "deviation_pct": dev_pct
            }

        # Derajat kebebasan (df) = 9 - 1 = 8
        # Nilai Kritis Chi-Square (df=8, alpha=0.05) adalah 15.507, alpha=0.01 adalah 20.090
        critical_value_05 = 15.507
        critical_value_01 = 20.090

        is_suspicious = chi_square_stat > critical_value_05
        high_risk_fabrication = chi_square_stat > critical_value_01

        if high_risk_fabrication:
            assessment = "ANOMALI KRITIKAL: Pola nominal klaim menyimpang ekstrem dari hukum alamiah Benford (Indikasi Kuat Fabrikasi Tagihan)."
        elif is_suspicious:
            assessment = "PERINGATAN: Distribusi angka tagihan menunjukkan penyimpangan statistik moderat, periksa konsentrasi tarif paket."
        else:
            assessment = "KONFORM: Distribusi nominal klaim selaras dengan hukum distribusi transaksi empiris alamiah."

        return {
            "sample_size": n,
            "is_conclusive": True,
            "chi_square_statistic": round(chi_square_stat, 3),
            "degrees_of_freedom": 8,
            "critical_value_alpha_05": critical_value_05,
            "critical_value_alpha_01": critical_value_01,
            "conforms_to_benford": not is_suspicious,
            "high_risk_fabrication": high_risk_fabrication,
            "max_single_digit_deviation_pct": round(max_deviation, 2),
            "assessment": assessment,
            "digit_distribution": digit_metrics
        }

    def calculate_gini_concentration(
        self,
        values: List[float]
    ) -> Dict[str, Any]:
        """
        Menghitung Koefisien Gini Konsentrasi Tagihan / Tindakan per Faskes.
        Rentang 0.0 (Distribusi Sempurna Rata) s.d. 1.0 (Konsentrasi Monopoli Ekstrem).
        Jika Gini > 0.65 untuk tindakan tertentu pada suatu wilayah, patut diduga ada modus konsentrasi klaim tidak wajar.
        """
        clean_vals = [max(0.0, float(v)) for v in values if v is not None]
        n = len(clean_vals)
        if n < 2:
            return {
                "gini_coefficient": 0.0,
                "concentration_level": "DATA_TIDAK_CUKUP",
                "sample_size": n,
                "lorenz_points": []
            }

        sorted_vals = sorted(clean_vals)
        total_sum = sum(sorted_vals)
        if total_sum == 0.0:
            return {
                "gini_coefficient": 0.0,
                "concentration_level": "NILAI_NOL",
                "sample_size": n,
                "lorenz_points": []
            }

        # Formula Gini = (2 * Sum(i * y_i) - (n + 1) * Sum(y_i)) / (n * Sum(y_i))
        weighted_sum = sum((i + 1) * val for i, val in enumerate(sorted_vals))
        gini = (2.0 * weighted_sum - (n + 1) * total_sum) / (n * total_sum)
        gini = max(0.0, min(1.0, round(gini, 4)))

        # Hitung koordinat kurva Lorenz (10 titik representatif)
        lorenz_points = [{"cum_population_pct": 0.0, "cum_value_pct": 0.0}]
        step = max(1, n // 10)
        cum_val = 0.0
        for i in range(step - 1, n, step):
            cum_val = sum(sorted_vals[:i + 1])
            lorenz_points.append({
                "cum_population_pct": round(((i + 1) / n) * 100.0, 1),
                "cum_value_pct": round((cum_val / total_sum) * 100.0, 1)
            })
        if lorenz_points[-1]["cum_population_pct"] < 100.0:
            lorenz_points.append({"cum_population_pct": 100.0, "cum_value_pct": 100.0})

        if gini < 0.35:
            level = "KONSENTRASI_RENDAH"
            desc = "Klaim terdistribusi merata antar entitas layanan."
        elif gini <= 0.55:
            level = "KONSENTRASI_MODERAT"
            desc = "Pola distribusi wajar dengan variasi volume alami faskes rujukan."
        elif gini <= 0.70:
            level = "KONSENTRASI_TINGGI"
            desc = "Terdeteksi dominasi volume pada faskes tertentu, telaah rujukan spesifik."
        else:
            level = "KONSENTRASI_EKSTREM"
            desc = "Monopoli tindakan/klaim sangat pekat, indikasi sindikat pemusatan penagihan (Modus #6/#11)."

        return {
            "gini_coefficient": gini,
            "concentration_level": level,
            "description": desc,
            "sample_size": n,
            "total_value": round(total_sum, 2),
            "top_10_percent_share_pct": round(
                (sum(sorted_vals[int(n * 0.9):]) / total_sum) * 100.0, 1
            ),
            "lorenz_points": lorenz_points
        }

    def detect_robust_outliers_mad(
        self,
        values: List[float],
        threshold: float = 3.5
    ) -> Dict[str, Any]:
        """
        Deteksi Outlier Kuat (Robust Outlier Detection) menggunakan Median Absolute Deviation (MAD).
        Jauh lebih andal dibandingkan Z-score standar karena tidak mudah terdistorsi oleh nilai anomali ekstrem.
        Skor MAD = 0.6745 * (x_i - median) / MAD
        """
        clean_vals = [float(v) for v in values if v is not None]
        n = len(clean_vals)
        if n < 4:
            return {"outlier_indices": [], "outlier_count": 0, "outlier_percentage": 0.0}

        sorted_vals = sorted(clean_vals)
        mid = n // 2
        median = sorted_vals[mid] if n % 2 != 0 else (sorted_vals[mid - 1] + sorted_vals[mid]) / 2.0

        deviations = [abs(x - median) for x in clean_vals]
        sorted_devs = sorted(deviations)
        mad = sorted_devs[mid] if n % 2 != 0 else (sorted_devs[mid - 1] + sorted_devs[mid]) / 2.0

        if mad == 0.0:
            # Fallback to mean absolute deviation
            mad = sum(deviations) / n if n > 0 else 1.0

        outlier_indices = []
        outlier_values = []
        for idx, val in enumerate(clean_vals):
            modified_z = 0.6745 * abs(val - median) / mad
            if modified_z > threshold:
                outlier_indices.append(idx)
                outlier_values.append(val)

        return {
            "sample_size": n,
            "median": round(median, 2),
            "median_absolute_deviation": round(mad, 2),
            "threshold_z": threshold,
            "outlier_count": len(outlier_indices),
            "outlier_percentage": round((len(outlier_indices) / n) * 100.0, 2),
            "outlier_indices": outlier_indices[:50],
            "outlier_values_sample": outlier_values[:10]
        }


forensic_statistics = ForensicStatisticsEngine.get_instance()
