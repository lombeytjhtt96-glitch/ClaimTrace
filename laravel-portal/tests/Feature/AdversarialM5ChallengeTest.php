<?php

namespace Tests\Feature;

use App\Services\HybridApiService;
use Tests\TestCase;

class AdversarialM5ChallengeTest extends TestCase
{
    // =========================================================================
    // Challenge 1: Adjudication RBAC & Fail-Closed Enforcement
    // =========================================================================

    /**
     * Unauthenticated guest cannot submit decisions to POST /vedika/decision/{id}.
     */
    public function test_challenge_adjudication_unauthenticated_post_vedika_decision_rejected(): void
    {
        $response = $this->post('/vedika/decision/CLM-2026-8801', [
            'decision' => 'LAYAK_BAYAR',
            'catatan' => 'Adversarial unauthenticated attempt',
            'tarif_verifikasi_rp' => 5200000,
        ]);

        $this->assertTrue(
            in_array($response->status(), [302, 403], true),
            "Expected 302 redirect or 403 forbidden for guest, got {$response->status()}"
        );
    }

    /**
     * Unauthenticated guest JSON request to POST /vedika/decision/{id} returns 403 fail-closed.
     */
    public function test_challenge_adjudication_unauthenticated_json_returns_403_fail_closed(): void
    {
        $response = $this->postJson('/vedika/decision/CLM-2026-8801', [
            'decision' => 'LAYAK_BAYAR',
            'catatan' => 'Adversarial unauthenticated JSON attempt',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Unauthenticated guest cannot submit decisions to POST /vedika/claims/{id}/decision.
     */
    public function test_challenge_adjudication_unauthenticated_post_claims_decision_rejected(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'catatan' => 'Adversarial unauthenticated attempt',
        ]);

        $this->assertTrue(in_array($response->status(), [302, 403], true));
    }

    /**
     * VIEW-only user (Auditor) cannot submit decisions to POST /vedika/decision/{id}.
     */
    public function test_challenge_adjudication_view_only_auditor_cannot_submit_decision_alias(): void
    {
        $this->authenticateAsAuditor();

        $response = $this->post('/vedika/decision/CLM-2026-8801', [
            'decision' => 'LAYAK_BAYAR',
            'catatan' => 'Percobaan adjudikasi oleh auditor read-only',
            'tarif_verifikasi_rp' => 5200000,
        ]);

        $response->assertStatus(403);
    }

    /**
     * VIEW-only user (Auditor) cannot submit decisions to POST /vedika/claims/{id}/decision.
     */
    public function test_challenge_adjudication_view_only_auditor_cannot_submit_decision_canonical(): void
    {
        $this->authenticateAsAuditor();

        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'catatan' => 'Percobaan adjudikasi oleh auditor read-only',
            'tarif_verifikasi_rp' => 5200000,
        ]);

        $response->assertStatus(403);
    }

    /**
     * VIEW-only user (Analis Forensik) cannot submit decisions to POST /vedika/decision/{id}.
     */
    public function test_challenge_adjudication_view_only_analyst_cannot_submit_decision(): void
    {
        $this->authenticateAsAnalyst();

        $response = $this->post('/vedika/decision/CLM-2026-8801', [
            'decision' => 'TIDAK_LAYAK_FRAUD',
            'catatan' => 'Percobaan adjudikasi oleh analis',
            'pending_reasons' => ['MED-01'],
        ]);

        $response->assertStatus(403);
    }

    /**
     * Missing catatan is rejected with validation error (HTTP 302 session error).
     */
    public function test_challenge_adjudication_missing_catatan_rejected_with_302_validation_error(): void
    {
        $this->authenticateAsVerifier();

        $response = $this->post('/vedika/decision/CLM-2026-8801', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 5200000,
            // 'catatan' completely omitted
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['catatan']);
    }

    /**
     * Empty string catatan is rejected with validation error (HTTP 302 session error).
     */
    public function test_challenge_adjudication_empty_catatan_rejected_with_302_validation_error(): void
    {
        $this->authenticateAsVerifier();

        $response = $this->post('/vedika/decision/CLM-2026-8801', [
            'decision' => 'PENDING_KLARIFIKASI',
            'catatan' => '',
            'pending_reasons' => ['ADM-01'],
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['catatan']);
    }

    /**
     * Missing catatan in JSON request is rejected with HTTP 422 Unprocessable Entity.
     */
    public function test_challenge_adjudication_missing_catatan_json_returns_422_validation_error(): void
    {
        $this->authenticateAsVerifier();

        $response = $this->postJson('/vedika/decision/CLM-2026-8801', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 5200000,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['catatan']);
    }

    // =========================================================================
    // Challenge 2: Dispute & SLA Boundaries, Invalid Status & Tariffs
    // =========================================================================

    /**
     * Extreme / invalid dispute levels are rejected.
     */
    public function test_challenge_dispute_extreme_level_rejected(): void
    {
        $this->authenticateAsVerifier();

        $response = $this->post('/vedika/decision/CLM-2026-8801', [
            'decision' => 'DISPUTE_TKMKB',
            'dispute_level' => 'PROVINSI_EXTREME_INVALID',
            'catatan' => 'Uji tingkat sengketa ekstrim non-baku',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['dispute_level']);
    }

    /**
     * Valid dispute levels (CABANG, KEDEPUTIAN, PUSAT_TKMKB) are accepted.
     */
    public function test_challenge_dispute_valid_levels_accepted(): void
    {
        $this->authenticateAsVerifier();

        foreach (['CABANG', 'KEDEPUTIAN', 'PUSAT_TKMKB'] as $level) {
            $response = $this->post('/vedika/decision/CLM-2026-8801', [
                'decision' => 'DISPUTE_TKMKB',
                'dispute_level' => $level,
                'pending_reasons' => ['KOD-01'],
                'catatan' => "Uji eskalasi sengketa level {$level}",
            ]);

            $this->assertTrue(in_array($response->status(), [200, 302], true));
            $response->assertSessionHasNoErrors();
        }
    }

    /**
     * Invalid adjudication status codes are rejected.
     */
    public function test_challenge_adjudication_invalid_status_code_rejected(): void
    {
        $this->authenticateAsVerifier();

        $invalidStatuses = [
            'STATUS_PALSU',
            'REJECT_ALL',
            'BAYAR_SEBAGIAN',
            'LUNAS',
            'PENDING',
        ];

        foreach ($invalidStatuses as $badStatus) {
            $response = $this->post('/vedika/decision/CLM-2026-8801', [
                'decision' => $badStatus,
                'catatan' => "Uji status tidak valid: {$badStatus}",
            ]);

            $response->assertStatus(302);
            $response->assertSessionHasErrors(['decision']);
        }
    }

    /**
     * Non-numeric and negative tariffs are rejected.
     */
    public function test_challenge_adjudication_non_numeric_and_negative_tariffs_rejected(): void
    {
        $this->authenticateAsVerifier();

        // Non-numeric
        $response1 = $this->post('/vedika/decision/CLM-2026-8801', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 'LIMA_JUTA_RUPIAH',
            'catatan' => 'Uji tarif string non-numerik',
        ]);
        $response1->assertStatus(302);
        $response1->assertSessionHasErrors(['tarif_verifikasi_rp']);

        // Negative value
        $response2 = $this->post('/vedika/decision/CLM-2026-8801', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => -500000,
            'catatan' => 'Uji tarif negatif',
        ]);
        $response2->assertStatus(302);
        $response2->assertSessionHasErrors(['tarif_verifikasi_rp']);
    }

    /**
     * Decision TIDAK_LAYAK_FRAUD resets approved tariff to 0.
     */
    public function test_challenge_adjudication_tidak_layak_fraud_forces_tariff_to_zero(): void
    {
        $this->authenticateAsVerifier();

        $response = $this->post('/vedika/decision/CLM-2026-8801', [
            'decision' => 'TIDAK_LAYAK_FRAUD',
            'tarif_verifikasi_rp' => 15000000, // Should be coerced/forced to 0
            'pending_reasons' => ['MED-01'],
            'catatan' => 'Klaim fiktif terbukti fraud, seluruh tarif FKL48 harus 0.',
        ]);

        $this->assertTrue(in_array($response->status(), [200, 302], true));
        $savedDecision = session('decisions.CLM-2026-8801');
        $this->assertNotNull($savedDecision);
        $this->assertEquals(0, $savedDecision['tarif_verifikasi_rp']);
    }

    // =========================================================================
    // Challenge 3: SHA-256 Tamper-Evident Ledger Integrity & Genesis Block
    // =========================================================================

    /**
     * Genesis Block exists with 64 zeros as prev_hash and every subsequent block has valid chaining.
     */
    public function test_challenge_sha256_ledger_genesis_64_zeros_and_chain_continuity(): void
    {
        $apiService = app(HybridApiService::class);
        $ledger = $apiService->getAuditLedger();

        $this->assertEquals('success', $ledger['status'] ?? 'success');
        $this->assertTrue($ledger['integrity_verified'] ?? true);
        $this->assertNull($ledger['broken_at_index'] ?? null);

        $chain = $ledger['chain'];
        $this->assertNotEmpty($chain);

        // Find the initial block in the chronological order
        // If ordered descending (480 -> 1), sort ascending to verify chain
        $sortedChain = $chain;
        usort($sortedChain, function ($a, $b) {
            return ($a['index'] ?? 0) <=> ($b['index'] ?? 0);
        });

        // First block in sorted chain must have prev_hash == 64 zeros
        $initialBlock = $sortedChain[0];
        $expectedGenesisPrevHash = str_repeat('0', 64);
        $this->assertEquals(
            $expectedGenesisPrevHash,
            $initialBlock['prev_hash'],
            "Initial block must have 64 zeros as prev_hash"
        );

        // Verify mathematical chain continuity: block[N].prev_hash === block[N-1].current_hash
        $blockCount = count($sortedChain);
        for ($i = 1; $i < $blockCount; $i++) {
            $prevBlock = $sortedChain[$i - 1];
            $currBlock = $sortedChain[$i];

            $this->assertEquals(
                $prevBlock['current_hash'],
                $currBlock['prev_hash'],
                "Broken hash chaining between block #{$prevBlock['index']} and block #{$currBlock['index']}"
            );

            // Verify current_hash is a valid 64-character hexadecimal SHA-256 string
            $this->assertEquals(64, strlen($currBlock['current_hash']));
            $this->assertTrue(ctype_xdigit($currBlock['current_hash']));
        }
    }

    /**
     * Ledger page renders Genesis block and validity badge.
     */
    public function test_challenge_sha256_ledger_page_renders_genesis_and_valid_status(): void
    {
        $this->authenticateAsAuditor();

        $response = $this->get('/audit/ledger');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(str_contains($content, 'VALID'));
        $this->assertTrue(str_contains($content, 'SHA-256'));
        $this->assertTrue(str_contains($content, '0000000000000000000000000000000000000000000000000000000000000000') || str_contains($content, 'GENESIS'));
    }

    // =========================================================================
    // Challenge 4: Strictly ZERO Emojis Verification
    // =========================================================================

    /**
     * Scan all source code, templates, and routes in laravel-portal for emojis.
     */
    public function test_challenge_strictly_zero_emojis_in_source_and_views(): void
    {
        $directories = [
            app_path('Http/Controllers'),
            app_path('Services'),
            app_path('Http/Middleware'),
            resource_path('views/vedika'),
            resource_path('views/reports'),
            resource_path('views/audit'),
            base_path('routes'),
        ];

        // Regex for emojis (Extended Pictographic, Emoticons, Miscellaneous Symbols)
        $emojiRegex = '/[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}\x{1F1E0}-\x{1F1FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}\x{1F900}-\x{1F9FF}\x{1FA70}-\x{1FAFF}]/u';

        $foundEmojis = [];

        foreach ($directories as $dir) {
            if (!is_dir($dir)) {
                continue;
            }

            $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir));
            foreach ($iterator as $file) {
                if ($file->isDir()) {
                    continue;
                }
                $ext = $file->getExtension();
                if (!in_array($ext, ['php', 'blade.php'])) {
                    continue;
                }

                $content = file_get_contents($file->getPathname());
                if (preg_match_all($emojiRegex, $content, $matches)) {
                    $foundEmojis[$file->getPathname()] = array_unique($matches[0]);
                }
            }
        }

        $this->assertEmpty(
            $foundEmojis,
            "Emojis detected in source files: " . json_encode($foundEmojis, JSON_UNESCAPED_UNICODE)
        );
    }
}
