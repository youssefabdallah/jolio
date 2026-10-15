<?php

declare(strict_types=1);

namespace Src\Profile\Presentation\Http\Controllers;

use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;
use Src\Profile\Application\Commands\UpdateProfileCommand;
use Src\Profile\Application\Commands\UpdateProfileHandler;
use Src\Profile\Presentation\Http\Requests\UpdateProfileRequest;
use Src\Profile\Presentation\Http\Resources\ProfileResource;
use Src\Shared\Domain\ValueObjects\Ulid;
use Symfony\Component\HttpFoundation\Response;

#[OA\Put(
    path: '/api/profile',
    operationId: 'updateProfile',
    summary: 'Create or replace the caller\'s candidate profile',
    tags: ['Profile'],
    security: [['sanctum' => []]],
    requestBody: new OA\RequestBody(
        required: true,
        description: 'Per-step partial document: only the named step section is validated, the rest merges with the stored profile.',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'current_step', type: 'string', nullable: true, enum: ['contact', 'headline', 'skills', 'experience', 'education', 'languages', 'review']),
                new OA\Property(
                    property: 'contact',
                    type: 'object',
                    required: ['full_name'],
                    properties: [
                        new OA\Property(property: 'full_name', type: 'string', maxLength: 120, example: 'Alex Dev'),
                        new OA\Property(property: 'email', type: 'string', format: 'email'),
                        new OA\Property(property: 'phone', type: 'string'),
                        new OA\Property(property: 'city', type: 'string'),
                        new OA\Property(property: 'country', type: 'string'),
                        new OA\Property(property: 'website', type: 'string'),
                    ],
                ),
                new OA\Property(property: 'headline', type: 'string', maxLength: 140, nullable: true),
                new OA\Property(property: 'summary', type: 'string', maxLength: 2000, nullable: true),
                new OA\Property(property: 'skills', type: 'array', nullable: true, items: new OA\Items(type: 'object')),
                new OA\Property(property: 'experience', type: 'array', nullable: true, items: new OA\Items(type: 'object')),
                new OA\Property(property: 'education', type: 'array', nullable: true, items: new OA\Items(type: 'object')),
                new OA\Property(property: 'languages', type: 'array', nullable: true, items: new OA\Items(type: 'object')),
            ],
        ),
    ),
    responses: [
        new OA\Response(
            response: 200,
            description: 'Profile stored',
            content: new OA\JsonContent(
                required: ['data'],
                properties: [
                    new OA\Property(
                        property: 'data',
                        type: 'object',
                        required: ['profile'],
                        properties: [
                            new OA\Property(property: 'profile', ref: '#/components/schemas/ProfileResponse'),
                        ],
                    ),
                ],
            )
        ),
        new OA\Response(response: 401, description: 'Unauthenticated', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 403, description: 'Not the profile owner', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 429, description: 'Too many requests'),
    ],
)]
/**
 * Replace the caller's candidate profile (SPECS FR-4, US-201).
 *
 * Owner-only by construction: the user id comes from the Sanctum
 * token and the request passes ProfilePolicy on existing rows, so a
 * 200 here always means "your profile was stored".
 */
final class UpdateProfileController
{
    public function __construct(private readonly UpdateProfileHandler $handler) {}

    public function __invoke(UpdateProfileRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $profile = $this->handler->handle(new UpdateProfileCommand(
            userId: Ulid::fromString((string) $request->user()->getAuthIdentifier()),
            contact: $validated['contact'] ?? null,
            headline: $validated['headline'] ?? null,
            summary: $validated['summary'] ?? null,
            skills: $validated['skills'] ?? null,
            experience: $validated['experience'] ?? null,
            education: $validated['education'] ?? null,
            languages: $validated['languages'] ?? null,
            currentStep: $validated['current_step'] ?? null,
        ));

        return response()->json([
            'data' => ['profile' => new ProfileResource($profile)],
        ], Response::HTTP_OK);
    }
}
