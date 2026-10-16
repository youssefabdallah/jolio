<?php

declare(strict_types=1);

namespace Src\Config\Presentation\Http\Controllers;

use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;
use Src\Config\Application\Queries\GetSourceHandler;
use Src\Config\Application\Queries\GetSourceQuery;
use Src\Config\Presentation\Http\Requests\ShowSourceRequest;
use Src\Config\Presentation\Http\Resources\SourceResource;
use Src\Shared\Domain\ValueObjects\Ulid;
use Symfony\Component\HttpFoundation\Response;

#[OA\Get(
    path: '/api/v1/sources/{source}',
    operationId: 'showSource',
    summary: 'Read one registry entry',
    tags: ['Sources'],
    security: [['sanctum' => []]],
    parameters: [
        new OA\Parameter(name: 'source', description: 'Source ULID', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
    ],
    responses: [
        new OA\Response(response: 200, description: 'Source found', content: new OA\JsonContent(ref: '#/components/schemas/SourceResponse')),
        new OA\Response(response: 401, description: 'Unauthenticated', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 403, description: 'Not the source owner', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 404, description: 'Source not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 429, description: 'Too many requests'),
    ],
)]
/**
 * Owner-scoped single read (SPECS FR-39, US-302).
 *
 * The request carries no body: BaseSourceRequest only resolves the
 * route id and answers 404 for malformed ULIDs.
 */
final class ShowSourceController
{
    public function __construct(private readonly GetSourceHandler $handler) {}

    public function __invoke(ShowSourceRequest $request): JsonResponse
    {
        $source = $this->handler->handle(new GetSourceQuery(
            id: $request->sourceId(),
            userId: Ulid::fromString((string) $request->user()->getAuthIdentifier()),
        ));

        return response()->json(
            ['data' => ['source' => new SourceResource($source)]],
            Response::HTTP_OK,
        );
    }
}
