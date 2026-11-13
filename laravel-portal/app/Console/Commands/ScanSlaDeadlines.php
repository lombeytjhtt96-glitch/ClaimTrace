<?php

namespace App\Console\Commands;

use App\Services\HybridApiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ScanSlaDeadlines extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'claimtrace:scan-sla
                            {--notify : Notifikasi peringatan & audit log}
                            {--json : Luaran format JSON}
                            {--verifier= : Filter NIP verifikator}
                            {--min-days= : Batas minimal HK}
                            {--threshold= : Alias batas minimal HK}';

    /**
     * The console command description.
     */
    protected $description = 'Pindai tenggat SLA 10 hari kerja verifikasi klaim BPJS Kesehatan (Perpres 82/2018)';

    public const MAX_SLA_DAYS = 10;
    public const URGENCY_NORMAL = 'NORMAL';
    public const URGENCY_WARNING_H3 = 'WARNING_H3';
    public const URGENCY_CRITICAL_H1 = 'CRITICAL_H1';
    public const URGENCY_BREACHED = 'BREACHED';

    /**
     * Execute the console command.
     */
    public function handle(HybridApiService $apiService): int
    {
        // 1. Parse and validate options
        $verifierNip = $this->option('verifier');
        $threshOpt = $this->option('min-days') ?? $this->option('threshold');

        $minDays = 0;
        if ($threshOpt !== null) {
            if (! is_numeric($threshOpt)) {
                $this->error('Error: Nilai batas hari kerja (--threshold / --min-days) harus berupa angka valid.');
                return 1;
            }
            // Clamping boundary: negative values clamped to 0 for boundary safety
            $minDays = max(0, (int) $threshOpt);
        }

        $filters = [];
        if ($verifierNip) {
            $filters['assigned_verifier_nip'] = $verifierNip;
        }

        // 2. Retrieve claims from HybridApiService (live FastAPI with canonical fallback)
        try {
            $allClaims = $apiService->getClaims($filters);
        } catch (\Throwable $e) {
            $this->warn('Peringatan: Gagal menghubungi FastAPI engine, beralih ke dataset kanonikal: '.$e->getMessage());
            $allClaims = $apiService->getCanonicalClaimsQueue();
        }

        // 3. Process claims, calculate SLA urgency, and apply thresholds
        $scannedClaims = [];
        $summary = [
            'total_scanned' => 0,
            'normal_count' => 0,
            'warning_h3_count' => 0,
            'critical_h1_count' => 0,
            'breached_count' => 0,
            'total_claimed_rp' => 0,
        ];

        foreach ($allClaims as $claim) {
            $workingDays = (int) ($claim['sla_working_days'] ?? 0);

            // Filter by minDays / threshold
            if ($workingDays < $minDays) {
                continue;
            }

            // Filter by verifier if specified
            if ($verifierNip && ($claim['assigned_verifier_nip'] ?? '') !== $verifierNip) {
                continue;
            }

            $urgency = $this->evaluateSla($workingDays);
            $claimedRp = (int) ($claim['tarif_fkl47'] ?? $claim['biaya_riil_rs'] ?? 0);

            $scannedClaims[] = [
                'claim_id' => $claim['id'] ?? $claim['claim_id'] ?? '-',
                'no_sep' => $claim['no_sep'] ?? '-',
                'faskes' => $claim['nama_faskes'] ?? '-',
                'faskes_id' => $claim['faskes_id'] ?? '-',
                'jenis_pelayanan' => strtoupper($claim['jenis_pelayanan'] ?? 'RJTL'),
                'tarif_fkl47_rp' => $claimedRp,
                'tarif_fkl47_idr' => 'Rp '.number_format($claimedRp, 0, ',', '.'),
                'verifier_nip' => $claim['assigned_verifier_nip'] ?? '-',
                'verifier_name' => $claim['assigned_verifier_name'] ?? '-',
                'sla_working_days' => $workingDays,
                'days_remaining' => $urgency['days_remaining'],
                'urgency' => $urgency['code'],
                'urgency_label' => $urgency['label'],
                'urgency_badge' => $urgency['badge'],
                'status_klaim' => $claim['status'] ?? $claim['status_verifikasi'] ?? 'TERDAFTAR',
            ];

            $summary['total_scanned']++;
            $summary['total_claimed_rp'] += $claimedRp;

            switch ($urgency['code']) {
                case self::URGENCY_BREACHED:
                    $summary['breached_count']++;
                    break;
                case self::URGENCY_CRITICAL_H1:
                    $summary['critical_h1_count']++;
                    break;
                case self::URGENCY_WARNING_H3:
                    $summary['warning_h3_count']++;
                    break;
                case self::URGENCY_NORMAL:
                default:
                    $summary['normal_count']++;
                    break;
            }
        }

        // 4. Trigger notifications / audit logging if --notify is enabled
        $notifiedCount = 0;
        if ($this->option('notify')) {
            $notifiedCount = $this->notifyAlerts($scannedClaims);
        }

        // 5. Render JSON if --json option is active
        if ($this->option('json')) {
            $outputData = [
                'status' => 'success',
                'scanned_at' => now()->toIso8601String(),
                'regulatory_basis' => 'Perpres No. 82/2018 Pasal 75 (SLA 10 Hari Kerja)',
                'max_sla_working_days' => self::MAX_SLA_DAYS,
                'filter' => [
                    'verifier_nip' => $verifierNip,
                    'min_days' => $minDays,
                    'notify' => (bool) $this->option('notify'),
                ],
                'summary' => array_merge($summary, [
                    'total_claimed_idr' => 'Rp '.number_format($summary['total_claimed_rp'], 0, ',', '.'),
                    'notified_count' => $notifiedCount,
                ]),
                'claims' => $scannedClaims,
            ];

            $this->line(json_encode($outputData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            return 0;
        }

        // 6. Render Formatted CLI Table
        $this->renderCliTable($scannedClaims, $summary, $minDays, $verifierNip, $notifiedCount);

        return 0;
    }

    /**
     * Categorize SLA urgency according to statutory 10-day window (Perpres 82/2018).
     * Normal (>3 HK sisa), Warning H-3 (2-3 HK sisa), Critical H-1 (0-1 HK sisa), Breached (>10 HK terlampaui).
     * Day 10 is Critical, not Breached.
     */
    public function evaluateSla(int $workingDays): array
    {
        $remaining = self::MAX_SLA_DAYS - $workingDays;

        if ($workingDays > self::MAX_SLA_DAYS) {
            return [
                'code' => self::URGENCY_BREACHED,
                'label' => 'TERLAMPAUI (>10 HK)',
                'badge' => '[TERLAMPAUI]',
                'days_remaining' => $remaining,
            ];
        }

        if ($workingDays === self::MAX_SLA_DAYS || $remaining <= 1) { // Day 10 or 0-1 HK remaining
            return [
                'code' => self::URGENCY_CRITICAL_H1,
                'label' => 'KRITIS (Sisa 0-1 HK)',
                'badge' => '[KRITIS H-1]',
                'days_remaining' => $remaining,
            ];
        }

        if ($remaining <= 3) { // 2-3 HK remaining
            return [
                'code' => self::URGENCY_WARNING_H3,
                'label' => 'PERINGATAN (Sisa 2-3 HK)',
                'badge' => '[PERINGATAN H-3]',
                'days_remaining' => $remaining,
            ];
        }

        return [
            'code' => self::URGENCY_NORMAL,
            'label' => 'NORMAL (>3 HK)',
            'badge' => '[NORMAL]',
            'days_remaining' => $remaining,
        ];
    }

    /**
     * Dispatch notification warnings and record audit ledger alerts.
     */
    protected function notifyAlerts(array $claims): int
    {
        $count = 0;
        foreach ($claims as $c) {
            if ($c['urgency'] !== self::URGENCY_NORMAL) {
                $count++;
                Log::channel('single')->warning(sprintf(
                    '[SLA ALERT] Klaim %s (SEP: %s, Faskes: %s) berstatus %s (%d HK terlewati, sisa %d HK). Verifikator: %s. Dasar: Perpres 82/2018.',
                    $c['claim_id'],
                    $c['no_sep'],
                    $c['faskes'],
                    $c['urgency_label'],
                    $c['sla_working_days'],
                    $c['days_remaining'],
                    $c['verifier_nip']
                ));

                // Dispatch background audit trail job if available
                if (class_exists(\App\Jobs\IngestAuditTrailJob::class)) {
                    \App\Jobs\IngestAuditTrailJob::dispatch(
                        'SLA_DEADLINE_ALERT',
                        $c['claim_id'],
                        'SYSTEM_CLI',
                        [
                            'sla_working_days' => $c['sla_working_days'],
                            'urgency' => $c['urgency'],
                            'verifier_nip' => $c['verifier_nip'],
                            'timestamp' => now()->toIso8601String(),
                        ]
                    );
                }
            }
        }

        return $count;
    }

    /**
     * Render clean, zero-emoji CLI summary table with Indonesian number formatting.
     */
    protected function renderCliTable(array $claims, array $summary, int $minDays, ?string $verifierNip, int $notifiedCount): void
    {
        $this->line('+========================================================================================================+');
        $this->line('| CLAIMTRACE JKN - PEMINDAI BATAS WAKTU SLA 10 HARI KERJA (PERPRES NO. 82/2018)                          |');
        $this->line('+========================================================================================================+');
        $this->line(sprintf(' Waktu Pemindaian      : %s WIB', now()->format('Y-m-d H:i:s')));
        $this->line(sprintf(' Dasar Hukum           : Perpres No. 82/2018 Pasal 75 (SLA Verifikasi Klaim Maks. 10 HK)'));
        $this->line(sprintf(' Filter Verifikator    : %s', $verifierNip ?: 'Semua Verifikator'));
        $this->line(sprintf(' Ambang Batas Minimal  : >= %d Hari Kerja Terlewati', $minDays));
        $this->line(sprintf(' Total Berkas Dipindai : %s berkas', number_format($summary['total_scanned'], 0, ',', '.')));
        $this->line(sprintf(' Total Nilai Tagihan   : Rp %s', number_format($summary['total_claimed_rp'], 0, ',', '.')));
        $this->line('--------------------------------------------------------------------------------------------------------');
        $this->line(sprintf(' Ringkasan Urgensi     : [NORMAL] %d | [PERINGATAN H-3] %d | [KRITIS H-1] %d | [TERLAMPAUI] %d',
            $summary['normal_count'],
            $summary['warning_h3_count'],
            $summary['critical_h1_count'],
            $summary['breached_count']
        ));
        if ($this->option('notify')) {
            $this->line(sprintf(' Notifikasi & Log Audit: %d berkas berisiko telah dicatat ke audit log.', $notifiedCount));
        }
        $this->line('+========================================================================================================+');

        if (empty($claims)) {
            $this->info('Tidak ada berkas klaim aktif yang memenuhi kriteria penyaringan.');
            return;
        }

        $headers = [
            'ID Klaim',
            'No. SEP',
            'Nama Faskes',
            'Pelayanan',
            'Tarif Tagih (Rp)',
            'Verifikator NIP',
            'Hari Kerja',
            'Sisa HK',
            'Status Urgensi',
        ];

        $rows = [];
        foreach ($claims as $c) {
            $rows[] = [
                $c['claim_id'],
                $c['no_sep'],
                \Illuminate\Support\Str::limit($c['faskes'], 28),
                $c['jenis_pelayanan'],
                number_format($c['tarif_fkl47_rp'], 0, ',', '.'),
                $c['verifier_nip'],
                $c['sla_working_days'].' HK',
                ($c['days_remaining'] < 0 ? $c['days_remaining'].' HK' : '+'.$c['days_remaining'].' HK'),
                $c['urgency_badge'],
            ];
        }

        $this->table($headers, $rows);
        $this->line('+--------------------------------------------------------------------------------------------------------+');
        $this->line(' Catatan: Berkas dengan status [TERLAMPAUI] dan [KRITIS H-1] wajib diprioritaskan pada konsol VEDIKA.');
    }
}
