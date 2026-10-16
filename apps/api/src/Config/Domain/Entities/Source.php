<?php

declare(strict_types=1);

namespace Src\Config\Domain\Entities;

use Src\Config\Domain\Enums\SourcePriority;
use Src\Config\Domain\Enums\SourceType;
use Src\Config\Domain\ValueObjects\CountryCode;
use Src\Config\Domain\ValueObjects\SourceName;
use Src\Config\Domain\ValueObjects\SourceUrl;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * One job-source registry entry (SPECS FR-38/FR-39, Stitch Sources table).
 *
 * The user's registry is the SET of their Source rows (no header table).
 * The aggregate is immutable: every change returns a new instance, so
 * callers cannot leave a source half-edited. Uniqueness of name and URL
 * per user is enforced by the repository/database; the aggregate only
 * guarantees its own shape.
 *
 * Invariants enforced here, never in callers:
 * - identity (id, userId) never changes after creation;
 * - name/url/country are validated value objects, never raw input;
 * - type and priority are closed enums, never magic strings;
 * - enabled is explicit: disabled sources are skipped by search runs.
 */
final class Source
{
    private function __construct(
        public readonly Ulid $id,
        public readonly Ulid $userId,
        public readonly SourceName $name,
        public readonly SourceUrl $url,
        public readonly SourceType $type,
        public readonly SourcePriority $priority,
        public readonly CountryCode $country,
        public readonly bool $isEnabled,
    ) {}

    public static function fromParts(
        Ulid $id,
        Ulid $userId,
        SourceName $name,
        SourceUrl $url,
        SourceType $type,
        SourcePriority $priority,
        CountryCode $country,
        bool $isEnabled = true,
    ): self {
        return new self($id, $userId, $name, $url, $type, $priority, $country, $isEnabled);
    }

    /**
     * Full-document replacement (matches PUT semantics): same identity,
     * all-new content, already validated on the way in.
     */
    public function replace(
        SourceName $name,
        SourceUrl $url,
        SourceType $type,
        SourcePriority $priority,
        CountryCode $country,
        bool $isEnabled,
    ): self {
        return new self(
            $this->id,
            $this->userId,
            $name,
            $url,
            $type,
            $priority,
            $country,
            $isEnabled,
        );
    }

    public function rename(SourceName $name): self
    {
        return new self(
            $this->id,
            $this->userId,
            $name,
            $this->url,
            $this->type,
            $this->priority,
            $this->country,
            $this->isEnabled,
        );
    }

    public function changeUrl(SourceUrl $url): self
    {
        return new self(
            $this->id,
            $this->userId,
            $this->name,
            $url,
            $this->type,
            $this->priority,
            $this->country,
            $this->isEnabled,
        );
    }

    public function changeType(SourceType $type): self
    {
        return new self(
            $this->id,
            $this->userId,
            $this->name,
            $this->url,
            $type,
            $this->priority,
            $this->country,
            $this->isEnabled,
        );
    }

    public function changePriority(SourcePriority $priority): self
    {
        return new self(
            $this->id,
            $this->userId,
            $this->name,
            $this->url,
            $this->type,
            $priority,
            $this->country,
            $this->isEnabled,
        );
    }

    public function moveTo(CountryCode $country): self
    {
        return new self(
            $this->id,
            $this->userId,
            $this->name,
            $this->url,
            $this->type,
            $this->priority,
            $country,
            $this->isEnabled,
        );
    }

    public function enable(): self
    {
        return new self(
            $this->id,
            $this->userId,
            $this->name,
            $this->url,
            $this->type,
            $this->priority,
            $this->country,
            true,
        );
    }

    public function disable(): self
    {
        return new self(
            $this->id,
            $this->userId,
            $this->name,
            $this->url,
            $this->type,
            $this->priority,
            $this->country,
            false,
        );
    }

    /**
     * Whether search runs should query this source. Disabled rows are
     * skipped (Stitch ENABLED toggle). Telemetry never flips this on
     * its own: only an explicit user edit does (FR-40).
     */
    public function isEnabledForRun(): bool
    {
        return $this->isEnabled;
    }

    /**
     * Query order weight: lower runs first (T1 before T2 before T3).
     */
    public function priorityRank(): int
    {
        return $this->priority->rank();
    }
}
