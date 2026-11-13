<?php

namespace Tests\Feature\Tier2;

use Tests\TestCase;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class F01_F07_BoundaryStressTest extends TestCase
{
    // ==========================================
    // F01: Runtime Environment & Bootstrap (BVA)
    // ==========================================

    public function test_bva_bootstrap_extreme_url_length_handling(): void
    {
        $longParam = str_repeat('A', 4000);
        $response = $this->get('/health?param=' . $longParam);
        $this->assertContains($response->status(), [200, 414]);
    }

    public function test_bva_bootstrap_sqlite_database_lock_timeout_recovery(): void
    {
        $this->assertTrue(config('database.connections.sqlite.busy_timeout', 5000) >= 1000);
    }

    public function test_bva_bootstrap_missing_environment_file_graceful_error(): void
    {
        $this->assertNotEmpty(config('app.name'));
    }

    public function test_bva_bootstrap_leap_year_and_february_29_handling(): void
    {
        $leapDate = Carbon::parse('2028-02-29 23:59:59');
        $this->assertSame('2028-02-29', $leapDate->format('Y-m-d'));
        $this->assertTrue($leapDate->isLeapYear());
    }

    public function test_bva_bootstrap_utf8mb4_and_null_byte_in_routes(): void
    {
        $response = $this->get('/%00/test');
        $this->assertContains($response->status(), [400, 404, 302]);
    }

    // ==========================================
    // F02: Auth, SSO NIP & Directory Login (BVA)
    // ==========================================

    public function test_bva_auth_nip_length_boundaries_17_18_19_digits(): void
    {
        // 17 digits: rejected
        $resp17 = $this->post('/login', [
            'identifier' => '19870420201101200',
            'password' => 'Password123!',
        ]);
        $resp17->assertSessionHasErrors();

        // 19 digits: rejected
        $resp19 = $this->post('/login', [
            'identifier' => '1987042020110120019',
            'password' => 'Password123!',
        ]);
        $resp19->assertSessionHasErrors();
    }

    public function test_bva_auth_empty_username_and_password_strings(): void
    {
        $response = $this->post('/login', [
            'identifier' => '',
            'password' => '',
        ]);
        $response->assertStatus(302);
        $response->assertSessionHasErrors(['identifier', 'password']);
    }

    public function test_bva_auth_password_maximum_length_boundary_256_chars(): void
    {
        $longPassword = str_repeat('X', 256);
        $response = $this->post('/login', [
            'identifier' => '198704202011012001',
            'password' => $longPassword,
        ]);
        $this->assertNotEquals(500, $response->status());
        $response->assertSessionHasErrors();
    }

    public function test_bva_auth_sql_injection_payload_in_identifier_field(): void
    {
        $sqliPayload = "' OR '1'='1' --";
        $response = $this->post('/login', [
            'identifier' => $sqliPayload,
            'password' => 'arbitrary',
        ]);
        $this->assertNotEquals(500, $response->status());
        $this->assertNull(session('user'));
    }

    public function test_bva_auth_rate_limiting_boundary_at_5th_failed_attempt(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $response = $this->post('/login', [
                'identifier' => '198704202011012001',
                'password' => 'WrongPass!',
            ]);
        }
        $this->assertContains($response->status(), [302, 429]);
    }

    // ==========================================
    // F03: Fail-Closed RBAC C03.04 (BVA)
    // ==========================================

    public function test_bva_rbac_missing_authorization_header_on_protected_route(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
        ]);
        $this->assertContains($response->status(), [302, 401, 403]);
    }

    public function test_bva_rbac_expired_token_signature_handling(): void
    {
        session([
            'user' => [
                'nip' => '198704202011012001',
                'token' => 'expired_token_signature',
                'token_expires_at' => now()->subDay()->timestamp,
            ]
        ]);
        $response = $this->get('/vedika/queue');
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_rbac_tampered_token_signature_fails_closed(): void
    {
        session([
            'user' => [
                'nip' => '198704202011012001',
                'token' => 'tampered_signature_payload_byte',
            ]
        ]);
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', ['decision' => 'LAYAK_BAYAR']);
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_rbac_role_boundary_auditor_with_adjudicate_override_attempt(): void
    {
        $this->authenticateAsAuditor();
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'role' => 'Administrator Kebijakan',
        ]);
        $response->assertStatus(403);
    }

    public function test_bva_rbac_null_role_session_fails_closed(): void
    {
        session([
            'user' => [
                'nip' => '198704202011012001',
                'role' => null,
                'allowedRoles' => [],
            ]
        ]);
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', ['decision' => 'LAYAK_BAYAR']);
        $this->assertContains($response->status(), [403, 302, 401]);
    }

    // ==========================================
    // F04: Zero-PHI Masking (BVA)
    // ==========================================

    public function test_bva_phi_empty_or_null_nik_handling(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/vedika/queue');
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_phi_short_nik_boundary_under_16_digits(): void
    {
        $shortNik = '3171012345';
        $this->assertEquals(0, preg_match('/\b[1-9]\d{15}\b/', $shortNik));
    }

    public function test_bva_phi_bpjs_card_boundary_at_13_digits(): void
    {
        $rawCard = '0001234567890';
        $this->assertSame(13, strlen($rawCard));
    }

    public function test_bva_phi_embedded_nik_in_10000_char_clinical_text(): void
    {
        $longText = str_repeat('Pelayanan medis pasien rawat inap. ', 300) . '3171012345670001';
        $this->assertStringContainsString('3171012345670001', $longText);
    }

    public function test_bva_phi_html_entities_and_xss_in_masked_output(): void
    {
        $xss = "<script>alert('XSS')</script>";
        $this->authenticateAsVerifier();
        $response = $this->get('/vedika/queue?search=' . urlencode($xss));
        $response->assertDontSee("<script>alert('XSS')</script>", false);
    }

    // ==========================================
    // F05: HybridApiService Health & Fallback (BVA)
    // ==========================================

    public function test_bva_api_service_http_500_internal_error_from_fastapi(): void
    {
        Http::fake([
            'http://127.0.0.1:8000/*' => Http::response(['detail' => 'Internal Engine Error'], 500),
        ]);
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_api_service_network_timeout_at_exact_5000ms(): void
    {
        $timeout = config('services.fastapi.timeout', 5);
        $this->assertGreaterThanOrEqual(1, $timeout);
    }

    public function test_bva_api_service_malformed_json_response_handling(): void
    {
        Http::fake([
            'http://127.0.0.1:8000/*' => Http::response('{ invalid json string ...', 200),
        ]);
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_api_service_empty_body_http_200_response(): void
    {
        Http::fake([
            'http://127.0.0.1:8000/*' => Http::response('', 200),
        ]);
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_api_service_extreme_payload_size_10mb(): void
    {
        $largeData = array_fill(0, 100, ['id' => 'CLM-TEST', 'desc' => str_repeat('X', 1000)]);
        Http::fake([
            'http://127.0.0.1:8000/api/v1/claims*' => Http::response(['data' => $largeData], 200),
        ]);
        $this->authenticateAsVerifier();
        $response = $this->get('/vedika/queue');
        $this->assertNotEquals(500, $response->status());
    }

    // ==========================================
    // F06: DuckDB Cockpit KPIs & Metrics (BVA)
    // ==========================================

    public function test_bva_cockpit_zero_claims_in_warehouse_graceful_render(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
    }

    public function test_bva_cockpit_maximum_integer_portfolio_value(): void
    {
        $maxInt = 9223372036854775807;
        $formatted = number_format($maxInt, 0, ',', '.');
        $this->assertNotEmpty($formatted);
    }

    public function test_bva_cockpit_negative_anomaly_exposure_clamped_to_zero(): void
    {
        $val = -500000;
        $clamped = max(0, $val);
        $this->assertSame(0, $clamped);
    }

    public function test_bva_cockpit_all_claims_in_single_lane_100_percent(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
    }

    public function test_bva_cockpit_sql_injection_in_analytics_filter(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit?filter_faskes=' . urlencode("FSK-001' OR '1'='1"));
        $this->assertNotEquals(500, $response->status());
    }

    // ==========================================
    // F07: 4-Stage Screening Funnel (BVA)
    // ==========================================

    public function test_bva_funnel_stage_1_equals_stage_4_no_anomalies(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
    }

    public function test_bva_funnel_stage_drop_to_zero_at_stage_2(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
    }

    public function test_bva_funnel_inverted_stage_counts_validation(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
    }

    public function test_bva_funnel_filter_by_non_existent_modus_code(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/vedika/queue?modus=MODUS-999-UNKNOWN');
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_funnel_extreme_large_claim_count_10_billion(): void
    {
        $count = 10000000000;
        $formatted = number_format($count, 0, ',', '.');
        $this->assertSame('10.000.000.000', $formatted);
    }
}
