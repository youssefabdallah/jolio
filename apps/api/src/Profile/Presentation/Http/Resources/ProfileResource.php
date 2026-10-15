<?php

declare(strict_types=1);

namespace Src\Profile\Presentation\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Src\Profile\Domain\Entities\Profile;

/**
 * Public shape of the candidate profile. Flat sections mirror the
 * stored document; levels serialize as their backed values.
 *
 * @mixin Profile
 */
class ProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Profile $profile */
        $profile = $this->resource;

        return [
            'id' => (string) $profile->id,
            'contact' => [
                'full_name' => $profile->contact->fullName,
                'email' => $profile->contact->email,
                'phone' => $profile->contact->phone,
                'city' => $profile->contact->city,
                'country' => $profile->contact->country,
                'website' => $profile->contact->website,
            ],
            'headline' => $profile->headline,
            'summary' => $profile->summary,
            'skills' => array_map(
                fn ($skill): array => ['group' => $skill->group, 'name' => $skill->name, 'level' => $skill->level->value],
                $profile->skills,
            ),
            'experience' => array_map(
                fn ($entry): array => array_filter([
                    'role' => $entry->role,
                    'company' => $entry->company,
                    'location' => $entry->location,
                    'start_date' => $entry->startDate,
                    'end_date' => $entry->endDate,
                    'bullets' => $entry->bullets,
                ], fn (mixed $value): bool => $value !== null),
                $profile->experience,
            ),
            'education' => array_map(
                fn ($entry): array => array_filter([
                    'institution' => $entry->institution,
                    'degree' => $entry->degree,
                    'field' => $entry->field,
                    'start_year' => $entry->startYear,
                    'end_year' => $entry->endYear,
                ], fn (mixed $value): bool => $value !== null),
                $profile->education,
            ),
            'languages' => array_map(
                fn ($entry): array => ['language' => $entry->language, 'level' => $entry->level->value],
                $profile->languages,
            ),
            'current_step' => $profile->currentStep?->value,
            'completion_percent' => $profile->completionPercent,
        ];
    }
}
