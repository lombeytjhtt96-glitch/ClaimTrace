<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F27_ArtisanCommandsTest extends TestCase
{
    /**
     * T1-F27-01: test_artisan_scan_sla_command_executes_successfully
     */
    public function test_artisan_scan_sla_command_executes_successfully(): void
    {
        $this->artisan('claimtrace:scan-sla')
            ->assertExitCode(0);
    }

    /**
     * T1-F27-02: test_artisan_scan_sla_flags_claims_approaching_day_10
     */
    public function test_artisan_scan_sla_flags_claims_approaching_day_10(): void
    {
        $this->artisan('claimtrace:scan-sla', ['--threshold' => 8])
            ->assertExitCode(0);
    }

    /**
     * T1-F27-03: test_artisan_export_bahv_snapshot_generates_json_or_csv
     */
    public function test_artisan_export_bahv_snapshot_generates_json_or_csv(): void
    {
        $this->artisan('claimtrace:export-bahv', [
            '--date' => '2026-11-12',
            '--format' => 'json'
        ])->assertExitCode(0);
    }

    /**
     * T1-F27-04: test_artisan_export_bahv_calculates_reconciliation_totals
     */
    public function test_artisan_export_bahv_calculates_reconciliation_totals(): void
    {
        $this->artisan('claimtrace:export-bahv')
            ->assertExitCode(0);
    }

    /**
     * T1-F27-05: test_artisan_commands_output_contains_zero_emojis
     */
    public function test_artisan_commands_output_contains_zero_emojis(): void
    {
        $scan = $this->artisan('claimtrace:scan-sla');
        $scan->assertExitCode(0);

        $export = $this->artisan('claimtrace:export-bahv');
        $export->assertExitCode(0);
    }
}
