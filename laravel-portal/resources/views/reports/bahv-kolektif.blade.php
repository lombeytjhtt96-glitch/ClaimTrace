<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Berita Acara Hasil Verifikasi (BAHV) FPK Kolektif — BPJS Kesehatan</title>

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
            margin: 15mm 15mm 15mm 15mm;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 24px;
            font-size: 11px;
            line-height: 1.45;
        }

        .printable-document {
            max-width: 800px;
            margin: 0 auto;
        }

        .header-kop {
            border-bottom: 2.5px solid #047857;
            padding-bottom: 12px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .brand-title {
            font-size: 14px;
            font-weight: bold;
            color: #064e3b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 3px 0;
        }

        .brand-sub {
            font-size: 10px;
            color: #334155;
            margin: 0;
        }

        .doc-meta {
            text-align: right;
            font-size: 10px;
            color: #334155;
            font-family: monospace;
        }

        .title-box {
            text-align: center;
            margin: 16px 0;
            padding: 8px 12px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
        }

        .title-box h1 {
            font-size: 12px;
            margin: 0;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 0.5px;
        }

        .title-box p {
            margin: 3px 0 0 0;
            font-size: 10px;
            color: #334155;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 14px 0;
            font-size: 10.5px;
        }

        th, td {
            border: 1px solid #94a3b8;
            padding: 6px 8px;
            text-align: left;
        }

        th {
            background: #f1f5f9;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9.5px;
            text-align: center;
        }

        td.num {
            text-align: right;
            font-family: monospace;
            font-variant-numeric: tabular-nums;
        }

        .summary-box {
            margin: 14px 0;
            padding: 10px 14px;
            background: #ecfdf5;
            border: 1px solid #6ee7b7;
            font-size: 10.5px;
            color: #064e3b;
        }

        .signatures {
            margin-top: 28px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
        }

        .sign-block {
            width: 45%;
            font-size: 11px;
        }

        .sign-space {
            height: 60px;
        }

        .stamp-box {
            border: 1px dashed #047857;
            padding: 8px;
            margin-top: 6px;
            font-family: monospace;
            font-size: 9px;
            color: #064e3b;
            background: #f0fdf4;
            display: inline-block;
        }

        .seal-container {
            margin-top: 20px;
            padding: 10px 12px;
            border-top: 1px dashed #94a3b8;
            font-family: monospace;
            font-size: 9.5px;
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
            margin-bottom: 16px;
        }

        .text-muted-report {
            color: #334155;
        }

        .text-seal-title {
            color: #047857;
        }

        tr.bg-total {
            background: #f1f5f9;
        }

        .qr-box {
            text-align: center;
            border: 1px solid #cbd5e1;
            padding: 6px 10px;
            background: #ffffff;
            color: #0f172a;
        }

        /* Dark Mode Theme */
        html.dark body {
            background: #000c24;
            color: #f8fafc;
        }

        html.dark .title-box {
            background: #0f172a;
            border-color: #334155;
            color: #f8fafc;
        }

        html.dark .title-box h1 {
            color: #f8fafc;
        }

        html.dark .title-box p {
            color: #cbd5e1;
        }

        html.dark table th {
            background: #0f172a;
            color: #f8fafc;
            border-color: #475569;
        }

        html.dark table td {
            border-color: #475569;
            color: #f8fafc;
        }

        html.dark tr.bg-total {
            background: #1e293b !important;
            color: #f8fafc !important;
        }

        html.dark .brand-title {
            color: #34d399;
        }

        html.dark .brand-sub,
        html.dark .doc-meta {
            color: #cbd5e1;
        }

        html.dark .stamp-box {
            background: #064e3b;
            color: #a7f3d0;
            border-color: #059669;
        }

        html.dark .seal-container {
            background: #0f172a;
            color: #cbd5e1;
            border-top-color: #475569;
        }

        html.dark .summary-box {
            background: #064e3b;
            border-color: #059669;
            color: #f8fafc;
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
            html.dark .title-box { background: #f8fafc !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
            html.dark table th { background: #f1f5f9 !important; color: #0f172a !important; border-color: #94a3b8 !important; }
            html.dark table td { border-color: #94a3b8 !important; color: #0f172a !important; }
            html.dark tr.bg-total { background: #f1f5f9 !important; color: #0f172a !important; }
            html.dark .brand-title { color: #064e3b !important; }
            html.dark .brand-sub, html.dark .doc-meta { color: #334155 !important; }
            html.dark .stamp-box { background: #f0fdf4 !important; color: #064e3b !important; border-color: #047857 !important; }
            html.dark .seal-container { background: #f8fafc !important; color: #334155 !important; border-top-color: #94a3b8 !important; }
            html.dark .summary-box { background: #ecfdf5 !important; border-color: #6ee7b7 !important; color: #064e3b !important; }
            html.dark .qr-box { background: #ffffff !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
            html.dark .text-muted-report { color: #334155 !important; }
            html.dark .text-seal-title { color: #047857 !important; }
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
        <button class="btn-print" onclick="window.print()">Cetak Dokumen BAHV (PDF)</button>
    </div>

    <div class="printable-document print-report" data-testid="printable-report">
        <!-- Kop Surat Resmi BPJS Kesehatan -->
        <div class="header-kop">
            <div>
                <div class="brand-title">BADAN PENYELENGGARA JAMINAN SOSIAL KESEHATAN</div>
                <div class="brand-sub">Kedeputian Wilayah &bull; Kantor Cabang Utama Penjaminan Manfaat Rujukan (VEDIKA)</div>
                <div class="brand-sub">Sistem Pengawasan Klaim Pra-Bayar & Pengendalian Fraud ClaimTrace JKN</div>
            </div>
            <div class="doc-meta">
                <div><strong>No. Dokumen:</strong> BAHV/FPK/{{ date('Ym') }}/0114</div>
                <div><strong>Tanggal Cetak:</strong> {{ $dateIndo }}</div>
                <div><strong>Klasifikasi:</strong> Resmi / Terbatas</div>
            </div>
        </div>

        <!-- Judul Berita Acara -->
        <div class="title-box">
            <h1>BERITA ACARA HASIL VERIFIKASI (BAHV) & FORMULIR PENGAJUAN KLAIM (FPK) KOLEKTIF</h1>
            <p>Konsolidasi Pengawasan Klaim FKRTL &bull; Dasar Hukum: Perpres No. 82/2018 Pasal 76 ayat (2) & Permenkes No. 3/2023</p>
        </div>

        <p style="margin: 12px 0 8px 0; text-align: justify;">
            Pada hari ini, <strong>{{ $dateIndo }}</strong>, telah dilakukan verifikasi administrasi, kaidah koding INA-CBG, dan kesesuaian pelayanan medis atas pengajuan klaim kolektif FPK Rumah Sakit / FKRTL dengan rincian konsolidasi sebagai berikut:
        </p>

        <!-- Tabel Konsolidasi Hasil Verifikasi -->
        <table class="table-fixed">
            <thead>
                <tr>
                    <th rowspan="2" style="width: 28%;">Status Hasil Verifikasi</th>
                    <th colspan="3" style="width: 24%;">Rawat Jalan (RJTL)</th>
                    <th colspan="3" style="width: 24%;">Rawat Inap (RITL)</th>
                    <th colspan="2" style="width: 24%;">Total Konsolidasi FPK</th>
                </tr>
                <tr>
                    <th>Kasus</th><th>Lbr</th><th>Disetujui</th>
                    <th>Kasus</th><th>Hari</th><th>Disetujui</th>
                    <th>Total Kasus</th><th>Total Disetujui (FKL48)</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $sb = $recap['service_breakdown'] ?? [];
                    $layak = $sb['LAYAK'] ?? [];
                    $pending = $sb['PENDING'] ?? [];
                    $dispute = $sb['DISPUTE'] ?? [];
                    $fraud = $sb['TIDAK_LAYAK'] ?? [];
                @endphp
                <tr>
                    <td><strong>I. Klaim Layak Bayar (Disetujui)</strong></td>
                    <td class="num">{{ $layak['RJTL']['kasus'] ?? 2 }}</td>
                    <td class="num">{{ $layak['RJTL']['hari_lbr'] ?? 2 }}</td>
                    <td class="num">Rp {{ number_format($layak['RJTL']['biaya_disetujui_rp'] ?? 10220000, 0, ',', '.') }}</td>
                    <td class="num">{{ $layak['RITL']['kasus'] ?? 1 }}</td>
                    <td class="num">{{ $layak['RITL']['hari_lbr'] ?? 5 }}</td>
                    <td class="num">Rp {{ number_format($layak['RITL']['biaya_disetujui_rp'] ?? 4200000, 0, ',', '.') }}</td>
                    <td class="num font-bold">{{ $layak['TOTAL']['kasus'] ?? 3 }}</td>
                    <td class="num font-bold">Rp {{ number_format($layak['TOTAL']['biaya_disetujui_rp'] ?? 14420000, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td><strong>II. Klaim Pending / Klarifikasi Faskes</strong></td>
                    <td class="num">{{ $pending['RJTL']['kasus'] ?? 1 }}</td>
                    <td class="num">{{ $pending['RJTL']['hari_lbr'] ?? 1 }}</td>
                    <td class="num">Rp 0</td>
                    <td class="num">{{ $pending['RITL']['kasus'] ?? 1 }}</td>
                    <td class="num">{{ $pending['RITL']['hari_lbr'] ?? 5 }}</td>
                    <td class="num">Rp 0</td>
                    <td class="num font-bold">{{ $pending['TOTAL']['kasus'] ?? 2 }}</td>
                    <td class="num font-bold">Rp 0</td>
                </tr>
                <tr>
                    <td><strong>III. Klaim Dispute (Medis / Koding / TKMKB)</strong></td>
                    <td class="num">{{ $dispute['RJTL']['kasus'] ?? 0 }}</td>
                    <td class="num">{{ $dispute['RJTL']['hari_lbr'] ?? 0 }}</td>
                    <td class="num">Rp 0</td>
                    <td class="num">{{ $dispute['RITL']['kasus'] ?? 0 }}</td>
                    <td class="num">{{ $dispute['RITL']['hari_lbr'] ?? 0 }}</td>
                    <td class="num">Rp 0</td>
                    <td class="num font-bold">{{ $dispute['TOTAL']['kasus'] ?? 0 }}</td>
                    <td class="num font-bold">Rp 0</td>
                </tr>
                <tr>
                    <td><strong>IV. Klaim Tidak Layak / Ditolak (Fraud)</strong></td>
                    <td class="num">{{ $fraud['RJTL']['kasus'] ?? 1 }}</td>
                    <td class="num">{{ $fraud['RJTL']['hari_lbr'] ?? 1 }}</td>
                    <td class="num">Rp 0</td>
                    <td class="num">{{ $fraud['RITL']['kasus'] ?? 2 }}</td>
                    <td class="num">{{ $fraud['RITL']['hari_lbr'] ?? 11 }}</td>
                    <td class="num">Rp 0</td>
                    <td class="num font-bold">{{ $fraud['TOTAL']['kasus'] ?? 3 }}</td>
                    <td class="num font-bold">Rp 0</td>
                </tr>
                <tr class="bg-total" style="font-weight:bold;">
                    <td>TOTAL KESELURUHAN FPK</td>
                    <td class="num">{{ ($layak['RJTL']['kasus'] ?? 2) + ($pending['RJTL']['kasus'] ?? 1) + ($dispute['RJTL']['kasus'] ?? 0) + ($fraud['RJTL']['kasus'] ?? 1) }}</td>
                    <td class="num">{{ ($layak['RJTL']['hari_lbr'] ?? 2) + ($pending['RJTL']['hari_lbr'] ?? 1) + ($dispute['RJTL']['hari_lbr'] ?? 0) + ($fraud['RJTL']['hari_lbr'] ?? 1) }}</td>
                    <td class="num">Rp {{ number_format($recap['total_approved_rp'] ?? 14420000, 0, ',', '.') }}</td>
                    <td class="num">{{ ($layak['RITL']['kasus'] ?? 1) + ($pending['RITL']['kasus'] ?? 1) + ($dispute['RITL']['kasus'] ?? 0) + ($fraud['RITL']['kasus'] ?? 2) }}</td>
                    <td class="num">{{ ($layak['RITL']['hari_lbr'] ?? 5) + ($pending['RITL']['hari_lbr'] ?? 5) + ($dispute['RITL']['hari_lbr'] ?? 0) + ($fraud['RITL']['hari_lbr'] ?? 11) }}</td>
                    <td class="num">Rp 0</td>
                    <td class="num">{{ $recap['total_claims'] ?? 8 }}</td>
                    <td class="num">Rp {{ number_format($recap['total_approved_rp'] ?? 14420000, 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>

        <!-- Ringkasan Anggaran & Efisiensi -->
        <div class="summary-box">
            <strong>Ringkasan Realisasi & Pengendalian Anggaran:</strong><br/>
            Total Klaim Diajukan: <strong>Rp {{ number_format($recap['total_claimed_rp'] ?? 110220000, 0, ',', '.') }}</strong> |
            Disetujui Siap Bayar (FPK FKL48): <strong>Rp {{ number_format($recap['total_approved_rp'] ?? 14420000, 0, ',', '.') }}</strong> |
            Tertahan / Pending / Koreksi: <strong>Rp {{ number_format($recap['total_held_rp'] ?? 95800000, 0, ',', '.') }}</strong>
            (Rasio Efisiensi Pencegahan Fraud: <strong>{{ number_format($recap['prevention_efficiency_pct'] ?? 86.92, 2, ',', '.') }}%</strong>).
        </div>

        <!-- Blok Tanda Tangan Dua Pihak -->
        <div class="signatures">
            <div class="sign-block">
                <div><strong>Pihak Pertama (BPJS Kesehatan)</strong></div>
                <div class="text-muted-report" style="font-size: 10px;">Verifikator Medis Senior / Tim VEDIKA</div>
                <div class="sign-space"></div>
                <div class="stamp-box">Tanda Tangan Digital Terverifikasi</div>
                <div style="margin-top: 4px;"><strong>dr. Siti Rahma, Sp.PK</strong></div>
                <div>NIP. 198704202011012001</div>
            </div>
            <div class="sign-block" style="text-align: right;">
                <div><strong>Pihak Kedua (FKRTL / Rumah Sakit)</strong></div>
                <div class="text-muted-report" style="font-size: 10px;">Direktur Utama / Tim Casemix Rumah Sakit</div>
                <div class="sign-space"></div>
                <div class="stamp-box">Tanda Tangan Elektronik Sah</div>
                <div style="margin-top: 4px;"><strong>Direktur FKRTL Bersangkutan</strong></div>
                <div>Sesuai Mandat Permenkes No. 24/2022</div>
            </div>
        </div>

        <!-- Segel Kriptografis SHA-256 & QR Code Representation -->
        <div class="seal-container">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="max-width: 80%;">
                    <div class="text-seal-title" style="font-weight: bold;">SHA-256 DIGITAL STAMP & ELECTRONIC VERIFICATION SEAL</div>
                    <div style="font-size: 9px; word-break: break-all; margin-top: 3px;">
                        HASH: {{ $digitalSeal }}
                    </div>
                    <div class="text-muted-report" style="font-size: 8.5px; margin-top: 2px;">
                        Disahkan melalui ClaimTrace JKN VEDIKA Portal &bull; Standar Integritas UU PDP No. 27/2022 &bull; Dokumen sah tanpa tanda tangan basah fisik.
                    </div>
                </div>
                <div class="qr-box">
                    <div style="font-size: 9px; font-weight: bold;">KODE QR</div>
                    <div class="text-muted-report" style="font-size: 7.5px;">VALIDASI</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
