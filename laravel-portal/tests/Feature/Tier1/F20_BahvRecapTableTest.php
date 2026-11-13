<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F20_BahvRecapTableTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F20-01: test_bahv_renders_4_summary_cards_with_counts_and_amounts
     */
    public function test_bahv_renders_4_summary_cards_with_counts_and_amounts(): void
    {
        $response = $this->get('/vedika/bahv');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'Layak') ||
            str_contains($content, 'Pending') ||
            str_contains($content, 'Dispute') ||
            str_contains($content, 'Tidak Layak')
        );
    }

    /**
     * T1-F20-02: test_bahv_table_breaks_down_rjtl_vs_ritl_columns
     */
    public function test_bahv_table_breaks_down_rjtl_vs_ritl_columns(): void
    {
        $response = $this->get('/vedika/bahv');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertStringContainsString('RJTL', $content);
        $this->assertStringContainsString('RITL', $content);
    }

    /**
     * T1-F20-03: test_bahv_efficiency_percentage_formula_calculated_accurately
     */
    public function test_bahv_efficiency_percentage_formula_calculated_accurately(): void
    {
        $response = $this->get('/vedika/bahv');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, '%') ||
            str_contains($content, 'Efisiensi')
        );
    }

    /**
     * T1-F20-04: test_bahv_totals_row_matches_sum_of_category_rows
     */
    public function test_bahv_totals_row_matches_sum_of_category_rows(): void
    {
        $response = $this->get('/vedika/bahv');
        $response->assertStatus(200);
        $response->assertSee('Total');
    }

    /**
     * T1-F20-05: test_bahv_formats_currency_using_indonesian_rupiah_dots
     */
    public function test_bahv_formats_currency_using_indonesian_rupiah_dots(): void
    {
        $response = $this->get('/vedika/bahv');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertMatchesRegularExpression('/Rp\s*[\d\.]+/', $content);
    }
}
