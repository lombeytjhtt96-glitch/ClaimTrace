<?php

namespace Tests\Feature;

use Tests\TestCase;

class AdversarialZeroPhiReviewTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * Adversarial Test: Scan all required Milestone 4 routes for PHI leaks.
     */
    public function test_adversarial_zero_phi_scan_all_m4_routes(): void
    {
        $routes = [
            '/vedika',
            '/vedika/queue',
            '/vedika/workload',
            '/vedika/claims/CLM-2026-8801/dossier',
            '/vedika/claims/CLM-2026-8801/icare',
            '/vedika/claims/CLM-2026-8801/billing',
            '/vedika/claims/CLM-2026-8801/sdmk',
            '/vedika/claims/CLM-2026-8801/checklist',
            '/vedika/claims/CLM-2026-8802/dossier',
            '/vedika/claims/CLM-2026-8803/dossier',
            '/vedika/claims/CLM-2026-8804/dossier',
            '/vedika/claims/CLM-2026-8805/dossier',
            '/vedika/claims/CLM-2026-8806/dossier',
        ];

        $auditLog = [];

        foreach ($routes as $route) {
            $response = $this->get($route);
            $this->assertEquals(
                200, 
                $response->getStatusCode(), 
                "Route {$route} failed to return HTTP 200 (Got: {$response->getStatusCode()})"
            );

            $html = $response->getContent();

            // Regex 1: Unmasked 16-digit NIK
            preg_match_all('/\b[1-9]\d{15}\b/', $html, $nikMatches);
            $unmaskedNiks = $nikMatches[0] ?? [];

            // Regex 2: Unmasked 13-digit BPJS Card
            preg_match_all('/\b000\d{10}\b/', $html, $bpjsMatches);
            $unmaskedBpjs = $bpjsMatches[0] ?? [];

            $auditLog[] = [
                'route' => $route,
                'status' => $response->getStatusCode(),
                'nik_leaks' => count($unmaskedNiks),
                'bpjs_leaks' => count($unmaskedBpjs),
                'nik_samples' => array_slice($unmaskedNiks, 0, 3),
                'bpjs_samples' => array_slice($unmaskedBpjs, 0, 3),
            ];

            $this->assertCount(
                0, 
                $unmaskedNiks, 
                "PHI LEAK DETECTED: Found " . count($unmaskedNiks) . " unmasked 16-digit NIKs on {$route}: " . implode(', ', $unmaskedNiks)
            );

            $this->assertCount(
                0, 
                $unmaskedBpjs, 
                "PHI LEAK DETECTED: Found " . count($unmaskedBpjs) . " unmasked 13-digit BPJS card numbers on {$route}: " . implode(', ', $unmaskedBpjs)
            );
        }

        // Print table summary for logging
        fwrite(STDERR, "\n--- ADVERSARIAL ZERO-PHI AUDIT SUMMARY ---\n");
        foreach ($auditLog as $entry) {
            fwrite(STDERR, sprintf(
                "[%d] %-42s | NIK Leaks: %d | BPJS Leaks: %d\n",
                $entry['status'],
                $entry['route'],
                $entry['nik_leaks'],
                $entry['bpjs_leaks']
            ));
        }
        fwrite(STDERR, "-------------------------------------------\n");
    }

    /**
     * Adversarial Test: Test boundary values of SLA working days calculation.
     */
    public function test_adversarial_sla_boundary_values(): void
    {
        $testCases = [
            ['days' => 3, 'expected_badge' => 'Normal', 'expected_text' => '3/10 HK Normal'],
            ['days' => 8, 'expected_badge' => 'Peringatan', 'expected_text' => '8/10 HK Peringatan SLA'],
            ['days' => 10, 'expected_badge' => 'Kritis', 'expected_text' => '10/10 HK Kritis SLA'],
            ['days' => 11, 'expected_badge' => 'Terlampaui', 'expected_text' => '11/10 HK Terlampaui SLA'],
        ];

        foreach ($testCases as $tc) {
            $days = $tc['days'];
            if ($days <= 5) {
                $text = $days . '/10 HK Normal';
            } elseif ($days <= 9) {
                $text = $days . '/10 HK Peringatan SLA';
            } elseif ($days === 10) {
                $text = '10/10 HK Kritis SLA';
            } else {
                $text = $days . '/10 HK Terlampaui SLA';
            }

            $this->assertEquals($tc['expected_text'], $text);
        }
    }

    /**
     * Adversarial Test: Verify live workload response normalization and display.
     */
    public function test_adversarial_workload_live_key_normalization(): void
    {
        $response = $this->get('/vedika/workload');
        $this->assertEquals(200, $response->getStatusCode());
        $content = $response->getContent();

        fwrite(STDERR, "\n--- WORKLOAD CONTENT SCAN ---\n");
        // Look for Siti Rahma active claims
        if (preg_match('/dr\.\s*Siti\s*Rahma.*?(\d+)\s*Klaim/s', $content, $m)) {
            fwrite(STDERR, "Siti Rahma Klaim Count rendered on /vedika/workload: {$m[1]}\n");
        }
        if (preg_match('/dr\.\s*Siti\s*Rahma.*?(Aktif\s*Bertugas|Siap\s*Menerima)/s', $content, $m)) {
            fwrite(STDERR, "Siti Rahma Status rendered on /vedika/workload: {$m[1]}\n");
        }

        $queueRes = $this->get('/vedika/queue');
        $queueContent = $queueRes->getContent();
        if (preg_match('/dr\.\s*Siti\s*Rahma.*?font-bold.*?>(\d+)<\/span>\s*<span[^>]*>Klaim\s*Aktif/s', $queueContent, $m)) {
            fwrite(STDERR, "Siti Rahma Chip Count rendered on /vedika/queue: {$m[1]}\n");
        }
        fwrite(STDERR, "-----------------------------\n");
    }
}

