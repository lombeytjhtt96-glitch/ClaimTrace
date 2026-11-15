"""
ClaimTrace JKN - Formal Claims Appeals & Sanggahan BAKB Engine
Implements structured clinical appeal submission (Sanggahan Berita Acara
Kelayakan Berkas), objective evidence checklists, Permenkes 16/2019 dispute
pathways, and 15-calendar-day Perpres No. 82/2018 Pasal 76(2)-(3) SLA &
statutory late-payment penalty tracking.
"""

from __future__ import annotations

import hashlib
import json
import os
import threading
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

_APPEALS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data",
    "appeals_records.json",
)
_LOCK = threading.Lock()

STATUTORY_SLA_DAYS = 15
DAILY_STATUTORY_PENALTY_RATE = 0.01 / 30.0  # Perpres 82/2018 Pasal 76(3): 1% per month prorated daily

APPEAL_REASON_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "KODING_RULE_MB": {
        "label": "Sanggahan Sekuens Diagnosis Utama / Rule MB1-MB5",
        "required_evidence": [
            "Resume Medis Elektronk (RME) bertanda tangan DPJP",
            "Catatan Perkembangan Pasien Terintegrasi (CPPT) & SOAP Harian",
            "Bukti Penunjang Etiologi Definitif (Lab/Radiologi/PA)",
        ],
        "legal_basis": "Permenkes No. 76/2016 (Kaidah Koding INA-CBG & WHO Rule MB1-MB5)",
    },
    "FORNAS_RESTRICTION": {
        "label": "Sanggahan Restriksi Obat Formularium Nasional",
        "required_evidence": [
            "Hasil Lab/Biomarker Khusus (mis. Albumin < 2.5, Hb, Kultur/IHC)",
            "Protokol Terapi Komite Farmasi & Terapi (KFT) Faskes",
            "Resep & Lembar Pemberian Obat Pasien",
        ],
        "legal_basis": "KMK Formularium Nasional & Permenkes No. 3/2023",
    },
    "READMISSION_CLINICAL": {
        "label": "Sanggahan Admisi Ulang < 30 Hari (Indikasi Klinis Baru/Akut)",
        "required_evidence": [
            "Ringkasan Pulang Episode Sebelumnya (Kondisi Stabil Saat Pulang)",
            "Asesmen IGD Episode Kedua Membuktikan Kondisi Klinis Akut Berbeda",
        ],
        "legal_basis": "Perpres No. 82/2018 Pasal 76 & Pedoman Verifikasi BPJS Kesehatan",
    },
    "DOCUMENT_COMPLETENESS": {
        "label": "Susulan Kelengkapan Berkas / SEP / Laporan Operasi",
        "required_evidence": [
            "SEP Tervalidasi VClaim / FRISTA Biometrik",
            "Laporan Operasi / Tindakan Diagnostik Lengkap",
        ],
        "legal_basis": "PMK No. 24/2022 Rekam Medis Elektronik & VEDIKA BPJS Kesehatan",
    },
}


def _seed_initial_appeals() -> List[Dict[str, Any]]:
    today = date.today()
    d_urgent = (today - timedelta(days=13)).isoformat()
    d_resolved = (today - timedelta(days=19)).isoformat()
    return [
        {
            "appeal_id": "APL-2026-001",
            "claim_id": "CLM-2026-8801",
            "bakb_number": "BAKB/2026/CLM-2026-8801",
            "faskes_name": "RS Medika Prima",
            "appeal_category": "READMISSION_CLINICAL",
            "disputed_amount_rp": 18500000.0,
            "recovered_amount_rp": 0.0,
            "clinical_argument": (
                "Pasien dipulangkan dalam kondisi hemodinamik stabil pada episode pertama. "
                "Admisi kedua disebabkan komplikasi pasca-tindakan akut yang tidak dapat diprediksi saat pulang."
            ),
            "supporting_documents": ["CPPT IGD Episode 2", "Resume Pulang Episode 1 bertanda tangan DPJP"],
            "proposed_icd10": "I21.4",
            "status": "DALAM_TELAAH_TIM_KENDALI",
            "submitted_at": f"{d_urgent}T09:15:00+00:00",
            "submitted_date": d_urgent,
            "submitted_by": "Tim JKN RS Medika Prima",
            "resolution_note": None,
            "resolved_at": None,
            "resolved_by": None,
            "audit_hash": hashlib.sha256("APL-2026-001|CLM-2026-8801".encode("utf-8")).hexdigest(),
        },
        {
            "appeal_id": "APL-2026-002",
            "claim_id": "CLM-2026-8803",
            "bakb_number": "BAKB/2026/CLM-2026-8803",
            "faskes_name": "RS Sentosa Nusantara",
            "appeal_category": "FORNAS_RESTRICTION",
            "disputed_amount_rp": 6400000.0,
            "recovered_amount_rp": 6400000.0,
            "clinical_argument": (
                "Faskes melampirkan hasil laboratorium serum albumin 2.1 g/dL serta protokol asites masif "
                "yang memenuhi kriteria restriksi Formularium Nasional."
            ),
            "supporting_documents": ["Hasil Lab Albumin 2.1 g/dL", "Lembar Protokol KFT"],
            "proposed_icd10": "K74.6",
            "status": "DITERIMA_PENUH",
            "submitted_at": f"{d_resolved}T10:30:00+00:00",
            "submitted_date": d_resolved,
            "submitted_by": "Komite Medik RS Sentosa Nusantara",
            "resolution_note": "Bukti laboratorium objektif (< 2.5 g/dL) terverifikasi. Klaim disetujui bayar penuh.",
            "resolved_at": f"{(today - timedelta(days=5)).isoformat()}T14:20:00+00:00",
            "resolved_by": "Verifikator Senior BPJS (KC Jakarta Pusat)",
            "audit_hash": hashlib.sha256("APL-2026-002|CLM-2026-8803".encode("utf-8")).hexdigest(),
        },
    ]


def _load_records() -> List[Dict[str, Any]]:
    if not os.path.exists(_APPEALS_PATH):
        seeded = _seed_initial_appeals()
        _save_records(seeded)
        return seeded
    try:
        with open(_APPEALS_PATH, "r", encoding="utf-8") as fh:
            data = json.load(fh)
            if isinstance(data, list):
                return data
    except Exception:
        pass
    seeded = _seed_initial_appeals()
    return seeded


def _save_records(records: List[Dict[str, Any]]) -> None:
    os.makedirs(os.path.dirname(_APPEALS_PATH), exist_ok=True)
    tmp_path = f"{_APPEALS_PATH}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as fh:
        json.dump(records, fh, ensure_ascii=False, indent=2)
    os.replace(tmp_path, _APPEALS_PATH)


def _enrich_sla(record: Dict[str, Any], as_of: Optional[date] = None) -> Dict[str, Any]:
    """Compute live Perpres 82/2018 Pasal 76(2)-(3) 15-calendar-day SLA & penalty metrics."""
    today = as_of or date.today()
    sub_date_str = str(record.get("submitted_date") or record.get("submitted_at", today.isoformat()))[:10]
    try:
        sub_date = date.fromisoformat(sub_date_str)
    except ValueError:
        sub_date = today

    sla_deadline = sub_date + timedelta(days=STATUTORY_SLA_DAYS)
    elapsed_days = max(0, (today - sub_date).days)
    remaining_days = (sla_deadline - today).days
    is_closed = record.get("status") in ("DITERIMA_PENUH", "DITERIMA_SEBAGIAN", "DITOLAK_TETAP")

    overdue_days = max(0, -remaining_days) if not is_closed else 0
    disputed_rp = float(record.get("disputed_amount_rp") or 0.0)
    estimated_penalty_rp = round(disputed_rp * DAILY_STATUTORY_PENALTY_RATE * overdue_days, 2)

    if is_closed:
        sla_status = "SELESAI_TERATUR"
    elif overdue_days > 0:
        sla_status = "LEWAT_BATAS_DENDA_1PCT"
    elif remaining_days <= 3:
        sla_status = "KRITIS_MENDEKATI_BATAS"
    else:
        sla_status = "DALAM_BATAS_15_HARI"

    enriched = dict(record)
    enriched["sla_deadline"] = sla_deadline.isoformat()
    enriched["elapsed_calendar_days"] = elapsed_days
    enriched["remaining_calendar_days"] = remaining_days
    enriched["overdue_calendar_days"] = overdue_days
    enriched["is_overdue"] = overdue_days > 0
    enriched["sla_status"] = sla_status
    enriched["estimated_penalty_rp"] = estimated_penalty_rp
    enriched["template_meta"] = APPEAL_REASON_TEMPLATES.get(
        record.get("appeal_category", ""),
        APPEAL_REASON_TEMPLATES["DOCUMENT_COMPLETENESS"],
    )
    return enriched


def list_appeals(status_filter: Optional[str] = None) -> Dict[str, Any]:
    with _LOCK:
        records = _load_records()
    enriched = [_enrich_sla(r) for r in records]
    if status_filter and status_filter.upper() != "ALL":
        sf = status_filter.upper()
        enriched = [r for r in enriched if str(r.get("status", "")).upper() == sf]

    enriched.sort(key=lambda r: r.get("submitted_at", ""), reverse=True)
    open_items = [r for r in enriched if r.get("status") not in ("DITERIMA_PENUH", "DITERIMA_SEBAGIAN", "DITOLAK_TETAP")]
    return {
        "total_appeals": len(enriched),
        "open_appeals": len(open_items),
        "overdue_count": sum(1 for r in open_items if r.get("is_overdue")),
        "urgent_count": sum(1 for r in open_items if not r.get("is_overdue") and r.get("remaining_calendar_days", 99) <= 3),
        "total_disputed_rp": sum(float(r.get("disputed_amount_rp") or 0.0) for r in enriched),
        "total_recovered_rp": sum(float(r.get("recovered_amount_rp") or 0.0) for r in enriched),
        "total_estimated_penalty_rp": sum(float(r.get("estimated_penalty_rp") or 0.0) for r in open_items),
        "legal_basis": "Perpres No. 82/2018 Pasal 76 ayat (2)-(3) (SLA Pembayaran 15 Hari & Denda 1%/bulan) & Permenkes No. 16/2019",
        "templates": APPEAL_REASON_TEMPLATES,
        "appeals": enriched,
    }


def submit_appeal(
    claim_id: str,
    faskes_name: str,
    appeal_category: str,
    disputed_amount_rp: float,
    clinical_argument: str,
    supporting_documents: List[str],
    submitted_by: str,
    bakb_number: Optional[str] = None,
    proposed_icd10: Optional[str] = None,
    submitted_date_override: Optional[str] = None,
) -> Dict[str, Any]:
    now_dt = datetime.now(timezone.utc)
    sub_date = submitted_date_override or now_dt.date().isoformat()
    appeal_id = f"APL-{now_dt.year}-{uuid.uuid4().hex[:6].upper()}"
    cid = claim_id.strip().upper()
    cat = appeal_category.strip().upper()
    if cat not in APPEAL_REASON_TEMPLATES:
        cat = "DOCUMENT_COMPLETENESS"

    audit_hash = hashlib.sha256(
        f"{appeal_id}|{cid}|{cat}|{disputed_amount_rp}|{now_dt.isoformat()}".encode("utf-8")
    ).hexdigest()

    new_rec = {
        "appeal_id": appeal_id,
        "claim_id": cid,
        "bakb_number": bakb_number or f"BAKB/{now_dt.strftime('%Y%m%d')}/{cid}",
        "faskes_name": faskes_name.strip() or "Faskes Rujukan Lanjutan",
        "appeal_category": cat,
        "disputed_amount_rp": float(disputed_amount_rp or 0.0),
        "recovered_amount_rp": 0.0,
        "clinical_argument": clinical_argument.strip(),
        "supporting_documents": [d.strip() for d in supporting_documents if d and d.strip()],
        "proposed_icd10": proposed_icd10.strip().upper() if proposed_icd10 else None,
        "status": "DIAJUKAN_FASKES",
        "submitted_at": now_dt.isoformat(),
        "submitted_date": sub_date,
        "submitted_by": submitted_by,
        "resolution_note": None,
        "resolved_at": None,
        "resolved_by": None,
        "audit_hash": audit_hash,
    }

    with _LOCK:
        records = _load_records()
        records.append(new_rec)
        _save_records(records)

    return _enrich_sla(new_rec)


def adjudicate_appeal(
    appeal_id: str,
    decision: str,
    approved_amount_rp: float,
    resolution_note: str,
    resolved_by: str,
) -> Optional[Dict[str, Any]]:
    norm_dec = decision.strip().upper()
    valid_decisions = ("DITERIMA_PENUH", "DITERIMA_SEBAGIAN", "DITOLAK_TETAP", "REVIEW_KOMITE_MEDIK")
    if norm_dec not in valid_decisions:
        norm_dec = "REVIEW_KOMITE_MEDIK"

    with _LOCK:
        records = _load_records()
        target_idx = None
        for idx, rec in enumerate(records):
            if rec.get("appeal_id") == appeal_id:
                target_idx = idx
                break
        if target_idx is None:
            return None

        rec = dict(records[target_idx])
        rec["status"] = norm_dec
        if norm_dec == "DITERIMA_PENUH":
            rec["recovered_amount_rp"] = float(rec.get("disputed_amount_rp") or approved_amount_rp or 0.0)
        elif norm_dec == "DITERIMA_SEBAGIAN":
            rec["recovered_amount_rp"] = max(0.0, min(float(approved_amount_rp or 0.0), float(rec.get("disputed_amount_rp") or approved_amount_rp or 0.0)))
        elif norm_dec == "DITOLAK_TETAP":
            rec["recovered_amount_rp"] = 0.0

        rec["resolution_note"] = resolution_note.strip()
        rec["resolved_by"] = resolved_by
        rec["resolved_at"] = datetime.now(timezone.utc).isoformat()
        rec["audit_hash"] = hashlib.sha256(
            f"{rec['appeal_id']}|{norm_dec}|{rec['recovered_amount_rp']}|{rec['resolved_at']}".encode("utf-8")
        ).hexdigest()
        records[target_idx] = rec
        _save_records(records)

    return _enrich_sla(rec)
