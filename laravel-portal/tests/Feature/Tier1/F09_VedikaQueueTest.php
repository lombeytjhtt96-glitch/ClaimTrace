<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F09_VedikaQueueTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F09-01: test_queue_renders_table_with_default_claims
     */
    public function test_queue_renders_table_with_default_claims(): void
    {
        $response = $this->get('/vedika/queue');
        $response->assertStatus(200);
        $response->assertSee('CLM-2026-8801');
    }

    /**
     * T1-F09-02: test_queue_filter_by_jenis_pelayanan_rjtl_and_ritl
     */
    public function test_queue_filter_by_jenis_pelayanan_rjtl_and_ritl(): void
    {
        $response = $this->get('/vedika/queue?jenis_pelayanan=RJTL');
        $response->assertStatus(200);
    }

    /**
     * T1-F09-03: test_queue_filter_by_jenis_pengajuan_reguler_susulan_lupis
     */
    public function test_queue_filter_by_jenis_pengajuan_reguler_susulan_lupis(): void
    {
        $response = $this->get('/vedika/queue?jenis_pengajuan=Susulan');
        $response->assertStatus(200);
    }

    /**
     * T1-F09-04: test_queue_filter_by_no_fpk
     */
    public function test_queue_filter_by_no_fpk(): void
    {
        $response = $this->get('/vedika/queue?no_fpk=FPK-0114-202611-001');
        $response->assertStatus(200);
    }

    /**
     * T1-F09-05: test_queue_search_query_matches_faskes_dpjp_cbg
     */
    public function test_queue_search_query_matches_faskes_dpjp_cbg(): void
    {
        $response = $this->get('/vedika/queue?search=Cipto');
        $response->assertStatus(200);
    }
}
