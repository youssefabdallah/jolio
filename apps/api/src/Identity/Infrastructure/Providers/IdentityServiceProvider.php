<?php

declare(strict_types=1);

namespace Src\Identity\Infrastructure\Providers;

use Illuminate\Support\ServiceProvider;
use Src\Identity\Application\Services\ApiTokenIssuer;
use Src\Identity\Application\Services\OAuthUserGateway;
use Src\Identity\Application\Services\PasswordHasher;
use Src\Identity\Domain\Repositories\UserRepository;
use Src\Identity\Infrastructure\Persistence\Eloquent\EloquentUserRepository;
use Src\Identity\Infrastructure\Services\BcryptPasswordHasher;
use Src\Identity\Infrastructure\Services\SanctumTokenIssuer;
use Src\Identity\Infrastructure\Services\SocialiteOAuthGateway;

/**
 * Binds Identity Domain contracts to Infrastructure implementations.
 */
final class IdentityServiceProvider extends ServiceProvider
{
    /**
     * Register Identity bindings.
     */
    public function register(): void
    {
        $this->app->bind(UserRepository::class, EloquentUserRepository::class);
        $this->app->bind(PasswordHasher::class, BcryptPasswordHasher::class);
        $this->app->bind(OAuthUserGateway::class, SocialiteOAuthGateway::class);
        $this->app->bind(ApiTokenIssuer::class, SanctumTokenIssuer::class);
    }
}
