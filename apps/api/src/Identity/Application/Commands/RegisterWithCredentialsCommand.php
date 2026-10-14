<?php

declare(strict_types=1);

namespace Src\Identity\Application\Commands;

/**
 * Register with a local email/password credential (SPECS FR-1).
 */
final readonly class RegisterWithCredentialsCommand
{
    public function __construct(
        public string $displayName,
        public string $email,
        public string $password,
        public string $deviceName,
    ) {}
}
