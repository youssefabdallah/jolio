<?php

declare(strict_types=1);

namespace Src\Config\Presentation\Http\Controllers;

use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;
use Src\Config\Application\Queries\ListSourcesHandler;
use Src\Config\Application\Queries\ListSourcesQuery;
use Src\Config\Presentation\Http\Requests\ListSourcesRequest;
use Src\Config\Presentation\Http\Resources\SourceResource;
use Src\Shared\Domain\ValueObjects\Ulid;
use Symfony\Component\HttpFoundation\Response;

#[OA\Get(
    path: '/api/v1/sources',
    operationId: 'listSources',
    summary: 'List the caller\'s registry entries',
    tags: ['Sources'],
    security: [['sanctum' => []]],
    parameters: [
        new OA\Parameter(name: 'type', description: 'Filter by source type', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['search_engine', 'board', 'ats', 'career_page'])),
        new OA\Parameter(name: 'is_enabled', description: 'Filter by enabled flag', in: 'query', required: false, schema: new OA\Schema(type: 'boolean')),
        new OA\Parameter(name: 'search', description: 'Match against name and URL', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
        new OA\Parameter(name: 'per_page', description: 'Page size (1-100)', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 50)),
    ],
    responses: [
        new OA\Response(response: 200, description: 'Paginated registry', content: new OA\JsonContent(ref: '#/components/schemas/SourceListResponse')),
        new OA\Response(response: 401, description: 'Unauthenticated', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 429, description: 'Too many requests'),
    ],
)]
/**
 * Paginated registry read (Stitch table + filter tabs + search box).
 *
 * Owner-scoped by construction: the user id comes from the Sanctum
 * token, so a 200 here only ever lists the caller's own entries.
 */
final class ListSourcesController
{
    public function __construct(private readonly ListSourcesHandler $handler) {}

    public function __invoke(ListSourcesRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $paginator = $this->handler->handle(new ListSourcesQuery(
            userId: Ulid::fromString((string) $request->user()->getAuthIdentifier()),
            type: $validated['type'] ?? null,
            isEnabled: array_key_exists('is_enabled', $validated) ? (bool) $validated['is_enabled'] : null,
            search: $validated['search'] ?? null,
            perPage: (int) ($validated['per_page'] ?? 50),
        ));

        return SourceResource::collection($paginator)->response()->setStatusCode(Response::HTTP_OK);
    }
}
