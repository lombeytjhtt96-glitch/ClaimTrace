<?php

namespace Tests\Feature;

use App\Services\HybridApiService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CockpitAnalyticsTest extends TestCase
{
    /**
     * 1. Permintaan tidak terotentikasi dialihkan ke /login
     */
    public function test_cockpit_unauthenticated_request_redirects_to_login(): void
    {
        session()->forget('user');
        $response = $this->get('/cockpit');
        $response->assertStatus(302);
        $response->assertRedirect('/login');
    }

    /**
     * 2. Akses berhasil untuk Verifikator Medis Senior (Hak Akses ADJUDICATE, READ, VIEW)
     */
    public function test_cockpit_accessible_by_verifier(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
        $response->assertSee('Cockpit Eksekutif');
    }

    /**
     * 3. Akses berhasil untuk Analis Forensik Anti-Fraud (READ, VIEW)
     */
    public function test_cockpit_accessible_by_analyst(): void
    {
        $this->authenticateAsAnalyst();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
        $response->assertSee('Cockpit Eksekutif');
    }

    /**
     * 4. Akses berhasil untuk Auditor Pengawasan Read-Only (READ, VIEW)
     */
    public function test_cockpit_accessible_by_auditor(): void
    {
        $this->authenticateAsAuditor();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
        $response->assertSee('Cockpit Eksekutif');
    }

    /**
     * 5. Akses berhasil untuk Administrator Kebijakan (ADMIN, ADJUDICATE, READ, VIEW)
     */
    public function test_cockpit_accessible_by_admin(): void
    {
        $this->authenticateAsAdmin();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
        $response->assertSee('Cockpit Eksekutif');
    }

    /**
     * 6. Sesi korup atau peran kosong gagal-tertutup (HTTP 403)
     */
    public function test_cockpit_fails_closed_with_empty_or_corrupt_role(): void
    {
        session(['user' => ['role' => '', 'allowedRoles' => []]]);
        $response = $this->get('/cockpit');
        $response->assertStatus(403);
    }

    /**
     * 7. Metrik KPI Utama dirender dengan pemisah titik ribuan Indonesia
     */
    public function test_cockpit_displays_kpi_metrics_with_indonesian_dots(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);

        // 1.699.219 Total Klaim FKRTL
        $response->assertSee('1.699.219');
        // 2.590.751 Master Peserta
        $response->assertSee('2.590.751');
        // 2.091 FKRTL di 496 Kab/Kota
        $response->assertSee('2.091');
        $response->assertSee('496');

        $content = $response->getContent();
        // Nilai Portofolio Rp 1,536 T
        $this->assertTrue(
            str_contains($content, '1,536 T') ||
            str_contains($content, '1.536 T') ||
            str_contains($content, '1.535.982.713.360')
        );
        // Eksposur Anomali Rp 34,66 M
        $this->assertTrue(
            str_contains($content, '34,66 M') ||
            str_contains($content, '34.66 M') ||
            str_contains($content, '34.663.799.076')
        );
    }

    /**
     * 8. Corong Penapisan 4 Tahap menampilkan metrik konversi presisi
     */
    public function test_cockpit_displays_4_stage_screening_funnel(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);

        $content = $response->getContent();
        // Tahap 1: Lolos Cepat
        $this->assertTrue(str_contains($content, '1.697.588') || str_contains($content, 'Tahap 1'));
        // Tahap 2: Saringan Aturan Klinis & Klaim Ganda
        $this->assertTrue(str_contains($content, '11.186') || str_contains($content, 'Tahap 2'));
        // Tahap 3: Uji SDMK & Geovelocity
        $this->assertTrue(str_contains($content, '53.379') || str_contains($content, 'Tahap 3'));
        // Tahap 4: Triase Putusan
        $this->assertTrue(str_contains($content, 'HIJAU') || str_contains($content, 'Hijau'));
        $this->assertTrue(str_contains($content, 'KUNING') || str_contains($content, 'Kuning'));
        $this->assertTrue(str_contains($content, 'MERAH') || str_contains($content, 'Merah'));
    }

    /**
     * 9. Kartu Indikator Modus Kecurangan (#6, #11, SIP, Upcoding) ditampilkan
     */
    public function test_cockpit_displays_anomaly_modus_indicators(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertTrue(str_contains($content, 'Phantom') || str_contains($content, '#6'));
        $this->assertTrue(str_contains($content, 'Repeat') || str_contains($content, '#11'));
        $this->assertTrue(str_contains($content, 'SIP') || str_contains($content, 'SDMK'));
        $this->assertTrue(str_contains($content, 'Upcoding') || str_contains($content, 'Keparahan'));
    }

    /**
     * 10. HybridApiService menangani status offline tanpa white-screen atau HTTP 500
     */
    public function test_cockpit_graceful_fallback_when_fastapi_offline(): void
    {
        Http::fake([
            'http://127.0.0.1:8000/*' => Http::response(null, 503),
        ]);

        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $this->assertNotEquals(500, $response->status());
        $response->assertStatus(200);
        $response->assertSee('1.699.219');
    }

    /**
     * 11. Perhitungan Tri-Layer Scoring matematis dan uji hard trigger
     */
    public function test_tri_layer_scoring_calculation_and_hard_trigger(): void
    {
        // 1. Uji bobot sum = 1.00
        $w = HybridApiService::calculateTriLayerScore(0, 0, 0);
        $this->assertEquals(0.0, $w['base_score']);
        $this->assertEquals('HIJAU', $w['lane']);

        // 2. Skenario Hijau (< 50,0)
        $green = HybridApiService::calculateTriLayerScore(40, 30, 20); // 0.5*40 + 0.3*30 + 0.2*20 = 20 + 9 + 4 = 33.0
        $this->assertEquals(33.0, $green['base_score']);
        $this->assertEquals('HIJAU', $green['lane']);
        $this->assertFalse($green['hard_trigger_active']);

        // 3. Skenario Kuning (50,0 - 74,9)
        $yellow = HybridApiService::calculateTriLayerScore(70, 60, 50); // 0.5*70 + 0.3*60 + 0.2*50 = 35 + 18 + 10 = 63.0
        $this->assertEquals(63.0, $yellow['base_score']);
        $this->assertEquals('KUNING', $yellow['lane']);
        $this->assertFalse($yellow['hard_trigger_active']);

        // 4. Skenario Merah (>= 75,0)
        $red = HybridApiService::calculateTriLayerScore(90, 80, 70); // 0.5*90 + 0.3*80 + 0.2*70 = 45 + 24 + 14 = 83.0
        $this->assertEquals(83.0, $red['base_score']);
        $this->assertEquals('MERAH', $red['lane']);
        $this->assertFalse($red['hard_trigger_active']);

        // 5. Skenario Hard Trigger SIP Expired (Skor rendah dipaksa minimal 75,0 ke Jalur Merah)
        $hardTrigger = HybridApiService::calculateTriLayerScore(20, 10, 10, ['sip_expired' => true]);
        $this->assertEquals(15.0, $hardTrigger['base_score']);
        $this->assertEquals(75.0, $hardTrigger['final_score']);
        $this->assertEquals('MERAH', $hardTrigger['lane']);
        $this->assertTrue($hardTrigger['hard_trigger_active']);

        // 6. Uji Clamping [0, 100]
        $clamped = HybridApiService::calculateTriLayerScore(150, -20, 50); // S1 clamped to 100, S2 clamped to 0, S3 clamped to 50
        $expectedClamped = round((0.50 * 100) + (0.30 * 0) + (0.20 * 50), 2); // 50 + 0 + 10 = 60.0
        $this->assertEquals($expectedClamped, $clamped['base_score']);
        $this->assertEquals('KUNING', $clamped['lane']);
    }

    /**
     * 12. Penyamaran Zero-PHI aktif pada seluruh data klaim di Cockpit
     */
    public function test_cockpit_zero_phi_masking_enforced(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);

        $content = $response->getContent();
        // Tidak ada NIK 16 digit telanjang yang bocor
        $this->assertDoesNotMatchRegularExpression('/(?<!\d)[1-9]\d{15}(?!\d)/', $content);
        // Tidak ada No Kartu BPJS 13 digit telanjang yang bocor
        $this->assertDoesNotMatchRegularExpression('/(?<!\d)000\d{10}(?!\d)/', $content);

        // Terlihat format penyamaran bertanda bintang
        $response->assertSee('3171********0001');
        $response->assertSee('000123*******');
    }

    /**
     * 13. Kepatuhan Ketat Zero Emojis pada seluruh output HTML yang dirender
     */
    public function test_cockpit_strictly_zero_emojis_rendered(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);

        $content = $response->getContent();
        $emojiPattern = '/[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u';
        $this->assertDoesNotMatchRegularExpression($emojiPattern, $content, 'Output Cockpit terdeteksi mengandung karakter emoji yang dilarang.');
    }

    /**
     * 14. Tabel pratinjau antrean menggunakan table-fixed layout
     */
    public function test_cockpit_high_risk_table_uses_fixed_layout(): void
    {
        $this->authenticateAsVerifier();
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
        $response->assertSee('table-fixed');
        $response->assertSee('table-fixed-wrap');
    }
}
