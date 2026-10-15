<?php

declare(strict_types=1);

namespace Src\Profile\Presentation\Http\Controllers;

use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;
use Src\Profile\Domain\Repositories\ProfileRepository;
use Src\Profile\Presentation\Http\Resources\ProfileResource;
use Src\Shared\Domain\ValueObjects\Ulid;
use Symfony\Component\HttpFoundation\Response;

#[OA\Get(
    path: '/api/profile',
    operationId: 'showProfile',
    summary: 'Read the caller\'s candidate profile',
    tags: ['Profile'],
    security: [['sanctum' => []]],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Profile or empty',
            content: new OA\JsonContent(
                required: ['data'],
                properties: [
                    new OA\Property(property: 'data', ref: '#/components/schemas/ProfileResponse', nullable: true),
                ],
            )
        ),
        new OA\Response(response: 401, description: 'Unauthenticated', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
    ],
)]
/**
 * Session-scoped profile read (SPECS FR-4, US-201).
 *
 * Looks up by the token's user id, so callers can only ever read
 * their own row. Missing profiles answer 200 with null data — the
 * editor renders a blank form instead of an error page.
 */
final class ShowProfileController
{
    public function __construct(private readonly ProfileRepository $profiles) {}

    public function __invoke(): JsonResponse
    {
        $userId = Ulid::fromString((string) auth()->id());

        $profile = $this->profiles->findByUserId($userId);

        return response()->json(
            ['data' => $profile === null ? null : new ProfileResource($profile)],
            Response::HTTP_OK,
        );
    }
}
