<?php

namespace App\Http\Controllers;

use App\Services\HybridApiService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VedikaQueueController extends Controller
{
    protected HybridApiService $apiService;

    public function __construct(HybridApiService $apiService)
    {
        $this->apiService = $apiService;
    }

    /**
     * Display VEDIKA claims queue with filter controls and workload indicators.
     */
    public function index(Request $request)
    {
        $filters = $request->only([
            'lane',
            'jenis_pelayanan',
            'jenis_pengajuan',
            'no_fpk',
            'search',
            'assigned_verifier_nip',
        ]);

        $claims = $this->apiService->getClaims($filters);
        $workload = $this->apiService->getVerifierWorkload();
        $verifiers = AuthController::OFFICIAL_VERIFIERS;

        // Calculate summary counts across available claims
        $countHijau = count(array_filter($claims, fn ($c) => ($c['lane'] ?? '') === 'HIJAU'));
        $countKuning = count(array_filter($claims, fn ($c) => ($c['lane'] ?? '') === 'KUNING'));
        $countMerah = count(array_filter($claims, fn ($c) => ($c['lane'] ?? '') === 'MERAH'));
        $totalClaims = count($claims);

        return view('vedika.queue', compact(
            'claims',
            'workload',
            'verifiers',
            'filters',
            'countHijau',
            'countKuning',
            'countMerah',
            'totalClaims'
        ));
    }

    /**
     * Pull batch claims from VClaim BPJS into VEDIKA queue.
     */
    public function pullFpk(Request $request)
    {
        $validated = $request->validate([
            'no_fpk' => 'required|string|max:100',
            'bulan_pelayanan' => ['required', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
            'jumlah_klaim' => 'required|integer|min:1|max:500',
            'jenis_pengajuan' => 'nullable|string',
            'jenis_pelayanan' => 'nullable|string',
            'nama_faskes' => 'nullable|string',
            'auto_plot' => 'nullable|boolean',
        ]);

        $result = $this->apiService->pullFpk($validated);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json($result, 200);
        }

        return redirect()->back()->with('success', 'Penarikan data FPK berhasil dilakukan.');
    }

    /**
     * Batch plot selected claim IDs to a designated verifier NIP.
     */
    public function batchPlot(Request $request)
    {
        $validated = $request->validate([
            'claim_ids' => 'required|array|min:1|max:100',
            'claim_ids.*' => 'required|string',
            'verifier_nip' => [
                'required',
                'string',
                'digits:18',
                Rule::in(array_keys(AuthController::OFFICIAL_VERIFIERS)),
            ],
            'catatan' => 'nullable|string|max:1000',
        ]);

        $result = $this->apiService->assignPlotting($validated);

        // Update session-based workload counter for immediate reactive UI feedback
        $nip = $validated['verifier_nip'];
        $added = count($validated['claim_ids']);
        $currentDelta = (int) session("workload_delta.{$nip}", 0);
        session(["workload_delta.{$nip}" => $currentDelta + $added]);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json($result, 200);
        }

        return redirect()->back()->with('success', 'Batch plotting verifikator berhasil diperbarui.');
    }

    /**
     * Display verifier workload distribution endpoint.
     */
    public function workload(Request $request)
    {
        $workload = $this->apiService->getVerifierWorkload();

        if ($request->wantsJson()) {
            return response()->json($workload, 200);
        }

        return view('vedika.workload', compact('workload'));
    }
}
