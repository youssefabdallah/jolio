<?php

declare(strict_types=1);

namespace Src\Identity\Presentation\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Src\Identity\Domain\Repositories\UserRepository;
use Src\Identity\Presentation\Http\Resources\UserResource;
use Src\Shared\Domain\ValueObjects\Ulid;
use Symfony\Component\HttpFoundation\Response;

#[OA\Get(
    path: '/api/user',
    operationId: 'currentUser',
    summary: 'Current session user',
    tags: ['Auth'],
    security: [['sanctum' => []]],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Signed in',
            content: new OA\JsonContent(
                required: ['id', 'display_name', 'email', 'provider'],
                properties: [
                    new OA\Property(property: 'id', type: 'string', example: '01JABCD1234EFGH5678JKLMNP'),
                    new OA\Property(property: 'display_name', type: 'string', example: 'Alex Dev'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'alex@dev.internal'),
                    new OA\Property(property: 'provider', type: 'string', enum: ['local', 'google'], example: 'google'),
                    new OA\Property(property: 'avatar_url', type: 'string', nullable: true),
                ],
            )
        ),
        new OA\Response(response: 401, description: 'Unauthenticated', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
    ],
)]
/**
 * Session lookup for the SPA shell and its auth gate. Returns the public
 * user schema (id, display name, email, provider, avatar) — never the
 * raw model, so provider ids and timestamps stay server-side.
 */
final class MeController
{
    public function __construct(private readonly UserRepository $users) {}

    public function __invoke(Request $request): JsonResponse
    {
        $user = $this->users->findById(Ulid::fromString((string) $request->user()->id));

        abort_unless($user !== null, Response::HTTP_UNAUTHORIZED);

        return response()->json(new UserResource($user), Response::HTTP_OK);
    }
}
