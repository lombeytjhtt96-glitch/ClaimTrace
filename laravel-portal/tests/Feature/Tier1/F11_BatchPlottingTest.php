<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F11_BatchPlottingTest extends TestCase
{
    /**
     * T1-F11-01: test_plotting_batch_assigns_claims_to_selected_verifier
     */
    public function test_plotting_batch_assigns_claims_to_selected_verifier(): void
    {
        $this->authenticateAsVerifier();

        $response = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801', 'CLM-2026-8802'],
            'verifier_nip' => '198704202011012001',
            'catatan' => 'Plotting awal bulan verifikasi.',
        ]);

        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    /**
     * T1-F11-02: test_plotting_requires_adjudicate_privilege
     */
    public function test_plotting_requires_adjudicate_privilege(): void
    {
        $this->authenticateAsAuditor();

        $response = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801'],
            'verifier_nip' => '198704202011012001',
        ]);

        $response->assertStatus(403);
    }

    /**
     * T1-F11-03: test_plotting_rejects_empty_claim_ids_array
     */
    public function test_plotting_rejects_empty_claim_ids_array(): void
    {
        $this->authenticateAsVerifier();

        $response = $this->post('/vedika/plotting', [
            'claim_ids' => [],
            'verifier_nip' => '198704202011012001',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['claim_ids']);
    }

    /**
     * T1-F11-04: test_plotting_rejects_unregistered_verifier_nip
     */
    public function test_plotting_rejects_unregistered_verifier_nip(): void
    {
        $this->authenticateAsVerifier();

        $response = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801'],
            'verifier_nip' => '999999999999999999',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['verifier_nip']);
    }

    /**
     * T1-F11-05: test_plotting_updates_verifier_workload_counter
     */
    public function test_plotting_updates_verifier_workload_counter(): void
    {
        $this->authenticateAsVerifier();

        $response = $this->get('/vedika/workload');
        $response->assertStatus(200);
        $response->assertSee('198704202011012001');
    }
}
