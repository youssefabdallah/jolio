<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Src\Identity\Domain\Enums\AuthProvider;

/**
 * Identity users table (SPECS §6 User).
 *
 * ULID string primary key (never sequential — see backend skill §10).
 * Local users carry a password hash; OAuth users carry provider_id instead
 * (enforced in the Domain entity; mirrored here as nullability rules).
 * Sessions live in their own migration file.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('display_name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->string('provider', 32)->default(AuthProvider::Local->value);
            $table->index('provider');
            $table->string('provider_id')->nullable();
            // NULL provider_ids never collide (Postgres + SQLite treat
            // NULLs as distinct in unique constraints).
            $table->unique(['provider', 'provider_id']);
            $table->string('avatar_url', 2048)->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
    }
};
