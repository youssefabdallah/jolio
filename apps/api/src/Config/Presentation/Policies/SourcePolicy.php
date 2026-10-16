<?php

declare(strict_types=1);

namespace Src\Config\Presentation\Policies;

use Illuminate\Contracts\Auth\Authenticatable;
use Src\Config\Infrastructure\Persistence\Eloquent\Source;

/**
 * Owner-only access to job-source registry entries (a source belongs
 * to exactly one user).
 *
 * The authenticated principal is typed as the framework contract on
 * purpose: the policy compares opaque identifiers as strings and
 * never imports another bounded context's models.
 */
final class SourcePolicy
{
    /**
     * Only the owning user may view their entry.
     */
    public function view(Authenticatable $user, Source $source): bool
    {
        return (string) $user->getAuthIdentifier() === (string) $source->user_id;
    }

    /**
     * Only the owning user may replace their entry.
     */
    public function update(Authenticatable $user, Source $source): bool
    {
        return (string) $user->getAuthIdentifier() === (string) $source->user_id;
    }

    /**
     * Only the owning user may delete their entry.
     */
    public function delete(Authenticatable $user, Source $source): bool
    {
        return (string) $user->getAuthIdentifier() === (string) $source->user_id;
    }
}
