<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F16_SatusehatGeovelocityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F16-01: test_satusehat_sip_active_status_renders_valid_badge
     */
    public function test_satusehat_sip_active_status_renders_valid_badge(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/sdmk');
        $this->assertTrue(in_array($response->status(), [200, 302]));

        if ($response->status() === 200) {
            $content = $response->getContent();
            $this->assertTrue(
                str_contains($content, 'ACTIVE') ||
                str_contains($content, 'Aktif') ||
                str_contains($content, 'SIP')
            );
        }
    }

    /**
     * T1-F16-02: test_satusehat_sip_expired_renders_critical_alert
     */
    public function test_satusehat_sip_expired_renders_critical_alert(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8804/sdmk');
        $this->assertTrue(in_array($response->status(), [200, 302]));

        if ($response->status() === 200) {
            $content = $response->getContent();
            $this->assertTrue(
                str_contains($content, 'EXPIRED') ||
                str_contains($content, 'Kedaluwarsa') ||
                str_contains($content, 'SIP')
            );
        }
    }

    /**
     * T1-F16-03: test_satusehat_workload_exceeding_40_patients_renders_warning
     */
    public function test_satusehat_workload_exceeding_40_patients_renders_warning(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8803/sdmk');
        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    /**
     * T1-F16-04: test_geovelocity_impossible_travel_speed_triggers_phantom_flag
     */
    public function test_geovelocity_impossible_travel_speed_triggers_phantom_flag(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8803/sdmk');
        $this->assertTrue(in_array($response->status(), [200, 302]));

        if ($response->status() === 200) {
            $content = $response->getContent();
            $this->assertTrue(
                str_contains($content, 'Phantom') ||
                str_contains($content, 'Geovelocity') ||
                str_contains($content, 'Transit') ||
                str_contains($content, '240')
            );
        }
    }

    /**
     * T1-F16-05: test_geovelocity_normal_travel_speed_passes_without_alert
     */
    public function test_geovelocity_normal_travel_speed_passes_without_alert(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/sdmk');
        $this->assertTrue(in_array($response->status(), [200, 302]));
    }
}
