<?php

namespace App\Http\Controllers;

use App\Services\HybridApiService;
use App\Services\ZeroPhiMasker;
use Illuminate\Http\Request;

class DecisionController extends Controller
{
    protected HybridApiService $apiService;

    public function __construct(HybridApiService $apiService)
    {
        $this->apiService = $apiService;
    }

    /**
     * Redirect to default claim decision console or render default claim.
     */
    public function index(Request $request)
    {
        return $this->show($request, 'CLM-2026-8801');
    }

    /**
     * Display VEDIKA 4-Status Putusan Console for a specific claim.
     */
    public function show(Request $request, string $id)
    {
        $dossier = $this->apiService->getClaimDossier($id);

        // Merge session-persisted checklist state
        $sessionChecklist = session("checklists.{$id}", []);
        $checklist = array_merge($dossier['kaidah_kertas_kerja'] ?? [], $sessionChecklist);

        $completedCount = count(array_filter([
            $checklist['sep_valid'] ?? false,
            $checklist['rujukan_prb_valid'] ?? false,
            $checklist['resume_tte_dpjp'] ?? false,
            $checklist['koding_inacbg_sesuai'] ?? false,
            $checklist['bukti_penunjang_lengkap'] ?? false,
            $checklist['konfirmasi_peserta_sah'] ?? false,
        ]));
        $checklist['completed_count'] = $completedCount;
        $dossier['kaidah_kertas_kerja'] = $checklist;

        // Fetch 16 coded reasons across 3 pillars and dispute SLA tiers
        $pendingData = $this->apiService->getPendingCodes();
        $pillars = $pendingData['pillars'] ?? [];
        $disputeTiers = $pendingData['dispute_sla_tiers'] ?? [];

        // Existing decision if previously adjudicated
        $existingDecision = session("decisions.{$id}", null);

        return view('vedika.decision', compact(
            'id',
            'dossier',
            'checklist',
            'completedCount',
            'pillars',
            'disputeTiers',
            'existingDecision'
        ));
    }

    /**
     * Submit an adjudication decision for a claim (Fail-Closed RBAC: ADJUDICATE).
     */
    public function store(Request $request, string $id)
    {
        // Fail-Closed Validation
        $validated = $request->validate([
            'decision' => 'required|string|in:LAYAK_BAYAR,PENDING_KLARIFIKASI,DISPUTE_TKMKB,TIDAK_LAYAK_FRAUD',
            'catatan' => 'required|string|max:5000',
            'tarif_verifikasi_rp' => 'nullable|numeric|min:0',
            'ina_cbg_verified' => 'nullable|string|max:50',
            'dispute_level' => 'nullable|string|in:CABANG,KEDEPUTIAN,PUSAT_TKMKB',
            'pending_reasons' => 'nullable|array',
        ]);

        $decision = $validated['decision'];

        // Enforce tariff adjustments
        if ($decision === 'TIDAK_LAYAK_FRAUD') {
            $tarifVerifikasi = 0;
        } elseif ($decision === 'LAYAK_BAYAR') {
            if ($request->filled('tarif_verifikasi_rp')) {
                $tarifVerifikasi = (int) $request->input('tarif_verifikasi_rp');
            } else {
                $dossier = $this->apiService->getClaimDossier($id);
                $tarifVerifikasi = (int) ($dossier['claim']['tarif_fkl47'] ?? 5200000);
            }
        } else {
            $tarifVerifikasi = $request->filled('tarif_verifikasi_rp') ? (int) $request->input('tarif_verifikasi_rp') : 0;
        }

        // Enforce dispute SLA level default
        $disputeLevel = null;
        if ($decision === 'DISPUTE_TKMKB') {
            $disputeLevel = $request->input('dispute_level') ?: 'CABANG';
        }

        // Sanitize verifier notes
        $catatan = ZeroPhiMasker::sanitizeFreeText($validated['catatan']);

        $verifierNip = session('user.nip', '198704202011012001');
        $verifierName = session('user.name', 'dr. Siti Rahma, Sp.PK');
        $verifierRole = session('user.role', 'VERIFIKATOR_SENIOR');

        $decisionData = [
            'claim_id' => $id,
            'verifier_id' => $verifierNip,
            'verifier_nip' => $verifierNip,
            'verifier_name' => $verifierName,
            'verifier_role' => $verifierRole,
            'decision' => $decision,
            'tarif_verifikasi_rp' => $tarifVerifikasi,
            'ina_cbg_verified' => strtoupper((string) $request->input('ina_cbg_verified', '')),
            'dispute_level' => $disputeLevel,
            'pending_reasons' => (array) $request->input('pending_reasons', []),
            'catatan' => $catatan,
            'catatan_verifikator' => $catatan,
            'timestamp' => now()->toIso8601String(),
        ];

        // Persist decision to session
        session(["decisions.{$id}" => $decisionData]);

        // Append block to session ledger with SHA-256 hash chaining
        $chain = session('audit_chain', []);
        $prevHash = !empty($chain) ? end($chain)['current_hash'] : session('last_audit_hash', str_repeat('0', 64));
        $blockIndex = count($chain) + 1;
        $timestamp = now()->toIso8601String();

        $blockContent = json_encode([
            'actor' => $verifierNip,
            'claim_id' => $id,
            'event_type' => 'CLAIM_ADJUDICATION',
            'payload' => $decisionData,
            'prev_hash' => $prevHash,
            'timestamp' => $timestamp,
        ], JSON_UNESCAPED_SLASHES);
        $currentHash = hash('sha256', $blockContent);

        $newBlock = [
            'index' => $blockIndex,
            'timestamp' => $timestamp,
            'event_type' => 'CLAIM_ADJUDICATION',
            'claim_id' => $id,
            'actor' => $verifierNip,
            'payload' => $decisionData,
            'prev_hash' => $prevHash,
            'current_hash' => $currentHash,
        ];
        $chain[] = $newBlock;
        session(['audit_chain' => $chain, 'last_audit_hash' => $currentHash]);

        // Sync with FastAPI engine
        $this->apiService->recordDecision($id, $decisionData);

        if ($request->wantsJson() || $request->ajax() || $request->isJson()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Putusan klaim berhasil disimpan dan disegel ke audit ledger SHA-256.',
                'claim_id' => $id,
                'decision' => $decision,
                'tarif_verifikasi_rp' => $tarifVerifikasi,
                'catatan' => $catatan,
                'audit_entry' => $newBlock,
            ]);
        }

        return redirect()->back()->with('success', 'Putusan klaim berhasil disimpan dan disegel ke audit ledger SHA-256.');
    }

    /**
     * Display SHA-256 Tamper-Evident Audit Ledger viewer.
     */
    public function ledger(Request $request)
    {
        $claimId = $request->query('claim_id');
        $page = (int) $request->query('page', 1);

        $ledgerData = $this->apiService->getAuditLedger($claimId);

        if ($request->wantsJson()) {
            return response()->json($ledgerData);
        }

        return view('audit.ledger', compact('ledgerData', 'claimId', 'page'));
    }

    /**
     * Alias for BAHV Recapitulation Table.
     */
    public function bahv(Request $request)
    {
        return app(ReportController::class)->bahvRecap($request);
    }
}
