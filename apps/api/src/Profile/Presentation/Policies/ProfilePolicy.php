<?php

declare(strict_types=1);

namespace Src\Profile\Presentation\Policies;

use Illuminate\Contracts\Auth\Authenticatable;
use Src\Profile\Infrastructure\Persistence\Eloquent\Profile;

/**
 * Owner-only access to candidate profiles (SPECS FR-5: a profile
 * belongs to exactly one user).
 *
 * The authenticated principal is typed as the framework contract on
 * purpose: the policy compares opaque identifiers as strings and
 * never imports another bounded context's models.
 */
final class ProfilePolicy
{
    /**
     * Only the owning user may replace their profile.
     */
    public function update(Authenticatable $user, Profile $profile): bool
    {
        return (string) $user->getAuthIdentifier() === (string) $profile->user_id;
    }
}
