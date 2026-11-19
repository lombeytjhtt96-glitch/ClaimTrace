import pytest
from app.security.audit_log import AuditLogger, pseudonymize_nik


def test_audit_logger_initial_state():
    logger = AuditLogger()
    assert len(logger.chain) == 0
    valid, broken_idx = logger.verify_integrity()
    assert valid is True
    assert broken_idx == -1


def test_audit_logger_hash_chaining():
    logger = AuditLogger()
    e1 = logger.record_event(
        event_type="AUTO_TRIAGE_SCORING",
        claim_id="CLM-001",
        actor="CORE_ENGINE",
        payload={"score": 85.0}
    )
    assert e1["index"] == 1
    assert e1["prev_hash"] == "0" * 64
    assert len(e1["current_hash"]) == 64

    e2 = logger.record_event(
        event_type="HUMAN_VERIFIER_DECISION",
        claim_id="CLM-001",
        actor="VRF-01",
        payload={"decision": "AUDIT_LAPANGAN"}
    )
    assert e2["index"] == 2
    assert e2["prev_hash"] == e1["current_hash"]

    valid, broken_idx = logger.verify_integrity()
    assert valid is True
    assert broken_idx == -1


def test_audit_logger_tamper_detection():
    logger = AuditLogger()
    logger.record_event("EVT_1", "CLM-001", "ACTOR_1", {"data": 100})
    logger.record_event("EVT_2", "CLM-001", "ACTOR_2", {"data": 200})
    logger.record_event("EVT_3", "CLM-002", "ACTOR_3", {"data": 300})

    # Tamper with the second block's payload
    logger.chain[1]["payload"]["data"] = 999999

    valid, broken_idx = logger.verify_integrity()
    assert valid is False
    assert broken_idx == 1


def test_pseudonymize_nik_compliance():
    """Verify that patient NIK is masked with AES-256 token format for UU PDP No. 27/2022."""
    raw_nik = "3372010101900001"
    token = pseudonymize_nik(raw_nik)
    assert token.startswith("AES256_")
    assert raw_nik not in token
    assert len(token) > 10
