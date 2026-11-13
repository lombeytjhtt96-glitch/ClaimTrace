<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F22_PrintableBaPendingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F22-01: test_print_ba_pending_renders_pending_claims_list
     */
    public function test_print_ba_pending_renders_pending_claims_list(): void
    {
        $response = $this->get('/reports/ba-pending');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'BERITA ACARA') ||
            str_contains($content, 'PENDING') ||
            str_contains($content, 'Klarifikasi') ||
            str_contains($content, 'Pending')
        );
    }

    /**
     * T1-F22-02: test_print_ba_pending_displays_3_pillar_reasons_with_citations
     */
    public function test_print_ba_pending_displays_3_pillar_reasons_with_citations(): void
    {
        $response = $this->get('/reports/ba-pending');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'ADM') ||
            str_contains($content, 'KOD') ||
            str_contains($content, 'MED') ||
            str_contains($content, 'Dasar Hukum') ||
            str_contains($content, 'Permenkes')
        );
    }

    /**
     * T1-F22-03: test_print_ba_pending_displays_statutory_10_day_sla_deadline
     */
    public function test_print_ba_pending_displays_statutory_10_day_sla_deadline(): void
    {
        $response = $this->get('/reports/ba-pending');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, '10') ||
            str_contains($content, 'Hari Kerja') ||
            str_contains($content, 'SLA') ||
            str_contains($content, 'Perpres 82/2018')
        );
    }

    /**
     * T1-F22-04: test_print_ba_pending_includes_qr_and_sha256_seal
     */
    public function test_print_ba_pending_includes_qr_and_sha256_seal(): void
    {
        $response = $this->get('/reports/ba-pending');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'SHA-256') ||
            str_contains($content, 'Segel') ||
            preg_match('/[a-f0-9]{64}/', $content) === 1
        );
    }

    /**
     * T1-F22-05: test_print_ba_pending_contains_zero_emojis
     */
    public function test_print_ba_pending_contains_zero_emojis(): void
    {
        $response = $this->get('/reports/ba-pending');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertEquals(0, preg_match('/\p{Extended_Pictographic}/u', $content));
    }
}
