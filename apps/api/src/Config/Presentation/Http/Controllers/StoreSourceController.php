<?php

declare(strict_types=1);

namespace Src\Config\Presentation\Http\Controllers;

use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;
use Src\Config\Application\Commands\CreateSourceCommand;
use Src\Config\Application\Commands\CreateSourceHandler;
use Src\Config\Presentation\Http\Requests\StoreSourceRequest;
use Src\Config\Presentation\Http\Resources\SourceResource;
use Src\Shared\Domain\ValueObjects\Ulid;
use Symfony\Component\HttpFoundation\Response;

#[OA\Post(
    path: '/api/v1/sources',
    operationId: 'storeSource',
    summary: 'Add a registry entry',
    tags: ['Sources'],
    security: [['sanctum' => []]],
    requestBody: new OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['name', 'url', 'type', 'priority', 'country_code', 'is_enabled'],
            properties: [
                new OA\Property(property: 'name', type: 'string', maxLength: 120, example: 'Arbeitnow'),
                new OA\Property(property: 'url', type: 'string', format: 'uri', example: 'https://www.arbeitnow.com/api/job-board-api'),
                new OA\Property(property: 'type', type: 'string', enum: ['search_engine', 'board', 'ats', 'career_page'], example: 'search_engine'),
                new OA\Property(property: 'priority', type: 'string', enum: ['T1', 'T2', 'T3'], example: 'T2'),
                new OA\Property(property: 'country_code', type: 'string', example: 'GLOBAL'),
                new OA\Property(property: 'is_enabled', type: 'boolean', example: true),
            ],
        ),
    ),
    responses: [
        new OA\Response(response: 201, description: 'Source created', content: new OA\JsonContent(ref: '#/components/schemas/SourceResponse')),
        new OA\Response(response: 401, description: 'Unauthenticated', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 409, description: 'Name or URL already registered', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 429, description: 'Too many requests'),
    ],
)]
/**
 * Add one entry to the caller's registry (SPECS FR-39, US-302).
 *
 * Thin by rule: the validated body becomes a command, the handler
 * owns validation-to-domain promotion, uniqueness, and persistence.
 */
final class StoreSourceController
{
    public function __construct(private readonly CreateSourceHandler $handler) {}

    public function __invoke(StoreSourceRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $source = $this->handler->handle(new CreateSourceCommand(
            userId: Ulid::fromString((string) $request->user()->getAuthIdentifier()),
            name: $validated['name'],
            url: $validated['url'],
            type: $validated['type'],
            priority: $validated['priority'],
            countryCode: $validated['country_code'],
            isEnabled: (bool) $validated['is_enabled'],
        ));

        return response()->json(
            ['data' => ['source' => new SourceResource($source)]],
            Response::HTTP_CREATED,
        );
    }
}
