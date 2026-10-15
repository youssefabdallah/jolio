<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Profile context — French strings
|--------------------------------------------------------------------------
|
| Chaque clé du contexte Profile doit exister ici ET dans chaque autre
| locale prise en charge. Clé manquante = fonctionnalité incomplète.
|
*/

return [
    'errors' => [
        'blank_value' => 'Le champ :field ne doit pas être vide.',
        'too_long' => 'Le champ :field ne doit pas dépasser :max caractères.',
        'bad_date' => 'Le champ :field n\'est pas une date valide (:value).',
        'bad_email' => 'L\'adresse email est invalide (:value).',
        'bad_url' => 'Le champ :field doit être une URL http(s) (:value).',
        'end_before_start' => 'Le champ :field ne doit pas se terminer avant de commencer.',
        'unknown_level' => 'Le niveau :field n\'est pas reconnu (:value).',
        'too_many' => 'La section :field contient trop d\'entrées (max :max).',
        'validation_failed' => 'Les données fournies sont invalides.',
    ],
    'enums' => [
        'skill_level' => [
            'beginner' => 'Débutant',
            'intermediate' => 'Intermédiaire',
            'advanced' => 'Avancé',
            'expert' => 'Expert',
        ],
        'language_level' => [
            'a1' => 'A1',
            'a2' => 'A2',
            'b1' => 'B1',
            'b2' => 'B2',
            'c1' => 'C1',
            'c2' => 'C2',
            'native' => 'Langue maternelle',
        ],
    ],
    'validation' => [
        'contact_required' => 'Vos coordonnées sont requises.',
        'full_name_required' => 'Veuillez indiquer votre nom complet.',
        'email_required' => 'Veuillez partager votre email professionnel.',
        'phone_required' => 'Veuillez partager votre numéro de téléphone.',
        'phone_invalid' => 'Ce numéro de téléphone semble invalide.',
        'city_required' => 'Veuillez indiquer votre ville.',
        'country_required' => 'Veuillez indiquer votre pays.',
        'email_invalid' => 'Cette adresse email semble invalide.',
        'website_url' => 'Le site web doit être une URL valide.',
        'headline_required' => 'Veuillez ajouter un titre.',
        'summary_required' => 'Veuillez rédiger un court résumé.',
        'skills_required' => 'Ajoutez au moins une compétence.',
        'skills_min' => 'Ajoutez au moins une compétence.',
        'experience_required' => 'Ajoutez au moins un poste.',
        'experience_min' => 'Ajoutez au moins un poste.',
        'education_required' => 'Ajoutez au moins une formation.',
        'education_min' => 'Ajoutez au moins une formation.',
        'languages_required' => 'Ajoutez au moins une langue.',
        'languages_min' => 'Ajoutez au moins une langue.',
        'group_required' => 'Veuillez nommer le groupe de compétences.',
        'skill_name_required' => 'Veuillez nommer la compétence.',
        'skill_level_required' => 'Veuillez choisir un niveau.',
        'role_required' => 'Veuillez ajouter l\'intitulé du poste.',
        'company_required' => 'Veuillez nommer l\'entreprise.',
        'location_required' => 'Veuillez ajouter le lieu.',
        'start_date_required' => 'Veuillez ajouter la date de début.',
        'institution_required' => 'Veuillez nommer l\'établissement.',
        'degree_required' => 'Veuillez nommer le diplôme.',
        'field_required' => 'Veuillez ajouter le domaine d\'études.',
        'start_year_required' => 'Veuillez ajouter l\'année de début.',
        'language_required' => 'Veuillez nommer la langue.',
        'language_level_required' => 'Veuillez choisir un niveau de langue.',
        'step_invalid' => "Cette étape ne fait pas partie de l'éditeur.",
        'headline_max' => 'Gardez le titre à :max caractères ou moins.',
        'summary_max' => 'Gardez le résumé à :max caractères ou moins.',
        'skill_level_in' => 'Choisissez un niveau listé.',
        'start_date_format' => 'Utilisez AAAA-MM pour la date de début.',
        'end_date_format' => 'Utilisez AAAA-MM pour la date de fin.',
        'year_min' => 'Cette année est trop lointaine.',
        'year_max' => 'Cette année est trop future.',
        'language_level_in' => 'Choisissez un niveau de langue listé.',
    ],
];
