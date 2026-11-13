<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('services.fastapi.mock_fallback', true)) {
            $this->setupAdaptiveFastApiMocking();
        }
    }

    /**
     * Memastikan testing berjalan mulus dengan fake response kanonikal jika engine port 8000 offline.
     */
    protected function setupAdaptiveFastApiMocking(): void
    {
        $isLive = false;
        try {
            $probe = @file_get_contents('http://127.0.0.1:8000/health', false, stream_context_create([
                'http' => ['timeout' => 0.5]
            ]));
            if ($probe !== false) {
                $isLive = true;
            }
        } catch (\Throwable $e) {
            $isLive = false;
        }

        if (!$isLive) {
            $fixturesDir = __DIR__ . '/Fixtures/fastapi';

            Http::fake([
                'http://127.0.0.1:8000/health' => Http::response(
                    json_decode(file_get_contents($fixturesDir . '/health_ok.json'), true), 200
                ),
                'http://127.0.0.1:8000/api/v1/health' => Http::response(
                    json_decode(file_get_contents($fixturesDir . '/health_ok.json'), true), 200
                ),
                'http://127.0.0.1:8000/api/v1/auth/login' => Http::response(
                    json_decode(file_get_contents($fixturesDir . '/auth_login_verifier.json'), true), 200
                ),
                'http://127.0.0.1:8000/api/v1/cockpit/summary*' => Http::response(
                    json_decode(file_get_contents($fixturesDir . '/cockpit_summary.json'), true), 200
                ),
                'http://127.0.0.1:8000/api/v1/system/national-scale-metrics' => Http::response(
                    json_decode(file_get_contents($fixturesDir . '/cockpit_summary.json'), true)['national_scale'], 200
                ),
                'http://127.0.0.1:8000/api/v1/vedika/pending-codes' => Http::response(
                    json_decode(file_get_contents($fixturesDir . '/pending_codes_16.json'), true), 200
                ),
                'http://127.0.0.1:8000/api/v1/vedika/workload' => Http::response(
                    json_decode(file_get_contents($fixturesDir . '/workload_summary.json'), true), 200
                ),
                'http://127.0.0.1:8000/api/v1/claims/*/vedika-dossier' => Http::response(
                    json_decode(file_get_contents($fixturesDir . '/dossier_clm_8801.json'), true), 200
                ),
                'http://127.0.0.1:8000/api/v1/claims/*/dossier' => Http::response(
                    json_decode(file_get_contents($fixturesDir . '/dossier_clm_8801.json'), true), 200
                ),
                'http://127.0.0.1:8000/api/v1/claims/*/decision' => Http::response(
                    json_decode(file_get_contents($fixturesDir . '/decision_success_receipt.json'), true), 200
                ),
                'http://127.0.0.1:8000/api/v1/claims*' => Http::response(
                    json_decode(file_get_contents($fixturesDir . '/claims_queue_page1.json'), true), 200
                ),
                'http://127.0.0.1:8000/api/v1/vedika/plotting' => Http::response([
                    'status' => 'success',
                    'message' => 'Batch plotting berkas berhasil dilakukan.',
                    'assigned_count' => 4,
                ], 200),
                'http://127.0.0.1:8000/api/v1/vedika/fpk-pull' => Http::response([
                    'status' => 'success',
                    'message' => 'Berhasil menarik 5 berkas klaim dari VClaim.',
                    'ingested_count' => 5,
                ], 200),
            ]);
        }
    }

    /**
     * Helper untuk login sebagai Verifikator Medis Senior dr. Siti Rahma, Sp.PK
     */
    protected function authenticateAsVerifier(): self
    {
        session([
            'user' => [
                'nip' => '198704202011012001',
                'name' => 'dr. Siti Rahma, Sp.PK',
                'role' => 'Verifikator Medis Senior',
                'allowedRoles' => ['ADJUDICATE', 'READ', 'VIEW'],
                'scope' => 'National',
                'token' => 'ct_test_token_verifier_session_19870420',
            ]
        ]);
        return $this;
    }

    /**
     * Helper untuk login sebagai Auditor Pengawasan (Read-Only)
     */
    protected function authenticateAsAuditor(): self
    {
        session([
            'user' => [
                'nip' => '199003152018011005',
                'name' => 'dr. Andi Pratama, MARS',
                'role' => 'Auditor Pengawasan (Read-Only)',
                'allowedRoles' => ['READ', 'VIEW'],
                'scope' => 'National',
                'token' => 'ct_test_token_auditor_session_19900315',
            ]
        ]);
        return $this;
    }

    /**
     * Helper untuk login sebagai Analis Forensik Anti-Fraud Budi Santoso, S.Kom
     */
    protected function authenticateAsAnalyst(): self
    {
        session([
            'user' => [
                'nip' => '199208152015031002',
                'name' => 'Budi Santoso, S.Kom',
                'role' => 'Analis Forensik Anti-Fraud',
                'allowedRoles' => ['READ', 'VIEW'],
                'scope' => 'National',
                'token' => 'ct_test_token_analyst_session_19920815',
            ]
        ]);
        return $this;
    }

    /**
     * Helper untuk login sebagai Administrator Kebijakan Hendra Wijaya, SE, Ak
     */
    protected function authenticateAsAdmin(): self
    {
        session([
            'user' => [
                'nip' => '198501012010011001',
                'name' => 'Hendra Wijaya, SE, Ak',
                'role' => 'Administrator Kebijakan',
                'allowedRoles' => ['ADMIN', 'ADJUDICATE', 'READ', 'VIEW'],
                'scope' => 'National',
                'token' => 'ct_test_token_admin_session_19850101',
            ]
        ]);
        return $this;
    }
}
