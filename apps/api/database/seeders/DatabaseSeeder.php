<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Src\Identity\Infrastructure\Persistence\Eloquent\User;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'display_name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $this->call(SourceSeeder::class);
    }
}
