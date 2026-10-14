<?php

declare(strict_types=1);

namespace Src\Identity\Infrastructure\Services;

use Src\Identity\Application\Services\ApiTokenIssuer;
use Src\Identity\Infrastructure\Persistence\Eloquent\User;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Sanctum personal-access-token issuance.
 */
final class SanctumTokenIssuer implements ApiTokenIssuer
{
    public function issueFor(Ulid $userId, string $deviceName): string
    {
        $model = User::query()->where('id', (string) $userId)->firstOrFail();

        return $model->createToken($deviceName)->plainTextToken;
    }
}
