<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('audit_ledger_entries')) {
            Schema::create('audit_ledger_entries', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('block_index')->unique()->index();
                $table->string('timestamp');
                $table->string('event_type')->index();
                $table->string('claim_id')->index();
                $table->string('actor')->index();
                $table->longText('payload');
                $table->string('prev_hash', 64);
                $table->string('current_hash', 64)->unique();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_ledger_entries');
    }
};
