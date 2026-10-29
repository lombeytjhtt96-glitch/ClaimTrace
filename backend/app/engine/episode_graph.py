from typing import Dict, Any, List
from app.models.schemas import ClaimInput, ClusterGraphData, ClusterGraphNode, ClusterGraphEdge

def generate_cluster_graph(claim: ClaimInput) -> ClusterGraphData:
    """
    Constructs the Episode Fingerprint Graph topology for visual explanation (XAI).
    Maps relationships between Faskes, DPJP, Episode Clusters, Claims, and Sample Patients.
    Detects graph-level anomalies such as isolated DPJP SIP expiration or multi-claim duplication edges.
    """
    nodes: List[ClusterGraphNode] = []
    edges: List[ClusterGraphEdge] = []

    # 1. Faskes Node
    nodes.append(ClusterGraphNode(
        id=claim.faskes_id,
        label=claim.nama_faskes,
        type="FASKES",
        status=f"Kelas {claim.kelas_rs}",
        risk_level="MEDIUM" if claim.episode_meta.rasio_lonjakan_baseline >= 3.0 else "LOW"
    ))

    # 2. DPJP Node
    dpjp_risk = "HIGH" if claim.dpjp_meta.sip_status == "EXPIRED" else ("MEDIUM" if claim.dpjp_meta.sip_status == "UNSYNCED" else "LOW")
    nodes.append(ClusterGraphNode(
        id=claim.dpjp_meta.dpjp_id_hash,
        label=f"{claim.dpjp_meta.nama_dpjp_alias} ({claim.dpjp_meta.sip_status})",
        type="DPJP",
        status=claim.dpjp_meta.catatan_sdmk,
        risk_level=dpjp_risk
    ))

    # Edge Faskes -> DPJP
    edges.append(ClusterGraphEdge(
        source=claim.faskes_id,
        target=claim.dpjp_meta.dpjp_id_hash,
        label="Penugasan Klinis (SDMK)",
        is_anomaly=(claim.dpjp_meta.sip_status == "EXPIRED")
    ))

    # 3. Episode / Cluster Node
    cluster_risk = "HIGH" if (claim.episode_meta.rasio_lonjakan_baseline >= 3.0 and not claim.episode_meta.terdaftar_baksos_resmi) else "LOW"
    nodes.append(ClusterGraphNode(
        id=claim.episode_meta.cluster_id,
        label=f"Klaster: {claim.episode_meta.cluster_id} ({claim.episode_meta.jumlah_klaim_klaster} klaim)",
        type="EPISODE",
        status=f"Lonjakan {claim.episode_meta.rasio_lonjakan_baseline}x baseline",
        risk_level=cluster_risk
    ))

    # 4. Current Claim Node
    nodes.append(ClusterGraphNode(
        id=claim.claim_id,
        label=f"Klaim {claim.claim_id} ({claim.ina_cbg_code})",
        type="CLAIM",
        status=f"Rp{claim.nilai_klaim_rp:,}",
        risk_level="HIGH" if claim.s1_score >= 75 else ("MEDIUM" if claim.s1_score >= 50 else "LOW")
    ))

    # Edges for Current Claim
    edges.append(ClusterGraphEdge(
        source=claim.dpjp_meta.dpjp_id_hash,
        target=claim.claim_id,
        label="DPJP Pemeriksa",
        is_anomaly=(claim.dpjp_meta.sip_status == "EXPIRED")
    ))

    edges.append(ClusterGraphEdge(
        source=claim.claim_id,
        target=claim.episode_meta.cluster_id,
        label="Bagian dari Episode / Klaster",
        is_anomaly=(claim.episode_meta.rasio_lonjakan_baseline >= 3.0 and not claim.episode_meta.terdaftar_baksos_resmi)
    ))

    # 5. Repeat Billing Link (Modus #11)
    if claim.episode_meta.indikasi_repeat_billing and claim.episode_meta.klaim_episode_sebelumnya_id:
        prev_id = "PREV-" + claim.claim_id
        nodes.append(ClusterGraphNode(
            id=prev_id,
            label=f"Klaim Terbayar: {claim.episode_meta.klaim_episode_sebelumnya_id}",
            type="CLAIM",
            status="Status: SUDAH DIBAYAR (Lunas)",
            risk_level="HIGH"
        ))
        edges.append(ClusterGraphEdge(
            source=claim.claim_id,
            target=prev_id,
            label="KLAIM BERULANG (#11 Repeat Billing)",
            is_anomaly=True
        ))

    # 5b. Geodistance Collision Link (MITRE F3 FA0001 - Practitioner Staging)
    if claim.episode_meta.cluster_id == "CLS-GEODIST-COLLISION":
        sec_faskes_id = "FSK-RS-SEMARANG"
        nodes.append(ClusterGraphNode(
            id=sec_faskes_id,
            label="RS Pusat Pelayanan Semarang (Kelas A)",
            type="FASKES",
            status="Operasi Pukul 10:15 WIB",
            risk_level="HIGH"
        ))
        edges.append(ClusterGraphEdge(
            source=claim.dpjp_meta.dpjp_id_hash,
            target=sec_faskes_id,
            label="Tindakan Simultan (Selisih 45 mnt, Jarak 105 km)",
            is_anomaly=True
        ))

    # 5c. Upcoding Severity Discrepancy Link (MITRE F3 FA0002)
    if claim.episode_meta.cluster_id == "CLS-UPCODING-SEVERITY":
        baseline_id = "BASE-DIAG-CLINICAL"
        nodes.append(ClusterGraphNode(
            id=baseline_id,
            label="LIS/PACS Rekam Medis: K29.0 Ringan",
            type="EPISODE",
            status="Tanpa Bukti Transfusi / ICU",
            risk_level="HIGH"
        ))
        edges.append(ClusterGraphEdge(
            source=claim.claim_id,
            target=baseline_id,
            label="Diskrepansi Upcoding Tingkat III",
            is_anomaly=True
        ))

    # 6. Sample Patients (Lapis 3 - Mobile JKN)
    nodes.append(ClusterGraphNode(
        id=claim.peserta_token_aes,
        label=f"Peserta ({claim.peserta_token_aes[:12]}...)",
        type="PESERTA",
        status=f"Konfirmasi: {claim.mobile_meta.status_konfirmasi}",
        risk_level="HIGH" if claim.mobile_meta.respon_tidak_hadir > 0 else "LOW"
    ))

    edges.append(ClusterGraphEdge(
        source=claim.claim_id,
        target=claim.peserta_token_aes,
        label="Verifikasi Presensi Biner Mobile JKN",
        is_anomaly=(claim.mobile_meta.respon_tidak_hadir > 0)
    ))

    return ClusterGraphData(nodes=nodes, edges=edges)
