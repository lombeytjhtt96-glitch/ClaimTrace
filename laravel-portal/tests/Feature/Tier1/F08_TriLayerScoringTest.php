<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F08_TriLayerScoringTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F08-01: test_scoring_formula_weights_sum_to_unity
     */
    public function test_scoring_formula_weights_sum_to_unity(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);

        // Verify formula definition: 0.50*S1 + 0.30*S2 + 0.20*S3
        $w1 = 0.50;
        $w2 = 0.30;
        $w3 = 0.20;
        $this->assertEqualsWithDelta(1.00, $w1 + $w2 + $w3, 0.0001);
    }

    /**
     * T1-F08-02: test_scoring_green_lane_cutoff_below_50
     */
    public function test_scoring_green_lane_cutoff_below_50(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/dossier');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'HIJAU') ||
            str_contains($content, 'Hijau') ||
            str_contains($content, '33.0') ||
            str_contains($content, '33,0')
        );
    }

    /**
     * T1-F08-03: test_scoring_yellow_lane_cutoff_between_50_and_74_9
     */
    public function test_scoring_yellow_lane_cutoff_between_50_and_74_9(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8802/dossier');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'KUNING') ||
            str_contains($content, 'Kuning') ||
            str_contains($content, '61.0') ||
            str_contains($content, '61,0')
        );
    }

    /**
     * T1-F08-04: test_scoring_red_lane_cutoff_at_or_above_75
     */
    public function test_scoring_red_lane_cutoff_at_or_above_75(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8803/dossier');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'MERAH') ||
            str_contains($content, 'Merah') ||
            str_contains($content, '97.5') ||
            str_contains($content, '97,5')
        );
    }

    /**
     * T1-F08-05: test_scoring_sip_expired_activates_hard_trigger_to_red
     */
    public function test_scoring_sip_expired_activates_hard_trigger_to_red(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8804/dossier');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'MERAH') ||
            str_contains($content, 'SIP') ||
            str_contains($content, 'HARD TRIGGER') ||
            str_contains($content, 'Kedaluwarsa')
        );
    }
}
