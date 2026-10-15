<?php

declare(strict_types=1);

namespace Src\Profile\Domain\ValueObjects;

use Src\Profile\Domain\Exceptions\InvalidProfile;

/**
 * One work-history entry (SPECS §6 Profile).
 *
 * Dates are YYYY-MM strings: precise enough for resumes, coarse enough
 * to avoid day-level nitpicking. A null end means "present".
 */
final class ExperienceEntry
{
    public const MAX_FIELD = 120;

    public const MAX_BULLETS = 20;

    public const MAX_BULLET = 500;

    private function __construct(
        public readonly string $role,
        public readonly string $company,
        public readonly ?string $location,
        public readonly string $startDate,
        public readonly ?string $endDate,
        /** @var list<string> */
        public readonly array $bullets,
    ) {}

    /**
     * @param  list<mixed>  $bullets
     *
     * @throws InvalidProfile
     */
    public static function fromPrimitives(
        string $role,
        string $company,
        ?string $location,
        string $startDate,
        ?string $endDate,
        array $bullets = [],
    ): self {
        $role = trim($role);
        $company = trim($company);

        if ($role === '') {
            throw InvalidProfile::blankValue('experience.role');
        }
        if ($company === '') {
            throw InvalidProfile::blankValue('experience.company');
        }
        foreach (['experience.role' => $role, 'experience.company' => $company] as $field => $value) {
            if (mb_strlen($value) > self::MAX_FIELD) {
                throw InvalidProfile::tooLong($field, self::MAX_FIELD);
            }
        }

        $location = $location === null || trim($location) === '' ? null : trim($location);
        if ($location !== null && mb_strlen($location) > self::MAX_FIELD) {
            throw InvalidProfile::tooLong('experience.location', self::MAX_FIELD);
        }

        self::assertYearMonth('experience.start_date', $startDate);
        $endDate = $endDate === null || trim($endDate) === '' ? null : trim($endDate);
        if ($endDate !== null) {
            self::assertYearMonth('experience.end_date', $endDate);
            if ($endDate < $startDate) {
                throw InvalidProfile::endBeforeStart('experience.end_date');
            }
        }

        if (count($bullets) > self::MAX_BULLETS) {
            throw InvalidProfile::tooMany('experience.bullets', self::MAX_BULLETS);
        }
        $clean = [];
        foreach ($bullets as $bullet) {
            if (! is_string($bullet) || trim($bullet) === '') {
                throw InvalidProfile::blankValue('experience.bullets');
            }
            $bullet = trim($bullet);
            if (mb_strlen($bullet) > self::MAX_BULLET) {
                throw InvalidProfile::tooLong('experience.bullets', self::MAX_BULLET);
            }
            $clean[] = $bullet;
        }

        return new self($role, $company, $location, $startDate, $endDate, $clean);
    }

    /**
     * @throws InvalidProfile
     */
    private static function assertYearMonth(string $field, string $value): void
    {
        if (! preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $value)) {
            throw InvalidProfile::badDate($field, $value);
        }
    }
}
