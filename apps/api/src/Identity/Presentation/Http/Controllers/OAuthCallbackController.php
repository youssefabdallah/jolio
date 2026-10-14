<?php

declare(strict_types=1);

namespace Src\Identity\Presentation\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use OpenApi\Attributes as OA;
use Src\Identity\Application\Commands\HandleOAuthCallbackCommand;
use Src\Identity\Application\Commands\HandleOAuthCallbackHandler;
use Src\Identity\Domain\Enums\AuthProvider;
use Src\Identity\Presentation\Http\Requests\OAuthProviderRequest;
use Src\Shared\Domain\Exceptions\DomainException;

#[OA\Get(
    path: '/api/v1/auth/{provider}/callback',
    operationId: 'oauthCallback',
    summary: 'Complete the OAuth handshake and sign in',
    description: 'Exchanges the provider code, finds-or-creates the user, and redirects to the SPA with a fresh token in the URL fragment (fragments never reach servers or logs). Known failures (e.g. email already taken) redirect instead with an error code fragment the SPA maps to its own copy.',
    tags: ['Auth'],
    parameters: [
        new OA\Parameter(name: 'provider', in: 'path', required: true, schema: new OA\Schema(type: 'string', enum: ['google'])),
        new OA\Parameter(name: 'code', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
    ],
    responses: [
        new OA\Response(response: 302, description: 'Redirect to the SPA with the token'),
        new OA\Response(response: 422, description: 'Unsupported provider', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        new OA\Response(response: 429, description: 'Too many requests'),
        new OA\Response(response: 502, description: 'Provider handshake failed', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
    ],
)]
/**
 * Provider callback: sign in (creating the user on first sight) then hand
 * the browser back to the SPA with a fresh Sanctum token.
 */
final class OAuthCallbackController
{
    public function __construct(private readonly HandleOAuthCallbackHandler $handler) {}

    public function __invoke(OAuthProviderRequest $request): RedirectResponse
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');

        try {
            $result = $this->handler->handle(new HandleOAuthCallbackCommand(
                provider: AuthProvider::from($request->validated()['provider']),
                deviceName: $request->userAgent() ?? 'unknown',
            ));
        } catch (DomainException $exception) {
            // Presentation-layer error mapping (redirect twin of the central
            // JSON renderer): the browser is mid-navigation, so failures
            // travel back as an error code fragment — never raw JSON, never
            // sensitive data. The SPA maps the code to its own copy.
            return redirect()->away(
                $frontend.'/auth/callback#'.http_build_query(['error' => $exception->errorCode->value]),
            );
        }

        return redirect()->away(
            $frontend.'/auth/callback#'.http_build_query(['token' => $result->token]),
        );
    }
}
