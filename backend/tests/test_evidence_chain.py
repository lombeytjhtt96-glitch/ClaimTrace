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
    build_claim_audit_ledger,
    ClaimAuditLedger,
    build_cds_evaluation_dossier,
    CdsEvaluationDossier,
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


def test_build_claim_audit_ledger_structure():
    claim_id = next(iter(SYNTHETIC_CLAIMS_DATABASE.keys()))
    claim = SYNTHETIC_CLAIMS_DATABASE[claim_id]

    ledger = build_claim_audit_ledger(claim)
    assert isinstance(ledger, ClaimAuditLedger)
    assert ledger.claim_id == claim.claim_id
    assert ledger.ledger_id == f"LEDGER-{claim.claim_id}"
    assert ledger.aas_spec_version == "20.6.0"
    assert len(ledger.predicates) == 4
    for p in ledger.predicates:
        assert p.claim_id == claim.claim_id
        assert len(p.predicate) > 10
        assert len(p.required_witness) > 5
        assert p.verdict in ("PROVEN", "PARTIALLY_PROVEN", "CONTRADICTED", "NOT_PROVEN")
        assert len(p.coverage) > 0

    assert ledger.anti_deception.pressure_detected is False
    assert ledger.anti_deception.authority_appeal_rejected is True
    assert ledger.anti_deception.omission_bias_gate_passed is True
    assert ledger.anti_deception.depth_enforcement_status == "PASSED"
    assert ledger.anti_deception.integrity_procedure_verdict == "HONEST_AUDIT_VERIFIED"

    assert ledger.provenance_stamp.agent_id == "ClaimTrace-DSS-PredicateAuditor"
    assert ledger.provenance_stamp.spec_version == "20.6.0"
    assert ledger.provenance_stamp.trust_score >= 0.90
    assert len(ledger.provenance_stamp.compliance_frameworks) >= 3

    assert len(ledger.ledger_hash) == 64


def test_claim_audit_ledger_api_endpoint_200():
    claim_id = next(iter(SYNTHETIC_CLAIMS_DATABASE.keys()))
    response = client.get(f"/api/v1/claims/{claim_id}/audit-predicates")
    assert response.status_code == 200
    data = response.json()
    assert data["claim_id"] == claim_id
    assert data["ledger_id"] == f"LEDGER-{claim_id}"
    assert data["aas_spec_version"] == "20.6.0"
    assert len(data["predicates"]) == 4
    assert data["anti_deception"]["integrity_procedure_verdict"] == "HONEST_AUDIT_VERIFIED"
    assert "ledger_hash" in data
    assert len(data["ledger_hash"]) == 64


def test_claim_audit_ledger_api_endpoint_404():
    response = client.get("/api/v1/claims/NONEXISTENT-AAS-CLAIM/audit-predicates")
    assert response.status_code == 404
    assert "tidak ditemukan" in response.json()["detail"]


def test_claim_audit_ledger_predicates_witness_integrity():
    for cid, claim in list(SYNTHETIC_CLAIMS_DATABASE.items())[:10]:
        ledger = build_claim_audit_ledger(claim)
        assert ledger.proven_count + ledger.contradicted_count + ledger.gap_count == 4
        for p in ledger.predicates:
            assert len(p.required_witness) > 0
            assert len(p.coverage) > 0


def test_build_cds_evaluation_dossier_structure():
    claim_id = next(iter(SYNTHETIC_CLAIMS_DATABASE.keys()))
    claim = SYNTHETIC_CLAIMS_DATABASE[claim_id]

    dossier = build_cds_evaluation_dossier(claim)
    assert isinstance(dossier, CdsEvaluationDossier)
    assert dossier.claim_id == claim.claim_id
    assert dossier.dossier_id == f"CDS-DOSSIER-{claim.claim_id}"
    assert dossier.cds_spec_version == "2.4"
    assert dossier.reports_spec_version == "2.3"
    assert "RESEARCH, AUDIT, AND DECISION-SUPPORT ARTIFACTS ONLY" in dossier.hard_safety_boundary
    assert "DRAFT" in dossier.draft_watermark
    assert len(dossier.grade_evidence_profile) >= 3
    assert len(dossier.decision_logic_traceability) >= 3
    assert len(dossier.iso_risk_controls) >= 3
    for node in dossier.decision_logic_traceability:
        assert node.human_in_the_loop_mandatory is True
        assert len(node.clinical_standard) > 0
    assert len(dossier.dossier_hash) == 64


def test_cds_evaluation_api_endpoint_200():
    claim_id = next(iter(SYNTHETIC_CLAIMS_DATABASE.keys()))
    response = client.get(f"/api/v1/claims/{claim_id}/cds-evaluation")
    assert response.status_code == 200
    data = response.json()
    assert data["claim_id"] == claim_id
    assert data["dossier_id"] == f"CDS-DOSSIER-{claim_id}"
    assert data["cds_spec_version"] == "2.4"
    assert "hard_safety_boundary" in data
    assert "grade_evidence_profile" in data
    assert "decision_logic_traceability" in data
    assert "iso_risk_controls" in data
    assert "dossier_hash" in data
    assert len(data["dossier_hash"]) == 64


def test_cds_evaluation_api_endpoint_404():
    response = client.get("/api/v1/claims/NONEXISTENT-CDS-CLAIM/cds-evaluation")
    assert response.status_code == 404
    assert "tidak ditemukan" in response.json()["detail"]


def test_cds_evaluation_iso_risk_traceability():
    for cid, claim in list(SYNTHETIC_CLAIMS_DATABASE.items())[:10]:
        dossier = build_cds_evaluation_dossier(claim)
        assert len(dossier.iso_risk_controls) == 3
        for ctrl in dossier.iso_risk_controls:
            assert "ISO" in ctrl.standard_clause
            assert ctrl.post_mitigation_risk in ("LOW", "ACCEPTABLE", "NEGLIGIBLE")



