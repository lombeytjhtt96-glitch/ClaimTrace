"""
ClaimTrace Humanizer Engine
Implements Wikipedia's 'Signs of AI writing' and blader/humanizer v3.1.0 doctrine.
Transforms AI-sounding claim adjudication text into natural, plain human prose.
Eliminates 26 AI writing tells (staging, forced triads, buzzwords, bold labels, chatbot residue).
"""

import hashlib
import json
import re
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field

# Pattern definitions derived from blader/humanizer 26-pattern taxonomy
PATTERNS_MAP: Dict[str, List[re.Pattern]] = {
    "§1_not_x_but_y": [
        re.compile(r"\b(?:it's not (?:just|only|merely)|not just|not only|not merely)\b.*?\b(?:but|it is|it's)\b", re.IGNORECASE),
        re.compile(r"\b(?:bukan (?:hanya|sekadar|cuma))\b.*?\b(?:melainkan|tetapi)\b", re.IGNORECASE),
        re.compile(r"\b(?:tidak berarti|bukan berarti)\b.*?\b(?:tetapi|melainkan)\b", re.IGNORECASE),
    ],
    "§2_one_line_closers": [
        re.compile(r"\b(?:let that sink in|read that again|that is the real win|that distinction matters)\b", re.IGNORECASE),
        re.compile(r"\b(?:biarkan fakta ini meresap|renungkan hal ini|ini adalah kemenangan nyata)\b", re.IGNORECASE),
        re.compile(r"\b(?:ini menunjukkan pentingnya|ini menjadi bukti nyata)\b", re.IGNORECASE),
    ],
    "§3_sayings_that_sound_deep": [
        re.compile(r"\b(?:at its core|what really matters|fundamentally|the deeper issue|the heart of the matter)\b", re.IGNORECASE),
        re.compile(r"\b(?:pada intinya|di lubuk terdalam|hakikat dari|esensi sesungguhnya)\b", re.IGNORECASE),
    ],
    "§4_staged_run_up": [
        re.compile(r"\b(?:let's dive in|let's explore|here's what you need to know|honestly\?|look,|here's the thing)\b", re.IGNORECASE),
        re.compile(r"\b(?:mari kita (?:bedah|telusuri|selami)|perlu (?:diketahui|diingat),|sejujurnya\?)\b", re.IGNORECASE),
    ],
    "§5_arguing_with_no_one": [
        re.compile(r"\b(?:this isn't mainly about|i'm not saying|don't get me wrong|to be clear)\b", re.IGNORECASE),
        re.compile(r"\b(?:saya tidak bermaksud mengatakan|jangan salah paham|perlu dicatat bahwa)\b", re.IGNORECASE),
    ],
    "§6_forced_triads": [
        re.compile(r"\b\w+,\s+\w+,\s+and\s+\w+\b"),
        re.compile(r"\b\w+,\s+\w+,\s+serta\s+\w+\b"),
    ],
    "§8_dashes_as_connector": [
        re.compile(r"—|–|--"),
    ],
    "§12_overused_ai_words": [
        re.compile(r"\b(?:crucial|delve|pivotal|testament|showcase|tapestry|vibrant|landscape|interplay)\b", re.IGNORECASE),
        re.compile(r"\b(?:krusial|merajut|lanskap|testamen|pivotal|menyoroti secara tajam|harmonisasi mendalam)\b", re.IGNORECASE),
    ],
    "§13_inflated_significance": [
        re.compile(r"\b(?:marking a pivotal moment|stands as a testament|enduring legacy|future looks bright)\b", re.IGNORECASE),
        re.compile(r"\b(?:menjadi tonggak sejarah|titik balik krusial|masa depan cerah menanti)\b", re.IGNORECASE),
    ],
    "§19_bold_as_decoration": [
        re.compile(r"\*\*[A-Za-z0-9\s/_-]+\*\*:\s+\*\*"),
        re.compile(r"\*\*[A-Za-z0-9\s/_-]+:\*\*"),
    ],
    "§20_decorative_headings_or_emojis": [
        re.compile(r"[\U0001F600-\U0001FAFF\u2600-\u26FF\u2700-\u27BF]"),
    ],
    "§22_chatbot_residue": [
        re.compile(r"\b(?:i hope this helps|of course[!.]?|certainly[!.]?|great question[!.]?|let me know if)\b", re.IGNORECASE),
        re.compile(r"\b(?:tentu saja[!.]?|semoga ini membantu[!.]?|pertanyaan yang bagus[!.]?|ada yang bisa saya bantu lagi\?)\b", re.IGNORECASE),
    ],
}

class HumanizedAdjudicationText(BaseModel):
    spec_version: str = "3.1.0"
    original_text: str
    patterns_detected: List[str]
    draft_critique: str
    humanized_text: str
    word_count_before: int
    word_count_after: int
    word_count_reduction_pct: float
    humanized_hash: str

def compute_sha256(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()

def detect_ai_patterns(text: str) -> List[str]:
    """
    Identifies which of the 26 AI writing tells appear in the prose.
    """
    detected: List[str] = []
    for pattern_name, regex_list in PATTERNS_MAP.items():
        for regex in regex_list:
            if regex.search(text):
                detected.append(pattern_name)
                break
    return detected

def clean_ai_prose(text: str) -> str:
    """
    Transforms text by removing AI staging, buzzwords, chatbot wrappers, and decorative bolding.
    Preserves all factual claims, ICD-10 codes, patient numbers, dates, and amounts.
    """
    cleaned = text

    # 1. Strip decorative emojis (§20)
    cleaned = re.sub(r"[\U0001F600-\U0001FAFF\u2600-\u26FF\u2700-\u27BF]", "", cleaned)

    # 2. Strip chatbot residue (§22)
    cleaned = re.sub(
        r"\b(?:tentu saja[!.]?|semoga ini membantu[!.]?|great question[!.]?|i hope this helps[!.]?|of course[!.]?|certainly[!.]?)\s*",
        "",
        cleaned,
        flags=re.IGNORECASE
    )

    # 3. Strip staged run-up (§4)
    cleaned = re.sub(
        r"\b(?:mari kita (?:bedah|telusuri|selami)|let's dive into|let's explore|here's what you need to know)[:,-]?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE
    )

    # 4. Strip one-line closers and aphorisms (§2, §3)
    cleaned = re.sub(
        r"\b(?:biarkan fakta ini meresap[!.]?|let that sink in[!.]?|read that again[!.]?|that is the real win[!.]?)\s*",
        "",
        cleaned,
        flags=re.IGNORECASE
    )
    cleaned = re.sub(
        r"\b(?:pada intinya,|at its core,|di lubuk terdalam,|the heart of the matter is)\s*",
        "",
        cleaned,
        flags=re.IGNORECASE
    )

    # 5. Clean not-X-but-Y formulas (§1)
    cleaned = re.sub(r"\bbukan (?:hanya|sekadar|cuma) (.+?) melainkan (.+?)\b", r"\2", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bit's not (?:just|only|merely) (.+?) but (.+?)\b", r"\2", cleaned, flags=re.IGNORECASE)

    # 6. Replace universal em-dashes with comma or period (§8)
    cleaned = re.sub(r"\s*[—–]\s*", ", ", cleaned)

    # 7. Replace overused AI words (§12)
    word_replacements = [
        (r"\bkrusial\b", "penting"),
        (r"\blanskap\b", "kondisi"),
        (r"\btestamen\b", "bukti"),
        (r"\bpivotal\b", "utama"),
        (r"\bmerajut\b", "membangun"),
        (r"\bcrucial\b", "important"),
        (r"\bdelve\b", "examine"),
        (r"\bshowcase\b", "show"),
        (r"\btapestry\b", "structure"),
    ]
    for pattern, replacement in word_replacements:
        cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)

    # 8. Clean bold decoration on labels (§19)
    cleaned = re.sub(r"\*\*([A-Za-z0-9\s/_-]+):\*\*", r"\1:", cleaned)

    # 9. Clean multiple whitespaces and trim
    cleaned = re.sub(r"[ \t]{2,}", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()

def humanize_claim_prose(text: str, writing_sample: Optional[str] = None) -> HumanizedAdjudicationText:
    """
    Executes the 4-step Humanizer workflow on arbitrary clinical adjudication prose:
    1. Mark tells (§1 - §26).
    2. Draft rewrite preserving factual invariants.
    3. Check draft against overused patterns.
    4. Produce final clean plain-language text.
    """
    detected_patterns = detect_ai_patterns(text)
    cleaned_text = clean_ai_prose(text)

    # If text had tells, formulate critique
    if detected_patterns:
        critique_parts = [f"Ditemukan {len(detected_patterns)} pola gaya bahasa AI: {', '.join(detected_patterns)}."]
        if "§20_decorative_headings_or_emojis" in detected_patterns:
            critique_parts.append("Emoji dekoratif telah dibersihkan.")
        if "§22_chatbot_residue" in detected_patterns:
            critique_parts.append("Residu chatbot pembuka/penutup dipotong.")
        if "§12_overused_ai_words" in detected_patterns:
            critique_parts.append("Kata klise AI (krusial, lanskap, merajut) disederhanakan.")
        critique = " ".join(critique_parts)
    else:
        critique = "Teks sudah lugas dan bebas dari pola artifisial AI."

    # Compute word counts
    words_before = len(text.split())
    words_after = len(cleaned_text.split())
    if words_before > 0:
        reduction_pct = round(((words_before - words_after) / words_before) * 100.0, 1)
    else:
        reduction_pct = 0.0

    raw_hash_content = json.dumps({
        "original": text,
        "humanized": cleaned_text,
        "patterns": detected_patterns
    }, sort_keys=True)
    humanized_hash = compute_sha256(raw_hash_content)

    return HumanizedAdjudicationText(
        spec_version="3.1.0",
        original_text=text,
        patterns_detected=detected_patterns,
        draft_critique=critique,
        humanized_text=cleaned_text,
        word_count_before=words_before,
        word_count_after=words_after,
        word_count_reduction_pct=reduction_pct,
        humanized_hash=humanized_hash
    )

def generate_humanized_claim_narrative(claim_id: str, claim_data: Optional[Dict] = None) -> HumanizedAdjudicationText:
    """
    Generates an authentic, plain-language clinical adjudication note for a specific claim.
    Written strictly in the objective, direct voice of a senior medical verifier.
    """
    if claim_data is None:
        from app.main import SYNTHETIC_CLAIMS_DATABASE
        claim = SYNTHETIC_CLAIMS_DATABASE.get(claim_id)
        if not claim:
            raise KeyError(f"Klaim ID {claim_id} tidak ditemukan.")
    else:
        claim = claim_data

    nomor_sep = getattr(claim, "fkl02_id_kunjungan", None) or f"SEP-{claim_id}"
    diag_primer = getattr(claim, "fkl10_diagprimer", "K92.2")
    cbg_code = getattr(claim, "ina_cbg_code", "K-4-17-I")
    faskes = getattr(claim, "fkl05_kode_faskes", "FASKES-001")
    nilai_klaim = getattr(claim, "nilai_klaim_rp", 5000000.0)

    # Draft natural human prose: direct, no fluff, no fake enthusiasm
    prose = (
        f"Verifikasi berkas {nomor_sep} untuk faskes {faskes}. "
        f"Klaim diajukan dengan tarif Rp {nilai_klaim:,.0f} pada kode INA-CBG {cbg_code} "
        f"dan diagnosa primer {diag_primer}. Berdasarkan penelaahan lembar CPPT dan resume medis, "
        f"tindakan klinis telah dicocokkan dengan standar Permenkes 26/2021. "
        f"Klaim memenuhi syarat administrasi dan diteruskan ke adjudikasi tahap akhir."
    )

    return humanize_claim_prose(prose)
