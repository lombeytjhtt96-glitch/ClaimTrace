"""
ClaimTrace JKN Decision Receipts & Human Gate Engine.
Inspired by and applying standards from OpenAgentOntology / ra-qm-team:
- ra-qm-team/skills/agent-decision-receipts (Tamper-evident action manifests, offline verification)
- engineering/human-gate (Human-in-the-loop review gate, blocker resolution, NIP validation)
- engineering/agent-run-forensics (Evidence anchoring, execution integrity)

Complies with:
- Perpres No. 82/2018 Pasal 76 (Verifikasi Vedika BPJS Kesehatan)
- Permenkes No. 26/2021 Pasal 74 (Pencegahan & Penanganan Fraud JKN)
- UU PDP No. 27/2022 Pasal 35 (Pelindungan Data Pribadi & Zero-PHI)
"""

from __future__ import annotations

import hashlib
import hmac
import json
import re
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional

# Secret key for HMAC tamper-evident seals (in production loaded from HSM / KMS)
RECEIPT_SIGNING_SALT = "CLAIMTRACE_BPJS_JKN_RECEIPT_SALT_2026_SOVEREIGN"

# Consequential verbs requiring receipts under ISO 27001 / RA-QM standards
HIGH_CONSEQUENCE_OPERATIONS = {
    "FLAG_FRAUD",
    "APPROVE_VEDIKA",
    "REJECT_CLAIM",
    "ISSUE_TGR",
    "DISPOSE_JALUR_MERAH",
    "SUSPEND_FASKES_CREDENTIAL"
}

REQUIRED_MANIFEST_FIELDS = ("agent_id", "operation", "target", "policy", "inputs_hash")

def compute_inputs_hash(data: Any) -> str:
    """Computes a reproducible SHA-256 hash of canonical input data."""
    if isinstance(data, (dict, list)):
        payload_str = json.dumps(data, sort_keys=True, ensure_ascii=True)
    else:
        payload_str = str(data)
    digest = hashlib.sha256(payload_str.encode("utf-8")).hexdigest()
    return f"sha256:{digest[:16]}"

def compute_canonical_receipt_digest(manifest: Dict[str, Any], issued_at: str) -> str:
    """
    Computes a canonical SHA-256 digest over the manifest attributes and timestamp.
    Evidence must be ASCII so the receipt hash reproduces consistently in any environment.
    """
    canonical_dict = {
        "agent_id": manifest.get("agent_id"),
        "operation": manifest.get("operation"),
        "target": manifest.get("target"),
        "policy": manifest.get("policy"),
        "inputs_hash": manifest.get("inputs_hash"),
        "decision_label": manifest.get("decision_label"),
        "severity": manifest.get("severity"),
        "issued_at": issued_at
    }
    canonical_json = json.dumps(canonical_dict, sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(canonical_json.encode("ascii")).hexdigest()

def generate_digital_seal(canonical_digest: str, verifikator_nip: Optional[str] = None) -> str:
    """Generates an HMAC-SHA256 digital seal simulating post-quantum verifiable signature."""
    key = (RECEIPT_SIGNING_SALT + (verifikator_nip or "SYSTEM_AUTONOMOUS")).encode("utf-8")
    return hmac.new(key, canonical_digest.encode("utf-8"), hashlib.sha256).hexdigest()

def mint_decision_receipt(
    agent_id: str,
    operation: str,
    target: str,
    policy: str,
    decision_label: str,
    inputs: Any,
    severity: str = "HIGH",
    tgr_recovery_amount_rp: float = 0.0,
    claim_id: Optional[str] = None,
    faskes_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Mints a formal, tamper-evident Agent Decision Receipt.
    Enforces Human Gate review for CRITICAL or HIGH severity decisions (Jalur Merah).
    """
    op_upper = operation.strip().upper()
    sev_upper = severity.strip().upper()

    # Determine if Human Gate is mandatory under Permenkes 26/2021 & Perpres 82/2018
    requires_human_gate = (
        op_upper in ("FLAG_FRAUD", "ISSUE_TGR", "DISPOSE_JALUR_MERAH") or
        sev_upper in ("CRITICAL", "HIGH")
    )

    inputs_hash = compute_inputs_hash(inputs)
    manifest = {
        "agent_id": agent_id,
        "operation": op_upper,
        "target": target,
        "policy": policy,
        "inputs_hash": inputs_hash,
        "decision_label": decision_label,
        "severity": sev_upper,
        "claim_id": claim_id,
        "faskes_name": faskes_name,
        "tgr_recovery_amount_rp": tgr_recovery_amount_rp,
        "human_gate_required": requires_human_gate,
        "human_gate_status": "PENDING_REVIEW" if requires_human_gate else "AUTONOMOUS_APPROVED",
        "human_reviewer_nip": None,
        "human_reviewer_name": None,
        "blockers": ["Menunggu verifikasi NIP verifikator BPJS resmi untuk Jalur Merah"] if requires_human_gate else []
    }

    # Validate required fields
    for field in REQUIRED_MANIFEST_FIELDS:
        if not manifest.get(field):
            raise ValueError(f"Missing mandatory action manifest field: {field}")

    issued_at = datetime.now(timezone.utc).isoformat()
    canonical_digest = compute_canonical_receipt_digest(manifest, issued_at)
    digital_seal = generate_digital_seal(canonical_digest)

    # Unique sequential or hashed receipt ID
    target_clean = re.sub(r"[^A-Za-z0-9]", "", target)[:10]
    receipt_id = f"RCP-JKN-2026-{canonical_digest[:8].upper()}"

    receipt = {
        "receipt_id": receipt_id,
        "spec_version": "1.0.0-oao-receipt",
        "issued_at": issued_at,
        "canonical_digest_sha256": canonical_digest,
        "digital_seal": digital_seal,
        "verification_status": "VALID",
        "sovereign_boundary": "asia-southeast2 (Jakarta Region per UU PDP 27/2022)",
        "manifest": manifest
    }
    return receipt

def verify_decision_receipt(receipt: Dict[str, Any]) -> Dict[str, Any]:
    """
    Verifies a decision receipt offline from the receipt content alone.
    Checks:
    1. Canonical digest recalculation
    2. Digital seal validity
    3. Human gate status (if required, must not have open blockers to be EXECUTABLE)
    """
    manifest = receipt.get("manifest", {})
    issued_at = receipt.get("issued_at", "")
    recorded_digest = receipt.get("canonical_digest_sha256", "")
    recorded_seal = receipt.get("digital_seal", "")

    recalculated_digest = compute_canonical_receipt_digest(manifest, issued_at)
    digest_matches = hmac.compare_digest(recorded_digest, recalculated_digest)

    verifikator_nip = manifest.get("human_reviewer_nip")
    expected_seal = generate_digital_seal(recorded_digest, verifikator_nip)
    seal_matches = hmac.compare_digest(recorded_seal, expected_seal)

    human_gate_required = manifest.get("human_gate_required", False)
    gate_status = manifest.get("human_gate_status", "UNKNOWN")
    blockers = manifest.get("blockers", [])

    is_tamper_free = digest_matches and seal_matches
    is_executable = is_tamper_free and (not human_gate_required or (gate_status == "HUMAN_VERIFIED" and len(blockers) == 0))

    reasons = []
    if not digest_matches:
        reasons.append("Digest SHA-256 manifest tidak cocok (indikasi manipulasi data).")
    if not seal_matches:
        reasons.append("Digital seal HMAC tidak valid.")
    if human_gate_required and gate_status != "HUMAN_VERIFIED":
        reasons.append(f"Human Gate belum diverifikasi (Status: {gate_status}). Tindakan tidak boleh dieksekusi sepihak.")
    if len(blockers) > 0:
        reasons.append(f"Terdapat {len(blockers)} blocker aktif yang belum diselesaikan.")

    return {
        "receipt_id": receipt.get("receipt_id"),
        "tamper_free": is_tamper_free,
        "digest_matches": digest_matches,
        "seal_matches": seal_matches,
        "human_gate_cleared": (not human_gate_required or gate_status == "HUMAN_VERIFIED") and len(blockers) == 0,
        "is_executable": is_executable,
        "reasons": reasons if reasons else ["Semua verifikasi kriptografis dan gerbang manusia valid."]
    }

def apply_human_gate_review(
    receipt: Dict[str, Any],
    verifikator_nip: str,
    verifikator_name: str,
    approved: bool,
    blocker_notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Processes human review on a decision receipt in compliance with Permenkes No. 26/2021.
    Refuses to close gate if approval is granted without a valid NIP.
    """
    nip_cleaned = verifikator_nip.strip()
    if not nip_cleaned or len(nip_cleaned) < 5:
        raise ValueError("Human Gate menolak sign-off tanpa NIP verifikator BPJS resmi.")

    name_cleaned = verifikator_name.strip()
    if not name_cleaned:
        raise ValueError("Human Gate menolak sign-off tanpa nama verifikator resmi.")

    manifest = receipt["manifest"]
    if approved:
        if blocker_notes and blocker_notes.strip():
            # If there's an open objection, gate remains blocked
            manifest["human_gate_status"] = "GATE_BLOCKED"
            manifest["blockers"] = [blocker_notes.strip()]
        else:
            manifest["human_gate_status"] = "HUMAN_VERIFIED"
            manifest["blockers"] = []
    else:
        manifest["human_gate_status"] = "REJECTED"
        manifest["blockers"] = [blocker_notes.strip() if blocker_notes else "Ditolak oleh verifikator BPJS."]

    manifest["human_reviewer_nip"] = nip_cleaned
    manifest["human_reviewer_name"] = name_cleaned

    # Re-seal the receipt with the verifikator's NIP
    recalculated_digest = compute_canonical_receipt_digest(manifest, receipt["issued_at"])
    receipt["canonical_digest_sha256"] = recalculated_digest
    receipt["digital_seal"] = generate_digital_seal(recalculated_digest, nip_cleaned)
    receipt["verified_at"] = datetime.now(timezone.utc).isoformat()

    return receipt

# In-memory persistence of active decision receipts
INITIAL_MOCK_RECEIPTS: List[Dict[str, Any]] = [
    mint_decision_receipt(
        agent_id="claimtrace-ai-dss-v1.2",
        operation="FLAG_FRAUD",
        target="CLM-2026-8801 - RS Khusus Mitra Husada",
        policy="Perpres No. 82/2018 Pasal 76 & Permenkes No. 26/2021 Pasal 74",
        decision_label="PHANTOM_BILLING_SURGE",
        inputs={
            "faskes_id": "RS-8801",
            "cbg_code": "Z-3-12-0",
            "surge_ratio": 5.4,
            "mobile_jkn_denial_rate": 0.62,
            "nominal_rp": 15300000
        },
        severity="CRITICAL",
        tgr_recovery_amount_rp=15300000.0,
        claim_id="CLM-2026-8801",
        faskes_name="RS Khusus Mitra Husada"
    ),
    mint_decision_receipt(
        agent_id="claimtrace-ai-dss-v1.2",
        operation="DISPOSE_JALUR_MERAH",
        target="CLM-2026-8802 - RS Medika Sentosa",
        policy="Permenkes No. 26/2021 Pasal 74",
        decision_label="INACTIVE_SIP_PHYSICIAN",
        inputs={
            "faskes_id": "RS-8802",
            "dpjp_sip": "SIP-OFFLINE-9921",
            "sdmk_status": "REVOKED",
            "nominal_rp": 8450000
        },
        severity="CRITICAL",
        tgr_recovery_amount_rp=8450000.0,
        claim_id="CLM-2026-8802",
        faskes_name="RS Medika Sentosa"
    ),
    mint_decision_receipt(
        agent_id="claimtrace-ai-dss-v1.2",
        operation="FLAG_FRAUD",
        target="CLM-2026-8803 - RS Graha Sehat Mandiri",
        policy="Perpres No. 82/2018 & Pedoman INA-CBG",
        decision_label="UPCODING_SEVERITY_III",
        inputs={
            "faskes_id": "RS-8803",
            "cbg_code": "I-4-10-III",
            "icu_los_hours": 0,
            "nominal_rp": 24200000
        },
        severity="HIGH",
        tgr_recovery_amount_rp=11200000.0,
        claim_id="CLM-2026-8803",
        faskes_name="RS Graha Sehat Mandiri"
    ),
    mint_decision_receipt(
        agent_id="claimtrace-ai-dss-v1.2",
        operation="APPROVE_VEDIKA",
        target="CLM-2026-8805 - RS Islam Cempaka Putih",
        policy="Perpres No. 82/2018 Pasal 76 ayat (2)",
        decision_label="VERIFIED_COMPLIANT_VEDIKA",
        inputs={
            "faskes_id": "RS-8805",
            "cbg_code": "O-6-10-I",
            "nominal_rp": 4200000,
            "fingerprint_verified": True
        },
        severity="LOW",
        tgr_recovery_amount_rp=0.0,
        claim_id="CLM-2026-8805",
        faskes_name="RS Islam Cempaka Putih"
    )
]

# Sign the compliant receipt with an authorized sample Verifikator BPJS
apply_human_gate_review(
    receipt=INITIAL_MOCK_RECEIPTS[3],
    verifikator_nip="198708152010121003",
    verifikator_name="Dra. Sri Wahyuni, Apt",
    approved=True
)

RECEIPTS_REGISTRY: Dict[str, Dict[str, Any]] = {
    r["receipt_id"]: r for r in INITIAL_MOCK_RECEIPTS
}

def list_all_decision_receipts(severity: Optional[str] = None, gate_status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns all active decision receipts with optional filters."""
    receipts = list(RECEIPTS_REGISTRY.values())
    if severity:
        sev_u = severity.strip().upper()
        receipts = [r for r in receipts if r["manifest"]["severity"] == sev_u]
    if gate_status:
        gate_u = gate_status.strip().upper()
        receipts = [r for r in receipts if r["manifest"]["human_gate_status"] == gate_u]
    return receipts

def get_decision_receipt(receipt_or_claim_id: str) -> Optional[Dict[str, Any]]:
    """Finds receipt by receipt_id or associated claim_id."""
    target = receipt_or_claim_id.strip().upper()
    if target in RECEIPTS_REGISTRY:
        return RECEIPTS_REGISTRY[target]
    for r in RECEIPTS_REGISTRY.values():
        if r["manifest"].get("claim_id", "").upper() == target:
            return r
    return None

def compute_batch_receipts_manifest() -> Dict[str, Any]:
    """Generates an overall batch manifest linking all receipts with a master SHA-256 seal."""
    receipts = list(RECEIPTS_REGISTRY.values())
    sorted_digests = sorted([r["canonical_digest_sha256"] for r in receipts])
    manifest_string = "|".join(sorted_digests)
    master_seal = hashlib.sha256(manifest_string.encode("ascii")).hexdigest()

    total_tgr = sum(r["manifest"].get("tgr_recovery_amount_rp", 0.0) for r in receipts)
    pending_human_count = sum(1 for r in receipts if r["manifest"]["human_gate_status"] == "PENDING_REVIEW")
    verified_human_count = sum(1 for r in receipts if r["manifest"]["human_gate_status"] == "HUMAN_VERIFIED")

    return {
        "spec_version": "1.0.0-oao-receipt",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_receipts": len(receipts),
        "master_manifest_seal_sha256": master_seal,
        "pending_human_gate_count": pending_human_count,
        "verified_human_gate_count": verified_human_count,
        "total_potential_tgr_rp": total_tgr,
        "receipts": receipts
    }
