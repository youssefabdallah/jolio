<?php

declare(strict_types=1);

namespace Src\Config\Presentation\Http\Requests;

/**
 * Validates the registry list query string (filter tabs + search box).
 *
 * Every filter is optional; unknown type values match nothing rather
 * than failing, and pagination stays bounded.
 */
final class ListSourcesRequest extends BaseSourceRequest
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
        return [
            'type' => ['nullable', 'string', 'in:search_engine,board,ats,career_page'],
            'is_enabled' => ['nullable', 'boolean'],
            'search' => ['nullable', 'string', 'max:120'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'type.in' => __('config.validation.type_in'),
            'is_enabled.boolean' => __('config.validation.enabled_boolean'),
            'search.max' => __('config.validation.search_max'),
            'page.integer' => __('config.validation.page_integer'),
            'page.min' => __('config.validation.page_min'),
        ];
    }
}
