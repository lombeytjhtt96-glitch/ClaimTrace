<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F12_DossierEvidenceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F12-01: test_dossier_renders_all_6_mandatory_documents
     */
    public function test_dossier_renders_all_6_mandatory_documents(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/dossier');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertStringContainsString('DOC-SEP', $content);
        $this->assertStringContainsString('DOC-RUJUKAN', $content);
        $this->assertStringContainsString('DOC-RESUME', $content);
        $this->assertStringContainsString('DOC-PENUNJANG', $content);
        $this->assertStringContainsString('DOC-BILLING', $content);
        $this->assertStringContainsString('DOC-FRISTA', $content);
    }

    /**
     * T1-F12-02: test_dossier_displays_document_hash_sha256
     */
    public function test_dossier_displays_document_hash_sha256(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/dossier');
        $response->assertStatus(200);

        // Check for 64-char hex string SHA-256
        $this->assertMatchesRegularExpression('/[a-f0-9]{64}/', $response->getContent());
    }

    /**
     * T1-F12-03: test_dossier_highlights_layer_1_cluster_and_repeat_metrics
     */
    public function test_dossier_highlights_layer_1_cluster_and_repeat_metrics(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/dossier');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'Layer 1') ||
            str_contains($content, 'Klaster') ||
            str_contains($content, 'FA0002.F1018') ||
            str_contains($content, 'Baseline')
        );
    }

    /**
     * T1-F12-04: test_dossier_highlights_layer_2_satusehat_and_workload
     */
    public function test_dossier_highlights_layer_2_satusehat_and_workload(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/dossier');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'SATUSEHAT') ||
            str_contains($content, 'SIP') ||
            str_contains($content, 'SDMK')
        );
    }

    /**
     * T1-F12-05: test_dossier_highlights_layer_3_mobile_jkn_attendance_telemetry
     */
    public function test_dossier_highlights_layer_3_mobile_jkn_attendance_telemetry(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/dossier');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'Mobile JKN') ||
            str_contains($content, 'Telemetri') ||
            str_contains($content, 'Kehadiran')
        );
    }
}
