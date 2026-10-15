<?php

declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Src\Profile\Infrastructure\Persistence\Eloquent\Profile;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * @extends Factory<Profile>
 */
class ProfileFactory extends Factory
{
    /**
     * The model associated with the factory.
     *
     * @var class-string<Profile>
     */
    protected $model = Profile::class;

    /**
     * Define the model's default state (minimal valid document).
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Ulid::generate(),
            'user_id' => (string) Ulid::generate(),
            'contact' => ['full_name' => fake()->name()],
            'headline' => null,
            'summary' => null,
            'skills' => null,
            'experience' => null,
            'education' => null,
            'languages' => null,
        ];
    }
}
