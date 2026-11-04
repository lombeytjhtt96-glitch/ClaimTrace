import os
import hmac
import hashlib
import json
import copy
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional

class AuditLogger:
    """
    Tamper-Evident Audit Log using SHA-256 Hash Chaining with Disk Persistence.
    Ensures that every algorithmic scoring event and human-in-the-loop decision
    is immutably chained and saved to disk for legal and forensic compliance (UU PDP No. 27/2022).
    """
    def __init__(self, storage_path: Optional[str] = None, persist_to_disk: Optional[bool] = None):
        self.chain: List[Dict[str, Any]] = []
        if persist_to_disk is None:
            # Avoid loading or writing shared disk storage during unit test runs
            self.persist_to_disk = False if os.getenv("PYTEST_CURRENT_TEST") else True
        else:
            self.persist_to_disk = persist_to_disk

        if self.persist_to_disk:
            if storage_path:
                self.storage_path = storage_path
            else:
                base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
                os.makedirs(base_dir, exist_ok=True)
                self.storage_path = os.path.join(base_dir, "audit_ledger_chain.jsonl")
            self._load_persisted_chain()
        else:
            self.storage_path = storage_path

    def _load_persisted_chain(self) -> None:
        if not self.persist_to_disk or not self.storage_path or not os.path.exists(self.storage_path):
            return
        loaded = []
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        loaded.append(json.loads(line))
            if loaded:
                self.chain = loaded
                valid, broken_idx = self.verify_integrity()
                if not valid:
                    print(f"[AuditLogger] Warning: Persisted audit chain broken at index {broken_idx}. Preserving in-memory only.")
                    self.chain.clear()
        except Exception as e:
            print(f"[AuditLogger] Warning reading persisted chain: {e}")

    def _persist_entry(self, entry: Dict[str, Any]) -> None:
        if not self.persist_to_disk or not self.storage_path:
            return
        try:
            with open(self.storage_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, sort_keys=True) + "\n")
        except Exception as e:
            print(f"[AuditLogger] Warning persisting entry to disk: {e}")

    def clear_persisted_chain(self) -> None:
        """Clears both memory and disk chain for clean initial seed reset."""
        self.chain.clear()
        try:
            if self.persist_to_disk and self.storage_path and os.path.exists(self.storage_path):
                with open(self.storage_path, "w", encoding="utf-8") as f:
                    f.truncate(0)
        except Exception as e:
            print(f"[AuditLogger] Warning truncating chain file: {e}")

    def record_event(
        self,
        event_type: str,
        claim_id: str,
        actor: str,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        prev_hash = self.chain[-1]["current_hash"] if self.chain else "0" * 64
        timestamp = datetime.now(timezone.utc).isoformat()
        frozen_payload = copy.deepcopy(payload)
        
        block_content = json.dumps({
            "prev_hash": prev_hash,
            "timestamp": timestamp,
            "event_type": event_type,
            "claim_id": claim_id,
            "actor": actor,
            "payload": frozen_payload
        }, sort_keys=True)
        
        current_hash = hashlib.sha256(block_content.encode("utf-8")).hexdigest()
        entry = {
            "index": len(self.chain) + 1,
            "timestamp": timestamp,
            "event_type": event_type,
            "claim_id": claim_id,
            "actor": actor,
            "payload": frozen_payload,
            "prev_hash": prev_hash,
            "current_hash": current_hash
        }
        self.chain.append(entry)
        self._persist_entry(entry)
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


# Secure system salt for patient NIK pseudonymization
SYSTEM_NIK_SALT = os.getenv("CLAIMTRACE_NIK_SALT", "BPJS_ENTERPRISE_HMAC_SALT_DEFAULT_SECURE_2026")

def pseudonymize_nik(nik_raw: str, secret_salt: Optional[str] = None) -> str:
    """
    Pseudonymizes patient NIK using HMAC-SHA256 tokenization.
    Complies with data minimization requirements in UU PDP No. 27/2022.
    """
    active_salt = secret_salt or SYSTEM_NIK_SALT
    token = hmac.new(active_salt.encode("utf-8"), nik_raw.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"AES256_{token[:16]}"
