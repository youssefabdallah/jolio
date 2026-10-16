<?php

declare(strict_types=1);

namespace Src\Config\Domain\Enums;

/**
 * Query tier for a job source (Stitch PRIORITY TIER control).
 *
 * T1 sources are queried first and win deduplication ties when two
 * sources return the same role (see the drawer helper text). The rank
 * lives on the enum so run ordering never scatters across callers.
 */
enum SourcePriority: string
{
    case T1 = 'T1';
    case T2 = 'T2';
    case T3 = 'T3';

    /**
     * Lower wins: T1 (1) is queried before T2 (2) before T3 (3).
     */
    public function rank(): int
    {
        return match ($this) {
            self::T1 => 1,
            self::T2 => 2,
            self::T3 => 3,
        };
    }

    /**
     * Whether this tier wins a dedup tie against another tier.
     */
    public function winsTieOver(self $other): bool
    {
        return $this->rank() < $other->rank();
    }

    /**
     * Locale key for the human label (translated in Presentation).
     */
    public function translationKey(): string
    {
        return "config.enums.source_priority.{$this->value}";
    }
}
