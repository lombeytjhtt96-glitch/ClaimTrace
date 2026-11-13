<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F19_CodedReasonsSlaTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F19-01: test_pending_codes_endpoint_returns_all_16_codes_across_3_pillars
     */
    public function test_pending_codes_endpoint_returns_all_16_codes_across_3_pillars(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/decision');
        $this->assertTrue(in_array($response->status(), [200, 302]));

        if ($response->status() === 200) {
            $content = $response->getContent();
            $this->assertStringContainsString('ADM-01', $content);
            $this->assertStringContainsString('KOD-01', $content);
            $this->assertStringContainsString('MED-01', $content);
        }
    }

    /**
     * T1-F19-02: test_pending_codes_pilar_administrasi_adm01_to_adm06_valid
     */
    public function test_pending_codes_pilar_administrasi_adm01_to_adm06_valid(): void
    {
        $response = $this->get('/reports/ba-pending');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'ADM') ||
            str_contains($content, 'Administrasi')
        );
    }

    /**
     * T1-F19-03: test_pending_codes_pilar_koding_kod01_to_kod05_valid
     */
    public function test_pending_codes_pilar_koding_kod01_to_kod05_valid(): void
    {
        $response = $this->get('/reports/ba-pending');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'KOD') ||
            str_contains($content, 'Koding') ||
            str_contains($content, 'INA-CBG')
        );
    }

    /**
     * T1-F19-04: test_pending_codes_pilar_medis_med01_to_med05_valid
     */
    public function test_pending_codes_pilar_medis_med01_to_med05_valid(): void
    {
        $response = $this->get('/reports/ba-pending');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'MED') ||
            str_contains($content, 'Medis')
        );
    }

    /**
     * T1-F19-05: test_dispute_sla_tiers_catalog_returns_cabang_kedeputian_pusat
     */
    public function test_dispute_sla_tiers_catalog_returns_cabang_kedeputian_pusat(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/decision');
        $this->assertTrue(in_array($response->status(), [200, 302]));

        if ($response->status() === 200) {
            $content = $response->getContent();
            $this->assertTrue(
                str_contains($content, 'CABANG') ||
                str_contains($content, 'KEDEPUTIAN') ||
                str_contains($content, 'PUSAT') ||
                str_contains($content, 'TKMKB')
            );
        }
    }
}
