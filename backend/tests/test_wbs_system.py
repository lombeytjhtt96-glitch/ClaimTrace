"""
Unit & Integration Tests for ClaimTrace Whistleblowing System (WBS)
Validates UU PDP No. 27/2022 Pasal 34 compliance, SHA-256 integrity,
and immutable Audit Ledger registration.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_wbs_report_submission_anonymous():
    """Test filing an anonymous whistleblowing report."""
    payload = {
        "category": "Phantom Billing",
        "faskes_name": "RSUD Test Daerah",
        "location": "Surabaya, Jawa Timur",
        "reporter_contact": "rahasia@test.com",  # Should be omitted due to is_anonymous
        "is_anonymous": True,
        "description": "Dugaan manipulasi klaim fiktif pasien rawat inap tanpa kehadiran fisik."
    }
    
    response = client.post("/api/v1/wbs/report", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["ticket_id"].startswith("WBS-2026-JKN-")
    assert data["status"] == "Diterima di Verifikator Pusat BPJS Kesehatan (Antrean Prioritas Wasrik)"
    assert data["reporter_contact_masked"] is None
    assert len(data["cryptographic_hash"]) == 64  # SHA-256
    assert data["audit_ledger_index"] > 0
    assert data["sla_deadline_days"] == 10


def test_wbs_report_submission_identified_with_masking():
    """Test filing an identified report with contact masking."""
    payload = {
        "category": "Repeat & Split Billing",
        "faskes_name": "RS Khusus Mitra Testing",
        "location": "Bandung, Jawa Barat",
        "reporter_contact": "081234567890",
        "is_anonymous": False,
        "description": "Klaim ganda fisioterapi berturut-turut pada hari yang sama."
    }
    
    response = client.post("/api/v1/wbs/report", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["ticket_id"].startswith("WBS-2026-JKN-")
    assert data["reporter_contact_masked"].startswith("0812")
    assert "****" in data["reporter_contact_masked"]
    assert data["reporter_contact_masked"].endswith("7890")
    assert data["audit_ledger_index"] > 0
    
    # Verify tracking
    ticket_id = data["ticket_id"]
    track_res = client.get(f"/api/v1/wbs/track/{ticket_id}")
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["ticket_id"] == ticket_id
    assert track_data["cryptographic_hash"] == data["cryptographic_hash"]
    assert track_data["audit_ledger_index"] == data["audit_ledger_index"]


def test_wbs_track_nonexistent_ticket():
    """Test tracking a nonexistent ticket returns found=False with explanation."""
    response = client.get("/api/v1/wbs/track/WBS-INVALID-9999")
    assert response.status_code == 200
    data = response.json()
    assert data["found"] is False
    assert "tidak ditemukan" in data["disposition"]


def test_wbs_reports_list():
    """Test fetching all WBS reports."""
    response = client.get("/api/v1/wbs/reports")
    assert response.status_code == 200
    data = response.json()
    assert "total_reports" in data
    assert data["total_reports"] >= 2
    assert isinstance(data["reports"], list)


def test_wbs_report_idempotency_defense():
    """Test idempotency key defense against race conditions / double submissions."""
    payload = {
        "category": "Phantom Billing",
        "faskes_name": "RS Idempotent Test",
        "location": "Semarang, Jawa Tengah",
        "reporter_contact": "081999888777",
        "is_anonymous": False,
        "description": "Laporan pengujian idempotensi untuk mencegah race condition perbankan/klaim."
    }
    headers = {"Idempotency-Key": "req-wbs-test-unique-key-12345"}
    
    # First submission
    resp1 = client.post("/api/v1/wbs/report", json=payload, headers=headers)
    assert resp1.status_code == 200
    data1 = resp1.json()

    # Immediate replay with same idempotency key
    resp2 = client.post("/api/v1/wbs/report", json=payload, headers=headers)
    assert resp2.status_code == 200
    data2 = resp2.json()

    # Must return exact same ticket and hash without creating phantom duplicates
    assert data1["ticket_id"] == data2["ticket_id"]
    assert data1["cryptographic_hash"] == data2["cryptographic_hash"]
    assert data1["audit_ledger_index"] == data2["audit_ledger_index"]


def test_wbs_report_validation_constraints():
    """Test payload validation constraints against payload bloat / DoS."""
    # Description too short (< 5 chars)
    payload_short = {
        "category": "Phantom Billing",
        "faskes_name": "RS Test",
        "location": "Jakarta",
        "is_anonymous": True,
        "description": "abc"
    }
    resp_short = client.post("/api/v1/wbs/report", json=payload_short)
    assert resp_short.status_code == 422  # Pydantic validation error
