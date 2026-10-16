<?php

declare(strict_types=1);

namespace Src\Config\Infrastructure\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Src\Config\Domain\Repositories\SourceRepository;
use Src\Config\Infrastructure\Persistence\Eloquent\EloquentSourceRepository;
use Src\Config\Infrastructure\Persistence\Eloquent\Source;
use Src\Config\Presentation\Policies\SourcePolicy;

/**
 * Binds Config Domain contracts to Infrastructure implementations
 * and registers the owner-only source policy.
 */
final class ConfigServiceProvider extends ServiceProvider
{
    /**
     * Register Config bindings.
     */
    public function register(): void
    {
        $this->app->bind(SourceRepository::class, EloquentSourceRepository::class);
    }

    /**
     * Register the owner-only source policy.
     */
    public function boot(): void
    {
        Gate::policy(Source::class, SourcePolicy::class);
    }
}
