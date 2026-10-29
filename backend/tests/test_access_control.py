"""
Tests for ClaimTrace Enterprise Access Control & Privilege Gatekeeper
Inspired by Internet2 Grouper Security Review Standards:
- Server-side privilege enforcement (Hiding UI is not security).
- Strict separation of READ vs ADJUDICATE (no role conflation).
- Fail-closed error handling on invalid/tampered tokens.
- Zero side-effects on HTTP GET operations.
- Attribute-Based Access Control (ABAC) branch scoping.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app, audit_logger
from app.security.access_control import (
    Privilege,
    Subject,
    ROLE_PRIVILEGES_MAP,
    PRIVILEGE_HIERARCHY,
    InsufficientPrivilegeException,
    resolve_subject,
    verify_privilege
)
from app.security.token_manager import create_access_token

client = TestClient(app)


def test_privilege_hierarchy_consistency():
    """Verifies that privilege hierarchy strictly encompasses lower privileges."""
    assert Privilege.ADMIN in PRIVILEGE_HIERARCHY[Privilege.ADMIN]
    assert Privilege.ADJUDICATE in PRIVILEGE_HIERARCHY[Privilege.ADMIN]
    assert Privilege.READ in PRIVILEGE_HIERARCHY[Privilege.ADMIN]
    assert Privilege.VIEW in PRIVILEGE_HIERARCHY[Privilege.ADMIN]

    assert Privilege.ADJUDICATE in PRIVILEGE_HIERARCHY[Privilege.ADJUDICATE]
    assert Privilege.READ in PRIVILEGE_HIERARCHY[Privilege.ADJUDICATE]
    assert Privilege.VIEW in PRIVILEGE_HIERARCHY[Privilege.ADJUDICATE]
    assert Privilege.ADMIN not in PRIVILEGE_HIERARCHY[Privilege.ADJUDICATE]

    assert Privilege.READ in PRIVILEGE_HIERARCHY[Privilege.READ]
    assert Privilege.VIEW in PRIVILEGE_HIERARCHY[Privilege.READ]
    assert Privilege.ADJUDICATE not in PRIVILEGE_HIERARCHY[Privilege.READ]


def test_verificator_adjudication_authorized():
    """
    Verifies that an authorized verifier with ADJUDICATE privilege
    successfully records a claim decision.
    """
    token = create_access_token({
        "nip": "198704202011012001",
        "name": "dr. Siti Rahma, Sp.PK",
        "role": "Verifikator Medis Senior",
        "unit": "Kantor Pusat BPJS Kesehatan"
    })

    res = client.post(
        "/api/v1/claims/CLM-2026-8801/decision",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "verifier_id": "198704202011012001",
            "decision": "LOLOSKAN_KLAIM",
            "catatan_verifikator": "Dokumen lengkap dan valid sesuai kaidah INA-CBG."
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["adjudicated_by"]["role"] == "Verifikator Medis Senior"


def test_analyst_cannot_adjudicate_claim_fail_closed():
    """
    GROUPE SECURITY DOCTRINE: Read-role vs Manage-role separation.
    An analyst with only READ privilege must be REJECTED with HTTP 403
    when attempting to adjudicate, preventing privilege conflation.
    """
    # Create valid session token for an Analyst (ReadOnly/Investigator)
    analyst_token = create_access_token({
        "nip": "199208152015031002",
        "name": "Budi Santoso, S.Kom, M.TI",
        "role": "Analis Forensik Digital Anti-Fraud",
        "unit": "Kedeputian Bidang Pengawasan dan Pemeriksaan"
    })

    res = client.post(
        "/api/v1/claims/CLM-2026-8801/decision",
        headers={"Authorization": f"Bearer {analyst_token}"},
        json={
            "verifier_id": "199208152015031002",
            "decision": "AUDIT_LAPANGAN",
            "catatan_verifikator": "Mencoba adjudikasi dengan peran analis."
        }
    )
    assert res.status_code == 403
    detail = res.json()["detail"]
    assert detail["error"] == "INSUFFICIENT_PRIVILEGE"
    assert detail["required_privilege"] == "ADJUDICATE"
    assert "Hiding UI is NOT security" in detail["message"]


def test_tampered_token_rejected_401():
    """Verifies that forged or modified tokens fail closed with 401 Unauthorized."""
    token = create_access_token({
        "nip": "198704202011012001",
        "name": "dr. Siti Rahma, Sp.PK",
        "role": "Verifikator Medis Senior"
    })
    # Tamper with the payload part
    parts = token.split(".")
    tampered_token = f"{parts[0]}.{parts[1]}TAMPERED.{parts[2]}"

    res = client.get(
        "/api/v1/auth/my-privileges",
        headers={"Authorization": f"Bearer {tampered_token}"}
    )
    assert res.status_code == 401


def test_my_privileges_endpoint_introspection():
    """Verifies that /api/v1/auth/my-privileges accurately returns subject privileges and ABAC scope."""
    token = create_access_token({
        "nip": "198704202011012001",
        "name": "dr. Siti Rahma, Sp.PK",
        "role": "Verifikator Medis Senior",
        "unit": "Kantor Pusat BPJS Kesehatan"
    })

    res = client.get(
        "/api/v1/auth/my-privileges",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    sub = res.json()["subject"]
    assert sub["nip"] == "198704202011012001"
    assert sub["can_adjudicate"] is True
    assert "ADJUDICATE" in sub["privileges"]
    assert "READ" in sub["privileges"]
    assert "VIEW" in sub["privileges"]


def test_abac_branch_scoping():
    """Verifies Attribute-Based Access Control on branch and regional unit scoping."""
    local_verificator = Subject(
        nip="198704202011012001",
        name="dr. Siti Rahma",
        role="Verifikator Medis Senior",
        unit="Kantor Cabang Jakarta Selatan",
        privileges={Privilege.ADJUDICATE, Privilege.READ, Privilege.VIEW},
        is_national_scope=False
    )

    national_admin = Subject(
        nip="198001012005011001",
        name="Administrator Pusat",
        role="SUPER_ADMIN",
        unit="Kantor Pusat BPJS Kesehatan",
        privileges={Privilege.ADMIN, Privilege.ADJUDICATE, Privilege.READ, Privilege.VIEW},
        is_national_scope=True
    )

    # Local verifier can only access Jakarta Selatan
    assert local_verificator.can_access_branch("Kantor Cabang Jakarta Selatan") is True
    assert local_verificator.can_access_branch("Jakarta Selatan") is True
    assert local_verificator.can_access_branch("Kantor Cabang Jayapura") is False

    # National admin can access any branch
    assert national_admin.can_access_branch("Kantor Cabang Jayapura") is True
    assert national_admin.can_access_branch("Kantor Cabang Medan") is True


def test_read_operations_have_zero_side_effects():
    """
    GROUPE SECURITY DOCTRINE: GET / read operations must have NO side effects.
    Fetching data must not mutate the audit ledger chain length or alter state.
    """
    token = create_access_token({
        "nip": "199208152015031002",
        "name": "Budi Santoso",
        "role": "ANALYST"
    })
    initial_chain_length = len(audit_logger.chain)

    # Perform multiple read operations across ICD-10, Analytics, and Auth Introspection
    res1 = client.get("/api/v1/terminology/icd10/lookup?code=I10")
    assert res1.status_code == 200

    res2 = client.get("/api/v1/analytics/provider-risk")
    assert res2.status_code == 200

    res3 = client.get("/api/v1/auth/verificators")
    assert res3.status_code == 200

    res4 = client.get("/api/v1/auth/my-privileges", headers={"Authorization": f"Bearer {token}"})
    assert res4.status_code == 200

    # Verify audit chain length has not changed
    assert len(audit_logger.chain) == initial_chain_length
