<?php

declare(strict_types=1);

namespace Src\Identity\Presentation\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

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
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email:rfc', 'max:255'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => __('identity.validation.email_required'),
            'email.email' => __('identity.validation.email_invalid'),
            'password.required' => __('identity.validation.password_required'),
        ];
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
