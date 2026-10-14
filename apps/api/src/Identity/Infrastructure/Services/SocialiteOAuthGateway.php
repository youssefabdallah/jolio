<?php

declare(strict_types=1);

namespace Src\Identity\Infrastructure\Services;

use Laravel\Socialite\Facades\Socialite;
use Src\Identity\Application\Services\OAuthAccount;
use Src\Identity\Application\Services\OAuthUserGateway;
use Src\Identity\Domain\Enums\AuthProvider;
use Src\Identity\Domain\Exceptions\InvalidUser;
use Src\Identity\Domain\Exceptions\OAuthFailed;
use Src\Identity\Domain\ValueObjects\Email;

/**
 * Socialite-backed OAuth handshake (server code flow, stateless API).
 *
 * Stateless mode skips the session `state` check (no session on API
 * routes): the code is single-use and short-lived, and the resulting
 * account is verified by the provider itself. Documented trade-off, see
 * docs/features/identity/user.md.
 */
final class SocialiteOAuthGateway implements OAuthUserGateway
{
    public function redirectUrl(AuthProvider $provider): string
    {
        $this->guardSupported($provider);

        // Stateless: API routes carry no session store for the `state`
        // check. Same documented trade-off as the callback side.
        return Socialite::driver($provider->value)->stateless()->redirect()->getTargetUrl();
    }

    public function userFromCallback(AuthProvider $provider): OAuthAccount
    {
        $this->guardSupported($provider);

        try {
            $socialiteUser = Socialite::driver($provider->value)->stateless()->user();
        } catch (\Throwable $exception) {
            report($exception);

            throw OAuthFailed::providerError();
        }

        return new OAuthAccount(
            $provider,
            (string) $socialiteUser->getId(),
            Email::fromString((string) $socialiteUser->getEmail()),
            (string) ($socialiteUser->getName() ?? $socialiteUser->getEmail()),
            $socialiteUser->getAvatar(),
        );
    }

    /**
     * Fail closed when provider credentials are absent or the driver
     * cannot serve this provider.
     *
     * @throws OAuthFailed
     * @throws InvalidUser
     */
    private function guardSupported(AuthProvider $provider): void
    {
        if (! $provider->isOAuth()) {
            throw InvalidUser::oauthWithLocalProvider();
        }

        $config = config("services.{$provider->value}");

        if (! is_array($config) || blank($config['client_id'] ?? null) || blank($config['client_secret'] ?? null)) {
            throw OAuthFailed::notConfigured();
        }
    }
}
