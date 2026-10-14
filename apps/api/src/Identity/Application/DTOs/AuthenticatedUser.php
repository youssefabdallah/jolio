<?php

declare(strict_types=1);

namespace Src\Identity\Application\DTOs;

use Src\Identity\Domain\Entities\User;

/**
 * Successful authentication outcome: the user plus a freshly issued
 * plaintext API token (shown once — never persisted in readable form).
 */
final readonly class AuthenticatedUser
{
    public function __construct(
        public User $user,
        public string $token,
    ) {}
}
