<?php

declare(strict_types=1);

namespace Src\Identity\Application\Services;

use Src\Identity\Domain\Enums\AuthProvider;
use Src\Identity\Domain\Exceptions\OAuthFailed;

/**
 * Exchanges the provider handshake (authorization code in the current
 * request) for verified account details. Implemented in Infrastructure
 * via Socialite; throws OAuthFailed when unavailable or denied.
 */
interface OAuthUserGateway
{
    /**
     * The Google redirect URL that starts the provider handshake.
     *
     * @throws OAuthFailed
     */
    public function redirectUrl(AuthProvider $provider): string;

    /**
     * Resolve the callback request into a verified OAuth account.
     *
     * @throws OAuthFailed
     */
    public function userFromCallback(AuthProvider $provider): OAuthAccount;
}
