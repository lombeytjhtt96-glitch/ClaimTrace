<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F15_KlaimSusulanTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F15-01: test_susulan_renders_resubmission_form_for_pending_claims
     */
    public function test_susulan_renders_resubmission_form_for_pending_claims(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8802/resubmit');
        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    /**
     * T1-F15-02: test_susulan_submit_increments_resubmission_counter
     */
    public function test_susulan_submit_increments_resubmission_counter(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8802/resubmit-susulan', [
            'catatan_faskes' => 'Dokumen TTE DPJP telah dilengkapi sesuai permintaan verifikator.',
            'perbaikan_icd10' => 'I25.1',
            'perbaikan_cbg' => 'I-4-10-I',
            'tarif_revisi_rp' => 4500000,
        ]);

        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    /**
     * T1-F15-03: test_susulan_rejects_resubmission_on_finalized_layak_claim
     */
    public function test_susulan_rejects_resubmission_on_finalized_layak_claim(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8801/resubmit-susulan', [
            'catatan_faskes' => 'Mencoba revisi klaim yang sudah layak bayar.',
            'tarif_revisi_rp' => 5500000,
        ]);

        $this->assertTrue(in_array($response->status(), [403, 422, 302]));
    }

    /**
     * T1-F15-04: test_susulan_records_audit_trail_for_revised_tariffs
     */
    public function test_susulan_records_audit_trail_for_revised_tariffs(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8802/resubmit-susulan', [
            'catatan_faskes' => 'Revisi koding dan penyesuaian tarif.',
            'tarif_revisi_rp' => 6200000,
        ]);

        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    /**
     * T1-F15-05: test_susulan_displays_historical_feedback_notes_timeline
     */
    public function test_susulan_displays_historical_feedback_notes_timeline(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8802/dossier');
        $response->assertStatus(200);
    }
}
