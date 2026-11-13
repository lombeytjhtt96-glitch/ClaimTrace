<?php

namespace App\Jobs;

use App\Services\HybridApiService;
use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PurifyClaimBatchJob implements ShouldQueue
{
    use Batchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 180;
    public array $backoff = [10, 30, 60];

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $noFpk,
        public array $claims = [],
        public array $options = [],
        public string $initiatedByNip = 'SYSTEM'
    ) {}

    /**
     * Execute the job.
     */
    public function handle(HybridApiService $apiService): void
    {
        // 1. Retrieve claims if not provided in constructor
        $claims = $this->claims;
        if (empty($claims)) {
            $claims = $apiService->getClaims(['no_fpk' => $this->noFpk]);
        }

        if (empty($claims)) {
            $claims = $apiService->getCanonicalClaimsQueue();
        }

        if (empty($claims)) {
            Log::warning("[PURIFIKASI] Batch FPK {$this->noFpk} tidak memiliki data klaim untuk dipurifikasi.");
            return;
        }

        Log::info('[PURIFIKASI] Memulai proses pra-purifikasi batch FPK: '.$this->noFpk.'. Total: '.count($claims).' klaim.');

        // 2. Sequential screening pipeline
        $purifiedClaims = [];
        $countLolos = 0;
        $countAnomali = 0;
        $countGagal = 0;
        $potensiEfisiensiRp = 0;

        $seenSeps = [];
        $seenEncounters = [];

        foreach ($claims as $claim) {
            $claimId = $claim['id'] ?? $claim['claim_id'] ?? 'CLM-'.uniqid();
            $noSep = $claim['no_sep'] ?? '';
            $patientNik = $claim['patient_nik_masked'] ?? '';
            $tglMasuk = $claim['tgl_masuk'] ?? '';
            $tglPulang = $claim['tgl_pulang'] ?? '';
            $jp = strtoupper($claim['jenis_pelayanan'] ?? 'RJTL');
            $tarif = (int) ($claim['tarif_fkl47'] ?? $claim['biaya_riil_rs'] ?? 0);
            $dpjpSip = strtoupper($claim['dpjp_sip'] ?? '');

            $violations = [];

            // Check 1: Mandatory Fields Integrity (ADM-01)
            $missingFields = [];
            if (empty($claimId)) { $missingFields[] = 'id'; }
            if (empty($noSep)) { $missingFields[] = 'no_sep'; }
            if (empty($patientNik)) { $missingFields[] = 'patient_nik_masked'; }
            if (empty($claim['kode_cbg'] ?? '')) { $missingFields[] = 'kode_cbg'; }
            if (empty($claim['dpjp_name'] ?? '')) { $missingFields[] = 'dpjp_name'; }

            if (! empty($missingFields)) {
                $violations[] = [
                    'code' => 'ADM-01',
                    'rule' => 'KELENGKAPAN_MANDATORI',
                    'severity' => 'GAGAL',
                    'message' => 'Ketidaklengkapan berkas mandatori: '.implode(', ', $missingFields),
                ];
            }

            // Date chronology sanity
            if (! empty($tglMasuk) && ! empty($tglPulang) && strtotime($tglPulang) < strtotime($tglMasuk)) {
                $violations[] = [
                    'code' => 'ADM-01',
                    'rule' => 'CHRONOLOGY_INVALID',
                    'severity' => 'GAGAL',
                    'message' => 'Tanggal pulang mendahului tanggal masuk rawat',
                ];
            }

            // Check 2: Doctor SIP Legal Status (ADM-03)
            if (str_contains($dpjpSip, 'EXPIRED') || (isset($claim['sip_expired']) && $claim['sip_expired'] === true)) {
                $violations[] = [
                    'code' => 'ADM-03',
                    'rule' => 'SIP_DPJP_EXPIRED',
                    'severity' => 'HARD_RED',
                    'message' => 'SIP DPJP kedaluwarsa saat masa perawatan pasien',
                ];
            }

            // Check 3: Length of Stay plausibility (ADM-02)
            if ($jp === 'RJTL' && ! empty($tglMasuk) && ! empty($tglPulang) && $tglMasuk !== $tglPulang) {
                $violations[] = [
                    'code' => 'ADM-02',
                    'rule' => 'RJTL_INVALID_LOS',
                    'severity' => 'ANOMALI',
                    'message' => 'Layanan Rawat Jalan Tingkat Lanjut memiliki durasi rawat inap lebih dari 0 hari',
                ];
            }

            // Check 4: Tariff Sanity (ADM-04)
            if ($tarif <= 0) {
                $violations[] = [
                    'code' => 'ADM-04',
                    'rule' => 'INVALID_TARIFF',
                    'severity' => 'GAGAL',
                    'message' => 'Tarif klaim FKL47 tidak valid atau kurang dari sama dengan nol',
                ];
            }

            // Check 5: Duplicate Detection / Modus #11 Repeat Billing (ADM-05 / MED-03 / KOD-04)
            if (! empty($noSep)) {
                if (isset($seenSeps[$noSep])) {
                    $violations[] = [
                        'code' => 'ADM-05',
                        'rule' => 'DUPLICATE_SEP_BATCH',
                        'severity' => 'HARD_RED',
                        'message' => 'Nomor SEP ganda terdeteksi dalam satu pengajuan batch',
                    ];
                }
                $seenSeps[$noSep] = true;
            }

            $encounterKey = $patientNik.'_'.$tglMasuk;
            if (! empty($patientNik) && ! empty($tglMasuk)) {
                if (isset($seenEncounters[$encounterKey])) {
                    $violations[] = [
                        'code' => 'MED-03',
                        'rule' => 'REPEAT_BILLING_OVERLAP',
                        'severity' => 'HARD_RED',
                        'message' => 'Modus #11 Repeat Billing: Pelayanan ganda pada pasien dan tanggal admisi yang sama',
                    ];
                }
                $seenEncounters[$encounterKey] = true;
            }

            if (($claim['readmisi_30_hari'] ?? false) === true && ($claim['is_prb'] ?? false) === false) {
                $violations[] = [
                    'code' => 'KOD-04',
                    'rule' => 'READMISI_30_HARI',
                    'severity' => 'ANOMALI',
                    'message' => 'Admisi rawat inap berulang dalam 30 hari tanpa indikasi penyakit kronis PRB',
                ];
            }

            // Lane & Scoring Assignment
            $hasHardRed = false;
            $hasAnomali = false;
            $hasGagal = false;

            foreach ($violations as $v) {
                if ($v['severity'] === 'HARD_RED') {
                    $hasHardRed = true;
                } elseif ($v['severity'] === 'GAGAL') {
                    $hasGagal = true;
                } elseif ($v['severity'] === 'ANOMALI') {
                    $hasAnomali = true;
                }
            }

            if ($hasHardRed || $hasGagal) {
                $purifikasiStatus = 'PURIFIKASI_GAGAL';
                $lane = 'MERAH';
                $score = max(75.0, (float) ($claim['total_score'] ?? 85.0));
                $recStatus = 'TIDAK_LAYAK_FRAUD';
                $countGagal++;
                $potensiEfisiensiRp += $tarif;
            } elseif ($hasAnomali) {
                $purifikasiStatus = 'PURIFIKASI_ANOMALI';
                $lane = 'KUNING';
                $score = max(55.0, (float) ($claim['total_score'] ?? 65.0));
                $recStatus = 'PENDING_KLARIFIKASI';
                $countAnomali++;
                $potensiEfisiensiRp += $tarif;
            } else {
                $purifikasiStatus = 'PURIFIKASI_LOLOS';
                $lane = 'HIJAU';
                $score = min(40.0, (float) ($claim['total_score'] ?? 25.0));
                $recStatus = 'LAYAK_BAYAR';
                $countLolos++;
            }

            $purifiedClaims[] = array_merge($claim, [
                'purifikasi_status' => $purifikasiStatus,
                'purifikasi_lane' => $lane,
                'purifikasi_score' => $score,
                'recommended_status' => $recStatus,
                'violations' => $violations,
                'purified_at' => now()->toIso8601String(),
            ]);
        }

        // 3. Result Aggregation & Cache Storage
        $summary = [
            'no_fpk' => $this->noFpk,
            'timestamp' => now()->toIso8601String(),
            'total_claims' => count($claims),
            'lolos_count' => $countLolos,
            'anomali_count' => $countAnomali,
            'gagal_count' => $countGagal,
            'potensi_efisiensi_rp' => $potensiEfisiensiRp,
            'potensi_efisiensi_idr' => 'Rp '.number_format($potensiEfisiensiRp, 0, ',', '.'),
            'claims_result' => $purifiedClaims,
        ];

        Cache::put("purifikasi_result_{$this->noFpk}", $summary, now()->addDays(7));
        Cache::put('purifikasi_batch_latest', $summary, now()->addDays(7));

        Log::info(sprintf(
            '[PURIFIKASI] Batch FPK %s selesai. Total: %d, Lolos: %d, Anomali: %d, Gagal: %d, Potensi Efisiensi: Rp %s.',
            $this->noFpk,
            $summary['total_claims'],
            $countLolos,
            $countAnomali,
            $countGagal,
            number_format($potensiEfisiensiRp, 0, ',', '.')
        ));

        // 4. Dispatch Audit Trail Job
        IngestAuditTrailJob::dispatch(
            'PURIFIKASI_BATCH',
            $this->noFpk,
            $this->initiatedByNip,
            [
                'no_fpk' => $this->noFpk,
                'total_claims' => $summary['total_claims'],
                'lolos_count' => $countLolos,
                'anomali_count' => $countAnomali,
                'gagal_count' => $countGagal,
                'potensi_efisiensi_rp' => $potensiEfisiensiRp,
            ]
        );
    }
}
