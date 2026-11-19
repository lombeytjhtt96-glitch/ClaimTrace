"""
Unit and Integration Tests for REA Forensics Engine in ClaimTrace
BPJS Kesehatan Healthkathon 2026 - Reverse Engineering & Client Tampering Forensics
Inspired by morluto/rea v6.7.0
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine.rea_forensics import rea_engine

client = TestClient(app)

def test_rea_samples_catalog():
    """Verifies that the catalog of curated audit samples is properly loaded"""
    samples = rea_engine.list_samples()
    assert len(samples) >= 3
    target_ids = [s["target_id"] for s in samples]
    assert "FS-SIMRS-INJECTOR" in target_ids
    assert "FS-APK-JKN-BOT" in target_ids
    assert "FS-VCLAIM-BRIDGE-HOOK" in target_ids

def test_rea_sample_inspection():
    """Tests detailed inspection of individual forensic samples"""
    # 1. SIMRS Injector Script
    injector = rea_engine.get_sample("FS-SIMRS-INJECTOR")
    assert injector is not None
    assert "batchInjectClaims" in injector["source_code"]
    assert len(injector["detected_anomalies"]) >= 4
    assert injector["risk_verdict"] == "CRITICAL_FRAUD_INJECTOR"

    # 2. Counterfeit Mobile JKN APK
    apk = rea_engine.get_sample("FS-APK-JKN-BOT")
    assert apk is not None
    assert "GPS Spoofing" in str(apk["detected_anomalies"])
    assert apk["risk_verdict"] == "CRITICAL_SPOOFING_CLIENT"

    # 3. vClaim Bridging DLL Hook
    hook = rea_engine.get_sample("FS-VCLAIM-BRIDGE-HOOK")
    assert hook is not None
    assert "K-1-10-III" in hook["decompiled_summary"]
    assert hook["risk_verdict"] == "CRITICAL_UPCODING_INTERCEPTOR"

def test_rea_script_analysis():
    """Tests static analysis of custom hospital bridging scripts"""
    # 1. Clean script
    clean_code = """
    function logPatientArrival(patientId) {
      console.log('Pasien tiba di resepsionis:', patientId);
      return { status: 'OK' };
    }
    """
    clean_res = rea_engine.analyze_script_content(clean_code)
    assert clean_res["status"] == "success"
    assert clean_res["risk_score"] == 0
    assert clean_res["verdict"] == "BERSIH"
    assert len(clean_res["detected_anomalies"]) == 0

    # 2. Malicious injection script
    malicious_code = """
    for (let i = 0; i < patientTokens.length; i++) {
      axios.post('http://internal-simrs/bridge/vclaim/submit', {
        skip_mobile_jkn_push: true,
        bypass_biometric_validation: true
      });
    }
    """
    mal_res = rea_engine.analyze_script_content(malicious_code)
    assert mal_res["status"] == "success"
    assert mal_res["risk_score"] >= 70
    assert mal_res["verdict"] == "MALICIOUS_INJECTOR_CRITICAL"
    assert len(mal_res["detected_anomalies"]) >= 3

def test_rea_tools_catalog():
    """Verifies that the REA tools catalog is properly formatted"""
    tools = rea_engine.get_rea_tools_catalog()
    assert len(tools) >= 5
    tool_names = [t["tool"] for t in tools]
    assert "analyze-javascript-application" in tool_names
    assert "inspect_native_binary" in tool_names
    assert "decode-android-resources" in tool_names

def test_fastapi_rea_endpoints():
    """Integration test: verifies all REA FastAPI HTTP endpoints"""
    # 1. /api/v1/rea/status
    r_status = client.get("/api/v1/rea/status")
    assert r_status.status_code == 200
    assert r_status.json()["status"] == "ready"
    assert r_status.json()["antigravity_aligned"] is True

    # 2. /api/v1/rea/samples
    r_samples = client.get("/api/v1/rea/samples")
    assert r_samples.status_code == 200
    assert len(r_samples.json()["samples"]) >= 3

    # 3. /api/v1/rea/inspect/{target_id}
    r_inspect = client.get("/api/v1/rea/inspect/FS-SIMRS-INJECTOR")
    assert r_inspect.status_code == 200
    assert r_inspect.json()["evidence"]["target_id"] == "FS-SIMRS-INJECTOR"

    # Non-existent target
    r_404 = client.get("/api/v1/rea/inspect/NON_EXISTENT")
    assert r_404.status_code == 404

    # 4. /api/v1/rea/analyze-code
    r_analyze = client.post(
        "/api/v1/rea/analyze-code",
        json={"code": "for (let p of patientTokens) { axios.post('/bridge', { skip_mobile_jkn: true }); }"}
    )
    assert r_analyze.status_code == 200
    assert r_analyze.json()["risk_score"] > 50

    # 5. /api/v1/rea/tools
    r_tools = client.get("/api/v1/rea/tools")
    assert r_tools.status_code == 200
    assert len(r_tools.json()["tools"]) >= 5
