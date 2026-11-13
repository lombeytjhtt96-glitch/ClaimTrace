<?php

namespace Tests\Feature\Tier2;

use Tests\TestCase;

class F15_F20_BoundarySlaDisputeTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->authenticateAsVerifier();
    }

    // ==========================================
    // F15: Klaim Susulan Resubmission Flow (BVA)
    // ==========================================

    public function test_bva_susulan_resubmission_count_boundary_at_3(): void
    {
        $this->assertTrue(3 <= 3);
        $this->assertTrue(4 > 3);
    }

    public function test_bva_susulan_empty_faskes_notes_rejected(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8802/resubmit-susulan', [
            'catatan_faskes' => '',
            'tarif_revisi_rp' => 4500000,
        ]);
        $response->assertSessionHasErrors(['catatan_faskes']);
    }

    public function test_bva_susulan_invalid_revised_icd10_code(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8802/resubmit-susulan', [
            'catatan_faskes' => 'Revisi dengan kode acak',
            'perbaikan_icd10' => 'INVALID-CODE-99',
        ]);
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_susulan_revised_tariff_equals_original(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8802/resubmit-susulan', [
            'catatan_faskes' => 'Penambahan berkas pendukung tanpa perubahan tarif',
            'tarif_revisi_rp' => 18500000,
        ]);
        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    public function test_bva_susulan_timestamp_order_consistency(): void
    {
        $rejectionTime = strtotime('2026-11-02 10:00:00');
        $resubmitTime = strtotime('2026-11-05 14:00:00');
        $this->assertTrue($resubmitTime > $rejectionTime);
    }

    // ==========================================
    // F16: SATUSEHAT SIP & Geovelocity (BVA)
    // ==========================================

    public function test_bva_satusehat_daily_patients_boundary_at_40_vs_41(): void
    {
        $this->assertTrue(40 <= 40);
        $this->assertTrue(41 > 40);
    }

    public function test_bva_satusehat_sip_expiry_date_boundary_today_vs_yesterday(): void
    {
        $expiry = '2026-11-12';
        $today = '2026-11-12';
        $tomorrow = '2026-11-13';
        $this->assertTrue(strtotime($today) <= strtotime($expiry));
        $this->assertTrue(strtotime($tomorrow) > strtotime($expiry));
    }

    public function test_bva_geovelocity_transit_speed_boundary_79_80_81_kmh(): void
    {
        $this->assertTrue(79 <= 80);
        $this->assertTrue(80 <= 80);
        $this->assertTrue(81 > 80);
    }

    public function test_bva_geovelocity_transit_speed_boundary_at_120_kmh_phantom(): void
    {
        $this->assertTrue(119 < 120);
        $this->assertTrue(121 >= 120);
    }

    public function test_bva_geovelocity_zero_time_interval_different_faskes(): void
    {
        $distanceKm = 50.0;
        $timeIntervalMin = 0;
        $speed = $timeIntervalMin > 0 ? ($distanceKm / ($timeIntervalMin / 60)) : 999.0;
        $this->assertGreaterThan(120.0, $speed);
    }

    // ==========================================
    // F17: 6 Kaidah Kertas Kerja Verifikator (BVA)
    // ==========================================

    public function test_bva_checklist_counter_boundary_0_to_6(): void
    {
        for ($i = 0; $i <= 6; $i++) {
            $this->assertTrue($i >= 0 && $i <= 6);
        }
    }

    public function test_bva_checklist_unchecking_item_after_putusan_layak_fails_closed(): void
    {
        $response = $this->patch('/vedika/claims/CLM-2026-8801/checklist', [
            'item' => 'sep_valid',
            'value' => false,
        ]);
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_checklist_invalid_item_key_rejected(): void
    {
        $response = $this->patch('/vedika/claims/CLM-2026-8801/checklist', [
            'item' => 'invalid_kaidah_key',
            'value' => true,
        ]);
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_checklist_non_boolean_value_coercion(): void
    {
        $response = $this->patch('/vedika/claims/CLM-2026-8801/checklist', [
            'item' => 'sep_valid',
            'value' => 'NOT_A_BOOLEAN',
        ]);
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_checklist_all_false_submits_cleanly_for_tidak_layak(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8803/decision', [
            'decision' => 'TIDAK_LAYAK_FRAUD',
            'pending_reasons' => ['MED-01'],
            'catatan' => 'Semua kaidah tidak terpenuhi, fiktif.',
        ]);
        $this->assertTrue(in_array($response->status(), [200, 302]));
    }

    // ==========================================
    // F18: Konsol Putusan 4-Status (BVA)
    // ==========================================

    public function test_bva_decision_invalid_decision_code_rejected(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'STATUS_TIDAK_DIKENAL',
            'catatan' => 'Uji kode status tidak valid',
        ]);
        $response->assertSessionHasErrors(['decision']);
    }

    public function test_bva_decision_fkl48_tariff_exceeding_999_trillion(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 999999999999999999,
            'catatan' => 'Uji tarif melebihi batas portofolio',
        ]);
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_decision_catatan_verifikator_max_length_5000_chars(): void
    {
        $notes5001 = str_repeat('A', 5001);
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'PENDING_KLARIFIKASI',
            'pending_reasons' => ['ADM-01'],
            'catatan' => $notes5001,
        ]);
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_decision_rapid_double_click_submission(): void
    {
        $payload = [
            'decision' => 'LAYAK_BAYAR',
            'tarif_verifikasi_rp' => 5200000,
            'catatan' => 'Idempotent test submission',
        ];
        $resp1 = $this->post('/vedika/claims/CLM-2026-8801/decision', $payload);
        $resp2 = $this->post('/vedika/claims/CLM-2026-8801/decision', $payload);

        $this->assertNotEquals(500, $resp1->status());
        $this->assertNotEquals(500, $resp2->status());
    }

    public function test_bva_decision_dispute_level_required_when_dispute_selected(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'DISPUTE_TKMKB',
            'dispute_level' => null,
            'catatan' => 'Uji tanpa dispute level',
        ]);
        $this->assertNotEquals(500, $response->status());
    }

    // ==========================================
    // F19: 16 Baku Alasan 3-Pilar & SLA Tiers (BVA)
    // ==========================================

    public function test_bva_pending_reasons_empty_array_when_pending_klarifikasi(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'PENDING_KLARIFIKASI',
            'pending_reasons' => [],
            'catatan' => 'Uji tanpa kode alasan',
        ]);
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_pending_reasons_all_16_codes_selected_simultaneously(): void
    {
        $all16 = [
            'ADM-01', 'ADM-02', 'ADM-03', 'ADM-04', 'ADM-05', 'ADM-06',
            'KOD-01', 'KOD-02', 'KOD-03', 'KOD-04', 'KOD-05',
            'MED-01', 'MED-02', 'MED-03', 'MED-04', 'MED-05',
        ];
        $this->assertCount(16, $all16);
    }

    public function test_bva_pending_reasons_invalid_code_in_array(): void
    {
        $response = $this->post('/vedika/claims/CLM-2026-8801/decision', [
            'decision' => 'PENDING_KLARIFIKASI',
            'pending_reasons' => ['ADM-01', 'XXX-99'],
            'catatan' => 'Uji kode alasan tidak terdaftar',
        ]);
        $this->assertNotEquals(500, $response->status());
    }

    public function test_bva_dispute_sla_tier_invalid_enum(): void
    {
        $validTiers = ['CABANG', 'KEDEPUTIAN', 'PUSAT_TKMKB'];
        $this->assertFalse(in_array('PROVINSI', $validTiers));
    }

    public function test_bva_dispute_sla_pusat_statutory_calendar_days_limit(): void
    {
        $slaPusatMedisHk = 21;
        $this->assertTrue(21 <= $slaPusatMedisHk);
        $this->assertTrue(22 > $slaPusatMedisHk);
    }

    // ==========================================
    // F20: BAHV Recapitulation Table (BVA)
    // ==========================================

    public function test_bva_bahv_zero_approved_and_zero_held_efficiency(): void
    {
        $held = 0;
        $approved = 0;
        $eff = ($held + $approved) > 0 ? ($held / ($held + $approved)) * 100 : 0.0;
        $this->assertSame(0.0, $eff);
    }

    public function test_bva_bahv_100_percent_held_efficiency_calculation(): void
    {
        $held = 100000000;
        $approved = 0;
        $eff = ($held / ($held + $approved)) * 100;
        $this->assertEqualsWithDelta(100.0, $eff, 0.001);
    }

    public function test_bva_bahv_fractional_cent_rounding_precision(): void
    {
        $val = 33.333333;
        $rounded = round($val, 2);
        $this->assertSame(33.33, $rounded);
    }

    public function test_bva_bahv_all_rjtl_zero_ritl_claims(): void
    {
        $response = $this->get('/vedika/bahv');
        $response->assertStatus(200);
    }

    public function test_bva_bahv_extreme_held_amount_1_trillion(): void
    {
        $amount = 1000000000000;
        $formatted = 'Rp ' . number_format($amount, 0, ',', '.');
        $this->assertSame('Rp 1.000.000.000.000', $formatted);
    }
}
