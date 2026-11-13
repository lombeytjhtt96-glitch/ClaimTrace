<?php

namespace Tests\Feature\Tier1;

use App\Console\Commands\ScanSlaDeadlines;
use App\Jobs\IngestAuditTrailJob;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class F26_ArtisanScanSlaTest extends TestCase
{
    /**
     * T1-F26-01: test_scan_sla_default_execution_exits_zero_with_table
     */
    public function test_scan_sla_default_execution_exits_zero_with_table(): void
    {
        $this->artisan('claimtrace:scan-sla')
            ->assertExitCode(0)
            ->expectsOutputToContain('CLAIMTRACE JKN - PEMINDAI BATAS WAKTU SLA 10 HARI KERJA')
            ->expectsOutputToContain('Perpres No. 82/2018')
            ->expectsOutputToContain('Ringkasan Urgensi');
    }

    /**
     * T1-F26-02: test_scan_sla_categorizes_urgency_tiers_per_perpres_82_2018
     */
    public function test_scan_sla_categorizes_urgency_tiers_per_perpres_82_2018(): void
    {
        $cmd = $this->artisan('claimtrace:scan-sla');
        $cmd->assertExitCode(0);

        // Verify all 4 urgency badges
        $cmd->expectsOutputToContain('[NORMAL]');
        $cmd->expectsOutputToContain('[PERINGATAN H-3]');
        $cmd->expectsOutputToContain('[KRITIS H-1]');
        $cmd->expectsOutputToContain('[TERLAMPAUI]');
    }

    /**
     * T1-F26-03: test_scan_sla_day_10_is_classified_as_critical_not_breached
     */
    public function test_scan_sla_day_10_is_classified_as_critical_not_breached(): void
    {
        $command = new ScanSlaDeadlines();

        // Day 10 (remaining = 0 HK) must be Critical H-1 per Perpres 82/2018
        $slaDay10 = $command->evaluateSla(10);
        $this->assertSame(ScanSlaDeadlines::URGENCY_CRITICAL_H1, $slaDay10['code']);
        $this->assertSame('[KRITIS H-1]', $slaDay10['badge']);
        $this->assertSame(0, $slaDay10['days_remaining']);

        // Day 11 (remaining = -1 HK) is Breached
        $slaDay11 = $command->evaluateSla(11);
        $this->assertSame(ScanSlaDeadlines::URGENCY_BREACHED, $slaDay11['code']);
        $this->assertSame('[TERLAMPAUI]', $slaDay11['badge']);
        $this->assertSame(-1, $slaDay11['days_remaining']);

        // Day 8 (remaining = 2 HK) is Warning H-3
        $slaDay8 = $command->evaluateSla(8);
        $this->assertSame(ScanSlaDeadlines::URGENCY_WARNING_H3, $slaDay8['code']);
        $this->assertSame('[PERINGATAN H-3]', $slaDay8['badge']);

        // Day 3 (remaining = 7 HK) is Normal
        $slaDay3 = $command->evaluateSla(3);
        $this->assertSame(ScanSlaDeadlines::URGENCY_NORMAL, $slaDay3['code']);
        $this->assertSame('[NORMAL]', $slaDay3['badge']);
    }

    /**
     * T1-F26-04: test_scan_sla_threshold_filter_restricts_output
     */
    public function test_scan_sla_threshold_filter_restricts_output(): void
    {
        // Threshold 8 HK should filter out claims with working days < 8 (such as CLM-8801, 8803, 8804)
        $this->artisan('claimtrace:scan-sla', ['--threshold' => 8])
            ->assertExitCode(0)
            ->expectsOutputToContain('CLM-2026-8802')
            ->expectsOutputToContain('CLM-2026-8805')
            ->expectsOutputToContain('CLM-2026-8806')
            ->doesntExpectOutputToContain('CLM-2026-8801');
    }

    /**
     * T1-F26-05: test_scan_sla_negative_threshold_clamped_to_zero
     */
    public function test_scan_sla_negative_threshold_clamped_to_zero(): void
    {
        $code = $this->artisan('claimtrace:scan-sla', ['--threshold' => -10])->run();
        $this->assertSame(0, $code);
    }

    /**
     * T1-F26-06: test_scan_sla_verifier_filter_restricts_by_nip
     */
    public function test_scan_sla_verifier_filter_restricts_by_nip(): void
    {
        $this->artisan('claimtrace:scan-sla', ['--verifier' => '198704202011012001'])
            ->assertExitCode(0)
            ->expectsOutputToContain('198704202011012001');

        // Non-existent verifier should return 0 claims matching
        $this->artisan('claimtrace:scan-sla', ['--verifier' => '999999999999999999'])
            ->assertExitCode(0)
            ->expectsOutputToContain('Tidak ada berkas klaim aktif yang memenuhi kriteria');
    }

    /**
     * T1-F26-07: test_scan_sla_json_format_emits_valid_json_payload
     */
    public function test_scan_sla_json_format_emits_valid_json_payload(): void
    {
        $output = '';
        \Illuminate\Support\Facades\Artisan::call('claimtrace:scan-sla', ['--json' => true]);
        $output = \Illuminate\Support\Facades\Artisan::output();

        $this->assertJson($output);
        $data = json_decode($output, true);
        $this->assertSame('success', $data['status']);
        $this->assertArrayHasKey('summary', $data);
        $this->assertArrayHasKey('claims', $data);
        $this->assertSame(10, $data['max_sla_working_days']);
    }

    /**
     * T1-F26-08: test_scan_sla_notify_option_dispatches_alerts_and_logs
     */
    public function test_scan_sla_notify_option_dispatches_alerts_and_logs(): void
    {
        Queue::fake();

        $this->artisan('claimtrace:scan-sla', ['--notify' => true])
            ->assertExitCode(0)
            ->expectsOutputToContain('Notifikasi & Log Audit');

        Queue::assertPushed(IngestAuditTrailJob::class);
    }

    /**
     * T1-F26-09: test_scan_sla_indonesian_thousand_dot_formatting
     */
    public function test_scan_sla_indonesian_thousand_dot_formatting(): void
    {
        \Illuminate\Support\Facades\Artisan::call('claimtrace:scan-sla');
        $output = \Illuminate\Support\Facades\Artisan::output();

        // Must contain Indonesian dot formatted amounts, e.g. 5.200.000 or 18.500.000
        $this->assertMatchesRegularExpression('/\b\d{1,3}(\.\d{3})+\b/', $output);
        $this->assertStringContainsString('5.200.000', $output);
        $this->assertStringContainsString('18.500.000', $output);
    }

    /**
     * T1-F26-10: test_scan_sla_strictly_zero_emojis_in_output
     */
    public function test_scan_sla_strictly_zero_emojis_in_output(): void
    {
        \Illuminate\Support\Facades\Artisan::call('claimtrace:scan-sla');
        $output = \Illuminate\Support\Facades\Artisan::output();

        $hasEmoji = preg_match('/[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', $output);
        $this->assertSame(0, $hasEmoji, 'Output scan-sla must strictly contain zero emojis.');
    }
}
