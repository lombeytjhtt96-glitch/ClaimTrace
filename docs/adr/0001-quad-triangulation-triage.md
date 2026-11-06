# ADR-0001: Quad-Triangulasi Sinyal Triase Independen

## Status
Accepted

## Konteks
Verifikasi klaim jaminan kesehatan konvensional sering bergantung pada aturan statis satu dimensi atau model skor tunggal (*black-box machine learning*). Pendekatan ini rentan terhadap *false positive* tinggi (membebani verifikator) atau *false negative* (kebocoran dana jaminan sosial). Verifikator BPJS Kesehatan menghadapi puluhan ribu klaim per bulan dengan batas SLA ketat 10 hari kerja.

## Keputusan
Menerapkan arsitektur **Quad-Triangulasi Sinyal Triase Independen**:
1. Sinyal 1: Aturan Koding Klinis deterministik (ICD-10, ICD-9-CM, unbundling, upcoding).
2. Sinyal 2: Verifikasi Semantik Indikasi Medis (kepatuhan PNPK, Fornas, kesesuaian resume klinis).
3. Sinyal 3: Kewajaran Finansial & Anomali Pola Klaim (distribusi biaya peer-hospital, klaim berulang).
4. Sinyal 4: Validitas Layanan & Geovelocity (kontinuitas rujukan berjenjang, validitas biometrik FRISTA, kewajaran jarak/waktu tempuh OSRM).

Setiap sinyal beroperasi secara independen dan menghasilkan skor anomali terisolasi (0 - 100) serta penjelasan rasionalitas (*explainable reasoning*) sebelum dikombinasikan melalui fungsi pembobotan terkalibrasi ke dalam Triase Hijau, Kuning, atau Merah.

## Konsekuensi
- **Positif**: Transparansi penuh bagi verifikator (setiap sinyal dapat diaudit tersendiri), reduksi beban verifikasi manual hingga 60%, dan penghindaran bias model tunggal.
- **Negatif**: Membutuhkan sinkronisasi data antar-submodul dan validasi independen pada setiap pilar.
