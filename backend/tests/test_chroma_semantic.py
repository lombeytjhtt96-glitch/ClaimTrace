"""
Unit and Integration Tests for ChromaDB Vector Semantic Engine in ClaimTrace
BPJS Kesehatan Healthkathon 2026 - Modus #6 Phantom Billing (Medical Record Cloning)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine.chroma_semantic import chroma_engine

client = TestClient(app)

def test_chroma_collection_stats():
    stats = chroma_engine.get_collection_stats()
    assert stats["collection_name"] == "claimtrace_clinical_resumes"
    assert stats["total_documents"] >= 9
    assert stats["metric"] == "cosine"
    assert "MiniLM" in stats["model"]
    assert stats["status"] == "ONLINE_ACTIVE"

def test_chroma_analyze_claim_phantom_billing_clone():
    # CLM-2026-8801 has identical clone in cluster CLS-PHANTOM-85
    result = chroma_engine.analyze_claim_plagiarism("CLM-2026-8801", threshold=0.90)
    assert result["claim_id"] == "CLM-2026-8801"
    assert result["is_plagiarized"] is True
    assert result["max_similarity_pct"] >= 90.0
    assert result["severity"] == "CRITICAL_PLAGIARISM"
    assert result["signal_code"] == "IND-SEM-COPYPASTE"
    assert len(result["matches"]) > 0

    # Ensure match points to CLM-2026-8801-CLONE-02 or CLONE-03
    top_match = result["matches"][0]
    assert "CLONE" in top_match["matched_claim_id"]
    assert top_match["is_same_faskes"] is True
    assert top_match["is_same_cluster"] is True

def test_chroma_analyze_claim_legitimate_baksos():
    # CLM-2026-8803 has distinct individualized cataract surgical parameters
    result = chroma_engine.analyze_claim_plagiarism("CLM-2026-8803", threshold=0.90)
    assert result["claim_id"] == "CLM-2026-8803"
    assert result["is_plagiarized"] is False
    assert result["max_similarity_pct"] < 90.0
    assert result["signal_code"] is None

def test_chroma_compare_custom_text():
    # Query with identical text to CLM-2026-8801
    query_text = (
        "Pasien mengeluh nyeri punggung bawah (Low Back Pain) menjalar ke paha posterior dextra sejak 2 minggu. "
        "Pemeriksaan fisik: Lasegue (+), Patrick (-), Kontraktur otot paravertebral L4-L5 (+), refleks fisiologis normal. "
        "Tindakan: Fisioterapi komprehensif, Short Wave Diathermy (SWD) dan Lumbar Traction 93.39 serial 5 sesi."
    )
    res = chroma_engine.compare_custom_text(query_text, top_k=3)
    assert res["total_matches"] >= 1
    assert res["highest_similarity_pct"] >= 95.0

    # Query with completely different text
    distinct_text = "Pasien anak usia 5 tahun datang untuk imunisasi campak ulangan tanpa keluhan demam."
    res_distinct = chroma_engine.compare_custom_text(distinct_text, top_k=3)
    assert res_distinct["highest_similarity_pct"] < 65.0

def test_chroma_cluster_matrix():
    # Fraudulent phantom cluster has mass clone
    phantom_matrix = chroma_engine.get_cluster_similarity_matrix("CLS-PHANTOM-85")
    assert phantom_matrix["is_mass_clone_detected"] is True
    assert len(phantom_matrix["claim_ids"]) >= 3

    # Legitimate cluster has no mass clone
    legit_matrix = chroma_engine.get_cluster_similarity_matrix("CLS-LEGAL-KATARAK")
    assert legit_matrix["is_mass_clone_detected"] is False

def test_chroma_api_endpoints():
    # 1. Stats endpoint
    res_stats = client.get("/api/v1/semantic/stats")
    assert res_stats.status_code == 200
    assert res_stats.json()["collection_name"] == "claimtrace_clinical_resumes"

    # 2. Resumes endpoint
    res_list = client.get("/api/v1/semantic/resumes")
    assert res_list.status_code == 200
    assert res_list.json()["total"] >= 9

    # 3. Verify claim endpoint
    res_claim = client.get("/api/v1/semantic/verify-claim/CLM-2026-8801")
    assert res_claim.status_code == 200
    data = res_claim.json()
    assert data["is_plagiarized"] is True
    assert data["signal_code"] == "IND-SEM-COPYPASTE"

    # 4. Verify text endpoint
    res_text = client.post("/api/v1/semantic/verify-text", json={
        "text": "Pasien mengeluh nyeri punggung bawah menjalar ke tungkai, fisioterapi SWD dan traksi lumbal.",
        "top_k": 3
    })
    assert res_text.status_code == 200
    assert "matches" in res_text.json()

    # 5. Cluster matrix endpoint
    res_mat = client.get("/api/v1/semantic/cluster-matrix/CLS-PHANTOM-85")
    assert res_mat.status_code == 200
    assert res_mat.json()["is_mass_clone_detected"] is True
