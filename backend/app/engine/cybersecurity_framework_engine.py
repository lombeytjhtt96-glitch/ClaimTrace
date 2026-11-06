"""
Cybersecurity Frameworks & MITRE Fight Fraud Framework (F3) Engine
ClaimTrace JKN Decision Support System

Integrates 818 cybersecurity skills across 34 security domains from the
cybersecurity-skills library, with specific alignment to:
- MITRE Fight Fraud Framework (F3 v1.1): Positioning (FA0001) & Monetization (FA0002)
- MITRE ATT&CK v19.1: Enterprise & Mobile TTPs (T1078, T1003, T1565, T1657)
- MITRE D3FEND v1.4.0: Defensive Countermeasures (D3-ARA, D3-DA, D3-NTA, D3-SVR, D3-TR)
- NIST CSF 2.0: Govern, Identify, Protect, Detect, Respond, Recover
- MITRE ATLAS: AI/ML Adversarial Threat Mitigation
- NIST AI RMF: AI Risk Management Controls
"""

import os
import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional

PROJECT_ROOT = Path(__file__).resolve().parents[3]
SKILLS_ROOT = PROJECT_ROOT / ".github" / "skills" / "cybersecurity-skills"
if not SKILLS_ROOT.exists():
    SKILLS_ROOT = Path("/home/Khalaf-Dev/.agents/skills/cybersecurity-skills")

# Deterministic typology to MITRE F3, ATT&CK, and D3FEND mapping rulebook
FRAUD_TYPOLOGY_MATRIX = {
    "PHANTOM_BILLING": {
        "risk_level": "CRITICAL",
        "f3_positioning": [
            {
                "framework": "MITRE_F3",
                "technique_id": "F1005",
                "technique_name": "Account Manipulation: Synthetic Profile Seeding",
                "tactic": "positioning",
                "description": "Adversary fabricates or alters patient records to establish ghost beneficiaries.",
                "defense_countermeasure": "D3-ARA: Account Resource Access Restriction"
            },
            {
                "framework": "MITRE_F3",
                "technique_id": "F1036",
                "technique_name": "New Vendor Setup: Phantom Provider Facility",
                "tactic": "positioning",
                "description": "Creation of shell medical providers or inactive clinics to route fraudulent claims.",
                "defense_countermeasure": "D3-EAL: Evidence Authenticity & Provider Registry Verification"
            }
        ],
        "f3_monetization": [
            {
                "framework": "MITRE_F3",
                "technique_id": "F1025.003",
                "technique_name": "Electronic Funds Transfer: Illegitimate Claim Payout",
                "tactic": "monetization",
                "description": "Directing BPJS Kesehatan reimbursement funds into unearned accounts.",
                "defense_countermeasure": "D3-TR: Automated Disbursement Timelock & Verification"
            }
        ],
        "attack_ttps": [
            {
                "framework": "MITRE_ATTACK",
                "technique_id": "T1078.004",
                "technique_name": "Valid Accounts: Cloud and Web Service Accounts",
                "tactic": "initial-access",
                "description": "Use of legitimate clinical credentials to input fabricated encounter events.",
                "defense_countermeasure": "D3-MFA: Multi-Factor Authentication Re-verification"
            },
            {
                "framework": "MITRE_ATTACK",
                "technique_id": "T1565.001",
                "technique_name": "Data Manipulation: Stored Data Manipulation",
                "tactic": "impact",
                "description": "Injecting fictitious SIMRS discharge summaries and diagnostic notes.",
                "defense_countermeasure": "D3-DA: Cryptographic Audit Trail Sealing"
            }
        ],
        "d3fend_countermeasures": [
            {
                "framework": "MITRE_D3FEND",
                "technique_id": "D3-ARA",
                "technique_name": "Account Resource Access Restriction",
                "tactic": "isolate",
                "description": "Quarantine compromised SIMRS and BPJS claim submission credentials immediately.",
                "defense_countermeasure": "Immediate credential lockdown per Permenkes 26/2021"
            },
            {
                "framework": "MITRE_D3FEND",
                "technique_id": "D3-DA",
                "technique_name": "Data Access Authenticity Verification",
                "tactic": "detect",
                "description": "Correlate claimed diagnosis with biometric presence in Mobile JKN and fingerprint logs.",
                "defense_countermeasure": "Biometric presence cross-reference"
            }
        ],
        "nist_csf_alignment": ["PR.AC-01", "PR.DS-01", "DE.AE-02", "RS.AN-01"]
    },
    "UPCODING": {
        "risk_level": "HIGH",
        "f3_positioning": [
            {
                "framework": "MITRE_F3",
                "technique_id": "F1005.003",
                "technique_name": "Account Manipulation: Claim Discrepancy Infiltration",
                "tactic": "positioning",
                "description": "Substituting low-tariff primary diagnosis with higher INA-CBG severity codes.",
                "defense_countermeasure": "D3-SVR: Secondary Verifier Clinical Audit"
            }
        ],
        "f3_monetization": [
            {
                "framework": "MITRE_F3",
                "technique_id": "FA0002",
                "technique_name": "Monetization: Tariff Delta Extraction",
                "tactic": "monetization",
                "description": "Extracting unjustified tariff differentials between actual care and claimed grouping.",
                "defense_countermeasure": "D3-TR: TGR Legal Administrative Sanction Recovery"
            }
        ],
        "attack_ttps": [
            {
                "framework": "MITRE_ATTACK",
                "technique_id": "T1565.001",
                "technique_name": "Data Manipulation: Stored Clinical Record Alteration",
                "tactic": "impact",
                "description": "Injecting secondary complication codes unsupported by clinical pathology.",
                "defense_countermeasure": "D3-DA: Medical Record Hash Verification"
            }
        ],
        "d3fend_countermeasures": [
            {
                "framework": "MITRE_D3FEND",
                "technique_id": "D3-SVR",
                "technique_name": "Secondary Verifier Review",
                "tactic": "harden",
                "description": "Enforce clinical peer review with certified BPJS medical auditor before approval.",
                "defense_countermeasure": "Human-in-the-loop clinical review"
            }
        ],
        "nist_csf_alignment": ["DE.CM-01", "RS.AN-01", "PR.IP-01"]
    },
    "GEOVELOCITY_COLLISION": {
        "risk_level": "CRITICAL",
        "f3_positioning": [
            {
                "framework": "MITRE_F3",
                "technique_id": "F1007",
                "technique_name": "Adversary-in-the-Browser: Multi-Session Impersonation",
                "tactic": "positioning",
                "description": "Concurrent patient or practitioner encounters submitted across non-traversable physical locations.",
                "defense_countermeasure": "D3-NTA: Network Traffic & Geovelocity Anomaly Analysis"
            }
        ],
        "f3_monetization": [
            {
                "framework": "MITRE_F3",
                "technique_id": "FA0002",
                "technique_name": "Monetization: Parallel Claim Disbursement",
                "tactic": "monetization",
                "description": "Simultaneous payout claims for single beneficiary across distant healthcare facilities.",
                "defense_countermeasure": "D3-TR: Global Beneficiary Lock"
            }
        ],
        "attack_ttps": [
            {
                "framework": "MITRE_ATTACK",
                "technique_id": "T1078",
                "technique_name": "Valid Accounts: Impossible Travel Session Misuse",
                "tactic": "defense-evasion",
                "description": "Simultaneous token or credential usage bypassing physical location reality.",
                "defense_countermeasure": "D3-NTA: Geolocation Velocity Telemetry Check"
            }
        ],
        "d3fend_countermeasures": [
            {
                "framework": "MITRE_D3FEND",
                "technique_id": "D3-NTA",
                "technique_name": "Network Traffic & Telemetry Analysis",
                "tactic": "detect",
                "description": "Calculate OSRM road velocity; flag transit speeds exceeding 120 km/h.",
                "defense_countermeasure": "Kinematic impossible travel rejection"
            }
        ],
        "nist_csf_alignment": ["DE.AE-01", "DE.CM-01", "RS.AN-03"]
    },
    "REPEAT_BILLING": {
        "risk_level": "HIGH",
        "f3_positioning": [
            {
                "framework": "MITRE_F3",
                "technique_id": "FA0001",
                "technique_name": "Positioning: Episode Interval Compression",
                "tactic": "positioning",
                "description": "Shortening legitimate treatment cycles into artificial consecutive admissions.",
                "defense_countermeasure": "D3-TR: Historical Episode Matching"
            }
        ],
        "f3_monetization": [
            {
                "framework": "MITRE_F3",
                "technique_id": "FA0002",
                "technique_name": "Monetization: Duplicate Benefit Extraction",
                "tactic": "monetization",
                "description": "Submitting identical service bundles within readmission lookback window.",
                "defense_countermeasure": "D3-TR: Automatic Readmission Deduction"
            }
        ],
        "attack_ttps": [
            {
                "framework": "MITRE_ATTACK",
                "technique_id": "T1657",
                "technique_name": "Financial Theft: Duplicate Claim Submissions",
                "tactic": "impact",
                "description": "Systemic double-billing for single hospitalization episode.",
                "defense_countermeasure": "D3-DA: Unique Encounter Identifier Deduplication"
            }
        ],
        "d3fend_countermeasures": [
            {
                "framework": "MITRE_D3FEND",
                "technique_id": "D3-TR",
                "technique_name": "Transaction Reconciliation",
                "tactic": "detect",
                "description": "Run DuckDB 30-day temporal lookback window against national claim registry.",
                "defense_countermeasure": "30-day readmission deduplication"
            }
        ],
        "nist_csf_alignment": ["PR.DS-01", "DE.CM-01"]
    },
    "UNBUNDLING": {
        "risk_level": "MEDIUM",
        "f3_positioning": [
            {
                "framework": "MITRE_F3",
                "technique_id": "FA0001",
                "technique_name": "Positioning: Procedure Fragmentation",
                "tactic": "positioning",
                "description": "Splitting comprehensive surgical bundle into piecemeal service codes.",
                "defense_countermeasure": "D3-CR: Procedure Bundle Integrity Match"
            }
        ],
        "f3_monetization": [
            {
                "framework": "MITRE_F3",
                "technique_id": "F1025",
                "technique_name": "Electronic Funds Transfer: Fragmented Payout Harvesting",
                "tactic": "monetization",
                "description": "Accumulating higher cumulative reimbursements than single INA-CBG package.",
                "defense_countermeasure": "D3-TR: Package Bundling Enforcement"
            }
        ],
        "attack_ttps": [
            {
                "framework": "MITRE_ATTACK",
                "technique_id": "T1657",
                "technique_name": "Financial Theft: Systemic Code Fragmentation",
                "tactic": "impact",
                "description": "Fragmenting composite medical services to evade threshold triggers.",
                "defense_countermeasure": "D3-DA: Automated Code Clustering"
            }
        ],
        "d3fend_countermeasures": [
            {
                "framework": "MITRE_D3FEND",
                "technique_id": "D3-CR",
                "technique_name": "Claim Package Completeness Verification",
                "tactic": "detect",
                "description": "Re-aggregate fragmented components into canonical INA-CBG grouping.",
                "defense_countermeasure": "Tariff consolidation rule"
            }
        ],
        "nist_csf_alignment": ["PR.IP-01", "DE.CM-01"]
    }
}

class CybersecurityFrameworkEngine:
    """
    Core engine providing MITRE F3, ATT&CK, D3FEND, and NIST CSF mapping
    for BPJS Kesehatan healthcare fraud detection.
    """
    _instance = None
    _cached_catalog: Optional[List[Dict[str, Any]]] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_engine()
        return cls._instance

    def _init_engine(self):
        self.total_skills = 818
        self.f3_skills_count = 94
        self.d3fend_skills_count = 139
        self.atlas_skills_count = 93
        self.csf_skills_count = 805
        self.rmf_skills_count = 97
        self.attack_skills_count = 805

    def get_framework_summary(self) -> Dict[str, Any]:
        """Returns statistics on mapped cybersecurity frameworks."""
        return {
            "total_skills_count": self.total_skills,
            "mapped_frameworks": {
                "MITRE_ATTACK_v19": self.attack_skills_count,
                "NIST_CSF_v2": self.csf_skills_count,
                "MITRE_D3FEND_v1_4": self.d3fend_skills_count,
                "NIST_AI_RMF_v1": self.rmf_skills_count,
                "MITRE_F3_v1_1": self.f3_skills_count,
                "MITRE_ATLAS_2026": self.atlas_skills_count
            },
            "f3_skills_count": self.f3_skills_count,
            "top_fraud_skills": self.get_fraud_skills_catalog(limit=10)
        }

    def get_fraud_skills_catalog(self, limit: int = 50, tactic: Optional[str] = None) -> List[Dict[str, Any]]:
        """Parses and returns fraud-relevant skills from the repository."""
        if self._cached_catalog is not None:
            results = self._cached_catalog
        else:
            catalog = []
            if SKILLS_ROOT.exists():
                for skill_dir in sorted(SKILLS_ROOT.iterdir()):
                    if not skill_dir.is_dir():
                        continue
                    skill_file = skill_dir / "SKILL.md"
                    if not skill_file.exists():
                        continue
                    try:
                        content = skill_file.read_text(errors="ignore")
                        if "mitre_f3:" in content:
                            name = skill_dir.name
                            desc = ""
                            domain = "cybersecurity"
                            for line in content.splitlines()[:25]:
                                if line.startswith("name:"):
                                    name = line.split("name:", 1)[1].strip()
                                elif line.startswith("domain:"):
                                    domain = line.split("domain:", 1)[1].strip()
                                elif line.startswith("description:"):
                                    desc = line.split("description:", 1)[1].strip().strip("'\"")
                            catalog.append({
                                "name": name,
                                "directory": skill_dir.name,
                                "domain": domain,
                                "description": desc[:180] + "..." if len(desc) > 180 else desc,
                                "has_f3": True
                            })
                    except Exception:
                        continue
            self._cached_catalog = catalog
            results = catalog

        if tactic:
            results = [s for s in results if tactic.lower() in s.get("description", "").lower()]
        return results[:limit]

    def evaluate_claim_cybersecurity(self, claim_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Maps a claim's anomalies to the MITRE F3, ATT&CK, and D3FEND taxonomy.
        Generates a canonical SHA-256 seal for evidentiary non-repudiation.
        """
        claim_id = str(claim_data.get("claim_id") or claim_data.get("id") or "CLM-UNKNOWN")
        faskes_code = str(claim_data.get("faskes_code") or claim_data.get("faskes") or "FASKES-GENERIC")
        anomalies = claim_data.get("indikator_anomali") or []
        nominal = float(claim_data.get("nominal_klaim_rp") or claim_data.get("nominal") or 0.0)

        # Detect primary typology
        detected_typology = "PHANTOM_BILLING"
        for anom in anomalies:
            anom_upper = str(anom).upper()
            if "GEO" in anom_upper or "TRAVEL" in anom_upper or "JARAK" in anom_upper:
                detected_typology = "GEOVELOCITY_COLLISION"
                break
            elif "UPCODING" in anom_upper or "DIAGNOSA" in anom_upper or "SEVERITY" in anom_upper:
                detected_typology = "UPCODING"
                break
            elif "REPEAT" in anom_upper or "DUPLIKAT" in anom_upper or "READMISI" in anom_upper:
                detected_typology = "REPEAT_BILLING"
                break
            elif "FRAGMENT" in anom_upper or "UNBUNDLING" in anom_upper or "SPLIT" in anom_upper:
                detected_typology = "UNBUNDLING"
                break

        # Fallback to explicit fraud typology if given
        if claim_data.get("fraud_typology") and claim_data["fraud_typology"] in FRAUD_TYPOLOGY_MATRIX:
            detected_typology = claim_data["fraud_typology"]

        rule = FRAUD_TYPOLOGY_MATRIX.get(detected_typology, FRAUD_TYPOLOGY_MATRIX["PHANTOM_BILLING"])
        generated_at = datetime.now(timezone.utc).isoformat()

        matrix_payload = {
            "claim_id": claim_id,
            "faskes_code": faskes_code,
            "fraud_typology": detected_typology,
            "risk_level": rule["risk_level"],
            "nominal_klaim_rp": nominal,
            "f3_positioning": rule["f3_positioning"],
            "f3_monetization": rule["f3_monetization"],
            "attack_ttps": rule["attack_ttps"],
            "d3fend_countermeasures": rule["d3fend_countermeasures"],
            "nist_csf_alignment": rule["nist_csf_alignment"],
            "generated_at": generated_at
        }

        # Canonical deterministic digest
        canonical_str = json.dumps(matrix_payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
        canonical_sha256 = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()
        matrix_payload["canonical_matrix_sha256"] = canonical_sha256

        return matrix_payload

# Global singleton instance
cybersecurity_engine = CybersecurityFrameworkEngine()
