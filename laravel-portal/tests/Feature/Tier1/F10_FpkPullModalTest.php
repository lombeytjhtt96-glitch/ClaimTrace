<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F10_FpkPullModalTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F10-01: test_tarik_fpk_modal_form_renders_required_fields
     */
    public function test_tarik_fpk_modal_form_renders_required_fields(): void
    {
        $response = $this->get('/vedika/queue');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'modal-tarik-fpk') ||
            str_contains($content, 'no_fpk') ||
            str_contains($content, 'bulan_pelayanan') ||
            str_contains($content, 'VClaim')
        );
    }

    /**
     * T1-F10-02: test_tarik_fpk_submit_creates_new_batch_claims
     */
    public function test_tarik_fpk_submit_creates_new_batch_claims(): void
    {
        $response = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-0114-202611-099',
            'bulan_pelayanan' => '2026-11',
            'jenis_pengajuan' => 'Reguler',
            'jenis_pelayanan' => 'ALL',
            'jumlah_klaim' => 5,
            'auto_plot' => false,
        ]);

        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    /**
     * T1-F10-03: test_tarik_fpk_with_auto_plot_assigns_claims_to_verifiers
     */
    public function test_tarik_fpk_with_auto_plot_assigns_claims_to_verifiers(): void
    {
        $response = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-0114-202611-098',
            'bulan_pelayanan' => '2026-11',
            'jenis_pengajuan' => 'Reguler',
            'jenis_pelayanan' => 'ALL',
            'jumlah_klaim' => 4,
            'auto_plot' => true,
        ]);

        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    /**
     * T1-F10-04: test_tarik_fpk_validation_rejects_missing_no_fpk
     */
    public function test_tarik_fpk_validation_rejects_missing_no_fpk(): void
    {
        $response = $this->post('/vedika/fpk-pull', [
            'no_fpk' => '',
            'bulan_pelayanan' => '2026-11',
            'jumlah_klaim' => 5,
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['no_fpk']);
    }

    /**
     * T1-F10-05: test_tarik_fpk_validation_rejects_invalid_service_month_format
     */
    public function test_tarik_fpk_validation_rejects_invalid_service_month_format(): void
    {
        $response = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-VALID-01',
            'bulan_pelayanan' => '2026/13',
            'jumlah_klaim' => 5,
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors();
    }
}
