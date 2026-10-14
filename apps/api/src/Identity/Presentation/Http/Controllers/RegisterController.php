<?php

declare(strict_types=1);

namespace Src\Identity\Presentation\Http\Controllers;

use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;
use Src\Identity\Application\Commands\RegisterWithCredentialsCommand;
use Src\Identity\Application\Commands\RegisterWithCredentialsHandler;
use Src\Identity\Presentation\Http\Requests\RegisterRequest;
use Src\Identity\Presentation\Http\Resources\UserResource;
use Symfony\Component\HttpFoundation\Response;

#[OA\Post(
    path: '/api/v1/auth/register',
    operationId: 'registerWithCredentials',
    summary: 'Register with email and password',
    tags: ['Auth'],
    requestBody: new OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['display_name', 'email', 'password', 'password_confirmation'],
            properties: [
                new OA\Property(property: 'display_name', type: 'string', maxLength: 255, example: 'Alex Dev'),
                new OA\Property(property: 'email', type: 'string', format: 'email', example: 'alex@dev.internal'),
                new OA\Property(property: 'password', type: 'string', format: 'password', minLength: 8, example: 's3cret-pass'),
                new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', example: 's3cret-pass'),
            ],
        ),
    ),
    responses: [
        new OA\Response(response: 201, description: 'Registered', content: new OA\JsonContent(ref: '#/components/schemas/AuthResponse')),
        new OA\Response(response: 409, description: 'Email taken', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 429, description: 'Too many requests'),
    ],
)]
/**
 * Register a local-credential account and sign it in (SPECS FR-1).
 */
final class RegisterController
{
    public function __construct(private readonly RegisterWithCredentialsHandler $handler) {}

    public function __invoke(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $result = $this->handler->handle(new RegisterWithCredentialsCommand(
            displayName: $validated['display_name'],
            email: $validated['email'],
            password: $validated['password'],
            deviceName: $request->userAgent() ?? 'unknown',
        ));

        return response()->json([
            'data' => [
                'user' => new UserResource($result->user),
                'token' => $result->token,
            ],
        ], Response::HTTP_CREATED);
    }
}
