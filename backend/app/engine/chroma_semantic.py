"""
ChromaDB Semantic Engine for ClaimTrace (BPJS Kesehatan Healthkathon 2026)
Deteksi Plagiarisme Semantik Narasi Klinis & Copy-Paste Resume Medis Antar-Klaim
Fokus Khusus: Modus #6 Phantom Billing (Baksos Fiktif / Klaim Pabrikan)

Arsitektur:
- Vector Database: ChromaDB v1.5.9
- Space: Cosine Similarity (HNSW)
- Embedding: ONNX all-MiniLM-L6-v2 (Offline/Airgapped In-Memory & Persistent)
- Threshold: Kemiripan > 90% memicu sinyal IND-SEM-COPYPASTE
"""

import os
import difflib
from typing import Dict, List, Any, Optional
import chromadb
from chromadb.config import Settings

# Persistent directory for ClaimTrace ChromaDB
CHROMA_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "chroma_db")
os.makedirs(CHROMA_DATA_DIR, exist_ok=True)

COLLECTION_NAME = "claimtrace_clinical_resumes"

# Standard Indonesian Clinical Resume Corpus for Claims
INITIAL_CLINICAL_RESUMES = [
    {
        "claim_id": "CLM-2026-8801",
        "cluster_id": "CLS-PHANTOM-85",
        "faskes_id": "FSK-RSX-01",
        "nama_faskes": "RS Khusus Mitra Husada",
        "patient_name": "Tn. Agus Santoso (Token: AES_9f8a)",
        "diagnosa_primary": "M54.5 (Low Back Pain)",
        "prosedur": "93.39 (Other Physical Therapy)",
        "resume_text": (
            "Pasien mengeluh nyeri punggung bawah (Low Back Pain) menjalar ke paha posterior dextra sejak 2 minggu. "
            "Pemeriksaan fisik: Lasegue (+), Patrick (-), Kontraktur otot paravertebral L4-L5 (+), refleks fisiologis normal. "
            "Tindakan: Fisioterapi komprehensif, Short Wave Diathermy (SWD) dan Lumbar Traction 93.39 serial 5 sesi. "
            "Rekomendasi: Edukasi postur ergonomis duduk, korset lumbal, dan pembatasan beban angkat berat."
        )
    },
    {
        "claim_id": "CLM-2026-8801-CLONE-02",
        "cluster_id": "CLS-PHANTOM-85",
        "faskes_id": "FSK-RSX-01",
        "nama_faskes": "RS Khusus Mitra Husada",
        "patient_name": "Tn. Bambang Supardi (Token: AES_b2c3)",
        "diagnosa_primary": "M54.5 (Low Back Pain)",
        "prosedur": "93.39 (Other Physical Therapy)",
        "resume_text": (
            "Pasien mengeluh nyeri punggung bawah (Low Back Pain) menjalar ke paha posterior dextra sejak 2 minggu. "
            "Pemeriksaan fisik: Lasegue (+), Patrick (-), Kontraktur otot paravertebral L4-L5 (+), refleks fisiologis normal. "
            "Tindakan: Fisioterapi komprehensif, Short Wave Diathermy (SWD) dan Lumbar Traction 93.39 serial 5 sesi. "
            "Rekomendasi: Edukasi postur ergonomis duduk, korset lumbal, dan pembatasan beban angkat berat."
        )
    },
    {
        "claim_id": "CLM-2026-8801-CLONE-03",
        "cluster_id": "CLS-PHANTOM-85",
        "faskes_id": "FSK-RSX-01",
        "nama_faskes": "RS Khusus Mitra Husada",
        "patient_name": "Ny. Sri Wahyuni (Token: AES_c4d5)",
        "diagnosa_primary": "M54.5 (Low Back Pain)",
        "prosedur": "93.39 (Other Physical Therapy)",
        "resume_text": (
            "Keluhan nyeri punggung bawah Low Back Pain menjalar ke paha kanan sejak 14 hari terakhir. "
            "Pemeriksaan fisik: Lasegue (+), Patrick (-), Spasme otot paravertebral lumbal L4-L5 (+), refleks patologis (-). "
            "Tindakan: Fisioterapi terpadu Short Wave Diathermy SWD dan Traksi Lumbal 93.39 sebanyak 5 sesi berkala. "
            "Saran klinis: Postur ergonomis saat duduk, korset lumbal dan hindari angkat beban berat."
        )
    },
    {
        "claim_id": "CLM-2026-8802",
        "cluster_id": "CLS-REPEAT-11",
        "faskes_id": "FSK-RSY-02",
        "nama_faskes": "RS Swasta As-Syifa (Kelas C)",
        "patient_name": "Ny. Siti Rahma (Token: AES_1a2b)",
        "diagnosa_primary": "K29.7 (Gastritis, unspecified)",
        "prosedur": "89.03 (Interview and evaluation)",
        "resume_text": (
            "Pasien rawat jalan mengeluh nyeri ulu hati (epigastric burning), mual, dan kembung berulang sejak 3 hari. "
            "Pemeriksaan abdomen: supel, nyeri tekan regio epigastrium (+), hepar dan lien tidak teraba membesar. "
            "Tindakan: Wawancara klinis dan evaluasi diagnostik 89.03. Terapi: PPI Pantoprazole 40mg tab, Sukralfat sirup 3x1 C. "
            "Edukasi: Pola makan teratur, hindari makanan pedas, kopi, dan asam."
        )
    },
    {
        "claim_id": "CLM-2026-8803",
        "cluster_id": "CLS-LEGAL-KATARAK",
        "faskes_id": "FSK-RSZ-03",
        "nama_faskes": "RS Khusus Mata Nusantara (Kelas B)",
        "patient_name": "Tn. Mulyono (Token: AES_7c8d)",
        "diagnosa_primary": "H25.9 (Senile cataract, unspecified)",
        "prosedur": "13.41 (Phacoemulsification of cataract)",
        "resume_text": (
            "Pasien baksos katarak penugasan resmi Dinkes Solo. Keluhan visus mata kanan VOD 1/300, VOS 6/12 dengan katarak senilis matur. "
            "Dilakukan operasi fakoemulsifikasi OD insisi kornea temporal 2.2 mm, kapsulorheksis kontinu, fako emulsifikasi nukleus. "
            "Implantasi foldable hydrophobic IOL Alcon AcrySof +21.5 Dioptri in the bag. Phaco time 14 detik, CDE 3.8. "
            "Post-op: COA dalam, kornea jernih, visus pasca bedah 6/18 pinhole 6/9."
        )
    },
    {
        "claim_id": "CLM-2026-8803-LEGIT-02",
        "cluster_id": "CLS-LEGAL-KATARAK",
        "faskes_id": "FSK-RSZ-03",
        "nama_faskes": "RS Khusus Mata Nusantara (Kelas B)",
        "patient_name": "Ny. Sumiyati (Token: AES_8d9e)",
        "diagnosa_primary": "H25.9 (Senile cataract, unspecified)",
        "prosedur": "13.41 (Phacoemulsification of cataract)",
        "resume_text": (
            "Pasien baksos katarak resmi SK Dinkes. Keluhan penglihatan mata kiri berkabut VOS hand movement, VOD 6/18. "
            "Operasi fakoemulsifikasi OS insisi clear cornea superior 2.4 mm, implantasi IOL Hoya iSert +23.0 Dioptri. "
            "Phaco time 22 detik, CDE 5.1. Target refraksi emetropia. Pasca bedah tidak ada hifema, kornea tenang, terapi Levofloxacin tetes."
        )
    },
    {
        "claim_id": "CLM-2026-8804",
        "cluster_id": "CLS-HD-CHRONIC",
        "faskes_id": "FSK-KLN-04",
        "nama_faskes": "Klinik Pratama Hemodialisis Sehat Mandiri",
        "patient_name": "Tn. Hendra Wijaya (Token: AES_3d4e)",
        "diagnosa_primary": "N18.5 (Chronic kidney disease, stage 5)",
        "prosedur": "39.95 (Hemodialysis)",
        "resume_text": (
            "Pasien gagal ginjal kronik stadium terminal on hemodialisis rutin berkala 2x seminggu. "
            "BB pre-HD 60.8 kg, target BB kering 58.5 kg, UF goal 2300 ml. Akses vaskular AV Shunt brachiocephalica dextra paten thrill kuat. "
            "Dialiser High-Flux F60 reuse ke-3. Durasi HD 4 jam, QB 250 ml/mnt, QD 500 ml/mnt. Hemodinamik stabil tensi post-HD 130/80 mmHg."
        )
    },
    {
        "claim_id": "CLM-2026-8805",
        "cluster_id": "CLS-GEODIST-COLLISION",
        "faskes_id": "FSK-RSDK-05",
        "nama_faskes": "RS Daerah Kartini (Kelas B)",
        "patient_name": "Nn. Ratna Sari (Token: AES_5a6b)",
        "diagnosa_primary": "K35.8 (Acute appendicitis, other)",
        "prosedur": "47.01 (Laparoscopic appendectomy)",
        "resume_text": (
            "Pasien admisi darurat dengan nyeri perut kanan bawah akut memberat 12 jam, febris 38.3C, skor Alvarado 8. "
            "Tindakan cito: Apendektomi laparoskopi 47.01 dengan insisi trokar infraumbilikal 10mm dan suprapubik 5mm. "
            "Temuan bedah: appendix perforasi fokal di 1/3 distal dengan eksudat purulen 40cc. Appendectomy in toto, lavage cavum pelvis."
        )
    },
    {
        "claim_id": "CLM-2026-8806",
        "cluster_id": "CLS-UPCODING-SEVERITY",
        "faskes_id": "FSK-RSMP-06",
        "nama_faskes": "RS Medika Prima (Kelas B)",
        "patient_name": "Tn. Dedi Irawan (Token: AES_8e9f)",
        "diagnosa_primary": "K92.2 (Gastrointestinal hemorrhage, unspecified)",
        "prosedur": "45.16 (Esophagogastroduodenoscopy with closed biopsy)",
        "resume_text": (
            "Pasien rawat inap dengan klaim CBG tingkat keparahan III perdarahan saluran cerna masif dan syok hipovolemik. "
            "Resume medis faskes mencatat tindakan esofagogastroduodenoskopi terapeutik dan transfusi 4 kantong PRC. "
            "Verifikasi silang LIS dan PACS tidak menemukan rekaman video/foto endoskopi serta formulir lab crossmatch darah (Anomali Upcoding Ekstrem)."
        )
    }
]

class ChromaSemanticEngine:
    """
    Mesin Deteksi Plagiarisme Teks Resume Medis & Copy-Paste Narasi Klinis
    Menggunakan ChromaDB dan All-MiniLM-L6-v2 Embeddings
    """
    _instance: Optional["ChromaSemanticEngine"] = None

    def __init__(self, persistent_path: str = CHROMA_DATA_DIR):
        try:
            self.client = chromadb.PersistentClient(path=persistent_path)
        except Exception:
            self.client = chromadb.Client()

        # Get or create collection with cosine similarity metric
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
        self._seed_initial_data()

    @classmethod
    def get_instance(cls) -> "ChromaSemanticEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _seed_initial_data(self) -> None:
        """Seed resume corpus jika koleksi masih kosong"""
        if self.collection.count() == 0:
            ids = [item["claim_id"] for item in INITIAL_CLINICAL_RESUMES]
            documents = [item["resume_text"] for item in INITIAL_CLINICAL_RESUMES]
            metadatas = [
                {
                    "claim_id": item["claim_id"],
                    "cluster_id": item["cluster_id"],
                    "faskes_id": item["faskes_id"],
                    "nama_faskes": item["nama_faskes"],
                    "patient_name": item["patient_name"],
                    "diagnosa_primary": item["diagnosa_primary"],
                    "prosedur": item["prosedur"],
                }
                for item in INITIAL_CLINICAL_RESUMES
            ]
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )

    def get_collection_stats(self) -> Dict[str, Any]:
        """Statistik koleksi vektor ChromaDB"""
        count = self.collection.count()
        return {
            "collection_name": COLLECTION_NAME,
            "total_documents": count,
            "metric": "cosine",
            "model": "all-MiniLM-L6-v2 (Chroma ONNX Local)",
            "status": "ONLINE_ACTIVE",
            "cluster_count": len(set(item["cluster_id"] for item in INITIAL_CLINICAL_RESUMES))
        }

    def analyze_claim_plagiarism(
        self,
        claim_id: str,
        threshold: float = 0.90,
        n_results: int = 5
    ) -> Dict[str, Any]:
        """
        Analisis kemiripan teks resume medis klaim terhadap repositori nasional.
        Jika ada klaim lain dengan kemiripan > threshold (default 90%), memicu sinyal kecurangan.
        """
        # Cari dokumen target
        existing = self.collection.get(ids=[claim_id], include=["documents", "metadatas"])
        if not existing or not existing["documents"] or len(existing["documents"]) == 0:
            # Fallback jika claim_id belum ada di koleksi
            return {
                "claim_id": claim_id,
                "status": "NOT_INDEXED",
                "is_plagiarized": False,
                "max_similarity_pct": 0.0,
                "matches": []
            }

        target_text = existing["documents"][0]
        target_meta = existing["metadatas"][0] if existing["metadatas"] else {}

        # Query tetangga terdekat dalam koleksi
        query_results = self.collection.query(
            query_texts=[target_text],
            n_results=min(n_results + 1, self.collection.count()),
            include=["documents", "metadatas", "distances"]
        )

        matches = []
        max_similarity_pct = 0.0
        most_suspicious_match = None

        if query_results and "ids" in query_results and query_results["ids"]:
            matched_ids = query_results["ids"][0]
            matched_docs = query_results["documents"][0]
            matched_metas = query_results["metadatas"][0]
            matched_dists = query_results["distances"][0]

            for m_id, m_doc, m_meta, m_dist in zip(matched_ids, matched_docs, matched_metas, matched_dists):
                if m_id == claim_id:
                    continue  # Lewati diri sendiri

                # Hitung cosine similarity dari cosine distance (dist = 1 - sim)
                similarity = max(0.0, min(1.0, 1.0 - m_dist))
                similarity_pct = round(similarity * 100, 2)

                # Hitung token matching rasio dengan difflib
                diff_matcher = difflib.SequenceMatcher(None, target_text, m_doc)
                diff_ratio_pct = round(diff_matcher.ratio() * 100, 2)

                is_clone = similarity >= threshold or diff_ratio_pct >= 90.0

                match_entry = {
                    "matched_claim_id": m_id,
                    "patient_name": m_meta.get("patient_name", "-"),
                    "nama_faskes": m_meta.get("nama_faskes", "-"),
                    "cluster_id": m_meta.get("cluster_id", "-"),
                    "cosine_similarity_pct": similarity_pct,
                    "diff_ratio_pct": diff_ratio_pct,
                    "is_same_faskes": m_meta.get("faskes_id") == target_meta.get("faskes_id"),
                    "is_same_cluster": m_meta.get("cluster_id") == target_meta.get("cluster_id"),
                    "is_plagiarized_clone": is_clone,
                    "matched_excerpt": m_doc[:120] + "..." if len(m_doc) > 120 else m_doc
                }
                matches.append(match_entry)

                if similarity_pct > max_similarity_pct:
                    max_similarity_pct = similarity_pct
                    most_suspicious_match = match_entry

        is_plagiarized = max_similarity_pct >= (threshold * 100)

        # Risk Score Adjustment & Modus #6 Trigger
        if is_plagiarized:
            severity = "CRITICAL_PLAGIARISM"
            recommendation = (
                f"Sinyal IND-SEM-COPYPASTE Aktif: Teks resume medis terdeteksi identik/copy-paste "
                f"({max_similarity_pct}% kemiripan) dengan klaim {most_suspicious_match['matched_claim_id'] if most_suspicious_match else ''} "
                f"pada Faskes yang sama. Indikasi kuat fabrikasi rekam medis (Modus #6 Phantom Billing)."
            )
        elif max_similarity_pct >= 75.0:
            severity = "SUSPICIOUS_PARAPHRASE"
            recommendation = (
                f"Kemiripan moderat ({max_similarity_pct}%). Diduga variasi template klinis yang diparafrase. "
                "Perlu audit manual lembar resume asli DPJP."
            )
        else:
            severity = "NORMAL_CLINICAL_DIVERSITY"
            recommendation = (
                f"Diversitas narasi klinis wajar ({max_similarity_pct}%). Catatan medis terbukti "
                "individual dan independen antar-pasien."
            )

        return {
            "claim_id": claim_id,
            "target_meta": target_meta,
            "target_resume_text": target_text,
            "is_plagiarized": is_plagiarized,
            "max_similarity_pct": max_similarity_pct,
            "severity": severity,
            "recommendation": recommendation,
            "signal_code": "IND-SEM-COPYPASTE" if is_plagiarized else None,
            "matches": matches
        }

    def compare_custom_text(self, text_input: str, top_k: int = 4) -> Dict[str, Any]:
        """
        Bandingkan teks input kustom verifikator dengan seluruh korpus resume klaim.
        Fitur live audit untuk memverifikasi apakah resume yang dikirim faskes merupakan hasil duplikasi.
        """
        if not text_input or len(text_input.strip()) < 10:
            return {
                "error": "Teks resume terlalu pendek (minimal 10 karakter)",
                "matches": []
            }

        if self.collection.count() == 0:
            return {
                "query_text_length": len(text_input),
                "total_matches": 0,
                "highest_similarity_pct": 0.0,
                "matches": []
            }

        query_results = self.collection.query(
            query_texts=[text_input],
            n_results=min(top_k, self.collection.count()),
            include=["documents", "metadatas", "distances"]
        )

        matches = []
        if query_results and "ids" in query_results and query_results["ids"]:
            matched_ids = query_results["ids"][0]
            matched_docs = query_results["documents"][0]
            matched_metas = query_results["metadatas"][0]
            matched_dists = query_results["distances"][0]

            for m_id, m_doc, m_meta, m_dist in zip(matched_ids, matched_docs, matched_metas, matched_dists):
                similarity = max(0.0, min(1.0, 1.0 - m_dist))
                similarity_pct = round(similarity * 100, 2)
                diff_matcher = difflib.SequenceMatcher(None, text_input, m_doc)
                diff_ratio_pct = round(diff_matcher.ratio() * 100, 2)

                matches.append({
                    "claim_id": m_id,
                    "patient_name": m_meta.get("patient_name", "-"),
                    "nama_faskes": m_meta.get("nama_faskes", "-"),
                    "cluster_id": m_meta.get("cluster_id", "-"),
                    "diagnosa_primary": m_meta.get("diagnosa_primary", "-"),
                    "cosine_similarity_pct": similarity_pct,
                    "diff_ratio_pct": diff_ratio_pct,
                    "resume_excerpt": m_doc
                })

        return {
            "query_text_length": len(text_input),
            "total_matches": len(matches),
            "highest_similarity_pct": matches[0]["cosine_similarity_pct"] if matches else 0.0,
            "matches": matches
        }

    def get_cluster_similarity_matrix(self, cluster_id: str) -> Dict[str, Any]:
        """
        Menghasilkan matriks kemiripan pairwise (NxN) untuk semua klaim dalam sebuah klaster.
        Memperlihatkan pola copy-paste massal pada baksos fiktif.
        """
        cluster_items = [item for item in INITIAL_CLINICAL_RESUMES if item["cluster_id"] == cluster_id]
        if not cluster_items:
            return {"cluster_id": cluster_id, "claims": [], "matrix": []}

        claim_ids = [item["claim_id"] for item in cluster_items]
        docs = [item["resume_text"] for item in cluster_items]

        n = len(claim_ids)
        matrix = [[0.0 for _ in range(n)] for _ in range(n)]

        for i in range(n):
            for j in range(n):
                if i == j:
                    matrix[i][j] = 100.0
                else:
                    diff_matcher = difflib.SequenceMatcher(None, docs[i], docs[j])
                    matrix[i][j] = round(diff_matcher.ratio() * 100, 1)

        return {
            "cluster_id": cluster_id,
            "claim_ids": claim_ids,
            "patient_names": [item["patient_name"] for item in cluster_items],
            "matrix": matrix,
            "is_mass_clone_detected": any(matrix[i][j] >= 90.0 for i in range(n) for j in range(i + 1, n))
        }

chroma_engine = ChromaSemanticEngine.get_instance()
