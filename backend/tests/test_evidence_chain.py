import hashlib
import pytest
from fastapi.testclient import TestClient
from app.main import app, SYNTHETIC_CLAIMS_DATABASE
from app.engine.evidence_chain import (
    build_claim_evidence_chain,
    compute_sha256,
    EvidenceChainGraph,
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
