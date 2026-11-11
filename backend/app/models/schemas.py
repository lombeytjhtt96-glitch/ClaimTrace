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
    status_verifikasi: Optional[str] = None
    catatan_verifikator: Optional[str] = None
    tanggal_verifikasi: Optional[str] = None
    adjudicated_by: Optional[str] = None

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

VEDIKA_DECISION_CODES = Literal[
    "LOLOSKAN_KLAIM",
    "LAYAK_BAYAR",
    "KLARIFIKASI_FASKES",
    "PENDING_KLARIFIKASI",
    "DISPUTE_TKMKB",
    "AUDIT_LAPANGAN",
    "TIDAK_LAYAK_FRAUD",
]


class VerifierDecisionRequest(BaseModel):
    verifier_id: str
    decision: VEDIKA_DECISION_CODES
    catatan_verifikator: str
    pending_reasons: List[str] = Field(default_factory=list)
    checklist_status: Optional[Dict[str, bool]] = None


class BatchDecisionRequest(BaseModel):
    claim_ids: List[str] = Field(..., min_length=1)
    decision: VEDIKA_DECISION_CODES
    verifier_id: str = "198704202011012001"
    catatan_verifikator: str = "Disposisi massal verifikator pra-bayar sesuai kaidah VEDIKA & Perpres 82/2018."
    pending_reasons: List[str] = Field(default_factory=list)


class ClaimChecklistRequest(BaseModel):
    verifier_id: str = "198704202011012001"
    checklist: Dict[str, bool] = Field(default_factory=dict)
    notes: Optional[str] = None


class ClaimIngestSimulateRequest(BaseModel):
    claim_id: Optional[str] = None
    nama_faskes: str = "RS Rujukan FKRTL Simulasi"
    kelas_rs: Literal["A", "B", "C", "Klinik"] = "B"
    ina_cbg_code: str = "Z-3-12-0"
    deskripsi_cbg: str = "Prosedur Rehabilitasi / Fisioterapi (Permenkes 3/2023)"
    icd10_primary: str = "M54.5 (Low Back Pain)"
    icd9cm_procedure: str = "93.39 (Other Physical Therapy)"
    nilai_klaim_rp: int = Field(15300000, ge=1000)
    dpjp_name: str = "dr. Hendra, Sp.KFR"
    sip_status: Literal["ACTIVE", "EXPIRED", "UNSYNCED"] = "ACTIVE"
    catatan_sdmk: str = "Terdaftar pada faskes layanan"
    rasio_lonjakan_baseline: float = Field(1.2, ge=0.1, le=50.0)
    jumlah_klaim_klaster: int = Field(1, ge=1, le=5000)
    indikasi_repeat_billing: bool = False
    klaim_episode_sebelumnya_id: Optional[str] = None
    selisih_hari_admisi: Optional[int] = None
    terdaftar_baksos_resmi: bool = False
    cluster_id: str = "CLS-FPK-SIM"
    mobile_sampel_terkirim: int = Field(10, ge=0, le=500)
    mobile_respon_hadir: int = Field(10, ge=0, le=500)
    mobile_respon_tidak_hadir: int = Field(0, ge=0, le=500)
    add_to_queue: bool = True
    s1_override: Optional[float] = Field(None, ge=0, le=100)
    s2_override: Optional[float] = Field(None, ge=0, le=100)
    s3_override: Optional[float] = Field(None, ge=0, le=100)

class AuditLogEntry(BaseModel):
    index: int
    timestamp: str
    event_type: str
    claim_id: str
    actor: str
    payload: Dict[str, Any]
    prev_hash: str
    current_hash: str


# --- Google SecOps & Sovereign Boundary Schemas ---

class YaraLRuleMetadata(BaseModel):
    author: str
    description: str
    severity: str
    priority: str
    mitre_attack_technique: str
    mitre_f3_tag: str
    regulatory_basis: str
    version: str

class YaraLRuleItem(BaseModel):
    rule_id: str
    rule_name: str
    target_jkn_modus: str
    meta: YaraLRuleMetadata
    rule_text: str
    test_payload_udm: Dict[str, Any]

class SecOpsCaseItem(BaseModel):
    case_id: str
    claim_id: str
    title: str
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    priority: str
    stage: str
    status: str
    hospital: str
    cbg_code: str
    primary_diagnosis: str
    claim_amount_rp: float
    assigned_investigator: str
    recommended_action: str
    sla_deadline_iso: str
    sla_remaining_business_days: int
    is_sla_breached: bool
    mitre_f3_tags: List[str]
    mitre_attack_tags: List[str]
    mitre_d3fend_tags: List[str]
    case_hash: str

class SecOpsCaseManifest(BaseModel):
    spec_version: str
    total_cases: int
    critical_cases: int
    high_cases: int
    open_cases: int
    cases: List[SecOpsCaseItem]
    integrity_seal: str
    generated_at: str

class DynamicYaraLCompileRequest(BaseModel):
    rule_name: str
    description: str
    severity: Literal["Critical", "High", "Medium", "Low"] = "High"
    cbg_codes: List[str] = Field(default_factory=list)
    threshold_count: int = 15
    time_window_hours: int = 24

class ActionManifestSchema(BaseModel):
    agent_id: str
    operation: str
    target: str
    policy: str
    inputs_hash: str
    decision_label: str
    severity: str
    claim_id: Optional[str] = None
    faskes_name: Optional[str] = None
    tgr_recovery_amount_rp: float = 0.0
    human_gate_required: bool = True
    human_gate_status: str = "PENDING_REVIEW"
    human_reviewer_nip: Optional[str] = None
    human_reviewer_name: Optional[str] = None
    blockers: List[str] = Field(default_factory=list)

class DecisionReceiptItem(BaseModel):
    receipt_id: str
    spec_version: str = "1.0.0-oao-receipt"
    issued_at: str
    canonical_digest_sha256: str
    digital_seal: str
    verification_status: str
    sovereign_boundary: str
    verified_at: Optional[str] = None
    manifest: ActionManifestSchema

class MintReceiptRequest(BaseModel):
    agent_id: str = "claimtrace-ai-dss-v1.2"
    operation: str
    target: str
    policy: str = "Perpres No. 82/2018 Pasal 76 & Permenkes No. 26/2021 Pasal 74"
    decision_label: str
    inputs: Dict[str, Any]
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"] = "HIGH"
    tgr_recovery_amount_rp: float = 0.0
    claim_id: Optional[str] = None
    faskes_name: Optional[str] = None

class HumanGateReviewRequest(BaseModel):
    verifikator_nip: str
    verifikator_name: str
    approved: bool
    blocker_notes: Optional[str] = None

class ReceiptVerificationResponse(BaseModel):
    receipt_id: str
    tamper_free: bool
    digest_matches: bool
    seal_matches: bool
    human_gate_cleared: bool
    is_executable: bool
    reasons: List[str]

class BatchReceiptsManifest(BaseModel):
    spec_version: str
    generated_at: str
    total_receipts: int
    master_manifest_seal_sha256: str
    pending_human_gate_count: int
    verified_human_gate_count: int
    total_potential_tgr_rp: float
    receipts: List[DecisionReceiptItem]

# ==============================================================================
# CYBERSECURITY SKILLS & MITRE F3 FRAMEWORK SCHEMAS (mukul975/skills)
# ==============================================================================

class CybersecurityFrameworkItem(BaseModel):
    framework: str = Field(description="MITRE_F3, MITRE_ATTACK, MITRE_D3FEND, NIST_CSF, MITRE_ATLAS, or NIST_AI_RMF")
    technique_id: str
    technique_name: str
    tactic: str
    description: str
    defense_countermeasure: Optional[str] = None

class ClaimCybersecurityMatrix(BaseModel):
    claim_id: str
    faskes_code: Optional[str] = None
    fraud_typology: str
    risk_level: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    f3_positioning: List[CybersecurityFrameworkItem] = Field(default_factory=list)
    f3_monetization: List[CybersecurityFrameworkItem] = Field(default_factory=list)
    attack_ttps: List[CybersecurityFrameworkItem] = Field(default_factory=list)
    d3fend_countermeasures: List[CybersecurityFrameworkItem] = Field(default_factory=list)
    nist_csf_alignment: List[str] = Field(default_factory=list)
    canonical_matrix_sha256: str
    generated_at: str

class EvaluateCybersecurityRequest(BaseModel):
    claim_id: str
    fraud_typology: Optional[str] = None
    faskes_code: Optional[str] = None
    indikator_anomali: List[str] = Field(default_factory=list)
    nominal_klaim_rp: float = 0.0

class FrameworkCatalogResponse(BaseModel):
    total_skills_count: int
    mapped_frameworks: Dict[str, int]
    f3_skills_count: int
    top_fraud_skills: List[Dict[str, Any]]

class WbsReportInput(BaseModel):
    category: str = Field(..., max_length=100)
    faskes_name: str = Field(..., min_length=1, max_length=250)
    location: Optional[str] = Field(None, max_length=150)
    reporter_contact: Optional[str] = Field(None, max_length=120)
    is_anonymous: bool = False
    description: str = Field(..., min_length=5, max_length=10000)

class WbsReportRecord(BaseModel):
    ticket_id: str
    category: str
    faskes_name: str
    location: str
    reporter_contact_masked: Optional[str] = None
    is_anonymous: bool
    description: str
    timestamp: str
    cryptographic_hash: str
    status: str
    audit_ledger_index: Optional[int] = None
    assigned_verificator: str = "Verifikator Tim Anti-Fraud BPJS Pusat"
    sla_deadline_days: int = 10

class WbsReportResponse(BaseModel):
    success: bool
    ticket_id: str
    category: str
    faskes_name: str
    location: str
    reporter_contact_masked: Optional[str] = None
    timestamp: str
    cryptographic_hash: str
    status: str
    is_anonymous: bool
    audit_ledger_index: Optional[int] = None
    sla_deadline_days: int = 10
    message: str

class WbsTrackResponse(BaseModel):
    found: bool
    ticket_id: str
    category: Optional[str] = None
    faskes_name: Optional[str] = None
    location: Optional[str] = None
    timestamp: Optional[str] = None
    cryptographic_hash: Optional[str] = None
    status: Optional[str] = None
    audit_ledger_index: Optional[int] = None
    disposition: Optional[str] = None
    sla_deadline_days: int = 10
    integrity_verified: bool = True

