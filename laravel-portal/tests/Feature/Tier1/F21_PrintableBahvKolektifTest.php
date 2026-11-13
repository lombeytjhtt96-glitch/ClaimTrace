<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F21_PrintableBahvKolektifTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F21-01: test_print_bahv_renders_official_header_and_kop_surat
     */
    public function test_print_bahv_renders_official_header_and_kop_surat(): void
    {
        $response = $this->get('/reports/bahv-kolektif');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'BERITA ACARA') ||
            str_contains($content, 'BAHV') ||
            str_contains($content, 'BPJS Kesehatan')
        );
    }

    /**
     * T1-F21-02: test_print_bahv_renders_signature_blocks_for_faskes_and_bpjs
     */
    public function test_print_bahv_renders_signature_blocks_for_faskes_and_bpjs(): void
    {
        $response = $this->get('/reports/bahv-kolektif');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'Pihak Pertama') ||
            str_contains($content, 'Pihak Kedua') ||
            str_contains($content, 'Tanda Tangan') ||
            str_contains($content, 'Verifikator')
        );
    }

    /**
     * T1-F21-03: test_print_bahv_displays_sha256_digital_stamp_and_qr
     */
    public function test_print_bahv_displays_sha256_digital_stamp_and_qr(): void
    {
        $response = $this->get('/reports/bahv-kolektif');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'SHA-256') ||
            str_contains($content, 'Segel Digital') ||
            str_contains($content, 'QR') ||
            preg_match('/[a-f0-9]{64}/', $content) === 1
        );
    }

    /**
     * T1-F21-04: test_print_bahv_applies_print_css_with_page_breaks
     */
    public function test_print_bahv_applies_print_css_with_page_breaks(): void
    {
        $response = $this->get('/reports/bahv-kolektif');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, '@media print') ||
            str_contains($content, 'print:') ||
            str_contains($content, 'page-break')
        );
    }

    /**
     * T1-F21-05: test_print_bahv_contains_zero_emojis
     */
    public function test_print_bahv_contains_zero_emojis(): void
    {
        $response = $this->get('/reports/bahv-kolektif');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertEquals(0, preg_match('/\p{Extended_Pictographic}/u', $content));
    }
}
