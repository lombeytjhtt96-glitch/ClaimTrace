from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from datetime import date, datetime

class DPJPValidation(BaseModel):
    dpjp_id_hash: str
    nama_dpjp_alias: str
    sip_status: Literal["ACTIVE", "EXPIRED", "UNSYNCED"]
    sip_expiry_date: Optional[date] = None
    jam_praktik_valid: bool = True
    faskes_terdaftar: str
    catatan_sdmk: str

class EpisodeFingerprint(BaseModel):
    cluster_id: str
    jumlah_klaim_klaster: int
    rasio_lonjakan_baseline: float  # e.g., 8.5x baseline
    indikasi_repeat_billing: bool = False
    klaim_episode_sebelumnya_id: Optional[str] = None
    selisih_hari_admisi: Optional[int] = None
    terdaftar_baksos_resmi: bool = False

class MobileJKNConfirmation(BaseModel):
    sampel_terkirim: int
    respon_tidak_hadir: int
    respon_hadir: int
    status_konfirmasi: Literal["VERIFIED_ATTENDED", "ANOMALY_DENIED", "PENDING_UNCONFIRMED", "INCONCLUSIVE"]

class ClusterGraphNode(BaseModel):
    id: str
    label: str
    type: Literal["FASKES", "DPJP", "EPISODE", "CLAIM", "PESERTA"]
    status: Optional[str] = None
    risk_level: Optional[Literal["LOW", "MEDIUM", "HIGH"]] = "LOW"

class ClusterGraphEdge(BaseModel):
    source: str
    target: str
    label: str
    is_anomaly: bool = False

class ClusterGraphData(BaseModel):
    nodes: List[ClusterGraphNode]
    edges: List[ClusterGraphEdge]

class ClaimInput(BaseModel):
    claim_id: str
    faskes_id: str
    nama_faskes: str
    kelas_rs: Literal["A", "B", "C", "Klinik"]
    peserta_token_aes: str          # Cryptographically separated participant pseudonym
    tanggal_layanan: date
    ina_cbg_code: str               # e.g.: Z-3-12-0
    deskripsi_cbg: str              # e.g.: Prosedur Rehabilitasi / Fisioterapi
    icd10_primary: str              # e.g.: M54.5 (Low Back Pain)
    icd9cm_procedure: str           # e.g.: 93.39 (Other Physical Therapy)
    nilai_klaim_rp: int
    s1_score: float = Field(..., ge=0, le=100)
    s2_score: float = Field(..., ge=0, le=100)
    s3_score: float = Field(..., ge=0, le=100)
    episode_meta: EpisodeFingerprint
    dpjp_meta: DPJPValidation
    mobile_meta: MobileJKNConfirmation
    # BPJS Healthkathon 2026 Data Sample Variables (Kamus Data BPJS)
    pstv01_peserta_id: Optional[str] = None
    fkl02_id_kunjungan: Optional[str] = None
    fkl03_tgl_masuk: Optional[date] = None
    fkl04_tgl_pulang: Optional[date] = None
    fkl07_kepemilikan: Optional[str] = None
    fkl08_jenis_faskes: Optional[str] = None
    fkl09_tipe_faskes: Optional[str] = None
    fkl10_tingkat_layanan: Optional[str] = None
    fkl11_segmen_peserta: Optional[str] = None
    fkl17_kelas_rawat: Optional[str] = None
    fkl30_kode_cbg: Optional[str] = None
    fkl31_tarif_cbg: Optional[int] = None
    fkl47_biaya_tagih: Optional[int] = None
    fkl48_biaya_verifikasi: Optional[int] = None

class AIAnomalyFeatureDriver(BaseModel):
    feature_name: str
    feature_label: str
    feature_value: Any
    contribution_pct: float
    direction: Literal["ANOMALOUS", "NORMAL"]

class AIAnomalyPrediction(BaseModel):
    is_anomaly: bool
    anomaly_score: float  # 0.0 - 100.0%
    confidence_score: float  # 0.0 - 100.0%
    primary_anomaly_category: str  # "PHANTOM_BILLING", "REPEAT_BILLING", "UPCODING_SEVERITY", "IMPOSSIBLE_TRAVEL", "NORMAL_CLAIM"
    model_family: str = "Ensemble: Isolation Forest + ChromaDB Semantic Vector (MiniLM) + Graph Traversal"
    model_version: str = "v2.4.0-Healthkathon"
    top_feature_drivers: List[AIAnomalyFeatureDriver] = Field(default_factory=list)
    clinical_ai_rationale: str = ""
    automated_recommendation: str = ""

class TriageScoreBreakdown(BaseModel):
    s1_value: float
    s1_weight: float = 0.5
    s1_contribution: float
    s2_value: float
    s2_weight: float = 0.3
    s2_contribution: float
    s3_value: float
    s3_weight: float = 0.2
    s3_contribution: float

class TriageResult(BaseModel):
    claim_id: str
    raw_weighted_score: float
    final_priority_score: float
    triage_lane: Literal["HIJAU", "KUNING", "MERAH"]
    hard_trigger_activated: bool
    hard_trigger_reason: Optional[str] = None
    score_breakdown: TriageScoreBreakdown
    kode_indikator: List[str]
    ringkasan_bukti_audit: str
    kemungkinan_penjelasan_sah: str
    rekomendasi_sop: str
    audit_hash: str
    graph_data: Optional[ClusterGraphData] = None
    # Forensic Cybersecurity & Regulatory Metadata (MITRE F3 / ATT&CK / D3FEND / UU PDP)
    mitre_f3_tags: List[str] = Field(default_factory=list)
    mitre_attack_tags: List[str] = Field(default_factory=list)
    mitre_d3fend_tags: List[str] = Field(default_factory=list)
    regulatory_basis: List[str] = Field(default_factory=list)
    sla_deadline_days: int = 5
    # BPJS Business Enterprise Architecture (BEA C03.04 Klaim)
    bea_process_code: str = "C03.04 (Klaim)"
    bea_target_system: str = "VIDI (Vedika Digital Fast-Track)"
    bea_action_summary: str = ""
    # Automatic AI Anomaly Detection Prediction
    ai_anomaly_prediction: Optional[AIAnomalyPrediction] = None

class VerifierDecisionRequest(BaseModel):
    verifier_id: str
    decision: Literal["LOLOSKAN_KLAIM", "KLARIFIKASI_FASKES", "AUDIT_LAPANGAN"]
    catatan_verifikator: str

class AuditLogEntry(BaseModel):
    index: int
    timestamp: str
    event_type: str
    claim_id: str
    actor: str
    payload: Dict[str, Any]
    prev_hash: str
    current_hash: str
