<?php

declare(strict_types=1);

namespace Src\Config\Presentation\Http\Requests;

use Src\Shared\Application\Validation\ValidationSpec;

/**
 * Validates a full source document for create and replace (SPECS
 * FR-38/FR-39, Stitch edit drawer: every field always travels).
 *
 * Rules and messages come from shared/validation/sources.json — one
 * edit updates Laravel and the SPA yup schemas together. Two shape
 * rules the shared DSL cannot express are merged here as documented
 * exceptions and re-enforced by the Domain value objects: https-only
 * URL and GLOBAL-or-ISO country.
 */
final class SourceBodyRules
{
    private function __construct() {}

    /**
     * @return array<string, mixed>
     */
    public static function rules(): array
    {
        $spec = ValidationSpec::section('sources', 'source');

        return array_merge($spec['rules'], [
            // The generic url rule allows any scheme; registry fetches
            // require https (mockup error state says so explicitly).
            'url' => [...$spec['rules']['url'], 'starts_with:https://'],
            // Blank-tolerant GLOBAL default lives in the Domain; the
            // request only guards the stored shape (case-insensitive
            // so "de" passes and normalizes on the way in).
            'country_code' => [...$spec['rules']['country_code'], 'regex:/^(GLOBAL|[A-Z]{2})$/i'],
        ]);
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        $spec = ValidationSpec::section('sources', 'source');
        $keys = $spec['messageKeys'];

        $keys['url.starts_with'] = 'config.validation.url_https';
        $keys['country_code.regex'] = 'config.validation.country_invalid';

        return array_map(fn (string $key): string => __($key), $keys);
    }
}
