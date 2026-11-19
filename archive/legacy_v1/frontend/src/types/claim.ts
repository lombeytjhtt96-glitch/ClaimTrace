export type TriageLane = "MERAH" | "KUNING" | "HIJAU";
export type SipStatus = "ACTIVE" | "EXPIRED" | "UNSYNCED";

export interface DPJPValidation {
  dpjp_id_hash: string;
  nama_dpjp_alias: string;
  sip_status: SipStatus;
  sip_expiry_date?: string;
  jam_praktik_valid: boolean;
  faskes_terdaftar: string;
  catatan_sdmk: string;
}

export interface EpisodeFingerprint {
  cluster_id: string;
  jumlah_klaim_klaster: number;
  rasio_lonjakan_baseline: number;
  indikasi_repeat_billing: boolean;
  klaim_episode_sebelumnya_id?: string;
  selisih_hari_admisi?: number;
  terdaftar_baksos_resmi: boolean;
}

export interface MobileJKNConfirmation {
  sampel_terkirim: number;
  respon_tidak_hadir: number;
  respon_hadir: number;
  status_konfirmasi: "VERIFIED_ATTENDED" | "ANOMALY_DENIED" | "PENDING_UNCONFIRMED" | "INCONCLUSIVE";
}

export interface ClusterGraphNode {
  id: string;
  label: string;
  type: "FASKES" | "DPJP" | "EPISODE" | "CLAIM" | "PESERTA";
  status?: string;
  risk_level?: "LOW" | "MEDIUM" | "HIGH";
}

export interface ClusterGraphEdge {
  source: string;
  target: string;
  label: string;
  is_anomaly: boolean;
}

export interface ClusterGraphData {
  nodes: ClusterGraphNode[];
  edges: ClusterGraphEdge[];
}

export interface ClaimItem {
  claim_id: string;
  faskes_id: string;
  nama_faskes: string;
  kelas_rs: "A" | "B" | "C" | "Klinik";
  peserta_token_aes: string;
  tanggal_layanan: string;
  ina_cbg_code: string;
  deskripsi_cbg: string;
  icd10_primary: string;
  icd9cm_procedure: string;
  nilai_klaim_rp: number;
  s1_score: number;
  s2_score: number;
  s3_score: number;
  episode_meta: EpisodeFingerprint;
  dpjp_meta: DPJPValidation;
  mobile_meta: MobileJKNConfirmation;
  // BPJS Healthkathon 2026 Data Sample Variables (Kamus Data BPJS)
  pstv01_peserta_id?: string;
  fkl02_id_kunjungan?: string;
  fkl03_tgl_masuk?: string;
  fkl04_tgl_pulang?: string;
  fkl07_kepemilikan?: string;
  fkl08_jenis_faskes?: string;
  fkl09_tipe_faskes?: string;
  fkl10_tingkat_layanan?: string;
  fkl11_segmen_peserta?: string;
  fkl17_kelas_rawat?: string;
  fkl30_kode_cbg?: string;
  fkl31_tarif_cbg?: number;
  fkl47_biaya_tagih?: number;
  fkl48_biaya_verifikasi?: number;
}

export interface ScoreBreakdown {
  s1_value: number;
  s1_weight: number;
  s1_contribution: number;
  s2_value: number;
  s2_weight: number;
  s2_contribution: number;
  s3_value: number;
  s3_weight: number;
  s3_contribution: number;
}

export interface TriageResult {
  claim_id: string;
  raw_weighted_score: number;
  final_priority_score: number;
  triage_lane: TriageLane;
  hard_trigger_activated: boolean;
  hard_trigger_reason?: string;
  score_breakdown: ScoreBreakdown;
  kode_indikator: string[];
  ringkasan_bukti_audit: string;
  kemungkinan_penjelasan_sah: string;
  rekomendasi_sop: string;
  audit_hash: string;
  graph_data?: ClusterGraphData;
  mitre_f3_tags?: string[];
  mitre_attack_tags?: string[];
  mitre_d3fend_tags?: string[];
  regulatory_basis?: string[];
  sla_deadline_days?: number;
  // BPJS Business Enterprise Architecture (BEA C03.04 Klaim)
  bea_process_code?: string;
  bea_target_system?: string;
  bea_action_summary?: string;
}

export interface ClaimWithTriage {
  claim: ClaimItem;
  triage: TriageResult;
}

export interface AuditEntry {
  index: number;
  timestamp: string;
  event_type: string;
  claim_id: string;
  actor: string;
  payload: Record<string, unknown>;
  prev_hash: string;
  current_hash: string;
}
