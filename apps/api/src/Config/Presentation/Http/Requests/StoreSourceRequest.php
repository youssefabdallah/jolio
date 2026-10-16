<?php

declare(strict_types=1);

namespace Src\Config\Presentation\Http\Requests;

/**
 * Validates "+ New source" (SPECS FR-39, US-302).
 *
 * Any authenticated user may add to their own registry: the user id
 * comes from the Sanctum token, so there is no foreign row to guard.
 */
final class StoreSourceRequest extends BaseSourceRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
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
