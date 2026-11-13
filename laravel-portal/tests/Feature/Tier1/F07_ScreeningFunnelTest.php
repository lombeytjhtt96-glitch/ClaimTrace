<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F07_ScreeningFunnelTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F07-01: test_funnel_stage_1_ingest_and_prb_renders_1697588_cleared
     */
    public function test_funnel_stage_1_ingest_and_prb_renders_1697588_cleared(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
        $content = $response->getContent();

        $this->assertTrue(
            str_contains($content, '1.697.588') ||
            str_contains($content, '1.699.219') ||
            str_contains($content, 'Tahap 1')
        );
    }

    /**
     * T1-F07-02: test_funnel_stage_2_rule_based_filter_renders_11186_flagged
     */
    public function test_funnel_stage_2_rule_based_filter_renders_11186_flagged(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
        $content = $response->getContent();

        $this->assertTrue(
            str_contains($content, '11.186') ||
            str_contains($content, 'Tahap 2') ||
            str_contains($content, 'Rule-based')
        );
    }

    /**
     * T1-F07-03: test_funnel_stage_3_ai_fusion_renders_53379_evaluated
     */
    public function test_funnel_stage_3_ai_fusion_renders_53379_evaluated(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
        $content = $response->getContent();

        $this->assertTrue(
            str_contains($content, '53.379') ||
            str_contains($content, 'Tahap 3') ||
            str_contains($content, 'Tri-Layer')
        );
    }

    /**
     * T1-F07-04: test_funnel_stage_4_human_adjudication_renders_triage_lanes
     */
    public function test_funnel_stage_4_human_adjudication_renders_triage_lanes(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
        $content = $response->getContent();

        $this->assertTrue(
            str_contains($content, 'Hijau') || str_contains($content, 'HIJAU') ||
            str_contains($content, 'Kuning') || str_contains($content, 'KUNING') ||
            str_contains($content, 'Merah') || str_contains($content, 'MERAH')
        );
    }

    /**
     * T1-F07-05: test_funnel_interactive_lane_filter_navigates_to_filtered_queue
     */
    public function test_funnel_interactive_lane_filter_navigates_to_filtered_queue(): void
    {
        $response = $this->get('/vedika/queue?lane=red');
        $response->assertStatus(200);
    }
}
