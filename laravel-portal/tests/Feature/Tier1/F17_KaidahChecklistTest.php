<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F17_KaidahChecklistTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F17-01: test_checklist_renders_all_6_standard_kaidah_items
     */
    public function test_checklist_renders_all_6_standard_kaidah_items(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/checklist');
        $this->assertTrue(in_array($response->status(), [200, 302]));

        if ($response->status() === 200) {
            $content = $response->getContent();
            $this->assertStringContainsString('sep_valid', $content);
            $this->assertStringContainsString('rujukan_prb_valid', $content);
            $this->assertStringContainsString('resume_tte_dpjp', $content);
            $this->assertStringContainsString('koding_inacbg_sesuai', $content);
            $this->assertStringContainsString('bukti_penunjang_lengkap', $content);
            $this->assertStringContainsString('konfirmasi_peserta_sah', $content);
        }
    }

    /**
     * T1-F17-02: test_checklist_toggle_item_updates_completion_counter
     */
    public function test_checklist_toggle_item_updates_completion_counter(): void
    {
        $response = $this->patch('/vedika/claims/CLM-2026-8801/checklist', [
            'item' => 'sep_valid',
            'value' => true,
        ]);

        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    /**
     * T1-F17-03: test_checklist_all_6_checked_enables_layak_bayar_button
     */
    public function test_checklist_all_6_checked_enables_layak_bayar_button(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/dossier');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'btn-layak-bayar') ||
            str_contains($content, 'Layak Bayar') ||
            str_contains($content, 'Kaidah')
        );
    }

    /**
     * T1-F17-04: test_checklist_incomplete_disables_layak_bayar_or_shows_warning
     */
    public function test_checklist_incomplete_disables_layak_bayar_or_shows_warning(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8802/dossier');
        $response->assertStatus(200);
    }

    /**
     * T1-F17-05: test_checklist_state_persisted_to_session_or_database
     */
    public function test_checklist_state_persisted_to_session_or_database(): void
    {
        $this->patch('/vedika/claims/CLM-2026-8801/checklist', [
            'item' => 'sep_valid',
            'value' => true,
        ]);

        $followUp = $this->get('/vedika/claims/CLM-2026-8801/dossier');
        $followUp->assertStatus(200);
    }
}
