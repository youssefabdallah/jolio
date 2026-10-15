<?php

declare(strict_types=1);

namespace Src\Profile\Domain\Entities;

use Src\Profile\Domain\Enums\ProfileStep;
use Src\Profile\Domain\Exceptions\InvalidProfile;
use Src\Profile\Domain\Services\ProfileCompletion;
use Src\Profile\Domain\ValueObjects\ContactInfo;
use Src\Profile\Domain\ValueObjects\EducationEntry;
use Src\Profile\Domain\ValueObjects\ExperienceEntry;
use Src\Profile\Domain\ValueObjects\LanguageEntry;
use Src\Profile\Domain\ValueObjects\Skill;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Candidate profile aggregate root (SPECS §6 Profile, FR-4/FR-5).
 *
 * The single source of truth every tailored document must trace back
 * to. One profile per user (userId is unique at the table level);
 * multi-profile support is explicitly out of MVP scope.
 *
 * Invariants enforced here, never in callers:
 * - headline and summary stay within page-budget-friendly caps;
 * - collections stay bounded so a PUT can never smuggle a dump;
 * - every nested object is a validated value object, never raw input.
 */
final class Profile
{
    public const MAX_HEADLINE = 140;

    public const MAX_SUMMARY = 2000;

    public const MAX_SKILLS = 100;

    public const MAX_EXPERIENCE = 30;

    public const MAX_EDUCATION = 20;

    public const MAX_LANGUAGES = 20;

    /**
     * @param  list<Skill>  $skills
     * @param  list<ExperienceEntry>  $experience
     * @param  list<EducationEntry>  $education
     * @param  list<LanguageEntry>  $languages
     */
    private function __construct(
        public readonly Ulid $id,
        public readonly Ulid $userId,
        public readonly ContactInfo $contact,
        public readonly ?string $headline,
        public readonly ?string $summary,
        public readonly array $skills,
        public readonly array $experience,
        public readonly array $education,
        public readonly array $languages,
        public readonly ?ProfileStep $currentStep = null,
        public readonly int $completionPercent = 0,
    ) {}

    /**
     * Assemble a profile from already-validated value objects.
     *
     * @param  list<Skill>  $skills
     * @param  list<ExperienceEntry>  $experience
     * @param  list<EducationEntry>  $education
     * @param  list<LanguageEntry>  $languages
     *
     * @throws InvalidProfile
     */
    public static function fromParts(
        Ulid $id,
        Ulid $userId,
        ContactInfo $contact,
        ?string $headline = null,
        ?string $summary = null,
        array $skills = [],
        array $experience = [],
        array $education = [],
        array $languages = [],
        ?ProfileStep $currentStep = null,
    ): self {
        $headline = $headline === null || trim($headline) === '' ? null : trim($headline);
        $summary = $summary === null || trim($summary) === '' ? null : trim($summary);

        if ($headline !== null && mb_strlen($headline) > self::MAX_HEADLINE) {
            throw InvalidProfile::tooLong('headline', self::MAX_HEADLINE);
        }
        if ($summary !== null && mb_strlen($summary) > self::MAX_SUMMARY) {
            throw InvalidProfile::tooLong('summary', self::MAX_SUMMARY);
        }

        self::assertAll('skills', $skills, Skill::class, self::MAX_SKILLS);
        self::assertAll('experience', $experience, ExperienceEntry::class, self::MAX_EXPERIENCE);
        self::assertAll('education', $education, EducationEntry::class, self::MAX_EDUCATION);
        self::assertAll('languages', $languages, LanguageEntry::class, self::MAX_LANGUAGES);

        $profile = new self($id, $userId, $contact, $headline, $summary, array_values($skills), array_values($experience), array_values($education), array_values($languages), $currentStep);

        return new self($id, $userId, $contact, $headline, $summary, array_values($skills), array_values($experience), array_values($education), array_values($languages), $currentStep, ProfileCompletion::for($profile));
    }

    /**
     * Full-document replacement (matches PUT /api/profile semantics):
     * same identity, all-new content, re-validated on the way in.
     *
     * @param  list<Skill>  $skills
     * @param  list<ExperienceEntry>  $experience
     * @param  list<EducationEntry>  $education
     * @param  list<LanguageEntry>  $languages
     *
     * @throws InvalidProfile
     */
    public function replace(
        ContactInfo $contact,
        ?string $headline = null,
        ?string $summary = null,
        array $skills = [],
        array $experience = [],
        array $education = [],
        array $languages = [],
        ?ProfileStep $currentStep = null,
    ): self {
        return self::fromParts(
            $this->id,
            $this->userId,
            $contact,
            $headline,
            $summary,
            $skills,
            $experience,
            $education,
            $languages,
            // An omitted step keeps the stored resume point.
            $currentStep ?? $this->currentStep,
        );
    }

    /**
     * @param  list<mixed>  $items
     *
     * @throws InvalidProfile
     */
    private static function assertAll(string $field, array $items, string $expected, int $max): void
    {
        if (count($items) > $max) {
            throw InvalidProfile::tooMany($field, $max);
        }

        foreach ($items as $item) {
            if (! $item instanceof $expected) {
                throw InvalidProfile::blankValue($field);
            }
        }
    }
}
