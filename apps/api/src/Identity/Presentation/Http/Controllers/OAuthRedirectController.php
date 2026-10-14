<?php

declare(strict_types=1);

namespace Src\Identity\Presentation\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use OpenApi\Attributes as OA;
use Src\Identity\Application\Services\OAuthUserGateway;
use Src\Identity\Domain\Enums\AuthProvider;
use Src\Identity\Presentation\Http\Requests\OAuthProviderRequest;

#[OA\Get(
    path: '/api/v1/auth/{provider}/redirect',
    operationId: 'oauthRedirect',
    summary: 'Start the OAuth handshake at the provider',
    tags: ['Auth'],
    parameters: [
        new OA\Parameter(name: 'provider', in: 'path', required: true, schema: new OA\Schema(type: 'string', enum: ['google'])),
    ],
    responses: [
        new OA\Response(response: 302, description: 'Redirect to the provider'),
        new OA\Response(response: 422, description: 'Unsupported provider', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 429, description: 'Too many requests'),
        new OA\Response(response: 503, description: 'OAuth not configured', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
    ],
)]
/**
 * Redirect the browser to the OAuth provider (server code flow entry).
 */
final class OAuthRedirectController
{
    public function __construct(private readonly OAuthUserGateway $gateway) {}

    public function __invoke(OAuthProviderRequest $request): RedirectResponse
    {
        $provider = AuthProvider::from($request->validated()['provider']);

        return redirect()->away($this->gateway->redirectUrl($provider));
    }
}
