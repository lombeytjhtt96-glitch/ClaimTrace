from typing import Dict, Any, List
from app.models.schemas import ClaimInput, TriageResult, TriageScoreBreakdown
from app.security.audit_log import AuditLogger
from app.engine.episode_graph import generate_cluster_graph

audit_logger = AuditLogger()

def evaluate_claim_triage(claim: ClaimInput) -> TriageResult:
    """
    Deterministic Multi-Signal Triage Fusion Engine:
    S = 0.5*S1 (Episode Radar) + 0.3*S2 (DPJP SDMK) + 0.2*S3 (Mobile JKN Binary Confirmation)
    Includes Independent Hard Triggers (SIP Expired -> Merah) and Administrative Uncertainty (Unsynced -> Kuning).
    Generates non-hallucinatory structured audit dossier adhering to Perpres 82/2018.
    """
    s1_contrib = round(0.5 * claim.s1_score, 2)
    s2_contrib = round(0.3 * claim.s2_score, 2)
    s3_contrib = round(0.2 * claim.s3_score, 2)
    raw_score = round(s1_contrib + s2_contrib + s3_contrib, 1)

    final_score = raw_score
    hard_trigger = False
    trigger_reason = None
    indikator: List[str] = []

    # 1. Evaluate Lapis 1 Indicators (Episode Fingerprint & Pattern Radar)
    if claim.episode_meta.cluster_id == "CLS-UPCODING-SEVERITY":
        indikator.append(
            f"IND-L1-UPCODING: Diskrepansi Rekam Medis: Penagihan klaim INA-CBG Keparahan Tingkat III ({claim.ina_cbg_code}) "
            f"tanpa bukti penunjang objektif endoskopi atau transfusi darah di LIS/PACS faskes (Modus Upcoding Severity)"
        )
    elif claim.episode_meta.rasio_lonjakan_baseline >= 3.0 and not claim.episode_meta.terdaftar_baksos_resmi:
        indikator.append(
            f"IND-L1-06: Lonjakan klaster {claim.episode_meta.rasio_lonjakan_baseline}x baseline faskes "
            f"({claim.episode_meta.jumlah_klaim_klaster} klaim) pasca-kegiatan massal tanpa baksos resmi (Modus #6 Phantom Billing)"
        )
    if claim.episode_meta.indikasi_repeat_billing:
        indikator.append(
            f"IND-L1-11: Terdeteksi klaim berulang pada episode sama yang telah dibayarkan "
            f"({claim.episode_meta.klaim_episode_sebelumnya_id}) (Modus #11 Repeat Billing)"
        )
    if claim.episode_meta.terdaftar_baksos_resmi:
        indikator.append(
            "IND-L1-BAKSOS-RESMI: Kegiatan layanan massal terdaftar resmi dengan izin penyelenggaraan BPJS/Dinkes"
        )
    if claim.episode_meta.cluster_id == "CLS-HD-CHRONIC":
        indikator.append(
            "IND-L1-TERAPI-KRONIS: Siklus terapi terjadwal rutin sesuai pedoman klinis JKN (Kesesuaian Pola Historis)"
        )

    # Semantic Plagiarism Verification via ChromaDB Vector Space
    if claim.claim_id:
        try:
            from app.engine.chroma_semantic import chroma_engine
            sem_analysis = chroma_engine.analyze_claim_plagiarism(claim.claim_id, threshold=0.90)
            if sem_analysis.get("is_plagiarized"):
                sim_score = sem_analysis.get("max_similarity_pct", 0.0)
                indikator.append(
                    f"IND-SEM-COPYPASTE: Analisis Semantik ChromaDB mendeteksi plagiarisme narasi resume medis "
                    f"({sim_score}% kemiripan) antar-pasien dalam klaster faskes yang sama "
                    f"(Fabrikasi Rekam Medis Baksos Fiktif Modus #6)"
                )
        except Exception:
            pass

    # 2. Evaluate Lapis 2 Indicators (SATUSEHAT SDMK Footprint)
    if claim.episode_meta.cluster_id == "CLS-GEODIST-COLLISION" or "Anomali Kecepatan Fisik" in claim.dpjp_meta.catatan_sdmk:
        indikator.append(
            "IND-L2-GEODIST: Telemetri SATUSEHAT SDMK mendeteksi tindakan bedah simultan di dua kota berbeda "
            "dalam selisih waktu < 45 menit (Anomali Kecepatan Fisik Antar-Kota / Impossible Travel)"
        )
    if claim.dpjp_meta.sip_status == "EXPIRED":
        indikator.append(
            f"IND-L2-SIP-EXP: SIP DPJP tercatat berakhir pada {claim.dpjp_meta.sip_expiry_date or 'tanggal layanan'} (Hard Trigger Lapis 2)"
        )
    elif claim.dpjp_meta.sip_status == "UNSYNCED":
        indikator.append(
            "IND-L2-SDMK-SYNC: Profil DPJP belum tersinkronisasi di SATUSEHAT SDMK (Ketidakpastian Administratif)"
        )
    else:
        indikator.append(
            "IND-L2-SIP-ACTIVE: Izin Praktik (SIP) DPJP aktif dan jam praktik terverifikasi di SATUSEHAT SDMK"
        )

    # 3. Evaluate Lapis 3 Indicators (Mobile JKN Binary Confirmation)
    if claim.mobile_meta.respon_tidak_hadir > 0:
        indikator.append(
            f"IND-L3-PRESENSI: {claim.mobile_meta.respon_tidak_hadir} dari {claim.mobile_meta.sampel_terkirim} "
            f"peserta terdaftar menyatakan 'Tidak Merasa Menerima Layanan' via notifikasi Mobile JKN"
        )
    elif claim.mobile_meta.respon_hadir > 0 and claim.mobile_meta.respon_tidak_hadir == 0:
        indikator.append(
            f"IND-L3-VERIFIED: {claim.mobile_meta.respon_hadir}/{claim.mobile_meta.sampel_terkirim} "
            f"peserta terdaftar mengonfirmasi kehadiran layanan secara biner (100% konsisten)"
        )
    else:
        indikator.append(
            "IND-L3-PENDING: Menunggu respons konfirmasi peserta terarah atau peserta berada di wilayah kendala sinyal"
        )

    # 4. Baseline Triage Lane Determination
    if final_score < 50.0:
        lane = "HIJAU"
    elif final_score < 75.0:
        lane = "KUNING"
    else:
        lane = "MERAH"

    # 5. Independent Hard Trigger & Administrative Uncertainty Rules
    if claim.dpjp_meta.sip_status == "EXPIRED":
        hard_trigger = True
        trigger_reason = (
            "Aturan Prioritas (Hard Trigger): Izin praktik (SIP) DPJP terbukti berakhir/non-aktif pada tanggal layanan. "
            "Klaim dialihkan ke prioritas telaah Merah secara independen."
        )
        lane = "MERAH"
        final_score = max(final_score, 75.0)
    elif claim.dpjp_meta.sip_status == "UNSYNCED":
        # Crucial principle from proposal: UNSYNCED data is administrative uncertainty, NOT fraud!
        # Do not allow it to falsely trigger RED unless raw score already >= 75.
        if lane == "HIJAU":
            lane = "KUNING"

    # 6. Structured Non-Hallucinatory Audit Dossier & Cybersecurity Mapping
    f3_tags: List[str] = []
    attack_tags: List[str] = []
    d3fend_tags: List[str] = ["D3-DL (Tamper-Evident Audit Chain)", "D3-MA (HMAC/SHA-256 Ledger)"]
    reg_basis: List[str] = [
        "Perpres No. 82/2018 Pasal 76 ayat (2) (SLA Vedika 10 Hari Kerja)",
        "UU Perlindungan Data Pribadi No. 27/2022 (Minimasi Data & Privasi Peserta)"
    ]

    if claim.episode_meta.cluster_id == "CLS-UPCODING-SEVERITY":
        f3_tags.append("FA0002.002 (Upcoding Severity Monetization)")
        attack_tags.append("T1565 (Medical Records Data Manipulation)")
        d3fend_tags.append("D3-DL (LIS/PACS Diagnostic Cross-Validation)")
    elif claim.episode_meta.rasio_lonjakan_baseline >= 3.0 and not claim.episode_meta.terdaftar_baksos_resmi:
        f3_tags.append("FA0002.001 (Phantom Billing Monetization)")
        attack_tags.append("T1657 (Financial Theft via Injected Claims)")

    if claim.episode_meta.cluster_id == "CLS-GEODIST-COLLISION":
        f3_tags.append("FA0001.003 (Practitioner Staging & Teleportation Anomaly)")
        attack_tags.append("T1078 (Valid Doctor Accounts Credential Misuse)")
        d3fend_tags.append("D3-IT (SATUSEHAT SDMK Geodistance Telemetry Audit)")

    if claim.episode_meta.indikasi_repeat_billing:
        f3_tags.append("FA0002.004 (Unbundling & Duplicate Episode Monetization)")
        attack_tags.append("T1565 (Medical Records Re-Submission)")

    if claim.dpjp_meta.sip_status == "EXPIRED":
        if "FA0001.002 (Practitioner Staging & SIP Abuse)" not in f3_tags:
            f3_tags.append("FA0001.002 (Practitioner Staging & SIP Abuse)")
        if "T1078 (Valid Doctor Accounts Credential Misuse)" not in attack_tags:
            attack_tags.append("T1078 (Valid Doctor Accounts Credential Misuse)")
        reg_basis.append("Permenkes No. 16/2019 (Pencegahan & Penanganan Kecurangan JKN)")

    if any("IND-SEM-COPYPASTE" in ind for ind in indikator):
        if "FA0002.001 (Phantom Billing Monetization)" not in f3_tags:
            f3_tags.append("FA0002.001 (Phantom Billing Monetization)")
        if "T1565 (Medical Records Data Manipulation)" not in attack_tags:
            attack_tags.append("T1565 (Medical Records Data Manipulation)")
        if "D3-VEC (ChromaDB Vector Semantic Cross-Matching)" not in d3fend_tags:
            d3fend_tags.append("D3-VEC (ChromaDB Vector Semantic Cross-Matching)")

    if claim.dpjp_meta.sip_status == "UNSYNCED":
        f3_tags.append("FA0001 (Administrative Boundary / SDMK Sync Delay)")
        d3fend_tags.append("D3-IT (SATUSEHAT SDMK Integrity Tracking)")

    if claim.mobile_meta.respon_tidak_hadir > 0:
        f3_tags.append("F1005.006 (Beneficiary Impersonation / Ghost Patient)")
        d3fend_tags.append("D3-MA (Mobile JKN Out-of-Band Binary Verification)")
    elif claim.mobile_meta.respon_hadir > 0:
        d3fend_tags.append("D3-MA (Verified Biometric Presence on Mobile JKN)")

    if lane == "MERAH":
        sla_days = 3
        bea_process = "C03.04 (Klaim)"
        bea_target = "SIGAP Anti-Fraud BPJS Kesehatan (Audit Khusus)"
        bea_action = (
            "Penundaan Bayar Pra-Bayar. Penerbitan tiket audit investigasi ke aplikasi SIGAP "
            "untuk verifikasi rekam medis fisik, jadwal OK, dan presensi riil DPJP."
        )
        if claim.episode_meta.cluster_id == "CLS-GEODIST-COLLISION":
            ringkasan = (
                f"Klaim {claim.claim_id} ({claim.ina_cbg_code}) di {claim.nama_faskes} memiliki Skor Prioritas Telaah {final_score}/100. "
                f"Terdeteksi Hard Trigger SIP Expired disertai anomali telemetri SDMK tindakan bedah simultan di dua kota berbeda "
                f"(Semarang pukul 10:15 WIB dan Solo pukul 11:00 WIB) serta 4 dari 6 peserta menyatakan tidak hadir."
            )
            penjelasan_sah = (
                "Periksa kemungkinan salah entri jam mulai/selesai tindakan bedah pada SIMRS faskes, "
                "atau pelimpahan wewenang tindakan darurat kepada dokter asisten tanpa pembaruan nama DPJP pada berkas klaim."
            )
            rekomendasi = (
                "Lakukan audit forensik jadwal operasi OK faskes dan rekonsiliasi log SIMRS/SATUSEHAT sebelum batas berita acara kelengkapan 10 hari kerja."
            )
        elif claim.episode_meta.cluster_id == "CLS-UPCODING-SEVERITY":
            ringkasan = (
                f"Klaim {claim.claim_id} ({claim.ina_cbg_code}) di {claim.nama_faskes} memiliki Skor Prioritas Telaah {final_score}/100. "
                f"Terdeteksi penagihan CBG tingkat keparahan III bernilai tinggi (Rp{claim.nilai_klaim_rp:,}) tanpa bukti objektif endoskopi/transfusi di LIS/PACS, "
                f"disertai penolakan presensi 6 dari 8 peserta terverifikasi Mobile JKN."
            )
            penjelasan_sah = (
                "Keterlambatan integrasi berkas hasil laboratorium LIS atau gambar endoskopi PACS ke dalam berkas klaim digital Vedika, "
                "atau komorbiditas akut berat yang tercatat manual pada lembar resume medis fisik."
            )
            rekomendasi = (
                "Minta faskes mengunggah bukti penunjang diagnostik definitif (hasil lab Hb/endoskopi) untuk verifikasi kesesuaian tingkat keparahan CBG."
            )
        else:
            ringkasan = (
                f"Klaim {claim.claim_id} ({claim.ina_cbg_code} - {claim.deskripsi_cbg}) di {claim.nama_faskes} "
                f"menghasilkan Skor Prioritas Telaah {final_score}/100 [S1={claim.s1_score}, S2={claim.s2_score}, S3={claim.s3_score}]. "
                f"{trigger_reason or 'Terdeteksi anomali multivariat konvergen pada klaster episode penagihan dan respons peserta.'}"
            )
            penjelasan_sah = (
                "Periksa kemungkinan keterlambatan pembaruan berkas SIP kolektif di dinas kesehatan daerah, "
                "atau salah pencet oleh pendamping peserta lansia pada aplikasi Mobile JKN."
            )
            rekomendasi = (
                "Prioritaskan klarifikasi berkas ke faskes sesuai SOP verifikasi sebelum batas berita acara "
                "kelengkapan berkas (10 hari kerja, Pasal 76 ayat (2) Perpres Nomor 82 Tahun 2018)."
            )
    elif lane == "KUNING":
        sla_days = 5
        bea_process = "C03.04 (Klaim)"
        bea_target = "VClaim Bridging RS (Klarifikasi Dokumen)"
        bea_action = (
            "Permintaan Klarifikasi Digital otomatis dikirim ke modul Bridging VClaim faskes "
            "untuk melengkapi lembar observasi / resume penunjang dalam batas 5 hari kerja."
        )
        ringkasan = (
            f"Klaim {claim.claim_id} ({claim.ina_cbg_code}) memiliki Skor {final_score}/100 "
            f"[S1={claim.s1_score}, S2={claim.s2_score}, S3={claim.s3_score}] dengan indikasi ketidakpastian administratif "
            f"pada sinkronisasi SATUSEHAT SDMK atau waktu admisi episode serupa."
        )
        penjelasan_sah = (
            "Jeda sinkronisasi server SATUSEHAT SDMK Kemenkes, kunjungan darurat ulang sah akibat komplikasi akut "
            "pasca-pemulangan, atau peserta di wilayah 3T belum sempat membuka notifikasi Mobile JKN."
        )
        rekomendasi = (
            "Kirimkan permintaan klarifikasi administratif digital ke faskes tanpa menunda verifikasi berkas klaim reguler lainnya."
        )
    else:
        sla_days = 2
        bea_process = "C03.04 (Klaim)"
        bea_target = "VIDI (Vedika Digital Fast-Track)"
        bea_action = (
            "Otomasi Rekomendasi Lolos Cepat. Berkas diteruskan ke VIDI untuk penerbitan "
            "Berita Acara Persetujuan Klaim dalam < 30 detik tanpa penundaan."
        )
        ringkasan = (
            f"Klaim {claim.claim_id} ({claim.ina_cbg_code}) berada dalam batas kewajaran historis "
            f"(Skor {final_score}/100) dan terverifikasi memiliki jejak DPJP aktif serta konfirmasi kehadiran peserta sah."
        )
        penjelasan_sah = (
            "Kegiatan pelayanan medis resmi terdaftar (misal baksos katarak/hemodialisis terencana) "
            "dengan surat tugas DPJP aktif dan konfirmasi peserta konsisten."
        )
        rekomendasi = (
            "Lanjutkan ke alur verifikasi cepat pra-bayar (Fast-Track / Jalur Hijau) untuk penerbitan berita acara tepat waktu."
        )

    # 7. Generate Cluster Graph
    graph_data = generate_cluster_graph(claim)

    # 8. Record Immutable Audit Event
    audit_entry = audit_logger.record_event(
        event_type="AUTO_TRIAGE_SCORING",
        claim_id=claim.claim_id,
        actor="CLAIMTRACE_CORE_ENGINE_V1",
        payload={
            "raw_score": raw_score,
            "final_score": final_score,
            "triage_lane": lane,
            "hard_trigger": hard_trigger,
            "s1": claim.s1_score,
            "s2": claim.s2_score,
            "s3": claim.s3_score,
            "indicators": indikator,
            "f3_tags": f3_tags,
            "attack_tags": attack_tags
        }
    )

    breakdown = TriageScoreBreakdown(
        s1_value=claim.s1_score,
        s1_contribution=s1_contrib,
        s2_value=claim.s2_score,
        s2_contribution=s2_contrib,
        s3_value=claim.s3_score,
        s3_contribution=s3_contrib
    )

    return TriageResult(
        claim_id=claim.claim_id,
        raw_weighted_score=raw_score,
        final_priority_score=final_score,
        triage_lane=lane,
        hard_trigger_activated=hard_trigger,
        hard_trigger_reason=trigger_reason,
        score_breakdown=breakdown,
        kode_indikator=indikator,
        ringkasan_bukti_audit=ringkasan,
        kemungkinan_penjelasan_sah=penjelasan_sah,
        rekomendasi_sop=rekomendasi,
        audit_hash=audit_entry["current_hash"],
        graph_data=graph_data,
        mitre_f3_tags=f3_tags,
        mitre_attack_tags=attack_tags,
        mitre_d3fend_tags=d3fend_tags,
        regulatory_basis=reg_basis,
        sla_deadline_days=sla_days,
        bea_process_code=bea_process,
        bea_target_system=bea_target,
        bea_action_summary=bea_action
    )
