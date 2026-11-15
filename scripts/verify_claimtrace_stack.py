"""
ClaimTrace JKN Internal Stack Verification Script
Verifies core detection, threat defense, telemetry, forensics, narrative,
temporal radar, decision receipt, and dossier subsystems via FastAPI TestClient.
"""

from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402
from app.security.token_manager import create_access_token  # noqa: E402


def verify_claimtrace_stack() -> None:
    client = TestClient(app)
    token = create_access_token(
        {
            "nip": "198501012010011001",
            "name": "Hendra Wijaya, S.Si, M.M",
            "role": "ADMIN",
            "unit": "Kantor Pusat BPJS Kesehatan · Tata Kelola Verifikasi Nasional",
        }
    )
    headers = {"Authorization": f"Bearer {token}"}

    checks = [
        ("GET", "/api/v1/health", 200),
        ("GET", "/api/v1/telemetry/runtime", 200),
        ("GET", "/api/v1/telemetry/rules", 200),
        ("GET", "/api/v1/forensics/samples", 200),
        ("GET", "/api/v1/forensics/tools", 200),
        ("GET", "/api/v1/forensics/status", 200),
        ("GET", "/api/v1/radar/temporal", 200),
        ("GET", "/api/v1/detection/rules", 200),
        ("GET", "/api/v1/detection/cases", 200),
        ("GET", "/api/v1/threat-defense/frameworks/summary", 200),
        ("GET", "/api/v1/threat-defense/fraud-catalog?limit=10", 200),
        ("GET", "/api/v1/receipts", 200),
        ("GET", "/api/v1/dossier/summary", 200),
        ("GET", "/api/v1/security/audit-ledger", 200),
        ("GET", "/api/v1/healthkathon/credible-evidence", 200),
    ]

    for method, path, expected_status in checks:
        resp = client.request(method, path, headers=headers)
        assert resp.status_code == expected_status, (
            f"{method} {path} returned {resp.status_code}, expected {expected_status}"
        )
        print(f"[PASS] {method} {path} -> {resp.status_code}")

    refine_res = client.post(
        "/api/v1/claims/refine-narrative",
        headers=headers,
        json={
            "text": "Catatan medis perlu ditinjau ulang secara menyeluruh.",
            "context": "Verifikasi pra-bayar FKRTL",
        },
    )
    assert refine_res.status_code == 200, f"Narrative refine failed: {refine_res.status_code}"
    print("[PASS] POST /api/v1/claims/refine-narrative -> 200")
    print("[OK] ClaimTrace internal stack verification passed.")


if __name__ == "__main__":
    verify_claimtrace_stack()
