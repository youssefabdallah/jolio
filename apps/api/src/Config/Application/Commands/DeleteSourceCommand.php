<?php

declare(strict_types=1);

namespace Src\Config\Application\Commands;

use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Hard-delete one job source (Stitch "Delete source" drawer action).
 *
 * Both ids come from the route and the Sanctum token. There is no
 * soft delete: the registry row is removed, and search runs simply
 * stop seeing it.
 */
final readonly class DeleteSourceCommand
{
    public function __construct(
        public Ulid $id,
        public Ulid $userId,
    ) {}
}
