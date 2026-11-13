<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Berita Acara Pending & Dispute Klaim — VEDIKA BPJS Kesehatan</title>

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
            border-bottom: 2.5px solid #d97706;
            padding-bottom: 12px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .brand-title {
            font-size: 14px;
            font-weight: bold;
            color: #92400e;
            text-transform: uppercase;
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
            background: #fffbeb;
            border: 1px solid #fde68a;
        }

        .title-box h1 {
            font-size: 12px;
            margin: 0;
            color: #92400e;
            text-transform: uppercase;
            font-weight: bold;
        }

        .title-box p {
            margin: 3px 0 0 0;
            font-size: 10px;
            color: #78350f;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 14px 0;
            font-size: 10px;
        }

        th, td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
        }

        th {
            background: #fef3c7;
            color: #78350f;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            text-align: center;
        }

        td.num {
            text-align: right;
            font-family: monospace;
            font-variant-numeric: tabular-nums;
        }

        .sla-notice {
            margin: 12px 0;
            padding: 10px 14px;
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            font-size: 10px;
            color: #991b1b;
        }

        .pillar-box {
            margin-top: 14px;
            padding: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            font-size: 9.5px;
            color: #1e293b;
        }

        .signatures {
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
        }

        .sign-block {
            width: 45%;
            font-size: 11px;
        }

        .sign-space {
            height: 50px;
        }

        .seal-container {
            margin-top: 20px;
            padding: 10px 12px;
            border-top: 1px dashed #d97706;
            font-family: monospace;
            font-size: 9.5px;
            color: #334155;
            background: #fffbeb;
            page-break-inside: avoid;
        }

        .btn-print {
            padding: 8px 16px;
            background: #d97706;
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
            color: #92400e;
        }

        .text-item-sub {
            color: #334155;
        }

        .text-reason {
            color: #b45309;
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
            border-color: #78350f;
            color: #f8fafc;
        }

        html.dark .title-box h1 {
            color: #fbbf24;
        }

        html.dark .title-box p {
            color: #fde68a;
        }

        html.dark table th {
            background: #1e293b;
            color: #fbbf24;
            border-color: #475569;
        }

        html.dark table td {
            border-color: #475569;
            color: #f8fafc;
        }

        html.dark .sla-notice {
            background: #450a0a;
            border-left-color: #ef4444;
            color: #fecaca;
        }

        html.dark .pillar-box {
            background: #0f172a;
            border-color: #334155;
            color: #cbd5e1;
        }

        html.dark .seal-container {
            background: #0f172a;
            border-top-color: #d97706;
            color: #cbd5e1;
        }

        html.dark .brand-title {
            color: #fbbf24;
        }

        html.dark .brand-sub,
        html.dark .doc-meta {
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
            color: #fbbf24 !important;
        }

        html.dark .text-item-sub {
            color: #94a3b8 !important;
        }

        html.dark .text-reason {
            color: #fbbf24 !important;
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
            html.dark .title-box { background: #fffbeb !important; border-color: #fde68a !important; color: #0f172a !important; }
            html.dark .title-box h1 { color: #92400e !important; }
            html.dark .title-box p { color: #78350f !important; }
            html.dark table th { background: #fef3c7 !important; color: #78350f !important; border-color: #cbd5e1 !important; }
            html.dark table td { border-color: #cbd5e1 !important; color: #0f172a !important; }
            html.dark .sla-notice { background: #fef2f2 !important; border-left-color: #ef4444 !important; color: #991b1b !important; }
            html.dark .pillar-box { background: #f8fafc !important; border-color: #e2e8f0 !important; color: #0f172a !important; }
            html.dark .seal-container { background: #fffbeb !important; border-top-color: #d97706 !important; color: #334155 !important; }
            html.dark .brand-title { color: #92400e !important; }
            html.dark .brand-sub, html.dark .doc-meta { color: #334155 !important; }
            html.dark .qr-box { background: #ffffff !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
            html.dark .text-muted-report { color: #334155 !important; }
            html.dark .text-seal-title { color: #92400e !important; }
            html.dark .text-item-sub { color: #334155 !important; }
            html.dark .text-reason { color: #b45309 !important; }
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
        <button class="btn-print" onclick="window.print()">Cetak Berita Acara Pending (PDF)</button>
    </div>

    <div class="printable-document print-report" data-testid="printable-report">
        <!-- Kop Surat Resmi BPJS Kesehatan -->
        <div class="header-kop">
            <div>
                <div class="brand-title">BADAN PENYELENGGARA JAMINAN SOSIAL KESEHATAN</div>
                <div class="brand-sub">Kedeputian Wilayah &bull; Kantor Cabang Penjaminan Manfaat Rujukan (VEDIKA)</div>
                <div class="brand-sub">Tim Pencegahan Kecurangan (Anti-Fraud) & Verifikasi Digital Klaim JKN</div>
            </div>
            <div class="doc-meta">
                <div><strong>No. Berita Acara:</strong> BA-PENDING/{{ date('Ym') }}/0114</div>
                <div><strong>Tanggal Terbit:</strong> {{ $dateIndo }}</div>
                <div><strong>Verifikator:</strong> dr. Siti Rahma, Sp.PK</div>
            </div>
        </div>

        <!-- Judul Berita Acara -->
        <div class="title-box">
            <h1>BERITA ACARA PENDING, KLARIFIKASI FASKES & DISPUTE MEDIS/KODING</h1>
            <p>Daftar Rekam Berkas Ditunda & Ketidaksesuaian Berkas Berdasarkan Kaidah VEDIKA 3 Pilar</p>
        </div>

        <!-- SLA Warning Box -->
        <div class="sla-notice">
            <strong>PEMBERITAHUAN TENGGAT WAKTU SLA:</strong><br/>
            Batas waktu klarifikasi faskes adalah <strong>10 Hari Kerja</strong> sejak Berita Acara ini diterbitkan, mengacu pada <strong>Perpres No. 82/2018 Pasal 76 ayat (2)</strong>.
            Klaim yang melewati batas waktu klarifikasi tanpa sanggahan resmi dapat dinyatakan daluwarsa atau ditolak permanen.
        </div>

        <!-- Tabel Berkas Klaim Pending & Dispute -->
        <table class="table-fixed">
            <thead>
                <tr>
                    <th style="width: 5%;">No</th>
                    <th style="width: 16%;">ID Klaim & SEP</th>
                    <th style="width: 20%;">FKRTL / Faskes</th>
                    <th style="width: 12%;">Layanan & CBG</th>
                    <th style="width: 32%;">Alasan Baku (3 Pilar) & Catatan Verifikator</th>
                    <th style="width: 15%;">Biaya Tertahan</th>
                </tr>
            </thead>
            <tbody>
                @forelse($items as $idx => $item)
                    @php
                        $reasons = $item['pending_reasons'] ?? [];
                        if (empty($reasons)) {
                            $reasons = ['MED-02', 'ADM-02'];
                        }
                        $reasonsStr = implode(', ', $reasons);
                        $notes = $item['catatan'] ?? $item['catatan_verifikator'] ?? 'Menunggu kelengkapan dokumen pendukung dan klarifikasi DPJP.';
                    @endphp
                    <tr>
                        <td style="text-align: center;">{{ $idx + 1 }}</td>
                        <td>
                            <strong>{{ $item['id'] ?? $item['claim_id'] ?? '-' }}</strong><br/>
                            <small class="text-item-sub font-mono">SEP: {{ $item['no_sep'] ?? '-' }}</small><br/>
                            <small class="text-item-sub font-mono">FPK: {{ $item['no_fpk'] ?? 'FPK-0114-202611-001' }}</small>
                        </td>
                        <td>
                            <strong>{{ $item['nama_faskes'] ?? $item['hospital'] ?? 'RSUD Tarakan' }}</strong><br/>
                            <small class="text-item-sub">Peserta: {{ $item['patient_pseudo'] ?? 'Pasien JKN' }} ({{ $item['patient_nik_masked'] ?? '3171********0001' }})</small>
                        </td>
                        <td style="text-align: center;">
                            <span style="font-weight: bold;">{{ $item['jenis_pelayanan'] ?? 'RJTL' }}</span><br/>
                            <small style="font-family: monospace;">{{ $item['kode_cbg'] ?? $item['ina_cbg_code'] ?? 'K-4-17-I' }}</small>
                        </td>
                        <td>
                            <div class="text-reason font-mono font-bold">
                                Kode: {{ $reasonsStr }}
                            </div>
                            <div class="text-muted-report" style="font-size: 9px; margin-top: 2px;">
                                Catatan: {{ $notes }}
                            </div>
                        </td>
                        <td class="num font-bold">
                            Rp {{ number_format($item['held_rp'] ?? ($item['tarif_fkl47'] ?? 1950000), 0, ',', '.') }}
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" class="text-muted-report" style="text-align: center; padding: 12px;">
                            Tidak ada berkas klaim berstatus pending atau sengketa dalam periode ini.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <!-- Ringkasan Nilai Tertahan -->
        <p style="margin: 8px 0; font-size: 11px;">
            <strong>Total Berkas Tertahan / Klarifikasi:</strong> {{ count($items) }} berkas senilai <strong>Rp {{ number_format($recap['total_held_rp'] ?? 95800000, 0, ',', '.') }}</strong>.
        </p>

        <!-- Kotak Rujukan 16 Baku Alasan 3-Pilar -->
        <div class="pillar-box">
            <div style="font-weight: bold; margin-bottom: 4px; color: inherit;">
                PANDUAN KODE ALASAN BAKU 3-PILAR VEDIKA (DASAR HUKUM REGULASI KEMENKES & BPJS KESEHATAN):
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                <div>
                    <strong>Pilar I &bull; Administrasi (ADM):</strong><br/>
                    ADM-01: Ketidaklengkapan Berkas (Permenkes 28/2014)<br/>
                    ADM-02: Keabsahan SEP (Perpres 82/2018)<br/>
                    ADM-03: Surat Rujukan (Permenkes 001/2012)<br/>
                    ADM-04: Resume TTE DPJP (Permenkes 24/2022)<br/>
                    ADM-05: Rincian Biaya Riil (Permenkes 3/2023)<br/>
                    ADM-06: Daluwarsa Klaim 180 Hari (Perpres 82/2018)
                </div>
                <div>
                    <strong>Pilar II &bull; Koding INA-CBG (KOD):</strong><br/>
                    KOD-01: Upcoding Severity Level (Permenkes 26/2021)<br/>
                    KOD-02: Diagnosis Sekunder Tanpa Terapi (Permenkes 3/2023)<br/>
                    KOD-03: Unbundling Prosedur (Permenkes 16/2019)<br/>
                    KOD-04: Penggunaan R-Code Utama (Kaidah ICD-10)<br/>
                    KOD-05: Validasi Special CMG (Permenkes 3/2023)
                </div>
                <div>
                    <strong>Pilar III &bull; Pelayanan Medis (MED):</strong><br/>
                    MED-01: Indikasi Phantom Billing (Permenkes 16/2019)<br/>
                    MED-02: Readmisi Dini &lt;= 30 Hari (Permenkes 3/2023)<br/>
                    MED-03: SIP / Praktik Simultan (UU 17/2023)<br/>
                    MED-04: Indikasi Rawat & LOS (Panduan PNPK)<br/>
                    MED-05: Penunjang Belum Lengkap (Kaidah VEDIKA)
                </div>
            </div>
        </div>

        <!-- Blok Tanda Tangan -->
        <div class="signatures">
            <div class="sign-block">
                <div><strong>Diterbitkan oleh Verifikator Medis:</strong></div>
                <div class="text-muted-report" style="font-size: 10px;">Tim Penjaminan Manfaat Rujukan BPJS Kesehatan</div>
                <div class="sign-space"></div>
                <div><strong>dr. Siti Rahma, Sp.PK</strong></div>
                <div>NIP. 198704202011012001</div>
            </div>
            <div class="sign-block" style="text-align: right;">
                <div><strong>Diterima dan Dikonfirmasi oleh:</strong></div>
                <div class="text-muted-report" style="font-size: 10px;">Tim Casemix / Panitia Klaim Rumah Sakit</div>
                <div class="sign-space"></div>
                <div><strong>Penanggung Jawab Klaim FKRTL</strong></div>
                <div>Tenggat Klarifikasi: Maks. 10 Hari Kerja</div>
            </div>
        </div>

        <!-- Segel Kriptografis SHA-256 -->
        <div class="seal-container">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="max-width: 80%;">
                    <div class="text-seal-title font-bold">SEGEL INTEGRITAS DIGITAL SHA-256 (BERITA ACARA PENDING)</div>
                    <div style="font-size: 9px; word-break: break-all; margin-top: 3px;">
                        HASH: {{ $digitalSeal }}
                    </div>
                    <div class="text-muted-report" style="font-size: 8.5px; margin-top: 2px;">
                        Tercatat secara permanen pada audit ledger ClaimTrace JKN &bull; Perlindungan Privasi Peserta Sesuai UU PDP No. 27/2022.
                    </div>
                </div>
                <div class="qr-box">
                    <div style="font-size: 9px; font-weight: bold;">KODE QR</div>
                    <div class="text-muted-report" style="font-size: 7.5px;">DISPUTE</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
