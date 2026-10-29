"""
Unit and Integration Tests for ClaimTrace Neo4j Graph & FHIR SATUSEHAT Interoperability
Healthkathon BPJS Kesehatan 2026
"""

import pytest
from app.data.synthetic_seed import get_initial_claims
from app.engine.scoring import evaluate_claim_triage
from app.engine.fhir_adapter import claim_to_fhir_bundle
from app.engine.neo4j_graph import (
    generate_cypher_seed_script,
    FRAUD_DETECTION_CYPHER_QUERIES,
    NEO4J_SCHEMA_CYPHER
)
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_neo4j_cypher_generation():
    claims = get_initial_claims()
    cypher = generate_cypher_seed_script(claims)
    assert "CREATE CONSTRAINT" in cypher
    assert "MERGE (f:Faskes" in cypher
    assert "MERGE (d:DPJP" in cypher
    assert "MERGE (c:Claim" in cypher
    assert "CLM-2026-8801" in cypher
    assert "CLM-2026-8806" in cypher
    assert len(FRAUD_DETECTION_CYPHER_QUERIES) == 5

def test_neo4j_endpoints():
    res_queries = client.get("/api/v1/graph/neo4j-queries")
    assert res_queries.status_code == 200
    data = res_queries.json()
    assert data["status"] == "success"
    assert data["total_queries"] == 5
    assert len(data["queries"]) == 5
    assert "schema_constraints" in data

    res_export = client.get("/api/v1/graph/cypher-export")
    assert res_export.status_code == 200
    assert "CREATE CONSTRAINT" in res_export.text
    assert "attachment; filename=claimtrace_neo4j_graph.cypher" in res_export.headers.get("content-disposition", "")

def test_fhir_bundle_adapter():
    claims = get_initial_claims()
    claim_8801 = claims["CLM-2026-8801"]
    triage_8801 = evaluate_claim_triage(claim_8801)
    bundle = claim_to_fhir_bundle(claim_8801, triage_8801)

    assert bundle["resourceType"] == "Bundle"
    assert bundle["type"] == "collection"
    assert bundle["total"] == 9
    
    resource_types = [entry["resource"]["resourceType"] for entry in bundle["entry"]]
    expected_types = [
        "Patient", "Practitioner", "Organization", "Encounter",
        "Condition", "Procedure", "Claim", "RiskAssessment", "Provenance"
    ]
    assert resource_types == expected_types

    # Validate RiskAssessment content
    risk_res = [e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "RiskAssessment"][0]
    assert risk_res["prediction"][0]["outcome"]["coding"][0]["code"] == "MERAH"
    assert risk_res["prediction"][0]["probabilityDecimal"] > 0.8
    assert "FA0002.001" in str(risk_res["note"])

    # Validate Provenance content
    prov_res = [e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "Provenance"][0]
    assert prov_res["signature"][0]["data"] == triage_8801.audit_hash

def test_fhir_endpoints():
    res = client.get("/api/v1/claims/CLM-2026-8801/fhir")
    assert res.status_code == 200
    bundle = res.json()
    assert bundle["resourceType"] == "Bundle"
    assert bundle["total"] == 9

    # Test 404
    res_404 = client.get("/api/v1/claims/CLM-NON-EXISTENT/fhir")
    assert res_404.status_code == 404

    # Test master export
    res_export = client.get("/api/v1/fhir/export-all")
    assert res_export.status_code == 200
    master_bundle = res_export.json()
    assert master_bundle["resourceType"] == "Bundle"
    assert master_bundle["total"] == 6  # 6 synthetic claims

def test_native_fhir_server_endpoints():
    # 1. Test CapabilityStatement /metadata
    res_meta = client.get("/fhir/metadata")
    assert res_meta.status_code == 200
    meta = res_meta.json()
    assert meta["resourceType"] == "CapabilityStatement"
    assert meta["fhirVersion"] == "4.0.1"
    resources = [r["type"] for r in meta["rest"][0]["resource"]]
    assert "Claim" in resources
    assert "Patient" in resources
    assert "RiskAssessment" in resources
    assert "ClaimResponse" in resources
    assert "Composition" in resources

    # 2. Test Searchset /fhir/Claim
    res_claims = client.get("/fhir/Claim")
    assert res_claims.status_code == 200
    claims_bundle = res_claims.json()
    assert claims_bundle["resourceType"] == "Bundle"
    assert claims_bundle["type"] == "searchset"
    assert claims_bundle["total"] >= 6

    # 3. Test Read /fhir/Claim/{id}
    res_read = client.get("/fhir/Claim/claim-clm-2026-8801")
    assert res_read.status_code == 200
    claim_obj = res_read.json()
    assert claim_obj["resourceType"] == "Claim"
    assert "CLM-2026-8801" in str(claim_obj)

    # 4. Test Read /fhir/RiskAssessment/{id}
    res_risk = client.get("/fhir/RiskAssessment/risk-clm-2026-8801")
    assert res_risk.status_code == 200
    risk_obj = res_risk.json()
    assert risk_obj["resourceType"] == "RiskAssessment"
    assert risk_obj["prediction"][0]["outcome"]["coding"][0]["code"] == "MERAH"

    # 5. Test Search & Read /fhir/ClaimResponse (SATUSEHAT Adjudication)
    res_claim_resp = client.get("/fhir/ClaimResponse")
    assert res_claim_resp.status_code == 200
    resp_bundle = res_claim_resp.json()
    assert resp_bundle["resourceType"] == "Bundle"
    assert resp_bundle["total"] >= 6

    res_single_resp = client.get("/fhir/ClaimResponse/claimresp-clm-2026-8801")
    assert res_single_resp.status_code == 200
    resp_obj = res_single_resp.json()
    assert resp_obj["resourceType"] == "ClaimResponse"
    assert resp_obj["outcome"] in ("complete", "partial", "error")
    assert "preAuthRef" in resp_obj
    assert len(resp_obj["adjudication"]) > 0

    # 6. Test Read /fhir/Composition (SATUSEHAT Electronic Medical Record Dossier)
    res_comp = client.get("/fhir/Composition/comp-clm-2026-8801")
    assert res_comp.status_code == 200
    comp_obj = res_comp.json()
    assert comp_obj["resourceType"] == "Composition"
    assert "Catatan Klinis Rekam Medis Elektronik" in str(comp_obj["section"])

    # 7. Test 404 for non-existent FHIR resource
    res_404 = client.get("/fhir/Claim/non-existent-id-99999")
    assert res_404.status_code == 404

    # 8. Test Create /fhir/Claim
    res_create = client.post("/fhir/Claim", json={"use": "claim", "total": {"value": 1000000}})
    assert res_create.status_code == 201

    # 9. Test SATUSEHAT NIK Validation for Patient
    # Invalid NIK (< 16 digits)
    res_invalid_nik = client.post("/fhir/Patient", json={
        "resourceType": "Patient",
        "identifier": [{"system": "https://fhir.kemkes.go.id/id/nik", "value": "12345"}]
    })
    assert res_invalid_nik.status_code == 422
    assert res_invalid_nik.json()["resourceType"] == "OperationOutcome"
    assert "16 digit" in res_invalid_nik.json()["issue"][0]["diagnostics"]

    # Valid NIK (16 digits)
    res_valid_nik = client.post("/fhir/Patient", json={
        "resourceType": "Patient",
        "identifier": [{"system": "https://fhir.kemkes.go.id/id/nik", "value": "3372010101900001"}]
    })
    assert res_valid_nik.status_code == 201

    # 10. Test SATUSEHAT ICD-10 Validation for Condition
    # Invalid ICD-10 (lowercase / invalid format)
    res_invalid_icd = client.post("/fhir/Condition", json={
        "resourceType": "Condition",
        "code": {"coding": [{"system": "http://hl7.org/fhir/sid/icd-10", "code": "invalid_code"}]}
    })
    assert res_invalid_icd.status_code == 422
    assert res_invalid_icd.json()["resourceType"] == "OperationOutcome"

    # Valid ICD-10
    res_valid_icd = client.post("/fhir/Condition", json={
        "resourceType": "Condition",
        "code": {"coding": [{"system": "http://hl7.org/fhir/sid/icd-10", "code": "A41.9"}]}
    })
    assert res_valid_icd.status_code == 201

