<?php

declare(strict_types=1);

namespace Src\Config\Presentation\Http\Requests;

/**
 * Validates "Save source" full replacement (Stitch edit drawer).
 *
 * Owner-only via SourcePolicy on the existing row. A missing id falls
 * through (true) so the handler answers 404 instead of 403.
 */
final class UpdateSourceRequest extends BaseSourceRequest
{
    public function authorize(): bool
    {
        $existing = $this->ownedSource();

        return $existing === null || $this->user()->can('update', $existing);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return SourceBodyRules::rules();
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return SourceBodyRules::messages();
    }
}
