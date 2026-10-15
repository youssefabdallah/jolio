<?php

declare(strict_types=1);

namespace Src\Profile\Presentation\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Src\Profile\Domain\Enums\ProfileStep;
use Src\Profile\Infrastructure\Persistence\Eloquent\Profile;
use Src\Shared\Application\Validation\ValidationSpec;

/**
 * Validates a full-document profile replacement (SPECS FR-4).
 *
 * Authorization is owner-only: anyone authenticated may create their
 * own (first PUT), but an existing row passes through ProfilePolicy,
 * so user A can never rewrite user B's profile — not even by
 * guessing its id, because the lookup is scoped to the token's user.
 */
class UpdateProfileRequest extends FormRequest
{
    /**
     * Profile sections known to the wizard. Review carries no fields —
     * its PUT only stamps the resume point.
     *
     * @var list<string>
     */
    private const SECTIONS = [
        'contact',
        'headline',
        'summary',
        'skills',
        'experience',
        'education',
        'languages',
    ];

    /**
     * Sections actually present (non-null) in the payload.
     *
     * @return list<string>
     */
    private function presentSections(): array
    {
        $present = [];
        foreach (self::SECTIONS as $section) {
            if ($this->input($section) !== null && ! in_array($section, $present, true)) {
                $present[] = $section;
            }
        }

        return $present;
    }

    public function authorize(): bool
    {
        $userId = (string) $this->user()->getAuthIdentifier();

        $existing = Profile::query()->where('user_id', $userId)->first();

        return $existing === null || $this->user()->can('update', $existing);
    }

    /**
     * Rules and messages both come from shared/validation/profile.json
     * — one edit updates Laravel and the SPA yup schemas together.
     * The dynamic year cap lives in the spec as an offset from the
     * current year, resolved per side.
     *
     * @return array<string, mixed>
     */
    /**
     * Step-scoped validation: only sections actually present in the
     * payload are validated — absent sections are left untouched,
     * never failed. The resume stamp (current_step) is UI state and
     * always validated itself, but it never selects the rules: what
     * is sent is what is checked. A stamp-only PUT validates nothing;
     * a stepless, sectionless PUT falls back to full-document
     * validation.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $present = $this->presentSections();

        $document = ValidationSpec::section('profile', 'profile');
        $wizard = ValidationSpec::section('profile', 'wizard');

        // A stamp-only PUT (review save) carries no sections and needs
        // no field rules; anything else without sections falls back to
        // full-document validation.
        if ($present === []) {
            $step = $this->input('current_step');
            if (is_string($step) && ProfileStep::tryFrom($step) !== null) {
                return $wizard['rules'];
            }

            return array_merge($document['rules'], $wizard['rules']);
        }

        $picked = ValidationSpec::pick('profile', 'profile', $present);

        return array_merge($picked['rules'], $wizard['rules']);
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $present = $this->presentSections();

        $document = ValidationSpec::section('profile', 'profile');
        $wizard = ValidationSpec::section('profile', 'wizard');

        if ($present === []) {
            $step = $this->input('current_step');
            $keys = (is_string($step) && ProfileStep::tryFrom($step) !== null)
                ? $wizard['messageKeys']
                : array_merge($document['messageKeys'], $wizard['messageKeys']);
        } else {
            $keys = array_merge(
                ValidationSpec::pick('profile', 'profile', $present)['messageKeys'],
                $wizard['messageKeys']
            );
        }

        return array_map(fn (string $key): string => __($key), $keys);
    }

    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(response()->json([
            'error' => [
                'code' => 'VALIDATION_FAILED',
                'message' => __('profile.errors.validation_failed'),
                'details' => $validator->errors()->toArray(),
            ],
        ], 422));
    }
}
