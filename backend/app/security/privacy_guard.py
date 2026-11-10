"""
ClaimTrace Active Privacy Guard & PHI Redaction Engine
Enforces UU PDP No. 27/2022 (Data Pribadi Spesifik Kesehatan) & Permenkes No. 24/2022.
Automatically sanitizes, pseudonyms, and masks NIK, No. Kartu BPJS, and Telemetri Kontak.
"""

import re
from typing import Any, Dict, List, Tuple

# Regex Patterns for Sensitive Indonesian Personal Identifiers
NIK_REGEX = re.compile(r"\b([1-9][0-9]{5})([0-9]{6})([0-9]{4})\b")  # 16-digit NIK
BPJS_CARD_REGEX = re.compile(r"\b(000[0-9]{2})([0-9]{5})([0-9]{3})\b") # 13-digit BPJS card
PHONE_REGEX = re.compile(r"(\+?62|0)8[1-9][0-9]{1,2}-?[0-9]{4}-?[0-9]{2,4}\b")

def mask_nik(nik_raw: str) -> str:
    """Masks a 16-digit NIK: keep first 6 and last 4 digits (e.g. 337402******0001)."""
    clean = re.sub(r"\D", "", nik_raw)
    if len(clean) == 16:
        return f"{clean[:6]}******{clean[12:]}"
    return nik_raw

def mask_bpjs_card(card_raw: str) -> str:
    """Masks a 13-digit BPJS card: keep first 5 and last 3 digits."""
    clean = re.sub(r"\D", "", card_raw)
    if len(clean) == 13:
        return f"{clean[:5]}*****{clean[10:]}"
    return card_raw

def mask_phone(phone_raw: str) -> str:
    """Masks an Indonesian mobile phone number preserving prefix and last 4 digits."""
    clean = re.sub(r"\D", "", phone_raw or "")
    if len(clean) >= 8:
        prefix = "+62" if str(phone_raw).strip().startswith("+62") else clean[:4]
        if str(phone_raw).strip().startswith("+62"):
            return f"+62{clean[2:5]}****{clean[-4:]}"
        return f"{prefix}****{clean[-4:]}"
    return phone_raw

def redact_text_phi(text: str) -> Tuple[str, int]:
    """
    Scans a string and replaces unredacted NIKs, BPJS card numbers, and phone numbers.
    Returns (redacted_text, count_of_redactions).
    """
    count = 0

    def _replace_nik(match):
        nonlocal count
        count += 1
        return f"{match.group(1)}******{match.group(3)}"

    def _replace_card(match):
        nonlocal count
        count += 1
        return f"{match.group(1)}*****{match.group(3)}"

    def _replace_phone(match):
        nonlocal count
        count += 1
        return mask_phone(match.group(0))

    redacted = NIK_REGEX.sub(_replace_nik, text)
    redacted = BPJS_CARD_REGEX.sub(_replace_card, redacted)
    redacted = PHONE_REGEX.sub(_replace_phone, redacted)

    return redacted, count

def sanitize_json_payload(data: Any) -> Any:
    """
    Recursively scans and sanitizes dicts, lists, and strings for sensitive health identifiers.
    """
    if isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            key_l = k.lower()
            if key_l in {"nik", "nik_raw", "nomor_induk_kependudukan"} and isinstance(v, str):
                sanitized[k] = mask_nik(v)
            elif key_l in {"no_kartu", "no_peserta"} and isinstance(v, str):
                sanitized[k] = mask_bpjs_card(v)
            elif key_l in {"phone", "telepon", "no_hp", "hp"} and isinstance(v, str):
                sanitized[k] = mask_phone(v)
            else:
                sanitized[k] = sanitize_json_payload(v)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_json_payload(item) for item in data]
    elif isinstance(data, str):
        redacted, _ = redact_text_phi(data)
        return redacted
    return data
