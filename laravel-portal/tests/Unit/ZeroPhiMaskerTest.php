<?php

namespace Tests\Unit;

use App\Services\ZeroPhiMasker;
use PHPUnit\Framework\TestCase;

class ZeroPhiMaskerTest extends TestCase
{
    /**
     * Memvalidasi penyamaran NIK 16 digit standar sesuai UU PDP No. 27/2022 Pasal 16.
     */
    public function test_mask_nik_standard_16_digits(): void
    {
        // Strict UU PDP Mode (default: 4 digit tampak, 12 digit '*')
        $rawNikStrict = '3201012345670001';
        $maskedStrict = ZeroPhiMasker::maskNik($rawNikStrict);

        $this->assertSame('3201************', $maskedStrict);
        $this->assertEquals(16, strlen($maskedStrict));
        $this->assertStringNotContainsString('01234567', $maskedStrict);

        // Verification / Suffix Preservation Mode (4 tampak + 8 '*' + 4 tampak)
        $rawNikPreserve = '3171012345670001';
        $maskedPreserve = ZeroPhiMasker::maskNik($rawNikPreserve, true);

        $this->assertSame('3171********0001', $maskedPreserve);
        $this->assertStringNotContainsString('01234567', $maskedPreserve);
        $this->assertMatchesRegularExpression('/^\d{4}\*{8}\d{4}$/', $maskedPreserve);
    }

    /**
     * Memvalidasi penanganan NIK pendek atau malformed di bawah 16 digit.
     */
    public function test_mask_nik_short_digits_boundary(): void
    {
        $shortNik = '3171012345';
        $masked = ZeroPhiMasker::maskNik($shortNik, true);

        $this->assertStringNotContainsString('0123', $masked);
        $this->assertStringStartsWith('3171', $masked);
        $this->assertStringEndsWith('45', $masked);

        $shortStrict = ZeroPhiMasker::maskNik('32011234');
        $this->assertSame('3201****', $shortStrict);
    }

    /**
     * Memvalidasi penanganan NIK null, string kosong, dan karakter non-angka.
     */
    public function test_mask_nik_null_and_empty(): void
    {
        $this->assertSame('-', ZeroPhiMasker::maskNik(null));
        $this->assertSame('-', ZeroPhiMasker::maskNik(''));
        $this->assertSame('-', ZeroPhiMasker::maskNik('   '));
        $this->assertSame('-', ZeroPhiMasker::maskNik('ABCDEF'));
    }

    /**
     * Memvalidasi penyamaran Nomor Kartu BPJS Kesehatan (13 digit).
     */
    public function test_mask_bpjs_card_number(): void
    {
        $rawCard = '0001234567890';
        $masked = ZeroPhiMasker::maskBpjsCard($rawCard);

        $this->assertSame('000123*******', $masked);
        $this->assertStringStartsWith('0001', $masked);
        $this->assertStringContainsString('****', $masked);
        $this->assertStringNotContainsString('4567890', $masked);
    }

    /**
     * Memvalidasi pseudonimisasi nama peserta untuk perlindungan privasi.
     */
    public function test_pseudonymize_patient_name(): void
    {
        $rawName = 'Siti Rahma';
        $pseudo = ZeroPhiMasker::pseudonymizeName($rawName);

        $this->assertSame('S*** R****', $pseudo);
        $this->assertNotSame($rawName, $pseudo);
        $this->assertStringContainsString('*', $pseudo);

        // Edge case: multiple words and single character word
        $threeWord = ZeroPhiMasker::maskName('dr. Bambang Soedarmono');
        $this->assertSame('d** B****** S*********', $threeWord);
    }

    /**
     * Memvalidasi sanitasi teks bebas catatan verifikator dari kebocoran NIK dan No Kartu.
     */
    public function test_sanitize_free_text_removes_embedded_nik(): void
    {
        $rawText = 'Pasien dengan NIK 3171012345670001 memerlukan verifikasi fisik tambahan.';
        $sanitized = ZeroPhiMasker::sanitizeFreeText($rawText);

        $this->assertStringNotContainsString('3171012345670001', $sanitized);
        $this->assertStringContainsString('3171********0001', $sanitized);

        $rawTextCard = 'Catatan klaim: No Kartu BPJS 0001234567890 terdeteksi anomali.';
        $sanitizedCard = ZeroPhiMasker::sanitizeFreeText($rawTextCard);
        $this->assertStringNotContainsString('0001234567890', $sanitizedCard);
        $this->assertStringContainsString('000123*******', $sanitizedCard);
    }

    /**
     * Memvalidasi masking payload klaim secara komprehensif.
     */
    public function test_mask_claim_payload(): void
    {
        $claim = [
            'id' => 'CLM-2026-8801',
            'nik' => '3201012345670001',
            'no_kartu' => '0001234567890',
            'nama_peserta' => 'Budi Santoso',
            'tarif_fkl47' => 5200000,
        ];

        $masked = ZeroPhiMasker::maskClaim($claim);

        $this->assertSame('3201************', $masked['nik']);
        $this->assertSame('3201************', $masked['patient_nik_masked']);
        $this->assertSame('000123*******', $masked['no_kartu']);
        $this->assertSame('000123*******', $masked['patient_card_masked']);
        $this->assertSame('B*** S******', $masked['nama_peserta']);
        $this->assertSame('B*** S******', $masked['patient_pseudo']);
        $this->assertSame(5200000, $masked['tarif_fkl47']);
    }

    /**
     * Memvalidasi router method mask() dengan auto-detection dan parameter tipe.
     */
    public function test_mask_router_and_auto_detection(): void
    {
        $this->assertSame('3201************', ZeroPhiMasker::mask('3201012345670001', 'nik'));
        $this->assertSame('3171********0001', ZeroPhiMasker::mask('3171012345670001', 'nik_preserve'));
        $this->assertSame('000123*******', ZeroPhiMasker::mask('0001234567890', 'card'));
        $this->assertSame('B*** S******', ZeroPhiMasker::mask('Budi Santoso', 'name'));

        // Auto detection
        $this->assertSame('3201************', ZeroPhiMasker::mask('3201012345670001'));
        $this->assertSame('000123*******', ZeroPhiMasker::mask('0001234567890'));
        $this->assertSame('H***** W*****', ZeroPhiMasker::mask('Hendra Wijaya'));
    }
}
