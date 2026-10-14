<?php

declare(strict_types=1);

namespace Src\Identity\Application\Services;

use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Issues API tokens for an authenticated user. Implemented in
 * Infrastructure via Sanctum; the token is returned once, in plaintext.
 */
interface ApiTokenIssuer
{
    public function issueFor(Ulid $userId, string $deviceName): string;
}
