"""
ClaimTrace JKN - Real Claim Document Bundle Submission Store
Persists Faskes-uploaded claim document metadata (SEP, Resume Medis,
Laporan Operasi, Lab, Radiologi, Bukti E-Klaim) and converts them into
ClaimDocumentAuditor DocumentMetadata objects so audits evaluate real
submitted evidence rather than falling back solely to synthetic examples.
"""

from __future__ import annotations

import json
import os
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

_STORE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data",
    "submitted_document_bundles.json",
)
_LOCK = threading.Lock()


def _load_all() -> Dict[str, Any]:
    if not os.path.exists(_STORE_PATH):
        return {}
    try:
        with open(_STORE_PATH, "r", encoding="utf-8") as fh:
            data = json.load(fh)
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _save_all(data: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(_STORE_PATH), exist_ok=True)
    tmp_path = f"{_STORE_PATH}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
    os.replace(tmp_path, _STORE_PATH)


def save_submitted_bundle(
    claim_id: str,
    documents: List[Dict[str, Any]],
    submitted_by: str,
    ina_cbg_code: str = "Z-3-12-0",
    primary_icd10: str = "M54.5",
    secondary_icd10s: Optional[List[str]] = None,
    procedure_icd9cm: Optional[str] = None,
    claimed_tariff_rp: float = 0.0,
) -> Dict[str, Any]:
    """Persist a real submitted document bundle for a claim atomically."""
    record = {
        "claim_id": claim_id.strip().upper(),
        "submitted_by": submitted_by,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "ina_cbg_code": ina_cbg_code.strip().upper(),
        "primary_icd10": primary_icd10.strip().upper(),
        "secondary_icd10s": [s.strip().upper() for s in (secondary_icd10s or []) if s],
        "procedure_icd9cm": procedure_icd9cm.strip() if procedure_icd9cm else None,
        "claimed_tariff_rp": float(claimed_tariff_rp or 0.0),
        "documents": documents,
    }
    with _LOCK:
        all_data = _load_all()
        all_data[record["claim_id"]] = record
        _save_all(all_data)
    return record


def get_submitted_bundle(claim_id: str) -> Optional[Dict[str, Any]]:
    key = claim_id.strip().upper()
    with _LOCK:
        all_data = _load_all()
        return all_data.get(key)


def delete_submitted_bundle(claim_id: str) -> bool:
    key = claim_id.strip().upper()
    with _LOCK:
        all_data = _load_all()
        if key not in all_data:
            return False
        del all_data[key]
        _save_all(all_data)
        return True


def list_submitted_bundles() -> List[Dict[str, Any]]:
    with _LOCK:
        all_data = _load_all()
        return list(all_data.values())
