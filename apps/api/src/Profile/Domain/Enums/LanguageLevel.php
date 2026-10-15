<?php

declare(strict_types=1);

namespace Src\Profile\Domain\Enums;

/**
 * Language proficiency on the CEFR scale plus Native (SPECS §6 Profile).
 *
 * CEFR fits a multi-country European job search; Native covers
 * mother-tongue cases the scale cannot express.
 */
enum LanguageLevel: string
{
    case A1 = 'a1';
    case A2 = 'a2';
    case B1 = 'b1';
    case B2 = 'b2';
    case C1 = 'c1';
    case C2 = 'c2';
    case Native = 'native';

    /**
     * Locale key for the human label (translated in Presentation).
     */
    public function translationKey(): string
    {
        return "profile.enums.language_level.{$this->value}";
    }
}
