<?php

declare(strict_types=1);

namespace Src\Config\Application\Queries;

use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Filtered, paginated registry read (Stitch table + filter tabs).
 *
 * All filters are optional and owner-scoped. Raw enum strings travel
 * as-is; unknown values simply match nothing rather than failing.
 */
final readonly class ListSourcesQuery
{
    public function __construct(
        public Ulid $userId,
        public ?string $type = null,
        public ?bool $isEnabled = null,
        public ?string $search = null,
        public int $perPage = 50,
    ) {}
}
