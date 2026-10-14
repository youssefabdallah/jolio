<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Identity context — English strings
|--------------------------------------------------------------------------
|
| Every key referenced by the Identity bounded context must exist here AND
| in every other supported locale. Missing keys = incomplete feature.
|
*/

return [
    'errors' => [
        'invalid_email' => 'The email address is invalid.',
        'blank_display_name' => 'The display name must not be blank.',
        'local_without_password' => 'A local account requires a password.',
        'oauth_without_provider_id' => 'The OAuth account is missing its provider identifier.',
        'oauth_with_password' => 'An OAuth account must not carry a local password.',
        'oauth_with_local_provider' => 'OAuth registration requires an external provider.',
        'email_taken' => 'An account with this email address already exists.',
        'invalid_credentials' => 'These credentials do not match our records.',
        'oauth_not_configured' => 'OAuth sign-in is not configured yet.',
        'oauth_failed' => 'The provider handshake failed. Please try again.',
        'validation_failed' => 'The given data was invalid.',
    ],
    'validation' => [
        'display_name_required' => 'Please tell us your display name.',
        'email_required' => 'An email address is required.',
        'email_invalid' => 'That email address does not look right.',
        'email_taken' => 'An account with this email address already exists.',
        'password_required' => 'A password is required.',
        'password_min' => 'Use at least :min characters for your password.',
        'password_confirmed' => 'The password confirmation does not match.',
        'provider_unsupported' => 'This OAuth provider is not supported.',
        'attributes' => [
            'display_name' => 'display name',
            'email' => 'email address',
            'password' => 'password',
        ],
    ],
];
