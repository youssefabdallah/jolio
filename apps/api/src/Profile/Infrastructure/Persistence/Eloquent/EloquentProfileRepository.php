<?php

declare(strict_types=1);

namespace Src\Profile\Infrastructure\Persistence\Eloquent;

use Src\Profile\Domain\Entities\Profile as DomainProfile;
use Src\Profile\Domain\Enums\ProfileStep;
use Src\Profile\Domain\Repositories\ProfileRepository;
use Src\Profile\Domain\ValueObjects\ContactInfo;
use Src\Profile\Domain\ValueObjects\EducationEntry;
use Src\Profile\Domain\ValueObjects\ExperienceEntry;
use Src\Profile\Domain\ValueObjects\LanguageEntry;
use Src\Profile\Domain\ValueObjects\Skill;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Eloquent implementation of the Domain ProfileRepository contract.
 *
 * Maps between the pure Domain aggregate and JSON-column rows. Stored
 * rows always satisfy the entity invariants (written only through the
 * validated handler), so hydration assumes well-formed sections.
 */
final class EloquentProfileRepository implements ProfileRepository
{
    public function findById(Ulid $id): ?DomainProfile
    {
        $model = Profile::query()->where('id', (string) $id)->first();

        return $model === null ? null : $this->toDomain($model);
    }

    public function findByUserId(Ulid $userId): ?DomainProfile
    {
        $model = Profile::query()->where('user_id', (string) $userId)->first();

        return $model === null ? null : $this->toDomain($model);
    }

    public function existsForUser(Ulid $userId): bool
    {
        return Profile::query()->where('user_id', (string) $userId)->exists();
    }

    public function save(DomainProfile $profile): void
    {
        Profile::query()->updateOrCreate(
            ['id' => (string) $profile->id],
            [
                'user_id' => (string) $profile->userId,
                'contact' => $this->contactToRow($profile->contact),
                'headline' => $profile->headline,
                'summary' => $profile->summary,
                'skills' => array_map($this->skillToRow(...), $profile->skills),
                'experience' => array_map($this->experienceToRow(...), $profile->experience),
                'education' => array_map($this->educationToRow(...), $profile->education),
                'languages' => array_map($this->languageToRow(...), $profile->languages),
                'current_step' => $profile->currentStep?->value,
                'completion_percent' => $profile->completionPercent,
            ],
        );
    }

    private function toDomain(Profile $model): DomainProfile
    {
        /** @var array<string, mixed> $contact */
        $contact = $model->contact ?? [];
        $step = is_string($model->current_step) ? ProfileStep::tryFrom($model->current_step) : null;

        return DomainProfile::fromParts(
            Ulid::fromString($model->id),
            Ulid::fromString($model->user_id),
            ContactInfo::fromPrimitives(
                (string) ($contact['full_name'] ?? ''),
                isset($contact['email']) ? (string) $contact['email'] : null,
                isset($contact['phone']) ? (string) $contact['phone'] : null,
                isset($contact['city']) ? (string) $contact['city'] : null,
                isset($contact['country']) ? (string) $contact['country'] : null,
                isset($contact['website']) ? (string) $contact['website'] : null,
            ),
            $model->headline,
            $model->summary,
            array_map(fn (array $row): Skill => Skill::fromPrimitives(
                (string) ($row['group'] ?? ''),
                (string) ($row['name'] ?? ''),
                (string) ($row['level'] ?? ''),
            ), $model->skills ?? []),
            array_map(fn (array $row): ExperienceEntry => ExperienceEntry::fromPrimitives(
                (string) ($row['role'] ?? ''),
                (string) ($row['company'] ?? ''),
                isset($row['location']) ? (string) $row['location'] : null,
                (string) ($row['start_date'] ?? ''),
                isset($row['end_date']) ? (string) $row['end_date'] : null,
                is_array($row['bullets'] ?? null) ? $row['bullets'] : [],
            ), $model->experience ?? []),
            array_map(fn (array $row): EducationEntry => EducationEntry::fromPrimitives(
                (string) ($row['institution'] ?? ''),
                (string) ($row['degree'] ?? ''),
                isset($row['field']) ? (string) $row['field'] : null,
                isset($row['start_year']) ? (int) $row['start_year'] : null,
                isset($row['end_year']) ? (int) $row['end_year'] : null,
            ), $model->education ?? []),
            array_map(fn (array $row): LanguageEntry => LanguageEntry::fromPrimitives(
                (string) ($row['language'] ?? ''),
                (string) ($row['level'] ?? ''),
            ), $model->languages ?? []),
            // Completion recomputes deterministically from the same
            // sections, so weight changes heal stored rows on read.
            $step,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function contactToRow(ContactInfo $contact): array
    {
        return array_filter([
            'full_name' => $contact->fullName,
            'email' => $contact->email,
            'phone' => $contact->phone,
            'city' => $contact->city,
            'country' => $contact->country,
            'website' => $contact->website,
        ], fn (mixed $value): bool => $value !== null);
    }

    /**
     * @return array<string, mixed>
     */
    private function skillToRow(Skill $skill): array
    {
        return ['group' => $skill->group, 'name' => $skill->name, 'level' => $skill->level->value];
    }

    /**
     * @return array<string, mixed>
     */
    private function experienceToRow(ExperienceEntry $entry): array
    {
        return array_filter([
            'role' => $entry->role,
            'company' => $entry->company,
            'location' => $entry->location,
            'start_date' => $entry->startDate,
            'end_date' => $entry->endDate,
            'bullets' => $entry->bullets,
        ], fn (mixed $value): bool => $value !== null);
    }

    /**
     * @return array<string, mixed>
     */
    private function educationToRow(EducationEntry $entry): array
    {
        return array_filter([
            'institution' => $entry->institution,
            'degree' => $entry->degree,
            'field' => $entry->field,
            'start_year' => $entry->startYear,
            'end_year' => $entry->endYear,
        ], fn (mixed $value): bool => $value !== null);
    }

    /**
     * @return array<string, mixed>
     */
    private function languageToRow(LanguageEntry $entry): array
    {
        return ['language' => $entry->language, 'level' => $entry->level->value];
    }
}
