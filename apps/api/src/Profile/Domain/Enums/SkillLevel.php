<?php

declare(strict_types=1);

namespace Src\Profile\Domain\Enums;

/**
 * Self-assessed seniority for a single skill (SPECS §6 Profile).
 *
 * Four steps keep self-reporting honest and comparable: no percentages,
 * no years-inflation, just a coarse, reviewable band.
 */
enum SkillLevel: string
{
    case Beginner = 'beginner';
    case Intermediate = 'intermediate';
    case Advanced = 'advanced';
    case Expert = 'expert';

    /**
     * Locale key for the human label (translated in Presentation).
     */
    public function translationKey(): string
    {
        return "profile.enums.skill_level.{$this->value}";
    }
}
