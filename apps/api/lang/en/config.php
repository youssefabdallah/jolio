<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Config context — English strings
|--------------------------------------------------------------------------
|
| Every key referenced by the Config bounded context must exist here AND
| in every other supported locale. Missing keys = incomplete feature.
|
*/

return [
    'errors' => [
        'blank_value' => 'The :field field must not be blank.',
        'too_long' => 'The :field field must not exceed :max characters.',
        'bad_url' => 'The :field field must be an https URL (:value).',
        'unknown_level' => 'The :field value is not recognized (:value).',
        'invalid_value' => 'The :field value is invalid (:value).',
        'validation_failed' => 'The given data was invalid.',
        'name_taken' => 'A source named ":name" is already in your registry.',
        'url_taken' => 'This URL is already in your registry.',
        'not_found' => 'No source with id :id was found.',
    ],
    'enums' => [
        'source_type' => [
            'search_engine' => 'Search engine',
            'board' => 'Job board',
            'ats' => 'Direct ATS',
            'career_page' => 'Career page',
        ],
        'source_priority' => [
            'T1' => 'T1 (first)',
            'T2' => 'T2',
            'T3' => 'T3',
        ],
    ],
    'validation' => [
        'name_required' => 'Please name the source.',
        'name_max' => 'Keep the name to :max characters or fewer.',
        'url_required' => 'Please add the source URL.',
        'url_invalid' => 'That URL does not look right.',
        'url_max' => 'Keep the URL to :max characters or fewer.',
        'url_https' => 'The URL must start with https://.',
        'type_required' => 'Please pick a source type.',
        'type_in' => 'Pick a listed source type.',
        'priority_required' => 'Please pick a priority tier.',
        'priority_in' => 'Pick a listed priority tier.',
        'country_required' => 'Please pick a country scope.',
        'country_max' => 'Keep the country code to :max characters or fewer.',
        'country_invalid' => 'Use GLOBAL or a 2-letter country code.',
        'enabled_required' => 'Please set the enabled flag.',
        'enabled_boolean' => 'The enabled flag must be true or false.',
        'search_max' => 'Keep the search to :max characters or fewer.',
        'page_integer' => 'Page must be a number.',
        'page_min' => 'Page starts at 1.',
    ],
];
