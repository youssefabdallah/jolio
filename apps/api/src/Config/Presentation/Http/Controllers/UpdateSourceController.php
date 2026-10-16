<?php

declare(strict_types=1);

namespace Src\Config\Presentation\Http\Controllers;

use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;
use Src\Config\Application\Commands\UpdateSourceCommand;
use Src\Config\Application\Commands\UpdateSourceHandler;
use Src\Config\Presentation\Http\Requests\UpdateSourceRequest;
use Src\Config\Presentation\Http\Resources\SourceResource;
use Src\Shared\Domain\ValueObjects\Ulid;
use Symfony\Component\HttpFoundation\Response;

#[OA\Put(
    path: '/api/v1/sources/{source}',
    operationId: 'updateSource',
    summary: 'Replace a registry entry',
    tags: ['Sources'],
    security: [['sanctum' => []]],
    parameters: [
        new OA\Parameter(name: 'source', description: 'Source ULID', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
    ],
    requestBody: new OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['name', 'url', 'type', 'priority', 'country_code', 'is_enabled'],
            properties: [
                new OA\Property(property: 'name', type: 'string', maxLength: 120, example: 'Arbeitnow'),
                new OA\Property(property: 'url', type: 'string', format: 'uri', example: 'https://www.arbeitnow.com/api/job-board-api'),
                new OA\Property(property: 'type', type: 'string', enum: ['search_engine', 'board', 'ats', 'career_page'], example: 'search_engine'),
                new OA\Property(property: 'priority', type: 'string', enum: ['T1', 'T2', 'T3'], example: 'T2'),
                new OA\Property(property: 'country_code', type: 'string', example: 'DE'),
                new OA\Property(property: 'is_enabled', type: 'boolean', example: true),
            ],
        ),
    ),
    responses: [
        new OA\Response(response: 200, description: 'Source replaced', content: new OA\JsonContent(ref: '#/components/schemas/SourceResponse')),
        new OA\Response(response: 401, description: 'Unauthenticated', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 403, description: 'Not the source owner', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 404, description: 'Source not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 409, description: 'Name or URL already registered', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 429, description: 'Too many requests'),
    ],
)]
/**
 * Full-document replacement of one owned entry (Stitch "Save source").
 */
final class UpdateSourceController
{
    public function __construct(private readonly UpdateSourceHandler $handler) {}

    public function __invoke(UpdateSourceRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $source = $this->handler->handle(new UpdateSourceCommand(
            id: $request->sourceId(),
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
            Response::HTTP_OK,
        );
    }
}
