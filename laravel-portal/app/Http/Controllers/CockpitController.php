<?php

namespace App\Http\Controllers;

use App\Services\HybridApiService;
use App\Services\ZeroPhiMasker;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CockpitController extends Controller
{
    protected HybridApiService $apiService;

    public function __construct(HybridApiService $apiService)
    {
        $this->apiService = $apiService;
    }

    /**
     * Tampilkan halaman Cockpit Eksekutif & Corong Penapisan Anomali.
     */
    public function index(Request $request): View
    {
        // 1. Dapatkan status kesehatan dan latensi engine FastAPI
        $connectionStatus = $this->apiService->checkHealth();

        // 2. Ambil metrik nasional makro (dengan fallback DuckDB kanonikal)
        $kpis = $this->apiService->getCockpitKpis();

        // 3. Ambil ringkasan pipeline penyaringan 4-tahap
        $funnelData = $this->apiService->getScreeningFunnel();
        $screeningFunnel = $funnelData['stages'] ?? [];

        // 4. Spesifikasi Formula Scoring Tri-Layer
        $scoringSpec = $this->apiService->getTriLayerMetrics();

        // 5. Modus Anomali Utama
        $anomalyModusList = $this->apiService->getAnomalyIndicators();

        // 6. Sampel Antrean Berisiko Tinggi (dengan Zero-PHI Masking)
        $rawClaims = $this->apiService->getCanonicalClaimsQueue('all');
        $highRiskClaims = [];

        foreach ($rawClaims as $item) {
            $claim = $item['claim'] ?? $item;
            $triage = $item['triage'] ?? $item;

            $nikMasked = $claim['patient_nik_masked'] ?? (isset($claim['nik']) ? ZeroPhiMasker::maskNikPreserveSuffix($claim['nik']) : '3171********0001');
            $bpjsMasked = $claim['patient_card_masked'] ?? (isset($claim['no_kartu']) ? ZeroPhiMasker::maskBpjsCard($claim['no_kartu']) : '000123*******');
            $pseudoName = $claim['patient_pseudo'] ?? (isset($claim['nama_peserta']) ? ZeroPhiMasker::maskName($claim['nama_peserta']) : 'Pasien JKN');

            $highRiskClaims[] = [
                'id' => $claim['id'] ?? 'CLM-2026-XXXX',
                'no_sep' => $claim['no_sep'] ?? '-',
                'nama_faskes' => $claim['nama_faskes'] ?? '-',
                'nik_masked' => $nikMasked,
                'bpjs_masked' => $bpjsMasked,
                'peserta_pseudonym' => $pseudoName,
                'ina_cbg' => $claim['kode_cbg'] ?? '-',
                'biaya_riil_rs' => 'Rp '.number_format($claim['biaya_riil_rs'] ?? $claim['tarif_fkl47'] ?? 0, 0, ',', '.'),
                'tarif_fkl48' => 'Rp '.number_format($claim['tarif_fkl48'] ?? 0, 0, ',', '.'),
                'score' => (float) ($triage['score'] ?? $claim['total_score'] ?? 0.0),
                'hard_trigger' => (bool) ($triage['hard_trigger'] ?? false),
                'modus' => $triage['anomaly_modus'] ?? $claim['deskripsi_cbg'] ?? '-',
                'lane' => strtoupper($triage['lane'] ?? $claim['lane'] ?? 'HIJAU'),
            ];
        }

        return view('cockpit.index', [
            'connectionStatus' => $connectionStatus,
            'kpis' => $kpis,
            'screeningFunnel' => $screeningFunnel,
            'funnelData' => $funnelData,
            'scoringSpec' => $scoringSpec,
            'anomalyModusList' => $anomalyModusList,
            'highRiskClaims' => $highRiskClaims,
        ]);
    }
}
