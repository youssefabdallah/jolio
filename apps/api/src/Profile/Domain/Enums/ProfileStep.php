<?php

declare(strict_types=1);

namespace Src\Profile\Domain\Enums;

/**
 * Editor wizard steps in display order (SPECS FR-4 editor UI).
 *
 * Persisted as the profile's resume point: the frontend lands back on
 * the stored step. Review is terminal and always last.
 */
enum ProfileStep: string
{
    case Contact = 'contact';
    case Headline = 'headline';
    case Skills = 'skills';
    case Experience = 'experience';
    case Education = 'education';
    case Languages = 'languages';
    case Review = 'review';

    /**
     * Zero-based position in the wizard.
     */
    public function order(): int
    {
        return match ($this) {
            self::Contact => 0,
            self::Headline => 1,
            self::Skills => 2,
            self::Experience => 3,
            self::Education => 4,
            self::Languages => 5,
            self::Review => 6,
        };
    }
}
