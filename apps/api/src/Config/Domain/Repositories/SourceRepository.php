<?php

declare(strict_types=1);

namespace Src\Config\Domain\Repositories;

use Src\Config\Domain\Entities\Source;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Persistence contract for the Source aggregate. Implemented in
 * Infrastructure; callers depend only on this interface.
 *
 * Name/URL uniqueness per user is enforced here (application checks)
 * and at the database level (unique indexes). The aggregate itself
 * stays free of query concerns.
 */
interface SourceRepository
{
    public function findById(Ulid $id): ?Source;

    public function findByIdForUser(Ulid $id, Ulid $userId): ?Source;

    /**
     * @return list<Source>
     */
    public function listForUser(Ulid $userId): array;

    public function existsForUserWithName(Ulid $userId, string $name, ?Ulid $ignoreId = null): bool;

    public function existsForUserWithUrl(Ulid $userId, string $url, ?Ulid $ignoreId = null): bool;

    public function save(Source $source): void;

    public function delete(Source $source): void;
}
