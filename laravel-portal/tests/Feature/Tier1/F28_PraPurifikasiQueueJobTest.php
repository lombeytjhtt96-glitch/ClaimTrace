<?php

namespace Tests\Feature\Tier1;

use App\Jobs\IngestAuditTrailJob;
use App\Jobs\PurifyClaimBatchJob;
use App\Services\HybridApiService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class F28_PraPurifikasiQueueJobTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        DB::table('audit_ledger_entries')->truncate();
    }

    /**
     * T1-F28-01: test_purify_claim_batch_job_dispatches_onto_queue
     */
    public function test_purify_claim_batch_job_dispatches_onto_queue(): void
    {
        Queue::fake();

        PurifyClaimBatchJob::dispatch('FPK-0114-202611-001', [], [], '198704202011012001');

        Queue::assertPushed(PurifyClaimBatchJob::class, function ($job) {
            return $job->noFpk === 'FPK-0114-202611-001' && $job->initiatedByNip === '198704202011012001';
        });
    }

    /**
     * T1-F28-02: test_purify_claim_batch_job_validates_administrative_completeness
     */
    public function test_purify_claim_batch_job_validates_administrative_completeness(): void
    {
        $validClaim = [
            'id' => 'CLM-TEST-001',
            'no_sep' => 'SEP-VALID-001',
            'patient_nik_masked' => '3171********0001',
            'patient_card_masked' => '0001********',
            'nama_faskes' => 'RSUP Cipto Mangunkusumo',
            'faskes_id' => '0114R001',
            'dpjp_name' => 'dr. Budi, Sp.B',
            'dpjp_sip' => 'SIP-VALID-2026',
            'tgl_masuk' => '2026-11-01',
            'tgl_pulang' => '2026-11-03',
            'jenis_pelayanan' => 'RITL',
            'kode_cbg' => 'C-4-13-I',
            'tarif_fkl47' => 5000000,
        ];

        $job = new PurifyClaimBatchJob('FPK-TEST-001', [$validClaim]);
        $job->handle(app(HybridApiService::class));

        $res = Cache::get('purifikasi_result_FPK-TEST-001');
        $this->assertNotNull($res);
        $this->assertSame(1, $res['total_claims']);
        $this->assertSame(1, $res['lolos_count']);
        $this->assertSame(0, $res['gagal_count']);
        $this->assertSame('PURIFIKASI_LOLOS', $res['claims_result'][0]['purifikasi_status']);
        $this->assertSame('HIJAU', $res['claims_result'][0]['purifikasi_lane']);
    }

    /**
     * T1-F28-03: test_purify_claim_batch_job_detects_modus_11_repeat_billing
     */
    public function test_purify_claim_batch_job_detects_modus_11_repeat_billing(): void
    {
        $claims = [
            [
                'id' => 'CLM-DUP-001',
                'no_sep' => 'SEP-DUP-001',
                'patient_nik_masked' => '3171********9999',
                'dpjp_name' => 'dr. Agus, Sp.PD',
                'dpjp_sip' => 'SIP-2026',
                'tgl_masuk' => '2026-11-05',
                'tgl_pulang' => '2026-11-05',
                'jenis_pelayanan' => 'RJTL',
                'kode_cbg' => 'Q-5-44-0',
                'tarif_fkl47' => 180000,
            ],
            [
                'id' => 'CLM-DUP-002',
                'no_sep' => 'SEP-DUP-002',
                'patient_nik_masked' => '3171********9999', // Same patient, same admission date
                'dpjp_name' => 'dr. Agus, Sp.PD',
                'dpjp_sip' => 'SIP-2026',
                'tgl_masuk' => '2026-11-05',
                'tgl_pulang' => '2026-11-05',
                'jenis_pelayanan' => 'RJTL',
                'kode_cbg' => 'Q-5-44-0',
                'tarif_fkl47' => 180000,
            ],
        ];

        $job = new PurifyClaimBatchJob('FPK-DUP-001', $claims);
        $job->handle(app(HybridApiService::class));

        $res = Cache::get('purifikasi_result_FPK-DUP-001');
        $this->assertNotNull($res);
        $this->assertSame(1, $res['gagal_count']); // Second claim flagged for repeat billing

        $flagged = $res['claims_result'][1];
        $this->assertSame('PURIFIKASI_GAGAL', $flagged['purifikasi_status']);
        $this->assertSame('MERAH', $flagged['purifikasi_lane']);

        $rules = array_column($flagged['violations'], 'rule');
        $this->assertContains('REPEAT_BILLING_OVERLAP', $rules);
    }

    /**
     * T1-F28-04: test_purify_claim_batch_job_detects_expired_dpjp_sip_hard_trigger
     */
    public function test_purify_claim_batch_job_detects_expired_dpjp_sip_hard_trigger(): void
    {
        $claim = [
            'id' => 'CLM-EXP-001',
            'no_sep' => 'SEP-EXP-001',
            'patient_nik_masked' => '3171********1111',
            'dpjp_name' => 'dr. Dedi, Sp.A',
            'dpjp_sip' => 'SIP-EXPIRED-2023', // Expired SIP hard trigger
            'tgl_masuk' => '2026-11-05',
            'tgl_pulang' => '2026-11-05',
            'jenis_pelayanan' => 'RJTL',
            'kode_cbg' => 'Q-5-44-0',
            'tarif_fkl47' => 250000,
        ];

        $job = new PurifyClaimBatchJob('FPK-EXP-001', [$claim]);
        $job->handle(app(HybridApiService::class));

        $res = Cache::get('purifikasi_result_FPK-EXP-001');
        $this->assertNotNull($res);
        $this->assertSame(1, $res['gagal_count']);

        $flagged = $res['claims_result'][0];
        $this->assertSame('MERAH', $flagged['purifikasi_lane']);
        $this->assertGreaterThanOrEqual(75.0, $flagged['purifikasi_score']);

        $rules = array_column($flagged['violations'], 'rule');
        $this->assertContains('SIP_DPJP_EXPIRED', $rules);
    }

    /**
     * T1-F28-05: test_purify_claim_batch_job_handles_malformed_claim_data_fail_closed
     */
    public function test_purify_claim_batch_job_handles_malformed_claim_data_fail_closed(): void
    {
        $malformed = [
            'id' => 'CLM-MAL-001',
            'no_sep' => '', // Empty SEP
            'patient_nik_masked' => '', // Empty NIK
            'tgl_masuk' => '2026-11-10',
            'tgl_pulang' => '2026-11-01', // Pulang before Masuk
            'tarif_fkl47' => -50000, // Negative tariff
        ];

        $job = new PurifyClaimBatchJob('FPK-MAL-001', [$malformed]);
        $job->handle(app(HybridApiService::class));

        $res = Cache::get('purifikasi_result_FPK-MAL-001');
        $this->assertNotNull($res);
        $this->assertSame(1, $res['gagal_count']);
        $this->assertSame('PURIFIKASI_GAGAL', $res['claims_result'][0]['purifikasi_status']);
    }

    /**
     * T1-F28-06: test_ingest_audit_trail_job_dispatches_onto_queue
     */
    public function test_ingest_audit_trail_job_dispatches_onto_queue(): void
    {
        Queue::fake();

        IngestAuditTrailJob::dispatch('CLAIM_ADJUDICATION', 'CLM-2026-8801', '198704202011012001', [
            'decision' => 'LAYAK',
        ]);

        Queue::assertPushed(IngestAuditTrailJob::class, function ($job) {
            return $job->eventType === 'CLAIM_ADJUDICATION' && $job->claimId === 'CLM-2026-8801';
        });
    }

    /**
     * T1-F28-07: test_ingest_audit_trail_job_computes_sha256_hash_chaining
     */
    public function test_ingest_audit_trail_job_computes_sha256_hash_chaining(): void
    {
        $job = new IngestAuditTrailJob('SYSTEM_ALERT', 'CLM-TEST-001', 'SYSTEM', ['alert' => 'SLA_WARN']);
        $job->handle(app(HybridApiService::class));

        $entry = DB::table('audit_ledger_entries')->where('claim_id', 'CLM-TEST-001')->first();
        $this->assertNotNull($entry);
        $this->assertSame(1, (int) $entry->block_index);
        $this->assertSame(str_repeat('0', 64), $entry->prev_hash);
        $this->assertSame(64, strlen($entry->current_hash));
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $entry->current_hash);
    }

    /**
     * T1-F28-08: test_ingest_audit_trail_job_preserves_tamper_evident_hash_continuity
     */
    public function test_ingest_audit_trail_job_preserves_tamper_evident_hash_continuity(): void
    {
        $apiService = app(HybridApiService::class);

        // Block 1
        $job1 = new IngestAuditTrailJob('EVENT_A', 'CLM-01', 'VERIFIER_1', ['step' => 1]);
        $job1->handle($apiService);

        // Block 2
        $job2 = new IngestAuditTrailJob('EVENT_B', 'CLM-02', 'VERIFIER_2', ['step' => 2]);
        $job2->handle($apiService);

        // Block 3
        $job3 = new IngestAuditTrailJob('EVENT_C', 'CLM-03', 'VERIFIER_3', ['step' => 3]);
        $job3->handle($apiService);

        $entries = DB::table('audit_ledger_entries')->orderBy('block_index')->get();
        $this->assertCount(3, $entries);

        // Verify continuity: block[N].prev_hash === block[N-1].current_hash
        $this->assertSame(str_repeat('0', 64), $entries[0]->prev_hash);
        $this->assertSame($entries[0]->current_hash, $entries[1]->prev_hash);
        $this->assertSame($entries[1]->current_hash, $entries[2]->prev_hash);
    }

    /**
     * T1-F28-09: test_ingest_audit_trail_job_persists_to_sqlite_ledger_table
     */
    public function test_ingest_audit_trail_job_persists_to_sqlite_ledger_table(): void
    {
        $job = new IngestAuditTrailJob('FPK_PLOTTING', 'FPK-999', 'COCKPIT', ['verifier' => '19870420']);
        $job->handle(app(HybridApiService::class));

        $this->assertDatabaseHas('audit_ledger_entries', [
            'event_type' => 'FPK_PLOTTING',
            'claim_id' => 'FPK-999',
            'actor' => 'COCKPIT',
        ]);
    }

    /**
     * T1-F28-10: test_batch_purifikasi_workflow_triggers_audit_trail_ingestion
     */
    public function test_batch_purifikasi_workflow_triggers_audit_trail_ingestion(): void
    {
        Queue::fake([IngestAuditTrailJob::class]);

        $job = new PurifyClaimBatchJob('FPK-AUDIT-001', []);
        $job->handle(app(HybridApiService::class));

        Queue::assertPushed(IngestAuditTrailJob::class, function ($auditJob) {
            return $auditJob->eventType === 'PURIFIKASI_BATCH' && $auditJob->claimId === 'FPK-AUDIT-001';
        });
    }

    /**
     * T1-F28-11: test_queue_jobs_contain_strictly_zero_emojis
     */
    public function test_queue_jobs_contain_strictly_zero_emojis(): void
    {
        $purifyJobContent = file_get_contents(app_path('Jobs/PurifyClaimBatchJob.php'));
        $auditJobContent = file_get_contents(app_path('Jobs/IngestAuditTrailJob.php'));

        $hasEmoji1 = preg_match('/[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', $purifyJobContent);
        $hasEmoji2 = preg_match('/[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', $auditJobContent);

        $this->assertSame(0, $hasEmoji1, 'PurifyClaimBatchJob.php must contain 0 emojis.');
        $this->assertSame(0, $hasEmoji2, 'IngestAuditTrailJob.php must contain 0 emojis.');
    }
}
