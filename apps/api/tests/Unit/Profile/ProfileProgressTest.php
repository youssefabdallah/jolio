<?php

declare(strict_types=1);

namespace Tests\Unit\Profile;

use PHPUnit\Framework\TestCase;
use Src\Profile\Domain\Entities\Profile;
use Src\Profile\Domain\Enums\ProfileStep;
use Src\Profile\Domain\Services\ProfileCompletion;
use Src\Profile\Domain\ValueObjects\ContactInfo;
use Src\Profile\Domain\ValueObjects\EducationEntry;
use Src\Profile\Domain\ValueObjects\ExperienceEntry;
use Src\Profile\Domain\ValueObjects\LanguageEntry;
use Src\Profile\Domain\ValueObjects\Skill;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Completion scoring and wizard resume state.
 */
final class ProfileProgressTest extends TestCase
{
    public function test_weights_cover_the_whole_scale(): void
    {
        $this->assertSame(100, ProfileCompletion::totalWeight());
    }

    public function test_empty_profile_scores_zero(): void
    {
        $profile = Profile::fromParts(
            Ulid::generate(),
            Ulid::generate(),
            ContactInfo::fromPrimitives('Alex Dev'),
        );

        $this->assertSame(0, $profile->completionPercent);
        $this->assertSame(0, ProfileCompletion::for($profile));
        $this->assertNull($profile->currentStep);
    }

    public function test_full_profile_scores_hundred(): void
    {
        $profile = $this->fullProfile();

        $this->assertSame(100, $profile->completionPercent);
    }

    public function test_partial_sections_do_not_count(): void
    {
        $profile = Profile::fromParts(
            Ulid::generate(),
            Ulid::generate(),
            ContactInfo::fromPrimitives('Alex Dev'),
            'Senior PHP Developer',
            null,
            [Skill::fromPrimitives('Backend', 'PHP', 'advanced')],
        );

        // Headline (10) + skills (15) = 25; empty summary, contact
        // details, experience, education, and languages add nothing.
        $this->assertSame(25, $profile->completionPercent);
    }

    public function test_resume_point_defaults_to_stored_and_steps_order(): void
    {
        $profile = $this->fullProfile();

        $this->assertSame(ProfileStep::Review, $profile->currentStep);

        $moved = $profile->replace(
            $profile->contact,
            $profile->headline,
            $profile->summary,
            $profile->skills,
            $profile->experience,
            $profile->education,
            $profile->languages,
            ProfileStep::Experience,
        );

        $this->assertSame(ProfileStep::Experience, $moved->currentStep);
        $this->assertSame(100, $moved->completionPercent);

        $this->assertSame(
            ['contact', 'headline', 'skills', 'experience', 'education', 'languages', 'review'],
            array_map(fn (ProfileStep $step): string => $step->value, ProfileStep::cases()),
        );
        $this->assertTrue(ProfileStep::Contact->order() < ProfileStep::Review->order());
    }

    private function fullProfile(): Profile
    {
        return Profile::fromParts(
            Ulid::generate(),
            Ulid::generate(),
            ContactInfo::fromPrimitives('Alex Dev', 'alex@dev.internal', '+1', 'Berlin', 'Germany', 'https://alex.dev'),
            'Senior PHP Developer',
            'Backend engineer.',
            [Skill::fromPrimitives('Backend', 'PHP', 'expert')],
            [ExperienceEntry::fromPrimitives('Senior Developer', 'Acme', 'Berlin', '2021-03', null, ['Shipped.'])],
            [EducationEntry::fromPrimitives('TU Berlin', 'BSc', 'CS', 2014, 2018)],
            [LanguageEntry::fromPrimitives('English', 'c1')],
            ProfileStep::Review,
        );
    }
}
