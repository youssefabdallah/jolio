<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Profile context — English strings
|--------------------------------------------------------------------------
|
| Every key referenced by the Profile bounded context must exist here AND
| in every other supported locale. Missing keys = incomplete feature.
|
*/

return [
    'errors' => [
        'blank_value' => 'The :field field must not be blank.',
        'too_long' => 'The :field field must not exceed :max characters.',
        'bad_date' => 'The :field field is not a valid date (:value).',
        'bad_email' => 'The email address is invalid (:value).',
        'bad_url' => 'The :field field must be an http(s) URL (:value).',
        'end_before_start' => 'The :field field must not end before it starts.',
        'unknown_level' => 'The :field level is not recognized (:value).',
        'too_many' => 'The :field section holds too many entries (max :max).',
        'validation_failed' => 'The given data was invalid.',
    ],
    'enums' => [
        'skill_level' => [
            'beginner' => 'Beginner',
            'intermediate' => 'Intermediate',
            'advanced' => 'Advanced',
            'expert' => 'Expert',
        ],
        'language_level' => [
            'a1' => 'A1',
            'a2' => 'A2',
            'b1' => 'B1',
            'b2' => 'B2',
            'c1' => 'C1',
            'c2' => 'C2',
            'native' => 'Native',
        ],
    ],
    'validation' => [
        'contact_required' => 'Your contact details are required.',
        'full_name_required' => 'Please tell us your full name.',
        'email_required' => 'Please share your work email.',
        'phone_required' => 'Please share your phone number.',
        'phone_invalid' => 'That phone number does not look valid.',
        'city_required' => 'Please tell us your city.',
        'country_required' => 'Please tell us your country.',
        'headline_required' => 'Please add a headline.',
        'summary_required' => 'Please write a short summary.',
        'skills_required' => 'Add at least one skill.',
        'skills_min' => 'Add at least one skill.',
        'experience_required' => 'Add at least one role.',
        'experience_min' => 'Add at least one role.',
        'education_required' => 'Add at least one education entry.',
        'education_min' => 'Add at least one education entry.',
        'languages_required' => 'Add at least one language.',
        'languages_min' => 'Add at least one language.',
        'group_required' => 'Please name the skill group.',
        'skill_name_required' => 'Please name the skill.',
        'skill_level_required' => 'Please pick a skill level.',
        'role_required' => 'Please add the job title.',
        'company_required' => 'Please name the company.',
        'location_required' => 'Please add the location.',
        'start_date_required' => 'Please add the start date.',
        'institution_required' => 'Please name the institution.',
        'degree_required' => 'Please name the degree.',
        'field_required' => 'Please add the field of study.',
        'start_year_required' => 'Please add the start year.',
        'language_required' => 'Please name the language.',
        'language_level_required' => 'Please pick a language level.',
        'step_invalid' => 'That step is not part of the editor.',
        'email_invalid' => 'That email address does not look right.',
        'website_url' => 'The website must be a valid URL.',
        'headline_max' => 'Keep the headline to :max characters or fewer.',
        'summary_max' => 'Keep the summary to :max characters or fewer.',
        'skill_level_in' => 'Pick a listed skill level.',
        'start_date_format' => 'Use YYYY-MM for the start date.',
        'end_date_format' => 'Use YYYY-MM for the end date.',
        'year_min' => 'That year is too far in the past.',
        'year_max' => 'That year is too far in the future.',
        'language_level_in' => 'Pick a listed language level.',
    ],
];
