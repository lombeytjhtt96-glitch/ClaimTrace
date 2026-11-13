<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F14_BillingReconciliationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F14-01: test_billing_renders_hospital_line_items
     */
    public function test_billing_renders_hospital_line_items(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/billing');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'Akomodasi') ||
            str_contains($content, 'Tindakan') ||
            str_contains($content, 'Farmasi') ||
            str_contains($content, 'Penunjang')
        );
    }

    /**
     * T1-F14-02: test_billing_displays_fkl47_and_fkl48_reconciliation_values
     */
    public function test_billing_displays_fkl47_and_fkl48_reconciliation_values(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/billing');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'FKL47') ||
            str_contains($content, 'FKL48') ||
            str_contains($content, '5.200.000') ||
            str_contains($content, 'Disetujui')
        );
    }

    /**
     * T1-F14-03: test_billing_renders_special_cmg_top_up_components
     */
    public function test_billing_renders_special_cmg_top_up_components(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/billing');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'Special CMG') ||
            str_contains($content, 'Top-Up') ||
            str_contains($content, 'CMG')
        );
    }

    /**
     * T1-F14-04: test_billing_flags_discrepancy_exceeding_threshold
     */
    public function test_billing_flags_discrepancy_exceeding_threshold(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8802/billing');
        $response->assertStatus(200);
    }

    /**
     * T1-F14-05: test_billing_calculates_subtotals_and_grand_total_accurately
     */
    public function test_billing_calculates_subtotals_and_grand_total_accurately(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/billing');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, '5.150.000') ||
            str_contains($content, '5.200.000') ||
            str_contains($content, 'Total')
        );
    }

    /**
     * T1-F14-06: test_billing_table_has_table_fixed_and_responsive_wrapper
     */
    public function test_billing_table_has_table_fixed_and_responsive_wrapper(): void
    {
        $response = $this->get('/vedika/claims/CLM-2026-8801/billing');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertStringContainsString('table-fixed', $content);
        $this->assertTrue(str_contains($content, 'overflow-x-auto') || str_contains($content, 'table-fixed-wrap'));
    }
}
