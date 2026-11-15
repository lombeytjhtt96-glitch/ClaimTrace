"""
Two-Tier Human Review & Adjudication Override Engine
====================================================
Kepatuhan Regulasi & Standar BPJS Kesehatan:
- Perpres No. 82 Tahun 2018 (Pasal 74 & 75 - Hak Uji & Verifikasi Klaim)
- Petunjuk Teknis Verifikasi Klaim BPJS Kesehatan (Alur Verifikasi 2 Lapis: Verifikator Medis & Dokter Penelaah)
- UU No. 27 Tahun 2022 (Audit Trail Akuntabilitas Pejabat Penelaah)

Sistem ini memastikan bahwa keputusan akhir penolakan atau pembayaran klaim TIDAK
sepenuhnya bergantung pada automasi sistem kecerdasan buatan, melainkan melalui
verifikasi berlapis dari pejabat manusia nyata (Human-in-the-Loop):
- Tier 1: Verifikator Pertama (Pemeriksaan Dokumen Medis & Kelayakan Administratif)
- Tier 2: Dokter Penelaah Klinis / Verifikator Lanjutan (Second Opinion & Hak Koreksi/Override)
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
import datetime
import hashlib
import json


@dataclass
class AdjudicationTier1Record:
    verifikator_name: str
    verifikator_nip: str
    review_timestamp: str
    preliminary_verdict: str  # SETUJUI_LAYAK, HOLD_KLARIFIKASI, DISPUTE_KODING, TOLAK_FRAUD
    clinical_notes: str
    documents_verified: List[str]
    is_completed: bool


@dataclass
class AdjudicationTier2Record:
    reviewer_name: str
    reviewer_nip: str
    review_timestamp: str
    final_human_verdict: str  # SETUJUI_LAYAK, HOLD_KLARIFIKASI, DISPUTE_KODING, TOLAK_FRAUD
    is_system_overridden: bool
    override_justification: Optional[str]
    regulatory_justification: Optional[str]
    second_opinion_notes: str
    digital_signature_hash: str
    is_signed_off: bool


@dataclass
class TwoTierAdjudicationDossier:
    claim_id: str
    initial_ai_recommendation: str
    ai_risk_score: float
    current_status: str  # MENUNGGU_TIER_1, MENUNGGU_PENELAAH_TIER_2, PUTUSAN_FINAL_DISAHKAN
    tier_1_record: Optional[AdjudicationTier1Record]
    tier_2_record: Optional[AdjudicationTier2Record]
    audit_chain_hash: str
    created_at: str
    updated_at: str


class HumanAdjudicationManager:
    """
    Pengelola Alur Verifikasi Lanjutan & Koreksi Manusia Nyata (Two-Tier Review).
    """

    def __init__(self):
        self._dossiers: Dict[str, TwoTierAdjudicationDossier] = {}
        self._seed_default_adjudications()

    def _seed_default_adjudications(self):
        """Menyemai data verifikasi berlapis default untuk klaim operasional."""
        now_iso = datetime.datetime.now().isoformat()

        # CLM-2026-8801: Case with Human Override example
        self._dossiers["CLM-2026-8801"] = TwoTierAdjudicationDossier(
            claim_id="CLM-2026-8801",
            initial_ai_recommendation="TOLAK_FRAUD (Indikasi Kritis Upcoding Severity III)",
            ai_risk_score=94.2,
            current_status="PUTUSAN_FINAL_DISAHKAN",
            tier_1_record=AdjudicationTier1Record(
                verifikator_name="dr. Siti Rahma, Sp.PK",
                verifikator_nip="19870420 201101 2 001",
                review_timestamp="2026-11-14T09:15:00",
                preliminary_verdict="DISPUTE_KODING",
                clinical_notes="Ditemukan ketidaksesuaian koding tingkat keparahan III pada kasus nyeri punggung. Rekomendasi koding diturunkan ke Severity I (Recoding).",
                documents_verified=["SEP", "RESUME_MEDIS", "BILLING_RS"],
                is_completed=True
            ),
            tier_2_record=AdjudicationTier2Record(
                reviewer_name="dr. H. Ahmad Fauzi, Sp.A (Dokter Penelaah Senior BPJS)",
                reviewer_nip="19780512 200312 1 002",
                review_timestamp="2026-11-14T10:00:00",
                final_human_verdict="DISPUTE_KODING (Disetujui dengan Penyesuaian Tarif Severity I)",
                is_system_overridden=True,
                override_justification="Hasil penelaahan dokter spesialis menyepakati bahwa tindakan rawat inap memang terjadi namun tidak memenuhi kriteria Severity III. Tidak langsung ditolak total (fraud), melainkan diselesaikan melalui mekanisme Dispute Koding Berita Acara (BAHV) sesuai Permenkes 26/2021.",
                regulatory_justification="Permenkes No. 26 Tahun 2021 Bab IV Kaidah Koding INA-CBG & Berita Acara Kesepakatan Bersama Tim Pencegahan Kecurangan.",
                second_opinion_notes="Disetujui untuk dibayarkan pada plafon tarif Severity Level I (Rp 3.200.000,-). Cost recovery sebesar Rp 8.450.000,- diamankan.",
                digital_signature_hash=hashlib.sha256(b"FAUZI_SIGNED_CLM-2026-8801").hexdigest(),
                is_signed_off=True
            ),
            audit_chain_hash=hashlib.sha256(b"AUDIT_CHAIN_CLM-2026-8801").hexdigest(),
            created_at=now_iso,
            updated_at=now_iso
        )

    def get_adjudication_dossier(self, claim_id: str) -> TwoTierAdjudicationDossier:
        """Mengambil atau menginisialisasi dossier verifikasi manusia untuk klaim."""
        if claim_id in self._dossiers:
            return self._dossiers[claim_id]

        now_iso = datetime.datetime.now().isoformat()
        new_dossier = TwoTierAdjudicationDossier(
            claim_id=claim_id,
            initial_ai_recommendation="EVALUASI_SISTEM (Menunggu Verifikasi Manusia)",
            ai_risk_score=75.0,
            current_status="MENUNGGU_TIER_1",
            tier_1_record=None,
            tier_2_record=None,
            audit_chain_hash=hashlib.sha256(f"INIT_{claim_id}_{now_iso}".encode("utf-8")).hexdigest(),
            created_at=now_iso,
            updated_at=now_iso
        )
        self._dossiers[claim_id] = new_dossier
        return new_dossier

    def submit_tier_1_review(
        self,
        claim_id: str,
        verifikator_name: str,
        verifikator_nip: str,
        verdict: str,
        clinical_notes: str,
        documents_verified: List[str]
    ) -> TwoTierAdjudicationDossier:
        """Menyimpan hasil telaah Verifikator Pertama (Tier 1)."""
        dossier = self.get_adjudication_dossier(claim_id)
        now_iso = datetime.datetime.now().isoformat()

        dossier.tier_1_record = AdjudicationTier1Record(
            verifikator_name=verifikator_name,
            verifikator_nip=verifikator_nip,
            review_timestamp=now_iso,
            preliminary_verdict=verdict,
            clinical_notes=clinical_notes,
            documents_verified=documents_verified,
            is_completed=True
        )
        dossier.current_status = "MENUNGGU_PENELAAH_TIER_2"
        dossier.updated_at = now_iso

        # Update audit chain
        data_to_hash = f"{claim_id}|{verdict}|{verifikator_nip}|{now_iso}"
        dossier.audit_chain_hash = hashlib.sha256(data_to_hash.encode("utf-8")).hexdigest()

        self._dossiers[claim_id] = dossier
        return dossier

    def submit_tier_2_override(
        self,
        claim_id: str,
        reviewer_name: str,
        reviewer_nip: str,
        final_verdict: str,
        is_overridden: bool,
        override_justification: Optional[str],
        regulatory_justification: Optional[str],
        second_opinion_notes: str
    ) -> TwoTierAdjudicationDossier:
        """
        Menyimpan putusan final Dokter Penelaah Klinis / Verifikator Lanjutan (Tier 2).
        Mendukung koreksi / override putusan sistem oleh manusia nyata.
        """
        dossier = self.get_adjudication_dossier(claim_id)
        now_iso = datetime.datetime.now().isoformat()

        sig_data = f"SIGN|{claim_id}|{reviewer_nip}|{final_verdict}|{now_iso}"
        sig_hash = hashlib.sha256(sig_data.encode("utf-8")).hexdigest()

        dossier.tier_2_record = AdjudicationTier2Record(
            reviewer_name=reviewer_name,
            reviewer_nip=reviewer_nip,
            review_timestamp=now_iso,
            final_human_verdict=final_verdict,
            is_system_overridden=is_overridden,
            override_justification=override_justification,
            regulatory_justification=regulatory_justification,
            second_opinion_notes=second_opinion_notes,
            digital_signature_hash=sig_hash,
            is_signed_off=True
        )
        dossier.current_status = "PUTUSAN_FINAL_DISAHKAN"
        dossier.updated_at = now_iso

        # Update audit chain hash with final sign-off
        chain_data = f"{dossier.audit_chain_hash}|{sig_hash}|{now_iso}"
        dossier.audit_chain_hash = hashlib.sha256(chain_data.encode("utf-8")).hexdigest()

        self._dossiers[claim_id] = dossier
        return dossier


# Global Singleton
human_adjudication_mgr = HumanAdjudicationManager()
