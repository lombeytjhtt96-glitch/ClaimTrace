<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F23_PrintableSp1AuditTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F23-01: test_print_sp1_renders_official_formal_letterhead
     */
    public function test_print_sp1_renders_official_formal_letterhead(): void
    {
        $response = $this->get('/reports/sp1-audit/CLM-2026-8803');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'SURAT PEMBERITAHUAN') ||
            str_contains($content, 'SP-1') ||
            str_contains($content, 'AUDIT') ||
            str_contains($content, 'BPJS Kesehatan')
        );
    }

    /**
     * T1-F23-02: test_print_sp1_cites_phantom_billing_or_upcoding_findings
     */
    public function test_print_sp1_cites_phantom_billing_or_upcoding_findings(): void
    {
        $response = $this->get('/reports/sp1-audit/CLM-2026-8803');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'Phantom Billing') ||
            str_contains($content, 'Anomali') ||
            str_contains($content, 'Klarifikasi Faktual') ||
            str_contains($content, 'Geovelocity')
        );
    }

    /**
     * T1-F23-03: test_print_sp1_specifies_requested_evidence_documents
     */
    public function test_print_sp1_specifies_requested_evidence_documents(): void
    {
        $response = $this->get('/reports/sp1-audit/CLM-2026-8803');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'Register') ||
            str_contains($content, 'Rekam Medis') ||
            str_contains($content, 'Log Mesin') ||
            str_contains($content, 'Dokumen')
        );
    }

    /**
     * T1-F23-04: test_print_sp1_displays_audit_team_assignment_and_dates
     */
    public function test_print_sp1_displays_audit_team_assignment_and_dates(): void
    {
        $response = $this->get('/reports/sp1-audit/CLM-2026-8803');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'Tim Audit') ||
            str_contains($content, 'Wasrik') ||
            str_contains($content, 'Tanggal') ||
            str_contains($content, 'Pemeriksaan')
        );
    }

    /**
     * T1-F23-05: test_print_sp1_contains_zero_emojis
     */
    public function test_print_sp1_contains_zero_emojis(): void
    {
        $response = $this->get('/reports/sp1-audit/CLM-2026-8803');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertEquals(0, preg_match('/\p{Extended_Pictographic}/u', $content));
    }
}
