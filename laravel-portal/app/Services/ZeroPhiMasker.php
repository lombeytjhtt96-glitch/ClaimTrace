<?php

namespace App\Services;

class ZeroPhiMasker
{
    /**
     * Mask NIK (16 digit) sesuai UU PDP No. 27/2022 Pasal 16.
     * Default ($preserveSuffix = false): 4 digit pertama tampak, 12 digit sisanya dimasker '*' (contoh: 3201************).
     * Jika $preserveSuffix = true: 4 digit pertama tampak, 8 digit masker, 4 digit terakhir tampak (contoh: 3171********0001).
     */
    public static function maskNik(?string $nik, bool $preserveSuffix = false): string
    {
        if ($nik === null || trim($nik) === '') {
            return '-';
        }

        $clean = preg_replace('/\D/', '', $nik);
        $len = strlen($clean);

        if ($len === 0) {
            return '-';
        }

        if ($len >= 16) {
            if ($preserveSuffix) {
                return substr($clean, 0, 4).'********'.substr($clean, 12, 4);
            }

            return substr($clean, 0, 4).str_repeat('*', 12);
        }

        if ($len > 4) {
            if ($preserveSuffix && $len > 6) {
                return substr($clean, 0, 4).str_repeat('*', max(1, $len - 6)).substr($clean, -2);
            }

            return substr($clean, 0, 4).str_repeat('*', $len - 4);
        }

        return str_repeat('*', $len);
    }

    /**
     * Helper alias untuk penyamaran NIK ketat (UU PDP No. 27/2022).
     */
    public static function maskNikStrict(?string $nik): string
    {
        return self::maskNik($nik, false);
    }

    /**
     * Helper alias untuk penyamaran NIK verifikasi berkas fisik (preservasi 4 digit akhir).
     */
    public static function maskNikPreserveSuffix(?string $nik): string
    {
        return self::maskNik($nik, true);
    }

    /**
     * Mask Nomor Kartu BPJS Kesehatan (13 digit).
     * 6 digit pertama tampak, 7 digit sisanya dimasker '*' (contoh: 000123*******).
     */
    public static function maskBpjsCard(?string $card): string
    {
        if ($card === null || trim($card) === '') {
            return '-';
        }

        $clean = preg_replace('/\D/', '', $card);
        $len = strlen($clean);

        if ($len === 0) {
            return '-';
        }

        if ($len >= 13) {
            return substr($clean, 0, 6).str_repeat('*', 7);
        }

        if ($len > 6) {
            return substr($clean, 0, 6).str_repeat('*', $len - 6);
        }

        if ($len > 2) {
            return substr($clean, 0, 2).str_repeat('*', $len - 2);
        }

        return str_repeat('*', $len);
    }

    /**
     * Pseudonimisasi nama peserta: pertahankan huruf pertama tiap kata, sisanya dimasker '*'.
     * Contoh: 'Budi Santoso' -> 'B*** S******'.
     */
    public static function maskName(?string $name): string
    {
        if ($name === null || trim($name) === '') {
            return '-';
        }

        $trimmed = trim($name);
        $words = preg_split('/\s+/', $trimmed);
        $maskedWords = [];

        foreach ($words as $word) {
            $len = mb_strlen($word);
            if ($len === 0) {
                continue;
            }
            if ($len === 1) {
                $maskedWords[] = $word;
            } else {
                $firstChar = mb_substr($word, 0, 1);
                $maskedWords[] = $firstChar.str_repeat('*', $len - 1);
            }
        }

        return implode(' ', $maskedWords);
    }

    /**
     * Alias untuk backwards compatibility dengan modul pengujian dan implementasi lawas.
     */
    public static function pseudonymizeName(?string $name): string
    {
        return self::maskName($name);
    }

    /**
     * Mask nomor telepon seluler Indonesia (+62 / 08).
     */
    public static function maskPhone(?string $phone): string
    {
        if ($phone === null || trim($phone) === '') {
            return '-';
        }

        $clean = preg_replace('/\D/', '', $phone);
        $len = strlen($clean);

        if ($len < 8) {
            return $phone;
        }

        $isInternational = str_starts_with(trim($phone), '+62');
        if ($isInternational) {
            return '+62'.substr($clean, 2, 3).'****'.substr($clean, -4);
        }

        return substr($clean, 0, 4).'****'.substr($clean, -4);
    }

    /**
     * Sanitasi dan masking otomatis terhadap seluruh payload array klaim secara rekursif.
     */
    public static function maskClaim(array $claim): array
    {
        return self::sanitizeArrayRecursive($claim);
    }

    /**
     * Traversal rekursif terhadap seluruh elemen array untuk penyamaran Zero-PHI hierarkis.
     */
    public static function sanitizeArrayRecursive(array $data): array
    {
        $result = [];
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $result[$key] = self::sanitizeArrayRecursive($value);

                continue;
            }

            if (! is_string($value)) {
                $result[$key] = $value;

                continue;
            }

            $keyLower = strtolower((string) $key);
            if (in_array($keyLower, ['nik', 'patient_nik', 'nik_peserta'], true)) {
                $result[$key] = self::maskNik($value);
                $result['patient_nik_masked'] = self::maskNik($value);
            } elseif (in_array($keyLower, ['no_kartu', 'patient_card', 'no_peserta'], true)) {
                $result[$key] = self::maskBpjsCard($value);
                $result['patient_card_masked'] = self::maskBpjsCard($value);
            } elseif (in_array($keyLower, ['nama_peserta', 'patient_name', 'nama_lengkap'], true)) {
                $result[$key] = self::maskName($value);
                $result['patient_pseudo'] = self::maskName($value);
            } elseif (in_array($keyLower, ['no_telepon', 'phone', 'no_hp'], true)) {
                $result[$key] = self::maskPhone($value);
            } elseif (in_array($keyLower, ['catatan', 'catatan_verifikator', 'notes', 'resume_medis'], true)) {
                $result[$key] = self::sanitizeFreeText($value);
            } else {
                $result[$key] = $value;
            }
        }

        return $result;
    }

    /**
     * Sanitasi teks bebas (catatan verifikator / rekam klinis) dari kebocoran NIK atau No. Kartu.
     */
    public static function sanitizeFreeText(?string $text): string
    {
        if ($text === null || trim($text) === '') {
            return '';
        }

        // Ganti NIK 16 digit baik tanpa pemisah maupun dengan pemisah tanda hubung, titik, atau spasi
        $text = preg_replace_callback('/(?:\b\d{4}[-.\s]\d{4}[-.\s]\d{4}[-.\s]\d{4}\b|\b\d{16}\b)/', function ($m) {
            $digits = preg_replace('/\D/', '', $m[0]);
            if (strlen($digits) === 16) {
                return self::maskNik($digits, true);
            }

            return $m[0];
        }, $text);

        // Ganti No Kartu BPJS 13 digit (diawali 000)
        $text = preg_replace_callback('/\b000\d{10}\b/', function ($m) {
            return self::maskBpjsCard($m[0]);
        }, $text);

        return $text;
    }

    /**
     * Router method untuk Blade directive @maskPhi($val, $type).
     */
    public static function mask(?string $value, string $type = 'auto'): string
    {
        if ($value === null || trim($value) === '') {
            return '-';
        }

        return match (strtolower(trim($type))) {
            'nik' => self::maskNik($value, false),
            'nik_preserve' => self::maskNik($value, true),
            'bpjs_card', 'card', 'no_kartu', 'bpjs' => self::maskBpjsCard($value),
            'name', 'nama', 'patient_name' => self::maskName($value),
            'phone', 'telepon', 'hp' => self::maskPhone($value),
            'text' => self::sanitizeFreeText($value),
            default => self::autoDetectAndMask($value),
        };
    }

    /**
     * Alias untuk kompatibilitas pemanggilan maskAuto.
     */
    public static function maskAuto(?string $value, string $type = 'auto'): string
    {
        return self::mask($value, $type);
    }

    /**
     * Deteksi otomatis jenis identifier berdasarkan pola dan panjang karakter.
     */
    protected static function autoDetectAndMask(string $value): string
    {
        $clean = preg_replace('/\D/', '', $value);
        if (strlen($clean) === 16) {
            return self::maskNik($value, false);
        }
        if (strlen($clean) === 13 && str_starts_with($clean, '000')) {
            return self::maskBpjsCard($value);
        }
        if (preg_match('/[a-zA-Z]/', $value)) {
            return self::maskName($value);
        }

        return self::maskNik($value, false);
    }
}
