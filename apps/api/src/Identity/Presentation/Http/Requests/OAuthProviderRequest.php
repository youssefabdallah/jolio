<?php

declare(strict_types=1);

namespace Src\Identity\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Src\Identity\Domain\Enums\AuthProvider;

/**
 * Validates the {provider} route parameter on OAuth endpoints.
 */
class OAuthProviderRequest extends FormRequest
{
    /**
     * OAuth handshake entry points are public by nature.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['provider' => $this->route('provider')]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'provider' => ['required', 'string', Rule::in([AuthProvider::Google->value])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'provider.in' => __('identity.validation.provider_unsupported'),
        ];
    }
}
