<?php

declare(strict_types=1);

namespace Src\Identity\Infrastructure\Services;

use Illuminate\Support\Facades\Hash;
use Src\Identity\Application\Services\PasswordHasher;

/**
 * Bcrypt password hashing via Laravel's Hash manager.
 */
final class BcryptPasswordHasher implements PasswordHasher
{
    public function hash(string $plain): string
    {
        return Hash::make($plain);
    }

    public function verify(string $plain, string $hash): bool
    {
        return Hash::check($plain, $hash);
    }
}
