<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CockpitController;
use App\Http\Controllers\DecisionController;
use App\Http\Controllers\DossierController;
use App\Http\Controllers\InvestigationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\VedikaQueueController;
use App\Services\ZeroPhiMasker;
use Illuminate\Support\Facades\Route;

// Health Check Endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => config('app.name'),
    ]);
})->name('health');

// Root Landing Redirection
Route::get('/', function () {
    if (session()->has('user')) {
        return redirect()->route('cockpit');
    }

    return redirect()->route('login');
})->name('home');

// Authentication Routes
Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Core Portal Cockpit
Route::get('/cockpit', [CockpitController::class, 'index'])->middleware('rbac:VIEW')->name('cockpit');

// VEDIKA Antrean FPK & Workload
Route::get('/vedika', [VedikaQueueController::class, 'index'])->middleware('rbac:VIEW')->name('vedika.queue');
Route::get('/vedika/queue', [VedikaQueueController::class, 'index'])->middleware('rbac:VIEW');
Route::get('/vedika/workload', [VedikaQueueController::class, 'workload'])->middleware('rbac:VIEW')->name('vedika.workload');

// VEDIKA Mutations (Enforcing C03.04 Fail-Closed ADJUDICATE privilege)
Route::post('/vedika/fpk-pull', [VedikaQueueController::class, 'pullFpk'])->middleware('rbac:ADJUDICATE');
Route::post('/vedika/plotting', [VedikaQueueController::class, 'batchPlot'])->middleware('rbac:ADJUDICATE');

// Dossier Investigation & Sub-Views
Route::get('/dossier', function () {
    return redirect()->route('vedika.claims.dossier', ['id' => 'CLM-2026-8801']);
})->name('vedika.dossier');

Route::get('/vedika/claims/{id}/dossier', [InvestigationController::class, 'show'])->middleware('rbac:VIEW')->name('vedika.claims.dossier');
Route::get('/vedika/claims/{id}', [InvestigationController::class, 'show'])->middleware('rbac:VIEW')->name('vedika.claims.show');
Route::get('/vedika/investigation/{id}', [InvestigationController::class, 'show'])->middleware('rbac:VIEW');

Route::get('/vedika/claims/{id}/icare', [InvestigationController::class, 'icare'])->middleware('rbac:VIEW')->name('vedika.claims.icare');
Route::get('/vedika/claims/{id}/billing', [InvestigationController::class, 'billing'])->middleware('rbac:VIEW')->name('vedika.claims.billing');
Route::get('/vedika/claims/{id}/sdmk', [InvestigationController::class, 'sdmk'])->middleware('rbac:VIEW')->name('vedika.claims.sdmk');
Route::get('/vedika/claims/{id}/checklist', [InvestigationController::class, 'checklist'])->middleware('rbac:VIEW')->name('vedika.claims.checklist');
Route::patch('/vedika/claims/{id}/checklist', [InvestigationController::class, 'updateChecklist'])->middleware('rbac:ADJUDICATE')->name('vedika.claims.checklist.update');
Route::get('/vedika/claims/{id}/resubmit', [InvestigationController::class, 'resubmitForm'])->middleware('rbac:VIEW')->name('vedika.claims.resubmit.form');
Route::post('/vedika/claims/{id}/resubmit-susulan', [InvestigationController::class, 'resubmitSusulan'])->middleware('rbac:ADJUDICATE')->name('vedika.claims.resubmit');

// =========================================================================
// Milestone 5: VEDIKA 4-Status Putusan, BAHV Reporting & SHA-256 Ledger
// =========================================================================

// Putusan 4-Status Console (Feature 23, 24, 25)
Route::get('/putusan', [DecisionController::class, 'index'])->middleware('rbac:VIEW')->name('vedika.decision');
Route::get('/vedika/claims/{id}/decision', [DecisionController::class, 'show'])->middleware('rbac:VIEW')->name('vedika.claims.decision');
Route::get('/vedika/decision/{id}', [DecisionController::class, 'show'])->middleware('rbac:VIEW');
Route::match(['post', 'put'], '/vedika/decision/{id}', [DecisionController::class, 'store'])->middleware('rbac:ADJUDICATE')->name('vedika.decision.store');
Route::match(['post', 'put'], '/vedika/claims/{id}/decision', [DecisionController::class, 'store'])->middleware('rbac:ADJUDICATE')->name('vedika.claims.decision.store');

// BAHV Recapitulation Dashboard Table (Feature 26)
Route::get('/vedika/bahv', [ReportController::class, 'bahvRecap'])->middleware('rbac:VIEW')->name('vedika.bahv');
Route::get('/bahv', [ReportController::class, 'bahvRecap'])->middleware('rbac:VIEW')->name('reports.bahv');

// SHA-256 Tamper-Evident Ledger Viewer (Feature 30)
Route::get('/audit/ledger', [DecisionController::class, 'ledger'])->middleware('rbac:READ')->name('audit.ledger');
Route::get('/ledger', [DecisionController::class, 'ledger'])->middleware('rbac:READ')->name('reports.ledger');

// Official Printable Reports (Features 27, 28, 29)
Route::get('/reports/bahv-kolektif', [ReportController::class, 'bahvKolektif'])->middleware('rbac:VIEW')->name('reports.bahv.kolektif');
Route::get('/reports/ba-pending', [ReportController::class, 'baPending'])->middleware('rbac:VIEW')->name('reports.ba.pending');
Route::get('/reports/sp1-audit/{id?}', [ReportController::class, 'sp1Audit'])->middleware('rbac:VIEW')->name('reports.sp1.audit');

Route::get('/pengaturan', function () {
    return view('welcome');
})->name('settings');

// Protected Admin Maintenance Routes (ADMIN privilege required)
Route::post('/admin/cache/clear', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Cache sistem berhasil dibersihkan.',
    ]);
})->middleware('rbac:ADMIN');
