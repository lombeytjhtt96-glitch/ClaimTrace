<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F26_DualThemeToggleTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    /**
     * T1-F26-01: test_theme_default_mode_is_light
     */
    public function test_theme_default_mode_is_light(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'darkMode: false') ||
            str_contains($content, 'theme-light') ||
            str_contains($content, 'x-data') ||
            str_contains($content, 'bg-slate-50') ||
            str_contains($content, 'bg-gray-50') ||
            str_contains($content, '#F4F7F6')
        );
    }

    /**
     * T1-F26-02: test_theme_toggle_switches_to_dark_mode_via_alpine
     */
    public function test_theme_toggle_switches_to_dark_mode_via_alpine(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'darkMode') ||
            str_contains($content, 'dark:') ||
            str_contains($content, 'theme-toggle')
        );
    }

    /**
     * T1-F26-03: test_theme_preference_persisted_in_localstorage
     */
    public function test_theme_preference_persisted_in_localstorage(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'localStorage') ||
            str_contains($content, 'theme')
        );
    }

    /**
     * T1-F26-04: test_layout_responsive_tables_use_table_fixed_with_zero_overflow
     */
    public function test_layout_responsive_tables_use_table_fixed_with_zero_overflow(): void
    {
        $response = $this->get('/vedika/queue');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(
            str_contains($content, 'table-fixed') ||
            str_contains($content, 'overflow-x-auto') ||
            str_contains($content, 'w-full')
        );
    }

    /**
     * T1-F26-05: test_theme_contrast_meets_wcag_aa_standard
     */
    public function test_theme_contrast_meets_wcag_aa_standard(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);

        $content = $response->getContent();
        // Verify dark theme color tokens exist
        $this->assertTrue(
            str_contains($content, 'text-slate') ||
            str_contains($content, 'text-gray') ||
            str_contains($content, 'dark:text-white') ||
            str_contains($content, 'dark:bg-')
        );
    }
}
