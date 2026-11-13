<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class F01_RuntimeBootstrapTest extends TestCase
{
    /**
     * T1-F01-01: test_bootstrap_health_endpoint_returns_ok
     */
    public function test_bootstrap_health_endpoint_returns_ok(): void
    {
        $response = $this->get('/health');
        $response->assertStatus(200);
        $response->assertJsonStructure(['status', 'app']);
    }

    /**
     * T1-F01-02: test_bootstrap_landing_redirects_to_login_when_unauthenticated
     */
    public function test_bootstrap_landing_redirects_to_login_when_unauthenticated(): void
    {
        $response = $this->get('/');
        $response->assertStatus(302);
        $response->assertRedirect('/login');
    }

    /**
     * T1-F01-03: test_bootstrap_landing_redirects_to_cockpit_when_authenticated
     */
    public function test_bootstrap_landing_redirects_to_cockpit_when_authenticated(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/');
        $response->assertStatus(302);
        $response->assertRedirect('/cockpit');
    }

    /**
     * T1-F01-04: test_bootstrap_database_sqlite_connection_active
     */
    public function test_bootstrap_database_sqlite_connection_active(): void
    {
        $pdo = DB::connection()->getPdo();
        $this->assertNotNull($pdo);
        $this->assertSame('sqlite', DB::connection()->getDriverName());
    }

    /**
     * T1-F01-05: test_bootstrap_app_configuration_locale_and_timezone
     */
    public function test_bootstrap_app_configuration_locale_and_timezone(): void
    {
        $this->assertSame('Asia/Jakarta', config('app.timezone'));
        $this->assertSame('id', config('app.locale'));
    }
}
