import pytest
from datetime import date
from app.models.schemas import (
    ClaimInput,
    EpisodeFingerprint,
    DPJPValidation,
    MobileJKNConfirmation,
)
from app.engine.scoring import evaluate_claim_triage
from app.data.synthetic_seed import get_initial_claims


def test_deterministic_fusion_formula():
    """Test that S = 0.5*S1 + 0.3*S2 + 0.2*S3 is computed deterministically."""
    claim = ClaimInput(
        claim_id="CLM-TEST-001",
        faskes_id="FSK-TEST",
        nama_faskes="RS Uji Formula",
        kelas_rs="B",
        peserta_token_aes="AES256_abcdef",
        tanggal_layanan=date(2026, 10, 15),
        ina_cbg_code="Z-0-00-0",
        deskripsi_cbg="Uji CBG",
        icd10_primary="R69",
        icd9cm_procedure="89.03",
        nilai_klaim_rp=5000000,
        s1_score=60.0,
        s2_score=40.0,
        s3_score=20.0,
        episode_meta=EpisodeFingerprint(
            cluster_id="CLS-TEST",
            jumlah_klaim_klaster=5,
            rasio_lonjakan_baseline=1.2,
            indikasi_repeat_billing=False,
            terdaftar_baksos_resmi=False,
        ),
        dpjp_meta=DPJPValidation(
            dpjp_id_hash="SDMK-DR-01",
            nama_dpjp_alias="dr. Uji",
            sip_status="ACTIVE",
            jam_praktik_valid=True,
            faskes_terdaftar="RS Uji Formula",
            catatan_sdmk="Aktif",
        ),
        mobile_meta=MobileJKNConfirmation(
            sampel_terkirim=5,
            respon_tidak_hadir=0,
            respon_hadir=5,
            status_konfirmasi="VERIFIED_ATTENDED",
        ),
    )

    triage = evaluate_claim_triage(claim)

    # 0.5 * 60 + 0.3 * 40 + 0.2 * 20 = 30 + 12 + 4 = 46.0
    assert triage.raw_weighted_score == 46.0
    assert triage.final_priority_score == 46.0
    assert triage.triage_lane == "HIJAU"
    assert triage.score_breakdown.s1_contribution == 30.0
    assert triage.score_breakdown.s2_contribution == 12.0
    assert triage.score_breakdown.s3_contribution == 4.0
    assert not triage.hard_trigger_activated


def test_hard_trigger_sip_expired():
    """Test that expired SIP automatically forces claim into RED lane and score >= 75."""
    claim = ClaimInput(
        claim_id="CLM-TEST-EXPIRED",
        faskes_id="FSK-TEST",
        nama_faskes="RS Uji Expired",
        kelas_rs="C",
        peserta_token_aes="AES256_123456",
        tanggal_layanan=date(2026, 10, 15),
        ina_cbg_code="Z-0-00-0",
        deskripsi_cbg="Uji CBG",
        icd10_primary="R69",
        icd9cm_procedure="89.03",
        nilai_klaim_rp=2000000,
        s1_score=20.0,
        s2_score=20.0,
        s3_score=10.0,
        episode_meta=EpisodeFingerprint(
            cluster_id="CLS-TEST-LOW",
            jumlah_klaim_klaster=2,
            rasio_lonjakan_baseline=1.0,
            indikasi_repeat_billing=False,
            terdaftar_baksos_resmi=False,
        ),
        dpjp_meta=DPJPValidation(
            dpjp_id_hash="SDMK-DR-EXPIRED",
            nama_dpjp_alias="dr. Expired",
            sip_status="EXPIRED",
            sip_expiry_date=date(2026, 9, 30),
            jam_praktik_valid=False,
            faskes_terdaftar="RS Uji Expired",
            catatan_sdmk="SIP Berakhir",
        ),
        mobile_meta=MobileJKNConfirmation(
            sampel_terkirim=5,
            respon_tidak_hadir=0,
            respon_hadir=5,
            status_konfirmasi="VERIFIED_ATTENDED",
        ),
    )

    triage = evaluate_claim_triage(claim)

    # Raw score: 0.5*20 + 0.3*20 + 0.2*10 = 10 + 6 + 2 = 18.0
    assert triage.raw_weighted_score == 18.0
    assert triage.hard_trigger_activated is True
    assert triage.final_priority_score >= 75.0
    assert triage.triage_lane == "MERAH"
    assert any("IND-L2-SIP-EXP" in ind for ind in triage.kode_indikator)


def test_administrative_uncertainty_unsynced_held_in_yellow():
    """Test that UNSYNCED SDMK holds claim in YELLOW lane and does not falsely classify as fraud."""
    claim = ClaimInput(
        claim_id="CLM-TEST-UNSYNCED",
        faskes_id="FSK-TEST",
        nama_faskes="RS Uji Unsynced",
        kelas_rs="C",
        peserta_token_aes="AES256_789abc",
        tanggal_layanan=date(2026, 10, 15),
        ina_cbg_code="Z-0-00-0",
        deskripsi_cbg="Uji CBG",
        icd10_primary="R69",
        icd9cm_procedure="89.03",
        nilai_klaim_rp=2000000,
        s1_score=20.0,
        s2_score=20.0,
        s3_score=10.0,
        episode_meta=EpisodeFingerprint(
            cluster_id="CLS-TEST-LOW",
            jumlah_klaim_klaster=2,
            rasio_lonjakan_baseline=1.0,
            indikasi_repeat_billing=False,
            terdaftar_baksos_resmi=False,
        ),
        dpjp_meta=DPJPValidation(
            dpjp_id_hash="SDMK-DR-SYNC",
            nama_dpjp_alias="dr. Sync Delay",
            sip_status="UNSYNCED",
            jam_praktik_valid=True,
            faskes_terdaftar="RS Uji Unsynced",
            catatan_sdmk="Dalam antrean sinkronisasi",
        ),
        mobile_meta=MobileJKNConfirmation(
            sampel_terkirim=5,
            respon_tidak_hadir=0,
            respon_hadir=5,
            status_konfirmasi="VERIFIED_ATTENDED",
        ),
    )

    triage = evaluate_claim_triage(claim)

    assert triage.raw_weighted_score == 18.0
    # Crucial anti-bias principle: Held at KUNING for clarification, NOT HIJAU and NOT MERAH!
    assert triage.triage_lane == "KUNING"
    assert not triage.hard_trigger_activated
    assert any("IND-L2-SDMK-SYNC" in ind for ind in triage.kode_indikator)


def test_repeat_billing_and_phantom_billing_seed_scenarios():
    """Test seeded cases CLM-2026-8801 and CLM-2026-8802."""
    fresh_claims = get_initial_claims()
    c1 = fresh_claims["CLM-2026-8801"]
    t1 = evaluate_claim_triage(c1)
    assert t1.triage_lane == "MERAH"
    assert t1.final_priority_score == 87.0
    assert t1.hard_trigger_activated is True

    c2 = fresh_claims["CLM-2026-8802"]
    t2 = evaluate_claim_triage(c2)
    assert t2.triage_lane == "KUNING"
    assert t2.final_priority_score == 62.0
    assert any("IND-L1-11" in ind for ind in t2.kode_indikator)


def test_baksos_exemption_and_chronic_therapy():
    """Test seeded cases CLM-2026-8803 (official baksos) and CLM-2026-8804 (chronic hemodialysis)."""
    fresh_claims = get_initial_claims()
    c3 = fresh_claims["CLM-2026-8803"]
    t3 = evaluate_claim_triage(c3)
    assert t3.triage_lane == "HIJAU"
    assert t3.final_priority_score == 20.0
    assert any("IND-L1-BAKSOS-RESMI" in ind for ind in t3.kode_indikator)

    c4 = fresh_claims["CLM-2026-8804"]
    t4 = evaluate_claim_triage(c4)
    assert t4.triage_lane == "HIJAU"
    assert t4.final_priority_score == 15.0
    assert any("IND-L1-TERAPI-KRONIS" in ind for ind in t4.kode_indikator)


def test_bpjs_data_sample_and_bea_c0304_mapping():
    """Test that all seeded claims contain standard BPJS Healthkathon 2026 data sample fields and valid BEA C03.04 mapping."""
    fresh_claims = get_initial_claims()
    for cid, claim in fresh_claims.items():
        assert claim.pstv01_peserta_id is not None
        assert claim.fkl02_id_kunjungan is not None
        assert claim.fkl03_tgl_masuk is not None
        assert claim.fkl04_tgl_pulang is not None
        assert claim.fkl07_kepemilikan is not None
        assert claim.fkl08_jenis_faskes is not None
        assert claim.fkl09_tipe_faskes is not None
        assert claim.fkl10_tingkat_layanan is not None
        assert claim.fkl11_segmen_peserta is not None
        assert claim.fkl17_kelas_rawat is not None
        assert claim.fkl30_kode_cbg is not None
        assert claim.fkl31_tarif_cbg is not None
        assert claim.fkl47_biaya_tagih is not None
        assert claim.fkl48_biaya_verifikasi is not None

        triage = evaluate_claim_triage(claim)
        assert triage.bea_process_code == "C03.04 (Klaim)"
        assert triage.bea_target_system in [
            "VIDI (Vedika Digital Fast-Track)",
            "VClaim Bridging RS (Klarifikasi Dokumen)",
            "SIGAP Anti-Fraud BPJS Kesehatan (Audit Khusus)"
        ]
        assert len(triage.bea_action_summary) > 10

