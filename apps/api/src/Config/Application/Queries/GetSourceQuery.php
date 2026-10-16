<?php

declare(strict_types=1);

namespace Src\Config\Application\Queries;

use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Read one owned registry entry (detail drawer, edit form).
 *
 * Missing rows fail as a 404; foreign rows never reach here —
 * SourcePolicy rejects them with 403 during authorization.
 */
final readonly class GetSourceQuery
{
    public function __construct(
        public Ulid $id,
        public Ulid $userId,
    ) {}
}
