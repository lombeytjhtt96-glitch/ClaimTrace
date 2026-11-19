"""
ClaimTrace Neo4j Graph Integration Engine
Healthkathon BPJS Kesehatan 2026 • Tim Pengembang Nasional ClaimTrace • BPJS Kesehatan Tingkat Nasional

Transforms ClaimTrace multi-signal claims into a Neo4j Property Graph.
Supports automated Cypher script generation, schema indexing, and
forensic Cypher fraud queries (Modus #6 Phantom Billing, #11 Repeat Billing,
Impossible Travel Geodistance Collisions, and Severity Upcoding).
"""

from typing import Dict, List, Any
from app.models.schemas import ClaimInput


NEO4J_SCHEMA_CYPHER = """// ==============================================================
// CLAIMTRACE GRAPH SCHEMA CONSTRAINTS & INDEXES (NEO4J)
// Healthkathon BPJS Kesehatan 2026 - Tim TINEERENSE
// ==============================================================

CREATE CONSTRAINT unique_claim_id IF NOT EXISTS
FOR (c:Claim) REQUIRE c.claim_id IS UNIQUE;

CREATE CONSTRAINT unique_faskes_id IF NOT EXISTS
FOR (f:Faskes) REQUIRE f.faskes_id IS UNIQUE;

CREATE CONSTRAINT unique_dpjp_hash IF NOT EXISTS
FOR (d:DPJP) REQUIRE d.dpjp_id_hash IS UNIQUE;

CREATE CONSTRAINT unique_peserta_token IF NOT EXISTS
FOR (p:Peserta) REQUIRE p.peserta_token_aes IS UNIQUE;

CREATE CONSTRAINT unique_cluster_id IF NOT EXISTS
FOR (cl:EpisodeCluster) REQUIRE cl.cluster_id IS UNIQUE;

CREATE INDEX claim_lane_idx IF NOT EXISTS
FOR (c:Claim) ON (c.triage_lane);

CREATE INDEX claim_cbg_idx IF NOT EXISTS
FOR (c:Claim) ON (c.ina_cbg_code);
"""

FRAUD_DETECTION_CYPHER_QUERIES = [
    {
        "name": "Deteksi Modus #6: Phantom Billing (Klaster Baksos Fiktif)",
        "mitre_f3": "FA0002.001 (Phantom Billing Monetization)",
        "description": "Menemukan klaster klaim masal dengan rasio lonjakan >= 3.0x baseline yang tidak terdaftar izin resmi BPJS/Dinkes.",
        "cypher": """MATCH (f:Faskes)<-[:ASSIGNED_TO]-(d:DPJP)-[:PERFORMED]->(c:Claim)-[:BELONGS_TO]->(cl:EpisodeCluster)
WHERE cl.surge_ratio >= 3.0 AND cl.is_official_baksos = false
RETURN f.nama_faskes AS Faskes,
       d.nama_dpjp AS Dokter,
       d.sip_status AS Status_SIP,
       cl.cluster_id AS ID_Klaster,
       cl.surge_ratio AS Rasio_Lonjakan,
       count(c) AS Jumlah_Klaim,
       sum(c.nilai_klaim_rp) AS Total_Risiko_Rp
ORDER BY Total_Risiko_Rp DESC;"""
    },
    {
        "name": "Deteksi Modus #11: Repeat Billing (Penagihan Episode Berulang)",
        "mitre_f3": "FA0002.004 (Unbundling & Duplicate Episode Monetization)",
        "description": "Mendeteksi klaim berjalan yang menduplikasi episode medis yang telah dibayarkan (lunas) dalam selisih hari mencurigakan.",
        "cypher": """MATCH (c1:Claim)-[r:REPEAT_BILLING_OF]->(c2:Claim)
MATCH (c1)-[:BILLED_TO]->(p:Peserta)
RETURN c1.claim_id AS Klaim_Berjalan,
       c2.claim_id AS Klaim_Sebelumnya_Lunas,
       p.peserta_token_aes AS Peserta_Token,
       c1.ina_cbg_code AS Kode_CBG,
       c1.nilai_klaim_rp AS Tagihan_Duplikasi_Rp,
       c1.selisih_hari_admisi AS Selisih_Hari
ORDER BY c1.selisih_hari_admisi ASC;"""
    },
    {
        "name": "Deteksi Impossible Travel / Geodistance Collision",
        "mitre_f3": "FA0001.003 (Practitioner Staging & Teleportation Anomaly)",
        "description": "Mendeteksi dokter (DPJP) yang tercatat melakukan tindakan di faskes berbeda pada hari yang sama dengan jeda waktu mustahil secara fisik.",
        "cypher": """MATCH (d:DPJP)-[:PERFORMED]->(c:Claim)-[:SUBMITTED_BY]->(f1:Faskes)
MATCH (d)-[:SIMULTANEOUS_COLLISION_WITH]->(f2:Faskes)
RETURN d.nama_dpjp AS Dokter,
       d.sip_status AS Status_SIP,
       f1.nama_faskes AS Faskes_1,
       f2.nama_faskes AS Faskes_2,
       c.tanggal_layanan AS Tanggal,
       d.catatan_sdmk AS Bukti_Telemetri_SDMK;"""
    },
    {
        "name": "Deteksi Upcoding Tingkat Keparahan (Severity Level III Discrepancy)",
        "mitre_f3": "FA0002.002 (Upcoding Severity Monetization)",
        "description": "Menemukan klaim CBG tingkat keparahan tinggi (Severity III) tanpa dukungan data objektif LIS/PACS.",
        "cypher": """MATCH (c:Claim)-[:BELONGS_TO]->(cl:EpisodeCluster)
MATCH (c)-[:DIAGNOSTIC_DISCREPANCY]->(diag:ObjectiveDiagnostic)
WHERE c.ina_cbg_code ENDS WITH '-III' AND diag.has_objective_proof = false
RETURN c.claim_id AS ID_Klaim,
       c.ina_cbg_code AS CBG_Keparahan_III,
       c.nilai_klaim_rp AS Nilai_Tagihan_Rp,
       diag.status AS Catatan_Diskrepansi,
       c.triage_lane AS Jalur_Triase;"""
    },
    {
        "name": "Analisis Derajat Sentralitas Dokter Berisiko (Risk Hub)",
        "mitre_f3": "FA0001 (Practitioner Network Centrality)",
        "description": "Mengidentifikasi DPJP yang memiliki volume klaim anomali tertinggi di lintas fasilitas kesehatan.",
        "cypher": """MATCH (d:DPJP)-[:PERFORMED]->(c:Claim)
WHERE c.triage_lane = 'MERAH'
RETURN d.nama_dpjp AS Dokter,
       d.sip_status AS Status_SIP,
       count(c) AS Klaim_Merah,
       sum(c.nilai_klaim_rp) AS Total_Eksposur_Risiko_Rp
ORDER BY Total_Eksposur_Risiko_Rp DESC;"""
    }
]


def generate_cypher_seed_script(claims_db: Dict[str, ClaimInput]) -> str:
    """
    Generates a full standalone Cypher script to populate Neo4j with
    ClaimTrace claims, DPJPs, Faskes, Episode Clusters, and Patient nodes.
    """
    statements: List[str] = [
        "// ==============================================================",
        "// CLAIMTRACE GRAPH DATABASE SEED SCRIPT (CYPHER)",
        "// Healthkathon BPJS Kesehatan 2026 • Tim TINEERENSE",
        "// ==============================================================\n",
        NEO4J_SCHEMA_CYPHER,
        "\n// --- NODE & RELATIONSHIP INSERTION ---"
    ]

    for claim_id, claim in claims_db.items():
        clean_sdmk = claim.dpjp_meta.catatan_sdmk.replace("'", "\\'")
        clean_cbg = claim.deskripsi_cbg.replace("'", "\\'")

        # Faskes Node
        statements.append(
            f"MERGE (f:Faskes {{faskes_id: '{claim.faskes_id}'}}) "
            f"ON CREATE SET f.nama_faskes = '{claim.nama_faskes}', f.kelas_rs = '{claim.kelas_rs}';"
        )

        # DPJP Node
        statements.append(
            f"MERGE (d:DPJP {{dpjp_id_hash: '{claim.dpjp_meta.dpjp_id_hash}'}}) "
            f"ON CREATE SET d.nama_dpjp = '{claim.dpjp_meta.nama_dpjp_alias}', "
            f"d.sip_status = '{claim.dpjp_meta.sip_status}', "
            f"d.catatan_sdmk = '{clean_sdmk}';"
        )

        # Edge Faskes <- DPJP
        statements.append(
            f"MATCH (f:Faskes {{faskes_id: '{claim.faskes_id}'}}), "
            f"(d:DPJP {{dpjp_id_hash: '{claim.dpjp_meta.dpjp_id_hash}'}}) "
            f"MERGE (d)-[:ASSIGNED_TO]->(f);"
        )

        # Episode Cluster Node
        statements.append(
            f"MERGE (cl:EpisodeCluster {{cluster_id: '{claim.episode_meta.cluster_id}'}}) "
            f"ON CREATE SET cl.surge_ratio = {claim.episode_meta.rasio_lonjakan_baseline}, "
            f"cl.claim_count = {claim.episode_meta.jumlah_klaim_klaster}, "
            f"cl.is_official_baksos = {str(claim.episode_meta.terdaftar_baksos_resmi).lower()};"
        )

        # Peserta Node (Cryptographically Anonymized NIK Token - UU PDP 27/2022)
        statements.append(
            f"MERGE (p:Peserta {{peserta_token_aes: '{claim.peserta_token_aes}'}}) "
            f"ON CREATE SET p.status_konfirmasi = '{claim.mobile_meta.status_konfirmasi}';"
        )

        # Claim Node
        lane = "MERAH" if claim.s1_score * 0.5 + claim.s2_score * 0.3 + claim.s3_score * 0.2 >= 75 or claim.dpjp_meta.sip_status == "EXPIRED" else ("KUNING" if claim.s1_score * 0.5 + claim.s2_score * 0.3 + claim.s3_score * 0.2 >= 50 or claim.dpjp_meta.sip_status == "UNSYNCED" else "HIJAU")
        score = max(75.0, round(claim.s1_score * 0.5 + claim.s2_score * 0.3 + claim.s3_score * 0.2, 1)) if claim.dpjp_meta.sip_status == "EXPIRED" else round(claim.s1_score * 0.5 + claim.s2_score * 0.3 + claim.s3_score * 0.2, 1)

        statements.append(
            f"MERGE (c:Claim {{claim_id: '{claim.claim_id}'}}) "
            f"ON CREATE SET c.ina_cbg_code = '{claim.ina_cbg_code}', "
            f"c.deskripsi_cbg = '{clean_cbg}', "
            f"c.icd10_primary = '{claim.icd10_primary}', "
            f"c.icd9cm_procedure = '{claim.icd9cm_procedure}', "
            f"c.nilai_klaim_rp = {claim.nilai_klaim_rp}, "
            f"c.tanggal_layanan = date('{claim.tanggal_layanan.isoformat()}'), "
            f"c.s1_score = {claim.s1_score}, "
            f"c.s2_score = {claim.s2_score}, "
            f"c.s3_score = {claim.s3_score}, "
            f"c.priority_score = {score}, "
            f"c.triage_lane = '{lane}', "
            f"c.hard_trigger = {str(claim.dpjp_meta.sip_status == 'EXPIRED').lower()};"
        )

        # Relationships
        statements.append(
            f"MATCH (c:Claim {{claim_id: '{claim.claim_id}'}}), "
            f"(f:Faskes {{faskes_id: '{claim.faskes_id}'}}), "
            f"(d:DPJP {{dpjp_id_hash: '{claim.dpjp_meta.dpjp_id_hash}'}}), "
            f"(cl:EpisodeCluster {{cluster_id: '{claim.episode_meta.cluster_id}'}}), "
            f"(p:Peserta {{peserta_token_aes: '{claim.peserta_token_aes}'}}) "
            f"MERGE (c)-[:SUBMITTED_BY]->(f) "
            f"MERGE (d)-[:PERFORMED]->(c) "
            f"MERGE (c)-[:BELONGS_TO]->(cl) "
            f"MERGE (c)-[:BILLED_TO]->(p);"
        )

        # Modus #11 Repeat Billing Edge
        if claim.episode_meta.indikasi_repeat_billing:
            prev_id = "CLM-2026-8100"
            statements.append(
                f"MERGE (c_prev:Claim {{claim_id: '{prev_id}'}}) "
                f"ON CREATE SET c_prev.status = 'SUDAH_DIBAYAR_LUNAS', "
                f"c_prev.nilai_klaim_rp = 1950000, c_prev.ina_cbg_code = '{claim.ina_cbg_code}';\n"
                f"MATCH (c1:Claim {{claim_id: '{claim.claim_id}'}}), (c2:Claim {{claim_id: '{prev_id}'}}) "
                f"MERGE (c1)-[:REPEAT_BILLING_OF {{selisih_hari: {claim.episode_meta.selisih_hari_admisi or 3}}}]->(c2);"
            )

        # Geodistance Collision Edge
        if claim.episode_meta.cluster_id == "CLS-GEODIST-COLLISION":
            sec_faskes = "FSK-RS-SEMARANG"
            statements.append(
                f"MERGE (f_sec:Faskes {{faskes_id: '{sec_faskes}'}}) "
                f"ON CREATE SET f_sec.nama_faskes = 'RS Pusat Pelayanan Semarang (Kelas A)', f_sec.kelas_rs = 'A';\n"
                f"MATCH (d:DPJP {{dpjp_id_hash: '{claim.dpjp_meta.dpjp_id_hash}'}}), (f_sec:Faskes {{faskes_id: '{sec_faskes}'}}) "
                f"MERGE (d)-[:SIMULTANEOUS_COLLISION_WITH {{jarak_km: 105, selisih_menit: 45}}]->(f_sec);"
            )

        # Upcoding Discrepancy Node & Edge
        if claim.episode_meta.cluster_id == "CLS-UPCODING-SEVERITY":
            statements.append(
                f"MERGE (diag:ObjectiveDiagnostic {{id: 'LIS-PACS-NO-PROOF-{claim.claim_id}'}}) "
                f"ON CREATE SET diag.has_objective_proof = false, "
                f"diag.status = 'K29.0 Gastritis Ringan tanpa bukti endoskopi atau transfusi darah di LIS/PACS';\n"
                f"MATCH (c:Claim {{claim_id: '{claim.claim_id}'}}), (diag:ObjectiveDiagnostic {{id: 'LIS-PACS-NO-PROOF-{claim.claim_id}'}}) "
                f"MERGE (c)-[:DIAGNOSTIC_DISCREPANCY]->(diag);"
            )

    return "\n".join(statements)
