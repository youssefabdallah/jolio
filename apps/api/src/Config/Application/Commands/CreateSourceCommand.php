<?php

declare(strict_types=1);

namespace Src\Config\Application\Commands;

use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Add one job source to the caller's registry (Stitch "+ New source").
 *
 * The user id always comes from the Sanctum token, never from request
 * input. Fields travel as primitives; the handler promotes them to
 * value objects so every Domain invariant runs before anything persists.
 */
final readonly class CreateSourceCommand
{
    public function __construct(
        public Ulid $userId,
        public string $name,
        public string $url,
        public string $type,
        public string $priority,
        public string $countryCode,
        public bool $isEnabled = true,
    ) {}
}
