<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F04_ZeroPhiMaskingTest extends TestCase
{
    /**
     * T1-F04-01: test_phi_nik_masked_in_antrean_table
     */
    public function test_phi_nik_masked_in_antrean_table(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/vedika/queue');
        $response->assertStatus(200);

        $content = $response->getContent();
        // Assert masked format exists e.g. 3171********0001
        $this->assertMatchesRegularExpression('/\b\d{4}\*{4,8}\d{2,4}\b/', $content);
        // Assert unmasked raw NIK pattern (16 consecutive digits) does not appear
        $this->assertEquals(0, preg_match('/\b[1-9]\d{15}\b/', $content));
    }

    /**
     * T1-F04-02: test_phi_no_kartu_bpjs_masked_in_dossier
     */
    public function test_phi_no_kartu_bpjs_masked_in_dossier(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/vedika/claims/CLM-2026-8801/dossier');
        $response->assertStatus(200);

        $content = $response->getContent();
        // Zero occurrences of raw 13-digit BPJS card
        $this->assertEquals(0, preg_match('/\b000\d{10}\b/', $content));
        $this->assertStringContainsString('0001', $content);
    }

    /**
     * T1-F04-03: test_phi_patient_name_pseudonymized_in_icare
     */
    public function test_phi_patient_name_pseudonymized_in_icare(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/vedika/claims/CLM-2026-8801/icare');
        $response->assertStatus(200);

        $content = $response->getContent();
        // Pseudonymized with asterisks or Ny. / Tn. alias
        $this->assertMatchesRegularExpression('/(Ny\.|Tn\.|S\*\*\*|Pseudo)/i', $content);
    }

    /**
     * T1-F04-04: test_phi_printable_bahv_masks_sensitive_data
     */
    public function test_phi_printable_bahv_masks_sensitive_data(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/reports/bahv-kolektif');
        $response->assertStatus(200);

        $content = $response->getContent();
        // No unmasked 16-digit NIK
        $this->assertEquals(0, preg_match('/\b[1-9]\d{15}\b/', $content));
    }

    /**
     * T1-F04-05: test_phi_zero_phi_utility_redacts_free_text_notes
     */
    public function test_phi_zero_phi_utility_redacts_free_text_notes(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'PENDING_KLARIFIKASI',
            'pending_reasons' => ['ADM-01'],
            'catatan' => 'Pasien dengan NIK 3171012345670001 memerlukan peninjauan ulang berkas fisik.',
        ]);

        $this->assertTrue(in_array($response->status(), [200, 302]));
        // When stored or echoed, raw NIK must not be visible unmasked
        $followUp = $this->get('/vedika/claims/CLM-2026-8801/dossier');
        $followUp->assertDontSee('3171012345670001');
    }
}
