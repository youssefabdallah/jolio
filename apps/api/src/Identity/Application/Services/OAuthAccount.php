<?php

declare(strict_types=1);

namespace Src\Identity\Application\Services;

use Src\Identity\Domain\Enums\AuthProvider;
use Src\Identity\Domain\ValueObjects\Email;

/**
 * Verified account details vouched for by an external OAuth provider.
 */
final readonly class OAuthAccount
{
    public function __construct(
        public AuthProvider $provider,
        public string $providerId,
        public Email $email,
        public string $displayName,
        public ?string $avatarUrl = null,
    ) {}
}
