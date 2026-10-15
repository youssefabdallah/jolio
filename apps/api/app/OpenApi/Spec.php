<?php

declare(strict_types=1);

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Info(title: 'Jolio API', version: '1.0.0', description: 'AI-powered job folio (SPECS v1.0).')]
#[OA\Server(url: 'http://localhost:8000', description: 'Local Docker stack')]
/**
 * OpenAPI root: info plus schemas shared by all contexts.
 */
final class Spec
{
    private function __construct() {}
}

#[OA\Schema(
    schema: 'ErrorResponse',
    required: ['error'],
    properties: [
        new OA\Property(
            property: 'error',
            type: 'object',
            required: ['code', 'message'],
            properties: [
                new OA\Property(property: 'code', type: 'string', example: 'EMAIL_TAKEN'),
                new OA\Property(property: 'message', type: 'string', example: 'An account with this email address already exists.'),
                new OA\Property(property: 'details', type: 'object', nullable: true),
            ],
        ),
    ],
)]
/**
 * Uniform API error shape rendered centrally for Domain violations.
 */
final class ErrorResponse
{
    private function __construct() {}
}

#[OA\Schema(
    schema: 'AuthResponse',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
            type: 'object',
            required: ['user', 'token'],
            properties: [
                new OA\Property(
                    property: 'user',
                    type: 'object',
                    required: ['id', 'display_name', 'email', 'provider'],
                    properties: [
                        new OA\Property(property: 'id', type: 'string', example: '01JABCD1234EFGH5678JKLMNP'),
                        new OA\Property(property: 'display_name', type: 'string', example: 'Alex Dev'),
                        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'alex@dev.internal'),
                        new OA\Property(property: 'provider', type: 'string', enum: ['local', 'google'], example: 'local'),
                        new OA\Property(property: 'avatar_url', type: 'string', nullable: true),
                    ],
                ),
                new OA\Property(property: 'token', type: 'string', example: '1|aBcDeFgHiJkLmNoPqRsTuVwXyZ'),
            ],
        ),
    ],
)]
/**
 * Successful authentication payload: the user plus a one-time token.
 */
final class AuthResponse
{
    private function __construct() {}
}

#[OA\Schema(
    schema: 'ProfileResponse',
    required: ['id', 'contact'],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: '01JABCD1234EFGH5678JKLMNP'),
        new OA\Property(
            property: 'contact',
            type: 'object',
            required: ['full_name'],
            properties: [
                new OA\Property(property: 'full_name', type: 'string', example: 'Alex Dev'),
                new OA\Property(property: 'email', type: 'string', format: 'email', nullable: true),
                new OA\Property(property: 'phone', type: 'string', nullable: true),
                new OA\Property(property: 'city', type: 'string', nullable: true),
                new OA\Property(property: 'country', type: 'string', nullable: true),
                new OA\Property(property: 'website', type: 'string', nullable: true),
            ],
        ),
        new OA\Property(property: 'headline', type: 'string', maxLength: 140, nullable: true),
        new OA\Property(property: 'summary', type: 'string', maxLength: 2000, nullable: true),
        new OA\Property(property: 'skills', type: 'array', nullable: true, items: new OA\Items(type: 'object')),
        new OA\Property(property: 'experience', type: 'array', nullable: true, items: new OA\Items(type: 'object')),
        new OA\Property(property: 'education', type: 'array', nullable: true, items: new OA\Items(type: 'object')),
        new OA\Property(property: 'languages', type: 'array', nullable: true, items: new OA\Items(type: 'object')),
        new OA\Property(property: 'current_step', type: 'string', nullable: true, enum: ['contact', 'headline', 'skills', 'experience', 'education', 'languages', 'review']),
        new OA\Property(property: 'completion_percent', type: 'integer', minimum: 0, maximum: 100),
    ],
)]
/**
 * Candidate profile document returned by PUT /api/profile.
 */
final class ProfileResponse
{
    private function __construct() {}
}
