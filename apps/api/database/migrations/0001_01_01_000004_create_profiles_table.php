<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Candidate profiles (SPECS §6 Profile, FR-4).
 *
 * One row per user (user_id unique — multi-profile is out of MVP).
 * Structured sections live in JSON columns: the profile is always
 * read and written as one validated document (see the Domain
 * aggregate), so joins would only add ceremony. user_id is a plain
 * string because users use ULID primary keys.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('user_id', 26)->unique();
            $table->json('contact');
            $table->string('headline', 140)->nullable();
            $table->text('summary')->nullable();
            $table->json('skills')->nullable();
            $table->json('experience')->nullable();
            $table->json('education')->nullable();
            $table->json('languages')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
