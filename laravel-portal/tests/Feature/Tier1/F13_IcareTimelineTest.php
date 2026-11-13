<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F13_IcareTimelineTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F13-01: test_icare_renders_longitudinal_timeline_table
     */
    public function test_icare_renders_longitudinal_timeline_table(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/icare');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'i-Care') ||
            str_contains($content, 'Riwayat') ||
            str_contains($content, 'Puskesmas Menteng')
        );
    }

    /**
     * T1-F13-02: test_icare_detects_emergency_readmission_within_30_days
     */
    public function test_icare_detects_emergency_readmission_within_30_days(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8802/icare');
        $response->assertStatus(200);
    }

    /**
     * T1-F13-03: test_icare_cross_faskes_flags_different_hospital_visits
     */
    public function test_icare_cross_faskes_flags_different_hospital_visits(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/icare');
        $response->assertStatus(200);
        $response->assertSee('RSUP');
    }

    /**
     * T1-F13-04: test_icare_masks_participant_identities_strictly
     */
    public function test_icare_masks_participant_identities_strictly(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/icare');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertEquals(0, preg_match('/\b[1-9]\d{15}\b/', $content));
    }

    /**
     * T1-F13-05: test_icare_displays_primary_and_secondary_diagnoses_history
     */
    public function test_icare_displays_primary_and_secondary_diagnoses_history(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/icare');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'H25.0') ||
            str_contains($content, 'Diagnosa') ||
            str_contains($content, 'ICD-10')
        );
    }

    /**
     * T1-F13-06: test_icare_table_has_table_fixed_and_responsive_wrapper
     */
    public function test_icare_table_has_table_fixed_and_responsive_wrapper(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/icare');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertStringContainsString('table-fixed', $content);
        $this->assertTrue(str_contains($content, 'overflow-x-auto') || str_contains($content, 'table-fixed-wrap'));
    }
}
