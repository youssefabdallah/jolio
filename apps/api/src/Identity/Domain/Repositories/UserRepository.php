<?php

declare(strict_types=1);

namespace Src\Identity\Domain\Repositories;

use Src\Identity\Domain\Entities\User;
use Src\Identity\Domain\Enums\AuthProvider;
use Src\Identity\Domain\ValueObjects\Email;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Persistence contract for the User aggregate. Implemented in
 * Infrastructure; callers depend only on this interface.
 */
interface UserRepository
{
    public function findById(Ulid $id): ?User;

    public function findByEmail(Email $email): ?User;

    public function findByProvider(AuthProvider $provider, string $providerId): ?User;

    public function existsByEmail(Email $email): bool;

    public function save(User $user): void;
}
