<?php

declare(strict_types=1);

namespace Src\Profile\Application\Commands;

use Illuminate\Support\Facades\DB;
use Src\Profile\Domain\Entities\Profile;
use Src\Profile\Domain\Enums\ProfileStep;
use Src\Profile\Domain\Exceptions\InvalidProfile;
use Src\Profile\Domain\Repositories\ProfileRepository;
use Src\Profile\Domain\ValueObjects\ContactInfo;
use Src\Profile\Domain\ValueObjects\EducationEntry;
use Src\Profile\Domain\ValueObjects\ExperienceEntry;
use Src\Profile\Domain\ValueObjects\LanguageEntry;
use Src\Profile\Domain\ValueObjects\Skill;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Upserts the caller's profile in one transaction (SPECS FR-4).
 *
 * First save creates the row; later saves replace the whole document.
 * Primitive sections become value objects here, so malformed input
 * fails as InvalidProfile (rendered 422 centrally) before any write.
 */
final readonly class UpdateProfileHandler
{
    public function __construct(private ProfileRepository $profiles) {}

    /**
     * @throws InvalidProfile
     */
    public function handle(UpdateProfileCommand $command): Profile
    {
        return DB::transaction(function () use ($command): Profile {
            $existing = $this->profiles->findByUserId($command->userId);

            // A profile starts with its contact block: there is no
            // honest placeholder name, so creating without one fails
            // instead of inventing data.
            if ($existing === null && $command->contact === null) {
                throw InvalidProfile::blankValue('contact');
            }

            $contact = $command->contact === null
                ? $existing->contact
                : ContactInfo::fromPrimitives(
                    (string) ($command->contact['full_name'] ?? ''),
                    isset($command->contact['email']) ? (string) $command->contact['email'] : null,
                    isset($command->contact['phone']) ? (string) $command->contact['phone'] : null,
                    isset($command->contact['city']) ? (string) $command->contact['city'] : null,
                    isset($command->contact['country']) ? (string) $command->contact['country'] : null,
                    isset($command->contact['website']) ? (string) $command->contact['website'] : null,
                );

            $skills = $command->skills === null
                ? ($existing?->skills ?? [])
                : array_map(
                    fn (mixed $row): Skill => Skill::fromPrimitives(
                        (string) ((array) $row)['group'] ?? '',
                        (string) ((array) $row)['name'] ?? '',
                        (string) ((array) $row)['level'] ?? '',
                    ),
                    $command->skills,
                );

            $experience = $command->experience === null
                ? ($existing?->experience ?? [])
                : array_map(
                    function (mixed $row): ExperienceEntry {
                        $row = (array) $row;

                        return ExperienceEntry::fromPrimitives(
                            (string) ($row['role'] ?? ''),
                            (string) ($row['company'] ?? ''),
                            isset($row['location']) ? (string) $row['location'] : null,
                            (string) ($row['start_date'] ?? ''),
                            isset($row['end_date']) ? (string) $row['end_date'] : null,
                            is_array($row['bullets'] ?? null) ? $row['bullets'] : [],
                        );
                    },
                    $command->experience,
                );

            $education = $command->education === null
                ? ($existing?->education ?? [])
                : array_map(
                    function (mixed $row): EducationEntry {
                        $row = (array) $row;

                        return EducationEntry::fromPrimitives(
                            (string) ($row['institution'] ?? ''),
                            (string) ($row['degree'] ?? ''),
                            isset($row['field']) ? (string) $row['field'] : null,
                            isset($row['start_year']) ? (int) $row['start_year'] : null,
                            isset($row['end_year']) ? (int) $row['end_year'] : null,
                        );
                    },
                    $command->education,
                );

            $languages = $command->languages === null
                ? ($existing?->languages ?? [])
                : array_map(
                    fn (mixed $row): LanguageEntry => LanguageEntry::fromPrimitives(
                        (string) ((array) $row)['language'] ?? '',
                        (string) ((array) $row)['level'] ?? '',
                    ),
                    $command->languages,
                );

            // The resume point is UI state, not candidate truth: unknown
            // values fall back to the stored step instead of failing.
            $step = $command->currentStep === null ? null : ProfileStep::tryFrom($command->currentStep);

            $profile = $existing === null
                ? Profile::fromParts(
                    Ulid::generate(),
                    $command->userId,
                    $contact,
                    $command->headline,
                    $command->summary,
                    $skills,
                    $experience,
                    $education,
                    $languages,
                    $step,
                )
                : $existing->replace(
                    $contact,
                    $command->headline ?? $existing->headline,
                    $command->summary ?? $existing->summary,
                    $skills,
                    $experience,
                    $education,
                    $languages,
                    $step,
                );

            $this->profiles->save($profile);

            return $profile;
        });
    }
}
