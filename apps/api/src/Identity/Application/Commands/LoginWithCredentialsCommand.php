<?php

declare(strict_types=1);

namespace Src\Identity\Application\Commands;

/**
 * Sign in with a local email/password credential (SPECS FR-1).
 */
final readonly class LoginWithCredentialsCommand
{
    public function __construct(
        public string $email,
        public string $password,
        public string $deviceName,
    ) {}
}
