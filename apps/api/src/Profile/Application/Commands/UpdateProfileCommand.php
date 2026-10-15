<?php

declare(strict_types=1);

namespace Src\Profile\Application\Commands;

use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Replace the caller's whole candidate profile (SPECS FR-4).
 *
 * The user id always comes from the Sanctum token, never from request
 * input — callers cannot name someone else's profile. Sections travel
 * as primitives; the handler promotes them to value objects so every
 * Domain invariant runs before anything persists.
 */
final readonly class UpdateProfileCommand
{
    /**
     * Every section is nullable: a null section was not sent and stays
     * as stored (per-step PUTs). Only the request's validated payload
     * ever reaches here.
     *
     * @param  array<string, mixed>|null  $contact
     * @param  list<mixed>|null  $skills
     * @param  list<mixed>|null  $experience
     * @param  list<mixed>|null  $education
     * @param  list<mixed>|null  $languages
     */
    public function __construct(
        public Ulid $userId,
        public ?array $contact = null,
        public ?string $headline = null,
        public ?string $summary = null,
        public ?array $skills = null,
        public ?array $experience = null,
        public ?array $education = null,
        public ?array $languages = null,
        public ?string $currentStep = null,
    ) {}
}
