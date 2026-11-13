<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class BahvArithmeticTest extends TestCase
{
    /**
     * Memvalidasi formula aritmatika rekonsiliasi total klaim: Diajukan = Disetujui + Tertahan.
     */
    public function test_reconciliation_identity_claimed_equals_approved_plus_held(): void
    {
        $approvedFkl48 = 5200000;
        $heldCorrection = 18500000;
        $totalClaimed = $approvedFkl48 + $heldCorrection; // 23700000

        $this->assertSame(23700000, $totalClaimed);
        $this->assertSame($heldCorrection, $totalClaimed - $approvedFkl48);
    }

    /**
     * Memvalidasi perhitungan persentase efisiensi pencegahan fraud secara presisi.
     */
    public function test_efficiency_percentage_calculation(): void
    {
        $approved = 80000000;
        $held = 20000000;
        $total = $approved + $held; // 100000000

        // Efisiensi = (20.000.000 / 100.000.000) * 100 = 20.00%
        $efficiency = $this->calculateEfficiency($held, $approved);
        $this->assertEqualsWithDelta(20.00, $efficiency, 0.001);
    }

    /**
     * Memvalidasi batas ekstrem: Total Diajukan 0 Rupiah menghasilkan efisiensi 0,00% tanpa division by zero.
     */
    public function test_efficiency_percentage_zero_division_guard(): void
    {
        $efficiency = $this->calculateEfficiency(0, 0);
        $this->assertSame(0.0, $efficiency);
    }

    /**
     * Memvalidasi batas ekstrem: 100% Klaim Ditolak / Tertahan menghasilkan efisiensi tepat 100,00%.
     */
    public function test_efficiency_percentage_100_percent_held(): void
    {
        $efficiency = $this->calculateEfficiency(50000000, 0);
        $this->assertSame(100.0, $efficiency);
    }

    /**
     * Memvalidasi pembulatan presisi pecahan 2 desimal standar akuntansi Indonesia.
     */
    public function test_efficiency_fractional_rounding_precision(): void
    {
        // 1 / 3 = 33.3333... -> 33.33%
        $efficiency = $this->calculateEfficiency(1000000, 2000000);
        $this->assertEqualsWithDelta(33.33, $efficiency, 0.01);
    }

    /**
     * Memvalidasi pemisah ribuan standar Indonesia (titik sebagai ribuan, koma sebagai desimal).
     */
    public function test_indonesian_currency_and_number_formatting(): void
    {
        $number = 1699219;
        $formattedNumber = $this->formatIndonesianNumber($number);
        $this->assertSame('1.699.219', $formattedNumber);

        $currency = 1533908698704;
        $formattedCurrency = $this->formatIndonesianRupiah($currency);
        $this->assertSame('Rp 1.533.908.698.704', $formattedCurrency);
    }

    private function calculateEfficiency(float $held, float $approved): float
    {
        $total = $held + $approved;
        if ($total <= 0) {
            return 0.0;
        }
        return round(($held / $total) * 100, 2);
    }

    private function formatIndonesianNumber(int|float $val): string
    {
        return number_format($val, 0, ',', '.');
    }

    private function formatIndonesianRupiah(int|float $val): string
    {
        return 'Rp ' . number_format($val, 0, ',', '.');
    }
}
