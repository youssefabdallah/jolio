<?php

declare(strict_types=1);

namespace Src\Identity\Application\Services;

/**
 * One-way password hashing. Implemented in Infrastructure (bcrypt);
 * Application code never touches hashing details.
 */
interface PasswordHasher
{
    /**
     * @param  non-empty-string  $plain
     */
    public function hash(string $plain): string;

    /**
     * Check a plaintext credential against a stored hash using a
     * timing-safe comparison.
     */
    public function verify(string $plain, string $hash): bool;
}
