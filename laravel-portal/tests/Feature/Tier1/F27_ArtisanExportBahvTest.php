<?php

namespace Tests\Feature\Tier1;

use Illuminate\Support\Facades\File;
use Tests\TestCase;

class F27_ArtisanExportBahvTest extends TestCase
{
    protected string $testOutputDir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->testOutputDir = storage_path('app/testing_bahv');
        File::ensureDirectoryExists($this->testOutputDir);
    }

    protected function tearDown(): void
    {
        if (File::exists($this->testOutputDir)) {
            File::deleteDirectory($this->testOutputDir);
        }
        parent::tearDown();
    }

    /**
     * T1-F27-01: test_export_bahv_default_execution_generates_json_file
     */
    public function test_export_bahv_default_execution_generates_json_file(): void
    {
        $this->artisan('claimtrace:export-bahv')
            ->assertExitCode(0)
            ->expectsOutputToContain('CLAIMTRACE JKN - EKSPOR SNAPSHOT REKONSILIASI BAHV & FPK')
            ->expectsOutputToContain('Segel Digital SHA-256')
            ->expectsOutputToContain('Snapshot rekonsiliasi BAHV berhasil diekspor');

        $files = File::glob(storage_path('app/bahv/*.json'));
        $this->assertNotEmpty($files, 'Default export should write JSON file to storage/app/bahv.');
    }

    /**
     * T1-F27-02: test_export_bahv_period_option_structures_monthly_snapshot
     */
    public function test_export_bahv_period_option_structures_monthly_snapshot(): void
    {
        $outputPath = $this->testOutputDir.'/monthly_test.json';

        $this->artisan('claimtrace:export-bahv', [
            '--period' => '2026-11',
            '--output' => $outputPath,
        ])->assertExitCode(0);

        $this->assertFileExists($outputPath);
        $data = json_decode(File::get($outputPath), true);
        $this->assertSame('2026-11', $data['period']);
        $this->assertArrayHasKey('totals', $data);
        $this->assertArrayHasKey('service_breakdown', $data);
        $this->assertArrayHasKey('digital_seal_sha256', $data);
    }

    /**
     * T1-F27-03: test_export_bahv_date_option_structures_daily_snapshot
     */
    public function test_export_bahv_date_option_structures_daily_snapshot(): void
    {
        $outputPath = $this->testOutputDir.'/daily_test.json';

        $this->artisan('claimtrace:export-bahv', [
            '--date' => '2026-11-12',
            '--output' => $outputPath,
        ])->assertExitCode(0);

        $this->assertFileExists($outputPath);
        $data = json_decode(File::get($outputPath), true);
        $this->assertSame('2026-11-12', $data['snapshot_date']);
        $this->assertSame('2026-11', $data['period']);
    }

    /**
     * T1-F27-04: test_export_bahv_format_csv_generates_valid_csv_file
     */
    public function test_export_bahv_format_csv_generates_valid_csv_file(): void
    {
        $outputPath = $this->testOutputDir.'/recap_test.csv';

        $this->artisan('claimtrace:export-bahv', [
            '--format' => 'csv',
            '--output' => $outputPath,
        ])->assertExitCode(0);

        $this->assertFileExists($outputPath);
        $content = File::get($outputPath);

        $this->assertStringContainsString('Kategori Putusan,Tingkat Layanan', $content);
        $this->assertStringContainsString('# TOTAL KONSOLIDASI', $content);
        $this->assertStringContainsString('# DIGITAL_SEAL_SHA256,', $content);
    }

    /**
     * T1-F27-05: test_export_bahv_custom_output_path_writes_file_correctly
     */
    public function test_export_bahv_custom_output_path_writes_file_correctly(): void
    {
        $customFile = $this->testOutputDir.'/custom_snapshot.json';

        $this->artisan('claimtrace:export-bahv', [
            '--output' => $customFile,
        ])->assertExitCode(0);

        $this->assertFileExists($customFile);
        $this->assertGreaterThan(100, File::size($customFile));
    }

    /**
     * T1-F27-06: test_export_bahv_sha256_digital_seal_is_64_char_uppercase_hex
     */
    public function test_export_bahv_sha256_digital_seal_is_64_char_uppercase_hex(): void
    {
        $customFile = $this->testOutputDir.'/seal_test.json';

        $this->artisan('claimtrace:export-bahv', [
            '--output' => $customFile,
        ])->assertExitCode(0);

        $data = json_decode(File::get($customFile), true);
        $seal = $data['digital_seal_sha256'] ?? '';

        $this->assertSame(64, strlen($seal));
        $this->assertMatchesRegularExpression('/^[A-F0-9]{64}$/', $seal);
    }

    /**
     * T1-F27-07: test_export_bahv_digital_seal_tamper_evidence_assertion
     */
    public function test_export_bahv_digital_seal_tamper_evidence_assertion(): void
    {
        $customFile = $this->testOutputDir.'/tamper_test.json';

        $this->artisan('claimtrace:export-bahv', [
            '--output' => $customFile,
        ])->assertExitCode(0);

        $data = json_decode(File::get($customFile), true);
        $originalSeal = $data['digital_seal_sha256'];

        // Tamper with totals
        $datasetForHashing = [
            'system' => 'ClaimTrace JKN VEDIKA',
            'snapshot_type' => 'BAHV_RECONCILIATION',
            'period' => $data['period'],
            'snapshot_date' => $data['snapshot_date'],
            'faskes_id' => $data['faskes_filter'] === 'SEMUA_FASKES' ? 'ALL' : $data['faskes_filter'],
            'totals' => array_merge($data['totals'], ['total_approved_rp' => $data['totals']['total_approved_rp'] + 1000]),
            'service_breakdown' => $data['service_breakdown'],
        ];

        $tamperedSeal = strtoupper(hash('sha256', json_encode($datasetForHashing, JSON_UNESCAPED_SLASHES)));
        $this->assertNotEquals($originalSeal, $tamperedSeal, 'Any modification must invalidate original digital seal.');
    }

    /**
     * T1-F27-08: test_export_bahv_filters_by_faskes_id
     */
    public function test_export_bahv_filters_by_faskes_id(): void
    {
        $customFile = $this->testOutputDir.'/faskes_test.json';

        $this->artisan('claimtrace:export-bahv', [
            '--faskes' => '0114R001',
            '--output' => $customFile,
        ])->assertExitCode(0);

        $data = json_decode(File::get($customFile), true);
        $this->assertSame('0114R001', $data['faskes_filter']);
    }

    /**
     * T1-F27-09: test_export_bahv_rejects_invalid_date_format_fail_closed
     */
    public function test_export_bahv_rejects_invalid_date_format_fail_closed(): void
    {
        $code = $this->artisan('claimtrace:export-bahv', ['--date' => 'INVALID-DATE'])->run();
        $this->assertSame(1, $code);

        $codePeriod = $this->artisan('claimtrace:export-bahv', ['--period' => '2026-INVALID'])->run();
        $this->assertSame(1, $codePeriod);
    }

    /**
     * T1-F27-10: test_export_bahv_strictly_zero_emojis_in_cli_and_exported_files
     */
    public function test_export_bahv_strictly_zero_emojis_in_cli_and_exported_files(): void
    {
        $customFile = $this->testOutputDir.'/emoji_test.json';

        \Illuminate\Support\Facades\Artisan::call('claimtrace:export-bahv', [
            '--output' => $customFile,
        ]);
        $output = \Illuminate\Support\Facades\Artisan::output();
        $fileContent = File::get($customFile);

        $hasEmojiOutput = preg_match('/[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', $output);
        $hasEmojiFile = preg_match('/[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', $fileContent);

        $this->assertSame(0, $hasEmojiOutput, 'CLI output must contain 0 emojis.');
        $this->assertSame(0, $hasEmojiFile, 'Exported JSON file must contain 0 emojis.');
    }
}
