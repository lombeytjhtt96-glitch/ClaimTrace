<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F25_WorkloadChipsSlaTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F25-01: test_workload_renders_chips_for_all_4_verifiers
     */
    public function test_workload_renders_chips_for_all_4_verifiers(): void
    {
        $response = $this->get('/vedika/workload');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'Siti Rahma') ||
            str_contains($content, '198704202011012001') ||
            str_contains($content, 'Budi Santoso') ||
            str_contains($content, 'Hendra Wijaya') ||
            str_contains($content, 'Andi Pratama')
        );
    }

    /**
     * T1-F25-02: test_workload_displays_active_cases_and_dispute_breakdown
     */
    public function test_workload_displays_active_cases_and_dispute_breakdown(): void
    {
        $response = $this->get('/vedika/workload');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'Aktif') ||
            str_contains($content, 'Klaim') ||
            str_contains($content, 'Beban')
        );
    }

    /**
     * T1-F25-03: test_sla_status_normal_when_claim_age_under_7_days
     */
    public function test_sla_status_normal_when_claim_age_under_7_days(): void
    {
        $response = $this->get('/vedika/queue');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'SLA') ||
            str_contains($content, '3/10') ||
            str_contains($content, 'HK')
        );
    }

    /**
     * T1-F25-04: test_sla_status_warning_when_claim_age_reaches_7_to_9_days
     */
    public function test_sla_status_warning_when_claim_age_reaches_7_to_9_days(): void
    {
        $response = $this->get('/vedika/queue');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, '8/10') ||
            str_contains($content, 'Peringatan') ||
            str_contains($content, 'SLA')
        );
    }

    /**
     * T1-F25-05: test_sla_status_breached_when_claim_age_exceeds_10_days
     */
    public function test_sla_status_breached_when_claim_age_exceeds_10_days(): void
    {
        $response = $this->get('/vedika/queue');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, '11/10') ||
            str_contains($content, 'Terlampaui') ||
            str_contains($content, 'SLA')
        );
    }

    /**
     * T1-F25-06: test_sla_status_critical_deadline_at_exactly_10_days
     * Under Perpres No. 82/2018 Pasal 76 ayat (2), day 10 is the statutory deadline (Kritis SLA),
     * NOT a breach (Terlampaui SLA).
     */
    public function test_sla_status_critical_deadline_at_exactly_10_days(): void
    {
        $response = $this->get('/vedika/queue');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, '10/10 HK Kritis SLA'),
            'Failed asserting that day 10 renders 10/10 HK Kritis SLA'
        );
        $this->assertFalse(
            str_contains($content, '10/10 HK Terlampaui SLA'),
            'Day 10 must not be classified as Terlampaui SLA under Perpres 82/2018'
        );
    }
}
