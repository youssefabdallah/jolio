<?php

declare(strict_types=1);

namespace Src\Identity\Application\Commands;

use Src\Identity\Domain\Enums\AuthProvider;

/**
 * Complete an OAuth handshake started at the provider redirect (SPECS FR-1).
 */
final readonly class HandleOAuthCallbackCommand
{
    public function __construct(
        public AuthProvider $provider,
        public string $deviceName,
    ) {}
}
