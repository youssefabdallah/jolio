<?php

declare(strict_types=1);

namespace Src\Identity\Domain\Exceptions;

use Src\Shared\Domain\Enums\ErrorCode;
use Src\Shared\Domain\Exceptions\DomainException;

/**
 * The OAuth handshake with the external provider failed or is unavailable.
 */
final class OAuthFailed extends DomainException
{
    /**
     * Provider credentials are not configured — fail closed, never proceed.
     */
    public static function notConfigured(): self
    {
        return new self(ErrorCode::OauthNotConfigured, 'identity.errors.oauth_not_configured');
    }

    /**
     * The provider denied access or the exchange blew up mid-handshake.
     */
    public static function providerError(): self
    {
        return new self(ErrorCode::OauthFailed, 'identity.errors.oauth_failed');
    }
}
