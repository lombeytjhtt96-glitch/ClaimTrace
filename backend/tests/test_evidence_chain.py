import hashlib
import pytest
from fastapi.testclient import TestClient
from app.main import app, SYNTHETIC_CLAIMS_DATABASE
from app.engine.evidence_chain import (
    build_claim_evidence_chain,
    compute_sha256,
    EvidenceChainGraph,
    build_academic_evidence_passport,
    AcademicEvidencePassport,
)

client = TestClient(app)


def test_compute_sha256_deterministic():
    sample = "BPJS-Kesehatan-ClaimTrace-2026"
    expected = hashlib.sha256(sample.encode("utf-8")).hexdigest()
    assert compute_sha256(sample) == expected


def test_build_claim_evidence_chain_structure():
    claim_id = next(iter(SYNTHETIC_CLAIMS_DATABASE.keys()))
    claim = SYNTHETIC_CLAIMS_DATABASE[claim_id]

    graph = build_claim_evidence_chain(claim)
    assert isinstance(graph, EvidenceChainGraph)
    assert graph.claim_id == claim.claim_id
    assert graph.nomor_sep == (claim.fkl02_id_kunjungan or f"SEP-{claim.claim_id}")
    assert len(graph.evidences) >= 1
    assert graph.evidences[0].id == "E-001"
    assert len(graph.evidences[0].content_hash) == 64
    assert len(graph.chain_hash) == 64
    assert len(graph.findings) >= 1
    assert len(graph.paths) >= 1
    assert graph.quality_score >= 8.0


def test_evidence_chain_sha256_fixity():
    claim_id = next(iter(SYNTHETIC_CLAIMS_DATABASE.keys()))
    claim = SYNTHETIC_CLAIMS_DATABASE[claim_id]

    graph = build_claim_evidence_chain(claim)
    for ev in graph.evidences:
        expected_hash = hashlib.sha256(ev.raw_excerpt.encode("utf-8")).hexdigest()
        assert ev.content_hash == expected_hash, f"Fixity mismatch for {ev.id}"


def test_evidence_chain_red_claim_clawback():
    red_claim = None
    for c in SYNTHETIC_CLAIMS_DATABASE.values():
        if c.nilai_klaim_rp > 10000000 or getattr(c, "status_klaim", "") == "DISPUTE":
            red_claim = c
            break

    if red_claim:
        graph = build_claim_evidence_chain(red_claim)
        assert len(graph.findings) >= 1
        assert len(graph.paths) >= 1
        assert graph.paths[0].clawback_potential_rp >= 0.0


def test_evidence_chain_api_endpoint_200():
    claim_id = next(iter(SYNTHETIC_CLAIMS_DATABASE.keys()))
    response = client.get(f"/api/v1/claims/{claim_id}/evidence-chain")
    assert response.status_code == 200
    data = response.json()
    assert data["claim_id"] == claim_id
    assert "chain_hash" in data
    assert "evidences" in data
    assert "findings" in data
    assert "paths" in data
    assert data["quality_score"] >= 8.0


def test_evidence_chain_api_endpoint_404():
    response = client.get("/api/v1/claims/INVALID-CLAIM-9999/evidence-chain")
    assert response.status_code == 404
    assert "tidak ditemukan" in response.json()["detail"]


def test_evidence_chain_all_synthetic_claims_pass_quality_gate():
    for cid, claim in list(SYNTHETIC_CLAIMS_DATABASE.items())[:15]:
        graph = build_claim_evidence_chain(claim)
        assert graph.quality_score >= 8.0, f"Quality gate failure for {cid}: {graph.quality_score}"


def test_build_academic_evidence_passport_structure():
    claim_id = next(iter(SYNTHETIC_CLAIMS_DATABASE.keys()))
    claim = SYNTHETIC_CLAIMS_DATABASE[claim_id]

    passport = build_academic_evidence_passport(claim)
    assert isinstance(passport, AcademicEvidencePassport)
    assert passport.claim_id == claim.claim_id
    assert passport.passport_id == f"PASSPORT-{claim.claim_id}"
    assert passport.ars_spec_version == "3.24.2"
    assert passport.integrity_gate_stage == "STAGE_4_5_VERIFIED"
    assert passport.claim_faithfulness_status == "FAITHFUL"
    assert passport.provenance_declaration == "EXPERIMENTS_AND_TELEMETRY_DECLARED"
    assert len(passport.regulatory_anchors) >= 3
    assert len(passport.clinical_anchors) >= 1
    assert passport.statistical_soundness.concession_threshold == 4.0
    assert passport.statistical_soundness.zero_regression_verified is True


def test_academic_evidence_passport_repro_lock():
    claim_id = next(iter(SYNTHETIC_CLAIMS_DATABASE.keys()))
    claim = SYNTHETIC_CLAIMS_DATABASE[claim_id]

    passport = build_academic_evidence_passport(claim)
    assert passport.repro_lock.engine_version == "ClaimTrace-DSS-v2.5-ARS"
    assert passport.repro_lock.temperature == 0.0
    assert passport.repro_lock.seed == 42
    assert passport.repro_lock.hash_algorithm == "SHA-256"
    assert len(passport.repro_lock.pipeline_hash) == 64
    assert passport.repro_lock.pipeline_hash == passport.evidence_chain_hash


def test_academic_evidence_passport_api_endpoint_200():
    claim_id = next(iter(SYNTHETIC_CLAIMS_DATABASE.keys()))
    response = client.get(f"/api/v1/claims/{claim_id}/evidence-passport")
    assert response.status_code == 200
    data = response.json()
    assert data["claim_id"] == claim_id
    assert data["passport_id"] == f"PASSPORT-{claim_id}"
    assert data["ars_spec_version"] == "3.24.2"
    assert data["integrity_gate_stage"] == "STAGE_4_5_VERIFIED"
    assert "repro_lock" in data
    assert "regulatory_anchors" in data
    assert "clinical_anchors" in data
    assert "statistical_soundness" in data
    assert data["statistical_soundness"]["concession_threshold"] == 4.0


def test_academic_evidence_passport_api_endpoint_404():
    response = client.get("/api/v1/claims/NONEXISTENT-CLAIM/evidence-passport")
    assert response.status_code == 404
    assert "tidak ditemukan" in response.json()["detail"]

