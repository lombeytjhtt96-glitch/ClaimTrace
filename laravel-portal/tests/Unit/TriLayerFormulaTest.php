<?php

namespace Tests\Unit;

use App\Services\HybridApiService;
use PHPUnit\Framework\TestCase;

class TriLayerFormulaTest extends TestCase
{
    /**
     * Memvalidasi bobot formula tri-layer berjumlah tepat 1.0 (0.50 + 0.30 + 0.20 = 1.00).
     */
    public function test_formula_weights_sum_to_unity(): void
    {
        $res = HybridApiService::calculateTriLayerScore(0.0, 0.0, 0.0);
        $w1 = $res['breakdown']['s1']['weight'];
        $w2 = $res['breakdown']['s2']['weight'];
        $w3 = $res['breakdown']['s3']['weight'];

        $totalWeight = $w1 + $w2 + $w3;
        $this->assertEqualsWithDelta(1.00, $totalWeight, 0.0001);
    }

    /**
     * Memvalidasi perhitungan skor weighted score S = 0.50*S1 + 0.30*S2 + 0.20*S3.
     */
    public function test_score_calculation_accuracy(): void
    {
        $s1 = 40.0;
        $s2 = 30.0;
        $s3 = 20.0;

        // 0.50*40 + 0.30*30 + 0.20*20 = 20 + 9 + 4 = 33.0
        $res = HybridApiService::calculateTriLayerScore($s1, $s2, $s3);
        $this->assertEqualsWithDelta(33.0, $res['base_score'], 0.01);
        $this->assertEqualsWithDelta(33.0, $res['final_score'], 0.01);
    }

    /**
     * Memvalidasi klasifikasi Jalur Hijau untuk skor di bawah 50.0.
     */
    public function test_green_lane_cutoff_below_50(): void
    {
        $res = HybridApiService::calculateTriLayerScore(40.0, 30.0, 20.0); // 33.0

        $this->assertSame('HIJAU', $res['lane']);
        $this->assertFalse($res['hard_trigger_active']);
        $this->assertFalse($res['unsynced_escalated']);
    }

    /**
     * Memvalidasi batas transisi Jalur Hijau ke Jalur Kuning pada tepat 49.9 vs 50.0.
     */
    public function test_lane_transition_boundary_49_9_vs_50_0(): void
    {
        // 0.50 * 99.8 = 49.9 -> HIJAU
        $res49 = HybridApiService::calculateTriLayerScore(99.8, 0.0, 0.0);
        $this->assertEqualsWithDelta(49.9, $res49['final_score'], 0.01);
        $this->assertSame('HIJAU', $res49['lane']);

        // 0.50 * 100.0 = 50.0 -> KUNING
        $res50 = HybridApiService::calculateTriLayerScore(100.0, 0.0, 0.0);
        $this->assertEqualsWithDelta(50.0, $res50['final_score'], 0.01);
        $this->assertSame('KUNING', $res50['lane']);
    }

    /**
     * Memvalidasi batas transisi Jalur Kuning ke Jalur Merah pada tepat 74.9 vs 75.0.
     */
    public function test_lane_transition_boundary_74_9_vs_75_0(): void
    {
        // 0.50 * 100.0 + 0.30 * 83.0 = 50.0 + 24.9 = 74.9 -> KUNING
        $res74 = HybridApiService::calculateTriLayerScore(100.0, 83.0, 0.0);
        $this->assertEqualsWithDelta(74.9, $res74['final_score'], 0.01);
        $this->assertSame('KUNING', $res74['lane']);

        // 0.50 * 100.0 + 0.30 * 50.0 + 0.20 * 50.0 = 50.0 + 15.0 + 10.0 = 75.0 -> MERAH
        $res75 = HybridApiService::calculateTriLayerScore(100.0, 50.0, 50.0);
        $this->assertEqualsWithDelta(75.0, $res75['final_score'], 0.01);
        $this->assertSame('MERAH', $res75['lane']);
    }

    /**
     * Memvalidasi Hard Trigger override: SIP DPJP Kedaluwarsa memaksa jalur ke MERAH.
     */
    public function test_hard_trigger_sip_expired_forces_red_lane(): void
    {
        $res = HybridApiService::calculateTriLayerScore(10.0, 10.0, 10.0, [
            'sip_expired' => true,
            'impossible_travel' => false,
        ]);

        $this->assertSame('MERAH', $res['lane']);
        $this->assertGreaterThanOrEqual(75.0, $res['final_score']);
        $this->assertTrue($res['hard_trigger_active']);
        $this->assertEqualsWithDelta(10.0, $res['base_score'], 0.01);
    }

    /**
     * Memvalidasi Hard Trigger override: Impossible Travel (> 120 km/jam) memaksa jalur ke MERAH.
     */
    public function test_hard_trigger_impossible_travel_forces_red_lane(): void
    {
        $res = HybridApiService::calculateTriLayerScore(20.0, 20.0, 20.0, [
            'sip_expired' => false,
            'impossible_travel' => true,
        ]);

        $this->assertSame('MERAH', $res['lane']);
        $this->assertGreaterThanOrEqual(75.0, $res['final_score']);
        $this->assertTrue($res['hard_trigger_active']);
        $this->assertEqualsWithDelta(20.0, $res['base_score'], 0.01);
    }

    /**
     * Memvalidasi Hard Trigger override Impossible Travel dengan subskor nol tetap menghasilkan Jalur Merah.
     */
    public function test_hard_trigger_impossible_travel_forces_red_lane_with_zero_subscores(): void
    {
        $res = HybridApiService::calculateTriLayerScore(0.0, 0.0, 0.0, [
            'impossible_travel' => true,
        ]);

        $this->assertEqualsWithDelta(0.0, $res['base_score'], 0.01);
        $this->assertEqualsWithDelta(75.0, $res['final_score'], 0.01);
        $this->assertSame('MERAH', $res['lane']);
        $this->assertTrue($res['hard_trigger_active']);
        $this->assertFalse($res['unsynced_escalated']);
    }

    /**
     * Memvalidasi prinsip Anti-Bias: Data un-synced menaikkan berkas hijau ke kuning untuk klarifikasi administratif.
     */
    public function test_anti_bias_unsynced_data_escalates_from_green_to_yellow(): void
    {
        // Sub-skor rendah yang normalnya masuk HIJAU (skor 10.0 < 50.0)
        $res = HybridApiService::calculateTriLayerScore(10.0, 10.0, 10.0, [
            'sip_unsynced' => true,
        ]);

        $this->assertEqualsWithDelta(10.0, $res['base_score'], 0.01);
        $this->assertEqualsWithDelta(10.0, $res['final_score'], 0.01);
        $this->assertSame('KUNING', $res['lane']);
        $this->assertTrue($res['unsynced_escalated']);
        $this->assertFalse($res['hard_trigger_active']);

        // Menguji alias flag sip_status => 'UNSYNCED'
        $resAlt = HybridApiService::calculateTriLayerScore(15.0, 10.0, 5.0, [
            'sip_status' => 'UNSYNCED',
        ]);
        $this->assertSame('KUNING', $resAlt['lane']);
        $this->assertTrue($resAlt['unsynced_escalated']);

        // Menguji alias flag unsynced => true
        $resAlt2 = HybridApiService::calculateTriLayerScore(15.0, 10.0, 5.0, [
            'unsynced' => true,
        ]);
        $this->assertSame('KUNING', $resAlt2['lane']);
        $this->assertTrue($resAlt2['unsynced_escalated']);
    }

    /**
     * Memvalidasi prinsip Anti-Bias: Data un-synced tidak boleh secara keliru menaikkan berkas ke Jalur Merah.
     */
    public function test_anti_bias_unsynced_data_does_not_falsely_escalate_to_red(): void
    {
        // Un-synced data adalah ketidakpastian administratif, BUKAN fraud klinis!
        $resLow = HybridApiService::calculateTriLayerScore(20.0, 20.0, 20.0, [
            'sip_unsynced' => true,
        ]);
        $this->assertNotSame('MERAH', $resLow['lane']);
        $this->assertSame('KUNING', $resLow['lane']);
        $this->assertEqualsWithDelta(20.0, $resLow['final_score'], 0.01);

        // Skor menengah (60.0) tetap di KUNING, tidak tereskalasi ke MERAH
        $resMid = HybridApiService::calculateTriLayerScore(60.0, 60.0, 60.0, [
            'sip_unsynced' => true,
        ]);
        $this->assertSame('KUNING', $resMid['lane']);
        $this->assertFalse($resMid['unsynced_escalated']);

        // Skor tinggi (85.0) tetap MERAH karena skor dasar >= 75.0
        $resHigh = HybridApiService::calculateTriLayerScore(85.0, 85.0, 85.0, [
            'sip_unsynced' => true,
        ]);
        $this->assertSame('MERAH', $resHigh['lane']);
        $this->assertFalse($resHigh['unsynced_escalated']);
    }

    /**
     * Memvalidasi penjepitan (clamping) nilai masukan di luar rentang [0.0, 100.0] dan nilai non-finite.
     */
    public function test_clamping_out_of_bounds_inputs(): void
    {
        $resNegative = HybridApiService::calculateTriLayerScore(-15.0, 50.0, 50.0);
        // Clamped: 0.5*0 + 0.3*50 + 0.2*50 = 0 + 15 + 10 = 25.0
        $this->assertEqualsWithDelta(25.0, $resNegative['base_score'], 0.01);
        $this->assertEqualsWithDelta(0.0, $resNegative['breakdown']['s1']['value'], 0.01);

        $resOver = HybridApiService::calculateTriLayerScore(150.0, 100.0, 100.0);
        // Clamped: 0.5*100 + 0.3*100 + 0.2*100 = 100.0
        $this->assertEqualsWithDelta(100.0, $resOver['base_score'], 0.01);
        $this->assertEqualsWithDelta(100.0, $resOver['breakdown']['s1']['value'], 0.01);

        // Clamping non-finite numbers (NAN, INF, -INF) defaults to 0.0 safely
        $resNonFinite = HybridApiService::calculateTriLayerScore(NAN, INF, -INF);
        $this->assertEqualsWithDelta(0.0, $resNonFinite['base_score'], 0.01);
        $this->assertEqualsWithDelta(0.0, $resNonFinite['breakdown']['s1']['value'], 0.01);
        $this->assertEqualsWithDelta(0.0, $resNonFinite['breakdown']['s2']['value'], 0.01);
        $this->assertEqualsWithDelta(0.0, $resNonFinite['breakdown']['s3']['value'], 0.01);
    }
}
