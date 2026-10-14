<?php

declare(strict_types=1);

namespace Src\Identity\Presentation\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Post(
    path: '/api/v1/auth/logout',
    operationId: 'logout',
    summary: 'Revoke the current API token',
    tags: ['Auth'],
    security: [['sanctum' => []]],
    responses: [
        new OA\Response(response: 204, description: 'Token revoked'),
        new OA\Response(response: 401, description: 'Unauthenticated', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
    ],
)]
/**
 * Sign out by revoking the token used for this request. Other sessions
 * issued to the same user stay valid.
 */
final class LogoutController
{
    public function __invoke(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(null, 204);
    }
}
