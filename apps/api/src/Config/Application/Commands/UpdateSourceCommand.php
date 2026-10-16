<?php

declare(strict_types=1);

namespace Src\Config\Application\Commands;

use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Replace one job source in full (Stitch "Save source" drawer action).
 *
 * Full-document replacement matching PUT semantics: every field is
 * required, identity (id, owner) never changes. Both ids come from
 * the route and the Sanctum token, never from request input.
 */
final readonly class UpdateSourceCommand
{
    public function __construct(
        public Ulid $id,
        public Ulid $userId,
        public string $name,
        public string $url,
        public string $type,
        public string $priority,
        public string $countryCode,
        public bool $isEnabled = true,
    ) {}
}
