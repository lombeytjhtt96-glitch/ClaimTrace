"""
Tests for ClaimTrace Enterprise Access Control & Privilege Gatekeeper
Verifies RBAC & ABAC Enforcement Standards:
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
    Prinsip Keamanan Akses: Read-role vs Manage-role separation.
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
    assert "Prinsip Keamanan Akses" in detail["message"]


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


def test_enterprise_rbac_settings_adjudication_pillar_and_middleware(monkeypatch):
    """Verify server-side RBAC enforcement across settings, adjudication, operations, and pillar router."""
    verifier_token = create_access_token({
        "nip": "198704202011012001",
        "name": "dr. Siti Rahma, Sp.PK",
        "role": "VERIFICATOR_MEDIS",
        "unit": "Kantor Pusat BPJS Kesehatan",
    })
    auditor_token = create_access_token({
        "nip": "199003152018011005",
        "name": "dr. Andi Pratama, MARS",
        "role": "AUDITOR_VIEWER",
        "unit": "Kantor Regional",
    })
    admin_token = create_access_token({
        "nip": "198501012010011001",
        "name": "Hendra Wijaya, S.Si, M.M",
        "role": "ADMIN",
        "unit": "Kantor Pusat BPJS Kesehatan",
    })

    # Verifikator cannot update system settings or compile detection rules (ADMIN only)
    res_set_denied = client.put(
        "/api/v1/settings",
        headers={"Authorization": f"Bearer {verifier_token}"},
        json={"category": "thresholds_rules", "updates": {"sla_deadline_days": 11}},
    )
    assert res_set_denied.status_code == 403

    res_rule_denied = client.post(
        "/api/v1/detection/rules/compile",
        headers={"Authorization": f"Bearer {auditor_token}"},
        json={
            "rule_name": "test_rbac_block",
            "description": "Auditor cannot compile rules",
            "severity": "High",
            "cbg_codes": ["Z-3-12-0"],
            "threshold_count": 5,
            "time_window_hours": 24,
        },
    )
    assert res_rule_denied.status_code == 403

    # Auditor (Read-Only) cannot invoke Tier-1 review, operations mutations, or appeals submission
    res_t1_denied = client.post(
        "/api/v1/adjudication/tier-1-review",
        headers={"Authorization": f"Bearer {auditor_token}"},
        json={
            "claim_id": "CLM-2026-8801",
            "verifikator_name": "dr. Andi Pratama, MARS",
            "verifikator_nip": "199003152018011005",
            "verdict": "PENDING_KLARIFIKASI",
            "clinical_notes": "Uji penolakan RBAC",
            "documents_verified": [],
        },
    )
    assert res_t1_denied.status_code == 403

    res_ops_denied = client.post(
        "/api/v1/operations/cases",
        headers={"Authorization": f"Bearer {auditor_token}"},
        json={"hospital": "RS Uji", "severity": "high"},
    )
    assert res_ops_denied.status_code == 403

    res_appeal_denied = client.post(
        "/api/v1/appeals/submit",
        headers={"Authorization": f"Bearer {auditor_token}"},
        json={
            "claim_id": "CLM-2026-8801",
            "faskes_name": "RS Uji",
            "disputed_amount_rp": 1000000,
            "clinical_argument": "Argumentasi uji RBAC minimal sepuluh karakter.",
        },
    )
    assert res_appeal_denied.status_code == 403

    # Strict middleware mode also enforces route-level RBAC end-to-end
    monkeypatch.setenv("CLAIMTRACE_STRICT_API_AUTH", "1")
    strict_denied = client.put(
        "/api/v1/settings",
        headers={"Authorization": f"Bearer {verifier_token}"},
        json={"category": "thresholds_rules", "updates": {"sla_deadline_days": 11}},
    )
    assert strict_denied.status_code == 403
    assert strict_denied.json()["error_code"] == "INSUFFICIENT_PRIVILEGE"

    strict_admin_invalid = client.put(
        "/api/v1/settings",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"category": "tri_layer_engine", "updates": {"yellow_lane_threshold": 90, "red_lane_threshold": 60}},
    )
    assert strict_admin_invalid.status_code == 422


def test_pillar_resolve_actor_and_dossier_csv_formula_escaping():
    """Verify _resolve_actor unpacks token tuple safely and dossier CSV neutralizes formulas."""
    from starlette.requests import Request
    from app.routers.pillar_upgrade_router import _resolve_actor
    from app.engine.claim_dossier_engine import ClaimDossierManifest, DossierClaimItem, generate_dossier_csv_report

    token = create_access_token({"nip": "198704202011012001", "role": "VERIFICATOR_MEDIS"})
    req = Request({"type": "http", "headers": [(b"authorization", f"Bearer {token}".encode())] })
    assert _resolve_actor(req) == "198704202011012001"

    manifest = ClaimDossierManifest(
        manifest_id="MAN-001",
        created_at="2026-11-16T00:00:00Z",
        total_faskes_diaudit=1,
        total_berkas_diorganisir=1,
        total_nilai_klaim_rp=1000000,
        total_potensi_pemulihan_rp=500000,
        total_denda_administratif_rp=250000,
        total_tuntutan_ganti_rugi_rp=750000,
        faskes_summaries=[],
        claims=[
            DossierClaimItem(
                standardized_filename="=HYPERLINK(\"http://evil\",\"bad\")",
                claim_id="CLM-1",
                faskes_id="FSK-1",
                nama_faskes="@RS_INJECTION",
                kelas_rs="B",
                tanggal_layanan="2026-11-01",
                sep_number="+12345",
                ina_cbg_code="Z-3-12-0",
                icd10_primary="M54.5",
                icd9cm_procedure="93.39",
                fraud_typology="PHANTOM",
                dispute_lane="MERAH",
                nilai_klaim_rp=1000000,
                biaya_riil_terverifikasi_rp=500000,
                selisih_kelebihan_bayar_rp=500000,
                denda_administratif_rp=250000,
                total_tuntutan_ganti_rugi_rp=750000,
                sha256_checksum="abc123",
            )
        ],
        batch_integrity_sha256="abcdef0123456789",
    )
    csv_text = generate_dossier_csv_report(manifest)
    assert "'=HYPERLINK" in csv_text
    assert "'@RS_INJECTION" in csv_text
    assert "'+12345" in csv_text
    assert "=SUM(N9:N9)" in csv_text


def test_demo_accounts_flag_disables_seeds_outside_pytest(monkeypatch):
    """Verify CLAIMTRACE_ALLOW_DEMO_ACCOUNTS=0 disables demo seeds in non-pytest field deployment."""
    from app import main as app_main

    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    monkeypatch.setenv("CLAIMTRACE_ALLOW_DEMO_ACCOUNTS", "0")
    assert app_main._demo_accounts_enabled() is False
    monkeypatch.setenv("CLAIMTRACE_ALLOW_DEMO_ACCOUNTS", "1")
    assert app_main._demo_accounts_enabled() is True


def test_duckdb_describe_table_rejects_injection_and_unknown_tables(monkeypatch):
    """Verify /api/v1/duckdb/describe/{table_name} validates table identifier allowlist."""
    monkeypatch.setenv("CLAIMTRACE_STRICT_API_AUTH", "0")
    client = TestClient(app)

    res_valid = client.get("/api/v1/duckdb/describe/claims_warehouse")
    assert res_valid.status_code == 200
    assert res_valid.json()["table_name"] == "claims_warehouse"

    res_inject = client.get("/api/v1/duckdb/describe/claims_warehouse;DROP TABLE claims_warehouse")
    assert res_inject.status_code == 400

    res_unknown = client.get("/api/v1/duckdb/describe/nonexistent_table_xyz")
    assert res_unknown.status_code == 400
