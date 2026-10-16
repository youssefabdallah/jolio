<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Job-source registry entries (SPECS FR-38/FR-39, US-302).
 *
 * One row per source; a user's registry is the SET of their rows (no
 * header table). Approved deltas: no section column; country_code is
 * NOT NULL text holding 'GLOBAL' or an ISO alpha-2 code (NULL logic
 * avoided); telemetry is derived from future search runs, never stored
 * here (FR-40: runs never mutate config).
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sources', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('user_id', 26);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('url', 2048);
            $table->string('type', 32);
            $table->string('priority', 8);
            // 'GLOBAL' or an ISO-3166-1 alpha-2 code, always uppercase.
            $table->string('country_code', 8)->default('GLOBAL');
            $table->json('strengths')->nullable();
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();

            // No duplicate names or feeds inside one user's registry.
            // (Name collisions are checked case-insensitively in the
            // application layer; the index guards the exact form.)
            $table->unique(['user_id', 'name']);
            $table->unique(['user_id', 'url']);

            // Registry filters (type tabs, text search scoping) and the
            // run query: enabled rows ordered by priority tier.
            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'priority']);
            $table->index(['user_id', 'country_code']);
            $table->index(['user_id', 'is_enabled', 'priority']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sources');
    }
};
