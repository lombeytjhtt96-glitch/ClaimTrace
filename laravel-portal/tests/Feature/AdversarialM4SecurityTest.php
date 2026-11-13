<?php

namespace Tests\Feature;

use App\Http\Controllers\AuthController;
use Tests\TestCase;

class AdversarialM4SecurityTest extends TestCase
{
    // =========================================================================
    // 2.a: Unauthorized State Mutations (Guest & VIEW/READ-only User)
    // =========================================================================

    /**
     * Test POST /vedika/fpk-pull as guest (unauthenticated).
     */
    public function test_fpk_pull_guest_is_rejected_or_redirected(): void
    {
        $response = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-HACK-001',
            'bulan_pelayanan' => '2026-11',
            'jumlah_klaim' => 10,
        ]);

        $this->assertTrue(
            in_array($response->status(), [302, 403], true),
            "Guest POST /vedika/fpk-pull expected 302 or 403, got: {$response->status()}"
        );
    }

    /**
     * Test POST /vedika/fpk-pull as JSON guest request (expects 403 fail-closed).
     */
    public function test_fpk_pull_guest_json_returns_403_fail_closed(): void
    {
        $response = $this->postJson('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-HACK-001',
            'bulan_pelayanan' => '2026-11',
            'jumlah_klaim' => 10,
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test POST /vedika/fpk-pull as VIEW/READ-only user (dr. Andi Pratama, NIP: 199003152018011005).
     */
    public function test_fpk_pull_readonly_user_returns_403_forbidden(): void
    {
        $this->authenticateAsAuditor();

        $response = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-HACK-001',
            'bulan_pelayanan' => '2026-11',
            'jumlah_klaim' => 10,
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test POST /vedika/plotting as guest.
     */
    public function test_plotting_guest_is_rejected_or_redirected(): void
    {
        $response = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801'],
            'verifier_nip' => '198704202011012001',
        ]);

        $this->assertTrue(
            in_array($response->status(), [302, 403], true),
            "Guest POST /vedika/plotting expected 302 or 403, got: {$response->status()}"
        );
    }

    /**
     * Test POST /vedika/plotting as VIEW/READ-only user (dr. Andi Pratama).
     */
    public function test_plotting_readonly_user_returns_403_forbidden(): void
    {
        $this->authenticateAsAuditor();

        $response = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801'],
            'verifier_nip' => '198704202011012001',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test PATCH /vedika/claims/CLM-2026-8801/checklist as guest.
     */
    public function test_checklist_patch_guest_is_rejected_or_redirected(): void
    {
        $response = $this->patch('/vedika/claims/CLM-2026-8801/checklist', [
            'item' => 'sep_valid',
            'value' => false,
        ]);

        $this->assertTrue(
            in_array($response->status(), [302, 403], true),
            "Guest PATCH /checklist expected 302 or 403, got: {$response->status()}"
        );
    }

    /**
     * Test PATCH /vedika/claims/CLM-2026-8801/checklist as VIEW/READ-only user.
     */
    public function test_checklist_patch_readonly_user_returns_403_forbidden(): void
    {
        $this->authenticateAsAuditor();

        $response = $this->patch('/vedika/claims/CLM-2026-8801/checklist', [
            'item' => 'sep_valid',
            'value' => false,
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test POST /vedika/claims/CLM-2026-8801/resubmit-susulan as guest.
     */
    public function test_resubmit_susulan_guest_is_rejected_or_redirected(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8801/resubmit-susulan', [
            'catatan_faskes' => 'Catatan revisi ilegal',
        ]);

        $this->assertTrue(
            in_array($response->status(), [302, 403], true),
            "Guest POST /resubmit-susulan expected 302 or 403, got: {$response->status()}"
        );
    }

    /**
     * Test POST /vedika/claims/CLM-2026-8801/resubmit-susulan as VIEW/READ-only user.
     */
    public function test_resubmit_susulan_readonly_user_returns_403_forbidden(): void
    {
        $this->authenticateAsAuditor();

        $response = $this->post('/vedika/claims/CLM-2026-8801/resubmit-susulan', [
            'catatan_faskes' => 'Catatan revisi ilegal',
        ]);

        $response->assertStatus(403);
    }

    // =========================================================================
    // 2.b: Boundary Stress Testing
    // =========================================================================

    /**
     * Test malformed bulan_pelayanan payloads on /vedika/fpk-pull.
     */
    public function test_fpk_pull_malformed_bulan_pelayanan(): void
    {
        $this->authenticateAsVerifier();

        // 1. Month 13 (invalid)
        $resp1 = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-TEST-001',
            'bulan_pelayanan' => '2026-13',
            'jumlah_klaim' => 5,
        ]);
        $resp1->assertSessionHasErrors(['bulan_pelayanan']);

        // 2. Arbitrary text 'invalid'
        $resp2 = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-TEST-001',
            'bulan_pelayanan' => 'invalid',
            'jumlah_klaim' => 5,
        ]);
        $resp2->assertSessionHasErrors(['bulan_pelayanan']);

        // 3. Empty string
        $resp3 = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-TEST-001',
            'bulan_pelayanan' => '',
            'jumlah_klaim' => 5,
        ]);
        $resp3->assertSessionHasErrors(['bulan_pelayanan']);

        // 4. Incomplete format (e.g. 2026-1)
        $resp4 = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-TEST-001',
            'bulan_pelayanan' => '2026-1',
            'jumlah_klaim' => 5,
        ]);
        $resp4->assertSessionHasErrors(['bulan_pelayanan']);
    }

    /**
     * Test empty claim_ids or non-array inputs on batch plotting.
     */
    public function test_batch_plotting_empty_or_non_array_claim_ids(): void
    {
        $this->authenticateAsVerifier();

        // 1. Empty array
        $resp1 = $this->post('/vedika/plotting', [
            'claim_ids' => [],
            'verifier_nip' => '198704202011012001',
        ]);
        $resp1->assertSessionHasErrors(['claim_ids']);

        // 2. Non-array string
        $resp2 = $this->post('/vedika/plotting', [
            'claim_ids' => 'CLM-2026-8801',
            'verifier_nip' => '198704202011012001',
        ]);
        $resp2->assertSessionHasErrors(['claim_ids']);

        // 3. Null / omitted
        $resp3 = $this->post('/vedika/plotting', [
            'verifier_nip' => '198704202011012001',
        ]);
        $resp3->assertSessionHasErrors(['claim_ids']);
    }

    /**
     * Test unregistered verifier NIPs on batch plotting.
     */
    public function test_batch_plotting_unregistered_verifier_nip(): void
    {
        $this->authenticateAsVerifier();

        // 1. 18-digit fictional NIP
        $resp1 = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801'],
            'verifier_nip' => '999999999999999999',
        ]);
        $resp1->assertSessionHasErrors(['verifier_nip']);

        // 2. Short NIP
        $resp2 = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801'],
            'verifier_nip' => '12345',
        ]);
        $resp2->assertSessionHasErrors(['verifier_nip']);

        // 3. SQL injection payload in NIP
        $resp3 = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801'],
            'verifier_nip' => "' OR '1'='1",
        ]);
        $resp3->assertSessionHasErrors(['verifier_nip']);
    }

    /**
     * Test negative or boundary values in mutation endpoints.
     */
    public function test_boundary_values_in_mutation_endpoints(): void
    {
        $this->authenticateAsVerifier();

        // 1. Negative jumlah_klaim on fpk-pull
        $resp1 = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-TEST-001',
            'bulan_pelayanan' => '2026-11',
            'jumlah_klaim' => -5,
        ]);
        $resp1->assertSessionHasErrors(['jumlah_klaim']);

        // 2. Zero jumlah_klaim on fpk-pull
        $resp2 = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-TEST-001',
            'bulan_pelayanan' => '2026-11',
            'jumlah_klaim' => 0,
        ]);
        $resp2->assertSessionHasErrors(['jumlah_klaim']);

        // 3. Exorbitant jumlah_klaim (> 500)
        $resp3 = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-TEST-001',
            'bulan_pelayanan' => '2026-11',
            'jumlah_klaim' => 999999,
        ]);
        $resp3->assertSessionHasErrors(['jumlah_klaim']);

        // 4. Negative tarif_revisi_rp on resubmit-susulan (for non-finalized claim)
        $resp4 = $this->post('/vedika/claims/CLM-2026-8802/resubmit-susulan', [
            'catatan_faskes' => 'Revisi nilai negatif',
            'tarif_revisi_rp' => -1000000,
        ]);
        $resp4->assertSessionHasErrors(['tarif_revisi_rp']);
    }

    // =========================================================================
    // 2.c: Finalized Claim Resubmission Lockout
    // =========================================================================

    /**
     * Test that finalized claims (status LAYAK_BAYAR or CLM-2026-8801) cannot be resubmitted.
     */
    public function test_finalized_claim_resubmission_is_locked_out_with_error(): void
    {
        $this->authenticateAsVerifier();

        // 1. Via regular web request (redirect back with session errors)
        $response = $this->post('/vedika/claims/CLM-2026-8801/resubmit-susulan', [
            'catatan_faskes' => 'Percobaan resubmit pada klaim yang telah Layak Bayar',
            'tarif_revisi_rp' => 5000000,
        ]);

        $response->assertSessionHasErrors(['catatan_faskes']);

        // 2. Via JSON request (HTTP 422 error response)
        $jsonResponse = $this->postJson('/vedika/claims/CLM-2026-8801/resubmit-susulan', [
            'catatan_faskes' => 'Percobaan JSON resubmit pada klaim Layak Bayar',
            'tarif_revisi_rp' => 5000000,
        ]);

        $jsonResponse->assertStatus(422);
        $jsonResponse->assertJson([
            'status' => 'error',
            'message' => 'Klaim yang telah berstatus Layak Bayar tidak dapat diajukan ulang.',
        ]);
    }
}
