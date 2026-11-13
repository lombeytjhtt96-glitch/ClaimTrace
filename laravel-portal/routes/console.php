<?php

use App\Console\Commands\ExportBahvSnapshot;
use App\Console\Commands\ScanSlaDeadlines;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes & Scheduled Tasks (ClaimTrace JKN Enterprise)
|--------------------------------------------------------------------------
|
| Automated tasks scheduled for compliance with statutory deadlines
| (Perpres 82/2018), nightly BAHV snapshot reconciliation, and
| routine queue maintenance. Strictly ZERO emojis.
|
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Feature 32: Scan SLA 10 Hari Kerja (Perpres 82/2018)
Schedule::command('claimtrace:scan-sla --notify')
    ->dailyAt('07:00')
    ->timezone('Asia/Jakarta')
    ->name('claimtrace-daily-sla-scan')
    ->withoutOverlapping();

Schedule::command('claimtrace:scan-sla')
    ->hourly()
    ->timezone('Asia/Jakarta')
    ->name('claimtrace-hourly-sla-scan')
    ->withoutOverlapping();

// Feature 33: Export Rekonsiliasi BAHV Snapshot
Schedule::command('claimtrace:export-bahv')
    ->dailyAt('23:00')
    ->timezone('Asia/Jakarta')
    ->name('claimtrace-nightly-bahv-export')
    ->withoutOverlapping();

// Queue Maintenance & Housekeeping
Schedule::command('queue:prune-batches --hours=48')
    ->daily()
    ->timezone('Asia/Jakarta')
    ->name('claimtrace-prune-batches');

Schedule::command('queue:prune-failed --hours=168')
    ->weekly()
    ->timezone('Asia/Jakarta')
    ->name('claimtrace-prune-failed');
