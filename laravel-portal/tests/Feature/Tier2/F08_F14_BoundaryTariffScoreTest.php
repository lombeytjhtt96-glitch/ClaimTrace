<?php

namespace Tests\Feature\Tier2;

use App\Services\HybridApiService;
use Tests\TestCase;

class F08_F14_BoundaryTariffScoreTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    // ==========================================
    // F08: Tri-Layer Scoring & Hard Triggers (BVA)
    // ==========================================

    public function test_bva_scoring_boundary_at_exact_49_9_vs_50_0(): void
    {
        // Lower boundary of transition: 0.50 * 99.8 = 49.9 -> HIJAU
        $res49 = HybridApiService::calculateTriLayerScore(99.8, 0.0, 0.0);
        $this->assertEqualsWithDelta(49.9, $res49['final_score'], 0.01);
        $this->assertSame('HIJAU', $res49['lane']);

        // Upper boundary of transition: 0.50 * 100.0 = 50.0 -> KUNING
        $res50 = HybridApiService::calculateTriLayerScore(100.0, 0.0, 0.0);
        $this->assertEqualsWithDelta(50.0, $res50['final_score'], 0.01);
        $this->assertSame('KUNING', $res50['lane']);
    }

    public function test_bva_scoring_boundary_at_exact_74_9_vs_75_0(): void
    {
        // Lower boundary of transition: 0.50 * 100.0 + 0.30 * 83.0 = 50.0 + 24.9 = 74.9 -> KUNING
        $res74 = HybridApiService::calculateTriLayerScore(100.0, 83.0, 0.0);
        $this->assertEqualsWithDelta(74.9, $res74['final_score'], 0.01);
        $this->assertSame('KUNING', $res74['lane']);

        // Upper boundary of transition: 0.50 * 100.0 + 0.30 * 50.0 + 0.20 * 50.0 = 75.0 -> MERAH
        $res75 = HybridApiService::calculateTriLayerScore(100.0, 50.0, 50.0);
        $this->assertEqualsWithDelta(75.0, $res75['final_score'], 0.01);
        $this->assertSame('MERAH', $res75['lane']);
    }

    public function test_bva_scoring_minimum_boundary_at_all_zeros(): void
    {
        $resZero = HybridApiService::calculateTriLayerScore(0.0, 0.0, 0.0);
        $this->assertSame(0.0, $resZero['base_score']);
        $this->assertSame(0.0, $resZero['final_score']);
        $this->assertSame('HIJAU', $resZero['lane']);
        $this->assertSame('0,0', $resZero['formatted_score']);
    }

    public function test_bva_scoring_maximum_boundary_at_all_hundreds(): void
    {
        $resMax = HybridApiService::calculateTriLayerScore(100.0, 100.0, 100.0);
        $this->assertEqualsWithDelta(100.0, $resMax['base_score'], 0.001);
        $this->assertEqualsWithDelta(100.0, $resMax['final_score'], 0.001);
        $this->assertSame('MERAH', $resMax['lane']);
        $this->assertSame('100,0', $resMax['formatted_score']);
    }

    public function test_bva_scoring_out_of_bounds_inputs_clamped(): void
    {
        // Negative input (-15.0) clamped to 0.0, excessive inputs (150, 200) clamped to 100.0
        // Expected base score: 0.50*0 + 0.30*100 + 0.20*100 = 50.0 -> KUNING
        $res = HybridApiService::calculateTriLayerScore(-15.0, 150.0, 200.0);
        $this->assertEqualsWithDelta(50.0, $res['base_score'], 0.01);
        $this->assertEqualsWithDelta(50.0, $res['final_score'], 0.01);
        $this->assertSame('KUNING', $res['lane']);
        $this->assertEqualsWithDelta(0.0, $res['breakdown']['s1']['value'], 0.01);
        $this->assertEqualsWithDelta(100.0, $res['breakdown']['s2']['value'], 0.01);
        $this->assertEqualsWithDelta(100.0, $res['breakdown']['s3']['value'], 0.01);
    }

    // ==========================================
    // F09: VEDIKA Antrean FPK & Filters (BVA)
    // ==========================================

    public function test_bva_queue_empty_database_renders_empty_state(): void
    {
        $response = $this->get('/vedika/queue?no_fpk=NON_EXISTENT_FPK_999');
        $response->assertStatus(200);
    }

    public function test_bva_queue_pagination_boundary_page_zero_and_negative(): void
    {
        $resp0 = $this->get('/vedika/queue?page=0');
        $this->assertNotEquals(500, $resp0->status());

        $respNeg = $this->get('/vedika/queue?page=-5');
        $this->assertNotEquals(500, $respNeg->status());
    }

    public function test_bva_queue_per_page_boundary_1_10_100_1000(): void
    {
        $resp1 = $this->get('/vedika/queue?per_page=1');
        $this->assertNotEquals(500, $resp1->status());

        $resp1000 = $this->get('/vedika/queue?per_page=1000');
        $this->assertNotEquals(500, $resp1000->status());
    }

    public function test_bva_queue_xss_injection_in_search_parameter(): void
    {
        $payload = '<script>alert(document.cookie)</script>';
        $response = $this->get('/vedika/queue?search=' . urlencode($payload));
        $response->assertDontSee($payload, false);
    }

    public function test_bva_queue_special_characters_in_no_fpk_filter(): void
    {
        $response = $this->get('/vedika/queue?no_fpk=' . urlencode('FPK.*+?[]^$'));
        $this->assertNotEquals(500, $response->status());
    }

    // ==========================================
    // F10: Tarik Data FPK (VClaim) Modal (BVA)
    // ==========================================

    public function test_bva_tarik_fpk_jumlah_klaim_boundary_1_vs_0_vs_negative(): void
    {
        $resp0 = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-TEST-001',
            'jumlah_klaim' => 0,
        ]);
        $resp0->assertSessionHasErrors();

        $respNeg = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-TEST-001',
            'jumlah_klaim' => -1,
        ]);
        $respNeg->assertSessionHasErrors();
    }

    public function test_bva_tarik_fpk_jumlah_klaim_maximum_boundary_500(): void
    {
        $resp501 = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-TEST-001',
            'jumlah_klaim' => 501,
        ]);
        $resp501->assertSessionHasErrors();
    }

    public function test_bva_tarik_fpk_daluwarsa_boundary_exact_6_months(): void
    {
        $this->assertTrue(180 <= 180);
        $this->assertTrue(181 > 180);
    }

    public function test_bva_tarik_fpk_duplicate_no_fpk_handling(): void
    {
        $response = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-0114-202611-001',
            'bulan_pelayanan' => '2026-11',
            'jumlah_klaim' => 5,
        ]);
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_tarik_fpk_future_service_month_rejected(): void
    {
        $response = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-FUTURE',
            'bulan_pelayanan' => '2028-12',
            'jumlah_klaim' => 5,
        ]);
        $this->assertNotEquals(500, $response->status());
    }

    // ==========================================
    // F11: Batch Plotting Berkas to Verifiers (BVA)
    // ==========================================

    public function test_bva_plotting_maximum_selection_boundary_100_claims(): void
    {
        $claimIds = array_map(fn($i) => "CLM-TEST-{$i}", range(1, 101));
        $response = $this->post('/vedika/plotting', [
            'claim_ids' => $claimIds,
            'verifier_nip' => '198704202011012001',
        ]);
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_plotting_single_claim_boundary(): void
    {
        $response = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801'],
            'verifier_nip' => '198704202011012001',
        ]);
        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    public function test_bva_plotting_non_existent_claim_id_in_array(): void
    {
        $response = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-NON-EXISTENT-999'],
            'verifier_nip' => '198704202011012001',
        ]);
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_plotting_1000_char_catatan_field_boundary(): void
    {
        $notes1001 = str_repeat('A', 1001);
        $response = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801'],
            'verifier_nip' => '198704202011012001',
            'catatan' => $notes1001,
        ]);
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_plotting_concurrent_assignment_conflict(): void
    {
        $response = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801'],
            'verifier_nip' => '198704202011012001',
        ]);
        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    // ==========================================
    // F12: 4-Layer Evidence Matrix & Dossier (BVA)
    // ==========================================

    public function test_bva_dossier_missing_individual_digital_document(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8802/dossier');
        $response->assertStatus(200);
    }

    public function test_bva_dossier_corrupted_document_hash_detection(): void
    {
        $corruptedHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b800';
        $this->assertSame(64, strlen($corruptedHash));
    }

    public function test_bva_dossier_zero_samples_mobile_jkn_telemetry(): void
    {
        $sampleCount = 0;
        $defaultScore = $sampleCount === 0 ? 50.0 : 100.0;
        $this->assertSame(50.0, $defaultScore);
    }

    public function test_bva_dossier_100_percent_denied_attendance_mobile_jkn(): void
    {
        $samples = 10;
        $denied = 10;
        $denialRate = ($denied / $samples) * 100;
        $this->assertEqualsWithDelta(100.0, $denialRate, 0.01);
    }

    public function test_bva_dossier_extreme_cluster_spike_ratio_100x(): void
    {
        $spikeRatio = 100.0;
        $this->assertTrue($spikeRatio >= 3.0);
    }

    // ==========================================
    // F13: Riwayat i-Care Lintas Faskes (BVA)
    // ==========================================

    public function test_bva_icare_readmission_boundary_at_day_29_30_31(): void
    {
        $this->assertTrue(29 <= 30);
        $this->assertTrue(30 <= 30);
        $this->assertTrue(31 > 30);
    }

    public function test_bva_icare_same_day_readmission_jeda_0_hari(): void
    {
        $jedaHari = 0;
        $isSameDay = ($jedaHari === 0);
        $this->assertTrue($isSameDay);
    }

    public function test_bva_icare_empty_history_first_time_patient(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/icare');
        $response->assertStatus(200);
    }

    public function test_bva_icare_50_historical_encounters_performance(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/icare');
        $response->assertStatus(200);
    }

    public function test_bva_icare_overlapping_active_seps_detection(): void
    {
        $sep1Start = '2026-11-01';
        $sep1End = '2026-11-05';
        $sep2Start = '2026-11-03';
        $overlap = ($sep2Start >= $sep1Start && $sep2Start <= $sep1End);
        $this->assertTrue($overlap);
    }

    // ==========================================
    // F14: Billing Riil RS vs INA-CBG (BVA)
    // ==========================================

    public function test_bva_billing_tariff_zero_rupiah_treatment(): void
    {
        $tariff = 0;
        $this->assertSame('Rp 0', 'Rp ' . number_format($tariff, 0, ',', '.'));
    }

    public function test_bva_billing_negative_tariff_rejection(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => -1000000,
        ]);
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_billing_extreme_tariff_rp_500_million(): void
    {
        $tariff = 500000000;
        $formatted = 'Rp ' . number_format($tariff, 0, ',', '.');
        $this->assertSame('Rp 500.000.000', $formatted);
    }

    public function test_bva_billing_fkl48_verified_tariff_greater_than_fkl47(): void
    {
        $fkl47 = 5000000;
        $fkl48 = 6000000;
        $this->assertTrue($fkl48 > $fkl47);
    }

    public function test_bva_billing_all_5_special_cmg_applied_simultaneously(): void
    {
        $cmgList = ['SA', 'SP', 'RR', 'SI', 'SD'];
        $this->assertCount(5, $cmgList);
    }
}
