<?php

declare(strict_types=1);

namespace Tests\Unit\Profile;

use PHPUnit\Framework\TestCase;
use Src\Profile\Domain\Entities\Profile;
use Src\Profile\Domain\Exceptions\InvalidProfile;
use Src\Profile\Domain\ValueObjects\ContactInfo;
use Src\Profile\Domain\ValueObjects\EducationEntry;
use Src\Profile\Domain\ValueObjects\ExperienceEntry;
use Src\Profile\Domain\ValueObjects\LanguageEntry;
use Src\Profile\Domain\ValueObjects\Skill;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * The Profile aggregate cannot be assembled in a rule-breaking state,
 * and full-document replacement keeps its identity.
 */
final class ProfileTest extends TestCase
{
    public function test_assembles_a_minimal_profile(): void
    {
        $profile = Profile::fromParts(
            Ulid::generate(),
            Ulid::generate(),
            ContactInfo::fromPrimitives('Alex Dev'),
        );

        $this->assertNull($profile->headline);
        $this->assertNull($profile->summary);
        $this->assertSame([], $profile->skills);
    }

    public function test_replacement_keeps_identity_and_revalidates(): void
    {
        $profile = Profile::fromParts(
            Ulid::generate(),
            Ulid::generate(),
            ContactInfo::fromPrimitives('Alex Dev'),
            'Old headline',
        );

        $replaced = $profile->replace(
            ContactInfo::fromPrimitives('Alex Dev II', 'alex@dev.internal'),
            'New headline',
            null,
            [Skill::fromPrimitives('Backend', 'PHP', 'advanced')],
        );

        $this->assertSame((string) $profile->id, (string) $replaced->id);
        $this->assertSame((string) $profile->userId, (string) $replaced->userId);
        $this->assertSame('New headline', $replaced->headline);
        $this->assertCount(1, $replaced->skills);
    }

    public function test_rejects_an_overlong_headline_or_summary(): void
    {
        $this->expectException(InvalidProfile::class);

        Profile::fromParts(
            Ulid::generate(),
            Ulid::generate(),
            ContactInfo::fromPrimitives('Alex Dev'),
            str_repeat('h', Profile::MAX_HEADLINE + 1),
        );
    }

    public function test_rejects_too_many_skills(): void
    {
        $skills = [];
        for ($i = 0; $i < Profile::MAX_SKILLS + 1; $i++) {
            $skills[] = Skill::fromPrimitives('Backend', "Skill {$i}", 'beginner');
        }

        $this->expectException(InvalidProfile::class);

        Profile::fromParts(Ulid::generate(), Ulid::generate(), ContactInfo::fromPrimitives('Alex Dev'), null, null, $skills);
    }

    public function test_rejects_raw_arrays_where_value_objects_belong(): void
    {
        $this->expectException(InvalidProfile::class);

        Profile::fromParts(
            Ulid::generate(),
            Ulid::generate(),
            ContactInfo::fromPrimitives('Alex Dev'),
            null,
            null,
            [['group' => 'Backend', 'name' => 'PHP', 'level' => 'advanced']],
        );
    }

    public function test_accepts_a_full_document(): void
    {
        $profile = Profile::fromParts(
            Ulid::generate(),
            Ulid::generate(),
            ContactInfo::fromPrimitives('Alex Dev', 'alex@dev.internal', null, 'Berlin', 'Germany', 'https://alex.dev'),
            'Senior PHP Developer',
            'Backend engineer with a Symfony focus.',
            [Skill::fromPrimitives('Backend', 'PHP', 'expert')],
            [ExperienceEntry::fromPrimitives('Senior Developer', 'Acme', 'Berlin', '2021-03', null, ['Shipped billing.'])],
            [EducationEntry::fromPrimitives('TU Berlin', 'BSc', 'Computer Science', 2014, 2018)],
            [LanguageEntry::fromPrimitives('English', 'c1')],
        );

        $this->assertCount(1, $profile->skills);
        $this->assertCount(1, $profile->experience);
        $this->assertCount(1, $profile->education);
        $this->assertCount(1, $profile->languages);
    }
}
