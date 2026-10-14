<?php

declare(strict_types=1);

namespace Src\Identity\Presentation\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Validates local-credential registration input (public route).
 */
class RegisterRequest extends FormRequest
{
    /**
     * Registration is open: anyone may create the single-tenant account.
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
            'display_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'display_name.required' => __('identity.validation.display_name_required'),
            'email.required' => __('identity.validation.email_required'),
            'email.email' => __('identity.validation.email_invalid'),
            'email.unique' => __('identity.validation.email_taken'),
            'password.required' => __('identity.validation.password_required'),
            'password.min' => __('identity.validation.password_min'),
            'password.confirmed' => __('identity.validation.password_confirmed'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'display_name' => __('identity.validation.attributes.display_name'),
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
