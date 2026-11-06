"""
End-to-End Stack Verification Script for ClaimTrace JKN.
Applies testing methodologies from awesome-codex-skills/webapp-testing.
"""

import sys
import urllib.request
import json

def run_checks():
    checks_passed = 0
    total_checks = 8

    print("==================================================")
    print("CLAIMTRACE JKN - END-TO-END VERIFICATION RUNNER")
    print("==================================================")

    # 1. Backend Health Check
    try:
        with urllib.request.urlopen("http://localhost:8000/api/v1/health", timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data["status"] == "healthy"
            assert data["audit_integrity_valid"] is True
            print("[PASS] 1. Backend Health and Audit Chain Integrity")
            checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 1. Backend Health: {e}")

    # 2. Dossier Manifest Summary
    try:
        with urllib.request.urlopen("http://localhost:8000/api/v1/dossier/summary", timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data["spec_version"] == "1.0.0-codex"
            assert data["total_berkas_diorganisir"] >= 6
            assert data["total_tuntutan_ganti_rugi_rp"] > 0
            print(f"[PASS] 2. Dossier Manifest ({data['total_berkas_diorganisir']} files, Rp {data['total_tuntutan_ganti_rugi_rp']:,.0f} TGR)")
            checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 2. Dossier Manifest: {e}")

    # 3. Dossier Filtered Claims (Jalur MERAH)
    try:
        with urllib.request.urlopen("http://localhost:8000/api/v1/dossier/claims?lane=MERAH", timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert len(data) >= 1
            assert all(c["dispute_lane"] == "MERAH" for c in data)
            print(f"[PASS] 3. Filtered Dossier Claims (Jalur MERAH: {len(data)} high-priority claims)")
            checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 3. Filtered Claims: {e}")

    # 4. Dossier CSV Export
    try:
        with urllib.request.urlopen("http://localhost:8000/api/v1/dossier/export/csv", timeout=5) as res:
            assert res.status == 200
            content = res.read().decode("utf-8")
            assert "DOSSIER REKONSILIASI KLAIM" in content
            assert "=SUM(" in content
            assert "PERMENKES NO. 26 TAHUN 2021" in content
            print("[PASS] 4. Dossier CSV Export with Active Spreadsheet Formulas")
            checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 4. Dossier CSV Export: {e}")

    # 5. Faskes Dossier Summary
    try:
        with urllib.request.urlopen("http://localhost:8000/api/v1/dossier/faskes/FSK-RSX-01", timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data["faskes_id"] == "FSK-RSX-01"
            assert data["total_denda_50persen_rp"] > 0
            print(f"[PASS] 5. Faskes Summary FSK-RSX-01 (Denda 50%: Rp {data['total_denda_50persen_rp']:,.0f})")
            checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 5. Faskes Summary: {e}")

    # 6. Temporal 30-Day Radar
    try:
        with urllib.request.urlopen("http://localhost:8000/api/v1/radar/last30days", timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data["spec_version"] == "3.31.0"
            assert data["total_signals_tracked"] == 7
            print(f"[PASS] 6. Temporal 30-Day Radar ({data['total_signals_tracked']} active circular signals)")
            checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 6. Temporal 30-Day Radar: {e}")

    # 7. Frontend Local Dev Server
    try:
        with urllib.request.urlopen("http://localhost:3000", timeout=5) as res:
            assert res.status == 200
            content = res.read().decode("utf-8")
            assert "ClaimTrace" in content or "root" in content
            print("[PASS] 7. Frontend Local Web Server (Port 3000)")
            checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 7. Frontend Local Server: {e}")

    # 8. Frontend Vite Proxy to Backend
    try:
        with urllib.request.urlopen("http://localhost:3000/api/v1/dossier/summary", timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data["spec_version"] == "1.0.0-codex"
            print("[PASS] 8. Frontend Vite Reverse Proxy (/api -> :8000)")
            checks_passed += 1
    except Exception as e:
        print(f"[FAIL] 8. Frontend Vite Reverse Proxy: {e}")

    print("==================================================")
    print(f"VERIFICATION RESULT: {checks_passed}/{total_checks} CHECKS PASSED")
    print("==================================================")

    if checks_passed == total_checks:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    run_checks()
