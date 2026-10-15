<?php

declare(strict_types=1);

namespace Src\Profile\Domain\ValueObjects;

use Src\Profile\Domain\Exceptions\InvalidProfile;

/**
 * One education entry (SPECS §6 Profile).
 *
 * Years are plain integers: graduation precision beyond the year adds
 * no tailoring value and invites fussy validation.
 */
final class EducationEntry
{
    public const MAX_FIELD = 160;

    public const MIN_YEAR = 1950;

    private function __construct(
        public readonly string $institution,
        public readonly string $degree,
        public readonly ?string $field,
        public readonly ?int $startYear,
        public readonly ?int $endYear,
    ) {}

    /**
     * @throws InvalidProfile
     */
    public static function fromPrimitives(
        string $institution,
        string $degree,
        ?string $field = null,
        ?int $startYear = null,
        ?int $endYear = null,
    ): self {
        $institution = trim($institution);
        $degree = trim($degree);

        if ($institution === '') {
            throw InvalidProfile::blankValue('education.institution');
        }
        if ($degree === '') {
            throw InvalidProfile::blankValue('education.degree');
        }
        if (mb_strlen($institution) > self::MAX_FIELD) {
            throw InvalidProfile::tooLong('education.institution', self::MAX_FIELD);
        }
        if (mb_strlen($degree) > self::MAX_FIELD) {
            throw InvalidProfile::tooLong('education.degree', self::MAX_FIELD);
        }

        $field = $field === null || trim($field) === '' ? null : trim($field);
        if ($field !== null && mb_strlen($field) > self::MAX_FIELD) {
            throw InvalidProfile::tooLong('education.field', self::MAX_FIELD);
        }

        $maxYear = (int) date('Y') + 5;
        foreach (['education.start_year' => $startYear, 'education.end_year' => $endYear] as $label => $year) {
            if ($year !== null && ($year < self::MIN_YEAR || $year > $maxYear)) {
                throw InvalidProfile::badDate($label, (string) $year);
            }
        }
        if ($startYear !== null && $endYear !== null && $endYear < $startYear) {
            throw InvalidProfile::endBeforeStart('education.end_year');
        }

        return new self($institution, $degree, $field, $startYear, $endYear);
    }
}
