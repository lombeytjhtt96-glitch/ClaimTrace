# Standards & Regulatory Framework Mappings

## 1. MITRE Fight Fraud Framework (F3 v1.1)
- **Tactic FA0001 (Positioning)**:
  - F1001: Synthetic Identity Creation (Fake BPJS patient IDs)
  - F1005: Account Takeover & Credential Reuse (Doctor SIP harvesting)
  - F1007: Adversary-in-the-Hospital-System (EHR backdoor billing)
- **Tactic FA0002 (Monetization)**:
  - F1025: Pre-Payment Billing Injection (Submitting phantom claims via Vedika API)
  - F1028: Tariff Gaming / Upcoding (Severity level inflation from I-4-10-I to I-4-10-III)

## 2. Indonesian Statutory Healthcare Compliance
- **Perpres No. 82 Tahun 2018**:
  - Pasal 76 & 77: Verifikasi Klaim dilakukan selambat-lambatnya 10 (sepuluh) hari kerja sejak berkas klaim diterima lengkap.
  - ClaimTrace menetapkan countdown timer interaktif per SEP untuk mencegah penalty kelambatan bayar BPJS.
- **Permenkes No. 16 Tahun 2019**:
  - Pedoman Pencegahan dan Penanganan Kecurangan (Fraud) serta Pengenaan Sanksi Administrasi terhadap Kecurangan dalam Pelaksanaan Program Jaminan Kesehatan.
  - Mendefinisikan 14 tipologi kecurangan fasilitas kesehatan rujukan tingkat lanjutan (FKRTL).
- **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)**:
  - Data kesehatan diklasifikasikan sebagai Data Pribadi Spesifik (Pasal 4).
  - Pemrosesan data klaim wajib menerapkan enkripsi transmisi, pseudonimisasi identitas, dan audit trail tak terhapus.

## 3. NIST CSF 2.0 & AI RMF Alignment
- **NIST CSF 2.0**:
  - `DE.AE-02`: Anomaly detection in claim submission timestamps and geographic dispersion.
  - `PR.DS-01`: SHA-256 tamper-evident integrity chaining on decision audit logs.
- **NIST AI RMF 1.0**:
  - `MEASURE-2.6`: Calibrating confidence thresholds for tri-signal model $S$.
  - `MANAGE-2.4`: Human-in-the-loop (Verifikator Vedika) maintains final decision authority.
