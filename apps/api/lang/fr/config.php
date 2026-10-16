<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Config context — French strings
|--------------------------------------------------------------------------
|
| Chaque clé du contexte Config doit exister ici ET dans chaque autre
| locale prise en charge. Clé manquante = fonctionnalité incomplète.
|
*/

return [
    'errors' => [
        'blank_value' => 'Le champ :field ne doit pas être vide.',
        'too_long' => 'Le champ :field ne doit pas dépasser :max caractères.',
        'bad_url' => 'Le champ :field doit être une URL https (:value).',
        'unknown_level' => 'La valeur :field n\'est pas reconnue (:value).',
        'invalid_value' => 'La valeur :field est invalide (:value).',
        'validation_failed' => 'Les données fournies sont invalides.',
        'name_taken' => 'Une source nommée « :name » existe déjà dans votre registre.',
        'url_taken' => 'Cette URL existe déjà dans votre registre.',
        'not_found' => 'Aucune source avec l\'id :id n\'a été trouvée.',
    ],
    'enums' => [
        'source_type' => [
            'search_engine' => 'Moteur de recherche',
            'board' => 'Site d\'emploi',
            'ats' => 'ATS direct',
            'career_page' => 'Page carrière',
        ],
        'source_priority' => [
            'T1' => 'T1 (prioritaire)',
            'T2' => 'T2',
            'T3' => 'T3',
        ],
    ],
    'validation' => [
        'name_required' => 'Veuillez nommer la source.',
        'name_max' => 'Gardez le nom à :max caractères ou moins.',
        'url_required' => 'Veuillez ajouter l\'URL de la source.',
        'url_invalid' => 'Cette URL ne semble pas valide.',
        'url_max' => 'Gardez l\'URL à :max caractères ou moins.',
        'url_https' => 'L\'URL doit commencer par https://.',
        'type_required' => 'Veuillez choisir un type de source.',
        'type_in' => 'Choisissez un type de source listé.',
        'priority_required' => 'Veuillez choisir un niveau de priorité.',
        'priority_in' => 'Choisissez un niveau de priorité listé.',
        'country_required' => 'Veuillez choisir un périmètre pays.',
        'country_max' => 'Gardez le code pays à :max caractères ou moins.',
        'country_invalid' => 'Utilisez GLOBAL ou un code pays à 2 lettres.',
        'enabled_required' => 'Veuillez définir l\'indicateur d\'activation.',
        'enabled_boolean' => 'L\'indicateur d\'activation doit être vrai ou faux.',
        'search_max' => 'Gardez la recherche à :max caractères ou moins.',
        'page_integer' => 'La page doit être un nombre.',
        'page_min' => 'La page commence à 1.',
    ],
];
