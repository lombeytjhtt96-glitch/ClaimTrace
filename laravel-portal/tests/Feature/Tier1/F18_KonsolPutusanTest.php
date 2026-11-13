<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F18_KonsolPutusanTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F18-01: test_decision_layak_bayar_records_verified_fkl48_tariff
     */
    public function test_decision_layak_bayar_records_verified_fkl48_tariff(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 5200000,
            'catatan' => 'Klaim terverifikasi sesuai 6 kaidah VEDIKA.',
        ]);

        $this->assertTrue(in_array($response->status(), [200, 302]));
        $this->assertEquals(5200000, session('decisions.CLM-2026-8801.tarif_verifikasi_rp'));
        $this->assertEquals('LAYAK_BAYAR', session('decisions.CLM-2026-8801.decision'));
    }

    /**
     * T1-F18-02: test_decision_pending_klarifikasi_requires_3_pillar_reasons
     */
    public function test_decision_pending_klarifikasi_requires_3_pillar_reasons(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'PENDING_KLARIFIKASI',
            'pending_reasons' => ['ADM-01', 'MED-05'],
            'catatan' => 'Menunggu kelengkapan hasil PA dan otorisasi DPJP.',
        ]);

        $this->assertTrue(in_array($response->status(), [200, 302]));
        $this->assertEquals('PENDING_KLARIFIKASI', session('decisions.CLM-2026-8801.decision'));
        $this->assertEquals(['ADM-01', 'MED-05'], session('decisions.CLM-2026-8801.pending_reasons'));
    }

    /**
     * T1-F18-03: test_decision_dispute_tkmkb_records_dispute_tier
     */
    public function test_decision_dispute_tkmkb_records_dispute_tier(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'DISPUTE_TKMKB',
            'dispute_level' => 'CABANG',
            'pending_reasons' => ['KOD-01'],
            'catatan' => 'Ketidaksepakatan koding severity level diajukan ke TKMKB Cabang.',
        ]);

        $this->assertTrue(in_array($response->status(), [200, 302]));
        $this->assertEquals('DISPUTE_TKMKB', session('decisions.CLM-2026-8801.decision'));
        $this->assertEquals('CABANG', session('decisions.CLM-2026-8801.dispute_level'));
    }

    /**
     * T1-F18-04: test_decision_tidak_layak_fraud_sets_fkl48_to_zero
     */
    public function test_decision_tidak_layak_fraud_sets_fkl48_to_zero(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'TIDAK_LAYAK_FRAUD',
            'pending_reasons' => ['MED-01'],
            'catatan' => 'Klaim fiktif tidak hadir terkonfirmasi.',
            'tarif_verifikasi_rp' => 0,
        ]);

        $this->assertTrue(in_array($response->status(), [200, 302]));
        $this->assertEquals(0, session('decisions.CLM-2026-8801.tarif_verifikasi_rp'));
        $this->assertEquals('TIDAK_LAYAK_FRAUD', session('decisions.CLM-2026-8801.decision'));
    }

    /**
     * T1-F18-05: test_decision_requires_mandatory_verifier_notes
     */
    public function test_decision_requires_mandatory_verifier_notes(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'PENDING_KLARIFIKASI',
            'pending_reasons' => ['ADM-01'],
            'catatan' => '',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['catatan']);
    }

    /**
     * T1-F18-06: test_post_vedika_decision_alias_route_accepts_adjudication
     */
    public function test_post_vedika_decision_alias_route_accepts_adjudication(): void
    {
        $response = $this->post('/vedika/decision/CLM-2026-8801', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 4500000,
            'catatan' => 'Klaim disetujui melalui rute /vedika/decision/{id}.',
        ]);

        $this->assertTrue(in_array($response->status(), [200, 302]));
        $this->assertEquals('LAYAK_BAYAR', session('decisions.CLM-2026-8801.decision'));
        $this->assertEquals(4500000, session('decisions.CLM-2026-8801.tarif_verifikasi_rp'));
    }

    /**
     * T1-F18-07: test_post_vedika_decision_enforces_fail_closed_rbac_for_unauthorized
     */
    public function test_post_vedika_decision_enforces_fail_closed_rbac_for_unauthorized(): void
    {
        // 1. Auditor read-only (without ADJUDICATE role) must be forbidden (HTTP 403)
        $this->authenticateAsAuditor();
        $responseAuditor = $this->post('/vedika/decision/CLM-2026-8801', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 5000000,
            'catatan' => 'Percobaan adjudikasi ilegal oleh auditor.',
        ]);
        $responseAuditor->assertStatus(403);

        // 2. Unauthenticated user (no session) must fail closed (HTTP 403)
        session()->flush();
        $responseUnauth = $this->post('/vedika/decision/CLM-2026-8801', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 5000000,
            'catatan' => 'Percobaan adjudikasi tanpa sesi login.',
        ]);
        $responseUnauth->assertStatus(403);
    }
}
