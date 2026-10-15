<?php

declare(strict_types=1);

namespace Src\Identity\Presentation\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Src\Shared\Application\Validation\ValidationSpec;

/**
 * Validates local-credential sign-in input (public route).
 */
class LoginRequest extends FormRequest
{
    /**
     * Sign-in is open: anyone may attempt authentication.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Rules and messages both come from shared/validation/auth.json —
     * one edit updates Laravel and the SPA yup schemas together.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return ValidationSpec::section('auth', 'login')['rules'];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $keys = ValidationSpec::section('auth', 'login')['messageKeys'];

        return array_map(fn (string $key): string => __($key), $keys);
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'email' => __('identity.validation.attributes.email'),
            'password' => __('identity.validation.attributes.password'),
        ];
    }

    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(response()->json([
            'error' => [
                'code' => 'VALIDATION_FAILED',
                'message' => __('identity.errors.validation_failed'),
                'details' => $validator->errors()->toArray(),
            ],
        ], 422));
    }
}
