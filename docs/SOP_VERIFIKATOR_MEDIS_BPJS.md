# BADAN PENYELENGGARA JAMINAN SOSIAL KESEHATAN (BPJS KESEHATAN)
## STANDAR OPERASIONAL PROSEDUR (SOP)
### VERIFIKASI MEDIS PRA-BAYAR DAN PENEGAKAN INTEGRITAS KLAIM FKRTL DENGAN DUKUNGAN SISTEM CLAIMTRACE DSS

---

**Nomor SOP**: SOP/BPJS-KTR/WASRIK/2026/042  
**Tanggal Berlaku**: 10 November 2026  
**Revisi Ke**: 03 (Tingkat Produksi Enterprise)  
**Unit Penerbit**: Kedeputian Bidang Pengawasan dan Pemeriksaan (Wasrik) & Kedeputian Bidang Jaminan Pelayanan Kesehatan  
**Dasar Hukum**: 
1. Undang-Undang No. 40 Tahun 2004 tentang Sistem Jaminan Sosial Nasional.
2. Undang-Undang No. 24 Tahun 2011 tentang Badan Penyelenggara Jaminan Sosial.
3. Undang-Undang No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP).
4. Undang-Undang No. 17 Tahun 2023 tentang Kesehatan.
5. Peraturan Presiden No. 82 Tahun 2018 tentang Jaminan Kesehatan, khususnya Pasal 74, Pasal 75, dan Pasal 76 ayat (2).
6. Peraturan Menteri Kesehatan No. 16 Tahun 2019 tentang Pencegahan dan Penanganan Kecurangan (Fraud) serta Pengenaan Sanksi Administrasi Terhadap Kecurangan dalam Penyelenggaraan Program Jaminan Kesehatan.
7. Peraturan Menteri Kesehatan No. 26 Tahun 2021 tentang Pedoman Indonesian Case Base Groups (INA-CBG).
8. Peraturan Menteri Kesehatan No. 3 Tahun 2023 tentang Standar Tarif Pelayanan Kesehatan dalam Penyelenggaraan Program Jaminan Kesehatan.

---

## 1. TUJUAN

1. Memberikan pedoman baku dan mengikat bagi Verifikator Medis Kantor Pusat, Kantor Kedeputian Wilayah, dan Kantor Cabang BPJS Kesehatan dalam melaksanakan verifikasi pra-bayar (pre-payment adjudication) terhadap klaim Fasilitas Kesehatan Rujukan Tingkat Lanjutan (FKRTL).
2. Memastikan seluruh berkas klaim terproses secara akurat, transparan, dan akuntabel dengan memanfaatkan mesin penapisan anomali cerdas ClaimTrace DSS berbasis komputasi in-memory SIMD DuckDB.
3. Menegakkan kepatuhan hukum pembiayaan kesehatan, mencegah kecurangan klaim (fraud prevention), serta melindungi hak peserta dan keberlangsungan Dana Jaminan Sosial (DJS) Kesehatan.
4. Menstandarisasi tata cara penerbitan Berita Acara Kelayakan Berkas (BAKB) Digital dan penetapan penundaan pembayaran berlandaskan Pasal 76 ayat (2) Perpres No. 82/2018.

---

## 2. RUANG LINGKUP

SOP ini berlaku untuk:
1. Seluruh proses adjudikasi dan telaah medis pra-bayar atas pengajuan klaim Rawat Jalan Tingkat Lanjutan (RJTL) dan Rawat Inap Tingkat Lanjutan (RITL) yang diajukan oleh 2.091 FKRTL mitra BPJS Kesehatan di 496 Kabupaten/Kota di seluruh Indonesia.
2. Penggunaan modul-modul pada antarmuka Cockpit Verifikator Medis ClaimTrace DSS.
3. Pejabat Verifikator Medis yang memiliki kualifikasi dokter spesialis patologi klinik atau dokter yang ditunjuk secara resmi, dengan hak akses otorisasi tingkat `ADJUDICATE`. Profil verifikator pengampu utama dalam sistem ini adalah:
   - **Nama Verifikator**: dr. Siti Rahma, Sp.PK
   - **NIP Pegawai**: 198704202011012001
   - **Unit Kerja**: Kantor Pusat BPJS Kesehatan · Kedeputian Bidang Pengawasan dan Pemeriksaan
   - **Kewenangan Khusus**: Penelaahan Klinis Tingkat Lanjut, Persetujuan Jalur Merah, Pembubuhan Decision Receipts Kriptografis HMAC-SHA256, dan Penandatanganan BAKB Digital.

---

## 3. DEFINISI OPERASIONAL

1. **ClaimTrace DSS**: Sistem pendukung keputusan berbasis analitik komputasi in-memory yang mengintegrasikan data klaim transaksi, master kepesertaan, diagnosis sekunder, registri tenaga medis SATUSEHAT, dan telemetri kehadiran peserta.
2. **Formula Fusi Deterministik**: Algoritma kalkulasi skor anomali klaim multi-sinyal berbasis rumus matematis $S = (0,50 \times S1) + (0,30 \times S2) + (0,20 \times S3)$ tanpa risiko halusinasi generatif.
3. **Triase 3 Lajur**: Klasifikasi otomatis tingkat risiko berkas klaim ke dalam Jalur Hijau (Risiko Rendah), Jalur Kuning (Risiko Moderat), dan Jalur Merah (Risiko Tinggi/Hard Trigger).
4. **Human Gate**: Mekanisme pembatas wajib yang mensyaratkan keputusan manusia (human-in-the-loop) oleh verifikator medis resmi sebelum tindakan penolakan, penundaan, atau pemotongan klaim faskes dapat dieksekusi secara sah.
5. **Decision Receipt**: Tanda bukti elektronik putusan verifikator yang ditandatangani menggunakan stempel digital berbasis HMAC-SHA256 dan tercatat secara permanen pada rantai blok audit (Tamper-Evident Ledger).
6. **Berita Acara Kelayakan Berkas (BAKB) Digital**: Dokumen formal penetapan hasil verifikasi klaim yang disahkan secara elektronik dengan stempel `[SEALED · SAH]`, segel kriptografis SHA-256, dan kode matriks QR 21x21 sebagai dasar pencairan dana atau penundaan pembayaran kepada faskes.

---

## 4. ALUR PROSEDUR KERJA VERIFIKATOR MEDIS

```
+---------------------------------------------------------------------------------------------------+
|                        ALUR OPERASIONAL VERIFIKASI MEDIS CLAIMTRACE DSS                           |
+---------------------------------------------------------------------------------------------------+
| 1. PENERIMAAN BERKAS DIGITAL                                                                      |
|    - Pengunggahan batch klaim FKRTL melalui aplikasi VClaim / E-Klaim.                            |
|    - Pemrosesan in-memory DuckDB SIMD: pemetaan 6.264.346 baris data terpadu sub-50ms.            |
|    - Penapisan Zero-PHI: penyamaran NIK 16 digit dan tokenisasi HMAC-SHA256 (AES256_<16-hex>).     |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 2. PENAPISAN DAN TRIASE OTOMATIS 3 LAJUR                                                          |
|    - Evaluasi Formula Fusi S = 0,5 S1 + 0,3 S2 + 0,2 S3                                           |
|    - Pengecekan 9 Aturan Klinis & Administratif Pra-Bayar                                         |
+---------------------------------------------------------------------------------------------------+
              |                                   |                                   |
              v                                   v                                   v
   +---------------------+             +---------------------+             +---------------------+
   |     JALUR HIJAU     |             |    JALUR KUNING     |             |     JALUR MERAH     |
   |    (Skor < 50,0)    |             | (Skor 50,0 - 74,9)  |             | (Skor >= 75 / Hard) |
   +---------------------+             +---------------------+             +---------------------+
              |                                   |                                   |
              v                                   v                                   v
   +---------------------+             +---------------------+             +---------------------+
   | Persetujuan Otomatis|             | Audit Sampel        |             | Penegakan Human Gate|
   | (Auto-Approval)     |             | Terarah & Konfirmasi|             | dr. Siti Rahma,     |
   | Verifikasi Adm Lolos|             | Administratif Faskes|             | Sp.PK (NIP Wajib)   |
   +---------------------+             +---------------------+             +---------------------+
              |                                   |                                   |
              |                                   v                                   v
              |                        +---------------------+             +---------------------+
              |                        | Klarifikasi Faskes  |             | Audit Medis Mendalam|
              |                        | Terkonfirmasi Sah?  |             | 9 Aturan PNPK/Fornas|
              |                        +---------------------+             +---------------------+
              |                               |         |                             |
              |                      Ya       |         | Tidak                       v
              |              +----------------+         +-------+          +---------------------+
              |              |                                  |          | Rekomendasi Putusan |
              |              v                                  v          | Tunda/Koreksi/Tolak |
              |      +---------------+                  +---------------+  +---------------------+
              |      | Terbitkan     |                  | Alihkan ke    |             |
              |      | Persetujuan   |                  | Jalur Merah   |             |
              |      +---------------+                  +---------------+             |
              |              |                                                        |
              +--------------+--------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 3. PENERBITAN KEPUTUSAN DAN PENGESAHAN DOKUMEN YURIDIS                                            |
|    - Penerbitan Decision Receipt berstempel HMAC-SHA256 (NIP: 198704202011012001).                |
|    - Pencatatan blok ke rantai Tamper-Evident SHA-256 Ledger (audit_ledger_chain.jsonl).          |
|    - Pembuatan Berita Acara Kelayakan Berkas (BAKB) Digital Pasal 76 ayat (2) Perpres 82/2018.    |
|    - Pembubuhan stempel grafis [SEALED · SAH] dan QR Code verifikasi 21x21.                       |
+---------------------------------------------------------------------------------------------------+
```

---

## 5. TATA CARA EVALUASI TRIASE 3 LAJUR

### 5.1 Prosedur Pelayanan Jalur Hijau (Skor Anomali < 50,0)
1. **Kriteria Masuk Jalur Hijau**:
   - Nilai skor akhir fusi deterministik $S < 50,0$.
   - Tidak ada satu pun dari 9 aturan klinis dan administratif yang terpicu (zero rule violations).
   - Status Surat Izin Praktik (SIP) DPJP terkonfirmasi `ACTIVE` pada registri SATUSEHAT SDMK.
   - Tidak terdeteksi lonjakan volume tagihan yang melebihi baseline faskes.
   - Konfirmasi telemetri Mobile JKN berstatus `respon_hadir` atau berada dalam batas kewajaran.
2. **Tindakan Verifikator Medis**:
   - Sistem secara otomatis memberikan status rekomendasi `SETUJUI_PRA_BAYAR` (Auto-Approval).
   - Verifikator medis melakukan verifikasi administratif berkala secara batch melalui modul Antrean Triase.
   - Berkas klaim diteruskan secara otomatis ke dalam bundel Berita Acara Kelayakan Berkas (BAKB) bulanan untuk proses pembayaran oleh Bagian Keuangan dalam batas SLA 15 hari kalender sejak berkas lengkap diterima.

### 5.2 Prosedur Pelayanan Jalur Kuning (Skor Anomali 50,0 hingga 74,9)
1. **Kriteria Masuk Jalur Kuning**:
   - Nilai skor akhir fusi berada pada rentang $50,0 \le S \le 74,9$.
   - Terjadi ketidakpastian administratif, misalnya:
     - Kredensial SIP DPJP berstatus `UNSYNCED` (kendala pemutakhiran data pada penyedia registri eksternal).
     - Rujukan berulang yang menyerupai pola fragmentasi namun terindikasi sebagai Program Rujuk Balik (PRB) sah sesuai Permenkes No. 3 Tahun 2023 Pasal 37.
     - Variasi diagnosis sekunder yang berpotensi memengaruhi tarif INA-CBG namun belum memenuhi bukti pasti upcoding.
2. **Tindakan Verifikator Medis**:
   - Verifikator medis wajib membuka modul Berkas Klaim (Cases Management) dan menelaah berkas pendukung dalam kurun waktu maksimal 3 hari kerja.
   - Melakukan konfirmasi status administratif tenaga medis ke faskes pengaju atau Dinas Kesehatan setempat.
   - Memeriksa catatan resume medis elektronik (EHR) dan riwayat kepesertaan.
   - **Hasil Penelaahan Jalur Kuning**:
     - *Jika dokumen pendukung absah dan terkonfirmasi*: Verifikator menyetujui klaim, menurunkan skor anomali ke Jalur Hijau, dan membubuhkan catatan konfirmasi.
     - *Jika faskes tidak dapat membuktikan keabsahan dalam batas waktu*: Verifikator menaikkan status klaim ke Jalur Merah untuk diaudit secara mendalam.

### 5.3 Prosedur Pelayanan Jalur Merah (Skor Anomali >= 75,0 atau Terpicu Hard Trigger)
1. **Kriteria Masuk Jalur Merah**:
   - Nilai skor akhir fusi $S \ge 75,0$, ATAU
   - Terpicu salah satu dari kondisi **Hard Trigger Penegakan Hukum**:
     - Status SIP DPJP terkonfirmasi `EXPIRED` pada tanggal pelayanan medis (`S2 = 100,0` dan `S = max(S, 75.0)`).
     - Terdeteksi pola lonjakan klaster penagihan melebihi atau sama dengan 3,0x baseline bulanan faskes (indikasi kuat Phantom Billing pasca bakti sosial).
     - Terdeteksi perpindahan fisik mustahil (Impossible Travel OSRM Geovelocity) di mana dokter tercatat memberikan tindakan di 2 kota berbeda dalam selisih waktu kurang dari 45 menit.
     - Konfirmasi telemetri Mobile JKN menghasilkan status `respon_tidak_hadir` secara masif pada klaster faskes terkait.
     - Pelanggaran berat terhadap 9 Aturan Klinis dan Administratif Pra-Bayar.
2. **Tindakan Verifikator Medis (dr. Siti Rahma, Sp.PK)**:
   - Verifikator membuka modul Matriks 3 Lapis Bukti dan Konsol Eksekusi BAKB.
   - Melakukan evaluasi mendalam terhadap bukti-bukti objektif:
     - Memeriksa bukti laboratorium (kadar hemoglobin, leukosit, albumin serum, biomarker infeksi).
     - Memeriksa lembar asesmen gawat darurat (SOAP IGD) terhadap resume kepulangan.
     - Memeriksa rekam jejak biometrik wajah FRISTA pada saat penerbitan SEP.
   - Menghubungi pihak FKRTL melalui modul Jadwal Klarifikasi untuk menerbitkan surat pemanggilan klarifikasi formal.
   - Menetapkan putusan adjudikasi pra-bayar:
     - `TUNDA_BERITA_ACARA_KLARIFIKASI`: Menahan pencairan dana klaim klaster terkait berlandaskan Pasal 76 ayat (2) Perpres No. 82/2018 selama proses audit investigasi (SLA klarifikasi 10 hari kerja).
     - `KOREKSI_DOWNGRADE_TARIF_INACBG`: Mengoreksi kode diagnosis sekunder (misal menghapus sepsis atau perdarahan saluran cerna yang tidak terbukti klinis) dan menurunkan tarif INA-CBG ke tingkat keparahan yang sesuai fakta medis riil.
     - `GABUNGKAN_EPISODE_UNBUNDLING`: Menyatukan kunjungan terfragmentasi menjadi satu episode pembayaran tunggal.
     - `TOLAK_KLAIM_ESKALASI_AUDIT_FORENSIK`: Menolak pembayaran secara definitif dan meneruskan berkas ke Tim Pencegahan Kecurangan JKN (PK-JKN) Kantor Pusat untuk audit investigasi tindak pidana fraud.

---

## 6. PROSEDUR PENEGAKAN HUMAN GATE DAN DECISION RECEIPTS

Untuk menjamin kepatuhan terhadap prinsip akuntabilitas hukum dan etika kedokteran, ClaimTrace DSS melarang sistem kecerdasan buatan mengambil keputusan final penolakan secara otonom. Setiap tindakan berkonsekuensi tinggi wajib melewati tahapan Human Gate sebagai berikut:

```
+---------------------------------------------------------------------------------------------------+
|                        PROTOKOL PENEGAKAN HUMAN GATE VERIFIKATOR MEDIS                            |
+---------------------------------------------------------------------------------------------------+
| Langkah 1: Otentikasi dan Validasi Identitas Verifikator                                          |
| - Verifikator login menggunakan akun resmi BPJS Kesehatan dengan kredensial NIP terdaftar.         |
| - Sistem memvalidasi token sesi HMAC-SHA256 berjangka waktu (TTL 480 menit).                       |
| - Sistem memastikan hak akses memuat izin 'ADJUDICATE' (hanya untuk dokter spesialis patologi      |
|   klinik / verifikator medis senior, dr. Siti Rahma, Sp.PK NIP: 198704202011012001).              |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| Langkah 2: Penyusunan Lembar Telaah Medis Tertulis                                                |
| - Verifikator mengisi catatan justifikasi klinis tertulis pada kolom Konsol Eksekusi.             |
| - Verifikator dapat memanfaatkan bantuan draf regulasi cerdas RAG HealthAI tanpa emoji.            |
| - Verifikator memilih dasar regulasi resmi (Perpres 82/2018, PMK 16/2019, PMK 26/2021, Fornas).    |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| Langkah 3: Pembubuhan Tanda Tangan Kriptografis (Minting Decision Receipt)                        |
| - Sistem mengonstruksi payload kanonikal terurut kamus.                                           |
| - Sistem mengomputasi tanda tangan HMAC-SHA256:                                                   |
|   Receipt_HMAC = HMAC_SHA256(RECEIPT_SIGNING_SALT + Verifikator_NIP, Payload_Kanonikal)           |
| - Decision Receipt yang dihasilkan bersifat unik, tamper-evident, dan mengikat secara hukum.      |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| Langkah 4: Pencatatan Permanen pada Rantai Audit Ledger                                            |
| - Blok audit baru dikaitkan dengan hash blok sebelumnya (prev_hash) menggunakan SHA-256 linier.   |
| - Berkas disimpan ke 'backend/data/audit_ledger_chain.jsonl'.                                     |
| - Verifikasi integritas rantai (verify_integrity) dijalankan otomatis.                            |
+---------------------------------------------------------------------------------------------------+
```

---

## 7. PROSEDUR PENGUJIAN 9 ATURAN KLINIS DAN ADMINISTRATIF PRA-BAYAR

Verifikator Medis wajib mengoperasikan pengujian 9 aturan klinis dan administratif pra-bayar pada setiap berkas yang dicurigai:

1. **Pengujian Kasus Katarak Bilateral Simultan (RUL-PNPK-KATARAK-01)**:
   - Periksa tanggal operasi mata kanan dan mata kiri pada lembar laporan operasi.
   - Apabila kedua mata dioperasi pada tanggal yang sama tanpa ada kondisi darurat medis yang disetujui Komite Medik faskes, klaim mata kedua ditolak pembayarannya guna menjamin kepatuhan PNPK Mata.
2. **Pengujian Tajam Penglihatan Pra-Operasi Katarak (RUL-PNPK-KATARAK-02)**:
   - Periksa hasil visus awal pada lembar poliklinik mata.
   - Jika visus awal tercatat 6/12, 6/9, atau lebih baik dari 6/18 tanpa bukti terdokumentasi adanya gangguan fungsi berat, klaim ditahan untuk konfirmasi indikasi medis.
3. **Pengujian Peresepan Human Albumin (RUL-FORNAS-ALBUMIN-01)**:
   - Periksa lampiran hasil laboratorium kadar albumin serum sebelum pemberian infus.
   - Jika kadar albumin serum terbukti $\ge 2,5\text{ g/dL}$, maka tagihan sediaan albumin dikeluarkan (dieliminasi) dari tagihan klaim rumah sakit sesuai restriksi Formularium Nasional.
4. **Pengujian Koding Sepsis Neonatal & Sepsis Akut (RUL-UPCODING-SEPSIS-03)**:
   - Periksa rekam medis bayi/pasien rawat inap yang mencantumkan diagnosis sekunder ICD-10 A41.9 atau P36.
   - Wajib ada bukti objektif disfungsi organ akut (skor SOFA $\ge 2$ atau skor nSOFA untuk neonatus), bukti biakan mikroorganisme kultur darah positif, atau peningkatan prokalsitonin yang signifikan.
   - Jika kriteria objektif tidak terpenuhi, verifikator melakukan koreksi tarif dengan menurunkan grouper INA-CBG ke tingkat keparahan yang sesuai.
5. **Pengujian Readmisi Pasien Kurang dari 30 Hari (RUL-READMISSION-30D)**:
   - Periksa interval tanggal pulang rawat inap sebelumnya terhadap tanggal masuk rawat inap saat ini.
   - Jika interval $< 30$ hari dengan diagnosis utama yang berada dalam MDC yang sama, verifikator menginvestigasi apakah terjadi pemulangan prematur. Jika terbukti pelayanan berkesinambungan yang seharusnya satu paket, klaim kedua digabungkan ke klaim pertama.
6. **Pengujian Beban Layanan DPJP (RUL-DPJP-CAPACITY-40)**:
   - Buka modul Intelijen Beban DPJP pada Cockpit.
   - Jika seorang DPJP spesialis melayani $> 40$ pasien rawat jalan pada hari yang sama di satu faskes, klaim pasien ke-41 dan seterusnya ditahan untuk klarifikasi pembagian waktu kerja dokter.
7. **Pengujian Nomor SEP Ganda (RUL-VCLAIM-SEP-DUPLICATE)**:
   - Lakukan kueri silang nomor kartu JKN pada tabel transaksi DuckDB.
   - Batalkan pembayaran atas penerbitan nomor SEP tambahan pada tanggal dan faskes yang sama untuk poli yang sejenis.
8. **Pengujian Hak Kelas Perawatan (RUL-CLASS-MISMATCH-UNAPPROVED)**:
   - Periksa kesesuaian antara kelas kepesertaan pasien dengan kelas ruangan rawat inap yang ditagihkan.
   - Jika terjadi kenaikan kelas, wajib melampirkan surat pernyataan persetujuan membayar selisih biaya dari peserta/keluarga. Jika tidak ada surat persetujuan, tarif klaim dikembalikan ke hak kelas peserta.
9. **Pengujian Sinkronisasi Resume Keluar vs Catatan SOAP IGD (RUL-RESUME-UNSYNC-SOAP)**:
   - Bandingkan data klinis lembar IGD saat pasien masuk pertama kali dengan diagnosis pada resume medis keluar.
   - Jika diagnosis pada resume medis keluar mencantumkan diagnosis berat yang sama sekali tidak memiliki riwayat pemeriksaan, terapi, atau gejala pada catatan IGD/bangsal, batalkan diagnosis fiktif tersebut.

---

## 8. TATA CARA PENERBITAN DAN PENGESAHAN BAKB DIGITAL

### 8.1 Dasar Hukum Penundaan Pembayaran
Penerbitan Berita Acara Kelayakan Berkas (BAKB) Digital dengan status penundaan didasarkan secara imperatif pada ketentuan:
- **Pasal 76 ayat (2) Peraturan Presiden No. 82 Tahun 2018**:
  *"Dalam hal berkas klaim yang diajukan oleh Fasilitas Kesehatan belum lengkap atau terdapat ketidaksesuaian, BPJS Kesehatan berhak menunda pembayaran klaim sampai dengan kelengkapan berkas dipenuhi atau ketidaksesuaian diselesaikan."*

### 8.2 Tata Cara Pembubuhan Stempel dan Segel Kriptografis
1. Setelah verifikator medis menyelesaikan telaah pada modul Konsol Eksekusi, tombol `Terbitkan Berita Acara (BAKB)` ditekan.
2. Sistem secara otomatis menghasilkan nomor resmi Berita Acara dengan format:
   ```
   BA-BPJS/<Tahun>/<Bulan>/<NomorKlaim>-<JenisAksi>
   Contoh: BA-BPJS/2026/11/085-TUNDA
   ```
3. Sistem menyematkan stempel visual `[SEALED · SAH]` yang ditampilkan dengan efek rotasi -4 derajat pada dokumen cetak resmi.
4. Sistem menghitung intisari hash SHA-256 atas seluruh isi dokumen, memvalidasi root CA BPJS Kesehatan, dan membubuhkan stempel waktu presisi tinggi standar ISO 8601 UTC.
5. Sistem mengompilasi matriks QR Code deterministik berukuran 21 baris x 21 kolom pada pojok kanan bawah lembar Berita Acara sebagai sarana pembuktian keaslian berkas oleh pihak manajemen rumah sakit dan auditor eksternal (BPK/BPKP).

### 8.3 Pendistribusian Dokumen Berita Acara
1. Dokumen BAKB Digital yang telah berstempel `[SEALED · SAH]` dan bertanda tangan verifikator medis resmi diunduh dalam format PDF resmi atau dicetak langsung.
2. Salinan elektronik secara otomatis terkirim ke portal komunikasi faskes (Aplikasi E-Klaim Faskes) disertai rincian selisih biaya (cost recovery), daftar pelanggaran aturan, dan tenggat waktu pemenuhan klarifikasi medis (SLA 10 hari kerja).
3. Satu salinan dokumen diarsipkan secara permanen pada direktori `docs/` dan dicatat ke dalam buku besar audit terpusat.

---

## 9. PANDUAN PENYELESAIAN MASALAH DAN ESKALASI

| Kondisi Masalah Operasional | Dampak pada Sistem | Prosedur Tindakan Verifikator Medis |
| :--- | :--- | :--- |
| Kredensial SATUSEHAT SDMK berstatus `UNSYNCED` | Skor S2 tertahan di 55,0 - 65,0 (Jalur Kuning) | Jangan menolak klaim secara langsung. Lakukan konfirmasi manual fotokopi berkas fisik SIP dokter yang masih berlaku ke Bagian SDM Faskes dalam waktu 3 hari kerja. |
| Server Basis Data DuckDB terkunci (*file lock*) | Akses baca berkas DuckDB tertahan proses backend | Sistem secara otomatis beralih ke mode in-memory (`:memory:`) dan membaca dari cache Parquet. Verifikator tetap dapat bekerja tanpa gangguan. |
| Faskes membantah temuan audit koding/upcoding | Sengketa klaim pra-bayar | Jadwalkan pertemuan audit klinis formal melalui modul Jadwal Klarifikasi bersama Komite Medik FKRTL dan Tim Kendali Mutu dan Kendali Biaya (TKMKB) setempat. |
| Terdeteksi indikasi sindikat pemalsuan klaim terorganisir | Lonjakan anomali klaster regional | Eskalasi segera melalui tombol 'Eskalasi Tim Wasrik' pada Cockpit ke Kedeputian Bidang Pengawasan dan Pemeriksaan Kantor Pusat dengan melampirkan Decision Receipt dan dossier audit lengkap. |

---

## 10. LEMBAR PENGESAHAN DOKUMEN SOP

Dokumen Standar Operasional Prosedur (SOP) ini telah ditelaah, diuji secara teknis melalui simulasi skenario riil, dan disahkan untuk diberlakukan secara efektif di seluruh lingkungan kerja BPJS Kesehatan.

Ditetapkan di: Jakarta  
Pada tanggal: 10 November 2026  

**Disahkan oleh:**

**dr. Siti Rahma, Sp.PK**  
NIP: 198704202011012001  
Verifikator Medis Senior / Kepala Subdirektorat Verifikasi Medis Rujukan  
Kedeputian Bidang Pengawasan dan Pemeriksaan (Wasrik)  
BPJS Kesehatan Kantor Pusat  
