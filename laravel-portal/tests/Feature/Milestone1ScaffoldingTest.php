<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class Milestone1ScaffoldingTest extends TestCase
{
    /**
     * Test FastAPI base URL is configured in services.
     */
    public function test_fastapi_service_configured(): void
    {
        $baseUrl = config('services.fastapi.base_url');
        $this->assertEquals('http://127.0.0.1:8000', $baseUrl);
    }

    /**
     * Test SQLite database connection and core schema tables.
     */
    public function test_sqlite_database_tables_exist(): void
    {
        $this->assertEquals('sqlite', DB::connection()->getDriverName());
        $this->assertTrue(Schema::hasTable('users'));
        $this->assertTrue(Schema::hasTable('sessions'));
        $this->assertTrue(Schema::hasTable('cache'));
        $this->assertTrue(Schema::hasTable('jobs'));
        $this->assertTrue(Schema::hasTable('migrations'));
    }

    /**
     * Test Application Timezone and Locale.
     */
    public function test_regional_timezone_and_locale(): void
    {
        $this->assertEquals('Asia/Jakarta', config('app.timezone'));
        $this->assertEquals('id', config('app.locale'));
    }

    /**
     * Test Cockpit view renders master layout with enterprise requirements.
     */
    public function test_cockpit_view_renders_master_layout(): void
    {
        $response = $this->authenticateAsVerifier()->get('/cockpit');
        $response->assertStatus(200);

        // Header Brand & Emblem
        $response->assertSee('ClaimTrace JKN');
        $response->assertSee('VEDIKA');
        $response->assertSee('Sistem Pendukung Keputusan Deteksi Anomali Klaim');

        // WIB Clock & Alpine integration
        $response->assertSee('Asia/Jakarta');
        $response->assertSee('WIB');

        // FastAPI Health Indicator
        $response->assertSee('FastAPI: Terhubung (8000)');

        // Sidebar Navigation Links
        $response->assertSee('Cockpit Eksekutif');
        $response->assertSee('VEDIKA Antrean FPK');
        $response->assertSee('Bedah Dossier Digital');
        $response->assertSee('Konsol Putusan 4-Status');
        $response->assertSee('Laporan dan BAHV Resmi');
        $response->assertSee('Audit Ledger SHA-256');
        $response->assertSee('Pengaturan Sistem');

        // Anti-overflow classes
        $response->assertSee('overflow-x-hidden');
        $response->assertSee('table-fixed');
    }

    /**
     * Test Vite production manifest exists with compiled CSS and JS.
     */
    public function test_vite_manifest_exists(): void
    {
        $manifestPath = public_path('build/manifest.json');
        $this->assertFileExists($manifestPath);

        $manifest = json_decode(file_get_contents($manifestPath), true);
        $this->assertArrayHasKey('resources/css/app.css', $manifest);
        $this->assertArrayHasKey('resources/js/app.js', $manifest);
    }

    /**
     * Test Zero-Emoji compliance in Blade layout.
     */
    public function test_zero_emoji_discipline_in_blade_layout(): void
    {
        $layoutContent = file_get_contents(resource_path('views/layouts/app.blade.php'));
        $welcomeContent = file_get_contents(resource_path('views/welcome.blade.php'));

        $emojiRegex = '/[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u';

        $this->assertDoesNotMatchRegularExpression($emojiRegex, $layoutContent, 'Layout contains emojis');
        $this->assertDoesNotMatchRegularExpression($emojiRegex, $welcomeContent, 'Welcome view contains emojis');
    }
}
