<?php

declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Src\Config\Infrastructure\Persistence\Eloquent\Source;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * @extends Factory<Source>
 */
class SourceFactory extends Factory
{
    /**
     * The model associated with the factory.
     *
     * @var class-string<Source>
     */
    protected $model = Source::class;

    /**
     * Define the model's default state (minimal valid row).
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Ulid::generate(),
            'user_id' => (string) Ulid::generate(),
            'name' => fake()->unique()->company().' Feed',
            'url' => 'https://'.fake()->unique()->domainName().'/api/jobs',
            'type' => fake()->randomElement(['search_engine', 'board', 'ats', 'career_page']),
            'priority' => fake()->randomElement(['T1', 'T2', 'T3']),
            'country_code' => fake()->randomElement(['GLOBAL', 'DE', 'US', 'FR']),
            'is_enabled' => true,
        ];
    }
}
