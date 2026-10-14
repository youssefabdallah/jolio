<?php

declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Src\Identity\Domain\Enums\AuthProvider;
use Src\Identity\Infrastructure\Persistence\Eloquent\User;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The model associated with the factory.
     *
     * @var class-string<User>
     */
    protected $model = User::class;

    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state (local credential user).
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Ulid::generate(),
            'display_name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'provider' => AuthProvider::Local,
            'provider_id' => null,
            'avatar_url' => null,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate an OAuth-registered user (no local password).
     */
    public function oauth(AuthProvider $provider = AuthProvider::Google): static
    {
        return $this->state(fn (array $attributes) => [
            'password' => null,
            'provider' => $provider,
            'provider_id' => fake()->unique()->numerify('google-##########'),
        ]);
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
