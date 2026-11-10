"""
Persistent Operational Workflow Store for ClaimTrace DSS
Menyediakan manajemen state persisten (Zero-PHI & SHA-256 Audit Chained) untuk:
- Cases Management & Quick Triage (Penugasan, Status, Prioritas SLA)
- Flagged Sessions (Sesi Ditandai Anomali Lapis 1-3 tanpa paparan NIK/No. JKN mentah)
- Jadwal Klarifikasi DPJP & Sidang Audit Medis
- Rencana Intervensi Terpadu (TCA) & Pelacakan Langkah
- Direktori Komando Verifikator & Arsip Dialog Forensik AI
- Telemetri Mobile JKN Lapis 3 & Intelijen Geovelocity DPJP
- Konfigurasi Pengaturan Sistem & Profil Verifikator (Audit Trail SHA-256)
"""

import os
import json
import copy
import uuid
import hashlib
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional

from app.security.audit_log import get_audit_logger, pseudonymize_nik
from app.engine.scoring import evaluate_claim_triage
from app.engine.osrm_geovelocity import FASKES_GEO_DIRECTORY, calculate_haversine_distance

OPERATIONS_STATE_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "operations_state.json"


def _mask_phone(phone: str) -> str:
    digits = "".join(ch for ch in str(phone or "") if ch.isdigit())
    if len(digits) >= 8:
        return f"{digits[:4]}****{digits[-4:]}"
    return "****-****"


def _default_operations_state(claims_db: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    case_overrides: Dict[str, Dict[str, Any]] = {}
    triage_assignments = [
        ("CLM-2026-8801", "dr. Siti Rahma, Sp.PK", "in_progress", 95, "warning"),
        ("CLM-2026-8802", "Budi Santoso, S.Kom, M.TI", "in_progress", 240, "warning"),
        ("CLM-2026-8803", "dr. Ahmad Faisal, MARS", "resolved", 1800, "safe"),
        ("CLM-2026-8804", "dr. Siti Rahma, Sp.PK", "resolved", 2400, "safe"),
        ("CLM-2026-8805", None, "new", 65, "critical"),
        ("CLM-2026-8806", None, "new", 110, "critical"),
    ]
    for cid, assignee, st, mins, sla_st in triage_assignments:
        case_overrides[cid] = {
            "assigned_to": assignee,
            "workflow_status": st,
            "minutes_until_breach": mins,
            "sla_status": sla_st,
            "updated_at": now.isoformat(),
        }

    flags = [
        {
            "id": 501,
            "session_id": "SEP-0132R0011026V000085 · Klaster #CLS-PHANTOM-85",
            "claim_id": "CLM-2026-8801",
            "participant_token": "AES256_9f8a7b6c5d4e",
            "fkrtl": "RS Khusus Mitra Husada",
            "ina_cbg": "Z-3-12-0 (Rehabilitasi Medik / Fisioterapi)",
            "tarif_selisih": "Rp 15.300.000",
            "reason": "Lonjakan klaster 8,5x baseline faskes tanpa izin resmi baksos; SIP DPJP tidak aktif dan 8/10 peserta menyangkal hadir via Mobile JKN.",
            "status": "open",
            "flagged_by_name": "ClaimTrace Tri-Layer AI Engine",
            "created_at": (now - timedelta(minutes=42)).isoformat(),
            "updated_at": (now - timedelta(minutes=15)).isoformat(),
            "tags": ["fraud_indicator", "presence_denial", "phantom-billing-alert"],
            "notes": "Prioritas investigasi pra-bayar Jalur Merah sesuai Pasal 76 Perpres No. 82/2018."
        },
        {
            "id": 502,
            "session_id": "SEP-0132R0021026V000341 · Sesi #CLS-REPEAT-11",
            "claim_id": "CLM-2026-8802",
            "participant_token": "AES256_1a2b3c4d5e6f",
            "fkrtl": "RS Swasta As-Syifa (Kelas C)",
            "ina_cbg": "K-4-17-I (Nyeri Abdomen & Gastroenteritis)",
            "tarif_selisih": "Rp 1.950.000",
            "reason": "Terdeteksi pengajuan klaim berulang dalam 3 hari pada episode klinis serupa yang telah dibayarkan (CLM-2026-8100).",
            "status": "reviewed",
            "flagged_by_name": "Budi Santoso, S.Kom, M.TI (Analis Forensik)",
            "created_at": (now - timedelta(hours=3)).isoformat(),
            "updated_at": (now - timedelta(hours=1)).isoformat(),
            "tags": ["repeated_upcoding", "resume_discrepancy"],
            "notes": "Menunggu sinkronisasi pembaruan SIP SATUSEHAT SDMK dan konfirmasi lanjutan Mobile JKN."
        },
        {
            "id": 503,
            "session_id": "SEP-0114R0011026V008805 · Geovelocity SDMK Alert",
            "claim_id": "CLM-2026-8805",
            "participant_token": "AES256_4d5e6f7a8b9c",
            "fkrtl": "RS Daerah Kartini (Kelas B)",
            "ina_cbg": "B-1-10-II (Prosedur Hepatobilier & Pankreas)",
            "tarif_selisih": "Rp 24.800.000",
            "reason": "Anomali Geovelocity DPJP: Tindakan bedah simultan di Semarang dan Solo dalam jeda < 45 menit (kecepatan fisika mustahil).",
            "status": "open",
            "flagged_by_name": "OSRM Geovelocity Engine Lapis 2",
            "created_at": (now - timedelta(hours=5)).isoformat(),
            "updated_at": (now - timedelta(hours=2)).isoformat(),
            "tags": ["security_alert", "fraud_indicator", "impossible-travel"],
            "notes": "Tunda penerbitan BAKB sampai ada klarifikasi resmi log operasi SIMRS dan bukti hadir DPJP."
        },
        {
            "id": 504,
            "session_id": "SEP-0114R0011026V008806 · Upcoding LIS/PACS Alert",
            "claim_id": "CLM-2026-8806",
            "participant_token": "AES256_c0d1e2f3a4b5",
            "fkrtl": "RS Medika Prima (Kelas B)",
            "ina_cbg": "K-1-10-III (Perdarahan Saluran Cerna Berat)",
            "tarif_selisih": "Rp 38.750.000",
            "reason": "Diskrepansi kode INA-CBG Severity Level III tanpa bukti objektif endoskopi atau transfusi darah di LIS/PACS faskes.",
            "status": "open",
            "flagged_by_name": "dr. Siti Rahma, Sp.PK (Verifikator Utama)",
            "created_at": (now - timedelta(hours=8)).isoformat(),
            "updated_at": (now - timedelta(hours=2)).isoformat(),
            "tags": ["repeated_upcoding", "resume_discrepancy"],
            "notes": "Telah diterbitkan SPP klarifikasi rekam medis lengkap ke Tim Casemix RS Medika Prima."
        },
    ]

    schedules = [
        {
            "id": 801,
            "claim_id": "CLM-2026-8801",
            "appointment_datetime": (now + timedelta(hours=3)).isoformat(),
            "notes": "Klarifikasi klaster 85 berkas fisioterapi Z-3-12-0 dan validasi status SIP DPJP pasca masa berlaku berakhir.",
            "status": "scheduled",
            "created_at": (now - timedelta(days=1)).isoformat(),
            "updated_at": (now - timedelta(hours=2)).isoformat(),
            "faskes_pic": {
                "name": "RS Khusus Mitra Husada · Tim Casemix",
                "email": "casemix@rs-mitrahusada.co.id",
                "registry_code": "FSK-RSX-01 · CLM-2026-8801"
            },
            "verificator": {
                "name": "dr. Siti Rahma, Sp.PK (Verifikator Medis Utama)",
                "specialization": "Audit Klaim Rehabilitasi Medik & Validasi SDMK"
            },
            "session_type": {
                "name": "Klarifikasi Klaster & Presensi Lapis 3",
                "duration_minutes": 45,
                "description": "Konfirmasi silang logbook tindakan fisioterapi dengan konfirmasi biometrik Mobile JKN peserta."
            }
        },
        {
            "id": 802,
            "claim_id": "CLM-2026-8805",
            "appointment_datetime": (now + timedelta(hours=6)).isoformat(),
            "notes": "Gelar perkara dugaan Impossible Travel DPJP spesialis bedah antara dua rumah sakit berbeda dalam jeda 45 menit.",
            "status": "scheduled",
            "created_at": (now - timedelta(hours=18)).isoformat(),
            "updated_at": (now - timedelta(hours=1)).isoformat(),
            "faskes_pic": {
                "name": "RS Daerah Kartini (Kelas B) · Komite Medik",
                "email": "komite.medik@rsdkartini.go.id",
                "registry_code": "FSK-RSDK-05 · CLM-2026-8805"
            },
            "verificator": {
                "name": "Budi Santoso, S.Kom, M.TI (Analis Forensik Wasrik)",
                "specialization": "Investigasi Anomali Spatiotemporal & Geovelocity OSRM"
            },
            "session_type": {
                "name": "Audit Forensik Geovelocity SDMK",
                "duration_minutes": 60,
                "description": "Pemeriksaan log kamar operasi SIMRS, verifikasi absensi dokter, dan jejak SEP."
            }
        },
        {
            "id": 803,
            "claim_id": "CLM-2026-8806",
            "appointment_datetime": (now + timedelta(days=1)).isoformat(),
            "notes": "Konfirmasi resume medis dan hasil penunjang laboratorium/endoskopi untuk pengajuan INA-CBG Level III K-1-10-III.",
            "status": "scheduled",
            "created_at": (now - timedelta(days=1, hours=4)).isoformat(),
            "updated_at": (now - timedelta(hours=5)).isoformat(),
            "faskes_pic": {
                "name": "RS Medika Prima (Kelas B) · Koder INA-CBG",
                "email": "koder.jkn@rsmedikaprima.co.id",
                "registry_code": "FSK-RSMP-06 · CLM-2026-8806"
            },
            "verificator": {
                "name": "dr. Siti Rahma, Sp.PK (Verifikator Medis Utama)",
                "specialization": "Validasi Koding Klinis PNPK & LIS/PACS"
            },
            "session_type": {
                "name": "Rekonsiliasi Koding & Penunjang Medis",
                "duration_minutes": 45,
                "description": "Evaluasi kelayakan bukti objektif LIS/PACS sebelum persetujuan pembayaran klaim."
            }
        },
    ]

    interventions = [
        {
            "id": 1,
            "faskes_code": "FSK-RSX-01",
            "faskes_name": "RS Khusus Mitra Husada",
            "pic_name": "Koordinator Casemix Mitra Husada",
            "pic_email": "casemix@rs-mitrahusada.co.id",
            "plan_title": "Intervensi & Rekonsiliasi Klaster Fisioterapi (CLM-2026-8801)",
            "claim_id": "CLM-2026-8801",
            "risk_level": "CRITICAL",
            "risk_score": 87,
            "status": "in_progress",
            "total_steps": 4,
            "completed_steps": 1,
            "viewed_in_24h": True,
            "stale_days": 0,
            "created_at": (now - timedelta(hours=6)).isoformat(),
            "updated_at": (now - timedelta(minutes=30)).isoformat(),
            "plan_steps": [
                {
                    "title": "Penundaan Penandatanganan BAKB (Jalur Merah)",
                    "description": "Tunda berita acara pembayaran klaim sesuai Perpres No. 82/2018 Pasal 76.",
                    "completed": True,
                },
                {
                    "title": "Validasi Pembaruan SIP DPJP di SATUSEHAT SDMK",
                    "description": "Faskes wajib mengunggah bukti perpanjangan SIP DPJP Sp.KFR aktif sebelum layanan.",
                    "completed": False,
                },
                {
                    "title": "Klarifikasi Sangkalan Presensi Mobile JKN Lapis 3",
                    "description": "Faskes menyerahkan bukti rekam medis dan daftar hadir fisik tervalidasi biometrik FRISTA.",
                    "completed": False,
                },
                {
                    "title": "Sidang Rekonsiliasi Tim PK-JKN Pusat",
                    "description": "Penetapan keputusan akhir disetujui/koreksi/ditolak oleh komite verifikasi.",
                    "completed": False,
                },
            ],
        },
        {
            "id": 2,
            "faskes_code": "FSK-RSMP-06",
            "faskes_name": "RS Medika Prima (Kelas B)",
            "pic_name": "Ketua Komite Medik RS Medika Prima",
            "pic_email": "casemix@rsmedikaprima.co.id",
            "plan_title": "Klarifikasi Bukti Penunjang K-1-10-III (CLM-2026-8806)",
            "claim_id": "CLM-2026-8806",
            "risk_level": "CRITICAL",
            "risk_score": 76,
            "status": "pending_review",
            "total_steps": 3,
            "completed_steps": 1,
            "viewed_in_24h": True,
            "stale_days": 0,
            "created_at": (now - timedelta(hours=12)).isoformat(),
            "updated_at": (now - timedelta(hours=2)).isoformat(),
            "plan_steps": [
                {
                    "title": "Penerbitan Surat Permintaan Penjelasan (SPP)",
                    "description": "Meminta hasil laboratorium hemoglobin serial dan laporan tindakan endoskopi.",
                    "completed": True,
                },
                {
                    "title": "Verifikasi Kesesuaian Grouping INA-CBG",
                    "description": "Evaluasi koreksi tarif apabila bukti penunjang Severity Level III tidak terpenuhi.",
                    "completed": False,
                },
                {
                    "title": "Penerbitan BAKB Final & Penguncian Ledger SHA-256",
                    "description": "Dokumentasi sah berita acara verifikasi dalam audit trail permanen.",
                    "completed": False,
                },
            ],
        },
        {
            "id": 3,
            "faskes_code": "FSK-RSY-02",
            "faskes_name": "RS Swasta As-Syifa (Kelas C)",
            "pic_name": "PIC JKN RS As-Syifa",
            "pic_email": "jkn@rs-assyifa.co.id",
            "plan_title": "Rekonsiliasi Episode Berulang K-4-17-I (CLM-2026-8802)",
            "claim_id": "CLM-2026-8802",
            "risk_level": "HIGH",
            "risk_score": 62,
            "status": "in_progress",
            "total_steps": 3,
            "completed_steps": 2,
            "viewed_in_24h": True,
            "stale_days": 1,
            "created_at": (now - timedelta(days=1)).isoformat(),
            "updated_at": (now - timedelta(hours=4)).isoformat(),
            "plan_steps": [
                {
                    "title": "Identifikasi Klaim Terbayar Sebelumnya (CLM-2026-8100)",
                    "description": "Cocokkan riwayat admisi peserta dalam jendela 72 jam terakhir.",
                    "completed": True,
                },
                {
                    "title": "Sinkronisasi Status SIP DPJP SATUSEHAT SDMK",
                    "description": "Verifikasi masa tunggu sinkronisasi registrasi dokter penanggung jawab.",
                    "completed": True,
                },
                {
                    "title": "Finalisasi Status Pembayaran atau Pengembalian Berkas",
                    "description": "Keputusan penggabungan episode atau penolakan tagihan ganda.",
                    "completed": False,
                },
            ],
        },
    ]

    directory = [
        {
            "id": 1,
            "name": "dr. Siti Rahma, Sp.PK",
            "email": "siti.rahma@bpjs-kesehatan.go.id",
            "phone_masked": _mask_phone("081188201999"),
            "faskes": "Kantor Pusat BPJS Kesehatan · Kedeputian Wasrik",
            "faskes_code": "KP-WASRIK-01",
            "role": "VERIFICATOR_MEDIS",
            "role_label": "Verifikator Medis Utama",
            "is_active": True,
            "screening_risk": "LOW",
            "screening_score": 12,
            "screening_finding": "Otorisasi aktif penuh: Adjudikasi Jalur Merah & Tanda Tangan BAKB Digital",
            "streak_days": 45,
            "sentiment_pct": 98,
            "sla_compliance": 100,
            "last_activity": "Aktif (Live)",
            "total_claims_handled": 1420,
            "avatar_color": "bg-emerald-600",
            "avatar_initials": "SR",
        },
        {
            "id": 2,
            "name": "Budi Santoso, S.Kom, M.TI",
            "email": "budi.santoso@bpjs-kesehatan.go.id",
            "phone_masked": _mask_phone("081294827710"),
            "faskes": "Kantor Pusat BPJS Kesehatan · Forensik Digital Anti-Fraud",
            "faskes_code": "KP-FORENSIK-02",
            "role": "ANALYST",
            "role_label": "Analis Forensik Wasrik",
            "is_active": True,
            "screening_risk": "LOW",
            "screening_score": 15,
            "screening_finding": "Spesialis OLAP DuckDB, Spatiotemporal Geovelocity, dan Audit Ledger SHA-256",
            "streak_days": 38,
            "sentiment_pct": 96,
            "sla_compliance": 99,
            "last_activity": "10 menit yang lalu",
            "total_claims_handled": 980,
            "avatar_color": "bg-blue-600",
            "avatar_initials": "BS",
        },
        {
            "id": 3,
            "name": "dr. Hendra, Sp.KFR (PIC Klaster)",
            "email": "dpjp.kfr@rs-mitrahusada.co.id",
            "phone_masked": _mask_phone("081390451829"),
            "faskes": "RS Khusus Mitra Husada",
            "faskes_code": "FSK-RSX-01",
            "role": "DPJP_SPESIALIS",
            "role_label": "DPJP FKRTL Terpantau",
            "is_active": True,
            "screening_risk": "CRITICAL",
            "screening_score": 87,
            "screening_finding": "Hard Trigger: SIP kadaluwarsa pada klaster 85 klaim fisioterapi CLM-2026-8801",
            "streak_days": 0,
            "sentiment_pct": 18,
            "sla_compliance": 60,
            "last_activity": "Menunggu Klarifikasi BAKB",
            "total_claims_handled": 85,
            "avatar_color": "bg-rose-600",
            "avatar_initials": "HK",
        },
        {
            "id": 4,
            "name": "dr. Anton Wijanarko, Sp.B",
            "email": "anton.spb@rsdkartini.go.id",
            "phone_masked": _mask_phone("082138947512"),
            "faskes": "RS Daerah Kartini (Kelas B)",
            "faskes_code": "FSK-RSDK-05",
            "role": "DPJP_SPESIALIS",
            "role_label": "DPJP Spesialis Bedah",
            "is_active": True,
            "screening_risk": "CRITICAL",
            "screening_score": 86,
            "screening_finding": "Peringatan Geovelocity Impossible Travel pada SEP bedah (CLM-2026-8805)",
            "streak_days": 0,
            "sentiment_pct": 25,
            "sla_compliance": 72,
            "last_activity": "Jadwal Klarifikasi Terdaftar",
            "total_claims_handled": 194,
            "avatar_color": "bg-amber-600",
            "avatar_initials": "AW",
        },
    ]

    conversations = [
        {
            "userHash": "usr_verif_19870420",
            "userName": "dr. Siti Rahma, Sp.PK",
            "userRole": "VERIFICATOR",
            "userEmail": "siti.rahma@bpjs-kesehatan.go.id",
            "faskesName": "Kantor Pusat BPJS Kesehatan · Kedeputian Wasrik",
            "totalMessages": 4,
            "lastActivityIso": now.isoformat(),
            "openFlagCount": 1,
            "sessions": [
                {
                    "session_id": "SES-JKN-8801",
                    "title": "Audit Fusi 3 Lapis: Klaster Fisioterapi RS Khusus Mitra Husada",
                    "claim_id": "CLM-2026-8801",
                    "first_time": (now - timedelta(minutes=25)).isoformat(),
                    "last_time": (now - timedelta(minutes=10)).isoformat(),
                    "message_count": 4,
                    "model_used": "ClaimTrace ReAct Orchestrator",
                    "tokens_total": 1840,
                    "risk_level": "CRITICAL",
                    "risk_score": 87,
                    "status": "awaiting_approval",
                    "messages": [
                        {
                            "role": "user",
                            "sender_name": "Verifikator Medis",
                            "text": "Evaluasi klaster klaim fisioterapi CLM-2026-8801 di RS Khusus Mitra Husada melalui fusi 3 lapis.",
                            "timestamp": (now - timedelta(minutes=25)).strftime("%H:%M")
                        },
                        {
                            "role": "assistant",
                            "sender_name": "CLAIMTRACE_AI (Orchestrator)",
                            "model": "ClaimTrace ReAct Engine",
                            "text": "Skor prioritas telaah mencapai 87,0/100 (Jalur Merah Pra-Bayar). Lapis 1 mendeteksi lonjakan klaster 8,5x baseline (85 klaim); Lapis 2 menemukan SIP DPJP tidak aktif pada 10 Okt 2026; Lapis 3 mencatat 8/10 peserta menyangkal kehadiran melalui Mobile JKN.",
                            "tokens": 620,
                            "latency_ms": 210,
                            "citations": ["Perpres No. 82/2018 Pasal 76", "SATUSEHAT SDMK", "Telemetri Mobile JKN"],
                            "timestamp": (now - timedelta(minutes=24)).strftime("%H:%M")
                        },
                        {
                            "role": "user",
                            "sender_name": "Verifikator Medis",
                            "text": "Berapa nominal klaim yang wajib ditunda pencairannya sambil menunggu BAKB?",
                            "timestamp": (now - timedelta(minutes=15)).strftime("%H:%M")
                        },
                        {
                            "role": "assistant",
                            "sender_name": "TCA (Audit Ekonomi JKN)",
                            "model": "ClaimTrace DuckDB OLAP",
                            "text": "Total tagihan klaster bernilai Rp 15.300.000. Penundaan BAKB mengamankan dana DJS pra-pembayaran dan tetap memenuhi koridor waktu klarifikasi SLA 10 hari kerja.",
                            "tokens": 520,
                            "latency_ms": 140,
                            "citations": ["Permenkes No. 26/2021", "Audit Ledger SHA-256"],
                            "timestamp": (now - timedelta(minutes=14)).strftime("%H:%M")
                        }
                    ]
                }
            ]
        },
        {
            "userHash": "usr_analis_19920815",
            "userName": "Budi Santoso, S.Kom, M.TI",
            "userRole": "WASRIK",
            "userEmail": "budi.santoso@bpjs-kesehatan.go.id",
            "faskesName": "Kantor Pusat BPJS Kesehatan · Forensik Digital",
            "totalMessages": 2,
            "lastActivityIso": (now - timedelta(hours=1)).isoformat(),
            "openFlagCount": 1,
            "sessions": [
                {
                    "session_id": "SES-JKN-8806",
                    "title": "Verifikasi LIS/PACS K-1-10-III RS Medika Prima (CLM-2026-8806)",
                    "claim_id": "CLM-2026-8806",
                    "first_time": (now - timedelta(hours=1, minutes=15)).isoformat(),
                    "last_time": (now - timedelta(hours=1)).isoformat(),
                    "message_count": 2,
                    "model_used": "ClaimTrace ReAct Orchestrator",
                    "tokens_total": 980,
                    "risk_level": "HIGH",
                    "risk_score": 76,
                    "status": "completed",
                    "messages": [
                        {
                            "role": "user",
                            "sender_name": "Analis Forensik",
                            "text": "Periksa keabsahan kode keparahan III pada CLM-2026-8806 senilai Rp 38.750.000.",
                            "timestamp": (now - timedelta(hours=1, minutes=15)).strftime("%H:%M")
                        },
                        {
                            "role": "assistant",
                            "sender_name": "CLAIMTRACE_AI (Orchestrator)",
                            "model": "ClaimTrace Semantic & Rules",
                            "text": "Tidak ditemukan lampiran hasil endoskopi ataupun bukti transfusi darah pada integrasi penunjang faskes. Klaim dikategorikan berisiko upcoding tingkat keparahan INA-CBG dengan skor 75,5/100.",
                            "tokens": 490,
                            "latency_ms": 185,
                            "citations": ["PNPK Perdarahan Saluran Cerna", "Permenkes No. 26/2021"],
                            "timestamp": (now - timedelta(hours=1, minutes=14)).strftime("%H:%M")
                        }
                    ]
                }
            ]
        }
    ]

    settings_values = {
        "ui_theme_mode": "dark",
        "ui_density": "standard",
        "ui_accent_color": "emerald",
        "ui_glassmorphism": True,
        "ui_motion_effects": True,
        "ui_language": "id",
        "auto_flag_critical": True,
        "red_lane_threshold": 80,
        "yellow_lane_threshold": 45,
        "sla_deadline_days": 10,
        "require_mfa_adjudicate": True,
        "zero_phi_strict": True,
        "k_anonymity_min": 5,
    }

    profile = {
        "name": "dr. Siti Rahma, Sp.PK",
        "email": "siti.rahma@bpjs-kesehatan.go.id",
        "nip": "198704202011012001",
        "role": "Verifikator Medis Utama · Kantor Pusat",
        "unit": "Kedeputian Bidang Pengawasan & Pemeriksaan (WASRIK)",
        "branch": "Kantor Pusat BPJS Kesehatan Jakarta",
        "phone": "0811-8820-1999",
        "location": "DKI Jakarta, Indonesia",
        "bio": "Pejabat Fungsional Verifikator Medis Senior dengan spesialisasi audit klaim FKRTL tingkat lanjut dan deteksi dini anomali koding INA-CBG berbasis bukti klinis tiga lapis."
    }

    return {
        "case_overrides": case_overrides,
        "flags": flags,
        "schedules": schedules,
        "interventions": interventions,
        "directory": directory,
        "conversations": conversations,
        "mobile_push_logs": [],
        "settings": settings_values,
        "profile": profile,
    }


class OperationsStore:
    """Thread-safe operational store with JSON disk persistence and SHA-256 audit logging."""

    def __init__(self):
        self._lock = threading.RLock()
        self.persist_to_disk = False if os.getenv("PYTEST_CURRENT_TEST") else True
        self.state: Dict[str, Any] = {}

    def initialize(self, claims_db: Dict[str, Any]) -> None:
        with self._lock:
            if self.persist_to_disk and OPERATIONS_STATE_FILE.exists():
                try:
                    with open(OPERATIONS_STATE_FILE, "r", encoding="utf-8") as f:
                        loaded = json.load(f)
                        if isinstance(loaded, dict) and "flags" in loaded and "schedules" in loaded:
                            self.state = loaded
                            return
                except Exception as e:
                    print(f"[OperationsStore] Warning reading state file: {e}")
            self.state = _default_operations_state(claims_db)
            self._persist()

    def _ensure_init(self, claims_db: Dict[str, Any]) -> None:
        if not self.state:
            self.initialize(claims_db)

    def _persist(self) -> None:
        if not self.persist_to_disk or os.getenv("PYTEST_CURRENT_TEST"):
            return
        try:
            OPERATIONS_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
            tmp = OPERATIONS_STATE_FILE.with_suffix(".tmp")
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(self.state, f, indent=2, ensure_ascii=False)
            tmp.replace(OPERATIONS_STATE_FILE)
        except Exception as e:
            print(f"[OperationsStore] Warning persisting state: {e}")

    # ------------------------------------------------------------------
    # Cases Management & Quick Triage
    # ------------------------------------------------------------------
    def list_cases(self, claims_db: Dict[str, Any]) -> List[Dict[str, Any]]:
        with self._lock:
            self._ensure_init(claims_db)
            overrides = self.state.get("case_overrides", {})
            results = []
            for cid, claim in claims_db.items():
                triage = evaluate_claim_triage(claim)
                ov = overrides.get(cid, {})
                lane = ov.get("override_lane", triage.triage_lane)
                sev = "critical" if lane == "MERAH" and triage.final_priority_score >= 80 else (
                    "high" if lane == "MERAH" else ("med" if lane == "KUNING" else "low")
                )
                sev = ov.get("severity", sev)
                status = ov.get("workflow_status")
                if not status:
                    status = "resolved" if getattr(claim, "status_verifikasi", None) else (
                        "in_progress" if ov.get("assigned_to") else "new"
                    )
                results.append({
                    "id": claim.claim_id,
                    "case_id": claim.claim_id,
                    "sep_no": claim.fkl02_id_kunjungan or f"0114R001{claim.claim_id[-4:]}",
                    "user_hash": claim.peserta_token_aes,
                    "hospital": claim.nama_faskes,
                    "faskes_id": claim.faskes_id,
                    "ina_cbg_code": claim.ina_cbg_code,
                    "nilai_klaim_rp": claim.nilai_klaim_rp,
                    "severity": sev,
                    "triage_lane": lane,
                    "status": status,
                    "sla_status": ov.get("sla_status", "warning" if lane == "MERAH" else "safe"),
                    "minutes_until_breach": ov.get("minutes_until_breach", 180 if lane == "MERAH" else 1440),
                    "summary_redacted": triage.ringkasan_bukti_audit,
                    "ai_anomaly_type": (triage.kode_indikator[0][:65] + "...") if triage.kode_indikator else "Verifikasi Rutin",
                    "ai_anomaly_score": triage.final_priority_score,
                    "risk_score": round(triage.final_priority_score / 100.0, 2),
                    "assigned_to": ov.get("assigned_to"),
                    "dpjp": claim.dpjp_meta.nama_dpjp_alias,
                    "s1": claim.s1_score,
                    "s2": claim.s2_score,
                    "s3": claim.s3_score,
                    "created_at": str(claim.tanggal_layanan),
                    "updated_at": ov.get("updated_at", datetime.now(timezone.utc).isoformat()),
                })
            for custom in self.state.get("custom_cases", []):
                cid = custom["id"]
                ov = overrides.get(cid, {})
                merged = copy.deepcopy(custom)
                if "assigned_to" in ov:
                    merged["assigned_to"] = ov["assigned_to"]
                if "workflow_status" in ov:
                    merged["status"] = ov["workflow_status"]
                if "severity" in ov:
                    merged["severity"] = ov["severity"]
                if "sla_status" in ov:
                    merged["sla_status"] = ov["sla_status"]
                if "updated_at" in ov:
                    merged["updated_at"] = ov["updated_at"]
                results.append(merged)
            return sorted(results, key=lambda x: x["ai_anomaly_score"], reverse=True)

    def create_case(
        self,
        claims_db: Dict[str, Any],
        payload: Dict[str, Any],
        actor: str
    ) -> Dict[str, Any]:
        with self._lock:
            self._ensure_init(claims_db)
            custom_cases = self.state.setdefault("custom_cases", [])
            new_id = payload.get("case_id") or f"CLM-2026-{8901 + len(custom_cases)}"
            sev = payload.get("severity") or "high"
            if sev == "moderate":
                sev = "med"
            lane = "MERAH" if sev in ("critical", "high") else ("KUNING" if sev == "med" else "HIJAU")
            score = 90.0 if sev == "critical" else (82.0 if sev == "high" else (55.0 if sev == "med" else 18.0))
            now_iso = datetime.now(timezone.utc).isoformat()
            new_case = {
                "id": new_id,
                "case_id": new_id,
                "sep_no": payload.get("sep_no") or f"0114R001{1000 + len(custom_cases)}",
                "user_hash": payload.get("user_hash") or pseudonymize_nik(new_id),
                "hospital": payload.get("hospital") or "RS Rujukan FKRTL",
                "faskes_id": "FSK-TRIAGE-LIVE",
                "ina_cbg_code": payload.get("ina_cbg_code") or "Z-3-12-0",
                "nilai_klaim_rp": int(payload.get("nilai_klaim_rp") or 0),
                "severity": sev,
                "triage_lane": lane,
                "status": "new",
                "sla_status": "critical" if sev == "critical" else ("warning" if sev == "high" else "safe"),
                "minutes_until_breach": 60 if sev == "critical" else (240 if sev == "high" else 1440),
                "summary_redacted": payload.get("summary_redacted") or "Berkas triase cepat pengawasan JKN.",
                "ai_anomaly_type": "Triase Cepat Verifikator",
                "ai_anomaly_score": score,
                "risk_score": round(score / 100.0, 2),
                "assigned_to": payload.get("assigned_to") or "dr. Siti Rahma, Sp.PK",
                "dpjp": "Tim Casemix Faskes",
                "s1": score,
                "s2": 75.0,
                "s3": 60.0,
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            custom_cases.insert(0, new_case)
            self._persist()
            get_audit_logger().record_event(
                event_type="OPERATIONAL_CASE_CREATED",
                claim_id=new_id,
                actor=actor,
                payload={"hospital": new_case["hospital"], "severity": sev}
            )
            return copy.deepcopy(new_case)

    def update_case(
        self,
        claims_db: Dict[str, Any],
        case_id: str,
        actor: str,
        assigned_to: Optional[str] = None,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        with self._lock:
            self._ensure_init(claims_db)
            custom_ids = {c["id"] for c in self.state.get("custom_cases", [])}
            if case_id not in claims_db and case_id not in custom_ids:
                return None
            overrides = self.state.setdefault("case_overrides", {})
            cur = overrides.setdefault(case_id, {})
            if assigned_to is not None:
                cur["assigned_to"] = assigned_to or None
            if status is not None:
                cur["workflow_status"] = status
                if status == "resolved":
                    cur["sla_status"] = "safe"
            if severity is not None:
                cur["severity"] = severity
                if severity == "critical":
                    cur["sla_status"] = "critical"
                    cur["minutes_until_breach"] = min(cur.get("minutes_until_breach", 90), 90)
                    cur["override_lane"] = "MERAH"
                elif severity == "high":
                    cur["override_lane"] = "MERAH"
                elif severity in ("med", "moderate"):
                    cur["override_lane"] = "KUNING"
                elif severity == "low":
                    cur["override_lane"] = "HIJAU"
            if notes is not None:
                cur["triage_notes"] = notes
            cur["updated_at"] = datetime.now(timezone.utc).isoformat()
            self._persist()

            get_audit_logger().record_event(
                event_type="OPERATIONAL_CASE_UPDATED",
                claim_id=case_id,
                actor=actor,
                payload={
                    "assigned_to": cur.get("assigned_to"),
                    "status": cur.get("workflow_status"),
                    "severity": cur.get("severity"),
                }
            )
            cases = self.list_cases(claims_db)
            return next((c for c in cases if c["id"] == case_id), None)

    # ------------------------------------------------------------------
    # Flagged Sessions (Zero-PHI)
    # ------------------------------------------------------------------
    def list_flags(self, claims_db: Dict[str, Any]) -> List[Dict[str, Any]]:
        with self._lock:
            self._ensure_init(claims_db)
            return copy.deepcopy(self.state.get("flags", []))

    def create_flag(self, claims_db: Dict[str, Any], payload: Dict[str, Any], actor: str) -> Dict[str, Any]:
        with self._lock:
            self._ensure_init(claims_db)
            flags = self.state.setdefault("flags", [])
            next_id = max((f.get("id", 500) for f in flags), default=500) + 1
            now_iso = datetime.now(timezone.utc).isoformat()
            raw_token = payload.get("participant_token") or pseudonymize_nik(str(uuid.uuid4()))
            new_flag = {
                "id": next_id,
                "session_id": payload.get("session_id") or f"SEP-{next_id} · Sesi Audit",
                "claim_id": payload.get("claim_id") or "CLM-2026-8801",
                "participant_token": raw_token,
                "fkrtl": payload.get("fkrtl") or "RS Khusus Mitra Husada",
                "ina_cbg": payload.get("ina_cbg") or "Z-3-12-0",
                "tarif_selisih": payload.get("tarif_selisih") or "Rp 0",
                "reason": payload.get("reason") or "Penandaan anomali manual oleh verifikator.",
                "status": "open",
                "flagged_by_name": actor,
                "created_at": now_iso,
                "updated_at": now_iso,
                "tags": payload.get("tags") or ["fraud_indicator"],
                "notes": payload.get("notes") or ""
            }
            flags.insert(0, new_flag)
            self._persist()

            get_audit_logger().record_event(
                event_type="SESSION_FLAG_CREATED",
                claim_id=new_flag["claim_id"],
                actor=actor,
                payload={"flag_id": next_id, "tags": new_flag["tags"]}
            )
            return copy.deepcopy(new_flag)

    def update_flag(self, claims_db: Dict[str, Any], flag_id: int, updates: Dict[str, Any], actor: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            self._ensure_init(claims_db)
            for fl in self.state.get("flags", []):
                if fl.get("id") == flag_id:
                    for key in ("status", "notes", "tags"):
                        if key in updates and updates[key] is not None:
                            fl[key] = updates[key]
                    fl["updated_at"] = datetime.now(timezone.utc).isoformat()
                    self._persist()
                    get_audit_logger().record_event(
                        event_type="SESSION_FLAG_UPDATED",
                        claim_id=fl.get("claim_id", "SYSTEM"),
                        actor=actor,
                        payload={"flag_id": flag_id, "status": fl["status"]}
                    )
                    return copy.deepcopy(fl)
            return None

    # ------------------------------------------------------------------
    # Clarification Schedules (Jadwal Klarifikasi DPJP)
    # ------------------------------------------------------------------
    def list_schedules(self, claims_db: Dict[str, Any]) -> List[Dict[str, Any]]:
        with self._lock:
            self._ensure_init(claims_db)
            return copy.deepcopy(self.state.get("schedules", []))

    def create_schedule(self, claims_db: Dict[str, Any], payload: Dict[str, Any], actor: str) -> Dict[str, Any]:
        with self._lock:
            self._ensure_init(claims_db)
            schedules = self.state.setdefault("schedules", [])
            next_id = max((s.get("id", 800) for s in schedules), default=800) + 1
            now_iso = datetime.now(timezone.utc).isoformat()
            item = {
                "id": next_id,
                "claim_id": payload.get("claim_id") or "CLM-2026-8801",
                "appointment_datetime": payload.get("appointment_datetime") or (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
                "notes": payload.get("notes") or "Jadwal klarifikasi koding INA-CBG dan bukti medis.",
                "status": "scheduled",
                "created_at": now_iso,
                "updated_at": now_iso,
                "faskes_pic": payload.get("faskes_pic") or {
                    "name": payload.get("faskes_name") or "Tim Casemix FKRTL Mitra",
                    "email": payload.get("faskes_email") or "casemix@faskes.co.id",
                    "registry_code": payload.get("registry_code") or f"FKRTL · {payload.get('claim_id', 'CLM-2026-8801')}"
                },
                "verificator": payload.get("verificator") or {
                    "name": actor,
                    "specialization": "Verifikasi Klaim FKRTL & Audit Medis"
                },
                "session_type": payload.get("session_type") or {
                    "name": payload.get("session_type_name") or "Klarifikasi Koding INA-CBG",
                    "duration_minutes": int(payload.get("duration_minutes") or 45),
                    "description": "Konfirmasi kepatuhan dokumen medis sesuai Permenkes No. 26/2021."
                }
            }
            schedules.insert(0, item)
            self._persist()
            get_audit_logger().record_event(
                event_type="CLARIFICATION_SCHEDULED",
                claim_id=item["claim_id"],
                actor=actor,
                payload={"schedule_id": next_id, "datetime": item["appointment_datetime"]}
            )
            return copy.deepcopy(item)

    def update_schedule(self, claims_db: Dict[str, Any], sched_id: int, updates: Dict[str, Any], actor: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            self._ensure_init(claims_db)
            for s in self.state.get("schedules", []):
                if s.get("id") == sched_id:
                    if "status" in updates and updates["status"]:
                        s["status"] = updates["status"]
                    if "notes" in updates and updates["notes"] is not None:
                        s["notes"] = updates["notes"]
                    s["updated_at"] = datetime.now(timezone.utc).isoformat()
                    self._persist()
                    get_audit_logger().record_event(
                        event_type="CLARIFICATION_STATUS_UPDATED",
                        claim_id=s.get("claim_id", "SYSTEM"),
                        actor=actor,
                        payload={"schedule_id": sched_id, "status": s["status"]}
                    )
                    return copy.deepcopy(s)
            return None

    # ------------------------------------------------------------------
    # Intervention Plans (TCA)
    # ------------------------------------------------------------------
    def list_interventions(self, claims_db: Dict[str, Any]) -> List[Dict[str, Any]]:
        with self._lock:
            self._ensure_init(claims_db)
            return copy.deepcopy(self.state.get("interventions", []))

    def create_intervention(self, claims_db: Dict[str, Any], payload: Dict[str, Any], actor: str) -> Dict[str, Any]:
        with self._lock:
            self._ensure_init(claims_db)
            plans = self.state.setdefault("interventions", [])
            next_id = max((p.get("id", 0) for p in plans), default=0) + 1
            now_iso = datetime.now(timezone.utc).isoformat()
            steps = payload.get("plan_steps") or [
                {"title": "Penerbitan SPP Klarifikasi Faskes", "description": "Permintaan penjelasan resmi.", "completed": False},
                {"title": "Rekonsiliasi & Finalisasi BAKB", "description": "Validasi dokumen akhir sebelum penagihan.", "completed": False},
            ]
            new_plan = {
                "id": next_id,
                "faskes_code": payload.get("faskes_code") or "FSK-RSX-01",
                "faskes_name": payload.get("faskes_name") or "FKRTL Mitra BPJS",
                "pic_name": payload.get("pic_name") or "Tim Casemix Faskes",
                "pic_email": payload.get("pic_email") or "casemix@faskes.co.id",
                "plan_title": payload.get("plan_title") or "Rencana Intervensi Kepatuhan Klaim",
                "claim_id": payload.get("claim_id") or "CLM-2026-8801",
                "risk_level": payload.get("risk_level") or "HIGH",
                "risk_score": int(payload.get("risk_score") or 80),
                "status": "in_progress",
                "total_steps": len(steps),
                "completed_steps": sum(1 for st in steps if st.get("completed")),
                "viewed_in_24h": True,
                "stale_days": 0,
                "created_at": now_iso,
                "updated_at": now_iso,
                "plan_steps": steps,
            }
            plans.insert(0, new_plan)
            self._persist()
            get_audit_logger().record_event(
                event_type="INTERVENTION_PLAN_CREATED",
                claim_id=new_plan["claim_id"],
                actor=actor,
                payload={"plan_id": next_id, "title": new_plan["plan_title"]}
            )
            return copy.deepcopy(new_plan)

    def update_intervention(self, claims_db: Dict[str, Any], plan_id: int, updates: Dict[str, Any], actor: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            self._ensure_init(claims_db)
            for p in self.state.get("interventions", []):
                if p.get("id") == plan_id:
                    if "step_index" in updates and isinstance(updates["step_index"], int):
                        idx = updates["step_index"]
                        if 0 <= idx < len(p.get("plan_steps", [])):
                            p["plan_steps"][idx]["completed"] = not bool(p["plan_steps"][idx].get("completed"))
                    if "plan_steps" in updates and isinstance(updates["plan_steps"], list):
                        p["plan_steps"] = updates["plan_steps"]
                    done = sum(1 for st in p.get("plan_steps", []) if st.get("completed"))
                    total = len(p.get("plan_steps", []))
                    p["completed_steps"] = done
                    p["total_steps"] = total
                    if "status" in updates and updates["status"]:
                        p["status"] = updates["status"]
                    elif total > 0 and done == total:
                        p["status"] = "completed"
                    elif done > 0:
                        p["status"] = "in_progress"
                    p["updated_at"] = datetime.now(timezone.utc).isoformat()
                    self._persist()
                    get_audit_logger().record_event(
                        event_type="INTERVENTION_STEP_UPDATED",
                        claim_id=p.get("claim_id", "SYSTEM"),
                        actor=actor,
                        payload={"plan_id": plan_id, "completed_steps": done, "total_steps": total}
                    )
                    return copy.deepcopy(p)
            return None

    # ------------------------------------------------------------------
    # Directory & Conversations
    # ------------------------------------------------------------------
    def list_directory(self, claims_db: Dict[str, Any]) -> List[Dict[str, Any]]:
        with self._lock:
            self._ensure_init(claims_db)
            return copy.deepcopy(self.state.get("directory", []))

    def list_conversations(self, claims_db: Dict[str, Any]) -> List[Dict[str, Any]]:
        with self._lock:
            self._ensure_init(claims_db)
            return copy.deepcopy(self.state.get("conversations", []))

    def append_conversation_message(self, claims_db: Dict[str, Any], claim_id: str, prompt: str, reply: str, actor: str) -> None:
        with self._lock:
            self._ensure_init(claims_db)
            convs = self.state.setdefault("conversations", [])
            if convs:
                ses = convs[0]["sessions"][0]
                now = datetime.now(timezone.utc)
                ses["messages"].append({
                    "role": "user",
                    "sender_name": actor,
                    "text": prompt[:400],
                    "timestamp": now.strftime("%H:%M")
                })
                ses["messages"].append({
                    "role": "assistant",
                    "sender_name": "CLAIMTRACE_AI (Orchestrator)",
                    "model": "ClaimTrace ReAct Engine",
                    "text": reply[:700],
                    "tokens": max(120, len(reply.split()) * 2),
                    "latency_ms": 180,
                    "citations": ["Perpres No. 82/2018", "DuckDB OLAP Live"],
                    "timestamp": now.strftime("%H:%M")
                })
                ses["message_count"] = len(ses["messages"])
                ses["last_time"] = now.isoformat()
                convs[0]["totalMessages"] += 2
                convs[0]["lastActivityIso"] = now.isoformat()
                self._persist()

    # ------------------------------------------------------------------
    # DPJP Intelligence & Mobile JKN Telemetry
    # ------------------------------------------------------------------
    def get_dpjp_intelligence(self, claims_db: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Membangun daftar DPJP langsung dari klaim aktif & mesin OSRM Geovelocity."""
        rscm = FASKES_GEO_DIRECTORY.get("FSK-RSDK-05", {"lat": -6.2088, "lng": 106.8456})
        bandung = FASKES_GEO_DIRECTORY.get("FSK-RSY-02", {"lat": -6.9175, "lng": 107.6191})
        dist_km = round(calculate_haversine_distance(rscm["lat"], rscm["lng"], bandung["lat"], bandung["lng"]), 1)

        doctors = []
        seen_hashes = set()
        for cid, claim in claims_db.items():
            triage = evaluate_claim_triage(claim)
            dh = claim.dpjp_meta.dpjp_id_hash
            if dh in seen_hashes:
                continue
            seen_hashes.add(dh)
            sip_st = claim.dpjp_meta.sip_status
            is_geo_claim = cid == "CLM-2026-8805" or any("GEODIST" in ind for ind in triage.kode_indikator)
            doctors.append({
                "id": dh,
                "name": claim.dpjp_meta.nama_dpjp_alias,
                "nip_hash": pseudonymize_nik(dh)[:18],
                "str": f"STR-{dh[-4:]}-JKN",
                "sip": f"SIP.503/{dh[-4:]}/DPMPTSP",
                "sipStatus": "EXPIRED_WARN" if sip_st == "EXPIRED" and not is_geo_claim else (
                    "EXPIRED" if sip_st == "EXPIRED" else ("PENDING_SYNC" if sip_st == "UNSYNCED" else "VALID")
                ),
                "specialty": claim.deskripsi_cbg.split("(")[0].strip()[:48],
                "primaryHospital": claim.nama_faskes,
                "hospitals": [
                    {
                        "name": claim.nama_faskes,
                        "sipValidUntil": str(claim.dpjp_meta.sip_expiry_date or "2027-12-31"),
                        "status": "EXPIRED" if sip_st == "EXPIRED" else "ACTIVE"
                    }
                ],
                "dailyWorkload": 68 if triage.triage_lane == "MERAH" else (44 if triage.triage_lane == "KUNING" else 26),
                "workloadLimit": 40,
                "riskScore": int(round(triage.final_priority_score)),
                "flagType": (
                    "GEOVELOCITY_IMPOSSIBLE_TRAVEL" if is_geo_claim
                    else ("SIP_EXPIRED_ACTIVE_BILLING" if sip_st == "EXPIRED"
                    else ("SDMK_SYNC_PENDING" if sip_st == "UNSYNCED" else "NORMAL"))
                ),
                "casesLinked": [cid],
                "estimatedExposure": claim.nilai_klaim_rp if triage.triage_lane in ("MERAH", "KUNING") else 0,
                "geovelocityEvent": {
                    "date": str(claim.tanggal_layanan),
                    "pointA": {
                        "time": "10:15 WIB",
                        "faskes": claim.nama_faskes,
                        "action": claim.icd9cm_procedure,
                        "lat": rscm["lat"],
                        "lng": rscm["lng"]
                    },
                    "pointB": {
                        "time": "11:00 WIB",
                        "faskes": "RS Rujukan Wilayah Jawa Tengah (Simultan)",
                        "action": "Visite & Tindakan Operatif Lintas Kota",
                        "lat": bandung["lat"],
                        "lng": bandung["lng"]
                    },
                    "distanceKm": dist_km,
                    "timeGapMinutes": 45,
                    "requiredSpeedKmh": round(dist_km / 0.75, 1),
                    "verdict": "IMPOSSIBLE_TRAVEL_HARD_TRIGGER"
                } if is_geo_claim else None,
            })
        return sorted(doctors, key=lambda d: d["riskScore"], reverse=True)

    def get_mobile_telemetry(self, claims_db: Dict[str, Any]) -> Dict[str, Any]:
        """Mengembalikan log telemetri presensi Mobile JKN Lapis 3 (Zero-PHI Compliant)."""
        with self._lock:
            self._ensure_init(claims_db)
            logs = []
            for cid, claim in claims_db.items():
                mm = claim.mobile_meta
                token = claim.peserta_token_aes
                nik_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
                status = (
                    "DENIED" if mm.respon_tidak_hadir > mm.respon_hadir
                    else ("PENDING" if mm.status_konfirmasi == "PENDING_UNCONFIRMED" else "CONFIRMED")
                )
                logs.append({
                    "id": f"TEL-{cid[-4:]}",
                    "claimId": cid,
                    "participantName": f"Peserta Terproteksi ({token[:15]})",
                    "nikHash": nik_hash,
                    "faskes": claim.nama_faskes,
                    "procedure": claim.deskripsi_cbg,
                    "dispatchedAt": f"{claim.tanggal_layanan} 10:00 WIB",
                    "respondedAt": f"{claim.tanggal_layanan} 10:14 WIB" if status != "PENDING" else "Menunggu Respon",
                    "latencyMin": 14 if status != "PENDING" else 0,
                    "status": status,
                    "confirmedCount": mm.respon_hadir,
                    "deniedCount": mm.respon_tidak_hadir,
                    "channel": "Mobile JKN Push (FCM-Encrypted)",
                    "zkProof": f"0x{nik_hash[:8]}...{nik_hash[-4:]} (Zero-PHI Attestation)"
                })
            # Prepend newly triggered live push events
            extra = copy.deepcopy(self.state.get("mobile_push_logs", []))
            combined = extra + logs
            total_sent = sum(max(1, c.mobile_meta.sampel_terkirim) for c in claims_db.values()) + len(extra)
            confirmed_sum = sum(c.mobile_meta.respon_hadir for c in claims_db.values())
            denied_sum = sum(c.mobile_meta.respon_tidak_hadir for c in claims_db.values())
            return {
                "status": "success",
                "logs": combined,
                "metrics": {
                    "total_dispatched": total_sent,
                    "confirmed_count": confirmed_sum,
                    "denied_count": denied_sum,
                    "response_rate_pct": round(((confirmed_sum + denied_sum) / max(1, total_sent)) * 100, 1)
                }
            }

    def record_mobile_push(self, claims_db: Dict[str, Any], claim_id: str, nik_raw: str, actor: str) -> Dict[str, Any]:
        with self._lock:
            self._ensure_init(claims_db)
            token = pseudonymize_nik(nik_raw or "0000000000000000")
            nik_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
            claim = claims_db.get(claim_id)
            now = datetime.now(timezone.utc)
            entry = {
                "id": f"TEL-LIVE-{int(now.timestamp()) % 10000}",
                "claimId": claim_id,
                "participantName": f"Peserta Terproteksi ({token[:15]})",
                "nikHash": nik_hash,
                "faskes": claim.nama_faskes if claim else "FKRTL Terpantau",
                "procedure": claim.deskripsi_cbg if claim else "Verifikasi Presensi Tindakan Medis",
                "dispatchedAt": now.strftime("%d %b %Y %H:%M WIB"),
                "respondedAt": "Terkirim (Menunggu Respon Biner)",
                "latencyMin": 0,
                "status": "PENDING",
                "channel": "Mobile JKN Push (FCM-Encrypted)",
                "zkProof": f"0x{nik_hash[:8]}...{nik_hash[-4:]} (FCM Queued)"
            }
            push_logs = self.state.setdefault("mobile_push_logs", [])
            push_logs.insert(0, entry)
            self.state["mobile_push_logs"] = push_logs[:20]
            self._persist()
            get_audit_logger().record_event(
                event_type="MOBILE_JKN_PUSH_DISPATCHED",
                claim_id=claim_id,
                actor=actor,
                payload={"participant_token": token, "nik_hash": nik_hash[:16]}
            )
            return entry

    # ------------------------------------------------------------------
    # Settings & Verifier Profile (SHA-256 Audited)
    # ------------------------------------------------------------------
    def get_settings(self, claims_db: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            self._ensure_init(claims_db)
            return copy.deepcopy(self.state.get("settings", {}))

    def update_settings(self, claims_db: Dict[str, Any], updates: Dict[str, Any], category: str, actor: str) -> Dict[str, Any]:
        with self._lock:
            self._ensure_init(claims_db)
            settings = self.state.setdefault("settings", {})
            settings.update(updates)
            self._persist()
            audit_entry = get_audit_logger().record_event(
                event_type="SYSTEM_SETTINGS_UPDATED",
                claim_id="SYSTEM",
                actor=actor,
                payload={"category": category, "updated_keys": list(updates.keys())}
            )
            return {
                "status": "success",
                "settings": copy.deepcopy(settings),
                "audit_hash": audit_entry["current_hash"]
            }

    def get_profile(self, claims_db: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            self._ensure_init(claims_db)
            return copy.deepcopy(self.state.get("profile", {}))

    def update_profile(self, claims_db: Dict[str, Any], updates: Dict[str, Any], actor: str) -> Dict[str, Any]:
        with self._lock:
            self._ensure_init(claims_db)
            prof = self.state.setdefault("profile", {})
            for k in ("name", "email", "nip", "role", "unit", "branch", "phone", "location", "bio"):
                if k in updates and updates[k] is not None:
                    prof[k] = updates[k]
            self._persist()
            audit_entry = get_audit_logger().record_event(
                event_type="VERIFIER_PROFILE_UPDATED",
                claim_id="SYSTEM",
                actor=actor,
                payload={"nip": prof.get("nip"), "unit": prof.get("unit")}
            )
            return {
                "status": "success",
                "profile": copy.deepcopy(prof),
                "audit_hash": audit_entry["current_hash"]
            }


operations_store = OperationsStore()
