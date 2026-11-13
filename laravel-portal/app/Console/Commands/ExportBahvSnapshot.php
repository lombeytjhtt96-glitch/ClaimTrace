<?php

namespace App\Console\Commands;

use App\Services\HybridApiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ExportBahvSnapshot extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'claimtrace:export-bahv
                            {--period= : Periode YYYY-MM}
                            {--date= : Tanggal YYYY-MM-DD}
                            {--faskes= : Filter ID Faskes}
                            {--format=json : json atau csv}
                            {--output= : Path penyimpanan}';

    /**
     * The console command description.
     */
    protected $description = 'Ekspor snapshot rekonsiliasi Berita Acara Hasil Verifikasi (BAHV) RJTL vs RITL dengan segel digital SHA-256';

    /**
     * Execute the console command.
     */
    public function handle(HybridApiService $apiService): int
    {
        // 1. Validate Date and Period options
        $dateOpt = $this->option('date');
        $periodOpt = $this->option('period');

        if ($dateOpt !== null) {
            // Validate YYYY-MM-DD format
            if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateOpt) || strtotime($dateOpt) === false) {
                $this->error("Error: Format tanggal --date '{$dateOpt}' tidak valid. Gunakan format YYYY-MM-DD.");
                return 1;
            }
            $period = substr($dateOpt, 0, 7);
            $snapshotDate = $dateOpt;
        } elseif ($periodOpt !== null) {
            // Validate YYYY-MM format
            if (! preg_match('/^\d{4}-\d{2}$/', $periodOpt)) {
                $this->error("Error: Format periode --period '{$periodOpt}' tidak valid. Gunakan format YYYY-MM.");
                return 1;
            }
            $period = $periodOpt;
            $snapshotDate = $period.'-01';
        } else {
            $period = date('Y-m');
            $snapshotDate = date('Y-m-d');
        }

        // 2. Validate Format
        $format = strtolower((string) ($this->option('format') ?: 'json'));
        if (! in_array($format, ['json', 'csv'], true)) {
            $this->error("Error: Format '{$format}' tidak didukung. Pilih 'json' atau 'csv'.");
            return 1;
        }

        // 3. Resolve Destination File Path
        $outputPath = $this->option('output');
        if (! $outputPath) {
            $storageDir = storage_path('app/bahv');
            File::ensureDirectoryExists($storageDir);
            $timestamp = date('Ymd_His');
            $outputPath = "{$storageDir}/bahv_snapshot_{$period}_{$timestamp}.{$format}";
        } else {
            File::ensureDirectoryExists(dirname($outputPath));
        }

        // 4. Retrieve and Aggregate BAHV Recapitulation Data
        $faskesFilter = $this->option('faskes');
        $recap = $apiService->getBahvRecap();

        $aggregated = $this->aggregateSnapshotData($recap, $period, $snapshotDate, $faskesFilter);

        // 5. Compute 64-character Uppercase SHA-256 Digital Seal
        $datasetForHashing = [
            'system' => 'ClaimTrace JKN VEDIKA',
            'snapshot_type' => 'BAHV_RECONCILIATION',
            'period' => $period,
            'snapshot_date' => $snapshotDate,
            'faskes_id' => $faskesFilter ?: 'ALL',
            'totals' => $aggregated['totals'],
            'service_breakdown' => $aggregated['service_breakdown'],
        ];

        $canonicalHashInput = json_encode($datasetForHashing, JSON_UNESCAPED_SLASHES);
        $digitalSeal = strtoupper(hash('sha256', $canonicalHashInput));

        $aggregated['digital_seal_sha256'] = $digitalSeal;

        // 6. Write Formatted Output File (JSON or CSV)
        if ($format === 'json') {
            $fileContent = json_encode($aggregated, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            File::put($outputPath, $fileContent);
        } else {
            $fileContent = $this->generateCsvContent($aggregated, $digitalSeal);
            File::put($outputPath, $fileContent);
        }

        $fileSize = File::exists($outputPath) ? File::size($outputPath) : strlen($fileContent);

        // 7. Render Console Output Table & Summary
        $this->renderConsoleSummary($aggregated, $outputPath, $fileSize, $format, $digitalSeal);

        return 0;
    }

    /**
     * Aggregate BAHV snapshot datasets across RJTL vs RITL and 4 adjudication buckets.
     */
    protected function aggregateSnapshotData(array $recap, string $period, string $snapshotDate, ?string $faskesFilter): array
    {
        $buckets = $recap['buckets'] ?? [];
        $serviceBreakdown = $recap['service_breakdown'] ?? [];

        // Apply Faskes filter if requested
        if ($faskesFilter) {
            $filteredBuckets = [
                'LAYAK' => ['label' => 'Layak Bayar (ACC Pra-Bayar / VIDI)', 'count' => 0, 'claimed_rp' => 0, 'approved_rp' => 0, 'held_rp' => 0, 'items' => []],
                'PENDING' => ['label' => 'Pending / Klarifikasi Faskes (SLA 10 HK)', 'count' => 0, 'claimed_rp' => 0, 'approved_rp' => 0, 'held_rp' => 0, 'items' => []],
                'DISPUTE' => ['label' => 'Dispute Klinis / Koding (Eskalasi TKMKB)', 'count' => 0, 'claimed_rp' => 0, 'approved_rp' => 0, 'held_rp' => 0, 'items' => []],
                'TIDAK_LAYAK' => ['label' => 'Tidak Layak / Hold Audit Khusus PK-JKN', 'count' => 0, 'claimed_rp' => 0, 'approved_rp' => 0, 'held_rp' => 0, 'items' => []],
            ];

            $filteredBreakdown = [
                'LAYAK' => ['RJTL' => ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0], 'RITL' => ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0], 'TOTAL' => ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0]],
                'PENDING' => ['RJTL' => ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0], 'RITL' => ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0], 'TOTAL' => ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0]],
                'DISPUTE' => ['RJTL' => ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0], 'RITL' => ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0], 'TOTAL' => ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0]],
                'TIDAK_LAYAK' => ['RJTL' => ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0], 'RITL' => ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0], 'TOTAL' => ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0]],
            ];

            foreach ($buckets as $k => $b) {
                foreach ($b['items'] ?? [] as $item) {
                    $itemFaskesId = $item['faskes_id'] ?? '';
                    $itemFaskesName = $item['nama_faskes'] ?? '';
                    if ($itemFaskesId === $faskesFilter || stripos($itemFaskesName, $faskesFilter) !== false) {
                        $jp = strtoupper($item['jenis_pelayanan'] ?? 'RJTL');
                        if ($jp !== 'RITL') {
                            $jp = 'RJTL';
                        }
                        $tagih = (int) ($item['tarif_fkl47'] ?? 0);
                        $setuju = (int) ($item['approved_rp'] ?? ($k === 'LAYAK' ? $tagih : 0));
                        $selisih = max(0, $tagih - $setuju);

                        $filteredBuckets[$k]['count']++;
                        $filteredBuckets[$k]['claimed_rp'] += $tagih;
                        $filteredBuckets[$k]['approved_rp'] += $setuju;
                        $filteredBuckets[$k]['held_rp'] += $selisih;
                        $filteredBuckets[$k]['items'][] = $item;

                        $filteredBreakdown[$k][$jp]['kasus']++;
                        $filteredBreakdown[$k][$jp]['biaya_tagih_rp'] += $tagih;
                        $filteredBreakdown[$k][$jp]['biaya_disetujui_rp'] += $setuju;
                        $filteredBreakdown[$k][$jp]['selisih_rp'] += $selisih;

                        $filteredBreakdown[$k]['TOTAL']['kasus']++;
                        $filteredBreakdown[$k]['TOTAL']['biaya_tagih_rp'] += $tagih;
                        $filteredBreakdown[$k]['TOTAL']['biaya_disetujui_rp'] += $setuju;
                        $filteredBreakdown[$k]['TOTAL']['selisih_rp'] += $selisih;
                    }
                }
            }

            $buckets = $filteredBuckets;
            $serviceBreakdown = $filteredBreakdown;
        }

        $totalClaims = array_sum(array_column($buckets, 'count'));
        $totalClaimed = array_sum(array_column($buckets, 'claimed_rp'));
        $totalApproved = array_sum(array_column($buckets, 'approved_rp'));
        $totalHeld = array_sum(array_column($buckets, 'held_rp'));
        $preventionEff = $totalClaimed > 0 ? round(($totalHeld / $totalClaimed) * 100, 2) : 0.0;

        return [
            'system' => 'ClaimTrace JKN VEDIKA',
            'version' => '2.0.0-enterprise',
            'regulatory_basis' => 'Perpres No. 82/2018 & Permenkes No. 3/2023',
            'generated_at' => now()->toIso8601String(),
            'period' => $period,
            'snapshot_date' => $snapshotDate,
            'faskes_filter' => $faskesFilter ?: 'SEMUA_FASKES',
            'totals' => [
                'total_claims' => $totalClaims,
                'total_claimed_rp' => $totalClaimed,
                'total_claimed_idr' => 'Rp '.number_format($totalClaimed, 0, ',', '.'),
                'total_approved_rp' => $totalApproved,
                'total_approved_idr' => 'Rp '.number_format($totalApproved, 0, ',', '.'),
                'total_held_rp' => $totalHeld,
                'total_held_idr' => 'Rp '.number_format($totalHeld, 0, ',', '.'),
                'prevention_efficiency_pct' => $preventionEff,
                'prevention_efficiency_formatted' => number_format($preventionEff, 2, ',', '.').'%',
            ],
            'categories' => [
                'layak_bayar' => $buckets['LAYAK'] ?? [],
                'pending_klarifikasi' => $buckets['PENDING'] ?? [],
                'dispute_tkmkb' => $buckets['DISPUTE'] ?? [],
                'tidak_layak_fraud' => $buckets['TIDAK_LAYAK'] ?? [],
            ],
            'service_breakdown' => $serviceBreakdown,
        ];
    }

    /**
     * Generate standard RFC 4180 CSV export content with cryptographic footer comment.
     */
    protected function generateCsvContent(array $data, string $seal): string
    {
        $lines = [];
        $lines[] = '# CLAIMTRACE JKN - SNAPSHOT REKONSILIASI BAHV & FPK';
        $lines[] = '# Periode: '.$data['period'].' | Tanggal: '.$data['snapshot_date'];
        $lines[] = '# Faskes: '.$data['faskes_filter'];
        $lines[] = '# Regulasi: '.$data['regulatory_basis'];
        $lines[] = '';
        $lines[] = 'Kategori Putusan,Tingkat Layanan,Jumlah Kasus,Biaya Diajukan (Rp),Biaya Disetujui (Rp),Biaya Tertahan/Dispute (Rp)';

        $breakdown = $data['service_breakdown'] ?? [];
        $labels = [
            'LAYAK' => 'Layak Bayar (ACC Pra-Bayar)',
            'PENDING' => 'Pending Klarifikasi (SLA 10 HK)',
            'DISPUTE' => 'Sengketa TKMKB (Dispute)',
            'TIDAK_LAYAK' => 'Tidak Layak (Hold Fraud)',
        ];

        foreach ($labels as $key => $lbl) {
            $b = $breakdown[$key] ?? [];
            foreach (['RJTL', 'RITL', 'TOTAL'] as $tier) {
                $sub = $b[$tier] ?? ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0];
                $lines[] = sprintf(
                    '"%s","%s",%d,%d,%d,%d',
                    $lbl,
                    $tier,
                    $sub['kasus'] ?? 0,
                    $sub['biaya_tagih_rp'] ?? 0,
                    $sub['biaya_disetujui_rp'] ?? 0,
                    $sub['selisih_rp'] ?? 0
                );
            }
        }

        $lines[] = '';
        $lines[] = '# TOTAL KONSOLIDASI';
        $lines[] = sprintf('# Total Klaim,%d', $data['totals']['total_claims']);
        $lines[] = sprintf('# Total Diajukan (Rp),%d', $data['totals']['total_claimed_rp']);
        $lines[] = sprintf('# Total Disetujui (Rp),%d', $data['totals']['total_approved_rp']);
        $lines[] = sprintf('# Total Tertahan (Rp),%d', $data['totals']['total_held_rp']);
        $lines[] = sprintf('# Efisiensi Pencegahan (%%),%s', $data['totals']['prevention_efficiency_pct']);
        $lines[] = sprintf('# DIGITAL_SEAL_SHA256,%s', $seal);

        return implode("\n", $lines);
    }

    /**
     * Render formatted console summary table.
     */
    protected function renderConsoleSummary(array $data, string $outputPath, int $fileSize, string $format, string $seal): void
    {
        $this->line('+========================================================================================================+');
        $this->line('| CLAIMTRACE JKN - EKSPOR SNAPSHOT REKONSILIASI BAHV & FPK (PERPRES NO. 82/2018)                        |');
        $this->line('+========================================================================================================+');
        $this->line(sprintf(' Periode Rekonsiliasi  : %s', $data['period']));
        $this->line(sprintf(' Tanggal Snapshot      : %s', $data['snapshot_date']));
        $this->line(sprintf(' Filter Faskes         : %s', $data['faskes_filter']));
        $this->line(sprintf(' Format Berkas Luaran  : %s', strtoupper($format)));
        $this->line(sprintf(' Lokasi Penyimpanan    : %s', $outputPath));
        $this->line(sprintf(' Ukuran Berkas         : %s KB (%s bytes)', number_format($fileSize / 1024, 2, ',', '.'), number_format($fileSize, 0, ',', '.')));
        $this->line(sprintf(' Segel Digital SHA-256 : %s', $seal));
        $this->line('--------------------------------------------------------------------------------------------------------');
        $this->line(sprintf(' Total Berkas Klaim    : %s berkas', number_format($data['totals']['total_claims'], 0, ',', '.')));
        $this->line(sprintf(' Total Biaya Diajukan  : Rp %s', number_format($data['totals']['total_claimed_rp'], 0, ',', '.')));
        $this->line(sprintf(' Total Biaya Disetujui : Rp %s', number_format($data['totals']['total_approved_rp'], 0, ',', '.')));
        $this->line(sprintf(' Total Biaya Tertahan  : Rp %s', number_format($data['totals']['total_held_rp'], 0, ',', '.')));
        $this->line(sprintf(' Rasio Efisiensi Fraud : %s%%', number_format($data['totals']['prevention_efficiency_pct'], 2, ',', '.')));
        $this->line('+========================================================================================================+');

        $headers = [
            'Kategori Putusan',
            'RJTL (Kasus)',
            'RJTL (Rp)',
            'RITL (Kasus)',
            'RITL (Rp)',
            'Total Kasus',
            'Total Tagih (Rp)',
            'Disetujui (Rp)',
            'Tertahan (Rp)',
        ];

        $breakdown = $data['service_breakdown'] ?? [];
        $catLabels = [
            'LAYAK' => 'Layak Bayar (ACC Pra-Bayar)',
            'PENDING' => 'Pending Klarifikasi (SLA 10 HK)',
            'DISPUTE' => 'Sengketa TKMKB (Dispute)',
            'TIDAK_LAYAK' => 'Tidak Layak (Hold Fraud)',
        ];

        $rows = [];
        foreach ($catLabels as $key => $lbl) {
            $b = $breakdown[$key] ?? [];
            $rjtl = $b['RJTL'] ?? ['kasus' => 0, 'biaya_tagih_rp' => 0];
            $ritl = $b['RITL'] ?? ['kasus' => 0, 'biaya_tagih_rp' => 0];
            $tot = $b['TOTAL'] ?? ['kasus' => 0, 'biaya_tagih_rp' => 0, 'biaya_disetujui_rp' => 0, 'selisih_rp' => 0];

            $rows[] = [
                $lbl,
                number_format($rjtl['kasus'] ?? 0, 0, ',', '.'),
                number_format($rjtl['biaya_tagih_rp'] ?? 0, 0, ',', '.'),
                number_format($ritl['kasus'] ?? 0, 0, ',', '.'),
                number_format($ritl['biaya_tagih_rp'] ?? 0, 0, ',', '.'),
                number_format($tot['kasus'] ?? 0, 0, ',', '.'),
                number_format($tot['biaya_tagih_rp'] ?? 0, 0, ',', '.'),
                number_format($tot['biaya_disetujui_rp'] ?? 0, 0, ',', '.'),
                number_format($tot['selisih_rp'] ?? 0, 0, ',', '.'),
            ];
        }

        $this->table($headers, $rows);
        $this->info('Snapshot rekonsiliasi BAHV berhasil diekspor dan disegel secara kriptografis.');
    }
}
