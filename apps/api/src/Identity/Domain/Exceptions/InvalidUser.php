<?php

declare(strict_types=1);

namespace Src\Identity\Domain\Exceptions;

use Src\Shared\Domain\Enums\ErrorCode;
use Src\Shared\Domain\Exceptions\DomainException;

/**
 * A User aggregate was put together in a way that violates Identity rules.
 */
final class InvalidUser extends DomainException
{
    public static function invalidEmail(string $value): self
    {
        return new self(
            ErrorCode::InvalidEmail,
            'identity.errors.invalid_email',
            ['value' => $value],
        );
    }

    public static function blankDisplayName(): self
    {
        return new self(ErrorCode::BlankDisplayName, 'identity.errors.blank_display_name');
    }

    public static function localWithoutPassword(): self
    {
        return new self(ErrorCode::LocalWithoutPassword, 'identity.errors.local_without_password');
    }

    public static function oauthWithoutProviderId(): self
    {
        return new self(ErrorCode::OauthWithoutProviderId, 'identity.errors.oauth_without_provider_id');
    }

    public static function oauthWithPassword(): self
    {
        return new self(ErrorCode::OauthWithPassword, 'identity.errors.oauth_with_password');
    }

    public static function oauthWithLocalProvider(): self
    {
        return new self(ErrorCode::OauthWithLocalProvider, 'identity.errors.oauth_with_local_provider');
    }
}
