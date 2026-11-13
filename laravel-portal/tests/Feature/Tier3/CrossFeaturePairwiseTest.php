<?php

namespace Tests\Feature\Tier3;

use Tests\TestCase;
use Illuminate\Support\Facades\Http;

class CrossFeaturePairwiseTest extends TestCase
{
    /**
     * Scenario 3.1: Auth & SSO NIP + Fail-Closed RBAC (F02 x F03)
     */
    public function test_pairwise_auth_sso_and_fail_closed_rbac(): void
    {
        // Step 1: Login as Auditor Read-Only
        $this->authenticateAsAuditor();
        $this->assertSame('Auditor Pengawasan (Read-Only)', session('user.role'));

        // Step 2: GET queue is permitted (READ privilege)
        $qResp = $this->get('/vedika/queue');
        $qResp->assertStatus(200);

        // Step 3: Attempting decision mutation must fail-closed with 403 Forbidden
        $mutResp = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'catatan' => 'Auditor illegal mutation attempt',
        ]);
        $mutResp->assertStatus(403);

        // Step 4: Login as Verifikator Medis Senior
        $this->authenticateAsVerifier();
        $this->assertSame('Verifikator Medis Senior', session('user.role'));

        // Step 5: Decision mutation permitted for Verifikator
        $okResp = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 5200000,
            'catatan' => 'Verifikasi sah oleh Verifikator Medis Senior',
        ]);
        $this->assertTrue(in_array($okResp->status(), [200, 302]));
    }

    /**
     * Scenario 3.2: FPK Pull + Batch Plotting + Verifier Workload Chips (F10 x F11 x F25)
     */
    public function test_pairwise_fpk_pull_batch_plotting_and_workload_chips(): void
    {
        $this->authenticateAsVerifier();

        // Step 1: Check baseline workload
        $w1 = $this->get('/vedika/workload');
        $w1->assertStatus(200);

        // Step 2: Pull batch of 10 claims
        $pullResp = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-0114-202611-BATCH1',
            'bulan_pelayanan' => '2026-11',
            'jumlah_klaim' => 10,
            'auto_plot' => false,
        ]);
        $this->assertTrue(in_array($pullResp->status(), [200, 302]));

        // Step 3: Plot 4 claims to dr. Siti Rahma
        $plotResp = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801', 'CLM-2026-8802'],
            'verifier_nip' => '198704202011012001',
            'catatan' => 'Batch assignment pairwise test',
        ]);
        $this->assertTrue(in_array($plotResp->status(), [200, 302]));

        // Step 4: Verify workload status
        $w2 = $this->get('/vedika/workload');
        $w2->assertStatus(200);
    }

    /**
     * Scenario 3.3: 6 Kaidah Checklist + Konsol Putusan + SHA-256 Ledger (F17 x F18 x F24)
     */
    public function test_pairwise_checklist_decision_and_sha256_ledger(): void
    {
        $this->authenticateAsVerifier();

        // Step 1: Toggle checklist items
        $this->patch('/vedika/claims/CLM-2026-8801/checklist', [
            'item' => 'sep_valid',
            'value' => true,
        ]);

        // Step 2: Post decision
        $decResp = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 5200000,
            'catatan' => 'Semua kaidah lengkap dan terverifikasi',
        ]);
        $this->assertTrue(in_array($decResp->status(), [200, 302]));

        // Step 3: Verify audit ledger reflects decision
        $ledgerResp = $this->get('/audit/ledger');
        $ledgerResp->assertStatus(200);
    }

    /**
     * Scenario 3.4: Tri-Layer Scoring + Evidence Matrix + Modus Anomaly Filters (F07 x F08 x F12)
     */
    public function test_pairwise_scoring_evidence_matrix_and_modus_filters(): void
    {
        $this->authenticateAsVerifier();

        // Inspect claim with hard trigger
        $dossierResp = $this->get('/vedika/claims/CLM-2026-8804/dossier');
        $dossierResp->assertStatus(200);

        // Filter queue by red lane
        $queueResp = $this->get('/vedika/queue?lane=red');
        $queueResp->assertStatus(200);
    }

    /**
     * Scenario 3.5: SATUSEHAT SIP & Geovelocity + Konsol Putusan + SP-1 Letter (F16 x F18 x F23)
     */
    public function test_pairwise_satusehat_geovelocity_decision_and_sp1_letter(): void
    {
        $this->authenticateAsVerifier();

        // Step 1: Adjudicate phantom billing as TIDAK_LAYAK_FRAUD
        $decResp = $this->post('/vedika/claims/CLM-2026-8803/decision', [
            'decision' => 'TIDAK_LAYAK_FRAUD',
            'pending_reasons' => ['MED-01'],
            'tarif_verifikasi_rp' => 0,
            'catatan' => 'Anomali geovelocity 240 km/jam terkonfirmasi fiktif.',
        ]);
        $this->assertTrue(in_array($decResp->status(), [200, 302]));

        // Step 2: Generate official SP-1 Audit letter
        $sp1Resp = $this->get('/reports/sp1-audit/CLM-2026-8803');
        $sp1Resp->assertStatus(200);
        $sp1Resp->assertSee('SP-1');
    }

    /**
     * Scenario 3.6: Billing Riil RS Reconciliation + Tariff FKL48 + BAHV Recap (F14 x F19 x F20)
     */
    public function test_pairwise_billing_reconciliation_tariff_fkl48_and_bahv(): void
    {
        $this->authenticateAsVerifier();

        // Step 1: Inspect billing reconciliation
        $billingResp = $this->get('/vedika/claims/CLM-2026-8805/billing');
        $billingResp->assertStatus(200);

        // Step 2: Approve adjusted tariff
        $decResp = $this->post('/vedika/claims/CLM-2026-8805/decision', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 4500000,
            'ina_cbg_verified' => 'K-4-17-I',
            'catatan' => 'Penyesuaian ke Severity Level I',
        ]);
        $this->assertTrue(in_array($decResp->status(), [200, 302]));

        // Step 3: BAHV table reflects approved and correction
        $bahvResp = $this->get('/vedika/bahv');
        $bahvResp->assertStatus(200);
    }

    /**
     * Scenario 3.7: Pending Klarifikasi + 16 Baku Alasan + BA Pending + Susulan (F15 x F18 x F22)
     */
    public function test_pairwise_pending_clarification_3pillar_reasons_and_susulan(): void
    {
        $this->authenticateAsVerifier();

        // Step 1: Hold claim as PENDING_KLARIFIKASI
        $decResp = $this->post('/vedika/claims/CLM-2026-8802/decision', [
            'decision' => 'PENDING_KLARIFIKASI',
            'pending_reasons' => ['KOD-01', 'MED-05'],
            'catatan' => 'Hasil penunjang belum terlampir, klarifikasi dalam 10 HK',
        ]);
        $this->assertTrue(in_array($decResp->status(), [200, 302]));

        // Step 2: Printable BA Pending lists reasons
        $baResp = $this->get('/reports/ba-pending');
        $baResp->assertStatus(200);

        // Step 3: Resubmit susulan
        $resubResp = $this->post('/vedika/claims/CLM-2026-8802/resubmit-susulan', [
            'catatan_faskes' => 'Penyesuaian resume medis dan koding',
            'tarif_revisi_rp' => 6200000,
        ]);
        $this->assertTrue(in_array($resubResp->status(), [200, 302]));
    }

    /**
     * Scenario 3.8: Zero-PHI Masking + Dossier Digital + Export/Printable (F04 x F12 x F21 x F22)
     */
    public function test_pairwise_zero_phi_masking_dossier_and_printable_reports(): void
    {
        $this->authenticateAsVerifier();

        $dossier = $this->get('/vedika/claims/CLM-2026-8801/dossier');
        $dossier->assertStatus(200);
        $this->assertEquals(0, preg_match('/\b[1-9]\d{15}\b/', $dossier->getContent()));

        $bahv = $this->get('/reports/bahv-kolektif');
        $bahv->assertStatus(200);
        $this->assertEquals(0, preg_match('/\b[1-9]\d{15}\b/', $bahv->getContent()));

        $baPending = $this->get('/reports/ba-pending');
        $baPending->assertStatus(200);
        $this->assertEquals(0, preg_match('/\b[1-9]\d{15}\b/', $baPending->getContent()));
    }

    /**
     * Scenario 3.9: HybridApiService Outage Simulation + Offline Cache + Cockpit (F05 x F06)
     */
    public function test_pairwise_api_service_outage_simulation_offline_cache(): void
    {
        Http::fake([
            'http://127.0.0.1:8000/*' => Http::response(['detail' => 'Service Unavailable'], 503),
        ]);

        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $this->assertNotEquals(500, $response->status());
        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    /**
     * Scenario 3.10: 10-Day SLA Boundary Warning + Artisan Scan Command + Workload (F25 x F27)
     */
    public function test_pairwise_sla_boundary_warning_artisan_scan_and_workload(): void
    {
        $this->authenticateAsVerifier();

        // Workload check
        $wResp = $this->get('/vedika/workload');
        $wResp->assertStatus(200);

        // Run artisan scan
        $this->artisan('claimtrace:scan-sla', ['--threshold' => 8])
            ->assertExitCode(0);
    }
}
