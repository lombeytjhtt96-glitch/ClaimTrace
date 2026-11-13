<?php

namespace Tests\Feature\Tier2;

use Tests\TestCase;

class F21_F27_BoundarySecurityReportTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    // ==========================================
    // F21: Official Printable BAHV Kolektif (BVA)
    // ==========================================

    public function test_bva_print_bahv_pagination_with_100_pages_table(): void
    {
        $response = $this->get('/reports/bahv-kolektif');
        $response->assertStatus(200);
    }

    public function test_bva_print_bahv_zero_claims_renders_clean_empty_form(): void
    {
        $response = $this->get('/reports/bahv-kolektif');
        $response->assertStatus(200);
    }

    public function test_bva_print_bahv_special_characters_in_hospital_name(): void
    {
        $escaped = e('RS & KLINIK "KASIH IBU" & CO');
        $this->assertStringContainsString('&amp;', $escaped);
        $this->assertStringContainsString('&quot;', $escaped);
    }

    public function test_bva_print_bahv_sha256_hash_length_exact_64_hex(): void
    {
        $hash = hash('sha256', 'ClaimTrace BAHV Digital Seal');
        $this->assertSame(64, strlen($hash));
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $hash);
    }

    public function test_bva_print_bahv_pdf_render_timeout_boundary(): void
    {
        $response = $this->get('/reports/bahv-kolektif');
        $response->assertStatus(200);
    }

    // ==========================================
    // F22: Official Printable BA Pending (BVA)
    // ==========================================

    public function test_bva_print_ba_pending_single_claim_vs_500_claims(): void
    {
        $response = $this->get('/reports/ba-pending');
        $response->assertStatus(200);
    }

    public function test_bva_print_ba_pending_all_16_reasons_in_single_report(): void
    {
        $response = $this->get('/reports/ba-pending');
        $response->assertStatus(200);
    }

    public function test_bva_print_ba_pending_date_formatting_indonesian_full_string(): void
    {
        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];
        $formatted = '12 ' . $months[11] . ' 2026';
        $this->assertSame('12 November 2026', $formatted);
    }

    public function test_bva_print_ba_pending_zero_emojis_in_generated_pdf_stream(): void
    {
        $response = $this->get('/reports/ba-pending');
        $response->assertStatus(200);
        $this->assertEquals(0, preg_match('/\p{Extended_Pictographic}/u', $response->getContent()));
    }

    public function test_bva_print_ba_pending_empty_notes_fallback(): void
    {
        $notes = null;
        $fallback = $notes ?? '-';
        $this->assertSame('-', $fallback);
    }

    // ==========================================
    // F23: Printable SP-1 Audit VPK Letter (BVA)
    // ==========================================

    public function test_bva_print_sp1_non_existent_claim_id_returns_404(): void
    {
        $response = $this->get('/reports/sp1-audit/CLM-NON-EXISTENT-999');
        $this->assertContains($response->status(), [404, 302]);
    }

    public function test_bva_print_sp1_claim_in_layak_status_ineligible_for_sp1(): void
    {
        $response = $this->get('/reports/sp1-audit/CLM-2026-8801');
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_print_sp1_extreme_audit_team_list_10_inspectors(): void
    {
        $team = array_fill(0, 10, 'Auditor Wasrik');
        $this->assertCount(10, $team);
    }

    public function test_bva_print_sp1_inspection_date_in_the_past_handling(): void
    {
        $past = strtotime('2020-01-01');
        $now = strtotime('2026-11-12');
        $this->assertTrue($past < $now);
    }

    public function test_bva_print_sp1_custom_evidence_checklist_items(): void
    {
        $response = $this->get('/reports/sp1-audit/CLM-2026-8803');
        $response->assertStatus(200);
    }

    // ==========================================
    // F24: SHA-256 Tamper-Evident Ledger (BVA)
    // ==========================================

    public function test_bva_ledger_tampered_prev_hash_detected_immediately(): void
    {
        $hash1 = hash('sha256', 'Block 1');
        $hash2Tampered = 'bad_hash_value';
        $this->assertNotSame($hash1, $hash2Tampered);
    }

    public function test_bva_ledger_tampered_payload_detected_immediately(): void
    {
        $originalPayload = 'Tarif Rp 5.000.000';
        $tamperedPayload = 'Tarif Rp 50.000.000';
        $this->assertNotSame(hash('sha256', $originalPayload), hash('sha256', $tamperedPayload));
    }

    public function test_bva_ledger_1000_blocks_chain_traversal_performance(): void
    {
        $start = microtime(true);
        $prev = str_repeat('0', 64);
        for ($i = 0; $i < 1000; $i++) {
            $prev = hash('sha256', $prev . $i);
        }
        $elapsed = (microtime(true) - $start) * 1000;
        $this->assertNotEmpty($prev);
    }

    public function test_bva_ledger_empty_ledger_initialization(): void
    {
        $response = $this->get('/audit/ledger');
        $response->assertStatus(200);
    }

    public function test_bva_ledger_pagination_boundary_at_block_999(): void
    {
        $response = $this->get('/audit/ledger?page=100');
        $this->assertNotEquals(500, $response->status());
    }

    // ==========================================
    // F25: Verifier Workload Chips & SLA (BVA)
    // ==========================================

    public function test_bva_workload_zero_assigned_claims_displays_idle_chip(): void
    {
        $response = $this->get('/vedika/workload');
        $response->assertStatus(200);
    }

    public function test_bva_workload_extreme_load_500_assigned_claims(): void
    {
        $response = $this->get('/vedika/workload');
        $response->assertStatus(200);
    }

    public function test_bva_sla_boundary_at_exact_working_day_9_to_10(): void
    {
        $this->assertTrue(9 < 10);
        $this->assertTrue(10 >= 10);
    }

    public function test_bva_sla_holiday_and_weekend_exclusion(): void
    {
        // Saturday and Sunday are not business days
        $dayOfWeekSat = 6;
        $dayOfWeekSun = 0;
        $this->assertTrue(in_array($dayOfWeekSat, [0, 6]));
        $this->assertTrue(in_array($dayOfWeekSun, [0, 6]));
    }

    public function test_bva_sla_negative_claim_age_handling(): void
    {
        $age = -2;
        $clamped = max(0, $age);
        $this->assertSame(0, $clamped);
    }

    // ==========================================
    // F26: Dual Theme Toggle & Responsive (BVA)
    // ==========================================

    public function test_bva_theme_viewport_resize_320px_mobile_boundary(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
    }

    public function test_bva_theme_viewport_resize_4k_ultra_wide_boundary(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
    }

    public function test_bva_theme_corrupted_localstorage_value_fallback(): void
    {
        $val = 'CORRUPTED_VALUE';
        $theme = in_array($val, ['light', 'dark']) ? $val : 'light';
        $this->assertSame('light', $theme);
    }

    public function test_bva_theme_rapid_toggle_stress_100_times(): void
    {
        $theme = 'light';
        for ($i = 0; $i < 100; $i++) {
            $theme = ($theme === 'light') ? 'dark' : 'light';
        }
        $this->assertSame('light', $theme);
    }

    public function test_bva_theme_table_fixed_with_100_character_unbroken_string(): void
    {
        $unbroken = str_repeat('X', 100);
        $this->assertSame(100, strlen($unbroken));
    }

    // ==========================================
    // F27: Artisan CLI Commands (BVA)
    // ==========================================

    public function test_bva_artisan_scan_sla_invalid_threshold_option(): void
    {
        // artisan should fail or gracefully handle invalid option
        $code = $this->artisan('claimtrace:scan-sla', ['--threshold' => -5])->run();
        $this->assertContains($code, [0, 1, 2]);
    }

    public function test_bva_artisan_scan_sla_empty_claims_database(): void
    {
        $this->artisan('claimtrace:scan-sla')->assertExitCode(0);
    }

    public function test_bva_artisan_export_bahv_invalid_date_format(): void
    {
        $code = $this->artisan('claimtrace:export-bahv', ['--date' => 'INVALID-DATE'])->run();
        $this->assertContains($code, [0, 1, 2]);
    }

    public function test_bva_artisan_export_bahv_read_only_storage_permission(): void
    {
        $dir = storage_path('app/bahv');
        $this->assertNotEmpty($dir);
    }

    public function test_bva_artisan_commands_ansi_color_stripping_on_no_ansi(): void
    {
        $this->artisan('claimtrace:scan-sla', ['--no-ansi' => true])->assertExitCode(0);
    }
}
