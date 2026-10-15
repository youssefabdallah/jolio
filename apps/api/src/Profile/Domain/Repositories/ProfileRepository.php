<?php

declare(strict_types=1);

namespace Src\Profile\Domain\Repositories;

use Src\Profile\Domain\Entities\Profile;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Persistence contract for the Profile aggregate. Implemented in
 * Infrastructure; callers depend only on this interface.
 */
interface ProfileRepository
{
    public function findById(Ulid $id): ?Profile;

    public function findByUserId(Ulid $userId): ?Profile;

    public function existsForUser(Ulid $userId): bool;

    public function save(Profile $profile): void;
}
