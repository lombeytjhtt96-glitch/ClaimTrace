<?php

namespace Tests\Feature\Tier1;

use Tests\TestCase;

class F02_AuthSsoLoginTest extends TestCase
{
    /**
     * T1-F02-01: test_auth_login_successful_with_verifikator_medis_nip
     */
    public function test_auth_login_successful_with_verifikator_medis_nip(): void
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
    }

    /**
     * T1-F02-02: test_auth_login_successful_with_auditor_nip
     */
    public function test_auth_login_successful_with_auditor_nip(): void
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
    }

    /**
     * T1-F02-03: test_auth_login_rejected_with_invalid_password
     */
    public function test_auth_login_rejected_with_invalid_password(): void
    {
        $response = $this->post('/login', [
            'identifier' => '198704202011012001',
            'password' => 'WrongPassword!',
            'captcha_input' => 'TEST',
            'captcha_code' => 'TEST',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect('/login');
        $response->assertSessionHasErrors();
        $this->assertNull(session('user'));
    }

    /**
     * T1-F02-04: test_auth_login_rejected_with_unregistered_nip
     */
    public function test_auth_login_rejected_with_unregistered_nip(): void
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
     * T1-F02-05: test_auth_logout_clears_session_and_token
     */
    public function test_auth_logout_clears_session_and_token(): void
    {
        $this->authenticateAsVerifier();
        $this->assertNotNull(session('user'));

        $response = $this->post('/logout');
        $response->assertStatus(302);
        $response->assertRedirect('/login');
        $this->assertNull(session('user'));
    }
}
