<?php

declare(strict_types=1);

namespace Src\Profile\Domain\Services;

use Src\Profile\Domain\Entities\Profile;

/**
 * Profile completion score (0–100) from filled sections.
 *
 * Weights mirror tailoring value: contact and experience carry the
 * most, summary the least. A section counts only when its required
 * fields hold real content — never for merely existing. Computed
 * server-side on every save and stored; client numbers are ignored.
 */
final class ProfileCompletion
{
    private const WEIGHTS = [
        'contact' => 20,
        'headline' => 10,
        'summary' => 5,
        'skills' => 15,
        'experience' => 25,
        'education' => 10,
        'languages' => 15,
    ];

    public static function totalWeight(): int
    {
        return array_sum(self::WEIGHTS);
    }

    public static function for(Profile $profile): int
    {
        $score = 0;

        $contact = $profile->contact;
        if ($contact->fullName !== '' && $contact->email !== null && $contact->phone !== null
            && $contact->city !== null && $contact->country !== null) {
            $score += self::WEIGHTS['contact'];
        }

        if ($profile->headline !== null) {
            $score += self::WEIGHTS['headline'];
        }

        if ($profile->summary !== null) {
            $score += self::WEIGHTS['summary'];
        }

        foreach ($profile->skills as $skill) {
            if ($skill->group !== '' && $skill->name !== '') {
                $score += self::WEIGHTS['skills'];

                break;
            }
        }

        foreach ($profile->experience as $entry) {
            if ($entry->role !== '' && $entry->company !== '' && $entry->startDate !== '') {
                $score += self::WEIGHTS['experience'];

                break;
            }
        }

        foreach ($profile->education as $entry) {
            if ($entry->institution !== '' && $entry->degree !== '') {
                $score += self::WEIGHTS['education'];

                break;
            }
        }

        foreach ($profile->languages as $entry) {
            if ($entry->language !== '') {
                $score += self::WEIGHTS['languages'];

                break;
            }
        }

        return min(100, $score);
    }
}
