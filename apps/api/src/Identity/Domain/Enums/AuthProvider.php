<?php

declare(strict_types=1);

namespace Src\Identity\Domain\Enums;

/**
 * Supported authentication providers (SPECS FR-1).
 *
 * Local = email/password credential stored by us; any other case means
 * the identity is vouched for by an external OAuth provider.
 */
enum AuthProvider: string
{
    case Local = 'local';
    case Google = 'google';

    /**
     * Whether this provider outsources authentication to OAuth.
     */
    public function isOAuth(): bool
    {
        return $this !== self::Local;
    }
}
