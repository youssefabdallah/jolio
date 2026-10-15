<?php

declare(strict_types=1);

namespace Tests\Unit\Profile;

use PHPUnit\Framework\TestCase;
use Src\Profile\Domain\Enums\LanguageLevel;
use Src\Profile\Domain\Enums\SkillLevel;
use Src\Profile\Domain\Exceptions\InvalidProfile;
use Src\Profile\Domain\ValueObjects\ContactInfo;
use Src\Profile\Domain\ValueObjects\EducationEntry;
use Src\Profile\Domain\ValueObjects\ExperienceEntry;
use Src\Profile\Domain\ValueObjects\LanguageEntry;
use Src\Profile\Domain\ValueObjects\Skill;

/**
 * Profile value objects accept honest input and refuse the rest.
 */
final class ProfileValueObjectsTest extends TestCase
{
    public function test_parses_skill_levels_case_insensitively(): void
    {
        $this->assertSame(SkillLevel::Expert, Skill::fromPrimitives('Backend', 'PHP', 'Expert')->level);
        $this->assertSame('profile.enums.skill_level.expert', SkillLevel::Expert->translationKey());
    }

    public function test_rejects_unknown_skill_levels_and_blank_names(): void
    {
        $this->expectException(InvalidProfile::class);

        Skill::fromPrimitives('Backend', 'PHP', 'wizard');
    }

    public function test_accepts_open_ended_experience_and_rejects_time_travel(): void
    {
        $open = ExperienceEntry::fromPrimitives('Dev', 'Acme', null, '2021-03', null);
        $this->assertNull($open->endDate);

        $this->expectException(InvalidProfile::class);

        ExperienceEntry::fromPrimitives('Dev', 'Acme', null, '2021-03', '2020-12');
    }

    public function test_rejects_malformed_experience_dates_and_bullet_dumps(): void
    {
        try {
            ExperienceEntry::fromPrimitives('Dev', 'Acme', null, 'March 2021', null);
            $this->fail('Malformed start date was accepted.');
        } catch (InvalidProfile $exception) {
            $this->assertSame('INVALID_PROFILE_VALUE', $exception->errorCode->value);
        }

        $this->expectException(InvalidProfile::class);

        ExperienceEntry::fromPrimitives('Dev', 'Acme', null, '2021-03', null, array_fill(0, 21, 'Did things.'));
    }

    public function test_parses_cefr_levels_and_rejects_school_grades(): void
    {
        $this->assertSame(LanguageLevel::C1, LanguageEntry::fromPrimitives('English', 'C1')->level);
        $this->assertSame(LanguageLevel::Native, LanguageEntry::fromPrimitives('French', 'native')->level);

        $this->expectException(InvalidProfile::class);

        LanguageEntry::fromPrimitives('English', 'fluent-ish');
    }

    public function test_rejects_impossible_education_years(): void
    {
        $this->expectException(InvalidProfile::class);

        EducationEntry::fromPrimitives('TU Berlin', 'BSc', null, 2018, 2014);
    }

    public function test_rejects_bad_contact_email_and_website(): void
    {
        try {
            ContactInfo::fromPrimitives('Alex Dev', 'not-an-email');
            $this->fail('Bad contact email was accepted.');
        } catch (InvalidProfile $exception) {
            $this->assertSame('INVALID_PROFILE_VALUE', $exception->errorCode->value);
        }

        $this->expectException(InvalidProfile::class);

        ContactInfo::fromPrimitives('Alex Dev', null, null, null, null, 'ftp://files.example/cv.pdf');
    }
}
