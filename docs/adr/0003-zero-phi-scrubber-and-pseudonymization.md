# ADR-0003: Zero-PHI Scrubber & NIK Pseudonymization

## Status
Accepted

## Konteks
Kepatuhan terhadap Undang-Undang Perlindungan Data Pribadi No. 27 Tahun 2022 (UU PDP) dan Peraturan Menteri Kesehatan No. 24 Tahun 2022 tentang Rekam Medis Elektronik mewajibkan penjagaan ketat terhadap kerahasiaan data medis dan data pribadi spesifik (NIK, riwayat penyakit, identitas keluarga). Data mentah tidak boleh terpapar ke sistem analisis tanpa proteksi.

## Keputusan
Menerapkan arsitektur Zero-PHI Scrubber terintegrasi:
- Sanitasi aktif pada gerbang data (*ingress filtering*) sebelum data disimpan atau diolah modul AI/analitik.
- Nomor Induk Kependudukan (NIK) dan Nomor Kartu BPJS dienkripsi menjadi pseudonim deterministik satu arah dengan HMAC bergaram (*salted HMAC*).
- Nama pasien, alamat tempat tinggal, dan nomor kontak disamarkan (*masked* / *scrubbed*).
- Menjamin privasi diferensial dan kepatuhan audit keamanan informasi.

## Konsekuensi
- **Positif**: Kepatuhan regulasi 100%, menghilangkan risiko kebocoran data medis ke pihak luar atau log publik.
- **Negatif**: Rekonsiliasi pasien ke berkas fisik RS memerlukan token de-pseudonimisator resmi dengan hak akses level pimpinan BPJS.
