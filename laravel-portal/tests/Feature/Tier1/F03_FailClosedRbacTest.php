<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F03_FailClosedRbacTest extends TestCase
{
    /**
     * T1-F03-01: test_rbac_verifikator_authorized_to_post_claim_decision
     */
    public function test_rbac_verifikator_authorized_to_post_claim_decision(): void
    {
        $this->authenticateAsVerifier();

        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 5200000,
            'catatan' => 'Berkas lengkap dan terverifikasi sesuai kaidah.',
            'checklist' => [
                'sep_valid' => true,
                'rujukan_prb_valid' => true,
                'resume_tte_dpjp' => true,
                'koding_inacbg_sesuai' => true,
                'bukti_penunjang_lengkap' => true,
                'konfirmasi_peserta_sah' => true,
            ]
        ]);

        $this->assertTrue(in_array($response->status(), [200, 302]));
        $this->assertNotEquals(403, $response->status());
    }

    /**
     * T1-F03-02: test_rbac_auditor_forbidden_from_posting_claim_decision
     */
    public function test_rbac_auditor_forbidden_from_posting_claim_decision(): void
    {
        $this->authenticateAsAuditor();

        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 5200000,
            'catatan' => 'Percobaan adjudikasi oleh auditor.',
        ]);

        $response->assertStatus(403);
    }

    /**
     * T1-F03-03: test_rbac_analyst_forbidden_from_batch_plotting
     */
    public function test_rbac_analyst_forbidden_from_batch_plotting(): void
    {
        $this->authenticateAsAnalyst();

        $response = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801'],
            'verifier_nip' => '198704202011012001',
            'catatan' => 'Plotting oleh analis.',
        ]);

        $response->assertStatus(403);
    }

    /**
     * T1-F03-04: test_rbac_administrator_authorized_for_system_maintenance
     */
    public function test_rbac_administrator_authorized_for_system_maintenance(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->post('/admin/cache/clear');
        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    /**
     * T1-F03-05: test_rbac_auditor_authorized_to_read_audit_logs
     */
    public function test_rbac_auditor_authorized_to_read_audit_logs(): void
    {
        $this->authenticateAsAuditor();

        $response = $this->get('/audit/ledger');
        $response->assertStatus(200);
    }
}
