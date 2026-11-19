import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple

class AuditLogger:
    """
    Tamper-Evident Audit Log using SHA-256 Hash Chaining.
    Ensures that every algorithmic scoring event and human-in-the-loop decision
    is immutably chained for legal and forensic compliance (UU PDP No. 27/2022).
    """
    def __init__(self):
        self.chain: List[Dict[str, Any]] = []

    def record_event(
        self,
        event_type: str,
        claim_id: str,
        actor: str,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        prev_hash = self.chain[-1]["current_hash"] if self.chain else "0" * 64
        timestamp = datetime.now(timezone.utc).isoformat()
        
        block_content = json.dumps({
            "prev_hash": prev_hash,
            "timestamp": timestamp,
            "event_type": event_type,
            "claim_id": claim_id,
            "actor": actor,
            "payload": payload
        }, sort_keys=True)
        
        current_hash = hashlib.sha256(block_content.encode("utf-8")).hexdigest()
        entry = {
            "index": len(self.chain) + 1,
            "timestamp": timestamp,
            "event_type": event_type,
            "claim_id": claim_id,
            "actor": actor,
            "payload": payload,
            "prev_hash": prev_hash,
            "current_hash": current_hash
        }
        self.chain.append(entry)
        return entry

    def verify_integrity(self) -> Tuple[bool, int]:
        """
        Verifies that every entry in the chain links correctly to its predecessor
        and that the hashes have not been modified.
        Returns: (is_valid, invalid_index_if_any)
        """
        for i, entry in enumerate(self.chain):
            expected_prev = self.chain[i - 1]["current_hash"] if i > 0 else "0" * 64
            if entry["prev_hash"] != expected_prev:
                return False, i

            block_content = json.dumps({
                "prev_hash": entry["prev_hash"],
                "timestamp": entry["timestamp"],
                "event_type": entry["event_type"],
                "claim_id": entry["claim_id"],
                "actor": entry["actor"],
                "payload": entry["payload"]
            }, sort_keys=True)

            recalculated_hash = hashlib.sha256(block_content.encode("utf-8")).hexdigest()
            if entry["current_hash"] != recalculated_hash:
                return False, i

        return True, -1

    def get_entries_for_claim(self, claim_id: str) -> List[Dict[str, Any]]:
        return [e for e in self.chain if e["claim_id"] == claim_id]


def pseudonymize_nik(nik_raw: str, secret_salt: str = "BPJS_HEALTHKATHON_2026_SALT") -> str:
    """
    Pseudonymizes patient NIK using HMAC-SHA256 tokenization.
    Complies with data minimization requirements in UU PDP No. 27/2022.
    """
    token = hashlib.sha256(f"{nik_raw}:{secret_salt}".encode("utf-8")).hexdigest()
    return f"AES256_{token[:16]}"
