@php
    $months = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];
    $currentMonth = (int) date('n');
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Surat Pemberitahuan SP-1 Audit VPK — BPJS Kesehatan</title>

    <!-- FOUC Prevention Script for Dark Mode Persistence -->
    <script>
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    </script>

    <style>
        @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 15mm;
        }

        body {
            font-family: 'Times New Roman', Times, serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 24px;
            font-size: 12px;
            line-height: 1.6;
        }

        .printable-document {
            max-width: 800px;
            margin: 0 auto;
        }

        .header-kop {
            border-bottom: 3px double #047857;
            padding-bottom: 10px;
            margin-bottom: 20px;
            text-align: center;
        }

        .kop-instansi {
            font-size: 15px;
            font-weight: bold;
            color: #064e3b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
        }

        .kop-unit {
            font-size: 12px;
            font-weight: bold;
            color: #111827;
            text-transform: uppercase;
            margin: 2px 0;
        }

        .kop-alamat {
            font-size: 10px;
            color: #334155;
            font-style: italic;
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
        }

        .surat-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 16px;
            font-size: 11.5px;
        }

        .tujuan-surat {
            margin-bottom: 20px;
        }

        .title-box {
            text-align: center;
            margin: 16px 0;
        }

        .title-box h1 {
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            text-decoration: underline;
            margin: 0;
        }

        .title-box p {
            font-size: 11px;
            font-family: Arial, Helvetica, sans-serif;
            margin: 3px 0 0 0;
            color: #334155;
        }

        .isi-surat {
            text-align: justify;
            margin-bottom: 14px;
        }

        .evidence-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            font-size: 11px;
            font-family: Arial, Helvetica, sans-serif;
        }

        .evidence-table th, .evidence-table td {
            border: 1px solid #cbd5e1;
            padding: 6px 10px;
            text-align: left;
        }

        .evidence-table th {
            background: #f1f5f9;
            font-weight: bold;
        }

        .team-box {
            margin: 14px 0;
            padding: 10px 14px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10.5px;
            color: #1e293b;
        }

        .signatures {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
            page-break-inside: avoid;
        }

        .sign-block {
            width: 45%;
            text-align: center;
            font-size: 11.5px;
        }

        .sign-space {
            height: 60px;
        }

        .seal-container {
            margin-top: 24px;
            padding: 10px;
            border-top: 1px dashed #94a3b8;
            font-family: monospace;
            font-size: 9px;
            color: #334155;
            background: #f8fafc;
            page-break-inside: avoid;
        }

        .btn-print {
            padding: 8px 16px;
            background: #047857;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 12px;
            font-family: Arial, Helvetica, sans-serif;
            margin-bottom: 16px;
        }

        .text-muted-report {
            color: #334155;
        }

        .text-seal-title {
            color: #047857;
        }

        .text-danger-report {
            color: #b91c1c;
        }

        .qr-box {
            text-align: center;
            border: 1px solid #cbd5e1;
            padding: 4px 8px;
            background: #ffffff;
            color: #0f172a;
        }

        /* Dark Mode Theme */
        html.dark body {
            background: #000c24;
            color: #f8fafc;
        }

        html.dark .kop-instansi {
            color: #34d399;
        }

        html.dark .kop-unit {
            color: #f8fafc;
        }

        html.dark .kop-alamat {
            color: #cbd5e1;
        }

        html.dark .title-box h1 {
            color: #f8fafc;
        }

        html.dark .title-box p {
            color: #cbd5e1;
        }

        html.dark .evidence-table th {
            background: #0f172a;
            color: #f8fafc;
            border-color: #475569;
        }

        html.dark .evidence-table td {
            border-color: #475569;
            color: #f8fafc;
        }

        html.dark .team-box {
            background: #0f172a;
            border-color: #334155;
            color: #cbd5e1;
        }

        html.dark .seal-container {
            background: #0f172a;
            border-top-color: #475569;
            color: #cbd5e1;
        }

        html.dark .qr-box {
            background: #0f172a !important;
            border-color: #475569 !important;
            color: #f8fafc !important;
        }

        html.dark .text-muted-report {
            color: #cbd5e1 !important;
        }

        html.dark .text-seal-title {
            color: #34d399 !important;
        }

        html.dark .text-danger-report {
            color: #f87171 !important;
        }

        @media print {
            .no-print {
                display: none !important;
            }
            body, html.dark body {
                padding: 0;
                margin: 0;
                background: #ffffff !important;
                color: #0f172a !important;
            }
            .printable-document {
                max-width: 100%;
            }
            tr {
                page-break-inside: avoid;
            }
            .page-break {
                page-break-after: always;
            }
            html.dark .kop-instansi { color: #064e3b !important; }
            html.dark .kop-unit { color: #111827 !important; }
            html.dark .kop-alamat { color: #334155 !important; }
            html.dark .title-box h1 { color: #0f172a !important; }
            html.dark .title-box p { color: #334155 !important; }
            html.dark .evidence-table th { background: #f1f5f9 !important; color: #0f172a !important; border-color: #cbd5e1 !important; }
            html.dark .evidence-table td { border-color: #cbd5e1 !important; color: #0f172a !important; }
            html.dark .team-box { background: #f8fafc !important; border-color: #cbd5e1 !important; color: #1e293b !important; }
            html.dark .seal-container { background: #f8fafc !important; border-top-color: #94a3b8 !important; color: #334155 !important; }
            html.dark .qr-box { background: #ffffff !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
            html.dark .text-muted-report { color: #334155 !important; }
            html.dark .text-seal-title { color: #047857 !important; }
            html.dark .text-danger-report { color: #b91c1c !important; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 12px;">
        <button
            id="theme-toggle"
            data-testid="theme-toggle"
            class="btn-print"
            style="background: #334155;"
            onclick="
                const isDark = document.documentElement.classList.toggle('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            "
        >Ganti Tema (Light/Dark)</button>
        <button class="btn-print" onclick="window.print()">Cetak Surat SP-1 (PDF)</button>
    </div>

    <div class="printable-document print-report" data-testid="printable-report">
        <!-- Kop Surat Resmi BPJS Kesehatan -->
        <div class="header-kop">
            <div class="kop-instansi">BADAN PENYELENGGARA JAMINAN SOSIAL KESEHATAN</div>
            <div class="kop-unit">TIM PENGAWASAN, PEMERIKSAAN & KENDALI MUTU (WASRIK PK-JKN)</div>
            <div class="kop-alamat">Kantor Cabang Utama &bull; Jalan Raya Jaminan Kesehatan No. 1 &bull; Call Center 165</div>
        </div>

        <!-- Meta Surat -->
        <div class="surat-meta">
            <div>
                <div><strong>Nomor:</strong> 882/WASRIK/SP-1/{{ date('Ym') }}/0114</div>
                <div><strong>Sifat:</strong> Sangat Segera / Rahasia</div>
                <div><strong>Lampiran:</strong> 1 (satu) Berkas Lembar Temuan</div>
                <div><strong>Perihal:</strong> Klarifikasi Faktual & Surat Pemberitahuan Pemeriksaan (SP-1 AUDIT VPK)</div>
            </div>
            <div style="text-align: right;">
                <div>Jakarta, {{ $dateIndo }}</div>
            </div>
        </div>

        <!-- Tujuan Surat -->
        <div class="tujuan-surat">
            <div>Kepada Yth.</div>
            <div><strong>Direktur Utama / Pimpinan FKRTL</strong></div>
            <div>{{ $claim['nama_faskes'] ?? 'RSUD Tarakan' }}</div>
            <div>Di Tempat</div>
        </div>

        <!-- Judul Formal -->
        <div class="title-box">
            <h1>SURAT PEMBERITAHUAN PEMERIKSAAN PASCA-KLAIM (SP-1 AUDIT VPK)</h1>
            <p>ID Berkas Uji: {{ $claimId }} &bull; No. SEP: {{ $claim['no_sep'] ?? '-' }} &bull; Dasar Hukum: Permenkes No. 16/2019 & Perpres No. 82/2018</p>
        </div>

        <!-- Isi Surat -->
        <div class="isi-surat">
            <p>
                Dengan hormat,<br/>
                Sehubungan dengan hasil audit algoritma penapisan anomali Tri-Layer dan proses Verifikasi Pasca-Klaim (VEDIKA) atas berkas klaim pelayanan peserta Jaminan Kesehatan Nasional, kami sampaikan bahwa terhadap berkas klaim dengan rincian berikut:
            </p>

            <table class="evidence-table table-fixed">
                <tr>
                    <td style="width: 25%; font-weight: bold;">ID Klaim / No. SEP</td>
                    <td>{{ $claimId }} / {{ $claim['no_sep'] ?? '-' }}</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">Nama Peserta (Zero-PHI)</td>
                    <td>{{ $claim['patient_pseudo'] ?? 'Pasien JKN' }} (NIK Terproteksi: {{ $claim['patient_nik_masked'] ?? '3171********0001' }})</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">Koding INA-CBG / Nilai Tagih</td>
                    <td>{{ $claim['kode_cbg'] ?? 'N-3-10-0' }} &bull; Rp {{ number_format($claim['tarif_fkl47'] ?? 4200000, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td class="text-danger-report" style="font-weight: bold;">Temuan Dugaan Anomali</td>
                    <td class="text-danger-report" style="font-weight: bold;">
                        Terindikasi Modus #6 Phantom Billing / Anomali Geovelocity &bull; Ketidaksesuaian Kehadiran Fisik Pasien & Klarifikasi Faktual Lapangan
                    </td>
                </tr>
            </table>

            <p>
                Berdasarkan temuan di atas, Tim Wasrik BPJS Kesehatan akan melaksanakan <strong>Klarifikasi Faktual dan Pemeriksaan Langsung (Audit Lapangan)</strong> ke fasilitas kesehatan Saudara guna memeriksa keabsahan dokumen otentik pelayanan. Saudara diminta menyiapkan dokumen asli / otentik sebagai berikut:
            </p>

            <table class="evidence-table table-fixed">
                <thead>
                    <tr>
                        <th style="width: 8%; text-align: center;">No</th>
                        <th>Daftar Dokumen dan Alat Bukti yang Wajib Disiapkan</th>
                        <th style="width: 30%;">Keterangan / Parameter Uji</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="text-align: center;">1</td>
                        <td><strong>Buku Register Rawat & Presensi Pasien</strong></td>
                        <td>Register Harian ruang tindakan/poliklinik asli bertanda tangan pasien.</td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">2</td>
                        <td><strong>Berkas Rekam Medis Lengkap (CPPT Asli)</strong></td>
                        <td>Catatan Perkembangan Pasien Terintegrasi dengan otorisasi TTE DPJP sah.</td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">3</td>
                        <td><strong>Log Mesin Penunjang / Hemodialisa / Radiologi</strong></td>
                        <td>Mesin print-out log waktu riil (timestamp telemetry mesin medis).</td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">4</td>
                        <td><strong>Bukti Kehadiran Digital Mobile JKN / FRISTA</strong></td>
                        <td>Data log face recognition biometrik dan bukti check-in antrean.</td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">5</td>
                        <td><strong>Rincian Biaya Riil (Itemized Bill) Rumah Sakit</strong></td>
                        <td>Kesesuaian obat fornas, BMHP, dan tindakan medis yang terinput.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Tim Audit dan Jadwal Pemeriksaan -->
        <div class="team-box">
            <div style="font-weight: bold; margin-bottom: 4px;">PENUGASAN TIM WASRIK & JADWAL PEMERIKSAAN:</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                    <strong>Susunan Tim Audit Wasrik:</strong><br/>
                    1. Ketua Tim Wasrik: dr. Hendra Wijaya, Sp.OT<br/>
                    2. Anggota Tim: Maya Safitri, S.Farm, Apt (Analis Farmasi)<br/>
                    3. Verifikator Medis: dr. Siti Rahma, Sp.PK
                </div>
                <div>
                    <strong>Jadwal Pelaksanaan Pemeriksaan:</strong><br/>
                    Tanggal Pemeriksaan: <strong>{{ date('d', strtotime('+3 days')) }} s/d {{ date('d', strtotime('+5 days')) }} {{ $months[$currentMonth] }} {{ date('Y') }}</strong><br/>
                    Waktu: Pukul 09.00 WIB s/d Selesai<br/>
                    Lokasi: Ruang Komite Medik / Casemix {{ $claim['nama_faskes'] ?? 'RSUD Tarakan' }}
                </div>
            </div>
        </div>

        <p style="margin: 12px 0; text-align: justify;">
            Demikian surat pemberitahuan pemeriksaan ini disampaikan untuk menjadi perhatian dan dipersiapkan sebaik-baiknya. Atas kerja sama dan komitmen menjaga integritas dana amanah JKN, kami ucapkan terima kasih.
        </p>

        <!-- Tanda Tangan -->
        <div class="signatures">
            <div class="sign-block">
                <div>Kepala Kantor Cabang Utama / Ketua Tim Wasrik PK-JKN</div>
                <div class="sign-space"></div>
                <div><strong>dr. Hendra Wijaya, Sp.OT</strong></div>
                <div>NIP. 198503152010011002</div>
            </div>
        </div>

        <!-- Segel Elektronik SHA-256 -->
        <div class="seal-container">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="max-width: 80%;">
                    <div class="text-seal-title font-bold">SEGEL ELEKTRONIK WASRIK SHA-256 (SURAT SP-1 AUDIT RESMI)</div>
                    <div style="font-size: 8.5px; word-break: break-all; margin-top: 2px;">
                        HASH: {{ $digitalSeal }}
                    </div>
                    <div class="text-muted-report" style="font-size: 8px; margin-top: 2px;">
                        Surat resmi kedinasan diterbitkan secara otomatis oleh modul Pengawasan & Anti-Fraud ClaimTrace JKN.
                    </div>
                </div>
                <div class="qr-box">
                    <div style="font-size: 8px; font-weight: bold;">KODE QR</div>
                    <div class="text-muted-report" style="font-size: 7px;">SP-1 AUDIT</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
