<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F06_CockpitKpiMetricsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F06-01: test_cockpit_total_claims_card_displays_1699219_with_indonesian_dots
     */
    public function test_cockpit_total_claims_card_displays_1699219_with_indonesian_dots(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
        $response->assertSee('1.699.219');
    }

    /**
     * T1-F06-02: test_cockpit_portfolio_value_displays_rp_1536_t
     */
    public function test_cockpit_portfolio_value_displays_rp_1536_t(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, '1,536 T') ||
            str_contains($content, '1.536 T') ||
            str_contains($content, '1.535.982.713.360') ||
            str_contains($content, '1,535 T')
        );
    }

    /**
     * T1-F06-03: test_cockpit_anomaly_exposure_displays_rp_3466_m
     */
    public function test_cockpit_anomaly_exposure_displays_rp_3466_m(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, '34,66 M') ||
            str_contains($content, '34.66 M') ||
            str_contains($content, '34.663.799.076')
        );
    }

    /**
     * T1-F06-04: test_cockpit_participants_card_displays_2590751
     */
    public function test_cockpit_participants_card_displays_2590751(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
        $response->assertSee('2.590.751');
    }

    /**
     * T1-F06-05: test_cockpit_active_fkrtl_card_displays_2091_across_496_regions
     */
    public function test_cockpit_active_fkrtl_card_displays_2091_across_496_regions(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
        $response->assertSee('2.091');
        $response->assertSee('496');
    }
}
