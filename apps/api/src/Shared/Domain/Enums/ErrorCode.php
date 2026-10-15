<?php

declare(strict_types=1);

namespace Src\Shared\Domain\Enums;

/**
 * Machine-readable API error codes shared by all bounded contexts.
 *
 * The enum carries its own HTTP status so Presentation can render any
 * DomainException uniformly without leaking HTTP into aggregates.
 */
enum ErrorCode: string
{
    case InvalidEmail = 'INVALID_EMAIL';
    case BlankDisplayName = 'BLANK_DISPLAY_NAME';
    case LocalWithoutPassword = 'LOCAL_WITHOUT_PASSWORD';
    case OauthWithoutProviderId = 'OAUTH_WITHOUT_PROVIDER_ID';
    case OauthWithPassword = 'OAUTH_WITH_PASSWORD';
    case OauthWithLocalProvider = 'OAUTH_WITH_LOCAL_PROVIDER';
    case EmailTaken = 'EMAIL_TAKEN';
    case InvalidCredentials = 'INVALID_CREDENTIALS';
    case OauthNotConfigured = 'OAUTH_NOT_CONFIGURED';
    case OauthFailed = 'OAUTH_FAILED';
    case InvalidProfileValue = 'INVALID_PROFILE_VALUE';

    /**
     * HTTP status for the central API exception renderer.
     */
    public function httpStatus(): int
    {
        return match ($this) {
            self::EmailTaken => 409,
            self::InvalidCredentials => 401,
            self::OauthNotConfigured => 503,
            self::OauthFailed => 502,
            default => 422,
        };
    }
}
