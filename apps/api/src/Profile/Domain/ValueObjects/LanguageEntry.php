<?php

declare(strict_types=1);

namespace Src\Profile\Domain\ValueObjects;

use Src\Profile\Domain\Enums\LanguageLevel;
use Src\Profile\Domain\Exceptions\InvalidProfile;

/**
 * One language with a CEFR proficiency level (SPECS §6 Profile).
 */
final class LanguageEntry
{
    public const MAX_LANGUAGE = 60;

    private function __construct(
        public readonly string $language,
        public readonly LanguageLevel $level,
    ) {}

    /**
     * @throws InvalidProfile
     */
    public static function fromPrimitives(string $language, string $level): self
    {
        $language = trim($language);

        if ($language === '') {
            throw InvalidProfile::blankValue('languages.language');
        }
        if (mb_strlen($language) > self::MAX_LANGUAGE) {
            throw InvalidProfile::tooLong('languages.language', self::MAX_LANGUAGE);
        }

        $parsed = LanguageLevel::tryFrom(strtolower(trim($level)));
        if ($parsed === null) {
            throw InvalidProfile::unknownLevel('languages.level', $level);
        }

        return new self($language, $parsed);
    }
}
