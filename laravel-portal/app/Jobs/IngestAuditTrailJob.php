<?php

namespace App\Jobs;

use App\Services\HybridApiService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class IngestAuditTrailJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public string $eventType;
    public string $claimId;
    public string $actor;
    public array $payload;
    public string $timestamp;

    public int $tries = 3;
    public int $timeout = 60;
    public array $backoff = [5, 15, 30];

    /**
     * Create a new job instance.
     */
    public function __construct(
        string|array $eventType,
        ?string $claimId = null,
        ?string $actor = null,
        array $payload = [],
        ?string $timestamp = null
    ) {
        if (is_array($eventType)) {
            $this->eventType = $eventType['event_type'] ?? 'AUDIT_EVENT';
            $this->claimId = $eventType['claim_id'] ?? '-';
            $this->actor = $eventType['actor'] ?? 'SYSTEM';
            $this->payload = $eventType['payload'] ?? [];
            $this->timestamp = $eventType['timestamp'] ?? now()->toIso8601String();
        } else {
            $this->eventType = $eventType;
            $this->claimId = $claimId ?? '-';
            $this->actor = $actor ?? 'SYSTEM';
            $this->payload = $payload;
            $this->timestamp = $timestamp ?? now()->toIso8601String();
        }
    }

    /**
     * Execute the job.
     */
    public function handle(HybridApiService $apiService): void
    {
        $executeLogic = function () use ($apiService) {
            // 1. Resolve previous hash and block index
            $prevHash = str_repeat('0', 64);
            $blockIndex = 1;

            if (Schema::hasTable('audit_ledger_entries')) {
                $lastEntry = DB::table('audit_ledger_entries')->orderBy('block_index', 'desc')->first();
                if ($lastEntry) {
                    $prevHash = $lastEntry->current_hash;
                    $blockIndex = ((int) $lastEntry->block_index) + 1;
                } else {
                    $prevHash = Cache::get('last_audit_hash', str_repeat('0', 64));
                    $blockIndex = ((int) Cache::get('last_audit_index', 0)) + 1;
                }
            } else {
                $prevHash = Cache::get('last_audit_hash', str_repeat('0', 64));
                $blockIndex = ((int) Cache::get('last_audit_index', 0)) + 1;
            }

            // 2. Cryptographic SHA-256 block calculation
            $blockContent = json_encode([
                'actor' => $this->actor,
                'claim_id' => $this->claimId,
                'event_type' => $this->eventType,
                'payload' => $this->payload,
                'prev_hash' => $prevHash,
                'timestamp' => $this->timestamp,
            ], JSON_UNESCAPED_SLASHES);
            $currentHash = hash('sha256', $blockContent);

            // 3. Persist to database if table exists
            if (Schema::hasTable('audit_ledger_entries')) {
                DB::table('audit_ledger_entries')->insert([
                    'block_index' => $blockIndex,
                    'timestamp' => $this->timestamp,
                    'event_type' => $this->eventType,
                    'claim_id' => $this->claimId,
                    'actor' => $this->actor,
                    'payload' => json_encode($this->payload, JSON_UNESCAPED_SLASHES),
                    'prev_hash' => $prevHash,
                    'current_hash' => $currentHash,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 4. Update Cache pointers
            Cache::put('last_audit_hash', $currentHash, now()->addDays(30));
            Cache::put('last_audit_index', $blockIndex, now()->addDays(30));

            $chain = Cache::get('audit_chain', []);
            $chain[] = [
                'block_index' => $blockIndex,
                'timestamp' => $this->timestamp,
                'event_type' => $this->eventType,
                'claim_id' => $this->claimId,
                'actor' => $this->actor,
                'payload' => $this->payload,
                'prev_hash' => $prevHash,
                'current_hash' => $currentHash,
            ];
            Cache::put('audit_chain', $chain, now()->addDays(30));

            // 5. Backend sync if adjudication
            if ($this->eventType === 'CLAIM_ADJUDICATION' && method_exists($apiService, 'recordDecision')) {
                try {
                    $apiService->recordDecision($this->claimId, $this->payload);
                } catch (\Throwable $e) {
                    Log::info('[AUDIT-INGEST] Gagal sinkronisasi putusan dengan backend: '.$e->getMessage());
                }
            }

            // 6. Zero-emoji structured audit log
            Log::info(sprintf(
                '[AUDIT-INGEST] Blok #%d disegel. Event: %s, ID: %s, Aktor: %s, SHA-256: %s.',
                $blockIndex,
                $this->eventType,
                $this->claimId,
                $this->actor,
                $currentHash
            ));
        };

        // Try atomic lock for concurrency protection; fallback to direct execution if locks unsupported
        try {
            Cache::lock('audit_ledger_lock', 10)->block(5, $executeLogic);
        } catch (\Throwable $e) {
            $executeLogic();
        }
    }
}
