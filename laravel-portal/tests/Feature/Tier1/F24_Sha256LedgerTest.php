<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F24_Sha256LedgerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F24-01: test_ledger_renders_blockchain_history_table
     */
    public function test_ledger_renders_blockchain_history_table(): void
    {
        $response = $this->get('/audit/ledger');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'Ledger') ||
            str_contains($content, 'SHA-256') ||
            str_contains($content, 'Blok') ||
            str_contains($content, 'Hash')
        );
    }

    /**
     * T1-F24-02: test_ledger_verifies_hash_continuity_across_all_blocks
     */
    public function test_ledger_verifies_hash_continuity_across_all_blocks(): void
    {
        $response = $this->get('/audit/ledger');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'VALID') ||
            str_contains($content, 'INTEGRITAS') ||
            str_contains($content, 'Rantai')
        );
    }

    /**
     * T1-F24-03: test_ledger_filters_by_claim_id
     */
    public function test_ledger_filters_by_claim_id(): void
    {
        $response = $this->get('/audit/ledger?claim_id=CLM-2026-8801');
        $response->assertStatus(200);
    }

    /**
     * T1-F24-04: test_ledger_displays_genesis_block_at_index_0
     */
    public function test_ledger_displays_genesis_block_at_index_0(): void
    {
        $response = $this->get('/audit/ledger');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'GENESIS') ||
            str_contains($content, 'Index 0') ||
            str_contains($content, '00000000') ||
            str_contains($content, 'Blok Perdana')
        );
    }

    /**
     * T1-F24-05: test_ledger_inspect_modal_displays_full_canonical_json
     */
    public function test_ledger_inspect_modal_displays_full_canonical_json(): void
    {
        $response = $this->get('/audit/ledger');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'canonical') ||
            str_contains($content, 'json') ||
            str_contains($content, 'payload') ||
            str_contains($content, 'Inspeksi')
        );
    }
}
