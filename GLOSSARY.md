# ClaimTrace JKN Domain Glossary (Ubiquitous Language)

Dokumen ini mendefinisikan bahasa bersama (*ubiquitous language*) untuk domain verifikasi dan pencegahan kecurangan (*fraud prevention*) klaim JKN BPJS Kesehatan pada sistem ClaimTrace.

---

## 1. Konsep Triase & Verifikasi Klaim

### Triase Multi-Sinyal Independen (Quad-Triangulasi)
Arsitektur triase yang memisahkan evaluasi klaim menjadi 4 pilar analitik independen:
1. **Koding Klinis (Clinical Coding)**: Kesesuaian diagnosis primer ICD-10 dengan prosedur tindakan ICD-9-CM dan aturan unbundling/upcoding INA-CBG.
2. **Indikasi Medis (Medical Indication)**: Kepatuhan resume medis terhadap Pedoman Nasional Pelayanan Kedokteran (PNPK) dan Formularium Nasional (Fornas).
3. **Kewajaran Finansial (Financial Reasonableness)**: Analisis perbandingan tarif terhadap *peer hospital* (kelas RS, regional, LOS) dan deteksi klaim berulang (*repeat billing*).
4. **Validitas Layanan & Geovelocity (Service Validity & Geovelocity)**: Validasi kontinuitas rujukan berjenjang, kepatuhan biometrik FRISTA, dan kelayakan waktu-jarak tempuh perpindahan faskes.

### Disposisi Triase
Keputusan kategorisasi awal klaim yang dihasilkan oleh mesin skor gabungan:
- **HIJAU (Fast-Track / Disetujui Otomatis)**: Skor risiko komposit di bawah ambang batas (< 30) dengan kepatuhan regulasi penuh. Disetujui langsung untuk percepatan SLA.
- **KUNING (Audit Klinis / Perlu Klarifikasi)**: Skor risiko moderat (30 - 70) dengan anomali ringan atau dokumen klinis belum lengkap. Dialokasikan ke antrean Verifikator Klaim.
- **MERAH (Eskalasi Fraud / Tim PK-JKN)**: Skor risiko tinggi (> 70) dengan anomali berat terkonfirmasi (indikasi phantom billing, upcoding sistemik, anomali geovelocity mustahil). Dialihkan ke Tim Pencegahan Kecurangan (PK-JKN).

### Verifikator Klaim
Tenaga profesional BPJS Kesehatan di Kantor Cabang yang bertugas menelaah, mengonfirmasi, meminta klarifikasi, menyetujui, atau menolak berkas klaim yang diajukan oleh FKRTL.

### BAKB (Berita Acara Klarifikasi Berkas)
Dokumen resmi digital yang diterbitkan oleh sistem ClaimTrace dengan stempel kriptografis SHA-256 untuk memfasilitasi komunikasi klarifikasi dan sanggahan antara Verifikator BPJS Kesehatan dan manajemen RS.

---

## 2. Integritas Data & Kepatuhan Regulasi

### Zero-PHI Scrubber & Pseudonimisasi NIK
Lapisan pengamanan data aktif yang menghapus seluruh Informasi Kesehatan Pribadi (*Protected Health Information / PHI*) dan mengganti Nomor Induk Kependudukan (NIK) serta Nomor Kartu BPJS dengan pengenal pseudonim (*salted HMAC*) sebelum data masuk ke modul inferensi atau analitik, menjamin kepatuhan penuh terhadap UU Perlindungan Data Pribadi No. 27/2022 dan Permenkes No. 24/2022.

### SHA-256 Chained Forensic Audit Ledger
Struktur data berantai (*tamper-evident blockchain-like ledger*) di mana setiap aksi triase, perubahan status klaim, dan keputusan verifikator dicatat dalam blok yang memuat hash blok sebelumnya (`prev_hash`). Setiap manipulasi pada data historis akan membatalkan validitas kriptografis rantai audit secara instan.

### SLA 10 Hari Kerja
Batas waktu pemrosesan klaim oleh BPJS Kesehatan sesuai regulasi perundangan. ClaimTrace menghitung sisa waktu berbasis hari kerja murni (*business days*), mengecualikan hari Sabtu, Minggu, dan hari libur nasional resmi (SKB 3 Menteri).

---

## 3. Aturan Medis & Engine Klinis

### PNPK (Pedoman Nasional Pelayanan Kedokteran)
Standar pelayanan medis nasional yang disahkan oleh Kementerian Kesehatan. Digunakan sebagai dasar audit indikasi tindakan dan durasi rawat inap (LOS).

### Fornas (Formularium Nasional)
Daftar obat yang disediakan untuk pelayanan kesehatan program JKN sesuai KMK HK.01.07/MENKES/200/2020. Digunakan untuk mendeteksi peresepan di luar restriksi restriktif.

### Readmisi 30 Hari (Readmission 30D)
Kondisi di mana pasien yang sama dirawat kembali dalam rentang waktu kurang dari 30 hari dengan diagnosis primer serupa di faskes yang sama, yang mengindikasikan potensi pemulangan prematur demi klaim ganda, kecuali untuk kasus yang dikecualikan (hemodialisa rutin, kemoterapi berkala, talasemia mayor, atau Program Rujuk Balik PRB).

### Geovelocity Anomaly
Deteksi anomali perjalanan fisik pasien di mana seorang peserta tercatat mendapatkan layanan rawat jalan/inap di dua faskes berbeda pada waktu yang berdekatan dengan kecepatan tempuh yang melampaui batas kecepatan fisik wajar (> 120 km/jam).

### FRISTA Biometrik
Integrasi verifikasi biometrik (sidik jari/wajah) di loket pendaftaran faskes untuk memvalidasi keberadaan fisik pasien, mencegah peminjaman kartu dan klaim fiktif (*phantom billing*).
