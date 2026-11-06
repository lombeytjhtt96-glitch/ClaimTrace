# ADR-0002: Tamper-Evident SHA-256 Chained Forensic Audit Ledger

## Status
Accepted

## Konteks
Keputusan penolakan, persetujuan, atau eskalasi klaim BPJS Kesehatan memiliki dampak hukum dan finansial langsung terhadap faskes dan dana amanah jaminan sosial. Basis data tradisional dapat diubah (*mutable*) oleh pihak berwenang internal atau serangan siber tanpa meninggalkan jejak forensik yang dapat dibuktikan di pengadilan.

## Keputusan
Membangun struktur log audit forensik berbasis rantai kriptografis SHA-256 (*tamper-evident chained ledger*):
- Setiap peristiwa audit (triase awal, revisi berkas, verifikasi manual, persetujuan, penerbitan BAKB) dicatat sebagai blok tidak terubahkan (*append-only*).
- Setiap blok memuat `index`, `timestamp`, `action`, `claim_id`, `actor`, `details`, `prev_hash`, dan `block_hash`.
- Validasi integritas dapat dieksekusi secara instan (`verify_integrity()`) untuk mendeteksi setiap modifikasi baris atau kerusakan rantai.

## Konsekuensi
- **Positif**: Bukti forensik digital sah untuk Berita Acara Klarifikasi Berkas (BAKB) dan investigasi audit BPK/BPKP.
- **Negatif**: Membutuhkan mekanisme serialisasi teratur dan penanganan konkurensi saat volume penulisan tinggi.
