# Data Sampel BPJS Kesehatan 2015–2024 (Edisi 2025)

[![BPJS Kesehatan](https://img.shields.io/badge/BPJS_Kesehatan-Healthkathon_2026-009B4C?style=flat&logo=hospital)](https://bpjs-kesehatan.go.id)
[![Integrity](https://img.shields.io/badge/SHA256-Verified-blue)](https://github.com/lombeytjhtt96-glitch/Data-Sampel-2015---2024)
[![Archive Size](https://img.shields.io/badge/Size-701_MB_(Uncompressed_~2.3GB)-orange)](https://github.com/lombeytjhtt96-glitch/Data-Sampel-2015---2024/releases)

Repositori resmi penyimpanan dataset historis longitudinal **Data Sampel BPJS Kesehatan 2015–2024 (Edisi 2025)** untuk riset analitika data, kendali mutu, kendali biaya, dan pengembangan sistem pencegahan fraud klaim JKN pada **Healthkathon BPJS Kesehatan 2026**.

---

## 📦 Informasi Berkas Utama

- **Nama Berkas:** `Data sampel 2015-2024.zip`
- **Ukuran File:** `701,180,980 bytes` (~701 MB)
- **Hash SHA-256:**  
  `300b56936c813fd911c984032a1fd80c79f1584efadfa03079f6e5d6c42bc4f3`
- **Tautan Unduh Langsung (Single File):**  
  [Unduh via GitHub Releases](https://github.com/lombeytjhtt96-glitch/Data-Sampel-2015---2024/releases/tag/v2025.1)

---

## 🗂️ Struktur Isi Dataset (`2025/`)

Arsip memuat seluruh data sampel terstandardisasi dalam format Stata (`.dta`) dan Excel ICD-10:

```text
2025/
├── Data Sampel Reguler Edisi 2025/
│   ├── data/
│   │   ├── 2015202401_kepesertaan.dta       # Data Kepesertaan Longitudinal (PSTV01-PSTV18) [88 MB]
│   │   ├── 202402_fktpkapitasi.dta          # Pelayanan FKTP Kapitasi Tahun 2024 [302 MB]
│   │   ├── 202403_fkrtl.dta                 # Pelayanan FKRTL/RS Tahun 2024 (FKL01-FKL48) [629 MB]
│   │   ├── 202404_nonkapitasi.dta           # Pelayanan Non-Kapitasi (PNK01-PNK20) [38 MB]
│   │   └── 202405_diagnosissekunder.dta     # Diagnosis Sekunder FKRTL Tahun 2024 [63 MB]
│   └── icd10/
│       ├── 2024 Kode ICD10 untuk diagnosis FKRTL.xlsx
│       ├── 2024 Kode ICD10 untuk diagnosis FKTP Kapitasi.xlsx
│       ├── 2024 Kode ICD10 untuk diagnosis FKTP Non Kapitasi.xlsx
│       └── icd10_info*.dta
├── Data Sampel Kontekstual COVID Edisi 2025/
├── Data Sampel Kontekstual DM Edisi 2025/
├── Data Sampel Kontekstual KIA Edisi 2025 - Subset Anak/
├── Data Sampel Kontekstual KIA Edisi 2025 - Subset Ibu/
├── Data Sampel Kontekstual Kesehatan Mental Edisi 2025/
└── Data Sampel Kontekstual TB Edisi 2025/
```

---

## ⚡ Cara Rekonstruksi Arsip (Dari Repositori Git)

Karena batas ukuran per berkas Git standar di GitHub adalah 100 MB, arsip `Data sampel 2015-2024.zip` (701 MB) dipecah menjadi 9 bagian di direktori `archive_parts/` tanpa mengurangi 1 bit pun data asli.

Untuk menggabungkannya kembali menjadi file `.zip` utuh:

### 🐧 Di Linux / macOS:
```bash
chmod +x restore.sh
./restore.sh
```
*Atau jalankan perintah langsung:*
```bash
cat archive_parts/data_sampel_2015_2024.zip.part_* > "Data sampel 2015-2024.zip"
sha256sum "Data sampel 2015-2024.zip"
```

### 🪟 Di Windows Command Prompt (CMD):
```cmd
restore.bat
```
*Atau jalankan perintah langsung:*
```cmd
copy /b archive_parts\data_sampel_2015_2024.zip.part_* "Data sampel 2015-2024.zip"
certutil -hashfile "Data sampel 2015-2024.zip" SHA256
```

### ⚡ Di Windows PowerShell:
```powershell
.\restore.ps1
```

---

## 🔒 Integritas Data & Kepatuhan Legal

- **UU PDP No. 27/2022:** Data sampel telah melalui proses de-identifikasi dan pseudonimisasi oleh BPJS Kesehatan.
- **Pakta Integritas:** Penggunaan dataset ini terikat pada ketentuan kompetisi Healthkathon BPJS Kesehatan 2026.
