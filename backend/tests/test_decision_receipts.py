"""
Unit and Integration Tests for ClaimTrace JKN Decision Receipts & Human Gate.
Verifies patterns from OpenAgentOntology and RA-QM:
- ra-qm-team/skills/agent-decision-receipts (Tamper-evident action manifests, offline verification)
- engineering/human-gate (Human-in-the-loop review gate, blocker resolution, NIP validation)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine.decision_receipts_engine import (
    mint_decision_receipt,
    verify_decision_receipt,
    apply_human_gate_review,
    list_all_decision_receipts,
    get_decision_receipt,
    compute_batch_receipts_manifest,
)

client = TestClient(app)

def test_mint_decision_receipt_valid():
    """Verifies standard minting of a decision receipt with canonical digest and digital seal."""
    receipt = mint_decision_receipt(
        agent_id="test-agent",
        operation="FLAG_FRAUD",
        target="CLM-TEST-001 - RS Uji Coba",
        policy="Perpres No. 82/2018 Pasal 76",
        decision_label="PHANTOM_BILLING",
        inputs={"surge": 5.5, "claims": 35},
        severity="CRITICAL",
        tgr_recovery_amount_rp=12500000.0,
        claim_id="CLM-TEST-001",
        faskes_name="RS Uji Coba"
    )
    assert receipt["receipt_id"].startswith("RCP-JKN-2026-")
    assert len(receipt["canonical_digest_sha256"]) == 64
    assert len(receipt["digital_seal"]) == 64
    assert receipt["manifest"]["human_gate_required"] is True
    assert receipt["manifest"]["human_gate_status"] == "PENDING_REVIEW"
    assert len(receipt["manifest"]["blockers"]) >= 1

def test_mint_decision_receipt_low_severity():
    """Verifies that LOW severity receipt does not require human gate sign-off."""
    receipt = mint_decision_receipt(
        agent_id="test-agent",
        operation="APPROVE_VEDIKA",
        target="CLM-TEST-LOW",
        policy="Perpres No. 82/2018",
        decision_label="VEDIKA_CLEAR",
        inputs={"verified": True},
        severity="LOW"
    )
    assert receipt["manifest"]["human_gate_required"] is False
    assert receipt["manifest"]["human_gate_status"] == "AUTONOMOUS_APPROVED"
    assert len(receipt["manifest"]["blockers"]) == 0

def test_mint_decision_receipt_missing_required():
    """Verifies that missing required fields raise ValueError."""
    with pytest.raises(ValueError):
        mint_decision_receipt(
            agent_id="",
            operation="FLAG_FRAUD",
            target="CLM-TEST",
            policy="Perpres",
            decision_label="TEST",
            inputs={}
        )

def test_offline_receipt_verification_tamper_free():
    """Verifies that unedited receipt passes canonical digest and seal check."""
    receipt = mint_decision_receipt(
        agent_id="test-agent",
        operation="APPROVE_VEDIKA",
        target="CLM-TEST-VERIFY",
        policy="Perpres No. 82/2018",
        decision_label="VEDIKA_CLEAR",
        inputs={"compliant": True},
        severity="LOW"
    )
    res = verify_decision_receipt(receipt)
    assert res["tamper_free"] is True
    assert res["digest_matches"] is True
    assert res["seal_matches"] is True
    assert res["is_executable"] is True

def test_offline_receipt_tamper_detection():
    """Verifies that modifying manifest data breaks the cryptographic verification."""
    receipt = mint_decision_receipt(
        agent_id="test-agent",
        operation="FLAG_FRAUD",
        target="CLM-ORIGINAL",
        policy="Perpres No. 82/2018",
        decision_label="FRAUD_LABEL",
        inputs={"score": 90},
        severity="HIGH"
    )
    # Tamper with the target field
    receipt["manifest"]["target"] = "CLM-TAMPERED-TARGET"
    res = verify_decision_receipt(receipt)
    assert res["tamper_free"] is False
    assert res["digest_matches"] is False
    assert res["is_executable"] is False

def test_human_gate_review_approval():
    """Verifies that BPJS verifikator approval with valid NIP clears the human gate."""
    receipt = mint_decision_receipt(
        agent_id="test-agent",
        operation="FLAG_FRAUD",
        target="CLM-GATE-01",
        policy="Permenkes No. 26/2021",
        decision_label="FRAUD",
        inputs={"x": 1},
        severity="CRITICAL"
    )
    updated = apply_human_gate_review(
        receipt=receipt,
        verifikator_nip="198504122010121001",
        verifikator_name="Dr. Budi Santoso",
        approved=True
    )
    assert updated["manifest"]["human_gate_status"] == "HUMAN_VERIFIED"
    assert updated["manifest"]["human_reviewer_nip"] == "198504122010121001"
    assert len(updated["manifest"]["blockers"]) == 0

    ver = verify_decision_receipt(updated)
    assert ver["tamper_free"] is True
    assert ver["human_gate_cleared"] is True
    assert ver["is_executable"] is True

def test_human_gate_review_blocker():
    """Verifies that review with an unresolved blocker keeps gate blocked."""
    receipt = mint_decision_receipt(
        agent_id="test-agent",
        operation="FLAG_FRAUD",
        target="CLM-GATE-02",
        policy="Permenkes No. 26/2021",
        decision_label="FRAUD",
        inputs={"x": 2},
        severity="HIGH"
    )
    updated = apply_human_gate_review(
        receipt=receipt,
        verifikator_nip="198504122010121001",
        verifikator_name="Dr. Budi Santoso",
        approved=True,
        blocker_notes="Bukti sidik jari pasien masih dalam konfirmasi rumah sakit."
    )
    assert updated["manifest"]["human_gate_status"] == "GATE_BLOCKED"
    assert len(updated["manifest"]["blockers"]) == 1

    ver = verify_decision_receipt(updated)
    assert ver["tamper_free"] is True
    assert ver["human_gate_cleared"] is False
    assert ver["is_executable"] is False

def test_human_gate_refuses_invalid_nip():
    """Verifies that human gate refuses sign-off without a valid NIP."""
    receipt = mint_decision_receipt(
        agent_id="test-agent",
        operation="FLAG_FRAUD",
        target="CLM-GATE-03",
        policy="Permenkes No. 26/2021",
        decision_label="FRAUD",
        inputs={"x": 3},
        severity="CRITICAL"
    )
    with pytest.raises(ValueError):
        apply_human_gate_review(
            receipt=receipt,
            verifikator_nip="",
            verifikator_name="Anon",
            approved=True
        )

def test_batch_receipts_manifest_integrity():
    """Verifies batch manifest generation with master SHA-256 seal."""
    manifest = compute_batch_receipts_manifest()
    assert manifest["total_receipts"] >= 4
    assert len(manifest["master_manifest_seal_sha256"]) == 64
    assert manifest["pending_human_gate_count"] >= 1

def test_api_receipts_endpoints():
    """Integration test for all 6 REST API endpoints."""
    # 1. GET /receipts
    r_list = client.get("/api/v1/receipts")
    assert r_list.status_code == 200
    receipts = r_list.json()
    assert len(receipts) >= 4

    # 2. GET /receipts/{id}
    sample_id = receipts[0]["receipt_id"]
    r_get = client.get(f"/api/v1/receipts/{sample_id}")
    assert r_get.status_code == 200
    assert r_get.json()["receipt_id"] == sample_id

    # 3. POST /receipts/mint
    r_mint = client.post("/api/v1/receipts/mint", json={
        "agent_id": "api-test-agent",
        "operation": "FLAG_FRAUD",
        "target": "CLM-API-001 - RS Uji API",
        "policy": "Perpres No. 82/2018 Pasal 76",
        "decision_label": "SURGICAL_UNBUNDLING",
        "inputs": {"unbundled_codes": ["47.01", "47.09"]},
        "severity": "HIGH",
        "tgr_recovery_amount_rp": 7800000.0,
        "claim_id": "CLM-API-001",
        "faskes_name": "RS Uji API"
    })
    assert r_mint.status_code == 200
    minted = r_mint.json()
    new_id = minted["receipt_id"]

    # 4. POST /receipts/{id}/verify (should be PENDING_REVIEW)
    r_ver1 = client.post(f"/api/v1/receipts/{new_id}/verify")
    assert r_ver1.status_code == 200
    assert r_ver1.json()["tamper_free"] is True
    assert r_ver1.json()["is_executable"] is False

    # 5. POST /receipts/{id}/human-gate
    r_gate = client.post(f"/api/v1/receipts/{new_id}/human-gate", json={
        "verifikator_nip": "199003152015041002",
        "verifikator_name": "Ahmad Fauzi, S.Kom, M.Kes",
        "approved": True
    })
    assert r_gate.status_code == 200
    assert r_gate.json()["manifest"]["human_gate_status"] == "HUMAN_VERIFIED"

    # 6. Verify again after human gate sign-off
    r_ver2 = client.post(f"/api/v1/receipts/{new_id}/verify")
    assert r_ver2.status_code == 200
    assert r_ver2.json()["tamper_free"] is True
    assert r_ver2.json()["is_executable"] is True

    # 7. GET /receipts/manifest/verify
    r_man = client.get("/api/v1/receipts/manifest/verify")
    assert r_man.status_code == 200
    assert len(r_man.json()["master_manifest_seal_sha256"]) == 64
