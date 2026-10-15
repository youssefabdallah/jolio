<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wizard resume state on candidate profiles.
 *
 * current_step records where the editor left off (null = never
 * started); completion_percent is always recomputed server-side on
 * save — client numbers are never trusted.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->string('current_step', 32)->nullable()->after('languages');
            $table->unsignedTinyInteger('completion_percent')->default(0)->after('current_step');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn(['current_step', 'completion_percent']);
        });
    }
};
