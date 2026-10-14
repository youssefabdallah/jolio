<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Identity context — French strings
|--------------------------------------------------------------------------
|
| Chaque clé du contexte Identity doit exister ici ET dans chaque autre
| locale prise en charge. Clé manquante = fonctionnalité incomplète.
|
*/

return [
    'errors' => [
        'invalid_email' => "L'adresse email est invalide.",
        'blank_display_name' => 'Le nom affiché ne doit pas être vide.',
        'local_without_password' => 'Un compte local nécessite un mot de passe.',
        'oauth_without_provider_id' => 'Le compte OAuth ne contient pas son identifiant fournisseur.',
        'oauth_with_password' => 'Un compte OAuth ne doit pas avoir de mot de passe local.',
        'oauth_with_local_provider' => "L'inscription OAuth nécessite un fournisseur externe.",
        'email_taken' => 'Un compte avec cette adresse email existe déjà.',
        'invalid_credentials' => 'Ces identifiants ne correspondent pas à nos dossiers.',
        'oauth_not_configured' => "La connexion OAuth n'est pas encore configurée.",
        'oauth_failed' => 'La négociation avec le fournisseur a échoué. Veuillez réessayer.',
        'validation_failed' => 'Les données fournies sont invalides.',
    ],
    'validation' => [
        'display_name_required' => 'Veuillez indiquer votre nom affiché.',
        'email_required' => 'Une adresse email est requise.',
        'email_invalid' => 'Cette adresse email semble invalide.',
        'email_taken' => 'Un compte avec cette adresse email existe déjà.',
        'password_required' => 'Un mot de passe est requis.',
        'password_min' => 'Utilisez au moins :min caractères pour votre mot de passe.',
        'password_confirmed' => 'La confirmation du mot de passe ne correspond pas.',
        'provider_unsupported' => "Ce fournisseur OAuth n'est pas pris en charge.",
        'attributes' => [
            'display_name' => 'nom affiché',
            'email' => 'adresse email',
            'password' => 'mot de passe',
        ],
    ],
];
