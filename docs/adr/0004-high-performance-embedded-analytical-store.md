# ADR-0004: In-Memory / Embedded High-Performance Analytical Engine

## Status
Accepted

## Konteks
Verifikasi puluhan ribu klaim secara berkala memerlukan kueri agregasi OLAP (analisis variansi tarif, deteksi klaim berulang antar-faskes, perbandingan LOS per kelas RS) dalam hitungan milidetik tanpa membebani basis data transaksi utama (OLTP) BPJS Kesehatan (V-Claim). Mengoperasikan klaster big data eksternal berskala masif menambah kompleksitas operasional pada tahap purwarupa dan evaluasi Healthkathon.

## Keputusan
Memanfaatkan basis data analitik tertanam (*embedded vectorized analytical database engine*) yang beroperasi *in-process*:
- Eksekusi kueri analitik SQL kolumnar terindeks secara langsung pada file gudang data lokal (`claimtrace_warehouse.duckdb`).
- Menyediakan fungsi deteksi anomali bawaan (*compiled analytical tools*): deteksi klaim berulang (*repeat billing*), klaim fiktif (*phantom billing*), dan ringkasan risiko finansial faskes.
- Tidak membutuhkan daemon server eksternal tambahan, meminimalkan *attack surface*, dan menghemat sumber daya memori.

## Konsekuensi
- **Positif**: Kecepatan kueri agregasi 10x - 50x lebih cepat daripada RDBMS tradisional untuk jutaan baris, deployment tanpa dependensi layanan eksternal.
- **Negatif**: Akses konkuren penulisan (*concurrent write*) dibatasi pada mode read-mostly dengan satu penulis utama.
