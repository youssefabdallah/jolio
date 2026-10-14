<?php

declare(strict_types=1);

namespace Src\Identity\Presentation\Http\Controllers;

use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;
use Src\Identity\Application\Commands\LoginWithCredentialsCommand;
use Src\Identity\Application\Commands\LoginWithCredentialsHandler;
use Src\Identity\Presentation\Http\Requests\LoginRequest;
use Src\Identity\Presentation\Http\Resources\UserResource;
use Symfony\Component\HttpFoundation\Response;

#[OA\Post(
    path: '/api/v1/auth/login',
    operationId: 'loginWithCredentials',
    summary: 'Sign in with email and password',
    tags: ['Auth'],
    requestBody: new OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['email', 'password'],
            properties: [
                new OA\Property(property: 'email', type: 'string', format: 'email', example: 'alex@dev.internal'),
                new OA\Property(property: 'password', type: 'string', format: 'password', example: 's3cret-pass'),
            ],
        ),
    ),
    responses: [
        new OA\Response(response: 200, description: 'Signed in', content: new OA\JsonContent(ref: '#/components/schemas/AuthResponse')),
        new OA\Response(response: 401, description: 'Invalid credentials', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 429, description: 'Too many requests'),
    ],
)]
/**
 * Sign in with a local credential (SPECS FR-1). Returns 200: signing in
 * creates nothing, so 201 would be dishonest.
 */
final class LoginController
{
    public function __construct(private readonly LoginWithCredentialsHandler $handler) {}

    public function __invoke(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $result = $this->handler->handle(new LoginWithCredentialsCommand(
            email: $validated['email'],
            password: $validated['password'],
            deviceName: $request->userAgent() ?? 'unknown',
        ));

        return response()->json([
            'data' => [
                'user' => new UserResource($result->user),
                'token' => $result->token,
            ],
        ], Response::HTTP_OK);
    }
}
