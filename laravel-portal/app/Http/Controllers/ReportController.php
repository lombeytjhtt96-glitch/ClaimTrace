<?php

namespace App\Http\Controllers;

use App\Services\HybridApiService;
use App\Services\ZeroPhiMasker;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    protected HybridApiService $apiService;

    public function __construct(HybridApiService $apiService)
    {
        $this->apiService = $apiService;
    }

    /**
     * Display BAHV Recapitulation Dashboard Table (consolidation RJTL vs RITL).
     */
    public function bahvRecap(Request $request)
    {
        $recap = $this->apiService->getBahvRecap();

        return view('reports.bahv-recap', compact('recap'));
    }

    /**
     * Display Official Printable BAHV & FPK Kolektif report.
     */
    public function bahvKolektif(Request $request)
    {
        $recap = $this->apiService->getBahvRecap();
        $totalClaims = $recap['total_claims'] ?? 8;
        $totalClaimed = $recap['total_claimed_rp'] ?? 110220000;
        $signerNip = session('user.nip', '198704202011012001');

        $digitalSeal = strtoupper(hash('sha256', "BAHV_KOLEKTIF:{$totalClaims}:{$totalClaimed}:{$signerNip}"));

        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];
        $currentMonth = (int) date('n');
        $dateIndo = date('j').' '.$months[$currentMonth].' '.date('Y');

        return view('reports.bahv-kolektif', compact('recap', 'digitalSeal', 'dateIndo'));
    }

    /**
     * Display Official Printable Berita Acara Pending & Dispute Klaim report.
     */
    public function baPending(Request $request)
    {
        $recap = $this->apiService->getBahvRecap();
        $pendingItems = $recap['buckets']['PENDING']['items'] ?? [];
        $disputeItems = $recap['buckets']['DISPUTE']['items'] ?? [];
        $tidakLayakItems = $recap['buckets']['TIDAK_LAYAK']['items'] ?? [];

        $items = array_merge($pendingItems, $disputeItems);
        if (empty($items)) {
            $items = $tidakLayakItems;
        }

        $pendingCatalog = $this->apiService->getPendingCodesCatalog();
        $pillars = $pendingCatalog['pillars'] ?? [];
        $slaTiers = $pendingCatalog['dispute_sla_tiers'] ?? [];

        $digitalSeal = strtoupper(hash('sha256', 'BA_PENDING_DISPUTE:'.count($items).':'.($recap['total_held_rp'] ?? 95800000)));

        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];
        $currentMonth = (int) date('n');
        $dateIndo = date('j').' '.$months[$currentMonth].' '.date('Y');

        return view('reports.ba-pending', compact('recap', 'items', 'pillars', 'slaTiers', 'digitalSeal', 'dateIndo'));
    }

    /**
     * Display Official Printable SP-1 Audit VPK Letter for a specific claim.
     */
    public function sp1Audit(Request $request, ?string $id = null)
    {
        $claimId = $id ?: 'CLM-2026-8803';

        $claim = $this->apiService->getClaimForSp1($claimId);
        if ($claim === null) {
            abort(404, 'Berkas klaim tidak ditemukan.');
        }

        $dossier = $this->apiService->getClaimDossier($claimId);

        $digitalSeal = strtoupper(hash('sha256', "SP1_AUDIT_WASRIK:{$claimId}:" . ($claim['tarif_fkl47'] ?? 0)));

        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];
        $currentMonth = (int) date('n');
        $dateIndo = date('j').' '.$months[$currentMonth].' '.date('Y');

        return view('reports.sp1-audit', compact('claimId', 'claim', 'dossier', 'digitalSeal', 'dateIndo'));
    }
}
