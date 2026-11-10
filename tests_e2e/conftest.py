"""
Konfigurasi Test Fixtures dan Test Client E2E ClaimTrace DSS
Jalur Pengujian Mandiri (tests_e2e/)
Healthkathon BPJS Kesehatan 2026 - Standard Opaque-Box & Requirement-Driven Testing
"""

import os
import sys
from pathlib import Path
from typing import Dict, Any
import pytest
from starlette.testclient import TestClient

# Pastikan environment test aktif agar tidak memodifikasi file penyimpanan persisten produksi
os.environ["PYTEST_CURRENT_TEST"] = "true"

# Daftarkan direktori backend ke sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.security.token_manager import create_access_token


import httpx


@pytest.fixture(scope="session")
def client() -> httpx.Client:
    """
    Client pengujian E2E tersinkronisasi untuk memanggil endpoint REST API ClaimTrace DSS.
    Mengutamakan koneksi Opaque-Box E2E langsung ke live server aktif pada port 8000,
    dengan fallback otomatis ke in-process TestClient jika daemon background tidak aktif.
    """
    try:
        live_client = httpx.Client(base_url="http://127.0.0.1:8000", timeout=30.0)
        res = live_client.get("/health")
        if res.status_code == 200:
            return live_client
    except Exception:
        pass
    from app.main import app
    return TestClient(app)


@pytest.fixture(scope="session")
def medical_verifier_profile() -> Dict[str, Any]:
    """
    Profil resmi Verifikator Medis Senior dr. Siti Rahma, Sp.PK
    Memiliki hak akses ADJUDICATE untuk verifikasi Jalur Merah dan Berita Acara.
    """
    return {
        "nip": "198704202011012001",
        "name": "dr. Siti Rahma, Sp.PK",
        "email": "siti.rahma@bpjs-kesehatan.go.id",
        "role": "VERIFICATOR_MEDIS",
        "unit": "Kantor Pusat BPJS Kesehatan · Kedeputian Bidang Pengawasan dan Pemeriksaan"
    }


@pytest.fixture(scope="session")
def medical_verifier_token(medical_verifier_profile) -> str:
    """Token sesi HMAC-SHA256 untuk Verifikator Medis Senior."""
    return create_access_token(medical_verifier_profile, ttl_minutes=480)


@pytest.fixture(scope="session")
def medical_verifier_headers(medical_verifier_token, medical_verifier_profile) -> Dict[str, str]:
    """Header otorisasi resmi untuk Verifikator Medis Senior."""
    return {
        "Authorization": f"Bearer {medical_verifier_token}",
        "X-BPJS-Token": medical_verifier_token,
        "X-Verificator-Role": medical_verifier_profile["role"],
        "X-Verificator-NIP": medical_verifier_profile["nip"]
    }


@pytest.fixture(scope="session")
def admin_profile() -> Dict[str, Any]:
    """Profil Administrator Sistem BPJS Kesehatan dengan hak akses ADMIN."""
    return {
        "nip": "198501012010011001",
        "name": "Administrator Sistem JKN",
        "email": "admin.dss@bpjs-kesehatan.go.id",
        "role": "ADMIN",
        "unit": "Direktorat Teknologi Informasi Forensik JKN"
    }


@pytest.fixture(scope="session")
def admin_token(admin_profile) -> str:
    """Token sesi HMAC-SHA256 untuk Administrator Sistem."""
    return create_access_token(admin_profile, ttl_minutes=480)


@pytest.fixture(scope="session")
def admin_headers(admin_token, admin_profile) -> Dict[str, str]:
    """Header otorisasi untuk Administrator Sistem."""
    return {
        "Authorization": f"Bearer {admin_token}",
        "X-BPJS-Token": admin_token,
        "X-Verificator-Role": admin_profile["role"],
        "X-Verificator-NIP": admin_profile["nip"]
    }


@pytest.fixture(scope="session")
def analyst_profile() -> Dict[str, Any]:
    """Profil Analis Data / Auditor dengan hak akses READ (tanpa mutasi ADJUDICATE)."""
    return {
        "nip": "199208152015031002",
        "name": "Budi Santoso, S.Kom, M.TI",
        "email": "budi.santoso@bpjs-kesehatan.go.id",
        "role": "ANALYST",
        "unit": "Kantor Pusat BPJS Kesehatan · Analisis Forensik Digital Anti-Fraud"
    }


@pytest.fixture(scope="session")
def analyst_token(analyst_profile) -> str:
    """Token sesi HMAC-SHA256 untuk Analis Data."""
    return create_access_token(analyst_profile, ttl_minutes=480)


@pytest.fixture(scope="session")
def analyst_headers(analyst_token, analyst_profile) -> Dict[str, str]:
    """Header otorisasi untuk Analis Data."""
    return {
        "Authorization": f"Bearer {analyst_token}",
        "X-BPJS-Token": analyst_token,
        "X-Verificator-Role": analyst_profile["role"],
        "X-Verificator-NIP": analyst_profile["nip"]
    }


def format_angka_id(angka: int) -> str:
    """
    Format angka ribuan standar Indonesia menggunakan pemisah titik.
    Contoh: 1699219 -> '1.699.219'
    """
    return f"{angka:,}".replace(",", ".")
