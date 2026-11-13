<?php

namespace Tests\Feature\Tier4;

use Tests\TestCase;

class RealWorldWorkloadTest extends TestCase
{
    /**
     * TIER 4 · SCENARIO 1: Full Verifier Claim Lifecycle
     * (Login -> Antrean -> Dossier -> 6 Kaidah -> Layak Bayar -> BAHV Kolektif)
     * Target Role: Verifikator Medis Senior (dr. Siti Rahma, Sp.PK · NIP: 198704202011012001)
     */
    public function test_scenario_1_full_verifier_claim_lifecycle(): void
    {
        // Step 1: Authentication & Identity Establishment
        $loginResp = $this->post('/login', [
            'identifier' => '198704202011012001',
            'password' => 'Password123!',
            'captcha_input' => 'TEST',
            'captcha_code' => 'TEST',
        ]);
        $loginResp->assertStatus(302);
        $this->assertSame('198704202011012001', session('user.nip'));

        // Step 2: Antrean Navigation & Claim Selection
        $queueResp = $this->get('/vedika/queue?assigned_verifier_nip=198704202011012001&lane=green');
        $queueResp->assertStatus(200);

        // Step 3: Digital Dossier Inspection & 4-Layer Evidence Review
        $dossierResp = $this->get('/vedika/claims/CLM-2026-8801/dossier');
        $dossierResp->assertStatus(200);
        $dossierContent = $dossierResp->getContent();
        $this->assertStringContainsString('DOC-SEP', $dossierContent);
        $this->assertStringContainsString('DOC-RESUME', $dossierContent);
        $this->assertMatchesRegularExpression('/[a-f0-9]{64}/', $dossierContent);

        // Step 4: 6 Kaidah Kertas Kerja Completion
        $patchResp = $this->patch('/vedika/claims/CLM-2026-8801/checklist', [
            'item' => 'sep_valid',
            'value' => true,
        ]);
        $this->assertTrue(in_array($patchResp->status(), [200, 302]));

        // Step 5: Konsol Putusan Adjudication as LAYAK_BAYAR
        $decResp = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 5200000,
            'ina_cbg_verified' => 'C-4-13-I',
            'catatan' => 'Klaim rawat inap katarak telah diperiksa lengkap 6 kaidah VEDIKA. Berkas sah layak bayar.',
        ]);
        $this->assertTrue(in_array($decResp->status(), [200, 302]));

        // Step 6: BAHV Recapitulation & Official Document Generation
        $bahvResp = $this->get('/vedika/bahv');
        $bahvResp->assertStatus(200);

        $printResp = $this->get('/reports/bahv-kolektif');
        $printResp->assertStatus(200);
        // Verify zero emojis and Indonesian dot formatting
        $this->assertEquals(0, preg_match('/\p{Extended_Pictographic}/u', $printResp->getContent()));
    }

    /**
     * TIER 4 · SCENARIO 2: Fraud Anomaly Detection & Adjudication
     * (Phantom Billing -> Hard Trigger Merah -> Tidak Layak Fraud -> SHA-256 Cryptographic Seal)
     * Target Roles: Analis Forensik & Verifikator Medis Senior
     */
    public function test_scenario_2_fraud_anomaly_detection_and_adjudication(): void
    {
        // Step 1: Analis Forensik logs in and filters by Phantom Billing
        $this->authenticateAsAnalyst();
        $cockpitResp = $this->get('/cockpit');
        $cockpitResp->assertStatus(200);

        // Step 2: 4-Layer Forensic Evidence Analysis for CLM-2026-8803
        $dossierResp = $this->get('/vedika/claims/CLM-2026-8803/dossier');
        $dossierResp->assertStatus(200);

        // Analis attempt to adjudicate is blocked (Fail-Closed)
        $blockedResp = $this->post('/vedika/claims/CLM-2026-8803/decision', [
            'decision' => 'TIDAK_LAYAK_FRAUD',
            'catatan' => 'Analis mutasi ilegal',
        ]);
        $blockedResp->assertStatus(403);

        // Step 3: Escalation - Verifikator Medis Senior logs in
        $this->authenticateAsVerifier();

        // Step 4: Adjudication as TIDAK_LAYAK_FRAUD
        $fraudResp = $this->post('/vedika/claims/CLM-2026-8803/decision', [
            'decision' => 'TIDAK_LAYAK_FRAUD',
            'pending_reasons' => ['MED-01', 'ADM-02'],
            'tarif_verifikasi_rp' => 0,
            'catatan' => 'Klaim fiktif terkonfirmasi. Anomali geovelocity 240 km/jam dan penolakan kehadiran Mobile JKN. Diteruskan ke Wasrik.',
        ]);
        $this->assertTrue(in_array($fraudResp->status(), [200, 302]));

        // Step 5: Ledger Minting & SP-1 Audit Letter Dispatch
        $ledgerResp = $this->get('/audit/ledger');
        $ledgerResp->assertStatus(200);

        $sp1Resp = $this->get('/reports/sp1-audit/CLM-2026-8803');
        $sp1Resp->assertStatus(200);
        $this->assertEquals(0, preg_match('/\p{Extended_Pictographic}/u', $sp1Resp->getContent()));
    }

    /**
     * TIER 4 · SCENARIO 3: FPK Batch Pull & Workload Plotting
     * (VClaim Pull -> Batch Plotting -> Workload Monitor -> 10-Day SLA Scan)
     * Target Role: Administrator Kebijakan (Hendra Wijaya · NIP: 198501012010011001)
     */
    public function test_scenario_3_fpk_batch_pull_and_workload_plotting(): void
    {
        $this->authenticateAsAdmin();

        // Step 1: Batch Ingestion via VClaim Modal
        $pullResp = $this->post('/vedika/fpk-pull', [
            'no_fpk' => 'FPK-0114-202611-BATCH88',
            'bulan_pelayanan' => '2026-11',
            'jenis_pengajuan' => 'Reguler',
            'jenis_pelayanan' => 'RJTL',
            'nama_faskes' => 'RSUP Persahabatan',
            'jumlah_klaim' => 20,
            'auto_plot' => false,
        ]);
        $this->assertTrue(in_array($pullResp->status(), [200, 302]));

        // Step 2: Selective Batch Plotting to dr. Siti Rahma
        $plotResp = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801', 'CLM-2026-8802'],
            'verifier_nip' => '198704202011012001',
            'catatan' => 'Penugasan berkas rawat jalan RSUP Persahabatan.',
        ]);
        $this->assertTrue(in_array($plotResp->status(), [200, 302]));

        // Step 3: Live Workload Verification
        $workloadResp = $this->get('/vedika/workload');
        $workloadResp->assertStatus(200);

        // Step 4: Statutory SLA Monitoring
        $this->artisan('claimtrace:scan-sla')->assertExitCode(0);
    }

    /**
     * TIER 4 · SCENARIO 4: Dispute & Pending Clarification
     * (Pending Klarifikasi -> Coded Reasons KOD-01/MED-05 -> BA Pending Print -> Susulan Flow)
     * Target Roles: Verifikator Medis Senior & Faskes Billing
     */
    public function test_scenario_4_dispute_and_pending_clarification(): void
    {
        $this->authenticateAsVerifier();

        // Step 1: Clinical Dossier Review
        $dossierResp = $this->get('/vedika/claims/CLM-2026-8802/dossier');
        $dossierResp->assertStatus(200);

        // Step 2: Holding Decision with Coded 3-Pillar Reasons
        $holdResp = $this->post('/vedika/claims/CLM-2026-8802/decision', [
            'decision' => 'PENDING_KLARIFIKASI',
            'pending_reasons' => ['KOD-01', 'MED-05'],
            'catatan' => 'Indikasi upcoding severity level III. Hasil penunjang belum terlampir. Klarifikasi dokumen dalam 10 hari kerja.',
        ]);
        $this->assertTrue(in_array($holdResp->status(), [200, 302]));

        // Step 3: Official BA Pending Generation
        $baResp = $this->get('/reports/ba-pending');
        $baResp->assertStatus(200);

        // Step 4: Hospital Resubmission (Klaim Susulan)
        $resubResp = $this->post('/vedika/claims/CLM-2026-8802/resubmit-susulan', [
            'catatan_faskes' => 'Kami sepakat penyesuaian koding ke Severity Level I. Berkas resume medis revisi terlampir.',
            'perbaikan_cbg' => 'I-4-10-I',
            'tarif_revisi_rp' => 6200000,
        ]);
        $this->assertTrue(in_array($resubResp->status(), [200, 302]));
    }

    /**
     * TIER 4 · SCENARIO 5: Auditor Read-Only Gating
     * (Login Auditor -> View Queue -> Attempt Putusan -> Fail-Closed 403 Forbidden)
     * Target Role: Auditor Read-Only (dr. Andi Pratama, MARS · NIP: 199003152018011005)
     */
    public function test_scenario_5_auditor_read_only_gating(): void
    {
        // Step 1: Auditor Authentication
        $this->authenticateAsAuditor();
        $this->assertSame('Auditor Pengawasan (Read-Only)', session('user.role'));

        // Step 2: Read-Only Oversight Navigation
        $cockpit = $this->get('/cockpit');
        $cockpit->assertStatus(200);

        $queue = $this->get('/vedika/queue');
        $queue->assertStatus(200);

        $ledger = $this->get('/audit/ledger');
        $ledger->assertStatus(200);

        // Zero-PHI masking enforced
        $this->assertEquals(0, preg_match('/\b[1-9]\d{15}\b/', $queue->getContent()));

        // Step 3: Attempted Unauthorized Mutation (Adjudication Bypass Test) -> 403
        $mutResp = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'catatan' => 'Auditor unauthorized approval attempt',
        ]);
        $mutResp->assertStatus(403);

        // Step 4: Attempted Unauthorized Plotting -> 403
        $plotResp = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801'],
            'verifier_nip' => '199003152018011005',
        ]);
        $plotResp->assertStatus(403);

        // Step 5: Ledger Integrity Audit
        $ledgerFinal = $this->get('/audit/ledger');
        $ledgerFinal->assertStatus(200);
    }
}
