"""
ClaimTrace ICD-10 Bilingual Terminology Service
Healthkathon BPJS Kesehatan 2026 • Kategori: Efisiensi Risiko pada Faskes (#6 & #11)
Tim Pengembang Nasional ClaimTrace • BPJS Kesehatan Tingkat Nasional

Provides high-performance in-memory indexing, search, and validation for 10,469 official
ICD-10 diagnostic codes with English (WHO) and Indonesian clinical translations.
Adapted from fendis0709/icd-10 for SATUSEHAT (PMK 24/2022) and BPJS vClaim / Vedika.
"""

import os
import json
import re
from typing import Dict, List, Optional, Any

# Primary and fallback data paths
BACKEND_DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data",
    "master_icd_x.json"
)
FALLBACK_DATA_PATH = os.path.expanduser("~/icd-10/master_icd_x.json")

CHAPTER_BLOCKS = [
    ("I", "A00", "B99", "Penyakit infeksi dan parasit tertentu", "Certain infectious and parasitic diseases"),
    ("II", "C00", "D48", "Neoplasma", "Neoplasms"),
    ("III", "D50", "D89", "Penyakit darah dan organ pembentuk darah", "Diseases of the blood and blood-forming organs"),
    ("IV", "E00", "E90", "Penyakit endokrin, nutrisi, dan metabolik", "Endocrine, nutritional and metabolic diseases"),
    ("V", "F00", "F99", "Gangguan mental dan perilaku", "Mental and behavioural disorders"),
    ("VI", "G00", "G99", "Penyakit sistem saraf", "Diseases of the nervous system"),
    ("VII", "H00", "H59", "Penyakit mata dan adneksa", "Diseases of the eye and adnexa"),
    ("VIII", "H60", "H95", "Penyakit telinga dan prosesus mastoid", "Diseases of the ear and mastoid process"),
    ("IX", "I00", "I99", "Penyakit sistem sirkulasi", "Diseases of the circulatory system"),
    ("X", "J00", "J99", "Penyakit sistem respirasi", "Diseases of the respiratory system"),
    ("XI", "K00", "K93", "Penyakit sistem pencernaan", "Diseases of the digestive system"),
    ("XII", "L00", "L99", "Penyakit kulit dan jaringan subkutan", "Diseases of the skin and subcutaneous tissue"),
    ("XIII", "M00", "M99", "Penyakit sistem muskuloskeletal", "Diseases of the musculoskeletal system"),
    ("XIV", "N00", "N99", "Penyakit sistem genitourinarius", "Diseases of the genitourinary system"),
    ("XV", "O00", "O99", "Kehamilan, persalinan, dan nifas", "Pregnancy, childbirth and the puerperium"),
    ("XVI", "P00", "P96", "Keadaan tertentu dari periode perinatal", "Certain conditions originating in the perinatal period"),
    ("XVII", "Q00", "Q99", "Malformasi kongenital dan deformitas", "Congenital malformations, deformations"),
    ("XVIII", "R00", "R99", "Gejala, tanda, dan temuan klinis abnormal", "Symptoms, signs and abnormal clinical findings"),
    ("XIX", "S00", "T98", "Cedera, keracunan, dan konsekuensi luar", "Injury, poisoning and consequences of external causes"),
    ("XX", "V01", "Y98", "Penyebab luar morbiditas dan mortalitas", "External causes of morbidity and mortality"),
    ("XXI", "Z00", "Z99", "Faktor penentu status kesehatan", "Factors influencing health status")
]

class ICD10TerminologyService:
    """
    In-Memory Service untuk pencarian, validasi, dan penerjemahan bilingual kode ICD-10.
    """
    _instance: Optional["ICD10TerminologyService"] = None

    def __init__(self, data_file: Optional[str] = None):
        self._by_code: Dict[str, Dict[str, str]] = {}
        self._by_normalized_code: Dict[str, Dict[str, str]] = {}
        self._items: List[Dict[str, str]] = []
        self._load_data(data_file)

    @classmethod
    def get_instance(cls) -> "ICD10TerminologyService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_data(self, data_file: Optional[str] = None) -> None:
        target_path = data_file
        if not target_path or not os.path.exists(target_path):
            if os.path.exists(BACKEND_DATA_PATH):
                target_path = BACKEND_DATA_PATH
            elif os.path.exists(FALLBACK_DATA_PATH):
                target_path = FALLBACK_DATA_PATH

        if not target_path or not os.path.exists(target_path):
            return

        try:
            with open(target_path, "r", encoding="utf-8") as f:
                records = json.load(f)
                for r in records:
                    code = str(r.get("kode_icd", "")).strip().upper()
                    name_en = str(r.get("nama_icd", "")).strip()
                    name_id = str(r.get("nama_icd_indo", "")).strip()
                    if not code:
                        continue
                    entry = {
                        "code": code,
                        "name_en": name_en,
                        "name_id": name_id
                    }
                    self._by_code[code] = entry
                    # Normalized code without dot (e.g. A000)
                    norm_code = code.replace(".", "")
                    self._by_normalized_code[norm_code] = entry
                    self._items.append(entry)
        except Exception as e:
            # Fallback gracefully
            pass

    @property
    def total_codes(self) -> int:
        return len(self._by_code)

    def lookup(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Cari satu kode ICD-10 secara tepat atau ternormalisasi.
        """
        clean_code = code.strip().upper()
        if clean_code in self._by_code:
            entry = self._by_code[clean_code].copy()
            entry["chapter"] = self.get_chapter(clean_code)
            return entry

        norm_code = clean_code.replace(".", "")
        if norm_code in self._by_normalized_code:
            entry = self._by_normalized_code[norm_code].copy()
            entry["chapter"] = self.get_chapter(entry["code"])
            return entry

        # Category level lookup (e.g., if code is A00.0, fallback to A00 if exists)
        if "." in clean_code:
            category = clean_code.split(".")[0]
            if category in self._by_code:
                entry = self._by_code[category].copy()
                entry["chapter"] = self.get_chapter(category)
                entry["category_match"] = True
                return entry

        return None

    def is_valid_code(self, code: str) -> bool:
        """
        Validasi apakah sebuah kode ICD-10 terdaftar dalam master data resmi.
        """
        clean_code = code.strip().upper()
        if clean_code in self._by_code:
            return True
        norm_code = clean_code.replace(".", "")
        if norm_code in self._by_normalized_code:
            return True
        # If code has dot, check if base 3-char category exists
        if "." in clean_code:
            category = clean_code.split(".")[0]
            if category in self._by_code:
                return True
        return False

    def search(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Pencarian substring pada kode ICD-10, nama Bahasa Inggris, dan nama Bahasa Indonesia.
        """
        q = query.strip().lower()
        if not q:
            return []

        results = []
        # Priority 1: Prefix match on code
        for item in self._items:
            if item["code"].lower().startswith(q) or item["code"].replace(".", "").lower().startswith(q):
                res = item.copy()
                res["chapter"] = self.get_chapter(item["code"])
                results.append(res)
                if len(results) >= limit:
                    return results

        # Priority 2: Substring in Indonesian name or English name
        for item in self._items:
            if item in results:
                continue
            if q in item["name_id"].lower() or q in item["name_en"].lower():
                res = item.copy()
                res["chapter"] = self.get_chapter(item["code"])
                results.append(res)
                if len(results) >= limit:
                    break

        return results

    def get_chapter(self, code: str) -> Optional[Dict[str, str]]:
        """
        Menentukan bab (Chapter) ICD-10 berdasarkan kategori 3-karakter kode.
        """
        if not code or len(code) < 3:
            return None
        cat = code[:3].upper()
        for ch_num, start_cat, end_cat, desc_id, desc_en in CHAPTER_BLOCKS:
            if start_cat <= cat <= end_cat:
                return {
                    "chapter_number": ch_num,
                    "block": f"{start_cat}-{end_cat}",
                    "title_id": desc_id,
                    "title_en": desc_en
                }
        return None

icd10_service = ICD10TerminologyService.get_instance()
