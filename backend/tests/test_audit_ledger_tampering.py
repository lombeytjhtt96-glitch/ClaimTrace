import pytest
import copy
from app.security.audit_log import AuditLogger, pseudonymize_nik

def test_tamper_evident_integrity_clean_chain():
    logger = AuditLogger()
    # Reset in-memory chain for testing
    logger.chain = []
    
    e1 = logger.record_event("KLAIM_SUBMITTED", "CLM-TEST-001", "RS_USER", {"amount": 1500000})
    e2 = logger.record_event("AUTO_TRIAGE_SCORING", "CLM-TEST-001", "CLAIMTRACE_ENGINE", {"score": 88.5, "lane": "MERAH"})
    e3 = logger.record_event("VERIFIER_DECISION", "CLM-TEST-001", "VERIF_DR_SITI", {"verdict": "HOLD_BAKB"})
    
    assert len(logger.chain) == 3
    is_valid, broken_idx = logger.verify_integrity()
    assert is_valid is True
    assert broken_idx == -1

def test_tamper_evident_detects_payload_modification():
    logger = AuditLogger()
    logger.chain = []
    
    logger.record_event("KLAIM_SUBMITTED", "CLM-TEST-002", "RS_USER", {"amount": 2000000})
    logger.record_event("AUTO_TRIAGE_SCORING", "CLM-TEST-002", "CLAIMTRACE_ENGINE", {"score": 90.0, "lane": "MERAH"})
    logger.record_event("VERIFIER_DECISION", "CLM-TEST-002", "VERIF_DR_SITI", {"verdict": "HOLD_BAKB"})
    
    # Adversary tries to tamper with the second block's payload (e.g. changing score or lane to bypass audit)
    tampered_chain = copy.deepcopy(logger.chain)
    tampered_chain[1]["payload"]["lane"] = "HIJAU"  # Tampered!
    
    logger.chain = tampered_chain
    is_valid, broken_idx = logger.verify_integrity()
    assert is_valid is False
    assert broken_idx == 1  # Correctly identifies block #1 as broken!

def test_tamper_evident_detects_hash_manipulation():
    logger = AuditLogger()
    logger.chain = []
    
    logger.record_event("EVENT_A", "CLM-TEST-003", "SYSTEM", {"k": 1})
    logger.record_event("EVENT_B", "CLM-TEST-003", "SYSTEM", {"k": 2})
    
    # Tamper with prev_hash of block 1
    logger.chain[1]["prev_hash"] = "0" * 64
    is_valid, broken_idx = logger.verify_integrity()
    assert is_valid is False
    assert broken_idx == 1

def test_zero_phi_pseudonymization_compliance():
    raw_nik_1 = "3171012345670001"
    raw_nik_2 = "3171012345670002"
    
    token_1a = pseudonymize_nik(raw_nik_1)
    token_1b = pseudonymize_nik(raw_nik_1)
    token_2 = pseudonymize_nik(raw_nik_2)
    
    # Deterministic tokenization
    assert token_1a == token_1b
    # Distinct tokens for distinct NIKs
    assert token_1a != token_2
    # Standard format AES256_
    assert token_1a.startswith("AES256_")
    assert len(token_1a) == 23  # AES256_ (7 chars) + 16 hex chars
    # Never leaks the raw digits
    assert raw_nik_1 not in token_1a
