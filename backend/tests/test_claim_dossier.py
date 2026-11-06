"""
Unit test suite for Claim Dossier and Invoice Organizer Engine.
Validates awesome-codex-skills integration for ClaimTrace JKN.
"""

from fastapi.testclient import TestClient
from app.main import app, SYNTHETIC_CLAIMS_DATABASE
from app.engine.claim_dossier_engine import (
    organize_claim_dossiers,
    generate_dossier_csv_report,
    ClaimDossierManifest,
)

client = TestClient(app)


def test_organize_claim_dossiers_structure():
    manifest = organize_claim_dossiers(SYNTHETIC_CLAIMS_DATABASE)
    assert isinstance(manifest, ClaimDossierManifest)
    assert manifest.spec_version == "1.0.0-codex"
    assert manifest.manifest_id.startswith("DOSSIER-")
    assert manifest.total_berkas_diorganisir == len(SYNTHETIC_CLAIMS_DATABASE)
    assert manifest.total_faskes_diaudit >= 1
    assert manifest.total_nilai_klaim_rp > 0
    assert len(manifest.batch_integrity_sha256) == 64


def test_permenkes_26_sanction_calculation():
    manifest = organize_claim_dossiers(SYNTHETIC_CLAIMS_DATABASE)
    for c in manifest.claims:
        if c.dispute_lane == "MERAH":
            assert c.biaya_riil_terverifikasi_rp == 0.0
            assert c.selisih_kelebihan_bayar_rp == c.nilai_klaim_rp
            assert c.denda_administratif_rp == c.selisih_kelebihan_bayar_rp * 0.50
            assert c.total_tuntutan_ganti_rugi_rp == c.selisih_kelebihan_bayar_rp * 1.50
        elif c.dispute_lane == "HIJAU":
            assert c.selisih_kelebihan_bayar_rp == 0.0
            assert c.denda_administratif_rp == 0.0
            assert c.total_tuntutan_ganti_rugi_rp == 0.0


def test_standardized_filename_convention():
    manifest = organize_claim_dossiers(SYNTHETIC_CLAIMS_DATABASE)
    for c in manifest.claims:
        parts = c.standardized_filename.split("_")
        assert len(parts) >= 5
        assert c.standardized_filename.endswith(".json")
        assert c.claim_id in c.standardized_filename
        assert c.dispute_lane in c.standardized_filename
        assert len(c.sha256_checksum) == 64


def test_generate_dossier_csv_report():
    manifest = organize_claim_dossiers(SYNTHETIC_CLAIMS_DATABASE)
    csv_str = generate_dossier_csv_report(manifest)
    assert "DOSSIER REKONSILIASI KLAIM" in csv_str
    assert "PERMENKES NO. 26 TAHUN 2021" in csv_str
    assert "Nama Berkas Terstandarisasi" in csv_str
    assert "=SUM(" in csv_str
    assert manifest.batch_integrity_sha256[:16] in csv_str


def test_api_dossier_summary_endpoint():
    res = client.get("/api/v1/dossier/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["spec_version"] == "1.0.0-codex"
    assert data["total_berkas_diorganisir"] >= 1
    assert "faskes_summaries" in data
    assert "claims" in data


def test_api_dossier_claims_filter():
    res_merah = client.get("/api/v1/dossier/claims?lane=MERAH")
    assert res_merah.status_code == 200
    claims_merah = res_merah.json()
    assert len(claims_merah) >= 1
    assert all(c["dispute_lane"] == "MERAH" for c in claims_merah)

    res_all = client.get("/api/v1/dossier/claims")
    assert res_all.status_code == 200
    claims_all = res_all.json()
    assert len(claims_all) >= len(claims_merah)


def test_api_dossier_csv_export_endpoint():
    res = client.get("/api/v1/dossier/export/csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "claimtrace_dossier_" in res.headers.get("content-disposition", "")
    assert b"DOSSIER REKONSILIASI KLAIM" in res.content


def test_api_dossier_faskes_endpoint():
    res = client.get("/api/v1/dossier/faskes/FSK-RSX-01")
    assert res.status_code == 200
    faskes = res.json()
    assert faskes["faskes_id"] == "FSK-RSX-01"
    assert faskes["total_denda_50persen_rp"] > 0
    assert "status_rekomendasi" in faskes

    res_404 = client.get("/api/v1/dossier/faskes/NONEXISTENT-999")
    assert res_404.status_code == 404
