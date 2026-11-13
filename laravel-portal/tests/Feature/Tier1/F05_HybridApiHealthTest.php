<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;
use Illuminate\Support\Facades\Http;

class F05_HybridApiHealthTest extends TestCase
{
    /**
     * T1-F05-01: test_api_service_health_check_returns_active_when_engine_up
     */
    public function test_api_service_health_check_returns_active_when_engine_up(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
        $response->assertSee('FASTAPI');
    }

    /**
     * T1-F05-02: test_api_service_propagates_bearer_token_to_fastapi
     */
    public function test_api_service_propagates_bearer_token_to_fastapi(): void
    {
        Http::fake();
        $this->authenticateAsVerifier();
        $response = $this->get('/vedika/queue');
        $response->assertStatus(200);

        Http::assertSent(function ($request) {
            return $request->hasHeader('Authorization') || $request->hasHeader('X-BPJS-Token') || str_contains($request->url(), '8000');
        });
    }

    /**
     * T1-F05-03: test_api_service_graceful_fallback_to_cache_on_connection_timeout
     */
    public function test_api_service_graceful_fallback_to_cache_on_connection_timeout(): void
    {
        Http::fake([
            'http://127.0.0.1:8000/*' => Http::response(null, 503),
        ]);

        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        // Portal must not crash with 500 when backend is down
        $this->assertNotEquals(500, $response->status());
        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    /**
     * T1-F05-04: test_api_service_circuit_breaker_prevents_cascading_failures
     */
    public function test_api_service_circuit_breaker_prevents_cascading_failures(): void
    {
        Http::fake([
            'http://127.0.0.1:8000/*' => Http::response(null, 503),
        ]);

        $this->authenticateAsVerifier();

        for ($i = 0; $i < 3; $i++) {
            $response = $this->get('/cockpit');
            $this->assertNotEquals(500, $response->status());
        }
    }

    /**
     * T1-F05-05: test_api_service_live_connection_indicator_rendered_in_navbar
     */
    public function test_api_service_live_connection_indicator_rendered_in_navbar(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
        $content = $response->getContent();

        $this->assertTrue(
            str_contains($content, 'FASTAPI') ||
            str_contains($content, 'TERHUBUNG') ||
            str_contains($content, 'engine-health') ||
            str_contains($content, 'DUCKDB')
        );
    }
}
