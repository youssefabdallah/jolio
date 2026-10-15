<?php

declare(strict_types=1);

namespace Src\Profile\Infrastructure\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Src\Profile\Domain\Repositories\ProfileRepository;
use Src\Profile\Infrastructure\Persistence\Eloquent\EloquentProfileRepository;
use Src\Profile\Infrastructure\Persistence\Eloquent\Profile;
use Src\Profile\Presentation\Policies\ProfilePolicy;

/**
 * Binds Profile Domain contracts to Infrastructure implementations
 * and registers the owner-only profile policy.
 */
final class ProfileServiceProvider extends ServiceProvider
{
    /**
     * Register Profile bindings.
     */
    public function register(): void
    {
        $this->app->bind(ProfileRepository::class, EloquentProfileRepository::class);
    }

    /**
     * Register the owner-only profile policy.
     */
    public function boot(): void
    {
        Gate::policy(Profile::class, ProfilePolicy::class);
    }
}
