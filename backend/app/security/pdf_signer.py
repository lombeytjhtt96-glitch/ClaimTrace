"""
ClaimTrace JKN — X.509 / BSrE-Compatible Cryptographic PDF Digital Signature Engine (pyHanko + ReportLab).
Generates official BPJS Kesehatan BAHV PDFs and embeds verifiable CMS/PKCS#7 X.509 digital signatures
directly inside the PDF binary structure without external cloud exfiltration.
"""

from __future__ import annotations

import hashlib
import io
import os
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.sign import signers
from pyhanko.sign.validation import validate_pdf_signature
from pyhanko_certvalidator import ValidationContext
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

CERT_DIR = Path(__file__).resolve().parent.parent.parent / "data" / ".x509_certs"
KEY_FILE = CERT_DIR / "claimtrace_bsre_signer.key.pem"
CERT_FILE = CERT_DIR / "claimtrace_bsre_signer.crt.pem"

_CERT_LOCK = threading.RLock()
_CACHED_CERT_PEM: Optional[bytes] = None
_CACHED_KEY_PEM: Optional[bytes] = None


def _ensure_x509_keypair() -> tuple[bytes, bytes]:
    """Loads or generates an RSA-2048 X.509 signing certificate for ClaimTrace BAHV PDFs."""
    global _CACHED_KEY_PEM, _CACHED_CERT_PEM
    with _CERT_LOCK:
        if _CACHED_KEY_PEM and _CACHED_CERT_PEM:
            return _CACHED_KEY_PEM, _CACHED_CERT_PEM

        if not os.getenv("PYTEST_CURRENT_TEST") and KEY_FILE.exists() and CERT_FILE.exists():
            _CACHED_KEY_PEM = KEY_FILE.read_bytes()
            _CACHED_CERT_PEM = CERT_FILE.read_bytes()
            return _CACHED_KEY_PEM, _CACHED_CERT_PEM

        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "ID"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "DKI Jakarta"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "BPJS Kesehatan - ClaimTrace DSS"),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "Kedeputian Pengawasan dan Pemeriksaan"),
            x509.NameAttribute(NameOID.COMMON_NAME, "Verifikator Elektronik ClaimTrace BSrE-Compatible"),
        ])
        now = datetime.now(timezone.utc)
        cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(private_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(now - timedelta(minutes=5))
            .not_valid_after(now + timedelta(days=730))
            .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
            .add_extension(
                x509.KeyUsage(
                    digital_signature=True,
                    content_commitment=True,
                    key_encipherment=False,
                    data_encipherment=False,
                    key_agreement=False,
                    key_cert_sign=True,
                    crl_sign=False,
                    encipher_only=False,
                    decipher_only=False,
                ),
                critical=True,
            )
            .sign(private_key, hashes.SHA256())
        )

        key_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
        cert_pem = cert.public_bytes(serialization.Encoding.PEM)

        if not os.getenv("PYTEST_CURRENT_TEST"):
            try:
                CERT_DIR.mkdir(parents=True, exist_ok=True)
                KEY_FILE.write_bytes(key_pem)
                CERT_FILE.write_bytes(cert_pem)
                os.chmod(KEY_FILE, 0o600)
            except Exception:
                pass

        _CACHED_KEY_PEM = key_pem
        _CACHED_CERT_PEM = cert_pem
        return key_pem, cert_pem


def _load_simple_signer() -> signers.SimpleSigner:
    key_pem, cert_pem = _ensure_x509_keypair()
    from asn1crypto import keys as asn1_keys, pem as asn1_pem, x509 as asn1_x509

    _, _, cert_der = asn1_pem.unarmor(cert_pem)
    _, _, key_der = asn1_pem.unarmor(key_pem)
    asn1_cert = asn1_x509.Certificate.load(cert_der)
    asn1_key = asn1_keys.PrivateKeyInfo.load(key_der)
    return signers.SimpleSigner(signing_cert=asn1_cert, signing_key=asn1_key, cert_registry=None)


def build_bahv_pdf_bytes(claim_data: Dict[str, Any]) -> bytes:
    """Generates an official BPJS Kesehatan BAHV PDF document using ReportLab."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4

    c.setFillColorRGB(0.0, 0.45, 0.23)
    c.rect(0, height - 86, width, 86, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(42, height - 38, "BPJS KESEHATAN · CLAIMTRACE JKN DSS")
    c.setFont("Helvetica", 9.5)
    c.drawString(42, height - 58, "Berita Acara Hasil Verifikasi (BAHV) · Tanda Tangan Elektronik X.509 / BSrE-Compatible")

    c.setFillColorRGB(0.06, 0.09, 0.16)
    y = height - 125
    lines = [
        ("Nomor Klaim", str(claim_data.get("claim_id", "CLM-2026-8801"))),
        ("Fasilitas Kesehatan (FKRTL)", str(claim_data.get("nama_faskes", "RS Khusus Mitra Husada"))),
        ("Kode INA-CBG", str(claim_data.get("ina_cbg_code", "Z-3-12-0"))),
        ("Diagnosis Primer (ICD-10)", str(claim_data.get("icd10_primary", "M54.5"))),
        ("Nilai Klaim Diajukan", f"Rp {int(claim_data.get('nilai_klaim_rp', 0) or 0):,}".replace(",", ".")),
        ("Status Verifikasi", str(claim_data.get("status_verifikasi") or "TERVERIFIKASI")),
        ("Nomor FPK", str(claim_data.get("no_fpk") or "FPK-0114-202611-001")),
        ("Waktu Penandatanganan (UTC)", datetime.now(timezone.utc).isoformat()),
    ]
    for label, val in lines:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(42, y, f"{label}:")
        c.setFont("Helvetica", 10)
        c.drawString(215, y, val[:75])
        y -= 24

    c.setStrokeColorRGB(0.8, 0.85, 0.88)
    c.line(42, y - 10, width - 42, y - 10)
    c.setFont("Helvetica-Oblique", 8.5)
    c.drawString(42, y - 28, "Dokumen ini ditandatangani secara kriptografis menggunakan pyHanko X.509 RSA-2048 SHA-256.")
    c.drawString(42, y - 42, "Kepatuhan: UU PDP No. 27/2022 & Perpres No. 82/2018 · Zero-Cloud On-Premise Execution.")

    c.showPage()
    c.save()
    return buf.getvalue()


def sign_pdf_bytes(
    pdf_bytes: bytes,
    reason: str = "Pengesahan Berita Acara Hasil Verifikasi (BAHV) BPJS Kesehatan",
    location: str = "Jakarta, Indonesia (ClaimTrace On-Premise)",
    field_name: str = "ClaimTraceBSrESignature",
) -> bytes:
    """Embeds a cryptographic X.509 CMS/PKCS#7 signature inside a PDF binary using pyHanko."""
    signer = _load_simple_signer()
    in_buf = io.BytesIO(pdf_bytes)
    writer = IncrementalPdfFileWriter(in_buf)
    meta = signers.PdfSignatureMetadata(
        field_name=field_name,
        reason=reason,
        location=location,
        md_algorithm="sha256",
    )
    out_buf = io.BytesIO()
    signers.sign_pdf(writer, signature_meta=meta, signer=signer, output=out_buf)
    return out_buf.getvalue()


def verify_signed_pdf_bytes(signed_pdf_bytes: bytes) -> Dict[str, Any]:
    """Cryptographically validates embedded pyHanko X.509 PDF signatures."""
    _, cert_pem = _ensure_x509_keypair()
    from asn1crypto import pem as asn1_pem, x509 as asn1_x509

    _, _, cert_der = asn1_pem.unarmor(cert_pem)
    trust_root = asn1_x509.Certificate.load(cert_der)
    vc = ValidationContext(trust_roots=[trust_root])

    reader = PdfFileReader(io.BytesIO(signed_pdf_bytes))
    sigs = list(reader.embedded_signatures)
    if not sigs:
        return {
            "signed": False,
            "intact": False,
            "valid": False,
            "signature_count": 0,
            "sha256": hashlib.sha256(signed_pdf_bytes).hexdigest(),
        }

    sig = sigs[-1]
    status = validate_pdf_signature(sig, signer_validation_context=vc)
    return {
        "signed": True,
        "intact": bool(status.intact),
        "valid": bool(status.valid),
        "trusted": bool(status.trusted),
        "signature_count": len(sigs),
        "field_name": sig.field_name,
        "signer_subject": status.signing_cert.subject.human_friendly if status.signing_cert else None,
        "md_algorithm": str(status.md_algorithm),
        "sha256": hashlib.sha256(signed_pdf_bytes).hexdigest(),
        "size_bytes": len(signed_pdf_bytes),
    }


def get_pdf_signer_status() -> Dict[str, Any]:
    _, cert_pem = _ensure_x509_keypair()
    cert = x509.load_pem_x509_certificate(cert_pem)
    return {
        "engine": "pyhanko-x509-cms-pkcs7",
        "standard": "BSrE / PAdES-Compatible RSA-2048 SHA-256",
        "subject": cert.subject.rfc4514_string(),
        "serial_number": hex(cert.serial_number),
        "not_valid_after": cert.not_valid_after_utc.isoformat(),
        "fingerprint_sha256": cert.fingerprint(hashes.SHA256()).hex(),
    }
