<?php

namespace Tests\Feature;

use App\Services\ZeroPhiMasker;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AuthRbacTest extends TestCase
{
    /* =========================================================================
     * SECTION 1: AUTHENTICATION & SSO NIP LOGIN (4 ROLES)
     * ========================================================================= */

    /**
     * Test 01: Login page renders with BPJS Kesehatan enterprise branding and zero emojis.
     */
    public function test_login_page_renders_with_bpjs_branding_and_zero_emojis(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);

        $content = $response->getContent();

        // Card login testid dan elemen verifikator
        $this->assertStringContainsString('data-testid="login-card"', $content);
        $this->assertStringContainsString('198704202011012001', $content); // dr. Siti Rahma
        $this->assertStringContainsString('199208152015031002', $content); // Budi Santoso
        $this->assertStringContainsString('198501012010011001', $content); // Hendra Wijaya
        $this->assertStringContainsString('199003152018011005', $content); // dr. Andi Pratama

        // Zero Emojis enforcement across rendered view
        $this->assertEquals(0, preg_match('/[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', $content));
    }

    /**
     * Test 02: Login successful as Verifikator Medis Senior (dr. Siti Rahma).
     */
    public function test_login_successful_with_verifikator_medis_senior(): void
    {
        $response = $this->post('/login', [
            'identifier' => '198704202011012001',
            'password' => 'Password123!',
            'captcha_input' => 'TEST',
            'captcha_code' => 'TEST',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect('/cockpit');

        $this->assertEquals('198704202011012001', session('user.nip'));
        $this->assertEquals('Verifikator Medis Senior', session('user.role'));
        $this->assertContains('ADJUDICATE', session('user.allowedRoles'));
        $this->assertContains('READ', session('user.allowedRoles'));
        $this->assertNotNull(session('user.token'));
    }

    /**
     * Test 03: Login successful as Analis Forensik Anti-Fraud (Budi Santoso).
     */
    public function test_login_successful_with_analis_forensik_anti_fraud(): void
    {
        $response = $this->post('/login', [
            'identifier' => '199208152015031002',
            'password' => 'Password123!',
            'captcha_input' => 'TEST',
            'captcha_code' => 'TEST',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect('/cockpit');

        $this->assertEquals('199208152015031002', session('user.nip'));
        $this->assertStringContainsString('Analis Forensik', session('user.role'));
        $this->assertContains('READ', session('user.allowedRoles'));
        $this->assertNotContains('ADJUDICATE', session('user.allowedRoles'));
    }

    /**
     * Test 04: Login successful as Administrator Kebijakan (Hendra Wijaya).
     */
    public function test_login_successful_with_administrator_kebijakan(): void
    {
        $response = $this->post('/login', [
            'identifier' => '198501012010011001',
            'password' => 'Password123!',
            'captcha_input' => 'TEST',
            'captcha_code' => 'TEST',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect('/cockpit');

        $this->assertEquals('198501012010011001', session('user.nip'));
        $this->assertEquals('Administrator Kebijakan', session('user.role'));
        $this->assertContains('ADMIN', session('user.allowedRoles'));
        $this->assertContains('ADJUDICATE', session('user.allowedRoles'));
    }

    /**
     * Test 05: Login successful as Auditor Read-Only (dr. Andi Pratama).
     */
    public function test_login_successful_with_auditor_read_only(): void
    {
        $response = $this->post('/login', [
            'identifier' => '199003152018011005',
            'password' => 'Password123!',
            'captcha_input' => 'TEST',
            'captcha_code' => 'TEST',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect('/cockpit');

        $this->assertEquals('199003152018011005', session('user.nip'));
        $this->assertEquals('Auditor Pengawasan (Read-Only)', session('user.role'));
        $this->assertContains('READ', session('user.allowedRoles'));
        $this->assertNotContains('ADJUDICATE', session('user.allowedRoles'));
    }

    /**
     * Test 06: Login rejected with wrong password.
     */
    public function test_login_rejected_with_invalid_password(): void
    {
        $response = $this->post('/login', [
            'identifier' => '198704202011012001',
            'password' => 'WrongPassword123!',
            'captcha_input' => 'TEST',
            'captcha_code' => 'TEST',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect('/login');
        $response->assertSessionHasErrors();
        $this->assertNull(session('user'));
    }

    /**
     * Test 07: Login rejected with unregistered NIP.
     */
    public function test_login_rejected_with_unregistered_nip(): void
    {
        $response = $this->post('/login', [
            'identifier' => '999999999999999999',
            'password' => 'Password123!',
            'captcha_input' => 'TEST',
            'captcha_code' => 'TEST',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect('/login');
        $response->assertSessionHasErrors();
        $this->assertNull(session('user'));
    }

    /**
     * Test 08: Login rejected with invalid NIP length (must be 18 digits).
     */
    public function test_login_rejected_with_invalid_nip_length(): void
    {
        $response = $this->post('/login', [
            'identifier' => '1987042020110120', // 16 digit instead of 18
            'password' => 'Password123!',
            'captcha_input' => 'TEST',
            'captcha_code' => 'TEST',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors('identifier');
    }

    /**
     * Test 09: Login fallback authentication works seamlessly when FastAPI is offline.
     */
    public function test_login_fallback_authentication_when_fastapi_offline(): void
    {
        Http::fake([
            'http://127.0.0.1:8000/api/v1/auth/login' => Http::response(null, 500),
        ]);

        $response = $this->post('/login', [
            'identifier' => '198704202011012001',
            'password' => 'Password123!',
            'captcha_input' => 'TEST',
            'captcha_code' => 'TEST',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect('/cockpit');
        $this->assertEquals('198704202011012001', session('user.nip'));
    }

    /**
     * Test 10: Logout clears session, destroys token, and redirects to /login.
     */
    public function test_logout_invalidates_session_and_clears_token(): void
    {
        $this->authenticateAsVerifier();
        $this->assertNotNull(session('user'));

        $response = $this->post('/logout');

        $response->assertStatus(302);
        $response->assertRedirect('/login');
        $this->assertNull(session('user'));
    }

    /* =========================================================================
     * SECTION 2: SESSION PERSISTENCE & UNAUTHENTICATED ACCESS
     * ========================================================================= */

    /**
     * Test 11: Unauthenticated request to protected route redirects to /login.
     */
    public function test_unauthenticated_request_redirected_to_login(): void
    {
        session()->forget('user');

        $response = $this->get('/audit/ledger');
        $response->assertStatus(302);
        $response->assertRedirect('/login');

        $r2 = $this->get('/');
        $r2->assertStatus(302);
        $r2->assertRedirect('/login');
    }

    /**
     * Test 12: Unauthenticated mutating request is denied.
     */
    public function test_unauthenticated_mutating_request_denied(): void
    {
        session()->forget('user');

        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
        ]);

        $this->assertTrue(in_array($response->status(), [302, 401, 403]));
    }

    /**
     * Test 13: Authenticated session persists across multiple requests.
     */
    public function test_authenticated_session_persists_across_multiple_requests(): void
    {
        $this->authenticateAsVerifier();

        $r1 = $this->get('/cockpit');
        $this->assertTrue(in_array($r1->status(), [200, 302]));

        $r2 = $this->get('/vedika');
        $this->assertTrue(in_array($r2->status(), [200, 302]));

        $this->assertEquals('198704202011012001', session('user.nip'));
    }

    /* =========================================================================
     * SECTION 3: FAIL-CLOSED RBAC C03.04 MUTATION TESTS
     * ========================================================================= */

    /**
     * Test 14: dr. Andi Pratama (Auditor Read-Only) receives 403 Forbidden on POST adjudication.
     */
    public function test_fail_closed_rbac_auditor_forbidden_from_post_adjudication(): void
    {
        $this->authenticateAsAuditor();

        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 5200000,
            'catatan' => 'Percobaan adjudikasi oleh auditor read-only.',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test 15: dr. Andi Pratama (Auditor Read-Only) receives 403 Forbidden on PUT adjudication.
     */
    public function test_fail_closed_rbac_auditor_forbidden_from_put_adjudication(): void
    {
        $this->authenticateAsAuditor();

        $response = $this->put('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'PENDING_KLARIFIKASI',
            'catatan' => 'Percobaan putusan via PUT.',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test 16: Budi Santoso (Analis Forensik) receives 403 Forbidden on adjudication mutation.
     */
    public function test_fail_closed_rbac_analyst_forbidden_from_adjudication(): void
    {
        $this->authenticateAsAnalyst();

        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'TIDAK_LAYAK_FRAUD',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test 17: Budi Santoso (Analis Forensik) receives 403 Forbidden on batch plotting.
     */
    public function test_fail_closed_rbac_analyst_forbidden_from_batch_plotting(): void
    {
        $this->authenticateAsAnalyst();

        $response = $this->post('/vedika/plotting', [
            'claim_ids' => ['CLM-2026-8801'],
            'verifier_nip' => '198704202011012001',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test 18: dr. Siti Rahma (Verifikator Medis Senior) is authorized for adjudication mutation.
     */
    public function test_rbac_verifikator_medis_authorized_for_adjudication(): void
    {
        $this->authenticateAsVerifier();

        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 5200000,
            'catatan' => 'Berkas lengkap dan sesuai kaidah.',
            'checklist' => ['sep_valid' => true],
        ]);

        $this->assertNotEquals(403, $response->status());
        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    /**
     * Test 19: Hendra Wijaya (Administrator Kebijakan) is authorized for adjudication and maintenance.
     */
    public function test_rbac_admin_authorized_for_adjudication_and_maintenance(): void
    {
        $this->authenticateAsAdmin();

        $r1 = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 5200000,
        ]);
        $this->assertNotEquals(403, $r1->status());

        $r2 = $this->post('/admin/cache/clear');
        $this->assertNotEquals(403, $r2->status());
    }

    /**
     * Test 20: dr. Andi Pratama (Auditor Read-Only) is authorized to read audit ledger.
     */
    public function test_rbac_auditor_authorized_to_read_audit_ledger(): void
    {
        $this->authenticateAsAuditor();

        $response = $this->get('/audit/ledger');
        $this->assertTrue(in_array($response->status(), [200, 302]));
        $this->assertNotEquals(403, $response->status());
    }

    /**
     * Test 21: RBAC fails closed (403) when session roles are empty or corrupted.
     */
    public function test_rbac_fails_closed_when_session_roles_corrupted_or_empty(): void
    {
        session([
            'user' => [
                'nip' => '198704202011012001',
                'name' => 'dr. Corrupted User',
                'role' => null,
                'allowedRoles' => [],
            ]
        ]);

        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test 22: RBAC prevents privilege escalation via injected request body attributes.
     */
    public function test_rbac_prevents_privilege_escalation_via_request_parameters(): void
    {
        $this->authenticateAsAuditor();

        // Injected request parameters trying to spoof Administrator privileges
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'role' => 'Administrator Kebijakan',
            'allowedRoles' => ['ADMIN', 'ADJUDICATE'],
            'decision' => 'LAYAK_BAYAR',
        ]);

        // Must still fail-closed with 403 Forbidden
        $response->assertStatus(403);
    }

    /* =========================================================================
     * SECTION 4: ZERO-PHI MASKING (UU PDP NO. 27/2022) UNIT & SERVICE TESTS
     * ========================================================================= */

    /**
     * Test 23: NIK 16-digit standard masking (first 4 visible, remaining 12 '*').
     */
    public function test_zero_phi_mask_nik_standard_16_digits(): void
    {
        $rawNik = '3201012345670001';
        $masked = ZeroPhiMasker::maskNik($rawNik);

        $this->assertSame('3201************', $masked);
        $this->assertEquals(16, strlen($masked));
        $this->assertStringNotContainsString('01234567', $masked);
        $this->assertStringNotContainsString('0001', $masked);
    }

    /**
     * Test 24: NIK with delimiter formatting is sanitized and masked properly.
     */
    public function test_zero_phi_mask_nik_formatted_with_delimiters(): void
    {
        $rawFormatted = '3201-0123-4567-0001';
        $masked = ZeroPhiMasker::maskNik($rawFormatted);

        $this->assertSame('3201************', $masked);
    }

    /**
     * Test 25: NIK suffix preservation mode (4 visible + 8 asterisks + 4 visible).
     */
    public function test_zero_phi_mask_nik_preserve_suffix_mode(): void
    {
        $rawNik = '3171012345670001';
        $masked = ZeroPhiMasker::maskNik($rawNik, true);

        $this->assertSame('3171********0001', $masked);
        $this->assertMatchesRegularExpression('/^\d{4}\*{8}\d{4}$/', $masked);
    }

    /**
     * Test 26: NIK edge cases: null, empty string, short digits, non-numeric.
     */
    public function test_zero_phi_mask_nik_edge_cases(): void
    {
        $this->assertSame('-', ZeroPhiMasker::maskNik(null));
        $this->assertSame('-', ZeroPhiMasker::maskNik(''));
        $this->assertSame('-', ZeroPhiMasker::maskNik('   '));
        $this->assertSame('-', ZeroPhiMasker::maskNik('ABCDEF'));

        // Short NIK (e.g. 8 digits)
        $short = ZeroPhiMasker::maskNik('32011234');
        $this->assertSame('3201****', $short);
    }

    /**
     * Test 27: BPJS Card 13-digit standard masking (first 6 visible, remaining 7 '*').
     */
    public function test_zero_phi_mask_bpjs_card_standard_13_digits(): void
    {
        $rawCard = '0001234567890';
        $masked = ZeroPhiMasker::maskBpjsCard($rawCard);

        $this->assertSame('000123*******', $masked);
        $this->assertEquals(13, strlen($masked));
        $this->assertStringStartsWith('000123', $masked);
        $this->assertStringNotContainsString('4567890', $masked);
    }

    /**
     * Test 28: BPJS Card edge cases: null, empty string, short digits.
     */
    public function test_zero_phi_mask_bpjs_card_edge_cases(): void
    {
        $this->assertSame('-', ZeroPhiMasker::maskBpjsCard(null));
        $this->assertSame('-', ZeroPhiMasker::maskBpjsCard(''));
        $this->assertSame('-', ZeroPhiMasker::maskBpjsCard('   '));

        // Short card (8 digits)
        $short = ZeroPhiMasker::maskBpjsCard('00012345');
        $this->assertSame('000123**', $short);
    }

    /**
     * Test 29: Nama Peserta masking preserves first letter of each word.
     */
    public function test_zero_phi_mask_name_preserves_first_letters_and_masks_remainder(): void
    {
        $rawName = 'Budi Santoso';
        $masked = ZeroPhiMasker::maskName($rawName);

        $this->assertSame('B*** S******', $masked);
        $this->assertStringNotContainsString('udi', $masked);
        $this->assertStringNotContainsString('antoso', $masked);
    }

    /**
     * Test 30: Nama Peserta with single-letter word, multiple spaces, and titles.
     */
    public function test_zero_phi_mask_name_edge_cases_single_char_and_spaces(): void
    {
        $this->assertSame('-', ZeroPhiMasker::maskName(null));
        $this->assertSame('-', ZeroPhiMasker::maskName(''));
        $this->assertSame('-', ZeroPhiMasker::maskName('   '));

        // Single character and irregular spaces
        $this->assertSame('A B***', ZeroPhiMasker::maskName('  A   Budi  '));

        // Three-word name
        $this->assertSame('S*** R**** K*****', ZeroPhiMasker::maskName('Siti Rahma Kusuma'));
    }

    /**
     * Test 31: Full claim array payload masking.
     */
    public function test_zero_phi_mask_claim_payload_sanitizes_all_phi_fields(): void
    {
        $rawClaim = [
            'id' => 'CLM-2026-9901',
            'nik' => '3201012345670001',
            'no_kartu' => '0001234567890',
            'nama_peserta' => 'Budi Santoso',
            'diagnosa' => 'K35.8',
            'tarif_fkl47' => 5200000,
        ];

        $maskedClaim = ZeroPhiMasker::maskClaim($rawClaim);

        // Raw values must be masked
        $this->assertSame('3201************', $maskedClaim['nik']);
        $this->assertSame('000123*******', $maskedClaim['no_kartu']);
        $this->assertSame('B*** S******', $maskedClaim['nama_peserta']);

        // Explicit masked attributes must be present
        $this->assertSame('3201************', $maskedClaim['patient_nik_masked']);
        $this->assertSame('000123*******', $maskedClaim['patient_card_masked']);
        $this->assertSame('B*** S******', $maskedClaim['patient_pseudo']);

        // Non-sensitive data remains intact
        $this->assertSame('CLM-2026-9901', $maskedClaim['id']);
        $this->assertSame('K35.8', $maskedClaim['diagnosa']);
        $this->assertSame(5200000, $maskedClaim['tarif_fkl47']);
    }

    /**
     * Test 32: Sanitizing clinical notes strips embedded NIK and BPJS card numbers.
     */
    public function test_zero_phi_sanitize_free_text_removes_embedded_nik_and_card(): void
    {
        $rawNote = 'Pasien dengan NIK 3171012345670001 dan No Kartu 0001234567890 butuh verifikasi.';
        $sanitized = ZeroPhiMasker::sanitizeFreeText($rawNote);

        $this->assertStringNotContainsString('3171012345670001', $sanitized);
        $this->assertStringNotContainsString('0001234567890', $sanitized);
        $this->assertStringContainsString('3171********0001', $sanitized);
        $this->assertStringContainsString('000123*******', $sanitized);
    }

    /* =========================================================================
     * SECTION 5: BLADE DIRECTIVE RENDERING (@maskPhi)
     * ========================================================================= */

    /**
     * Test 33: Blade directive @maskPhi renders NIK properly.
     */
    public function test_blade_directive_mask_phi_renders_nik(): void
    {
        $html = Blade::render("@maskPhi('3201012345670001', 'nik')");
        $this->assertSame('3201************', trim($html));
    }

    /**
     * Test 34: Blade directive @maskPhi renders BPJS card properly.
     */
    public function test_blade_directive_mask_phi_renders_bpjs_card(): void
    {
        $html = Blade::render("@maskPhi('0001234567890', 'bpjs_card')");
        $this->assertSame('000123*******', trim($html));
    }

    /**
     * Test 35: Blade directive @maskPhi renders participant name properly.
     */
    public function test_blade_directive_mask_phi_renders_name(): void
    {
        $html = Blade::render("@maskPhi('Budi Santoso', 'name')");
        $this->assertSame('B*** S******', trim($html));
    }

    /**
     * Test 36: Blade directive @maskPhi handles null and empty string gracefully.
     */
    public function test_blade_directive_mask_phi_handles_null_and_empty(): void
    {
        $htmlNull = Blade::render("@maskPhi(null, 'nik')");
        $this->assertSame('-', trim($htmlNull));

        $htmlEmpty = Blade::render("@maskPhi('', 'name')");
        $this->assertSame('-', trim($htmlEmpty));
    }

    /**
     * Test 37: Blade directive @maskPhi auto-detects identifier type when omitted.
     */
    public function test_blade_directive_mask_phi_auto_detection(): void
    {
        $htmlNik = Blade::render("@maskPhi('3201012345670001')");
        $this->assertSame('3201************', trim($htmlNik));

        $htmlCard = Blade::render("@maskPhi('0001234567890')");
        $this->assertSame('000123*******', trim($htmlCard));

        $htmlName = Blade::render("@maskPhi('Siti Rahma')");
        $this->assertSame('S*** R****', trim($htmlName));
    }

    /**
     * Test 38: Blade directive shorthand aliases @maskNik, @maskCard, @pseudonymize.
     */
    public function test_blade_directive_shorthand_aliases(): void
    {
        $nik = Blade::render("@maskNik('3201012345670001')");
        $this->assertSame('3201************', trim($nik));

        $card = Blade::render("@maskCard('0001234567890')");
        $this->assertSame('000123*******', trim($card));

        $pseudo = Blade::render("@pseudonymize('Hendra Wijaya')");
        $this->assertSame('H***** W*****', trim($pseudo));
    }
}
