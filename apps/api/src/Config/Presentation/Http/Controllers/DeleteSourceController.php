<?php

declare(strict_types=1);

namespace Src\Config\Presentation\Http\Controllers;

use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;
use Src\Config\Application\Commands\DeleteSourceCommand;
use Src\Config\Application\Commands\DeleteSourceHandler;
use Src\Config\Presentation\Http\Requests\DeleteSourceRequest;
use Src\Shared\Domain\ValueObjects\Ulid;
use Symfony\Component\HttpFoundation\Response;

#[OA\Delete(
    path: '/api/v1/sources/{source}',
    operationId: 'deleteSource',
    summary: 'Delete a registry entry',
    tags: ['Sources'],
    security: [['sanctum' => []]],
    parameters: [
        new OA\Parameter(name: 'source', description: 'Source ULID', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
    ],
    responses: [
        new OA\Response(response: 204, description: 'Source deleted'),
        new OA\Response(response: 401, description: 'Unauthenticated', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 403, description: 'Not the source owner', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 404, description: 'Source not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 429, description: 'Too many requests'),
    ],
)]
/**
 * Hard-delete one owned entry (Stitch "Delete source").
 */
final class DeleteSourceController
{
    public function __construct(private readonly DeleteSourceHandler $handler) {}

    public function __invoke(DeleteSourceRequest $request): JsonResponse
    {
        $this->handler->handle(new DeleteSourceCommand(
            id: $request->sourceId(),
            userId: Ulid::fromString((string) $request->user()->getAuthIdentifier()),
        ));

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
