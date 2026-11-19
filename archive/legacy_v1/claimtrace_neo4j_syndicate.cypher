// ==============================================================
// CLAIMTRACE GRAPH DATABASE SEED SCRIPT (CYPHER)
// Healthkathon BPJS Kesehatan 2026 • Tim TINEERENSE
// ==============================================================

// ==============================================================
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


// --- NODE & RELATIONSHIP INSERTION ---
MERGE (f:Faskes {faskes_id: 'FSK-RSX-01'}) ON CREATE SET f.nama_faskes = 'RS Khusus Mitra Husada', f.kelas_rs = 'B';
MERGE (d:DPJP {dpjp_id_hash: 'SDMK-DR-7712'}) ON CREATE SET d.nama_dpjp = 'dr. Hendra, Sp.KFR', d.sip_status = 'EXPIRED', d.catatan_sdmk = 'SIP di RS Mitra Husada tercatat berakhir pada 10 Okt 2026 (Hard Trigger Aktif)';
MATCH (f:Faskes {faskes_id: 'FSK-RSX-01'}), (d:DPJP {dpjp_id_hash: 'SDMK-DR-7712'}) MERGE (d)-[:ASSIGNED_TO]->(f);
MERGE (cl:EpisodeCluster {cluster_id: 'CLS-PHANTOM-85'}) ON CREATE SET cl.surge_ratio = 8.5, cl.claim_count = 85, cl.is_official_baksos = false;
MERGE (p:Peserta {peserta_token_aes: 'AES256_9f8a7b6c5d4e'}) ON CREATE SET p.status_konfirmasi = 'ANOMALY_DENIED';
MERGE (c:Claim {claim_id: 'CLM-2026-8801'}) ON CREATE SET c.ina_cbg_code = 'Z-3-12-0', c.deskripsi_cbg = 'Prosedur Rehabilitasi / Fisioterapi (Permenkes 3/2023)', c.icd10_primary = 'M54.5 (Low Back Pain)', c.icd9cm_procedure = '93.39 (Other Physical Therapy)', c.nilai_klaim_rp = 15300000, c.tanggal_layanan = date('2026-10-14'), c.s1_score = 85.0, c.s2_score = 95.0, c.s3_score = 80.0, c.priority_score = 87.0, c.triage_lane = 'MERAH', c.hard_trigger = true;
MATCH (c:Claim {claim_id: 'CLM-2026-8801'}), (f:Faskes {faskes_id: 'FSK-RSX-01'}), (d:DPJP {dpjp_id_hash: 'SDMK-DR-7712'}), (cl:EpisodeCluster {cluster_id: 'CLS-PHANTOM-85'}), (p:Peserta {peserta_token_aes: 'AES256_9f8a7b6c5d4e'}) MERGE (c)-[:SUBMITTED_BY]->(f) MERGE (d)-[:PERFORMED]->(c) MERGE (c)-[:BELONGS_TO]->(cl) MERGE (c)-[:BILLED_TO]->(p);
MERGE (f:Faskes {faskes_id: 'FSK-RSY-02'}) ON CREATE SET f.nama_faskes = 'RS Swasta As-Syifa (Kelas C)', f.kelas_rs = 'C';
MERGE (d:DPJP {dpjp_id_hash: 'SDMK-DR-3391'}) ON CREATE SET d.nama_dpjp = 'dr. Hendra Prasetya, Sp.PD', d.sip_status = 'UNSYNCED', d.catatan_sdmk = 'Pembaruan SIP sedang dalam antrean sinkronisasi SATUSEHAT SDMK (Ketidakpastian Administratif)';
MATCH (f:Faskes {faskes_id: 'FSK-RSY-02'}), (d:DPJP {dpjp_id_hash: 'SDMK-DR-3391'}) MERGE (d)-[:ASSIGNED_TO]->(f);
MERGE (cl:EpisodeCluster {cluster_id: 'CLS-REPEAT-11'}) ON CREATE SET cl.surge_ratio = 1.4, cl.claim_count = 2, cl.is_official_baksos = false;
MERGE (p:Peserta {peserta_token_aes: 'AES256_1a2b3c4d5e6f'}) ON CREATE SET p.status_konfirmasi = 'PENDING_UNCONFIRMED';
MERGE (c:Claim {claim_id: 'CLM-2026-8802'}) ON CREATE SET c.ina_cbg_code = 'K-4-17-I', c.deskripsi_cbg = 'Nyeri Abdomen & Gastroenteritis Ringan', c.icd10_primary = 'K29.7 (Gastritis, unspecified)', c.icd9cm_procedure = '89.03 (Interview and evaluation)', c.nilai_klaim_rp = 1950000, c.tanggal_layanan = date('2026-10-15'), c.s1_score = 76.0, c.s2_score = 50.0, c.s3_score = 45.0, c.priority_score = 62.0, c.triage_lane = 'KUNING', c.hard_trigger = false;
MATCH (c:Claim {claim_id: 'CLM-2026-8802'}), (f:Faskes {faskes_id: 'FSK-RSY-02'}), (d:DPJP {dpjp_id_hash: 'SDMK-DR-3391'}), (cl:EpisodeCluster {cluster_id: 'CLS-REPEAT-11'}), (p:Peserta {peserta_token_aes: 'AES256_1a2b3c4d5e6f'}) MERGE (c)-[:SUBMITTED_BY]->(f) MERGE (d)-[:PERFORMED]->(c) MERGE (c)-[:BELONGS_TO]->(cl) MERGE (c)-[:BILLED_TO]->(p);
MERGE (c_prev:Claim {claim_id: 'CLM-2026-8100'}) ON CREATE SET c_prev.status = 'SUDAH_DIBAYAR_LUNAS', c_prev.nilai_klaim_rp = 1950000, c_prev.ina_cbg_code = 'K-4-17-I';
MATCH (c1:Claim {claim_id: 'CLM-2026-8802'}), (c2:Claim {claim_id: 'CLM-2026-8100'}) MERGE (c1)-[:REPEAT_BILLING_OF {selisih_hari: 3}]->(c2);
MERGE (f:Faskes {faskes_id: 'FSK-RSZ-03'}) ON CREATE SET f.nama_faskes = 'RS Khusus Mata Nusantara (Kelas B)', f.kelas_rs = 'B';
MERGE (d:DPJP {dpjp_id_hash: 'SDMK-DR-1102'}) ON CREATE SET d.nama_dpjp = 'dr. Linda Kusuma, Sp.M', d.sip_status = 'ACTIVE', d.catatan_sdmk = 'SIP Aktif & Surat Penugasan Baksos Katarak Terverifikasi Resmi';
MATCH (f:Faskes {faskes_id: 'FSK-RSZ-03'}), (d:DPJP {dpjp_id_hash: 'SDMK-DR-1102'}) MERGE (d)-[:ASSIGNED_TO]->(f);
MERGE (cl:EpisodeCluster {cluster_id: 'CLS-LEGAL-KATARAK'}) ON CREATE SET cl.surge_ratio = 5.0, cl.claim_count = 60, cl.is_official_baksos = true;
MERGE (p:Peserta {peserta_token_aes: 'AES256_7c8d9e0f1a2b'}) ON CREATE SET p.status_konfirmasi = 'VERIFIED_ATTENDED';
MERGE (c:Claim {claim_id: 'CLM-2026-8803'}) ON CREATE SET c.ina_cbg_code = 'H-2-36-0', c.deskripsi_cbg = 'Prosedur Operasi Katarak (Baksos Terdaftar Resmi)', c.icd10_primary = 'H25.9 (Senile cataract, unspecified)', c.icd9cm_procedure = '13.41 (Phacoemulsification of cataract)', c.nilai_klaim_rp = 4200000, c.tanggal_layanan = date('2026-10-16'), c.s1_score = 30.0, c.s2_score = 10.0, c.s3_score = 10.0, c.priority_score = 20.0, c.triage_lane = 'HIJAU', c.hard_trigger = false;
MATCH (c:Claim {claim_id: 'CLM-2026-8803'}), (f:Faskes {faskes_id: 'FSK-RSZ-03'}), (d:DPJP {dpjp_id_hash: 'SDMK-DR-1102'}), (cl:EpisodeCluster {cluster_id: 'CLS-LEGAL-KATARAK'}), (p:Peserta {peserta_token_aes: 'AES256_7c8d9e0f1a2b'}) MERGE (c)-[:SUBMITTED_BY]->(f) MERGE (d)-[:PERFORMED]->(c) MERGE (c)-[:BELONGS_TO]->(cl) MERGE (c)-[:BILLED_TO]->(p);
MERGE (f:Faskes {faskes_id: 'FSK-KLN-04'}) ON CREATE SET f.nama_faskes = 'Klinik Pratama Hemodialisis Sehat Mandiri', f.kelas_rs = 'Klinik';
MERGE (d:DPJP {dpjp_id_hash: 'SDMK-DR-9921'}) ON CREATE SET d.nama_dpjp = 'dr. Rahmat Hidayat, Sp.PD-KGH', d.sip_status = 'ACTIVE', d.catatan_sdmk = 'SIP Aktif & Rekam Siklus Hemodialisis Reguler Sesuai Pedoman Klinis';
MATCH (f:Faskes {faskes_id: 'FSK-KLN-04'}), (d:DPJP {dpjp_id_hash: 'SDMK-DR-9921'}) MERGE (d)-[:ASSIGNED_TO]->(f);
MERGE (cl:EpisodeCluster {cluster_id: 'CLS-HD-CHRONIC'}) ON CREATE SET cl.surge_ratio = 1.0, cl.claim_count = 12, cl.is_official_baksos = false;
MERGE (p:Peserta {peserta_token_aes: 'AES256_3d4e5f6a7b8c'}) ON CREATE SET p.status_konfirmasi = 'VERIFIED_ATTENDED';
MERGE (c:Claim {claim_id: 'CLM-2026-8804'}) ON CREATE SET c.ina_cbg_code = 'N-3-10-0', c.deskripsi_cbg = 'Prosedur Hemodialisis Rutin (Terapi Berkala Sah)', c.icd10_primary = 'N18.5 (Chronic kidney disease, stage 5)', c.icd9cm_procedure = '39.95 (Hemodialysis)', c.nilai_klaim_rp = 1020000, c.tanggal_layanan = date('2026-10-17'), c.s1_score = 20.0, c.s2_score = 10.0, c.s3_score = 10.0, c.priority_score = 15.0, c.triage_lane = 'HIJAU', c.hard_trigger = false;
MATCH (c:Claim {claim_id: 'CLM-2026-8804'}), (f:Faskes {faskes_id: 'FSK-KLN-04'}), (d:DPJP {dpjp_id_hash: 'SDMK-DR-9921'}), (cl:EpisodeCluster {cluster_id: 'CLS-HD-CHRONIC'}), (p:Peserta {peserta_token_aes: 'AES256_3d4e5f6a7b8c'}) MERGE (c)-[:SUBMITTED_BY]->(f) MERGE (d)-[:PERFORMED]->(c) MERGE (c)-[:BELONGS_TO]->(cl) MERGE (c)-[:BILLED_TO]->(p);
MERGE (f:Faskes {faskes_id: 'FSK-RSDK-05'}) ON CREATE SET f.nama_faskes = 'RS Daerah Kartini (Kelas B)', f.kelas_rs = 'B';
MERGE (d:DPJP {dpjp_id_hash: 'SDMK-DR-5541'}) ON CREATE SET d.nama_dpjp = 'dr. Agung Nugroho, Sp.B-KBD', d.sip_status = 'EXPIRED', d.catatan_sdmk = 'Telemetri SATUSEHAT SDMK mendeteksi DPJP tercatat tindakan bedah di Semarang pukul 10:15 WIB dan di Solo pukul 11:00 WIB (Anomali Kecepatan Fisik Antar-Kota)';
MATCH (f:Faskes {faskes_id: 'FSK-RSDK-05'}), (d:DPJP {dpjp_id_hash: 'SDMK-DR-5541'}) MERGE (d)-[:ASSIGNED_TO]->(f);
MERGE (cl:EpisodeCluster {cluster_id: 'CLS-GEODIST-COLLISION'}) ON CREATE SET cl.surge_ratio = 2.1, cl.claim_count = 4, cl.is_official_baksos = false;
MERGE (p:Peserta {peserta_token_aes: 'AES256_5a6b7c8d9e0f'}) ON CREATE SET p.status_konfirmasi = 'ANOMALY_DENIED';
MERGE (c:Claim {claim_id: 'CLM-2026-8805'}) ON CREATE SET c.ina_cbg_code = 'B-1-10-II', c.deskripsi_cbg = 'Prosedur Bedah Digestif Laparoskopi Kompleks', c.icd10_primary = 'K35.8 (Acute appendicitis, other)', c.icd9cm_procedure = '47.01 (Laparoscopic appendectomy)', c.nilai_klaim_rp = 18400000, c.tanggal_layanan = date('2026-10-18'), c.s1_score = 60.0, c.s2_score = 96.0, c.s3_score = 75.0, c.priority_score = 75.0, c.triage_lane = 'MERAH', c.hard_trigger = true;
MATCH (c:Claim {claim_id: 'CLM-2026-8805'}), (f:Faskes {faskes_id: 'FSK-RSDK-05'}), (d:DPJP {dpjp_id_hash: 'SDMK-DR-5541'}), (cl:EpisodeCluster {cluster_id: 'CLS-GEODIST-COLLISION'}), (p:Peserta {peserta_token_aes: 'AES256_5a6b7c8d9e0f'}) MERGE (c)-[:SUBMITTED_BY]->(f) MERGE (d)-[:PERFORMED]->(c) MERGE (c)-[:BELONGS_TO]->(cl) MERGE (c)-[:BILLED_TO]->(p);
MERGE (f_sec:Faskes {faskes_id: 'FSK-RS-SEMARANG'}) ON CREATE SET f_sec.nama_faskes = 'RS Pusat Pelayanan Semarang (Kelas A)', f_sec.kelas_rs = 'A';
MATCH (d:DPJP {dpjp_id_hash: 'SDMK-DR-5541'}), (f_sec:Faskes {faskes_id: 'FSK-RS-SEMARANG'}) MERGE (d)-[:SIMULTANEOUS_COLLISION_WITH {jarak_km: 105, selisih_menit: 45}]->(f_sec);
MERGE (f:Faskes {faskes_id: 'FSK-RSMP-06'}) ON CREATE SET f.nama_faskes = 'RS Medika Prima (Kelas B)', f.kelas_rs = 'B';
MERGE (d:DPJP {dpjp_id_hash: 'SDMK-DR-2289'}) ON CREATE SET d.nama_dpjp = 'dr. Suryadi Wijaya, Sp.PD-KGEH', d.sip_status = 'UNSYNCED', d.catatan_sdmk = 'Diskrepansi Rekam Medis: CBG tingkat keparahan III ditagihkan tanpa bukti endoskopi/transfusi pada LIS & PACS faskes';
MATCH (f:Faskes {faskes_id: 'FSK-RSMP-06'}), (d:DPJP {dpjp_id_hash: 'SDMK-DR-2289'}) MERGE (d)-[:ASSIGNED_TO]->(f);
MERGE (cl:EpisodeCluster {cluster_id: 'CLS-UPCODING-SEVERITY'}) ON CREATE SET cl.surge_ratio = 4.8, cl.claim_count = 18, cl.is_official_baksos = false;
MERGE (p:Peserta {peserta_token_aes: 'AES256_8e9f0a1b2c3d'}) ON CREATE SET p.status_konfirmasi = 'ANOMALY_DENIED';
MERGE (c:Claim {claim_id: 'CLM-2026-8806'}) ON CREATE SET c.ina_cbg_code = 'K-1-10-III', c.deskripsi_cbg = 'Perdarahan Saluran Cerna Berat (Upcoding Discrepancy)', c.icd10_primary = 'K92.2 (Gastrointestinal hemorrhage, unspecified)', c.icd9cm_procedure = '45.16 (Esophagogastroduodenoscopy with closed biopsy)', c.nilai_klaim_rp = 38750000, c.tanggal_layanan = date('2026-10-19'), c.s1_score = 92.0, c.s2_score = 45.0, c.s3_score = 80.0, c.priority_score = 75.5, c.triage_lane = 'MERAH', c.hard_trigger = false;
MATCH (c:Claim {claim_id: 'CLM-2026-8806'}), (f:Faskes {faskes_id: 'FSK-RSMP-06'}), (d:DPJP {dpjp_id_hash: 'SDMK-DR-2289'}), (cl:EpisodeCluster {cluster_id: 'CLS-UPCODING-SEVERITY'}), (p:Peserta {peserta_token_aes: 'AES256_8e9f0a1b2c3d'}) MERGE (c)-[:SUBMITTED_BY]->(f) MERGE (d)-[:PERFORMED]->(c) MERGE (c)-[:BELONGS_TO]->(cl) MERGE (c)-[:BILLED_TO]->(p);
MERGE (diag:ObjectiveDiagnostic {id: 'LIS-PACS-NO-PROOF-CLM-2026-8806'}) ON CREATE SET diag.has_objective_proof = false, diag.status = 'K29.0 Gastritis Ringan tanpa bukti endoskopi atau transfusi darah di LIS/PACS';
MATCH (c:Claim {claim_id: 'CLM-2026-8806'}), (diag:ObjectiveDiagnostic {id: 'LIS-PACS-NO-PROOF-CLM-2026-8806'}) MERGE (c)-[:DIAGNOSTIC_DISCREPANCY]->(diag);