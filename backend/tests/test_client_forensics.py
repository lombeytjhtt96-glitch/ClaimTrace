"""
Unit and Integration Tests for Client Forensics Engine in ClaimTrace
BPJS Kesehatan Healthkathon 2026 - Client Tampering & Static Code Forensics
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engine.client_forensics import forensics_engine

client = TestClient(app)


def test_forensic_samples_catalog():
    """Verifies that the catalog of curated audit samples is properly loaded."""
    samples = forensics_engine.list_samples()
    assert len(samples) >= 3
    target_ids = [s["target_id"] for s in samples]
    assert "FS-SIMRS-INJECTOR" in target_ids
    assert "FS-APK-JKN-BOT" in target_ids
    assert "FS-VCLAIM-BRIDGE-HOOK" in target_ids


def test_forensic_sample_inspection():
    """Tests detailed inspection of individual forensic samples."""
    injector = forensics_engine.get_sample("FS-SIMRS-INJECTOR")
    assert injector is not None
    assert "batchInjectClaims" in injector["source_code"]
    assert len(injector["detected_anomalies"]) >= 4
    assert injector["risk_verdict"] == "CRITICAL_FRAUD_INJECTOR"

    apk = forensics_engine.get_sample("FS-APK-JKN-BOT")
    assert apk is not None
    assert "GPS Spoofing" in str(apk["detected_anomalies"])
    assert apk["risk_verdict"] == "CRITICAL_SPOOFING_CLIENT"

    hook = forensics_engine.get_sample("FS-VCLAIM-BRIDGE-HOOK")
    assert hook is not None
    assert "K-1-10-III" in hook["decompiled_summary"]
    assert hook["risk_verdict"] == "CRITICAL_UPCODING_INTERCEPTOR"


def test_forensic_script_analysis():
    """Tests static analysis of custom hospital bridging scripts."""
    clean_code = """
    function logPatientArrival(patientId) {
      console.log('Pasien tiba di resepsionis:', patientId);
      return { status: 'OK' };
    }
    """
    clean_res = forensics_engine.analyze_script_content(clean_code)
    assert clean_res["status"] == "success"
    assert clean_res["risk_score"] == 0
    assert clean_res["verdict"] == "BERSIH"
    assert len(clean_res["detected_anomalies"]) == 0

    malicious_code = """
    for (let i = 0; i < patientTokens.length; i++) {
      axios.post('http://internal-simrs/bridge/vclaim/submit', {
        skip_mobile_jkn_push: true,
        bypass_biometric_validation: true
      });
    }
    """
    mal_res = forensics_engine.analyze_script_content(malicious_code)
    assert mal_res["status"] == "success"
    assert mal_res["risk_score"] >= 70
    assert mal_res["verdict"] == "MALICIOUS_INJECTOR_CRITICAL"
    assert len(mal_res["detected_anomalies"]) >= 3


def test_forensic_tools_catalog():
    """Verifies that the forensic tools catalog is properly formatted."""
    tools = forensics_engine.get_forensic_tools_catalog()
    assert len(tools) >= 5
    tool_names = [t["tool"] for t in tools]
    assert "analyze-javascript-application" in tool_names
    assert "inspect_native_binary" in tool_names
    assert "decode-android-resources" in tool_names


def test_fastapi_forensics_endpoints():
    """Integration test: verifies all client forensics FastAPI HTTP endpoints."""
    r_status = client.get("/api/v1/forensics/status")
    assert r_status.status_code == 200
    assert r_status.json()["status"] == "ready"
    assert r_status.json()["module"] == "claimtrace-forensics@1.0.0"

    r_samples = client.get("/api/v1/forensics/samples")
    assert r_samples.status_code == 200
    assert len(r_samples.json()["samples"]) >= 3

    r_inspect = client.get("/api/v1/forensics/inspect/FS-SIMRS-INJECTOR")
    assert r_inspect.status_code == 200
    assert r_inspect.json()["evidence"]["target_id"] == "FS-SIMRS-INJECTOR"

    r_404 = client.get("/api/v1/forensics/inspect/NON_EXISTENT")
    assert r_404.status_code == 404

    r_analyze = client.post(
        "/api/v1/forensics/analyze-code",
        json={"code": "for (let p of patientTokens) { axios.post('/bridge', { skip_mobile_jkn: true }); }"},
    )
    assert r_analyze.status_code == 200
    assert r_analyze.json()["risk_score"] > 50

    r_tools = client.get("/api/v1/forensics/tools")
    assert r_tools.status_code == 200
    assert len(r_tools.json()["tools"]) >= 5
